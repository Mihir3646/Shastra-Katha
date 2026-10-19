import { Motion } from '../../../engine/stage.js';
import { MB, mbBorder, mbVastuGrid, chulha, mbBand, mbCard, ink } from '../../../engine/madhubani.js';
import { text } from '../../../engine/kit.js';
import { fade } from '../../../engine/transitions.js';

export default {
  id: 'sawaal',
  title: 'सवाल',
  short: true,
  script: [
    { id: 's1', text: 'आपको बताया गया है — रसोई आग्नेय कोण में हो, क्योंकि वहाँ अग्नि का वास है।', gap: 0.9 },
    { id: 's2', text: 'पहली बात ग्रंथ में लिखी है। दूसरी, उसी अध्याय में नहीं मिलती।', gap: 1.0 },
    { id: 's3', text: 'आज हम दोनों पढ़ेंगे — और आपके घर के लिए इसका क्या मतलब है, वह भी।', gap: 0.8 },
    { id: 's4', text: 'सीधा जवाब पहले।', gap: 1.1 },
    { id: 's5', text: 'बृहत् संहिता कहती है — रसोई दक्षिण-पूर्व में।', gap: 1.0 },
    { id: 's6', text: 'यानी आग्नेय कोण। वही, जो आपने सुना है।', gap: 0.7 },
    { id: 's7', text: 'पर ग्रंथ अकेली रसोई की बात नहीं करता। वह चार कमरे एक साथ बताता है।', gap: 0.6 },
  ],
  build({ stage, tl, at, end, pick }) {
    const W = stage.width, H = stage.height, CX = W / 2;

    stage.scene({
      name: 'sawaal', from: 0, to: end('s7') + 0.4,
      build() {
        stage.add({ id: 'sw-border', svg: mbBorder(W, H), x: 0, y: 0, layer: 60, boil: false });
        tl.fromTo(stage.camera, { zoom: [1.0, 1.10] },
          { at: 0, dur: end('s7') + 0.4, ease: 'inOutSine' });

        // --- layout ------------------------------------------------------
        const GS = pick(Math.min(W * 0.34, 440), Math.min(W * 0.62, 600));
        const C  = GS / 3;
        const GX = pick(W * 0.66, CX), GY = pick(H * 0.52, H * 0.46);
        // the south-east cell of the plan — where the answer ends up
        const SEX = GX + C, SEY = GY + C;
        // where the stove starts: out on its own, being cooked on
        const HX = pick(W * 0.22, CX), HY = pick(H * 0.5, H * 0.2);

        const stove = stage.add({
          id: 'sw-chulha', svg: chulha(pick(290, 330)),
          x: HX, y: HY, layer: 9, scale: 0, shadow: 'cut-shadow',
        });
        Motion.fly(tl, stove, { at: 0.3, dur: 1.0, dir: 'l', dist: 500, arc: 80, spin: 8 });
        stage.sfx('paper-in', { at: 0.34, gain: 0.5 });
        stage.sfx('thud', { at: 1.12, gain: 0.45 });

        const flame = stage.add({
          id: 'sw-flame',
          svg: ink('M 0 -54 Q 21 -19, 0 8 Q -21 -19, 0 -54 Z', MB.ochre, { sw: 3.5 })
             + ink('M 0 -35 Q 10 -13, 0 4 Q -10 -13, 0 -35 Z', MB.red, { sw: 3 }),
          x: HX, y: HY + pick(8, 10), layer: 10, scale: 0, boil: false,
        });
        tl.fromTo(flame, { scale: [0, 1] }, { at: 1.2, dur: 0.45, ease: 'outBack' });
        Motion.flicker(tl, flame, { at: 1.7, amp: 0.13, speed: 9 });

        const q = stage.add({
          id: 'sw-q',
          svg: text('रसोई किस दिशा में?', { size: pick(60, 80), font: 'var(--font-deva)', fill: MB.ink }),
          x: pick(W * 0.66, CX), y: pick(H * 0.16, H * 0.1), layer: 8, opacity: 0,
        });
        tl.fromTo(q, { opacity: [0, 1], y: [q.y + 24, q.y] }, { at: at('s1') - 0.1, dur: 0.8, ease: 'outCubic' });

        // --- the plan, drawn as the viewer watches ------------------------
        // Not a diagram that appears: a square that gets divided. This is the
        // chapter's one real "interactive" beat — the viewer sees the system
        // being built before anything is claimed about it.
        const plan = stage.add({
          id: 'sw-plan',
          svg: mbVastuGrid(GS, { labels: ['वायव्य','उत्तर','ईशान','पश्चिम','ब्रह्म','पूर्व','नैऋत्य','दक्षिण','आग्नेय'] }),
          x: GX, y: GY, layer: 4, opacity: 0, shadow: 'cut-shadow',
        });
        Motion.drawOn(tl, plan, { at: at('s1') + 0.7, dur: 2.2, fade: 0.5 });
        stage.sfx('ink', { at: at('s1') + 0.75, gain: 0.42 });
        Motion.sway(tl, plan, { amp: 0.8, period: 7, at: at('s1') + 3.2 });

        // --- the answer: the kitchen MOVES to where the text puts it -------
        // Saying "south-east" and lighting a cell is a caption. Walking the
        // stove into that cell is the same fact, demonstrated.
        const SETTLE = at('s5') + 0.55;
        tl.to(stove, { x: SEX, y: SEY - C * 0.04, scale: C / 330 * 0.92, rot: 0 },
          { at: SETTLE, dur: 1.15, ease: 'inOutCubic' });
        stage.sfx('paper-out', { at: SETTLE + 0.05, gain: 0.38 });
        tl.to(flame, { x: SEX, y: SEY + C * 0.12, scale: C / 330 * 0.92 },
          { at: SETTLE, dur: 1.15, ease: 'inOutCubic' });

        // the cell accepts it, and the plan flinches as it lands
        const cell = stage.add({
          id: 'sw-cell',
          svg: ink(`M ${-C * 0.46} ${-C * 0.46} H ${C * 0.46} V ${C * 0.46} H ${-C * 0.46} Z`,
                   MB.yellow, { pattern: 'dots', sw: 5 }),
          x: SEX, y: SEY, layer: 5, opacity: 0, scale: 0,
        });
        tl.fromTo(cell, { opacity: [0, 1], scale: [0.6, 1] },
          { at: SETTLE + 1.0, dur: 0.45, ease: 'outBack' });
        // the kitchen lands in its corner: the one beat the chapter exists for
        stage.sfx('impact', { at: SETTLE + 1.02, gain: 0.6 });
        stage.sfx('chime', { at: SETTLE + 1.14, gain: 0.3 });
        Motion.recoil(tl, [plan], { at: SETTLE + 1.12, amp: 8 });

        const tag = stage.add({
          id: 'sw-tag',
          svg: mbCard(pick(400, 520), pick(92, 110), MB.cream, { sw: 5, seed: 'tag' })
             + text('दक्षिण-पूर्व', { size: pick(42, 52), font: 'var(--font-deva)', fill: MB.deepRed }),
          x: pick(W * 0.24, CX), y: pick(H * 0.72, H * 0.74), layer: 9, scale: 0, shadow: 'cut-shadow',
        });
        Motion.fly(tl, tag, { at: SETTLE + 1.15, dur: 0.8, dir: 'b', dist: 280, arc: 30, spin: 6 });
        stage.sfx('paper-in', { at: SETTLE + 1.2, gain: 0.42 });

        // --- and there are three more rooms, which is chapter 2 ------------
        const more = ['देवता', 'बर्तन', 'कोष'].map((t, i) => stage.add({
          id: `sw-more${i}`,
          svg: mbCard(pick(190, 230), pick(66, 76), MB.ochre, { pattern: 'dots', sw: 4, seed: 'm' + i })
             + text(t, { size: pick(30, 36), font: 'var(--font-deva)', fill: MB.ink }),
          x: pick(W * 0.24, CX * 0.55 + i * CX * 0.45), y: pick(H * 0.30 + i * 0.1, H * 0.86),
          layer: 8, scale: 0, shadow: 'cut-shadow-sm',
        }));
        tl.stagger(more, { scale: [0.5, 1], opacity: [0, 1] },
          { at: at('s7') + 0.5, each: 0.18, dur: 0.5, ease: 'outBack' });
        more.forEach((_, i) => stage.sfx('tick', { at: at('s7') + 0.52 + i * 0.18, gain: 0.4 }));

        fade(stage, { at: 0, dur: 0.6, to: 'in' });
      },
    });
  },
};
