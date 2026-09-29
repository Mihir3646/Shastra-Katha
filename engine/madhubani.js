/**
 * Madhubani (Mithila) style layer.
 *
 * Keeps the papercraft TECHNIQUE — torn geometry, paper grain, drop shadows,
 * the stop-motion boil — and replaces the visual language:
 *
 *   heavy soot-black outlines instead of cream die-cut edges
 *   dense pattern fill, because Mithila painting abhors empty space
 *   natural-pigment palette: turmeric, kumkum, indigo, lamp-black
 *   a decorative border on every frame, as the tradition always has
 *   flat and frontal — no perspective, no gradients, no soft shading
 *
 * Use alongside kit.js: the base primitives (tornRect, blob, paper texture) are
 * shared; this module supplies the treatment and the motifs.
 */
import { tornRect, tornEllipse, blob, smoothClosedPath } from './paper.js';
import { Rng } from './prng.js';

const f = n => Math.round(n * 100) / 100;

/** Natural-pigment palette. These are the colours the tradition actually uses. */
export const MB = {
  ink:      '#1C1613',   // lamp black / soot
  inkSoft:  '#3A2E26',
  ground:   '#EFE0C0',   // handmade paper
  groundAlt:'#E7D3A8',
  cream:    '#F7EDD6',
  red:      '#C1372C',   // kumkum
  deepRed:  '#8E2418',
  ochre:    '#D99A2B',   // turmeric
  yellow:   '#EBC04A',
  indigo:   '#2E4A7D',
  blue:     '#3F6FA8',
  green:    '#4E7A3A',
  leaf:     '#6D9A4A',
  pink:     '#D4738A',
  brown:    '#7A4B2A',
  white:    '#FBF6E9',
};

/**
 * Pattern fills, all in ink over a coloured base — which is how Mithila work is
 * actually built up: flat colour, then linework on top.
 */
export function mbPatternDefs({ ink = MB.ink, opacity = 0.62 } = {}) {
  const s = (id, body, w, h = w) =>
    `<pattern id="mb-${id}" width="${w}" height="${h}" patternUnits="userSpaceOnUse">${body}</pattern>`;
  const st = (d, sw = 1.6) =>
    `<path d="${d}" fill="none" stroke="${ink}" stroke-width="${sw}" opacity="${opacity}"/>`;

  return [
    s('hatch', st('M -2 10 L 10 -2 M 0 18 L 18 0 M 8 18 L 18 8'), 16),
    s('hatch2', st('M -2 6 L 6 -2 M 0 14 L 14 0 M 8 14 L 14 8'), 12, 12),
    s('cross', st('M -2 10 L 10 -2 M 0 18 L 18 0') + st('M -2 6 L 6 14 M 2 -2 L 18 14'), 16),
    s('vline', st('M 5 0 L 5 12'), 10, 12),
    s('hline', st('M 0 5 L 12 5'), 12, 10),
    s('dots', `<circle cx="5" cy="5" r="1.7" fill="${ink}" opacity="${opacity}"/>` +
              `<circle cx="13" cy="13" r="1.7" fill="${ink}" opacity="${opacity}"/>`, 18),
    s('stipple', `<circle cx="3" cy="3" r="1.1" fill="${ink}" opacity="${opacity * 0.8}"/>` +
                 `<circle cx="9" cy="7" r="1.1" fill="${ink}" opacity="${opacity * 0.8}"/>` +
                 `<circle cx="5" cy="11" r="1.1" fill="${ink}" opacity="${opacity * 0.8}"/>`, 14),
    s('wave', st('M 0 8 q 5 -6, 10 0 t 10 0', 1.8), 20, 16),
    s('scale', st('M 0 14 a 7 7 0 0 1 14 0', 1.6) + st('M 7 14 a 7 7 0 0 1 14 0', 1.6), 14, 14),
    s('chevron', st('M 0 12 L 7 4 L 14 12', 1.7), 14, 14),
    s('net', st('M 0 0 L 14 14 M 14 0 L 0 14', 1.2), 14),
    s('leafrow', st('M 7 2 q 5 6, 0 12 q -5 -6, 0 -12', 1.5), 14, 16),
  ].join('');
}

export const MB_PATTERNS = ['hatch', 'hatch2', 'cross', 'vline', 'hline', 'dots',
                            'stipple', 'wave', 'scale', 'chevron', 'net', 'leafrow'];

/**
 * The core treatment: flat colour, pattern fill, heavy ink outline.
 * This replaces kit.js's cut() — Mithila has no cream die-cut edge.
 */
export function ink(d, fill, opts = {}) {
  const { pattern = null, stroke = MB.ink, sw = 5, inner = null } = opts;
  let out = `<path d="${d}" fill="${fill}"/>`;
  if (pattern) out += `<path d="${d}" fill="url(#mb-${pattern})"/>`;
  if (inner) out += inner;
  out += `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>`;
  return out;
}

/** A filled, outlined, patterned rectangle centred on the origin. */
export function mbCard(w, h, fill = MB.ochre, opts = {}) {
  const { seed = 'mbcard', pattern = null, sw = 5, amp = 3 } = opts;
  const d = tornRect(w, h, { seed, amp, style: 'cut' });
  return `<g transform="translate(${f(-w / 2)},${f(-h / 2)})">${ink(d, fill, { pattern, sw })}</g>`;
}

/** A disc. */
export function mbDisc(r, fill = MB.red, opts = {}) {
  const { seed = 'mbdisc', pattern = null, sw = 5 } = opts;
  return ink(tornEllipse(r, r, { seed, amp: 2.5, style: 'cut' }), fill, { pattern, sw });
}

// --- The border ------------------------------------------------------------

/**
 * Every Mithila painting is framed. For video this doubles as a safe-area
 * guide: keep content inside it and nothing collides with platform UI.
 */
export function mbBorder(w, h, opts = {}) {
  const {
    inset = Math.min(w, h) * 0.045,
    band = Math.min(w, h) * 0.055,
    fill = MB.red,
    pattern = 'leafrow',
    sw = 5,
    seed = 'mbborder',
  } = opts;

  const o = inset, i = inset + band;
  // Outer ring as an even-odd donut, so the band itself carries the pattern.
  const ring = `M ${o} ${o} H ${w - o} V ${h - o} H ${o} Z ` +
               `M ${i} ${i} V ${h - i} H ${w - i} V ${i} Z`;
  let out = `<path d="${ring}" fill="${fill}" fill-rule="evenodd"/>` +
            `<path d="${ring}" fill="url(#mb-${pattern})" fill-rule="evenodd"/>`;

  for (const inv of [o, i, o - band * 0.32]) {
    out += `<rect x="${f(inv)}" y="${f(inv)}" width="${f(w - inv * 2)}" height="${f(h - inv * 2)}"
      fill="none" stroke="${MB.ink}" stroke-width="${inv === o - band * 0.32 ? sw * 0.6 : sw}"/>`;
  }

  // Corner rosettes — the traditional corner treatment.
  const rng = new Rng(seed);
  const cr = band * 0.62;
  for (const [cx, cy] of [[i, i], [w - i, i], [i, h - i], [w - i, h - i]]) {
    out += `<g transform="translate(${f(cx)},${f(cy)})">`;
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      out += `<ellipse cx="${f(Math.cos(a) * cr * 0.55)}" cy="${f(Math.sin(a) * cr * 0.55)}"
        rx="${f(cr * 0.3)}" ry="${f(cr * 0.16)}" transform="rotate(${f(a * 180 / Math.PI)} ${f(Math.cos(a) * cr * 0.55)} ${f(Math.sin(a) * cr * 0.55)})"
        fill="${MB.ochre}" stroke="${MB.ink}" stroke-width="2.4"/>`;
    }
    out += `<circle r="${f(cr * 0.26)}" fill="${MB.indigo}" stroke="${MB.ink}" stroke-width="2.6"/></g>`;
  }
  return out;
}

// --- Motifs ----------------------------------------------------------------

/** Fish — prosperity and fertility, the most common Mithila motif. */
export function fish(len, opts = {}) {
  const { body = MB.indigo, fin = MB.ochre, pattern = 'scale', sw = 4.5 } = opts;
  const h = len * 0.46;
  const d = `M ${f(-len / 2)} 0 Q ${f(-len * 0.18)} ${f(-h / 2)}, ${f(len * 0.28)} ${f(-h * 0.34)}
             Q ${f(len * 0.44)} ${f(-h * 0.2)}, ${f(len * 0.5)} 0
             Q ${f(len * 0.44)} ${f(h * 0.2)}, ${f(len * 0.28)} ${f(h * 0.34)}
             Q ${f(-len * 0.18)} ${f(h / 2)}, ${f(-len / 2)} 0 Z`;
  const tail = `M ${f(-len / 2)} 0 L ${f(-len * 0.74)} ${f(-h * 0.46)} L ${f(-len * 0.66)} 0 L ${f(-len * 0.74)} ${f(h * 0.46)} Z`;
  return ink(tail, fin, { sw: sw * 0.8 }) + ink(d, body, { pattern, sw }) +
    `<circle cx="${f(len * 0.3)}" cy="${f(-h * 0.08)}" r="${f(h * 0.11)}" fill="${MB.white}" stroke="${MB.ink}" stroke-width="2.6"/>` +
    `<circle cx="${f(len * 0.31)}" cy="${f(-h * 0.08)}" r="${f(h * 0.05)}" fill="${MB.ink}"/>`;
}

/** Lotus — the Mithila version: pointed petals, heavy outline, patterned. */
export function mbLotus(r, opts = {}) {
  const { petals = 10, outer = MB.pink, innerCol = MB.red, centre = MB.ochre, pattern = 'hatch2', sw = 4 } = opts;
  let out = '';
  for (let layer = 0; layer < 2; layer++) {
    const n = petals - layer * 2;
    const rr = layer === 0 ? r : r * 0.66;
    const col = layer === 0 ? outer : innerCol;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + (layer ? Math.PI / n : 0);
      const tx = Math.cos(a) * rr, ty = Math.sin(a) * rr;
      const w = rr * 0.3;
      const nx = Math.cos(a + Math.PI / 2) * w, ny = Math.sin(a + Math.PI / 2) * w;
      const d = `M 0 0 Q ${f(nx + tx * 0.5)} ${f(ny + ty * 0.5)}, ${f(tx)} ${f(ty)}
                 Q ${f(-nx + tx * 0.5)} ${f(-ny + ty * 0.5)}, 0 0 Z`;
      out += ink(d, col, { pattern: layer === 0 ? pattern : null, sw });
    }
  }
  out += ink(tornEllipse(r * 0.2, r * 0.2, { seed: 'mbl', amp: 1.5 }), centre, { pattern: 'dots', sw });
  return out;
}

/**
 * Surya. `face` controls the register:
 *   'solemn'  elongated eyes, level mouth, tilak — traditional and dignified
 *   'none'    no face at all, a mandala centre instead
 *   'smile'   the friendly version; reads as children's content, use with care
 */
export function sunFace(r, opts = {}) {
  const { disc = MB.ochre, rays = 16, rayCol = MB.red, sw = 4.5, face = 'solemn' } = opts;
  let out = '';
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * Math.PI * 2;
    const p = (ang, rad) => `${f(Math.cos(ang) * rad)} ${f(Math.sin(ang) * rad)}`;
    const hw = (Math.PI * 2 / rays) * 0.34;
    out += ink(`M ${p(a - hw, r)} L ${p(a, r * 1.55)} L ${p(a + hw, r)} Z`, rayCol, { sw: sw * 0.7 });
  }
  out += ink(tornEllipse(r, r, { seed: 'sun', amp: 2 }), disc, { pattern: 'stipple', sw });

  if (face === 'none') {
    // concentric mandala centre — no face, fully dignified
    out += ink(tornEllipse(r * 0.52, r * 0.52, { seed: 'sunc1', amp: 1.5 }), MB.deepRed, { sw: sw * 0.8 });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      out += `<ellipse cx="${f(Math.cos(a) * r * 0.52)}" cy="${f(Math.sin(a) * r * 0.52)}"
        rx="${f(r * 0.17)}" ry="${f(r * 0.09)}" transform="rotate(${f(a * 180 / Math.PI)} ${f(Math.cos(a) * r * 0.52)} ${f(Math.sin(a) * r * 0.52)})"
        fill="${MB.cream}" stroke="${MB.ink}" stroke-width="${f(sw * 0.6)}"/>`;
    }
    out += ink(tornEllipse(r * 0.22, r * 0.22, { seed: 'sunc2', amp: 1.2 }), MB.cream, { sw: sw * 0.8 });
    return out;
  }

  // Mithila eyes are long and almond-shaped, not round.
  for (const s of [-1, 1]) {
    const cx = s * r * 0.33;
    out += `<path d="M ${f(cx - r * 0.2)} ${f(-r * 0.1)} Q ${f(cx)} ${f(-r * 0.26)}, ${f(cx + r * 0.2)} ${f(-r * 0.1)}
              Q ${f(cx)} ${f(-r * 0.01)}, ${f(cx - r * 0.2)} ${f(-r * 0.1)} Z"
              fill="${MB.white}" stroke="${MB.ink}" stroke-width="${f(sw * 0.65)}"/>
            <circle cx="${f(cx)}" cy="${f(-r * 0.11)}" r="${f(r * 0.062)}" fill="${MB.ink}"/>`;
  }
  // tilak
  out += `<path d="M 0 ${f(-r * 0.46)} L 0 ${f(-r * 0.28)}" stroke="${MB.deepRed}"
    stroke-width="${f(sw * 1.3)}" stroke-linecap="round"/>`;

  out += face === 'smile'
    ? `<path d="M ${f(-r * 0.26)} ${f(r * 0.28)} q ${f(r * 0.26)} ${f(r * 0.22)}, ${f(r * 0.52)} 0"
         fill="none" stroke="${MB.ink}" stroke-width="${f(sw * 0.75)}" stroke-linecap="round"/>`
    // level mouth: present, composed, not cheerful
    : `<path d="M ${f(-r * 0.2)} ${f(r * 0.3)} L ${f(r * 0.2)} ${f(r * 0.3)}"
         fill="none" stroke="${MB.ink}" stroke-width="${f(sw * 0.8)}" stroke-linecap="round"/>
       <path d="M ${f(-r * 0.3)} ${f(r * 0.12)} q ${f(r * 0.12)} ${f(-r * 0.06)}, ${f(r * 0.22)} 0"
         fill="none" stroke="${MB.ink}" stroke-width="${f(sw * 0.5)}" stroke-linecap="round" opacity="0.7"/>
       <path d="M ${f(r * 0.08)} ${f(r * 0.12)} q ${f(r * 0.12)} ${f(-r * 0.06)}, ${f(r * 0.22)} 0"
         fill="none" stroke="${MB.ink}" stroke-width="${f(sw * 0.5)}" stroke-linecap="round" opacity="0.7"/>`;
  return out;
}

/** Kalash — the ritual pot, for auspicious/festival beats. */
export function kalash(w, opts = {}) {
  const { body = MB.red, neck = MB.ochre, pattern = 'wave', sw = 4.5 } = opts;
  const h = w * 1.12;
  const pot = `M ${f(-w * 0.34)} ${f(-h * 0.3)} Q ${f(-w * 0.56)} 0, ${f(-w * 0.4)} ${f(h * 0.28)}
               Q ${f(-w * 0.28)} ${f(h * 0.46)}, 0 ${f(h * 0.46)}
               Q ${f(w * 0.28)} ${f(h * 0.46)}, ${f(w * 0.4)} ${f(h * 0.28)}
               Q ${f(w * 0.56)} 0, ${f(w * 0.34)} ${f(-h * 0.3)} Z`;
  const rim = `M ${f(-w * 0.44)} ${f(-h * 0.3)} L ${f(w * 0.44)} ${f(-h * 0.3)} L ${f(w * 0.34)} ${f(-h * 0.42)} L ${f(-w * 0.34)} ${f(-h * 0.42)} Z`;

  let out = ink(pot, body, { pattern, sw }) + ink(rim, neck, { sw: sw * 0.8 });

  // Mango leaves: five pointed leaves fanned upward from the rim. Drawn as
  // individual leaves rather than one sweep, or they read as a green band.
  const leafAngles = [-1.15, -0.62, 0, 0.62, 1.15];
  for (const a of leafAngles) {
    const L = h * 0.42;
    const tipX = Math.sin(a) * L * 1.15, tipY = -h * 0.42 - Math.cos(a) * L;
    const baseY = -h * 0.36;
    const midX = Math.sin(a) * L * 0.62, midY = -h * 0.42 - Math.cos(a) * L * 0.5;
    const wid = h * 0.1;
    const px = Math.cos(a) * wid, py = Math.sin(a) * wid;
    out += ink(`M 0 ${f(baseY)}
                Q ${f(midX + px)} ${f(midY + py)}, ${f(tipX)} ${f(tipY)}
                Q ${f(midX - px)} ${f(midY - py)}, 0 ${f(baseY)} Z`,
      MB.green, { pattern: 'vline', sw: sw * 0.65 });
  }
  out += `<g transform="translate(0,${f(-h * 0.92)})">` +
    ink(tornEllipse(w * 0.2, w * 0.23, { seed: 'kal', amp: 1.5 }), MB.brown, { pattern: 'stipple', sw: sw * 0.8 }) +
    `</g>`;
  return out;
}

/** Peacock — Mithila's signature bird. */
export function peacock(h, opts = {}) {
  const { body = MB.indigo, tail = MB.green, eye = MB.ochre, sw = 4.5 } = opts;
  let out = '';

  // Fanned tail behind everything, each feather with an eye-spot.
  const feathers = 9;
  for (let i = 0; i < feathers; i++) {
    const a = -Math.PI * 0.88 + (i / (feathers - 1)) * Math.PI * 0.76;
    const len = h * 0.92;
    const tx = Math.cos(a) * len, ty = Math.sin(a) * len;
    out += `<path d="M 0 0 Q ${f(tx * 0.5)} ${f(ty * 0.5 - h * 0.05)}, ${f(tx)} ${f(ty)}"
              stroke="${MB.ink}" stroke-width="${f(sw * 0.7)}" fill="none"/>`;
    out += `<g transform="translate(${f(tx)},${f(ty)})">` +
      ink(`M ${f(-h * 0.085)} 0 a ${f(h * 0.085)} ${f(h * 0.105)} 0 1 0 ${f(h * 0.17)} 0 a ${f(h * 0.085)} ${f(h * 0.105)} 0 1 0 ${f(-h * 0.17)} 0 Z`,
        tail, { sw: sw * 0.7 }) +
      `<circle r="${f(h * 0.045)}" fill="${eye}" stroke="${MB.ink}" stroke-width="${f(sw * 0.5)}"/>` +
      `<circle r="${f(h * 0.018)}" fill="${MB.ink}"/></g>`;
  }

  // Body, then neck, then head — drawn in that order so each overlaps cleanly.
  out += ink(`M 0 ${f(h * 0.02)} Q ${f(-h * 0.22)} ${f(h * 0.24)}, ${f(-h * 0.04)} ${f(h * 0.46)}
              Q ${f(h * 0.14)} ${f(h * 0.3)}, 0 ${f(h * 0.02)} Z`, body, { pattern: 'scale', sw });
  out += `<path d="M ${f(-h * 0.02)} ${f(h * 0.1)} Q ${f(-h * 0.2)} ${f(-h * 0.06)}, ${f(-h * 0.17)} ${f(-h * 0.2)}"
            stroke="${body}" stroke-width="${f(h * 0.09)}" fill="none" stroke-linecap="round"/>
          <path d="M ${f(-h * 0.02)} ${f(h * 0.1)} Q ${f(-h * 0.2)} ${f(-h * 0.06)}, ${f(-h * 0.17)} ${f(-h * 0.2)}"
            stroke="${MB.ink}" stroke-width="${f(sw * 0.7)}" fill="none" fill-opacity="0"
            stroke-linecap="round" opacity="0.001"/>`;
  out += `<g transform="translate(${f(-h * 0.17)},${f(-h * 0.24)})">` +
    ink(tornEllipse(h * 0.085, h * 0.075, { seed: 'pkh', amp: 1.2 }), body, { sw: sw * 0.8 }) +
    `<circle cx="${f(-h * 0.02)}" cy="${f(-h * 0.01)}" r="${f(h * 0.018)}" fill="${MB.white}" stroke="${MB.ink}" stroke-width="2"/>` +
    // beak + crest
    `<path d="M ${f(-h * 0.08)} 0 L ${f(-h * 0.15)} ${f(h * 0.02)} L ${f(-h * 0.08)} ${f(h * 0.035)} Z"
       fill="${MB.ochre}" stroke="${MB.ink}" stroke-width="${f(sw * 0.6)}"/>
     <path d="M 0 ${f(-h * 0.075)} L 0 ${f(-h * 0.135)}" stroke="${MB.ink}" stroke-width="${f(sw * 0.6)}"/>
     <circle cy="${f(-h * 0.15)}" r="${f(h * 0.022)}" fill="${MB.ochre}" stroke="${MB.ink}" stroke-width="${f(sw * 0.5)}"/></g>`;
  return out;
}

/** Vastu grid, Mithila-styled — the workhorse for this channel. */
export function mbVastuGrid(size, opts = {}) {
  const {
    labels = null, highlight = null, fill = MB.cream, hiFill = MB.red,
    seed = 'mbgrid', sw = 4.5, pattern = null, labelSize = null,
  } = opts;
  const c = size / 3;
  let out = '';
  for (let r = 0; r < 3; r++) {
    for (let col = 0; col < 3; col++) {
      const i = r * 3 + col;
      const x = -size / 2 + col * c, y = -size / 2 + r * c;
      const hi = highlight === i;
      out += `<g transform="translate(${f(x)},${f(y)})">` +
        ink(tornRect(c, c, { seed: seed + i, amp: 2, style: 'cut' }), hi ? hiFill : fill,
            { pattern: hi ? 'hatch2' : pattern, sw }) +
        (labels?.[i]
          ? `<text x="${f(c / 2)}" y="${f(c / 2 + c * 0.07)}" text-anchor="middle"
               font-family="var(--font-deva)" font-size="${f(labelSize ?? c * 0.19)}"
               font-weight="700" fill="${hi ? MB.cream : MB.ink}">${labels[i]}</text>`
          : '') + `</g>`;
    }
  }
  return out;
}

/** A Mithila figure: frontal, angular, fish-shaped eyes, patterned clothing. */
export function mbFigure(scale = 1, opts = {}) {
  const { skin = MB.ochre, robe = MB.red, robePattern = 'hatch2', hair = MB.ink, sw = 4.5, eyes = 'open' } = opts;
  const S = v => f(v * scale);
  let out = '';
  // body
  out += ink(`M ${S(-70)} ${S(170)} L ${S(-46)} ${S(44)} Q 0 ${S(24)}, ${S(46)} ${S(44)} L ${S(70)} ${S(170)} Z`,
    robe, { pattern: robePattern, sw });
  // arms — drawn as clear limbs outside the robe silhouette, or they read as
  // part of the garment and the figure looks like a bust
  for (const s of [-1, 1]) {
    out += ink(`M ${S(s * 42)} ${S(52)} Q ${S(s * 104)} ${S(74)}, ${S(s * 96)} ${S(150)}
                L ${S(s * 66)} ${S(152)} Q ${S(s * 74)} ${S(96)}, ${S(s * 26)} ${S(78)} Z`,
      skin, { sw: sw * 0.85 });
    out += `<circle cx="${S(s * 81)}" cy="${S(158)}" r="${S(13)}" fill="${skin}" stroke="${MB.ink}" stroke-width="${S(3.6)}"/>`;
  }
  // head
  out += ink(tornEllipse(52 * scale, 58 * scale, { seed: 'mbh', amp: 2 }), skin, { sw });
  // hair as a heavy arc
  out += ink(`M ${S(-54)} ${S(-8)} Q ${S(-48)} ${S(-66)}, 0 ${S(-62)} Q ${S(48)} ${S(-66)}, ${S(54)} ${S(-8)}
              Q ${S(26)} ${S(-34)}, 0 ${S(-32)} Q ${S(-26)} ${S(-34)}, ${S(-54)} ${S(-8)} Z`, hair, { sw: sw * 0.7 });
  // the defining feature: large fish-shaped eyes
  for (const s of [-1, 1]) {
    const cx = S(s * 21);
    out += `<path d="M ${f(cx - 22 * scale)} ${S(-6)} Q ${cx} ${S(-24)}, ${f(cx + 22 * scale)} ${S(-6)}
              Q ${cx} ${S(12)}, ${f(cx - 22 * scale)} ${S(-6)} Z"
              fill="${MB.white}" stroke="${MB.ink}" stroke-width="${S(3.4)}"/>
            <circle cx="${cx}" cy="${S(-5)}" r="${S(7)}" fill="${MB.ink}"/>`;
  }
  out += `<path d="M 0 ${S(2)} L 0 ${S(22)}" stroke="${MB.ink}" stroke-width="${S(3.2)}" stroke-linecap="round"/>
          <path d="M ${S(-16)} ${S(34)} q ${S(16)} ${S(12)}, ${S(32)} 0" fill="none" stroke="${MB.ink}" stroke-width="${S(3.4)}" stroke-linecap="round"/>
          <circle cx="0" cy="${S(-40)}" r="${S(7)}" fill="${MB.red}" stroke="${MB.ink}" stroke-width="${S(2.6)}"/>`;
  return out;
}

/** Repeating motif band — section dividers and under-title rules. */
export function mbBand(w, opts = {}) {
  const { h = 46, fill = MB.ochre, pattern = 'chevron', sw = 4 } = opts;
  return `<g transform="translate(${f(-w / 2)},${f(-h / 2)})">` +
    ink(`M 0 0 H ${f(w)} V ${f(h)} H 0 Z`, fill, { pattern, sw }) + `</g>`;
}

/**
 * Chulha — the clay hearth. Shown whenever the narration says रसोई, because a
 * viewer should see the thing being talked about, not a diagram of where it goes.
 * Flame is a separate group so it can flicker independently.
 */
export function chulha(w, opts = {}) {
  const { clay = '#B45F38', mouth = '#5A2A18', fire = MB.ochre, fireTip = MB.red,
          pot = MB.indigo, sw = 4.5, withPot = true } = opts;
  const h = w * 0.62;
  let out = '';

  // Clay body: a trapezium, wider at the base. Reads as a stove at thumbnail size.
  out += ink(`M ${f(-w * 0.5)} ${f(h * 0.5)} L ${f(-w * 0.38)} ${f(-h * 0.5)}
              L ${f(w * 0.38)} ${f(-h * 0.5)} L ${f(w * 0.5)} ${f(h * 0.5)} Z`,
    clay, { pattern: 'stipple', sw });

  // Fire mouth: an arch, not a black slab. Dark warm brown so the flame reads.
  out += ink(`M ${f(-w * 0.24)} ${f(h * 0.5)} L ${f(-w * 0.24)} ${f(-h * 0.02)}
              Q 0 ${f(-h * 0.3)}, ${f(w * 0.24)} ${f(-h * 0.02)}
              L ${f(w * 0.24)} ${f(h * 0.5)} Z`, mouth, { sw: sw * 0.8 });

  // Flames inside the mouth
  for (const [dx, sc] of [[-w * 0.1, 0.7], [0, 1], [w * 0.1, 0.72]]) {
    out += `<g transform="translate(${f(dx)},${f(h * 0.34)}) scale(${f(sc)})">` +
      ink(`M 0 ${f(-h * 0.5)} Q ${f(w * 0.11)} ${f(-h * 0.2)}, 0 0
           Q ${f(-w * 0.11)} ${f(-h * 0.2)}, 0 ${f(-h * 0.5)} Z`, fire, { sw: sw * 0.55 }) +
      ink(`M 0 ${f(-h * 0.33)} Q ${f(w * 0.055)} ${f(-h * 0.14)}, 0 ${f(-h * 0.02)}
           Q ${f(-w * 0.055)} ${f(-h * 0.14)}, 0 ${f(-h * 0.33)} Z`, fireTip, { sw: sw * 0.45 }) +
      `</g>`;
  }

  // Top slab the pot sits on
  out += ink(`M ${f(-w * 0.46)} ${f(-h * 0.5)} L ${f(w * 0.46)} ${f(-h * 0.5)}
              L ${f(w * 0.42)} ${f(-h * 0.66)} L ${f(-w * 0.42)} ${f(-h * 0.66)} Z`,
    MB.ochre, { pattern: 'hline', sw: sw * 0.8 });

  if (withPot) {
    out += `<g transform="translate(0,${f(-h * 0.95)})">`;
    // round-bellied handi
    out += ink(`M ${f(-w * 0.3)} ${f(-h * 0.02)} Q ${f(-w * 0.4)} ${f(h * 0.34)}, 0 ${f(h * 0.36)}
                Q ${f(w * 0.4)} ${f(h * 0.34)}, ${f(w * 0.3)} ${f(-h * 0.02)} Z`,
      pot, { pattern: 'wave', sw });
    // rim
    out += ink(`M ${f(-w * 0.36)} ${f(-h * 0.02)} L ${f(w * 0.36)} ${f(-h * 0.02)}
                L ${f(w * 0.3)} ${f(-h * 0.16)} L ${f(-w * 0.3)} ${f(-h * 0.16)} Z`,
      MB.cream, { sw: sw * 0.75 });
    out += `</g>`;
  }
  return out;
}

/** Steam / smoke curl — rises off the pot, or incense. */
export function mbSteam(h, opts = {}) {
  const { stroke = MB.ink, width = 4, waves = 3, opacity = 0.55 } = opts;
  let d = 'M 0 0';
  for (let i = 0; i < waves; i++) {
    const seg = h / waves, dir = i % 2 ? 1 : -1;
    d += ` q ${f(dir * seg * 0.5)} ${f(-seg * 0.5)}, 0 ${f(-seg)}`;
  }
  return `<path d="${d}" stroke="${stroke}" stroke-width="${width}" fill="none"
    stroke-linecap="round" opacity="${opacity}"/>`;
}

/** A compass rose — orients the viewer before the grid appears. */
export function compass(r, opts = {}) {
  const { fill = MB.ochre, accent = MB.red, sw = 4, labels = ['उ', 'पू', 'द', 'प'] } = opts;
  let out = '';
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 - Math.PI / 2;
    const p = (ang, rad) => `${f(Math.cos(ang) * rad)} ${f(Math.sin(ang) * rad)}`;
    const hw = 0.3;
    out += ink(`M ${p(a, r)} L ${p(a + hw, r * 0.3)} L ${p(a + Math.PI, r * 0.16)} L ${p(a - hw, r * 0.3)} Z`,
      i === 0 ? accent : fill, { sw: sw * 0.8 });
  }
  out += ink(tornEllipse(r * 0.15, r * 0.15, { seed: 'cmp', amp: 1.2 }), MB.cream, { sw });
  // The needle is its own group so a scene can swing IT, leaving the rose
  // upright — rotating the whole rose just turns it into an X.
  out += `<g class="compass-needle">` +
    ink(`M 0 ${f(-r * 0.86)} L ${f(r * 0.13)} 0 L 0 ${f(r * 0.2)} L ${f(-r * 0.13)} 0 Z`, MB.red, { sw: sw * 0.7 }) +
    `</g>`;
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 - Math.PI / 2;
    out += `<text x="${f(Math.cos(a) * r * 1.24)}" y="${f(Math.sin(a) * r * 1.24 + r * 0.07)}"
      text-anchor="middle" font-family="var(--font-deva)" font-size="${f(r * 0.26)}"
      font-weight="700" fill="${MB.ink}">${labels[i]}</text>`;
  }
  return out;
}
