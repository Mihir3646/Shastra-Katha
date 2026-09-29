import { Rng, hashSeed } from './prng.js';

// ---------------------------------------------------------------------------
// Papercraft primitives.
//
// The torn/cut edges are generated as PATH GEOMETRY rather than SVG
// feTurbulence + feDisplacementMap. Filters look fine on a still, but they are
// rasterised per element per frame and a 60s 1080x1920 render is 1800 frames;
// geometry is ~40x cheaper, resolution-independent, and identical every run.
// ---------------------------------------------------------------------------

/** Smooth 1-D value noise with octaves, sampled on a loop so edges meet cleanly. */
function loopNoise(seed, count, octaves = 3, persistence = 0.5) {
  const out = new Float64Array(count);
  let amp = 1, total = 0;
  for (let o = 0; o < octaves; o++) {
    const period = Math.max(2, Math.round(count / Math.pow(2, o + 1)));
    const rng = new Rng(hashSeed(seed + ':' + o));
    const ctrl = Array.from({ length: period }, () => rng.range(-1, 1));
    for (let i = 0; i < count; i++) {
      const x = (i / count) * period;
      const i0 = Math.floor(x) % period, i1 = (i0 + 1) % period;
      const f = x - Math.floor(x);
      const s = f * f * (3 - 2 * f);               // smoothstep
      out[i] += (ctrl[i0] * (1 - s) + ctrl[i1] * s) * amp;
    }
    total += amp;
    amp *= persistence;
  }
  for (let i = 0; i < count; i++) out[i] /= total;
  return out;
}

const EDGE_STYLES = {
  // scissors: slow confident wobble, mostly smooth
  cut:  { octaves: 2, persistence: 0.45, freq: 0.9,  notch: 0,    tension: 0.9,  step: 16 },
  // hand-torn: fibrous, with the occasional deeper bite. Low tension keeps the
  // corners sharp — rounding them off is what made early tests look moulded
  // rather than torn.
  torn: { octaves: 5, persistence: 0.66, freq: 2.6,  notch: 0.55, tension: 0.35, step: 9 },
  // guillotine / printed edge: almost straight
  trim: { octaves: 2, persistence: 0.3,  freq: 0.5,  notch: 0,    tension: 1,    step: 20 },
};

/**
 * Offset a polyline's vertices along their normals by seeded noise.
 * pts: [[x,y], ...] closed loop. Returns a new point list.
 */
function roughenLoop(pts, { seed = 'edge', amp = 6, style = 'torn' } = {}) {
  const cfg = EDGE_STYLES[style] ?? EDGE_STYLES.torn;
  const n = pts.length;
  const noise = loopNoise(seed, n, cfg.octaves, cfg.persistence);
  const notchRng = new Rng(seed + ':notch');
  const out = [];
  for (let i = 0; i < n; i++) {
    const [x, y] = pts[i];
    const [px, py] = pts[(i - 1 + n) % n];
    const [nx, ny] = pts[(i + 1) % n];
    // outward normal of the local tangent
    let tx = nx - px, ty = ny - py;
    const len = Math.hypot(tx, ty) || 1;
    const normX = ty / len, normY = -tx / len;
    let d = noise[i] * amp * cfg.freq;
    if (cfg.notch && notchRng.next() < 0.07) d -= amp * cfg.notch * (1 + notchRng.next() * 1.6);
    out.push([x + normX * d, y + normY * d]);
  }
  return out;
}

/** Closed Catmull-Rom -> cubic Bezier path. Keeps torn edges from looking polygonal. */
export function smoothClosedPath(pts, tension = 1) {
  const n = pts.length;
  if (n < 3) return '';
  let d = `M ${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1x = p1[0] + ((p2[0] - p0[0]) / 6) * tension;
    const c1y = p1[1] + ((p2[1] - p0[1]) / 6) * tension;
    const c2x = p2[0] - ((p3[0] - p1[0]) / 6) * tension;
    const c2y = p2[1] - ((p3[1] - p1[1]) / 6) * tension;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }
  return d + ' Z';
}

/** Sample a rectangle outline into evenly spaced points. */
function rectLoop(w, h, step) {
  const pts = [];
  const push = (x, y) => pts.push([x, y]);
  const nx = Math.max(2, Math.round(w / step));
  const ny = Math.max(2, Math.round(h / step));
  for (let i = 0; i < nx; i++) push((i / nx) * w, 0);
  for (let i = 0; i < ny; i++) push(w, (i / ny) * h);
  for (let i = nx; i > 0; i--) push((i / nx) * w, h);
  for (let i = ny; i > 0; i--) push(0, (i / ny) * h);
  return pts;
}

/**
 * A torn/cut paper rectangle as a path `d`, drawn from (0,0) to (w,h).
 * opts: { seed, amp, style: 'torn'|'cut'|'trim', step }
 */
export function tornRect(w, h, opts = {}) {
  const { seed = 'rect', amp = 5, style = 'torn' } = opts;
  const cfg = EDGE_STYLES[style] ?? EDGE_STYLES.torn;
  const step = opts.step ?? cfg.step;
  return smoothClosedPath(roughenLoop(rectLoop(w, h, step), { seed, amp, style }), cfg.tension);
}

/** A torn circle/ellipse — for suns, coins, dots, chakra discs. */
export function tornEllipse(rx, ry = rx, opts = {}) {
  const { seed = 'ellipse', amp = 4, style = 'torn', segments = 72 } = opts;
  const pts = Array.from({ length: segments }, (_, i) => {
    const a = (i / segments) * Math.PI * 2;
    return [Math.cos(a) * rx, Math.sin(a) * ry];
  });
  const cfg = EDGE_STYLES[style] ?? EDGE_STYLES.torn;
  return smoothClosedPath(roughenLoop(pts, { seed, amp, style }), cfg.tension);
}

/**
 * An organic blob — clouds, hills, lotus petals, smoke.
 * `lobes` controls how many bumps; `irregularity` how uneven they are.
 */
export function blob(r, opts = {}) {
  const { seed = 'blob', lobes = 6, irregularity = 0.3, segments = 80, amp = 3, style = 'cut' } = opts;
  const rng = new Rng(seed + ':blob');
  const radii = Array.from({ length: lobes }, () => r * (1 + rng.range(-irregularity, irregularity)));
  const pts = Array.from({ length: segments }, (_, i) => {
    const a = (i / segments) * Math.PI * 2;
    const x = (i / segments) * lobes;
    const i0 = Math.floor(x) % lobes, i1 = (i0 + 1) % lobes;
    const f = x - Math.floor(x), s = f * f * (3 - 2 * f);
    const rr = radii[i0] * (1 - s) + radii[i1] * s;
    return [Math.cos(a) * rr, Math.sin(a) * rr];
  });
  return smoothClosedPath(roughenLoop(pts, { seed, amp, style }));
}

/** A ragged horizontal strip — torn-paper scene wipes, ground lines, banners. */
export function tornStrip(w, h, opts = {}) {
  const { seed = 'strip', amp = 14, edges = 'bottom', step = 14 } = opts;
  const n = Math.max(4, Math.round(w / step));
  const top = loopNoise(seed + ':t', n, 4, 0.6);
  const bot = loopNoise(seed + ':b', n, 4, 0.6);
  const tearTop = edges === 'top' || edges === 'both';
  const tearBot = edges === 'bottom' || edges === 'both';
  let d = `M 0 ${tearTop ? (top[0] * amp).toFixed(2) : 0}`;
  for (let i = 1; i < n; i++) {
    const x = (i / (n - 1)) * w;
    d += ` L ${x.toFixed(2)} ${(tearTop ? top[i] * amp : 0).toFixed(2)}`;
  }
  d += ` L ${w} ${(h + (tearBot ? bot[n - 1] * amp : 0)).toFixed(2)}`;
  for (let i = n - 2; i >= 0; i--) {
    const x = (i / (n - 1)) * w;
    d += ` L ${x.toFixed(2)} ${(h + (tearBot ? bot[i] * amp : 0)).toFixed(2)}`;
  }
  return d + ' Z';
}

/** Rolling hills/mountains silhouette, left to right. */
export function hills(w, h, opts = {}) {
  const { seed = 'hills', peaks = 5, roughness = 0.35, baseline = 1 } = opts;
  const n = 160;
  const noise = loopNoise(seed, n, 3, 0.5);
  const pts = [];
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * w;
    const wave = Math.sin((i / (n - 1)) * Math.PI * peaks) * 0.5 + 0.5;
    const y = h * baseline - h * (wave * (1 - roughness) + (noise[i] * 0.5 + 0.5) * roughness);
    pts.push([x, y]);
  }
  let d = `M 0 ${h}`;
  for (const [x, y] of pts) d += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
  return d + ` L ${w} ${h} Z`;
}

// --- Textures ---------------------------------------------------------------

/**
 * Tiling paper-fibre texture as a data URI, generated once per render and
 * overlaid with multiply. One 512px tile beats a per-element feTurbulence.
 */
export function paperTextureDataURL(size = 512, opts = {}) {
  const { seed = 'paper', fibre = 1, grain = 1, contrast = 1 } = opts;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const rng = new Rng(seed);

  // Base speckle. Paper is not flat: this is the tooth you feel under a print.
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < size * size; i++) {
    const v = 255 - rng.range(0, 20) * grain * contrast;
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);

  // Soft mottling — the cloudy unevenness of handmade sheets.
  const wrap = (fn) => {
    for (const [ox, oy] of [[0, 0], [size, 0], [-size, 0], [0, size], [0, -size],
                            [size, size], [-size, -size], [size, -size], [-size, size]]) fn(ox, oy);
  };
  for (let i = 0; i < 26; i++) {
    const x = rng.range(0, size), y = rng.range(0, size), r = rng.range(size * 0.08, size * 0.3);
    const dark = rng.bool(0.5);
    wrap((ox, oy) => {
      const g = ctx.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r);
      const a = rng.range(0.01, 0.036) * contrast;
      g.addColorStop(0, dark ? `rgba(118,104,82,${a})` : `rgba(255,255,255,${a * 1.4})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x + ox - r, y + oy - r, r * 2, r * 2);
    });
  }

  // Fibres: the single most identifiable feature of mulberry/washi paper.
  ctx.lineCap = 'round';
  const count = Math.round(size * 1.9 * fibre);
  for (let i = 0; i < count; i++) {
    const x = rng.range(0, size), y = rng.range(0, size);
    const a = rng.range(0, Math.PI * 2);
    const len = rng.range(8, 46);
    const bend = rng.range(-0.5, 0.5);
    const dark = rng.bool(0.5);
    ctx.lineWidth = rng.range(0.4, 1.15);
    ctx.strokeStyle = dark
      ? `rgba(108,96,76,${rng.range(0.03, 0.085) * contrast})`
      : `rgba(255,255,255,${rng.range(0.05, 0.16) * contrast})`;
    wrap((ox, oy) => {
      const x0 = x + ox, y0 = y + oy;
      const x1 = x0 + Math.cos(a) * len, y1 = y0 + Math.sin(a) * len;
      const mx = (x0 + x1) / 2 + Math.cos(a + Math.PI / 2) * len * bend;
      const my = (y0 + y1) / 2 + Math.sin(a + Math.PI / 2) * len * bend;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo(mx, my, x1, y1);
      ctx.stroke();
    });
  }

  // A few long straw fibres sitting proud of the surface.
  for (let i = 0; i < Math.round(9 * fibre); i++) {
    const x = rng.range(0, size), y = rng.range(0, size);
    const a = rng.range(0, Math.PI * 2), len = rng.range(70, 180);
    ctx.lineWidth = rng.range(0.7, 1.6);
    ctx.strokeStyle = `rgba(126,112,86,${rng.range(0.025, 0.06) * contrast})`;
    wrap((ox, oy) => {
      ctx.beginPath();
      ctx.moveTo(x + ox, y + oy);
      ctx.quadraticCurveTo(
        x + ox + Math.cos(a) * len * 0.5 + rng.jitter(18),
        y + oy + Math.sin(a) * len * 0.5 + rng.jitter(18),
        x + ox + Math.cos(a) * len, y + oy + Math.sin(a) * len);
      ctx.stroke();
    });
  }

  return c.toDataURL('image/png');
}

/** Halftone dot pattern markup — the printed-fabric look on clothing. */
export function halftonePattern(id, { size = 10, r = 2, color = '#000', opacity = 0.12 } = {}) {
  return `<pattern id="${id}" width="${size}" height="${size}" patternUnits="userSpaceOnUse">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="${color}" opacity="${opacity}"/>
  </pattern>`;
}

/** Faint ruled "newsprint" lines, for ransom-note letter tiles. */
export function newsprintPattern(id, { size = 7, color = '#4a4740', opacity = 0.5 } = {}) {
  return `<pattern id="${id}" width="${size * 3}" height="${size}" patternUnits="userSpaceOnUse">
    <rect x="0" y="${size * 0.35}" width="${size * 2.1}" height="${size * 0.3}" fill="${color}" opacity="${opacity}"/>
  </pattern>`;
}

/** Wood grain — desks, boards, door frames. */
export function woodPattern(id, { w = 400, h = 90, base = '#b98a54', line = '#8d6238' } = {}) {
  let lines = '';
  const rng = new Rng(id + ':wood');
  for (let i = 0; i < 9; i++) {
    const y = rng.range(0, h);
    const sw = rng.range(0.6, 2.4);
    lines += `<path d="M 0 ${y.toFixed(1)} Q ${w * 0.3} ${(y + rng.jitter(5)).toFixed(1)}, ${w * 0.55} ${y.toFixed(1)} T ${w} ${(y + rng.jitter(4)).toFixed(1)}"
      stroke="${line}" stroke-width="${sw.toFixed(2)}" fill="none" opacity="${rng.range(0.12, 0.34).toFixed(2)}"/>`;
  }
  return `<pattern id="${id}" width="${w}" height="${h}" patternUnits="userSpaceOnUse">
    <rect width="${w}" height="${h}" fill="${base}"/>${lines}</pattern>`;
}

/** Graph-paper grid, as on the reference's title card. */
export function gridPattern(id, { size = 38, color = '#8d8778', opacity = 0.22, width = 1 } = {}) {
  return `<pattern id="${id}" width="${size}" height="${size}" patternUnits="userSpaceOnUse">
    <path d="M ${size} 0 L 0 0 0 ${size}" fill="none" stroke="${color}" stroke-width="${width}" opacity="${opacity}"/>
  </pattern>`;
}

/** Shared filter defs: one soft shadow set, reused by every cutout. */
export function shadowDefs() {
  return `
  <filter id="cut-shadow" x="-30%" y="-30%" width="170%" height="170%">
    <feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#2b2118" flood-opacity="0.30"/>
  </filter>
  <filter id="cut-shadow-sm" x="-30%" y="-30%" width="170%" height="170%">
    <feDropShadow dx="0" dy="3" stdDeviation="3.5" flood-color="#2b2118" flood-opacity="0.26"/>
  </filter>
  <filter id="cut-shadow-lg" x="-40%" y="-40%" width="190%" height="190%">
    <feDropShadow dx="0" dy="14" stdDeviation="18" flood-color="#241b12" flood-opacity="0.34"/>
  </filter>
  <filter id="glow-soft" x="-60%" y="-60%" width="220%" height="220%">
    <feGaussianBlur stdDeviation="14" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>`;
}
