/**
 * Synthesise the sound-effect set.
 *
 * The reference channels land roughly one audible hit per second, and we had
 * literally none — measurably the largest single reason our footage reads as
 * inert. These are generated rather than sourced: no licence to track, nothing
 * to attribute, byte-identical on every machine, and free.
 *
 * They are deliberately papery rather than synthetic. A sci-fi whoosh over
 * Madhubani line art would be worse than silence.
 *
 *   node tools/make-sfx.mjs
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const run = promisify(execFile);
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const OUT = path.resolve('assets/sfx');

/** Each entry is a complete filtergraph producing one mono 48k hit. */
const SFX = {
  // paper sliding into place — a filtered noise swell, not a jet
  'paper-in': {
    dur: 0.42,
    graph: `anoisesrc=d=0.42:c=pink:a=0.9,`
         + `highpass=f=420,lowpass=f=5200,`
         + `volume='min(1,t*7)*exp(-t*5.2)':eval=frame,`
         + `aformat=channel_layouts=mono`,
  },
  // the same, falling away
  'paper-out': {
    dur: 0.36,
    graph: `anoisesrc=d=0.36:c=pink:a=0.8,`
         + `highpass=f=300,lowpass=f=3800,`
         + `volume='exp(-t*7.5)':eval=frame,`
         + `aformat=channel_layouts=mono`,
  },
  // a card landing on paper: low body + a short rustle on top
  'thud': {
    dur: 0.30,
    graph: `sine=f=104:d=0.3,volume='exp(-t*16)':eval=frame[a];`
         + `anoisesrc=d=0.3:c=brown:a=0.6,lowpass=f=900,volume='exp(-t*22)':eval=frame[b];`
         + `[a][b]amix=inputs=2:normalize=0,aformat=channel_layouts=mono`,
  },
  // something heavier arriving — used for reveals
  'impact': {
    dur: 0.55,
    graph: `sine=f=62:d=0.55,volume='exp(-t*7)':eval=frame[a];`
         + `anoisesrc=d=0.55:c=brown:a=0.75,lowpass=f=1400,volume='exp(-t*13)':eval=frame[b];`
         + `[a][b]amix=inputs=2:normalize=0,aformat=channel_layouts=mono`,
  },
  // a small dry click for ticks, counts, list items
  'tick': {
    dur: 0.07,
    graph: `anoisesrc=d=0.07:c=white:a=0.55,`
         + `highpass=f=1800,lowpass=f=8000,`
         + `volume='exp(-t*70)':eval=frame,`
         + `aformat=channel_layouts=mono`,
  },
  // pen touching paper — pairs with drawOn
  'ink': {
    dur: 0.9,
    graph: `anoisesrc=d=0.9:c=pink:a=0.34,`
         + `highpass=f=1100,lowpass=f=7000,`
         + `tremolo=f=19:d=0.7,`
         + `volume='min(1,t*12)*min(1,(0.9-t)*7)':eval=frame,`
         + `aformat=channel_layouts=mono`,
  },
  // a soft bright accent for a correct placement
  'chime': {
    dur: 0.8,
    graph: `sine=f=1046:d=0.8,volume='exp(-t*5)':eval=frame[a];`
         + `sine=f=1568:d=0.8,volume='exp(-t*7)*0.5':eval=frame[b];`
         + `[a][b]amix=inputs=2:normalize=0,aformat=channel_layouts=mono`,
  },
  // tension under a question the viewer is meant to sit with
  'riser': {
    dur: 1.4,
    // highpass cannot take a time-varying f, so the sweep is a chirp from
    // aevalsrc with a noise layer over it rather than a swept filter
    graph: `aevalsrc='0.45*sin(2*PI*(190+260*t)*t)':d=1.4:s=48000,`
         + `volume='min(1,t*1.4)*min(1,(1.4-t)*4)':eval=frame[a];`
         + `anoisesrc=d=1.4:c=pink:a=0.3,highpass=f=900,`
         + `volume='min(1,t*1.1)*min(1,(1.4-t)*4)*0.7':eval=frame[b];`
         + `[a][b]amix=inputs=2:normalize=0,aformat=channel_layouts=mono`,
  },
};

await mkdir(OUT, { recursive: true });

for (const [name, { graph }] of Object.entries(SFX)) {
  const out = path.join(OUT, `${name}.wav`);
  await run(FFMPEG, [
    '-y', '-v', 'error',
    // loudnorm has to live inside the graph: ffmpeg refuses -af on a stream
    // that is already fed from a complex filtergraph. Headroom matters here,
    // these are mixed under narration and never heard alone.
    '-filter_complex', `${graph},loudnorm=I=-20:TP=-3:LRA=7`,
    '-ar', '48000', '-ac', '1', out,
  ]);
  console.log(`  ${name.padEnd(11)} -> assets/sfx/${name}.wav`);
}

console.log(`\n${Object.keys(SFX).length} effects written. Regenerate any time; they are deterministic.`);
