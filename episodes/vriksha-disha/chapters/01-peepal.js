import { Motion } from '../../../engine/stage.js';
import { MB, mbBorder, mbCard, mbTree, compass } from '../../../engine/madhubani.js';
import { text } from '../../../engine/kit.js';
import { fade } from '../../../engine/transitions.js';

export default {
  id: 'peepal',
  title: 'पीपल',
  short: true,
  script: [
    { id: 's1', text: 'पीपल का पेड़ घर के पास शुभ है या अशुभ?', gap: 0.9 },
    { id: 's2', text: 'यह सवाल सबसे ज़्यादा पूछा जाता है।', gap: 0.3 },
    { id: 's3', text: 'बृहत् संहिता इसका जवाब हाँ या ना में नहीं देती।', gap: 0.9 },
    { id: 's4', text: 'वह दिशा से देती है।', gap: 0.9 },
    { id: 's5', text: 'अध्याय तिरपन, श्लोक पचासी।', gap: 0.3 },
    { id: 's6', text: 'पीपल पश्चिम दिशा में शुभ कहा गया है।', gap: 0.9 },
    { id: 's7', text: 'और ग्रंथ अकेले पीपल की बात नहीं करता। वह चार पेड़ गिनाता है।', gap: 0.3 },
  ],
  build({ stage, tl, at, end, from, pick }) {
    const W = stage.width, H = stage.height, CX = W / 2;

    stage.scene({
      name: 'peepal', from: 0, to: end('s7') + 0.4,
      build() {
        stage.add({ id: 'p-bg', svg: `<rect width="${W}" height="${H}" fill="#EFE0C0"/>`, x: 0, y: 0, layer: 0 });
        stage.add({ id: 'p-border', svg: mbBorder(W, H, { fill: MB.green, pattern: 'leafrow' }), x: 0, y: 0, layer: 60 });

        const q = stage.add({
          id: 'p-q',
          svg: text('पीपल — किस दिशा में?', { size: pick(62, 72), font: 'var(--font-deva)', fill: MB.ink }),
          x: pick(W * 0.66, CX), y: pick(H * 0.15, H * 0.09), layer: 8, opacity: 0,
        });
        Motion.place(tl, q, { at: at('s1') - 0.1, dur: 0.6 });

        // the tree is the subject; it arrives, then finds its direction
        const tree = stage.add({
          id: 'p-tree', svg: mbTree(pick(330, 300), { kind: 'peepal' }),
          x: pick(W * 0.24, CX), y: pick(H * 0.50, H * 0.26), layer: 6, scale: 0, shadow: 'cut-shadow',
        });
        Motion.fly(tl, tree, { at: 0.4, dur: 1.0, dir: 'b', dist: 420, arc: 40, spin: 6 });

        // the compass inks itself in — the answer is a direction, so the
        // direction has to be on screen before the answer lands
        const rose = stage.add({
          id: 'p-rose', svg: compass(pick(180, 200)),
          x: pick(W * 0.68, CX), y: pick(H * 0.50, H * 0.58), layer: 5, opacity: 0, shadow: 'cut-shadow',
        });
        Motion.drawOn(tl, rose, { at: at('s3') + 0.3, dur: 1.8, fade: 0.45 });
        Motion.sway(tl, rose, { amp: 0.7, period: 7, at: at('s3') + 2.4 });

        const cite = stage.add({
          id: 'p-cite',
          svg: mbCard(pick(440, 540), pick(84, 96), MB.cream, { sw: 4.5, seed: 'pc' })
             + text('बृहत् संहिता ५३.८५', { size: pick(34, 40), font: 'var(--font-deva)', fill: MB.ink }),
          x: pick(W * 0.24, CX), y: pick(H * 0.72, H * 0.72), layer: 9, scale: 0, shadow: 'cut-shadow-sm',
        });
        Motion.place(tl, cite, { at: at('s5') + 0.2 });

        // the answer: west
        const west = stage.add({
          id: 'p-west',
          svg: mbCard(pick(380, 460), pick(96, 110), MB.green, { pattern: 'hatch2', sw: 5, seed: 'pw' })
             + text('पश्चिम', { size: pick(44, 52), font: 'var(--font-deva)', fill: MB.cream }),
          x: pick(W * 0.68, CX), y: pick(H * 0.72, H * 0.86), layer: 10, scale: 0, shadow: 'cut-shadow',
        });
        Motion.place(tl, west, { at: at('s6') + 0.5, dur: 0.5 });
        Motion.recoil(tl, [rose, tree], { at: at('s6') + 0.62, amp: 7 });

        fade(stage, { at: 0, dur: 0.6, to: 'in' });
      },
    });
  },
};
