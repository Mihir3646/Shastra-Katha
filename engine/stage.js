import { Timeline } from './timeline.js';
import { paperTextureDataURL, shadowDefs, halftonePattern, newsprintPattern, woodPattern, gridPattern } from './paper.js';
import { Rng, hashSeed } from './prng.js';
import { PALETTE } from './kit.js';
import { mbPatternDefs } from './madhubani.js';

const SVGNS = 'http://www.w3.org/2000/svg';
const f = n => Math.round(n * 1000) / 1000;

// ---------------------------------------------------------------------------
// Stage: the scene graph plus the compositing layers that sell the papercraft
// look (grain overlay, vignette, optional stop-motion boil).
// ---------------------------------------------------------------------------

export class Stage {
  constructor(opts = {}) {
    this.width = opts.width ?? 1080;
    this.height = opts.height ?? 1920;
    this.bg = opts.bg ?? PALETTE.paper;
    this.tl = new Timeline();
    this.elements = [];
    this.scenes = [];
    this._defs = [];
    this.boil = opts.boil ?? { enabled: true, fps: 8, pos: 1.1, rot: 0.22 };
    this.camera = { x: 0, y: 0, zoom: 1, rot: 0 };
    this.tl.track(this.camera);
    this._built = false;
  }

  /** Register extra <defs> markup (patterns, gradients, masks). */
  defs(markup) { this._defs.push(markup); return this; }

  /**
   * Add an element.
   * spec: { id, svg, x, y, rot, scale, scaleX, scaleY, opacity, layer, shadow, boil, clip }
   * Returns the mutable state object that the timeline animates.
   */
  add(spec) {
    const el = {
      id: spec.id ?? `el${this.elements.length}`,
      svg: spec.svg ?? '',
      x: spec.x ?? 0,
      y: spec.y ?? 0,
      rot: spec.rot ?? 0,
      scale: spec.scale ?? 1,
      scaleX: spec.scaleX ?? 1,
      scaleY: spec.scaleY ?? 1,
      opacity: spec.opacity ?? 1,
      layer: spec.layer ?? 0,
      shadow: spec.shadow ?? null,        // 'cut-shadow' | 'cut-shadow-sm' | 'cut-shadow-lg' | null
      boil: spec.boil ?? true,
      visible: spec.visible ?? true,
      _order: this.elements.length,
    };
    // An explicit window keeps an element out of the frame entirely outside
    // [a, b] — essential for full-bleed overlays like wipes, which would
    // otherwise sit centred and opaque before their first clip starts.
    if (spec.window) el._window = spec.window;
    this.elements.push(el);
    this.tl.track(el);
    return el;
  }

  /** Add many elements from one markup string split by a builder that returns parts. */
  group(specs) { return specs.map(s => this.add(s)); }

  /**
   * Declare a scene. `build(ctx)` runs once; ctx carries absolute times.
   * Elements added inside are auto-hidden outside [from, to].
   */
  scene({ name, from, to, build }) {
    const before = this.elements.length;
    const ctx = {
      stage: this, tl: this.tl, from, to,
      W: this.width, H: this.height,
      cx: this.width / 2, cy: this.height / 2,
      rng: label => new Rng(`${name}:${label ?? ''}`),
    };
    build?.(ctx);
    const members = this.elements.slice(before);
    this.scenes.push({ name, from, to, members });
    for (const el of members) el._window = [from, to];
    return this;
  }

  /** Build the DOM once. Subsequent work is attribute updates only. */
  mount(root) {
    const svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
    svg.setAttribute('width', this.width);
    svg.setAttribute('height', this.height);
    svg.setAttribute('shape-rendering', 'geometricPrecision');
    svg.id = 'stage-svg';

    const defs = document.createElementNS(SVGNS, 'defs');
    defs.innerHTML = shadowDefs()
      + halftonePattern('halftone')
      + newsprintPattern('newsprint')
      + woodPattern('wood')
      + gridPattern('grid')
      + mbPatternDefs()            // Madhubani fills: url(#mb-hatch), url(#mb-scale), ...
      + this._defs.join('\n');
    svg.appendChild(defs);

    // Background paper
    const bgRect = document.createElementNS(SVGNS, 'rect');
    bgRect.setAttribute('width', this.width);
    bgRect.setAttribute('height', this.height);
    bgRect.setAttribute('fill', this.bg);
    bgRect.id = 'stage-bg';
    svg.appendChild(bgRect);

    // Camera group holds everything that can be panned/zoomed
    const cam = document.createElementNS(SVGNS, 'g');
    cam.id = 'camera';
    svg.appendChild(cam);

    for (const el of [...this.elements].sort((a, b) => a.layer - b.layer || a._order - b._order)) {
      const g = document.createElementNS(SVGNS, 'g');
      g.setAttribute('data-id', el.id);
      if (el.shadow) g.setAttribute('filter', `url(#${el.shadow})`);
      g.innerHTML = el.svg;
      cam.appendChild(g);
      el._node = g;
      el._boilSeed = hashSeed(el.id);
    }

    root.appendChild(svg);
    this._svg = svg;
    this._cam = cam;

    // Grain + vignette sit above the artwork, in the DOM not the SVG, so they
    // never get caught by element filters.
    const grain = document.createElement('div');
    grain.id = 'grain';
    grain.style.backgroundImage = `url(${paperTextureDataURL(512, { seed: 'stage-grain' })})`;
    root.appendChild(grain);

    const vig = document.createElement('div');
    vig.id = 'vignette';
    root.appendChild(vig);

    this._built = true;
    return this;
  }

  /** Position everything for absolute time t and write it to the DOM. */
  seek(t) {
    this.tl.seek(t);

    const c = this.camera;
    this._cam.setAttribute(
      'transform',
      `translate(${f(this.width / 2)},${f(this.height / 2)}) scale(${f(c.zoom)}) rotate(${f(c.rot)}) translate(${f(-this.width / 2 - c.x)},${f(-this.height / 2 - c.y)})`
    );

    const boil = this.boil;
    const step = boil?.enabled ? Math.floor(t * boil.fps) : 0;

    for (const el of this.elements) {
      const n = el._node;
      if (!n) continue;

      let visible = el.visible && el.opacity > 0.001;
      if (visible && el._window) {
        visible = t >= el._window[0] - 0.001 && t <= el._window[1] + 0.001;
      }
      if (!visible) {
        if (n.style.display !== 'none') n.style.display = 'none';
        continue;
      }
      if (n.style.display === 'none') n.style.display = '';

      let bx = 0, by = 0, br = 0;
      if (boil?.enabled && el.boil) {
        // Two cheap hash draws per element per step: the ~8fps handmade wobble.
        const h1 = ((el._boilSeed ^ (step * 2654435761)) >>> 0) / 4294967296;
        const h2 = ((el._boilSeed * 31 ^ (step * 40503)) >>> 0) / 4294967296;
        bx = (h1 - 0.5) * 2 * boil.pos;
        by = (h2 - 0.5) * 2 * boil.pos;
        br = (h1 - 0.5) * 2 * boil.rot;
      }

      const sx = el.scale * el.scaleX, sy = el.scale * el.scaleY;
      n.setAttribute(
        'transform',
        `translate(${f(el.x + bx)},${f(el.y + by)}) rotate(${f(el.rot + br)}) scale(${f(sx)},${f(sy)})`
      );
      if (n._op !== el.opacity) { n.setAttribute('opacity', f(el.opacity)); n._op = el.opacity; }
    }
  }

  get duration() { return Math.max(this.tl.duration, ...this.scenes.map(s => s.to), 0); }
}

// --- Motion presets ---------------------------------------------------------
// Named so episodes read like a shot list rather than a pile of tween configs.

export const Motion = {
  /** Stamped onto the page: scale overshoot + a settle rotation. */
  stamp(tl, el, { at = 0, dur = 0.42, from = 0.55, rot = 0 } = {}) {
    const r = el.rot;
    tl.fromTo(el, { scale: [from, el.scale], opacity: [0, el.opacity], rot: [r + rot, r] },
      { at, dur, ease: 'outBack' });
    return tl;
  },

  /** Drifts up into place — gentler than stamp, good under narration. */
  rise(tl, el, { at = 0, dur = 0.6, dy = 60 } = {}) {
    tl.fromTo(el, { y: [el.y + dy, el.y], opacity: [0, el.opacity] }, { at, dur, ease: 'outCubic' });
    return tl;
  },

  /** Slides in from a side. dir: 'l' | 'r' | 't' | 'b'. */
  slide(tl, el, { at = 0, dur = 0.55, dir = 'l', dist = 220, ease = 'outQuart' } = {}) {
    const dx = dir === 'l' ? -dist : dir === 'r' ? dist : 0;
    const dy = dir === 't' ? -dist : dir === 'b' ? dist : 0;
    tl.fromTo(el, { x: [el.x + dx, el.x], y: [el.y + dy, el.y], opacity: [0, el.opacity] },
      { at, dur, ease });
    return tl;
  },

  /** Flips in on the Y axis, like a card being turned over. */
  flip(tl, el, { at = 0, dur = 0.5 } = {}) {
    tl.fromTo(el, { scaleX: [0.02, el.scaleX], opacity: [1, el.opacity] }, { at, dur, ease: 'outBack' });
    return tl;
  },

  /** Fades and shrinks away. */
  out(tl, el, { at = 0, dur = 0.35, scale = 0.86 } = {}) {
    tl.to(el, { opacity: 0, scale: el.scale * scale }, { at, dur, ease: 'inCubic' });
    return tl;
  },

  /** Endless gentle sway — breathing life into an otherwise static cutout. */
  sway(tl, el, { amp = 1.6, period = 3.4, phase = 0, at = 0, dur = Infinity } = {}) {
    const baseRot = el.rot, baseY = el.y;
    tl.drive(el, (local, global, s) => {
      s.rot = baseRot + Math.sin((global / period + phase) * Math.PI * 2) * amp;
      s.y = baseY + Math.sin((global / (period * 1.3) + phase) * Math.PI * 2) * amp * 1.5;
    }, { at, dur });
    return tl;
  },

  /** Continuous rotation, e.g. a sunburst behind a reveal. */
  spin(tl, el, { rpm = 2, at = 0, dur = Infinity, dir = 1 } = {}) {
    const base = el.rot;
    tl.drive(el, (local, global, s) => { s.rot = base + dir * global * rpm * 6; }, { at, dur });
    return tl;
  },

  /** Flame / candle flicker on scale and opacity. */
  flicker(tl, el, { at = 0, dur = Infinity, amp = 0.08, speed = 7, seed = 1 } = {}) {
    const bs = el.scale;
    tl.drive(el, (local, global, s) => {
      const n = Math.sin(global * speed + seed) * 0.6 + Math.sin(global * speed * 2.7 + seed * 3) * 0.4;
      s.scaleY = 1 + n * amp;
      s.scaleX = 1 - n * amp * 0.4;
      s.opacity = 0.88 + n * 0.12;
    }, { at, dur });
    return tl;
  },

  /** Camera push-in. Pass the stage's camera object. */
  push(tl, cam, { at = 0, dur = 2, from = 1, to = 1.12, x = 0, y = 0 } = {}) {
    tl.fromTo(cam, { zoom: [from, to], x: [0, x], y: [0, y] }, { at, dur, ease: 'inOutSine' });
    return tl;
  },
};
