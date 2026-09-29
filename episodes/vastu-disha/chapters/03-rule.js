import { Motion } from '../../../engine/stage.js';
import { MB, mbBorder, mbVastuGrid, mbCard, mbLotus, fish, sunFace, mbBand, ink } from '../../../engine/madhubani.js';
import { text } from '../../../engine/kit.js';
import { tearWipe, fade } from '../../../engine/transitions.js';
import { addDisclaimer } from '../../../engine/disclaimer.js';

export default {
  id: 'rule',
  title: 'नियम',
  short: true,
  script: [
    { id: 'r1', text: 'अगर आग्नेय कोण संभव न हो, तो उत्तर-पश्चिम दूसरा विकल्प है।' },
    { id: 'r2', text: 'लेकिन ईशान कोण में रसोई कभी नहीं। वहाँ जल का स्थान है।' },
  ],
  build({ stage, tl, at, end, from, pick }) {
    const W = stage.width, H = stage.height, CX = W / 2;
    tearWipe(stage, { at: from - 0.45, color: '#F2E7C9', dir: 'up', seed: 'w-rule', travel: 0.42 });

    stage.scene({
      name: 'rule', from: from - 0.22, to: end('r2') + 1.3,
      build() {
        stage.add({ id: 'ru-bg', svg: `<rect width="${W}" height="${H}" fill="#F2E7C9"/>`, x: 0, y: 0, layer: 0, boil: false });
        tl.fromTo(stage.camera, { zoom: [1.0, 1.05], y: [0, 10] },
          { at: from, dur: (end('r2') + 1.2) - from, ease: 'inOutSine' });

        stage.add({ id: 'ru-border', svg: mbBorder(W, H, { fill: MB.green, pattern: 'leafrow' }), x: 0, y: 0, layer: 60, boil: false });

        const gs = pick(Math.min(W * 0.34, 430), Math.min(W * 0.68, 650));
        const c = gs / 3;
        const gy = pick(H * 0.44, H * 0.42);
        const labels = ['वायव्य','उत्तर','ईशान','पश्चिम','ब्रह्म','पूर्व','नैऋत्य','दक्षिण','आग्नेय'];

        const grid = stage.add({
          id: 'ru-grid', svg: mbVastuGrid(gs, { labels }),
          x: pick(W * 0.36, CX), y: gy, layer: 4, opacity: 0, shadow: 'cut-shadow',
        });
        tl.fromTo(grid, { opacity: [0, 1], scale: [0.94, 1] }, { at: from, dur: 0.4, ease: 'outBack' });
        Motion.sway(tl, grid, { amp: 1.4, period: 4.5, at: from + 0.8 });

        // verdict stamps land ON the grid cells they refer to
        const stamp = (id, cell, mark, colour, atT, rot) => {
          const col = cell % 3, row = (cell / 3) | 0;
          const el = stage.add({
            id, x: pick(W * 0.36, CX) + (col - 1) * c, y: gy + (row - 1) * c, layer: 8, scale: 0, shadow: 'cut-shadow-sm',
            svg: ink(`M ${-c*0.42} ${-c*0.42} H ${c*0.42} V ${c*0.42} H ${-c*0.42} Z`, colour, { pattern: 'hatch2', sw: 5 })
               + text(mark, { size: c * 0.42, fill: MB.cream, weight: 700 }),
          });
          tl.fromTo(el, { scale: [2.2, 1], opacity: [0, 1], rot: [rot * 4, rot] },
            { at: atT, dur: 0.34, ease: 'outBack' });
          tl.drive(el, (l, g, s) => { s.scale = 1 + Math.sin(g * 3 + cell) * 0.025; }, { at: atT + 0.4 });
          return el;
        };
        stamp('ru-ok',  8, '✓', MB.green,  from + 0.5,          -2);   // आग्नेय
        stamp('ru-alt', 0, '~', MB.ochre,  at('r1') + 1.5,       2);   // वायव्य
        stamp('ru-no',  2, '✗', MB.deepRed, at('r2') + 0.45,    -3);   // ईशान

        // "वहाँ जल का स्थान है" — so water arrives in that corner
        const lotus = stage.add({
          id: 'ru-lotus', svg: mbLotus(pick(58, 70)),
          x: pick(W * 0.36, CX) + c, y: gy - c, layer: 9, scale: 0, shadow: 'cut-shadow-sm',
        });
        tl.fromTo(lotus, { scale: [0, 1], rot: [-40, 0] }, { at: end('r2') - 1.1, dur: 0.5, ease: 'outBack' });
        Motion.spin(tl, lotus, { rpm: 0.5, at: end('r2') - 0.6 });

        [0, 1].forEach(i => {
          const f = stage.add({
            id: `ru-fish${i}`, svg: fish(pick(90, 110)),
            x: pick(W * 0.36, CX) + c + (i ? 1 : -1) * pick(70, 86), y: gy - c + pick(54, 64) + i * 6,
            layer: 8, scale: 0, opacity: 0, shadow: 'cut-shadow-sm',
          });
          tl.fromTo(f, { scale: [0, 1], opacity: [0, 1] }, { at: end('r2') - 0.85 + i * 0.16, dur: 0.4, ease: 'outBack' });
          Motion.sway(tl, f, { amp: 3, period: 2.6, phase: i * 0.4, at: end('r2') - 0.4 });
        });

        // closing card
        const close = stage.add({
          id: 'ru-close',
          svg: mbCard(pick(520, 640), pick(96, 112), MB.ochre, { pattern: 'chevron', sw: 5, seed: 'cl' })
             + text('रसोई → आग्नेय कोण', { size: pick(40, 48), font: 'var(--font-deva)', fill: MB.ink }),
          x: pick(W * 0.76, CX), y: pick(H * 0.48, H * 0.78), layer: 10, scale: 0, shadow: 'cut-shadow',
        });
        tl.fromTo(close, { scale: [0.6, 1], opacity: [0, 1], rot: [-3, -1] },
          { at: end('r2') + 0.15, dur: 0.5, ease: 'outBack' });
        Motion.sway(tl, close, { amp: 1.6, period: 3.6, at: end('r2') + 0.7 });

        const sun = stage.add({
          id: 'ru-sun', svg: sunFace(pick(44, 54)),
          x: pick(W * 0.76, CX - W * 0.33), y: pick(H * 0.2, H * 0.16), layer: 5, scale: 0,
        });
        tl.fromTo(sun, { scale: [0, 1] }, { at: end('r2') + 0.4, dur: 0.4, ease: 'outBack' });
        Motion.spin(tl, sun, { rpm: 0.5, at: end('r2') + 0.8 });

        fade(stage, { at: end('r2') + 0.85, dur: 0.5, to: 'out' });

        // Held long enough to actually read. Not optional on this channel.
        addDisclaimer(stage, { at: end('r2') + 1.35, hold: 3.6 });
      },
    });
  },
};
