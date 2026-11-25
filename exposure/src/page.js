// The reading pages (about, thinking and its articles, work, speaking, press). Their words are already in the HTML; this adds the moving light
// behind them, the changes of colour between sections, and the way things arrive as they come up the screen.
import { root, $, $$, clamp, lerp, params, reduced, split, smear, C, createTheme, grainURL } from './kit.js';
import './styles/home.css';
import './styles/pages.css';
import { createField } from './gl/field.js';
import { createMenu } from './menu.js';

{ const g = grainURL(); $('[data-grain]').style.backgroundImage = g; }
$$('[data-split]').forEach(split);

const canvas = $('[data-field]'), theme = createTheme(), bar = $('[data-bar]');
let field = params.has('nogl') ? null : createField(canvas, { reduced });
if (!field) root.classList.add('no-gl'); else field.lost(() => { field = null; root.classList.add('no-gl'); });
let vw = innerWidth, vh = innerHeight, zones = [];
const top = el => el.getBoundingClientRect().top + scrollY;
function measure() { vw = innerWidth; vh = innerHeight; zones = $$('[data-theme]').map(el => ({ top: top(el), bottom: top(el) + el.offsetHeight, name: el.dataset.theme, blob: el.dataset.blob.split(',').map(Number), energy: +el.dataset.energy })); }
const io = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; const el = e.target; io.unobserve(el); el.classList.add('in'); if (el.dataset.r === 'smear') smear(el); }), { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
$$('[data-r]').forEach(el => io.observe(el));

let lastSy = scrollY, vel = 0, last = performance.now(), time = 0;
const scene = { blob: [0.28, 0.9, 1, 0.12], energy: 0.8 };
function tick(now) {
  const dt = Math.min(0.1, Math.max(0.001, (now - last) / 1000)); last = now; time += dt;
  const sy = scrollY, d = sy - lastSy; lastSy = sy; vel = lerp(vel, clamp(Math.abs(d) / (vh * 0.07)), 0.18);
  const z = zones.find(z => sy + vh * 0.55 >= z.top && sy + vh * 0.55 < z.bottom);
  if (z) { theme.to(z.name); const k = 1 - Math.exp(-dt * 2.2); for (let i = 0; i < 4; i++) scene.blob[i] = lerp(scene.blob[i], z.blob[i], k); scene.energy = lerp(scene.energy, z.energy, k); }
  theme.ease(reduced ? 1 : 1 - Math.exp(-dt * 5.5));
  bar.style.transform = `scaleX(${clamp(sy / Math.max(1, document.documentElement.scrollHeight - vh)).toFixed(4)})`;
  if (field) field.frame({ time, dt, scroll: sy / vh, flow: d / (canvas.clientHeight || vh), vel, grain: 0.05, theme: theme.gl, blob: scene.blob, energy: scene.energy, quads: [], duoLo: C.raven, duoHi: C.sky, accent: C.poppy });
  requestAnimationFrame(tick);
}
addEventListener('pointermove', e => { if (field && e.pointerType !== 'touch') field.point(e.clientX / vw, 1 - e.clientY / (canvas.clientHeight || vh)); }, { passive: true });
addEventListener('resize', () => { field?.resize?.(); measure(); }); addEventListener('load', measure);
if ('ResizeObserver' in window) new ResizeObserver(measure).observe(document.body);
measure(); theme.snap('raven'); requestAnimationFrame(tick);

/* ---------- the about opening: as the page is held, the name lifts and shrinks to a label, the statement arrives word by
   word from a whisper (as on the home page), the two paragraphs follow, and the portrait settles in from a slow zoom */
{ const ab = $('[data-pin="ab"]');
  if (ab) {
    const say = $('[data-ab-say]', ab); split(say); const words = $$('.w', say), nums = $$('.ab-nums li', ab);
    let len = 1, at = 0; const m = () => { at = top(ab); len = Math.max(1, ab.offsetHeight - innerHeight); }; m();
    addEventListener('resize', m); addEventListener('load', m); if ('ResizeObserver' in window) new ResizeObserver(m).observe(document.body);
    const ease = x => 1 - (1 - clamp(x)) ** 3;
    const step = () => {
      const p = reduced ? 1 : clamp((scrollY - at) / len), n = words.length;
      ab.style.setProperty('--p', p.toFixed(4)); ab.style.setProperty('--e', ease(p / .42).toFixed(4));
      words.forEach((w, i) => { const t = reduced ? 1 : clamp((p - .16) * 2.4 * n - i); w.style.opacity = lerp(0, 1, t).toFixed(3); w.style.filter = t > .99 ? 'none' : `blur(${((1 - t) * .08).toFixed(3)}em)`; w.style.transform = `translateY(${((1 - t) * .25).toFixed(3)}em)`; });
      // the line under the statement turns over word by word, then the three numbers rise in turn
      const v = clamp((p - .5) / .42), k = Math.min(3, Math.floor(v * 4)), f = v * 4 - k;
      ab.style.setProperty('--v', ease((p - .46) / .08).toFixed(4)); if (ab.dataset.wi !== String(k)) ab.dataset.wi = k;
      ab.style.setProperty('--l', ease((p - .56) / .12).toFixed(4));   // the rule above the facts draws across just before they rise
      nums.forEach((li, i) => li.style.setProperty('--n', ease((p - .6 - i * .09) / .14).toFixed(4)));
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
}
createMenu();
$$('[data-copy]').forEach(b => b.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(b.closest('article').querySelector('p').textContent); b.textContent = 'Copied'; } catch { b.textContent = 'Select and copy'; }
  setTimeout(() => (b.textContent = 'Copy'), 1800);
}));
// the writing page: show only the pieces on one idea
$$('[data-filter]').forEach(b => b.addEventListener('click', () => {
  const k = b.dataset.filter; $$('[data-filter]').forEach(x => x.classList.toggle('on', x === b));
  $$('[data-feed] > [data-topic]').forEach(el => (el.hidden = k !== 'all' && el.dataset.topic !== k)); measure();
}));
$$('[data-copy-link]').forEach(b => b.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(b.dataset.copyLink); b.textContent = 'Copied'; } catch { b.textContent = b.dataset.copyLink; }
  setTimeout(() => (b.textContent = 'Copy link'), 1800);
}));
