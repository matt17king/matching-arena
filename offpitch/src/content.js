// Everything Matt might want to edit lives here: the thinking, the proof, and the routes in.
// Same story as the Arena and Long Exposure sites; this file is this site's own copy.

export const EMAIL = 'Matt17King@gmail.com';
export const LINKEDIN = 'https://linkedin.com/in/mattking17';
export const INSTAGRAM = 'https://instagram.com/mattking.17';

export const HERO = {
  lines: ['I take sport', 'off the pitch', 'and into <em>culture.</em>'],
  tags: 'Sport · Fashion · Culture',
  role: 'By day: Global Marketing Manager, Football — DAZN',
  cue: 'Follow the line',
};
export const PREMISE = {
  lines: ['Nobody falls for', '90 minutes.', 'They fall for', '<em>the story.</em>'],
  note: 'One line, five sports. It starts where the pitch stops.',
};

// The five chapters. Each is an idea first; the sport is where it was learned.
export const CHAPTERS = [
  { id: 'football', n: '01', sport: 'Football', title: ['The tunnel is', 'the new <em>runway.</em>'], plain: 'The tunnel is the new runway.', intro: 'Fashion is everywhere in sport.' },
  { id: 'basketball', n: '02', sport: 'Basketball', title: ['Culture is', 'the <em>side door.</em>'], plain: 'Culture is the side door.', intro: 'Reach people through what they already love. Then put the sport in that world.' },
  { id: 'nfl', n: '03', sport: 'NFL', title: ['Fit beats', '<em>size.</em>'], plain: 'Fit beats size.', intro: 'How a fan is made, one down at a time. Then the eleven rules I cast talent by.' },
  { id: 'tennis', n: '04', sport: 'Tennis', title: ['The format is', 'the <em>product.</em>'], plain: 'The format is the product.', intro: 'Change the format and you change who turns up. Split surfaces, handicapped courts, smaller courts with walls, one-point shoot-outs: the sport stays, the door gets wider.' },
  { id: 'motorsport', n: '05', sport: 'Motorsport', title: ['Story before', '<em>sport.</em>'], plain: 'Story before sport.', intro: 'Drive to Survive turned box-set watchers into F1 fans. They came for the people and stayed for the racing.' },
];

// 01
export const RUNWAY = {
  k: 'Arrivals',
  h: 'Every arrival is a fit check.',
  p: "At The Couture Club, influencers sold the womenswear. The menswear didn't move until footballers posted it. Then it sold out. NBA tunnel fits, the F1 paddock, the walk into training: every arrival is a runway.",
  photos: [
    ['foden-couture.jpg', 'Phil Foden × The Couture Club', 'The menswear moved when footballers wore it.', 'Phil Foden in The Couture Club store'],
    ['barcelona.jpg', 'In the stands, FC Barcelona', 'Fan first. Every story I tell starts from a seat like this one.', 'The view from the stands at an FC Barcelona match'],
  ],
};

// 02
export const PLAYS = [
  { n: '01', h: 'Culture is the side door.', s: 'Reach people through what they already love.', rows: ['Taylor Swift', 'Kansas City Chiefs'], x: 'New eyes on the NFL' },
  { n: '02', h: 'The It Boy wears the drop.', s: 'Athletes are culture figures. Treat them that way.', rows: ['Alcaraz', 'Travis Scott', 'Nike'], x: 'Tennis in sneaker culture' },
  { n: '03', h: 'Music is the kick-off.', s: 'The halftime show is part of the product.', rows: ['Bad Bunny', 'adidas', 'Super Bowl'], x: 'One artist, three worlds' },
];
export const BRIEF = {
  k: 'The brief',
  h: 'How I build a brief',
  p: "Who are we trying to reach: fans we have, or fans we don't? What have we reached them with before? What do they already love? Bring that into sport, then ask what we have to offer.",
  // [step, label, chips, highlighted?]
  steps: [
    ['01', 'Who we want', ['Fans we have', "Fans we don't"]],
    ['02', 'What they already love', ['Music', 'Fashion', 'Sneakers', 'Creators', 'Gaming', 'Film & TV', 'Nightlife', 'Food']],
    ['03', 'What we have', ['Sport', 'Athletes', 'Stories']],
    ['04', 'What it becomes', ['Tunnel fits', 'Drops & collabs', 'Creator series', 'New formats', 'Music moments', 'Local heroes', 'New fans'], true],
  ],
  photo: ['super-bowl.jpg', 'Super Bowl LV', 'I was in the building. The halftime show is part of the product.', 'Matt at Super Bowl LV, in the stands above the field'],
};

// 03 — how a fan is made, one down at a time
export const DRIVE = [
  { down: '1st & 10', name: 'Discovery', role: 'They meet it somewhere else', detail: "Nobody discovers a sport on its own channel. They find it in a feed, a song, a fit or a friend's story. That's where I start." },
  { down: '2nd & 7', name: 'Curiosity', role: 'A person, not a fixture', detail: 'Curiosity attaches to people: a personality, a rivalry, a look in the tunnel. The fixtures come later.' },
  { down: '3rd & 3', name: 'Story', role: 'The off-pitch story', detail: "Drive to Survive proved it. Give people the story and they'll come for the sport." },
  { down: '1st & 10', name: 'Ritual', role: 'A reason to come back', detail: "A story becomes a habit when there's a reason to return every week: a format, a drop, a character arc." },
  { down: '2nd & 5', name: 'Belonging', role: 'Somewhere to stand', detail: 'Fans want a side and a community. The shirt, the group chat, the people who get it.' },
  { down: '1st & goal', name: 'Advocacy', role: 'They bring someone', detail: 'The best media buy is a fan explaining it to a friend. Make that easy, and worth doing.' },
  { down: 'Touchdown', name: 'Fandom', role: "It's part of who they are", detail: "Now the sport turns up where they didn't expect it: what they wear, what they listen to, who they follow." },
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

// 04 — the court redraws for each format
export const FORMATS = [
  { k: 'Format 01', h: 'Battle of the surfaces', stat: '2007', unit: 'Palma de Mallorca', p: 'Federer v Nadal. The best on grass against the best on clay, on one court split down the middle. Same sport, a match nobody had seen before.' },
  { k: 'Format 02', h: 'Battle of the sexes', stat: '9%', unit: 'smaller on her side of the net', p: 'Kyrgios v Sabalenka, Dubai, December 2025. Her half of the court was made about 9% smaller to even it up. Bend one rule and you hand a whole new audience a reason to tune in.' },
  { k: 'Format 03', h: 'Padel', stat: '20×10', unit: 'metres · walls in play · always doubles', p: 'Padel took tennis, shrank the court, put the walls in play and made it doubles only. Easier to pick up, better with friends, and it brings people to a racket who never joined a tennis club.', photo: ['padel.jpg', 'On court, padel', "I play it too. Four players, one small court, walls in play: it's built to be social.", 'Matt playing padel'] },
];

// 05
export const MARKETS = {
  k: 'The grid',
  h: 'One idea, seven markets',
  p: "Sneakers are a global language. Culture travels, execution has to be local. Lead with who each market already loves, like Ohtani in Japan, and don't hide from what the rights already are.",
  list: ['UK', 'North America', 'LATAM', 'MENA', 'South East Asia', 'Australia & NZ', 'Rest of world'],
  photos: [
    ['f1-miami.jpg', 'F1 Miami', 'Represent tee, race weekend in a new market. Fashion is everywhere in sport.', 'Matt at F1 Miami in a Represent tee'],
    ['goodwood.jpg', 'Goodwood Festival of Speed', "Everyone filming. That's the story spreading before the race starts.", 'A phone held up to film a car at Goodwood Festival of Speed'],
  ],
};
export const KIT = [
  { tag: 'Pit crew', title: 'AI is the pit crew', tools: 'Claude · ChatGPT · Gemini · Make.com', detail: "AI saves time on research, versions, reporting and automations. It changes the tyres fast. It doesn't drive the car." },
  { tag: 'Driver', title: 'Taste is the driver', tools: 'The brief · the casting · the creative call', detail: "AI isn't a creative strategist yet. Taking what worked in one place and landing it in another is still a human job." },
  { tag: 'Telemetry', title: 'Test, learn, scale', tools: 'Google Analytics · Meta Ads Manager · Klaviyo', detail: 'Trial and error, written down as process. The data tells you which idea earned the next lap.' },
];

export const LINEUP = { lines: ['Five sports.', 'One way of <em>thinking.</em>'], note: 'The ball changes. The idea underneath it does not.' };

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
// The football properties at DAZN
export const RIGHTS = ['FIFA+', 'FIFA World Cup', 'UEFA Champions League', 'Serie A', 'LaLiga', 'Bundesliga', 'Copa Sudamericana', 'National League'];
// The route here: [year, name, logo file in public/logos]
export const ROUTE = [['2021', 'Gym King', 'gym-king.png'], ['2022', 'American Golf', 'american-golf.png'], ['2023', 'The Couture Club', 'couture-club.png'], ['2024', 'Swift', 'swift.png'], ['2025', '80 Four', '80-four.png'], ['2026', 'DAZN', 'dazn.png']];

// In the stands: [file in public/photos, title, label]
export const STANDS = [
  ['man-city-match.jpg', 'Manchester City', 'Matchday'],
  ['man-city-couture.jpg', 'The Couture Club × Man City', 'Fashion meets football'],
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

// Book Matt: [what, line, email subject, the question]
export const SEATS = [
  ['Podcasts', 'Sport, fashion and culture, and why fans fall for stories, not fixtures.', 'Podcast invite', 'Can you come on the pod?'],
  ['Keynotes & talks', 'Culture is the side door into sport. For conferences, brands and teams.', 'Speaking enquiry', 'Will you speak at our event?'],
  ['Panels', 'Rights, talent, formats, and where the next fans come from.', 'Panel invite', 'Can you join our panel?'],
  ['Brand collaborations', 'Sport × fashion × culture partnerships built on fit, not just reach.', 'Brand collaboration', 'Can we build something together?'],
  ['Press comment', 'Quick, clear takes on sports marketing and culture.', 'Press comment', 'Can we get a quote from you?'],
  ["Let's talk", 'Rights holders, founders, agencies, or anyone with an idea worth chasing.', 'Hello', 'Got five minutes?'],
];
export const TOPICS = ['Culture is the side door', 'The tunnel is the new runway', 'Fit beats size: casting talent', 'The format is the product', 'Story before sport', 'AI is the pit crew, not the driver'];

// ---------- The Playbook (this site's own structure)
// The hero: one ball, five skins, five ideas. `bg`/`fg` colour the studio while that sport is up.
export const IDEAS = [
  { skin: 0, sport: 'Football', line: ['The tunnel is', 'the new <em>runway.</em>'], note: 'Fashion is everywhere in sport. Every arrival is a fit check.', bg: '#0f7a45', fg: '#f4f2ea' },
  { skin: 1, sport: 'Basketball', line: ['Culture is', 'the <em>side door.</em>'], note: 'Reach people through what they already love. Then put the sport in that world.', bg: '#e9552b', fg: '#141412' },
  { skin: 2, sport: 'NFL', line: ['Fit beats', '<em>size.</em>'], note: "The right voice for the idea beats the biggest name that doesn't fit it.", bg: '#ece8df', fg: '#141412' },
  { skin: 3, sport: 'Tennis', line: ['The format is', 'the <em>product.</em>'], note: 'Change the format and you change who turns up.', bg: '#2257f5', fg: '#f4f2ea' },
  { skin: 4, sport: 'Motorsport', line: ['Story before', '<em>sport.</em>'], note: 'They came for the people and stayed for the racing.', bg: '#dcf23d', fg: '#141412' },
];

// The brief machine. Three reels; the play is assembled from the pieces below.
// These lines are starting points written in Matt's vocabulary. Edit freely.
export const MACHINE = {
  sports: [
    { name: 'Football', have: 'Ninety minutes, and everything around them: the tunnel, the walk into training, the away end.' },
    { name: 'Basketball', have: 'A tunnel walk that already works like a fashion week, and players who are culture figures first.' },
    { name: 'NFL', have: 'A halftime show that is part of the product, and a calendar built around one day a week.' },
    { name: 'Tennis', have: 'A format that can bend: split surfaces, smaller courts, walls in play, one-point shoot-outs.' },
    { name: 'Motorsport', have: 'A paddock full of characters, and a weekend that starts long before lights out.' },
  ],
  loves: [
    { name: 'Music', door: 'Start with who they already listen to.', move: 'Walk-out tracks, a halftime moment, the playlist in the tunnel. The artist is the kick-off.', becomes: 'Music moments', rule: 6, film: 1 },
    { name: 'Fashion', door: 'Dress the arrival before you sell the fixture.', move: 'Tunnel fits, matchday looks, a capsule worth queuing for. Idols sell it; influencers explain it.', becomes: 'Tunnel fits', rule: 3, film: 2 },
    { name: 'Sneakers', door: 'A drop travels further than a match report.', move: 'Put the athlete in the sneaker world on that world’s terms. The release date is the fixture.', becomes: 'Drops & collabs', rule: 5, film: 2 },
    { name: 'Creators', door: 'Hand over the brief, not the script.', move: 'Pick creators for the people who follow them, then let them tell it their way.', becomes: 'Creator series', rule: 0, film: 3 },
    { name: 'Gaming', door: 'Meet them in the formats they already play.', move: 'Shorter, faster, built for streams and clips. Change the format and you change who turns up.', becomes: 'New formats', rule: 9, film: 3 },
    { name: 'Film & TV', door: 'Characters first, fixtures second.', move: 'Find the rivalries and the people off the pitch. Tell that story where they already spend their evenings.', becomes: 'The off-pitch story', rule: 8, film: 0 },
    { name: 'Nightlife', door: 'Make the event the night out.', move: 'Doors, a line-up, a reason to dress up. The sport is the headline act, not the only act.', becomes: 'A night worth leaving the house for', rule: 1, film: 1 },
    { name: 'Food', door: 'Ritual is a reason to come back.', move: 'The same table, the same people, every week. Build the habit around the fixture and the fixture becomes the habit.', becomes: 'A weekly ritual', rule: 7, film: 3 },
  ],
  markets: ['UK', 'North America', 'LATAM', 'MENA', 'South East Asia', 'Australia & NZ', 'Rest of world'],
  local: 'Lead with who {market} already loves. Culture travels; execution has to be local.',
};
