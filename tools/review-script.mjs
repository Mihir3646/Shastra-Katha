#!/usr/bin/env node
/**
 * Run Jev over an episode's narration before you render it.
 *
 *   npm run review -- vastu-disha
 *   npm run review -- vastu-disha --gate      exit 1 if anything fails
 *
 * Three checks, because these are the three ways a spiritual-content channel
 * loses trust:
 *   sourced   a factual claim with no text named is the whole risk of the niche
 *   clarity   a line the audience has to re-read is a line they scroll past
 *   shot      which kit template fits — the first step toward drafting shots
 *
 * Every question goes in ONE request. Jev evaluates them in parallel and in
 * isolation, so 180 questions cost barely more latency than one, and far less
 * than 180 separate calls.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, readFileSync } from 'node:fs';
import { Jev, JevError, gate } from '../engine/jev.js';
import { collectScript } from '../engine/chapters.js';
import { claimQuestions, scriptQuestions, shotQuestions, verdictFor, SHOT_TEMPLATES } from '../engine/decisions.js';
import { heuristicVerdicts, heuristicClarity } from '../engine/heuristics.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Load .env.local without a dependency. Never commit this file.
for (const f of ['.env.local', '.env']) {
  const p = path.join(ROOT, f);
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const episodeName = process.argv[2];
const doGate = process.argv.includes('--gate');
if (!episodeName) {
  console.error('usage: npm run review -- <episode> [--gate]');
  process.exit(1);
}


const jev = new Jev();
const offline = process.argv.includes('--offline') || !jev.configured;

if (offline && !process.argv.includes('--offline')) {
  console.log(`[review] no API key — running the rule-based gate instead.
           It catches outcome promises and regulated advice, and warns about
           unsourced assertions. It cannot judge tone, nuance, or shot fit.
           Add AI_GATEWAY_API_KEY or TYPESAFE_API_KEY to .env.local for the full check.
`);
}

const mod = await import(path.join(ROOT, 'episodes', episodeName, 'episode.js'));
const ep = mod.default;
const lines = collectScript(ep);
if (!lines.length) { console.error(`[review] ${episodeName} has no narration lines`); process.exit(1); }

// State: the whole script, so every question sees the same context and can
// refer to a line by its id.
const state = {
  episode: episodeName,
  language: ep.voice?.voice?.startsWith('h') ? 'Hindi' : 'English',
  topic: 'Indian traditional knowledge (vastu / jyotish / yoga / ritual)',
  lines: Object.fromEntries(lines.map(l => [l.id, l.text])),
};

const lineIds = lines.map(l => l.id);
// One source of truth for every automated judgment — see engine/decisions.js.
const questions = {
  ...claimQuestions(lineIds),
  ...scriptQuestions(lineIds, { firstLineId: lineIds[0] }),
  ...shotQuestions(lineIds),
};

let answers = {}, usage = null, model = 'rules', hVerdicts = null;

if (offline) {
  hVerdicts = heuristicVerdicts(lines);
  console.log(`[review] ${episodeName}: ${lines.length} lines, rule-based gate\n`);
} else {
  console.log(`[review] ${episodeName}: ${lines.length} lines, ${Object.keys(questions).length} questions, 1 request`);
  const t0 = Date.now();
  try {
    ({ answers, usage, model } = await jev.ask(state, questions));
  } catch (e) {
    if (e instanceof JevError && e.body?.error?.type === 'customer_verification_required') {
      console.error(`
[review] Vercel AI Gateway will not serve requests until a card is on file.
         Your key is valid — this is a billing gate, not an auth failure.

         Add a card at vercel.com (it unlocks free credits), or run the
         zero-cost rule-based gate instead:

             npm run review -- ${episodeName} --offline
`);
      process.exit(2);
    }
    if (e instanceof JevError) {
      console.error(`[review] ${e.message}${e.status ? `  (HTTP ${e.status})` : ''}`);
      process.exit(2);
    }
    throw e;
  }
  console.log(`[review] ${model} answered in ${Date.now() - t0}ms  (${usage?.input_tokens ?? '?'} input tokens)\n`);
}

let blocking = 0, advisory = 0, unclear = 0;
const CLARITY_MIN = 2.0;

for (const l of lines) {
  const v = offline ? hVerdicts[l.id] : verdictFor(l.id, answers);
  const shot = answers[`${l.id}|shot`];
  const clarityVal = offline ? heuristicClarity(l.text) : answers[`${l.id}|clarity`]?.value;
  const g = shot ? gate(shot, { min: 0.6 }) : null;

  const flags = [...v.flags];
  if (clarityVal < CLARITY_MIN) { flags.push('UNCLEAR'); unclear++; }
  if (v.blocking) blocking++;
  else if (flags.length) advisory++;

  console.log(`${v.blocking ? 'X' : flags.length ? '!' : ' '} ${l.id.padEnd(5)} ${l.text.slice(0, 56)}`);
  const shotBit = g ? `   shot ${shot.value}${g.act ? '' : '  (low confidence — choose by hand)'}` : '';
  console.log(`       clarity ${clarityVal?.toFixed(2)}/3${shotBit}`);
  if (flags.length) {
    console.log(`       -> ${flags.join(', ')}${v.needsDisclaimer ? '   [needs disclaimer]' : ''}`);
    if (v.matched?.promises) console.log(`          matched: ${v.matched.promises.join(', ')}`);
    if (v.matched?.regulated) console.log(`          matched: ${v.matched.regulated.join(', ')}`);
  }
}

console.log(`\n[review] ${blocking} blocking, ${advisory} advisory, ${unclear} unclear`);
if (blocking) console.log('[review] blocking = outcome promise, regulated advice' + (offline ? '' : ', or unsourced claim'));
if (offline) console.log('[review] rule-based pass: treat a clean result as "nothing obvious", not "checked".');
if (doGate && blocking) {
  console.error('[review] gate FAILED — fix the blocking lines before rendering');
  process.exit(1);
}
