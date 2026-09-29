#!/usr/bin/env node
/**
 * Hear the same script in several voices, back to back.
 *
 *   node tools/compare-voices.mjs vastu-disha                    all Hindi Kokoro voices
 *   node tools/compare-voices.mjs vastu-disha --voices=Charon,Kore --engine=gemini
 *   node tools/compare-voices.mjs vastu-disha --lines=2
 *
 * Writes one file per voice plus a single stitched comparison track, so the
 * decision is made with your ears on your own script — not from a demo page.
 */
import { spawn } from 'node:child_process';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectScript } from '../engine/chapters.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FFMPEG = process.env.FFMPEG || 'ffmpeg';

for (const f of ['.env.local', '.env']) {
  const p = path.join(ROOT, f);
  if (!existsSync(p)) continue;
  for (const line of (await readFile(p, 'utf8')).split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const run = (c, a, o = {}) => new Promise((res, rej) => {
  const p = spawn(c, a, { stdio: ['ignore', 'pipe', 'pipe'], ...o });
  let err = ''; p.stderr?.on('data', d => (err += d));
  p.on('close', k => (k === 0 ? res() : rej(new Error(`${c} ${k}: ${err.slice(-500)}`))));
  p.on('error', rej);
});

const epName = process.argv[2];
if (!epName) { console.error('usage: node tools/compare-voices.mjs <episode> [--voices=a,b] [--engine=] [--lines=N]'); process.exit(1); }
const arg = k => process.argv.find(a => a.startsWith(`--${k}=`))?.split('=')[1];

const engine = arg('engine') ?? 'kokoro';
const nLines = parseInt(arg('lines') ?? '3', 10);
const DEFAULTS = {
  kokoro:     ['hm_omega', 'hm_psi', 'hf_alpha', 'hf_beta'],
  gemini:     ['Charon', 'Orus', 'Kore', 'Puck'],
  openrouter: ['onyx', 'ash'],      // deepest two; the rest fight the subject
  manual:     ['you'],              // your own recording
};
const voices = (arg('voices') ?? DEFAULTS[engine].join(',')).split(',').map(s => s.trim());

const epDir = path.join(ROOT, 'episodes', epName);
const ep = (await import(path.join(epDir, 'episode.js'))).default;
const lines = collectScript(ep).slice(0, nLines);
const outDir = path.join(ROOT, 'out', epName, 'voice-test');
await mkdir(outDir, { recursive: true });

console.log(`[voices] ${epName}: ${lines.length} lines x ${voices.length} voices (${engine})\n`);
lines.forEach(l => console.log(`  ${l.text}`));
console.log();

const made = [];
for (const v of voices) {
  const tmpDir = path.join(outDir, `.${engine}-${v}`);
  await mkdir(tmpDir, { recursive: true });
  const script = {
    meta: { leadIn: 0.2, tailOut: 0.4 },
    voice:
      engine === 'kokoro'     ? { voice: v, speed: ep.voice?.speed ?? 0.94, gap: 0.3 }
    : engine === 'gemini'     ? { engine: 'gemini', model: ep.voice?.model ?? 'google/gemini-3.8-flash-tts',
                                  geminiVoice: v, instructions: ep.voice?.instructions, gap: 0.3 }
    : engine === 'openrouter' ? { engine: 'openrouter', model: ep.voice?.model ?? 'openai/gpt-audio-mini',
                                  orVoice: v, instructions: ep.voice?.instructions, gap: 0.3 }
    :                           { engine: 'manual', gap: 0.3 },
    script: lines.map(l => ({ id: l.id, text: l.text })),
  };
  await writeFile(path.join(tmpDir, 'script.json'), JSON.stringify(script, null, 2));

  process.stdout.write(`  ${v.padEnd(12)} `);
  try {
    const { synthesise } = await import('../engine/tts.mjs');
    if (engine === 'manual') {
      // your recordings live in the episode folder; point the run at it
      const { cp } = await import('node:fs/promises');
      await cp(path.join(epDir, 'voice'), path.join(tmpDir, 'voice'), { recursive: true });
    }
    await synthesise(tmpDir, script, { engine });
    const dest = path.join(outDir, `${engine}-${v}.wav`);
    await run(FFMPEG, ['-y', '-v', 'error', '-i', path.join(tmpDir, 'narration.wav'),
      '-ar', '44100', '-ac', '1', dest]);
    made.push({ v, file: dest });
    console.log('ok');
  } catch (e) {
    console.log(`FAILED — ${String(e.message).split('\n')[0]}`);
  }
}

if (made.length > 1) {
  // Stitch with a 1s gap so you can tell where one voice ends and the next starts.
  const sil = path.join(outDir, '.gap.wav');
  await run(FFMPEG, ['-y', '-v', 'error', '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=mono', '-t', '1.0', sil]);
  const rows = [];
  for (const m of made) { rows.push(`file '${m.file}'`); rows.push(`file '${sil}'`); }
  const lf = path.join(outDir, '.list.txt');
  await writeFile(lf, rows.join('\n'));
  const combined = path.join(outDir, `compare-${engine}.wav`);
  await run(FFMPEG, ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', lf, '-c', 'copy', combined]);
  console.log(`\n[voices] order: ${made.map(m => m.v).join(' -> ')}`);
  console.log(`[voices] ${path.relative(ROOT, combined)}`);
}
