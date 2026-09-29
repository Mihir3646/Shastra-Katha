#!/usr/bin/env node
/**
 * One-command episode build:
 *
 *   script.json -> Kokoro TTS -> timings.json + narration.wav
 *               -> deterministic frame render (Playwright)
 *               -> music bed ducked under the voice
 *               -> final .mp4 + .srt
 *
 * Everything runs locally. No API keys, no per-minute pricing.
 */
import { mkdir, writeFile, readFile, access } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { render, run } from './render.mjs';
import { collectScript, chapterWindows, chapterList } from './chapters.js';
import { synthesise } from './tts.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const FFPROBE = process.env.FFPROBE || 'ffprobe';
const PY = path.join(ROOT, 'voice/.venv/bin/python');

function parseArgs(argv) {
  const a = {
    episode: null, skipVoice: false, skipRender: false, draft: false,
    jobs: 0, music: null, musicGain: null, preset: null, captions: false, crf: 17,
    short: null, engine: null, voiceName: null, ttsModel: null,
  };
  for (let i = 2; i < argv.length; i++) {
    const t = argv[i];
    if (!t.startsWith('--')) { a.episode ??= t; continue; }
    const [k, v] = t.slice(2).split('=');
    const map = { 'skip-voice': 'skipVoice', 'skip-render': 'skipRender', 'music-gain': 'musicGain',
                  'voice': 'voiceName', 'tts-model': 'ttsModel' };
    const key = map[k] ?? k;
    if (v === undefined) a[key] = true;
    else if (['jobs', 'crf'].includes(key)) a[key] = parseInt(v, 10);
    else if (key === 'musicGain') a[key] = parseFloat(v);
    else a[key] = v;
  }
  return a;
}

const fmtTime = s => {
  const ms = Math.round((s % 1) * 1000);
  const t = Math.floor(s);
  return `${String(Math.floor(t / 3600)).padStart(2, '0')}:${String(Math.floor(t / 60) % 60).padStart(2, '0')}:${String(t % 60).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
};

/** Wrap a caption to roughly `cols` characters so it fits a vertical frame. */
function wrap(str, cols) {
  const words = String(str).split(/\s+/);
  const out = [];
  let line = '';
  for (const w of words) {
    if (line && (line + ' ' + w).length > cols) { out.push(line); line = w; }
    else line = line ? line + ' ' + w : w;
  }
  if (line) out.push(line);
  return out;
}

const assTime = s => {
  const cs = Math.round((s % 1) * 100);
  const t = Math.floor(s);
  return `${Math.floor(t / 3600)}:${String(Math.floor(t / 60) % 60).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
};

/**
 * Styled captions as ASS rather than SRT + force_style: the styling travels
 * inside the file, so nothing has to survive ffmpeg's filter escaping.
 */
function toAss(lines, timings, { width, height, style = {} }) {
  const vertical = height > width;
  const size = style.fontSize ?? (vertical ? 62 : 46);
  const cols = style.wrapAt ?? (vertical ? 24 : 42);
  const marginV = style.marginV ?? (vertical ? 300 : 90);
  const font = style.font ?? 'Avenir Next';
  const header = [
    '[Script Info]',
    'ScriptType: v4.00+',
    `PlayResX: ${width}`,
    `PlayResY: ${height}`,
    'WrapStyle: 2',
    'ScaledBorderAndShadow: yes',
    '',
    '[V4+ Styles]',
    'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
    // &HAABBGGRR — white fill, near-black outline, soft shadow
    `Style: Default,${font},${size},&H00FFFFFF,&H000000FF,&H00241C14,&H8C241C14,-1,0,0,0,100,100,0,0,1,${style.outline ?? 5},${style.shadow ?? 2},2,70,70,${marginV},1`,
    '',
    '[Events]',
    'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
  ].join('\n');

  const events = lines.map(l => {
    const t = timings[l.id];
    if (!t) return null;
    const txt = wrap(l.caption ?? l.text, cols).join('\\N');
    return `Dialogue: 0,${assTime(t.start)},${assTime(t.end)},Default,,0,0,0,,${txt}`;
  }).filter(Boolean);

  return header + '\n' + events.join('\n') + '\n';
}

function toSrt(lines, timings) {
  return lines.map((l, i) => {
    const t = timings[l.id];
    if (!t) return null;
    return `${i + 1}\n${fmtTime(t.start)} --> ${fmtTime(t.end)}\n${l.caption ?? l.text}\n`;
  }).filter(Boolean).join('\n');
}

const narrationPath = epDir => path.join(epDir, 'narration.wav');

async function probeSize(file) {
  const { out } = await run(FFPROBE, ['-v', 'error', '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height', '-of', 'csv=p=0', file]);
  const [w, h] = out.trim().split(',').map(Number);
  return { width: w, height: h };
}

async function probeDuration(file) {
  const { out } = await run(FFPROBE, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]);
  return parseFloat(out.trim());
}

async function main() {
  const a = parseArgs(process.argv);
  if (!a.episode) {
    console.error('usage: node engine/build.mjs <episode> [--draft] [--skip-voice] [--skip-render] [--music=path] [--jobs=N] [--captions]');
    process.exit(1);
  }

  const epDir = path.join(ROOT, 'episodes', a.episode);
  if (!existsSync(epDir)) { console.error(`no such episode: ${epDir}`); process.exit(1); }

  const outDir = path.join(ROOT, 'out', a.episode);
  await mkdir(outDir, { recursive: true });

  // 1. Pull script + voice config out of the episode module ------------------
  const mod = await import(path.join(epDir, 'episode.js'));
  const ep = mod.default;
  const scriptJson = {
    meta: ep.meta ?? {},
    voice: ep.voice ?? {},
    script: collectScript(ep).map(l => ({ ...l })),
  };
  await writeFile(path.join(epDir, 'script.json'), JSON.stringify(scriptJson, null, 2));
  console.log(`[build] ${a.episode}: ${scriptJson.script.length} narration lines`);

  // 2. Voice -----------------------------------------------------------------
  const timingsPath = path.join(epDir, 'timings.json');
  if (!a.skipVoice && scriptJson.script.length) {
    const res = await synthesise(epDir, scriptJson, { engine: a.engine, voice: a.voiceName, model: a.ttsModel });
    if (res.cost?.inr) console.log(`[build] narration cost: Rs ${res.cost.inr.toFixed(2)}`);
  } else {
    console.log('[build] skipping voice');
  }

  let timings = {};
  try { timings = JSON.parse(await readFile(timingsPath, 'utf8')); } catch {}

  // 2b. Chapters: YouTube timestamps, and the Shorts cut points ---------------
  const windows = chapterWindows(ep, timings, { lead: 0.45, tail: 0.3 });
  if (Object.keys(windows).length) {
    const list = chapterList(windows, ep);
    await writeFile(path.join(outDir, 'chapters.txt'), list + '\n');
    console.log(`[build] ${Object.keys(windows).length} chapters -> out/${a.episode}/chapters.txt`);
  }

  // A Short is not a crop of the wide video — it is the same chapter RE-RENDERED
  // vertically from the same code. That is only possible because the animation
  // is a program, and it is why these read as native verticals.
  if (a.short) {
    const w = windows[a.short];
    if (!w) {
      console.error(`[build] no chapter "${a.short}". available: ${Object.keys(windows).join(', ') || '(none)'}`);
      process.exit(1);
    }
    const shortOut = path.join(outDir, `short-${a.short}.mp4`);
    const silent = path.join(outDir, `short-${a.short}-silent.mp4`);
    console.log(`[build] short "${a.short}" — ${w.start.toFixed(2)}s to ${w.end.toFixed(2)}s (${(w.end - w.start).toFixed(1)}s)`);
    await render({
      episode: a.episode, draft: a.draft, jobs: a.jobs,
      preset: a.preset ?? 'shorts', out: silent, crf: a.crf,
      from: w.start, to: w.end,
    });
    if (existsSync(narrationPath(epDir))) {
      const seg = path.join(outDir, `short-${a.short}.wav`);
      await run(FFMPEG, ['-y', '-v', 'error', '-i', narrationPath(epDir),
        '-ss', String(w.start), '-to', String(w.end),
        '-af', `afade=t=in:st=0:d=0.15,afade=t=out:st=${Math.max(0, w.end - w.start - 0.3).toFixed(2)}:d=0.3,loudnorm=I=-14:TP=-1.5:LRA=11`,
        seg]);
      await run(FFMPEG, ['-y', '-v', 'error', '-i', silent, '-i', seg,
        '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', shortOut]);
    } else {
      await run(FFMPEG, ['-y', '-v', 'error', '-i', silent, '-c', 'copy', shortOut]);
    }
    console.log(`\n[build] ✓ out/${a.episode}/short-${a.short}.mp4`);
    return;
  }

  // 2c. Disclaimer check -----------------------------------------------------
  // Easy to forget, and the one omission with real consequences.
  const readAll = async () => {
    let src = await readFile(path.join(epDir, 'episode.js'), 'utf8').catch(() => '');
    try {
      const { readdir } = await import('node:fs/promises');
      const files = await readdir(path.join(epDir, 'chapters'));
      const parts = await Promise.all(files.map(f => readFile(path.join(epDir, 'chapters', f), 'utf8')));
      src += parts.join('');
    } catch { /* no chapters dir — single-build episode */ }
    return src;
  };
  const anySrc = await readAll();
  if (!/addDisclaimer/.test(anySrc)) {
    console.warn(`[build] WARNING: ${a.episode} has no on-screen disclaimer.`);
    console.warn(`        import { addDisclaimer } from '../../engine/disclaimer.js'`);
    console.warn(`        and call addDisclaimer(stage, { at: <end of last line> }).`);
  }

  // 3. Frames ----------------------------------------------------------------
  const videoFile = path.join(outDir, a.draft ? 'draft-silent.mp4' : 'silent.mp4');
  if (!a.skipRender) {
    await render({
      episode: a.episode, draft: a.draft, jobs: a.jobs,
      preset: a.preset, out: videoFile, crf: a.crf,
    });
  } else if (!existsSync(videoFile)) {
    console.log('[build] skipping render — no existing video to mux, stopping after voice');
    console.log(`[build] ✓ narration + timings written to episodes/${a.episode}/`);
    return;
  } else {
    console.log('[build] skipping render (reusing existing frames)');
  }

  // 4. Audio: narration + ducked music --------------------------------------
  const narration = path.join(epDir, 'narration.wav');
  const hasNarration = existsSync(narration);
  const musicFile = a.music
    ? path.resolve(a.music)
    : (ep.music?.file ? path.resolve(ROOT, ep.music.file) : null);
  const hasMusic = musicFile && existsSync(musicFile);
  if (musicFile && !hasMusic) console.warn(`[build] music not found: ${musicFile} — continuing without it`);

  const videoDur = await probeDuration(videoFile);
  const mixFile = path.join(outDir, 'mix.wav');

  if (hasNarration || hasMusic) {
    const args = ['-y', '-v', 'error'];
    const filters = [];
    let narrLabel = null, musicLabel = null, idx = 0;

    if (hasNarration) {
      args.push('-i', narration);
      filters.push(`[${idx}:a]aresample=48000,apad,atrim=0:${videoDur},aformat=channel_layouts=stereo[narr]`);
      narrLabel = 'narr'; idx++;
    }
    if (hasMusic) {
      const gain = a.musicGain ?? ep.music?.gain ?? 0.13;
      const fadeOut = Math.max(0, videoDur - 2.2);
      args.push('-stream_loop', '-1', '-i', musicFile);
      // Carve the speech band OUT of the music rather than only turning it down.
      // Level alone is not enough: a sustained drone sits right on top of the
      // voice, and at phrase-ends where the voice trails off they converge.
      // Notching 500/1600/3000 Hz gives separation by frequency, which survives
      // the moments where separation by level does not.
      filters.push(
        `[${idx}:a]aresample=48000,atrim=0:${videoDur},aformat=channel_layouts=stereo,` +
        `highpass=f=70,` +
        `equalizer=f=500:width_type=o:width=1.6:g=-5,` +
        `equalizer=f=1600:width_type=o:width=1.8:g=-9,` +
        `equalizer=f=3000:width_type=o:width=1.4:g=-5,` +
        `volume=${gain},afade=t=in:st=0:d=1.2,afade=t=out:st=${fadeOut.toFixed(2)}:d=2.2[music]`
      );
      musicLabel = 'music'; idx++;
    }

    if (narrLabel && musicLabel) {
      // Duck the bed under the voice rather than just turning it down.
      filters.push(`[${narrLabel}]asplit=2[nA][nB]`);
      // Duck harder and hold longer: the previous settings let the bed back up
      // between phrases, which is exactly where it was masking words.
      filters.push(`[${musicLabel}][nB]sidechaincompress=threshold=0.015:ratio=16:attack=8:release=700:makeup=1:detection=rms[duck]`);
      filters.push(`[nA][duck]amix=inputs=2:normalize=0:dropout_transition=0[pre]`);
    } else {
      filters.push(`[${narrLabel ?? musicLabel}]anull[pre]`);
    }
    // YouTube normalises to about -14 LUFS; hand it that and it leaves us alone.
    filters.push(`[pre]loudnorm=I=-14:TP=-1.5:LRA=11[out]`);

    args.push('-filter_complex', filters.join(';'), '-map', '[out]', '-ac', '2', '-ar', '48000', mixFile);
    await run(FFMPEG, args);
    console.log(`[build] audio mixed${hasMusic ? ' (music ducked under voice)' : ''}`);
  }

  // 5. Mux -------------------------------------------------------------------
  const finalFile = path.join(outDir, `${a.episode}${a.draft ? '-draft' : ''}.mp4`);
  if (existsSync(mixFile)) {
    await run(FFMPEG, ['-y', '-v', 'error', '-i', videoFile, '-i', mixFile,
      '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', finalFile]);
  } else {
    await run(FFMPEG, ['-y', '-v', 'error', '-i', videoFile, '-c', 'copy', finalFile]);
  }

  // 6. Subtitles -------------------------------------------------------------
  if (Object.keys(timings).length) {
    const srt = toSrt(scriptJson.script, timings);
    await writeFile(path.join(outDir, `${a.episode}.srt`), srt);
    if (a.captions) {
      console.log('[build] note: captions are drawn by the stage — set `captions: { enabled: true }`');
      console.log('        in the episode instead of passing --captions.');
    }
  }

  const finalDur = await probeDuration(finalFile);
  console.log(`\n[build] ✓ ${path.relative(process.cwd(), finalFile)}  (${finalDur.toFixed(2)}s)`);
}

main().catch(e => { console.error(e); process.exit(1); });
