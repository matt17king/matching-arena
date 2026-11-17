// The reworked home page (a preview, at /v2/). Eight sections, each with one job: who, the idea, the proof, five ideas,
// the virtual world, the stands, the press, the ask. The words come from content.js, cut to what a visitor needs; the
// long form belongs on its own pages. It wears the walnut look: the rooms' neutrals, bronze for light, red for emphasis.
import { root, $, $$, clamp, lerp, pad2, params, reduced, split, smear, C, createTheme, grainURL } from './kit.js';
import './styles/v2.css';
import { createField } from './gl/field.js';
import { FRAMES, RECORD, WORKED_WITH, TALENT, STANDS, PRESS, SEATS, EMAIL, LINKEDIN, INSTAGRAM } from './content.js';

const B = '../', esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fill = (name, html) => { const el = $(`[data-list="${name}"]`); if (el) el.innerHTML = html; };

/* ---------- fill the lists */
// the four numbers that say the most: reach, scale, and two results
fill('stats', [RECORD[0], RECORD[1], RECORD[5], RECORD[4]].map(([v, what, where], i) => `<div class="v-stat" data-r="fade" style="--d:${i * 0.08}s"><b>${esc(v)}</b><p>${esc(what)}</p><span class="mono">${esc(where)}</span></div>`).join(''));
fill('logos', WORKED_WITH.map(([n, f]) => `<li><span class="lg" role="img" aria-label="${esc(n)}" style="-webkit-mask-image:url(${B}logos/${f});mask-image:url(${B}logos/${f})"></span></li>`).join(''));
fill('names', ['Lamine Yamal', ...TALENT.map(t => t[0])].slice(0, 9).map(esc).join('<i aria-hidden="true"> · </i>'));
fill('ideas', FRAMES.map((f, i) => `<article class="v-idea${i ? '' : ' on'}" data-idea="${i}">
  <div class="v-idea-t"><p class="mono v-idea-n">${f.n} / 05</p><h3 class="v-idea-h">${f.title.join(' ')}</h3><p class="v-idea-p">${esc(f.intro)}</p></div>
  <figure class="v-idea-ph"><img src="${B}photos/${f.photo[0]}" alt="${esc(f.photo[3])}" loading="lazy" decoding="async"><figcaption class="mono">${esc(f.photo[1])}</figcaption></figure>
</article>`).join(''));
fill('idea-steps', FRAMES.map(f => `<span><i></i><b class="mono">${f.n}</b></span>`).join(''));
fill('stands', STANDS.map(([f, t, l]) => `<figure class="v-shot"><img src="${B}photos/${f}" alt="${esc(t)}" loading="lazy" decoding="async"><figcaption><b>${esc(t)}</b><span class="mono">${esc(l)}</span></figcaption></figure>`).join(''));
fill('press', PRESS.map((p, i) => `<article class="v-card" data-r="fade" style="--d:${i * 0.08}s">
  <figure><img src="${B}photos/${p.img}" alt="${esc(p.alt)}" loading="lazy" decoding="async" style="object-position:${p.pos}"></figure>
  <p class="mono"><b>${esc(p.source)}</b><span>${esc(p.date)}</span></p><h3>${esc(p.headline)}</h3>
  ${p.url ? `<a class="v-card-a" href="${p.url}" target="_blank" rel="noopener">Read the article ↗</a>` : ''}</article>`).join(''));
fill('routes', SEATS.map(([what, , , , key]) => `<li><a href="${B}book/?for=${key}"><span>${esc(what)}</span><i aria-hidden="true">→</i></a></li>`).join(''));
fill('contact', `<a href="mailto:${EMAIL}">${EMAIL}</a><a href="${LINKEDIN}" target="_blank" rel="noopener">LinkedIn ↗</a><a href="${INSTAGRAM}" target="_blank" rel="noopener">Instagram ↗</a>`);

{ const g = grainURL(); $('[data-grain]').style.backgroundImage = g; }
$$('[data-split]').forEach(split);
const sayEl = $('[data-say]'); split(sayEl); const sayWords = $$('.w', sayEl), saySub = $('[data-say-sub]');

/* ---------- the field and the themes: the same moving light as before, in the new colours */
const canvas = $('[data-field]'), theme = createTheme();
let field = params.has('nogl') ? null : createField(canvas, { reduced });
if (!field) root.classList.add('no-gl'); else field.lost(() => { field = null; root.classList.add('no-gl'); });
let vw = innerWidth, vh = innerHeight, zones = [], pins = {};
const top = el => el.getBoundingClientRect().top + scrollY;
function measure() {
  vw = innerWidth; vh = innerHeight;
  zones = $$('[data-theme]').map(el => ({ top: top(el), bottom: top(el) + el.offsetHeight, name: el.dataset.theme, blob: el.dataset.blob.split(',').map(Number), energy: +el.dataset.energy }));
  pins = Object.fromEntries($$('[data-pin]').map(el => [el.dataset.pin, { top: top(el), len: Math.max(1, el.offsetHeight - vh) }]));
  const w = $('.v-world'); pins.world = { top: top(w), h: w.offsetHeight };
}
const prog = p => (p ? clamp((scrollY - p.top) / p.len) : 0);
const io = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; const el = e.target; io.unobserve(el); el.classList.add('in'); if (el.dataset.r === 'smear') smear(el); }), { rootMargin: '0px 0px -7% 0px', threshold: 0.08 });
$$('[data-r]').forEach(el => io.observe(el));

/* ---------- the hero: the banner picture drifts a little as the page leaves it. Nothing else moves. */
const bannerImg = $('[data-banner-img]');
const heroTick = () => { if (reduced || scrollY > vh * 1.2) return; bannerImg.style.transform = `translate3d(0,${(scrollY * 0.05).toFixed(1)}px,0) scale(1.08)`; };

/* ---------- the scenes *//* ---------- the scenes *//* ---------- the scenes *//* ---------- the scenes *//* ---------- the scenes */
const ideas = $$('[data-idea]'), ideaSteps = $$('[data-list="idea-steps"] span'), ideaCount = $('[data-ideas-count]'); let ideaAt = -1;
$('.v-ideas').style.setProperty('--len', (ideas.length * 0.85).toFixed(2));
const track = $('[data-track]'), worldBg = $('[data-world-bg] img'), bar = $('[data-bar]');
function scenes() {
  // the idea: each word comes up from a whisper as the page is held
  const p = prog(pins.say), n = sayWords.length;
  sayWords.forEach((w, i) => { const t = reduced ? 1 : clamp(p * 1.5 * n - i); w.style.opacity = lerp(0.14, 1, t).toFixed(3); w.style.filter = t > 0.99 ? 'none' : `blur(${((1 - t) * 0.06).toFixed(3)}em)`; });
  const s = reduced ? 1 : clamp((p - 0.72) / 0.2); saySub.style.opacity = s.toFixed(3); saySub.style.transform = `translateY(${((1 - s) * 18).toFixed(1)}px)`;
  // five ideas: one on screen at a time
  const x = prog(pins.ideas) * ideas.length, at = Math.min(ideas.length - 1, Math.floor(x));
  if (at !== ideaAt) { ideaAt = at; ideas.forEach((el, i) => { el.classList.toggle('on', i === at); el.classList.toggle('was', i < at); }); ideaCount.textContent = `${pad2(at + 1)} / ${pad2(ideas.length)}`; }
  ideaSteps.forEach((st, i) => { st.style.setProperty('--f', clamp(x - i).toFixed(3)); st.classList.toggle('on', i === at); });
  // the stands: the strip travels its whole length while the section is held
  const over = Math.max(0, track.scrollWidth - track.clientWidth); track.style.transform = `translate3d(${(-prog(pins.strip) * over).toFixed(1)}px,0,0)`;
  // the world: the room eases back as it comes up the screen
  if (pins.world && !reduced) { const t = clamp((scrollY + vh - pins.world.top) / (pins.world.h + vh)); worldBg.style.transform = `scale(${(1.18 - t * 0.16).toFixed(4)}) translateY(${((t - 0.5) * -6).toFixed(2)}%)`; }
  bar.style.transform = `scaleX(${clamp(scrollY / Math.max(1, document.documentElement.scrollHeight - vh)).toFixed(4)})`;
}

let lastSy = scrollY, vel = 0, last = performance.now(), time = 0;
const scene = { blob: [0.28, 0.9, 1, 0.12], energy: 1 };
function tick(now) {
  const dt = Math.min(0.1, Math.max(0.001, (now - last) / 1000)); last = now; time += dt;
  const sy = scrollY, d = sy - lastSy; lastSy = sy; vel = lerp(vel, clamp(Math.abs(d) / (vh * 0.07)), 0.18);
  const z = zones.find(z => sy + vh * 0.55 >= z.top && sy + vh * 0.55 < z.bottom);
  if (z) { theme.to(z.name); const k = 1 - Math.exp(-dt * 2.2); for (let i = 0; i < 4; i++) scene.blob[i] = lerp(scene.blob[i], z.blob[i], k); scene.energy = lerp(scene.energy, z.energy, k); }
  theme.ease(reduced ? 1 : 1 - Math.exp(-dt * 5.5));
  scenes(); heroTick(now, dt);
  if (field) field.frame({ time, dt, scroll: sy / vh, flow: d / (canvas.clientHeight || vh), vel, grain: 0.05, theme: theme.gl, blob: scene.blob, energy: scene.energy, quads: [], duoLo: C.raven, duoHi: C.sky, accent: C.poppy });
  requestAnimationFrame(tick);
}
addEventListener('pointermove', e => { if (field && e.pointerType !== 'touch') field.point(e.clientX / vw, 1 - e.clientY / (canvas.clientHeight || vh)); }, { passive: true });
addEventListener('resize', () => { field?.resize?.(); measure(); });
addEventListener('load', measure); if ('ResizeObserver' in window) new ResizeObserver(measure).observe(document.body);
document.addEventListener('click', e => { const a = e.target.closest('a[href^="#"]'); if (!a) return; const el = document.getElementById(a.getAttribute('href').slice(1)); if (!el) return; e.preventDefault(); scrollTo({ top: el.id === 'top' ? 0 : top(el), behavior: reduced ? 'auto' : 'smooth' }); });
measure(); theme.snap('raven'); requestAnimationFrame(tick);
