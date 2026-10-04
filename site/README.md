# Matt King — Arena

Production build of the **Arena v12** design (`../project/Arena v12.dc.html`): one night, five venues. Football, basketball, NFL, tennis and motorsport, with the pitch lines redrawing from sport to sport as you scroll. The trophy cabinet and press box follow it as stoppage time.

## Run

```sh
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in dist/, deploy anywhere
npm run preview  # serve the build
```

## Layout

| Path | What it is |
| --- | --- |
| `index.html` | All page markup: HUD, chapter overlays, kick-off, post-match sections |
| `src/content.js` | Everything editable: career drive, strengths XI, rights, results, contact seats, LED messages, scroll lengths |
| `src/main.js` | Scroll controller: maps scroll to match progress, scrubs overlays, runs the clock, menu, sound and intro |
| `src/engine/arena-engine.js` | The three.js world (venues, line morphs, camera, post-processing), carried over from the design |
| `src/engine/arena-sports.js` | Sport markings and circuit geometry |
| `src/engine/kickoff.js` | Dot-matrix world map intro |
| `src/engine/broadcast-gfx.js` | Canvas graphics for the in-world screens |
| `src/engine/sound.js` | Synthesised crowd, whistle and clunk (Web Audio, no files) |
| `src/styles/modernist.css` | Modernist design-system tokens |
| `public/logos`, `public/models` | Rights logos and the walk-out 3D model |

## Notes

- three.js, topojson and the world map now come from npm and ship in the bundle, so nothing loads from esm.sh or jsDelivr at runtime. Only the Archivo font comes from Google Fonts.
- Review shortcuts: `?start=walkout|basketball|nfl|tennis|motorsport` skips the intro and jumps to a venue. `?quality=high|low` overrides the automatic quality pick. (These replace the prototype's Tweaks panel.)
- Photos: put files in `public/photos/` and set the paths in `PHOTOS` in `src/content.js`. Until then the walk-out standee shows a labelled placeholder.
- `public/models/matt.glb` is 19 MB and loads after the scene is up. Compress it (e.g. `gltf-transform optimize`) before launch.
