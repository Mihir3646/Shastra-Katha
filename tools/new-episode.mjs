#!/usr/bin/env node
/**
 * Scaffold a new episode:  npm run new -- my-episode-name
 * Copies the skeleton, not the demo — you get a clean 4-scene starting point.
 */
import { mkdir, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const name = process.argv[2];
if (!name || !/^[a-z0-9][a-z0-9-]*$/.test(name)) {
  console.error('usage: npm run new -- <episode-name>   (lowercase, hyphens)');
  process.exit(1);
}
const dir = path.join(ROOT, 'episodes', name);
try { await access(dir); console.error(`episodes/${name} already exists`); process.exit(1); } catch {}

const TEMPLATE = `/**
 * ${name}
 *
 *   npm run preview -- ${name}     scrub in a browser
 *   npm run build   -- ${name}     voice + frames + mix
 *
 * Write the narration first. The animation is timed off the MEASURED length of
 * each spoken line, so \`at('l2')\` is exactly when line l2 starts talking.
 */
import { Motion } from '../../engine/stage.js';
import { tearWipe, fade } from '../../engine/transitions.js';
import {
  PALETTE, disc, sunburst, mandala, lotus, diya, hillRange, stars, moon, cloud,
  smoke, meditator, temple, wheel, vastuGrid, figure, ransom, text, label,
  sticky, confetti, arrow, bubble,
} from '../../engine/kit.js';

const P = PALETTE;

export default {
  meta: {
    preset: 'shorts',        // shorts | landscape | square  (config/presets.json)
    bg: '#E9E0CB',
    leadIn: 0.7,
    tailOut: 1.2,
    boil: { enabled: true, fps: 8, pos: 1.1, rot: 0.2 },
  },

  voice: {
    engine: 'parler',            // AI4Bharat Indic Parler - free, local, Hindi-native
    parlerVoice: 'aman-deep',    // voice/parler.py --list-voices
    gap: 0.34,
  },

  captions: { enabled: true, style: 'outline', position: 0.845, size: 58, wrapAt: 24 },

  music: { file: 'assets/music/bed.mp3', gain: 0.2 },

  script: [
    { id: 'l1', text: 'Open on the hook. One sentence.', gap: 0.4 },
    { id: 'l2', text: 'Then the turn — what the viewer did not expect.' },
    { id: 'l3', text: 'Then the payoff they can use today.' },
  ],

  build({ stage, tl, at, end, dur }) {
    const W = stage.width, H = stage.height, CX = W / 2;

    stage.scene({
      name: 'open',
      from: 0,
      to: end('l1') + 0.3,
      build() {
        const burst = stage.add({
          id: 'burst', svg: sunburst(1200, { rays: 28, fill: '#D8C79F', opacity: 0.45, inner: 60 }),
          x: CX, y: 800, layer: 1, opacity: 0, boil: false,
        });
        Motion.spin(tl, burst, { rpm: 0.5 });
        tl.fromTo(burst, { opacity: [0, 1] }, { at: 0.15, dur: 1, ease: 'outCubic' });

        const r = ransom('YOUR TITLE', { size: 96, seed: '${name}' });
        const title = stage.add({ id: 'title', svg: r.markup, x: CX, y: 760, layer: 6, opacity: 0, shadow: 'cut-shadow' });
        tl.fromTo(title, { opacity: [0, 1], scale: [0.84, 1], y: [810, 760] },
          { at: 0.3, dur: 0.7, ease: 'outBack' });

        fade(stage, { at: 0, dur: 0.7, to: 'in' });
      },
    });

    tearWipe(stage, { at: at('l2') - 0.75, color: '#DCCFB0', dir: 'up', seed: 'w1' });

    stage.scene({
      name: 'turn',
      from: at('l2') - 0.5,
      to: end('l2') + 0.3,
      build() {
        stage.add({
          id: 'turn-bg', svg: \`<rect width="\${W}" height="\${H}" fill="#DCCFB0"/>\`,
          x: 0, y: 0, layer: 0, boil: false,
        });
        const m = stage.add({
          id: 'turn-art', svg: mandala(260, { rings: 4, petals: 14 }),
          x: CX, y: 900, layer: 4, scale: 0, shadow: 'cut-shadow',
        });
        tl.fromTo(m, { scale: [0, 1], rot: [-30, 0] }, { at: at('l2') - 0.3, dur: 0.6, ease: 'outBack' });
        Motion.spin(tl, m, { rpm: 0.3, at: at('l2') + 0.4 });
      },
    });

    tearWipe(stage, { at: at('l3') - 0.75, color: '#F2E7C9', dir: 'up', seed: 'w2' });

    stage.scene({
      name: 'payoff',
      from: at('l3') - 0.5,
      to: end('l3') + 1.2,
      build() {
        stage.add({
          id: 'pay-bg', svg: \`<rect width="\${W}" height="\${H}" fill="#F2E7C9"/>\`,
          x: 0, y: 0, layer: 0, boil: false,
        });
        const me = stage.add({
          id: 'me', svg: meditator(1.5, { aura: P.gold }),
          x: CX, y: 1100, layer: 5, scale: 0, shadow: 'cut-shadow',
        });
        tl.fromTo(me, { scale: [0.4, 1.5], opacity: [0, 1] }, { at: at('l3') - 0.3, dur: 0.7, ease: 'outBack' });
        Motion.sway(tl, me, { amp: 0.8, period: 4, at: at('l3') + 0.5 });

        fade(stage, { at: end('l3') + 0.5, dur: 0.7, to: 'out' });
      },
    });
  },
};
`;

await mkdir(dir, { recursive: true });
await writeFile(path.join(dir, 'episode.js'), TEMPLATE);
console.log(`created episodes/${name}/episode.js

  npm run preview -- ${name}
  npm run build   -- ${name}
`);
