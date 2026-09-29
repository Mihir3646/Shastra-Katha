import { resolveEase } from './ease.js';

// ---------------------------------------------------------------------------
// Timeline
//
// Every frame is rendered by SEEKING, never by accumulating deltas: seek(t)
// rebuilds the whole scene state from the base snapshot and replays every clip
// whose window has started. That is what makes renders reproducible and lets us
// render a 4-second-per-frame scene without the animation running fast or slow.
// ---------------------------------------------------------------------------

const isNum = v => typeof v === 'number';

function parseHex(h) {
  let s = h.replace('#', '');
  if (s.length === 3) s = s.split('').map(c => c + c).join('');
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
}
const toHex = n => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0');

function lerpValue(a, b, p) {
  if (isNum(a) && isNum(b)) return a + (b - a) * p;
  if (typeof a === 'string' && typeof b === 'string' && a[0] === '#' && b[0] === '#') {
    const A = parseHex(a), B = parseHex(b);
    return '#' + toHex(A[0] + (B[0] - A[0]) * p) + toHex(A[1] + (B[1] - A[1]) * p) + toHex(A[2] + (B[2] - A[2]) * p);
  }
  // Non-interpolable (strings, booleans): snap at the halfway point.
  return p < 1 ? a : b;
}

export class Timeline {
  constructor() {
    this.clips = [];
    this.states = new Set();
    this.bases = new Map();
    this.duration = 0;
    this._cursor = 0;   // for chained/relative scheduling
  }

  /** Register a state object so seek() can restore it. Idempotent. */
  track(state) {
    if (!this.states.has(state)) {
      this.states.add(state);
      this.bases.set(state, { ...state });
    }
    return state;
  }

  /** Re-snapshot the base values (call after mutating a state outside the timeline). */
  rebase(state) {
    this.bases.set(state, { ...state });
    return state;
  }

  /**
   * fromTo(state, props, opts)
   *   props: { opacity: [0, 1], y: [40, 0] }
   *   opts:  { at, dur, ease, hold }
   * `at` accepts a number, or '+=0.2' / '-=0.1' relative to the last clip's end.
   */
  fromTo(state, props, opts = {}) {
    this.track(state);
    const at = this._resolveAt(opts.at);
    const dur = opts.dur ?? 0.5;
    const ease = resolveEase(opts.ease);
    const keys = Object.keys(props);
    const from = {}, to = {};
    for (const k of keys) {
      const v = props[k];
      if (Array.isArray(v)) { from[k] = v[0]; to[k] = v[1]; }
      else { from[k] = this.bases.get(state)[k] ?? 0; to[k] = v; }
    }
    this.clips.push({ state, from, to, at, dur, ease, keys });
    this._cursor = at + dur;
    this.duration = Math.max(this.duration, at + dur + (opts.hold ?? 0));
    return this;
  }

  /** to(): start from whatever the previous clips left behind at clip start. */
  to(state, props, opts = {}) {
    this.track(state);
    const at = this._resolveAt(opts.at);
    const dur = opts.dur ?? 0.5;
    const ease = resolveEase(opts.ease);
    const keys = Object.keys(props);
    this.clips.push({ state, from: null, to: { ...props }, at, dur, ease, keys, resolveFrom: true });
    this._cursor = at + dur;
    this.duration = Math.max(this.duration, at + dur + (opts.hold ?? 0));
    return this;
  }

  /** Set a value instantly at time `at` (no tween). */
  set(state, props, at = 0) {
    return this.fromTo(state, Object.fromEntries(Object.entries(props).map(([k, v]) => [k, [v, v]])), {
      at: this._resolveAt(at), dur: 0,
    });
  }

  /** Apply the same animation across many states, offset by `each` seconds. */
  stagger(states, props, opts = {}) {
    const each = opts.each ?? 0.06;
    const base = this._resolveAt(opts.at);
    const order = opts.from === 'end' ? [...states].reverse() : states;
    order.forEach((s, i) => {
      this.fromTo(s, props, { ...opts, at: base + i * each });
    });
    this._cursor = base + (order.length - 1) * each + (opts.dur ?? 0.5);
    return this;
  }

  /**
   * Continuous driver: f(localTime, globalTime) mutates state directly.
   * Used for loops (sway, spin, flicker) that aren't keyframe-shaped.
   */
  drive(state, fn, opts = {}) {
    this.track(state);
    const at = this._resolveAt(opts.at ?? 0);
    const dur = opts.dur ?? Infinity;
    this.clips.push({ state, driver: fn, at, dur, keys: [] });
    if (dur !== Infinity) this.duration = Math.max(this.duration, at + dur);
    return this;
  }

  _resolveAt(at) {
    if (at === undefined || at === null) return this._cursor;
    if (typeof at === 'string') {
      const m = at.match(/^([+-])=([\d.]+)$/);
      if (m) return this._cursor + (m[1] === '+' ? 1 : -1) * parseFloat(m[2]);
      return parseFloat(at) || 0;
    }
    return at;
  }

  /** Evaluate one clip as if the clock read `t`, writing into its state. */
  _applyClip(c, t) {
    if (t < c.at) return;
    if (c.driver) {
      if (t - c.at <= c.dur) c.driver(Math.min(t - c.at, c.dur), t, c.state);
      return;
    }
    const p = c.dur <= 0 ? 1 : Math.min(1, (t - c.at) / c.dur);
    const e = c.ease(p);
    const from = c.resolveFrom ? c._resolvedFrom : c.from;
    for (const k of c.keys) {
      c.state[k] = p >= 1 ? c.to[k] : lerpValue(from[k], c.to[k], e);
    }
  }

  /**
   * Resolve the start values of every `to()` clip exactly once, by replaying
   * only the clips that precede it up to its own start time.
   *
   * Doing this lazily on first evaluation would make the result depend on which
   * frame happened to be rendered first — which breaks the parallel renderer,
   * where each worker starts at a different frame.
   */
  _compile() {
    const clips = [...this.clips].sort((a, b) => a.at - b.at || a.dur - b.dur);
    for (let i = 0; i < clips.length; i++) {
      const c = clips[i];
      if (!c.resolveFrom) continue;
      for (const s of this.states) Object.assign(s, this.bases.get(s));
      for (let j = 0; j < i; j++) this._applyClip(clips[j], c.at);
      c._resolvedFrom = Object.fromEntries(c.keys.map(k => [k, c.state[k]]));
    }
    for (const s of this.states) Object.assign(s, this.bases.get(s));
    this._sorted = clips;
    return clips;
  }

  /** Position every tracked state at absolute time t. */
  seek(t) {
    const clips = this._sorted ?? this._compile();
    for (const s of this.states) Object.assign(s, this.bases.get(s));
    for (const c of clips) this._applyClip(c, t);
  }

  /** Invalidate caches after adding clips post-seek. */
  invalidate() {
    this._sorted = null;
    for (const c of this.clips) delete c._resolvedFrom;
  }
}

// --- Small helpers used constantly when authoring scenes ---------------------

export const clamp01 = v => Math.max(0, Math.min(1, v));
export const lerp = (a, b, p) => a + (b - a) * p;

/** Normalised progress of t across [a,b], clamped. */
export const span = (t, a, b) => clamp01((t - a) / (b - a));

/** Triangle wave in [0,1] with period p — handy for sway/breathe drivers. */
export const pingpong = (t, p) => {
  const x = (t % p) / p;
  return x < 0.5 ? x * 2 : 2 - x * 2;
};
