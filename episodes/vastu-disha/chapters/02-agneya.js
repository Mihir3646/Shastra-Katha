import { Motion } from '../../../engine/stage.js';
import { MB, mbBorder, mbVastuGrid, compass, chulha, sunFace, mbCard, mbDisc, ink } from '../../../engine/madhubani.js';
import { text } from '../../../engine/kit.js';
import { tearWipe } from '../../../engine/transitions.js';

export default {
  id: 'agneya',
  title: 'आग्नेय कोण',
  short: true,
  script: [
    { id: 'a1', text: 'दक्षिण-पूर्व दिशा को आग्नेय कोण कहते हैं। अग्नि का कोना।' },
    { id: 'a2', text: 'मयमतम् और विश्वकर्मा प्रकाश, दोनों रसोई को यहीं रखते हैं।' },
    { id: 'a3', text: 'कारण सीधा है। सुबह की धूप इसी कोने से आती है।' },
  ],
  build({ stage, tl, at, end, from, pick }) {
    const W = stage.width, H = stage.height, CX = W / 2;
    tearWipe(stage, { at: from - 0.45, color: '#E7D3B4', dir: 'up', seed: 'w-ag', travel: 0.42 });

    stage.scene({
      name: 'agneya', from: from - 0.22, to: end('a3') + 0.35,
      build() {
        stage.add({ id: 'ag-bg', svg: `<rect width="${W}" height="${H}" fill="#E7D3B4"/>`, x: 0, y: 0, layer: 0, boil: false });
        tl.fromTo(stage.camera, { zoom: [1.0, 1.06], y: [0, -14] },
          { at: from, dur: (end('a3') + 0.3) - from, ease: 'inOutSine' });

        stage.add({ id: 'ag-border', svg: mbBorder(W, H, { fill: MB.indigo }), x: 0, y: 0, layer: 60, boil: false });

        // A compass first, so "south-east" means something before the grid appears.
        const cmp = stage.add({
          id: 'ag-compass', svg: compass(pick(58, 72)),
          x: pick(W * 0.16, CX), y: pick(H * 0.3, H * 0.19), layer: 6, scale: 0, shadow: 'cut-shadow-sm',
        });
        tl.fromTo(cmp, { scale: [0, 1] }, { at: from, dur: 0.45, ease: 'outBack' });
        Motion.sway(tl, cmp, { amp: 1.2, period: 5, at: from + 0.8 });

        const gs = pick(Math.min(W * 0.36, 460), Math.min(W * 0.74, 700));
        const c = gs / 3;
        const gy = pick(H * 0.5, H * 0.47);
        const labels = ['वायव्य','उत्तर','ईशान','पश्चिम','ब्रह्म','पूर्व','नैऋत्य','दक्षिण','आग्नेय'];

        const grid = stage.add({
          id: 'ag-grid', svg: mbVastuGrid(gs, { labels }),
          x: pick(W * 0.44, CX), y: gy, layer: 4, opacity: 0, shadow: 'cut-shadow',
        });
        tl.fromTo(grid, { opacity: [0, 1], scale: [0.92, 1] }, { at: from + 0.25, dur: 0.45, ease: 'outBack' });
        Motion.sway(tl, grid, { amp: 1.4, period: 4.5, at: from + 1 });

        // the आग्नेय cell fills in, then keeps a slow breathing pulse
        const hot = stage.add({
          id: 'ag-hot',
          svg: ink(`M ${-c/2} ${-c/2} H ${c/2} V ${c/2} H ${-c/2} Z`, MB.red, { pattern: 'hatch2', sw: 5 })
             + `<text x="0" y="${c*0.07}" text-anchor="middle" font-family="var(--font-deva)"
                  font-size="${c*0.2}" font-weight="700" fill="${MB.cream}">आग्नेय</text>`,
          x: pick(W * 0.44, CX) + c, y: gy + c, layer: 5, scale: 0, shadow: 'cut-shadow-sm',
        });
        tl.fromTo(hot, { scale: [0, 1], rot: [-8, 0] }, { at: at('a1') + 1.5, dur: 0.45, ease: 'outBack' });
        tl.drive(hot, (l, g, s) => { s.scale = 1 + Math.sin(g * 3.4) * 0.03; }, { at: at('a1') + 2.0 });

        // "अग्नि का कोना" — the fire itself
        const fire = stage.add({
          id: 'ag-fire',
          svg: ink(`M 0 -46 Q 18 -16, 0 6 Q -18 -16, 0 -46 Z`, MB.ochre, { sw: 3.5 })
             + ink(`M 0 -30 Q 9 -11, 0 3 Q -9 -11, 0 -30 Z`, MB.red, { sw: 3 }),
          x: pick(W * 0.44, CX) + c, y: gy + c - c * 0.34, layer: 7, scale: 0, boil: false,
        });
        tl.fromTo(fire, { scale: [0, 1] }, { at: end('a1') - 0.75, dur: 0.35, ease: 'outBack' });
        Motion.flicker(tl, fire, { at: end('a1') - 0.4, amp: 0.15, speed: 10 });

        // line 2 names two texts — so two cards, one per name, in time with the words
        const srcs = ['मयमतम्', 'विश्वकर्मा प्रकाश'];
        srcs.forEach((name, i) => {
          const el = stage.add({
            id: `ag-src${i}`,
            svg: mbCard(pick(300, 380), pick(62, 74), MB.cream, { pattern: null, sw: 4.5, seed: 'src' + i })
               + text(name, { size: pick(30, 36), font: 'var(--font-deva)', fill: MB.ink }),
            x: pick(W * 0.8, CX + (i ? 1 : -1) * W * 0.22),
            y: pick(H * 0.3 + i * 0.13, H * 0.68), layer: 8, scale: 0, shadow: 'cut-shadow-sm',
          });
          tl.fromTo(el, { scale: [0, 1], rot: [(i ? 4 : -4), (i ? 1.5 : -1.5)] },
            { at: at('a2') + 0.15 + i * 0.75, dur: 0.4, ease: 'outBack' });
        });

        // and the kitchen they both point at
        const stove = stage.add({
          id: 'ag-chulha', svg: chulha(pick(250, 280), { withPot: true }),
          x: pick(W * 0.8, CX), y: pick(H * 0.66, H * 0.82), layer: 8, scale: 0, opacity: 0, shadow: 'cut-shadow',
        });
        tl.fromTo(stove, { scale: [0.4, 1], opacity: [0, 1] }, { at: end('a2') - 0.9, dur: 0.45, ease: 'outBack' });

        // line 3: the morning sun arrives from the south-east corner
        const dawn = stage.add({
          id: 'ag-sun', svg: sunFace(pick(52, 64)),
          x: pick(W * 0.16, CX + W * 0.33), y: pick(H * 0.62, H * 0.32), layer: 6, scale: 0, shadow: 'cut-shadow-sm',
        });
        tl.fromTo(dawn, { scale: [0, 1], x: [pick(W * 0.08, CX + W * 0.46), pick(W * 0.16, CX + W * 0.33)],
                          y: [pick(H * 0.72, H * 0.42), pick(H * 0.62, H * 0.32)] },
          { at: at('a3') + 0.5, dur: 0.9, ease: 'outCubic' });
        Motion.spin(tl, dawn, { rpm: 0.55, at: at('a3') + 1.2 });

        // rays sweeping toward the hot corner
        [0, 1, 2].forEach(i => {
          const ray = stage.add({
            id: `ag-ray${i}`,
            svg: `<path d="M 0 0 L ${pick(130, 160)} ${pick(58, 70)}" stroke="${MB.ochre}" stroke-width="7"
                    stroke-linecap="round" opacity="0.75"/>`,
            x: pick(W * 0.23, CX + W * 0.27), y: pick(H * 0.66, H * 0.36) + i * pick(20, 24),
            layer: 3, opacity: 0, boil: false,
          });
          tl.fromTo(ray, { opacity: [0, 0.8], scaleX: [0.2, 1] },
            { at: at('a3') + 0.9 + i * 0.13, dur: 0.45, ease: 'outQuart' });
        });
      },
    });
  },
};
