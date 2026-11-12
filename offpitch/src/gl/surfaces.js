// Surfaces: every texture here is drawn in code at start-up. Grass, maple, clay, asphalt, concrete, carpet,
// the cut faces of each slab, and the paint that draws itself onto them.
import * as THREE from 'three';

export const rng = seed => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
export const RED = '#e2231a';
export const CHALK = '#f1eee6';

function cv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function toTex(c, { srgb = true, repeat = null, aniso = 8 } = {}) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = aniso;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}
function speckle(x, w, h, n, palette, s0, s1, alpha, r) {
  for (let i = 0; i < n; i++) {
    x.globalAlpha = alpha * (0.4 + 0.6 * r()); x.fillStyle = palette[(r() * palette.length) | 0];
    const s = s0 + r() * (s1 - s0); x.fillRect(r() * w, r() * h, s, s * (0.6 + r() * 0.8));
  }
  x.globalAlpha = 1;
}
function blotch(x, w, h, n, colors, rad, alpha, r) {
  for (let i = 0; i < n; i++) {
    const px = r() * w, py = r() * h, rr = rad * (0.4 + r());
    const g = x.createRadialGradient(px, py, 0, px, py, rr); const c = colors[(r() * colors.length) | 0];
    g.addColorStop(0, c); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.globalAlpha = alpha * (0.5 + r() * 0.5); x.fillStyle = g; x.fillRect(px - rr, py - rr, rr * 2, rr * 2);
  }
  x.globalAlpha = 1;
}
// height (red channel) → tangent-space normal map
function normalFrom(src, strength) {
  const w = src.width, h = src.height, d = src.getContext('2d').getImageData(0, 0, w, h).data;
  const [c, x] = cv(w, h), out = x.createImageData(w, h), o = out.data;
  const H = (i, j) => d[(((j + h) % h) * w + ((i + w) % w)) * 4] / 255;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const dx = (H(i + 1, j) - H(i - 1, j)) * strength, dy = (H(i, j + 1) - H(i, j - 1)) * strength;
    const l = 1 / Math.hypot(dx, dy, 1), k = (j * w + i) * 4;
    o[k] = (-dx * l * 0.5 + 0.5) * 255; o[k + 1] = (dy * l * 0.5 + 0.5) * 255; o[k + 2] = (l * 0.5 + 0.5) * 255; o[k + 3] = 255;
  }
  x.putImageData(out, 0, 0); return c;
}
function grainHeight(size, n, r, s0 = 1, s1 = 3) {
  const [c, x] = cv(size, size); x.fillStyle = '#808080'; x.fillRect(0, 0, size, size);
  speckle(x, size, size, n, ['#000', '#fff', '#404040', '#c0c0c0'], s0, s1, 0.5, r); return c;
}

// ---- colour maps
export function grassGroundTex(wM, dM, stripeM, seed = 3, tone = 0) {
  const r = rng(seed), W = 1024, H = Math.max(256, Math.round((1024 * dM) / wM / 64) * 64);
  const [c, x] = cv(W, H);
  const a = tone ? ['#2f6a3a', '#28603a'] : ['#346b2a', '#2b5e25'];
  const n = Math.ceil(wM / stripeM);
  for (let i = 0; i < n; i++) { x.fillStyle = a[i % 2]; x.fillRect((i * stripeM / wM) * W, 0, (stripeM / wM) * W + 1, H); }
  blotch(x, W, H, 60, ['rgba(60,110,40,1)', 'rgba(24,60,24,1)', 'rgba(80,120,50,1)'], 120, 0.16, r);
  speckle(x, W, H, 90000, ['#3f7a2f', '#255222', '#4c8a38', '#1f4a1f', '#5a8f3c', '#30662a'], 1, 3, 0.5, r);
  return toTex(c);
}
export function mapleTex(wM, dM, seed = 7) {
  const r = rng(seed), W = 2048, H = 2048, [c, x] = cv(W, H), [hc, hx] = cv(1024, 1024);
  hx.fillStyle = '#fff'; hx.fillRect(0, 0, 1024, 1024);
  const pw = (0.062 / dM) * H; // plank width in px
  for (let y = 0, row = 0; y < H; y += pw, row++) {
    let px = -r() * 400;
    while (px < W) {
      const len = ((1.1 + r() * 1.5) / wM) * W, hue = 31 + r() * 7, sat = 44 + r() * 14, lig = 63 + r() * 9;
      x.fillStyle = `hsl(${hue},${sat}%,${lig}%)`; x.fillRect(px, y, len, pw + 0.5);
      for (let k = 0; k < 7; k++) { // grain streaks
        x.globalAlpha = 0.05 + r() * 0.1; x.fillStyle = r() > 0.5 ? '#7a4a1c' : '#fff2d8';
        const gy = y + r() * pw; x.fillRect(px + r() * len * 0.3, gy, len * (0.3 + r() * 0.7), 0.6 + r() * 1.2);
      }
      x.globalAlpha = 0.5; x.fillStyle = '#5b3a1a'; x.fillRect(px + len - 1, y, 1.2, pw);
      hx.fillStyle = '#000'; hx.fillRect(((px + len - 1) / W) * 1024, (y / H) * 1024, 1.2, (pw / H) * 1024);
      x.globalAlpha = 1; px += len;
    }
    x.globalAlpha = 0.32; x.fillStyle = '#4e3216'; x.fillRect(0, y, W, 1); x.globalAlpha = 1;
    hx.fillStyle = '#000'; hx.fillRect(0, (y / H) * 1024, 1024, 1);
  }
  speckle(x, W, H, 30000, ['#fff', '#6b4520'], 1, 2, 0.05, r);
  return { map: toTex(c), normalMap: toTex(normalFrom(hc, 1.2), { srgb: false }) };
}
export function clayGrassCourtTex(seed = 11) {
  // one court, two surfaces: grass on the left of the net, clay on the right
  const r = rng(seed), W = 2048, H = 1024, [c, x] = cv(W, H);
  x.fillStyle = '#3d7a33'; x.fillRect(0, 0, W / 2, H);
  for (let i = 0; i < 14; i++) { x.fillStyle = i % 2 ? '#3a7430' : '#427f37'; x.fillRect(0, (i / 14) * H, W / 2, H / 14 + 1); }
  blotch(x, W / 2, H, 30, ['rgba(120,130,60,1)', 'rgba(40,90,40,1)'], 140, 0.14, r);
  speckle(x, W / 2, H, 60000, ['#4a8a3a', '#2f6a2c', '#5a9442', '#356f2f'], 1, 3, 0.45, r);
  x.fillStyle = '#b9532c'; x.fillRect(W / 2, 0, W / 2, H);
  x.save(); x.beginPath(); x.rect(W / 2, 0, W / 2, H); x.clip();
  blotch(x, W * 1.5, H, 60, ['rgba(210,120,80,1)', 'rgba(140,60,30,1)', 'rgba(190,95,55,1)'], 160, 0.2, r);
  for (let i = 0; i < 26; i++) { x.globalAlpha = 0.05; x.fillStyle = i % 2 ? '#e09a72' : '#8c3d20'; x.fillRect(W / 2, r() * H, W / 2, 6 + r() * 30); }
  x.globalAlpha = 1; x.restore();
  for (let i = 0; i < 80000; i++) { x.globalAlpha = 0.3 + r() * 0.3; x.fillStyle = ['#c4623a', '#a9492a', '#d07a52', '#8f3f22', '#cf6d44'][(r() * 5) | 0]; const s = 1 + r() * 2; x.fillRect(W / 2 + r() * W / 2, r() * H, s, s); }
  x.globalAlpha = 1;
  return toTex(c);
}
export function asphaltTex(seed = 5) {
  const r = rng(seed), S = 1024, [c, x] = cv(S, S);
  x.fillStyle = '#2b2c2f'; x.fillRect(0, 0, S, S);
  blotch(x, S, S, 30, ['rgba(60,60,64,1)', 'rgba(20,20,22,1)'], 200, 0.2, r);
  speckle(x, S, S, 70000, ['#3a3b3f', '#1c1d1f', '#4c4d52', '#232427', '#5d5e63'], 1, 3, 0.6, r);
  speckle(x, S, S, 2500, ['#8a8b8f', '#77726a'], 1, 2.4, 0.7, r);
  return { map: toTex(c), normalMap: toTex(normalFrom(grainHeight(512, 26000, r), 1.6), { srgb: false }) };
}
export function concreteTex(seed = 9) {
  const r = rng(seed), S = 1024, [c, x] = cv(S, S), [hc, hx] = cv(512, 512);
  x.fillStyle = '#b4b1aa'; x.fillRect(0, 0, S, S);
  blotch(x, S, S, 50, ['rgba(150,148,142,1)', 'rgba(200,198,190,1)', 'rgba(130,128,124,1)'], 220, 0.22, r);
  speckle(x, S, S, 40000, ['#a09d96', '#c6c3bb', '#8e8b85'], 1, 2.4, 0.3, r);
  hx.fillStyle = '#fff'; hx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2; i++) { x.globalAlpha = 0.25; x.fillStyle = '#6f6c66'; x.fillRect(0, i * S / 2, S, 2); x.fillRect(i * S / 2, 0, 2, S); hx.fillStyle = '#555'; hx.fillRect(0, i * 256, 512, 2); hx.fillRect(i * 256, 0, 2, 512); }
  x.globalAlpha = 1;
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { // formwork tie holes
    const px = (i + 0.5) * S / 2, py = (j + 0.5) * S / 2;
    x.fillStyle = '#5c5a55'; x.beginPath(); x.arc(px, py, 9, 0, 7); x.fill(); x.fillStyle = '#8b8882'; x.beginPath(); x.arc(px - 1, py - 1, 6, 0, 7); x.fill();
    hx.fillStyle = '#000'; hx.beginPath(); hx.arc(px / 2, py / 2, 5, 0, 7); hx.fill();
  }
  return { map: toTex(c), normalMap: toTex(normalFrom(hc, 2), { srgb: false }) };
}
export function carpetTex(seed = 13) {
  const r = rng(seed), S = 512, [c, x] = cv(S, S);
  x.fillStyle = '#b3131a'; x.fillRect(0, 0, S, S);
  speckle(x, S, S, 50000, ['#c41a21', '#980e15', '#cf2a30', '#a51118'], 1, 2.2, 0.5, r);
  return { map: toTex(c), normalMap: toTex(normalFrom(grainHeight(512, 40000, r, 1, 2), 1.2), { srgb: false }) };
}
export function padelTex(seed = 17) {
  const r = rng(seed), S = 512, [c, x] = cv(S, S);
  x.fillStyle = '#1f5fa8'; x.fillRect(0, 0, S, S);
  speckle(x, S, S, 40000, ['#2a6dba', '#184f90', '#3277c4', '#1b5798'], 1, 2.4, 0.5, r);
  speckle(x, S, S, 3000, ['#d9c9a0'], 1, 1.6, 0.35, r); // sand in the turf
  return toTex(c, { repeat: [10, 5] });
}
// the cut face of a slab: bands from the top down, [depth share, colour, stone palette]
export function strataTex(bands, seed = 21, straight = false) {
  const r = rng(seed), W = 1024, H = 256, [c, x] = cv(W, H);
  const total = bands.reduce((s, b) => s + b[0], 0); let y0 = 0;
  const wob = Array.from({ length: bands.length }, () => { const ph = r() * 9, f = 1 + r() * 2; return i => (straight ? 0 : Math.sin(i * 0.012 * f + ph) * 3 + Math.sin(i * 0.05 + ph * 2) * 1.2); });
  bands.forEach((b, k) => {
    const y1 = y0 + (b[0] / total) * H;
    x.fillStyle = b[1];
    for (let i = 0; i < W; i += 2) { const a = k === 0 ? 0 : y0 + wob[k](i), e = k === bands.length - 1 ? H : y1 + wob[(k + 1) % bands.length](i); x.fillRect(i, a, 2, e - a + 1); }
    if (b[2]) { x.save(); x.beginPath(); x.rect(0, y0 + 2, W, y1 - y0 - 2); x.clip(); speckle(x, W, H, b[3] || 2600, b[2], b[4] || 1, b[5] || 4, 0.85, r); x.restore(); }
    y0 = y1;
  });
  const t = toTex(c); t.wrapS = THREE.RepeatWrapping; return t;
}

// ---- paint: R = white paint, B = colour fill, G = when it appears (0 first, 1 last)
export function paintMask(wM, dM, draw, size = 2048) {
  const W = size, H = Math.max(256, Math.round((size * dM) / wM / 64) * 64), [c, x] = cv(W, H);
  x.fillStyle = '#000'; x.fillRect(0, 0, W, H);
  const sx = W / wM, sz = H / dM; // slab-local metres (origin at slab centre) → pixels
  const P = (mx, mz) => [(mx + wM / 2) * sx, (mz + dM / 2) * sz];
  const col = (t, fill) => `rgb(${fill ? 0 : 255},${Math.round(THREE.MathUtils.clamp(t, 0, 1) * 255)},${fill ? 255 : 0})`;
  const api = {
    x, P, sx, sz,
    seg(a, b, w, t0, t1, fill = false) {
      const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.25)); x.lineWidth = w * (sx + sz) / 2; x.lineCap = 'butt';
      for (let i = 0; i < n; i++) {
        const p = P(a[0] + (b[0] - a[0]) * (i / n), a[1] + (b[1] - a[1]) * (i / n)), q = P(a[0] + (b[0] - a[0]) * ((i + 1.04) / n), a[1] + (b[1] - a[1]) * ((i + 1.04) / n));
        x.strokeStyle = col(t0 + (t1 - t0) * (i / n), fill); x.beginPath(); x.moveTo(p[0], p[1]); x.lineTo(q[0], q[1]); x.stroke();
      }
    },
    arc(cx, cz, rad, a0, a1, w, t0, t1) {
      const n = Math.max(6, Math.ceil((Math.abs(a1 - a0) * rad) / 0.2)); x.lineWidth = w * (sx + sz) / 2;
      for (let i = 0; i < n; i++) {
        const u0 = a0 + (a1 - a0) * (i / n), u1 = a0 + (a1 - a0) * ((i + 1.06) / n);
        const p = P(cx + Math.cos(u0) * rad, cz + Math.sin(u0) * rad), q = P(cx + Math.cos(u1) * rad, cz + Math.sin(u1) * rad);
        x.strokeStyle = col(t0 + (t1 - t0) * (i / n), false); x.beginPath(); x.moveTo(p[0], p[1]); x.lineTo(q[0], q[1]); x.stroke();
      }
    },
    rect(x0, z0, x1, z1, t, fill = true) { const p = P(x0, z0), q = P(x1, z1); x.fillStyle = col(t, fill); x.fillRect(p[0], p[1], q[0] - p[0], q[1] - p[1]); },
    text(str, mx, mz, hM, t, { font = '700', align = 'center', fill = false, rot = 0, spacing = 0 } = {}) {
      const p = P(mx, mz); x.save(); x.translate(p[0], p[1]); x.scale(1, sz / sx); x.rotate(rot);
      x.font = `${font} ${hM * sx}px "Instrument Sans Variable", "Arial Narrow", Arial, sans-serif`; x.textAlign = align; x.textBaseline = 'middle';
      try { x.letterSpacing = `${spacing * sx}px`; } catch (e) { /* older browsers */ }
      x.fillStyle = col(t, fill); x.fillText(str, 0, 0); x.restore();
    },
  };
  draw(api);
  const tex = toTex(c, { srgb: false }); tex.generateMipmaps = true;
  // lets grass read the same paint: [amount, kind, when]
  tex.userData.sampler = () => {
    const d = x.getImageData(0, 0, W, H).data;
    return (mx, mz) => { const i = Math.min(W - 1, Math.max(0, Math.round((mx + wM / 2) * sx))), j = Math.min(H - 1, Math.max(0, Math.round((mz + dM / 2) * sz))), k = (j * W + i) * 4;
      const wv = d[k] / 255, fv = d[k + 2] / 255; if (wv < 0.3 && fv < 0.3) return null; return [1, wv >= fv ? 0 : 1, d[k + 1] / 255]; };
  };
  return tex;
}
// lets a standard material take a paint mask and reveal it with uLine (0..1)
export function withPaint(material, mask, { white = '#eeebe3', fill = '#c21c14', line = 0 } = {}) {
  const u = { uMask: { value: mask }, uLine: { value: line }, uWhite: { value: new THREE.Color(white) }, uFill: { value: new THREE.Color(fill) } };
  material.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vPaintUv;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvPaintUv = uv;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D uMask; uniform float uLine; uniform vec3 uWhite; uniform vec3 uFill; varying vec2 vPaintUv;')
      .replace('#include <map_fragment>', `#include <map_fragment>
        vec4 pm = texture2D( uMask, vPaintUv ); float pOn = 1.0 - smoothstep( uLine - 0.012, uLine + 0.001, pm.g );
        diffuseColor.rgb = mix( diffuseColor.rgb, uFill * ( 0.82 + 0.18 * diffuseColor.g ), pm.b * pOn * 0.96 );
        diffuseColor.rgb = mix( diffuseColor.rgb, uWhite, pm.r * pOn * 0.95 );`);
  };
  material.customProgramCacheKey = () => 'mk-paint';
  material.userData.paint = u;
  return material;
}

// ---- slab: a block cut out of a venue. Top surface plus four cut faces.
export function makeSlab({ w, d, h, top, side, tile = 4 }) {
  const g = new THREE.Group();
  const t = new THREE.Mesh(new THREE.PlaneGeometry(w, d), top); t.rotation.x = -Math.PI / 2; t.position.y = h; t.receiveShadow = true; t.castShadow = false; g.add(t);
  const mk = (len, pos, ry) => {
    const geo = new THREE.PlaneGeometry(len, h); const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * len / tile);
    const m = new THREE.Mesh(geo, side); m.position.set(pos[0], h / 2, pos[1]); m.rotation.y = ry; m.receiveShadow = true; m.castShadow = true; g.add(m);
  };
  mk(w, [0, d / 2], 0); mk(w, [0, -d / 2], Math.PI); mk(d, [w / 2, 0], Math.PI / 2); mk(d, [-w / 2, 0], -Math.PI / 2);
  // an unseen lid so the block throws one clean shadow
  const lid = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false })); lid.rotation.x = -Math.PI / 2; lid.position.y = h - 0.001; lid.castShadow = true; g.add(lid);
  g.userData = { top: t, h };
  return g;
}
// box with UVs in metres, so tiled textures keep their scale
export function boxM(w, h, d, tile = 2) {
  const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv; const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) { const k = f * 4 + i; uv.setXY(k, uv.getX(k) * dims[f][0] / tile, uv.getY(k) * dims[f][1] / tile); }
  return g;
}

// ---- grass: instanced tufts that grow, take paint, and sit on a ground texture
function tuftGeometry(r) {
  const pos = [], nrm = [], uv = [], idx = [];
  for (let b = 0; b < 3; b++) {
    const a = (b / 3) * Math.PI * 2 + r() * 1.2, ca = Math.cos(a), sa = Math.sin(a), ox = (r() - 0.5) * 0.016, oz = (r() - 0.5) * 0.016;
    const wdt = 0.003 + r() * 0.0014, lean = 0.25 + r() * 0.5, hgt = 0.8 + r() * 0.4, base = pos.length / 3;
    const pts = [[-wdt, 0, 0], [wdt, 0, 0], [-wdt * 0.7, 0.55 * hgt, lean * 0.005], [wdt * 0.7, 0.55 * hgt, lean * 0.005], [0, hgt, lean * 0.017]];
    pts.forEach(p => { pos.push(ox + p[0] * ca - p[2] * sa, p[1], oz + p[0] * sa + p[2] * ca); nrm.push(-sa * 0.3, 1, ca * 0.3); uv.push(0.5, p[1] / hgt); });
    idx.push(base, base + 1, base + 2, base + 2, base + 1, base + 3, base + 2, base + 3, base + 4);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  return g;
}
let bladeMat = null;
export const grassUniforms = [];
// rect [x0,z0,x1,z1] in slab-local metres; density(x,z) tufts per m²; colour(x,z) → [r,g,b]; paint(x,z) → [white, red, when] or null
export function scatterGrass({ rect, y, density, colour, paint, height = 0.03, seed = 31, cell = 0.5, fullDensity = 2600 }) {
  const r = rng(seed), [x0, z0, x1, z1] = rect, list = [];
  for (let cx = x0; cx < x1; cx += cell) for (let cz = z0; cz < z1; cz += cell) {
    const n = density(cx + cell / 2, cz + cell / 2) * cell * cell, k = Math.floor(n) + (r() < n % 1 ? 1 : 0);
    for (let i = 0; i < k; i++) list.push(cx + r() * cell, cz + r() * cell);
  }
  const count = list.length / 2;
  const mat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.66, metalness: 0, side: THREE.DoubleSide });
  const u = { uGrow: { value: 1 }, uLine: { value: 1 }, uThread: { value: 1 } };
  mat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 aPaint; uniform float uGrow; varying vec4 vPaint; varying float vH;')
      .replace('#include <begin_vertex>', 'vec3 transformed = vec3( position ); float gg = clamp( uGrow * 1.7 - aPaint.w * 0.7, 0.0, 1.0 ); gg = gg * gg * ( 3.0 - 2.0 * gg ); transformed.y *= gg; transformed.xz *= mix( 0.4, 1.0, gg ); vPaint = aPaint; vH = uv.y;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uLine; uniform float uThread; varying vec4 vPaint; varying float vH;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        diffuseColor.rgb *= mix( 0.42, 1.12, vH );
        float pOn = vPaint.x * ( 1.0 - step( vPaint.y > 1.5 ? uThread : uLine, vPaint.z ) );
        vec3 pCol = vPaint.y < 0.5 ? vec3( 0.86, 0.855, 0.83 ) : vec3( 0.74, 0.03, 0.03 );
        diffuseColor.rgb = mix( diffuseColor.rgb, pCol * mix( 0.6, 1.0, vH ), pOn * 0.95 );`);
  };
  mat.customProgramCacheKey = () => 'mk-grass';
  const mesh = new THREE.InstancedMesh(tuftGeometry(r), mat, count);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3(), c = new THREE.Color();
  const aPaint = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    const px = list[i * 2], pz = list[i * 2 + 1], hh = height * (0.75 + r() * 0.55);
    const fat = THREE.MathUtils.clamp(Math.sqrt(fullDensity / Math.max(1, density(px, pz))), 1, 1.7) * 1.15;
    e.set((r() - 0.5) * 0.3, r() * 6.283, (r() - 0.5) * 0.3); q.setFromEuler(e); p.set(px, y, pz); s.set(fat, hh, fat);
    m.compose(p, q, s); mesh.setMatrixAt(i, m);
    const col = colour(px, pz), v = 0.82 + r() * 0.36, dry = r() < 0.05 ? 1 : 0;
    c.setRGB(col[0] * v + dry * 0.1, col[1] * v + dry * 0.05, col[2] * v * (1 - dry * 0.4)); mesh.setColorAt(i, c);
    const pt = paint ? paint(px, pz) : null;
    if (pt) { aPaint[i * 4] = pt[0]; aPaint[i * 4 + 1] = pt[1]; aPaint[i * 4 + 2] = pt[2]; }
    aPaint[i * 4 + 3] = r();
  }
  mesh.geometry.setAttribute('aPaint', new THREE.InstancedBufferAttribute(aPaint, 4));
  mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true;
  mesh.receiveShadow = true; mesh.castShadow = false; mesh.frustumCulled = false;
  mesh.userData.u = u;
  return mesh;
}

// ---- small things
export function netTex(cols = 64, rows = 8) {
  const [c, x] = cv(1024, 128); x.clearRect(0, 0, 1024, 128); x.strokeStyle = '#1b1b1b'; x.lineWidth = 1.6;
  for (let i = 0; i <= cols; i++) { x.beginPath(); x.moveTo((i / cols) * 1024, 0); x.lineTo((i / cols) * 1024, 128); x.stroke(); }
  for (let j = 0; j <= rows; j++) { x.beginPath(); x.moveTo(0, (j / rows) * 128); x.lineTo(1024, (j / rows) * 128); x.stroke(); }
  const t = toTex(c); t.wrapS = THREE.RepeatWrapping; return t;
}
export function diamondNetTex() {
  const [c, x] = cv(512, 256); x.clearRect(0, 0, 512, 256); x.strokeStyle = '#f4f2ec'; x.lineWidth = 5; x.lineCap = 'round';
  const n = 12, cw = 512 / n;
  for (let i = -n; i < n * 2; i++) { x.beginPath(); x.moveTo(i * cw, 0); x.lineTo((i + 3) * cw, 256); x.stroke(); x.beginPath(); x.moveTo(i * cw, 0); x.lineTo((i - 3) * cw, 256); x.stroke(); }
  const t = toTex(c); t.wrapS = THREE.RepeatWrapping; return t;
}
export function meshFenceTex() {
  const [c, x] = cv(256, 256); x.clearRect(0, 0, 256, 256); x.strokeStyle = '#2a2c2e'; x.lineWidth = 9;
  for (let i = 0; i <= 4; i++) { x.beginPath(); x.moveTo(i * 64, 0); x.lineTo(i * 64, 256); x.stroke(); x.beginPath(); x.moveTo(0, i * 64); x.lineTo(256, i * 64); x.stroke(); }
  const t = toTex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
export function labelTex(draw, w = 512, h = 256, srgb = true) { const [c, x] = cv(w, h); draw(x, w, h); return toTex(c, { srgb }); }
export function glowTex() {
  const [c, x] = cv(128, 128); const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.18, 'rgba(255,250,240,0.75)'); g.addColorStop(0.5, 'rgba(255,245,230,0.16)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128); return toTex(c);
}
