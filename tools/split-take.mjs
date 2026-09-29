#!/usr/bin/env node
/**
 * Split one continuous recording into per-line files.
 *
 *   node tools/split-take.mjs vastu-disha ~/Desktop/take1.m4a
 *   node tools/split-take.mjs vastu-disha take1.m4a --min-silence=1.0 --threshold=-38
 *
 * Nobody wants to record sixty separate files. Record one take with a clear
 * pause between lines; this finds the pauses and cuts on them.
 *
 * If the segment count does not match the line count it tells you and stops,
 * rather than silently mapping the wrong audio to the wrong line.
 */
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectScript } from '../engine/chapters.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FFMPEG = process.env.FFMPEG || 'ffmpeg';

const run = (c, a) => new Promise((res, rej) => {
  const p = spawn(c, a, { stdio: ['ignore', 'pipe', 'pipe'] });
  let out = '', err = '';
  p.stdout.on('data', d => (out += d)); p.stderr.on('data', d => (err += d));
  p.on('close', k => (k === 0 ? res({ out, err }) : rej(new Error(err.slice(-900)))));
  p.on('error', rej);
});

const epName = process.argv[2];
const take = process.argv[3];
if (!epName || !take) {
  console.error('usage: node tools/split-take.mjs <episode> <recording> [--min-silence=1.0] [--threshold=-38]');
  process.exit(1);
}
const arg = (k, d) => parseFloat(process.argv.find(a => a.startsWith(`--${k}=`))?.split('=')[1] ?? d);
const minSilence = arg('min-silence', 0.9);
const threshold = arg('threshold', -38);
const pad = arg('pad', 0.12);          // keep a little breath either side

const takePath = path.resolve(take);
if (!existsSync(takePath)) { console.error(`no such file: ${takePath}`); process.exit(1); }

const ep = (await import(path.join(ROOT, 'episodes', epName, 'episode.js'))).default;
const lines = collectScript(ep);
const outDir = path.join(ROOT, 'episodes', epName, 'voice');
await mkdir(outDir, { recursive: true });

const { err } = await run(FFMPEG, ['-i', takePath, '-af',
  `silencedetect=noise=${threshold}dB:d=${minSilence}`, '-f', 'null', '-']);

const total = parseFloat((err.match(/time=(\d+):(\d+):([\d.]+)/g) || []).slice(-1)[0]
  ?.match(/time=(\d+):(\d+):([\d.]+)/)?.slice(1).reduce((a, v, i) => a + parseFloat(v) * [3600, 60, 1][i], 0) ?? 0);

const starts = [...err.matchAll(/silence_start:\s*([\d.]+)/g)].map(m => parseFloat(m[1]));
const ends = [...err.matchAll(/silence_end:\s*([\d.]+)/g)].map(m => parseFloat(m[1]));

// Speech runs from the end of one silence to the start of the next.
const segments = [];
let cur = ends.length && (!starts.length || ends[0] < starts[0]) ? ends[0] : 0;
for (const s of starts) {
  if (s > cur + 0.25) segments.push([cur, s]);
  const nextEnd = ends.find(e => e > s);
  if (nextEnd === undefined) { cur = null; break; }
  cur = nextEnd;
}
if (cur !== null && total && total > cur + 0.25) segments.push([cur, total]);

console.log(`\n[split] ${path.basename(takePath)}  ${total.toFixed(1)}s`);
console.log(`[split] found ${segments.length} speech segments, script has ${lines.length} lines\n`);
segments.forEach(([a, b], i) => {
  const l = lines[i];
  console.log(`  ${String(i + 1).padStart(2)}  ${a.toFixed(2)}–${b.toFixed(2)}s  (${(b - a).toFixed(2)}s)  ` +
              `${l ? `[${l.id}] ${l.text.slice(0, 44)}` : '— no matching line —'}`);
});

if (segments.length !== lines.length) {
  console.error(`\n[split] MISMATCH: ${segments.length} segments vs ${lines.length} lines. Nothing written.

  too many segments -> you paused mid-line. Raise --min-silence (try 1.2)
  too few segments  -> pauses too short or too quiet. Lower --min-silence (0.6),
                       or raise --threshold toward -30 if the room is noisy.
`);
  process.exit(1);
}

for (let i = 0; i < lines.length; i++) {
  const [a, b] = segments[i];
  const out = path.join(outDir, `${lines[i].id}.wav`);
  await run(FFMPEG, ['-y', '-v', 'error', '-i', takePath,
    '-ss', String(Math.max(0, a - pad)), '-to', String(b + pad),
    '-ac', '1', '-ar', '48000', out]);
}
console.log(`\n[split] wrote ${lines.length} files -> episodes/${epName}/voice/`);
console.log(`[split] next:  node engine/tts.mjs ${epName} --engine=manual\n`);
