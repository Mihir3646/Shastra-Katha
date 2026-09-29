#!/usr/bin/env node
/**
 * Unified narration step. Two engines, identical outputs:
 *
 *   kokoro   local, free, unlimited          -> voice/tts.py
 *   gemini   Gemini 3 TTS via Vercel AI Gateway, billed per second of audio
 *
 * Both produce lines/<id>.wav, narration.wav and timings.json, so everything
 * downstream (chapters, captions, Shorts) is unaffected by which one ran.
 *
 * Gemini output is CACHED BY CONTENT. Editing one line of a sixty-line script
 * re-synthesises that line only. Without this you pay full price for every
 * revision, which is what makes per-second billing expensive in practice.
 */
import { spawn } from 'node:child_process';
import { mkdir, writeFile, readFile, readdir, stat, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const FFPROBE = process.env.FFPROBE || 'ffprobe';

// Google bills audio at 25 tokens per second; gateway prices are per token.
export class TtsBillingError extends Error {
  constructor(m) { super(m); this.name = 'TtsBillingError'; }
}

export class ManualVoiceError extends Error {
  constructor(m) { super(m); this.name = 'ManualVoiceError'; }
}

const TOKENS_PER_SECOND = 25;
export const TTS_PRICING = {
  'google/gemini-3.8-flash-tts': 0.000009,
  'google/gemini-3.8-flash-lite-tts': 0.000006,
  'openai/gpt-audio': 0.000032,
  'openai/gpt-audio-mini': 0.0000006,
};

/** OpenAI voices reachable through OpenRouter. All English-first. */
export const OPENROUTER_VOICES = {
  onyx: 'deep male - closest to a documentary read',
  ash: 'warm male',
  echo: 'even male',
  alloy: 'neutral',
  sage: 'calm',
  ballad: 'expressive',
  shimmer: 'light female',
  coral: 'warm female',
};

/** A few of Gemini's prebuilt voices. Full list in Google's TTS docs. */
export const GEMINI_VOICES = {
  Charon: 'deep, informative — the documentary default',
  Kore: 'firm, even',
  Orus: 'warm, steady',
  Puck: 'bright, upbeat',
  Zephyr: 'light, airy',
  Leda: 'youthful',
  Aoede: 'breezy',
  Fenrir: 'excitable',
};

function run(cmd, args, opts = {}) {
  return new Promise((res, rej) => {
    const p = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], ...opts });
    let out = '', err = '';
    p.stdout?.on('data', d => (out += d));
    p.stderr?.on('data', d => (err += d));
    p.on('close', c => (c === 0 ? res({ out, err }) : rej(new Error(`${cmd} ${c}: ${err.slice(-800)}`))));
    p.on('error', rej);
  });
}

const dur = async f => parseFloat(
  (await run(FFPROBE, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f])).out.trim()
);

/** Estimate the bill before spending it. ~13.5 chars/sec is typical narration. */
export function estimateCost(lines, model, { charsPerSecond = 13.5, usdInr = 88 } = {}) {
  const chars = lines.reduce((n, l) => n + l.text.length, 0);
  const seconds = chars / charsPerSecond;
  const rate = TTS_PRICING[model] ?? TTS_PRICING['google/gemini-3.8-flash-tts'];
  const usd = seconds * TOKENS_PER_SECOND * rate;
  return { chars, seconds, usd, inr: usd * usdInr };
}

const cacheKey = (text, o) =>
  createHash('sha256').update(JSON.stringify([o.model, o.voice, o.instructions ?? '', text])).digest('hex').slice(0, 20);

async function synthGemini(text, opts, cacheDir) {
  const key = cacheKey(text, opts);
  const cached = path.join(cacheDir, `${key}.wav`);
  if (existsSync(cached)) return { file: cached, cached: true };

  const { experimental_generateSpeech: generateSpeech } = await import('ai');
  const { gateway } = await import('@ai-sdk/gateway');

  let res;
  try {
    res = await generateSpeech({
      model: gateway.speechModel(opts.model),
      text,
      voice: opts.voice,
      ...(opts.instructions ? { instructions: opts.instructions } : {}),
    });
  } catch (e) {
    const msg = String(e?.message ?? e);
    // The gateway reports both billing walls as 403s with distinct wording.
    if (/free tier|paid credits|top-up/i.test(msg)) {
      throw new TtsBillingError(
        'Gemini TTS needs PAID CREDITS on Vercel — a card alone is not enough.\n' +
        '        Free-tier keys are refused for this model.\n\n' +
        '        Top up:  https://vercel.com/dashboard  ->  AI Gateway  ->  Credits\n' +
        '        Or draft for free meanwhile:  --engine=kokoro'
      );
    }
    if (/credit card|verification/i.test(msg)) {
      throw new TtsBillingError(
        'Vercel AI Gateway needs a card on file before it serves any request.\n' +
        '        Or draft for free meanwhile:  --engine=kokoro'
      );
    }
    if (/auth|invalid api key/i.test(msg)) {
      throw new TtsBillingError('AI_GATEWAY_API_KEY was rejected. Check .env.local.');
    }
    throw e;
  }

  const bytes = res.audio?.uint8Array ?? res.audio?.data;
  if (!bytes?.length) throw new Error('no audio returned');

  const raw = path.join(cacheDir, `${key}.raw`);
  await writeFile(raw, Buffer.from(bytes));
  // Normalise whatever came back into 24k mono wav so both engines match.
  await run(FFMPEG, ['-y', '-v', 'error', '-i', raw, '-ac', '1', '-ar', '24000', cached]);
  return { file: cached, cached: false };
}

/** Trim leading/trailing silence so the `gap` values in the script mean something. */
async function trim(src, dst) {
  await run(FFMPEG, ['-y', '-v', 'error', '-i', src,
    '-af', 'silenceremove=start_periods=1:start_silence=0.03:start_threshold=-50dB:detection=peak,' +
           'areverse,silenceremove=start_periods=1:start_silence=0.03:start_threshold=-50dB:detection=peak,areverse',
    '-ac', '1', '-ar', '24000', dst]);
}


const VOICE_EXTS = ['.wav', '.aiff', '.aif', '.m4a', '.mp3', '.flac', '.caf'];

/**
 * Human voice. You record; the pipeline measures.
 *
 * Put one file per narration line in episodes/<ep>/voice/<lineId>.<ext> — or
 * record a single take and split it with tools/split-take.mjs first.
 *
 * Cleanup is deliberately gentle. Aggressive gating kills the breath between
 * phrases, and breath is the whole reason to use a real voice.
 */
async function synthManual(epDir, script, opts = {}) {
  const meta = script.meta ?? {};
  const voice = script.voice ?? {};
  const lines = script.script ?? [];
  const srcDir = path.join(epDir, 'voice');
  const linesDir = path.join(epDir, 'lines');
  await mkdir(linesDir, { recursive: true });

  if (!existsSync(srcDir)) {
    throw new ManualVoiceError(
      `no recordings found at ${path.relative(ROOT, srcDir)}\n` +
      `        1. node tools/read-sheet.mjs ${path.basename(epDir)}   # what to read\n` +
      `        2. record, then drop one file per line in voice/ as <lineId>.wav\n` +
      `           (or record one take and run tools/split-take.mjs)`);
  }

  const have = await readdir(srcDir);
  const find = id => {
    for (const e of VOICE_EXTS) {
      const hit = have.find(f => f.toLowerCase() === (id + e).toLowerCase());
      if (hit) return path.join(srcDir, hit);
    }
    return null;
  };

  const missing = lines.filter(l => !find(l.id)).map(l => l.id);
  if (missing.length) {
    throw new ManualVoiceError(
      `missing recordings for: ${missing.join(', ')}\n` +
      `        expected in ${path.relative(ROOT, srcDir)}/ as <lineId>.wav`);
  }

  // Gentle chain: rumble out, a touch of denoise, soft levelling. Nothing that
  // would flatten the delivery.
  const clean = voice.clean ?? {};
  const chain = [
    `highpass=f=${clean.highpass ?? 80}`,                 // room rumble, mic handling
    clean.denoise === false ? null : `afftdn=nr=${clean.denoise ?? 10}:nt=w`,
    `compand=attacks=0.02:decays=0.25:points=-70/-70|-30/-18|-12/-9|0/-7`,
    `loudnorm=I=-19:TP=-2:LRA=13`,                        // per line; final mix normalises again
  ].filter(Boolean).join(',');

  console.error(`[voice] manual  ${lines.length} lines from ${path.relative(ROOT, srcDir)}/`);

  const timings = {};
  const parts = [];
  let cursor = Number(meta.leadIn ?? 0.6);
  if (cursor > 0) parts.push({ silence: cursor });

  for (const l of lines) {
    const src = find(l.id);
    const out = path.join(linesDir, `${l.id}.wav`);
    // trim only true silence at the very ends, keeping a breath of padding
    await run(FFMPEG, ['-y', '-v', 'error', '-i', src,
      '-af', `${chain},silenceremove=start_periods=1:start_silence=0.12:start_threshold=-46dB:detection=peak,` +
             `areverse,silenceremove=start_periods=1:start_silence=0.20:start_threshold=-46dB:detection=peak,areverse`,
      '-ac', '1', '-ar', '48000', out]);
    const d = await dur(out);
    timings[l.id] = { start: +cursor.toFixed(4), dur: +d.toFixed(4), end: +(cursor + d).toFixed(4) };
    parts.push({ file: out });
    const gap = Number(l.gap ?? voice.gap ?? 0.28);
    if (gap > 0) parts.push({ silence: gap });
    cursor += d + gap;
    console.error(`[voice]   ${l.id.padEnd(6)} ${d.toFixed(2)}s  ${path.basename(src)}`);
  }

  const tail = Number(meta.tailOut ?? 0.8);
  if (tail > 0) parts.push({ silence: tail });

  await assemble(parts, epDir, 48000);
  await writeFile(path.join(epDir, 'timings.json'), JSON.stringify(timings, null, 2));
  console.error(`[voice] narration.wav  ${cursor.toFixed(2)}s`);
  return { engine: 'manual', cost: { usd: 0, inr: 0 } };
}

/** Concat line files and silences into narration.wav. Shared by both engines. */
async function assemble(parts, epDir, rate = 24000) {
  const silDir = path.join(ROOT, '.cache', 'sil');
  await mkdir(silDir, { recursive: true });
  const rows = [];
  for (const p of parts) {
    if (p.file) { rows.push(`file '${p.file.replace(/'/g, "'\\''")}'`); continue; }
    const sf = path.join(silDir, `sil_${rate}_${p.silence.toFixed(3)}.wav`);
    if (!existsSync(sf)) {
      await run(FFMPEG, ['-y', '-v', 'error', '-f', 'lavfi',
        '-i', `anullsrc=r=${rate}:cl=mono`, '-t', String(p.silence), sf]);
    }
    rows.push(`file '${sf.replace(/'/g, "'\\''")}'`);
  }
  const lf = path.join(epDir, '.concat.txt');
  await writeFile(lf, rows.join('\n'));
  await run(FFMPEG, ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', lf,
    '-af', 'loudnorm=I=-18:TP=-2:LRA=11', '-ac', '1', '-ar', String(rate),
    path.join(epDir, 'narration.wav')]);
}


/**
 * OpenRouter -> openai/gpt-audio(-mini).
 *
 * These are conversational audio models, not narrators: given text they will
 * happily *reply* to it. The system prompt forces a verbatim read-aloud. They
 * are also English-first voices, so an anglicised Hindi accent is the thing
 * being tested here, not a bug in this code.
 */
async function synthOpenRouter(epDir, script, opts = {}) {
  const meta = script.meta ?? {};
  const voice = script.voice ?? {};
  const lines = script.script ?? [];
  const model = opts.model ?? voice.model ?? 'openai/gpt-audio-mini';
  const ovoice = opts.voice ?? voice.orVoice ?? 'onyx';
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new TtsBillingError('OPENROUTER_API_KEY is not set (put it in .env.local)');

  const style = voice.instructions ??
    'Read as a calm documentary narrator: unhurried, warm, never salesy.';
  const system = 'You are a text-to-speech engine. Speak the user message aloud VERBATIM, in the ' +
    'language it is written in. Never translate it, never answer it, never greet, never add or omit ' +
    'a single word. ' + style;

  const cacheDir = path.join(ROOT, '.cache', 'tts');
  const linesDir = path.join(epDir, 'lines');
  await mkdir(cacheDir, { recursive: true });
  await mkdir(linesDir, { recursive: true });

  console.error(`[tts] openrouter  ${model}  voice=${ovoice}  ${lines.length} lines`);

  const timings = {};
  const parts = [];
  let cursor = Number(meta.leadIn ?? 0.6);
  if (cursor > 0) parts.push({ silence: cursor });
  let fresh = 0, reused = 0, audioTokens = 0;

  for (const l of lines) {
    const hash = createHash('sha256')
      .update(JSON.stringify([model, ovoice, system, l.text])).digest('hex').slice(0, 20);
    const cached = path.join(cacheDir, `or_${hash}.wav`);
    const wasCached = existsSync(cached);

    if (!wasCached) {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          model,
          modalities: ['text', 'audio'],
          audio: { voice: ovoice, format: 'wav' },
          messages: [{ role: 'system', content: system }, { role: 'user', content: l.text }],
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (json?.error) {
        const m = json.error.message ?? 'request failed';
        if (/balance|credit/i.test(m) || res.status === 402) {
          throw new TtsBillingError(
            `OpenRouter needs credits before it returns audio.\n        ${m}\n\n` +
            `        Add credits: https://openrouter.ai/settings/credits  (minimum $0.50)\n` +
            `        Or record it yourself for free:  --engine=manual`);
        }
        throw new Error(`openrouter: ${m}`);
      }
      const b64 = json?.choices?.[0]?.message?.audio?.data;
      if (!b64) throw new Error(`openrouter returned no audio: ${JSON.stringify(json).slice(0, 300)}`);
      const raw = path.join(cacheDir, `or_${hash}.raw`);
      await writeFile(raw, Buffer.from(b64, 'base64'));
      await run(FFMPEG, ['-y', '-v', 'error', '-i', raw, '-ac', '1', '-ar', '24000', cached]);
      audioTokens += json?.usage?.completion_tokens_details?.audio_tokens
        ?? json?.usage?.completion_tokens ?? 0;
      fresh++;
    } else reused++;

    const out = path.join(linesDir, `${l.id}.wav`);
    await run(FFMPEG, ['-y', '-v', 'error', '-i', cached,
      '-af', 'silenceremove=start_periods=1:start_silence=0.04:start_threshold=-50dB:detection=peak,' +
             'areverse,silenceremove=start_periods=1:start_silence=0.06:start_threshold=-50dB:detection=peak,areverse',
      '-ac', '1', '-ar', '24000', out]);
    const d = await dur(out);
    timings[l.id] = { start: +cursor.toFixed(4), dur: +d.toFixed(4), end: +(cursor + d).toFixed(4) };
    parts.push({ file: out });
    const gap = Number(l.gap ?? voice.gap ?? 0.28);
    if (gap > 0) parts.push({ silence: gap });
    cursor += d + gap;
    console.error(`[tts]   ${l.id.padEnd(6)} ${d.toFixed(2)}s ${wasCached ? '(cached)' : '        '} ${l.text.slice(0, 44)}`);
  }

  const tail = Number(meta.tailOut ?? 0.8);
  if (tail > 0) parts.push({ silence: tail });
  await assemble(parts, epDir, 24000);
  await writeFile(path.join(epDir, 'timings.json'), JSON.stringify(timings, null, 2));

  const usd = audioTokens * (TTS_PRICING[model] ?? 0);
  console.error(`[tts] ${fresh} synthesised, ${reused} cached`);
  console.error(`[tts] ~${audioTokens} audio tokens  =  $${usd.toFixed(4)}  ~Rs ${(usd * 88).toFixed(2)}`);
  return { engine: 'openrouter', model, cost: { usd, inr: usd * 88, fresh, reused } };
}

export async function synthesise(epDir, script, opts = {}) {
  const meta = script.meta ?? {};
  const voice = script.voice ?? {};
  const engine = opts.engine ?? voice.engine ?? 'kokoro';
  const lines = script.script ?? [];

  if (engine === 'kokoro') {
    const py = path.join(ROOT, 'voice/.venv/bin/python');
    if (!existsSync(py)) throw new Error(`voice env missing at ${py} — run tools/setup.sh`);
    await run(py, [path.join(ROOT, 'voice/tts.py'),
      '--script', path.join(epDir, 'script.json'), '--out', epDir],
      { stdio: ['ignore', 'pipe', 'inherit'],
        // torch/HF emit deprecation noise on every call; it drowns the real log
        env: { ...process.env, PYTHONWARNINGS: 'ignore', HF_HUB_DISABLE_PROGRESS_BARS: '1', TRANSFORMERS_VERBOSITY: 'error' } });
    return { engine: 'kokoro', cost: { usd: 0, inr: 0 } };
  }

  if (engine === 'parler') {
    // AI4Bharat Indic Parler — the channel voice. Its own venv: parler-tts pins
    // transformers 4.46.1, which collides with every other engine here.
    const py = path.join(ROOT, 'voice/.venv-parler/bin/python');
    if (!existsSync(py)) throw new Error(`parler env missing at ${py} — see README`);
    const a = [path.join(ROOT, 'voice/parler.py'), '--script', path.join(epDir, 'script.json'), '--out', epDir];
    if (opts.voice) a.push('--voice', opts.voice);
    await run(py, a, { stdio: ['ignore', 'pipe', 'inherit'],
      env: { ...process.env, PYTHONWARNINGS: 'ignore', TRANSFORMERS_VERBOSITY: 'error', HF_HUB_DISABLE_PROGRESS_BARS: '1' } });
    return { engine: 'parler', cost: { usd: 0, inr: 0 } };
  }
  if (engine === 'manual') return synthManual(epDir, script, opts);
  if (engine === 'openrouter') return synthOpenRouter(epDir, script, opts);

  // --- Gemini -------------------------------------------------------------
  const model = opts.model ?? voice.model ?? 'google/gemini-3.8-flash-tts';
  const gvoice = opts.voice ?? voice.geminiVoice ?? voice.voice ?? 'Charon';
  const instructions = voice.instructions ?? null;

  if (!process.env.AI_GATEWAY_API_KEY) {
    throw new Error('AI_GATEWAY_API_KEY is not set (put it in .env.local)');
  }

  const cacheDir = path.join(ROOT, '.cache', 'tts');
  const linesDir = path.join(epDir, 'lines');
  await mkdir(cacheDir, { recursive: true });
  await mkdir(linesDir, { recursive: true });

  const est = estimateCost(lines, model);
  console.error(`[tts] gemini  ${model}  voice=${gvoice}  ${lines.length} lines`);
  console.error(`[tts] estimate before cache: ~${est.seconds.toFixed(0)}s audio, ~Rs ${est.inr.toFixed(2)}`);

  const timings = {};
  const parts = [];
  let cursor = Number(meta.leadIn ?? 0.6);
  let fresh = 0, reused = 0, billedSeconds = 0;

  if (cursor > 0) parts.push({ silence: cursor });

  for (const l of lines) {
    const lopts = { model, voice: l.voice ?? gvoice, instructions: l.instructions ?? instructions };
    const { file, cached } = await synthGemini(l.text, lopts, cacheDir);
    cached ? reused++ : fresh++;

    const out = path.join(linesDir, `${l.id}.wav`);
    await trim(file, out);
    const d = await dur(out);
    if (!cached) billedSeconds += await dur(file);

    timings[l.id] = { start: +cursor.toFixed(4), dur: +d.toFixed(4), end: +(cursor + d).toFixed(4) };
    parts.push({ file: out });

    const gap = Number(l.gap ?? voice.gap ?? 0.28);
    if (gap > 0) parts.push({ silence: gap });
    cursor += d + gap;
    console.error(`[tts]   ${l.id.padEnd(6)} ${d.toFixed(2)}s ${cached ? '(cached)' : '        '} ${l.text.slice(0, 46)}`);
  }

  const tail = Number(meta.tailOut ?? 0.8);
  if (tail > 0) parts.push({ silence: tail });

  // Assemble: concat the line files with silence between them.
  const listFile = path.join(epDir, '.concat.txt');
  const silenceDir = path.join(cacheDir, 'sil');
  await mkdir(silenceDir, { recursive: true });
  const rows = [];
  for (const p of parts) {
    if (p.file) { rows.push(`file '${p.file.replace(/'/g, "'\\''")}'`); continue; }
    const sf = path.join(silenceDir, `sil_${p.silence.toFixed(3)}.wav`);
    if (!existsSync(sf)) {
      await run(FFMPEG, ['-y', '-v', 'error', '-f', 'lavfi',
        '-i', `anullsrc=r=24000:cl=mono`, '-t', String(p.silence), sf]);
    }
    rows.push(`file '${sf.replace(/'/g, "'\\''")}'`);
  }
  await writeFile(listFile, rows.join('\n'));
  await run(FFMPEG, ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', listFile,
    '-af', 'loudnorm=I=-18:TP=-2:LRA=11', '-ac', '1', '-ar', '24000',
    path.join(epDir, 'narration.wav')]);

  await writeFile(path.join(epDir, 'timings.json'), JSON.stringify(timings, null, 2));

  const rate = TTS_PRICING[model];
  const usd = billedSeconds * TOKENS_PER_SECOND * rate;
  console.error(`[tts] ${fresh} synthesised, ${reused} from cache`);
  console.error(`[tts] billed ~${billedSeconds.toFixed(1)}s  =  $${usd.toFixed(4)}  ~Rs ${(usd * 88).toFixed(2)}`);

  return { engine: 'gemini', model, cost: { usd, inr: usd * 88, billedSeconds, fresh, reused } };
}

// CLI: node engine/tts.mjs <episode> [--engine=gemini] [--voice=Charon] [--estimate]
if (import.meta.url === `file://${process.argv[1]}`) {
  for (const f of ['.env.local', '.env']) {
    const p = path.join(ROOT, f);
    if (!existsSync(p)) continue;
    for (const line of (await readFile(p, 'utf8')).split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
  const epName = process.argv[2];
  const arg = k => process.argv.find(a => a.startsWith(`--${k}=`))?.split('=')[1];
  const epDir = path.join(ROOT, 'episodes', epName);
  const mod = await import(path.join(epDir, 'episode.js'));
  const ep = mod.default;
  const { collectScript } = await import('./chapters.js');
  const script = { meta: ep.meta ?? {}, voice: ep.voice ?? {}, script: collectScript(ep) };
  await writeFile(path.join(epDir, 'script.json'), JSON.stringify(script, null, 2));

  if (process.argv.includes('--estimate')) {
    const model = arg('model') ?? script.voice.model ?? 'google/gemini-3.8-flash-tts';
    for (const m of Object.keys(TTS_PRICING)) {
      const e = estimateCost(script.script, m);
      console.log(`${m.padEnd(36)} ~${e.seconds.toFixed(0)}s  $${e.usd.toFixed(4)}  Rs ${e.inr.toFixed(2)}${m === model ? '   <- selected' : ''}`);
    }
    process.exit(0);
  }
  try {
    await synthesise(epDir, script, {
      engine: arg('engine') ?? script.voice.engine, voice: arg('voice'), model: arg('model'),
    });
  } catch (e) {
    if (e instanceof TtsBillingError) { console.error(`\n[tts] ${e.message}\n`); process.exit(2); }
    if (e instanceof ManualVoiceError) { console.error(`\n[voice] ${e.message}\n`); process.exit(2); }
    throw e;
  }
}
