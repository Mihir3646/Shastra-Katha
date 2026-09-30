/**
 * Caption fit guard.
 *
 * A caption that wraps to three lines is both harder to read and tall enough
 * to reach up into the artwork — which is how the closing callout in chapter 5
 * ended up with narration printed across it. Uses the renderer's own wrap(),
 * so the limit here can never drift from what actually gets drawn.
 *
 *   node tools/check-captions.mjs <episode> [maxRows]
 */
import { readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { wrap } from '../engine/captions.js';

const ep = process.argv[2];
const maxRows = Number(process.argv[3] ?? 2);
if (!ep) { console.error('usage: check-captions.mjs <episode> [maxRows]'); process.exit(2); }

const dir = resolve('episodes', ep, 'chapters');
const files = readdirSync(dir).filter(f => f.endsWith('.js')).sort();

// 40 cols is the landscape wrap; vertical re-wraps at 22 but at a larger size,
// so landscape is the binding constraint for the shared script.
const COLS = 40;
let bad = 0, total = 0;

for (const f of files) {
  const mod = (await import(join(dir, f))).default;
  for (const l of mod.script ?? []) {
    total++;
    const rows = wrap(l.caption ?? l.text, COLS);
    if (rows.length > maxRows) {
      bad++;
      console.log(`  ${l.id.padEnd(4)} ${rows.length} lines  ${(l.caption ?? l.text).slice(0, 56)}…`);
    }
  }
}

console.log(`\n${total - bad}/${total} lines fit in ${maxRows}; ${bad} over.`);
process.exit(bad ? 1 : 0);
