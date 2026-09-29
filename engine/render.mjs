import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir, rm, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { serve } from './server.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FFMPEG = process.env.FFMPEG || 'ffmpeg';

function parseArgs(argv) {
  const a = { episode: 'demo', jobs: 0, draft: false, from: null, to: null, preset: null, out: null, crf: 17 };
  for (let i = 2; i < argv.length; i++) {
    const t = argv[i];
    if (!t.startsWith('--')) { a.episode = t; continue; }
    const [k, v] = t.slice(2).split('=');
    if (k === 'draft') a.draft = true;
    else if (k === 'jobs') a.jobs = parseInt(v, 10);
    else if (k === 'from') a.from = parseFloat(v);
    else if (k === 'to') a.to = parseFloat(v);
    else if (k === 'crf') a.crf = parseInt(v, 10);
    else if (k in a) a[k] = v;
  }
  return a;
}

/**
 * Render frames [f0, f1) of an episode into `outFile`.
 * Frames are produced by SEEKING the page, so wall-clock render speed has no
 * effect on the result — a frame that takes 2s to paint still lands at its
 * exact timestamp.
 */
async function renderRange({ url, width, height, fps, f0, f1, outFile, draft, crf, onFrame }) {
  const browser = await chromium.launch({
    args: ['--force-color-profile=srgb', '--disable-lcd-text', '--hide-scrollbars',
           '--font-render-hinting=none', '--disable-font-subpixel-positioning'],
  });
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 1,
  });
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction('window.__ready === true', null, { timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);

  const args = [
    '-y', '-f', 'image2pipe', '-framerate', String(fps),
    '-c:v', draft ? 'mjpeg' : 'png', '-i', 'pipe:0',
    '-an',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
    '-preset', draft ? 'ultrafast' : 'slow',
    '-crf', String(draft ? 28 : crf),
    '-movflags', '+faststart',
    outFile,
  ];
  const ff = spawn(FFMPEG, args, { stdio: ['pipe', 'ignore', 'pipe'] });
  let ffErr = '';
  ff.stderr.on('data', d => { ffErr += d.toString(); if (ffErr.length > 8000) ffErr = ffErr.slice(-4000); });
  const done = new Promise((res, rej) => {
    ff.on('close', code => code === 0 ? res() : rej(new Error(`ffmpeg exit ${code}\n${ffErr}`)));
    ff.on('error', rej);
  });

  const clip = { x: 0, y: 0, width, height };
  for (let i = f0; i < f1; i++) {
    const t = i / fps;
    await page.evaluate(tt => window.__seek(tt), t);
    const buf = await page.screenshot(
      draft ? { clip, type: 'jpeg', quality: 72 } : { clip, type: 'png' }
    );
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    onFrame?.(i);
  }
  ff.stdin.end();
  await done;
  await browser.close();
}

export async function render(opts) {
  const a = { ...opts };
  const srv = await serve();
  try {
    const presets = JSON.parse(await readFile(path.join(ROOT, 'config/presets.json'), 'utf8'));

    // Ask the page itself for duration/size so the episode stays the source of truth.
    const probeBrowser = await chromium.launch();
    const probe = await probeBrowser.newPage();
    const qs = new URLSearchParams({ episode: a.episode });
    if (a.preset) qs.set('preset', a.preset);
    const pageUrl = `${srv.url}/engine/stage.html?${qs}`;
    await probe.goto(pageUrl, { waitUntil: 'load' });
    await probe.waitForFunction('window.__ready === true', null, { timeout: 60000 });
    const info = await probe.evaluate(() => ({ duration: window.__duration, fps: window.__fps, ...window.__size }));
    await probeBrowser.close();

    const fps = info.fps;
    const width = info.width, height = info.height;
    const t0 = a.from ?? 0;
    const t1 = a.to ?? info.duration;
    const F0 = Math.floor(t0 * fps);
    const F1 = Math.ceil(t1 * fps);
    const total = F1 - F0;

    const jobs = Math.max(1, a.jobs || Math.min(6, Math.max(1, os.cpus().length - 2)));
    const outDir = path.join(ROOT, 'out', a.episode);
    await mkdir(outDir, { recursive: true });
    const finalOut = a.out ?? path.join(outDir, a.draft ? 'draft.mp4' : 'video.mp4');

    console.log(`[render] ${a.episode}  ${width}x${height} @${fps}fps  ${(t1 - t0).toFixed(2)}s  ${total} frames  jobs=${jobs}${a.draft ? '  (draft)' : ''}`);

    const started = Date.now();
    let done = 0;
    const tick = () => {
      done++;
      if (done % 15 === 0 || done === total) {
        const pct = ((done / total) * 100).toFixed(1);
        const rate = done / ((Date.now() - started) / 1000);
        const eta = ((total - done) / rate).toFixed(0);
        process.stdout.write(`\r[render] ${pct}%  ${done}/${total}  ${rate.toFixed(1)} fps  eta ${eta}s    `);
      }
    };

    const segDir = path.join(outDir, '.segments');
    await rm(segDir, { recursive: true, force: true });
    await mkdir(segDir, { recursive: true });

    const bounds = [];
    const per = Math.ceil(total / jobs);
    for (let j = 0; j < jobs; j++) {
      const s = F0 + j * per, e = Math.min(F1, s + per);
      if (s < e) bounds.push([s, e, path.join(segDir, `seg${String(j).padStart(3, '0')}.mp4`)]);
    }

    await Promise.all(bounds.map(([s, e, file]) =>
      renderRange({ url: pageUrl, width, height, fps, f0: s, f1: e, outFile: file, draft: a.draft, crf: a.crf, onFrame: tick })
    ));
    process.stdout.write('\n');

    if (bounds.length === 1) {
      await rm(finalOut, { force: true });
      await (await import('node:fs/promises')).rename(bounds[0][2], finalOut);
    } else {
      const list = bounds.map(b => `file '${b[2].replace(/'/g, "'\\''")}'`).join('\n');
      const listFile = path.join(segDir, 'concat.txt');
      await writeFile(listFile, list);
      await run(FFMPEG, ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', listFile, '-c', 'copy', finalOut]);
    }
    await rm(segDir, { recursive: true, force: true });

    const secs = ((Date.now() - started) / 1000).toFixed(1);
    console.log(`[render] done in ${secs}s -> ${path.relative(process.cwd(), finalOut)}`);
    return { file: finalOut, fps, width, height, duration: t1 - t0 };
  } finally {
    await srv.close();
  }
}

export function run(cmd, args, opts = {}) {
  return new Promise((res, rej) => {
    const p = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], ...opts });
    let out = '', err = '';
    p.stdout?.on('data', d => (out += d));
    p.stderr?.on('data', d => (err += d));
    p.on('close', c => (c === 0 ? res({ out, err }) : rej(new Error(`${cmd} exited ${c}\n${err.slice(-3000)}`))));
    p.on('error', rej);
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  render(parseArgs(process.argv)).catch(e => { console.error(e); process.exit(1); });
}
