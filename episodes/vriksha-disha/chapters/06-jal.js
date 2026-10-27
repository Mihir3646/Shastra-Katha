import { Motion } from '../../../engine/stage.js';
import { MB, mbBorder, mbCard, mbVastuGrid, kalash, ink } from '../../../engine/madhubani.js';
import { text } from '../../../engine/kit.js';
import { tearWipe, fade } from '../../../engine/transitions.js';
import { addDisclaimer } from '../../../engine/disclaimer.js';

export default {
  id: 'jal',
  title: 'और जल',
  short: true,
  script: [
    { id: 'n1', text: 'पिछली बार कहा था — इसी अध्याय में जल का स्थान भी लिखा है।', gap: 0.3 },
    { id: 'n2', text: 'वह श्लोक एक सौ उन्नीस है।', gap: 0.9 },
    { id: 'n3', text: 'ग्रंथ दो दिशाएँ शुभ बताता है।', gap: 0.3 },
    { id: 'n4', text: 'उत्तर में जल — धन की वृद्धि।', gap: 0.3 },
    { id: 'n5', text: 'उत्तर-पूर्व में जल — संतान की वृद्धि।', gap: 0.9 },
    { id: 'n6', text: 'बाक़ी दिशाओं के लिए ग्रंथ सावधान करता है।', gap: 0.3 },
    { id: 'n7', text: 'हम वही कहेंगे जितना ग्रंथ कहता है।', gap: 0.9 },
    { id: 'n8', text: 'अनुवाद मुफ़्त है। लिंक नीचे है — ख़ुद मिला लीजिए।', gap: 0.3 },
    { id: 'n9', text: 'अगली बार — घर का मुख्य द्वार। ग्रंथ बत्तीस स्थान गिनाता है।', gap: 0.3 },
    { id: 'n10', text: 'बने रहिए।', gap: 0.4 },
  ],
  build({ stage, tl, at, end, from, pick }) {
    const W = stage.width, H = stage.height, CX = W / 2;
    tearWipe(stage, { at: from - 0.5, color: '#F0E4C4', dir: 'left', seed: 'w-j', travel: 0.45 });

    stage.scene({
      name: 'jal', from: from - 0.25, to: end('n10') + 1.3,
      build() {
        stage.add({ id: 'j-bg', svg: `<rect width="${W}" height="${H}" fill="#F0E4C4"/>`, x: 0, y: 0, layer: 0 });
        stage.add({ id: 'j-border', svg: mbBorder(W, H, { fill: MB.blue, pattern: 'wave' }), x: 0, y: 0, layer: 60 });

        const gs = pick(Math.min(W * 0.30, 400), Math.min(W * 0.56, 560));
        const c = gs / 3;
        const gx = pick(W * 0.30, CX), gy = pick(H * 0.44, H * 0.40);
        const grid = stage.add({
          id: 'j-grid',
          svg: mbVastuGrid(gs, { labels: ['वायव्य','उत्तर','ईशान','पश्चिम','ब्रह्म','पूर्व','नैऋत्य','दक्षिण','आग्नेय'] }),
          x: gx, y: gy, layer: 4, opacity: 0, shadow: 'cut-shadow',
        });
        Motion.drawOn(tl, grid, { at: from + 0.2, dur: 1.8, fade: 0.45 });

        // the two directions the text calls auspicious, lighting up as named
        const cell = (col, row, label, colour, cue) => {
          const el = stage.add({
            id: `j-${label}`,
            svg: ink(`M ${-c * 0.46} ${-c * 0.46} H ${c * 0.46} V ${c * 0.46} H ${-c * 0.46} Z`,
                     colour, { pattern: 'wave', sw: 5 })
               + text('जल', { size: c * 0.2, font: 'var(--font-deva)', fill: MB.ink }),
            x: gx + (col - 1) * c, y: gy + (row - 1) * c, layer: 6, scale: 0, opacity: 0,
            shadow: 'cut-shadow-sm',
          });
          Motion.place(tl, el, { at: at(cue) + 0.4, dur: 0.45, dy: -26 });
          Motion.recoil(tl, [grid], { at: at(cue) + 0.52, amp: 6 });
          return el;
        };
        const uttar = cell(1, 0, 'uttar', MB.sky, 'n4');
        const ishan = cell(2, 0, 'ishan', MB.sky, 'n5');

        const dhan = stage.add({
          id: 'j-dhan',
          svg: mbCard(pick(440, 520), pick(80, 92), MB.green, { pattern: 'hatch2', sw: 4.5, seed: 'jd' })
             + text('उत्तर — धन की वृद्धि', { size: pick(32, 36), font: 'var(--font-deva)', fill: MB.cream }),
          x: pick(W * 0.74, CX), y: pick(H * 0.30, H * 0.70), layer: 9, scale: 0, shadow: 'cut-shadow-sm',
        });
        Motion.place(tl, dhan, { at: at('n4') + 0.6, dur: 0.45 });

        const santan = stage.add({
          id: 'j-santan',
          svg: mbCard(pick(480, 560), pick(80, 92), MB.ochre, { pattern: 'dots', sw: 4.5, seed: 'js' })
             + text('ईशान — संतान की वृद्धि', { size: pick(32, 36), font: 'var(--font-deva)', fill: MB.ink }),
          x: pick(W * 0.74, CX), y: pick(H * 0.42, H * 0.78), layer: 9, scale: 0, shadow: 'cut-shadow-sm',
        });
        Motion.place(tl, santan, { at: at('n5') + 0.6, dur: 0.45 });

        stage.add({ id: 'j-kalash', svg: kalash(pick(116, 128)),
          x: pick(W * 0.30, CX), y: pick(H * 0.72, H * 0.60), layer: 7, shadow: 'cut-shadow' });

        const cite = stage.add({
          id: 'j-cite',
          svg: mbCard(pick(400, 480), pick(76, 86), MB.cream, { sw: 4.5, seed: 'jc' })
             + text('बृहत् संहिता ५३.११९', { size: pick(30, 34), font: 'var(--font-deva)', fill: MB.ink }),
          x: pick(W * 0.74, CX), y: pick(H * 0.18, H * 0.16), layer: 9, scale: 0, shadow: 'cut-shadow-sm',
        });
        Motion.place(tl, cite, { at: at('n2') + 0.2, dur: 0.45 });

        const next = stage.add({
          id: 'j-next',
          svg: mbCard(pick(560, 640), pick(96, 108), MB.deepRed, { pattern: 'hatch', sw: 5, seed: 'jn' })
             + text('अगली बार — मुख्य द्वार', { size: pick(36, 40), font: 'var(--font-deva)', fill: MB.cream }),
          x: pick(W * 0.74, CX), y: pick(H * 0.58, H * 0.52), layer: 10, scale: 0, shadow: 'cut-shadow',
        });
        Motion.place(tl, next, { at: at('n9') + 0.3, dur: 0.5 });

        const sub = stage.add({
          id: 'j-sub',
          svg: text('बने रहिए', { size: pick(48, 56), font: 'var(--font-deva)', fill: MB.deepRed }),
          x: pick(W * 0.74, CX), y: pick(H * 0.70, H * 0.62), layer: 10, opacity: 0,
        });
        Motion.place(tl, sub, { at: at('n10') + 0.1, dur: 0.45 });

        fade(stage, { at: end('n10') + 0.75, dur: 0.5, to: 'out' });
        addDisclaimer(stage, { at: end('n10') + 1.25, hold: 3.8 });
      },
    });
  },
};
