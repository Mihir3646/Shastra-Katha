import { tornRect, tornEllipse, blob, tornStrip, hills, smoothClosedPath } from './paper.js';
import { Rng } from './prng.js';

// ---------------------------------------------------------------------------
// Papercraft component kit.
//
// Every builder returns SVG markup drawn around the ORIGIN, so the stage can
// translate/rotate/scale it about its own centre. Builders never animate — they
// only describe a shape; motion lives in the timeline.
// ---------------------------------------------------------------------------

export const PALETTE = {
  cream:    '#F7F1E1',
  paper:    '#EDE5D2',
  card:     '#FBF7EC',
  ink:      '#28323E',
  inkSoft:  '#4A5260',
  red:      '#E2553D',
  rust:     '#C2452F',
  saffron:  '#E8A020',
  gold:     '#F0C04A',
  marigold: '#F2953A',
  teal:     '#2E9E92',
  mint:     '#9FD4B6',
  sky:      '#8FC4DB',
  deepBlue: '#27406B',
  night:    '#1E2440',
  plum:     '#6C4A7E',
  rose:     '#E4A0AC',
  maroon:   '#7B2D3B',
  wood:     '#B4874F',
  woodDark: '#8C6238',
  leaf:     '#5FA35C',
  sand:     '#D9C7A3',
};

const f = n => (Math.round(n * 100) / 100);

/** Die-cut paper edge: cream border outside, colour inside. */
export function cut(d, fill, opts = {}) {
  const { border = PALETTE.card, bw = 7, extra = '' } = opts;
  const stroke = bw > 0
    ? ` stroke="${border}" stroke-width="${bw * 2}" stroke-linejoin="round" paint-order="stroke"`
    : '';
  return `<path d="${d}" fill="${fill}"${stroke}${extra ? ' ' + extra : ''}/>`;
}

/** A rectangular paper card, centred on the origin. */
export function card(w, h, fill = PALETTE.card, opts = {}) {
  const { seed = 'card', amp = 4, style = 'cut', bw = 0, border, texture } = opts;
  const d = tornRect(w, h, { seed, amp, style });
  const inner = texture ? `<path d="${d}" fill="url(#${texture})"/>` : '';
  return `<g transform="translate(${f(-w / 2)},${f(-h / 2)})">${cut(d, fill, { bw, border })}${inner}</g>`;
}

/** A disc — planets, suns, chakra centres, coins. */
export function disc(r, fill, opts = {}) {
  const { seed = 'disc', amp = 3, style = 'cut', bw = 0, border } = opts;
  return cut(tornEllipse(r, r, { seed, amp, style }), fill, { bw, border });
}

/** Radial rays. The reference uses this for every "something arrives" beat. */
export function sunburst(r, opts = {}) {
  const { rays = 24, fill = '#ffffff', opacity = 0.18, inner = 0, taper = 0.45, seed = 'burst' } = opts;
  const rng = new Rng(seed);
  let out = '';
  for (let i = 0; i < rays; i++) {
    const a0 = (i / rays) * Math.PI * 2;
    const half = ((Math.PI * 2) / rays) * taper * (0.75 + rng.next() * 0.5);
    const p = (ang, rad) => `${f(Math.cos(ang) * rad)} ${f(Math.sin(ang) * rad)}`;
    out += `<path d="M ${p(a0 - half, inner)} L ${p(a0 - half * 0.55, r)} L ${p(a0 + half * 0.55, r)} L ${p(a0 + half, inner)} Z" fill="${fill}" opacity="${opacity}"/>`;
  }
  return out;
}

/** Concentric mandala rings — a workhorse for spiritual content. */
export function mandala(r, opts = {}) {
  const { rings = 4, petals = 12, fill = PALETTE.saffron, alt = PALETTE.rust, seed = 'mandala', opacity = 1 } = opts;
  let out = '';
  for (let ring = rings; ring >= 1; ring--) {
    const rr = (r * ring) / rings;
    const col = ring % 2 ? fill : alt;
    if (ring === rings) {
      out += `<path d="${tornEllipse(rr, rr, { seed: seed + ring, amp: 3, style: 'cut' })}" fill="${col}" opacity="${opacity}"/>`;
    } else {
      const n = petals * (ring % 2 ? 1 : 1);
      let petalsMarkup = '';
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + (ring % 2 ? 0 : Math.PI / n);
        const px = Math.cos(a) * rr * 0.78, py = Math.sin(a) * rr * 0.78;
        petalsMarkup += `<ellipse cx="${f(px)}" cy="${f(py)}" rx="${f(rr * 0.2)}" ry="${f(rr * 0.13)}"
          transform="rotate(${f((a * 180) / Math.PI)} ${f(px)} ${f(py)})" fill="${col}" opacity="${opacity}"/>`;
      }
      out += petalsMarkup;
    }
  }
  return out;
}

/** Lotus flower, petals fanned from the base. */
export function lotus(r, opts = {}) {
  const { petals = 9, fill = PALETTE.rose, deep = '#D2788C', center = PALETTE.gold, seed = 'lotus' } = opts;
  let out = '';
  const spread = Math.PI * 0.92;
  for (let layer = 0; layer < 2; layer++) {
    const n = layer === 0 ? petals : petals - 2;
    const rr = layer === 0 ? r : r * 0.68;
    const col = layer === 0 ? deep : fill;
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0.5 : i / (n - 1);
      const a = -Math.PI / 2 - spread / 2 + t * spread;
      const tipX = Math.cos(a) * rr, tipY = Math.sin(a) * rr;
      const w = rr * 0.26;
      const nx = Math.cos(a + Math.PI / 2) * w, ny = Math.sin(a + Math.PI / 2) * w;
      out += `<path d="M 0 0 Q ${f(nx + tipX * 0.55)} ${f(ny + tipY * 0.55)}, ${f(tipX)} ${f(tipY)}
        Q ${f(-nx + tipX * 0.55)} ${f(-ny + tipY * 0.55)}, 0 0 Z"
        fill="${col}" stroke="${PALETTE.card}" stroke-width="3" stroke-linejoin="round" paint-order="stroke"/>`;
    }
  }
  out += `<path d="${tornEllipse(r * 0.17, r * 0.14, { seed, amp: 2 })}" fill="${center}"/>`;
  return out;
}

/** Diya / oil lamp with a flame. Flame is its own group so it can flicker. */
export function diya(w, opts = {}) {
  const { bowl = '#B5552F', rim = '#8E3E22', flame = PALETTE.gold, flameTip = PALETTE.marigold } = opts;
  const h = w * 0.42;
  return `
  <g class="diya-bowl">
    <path d="M ${f(-w / 2)} 0 Q ${f(-w / 2)} ${f(h)}, 0 ${f(h)} Q ${f(w / 2)} ${f(h)}, ${f(w / 2)} 0 Z"
      fill="${bowl}" stroke="${PALETTE.card}" stroke-width="4" stroke-linejoin="round" paint-order="stroke"/>
    <ellipse cx="0" cy="0" rx="${f(w / 2)}" ry="${f(w * 0.1)}" fill="${rim}"/>
  </g>
  <g class="diya-flame" transform="translate(0,${f(-w * 0.06)})">
    <path d="M 0 ${f(-w * 0.44)} Q ${f(w * 0.15)} ${f(-w * 0.16)}, 0 ${f(-w * 0.02)} Q ${f(-w * 0.15)} ${f(-w * 0.16)}, 0 ${f(-w * 0.44)} Z" fill="${flame}"/>
    <path d="M 0 ${f(-w * 0.3)} Q ${f(w * 0.07)} ${f(-w * 0.13)}, 0 ${f(-w * 0.04)} Q ${f(-w * 0.07)} ${f(-w * 0.13)}, 0 ${f(-w * 0.3)} Z" fill="${flameTip}"/>
  </g>`;
}

/** The 9-square vastu / navagraha grid. Cells are addressable for highlighting. */
export function vastuGrid(size, opts = {}) {
  const { stroke = PALETTE.ink, fill = 'none', seed = 'vastu', labels = null, cellFill = null } = opts;
  const c = size / 3;
  let out = '';
  for (let r = 0; r < 3; r++) {
    for (let col = 0; col < 3; col++) {
      const i = r * 3 + col;
      const x = -size / 2 + col * c, y = -size / 2 + r * c;
      const bg = cellFill?.[i] ?? fill;
      out += `<g class="vastu-cell" data-cell="${i}" transform="translate(${f(x)},${f(y)})">
        <path d="${tornRect(c, c, { seed: seed + i, amp: 2.5, style: 'cut' })}" fill="${bg}" stroke="${stroke}" stroke-width="3"/>
        ${labels?.[i] ? `<text x="${f(c / 2)}" y="${f(c / 2 + 10)}" text-anchor="middle" font-size="${f(c * 0.2)}" fill="${stroke}" font-family="var(--font-hand)">${labels[i]}</text>` : ''}
      </g>`;
    }
  }
  return out;
}

/** Simple zodiac / chakra wheel with N labelled segments. */
export function wheel(r, opts = {}) {
  const { segments = 12, colors = [PALETTE.saffron, PALETTE.teal, PALETTE.rose, PALETTE.sky], glyphs = null, seed = 'wheel', ring = 0.42 } = opts;
  let out = `<path d="${tornEllipse(r, r, { seed, amp: 3, style: 'cut' })}" fill="${PALETTE.card}"/>`;
  const inner = r * ring;
  for (let i = 0; i < segments; i++) {
    const a0 = (i / segments) * Math.PI * 2 - Math.PI / 2;
    const a1 = ((i + 1) / segments) * Math.PI * 2 - Math.PI / 2;
    const p = (a, rad) => `${f(Math.cos(a) * rad)} ${f(Math.sin(a) * rad)}`;
    const large = 0;
    out += `<path d="M ${p(a0, inner)} L ${p(a0, r)} A ${f(r)} ${f(r)} 0 ${large} 1 ${p(a1, r)} L ${p(a1, inner)} A ${f(inner)} ${f(inner)} 0 ${large} 0 ${p(a0, inner)} Z"
      fill="${colors[i % colors.length]}" opacity="0.9" stroke="${PALETTE.card}" stroke-width="2.5"/>`;
    if (glyphs?.[i]) {
      const am = (a0 + a1) / 2, rm = (r + inner) / 2;
      out += `<text x="${f(Math.cos(am) * rm)}" y="${f(Math.sin(am) * rm + r * 0.05)}" text-anchor="middle"
        font-size="${f(r * 0.17)}" fill="${PALETTE.ink}" font-family="var(--font-display)">${glyphs[i]}</text>`;
    }
  }
  return out;
}

/** Layered paper hills — every outdoor scene needs these. */
export function hillRange(w, h, opts = {}) {
  const { layers = 3, colors = ['#3B3F6B', '#4C5183', '#5E639B'], seed = 'hills', peaks = 4 } = opts;
  let out = '';
  for (let i = 0; i < layers; i++) {
    const lh = h * (0.5 + (i / layers) * 0.5);
    out += `<g transform="translate(0,${f(h - lh)})"><path d="${hills(w, lh, { seed: seed + i, peaks: peaks + i, roughness: 0.3 })}" fill="${colors[i % colors.length]}"/></g>`;
  }
  return out;
}

/** Star field. Deterministic positions; twinkle is driven from the timeline. */
export function stars(w, h, opts = {}) {
  const { count = 60, seed = 'stars', fill = '#FFF6D8' } = opts;
  const rng = new Rng(seed);
  let out = '';
  for (let i = 0; i < count; i++) {
    const x = rng.range(0, w), y = rng.range(0, h * 0.75), r = rng.range(1.2, 3.4);
    out += `<circle class="star" data-i="${i}" cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${fill}" opacity="${f(rng.range(0.35, 1))}"/>`;
  }
  return out;
}

/** Crescent moon, cut from two overlapping discs. */
export function moon(r, opts = {}) {
  const { fill = '#F5E6B8', phase = 0.42, seed = 'moon' } = opts;
  const id = 'moonclip-' + seed;
  return `<defs><mask id="${id}">
      <path d="${tornEllipse(r, r, { seed, amp: 2 })}" fill="#fff"/>
      <circle cx="${f(r * phase * 1.5)}" cy="${f(-r * 0.12)}" r="${f(r * 0.92)}" fill="#000"/>
    </mask></defs>
    <path d="${tornEllipse(r, r, { seed, amp: 2 })}" fill="${fill}" mask="url(#${id})"/>`;
}

/**
 * Puffy paper cloud. Built from overlapping torn discs rather than one blob —
 * a single smoothed outline just reads as a flat ellipse at this scale.
 */
export function cloud(w, opts = {}) {
  const { fill = PALETTE.card, seed = 'cloud', opacity = 1, puffs = 5 } = opts;
  const rng = new Rng(seed + ':cloud');
  const r = w * 0.27;
  let out = '';
  for (let i = 0; i < puffs; i++) {
    const t = puffs === 1 ? 0.5 : i / (puffs - 1);
    const x = (t - 0.5) * w * 0.66;
    // taller in the middle, flat along the bottom
    const bump = Math.sin(t * Math.PI);
    const rr = r * (0.55 + bump * 0.55) * rng.range(0.9, 1.12);
    const y = -bump * r * 0.34 + rng.jitter(r * 0.06);
    out += `<path d="${tornEllipse(rr, rr * 0.92, { seed: seed + i, amp: 2.5, style: 'cut' })}"
      transform="translate(${f(x)},${f(y)})" fill="${fill}"/>`;
  }
  // flat base so the puffs read as one cloud, not a row of balls
  out += `<path d="${tornRect(w * 0.82, r * 0.72, { seed: seed + 'base', amp: 2.5, style: 'cut' })}"
    transform="translate(${f(-w * 0.41)},${f(-r * 0.04)})" fill="${fill}"/>`;
  return `<g opacity="${opacity}">${out}</g>`;
}

/** Hand-drawn arrow, for pointing at things. */
export function arrow(len, opts = {}) {
  const { stroke = PALETTE.deepBlue, width = 6, curve = 0.28, head = 22 } = opts;
  const cx = len * 0.5, cy = -len * curve;
  return `<g fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round">
    <path d="M 0 0 Q ${f(cx)} ${f(cy)}, ${f(len)} 0"/>
    <path d="M ${f(len)} 0 L ${f(len - head)} ${f(-head * 0.55)}"/>
    <path d="M ${f(len)} 0 L ${f(len - head * 0.9)} ${f(head * 0.62)}"/>
  </g>`;
}

/** Speech / thought bubble. `tail` in degrees points the spout. */
export function bubble(w, h, opts = {}) {
  const { fill = PALETTE.card, seed = 'bubble', tail = 210, thought = false, stroke = 'none' } = opts;
  const body = `<path d="${blob(Math.max(w, h) / 2, { seed, lobes: 7, irregularity: 0.12, amp: 3, style: 'cut' })}"
    fill="${fill}" stroke="${stroke}" stroke-width="3" transform="scale(${f(w / Math.max(w, h))},${f(h / Math.max(w, h))})"/>`;
  const a = (tail * Math.PI) / 180;
  const tx = Math.cos(a) * w * 0.44, ty = Math.sin(a) * h * 0.44;
  const spout = thought
    ? `<circle cx="${f(tx * 1.25)}" cy="${f(ty * 1.25)}" r="${f(h * 0.09)}" fill="${fill}"/>
       <circle cx="${f(tx * 1.55)}" cy="${f(ty * 1.55)}" r="${f(h * 0.055)}" fill="${fill}"/>`
    : `<path d="M ${f(tx * 0.7)} ${f(ty * 0.7)} L ${f(tx * 1.6)} ${f(ty * 1.7)} L ${f(tx * 1.15)} ${f(ty * 0.72)} Z" fill="${fill}"/>`;
  return body + spout;
}

/** Pushpin for pinning notes to boards. */
export function pin(r = 13, opts = {}) {
  const { fill = PALETTE.red, dark = '#A93826' } = opts;
  return `<g><circle cx="0" cy="0" r="${f(r)}" fill="${fill}"/>
    <circle cx="${f(-r * 0.3)}" cy="${f(-r * 0.3)}" r="${f(r * 0.32)}" fill="#fff" opacity="0.55"/>
    <path d="M 0 ${f(r * 0.6)} L ${f(r * 0.22)} ${f(r * 1.9)} L ${f(-r * 0.22)} ${f(r * 1.9)} Z" fill="${dark}"/></g>`;
}

/** Strip of masking tape, for sticking paper down. */
export function tape(w, h = 34, opts = {}) {
  const { fill = '#E8DCBE', opacity = 0.85, seed = 'tape' } = opts;
  const rng = new Rng(seed);
  const z = 5;
  let d = `M 0 0`;
  for (let i = 1; i <= z; i++) d += ` L ${f((i / z) * w)} ${f(rng.jitter(3))}`;
  d += ` L ${f(w)} ${f(h)}`;
  for (let i = z - 1; i >= 0; i--) d += ` L ${f((i / z) * w)} ${f(h + rng.jitter(3))}`;
  return `<path d="${d} Z" fill="${fill}" opacity="${opacity}" transform="translate(${f(-w / 2)},${f(-h / 2)})"/>`;
}

/** Torn strip used as a scene-wipe curtain or a ground line. */
export function strip(w, h, fill, opts = {}) {
  const { seed = 'strip', amp = 16, edges = 'bottom' } = opts;
  return `<path d="${tornStrip(w, h, { seed, amp, edges })}" fill="${fill}"/>`;
}

/**
 * Ransom-note lettering: each glyph on its own torn tile, jittered.
 * Returns { markup, width, letters } — `letters` lists per-tile transforms so a
 * scene can stagger them in individually.
 */
export function ransom(text, opts = {}) {
  const {
    size = 84, seed = 'ransom', gap = 6,
    tiles = [PALETTE.rose, PALETTE.saffron, PALETTE.teal, PALETTE.mint, PALETTE.ink, PALETTE.red, PALETTE.card, PALETTE.sky],
    inks = null, font = 'var(--font-display)', rotAmp = 5,
  } = opts;
  const rng = new Rng(seed);

  // Splitting with [...text] breaks Devanagari: it separates matras and
  // conjuncts from their base letter, so वास्तु becomes व ा स ् त ु. Segment by
  // grapheme cluster instead. And because Devanagari words are visually joined
  // by the shirorekha, scripts that use one tile a WORD rather than a letter.
  const joined = /[\u0900-\u097F\u0A80-\u0AFF\u0980-\u09FF\u0B80-\u0BFF\u0C00-\u0C7F\u0D00-\u0D7F]/.test(text);
  const unit = opts.unit ?? (joined ? 'word' : 'letter');

  let chars;
  if (unit === 'word') {
    chars = String(text).split(/(\s+)/).filter(t => t.length);
  } else if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    chars = [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text)].map(g => g.segment);
  } else {
    chars = [...text];
  }

  const cw = size * 0.72;
  let x = 0;
  const letters = [];
  let markup = '';
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (!ch.trim()) { x += cw * 0.55; continue; }
    const glyphs = unit === 'word'
      ? [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(ch)].length
      : 1;
    // Devanagari sets wider than Latin at the same point size, so word tiles
    // need more room than a naive glyph count suggests.
    const tw = cw * (unit === 'word' ? glyphs * 1.02 : 1) + size * 0.3;
    const th = size * 1.18;
    const bg = tiles[rng.int(0, tiles.length - 1)];
    const dark = ['#F7F1E1', '#FBF7EC', '#9FD4B6', '#F0C04A', '#E8A020', '#8FC4DB', '#E4A0AC'].includes(bg);
    const ink = inks?.[i] ?? (dark ? PALETTE.ink : PALETTE.cream);
    const rot = rng.jitter(rotAmp);
    const dy = rng.jitter(size * 0.06);
    letters.push({ i, x: x + tw / 2, y: dy, rot });
    markup += `<g class="ransom-letter" data-i="${i}" transform="translate(${f(x + tw / 2)},${f(dy)}) rotate(${f(rot)})">
      <path d="${tornRect(tw, th, { seed: seed + i, amp: 3.5, style: 'torn' })}" transform="translate(${f(-tw / 2)},${f(-th / 2)})" fill="${bg}"/>
      <text x="0" y="${f(size * 0.34)}" text-anchor="middle" font-family="${font}" font-size="${f(size)}" font-weight="700" fill="${ink}">${escapeXml(ch)}</text>
    </g>`;
    x += tw + gap;
  }
  const width = x - gap;
  return { markup: `<g transform="translate(${f(-width / 2)},0)">${markup}</g>`, width, letters };
}

export function escapeXml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
}

/**
 * A simple cutout character: head, body, two arms. Parts carry classes so the
 * timeline can rotate limbs independently (`.arm-l`, `.arm-r`, `.head`).
 */
export function figure(opts = {}) {
  const {
    scale = 1, skin = '#F0C9A4', hair = '#3B2B22', robe = PALETTE.saffron,
    robeDark = '#C9821A', seed = 'figure', eyes = 'open', mouth = 'smile', beard = false,
  } = opts;
  const S = v => f(v * scale);
  const eyeMarkup = eyes === 'closed'
    ? `<path d="M ${S(-26)} ${S(-16)} q ${S(10)} ${S(8)}, ${S(20)} 0" stroke="${PALETTE.ink}" stroke-width="${S(4)}" fill="none" stroke-linecap="round"/>
       <path d="M ${S(6)} ${S(-16)} q ${S(10)} ${S(8)}, ${S(20)} 0" stroke="${PALETTE.ink}" stroke-width="${S(4)}" fill="none" stroke-linecap="round"/>`
    : `<circle cx="${S(-16)}" cy="${S(-14)}" r="${S(6)}" fill="${PALETTE.ink}"/>
       <circle cx="${S(16)}" cy="${S(-14)}" r="${S(6)}" fill="${PALETTE.ink}"/>`;
  const mouthMarkup = mouth === 'smile'
    ? `<path d="M ${S(-13)} ${S(12)} q ${S(13)} ${S(12)}, ${S(26)} 0" stroke="${PALETTE.ink}" stroke-width="${S(4)}" fill="none" stroke-linecap="round"/>`
    : mouth === 'o'
    ? `<ellipse cx="0" cy="${S(15)}" rx="${S(8)}" ry="${S(10)}" fill="#8E3E22"/>`
    : `<path d="M ${S(-12)} ${S(15)} L ${S(12)} ${S(15)}" stroke="${PALETTE.ink}" stroke-width="${S(4)}" stroke-linecap="round"/>`;

  return `
  <g class="fig-body">
    <path d="${tornRect(110 * scale, 130 * scale, { seed: seed + 'b', amp: 4, style: 'cut' })}"
      transform="translate(${S(-55)},${S(46)})" fill="${robe}"
      stroke="${PALETTE.card}" stroke-width="${S(6)}" stroke-linejoin="round" paint-order="stroke"/>
    <g class="arm-l" transform="translate(${S(-46)},${S(66)})">
      <rect x="${S(-16)}" y="0" width="${S(30)}" height="${S(86)}" rx="${S(15)}" fill="${robeDark}"
        stroke="${PALETTE.card}" stroke-width="${S(5)}" paint-order="stroke"/>
      <circle cx="0" cy="${S(88)}" r="${S(15)}" fill="${skin}" stroke="${PALETTE.card}" stroke-width="${S(4)}" paint-order="stroke"/>
    </g>
    <g class="arm-r" transform="translate(${S(46)},${S(66)})">
      <rect x="${S(-14)}" y="0" width="${S(30)}" height="${S(86)}" rx="${S(15)}" fill="${robeDark}"
        stroke="${PALETTE.card}" stroke-width="${S(5)}" paint-order="stroke"/>
      <circle cx="0" cy="${S(88)}" r="${S(15)}" fill="${skin}" stroke="${PALETTE.card}" stroke-width="${S(4)}" paint-order="stroke"/>
    </g>
  </g>
  <g class="head">
    <path d="${tornEllipse(52 * scale, 56 * scale, { seed: seed + 'h', amp: 2.5, style: 'cut' })}"
      fill="${skin}" stroke="${PALETTE.card}" stroke-width="${S(6)}" paint-order="stroke"/>
    <path d="M ${S(-52)} ${S(-14)} q ${S(14)} ${S(-54)}, ${S(52)} ${S(-44)} q ${S(38)} ${S(-10)}, ${S(52)} ${S(44)} q ${S(-30)} ${S(-26)}, ${S(-52)} ${S(-22)} q ${S(-24)} ${S(-4)}, ${S(-52)} ${S(22)} Z"
      fill="${hair}"/>
    ${eyeMarkup}${mouthMarkup}
    ${beard ? `<path d="M ${S(-34)} ${S(16)} q ${S(34)} ${S(58)}, ${S(68)} 0 q ${S(-14)} ${S(44)}, ${S(-34)} ${S(46)} q ${S(-20)} ${S(-2)}, ${S(-34)} ${S(-46)} Z" fill="#E8E2D6" opacity="0.95"/>` : ''}
    <circle cx="${S(-34)}" cy="${S(8)}" r="${S(8)}" fill="#E39C8E" opacity="0.5"/>
    <circle cx="${S(34)}" cy="${S(8)}" r="${S(8)}" fill="#E39C8E" opacity="0.5"/>
  </g>`;
}

/** Meditating silhouette — lotus pose, for yoga/meditation beats. */
export function meditator(scale = 1, opts = {}) {
  const { skin = '#F0C9A4', robe = PALETTE.saffron, hair = '#3B2B22', aura = null } = opts;
  const S = v => f(v * scale);
  return `
  ${aura ? `<circle cx="0" cy="${S(-10)}" r="${S(150)}" fill="${aura}" opacity="0.18"/>` : ''}
  <path d="M ${S(-120)} ${S(120)} Q 0 ${S(50)}, ${S(120)} ${S(120)} Q 0 ${S(160)}, ${S(-120)} ${S(120)} Z"
    fill="${robe}" stroke="${PALETTE.card}" stroke-width="${S(6)}" paint-order="stroke"/>
  <path d="M ${S(-62)} ${S(120)} Q ${S(-56)} ${S(18)}, 0 ${S(6)} Q ${S(56)} ${S(18)}, ${S(62)} ${S(120)} Z"
    fill="${robe}" stroke="${PALETTE.card}" stroke-width="${S(6)}" paint-order="stroke"/>
  <path d="M ${S(-60)} ${S(52)} Q ${S(-104)} ${S(78)}, ${S(-70)} ${S(112)}" stroke="${skin}" stroke-width="${S(20)}" fill="none" stroke-linecap="round"/>
  <path d="M ${S(60)} ${S(52)} Q ${S(104)} ${S(78)}, ${S(70)} ${S(112)}" stroke="${skin}" stroke-width="${S(20)}" fill="none" stroke-linecap="round"/>
  <g class="head" transform="translate(0,${S(-42)})">
    <circle cx="0" cy="0" r="${S(46)}" fill="${skin}" stroke="${PALETTE.card}" stroke-width="${S(6)}" paint-order="stroke"/>
    <path d="M ${S(-46)} ${S(-6)} q ${S(10)} ${S(-52)}, ${S(46)} ${S(-44)} q ${S(36)} ${S(-8)}, ${S(46)} ${S(44)} q ${S(-26)} ${S(-24)}, ${S(-46)} ${S(-20)} q ${S(-22)} ${S(-4)}, ${S(-46)} ${S(20)} Z" fill="${hair}"/>
    <path d="M ${S(-24)} ${S(-4)} q ${S(9)} ${S(7)}, ${S(18)} 0" stroke="${PALETTE.ink}" stroke-width="${S(3.5)}" fill="none" stroke-linecap="round"/>
    <path d="M ${S(6)} ${S(-4)} q ${S(9)} ${S(7)}, ${S(18)} 0" stroke="${PALETTE.ink}" stroke-width="${S(3.5)}" fill="none" stroke-linecap="round"/>
    <path d="M ${S(-11)} ${S(20)} q ${S(11)} ${S(9)}, ${S(22)} 0" stroke="${PALETTE.ink}" stroke-width="${S(3.5)}" fill="none" stroke-linecap="round"/>
  </g>`;
}

/** Temple / house silhouette — skyline filler and vastu scenes. */
export function temple(w, opts = {}) {
  const { fill = '#C56A3E', dark = '#9E4F2C', dome = PALETTE.gold } = opts;
  const h = w * 0.9;
  return `<g transform="translate(${f(-w / 2)},${f(-h)})">
    <rect x="0" y="${f(h * 0.45)}" width="${f(w)}" height="${f(h * 0.55)}" fill="${fill}"/>
    <path d="M ${f(w * 0.5)} 0 L ${f(w * 0.86)} ${f(h * 0.45)} L ${f(w * 0.14)} ${f(h * 0.45)} Z" fill="${dark}"/>
    <circle cx="${f(w * 0.5)}" cy="${f(-h * 0.07)}" r="${f(w * 0.09)}" fill="${dome}"/>
    <rect x="${f(w * 0.38)}" y="${f(h * 0.62)}" width="${f(w * 0.24)}" height="${f(h * 0.38)}" fill="${dark}" rx="${f(w * 0.12)}"/>
  </g>`;
}

/** Rising smoke / incense curl. `t` 0..1 animates the draw. */
export function smoke(h, opts = {}) {
  const { stroke = '#C9C2B4', width = 5, waves = 3, opacity = 0.6 } = opts;
  let d = `M 0 0`;
  for (let i = 0; i < waves; i++) {
    const seg = h / waves;
    const dir = i % 2 ? 1 : -1;
    d += ` q ${f(dir * seg * 0.45)} ${f(-seg * 0.5)}, 0 ${f(-seg)}`;
  }
  return `<path d="${d}" stroke="${stroke}" stroke-width="${width}" fill="none"
    stroke-linecap="round" opacity="${opacity}" class="smoke-path"/>`;
}

/** Confetti burst. Pieces carry data-i so the timeline can scatter them. */
export function confetti(count = 40, opts = {}) {
  const { seed = 'confetti', colors = [PALETTE.red, PALETTE.saffron, PALETTE.teal, PALETTE.rose, PALETTE.sky, PALETTE.mint], size = 18 } = opts;
  const rng = new Rng(seed);
  let out = '';
  for (let i = 0; i < count; i++) {
    const w = rng.range(size * 0.4, size), h = rng.range(size * 0.3, size * 0.7);
    out += `<rect class="confetti-piece" data-i="${i}" x="${f(-w / 2)}" y="${f(-h / 2)}" width="${f(w)}" height="${f(h)}"
      fill="${colors[rng.int(0, colors.length - 1)]}" transform="rotate(${f(rng.range(0, 360))})"/>`;
  }
  return out;
}

/** Plain text, centred on the origin. `font` accepts the --font-* CSS vars. */
export function text(str, opts = {}) {
  const {
    size = 54, fill = PALETTE.ink, font = 'var(--font-display)', weight = 700,
    anchor = 'middle', letterSpacing = 0, lineHeight = 1.15, stroke = null, strokeWidth = 8,
  } = opts;
  const lines = String(str).split('\n');
  const totalH = (lines.length - 1) * size * lineHeight;
  const strokeAttr = stroke
    ? ` stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round" paint-order="stroke"`
    : '';
  return lines.map((ln, i) =>
    `<text x="0" y="${f(-totalH / 2 + i * size * lineHeight + size * 0.34)}" text-anchor="${anchor}"
      font-family="${font}" font-size="${f(size)}" font-weight="${weight}" fill="${fill}"
      letter-spacing="${letterSpacing}"${strokeAttr}>${escapeXml(ln)}</text>`
  ).join('');
}

/** Text on a torn paper tile — the reference's specimen labels and callouts. */
export function label(str, opts = {}) {
  const {
    size = 44, fill = PALETTE.card, ink = PALETTE.ink, padX = 34, padY = 20,
    font = 'var(--font-display)', seed = 'label', style = 'cut', weight = 700, rot = 0,
  } = opts;
  const lines = String(str).split('\n');
  const longest = Math.max(...lines.map(l => l.length));
  const w = longest * size * 0.56 + padX * 2;
  const h = lines.length * size * 1.18 + padY * 2;
  return `<g transform="rotate(${f(rot)})">
    <path d="${tornRect(w, h, { seed, amp: 3.5, style })}" transform="translate(${f(-w / 2)},${f(-h / 2)})" fill="${fill}"/>
    ${text(str, { size, fill: ink, font, weight })}
  </g>`;
}

/** Small sticky-note tag, rotated, for asides and annotations. */
export function sticky(str, opts = {}) {
  const { size = 34, fill = '#F5E08A', ink = PALETTE.ink, w = 240, h = 240, seed = 'sticky', font = 'var(--font-hand)' } = opts;
  return `<g>
    <path d="${tornRect(w, h, { seed, amp: 3, style: 'cut' })}" transform="translate(${f(-w / 2)},${f(-h / 2)})" fill="${fill}"/>
    ${text(str, { size, fill: ink, font, weight: 400 })}
  </g>`;
}
