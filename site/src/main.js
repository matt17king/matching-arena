// Arena v12 — scroll controller. Maps scroll to match progress, drives the 3D engine, scrubs the DOM overlays.
import './styles/modernist.css';
import './styles/site.css';
import './styles/reads.css';
import './styles/mobile.css';
import { drawBrief } from './engine/broadcast-gfx.js';
import { EMAIL, SEGS, CH, VENUE, KIT, MARKETS, GATES, PHOTOS, LOGOS, RIGHTS, WORKED_WITH, XI, DRIVE, FILM, TROPHIES, PROOF, STANDS, TALENT, BRANDS, PRESS, SEATS, TOPICS, FANS_TEXT, SCREEN_DATA, MESSAGES, LED_PLAN, STAGE_VH, READ_AFTER, READS, PLAYS, FORMATS, LINKEDIN, INSTAGRAM } from './content.js';

const BASE = import.meta.env.BASE_URL;
const KBG = '#0b0a0a', ZONE_ON = '#ec3013', ZONE_OFF = 'rgba(243,242,242,.3)';
const params = new URLSearchParams(location.search);
// Review helpers: ?start=walkout|basketball|nfl|tennis|motorsport and ?quality=auto|high|low
const START_AT = { walkout: ['hero', 0.9], basketball: ['x1', 0.02], nfl: ['x2', 0.02], tennis: ['x3', 0.02], motorsport: ['x4', 0.02] }[params.get('start')];
const QUALITY = params.get('quality') || 'auto';

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad2 = n => String(n).padStart(2, '0');
const sm = x => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };

// ---------- segment map
let u = 0;
const segList = SEGS.map(([id, w]) => { const s = { id, a: u, w }; u += w; return s; });
segList.forEach(s => { s.b = (s.a + s.w) / u; s.a = s.a / u; delete s.w; });
const SEG = Object.fromEntries(segList.map(s => [s.id, s]));
const G = (id, t) => { const s = SEG[id]; return s.a + t * (s.b - s.a); };
const GR = (id, r) => [G(id, r[0]), G(id, r[1])];
const segAt = p => { for (const s of segList) if (p <= s.b) return s; return segList[segList.length - 1]; };

const root = document.getElementById('root');
const $ = sel => root.querySelector(sel);
const $$ = sel => [...root.querySelectorAll(sel)];
const list = (name, html) => { const el = $(`[data-list="${name}"]`); el.insertAdjacentHTML('beforeend', html); return el; };

// ---------- render lists
// ---------- the flow: a stage of 3D per chapter, and a read after each venue that scrolls like a normal page
const NEXT_LABEL = { basketball: ['02', 'Basketball', 'x1'], nfl: ['03', 'NFL', 'x2'], tennis: ['04', 'Tennis', 'x3'], motorsport: ['05', 'Motorsport', 'x4'], ft: ['FT', 'Full time', 'ft'] };
// decks: a scannable index of short titles, one big panel for the selected item. Fits one screen; advances on its own until touched.
const DECKS = {
  plays: () => PLAYS.map(p => ({ n: `PLAY ${p.n}`, tag: p.x, h: p.h, p: p.s, extra: `<div class="dk-x">${p.rows.map(esc).join(' × ')}</div>` })),
  brief: () => [['01', 'Who we want', ['Fans we have', "Fans we don't"], 1], ['02', 'What they already love', SCREEN_DATA.passions], ['03', 'What we have', ['Sport', 'Athletes', 'Stories']], ['04', 'What it becomes', SCREEN_DATA.outputs, 1]]
    .map(([n, h, chips, red]) => ({ n, tag: 'The brief', h, extra: `<div class="rl-chips">${chips.map((c, i) => `<span class="${red && (n === '04' || i === 1) ? 'red' : ''}">${esc(c)}</span>`).join('')}</div>` })),
  drive: () => DRIVE.map(d => ({ n: d.years, tag: d.down, h: d.name, p: `${d.role}. ${d.detail}` })),
  xi: () => XI.map(x => ({ n: `NO. ${x[2]}`, tag: x[4], h: x[3], p: x[5] })),
  formats: () => FORMATS.map(f => ({ n: f.k, tag: f.stat, h: f.h, p: f.p })),
  kit: () => KIT.map(k => ({ n: k.tag, tag: k.tools, h: k.title, p: k.detail })),
  film: () => FILM.map((f, i) => ({ n: `TAPE ${pad2(i + 1)}`, tag: f.tag, h: f.title, extra: `<div class="dk-rows">${[['The play', f.play], ['Why it worked', f.why], ['The steal', f.steal]].map(([l, t], k) => `<div class="${k === 2 ? 'steal' : ''}"><span>${l}</span><p>${esc(t)}</p></div>`).join('')}</div>` })),
};
const deckHTML = (key, photo) => { const items = DECKS[key]();
  return `<div class="deck deck-${key}${photo ? ' has-photo' : ''}" data-deck>
  <div class="deck-idx" role="tablist">${items.map((it, i) => `<button class="dk-i${i ? '' : ' on'}" data-i="${i}" role="tab" aria-selected="${!i}"><span class="dk-n">${esc(it.n)}</span><span class="dk-t">${esc(it.h)}</span><i class="dk-bar"></i></button>`).join('')}</div>
  <div class="deck-panels">${items.map((it, i) => `<div class="dk-p${i ? '' : ' on'}" data-i="${i}" role="tabpanel"><div class="dk-meta"><span>${esc(it.n)}</span><span>${esc(it.tag)}</span></div><div class="dk-h">${esc(it.h)}</div>${it.p ? `<p class="dk-body">${esc(it.p)}</p>` : ''}${it.extra || ''}</div>`).join('')}</div>
  ${photo ? rPhoto(photo) : ''}
</div>`; };
const LISTS = {
  logos: () => `<div class="rl rl-logos">${WORKED_WITH.map(([n, k]) => `<div data-rv class="rl-logo" title="${esc(n)}"><img src="${BASE}logos/${LOGOS[k]}" alt="${esc(n)}" loading="lazy"><span>${esc(n)}</span></div>`).join('')}</div>`,
  markets: () => `<div data-rv class="rl-markets">${MARKETS.map((m, i) => `<span><b>T${i + 1}</b>${esc(m)}</span>`).join('')}</div>`,
};
const rPhoto = ([f, title, line]) => `<figure data-rv class="life rb-photo"><img src="${BASE}photos/life/${f}" alt="${esc(title)}" loading="lazy"><figcaption><span>${esc(title)}</span>${esc(line)}</figcaption></figure>`;
// each part of a read is one screen ("page"): the title, then each block, then the hand-off
function readHTML(key) {
  const R = READS[key], [nn, nl, nx] = NEXT_LABEL[R.next];
  const head = b => `<div class="rb-head"><div class="rb-k">${esc(b.k)}</div><h3 class="rb-h">${esc(b.h)}</h3>${b.p ? `<p class="rb-p">${esc(b.p)}</p>` : ''}</div>`;
  return `<section class="read" data-read="${key}" id="read-${key}">
  <div class="read-in">
    <div class="rp rp-title" data-page>
      <div class="read-ghost" aria-hidden="true">${R.n}</div>
      <div data-rv class="read-head"><span><b>${R.n} / 05</b> ${esc(R.venue.toUpperCase())}</span><span>THE READ</span></div>
      <h2 data-rv class="read-title">${esc(R.title)}</h2>
      <p data-rv class="read-intro">${esc(R.intro)}</p>
    </div>
    ${R.blocks.map(b => DECKS[b.list] ? `<div class="rp rb rb-deck" data-page>${head(b)}${deckHTML(b.list, b.photo)}</div>`
      : `<div class="rp rb" data-page><div class="rb-l">${head(b)}${b.list === 'markets' ? LISTS.markets() : ''}${b.list === 'logos' && b.photo ? rPhoto(b.photo) : ''}</div><div class="rb-r">${b.list === 'logos' ? LISTS.logos() : b.photo ? rPhoto(b.photo) : ''}</div></div>`).join('')}
    <button class="read-next" data-page data-go="seg:${nx}"><span class="rn-k">NEXT</span><span class="rn-t"><b>${nn}</b> ${esc(nl)}</span><span class="rn-a">↓</span></button>
  </div>
</section>`;
}
const flowEl = $('[data-flow]'), postEl = $('[data-post]');
SEGS.forEach(([id]) => { flowEl.insertAdjacentHTML('beforeend', `<div data-stage="${id}" style="height:${STAGE_VH[id]}vh"></div>`); if (READ_AFTER[id]) flowEl.insertAdjacentHTML('beforeend', readHTML(READ_AFTER[id])); });
// scroll ↔ match progress. A stage plays its segment of the story; a read holds the story where the venue ended.
let stages = [], readEls = [], postTop = 1;
function layout() {
  const ih = innerHeight;
  stages = $$('[data-stage]').map(el => {
    const id = el.dataset.stage, top = el.getBoundingClientRect().top + scrollY, h = el.offsetHeight, pv = el.previousElementSibling, nx = el.nextElementSibling;
    const s0 = top - (pv && pv.matches('[data-read]') ? ih * 0.5 : 0), s1 = top + h - (!nx ? ih : nx.matches('[data-read]') ? ih * 0.35 : 0);
    return { id, a: SEG[id].a, b: SEG[id].b, s0, s1: Math.max(s0 + 1, s1), read: READ_AFTER[id] };
  });
  readEls = $$('[data-read]').map(el => ({ el, key: el.dataset.read, top: el.getBoundingClientRect().top + scrollY, h: el.offsetHeight }));
  postTop = postEl.getBoundingClientRect().top + scrollY;
  const end = Math.max(1, postTop - ih), tk = $('[data-list="ticks"]');
  tk.querySelectorAll('[data-tick]').forEach(e => e.remove());
  readEls.forEach(r => tk.insertAdjacentHTML('beforeend', `<div data-tick style="position:absolute;top:-3px;width:2px;height:8px;background:rgba(243,242,242,.5);left:${(Math.min(1, (r.top + ih * 0.4) / end) * 100).toFixed(2)}%"></div>`));
}
const pAt = sY => { let q = 0; for (const st of stages) if (sY >= st.s0) q = st.a + (st.b - st.a) * Math.min(1, Math.max(0, (sY - st.s0) / (st.s1 - st.s0))); return q; };
const scrollForP = q => { const st = stages.find(x => q >= x.a - 1e-9 && q <= x.b + 1e-9) || stages[stages.length - 1]; return st.s0 + (st.s1 - st.s0) * (q - st.a) / Math.max(1e-9, st.b - st.a); };
layout();
list('drive', DRIVE.map((b, i) => `<div data-dc="${i}" style="grid-area:1/1;opacity:0;padding:14px 16px 16px">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
    <div>
      <div style="font-size:11px;font-weight:800;letter-spacing:.14em;color:rgba(243,242,242,.6)"><span style="color:var(--color-accent)">${esc(b.down)}</span> · ${esc(b.years)}</div>
      <div style="font-weight:800;text-transform:uppercase;font-size:clamp(26px,2.8vw,42px);line-height:.92;letter-spacing:-.025em;margin-top:6px">${esc(b.name)}</div>
    </div>
    ${b.logo ? `<div style="flex-shrink:0;width:52px;height:52px;background:#f3f2f2;display:flex;align-items:center;justify-content:center"><img src="${BASE}logos/career/${b.logo}.png" alt="${esc(b.name)} logo" style="max-width:40px;max-height:40px;object-fit:contain"></div>` : ''}
  </div>
  <div style="font-size:12px;font-weight:800;letter-spacing:.08em;color:var(--color-accent-400);margin-top:8px;text-transform:uppercase">${esc(b.role)}</div>
  <div style="font-size:14px;line-height:1.45;color:rgba(243,242,242,.85);margin-top:10px;text-wrap:pretty">${esc(b.detail)}</div>
</div>`).join(''));
list('xi', XI.map((x, i) => `<div data-xi="${i}" class="xi-row" tabindex="0" role="button" style="display:grid;grid-template-columns:30px 1fr auto;align-items:baseline;gap:10px;padding:clamp(5px,.9vh,9px) 12px;border-bottom:1px solid rgba(243,242,242,.1);cursor:pointer">
  <span style="font-size:12px;font-weight:800;color:var(--color-accent);font-variant-numeric:tabular-nums">${x[2]}</span>
  <span style="font-size:14px;font-weight:800">${esc(x[3])}</span>
  <span style="font-size:10px;font-weight:800;letter-spacing:.12em;color:rgba(243,242,242,.5)">${esc(x[4])}</span>
</div>`).join(''));
list('markets', MARKETS.map((m, i) => `<div data-zi="${i}" style="display:flex;gap:6px;opacity:.4"><span>T${i + 1}</span><span>${esc(m.toUpperCase())}</span></div>`).join(''));
list('kit', KIT.map((k, i) => `<div data-kc="${i}" style="grid-area:1/1;opacity:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:6px 28px;padding:12px 16px 14px;align-items:end">
  <div>
    <div style="font-size:11px;font-weight:800;letter-spacing:.14em;color:rgba(243,242,242,.6)"><span style="color:var(--color-accent)">THE PIT WALL</span> · AI · ${pad2(i + 1)} / ${pad2(KIT.length)}</div>
    <div style="font-weight:800;text-transform:uppercase;font-size:clamp(20px,2.2vw,32px);line-height:.95;letter-spacing:-.02em;margin-top:6px">${esc(k.title)}</div>
    <div style="font-size:11px;font-weight:800;letter-spacing:.08em;color:var(--color-accent-400);margin-top:6px;text-transform:uppercase">${esc(k.tools)}</div>
  </div>
  <div style="font-size:14px;line-height:1.45;color:rgba(243,242,242,.85);text-wrap:pretty">${esc(k.detail)}</div>
</div>`).join(''));
$('[data-list="film"]').innerHTML = deckHTML('film');
list('proof', PROOF.map(([n, f]) => `<div data-rv title="${esc(n)}" style="display:flex;align-items:center;justify-content:center;aspect-ratio:3/2;padding:14px;background:#f3f2f2;border-right:2px solid #0b0a0a;border-bottom:2px solid #0b0a0a"><img src="${BASE}logos/${f}" alt="${esc(n)}" loading="lazy" style="max-width:72%;max-height:52px;object-fit:contain;filter:grayscale(1) contrast(1.1);mix-blend-mode:multiply"></div>`).join(''));
list('stands', STANDS.map(([f, title, label]) => { const src = `${BASE}photos/life/${f}`, vid = f.endsWith('.mp4');
  return `<figure data-rv class="life" style="margin:0">
  ${vid ? `<video src="${src}" poster="${src.replace(/\.mp4$/, '.jpg')}" muted loop playsinline autoplay preload="none" aria-label="${esc(title)}, ${esc(label)}" style="display:block;width:100%;aspect-ratio:3/4;object-fit:cover"></video>` : `<img src="${src}" alt="Matt — ${esc(title)}, ${esc(label)}" loading="lazy" style="display:block;width:100%;aspect-ratio:3/4;object-fit:cover">`}
  <figcaption style="display:flex;justify-content:space-between;gap:10px;border-top:2px solid rgba(243,242,242,.22);margin-top:10px;padding-top:8px;font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase"><span style="color:#f3f2f2">${esc(title)}</span><span style="color:rgba(243,242,242,.5);text-align:right">${esc(label)}</span></figcaption>
</figure>`; }).join(''));
list('topics', TOPICS.map(t => `<span style="border:2px solid rgba(243,242,242,.35);padding:7px 10px;font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase">${esc(t)}</span>`).join(''));
list('trophies', TROPHIES.map(([v, what, where], i) => `<div data-rv class="trophy" style="display:flex;flex-direction:column;justify-content:space-between;gap:28px;min-height:220px;padding:18px 18px 20px;border-right:2px solid rgba(243,242,242,.22);border-bottom:2px solid rgba(243,242,242,.22)">
  <div style="display:flex;justify-content:space-between;gap:12px;font-size:11px;font-weight:800;letter-spacing:.14em"><span style="color:var(--color-accent)">${pad2(i + 1)}</span><span style="color:rgba(243,242,242,.55)">${esc(where)}</span></div>
  <div>
    <div data-count="${esc(v)}" style="font-weight:800;font-size:clamp(48px,4.6vw,80px);line-height:.85;letter-spacing:-.05em;font-variant-numeric:tabular-nums">${esc(v)}</div>
    <div style="margin-top:12px;font-size:15px;font-weight:600;line-height:1.3;color:rgba(243,242,242,.88);text-wrap:pretty">${esc(what)}</div>
  </div>
</div>`).join(''));
list('talent', TALENT.map(([n, w], i) => `<div data-rv style="display:grid;grid-template-columns:44px 1fr auto;align-items:baseline;gap:12px;padding:14px 0;border-bottom:1px solid rgba(243,242,242,.14)">
  <span style="font-size:11px;font-weight:800;letter-spacing:.14em;color:var(--color-accent)">${pad2(i + 1)}</span>
  <span style="font-weight:800;text-transform:uppercase;font-size:clamp(20px,2vw,30px);line-height:1;letter-spacing:-.02em">${esc(n)}</span>
  <span style="font-size:10px;font-weight:800;letter-spacing:.14em;color:rgba(243,242,242,.5);text-transform:uppercase;text-align:right">${esc(w)}</span>
</div>`).join(''));
list('brands', BRANDS.map(([n, f]) => `<div data-rv class="trophy" style="display:flex;flex-direction:column;justify-content:space-between;gap:16px;aspect-ratio:1;padding:16px;border-right:2px solid rgba(243,242,242,.22);border-bottom:2px solid rgba(243,242,242,.22)">
  <div style="flex:1;display:flex;align-items:center;justify-content:center">${f ? `<img src="${BASE}logos/${f}" alt="" loading="lazy" style="max-width:70%;max-height:64px;object-fit:contain;filter:grayscale(1) invert(1) contrast(1.15);mix-blend-mode:screen;opacity:.92">` : `<span style="font-weight:800;text-transform:uppercase;font-size:clamp(15px,1.4vw,20px);line-height:.95;letter-spacing:-.01em;text-align:center">${esc(n)}</span>`}</div>
  <div style="font-size:10px;font-weight:800;letter-spacing:.12em;color:rgba(243,242,242,.5);text-transform:uppercase">${esc(n)}</div>
</div>`).join(''));
list('press', PRESS.map(p => `<article data-rv style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));border:2px solid rgba(243,242,242,.22);border-top:2px solid var(--color-bg)">
  <div class="grayscale" style="min-height:220px;background:url('${BASE}${p.img}') ${p.pos || 'center 30%'}/cover"></div>
  <div style="padding:20px 20px 22px;display:flex;flex-direction:column;justify-content:space-between;gap:20px">
    <div style="display:flex;justify-content:space-between;gap:12px;font-size:11px;font-weight:800;letter-spacing:.14em"><span style="color:var(--color-accent)">${esc(p.source.toUpperCase())}</span><span style="color:rgba(243,242,242,.55)">${esc(p.date.toUpperCase())}</span></div>
    <div>
      <div style="font-weight:800;text-transform:uppercase;font-size:clamp(26px,2.6vw,40px);line-height:.92;letter-spacing:-.025em">${esc(p.headline)}</div>
      <div style="margin-top:12px;font-size:15px;line-height:1.45;color:rgba(243,242,242,.85);text-wrap:pretty">${esc(p.line)}</div>
    </div>
  </div>
</article>`).join(''));
list('seats', SEATS.map(([who, line, subj, q], i) => `<a href="mailto:${EMAIL}?subject=${encodeURIComponent(subj)}" class="seat" style="display:flex;flex-direction:column;justify-content:space-between;gap:28px;min-height:220px;padding:18px 18px 20px;border-right:2px solid rgba(243,242,242,.22);border-bottom:2px solid rgba(243,242,242,.22);color:var(--color-bg)">
  <div style="display:flex;justify-content:space-between;gap:12px;font-size:11px;font-weight:800;letter-spacing:.14em"><span><span style="color:var(--color-accent)">Q</span> · ${pad2(i + 1)}</span><span>ASK →</span></div>
  <div style="font-weight:800;font-size:clamp(24px,2.3vw,36px);line-height:1.02;letter-spacing:-.02em;text-wrap:balance">“${esc(q)}”</div>
  <div style="border-top:1px solid rgba(243,242,242,.2);padding-top:10px">
    <div style="font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase">${esc(who)}</div>
    <div style="margin-top:6px;font-size:14px;line-height:1.4;opacity:.8;text-wrap:pretty">${esc(line)}</div>
  </div>
</a>`).join(''));

// chapters menu
const groups = [
  ['01 — FOOTBALL', 'NIGHT STADIUM', [["05'", 'The tunnel is the new runway', G('hero', 0.25)], ["15'", 'Nobody falls for 90 minutes', G('hero', 0.5)], ["20'", 'Off the pitch, into culture', G('hero', 0.9)], ["35'", 'Worked with', G('rights', 0.45)], ['READ', 'The read', 'read:football']]],
  ['02 — BASKETBALL', 'CULTURE IS THE SIDE DOOR', [['Q1', 'Culture plays', G('bball', 0.25)], ['TO', 'How I build a brief', G('bball', 0.8)], ['READ', 'The read', 'read:basketball']]],
  ['03 — NFL', 'FIT BEATS SIZE', [['1&10', 'How a fan is made', G('nfl', 0.25)], ['XI', '11 talent rules', G('nfl', 0.6)], ['READ', 'The read', 'read:nfl']]],
  ['04 — TENNIS', 'THE FORMAT IS THE PRODUCT', [['15–0', 'Battle of the Surfaces', G('tennis', 0.15)], ['30–0', 'Battle of the Sexes', G('tennis', 0.38)], ['40–0', 'Padel', G('tennis', 0.62)], ['GAME', 'New formats, new fans', G('tennis', 0.86)], ['READ', 'The read', 'read:tennis']]],
  ['05 — MOTORSPORT', 'STORY BEFORE SPORT', [['GRID', 'Story before sport', G('race', 0.03)], ['LAP', 'One idea, seven markets', G('race', 0.12)], ['PIT', 'AI is the pit crew', G('race', 0.72)], ['READ', 'The read', 'read:motorsport'], ['FLAG', 'Full time', G('ft', 0.98)]]],
  ['POST-MATCH', '', [["90+1'", 'The film room', 'sec:0'], ["90+2'", 'The record', 'sec:1'], ["90+3'", 'In the stands', 'sec:2'], ["90+4'", 'The dressing room', 'sec:3'], ["90+5'", 'Book Matt', 'sec:4']]],
];
const row = (m, n, tag, go) => `<button class="menu-row" data-go="${go}" style="display:grid;grid-template-columns:64px 1fr auto;align-items:baseline;gap:12px;width:100%;padding:10px 16px;background:none;border:0;border-bottom:1px solid rgba(243,242,242,.1);color:#f3f2f2;font-family:inherit;text-align:left;cursor:pointer">
  <span style="font-weight:800;font-variant-numeric:tabular-nums;color:var(--color-accent);font-size:13px">${esc(m)}</span>
  <span style="font-weight:600;font-size:15px">${esc(n)}</span>
  <span style="font-size:10px;letter-spacing:.14em;font-weight:800;color:rgba(243,242,242,.5)">${esc(tag)}</span>
</button>`;
list('chapters', row('00', 'Kick-off', 'REPLAY', 'replay') + groups.map(([n, m, rows]) =>
  `<div style="display:flex;justify-content:space-between;gap:12px;padding:14px 16px 6px;font-size:10px;font-weight:800;letter-spacing:.18em;color:rgba(243,242,242,.5);border-bottom:1px solid rgba(243,242,242,.1)"><span>${esc(n)}</span><span style="color:var(--color-accent)">${esc(m)}</span></div>`
  + rows.map(([mm, nn, act]) => row(mm, nn, '', act)).join('')).join('')
  + `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;border-top:2px solid rgba(243,242,242,.2)">${[["Let's talk →", `mailto:${EMAIL}`, 1], ['LinkedIn ↗', LINKEDIN, 0], ['Instagram ↗', INSTAGRAM, 0]].map(([t, h, red]) =>
    `<a href="${h}" ${red ? '' : 'target="_blank" rel="noopener"'} class="${red ? 'btn-red' : 'btn-line'}" style="padding:14px 12px;font-size:12px;font-weight:800;letter-spacing:.04em;text-align:center;white-space:nowrap;color:#f3f2f2;${red ? 'background:var(--color-accent)' : 'border-left:1px solid rgba(243,242,242,.2)'}">${t}</a>`).join('')}</div>`);

// ---------- the brief (basketball timeout): drawn flat so it reads at any angle
const briefEl = $('[data-brief]'), briefC = $('[data-brief-c]'), briefM = $('[data-brief-m]'), briefCard = $$('[data-sk^="bball:.53"]')[0];
const briefG = briefC.getContext('2d'); let briefR = -1;
const chip = (t, red) => `<span style="display:inline-block;margin:0 6px 6px 0;padding:4px 7px;border:2px solid ${red ? 'var(--color-accent)' : 'rgba(243,242,242,.35)'};font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;${red ? 'color:#ff7a5e' : ''}">${esc(t)}</span>`;
briefM.innerHTML = [['01', 'Who we want', chip('Fans we have') + chip("Fans we don't", true)], ['02', 'What they already love', SCREEN_DATA.passions.map(t => chip(t)).join('')], ['03', 'What we have', chip('Sport') + chip('Athletes') + chip('Stories')], ['04', 'What it becomes', SCREEN_DATA.outputs.map(t => chip(t, true)).join('')]]
  .map(([n, h, c], i) => `<div data-bs="${i}" style="opacity:.15;transition:opacity .4s ease"><div style="font-size:11px;font-weight:800;letter-spacing:.14em;margin-bottom:6px"><span style="color:var(--color-accent)">${n}</span> ${esc(h.toUpperCase())}</div><div>${c}</div></div>`).join('');
function sizeBrief() {
  const m = innerWidth < 760; briefC.hidden = m; briefM.hidden = !m;
  if (briefCard) briefEl.style.bottom = Math.round(innerHeight - briefCard.getBoundingClientRect().top + (m ? 10 : 14)) + 'px';
  const b = briefEl.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1); briefC.width = Math.round(b.width * dpr); briefC.height = Math.round(b.height * dpr); briefR = -1;
}
function updateBrief(p) {
  const a = G('bball', CH.TAC[0] + 0.04), b = G('bball', CH.TAC[1]), r = Math.min(1, Math.max(0, (p - a) / (b - a)));
  if (Math.abs(r - briefR) < 0.002 && !(r === 1 && briefR !== 1)) return; briefR = r;
  if (briefM.hidden) drawBrief(briefG, briefC.width, briefC.height, r, SCREEN_DATA);
  else [0.06, 0.3, 0.52, 0.6].forEach((k, i) => { briefM.children[i].style.opacity = r >= k ? '1' : '.15'; });
}
addEventListener('resize', sizeBrief); sizeBrief();

// ---------- state
let eng = null, snd = null, kick = null, frozen = false, postN = 0, prevP = 0, hoverT = 0, goalTO = 0;
const idx = {};
const menuEl = $('[data-menu]'), menuBtn = $('[data-menu-toggle]');
const ftEl = $('[data-ft]'), capEl = $('[data-cap]');
const postSecs = $$('[data-post-sec]');
const clockEl = $('[data-clock]'), clabelEl = $('[data-clabel]'), barEl = $('[data-bar]'), venueEl = $('[data-venue]');
const ri = $$('[data-ri]'), rd = $$('[data-rd]'), zi = $$('[data-zi]'), kc = $$('[data-kc]'), dc = $$('[data-dc]'), dn = $('[data-dn]');
const xiEls = $$('[data-xi]'), xt = $('[data-xt]'), xp = $('[data-xp]'), xd = $('[data-xd]');
const cornerEl = $('[data-corner]'), cornerK = $('[data-corner-k]'), cornerN = $('[data-corner-n]');
const tipEl = $('[data-tip]'), ballEl = $('[data-ballhint]'), goalEl = $('[data-goal]');
const kickWrap = $('[data-kick-wrap]');
const scrub = $$('[data-sk]').map(el => {
  const [id, ks] = el.dataset.sk.split(':');
  return { el, k: ks.split(',').map(Number).map(v => G(id, v)), fx: el.dataset.fx || 'fade', pe: el.hasAttribute('data-pe'), t: -1 };
});
const RNG = { rr: GR('rights', CH.RR), lap: GR('race', CH.LAP), pit: GR('race', CH.PIT), drive: GR('nfl', CH.DRIVE), xi: GR('nfl', CH.XI) };

// ---------- menu
const setMenu = open => { menuEl.hidden = !open; menuBtn.setAttribute('aria-expanded', String(open)); };
menuBtn.addEventListener('click', () => setMenu(menuEl.hidden));
document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
menuEl.addEventListener('click', e => {
  const b = e.target.closest('[data-go]'); if (!b) return;
  const go = b.dataset.go;
  if (go === 'replay') replay(); else goTo(/^(sec|read|seg):/.test(go) ? go : Number(go));
});
$('[data-replay]').addEventListener('click', () => replay());
$('[data-skip]').addEventListener('click', () => { kick && kick.skip(); });

// ---------- sound
const soundBtn = $('[data-sound-toggle]'), soundDot = $('[data-sound-dot]'), soundLabel = $('[data-sound-label]'), introLabel = $('[data-intro-sound-label]');
function crowdLevel(p) {
  const s = segAt(p), t = (p - s.a) / (s.b - s.a);
  if (s.id === 'hero') { if (t < 0.34) { const k = t / 0.34; return [(0.1 + 0.16 * k) * (t > 0.18 ? 0.35 : 1), 0.04 + 0.22 * k]; } return [0.55, 1]; }
  if (s.id[0] === 'x') return [0.16 + 0.3 * Math.max(0, (t - 0.8) / 0.2), 0.5];
  if (s.id === 'ft') return [0.3, 0.7];
  return [0.38, 0.85];
}
async function setSound(on) {
  if (!snd) { const { createSound } = await import('./engine/sound.js'); snd = createSound(); }
  const v = snd.toggle(on);
  soundDot.style.background = v ? '#ec3013' : 'transparent';
  soundLabel.textContent = v ? 'SOUND ON' : 'SOUND OFF';
  introLabel.textContent = v ? 'SOUND ON' : 'ENTER WITH SOUND';
  soundBtn.setAttribute('aria-pressed', String(v));
  if (v && eng) { const [l, o] = crowdLevel(eng.progress); snd.setCrowd(l, o); }
}
soundBtn.addEventListener('click', () => setSound());
$('[data-sound-intro]').addEventListener('click', () => setSound(true));
const S = () => snd;
const events = [
  ...[0.046, 0.085, 0.123, 0.162].map((t, i) => [G('hero', t), () => S().whoosh(1 + i * 0.15)]), [G('hero', 0.18), () => S().clunk()], [G('hero', 0.34), () => S().roar()],
  ...[0.58, 0.598, 0.616, 0.634].map(t => [G('hero', t), () => S().clunk()]),
  ...['x1', 'x2', 'x3', 'x4'].flatMap(x => [[G(x, 0.04), () => S().whoosh(0.9)], [G(x, 0.38), () => S().whoosh(1.5)], [G(x, 0.8), () => S().clunk()], [G(x, 0.86), () => S().clunk()], [G(x, 0.92), () => S().clunk()], [G(x, 0.97), () => S().roar()]]),
  [G('bball', CH.TAC[0]), () => S().whistle(2)], [G('nfl', CH.DRIVE[0] + (CH.DRIVE[1] - CH.DRIVE[0]) * (DRIVE.length - 1) / DRIVE.length), () => { S().roar(); S().whistle(1); }],
  [G('race', 0.068), () => { S().whoosh(1.6); S().roar(); }], [G('ft', 0.04), () => S().whistle(3)],
];

// ---------- huddle / picking
function showXI(i) {
  const el = xiEls[i]; if (!el) return; hoverT = performance.now() + 2500;
  const x = XI[i]; xt.textContent = x[3]; xp.textContent = x[4]; xd.textContent = x[5];
  xiEls.forEach((e, j) => { e.style.background = j === i ? 'rgba(236,48,19,.22)' : ''; }); eng && eng.setHighlight(i);
}
xiEls.forEach(el => { const show = () => showXI(Number(el.dataset.xi)); el.addEventListener('mouseenter', show); el.addEventListener('click', show); el.addEventListener('focus', show); });
function onHover(pk) {
  if (!pk || pk.type === 'ball') { tipEl.style.display = 'none'; return; }
  let t = '';
  if (pk.type === 'player') { const x = XI[pk.id]; t = `${x[2]} · ${x[4]} · ${x[3]}`; showXI(pk.id); }
  tipEl.textContent = t; tipEl.style.display = t ? 'block' : 'none';
}
function onPick(pk) { if (pk.type === 'player') showXI(pk.id); }
function goal() {
  goalEl.style.opacity = '1'; clearTimeout(goalTO); goalTO = setTimeout(() => { goalEl.style.opacity = '0'; }, 1800);
  if (snd) { snd.roar(); snd.whistle(1); }
}
window.addEventListener('pointermove', e => { if (tipEl.style.display === 'block') tipEl.style.transform = `translate(${e.clientX + 16}px,${e.clientY + 14}px)`; }, { passive: true });

if (innerWidth < 760) {
  $$('[data-hide-m]').forEach(e => { e.style.display = 'none'; });
  $$('[data-m="sheet"]').forEach(e => Object.assign(e.style, { left: '16px', right: '16px', width: 'auto', top: 'auto', bottom: '78px', maxHeight: '42vh', overflow: 'auto' }));
}

// ---------- scroll + clock
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
// inertial wheel scrolling on desktop; touch keeps the platform's own scrolling
const smoothTo = y => { targetIdx = -1; glideTo(y, glideMs(y - scrollY)); };
const skipEl = $('[data-skip-read]'), hbgEl = $('[data-hbg]');
const canvasEl = $('[data-canvas]'), dimEl = $('[data-dim]');
let curRead = null, readCover = 0;
function postUI(d) {
  const f = Math.min(1, Math.max(0, d / (innerHeight * 0.45)));
  ftEl.style.opacity = String(1 - f); ftEl.style.visibility = f > 0.99 ? 'hidden' : 'visible';
  let n = 0;
  if (d > 0) { n = 1; postSecs.forEach((s, i) => { if (s.getBoundingClientRect().top < innerHeight * 0.5) n = i + 1; }); }
  postN = n;
  if (n) { clockEl.textContent = `90+${n}'`; clabelEl.textContent = 'STOPPAGE TIME'; }
  return f;
}
// which read (if any) is on screen, and how much of the screen it covers
function readUI() {
  const ih = innerHeight; let cur = null, cover = 0, full = false;
  for (const r of readEls) { const t = r.top - scrollY, b = t + r.h; if (b < 0 || t > ih) continue;
    const solidT = t + ih * 0.44, solidB = b - ih * 0.44, c = Math.max(0, Math.min(ih, solidB) - Math.max(0, solidT)) / ih;
    if (c > cover) { cover = c; cur = r; } if (solidT <= 0 && solidB >= ih) full = true; }
  readUI.near = readEls.some(r => { const t = r.top - scrollY; return t + ih * 0.4 < 90 && t + r.h - ih * 0.4 > 0; }) ? 1 : 0;
  const k = Math.min(1, cover * 2.2);
  readCover = k; curRead = k > 0.5 ? cur : null;
  return full;
}
function onScroll() {
  const ih = innerHeight, f = postUI(scrollY - (postTop - ih)), full = readUI();
  capEl.style.opacity = String((1 - f) * (1 - readCover));
  // as a read slides up, the scene behind eases back and dims, so the page reads as a layer over the venue
  canvasEl.style.transform = readCover > 0.001 ? `scale(${(1 + 0.035 * readCover).toFixed(4)})` : ''; dimEl.style.opacity = (readCover * 0.5).toFixed(3);
  // the header gets a dark backing whenever page content (a read or the post-match) scrolls under it
  hbgEl.style.opacity = String(Math.max(readUI.near || 0, Math.min(1, (scrollY - (postTop - ih * 0.1)) / (ih * 0.3))));
  barEl.style.width = (Math.min(1, scrollY / Math.max(1, postTop - ih)) * 100).toFixed(2) + '%';
  // skip: during a chapter's 3D stage, jump straight to its read
  const nextRead = readEls.find(r => r.top + ih * 0.3 > scrollY + ih);
  const st = stages.filter(x => scrollY >= x.s0).pop(), showSkip = !!(nextRead && st && !curRead && !postN && st.id !== 'ft' && !(st.id === 'hero' && scrollY < st.s0 + ih * 0.2));
  skipEl.style.display = showSkip ? 'inline' : 'none'; skipEl.dataset.to = nextRead ? nextRead.key : '';
  if (curRead && !postN) { const R = READS[curRead.key]; clabelEl.textContent = 'THE READ'; clockEl.textContent = `${R.n}/05`; venueEl.style.opacity = '0'; }
  if (!eng) return;
  eng.setPaused(scrollY - (postTop - ih) > ih * 1.1 || full);
  if (frozen) return;
  eng.setTarget(pAt(scrollY));
}
skipEl.addEventListener('click', () => goTo('read:' + skipEl.dataset.to));
document.addEventListener('click', e => { const b = e.target.closest('.read-next'); if (b) goTo(b.dataset.go); });
function clock(id, t) {
  const mm = m => pad2(Math.floor(m)) + "'";
  const K = (q, keys) => { for (let i = 0; i < keys.length - 1; i++) { const [a, va] = keys[i], [b, vb] = keys[i + 1]; if (q <= b) return va + (vb - va) * (q - a) / (b - a); } return keys[keys.length - 1][1]; };
  if (id === 'hero') return ['MATCH CLOCK', mm(K(t, [[0, 5], [0.34, 15], [0.73, 20], [1, 25]]))];
  if (id === 'rights') return ['MATCH CLOCK', mm(35 + 10 * t)];
  if (id === 'x1') return ['GAME CLOCK', 'Q1 12:00'];
  if (id === 'bball') { const s = Math.round(720 * (1 - t)); return ['GAME CLOCK', `Q1 ${Math.floor(s / 60)}:${pad2(s % 60)}`]; }
  if (id === 'x2') return ['DOWN & DISTANCE', '1ST & 10'];
  if (id === 'nfl') { if (t >= CH.XI[0] - 0.03) return ['DOWN & DISTANCE', 'HUDDLE']; const k = Math.min(DRIVE.length - 1, Math.max(0, Math.floor((t - CH.DRIVE[0]) / (CH.DRIVE[1] - CH.DRIVE[0]) * DRIVE.length))); return ['DOWN & DISTANCE', DRIVE[k].down]; }
  if (id === 'x3') return ['SCORE', '0–0'];
  if (id === 'tennis') return ['SCORE', t < CH.SEXES[0] ? '15–0' : t < CH.PADEL[0] ? '30–0' : t < CH.PADEL[1] ? '40–0' : 'GAME'];
  if (id === 'x4') return ['LAP', 'GRID'];
  // the turn count matches the corner title
  if (id === 'race') { if (t < CH.LAP[0]) return ['LAP', 'LIGHTS']; if (t < CH.LAP[1]) { const k = Math.max(0, Math.min(6, Math.floor((t - CH.LAP[0]) / (CH.LAP[1] - CH.LAP[0]) * 8 - 0.3))); return ['LAP', `1 · T${k + 1}`]; } return ['LAP', 'PIT']; }
  return ['RESULT', 'FLAG'];
}
function stepIndex(key, p, [a, b], n, onFn) {
  const i = p < a - 0.002 || p > b + 0.002 ? -1 : Math.min(n - 1, Math.max(0, Math.floor((p - a) / (b - a) * n)));
  if (idx[key] === i) return; idx[key] = i; onFn(i);
}

function frame({ p, ball }) {
  if (ball && ball.on && p > G('hero', 0.95)) { ballEl.style.display = 'block'; ballEl.style.left = ball.x + 'px'; ballEl.style.top = ball.y + 'px'; } else ballEl.style.display = 'none';
  for (const it of scrub) {
    const [a, b, c, d] = it.k; let t;
    if (p <= a) t = 0; else if (p < b) t = sm((p - a) / (b - a)); else if (c === undefined || isNaN(c) || p < c) t = 1; else if (p < d) t = 1 + sm((p - c) / (d - c)); else t = 2;
    if (Math.abs(it.t - t) < 0.0005) continue; it.t = t;
    const s = it.el.style, vis = t > 0.001 && t < 1.999;
    if (it.fx === 'rise') s.transform = `translate3d(0,${t <= 1 ? (1 - t) * 110 : -(t - 1) * 110}%,0)`;
    else { const op = t <= 1 ? t : 2 - t; s.opacity = op; s.translate = `0 ${(1 - op) * (t <= 1 ? 12 : -12)}px`; }
    s.visibility = vis ? 'visible' : 'hidden';
    if (it.pe) s.pointerEvents = t > 0.6 && t < 1.4 ? 'auto' : 'none';
  }
  if (p > G('bball', 0.5) && p < G('bball', 1)) updateBrief(p);
  stepIndex('r', p, RNG.rr, ri.length, i => { ri.forEach((el, j) => { el.style.opacity = j === i ? '1' : '.35'; }); rd.forEach((el, j) => { el.style.opacity = j === i ? '1' : '0'; }); });
  // the lap: the car reaches corner k's apex at 80% of lap segment k; each corner's market is named from just before its apex to just before the next
  { const [a, b] = RNG.lap, f = (p - a) / (b - a) * 8, k = p < a || p > b ? -1 : Math.min(6, Math.floor(f - 0.3)), ci = k < 0 && f > 7 ? 7 : k;
    if (idx.corner !== ci) { idx.corner = ci;
      zi.forEach((el, j) => { el.style.opacity = j === k ? '1' : j < k || ci === 7 ? '.75' : '.4'; el.style.color = j === k ? '#ec3013' : ''; });
      if (k >= 0) { cornerK.textContent = `TURN ${pad2(k + 1)} / 07`; cornerN.textContent = MARKETS[k]; }
      cornerEl.style.opacity = k >= 0 ? '1' : '0'; cornerEl.style.transform = k >= 0 ? 'none' : 'translateY(10px)'; } }
  stepIndex('k', p, RNG.pit, kc.length, i => { const k = Math.max(0, i); kc.forEach((el, j) => { el.style.opacity = j === k ? '1' : '0'; }); });
  stepIndex('d', p, RNG.drive, dc.length, i => { const k = Math.max(0, i); dc.forEach((el, j) => { el.style.opacity = j === k ? '1' : '0'; }); dn.textContent = `${pad2(k + 1)} / ${pad2(dc.length)}`; });
  stepIndex('x', p, RNG.xi, XI.length, i => { if (i < 0 || performance.now() < hoverT) return; showXI(i); hoverT = 0; });
  if (snd && snd.enabled) {
    const a = prevP, b = p; if (b > a) events.forEach(([q, f]) => { if (a < q && b >= q) f(); });
    const [l, o] = crowdLevel(p); snd.setCrowd(l, o);
  }
  prevP = p;
  if (postN || curRead) return;
  const sg = segAt(p), t = (p - sg.a) / (sg.b - sg.a), [lab, val] = clock(sg.id, t);
  if (clockEl.textContent !== val) clockEl.textContent = val;
  if (clabelEl.textContent !== lab) clabelEl.textContent = lab;
  const v = VENUE[sg.id] || ''; const show = v && !(sg.id === 'hero' && (t < 0.03 || t > 0.77)) && !(sg.id === 'nfl' && t > 0.57);
  if (venueEl.textContent !== v) venueEl.textContent = v; venueEl.style.opacity = show ? '1' : '0';
}

function goTo(p) {
  setMenu(false); frozen = false;
  if (typeof p === 'string') {
    const [kind, v] = p.split(':');
    if (kind === 'sec') { const el = postSecs[Number(v)]; if (el) smoothTo(el.getBoundingClientRect().top + scrollY - 70); return; }
    if (kind === 'read') { const r = readEls.find(x => x.key === v); if (r) smoothTo(r.top + innerHeight * 0.38); return; }
    if (kind === 'seg') { const st = stages.find(x => x.id === v); if (st) smoothTo(v === 'ft' ? scrollForP(G('ft', 0.6)) : scrollForP(G(v, 0.3))); return; }
  }
  smoothTo(scrollForP(p));
}
function replay() {
  setMenu(false); stopGlide(); stopFree(); scrollTo(0, 0); if (eng) eng.jump(0);
  kick && kick.cancel(); startIntro(Promise.resolve());
}

// ---------- intro
async function startIntro(waitFor) {
  document.documentElement.style.overflow = 'hidden';
  kickWrap.style.display = 'block'; kickWrap.style.background = KBG;
  const ui = kickWrap.querySelector('[data-kick-ui]'); ui.style.opacity = '1';
  const kcEl = kickWrap.querySelector('[data-kclock]'), zones = [...kickWrap.querySelectorAll('[data-zone]')];
  zones.forEach(z => { z.style.color = ZONE_OFF; });
  const { runKickoff } = await import('./engine/kickoff.js');
  kick = runKickoff(kickWrap.querySelector('[data-kick]'), {
    mode: 'night', waitFor,
    onStart: () => { kickWrap.style.background = 'transparent'; },
    onClock: str => { kcEl.textContent = str; },
    onZone: i => { if (zones[i]) zones[i].style.color = ZONE_ON; },
    onVisitor: v => { const zEl = zones[v.z]; if (zEl && !zEl.querySelector('[data-you]')) { const y = document.createElement('span'); y.setAttribute('data-you', ''); y.textContent = '· YOU'; y.style.color = '#f3f2f2'; zEl.appendChild(y); } },
    onPhase: ph => { if (ph === 'doors') { ui.style.opacity = '0'; snd && snd.whistle(1); } },
    onDone: () => endIntro(),
  });
}
function endIntro() { kickWrap.style.display = 'none'; document.documentElement.style.overflow = ''; }

// ---------- post-match: cards rise in as they reach the viewport, results count up
function countUp(el, delay) {
  const m = /^([^\d]*)(\d+)(.*)$/.exec(el.dataset.count); if (!m) return;
  const [, pre, num, suf] = m, n = Number(num), t0 = performance.now() + delay; el.textContent = pre + '0' + suf;
  const step = now => { const k = Math.min(1, Math.max(0, (now - t0) / 1100)); el.textContent = pre + Math.round(n * (1 - Math.pow(1 - k, 3))) + suf; if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
if (!matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; io.unobserve(e.target);
    const el = e.target, d = ([...el.parentElement.children].indexOf(el) % 4) * 70;
    el.style.transitionDelay = d + 'ms'; el.style.opacity = '1'; el.style.transform = 'none';
    el.addEventListener('transitionend', () => { el.style.transitionDelay = '0ms'; }, { once: true });
    const c = el.querySelector('[data-count]'); if (c) countUp(c, d);
  }), { threshold: 0.2 });
  $$('[data-rv]').forEach(el => { Object.assign(el.style, { opacity: '0', transform: 'translateY(24px)', transition: 'opacity .7s cubic-bezier(.2,.7,.2,1), transform .7s cubic-bezier(.2,.7,.2,1), background-color .2s' }); io.observe(el); });
}

// ---------- decks: hover or tap an index item to show it; while untouched and on screen, they advance on their own
const DECK_MS = 6500;
$$('[data-deck]').forEach(dk => {
  const btns = [...dk.querySelectorAll('.dk-i')], panels = [...dk.querySelectorAll('.dk-p')]; let cur = 0, timer = 0, manual = false;
  dk.style.setProperty('--dk', DECK_MS + 'ms');
  const set = i => { cur = (i + btns.length) % btns.length; btns.forEach((b, j) => { b.classList.toggle('on', j === cur); b.setAttribute('aria-selected', String(j === cur)); }); panels.forEach((q, j) => q.classList.toggle('on', j === cur)); };
  const restartBar = () => { const b = btns[cur].querySelector('.dk-bar'); b.style.animation = 'none'; void b.offsetWidth; b.style.animation = ''; };
  const stop = () => { manual = true; dk.classList.remove('auto'); clearInterval(timer); timer = 0; };
  const run = () => { if (manual || timer || reduceMotion) return; dk.classList.add('auto'); restartBar(); timer = setInterval(() => { set(cur + 1); restartBar(); }, DECK_MS); };
  btns.forEach((b, i) => {
    b.addEventListener('click', () => { stop(); set(i); });
    b.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { stop(); set(i); } });
    b.addEventListener('focus', () => { stop(); set(i); });
  });
  dk.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { stop(); set(cur + 1); btns[cur].focus(); e.preventDefault(); }
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { stop(); set(cur - 1); btns[cur].focus(); e.preventDefault(); }
  });
  if ('IntersectionObserver' in window) new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) run(); else { clearInterval(timer); timer = 0; dk.classList.remove('auto'); } }), { threshold: 0.55 }).observe(dk);
});

// ---------- scrolling. Through the grounds and the changes of sport it's free and smooth, never stopped.
// The read pages snap: inside a read every wheel flick, swipe or arrow key is one page, and scrolling into a read
// lands on its first page (or its last, coming back up). Leaving a read hands straight back to free scrolling.
let zones = [], stops = [], gliding = false, glideAnim = 0, glideTarget = null, targetIdx = -1;
let touchY0 = null, touchX0 = 0, touchScroll = false, lastInput = 0, settleT = 0;
function buildStops() {
  const ih = innerHeight, hdr = innerWidth < 760 ? 72 : 92;
  zones = $$('[data-read]').map(sec => { const pts = [];
    sec.querySelectorAll('[data-page]').forEach(el => { const r = el.getBoundingClientRect(), top = r.top + scrollY;
      if (el.classList.contains('read-next')) { pts.push(top - ih * 0.42); return; }
      pts.push(top - hdr);
      for (let y = top - hdr + (ih - hdr) * 0.85; y < top + r.height - ih * 0.9; y += (ih - hdr) * 0.85) pts.push(y);   // a page taller than the screen gets extra stops
    });
    const st = pts.filter(y => y >= 0).sort((p, q) => p - q).filter((y, i, arr) => !i || y - arr[i - 1] > 24);
    return st.length ? { a: st[0], b: st[st.length - 1], stops: st } : null; }).filter(Boolean);
  stops = zones.flatMap(z => z.stops);
}
const zoneOf = y => zones.find(z => y >= z.a - 3 && y <= z.b + 3);
const easeIO = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
function glideTo(y, ms) {
  stopFree(); cancelAnimationFrame(glideAnim); glideTarget = y;
  const y0 = scrollY, d = y - y0; if (Math.abs(d) < 1) { gliding = false; return; }
  if (reduceMotion) ms = Math.min(ms, 240);
  gliding = true; const t0 = performance.now();
  const tick = now => { const k = Math.min(1, (now - t0) / ms); scrollTo(0, y0 + d * easeIO(k)); if (k < 1) glideAnim = requestAnimationFrame(tick); else { gliding = false; glideTarget = null; } };
  glideAnim = requestAnimationFrame(tick);
}
function stopGlide() { cancelAnimationFrame(glideAnim); gliding = false; glideTarget = null; targetIdx = -1; }
const glideMs = dy => { const d = Math.abs(dy) / innerHeight; return Math.round(Math.min(1500, Math.max(480, 400 + d * 240))); };
// one step inside the read you're in; false when that step would leave it (free scrolling takes over)
function step(dir) {
  const y = gliding && glideTarget !== null ? glideTarget : scrollY, z = zoneOf(y); if (!z) return false;
  const st = z.stops; let i;
  const cur = gliding && targetIdx >= 0 ? stops[targetIdx] : null;
  if (cur !== null && st.includes(cur)) i = st.indexOf(cur) + dir;   // a new flick during a glide carries on from where that glide was going
  else { let n = 0; st.forEach((q, k) => { if (Math.abs(q - y) < Math.abs(st[n] - y)) n = k; });
    i = Math.abs(st[n] - y) < 6 ? n + dir : dir > 0 ? st.findIndex(q => q > y + 6) : st.length - 1 - [...st].reverse().findIndex(q => q < y - 6); }
  if (i < 0 || i >= st.length || Number.isNaN(i)) return false;
  targetIdx = stops.indexOf(st[i]); glideTo(st[i], glideMs(st[i] - scrollY)); return true;
}
// free scrolling for the wheel: eased toward where the wheel says, so the grounds glide rather than jump a notch at a time
let fCur = 0, fTgt = 0, fAnim = 0, fOn = false;
function stopFree() { cancelAnimationFrame(fAnim); fOn = false; }
function freeWheel(dy) {
  if (gliding) stopGlide();
  if (!fOn) { fCur = fTgt = scrollY; }
  const max = document.documentElement.scrollHeight - innerHeight, from = fTgt;
  let to = Math.max(0, Math.min(max, fTgt + dy * 0.8));
  // about to scroll into a read: land on its first page (or its last, coming back up)
  const z = dy > 0 ? zones.find(q => from < q.a - 3 && to >= q.a - 3) : [...zones].reverse().find(q => from > q.b + 3 && to <= q.b + 3);
  if (z) { const y = dy > 0 ? z.a : z.b; targetIdx = stops.indexOf(y); glideTo(y, glideMs(y - scrollY)); return true; }
  fTgt = to;
  if (!fOn) { fOn = true; let tPrev = performance.now();
    const tick = now => {
      if (Math.abs(scrollY - fCur) > 3) { fOn = false; return; }   // something else moved the page (scrollbar, a jump): let it
      const k = 1 - Math.pow(0.9, Math.min(4, (now - tPrev) / 16.7)); tPrev = now;   // same feel at any frame rate
      fCur += (fTgt - fCur) * k; if (Math.abs(fTgt - fCur) < 0.5) fCur = fTgt; scrollTo(0, fCur);
      if (fCur !== fTgt) fAnim = requestAnimationFrame(tick); else fOn = false; };
    fAnim = requestAnimationFrame(tick); }
  return false;
}
const storyLive = () => kickWrap.style.display !== 'block' && menuEl.hidden && !frozen;
// one flick = one step. Trackpads keep streaming fading 'momentum' events for a second or more after the fingers lift,
// so a new flick is spotted as a fresh rise on top of that fading stream (or a change of direction), not only as a pause.
const wg = { last: -1e9, dir: 0, peak: 0, floor: 0, acc: 0, used: false, stepAt: -1e9, owned: false };
function wheelStep(t, dy) {
  const a = Math.abs(dy), dir = Math.sign(dy); if (!dir) return 0;
  if (dir !== wg.dir && a < 4 && t - wg.last < 180) return 0;          // a stray flicker against the stream
  const dt = t - wg.last; wg.last = t;
  let fresh = dt > 180 || dir !== wg.dir;
  if (!fresh && wg.used && t - wg.stepAt > 280 && wg.floor < wg.peak * 0.6 && a >= 16 && a > wg.floor * 2 + 6) fresh = true;
  if (fresh) { wg.dir = dir; wg.peak = wg.floor = a; wg.acc = 0; wg.used = false; wg.owned = false; }
  else if (a >= wg.peak) wg.peak = wg.floor = a; else wg.floor = Math.min(wg.floor, a);
  if (wg.used) return 0;
  wg.acc += a; if (wg.acc >= 12) { wg.used = true; wg.stepAt = t; return dir; }
  return 0;
}
// inside a read and not stepping out of it
const inRead = (y, dir) => { const z = zoneOf(y); return !!z && !(dir > 0 && y >= z.b - 3) && !(dir < 0 && y <= z.a + 3); };
addEventListener('wheel', e => {
  if (!storyLive() || e.ctrlKey) return;
  const dy = e.deltaY * (e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? innerHeight : 1), dir = Math.sign(dy); if (!dir) return;
  e.preventDefault(); lastInput = performance.now();
  const s = wheelStep(e.timeStamp || lastInput, dy);   // event time, not handling time: a busy frame must not split one flick
  if (wg.owned) return;                                 // the rest of a flick that already turned a page: swallow its momentum
  const y = gliding && glideTarget !== null ? glideTarget : scrollY;
  if (inRead(y, dir)) { if (s && step(s)) wg.owned = true; return; }
  if (freeWheel(dy)) { wg.owned = true; wg.used = true; }
}, { passive: false });
addEventListener('touchstart', e => { if (!storyLive() || e.touches.length !== 1) { touchY0 = null; return; } touchY0 = e.touches[0].clientY; touchX0 = e.touches[0].clientX; touchScroll = false; lastInput = performance.now(); if (gliding) stopGlide(); stopFree(); }, { passive: true });
addEventListener('touchmove', e => {
  if (touchY0 === null) return;
  const dy = touchY0 - e.touches[0].clientY, dx = touchX0 - e.touches[0].clientX;
  if (Math.abs(dx) > Math.abs(dy) && e.target.closest('.deck-idx')) return;   // sideways on the deck tabs: let them scroll
  if (touchScroll || inRead(scrollY, Math.sign(dy) || 1)) { e.preventDefault(); touchScroll = true; }
}, { passive: false });
addEventListener('touchend', e => {
  if (touchY0 === null) return; const dy = touchY0 - e.changedTouches[0].clientY; touchY0 = null; lastInput = performance.now();
  if (touchScroll && Math.abs(dy) > 26) step(Math.sign(dy));
}, { passive: true });
addEventListener('keydown', e => {
  if (!storyLive() || e.target.closest('input, textarea, [contenteditable], [role="tab"]')) return;
  const k = e.key, dir = k === 'ArrowDown' || k === 'PageDown' || (k === ' ' && !e.shiftKey) ? 1 : k === 'ArrowUp' || k === 'PageUp' || (k === ' ' && e.shiftKey) ? -1 : 0;
  if (!dir || !inRead(scrollY, dir)) return;
  e.preventDefault(); lastInput = performance.now(); step(dir);
});
// anything that comes to rest part-way into a read (a swipe's momentum, the scrollbar, find-in-page) settles on its nearest page
addEventListener('scroll', () => { if (gliding || fOn) return; clearTimeout(settleT); settleT = setTimeout(() => {
  if (gliding || fOn || touchY0 !== null || !storyLive() || performance.now() - lastInput < 300) return;
  const y = scrollY, z = zones.find(q => y > q.a + 6 && y < q.b - 6) || zoneOf(y); if (!z) return;
  let n = z.stops[0]; z.stops.forEach(q => { if (Math.abs(q - y) < Math.abs(n - y)) n = q; });
  if (Math.abs(n - y) > 6) { targetIdx = stops.indexOf(n); glideTo(n, 520); } }, 220); }, { passive: true });
addEventListener('resize', () => { buildStops(); });
addEventListener('load', () => { buildStops(); });
if ('ResizeObserver' in window) new ResizeObserver(() => buildStops()).observe(document.body);
buildStops();
if (params.has('debug')) window.__snap = () => ({ gliding, free: fOn, targetIdx, y: Math.round(scrollY), zones: zones.map(z => [Math.round(z.a), Math.round(z.b), z.stops.length]) });

// ---------- boot
function engineOpts() {
  const quality = QUALITY === 'auto' ? ((matchMedia('(pointer: coarse)').matches || innerWidth < 820 || (navigator.hardwareConcurrency || 8) <= 4) ? 'low' : 'high') : QUALITY;
  return {
    segs: segList.map(s => ({ id: s.id, a: s.a, b: s.b })), ch: CH, quality,
    logos: LOGOS, rights: RIGHTS, workedWith: WORKED_WITH, formation: XI.map(x => [x[0], x[1], x[2], x[4], x[3]]), drive: DRIVE, kit: KIT, markets: MARKETS,
    gates: GATES, photos: Object.fromEntries(Object.entries(PHOTOS).map(([k, v]) => [k, v ? BASE + v : v])), model: { url: BASE + 'models/matt.glb', height: 1.85 }, bake: { football: BASE + 'bake/football.bin' },
    noDegrade: params.has('nodegrade'), debug: params.has('debug'), flatTactics: true, fansText: FANS_TEXT, screenData: SCREEN_DATA, messages: MESSAGES, ledPlan: LED_PLAN,
  };
}

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
scrollTo(0, 0);
const enginePromise = import('./engine/arena-engine.js')
  .then(m => m.createArena($('[data-canvas]'), { ...engineOpts(), onFrame: frame, onHover, onPick, onKick: () => { snd && snd.whoosh(0.8); }, onGoal: goal }))
  .then(e => {
    eng = e;
    if (import.meta.env.DEV || params.has('debug')) { window.__mkJump = v => { frozen = true; e.jump(v); }; window.__mkSeg = (id, t) => { frozen = true; e.jump(G(id, t)); }; window.__mkDegrade = () => e.degrade(); window.__mkScene = () => e.scene; window.__mkPost = () => e.post; }
    onScroll();
  });
enginePromise.catch(e => console.error('arena engine failed', e));
addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', () => { layout(); onScroll(); });
if ('ResizeObserver' in window) new ResizeObserver(() => { layout(); onScroll(); }).observe(flowEl);
addEventListener('load', () => { layout(); onScroll(); });

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (START_AT) {
  endIntro();
  enginePromise.then(() => { const p = G(START_AT[0], START_AT[1]); scrollTo(0, scrollForP(p)); eng && eng.jump(p); });
} else if (reduce) enginePromise.then(endIntro, endIntro);
else startIntro(enginePromise);
