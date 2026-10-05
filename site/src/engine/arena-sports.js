// Arena v11 — sport markings, morph strands and circuit geometry. Pure data in world metres (x = length of play, z = across).
export const N = 40, P = 240;
export const ORDER = ['football', 'basketball', 'nfl', 'tennis', 'ring', 'race'];
const TAU = Math.PI * 2;
const arc = (cx, cz, r, a0, a1, n = 48) => { const p = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; p.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]); } return p; };
const rect = (x0, z0, x1, z1) => [[x0, z1], [x1, z1], [x1, z0], [x0, z0], [x0, z1]];
const scl = (S, s) => S.map(st => ({ ...st, pts: st.pts.map(([x, z]) => [x * s, z * s]) }));

function football() {
  const L = 52.5, Wd = 34, S = [];
  S.push({ pts: rect(-L, -Wd, L, Wd), t: [0, 0.42], closed: true });
  S.push({ pts: [[0, Wd], [0, -Wd]], t: [0.36, 0.52] });
  S.push({ pts: arc(0, 0, 9.15, Math.PI / 2, Math.PI * 2.5, 80), t: [0.46, 0.66], closed: true });
  S.push({ pts: arc(0, 0, 0.25, 0, TAU, 12), t: [0.64, 0.66], closed: true });
  for (const sx of [-1, 1]) {
    S.push({ pts: [[sx * L, -20.16], [sx * (L - 16.5), -20.16], [sx * (L - 16.5), 20.16], [sx * L, 20.16]], t: [0.56, 0.8] });
    S.push({ pts: [[sx * L, -9.16], [sx * (L - 5.5), -9.16], [sx * (L - 5.5), 9.16], [sx * L, 9.16]], t: [0.74, 0.88] });
    const a = 0.927;
    S.push({ pts: sx > 0 ? arc(sx * (L - 11), 0, 9.15, Math.PI - a, Math.PI + a, 30) : arc(sx * (L - 11), 0, 9.15, -a, a, 30), t: [0.8, 0.95] });
    S.push({ pts: arc(sx * (L - 11), 0, 0.22, 0, TAU, 10), t: [0.94, 0.96], closed: true });
    for (const sz of [-1, 1]) { const c = Math.atan2(-sz, -sx); S.push({ pts: arc(sx * L, sz * Wd, 1, c - Math.PI / 4, c + Math.PI / 4, 10), t: [0.95, 1] }); }
  }
  return S;
}

export const BB = 3.2; // basketball display scale
function basketball() {
  const L = 14, W = 7.5, S = [];
  S.push({ pts: rect(-L, -W, L, W), t: [0, 0.4], closed: true });
  S.push({ pts: [[0, W], [0, -W]], t: [0.34, 0.5] });
  S.push({ pts: arc(0, 0, 1.8, 0, TAU, 64), t: [0.44, 0.6], closed: true });
  S.push({ pts: arc(0, 0, 0.6, 0, TAU, 24), t: [0.56, 0.62], closed: true });
  for (const sx of [-1, 1]) {
    const bx = sx * (L - 1.575), kx = sx * (L - 5.8), r3 = 6.75, zc = 6.6, a3 = Math.asin(zc / r3);
    S.push({ pts: [[sx * L, -2.45], [kx, -2.45], [kx, 2.45], [sx * L, 2.45]], t: [0.5, 0.72] });
    S.push({ pts: sx > 0 ? arc(bx, 0, 1.25, Math.PI / 2, Math.PI * 1.5, 24) : arc(bx, 0, 1.25, -Math.PI / 2, Math.PI / 2, 24), t: [0.7, 0.8] });
    S.push({ pts: arc(kx, 0, 1.8, 0, TAU, 48), t: [0.72, 0.86], closed: true });
    S.push({ pts: arc(bx, 0, 0.23, 0, TAU, 14), t: [0.86, 0.9], closed: true });
    const ap = sx > 0 ? arc(bx, 0, r3, Math.PI + a3, Math.PI - a3, 60) : arc(bx, 0, r3, -a3, a3, 60);
    S.push({ pts: [[sx * L, -zc], ...ap, [sx * L, zc]], t: [0.78, 1] });
  }
  return scl(S, BB).map(s => ({ ...s, hw: 0.2 }));
}

export const YD = 0.9144;
function nfl() {
  const HL = 60 * YD, HW = (160 / 6) * YD, S = [];
  S.push({ pts: rect(-HL, -HW, HL, HW), t: [0, 0.3], closed: true });
  S.push({ pts: [[0, HW], [0, -HW]], t: [0.3, 0.4] });
  S.push({ pts: arc(0, 0, 4.6, 0, TAU, 64), t: [0.34, 0.5], closed: true });
  S.push({ pts: arc(0, 0, 3.9, 0, TAU, 56), t: [0.4, 0.52], closed: true });
  for (const sx of [-1, 1]) for (let k = 0; k <= 45; k += 5) { const x = sx * (50 - k) * YD; S.push({ pts: [[x, HW], [x, -HW]], t: [0.4 + k / 100, 0.5 + k / 100], hw: k === 0 ? 0.22 : 0.14 }); }
  return S;
}

export const TN = 3.5; // tennis display scale
// k shrinks the left half (x < 0) in length and width: 0.91 is the Battle of the Sexes court, where Sabalenka's side was about 9% smaller.
// Lines that cross the net carry a point either side of it, so the narrower half steps in at the net instead of tapering.
export function tennis(k = 1) {
  const L = 11.885, W = 5.485, Ws = 4.115, SL = 6.4, e = 1e-3, S = [];
  S.push({ pts: [[-L, W], [-e, W], [e, W], [L, W], [L, -W], [e, -W], [-e, -W], [-L, -W], [-L, W]], t: [0, 0.35], closed: true });
  S.push({ pts: [[-SL, 0], [SL, 0]], t: [0.6, 0.75] });
  S.push({ pts: [[-L, Ws], [-e, Ws], [e, Ws], [L, Ws]], t: [0.3, 0.55] });
  S.push({ pts: [[L, -Ws], [e, -Ws], [-e, -Ws], [-L, -Ws]], t: [0.3, 0.55] });
  for (const sx of [-1, 1]) {
    S.push({ pts: [[sx * SL, Ws], [sx * SL, -Ws]], t: [0.5, 0.65] });
    S.push({ pts: [[sx * L, 0], [sx * (L - 0.3), 0]], t: [0.7, 0.75] });
  }
  return scl(S.map(st => ({ ...st, pts: st.pts.map(([x, z]) => x < 0 ? [x * k, z * k] : [x, z]) })), TN).map(s => ({ ...s, hw: 0.2 }));
}

// padel: 20 x 10 m, service lines 6.95 m from the net, centre line between them. Spare strands fold onto the walls' lines.
export function padel() {
  const L = 10, W = 5, SL = 6.95, S = [];
  S.push({ pts: [[-L, W], [L, W], [L, -W], [-L, -W], [-L, W]], t: [0, 0.35], closed: true });
  S.push({ pts: [[-SL, 0], [SL, 0]], t: [0.6, 0.75] });
  S.push({ pts: [[-L, W], [L, W]], t: [0.3, 0.55] });
  S.push({ pts: [[L, -W], [-L, -W]], t: [0.3, 0.55] });
  for (const sx of [-1, 1]) {
    S.push({ pts: [[sx * SL, W], [sx * SL, -W]], t: [0.5, 0.65] });
    S.push({ pts: [[sx * L, 0], [sx * L, 0]], t: [0.7, 0.75] });
  }
  return scl(S, TN).map(s => ({ ...s, hw: 0.2 }));
}

export const RG = 4; // fight-night display scale
// fight night: a 7.3 m ring platform (6.1 m inside the ropes) in the middle of an arena floor,
// the ring walk from the tunnel on the -x end and the press-conference stage on the +x end
export const RING = { half: 3.65, ropes: 3.05, floor: [12, 9], walk: [-13.5, -3.65, 0.9], stage: [8.4, 11.6, 3.6] };
function ring() {
  const { half: H, ropes: R, floor: [FX, FZ], walk: [w0, w1, ww], stage: [s0, s1, sz] } = RING, S = [];
  S.push({ pts: rect(-FX, -FZ, FX, FZ), t: [0, 0.3], closed: true });
  S.push({ pts: rect(-H, -H, H, H), t: [0.22, 0.5], closed: true, hw: 0.08 });
  S.push({ pts: rect(-R, -R, R, R), t: [0.4, 0.62], closed: true, hw: 0.05 });
  S.push({ pts: arc(0, 0, 1.1, 0, TAU, 64), t: [0.58, 0.72], closed: true, hw: 0.05 });
  S.push({ pts: arc(0, 0, 0.3, 0, TAU, 24), t: [0.7, 0.75], closed: true, hw: 0.04 });
  for (const sz of [-1, 1]) S.push({ pts: [[w0, sz * ww], [w1, sz * ww]], t: [0.5, 0.78], red: true, hw: 0.07 });
  S.push({ pts: rect(s0, -sz, s1, sz), t: [0.66, 0.9], closed: true, hw: 0.07 });
  for (const [cx, cz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) S.push({ pts: rect(cx * H - 0.18, cz * H - 0.18, cx * H + 0.18, cz * H + 0.18), t: [0.84, 0.92], closed: true, hw: 0.05 });
  return scl(S, RG).map(s => ({ ...s, hw: (s.hw || 0.06) * RG }));
}

// ---------- circuit (centripetal Catmull-Rom through control points, closed)
const CP = [[-110, -70], [-30, -70], [50, -70], [110, -68], [145, -45], [148, -10], [125, 12], [95, 14], [70, 30], [78, 60], [110, 82], [95, 108], [50, 112], [0, 95], [-45, 105], [-95, 112], [-135, 90], [-150, 45], [-125, 10], [-150, -30], [-140, -62]];
const crp = (p0, p1, p2, p3, t) => {
  const d = (a, b) => Math.max(1e-4, Math.sqrt(Math.hypot(b[0] - a[0], b[1] - a[1])));
  const t0 = 0, t1 = d(p0, p1), t2 = t1 + d(p1, p2), t3 = t2 + d(p2, p3), u = t1 + (t2 - t1) * t;
  const L = (a, b, ta, tb) => { const k = (u - ta) / (tb - ta); return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]; };
  const A1 = L(p0, p1, t0, t1), A2 = L(p1, p2, t1, t2), A3 = L(p2, p3, t2, t3), B1 = L(A1, A2, t0, t2), B2 = L(A2, A3, t1, t3);
  return L(B1, B2, t1, t2);
};
function resampleLoop(pts, M) {
  const n = pts.length, cum = [0];
  for (let i = 1; i <= n; i++) { const a = pts[i - 1], b = pts[i % n]; cum.push(cum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1])); }
  const tot = cum[n], out = []; let j = 0;
  for (let k = 0; k < M; k++) { const s = tot * k / M; while (cum[j + 1] < s) j++; const a = pts[j], b = pts[(j + 1) % n], f = (s - cum[j]) / ((cum[j + 1] - cum[j]) || 1); out.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]); }
  return { pts: out, len: tot };
}
function buildCircuit() {
  const raw = [], n = CP.length;
  for (let i = 0; i < n; i++) { const p0 = CP[(i - 1 + n) % n], p1 = CP[i], p2 = CP[(i + 1) % n], p3 = CP[(i + 2) % n]; for (let k = 0; k < 30; k++) raw.push(crp(p0, p1, p2, p3, k / 30)); }
  let mnx = 1e9, mxx = -1e9, mnz = 1e9, mxz = -1e9; raw.forEach(([x, z]) => { mnx = Math.min(mnx, x); mxx = Math.max(mxx, x); mnz = Math.min(mnz, z); mxz = Math.max(mxz, z); });
  const cx = (mnx + mxx) / 2, cz = (mnz + mxz) / 2, M = 1000;
  let { pts: c, len } = resampleLoop(raw.map(([x, z]) => [x - cx, z - cz]), M);
  let i0 = 0, bd = 1e9; c.forEach(([x, z], i) => { const d = Math.hypot(x - (-20 - cx), z - (-70 - cz)); if (d < bd) { bd = d; i0 = i; } });
  c = c.slice(i0).concat(c.slice(0, i0));
  const ds = len / M;
  const tan = c.map((_, i) => { const a = c[(i - 1 + M) % M], b = c[(i + 1) % M]; const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1; return [dx / l, dz / l]; });
  const nrm = tan.map(([tx, tz]) => [-tz, tx]);
  let area = 0; for (let i = 0; i < M; i++) { const a = c[i], b = c[(i + 1) % M]; area += a[0] * b[1] - b[0] * a[1]; }
  const sIn = area > 0 ? 1 : -1;
  const ang = tan.map(([tx, tz]) => Math.atan2(tz, tx));
  const k = ang.map((a, i) => { let d = ang[(i + 1) % M] - ang[(i - 1 + M) % M]; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d / (2 * ds); });
  const smooth = (arr, w) => arr.map((_, i) => { let s = 0, ws = 0; for (let j = -w; j <= w; j++) { const g = Math.exp(-(j * j) / (w * w * 0.5)); s += arr[(i + j + M) % M] * g; ws += g; } return s / ws; });
  const ks = smooth(k, 8), kr = smooth(k, 22);
  const cand = []; for (let i = 0; i < M; i++) { const a = Math.abs(ks[i]); if (a > Math.abs(ks[(i - 1 + M) % M]) && a >= Math.abs(ks[(i + 1) % M]) && a > 0.004) cand.push(i); }
  cand.sort((a, b) => Math.abs(ks[b]) - Math.abs(ks[a]));
  const sep = Math.round(70 / ds), apex = [];
  for (const i of cand) { if (apex.length >= 7) break; if (i * ds < 60 || i * ds > len - 60) continue; if (apex.every(j => Math.min(Math.abs(i - j), M - Math.abs(i - j)) > sep)) apex.push(i); }
  apex.sort((a, b) => a - b);
  const idx = s => ((Math.round(s / ds) % M) + M) % M;
  const at = (s, off = 0) => { const i = idx(s); return [c[i][0] + nrm[i][0] * sIn * off, c[i][1] + nrm[i][1] * sIn * off]; };
  const HW = 7;
  const inner = c.map((p, i) => [p[0] + nrm[i][0] * sIn * HW, p[1] + nrm[i][1] * sIn * HW]);
  const outer = c.map((p, i) => [p[0] - nrm[i][0] * sIn * HW, p[1] - nrm[i][1] * sIn * HW]);
  const racing = c.map((p, i) => { const o = Math.sign(kr[i]) * Math.min(1, Math.abs(kr[i]) / 0.02) * 5.2; return [p[0] + nrm[i][0] * o, p[1] + nrm[i][1] * o]; });
  const pit = [at(-85, 7.4), at(-62, 17), at(-20, 17), at(40, 17), at(100, 17), at(124, 7.4)];
  const grid = [];
  for (let g = 0; g < 10; g++) { const s = -10 - g * 7.5, side = g % 2 ? 3 : -3, i = idx(s), [tx, tz] = tan[i]; const [px, pz] = at(s, side); const nx = nrm[i][0] * sIn, nz = nrm[i][1] * sIn;
    grid.push([[px - tx * 1.8 - nx * 1.4, pz - tz * 1.8 - nz * 1.4], [px - nx * 1.4, pz - nz * 1.4], [px + nx * 1.4, pz + nz * 1.4], [px - tx * 1.8 + nx * 1.4, pz - tz * 1.8 + nz * 1.4]]); }
  let ex = 0, ez = 0; outer.forEach(([x, z]) => { ex = Math.max(ex, Math.abs(x)); ez = Math.max(ez, Math.abs(z)); });
  return { c, tan, nrm, sIn, len, ds, M, ks, idx, at, HW, inner, outer, racing, pit, grid, ext: [ex + 14, ez + 14], apex: apex.map(i => ({ i, s: i * ds, side: Math.sign(ks[i]) || 1 })) };
}
export const circuit = buildCircuit();

function race(cc) {
  const S = [];
  S.push({ pts: cc.outer.concat([cc.outer[0]]), closed: true, t: [0, 0.6], hw: 0.32 });
  S.push({ pts: [cc.at(0, 7), cc.at(0, -7)], t: [0.6, 0.65], hw: 0.5 });
  S.push({ pts: cc.inner.concat([cc.inner[0]]), closed: true, t: [0, 0.6], hw: 0.32 });
  S.push({ pts: cc.racing.concat([cc.racing[0]]), closed: true, t: [0.3, 0.9], hw: 0.2, red: true });
  S.push({ pts: cc.pit, t: [0.6, 0.8], hw: 0.26 });
  cc.grid.forEach(g => S.push({ pts: g, t: [0.7, 0.8], hw: 0.2 }));
  return S;
}

export const SPORTS = {
  football: { scale: 1, strands: football(), ext: 88, fog: 0.0048, lr: 62 },
  basketball: { scale: BB, strands: basketball(), ext: 98, fog: 0.0042, lr: 60 },
  nfl: { scale: 1, strands: nfl(), ext: 90, fog: 0.0044, lr: 64 },
  tennis: { scale: TN, strands: tennis(), ext: 98, fog: 0.0044, lr: 56 },
  ring: { scale: RG, strands: ring(), ext: 78, fog: 0.005, lr: 48 },
  race: { scale: 1, strands: race(circuit), ext: Math.max(circuit.ext[0], circuit.ext[1] * 1.4), fog: 0.0015, lr: 230 },
};

// ---------- strand arrays (every sport resampled to N strands x P points so they can morph into each other)
function resample(src, closed) {
  let q = src.map(p => [p[0], p[1]]);
  if (closed) {
    const f = q[0], l = q[q.length - 1]; if (Math.hypot(f[0] - l[0], f[1] - l[1]) < 1e-6) q.pop();
    let A = 0; for (let i = 0; i < q.length; i++) { const a = q[i], b = q[(i + 1) % q.length]; A += a[0] * b[1] - b[0] * a[1]; }
    if (A > 0) q.reverse();
    let bi = 0, bv = -1e9; q.forEach((p, i) => { const v = -p[0] + p[1]; if (v > bv + 1e-6) { bv = v; bi = i; } });
    q = q.slice(bi).concat(q.slice(0, bi)); q.push(q[0]);
  }
  const cum = [0]; for (let i = 1; i < q.length; i++) cum.push(cum[i - 1] + Math.hypot(q[i][0] - q[i - 1][0], q[i][1] - q[i - 1][1]));
  const tot = cum[cum.length - 1], pts = [], cs = []; let j = 0;
  for (let k = 0; k < P; k++) { const s = tot * k / (P - 1); while (j < q.length - 2 && cum[j + 1] < s) j++; const a = q[j], b = q[Math.min(j + 1, q.length - 1)], d = cum[j + 1] - cum[j], f = d > 0 ? Math.min(1, (s - cum[j]) / d) : 0; pts.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]); cs.push(s); }
  return { pts, cum: cs, tot };
}
export function strandSet(strands, y = 0.04) {
  const NQ = N * (P - 1), pos = new Float32Array(NQ * 12), t = new Float32Array(NQ * 4), red = new Float32Array(NQ * 4), n = strands.length;
  let v = 0;
  for (let i = 0; i < N; i++) {
    const st = strands[i % n], { pts, cum, tot } = resample(st.pts, st.closed), hw = tot < 1e-4 ? 0 : (st.hw || 0.17), [t0, t1] = st.t || [0, 1], rd = st.red ? 1 : 0;
    for (let j = 0; j < P - 1; j++) {
      const [x0, z0] = pts[j], [x1, z1] = pts[j + 1]; let dx = x1 - x0, dz = z1 - z0, l = Math.hypot(dx, dz);
      if (l < 1e-7) { dx = 1; dz = 0; l = 1; }
      const nx = -dz / l * hw, nz = dx / l * hw, ex = dx / l * hw * 0.9, ez = dz / l * hw * 0.9;
      pos.set([x0 - nx - ex, y, z0 - nz - ez, x0 + nx - ex, y, z0 + nz - ez, x1 + nx + ex, y, z1 + nz + ez, x1 - nx + ex, y, z1 - nz + ez], v * 3);
      const ta = tot > 0 ? t0 + (t1 - t0) * cum[j] / tot : t1, tb = tot > 0 ? t0 + (t1 - t0) * cum[j + 1] / tot : t1;
      t[v] = ta; t[v + 1] = ta; t[v + 2] = tb; t[v + 3] = tb; red[v] = red[v + 1] = red[v + 2] = red[v + 3] = rd; v += 4;
    }
  }
  return { pos, t, red };
}
export function strandShared() {
  const VN = N * (P - 1) * 4, u = new Float32Array(VN), s = new Float32Array(VN), idx = new Uint32Array(N * (P - 1) * 6); let v = 0, q = 0;
  for (let i = 0; i < N; i++) { const si = ((i * 7) % N) / N; for (let j = 0; j < P - 1; j++) { const a = j / (P - 1), b = (j + 1) / (P - 1); u[v] = a; u[v + 1] = a; u[v + 2] = b; u[v + 3] = b; s[v] = s[v + 1] = s[v + 2] = s[v + 3] = si; idx[q] = v; idx[q + 1] = v + 1; idx[q + 2] = v + 2; idx[q + 3] = v; idx[q + 4] = v + 2; idx[q + 5] = v + 3; v += 4; q += 6; } }
  return { u, s, idx };
}
