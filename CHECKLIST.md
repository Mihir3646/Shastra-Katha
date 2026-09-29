# Weekly episode checklist

1. `npm run new -- <episode-name>`
2. Write the `script` array. Read it aloud once — if you stumble, the voice will too.
3. `npm run build -- <name> --skip-render` — hear the narration, check the pacing.
4. Sketch the shots in `build()`.
5. `npm run preview -- <name>` — scrub, fix, repeat. No rendering.
6. `npm run shot -- <name> 0 5 12 20` — check individual moments at full quality.
7. `npm run build -- <name> --draft` — fast full pass, confirms nothing collides.
8. `npm run build -- <name>` — the real one.
9. Upload `out/<name>/<name>.mp4`, attach `out/<name>/<name>.srt` as subtitles.

## Things that make these watchable

- **First 1.5 seconds decide everything.** Open on the hook, not on a logo.
- **One idea per line.** The line length sets the shot length; long lines make slow shots.
- **Change something on every line.** A new colour, a new object, a wipe. Stillness reads as a frozen video.
- **Keep the bottom 18% clear** on Shorts — the platform's own UI covers it.
- **Say the title out loud in the first line.** Search and autoplay both reward it.
- Reuse one format so episodes are cheap to make and recognisable to viewers.
  The demo's five-element structure is a format: same shot, re-skinned five times.

---

# Long-form episode checklist

1. Pick a topic that is *natively* long — "all eight directions", "five mistakes
   in most flats" — not a 90-second rule stretched to fill ten minutes.
2. Break it into 5–6 chapters. **Each chapter must work as a standalone Short**:
   its own hook, its own payoff. If a chapter only makes sense after the one
   before it, it is not a chapter, it is a paragraph.
3. Write each chapter's `script` first. Build the shots after.
4. `npm run build -- <name> --skip-render` — hear it, check the pacing.
5. Shoot both aspects early, before you build out the whole thing:
   `npm run shot -- <name> <t> --preset=landscape` and `--preset=shorts`.
   Side-by-side elements have to stack in vertical — use `pick(wide, tall)`.
6. `npm run build -- <name>` — the long-form.
7. `npm run build -- <name> --short=<chapterId>` for each chapter worth cutting.
8. Upload the long-form. Paste `out/<name>/chapters.txt` into the description.
   Attach `<name>.srt` as subtitles — never rely on YouTube's auto-captions,
   they mangle lakh/crore and Devanagari.
9. Release the Shorts over the following days, each pointing at the long-form.
   One at a time. Never batch-dump.

## Length

Let the story set it. A 12-minute video at 20% retention delivers 2.4 watched
minutes; an 8-minute at 45% delivers 3.6. Padding to reach a mid-roll threshold
loses on every metric that matters.
