#!/usr/bin/env python3
"""
Generate an original ambient music bed.

Nothing is sampled and nothing is copied, so the output is yours outright —
no attribution, no library subscription, no content-ID risk. Three styles:

    tanpura   four-string drone, the classic meditation/bhajan bed
    pad       slow evolving chord wash, good under narration
    chimes    sparse bell phrases over a soft drone

    python tools/make-music.py --style tanpura --key C# --minutes 1.5 \
        --out assets/music/bed.wav
"""
import argparse, math
import numpy as np

SR = 44100

NOTES = {'C':0,'C#':1,'Db':1,'D':2,'D#':3,'Eb':3,'E':4,'F':5,'F#':6,'Gb':6,
         'G':7,'G#':8,'Ab':8,'A':9,'A#':10,'Bb':10,'B':11}


def hz(name, octave=3):
    """Note name -> frequency, A4 = 440."""
    return 440.0 * 2 ** ((NOTES[name] + (octave - 4) * 12 - 9) / 12.0)


def pluck(freq, dur, amp=1.0, harmonics=14, decay=2.6, shimmer=0.004, seed=0):
    """Additive pluck with slightly detuned partials — a string, not a sine."""
    rng = np.random.default_rng(seed)
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for h in range(1, harmonics + 1):
        # Real strings are slightly inharmonic; that is what makes them sing.
        f = freq * h * (1 + 0.0004 * h * h)
        f *= 1 + rng.normal(0, shimmer)
        a = amp / (h ** 1.35)
        env = np.exp(-t * (decay + h * 0.32))
        out += a * env * np.sin(2 * np.pi * f * t + rng.uniform(0, 6.28))
    # Gentle attack so it does not click
    atk = np.minimum(1.0, t / 0.012)
    return out * atk


def drone(freq, dur, amp=0.5, seed=0):
    """Slow-beating sustained tone built from a few detuned voices."""
    rng = np.random.default_rng(seed)
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for i, det in enumerate([-0.07, 0.0, 0.06, 0.11]):
        f = freq * (1 + det / 100)
        lfo = 1 + 0.0015 * np.sin(2 * np.pi * (0.07 + i * 0.013) * t + rng.uniform(0, 6.28))
        for h, ha in [(1, 1.0), (2, 0.34), (3, 0.16), (4, 0.07), (5, 0.035)]:
            out += (amp * ha / 4) * np.sin(2 * np.pi * f * h * t * lfo)
    return out


def soft_reverb(x, mix=0.34):
    """Cheap Schroeder-ish tail: a few delays, low-passed. Plenty for a bed."""
    out = x.copy()
    for delay_ms, g in [(37, 0.34), (61, 0.28), (89, 0.23), (127, 0.18), (193, 0.13)]:
        d = int(SR * delay_ms / 1000)
        tail = np.zeros_like(x)
        tail[d:] = x[:-d] * g
        # one-pole low-pass so the tail darkens as it decays
        b = 0.28
        for _ in range(2):
            tail = np.convolve(tail, [b, 1 - b], mode='same')
        out += tail * mix
    return out


def lowpass(x, cutoff=3800):
    """Single-pole LPF — takes the digital edge off."""
    a = math.exp(-2 * math.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(x.size):
        acc = (1 - a) * x[i] + a * acc
        y[i] = acc
    return y


def build_tanpura(root, minutes, seed=7):
    dur = minutes * 60
    n = int(dur * SR)
    out = np.zeros(n)
    sa = hz(root, 3)
    pa = sa * 3 / 2          # fifth
    sa_hi = sa * 2
    # The classic four-string cycle: Pa, Sa, Sa, Sa(low)
    cycle = [pa, sa_hi, sa_hi, sa]
    step = 1.05              # seconds between plucks
    i, k = 0, 0
    while i * step < dur - 4:
        f = cycle[k % len(cycle)]
        p = pluck(f, 4.2, amp=0.38 if k % 4 else 0.46, decay=1.15, seed=seed + k)
        s = int(i * step * SR)
        e = min(n, s + p.size)
        out[s:e] += p[:e - s]
        i += 1; k += 1
    out += drone(sa / 2, dur, amp=0.10, seed=seed)
    return out


def build_pad(root, minutes, seed=11):
    dur = minutes * 60
    n = int(dur * SR)
    out = np.zeros(n)
    base = hz(root, 3)
    # i - VI - III - VII, a calm modal loop that never resolves anywhere final
    prog = [[0, 3, 7], [-4, 0, 3], [-9, -5, 0], [-2, 2, 5]]
    bar = dur / max(1, (minutes * 4))
    for b in range(int(dur / bar) + 1):
        ch = prog[b % len(prog)]
        s = int(b * bar * SR)
        seg = int(min(bar * 1.9, (dur - b * bar)) * SR)
        if seg <= 0:
            break
        t = np.arange(seg) / SR
        env = np.minimum(t / 1.6, 1.0) * np.exp(-np.maximum(0, t - bar * 0.7) / 2.2)
        for j, semi in enumerate(ch):
            f = base * 2 ** (semi / 12)
            for h, ha in [(1, 1.0), (2, 0.3), (3, 0.12), (4, 0.05)]:
                out[s:s + seg] += 0.10 * ha * env * np.sin(
                    2 * np.pi * f * h * t + j * 1.7 + h * 0.4)
    out += drone(base / 2, dur, amp=0.07, seed=seed)
    return out


def build_chimes(root, minutes, seed=5):
    dur = minutes * 60
    n = int(dur * SR)
    out = drone(hz(root, 2), dur, amp=0.13, seed=seed)
    rng = np.random.default_rng(seed)
    scale = [0, 2, 4, 7, 9, 12, 14, 16]   # major pentatonic-ish, always consonant
    base = hz(root, 5)
    t = 1.5
    while t < dur - 5:
        semi = scale[rng.integers(0, len(scale))]
        f = base * 2 ** (semi / 12)
        p = pluck(f, 4.5, amp=rng.uniform(0.10, 0.20), harmonics=9, decay=0.85,
                  seed=int(rng.integers(0, 10**6)))
        s = int(t * SR); e = min(n, s + p.size)
        out[s:e] += p[:e - s]
        t += rng.uniform(1.3, 3.2)
    return out


BUILDERS = {'tanpura': build_tanpura, 'pad': build_pad, 'chimes': build_chimes}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--style', default='tanpura', choices=sorted(BUILDERS))
    ap.add_argument('--key', default='C#')
    ap.add_argument('--minutes', type=float, default=1.5)
    ap.add_argument('--out', default='assets/music/bed.wav')
    ap.add_argument('--seed', type=int, default=7)
    ap.add_argument('--gain', type=float, default=0.72, help='peak after normalise')
    args = ap.parse_args()

    if args.key not in NOTES:
        raise SystemExit(f'unknown key {args.key!r}; try one of {", ".join(sorted(NOTES))}')

    x = BUILDERS[args.style](args.key, args.minutes, args.seed)
    x = soft_reverb(x, mix=0.32)
    x = lowpass(x, 4200)

    # Fade the ends so it loops and starts cleanly
    fade = int(SR * 2.0)
    x[:fade] *= np.linspace(0, 1, fade)
    x[-fade:] *= np.linspace(1, 0, fade)

    peak = np.max(np.abs(x)) or 1.0
    x = x / peak * args.gain

    # Slight stereo spread: delay one side a few milliseconds.
    d = int(SR * 0.011)
    left = x
    right = np.concatenate([np.zeros(d), x[:-d]])
    stereo = np.stack([left, right], axis=1)

    import soundfile as sf
    sf.write(args.out, stereo.astype(np.float32), SR)
    print(f'{args.out}  {args.style}  key={args.key}  {x.size / SR:.1f}s')


if __name__ == '__main__':
    main()
