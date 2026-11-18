---
name: story-scout
description: Every morning, find the three best stories from the last few days that Matt King could turn into a Writing article on bymattking.com - sport, marketing, fashion, music, gaming and culture moments with a lesson worth stealing. Use when asked for the morning story scout, today's story ideas, or what to write about next.
---

# Story scout

Find the three best stories from the **last 72 hours** that Matt could turn into a weekly article, and send them to him ranked. He picks one, and that becomes the next piece on bymattking.com/writing/.

## Who this is for, and why

Matt King is a global sports marketing leader (football at DAZN), based between London and Manchester. His site exists to make him known as an industry leader: someone who sees what's going on in sport, marketing and culture before others do, and explains why it works in plain words.

His worldview: **sport's next fans already exist, they're just not watching yet.** His three ideas:
- **Dormant demand**: the gap between how many people care about a sport's people and how many watch the sport.
- **The side door**: reach new fans through what they already love (music, fashion, creators, games), then put the sport in that world.
- **Idols sell, influencers inform**: who carries the message decides whether people notice or buy.

He also writes about **the clipping economy** (fans and creators share most of the sport people see) and **AI as the pit crew, not the driver**.

Good examples of the vibe, already written (check `exposure/posts/` so you never repeat one):
- Central Cee hiding a new song on GTA VI's radio for fans to find.
- Taylor Swift going to Chiefs games and a new audience following her.
- Drive to Survive selling F1's people, not its races.
- Alcaraz previewing Travis Scott's Nike tennis shoe.
- Baller League rebuilding football for streams and clips.

## What makes a great story

A story does not have to be "marketing" on paper. It has to be a moment where **culture, attention and fans** did something interesting, and where Matt can say *why it worked and what others can steal from it*.

Look across:
- **Sport × culture:** athlete fashion, tunnel fits, kit launches and leaks, walk-out songs, athletes in music videos, games and films.
- **Campaigns and stunts:** surprise drops, guerrilla moments, hidden easter eggs, clever sponsorships, brand collabs, out-of-home that went viral.
- **Music and gaming:** premieres inside games, artist × club or brand crossovers, halftime and stadium shows, Fortnite/Roblox/GTA moments.
- **Creators and formats:** creator leagues, streamers at sporting events, new formats, docuseries, clipping culture.
- **Fashion and drops:** collabs that sold out, resale frenzies, a footballer moving a product.
- **Fan culture:** chants going viral, fan-made content, a club or league leaning into a meme.

Football is the priority sport, with a UK angle a bonus, but any sport or culture story works if the lesson travels.

**Score each candidate (1 to 5) on:**
1. **Fresh**: happened or broke in the last 72 hours.
2. **Surprising**: makes people say "wait, what?" and want to share it.
3. **A lesson to steal**: it ends in a clear "Steal this" for sport or brands.
4. **Fits Matt**: sport, marketing or culture; bonus if it connects to one of his three ideas.
5. **Verifiable**: at least two credible sources (or one primary source, such as the brand, artist, club or league).
6. **Visual**: there is an obvious cover image idea.

Rank by total. Prefer a spread across Sport, Marketing and Culture over three of one kind.

**Avoid:** anything about DAZN itself or its rights deals, and anything confidential; politics, tragedies, crime, scandals or legal disputes; betting promotions; pure transfer gossip or results with no culture angle; rumours with only one weak source (unless clearly flagged as unconfirmed); anything already in `exposure/posts/` or `.claude/skills/story-scout/log.md`.

## How to search

Use `WebSearch` with `mode: "extended"` for the main sweeps; send several searches in the same turn. Search the last few days specifically (include the current month and year, and words like "this week"). Cover at least:
- Marketing and advertising trade press: The Drum, Campaign, Marketing Week, Adweek, Ad Age, Marketing Beat.
- Sport business: SportBusiness, SportsPro, The Athletic, Front Office Sports, Sportico, Sport Industry Group.
- Culture, music and fashion: Hypebeast, Highsnobiety, Complex, GQ, Dazed, NME, Billboard, Mixmag, The Face, Vogue Business, The Business of Fashion.
- Games and creators: The Verge, IGN, Dexerto, Polygon.
- UK culture: GRM Daily, Mixtape Madness, UK Rap Daily, The Tab, Joe.
- Social chatter: Reddit (r/soccer, r/football, r/sneakers, r/streetwear, r/marketing, r/advertising, r/hiphopheads, r/ukdrill, r/GamingLeaksAndRumours, r/formula1, r/nba), X and TikTok coverage, via search results.

Then use `WebFetch` on the most promising articles to confirm the facts. Some hosts can't be opened from this cloud session (Reddit, and some news sites). When a fetch fails, rely on search results and other sources, and say which sources you could not open.

## What to send Matt

Lead with a single line: **"Morning. Three stories for today's piece."** Then, for each of the top three:

**1. [Working headline in Matt's style, e.g. "Central Cee, GTA VI and the song you have to find"]**
- **What happened:** two or three plain sentences, with the date.
- **Why it's a Matt piece:** the angle and the lesson, in one or two sentences.
- **Topic:** Sport, Marketing or Culture. **Connects to:** an idea, or "none".
- **Steal this:** the one-line takeaway.
- **Cover idea:** what image would work.
- **Confidence:** what is confirmed, and what is reported or unconfirmed.
- **Sources:** two to four links.

Then **"Also worth a look"**: two or three runners-up, one line each with a link.

End with: **"Reply with 1, 2 or 3 (or a mix) and I'll write it up for the preview."**

Keep it tight, scannable and in plain words: no jargon, short sentences, British spelling.

## After sending

Append today's date and the headlines you suggested (top three and runners-up) to `.claude/skills/story-scout/log.md`, so nothing is suggested twice. When Matt picks one, write it as an article following `exposure/posts/README.md` (around 700 to 1,000 words, headed sections, a pull quote, a numbered "Steal this"), put it on the preview, and wait for his go-ahead before it goes live.
