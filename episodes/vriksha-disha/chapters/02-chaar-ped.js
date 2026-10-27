import { Motion } from '../../../engine/stage.js';
import { MB, mbBorder, mbCard, mbTree, mbBand } from '../../../engine/madhubani.js';
import { text } from '../../../engine/kit.js';
import { tearWipe } from '../../../engine/transitions.js';

export default {
  id: 'chaar',
  title: 'चार पेड़',
  short: true,
  script: [
    { id: 'g1', text: 'पाकड़ — उत्तर में।', gap: 0.15 },
    { id: 'g2', text: 'बरगद — पूरब में।', gap: 0.15 },
    { id: 'g3', text: 'गूलर — दक्षिण में।', gap: 0.15 },
    { id: 'g4', text: 'पीपल — पश्चिम में।', gap: 0.9 },
    { id: 'g5', text: 'चारों शुभ दिशाएँ, एक ही श्लोक में।', gap: 0.3 },
    { id: 'g6', text: 'और एक बात ध्यान देने लायक़ है।', gap: 0.3 },
    { id: 'g7', text: 'ये चारों एक ही कुल के पेड़ हैं।', gap: 0.3 },
    { id: 'g8', text: 'बरगद, गूलर, पाकड़, पीपल — चारों गूलर-कुल के।', gap: 0.9 },
    { id: 'g9', text: 'बाक़ी दिशाओं के लिए ग्रंथ सावधान करता है। वह भी इसी श्लोक में है।', gap: 0.3 },
  ],
  build({ stage, tl, at, end, from, pick }) {
    const W = stage.width, H = stage.height, CX = W / 2;
    tearWipe(stage, { at: from - 0.5, color: '#EFE0C0', dir: 'left', seed: 'w-c', travel: 0.45 });

    stage.scene({
      name: 'chaar', from: from - 0.25, to: end('g9') + 0.5,
      build() {
        stage.add({ id: 'c-bg', svg: `<rect width="${W}" height="${H}" fill="#EFE0C0"/>`, x: 0, y: 0, layer: 0 });
        stage.add({ id: 'c-border', svg: mbBorder(W, H, { fill: MB.green, pattern: 'leafrow' }), x: 0, y: 0, layer: 60 });

        // the house sits at the centre and the four trees take their sides —
        // the whole chapter is one picture being assembled, nothing leaves
        const HX = pick(W * 0.42, CX), HY = pick(H * 0.46, H * 0.40);
        const R  = pick(260, 300);

        const ghar = stage.add({
          id: 'c-ghar',
          svg: mbCard(pick(190, 210), pick(150, 165), MB.ochre, { pattern: 'cross', sw: 5, seed: 'gh' })
             + text('घर', { size: pick(44, 50), font: 'var(--font-deva)', fill: MB.ink }),
          x: HX, y: HY, layer: 7, scale: 0, shadow: 'cut-shadow',
        });
        Motion.place(tl, ghar, { at: from, dur: 0.5 });

        // [label, kind, cue, dx, dy] — north up, east right
        const PED = [
          ['पाकड़',  'pakar',  'g1',  0, -1],
          ['बरगद',  'bargad', 'g2',  1,  0],
          ['गूलर',  'gular',  'g3',  0,  1],
          ['पीपल',  'peepal', 'g4', -1,  0],
        ];
        const planted = [];
        PED.forEach(([label, kind, cue, dx, dy], i) => {
          const x = HX + dx * R, y = HY + dy * R * 0.62;
          const t = stage.add({
            id: `c-t${i}`, svg: mbTree(pick(185, 200), { kind }),
            x, y, layer: 6, scale: 0, shadow: 'cut-shadow',
          });
          // each arrives from outside and settles on its own side
          Motion.place(tl, t, { at: at(cue) + 0.15, dur: 0.5, dx: dx * 110, dy: dy * 70 - 30 });
          const l = stage.add({
            id: `c-l${i}`,
            svg: mbCard(pick(170, 186), pick(56, 62), MB.cream, { sw: 4, seed: 'cl' + i })
               + text(label, { size: pick(30, 34), font: 'var(--font-deva)', fill: MB.ink }),
            x, y: y + pick(120, 130), layer: 8, scale: 0, shadow: 'cut-shadow-sm',
          });
          Motion.place(tl, l, { at: at(cue) + 0.4, dur: 0.4 });
          planted.push(t, l);
        });
        Motion.recoil(tl, [ghar], { at: at('g4') + 0.3, amp: 6 });

        const kul = stage.add({
          id: 'c-kul',
          svg: mbCard(pick(520, 620), pick(92, 104), MB.green, { pattern: 'hatch2', sw: 5, seed: 'ck' })
             + text('चारों — गूलर-कुल', { size: pick(38, 44), font: 'var(--font-deva)', fill: MB.cream }),
          x: pick(W * 0.80, CX), y: pick(H * 0.70, H * 0.80), layer: 10, scale: 0, shadow: 'cut-shadow',
        });
        Motion.place(tl, kul, { at: at('g7') + 0.3, dur: 0.5 });
        Motion.recoil(tl, planted, { at: at('g7') + 0.42, amp: 5 });

        stage.add({ id: 'c-band', svg: mbBand(pick(380, 440), { h: 18, fill: MB.ochre, pattern: 'chevron' }),
          x: pick(W * 0.80, CX), y: pick(H * 0.20, H * 0.14), layer: 5 });
      },
    });
  },
};
