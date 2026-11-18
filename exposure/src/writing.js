// The thinking: the big claim, the three ideas, and the talks. Weekly articles live in posts/, one file each.
// tools/pages.mjs turns each piece into its own page, so each one can be found by searching for its name.
// Edit the words here, then run the build. Plain words, short sentences, nothing a ten-year-old would trip on.
//
// Article bodies are a list of blocks:
//   ['h', 'A heading']             a section heading
//   ['p', 'A paragraph']           a paragraph (may hold <em> and <a>)
//   ['q', 'A line worth quoting']  a pull quote
//   ['steps', [[title, detail]]]   numbered steps
//   ['list', ['one', 'two']]       a plain list

export const PUBLISHED = '2026-11-18';
// The Substack address, once it exists (e.g. 'https://mattking.substack.com'). Left empty, no sign-up is shown.
export const SUBSTACK = '';

// The one claim everything sits under
export const CLAIM = {
  h: "Sport's next fans already <em>exist.</em>",
  sub: "They're just not watching yet.",
  p: 'Three ideas sit under everything I do. One names the problem, one is the way in, and one is about who carries the message.',
};

// The three ideas. id is the page address: /thinking/<id>/
// photo: [file in public/photos, caption title, caption line, alt text, focus]
export const IDEAS = [
  {
    id: 'dormant-demand', n: '01', kind: 'The problem', name: 'Dormant demand', read: 6,
    title: ['Dormant', '<em>demand.</em>'],
    define: "Dormant demand is the gap between how many people care about a sport's people and how many watch the sport itself.",
    intro: "Millions of people already care about sport's people. Most of them never watch the sport. That gap is the biggest opportunity in sports marketing.",
    desc: "Dormant demand is the gap between how many people care about a sport's people and how many watch the sport. Matt King on how to find it, and how to wake it up.",
    photo: ['goodwood.jpg', 'Goodwood Festival of Speed', 'Everyone filming. The interest is there before the race starts.', 'A phone held up to film a car at Goodwood Festival of Speed'],
    body: [
      ['h', 'The gap nobody measures'],
      ['p', 'Sport is very good at counting the people who turn up. Tickets, viewers, subscribers, followers of the official account. It is much worse at counting the people who care but never turn up.'],
      ['p', "They follow a player. They watch the press conference clip. They wear the shirt because it looks good. They know the rivalry from the group chat. They have never sat through a full match. That isn't a lack of demand. It's demand with nowhere to go."],
      ['q', "It isn't a lack of demand. It's demand with nowhere to go."],
      ['h', 'You can see it everywhere'],
      ['p', 'Cristiano Ronaldo has more than 600 million followers on Instagram. Only a small slice of them watch the league he plays in. They care about him, not the fixture list.'],
      ['p', 'When Caitlin Clark moved to the WNBA, people who had never watched women\'s basketball started tuning in to watch her. The league didn\'t create those fans from nothing. They were already there, following a person.'],
      ['p', 'When a player becomes a national story, like Alexandra Eala in the Philippines, a whole country starts caring about tennis it never used to watch. The interest came first. The player gave it somewhere to go.'],
      ['p', 'And a press conference line, a tunnel fit or a reaction shot can travel further than the match it came from. The attention is real. It just isn\'t pointed at the product yet.'],
      ['h', 'Why it stays asleep'],
      ['steps', [
        ['Sport sells the fixture. People buy the person.', 'Most sport marketing leads with dates, times and kick-offs. New fans are drawn to personalities, rivalries and stories.'],
        ['The door is the wrong size.', 'Ninety minutes, a subscription and a rulebook is a lot to ask of someone who is only curious.'],
        ['It lives in the wrong place.', "A sport's own channels mostly reach people who already follow the sport. The dormant fans are somewhere else."],
      ]],
      ['h', 'How to wake it up'],
      ['steps', [
        ['Find it', 'Look outside your own numbers. Who follows your players but not you? What gets searched, clipped and shared? Who wears the shirt and has never been to a game?'],
        ['Name who they are', 'Work out what they love instead: an artist, a creator, a fashion scene, a national hero. That is where they spend their time.'],
        ['Build a smaller door', "Don't start with the full match. Start with a clip, a fit, a creator series, a shorter format. Something they can say yes to today."],
        ['Give them a reason to come back', 'A story with a next episode. A weekly ritual. A side to be on. That is how curiosity turns into a habit.'],
      ]],
      ['p', 'Finding the door is the next idea: <a href="../the-side-door/">culture is the side door</a>. Who you send through it is the third: <a href="../idols-sell-influencers-inform/">idols sell, influencers inform</a>.'],
      ['h', 'Measuring it'],
      ['p', "I'm building a simple, public measure of dormant demand: how many people follow and search for a sport's people, compared with how many watch the sport. It will be built only from public numbers, and I'll publish it here once a year. The first edition is in the works."],
    ],
  },
  {
    id: 'the-side-door', n: '02', kind: 'The way in', name: 'The side door', read: 6,
    title: ['Culture is', 'the <em>side door.</em>'],
    define: 'The side door is reaching new fans through what they already love, like music, fashion and creators, and then putting the sport in that world.',
    intro: "Nobody walks in through the front door of a sport they don't follow. So go round the side, through the music, fashion and creators they already love.",
    desc: 'Culture is the side door: Matt King on reaching new sports fans through the music, fashion and creators they already love, and the four questions behind every brief.',
    photo: ['super-bowl.jpg', 'Super Bowl LV', 'I was in the building. The halftime show is part of the product.', 'Matt at Super Bowl LV, in the stands above the field', 'center 86%'],
    body: [
      ['h', 'The front door is for fans'],
      ['p', "Every sport has a front door: the fixtures, the broadcast, the club's own channels. It works brilliantly for people who already care. For everyone else it's shut. They don't know the players, don't follow the league, and don't want to learn the rules before they've had any fun."],
      ['h', 'The side door is already open'],
      ['p', 'People rarely get into a sport through the sport. They get in through something they already love.'],
      ['list', [
        'Taylor Swift fans started watching the NFL because Taylor Swift started going to games.',
        'Box-set watchers got into Formula 1 through Drive to Survive.',
        "Sneaker people looked at tennis because Carlos Alcaraz previewed Travis Scott's Nike shoe.",
        'Millions watch the Super Bowl for the halftime show. The music is part of the product.',
      ]],
      ['q', "People don't get into a sport through the sport."],
      ['h', 'The four questions behind every brief'],
      ['p', 'This is how I build a side door. Four questions, in this order.'],
      ['steps', [
        ['Who do we want?', "Fans we already have, or fans we don't? The answer changes everything that follows."],
        ['What do they already love?', 'Music, fashion, sneakers, creators, gaming, film and TV, nightlife, food. Go where their time already goes.'],
        ['What do we have?', 'The sport, the athletes and the stories. Usually more than we use.'],
        ['What does it become?', 'Tunnel fits, drops and collabs, a creator series, a new format, a music moment, a local hero. And, if it works, new fans.'],
      ]],
      ['h', 'Three side doors that keep working'],
      ['p', '<strong>Fashion.</strong> The tunnel is the new runway. NBA arrivals, the F1 paddock, the walk into training: every arrival is a fit check, and fashion audiences watch closely.'],
      ['p', '<strong>Music.</strong> The kick-off can be a concert. An artist with a fanbase in a new market can open that market faster than any advert.'],
      ['p', '<strong>Creators and formats.</strong> Change the format and you change who turns up. Baller League built six-a-side football for streams and clips, with creators in the dugouts. Padel shrank the court and made it social. The sport stays the same and the door gets wider.'],
      ['h', 'Where it goes wrong'],
      ['p', "A side door that leads nowhere. If the culture moment has no route back to the sport, you've bought attention, not fans. Every side door needs a hallway: the next clip, the next episode, the next game worth watching."],
      ['p', 'And forcing it. Put an athlete in a world that doesn\'t suit them and it reads as an advert. That is why the casting matters as much as the idea. More on that in <a href="../idols-sell-influencers-inform/">idols sell, influencers inform</a>.'],
    ],
  },
  {
    id: 'idols-sell-influencers-inform', n: '03', kind: 'Who carries it', name: 'Idols sell, influencers inform', read: 5,
    title: ['Idols sell,', 'influencers <em>inform.</em>'],
    define: 'Influencers tell people a product exists. Idols make people want to be part of it. If you need people to buy, cast an idol.',
    intro: "At The Couture Club, influencers sold the womenswear. The menswear didn't move until footballers wore it. Then it sold out.",
    desc: "Idols sell, influencers inform: what Matt King learned when The Couture Club's menswear only sold out once footballers wore it, and how to cast talent that actually sells.",
    photo: ['foden-couture.jpg', 'Phil Foden × The Couture Club', 'The menswear moved when footballers wore it.', 'Phil Foden in The Couture Club store'],
    body: [
      ['h', 'What happened'],
      ['p', 'At The Couture Club, the womenswear grew with influencers. They posted, their followers bought, and it worked.'],
      ['p', "So we ran the same play for the menswear. Influencers posted, people saw it, and not much happened. Then footballers started wearing it. Players in the store, players arriving at training in it. The menswear sold out. Working with Molly-Mae Hague and Phil Foden, reach went up 600%."],
      ['p', 'Same brand, same quality, same price. The only thing that changed was who was wearing it.'],
      ['q', 'An influencer is someone you watch. An idol is someone you want to be.'],
      ['h', 'Why it works'],
      ['p', 'Influencers are brilliant at information. They tell you something exists, show you how it fits and where to get it. That gets people to notice.'],
      ['p', "Idols work on identity. Wearing what they wear says something about who you are. A lot of young men don't take style cues from fashion creators. They take them from the players they grew up watching. That gets people to buy."],
      ['h', 'The idol has to fit'],
      ['p', "This isn't about the biggest name. Lamine Yamal and Bad Bunny are both huge. Neither works unless the idea fits who they are. The right voice for the idea beats the biggest name that doesn't fit it."],
      ['h', 'How I cast'],
      ['steps', [
        ['Decide the job first', 'Awareness, or sales and belonging? Influencers inform, and they are efficient at it. For sales, find an idol whose world matches the product. Often you need both, in that order.'],
        ['Give them their voice', 'Talent are the storytellers. My job is the brief and the platform, not their script. If you have to script them, you picked the wrong person.'],
        ['Every pick needs a reason', 'A surprising pick can be the best one. A pick nobody can explain never is.'],
        ['Borrow the audience you want', "Choose partners for the people who follow them, especially the ones who don't watch the sport yet."],
        ['Local heroes travel', 'Lead with who each market already loves. Ohtani in Japan opens doors no global advert can.'],
      ]],
      ['p', 'The full list is in <a href="../#rules">the eleven rules I cast talent by</a>.'],
    ],
  },
];

// Speaking: the talks, the formats and where Matt has been heard
export const TALKS = [
  { n: '01', idea: 'dormant-demand', h: "Sport's next fans aren't watching yet", p: "Dormant demand: what it is, how to find it in your own audience, and four ways to wake it up.", for: 'Leagues, clubs and rights holders' },
  { n: '02', idea: 'the-side-door', h: 'Go round the side', p: 'How music, fashion and creators bring in the fans sport can\'t reach on its own, and the four questions behind every brief.', for: 'Brands, agencies and marketing teams' },
  { n: '03', idea: 'idols-sell-influencers-inform', h: 'Idols sell, influencers inform', p: 'What happened when footballers wore the menswear, and how to cast talent that actually sells.', for: 'Brands, talent teams and creators' },
];
export const ALSO = ['The clipping economy', 'AI in marketing', 'Social media for businesses', 'Athlete and talent partnerships', 'From college soccer in Florida to football marketing'];
export const FORMATS_SPEAK = [['Keynote', '20 to 40 minutes on one idea'], ['Panel', 'Sport, culture, fans and marketing'], ['Podcast', 'Long-form or a quick guest slot'], ['Guest lecture', 'Universities and courses'], ['Press comment', 'Sports marketing, fans and culture']];
// [where, year, what it was about, photo]
export const HEARD = [['The Cat Radio', '2026', 'Guest marketing expert, on the impact of social media on businesses.', 'radio.jpg']];
