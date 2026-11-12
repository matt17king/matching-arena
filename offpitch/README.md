# Matt King — The Playbook

The third site. It shares a story with `../site` (Arena) and `../exposure` (Long Exposure) but not a structure: those two are stories you scroll through, sport by sport. This one is a playbook you use. Nothing is shared with either at runtime; this folder stands alone.

## Run

```sh
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in dist/, deploy anywhere
npm run preview  # serve the build
```

## What is on the page

| Section | What it does |
| --- | --- |
| Hero | One photoreal 3D ball on a studio floor. Drag it to spin it. Tap a sport and the ball, the studio colour and the headline change together: five sports, five ideas, one screen. It cycles by itself until touched. |
| The brief machine | Three reels: a sport, what the audience already loves, a market. Set them or spin them and it writes the play: what we have, the side door, the casting rule, the local note, and the play to steal from. "Send me this brief" opens an email with the combination filled in. |
| The huddle | The eleven talent rules as a deck of cards. Tap, drag or use the arrow keys to deal. |
| The film room | Four plays worth stealing as panels; one opens at a time. |
| The record | Eight numbers that count up, the DAZN rights ticker, the route from 2021, who Matt has worked with, talent partnerships. |
| A fan first | A board of prints you can pick up and move (a swipeable row on phones). |
| Book Matt | Six questions that each open an email, speaking topics, press, contact. |

## Colour and type

Each section is one flat field of colour taken from a surface sport is played on: pitch green, clay, court blue, tennis-ball volt, with ink and paper. Headlines pair a tight condensed sans (Instrument Sans at 76% width) with a fashion italic (Bodoni Moda) for the word that carries the idea. Labels are DM Mono. All fonts ship in the bundle.

## Layout

| Path | What it is |
| --- | --- |
| `index.html` | The page shell and section headings |
| `src/content.js` | Everything editable. `IDEAS` drives the hero; `MACHINE` drives the brief machine; the rest (rules, plays, record, photos, logos, booking) is shared with the earlier sites' copy |
| `src/main.js` | All behaviour: hero state, reels, deck, panels, counters, board, nav |
| `src/hero.js` | The 3D hero: spin, sport change, studio colour |
| `src/gl/studio.js` | Renderer, softbox lighting, shadow-only floor, ambient occlusion, depth of field |
| `src/gl/ball.js` | One mesh whose shape and skin morph between football, basketball, American football, tennis ball and tyre |
| `src/styles/site.css` | All styling; the phone layout is behind one breakpoint at the end |
| `dev/` | Screenshot scripts used while building. Not part of the site |

## Notes

- **The brief machine's lines are drafts.** The per-sport "what we have" lines and the per-passion "side door" lines in `MACHINE` were written for this site in Matt's vocabulary. They are the copy most worth his edit. The casting rules and plays it quotes are his existing ones.
- Review switches: `?tier=high|mid|low`, `?nogl` (no 3D), `?still` (reduced motion).
- Without WebGL the hero keeps its colours, headline and controls and loses only the ball.
- Email links may not open inside some embedded viewers; the address is shown as text in the footer.
