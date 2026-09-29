#!/usr/bin/env bash
# One-time setup for paper-studio on a fresh machine.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> system tools"
command -v brew >/dev/null || { echo "install Homebrew first: https://brew.sh"; exit 1; }
brew list ffmpeg      >/dev/null 2>&1 || brew install ffmpeg
brew list python@3.12 >/dev/null 2>&1 || brew install python@3.12
brew list espeak-ng   >/dev/null 2>&1 || brew install espeak-ng

echo "==> node deps + headless chromium"
npm install
npx playwright install chromium

echo "==> local voice model (Kokoro, Apache-2.0)"
# 3.12 specifically: the ML stack has no wheels for 3.13/3.14 yet and blis
# fails to compile from source.
[ -d voice/.venv ] || /opt/homebrew/bin/python3.12 -m venv voice/.venv
./voice/.venv/bin/pip install -q --upgrade pip
./voice/.venv/bin/pip install -q kokoro soundfile numpy

echo "==> starter music beds"
mkdir -p assets/music
[ -f assets/music/bed.mp3 ] || {
  ./voice/.venv/bin/python tools/make-music.py --style tanpura --key C# --minutes 1.5 --out assets/music/_b.wav
  ffmpeg -y -v error -i assets/music/_b.wav -c:a libmp3lame -b:a 160k assets/music/bed.mp3
  rm -f assets/music/_b.wav
}

echo
echo "ready."
echo "  npm run preview -- panch-tattva"
echo "  npm run build   -- panch-tattva"
