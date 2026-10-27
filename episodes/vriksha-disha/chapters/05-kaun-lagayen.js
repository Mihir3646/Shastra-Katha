import { Motion } from '../../../engine/stage.js';
import { MB, mbBorder, mbCard, mbTree, mbBand } from '../../../engine/madhubani.js';
import { text } from '../../../engine/kit.js';
import { tearWipe } from '../../../engine/transitions.js';

export default {
  id: 'lagayen',
  title: 'कौन से लगाएँ',
  short: true,
  script: [
    { id: 'p1', text: 'अब अगला अध्याय — पचपनवाँ।', gap: 0.3 },
    { id: 'p2', text: 'वहाँ चार पेड़ ऐसे हैं जिन्हें घर या बगीचे में लगाने को कहा गया है।', gap: 0.3 },
    { id: 'p3', text: 'अरिष्ट, अशोक, पुन्नाग और शिरीष।', gap: 0.9 },
    { id: 'p4', text: 'ग्रंथ कहता है — ये समृद्धि लाते हैं।', gap: 0.9 },
    { id: 'p5', text: 'दूरी भी बताई गई है। श्लोक बारह।', gap: 0.3 },
    { id: 'p6', text: 'दो पेड़ों के बीच बीस हाथ सबसे अच्छा।', gap: 0.15 },
    { id: 'p7', text: 'सोलह हाथ चल जाएगा।', gap: 0.15 },
    { id: 'p8', text: 'बारह हाथ ठीक नहीं।', gap: 0.9 },
    { id: 'p9', text: 'और लगाने का समय भी। श्लोक इकतीस।', gap: 0.3 },
    { id: 'p10', text: 'मूल, विशाखा, पुष्य, श्रवण, अश्विनी और हस्त।', gap: 0.9 },
    { id: 'p11', text: 'इन नक्षत्रों में पेड़ लगाने को कहा गया है।', gap: 0.3 },
  ],
  build({ stage, tl, at, end, from, pick }) {
    const W = stage.width, H = stage.height, CX = W / 2;
    tearWipe(stage, { at: from - 0.5, color: '#EFE0C0', dir: 'up', seed: 'w-p', travel: 0.45 });

    stage.scene({
      name: 'lagayen', from: from - 0.25, to: end('p11') + 0.5,
      build() {
        stage.add({ id: 'l-bg', svg: `<rect width="${W}" height="${H}" fill="#EFE0C0"/>`, x: 0, y: 0, layer: 0 });
        stage.add({ id: 'l-border', svg: mbBorder(W, H, { fill: MB.leaf, pattern: 'leafrow' }), x: 0, y: 0, layer: 60 });

        // the four recommended, as a row of saplings
        const CHAAR = ['अरिष्ट', 'अशोक', 'पुन्नाग', 'शिरीष'];
        const saplings = [];
        CHAAR.forEach((t, i) => {
          const x = pick(W * 0.18 + i * W * 0.155, CX + ((i % 2) - 0.5) * 260);
          const y = pick(H * 0.34, H * (0.22 + Math.floor(i / 2) * 0.17));
          const tr = stage.add({ id: `l-t${i}`, svg: mbTree(pick(150, 160), { kind: 'plain' }),
            x, y, layer: 6, scale: 0, shadow: 'cut-shadow' });
          const lb = stage.add({
            id: `l-l${i}`,
            svg: mbCard(pick(164, 178), pick(54, 60), MB.cream, { sw: 4, seed: 'll' + i })
               + text(t, { size: pick(28, 31), font: 'var(--font-deva)', fill: MB.ink }),
            x, y: y + pick(104, 112), layer: 8, scale: 0, shadow: 'cut-shadow-sm' });
          saplings.push(tr, lb);
        });
        tl.stagger(saplings, { opacity: [0, 1], scale: [1, 1] },
          { at: at('p3') - 0.1, each: 0.1, dur: 0.4, ease: 'outCubic' });

        const samriddhi = stage.add({
          id: 'l-sam',
          svg: mbCard(pick(460, 540), pick(92, 104), MB.green, { pattern: 'hatch2', sw: 5, seed: 'ls' })
             + text('समृद्धि', { size: pick(42, 48), font: 'var(--font-deva)', fill: MB.cream }),
          x: CX, y: pick(H * 0.56, H * 0.56), layer: 10, scale: 0, shadow: 'cut-shadow',
        });
        Motion.place(tl, samriddhi, { at: at('p4') + 0.4, dur: 0.5 });
        Motion.recoil(tl, saplings, { at: at('p4') + 0.52, amp: 6 });

        // the spacing rule, three cards on three lines
        const DOOR = [['बीस हाथ — सबसे अच्छा', MB.green, 'p6'],
                      ['सोलह हाथ — चल जाएगा', MB.ochre, 'p7'],
                      ['बारह हाथ — ठीक नहीं', MB.cream, 'p8']];
        const doori = DOOR.map(([t, col, cue], i) => {
          const el = stage.add({
            id: `l-d${i}`,
            svg: mbCard(pick(400, 470), pick(66, 74), col, { sw: 4.5, seed: 'ld' + i })
               + text(t, { size: pick(30, 34), font: 'var(--font-deva)', fill: col === MB.cream ? MB.ink : MB.cream }),
            x: pick(W * 0.26, CX), y: pick(H * (0.62 + i * 0.075), H * (0.64 + i * 0.055)), layer: 9,
            scale: 0, shadow: 'cut-shadow-sm',
          });
          Motion.place(tl, el, { at: at(cue) + 0.1, dur: 0.4 });
          return el;
        });

        // the six nakshatras
        const nak = stage.add({
          id: 'l-nak',
          svg: mbCard(pick(620, 700), pick(92, 104), MB.indigo, { pattern: 'dots', sw: 5, seed: 'ln' })
             + text('मूल · विशाखा · पुष्य · श्रवण · अश्विनी · हस्त', { size: pick(28, 30), font: 'var(--font-deva)', fill: MB.cream }),
          x: pick(W * 0.72, CX), y: pick(H * 0.70, H * 0.84), layer: 11, scale: 0, shadow: 'cut-shadow',
        });
        Motion.place(tl, nak, { at: at('p10') - 0.1, dur: 0.55 });
        Motion.recoil(tl, doori, { at: at('p10') + 0.02, amp: 5 });

        stage.add({ id: 'l-band', svg: mbBand(pick(360, 420), { h: 18, fill: MB.ochre, pattern: 'chevron' }),
          x: pick(W * 0.72, CX), y: pick(H * 0.16, H * 0.12), layer: 5 });
      },
    });
  },
};
