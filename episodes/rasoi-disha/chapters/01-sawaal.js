import { Motion } from '../../../engine/stage.js';
import { MB, mbBorder, mbVastuGrid, chulha, mbBand, mbCard, ink } from '../../../engine/madhubani.js';
import { text } from '../../../engine/kit.js';
import { fade } from '../../../engine/transitions.js';

export default {
  id: 'sawaal',
  title: 'सवाल',
  short: true,
  script: [
    { id: 's1', text: 'आपको बताया गया है — रसोई आग्नेय कोण में हो, क्योंकि वहाँ अग्नि का वास है।', gap: 0.4 },
    { id: 's2', text: 'पहली बात ग्रंथ में लिखी है। दूसरी, उसी अध्याय में नहीं मिलती।' },
    { id: 's3', text: 'आज हम दोनों पढ़ेंगे — और आपके घर के लिए इसका क्या मतलब है, वह भी।', gap: 0.45 },
    { id: 's4', text: 'सीधा जवाब पहले।', gap: 0.35 },
    { id: 's5', text: 'बृहत् संहिता कहती है — रसोई दक्षिण-पूर्व में।', gap: 0.4 },
    { id: 's6', text: 'यानी आग्नेय कोण। वही, जो आपने सुना है।' },
    { id: 's7', text: 'पर ग्रंथ अकेली रसोई की बात नहीं करता। वह चार कमरे एक साथ बताता है।' },
  ],
  build({ stage, tl, at, end, pick }) {
    const W = stage.width, H = stage.height, CX = W / 2;

    stage.scene({
      name: 'sawaal', from: 0, to: end('s7') + 0.4,
      build() {
        stage.add({ id: 'sw-border', svg: mbBorder(W, H), x: 0, y: 0, layer: 60, boil: false });
        tl.fromTo(stage.camera, { zoom: [1.0, 1.06] },
          { at: 0, dur: end('s7') + 0.4, ease: 'inOutSine' });

        // a kitchen, because that is what the question is about
        const stove = stage.add({
          id: 'sw-chulha', svg: chulha(pick(300, 340)),
          x: pick(W * 0.26, CX), y: pick(H * 0.56, H * 0.19), layer: 6, scale: 0, shadow: 'cut-shadow',
        });
        tl.fromTo(stove, { scale: [0, 1], rot: [-6, 0] }, { at: 0.3, dur: 0.6, ease: 'outBack' });

        const flame = stage.add({
          id: 'sw-flame',
          svg: ink('M 0 -54 Q 21 -19, 0 8 Q -21 -19, 0 -54 Z', MB.ochre, { sw: 3.5 })
             + ink('M 0 -35 Q 10 -13, 0 4 Q -10 -13, 0 -35 Z', MB.red, { sw: 3 }),
          x: pick(W * 0.26, CX), y: pick(H * 0.56, H * 0.19) + pick(8, 10), layer: 7, scale: 0, boil: false,
        });
        tl.fromTo(flame, { scale: [0, 1] }, { at: 0.75, dur: 0.35, ease: 'outBack' });
        Motion.flicker(tl, flame, { at: 1.1, amp: 0.13, speed: 9 });

        // the question itself
        const q = stage.add({
          id: 'sw-q',
          svg: text('रसोई किस दिशा में?', { size: pick(66, 86), font: 'var(--font-deva)', fill: MB.ink }),
          x: pick(W * 0.7, CX), y: pick(H * 0.3, H * 0.665), layer: 8, opacity: 0,
        });
        tl.fromTo(q, { opacity: [0, 1], scale: [0.88, 1] }, { at: at('s1') - 0.1, dur: 0.5, ease: 'outBack' });
        Motion.sway(tl, q, { amp: 0.9, period: 5, at: at('s1') + 0.8 });

        // the answer everybody already has
        const grid = stage.add({
          id: 'sw-grid',
          svg: mbVastuGrid(pick(Math.min(W * 0.3, 400), Math.min(W * 0.66, 620)), {
            labels: ['वायव्य','उत्तर','ईशान','पश्चिम','ब्रह्म','पूर्व','नैऋत्य','दक्षिण','आग्नेय'],
          }),
          x: pick(W * 0.7, CX), y: pick(H * 0.58, H * 0.47), layer: 5, opacity: 0, shadow: 'cut-shadow',
        });
        tl.fromTo(grid, { opacity: [0, 1], scale: [0.9, 1] }, { at: at('s1') + 0.8, dur: 0.55, ease: 'outBack' });
        Motion.sway(tl, grid, { amp: 1.2, period: 5.5, at: at('s1') + 1.6 });

        // the answer itself — the corner lights up on the line that names it
        const gs1 = pick(Math.min(W * 0.3, 400), Math.min(W * 0.66, 620)), c1 = gs1 / 3;
        const gx1 = pick(W * 0.7, CX), gy1 = pick(H * 0.58, H * 0.47);
        const hit = stage.add({
          id: 'sw-hit',
          svg: ink(`M ${-c1 * 0.46} ${-c1 * 0.46} H ${c1 * 0.46} V ${c1 * 0.46} H ${-c1 * 0.46} Z`, MB.deepRed, { pattern: 'hatch', sw: 5 })
             + text('आग्नेय', { size: c1 * 0.2, font: 'var(--font-deva)', fill: MB.cream }),
          x: gx1 + c1, y: gy1 + c1, layer: 7, scale: 0, opacity: 0, shadow: 'cut-shadow-sm',
        });
        tl.fromTo(hit, { scale: [2.1, 1], opacity: [0, 1], rot: [7, -1] },
          { at: at('s5') + 0.9, dur: 0.5, ease: 'outBack' });
        tl.drive(hit, (l, g, s2) => { s2.scale = 1 + Math.sin(g * 3.1) * 0.035; }, { at: at('s5') + 1.5 });

        // "says who?" — the question the channel exists to answer
        const ask = stage.add({
          id: 'sw-ask',
          svg: mbCard(pick(470, 620), pick(100, 120), MB.cream, { sw: 5, seed: 'ask' })
             + text('दक्षिण-पूर्व', { size: pick(44, 54), font: 'var(--font-deva)', fill: MB.deepRed }),
          x: pick(W * 0.28, CX), y: pick(H * 0.72, H * 0.70), layer: 9, scale: 0, shadow: 'cut-shadow',
        });
        tl.fromTo(ask, { scale: [0.5, 1], opacity: [0, 1], rot: [-4, -1.5] },
          { at: at('s5') + 0.5, dur: 0.5, ease: 'outBack' });
        tl.drive(ask, (l, g, s) => { s.scale = 1 + Math.sin(g * 3.2) * 0.02; }, { at: at('s5') + 1.1 });
        if (pick(false, true)) tl.to(q, { opacity: 0 }, { at: at('s5') + 0.3, dur: 0.35 });
        tl.to(ask, { opacity: 0, scale: 0.9 }, { at: at('s7') - 0.3, dur: 0.35 });

        const band = stage.add({
          id: 'sw-band', svg: mbBand(pick(430, 560), { h: 20, fill: MB.ochre, pattern: 'chevron' }),
          x: pick(W * 0.26, CX), y: pick(H * 0.72, H * 0.86), layer: 7, scaleX: 0,
        });
        tl.fromTo(band, { scaleX: [0, 1] }, { at: at('s7'), dur: 0.5, ease: 'outQuart' });

        fade(stage, { at: 0, dur: 0.6, to: 'in' });
      },
    });
  },
};
