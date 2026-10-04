// Night street circuit detail: walls, catch fencing, LED wall boards, pit lane, sponsor bridge, braking boards,
// tyre stacks, grandstands, city skyline, start/finish line and the F1 cars (MK #17 on pole).
import { f1CarFactory } from './f1-car.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export function buildRaceDetail(X) {
  const { THREE, vR, cc, atf, mats, box, rbox, cyl, struts, cnv, texOf, FONT, LS, C, V3, RED, CHALK, LOWQ, glowTex, fogU, makeStrip, addStand, triplanar, texConcrete, NOISE } = X;
  const root = new THREE.Group(); vR.root.add(root);
  const M = cc.M, ds = cc.ds, L = cc.len;
  const wrapS = s => ((s % L) + L) % L;
  // sample the centre line / racing line at arc length s with a lateral offset (positive = inside of the lap)
  const lerpPt = (arr, s) => { const f = wrapS(s) / ds, i = Math.floor(f) % M, j = (i + 1) % M, u = f - Math.floor(f); return [arr[i][0] + (arr[j][0] - arr[i][0]) * u, arr[i][1] + (arr[j][1] - arr[i][1]) * u]; };
  const racingAt = s => lerpPt(cc.racing, s);
  const headingAt = (arr, s) => { const a = lerpPt(arr, s - 1.5), b = lerpPt(arr, s + 1.5); return Math.atan2(b[1] - a[1], b[0] - a[0]); };
  const kAt = s => cc.ks[cc.idx(s)];

  // ---------- strip geometry along the lap: a ribbon between (offA, yA) and (offB, yB)
  function ribbon(s0, s1, step, offA, yA, offB, yB, uScale = 1) {
    const pos = [], uv = [], idx = []; let n = 0, u = 0, prev = null;
    for (let s = s0; s <= s1 + 1e-6; s += step) {
      const [ax, az] = atf(s, offA), [bx, bz] = atf(s, offB);
      if (prev) u += Math.hypot(ax - prev[0], az - prev[1]) * uScale; prev = [ax, az];
      pos.push(ax, yA, az, bx, yB, bz); uv.push(u, 0, u, 1);
      if (n) { const v = (n - 1) * 2; idx.push(v, v + 1, v + 2, v + 1, v + 3, v + 2); } n++;
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    g.userData.len = u; return g;
  }
  // track runs: inside wall broken by the pit wall between these arc lengths
  const PIT0 = -55, PIT1 = 95;
  const runs = [{ side: -1, a: 0, b: L }, { side: 1, a: PIT1, b: L + PIT0 }];
  const WALL = 10.6, WT = 0.6, WH = 1.05;

  // ---------- concrete walls (street-circuit barriers), painted top edge
  const wallMat = triplanar(new THREE.MeshStandardMaterial({ color: C('#b4afa9'), roughness: 0.82 }), texConcrete, 0.4, 0);
  const capMat = new THREE.MeshStandardMaterial({ color: C('#d8d4cf'), roughness: 0.6 });
  runs.forEach(({ side, a, b }) => {
    const o0 = side * WALL, o1 = side * (WALL + WT);
    root.add(new THREE.Mesh(ribbon(a, b, ds * 3, o0, 0, o0, WH), wallMat));
    root.add(new THREE.Mesh(ribbon(a, b, ds * 3, o1, 0, o1, WH), wallMat));
    root.add(new THREE.Mesh(ribbon(a, b, ds * 3, o0, WH, o1, WH), capMat));
  });

  // ---------- LED boards on the track-facing wall faces (the venue's message ribbon, curved with the lap)
  runs.forEach(({ side, a, b }, k) => {
    const o = side * (WALL - 0.02); const g = ribbon(a + 2, b - 2, ds * 2, o, 0.14, o, 0.94, side > 0 ? -1 : 1);
    makeStrip(g, 1, 0.8, 1.15, k ? -1 : 1);
  });

  // ---------- catch fencing above the walls: posts + diamond mesh
  {
    const [fc, fg] = cnv(128, 128); fg.clearRect(0, 0, 128, 128); fg.strokeStyle = 'rgba(210,210,206,1)'; fg.lineWidth = 3;
    for (let k = -128; k <= 256; k += 32) { fg.beginPath(); fg.moveTo(k, 0); fg.lineTo(k + 128, 128); fg.stroke(); fg.beginPath(); fg.moveTo(k + 128, 0); fg.lineTo(k, 128); fg.stroke(); }
    fg.fillStyle = 'rgba(200,200,196,1)'; fg.fillRect(0, 0, 128, 5); fg.fillRect(0, 123, 128, 5);
    const ft = new THREE.CanvasTexture(fc); ft.wrapS = THREE.RepeatWrapping; ft.colorSpace = THREE.SRGBColorSpace; ft.repeat.set(1 / 1.6, 1);
    const fenceMat = new THREE.MeshStandardMaterial({ map: ft, transparent: true, alphaTest: 0.35, side: THREE.DoubleSide, roughness: 0.4, metalness: 0.7, color: C('#9a9894') });
    const postGeo = new THREE.CylinderGeometry(0.07, 0.07, 3.6, 8); postGeo.translate(0, WH + 1.8, 0);
    const posts = [];
    runs.forEach(({ side, a, b }) => {
      const o = side * (WALL + WT * 0.5);
      root.add(new THREE.Mesh(ribbon(a, b, ds * 3, o, WH + 0.1, o, WH + 3.5, 1), fenceMat));
      for (let s = a; s < b; s += 4.5) posts.push(atf(s, o));
    });
    const im = new THREE.InstancedMesh(postGeo, mats.steel, posts.length), mx = new THREE.Matrix4();
    posts.forEach(([x, z], i) => { mx.makeTranslation(x, 0, z); im.setMatrixAt(i, mx); }); im.instanceMatrix.needsUpdate = true; root.add(im);
  }

  // ---------- wet patches + bump on the asphalt are in the engine's track shader; here: start/finish line
  {
    const [c, g] = cnv(512, 32); for (let i = 0; i < 32; i++) for (let j = 0; j < 2; j++) { g.fillStyle = (i + j) % 2 ? '#0d0c0c' : '#e8e5e1'; g.fillRect(i * 16, j * 16, 16, 16); }
    const m = new THREE.Mesh(new THREE.PlaneGeometry(15.2, 0.9), new THREE.MeshStandardMaterial({ map: texOf(c), roughness: 0.7, polygonOffset: true, polygonOffsetFactor: -3 }));
    const [x, z] = atf(0, 0); m.position.set(x, 0.022, z); m.rotation.x = -Math.PI / 2; m.rotation.z = Math.atan2(-cc.tan[0][0], -cc.tan[0][1]); root.add(m);
    m.receiveShadow = !LOWQ;
  }

  // ---------- pit lane: surface, painted boxes, lit garage mouths
  const pitCars = [];
  {
    const sMid = 20, [px, pz] = atf(sMid, 30), [tx, tz] = cc.tan[cc.idx(sMid)];
    const pg = new THREE.Group(); pg.position.set(px, 0, pz); pg.rotation.y = Math.atan2(-tz, tx); root.add(pg);
    const fz = -cc.sIn;
    const [c, g] = cnv(2048, 192); g.fillStyle = '#2a2826'; g.fillRect(0, 0, 2048, 192);
    for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '10,10,10' : '90,88,84'},${Math.random() * 0.35})`; g.fillRect(Math.random() * 2048, Math.random() * 192, 2, 2); }
    g.fillStyle = 'rgba(232,229,225,0.9)'; g.fillRect(0, 118, 2048, 4); g.fillRect(0, 186, 2048, 4);
    for (let k = -6; k <= 6; k++) { const x = 1024 + k * 10.5 / 150 * 2048; g.strokeStyle = k % 2 ? 'rgba(232,229,225,0.85)' : 'rgba(236,48,19,0.9)'; g.lineWidth = 4; g.strokeRect(x - 60, 6, 120, 104); }
    const lane = new THREE.Mesh(new THREE.PlaneGeometry(150, 14), new THREE.MeshStandardMaterial({ map: texOf(c), roughness: 0.55, polygonOffset: true, polygonOffsetFactor: -2 }));
    lane.rotation.x = -Math.PI / 2; if (fz < 0) lane.rotation.z = Math.PI; lane.position.set(0, 0.016, fz * 13); lane.receiveShadow = !LOWQ; pg.add(lane);
    // garage interiors: warm light falling out onto the lane
    const gm = new THREE.MeshBasicMaterial({ map: (() => { const [c, g] = cnv(256, 160); const gr = g.createLinearGradient(0, 0, 0, 160); gr.addColorStop(0, '#d8d0c6'); gr.addColorStop(0.55, '#8d867f'); gr.addColorStop(1, '#3a3632'); g.fillStyle = gr; g.fillRect(0, 0, 256, 160); g.fillStyle = 'rgba(20,18,17,0.55)'; for (let x = 18; x < 256; x += 46) g.fillRect(x, 40, 30, 70); g.fillStyle = 'rgba(236,48,19,0.7)'; g.fillRect(0, 4, 256, 6); return texOf(c); })(), color: C('#ffffff').multiplyScalar(0.62) });
    const spill = new THREE.MeshBasicMaterial({ map: glowTex, color: C('#ffe9d2'), transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false });
    for (let k = -6; k <= 6; k++) {
      const back = new THREE.Mesh(new THREE.PlaneGeometry(8.6, 5.2), gm); back.position.set(k * 10.5, 2.7, fz * 6.27); back.rotation.y = fz > 0 ? 0 : Math.PI; pg.add(back);
      const sp = new THREE.Mesh(new THREE.PlaneGeometry(11, 9), spill); sp.rotation.x = -Math.PI / 2; sp.position.set(k * 10.5, 0.03, fz * 9.5); pg.add(sp);
    }
    // pit-wall stands: raised deck, canopy, stools, a bank of timing monitors, antennas
    { const tim = () => { const [c, g] = cnv(256, 160); g.fillStyle = '#05070a'; g.fillRect(0, 0, 256, 160);
        for (let r = 0; r < 9; r++) { g.fillStyle = r === 0 ? RED : r % 2 ? 'rgba(160,190,220,0.8)' : 'rgba(220,226,232,0.85)'; g.fillRect(10, 12 + r * 16, 18, 10); g.fillRect(36, 12 + r * 16, 90 + Math.random() * 60, 10); g.fillRect(200, 12 + r * 16, 46, 10); } return texOf(c); };
      const scrs = [tim(), tim(), tim()].map(t => new THREE.MeshBasicMaterial({ map: t, color: C('#ffffff').multiplyScalar(1.1) }));
      const deck = new THREE.MeshStandardMaterial({ color: C('#1b1a1a'), roughness: 0.6, metalness: 0.3 });
      for (let k = -3; k <= 3; k++) {
        const st = new THREE.Group(); st.position.set(k * 21, 0, fz * 18.8); pg.add(st); const f = fz > 0 ? 1 : -1;
        for (const x of [-2.1, 2.1]) for (const z of [-0.7, 0.7]) box(st, 0.12, 1.25, 0.12, x, 0.62, z, 'steel');
        rbox(st, 4.6, 0.12, 1.8, 0, 1.28, 0, deck, 0.03); box(st, 4.6, 0.6, 0.06, 0, 1.6, -f * 0.9, deck);                 // deck and kick panel
        for (const x of [-1.5, -0.5, 0.5, 1.5]) { cyl(st, 0.03, 0.6, 'y', x, 1.64, f * 0.15, 'steel', 8); const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.06, 14), X.redMat); seat.position.set(x, 1.97, f * 0.15); st.add(seat); }
        for (const x of [-2.1, 2.1]) box(st, 0.1, 2.3, 0.1, x, 2.45, -f * 0.75, 'steel');
        const can = rbox(st, 5.0, 0.12, 2.3, 0, 3.6, -f * 0.1, 'dark', 0.03); can.rotation.x = -f * 0.12; box(st, 5.0, 0.12, 0.08, 0, 3.47, f * 1.0, X.redMat);
        for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.58), scrs[(r + c + k + 9) % 3]); m.position.set(-1.5 + c * 1.0, 2.35 + r * 0.66, -f * 0.62); m.rotation.y = fz > 0 ? 0 : Math.PI; m.rotation.x = 0; st.add(m);
          const fr = rbox(st, 1.0, 0.63, 0.06, -1.5 + c * 1.0, 2.35 + r * 0.66, -f * 0.66, 'dark', 0.02); }
        cyl(st, 0.025, 2.2, 'y', 2.2, 4.7, -f * 0.6, 'steel', 6); cyl(st, 0.02, 1.6, 'y', -2.2, 4.4, -f * 0.6, 'steel', 6);
      } }
    box(pg, 141, 3.2, 10.5, 0, 10.7, fz * 0.4, mats.glass); box(pg, 141, 0.06, 10.6, 0, 10.4, fz * 0.4, X.warmStrip);
    rbox(pg, 143, 0.4, 13, 0, 12.5, 0, 'dark', 0.1); box(pg, 143, 0.14, 0.12, 0, 12.75, fz * 6.4, X.redMat);
    for (let k = -5; k <= 5; k++) { box(pg, 4 + (k & 1) * 2, 1.4, 3, k * 12 + 3, 13.4, -fz * 2, 'steel'); box(pg, 2.2, 0.9, 2.2, k * 12 - 3, 13.15, fz * 2.5, 'concrete'); }
    pitCars.push(...[-21, 0, 21].map(x => ({ g: pg, x, z: fz * 9.6 })));
  }

  // ---------- sponsor bridge over the longest straight that isn't the pit straight
  const bridges = [];
  {
    let best = null, run = null;
    for (let i = 0; i <= M; i++) { const s = (i % M) * ds, straight = Math.abs(cc.ks[i % M]) < 0.004 && !(s > L + PIT0 - 40 || s < PIT1 + 40);
      if (straight) { if (!run) run = { a: s }; run.b = s; } else if (run) { if (!best || run.b - run.a > best.b - best.a) best = run; run = null; } }
    const s = best ? (best.a + best.b) / 2 : L * 0.45, [x, z] = atf(s, 0), h = headingAt(cc.c, s);
    const br = new THREE.Group(); br.position.set(x, 0, z); br.rotation.y = -h; root.add(br);
    for (const zz of [-12.6, 12.6]) { rbox(br, 1.4, 9, 1.4, 0, 4.5, zz, 'steel', 0.1, true); rbox(br, 2.2, 0.5, 2.2, 0, 0.25, zz, 'dark', 0.1); }
    rbox(br, 1.6, 2.6, 27, 0, 8.6, 0, 'dark', 0.1, true);
    for (const xx of [-0.82, 0.82]) { const g = new THREE.PlaneGeometry(25.4, 2.1); g.rotateY(xx > 0 ? Math.PI / 2 : -Math.PI / 2); g.translate(xx, 8.6, 0); bridges.push(makeStrip(g, 25.4, 2.1, 1.4, xx > 0 ? 1 : -1, br)); }
    box(br, 1.7, 0.12, 27.2, 0, 9.95, 0, X.redMat); box(br, 1.7, 0.12, 27.2, 0, 7.25, 0, X.redMat);
  }

  // ---------- braking boards (300 / 200 / 100) and tyre stacks at each corner
  {
    const boardTex = n => { const [c, g] = cnv(128, 192); g.fillStyle = '#f0ede9'; g.fillRect(0, 0, 128, 192); g.fillStyle = '#0d0c0c'; g.font = FONT(800, 78); LS(g, '-4px'); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(n), 64, 100); g.fillStyle = RED; g.fillRect(0, 0, 128, 14); return texOf(c); };
    const BT = [300, 200, 100].map(boardTex);
    const tyreGeo = new THREE.CylinderGeometry(0.33, 0.33, 0.24, 18), tyreMat = new THREE.MeshStandardMaterial({ color: C('#121111'), roughness: 0.92 });
    const tyres = [], blocks = [];
    cc.apex.forEach(a => {
      const out = -a.side * cc.sIn;              // outside of the corner in atf's offset convention
      [300, 200, 100].forEach((n, k) => {
        const s = a.s - 95 + k * 25, [x, z] = atf(s, out * (WALL - 1.2)), h = headingAt(cc.c, s);
        const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = -h - Math.PI / 2; root.add(g);
        cyl(g, 0.05, 1.6, 'y', 0, 0.8, 0, 'steel', 8);
        const m = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 1.3), new THREE.MeshStandardMaterial({ map: BT[k], roughness: 0.6 })); m.position.y = 2.1; g.add(m);
      });
      for (let j = -26; j <= 26; j += 1.55) blocks.push({ s: a.s + j, off: out * (WALL - 0.32), k: blocks.length });
      for (let j = 28; j <= 36; j += 1.4) { const [x, z] = atf(a.s + j, out * (WALL - 0.45)); for (let lv = 0; lv < 4; lv++) tyres.push([x, 0.12 + lv * 0.25, z]); }
    });
    const im = new THREE.InstancedMesh(tyreGeo, tyreMat, tyres.length), mx = new THREE.Matrix4();
    tyres.forEach(([x, y, z], i) => { mx.makeTranslation(x, y, z); im.setMatrixAt(i, mx); }); im.instanceMatrix.needsUpdate = true; root.add(im);
    // block barrier: interlocking foam-filled cells in a polyethylene skin, alternating red and black, white straps and a top cover
    const bGeo = new RoundedBoxGeometry(1.5, 0.82, 0.62, 3, 0.12), sGeo = new THREE.BoxGeometry(1.52, 0.07, 0.64), cGeo = new RoundedBoxGeometry(1.5, 0.08, 0.66, 2, 0.03);
    const bMat = new THREE.MeshPhysicalMaterial({ color: C('#ffffff'), roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.3 }); bMat.userData.env = 0.6;
    const bi = new THREE.InstancedMesh(bGeo, bMat, blocks.length), si = new THREE.InstancedMesh(sGeo, new THREE.MeshStandardMaterial({ color: C('#e9e6e1'), roughness: 0.6 }), blocks.length * 2), ci = new THREE.InstancedMesh(cGeo, new THREE.MeshStandardMaterial({ color: C('#1b1a1a'), roughness: 0.7 }), blocks.length);
    const q = new THREE.Quaternion(), one = V3(1, 1, 1), col = new THREE.Color();
    blocks.forEach((b, i) => { const [x, z] = atf(b.s, b.off), h = headingAt(cc.c, b.s); q.setFromAxisAngle(V3(0, 1, 0), -h);
      mx.compose(V3(x, 0.41, z), q, one); bi.setMatrixAt(i, mx); bi.setColorAt(i, i % 2 ? col.set('#1a1919') : col.set(RED));
      mx.compose(V3(x, 0.86, z), q, one); ci.setMatrixAt(i, mx);
      for (const [k, y] of [[0, 0.24], [1, 0.6]]) { mx.compose(V3(x, y, z), q, one); si.setMatrixAt(i * 2 + k, mx); } });
    [bi, si, ci].forEach(m => { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; root.add(m); });
  }

  // ---------- marshal posts round the outside of the lap
  const flags = [];
  { const orange = new THREE.MeshStandardMaterial({ color: C('#e8641e'), roughness: 0.65 }), white = new THREE.MeshStandardMaterial({ color: C('#efece7'), roughness: 0.5 }), hut = new THREE.MeshStandardMaterial({ color: C('#d9d5cf'), roughness: 0.7 });
    const ledG = new THREE.MeshBasicMaterial({ color: C('#30d158').multiplyScalar(1.8) }), flagMats = [C('#f5d90a'), C('#f3f2f2'), C('#2fbf4f')].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8, side: THREE.DoubleSide }));
    const numTex = n => { const [c, g] = cnv(128, 128); g.fillStyle = '#efece7'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#0d0c0c'; g.font = FONT(800, 70); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(n), 64, 70); return texOf(c); };
    let n = 0;
    for (let s = 60; s < L - 40; s += 210) {
      if (s > L + PIT0 - 30 || s < PIT1 + 30) continue; n++;
      const off = -(WALL + WT + 2.6), [x, z] = atf(s, off), h = headingAt(cc.c, s);
      const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = -h; root.add(g);        // local x along the track, +z toward the inside of the lap
      for (const xx of [-1.2, 1.2]) for (const zz of [-1.0, 1.0]) box(g, 0.1, 1.6, 0.1, xx, 0.8, zz, 'steel');
      box(g, 2.8, 0.12, 2.4, 0, 1.62, 0, 'steel'); box(g, 2.8, 2.2, 0.08, 0, 2.75, -1.18, hut); box(g, 0.08, 0.9, 2.4, -1.38, 2.1, 0, hut); box(g, 0.08, 0.9, 2.4, 1.38, 2.1, 0, hut); box(g, 2.8, 0.9, 0.06, 0, 2.1, 1.18, hut);
      for (const xx of [-1.36, 1.36]) box(g, 0.08, 2.3, 0.08, xx, 2.8, 1.16, 'steel');
      const roof = box(g, 3.2, 0.1, 2.9, 0, 3.92, 0.1, orange); roof.rotation.x = 0.06; box(g, 3.2, 0.25, 0.06, 0, 3.75, 1.5, white);
      const num = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), new THREE.MeshStandardMaterial({ map: numTex(n), roughness: 0.6 })); num.position.set(1.0, 3.3, 1.22); g.add(num);
      // two marshals in orange overalls and white helmets; one works a flag
      for (const [mx2, fl] of [[-0.6, true], [0.5, false]]) {
        const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.75, 4, 10), orange); body.position.set(mx2, 2.3, 0.4); g.add(body);
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 10), white); head.position.set(mx2, 2.95, 0.4); g.add(head);
        if (fl) { cyl(g, 0.015, 1.2, 'y', mx2 + 0.25, 2.9, 0.6, 'steel', 6);
          const fg = new THREE.PlaneGeometry(0.75, 0.5, 6, 1); fg.translate(0.375, 0, 0); const flag = new THREE.Mesh(fg, flagMats[n % 3 === 0 ? 0 : n % 3 === 1 ? 1 : 2]); flag.position.set(mx2 + 0.25, 3.3, 0.6); g.add(flag); flags.push({ m: flag, ph: n * 1.7 }); }
      }
      // digital flag panel on the wall top, facing the cars
      const pan = new THREE.Group(); pan.position.set(0, WH + 0.6, 2.6 - WT * 0.5); g.add(pan);
      rbox(pan, 1.0, 0.7, 0.12, 0, 0, 0, 'dark', 0.03); const lf = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 0.56), ledG); lf.position.z = 0.065; pan.add(lf);
      cyl(g, 0.04, WH + 0.3, 'y', 0, (WH + 0.3) / 2, 2.6 - WT * 0.5, 'steel', 8);
    } }

  // ---------- corner grandstands (outside of two corners, on the approach)
  [1, 4].forEach(k => {
    const a = cc.apex[k]; if (!a) return; const s = a.s - 58, out = -a.side * cc.sIn, [x, z] = atf(s, out * 15.5), [ix, iz] = atf(s, 0);
    addStand(vR, { len: 46, tier: 8, pos: [x, z], ry: Math.atan2(x - ix, z - iz), sp: 0.7, col: 'red' });
  });

  const aviation = new THREE.MeshBasicMaterial({ color: C('#ff2a12').multiplyScalar(2.2) });
  // ---------- city skyline: lit office towers ringing the circuit
  {
    const n = LOWQ ? 110 : 190, geo = new THREE.BoxGeometry(1, 1, 1); geo.translate(0, 0.5, 0);
    const R0 = Math.max(cc.ext[0], cc.ext[1]) * 1.75;
    const mat = new THREE.ShaderMaterial({ uniforms: { ...fogU, uTime: X.timeU }, vertexShader: `attribute float aSeed; varying vec3 vW; varying vec3 vN; varying float vSeed; varying float vH;
        void main(){ vec4 w=modelMatrix*instanceMatrix*vec4(position,1.0); vW=w.xyz; vN=normalize(mat3(modelMatrix*instanceMatrix)*normal); vSeed=aSeed; vH=instanceMatrix[1][1]; gl_Position=projectionMatrix*viewMatrix*w; }`,
      fragmentShader: `uniform float uFogDen; uniform vec3 uFogCol; uniform float uTime; varying vec3 vW; varying vec3 vN; varying float vSeed; varying float vH; ${NOISE}
        void main(){ vec3 n=normalize(vN); vec3 c=vec3(0.022,0.021,0.024);
          if(abs(n.y)<0.5){ vec2 f=vec2(dot(vW.xz,vec2(-n.z,n.x)), vW.y); vec2 cell=floor(f/vec2(2.6,3.4)); vec2 fr=fract(f/vec2(2.6,3.4));
            float win=step(0.18,fr.x)*step(fr.x,0.82)*step(0.22,fr.y)*step(fr.y,0.8); float on=step(0.8,hash(cell+vSeed*31.7)); float band=step(0.975,hash(vec2(cell.y,vSeed)));
            vec3 wc=mix(vec3(1.0,0.82,0.6),vec3(0.75,0.85,1.0),step(0.7,hash(cell*1.7+vSeed)));
            float fw=clamp(length(fwidth(f))*0.35,0.0,1.0); c+=wc*mix(win*max(on,band),0.06,fw)*(0.35+0.45*hash(cell+3.0))*0.75*step(2.0,vW.y);
            c+=vec3(0.06,0.05,0.045)*smoothstep(8.0,0.0,vW.y); }
          else c=vec3(0.03,0.028,0.03);
          if(vW.y>vH-1.2 && vH>90.0) c+=vec3(1.6,0.08,0.03)*step(0.5,fract(uTime*0.6+vSeed))*step(abs(n.y),0.5);
          float d=length(vW-cameraPosition); float fo=1.0-exp(-uFogDen*uFogDen*d*d*0.55); c=mix(c,uFogCol,fo*0.9);
          gl_FragColor=vec4(c,1.0);
          #include <colorspace_fragment>
        }` });
    const im = new THREE.InstancedMesh(geo, mat, n), seeds = new Float32Array(n), mx = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), towers = [];
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2 + Math.random() * 0.03, r = R0 + Math.pow(Math.random(), 0.7) * R0 * 1.4, h = 14 + Math.pow(Math.random(), 2.6) * 170;
      q.setFromAxisAngle(V3(0, 1, 0), a + Math.random() * 0.4); sc.set(14 + Math.random() * 34, h, 14 + Math.random() * 34);
      mx.compose(V3(Math.cos(a) * r, 0, Math.sin(a) * r * 0.85), q, sc); im.setMatrixAt(i, mx); seeds[i] = Math.random();
      towers.push({ x: Math.cos(a) * r, z: Math.sin(a) * r * 0.85, q: q.clone(), w: sc.x, h, d: sc.z });
    }
    geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 1)); im.instanceMatrix.needsUpdate = true; im.frustumCulled = false; root.add(im);
    // rooftops: stepped crowns on the tall ones (same lit-window shader), plant and water tanks on the mid-rise, masts with aviation lights on the tallest
    const crowns = towers.filter(t => t.h > 55), cr = new THREE.InstancedMesh(geo, mat, crowns.length), cs = new Float32Array(crowns.length);
    crowns.forEach((t, i) => { mx.compose(V3(t.x, t.h, t.z), t.q, V3(t.w * 0.66, 6 + (i * 37 % 10), t.d * 0.66)); cr.setMatrixAt(i, mx); cs[i] = Math.random(); });
    const cg = geo.clone(); cg.setAttribute('aSeed', new THREE.InstancedBufferAttribute(cs, 1)); cr.geometry = cg; cr.instanceMatrix.needsUpdate = true; cr.frustumCulled = false; root.add(cr);
    const plantM = new THREE.MeshStandardMaterial({ color: C('#1c1c1e'), roughness: 0.7, metalness: 0.3 }), boxG = new THREE.BoxGeometry(1, 1, 1); boxG.translate(0, 0.5, 0);
    const plant = []; towers.forEach((t, i) => { const top = t.h > 55 ? t.h + 6 + (i * 37 % 10) : t.h, sw = t.h > 55 ? 0.66 : 1;
      for (let k = 0; k < (t.h > 55 ? 2 : 4); k++) { const u = (((i * 13 + k * 7) % 10) / 10 - 0.5) * t.w * sw * 0.7, v = (((i * 7 + k * 11) % 10) / 10 - 0.5) * t.d * sw * 0.7, o = V3(u, 0, v).applyQuaternion(t.q);
        plant.push([t.x + o.x, top, t.z + o.z, t.q, 2 + (k % 3) * 1.4, 1.5 + (k % 2) * 1.6, 2 + ((k + 1) % 3)]); } });
    const pi = new THREE.InstancedMesh(boxG, plantM, plant.length); plant.forEach(([x, y, z, qq, w, h, d], i) => { mx.compose(V3(x, y, z), qq, V3(w, h, d)); pi.setMatrixAt(i, mx); }); pi.instanceMatrix.needsUpdate = true; pi.frustumCulled = false; root.add(pi);
    const tall = towers.filter(t => t.h > 110), mastG = new THREE.CylinderGeometry(0.35, 0.6, 1, 8); mastG.translate(0, 0.5, 0);
    const mi = new THREE.InstancedMesh(mastG, plantM, tall.length), avG = new THREE.SphereGeometry(1.1, 10, 8), avi = new THREE.InstancedMesh(avG, aviation, tall.length);
    tall.forEach((t, i) => { const top = t.h + 6 + (towers.indexOf(t) * 37 % 10), mh = 14 + (i % 4) * 6; mx.compose(V3(t.x, top, t.z), t.q, V3(1, mh, 1)); mi.setMatrixAt(i, mx); mx.compose(V3(t.x, top + mh + 0.8, t.z), t.q, V3(1, 1, 1)); avi.setMatrixAt(i, mx); });
    [mi, avi].forEach(m => { m.instanceMatrix.needsUpdate = true; m.frustumCulled = false; root.add(m); });
  }

  // ---------- F1 cars (built in f1-car.js)
  const sideTex = (col) => { const [c, g] = cnv(512, 512); const m = 256; g.strokeStyle = col; g.lineWidth = 12; g.beginPath(); g.arc(m, m, m * 0.86, 0, 7); g.stroke(); g.fillStyle = 'rgba(240,238,234,0.92)'; g.font = FONT(800, 30); LS(g, '8px'); g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const r of [0, Math.PI]) { g.save(); g.translate(m, m); g.rotate(r); g.fillText('MK17', 0, -m * 0.72); g.restore(); } return texOf(c); };
  const swRed = sideTex(RED), swWhite = sideTex('#e8e5e1');
  const buildCar = f1CarFactory(X);
  function makeCar(...a) { const car = buildCar(...a); root.add(car.g); return { ...car, s: 0, lastS: null }; }
  const liveries = [[RED, '#0d0c0c', '17', 'MATT KING', swRed], ['#1a1919', CHALK, '04', 'BLACK', swWhite], ['#e4e1dd', '#0d0c0c', '09', 'WHITE', swWhite], ['#3b3f45', CHALK, '22', 'GREY', swWhite], ['#6e0d05', CHALK, '31', 'CLARET', swWhite]];
  const cars = liveries.map(l => makeCar(...l));
  const garage = liveries.slice(0, 3).map(l => makeCar(...l));
  garage.forEach((c, k) => { const p = pitCars[k]; root.remove(c.g); p.g.add(c.g); c.g.position.set(p.x, 0, p.z); c.g.rotation.y = 0; });

  const gridSlot = g => ({ s: -10 - g * 7.5, off: g % 2 ? 3 : -3 });
  function place(car, s, latOff, blend) {
    const [rx, rz] = racingAt(s), [gx, gz] = atf(s, latOff), x = gx + (rx - gx) * blend, z = gz + (rz - gz) * blend;
    car.g.position.set(x, 0, z); car.g.rotation.y = -headingAt(cc.racing, s);
    const d = car.lastS == null ? 0 : s - car.lastS; car.lastS = s;
    const st = Math.max(-0.35, Math.min(0.35, kAt(s) * 3.4 * 2.2));
    car.wheels.forEach(w => { w.spin.rotation.z -= d / w.r; if (w.front) w.pivot.rotation.y = st; });
  }
  // lap: the MK car leads on the racing line; two rivals chase it; the rest stay on the grid
  function update({ rc, t, LAP, lapS, time }) {
    const lights = rc && t < LAP[0], racing = rc && t >= LAP[0];
    cars.forEach((car, i) => {
      const slot = gridSlot(i);
      if (!rc || lights) { car.g.visible = true; place(car, slot.s, slot.off, 0); car.g.position.y = rc ? Math.sin(time * 70 + i) * 0.004 : 0; return; }
      const hs = lapS(Math.min(t, LAP[1])) + 16, lead = Math.min(1, Math.max(0, (hs - slot.s) / 60));
      if (i === 0) place(car, hs, slot.off, lead);
      else if (i < 3) { const s = Math.max(slot.s, hs - (i === 1 ? 11 : 22)); place(car, s, slot.off * (1 - lead) + (i === 1 ? 2.2 : -2.2) * lead, 0); }
      car.g.visible = i < 3 || !racing || t < LAP[0] + 0.02;
    });
    const blink = Math.sin(time * 18) > 0 ? 1 : 0.1; cars.concat(garage).forEach(c => c.rl.color.copy(C(RED)).multiplyScalar(0.3 + 2.2 * blink));
    if (rc) { flags.forEach(f => { f.m.rotation.y = Math.sin(time * 5 + f.ph) * 0.5; f.m.rotation.z = Math.sin(time * 9 + f.ph) * 0.12; }); aviation.color.copy(C('#ff2a12')).multiplyScalar(Math.sin(time * 2.4) > 0.2 ? 2.4 : 0.15); }
  }
  return { root, update, racingAt, headingAt, bridges };
}
