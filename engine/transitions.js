import { tornStrip, blob } from './paper.js';
import { PALETTE } from './kit.js';

// ---------------------------------------------------------------------------
// Scene transitions. The reference short cuts between scenes with a sheet of
// paper torn across the frame — these reproduce that and a few siblings.
// Each returns the element(s) it created so a scene can tweak them further.
// ---------------------------------------------------------------------------

/**
 * A torn sheet sweeps across the frame and off again, hiding the cut.
 * Put the incoming scene's `from` at roughly `at + travel/2`.
 */
export function tearWipe(stage, { at = 0, color = PALETTE.paper, dir = 'up', travel = 0.52, layer = 900, seed = 'wipe' } = {}) {
  const W = stage.width, H = stage.height;
  const sheetH = H * 1.35;
  const vertical = dir === 'up' || dir === 'down';
  const w = vertical ? W * 1.1 : sheetH;
  const h = vertical ? sheetH : W * 1.1;

  const d = tornStrip(w, h, { seed, amp: 34, edges: 'both' });

  const off = vertical ? H * 1.5 : W * 1.5;
  const axis = vertical ? 'y' : 'x';
  const sign = dir === 'up' || dir === 'left' ? 1 : -1;
  const home = vertical ? H / 2 : W / 2;
  const start = home + off * sign;

  // Born off-screen and windowed to its own sweep, so it can never sit over a
  // frame it isn't meant to be in.
  const el = stage.add({
    id: `wipe-${seed}`,
    svg: `<g transform="translate(${-w / 2},${-h / 2})"><path d="${d}" fill="${color}"/></g>`,
    x: vertical ? W / 2 : start,
    y: vertical ? start : H / 2,
    layer, shadow: 'cut-shadow-lg', boil: false, opacity: 1,
    window: [at, at + travel],
  });

  stage.tl.fromTo(el, { [axis]: [start, home] }, { at, dur: travel / 2, ease: 'inQuad' });
  stage.tl.fromTo(el, { [axis]: [home, home - off * sign] }, { at: at + travel / 2, dur: travel / 2, ease: 'outQuad' });
  return el;
}

/** An expanding paper blob that swallows the frame — good for a punchy beat. */
export function blobWipe(stage, { at = 0, color = PALETTE.saffron, layer = 900, seed = 'blobwipe', travel = 0.6, x = null, y = null } = {}) {
  const W = stage.width, H = stage.height;
  const R = Math.hypot(W, H) * 0.62;
  const el = stage.add({
    id: `blobwipe-${seed}`,
    svg: `<path d="${blob(R, { seed, lobes: 9, irregularity: 0.12, amp: 6, style: 'cut' })}" fill="${color}"/>`,
    x: x ?? W / 2, y: y ?? H / 2, layer, scale: 0, boil: false,
    window: [at, at + travel],
  });
  stage.tl.fromTo(el, { scale: [0, 1.25] }, { at, dur: travel * 0.45, ease: 'inQuad' });
  stage.tl.fromTo(el, { scale: [1.25, 0] }, { at: at + travel * 0.55, dur: travel * 0.45, ease: 'outQuad' });
  return el;
}

/** Hard flash — a sheet of white/cream over one or two frames. */
export function flash(stage, { at = 0, color = '#FFFDF4', dur = 0.16, layer = 950, peak = 0.85 } = {}) {
  const el = stage.add({
    id: `flash-${at}`,
    svg: `<rect x="0" y="0" width="${stage.width}" height="${stage.height}" fill="${color}"/>`,
    x: 0, y: 0, layer, opacity: 0, boil: false,
    window: [at, at + dur],
  });
  stage.tl.fromTo(el, { opacity: [0, peak] }, { at, dur: dur * 0.3, ease: 'outQuad' });
  stage.tl.fromTo(el, { opacity: [peak, 0] }, { at: at + dur * 0.3, dur: dur * 0.7, ease: 'inQuad' });
  return el;
}

/** Fade the whole frame to a colour — openings and endings. */
export function fade(stage, { at = 0, dur = 0.6, color = '#171310', to = 'in', layer = 940 } = {}) {
  const el = stage.add({
    id: `fade-${to}-${at}`,
    svg: `<rect x="0" y="0" width="${stage.width}" height="${stage.height}" fill="${color}"/>`,
    x: 0, y: 0, layer, opacity: to === 'in' ? 1 : 0, boil: false,
  });
  stage.tl.fromTo(el, { opacity: to === 'in' ? [1, 0] : [0, 1] }, { at, dur, ease: 'inOutQuad' });
  return el;
}
