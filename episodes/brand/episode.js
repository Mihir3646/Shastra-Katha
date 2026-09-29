/**
 * Channel art. Not a video — three still frames rendered through the same
 * Madhubani system as the episodes, so the channel page and the videos are
 * visibly one thing.
 *
 *   npm run shot -- brand 0 --preset=logo
 *   npm run shot -- brand 0 --preset=banner
 */
import { MB, mbBorder, sunFace, mbVastuGrid, mbBand, mbDisc, fish, mbLotus, ink, chulha } from '../../engine/madhubani.js';
import { text } from '../../engine/kit.js';

export default {
  meta: { preset: 'logo', bg: MB.ground, leadIn: 0, tailOut: 0, boil: { enabled: false } },
  voice: { engine: 'parler' },
  captions: { enabled: false },
  script: [],
  build({ stage, preset }) {
    const W = stage.width, H = stage.height, CX = W / 2, CY = H / 2;
    const isLogo = Math.abs(W - H) < 2;
    const isBanner = W / H > 1.6;

    stage.scene({ name: 'brand', from: 0, to: 2, build() {
      if (isLogo) {
        // Avatar is shown as a CIRCLE and often at 32px. One bold motif only.
        stage.add({ id: 'sq', svg: `<rect width="${W}" height="${H}" fill="${MB.deepRed}"/>`,
          x: 0, y: 0, layer: 0, boil: false });
        stage.add({ id: 'ring2', svg: `<circle cx="${CX}" cy="${CY}" r="${W*0.43}" fill="${MB.ground}"
          stroke="${MB.ink}" stroke-width="10"/>`, x: 0, y: 0, layer: 1, boil: false });
        // LOGO_FACE: 'solemn' | 'none' | 'smile'
        stage.add({ id: 'sun', svg: sunFace(W * 0.235, { rays: 14, face: 'solemn' }), x: CX, y: CY, layer: 4 });
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
        }), x: sx * 0.5, y: CY - 90, layer: 2, rot: -4 });
        stage.add({ id: 'chulhaL', svg: chulha(140), x: sx * 0.5, y: CY + 190, layer: 2 });
        stage.add({ id: 'lotusR', svg: mbLotus(104), x: W - sx * 0.5, y: CY - 100, layer: 2 });
        stage.add({ id: 'fishR', svg: fish(140), x: W - sx * 0.5, y: CY + 110, layer: 2, rot: 6 });

        // inside the safe area
        stage.add({ id: 'sun', svg: sunFace(78, { rays: 14 }), x: sx + 150, y: sy + 169, layer: 6 });
        stage.add({ id: 'name', svg: text('शास्त्र कथा', { size: 112, font: 'var(--font-deva)', fill: MB.ink }),
          x: sx + 700, y: sy + 120, layer: 6 });
        stage.add({ id: 'band', svg: mbBand(600, { h: 22, fill: MB.ochre, pattern: 'chevron' }),
          x: sx + 700, y: sy + 196, layer: 5 });
        stage.add({ id: 'tag', svg: text('वास्तु · ज्योतिष · योग · परंपरा', { size: 42, font: 'var(--font-deva)', fill: MB.inkSoft }),
          x: sx + 700, y: sy + 252, layer: 6 });
        return;
      }

      // thumbnail template
      stage.add({ id: 'bg', svg: `<rect width="${W}" height="${H}" fill="${MB.ground}"/>`, x: 0, y: 0, layer: 0, boil: false });
      stage.add({ id: 'border', svg: mbBorder(W, H, { fill: MB.deepRed }), x: 0, y: 0, layer: 50, boil: false });
      stage.add({ id: 'grid', svg: mbVastuGrid(360, { labels: ['वायव्य','उत्तर','ईशान','पश्चिम','ब्रह्म','पूर्व','नैऋत्य','दक्षिण','आग्नेय'], highlight: 8 }),
        x: W * 0.28, y: CY, layer: 4, shadow: 'cut-shadow' });
      stage.add({ id: 'q', svg: text('रसोई\nकिस दिशा में?', { size: 86, font: 'var(--font-deva)', fill: MB.ink }),
        x: W * 0.68, y: CY - 40, layer: 6 });
      stage.add({ id: 'chulha', svg: chulha(150), x: W * 0.68, y: CY + 190, layer: 5, shadow: 'cut-shadow' });
    }});
  },
};
