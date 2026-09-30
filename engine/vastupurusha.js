/**
 * Vāstupuruṣa.
 *
 * Hand-authored rather than assembled from generic limb helpers — that is why
 * the earlier procedural attempts failed. Every landmark below is placed
 * deliberately in a 100x100 box centred on the origin, so the figure registers
 * with mbVastuGrid(S) / devataMandala(S) at the same centre and scale.
 *
 * Iconography, per Bṛhat Saṃhitā 53.2-3 and the standard mandala charts:
 * prone, face toward the ground, body curled along the NE-SW diagonal, head in
 * ईशान (north-east), feet in नैऋत्य (south-west), knees drawn up, one arm
 * folded toward the face.
 */
import { MB } from './madhubani.js';

const f = n => Math.round(n * 100) / 100;

export function vastuPurusha(S, opts = {}) {
  const {
    skin = '#E0A868', outline = MB.ink, sw = 4.2,
    cloth = MB.deepRed, hair = MB.ink, ornament = MB.ochre,
    pattern = null, tint = true,
  } = opts;
  const u = S / 100;
  const p = (x, y) => `${f(x * u)} ${f(y * u)}`;

  const shape = (d, fill, strokeW = sw, pat = null) =>
    `<path d="${d}" fill="${fill}"/>` +
    (pat ? `<path d="${d}" fill="url(#mb-${pat})"/>` : '') +
    `<path d="${d}" fill="none" stroke="${outline}" stroke-width="${f(strokeW)}"
       stroke-linejoin="round"/>`;

  let out = '';

  // ---- far arm, laid across the chest (drawn first, sits behind) -----------
  out += shape(
    `M ${p(6, -17)} C ${p(0, -10)} ${p(0, -2)} ${p(8, 1)}
     C ${p(13, 3)} ${p(16, 0)} ${p(15, -3)}
     C ${p(14, -6)} ${p(9, -5)} ${p(7, -8)}
     C ${p(5, -11)} ${p(8, -14)} ${p(11, -16)} Z`, skin);

  // ---- far leg, extended toward the SW corner ------------------------------
  out += shape(
    `M ${p(-8, 2)} C ${p(-16, 6)} ${p(-24, 12)} ${p(-31, 20)}
     C ${p(-35, 24)} ${p(-39, 27)} ${p(-41, 30)}
     C ${p(-43, 34)} ${p(-36, 37)} ${p(-32, 34)}
     C ${p(-28, 28)} ${p(-22, 21)} ${p(-16, 16)}
     C ${p(-10, 11)} ${p(-5, 8)} ${p(-3, 4)} Z`, skin);
  // far foot
  out += shape(
    `M ${p(-36, 31)} C ${p(-41, 30)} ${p(-45, 32)} ${p(-45, 35)}
     C ${p(-45, 38)} ${p(-40, 38)} ${p(-35, 36)} Z`, skin, sw * 0.9);

  // ---- torso: one continuous outline, shoulders to hips --------------------
  out += shape(
    `M ${p(21, -15)}
     C ${p(26, -9)} ${p(25, -1)} ${p(19, 5)}
     C ${p(13, 11)} ${p(5, 15)} ${p(-4, 15)}
     C ${p(-12, 15)} ${p(-17, 11)} ${p(-16, 5)}
     C ${p(-15, -1)} ${p(-9, -7)} ${p(-1, -13)}
     C ${p(6, -18)} ${p(15, -20)} ${p(21, -15)} Z`, skin, sw, pattern);

  // ---- dhoti wrapped over the hips ----------------------------------------
  out += shape(
    `M ${p(6, 8)} C ${p(1, 14)} ${p(-7, 16)} ${p(-14, 14)}
     C ${p(-17, 13)} ${p(-18, 9)} ${p(-16, 5)}
     C ${p(-12, 8)} ${p(-4, 9)} ${p(3, 4)} Z`, cloth, sw, 'hatch2');

  // ---- near leg: knee drawn up, shin folding back to the SW ----------------
  out += shape(
    `M ${p(0, 10)} C ${p(6, 17)} ${p(7, 26)} ${p(0, 32)}
     C ${p(-8, 38)} ${p(-19, 41)} ${p(-28, 41)}
     C ${p(-33, 41)} ${p(-34, 35)} ${p(-29, 35)}
     C ${p(-21, 34)} ${p(-13, 30)} ${p(-8, 25)}
     C ${p(-4, 20)} ${p(-3, 15)} ${p(-6, 11)} Z`, skin, sw, pattern);
  // near foot
  out += shape(
    `M ${p(-27, 33)} C ${p(-32, 32)} ${p(-37, 34)} ${p(-37, 37)}
     C ${p(-37, 40)} ${p(-31, 40)} ${p(-26, 38)} Z`, skin, sw * 0.9);

  // ---- near arm: one clear bend, forearm rising to the face ---------------
  out += shape(
    `M ${p(18, -14)} C ${p(26, -9)} ${p(32, -3)} ${p(32, 3)}
     C ${p(32, 8)} ${p(26, 9)} ${p(24, 4)}
     C ${p(22, -1)} ${p(18, -6)} ${p(13, -9)} Z`, skin);
  out += shape(
    `M ${p(31, 5)} C ${p(35, -1)} ${p(34, -10)} ${p(29, -16)}
     C ${p(26, -19)} ${p(21, -17)} ${p(23, -12)}
     C ${p(25, -7)} ${p(27, -1)} ${p(25, 5)} Z`, skin);

  // ---- ornaments: small, so they read as jewellery not as joints ----------
  const bandAt = (x, y, r, rot = 0) =>
    `<g transform="translate(${p(x, y)}) rotate(${rot})">
       <ellipse rx="${f(r * u)}" ry="${f(r * 0.45 * u)}" fill="${ornament}"
         stroke="${outline}" stroke-width="${f(sw * 0.75)}"/></g>`;
  out += bandAt(-27, 27, 5, -40);   // far ankle
  out += bandAt(-24, 37, 5, -16);   // near ankle
  out += bandAt(30, 2, 4, 70);      // wrist
  out += bandAt(11, -15, 4.5, 30);    // upper arm

  // ---- neck: without this the head reads as detached ----------------------
  out += shape(
    `M ${p(17, -17)} C ${p(20, -22)} ${p(24, -25)} ${p(27, -25)}
     C ${p(29, -25)} ${p(29, -20)} ${p(26, -18)}
     C ${p(23, -16)} ${p(20, -14)} ${p(18, -12)} Z`, skin);

  // ---- head: tilted into the NE corner, face toward the ground ------------
  out += `<g transform="translate(${p(27, -28)}) rotate(-32) scale(0.82)">`;
  out += shape(
    `M ${p(-11, -2)} C ${p(-11, -9)} ${p(-5, -13)} ${p(2, -13)}
     C ${p(9, -13)} ${p(13, -8)} ${p(13, -1)}
     C ${p(13, 6)} ${p(8, 11)} ${p(1, 11)}
     C ${p(-6, 11)} ${p(-11, 5)} ${p(-11, -2)} Z`, skin);
  // hair, sweeping back off the brow
  out += shape(
    `M ${p(-11, -3)} C ${p(-10, -11)} ${p(-3, -16)} ${p(4, -15)}
     C ${p(11, -14)} ${p(15, -9)} ${p(14, -3)}
     C ${p(11, -8)} ${p(6, -10)} ${p(0, -9)}
     C ${p(-5, -8)} ${p(-9, -6)} ${p(-11, -3)} Z`, hair, sw * 0.8);
  // the long Mithila eye, in profile
  out += `<path d="M ${p(0, -1)} C ${p(3, -5)} ${p(8, -5)} ${p(10, -1)}
                   C ${p(8, 2)} ${p(3, 2)} ${p(0, -1)} Z"
            fill="${MB.white}" stroke="${outline}" stroke-width="${f(sw * 0.7)}"/>
          <circle cx="${p(5.5, -1).split(' ')[0]}" cy="${p(5.5, -1).split(' ')[1]}"
            r="${f(2.1 * u)}" fill="${outline}"/>
          <path d="M ${p(2, -6)} C ${p(5, -8)} ${p(9, -7)} ${p(11, -5)}"
            fill="none" stroke="${outline}" stroke-width="${f(sw * 0.7)}" stroke-linecap="round"/>
          <path d="M ${p(6, 6)} L ${p(12, 5)}"
            fill="none" stroke="${outline}" stroke-width="${f(sw * 0.8)}" stroke-linecap="round"/>
          <circle cx="${p(1, -8).split(' ')[0]}" cy="${p(1, -8).split(' ')[1]}"
            r="${f(1.7 * u)}" fill="${MB.deepRed}"/>`;
  out += `</g>`;

  return out;
}
