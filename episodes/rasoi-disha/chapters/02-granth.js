import { Motion } from '../../../engine/stage.js';
import { MB, mbBorder, mbCard, mbVastuGrid, mbBand, sunFace, ink } from '../../../engine/madhubani.js';
import { text } from '../../../engine/kit.js';
import { tearWipe } from '../../../engine/transitions.js';

export default {
  id: 'granth',
  title: 'ग्रंथ',
  short: true,
  script: [
    { id: 'g1', text: 'देवताओं का स्थान — उत्तर-पूर्व।', gap: 0.15 },
    { id: 'g2', text: 'रसोई — दक्षिण-पूर्व।', gap: 0.15 },
    { id: 'g3', text: 'बर्तन और घर के सामान का कमरा — दक्षिण-पश्चिम।', gap: 0.15 },
    { id: 'g4', text: 'कोष और अनाज — उत्तर-पश्चिम।', gap: 0.3 },
    { id: 'g5', text: 'चारों एक ही पंक्ति में। अध्याय तिरपन, श्लोक एक सौ अठारह।', gap: 0.9 },
    { id: 'g6', text: 'ग्रंथ है बृहत् संहिता। लेखक — वराहमिहिर। समय — छठी शताब्दी।', gap: 0.3 },
    { id: 'g7', text: 'यानी लगभग पंद्रह सौ साल पुराना।', gap: 0.15 },
    { id: 'g8', text: 'अनुवाद मुफ़्त में उपलब्ध है। लिंक नीचे है — ख़ुद मिला लीजिए।', gap: 0.3 },
  ],
  build({ stage, tl, at, end, from, pick }) {
    const W = stage.width, H = stage.height, CX = W / 2;
    tearWipe(stage, { at: from - 0.5, color: '#E7D3B4', dir: 'up', seed: 'w-g', travel: 0.45 });

    stage.scene({
      name: 'granth', from: from - 0.25, to: end('g8') + 0.4,
      build() {
        stage.add({ id: 'g-bg', svg: `<rect width="${W}" height="${H}" fill="#E7D3B4"/>`, x: 0, y: 0, layer: 0, boil: false });
        stage.add({ id: 'g-border', svg: mbBorder(W, H, { fill: MB.indigo }), x: 0, y: 0, layer: 60, boil: false });

        // the book itself
        const book = stage.add({
          id: 'g-book',
          svg: mbCard(pick(430, 520), pick(300, 350), MB.cream, { sw: 6, seed: 'bk' })
             + text('बृहत्\nसंहिता', { size: pick(60, 72), font: 'var(--font-deva)', fill: MB.ink, lineHeight: 1.25 }),
          x: pick(W * 0.24, CX), y: pick(H * 0.3, H * 0.33), layer: 6, scale: 0, shadow: 'cut-shadow',
        });
        Motion.place(tl, book, { at: from + 0.1 });
        Motion.sway(tl, book, { amp: 1.1, period: 5, at: from + 1 });

        // author and date, arriving as they are spoken
        [['वराहमिहिर', 'g2', 0], ['छठी शताब्दी', 'g2', 1.6]].forEach(([label, line, off], i) => {
          const el = stage.add({
            id: `g-meta${i}`,
            svg: mbCard(pick(320, 400), pick(72, 84), i ? MB.ochre : MB.green, { pattern: 'hatch2', sw: 4.5, seed: 'm' + i })
               + text(label, { size: pick(34, 42), font: 'var(--font-deva)', fill: MB.cream }),
            x: pick(W * 0.24, CX), y: pick(H * (0.53 + i * 0.09), H * (0.6 + i * 0.09)), layer: 7, scale: 0, shadow: 'cut-shadow-sm',
          });
          Motion.place(tl, el, { at: at(line) + off });
        });

        // vastu-vidya — the word that justifies the whole framing
        const vidya = stage.add({
          id: 'g-vidya',
          svg: mbCard(pick(520, 640), pick(110, 126), MB.deepRed, { pattern: 'hatch', sw: 5, seed: 'vd' })
             + text('१५०० साल पुराना', { size: pick(52, 62), font: 'var(--font-deva)', fill: MB.cream }),
          x: pick(W * 0.72, CX), y: pick(H * 0.28, H * 0.8), layer: 8, scale: 0, shadow: 'cut-shadow',
        });
        Motion.place(tl, vidya, { at: at('g6') + 1.6 });
        tl.drive(vidya, (l, g, s) => { s.scale = 1 + Math.sin(g * 2.8) * 0.022; }, { at: at('g6') + 2.2 });

        // the verse, built line by line as each room is named
        const rooms = [
          ['देवता', 2, MB.sky], ['रसोई', 8, MB.red], ['बर्तन', 6, MB.brown], ['कोष', 0, MB.ochre],
        ];
        const gs = pick(Math.min(W * 0.34, 440), Math.min(W * 0.68, 640));
        const c = gs / 3;
        const gy = pick(H * 0.62, H * 0.45);
        const gx = pick(W * 0.72, CX);
        const grid = stage.add({
          id: 'g-grid',
          svg: mbVastuGrid(gs, { labels: ['वायव्य','उत्तर','ईशान','पश्चिम','ब्रह्म','पूर्व','नैऋत्य','दक्षिण','आग्नेय'] }),
          x: gx, y: gy, layer: 4, opacity: 0, shadow: 'cut-shadow',
        });
        // the plan is the board; it inks itself in before anything is placed on it
        Motion.drawOn(tl, grid, { at: at('g1') - 0.4, dur: 1.8, fade: 0.45 });

        rooms.forEach(([label, cell, colour], i) => {
          const col = cell % 3, row = (cell / 3) | 0;
          const el = stage.add({
            id: `g-room${i}`,
            svg: ink(`M ${-c * 0.44} ${-c * 0.44} H ${c * 0.44} V ${c * 0.44} H ${-c * 0.44} Z`, colour,
                     { pattern: 'hatch2', sw: 5 })
               + text(label, { size: c * 0.19, font: 'var(--font-deva)', fill: MB.cream }),
            x: gx + (col - 1) * c, y: gy + (row - 1) * c, layer: 6, scale: 0, shadow: 'cut-shadow-sm',
          });
          const cue = i === 0 ? at('g1') + 0.7 : i === 1 ? at('g2') + 0.2 : i === 2 ? at('g2') + 2.2 : at('g4') + 0.5;
          // arriving from outside the plan, settling into its cell
          Motion.place(tl, el, { at: cue, dx: (col - 1) * 90, dy: (row - 1) * 90 - 30, dur: 0.46 });
          if (i === 1) tl.drive(el, (l, g, s) => { s.scale = 1 + Math.sin(g * 3) * 0.035; }, { at: cue + 0.5 });
        });

        // the citation, held on screen
        const cite = stage.add({
          id: 'g-cite',
          svg: mbCard(pick(620, 780), pick(84, 96), MB.cream, { sw: 4.5, seed: 'ct' })
             + text('बृहत् संहिता — अध्याय ५३, श्लोक ११८', { size: pick(32, 38), font: 'var(--font-deva)', fill: MB.ink }),
          // the caption owns the centre column at the bottom; the citation lives
          // under the author cards instead, where there is real space
          x: pick(W * 0.25, CX), y: pick(H * 0.72, H * 0.74), layer: 9, opacity: 0, shadow: 'cut-shadow-sm',
        });
        // Deriving from the element's authored y. Hardcoding coordinates in
        // the tween silently overrides wherever the element was placed — which
        // is how this one kept reappearing inside the caption band.
        Motion.place(tl, cite, { at: at('g6') + 0.3 });
      },
    });
  },
};
