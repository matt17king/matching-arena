// Every surface in the penthouse is drawn here, on a canvas, at load: veined marble, herringbone oak, wool, the art on
// the wall, the laptop screen. Nothing is downloaded, so the room is a few kilobytes of code rather than megabytes of images.
import * as THREE from 'three';

const rng = seed => { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; };

// tiling value noise on a lattice of `n` cells
function lattice(n, seed) {
  const r = rng(seed), g = new Float32Array(n * n); for (let i = 0; i < g.length; i++) g[i] = r();
  const f = t => t * t * (3 - 2 * t);
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), tx = f(x - xi), ty = f(y - yi);
    const a = ((xi % n) + n) % n, b = (a + 1) % n, c = ((yi % n) + n) % n, d = (c + 1) % n;
    const top = g[c * n + a] + (g[c * n + b] - g[c * n + a]) * tx, bot = g[d * n + a] + (g[d * n + b] - g[d * n + a]) * tx;
    return top + (bot - top) * ty;
  };
}
// fractal noise that tiles over the unit square
function fbm(seed, base = 4, oct = 5) {
  const ls = []; for (let o = 0; o < oct; o++) ls.push(lattice(base << o, seed + o * 101));
  return (u, v) => { let s = 0, a = 0.5, n = 0; for (let o = 0; o < oct; o++) { s += ls[o](u * (base << o), v * (base << o)) * a; n += a; a *= 0.5; } return s / n; };
}

function make(size, draw) { const c = document.createElement('canvas'); c.width = c.height = size; draw(c.getContext('2d'), size); return c; }
function tex(canvas, { repeat = true, aniso = 8 } = {}) {
  const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

/* marble: soft cloud, then two families of thin veins found where warped noise crosses its midline */
function marble(size, seed, base, cloudTo, vein) {
  const cloud = fbm(seed, 3, 5), warp = fbm(seed + 7, 2, 4), v1 = fbm(seed + 13, 2, 5), v2 = fbm(seed + 29, 5, 4), speck = fbm(seed + 41, 48, 2);
  return make(size, (g, n) => {
    const img = g.createImageData(n, n), d = img.data;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const u = x / n, v = y / n, w = warp(u, v) * 0.5;
      const c = Math.pow(cloud(u + w * 0.3, v), 1.6);
      const a = Math.abs(v1(u + w, v + w * 0.6) - 0.5) * 2, b = Math.abs(v2(u - w * 0.5, v + w) - 0.5) * 2;
      const big = Math.pow(1 - Math.min(1, a * 7), 3), fine = Math.pow(1 - Math.min(1, b * 13), 4) * 0.6;
      const k = Math.min(1, big * (0.5 + c) + fine * c * 1.4), s = (speck(u, v) - 0.5) * 0.03;
      const i = (y * n + x) * 4;
      for (let ch = 0; ch < 3; ch++) { const col = base[ch] + (cloudTo[ch] - base[ch]) * c * 0.55; d[i + ch] = Math.max(0, Math.min(255, (col + (vein[ch] - col) * k + s) * 255)); }
      d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  });
}

/* herringbone oak. Planks are W by 4W; the pattern repeats every 8W, so a canvas of 32W tiles cleanly. */
function herringbone(size, seed) {
  return make(size, (g, n) => {
    const r = rng(seed), W = n / 32, L = W * 4, tone = new Map();
    const col = key => { if (!tone.has(key)) tone.set(key, [r(), r(), r()]); return tone.get(key); };
    const plank = (x, y, w, h, horiz) => {
      const kx = ((Math.round(x) % n) + n) % n, ky = ((Math.round(y) % n) + n) % n, [a, b, c] = col(kx + ':' + ky + (horiz ? 'h' : 'v'));
      const l = 60 + a * 11, s = 27 + b * 11, hue = 27 + c * 6;
      for (let ox = -n; ox <= n; ox += n) for (let oy = -n; oy <= n; oy += n) {
        const X = kx + ox, Y = ky + oy; if (X > n || Y > n || X + w < 0 || Y + h < 0) continue;
        g.fillStyle = `hsl(${hue} ${s}% ${l}%)`; g.fillRect(X, Y, w, h);
        // grain: a few long, faint streaks along the plank
        const rr = rng((kx * 7919 + ky * 104729 + (horiz ? 1 : 2)) | 0);
        for (let i = 0; i < 9; i++) {
          g.fillStyle = `hsl(${hue - 4} ${s}% ${l - 6 - rr() * 9}% / ${0.1 + rr() * 0.14})`;
          if (horiz) g.fillRect(X, Y + rr() * h, w, 1 + rr() * 1.5); else g.fillRect(X + rr() * w, Y, 1 + rr() * 1.5, h);
        }
        g.strokeStyle = 'hsl(28 34% 30% / .6)'; g.lineWidth = 1; g.strokeRect(X + 0.5, Y + 0.5, w - 1, h - 1);
      }
    };
    g.fillStyle = '#b8946a'; g.fillRect(0, 0, n, n);
    for (let i = -40; i < 40; i++) for (let m = -12; m < 12; m++) {
      const x = i * W + m * L, y = i * W - m * L;
      if (x > -L * 2 && x < n + L && y > -L * 2 && y < n + L) { plank(x, y, L, W, true); plank(x + L, y + W - L, W, L, false); }
    }
  });
}

/* cloth and rugs: flat colour with a fine weave so large fabric surfaces never look like plastic */
function weave(size, seed, rgb, amount = 0.05) {
  const a = fbm(seed, 64, 2), b = fbm(seed + 3, 6, 3);
  return make(size, (g, n) => {
    const img = g.createImageData(n, n), d = img.data;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const k = 1 + (a(x / n, y / n) - 0.5) * amount * 2 + (b(x / n, y / n) - 0.5) * amount + ((x + y) % 2 ? amount * 0.3 : -amount * 0.3), i = (y * n + x) * 4;
      d[i] = Math.min(255, rgb[0] * k); d[i + 1] = Math.min(255, rgb[1] * k); d[i + 2] = Math.min(255, rgb[2] * k); d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  });
}

/* the brand as a painting: red light falling off into blue, with grain. Hangs over the desk. */
function art(size, seed) {
  const nz = fbm(seed, 3, 4), gr = fbm(seed + 5, 96, 1);
  return make(size, (g, n) => {
    const img = g.createImageData(n, n), d = img.data, raven = [9, 3, 3], red = [226, 11, 33], blue = [120, 190, 236];
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const u = x / n, v = y / n, w = nz(u, v) - 0.5;
      const a = Math.max(0, 1 - Math.hypot(u - 0.3 + w * 0.5, (v - 0.36) * 1.5 + w * 0.4) * 1.9), b = Math.max(0, 1 - Math.hypot(u - 0.78 - w * 0.4, (v - 0.74) * 1.3) * 2.1);
      const k = (gr(u, v) - 0.5) * 34, i = (y * n + x) * 4;
      for (let ch = 0; ch < 3; ch++) d[i + ch] = Math.max(0, Math.min(255, raven[ch] + (red[ch] - raven[ch]) * a * a * 1.25 + (blue[ch] - raven[ch]) * b * b * 1.1 + k));
      d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  });
}

/* the laptop: this site, open */
function screen() {
  const c = document.createElement('canvas'); c.width = 640; c.height = 400; const g = c.getContext('2d');
  g.fillStyle = '#090303'; g.fillRect(0, 0, 640, 400);
  let gr = g.createRadialGradient(470, 250, 0, 470, 250, 330); gr.addColorStop(0, 'rgba(226,11,33,.95)'); gr.addColorStop(1, 'rgba(226,11,33,0)'); g.fillStyle = gr; g.fillRect(0, 0, 640, 400);
  gr = g.createRadialGradient(90, 360, 0, 90, 360, 300); gr.addColorStop(0, 'rgba(87,179,238,.6)'); gr.addColorStop(1, 'rgba(87,179,238,0)'); g.fillStyle = gr; g.fillRect(0, 0, 640, 400);
  g.fillStyle = '#f3f8fc'; g.font = "600 22px 'Inter Tight Variable', 'Inter Tight', sans-serif"; g.fillText('Matt King', 28, 44);
  g.fillRect(28, 62, 584, 1);
  g.font = "600 128px 'Inter Tight Variable', 'Inter Tight', sans-serif"; g.fillText('Matt', 22, 250);
  g.font = "italic 600 128px 'Inter Tight Variable', 'Inter Tight', sans-serif"; g.fillText('King', 22, 362);
  return c;
}

/* a tower at night: a grid of windows, some lit warm, a few in the site's red and blue */
function windows(seed) {
  return make(128, (g, n) => {
    const r = rng(seed); g.fillStyle = '#0a0d13'; g.fillRect(0, 0, n, n);
    for (let y = 0; y < n; y += 8) for (let x = 0; x < n; x += 8) {
      const k = r(); if (k < 0.6) continue;
      g.fillStyle = k > 0.985 ? '#e20b21' : k > 0.96 ? '#7cc4f2' : `hsl(${34 + r() * 14} ${50 + r() * 30}% ${34 + r() * 40}%)`; g.fillRect(x + 2, y + 2, 3, 4);
    }
  });
}

/* the face of the building this floor sits on: dark glass and floor plates, nothing lit */
function facade(seed) {
  return make(128, (g, n) => {
    g.fillStyle = '#07090d'; g.fillRect(0, 0, n, n);
    for (let y = 0; y < n; y += 16) { g.fillStyle = '#10141b'; g.fillRect(0, y, n, 2); for (let x = 0; x < n; x += 16) { g.fillStyle = '#0c1016'; g.fillRect(x, y, 1, 16); } }
  });
}

export function buildTextures() {
  const white = [0.965, 0.962, 0.955], grey = [0.78, 0.79, 0.81], ink = [0.24, 0.25, 0.28];
  return {
    marble: tex(marble(768, 11, white, grey, ink)),
    nero: tex(marble(512, 23, [0.035, 0.035, 0.04], [0.06, 0.06, 0.07], [0.3, 0.3, 0.33])),
    oak: tex(herringbone(1024, 5)),
    rug: tex(weave(256, 3, [226, 222, 214], 0.07)),
    wool: tex(weave(256, 9, [255, 255, 255], 0.06)),
    art: tex(art(512, 77), { repeat: false }),
    screen: tex(screen(), { repeat: false }),
    windows: tex(windows(8)),
    windowsB: tex(windows(19)),
    facade: tex(facade(4)),
  };
}
