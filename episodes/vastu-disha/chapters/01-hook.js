import { Motion } from '../../../engine/stage.js';
import { MB, mbBorder, mbVastuGrid, sunFace, chulha, mbSteam, mbBand, ink } from '../../../engine/madhubani.js';
import { text } from '../../../engine/kit.js';
import { fade } from '../../../engine/transitions.js';

export default {
  id: 'hook',
  title: 'सवाल',
  short: true,
  script: [
    { id: 'h1', text: 'हर घर में एक कोना ऐसा होता है जिसे लोग सबसे ज़्यादा ग़लत समझते हैं।', gap: 0.4 },
    { id: 'h2', text: 'रसोई। और शास्त्र इस बारे में बहुत साफ़ है।' },
  ],
  build({ stage, tl, at, end, pick }) {
    const W = stage.width, H = stage.height, CX = W / 2;

    stage.scene({
      name: 'hook', from: 0, to: end('h2') + 0.35,
      build() {
        stage.add({ id: 'hk-border', svg: mbBorder(W, H), x: 0, y: 0, layer: 60, boil: false });

        const sun = stage.add({
          id: 'hk-sun', svg: sunFace(pick(74, 84)),
          x: pick(W * 0.17, CX), y: pick(H * 0.3, H * 0.16), layer: 5, scale: 0, shadow: 'cut-shadow',
        });
        tl.fromTo(sun, { scale: [0, 1], rot: [-60, 0] }, { at: 0.15, dur: 0.55, ease: 'outBack' });
        Motion.spin(tl, sun, { rpm: 0.45, at: 0.7 });

        const title = stage.add({
          id: 'hk-title',
          svg: text('वास्तु शास्त्र', { size: pick(60, 78), font: 'var(--font-deva)', fill: MB.ink }),
          x: pick(W * 0.17, CX), y: pick(H * 0.56, H * 0.27), layer: 6, opacity: 0,
        });
        tl.fromTo(title, { opacity: [0, 1], y: [pick(H * 0.6, H * 0.3), pick(H * 0.56, H * 0.27)] },
          { at: 0.35, dur: 0.45, ease: 'outCubic' });

        const band = stage.add({
          id: 'hk-band', svg: mbBand(pick(420, 560), { h: 26, fill: MB.ochre, pattern: 'chevron' }),
          x: pick(W * 0.17, CX), y: pick(H * 0.66, H * 0.32), layer: 5, scaleX: 0,
        });
        tl.fromTo(band, { scaleX: [0, 1] }, { at: 0.55, dur: 0.4, ease: 'outQuart' });

        const gs = pick(Math.min(W * 0.34, 430), Math.min(W * 0.72, 680));
        const c = gs / 3;
        const labels = ['वायव्य','उत्तर','ईशान','पश्चिम','ब्रह्म','पूर्व','नैऋत्य','दक्षिण','आग्नेय'];

        const grid = stage.add({
          id: 'hk-grid',
          svg: mbVastuGrid(gs, { labels, highlight: null }),
          x: pick(W * 0.52, CX), y: pick(H * 0.47, H * 0.52), layer: 4, opacity: 0, scale: 0.9, shadow: 'cut-shadow',
        });
        tl.fromTo(grid, { opacity: [0, 1], scale: [0.9, 1], rot: [-3, 0] },
          { at: at('h1') + 0.15, dur: 0.5, ease: 'outBack' });
        Motion.sway(tl, grid, { amp: 1.5, period: 4.2, at: at('h1') + 0.8 });

        // the "wrong corner" pulses, unnamed, while line 1 lands
        const mark = stage.add({
          id: 'hk-mark',
          svg: ink(`M ${-c/2} ${-c/2} H ${c/2} V ${c/2} H ${-c/2} Z`, '#00000000', { stroke: MB.red, sw: 7 }),
          x: pick(W * 0.52, CX) + c, y: pick(H * 0.47, H * 0.52) + c, layer: 7, opacity: 0, boil: false,
        });
        tl.fromTo(mark, { opacity: [0, 1] }, { at: end('h1') - 1.0, dur: 0.3 });
        tl.drive(mark, (local, g, s) => { s.scale = 1 + Math.sin(g * 5) * 0.045; }, { at: end('h1') - 1.0 });

        // line 2 says रसोई — so show a kitchen, not a diagram of one
        const stove = stage.add({
          id: 'hk-chulha', svg: chulha(pick(300, 340)),
          x: pick(W * 0.84, CX), y: pick(H * 0.5, H * 0.76), layer: 8, scale: 0, shadow: 'cut-shadow',
        });
        tl.fromTo(stove, { scale: [0, 1], y: [pick(H * 0.56, H * 0.8), pick(H * 0.5, H * 0.76)] },
          { at: at('h2') - 0.12, dur: 0.45, ease: 'outBack' });

        const flame = stage.add({
          id: 'hk-flame',
          svg: ink(`M 0 -52 Q 20 -18, 0 8 Q -20 -18, 0 -52 Z`, MB.ochre, { sw: 3.5 })
             + ink(`M 0 -34 Q 10 -13, 0 4 Q -10 -13, 0 -34 Z`, MB.red, { sw: 3 }),
          x: pick(W * 0.84, CX), y: pick(H * 0.5, H * 0.76) + pick(6, 8), layer: 9, scale: 0, boil: false,
        });
        tl.fromTo(flame, { scale: [0, 1] }, { at: at('h2') + 0.18, dur: 0.3, ease: 'outBack' });
        Motion.flicker(tl, flame, { at: at('h2') + 0.5, amp: 0.13, speed: 9 });

        [-1, 1].forEach((s, i) => {
          const st = stage.add({
            id: `hk-steam${i}`, svg: mbSteam(pick(70, 90), { width: 4 }),
            x: pick(W * 0.84, CX) + s * pick(26, 32), y: pick(H * 0.36, H * 0.69), layer: 8, opacity: 0, boil: false,
          });
          tl.fromTo(st, { opacity: [0, 0.6], y: [pick(H * 0.4, H * 0.71), pick(H * 0.34, H * 0.67)] },
            { at: at('h2') + 0.5 + i * 0.18, dur: 1.2, ease: 'outCubic' });
          Motion.sway(tl, st, { amp: 3, period: 2.4, phase: i * 0.5, at: at('h2') + 0.8 });
        });

        // slow push in across the chapter — the single biggest contributor to
        // the frame feeling alive between events
        Motion.push(tl, stage.camera, { at: 0, dur: end('h2') + 0.3, from: 1.0, to: 1.055 });

        fade(stage, { at: 0, dur: 0.5, to: 'in' });
      },
    });
  },
};
