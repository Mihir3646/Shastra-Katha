# Artwork

Image files in this folder are **deliberately not committed**. `.gitignore`
excludes `*.png` here.

This repository is public. Committing an image also redistributes it, so
nothing goes in until we can name its source and licence.

## Files the build expects

| File | Used by | Status |
|---|---|---|
| `vastu-purusha.png` | `episodes/rasoi-disha/chapters/03-vastupurush.js` | **rights unconfirmed** |

## Before this is used in a monetised upload

`vastu-purusha.png` was supplied by hand. It carries no EXIF author or
copyright tag and no recorded download origin, so its provenance cannot be
established from the file itself. One of these needs to be true:

- it is original work, or
- it is out of copyright and the specific reproduction is also free to use, or
- it is licensed for commercial reuse, and the licence terms are recorded here.

Traditional Vāstupuruṣa imagery is old, but a *particular modern drawing,
scan or print* of it is usually still covered by copyright in its own right.
Age of the subject does not carry over to the rendering.

If none of the above can be confirmed, `engine/vastupurusha.js` draws the
figure procedurally and is used as the fallback.
