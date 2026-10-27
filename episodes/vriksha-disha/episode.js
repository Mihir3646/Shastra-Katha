/**
 * Episode 2 — पेड़ और जल
 *
 * Chosen on demand x sources: 178k median views against fifteen prescriptive
 * verses, where episode 1 rested on one. See research/REFERENCES.md and
 * episodes/vriksha-disha/SCRIPT.md.
 *
 * Every harm clause in 53.86, 53.77-78 and 53.119 is left unread. The text is
 * reported as advising against; the runtime goes to what to plant and where.
 *
 *   npm run build -- vriksha-disha
 */
import peepal from './chapters/01-peepal.js';
import chaar from './chapters/02-chaar-ped.js';
import mat from './chapters/03-kaatiye-mat.js';
import vidhi from './chapters/04-vidhi.js';
import lagayen from './chapters/05-kaun-lagayen.js';
import jal from './chapters/06-jal.js';

export default {
  meta: {
    preset: 'landscape',
    bg: '#EFE0C0',
    leadIn: 0.8,
    tailOut: 5.8,          // room for the disclaimer card
    // One global clock, no per-element jitter. See the note in engine/stage.js.
    boil: { enabled: false },
    step: 10,
  },

  voice: { engine: 'parler', parlerVoice: 'aman-deep', gap: 0.3 },
  captions: { enabled: true, style: 'outline', position: 0.87, size: 46, wrapAt: 40 },
  music: { file: 'assets/music/bed.mp3', gain: 0.13 },

  chapters: [peepal, chaar, mat, vidhi, lagayen, jal],
};
