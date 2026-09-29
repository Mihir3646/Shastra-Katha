# paper-studio

A papercraft animation studio for a short-form video channel. Write the
narration, describe the shots in JavaScript, run one command, get a finished
`.mp4` with voiceover, music and captions.

Everything runs on this machine. No API keys, no per-minute pricing, no
subscription, no watermark, no upload of your scripts to anyone.

```bash
npm run preview -- panch-tattva     # scrub it in a browser
npm run build   -- panch-tattva     # narration + frames + mix -> out/
```

---

## What it costs

| Piece | Tool | Licence | Cost |
|---|---|---|---|
| Animation | your own JS + headless Chromium | MIT / BSD | free |
| Voice | [Kokoro‑82M](https://huggingface.co/hexgrad/Kokoro-82M) running locally | Apache‑2.0 | free |
| Music | `tools/make-music.py` — synthesised here, originals | yours | free |
| Encoding | ffmpeg | LGPL/GPL | free |
| Captions | drawn into the frame by the stage | — | free |

The voice model downloads once (~330 MB) and then works offline. The music is
generated from scratch, so there is nothing to attribute and no content‑ID risk.

---

## Setup

Once, on a new machine:

```bash
./tools/setup.sh
```

That installs ffmpeg, Python 3.12, espeak-ng, the node deps, headless Chromium
and the local voice model, then generates a starter music bed.

> Python **3.12** specifically. The ML stack has no wheels for 3.13/3.14 yet and
> one of its dependencies fails to compile from source there. The venv lives in
> `voice/.venv` and is used for nothing else.

---

## Making an episode

```bash
npm run new -- mangalvar-ka-rahasya
```

That writes `episodes/mangalvar-ka-rahasya/episode.js` — a working three‑scene
skeleton. Open it and change two things: the `script`, and the shots in
`build()`.

### 1. The script drives the timing

```js
script: [
  { id: 'l1', text: 'Every Tuesday belongs to Mars.', gap: 0.4 },
  { id: 'l2', text: 'The old texts are very clear about this.' },
],
```

Kokoro speaks each line, the build **measures how long it actually took**, and
writes `timings.json`. Your shots then reference those real timings:

```js
at('l2')    // absolute second line l2 starts speaking
end('l2')   // when it stops
dur('l2')   // how long it ran
```

This is the part that makes a weekly channel practical. You never hand‑type a
timestamp, and when you reword a line the animation re‑times itself.

### 2. The shots

```js
build({ stage, tl, at, end }) {
  const W = stage.width, H = stage.height, CX = W / 2;

  stage.scene({
    name: 'open',
    from: 0,
    to: end('l1') + 0.3,          // element visibility window
    build() {
      const m = stage.add({
        id: 'wheel',
        svg: wheel(300, { segments: 12, glyphs: ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'] }),
        x: CX, y: 900, layer: 4, scale: 0, shadow: 'cut-shadow',
      });
      tl.fromTo(m, { scale: [0, 1], rot: [-40, 0] },
                { at: at('l1'), dur: 0.6, ease: 'outBack' });
      Motion.spin(tl, m, { rpm: 0.3, at: at('l1') + 0.6 });
    },
  });
}
```

`stage.add()` returns a plain mutable object. The timeline animates its fields
(`x y rot scale scaleX scaleY opacity`) and the stage writes them to the DOM.

### 3. Build it

```bash
npm run build -- mangalvar-ka-rahasya
```

Useful flags:

| Flag | Effect |
|---|---|
| `--draft` | fast, ugly encode — for checking timing |
| `--skip-voice` | reuse the narration you already rendered |
| `--skip-render` | re‑mix audio without re‑rendering frames |
| `--jobs=8` | parallel render workers (default: cores − 2) |
| `--music=path.mp3` | override the bed |
| `--preset=landscape` | override the format |

Output lands in `out/<episode>/`:

```
<episode>.mp4     the finished video
<episode>.srt     subtitle file for the YouTube upload form
silent.mp4        picture only
mix.wav           the audio bed
shots/            any stills you took
```

---

## Settled decisions

These were arrived at by testing, not preference. Changing them means redoing
that work, so the reasoning is recorded here.

| | choice | why |
|---|---|---|
| **Voice** | AI4Bharat Indic Parler, `aman-deep` | Six other engines were rejected for anglicised Hindi. This one is built at IIT Madras *for* Indian languages. Free, local, Apache-2.0. |
| **Style** | Madhubani | Culturally native to the subject, and unmistakable in a feed. |
| **Format** | 8 min landscape + Shorts cut from chapters | 8 min lands inside budget when a paid TTS is used; Shorts cost nothing extra. |
| **Editorial gate** | Jev, with a free rules fallback | Sourcing is the channel's moat. |

Voices that were tried and rejected for Hindi: Kokoro (`hm_omega`, `hm_psi`,
`hf_alpha`, `hf_beta`), OpenAI `onyx`/`ash`/`echo` via OpenRouter on both
`gpt-audio-mini` and `gpt-audio`, and Chatterbox Multilingual. All read Devanagari
with an English accent. Gemini `Orus`/`Charon` work but cost ₹59–89/month against
₹0 for Aman.

### Three numbers worth keeping

Measured, and worth re-checking if you change the mix or the pacing:

- **Music vs voice**: keep ≥14 dB separation in the 300–3500 Hz band. Before the
  fix it hit 0.7 dB — the bed was as loud as the narration. Notching 500/1600/3000 Hz
  out of the music is what fixed it, not lowering the volume.
- **Motion**: aim for ≥3% of the frame changing per frame. Below ~1% the video
  reads as a slideshow. A slow camera push per chapter is the cheapest way there.
- **Loudness**: −14 LUFS integrated. That is what YouTube normalises to.

---

## Madhubani style

The channel's visual language. It keeps the papercraft *technique* — torn
geometry, paper grain, drop shadows, the stop-motion boil — and replaces the
surface with Mithila painting:

- heavy soot-black outlines instead of cream die-cut edges
- dense pattern fill, because Mithila abhors empty space
- natural-pigment palette: turmeric, kumkum, indigo, lamp-black
- a decorative border on every frame, as the tradition always has
- flat and frontal: no perspective, no gradients, no soft shading

```js
import { MB, ink, mbBorder, mbVastuGrid, mbFigure, mbLotus,
         sunFace, kalash, fish, peacock, mbBand, mbCard, mbDisc } from '../../engine/madhubani.js';

stage.add({ id: 'border', svg: mbBorder(W, H), x: 0, y: 0, layer: 60, boil: false });
stage.add({ id: 'grid',   svg: mbVastuGrid(620, { labels: [...], highlight: 8 }), x: CX, y: 1060, layer: 4 });
```

`ink(path, fill, { pattern, sw })` is the core treatment and replaces `cut()`
from kit.js: flat colour, pattern fill, heavy outline. Twelve pattern fills are
registered as SVG defs automatically — `hatch` `hatch2` `cross` `vline` `hline`
`dots` `stipple` `wave` `scale` `chevron` `net` `leafrow`.

**The border doubles as a safe area.** Keep content inside it and nothing
collides with platform UI on Shorts.

Motifs: `sunFace` (Surya with a face), `fish` (prosperity — the commonest
Mithila motif), `peacock`, `mbLotus`, `kalash`, `mbFigure` (frontal, angular,
fish-shaped eyes), `mbBand` (section dividers), `mbVastuGrid`.

See `episodes/mb-test/` for every motif on one frame:

```bash
npm run shot -- mb-test 1.0
```

---

## The look

Everything is torn paper. That is produced by geometry, not filters:
`tornRect`, `tornEllipse`, `blob` and friends walk a shape's outline and push
each vertex along its normal by seeded fractal noise. Filters would have been
easier but get rasterised per element per frame, and a 60‑second vertical video
is 1800 frames.

Three settings carry most of the aesthetic:

- **`cut()` borders** — every cutout gets a cream stroke drawn *under* its fill
  (`paint-order: stroke`), which reads as the pale edge of cut cardstock.
- **The grain overlay** — one seamless 512px paper‑fibre tile generated at
  mount, multiplied over the whole frame. Tune it in `stage.html` (`#grain`
  opacity) and `paper.js` (`paperTextureDataURL`).
- **The boil** — `meta.boil` nudges every element by about a pixel at 8fps, the
  handmade wobble of stop‑motion. Set `enabled: false` for a clean digital look.

### Component kit (`engine/kit.js`)

| | |
|---|---|
| Paper | `card` `disc` `strip` `tape` `pin` `label` `sticky` `text` |
| Type | `ransom` — the cut‑out ransom‑note title treatment |
| Spiritual | `mandala` `lotus` `diya` `wheel` `vastuGrid` `temple` `meditator` |
| Scenery | `hillRange` `stars` `moon` `cloud` `smoke` `sunburst` |
| People | `figure` (head/body/two arms, limbs animate separately) |
| Extras | `arrow` `bubble` `confetti` |

Each returns SVG markup drawn around the origin, so the stage can rotate and
scale it about its own centre.

### Motion presets (`engine/stage.js`)

`stamp` `rise` `slide` `flip` `out` `sway` `spin` `flicker` `push`

…or drive any property yourself:

```js
tl.fromTo(el, { y: [200, 0], opacity: [0, 1] }, { at: 3.2, dur: 0.5, ease: 'outBack' });
tl.stagger(dots, { scale: [0, 1] }, { at: at('l2'), each: 0.08, ease: 'outBack' });
tl.drive(el, (local, global, s) => { s.rot = Math.sin(global * 2) * 4; });
```

Easings: `outBack` `outElastic` `outBounce` `inOutCubic` `outQuart` `outExpo`
`inOutSine` and the rest of the usual set, in `engine/ease.js`.

### Transitions (`engine/transitions.js`)

`tearWipe` (a sheet of paper torn across the frame) · `blobWipe` · `flash` · `fade`

---

## Jev: the decision layer

[Jev](https://typesafe.ai) is a System One model — it does not generate text. You
give it a `state` and typed questions; it answers all of them in parallel with
calibrated probabilities. That makes it right for the hundreds of small
judgements an episode needs, and wrong for anything you'd ask an LLM to write.

**Setup.** Get an AI Gateway key from your Vercel dashboard, then:

```bash
cp .env.example .env.local     # paste the key into .env.local — it is gitignored
npm run review -- vastu-disha
```

### Reviewing a script before you render it

```bash
npm run review -- vastu-disha           # report
npm run review -- vastu-disha --gate    # exit 1 if anything fails
```

Three checks, one request:

| Check | Why |
|---|---|
| **sourced** | a factual claim with no text named is the whole credibility risk of this niche |
| **clarity** | a line the viewer has to re-read is a line they scroll past |
| **shot** | which kit template fits — the first step toward drafting shots automatically |

Every question goes in a single call. Jev evaluates them in parallel and in
isolation, so 180 questions cost barely more latency than one — and far less
than 180 separate requests.

### Two backends, one interface

```js
import { Jev, bool, choice, score, gate } from './engine/jev.js';

const jev = new Jev();          // gateway if AI_GATEWAY_API_KEY is set, else direct
const { answers } = await jev.ask(state, {
  is_sourced: bool('Does this line name the text it comes from?'),
  shot:       choice('Which template fits?', { grid: '…', diya: '…' }),
  clarity:    score('How clear is this?', ['confusing', 'takes effort', 'clear']),
});

const g = gate(answers.shot, { min: 0.6 });   // act only when confident
if (!g.act) → send to review instead of shipping
```

**The two backends are not the same wire format**, which is worth knowing before
you write against the docs:

| | TypeSafe direct | Vercel AI Gateway |
|---|---|---|
| Endpoint | `POST /v1/systemone` | `POST /v1/evaluate` |
| Yes/no type | `noul` | `boolean` |
| `score` criteria | object of levels | **array**, lowest first |
| Model id | `jev-latest` | `typesafe-ai/jev` |
| Key | `TYPESAFE_API_KEY` | `AI_GATEWAY_API_KEY` |

`engine/jev.js` speaks one vocabulary (`bool` / `choice` / `score`) and
translates per backend, so switching is a constructor argument.

### The decision catalogue

Every automated judgment lives in `engine/decisions.js` — one file you can read
in five minutes. When a video goes out wrong the cause is almost always a
decision rule, not the renderer, and scattered questions are impossible to audit.

| Stage | Questions | Gates on |
|---|---|---|
| `topicQuestions` | duplicate? long enough? visual? practical? | picks the next episode |
| `claimQuestions` | sourced? contested? stated as fact? promises an outcome? regulated advice? | **blocks the build** |
| `scriptQuestions` | clarity, hook strength | rewrite loop |
| `shotQuestions` | which kit template fits | scaffolds the chapter |
| `shortQuestions` | does this chapter stand alone? | which Shorts to cut |
| `titleQuestions` | curiosity, honesty, searchability | which title to use |
| `channelNameQuestions` | memorable, spellable, scope fit, too narrow? | naming |

`verdictFor()` turns claim answers into an editorial verdict. Three flags block
publication outright:

- **UNSOURCED** — a factual claim with no text named
- **PROMISES_OUTCOME** — promises wealth, health, marriage or safety as a result
- **REGULATED_ADVICE** — medical, psychiatric, financial or legal advice

Two more require a disclaimer rather than a rewrite: **STATED_AS_FACT**
(traditional belief phrased as fact about the world) and **CONTESTED**
(traditions genuinely disagree).

Thresholds live in code, not in a prompt, so tuning them is a diff you can review.

### Running without a key

The gate degrades instead of blocking you:

```bash
npm run review -- vastu-disha --offline
```

Rule-based, offline, free. It catches the two failures that actually get a
channel in trouble — **outcome promises** ("will bring wealth", "अवश्य मिलेगी")
and **regulated advice** (medical, financial, legal) — in Hindi and English, and
warns about assertions with no source text named within two lines.

It cannot judge tone, nuance, whether a claim is genuinely contested, or which
shot fits. Treat a clean offline result as *"nothing obvious"*, never as
*"checked"*. Extend `SOURCE_TEXTS` in `engine/heuristics.js` as you widen the
subject matter.

### What it costs

Jev bills input tokens only; output is free.

| | tokens | ₹/month |
|---|---|---|
| One full episode review (~60 lines) | 25,000 | 0.09 |
| 4 videos/mo × 3 passes | 300,000 | 1.11 |
| **12 videos/mo × 3 passes** | 900,000 | **3.33** |
| 30 videos/mo × 3 passes | 2,250,000 | 8.32 |

At three videos a week that is about **₹0.28 per video**. The cost is not the
consideration — the Vercel AI Gateway simply will not serve any request until a
card is on file, free credits included.

### Where Jev does and does not belong

Use it for decisions that happen **hundreds of times per episode** and have a
closed answer set: is this claim sourced, which shot fits this beat, does this
chapter stand alone as a Short, is this topic a duplicate of episode 14.

Do not use it for one-off judgements — "how long should this video be?" happens
once, and a rule answers it better than a model call. And do not use it to
*write*: it has no string output. Scripts come from an LLM; Jev decides what to
do with them.

`gate(answer, { min })` is the pattern that keeps this safe: act automatically
only when the model is confident, and route everything else to you. That one
checkpoint is the difference between a channel and a slop farm.

---

## Voice

```bash
npm run voices        # list everything installed
```

English narration — `bm_george`, `bm_lewis` (British, documentary register),
`am_michael`, `af_heart` (American).
**Hindi** — `hm_omega`, `hm_psi` (male), `hf_alpha`, `hf_beta` (female). Write
the script in Devanagari and it is pronounced correctly:

```js
voice: { voice: 'hm_omega', speed: 0.95 },
script: [
  { id: 'l1', text: 'मंगलवार का दिन हनुमान जी को समर्पित है।' },
],
```

Per‑line overrides work too — `{ id: 'l4', text: '…', voice: 'hf_alpha' }` — so
one episode can hold two speakers.

Also on the dial: `speed` (0.8 is stately, 1.1 is brisk) and `gap`, the pause
after each line. Gaps are where an edit breathes; a documentary read wants
0.3–0.5.

### Your own voice (recommended)

TTS gives you an accent that isn't yours, no breath, and flat delivery. For a
Hindi channel about traditional knowledge, a real voice is a differentiator
against every AI-narrated competitor — and it costs a microphone once.

```bash
node tools/read-sheet.mjs vastu-disha --html    # what to read
# record ONE take, pausing ~1.5s between lines
node tools/split-take.mjs vastu-disha ~/Desktop/take1.m4a
node engine/tts.mjs vastu-disha --engine=manual
```

`split-take` finds the pauses and cuts on them. If the segment count doesn't
match the line count it says so and writes nothing, rather than silently mapping
the wrong audio to the wrong line:

```
too many segments -> you paused mid-line.  raise --min-silence (try 1.2)
too few segments  -> pauses too short.     lower it (0.6), or raise
                     --threshold toward -30 in a noisy room
```

You can also skip the splitter and drop one file per line into
`episodes/<ep>/voice/<lineId>.wav` (wav, m4a, mp3, aiff, flac all work).

Cleanup is deliberately gentle — 80 Hz high-pass, light denoise, soft levelling.
Heavier gating kills the breath between phrases, and breath is the entire reason
to use a real voice. Tune it per episode:

```js
voice: { engine: 'manual', clean: { highpass: 80, denoise: 10 }, gap: 0.34 }
```

Everything downstream is unchanged: chapters, captions, Shorts and the Jev gate
all read the same `timings.json`.

### TTS engines



| | cost | use it for |
|---|---|---|
| `kokoro` | free, local, unlimited | drafting, timing, everything before the final render |
| `gemini` | ~₹0.79–1.19 per spoken minute | the published render |

```js
voice: {
  engine: 'gemini',
  model: 'google/gemini-3.8-flash-tts',   // -flash-lite-tts is ~33% cheaper
  geminiVoice: 'Charon',
  instructions: 'Read as a calm documentary narrator.',
  voice: 'hm_omega', speed: 0.94,          // used when engine is 'kokoro'
}
```

Override per build: `--engine=kokoro`, `--voice=Kore`, `--tts-model=...`

> **Gemini TTS requires PAID CREDITS on Vercel, not just a card.** Free-tier
> keys are refused for speech models outright (`403 RestrictedModelsError`).
> This is a stricter gate than Jev, which only needs a card on file. Until you
> top up, run `--engine=kokoro` — it is free, local, and unlimited.

**Check the bill before you spend it:**

```bash
node engine/tts.mjs vastu-disha --estimate
```

| | 10-min episode |
|---|---|
| `gemini-3.8-flash-tts` | ₹11.88 |
| `gemini-3.8-flash-lite-tts` | ₹7.92 |

**Gemini output is cached by content.** The cache key is the hash of model +
voice + instructions + the line's text, so editing line 14 of a sixty-line
script re-bills line 14 only. Without that, three script revisions cost three
times the video. Cache lives in `.cache/tts/` — delete it to force a re-synth.

Voices: `Charon` (deep, informative), `Kore` (firm), `Orus` (warm), `Puck`
(bright), `Zephyr`, `Leda`, `Aoede`, `Fenrir`. Full list in Google's TTS docs.

### Devanagari

On-screen Hindi works — display type, torn labels, the vastu grid and captions
all render conjuncts and matras correctly (`--font-deva`). Check it any time
with the bundled style sheet, which also exercises every Madhubani motif:

```bash
npm run shot -- mb-test 1.0
```

One thing to know about `ransom()`: for Indic scripts it tiles **by word**, not
by letter. Per-letter tiling splits matras from their base character (वास्तु
becomes व ा स ् त ु) and breaks the shirorekha that visually joins a word.
Latin still tiles per letter. Pass `{ unit: 'letter' }` to force the split.

---

## Music

```bash
npm run music -- --style tanpura --key C# --minutes 2 --out assets/music/bed.wav
```

Three styles, all synthesised from scratch:

- **`tanpura`** — the four‑string drone. Sits under anything devotional.
- **`pad`** — slow modal chord wash. Neutral, good under dense narration.
- **`chimes`** — sparse bells over a drone. Good for a calm open.

The build ducks the bed under the voice with a sidechain compressor and
normalises the result to −14 LUFS, which is what YouTube targets — hand it that
and it leaves your audio alone.

Prefer a real track? Point `music.file` anywhere. Free sources worth knowing:
Pixabay Music and the YouTube Audio Library (no attribution), Free Music Archive
and Incompetech (CC‑BY — credit in the description).

---

## Long-form, and the Shorts that come out of it

A 10-minute episode authored as one `build()` is unmaintainable. Split it into
**chapters** — and because each chapter owns its own narration lines and shots,
each one is independently cuttable as a vertical Short.

```
episodes/vastu-disha/
  episode.js              meta, voice, and the chapter list
  chapters/
    01-hook.js
    02-agneya.js
    03-rule.js
```

```js
// episode.js
import hook from './chapters/01-hook.js';
import agneya from './chapters/02-agneya.js';
export default {
  meta: { preset: 'landscape', ... },
  voice: { voice: 'hm_omega', speed: 0.94 },
  chapters: [hook, agneya],
};

// chapters/02-agneya.js
export default {
  id: 'agneya',
  title: 'आग्नेय कोण',          // becomes a YouTube chapter
  short: true,                  // eligible to cut as a Short
  script: [ { id: 'a1', text: '…' } ],
  build({ stage, tl, at, end, from, pick }) { … },
};
```

```bash
npm run build -- vastu-disha                 # the long-form video
npm run build -- vastu-disha --short=agneya  # that chapter, vertical
```

Chapter windows are derived from the **measured** narration, same as everything
else — you never type a timestamp. The build also writes
`out/<episode>/chapters.txt`, ready to paste into the YouTube description.

### Shorts are re-renders, not crops

`--short=` does not crop the wide video. It re-runs the same chapter code at
1080×1920 and cuts the matching slice of narration. The Short is a native
vertical at full quality — which is only possible because the animation is a
program rather than a rendered clip.

### Write chapters for both aspects

The one thing that does not survive the switch: things placed side by side in
16:9 have to stack in 9:16. Fractional positioning alone will not save you — the
arrangement has to change. Every chapter gets `pick(wide, tall)`:

```js
build({ stage, pick }) {
  stage.add({
    svg: diya(190),
    x: pick(CX + W * 0.28, CX),      // beside the grid / below it
    y: pick(H * 0.54, H * 0.665),
  });
}
```

`ctx.portrait` is the raw boolean if you need to branch harder. Check both with:

```bash
npm run shot -- vastu-disha 8 --preset=landscape
npm run shot -- vastu-disha 8 --preset=shorts
```

---

## Formats

`config/presets.json`:

| Preset | Size | For |
|---|---|---|
| `shorts` | 1080×1920 | YouTube Shorts, Reels, TikTok |
| `landscape` | 1920×1080 | standard YouTube |
| `square` | 1080×1080 | feed posts |
| `shorts-hq` | 1080×1920 @60 | smoother motion, 2× render time |

Set it per episode (`meta.preset`) or override at build time
(`--preset=landscape`). Positions in `build()` are written against
`stage.width`/`stage.height`, so an episode composed with those survives the
switch.

---

## How the render works

Frames are produced by **seeking**, never by playing. The page exposes
`window.__seek(t)`; the renderer sets an exact timestamp, screenshots, and
repeats. Nothing is dropped, wall‑clock speed is irrelevant, and the same
episode renders byte‑identical every time — there is no `Math.random()` anywhere
in the engine, only seeded generators.

Work is split across parallel Chromium workers, each piping PNGs straight into
its own ffmpeg, and the segments are concatenated. On this machine a 29‑second
vertical episode renders in about 50 seconds.

Checking a single moment is much faster than a full build:

```bash
npm run shot -- panch-tattva 0 4.5 12 27
```

---

## Troubleshooting

**Nothing but background in the frame.** Something full‑bleed is sitting on top.
Overlays need a visibility window — `stage.add({ …, window: [start, end] })` —
or they sit centred and opaque for the whole episode.

**Art is offset by half the frame.** `hillRange` and `stars` draw from `0,0` to
`W,H`; anchor them at `x: 0`. Everything else is centred and anchors at `CX`.

**Captions collide with artwork.** `captions.position` is a fraction of frame
height. Keep the bottom ~18% clear on Shorts — the platform UI covers it.

**Voice build fails on import.** The venv must be Python 3.12. Delete
`voice/.venv` and re‑run `tools/setup.sh`.

**Fonts differ on another machine.** `stage.html` uses macOS‑resident faces
(Superclarendon, Bradley Hand, Kohinoor Devanagari). Drop `.ttf` files into
`assets/fonts/` and add `@font-face` rules there to pin them.

---

## Layout

```
engine/
  ease.js          easing curves
  prng.js          seeded randomness — determinism depends on this
  timeline.js      keyframes + seeking
  paper.js         torn-edge geometry, paper texture, patterns
  kit.js           the component library
  stage.js         scene graph, camera, boil, motion presets
  transitions.js   wipes, flashes, fades
  captions.js      on-screen captions
  stage.html       the page that gets screenshotted
  render.mjs       parallel frame capture -> ffmpeg
  build.mjs        voice -> frames -> mix -> mux
  shot.mjs         single-frame stills
  preview.mjs      browser scrubber
voice/
  tts.py           Kokoro wrapper
  .venv/           Python 3.12 environment
tools/
  setup.sh         one-time install
  make-music.py    music generator
  new-episode.mjs  scaffolder
episodes/<name>/
  episode.js       ← the only file you write
  script.json      generated
  timings.json     generated — measured narration timings
  narration.wav    generated
assets/{fonts,music,sfx}
config/presets.json
out/<name>/
```
