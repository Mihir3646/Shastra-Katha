/**
 * Jev client — TypeSafe's System One model, the decision layer for the pipeline.
 *
 * Jev does not generate text. You hand it a `state` and a map of typed
 * questions; it answers all of them in parallel with calibrated probabilities.
 * That makes it the right tool for the hundreds of small judgements an episode
 * needs (is this claim sourced? which shot fits this line?) and the wrong tool
 * for anything you'd ask an LLM to write.
 *
 * Two backends, same interface:
 *   gateway  Vercel AI Gateway   AI_GATEWAY_API_KEY   (one key across providers)
 *   direct   api.typesafe.ai     TYPESAFE_API_KEY
 *
 * They are NOT the same wire format. The gateway renames noul -> boolean and
 * takes score levels as an array; the native API uses noul and an object. This
 * client speaks one vocabulary and translates per backend.
 */

const GATEWAY_URL = 'https://ai-gateway.vercel.sh/v1/evaluate';
const DIRECT_URL = 'https://api.typesafe.ai/v1/systemone';

export class JevError extends Error {
  constructor(message, { status, body } = {}) {
    super(message);
    this.name = 'JevError';
    this.status = status;
    this.body = body;
  }
}

/** A yes/no question. Returns a probability in [0,1]. */
export const bool = (instructions, criteria) => ({ kind: 'bool', instructions, criteria });

/** Pick one option. `options` is {name: description|null} or an array of names. */
export const choice = (instructions, options) => ({ kind: 'choice', instructions, options });

/** Rate against ordered levels, worst first. `levels` is an array of descriptions. */
export const score = (instructions, levels) => ({ kind: 'score', instructions, levels });

function toGatewayQuestion(q) {
  if (q.kind === 'bool') {
    return { type: 'boolean', instructions: q.instructions, ...(q.criteria ? { criteria: q.criteria } : {}) };
  }
  if (q.kind === 'choice') {
    const criteria = Array.isArray(q.options)
      ? Object.fromEntries(q.options.map(o => [o, null]))
      : q.options;
    return { type: 'choice', instructions: q.instructions, criteria };
  }
  if (q.kind === 'score') {
    // Gateway wants an ARRAY of level descriptions, lowest first.
    return { type: 'score', instructions: q.instructions, criteria: q.levels };
  }
  throw new JevError(`unknown question kind: ${q.kind}`);
}

function toDirectQuestion(q) {
  if (q.kind === 'bool') {
    return { type: 'noul', instructions: q.instructions, ...(q.criteria ? { criteria: q.criteria } : {}) };
  }
  if (q.kind === 'choice') {
    const criteria = Array.isArray(q.options)
      ? Object.fromEntries(q.options.map(o => [o, null]))
      : q.options;
    return { type: 'choice', instructions: q.instructions, criteria };
  }
  if (q.kind === 'score') {
    return { type: 'score', instructions: q.instructions, criteria: q.levels };
  }
  throw new JevError(`unknown question kind: ${q.kind}`);
}

/** Normalise both backends' answers into one shape. */
function normaliseAnswer(a) {
  if (!a || typeof a !== 'object') return a;
  if (a.type === 'noul' || a.type === 'boolean') {
    const v = a.noul ?? a.boolean ?? a.value;
    return { type: 'bool', value: v, yes: v >= 0.5 };
  }
  if (a.type === 'choice') {
    return { type: 'choice', value: a.choice, probabilities: a.probabilities, confidence: a.confidence };
  }
  if (a.type === 'score') {
    return { type: 'score', value: a.score, legend: a.legend, probabilities: a.probabilities, confidence: a.confidence };
  }
  return a;
}

export class Jev {
  /**
   * @param {object} opts
   *   backend  'gateway' | 'direct'   (default: gateway if AI_GATEWAY_API_KEY is set)
   *   apiKey   read from env if omitted — never hard-code it
   */
  constructor(opts = {}) {
    const env = (typeof process !== 'undefined' && process.env) || {};
    this.backend = opts.backend ?? (env.AI_GATEWAY_API_KEY ? 'gateway' : 'direct');
    this.apiKey = opts.apiKey
      ?? (this.backend === 'gateway' ? env.AI_GATEWAY_API_KEY : env.TYPESAFE_API_KEY);
    this.model = opts.model ?? (this.backend === 'gateway' ? 'typesafe-ai/jev' : 'jev-latest');
    this.url = opts.url ?? (this.backend === 'gateway' ? GATEWAY_URL : DIRECT_URL);
    this.timeout = opts.timeout ?? 30000;
    this.retries = opts.retries ?? 2;
  }

  get configured() { return Boolean(this.apiKey); }

  /**
   * Ask every question at once. Batching is the point: questions are evaluated
   * in parallel and in isolation, so twenty questions cost barely more latency
   * than one — and one call is far cheaper than twenty.
   *
   * @param {string|object|Array} state  what the questions are about
   * @param {Record<string, object>} questions  built with bool()/choice()/score()
   * @returns {Promise<{answers: Record<string, object>, usage: object, model: string}>}
   */
  async ask(state, questions) {
    if (!this.configured) {
      throw new JevError(
        this.backend === 'gateway'
          ? 'AI_GATEWAY_API_KEY is not set. Put it in .env.local (never commit it).'
          : 'TYPESAFE_API_KEY is not set. Put it in .env.local (never commit it).'
      );
    }
    const encode = this.backend === 'gateway' ? toGatewayQuestion : toDirectQuestion;
    const body = {
      model: this.model,
      state,
      questions: Object.fromEntries(Object.entries(questions).map(([k, q]) => [k, encode(q)])),
    };

    let lastErr;
    for (let attempt = 0; attempt <= this.retries; attempt++) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), this.timeout);
      try {
        const res = await fetch(this.url, {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${this.apiKey}` },
          body: JSON.stringify(body),
          signal: ctrl.signal,
        });
        const text = await res.text();
        let json;
        try { json = JSON.parse(text); } catch { json = { raw: text }; }

        if (!res.ok) {
          // 4xx other than 429 are our fault — retrying will not help.
          if (res.status !== 429 && res.status < 500) {
            throw new JevError(json?.error?.message ?? json?.detail?.message ?? `HTTP ${res.status}`,
              { status: res.status, body: json });
          }
          lastErr = new JevError(`HTTP ${res.status}`, { status: res.status, body: json });
        } else {
          return {
            model: json.model,
            usage: json.usage,
            answers: Object.fromEntries(
              Object.entries(json.answers ?? {}).map(([k, a]) => [k, normaliseAnswer(a)])
            ),
          };
        }
      } catch (e) {
        if (e instanceof JevError && e.status && e.status < 500 && e.status !== 429) throw e;
        lastErr = e;
      } finally {
        clearTimeout(timer);
      }
      if (attempt < this.retries) await new Promise(r => setTimeout(r, 400 * (attempt + 1)));
    }
    throw lastErr ?? new JevError('request failed');
  }
}

/**
 * Confidence-gated routing: act automatically only when the model is sure.
 * Everything else lands in a review queue rather than silently shipping.
 */
export function gate(answer, { min = 0.75 } = {}) {
  if (!answer) return { act: false, reason: 'no answer' };
  if (answer.type === 'bool') {
    const margin = Math.abs(answer.value - 0.5) * 2;
    return { act: margin >= min, value: answer.yes, certainty: margin };
  }
  const c = answer.confidence ?? 0;
  return { act: c >= min, value: answer.value, certainty: c };
}
