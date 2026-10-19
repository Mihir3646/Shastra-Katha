import { Motion } from '../../../engine/stage.js';
import { MB, mbBorder, mbVastuGrid, mbCard, mbBand, ink } from '../../../engine/madhubani.js';
import { text } from '../../../engine/kit.js';
import { tearWipe } from '../../../engine/transitions.js';

export default {
  id: 'kaaran',
  title: 'कारण और शास्त्र की गहराई',
  short: true,
  script: [
    { id: 'k1', text: 'अब देखिए, यह शास्त्र कितना विस्तृत है।', gap: 0.7 },
    { id: 'k2', text: 'इक्यासी खानों में से हर एक का अपना देवता है।', gap: 0.6 },
    { id: 'k3', text: 'ग्रंथ उन्हें गिनाता भी है। पूरब की पहली पंक्ति के आठ नाम —', gap: 0.5 },
    { id: 'k4', text: 'अग्नि, पर्जन्य, जयंत, इंद्र, सूर्य, सत्या, भृश, अंतरिक्ष।', gap: 1.0 },
    { id: 'k5', text: 'आठ खाने, आठ नाम। अध्याय तिरपन, श्लोक तैंतालीस।', gap: 0.8 },
    { id: 'k6', text: 'बत्तीस देवता बाहर के खानों में, तेरह भीतर।', gap: 0.7 },
    { id: 'k7', text: 'यानी रसोई का नियम अकेला नियम नहीं है।', gap: 0.5 },
    { id: 'k8', text: 'वह एक पूरी व्यवस्था का हिस्सा है।', gap: 0.9 },
    { id: 'k9', text: 'और परंपरा इस दिशा को अग्नि से जोड़ती है — इसीलिए आग्नेय।', gap: 0.6 },
    { id: 'k10', text: 'दिशा ग्रंथ में लिखी है। यह जोड़ परंपरा से आता है।', gap: 0.7 },
    { id: 'k11', text: 'दोनों का अपना स्थान है, और दोनों साथ चलते हैं।', gap: 0.6 },
  ],
  build({ stage, tl, at, end, from, pick }) {
    const W = stage.width, H = stage.height, CX = W / 2;
    tearWipe(stage, { at: from - 0.5, color: '#E3D2B8', dir: 'up', seed: 'w-k', travel: 0.45 });

    stage.scene({
      name: 'kaaran', from: from - 0.25, to: end('k11') + 0.4,
      build() {
        stage.add({ id: 'k-bg', svg: `<rect width="${W}" height="${H}" fill="#E3D2B8"/>`, x: 0, y: 0, layer: 0, boil: false });
        stage.add({ id: 'k-border', svg: mbBorder(W, H, { fill: MB.brown, pattern: 'cross' }), x: 0, y: 0, layer: 60, boil: false });
        tl.fromTo(stage.camera, { zoom: [1.0, 1.06] },
          { at: from, dur: (end('k11') + 0.4) - from, ease: 'inOutSine' });

        const gs = pick(Math.min(W * 0.34, 440), Math.min(W * 0.52, 520));
        const c = gs / 3;
        const gy = pick(H * 0.46, H * 0.42);
        const gx = pick(W * 0.3, CX);
        const labels = ['वायव्य','उत्तर','ईशान','पश्चिम','ब्रह्म','पूर्व','नैऋत्य','दक्षिण','आग्नेय'];

        const grid = stage.add({
          id: 'k-grid', svg: mbVastuGrid(gs, { labels }),
          x: gx, y: gy, layer: 4, opacity: 0, shadow: 'cut-shadow',
        });
        tl.fromTo(grid, { opacity: [0, 1], scale: [0.93, 1] }, { at: from, dur: 0.45, ease: 'outBack' });
        Motion.sway(tl, grid, { amp: 1, period: 6, at: from + 1 });

        // what everyone says: Agni in the south-east
        const claim = stage.add({
          id: 'k-claim',
          svg: ink(`M ${-c * 0.44} ${-c * 0.44} H ${c * 0.44} V ${c * 0.44} H ${-c * 0.44} Z`, MB.red, { pattern: 'hatch2', sw: 5 })
             + text('अग्नि', { size: c * 0.2, font: 'var(--font-deva)', fill: MB.cream }),
          x: gx + c, y: gy + c, layer: 6, scale: 0, shadow: 'cut-shadow-sm',
        });
        tl.fromTo(claim, { scale: [1.8, 1], opacity: [0, 1] }, { at: at('k9') + 1.8, dur: 0.4, ease: 'outBack' });

        const said = stage.add({
          id: 'k-said',
          svg: mbCard(pick(460, 580), pick(88, 100), MB.cream, { sw: 4.5, seed: 'sd' })
             + text('परंपरा का तर्क', { size: pick(34, 42), font: 'var(--font-deva)', fill: MB.inkSoft }),
          x: pick(W * 0.74, CX), y: pick(H * 0.24, H * 0.625), layer: 8, scale: 0, shadow: 'cut-shadow-sm',
        });
        tl.fromTo(said, { scale: [0.6, 1], opacity: [0, 1], rot: [-3, -1] }, { at: at('k9') + 1.4, dur: 0.4, ease: 'outBack' });

        const verse = stage.add({
          id: 'k-verse',
          svg: mbCard(pick(520, 660), pick(84, 96), MB.ochre, { pattern: 'hline', sw: 4.5, seed: 'vs' })
             + text('श्लोक ४३', { size: pick(36, 44), font: 'var(--font-deva)', fill: MB.ink }),
          x: pick(W * 0.74, CX), y: pick(H * 0.36, H * 0.725), layer: 8, scale: 0, shadow: 'cut-shadow-sm',
        });
        tl.fromTo(verse, { scale: [0.6, 1], opacity: [0, 1], rot: [3, 1] }, { at: at('k5') + 1.8, dur: 0.45, ease: 'outBack' });

        for (const el of [said, verse]) {
          tl.to(el, { opacity: 0, scale: 0.94 }, { at: at('k9') - 0.3, dur: 0.4 });
        }

        // three possible explanations, arriving one per line
        ['इक्यासी खाने', 'बत्तीस बाहर', 'तेरह भीतर'].forEach((t, i) => {
          const el = stage.add({
            id: `k-maybe${i}`,
            svg: mbCard(pick(400, 500), pick(74, 84), MB.cream, { sw: 4.5, seed: 'mb' + i })
               + text(t, { size: pick(32, 38), font: 'var(--font-deva)', fill: MB.ink }),
            x: pick(W * 0.74, CX), y: pick(H * (0.52 + i * 0.1), H * (0.59 + i * 0.072)), layer: 9, scale: 0, shadow: 'cut-shadow-sm',
          });
          tl.fromTo(el, { scale: [0.55, 1], opacity: [0, 1], rot: [i % 2 ? 3 : -3, i % 2 ? 1 : -1] },
            { at: at(['k2', 'k6', 'k6'][i]) + [0.6, 0.5, 2.0][i], dur: 0.42, ease: 'outBack' });
          // clear the options as the conclusion lands, so it owns the column
          tl.to(el, { opacity: 0, scale: 0.92 }, { at: at('k10') + 1.0, dur: 0.4 });
        });

        // the channel's actual position
        const honest = stage.add({
          id: 'k-honest',
          svg: mbCard(pick(660, 820), pick(110, 128), MB.deepRed, { pattern: 'hatch', sw: 5, seed: 'hn' })
             + text('ग्रंथ और परंपरा, दोनों', { size: pick(38, 46), font: 'var(--font-deva)', fill: MB.cream }),
          x: pick(W * 0.7, CX), y: pick(H * 0.64, H * 0.72), layer: 10, scale: 0, shadow: 'cut-shadow',
        });
        tl.fromTo(honest, { scale: [0.5, 1], opacity: [0, 1], rot: [-4, -1.5] },
          { at: at('k10') + 1.4, dur: 0.55, ease: 'outBack' });
        Motion.sway(tl, honest, { amp: 0.9, period: 4, at: at('k10') + 2 });
      },
    });
  },
};
