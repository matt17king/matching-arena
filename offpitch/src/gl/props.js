// Set pieces. Everything is plain geometry with honest materials: concrete, chrome, velvet, glass, paint.
import * as THREE from 'three';
import { boxM, concreteTex, carpetTex, netTex, diamondNetTex, meshFenceTex, labelTex, glowTex, RED } from './surfaces.js';

const M = {};
export function materials() {
  if (M.chrome) return M;
  M.chrome = new THREE.MeshStandardMaterial({ color: '#dcdcdc', metalness: 1, roughness: 0.14 });
  M.steel = new THREE.MeshStandardMaterial({ color: '#2a2c2f', metalness: 0.85, roughness: 0.42 });
  M.black = new THREE.MeshStandardMaterial({ color: '#111112', roughness: 0.5, metalness: 0.1 });
  M.velvet = new THREE.MeshPhysicalMaterial({ color: '#0d0d0f', roughness: 1, sheen: 1, sheenRoughness: 0.4, sheenColor: new THREE.Color('#5a5a66') });
  M.white = new THREE.MeshStandardMaterial({ color: '#efece4', roughness: 0.55 });
  M.plinth = new THREE.MeshStandardMaterial({ color: '#f3f0e9', roughness: 0.78 });
  M.yellow = new THREE.MeshPhysicalMaterial({ color: '#f0bd12', roughness: 0.38, clearcoat: 0.6, clearcoatRoughness: 0.25 });
  M.red = new THREE.MeshPhysicalMaterial({ color: '#c41d15', roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.3 });
  M.rim = new THREE.MeshStandardMaterial({ color: '#e0431c', roughness: 0.4, metalness: 0.3 });
  M.glass = new THREE.MeshPhysicalMaterial({ color: '#dff0f2', roughness: 0.04, metalness: 0, transparent: true, opacity: 0.16, envMapIntensity: 1.6, depthWrite: false, side: THREE.DoubleSide });
  M.pad = new THREE.MeshStandardMaterial({ color: '#16171a', roughness: 0.7 });
  M.line = new THREE.MeshStandardMaterial({ color: '#f1eee6', roughness: 0.7, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  M.delta = new THREE.MeshStandardMaterial({ color: '#c41d15', roughness: 0.7, transparent: true, opacity: 0, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
  const ct = concreteTex(); M.concrete = new THREE.MeshStandardMaterial({ map: ct.map, normalMap: ct.normalMap, roughness: 0.92, envMapIntensity: 0.55 });
  ct.map.wrapS = ct.map.wrapT = ct.normalMap.wrapS = ct.normalMap.wrapT = THREE.RepeatWrapping;
  const cp = carpetTex(); cp.map.wrapS = cp.map.wrapT = cp.normalMap.wrapS = cp.normalMap.wrapT = THREE.RepeatWrapping; cp.map.repeat.set(11, 2.2); cp.normalMap.repeat.set(11, 2.2);
  M.carpet = new THREE.MeshPhysicalMaterial({ map: cp.map, normalMap: cp.normalMap, color: '#b9b9b9', roughness: 1, sheen: 0.35, sheenRoughness: 0.6, sheenColor: new THREE.Color('#e0625c') });
  M.led = new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 3.1, 2.9) });
  return M;
}
const sh = (m, cast = true, recv = true) => { m.castShadow = cast; m.receiveShadow = recv; return m; };
const box = (w, h, d, mat, x = 0, y = 0, z = 0) => { const m = sh(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)); m.position.set(x, y, z); return m; };
const cyl = (r0, r1, h, mat, x = 0, y = 0, z = 0, seg = 24) => { const m = sh(new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, seg), mat)); m.position.set(x, y, z); return m; };

// corner flag: the cloth is re-shaped a little every frame
export function cornerFlag() {
  const g = new THREE.Group(), m = materials();
  g.add(cyl(0.0125, 0.0125, 1.5, new THREE.MeshStandardMaterial({ color: '#f2efe6', roughness: 0.5 }), 0, 0.75, 0, 12));
  const tex = labelTex((x, w, h) => { x.fillStyle = '#c9201a'; x.fillRect(0, 0, w, h); x.fillStyle = '#fff'; x.font = '700 150px "Instrument Sans Variable", Arial'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('17', w / 2, h / 2 + 8); }, 256, 256);
  const cloth = sh(new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.3, 14, 8), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, side: THREE.DoubleSide })));
  cloth.position.set(0.21, 1.33, 0); cloth.material.shadowSide = THREE.DoubleSide; g.add(cloth);
  const base = cloth.geometry.attributes.position.array.slice();
  g.userData.wave = t => {
    const p = cloth.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = base[i * 3] + 0.21, y = base[i * 3 + 1]; const k = x / 0.42; p.setZ(i, Math.sin(x * 11 - t * 2.6 + y * 3) * 0.035 * k + Math.sin(x * 23 - t * 4.1) * 0.012 * k); p.setY(i, y - k * k * 0.03); }
    p.needsUpdate = true; cloth.geometry.computeVertexNormals();
  };
  return g;
}

// players' tunnel: board-marked concrete with two light strips
export function tunnel(len = 3.6, inner = 2.3, height = 2.35) {
  const g = new THREE.Group(), m = materials(), t = 0.3;
  const wallG = boxM(len, height, t), roofG = boxM(len, t, inner + t * 2);
  [-1, 1].forEach(s => { const w = sh(new THREE.Mesh(wallG, m.concrete)); w.position.set(0, height / 2, s * (inner / 2 + t / 2)); g.add(w); });
  const roof = sh(new THREE.Mesh(roofG, m.concrete)); roof.position.set(0, height + t / 2, 0); g.add(roof);
  [-1, 1].forEach(s => { const l = new THREE.Mesh(new THREE.BoxGeometry(len - 0.3, 0.03, 0.06), m.led); l.position.set(0, height - 0.02, s * (inner / 2 - 0.12)); g.add(l); });
  return g;
}

// red carpet with posts, ropes and the press
export function runway(len = 11, wid = 2.2) {
  const g = new THREE.Group(), m = materials();
  const carpet = sh(new THREE.Mesh(new THREE.BoxGeometry(len, 0.02, wid), m.carpet), false, true); carpet.position.y = 0.01; g.add(carpet);
  const post = () => {
    const p = new THREE.Group();
    p.add(cyl(0.15, 0.16, 0.02, m.chrome, 0, 0.01, 0, 32)); p.add(cyl(0.06, 0.15, 0.03, m.chrome, 0, 0.035, 0, 32));
    p.add(cyl(0.022, 0.022, 0.9, m.chrome, 0, 0.5, 0, 16));
    const top = sh(new THREE.Mesh(new THREE.SphereGeometry(0.042, 20, 14), m.chrome)); top.position.y = 0.97; p.add(top);
    return p;
  };
  const n = 6, step = (len - 1) / (n - 1);
  [-1, 1].forEach(s => {
    const z = s * (wid / 2 + 0.22);
    for (let i = 0; i < n; i++) {
      const x = -len / 2 + 0.5 + i * step, p = post(); p.position.set(x, 0, z); g.add(p);
      if (i < n - 1) {
        const c = new THREE.QuadraticBezierCurve3(new THREE.Vector3(x, 0.9, z), new THREE.Vector3(x + step / 2, 0.52, z), new THREE.Vector3(x + step, 0.9, z));
        g.add(sh(new THREE.Mesh(new THREE.TubeGeometry(c, 20, 0.02, 8), m.velvet)));
      }
    }
  });
  // press cameras on the far side
  const flashes = [], glow = glowTex();
  const cam = (x, z, yaw) => {
    const c = new THREE.Group();
    for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2 + 0.5; const leg = cyl(0.016, 0.012, 1.2, m.black, Math.cos(a) * 0.13, 0.59, Math.sin(a) * 0.13, 8); leg.rotation.z = -Math.cos(a) * 0.22; leg.rotation.x = Math.sin(a) * 0.22; c.add(leg); }
    c.add(cyl(0.016, 0.016, 0.24, m.steel, 0, 1.22, 0, 10));
    const head = new THREE.Group(); head.position.y = 1.4;
    head.add(box(0.15, 0.1, 0.085, m.black)); const lens = cyl(0.04, 0.036, 0.11, m.black, 0, -0.005, 0.09, 24); lens.rotation.x = Math.PI / 2; head.add(lens);
    const glassM = new THREE.MeshPhysicalMaterial({ color: '#0a0d18', roughness: 0.05, metalness: 0.2, clearcoat: 1 }); const gl = cyl(0.033, 0.033, 0.004, glassM, 0, -0.005, 0.146, 24); gl.rotation.x = Math.PI / 2; head.add(gl);
    head.add(box(0.075, 0.05, 0.06, m.black, 0, 0.085, 0.01)); const face = new THREE.Mesh(new THREE.PlaneGeometry(0.066, 0.04), new THREE.MeshBasicMaterial({ color: '#d8d6d0' })); face.position.set(0, 0.085, 0.041); head.add(face);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0, color: new THREE.Color(6, 6, 5.6) })); sp.position.set(0, 0.085, 0.06); sp.scale.setScalar(1.25); head.add(sp);
    head.rotation.x = 0.12; c.add(head); c.position.set(x, 0, z); c.rotation.y = yaw; g.add(c);
    flashes.push({ sprite: sp, face, x });
  };
  cam(-3.6, -1.95, 0.25); cam(-1.2, -2.2, 0.05); cam(1.3, -2.0, -0.12); cam(3.7, -2.25, -0.3);
  g.userData.flashes = flashes;
  return g;
}

// the side door: a plain service door standing on its own, with a lit sign
export function sideDoor() {
  const g = new THREE.Group(), m = materials(), W = 0.94, H = 2.08;
  const frameM = new THREE.MeshPhysicalMaterial({ color: '#cfcabf', roughness: 0.5, clearcoat: 0.3 });
  const leafM = new THREE.MeshPhysicalMaterial({ color: '#121214', roughness: 0.36, clearcoat: 0.55, clearcoatRoughness: 0.2 });
  [-1, 1].forEach(s => g.add(box(0.2, H + 0.1, 0.1, frameM, 0, (H + 0.1) / 2, s * (W / 2 + 0.05))));
  g.add(box(0.2, 0.1, W + 0.2, frameM, 0, H + 0.05, 0)); g.add(box(0.2, 0.014, W, m.chrome, 0, 0.007, 0));
  const hinge = new THREE.Group(); hinge.position.set(0.03, 0, -W / 2); g.add(hinge);
  const leaf = box(0.045, H - 0.012, W - 0.01, leafM, 0, H / 2 + 0.008, W / 2); hinge.add(leaf);
  [-1, 1].forEach(s => { // lever handles and kick plates on both faces
    hinge.add(box(0.004, 0.24, W - 0.08, m.chrome, s * 0.0245, 0.14, W / 2));
    const rose = cyl(0.026, 0.026, 0.012, m.chrome, s * 0.028, 1.02, W - 0.09, 20); rose.rotation.z = Math.PI / 2; hinge.add(rose);
    const stem = cyl(0.009, 0.009, 0.05, m.chrome, s * 0.05, 1.02, W - 0.09, 12); stem.rotation.z = Math.PI / 2; hinge.add(stem);
    hinge.add(box(0.016, 0.016, 0.13, m.chrome, s * 0.07, 1.02, W - 0.145));
  });
  // light box
  const signT = labelTex((x, w, h) => { x.fillStyle = '#fbfaf6'; x.fillRect(0, 0, w, h); x.fillStyle = RED; x.font = '700 104px "Instrument Sans Variable", Arial'; x.textAlign = 'center'; x.textBaseline = 'middle'; try { x.letterSpacing = '14px'; } catch (e) { /* */ } x.fillText('CULTURE', w / 2 + 7, h / 2 + 6); }, 640, 180);
  const sign = new THREE.Group(); sign.position.set(0, H + 0.34, 0);
  sign.add(box(0.07, 0.2, 0.7, m.black));
  [-1, 1].forEach(s => { const f = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.17), new THREE.MeshBasicMaterial({ map: signT, color: new THREE.Color(1.5, 1.5, 1.5) })); f.position.x = s * 0.036; f.rotation.y = s * Math.PI / 2; sign.add(f); });
  sign.add(box(0.02, 0.07, 0.02, m.steel, 0, -0.135, -0.2)); sign.add(box(0.02, 0.07, 0.02, m.steel, 0, -0.135, 0.2));
  g.add(sign);
  g.userData.open = k => { hinge.rotation.y = -k * 1.92; };
  return g;
}

// hoop: post, arm, glass board, rim and net. Origin on the floor under the rim.
export function hoop() {
  const g = new THREE.Group(), m = materials();
  g.add(box(0.22, 3.55, 0.22, m.pad, 2.0, 1.775, 0)); g.add(box(0.7, 0.5, 0.9, m.pad, 2.0, 0.25, 0));
  const arm = box(1.62, 0.14, 0.14, m.steel, 1.2, 3.42, 0); g.add(arm);
  const arm2 = box(1.5, 0.08, 0.08, m.steel, 1.25, 3.0, 0); arm2.rotation.z = 0.5; g.add(arm2);
  const board = new THREE.Mesh(new THREE.BoxGeometry(0.03, 1.07, 1.83), m.glass); board.position.set(0.4, 3.43, 0); board.castShadow = true; board.userData.treatAsOpaque = true; g.add(board);
  const wl = (h, d, y, z) => g.add(box(0.034, h, d, m.white, 0.4, y, z));
  wl(0.05, 1.83, 3.94, 0); wl(0.05, 1.83, 2.92, 0); wl(1.07, 0.05, 3.43, 0.89); wl(1.07, 0.05, 3.43, -0.89);
  wl(0.045, 0.59, 3.5, 0); wl(0.045, 0.59, 3.05, 0); wl(0.45, 0.045, 3.275, 0.295); wl(0.45, 0.045, 3.275, -0.295);
  const rim = sh(new THREE.Mesh(new THREE.TorusGeometry(0.228, 0.011, 12, 48), m.rim)); rim.rotation.x = Math.PI / 2; rim.position.set(0, 3.05, 0); g.add(rim);
  g.add(box(0.17, 0.02, 0.12, m.rim, 0.31, 3.045, 0));
  const netG = new THREE.CylinderGeometry(0.226, 0.13, 0.42, 32, 6, true);
  const net = new THREE.Mesh(netG, new THREE.MeshStandardMaterial({ map: diamondNetTex(), alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.9 })); net.position.set(0, 2.84, 0); net.castShadow = true; g.add(net);
  const base = netG.attributes.position.array.slice();
  g.userData.swish = k => { // the net kicks out as the ball drops through
    const p = netG.attributes.position;
    for (let i = 0; i < p.count; i++) { const y = base[i * 3 + 1], low = 0.5 - y / 0.42; const s = 1 + k * low * 0.55; p.setX(i, base[i * 3] * s); p.setZ(i, base[i * 3 + 2] * s); p.setY(i, y - k * low * 0.06); }
    p.needsUpdate = true;
  };
  return g;
}

// goalposts. Origin on the turf at the centre of the end line.
export function goalposts(height = 7.5) {
  const g = new THREE.Group(), m = materials();
  const neck = new THREE.CatmullRomCurve3([new THREE.Vector3(1.6, 0, 0), new THREE.Vector3(1.6, 1.6, 0), new THREE.Vector3(1.45, 2.6, 0), new THREE.Vector3(0.7, 3.02, 0), new THREE.Vector3(0, 3.05, 0)]);
  g.add(sh(new THREE.Mesh(new THREE.TubeGeometry(neck, 40, 0.085, 16), m.yellow)));
  g.add(cyl(0.24, 0.24, 1.8, m.pad, 1.6, 0.9, 0, 24));
  const bar = cyl(0.07, 0.07, 5.64, m.yellow, 0, 3.05, 0, 16); bar.rotation.x = Math.PI / 2; g.add(bar);
  [-1, 1].forEach(s => g.add(cyl(0.05, 0.06, height, m.yellow, 0, 3.05 + height / 2, s * 2.82, 16)));
  return g;
}

// eleven numbered markers for the talent rules
export function tokens(n = 11) {
  const list = [];
  for (let i = 0; i < n; i++) {
    const t = labelTex((x, w, h) => { x.fillStyle = '#f4f1ea'; x.fillRect(0, 0, w, h); x.fillStyle = '#141412'; x.font = '700 120px "Instrument Sans Variable", Arial'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(i + 1).padStart(2, '0'), w / 2, h / 2 + 8); }, 256, 256);
    const side = new THREE.MeshPhysicalMaterial({ color: '#f1eee6', roughness: 0.4, clearcoat: 0.5 }), top = new THREE.MeshPhysicalMaterial({ map: t, roughness: 0.4, clearcoat: 0.5 });
    const d = sh(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.07, 48), [side, top, side]));
    d.rotation.y = Math.PI / 2; d.userData = { side, top }; list.push(d);
  }
  return list;
}

// tennis net with posts; scales down for padel
export function tennisNet(span = 12.8) {
  const g = new THREE.Group(), m = materials(), t = netTex(96, 8);
  const net = new THREE.Mesh(new THREE.PlaneGeometry(span, 0.94), new THREE.MeshStandardMaterial({ map: t, alphaTest: 0.35, side: THREE.DoubleSide, roughness: 1 })); net.rotation.y = Math.PI / 2; net.position.y = 0.47; net.castShadow = true; g.add(net);
  g.add(box(0.012, 0.06, span, m.white, 0, 0.955, 0));
  [-1, 1].forEach(s => g.add(cyl(0.04, 0.04, 1.07, m.steel, 0, 0.535, s * span / 2, 16)));
  g.add(box(0.012, 0.92, 0.05, m.white, 0, 0.46, 0));
  return g;
}

// padel cage: glass at the ends, steel mesh along the sides. Each panel rises on its own.
export function padelCage(L = 20, Wd = 10) {
  const g = new THREE.Group(), m = materials(), panels = [];
  const fence = meshFenceTex();
  const meshM = (rx, ry) => { const t = fence.clone(); t.repeat.set(rx * 2.5, ry * 2.5); t.needsUpdate = true; return new THREE.MeshStandardMaterial({ map: t, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.6, metalness: 0.6 }); };
  const panel = (len, h, x, z, ry, glass, order) => {
    const p = new THREE.Group(); p.position.set(x, 0, z); p.rotation.y = ry;
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(len - 0.06, h), glass ? m.glass : meshM(len / 2, h / 2)); pane.position.y = h / 2; pane.castShadow = !glass; pane.userData.treatAsOpaque = true; p.add(pane);
    p.add(box(0.06, h + 0.04, 0.06, m.steel, -len / 2, (h + 0.04) / 2, 0)); p.add(box(0.06, h + 0.04, 0.06, m.steel, len / 2, (h + 0.04) / 2, 0)); p.add(box(len, 0.05, 0.05, m.steel, 0, h + 0.02, 0));
    p.userData.order = order; panels.push(p); g.add(p);
  };
  const seg = 2;
  for (let i = 0; i < Wd / seg; i++) { const z = -Wd / 2 + seg / 2 + i * seg; panel(seg, 3, -L / 2, z, Math.PI / 2, true, i * 0.05); panel(seg, 3, L / 2, z, Math.PI / 2, true, 0.3 + i * 0.05); }
  for (let i = 0; i < L / seg; i++) {
    const x = -L / 2 + seg / 2 + i * seg, corner = i < 2 || i >= L / seg - 2, door = Math.abs(x) < 1.1;
    if (door) continue;
    [-1, 1].forEach(s => panel(seg, 3, x, s * Wd / 2, 0, corner, 0.15 + Math.abs(x) / L * 0.6));
  }
  g.userData.rise = k => panels.forEach(p => { const e = THREE.MathUtils.clamp((k - p.userData.order * 0.6) / 0.4, 0, 1); const s = 1 - Math.pow(1 - e, 3); p.scale.y = Math.max(0.0001, s); p.visible = e > 0.001; });
  return g;
}

// start lights over the grid. Origin on the track under the centre of the beam.
export function gantry(width = 8.6) {
  const g = new THREE.Group(), m = materials(), lamps = [];
  [-1, 1].forEach(s => g.add(box(0.2, 4.5, 0.2, m.steel, 0, 2.25, s * width / 2)));
  g.add(box(0.26, 0.3, width + 0.2, m.steel, 0, 4.5, 0));
  for (let i = 0; i < 5; i++) {
    const z = (i - 2) * 0.62; g.add(box(0.2, 0.74, 0.4, m.black, -0.02, 3.92, z));
    const mat = new THREE.MeshBasicMaterial({ color: '#1a0605' }), row = [];
    [0.16, -0.16].forEach(y => { const l = new THREE.Mesh(new THREE.CircleGeometry(0.13, 28), mat); l.position.set(-0.125, 3.92 + y, z); l.rotation.y = -Math.PI / 2; g.add(l); row.push(l); });
    lamps.push(mat);
  }
  const on = new THREE.Color(1.9, 0.04, 0.025), off = new THREE.Color('#1a0605');
  g.userData.lights = k => lamps.forEach((mat, i) => mat.color.copy(k > i + 0.5 ? on : off));
  return g;
}

// ramp up onto the tarmac, painted like a kerb
export function kerbRamp(len = 3, wid = 1.6, rise = 0.3) {
  const tex = labelTex((x, w, h) => { for (let i = 0; i < 12; i++) { x.fillStyle = i % 2 ? '#e6e3db' : '#b81a13'; x.fillRect((i / 12) * w, 0, w / 12 + 1, h); } }, 512, 64);
  const g = new THREE.BufferGeometry(), w2 = wid / 2;
  const v = [0, 0, w2, len, rise, w2, len, rise, -w2, 0, 0, -w2, 0, 0, w2, len, 0, w2, len, rise, w2, 0, 0, -w2, len, rise, -w2, len, 0, -w2];
  const uv = [0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 1, 0];
  g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 7, 8, 9]); g.computeVertexNormals();
  const m = sh(new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, side: THREE.DoubleSide }))); m.material.shadowSide = THREE.DoubleSide;
  return m;
}

export function plinth(w = 4.4, h = 0.5, d = 1.2) { const m = materials(); return box(w, h, d, m.plinth, 0, h / 2, 0); }
export { box, cyl };
