import { Motion } from '../../../engine/stage.js';
import { MB, mbBorder, mbCard, mbTree, mbLotus, kalash } from '../../../engine/madhubani.js';
import { text } from '../../../engine/kit.js';
import { tearWipe } from '../../../engine/transitions.js';

export default {
  id: 'vidhi',
  title: 'काटना ही पड़े तो',
  short: true,
  script: [
    { id: 'k1', text: 'और अगर पेड़ काटना ही पड़े?', gap: 0.9 },
    { id: 'k2', text: 'ग्रंथ वहाँ भी विधि बताता है। श्लोक एक सौ बीस।', gap: 0.3 },
    { id: 'k3', text: 'पहले यह कि कौन से पेड़ नहीं काटे जाते।', gap: 0.3 },
    { id: 'k4', text: 'जिन पर पक्षी बसते हैं।', gap: 0.15 },
    { id: 'k5', text: 'जिनमें देवता का वास माना गया है।', gap: 0.15 },
    { id: 'k6', text: 'जो श्मशान भूमि पर उगे हों।', gap: 0.15 },
    { id: 'k7', text: 'और जो टूटे, सूखे या जले हुए हों।', gap: 0.9 },
    { id: 'k8', text: 'फिर श्लोक एक सौ इक्कीस।', gap: 0.3 },
    { id: 'k9', text: 'रात में पेड़ को पका अन्न अर्पित कीजिए, और पूजा कीजिए।', gap: 0.9 },
    { id: 'k10', text: 'अगले दिन ही उसे काटा जाए — बाएँ से दाएँ।', gap: 0.9 },
    { id: 'k11', text: 'और अगर वह उत्तर या पूरब की ओर गिरे —', gap: 0.3 },
    { id: 'k12', text: 'तो ग्रंथ कहता है, धन की वृद्धि होती है।', gap: 0.3 },
  ],
  build({ stage, tl, at, end, from, pick }) {
    const W = stage.width, H = stage.height, CX = W / 2;
    tearWipe(stage, { at: from - 0.5, color: '#F0E4C4', dir: 'right', seed: 'w-v', travel: 0.45 });

    stage.scene({
      name: 'vidhi', from: from - 0.25, to: end('k12') + 0.5,
      build() {
        stage.add({ id: 'v-bg', svg: `<rect width="${W}" height="${H}" fill="#F0E4C4"/>`, x: 0, y: 0, layer: 0 });
        stage.add({ id: 'v-border', svg: mbBorder(W, H, { fill: MB.deepRed, pattern: 'hatch' }), x: 0, y: 0, layer: 60 });

        const tree = stage.add({
          id: 'v-tree', svg: mbTree(pick(300, 280), { kind: 'bargad' }),
          x: pick(W * 0.24, CX), y: pick(H * 0.44, H * 0.26), layer: 6, scale: 0, shadow: 'cut-shadow',
        });
        Motion.place(tl, tree, { at: from, dur: 0.6 });

        // the four the text sets aside, accumulating one per line
        const NA = [
          ['पक्षी बसते हों', 'k4'],
          ['देवता का वास', 'k5'],
          ['श्मशान भूमि', 'k6'],
          ['टूटे, सूखे, जले', 'k7'],
        ];
        const naCards = NA.map(([t, cue], i) => {
          const el = stage.add({
            id: `v-na${i}`,
            svg: mbCard(pick(330, 380), pick(66, 74), MB.cream, { sw: 4, seed: 'vn' + i })
               + text(t, { size: pick(30, 34), font: 'var(--font-deva)', fill: MB.ink }),
            x: pick(W * 0.70, CX), y: pick(H * 0.18 + i * 0.105, H * 0.46 + i * 0.075), layer: 9,
            scale: 0, shadow: 'cut-shadow-sm',
          });
          Motion.place(tl, el, { at: at(cue) + 0.1, dur: 0.42 });
          return el;
        });

        // the ritual — the most distinctive beat in the episode
        const ann = stage.add({
          id: 'v-ann', svg: kalash(pick(120, 134)),
          x: pick(W * 0.24, CX * 0.55), y: pick(H * 0.72, H * 0.78), layer: 7, scale: 0, shadow: 'cut-shadow',
        });
        Motion.place(tl, ann, { at: at('k9') + 0.3, dur: 0.5 });
        const lotus = stage.add({
          id: 'v-lotus', svg: mbLotus(pick(56, 64)),
          x: pick(W * 0.36, CX * 1.45), y: pick(H * 0.72, H * 0.78), layer: 7, scale: 0, shadow: 'cut-shadow-sm',
        });
        Motion.place(tl, lotus, { at: at('k9') + 0.7, dur: 0.45 });
        Motion.recoil(tl, [tree], { at: at('k9') + 0.42, amp: 6 });

        const pooja = stage.add({
          id: 'v-pooja',
          svg: mbCard(pick(560, 640), pick(96, 108), MB.ochre, { pattern: 'hline', sw: 5, seed: 'vp' })
             + text('रात में अन्न और पूजा', { size: pick(38, 42), font: 'var(--font-deva)', fill: MB.ink }),
          x: pick(W * 0.70, CX), y: pick(H * 0.62, H * 0.86), layer: 10, scale: 0, shadow: 'cut-shadow',
        });
        Motion.place(tl, pooja, { at: at('k9') + 0.5, dur: 0.5 });

        const dhan = stage.add({
          id: 'v-dhan',
          svg: mbCard(pick(520, 600), pick(96, 108), MB.green, { pattern: 'hatch2', sw: 5, seed: 'vd' })
             + text('उत्तर या पूरब — धन की वृद्धि', { size: pick(34, 38), font: 'var(--font-deva)', fill: MB.cream }),
          x: pick(W * 0.70, CX), y: pick(H * 0.72, H * 0.66), layer: 10, scale: 0, shadow: 'cut-shadow',
        });
        Motion.place(tl, dhan, { at: at('k12') + 0.2, dur: 0.5 });
        Motion.recoil(tl, naCards, { at: at('k12') + 0.32, amp: 5 });
      },
    });
  },
};
