# Matt King — Long Exposure

A second, separate site built from the same story as the Arena site in `../site`. Nothing in `../site` is touched or shared at runtime: this folder has its own `package.json`, its own copies of the photos and logos, and can be lifted into its own repository as it stands.

Where Arena is a night at five stadiums, this one is a single long-exposure photograph. Sport is the blur; the idea is the part that stays sharp. Everything that moves leaves light behind it, and things come into focus when you stop.

## Run

```sh
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in dist/, deploy anywhere
npm run preview  # serve the build
```

## Colour

Three colours, in this order of weight:

| Role | Colour | Where |
| --- | --- | --- |
| Primary | Raven black `#090303` | Most of the page |
| Secondary | Powder blue `#b6dff8` | The idea, frame 03, plays worth stealing, in the stands, the index |
| Accent | Poppy red `#e20b21` | Light in the field, emphasis, buttons, the footer |

Two helpers are derived from those and used only for legibility: `ice` (`#f3f8fc`, powder blue pushed almost to white, for type on black) and `glow` (powder blue's hue with the white taken out, for blue light falling off into black). All of it is set in one place: `THEMES` in `src/main.js`, mirrored by the defaults at the top of `src/styles/site.css`.

## Layout

| Path | What it is |
| --- | --- |
| `index.html` | The page shell: header, index, and the static sections |
| `src/content.js` | Everything editable: the five frames, plays, the brief, the fan journey, eleven talent rules, formats, markets, the record, who Matt has worked with, press, booking |
| `src/render.js` | Turns `content.js` into markup |
| `src/main.js` | Behaviour: themes, scroll scenes, reveals, the court, the photo strip, the index |
| `src/gl/field.js` | The WebGL layer behind the page: the cursor's light trail, the grainy red and blue fields, and the photo strip |
| `src/pitches.js` | The five playing surfaces as line drawings |
| `src/styles/site.css` | All styling, with the phone layout behind one breakpoint at the end |
| `public/photos`, `public/logos` | Photos (copied from Arena) and logos converted to single-colour masks so they take the page's ink colour |

## How it behaves

- **Scrolling is native.** Nothing is hijacked or snapped. Pinned scenes (the idea, each frame's title card, the fan journey, the court, the photo strip) read the scroll position and ease toward it.
- **The field** is one fullscreen shader: slow red and blue light with grain. A feedback buffer keeps the last frames of the cursor (or a tap), so it leaves a trail that decays like a long exposure. Nothing else moves on its own.
- **Each frame's title card is pinned for a moment** while its playing surface is drawn in line behind the title, boundary first, tipping back into perspective as it goes: a football pitch, a basketball court, a gridiron, a tennis court, a circuit. The same drawings appear small in the contact sheet. They live in `src/pitches.js`.
- **Focus** is the recurring device. Headlines arrive with a horizontal (panned) blur and settle. The opening statement sharpens word by word as you scroll. Lists sharpen whatever is nearest the middle of the screen. Photos sit in a black and powder blue print until you hover, focus or tap them.
- **The photo strip** in "In the stands" is drawn in WebGL with a light directional blur tied to its speed. Scroll or drag it, or click a photo to either side; when the page stops, the strip settles on the nearest photo and that photo develops into colour.
- **Fallbacks.** Without WebGL the page runs on its CSS background and the strip becomes a normal scrolling row. With reduced motion set, reveals are instant and the field holds still.

## Notes

- Fonts (Inter Tight, Geist, Geist Mono) ship in the bundle via Fontsource; nothing loads from a third party at runtime.
- Review switches: `?nogl` forces the no-WebGL fallback, `?still` forces reduced motion, `?debug` exposes `__mk` (pins, `go(id)`).
- `og:image` points at `./og.jpg`. Once this has its own domain, make that an absolute URL and add `og:url` and a canonical link.
- The logo masks were made from the Arena logo files; to add one, drop a transparent PNG whose alpha is the mark into `public/logos` and reference it in `content.js`.
