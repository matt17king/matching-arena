// The virtual world, place by place. The penthouse is the first; the others are listed in LOCATIONS at the bottom, each
// with its own rooms. Room ids are unique across every place: the address keeps the room (world.bymattking.com/#casino).
//
// Each room is one picture (public/rooms, 2000 × 1116) and a list of things in it.
// A thing sits `at` [across, down] as a percentage of the picture, and opens a card: `k` the small line above, `t` the title,
// `p` the words, and optionally `stat` [number, what], `photo` [file in public/photos, alt text] and `link` [label, where to].
// A thing with `spotify` (a link to a track, album or playlist on Spotify) is a music marker: it opens the player, not a card.
// A thing with `game` ('blackjack', 'roulette' or 'slots') is a table to play at: it opens the game, not a card (see games.js).
// A room can have `screens`: a video (in public/video, with a still `poster` beside it) laid onto a screen in the picture.
// `quad` is the screen's four corners as percentages of the picture: top left, top right, bottom right, bottom left.
// It plays silently in the room and opens full screen, with sound, when clicked.
// A room with `sky` is relit for London's real time and weather (see sky.js). Its `lights` are the lamps that come up as it
// gets dark: [across %, down %, reach as a % of the picture's width, strength, colour]. `outdoor` marks a room under the sky.
// The room needs a mask in public/rooms/masks, built by tools/masks.py.
// `arrows` moves the side arrows down the screen (a percentage) in a room where they would sit on top of something.
// `focus` is the part of the picture a narrow screen starts on. Photos are shown whole, at their own shape, never cropped.
const PENTHOUSE = [
  { id: 'living', name: 'Living room', img: 'living.webp', focus: [47, 58], alt: 'The living room: dark leather sofas around a black marble table, a marble fireplace, tall windows over London',
    sky: { lights: [[71.5, 50, 17, 1.1, [1, 0.62, 0.3]], [47, 28, 20, 0.75, [1, 0.82, 0.6]], [88, 42, 12, 0.5, [1, 0.8, 0.58]], [70, 23, 9, 0.3, [0.6, 0.72, 1]], [40, 62, 26, 0.4, [1, 0.84, 0.66]]] },
    screens: [{ video: 'tv.mp4', poster: 'tv.jpg', label: 'the TV', quad: [[63.45, 8.9], [76.4, 22.0], [76.4, 38.2], [63.45, 24.9]] }],
    things: [
      { at: [45.3, 60.5], label: 'The match ball', k: 'DAZN · FIFA', t: 'The World Cup ball',
        p: "The FIFA World Cup is one of eight football rights portfolios I've led at DAZN. Bringing FIFA+ across put more than three million fans onto the platform.",
        stat: ['3M+', 'FIFA+ fans brought onto DAZN'], link: ['See the record', '../#record'] },
      { at: [51.6, 21.5], label: 'Play music', t: 'On the speakers', spotify: 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M' },
      { at: [50.6, 69.6], label: 'On the coffee table', k: 'Circle Networks · 2025', t: 'In the press',
        p: '80 Four, the agency I founded with James Parker-Aiken and Emily Martin, was named a finalist for Start Up of the Year.',
        photo: ['press-circle.jpg', 'The 80 Four founders at the Circle Networks awards'], link: ['Read the press', '../#press'] },
    ] },
  { id: 'office', name: 'Office', img: 'office.webp', focus: [58, 45], sky: { lights: [[38.5, 38, 15, 1, [1, 0.78, 0.5]], [68, 22, 24, 0.7, [1, 0.86, 0.68]], [53.5, 53, 6, 0.45, [0.7, 0.8, 1]], [55, 60, 30, 0.4, [1, 0.84, 0.66]]] }, alt: 'The office: a walnut and marble desk with a laptop and a microphone, three framed football shirts on the wall',
    things: [
      { at: [55, 13], label: 'Foden, 47', k: 'The Couture Club', t: 'Phil Foden',
        p: "At The Couture Club, influencers sold the womenswear. The menswear didn't move until footballers posted it. Then it sold out.",
        stat: ['+600%', 'Reach, with Molly-Mae Hague & Phil Foden'], photo: ['foden-couture.jpg', 'Phil Foden in The Couture Club store'], link: ['Read the story', '../#frames'] },
      { at: [67.6, 21], label: 'Barcelona', k: 'In the stands', t: 'FC Barcelona',
        p: "One of the clubs I've worked with, and one I've watched from the stands.",
        photo: ['barcelona.jpg', 'FC Barcelona, from the stands'], link: ['See the stands', '../#stands'] },
      { at: [80.6, 29], label: 'Arsenal', k: 'The company I keep', t: 'Arsenal',
        p: "On the list of clubs I've worked with, alongside Manchester City, FC Barcelona, LA Galaxy and Crewe Alexandra.",
        link: ['See who else', '../#company'] },
      { at: [61.2, 41], label: 'The Crewe scarf', k: '80 Four', t: 'Crewe Alexandra',
        p: 'The club work I did at 80 Four, the agency I co-founded.',
        stat: ['+450%', 'Fan engagement, Crewe Alexandra FC'], link: ['See the record', '../#record'] },
      { at: [51.6, 41.6], label: 'The mic', k: 'Podcasts · radio', t: 'On the mic',
        p: 'Sport, fashion and culture, and why fans fall for stories, not fixtures.',
        photo: ['radio.jpg', 'On air, at the radio desk'], link: ['Invite me on', '../book/?for=podcast'] },
      { at: [53.6, 53], label: 'The MacBook', k: 'Book Matt', t: 'Open the laptop',
        p: 'Podcasts, talks, panels, brand collaborations and press comment all start here.',
        link: ['Book Matt', '../book/'] },
    ] },
  { id: 'trophies', name: 'Trophy room', img: 'trophies.webp', focus: [50, 52], arrows: 80, alt: 'The trophy room: eight football trophies, each lit in its own walnut bay on a black marble plinth, around a bench and a football in a glass case',
    // the markers sit on the brass plates of the plinths, left to right
    things: [
      { at: [12.6, 62.4], label: 'FIFA World Cup', k: 'DAZN · FIFA', t: 'FIFA World Cup',
        p: "One of the football rights portfolios I've led at DAZN. Bringing FIFA+ across put more than three million fans onto the platform.",
        stat: ['3M+', 'FIFA+ fans brought onto DAZN'], link: ['See the record', '../#record'] },
      { at: [24.6, 57.2], label: 'Champions League', k: 'DAZN · UEFA', t: 'UEFA Champions League',
        p: "One of the football rights portfolios I've led at DAZN.", link: ['See the record', '../#record'] },
      { at: [35.1, 51.2], label: 'Serie A', k: 'DAZN', t: 'Serie A',
        p: "One of the football rights portfolios I've led at DAZN.", link: ['See the record', '../#record'] },
      { at: [44.85, 45.4], label: 'LaLiga', k: 'DAZN', t: 'LaLiga',
        p: "One of the football rights portfolios I've led at DAZN.", link: ['See the record', '../#record'] },
      { at: [54.9, 46], label: 'Copa Sudamericana', k: 'DAZN', t: 'Copa Sudamericana',
        p: "One of the football rights portfolios I've led at DAZN.", link: ['See the record', '../#record'] },
      { at: [65.85, 51.3], label: 'Bundesliga', k: 'DAZN', t: 'Bundesliga',
        p: "One of the football rights portfolios I've led at DAZN.", link: ['See the record', '../#record'] },
      { at: [76.4, 57.3], label: 'National League', k: 'DAZN', t: 'National League',
        p: "One of the football rights portfolios I've led at DAZN.",
        photo: ['national-league-awards.jpg', 'On the red carpet at the National League Awards'], link: ['See the record', '../#record'] },
      { at: [87.75, 63.5], label: 'Europa League', k: 'UEFA', t: 'UEFA Europa League',
        p: "One of the competitions I've worked on.", link: ['See the record', '../#record'] },
    ] },
  { id: 'wardrobe', name: 'Wardrobe', img: 'wardrobe.webp', focus: [52, 55], sky: { lights: [[24, 30, 26, 0.8, [1, 0.8, 0.56]], [58, 30, 22, 0.8, [1, 0.8, 0.56]], [45, 62, 28, 0.55, [1, 0.84, 0.66]]] }, alt: 'The wardrobe: walnut cabinets, a lit wall of trainers, a marble island and a rail of clothes',
    things: [
      { at: [42.4, 50.5], label: 'The race-weekend tee', k: 'F1 Miami', t: 'The tee on the island',
        p: 'A Represent tee for a race weekend in a new market. Fashion is everywhere in sport.',
        photo: ['f1-miami.jpg', 'Matt at F1 Miami in a Represent tee'], link: ['Read the story', '../#frames'] },
      { at: [64, 80], label: 'The bags', k: 'The Couture Club × Man City', t: 'Fashion meets football',
        p: 'Carrying The Couture Club into the Manchester City training ground.',
        stat: ['+41%', 'Online sales from a rebuilt e-commerce strategy'], photo: ['man-city-couture.jpg', 'Matt carrying Couture Club bags into the Manchester City training ground'], link: ['See the record', '../#record'] },
      { at: [64.6, 19.8], label: 'The spotlit pair', k: 'Tennis × sneakers', t: 'Alcaraz × Travis Scott × Nike',
        p: "The shoe Carlos Alcaraz wore on court. A sneaker drop travels further than a match report: it put a tennis player in front of the sneaker world, on that world's terms.",
        photo: ['alcaraz.jpg', 'Carlos Alcaraz walking on court in a brown Nike kit and the white and brown shoes'], link: ['Read the play', '../#plays'] },
      { at: [81.6, 53], label: 'The tracksuit', k: '2021', t: 'Gym King',
        p: 'Where the route here started, working with Tom Aspinall, Ash Cain and Alex Bowen.',
        link: ['See the route', '../#company'] },
    ] },
  { id: 'gym', name: 'Gym', img: 'gym.webp', focus: [60, 45], sky: { lights: [[37, 22, 16, 0.7, [1, 0.88, 0.72]], [35, 55, 30, 0.55, [1, 0.86, 0.7]], [70, 50, 22, 0.4, [1, 0.86, 0.7]]] }, alt: 'The gym: a punch bag, boxing gloves, a wall of medals, a treadmill by the window and a golf bag',
    things: [
      { at: [37, 24.5], label: 'The medals', k: 'Race day', t: 'Paris Marathon',
        p: 'Paris Marathon, and a 10K where you ring the bell at the finish.',
        photo: ['paris-marathon.jpg', 'Race day at the Paris Marathon'], link: ['See the stands', '../#stands'] },
      { at: [22.2, 31], label: 'The gloves', k: 'Fight night', t: 'In the crowd',
        p: "I've run talent partnerships with Conor McGregor, and with Tom Aspinall at Gym King.",
        photo: ['boxing.jpg', 'Fight night, from the crowd'], link: ['See who else', '../#company'] },
      { at: [90.6, 63], label: 'The golf bag', k: '2022', t: 'American Golf',
        p: 'Golf with Niall Horan and Judy Murray.',
        stat: ['+400%', 'Channel growth with Niall Horan & Judy Murray'], link: ['See the record', '../#record'] },
    ] },
  { id: 'rooftop', name: 'Rooftop', img: 'rooftop.webp', focus: [50, 55], sky: { outdoor: true, lights: [[44, 47, 27, 0.95, [0.8, 0.9, 1]], [95, 54, 9, 1.2, [1, 0.6, 0.3]], [62, 68, 14, 0.9, [1, 0.72, 0.42]], [30, 80, 20, 0.5, [1, 0.72, 0.42]], [86, 52, 12, 0.4, [1, 0.8, 0.6]]] }, alt: 'The roof terrace: a blue padel court with glass walls, a marble bar, and the London skyline at sunset',
    things: [
      { at: [41.6, 67], label: 'The rackets', k: 'On court', t: 'Padel',
        p: "I play it too. Four players, one small court, walls in play: it's built to be social.",
        photo: ['padel.jpg', 'Matt playing padel'], link: ['See the stands', '../#stands'] },
      { at: [44, 44], label: 'The court', k: 'The format is the product', t: 'Twenty by ten',
        p: 'Padel took tennis, shrank the court, put the walls in play and made it doubles only. Easier to pick up, better with friends.',
        stat: ['20×10', 'Metres · walls in play · always doubles'], photo: ['padel-tournament.jpg', 'Courtside at a padel tournament'], link: ['Read the story', '../#frames'] },
      { at: [65, 64], label: 'The bar', k: "Let's talk", t: 'Pull up a stool',
        p: 'Rights holders, founders, agencies, or anyone with an idea worth chasing.',
        link: ['Got five minutes?', '../book/?for=hello'] },
    ] },
  { id: 'garage', name: 'Garage', img: 'garage.webp', focus: [52, 52], alt: 'The garage: a grey sports car in a gold-lined bay, a helmet and framed lanyards on a shelf, a bike on the wall and bags on a bench',
    things: [
      { at: [38.5, 59], label: 'The car', k: 'Goodwood Festival of Speed', t: 'In the paddock',
        p: "Everyone filming. That's the story spreading before the race starts.",
        photo: ['goodwood.jpg', 'A phone held up to film a car at Goodwood Festival of Speed'], link: ['See the stands', '../#stands'] },
      { at: [9.3, 45], label: 'The helmet', k: 'F1 Miami', t: 'Race weekend',
        p: 'A race weekend in a new market. Fashion is everywhere in sport, the paddock included.',
        photo: ['f1-miami.jpg', 'Matt at F1 Miami in a Represent tee'], link: ['Read the story', '../#frames'] },
      { at: [15.8, 35], label: 'The passes', k: 'Super Bowl LV', t: 'In the building',
        p: 'I was in the building. The halftime show is part of the product.',
        photo: ['super-bowl.jpg', 'Matt at Super Bowl LV, in the stands above the field'], link: ['See the stands', '../#stands'] },
      { at: [52, 37.5], label: 'The spikes', k: 'Training', t: 'The track',
        p: 'Spikes and trainers by the door, for the track.',
        photo: ['track.jpg', 'On the running track'], link: ['See the stands', '../#stands'] },
      { at: [93.6, 40], label: 'The racket bag', k: 'On court', t: 'Tennis',
        p: 'The racket bag by the door. I play this one too.',
        photo: ['tennis.jpg', 'Matt on a tennis court'], link: ['See the stands', '../#stands'] },
      { at: [89.6, 59], label: 'The bags', k: 'Matchday', t: 'Manchester City',
        p: 'Bags packed for matchday at Manchester City.',
        photo: ['man-city-match.jpg', 'Matchday at Manchester City'], link: ['See the stands', '../#stands'] },
    ] },
];

// ---- the other places. Each is its own picture and its own kind of place; the jet is how you get between them.
const JET = [
  { id: 'jet', name: 'The cabin', img: 'jet.webp', focus: [40, 55], alt: 'The cabin of a private jet: cream leather seats, black marble tables, a row of windows over the clouds at sunrise',
    things: [
      { at: [22.8, 54.7], label: 'The laptop', k: 'Book Matt', t: 'Working from the air',
        p: 'Podcasts, talks, panels, brand collaborations and press comment all start here.', link: ['Book Matt', '../book/'] },
      { at: [84.8, 51.6], label: 'The magazines', k: 'In the press', t: 'Reading for the flight',
        p: "What's been written about the work, and about 80 Four, the agency I co-founded.", link: ['Read the press', '../#press'] },
      { at: [91, 54.6], label: 'The headphones', k: 'Podcasts · radio', t: 'On the mic',
        p: 'Sport, fashion and culture, and why fans fall for stories, not fixtures.', link: ['Invite me on', '../book/?for=podcast'] },
    ] },
];
const MIAMI = [
  { id: 'villa', name: 'The villa', img: 'miami.webp', focus: [62, 55], alt: 'A waterfront villa in Miami: a pool terrace with loungers and palms, a padel court, and a living room open to it',
    things: [
      { at: [80.8, 31.2], label: 'The pennant', k: 'Babson Park, Florida', t: 'Webber International University',
        p: 'Bachelor of Science in General Business Studies.',
        photo: ['diploma.jpg', "Matt's degree certificate from Webber International University: Bachelor of Science, General Business Studies"] },
      { at: [77.6, 41.6], label: 'The photo', k: 'Florida', t: 'Graduation day',
        p: 'Cap, gown and diploma, by the lake at Webber.',
        photo: ['graduation.jpg', 'Matt in a cap and gown on graduation day, holding his diploma by a lake in Florida'] },
      { at: [55.4, 84.4], label: 'The race pass', k: 'F1 Miami', t: 'Race weekend',
        p: 'Represent tee, race weekend in a new market. Fashion is everywhere in sport.',
        photo: ['f1-miami.jpg', 'Matt at F1 Miami in a Represent tee'], link: ['Read the story', '../#frames'] },
      { at: [60, 29.6], label: 'The court', k: 'The format is the product', t: 'Padel',
        p: "I play it too. Four players, one small court, walls in play: it's built to be social.",
        photo: ['padel.jpg', 'Matt playing padel'], link: ['Read the story', '../#frames'] },
    ] },
];
const MONACO = [
  { id: 'yacht', name: 'The yacht', img: 'monaco.webp', focus: [55, 55], alt: 'The deck of a yacht in Monaco harbour on race weekend: a curved sofa, a bar, and racing cars passing the grandstands on the quay',
    things: [
      { at: [50.4, 65.2], label: 'The race programme', k: 'Story before sport', t: 'Race weekend',
        p: 'Drive to Survive turned box-set watchers into F1 fans. They came for the people and stayed for the racing.',
        link: ['Read the story', '../#frames'] },
      { at: [92.4, 26.6], label: 'The circuit', k: 'F1 × Netflix', t: 'A play worth stealing',
        p: 'F1 let the cameras into the paddock and handed the story to Netflix: the rivalries, the team bosses, the drivers as people.',
        link: ['Read the play', '../#plays'] },
    ] },
];

// The places, in the order Explore lists them. `name` and `place` make the line in the header. The one marked `hub` is the
// jet: from it you choose where to land. A new place is another entry here.
export const LOCATIONS = [
  { id: 'penthouse', name: 'The penthouse', place: 'London', rooms: PENTHOUSE },
  { id: 'jet', name: 'The jet', place: 'In the air', hub: true, rooms: JET },
  { id: 'miami', name: 'The villa', place: 'Miami', rooms: MIAMI },
  { id: 'monaco', name: 'The yacht', place: 'Monaco', rooms: MONACO },
];
