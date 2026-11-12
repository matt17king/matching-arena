// The Playbook: a hero you can spin, a brief machine, a deck of rules, a film room, a record and a photo board.
import '@fontsource-variable/instrument-sans/wdth.css';
import '@fontsource-variable/bodoni-moda/opsz-italic.css';
import '@fontsource/dm-mono/400.css';
import '@fontsource/dm-mono/500.css';
import './styles/site.css';
import { EMAIL, IDEAS, MACHINE, RULES, FILM, RECORD, RIGHTS, ROUTE, STANDS, WORKED_WITH, TALENT, PRESS, SEATS, TOPICS } from './content.js';

const Q = new URLSearchParams(location.search), B = import.meta.env.BASE_URL;
const $ = (s, el = document) => el.querySelector(s), $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pad2 = n => String(n).padStart(2, '0'), clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const fill = (name, html) => { const el = $(`[data-list="${name}"]`); if (el) el.innerHTML = html; return el; };
const mail = (subject = '', body = '') => `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}${body ? `&body=${encodeURIComponent(body)}` : ''}`;
const reduced = Q.has('still') || matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement; if (reduced) root.classList.add('still');
const lines = arr => arr.map((l, i) => `<span class="ln" style="--i:${i}"><span>${l}</span></span>`).join('');
const logo = (f, name) => `<i class="lg" role="img" aria-label="${esc(name)}" style="-webkit-mask-image:url('${B}logos/${f}');mask-image:url('${B}logos/${f}')"></i>`;

// ---------- hero
const heroEl = $('[data-hero]'), ideaLine = $('[data-idea-line]'), ideaNote = $('[data-idea-note]'), ideaN = $('[data-idea-n]'), ideaSport = $('[data-idea-sport]');
fill('swatches', IDEAS.map((d, i) => `<button type="button" data-sw="${i}" aria-pressed="${i === 0}"><i style="background:${d.bg}"></i><span>${esc(d.sport)}</span></button>`).join(''));
let idea = -1, hero = null, auto = null, touched = false;
function setIdea(i, user) {
  i = (i + IDEAS.length) % IDEAS.length; if (i === idea) return; idea = i; const d = IDEAS[i];
  heroEl.style.setProperty('--hbg', d.bg); heroEl.style.setProperty('--hfg', d.fg); root.style.setProperty('--nav', d.fg); root.style.setProperty('--hbg-now', d.bg);
  ideaLine.classList.remove('in'); void ideaLine.offsetWidth; ideaLine.innerHTML = lines(d.line); ideaLine.classList.add('in');
  ideaNote.textContent = d.note; ideaN.textContent = pad2(i + 1); ideaSport.textContent = d.sport;
  $$('[data-sw]').forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
  if (hero) hero.set(i);
  if (user) { touched = true; clearInterval(auto); }
}
$$('[data-sw]').forEach(b => b.addEventListener('click', () => setIdea(+b.dataset.sw, true)));
setIdea(0);
const glOK = () => { if (Q.has('nogl')) return false; try { return !!document.createElement('canvas').getContext('webgl2'); } catch (e) { return false; } };
const coarse = matchMedia('(pointer: coarse)').matches;
const tier = Q.get('tier') || (coarse ? ((navigator.deviceMemory || 4) >= 6 ? 'mid' : 'low') : 'high');
(async () => {
  if (!glOK()) { root.classList.add('nogl'); }
  else {
    try {
      try { await Promise.race([document.fonts.load('700 40px "Instrument Sans Variable"'), new Promise(r => setTimeout(r, 1500))]); } catch (e) { /* fine */ }
      const { createHero } = await import('./hero.js');
      hero = createHero({ canvas: $('#gl'), section: heroEl, tier, ideas: IDEAS, reduced, onReady: () => root.classList.add('gl') });
    } catch (err) { console.error(err); root.classList.add('nogl'); }
  }
  root.classList.add('ready');
  if (!reduced) auto = setInterval(() => { if (!touched && !document.hidden && scrollY < innerHeight * 0.5) setIdea(idea + 1); }, 5200);
  heroEl.addEventListener('pointerdown', () => { touched = true; clearInterval(auto); }, { once: true });
})();

// ---------- the brief machine
const reels = { sport: MACHINE.sports.map(s => s.name), love: MACHINE.loves.map(l => l.name), market: MACHINE.markets };
const pick = { sport: 3, love: 2, market: 3 }, turns = { sport: 0, love: 0, market: 0 };
const REPS = 9; // each reel repeats its list so a spin can roll through several turns
Object.keys(reels).forEach(k => fill(`reel-${k}`, Array.from({ length: REPS }, () => reels[k].map(v => `<li>${esc(v)}</li>`).join('')).join('')));
function setReel(k, i, spins = 0) {
  const n = reels[k].length; pick[k] = ((i % n) + n) % n;
  let row = turns[k]; const cur = ((row % n) + n) % n; row += ((pick[k] - cur + n) % n) + spins * n;
  const ul = $(`[data-list="reel-${k}"]`);
  if (row > n * (REPS - 1)) { ul.style.transition = 'none'; row = pick[k]; ul.style.transform = `translateY(calc(var(--rh) * -${row}))`; void ul.offsetWidth; ul.style.transition = ''; }
  turns[k] = row; ul.style.setProperty('--dur', `${spins ? 1.1 + spins * 0.35 : 0.55}s`); ul.style.transform = `translateY(calc(var(--rh) * -${row}))`;
}
const playEl = $('[data-play]');
function drawPlay() {
  const s = MACHINE.sports[pick.sport], l = MACHINE.loves[pick.love], m = MACHINE.markets[pick.market], rule = RULES[l.rule], film = FILM[l.film];
  const subject = `Brief: ${s.name}, through ${l.name.toLowerCase()} (${m})`;
  const body = `Hi Matt,\n\nI set the brief machine to:\n- Sport: ${s.name}\n- They already love: ${l.name}\n- Market: ${m}\n\nHere's what we're trying to do:\n\n`;
  playEl.classList.remove('in'); void playEl.offsetWidth;
  playEl.innerHTML = `
    <p class="mono play-k"><span>The play</span><span>${pad2(pick.sport + 1)}·${pad2(pick.love + 1)}·${pad2(pick.market + 1)}</span></p>
    <h3 class="play-h">${esc(s.name)}, through <em>${esc(l.name.toLowerCase())}.</em></h3>
    <ol class="play-steps">
      <li style="--i:0"><span class="mono">What we have</span><p>${esc(s.have)}</p></li>
      <li style="--i:1"><span class="mono">The side door</span><p><b>${esc(l.door)}</b> ${esc(l.move)}</p></li>
      <li style="--i:2"><span class="mono">The casting rule</span><p><b>${esc(rule[0])}.</b> ${esc(rule[1])}</p></li>
      <li style="--i:3"><span class="mono">In ${esc(m)}</span><p>${esc(MACHINE.local.replace('{market}', m))}</p></li>
      <li style="--i:4"><span class="mono">Steal from</span><p><b>${esc(film.title)}.</b> ${esc(film.steal)}</p></li>
    </ol>
    <div class="play-f" style="--i:5"><p class="play-out"><span class="mono">What it becomes</span><b>${esc(l.becomes)}</b><i aria-hidden="true">→</i><b class="hot">New fans</b></p>
      <a class="pill pill-volt" href="${mail(subject, body)}"><span>Send me this brief</span><i aria-hidden="true">→</i></a></div>`;
  playEl.classList.add('in');
}
let playT = 0;
function commit(delay) { clearTimeout(playT); playT = setTimeout(drawPlay, delay); }
$$('[data-reel]').forEach(el => {
  const k = el.dataset.reel; let y0 = null;
  const step = d => { setReel(k, pick[k] + d); commit(380); };
  $('.reel-b', el).addEventListener('click', () => step(1));
  $('.reel-w', el).addEventListener('click', () => step(1));
  el.addEventListener('wheel', e => { if (Math.abs(e.deltaY) < 8) return; e.preventDefault(); if (el._lock) return; el._lock = true; setTimeout(() => { el._lock = false; }, 260); step(e.deltaY > 0 ? 1 : -1); }, { passive: false });
  el.addEventListener('touchstart', e => { y0 = e.touches[0].clientY; }, { passive: true });
  el.addEventListener('touchend', e => { if (y0 === null) return; const d = e.changedTouches[0].clientY - y0; y0 = null; if (Math.abs(d) > 24) step(d < 0 ? 1 : -1); }, { passive: true });
});
$('[data-spin]').addEventListener('click', () => {
  const ks = Object.keys(reels); let longest = 0;
  ks.forEach((k, i) => { const n = reels[k].length; let to = Math.floor(Math.random() * n); if (to === pick[k]) to = (to + 1) % n; const spins = reduced ? 0 : 1 + i; setReel(k, to, spins); longest = Math.max(longest, spins ? 1100 + spins * 350 : 300); });
  playEl.classList.remove('in'); commit(longest - 150);
});
Object.keys(reels).forEach(k => setReel(k, pick[k])); drawPlay();

// ---------- eleven rules: a deck. The top card goes to the back.
const deck = $('[data-deck]'), deckN = $('[data-deck-n]'); let top = 0;
deck.innerHTML = RULES.map(([t, why], i) => `<article class="card" data-card="${i}"><p class="mono"><span>Rule</span><span>${pad2(i + 1)} / 11</span></p><h3>${esc(t)}</h3><p class="card-why">${esc(why)}</p><b class="card-no" aria-hidden="true">${pad2(i + 1)}</b></article>`).join('');
const cards = $$('.card', deck);
function layDeck(thrown = -1, dir = 1) {
  cards.forEach((c, i) => {
    const pos = (i - top + cards.length) % cards.length; c.style.zIndex = String(cards.length - pos); c.classList.toggle('top', pos === 0); c.setAttribute('aria-hidden', String(pos !== 0));
    if (i === thrown) return;
    c.style.transition = ''; c.style.opacity = pos > 4 ? '0' : '1';
    c.style.transform = `translate(${pos * 14}px, ${pos * -12}px) rotate(${pos === 0 ? 0 : (pos % 2 ? 1.6 : -1.2) * Math.min(pos, 3)}deg) scale(${1 - pos * 0.035})`;
  });
  deckN.textContent = `${pad2(top + 1)} / ${pad2(cards.length)}`;
}
function deal(dir = 1, dx = 0) {
  if (dir > 0) {
    const c = cards[top]; c.style.transition = 'transform .55s cubic-bezier(.3,.7,.2,1), opacity .5s ease'; c.style.transform = `translate(${(dx < 0 ? -1 : 1) * 120}%, -8%) rotate(${dx < 0 ? -14 : 14}deg)`; c.style.opacity = '0';
    const thrown = top; top = (top + 1) % cards.length; layDeck(thrown); setTimeout(() => layDeck(), reduced ? 0 : 430);
  } else { top = (top - 1 + cards.length) % cards.length; const c = cards[top]; c.style.transition = 'none'; c.style.transform = 'translate(-120%, -8%) rotate(-14deg)'; c.style.opacity = '0'; void c.offsetWidth; layDeck(); }
}
layDeck();
$('[data-deck-next]').addEventListener('click', () => deal(1)); $('[data-deck-prev]').addEventListener('click', () => deal(-1));
deck.addEventListener('keydown', e => { if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') { e.preventDefault(); deal(1); } if (e.key === 'ArrowLeft') { e.preventDefault(); deal(-1); } });
{ let x0 = 0, y0 = 0, down = false, moved = 0, card = null;
  deck.addEventListener('pointerdown', e => { card = cards[top]; down = true; x0 = e.clientX; y0 = e.clientY; moved = 0; card.style.transition = 'none'; deck.setPointerCapture(e.pointerId); });
  deck.addEventListener('pointermove', e => { if (!down) return; moved = e.clientX - x0; card.style.transform = `translate(${moved}px, ${(e.clientY - y0) * 0.3}px) rotate(${moved * 0.04}deg)`; });
  const end = () => { if (!down) return; down = false; if (Math.abs(moved) > 70 || Math.abs(moved) < 6) deal(1, moved); else layDeck(); };
  deck.addEventListener('pointerup', end); deck.addEventListener('pointercancel', () => { down = false; layDeck(); }); }

// ---------- film room: four panels, one open
const filmEl = fill('film', FILM.map((f, i) => `<article class="fp${i === 0 ? ' on' : ''}" data-fp="${i}" tabindex="0" aria-expanded="${i === 0}">
  <header><span class="mono">${pad2(i + 1)}</span><h3>${esc(f.title)}</h3><span class="mono fp-tag">${esc(f.tag)}</span></header>
  <div class="fp-b"><dl><div><dt class="mono">The play</dt><dd>${esc(f.play)}</dd></div><div><dt class="mono">Why it worked</dt><dd>${esc(f.why)}</dd></div><div class="steal"><dt class="mono">What I'd steal</dt><dd>${esc(f.steal)}</dd></div></dl></div></article>`).join(''));
const openFp = el => $$('.fp', filmEl).forEach(p => { const on = p === el; p.classList.toggle('on', on); p.setAttribute('aria-expanded', String(on)); });
$$('.fp', filmEl).forEach(p => { p.addEventListener('click', () => openFp(p)); p.addEventListener('mouseenter', () => { if (!coarse && innerWidth > 900) openFp(p); }); p.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openFp(p); } }); });

// ---------- record
fill('record', RECORD.map(([v, what, where], i) => `<li style="--i:${i}"><b data-count="${esc(v)}">${esc(v)}</b><p>${esc(what)}</p><span class="mono">${esc(where)}</span></li>`).join(''));
const tk = RIGHTS.map(r => `<span>${esc(r)}</span><i aria-hidden="true"></i>`).join(''); fill('rights', `<div>${tk}</div><div aria-hidden="true">${tk}</div>`);
const tn = TALENT.map(([n]) => `<span>${esc(n)}</span><i aria-hidden="true"></i>`).join(''); fill('talent', `<div>${tn}</div><div aria-hidden="true">${tn}</div>`);
fill('route', ROUTE.map(([y, n, f], i) => `<li style="--i:${i}"><span class="mono">${y}</span>${logo(f, n)}<b>${esc(n)}</b></li>`).join(''));
fill('logos', WORKED_WITH.map(([n, f]) => `<li title="${esc(n)}">${logo(f, n)}</li>`).join(''));
const ioCount = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return; ioCount.unobserve(e.target); const el = e.target, m = /^(\D*)(\d+)(.*)$/.exec(el.dataset.count); if (!m || reduced) return;
  const to = +m[2], t0 = performance.now(), dur = 1300; const step = now => { const k = clamp((now - t0) / dur, 0, 1); el.textContent = m[1] + Math.round(to * (1 - Math.pow(1 - k, 4))) + m[3]; if (k < 1) requestAnimationFrame(step); }; requestAnimationFrame(step);
}), { rootMargin: '0px 0px -12% 0px' });
$$('[data-count]').forEach(el => ioCount.observe(el));

// ---------- the board: prints you can pick up
const board = fill('board', [['portrait.jpg', 'Matt King', 'No. 17'], ...STANDS].map(([f, t, l], i) => `<figure class="pin" data-pin style="--x:${[4, 24, 45, 66, 82, 12, 33, 55, 74, 2, 40, 62][i]}%;--y:${[6, 0, 9, 2, 12, 50, 44, 52, 46, 24, 22, 26][i]}%;--r:${[-4, 3, -2, 5, -3, 4, -5, 2, -3, 6, -1, 3][i]}deg"><img src="${B}photos/${f}" alt="${esc(t)}: ${esc(l)}" loading="lazy" decoding="async" draggable="false"><figcaption class="mono"><b>${esc(t)}</b><span>${esc(l)}</span></figcaption></figure>`).join(''));
if (!coarse) { let z = 20;
  $$('[data-pin]', board).forEach(p => { let down = false, sx = 0, sy = 0, ox = 0, oy = 0;
    p.addEventListener('pointerdown', e => { down = true; sx = e.clientX; sy = e.clientY; p.style.zIndex = String(++z); p.classList.add('held'); p.setPointerCapture(e.pointerId); e.preventDefault(); });
    p.addEventListener('pointermove', e => { if (!down) return; p.style.setProperty('--dx', `${ox + e.clientX - sx}px`); p.style.setProperty('--dy', `${oy + e.clientY - sy}px`); });
    const end = e => { if (!down) return; down = false; ox += e.clientX - sx; oy += e.clientY - sy; p.classList.remove('held'); }; p.addEventListener('pointerup', end); p.addEventListener('pointercancel', end); }); }

// ---------- book
fill('seats', SEATS.map(([what, line, subject, ask], i) => `<li><a href="${mail(subject)}"><span class="mono">${pad2(i + 1)}</span><b>${esc(ask)}</b><span class="ask-w"><em class="mono">${esc(what)}</em>${esc(line)}</span><i aria-hidden="true">→</i></a></li>`).join(''));
fill('topics', TOPICS.map(t => `<li>${esc(t)}</li>`).join(''));
fill('press', PRESS.map(p => `<article><img src="${B}photos/${p.img}" alt="${esc(p.alt)}" style="object-position:${p.pos}" loading="lazy" decoding="async"><div><p class="mono"><span>${esc(p.source)}</span><span>${esc(p.date)}</span></p><h3>${esc(p.headline)}</h3></div></article>`).join(''));
$$('[data-mail]').forEach(a => { a.href = mail('Hello'); });

// ---------- reveals, nav colour, in-page links
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -10% 0px' });
$$('.sec-h, .mc, .deck-w, .reelx, .nums li, .route li, .co, .board, .asks li, .book-b, .ft').forEach(el => io.observe(el));
const nav = $('.nav'), secs = $$('main > section');
function chrome() { let cur = secs[0]; secs.forEach(s => { if (s.getBoundingClientRect().top <= 30) cur = s; }); nav.dataset.on = cur.id || 'hero'; root.classList.toggle('scrolled', scrollY > 30); }
addEventListener('scroll', chrome, { passive: true }); chrome();
document.addEventListener('click', e => { const a = e.target.closest('a[href^="#"]'); if (!a) return; const el = document.getElementById(a.getAttribute('href').slice(1)); if (!el) return; e.preventDefault(); el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }); });
