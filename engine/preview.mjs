#!/usr/bin/env node
/**
 * Scrub an episode in your own browser — no rendering, instant feedback.
 *   npm run preview -- panch-tattva
 * Ctrl-C to stop.
 */
import { serve } from './server.mjs';
import { spawn } from 'node:child_process';

const episode = process.argv[2] ?? 'panch-tattva';
const preset = process.argv.find(a => a.startsWith('--preset='))?.split('=')[1];

const srv = await serve(4321);
const qs = new URLSearchParams({ episode, preview: '1' });
if (preset) qs.set('preset', preset);
const url = `${srv.url}/engine/stage.html?${qs}`;

console.log(`\n  preview: ${url}\n  (ctrl-c to stop)\n`);
if (process.platform === 'darwin') spawn('open', [url], { stdio: 'ignore', detached: true }).unref();

process.on('SIGINT', async () => { await srv.close(); process.exit(0); });
