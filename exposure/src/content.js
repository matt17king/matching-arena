// Everything Matt might want to edit lives here: the thinking, the proof, and the routes in.
// Carried over from the Arena site (../site/src/content.js) so both sites tell the same story.

export const EMAIL = 'Matt17King@gmail.com';
export const LINKEDIN = 'https://linkedin.com/in/mattking17';
export const INSTAGRAM = 'https://instagram.com/mattking.17';

// The five frames: five ideas. Each opens on one photo, which comes into focus as the title lands.
// photo: [file in public/photos, title, line, alt text]
export const FRAMES = [
  { id: 'runway', n: '01', title: ['The tunnel is', 'the new <em>runway.</em>'], intro: 'Fashion is everywhere in sport. NBA tunnel fits, the F1 paddock, the walk into training: every arrival is a runway.',
    photo: ['foden-couture.jpg', 'Phil Foden × The Couture Club', 'The menswear moved when footballers wore it.', 'Phil Foden in The Couture Club store'] },
  { id: 'side-door', n: '02', title: ['Culture is', 'the <em>side door.</em>'], intro: 'Reach people through what they already love. Then put the sport in that world.',
    photo: ['super-bowl.jpg', 'Super Bowl LV', 'I was in the building. The halftime show is part of the product.', 'Matt at Super Bowl LV, in the stands above the field'] },
    { id: 'fit', n: '03', title: ['Fit beats', '<em>size.</em>'], intro: "The right voice for the idea beats the biggest name that doesn't fit it. These are the eleven rules I cast talent by.",
    photo: ['man-city-couture.jpg', 'The Couture Club × Man City', 'Fashion meets football.', 'Matt carrying Couture Club bags into the Manchester City training ground'] },
  { id: 'format', n: '04', title: ['The format is', 'the <em>product.</em>'], intro: 'Change the format and you change who turns up. Split surfaces, handicapped courts, smaller courts with walls, one-point shoot-outs: the sport stays, the door gets wider.',
    photo: ['padel.jpg', 'On court — padel', "I play it too. Four players, one small court, walls in play: it's built to be social.", 'Matt playing padel'] },
  { id: 'story', n: '05', title: ['Story before', '<em>sport.</em>'], intro: 'Drive to Survive turned box-set watchers into F1 fans. They came for the people and stayed for the racing.',
    photo: ['f1-miami.jpg', 'F1 Miami', 'Represent tee, race weekend in a new market. Fashion is everywhere in sport.', 'Matt at F1 Miami in a Represent tee'] },
];

// Frame 01: the story, and the number it produced. stat: [value, what, where]
export const RUNWAY = {
  h: 'Every arrival is a fit check.',
  p: "At The Couture Club, influencers sold the womenswear. The menswear didn't move until footballers posted it. Then it sold out.",
  stat: ['+600%', 'Reach, with Molly-Mae Hague & Phil Foden', 'The Couture Club'],
};

// Frame 02
export const PLAYS = [
  { n: '01', h: 'Culture is the side door.', s: 'Reach people through what they already love.', rows: ['Taylor Swift', 'Kansas City Chiefs'], x: 'New eyes on the NFL' },
  { n: '02', h: 'The It Boy wears the drop.', s: 'Athletes are culture figures. Treat them that way.', rows: ['Alcaraz', 'Travis Scott', 'Nike'], x: 'Tennis in sneaker culture' },
  { n: '03', h: 'Music is the kick-off.', s: 'The halftime show is part of the product.', rows: ['Bad Bunny', 'adidas', 'Super Bowl'], x: 'One artist, three worlds' },
];
export const BRIEF = {
  h: 'How I build a brief',
  p: "Who are we trying to reach: fans we have, or fans we don't? What have we reached them with before? What do they already love? Bring that into sport, then ask what we have to offer.",
  // [step, label, chips, highlighted?]
  steps: [
    ['01', 'Who we want', ['Fans we have', "Fans we don't"]],
    ['02', 'What they already love', ['Music', 'Fashion', 'Sneakers', 'Creators', 'Gaming', 'Film & TV', 'Nightlife', 'Food']],
    ['03', 'What we have', ['Sport', 'Athletes', 'Stories']],
    ['04', 'What it becomes', ['Tunnel fits', 'Drops & collabs', 'Creator series', 'New formats', 'Music moments', 'Local heroes', 'New fans'], true],
  ],
};

// How a fan is made (its own section), then frame 03's eleven rules for working with talent
export const JOURNEY = [
  { name: 'Discovery', role: 'They meet it somewhere else', detail: "Nobody discovers a sport on its own channel. They find it in a feed, a song, a fit or a friend's story. That's where I start." },
  { name: 'Curiosity', role: 'A person, not a fixture', detail: 'Curiosity attaches to people: a personality, a rivalry, a look in the tunnel. The fixtures come later.' },
  { name: 'Story', role: 'The off-pitch story', detail: "Drive to Survive proved it. Give people the story and they'll come for the sport." },
  { name: 'Ritual', role: 'A reason to come back', detail: "A story becomes a habit when there's a reason to return every week: a format, a drop, a character arc." },
  { name: 'Belonging', role: 'Somewhere to stand', detail: 'Fans want a side and a community. The shirt, the group chat, the people who get it.' },
  { name: 'Advocacy', role: 'They bring someone', detail: 'The best media buy is a fan explaining it to a friend. Make that easy, and worth doing.' },
  { name: 'Fandom', role: "It's part of who they are", detail: "Now the sport turns up where they didn't expect it: what they wear, what they listen to, who they follow." },
];
export const RULES = [
  ['Give them their voice', 'Talent are the storytellers. My job is the brief and the platform, not their script.'],
  ['Fit beats size', "Creative fit beats creative size. The right voice for the idea beats the biggest name that doesn't fit it."],
  ['If you script them, you picked wrong', 'Needing to micromanage talent usually means the casting was off.'],
  ['Idols sell, influencers inform', "At The Couture Club, influencers sold the womenswear. The menswear didn't move until footballers posted it. Then it sold out."],
  ['Every pick needs a reason', 'A counterintuitive pick can be the best one. An unexplained one never is.'],
  ['Match the person to the idea', 'Lamine Yamal and Bad Bunny are both huge. Neither works unless the idea fits who they are.'],
  ['Borrow the audience you want', "Pick partners for the people who follow them, especially the ones who don't watch the sport yet."],
  ['Local heroes travel', 'Lead with who each market already loves. Ohtani in Japan opens doors no global ad can.'],
  ['The tunnel counts', 'Arrivals, fits, warm-ups, the walk into training. The off-pitch moments are content too.'],
  ['Test small, then scale', 'Trial and error is the process. Find what works with one partner, then take it to the next.'],
  ['Move what worked', 'The real skill is taking what worked in one place and landing it somewhere new.'],
];

// Frame 04 — the court redraws for each format
export const FORMATS = [
  { h: 'Battle of the surfaces', stat: '2007', unit: 'Palma de Mallorca', p: 'Federer v Nadal. The best on grass against the best on clay, on one court split down the middle. Same sport, a match nobody had seen before.' },
  { h: 'Battle of the sexes', stat: '9%', unit: 'smaller on her side of the net', p: 'Kyrgios v Sabalenka, Dubai, December 2025. Her half of the court was made about 9% smaller to even it up. Bend one rule and you hand a whole new audience a reason to tune in.' },
  { h: 'Padel', stat: '20×10', unit: 'metres · walls in play · always doubles', p: 'Padel took tennis, shrank the court, put the walls in play and made it doubles only. Easier to pick up, better with friends, and it brings people to a racket who never joined a tennis club.' },
];

// Frame 05: one idea, seven markets
export const MARKETS = {
  h: 'One idea, seven markets',
  p: "Sneakers are a global language. Culture travels, execution has to be local. Lead with who each market already loves, like Ohtani in Japan, and don't hide from what the rights already are.",
  // [code on the ticket, name]
  list: [['UK', 'United Kingdom'], ['NA', 'North America'], ['LATAM', 'Latin America'], ['MENA', 'Middle East & North Africa'], ['SEA', 'South East Asia'], ['ANZ', 'Australia & NZ'], ['ROW', 'Rest of world']],
  stat: ['7', 'Market zones, one go-to-market plan', 'DAZN'],
  photo: ['goodwood.jpg', 'Goodwood Festival of Speed', "Everyone filming. That's the story spreading before the race starts.", 'A phone held up to film a car at Goodwood Festival of Speed'],
};
// How I work
export const KIT = [
  { tag: 'Pit crew', title: 'AI is the pit crew', tools: 'Claude · ChatGPT · Gemini · Make.com', detail: "AI saves time on research, versions, reporting and automations. It changes the tyres fast. It doesn't drive the car." },
  { tag: 'Driver', title: 'Taste is the driver', tools: 'The brief · the casting · the creative call', detail: "AI isn't a creative strategist yet. Taking what worked in one place and landing it in another is still a human job." },
  { tag: 'Telemetry', title: 'Test, learn, scale', tools: 'Google Analytics · Meta Ads Manager · Klaviyo', detail: 'Trial and error, written down as process. The data tells you which idea earned the next lap.' },
];

// Plays worth stealing
export const FILM = [
  { tag: 'F1 × Netflix', title: 'Drive to Survive', play: 'F1 let the cameras into the paddock and handed the story to Netflix: the rivalries, the team bosses, the drivers as people.', why: 'It reached people who watch long-form drama, not motorsport. They met the characters first, and then they wanted the races.', steal: 'Find where your future fans already spend their hours and tell the story there. Content made for new audiences beats paid ads aimed at old ones.' },
  { tag: 'Music × NFL', title: 'Taylor Swift × the Chiefs', play: 'No campaign at all. Taylor Swift started turning up to watch Travis Kelce, and the broadcasts followed her.', why: 'Her fans suddenly had a reason to care about a game many had never watched. Someone they already loved was in the story.', steal: 'Culture is the side door. Ask who your new audience already follows, then put the sport in that world.' },
  { tag: 'Tennis × Sneakers', title: 'Alcaraz × Travis Scott × Nike', play: "Carlos Alcaraz, tennis's It Boy, previewing Travis Scott's Nike tennis shoe.", why: "A sneaker drop travels further than a match report. It put a tennis player in front of the sneaker world, on that world's terms.", steal: 'Treat athletes like the culture figures they are. The tunnel, the warm-up and the drop are all a stage.' },
  { tag: 'Football × Creators', title: 'Baller League', play: 'Six-a-side football with its own rulebook, built for streams and short clips, with creators and famous faces in the dugouts.', why: "It didn't ask young fans to sit through 90 minutes. It met them in the formats they already watch.", steal: 'The format is the product. Change the format and you change who turns up.' },
];

// The record: [value, what, where]
export const RECORD = [
  ['3M+', 'FIFA+ fans brought onto DAZN', 'DAZN · FIFA'], ['8', 'Football rights portfolios led', 'DAZN'], ['7', 'Market zones, one go-to-market plan', 'DAZN'], ['7-fig', 'Annual budget, allocated channel by channel', 'DAZN'],
  ['+450%', 'Fan engagement, Crewe Alexandra FC', '80 Four'], ['+600%', 'Reach, with Molly-Mae Hague & Phil Foden', 'The Couture Club'], ['+41%', 'Online sales from a rebuilt e-commerce strategy', 'The Couture Club'], ['+400%', 'Channel growth with Niall Horan & Judy Murray', 'American Golf'],
];
// The football properties at DAZN, as a ticker
export const RIGHTS = ['FIFA+', 'FIFA World Cup', 'UEFA Champions League', 'Serie A', 'LaLiga', 'Bundesliga', 'Copa Sudamericana', 'National League'];
// The route here: [year, name, logo file in public/logos]
export const ROUTE = [['2021', 'Gym King', 'gym-king.png'], ['2022', 'American Golf', 'american-golf.png'], ['2023', 'The Couture Club', 'couture-club.png'], ['2024', 'Swift', 'swift.png'], ['2025', '80 Four', '80-four.png'], ['2026', 'DAZN', 'dazn.png']];

// In the stands: [file in public/photos, title, label]
export const STANDS = [
  ['man-city-match.jpg', 'Manchester City', 'Matchday'],
  ['barcelona.jpg', 'FC Barcelona', 'In the stands'],
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

// The company I keep: [name, logo file in public/logos]
export const WORKED_WITH = [
  ['DAZN', 'dazn.png'], ['FIFA+', 'fifa-plus.png'], ['UEFA Champions League', 'uefa-champions-league.png'], ['Serie A', 'serie-a.png'], ['LaLiga', 'laliga.png'], ['Bundesliga', 'bundesliga.png'],
  ['Manchester City', 'man-city.png'], ['FC Barcelona', 'fc-barcelona.png'], ['Arsenal', 'arsenal.png'], ['LA Galaxy', 'la-galaxy.png'], ['Crewe Alexandra', 'crewe-alexandra.png'], ['DP World Tour', 'dp-world-tour.png'],
  ['adidas', 'adidas.png'], ['Puma', 'puma.png'], ['Under Armour', 'under-armour.png'], ['The Couture Club', 'couture-club.png'], ['Gym King', 'gym-king.png'], ['American Golf', 'american-golf.png'],
];
// [name, where]
export const TALENT = [['Phil Foden', 'The Couture Club'], ['Molly-Mae Hague', 'The Couture Club'], ['Kyle Walker', 'Talent partnership'], ['Conor McGregor', 'Talent partnership'], ['Tom Aspinall', 'Gym King'], ['Ash Cain', 'Gym King'], ['Alex Bowen', 'Gym King'], ['Niall Horan', 'American Golf'], ['Judy Murray', 'American Golf'], ['Madeline Argy', 'Talent partnership']];
export const PRESS = [
  { img: 'press-circle.jpg', pos: 'center 30%', alt: 'The 80 Four founders at the Circle Networks awards', source: 'Circle Networks', date: '2025', headline: 'Start Up of the Year: finalist', line: '80 Four was named a finalist for Circle Networks Start Up of the Year 2025.' },
  { img: 'press-bdaily-photo.jpg', pos: 'center 40%', alt: 'The three 80 Four founders', source: 'Bdaily Business News', date: '21 Oct 2025', headline: 'Trio launch new marketing agency', line: '80 Four, founded by Matt King, James Parker-Aiken and Emily Martin, specialises in sport, health and lifestyle branding and brand strategy.' },
];

// Book Matt: [what, line, email subject, the question, key]. The key is what the booking page uses (book/?for=key).
export const SEATS = [
  ['Podcasts', 'Sport, fashion and culture, and why fans fall for stories, not fixtures.', 'Podcast invite', 'Can you come on the pod?', 'podcast'],
  ['Keynotes & talks', 'Culture is the side door into sport. For conferences, brands and teams.', 'Speaking enquiry', 'Will you speak at our event?', 'talk'],
  ['Panels', 'Rights, talent, formats, and where the next fans come from.', 'Panel invite', 'Can you join our panel?', 'panel'],
  ['Brand collaborations', 'Sport × fashion × culture partnerships built on fit, not just reach.', 'Brand collaboration', 'Can we build something together?', 'brand'],
  ['Press comment', 'Quick, clear takes on sports marketing and culture.', 'Press comment', 'Can we get a quote from you?', 'press'],
  ["Let's talk", 'Rights holders, founders, agencies, or anyone with an idea worth chasing.', 'Hello', 'Got five minutes?', 'hello'],
];
// How each route reads on the booking pass (a three-letter code and a name), and in the sentence the booking page writes
export const BOOK = {
  podcast: { code: 'POD', pass: 'Podcast', phrase: 'a podcast' },
  talk: { code: 'KEY', pass: 'Keynote / talk', phrase: 'a keynote or talk' },
  panel: { code: 'PNL', pass: 'Panel', phrase: 'a panel' },
  brand: { code: 'BRD', pass: 'Brand collaboration', phrase: 'a brand collaboration' },
  press: { code: 'PRS', pass: 'Press comment', phrase: 'a press comment' },
  hello: { code: 'TLK', pass: 'A conversation', phrase: 'a conversation' },
};
export const TOPICS = ['Culture is the side door', 'The tunnel is the new runway', 'Fit beats size: casting talent', 'The format is the product', 'Story before sport', 'AI is the pit crew, not the driver'];
