// Everything Matt might want to edit lives here: the thinking, the proof, and the routes in.

export const EMAIL = 'Matt17King@gmail.com';
export const LINKEDIN = 'https://linkedin.com/in/mattking17';
export const INSTAGRAM = 'https://instagram.com/mattking.17';

// Scroll length per chapter (vh). The scroll spacer is sized to their sum.
export const SEGS = [['hero', 1300], ['rights', 650], ['x1', 420], ['bball', 1050], ['x2', 420], ['nfl', 1300], ['x3', 420], ['tennis', 1150], ['x4', 460], ['race', 1150], ['ft', 380]];
// Beat ranges inside each venue, as fractions of that venue's segment.
export const CH = { RR: [0.08, 0.9], BEATS: [0.06, 0.44], TAC: [0.5, 0.92], DRIVE: [0.03, 0.5], XI: [0.55, 0.96], COL: [0.028, 0.334], SURF: [0.39, 0.6], SEXES: [0.6, 0.82], FANS: [0.85, 0.95], LAP: [0.08, 0.62], PIT: [0.66, 0.92] };
export const VENUE = { hero: '01 / 05 — FOOTBALL', rights: '01 / 05 — FOOTBALL', bball: '02 / 05 — BASKETBALL', nfl: '03 / 05 — NFL', tennis: '04 / 05 — TENNIS', race: '05 / 05 — MOTORSPORT', ft: '05 / 05 — MOTORSPORT' };

// The pit wall: where AI fits the work
export const KIT = [
  { tag: 'PIT CREW', title: 'AI is the pit crew', tools: 'Claude · ChatGPT · Gemini · Make.com', detail: "AI saves time on research, versions, reporting and automations. It changes the tyres fast. It doesn't drive the car." },
  { tag: 'DRIVER', title: 'Taste is the driver', tools: 'The brief · the casting · the creative call', detail: "AI isn't a creative strategist yet. Taking what worked in one place and landing it in another is still a human job." },
  { tag: 'TELEMETRY', title: 'Test, learn, scale', tools: 'Google Analytics · Meta Ads Manager · Klaviyo', detail: 'Trial and error, written down as process. The data tells you which idea earned the next lap.' },
];
export const MARKETS = ['UK', 'North America', 'LATAM', 'MENA', 'South East Asia', 'Australia & NZ', 'Rest of world'];
// Tunnel signs, read one gate at a time on the walk out
export const GATES = [
  { z: 114, lines: ['THE'] }, { z: 104, lines: ['TUNNEL'] }, { z: 94, lines: ['IS THE NEW'] }, { z: 84, lines: ['RUNWAY.'], red: true },
  { z: 60, lines: ['EVERY ARRIVAL', 'IS A FIT CHECK.'], kind: 'care', red: true },
];
// Photos: drop files into public/photos and set the path here (null = labelled placeholder in the 3D world).
export const PHOTOS = { walkout: null, portrait: 'photos/portrait.jpg' };
export const LOGOS = { 'copa-sudamericana': 'copa-sudamericana.png', 'career-webber': 'career/webber.png', 'career-gym-king': 'career/gym-king.png', 'career-american-golf': 'career/american-golf.png', 'career-couture-club': 'career/couture-club.png', 'career-swift': 'career/swift.png', 'career-80-four': 'career/80-four.png', 'career-dazn': 'career/dazn.png', 'puma': 'puma.png', 'adidas': 'adidas.png', 'la-galaxy': 'la-galaxy.png', 'fifa-world-cup': 'fifa-world-cup.png', 'national-league': 'national-league.png', 'fifa-plus': 'fifa-plus.png', 'laliga': 'laliga.png', 'arsenal': 'arsenal.png', 'man-city': 'man-city.png', 'uefa-europa-league': 'uefa-europa-league.png', 'serie-a': 'serie-a.png', 'bundesliga': 'bundesliga.png', 'uefa-champions-league': 'uefa-champions-league.png', 'fc-barcelona': 'fc-barcelona.png' };
// The centre spot: the properties I tell stories for at DAZN
export const RIGHTS = [
  { slug: 'fifa-plus', name: 'FIFA+', sub: '3M+ users migrated', detail: "I led FIFA's move onto DAZN. Over 3M FIFA+ fans came across, and they're still signing up." },
  { slug: 'fifa-world-cup', name: 'FIFA World Cup', sub: 'Senior · U-20 · U-17', detail: "World Cups at every level: senior, U-20, U-20 Women's and U-17." },
  { slug: 'uefa-champions-league', name: 'UEFA Champions League', sub: 'US · Canada · New Zealand', detail: 'Champions League and Europa League, told differently for the US, Canada and New Zealand.' },
  { slug: 'serie-a', name: 'Serie A', sub: 'UK exclusive', detail: "I lead UK marketing for DAZN's exclusive Serie A rights." },
  { slug: 'laliga', name: 'LaLiga', sub: 'Global markets', detail: 'LaLiga, planned market by market with every international office.' },
  { slug: 'bundesliga', name: 'Bundesliga', sub: 'Global markets', detail: 'Bundesliga, localised territory by territory. Same rights, different story.' },
  { slug: 'copa-sudamericana', name: 'Copa Sudamericana', sub: 'Global markets', detail: "Copa Sudamericana, taken to new audiences across DAZN's markets." },
  { slug: 'national-league', name: 'National League', sub: 'UK growth', detail: 'I designed and launched the campaign taking the National League to a wider UK audience.' },
];
// The huddle: eleven rules for working with talent. [x, z, shirt, rule, position, why]
// Offence lined up on its own 37, facing the end zone.
export const XI = [
  [-12, -9.2, 1, 'Give them their voice', 'LT', 'Talent are the storytellers. My job is the brief and the platform, not their script.'],
  [-12, 13.8, 2, 'Fit beats size', 'TE', "Creative fit beats creative size. The right voice for the idea beats the biggest name that doesn't fit it."],
  [-12, 9.2, 3, 'If you script them, you picked wrong', 'RT', 'Needing to micromanage talent usually means the casting was off.'],
  [-12, -4.6, 4, 'Idols sell, influencers inform', 'LG', "At The Couture Club, influencers sold the womenswear. The menswear didn't move until footballers posted it. Then it sold out."],
  [-12, 4.6, 5, 'Every pick needs a reason', 'RG', 'A counterintuitive pick can be the best one. An unexplained one never is.'],
  [-12, 0, 6, 'Match the person to the idea', 'C', 'Lamine Yamal and Bad Bunny are both huge. Neither works unless the idea fits who they are.'],
  [-14, 21.5, 7, 'Borrow the audience you want', 'WR', "Pick partners for the people who follow them, especially the ones who don't watch the sport yet."],
  [-31, 0, 8, 'Local heroes travel', 'RB', 'Lead with who each market already loves. Ohtani in Japan opens doors no global ad can.'],
  [-20, 0, 9, 'The tunnel counts', 'QB', 'Arrivals, fits, warm-ups, the walk into training. The off-pitch moments are content too.'],
  [-25.5, 0, 10, 'Test small, then scale', 'FB', 'Trial and error is the process. Find what works with one partner, then take it to the next.'],
  [-14, -21.5, 11, 'Move what worked', 'WR', 'The real skill is taking what worked in one place and landing it somewhere new.'],
];
// The drive: how a fan is made, one stage per down
export const DRIVE = [
  { down: '1ST & 10', name: 'Discovery', years: 'STAGE 01', role: 'They meet it somewhere else', detail: "Nobody discovers a sport on its own channel. They find it in a feed, a song, a fit or a friend's story. That's where I start." },
  { down: '2ND & 7', name: 'Curiosity', years: 'STAGE 02', role: 'A person, not a fixture', detail: 'Curiosity attaches to people: a personality, a rivalry, a look in the tunnel. The fixtures come later.' },
  { down: '3RD & 3', name: 'Story', years: 'STAGE 03', role: 'The off-pitch story', detail: "Drive to Survive proved it. Give people the story and they'll come for the sport." },
  { down: '1ST & 10', name: 'Ritual', years: 'STAGE 04', role: 'A reason to come back', detail: "A story becomes a habit when there's a reason to return every week: a format, a drop, a character arc." },
  { down: '2ND & 5', name: 'Belonging', years: 'STAGE 05', role: 'Somewhere to stand', detail: 'Fans want a side and a community. The shirt, the group chat, the people who get it.' },
  { down: '1ST & GOAL', name: 'Advocacy', years: 'STAGE 06', role: 'They bring someone', detail: 'The best media buy is a fan explaining it to a friend. Make that easy, and worth doing.' },
  { down: 'TOUCHDOWN', name: 'Fandom', years: 'STAGE 07', role: "It's part of who they are", detail: "Now the sport turns up where they didn't expect it: what they wear, what they listen to, who they follow." },
];
// The film room: plays worth stealing
export const FILM = [
  { tag: 'F1 × NETFLIX', title: 'Drive to Survive', play: 'F1 let the cameras into the paddock and handed the story to Netflix: the rivalries, the team bosses, the drivers as people.', why: 'It reached people who watch long-form drama, not motorsport. They met the characters first, and then they wanted the races.', steal: 'Find where your future fans already spend their hours and tell the story there. Content made for new audiences beats paid ads aimed at old ones.' },
  { tag: 'MUSIC × NFL', title: 'Taylor Swift × the Chiefs', play: 'No campaign at all. Taylor Swift started turning up to watch Travis Kelce, and the broadcasts followed her.', why: 'Her fans suddenly had a reason to care about a game many had never watched. Someone they already loved was in the story.', steal: 'Culture is the side door. Ask who your new audience already follows, then put the sport in that world.' },
  { tag: 'TENNIS × SNEAKERS', title: 'Alcaraz × Travis Scott × Nike', play: "Carlos Alcaraz, tennis's It Boy, previewing Travis Scott's Nike tennis shoe.", why: "A sneaker drop travels further than a match report. It put a tennis player in front of the sneaker world, on that world's terms.", steal: 'Treat athletes like the culture figures they are. The tunnel, the warm-up and the drop are all a stage.' },
  { tag: 'FOOTBALL × CREATORS', title: 'Baller League', play: 'Six-a-side football with its own rulebook, built for streams and short clips, with creators and famous faces in the dugouts.', why: "It didn't ask young fans to sit through 90 minutes. It met them in the formats they already watch.", steal: 'The format is the product. Change the format and you change who turns up.' },
];

// [value, what, where]
export const TROPHIES = [
  ['3M+', 'FIFA+ fans brought onto DAZN', 'DAZN · FIFA'], ['8', 'Football rights portfolios led', 'DAZN'], ['7', 'Market zones, one go-to-market plan', 'DAZN'], ['7-fig', 'Annual budget, allocated channel by channel', 'DAZN'],
  ['+450%', 'Fan engagement, Crewe Alexandra FC', '80 FOUR'], ['+600%', 'Reach, with Molly-Mae Hague & Phil Foden', 'COUTURE CLUB'], ['+41%', 'Online sales from a rebuilt e-commerce strategy', 'COUTURE CLUB'], ['+400%', 'Channel growth with Niall Horan & Judy Murray', 'AMERICAN GOLF'],
];
// Proof strip: [name, logo file in public/logos]
export const PROOF = [['DAZN', 'career/dazn.png'], ['FIFA+', 'fifa-plus.png'], ['UEFA Champions League', 'uefa-champions-league.png'], ['Serie A', 'serie-a.png'], ['LaLiga', 'laliga.png'], ['Bundesliga', 'bundesliga.png'], ['80 Four', 'career/80-four.png'], ['The Couture Club', 'career/couture-club.png'], ['American Golf', 'career/american-golf.png'], ['Gym King', 'career/gym-king.png'], ['Swift Agency', 'career/swift.png'], ['Webber International', 'career/webber.png']];
// In the stands: [file in public/photos/life, title, label]. A .mp4 plays as a muted loop with a .jpg poster of the same name.
export const STANDS = [
  ['man-city-match.mp4', 'Manchester City', 'Matchday'],
  ['national-league-awards.jpg', 'National League Awards', 'Red carpet'],
  ['goodwood.jpg', 'Goodwood Festival of Speed', 'Paddock'],
  ['boxing.jpg', 'Fight night', 'In the crowd'],
  ['tennis.jpg', 'Tennis', 'On court'],
  ['padel-tournament.jpg', 'Padel tournament', 'Courtside'],
  ['run-10k.jpg', '10K', 'Ring the bell'],
  ['paris-marathon.jpg', 'Paris Marathon', 'Race day'],
  ['track.jpg', 'The track', 'Training'],
  ['working.jpg', 'The desk', 'Where the ideas get built'],
];
// [name, where] — talent partnerships
export const TALENT = [['Phil Foden', 'The Couture Club'], ['Molly-Mae Hague', 'The Couture Club'], ['Kyle Walker', 'Talent partnership'], ['Conor McGregor', 'Talent partnership'], ['Tom Aspinall', 'Gym King'], ['Ash Cain', 'Gym King'], ['Alex Bowen', 'Gym King'], ['Niall Horan', 'American Golf'], ['Judy Murray', 'American Golf'], ['Madeline Argy', 'Talent partnership']];
// [name, logo file in public/logos or null]
export const BRANDS = [['Manchester City FC', 'man-city.png'], ['FC Barcelona', 'fc-barcelona.png'], ['Arsenal FC', 'arsenal.png'], ['LA Galaxy', 'la-galaxy.png'], ['Crewe Alexandra FC', 'crewe-alexandra.png'], ['DP World Tour', 'dp-world-tour.png'], ['adidas', 'adidas.png'], ['Puma', 'puma.png'], ['Under Armour', 'under-armour.png']];
// press coverage (from the clipping in public/photos)
export const PRESS = [{ img: 'photos/press-bdaily-photo.jpg', source: 'Bdaily Business News', date: '21 Oct 2025', headline: 'Trio launch new marketing agency', line: '80 Four, founded by Matt King, James Parker-Aiken and Emily Martin, specialises in sport, health and lifestyle branding and brand strategy.' }];
// Book Matt: [what, line, email subject]
export const SEATS = [
  ['Podcasts', 'Sport, fashion and culture, and why fans fall for stories, not fixtures.', 'Podcast invite'],
  ['Keynotes & talks', 'Culture is the side door into sport. For conferences, brands and teams.', 'Speaking enquiry'],
  ['Panels', 'Rights, talent, formats, and where the next fans come from.', 'Panel invite'],
  ['Brand collaborations', 'Sport × fashion × culture partnerships built on fit, not just reach.', 'Brand collaboration'],
  ['Press comment', 'Quick, clear takes on sports marketing and culture.', 'Press comment'],
  ["Let's talk", 'Rights holders, founders, agencies, or anyone with an idea worth chasing.', 'Hello'],
];
// What I talk about
export const TOPICS = ['Culture is the side door', 'The tunnel is the new runway', 'Fit beats size: casting talent', 'The format is the product', 'Story before sport', 'AI is the pit crew, not the driver'];

export const STAT = { a: { v: '676K', n: 'Alexandra Eala', k: 676 }, b: { v: '70K', n: 'Novak Djokovic', k: 70 } };
// The crowd re-forms into this word on the show court
export const FANS_TEXT = 'NEW';
export const SCREEN_DATA = {
  // the brief, drawn on the court: who we want → what they already love → what we have → what it becomes
  passions: ['Music', 'Fashion', 'Sneakers', 'Creators', 'Gaming', 'Film & TV', 'Nightlife', 'Food'],
  outputs: ['Tunnel fits', 'Drops & collabs', 'Creator series', 'New formats', 'Music moments', 'Local heroes', 'New fans'],
  talent: [['Phil Foden', 'The Couture Club'], ['Molly-Mae Hague', 'The Couture Club'], ['Kyle Walker', 'Talent partner'], ['Conor McGregor', 'Talent partner'], ['Tom Aspinall', 'Gym King'], ['Niall Horan', 'American Golf'], ['Judy Murray', 'American Golf'], ['Madeline Argy', 'Talent partner'], ['Alex Bowen', 'Gym King']],
  route: [['2021', 'GYM KING', 'gym-king'], ['2022', 'AMERICAN GOLF', 'american-golf'], ['2023', 'COUTURE CLUB', 'couture-club'], ['2024', 'SWIFT', 'swift'], ['2025', '80 FOUR', '80-four'], ['2026', 'DAZN', 'dazn']],
};
// LED ribbon messages around the venues
export const MESSAGES = {
  identity: ['MATT KING', 'SPORT × FASHION × CULTURE', 'OFF THE PITCH', 'INTO CULTURE'],
  principles: ['CULTURE IS THE SIDE DOOR', 'WHAT DO THEY ALREADY LOVE?', 'STORY BEFORE SPORT'],
  rights: ['FIFA+', 'FIFA WORLD CUP', 'UEFA CHAMPIONS LEAGUE', 'SERIE A', 'LALIGA', 'BUNDESLIGA', 'COPA SUDAMERICANA', 'NATIONAL LEAGUE'],
  markets: ['UK', 'NORTH AMERICA', 'LATAM', 'MENA', 'SOUTH EAST ASIA', 'AUSTRALIA & NEW ZEALAND', 'REST OF WORLD'],
  kit: ['AI IS THE PIT CREW', 'TASTE IS THE DRIVER', 'TEST · LEARN · SCALE'],
  squad: ['FIT BEATS SIZE', 'GIVE THEM THEIR VOICE', 'IDOLS SELL', 'THE TUNNEL COUNTS'],
  bench: ['DISCOVERY', 'CURIOSITY', 'STORY', 'RITUAL', 'BELONGING', 'ADVOCACY', 'FANDOM'],
  demand: ['DEMAND IS DORMANT', 'THE FORMAT IS THE PRODUCT', 'NEW FORMATS · NEW FANS'],
  goal: ['GOAL!', 'MATT KING', 'GOAL!', 'WHAT A FINISH'],
  talent: ['PHIL FODEN', 'MOLLY-MAE HAGUE', 'KYLE WALKER', 'CONOR MCGREGOR', 'TOM ASPINALL', 'NIALL HORAN', 'JUDY MURRAY', 'MADELINE ARGY', 'ALEX BOWEN'],
  brands: ['MANCHESTER CITY FC', 'FC BARCELONA', 'ARSENAL FC', 'LA GALAXY', 'CREWE ALEXANDRA FC', 'DP WORLD TOUR', 'ADIDAS', 'PUMA', 'UNDER ARMOUR'],
  contact: ["LET'S TALK", 'MATT17KING@GMAIL.COM', '@MATTKING.17'],
};
export const LED_PLAN = [['hero', 0, 'identity'], ['rights', 0, 'rights'], ['bball', 0, 'principles'], ['bball', 0.36, 'talent'], ['nfl', 0, 'bench'], ['nfl', 0.52, 'squad'], ['tennis', 0, 'demand'], ['tennis', 0.6, 'brands'], ['race', 0, 'markets'], ['race', 0.64, 'kit'], ['ft', 0, 'contact']];
