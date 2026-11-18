// The reading pages (thinking, work, plays, press). Their words are already in the HTML; this adds the moving light
// behind them, the changes of colour between sections, and the way things arrive as they come up the screen.
import { root, $, $$, clamp, lerp, params, reduced, split, smear, C, createTheme, grainURL } from './kit.js';
import './styles/home.css';
import './styles/pages.css';
import { createField } from './gl/field.js';

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
