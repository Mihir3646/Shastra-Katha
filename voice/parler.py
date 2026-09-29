#!/usr/bin/env python3
"""
AI4Bharat Indic Parler-TTS — the channel's narration voice.

Built at IIT Madras for 21 Indian languages, so Hindi is the target rather than
an afterthought. Apache-2.0, runs locally, no per-use cost.

The voice is set by a PLAIN-LANGUAGE DESCRIPTION rather than a fixed preset, so
the delivery is tunable in words: pace, warmth, authority, recording quality.

Contract matches voice/tts.py exactly:
    lines/<id>.wav   narration.wav   timings.json

Runs in its own venv (voice/.venv-parler): parler-tts pins transformers 4.46.1,
which collides with everything else in the main env.
"""
import argparse, hashlib, json, os, re, sys
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent

# Named voices. These are descriptions, not presets — edit the words to change
# the read. "Very clear audio" matters: without it the model adds room noise.
VOICES = {
    "aman-deep":   "Aman speaks with a deep, steady and authoritative voice at a slow pace, "
                   "like a nature documentary narrator. Very clear audio with no background noise.",
    "aman-warm":   "Aman speaks with a deep, warm and friendly voice at a moderate pace, "
                   "with gentle expression. Very clear audio with no background noise.",
    "rohit-calm":  "Rohit speaks slowly with a calm, warm and measured tone, like a documentary "
                   "narrator. Very clear audio with no background noise.",
    "divya-warm":  "Divya speaks slowly with a warm, gentle and expressive tone. "
                   "Very clear audio, studio quality, no background noise.",
}
DEFAULT_VOICE = "aman-deep"


def load_env():
    for name in (".env.local", ".env"):
        p = ROOT / name
        if not p.exists():
            continue
        for line in p.read_text().splitlines():
            m = re.match(r"^\s*([A-Z0-9_]+)\s*=\s*(.*)$", line)
            if m and not os.environ.get(m.group(1)):
                os.environ[m.group(1)] = m.group(2).strip().strip("\"'")


def trim_silence(a, sr, thresh=0.004, keep=0.05):
    """Trim only true silence at the ends; the script's `gap` sets the pauses."""
    if a.size == 0:
        return a
    idx = np.where(np.abs(a) > thresh)[0]
    if idx.size == 0:
        return a
    pad = int(keep * sr)
    return a[max(0, idx[0] - pad): min(a.size, idx[-1] + pad)]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--script")
    ap.add_argument("--out")
    ap.add_argument("--voice", default=None)
    ap.add_argument("--list-voices", action="store_true")
    args = ap.parse_args()

    if args.list_voices:
        for k, v in VOICES.items():
            print(f"{k}{'   <- default' if k == DEFAULT_VOICE else ''}\n    {v}\n")
        return
    if not args.script or not args.out:
        ap.error("--script and --out are required")

    load_env()
    script = json.loads(Path(args.script).read_text())
    lines = script.get("script", [])
    vcfg = script.get("voice", {}) or {}
    meta = script.get("meta", {}) or {}

    voice_key = args.voice or vcfg.get("parlerVoice") or DEFAULT_VOICE
    description = vcfg.get("description") or VOICES.get(voice_key) or VOICES[DEFAULT_VOICE]
    lead_in = float(meta.get("leadIn", 0.6))
    tail_out = float(meta.get("tailOut", 0.8))
    default_gap = float(vcfg.get("gap", 0.28))

    out = Path(args.out)
    (out / "lines").mkdir(parents=True, exist_ok=True)
    cache = ROOT / ".cache" / "parler"
    cache.mkdir(parents=True, exist_ok=True)

    print(f"[parler] voice={voice_key}  lines={len(lines)}", file=sys.stderr)
    print(f"[parler] {description}", file=sys.stderr)

    import torch
    from transformers import AutoTokenizer
    from parler_tts import ParlerTTSForConditionalGeneration

    MODEL = "ai4bharat/indic-parler-tts"
    dev = "mps" if torch.backends.mps.is_available() else "cpu"
    model = ParlerTTSForConditionalGeneration.from_pretrained(MODEL).to(dev)
    tok = AutoTokenizer.from_pretrained(MODEL)
    desc_tok = AutoTokenizer.from_pretrained(model.config.text_encoder._name_or_path)
    sr = model.config.sampling_rate

    desc_in = desc_tok(description, return_tensors="pt").to(dev)

    timings, pieces = {}, []
    cursor = lead_in
    if lead_in > 0:
        pieces.append(np.zeros(int(lead_in * sr), dtype=np.float32))

    fresh = cached = 0
    for ln in lines:
        lid, text = ln["id"], ln["text"]
        key = hashlib.sha256(json.dumps([MODEL, description, text]).encode()).hexdigest()[:20]
        cpath = cache / f"{key}.wav"

        if cpath.exists():
            audio, _ = sf.read(cpath, dtype="float32")
            cached += 1
        else:
            pin = tok(text, return_tensors="pt").to(dev)
            with torch.no_grad():
                gen = model.generate(
                    input_ids=desc_in.input_ids, attention_mask=desc_in.attention_mask,
                    prompt_input_ids=pin.input_ids, prompt_attention_mask=pin.attention_mask)
            audio = gen.cpu().numpy().squeeze().astype(np.float32)
            sf.write(cpath, audio, sr)
            fresh += 1

        audio = trim_silence(audio, sr)
        sf.write(out / "lines" / f"{lid}.wav", audio, sr)
        dur = audio.size / sr
        timings[lid] = {"start": round(cursor, 4), "dur": round(dur, 4), "end": round(cursor + dur, 4)}
        pieces.append(audio)

        gap = float(ln.get("gap", default_gap))
        if gap > 0:
            pieces.append(np.zeros(int(gap * sr), dtype=np.float32))
        cursor += dur + gap
        print(f"[parler]   {lid:<8} {dur:5.2f}s {'(cached)' if cpath.exists() and not fresh else '        '} {text[:46]}",
              file=sys.stderr)

    if tail_out > 0:
        pieces.append(np.zeros(int(tail_out * sr), dtype=np.float32))

    narration = np.concatenate(pieces) if pieces else np.zeros(0, dtype=np.float32)
    peak = float(np.max(np.abs(narration))) if narration.size else 0.0
    if peak > 0:
        narration = narration * (0.89 / peak)

    sf.write(out / "narration.wav", narration, sr)
    (out / "timings.json").write_text(json.dumps(timings, indent=2))

    print(f"[parler] {fresh} generated, {cached} cached", file=sys.stderr)
    print(f"[parler] narration.wav  {narration.size / sr:.2f}s", file=sys.stderr)
    print(json.dumps({"duration": round(narration.size / sr, 4), "timings": timings}))


if __name__ == "__main__":
    main()
