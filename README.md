# Amrutha Haridas — Portfolio

A premium single-page developer portfolio. Black luxury theme, deep red accent
(`#C1121F`), glassmorphism, aurora background, WebGL particle field, and
scroll-driven animation throughout.

**Stack:** HTML5 · Tailwind CSS · Vanilla JavaScript · GSAP + ScrollTrigger ·
AOS · Three.js · Typed.js · Particles.js

---

## Quick start

No build step. No dependencies to install.

```bash
# Open directly
start index.html            # Windows

# Or serve it (recommended — some browsers restrict file:// requests)
npx serve .
python -m http.server 8000
```

Then visit `http://localhost:8000`.

---

## Before you publish — 3 things to do

### 1. Add your photo

Save your portrait as **`assets/images/profile.jpg`** (4:5 ratio, under 250 KB).
Until it exists, a formal silhouette placeholder is shown automatically.
See [`assets/images/README.md`](assets/images/README.md).

### 2. Add your resume

Save it as **`assets/resume/Amrutha-Haridas-Resume.pdf`**.
See [`assets/resume/README.md`](assets/resume/README.md).

### 3. Contact details — already done ✓

All contact details are set to real values in **one file** —
[`assets/js/config.js`](assets/js/config.js):

```js
email:     'amruthaalayattil@gmail.com',
phone:     '+91 99468 65197',
linkedin:  'https://www.linkedin.com/in/amrutha-haridas-71533a257/',
github:    'https://github.com/Amruthaaa-dev',
instagram: 'https://www.instagram.com/amrutha_______haridas',
```

Edit that file and every link on the page updates — hero socials, mobile menu,
contact cards, footer and the contact form's submit target.

> **Keep the `https://` prefix** on the three profile URLs. Without a scheme the
> browser treats the value as a relative path, and the link resolves to a file
> on your own site instead of the external profile.

Also update the domain in `index.html` (`<link rel="canonical">`, the Open Graph
`og:url` / `og:image` tags), plus `robots.txt` and `sitemap.xml`.

---

## Project structure

```
amrutha-portfolio/
├── index.html                       # All markup, meta tags, JSON-LD schema
├── robots.txt
├── sitemap.xml
├── README.md
└── assets/
    ├── css/
    │   └── style.css                # Full theme — 18 documented sections
    ├── js/
    │   ├── config.js                # ▶ Contact details & links (EDIT THIS)
    │   ├── particles-config.js      # Hero particle field
    │   ├── three-bg.js              # WebGL ambient background
    │   └── main.js                  # 15 interaction modules
    ├── images/
    │   ├── profile.jpg              # ▶ Add your photo here
    │   ├── profile-placeholder.svg  # Auto-fallback
    │   └── favicon.svg
    ├── fonts/
    │   └── README.md                # Self-hosting instructions
    └── resume/
        └── Amrutha-Haridas-Resume.pdf   # ▶ Add your CV here
```

---

## Sections

| # | Section | Notes |
|---|---|---|
| — | Preloader | Progress counter, curtain wipe reveal |
| 01 | Hero | Typed headline, animated counters, floating 3D chips, tech marquee |
| 02 | About | Sticky profile card, four capability pillars |
| 03 | Experience | Scroll-drawn timeline, three roles |
| 04 | Tech Stack | 19 floating 3D tiles + animated skill bars |
| 05 | Services | 6 offerings |
| 06 | Achievements | Animated counters + highlight cards |
| 07 | Contact | Validated form (mailto handoff) + contact channels |
| — | Footer | Sitemap, socials, back-to-top |

---

## Customization

### Change the accent colour

Two places, both one-line edits:

```css
/* assets/css/style.css */
:root { --blood: #C1121F; --blood-light: #E63946; --blood-dark: #780016; }
```

```js
/* index.html — tailwind.config */
blood: { DEFAULT: '#C1121F', light: '#E63946', dark: '#780016' }
```

### Centered hero layout

The hero is a two-column layout by default. For a single centered column with
the portrait above the copy, add one class in `index.html`:

```html
<section id="hero" class="hero hero--centered">
```

### Rotating headline text

`assets/js/config.js` → `typedStrings`.

### Skill percentages

`index.html` → each `<div class="skill" data-skill="92">`. The bar and the
number both animate from that single value.

### Add a project

Copy any `<article class="project">` block. Set `data-category` to one of
`erp` / `ecommerce` / `api` / `dashboard` to hook it into the filter, and add
`project--wide` for a double-width card.

### Contact form delivery

The form has two delivery paths, chosen automatically by whether
`web3formsKey` is set in `assets/js/config.js`:

| `web3formsKey` | Behaviour |
|---|---|
| empty *(current)* | Falls back to `mailto:` — opens the visitor's own mail app. Works, but silently fails for anyone on webmail with no mail client configured. |
| set | POSTs straight to your inbox via Web3Forms. No server, no backend, free, works on GitHub Pages. |

**To enable real delivery** (about a minute):

1. Go to [web3forms.com](https://web3forms.com)
2. Enter `amruthaalayattil@gmail.com` → **Create Access Key**
3. They email you a key like `a1b2c3d4-e5f6-7890-abcd-ef1234567890`
4. Paste it into `web3formsKey` in `assets/js/config.js`

Included either way: field validation before submit, a hidden `botcheck`
honeypot for spam, a disabled/"Sending…" button state, and an error path that
always shows your direct email address so an enquiry is never lost.

Prefer a different service? Replace the `fetch()` in `submitViaApi()`
(`assets/js/main.js`, module 14) with a POST to Formspree or your own Laravel
endpoint. Validation already runs before that point.

---

## Performance

- Zero image requests for the UI — every project mock, icon and graphic is
  inline SVG or pure CSS
- All third-party scripts are `defer`red; nothing blocks first paint
- WebGL: single draw call, ~900 points, capped at 1.75× DPR, **pauses when the
  tab is hidden**, and is skipped entirely on small screens or without WebGL
- Particles.js is scoped to the hero only, with reduced density on mobile
- Scroll, pointer and resize handlers are all rAF-throttled or debounced and
  registered `{ passive: true }`

### Going to production

Two optional upgrades worth doing:

1. **Replace the Tailwind CDN with a compiled build.** The CDN ships the JIT
   compiler to the browser (~120 KB). `npx tailwindcss -i in.css -o out.css --minify`
   typically lands under 15 KB for this page.
2. **Self-host the fonts** — see `assets/fonts/README.md`.

---

## Accessibility

- Skip-to-content link
- Semantic landmarks (`header` / `main` / `footer` / `nav` / `section`)
- Every section labelled via `aria-labelledby`
- Visible focus ring on all interactive elements
- Form errors announced with `aria-invalid` + a live-region status
- Mobile menu is a labelled dialog, closes on `Escape`
- **`prefers-reduced-motion` fully honoured** — WebGL, particles, tilt and
  magnetic effects all switch off; content renders in its final state

---

## Browser support

Chrome / Edge / Firefox / Safari, current and previous major versions.
Backdrop-filter, CSS grid, `aspect-ratio` and `conic-gradient` are all used.
Without WebGL the background falls back to the CSS aurora — no visual break.

---

## Deploying

Static files — host anywhere:

| Host | Steps |
|---|---|
| **Netlify** | Drag the folder onto the dashboard |
| **Vercel** | `vercel --prod` |
| **GitHub Pages** | Push, then Settings → Pages → deploy from branch root |
| **Any cPanel / VPS** | Upload to `public_html` |

Remember to update the domain in `index.html`, `robots.txt` and `sitemap.xml`.
