// Arena v12 — scroll controller. Maps scroll to match progress, drives the 3D engine, scrubs the DOM overlays.
import './styles/modernist.css';
import './styles/site.css';
import { EMAIL, SEGS, CH, VENUE, KIT, MARKETS, GATES, PHOTOS, LOGOS, RIGHTS, XI, DRIVE, FILM, TROPHIES, PROOF, TALENT, BRANDS, PRESS, SEATS, TOPICS, STAT, FANS_TEXT, SCREEN_DATA, MESSAGES, LED_PLAN } from './content.js';

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
root.querySelector('[data-spacer]').style.height = SEGS.reduce((a, [, w]) => a + w, 0) + 'vh';
const $ = sel => root.querySelector(sel);
const $$ = sel => [...root.querySelectorAll(sel)];
const list = (name, html) => { const el = $(`[data-list="${name}"]`); el.insertAdjacentHTML('beforeend', html); return el; };

// ---------- render lists
list('ticks', ['x1', 'x2', 'x3', 'x4'].map(x => `<div style="position:absolute;top:-3px;width:2px;height:8px;background:rgba(243,242,242,.5);left:${(G(x, 0.5) * 100).toFixed(2)}%"></div>`).join(''));
list('rights', RIGHTS.map((r, i) => `<div data-ri="${i}" style="display:flex;gap:12px;padding:clamp(3px,.7vh,7px) 0;border-bottom:1px solid rgba(243,242,242,.12);font-weight:800;font-size:12px;letter-spacing:.06em;opacity:.35"><span style="color:var(--color-accent)">${pad2(i + 1)}</span><span>${esc(r.name.toUpperCase())}</span></div>`).join(''));
list('rightsDetail', RIGHTS.map((r, i) => `<div data-rd="${i}" style="grid-area:1/1;opacity:0">${esc(r.detail)}</div>`).join(''));
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
list('film', FILM.map((f, i) => `<article data-rv style="display:flex;flex-direction:column;gap:22px;padding:20px 20px 24px;border-right:2px solid rgba(243,242,242,.22);border-bottom:2px solid rgba(243,242,242,.22)">
  <div style="display:flex;justify-content:space-between;gap:12px;font-size:11px;font-weight:800;letter-spacing:.14em"><span style="color:var(--color-accent)">TAPE ${pad2(i + 1)}</span><span style="color:rgba(243,242,242,.55)">${esc(f.tag)}</span></div>
  <div style="font-weight:800;text-transform:uppercase;font-size:clamp(28px,3vw,48px);line-height:.9;letter-spacing:-.03em">${esc(f.title)}</div>
  ${[['THE PLAY', f.play], ['WHY IT WORKED', f.why], ['THE STEAL', f.steal]].map(([h, t], k) => `<div class="film-row" style="display:grid;gap:6px 16px;border-top:1px solid rgba(243,242,242,.16);padding-top:12px">
    <span style="font-size:10px;font-weight:800;letter-spacing:.14em;color:${k === 2 ? 'var(--color-accent)' : 'rgba(243,242,242,.55)'};padding-top:3px">${h}</span>
    <span style="font-size:15px;line-height:1.45;${k === 2 ? 'font-weight:600;color:#f3f2f2' : 'color:rgba(243,242,242,.85)'};text-wrap:pretty">${esc(t)}</span>
  </div>`).join('')}
</article>`).join(''));
list('proof', PROOF.map(([n, f]) => `<div data-rv title="${esc(n)}" style="display:flex;align-items:center;justify-content:center;aspect-ratio:3/2;padding:14px;background:#f3f2f2;border-right:2px solid #0b0a0a;border-bottom:2px solid #0b0a0a"><img src="${BASE}logos/${f}" alt="${esc(n)}" loading="lazy" style="max-width:72%;max-height:52px;object-fit:contain;filter:grayscale(1) contrast(1.1);mix-blend-mode:multiply"></div>`).join(''));
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
  <div class="grayscale" style="min-height:220px;background:url('${BASE}${p.img}') center 30%/cover"></div>
  <div style="padding:20px 20px 22px;display:flex;flex-direction:column;justify-content:space-between;gap:20px">
    <div style="display:flex;justify-content:space-between;gap:12px;font-size:11px;font-weight:800;letter-spacing:.14em"><span style="color:var(--color-accent)">${esc(p.source.toUpperCase())}</span><span style="color:rgba(243,242,242,.55)">${esc(p.date.toUpperCase())}</span></div>
    <div>
      <div style="font-weight:800;text-transform:uppercase;font-size:clamp(26px,2.6vw,40px);line-height:.92;letter-spacing:-.025em">${esc(p.headline)}</div>
      <div style="margin-top:12px;font-size:15px;line-height:1.45;color:rgba(243,242,242,.85);text-wrap:pretty">${esc(p.line)}</div>
    </div>
  </div>
</article>`).join(''));
list('seats', SEATS.map(([who, line, subj], i) => `<a href="mailto:${EMAIL}?subject=${encodeURIComponent(subj)}" class="seat" style="display:flex;flex-direction:column;justify-content:space-between;gap:36px;min-height:200px;padding:18px 18px 20px;border-right:2px solid rgba(243,242,242,.22);border-bottom:2px solid rgba(243,242,242,.22);color:var(--color-bg)">
  <div style="display:flex;justify-content:space-between;gap:12px;font-size:11px;font-weight:800;letter-spacing:.14em"><span>${pad2(i + 1)}</span><span>EMAIL →</span></div>
  <div>
    <div style="font-weight:800;text-transform:uppercase;font-size:clamp(24px,2.3vw,36px);line-height:.92;letter-spacing:-.025em">${esc(who)}</div>
    <div style="margin-top:10px;font-size:15px;line-height:1.4;opacity:.85;text-wrap:pretty">${esc(line)}</div>
  </div>
</a>`).join(''));

// chapters menu
const groups = [
  ['01 — FOOTBALL', 'NIGHT STADIUM', [["05'", 'The tunnel is the new runway', G('hero', 0.25)], ["15'", 'Nobody falls for 90 minutes', G('hero', 0.5)], ["20'", 'Off the pitch, into culture', G('hero', 0.9)], ["35'", 'Who I tell stories for', G('rights', 0.45)]]],
  ['02 — BASKETBALL', 'CULTURE IS THE SIDE DOOR', [['Q1', 'Culture plays', G('bball', 0.25)], ['TO', 'How I build a brief', G('bball', 0.8)]]],
  ['03 — NFL', 'FIT BEATS SIZE', [['1&10', 'How a fan is made', G('nfl', 0.25)], ['XI', '11 talent rules', G('nfl', 0.6)]]],
  ['04 — TENNIS', 'THE FORMAT IS THE PRODUCT', [['15–0', 'Demand is dormant', G('tennis', 0.3)], ['30–0', 'New formats, new fans', G('tennis', 0.8)]]],
  ['05 — MOTORSPORT', 'STORY BEFORE SPORT', [['GRID', 'Story before sport', G('race', 0.03)], ['LAP', 'One idea, seven markets', G('race', 0.12)], ['PIT', 'AI is the pit crew', G('race', 0.72)], ['FLAG', 'Full time', G('ft', 0.98)]]],
  ['POST-MATCH', '', [["90+1'", 'The film room', 'sec:0'], ["90+2'", 'The record', 'sec:1'], ["90+3'", 'The dressing room', 'sec:2'], ["90+4'", 'Book Matt', 'sec:3']]],
];
const row = (m, n, tag, go) => `<button class="menu-row" data-go="${go}" style="display:grid;grid-template-columns:64px 1fr auto;align-items:baseline;gap:12px;width:100%;padding:10px 16px;background:none;border:0;border-bottom:1px solid rgba(243,242,242,.1);color:#f3f2f2;font-family:inherit;text-align:left;cursor:pointer">
  <span style="font-weight:800;font-variant-numeric:tabular-nums;color:var(--color-accent);font-size:13px">${esc(m)}</span>
  <span style="font-weight:600;font-size:15px">${esc(n)}</span>
  <span style="font-size:10px;letter-spacing:.14em;font-weight:800;color:rgba(243,242,242,.5)">${esc(tag)}</span>
</button>`;
list('chapters', row('00', 'Kick-off', 'REPLAY', 'replay') + groups.map(([n, m, rows]) =>
  `<div style="display:flex;justify-content:space-between;gap:12px;padding:14px 16px 6px;font-size:10px;font-weight:800;letter-spacing:.18em;color:rgba(243,242,242,.5);border-bottom:1px solid rgba(243,242,242,.1)"><span>${esc(n)}</span><span style="color:var(--color-accent)">${esc(m)}</span></div>`
  + rows.map(([mm, nn, act]) => row(mm, nn, '', act)).join('')).join(''));

// ---------- state
let eng = null, snd = null, kick = null, frozen = false, postN = 0, prevP = 0, hoverT = 0, goalTO = 0;
const idx = {};
const menuEl = $('[data-menu]'), menuBtn = $('[data-menu-toggle]');
const spacerEl = $('[data-spacer]'), ftEl = $('[data-ft]'), capEl = $('[data-cap]');
const postSecs = $$('[data-post-sec]');
const clockEl = $('[data-clock]'), clabelEl = $('[data-clabel]'), barEl = $('[data-bar]'), venueEl = $('[data-venue]');
const ri = $$('[data-ri]'), rd = $$('[data-rd]'), zi = $$('[data-zi]'), kc = $$('[data-kc]'), dc = $$('[data-dc]'), dn = $('[data-dn]');
const xiEls = $$('[data-xi]'), xt = $('[data-xt]'), xp = $('[data-xp]'), xd = $('[data-xd]');
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
  if (go === 'replay') replay(); else goTo(go.startsWith('sec:') ? go : Number(go));
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
  ...['x1', 'x2', 'x3', 'x4'].flatMap(x => [[G(x, 0.04), () => S().whoosh(0.9)], [G(x, 0.2), () => S().whoosh(1.5)], [G(x, 0.52), () => S().clunk()], [G(x, 0.6), () => S().clunk()], [G(x, 0.7), () => S().clunk()], [G(x, 0.86), () => S().roar()]]),
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
  $('[data-scroll-hint]').textContent = 'SCROLL ↓';
  $$('[data-m="sheet"]').forEach(e => Object.assign(e.style, { left: '16px', right: '16px', width: 'auto', top: 'auto', bottom: '78px', maxHeight: '42vh', overflow: 'auto' }));
}

// ---------- scroll + clock
const matchMax = () => Math.max(1, (spacerEl ? spacerEl.offsetHeight : document.documentElement.scrollHeight) - innerHeight);
function postUI(d) {
  const f = Math.min(1, Math.max(0, d / (innerHeight * 0.45)));
  ftEl.style.opacity = String(1 - f); ftEl.style.visibility = f > 0.99 ? 'hidden' : 'visible';
  capEl.style.opacity = String(1 - f);
  let n = 0;
  if (d > 0) { n = 1; postSecs.forEach((s, i) => { if (s.getBoundingClientRect().top < innerHeight * 0.5) n = i + 1; }); }
  postN = n;
  if (eng) eng.setPaused(d > innerHeight * 1.1);
  if (n) { clockEl.textContent = `90+${n}'`; clabelEl.textContent = 'STOPPAGE TIME'; barEl.style.width = '100%'; }
}
function onScroll() {
  const mm = matchMax(); postUI(scrollY - mm);
  if (!eng || frozen) return;
  eng.setTarget(Math.min(1, scrollY / mm));
}
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
  if (id === 'tennis') return ['SCORE', t < 0.5 ? '15–0' : t < 0.97 ? '30–0' : '40–0'];
  if (id === 'x4') return ['LAP', 'GRID'];
  if (id === 'race') { if (t < CH.LAP[0]) return ['LAP', 'LIGHTS']; if (t < CH.LAP[1]) { const k = Math.min(6, Math.floor((t - CH.LAP[0]) / (CH.LAP[1] - CH.LAP[0]) * 8)); return ['LAP', `1 · T${k + 1}`]; } return ['LAP', 'PIT']; }
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
  stepIndex('r', p, RNG.rr, ri.length, i => { ri.forEach((el, j) => { el.style.opacity = j === i ? '1' : '.35'; }); rd.forEach((el, j) => { el.style.opacity = j === i ? '1' : '0'; }); });
  stepIndex('z', p, RNG.lap, 8, i => { const k = i > 6 ? -1 : i; zi.forEach((el, j) => { el.style.opacity = j === k ? '1' : j < k || k < 0 && i === 7 ? '.75' : '.4'; el.style.color = j === k ? '#ec3013' : ''; }); });
  stepIndex('k', p, RNG.pit, kc.length, i => { const k = Math.max(0, i); kc.forEach((el, j) => { el.style.opacity = j === k ? '1' : '0'; }); });
  stepIndex('d', p, RNG.drive, dc.length, i => { const k = Math.max(0, i); dc.forEach((el, j) => { el.style.opacity = j === k ? '1' : '0'; }); dn.textContent = `${pad2(k + 1)} / ${pad2(dc.length)}`; });
  stepIndex('x', p, RNG.xi, XI.length, i => { if (i < 0 || performance.now() < hoverT) return; showXI(i); hoverT = 0; });
  if (snd && snd.enabled) {
    const a = prevP, b = p; if (b > a) events.forEach(([q, f]) => { if (a < q && b >= q) f(); });
    const [l, o] = crowdLevel(p); snd.setCrowd(l, o);
  }
  prevP = p;
  if (postN) return;
  const sg = segAt(p), t = (p - sg.a) / (sg.b - sg.a), [lab, val] = clock(sg.id, t);
  if (clockEl.textContent !== val) clockEl.textContent = val;
  if (clabelEl.textContent !== lab) clabelEl.textContent = lab;
  barEl.style.width = (p * 100).toFixed(2) + '%';
  const v = VENUE[sg.id] || ''; const show = v && !(sg.id === 'hero' && (t < 0.03 || t > 0.77)) && !(sg.id === 'nfl' && t > 0.57);
  if (venueEl.textContent !== v) venueEl.textContent = v; venueEl.style.opacity = show ? '1' : '0';
}

function goTo(p) {
  setMenu(false); frozen = false;
  if (typeof p === 'string') { const el = postSecs[Number(p.slice(4))]; if (el) scrollTo({ top: el.getBoundingClientRect().top + scrollY - 70, behavior: 'smooth' }); return; }
  scrollTo({ top: p * matchMax(), behavior: 'smooth' });
}
function replay() {
  setMenu(false); scrollTo(0, 0); if (eng) eng.jump(0);
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

// ---------- boot
function engineOpts() {
  const quality = QUALITY === 'auto' ? ((matchMedia('(pointer: coarse)').matches || innerWidth < 820 || (navigator.hardwareConcurrency || 8) <= 4) ? 'low' : 'high') : QUALITY;
  return {
    segs: segList.map(s => ({ id: s.id, a: s.a, b: s.b })), ch: CH, quality,
    logos: LOGOS, rights: RIGHTS, formation: XI.map(x => [x[0], x[1], x[2]]), drive: DRIVE, kit: KIT, markets: MARKETS,
    gates: GATES, photos: Object.fromEntries(Object.entries(PHOTOS).map(([k, v]) => [k, v ? BASE + v : v])), model: { url: BASE + 'models/matt.glb', height: 1.85 },
    noDegrade: params.has('nodegrade'), stat: STAT, fansText: FANS_TEXT, screenData: SCREEN_DATA, messages: MESSAGES, ledPlan: LED_PLAN,
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
addEventListener('resize', onScroll);

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (START_AT) {
  endIntro();
  enginePromise.then(() => { const p = G(START_AT[0], START_AT[1]); scrollTo(0, p * matchMax()); eng && eng.jump(p); });
} else if (reduce) enginePromise.then(endIntro, endIntro);
else startIntro(enginePromise);
