// Turns content.js into markup. No behaviour here; main.js wires it up afterwards.
import { EMAIL, FRAMES, RUNWAY, PLAYS, BRIEF, JOURNEY, RULES, FORMATS, FORMAT_PHOTOS, MARKETS, KIT, FILM, RECORD, RIGHTS, ROUTE, STANDS, WORKED_WITH, TALENT, PRESS, SEATS, TOPICS } from './content.js';

const B = import.meta.env.BASE_URL;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pad2 = n => String(n).padStart(2, '0');
const $ = s => document.querySelector(s);
const fill = (name, html) => { const el = $(`[data-list="${name}"]`); if (el) el.innerHTML = html; };

// A photo in two layers: colour underneath, the black-and-blue print on top. Hover, focus or tap develops it.
const photo = ([f, title, line, alt], cls = '') => `<figure class="ph ${cls}" data-r="photo">
  <div class="ph-in" tabindex="0"><img src="${B}photos/${f}" alt="${esc(alt || title)}" loading="lazy" decoding="async"><div class="ph-duo" aria-hidden="true"><img src="${B}photos/${f}" alt="" loading="lazy" decoding="async"></div></div>
  <figcaption><b>${esc(title)}</b><span>${esc(line)}</span></figcaption>
</figure>`;
const logo = (f, name) => `<i class="lg" role="img" aria-label="${esc(name)}" style="-webkit-mask-image:url('${B}logos/${f}');mask-image:url('${B}logos/${f}')"></i>`;

const card = (f, i) => `<header class="fr-card" data-scene="${f.scene}" data-blob="${['.82,.3,.1,.85', '.2,.72,.92,.2', '.75,.75,.15,.2', '.5,.25,.95,.9', '.78,.5,.05,.1'][i]}" data-energy="1" data-runners="1">
  <span class="fr-num" aria-hidden="true">${f.n}</span>
  <div class="fr-meta mono"><span>Frame ${f.n} / 05</span><span>${esc(f.sport)}</span></div>
  <h2 class="fr-title" data-r="smear" data-split data-smear="46">${f.title.map(l => `<span class="ln">${l.replace('<em>', '<em class="hi">')}</span>`).join(' ')}</h2>
  <p class="fr-intro lead" data-r="fade" style="--d:.25s">${esc(f.intro)}</p>
</header>`;

const BODY = {
  runway: () => `
  <div class="blk split">
    <div class="split-t" data-r="fade"><p class="mono">Arrivals</p><h3 class="h3">${esc(RUNWAY.h)}</h3><p>${esc(RUNWAY.p)}</p></div>
    ${photo(RUNWAY.photos[0], 'ph-tall')}
  </div>
  <div class="blk split rev">
    ${photo(RUNWAY.photos[1], 'ph-mid')}
    <blockquote class="pull" data-r="smear" data-split>Fan first. Every story I tell starts from <em class="hi">a seat like this one.</em></blockquote>
  </div>`,

  'side-door': () => `
  <div class="blk">
    <div class="blk-h" data-r="fade"><p class="mono">Double exposures</p><h3 class="h3">Three plays I keep coming back to</h3></div>
    <div class="dxs">${PLAYS.map(p => `<article class="dx" data-dev>
      <div class="dx-meta mono"><span>Play ${p.n}</span><span class="dx-x">${esc(p.x)}</span></div>
      <p class="dx-names" aria-label="${esc(p.rows.join(' × '))}">${p.rows.map((r, i) => `${i ? '<i aria-hidden="true">×</i>' : ''}<span aria-hidden="true" style="--k:${i - (p.rows.length - 1) / 2}">${esc(r)}</span>`).join('')}</p>
      <div class="dx-t"><h4>${esc(p.h)}</h4><p>${esc(p.s)}</p></div>
    </article>`).join('')}</div>
  </div>
  <div class="blk split brief-blk">
    <div class="split-t" data-r="fade"><p class="mono">The brief</p><h3 class="h3">${esc(BRIEF.h)}</h3><p>${esc(BRIEF.p)}</p></div>
    ${photo(BRIEF.photo, 'ph-mid')}
  </div>
  <ol class="brief">${BRIEF.steps.map(([n, h, chips, hot], i) => `<li class="brief-row${hot ? ' hot' : ''}" data-r="fade">
      <div class="brief-k"><span class="mono">${n}</span><b>${esc(h)}</b></div>
      <div class="brief-run${chips.length > 4 ? ' run' : ''}" style="--ad:${i % 2 ? 'reverse' : 'normal'}"><div class="brief-chips">${(chips.length > 4 ? [...chips, ...chips] : chips).map((c, k) => `<span${k >= chips.length ? ' aria-hidden="true"' : ''}>${esc(c)}</span>`).join('')}</div></div>
    </li>`).join('')}</ol>`,

  fit: () => `
  <div class="pin jr" style="--len:3" data-pin="journey">
    <div class="pin-in">
      <div class="jr-head"><p class="mono">How a fan is made</p><p class="mono" data-jr-n>Stage 01 / 07</p></div>
      <ol class="jr-track" data-jr-track>${JOURNEY.map((s, i) => `<li class="jr-card"><span class="mono">Stage ${pad2(i + 1)}</span><h3>${esc(s.name)}</h3><p class="jr-role">${esc(s.role)}</p><p class="jr-d">${esc(s.detail)}</p></li>`).join('')}</ol>
      <div class="jr-line" aria-hidden="true"><i data-jr-bar></i>${JOURNEY.map((s, i) => `<b style="left:${(i / (JOURNEY.length - 1)) * 100}%"><span>${esc(s.name)}</span></b>`).join('')}</div>
    </div>
  </div>
  <div class="blk rules-blk">
    <div class="blk-h" data-r="fade"><p class="mono">Casting</p><h3 class="h3">Eleven rules for working with talent</h3></div>
    <ol class="rules">${RULES.map(([h, why], i) => `<li class="rule${i ? '' : ' on'}" data-r="fade" style="--d:${Math.min(i, 5) * 0.04}s">
      <button class="rule-b" aria-expanded="${!i}" aria-controls="rule-${i}"><span class="mono">${pad2(i + 1)}</span><span class="rule-h">${esc(h)}</span><i aria-hidden="true"></i></button>
      <div class="rule-w" id="rule-${i}"><div><p>${esc(why)}</p></div></div>
    </li>`).join('')}</ol>
    <aside class="rules-side" data-rules-side aria-hidden="true"><div><b>01</b><h4>${esc(RULES[0][0])}</h4><p>${esc(RULES[0][1])}</p></div></aside>
  </div>`,

  format: () => `
  <div class="pin ct" style="--len:2.4" data-pin="court">
    <div class="pin-in">
      <div class="ct-l">
        <svg class="court" viewBox="0 0 420 250" data-court role="img" aria-label="A tennis court that redraws for each format">
          <rect class="c-fill c-fa" data-cf="a"/><rect class="c-fill c-fb" data-cf="b"/>
          <rect class="c-wall" data-cw x="52" y="43" width="316" height="164" rx="2"/>
          <g data-cl></g>
          <text class="c-t" data-ct="0" x="120" y="236" text-anchor="middle">GRASS</text><text class="c-t" data-ct="1" x="300" y="236" text-anchor="middle">CLAY</text>
          <text class="c-t" data-ct="2" x="300" y="236" text-anchor="middle">−9%</text>
          <text class="c-t" data-ct="3" x="210" y="236" text-anchor="middle">20 × 10 M · WALLS IN PLAY</text>
        </svg>
      </div>
      <div class="ct-r">
        <div class="ct-tabs" role="tablist" aria-label="Formats">${FORMATS.map((f, i) => `<button role="tab" class="ct-tab${i ? '' : ' on'}" data-ct-tab="${i}" aria-selected="${!i}"><span class="mono">${pad2(i + 1)}</span>${esc(f.h)}</button>`).join('')}</div>
        <div class="ct-panels">${FORMATS.map((f, i) => `<div class="ct-p${i ? '' : ' on'}" data-ct-p="${i}" role="tabpanel"><p class="ct-stat"><b>${esc(f.stat)}</b><span class="mono">${esc(f.unit)}</span></p><h3 class="ct-h">${esc(f.h)}</h3><p>${esc(f.p)}</p></div>`).join('')}</div>
      </div>
    </div>
  </div>
  <div class="blk pair">${photo(FORMAT_PHOTOS[0], 'ph-mid')}${photo(FORMAT_PHOTOS[1], 'ph-mid drop')}</div>`,

  story: () => `
  <div class="blk split mk">
    <div class="split-t">
      <div data-r="fade"><p class="mono">Lap one</p><h3 class="h3">${esc(MARKETS.h)}</h3><p>${esc(MARKETS.p)}</p></div>
      <ol class="mk-list" data-focus>${MARKETS.list.map((m, i) => `<li><span class="mono">${pad2(i + 1)}</span>${esc(m)}</li>`).join('')}</ol>
    </div>
    <div class="mk-ph">${photo(MARKETS.photos[0], 'ph-tall')}${photo(MARKETS.photos[1], 'ph-small')}</div>
  </div>
  <div class="blk">
    <div class="blk-h" data-r="fade"><p class="mono">The pit wall</p><h3 class="h3">AI is the pit crew, not the driver</h3></div>
    <div class="kit">${KIT.map((k, i) => `<article class="kit-c" data-r="fade" style="--d:${i * 0.08}s"><p class="mono">${esc(k.tag)}</p><h4>${esc(k.title)}</h4><p>${esc(k.detail)}</p><p class="mono kit-t">${esc(k.tools)}</p></article>`).join('')}</div>
  </div>`,
};

export function renderAll() {
  const THEME = { fit: 'sky' };
  fill('frames', FRAMES.map((f, i) => `<section class="frame" id="${f.id}" data-theme="${THEME[f.id] || 'raven'}" data-label="Frame ${f.n} — ${esc(f.sport)}">
    ${card(f, i)}
    <div class="fr-body" data-scene="drift" data-blob="${i % 2 ? '-.05,.5,1.05,.9' : '1.05,.55,-.05,.1'}" data-energy=".34" data-runners=".2">${BODY[f.id]()}</div>
  </section>`).join(''));

  fill('sheet', FRAMES.map(f => `<li data-r="fade" style="--d:${(+f.n - 1) * 0.06}s"><a href="#${f.id}"><span class="mono">${f.n}</span><span class="sheet-t">${f.title.join(' ').replace(/<\/?em>/g, '')}</span><span class="mono sheet-s">${esc(f.sport)}</span><i aria-hidden="true">→</i></a></li>`).join(''));

  fill('film', FILM.map((f, i) => `<article class="fm${i ? '' : ' on'}" data-r="fade" style="--d:${i * 0.05}s">
    <button class="fm-b" aria-expanded="${!i}" aria-controls="fm-${i}"><span class="mono">${pad2(i + 1)}</span><span class="fm-t">${esc(f.title)}</span><span class="mono fm-tag">${esc(f.tag)}</span><i aria-hidden="true"></i></button>
    <div class="fm-w" id="fm-${i}"><div><div class="fm-cols">
      <div><p class="mono">The play</p><p>${esc(f.play)}</p></div>
      <div><p class="mono">Why it worked</p><p>${esc(f.why)}</p></div>
      <div class="steal"><p class="mono">The steal</p><p>${esc(f.steal)}</p></div>
    </div></div></div>
  </article>`).join(''));

  fill('record', RECORD.map(([v, what, where], i) => `<div class="stat" data-r="fade" style="--d:${(i % 4) * 0.07}s"><p class="mono"><span>${pad2(i + 1)}</span><span>${esc(where)}</span></p><p class="stat-v" data-count="${esc(v)}">${esc(v)}</p><p class="stat-w">${esc(what)}</p></div>`).join(''));
  fill('rights', `<div class="ticker-in">${[0, 1].map(k => RIGHTS.map(r => `<span${k ? ' aria-hidden="true"' : ''}>${esc(r)}</span>`).join('')).join('')}</div>`);
  fill('route', ROUTE.map(([y, n, f]) => `<li><span class="mono">${y}</span>${logo(f, n)}<b>${esc(n)}</b></li>`).join(''));

  fill('strip', STANDS.map(([f, title, label]) => `<li><img src="${B}photos/${f}" alt="Matt — ${esc(title)}, ${esc(label)}" loading="lazy" decoding="async"><span>${esc(title)} — ${esc(label)}</span></li>`).join(''));

  fill('logos', WORKED_WITH.map(([n, f], i) => `<li data-r="fade" style="--d:${(i % 6) * 0.04}s">${logo(f, n)}<span class="mono">${esc(n)}</span></li>`).join(''));
  fill('talent', TALENT.map(([n, w], i) => `<li><span class="mono">${pad2(i + 1)}</span><b>${esc(n)}</b><span class="mono">${esc(w)}</span></li>`).join(''));
  fill('press', PRESS.map(p => `<article class="pr" data-r="fade"><figure class="ph" data-r="photo"><div class="ph-in" tabindex="0"><img src="${B}photos/${p.img}" alt="${esc(p.alt)}" loading="lazy" decoding="async" style="object-position:${p.pos}"><div class="ph-duo" aria-hidden="true"><img src="${B}photos/${p.img}" alt="" loading="lazy" decoding="async" style="object-position:${p.pos}"></div></div></figure>
    <div class="pr-t"><p class="mono"><span>${esc(p.source)}</span><span>${esc(p.date)}</span></p><h3 class="h3">${esc(p.headline)}</h3><p>${esc(p.line)}</p></div></article>`).join(''));

  fill('topics', TOPICS.map(t => `<li>${esc(t)}</li>`).join(''));
  fill('seats', SEATS.map(([what, line, subject, q], i) => `<li data-r="fade" style="--d:${i * 0.04}s"><a href="mailto:${EMAIL}?subject=${encodeURIComponent(subject)}"><span class="mono">${esc(what)}</span><span class="seat-q">${esc(q)}</span><span class="seat-l">${esc(line)}</span><i aria-hidden="true">→</i></a></li>`).join(''));

  const idx = [['top', 'The opening frame', ''], ['idea', 'The idea', ''], ...FRAMES.map(f => [f.id, f.title.join(' ').replace(/<\/?em>/g, ''), f.sport]), ['plays', 'Plays worth stealing', ''], ['record', 'The record', ''], ['stands', 'In the stands', ''], ['company', 'The company', ''], ['book', 'Book Matt', '']];
  fill('index', idx.map(([id, t, s], i) => `<li><a href="#${id}"><span class="mono">${pad2(i)}</span><span class="ix-t">${esc(t)}</span>${s ? `<span class="mono ix-s">${esc(s)}</span>` : ''}</a></li>`).join(''));
  return { stands: STANDS.map(([f]) => `${B}photos/${f}`), standsMeta: STANDS, journey: JOURNEY.length };
}
