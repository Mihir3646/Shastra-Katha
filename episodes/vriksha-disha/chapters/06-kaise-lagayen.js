import { Motion } from '../../../engine/stage.js';
import { MB, mbBorder, mbCard, mbTree, mbBand } from '../../../engine/madhubani.js';
import { text } from '../../../engine/kit.js';
import { tearWipe, fade } from '../../../engine/transitions.js';
import { addDisclaimer } from '../../../engine/disclaimer.js';

export default {
  id: 'kaise',
  title: 'कैसे लगाएँ',
  short: true,
  script: [
    { id: 'n1', text: 'और लगाने का तरीक़ा भी ग्रंथ बताता है।', gap: 0.3 },
    { id: 'n2', text: 'कुछ पेड़ बीज से लगाए जाते हैं।', gap: 0.15 },
    { id: 'n3', text: 'और कुछ जड़ या शाखा से।', gap: 0.9 },
    { id: 'n4', text: 'श्लोक चार और पाँच में दस नाम दिए गए हैं।', gap: 0.3 },
    { id: 'n5', text: 'पनस, अशोक, केला, जामुन, लकुच —', gap: 0.15 },
    { id: 'n6', text: 'दाड़िम, द्राक्षा, पालीवत, बीजपूर और अतिमुक्तक।', gap: 0.9 },
    { id: 'n7', text: 'इन्हें जड़ काटकर, या शाखा काटकर लगाया जाता है।', gap: 0.3 },
    { id: 'n8', text: 'और जहाँ से काटा हो, वहाँ गोबर लगाने को कहा गया है।', gap: 0.9 },
    { id: 'n9', text: 'यानी ग्रंथ सिर्फ़ दिशा नहीं बताता।', gap: 0.15 },
    { id: 'n10', text: 'वह बागवानी भी सिखाता है।', gap: 0.9 },
    { id: 'n11', text: 'हम वही कहेंगे जितना ग्रंथ कहता है।', gap: 0.3 },
    { id: 'n12', text: 'अनुवाद मुफ़्त है। लिंक नीचे है — ख़ुद मिला लीजिए।', gap: 0.9 },
    { id: 'n13', text: 'पिछले वीडियो में हमने जल का ज़िक्र किया था।', gap: 0.3 },
    { id: 'n14', text: 'वह इसी अध्याय में है — और अगला वीडियो उसी पर।', gap: 0.3 },
    { id: 'n15', text: 'बने रहिए।', gap: 0.4 },
  ],
  build({ stage, tl, at, end, from, pick }) {
    const W = stage.width, H = stage.height, CX = W / 2;
    tearWipe(stage, { at: from - 0.5, color: '#EFE0C0', dir: 'right', seed: 'w-k', travel: 0.45 });

    stage.scene({
      name: 'kaise', from: from - 0.25, to: end('n15') + 1.3,
      build() {
        stage.add({ id: 'k-bg', svg: `<rect width="${W}" height="${H}" fill="#EFE0C0"/>`, x: 0, y: 0, layer: 0 });
        stage.add({ id: 'k-border', svg: mbBorder(W, H, { fill: MB.leaf, pattern: 'leafrow' }), x: 0, y: 0, layer: 60 });

        // two methods, side by side
        const beej = stage.add({
          id: 'k-beej',
          svg: mbCard(pick(360, 430), pick(86, 96), MB.ochre, { pattern: 'dots', sw: 4.5, seed: 'kb' })
             + text('बीज से', { size: pick(38, 44), font: 'var(--font-deva)', fill: MB.ink }),
          x: pick(W * 0.24, CX), y: pick(H * 0.20, H * 0.14), layer: 9, scale: 0, shadow: 'cut-shadow-sm',
        });
        Motion.place(tl, beej, { at: at('n2') + 0.1, dur: 0.45 });

        const jad = stage.add({
          id: 'k-jad',
          svg: mbCard(pick(400, 470), pick(86, 96), MB.green, { pattern: 'hatch2', sw: 4.5, seed: 'kj' })
             + text('जड़ या शाखा से', { size: pick(34, 40), font: 'var(--font-deva)', fill: MB.cream }),
          x: pick(W * 0.24, CX), y: pick(H * 0.33, H * 0.25), layer: 9, scale: 0, shadow: 'cut-shadow-sm',
        });
        Motion.place(tl, jad, { at: at('n3') + 0.1, dur: 0.45 });

        // the ten, arriving as two waves on the two lines that name them
        const DAS = [['पनस', 'n5'], ['अशोक', 'n5'], ['केला', 'n5'], ['जामुन', 'n5'], ['लकुच', 'n5'],
                     ['दाड़िम', 'n6'], ['द्राक्षा', 'n6'], ['पालीवत', 'n6'], ['बीजपूर', 'n6'], ['अतिमुक्तक', 'n6']];
        const first = [], second = [];
        DAS.forEach(([t, cue], i) => {
          const col = i % 5, row = Math.floor(i / 5);
          const el = stage.add({
            id: `k-d${i}`,
            svg: mbCard(pick(172, 230), pick(56, 64), MB.cream, { sw: 3.8, seed: 'kd' + i })
               + text(t, { size: pick(24, 29), font: 'var(--font-deva)', fill: MB.ink }),
            x: pick(W * (0.52 + col * 0.085), CX + (col - 2) * 190),
            y: pick(H * (0.22 + row * 0.11), H * (0.42 + row * 0.085)),
            layer: 9, scale: 0, shadow: 'cut-shadow-sm',
          });
          (cue === 'n5' ? first : second).push(el);
        });
        tl.stagger(first,  { opacity: [0, 1], scale: [1, 1] }, { at: at('n5') - 0.05, each: 0.1, dur: 0.38, ease: 'outCubic' });
        tl.stagger(second, { opacity: [0, 1], scale: [1, 1] }, { at: at('n6') - 0.05, each: 0.1, dur: 0.38, ease: 'outCubic' });

        const tree = stage.add({
          id: 'k-tree', svg: mbTree(pick(220, 240), { kind: 'plain' }),
          x: pick(W * 0.24, CX), y: pick(H * 0.56, H * 0.62), layer: 6, scale: 0, shadow: 'cut-shadow',
        });
        Motion.place(tl, tree, { at: at('n7') + 0.2, dur: 0.55 });

        const gobar = stage.add({
          id: 'k-gobar',
          svg: mbCard(pick(460, 540), pick(90, 100), MB.brown, { pattern: 'stipple', sw: 5, seed: 'kg' })
             + text('कटे हिस्से पर गोबर', { size: pick(34, 38), font: 'var(--font-deva)', fill: MB.cream }),
          x: pick(W * 0.70, CX), y: pick(H * 0.65, H * 0.72), layer: 10, scale: 0, shadow: 'cut-shadow',
        });
        Motion.place(tl, gobar, { at: at('n8') + 0.3, dur: 0.5 });
        Motion.recoil(tl, [tree], { at: at('n8') + 0.42, amp: 6 });

        // episode 1 said water would be next; it is, and this names it
        const next = stage.add({
          id: 'k-next',
          svg: mbCard(pick(540, 620), pick(96, 108), MB.blue, { pattern: 'wave', sw: 5, seed: 'kn' })
             + text('अगली बार — जल का स्थान', { size: pick(34, 38), font: 'var(--font-deva)', fill: MB.cream }),
          x: pick(W * 0.70, CX), y: pick(H * 0.43, H * 0.52), layer: 11, scale: 0, shadow: 'cut-shadow',
        });
        Motion.place(tl, next, { at: at('n14') + 0.2, dur: 0.5 });

        const sub = stage.add({
          id: 'k-sub',
          svg: text('बने रहिए', { size: pick(46, 54), font: 'var(--font-deva)', fill: MB.deepRed }),
          x: pick(W * 0.70, CX), y: pick(H * 0.53, H * 0.62), layer: 11, opacity: 0,
        });
        Motion.place(tl, sub, { at: at('n15') + 0.1, dur: 0.45 });

        stage.add({ id: 'k-band', svg: mbBand(pick(340, 400), { h: 18, fill: MB.ochre, pattern: 'chevron' }),
          x: pick(W * 0.24, CX), y: pick(H * 0.70, H * 0.84), layer: 5 });

        fade(stage, { at: end('n15') + 0.75, dur: 0.5, to: 'out' });
        addDisclaimer(stage, { at: end('n15') + 1.25, hold: 3.8 });
      },
    });
  },
};
