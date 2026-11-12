# Matt King — Off the Pitch

The third site, built from the same story as `../site` (Arena) and `../exposure` (Long Exposure). Nothing is shared with either at runtime: this folder has its own `package.json`, its own copies of the photos and logos, and can be lifted into its own repository as it stands.

Arena is a night at five stadiums. Long Exposure is one photograph. This one is a bright studio: five blocks cut out of five venues, set down on a seamless floor, with one red line running through all of them. A single ball follows the line and changes sport as it goes. It is the hero line taken literally: sport, off the pitch.

## Run

```sh
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in dist/, deploy anywhere
npm run preview  # serve the build
```

## The route

| # | Idea | What happens on the set |
| --- | --- | --- |
| 00 | I take sport off the pitch and into culture | A corner of a pitch, cut out like a soil sample. The ball rolls along the touchline and off the edge; where the white line stops, the red one starts. |
| 01 | The tunnel is the new runway | Through a concrete players' tunnel onto a red carpet. Press cameras flash as it passes. |
| 02 | Culture is the side door | Through a door marked CULTURE. It comes out a basketball, dribbles up onto the hardwood: three plays, one shot. |
| 03 | Fit beats size | A spiral onto the turf. Seven downs to the end zone, one per stage of how a fan is made. Eleven numbered markers for the talent rules. |
| 04 | The format is the product | Kicked through the posts, lands a tennis ball. The court redraws three times: half grass and half clay, one side 9% smaller, then padel with the walls up. |
| 05 | Story before sport | Grows into a slick tyre, up the kerb, lights out, down a grid of seven markets, into the pit box. |
| — | Five sports, one way of thinking | The tyre rolls in beside the other four. |

After the line, the page carries on as plain sections: plays worth stealing, the record, who Matt has worked with, in the stands, press, and booking.

## Colour and type

| Role | Value | Where |
| --- | --- | --- |
| Chalk | `#ece8df` | The studio and the page |
| Ink | `#141412` | Type, the record section |
| Red | `#e2231a` | The line, the italic word in each headline, the booking section |

Each surface brings its own colour (pitch green, maple, turf, clay, padel blue, tarmac), so the page itself stays to three.

Headlines pair two faces on purpose. Sport is set in a tight condensed sans (Instrument Sans at 76% width, upper case). The word that carries the idea is set in a fashion italic (Bodoni Moda). Labels are DM Mono. All three ship in the bundle via Fontsource.

## Layout

| Path | What it is |
| --- | --- |
| `index.html` | The page shell: loader, header, index, and the static sections |
| `src/content.js` | Everything editable: the hero, five chapters, plays, the brief, the fan journey, eleven talent rules, formats, markets, the record, who Matt has worked with, press, booking |
| `src/render.js` | Turns `content.js` into markup, including the story beats |
| `src/main.js` | Behaviour: loader, scroll to story position, header, index, reveals, counters, photo strip |
| `src/gl/studio.js` | Renderer, softbox lighting, shadow-only floor, ambient occlusion, depth of field, tone map |
| `src/gl/ball.js` | The hero object: one mesh whose profile and skin morph between football, basketball, American football, tennis ball and tyre |
| `src/gl/surfaces.js` | Every texture, drawn in code at start-up: grass, maple, clay, tarmac, concrete, carpet, the cut faces of the slabs, and the paint masks. Also the instanced grass |
| `src/gl/props.js` | Set pieces: corner flag, tunnel, red carpet and press, the side door, hoop, goalposts, markers, net, padel cage, start lights, kerb |
| `src/gl/world.js` | Where everything stands, the ball's path, and the red line |
| `src/gl/director.js` | The list of story beats: where the ball is, where the camera stands, what the set is doing |
| `src/styles/site.css` | All styling, with the phone layout behind one breakpoint at the end |
| `public/photos`, `public/logos` | Photos and single-colour logo masks (copied from Long Exposure) |
| `dev/`, `look.html` | Look-dev harness and screenshot scripts used while building. Not part of the site |

## How it behaves

- **Scrolling is native.** Nothing is hijacked or snapped. Each block of copy in the page is a beat; when a beat is in the middle of the screen the 3D stage is at that beat's frame, and it holds there for a moment before moving on.
- **The words never sit on a busy picture.** Titles are composed onto empty studio; body copy sits on a placard.
- **One line.** The white pitch markings and the red line both draw themselves in. The red line is laid over whatever the ball's path crosses, including down the cut face of each slab.
- **No model files.** Every object is built in code and every texture is drawn at start-up, so the whole stage is in the JavaScript bundle.
- **Quality steps down by itself.** Three tiers (high, mid, low) picked from the device, then stepped down further if frames run slow: lens blur first, then resolution, then ambient occlusion samples.
- **Fallbacks.** Without WebGL the page runs as a normal long read on its plain background. With reduced motion set, reveals are instant and the opening build is skipped; the stage still follows the scroll because the reader is the one moving it.

## Changing things

- **Copy, numbers, names, photos:** `src/content.js`.
- **A camera angle or where a beat happens:** the `BEATS` list at the top of `src/gl/director.js`. `p`/`l` are world positions for camera and target; `r`/`lr` are offsets from the ball. `side` moves the subject left or right to leave room for the words.
- **The ball's route:** `buildPath()` in `src/gl/world.js`. Named marks along the path are what the beats refer to.
- **Markings on a surface:** the `paintMask(...)` call for that slab in `src/gl/world.js`.

## Notes

- Review switches: `?tier=high|mid|low`, `?at=<beat id>` jumps to a beat (ids are in `director.js`), `?nogl` forces the no-WebGL fallback, `?still` forces reduced motion, `?nodegrade` stops quality stepping down, `?debug` exposes `__mk`.
- `og:image` points at `./og.jpg`. Once this has its own domain, make that an absolute URL and add `og:url` and a canonical link.
- Two lines of framing copy are new to this site and not from the earlier ones: "One line, five sports. It starts where the pitch stops." and "The ball changes. The idea underneath it does not." Both are in `content.js` (`PREMISE.note`, `LINEUP.note`).
- The tyre's sidewall reads "OFF THE PITCH" and "MK · 17", and the corner flag carries 17. No third-party marks appear on any 3D object.
