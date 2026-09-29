// ---------------------------------------------------------------------------
// Chapter assembly for long-form episodes.
//
// A 10-minute video authored as one build() is unmaintainable. Chapters split
// it into self-contained beats — which also makes them individually cuttable as
// vertical Shorts, because each one owns its own narration lines and shots.
// ---------------------------------------------------------------------------

/** Flatten every chapter's script into the single list the TTS step consumes. */
export function collectScript(episode) {
  if (!episode.chapters) return episode.script ?? [];
  const out = [];
  for (const ch of episode.chapters) {
    for (const line of ch.script ?? []) {
      out.push({ ...line, _chapter: ch.id });
    }
  }
  return out;
}

/**
 * Absolute [start, end] for each chapter, derived from the measured timings of
 * its own lines. Chapters have no hand-typed durations for the same reason
 * scenes don't: the voiceover decides.
 */
export function chapterWindows(episode, timings, { lead = 0, tail = 0 } = {}) {
  const windows = {};
  if (!episode.chapters) return windows;
  for (const ch of episode.chapters) {
    const ids = (ch.script ?? []).map(l => l.id).filter(id => timings[id]);
    if (!ids.length) continue;
    const start = Math.min(...ids.map(id => timings[id].start));
    const end = Math.max(...ids.map(id => timings[id].end));
    windows[ch.id] = {
      id: ch.id,
      title: ch.title ?? ch.id,
      short: ch.short !== false,
      start: Math.max(0, start - (ch.lead ?? lead)),
      end: end + (ch.tail ?? tail),
    };
  }
  return windows;
}

/**
 * Run every chapter's build(), handing each a context scoped to itself but
 * carrying absolute times — scenes still position on the real timeline.
 */
export function buildChapters(episode, api, windows) {
  if (!episode.chapters) { episode.build?.(api); return; }
  for (const ch of episode.chapters) {
    const w = windows[ch.id];
    const ctx = {
      ...api,
      chapter: ch.id,
      from: w?.start ?? 0,
      to: w?.end ?? 0,
      /** first line of this chapter — the usual anchor for a chapter opener */
      first: () => (ch.script?.[0] ? api.at(ch.script[0].id) : 0),
      last: () => (ch.script?.length ? api.end(ch.script[ch.script.length - 1].id) : 0),
    };
    ch.build?.(ctx);
  }
}

/** YouTube description chapter list. Must start at 0:00 or YouTube ignores it. */
export function chapterList(windows, episode) {
  const fmt = s => {
    const t = Math.max(0, Math.floor(s));
    const m = Math.floor(t / 60), sec = t % 60;
    const h = Math.floor(m / 60);
    return h > 0
      ? `${h}:${String(m % 60).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
      : `${m}:${String(sec).padStart(2, '0')}`;
  };
  const rows = Object.values(windows).sort((a, b) => a.start - b.start);
  if (!rows.length) return '';
  return rows.map((w, i) => `${fmt(i === 0 ? 0 : w.start)} ${w.title}`).join('\n');
}
