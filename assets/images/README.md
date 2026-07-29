# images/

## How the portrait is chosen

`main.js` resolves the portrait at runtime, in this order:

| Priority | File | Result |
|---|---|---|
| 1 | `profile-cutout.png` | **Frameless floating portrait** — glass box removed, red bloom behind, contact shadow |
| 2 | `profile.jpg` | **Framed glass portrait** (current default) |
| 3 | `profile-placeholder.svg` | Silhouette fallback |

Nothing to configure. Drop a file in and the site picks the best one available.

Current state: **`profile-cutout.png` is present**, so the hero renders in
frameless cutout mode — the figure floats directly on the site background with
a champagne bloom behind it.

---

## Reducing the cutout's file size (recommended)

`profile-cutout.png` is **630 KB** — the single largest asset on the site.
PNG is lossless, which makes it a poor format for photographic content, but the
alpha channel rules out JPG.

**The fix is WebP** — it supports transparency *and* lossy compression, and
typically lands around 60–90 KB here (a ~90% saving) with no visible difference:

1. Go to [squoosh.app](https://squoosh.app) and drop in `profile-cutout.png`
2. Set the right-hand encoder to **WebP**, quality **~80**
3. Download and save it in this folder as `profile-cutout.webp`
4. In `assets/js/main.js`, module 15, change one line:

```js
const CUTOUT = 'assets/images/profile-cutout.webp';
```

WebP with alpha is supported in every current browser. If you want a fallback
for very old ones, keep the PNG and use a `<picture>` element instead.

---

## Replacing the cutout later

Any transparent PNG saved as `profile-cutout.png` is picked up automatically.
To make one from a new photo:

- **Windows 11 Paint** — open the photo → **Remove background** → Save as PNG
- [remove.bg](https://remove.bg) — free, one drag-and-drop
- Photoshop → Select Subject → Mask

**Save as PNG or WebP, never JPG.** JPG has no alpha channel, so a JPG "cutout"
comes back with a solid box behind it.

Crop tightly to the subject before saving — dead transparent space around the
figure makes it render smaller than its container allows.

---

## profile.jpg

```
assets/images/profile.jpg
```

Loaded in two places (hero portrait + about card).

**Recommended:**

| Property | Value |
|---|---|
| Aspect ratio | 4:5 portrait (e.g. 1200 × 1500) |
| Format | `.jpg` (or convert to `.webp` and update the two `<img src>` in `index.html`) |
| File size | Under 250 KB — compress at [squoosh.app](https://squoosh.app) |
| Framing | Head in the upper third; the CSS crops with `object-position: 50% 18%` |

The photo's own background is **kept** — the CSS only applies a light contrast
and vignette pass. To adjust the crop, edit `.portrait__img { object-position }`
in `assets/css/style.css`.

## og-image.jpg — recommended for social sharing

A 1200 × 630 preview card shown when the site is shared on LinkedIn, WhatsApp,
Twitter/X or Slack. Referenced by the Open Graph tags in `index.html`.
Until you add it, links share without a preview image.

## Files already here

- `profile-placeholder.svg` — formal studio silhouette, auto-shown until `profile.jpg` exists
- `favicon.svg` — AH monogram browser-tab icon
