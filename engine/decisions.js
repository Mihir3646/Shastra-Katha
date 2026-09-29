/**
 * Every automated judgment the pipeline makes, in one place.
 *
 * Keeping these together is deliberate: when a video goes out wrong, the cause
 * is almost always a decision rule, not the renderer. One file you can read in
 * five minutes beats questions scattered across eight scripts.
 *
 * Each export returns a question map for Jev.ask(). None of them generate
 * anything — Jev has no string output. Candidates come from an LLM; these
 * decide between them and gate what ships.
 */
import { bool, choice, score } from './jev.js';

/** The kit templates a narration beat can be illustrated with. Closed set. */
export const SHOT_TEMPLATES = {
  grid: 'a direction, room layout, or position within a house',
  wheel: 'a cycle, the zodiac, planets, or a repeating time structure',
  diya: 'fire, light, warmth, a lamp, or an act of ritual',
  lotus: 'water, purity, growth, or a flower motif',
  mandala: 'wholeness, concentric order, or a symbolic centre',
  figure: 'a person doing or experiencing something',
  label: 'a term being named or defined',
  hills: 'landscape, sky, outdoors, or the passage of time',
  text: 'a number, a rule, or a quotation meant to be read',
};

// Calibrated for a channel whose whole job is introducing specialist terms.
// Asking "would a newcomer understand this cold?" fails every line that names
// a shastra — which is every line worth keeping. The useful question is whether
// the SENTENCE is well built, granting that its terms get explained on screen.
const CLARITY = [
  'tangled — the viewer has to rewind',
  'follows only on second hearing',
  'clear on first hearing',
  'effortless, lands immediately',
];

// --- 1. Topic selection -----------------------------------------------------

/**
 * Given candidate topics and what you have already published, decide which to
 * make next. `state` should carry { candidates: {id: text}, published: [...] }.
 */
export function topicQuestions(candidateIds) {
  const q = {};
  for (const id of candidateIds) {
    q[`${id}|duplicate`] = bool({
      candidate_id: id,
      question: 'Does the candidate at `candidate_id` cover substantially the same ground as something already in `published`?',
    }, { true: 'a viewer would feel they had seen it', false: 'genuinely new ground' });

    q[`${id}|long_enough`] = score({
      candidate_id: id,
      question: 'How naturally does the candidate at `candidate_id` fill eight to ten minutes without padding?',
    }, ['one short idea', 'two or three beats', 'five or six clear beats', 'more than fits in one video']);

    q[`${id}|visual`] = score({
      candidate_id: id,
      question: 'How well does the candidate at `candidate_id` lend itself to being drawn as diagrams, directions, objects and scenes?',
    }, ['abstract, hard to draw', 'some visuals possible', 'clearly visual', 'visual throughout']);

    q[`${id}|practical`] = score({
      candidate_id: id,
      question: 'How much does the candidate at `candidate_id` give a viewer something they can act on today?',
    }, ['purely theoretical', 'background knowledge', 'useful', 'immediately actionable']);
  }
  return q;
}

// --- 2. Claims, sourcing, and safety ---------------------------------------

/**
 * The gate. An unsourced claim is the entire credibility risk of a traditional-
 * knowledge channel, and an outcome promise is its entire policy risk.
 *
 * `state` should carry { lines: {id: text}, topic, language }.
 */
export function claimQuestions(lineIds) {
  const q = {};
  for (const id of lineIds) {
    q[`${id}|claim`] = bool({
      line_id: id,
      question: 'Does the line at `line_id` in `lines` assert a factual or doctrinal claim — something a viewer could reasonably ask "says who?" about?',
    }, { true: 'asserts a checkable claim', false: 'framing, question, transition, or stated opinion' });

    q[`${id}|sourced`] = bool({
      line_id: id,
      question: 'Does the line at `line_id` in `lines` name the text, tradition, or authority its claim comes from?',
    }, { true: 'names a specific text, school, or authority', false: 'names no source' });

    q[`${id}|contested`] = bool({
      line_id: id,
      question: 'Do different traditions or schools disagree about what the line at `line_id` in `lines` asserts?',
    }, { true: 'traditions genuinely differ', false: 'broadly agreed within the tradition' });

    // Presenting traditional belief as established fact is the line that, once
    // crossed, turns cultural explanation into a claim about the world.
    q[`${id}|as_fact`] = bool({
      line_id: id,
      question: 'Is the line at `line_id` in `lines` phrased as established fact about the world, rather than as what a tradition holds?',
    }, { true: 'stated as plain fact', false: 'attributed to a tradition or belief' });

    q[`${id}|promises_outcome`] = bool({
      line_id: id,
      question: 'Does the line at `line_id` in `lines` promise a specific material result — wealth, health, marriage, career, or safety — from following the advice?',
    }, { true: 'promises a concrete outcome', false: 'describes practice without promising results' });

    q[`${id}|regulated_advice`] = bool({
      line_id: id,
      question: 'Does the line at `line_id` in `lines` offer medical, psychiatric, financial, or legal advice?',
    }, { true: 'gives advice in a regulated domain', false: 'does not' });
  }
  return q;
}

/**
 * Turn claim answers into an editorial verdict. Thresholds live here, in code,
 * where you can tune them — not inside a prompt.
 */
export function verdictFor(id, answers, opts = {}) {
  const { claimMin = 0.6, sourceMax = 0.5, flagMin = 0.6 } = opts;
  const get = k => answers[`${id}|${k}`]?.value ?? 0;
  const flags = [];

  if (get('claim') >= claimMin && get('sourced') < sourceMax) flags.push('UNSOURCED');
  if (get('as_fact') >= flagMin) flags.push('STATED_AS_FACT');
  if (get('promises_outcome') >= flagMin) flags.push('PROMISES_OUTCOME');
  if (get('regulated_advice') >= flagMin) flags.push('REGULATED_ADVICE');
  if (get('contested') >= flagMin) flags.push('CONTESTED');

  return {
    id,
    flags,
    // Blocking vs advisory: the first three are reasons not to publish as-is.
    blocking: flags.some(f => ['UNSOURCED', 'PROMISES_OUTCOME', 'REGULATED_ADVICE'].includes(f)),
    needsDisclaimer: flags.includes('STATED_AS_FACT') || flags.includes('CONTESTED'),
  };
}

// --- 3. Script quality ------------------------------------------------------

export function scriptQuestions(lineIds, { firstLineId } = {}) {
  const q = {};
  for (const id of lineIds) {
    q[`${id}|clarity`] = score({
      line_id: id,
      question: 'Judging sentence construction only — length, word order, how many ideas it carries — '
        + 'how easily does a listener follow the line at `line_id` in `lines` on first hearing? '
        + 'Assume any specialist term it names is explained on screen; do not penalise the line for using one.',
    }, CLARITY);
  }
  if (firstLineId) {
    q[`${firstLineId}|hook`] = score({
      line_id: firstLineId,
      question: 'How strongly would the line at `line_id` in `lines` stop someone from scrolling past in the first three seconds?',
    }, ['generic opening', 'mildly interesting', 'creates a real question', 'impossible to scroll past']);
  }
  return q;
}

// --- 4. Shot routing --------------------------------------------------------

export function shotQuestions(lineIds) {
  const q = {};
  for (const id of lineIds) {
    q[`${id}|shot`] = choice({
      line_id: id,
      question: 'Which visual template best illustrates the line at `line_id` in `lines`?',
    }, SHOT_TEMPLATES);
  }
  return q;
}

// --- 5. Which chapters become Shorts ---------------------------------------

/** `state` should carry { chapters: {id: {title, lines:[...]}} }. */
export function shortQuestions(chapterIds) {
  const q = {};
  for (const id of chapterIds) {
    q[`${id}|standalone`] = score({
      chapter_id: id,
      question: 'How well does the chapter at `chapter_id` in `chapters` work on its own, for a viewer who has not seen the rest of the video?',
    }, ['meaningless without context', 'needs a little setup', 'works alone', 'complete in itself']);

    q[`${id}|hook`] = score({
      chapter_id: id,
      question: 'How strongly does the chapter at `chapter_id` in `chapters` open — would it stop a scroll?',
    }, ['slow open', 'mild', 'strong', 'impossible to scroll past']);
  }
  return q;
}

// --- 6. Titles and channel names -------------------------------------------

/** `state` should carry { candidates: {id: text}, topic, audience }. */
export function titleQuestions(candidateIds) {
  const q = {};
  for (const id of candidateIds) {
    q[`${id}|curiosity`] = score({
      candidate_id: id,
      question: 'How strongly does the title at `candidate_id` in `candidates` create a question the viewer wants answered?',
    }, ['states the topic flatly', 'mild interest', 'real curiosity', 'must click']);

    q[`${id}|honest`] = bool({
      candidate_id: id,
      question: 'Does the title at `candidate_id` in `candidates` promise more than a video on this topic could honestly deliver?',
    }, { true: 'overpromises or baits', false: 'accurate to the content' });

    q[`${id}|searchable`] = score({
      candidate_id: id,
      question: 'How closely does the title at `candidate_id` in `candidates` match words someone would actually type to find this?',
    }, ['no search overlap', 'some overlap', 'good overlap', 'exactly the search phrase']);
  }
  return q;
}

/** `state` should carry { candidates: {id: name}, scope, language }. */
export function channelNameQuestions(candidateIds) {
  const q = {};
  for (const id of candidateIds) {
    q[`${id}|memorable`] = score({
      candidate_id: id,
      question: 'How easily would someone remember the name at `candidate_id` in `candidates` after hearing it once?',
    }, ['forgettable', 'takes repetition', 'sticks', 'unforgettable']);

    q[`${id}|spellable`] = score({
      candidate_id: id,
      question: 'How reliably could someone type the name at `candidate_id` in `candidates` correctly after only hearing it spoken?',
    }, ['would be misspelled', 'often misspelled', 'usually correct', 'unambiguous']);

    q[`${id}|scope_fit`] = score({
      candidate_id: id,
      question: 'How well does the name at `candidate_id` in `candidates` cover everything in `scope` without being so broad it says nothing?',
    }, ['too narrow or too broad', 'partly fits', 'good fit', 'exactly the right width']);

    q[`${id}|too_narrow`] = bool({
      candidate_id: id,
      question: 'Would the name at `candidate_id` in `candidates` feel wrong once the channel covers every topic in `scope`?',
    }, { true: 'locks the channel into one topic', false: 'travels across all of them' });
  }
  return q;
}

/**
 * Composite scoring: combine atomic scores with weights YOU control. When
 * priorities shift you change a coefficient here, not a prompt.
 */
export function weighted(answers, id, weights) {
  let total = 0, sum = 0;
  for (const [key, w] of Object.entries(weights)) {
    const a = answers[`${id}|${key}`];
    if (!a) continue;
    const v = a.type === 'bool' ? (a.value ?? 0) : (a.value ?? 0);
    total += v * w;
    sum += Math.abs(w);
  }
  return sum ? total / sum : 0;
}
