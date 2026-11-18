// Copy to posts/YYYY-MM-DD-the-slug.js. Files starting with _ are not published. See posts/README.md.
export default {
  slug: 'the-slug',                    // the address: /writing/the-slug/
  date: '2026-01-01',                  // publish date
  topic: 'Sport',                      // Sport | Marketing | Culture
  title: 'The title in plain words',   // used for the browser tab, search results and cards
  h1: 'The title, with the <em>key words</em> picked out.',
  dek: 'One or two sentences that say what the piece argues. Shown under the title and in search results.',
  idea: null,                          // optional: dormant-demand | the-side-door | idols-sell-influencers-inform
  photo: ['goodwood.jpg', 'Caption title', 'Caption line', 'Alt text describing the photo', 'center 40%'],
  points: [                            // the short version, at the top
    'First point.',
    'Second point.',
    'Third point.',
  ],
  body: [
    ['h', 'First heading'],
    ['p', 'Paragraph.'],
    ['q', 'A line worth quoting.'],
    ['callout', ['The takeaway', 'One or two sentences.']],
  ],
};
