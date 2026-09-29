#!/usr/bin/env node
/**
 * Render single frames to PNG for eyeballing composition, without waiting on a
 * full encode:   node engine/shot.mjs <episode> 0 2.5 7 12.25
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from './server.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const episode = process.argv[2] ?? 'demo';
const times = process.argv.slice(3).filter(a => !a.startsWith('--')).map(Number);
const presetArg = process.argv.find(a => a.startsWith('--preset='))?.split('=')[1];
const scaleArg = parseFloat(process.argv.find(a => a.startsWith('--scale='))?.split('=')[1] ?? '1');

const srv = await serve();
const browser = await chromium.launch({ args: ['--force-color-profile=srgb', '--hide-scrollbars'] });
const qs = new URLSearchParams({ episode });
if (presetArg) qs.set('preset', presetArg);
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
await page.goto(`${srv.url}/engine/stage.html?${qs}`, { waitUntil: 'load' });
await page.waitForFunction('window.__ready === true', null, { timeout: 60000 });
await page.evaluate(() => document.fonts.ready);

const info = await page.evaluate(() => ({ duration: window.__duration, ...window.__size }));
await page.setViewportSize({ width: info.width, height: info.height });
const shots = times.length ? times : [0, info.duration * 0.25, info.duration * 0.5, info.duration * 0.75, info.duration - 0.1];

const outDir = path.join(ROOT, 'out', episode, 'shots');
await mkdir(outDir, { recursive: true });
console.log(`[shot] ${episode} ${info.width}x${info.height}  duration ${info.duration.toFixed(2)}s`);

for (const t of shots) {
  await page.evaluate(tt => window.__seek(tt), t);
  const buf = await page.screenshot({
    clip: { x: 0, y: 0, width: info.width, height: info.height },
    scale: scaleArg !== 1 ? 'css' : 'device',
  });
  const f = path.join(outDir, `t${t.toFixed(2).replace('.', '_')}.png`);
  await writeFile(f, buf);
  console.log(`[shot]   ${t.toFixed(2)}s -> ${path.relative(ROOT, f)}`);
}
await browser.close();
await srv.close();
