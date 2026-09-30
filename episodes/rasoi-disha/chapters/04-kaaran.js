import { Motion } from '../../../engine/stage.js';
import { MB, mbBorder, mbVastuGrid, mbCard, mbBand, ink } from '../../../engine/madhubani.js';
import { text } from '../../../engine/kit.js';
import { tearWipe } from '../../../engine/transitions.js';

export default {
  id: 'kaaran',
  title: 'कारण और शास्त्र की गहराई',
  short: true,
  script: [
    { id: 'k1', text: 'अब वह बात, जो आपने सबसे ज़्यादा सुनी होगी।', gap: 0.4 },
    { id: 'k2', text: 'रसोई दक्षिण-पूर्व में क्यों? कहा जाता है — क्योंकि वह अग्नि का कोना है।' },
    { id: 'k3', text: 'यह तर्क सुंदर है, और परंपरा में गहराई से बैठा हुआ है।', gap: 0.5 },
    { id: 'k4', text: 'और यहीं शास्त्र की एक ख़ूबी सामने आती है।' },
    { id: 'k5', text: 'बृहत् संहिता सिर्फ़ नियम नहीं, पूरा नक़्शा देती है — हर खाना, हर देवता।' },
    { id: 'k6', text: 'तैंतालीसवाँ श्लोक वही गिनती बताता है।', gap: 0.45 },
    { id: 'k7', text: 'और जिस अनुवाद को हमने पढ़ा, उसमें यह क्रम थोड़ा अलग मिलता है।' },
    { id: 'k8', text: 'यह कोई कमी नहीं है। यह बताता है कि शास्त्र कितना विस्तृत है।', gap: 0.4 },
    { id: 'k9', text: 'सदियों में अलग-अलग परंपराओं ने इसे अलग-अलग ढंग से सँभाला।' },
    { id: 'k10', text: 'अनुवाद अलग हो सकते हैं, पाठ अलग हो सकते हैं, गिनती की रीति अलग हो सकती है।', gap: 0.45 },
    { id: 'k11', text: 'इसीलिए एक अनुवाद पढ़कर पूरी बात कह देना ठीक नहीं होगा।' },
    { id: 'k12', text: 'शास्त्र का सम्मान इसी में है कि हम उसे ठीक-ठीक पढ़ें, और जल्दबाज़ी में न बोलें।' },
    { id: 'k13', text: 'मयमतम् और मानसार जैसे ग्रंथ भी इसी विषय पर हैं। उन्हें हम आगे पढ़ेंगे।' },
  ],
  build({ stage, tl, at, end, from, pick }) {
    const W = stage.width, H = stage.height, CX = W / 2;
    tearWipe(stage, { at: from - 0.5, color: '#E3D2B8', dir: 'up', seed: 'w-k', travel: 0.45 });

    stage.scene({
      name: 'kaaran', from: from - 0.25, to: end('k13') + 0.4,
      build() {
        stage.add({ id: 'k-bg', svg: `<rect width="${W}" height="${H}" fill="#E3D2B8"/>`, x: 0, y: 0, layer: 0, boil: false });
        stage.add({ id: 'k-border', svg: mbBorder(W, H, { fill: MB.brown, pattern: 'cross' }), x: 0, y: 0, layer: 60, boil: false });
        tl.fromTo(stage.camera, { zoom: [1.0, 1.06] },
          { at: from, dur: (end('k13') + 0.4) - from, ease: 'inOutSine' });

        const gs = pick(Math.min(W * 0.34, 440), Math.min(W * 0.66, 620));
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
        tl.fromTo(claim, { scale: [1.8, 1], opacity: [0, 1] }, { at: at('k2') + 1.8, dur: 0.4, ease: 'outBack' });

        const said = stage.add({
          id: 'k-said',
          svg: mbCard(pick(460, 580), pick(88, 100), MB.cream, { sw: 4.5, seed: 'sd' })
             + text('परंपरा का तर्क', { size: pick(34, 42), font: 'var(--font-deva)', fill: MB.inkSoft }),
          x: pick(W * 0.74, CX), y: pick(H * 0.24, H * 0.76), layer: 8, scale: 0, shadow: 'cut-shadow-sm',
        });
        tl.fromTo(said, { scale: [0.6, 1], opacity: [0, 1], rot: [-3, -1] }, { at: at('k2') + 1.4, dur: 0.4, ease: 'outBack' });

        // what the verse actually says: Agni at square 1 = north-east
        const actual = stage.add({
          id: 'k-actual',
          svg: ink(`M ${-c * 0.44} ${-c * 0.44} H ${c * 0.44} V ${c * 0.44} H ${-c * 0.44} Z`, MB.deepRed, { pattern: 'cross', sw: 5 })
             + text('अग्नि', { size: c * 0.19, font: 'var(--font-deva)', fill: MB.cream }),
          x: gx + c, y: gy - c, layer: 7, scale: 0, opacity: 0, shadow: 'cut-shadow-sm',
        });
        tl.fromTo(actual, { scale: [2.2, 1], opacity: [0, 1], rot: [8, -2] }, { at: at('k5') + 1.4, dur: 0.5, ease: 'outBack' });
        tl.drive(actual, (l, g, s) => { s.scale = 1 + Math.sin(g * 3.4) * 0.04; }, { at: at('k5') + 2 });
        // and the south-east claim visibly weakens
        tl.to(claim, { opacity: 0.25 }, { at: at('k5') + 1.6, dur: 0.6 });

        const vayu = stage.add({
          id: 'k-vayu',
          svg: ink(`M ${-c * 0.44} ${-c * 0.44} H ${c * 0.44} V ${c * 0.44} H ${-c * 0.44} Z`, MB.sky, { pattern: 'wave', sw: 5 })
             + text('वायु', { size: c * 0.19, font: 'var(--font-deva)', fill: MB.ink }),
          x: gx + c, y: gy + c, layer: 8, scale: 0, opacity: 0, shadow: 'cut-shadow-sm',
        });
        tl.fromTo(vayu, { scale: [1.9, 1], opacity: [0, 1] }, { at: at('k6') + 1.3, dur: 0.45, ease: 'outBack' });

        const verse = stage.add({
          id: 'k-verse',
          svg: mbCard(pick(520, 660), pick(84, 96), MB.ochre, { pattern: 'hline', sw: 4.5, seed: 'vs' })
             + text('श्लोक ४३', { size: pick(36, 44), font: 'var(--font-deva)', fill: MB.ink }),
          x: pick(W * 0.74, CX), y: pick(H * 0.36, H * 0.86), layer: 8, scale: 0, shadow: 'cut-shadow-sm',
        });
        tl.fromTo(verse, { scale: [0.6, 1], opacity: [0, 1], rot: [3, 1] }, { at: at('k4') + 1.8, dur: 0.45, ease: 'outBack' });

        // three possible explanations, arriving one per line
        ['विस्तृत नक़्शा', 'कई परंपराएँ', 'ध्यान से पढ़ना'].forEach((t, i) => {
          const el = stage.add({
            id: `k-maybe${i}`,
            svg: mbCard(pick(400, 500), pick(74, 84), MB.cream, { sw: 4.5, seed: 'mb' + i })
               + text(t, { size: pick(32, 38), font: 'var(--font-deva)', fill: MB.ink }),
            x: pick(W * 0.74, CX), y: pick(H * 0.52 + i * 0.1, H * 0.56 + i * 0.085), layer: 9, scale: 0, shadow: 'cut-shadow-sm',
          });
          tl.fromTo(el, { scale: [0.55, 1], opacity: [0, 1], rot: [i % 2 ? 3 : -3, i % 2 ? 1 : -1] },
            { at: at(['k9', 'k10', 'k11'][i]) + 0.5, dur: 0.42, ease: 'outBack' });
          // clear the options as the conclusion lands, so it owns the column
          tl.to(el, { opacity: 0, scale: 0.92 }, { at: at('k12') + 1.0, dur: 0.4 });
        });

        // the channel's actual position
        const honest = stage.add({
          id: 'k-honest',
          svg: mbCard(pick(660, 820), pick(110, 128), MB.deepRed, { pattern: 'hatch', sw: 5, seed: 'hn' })
             + text('शास्त्र को ठीक-ठीक पढ़ें', { size: pick(38, 46), font: 'var(--font-deva)', fill: MB.cream }),
          x: pick(W * 0.7, CX), y: pick(H * 0.64, H * 0.72), layer: 10, scale: 0, shadow: 'cut-shadow',
        });
        tl.fromTo(honest, { scale: [0.5, 1], opacity: [0, 1], rot: [-4, -1.5] },
          { at: at('k12') + 1.4, dur: 0.55, ease: 'outBack' });
        Motion.sway(tl, honest, { amp: 0.9, period: 4, at: at('k12') + 2 });
      },
    });
  },
};
