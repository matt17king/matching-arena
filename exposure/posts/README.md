# Writing

One file per article. The build (`node tools/pages.mjs`, run by `npm run build`) finds every file here and:

- builds the article at `/writing/<slug>/`, in the same design as the idea pages
- lists it on `/writing/` (newest first, filterable by topic)
- shows the three newest on the home page
- if it connects to one of the three ideas, lists it on that idea's page
- adds it to `public/sitemap.xml` and `public/feed.xml` (RSS)

## Adding one

1. Copy `_template.js` to `YYYY-MM-DD-the-slug.js` (the date is the publish date; files starting with `_` are ignored).
2. Fill it in. `topic` is `Sport`, `Marketing` or `Culture`. `idea` is optional: `dormant-demand`, `the-side-door`, `idols-sell-influencers-inform`, or `null` when it doesn't fit one.
3. Photos go in `public/photos/`. Use plain words and short sentences.
4. Run `npm run build` from `exposure/` and check it on the preview before it goes live.

## Blocks

The body is a list of blocks, so articles are laid out, not one block of text:

| Block | Example |
| --- | --- |
| heading | `['h', 'Where people really watch']` |
| paragraph | `['p', 'Text, may hold <em>, <strong> and <a>.']` |
| pull quote | `['q', 'A line worth quoting.']` |
| list | `['list', ['one', 'two']]` |
| numbered steps | `['steps', [['Title', 'Detail'], ...]]` |
| big number | `['stat', ['+600%', 'Reach, with Molly-Mae Hague and Phil Foden', 'The Couture Club']]` |
| callout box | `['callout', ['The takeaway', 'One or two sentences.']]` |
| photo | `['img', ['file.jpg', 'Caption', 'Alt text']]` |

Links inside an article are written from `/writing/<slug>/`, so another article is `../the-slug/`, an idea is `../../thinking/dormant-demand/`, and the home page is `../../`.
