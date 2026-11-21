// Shared by every page: fonts and styles, small helpers, the three colour themes, and the effects that
// define the look (words split for staggered reveals, the panned-blur headline, film grain over the DOM).
import '@fontsource-variable/inter-tight';
import '@fontsource-variable/inter-tight/wght-italic.css';
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import './styles/site.css';

export const root = document.documentElement;

// The virtual world's one address is world.bymattking.com, so every link points there. On a preview or a local build
// that address would leave the copy being tested, so clicks go to the /world/ page beside it instead.
export const WORLD = 'https://world.bymattking.com/';
if (!/(^|\.)bymattking\.com$/.test(location.hostname)) document.addEventListener('click', e => {
  const a = e.target.closest?.(`a[href^="${WORLD}"]`);
  if (a && !e.defaultPrevented && !e.metaKey && !e.ctrlKey) { e.preventDefault(); location.href = '/world/' + a.getAttribute('href').slice(WORLD.length); }
}, true);
export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = t => t * t * (3 - 2 * t);
export const sstep = (a, b, x) => smooth(clamp((x - a) / (b - a)));
export const outExpo = t => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
export const pad2 = n => String(n).padStart(2, '0');
export const params = new URLSearchParams(location.search);

export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches || params.has('still');
export const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const safari = /^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent);
// The directional (panned) blur on headlines is an SVG filter. Where that is slow or unproven, fall back to a soft CSS blur.
export const canSmear = fine && !reduced && !safari;
if (!canSmear) root.classList.add('no-smear');

/* ---------- words: wrap each word so headlines can arrive a word at a time */
export function split(el) {
  let i = 0;
  const walk = node => [...node.childNodes].forEach(c => {
    if (c.nodeType === 3) {
      const frag = document.createDocumentFragment();
      c.textContent.split(/([ \n\t]+)/).forEach(t => {
        if (!t) return;
        if (/^[ \n\t]+$/.test(t)) { frag.append(' '); return; }
        const s = document.createElement('span'); s.className = 'w'; s.style.setProperty('--i', i++); s.textContent = t; frag.append(s);
      });
      c.replaceWith(frag);
    } else if (c.nodeType === 1) walk(c);
  });
  walk(el);
}

/* ---------- colour: three themes, eased between as sections pass the middle of the screen */
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
// A look is the palette: the dark that leads, the light ground, the accent, the near-white for type, the deep end of the
// accent, and the colour of the second light. `original` is black, powder blue and poppy red. The walnut looks take their
// neutrals from the virtual world's rooms (espresso, travertine, warm white, firelight) and differ only in the accent.
export const LOOKS = {
  original: { name: 'Original', raven: '#090303', sky: '#b6dff8', poppy: '#e20b21', ice: '#f3f8fc', ember: '#7a0611', glow: '#57b3ee' },
  'walnut-red': { name: 'Walnut + red', raven: '#0f0a07', sky: '#e6dccd', poppy: '#e20b21', ice: '#f7f1e8', ember: '#6d0810', glow: '#d39a5a' },
  'walnut-oxblood': { name: 'Walnut + oxblood', raven: '#0f0a07', sky: '#e6dccd', poppy: '#8e1b22', ice: '#f7f1e8', ember: '#3d0a0e', glow: '#d39a5a' },
  // the two together: bronze for light, lines and labels; red kept for the few things that must be seen
  walnut: { name: 'Walnut, bronze + red', raven: '#0f0a07', sky: '#e6dccd', poppy: '#e20b21', ice: '#f7f1e8', ember: '#6d0810', glow: '#c98d4e', bronze: '#c79a62' },
  'walnut-bronze': { name: 'Walnut + bronze', raven: '#0f0a07', sky: '#e6dccd', poppy: '#a5672f', ice: '#f7f1e8', ember: '#4a2a12', glow: '#e0b074' },
};
const DEFAULT_LOOK = 'original';
// The live site always wears the default look. On a preview (or with ?look= anywhere) another can be tried on.
const live = /(^|\.)bymattking\.com$/.test(location.hostname);
let saved = null; try { saved = localStorage.getItem('mk-look'); } catch { /* no storage: the default look */ }
// (a page can also ask for a look outright, with data-look on its <html>)
export const look = [params.get('look'), root.getAttribute('data-look'), live ? null : saved, DEFAULT_LOOK].find(k => k && LOOKS[k]);
const L = LOOKS[look];
export const C = Object.fromEntries(['raven', 'sky', 'poppy', 'ice', 'ember', 'glow'].map(k => [k, hex(L[k])]));
for (const k of ['raven', 'sky', 'poppy', 'ice', 'glow']) root.style.setProperty(`--${k}-c`, C[k].map(v => Math.round(v * 255)).join(' '));
root.style.setProperty('--bronze-c', hex(L.bronze || L.sky).map(v => Math.round(v * 255)).join(' '));
document.querySelector('meta[name="theme-color"]')?.setAttribute('content', L.raven);
root.dataset.look = look;
if (!live || params.has('look')) addEventListener('DOMContentLoaded', () => {
  const el = document.createElement('aside'); el.className = 'looks'; el.setAttribute('aria-label', 'Try a look');
  el.innerHTML = `<button type="button" data-fold>Looks · hide</button><p>Preview only</p>` + Object.entries(LOOKS).map(([k, v]) => `<button type="button" data-look="${k}" aria-pressed="${k === look}"><i>${['raven', 'sky', 'poppy', 'glow'].map(c => `<b style="background:${v[c]}"></b>`).join('')}</i>${v.name}</button>`).join('');
  el.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.fold !== undefined) { b.textContent = el.classList.toggle('shut') ? 'Looks' : 'Looks · hide'; return; }
    try { localStorage.setItem('mk-look', b.dataset.look); } catch { /* fall through to the address */ }
    const u = new URL(location.href); u.searchParams.delete('look'); if (live) u.searchParams.set('look', b.dataset.look); location.href = u.href; if (!live) location.reload();
  });
  document.body.append(el);
});
const a = (c, al = 1) => [...c, al];
export const THEMES = {
  // raven: the room with the lights off. The accent and the second light bleed across it; type is near-white.
  raven: {
    css: { bg: a(C.raven), ink: a(C.ice), body: a(C.ice, 0.86), mute: a(C.sky, 0.7), line: a(C.sky, 0.18), 'line-strong': a(C.sky, 0.44), 'hi-ink': a(C.ice), 'hi-mark': a(C.poppy), 'btn-bg': a(C.poppy), 'btn-ink': a(C.ice) },
    gl: { bg: C.raven, a: C.poppy, b: C.glow, halo: C.poppy, core: C.ice, mix: [0.96, 0.62, 0.8, 0.92] },
  },
  // sky: the daylight sections. A light ground, dark type, the accent for the words that matter
  sky: {
    css: { bg: a(C.sky), ink: a(C.raven), body: a(C.raven, 0.88), mute: a(C.raven, 0.62), line: a(C.raven, 0.16), 'line-strong': a(C.raven, 0.46), 'hi-ink': a(C.poppy), 'hi-mark': a(C.poppy, 0), 'btn-bg': a(C.raven), 'btn-ink': a(C.sky) },
    gl: { bg: C.sky, a: C.ice, b: C.poppy, halo: C.poppy, core: C.raven, mix: [0.9, 0.8, 0.6, 0.6] },
  },
  // poppy: the accent at full strength, used once, at the end
  poppy: {
    css: { bg: a(C.poppy), ink: a(C.ice), body: a(C.ice, 0.94), mute: a(C.ice, 0.8), line: a(C.ice, 0.3), 'line-strong': a(C.ice, 0.62), 'hi-ink': a(C.ice), 'hi-mark': a(C.raven), 'btn-bg': a(C.raven), 'btn-ink': a(C.ice) },
    gl: { bg: C.poppy, a: C.raven, b: C.ember, halo: C.raven, core: C.ice, mix: [0.6, 0.7, 0.5, 0.9] },
  },
};
// In a look that has bronze, bronze is the room's main light and the accent the smaller one; on the light ground the
// second light is bronze too, so the daylight sections stay warm rather than turning pink.
if (L.bronze) { Object.assign(THEMES.raven.gl, { a: C.glow, b: C.poppy, halo: C.glow, mix: [0.9, 0.5, 0.8, 0.9] }); Object.assign(THEMES.sky.gl, { b: C.glow, halo: C.glow }); THEMES.raven.css.mute = [...hex(L.bronze), 0.9]; THEMES.raven.css.line = [...hex(L.bronze), 0.22]; THEMES.raven.css['line-strong'] = [...hex(L.bronze), 0.5]; }
const clone = t => ({ css: Object.fromEntries(Object.entries(t.css).map(([k, v]) => [k, [...v]])), gl: Object.fromEntries(Object.entries(t.gl).map(([k, v]) => [k, [...v]])) });
// The live theme: `to(name)` picks a target, `ease(k)` moves the page's colours (CSS variables and the field) toward it.
export function createTheme(start = 'raven') {
  let name = start, cur = clone(THEMES[start]), moving = true;
  const write = () => { for (const [k, v] of Object.entries(cur.css)) root.style.setProperty(`--${k}`, `rgba(${Math.round(v[0] * 255)},${Math.round(v[1] * 255)},${Math.round(v[2] * 255)},${v[3].toFixed(3)})`); };
  return {
    get gl() { return cur.gl; },
    to(n) { if (n && n !== name && THEMES[n]) { name = n; moving = true; } },
    snap(n) { if (n && THEMES[n]) name = n; cur = clone(THEMES[name]); write(); moving = false; },
    ease(k) {
      if (!moving) return; const to = THEMES[name]; let d = 0;
      for (const g of ['css', 'gl']) for (const key in to[g]) { const c = cur[g][key], t = to[g][key]; for (let i = 0; i < c.length; i++) { const n = lerp(c[i], t[i], k); d = Math.max(d, Math.abs(t[i] - n)); c[i] = d < 0.002 ? t[i] : n; } }
      write(); moving = d >= 0.002;
    },
  };
}

/* ---------- film grain over the DOM as well, so type and photos sit in the same print as the field */
export function grainURL() {
  const c = document.createElement('canvas'); c.width = c.height = 240; const g = c.getContext('2d'), im = g.createImageData(240, 240);
  for (let i = 0; i < im.data.length; i += 4) { const v = 128 + (Math.random() - 0.5) * 150; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
  g.putImageData(im, 0, 0); return `url(${c.toDataURL()})`;
}

/* ---------- the panned-blur arrival: a horizontal-only blur that eases to nothing */
let fid = 0;
export function smear(el) {
  if (!canSmear) return; const defs = $('[data-defs]'); if (!defs) return;
  const from = +(el.dataset.smear || 34), dur = +(el.dataset.dur || 1300), delay = (parseFloat(getComputedStyle(el).getPropertyValue('--d')) || 0) * 1000;
  const NS = 'http://www.w3.org/2000/svg', f = document.createElementNS(NS, 'filter'), b = document.createElementNS(NS, 'feGaussianBlur');
  f.id = `sm${fid++}`; f.setAttribute('x', '-25%'); f.setAttribute('width', '150%'); f.setAttribute('y', '-10%'); f.setAttribute('height', '120%'); f.setAttribute('color-interpolation-filters', 'sRGB');
  b.setAttribute('stdDeviation', `${from} 0`); f.append(b); defs.append(f); el.style.filter = `url(#${f.id})`;
  const t0 = performance.now() + delay;
  const step = now => { const t = clamp((now - t0) / dur), sd = from * (1 - outExpo(t)); if (t >= 1 || sd < 0.25) { el.style.filter = ''; f.remove(); return; } b.setAttribute('stdDeviation', `${sd.toFixed(2)} 0`); requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
