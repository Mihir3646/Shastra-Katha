import { Motion } from '../../../engine/stage.js';
import { MB, mbBorder, mbCard, mbTree } from '../../../engine/madhubani.js';
import { text } from '../../../engine/kit.js';
import { tearWipe } from '../../../engine/transitions.js';

export default {
  id: 'mat',
  title: 'काटिए मत',
  short: true,
  script: [
    { id: 'v1', text: 'अब सबसे काम की बात।', gap: 0.3 },
    { id: 'v2', text: 'अगर पेड़ दूसरी दिशा में हो, तो क्या करें?', gap: 0.9 },
    { id: 'v3', text: 'आमतौर पर सुनाई देता है — काट दीजिए।', gap: 0.9 },
    { id: 'v4', text: 'ग्रंथ यह नहीं कहता।', gap: 0.9 },
    { id: 'v5', text: 'श्लोक सत्तासी में लिखा है —', gap: 0.3 },
    { id: 'v6', text: 'अगर हटाना कठिन हो, तो उनके बीच श्रेष्ठ पेड़ लगाइए।', gap: 0.9 },
    { id: 'v7', text: 'सात नाम दिए गए हैं।', gap: 0.3 },
    { id: 'v8', text: 'पुन्नाग, अशोक, अरिष्ट, बकुल, पनस, शमी और शाल।', gap: 0.9 },
    { id: 'v9', text: 'यानी ग्रंथ का उपाय काटना नहीं — जोड़ना है।', gap: 0.9 },
    { id: 'v10', text: 'एक छूट भी दी गई है। श्लोक छिहत्तर।', gap: 0.3 },
    { id: 'v11', text: 'द्वार के ठीक सामने पेड़ हो, तो ध्यान रखने को कहा गया है।', gap: 0.3 },
    { id: 'v12', text: 'पर अगर वह घर की ऊँचाई से दोगुनी दूरी पर हो —', gap: 0.9 },
    { id: 'v13', text: 'तो ग्रंथ कहता है, कोई हानि नहीं।', gap: 0.9 },
    { id: 'v14', text: 'यानी काटने से पहले दूरी नाप लीजिए।', gap: 0.3 },
  ],
  build({ stage, tl, at, end, from, pick }) {
    const W = stage.width, H = stage.height, CX = W / 2;
    tearWipe(stage, { at: from - 0.5, color: '#E7D3A8', dir: 'up', seed: 'w-m', travel: 0.45 });

    stage.scene({
      name: 'mat', from: from - 0.25, to: end('v14') + 0.5,
      build() {
        stage.add({ id: 'm-bg', svg: `<rect width="${W}" height="${H}" fill="#E7D3A8"/>`, x: 0, y: 0, layer: 0 });
        stage.add({ id: 'm-border', svg: mbBorder(W, H, { fill: MB.brown, pattern: 'net' }), x: 0, y: 0, layer: 60 });

        // the common advice, then the text's own answer landing on top of it
        const kaat = stage.add({
          id: 'm-kaat',
          svg: mbCard(pick(460, 560), pick(96, 110), MB.cream, { sw: 4.5, seed: 'mk' })
             + text('काट दीजिए?', { size: pick(42, 48), font: 'var(--font-deva)', fill: MB.inkSoft }),
          x: pick(W * 0.26, CX), y: pick(H * 0.24, H * 0.16), layer: 8, scale: 0, shadow: 'cut-shadow-sm',
        });
        Motion.place(tl, kaat, { at: at('v3') + 0.3, dur: 0.45 });

        const nahi = stage.add({
          id: 'm-nahi',
          svg: mbCard(pick(520, 620), pick(104, 118), MB.green, { pattern: 'hatch2', sw: 5, seed: 'mn' })
             + text('ग्रंथ कहता है — जोड़िए', { size: pick(40, 46), font: 'var(--font-deva)', fill: MB.cream }),
          x: pick(W * 0.26, CX), y: pick(H * 0.40, H * 0.30), layer: 9, scale: 0, shadow: 'cut-shadow',
        });
        Motion.place(tl, nahi, { at: at('v4') + 0.4, dur: 0.5 });
        Motion.recoil(tl, [kaat], { at: at('v4') + 0.52, amp: 8 });

        // the seven, arriving as a wave on the line that names them
        const SAAT = ['पुन्नाग', 'अशोक', 'अरिष्ट', 'बकुल', 'पनस', 'शमी', 'शाल'];
        const cards = SAAT.map((t, i) => stage.add({
          id: `m-s${i}`,
          svg: mbCard(pick(196, 230), pick(60, 68), MB.ochre, { pattern: 'dots', sw: 4, seed: 'ms' + i })
             + text(t, { size: pick(30, 34), font: 'var(--font-deva)', fill: MB.ink }),
          x: pick(W * 0.70 + ((i % 2) - 0.5) * 230, CX + ((i % 2) - 0.5) * 250),
          y: pick(H * 0.20 + Math.floor(i / 2) * 0.125, H * 0.46 + Math.floor(i / 2) * 0.085) * (pick(1, 1)),
          layer: 9, scale: 0, shadow: 'cut-shadow-sm',
        }));
        tl.stagger(cards, { opacity: [0, 1], scale: [1, 1] },
          { at: at('v8') - 0.1, each: 0.13, dur: 0.4, ease: 'outCubic' });

        // the gate exemption — the practical, measurable part
        const chhoot = stage.add({
          id: 'm-chhoot',
          svg: mbCard(pick(640, 720), pick(100, 114), MB.indigo, { pattern: 'cross', sw: 5, seed: 'mc' })
             + text('दोगुनी दूरी पर — कोई हानि नहीं', { size: pick(36, 40), font: 'var(--font-deva)', fill: MB.cream }),
          x: CX, y: pick(H * 0.70, H * 0.74), layer: 11, scale: 0, shadow: 'cut-shadow',
        });
        Motion.place(tl, chhoot, { at: at('v13') + 0.3, dur: 0.5 });
        Motion.recoil(tl, cards, { at: at('v13') + 0.42, amp: 5 });

        stage.add({ id: 'm-tree', svg: mbTree(pick(170, 190), { kind: 'gular' }),
          x: pick(W * 0.26, CX), y: pick(H * 0.62, H * 0.62), layer: 6, shadow: 'cut-shadow' });
      },
    });
  },
};
