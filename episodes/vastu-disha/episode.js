/**
 * Long-form episode assembled from chapters.
 *
 *   npm run build -- vastu-disha                    the full video
 *   npm run build -- vastu-disha --short=agneya     that chapter as a vertical Short
 *
 * Each chapter owns its own narration lines and shots, so it stands alone —
 * which is what makes it cuttable as a Short without looking like a fragment.
 */
import hook from './chapters/01-hook.js';
import agneya from './chapters/02-agneya.js';
import rule from './chapters/03-rule.js';

export default {
  meta: { preset: 'landscape', bg: '#E9E0CB', leadIn: 0.7, tailOut: 5.6,   // room for the disclaimer card
          boil: { enabled: true, fps: 11, pos: 1.5, rot: 0.32 } },
  voice: {
    engine: 'parler',            // AI4Bharat Indic Parler - free, local, Hindi-native
    parlerVoice: 'aman-deep',    // voice/parler.py --list-voices
    gap: 0.34,
  },
  captions: { enabled: true, style: 'outline', position: 0.87, size: 46, wrapAt: 40 },
  music: { file: 'assets/music/bed.mp3', gain: 0.18 },
  chapters: [hook, agneya, rule],
};
