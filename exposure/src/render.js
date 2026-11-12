// Turns content.js into markup. No behaviour here; main.js wires it up afterwards.
import { FRAMES, RUNWAY, PLAYS, BRIEF, JOURNEY, RULES, FORMATS, MARKETS, KIT, FILM, RECORD, RIGHTS, ROUTE, STANDS, WORKED_WITH, TALENT, PRESS, SEATS, TOPICS, BOOK } from './content.js';

const B = import.meta.env.BASE_URL;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pad2 = n => String(n).padStart(2, '0');
const $ = s => document.querySelector(s);
const fill = (name, html) => { const el = $(`[data-list="${name}"]`); if (el) el.innerHTML = html; };
const plain = t => t.join(' ').replace(/<\/?em>/g, '');

// A photo in two layers: colour underneath, the black-and-blue print on top. Hover, focus or tap develops it.
const photo = ([f, title, line, alt], cls = '') => `<figure class="ph ${cls}" data-r="photo">
  <div class="ph-in" tabindex="0"><img src="${B}photos/${f}" alt="${esc(alt || title)}" loading="lazy" decoding="async"><div class="ph-duo" aria-hidden="true"><img src="${B}photos/${f}" alt="" loading="lazy" decoding="async"></div></div>
  <figcaption><b>${esc(title)}</b><span>${esc(line)}</span></figcaption>
</figure>`;
const logo = (f, name) => `<i class="lg" role="img" aria-label="${esc(name)}" style="-webkit-mask-image:url('${B}logos/${f}');mask-image:url('${B}logos/${f}')"></i>`;
// A number that proves the idea it sits beside
const stat = ([v, what, where], cls = '') => `<div class="bc bc-stat ${cls}" data-r="fade" style="--d:.1s"><p class="mono"><span>Proof</span><span>${esc(where)}</span></p><div><b data-count="${esc(v)}">${esc(v)}</b><p>${esc(what)}</p></div></div>`;

// A frame's title card is pinned for a moment while its photo comes out of the blur beside the title.
// The <img> is only a placeholder for position (and the fallback without WebGL); the field draws the photo itself.
const card = (f, i) => `<header class="pin fr-pin" style="--len:.85" data-scene data-blob="${['.2,.82,.95,.1', '.85,.2,.1,.9', '.25,.2,.9,.85', '.15,.8,.95,.15', '.8,.15,.1,.9'][i]}" data-energy="1">
  <div class="pin-in fr-card">
    <figure class="fr-ph" data-fr-ph><img src="${B}photos/${f.photo[0]}" alt="${esc(f.photo[3])}" decoding="async"><figcaption class="mono"><b>${esc(f.photo[1])}</b><span>${esc(f.photo[2])}</span></figcaption></figure>
    <div class="fr-meta mono"><span>Frame ${f.n} / 05</span></div>
    <h2 class="fr-title" data-r="smear" data-split data-smear="46">${f.title.map(l => `<span class="ln">${l.replace('<em>', '<em class="hi">')}</span>`).join(' ')}</h2>
    <p class="fr-intro lead" data-r="fade" style="--d:.25s">${esc(f.intro)}</p>
  </div>
</header>`;

const BODY = {
  runway: () => `
  <div class="blk bento">
    <div class="bc bc-text" data-r="fade"><p class="mono">Arrivals</p><div><h3 class="h3">${esc(RUNWAY.h)}</h3><p class="lead">${esc(RUNWAY.p)}</p></div></div>
    ${stat(RUNWAY.stat)}
  </div>`,

  'side-door': () => `
  <div class="pin px" style="--len:2.3" data-pin="plays">
    <div class="pin-in">
      <div class="px-head"><p class="mono">Three plays I keep coming back to</p><p class="mono" data-px-n>Play 01 / 03</p></div>
      <div class="px-stage">${PLAYS.map((p, i) => `<article class="dx" data-px="${i}">
        <p class="dx-names" aria-label="${esc(p.rows.join(' × '))}">${p.rows.map((r, k) => `${k ? '<i aria-hidden="true">×</i>' : ''}<span aria-hidden="true">${esc(r)}</span>`).join('')}</p>
        <div class="dx-out"><p class="mono dx-x">${esc(p.x)}</p><h4>${esc(p.h)}</h4><p>${esc(p.s)}</p></div>
      </article>`).join('')}</div>
      <div class="steps" aria-hidden="true">${PLAYS.map(p => `<span><i></i><b class="mono">${p.n} — ${esc(p.h)}</b></span>`).join('')}</div>
    </div>
  </div>
  <div class="pin bf" style="--len:1.9" data-pin="brief">
    <div class="pin-in">
      <div class="bf-head"><p class="mono">The brief</p><h3 class="h3">${esc(BRIEF.h)}</h3><p class="lead">${esc(BRIEF.p)}</p></div>
      <ol class="brief">${BRIEF.steps.map(([n, h, chips, hot], i) => `<li class="brief-row${hot ? ' hot' : ''}">
        <div class="brief-k"><span class="mono">${n}</span><b>${esc(h)}</b></div>
        <div class="brief-run${chips.length > 4 ? ' run' : ''}" style="--ad:${i % 2 ? 'reverse' : 'normal'}"><div class="brief-chips">${(chips.length > 4 ? [...chips, ...chips] : chips).map((c, k) => `<span${k >= chips.length ? ' aria-hidden="true"' : ''}>${esc(c)}</span>`).join('')}</div></div>
      </li>`).join('')}</ol>
    </div>
  </div>`,

  fit: () => `
  <div class="pin rl" style="--len:3.6" data-pin="rules">
    <div class="pin-in">
      <div class="blk-h"><p class="mono">Casting</p><h3 class="h3">Eleven rules for working with talent</h3></div>
      <ol class="rules">${RULES.map(([h, why], i) => `<li class="rule${i ? '' : ' on'}">
        <button class="rule-b" aria-controls="rule-${i}"><span class="mono">${pad2(i + 1)}</span><span class="rule-h">${esc(h)}</span><i aria-hidden="true"></i></button>
        <div class="rule-w" id="rule-${i}"><p>${esc(why)}</p></div>
      </li>`).join('')}</ol>
      <aside class="rules-side" data-rules-side aria-hidden="true"><div><b>01</b><h4>${esc(RULES[0][0])}</h4><p>${esc(RULES[0][1])}</p></div></aside>
      <div class="rl-dots" aria-hidden="true">${RULES.map(() => '<i></i>').join('')}</div>
    </div>
  </div>`,

  format: () => `
  <div class="pin ct" style="--len:2.4" data-pin="court">
    <div class="pin-in">
      <div class="ct-l"><svg class="court" viewBox="0 0 420 250" data-court role="img" aria-label="A tennis court that redraws for each format"></svg></div>
      <div class="ct-r">
        <div class="ct-tabs" role="tablist" aria-label="Formats">${FORMATS.map((f, i) => `<button role="tab" class="ct-tab${i ? '' : ' on'}" data-ct-tab="${i}" aria-selected="${!i}"><span class="mono">${pad2(i + 1)}</span>${esc(f.h)}</button>`).join('')}</div>
        <div class="ct-panels">${FORMATS.map((f, i) => `<div class="ct-p${i ? '' : ' on'}" data-ct-p="${i}" role="tabpanel"><p class="ct-stat"><b>${esc(f.stat)}</b><span class="mono">${esc(f.unit)}</span></p><h3 class="ct-h">${esc(f.h)}</h3><p>${esc(f.p)}</p></div>`).join('')}</div>
      </div>
    </div>
  </div>`,

  story: () => `
  <div class="pin mkx" style="--len:1.9" data-pin="markets">
    <div class="pin-in">
      <div class="mkx-text">
        <p class="mono">One idea, local execution</p><h3 class="h3">${esc(MARKETS.h)}</h3><p class="lead">${esc(MARKETS.p)}</p>
        <p class="mono mkx-n" data-mk-n>Market 01 / ${pad2(MARKETS.list.length)}</p>
      </div>
      <div class="mkx-wheel"><ol class="mkx-list" data-mk-list>${MARKETS.list.map((m, i) => `<li><span class="mono">${pad2(i + 1)}</span><b>${esc(m)}</b></li>`).join('')}</ol></div>
    </div>
  </div>
  <div class="blk bento">
    ${stat(MARKETS.stat)}
    <div class="bc bc-photo">${photo(MARKETS.photo)}</div>
  </div>`,
};

export function renderAll() {
  const THEME = { fit: 'sky' };
  fill('frames', FRAMES.map((f, i) => `<section class="frame" id="${f.id}" data-theme="${THEME[f.id] || 'raven'}" data-label="Frame ${f.n} / 05">
    ${card(f, i)}
    <div class="fr-body" data-scene data-blob="${i % 2 ? '-.05,.5,1.05,.9' : '1.05,.55,-.05,.1'}" data-energy=".34">${BODY[f.id]()}</div>
  </section>`).join(''));

  fill('sheet', FRAMES.map((f, i) => `<li data-r="fade" style="--d:${i * 0.06}s"><a href="#${f.id}" data-peek="${i}"><span class="mono">${f.n}</span><span class="sheet-t">${plain(f.title)}</span><i aria-hidden="true">→</i></a></li>`).join(''));

  fill('journey', `<div class="pin jr" style="--len:3" data-pin="journey">
    <div class="pin-in">
      <div class="jr-head"><p class="mono">How a fan is made</p><p class="mono" data-jr-n>Stage 01 / 07</p></div>
      <ol class="jr-track" data-jr-track>${JOURNEY.map((s, i) => `<li class="jr-card"><span class="mono">Stage ${pad2(i + 1)}</span><h3>${esc(s.name)}</h3><p class="jr-role">${esc(s.role)}</p><p class="jr-d">${esc(s.detail)}</p></li>`).join('')}</ol>
      <div class="jr-line" aria-hidden="true"><i data-jr-bar></i>${JOURNEY.map((s, i) => `<b style="left:${(i / (JOURNEY.length - 1)) * 100}%"><span>${esc(s.name)}</span></b>`).join('')}</div>
    </div>
  </div>`);

  fill('film', FILM.map((f, i) => `<article class="fm${i ? '' : ' on'}" data-r="fade" style="--d:${i * 0.05}s">
    <button class="fm-b" aria-expanded="${!i}" aria-controls="fm-${i}"><span class="mono">${pad2(i + 1)}</span><span class="fm-t">${esc(f.title)}</span><span class="mono fm-tag">${esc(f.tag)}</span><i aria-hidden="true"></i></button>
    <div class="fm-w" id="fm-${i}"><div><div class="fm-cols">
      <div><p class="mono">The play</p><p>${esc(f.play)}</p></div>
      <div><p class="mono">Why it worked</p><p>${esc(f.why)}</p></div>
      <div class="steal"><p class="mono">The steal</p><p>${esc(f.steal)}</p></div>
    </div></div></div>
  </article>`).join(''));

  fill('kit', KIT.map((k, i) => `<article class="kit-c" data-r="fade" style="--d:${i * 0.08}s"><p class="mono">${esc(k.tag)}</p><h4>${esc(k.title)}</h4><p>${esc(k.detail)}</p><p class="mono kit-t">${esc(k.tools)}</p></article>`).join(''));

  fill('record', RECORD.map(([v, what, where], i) => `<div class="stat" data-r="fade" style="--d:${(i % 4) * 0.07}s"><p class="mono"><span>${pad2(i + 1)}</span><span>${esc(where)}</span></p><p class="stat-v" data-count="${esc(v)}">${esc(v)}</p><p class="stat-w">${esc(what)}</p></div>`).join(''));
  fill('rights', `<div class="ticker-in">${[0, 1].map(k => RIGHTS.map(r => `<span${k ? ' aria-hidden="true"' : ''}>${esc(r)}</span>`).join('')).join('')}</div>`);
  fill('route', ROUTE.map(([y, n, f]) => `<li><span class="mono">${y}</span>${logo(f, n)}<b>${esc(n)}</b></li>`).join(''));

  fill('strip', STANDS.map(([f, title, label]) => `<li><img src="${B}photos/${f}" alt="Matt — ${esc(title)}, ${esc(label)}" loading="lazy" decoding="async"><span>${esc(title)} — ${esc(label)}</span></li>`).join(''));

  fill('logos', WORKED_WITH.map(([n, f], i) => `<li data-r="fade" style="--d:${(i % 6) * 0.04}s">${logo(f, n)}<span class="mono">${esc(n)}</span></li>`).join(''));
  fill('talent', TALENT.map(([n, w], i) => `<li><span class="mono">${pad2(i + 1)}</span><b>${esc(n)}</b><span class="mono">${esc(w)}</span></li>`).join(''));
  // Press: one front page per piece of coverage. The <img> marks where the photo sits; the field prints it (dots first, then sharp).
  fill('press', `<div class="pin pg" style="--len:${(PRESS.length * 0.95).toFixed(2)}" data-pin="press">
    <div class="pin-in">
      <div class="pg-stage">${PRESS.map((p, i) => `<article class="pg-item" data-pg="${i}">
        <header class="pg-mast"><b>${esc(p.source)}</b><span class="mono">Cutting ${pad2(i + 1)} / ${pad2(PRESS.length)}</span><span class="mono">${esc(p.date)}</span></header>
        <div class="pg-grid">
          <div class="pg-copy">
            <h3 class="pg-head" data-words>${esc(p.headline).replace(esc(p.ring), `<mark>${esc(p.ring)}</mark>`)}</h3>
            <div class="pg-cols"><p>${esc(p.line)}</p><div class="np-greek" aria-hidden="true">${'<i></i>'.repeat(7)}</div><div class="np-greek" aria-hidden="true">${'<i></i>'.repeat(7)}</div></div>
          </div>
          <figure class="pg-ph" data-pg-ph><img src="${B}photos/${p.img}" alt="${esc(p.alt)}" loading="lazy" decoding="async" style="aspect-ratio:${p.ar};object-position:${p.pos}"></figure>
        </div>
      </article>`).join('')}</div>
      <div class="steps" aria-hidden="true">${PRESS.map((p, i) => `<span><i></i><b class="mono">${pad2(i + 1)} — ${esc(p.source)}</b></span>`).join('')}</div>
    </div>
  </div>`);

  // What I talk about: the topic in plain words first, my line for it second. Each opens the booking page with that topic chosen.
  fill('topics', TOPICS.map(([t, hook], i) => `<li data-r="fade" style="--d:${(i % 3) * 0.06}s"><a href="${B}book/?topic=${i}"><span class="mono">${pad2(i + 1)}</span><b>${esc(t)}</b><em>${esc(hook)}</em></a></li>`).join(''));
  // What you can book: the plain name large, what it covers beneath. Each opens the booking page with that route chosen.
  fill('seats', SEATS.map(([what, line, , , key], i) => `<li data-r="fade" style="--d:${i * 0.04}s"><a href="${B}book/?for=${key}" data-seat data-code="${BOOK[key].code}" data-pass="${esc(BOOK[key].pass)}"><span class="mono">${pad2(i + 1)}</span><span class="seat-q">${esc(what)}</span><span class="seat-l">${esc(line)}</span><i aria-hidden="true">→</i></a></li>`).join(''));

  const idx = [['top', 'The opening frame'], ['idea', 'The idea'], ['journey', 'How a fan is made'], ['company', 'The company'], ...FRAMES.map(f => [f.id, plain(f.title)]), ['plays', 'Plays worth stealing'], ['kit', 'How I work'], ['record', 'The record'], ['stands', 'In the stands'], ['press', 'In the press'], ['book', 'Book Matt']];
  fill('index', idx.map(([id, t], i) => `<li><a href="#${id}"><span class="mono">${pad2(i)}</span><span class="ix-t">${esc(t)}</span></a></li>`).join(''));
  return {
    stands: STANDS.map(([f]) => `${B}photos/${f}`), standsMeta: STANDS,
    frames: FRAMES.map(f => `${B}photos/${f.photo[0]}`), portrait: `${B}photos/portrait.jpg`,
    press: PRESS.map(p => `${B}photos/${p.img}`),
  };
}
