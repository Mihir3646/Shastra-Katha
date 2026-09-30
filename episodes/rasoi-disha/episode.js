/**
 * Episode 1 — रसोई किस दिशा में?
 *
 * Built on ONE verified citation: Brihat Samhita 53.118, in N. Chidambaram
 * Iyer's 1884 translation, which is free to read online so a viewer can check
 * it. See research/REFERENCES.md.
 *
 * Chapter 4 is the point of the channel. Every other vastu video states the
 * Agni-corner reasoning as scripture; 53.43 in this same translation does not
 * support it. The episode says so and says plainly that we do not know why.
 *
 *   npm run review -- rasoi-disha        gate it
 *   npm run build  -- rasoi-disha        voice + frames + mix
 *   npm run build  -- rasoi-disha --short=kaaran
 */
import sawaal from './chapters/01-sawaal.js';
import granth from './chapters/02-granth.js';
import vastupurush from './chapters/03-vastupurush.js';
import kaaran from './chapters/04-kaaran.js';
import niyam from './chapters/05-niyam.js';

export default {
  meta: {
    preset: 'landscape',
    bg: '#EFE0C0',
    leadIn: 0.8,
    tailOut: 5.8,        // room for the disclaimer card
    boil: { enabled: true, fps: 11, pos: 1.5, rot: 0.32 },
  },

  voice: {
    engine: 'parler',
    parlerVoice: 'aman-deep',
    gap: 0.36,
  },

  captions: { enabled: true, style: 'outline', position: 0.87, size: 46, wrapAt: 40 },

  music: { file: 'assets/music/bed.mp3', gain: 0.13 },

  chapters: [sawaal, granth, vastupurush, kaaran, niyam],
};
