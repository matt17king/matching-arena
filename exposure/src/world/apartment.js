// The penthouse: one open room above London, cut away on the two near sides so it can be seen from the corner.
// Everything is measured in metres. x runs down-screen to the right, z down-screen to the left, y is up.
// The room is x -8..7.4, z -6..5. The window wall is x = -8 (terrace beyond it); the kitchen and desk wall is z = -6.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const H = 3.1; // ceiling height
const lerp = (a, b, t) => a + (b - a) * t;

export function buildApartment(T, { shadowSize = 4096 } = {}) {
  const world = new THREE.Group();
  let seed = 7; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;

  /* ---------- materials */
  const std = o => new THREE.MeshStandardMaterial(o);
  const M = {
    marble: std({ map: T.marble, roughness: 0.2 }),
    nero: std({ map: T.nero, roughness: 0.18 }),
    oak: std({ map: T.oak, roughness: 0.5 }),
    wall: std({ color: 0xefede8, roughness: 0.92 }),
    cut: std({ color: 0xf6f5f2, roughness: 0.9 }),
    slab: std({ color: 0xcfccc6, roughness: 0.9 }),
    cab: std({ color: 0x1b1a1c, roughness: 0.55 }),
    cabFront: std({ color: 0x252326, roughness: 0.42 }),
    gloss: std({ color: 0x08080a, roughness: 0.08, metalness: 0.3 }),
    brass: std({ color: 0xb69462, roughness: 0.32, metalness: 1 }),
    steel: std({ color: 0xc8ccd2, roughness: 0.22, metalness: 1 }),
    black: std({ color: 0x0e0e10, roughness: 0.45, metalness: 0.5 }),
    blue: std({ color: 0x6f8cab, map: T.wool, roughness: 0.95 }),
    grey: std({ color: 0x8a8f96, map: T.wool, roughness: 0.95 }),
    sofa: std({ color: 0xdedad2, map: T.wool, roughness: 1 }),
    sky: std({ color: 0xb6dff8, map: T.wool, roughness: 0.95 }),
    poppy: std({ color: 0xe20b21, map: T.wool, roughness: 0.9 }),
    apple: std({ color: 0xd3122a, roughness: 0.35 }),
    coal: std({ color: 0x2b2c30, map: T.wool, roughness: 0.95 }),
    rug: std({ map: T.rug, roughness: 1 }),
    walnut: std({ color: 0x5b3d2a, roughness: 0.5 }),
    deck: std({ color: 0x55585d, roughness: 0.85 }),
    stone: std({ color: 0xd8d6d1, roughness: 0.9 }),
    leaf: std({ color: 0x2c5a3a, roughness: 0.85 }),
    white: std({ color: 0xf4f3f0, roughness: 0.4 }),
    alu: std({ color: 0xb9bcc2, roughness: 0.35, metalness: 0.9 }),
    paper: std({ color: 0xf1efe9, roughness: 0.8 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0xbfe0f4, roughness: 0.04, metalness: 0, transparent: true, opacity: 0.1, depthWrite: false }),
    art: std({ map: T.art, roughness: 0.7 }),
    screen: std({ color: 0x050505, roughness: 0.3, emissive: 0xffffff, emissiveMap: T.screen, emissiveIntensity: 0.9 }),
    // light you can see: pendant shades and lamps (warm, lights on), LED strips (the site's blue and red, lights off)
    warm: std({ color: 0xf3e3c7, roughness: 0.7, emissive: 0xffc98a, emissiveIntensity: 1.6, side: THREE.DoubleSide }),
    bulb: std({ color: 0xffffff, emissive: 0xffe2b8, emissiveIntensity: 3 }),
    ledBlue: std({ color: 0x1a1a1c, roughness: 0.6, emissive: 0x57b3ee, emissiveIntensity: 0 }),
    ledRed: std({ color: 0x1a1a1c, roughness: 0.6, emissive: 0xe20b21, emissiveIntensity: 0 }),
    city: new THREE.MeshBasicMaterial({ map: T.windows, color: 0xb4b4b4 }),
    cityB: new THREE.MeshBasicMaterial({ map: T.windowsB, color: 0xb4b4b4 }),
    cityDark: new THREE.MeshBasicMaterial({ color: 0x0a0d13 }),
    roof: new THREE.MeshBasicMaterial({ color: 0x1b2330 }),
    facade: new THREE.MeshBasicMaterial({ map: T.facade }),
    eye: new THREE.MeshBasicMaterial({ color: 0x6fb6e6 }),
    beacon: new THREE.MeshBasicMaterial({ color: 0xe20b21 }),
  };

  /* ---------- helpers. y is always the underside of the thing, so furniture can be stood on the floor at y = 0 */
  // box UVs in metres, so a texture keeps its scale whatever the size of the surface
  function metreUV(geo, w, h, d, m) {
    const uv = geo.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]], ox = rnd(), oy = rnd();
    for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) { const k = f * 4 + i; uv.setXY(k, uv.getX(k) * dims[f][0] / m + ox, uv.getY(k) * dims[f][1] / m + oy); }
  }
  function put(mesh, parent, shadow = true) { mesh.castShadow = shadow; mesh.receiveShadow = shadow; (parent || world).add(mesh); return mesh; }
  function box(w, h, d, mat, x, y, z, o = {}) {
    const g = o.r ? new RoundedBoxGeometry(w, h, d, 3, Math.min(o.r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001)) : new THREE.BoxGeometry(w, h, d);
    if (o.m) metreUV(g, w, h, d, o.m);
    const mesh = new THREE.Mesh(g, mat); mesh.position.set(x, y + h / 2, z); if (o.ry) mesh.rotation.y = o.ry; if (o.rx) mesh.rotation.x = o.rx; if (o.rz) mesh.rotation.z = o.rz;
    return put(mesh, o.in, o.shadow !== false);
  }
  function cyl(rt, rb, h, mat, x, y, z, o = {}) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, o.seg || 28, 1, !!o.open), mat); mesh.position.set(x, y + h / 2, z);
    if (o.rx) mesh.rotation.x = o.rx; if (o.rz) mesh.rotation.z = o.rz; return put(mesh, o.in, o.shadow !== false);
  }
  function ball(r, mat, x, y, z, o = {}) { const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, o.seg || 20, o.seg ? o.seg : 14), mat); mesh.position.set(x, y, z); if (o.s) mesh.scale.set(...o.s); return put(mesh, o.in, o.shadow !== false); }
  function group(x, z, ry = 0, parent) { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; (parent || world).add(g); return g; }

  /* ---------- the shell: floor, walls, glazing, terrace */
  box(18.9, 0.5, 11.4, M.slab, -1.85, -0.54, -0.5);                                   // the slab the whole floor sits on
  box(15.4, 0.04, 11, M.oak, -0.3, -0.04, -0.5, { m: 3.84 });                             // herringbone oak
  box(8.7, 0.046, 1.7, M.nero, 3.05, -0.04, -5.15, { m: 5 });                     // black marble in front of the kitchen run
  box(3.2, 0.04, 11.2, M.deck, -9.7, -0.04, -0.5);                                   // terrace
  box(15.9, H, 0.2, M.wall, -0.35, 0, -6.1, { shadow: false }).receiveShadow = true; // kitchen and desk wall
  box(15.6, 0.1, 0.2, M.cut, -0.3, 0, 5.1); box(0.2, 0.1, 11.4, M.cut, 7.5, 0, -0.5);   // the two near walls, cut at the skirting
  // window wall: a black frame and floor-to-ceiling glass
  box(0.16, 0.22, 11.2, M.black, -8.05, H - 0.22, -0.5, { shadow: false }); box(0.16, 0.05, 11.2, M.black, -8.05, 0, -0.5, { shadow: false });
  for (let z = -6; z <= 5.01; z += 2.2) box(0.09, H - 0.2, 0.09, M.black, -8.05, 0, z, { shadow: false });
  box(0.02, H - 0.27, 11, M.glass, -8.05, 0.05, -0.5, { shadow: false });
  // glass balustrade and its handrail
  box(0.02, 1.05, 11.2, M.glass, -11.25, 0, -0.5, { shadow: false }); box(0.05, 0.035, 11.2, M.steel, -11.25, 1.05, -0.5, { shadow: false });
  box(3.2, 1.05, 0.02, M.glass, -9.7, 0, -6.1, { shadow: false }); box(3.2, 1.05, 0.02, M.glass, -9.7, 0, 5.1, { shadow: false });

  /* ---------- kitchen: tall units, then a run of drawers under marble, wall units above */
  const KZ = -5.675, KF = -5.34; // centre line of the units, and the plane of their fronts
  box(3.0, 2.5, 0.65, M.cab, 0.9, 0, KZ);
  for (let i = 0; i < 5; i++) {
    const x = -0.3 + i * 0.6;
    if (i === 2 || i === 3) { box(0.57, 0.86, 0.02, M.cabFront, x, 0.05, KF); box(0.57, 0.66, 0.02, M.cabFront, x, 1.81, KF); box(0.5, 0.4, 0.025, M.gloss, x, 0.96, KF); box(0.5, 0.4, 0.025, M.gloss, x, 1.38, KF); box(0.42, 0.012, 0.03, M.steel, x, 1.33, KF + 0.02); box(0.42, 0.012, 0.03, M.steel, x, 1.75, KF + 0.02); }
    else { box(0.57, 2.42, 0.02, M.cabFront, x, 0.05, KF); box(0.014, 0.6, 0.03, M.brass, x + (i < 2 ? 0.22 : -0.22), 0.95, KF + 0.02); }
  }
  box(4.9, 0.88, 0.65, M.cab, 4.85, 0, KZ);
  for (let j = 0; j < 7; j++) for (let k = 0; k < 3; k++) { const x = 2.75 + j * 0.7, y = 0.07 + k * 0.268; box(0.67, 0.25, 0.02, M.cabFront, x, y, KF); box(0.4, 0.012, 0.026, M.brass, x, y + 0.2, KF + 0.02); }
  box(4.96, 0.04, 0.72, M.marble, 4.85, 0.88, KZ + 0.02, { m: 2.6 });
  box(4.9, 0.64, 0.02, M.marble, 4.85, 0.92, -5.99, { m: 2.6 });
  box(4.9, 0.9, 0.36, M.cab, 4.85, 1.56, -5.82);
  for (let j = 0; j < 7; j++) box(0.67, 0.86, 0.02, M.cabFront, 2.75 + j * 0.7, 1.58, -5.63);
  box(4.8, 0.012, 0.03, M.ledBlue, 4.85, 1.548, -5.68, { shadow: false });
  box(0.8, 0.008, 0.5, M.gloss, 5.1, 0.92, KZ);                                    // hob
  box(0.24, 0.34, 0.3, M.steel, 6.85, 0.92, KZ - 0.05, { r: 0.03 }); cyl(0.06, 0.06, 0.2, M.white, 6.25, 0.92, KZ); cyl(0.05, 0.05, 0.26, M.black, 6.45, 0.92, KZ - 0.1);

  /* ---------- the island: one block of marble, four stools, two pendants */
  const IX = 3.4, IZ = -2.3;
  box(4.5, 0.08, 1.24, M.cab, IX, 0, IZ);
  box(4.8, 0.87, 1.5, M.marble, IX, 0.08, IZ, { m: 2.6 });
  box(4.7, 0.014, 0.02, M.ledBlue, IX, 0.062, IZ + 0.68, { shadow: false }); box(4.7, 0.014, 0.02, M.ledBlue, IX, 0.062, IZ - 0.68, { shadow: false }); box(0.02, 0.014, 1.38, M.ledBlue, IX + 2.33, 0.062, IZ, { shadow: false });
  box(0.56, 0.012, 0.42, M.black, IX - 1.35, 0.95, IZ - 0.12, { r: 0.004 }); box(0.5, 0.004, 0.36, M.gloss, IX - 1.35, 0.96, IZ - 0.12);
  cyl(0.016, 0.016, 0.3, M.steel, IX - 1.35, 0.95, IZ - 0.42); cyl(0.014, 0.014, 0.2, M.steel, IX - 1.35, 1.24, IZ - 0.33, { rx: Math.PI / 2 }).position.y = 1.25; cyl(0.014, 0.014, 0.06, M.steel, IX - 1.35, 1.19, IZ - 0.24);
  // a bowl of apples, the one bright red thing in the room with the lights on
  { const g = group(IX + 0.95, IZ + 0.05); const bowl = new THREE.Mesh(new THREE.LatheGeometry([[0.07, 0], [0.19, 0.03], [0.26, 0.1], [0.275, 0.13], [0.255, 0.13], [0.18, 0.05], [0, 0.03]].map(p => new THREE.Vector2(p[0], p[1])), 36), M.white); bowl.position.y = 0.95; put(bowl, g);
    [[0, 0], [0.1, 0.03], [-0.09, 0.05], [0.02, -0.11], [-0.05, -0.08], [0.11, -0.07], [0, 0.11], [0.03, 0.01]].forEach(([x, z], i) => ball(0.052, M.apple, x, 1.03 + (i === 7 ? 0.07 : 0), z, { in: g })); }
  function stool(x, z, ry) {
    const g = group(x, z, ry), hw = 0.21;
    [[-hw, -hw], [hw, -hw], [-hw, hw], [hw, hw]].forEach(([a, b]) => box(0.035, 0.66, 0.035, M.black, a, 0, b, { in: g }));
    box(0.46, 0.025, 0.025, M.black, 0, 0.22, hw, { in: g }); box(0.46, 0.025, 0.025, M.black, 0, 0.22, -hw, { in: g });
    box(0.5, 0.13, 0.5, M.blue, 0, 0.64, 0, { in: g, r: 0.05 });
    box(0.52, 0.4, 0.1, M.blue, 0, 0.72, 0.23, { in: g, r: 0.045, rx: 0.1 });
    box(0.09, 0.24, 0.34, M.blue, -0.235, 0.72, 0.08, { in: g, r: 0.04 }); box(0.09, 0.24, 0.34, M.blue, 0.235, 0.72, 0.08, { in: g, r: 0.04 });
  }
  [-1.6, -0.53, 0.53, 1.6].forEach((o, i) => stool(IX + o, IZ + 1.12, (i - 1.5) * 0.05));
  box(3.2, 0.035, 0.06, M.black, IX, H - 0.06, IZ, { shadow: false });
  const pendants = [IX - 1.0, IX + 1.0].map(x => {
    cyl(0.005, 0.005, H - 0.06 - 2.36, M.black, x, 2.36, IZ, { shadow: false, seg: 6 });
    cyl(0.05, 0.3, 0.28, M.warm, x, 2.08, IZ, { open: true, shadow: false, seg: 40 }); cyl(0.05, 0.05, 0.02, M.black, x, 2.36, IZ, { shadow: false });
    ball(0.045, M.bulb, x, 2.17, IZ, { shadow: false }); return new THREE.Vector3(x, 1.95, IZ);
  });

  /* ---------- dining: a dark stone table, six chairs, a bar of light over it */
  const DX = 3.3, DZ = 2.85;
  box(3.1, 0.06, 1.15, M.nero, DX, 0.7, DZ, { m: 5, r: 0.012 }); box(0.1, 0.7, 0.86, M.black, DX - 1.15, 0, DZ); box(0.1, 0.7, 0.86, M.black, DX + 1.15, 0, DZ); box(2.2, 0.06, 0.08, M.black, DX, 0.1, DZ);
  function chair(x, z, ry, mat = M.grey) {
    const g = group(x, z, ry), hw = 0.2;
    [[-hw, -hw], [hw, -hw], [-hw, hw], [hw, hw]].forEach(([a, b]) => box(0.035, 0.42, 0.035, M.black, a, 0, b, { in: g }));
    box(0.5, 0.12, 0.5, mat, 0, 0.4, 0, { in: g, r: 0.05 }); box(0.52, 0.42, 0.1, mat, 0, 0.46, 0.23, { in: g, r: 0.045, rx: 0.12 });
    box(0.085, 0.2, 0.36, mat, -0.235, 0.47, 0.06, { in: g, r: 0.04 }); box(0.085, 0.2, 0.36, mat, 0.235, 0.47, 0.06, { in: g, r: 0.04 });
  }
  [-1, 0, 1].forEach(i => { chair(DX + i * 0.95, DZ + 0.82, i * 0.04); chair(DX + i * 0.95, DZ - 0.82, Math.PI + i * 0.05); });
  cyl(0.16, 0.11, 0.07, M.black, DX - 0.5, 0.76, DZ, { seg: 32 }); cyl(0.045, 0.06, 0.26, M.white, DX + 0.45, 0.76, DZ + 0.1);
  box(2.1, 0.05, 0.07, M.black, DX, 1.72, DZ, { shadow: false }); box(2.0, 0.012, 0.045, M.warm, DX, 1.708, DZ, { shadow: false });
  [-0.9, 0.9].forEach(o => cyl(0.004, 0.004, H - 1.77, M.black, DX + o, 1.77, DZ, { shadow: false, seg: 6 })); box(2.0, 0.03, 0.06, M.black, DX, H - 0.05, DZ, { shadow: false });

  /* ---------- lounge: an L of sofa facing the room, rug, tables, an armchair, a lamp */
  box(4.9, 0.022, 3.7, M.rug, -4.25, 0, 2.3, { m: 1.2, r: 0.01 });
  const SO = { r: 0.07 };
  box(1.0, 0.36, 3.95, M.sofa, -6.4, 0.07, 2.025, SO); box(2.3, 0.36, 1.0, M.sofa, -4.75, 0.07, 0.55, SO);                       // bases
  box(0.3, 0.52, 3.95, M.sofa, -6.9, 0.36, 2.025, { r: 0.1 }); box(3.3, 0.52, 0.3, M.sofa, -5.25, 0.36, 0.05, { r: 0.1 });       // backs
  box(1.0, 0.24, 0.26, M.sofa, -6.4, 0.42, 4.02, { r: 0.09 }); box(0.26, 0.24, 1.0, M.sofa, -3.6, 0.42, 0.55, { r: 0.09 });      // arms
  [1.15, 2.1, 3.05].forEach(z => box(0.72, 0.15, 0.92, M.sofa, -6.3, 0.42, z + 0.25, { r: 0.06 }));
  [-5.45, -4.5].forEach(x => box(0.92, 0.15, 0.72, M.sofa, x + 0.2, 0.42, 0.62, { r: 0.06 })); box(0.78, 0.15, 0.78, M.sofa, -6.34, 0.42, 0.6, { r: 0.06 });
  [[-6.62, 1.3, M.sky, 0.3], [-6.64, 2.5, M.coal, -0.2], [-6.6, 3.5, M.poppy, 0.25]].forEach(([x, z, m, a]) => box(0.14, 0.42, 0.46, m, x, 0.56, z, { r: 0.065, rz: -0.28, ry: a * 0.4 }));
  [[-5.3, 0.32, M.coal], [-4.2, 0.3, M.sky]].forEach(([x, z, m]) => box(0.46, 0.42, 0.14, m, x, 0.56, z, { r: 0.065, rx: 0.28 }));
  [-6.82, -6.82, -5.98, -5.98].forEach((x, i) => cyl(0.02, 0.02, 0.07, M.black, x, 0, i % 2 ? 0.2 : 3.9));
  // two round tables, one marble, one black; magazines on the larger
  cyl(0.62, 0.62, 0.045, M.marble, -4.35, 0.33, 2.55, { seg: 56 }); cyl(0.5, 0.5, 0.33, M.black, -4.35, 0, 2.55, { seg: 40, open: true });
  cyl(0.4, 0.4, 0.04, M.gloss, -3.55, 0.43, 3.2, { seg: 48 }); cyl(0.3, 0.3, 0.43, M.black, -3.55, 0, 3.2, { seg: 32, open: true });
  [[M.paper, 0], [M.poppy, 0.18], [M.coal, -0.12], [M.sky, 0.3]].forEach(([m, a], i) => box(0.3, 0.012, 0.22, m, -4.45, 0.375 + i * 0.013, 2.42, { ry: a }));
  cyl(0.1, 0.07, 0.05, M.black, -4.05, 0.375, 2.8, { seg: 28 });
  // armchair, turned to face the sofa
  { const g = group(-2.15, 3.75, -Math.PI / 2 - 0.35); box(0.86, 0.3, 0.84, M.blue, 0, 0.1, 0, { in: g, r: 0.09 }); box(0.86, 0.5, 0.22, M.blue, 0, 0.36, 0.33, { in: g, r: 0.1, rx: 0.16 });
    box(0.2, 0.3, 0.8, M.blue, -0.36, 0.36, 0, { in: g, r: 0.09 }); box(0.2, 0.3, 0.8, M.blue, 0.36, 0.36, 0, { in: g, r: 0.09 }); box(0.5, 0.12, 0.52, M.blue, 0, 0.38, -0.05, { in: g, r: 0.05 });
    [[-0.34, -0.34], [0.34, -0.34], [-0.34, 0.34], [0.34, 0.34]].forEach(([a, b]) => cyl(0.02, 0.016, 0.1, M.black, a, 0, b, { in: g })); }
  // floor lamp in the corner by the window
  cyl(0.16, 0.16, 0.02, M.black, -7.25, 0, 4.55, { seg: 32 }); cyl(0.012, 0.012, 1.5, M.black, -7.25, 0.02, 4.55); cyl(0.17, 0.21, 0.3, M.warm, -7.25, 1.5, 4.55, { open: true, shadow: false, seg: 36 }); ball(0.04, M.bulb, -7.25, 1.62, 4.55, { shadow: false });
  box(4.0, 0.016, 0.03, M.ledRed, -7.1, 0.03, 2.0, { shadow: false, ry: Math.PI / 2 });                                            // behind the sofa
  box(3.3, 0.016, 0.03, M.ledRed, -5.25, 0.03, -0.13, { shadow: false });

  function plant(x, z, s = 1, pot = M.stone) {
    const g = group(x, z); cyl(0.2 * s, 0.15 * s, 0.4 * s, pot, 0, 0, 0, { in: g, seg: 24 }); cyl(0.015, 0.02, 0.6 * s, M.walnut, 0, 0.38 * s, 0, { in: g, seg: 8 });
    for (let i = 0; i < 9; i++) { const a = rnd() * 6.283, r = (0.12 + rnd() * 0.24) * s, y = (0.75 + rnd() * 0.75) * s; ball((0.2 + rnd() * 0.14) * s, M.leaf, Math.cos(a) * r, y, Math.sin(a) * r, { in: g, s: [1, 0.8 + rnd() * 0.3, 1], seg: 10 }); }
  }
  plant(-7.35, -0.75, 1.05); plant(6.6, 4.25, 1.25, M.black);

  /* ---------- the desk: walnut on black, shelves over it, the brand as a painting beside them */
  const KX = -4.5, KDZ = -5.42;
  box(2.5, 0.05, 0.82, M.walnut, KX, 0.72, KDZ, { r: 0.01 });
  [-1.15, 1.15].forEach(o => { box(0.04, 0.72, 0.04, M.black, KX + o, 0, KDZ + 0.34); box(0.04, 0.72, 0.04, M.black, KX + o, 0, KDZ - 0.34); box(0.04, 0.04, 0.68, M.black, KX + o, 0.68, KDZ); });
  box(0.5, 0.42, 0.7, M.cab, KX + 0.85, 0.28, KDZ); [0.3, 0.44, 0.58].forEach(y => box(0.3, 0.01, 0.02, M.brass, KX + 0.85, y, KDZ + 0.36));
  // desk chair, pushed back a little
  { const g = group(KX - 0.15, KDZ + 1.0, 0.12); cyl(0.3, 0.3, 0.03, M.black, 0, 0, 0, { in: g, seg: 5 }); cyl(0.03, 0.03, 0.4, M.steel, 0, 0.03, 0, { in: g });
    box(0.52, 0.11, 0.5, M.coal, 0, 0.43, 0, { in: g, r: 0.05 }); box(0.5, 0.52, 0.09, M.coal, 0, 0.56, 0.24, { in: g, r: 0.04, rx: 0.13 }); }
  // the MacBook, open, with this site on it
  const mac = group(KX - 0.2, KDZ + 0.02, -0.14);
  box(0.4, 0.014, 0.27, M.alu, 0, 0.77, 0.03, { in: mac, r: 0.006 }); box(0.33, 0.002, 0.13, M.black, 0, 0.784, -0.01, { in: mac, shadow: false }); box(0.13, 0.002, 0.075, M.steel, 0, 0.784, 0.115, { in: mac, shadow: false });
  { const lid = new THREE.Group(); lid.position.set(0, 0.784, -0.1); lid.rotation.x = -0.3; mac.add(lid);
    box(0.4, 0.26, 0.01, M.alu, 0, 0, -0.005, { in: lid, r: 0.004 }); const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.376, 0.236), M.screen); scr.position.set(0, 0.13, 0.0006); lid.add(scr); }
  box(0.2, 0.012, 0.28, M.paper, KX + 0.5, 0.77, KDZ + 0.05, { ry: 0.2 }); cyl(0.04, 0.035, 0.09, M.white, KX - 0.75, 0.77, KDZ + 0.15); cyl(0.07, 0.07, 0.008, M.white, KX - 0.75, 0.77, KDZ + 0.15);
  cyl(0.08, 0.09, 0.02, M.black, KX + 0.95, 0.77, KDZ - 0.22); cyl(0.008, 0.008, 0.42, M.black, KX + 0.95, 0.79, KDZ - 0.22); cyl(0.05, 0.085, 0.1, M.warm, KX + 0.85, 1.17, KDZ - 0.16, { open: true, shadow: false, rz: -0.5 });
  [1.5, 1.98].forEach(y => box(2.5, 0.04, 0.26, M.walnut, KX, y, -5.87));
  box(2.4, 0.012, 0.025, M.ledRed, KX, 1.488, -5.8, { shadow: false });
  { const tones = [M.coal, M.paper, M.sky, M.poppy, M.walnut, M.grey, M.white, M.black];
    [1.54, 2.02].forEach((y, row) => { let x = KX - 1.15; while (x < KX + 1.1) { const w = 0.03 + rnd() * 0.04, h = 0.2 + rnd() * 0.1; if (rnd() < 0.2) { x += 0.18 + rnd() * 0.25; continue; } box(w, h, 0.17 + rnd() * 0.04, tones[Math.floor(rnd() * tones.length)], x + w / 2, y, -5.88, { rz: rnd() < 0.08 ? 0.18 : 0 }); x += w + 0.004; if (row === 0 && x > KX + 0.2 && x < KX + 0.3) x += 0.34; } });
    ball(0.11, M.white, KX + 0.42, 1.65, -5.86, { seg: 24 }); }
  box(1.3, 1.62, 0.04, M.black, -7.0, 0.85, -5.98); { const a = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.52), M.art); a.position.set(-7.0, 1.66, -5.955); put(a, world, false); }
  plant(-2.3, -5.45, 0.9, M.black);

  /* ---------- terrace: somewhere to sit, trees in planters, a line of light along the edge */
  box(0.95, 0.34, 2.6, M.coal, -10.45, 0.04, 2.6, { r: 0.06 }); box(0.26, 0.42, 2.6, M.coal, -10.82, 0.3, 2.6, { r: 0.09 }); [1.75, 2.6, 3.45].forEach(z => box(0.66, 0.12, 0.8, M.grey, -10.36, 0.38, z, { r: 0.05 }));
  cyl(0.38, 0.38, 0.3, M.stone, -9.2, 0, 2.6, { seg: 36 });
  [[-10.6, -4.9, 1.2], [-10.6, -2.6, 1.0], [-10.7, 4.35, 1.15]].forEach(([x, z, s]) => { box(0.62, 0.52, 0.62, M.stone, x, 0, z, { r: 0.02 }); const g = group(x, z); cyl(0.03, 0.04, 0.9 * s, M.walnut, 0, 0.5, 0, { in: g, seg: 8 }); for (let i = 0; i < 7; i++) { const a = rnd() * 6.283, r = rnd() * 0.25 * s; ball((0.3 + rnd() * 0.16) * s, M.leaf, Math.cos(a) * r, (1.35 + rnd() * 0.55) * s, Math.sin(a) * r, { in: g, seg: 10 }); } });
  box(0.02, 0.014, 11.0, M.ledBlue, -11.2, 0.004, -0.5, { shadow: false });

  /* ---------- London. This view has no perspective, so distance is faked: the skyline is a small model set far below and
     behind the terrace, where the haze takes it. Only the building this floor sits on is full size. */
  { const g = new THREE.BoxGeometry(18.7, 120, 11.2), uv = g.attributes.uv, dims = [[11.2, 120], [11.2, 120], [0, 0], [0, 0], [18.7, 120], [18.7, 120]];
    for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) { const k = f * 4 + i; uv.setXY(k, uv.getX(k) * dims[f][0] / 12.8, uv.getY(k) * dims[f][1] / 24); }
    const m = new THREE.Mesh(g, M.facade); m.position.set(-1.85, -61, -0.5); world.add(m); }
  const city = new THREE.Group(); city.position.set(-27, -15, -10); world.add(city);
  const block = (w, h, d, x, z, mat = rnd() < 0.5 ? M.city : M.cityB) => { const g = new THREE.BoxGeometry(w, h + 16, d), uv = g.attributes.uv, dims = [[d, h + 16], [d, h + 16], [0, 0], [0, 0], [w, h + 16], [w, h + 16]];
    for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) { const k = f * 4 + i; uv.setXY(k, uv.getX(k) * dims[f][0] / 7 + 0.004, uv.getY(k) * dims[f][1] / 14 + 0.004); }
    const m = new THREE.Mesh(g, mat); m.position.set(x, (h - 16) / 2, z); city.add(m);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, d), M.roof); roof.position.set(x, h + 0.03, z); city.add(roof); };
  for (let i = 0; i < 36; i++) { const a = rnd() * 6.283, r = 2.5 + Math.sqrt(rnd()) * 9; block(1.1 + rnd() * 1.9, 1.5 + rnd() * rnd() * 8, 1.1 + rnd() * 1.9, Math.cos(a) * r * 1.1, Math.sin(a) * r); }
  // a tall glass spire, a rounded tower, a slim one with a drum near the top, and a great wheel by the river
  { const sp = new THREE.Mesh(new THREE.ConeGeometry(1.5, 17, 4, 1), M.city); sp.rotation.y = Math.PI / 4; sp.position.set(-1.5, 8.5, 1); const uv = sp.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 1.2, uv.getY(i) * 1.6); city.add(sp);
    const pts = []; for (let i = 0; i <= 14; i++) { const t = i / 14; pts.push(new THREE.Vector2(Math.max(0.02, Math.sin(Math.PI * Math.pow(t, 0.6)) * 1.25), t * 9)); }
    const gh = new THREE.Mesh(new THREE.LatheGeometry(pts, 24), M.cityB); { const u = gh.geometry.attributes.uv; for (let i = 0; i < u.count; i++) u.setXY(i, u.getX(i) * 1.5, u.getY(i) * 0.8); } gh.position.set(4.5, 0, -5); city.add(gh);
    const bt = new THREE.Group(); bt.position.set(1.5, 0, 7.5); city.add(bt); const c = (r, h, top, m) => { const k = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 20), m); k.position.y = top - h / 2; bt.add(k); };
    c(0.3, 40, 8, M.cityDark); c(0.62, 1.5, 8.6, M.city); c(0.5, 1.1, 10, M.cityB); c(0.05, 2, 12, M.cityDark); { const b = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), M.beacon); b.position.y = 12.05; bt.add(b); }
    const eye = new THREE.Group(); eye.position.set(-6.5, 3.4, 8.5); eye.rotation.y = 0.6; city.add(eye); eye.add(new THREE.Mesh(new THREE.TorusGeometry(3.1, 0.06, 6, 64), M.eye));
    for (let i = 0; i < 12; i++) { const k = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 6.2, 4), M.eye); k.rotation.z = (i / 12) * Math.PI; eye.add(k); }
    for (let i = 0; i < 24; i++) { const a = (i / 24) * 6.283, k = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 5), M.eye); k.position.set(Math.cos(a) * 3.28, Math.sin(a) * 3.28, 0); eye.add(k); } }

  /* ---------- light. One rig, eased between two states: lights on (L = 1) and lights off (L = 0). */
  const hemi = new THREE.HemisphereLight(0xffffff, 0xcfc6ba, 0.8); world.add(hemi);
  const key = new THREE.DirectionalLight(0xfff3e4, 2.4); key.position.set(-7.5, 17, -2.5); key.target.position.set(-1, 0, 0); world.add(key, key.target);
  key.castShadow = true; key.shadow.mapSize.set(shadowSize, shadowSize); Object.assign(key.shadow.camera, { left: -14, right: 12, top: 9, bottom: -9, near: 1, far: 40 }); key.shadow.bias = -0.0005; key.shadow.normalBias = 0.03; key.shadow.radius = 5;
  const point = (c, i, d, x, y, z) => { const l = new THREE.PointLight(c, i, d, 2); l.position.set(x, y, z); l.userData.i = i; world.add(l); return l; };
  const on = [...pendants.map(p => point(0xffd2a0, 7, 7, p.x, p.y, p.z)), point(0xffd2a0, 5, 6, DX, 1.55, DZ), point(0xffcf98, 5, 6, -7.1, 1.4, 4.4)];
  const off = [
    point(0x57b3ee, 2.2, 6, IX - 1.2, 0.1, IZ + 0.84), point(0x57b3ee, 2.2, 6, IX + 1.3, 0.1, IZ + 0.84), point(0x57b3ee, 2.4, 5, 4.85, 1.4, -5.3), point(0x57b3ee, 6, 8, -10.6, 0.35, 0.5),
    point(0xe20b21, 7, 6.5, -7.45, 0.4, 1.2), point(0xe20b21, 7, 6.5, -7.45, 0.4, 3.4), point(0xe20b21, 4, 5, KX, 1.35, -5.5), point(0xe20b21, 4, 5.5, -5.2, 0.35, -0.5),
  ];
  const cDay = new THREE.Color(0xffffff), cNight = new THREE.Color(0x35557a), gDay = new THREE.Color(0xcfc6ba), gNight = new THREE.Color(0x1a0609), kDay = new THREE.Color(0xfff3e4), kNight = new THREE.Color(0x6f9fd0);
  function setLight(L) {
    hemi.intensity = lerp(0.34, 0.8, L); hemi.color.lerpColors(cNight, cDay, L); hemi.groundColor.lerpColors(gNight, gDay, L);
    key.intensity = lerp(0.2, 2.25, L); key.color.lerpColors(kNight, kDay, L);
    on.forEach(l => (l.intensity = l.userData.i * L)); off.forEach(l => (l.intensity = l.userData.i * (1 - L)));
    M.warm.emissiveIntensity = lerp(0.015, 1.6, L); M.bulb.emissiveIntensity = lerp(0.02, 3, L);
    M.ledBlue.emissiveIntensity = (1 - L) * 3; M.ledRed.emissiveIntensity = (1 - L) * 4; M.screen.emissiveIntensity = lerp(1.5, 0.85, L);
  }

  /* ---------- things from Matt's world that can be opened. Add to this list as more are placed in the room. */
  const items = [
    { id: 'macbook', label: 'The MacBook', note: 'Book Matt', href: '../book/', at: new THREE.Vector3(KX - 0.2, 1.08, KDZ - 0.08) },
    { id: 'press', label: 'On the coffee table', note: 'In the press', href: '../#press', at: new THREE.Vector3(-4.45, 0.44, 2.42) },
  ];

  return { world, setLight, items, focus: { x: -2.1, z: -0.85 }, bounds: { x: [-9.5, 6.5], z: [-5, 4.4] } };
}
