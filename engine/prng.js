// Deterministic PRNG. Every render of an episode must produce byte-identical
// frames, so nothing in the studio is allowed to call Math.random().

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Hash a string into a 32-bit seed, so `rng('coffee-cup')` is stable across runs.
export function hashSeed(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export class Rng {
  constructor(seed) {
    this._next = mulberry32(typeof seed === 'string' ? hashSeed(seed) : seed);
  }
  next() { return this._next(); }
  range(min, max) { return min + this._next() * (max - min); }
  int(min, max) { return Math.floor(this.range(min, max + 1)); }
  pick(arr) { return arr[Math.floor(this._next() * arr.length)]; }
  // Signed jitter, e.g. jitter(2) -> [-2, 2]
  jitter(amp) { return (this._next() * 2 - 1) * amp; }
  bool(p = 0.5) { return this._next() < p; }
}

// Convenience: a named generator so scenes can ask for stable randomness by label.
export function rng(label) { return new Rng(label); }
