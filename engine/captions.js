import { tornRect } from './paper.js';
import { escapeXml, PALETTE } from './kit.js';

// ---------------------------------------------------------------------------
// On-screen captions, drawn into the stage rather than burned in afterwards.
//
// Doing it here means captions get the same paper treatment as everything else,
// they scrub correctly in preview, and the build has no dependency on an ffmpeg
// compiled with libass (Homebrew's current bottle is not).
// ---------------------------------------------------------------------------

function wrap(str, cols) {
  const words = String(str).split(/\s+/);
  const out = [];
  let line = '';
  for (const w of words) {
    if (line && (line + ' ' + w).length > cols) { out.push(line); line = w; }
    else line = line ? line + ' ' + w : w;
  }
  if (line) out.push(line);
  return out;
}

/**
 * opts: {
 *   style: 'outline' | 'card' | 'band',
 *   size, font, color, outline, outlineWidth,
 *   position: 0..1 down the frame, wrapAt, lineHeight, pop
 * }
 */
export function addCaptions(stage, lines, timings, opts = {}) {
  const W = stage.width, H = stage.height;
  const vertical = H > W;
  const {
    style = 'outline',
    size = opts.size ?? (vertical ? 60 : 46),
    font = 'var(--font-body)',
    color = '#FFFFFF',
    outline = '#241C14',
    outlineWidth = vertical ? 11 : 9,
    position = vertical ? 0.82 : 0.86,
    wrapAt = vertical ? 22 : 40,
    lineHeight = 1.2,
    weight = 700,
    layer = 800,
    pop = true,
    cardFill = PALETTE.card,
    cardInk = PALETTE.ink,
  } = opts;

  const baseY = H * position;

  for (const l of lines) {
    const t = timings[l.id];
    if (!t) continue;
    const rows = wrap(l.caption ?? l.text, wrapAt);
    const blockH = (rows.length - 1) * size * lineHeight;

    const body = rows.map((row, i) => {
      const y = -blockH / 2 + i * size * lineHeight + size * 0.34;
      const common = `x="0" y="${y.toFixed(1)}" text-anchor="middle" font-family="${font}" font-size="${size}" font-weight="${weight}"`;
      if (style === 'outline') {
        // Stroke behind fill gives a clean readable edge at any background.
        return `<text ${common} fill="${color}" stroke="${outline}" stroke-width="${outlineWidth}"
                  stroke-linejoin="round" paint-order="stroke">${escapeXml(row)}</text>`;
      }
      return `<text ${common} fill="${cardInk}">${escapeXml(row)}</text>`;
    }).join('');

    let markup = body;
    if (style === 'card' || style === 'band') {
      const longest = Math.max(...rows.map(r => r.length));
      const w = style === 'band' ? W * 0.92 : longest * size * 0.55 + 64;
      const h = blockH + size * 1.25;
      const plate = `<path d="${tornRect(w, h, { seed: 'cap-' + l.id, amp: 3.5, style: 'cut' })}"
        transform="translate(${(-w / 2).toFixed(1)},${(-h / 2).toFixed(1)})" fill="${cardFill}"/>`;
      markup = plate + body;
    }

    const el = stage.add({
      id: `caption-${l.id}`,
      svg: markup,
      x: W / 2, y: baseY,
      layer,
      opacity: 0,
      shadow: style === 'outline' ? null : 'cut-shadow-sm',
      boil: false,
      window: [t.start - 0.2, t.end + 0.14],
    });

    const inDur = 0.18;
    if (pop) {
      stage.tl.fromTo(el, { opacity: [0, 1], y: [baseY + 26, baseY], scale: [0.94, 1] },
        { at: t.start - 0.1, dur: inDur, ease: 'outBack' });
    } else {
      stage.tl.fromTo(el, { opacity: [0, 1] }, { at: t.start - 0.1, dur: inDur });
    }
    stage.tl.to(el, { opacity: 0 }, { at: t.end - 0.02, dur: 0.12 });
  }
}
