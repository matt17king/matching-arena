// The route. Five slabs cut out of five venues, set down in one studio, and one line running through all of them.
import * as THREE from 'three';
import { SKIN, RADIUS } from './ball.js';
import { rng, RED, makeSlab, grassGroundTex, mapleTex, clayGrassCourtTex, asphaltTex, padelTex, strataTex, paintMask, withPaint, scatterGrass } from './surfaces.js';
import { materials, cornerFlag, tunnel, runway, sideDoor, hoop, goalposts, tokens, tennisNet, padelCage, gantry, kerbRamp, box } from './props.js';

const clamp = THREE.MathUtils.clamp, lerp = THREE.MathUtils.lerp;
const ramp = (v, a, b) => clamp((v - a) / (b - a), 0, 1);
const ease = t => t * t * (3 - 2 * t), easeOut = t => 1 - Math.pow(1 - t, 3);

// ---- where the ground is
const SLABS = {
  pitch: { x0: -4.5, x1: 4.5, z0: -3.5, z1: 2.5, h: 0.5 },
  court: { x0: 31, x1: 41, z0: -2.4, z1: 5.6, h: 0.5 },
  field: { x0: 47, x1: 72.4, z0: -1.8, z1: 8.2, h: 0.5 },
  tennis: { x0: 80, x1: 108, z0: -4.3, z1: 10.7, h: 0.5 },
  track: { x0: 117, x1: 153, z0: -1.3, z1: 7.7, h: 0.3 },
};
const inRect = (r, x, z) => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1;
export function groundY(x, z) {
  for (const k in SLABS) if (inRect(SLABS[k], x, z)) return SLABS[k].h;
  if (x >= 14 && x <= 25 && z >= 0.5 && z <= 2.7) return 0.02;                    // carpet
  if (x >= 114 && x < 117 && Math.abs(z - 3.2) < 0.8) return ((x - 114) / 3) * 0.3; // ramp
  return 0;
}

// ---- the ball's path: rolls, bounces and throws, sampled once
function buildPath() {
  const S = [], marks = {}; let W = 0, cur = null;
  const add = (x, z, y, mode, w, air) => S.push({ x, z, y, mode, w, air });
  const api = {
    start(x, z, mode = 'roll') { cur = [x, z]; add(x, z, groundY(x, z), mode, 0, 0); },
    roll(pts, weight, mode = 'roll') {
      const all = [cur, ...pts].map(p => new THREE.Vector3(p[0], 0, p[1]));
      const curve = all.length > 2 ? new THREE.CatmullRomCurve3(all, false, 'centripetal') : new THREE.LineCurve3(all[0], all[1]);
      const len = curve.getLength(), n = Math.max(2, Math.ceil(len / 0.035));
      for (let i = 1; i <= n; i++) { const p = curve.getPointAt(i / n); add(p.x, p.z, groundY(p.x, p.z), mode, W + weight * (i / n), 0); }
      W += weight; cur = pts[pts.length - 1];
    },
    // from here to `to`; a0/a1 are heights above the ground at each end (0 = touching), apex is added on top
    fly(to, apex, weight, mode = 'roll', { a0 = 0, a1 = 0, drop = false, n = 0 } = {}) {
      const g0 = groundY(cur[0], cur[1]) + a0, g1 = groundY(to[0], to[1]) + a1, d = Math.hypot(to[0] - cur[0], to[1] - cur[1]);
      n = n || Math.max(14, Math.ceil(d / 0.07) + Math.ceil(apex * 14));
      for (let i = 1; i <= n; i++) {
        const t = i / n, x = lerp(cur[0], to[0], t), z = lerp(cur[1], to[1], t);
        const y = drop ? lerp(g0, g1, t * t) : lerp(g0, g1, t) + apex * 4 * t * (1 - t);
        add(x, z, y, mode, W + weight * t, i < n || a1 > 0 ? 1 : 0);
      }
      W += weight; cur = to;
    },
    hold(weight, mode) { const l = S[S.length - 1]; add(l.x, l.z, l.y, mode || l.mode, W + weight, l.air); W += weight; },
    mark(name) { marks[name] = W; },
  };

  // 01 football: out of the corner, along the touchline, off the edge of the pitch
  api.start(-2.72, 1.12); api.mark('start');
  api.roll([[-2.2, 1.42], [-1.3, 1.6], [0.6, 1.6], [4.5, 1.6]], 6); api.mark('edge');
  api.fly([5.3, 1.6], 0.14, 1.3); api.fly([5.85, 1.6], 0.05, 0.6); api.mark('landed');
  api.roll([[9.4, 1.6]], 3); api.mark('tunnelIn');
  api.roll([[13.0, 1.6]], 3); api.mark('tunnelOut');
  api.roll([[14.0, 1.6]], 1); api.mark('carpetIn');
  api.roll([[19.5, 1.6]], 5); api.mark('carpetMid');
  api.roll([[25, 1.6]], 5); api.mark('carpetOut');
  api.roll([[27.3, 1.6]], 2.2); api.mark('doorBefore');
  api.roll([[29.0, 1.6]], 1.8); api.mark('doorAfter');
  // 02 basketball: dribble up onto the hardwood, three plays, one shot
  api.fly([29.8, 1.6], 0.24, 0.9); api.fly([30.55, 1.6], 0.46, 1); api.fly([31.7, 1.6], 0.62, 1.3); api.mark('onCourt');
  api.fly([32.4, 1.6], 0.5, 1); api.mark('play1'); api.hold(0.6);
  api.fly([32.9, 1.6], 0.62, 0.6); api.fly([33.4, 1.6], 0.62, 0.6); api.mark('play2'); api.hold(0.6);
  api.fly([33.9, 1.6], 0.62, 0.6); api.fly([34.4, 1.6], 0.62, 0.6); api.mark('play3'); api.hold(0.5); api.mark('shoot');
  api.fly([38.6, 1.6], 2.6, 3, 'roll', { a1: 2.52, n: 70 }); api.mark('rim');
  api.fly([38.62, 1.6], 0, 0.9, 'roll', { a0: 2.52, a1: 0, drop: true, n: 24 }); api.mark('netOut');
  api.fly([39.45, 2.3], 0.85, 1); api.fly([40.2, 2.85], 0.4, 0.7); api.fly([40.75, 3.1], 0.16, 0.5); api.fly([41.7, 3.2], 0.2, 0.8); api.mark('bbExit');
  api.fly([42.7, 3.2], 0.5, 0.8); api.mark('toField');
  // 03 NFL: a spiral onto the turf, then seven downs to the end zone
  api.fly([49.5, 3.2], 2.4, 3.2, 'spiral', { n: 90 }); api.hold(0.5, 'rest'); api.mark('d1');
  [[52.7, 'd2'], [56.4, 'd3'], [58.64, 'd4'], [63.2, 'd5'], [66.9, 'd6'], [69.9, 'd7']].forEach(([x, m]) => { api.hold(0.4, 'rest'); api.fly([x, 3.2], 0.85, 1, 'spiral', { n: 44 }); api.hold(0.4, 'rest'); api.mark(m); });
  api.hold(0.6, 'rest'); api.mark('back');
  api.fly([60.5, 3.2], 2.4, 2.4, 'spiral', { n: 80 }); api.hold(0.4, 'rest'); api.mark('huddle'); api.hold(2, 'rest'); api.mark('kick');
  // 04 tennis: kicked through the posts, comes down a tennis ball
  api.fly([83.5, 3.2], 7.6, 5, 'tumble', { n: 160 }); api.mark('kickLand');
  api.fly([88, 3.2], 1.3, 1.5); api.fly([92.3, 3.2], 1.0, 1.3); api.fly([96.6, 3.2], 1.25, 1.4); api.fly([98.4, 3.2], 0.42, 0.8); api.fly([99.3, 3.2], 0.14, 0.5);
  api.roll([[99.9, 3.2]], 0.5); api.mark('court'); api.hold(1); api.mark('f1'); api.hold(1); api.mark('f2');
  api.fly([103.86, 3.2], 0.55, 1, 'roll', { a1: 1.05 }); api.fly([101.7, 3.2], 0.32, 0.9, 'roll', { a0: 1.05 }); api.fly([100.7, 3.2], 0.22, 0.5); api.roll([[100.3, 3.2]], 0.3); api.mark('f3'); api.hold(1); api.mark('f3b');
  // 05 motorsport: off the baseline, grows into a tyre, up the kerb, down the grid
  api.roll([[108, 3.2]], 3); api.mark('tnEdge');
  api.fly([108.7, 3.2], 0.12, 0.6); api.fly([109.4, 3.2], 0.3, 0.7); api.fly([109.9, 3.2], 0.1, 0.4); api.roll([[110.4, 3.2]], 0.4); api.mark('grow0');
  api.roll([[113.7, 3.2]], 2.6); api.mark('grow1'); api.roll([[117, 3.2]], 2); api.mark('rampTop'); api.roll([[119.4, 3.2]], 1.2); api.mark('grid'); api.hold(1.5); api.mark('lights');
  api.roll([[149.7, 3.2]], 14); api.mark('pit'); api.hold(2); api.mark('pitEnd');
  // the line-up
  api.roll([[153, 3.2]], 1.6); api.mark('trackEdge'); api.fly([153.9, 3.2], 0.06, 0.7); api.roll([[168, 3.2]], 6); api.mark('lineup');
  api.roll([[171.8, 3.2]], 1); api.mark('end');

  // which form the ball is in, by story position
  const m = marks;
  const forms = [
    [m.doorBefore + 0.55, m.doorAfter - 0.25, SKIN.football, SKIN.basketball],
    [m.toField + 0.25, m.toField + 2.3, SKIN.basketball, SKIN.gridiron],
    [m.kick + 2.7, m.kick + 4.5, SKIN.gridiron, SKIN.tennis],
    [m.grow0, m.grow1, SKIN.tennis, SKIN.tyre],
  ];
  const formAt = w => {
    let a = SKIN.football, b = SKIN.football, t = 0;
    for (const f of forms) { if (w >= f[1]) { a = b = f[3]; t = 0; } else if (w > f[0]) { a = f[2]; b = f[3]; t = (w - f[0]) / (f[1] - f[0]); break; } else break; }
    return { a, b, t };
  };
  const radiusAt = w => { const f = formAt(w), e = ease(f.t); return RADIUS[f.a] * (1 - e) + RADIUS[f.b] * e; };

  // orientation: a rolling ball turns about the axis across its path; a spiral spins about its own length
  const n = S.length, up = new THREE.Vector3(0, 1, 0), head = new THREE.Vector3(1, 0, 0), axle = new THREE.Vector3(), vel = new THREE.Vector3();
  const qa = new THREE.Quaternion(), qb = new THREE.Quaternion(), mat = new THREE.Matrix4(), X = new THREE.Vector3(), Z = new THREE.Vector3();
  let spin = 0, L = 0, prev = new THREE.Quaternion();
  for (let i = 0; i < n; i++) {
    const s = S[i], p = S[Math.max(0, i - 1)], q = S[Math.min(n - 1, i + 1)];
    const dx = s.x - p.x, dz = s.z - p.z, d = Math.hypot(dx, dz), r = radiusAt(s.w);
    if (d > 1e-5) head.set(dx / d, 0, dz / d);
    L += d; s.L = L; s.r = r;
    vel.set(q.x - p.x, q.y - p.y, q.z - p.z); if (vel.lengthSq() < 1e-10) vel.copy(head); vel.normalize();
    axle.crossVectors(up, head).normalize();
    if (s.mode === 'spiral') { spin += d * 7 + Math.abs(q.y - p.y) * 2; Z.crossVectors(up, vel).normalize(); X.crossVectors(vel, Z).normalize(); mat.makeBasis(X, vel, Z); qa.setFromRotationMatrix(mat); qb.setFromAxisAngle(up, spin); qa.multiply(qb); }
    else if (s.mode === 'rest') { Z.crossVectors(up, head).normalize(); mat.makeBasis(up, head, Z); qa.setFromRotationMatrix(mat); }
    else if (s.mode === 'tumble') { spin += d * 1.1; Z.crossVectors(up, head).normalize(); mat.makeBasis(up, head, Z); qa.setFromRotationMatrix(mat); qb.setFromAxisAngle(axle, spin); qa.premultiply(qb); }
    else { spin += d / Math.max(r, 0.02); qa.setFromUnitVectors(up, axle); qb.setFromAxisAngle(axle, spin); qa.premultiply(qb); }
    if (i === 0) prev.copy(qa); else prev.slerp(qa, 0.5);
    s.q = prev.clone();
  }
  // squash where a soft ball meets the ground
  for (let i = 1; i < n - 1; i++) S[i].sq = 0;
  S[0].sq = 0; S[n - 1].sq = 0;
  for (let i = 1; i < n - 1; i++) {
    if (S[i].air === 0 && (S[i - 1].air === 1 || S[i + 1].air === 1) && S[i].mode === 'roll') {
      const fall = Math.min(1, Math.abs(S[i].y - S[Math.max(0, i - 4)].y) * 6 + Math.abs(S[i].y - S[Math.min(n - 1, i + 4)].y) * 6);
      for (let k = -5; k <= 5; k++) { const j = i + k; if (j > 0 && j < n) S[j].sq = Math.max(S[j].sq, fall * Math.exp(-(k * k) / 5)); }
    }
  }
  const ws = S.map(s => s.w), out = { pos: new THREE.Vector3(), quat: new THREE.Quaternion(), r: 0.11, L: 0, form: null, squash: 0, air: 0, head: new THREE.Vector3(1, 0, 0) };
  function at(w) {
    w = clamp(w, 0, W); let lo = 0, hi = n - 1;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (ws[mid] <= w) lo = mid; else hi = mid; }
    const a = S[lo], b = S[hi], t = b.w > a.w ? (w - a.w) / (b.w - a.w) : 0;
    out.form = formAt(w); out.r = radiusAt(w);
    out.pos.set(lerp(a.x, b.x, t), lerp(a.y, b.y, t) + out.r, lerp(a.z, b.z, t));
    out.quat.copy(a.q).slerp(b.q, t); out.L = lerp(a.L, b.L, t); out.squash = lerp(a.sq, b.sq, t); out.air = lerp(a.air, b.air, t);
    out.head.set(b.x - a.x, 0, b.z - a.z); if (out.head.lengthSq() < 1e-8) out.head.set(1, 0, 0); out.head.normalize();
    return out;
  }
  return { S, marks, W, at, formAt, total: L };
}

// the red line: a ribbon laid over whatever the ball's path crosses, drawn in as the ball advances
function buildThread(path) {
  const S = path.S, pos = [], uv = [], idx = [], wd = 0.05, m = path.marks;
  const skip = (x, z) => inRect(SLABS.pitch, x, z) && x < 4.49 || inRect(SLABS.field, x, z);
  let started = false, base = 0, last = null;
  const pts = [];
  for (let i = 0; i < S.length; i++) {
    const s = S[i]; if (s.w < m.edge) continue;
    const g = groundY(s.x, s.z);
    if (last && Math.hypot(s.x - last.x, s.z - last.z) < 0.03 && Math.abs(g - last.y) < 0.01) continue;
    if (last && Math.abs(g - last.y) > 0.05) { // a step: run the line down (or up) the cut face
      let lo = 0, hi = 1; for (let k = 0; k < 14; k++) { const mid = (lo + hi) / 2; if (Math.abs(groundY(lerp(last.x, s.x, mid), lerp(last.z, s.z, mid)) - last.y) > 0.05) hi = mid; else lo = mid; }
      const up = g > last.y, dir = Math.sign(s.x - last.x) || 1, ex = lerp(last.x, s.x, hi) + (up ? -0.004 : 0.004) * dir, ez = lerp(last.z, s.z, hi);
      pts.push({ x: ex, z: ez, y: last.y, L: lerp(last.L, s.L, hi) - 0.001 }); pts.push({ x: ex, z: ez, y: g, L: lerp(last.L, s.L, hi) });
    }
    last = { x: s.x, z: s.z, y: g, L: s.L }; pts.push(last);
  }
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let dx = b.x - a.x, dz = b.z - a.z; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
    if (l < 0.002) { dx = 1; dz = 0; }
    pos.push(p.x - dz * wd, p.y + 0.003, p.z + dx * wd, p.x + dz * wd, p.y + 0.003, p.z - dx * wd); uv.push(p.L, 0, p.L, 1);
    if (i > 0) { const q = pts[i - 1], mx = (p.x + q.x) / 2, mz = (p.z + q.z) / 2; if (!skip(mx, mz)) { const k = i * 2; idx.push(k - 2, k - 1, k, k, k - 1, k + 1); } }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ color: '#c21c14', roughness: 1, envMapIntensity: 0.35, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
  const u = { uDraw: { value: 0 } };
  mat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vL;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvL = uv.x;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uDraw; varying float vL;').replace('#include <clipping_planes_fragment>', 'if ( vL > uDraw ) discard;\n#include <clipping_planes_fragment>');
  };
  const mesh = new THREE.Mesh(g, mat); mesh.receiveShadow = true; mesh.frustumCulled = false;
  return { mesh, u };
}

export function createWorld(studio, ball, tier) {
  const { scene } = studio, M = materials(), root = new THREE.Group(); scene.add(root);
  const dens = { high: 1, mid: 0.6, low: 0.4 }[tier];
  const path = buildPath(), mk = path.marks;
  const sideOf = bands => new THREE.MeshStandardMaterial({ map: strataTex(bands), roughness: 0.95 });
  const thread = buildThread(path); root.add(thread.mesh);
  const LnormAtX = x => { const S = path.S; for (let i = 0; i < S.length; i++) if (S[i].w > mk.toField && S[i].x >= x) return S[i].L; return path.total; };

  // ---------- 01 the pitch: a corner, cut out
  const pitch = (() => {
    const s = SLABS.pitch, w = s.x1 - s.x0, d = s.z1 - s.z0, cx = (s.x0 + s.x1) / 2, cz = (s.z0 + s.z1) / 2;
    const C = [-3.2, 1.6 - cz]; // the corner, slab-local
    const mask = paintMask(w, d, p => {
      p.seg([C[0], -d / 2], [C[0], C[1] + 0.06], 0.12, 0, 0.32);
      p.arc(C[0], C[1], 1, -Math.PI / 2, 0, 0.12, 0.3, 0.46);
      p.seg([C[0] - 0.06, C[1]], [w / 2, C[1]], 0.12, 0.44, 1);
    });
    const top = withPaint(new THREE.MeshStandardMaterial({ map: grassGroundTex(w, d, 1.5), roughness: 0.95 }), mask);
    const g = makeSlab({ w, d, h: s.h, top, side: sideOf([[0.09, '#2b4a22', ['#3a5e2a', '#1f3a1a'], 3000, 1, 3], [0.3, '#3a2a1c', ['#4a3624', '#2a1d12', '#5a4630'], 2600, 1, 4], [0.36, '#6b5a43', ['#8a7a60', '#57483a', '#9a8d78'], 2200, 2, 6], [0.25, '#8d8676', ['#a9a294', '#6f6a5e', '#bcb6a8'], 1600, 3, 8]]) });
    g.position.set(cx, 0, cz);
    const sample = mask.userData.sampler();
    const grass = scatterGrass({
      rect: [-w / 2, -d / 2, w / 2, d / 2], y: s.h, seed: 41, fullDensity: 3200, cell: 0.125,
      density: (x, z) => ((z > C[1] - 1.0 || (Math.hypot(x - C[0], z - C[1]) < 2.2)) ? 3200 * dens : 900 * dens) * (sample(x, z) ? 2.2 : 1),
      colour: x => (Math.floor((x + w / 2) / 1.5) % 2 ? [0.05, 0.175, 0.034] : [0.092, 0.27, 0.05]),
      paint: sample,
    });
    g.add(grass);
    const flag = cornerFlag(); flag.position.set(C[0], s.h, C[1]); flag.rotation.y = 0.5; g.add(flag);
    root.add(g);
    return { g, top, grass, flag, h: s.h };
  })();

  // ---------- tunnel, red carpet, the side door
  const tun = tunnel(); tun.position.set(11.2, 0, 1.6); root.add(tun);
  const rw = runway(); rw.position.set(19.5, 0, 1.6); root.add(rw);
  const door = sideDoor(); door.position.set(28.2, 0, 1.6); root.add(door);
  const flashAt = rw.userData.flashes.map((f, i) => ({ ...f, hits: [0, 1, 2].map(k => lerp(mk.carpetIn, mk.carpetOut, clamp((f.x + 5.5) / 11 + (k - 1) * 0.085 + ((i * 37 + k * 17) % 10) * 0.004, 0.02, 0.98))) }));

  // ---------- 02 the hardwood
  const court = (() => {
    const s = SLABS.court, w = s.x1 - s.x0, d = s.z1 - s.z0, cx = (s.x0 + s.x1) / 2, cz = (s.z0 + s.z1) / 2;
    const rimX = 38.6 - cx, base = 40.2 - cx, ft = base - 5.8;
    const mask = paintMask(w, d, p => {
      p.rect(ft, -2.45, base, 2.45, 0.3);
      p.seg([base, -d / 2], [base, d / 2], 0.06, 0, 0.14);
      p.seg([base, -2.45], [ft, -2.45], 0.06, 0.14, 0.3); p.seg([ft, -2.45], [ft, 2.45], 0.06, 0.3, 0.4); p.seg([ft, 2.45], [base, 2.45], 0.06, 0.4, 0.5);
      p.arc(ft, 0, 1.8, 0, Math.PI * 2, 0.06, 0.42, 0.62);
      p.arc(rimX, 0, 1.25, Math.PI / 2, Math.PI * 1.5, 0.06, 0.56, 0.66);
      p.arc(rimX, 0, 6.75, Math.PI - 0.634, Math.PI + 0.634, 0.06, 0.62, 1);
    });
    const mp = mapleTex(w, d);
    const top = withPaint(new THREE.MeshPhysicalMaterial({ map: mp.map, normalMap: mp.normalMap, normalScale: new THREE.Vector2(0.5, 0.5), roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.09, envMapIntensity: 0.75 }), mask, { white: '#f3f0e8', fill: '#8e110c' });
    const g = makeSlab({ w, d, h: s.h, top, side: new THREE.MeshStandardMaterial({ map: strataTex([[0.07, '#d9b27c'], [0.035, '#3a2c20'], [0.07, '#c9a26e'], [0.03, '#5a4630'], [0.07, '#caa574'], [0.03, '#4a3828'], [0.16, '#1c1c1e', ['#2a2a2c'], 600, 2, 5], [0.55, '#a8a59e', ['#bdbab2', '#8d8a84', '#c9c6be'], 2200, 2, 7]], 23, true), roughness: 0.9 }) });
    g.position.set(cx, 0, cz);
    const hp = hoop(); hp.position.set(rimX, s.h, 0); g.add(hp);
    root.add(g);
    return { g, top, hp, h: s.h };
  })();

  // ---------- 03 the field
  const field = (() => {
    const s = SLABS.field, w = s.x1 - s.x0, d = s.z1 - s.z0, cx = (s.x0 + s.x1) / 2, cz = (s.z0 + s.z1) / 2;
    const yards = [49.5, 54.07, 58.64, 63.21, 67.78].map(x => x - cx), endLine = 72.0 - cx;
    const mask = paintMask(w, d, p => {
      p.rect(yards[4] + 0.06, -d / 2, endLine, d / 2, 0.55);
      yards.forEach((x, i) => p.seg([x, -d / 2], [x, d / 2], i === 4 ? 0.2 : 0.1, 0.05 + i * 0.1, 0.25 + i * 0.1));
      p.seg([endLine, -d / 2], [endLine, d / 2], 0.14, 0.6, 0.75);
      for (let x = yards[0] - 0.914 * 2; x < yards[4]; x += 0.914) [-2.8, 2.8, -4.7, 4.7].forEach(z => p.seg([x, z - 0.3], [x, z + 0.3], 0.1, 0.3 + (x + w / 2) / w * 0.4, 0.34 + (x + w / 2) / w * 0.4));
      [['2 0', yards[0]], ['1 0', yards[2]]].forEach(([t, x]) => { p.text(t, x, 3.85, 1.5, 0.5, { font: '700', spacing: 0.12 }); p.text(t, x, -3.85, 1.5, 0.5, { font: '700', rot: Math.PI, spacing: 0.12 }); });
      p.text('NEW FANS', (yards[4] + endLine) / 2 + 0.05, 0, 1.75, 0.8, { font: '700', rot: Math.PI / 2, spacing: 0.08 });
    }, 4096);
    const top = withPaint(new THREE.MeshStandardMaterial({ map: grassGroundTex(w, d, 4.57, 9, 1), roughness: 0.95 }), mask);
    const g = makeSlab({ w, d, h: s.h, top, side: sideOf([[0.08, '#2a4d2c', ['#356038', '#1c3a22'], 2600, 1, 3], [0.1, '#141414', ['#262626', '#0c0c0c'], 2600, 1, 3], [0.3, '#57524a', ['#75706a', '#3f3b36', '#8a857c'], 2400, 2, 6], [0.52, '#8e877a', ['#aaa497', '#6d685e', '#bfb9ad'], 1800, 3, 8]], 29), tile: 5 });
    g.position.set(cx, 0, cz);
    const sample = mask.userData.sampler(), La = LnormAtX(s.x0);
    const grass = scatterGrass({
      rect: [-w / 2, -d / 2, w / 2, d / 2], y: s.h, seed: 53, height: 0.026, fullDensity: 2600, cell: 0.25,
      density: (x, z) => (Math.abs(z) < 1.3 ? 2600 * dens : Math.abs(z) < 2.6 ? 1100 * dens : 480 * dens) * (sample(x, z) ? 1.8 : 1),
      colour: x => (Math.floor((x - yards[0] + 45.7) / 4.57) % 2 ? [0.05, 0.19, 0.06] : [0.066, 0.225, 0.07]),
      paint: (x, z) => { if (Math.abs(z) < 0.05) return [1, 2, 0]; return sample(x, z); },
    });
    // the thread through the turf appears with the line, measured in metres of path
    const ap = grass.geometry.attributes.aPaint, im = new THREE.Matrix4(), v = new THREE.Vector3();
    for (let i = 0; i < ap.count; i++) if (ap.getY(i) > 1.5) { grass.getMatrixAt(i, im); v.setFromMatrixPosition(im); ap.setZ(i, (La + v.x + w / 2) / path.total); }
    ap.needsUpdate = true;
    g.add(grass);
    const gp = goalposts(); gp.position.set(endLine, s.h, 0); g.add(gp);
    const tk = tokens();
    const lx = 60.0 - cx, form = [[lx - 0.9, -2.5], [lx - 0.9, 3.75], [lx - 0.9, 2.5], [lx - 0.9, -1.25], [lx - 0.9, 1.25], [lx - 0.9, 0], [lx - 1.1, 4.6], [lx - 5.4, 0], [lx - 2.6, 0], [lx - 4.0, 0], [lx - 1.1, -4.6]];
    tk.forEach((t, i) => { t.position.set(form[i][0], s.h + 0.035, form[i][1]); t.userData.home = t.position.clone(); g.add(t); });
    root.add(g);
    return { g, top, grass, gp, tk, h: s.h };
  })();

  // ---------- 04 the court that changes format
  const tennis = (() => {
    const s = SLABS.tennis, w = s.x1 - s.x0, d = s.z1 - s.z0, cx = (s.x0 + s.x1) / 2, cz = (s.z0 + s.z1) / 2;
    const top = new THREE.MeshStandardMaterial({ map: clayGrassCourtTex(), roughness: 0.96 });
    const u = { uPadel: { value: 0 }, uPadelTex: { value: padelTex() } };
    top.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, u);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vLoc;').replace('#include <begin_vertex>', `#include <begin_vertex>\nvLoc = ( uv - 0.5 ) * vec2( ${w.toFixed(1)}, ${d.toFixed(1)} );`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uPadel; uniform sampler2D uPadelTex; varying vec2 vLoc;')
        .replace('#include <map_fragment>', `#include <map_fragment>
          float inC = ( 1.0 - smoothstep( 9.98, 10.02, abs( vLoc.x ) ) ) * ( 1.0 - smoothstep( 4.98, 5.02, abs( vLoc.y ) ) );
          float wipe = 1.0 - smoothstep( uPadel * 11.5 - 0.6, uPadel * 11.5, abs( vLoc.x ) );
          diffuseColor.rgb = mix( diffuseColor.rgb, texture2D( uPadelTex, vLoc * 0.5 ).rgb, inC * wipe * step( 0.001, uPadel ) );`);
    };
    top.customProgramCacheKey = () => 'mk-tennis';
    const g = makeSlab({ w, d, h: s.h, top, side: sideOf([[0.07, '#b9532c', ['#c96a42', '#9a4424'], 2600, 1, 3], [0.2, '#8b4a30', ['#a35c3c', '#6f3a26', '#b8704c'], 2600, 2, 5], [0.3, '#b8b1a2', ['#d2ccbe', '#989284', '#e0dbd0'], 2200, 2, 7], [0.43, '#7d776c', ['#9a948a', '#5f5a52', '#aba59b'], 1700, 3, 9]], 37), tile: 5 });
    g.position.set(cx, 0, cz);
    // lines as thin strips so the court can redraw itself: [tennis, one side 9% smaller, padel]
    const Lh = 11.885, D = 5.485, Sg = 4.115, Sv = 6.4, k = 0.954, lines = [];
    const def = (A, B, C, wd = 0.05) => { const m = new THREE.Mesh(new THREE.BoxGeometry(1, 0.004, 1), M.line); m.receiveShadow = true; g.add(m); lines.push({ m, st: [A, B, C], wd }); };
    [-1, 1].forEach(sd => {
      const kk = sd > 0 ? k : 1;
      def([sd * Lh, -D, sd * Lh, D], [sd * Lh * kk, -D * kk, sd * Lh * kk, D * kk], [sd * 10, -5, sd * 10, 5], 0.1);
      [-1, 1].forEach(z => {
        def([0, z * D, sd * Lh, z * D], [0, z * D * kk, sd * Lh * kk, z * D * kk], [0, z * 5, sd * 10, z * 5]);
        def([0, z * Sg, sd * Lh, z * Sg], [0, z * Sg * kk, sd * Lh * kk, z * Sg * kk], [0, z * 5, sd * 10, z * 5]);
      });
      def([sd * Sv, -Sg, sd * Sv, Sg], [sd * Sv * kk, -Sg * kk, sd * Sv * kk, Sg * kk], [sd * 6.95, -5, sd * 6.95, 5]);
      def([0, 0, sd * Sv, 0], [0, 0, sd * Sv * kk, 0], [0, 0, sd * 6.95, 0]);
    });
    const setCourt = (c, draw) => lines.forEach(l => {
      const a = l.st[Math.min(2, Math.floor(c))], b = l.st[Math.min(2, Math.floor(c) + 1)], t = ease(c - Math.floor(c));
      const x0 = lerp(a[0], b[0], t), z0 = lerp(a[1], b[1], t); let x1 = lerp(a[2], b[2], t), z1 = lerp(a[3], b[3], t);
      x1 = lerp(x0, x1, draw); z1 = lerp(z0, z1, draw);
      const len = Math.hypot(x1 - x0, z1 - z0); l.m.visible = len > 0.01;
      l.m.position.set((x0 + x1) / 2, s.h + 0.003, (z0 + z1) / 2); l.m.rotation.y = -Math.atan2(z1 - z0, x1 - x0); l.m.scale.set(len + l.wd, 1, l.wd);
    });
    // what the 9% takes away, shown for a moment in red
    const delta = new THREE.Group(), dm = M.delta;
    const strip = (x0, z0, x1, z1) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(Math.abs(x1 - x0), Math.abs(z1 - z0)), dm); m.rotation.x = -Math.PI / 2; m.position.set((x0 + x1) / 2, s.h + 0.002, (z0 + z1) / 2); delta.add(m); };
    strip(Lh * k, -D, Lh, D); strip(0, D * k, Lh * k, D); strip(0, -D, Lh * k, -D * k); g.add(delta);
    const net = tennisNet(); net.position.set(0, s.h, 0); g.add(net);
    const cage = padelCage(); cage.position.set(0, s.h, 0); g.add(cage); cage.userData.rise(0);
    root.add(g);
    return { g, top, u, setCourt, delta, dm, net, cage, h: s.h };
  })();

  // ---------- 05 the grid
  const track = (() => {
    const s = SLABS.track, w = s.x1 - s.x0, d = s.z1 - s.z0, cx = (s.x0 + s.x1) / 2, cz = (s.z0 + s.z1) / 2;
    const names = ['UK', 'NORTH AMERICA', 'LATAM', 'MENA', 'SOUTH EAST ASIA', 'AUSTRALIA & NZ', 'REST OF WORLD'];
    const slotX = i => 122.4 + i * 4 - cx;
    const mask = paintMask(w, d, p => {
      p.seg([-w / 2, -3.5], [w / 2, -3.5], 0.12, 0, 0.5); p.seg([-w / 2, 3.5], [w / 2, 3.5], 0.12, 0, 0.5);
      for (let i = 0; i < 14; i++) { const x = -16 + i; p.rect(x, 3.58, x + 1, 4.2, 0.1 + i * 0.01, i % 2 === 0); if (i % 2) p.rect(x, 3.58, x + 1, 4.2, 0.1 + i * 0.01, false); }
      for (let i = 0; i < 14; i++) { const x = 2 + i; p.rect(x, -4.2, x + 1, -3.58, 0.3 + i * 0.01, i % 2 === 0); if (i % 2) p.rect(x, -4.2, x + 1, -3.58, 0.3 + i * 0.01, false); }
      const sx = 119.4 - cx; for (let r = 0; r < 2; r++) for (let c = 0; c < 28; c++) if ((r + c) % 2 === 0) p.rect(sx + r * 0.25, -3.5 + c * 0.25, sx + (r + 1) * 0.25, -3.5 + (c + 1) * 0.25, 0.15, false);
      names.forEach((nm, i) => {
        const x = slotX(i), z = i % 2 ? 1.75 : -1.75, t = 0.25 + i * 0.09;
        p.seg([x, z - 1.1], [x, z + 1.1], 0.12, t, t + 0.05); p.seg([x, z - 1.1], [x - 0.8, z - 1.1], 0.12, t, t + 0.05); p.seg([x, z + 1.1], [x - 0.8, z + 1.1], 0.12, t, t + 0.05);
        p.text(String(i + 1).padStart(2, '0'), x - 0.5, z, 0.52, t + 0.03, { font: '700', fill: true });
        p.text(nm, x - 1.15, z - 0.02, 0.34, t + 0.05, { font: '700', align: 'right', spacing: 0.02 });
      });
      const px = 149.7 - cx; p.seg([px - 1.6, -1.3], [px + 1.6, -1.3], 0.1, 0.9, 0.94); p.seg([px + 1.6, -1.3], [px + 1.6, 1.3], 0.1, 0.92, 0.96); p.seg([px + 1.6, 1.3], [px - 1.6, 1.3], 0.1, 0.94, 0.98); p.seg([px - 1.6, 1.3], [px - 1.6, -1.3], 0.1, 0.96, 1);
      p.text('PIT', px, 2.05, 0.6, 0.97, { font: '700', spacing: 0.1 });
    }, 4096);
    const at = asphaltTex(); [at.map, at.normalMap].forEach(t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(w / 2.4, d / 2.4); });
    const top = withPaint(new THREE.MeshStandardMaterial({ map: at.map, normalMap: at.normalMap, normalScale: new THREE.Vector2(0.7, 0.7), roughness: 0.82 }), mask, { white: '#e9e6de' });
    const g = makeSlab({ w, d, h: s.h, top, side: sideOf([[0.14, '#1d1e20', ['#303134', '#111213'], 3000, 1, 3], [0.2, '#34353a', ['#55565b', '#222326', '#6a6b70'], 2800, 2, 5], [0.66, '#8a8478', ['#a8a296', '#6a655c', '#beb8ac', '#56524a'], 2600, 3, 9]], 43), tile: 5 });
    g.position.set(cx, 0, cz);
    const gt = gantry(); gt.position.set(119.4 - cx, s.h, 0); g.add(gt);
    root.add(g);
    const rp = kerbRamp(); rp.position.set(114, 0, 3.2); root.add(rp);
    return { g, top, gt, rp, h: s.h };
  })();

  // ---------- the line-up: the other four are waiting when the tyre rolls in
  const lineup = (() => {
    const g = new THREE.Group(), items = [];
    [[SKIN.tennis, 168.78, 0], [SKIN.gridiron, 169.3, 1], [SKIN.basketball, 169.98, 0], [SKIN.football, 170.72, 0]].forEach(([sk, x, lie], i) => {
      const c = ball.clone(); c.set(sk); c.mesh.position.set(x, RADIUS[sk], 3.2);
      if (lie) c.mesh.rotation.set(0.25, 0, Math.PI / 2); else c.mesh.rotation.set(0.4 + i, 0.7 * i + 0.3, 0.2);
      g.add(c.mesh); items.push(c.mesh);
    });
    g.visible = false; root.add(g);
    return { g, items };
  })();

  const builds = { court: [mk.carpetMid, mk.carpetOut + 1.2], field: [mk.play3, mk.bbExit], tennis: [mk.d7, mk.kick + 1.6], track: [mk.f3, mk.tnEdge + 1.2] };
  const riseSlab = (o, b) => { const e = easeOut(ramp(b, 0, 0.5)); o.g.position.y = -(1 - e) * (o.h + 0.06); o.g.visible = b > 0.001; };
  const tmpC = new THREE.Color(), white = new THREE.Color('#f1eee6'), red = new THREE.Color(RED);

  return {
    path, marks: mk, root, SLABS,
    // s: story position of the ball; p: extra parameters from the director; t: seconds
    update(s, p, t) {
      const b = path.at(s);
      // --- pitch (built by the intro), flag
      const intro = p.intro ?? 1;
      riseSlab(pitch, intro * 1.0);
      pitch.grass.userData.u.uGrow.value = ramp(intro, 0.3, 0.75); pitch.grass.userData.u.uLine.value = ramp(intro, 0.55, 1) * 1.02; pitch.top.userData.paint.uLine.value = ramp(intro, 0.5, 0.95) * 1.02;
      pitch.flag.scale.y = Math.max(0.001, easeOut(ramp(intro, 0.5, 0.85))); pitch.flag.userData.wave(t);
      pitch.g.visible = s < mk.doorAfter;
      // --- thread
      thread.u.uDraw.value = s < mk.edge - 0.2 ? -1 : b.L + lerp(1.6, 4.2, ramp(s, mk.lineup - 1, mk.lineup));
      field.grass.userData.u.uThread.value = thread.u.uDraw.value / path.total;
      // --- carpet: flashes pop as the ball passes each camera
      let fl = 0;
      flashAt.forEach(f => { let k = 0; f.hits.forEach(h => { const dlt = (s - h) / 0.09; if (dlt > 0) k = Math.max(k, Math.exp(-dlt * 1.4) * (dlt < 0.15 ? dlt / 0.15 : 1)); }); f.sprite.material.opacity = k; f.face.material.color.setScalar(0.8 + k * 6); fl = Math.max(fl, k); });
      tun.visible = rw.visible = s < mk.onCourt + 2; door.visible = s > mk.tunnelOut && s < mk.shoot + 2;
      door.userData.open(0.06 + 0.94 * ease(ramp(s, mk.doorBefore - 0.45, mk.doorBefore + 0.6)));
      // --- hardwood
      const bc = ramp(s, builds.court[0], builds.court[1]); riseSlab(court, bc); court.top.userData.paint.uLine.value = ramp(bc, 0.45, 1) * 1.02;
      court.hp.scale.y = Math.max(0.001, easeOut(ramp(bc, 0.4, 0.9))); court.g.visible = bc > 0.001 && s < mk.d3;
      court.hp.userData.swish(Math.max(0, 1 - Math.abs((s - (mk.rim + 0.5)) / 0.45)));
      // --- field
      const bf = ramp(s, builds.field[0], builds.field[1]); riseSlab(field, bf); field.grass.userData.u.uGrow.value = ramp(bf, 0.35, 0.8);
      field.grass.userData.u.uLine.value = ramp(bf, 0.5, 1) * 1.02; field.top.userData.paint.uLine.value = ramp(bf, 0.45, 0.95) * 1.02;
      field.gp.scale.y = Math.max(0.001, easeOut(ramp(bf, 0.45, 1))); field.g.visible = bf > 0.001 && s < mk.court;
      const rule = p.rule ?? -1, tokIn = p.tokens ?? 0;
      field.tk.forEach((tk, i) => {
        const e = easeOut(clamp(tokIn * 1.6 - i * 0.055, 0, 1)), act = clamp(1 - Math.abs(rule - i), 0, 1);
        tk.visible = e > 0.001; tk.scale.setScalar(Math.max(0.001, e) * (1 + act * 0.25)); tk.position.y = tk.userData.home.y + act * 0.22 + (1 - e) * 0.4;
        tmpC.copy(white).lerp(red, act); tk.userData.side.color.copy(tmpC); tk.userData.top.color.copy(tmpC);
      });
      // --- tennis
      const bt = ramp(s, builds.tennis[0], builds.tennis[1]); riseSlab(tennis, bt); tennis.g.visible = bt > 0.001 && s < mk.grid + 1;
      const c = p.court ?? 0; tennis.setCourt(c, ease(ramp(bt, 0.45, 1)));
      tennis.u.uPadel.value = ramp(c, 1.05, 1.95); tennis.dm.opacity = clamp(1 - Math.abs(c - 1) * 1.7, 0, 1) * 0.6; tennis.delta.visible = tennis.dm.opacity > 0.01;
      const ns = lerp(1, 10 / 12.8, ramp(c, 1.1, 1.9)); tennis.net.scale.set(1, easeOut(ramp(bt, 0.5, 0.95)) * lerp(1, 0.94, ramp(c, 1.1, 1.9)) + 0.0001, ns);
      tennis.cage.userData.rise(p.walls ?? 0);
      // --- track
      const bk = ramp(s, builds.track[0], builds.track[1]); riseSlab(track, bk); track.top.userData.paint.uLine.value = ramp(bk, 0.4, 1) * 1.02;
      track.gt.scale.y = Math.max(0.001, easeOut(ramp(bk, 0.5, 1))); track.g.visible = bk > 0.001; track.rp.visible = bk > 0.3; track.rp.scale.y = Math.max(0.001, easeOut(ramp(bk, 0.3, 0.7)));
      track.gt.userData.lights(p.lights ?? 0);
      lineup.g.visible = s > mk.pitEnd;
      return { ball: b, flash: fl };
    },
  };
}
