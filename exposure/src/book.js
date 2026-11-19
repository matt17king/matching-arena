// The booking page. Pick what you need, say who you are, send. The pass on the right fills in as you go,
// and the message is written for you. Nothing here asks the visitor to know Matt's ideas: the choices are
// the standard things people book someone for.
import { root, $, $$, clamp, lerp, params, reduced, split, smear, C, createTheme, grainURL } from './kit.js';
import './styles/home.css';
import './styles/pages.css';
import './styles/book.css';
import { createField } from './gl/field.js';
import { createMenu } from './menu.js';
import { EMAIL } from './content.js';

// What people can book. key: used in links (?for=podcast). code: the three letters on the pass.
// say: how it reads in the message ("I'd like to book you for ...").
const OPTS = [
  { key: 'podcast', code: 'POD', name: 'Podcast', line: 'Come on the show', say: 'a podcast' },
  { key: 'talk', code: 'SPK', name: 'Speaking', line: 'A talk at your event', say: 'a talk' },
  { key: 'panel', code: 'PNL', name: 'Panel', line: 'Join a panel or Q&A', say: 'a panel' },
  { key: 'press', code: 'PRS', name: 'Press quote', line: 'A comment for a story', say: 'a press quote' },
  { key: 'consult', code: 'CON', name: 'Consultation', line: 'An hour or a day of advice', say: 'a consultation' },
  { key: 'freelance', code: 'PRJ', name: 'Freelance project', line: 'Help on a campaign', say: 'a freelance project' },
  { key: 'brand', code: 'BRD', name: 'Partnership', line: 'Work together on something', say: 'a brand partnership' },
  { key: 'hello', code: 'HEY', name: 'Something else', line: 'Or just say hello', say: null },
];
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

{ const g = grainURL(); $('[data-grain]').style.backgroundImage = g; }
$$('[data-split]').forEach(split);
$('[data-list="opts"]').innerHTML = OPTS.map((o, i) => `<label class="bkp-opt"><input type="radio" name="for" value="${o.key}"><span class="mono">${String(i + 1).padStart(2, '0')}</span><b>${esc(o.name)}</b><em>${esc(o.line)}</em></label>`).join('');

const form = $('[data-form]'), pass = $('[data-pass]'), send = $('[data-send]'), you = $('[data-you]');
const val = n => (new FormData(form).get(n) || '').toString().trim();
const pv = (k, text, empty) => { const el = $(`[data-pv="${k}"]`); el.textContent = text || empty; el.classList.toggle('empty', !text); };
$('[data-issued]').textContent = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

// a link such as ../book/?for=podcast arrives with that choice already made
{ const k = params.get('for'), r = k && $(`input[name="for"][value="${CSS.escape(k)}"]`, form); if (r) r.checked = true; }

function message() {
  const o = OPTS.find(x => x.key === val('for')), name = val('name'), org = val('org'), when = val('when'), note = val('note');
  const lines = ['Hi Matt,', '', o?.say ? `I'd like to book you for ${o.say}.` : "I'd like to get in touch."];
  if (when) lines.push(`Timing: ${when.toLowerCase()}.`);
  if (note) lines.push('', note);
  lines.push('', name ? `${name}${org ? `, ${org}` : ''}` : (org || ''));
  return { o, subject: `${o ? o.name : 'Hello'}${name ? ` · ${name}` : ''}${org ? ` (${org})` : ''}`, body: lines.join('\n').trim() };
}
function update() {
  const { o, subject, body } = message(), name = val('name'), org = val('org'), note = val('note'), ready = !!(o && name);
  pv('code', o?.code, '•••'); pv('what', o?.name, 'Pick one to start');
  pv('who', [name, org].filter(Boolean).join(' · '), 'Your name'); pv('when', val('when'), 'Whenever suits'); pv('note', note.length > 60 ? note.slice(0, 58) + '…' : note, 'Optional');
  pass.classList.toggle('has', !!o); pass.classList.toggle('ready', ready); you.classList.toggle('on', !!o);
  send.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  send.classList.toggle('wait', !ready);
}
form.addEventListener('input', update);
// choosing what you need moves you on to the details (on a phone the details are below the fold)
form.addEventListener('change', e => { if (e.target.name === 'for') { const n = $('input[name="name"]', form); if (!n.value && matchMedia('(pointer: fine)').matches) n.focus({ preventScroll: true }); if (innerWidth < 820) you.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }); } });
const nudge = () => { const o = val('for'); const t = o ? $('input[name="name"]', form) : $('.bkp-opts'); (o ? t : $('input[name="for"]', form)).focus(); t.closest('.bkp-step').classList.add('nudge'); setTimeout(() => t.closest('.bkp-step').classList.remove('nudge'), 900); };
send.addEventListener('click', e => { if (send.classList.contains('wait')) { e.preventDefault(); nudge(); return; } window.va?.('pageview', { path: '/book/sent' }); $('[data-note]').textContent = 'Your email should have opened with the message ready. If it didn\'t, use Copy the message and send it to ' + EMAIL + '.'; });
$('[data-copy]').addEventListener('click', async () => {
  if (send.classList.contains('wait')) { nudge(); return; }
  const { subject, body } = message(), label = $('[data-copy-label]');
  try { await navigator.clipboard.writeText(`To: ${EMAIL}\nSubject: ${subject}\n\n${body}`); label.textContent = 'Copied'; window.va?.('pageview', { path: '/book/copied' }); } catch { label.textContent = 'Copy failed'; }
  setTimeout(() => (label.textContent = 'Copy the message'), 1800);
});
// the note is tucked away until someone wants it
$('[data-add]').addEventListener('click', e => { e.currentTarget.hidden = true; const box = $('[data-notebox]'); box.hidden = false; $('textarea', box).focus(); });
update();

/* ---------- the moving light behind the page, and things arriving as they come up the screen (as on the reading pages) */
const canvas = $('[data-field]'), theme = createTheme(), bar = $('[data-bar]');
let field = params.has('nogl') ? null : createField(canvas, { reduced });
if (!field) root.classList.add('no-gl'); else field.lost(() => { field = null; root.classList.add('no-gl'); });
const io = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; const el = e.target; io.unobserve(el); el.classList.add('in'); if (el.dataset.r === 'smear') smear(el); }), { threshold: 0.04 });
$$('[data-r]').forEach(el => io.observe(el));
let vw = innerWidth, vh = innerHeight, lastSy = scrollY, vel = 0, last = performance.now(), time = 0;
const blob = [0.28, 0.9, 1, 0.12];
function tick(now) {
  const dt = Math.min(0.1, Math.max(0.001, (now - last) / 1000)); last = now; time += dt;
  const sy = scrollY, d = sy - lastSy; lastSy = sy; vel = lerp(vel, clamp(Math.abs(d) / (vh * 0.07)), 0.18);
  theme.ease(1);
  // the line under the header fills as the form does
  const done = [val('for'), val('name')].filter(Boolean).length / 2; bar.style.transform = `scaleX(${done})`;
  if (field) field.frame({ time, dt, scroll: sy / vh, flow: d / (canvas.clientHeight || vh), vel, grain: 0.05, theme: theme.gl, blob, energy: 0.8, quads: [], duoLo: C.raven, duoHi: C.sky, accent: C.poppy });
  requestAnimationFrame(tick);
}
addEventListener('pointermove', e => { if (field && e.pointerType !== 'touch') field.point(e.clientX / vw, 1 - e.clientY / (canvas.clientHeight || vh)); }, { passive: true });
addEventListener('resize', () => { vw = innerWidth; vh = innerHeight; field?.resize?.(); });
theme.snap('raven'); requestAnimationFrame(tick);
createMenu();
