// Long Exposure — behaviour.
// Native scroll throughout (nothing is hijacked or snapped). Everything that moves is eased toward the scroll position
// in one requestAnimationFrame loop, and the same loop drives the WebGL field behind the page.
import { root, $, $$, clamp, lerp, smooth, sstep, outExpo, pad2, params, reduced, fine, split, smear, C, createTheme, grainURL } from './kit.js';
import { createField } from './gl/field.js';
import { renderAll } from './render.js';
import { RULES } from './content.js';

const data = renderAll();

/* ---------- words */
$$('[data-split], [data-words]').forEach(split);
$$('.ix-list li').forEach((li, i) => li.style.setProperty('--n', i));

/* ---------- colour: three themes, eased between as sections pass the middle of the screen (see kit.js) */
const theme = createTheme();

/* ---------- the field */
const canvas = $('[data-field]');
let field = params.has('nogl') ? null : createField(canvas, { reduced });
if (!field) root.classList.add('no-gl'); else field.lost(() => { field = null; root.classList.add('no-gl'); });

{ const g = grainURL(); $('[data-grain]').style.backgroundImage = g; root.style.setProperty('--grain', g); }

/* ---------- measuring */
let vw = innerWidth, vh = innerHeight, docH = 1;
let themes = [], scenes = [], labels = [], cards = [];
const pins = {};
const pageTop = el => el.getBoundingClientRect().top + scrollY;
function measure() {
  vw = innerWidth; vh = innerHeight; docH = Math.max(1, document.documentElement.scrollHeight - vh);
  const box = el => { const top = pageTop(el); return { el, top, bottom: top + el.offsetHeight }; };
  themes = $$('[data-theme]').map(el => ({ ...box(el), name: el.dataset.theme }));
  scenes = $$('[data-scene]').map(el => ({ ...box(el), blob: el.dataset.blob.split(',').map(Number), energy: +el.dataset.energy }));
  labels = $$('[data-label]').map(el => ({ ...box(el), label: el.dataset.label }));
  cards = $$('.fr-pin').map((el, i) => ({ ...box(el), i, len: Math.max(1, el.offsetHeight - vh), fig: $('[data-fr-ph]', el), ph: $('[data-fr-ph] img', el) }));
  $$('[data-pin]').forEach(el => { const b = box(el); pins[el.dataset.pin] = { ...b, len: Math.max(1, el.offsetHeight - vh), stage: $('.pin-in', el) }; });
}
const progress = (pin, y) => clamp((y - pin.top) / pin.len);

/* ---------- the idea: words pull into focus */
const thWords = $$('.th-q .w'), thBody = $('[data-th-b]');
function thesis(p) {
  const n = thWords.length;
  thWords.forEach((w, i) => {
    const t = reduced ? 1 : sstep(0, 1, (p - (0.02 + (i / n) * 0.44)) / 0.12);
    w.style.opacity = (0.14 + 0.86 * t).toFixed(3); w.style.filter = t > 0.995 ? 'none' : `blur(${((1 - t) * 0.11).toFixed(3)}em)`;
  });
  const t = reduced ? 1 : sstep(0.56, 0.76, p);
  thBody.style.opacity = t.toFixed(3); thBody.style.filter = t > 0.995 ? 'none' : `blur(${((1 - t) * 14).toFixed(1)}px)`; thBody.style.transform = `translateY(${((1 - t) * 26).toFixed(1)}px)`;
}

/* ---------- how a fan is made: the track runs sideways, the stage in the middle is the one in focus */
const jrTrack = $('[data-jr-track]'), jrCards = $$('.jr-card'), jrBar = $('[data-jr-bar]'), jrDots = $$('.jr-line b'), jrN = $('[data-jr-n]');
let jrGeo = null, jrAt = -1;
function measureJourney() { const c = jrCards[0]; if (!c) return; const gap = parseFloat(getComputedStyle(jrTrack).columnGap) || 0; jrGeo = { w: c.offsetWidth, step: c.offsetWidth + gap }; }
let jrF = 0;
function journey(p, dt = 1, idle = true) {
  if (!jrGeo) return; const n = jrCards.length, raw = p * (n - 1);
  // like the photo strip: follow the scroll while it moves, settle on the nearest stage when it stops
  jrF = lerp(jrF, idle || reduced ? Math.round(raw) : raw, reduced || dt >= 1 ? 1 : 1 - Math.exp(-dt * (idle ? 6 : 14))); const f = jrF;
  jrTrack.style.transform = `translate3d(${(vw * 0.5 - jrGeo.w * 0.5 - f * jrGeo.step).toFixed(1)}px,0,0)`;
  jrCards.forEach((c, i) => { const d = Math.abs(i - f), t = clamp(d - 0.12); c.style.opacity = (1 - Math.min(0.82, t * 0.9)).toFixed(3); c.style.filter = t < 0.01 || reduced ? 'none' : `blur(${Math.min(14, t * 12).toFixed(1)}px)`; });
  jrBar.style.transform = `scaleX(${p.toFixed(4)})`;
  const at = Math.round(f);
  if (at !== jrAt) { jrAt = at; jrDots.forEach((d, i) => { d.classList.toggle('on', i <= at); d.classList.toggle('at', i === at); }); jrN.textContent = `Stage ${pad2(at + 1)} / ${pad2(n)}`; }
}

/* ---------- the court: one set of lines, three formats */
const court = (() => {
  const svg = $('[data-court]'); if (!svg) return null;
  const NS = 'http://www.w3.org/2000/svg', CX = 210, CY = 125;
  const mk = (tag, cls, parent = svg) => { const e = document.createElementNS(NS, tag); if (cls) e.setAttribute('class', cls); parent.append(e); return e; };
  svg.textContent = '';
  // left half in powder blue (the grass), right half in red (the clay): the red half is the one that then shrinks
  const fills = [mk('rect', 'c-fill c-fb'), mk('rect', 'c-fill c-fa')];
  const wall = mk('rect', 'c-wall');
  const lines = Array.from({ length: 15 }, () => mk('line'));
  const texts = [['GRASS', 120], ['CLAY', 300], ['STANDARD', 120], ['9% SMALLER', 300], ['20 × 10 M · WALLS IN PLAY · ALWAYS DOUBLES', 210]].map(([t, x]) => { const e = mk('text', 'c-t'); e.textContent = t; e.setAttribute('x', x); e.setAttribute('y', 240); e.setAttribute('text-anchor', 'middle'); return e; });
  // per format: [left half, right half] as [length, half-width (doubles), half-width (singles), service line from net]
  const STD = [180, 83, 62.3, 96.9], SML = [163.8, 75.5, 56.7, 88.2], PAD = [140, 70, 70, 97.3];
  const F = [[STD, STD], [STD, SML], [PAD, PAD]];
  const half = (s, [L, Wd, Ws, S]) => [
    [CX, CY - Wd, CX + s * L, CY - Wd], [CX, CY + Wd, CX + s * L, CY + Wd], [CX + s * L, CY - Wd, CX + s * L, CY + Wd],
    [CX, CY - Ws, CX + s * L, CY - Ws], [CX, CY + Ws, CX + s * L, CY + Ws], [CX + s * S, CY - Ws, CX + s * S, CY + Ws], [CX, CY, CX + s * S, CY],
  ];
  const mix = (A, B, t) => A.map((v, i) => lerp(v, B[i], t));
  const set = (e, o) => { for (const k in o) e.setAttribute(k, typeof o[k] === 'number' ? o[k].toFixed(2) : o[k]); };
  return function draw(s) {
    const i = Math.min(1, Math.floor(s)), t = smooth(clamp(s - i));
    const L = mix(F[i][0], F[i + 1][0], t), R = mix(F[i][1], F[i + 1][1], t);
    [...half(-1, L), ...half(1, R)].forEach((c, k) => set(lines[k], { x1: c[0], y1: c[1], x2: c[2], y2: c[3] }));
    const net = Math.max(L[1], R[1]) + 9; set(lines[14], { x1: CX, y1: CY - net, x2: CX, y2: CY + net });
    const w0 = clamp(1 - Math.abs(s)), w1 = clamp(1 - Math.abs(s - 1)), w2 = clamp(1 - Math.abs(s - 2));
    set(fills[0], { x: CX - L[0], y: CY - L[1], width: L[0], height: L[1] * 2 }); fills[0].style.opacity = (w0 * 0.5).toFixed(3);
    set(fills[1], { x: CX, y: CY - R[1], width: R[0], height: R[1] * 2 }); fills[1].style.opacity = (clamp(w0 + w1) * 0.92).toFixed(3);
    set(wall, { x: CX - L[0] - 7, y: CY - L[1] - 7, width: L[0] + R[0] + 14, height: L[1] * 2 + 14 }); wall.style.opacity = sstep(0.55, 1, w2).toFixed(3);
    [w0, w0, w1, w1, w2].forEach((w, k) => { texts[k].style.opacity = sstep(0.5, 1, w).toFixed(3); });
  };
})();
const ctTabs = $$('[data-ct-tab]'), ctPanels = $$('[data-ct-p]'); let ctAt = -1;
function courtScene(p) {
  if (!court) return; const s = sstep(0.2, 0.4, p) + sstep(0.6, 0.8, p); court(s);
  const at = Math.round(s); if (at !== ctAt) { ctAt = at; ctTabs.forEach((b, i) => { b.classList.toggle('on', i === at); b.setAttribute('aria-selected', i === at); }); ctPanels.forEach((x, i) => x.classList.toggle('on', i === at)); }
}
ctTabs.forEach((b, i) => b.addEventListener('click', () => { const pin = pins.court; if (pin) scrollTo({ top: pin.top + pin.len * [0.08, 0.5, 0.92][i], behavior: reduced ? 'auto' : 'smooth' }); }));

/* ---------- in the stands: the strip. Scroll or drag it; it only comes into focus when it stops. */
const strip = { f: 0, last: 0, speed: 0, at: -1, loaded: false };
const stripCap = $('.strip-cap'), stripN = $('[data-strip-n]'), stripT = $('[data-strip-t]'), stripL = $('[data-strip-l]');
function stripScene(sy, ssy, dt, idle) {
  const pin = pins.strip; if (!pin || !field) return;
  if (!strip.loaded && sy > pin.top - vh * 2.5) { strip.loaded = true; data.stands.forEach((u, i) => field.loadPhoto(i, u)); }
  if (sy < pin.top - vh * 1.2 || sy > pin.bottom + vh * 0.2) return;
  // while the page is moving the strip follows it exactly; the moment it stops, the strip settles on the nearest photo
  const n = data.stands.length, raw = progress(pin, ssy) * (n - 1), target = idle || reduced ? Math.round(raw) : raw;
  strip.f = lerp(strip.f, target, reduced ? 1 : 1 - Math.exp(-dt * (idle ? 7 : 11)));
  const sp = (strip.f - strip.last) / Math.max(dt, 1 / 240); strip.last = strip.f; strip.speed = lerp(strip.speed, sp, 0.35);
  const mob = vw <= 820, ch = canvas.clientHeight || vh;
  const cellH = mob ? vh * 0.44 : Math.min(vh * 0.58, 660), cellW = cellH * 0.74, step = cellW * (mob ? 1.07 : 1.1);
  const topPx = sy < pin.top ? pin.top - sy : sy > pin.top + pin.len ? pin.top + pin.len - sy : 0;
  const blur = reduced ? 0 : clamp((Math.abs(strip.speed) - 0.25) * 0.06, 0, 0.2), still = 1 - clamp(Math.abs(strip.speed) * 0.7);
  for (let i = 0; i < n; i++) {
    const dx = i - strip.f; if (Math.abs(dx) * step > vw * 0.5 + cellW * 1.6) continue;
    const focus = smooth(clamp(1 - Math.abs(dx))), sc = 0.84 + 0.26 * focus;
    const x = vw * 0.5 + dx * step + Math.sign(dx) * Math.min(1, Math.abs(dx)) * cellW * 0.1, y = topPx + vh * 0.475 + (i % 2 ? 1 : -1) * vh * 0.028 * (1 - focus);
    quads.push({ i, x: x / vw, y: 1 - y / ch, w: (cellW * sc) / vw, h: (cellH * sc) / ch, blur, duo: 1 - focus * still, alpha: 1, rad: 16, leak: 0.4 });
  }
  const at = clamp(Math.round(strip.f), 0, n - 1);
  if (at !== strip.at) {
    strip.at = at; const [, title, label] = data.standsMeta[at]; stripN.textContent = `${pad2(at + 1)} / ${pad2(n)}`;
    stripCap.classList.add('sw'); clearTimeout(strip.t); strip.t = setTimeout(() => { stripT.textContent = title; stripL.textContent = label; stripCap.classList.remove('sw'); }, 140);
  }
}
(() => { // drag the strip sideways: it simply moves the page, so scroll stays the single source of truth
  const pin = $('[data-pin="strip"]'), stage = pin && $('.pin-in', pin); if (!stage) return; let down = null;
  stage.addEventListener('pointerdown', e => { if (!field || (e.pointerType === 'mouse' && e.button)) return; down = { x: e.clientX, x0: e.clientX, id: e.pointerId }; stage.classList.add('drag'); });
  addEventListener('pointermove', e => {
    if (!down || e.pointerId !== down.id || !pins.strip) return; const dx = e.clientX - down.x; down.x = e.clientX;
    const mob = vw <= 820, cellH = mob ? vh * 0.44 : Math.min(vh * 0.58, 660), step = cellH * 0.74 * (mob ? 1.07 : 1.1);
    scrollBy(0, (-dx / step) * (pins.strip.len / (data.stands.length - 1)));
  }, { passive: true });
  const cellStep = () => { const mob = vw <= 820, cellH = mob ? vh * 0.44 : Math.min(vh * 0.58, 660); return cellH * 0.74 * (mob ? 1.07 : 1.1); };
  const up = e => {
    // a click (not a drag) on a photo to either side brings that photo to the middle
    if (down && e && e.type === 'pointerup' && Math.abs(e.clientX - down.x0) < 6 && pins.strip) {
      const n = data.stands.length, i = clamp(Math.round(strip.f + (e.clientX - vw / 2) / cellStep()), 0, n - 1);
      if (i !== Math.round(strip.f)) scrollTo({ top: pins.strip.top + (i / (n - 1)) * pins.strip.len, behavior: reduced ? 'auto' : 'smooth' });
    }
    down = null; stage.classList.remove('drag');
  };
  addEventListener('pointerup', up); addEventListener('pointercancel', up);
})();

/* ---------- photos that arrive out of the blur. The page only says where each one sits; the field draws it. */
const PH = { frame: 20, portrait: 30, press: 40 }; // texture slots (the strip uses 0 upward)
const quads = [];
const mouse = { x: innerWidth * 0.7, y: innerHeight * 0.4, sx: innerWidth * 0.7, sy: innerHeight * 0.4 };
function place(el, i, o = {}) {
  const r = el.getBoundingClientRect(), ch = canvas.clientHeight || vh; if (r.width < 2 || r.bottom < -vh * 0.4 || r.top > vh * 1.4) return;
  quads.push({ i, x: (r.left + r.width / 2 + (o.dx || 0)) / vw, y: 1 - (r.top + r.height / 2 + (o.dy || 0)) / ch, w: r.width / vw, h: r.height / ch, blur: o.blur || 0, duo: o.duo ?? 1, alpha: o.alpha ?? 1, rad: o.rad ?? 16, dots: o.dots || 0, feather: o.feather || 0, leak: o.leak ?? 0.5, leakAt: o.leakAt });
}
// each frame's photo streaks in from the side and settles sharp while its title card is pinned
function cardScene(c, y) {
  const p = reduced ? 1 : clamp((y - (c.top - vh * 0.6)) / (vh * 0.6 + c.len * 0.5)), e = smooth(p);
  c.fig.classList.toggle('on', p > 0.9);
  if (field && c.ph) place(c.ph, PH.frame + c.i, { blur: (1 - e) * 1.3, dx: (1 - e) * vw * 0.24, alpha: clamp(p * 3.2) });
}
// the portrait: out of the blur on arrival, back into it as you scroll away, leaning a little against the cursor
const heroPh = $('[data-hero-ph] img'); let heroT0 = 0;
function heroScene(now) {
  if (!field || !heroPh || sy > vh * 1.3) return;
  const k = reduced ? 1 : heroT0 ? outExpo(clamp((now - heroT0) / 2400)) : 0, s = reduced ? 0 : clamp(ssy / (vh * 0.9));
  mouse.sx = lerp(mouse.sx, mouse.x, 0.06); mouse.sy = lerp(mouse.sy, mouse.y, 0.06);
  const px = fine && !reduced ? (mouse.sx / vw - 0.5) * -20 : 0, py = fine && !reduced ? (mouse.sy / vh - 0.5) * -12 : 0;
  place(heroPh, PH.portrait, { blur: (1 - k) * 1.4 + s * 1.1, dx: (1 - k) * vw * 0.14 + px, dy: py, alpha: k * (1 - s * 0.75), feather: 0.8, rad: 0, leak: 0.45, leakAt: [-0.05, 0.95] });
}
// hovering an idea in the list holds its photo up in the clear space to the right of the titles, level with the cursor
const peek = { i: -1, on: 0, a: 0, y: 0, vy: 0 };
if (fine) $$('[data-peek]').forEach(el => { el.addEventListener('mouseenter', () => { peek.i = +el.dataset.peek; peek.on = 1; }); el.addEventListener('mouseleave', () => { peek.on = 0; }); });
function peekScene() {
  peek.a = lerp(peek.a, peek.on, 0.13);
  if (!field || peek.i < 0 || peek.a < 0.01) { peek.y = mouse.y; peek.vy = 0; return; }
  const w = Math.min(280, vw * 0.2), h = w / 0.74, ch = canvas.clientHeight || vh;
  const ny = lerp(peek.y, clamp(mouse.y, h * 0.5 + 76, vh - h * 0.5 - 16), 0.14); peek.vy = lerp(peek.vy, ny - peek.y, 0.3); peek.y = ny;
  quads.push({ i: PH.frame + peek.i, x: 0.81, y: 1 - peek.y / ch, w: w / vw, h: h / ch, blur: reduced ? 0 : clamp(Math.abs(peek.vy) / 30, 0, 0.8) + (1 - peek.a) * 0.8, duo: 1, alpha: peek.a, rad: 14, leak: 0.5 });
}

/* ---------- lists that focus on whatever is nearest the middle of the screen */
const focusLists = $$('[data-focus]').map(el => ({ el, items: [...el.children], on: false }));
const focusIO = new IntersectionObserver(es => es.forEach(e => { const l = focusLists.find(x => x.el === e.target); if (l) l.on = e.isIntersecting; }), { rootMargin: '10% 0px' });
focusLists.forEach(l => focusIO.observe(l.el));
function focusPull() {
  if (reduced) return;
  for (const l of focusLists) { if (!l.on) continue; for (const it of l.items) { const r = it.getBoundingClientRect(), d = Math.abs(r.top + r.height / 2 - vh * 0.5) / (vh * 0.5), t = clamp(d * 1.5 - 0.35); it.style.opacity = (1 - t * 0.66).toFixed(3); it.style.filter = t < 0.02 ? 'none' : `blur(${(t * 5).toFixed(1)}px)`; } }
}

/* ---------- reveals */
function count(el) {
  const m = el.dataset.count.match(/^(\D*)(\d+)(.*)$/); if (!m || reduced) return; const [, pre, num, post] = m, to = +num, t0 = performance.now();
  const step = now => { const t = clamp((now - t0) / 1500); el.textContent = pre + Math.round(to * outExpo(t)) + post; if (t < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
const revealIO = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return; const el = e.target; revealIO.unobserve(el); el.classList.add('in');
  if (el.dataset.r === 'smear') smear(el);
  $$('[data-count]', el).forEach(count);
}), { rootMargin: '0px 0px -7% 0px', threshold: 0.08 });
const devIO = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('dev', e.isIntersecting)), { rootMargin: '-32% 0px -32% 0px' });
$$('[data-dev]').forEach(el => (reduced ? el.classList.add('dev') : devIO.observe(el)));
$$('.ph-in').forEach(el => el.addEventListener('click', () => el.classList.toggle('dev')));

/* ---------- small interactions */
const rulesSide = $('[data-rules-side]'), ruleEls = $$('.rule'), ruleDots = $$('.rl-dots i'); let ruleAt = -1, ruleT;
function setRule(i) {
  if (i === ruleAt) return; ruleAt = i;
  ruleEls.forEach((r, k) => r.classList.toggle('on', k === i)); ruleDots.forEach((d, k) => d.classList.toggle('on', k <= i));
  if (!rulesSide) return; rulesSide.classList.add('sw'); clearTimeout(ruleT);
  ruleT = setTimeout(() => { rulesSide.firstElementChild.innerHTML = `<b>${pad2(i + 1)}</b><h4></h4><p></p>`; $('h4', rulesSide).textContent = RULES[i][0]; $('p', rulesSide).textContent = RULES[i][1]; rulesSide.classList.remove('sw'); }, 170);
}
// the eleven rules turn over with the scroll; clicking one moves the page to it
function rulesScene(p) { const n = ruleEls.length; if (n) setRule(clamp(Math.floor(p * n), 0, n - 1)); }
ruleEls.forEach((r, i) => $('.rule-b', r).addEventListener('click', () => { const pin = pins.rules; if (pin) scrollTo({ top: pin.top + ((i + 0.5) / ruleEls.length) * pin.len, behavior: reduced ? 'auto' : 'smooth' }); }));

// the three plays: each pair of names starts as a double exposure, slides apart into focus, then the outcome lands
const pxPlays = $$('[data-px]').map(el => ({ el, names: $$('.dx-names span', el), xs: $$('.dx-names i', el), out: $('.dx-out', el) })), pxN = $('[data-px-n]'), pxSteps = $$('.px .steps span'); let pxAt = -1;
function playsScene(p) {
  const n = pxPlays.length; if (!n) return; const x = clamp(p, 0, 0.9999) * n, at = Math.floor(x);
  pxPlays.forEach((pl, i) => {
    const u = x - i, vis = reduced ? +(i === at) : (i === 0 ? 1 : sstep(0, 0.1, u)) * (i === n - 1 ? 1 : 1 - sstep(0.9, 1, u));
    pl.el.style.opacity = vis.toFixed(3); pl.el.style.visibility = vis < 0.01 ? 'hidden' : 'visible';
    const r = reduced ? 1 : sstep(0.08, 0.5, u), o = reduced ? 1 : sstep(0.44, 0.62, u), m = pl.names.length;
    pl.names.forEach((sp, k) => { sp.style.transform = `translateX(${((k - (m - 1) / 2) * -0.85 * (1 - r)).toFixed(3)}em)`; sp.style.filter = r > 0.995 ? 'none' : `blur(${((1 - r) * 0.075).toFixed(3)}em)`; sp.style.opacity = (0.4 + 0.6 * r).toFixed(3); });
    pl.xs.forEach(e => { e.style.opacity = r.toFixed(3); });
    pl.out.style.opacity = o.toFixed(3); pl.out.style.transform = `translateY(${((1 - o) * 20).toFixed(1)}px)`; pl.out.style.filter = o > 0.995 ? 'none' : `blur(${((1 - o) * 10).toFixed(1)}px)`;
  });
  pxSteps.forEach((st, i) => { st.style.setProperty('--f', clamp(x - i).toFixed(3)); st.classList.toggle('on', i === at); });
  if (at !== pxAt) { pxAt = at; pxN.textContent = `Play ${pad2(at + 1)} / ${pad2(n)}`; }
}
// the brief builds itself, one question at a time
const bfRows = $$('.bf .brief-row');
function briefScene(p) {
  bfRows.forEach((row, i) => { const t = reduced ? 1 : sstep(0.05 + i * 0.2, 0.2 + i * 0.2, p); row.style.opacity = t.toFixed(3); row.style.transform = `translateY(${((1 - t) * 26).toFixed(1)}px)`; row.style.filter = t > 0.995 ? 'none' : `blur(${((1 - t) * 10).toFixed(1)}px)`; });
}
$$('.fm').forEach(f => $('.fm-b', f).addEventListener('click', () => { const on = !f.classList.contains('on'); $$('.fm').forEach(x => { x.classList.toggle('on', x === f && on); $('.fm-b', x).setAttribute('aria-expanded', x === f && on); }); }));

/* ---------- index + in-page links */
const ix = $('[data-index]'), ixBtn = $('[data-index-open]'); let ixT;
function setIndex(open) {
  clearTimeout(ixT); ixBtn.setAttribute('aria-expanded', open); $('span', ixBtn).textContent = open ? 'Close' : 'Index'; root.classList.toggle('ix-open', open);
  if (open) { ix.hidden = false; requestAnimationFrame(() => requestAnimationFrame(() => ix.classList.add('open'))); } else { ix.classList.remove('open'); ixT = setTimeout(() => { ix.hidden = true; }, 900); }
  document.body.style.overflow = open ? 'hidden' : '';
}
ixBtn.addEventListener('click', () => setIndex(ixBtn.getAttribute('aria-expanded') !== 'true'));
addEventListener('keydown', e => { if (e.key === 'Escape' && ixBtn.getAttribute('aria-expanded') === 'true') { setIndex(false); ixBtn.focus(); } });
const veil = $('[data-veil]');
function go(id, viaIndex) {
  const el = document.getElementById(id); if (!el) return; const top = id === 'top' ? 0 : pageTop(el), far = Math.abs(top - scrollY) > vh * 3;
  if (viaIndex) { document.body.style.overflow = ''; scrollTo(0, top); setIndex(false); }
  // a long way to travel: close the shutter, move, open it again, rather than a ten-second scroll through everything
  else if (far && !reduced) { veil.style.transition = 'opacity .28s ease'; veil.style.opacity = 1; setTimeout(() => { scrollTo(0, top); requestAnimationFrame(() => { veil.style.transition = 'opacity .7s ease'; veil.style.opacity = ''; }); }, 290); }
  else scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
  history.replaceState(null, '', id === 'top' ? location.pathname + location.search : `#${id}`);
}
document.addEventListener('click', e => { const link = e.target.closest('a[href^="#"]'); if (!link) return; const id = link.getAttribute('href').slice(1); if (!document.getElementById(id)) return; e.preventDefault(); go(id, !!link.closest('[data-index]')); });

/* ---------- pointer leaves a trail */
addEventListener('pointermove', e => { if (e.pointerType !== 'touch') { mouse.x = e.clientX; mouse.y = e.clientY; } if (field && e.pointerType !== 'touch') field.point(e.clientX / vw, 1 - e.clientY / (canvas.clientHeight || vh)); }, { passive: true });
addEventListener('pointerdown', e => { if (field) field.burst(e.clientX / vw, 1 - e.clientY / (canvas.clientHeight || vh), e.pointerType === 'touch' ? 1 : 0.7); }, { passive: true });

// seven markets: a wheel of names. It follows the scroll and settles on one market, which comes into focus.
const mkList = $('[data-mk-list]'), mkItems = mkList ? [...mkList.children] : [], mkN = $('[data-mk-n]'); let mkF = 0, mkAt = -1, mkH = 0;
function marketsScene(p) {
  const n = mkItems.length; if (!n) return; if (!mkH) mkH = mkItems[0].offsetHeight || 1;
  const raw = p * (n - 1); mkF = lerp(mkF, fidle || reduced ? Math.round(raw) : raw, reduced || fdt >= 1 ? 1 : 1 - Math.exp(-fdt * (fidle ? 6 : 14)));
  mkList.style.transform = `translate3d(0,${(mkList.parentElement.clientHeight / 2 - (mkF + 0.5) * mkH).toFixed(1)}px,0)`;
  mkItems.forEach((li, i) => { const d = Math.abs(i - mkF), t = clamp(d - 0.15); li.style.opacity = (1 - Math.min(0.8, t * 0.5)).toFixed(3); li.style.filter = t < 0.01 || reduced ? 'none' : `blur(${Math.min(12, t * 6).toFixed(1)}px)`; });
  const at = clamp(Math.round(mkF), 0, n - 1); if (at !== mkAt) { mkAt = at; mkItems.forEach((li, i) => li.classList.toggle('on', i === at)); mkN.textContent = `Market ${pad2(at + 1)} / ${pad2(n)}`; }
}
// press: one front page per piece of coverage. The headline sets itself a word at a time, the editor's ring goes round
// the part that matters, and the photo arrives as coarse newsprint dots that tighten until it is a photograph.
const pgItems = $$('[data-pg]').map(el => ({ el, words: $$('.pg-head .w', el), head: $('.pg-head', el), cols: $('.pg-cols', el), ph: $('[data-pg-ph] img', el) })), pgSteps = $$('.pg .steps span');
function pressScene(p) {
  const n = pgItems.length, pin = pins.press; if (!n || !pin) return; const x = clamp(p, 0, 0.9999) * n, at = Math.floor(x);
  // the first page starts setting as the section arrives, so it is never an empty screen
  const lead = clamp((ssy - (pin.top - vh * 0.75)) / (vh * 0.75)) * 0.62;
  pgItems.forEach((it, i) => {
    const raw = x - i, u = i === 0 ? Math.max(raw, lead) : raw;
    const vis = reduced ? +(i === at) : (i === 0 ? 1 : sstep(0, 0.1, raw)) * (i === n - 1 ? 1 : 1 - sstep(0.9, 1, raw));
    it.el.style.opacity = vis.toFixed(3); it.el.style.visibility = vis < 0.01 ? 'hidden' : 'visible';
    it.words.forEach((w, k) => { const t = reduced ? 1 : sstep(0.03 + k * 0.035, 0.24 + k * 0.035, u); w.style.opacity = t.toFixed(3); w.style.transform = `translateX(${((1 - t) * 0.55).toFixed(3)}em)`; w.style.filter = t > 0.995 ? 'none' : `blur(${((1 - t) * 0.12).toFixed(3)}em)`; });
    it.head.classList.toggle('ring', reduced || u > 0.46);
    const c = reduced ? 1 : sstep(0.3, 0.52, u); it.cols.style.opacity = c.toFixed(3); it.cols.style.transform = `translateY(${((1 - c) * 22).toFixed(1)}px)`;
    if (field && it.ph && vis > 0.01) { const e = reduced ? 1 : sstep(0.02, 0.36, u); place(it.ph, PH.press + i, { blur: (1 - e) * 1.2, dx: (1 - e) * vw * 0.2, alpha: vis * clamp(u * 5), dots: reduced ? 0.25 : lerp(1, 0.22, sstep(0.38, 0.82, u)), rad: 10, leak: 0.35 }); }
  });
  pgSteps.forEach((st, i) => { st.style.setProperty('--f', clamp(x - i).toFixed(3)); st.classList.toggle('on', i === at); });
}

let fdt = 1, fidle = true; // this frame's time step and whether the page has stopped moving, for scenes that settle
const SCENES = [['plays', playsScene], ['brief', briefScene], ['rules', rulesScene], ['markets', marketsScene], ['press', pressScene]];

/* ---------- the loop */
const bar = $('[data-bar]'), hdLabel = $('[data-hd-label]'), hdCount = $('[data-hd-count]');
let sy = scrollY, ssy = sy, lastSy = sy, vel = 0, last = performance.now(), time = 0, labelAt = -1, movedAt = 0;
const scene = { blob: [0.8, 0.72, 0.02, 1.02], energy: 1 };
const pick = (list, y) => { let best = null; for (const s of list) if (y >= s.top && y < s.bottom && (!best || s.bottom - s.top <= best.bottom - best.top)) best = s; return best; };
function tick(now) {
  const dt = Math.min(0.1, Math.max(0.001, (now - last) / 1000)); last = now; time += dt;
  sy = scrollY; const d = sy - lastSy; lastSy = sy; if (d) movedAt = time;
  ssy = Math.abs(sy - ssy) < 0.4 || reduced ? sy : lerp(ssy, sy, 1 - Math.exp(-dt * 12));
  vel = lerp(vel, clamp(Math.abs(d) / (vh * 0.07)), 0.18);
  const mid = sy + vh * 0.55;

  const th = pick(themes, mid); if (th) theme.to(th.name);
  theme.ease(reduced ? 1 : 1 - Math.exp(-dt * 5.5));
  const sc = pick(scenes, sy + vh * 0.5);
  if (sc) { const k = 1 - Math.exp(-dt * 2.2); for (let i = 0; i < 4; i++) scene.blob[i] = lerp(scene.blob[i], sc.blob[i], k); scene.energy = lerp(scene.energy, sc.energy, k); }
  const lb = pick(labels, mid), li = lb ? labels.indexOf(lb) : -1;
  if (li !== labelAt && lb) { labelAt = li; hdLabel.textContent = lb.label; hdCount.textContent = `${pad2(li)} / ${pad2(labels.length - 1)}`; }
  bar.style.transform = `scaleX(${clamp(sy / docH).toFixed(4)})`;

  quads.length = 0; heroScene(now);
  if (pins.thesis && sy > pins.thesis.top - vh && sy < pins.thesis.bottom) thesis(progress(pins.thesis, ssy));
  if (pins.journey && sy > pins.journey.top - vh && sy < pins.journey.bottom) journey(progress(pins.journey, ssy), dt, time - movedAt > 0.16);
  if (pins.court && sy > pins.court.top - vh && sy < pins.court.bottom) courtScene(progress(pins.court, ssy));
  fdt = dt; fidle = time - movedAt > 0.16;
  for (const [name, fn] of SCENES) { const pin = pins[name]; if (pin && sy > pin.top - vh && sy < pin.bottom) fn(progress(pin, ssy)); }
  stripScene(sy, ssy, dt, time - movedAt > 0.16);
  focusPull();
  for (const c of cards) if (sy > c.top - vh * 1.2 && sy < c.bottom + vh * 0.2) cardScene(c, ssy);
  peekScene();

  if (field) field.frame({ time, dt, scroll: ssy / vh, flow: d / (canvas.clientHeight || vh), vel, grain: 0.05, theme: theme.gl, blob: scene.blob, energy: scene.energy, quads, duoLo: C.raven, duoHi: C.sky, accent: C.poppy });
  requestAnimationFrame(tick);
}

/* ---------- start */
function layout() { measure(); measureJourney(); mkH = 0; fdt = 1; for (const [name, fn] of SCENES) fn(pins[name] ? progress(pins[name], scrollY) : 0); thesis(pins.thesis ? progress(pins.thesis, scrollY) : 0); journey(pins.journey ? progress(pins.journey, scrollY) : 0); courtScene(pins.court ? progress(pins.court, scrollY) : 0); }
let lastW = innerWidth, rz;
addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (innerWidth !== lastW || Math.abs(innerHeight - vh) > 120) { lastW = innerWidth; layout(); } else { vh = innerHeight; } }, 120); });
new ResizeObserver(() => { clearTimeout(rz); rz = setTimeout(layout, 150); }).observe(document.body);

layout();
{ const th = pick(themes, scrollY + innerHeight * 0.55); theme.snap(th && th.name); }
if (field) field.loadPhoto(PH.portrait, data.portrait);
requestAnimationFrame(tick);
Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise(r => setTimeout(r, 1600))]).then(() => {
  layout();
  if (location.hash && document.getElementById(location.hash.slice(1))) scrollTo(0, pageTop(document.getElementById(location.hash.slice(1))));
  requestAnimationFrame(() => {
    root.classList.add('ready'); heroT0 = performance.now();
    // the frame photos are not needed for a few screens yet
    if (field) setTimeout(() => { if (!field) return; data.frames.forEach((u, i) => field.loadPhoto(PH.frame + i, u)); data.press.forEach((u, i) => field.loadPhoto(PH.press + i, u)); }, 700);
    // the opening frame arrives whole, whatever the window height; everything else waits to be scrolled to
    $$('.hero [data-r]').forEach(el => { el.classList.add('in'); if (el.dataset.r === 'smear') smear(el); });
    $$('[data-r]:not(.in)').forEach(el => revealIO.observe(el));
  });
});
if (params.has('debug')) window.__mk = { pins, go, get field() { return field; }, scene };
