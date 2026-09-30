import { Motion } from '../../../engine/stage.js';
import { MB, mbBorder, mbVastuGrid, mbBand, mbDisc, mbCard, ink, artwork } from '../../../engine/madhubani.js';
import { text } from '../../../engine/kit.js';
import { tearWipe } from '../../../engine/transitions.js';
import { addSubscribe } from '../../../engine/subscribe.js';

export default {
  id: 'vastupurush',
  title: 'वास्तुपुरुष',
  short: true,
  script: [
    { id: 'v1', text: 'पर यह नियम आया कहाँ से? इसके लिए उसी अध्याय में थोड़ा पीछे जाना होगा।', gap: 0.45 },
    { id: 'v2', text: 'दूसरे श्लोक में एक सुंदर कथा है।' },
    { id: 'v3', text: 'एक विशाल आकृति प्रकट हुई, जिसने आकाश और पृथ्वी दोनों को ढक लिया।' },
    { id: 'v4', text: 'देवताओं ने उसके अलग-अलग अंग थामे, और उसे भूमि पर स्थापित किया।', gap: 0.4 },
    { id: 'v5', text: 'फिर हर देवता वहीं विराजमान हो गया, जहाँ उसने थामा था।' },
    { id: 'v6', text: 'ग्रंथ उसे नाम देता है — वास्तुपुरुष।', gap: 0.5 },
    { id: 'v7', text: 'इसके बाद बयालीसवें श्लोक में पूरी व्यवस्था बनती है।' },
    { id: 'v8', text: 'भूमि को दस-दस रेखाओं से काटकर इक्यासी खानों में बाँटा जाता है।' },
    { id: 'v9', text: 'बत्तीस देवता बाहरी खानों में, तेरह भीतरी खानों में। और ठीक बीच में ब्रह्मा।', gap: 0.45 },
    { id: 'v10', text: 'यही वास्तु का असली ढाँचा है।' },
    { id: 'v11', text: 'घर की भूमि को एक शरीर की तरह देखा जाता है, जिसके हर हिस्से का अपना अधिपति है।' },
    { id: 'v12', text: 'रसोई, भंडार, पूजा का स्थान — ये सब इसी नक़्शे से तय होते हैं।' },
  ],
  build({ stage, tl, at, end, from, pick }) {
    const W = stage.width, H = stage.height, CX = W / 2;
    tearWipe(stage, { at: from - 0.5, color: '#DCC9A4', dir: 'up', seed: 'w-v', travel: 0.45 });

    stage.scene({
      name: 'vastupurush', from: from - 0.25, to: end('v12') + 0.4,
      build() {
        stage.add({ id: 'v-bg', svg: `<rect width="${W}" height="${H}" fill="#DCC9A4"/>`, x: 0, y: 0, layer: 0, boil: false });
        stage.add({ id: 'v-border', svg: mbBorder(W, H, { fill: MB.plum ?? MB.indigo, pattern: 'net' }), x: 0, y: 0, layer: 60, boil: false });
        tl.fromTo(stage.camera, { zoom: [1.0, 1.07], y: [0, 14] },
          { at: from, dur: (end('v12') + 0.4) - from, ease: 'inOutSine' });

        const gs = pick(Math.min(W * 0.32, 420), Math.min(W * 0.64, 620));
        const gy = pick(H * 0.48, H * 0.44);
        const gx = pick(W * 0.36, CX);

        // v1-v2 had an EMPTY frame. Open on the text itself so the viewer always
        // has something to look at.
        const verse = stage.add({
          id: 'v-verse',
          svg: mbCard(pick(400, 480), pick(230, 270), MB.cream, { sw: 5.5, seed: 'vv' })
             + text('श्लोक\n२', { size: pick(66, 78), font: 'var(--font-deva)', fill: MB.ink, lineHeight: 1.2 }),
          x: gx, y: gy, layer: 5, scale: 0, shadow: 'cut-shadow',
        });
        tl.fromTo(verse, { scale: [0.4, 1], opacity: [0, 1], rot: [-6, -2] }, { at: from, dur: 0.55, ease: 'outBack' });
        Motion.sway(tl, verse, { amp: 1.2, period: 5, at: from + 0.9 });
        tl.to(verse, { opacity: 0, scale: 0.8 }, { at: at('v3') - 0.15, dur: 0.35, ease: 'inCubic' });

        const katha = stage.add({
          id: 'v-katha',
          svg: mbCard(pick(440, 560), pick(90, 104), MB.ochre, { pattern: 'hline', sw: 4.5, seed: 'kt' })
             + text('एक कथा', { size: pick(38, 46), font: 'var(--font-deva)', fill: MB.ink }),
          x: pick(W * 0.75, CX), y: pick(H * 0.3, H * 0.72), layer: 8, scale: 0, shadow: 'cut-shadow-sm',
        });
        tl.fromTo(katha, { scale: [0.5, 1], opacity: [0, 1], rot: [4, 1.5] }, { at: at('v2') + 0.2, dur: 0.42, ease: 'outBack' });
        tl.to(katha, { opacity: 0 }, { at: at('v6') - 0.2, dur: 0.4 });

        // A commissioned illustration, not generated: it already carries the
        // 81 squares, the deity names, the directions and its own border, so it
        // stands alone rather than sitting on top of mbVastuGrid.
        const purush = stage.add({
          id: 'v-purush', svg: artwork('vastu-purusha.png', pick(gs * 1.72, gs * 1.30)),
          x: gx, y: gy, layer: 5, scale: 0, opacity: 0, shadow: 'cut-shadow',
        });
        tl.fromTo(purush, { scale: [1.35, 1], opacity: [0, 1] },
          { at: at('v3') + 0.2, dur: 0.9, ease: 'outCubic' });
        Motion.sway(tl, purush, { amp: 0.45, period: 7, at: at('v3') + 1.6 });
        // a slow push into the artwork while the story is told
        tl.to(purush, { scale: 1.1 }, { at: at('v5'), dur: 6, ease: 'inOutSine' });

        const name = stage.add({
          id: 'v-name',
          svg: mbCard(pick(440, 560), pick(96, 110), MB.deepRed, { pattern: 'hatch', sw: 5, seed: 'nm' })
             + text('वास्तुपुरुष', { size: pick(42, 52), font: 'var(--font-deva)', fill: MB.cream }),
          x: pick(W * 0.75, CX), y: pick(H * 0.3, H * 0.72), layer: 9, scale: 0, shadow: 'cut-shadow',
        });
        tl.fromTo(name, { scale: [0.5, 1], opacity: [0, 1], rot: [-4, -1.5] }, { at: at('v6') + 0.7, dur: 0.5, ease: 'outBack' });
        Motion.sway(tl, name, { amp: 0.9, period: 4.4, at: at('v6') + 1.3 });

        const count = stage.add({
          id: 'v-count',
          svg: mbCard(pick(220, 270), pick(110, 130), MB.ochre, { pattern: 'dots', sw: 5, seed: 'ct' })
             + text('८१', { size: pick(62, 76), font: 'var(--font-deva)', fill: MB.ink }),
          x: pick(W * 0.75, CX - W * 0.32), y: pick(H * 0.48, H * 0.14), layer: 9, scale: 0, shadow: 'cut-shadow',
        });
        tl.fromTo(count, { scale: [1.8, 1], opacity: [0, 1], rot: [-8, -2] }, { at: at('v8') + 1.6, dur: 0.5, ease: 'outBack' });

        const band = stage.add({
          id: 'v-band', svg: mbBand(pick(380, 500), { h: 18, fill: MB.ochre, pattern: 'chevron' }),
          x: gx, y: pick(H * 0.76, H * 0.86), layer: 8, scaleX: 0,
        });
        tl.fromTo(band, { scaleX: [0, 1] }, { at: at('v10'), dur: 0.5, ease: 'outQuart' });

        // mid-video subscribe beat, tucked into the pause after v9
        addSubscribe(stage, { at: at('v10') - 0.9, hold: 2.3 });
      },
    });
  },
};
