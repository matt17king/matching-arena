// Turns content.js into markup. No behaviour here; main.js wires it up afterwards.
import { EMAIL, HERO, PREMISE, CHAPTERS, RUNWAY, PLAYS, BRIEF, DRIVE, RULES, FORMATS, MARKETS, KIT, LINEUP, FILM, RECORD, RIGHTS, ROUTE, STANDS, WORKED_WITH, TALENT, PRESS, SEATS, TOPICS } from './content.js';

const B = import.meta.env.BASE_URL;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pad2 = n => String(n).padStart(2, '0');
const fill = (name, html) => { const el = document.querySelector(`[data-list="${name}"]`); if (el) el.innerHTML = html; };
const lines = (arr, cls = '') => arr.map((l, i) => `<span class="ln ${cls}" style="--i:${i}"><span>${l}</span></span>`).join('');
const mail = (subject = '') => `mailto:${EMAIL}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`;
const logo = (f, name) => `<i class="lg" role="img" aria-label="${esc(name)}" style="-webkit-mask-image:url('${B}logos/${f}');mask-image:url('${B}logos/${f}')"></i>`;
const print = ([f, title, line, alt], i = 0) => `<figure class="print" style="--i:${i}">
  <div class="print-in"><img src="${B}photos/${f}" alt="${esc(alt || title)}" loading="lazy" decoding="async"></div>
  <figcaption><b>${esc(title)}</b><span>${esc(line)}</span></figcaption>
</figure>`;

// one story beat. side: where the words sit (the 3D subject takes the other side). vh: how much scroll it owns.
const beat = (id, side, ch, inner, { vh = 120, cls = '' } = {}) => `<section class="beat ${cls}" data-beat="${id}" data-side="${side}" data-ch="${ch}" style="--vh:${vh}"><div class="card">${inner}</div></section>`;
const pass = (id, ch, vh = 90) => `<div class="beat pass" data-beat="${id}" data-ch="${ch}" style="--vh:${vh}" aria-hidden="true"></div>`;
const chapter = (c, id, side, vh = 130) => beat(id, side, c.id, `
  <p class="mono k"><i></i><span>${c.n} / 05</span><span>${esc(c.sport)}</span></p>
  <h2 class="d d-ch" id="${c.id}">${lines(c.title)}</h2>
  <p class="lead rv" style="--i:3">${esc(c.intro)}</p>`, { vh, cls: 'beat-ch' });

function journey() {
  const [fb, bb, nfl, tn, ms] = CHAPTERS;
  const h = [];
  // opening
  h.push(`<section class="beat hero" data-beat="hero" data-side="l" data-ch="top" style="--vh:100">
    <div class="hero-in">
      <h1 class="d d-hero"><span class="vh">Matt King: </span>${lines(HERO.lines)}</h1>
      <div class="hero-meta">
        <p class="mono rv" style="--i:4">${esc(HERO.tags)}</p>
        <p class="mono rv" style="--i:5">${esc(HERO.role)}</p>
        <div class="hero-cta rv" style="--i:6"><a class="btn btn-red" href="#book"><span>Let's talk</span><i aria-hidden="true">→</i></a><a class="btn btn-line" href="#football"><span>${esc(HERO.cue)}</span><i aria-hidden="true">↓</i></a></div>
      </div>
    </div>
  </section>`);
  h.push(beat('premise', 'r', 'top', `
    <p class="mono k"><i></i><span>The idea</span></p>
    <h2 class="d d-st">${lines(PREMISE.lines)}</h2>
    <p class="lead rv" style="--i:3">Most sports marketing assumes people will just watch. I don't. I look for the story off the pitch, and for the side doors into it: music, fashion, sneakers, creators.</p>
    <p class="note mono rv" style="--i:4">${esc(PREMISE.note)}</p>`, { vh: 150, cls: 'beat-st' }));
  h.push(pass('fb-drop', 'top', 80));

  // 01 football
  h.push(chapter(fb, 'fb-title', 'l'));
  h.push(pass('fb-tunnel', fb.id, 80));
  h.push(beat('fb-fit', 'r', fb.id, `
    <p class="mono k"><i></i><span>${esc(RUNWAY.k)}</span></p>
    <h3 class="h3">${lines([esc(RUNWAY.h)])}</h3>
    <p class="rv" style="--i:1">${esc(RUNWAY.p)}</p>`, { cls: 'paper' }));
  h.push(beat('fb-photo', 'l', fb.id, `<div class="prints">${RUNWAY.photos.map(print).join('')}</div>`, { cls: 'beat-ph', vh: 140 }));

  // 02 basketball
  h.push(chapter(bb, 'bb-title', 'l'));
  h.push(pass('bb-door', bb.id, 80));
  PLAYS.forEach((p, i) => h.push(beat(`bb-play${i + 1}`, 'l', bb.id, `
    <p class="mono k"><i></i><span>Play ${p.n} / 03</span>${i === 0 ? '<span>Three plays I keep coming back to</span>' : ''}</p>
    <p class="sum" aria-label="${esc(p.rows.join(' × '))}">${p.rows.map((r, k) => `${k ? '<i aria-hidden="true">×</i>' : ''}<span class="rv" style="--i:${k}">${esc(r)}</span>`).join('')}</p>
    <p class="eq rv" style="--i:3"><i aria-hidden="true">=</i>${esc(p.x)}</p>
    <h3 class="h4 rv" style="--i:4">${esc(p.h)}</h3>
    <p class="rv" style="--i:5">${esc(p.s)}</p>${i === 2 ? print(BRIEF.photo, 5) : ''}`, { vh: i === 2 ? 120 : 100, cls: 'beat-play paper' })));
  h.push(pass('bb-shot', bb.id, 90));
  h.push(beat('bb-brief', 'l', bb.id, `
    <p class="mono k"><i></i><span>${esc(BRIEF.k)}</span></p>
    <h3 class="h3">${lines([esc(BRIEF.h)])}</h3>
    <p class="rv" style="--i:1">${esc(BRIEF.p)}</p>
    <ol class="brief">${BRIEF.steps.map(([n, hh, chips, hot], i) => `<li class="rv${hot ? ' hot' : ''}" style="--i:${i + 2}"><div class="brief-k"><span class="mono">${n}</span><b>${esc(hh)}</b></div><div class="chips">${chips.map(c => `<span>${esc(c)}</span>`).join('')}</div></li>`).join('')}</ol>
`, { vh: 140, cls: 'beat-brief paper' }));

  // 03 NFL
  h.push(chapter(nfl, 'nfl-title', 'l'));
  DRIVE.forEach((s, i) => h.push(beat(`nfl-d${i + 1}`, 'r', nfl.id, `
    <p class="mono k"><i></i><span>${esc(s.down)}</span><span>Stage ${pad2(i + 1)} / 07</span>${i === 0 ? '<span>How a fan is made</span>' : ''}</p>
    <h3 class="d d-stage">${lines([esc(s.name)])}</h3>
    <p class="role rv" style="--i:1">${esc(s.role)}</p>
    <p class="rv" style="--i:2">${esc(s.detail)}</p>
    <ol class="chain" aria-hidden="true">${DRIVE.map((_, k) => `<li class="${k < i ? 'done' : k === i ? 'on' : ''}"></li>`).join('')}</ol>`, { vh: i === 6 ? 110 : 82, cls: 'beat-stage paper' })));
  h.push(`<section class="beat beat-rules paper" data-beat-top="nfl-xi" data-beat-bottom="nfl-xi-end" data-side="l" data-ch="${nfl.id}">
    <div class="card">
      <div class="rules-h"><p class="mono k"><i></i><span>The huddle</span></p><h3 class="h3">${lines(['Eleven rules', 'I cast talent by'])}</h3></div>
      <ol class="rules">${RULES.map(([t, why], i) => `<li data-rule="${i}"><span class="mono">${pad2(i + 1)}</span><div><h4>${esc(t)}</h4><p>${esc(why)}</p></div></li>`).join('')}</ol>
    </div>
  </section>`);

  // 04 tennis
  h.push(chapter(tn, 'tn-title', 'l'));
  h.push(pass('tn-land', tn.id, 90));
  FORMATS.forEach((f, i) => h.push(beat(`tn-f${i + 1}`, i === 1 ? 'r' : 'l', tn.id, `
    <p class="mono k"><i></i><span>${esc(f.k)} / 03</span></p>
    <p class="stat rv"><b>${esc(f.stat)}</b><span class="mono">${esc(f.unit)}</span></p>
    <h3 class="h3">${lines([esc(f.h)])}</h3>
    <p class="rv" style="--i:2">${esc(f.p)}</p>
    ${f.photo ? print(f.photo, 3) : ''}`, { vh: f.photo ? 160 : 130, cls: 'beat-format paper' })));

  // 05 motorsport
  h.push(chapter(ms, 'ms-title', 'r'));
  h.push(pass('ms-lights', ms.id, 90));
  h.push(beat('ms-markets', 'r', ms.id, `
    <p class="mono k"><i></i><span>${esc(MARKETS.k)}</span></p>
    <h3 class="h3">${lines([esc(MARKETS.h)])}</h3>
    <p class="rv" style="--i:1">${esc(MARKETS.p)}</p>
    <ol class="grid7">${MARKETS.list.map((m, i) => `<li class="rv" style="--i:${i + 2}"><span class="mono">P${i + 1}</span>${esc(m)}</li>`).join('')}</ol>`, { vh: 140, cls: 'paper' }));
  h.push(beat('ms-photo', 'l', ms.id, `<div class="prints">${MARKETS.photos.map(print).join('')}</div>`, { cls: 'beat-ph', vh: 140 }));
  h.push(beat('ms-ai', 'r', ms.id, `
    <p class="mono k"><i></i><span>The pit wall</span></p>
    <ul class="kit">${KIT.map((k, i) => `<li class="rv" style="--i:${i}"><p class="mono kit-tag">${esc(k.tag)}</p><h3 class="h4">${esc(k.title)}</h3><p>${esc(k.detail)}</p><p class="mono kit-tools">${esc(k.tools)}</p></li>`).join('')}</ul>`, { vh: 150, cls: 'beat-kit paper' }));

  // the line-up
  h.push(`<section class="beat lineup" data-beat="lineup" data-side="c" data-ch="lineup" style="--vh:130">
    <div class="card">
      <p class="mono k"><i></i><span>The line-up</span></p>
      <h2 class="d d-st">${lines(LINEUP.lines)}</h2>
      <p class="lead rv" style="--i:3">${esc(LINEUP.note)}</p>
    </div>
    <ol class="lineup-l">${CHAPTERS.slice().reverse().map((c, i) => `<li class="rv" style="--i:${i + 3}"><a href="#${c.id}"><span class="mono">${c.n} ${esc(c.sport)}</span><b>${esc(c.plain)}</b></a></li>`).join('')}</ol>
  </section>`);
  return h.join('');
}

export function render() {
  fill('journey', journey());
  fill('index', [['top', '00', 'Start', 'Off the pitch'], ...CHAPTERS.map(c => [c.id, c.n, c.sport, c.plain]), ['plays', '06', 'The film room', 'Plays worth stealing'], ['record', '07', 'The record', 'Proof, not theory'], ['company', '08', 'The company', "Who I've worked with"], ['stands', '09', 'In the stands', 'A fan first'], ['book', '10', 'Book Matt', 'Pull up a chair']]
    .map(([id, n, k, t]) => `<li><a href="#${id}" data-ix-link><span class="mono">${n}</span><b>${esc(t)}</b><i class="mono">${esc(k)}</i></a></li>`).join(''));
  fill('film', FILM.map((f, i) => `<article class="fm" style="--i:${i}">
    <header><span class="mono">${pad2(i + 1)}</span><span class="mono fm-tag">${esc(f.tag)}</span></header>
    <h3 class="h3">${esc(f.title)}</h3>
    <dl><div><dt class="mono">The play</dt><dd>${esc(f.play)}</dd></div><div><dt class="mono">Why it worked</dt><dd>${esc(f.why)}</dd></div><div class="steal"><dt class="mono">What I'd steal</dt><dd>${esc(f.steal)}</dd></div></dl>
  </article>`).join(''));
  fill('record', RECORD.map(([v, what, where], i) => `<li style="--i:${i}"><b class="rec-v" data-count="${esc(v)}">${esc(v)}</b><p>${esc(what)}</p><span class="mono">${esc(where)}</span></li>`).join(''));
  const tick = RIGHTS.map(r => `<span>${esc(r)}</span><i aria-hidden="true"></i>`).join('');
  fill('rights', `<div>${tick}</div><div aria-hidden="true">${tick}</div>`);
  fill('route', ROUTE.map(([y, n, f], i) => `<li style="--i:${i}"><span class="mono">${y}</span>${logo(f, n)}<b>${esc(n)}</b></li>`).join(''));
  fill('logos', WORKED_WITH.map(([n, f], i) => `<li style="--i:${i}">${logo(f, n)}<span class="mono">${esc(n)}</span></li>`).join(''));
  fill('talent', TALENT.map(([n, w], i) => `<li style="--i:${i}"><b>${esc(n)}</b><span class="mono">${esc(w)}</span></li>`).join(''));
  fill('stands', `<figure class="snap snap-me"><div class="snap-in"><img src="${B}photos/portrait.jpg" alt="Matt King" loading="lazy" decoding="async"></div><figcaption class="mono"><b>Matt King</b><span>No. 17</span></figcaption></figure>` +
    STANDS.map(([f, t, l]) => `<figure class="snap"><div class="snap-in"><img src="${B}photos/${f}" alt="${esc(t)}: ${esc(l)}" loading="lazy" decoding="async" draggable="false"></div><figcaption class="mono"><b>${esc(t)}</b><span>${esc(l)}</span></figcaption></figure>`).join(''));
  fill('press', PRESS.map(p => `<article class="pr"><div class="pr-img"><img src="${B}photos/${p.img}" alt="${esc(p.alt)}" style="object-position:${p.pos}" loading="lazy" decoding="async"></div><div class="pr-t"><p class="mono"><span>${esc(p.source)}</span><span>${esc(p.date)}</span></p><h3 class="h3">${esc(p.headline)}</h3><p>${esc(p.line)}</p></div></article>`).join('') +
    `<article class="pr pr-air"><div class="pr-img"><img src="${B}photos/radio.jpg" alt="Matt in a radio studio" style="object-position:center 35%" loading="lazy" decoding="async"></div><div class="pr-t"><p class="mono"><span>On air</span><span>Radio</span></p><h3 class="h3">On air</h3><p>Sport, fashion and culture, on the radio.</p></div></article>`);
  fill('seats', SEATS.map(([what, line, subject, ask], i) => `<li style="--i:${i}"><a href="${mail(subject)}"><span class="mono">${pad2(i + 1)}</span><b>${esc(ask)}</b><span class="seat-w"><em>${esc(what)}</em>${esc(line)}</span><i aria-hidden="true">→</i></a></li>`).join(''));
  fill('topics', TOPICS.map(t => `<li>${esc(t)}</li>`).join(''));
  document.querySelectorAll('[data-mail]').forEach(a => { a.href = mail(); });
  // headings in the static sections get the same line-by-line reveal
  document.querySelectorAll('[data-split]').forEach(el => { el.innerHTML = `<span class="ln"><span>${el.innerHTML}</span></span>`; });
}
