// The booking page. Pick what you need, say who you are and how to reach you, send. The pass on the right fills in
// as you go. Nothing here asks the visitor to know Matt's ideas: the choices are the standard things people book someone for.
import { root, $, $$, clamp, lerp, params, reduced, fine, split, smear, C, createTheme, grainURL } from './kit.js';
import './styles/home.css';
import './styles/pages.css';
import './styles/book.css';
import { createField } from './gl/field.js';
import { createMenu } from './menu.js';
import { EMAIL } from './content.js';

// Sending. With a Web3Forms access key here, "Send to Matt" delivers the message to Matt's inbox from the page itself
// (get one free at web3forms.com: enter the email address, and the key arrives by email; it is safe to publish).
// Left empty, the button opens the visitor's own email app with the message written instead.
const FORM_KEY = 'f58dc9bb-2c36-479c-b51a-cfdfc011851d';

// What people can book. key: used in links (?for=podcast). code: the three letters on the pass.
// say: how it reads in the message ("I'd like to book you for ...").
const OPTS = [
  { key: 'podcast', code: 'POD', name: 'Podcast', line: 'Come on the show', say: 'a podcast' },
  { key: 'talk', code: 'SPK', name: 'Speaking', line: 'A talk at your event', say: 'a talk' },
  { key: 'panel', code: 'PNL', name: 'Panel', line: 'Join a panel or Q&A', say: 'a panel' },
  { key: 'press', code: 'PRS', name: 'Press quote', line: 'A comment for a story', say: 'a press quote' },
  { key: 'consult', code: 'CON', name: 'Consultation', line: 'An hour or a day of advice', say: 'a consultation' },
  { key: 'freelance', code: 'PRJ', name: 'Freelance project', line: 'Help on a campaign', say: 'a freelance project' },
  { key: 'brand', code: 'BRD', name: 'Partnership', line: 'Work together on something', say: 'a partnership' },
  { key: 'hello', code: 'HEY', name: 'Something else', line: 'Or just say hello', say: null },
];
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

{ const g = grainURL(); $('[data-grain]').style.backgroundImage = g; }
$$('[data-split]').forEach(split);
$('[data-list="opts"]').innerHTML = OPTS.map((o, i) => `<label class="bkp-opt"><input type="radio" name="for" value="${o.key}"><span class="mono">${String(i + 1).padStart(2, '0')}</span><b>${esc(o.name)}</b><em>${esc(o.line)}</em></label>`).join('');

const form = $('[data-form]'), pass = $('[data-pass]'), send = $('[data-send]'), you = $('[data-you]'), stamp = $('[data-stamp]'), bars = $('[data-bars]'), dateIn = $('input[name="date"]', form);
const val = n => (new FormData(form).get(n) || '').toString().trim();
$('[data-issued]').textContent = `Issued ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;
{ const t = new Date(); dateIn.min = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`; }

// a link such as ../book/?for=podcast arrives with that choice already made
{ const k = params.get('for'), r = k && $(`input[name="for"][value="${CSS.escape(k)}"]`, form); if (r) r.checked = true; }

// a value on the pass: printed with a small pop, as if it had just been stamped on
const pvs = Object.fromEntries($$('[data-pv]').map(el => [el.dataset.pv, el]));
function print(k, text) {
  const el = pvs[k]; if ((el.dataset.v || '') === text) return; el.dataset.v = text; el.textContent = text; el.classList.toggle('empty', !text);
  if (text && !reduced) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
}
function barcode(str) {
  let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  let x = 0, out = ''; while (x < 120) { h = Math.imul(h ^ (h >>> 13), 1274126177); const w = 1 + ((h >>> 5) & 3) * 0.7, gap = 0.8 + ((h >>> 9) & 3) * 0.6; out += `<rect x="${x.toFixed(1)}" y="0" width="${w.toFixed(1)}" height="22"/>`; x += w + gap; }
  bars.innerHTML = out;
}
// when: one of the quick answers, or a date they picked
function when() {
  const w = val('when'); if (w !== 'date') return { long: w, short: { 'As soon as possible': 'ASAP', 'In the next month': 'Next month', 'In the next few months': 'Soon', 'No rush': 'No rush' }[w] || '' };
  const d = val('date'); if (!d) return { long: '', short: '' }; const dt = new Date(d + 'T12:00:00');
  return { long: dt.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }), short: dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), date: true };
}
const emailOk = s => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s), phoneOk = s => s.replace(/\D/g, '').length >= 7;
function read() {
  const o = OPTS.find(x => x.key === val('for')), name = val('name'), org = val('org'), email = val('email'), phone = val('phone'), note = val('note'), w = when();
  const contact = !!((email && emailOk(email)) || (phone && phoneOk(phone)));
  const lines = ['Hi Matt,', '', o?.say ? `I'd like to book you for ${o.say}.` : "I'd like to get in touch."];
  if (w.long) lines.push(w.date ? `Date: ${w.long}.` : `Timing: ${w.long.toLowerCase()}.`);
  if (note) lines.push('', note);
  lines.push('', [name, org].filter(Boolean).join(', '));
  if (email) lines.push(`Email: ${email}`); if (phone) lines.push(`Phone: ${phone}`);
  return { o, name, org, email, phone, note, w, contact, ready: !!(o && name && contact), subject: `${o ? o.name : 'Hello'}${name ? ` · ${name}` : ''}${org ? ` (${org})` : ''}`, body: lines.join('\n').trim() };
}
let sent = false;
function update() {
  const s = read();
  print('code', s.o?.code || ''); print('what', s.o?.name || ''); print('when', s.w.short);
  print('who', [s.name, s.org].filter(Boolean).join(', ')); print('mono', s.name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join(''));
  print('contact', s.email || s.phone); print('note', s.note.length > 90 ? s.note.slice(0, 88) + '…' : s.note);
  you.classList.toggle('on', !!s.o); stamp.classList.toggle('on', s.ready); send.classList.toggle('wait', !s.ready);
  dateIn.hidden = val('when') !== 'date';
  barcode(s.subject + s.body);
}
form.addEventListener('input', update);
form.addEventListener('change', e => {
  // choosing what you need moves you on to the details (on a phone the details are below the fold)
  if (e.target.name === 'for') { const n = $('input[name="name"]', form); if (!n.value && fine) n.focus({ preventScroll: true }); if (innerWidth < 820) you.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }); }
  if (e.target.name === 'when' && e.target.value === 'date') { dateIn.hidden = false; dateIn.focus(); try { dateIn.showPicker?.(); } catch { /* not allowed here */ } }
  update();
});
// the note is tucked away until someone wants it
$('[data-add]').addEventListener('click', e => { e.currentTarget.hidden = true; const box = $('[data-notebox]'); box.hidden = false; $('textarea', box).focus(); });

// what is still missing, said plainly, with the first gap brought into view
function gap(s) {
  const say = (el, text) => { $('[data-note]').textContent = text; const step = el.closest('.bkp-step'); step.classList.add('nudge'); setTimeout(() => step.classList.remove('nudge'), 900); el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' }); if (el.matches('input')) el.focus({ preventScroll: true }); };
  if (!s.o) return say($('.bkp-opts'), 'Pick what you need first.'), true;
  if (!s.name) return say($('input[name="name"]', form), 'Add your name.'), true;
  if (!s.contact) { $$('[data-contact]').forEach(l => l.classList.add('bad')); return say($('input[name="email"]', form), 'Add an email or a phone number so Matt can reply.'), true; }
  return false;
}
const NOTE = $('[data-note]').innerHTML;
form.addEventListener('input', () => { $$('[data-contact].bad').forEach(l => l.classList.remove('bad')); if (!sent) $('[data-note]').innerHTML = NOTE; });
const mailto = s => `mailto:${EMAIL}?subject=${encodeURIComponent(s.subject)}&body=${encodeURIComponent(s.body)}`;
function done(s) {
  sent = true; window.va?.('pageview', { path: '/book/sent' });
  $('[data-done-name]').textContent = s.name.split(/\s+/)[0]; $('[data-done-contact]').textContent = s.email || s.phone;
  $$('.bkp-step, .bkp-send', form).forEach(el => (el.hidden = true)); const d = $('[data-done]'); d.hidden = false; d.focus({ preventScroll: true });
  stamp.textContent = 'Sent'; phys.v += 60; scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
}
form.addEventListener('submit', async e => {
  e.preventDefault(); if (sent) return; const s = read(); if (gap(s)) return;
  const label = $('[data-send-label]'), note = $('[data-note]');
  if (!FORM_KEY) { location.href = mailto(s); window.va?.('pageview', { path: '/book/sent' }); note.textContent = `Your email should have opened with the message ready. If it didn't, use Copy the message and send it to ${EMAIL}.`; return; }
  if (val('botcheck')) return; // a robot ticked the hidden box
  send.disabled = true; label.textContent = 'Sending…';
  try {
    const r = await fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ access_key: FORM_KEY, subject: `Booking: ${s.subject}`, from_name: s.name, replyto: s.email || undefined, What: s.o.name, When: s.w.long || 'Not said', Name: s.name, Company: s.org || '-', Email: s.email || '-', Phone: s.phone || '-', message: s.body }) });
    const j = await r.json().catch(() => ({})); if (!r.ok || j.success === false) throw new Error(j.message || r.status);
    done(s);
  } catch {
    // if the page can't send it, the visitor's own email app still can
    send.disabled = false; label.textContent = 'Send to Matt';
    note.innerHTML = `That didn't send. <a href="${esc(mailto(s))}">Send it from your email</a>, or use Copy the message.`;
  }
});
$('[data-copy]').addEventListener('click', async () => {
  const s = read(); if (gap(s)) return; const label = $('[data-copy-label]');
  try { await navigator.clipboard.writeText(`To: ${EMAIL}\nSubject: ${s.subject}\n\n${s.body}`); label.textContent = 'Copied'; window.va?.('pageview', { path: '/book/copied' }); } catch { label.textContent = 'Copy failed'; }
  setTimeout(() => (label.textContent = 'Copy the message'), 1800);
});

/* ---------- the moving light behind the page, and things arriving as they come up the screen */
const canvas = $('[data-field]'), theme = createTheme(), bar = $('[data-bar]');
let field = params.has('nogl') ? null : createField(canvas, { reduced });
if (!field) root.classList.add('no-gl'); else field.lost(() => { field = null; root.classList.add('no-gl'); });
const io = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; const el = e.target; io.unobserve(el); el.classList.add('in'); if (el.dataset.r === 'smear') smear(el); }), { threshold: 0.04 });
$$('[data-r]').forEach(el => io.observe(el));
let vw = innerWidth, vh = innerHeight;

/* ---------- the pass: it hangs from a strap, swings when the page moves, and leans toward the cursor */
const rig = $('[data-rig]'), swing = $('[data-swing]');
const mouse = { x: vw * 0.75, y: vh * 0.4 }, phys = { a: reduced ? 0 : -7, v: 0, rx: 0, ry: 0 };
addEventListener('pointermove', e => {
  if (e.pointerType === 'touch') return; const dx = e.clientX - mouse.x; mouse.x = e.clientX; mouse.y = e.clientY;
  if (field) field.point(e.clientX / vw, 1 - e.clientY / (canvas.clientHeight || vh));
  // brushing past the pass gives it a push
  if (!reduced) { const r = pass.getBoundingClientRect(); if (e.clientX > r.left - 40 && e.clientX < r.right + 40 && e.clientY > r.top - 40 && e.clientY < r.bottom + 40) phys.v += clamp(dx, -40, 40) * 0.16; }
}, { passive: true });
// grab it and let go: while held, the pass hangs from wherever the pointer is; released, it keeps the speed it had
let drag = null;
pass.addEventListener('pointerdown', e => { if (reduced || (e.pointerType === 'mouse' && e.button)) return; drag = { id: e.pointerId, to: phys.a }; try { pass.setPointerCapture(e.pointerId); } catch { /* not capturable */ } rig.classList.add('grab'); });
pass.addEventListener('pointermove', e => { if (!drag || e.pointerId !== drag.id) return; const r = rig.getBoundingClientRect(); drag.to = clamp((-Math.atan2(e.clientX - (r.left + r.width / 2), Math.max(80, e.clientY - r.top)) * 180) / Math.PI, -62, 62); });
const drop = e => { if (drag && (!e || e.pointerId === drag.id)) { drag = null; rig.classList.remove('grab'); } };
pass.addEventListener('pointerup', drop); pass.addEventListener('pointercancel', drop);
// each answer gives the pass a small knock, as if something was just printed on it
form.addEventListener('change', () => { if (!reduced) phys.v += (Math.random() > 0.5 ? 1 : -1) * 16; });

let lastSy = scrollY, vel = 0, last = performance.now(), time = 0;
const blob = [0.28, 0.9, 1, 0.12];
function tick(now) {
  const dt = Math.min(0.1, Math.max(0.001, (now - last) / 1000)); last = now; time += dt;
  const sy = scrollY, d = sy - lastSy; lastSy = sy; vel = lerp(vel, clamp(Math.abs(d) / (vh * 0.07)), 0.18);
  theme.ease(1);
  // the line under the header fills as the form does
  { const s = read(); bar.style.transform = `scaleX(${sent ? 1 : [s.o, s.name, s.contact].filter(Boolean).length / 3})`; }
  if (!reduced) {
    // a damped pendulum: scrolling shoves it, gravity brings it back; while held, it follows the hand
    if (drag) { const was = phys.a; phys.a = lerp(phys.a, drag.to, 0.3); phys.v = clamp((phys.a - was) / dt, -420, 420); }
    else { phys.v += clamp(d, -90, 90) * 0.05; phys.v += (-phys.a * 46 - phys.v * 5.2) * dt; phys.a = clamp(phys.a + phys.v * dt, -70, 70); }
    const r = pass.getBoundingClientRect(), on = r.bottom > 0 && r.top < vh;
    const tx = on && fine ? clamp(((mouse.x - (r.left + r.width / 2)) / vw) * 34, -13, 13) : 0, ty = on && fine ? clamp(((mouse.y - (r.top + r.height / 2)) / vh) * -22, -9, 9) : 0;
    phys.ry = lerp(phys.ry, tx, 0.08); phys.rx = lerp(phys.rx, ty, 0.08);
    swing.style.transform = `rotateZ(${phys.a.toFixed(2)}deg)`;
    pass.style.transform = `rotateX(${phys.rx.toFixed(2)}deg) rotateY(${(phys.ry + phys.a * 0.5).toFixed(2)}deg)`;
    pass.style.setProperty('--gx', `${(50 + phys.ry * 3.2).toFixed(1)}%`); pass.style.setProperty('--gy', `${(22 - phys.rx * 3).toFixed(1)}%`);
  }
  if (field) field.frame({ time, dt, scroll: sy / vh, flow: d / (canvas.clientHeight || vh), vel, grain: 0.05, theme: theme.gl, blob, energy: 0.8, quads: [], duoLo: C.raven, duoHi: C.sky, accent: C.poppy });
  requestAnimationFrame(tick);
}
addEventListener('resize', () => { vw = innerWidth; vh = innerHeight; field?.resize?.(); });
update(); theme.snap('raven'); requestAnimationFrame(tick);
createMenu();
