// The virtual world: Matt's penthouse, one picture per room. Arrows (or the room names) walk between rooms; markers on
// the things in each room open a card about the work they stand for. The rooms and everything in them are listed in rooms.js.
import { root, $, $$, clamp, reduced, grainURL } from '../kit.js';
import '../styles/world.css';
import { ROOMS } from './rooms.js';

{ const g = grainURL(); $('[data-grain]').style.backgroundImage = g; root.style.setProperty('--grain', g); }

const IW = 2000, IH = 1116; // every room picture is this shape
const stage = $('[data-stage]');
const menu = $('[data-menu]'), explore = $('[data-explore]'), shade = $('[data-shade]'), card = $('[data-card]');
const prevBtn = $('[data-prev]'), nextBtn = $('[data-next]'), where = $('[data-where]');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------- build: a plate per room (the picture and its markers), and a line in the Explore menu per room */
const rooms = ROOMS.map((r, i) => {
  const el = document.createElement('section'); el.className = 'wd-room'; el.setAttribute('aria-label', r.name); el.inert = true;
  el.innerHTML = `<div class="wd-plate"><img class="wd-day" alt="${esc(r.alt)}" decoding="async" draggable="false">`
    + r.things.map((t, j) => `<button class="wd-dot${t.at[0] > 78 ? ' flip' : ''}" type="button" data-thing="${j}" style="left:${t.at[0]}%;top:${t.at[1]}%" aria-label="${esc(t.label)}: ${esc(t.t)}"><i aria-hidden="true"></i><span aria-hidden="true">${esc(t.label)}</span></button>`).join('') + '</div>';
  stage.append(el);
  const tab = document.createElement('button'); tab.type = 'button'; tab.className = 'wd-menu-i'; tab.textContent = r.name; tab.addEventListener('click', () => { closeMenu(); show(i); }); menu.append(tab);
  return { ...r, file: r.img, el, tab, plate: $('.wd-plate', el), img: $('.wd-day', el), c: { x: r.focus[0] / 100, y: r.focus[1] / 100 }, loaded: false };
});
function load(r) {
  if (r.loaded) return Promise.resolve(); r.loaded = true;
  return new Promise(res => { r.img.addEventListener('load', res, { once: true }); r.img.addEventListener('error', res, { once: true }); r.img.src = `../rooms/${r.file}`; });
}

/* ---------- fit: the picture always covers the screen. Where it is bigger than the screen, it can be dragged. */
let W = 1, H = 1, pw = 1, ph = 1, cur = 0, entered = false;
function place(r) {
  const hx = W / 2 / pw, hy = H / 2 / ph; r.c.x = clamp(r.c.x, hx, 1 - hx); r.c.y = clamp(r.c.y, hy, 1 - hy);
  r.plate.style.transform = `translate3d(${(W / 2 - r.c.x * pw).toFixed(1)}px,${(H / 2 - r.c.y * ph).toFixed(1)}px,0)`;
}
function fit() {
  W = stage.clientWidth; H = stage.clientHeight; const s = Math.max(W / IW, H / IH); pw = IW * s; ph = IH * s;
  rooms.forEach(r => { r.plate.style.width = pw.toFixed(1) + 'px'; r.plate.style.height = ph.toFixed(1) + 'px'; place(r); });
  root.classList.toggle('wd-pan', pw - W > 24 || ph - H > 24); root.classList.toggle('wd-far', pw > W * 1.3);
}
addEventListener('resize', fit);

/* ---------- drag to look around (only does anything when the picture is bigger than the screen) */
{ let p = null;
  stage.addEventListener('pointerdown', e => { if (!entered || e.target.closest('button')) return; p = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: 0 }; stage.setPointerCapture(e.pointerId); });
  stage.addEventListener('pointermove', e => {
    if (!p || e.pointerId !== p.id) return; const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY; p.moved += Math.abs(dx) + Math.abs(dy);
    if (p.moved > 4) { stage.classList.add('drag'); if (p.moved > 40) root.classList.add('wd-dragged'); } const r = rooms[cur]; r.c.x -= dx / pw; r.c.y -= dy / ph; place(r);
  });
  const lift = e => { if (!p || e.pointerId !== p.id) return; if (p.moved < 5) closeCard(); p = null; stage.classList.remove('drag'); };
  stage.addEventListener('pointerup', lift); stage.addEventListener('pointercancel', lift);
}

/* ---------- walking between rooms */
const wrap = i => (i + rooms.length) % rooms.length;
function label() {
  const r = rooms[cur], a = rooms[wrap(cur - 1)], b = rooms[wrap(cur + 1)];
  $('b', prevBtn).textContent = `Enter ${a.name}`; prevBtn.setAttribute('aria-label', `Go to the ${a.name.toLowerCase()}`);
  $('b', nextBtn).textContent = `Enter ${b.name}`; nextBtn.setAttribute('aria-label', `Go to the ${b.name.toLowerCase()}`);
  where.textContent = r.name;
  rooms.forEach((x, i) => { x.tab.setAttribute('aria-current', i === cur ? 'true' : 'false'); });
}
function show(i, dir) {
  i = wrap(i); if (i === cur && rooms[cur].el.classList.contains('on')) return;
  closeCard(); const from = rooms[cur], to = rooms[i]; if (dir == null) dir = i > cur ? 1 : -1; cur = i;
  warm(to); load(to).then(() => load(rooms[wrap(i + 1)])); load(rooms[wrap(i - 1)]);
  to.c.x = to.focus[0] / 100; to.c.y = to.focus[1] / 100; place(to);
  from.el.classList.remove('on'); from.el.inert = true; to.el.classList.add('on'); to.el.inert = !entered;
  if (!reduced && from !== to) {
    // the old room smears away in the direction of travel; the new one arrives from the other side
    const o = { duration: 900, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both' };
    from.el.animate([{ opacity: 1, transform: 'none', filter: 'blur(0)' }, { opacity: 0, transform: `translateX(${-dir * 5}%) scale(1.03)`, filter: 'blur(22px)' }], { ...o, duration: 700 });
    to.el.animate([{ opacity: 0, transform: `translateX(${dir * 5}%) scale(1.03)`, filter: 'blur(22px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }], o);
  } else { from.el.getAnimations().forEach(a => a.cancel()); to.el.getAnimations().forEach(a => a.cancel()); }
  label(); if (entered) history.replaceState(null, '', '#' + to.id);
}
prevBtn.addEventListener('click', () => show(cur - 1, -1)); nextBtn.addEventListener('click', () => show(cur + 1, 1));

/* ---------- Explore: the list of rooms, over the blurred room */
function openMenu() { closeCard(); root.classList.add('wd-exploring'); explore.setAttribute('aria-expanded', 'true'); menu.inert = false; rooms[cur].el.inert = true; }
function closeMenu(refocus) { if (!root.classList.contains('wd-exploring')) return; root.classList.remove('wd-exploring'); explore.setAttribute('aria-expanded', 'false'); menu.inert = true; rooms[cur].el.inert = false; if (refocus) explore.focus({ preventScroll: true }); }
explore.addEventListener('click', () => (root.classList.contains('wd-exploring') ? closeMenu() : openMenu()));
shade.addEventListener('click', () => closeMenu());

/* ---------- the card a marker opens */
let opener = null, asked = 0;
// photos are shown whole, at their own shape; their size is read once, ahead of the click where possible
const sizes = new Map();
const sizeOf = f => { if (!sizes.has(f)) sizes.set(f, new Promise(res => { const im = new Image(); im.onload = () => res([im.naturalWidth, im.naturalHeight]); im.onerror = () => res(null); im.src = `../photos/${f}`; })); return sizes.get(f); };
const warm = r => r.things.forEach(t => t.photo && sizeOf(t.photo[0]));
async function openCard(t, btn) {
  const [label_, href] = t.link || [], id = ++asked, dim = t.photo ? await sizeOf(t.photo[0]) : null; if (id !== asked) return;
  const tall = dim && dim[1] > dim[0] * 1.05;
  $('[data-card-body]', card).innerHTML = (dim ? `<figure class="wd-card-ph" style="aspect-ratio:${dim[0]} / ${dim[1]}"><img src="../photos/${t.photo[0]}" alt="${esc(t.photo[1])}" width="${dim[0]}" height="${dim[1]}"></figure>` : '')
    + `<div class="wd-card-head"><p class="mono wd-card-k">${esc(t.k)}</p><h2 class="wd-card-t" id="wd-card-t">${esc(t.t)}</h2>${t.stat ? `<p class="wd-card-stat"><b>${esc(t.stat[0])}</b><span class="mono">${esc(t.stat[1])}</span></p>` : ''}</div>`
    + `<div class="wd-card-foot"><p class="wd-card-p">${esc(t.p)}</p>${href ? `<a class="btn" href="${href}"><span>${esc(label_)}</span><i aria-hidden="true">→</i></a>` : ''}</div>`;
  card.classList.toggle('tall', !!tall); card.classList.toggle('wide', !!dim && !tall); card.scrollTop = 0;
  $$('.wd-dot.open').forEach(d => d.classList.remove('open')); btn.classList.add('open'); opener = btn;
  card.hidden = false; card.getBoundingClientRect(); root.classList.add('wd-carded'); card.focus({ preventScroll: true });
}
function closeCard(refocus) {
  asked++;
  if (!root.classList.contains('wd-carded')) return; root.classList.remove('wd-carded'); $$('.wd-dot.open').forEach(d => d.classList.remove('open'));
  setTimeout(() => { if (!root.classList.contains('wd-carded')) card.hidden = true; }, reduced ? 0 : 500);
  if (refocus && opener) opener.focus({ preventScroll: true }); opener = null;
}
stage.addEventListener('click', e => { const b = e.target.closest('.wd-dot'); if (!b) return; if (b.classList.contains('open')) return closeCard(true); openCard(rooms[cur].things[+b.dataset.thing], b); });
$('[data-card-close]', card).addEventListener('click', () => closeCard(true));

addEventListener('keydown', e => {
  if (!entered || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === 'Escape') { if (root.classList.contains('wd-exploring')) closeMenu(true); else closeCard(true); } else if (root.classList.contains('wd-exploring')) return; else if (e.key === 'ArrowLeft') show(cur - 1, -1); else if (e.key === 'ArrowRight') show(cur + 1, 1);;
});

/* ---------- the way in: the page opens straight into the first room, which comes up out of the dark once its picture has loaded */
function go() {
  if (entered) return; entered = true; root.classList.add('wd-in');
  rooms[cur].el.inert = false; history.replaceState(null, '', '#' + rooms[cur].id);
  load(rooms[wrap(cur + 1)]); load(rooms[wrap(cur - 1)]);
}

fit();
{ const start = Math.max(0, rooms.findIndex(r => r.id === location.hash.slice(1))); cur = start; const r = rooms[start];
  r.el.classList.add('on'); label(); warm(r);
  load(r).then(go); }
