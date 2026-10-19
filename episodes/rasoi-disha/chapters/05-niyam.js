import { Motion } from '../../../engine/stage.js';
import { MB, mbBorder, mbVastuGrid, mbCard, mbBand, sunFace, chulha, mbLotus, ink } from '../../../engine/madhubani.js';
import { text } from '../../../engine/kit.js';
import { tearWipe, fade } from '../../../engine/transitions.js';
import { addDisclaimer } from '../../../engine/disclaimer.js';

export default {
  id: 'niyam',
  title: 'निश्चित और अनिश्चित',
  short: true,
  script: [
    { id: 'n1', text: 'तो आपके घर के लिए इसका क्या मतलब है?', gap: 0.7 },
    { id: 'n2', text: 'ग्रंथ जो कहता है, वह साफ़ है। रसोई — दक्षिण-पूर्व।', gap: 0.6 },
    { id: 'n3', text: 'देवता उत्तर-पूर्व। बर्तन दक्षिण-पश्चिम। कोष उत्तर-पश्चिम।', gap: 0.8 },
    { id: 'n4', text: 'इन चारों को आप आज अपने घर के नक़्शे पर मिला सकते हैं।', gap: 0.9 },
    { id: 'n5', text: 'और अगर आपकी रसोई वहाँ नहीं है?', gap: 1.2 },
    { id: 'n6', text: 'यहाँ हम सीधी बात कहेंगे। इस अध्याय में उसका कोई उपाय नहीं लिखा।', gap: 0.7 },
    { id: 'n7', text: 'जो उपाय बताए जाते हैं, वे परंपरा से आते हैं — इस श्लोक से नहीं।', gap: 0.6 },
    { id: 'n8', text: 'दोनों का अपना स्थान है। पर दोनों एक नहीं हैं।', gap: 0.9 },
    { id: 'n9', text: 'हम वही कहेंगे जितना ग्रंथ कहता है। आगे का निर्णय आपका।', gap: 0.8 },
    { id: 'n10', text: 'मयमतम् या मानसार हो, तो तैंतालीसवाँ श्लोक मिलाकर कमेंट में बताइए।', gap: 0.7 },
    { id: 'n11', text: 'अगली बार, इसी अध्याय में — जल का स्थान।', gap: 0.8 },
    { id: 'n12', text: 'बने रहिए।', gap: 0.4 },
  ],
  build({ stage, tl, at, end, from, pick }) {
    const W = stage.width, H = stage.height, CX = W / 2;
    tearWipe(stage, { at: from - 0.5, color: '#F0E4C4', dir: 'up', seed: 'w-n', travel: 0.45 });

    stage.scene({
      name: 'niyam', from: from - 0.25, to: end('n12') + 1.3,
      build() {
        stage.add({ id: 'n-bg', svg: `<rect width="${W}" height="${H}" fill="#F0E4C4"/>`, x: 0, y: 0, layer: 0, boil: false });
        stage.add({ id: 'n-border', svg: mbBorder(W, H, { fill: MB.green, pattern: 'leafrow' }), x: 0, y: 0, layer: 60, boil: false });
        tl.fromTo(stage.camera, { zoom: [1.0, 1.05], y: [0, 10] },
          { at: from, dur: (end('n12') + 1.2) - from, ease: 'inOutSine' });

        const sun = stage.add({
          id: 'n-sun', svg: sunFace(pick(48, 60), { face: 'none' }),
          x: pick(W * 0.14, CX - W * 0.34), y: pick(H * 0.16, H * 0.15), layer: 5, scale: 0,
        });
        tl.fromTo(sun, { scale: [0, 1] }, { at: from, dur: 0.45, ease: 'outBack' });
        Motion.spin(tl, sun, { rpm: 0.35, at: from + 0.6 });

        const gs = pick(Math.min(W * 0.3, 390), Math.min(W * 0.58, 560));
        const c = gs / 3;
        const gy = pick(H * 0.42, H * 0.38);
        const gx = pick(W * 0.3, CX);
        const grid = stage.add({
          id: 'n-grid',
          svg: mbVastuGrid(gs, { labels: ['वायव्य','उत्तर','ईशान','पश्चिम','ब्रह्म','पूर्व','नैऋत्य','दक्षिण','आग्नेय'] }),
          x: gx, y: gy, layer: 4, opacity: 0, shadow: 'cut-shadow',
        });
        tl.fromTo(grid, { opacity: [0, 1], scale: [0.93, 1] }, { at: from, dur: 0.45, ease: 'outBack' });
        Motion.sway(tl, grid, { amp: 1, period: 6, at: from + 1 });

        // CERTAIN — the kitchen, stamped with a tick
        const sure = stage.add({
          id: 'n-sure',
          svg: ink(`M ${-c * 0.44} ${-c * 0.44} H ${c * 0.44} V ${c * 0.44} H ${-c * 0.44} Z`, MB.green, { pattern: 'hatch2', sw: 5 })
             + text('✓', { size: c * 0.34, fill: MB.cream, weight: 700 }),
          x: gx + c, y: gy + c, layer: 6, scale: 0, shadow: 'cut-shadow-sm',
        });
        tl.fromTo(sure, { scale: [2, 1], opacity: [0, 1], rot: [-6, 0] }, { at: at('n2') + 1.5, dur: 0.42, ease: 'outBack' });
        tl.drive(sure, (l, g, s) => { s.scale = 1 + Math.sin(g * 2.8) * 0.028; }, { at: at('n2') + 2.1 });

        const cite = stage.add({
          id: 'n-cite',
          svg: mbCard(pick(560, 700), pick(84, 96), MB.cream, { sw: 4.5, seed: 'nc' })
             + text('बृहत् संहिता ५३.११८', { size: pick(34, 42), font: 'var(--font-deva)', fill: MB.ink }),
          x: pick(W * 0.74, CX), y: pick(H * 0.24, H * 0.72), layer: 8, scale: 0, shadow: 'cut-shadow-sm',
        });
        tl.fromTo(cite, { scale: [0.6, 1], opacity: [0, 1], rot: [-2, -1] }, { at: at('n3') + 0.4, dur: 0.45, ease: 'outBack' });

        // UNCERTAIN — the reason
        const unsure = stage.add({
          id: 'n-unsure',
          svg: mbCard(pick(520, 640), pick(88, 100), MB.ochre, { pattern: 'cross', sw: 4.5, seed: 'nu' })
             + text('अपने नक़्शे पर मिलाइए', { size: pick(34, 42), font: 'var(--font-deva)', fill: MB.ink }),
          x: pick(W * 0.74, CX), y: pick(H * 0.38, H * 0.8), layer: 8, scale: 0, shadow: 'cut-shadow-sm',
        });
        tl.fromTo(unsure, { scale: [0.6, 1], opacity: [0, 1], rot: [3, 1] }, { at: at('n4') + 0.8, dur: 0.45, ease: 'outBack' });

        // NOT IN THE TEXT — the inference people mistake for scripture
        const notText = stage.add({
          id: 'n-nottext',
          svg: mbCard(pick(560, 700), pick(88, 100), MB.deepRed, { pattern: 'hatch', sw: 4.5, seed: 'nt' })
             + text('उपाय परंपरा से', { size: pick(34, 42), font: 'var(--font-deva)', fill: MB.cream }),
          x: pick(W * 0.74, CX), y: pick(H * 0.52, H * 0.88), layer: 8, scale: 0, shadow: 'cut-shadow-sm',
        });
        tl.fromTo(notText, { scale: [0.6, 1], opacity: [0, 1], rot: [-3, -1] }, { at: at('n7') + 0.4, dur: 0.45, ease: 'outBack' });

        // hand the right column over to the closing statement
        for (const el of [cite, unsure, notText]) {
          tl.to(el, { opacity: 0, scale: 0.94 }, { at: at('n11') - 0.1, dur: 0.4 });
        }

        // the shrine corner the text DOES name
        const shrine = stage.add({
          id: 'n-shrine',
          svg: ink(`M ${-c * 0.44} ${-c * 0.44} H ${c * 0.44} V ${c * 0.44} H ${-c * 0.44} Z`, MB.sky, { pattern: 'dots', sw: 5 })
             + text('देवता', { size: c * 0.18, font: 'var(--font-deva)', fill: MB.ink }),
          x: gx + c, y: gy - c, layer: 6, scale: 0, shadow: 'cut-shadow-sm',
        });
        tl.fromTo(shrine, { scale: [1.8, 1], opacity: [0, 1] }, { at: at('n8') + 0.6, dur: 0.42, ease: 'outBack' });

        const lotus = stage.add({
          id: 'n-lotus', svg: mbLotus(pick(46, 56)),
          x: gx + c, y: gy - c - c * 0.34, layer: 8, scale: 0, shadow: 'cut-shadow-sm',
        });
        tl.fromTo(lotus, { scale: [0, 1], rot: [-40, 0] }, { at: at('n9') + 0.6, dur: 0.45, ease: 'outBack' });
        Motion.spin(tl, lotus, { rpm: 0.3, at: at('n9') + 1.1 });

        // the closing promise
        const rule = stage.add({
          id: 'n-rule',
          svg: mbCard(pick(700, 880), pick(118, 136), MB.deepRed, { pattern: 'hatch', sw: 5, seed: 'nr' })
             + text('शास्त्र, पूरे सम्मान के साथ', { size: pick(36, 46), font: 'var(--font-deva)', fill: MB.cream }),
          x: pick(W * 0.72, CX), y: pick(H * 0.44, H * 0.58), layer: 10, scale: 0, shadow: 'cut-shadow',
        });
        tl.fromTo(rule, { scale: [0.5, 1], opacity: [0, 1], rot: [-3, -1] },
          { at: at('n11') + 0.3, dur: 0.55, ease: 'outBack' });
        Motion.sway(tl, rule, { amp: 0.9, period: 4, at: at('n11') + 1 });

        const sub = stage.add({
          id: 'n-sub',
          svg: text('बने रहिए', { size: pick(48, 58), font: 'var(--font-deva)', fill: MB.deepRed }),
          x: pick(W * 0.72, CX), y: pick(H * 0.58, H * 0.68), layer: 10, opacity: 0,
        });
        tl.fromTo(sub, { opacity: [0, 1], y: [pick(H * 0.61, H * 0.71), pick(H * 0.58, H * 0.68)] },
          { at: at('n12') + 1.2, dur: 0.5, ease: 'outCubic' });

        fade(stage, { at: end('n12') + 0.75, dur: 0.5, to: 'out' });
        addDisclaimer(stage, { at: end('n12') + 1.25, hold: 3.8 });
      },
    });
  },
};
