/**
 * Channel art. Not a video — three still frames rendered through the same
 * Madhubani system as the episodes, so the channel page and the videos are
 * visibly one thing.
 *
 *   npm run shot -- brand 0 --preset=logo
 *   npm run shot -- brand 0 --preset=banner
 */
import { MB, mbBorder, sunFace, mbVastuGrid, mbBand, mbCard, mbDisc, mbFigure, mbTree, fish, mbLotus, ink, chulha } from '../../engine/madhubani.js';
import { text } from '../../engine/kit.js';

export default {
  meta: { preset: 'logo', bg: MB.ground, leadIn: 0, tailOut: 0, boil: { enabled: false } },
  voice: { engine: 'parler' },
  captions: { enabled: false },
  script: [],
  build({ stage, presetName }) {
    const W = stage.width, H = stage.height, CX = W / 2, CY = H / 2;
    // Banner and thumbnail are both 16:9, so aspect ratio cannot tell them
    // apart — it made the thumbnail branch unreachable. Go by preset name,
    // falling back to size (banner 2048 wide, thumbnail 1280).
    const kind = presetName ?? (Math.abs(W - H) < 2 ? 'logo' : W >= 2000 ? 'banner' : 'thumb');
    const isLogo = kind === 'logo';
    const isBanner = kind === 'banner';

    stage.scene({ name: 'brand', from: 0, to: 2, build() {
      if (isLogo) {
        // Avatar is shown as a CIRCLE and often at 32px. One bold motif only.
        stage.add({ id: 'sq', svg: `<rect width="${W}" height="${H}" fill="${MB.deepRed}"/>`,
          x: 0, y: 0, layer: 0, boil: false });
        stage.add({ id: 'ring2', svg: `<circle cx="${CX}" cy="${CY}" r="${W*0.43}" fill="${MB.ground}"
          stroke="${MB.ink}" stroke-width="10"/>`, x: 0, y: 0, layer: 1, boil: false });
        // LOGO_FACE: 'solemn' | 'none' | 'smile'
        stage.add({ id: 'sun', svg: sunFace(W * 0.235, { rays: 14, face: 'none' }), x: CX, y: CY, layer: 4 });
        return;
      }

      if (isBanner) {
        // YouTube crops hard on phones: everything legible must sit inside the
        // centred 1235x338 safe area. Decoration lives outside it.
        const sx = (W - 1235) / 2, sy = (H - 338) / 2;
        stage.add({ id: 'bg', svg: `<rect width="${W}" height="${H}" fill="${MB.groundAlt}"/>`, x: 0, y: 0, layer: 0, boil: false });
        stage.add({ id: 'border', svg: mbBorder(W, H, { fill: MB.deepRed, inset: 26, band: 46 }), x: 0, y: 0, layer: 50, boil: false });

        // decoration, safely outside the mobile crop
        stage.add({ id: 'gridL', svg: mbVastuGrid(250, {
          labels: ['','','ईशान','','ब्रह्म','','','','आग्नेय'], highlight: 8, labelSize: 30,
        }), x: sx * 0.62, y: CY - 90, layer: 2, rot: -4 });
        stage.add({ id: 'chulhaL', svg: chulha(140), x: sx * 0.62, y: CY + 190, layer: 2 });
        stage.add({ id: 'lotusR', svg: mbLotus(104), x: W - sx * 0.5, y: CY - 100, layer: 2 });
        stage.add({ id: 'fishR', svg: fish(140), x: W - sx * 0.5, y: CY + 110, layer: 2, rot: 6 });

        // inside the safe area
        stage.add({ id: 'sun', svg: sunFace(78, { rays: 14, face: 'none' }), x: sx + 150, y: sy + 169, layer: 6 });
        stage.add({ id: 'name', svg: text('शास्त्र कथा', { size: 112, font: 'var(--font-deva)', fill: MB.ink }),
          x: sx + 700, y: sy + 120, layer: 6 });
        stage.add({ id: 'band', svg: mbBand(600, { h: 22, fill: MB.ochre, pattern: 'chevron' }),
          x: sx + 700, y: sy + 196, layer: 5 });
        stage.add({ id: 'tag', svg: text('वास्तु · ज्योतिष · योग · परंपरा', { size: 42, font: 'var(--font-deva)', fill: MB.inkSoft }),
          x: sx + 700, y: sy + 252, layer: 6 });
        return;
      }

      if (kind.startsWith('vthumb')) {
        // Shorts thumbnails are only seen on the channel's Shorts tab and in
        // search — never in the feed, where the video just plays. So: one
        // short line, very large, and the figure, which is what reads at
        // grid size. The preset name carries which of the three — the scene
        // runs in the browser, so there is no process.env to read here.
        const n = Number(kind.slice(6)) || 1;
        const lines = {
          1: ['रसोई', 'किस दिशा में?'],
          2: ['सिर्फ़ रसोई', 'नहीं — 4 कमरे'],
          3: ['रसोई वहाँ', 'नहीं है तो?'],
        }[n] ?? ['रसोई', 'किस दिशा में?'];

        stage.add({ id: 'bg', svg: `<rect width="${W}" height="${H}" fill="${MB.deepRed}"/>`, x: 0, y: 0, layer: 0, boil: false });
        stage.add({ id: 'border', svg: mbBorder(W, H, { fill: MB.ochre, inset: 16, band: 30 }), x: 0, y: 0, layer: 50, boil: false });
        stage.add({
          id: 'panel', svg: mbCard(W * 0.82, H * 0.30, MB.cream, { sw: 8, seed: 'vt' }),
          x: CX, y: H * 0.26, layer: 3, shadow: 'cut-shadow',
        });
        stage.add({ id: 'q', svg: text(lines.join('\n'), { size: 112, font: 'var(--font-deva)', fill: MB.ink, lineHeight: 1.12, weight: 700 }),
          x: CX, y: H * 0.26, layer: 8 });
        // The stove is the subject of the episode and reads better at grid
        // size than a figure does. The packaging data wants a face OR high
        // contrast; the saturated ground supplies the contrast.
        stage.add({ id: 'chulha', svg: chulha(430), x: CX, y: H * 0.585, layer: 6, shadow: 'cut-shadow' });
        stage.add({ id: 'grid', svg: mbVastuGrid(430, { labels: ['','','','','','','','','आग्नेय'], highlight: 8, labelSize: 40 }),
          x: CX, y: H * 0.82, layer: 7, rot: -3, shadow: 'cut-shadow' });
        return;
      }

      if (kind === 'thumb2') {
        // Episode 2 — the peepal and its direction. Same grammar as episode 1:
        // saturated ground, a cream panel, the subject at large size.
        // indigo, not green: a green tree on a green ground disappears, and it
        // also keeps this distinct from episode 1's red at thumbnail size
        stage.add({ id: 'bg', svg: `<rect width="${W}" height="${H}" fill="${MB.indigo}"/>`, x: 0, y: 0, layer: 0, boil: false });
        stage.add({ id: 'border', svg: mbBorder(W, H, { fill: MB.ochre, inset: 14, band: 26 }), x: 0, y: 0, layer: 50, boil: false });
        stage.add({
          id: 'panel', svg: mbCard(W * 0.58, H * 0.50, MB.cream, { sw: 7, seed: 't2' }),
          x: W * 0.665, y: H * 0.40, layer: 3, shadow: 'cut-shadow',
        });
        stage.add({ id: 'tree', svg: mbTree(400, { kind: 'peepal' }), x: W * 0.20, y: H * 0.46, layer: 6, shadow: 'cut-shadow' });
        stage.add({ id: 'q', svg: text('पीपल\nकिस दिशा में?', { size: 118, font: 'var(--font-deva)', fill: MB.ink, lineHeight: 1.08, weight: 700 }),
          x: W * 0.665, y: H * 0.33, layer: 8 });
        stage.add({ id: 'sub', svg: mbBand(W * 0.44, { h: 56, fill: MB.ochre, pattern: 'chevron' }),
          x: W * 0.665, y: H * 0.565, layer: 8 });
        stage.add({ id: 'subt', svg: text('ग्रंथ 4 पेड़ गिनाता है', { size: 44, font: 'var(--font-deva)', fill: MB.ink, weight: 700 }),
          x: W * 0.665, y: H * 0.565, layer: 9 });
        return;
      }

      // thumbnail template
      //
      // Rebuilt against the packaging data: 89% of breakout thumbnails carry a
      // face or high contrast, and the v1 cream-on-cream had neither — on a
      // phone tile it read as a blank beige rectangle. So: saturated ground,
      // a drawn Madhubani face, a prohibition mark, and text at ~3x the old
      // size. Five words, which is the breakout median.
      stage.add({ id: 'bg', svg: `<rect width="${W}" height="${H}" fill="${MB.deepRed}"/>`, x: 0, y: 0, layer: 0, boil: false });
      stage.add({
        id: 'bgpat',
        svg: `<rect width="${W}" height="${H}" fill="${MB.red}" opacity="0.5"/>`,
        x: 0, y: 0, layer: 1, boil: false,
      });
      // a cream panel so the type has something to sit on at phone size
      stage.add({
        id: 'panel', svg: mbCard(W * 0.58, H * 0.50, MB.cream, { sw: 7, seed: 'tp' }),
        x: W * 0.665, y: H * 0.40, layer: 3, shadow: 'cut-shadow',
      });
      stage.add({ id: 'border', svg: mbBorder(W, H, { fill: MB.ochre, inset: 14, band: 26 }), x: 0, y: 0, layer: 50, boil: false });

      // the cook at her stove — the face is the single biggest packaging gap
      // we had, and pairing her with the chulha makes it one picture instead
      // of two props sharing a frame
      stage.add({ id: 'chulha', svg: chulha(280), x: W * 0.20, y: H * 0.42, layer: 6, shadow: 'cut-shadow' });
      stage.add({ id: 'grid', svg: mbVastuGrid(190, { labels: ['','','','','','','','','आग्नेय'], highlight: 8, labelSize: 22 }),
        x: W * 0.20, y: H * 0.78, layer: 7, rot: -4, shadow: 'cut-shadow' });

      stage.add({ id: 'q', svg: text('रसोई\nकिस दिशा में?', { size: 124, font: 'var(--font-deva)', fill: MB.ink, lineHeight: 1.08, weight: 700 }),
        x: W * 0.665, y: H * 0.33, layer: 8 });
      stage.add({ id: 'sub', svg: mbBand(W * 0.44, { h: 56, fill: MB.ochre, pattern: 'chevron' }),
        x: W * 0.665, y: H * 0.565, layer: 8 });
      stage.add({ id: 'subt', svg: text('ग्रंथ में क्या लिखा है', { size: 44, font: 'var(--font-deva)', fill: MB.ink, weight: 700 }),
        x: W * 0.665, y: H * 0.565, layer: 9 });
    }});
  },
};
