# fonts/

The site currently loads its typefaces from Google Fonts (see the `<link>` in
`index.html`):

| Role | Family | Weights |
|---|---|---|
| Display / headings | **Sora** | 300–800 |
| Body copy | **Inter** | 300–600 |
| Code, labels, meta | **JetBrains Mono** | 400, 500 |

## Self-hosting (optional — removes a third-party request)

Self-hosting cuts one DNS lookup + TLS handshake from the critical path and
removes a privacy dependency. Worth doing before you go live.

1. Download the families from [fonts.google.com](https://fonts.google.com) or
   generate a subset at [gwfh.mranftl.com](https://gwfh.mranftl.com).
2. Drop the `.woff2` files into this folder.
3. Delete the Google Fonts `<link>` from `index.html`.
4. Add this to the top of `assets/css/style.css`:

```css
@font-face {
  font-family: 'Sora';
  src: url('../fonts/sora-variable.woff2') format('woff2-variations');
  font-weight: 300 800;
  font-display: swap;
  font-style: normal;
}

@font-face {
  font-family: 'Inter';
  src: url('../fonts/inter-variable.woff2') format('woff2-variations');
  font-weight: 300 600;
  font-display: swap;
  font-style: normal;
}

@font-face {
  font-family: 'JetBrains Mono';
  src: url('../fonts/jetbrains-mono-400.woff2') format('woff2');
  font-weight: 400;
  font-display: swap;
  font-style: normal;
}
```

5. Preload the display font in `<head>` so the hero headline never flashes:

```html
<link rel="preload" href="assets/fonts/sora-variable.woff2" as="font" type="font/woff2" crossorigin>
```

`font-display: swap` matters — it renders text in a fallback immediately rather
than leaving the hero blank while fonts download.
