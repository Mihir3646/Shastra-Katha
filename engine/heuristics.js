/**
 * Zero-cost fallback for the editorial gate.
 *
 * This is deliberately cruder than Jev. It cannot judge whether a claim is
 * genuinely contested, or whether a line reads as fact versus tradition — those
 * need a model. What it CAN do is catch the three failures that actually get a
 * channel in trouble, using rules that cost nothing and run offline:
 *
 *   an outcome promised as a result of following advice
 *   advice in a regulated domain (medical / financial / legal)
 *   an assertion with no source text named anywhere in the episode
 *
 * Output matches verdictFor() in decisions.js exactly, so the review tool reads
 * either source identically and upgrades the day an API key appears.
 *
 * Treat a clean result as "nothing obvious", never as "checked".
 */

/** Source texts the channel cites. Extend as you widen the subject matter. */
export const SOURCE_TEXTS = [
  // vastu
  'मयमतम', 'मयमतम्', 'विश्वकर्मा', 'समरांगण', 'मानसार', 'वास्तु शास्त्र', 'वास्तुशास्त्र',
  'mayamatam', 'mayamata', 'vishvakarma', 'vishwakarma', 'samarangana', 'manasara', 'vastu shastra',
  // jyotish
  'बृहत् संहिता', 'बृहत संहिता', 'पराशर', 'होरा शास्त्र', 'जातक',
  'brihat samhita', 'parashara', 'parasara', 'hora shastra', 'jataka',
  // yoga / darshana
  'पतंजलि', 'योग सूत्र', 'योगसूत्र', 'हठ योग', 'उपनिषद', 'गीता', 'वेद', 'पुराण',
  'patanjali', 'yoga sutra', 'yogasutra', 'hatha yoga', 'upanishad', 'gita', 'veda', 'purana',
];

const OUTCOME_PROMISE = [
  'धन', 'समृद्धि', 'दौलत', 'बरकत', 'सफलता मिलेगी', 'लाभ होगा', 'नौकरी मिल', 'विवाह हो',
  'संतान', 'भाग्य खुल', 'दूर हो जाएग', 'ठीक हो जाएग', 'अवश्य मिल',
  'will bring', 'guarantee', 'guaranteed', 'ensures', 'you will get', 'brings wealth',
  'brings prosperity', 'removes all', 'cures', 'will cure', 'fixes your',
];

const REGULATED = [
  'दवा', 'दवाई', 'इलाज', 'उपचार', 'बीमारी', 'रोग ठीक', 'निवेश', 'शेयर बाज़ार', 'कानूनी',
  'medicine', 'medication', 'treatment', 'diagnose', 'diagnosis', 'cure disease',
  'invest', 'investment', 'stocks', 'shares', 'legal advice', 'lawsuit',
];

// Assertive sentence markers — a rough proxy for "this states something".
const ASSERTION = [
  'है', 'हैं', 'होता है', 'होती है', 'माना जाता है', 'कहते हैं', 'चाहिए', 'नहीं',
  ' is ', ' are ', ' must ', ' should ', ' always ', ' never ', ' causes ', ' means ',
];

const hit = (text, list) => list.filter(k => text.toLowerCase().includes(k.toLowerCase()));

/**
 * @param {Array<{id,text}>} lines  the whole script — sourcing is judged across
 *   the episode, since a citation one line earlier still covers the claim.
 * @returns {Record<string, {id, flags, blocking, needsDisclaimer, matched}>}
 */
export function heuristicVerdicts(lines, opts = {}) {
  const { sourceTexts = SOURCE_TEXTS, sourceWindow = 2 } = opts;
  const cited = lines.map(l => hit(l.text, sourceTexts).length > 0);

  const out = {};
  lines.forEach((l, i) => {
    const flags = [];
    const matched = {};

    const promises = hit(l.text, OUTCOME_PROMISE);
    if (promises.length) { flags.push('PROMISES_OUTCOME'); matched.promises = promises; }

    const regulated = hit(l.text, REGULATED);
    if (regulated.length) { flags.push('REGULATED_ADVICE'); matched.regulated = regulated; }

    const asserts = hit(l.text, ASSERTION).length > 0;
    // A citation within `sourceWindow` lines still covers this claim.
    const coveredBy = cited.slice(Math.max(0, i - sourceWindow), i + sourceWindow + 1);
    if (asserts && !coveredBy.some(Boolean)) {
      flags.push('UNSOURCED?');
      matched.note = 'asserts something; no source text named nearby';
    }

    out[l.id] = {
      id: l.id,
      flags,
      matched,
      // UNSOURCED? is advisory here — the rule cannot tell a claim from framing.
      blocking: flags.includes('PROMISES_OUTCOME') || flags.includes('REGULATED_ADVICE'),
      needsDisclaimer: false,
      heuristic: true,
    };
  });
  return out;
}

/** Rough clarity proxy: long sentences and rare words cost comprehension. */
export function heuristicClarity(text) {
  const words = text.trim().split(/\s+/).length;
  const clauses = text.split(/[,;:—]/).length;
  if (words > 28 || clauses > 4) return 1.0;
  if (words > 20 || clauses > 3) return 1.8;
  if (words > 12) return 2.5;
  return 3.0;
}
