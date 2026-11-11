// The booking page. Four questions build a brief; a pass hanging beside the form prints it as you go;
// the result is written out as a sentence and handed to the visitor's own email app. There is no server.
import { root, $, $$, clamp, lerp, params, reduced, fine, split, smear, C, createTheme, grainURL } from './kit.js';
import { createField } from './gl/field.js';
import { EMAIL, SEATS, TOPICS, BOOK } from './content.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fill = (name, html) => { const el = $(`[data-list="${name}"]`); if (el) el.innerHTML = html; };

/* ---------- the choices, from the same content the home page uses */
fill('formats', SEATS.map(([what, line, , q, key]) => `<label class="bk-opt" data-opt="${key}"><input type="radio" name="for" value="${key}"><span class="mono">${esc(what)}</span><span class="bk-opt-q">${esc(q)}</span><span class="bk-opt-l">${esc(line)}</span><i aria-hidden="true"></i></label>`).join(''));
fill('topics', TOPICS.map(t => `<label class="bk-chip"><input type="checkbox" name="topic" value="${esc(t)}"><span>${esc(t)}</span></label>`).join(''));
$$('[data-split]').forEach(split);
const grain = grainURL(); $('[data-grain]').style.backgroundImage = grain; root.style.setProperty('--grain', grain);

/* ---------- the brief */
const form = $('[data-form]'), brief = $('[data-brief]'), send = $('[data-send]'), copyBtn = $('[data-copy]'), copyLabel = $('[data-copy-label]');
const bar = $('[data-bar]'), count = $('[data-hd-count]'), stamp = $('[data-stamp]'), bars = $('[data-bars]');
const pv = Object.fromEntries($$('[data-pv]').map(el => [el.dataset.pv, el]));
const MODE = { person: 'in person', remote: 'remotely', open: '' }, MODE_PASS = { person: 'In person', remote: 'Remote', open: 'To be agreed' };
const val = n => (form.elements[n] ? form.elements[n].value.trim() : '');
function read() {
  const topics = $$('input[name="topic"]:checked', form).map(i => i.value); const other = val('other'); if (other) topics.push(other);
  return { key: val('for'), topics, mode: val('mode'), city: val('city'), when: val('when'), name: val('name'), org: val('org'), notes: val('notes') };
}
const list = a => (a.length < 2 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`);
// The sentence, as parts: [text, filled?]. Unanswered parts stay in the sentence as soft-focus prompts.
function sentence(s) {
  const parts = [['Hi Matt. ', null]];
  if (s.name || s.org) parts.push(["I'm ", null], [s.name || 'your name', !!s.name], ...(s.org ? [[' from ', null], [s.org, true]] : []), ['. ', null]);
  else parts.push(["I'm ", null], ['your name', false], ['. ', null]);
  parts.push(["We'd love you for ", null], [s.key ? BOOK[s.key].phrase : 'what?', !!s.key]);
  parts.push([' on ', null], [s.topics.length ? list(s.topics) : 'which topic?', s.topics.length > 0]);
  const where = [MODE[s.mode], s.city && `in ${s.city}`].filter(Boolean).join(' ');
  parts.push([', ', null], [where || (s.mode === 'open' ? 'wherever works' : 'where?'), !!where || s.mode === 'open']);
  parts.push([', around ', null], [s.when || 'when?', !!s.when], ['.', null]);
  return parts;
}
// The same thing as plain text for the email: only what was actually answered
function letter(s) {
  const who = s.name ? `I'm ${s.name}${s.org ? ` from ${s.org}` : ''}. ` : s.org ? `I'm writing from ${s.org}. ` : '';
  let ask = `We'd love you for ${s.key ? BOOK[s.key].phrase : 'something'}`;
  if (s.topics.length) ask += ` on ${list(s.topics)}`;
  const where = [MODE[s.mode], s.city && `in ${s.city}`].filter(Boolean).join(' '); if (where) ask += `, ${where}`;
  if (s.when) ask += `, around ${s.when}`;
  return `Hi Matt,\n\n${who}${ask}.${s.notes ? `\n\n${s.notes}` : ''}\n\n${s.name || ''}`.trim();
}
function barcode(str) {
  let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  let x = 0, out = ''; while (x < 120) { h = Math.imul(h ^ (h >>> 13), 1274126177); const w = 1 + ((h >>> 5) & 3) * 0.7, gap = 0.8 + ((h >>> 9) & 3) * 0.6; out += `<rect x="${x.toFixed(1)}" y="0" width="${w.toFixed(1)}" height="22"/>`; x += w + gap; }
  bars.innerHTML = out;
}
// a value on the pass: print it with the same smear the headlines use
function print(el, text) {
  if ((el.dataset.v || '') === text) return; el.dataset.v = text; el.textContent = text; el.classList.toggle('empty', !text);
  if (text && !reduced) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
}
let doneWas = -1;
function update() {
  const s = read();
  $$('.bk-opt', form).forEach(l => l.classList.toggle('on', $('input', l).checked));
  $$('.bk-chip, .bk-seg label', form).forEach(l => l.classList.toggle('on', $('input', l).checked));
  print(pv.for, s.key ? BOOK[s.key].pass : '');
  print(pv.topic, s.topics.join(' · '));
  print(pv.where, [MODE_PASS[s.mode], s.city].filter(Boolean).join(' — '));
  print(pv.when, s.when);
  print(pv.who, [s.name, s.org].filter(Boolean).join(', '));
  const done = [!!s.key, s.topics.length > 0, !!(s.mode || s.city || s.when), !!(s.name || s.org)].filter(Boolean).length;
  if (done !== doneWas) { doneWas = done; count.textContent = `Brief ${done} / 4`; bar.style.transform = `scaleX(${done / 4})`; stamp.classList.toggle('on', done === 4); root.classList.toggle('bk-ready', done === 4); }
  brief.innerHTML = sentence(s).map(([t, on]) => (on === null ? esc(t) : `<mark class="${on ? 'on' : ''}">${esc(t)}</mark>`)).join('');
  const subject = (s.key ? SEATS.find(r => r[4] === s.key)[2] : 'Hello') + (s.org ? ` — ${s.org}` : '');
  send.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(letter(s))}`;
  barcode(JSON.stringify(s));
}
form.addEventListener('input', update); form.addEventListener('change', update); form.addEventListener('submit', e => e.preventDefault());
copyBtn.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(letter(read())); copyLabel.textContent = 'Copied'; } catch { copyLabel.textContent = 'Select the text above to copy'; }
  setTimeout(() => { copyLabel.textContent = 'Copy the brief'; }, 2200);
});
// arriving from one of the questions on the home page: that route is already chosen
{ const k = params.get('for'); const r = k && $(`input[name="for"][value="${CSS.escape(k)}"]`, form); if (r) r.checked = true; }
update();

/* ---------- the field, the themes, the reveals: the same world as the home page */
const canvas = $('[data-field]'), theme = createTheme();
let field = params.has('nogl') ? null : createField(canvas, { reduced });
if (!field) root.classList.add('no-gl'); else field.lost(() => { field = null; root.classList.add('no-gl'); });
let vw = innerWidth, vh = innerHeight, zones = [];
function measure() {
  vw = innerWidth; vh = innerHeight;
  zones = $$('[data-theme]').map(el => { const top = el.getBoundingClientRect().top + scrollY; return { top, bottom: top + el.offsetHeight, name: el.dataset.theme, blob: el.dataset.blob.split(',').map(Number), energy: +el.dataset.energy }; });
}
const zoneAt = y => zones.find(z => y >= z.top && y < z.bottom);
const revealIO = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; const el = e.target; revealIO.unobserve(el); el.classList.add('in'); if (el.dataset.r === 'smear') smear(el); }), { rootMargin: '0px 0px -7% 0px', threshold: 0.08 });

/* ---------- the pass: it hangs from a strap, swings when the page moves, and leans toward the cursor */
const rig = $('[data-rig]'), swing = $('[data-swing]'), pass = $('[data-pass]');
const mouse = { x: vw * 0.75, y: vh * 0.4 }, phys = { a: reduced ? 0 : -7, v: 0, rx: 0, ry: 0 };
addEventListener('pointermove', e => {
  if (e.pointerType === 'touch') return; const dx = e.clientX - mouse.x; mouse.x = e.clientX; mouse.y = e.clientY;
  if (field) field.point(e.clientX / vw, 1 - e.clientY / (canvas.clientHeight || vh));
  // brushing past the pass gives it a push
  if (!reduced) { const r = pass.getBoundingClientRect(); if (e.clientX > r.left - 40 && e.clientX < r.right + 40 && e.clientY > r.top - 40 && e.clientY < r.bottom + 40) phys.v += clamp(dx, -40, 40) * 0.16; }
}, { passive: true });
addEventListener('pointerdown', e => { if (field) field.burst(e.clientX / vw, 1 - e.clientY / (canvas.clientHeight || vh), e.pointerType === 'touch' ? 1 : 0.7); }, { passive: true });
// each answer gives the pass a small knock, as if something was just printed on it
form.addEventListener('change', () => { if (!reduced) phys.v += (Math.random() > 0.5 ? 1 : -1) * 16; });

let sy = scrollY, lastSy = sy, vel = 0, last = performance.now(), time = 0;
const scene = { blob: [0.28, 0.9, 1, 0.12], energy: 1 };
function tick(now) {
  const dt = Math.min(0.1, Math.max(0.001, (now - last) / 1000)); last = now; time += dt;
  sy = scrollY; const d = sy - lastSy; lastSy = sy; vel = lerp(vel, clamp(Math.abs(d) / (vh * 0.07)), 0.18);
  const z = zoneAt(sy + vh * 0.55); if (z) { theme.to(z.name); const k = 1 - Math.exp(-dt * 2.2); for (let i = 0; i < 4; i++) scene.blob[i] = lerp(scene.blob[i], z.blob[i], k); scene.energy = lerp(scene.energy, z.energy, k); }
  theme.ease(reduced ? 1 : 1 - Math.exp(-dt * 5.5));

  if (!reduced && rig) {
    // a damped pendulum: scrolling shoves it, gravity brings it back
    phys.v += clamp(d, -90, 90) * 0.05; phys.v += (-phys.a * 46 - phys.v * 5.2) * dt; phys.a = clamp(phys.a + phys.v * dt, -24, 24);
    const r = pass.getBoundingClientRect(), on = fine && r.bottom > 0 && r.top < vh;
    const tx = on ? clamp(((mouse.x - (r.left + r.width / 2)) / vw) * 34, -13, 13) : 0, ty = on ? clamp(((mouse.y - (r.top + r.height / 2)) / vh) * -22, -9, 9) : 0;
    phys.ry = lerp(phys.ry, tx, 0.08); phys.rx = lerp(phys.rx, ty, 0.08);
    swing.style.transform = `rotateZ(${phys.a.toFixed(2)}deg)`;
    pass.style.transform = `rotateX(${phys.rx.toFixed(2)}deg) rotateY(${(phys.ry + phys.a * 0.5).toFixed(2)}deg)`;
    pass.style.setProperty('--gx', `${(50 + phys.ry * 3.2).toFixed(1)}%`); pass.style.setProperty('--gy', `${(22 - phys.rx * 3).toFixed(1)}%`);
  }
  if (field) field.frame({ time, dt, scroll: sy / vh, flow: d / (canvas.clientHeight || vh), vel, grain: 0.05, theme: theme.gl, blob: scene.blob, energy: scene.energy, quads: [], duoLo: C.raven, duoHi: C.sky, accent: C.poppy });
  requestAnimationFrame(tick);
}

let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(measure, 120); });
new ResizeObserver(() => { clearTimeout(rz); rz = setTimeout(measure, 150); }).observe(document.body);
measure(); { const z = zoneAt(scrollY + innerHeight * 0.55); theme.snap(z && z.name); }
requestAnimationFrame(tick);
Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise(r => setTimeout(r, 1600))]).then(() => {
  measure();
  requestAnimationFrame(() => {
    root.classList.add('ready');
    $$('.bk-hero [data-r]').forEach(el => { el.classList.add('in'); if (el.dataset.r === 'smear') smear(el); });
    $$('[data-r]:not(.in)').forEach(el => revealIO.observe(el));
    // someone who arrived with a route already chosen is taken past the opening to the questions, with theirs already answered
    if (params.get('for') && val('for')) setTimeout(() => { const next = $$('.bk-step')[0]; if (next) scrollTo({ top: next.getBoundingClientRect().top + scrollY - vh * 0.16, behavior: reduced ? 'auto' : 'smooth' }); }, 900);
  });
});
