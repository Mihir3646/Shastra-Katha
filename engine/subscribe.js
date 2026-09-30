/**
 * A short mid-video subscribe beat.
 *
 * Deliberately brief — about 2.5 seconds, tucked into a natural pause rather
 * than interrupting a sentence. A long pitch mid-video costs more retention
 * than it earns subscribers.
 */
import { MB, mbCard, mbBand, mbDisc, ink } from './madhubani.js';
import { text } from './kit.js';
import { Motion } from './stage.js';

export function addSubscribe(stage, opts = {}) {
  const { at = 0, hold = 2.4, label = 'चैनल से जुड़ें', layer = 880 } = opts;
  const W = stage.width, H = stage.height, CX = W / 2;
  const tl = stage.tl;
  const portrait = H > W;
  const y = portrait ? H * 0.2 : H * 0.14;
  const end = at + hold;
  const win = [at - 0.05, end + 0.7];

  // a small bell, tilting as if rung
  const bell = stage.add({
    id: `sub-bell-${at.toFixed(1)}`,
    svg: ink('M 0 -26 q -22 6, -22 30 l -6 12 h 56 l -6 -12 q 0 -24, -22 -30 Z', MB.ochre, { sw: 4 })
       + ink('M -7 18 q 7 12, 14 0 Z', MB.deepRed, { sw: 3 })
       + `<circle cy="-30" r="5" fill="${MB.ink}"/>`,
    x: CX - (portrait ? 150 : 210), y, layer: layer + 1, scale: 0, boil: false, window: win,
  });
  tl.fromTo(bell, { scale: [0, 1], rot: [-30, 0] }, { at, dur: 0.3, ease: 'outBack' });
  tl.drive(bell, (l, g, s) => { s.rot = Math.sin((g - at) * 14) * 13 * Math.max(0, 1 - (g - at) / 1.1); },
    { at: at + 0.3, dur: 1.2 });

  const card = stage.add({
    id: `sub-card-${at.toFixed(1)}`,
    svg: mbCard(portrait ? 420 : 500, portrait ? 92 : 100, MB.deepRed, { pattern: 'hatch', sw: 5, seed: 'sub' })
       + text(label, { size: portrait ? 40 : 44, font: 'var(--font-deva)', fill: MB.cream }),
    x: CX + (portrait ? 40 : 60), y, layer: layer + 1, scale: 0, shadow: 'cut-shadow', window: win,
  });
  tl.fromTo(card, { scale: [0.4, 1], opacity: [0, 1], rot: [-5, -1.5] },
    { at: at + 0.12, dur: 0.38, ease: 'outBack' });
  tl.drive(card, (l, g, s) => { s.scale = 1 + Math.sin(g * 5) * 0.025; }, { at: at + 0.5, dur: hold });

  const rule = stage.add({
    id: `sub-rule-${at.toFixed(1)}`,
    svg: mbBand(portrait ? 300 : 380, { h: 12, fill: MB.ochre, pattern: 'chevron' }),
    x: CX + (portrait ? 40 : 60), y: y + (portrait ? 68 : 74), layer, scaleX: 0, window: win,
  });
  tl.fromTo(rule, { scaleX: [0, 1] }, { at: at + 0.3, dur: 0.3, ease: 'outQuart' });

  for (const el of [bell, card, rule]) {
    tl.to(el, { opacity: 0, y: el.y - 26 }, { at: end, dur: 0.45, ease: 'inCubic' });
  }
  return { end: end + 0.5 };
}
