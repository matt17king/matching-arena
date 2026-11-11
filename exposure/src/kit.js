// Shared by every page: fonts and styles, small helpers, the three colour themes, and the effects that
// define the look (words split for staggered reveals, the panned-blur headline, film grain over the DOM).
import '@fontsource-variable/inter-tight';
import '@fontsource-variable/inter-tight/wght-italic.css';
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import './styles/site.css';

export const root = document.documentElement;
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
// glow is powder blue's own hue with the white taken out: what that light looks like as it falls off into black
export const C = { raven: hex('#090303'), sky: hex('#b6dff8'), poppy: hex('#e20b21'), ice: hex('#f3f8fc'), ember: hex('#7a0611'), glow: hex('#57b3ee') };
const a = (c, al = 1) => [...c, al];
export const THEMES = {
  // raven: the room with the lights off. Red and blue light bleed across it; type is ice white.
  raven: {
    css: { bg: a(C.raven), ink: a(C.ice), body: a(C.ice, 0.86), mute: a(C.sky, 0.7), line: a(C.sky, 0.18), 'line-strong': a(C.sky, 0.44), 'hi-ink': a(C.ice), 'hi-mark': a(C.poppy), 'btn-bg': a(C.poppy), 'btn-ink': a(C.ice) },
    gl: { bg: C.raven, a: C.poppy, b: C.glow, halo: C.poppy, core: C.ice, mix: [0.96, 0.62, 0.8, 0.92] },
  },
  // sky: powder blue daylight, black type, red for the words that matter
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
