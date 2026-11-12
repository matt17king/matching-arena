// Behaviour: loader, the scroll-driven journey, the index, and the plain sections after it.
import '@fontsource-variable/instrument-sans/wdth.css';
import '@fontsource-variable/bodoni-moda/opsz-italic.css';
import '@fontsource/dm-mono/400.css';
import '@fontsource/dm-mono/500.css';
import './styles/site.css';
import { render } from './render.js';
import { CHAPTERS } from './content.js';

const Q = new URLSearchParams(location.search);
const $ = (s, el = document) => el.querySelector(s), $$ = (s, el = document) => [...el.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const reduced = Q.has('still') || matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;

render();
if (reduced) root.classList.add('still-motion');

// ---------- can we run the 3D stage?
function glOK() {
  if (Q.has('nogl')) return false;
  try { const c = document.createElement('canvas'); return !!c.getContext('webgl2'); } catch (e) { return false; }
}
const coarse = matchMedia('(pointer: coarse)').matches, small = Math.min(screen.width, screen.height) < 700;
const tier = Q.get('tier') || (coarse || small ? ((navigator.deviceMemory || 4) >= 6 && (navigator.hardwareConcurrency || 4) >= 6 ? 'mid' : 'low') : 'high');

// ---------- loader: counts to 17 while the set is built
const loader = $('#loader'), ldN = $('[data-ld-n]'), ldBar = $('[data-ld-bar]');
let ldP = 0, ldTarget = 0.15, ldDone = false, ldResolve; const ldGone = new Promise(r => { ldResolve = r; });
let ldLast = performance.now();
function ldTick(now) {
  const k = 1 - Math.exp(-Math.min(0.25, (now - ldLast) / 1000) * 7); ldLast = now;
  ldP += (ldTarget - ldP) * k; if (ldTarget >= 1 && ldP > 0.985) ldP = 1;
  ldN.textContent = String(Math.round(ldP * 17)).padStart(2, '0'); ldBar.style.transform = `scaleX(${ldP})`;
  if (ldP < 1) requestAnimationFrame(ldTick);
  else if (!ldDone) { ldDone = true; loader.classList.add('out'); setTimeout(() => { loader.remove(); ldResolve(); }, reduced ? 50 : 760); }
}
requestAnimationFrame(ldTick);

// ---------- story beats in the page
const beatsEls = $$('[data-beat], [data-beat-top]');
const chInfo = { top: ['00', 'Off the pitch', 'Football'], lineup: ['05', 'Five sports, one way of thinking', 'The line-up'], plays: ['06', 'Plays worth stealing', ''], record: ['07', 'The record', ''], company: ['08', 'Who I have worked with', ''], stands: ['09', 'In the stands', ''], press: ['09', 'In the press', ''], book: ['10', 'Book Matt', ''] };
const afterSecs = $$('.after > .sec');
CHAPTERS.forEach(c => { chInfo[c.id] = [c.n, c.plain, c.sport]; });
const hudN = $('[data-hud-n]'), hudT = $('[data-hud-t]'), hudN2 = $('[data-hud-n2]'), hudSport = $('[data-hud-sport]'), progress = $('[data-progress]'), hud = $('.hud');
let curCh = null, afterCh = null;
function setChapter(ch) {
  if (ch === curCh) return; curCh = ch; const [n, t, sp] = chInfo[ch] || chInfo.top;
  hudN.textContent = n; hudT.textContent = t; hudN2.textContent = n; hudSport.textContent = sp; root.dataset.ch = ch;
}
setChapter('top');

const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); }), { rootMargin: '-22% 0px -22% 0px' });
$$('.beat .card, .lineup-l').forEach(el => io.observe(el));
const io2 = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io2.unobserve(e.target); } }), { rootMargin: '0px 0px -12% 0px' });
$$('.after .sec-h, .after .fm, .rec li, .route-l li, .logos li, .talent-l li, .pr, .seats li, .topics, .strip, .ft, .after .k').forEach(el => io2.observe(el));

// the eleven rules: the one nearest the middle of the screen is the live one
const ruleEls = $$('[data-rule]');
function liveRule() {
  const mid = innerHeight * 0.5; let best = -1, bd = 1e9;
  ruleEls.forEach((el, i) => { const r = el.getBoundingClientRect(), d = Math.abs((r.top + r.bottom) / 2 - mid); if (d < bd) { bd = d; best = i; } });
  ruleEls.forEach((el, i) => el.classList.toggle('on', i === best && bd < innerHeight * 0.4));
}

// ---------- scroll → position in the director's beat list
let anchors = [], journeyEnd = 0, docH = 1, vh = innerHeight;
function measure(dir) {
  vh = innerHeight; const sy = scrollY, list = [];
  beatsEls.forEach(el => {
    const r = el.getBoundingClientRect(), top = r.top + sy, h = r.height;
    if (el.dataset.beat) list.push([el.dataset.beat, el.dataset.beat === 'hero' ? 0 : top + h / 2 - vh / 2, el.dataset.ch]);
    else { list.push([el.dataset.beatTop, top - vh * 0.22, el.dataset.ch]); list.push([el.dataset.beatBottom, top + h - vh * 0.78, el.dataset.ch]); }
  });
  anchors = dir ? dir.beats.map(b => { const a = list.find(l => l[0] === b.id); return a ? { y: a[1], ch: a[2] } : null; }) : list.map(a => ({ y: a[1], ch: a[2] }));
  // any beat without a home in the page sits halfway between its neighbours
  anchors.forEach((a, i) => { if (!a) anchors[i] = { y: ((anchors[i - 1]?.y ?? 0) + (anchors.slice(i + 1).find(Boolean)?.y ?? 0)) / 2, ch: anchors[i - 1]?.ch }; });
  const after = $('.after').getBoundingClientRect(); journeyEnd = after.top + sy; docH = Math.max(1, document.documentElement.scrollHeight - vh);
}
function uAt(y) {
  const n = anchors.length; if (y <= anchors[0].y) return 0; if (y >= anchors[n - 1].y) return n - 1;
  let i = 0; while (i < n - 2 && anchors[i + 1].y <= y) i++;
  return i + (y - anchors[i].y) / Math.max(1, anchors[i + 1].y - anchors[i].y);
}

// ---------- header: goes light over the dark sections; the line across the top is progress
const hd = $('.hd'), darks = $$('.sec.ink, .sec.red');
function chrome() {
  const y = scrollY; progress.style.transform = `scaleX(${clamp(y / docH, 0, 1)})`;
  let light = false; darks.forEach(s => { const r = s.getBoundingClientRect(); if (r.top <= 36 && r.bottom >= 36) light = true; });
  hd.classList.toggle('light', light); hd.classList.toggle('solid', !light && y > journeyEnd - 40); root.classList.toggle('on-dark', light);
  hud.classList.toggle('off', y > journeyEnd - vh * 0.7 || y < 30); root.classList.toggle('scrolled', y > 40);
  if (y > journeyEnd - vh * 0.5) { let id = 'plays'; afterSecs.forEach(sec => { if (sec.getBoundingClientRect().top < vh * 0.5) id = sec.id; }); afterCh = id; setChapter(id); } else afterCh = null;
  if (ruleEls.length) liveRule();
}

// ---------- index overlay and in-page links
const ix = $('#index'), ixBtn = $('[data-ix-open]');
function setIx(open) {
  ixBtn.setAttribute('aria-expanded', String(open)); root.classList.toggle('ix-open', open);
  if (open) { ix.hidden = false; requestAnimationFrame(() => ix.classList.add('on')); } else { ix.classList.remove('on'); setTimeout(() => { if (!root.classList.contains('ix-open')) ix.hidden = true; }, 520); }
}
ixBtn.addEventListener('click', () => setIx(!root.classList.contains('ix-open')));
addEventListener('keydown', e => { if (e.key === 'Escape') setIx(false); });
function goTo(id, smooth = true) {
  const el = id === 'top' ? document.body : document.getElementById(id); if (!el) return;
  const beat = el.closest?.('.beat'); let y = 0;
  if (id !== 'top') { const r = (beat || el).getBoundingClientRect(); y = beat ? r.top + scrollY + r.height / 2 - innerHeight / 2 : r.top + scrollY; }
  scrollTo({ top: y, behavior: smooth && !reduced ? 'smooth' : 'auto' });
}
document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"]'); if (!a) return;
  const id = a.getAttribute('href').slice(1); if (!id) return;
  e.preventDefault(); setIx(false); goTo(id); history.replaceState(null, '', id === 'top' ? location.pathname + location.search : `#${id}`);
});

// ---------- the record: numbers count up once
const ioCount = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return; ioCount.unobserve(e.target);
  const el = e.target, m = /^(\D*)(\d+)(.*)$/.exec(el.dataset.count); if (!m || reduced) return;
  const to = +m[2], t0 = performance.now(), dur = 1100 + Math.min(600, to);
  const step = now => { const k = clamp((now - t0) / dur, 0, 1), v = Math.round(to * (1 - Math.pow(1 - k, 4))); el.textContent = m[1] + v + m[3]; if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}), { rootMargin: '0px 0px -15% 0px' });
$$('[data-count]').forEach(el => ioCount.observe(el));

// ---------- photo strip: drag to move, count what is in the middle
const strip = $('[data-strip]'), stripN = $('[data-strip-n]');
if (strip) {
  let down = false, sx = 0, sl = 0, moved = 0;
  strip.addEventListener('pointerdown', e => { if (e.pointerType === 'touch') return; down = true; sx = e.clientX; sl = strip.scrollLeft; moved = 0; strip.classList.add('drag'); strip.setPointerCapture(e.pointerId); });
  strip.addEventListener('pointermove', e => { if (!down) return; moved = e.clientX - sx; strip.scrollLeft = sl - moved; });
  const up = () => { down = false; strip.classList.remove('drag'); }; strip.addEventListener('pointerup', up); strip.addEventListener('pointercancel', up);
  const snaps = $$('.snap', strip);
  strip.addEventListener('scroll', () => {
    const mid = strip.scrollLeft + strip.clientWidth / 2; let best = 0, bd = 1e9;
    snaps.forEach((s, i) => { const d = Math.abs(s.offsetLeft + s.offsetWidth / 2 - mid); if (d < bd) { bd = d; best = i; } });
    snaps.forEach((s, i) => s.classList.toggle('mid', i === best)); stripN.textContent = `${String(best + 1).padStart(2, '0')} / ${String(snaps.length).padStart(2, '0')}`;
  }, { passive: true });
  stripN.textContent = `01 / ${String(snaps.length).padStart(2, '0')}`; snaps[0]?.classList.add('mid');
}

// ---------- the stage
async function stage() {
  const canvas = $('#gl');
  if (!glOK()) { root.classList.add('nogl'); measure(null); ldTarget = 1; await ldGone; $('.hero').classList.add('in'); $$('.hero .card, .hero').forEach(e => e.classList.add('in')); addEventListener('scroll', () => { chrome(); if (!afterCh) setChapter(anchors[Math.round(uAt(scrollY))]?.ch || 'top'); }, { passive: true }); addEventListener('resize', () => measure(null)); chrome(); return; }
  try { await Promise.race([Promise.all([document.fonts.load('700 40px "Instrument Sans Variable"'), document.fonts.ready]), new Promise(r => setTimeout(r, 2500))]); } catch (e) { /* fonts are a nicety */ }
  ldTarget = 0.4;
  const [{ createStudio }, { createBall }, { createWorld }, { createDirector }] = await Promise.all([import('./gl/studio.js'), import('./gl/ball.js'), import('./gl/world.js'), import('./gl/director.js')]);
  await new Promise(r => setTimeout(r, 30));
  let studio, ball, world, dir;
  try {
    studio = createStudio(canvas, tier); ball = createBall(); ldTarget = 0.6; await new Promise(r => setTimeout(r, 20));
    world = createWorld(studio, ball, tier); dir = createDirector(studio, world, ball);
  } catch (err) { console.error(err); root.classList.add('nogl'); measure(null); ldTarget = 1; await ldGone; $$('.hero').forEach(e => e.classList.add('in')); return; }
  ldTarget = 0.85;

  const view = { w: 1, h: 1, aspect: 1, px: 0, py: 0 }; let lastW = 0, lastH = 0;
  function size(force) {
    const w = root.clientWidth, h = innerHeight;
    // phones change height when the URL bar slides; only re-make buffers when it is a real resize
    if (!force && w === lastW && Math.abs(h - lastH) < 130) return;
    lastW = w; lastH = h; const maxPx = { high: 3.4e6, mid: 2.2e6, low: 1.5e6 }[tier];
    const want = Math.min(devicePixelRatio || 1, studio.Q.dpr), cap = Math.sqrt(maxPx / (w * h));
    studio.renderer.setPixelRatio(Math.max(0.75, Math.min(want, cap)));
    view.w = w; view.h = h; view.aspect = w / h; canvas.style.height = `${h}px`; studio.setSize(w, h);
  }
  size(true); measure(dir);
  let t0 = performance.now(), last = t0, uS = uAt(scrollY), intro = reduced || scrollY > 20 || Q.has('at') ? 1 : 0, introT = 0, started = false, slow = 0, frames = 0, checked = 0;
  if (Q.has('at') && dir.index[Q.get('at')] !== undefined) { const a = anchors[dir.index[Q.get('at')]]; scrollTo(0, a.y + (+Q.get('o') || 0) * vh); uS = uAt(a.y); }
  let tx = 0, ty = 0, lastNear = -1;
  const byBeat = {}; beatsEls.forEach(el => { const c = el.querySelector('.card'); if (!c) return; if (el.dataset.beat) byBeat[el.dataset.beat] = c; else byBeat[el.dataset.beatTop] = c; });
  if (!coarse) addEventListener('pointermove', e => { tx = (e.clientX / innerWidth) * 2 - 1; ty = (e.clientY / innerHeight) * 2 - 1; }, { passive: true });
  addEventListener('resize', () => { size(false); measure(dir); chrome(); });
  addEventListener('scroll', chrome, { passive: true });
  if (document.fonts?.ready) document.fonts.ready.then(() => measure(dir));
  setTimeout(() => measure(dir), 1200);
  if ('ResizeObserver' in window) new ResizeObserver(() => { measure(dir); chrome(); }).observe($('#journey'));
  let visible = true; document.addEventListener('visibilitychange', () => { visible = !document.hidden; last = performance.now(); });

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    if (!visible) return;
    const y = scrollY, covered = y > journeyEnd + 10;
    canvas.style.visibility = covered ? 'hidden' : 'visible';
    if (covered) return;
    const u = uAt(y); uS += (u - uS) * (1 - Math.exp(-dt * (reduced ? 40 : 7.5)));
    if (Math.abs(u - uS) < 0.0004) uS = u;
    if (started && intro < 1) { introT += dt; intro = clamp(introT / 2.6, 0, 1); }
    view.px += (tx - view.px) * 0.06; view.py += (ty - view.py) * 0.06;
    dir.update(uS, (now - t0) / 1000, dt, intro, view);
    studio.render();
    const near = clamp(Math.round(uS), 0, anchors.length - 1);
    if (!afterCh) setChapter(anchors[near].ch || 'top');
    if (near !== lastNear && Math.abs(uS - near) < 0.3) { lastNear = near; byBeat[dir.beats[near].id]?.classList.add('in'); }
    // step the quality down if this machine is struggling (checked a few times after the opening)
    if (started && intro >= 1 && checked < 3 && !Q.has('nodegrade')) { frames++; if (dt > 0.034) slow++; if (frames >= 50) { if (slow > 28) { if (!studio.degrade()) checked = 3; } checked++; frames = 0; slow = 0; } }
  }
  // compile and draw once behind the loader, then open
  dir.update(uS, 0, 0.016, intro, view); studio.render();
  ldTarget = 1; requestAnimationFrame(frame);
  await ldGone; started = true; last = performance.now();
  $$('.hero').forEach(e => e.classList.add('in'));
  chrome();
  if (Q.has('debug')) window.__mk = { studio, world, dir, go: goTo, anchors: () => anchors, snap: () => { uS = uAt(scrollY); dir.snap(); } };
}
stage();
