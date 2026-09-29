#!/usr/bin/env python3
"""
Local text-to-speech for paper-studio.

Reads a script.json produced by the build step, speaks every line with Kokoro
(Apache-2.0, runs offline on CPU/MPS), and writes:

    lines/<id>.wav     one file per narration line
    narration.wav      the assembled track, with the gaps the script asks for
    timings.json       {id: {start, dur, end}} -- what drives the animation

Nothing here talks to a paid service; the model is downloaded once from
Hugging Face and then cached locally.
"""
import argparse, json, os, sys, wave
from pathlib import Path

import numpy as np
import soundfile as sf

SR = 24000  # Kokoro's native sample rate

# lang_code -> the voices that ship with Kokoro v1.0
VOICE_TABLE = {
    "a": ["af_heart", "af_bella", "af_nicole", "af_sarah", "af_sky", "am_michael", "am_adam", "am_fenrir", "am_puck"],
    "b": ["bf_emma", "bf_isabella", "bf_alice", "bm_george", "bm_lewis", "bm_daniel", "bm_fable"],
    "h": ["hf_alpha", "hf_beta", "hm_omega", "hm_psi"],
    "e": ["ef_dora", "em_alex"],
    "f": ["ff_siwis"],
    "i": ["if_sara", "im_nicola"],
    "p": ["pf_dora", "pm_alex"],
    "j": ["jf_alpha", "jm_kumo"],
    "z": ["zf_xiaobei", "zm_yunjian"],
}


def lang_for_voice(voice: str, fallback: str = "a") -> str:
    for code, voices in VOICE_TABLE.items():
        if voice in voices:
            return code
    return fallback


def synth_line(pipeline, text, voice, speed):
    """Kokoro yields one chunk per sentence-ish segment; stitch them."""
    chunks = [audio for _, _, audio in pipeline(text, voice=voice, speed=speed)]
    if not chunks:
        return np.zeros(0, dtype=np.float32)
    return np.concatenate([np.asarray(c, dtype=np.float32) for c in chunks])


def trim_silence(a, thresh=0.006, keep=0.04):
    """Kokoro pads its output; trim so our gap values actually mean something."""
    if a.size == 0:
        return a
    idx = np.where(np.abs(a) > thresh)[0]
    if idx.size == 0:
        return a
    pad = int(keep * SR)
    return a[max(0, idx[0] - pad): min(a.size, idx[-1] + pad)]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--script", required=True, help="path to script.json")
    ap.add_argument("--out", required=True, help="episode output dir")
    ap.add_argument("--voice", default=None, help="override the script's voice")
    ap.add_argument("--speed", type=float, default=None)
    ap.add_argument("--list-voices", action="store_true")
    args = ap.parse_args()

    if args.list_voices:
        for code, vs in VOICE_TABLE.items():
            print(f"{code}: {', '.join(vs)}")
        return

    script = json.loads(Path(args.script).read_text())
    lines = script.get("script", [])
    vcfg = script.get("voice", {}) or {}
    voice = args.voice or vcfg.get("voice", "bm_george")
    speed = args.speed if args.speed is not None else float(vcfg.get("speed", 1.0))
    lang = vcfg.get("lang") or lang_for_voice(voice)
    lead_in = float(script.get("meta", {}).get("leadIn", 0.6))
    default_gap = float(vcfg.get("gap", 0.28))

    out = Path(args.out)
    (out / "lines").mkdir(parents=True, exist_ok=True)

    print(f"[tts] kokoro  lang={lang}  voice={voice}  speed={speed}  lines={len(lines)}", file=sys.stderr)

    from kokoro import KPipeline
    pipelines = {}

    def get_pipeline(code):
        if code not in pipelines:
            pipelines[code] = KPipeline(lang_code=code)
        return pipelines[code]

    timings, pieces = {}, []
    cursor = lead_in
    if lead_in > 0:
        pieces.append(np.zeros(int(lead_in * SR), dtype=np.float32))

    for ln in lines:
        lid, text = ln["id"], ln["text"]
        lvoice = ln.get("voice", voice)
        lspeed = float(ln.get("speed", speed))
        lcode = ln.get("lang") or lang_for_voice(lvoice, lang)

        audio = trim_silence(synth_line(get_pipeline(lcode), text, lvoice, lspeed))
        dur = audio.size / SR

        sf.write(out / "lines" / f"{lid}.wav", audio, SR)
        timings[lid] = {"start": round(cursor, 4), "dur": round(dur, 4), "end": round(cursor + dur, 4)}
        pieces.append(audio)

        gap = float(ln.get("gap", default_gap))
        if gap > 0:
            pieces.append(np.zeros(int(gap * SR), dtype=np.float32))
        cursor += dur + gap
        print(f"[tts]   {lid:<8} {dur:5.2f}s  {text[:56]}", file=sys.stderr)

    tail = float(script.get("meta", {}).get("tailOut", 0.8))
    if tail > 0:
        pieces.append(np.zeros(int(tail * SR), dtype=np.float32))

    narration = np.concatenate(pieces) if pieces else np.zeros(0, dtype=np.float32)

    # Light peak normalisation; the real loudness pass happens in ffmpeg at mux.
    peak = float(np.max(np.abs(narration))) if narration.size else 0.0
    if peak > 0:
        narration = narration * (0.89 / peak)

    sf.write(out / "narration.wav", narration, SR)
    (out / "timings.json").write_text(json.dumps(timings, indent=2))

    total = narration.size / SR
    print(f"[tts] narration.wav  {total:.2f}s", file=sys.stderr)
    print(json.dumps({"duration": round(total, 4), "timings": timings}))


if __name__ == "__main__":
    main()
