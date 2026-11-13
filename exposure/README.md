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
| `index.html` | The story: header, index, and the static sections |
| `book/index.html` | The booking page |
| `world/index.html` | The virtual world: the penthouse, room by room |
| `src/world/` | The virtual world: `rooms.js` lists the rooms and what is in them, `main.js` is the arrows, markers and cards |
| `public/rooms/` | The room pictures |
| `src/kit.js` | Shared by both pages: fonts and styles, helpers, the three colour themes, word splitting, the panned-blur headline, grain |
| `src/book.js` | The booking page: the four questions, the pass, the written brief, the email hand-off |
| `src/content.js` | Everything editable: the fan journey, the five frames (each with its photo), plays, the brief, eleven talent rules, formats, markets, how I work, the record, who Matt has worked with, press, booking |
| `src/render.js` | Turns `content.js` into markup |
| `src/main.js` | The story's behaviour: scroll scenes, reveals, the court, the photo strip, the index |
| `src/gl/field.js` | The WebGL layer behind the page: the cursor's light trail, the grainy red and blue fields, and every photo that arrives out of the blur |
| `src/styles/site.css` | All styling, with the phone layout behind one breakpoint at the end |
| `public/photos`, `public/logos` | Photos (copied from Arena) and logos converted to single-colour masks so they take the page's ink colour |

## How it behaves

- **Scrolling is native.** Nothing is hijacked or snapped. Pinned scenes (the idea, the fan journey, each frame's title card, the three plays, the brief, the eleven rules, the court, the seven markets, the photo strip, the press stories) read the scroll position and ease toward it.
- **The field** is one fullscreen shader: slow red and blue light with grain. A feedback buffer keeps the last frames of the cursor (or a tap), so it leaves a trail that decays like a long exposure. Nothing else moves on its own.
- **Photos arrive out of the blur.** The page only marks where a photo sits; the field draws it in the black-and-blue print with a leak of the page's red light. The portrait in the opening frame resolves on arrival and smears away as you scroll. Each frame's title card is pinned for a moment while its photo streaks in and settles sharp beside the title. Hovering an idea in the list holds its photo up beside the cursor.
- **Hold and reveal.** The three plays resolve one per scroll step (two names start as a double exposure, slide apart into focus, then the outcome lands). The brief builds itself a question at a time. The eleven rules turn over with the scroll; clicking one moves the page to it.
- **Press.** Each piece of coverage in "In the press" holds for a screen: the publication and date on a line, then the headline, which arrives out of focus. The words that matter (`key` in `content.js`) come sharp first, in italics, then the rest, then the one line of copy, while the photo streaks in beside it; once everything is sharp the key words are lit from behind. `ar` is the photo's shape (width ÷ height).
- **Seven markets** (frame 05) is a wheel of names that follows the scroll and settles on one market, which comes into focus.
- **Proof sits beside the idea it proves.** Where one of the record's numbers belongs to a frame's story, it appears there as a card (`stat` in `content.js`), as well as in the record.
- **Focus** is the recurring device. Headlines arrive with a horizontal (panned) blur and settle. The opening statement sharpens word by word as you scroll. Lists sharpen whatever is nearest the middle of the screen. Photos sit in a black and powder blue print until you hover, focus or tap them.
- **The fan journey and the photo strip settle.** Both follow the scroll while it moves and come to rest on the nearest stage or photo when it stops.
- **The photo strip** in "In the stands" is drawn in WebGL with a light directional blur tied to its speed. Scroll or drag it, or click a photo to either side; when the page stops, the strip settles on the nearest photo and that photo develops into colour.
- **Fallbacks.** Without WebGL the page runs on its CSS background and the strip becomes a normal scrolling row. With reduced motion set, reveals are instant and the field holds still.

## The booking page

`book/` is a second page in the same build. Instead of a contact form it asks four questions (what, about what, where and when, who) and does three things with the answers:

- **The pass.** A booking pass hangs from a woven lanyard beside the form and prints each answer as it is given: a three-letter code for the booking type, a date block, topics stuck on as stickers, the asker's initials, and a tear-off stub with a barcode drawn from the answers. It is a damped pendulum: scrolling shoves it, it leans toward the pointer, and it can be grabbed and flung (on a phone, tilting the device moves the light). When all four questions have an answer it is stamped "Ready to send". Everything inside is sized from one variable, `--pw`.
- **The brief.** The answers are written out as one sentence. Parts not yet answered stay in the sentence, soft and out of focus, until they are.
- **The hand-off.** "Send it to Matt" is a `mailto:` link with the subject and the brief filled in, so it opens the visitor's own email app. There is no server and nothing is stored. "Copy the brief" puts the same text on the clipboard.

The six routes and six topics come from `SEATS` and `TOPICS` in `content.js` (each topic is a plain-words title plus the line that goes with it); `BOOK` holds how each route reads on the pass and in the sentence. On the home page, "Pull up a chair" lists what can be booked beside a copy of the pass, which prints whichever one is pointed at (and runs through them when left alone). Those rows link to `book/?for=<key>` and the topic cards to `book/?topic=<n>`, so the booking page opens with that choice already made. The line under the header fills as the brief does.

## The virtual world

`world/` is a third page: Matt's penthouse, one picture per room (living room, office, wardrobe, gym, rooftop, garage). No 3D and no extra libraries; it is pictures, markers and a little script.

- **The rooms** are the list in `src/world/rooms.js`, in walking order. Each names its picture in `public/rooms/` (2000 × 1116; a different shape needs `IW`/`IH` changed at the top of `src/world/main.js`). To add a room, drop the picture in and add an entry.
- **Arrows** at either side (a circle that opens into "Enter Office" on hover) go to the next and previous room (the list wraps), as do the left and right arrow keys and the room names along the bottom. The address keeps the room (`world/#office`).
- **Markers** are each room's `things`: a position as a percentage across and down the picture, a hover name, and the card it opens (small line, title, words, and optionally a number, a photo from `public/photos/` and a link). To move a marker, change its `at`.
- **Photos in cards** are shown whole, at their own shape: an upright photo stands beside the words, a wide one sits above them.
- **Small screens** show the picture at full height and let it be dragged sideways; each room's `focus` is where it starts.

The story links to it from the footer and the index. The page opens straight into the living room; there is no title screen.

## Notes

- Fonts (Inter Tight, Geist, Geist Mono) ship in the bundle via Fontsource; nothing loads from a third party at runtime.
- Review switches: `?nogl` forces the no-WebGL fallback, `?still` forces reduced motion, `?debug` exposes `__mk` (pins, `go(id)`).
- `og:image` points at `./og.jpg`. Once this has its own domain, make that an absolute URL and add `og:url` and a canonical link.
- The logo masks were made from the Arena logo files; to add one, drop a transparent PNG whose alpha is the mark into `public/logos` and reference it in `content.js`.
