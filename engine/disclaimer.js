/**
 * The on-screen disclaimer.
 *
 * This channel explains what traditional texts say. It does not promise
 * outcomes, and it is not advice in any regulated field. That distinction is
 * the difference between a channel that lasts and one that gets struck — so it
 * is a pipeline step, not something to remember to add.
 *
 * `addDisclaimer(stage, { at })` appends a held card. `npm run build` warns
 * when an episode omits it.
 */
import { MB, mbBorder, mbCard, mbBand, ink } from './madhubani.js';
import { text } from './kit.js';

export const DISCLAIMER_HI = [
  'यह वीडियो पारंपरिक ग्रंथों की',
  'जानकारी देता है — किसी परिणाम',
  'की गारंटी नहीं।',
];

export const DISCLAIMER_HI_LONG =
  'यह वीडियो पारंपरिक ग्रंथों में लिखी बातों की जानकारी देता है। ' +
  'यह किसी परिणाम की गारंटी नहीं है, और चिकित्सा, कानूनी या वित्तीय सलाह नहीं है। ' +
  'किसी भी निर्णय से पहले योग्य व्यक्ति से सलाह लें।';

export const DISCLAIMER_EN =
  'This video describes what traditional texts say. It does not guarantee any ' +
  'outcome and is not medical, legal or financial advice. Consult a qualified ' +
  'professional before acting on anything here.';

/**
 * @param {object} opts
 *   at    when the card appears (seconds)
 *   hold  how long it stays up — 3.5s is about the minimum a viewer can read
 */
export function addDisclaimer(stage, opts = {}) {
  const { at = 0, hold = 3.5, lines = DISCLAIMER_HI, layer = 900 } = opts;
  const W = stage.width, H = stage.height, CX = W / 2, CY = H / 2;
  const tl = stage.tl;
  const portrait = H > W;
  const end = at + hold;

  const bg = stage.add({
    id: 'disc-bg',
    svg: `<rect width="${W}" height="${H}" fill="${MB.ground}"/>`,
    x: 0, y: 0, layer, opacity: 0, boil: false, window: [at - 0.05, end + 0.6],
  });
  tl.fromTo(bg, { opacity: [0, 1] }, { at, dur: 0.35, ease: 'outCubic' });
  tl.to(bg, { opacity: 0 }, { at: end, dur: 0.5 });

  const border = stage.add({
    id: 'disc-border', svg: mbBorder(W, H, { fill: MB.inkSoft, pattern: 'hline' }),
    x: 0, y: 0, layer: layer + 1, opacity: 0, boil: false, window: [at - 0.05, end + 0.6],
  });
  tl.fromTo(border, { opacity: [0, 1] }, { at, dur: 0.35 });
  tl.to(border, { opacity: 0 }, { at: end, dur: 0.5 });

  const size = portrait ? 52 : 46;
  const body = stage.add({
    id: 'disc-text',
    svg: text(lines.join('\n'), { size, font: 'var(--font-deva)', fill: MB.ink, lineHeight: 1.5 }),
    x: CX, y: CY, layer: layer + 3, opacity: 0, boil: false, window: [at - 0.05, end + 0.6],
  });
  tl.fromTo(body, { opacity: [0, 1], y: [CY + 24, CY] }, { at: at + 0.18, dur: 0.45, ease: 'outCubic' });
  tl.to(body, { opacity: 0 }, { at: end, dur: 0.4 });

  const rule = stage.add({
    id: 'disc-rule', svg: mbBand(portrait ? 420 : 520, { h: 18, fill: MB.ochre, pattern: 'chevron' }),
    x: CX, y: CY + (portrait ? 170 : 140), layer: layer + 2, scaleX: 0, opacity: 0,
    boil: false, window: [at - 0.05, end + 0.6],
  });
  tl.fromTo(rule, { scaleX: [0, 1], opacity: [0, 1] }, { at: at + 0.35, dur: 0.4, ease: 'outQuart' });
  tl.to(rule, { opacity: 0 }, { at: end, dur: 0.4 });

  return { bg, border, body, rule, end: end + 0.6 };
}
