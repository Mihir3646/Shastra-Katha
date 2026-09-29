// Easing functions. All map t in [0,1] -> eased value (may overshoot for "back"/"elastic").

const c1 = 1.70158;
const c2 = c1 * 1.525;
const c3 = c1 + 1;
const c4 = (2 * Math.PI) / 3;

export const Ease = {
  linear: t => t,

  inQuad:    t => t * t,
  outQuad:   t => 1 - (1 - t) * (1 - t),
  inOutQuad: t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),

  inCubic:    t => t * t * t,
  outCubic:   t => 1 - Math.pow(1 - t, 3),
  inOutCubic: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),

  inQuart:    t => t * t * t * t,
  outQuart:   t => 1 - Math.pow(1 - t, 4),
  inOutQuart: t => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2),

  outQuint:   t => 1 - Math.pow(1 - t, 5),

  inExpo:  t => (t === 0 ? 0 : Math.pow(2, 10 * t - 10)),
  outExpo: t => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),

  outSine: t => Math.sin((t * Math.PI) / 2),
  inSine:  t => 1 - Math.cos((t * Math.PI) / 2),
  inOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,

  // Overshoot — the signature "stamped down on the page" feel.
  inBack:  t => c3 * t * t * t - c1 * t * t,
  outBack: t => 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2),
  inOutBack: t =>
    t < 0.5
      ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
      : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2,

  outElastic: t =>
    t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1,

  outBounce: t => {
    const n1 = 7.5625, d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  },
};

// Allow "outBack" strings anywhere an easing is accepted.
export function resolveEase(e) {
  if (typeof e === 'function') return e;
  if (typeof e === 'string' && Ease[e]) return Ease[e];
  return Ease.outCubic;
}
