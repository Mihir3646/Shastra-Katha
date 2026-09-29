#!/usr/bin/env node
/**
 * Print what to record.   node tools/read-sheet.mjs vastu-disha
 *
 * Numbered, chapter-grouped, with the line ids the pipeline expects back.
 * Pass --html to get a page you can read off a phone or tablet at the mic.
 */
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const epName = process.argv[2];
if (!epName) { console.error('usage: node tools/read-sheet.mjs <episode> [--html]'); process.exit(1); }

const ep = (await import(path.join(ROOT, 'episodes', epName, 'episode.js'))).default;
const chapters = ep.chapters ?? [{ id: 'main', title: '', script: ep.script ?? [] }];
const all = chapters.flatMap(c => c.script ?? []);
const words = all.reduce((n, l) => n + l.text.trim().split(/\s+/).length, 0);

if (process.argv.includes('--html')) {
  const body = chapters.map(c => `
    <section><h2>${c.title || c.id}</h2>
    ${(c.script ?? []).map(l => `
      <div class="line"><span class="id">${l.id}</span><p>${l.text}</p></div>`).join('')}
    </section>`).join('');
  const html = `<!doctype html><meta charset="utf-8"><title>${epName} — read sheet</title>
<style>
 body{font:20px/1.75 -apple-system,system-ui,sans-serif;max-width:46rem;margin:2rem auto;padding:0 1.2rem;color:#1b1b1b}
 h1{font-size:1.5rem} h2{margin-top:2.4rem;font-size:1.05rem;letter-spacing:.08em;text-transform:uppercase;color:#8a6a2a;border-bottom:2px solid #e8dcc0;padding-bottom:.3rem}
 .line{display:flex;gap:1rem;margin:1.5rem 0;page-break-inside:avoid}
 .id{flex:0 0 3.4rem;font:600 .8rem/2.4 ui-monospace,monospace;color:#fff;background:#b4472f;border-radius:4px;text-align:center;height:1.9rem}
 p{margin:0;font-size:1.32rem}
 .tip{background:#fdf6e6;border-left:4px solid #d99a2b;padding:.9rem 1.1rem;font-size:.95rem;border-radius:0 6px 6px 0}
 @media print{.tip{display:none}}
</style>
<h1>${epName}</h1>
<p class="tip"><b>Leave a clear 1.5&ndash;2 second pause between lines.</b> That silence is how the
splitter finds the boundaries. Read each line as one take &mdash; if you fumble, pause
and read the whole line again, then keep the better one.</p>
${body}`;
  const out = path.join(ROOT, 'out', epName, 'read-sheet.html');
  await writeFile(out, html);
  console.log(`read sheet -> ${path.relative(ROOT, out)}`);
  console.log(`open ${out}`);
} else {
  console.log(`\n${epName} — ${all.length} lines, ~${words} words, ~${(words / 2.3 / 60).toFixed(1)} min read\n`);
  for (const c of chapters) {
    if (c.title) console.log(`\n── ${c.title} ──`);
    for (const l of c.script ?? []) console.log(`\n  [${l.id}]  ${l.text}`);
  }
  console.log(`\n\nRecord one take, pausing ~1.5s between lines, then:`);
  console.log(`  node tools/split-take.mjs ${epName} <your-recording>\n`);
}
