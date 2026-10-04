// Everything Matt might want to edit lives here: copy, career, strengths, results, contact routes.

export const EMAIL = 'Matt17King@gmail.com';
export const LINKEDIN = 'https://linkedin.com/in/mattking17';

// Scroll length per chapter (vh). The spacer in index.html is the sum (8100vh).
export const SEGS = [['hero', 1300], ['rights', 650], ['x1', 420], ['bball', 950], ['x2', 420], ['nfl', 1150], ['x3', 420], ['tennis', 800], ['x4', 460], ['race', 1150], ['ft', 380]];
// Beat ranges inside each venue, as fractions of that venue's segment.
export const CH = { RR: [0.08, 0.9], BEATS: [0.06, 0.44], TAC: [0.5, 0.92], DRIVE: [0.03, 0.5], XI: [0.55, 0.96], COL: [0.04, 0.48], FANS: [0.52, 0.82], LAP: [0.08, 0.62], PIT: [0.66, 0.92] };
export const VENUE = { hero: '01 / 05 — FOOTBALL', rights: '01 / 05 — FOOTBALL', bball: '02 / 05 — BASKETBALL', nfl: '03 / 05 — NFL', tennis: '04 / 05 — TENNIS', race: '05 / 05 — MOTORSPORT', ft: '05 / 05 — MOTORSPORT' };

export const KIT = [
  { tag: 'DATA', title: 'Performance & data', tools: 'Google Analytics · Meta Ads Manager · Google Ads', detail: 'I put budget where it performs: social ads optimised for ROI, weekly reporting, and a clear call on what to do next.' },
  { tag: 'COMMERCE', title: 'Commerce, CRM & creative', tools: 'Klaviyo · Shopify Plus · Sprout Social · Adobe CC · Make.com', detail: 'I built the e-commerce strategy that grew online sales by 41%, with email, community and creative in-house.' },
  { tag: 'AI', title: 'AI & automation', tools: 'Claude · ChatGPT · Gemini', detail: "I build AI workflows that make teams faster without losing the idea. It's how I work every day." },
];
export const MARKETS = ['UK', 'North America', 'LATAM', 'MENA', 'South East Asia', 'Australia & NZ', 'Rest of world'];
export const GATES = [
  { z: 114, lines: ['MOST'] }, { z: 104, lines: ['SPORTS'] }, { z: 94, lines: ['MARKETING'] }, { z: 84, lines: ['SHOUTS.'], red: true },
  { z: 60, lines: ['THE BEST GIVES PEOPLE', 'A REASON TO CARE.'], kind: 'care', red: true },
];
// Photos: drop files into public/photos and set the path here (null = labelled placeholder in the 3D world).
export const PHOTOS = { walkout: null };
export const LOGOS = { 'puma': 'puma.png', 'adidas': 'adidas.png', 'la-galaxy': 'la-galaxy.png', 'fifa-world-cup': 'fifa-world-cup.png', 'national-league': 'national-league.png', 'fifa-plus': 'fifa-plus.png', 'laliga': 'laliga.png', 'arsenal': 'arsenal.png', 'man-city': 'man-city.png', 'uefa-europa-league': 'uefa-europa-league.png', 'serie-a': 'serie-a.png', 'bundesliga': 'bundesliga.png', 'uefa-champions-league': 'uefa-champions-league.png', 'fc-barcelona': 'fc-barcelona.png' };
export const RIGHTS = [
  { slug: 'fifa-plus', name: 'FIFA+', sub: '3M+ users migrated', detail: "I led FIFA's move onto DAZN. Over 3M FIFA+ fans came across, and they're still signing up." },
  { slug: 'fifa-world-cup', name: 'FIFA World Cup', sub: 'Senior · U-20 · U-17', detail: "World Cups at every level: senior, U-20, U-20 Women's and U-17." },
  { slug: 'uefa-champions-league', name: 'UEFA Champions League', sub: 'US · Canada · New Zealand', detail: 'Champions League and Europa League, positioned differently for the US, Canada and New Zealand.' },
  { slug: 'serie-a', name: 'Serie A', sub: 'UK exclusive', detail: "I lead UK marketing for DAZN's exclusive Serie A rights." },
  { slug: 'laliga', name: 'LaLiga', sub: 'Global markets', detail: 'LaLiga, planned market by market with every international office.' },
  { slug: 'bundesliga', name: 'Bundesliga', sub: 'Global markets', detail: 'Bundesliga, localised territory by territory. Same rights, different story.' },
  { slug: 'copa-sudamericana', name: 'Copa Sudamericana', sub: 'Global markets', detail: "Copa Sudamericana, taken to new audiences across DAZN's markets." },
  { slug: 'national-league', name: 'National League', sub: 'UK growth', detail: 'I designed and launched the campaign taking the National League to a wider UK audience.' },
];
// [x, z, shirt, strength, position, evidence] — offence lined up on its own 37, facing the end zone
export const XI = [
  [-12, -9.2, 1, 'Budget management', 'LT', 'I look after a seven-figure budget and decide where every pound works hardest, channel by channel.'],
  [-12, 13.8, 2, 'Rights-holder partnerships', 'TE', "I'm FIFA's lead marketing contact on the DAZN deal, and I work day to day with clubs, associations and commercial partners."],
  [-12, 9.2, 3, 'Agency & creative partners', 'RT', 'I run the creative agency relationship, including a tournament asset pipeline that never stops.'],
  [-12, -4.6, 4, 'Team building', 'LG', "I'm building the marketing team around DAZN's football arm. At 80 Four I hired and managed talent internationally."],
  [-12, 4.6, 5, 'Process design', 'RG', 'I build the processes that let campaigns land the same way, on time, in every market.'],
  [-12, 0, 6, 'Cross-functional leadership', 'C', 'Eight teams across global offices: social, email, CRM, platform, creative, SEO, paid and demand. One plan.'],
  [-14, 21.5, 7, 'Platform partnerships', 'WR', "I own DAZN's football relationships with TikTok, Instagram and Meta, end to end."],
  [-31, 0, 8, 'Multi-market growth', 'RB', 'North America, LATAM, MENA, SEA, ANZ and the rest of the world, each with its own go-to-market plan.'],
  [-20, 0, 9, 'Global go-to-market', 'QB', "I set the season-long campaign idea for DAZN's football rights worldwide. Everything else follows it."],
  [-25.5, 0, 10, 'Brand & creative direction', 'FB', "One idea, executed so it feels native in every market. That's the job."],
  [-14, -21.5, 11, 'AI workflows & automation', 'WR', 'I design the AI workflows that let teams move faster, with Claude, ChatGPT, Gemini and Make.com.'],
];
export const DRIVE = [
  { down: '1ST & 10', name: 'Gym King', years: '2021 – 2022', role: 'Social Media Executive & Influencer Manager', detail: 'Where it started. I ran every social page and brought in creators like Tom Aspinall, Ash Cain and Alex Bowen.' },
  { down: '2ND & 4', name: 'American Golf', years: '2022 – 2023', role: 'Social Media & Influencer Executive', detail: 'I grew the channels by over 400%, working with ambassadors like Niall Horan and Judy Murray.' },
  { down: '1ST & 10', name: 'The Couture Club', years: '2023 – 2024', role: 'Influencer, Ambassador & Ecommerce', detail: 'I closed Molly-Mae Hague and Phil Foden. Reach went up 600%. Online sales went up 41%.' },
  { down: '3RD & 2', name: 'Swift Agency', years: '2024 – 2025', role: 'Head of Digital Marketing', detail: 'I ran every channel for the agency and its clients: 15+ accounts, one standard.' },
  { down: '1ST & GOAL', name: '80 Four', years: '2025 – 2026', role: 'Co-founder · Head of Digital Marketing', detail: 'I co-founded a brand-elevation agency and won Crewe Alexandra FC. Fan engagement went up by more than 450%.' },
  { down: 'TOUCHDOWN', name: 'DAZN', years: '2026 –', role: 'Global Marketing Manager, Football', detail: "I set the season-long campaign idea for DAZN's football rights worldwide, from FIFA+ to Serie A." },
];

// [value, what, where]
export const TROPHIES = [
  ['3M+', 'FIFA+ fans brought onto DAZN', 'DAZN · FIFA'], ['8', 'Football rights portfolios led', 'DAZN'], ['7', 'Market zones, one go-to-market plan', 'DAZN'], ['7-fig', 'Annual budget, allocated channel by channel', 'DAZN'],
  ['+450%', 'Fan engagement, Crewe Alexandra FC', '80 FOUR'], ['+600%', 'Reach, with Molly-Mae Hague & Phil Foden', 'COUTURE CLUB'], ['+41%', 'Online sales from a rebuilt e-commerce strategy', 'COUTURE CLUB'], ['+400%', 'Channel growth with Niall Horan & Judy Murray', 'AMERICAN GOLF'],
];
// [who, line, email subject]
export const SEATS = [
  ['Rights holders & leagues', 'Taking a property into new markets, or onto a new platform.', 'Rights & leagues'],
  ['Brands & sponsors', 'Partnerships that feel native to the fans you are paying to reach.', 'Brand partnership'],
  ['Events & stages', 'Keynotes and panels on free-to-air growth and dormant demand.', 'Speaking enquiry'],
  ['Media & press', "Comment on rights, streaming and where sport's next fans are.", 'Press enquiry'],
  ['Boards & hiring', 'Senior marketing leadership across global sport.', 'Leadership role'],
  ['Agencies & founders', 'Advice on go-to-market, creators and AI workflows.', 'Advisory'],
];

export const STAT = { a: { v: '676K', n: 'Alexandra Eala', k: 676 }, b: { v: '70K', n: 'Novak Djokovic', k: 70 } };
export const SCREEN_DATA = {
  channels: ['Social', 'Email', 'CRM', 'Platform', 'Creative', 'SEO', 'Paid', 'Demand'],
  markets: ['UK', 'North America', 'LATAM', 'MENA', 'SEA', 'ANZ', 'Rest of world'],
  route: [['2021', 'GYM KING'], ['2022', 'AMERICAN GOLF'], ['2023', 'COUTURE CLUB'], ['2024', 'SWIFT'], ['2025', '80 FOUR'], ['2026', 'DAZN']],
};
// LED ribbon messages around the venues
export const MESSAGES = {
  identity: ['MATT KING', 'MARKETER', 'BUILDER', 'FOUNDER', 'STORYTELLER'],
  principles: ['CONCEPT FIRST', 'LOCAL WINS GLOBALLY', 'PLATFORMS ARE PARTNERS'],
  rights: ['FIFA+', 'FIFA WORLD CUP', 'UEFA CHAMPIONS LEAGUE', 'SERIE A', 'LALIGA', 'BUNDESLIGA', 'COPA SUDAMERICANA', 'NATIONAL LEAGUE'],
  markets: ['UK', 'NORTH AMERICA', 'LATAM', 'MENA', 'SOUTH EAST ASIA', 'AUSTRALIA & NEW ZEALAND', 'REST OF WORLD'],
  kit: ['GOOGLE ANALYTICS', 'META ADS MANAGER', 'GOOGLE ADS', 'KLAVIYO', 'SHOPIFY PLUS', 'SPROUT SOCIAL', 'ADOBE CC', 'MAKE.COM', 'CLAUDE', 'CHATGPT', 'GEMINI'],
  squad: ['STRATEGY', 'PARTNERSHIPS', 'LEADERSHIP', 'CREATIVE DIRECTION', 'AI WORKFLOWS'],
  bench: ['GYM KING', 'AMERICAN GOLF', 'THE COUTURE CLUB', 'SWIFT AGENCY', '80 FOUR', 'DAZN'],
  demand: ['DEMAND IS DORMANT', 'FREE IS A GROWTH STRATEGY', 'REACH BEFORE REVENUE'],
  goal: ['GOAL!', 'MATT KING', 'GOAL!', 'WHAT A FINISH'],
  contact: ["LET'S TALK", 'MATT17KING@GMAIL.COM', 'LINKEDIN.COM/IN/MATTKING17'],
};
export const LED_PLAN = [['hero', 0, 'identity'], ['rights', 0, 'rights'], ['bball', 0, 'principles'], ['nfl', 0, 'bench'], ['nfl', 0.52, 'squad'], ['tennis', 0, 'demand'], ['race', 0, 'markets'], ['race', 0.64, 'kit'], ['ft', 0, 'contact']];
