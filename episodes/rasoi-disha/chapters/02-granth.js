import { Motion } from '../../../engine/stage.js';
import { MB, mbBorder, mbCard, mbVastuGrid, mbBand, sunFace, ink } from '../../../engine/madhubani.js';
import { text } from '../../../engine/kit.js';
import { tearWipe } from '../../../engine/transitions.js';

export default {
  id: 'granth',
  title: 'ग्रंथ',
  short: true,
  script: [
    { id: 'g1', text: 'ग्रंथ का नाम है — बृहत् संहिता।', gap: 0.4 },
    { id: 'g2', text: 'लेखक वराहमिहिर। समय, छठी शताब्दी। यानी लगभग पंद्रह सौ साल पुराना।' },
    { id: 'g3', text: 'यह मुख्य रूप से ज्योतिष का ग्रंथ है। ग्रह, नक्षत्र, वर्षा, खेती।' },
    { id: 'g4', text: 'पर इसका तिरपनवाँ अध्याय पूरा का पूरा घर बनाने पर है।', gap: 0.45 },
    { id: 'g5', text: 'और उस अध्याय की पहली ही पंक्ति एक शब्द इस्तेमाल करती है — वास्तुविद्या।' },
    { id: 'g6', text: 'विद्या। यानी सीखी और सिखाई जाने वाली व्यवस्थित जानकारी।' },
    { id: 'g7', text: 'ग्रंथ खुद इसे अंधविश्वास नहीं, एक शास्त्र मानता है।', gap: 0.5 },
    { id: 'g8', text: 'अब उसी अध्याय के एक सौ अठारहवें श्लोक पर आइए।' },
    { id: 'g9', text: 'अनुवाद है — देवताओं का स्थान ईशान कोण में बने।' },
    { id: 'g10', text: 'रसोई दक्षिण-पूर्व में। घर के बर्तनों का कमरा नैऋत्य में।' },
    { id: 'g11', text: 'और कोष तथा अनाज का भंडार वायव्य कोण में।', gap: 0.5 },
    { id: 'g12', text: 'बस। यही वह पंक्ति है जिससे यह पूरा नियम निकलता है।' },
    { id: 'g13', text: 'बृहत् संहिता, अध्याय तिरपन, श्लोक एक सौ अठारह। लिंक नीचे है।' },
  ],
  build({ stage, tl, at, end, from, pick }) {
    const W = stage.width, H = stage.height, CX = W / 2;
    tearWipe(stage, { at: from - 0.5, color: '#E7D3B4', dir: 'up', seed: 'w-g', travel: 0.45 });

    stage.scene({
      name: 'granth', from: from - 0.25, to: end('g13') + 0.4,
      build() {
        stage.add({ id: 'g-bg', svg: `<rect width="${W}" height="${H}" fill="#E7D3B4"/>`, x: 0, y: 0, layer: 0, boil: false });
        stage.add({ id: 'g-border', svg: mbBorder(W, H, { fill: MB.indigo }), x: 0, y: 0, layer: 60, boil: false });
        tl.fromTo(stage.camera, { zoom: [1.0, 1.06], y: [0, -12] },
          { at: from, dur: (end('g13') + 0.4) - from, ease: 'inOutSine' });

        // the book itself
        const book = stage.add({
          id: 'g-book',
          svg: mbCard(pick(430, 520), pick(300, 350), MB.cream, { sw: 6, seed: 'bk' })
             + text('बृहत्\nसंहिता', { size: pick(60, 72), font: 'var(--font-deva)', fill: MB.ink, lineHeight: 1.25 }),
          x: pick(W * 0.24, CX), y: pick(H * 0.3, H * 0.33), layer: 6, scale: 0, shadow: 'cut-shadow',
        });
        tl.fromTo(book, { scale: [0.4, 1], opacity: [0, 1], rot: [-7, -2] }, { at: from + 0.1, dur: 0.6, ease: 'outBack' });
        Motion.sway(tl, book, { amp: 1.1, period: 5, at: from + 1 });

        // author and date, arriving as they are spoken
        [['वराहमिहिर', 'g2', 0], ['छठी शताब्दी', 'g2', 1.6]].forEach(([label, line, off], i) => {
          const el = stage.add({
            id: `g-meta${i}`,
            svg: mbCard(pick(320, 400), pick(72, 84), i ? MB.ochre : MB.green, { pattern: 'hatch2', sw: 4.5, seed: 'm' + i })
               + text(label, { size: pick(34, 42), font: 'var(--font-deva)', fill: MB.cream }),
            x: pick(W * 0.24, CX), y: pick(H * 0.53 + i * 0.09, H * 0.6 + i * 0.09), layer: 7, scale: 0, shadow: 'cut-shadow-sm',
          });
          tl.fromTo(el, { scale: [0, 1], rot: [i ? 3 : -3, i ? 1 : -1] },
            { at: at(line) + off, dur: 0.45, ease: 'outBack' });
        });

        // vastu-vidya — the word that justifies the whole framing
        const vidya = stage.add({
          id: 'g-vidya',
          svg: mbCard(pick(520, 640), pick(110, 126), MB.deepRed, { pattern: 'hatch', sw: 5, seed: 'vd' })
             + text('वास्तुविद्या', { size: pick(52, 62), font: 'var(--font-deva)', fill: MB.cream }),
          x: pick(W * 0.72, CX), y: pick(H * 0.28, H * 0.8), layer: 8, scale: 0, shadow: 'cut-shadow',
        });
        tl.fromTo(vidya, { scale: [2.4, 1], opacity: [0, 1], rot: [6, -1.5] },
          { at: at('g5') + 1.6, dur: 0.5, ease: 'outBack' });
        tl.drive(vidya, (l, g, s) => { s.scale = 1 + Math.sin(g * 2.8) * 0.022; }, { at: at('g5') + 2.2 });

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
        tl.fromTo(grid, { opacity: [0, 1], scale: [0.92, 1] }, { at: at('g8') + 0.4, dur: 0.5, ease: 'outBack' });

        rooms.forEach(([label, cell, colour], i) => {
          const col = cell % 3, row = (cell / 3) | 0;
          const el = stage.add({
            id: `g-room${i}`,
            svg: ink(`M ${-c * 0.44} ${-c * 0.44} H ${c * 0.44} V ${c * 0.44} H ${-c * 0.44} Z`, colour,
                     { pattern: 'hatch2', sw: 5 })
               + text(label, { size: c * 0.19, font: 'var(--font-deva)', fill: MB.cream }),
            x: gx + (col - 1) * c, y: gy + (row - 1) * c, layer: 6, scale: 0, shadow: 'cut-shadow-sm',
          });
          const cue = i === 0 ? at('g9') + 0.7 : i === 1 ? at('g10') + 0.2 : i === 2 ? at('g10') + 2.2 : at('g11') + 0.5;
          tl.fromTo(el, { scale: [1.9, 1], opacity: [0, 1], rot: [i % 2 ? 4 : -4, 0] },
            { at: cue, dur: 0.4, ease: 'outBack' });
          if (i === 1) tl.drive(el, (l, g, s) => { s.scale = 1 + Math.sin(g * 3) * 0.035; }, { at: cue + 0.5 });
        });

        // the citation, held on screen
        const cite = stage.add({
          id: 'g-cite',
          svg: mbCard(pick(620, 780), pick(84, 96), MB.cream, { sw: 4.5, seed: 'ct' })
             + text('बृहत् संहिता — अध्याय ५३, श्लोक ११८', { size: pick(32, 38), font: 'var(--font-deva)', fill: MB.ink }),
          x: CX, y: pick(H * 0.8, H * 0.74), layer: 9, opacity: 0, shadow: 'cut-shadow-sm',
        });
        tl.fromTo(cite, { opacity: [0, 1], y: [pick(H * 0.83, H * 0.77), pick(H * 0.8, H * 0.74)] },
          { at: at('g12') + 0.3, dur: 0.45, ease: 'outCubic' });
      },
    });
  },
};
