import { MB, mbBorder, mbVastuGrid, mbFigure, mbLotus, sunFace, fish, kalash, peacock, mbBand, mbCard, mbDisc, ink } from '../../engine/madhubani.js';
import { text } from '../../engine/kit.js';

export default {
  meta: { preset: 'shorts', bg: MB.ground, leadIn: 0.2, tailOut: 0.2, boil: { enabled: false } },
  voice: { engine: 'kokoro', voice: 'hm_omega' },
  captions: { enabled: false },
  script: [{ id: 'l1', text: 'परीक्षण' }],
  build({ stage }) {
    const W = stage.width, H = stage.height, CX = W / 2;
    stage.scene({ name: 'test', from: 0, to: 3, build() {
      stage.add({ id: 'border', svg: mbBorder(W, H), x: 0, y: 0, layer: 60, boil: false });

      stage.add({ id: 'sun', svg: sunFace(88), x: CX, y: 300, layer: 5, shadow: 'cut-shadow' });

      stage.add({ id: 'title',
        svg: text('वास्तु शास्त्र', { size: 76, font: 'var(--font-deva)', fill: MB.ink }),
        x: CX, y: 490, layer: 6 });
      stage.add({ id: 'band', svg: mbBand(560, { h: 34, fill: MB.ochre, pattern: 'chevron' }), x: CX, y: 556, layer: 5 });

      stage.add({ id: 'grid',
        svg: mbVastuGrid(620, {
          labels: ['वायव्य','उत्तर','ईशान','पश्चिम','ब्रह्म','पूर्व','नैऋत्य','दक्षिण','आग्नेय'],
          highlight: 8,
        }),
        x: CX, y: 1060, layer: 4, shadow: 'cut-shadow' });

      stage.add({ id: 'fig', svg: mbFigure(1.0), x: 260, y: 1480, layer: 5, shadow: 'cut-shadow' });
      stage.add({ id: 'lotus', svg: mbLotus(92), x: CX, y: 1430, layer: 5, shadow: 'cut-shadow' });
      stage.add({ id: 'kalash', svg: kalash(120), x: 830, y: 1520, layer: 5, shadow: 'cut-shadow' });

      stage.add({ id: 'fish1', svg: fish(180), x: 250, y: 1720, layer: 5, shadow: 'cut-shadow-sm' });
      stage.add({ id: 'peacock', svg: peacock(190), x: 700, y: 1700, layer: 5, shadow: 'cut-shadow-sm' });

      // pattern swatches
      ['hatch','cross','dots','wave','scale','net'].forEach((p,i)=>{
        stage.add({ id:'sw'+i, svg: mbCard(120, 70, [MB.red,MB.ochre,MB.indigo,MB.green,MB.pink,MB.blue][i], { pattern:p, sw:4 }),
          x: 208 + i*134, y: 660, layer: 5 });
      });
    }});
  },
};
