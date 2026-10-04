// Venue furniture for football, basketball, NFL and tennis: the things that make each bowl read as a real place.
export function buildVenueDetail(X) {
  const { THREE, vF, vB, vN, vT, box, rbox, cyl, struts, cnv, texOf, FONT, LS, C, V3, RED, CHALK, LOWQ, mats, glowTex, redMat, makeBoard, seatGeoBase } = X;
  const seatRed = new THREE.MeshStandardMaterial({ color: C('#6e1208'), roughness: 0.45 });
  const seatBlack = new THREE.MeshStandardMaterial({ color: C('#141313'), roughness: 0.5 });
  const seatGreen = new THREE.MeshStandardMaterial({ color: C('#123321'), roughness: 0.5 });
  const nets = X.nets;
  const glass = new THREE.MeshPhysicalMaterial({ color: C('#c9d6dc'), roughness: 0.05, metalness: 0, transmission: 0, transparent: true, opacity: 0.28, depthWrite: false, side: THREE.DoubleSide }); glass.userData.env = 1.2;
  // a row of seats; facing = 1 looks toward -z (the stand convention), -1 toward +z
  const seatRow = (parent, x0, x1, step, z, y, facing, mat) => {
    const xs = []; for (let x = x0; x <= x1 + 1e-6; x += step) xs.push(x);
    const im = new THREE.InstancedMesh(seatGeoBase, mat, xs.length), mx = new THREE.Matrix4(), r = new THREE.Matrix4().makeRotationY(facing > 0 ? 0 : Math.PI);
    xs.forEach((x, i) => { mx.makeTranslation(x, y, z).multiply(r); im.setMatrixAt(i, mx); }); im.instanceMatrix.needsUpdate = true; im.castShadow = !LOWQ; parent.add(im); return im;
  };
  // furniture stays out of the shadow pass so it never stripes the playing surface
  const quiet = o => { o.traverse(m => { m.userData.noCast = true; }); return o; };
  const grow = (Vn, o, t0 = 0.62) => { quiet(o); Vn.fix.push({ o, kind: 'growY', t0 }); };

  // ================= FOOTBALL =================
  {
    // dugouts on the halfway line: perspex canopy over two rows of red bucket seats
    for (const x of [-9, 9]) {
      const g = new THREE.Group(); g.position.set(x, 0, -36.0); g.rotation.y = Math.PI; vF.root.add(g);
      rbox(g, 8.4, 0.3, 2.4, 0, 0.15, 0.5, 'concreteL', 0.05);
      box(g, 8.4, 1.9, 0.12, 0, 1.1, 1.65, 'dark'); box(g, 0.12, 1.9, 2.3, -4.2, 1.1, 0.5, 'dark'); box(g, 0.12, 1.9, 2.3, 4.2, 1.1, 0.5, 'dark');
      seatRow(g, -3.6, 3.6, 0.6, 0.15, 0.3, 1, seatRed); seatRow(g, -3.6, 3.6, 0.6, 1.0, 0.62, 1, seatRed);
      box(g, 8.0, 0.3, 0.9, 0, 0.45, 1.0, 'concreteL');
      const can = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 8.5, 32, 1, true, -Math.PI / 2, Math.PI / 2), glass); can.rotation.z = Math.PI / 2; can.position.set(0, 0.2, 1.7); g.add(can);
      cyl(g, 0.04, 8.5, 'x', 0, 2.38, 1.66, 'steel', 8); cyl(g, 0.04, 8.5, 'x', 0, 0.22, -0.5, 'steel', 8);
      grow(vF, g, 0.63);
    }
    // fourth official's technical area markings + a pitchside board between the dugouts
    { const g = new THREE.Group(); g.position.set(0, 0, -36.2); vF.root.add(g); rbox(g, 1.6, 0.9, 0.5, 0, 0.45, 0, 'dark', 0.05); const m = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.6), new THREE.MeshBasicMaterial({ color: C(RED).multiplyScalar(1.3) })); m.position.set(0, 0.5, 0.26); g.add(m); grow(vF, g, 0.64); }
    // corner video screens on steel frames, facing the centre spot
    for (const [x, z] of [[63, 46], [-63, -46]]) {
      const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = Math.atan2(-x, -z); vF.root.add(g);
      struts(g, [[V3(-6, 0, -0.4), V3(-6, 12, -0.4), 0.35], [V3(6, 0, -0.4), V3(6, 12, -0.4), 0.35], [V3(-6, 6, -0.4), V3(6, 11, -0.4), 0.12], [V3(6, 6, -0.4), V3(-6, 11, -0.4), 0.12]], mats.steel);
      rbox(g, 16.4, 9.6, 1.2, 0, 16.4, 0, 'dark', 0.2, true);
      makeBoard(vF, g, 15.6, 8.8, 0, 16.4, 0.62, 0, 1.0, 1);
      box(g, 16.6, 0.16, 0.2, 0, 21.3, 0.62, redMat);
      grow(vF, g, 0.6);
    }
  }

  // ================= BASKETBALL (local metres; venue root is scaled) =================
  let bbRoof = null;
  {
    // arena ceiling: deck, truss grid, downlights — lifts away for the overhead playbook
    const roof = new THREE.Group(); roof.position.y = 24; vB.root.add(roof);
    const deck = new THREE.Mesh(new THREE.PlaneGeometry(48, 34), new THREE.MeshStandardMaterial({ color: C('#0f0e0e'), roughness: 0.9, side: THREE.DoubleSide })); deck.rotation.x = Math.PI / 2; roof.add(deck);
    const S = [];
    for (let x = -22; x <= 22; x += 4) S.push([V3(x, -0.1, -16), V3(x, -0.1, 16), 0.09], [V3(x, -1.4, -16), V3(x, -1.4, 16), 0.07]);
    for (let z = -16; z <= 16; z += 4) S.push([V3(-22, -1.4, z), V3(22, -1.4, z), 0.06]);
    for (let x = -22; x <= 22; x += 4) for (let z = -16; z < 16; z += 4) S.push([V3(x, -0.1, z), V3(x, -1.4, z + 4), 0.035]);
    struts(roof, S, mats.steel);
    const dl = new THREE.MeshBasicMaterial({ color: C('#fff1df').multiplyScalar(2.4) }), dg = new THREE.CircleGeometry(0.28, 14);
    const pos = []; for (let x = -20; x <= 20; x += 4) for (let z = -14; z <= 14; z += 4) pos.push([x + 2, z + 2]);
    const im = new THREE.InstancedMesh(dg, dl, pos.length), mx = new THREE.Matrix4(), rot = new THREE.Matrix4().makeRotationX(Math.PI / 2);
    pos.forEach(([x, z], i) => { mx.makeTranslation(x, -1.5, z).multiply(rot); im.setMatrixAt(i, mx); }); im.instanceMatrix.needsUpdate = true; roof.add(im);
    quiet(roof); vB.fix.push({ o: roof, kind: 'drop', y0: 24, h: 18, t0: 0.46 }); bbRoof = roof;
    // scorer's table with an LED front, team bench chairs either side
    const tb = new THREE.Group(); tb.position.set(0, 0, -8.7); vB.root.add(tb);
    rbox(tb, 9.2, 0.08, 0.9, 0, 0.78, 0, 'dark', 0.03); box(tb, 9.2, 0.7, 0.06, 0, 0.4, 0.4, 'dark');
    makeBoard(vB, tb, 9.0, 0.5, 0, 0.42, 0.44, 0, 1.25, 1);
    seatRow(tb, -3.8, 3.8, 0.75, -0.5, 0, -1, seatBlack);
    for (const sx of [-1, 1]) seatRow(tb, sx > 0 ? 5.6 : -13.2, sx > 0 ? 13.2 : -5.6, 0.62, 0.2, 0, -1, seatBlack);
    grow(vB, tb, 0.64);
    // courtside seats along the far sideline
    const cs = new THREE.Group(); vB.root.add(cs); seatRow(cs, -13.5, 13.5, 0.6, 8.75, 0, 1, seatRed); seatRow(cs, -13.5, 13.5, 0.6, 9.45, 0.25, 1, seatBlack); grow(vB, cs, 0.66);
    // shot clocks above both backboards
    const clockTex = (() => { const [c, g] = cnv(256, 128); g.fillStyle = '#0b0a0a'; g.fillRect(0, 0, 256, 128); g.fillStyle = RED; g.font = FONT(800, 104); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('24', 128, 70); return texOf(c); })();
    for (const sx of [-1, 1]) {
      const g = new THREE.Group(); g.position.set(sx * 12.8, 4.25, 0); g.rotation.y = -sx * Math.PI / 2; vB.root.add(g);
      rbox(g, 0.9, 0.45, 0.3, 0, 0, 0, 'dark', 0.04); const m = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.35), new THREE.MeshBasicMaterial({ map: clockTex, color: C('#ffffff').multiplyScalar(1.6) })); m.position.z = 0.16; g.add(m);
      grow(vB, g, 0.64);
    }
  }

  // ================= NFL =================
  let skycam = null, cables = null, chains = null;
  {
    // end-zone video boards above both end stands
    for (const sx of [-1, 1]) {
      const g = new THREE.Group(); g.position.set(sx * 76, 0, 0); g.rotation.y = -sx * Math.PI / 2; vN.root.add(g);
      struts(g, [[V3(-12, 0, -1.2), V3(-12, 17, -1.2), 0.5], [V3(12, 0, -1.2), V3(12, 17, -1.2), 0.5], [V3(-12, 8, -1.2), V3(12, 16, -1.2), 0.16], [V3(12, 8, -1.2), V3(-12, 16, -1.2), 0.16]], mats.steel);
      rbox(g, 35, 14, 1.6, 0, 25, 0, 'dark', 0.3, true);
      makeBoard(vN, g, 34, 13, 0, 25, 0.82, 0, 1.0, 1);
      box(g, 35.2, 0.25, 0.3, 0, 32.2, 0.82, redMat);
      grow(vN, g, 0.6);
    }
    // sideline benches, coolers and heaters
    for (const sz of [-1, 1]) {
      const g = new THREE.Group(); g.position.set(0, 0, sz * 27.4); vN.root.add(g);
      for (const r of [0, 1]) { rbox(g, 28, 0.08, 0.45, 0, 0.46 + r * 0.3, r * sz * 0.9, 'dark', 0.03); for (let x = -13; x <= 13; x += 2.6) box(g, 0.06, 0.46 + r * 0.3, 0.06, x, (0.46 + r * 0.3) / 2, r * sz * 0.9, 'steel'); }
      for (const x of [-16, 16]) { cyl(g, 0.35, 0.8, 'y', x, 0.4, 0, redMat, 20); cyl(g, 0.36, 0.08, 'y', x, 0.82, 0, 'white', 20); rbox(g, 0.9, 1.6, 0.6, x + Math.sign(x) * 1.5, 0.8, 0, 'steel', 0.08); }
      grow(vN, g, 0.64);
    }
    // the chain crew: down markers that walk with the first-down line
    chains = new THREE.Group(); vN.root.add(chains);
    const flap = new THREE.MeshStandardMaterial({ color: C(RED), roughness: 0.6, emissive: C(RED), emissiveIntensity: 0.25 });
    const mk = x => { const p = new THREE.Group(); p.position.x = x; chains.add(p); cyl(p, 0.035, 2.4, 'y', 0, 1.2, 0, 'white', 8); rbox(p, 0.5, 0.4, 0.05, 0, 2.5, 0, flap, 0.05); return p; };
    const a = mk(0), b = mk(-9.14);
    const ch = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 9.14, 4), mats.steel); ch.geometry.rotateZ(Math.PI / 2); ch.position.set(-4.57, 0.05, 0); chains.add(ch);
    chains.position.z = 26.0; chains.visible = false; quiet(chains);
    // Skycam: a pod on four cables from the light masts, tracking the drive
    const pod = new THREE.Group(); vN.root.add(pod);
    rbox(pod, 0.9, 0.6, 0.9, 0, 0, 0, 'dark', 0.12); const lens = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), mats.glass); lens.position.y = -0.38; pod.add(lens);
    const tally = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshBasicMaterial({ color: C(RED).multiplyScalar(3) })); tally.position.set(0.3, 0.32, 0.3); pod.add(tally);
    skycam = quiet(pod);
    // cables are thin meshes, not GL lines: the AO pass rasterises line primitives as filled triangles
    const cgeo = new THREE.CylinderGeometry(0.035, 0.035, 1, 5, 1); cgeo.translate(0, 0.5, 0);
    cables = new THREE.InstancedMesh(cgeo, mats.steel, 4); cables.frustumCulled = false; quiet(cables); vN.root.add(cables);
  }
  const masts = [[-80, -54], [80, -54], [80, 54], [-80, 54]];

  // ================= TENNIS (local metres; venue root is scaled) =================
  const tennis = { net: null, kit: [] };
  {
    const green = new THREE.MeshStandardMaterial({ color: C('#123522'), roughness: 0.75 });
    // ---- the court furniture, Wimbledon-style: painted steel, deep green, white trim
    const tGreen = new THREE.MeshStandardMaterial({ color: C('#0f3a25'), roughness: 0.42, metalness: 0.35 }); tGreen.userData.env = 0.6;
    const tCloth = new THREE.MeshStandardMaterial({ color: C('#123d27'), roughness: 0.85 });
    const tWhite = new THREE.MeshStandardMaterial({ color: C('#efece7'), roughness: 0.55 });
    const towel = new THREE.MeshStandardMaterial({ color: C('#f4f1ec'), roughness: 0.95 });
    const purple = new THREE.MeshStandardMaterial({ color: C('#4a2a5c'), roughness: 0.7 });
    const T = (pa, list, r = 0.022, m = tGreen) => struts(pa, list.map(([a, b, rr]) => [V3(...a), V3(...b), rr || r]), m);
    const B = (pa, w, h, d, x, y, z, m, r = 0.02) => rbox(pa, w, h, d, x, y, z, m, r);
    // net: knotted black mesh, white tape and cord, centre strap, green posts with winders, singles sticks
    { const net = new THREE.Group(); vT.root.add(net);
      const hz = 6.4, top = z => 0.914 + (1.07 - 0.914) * Math.pow(Math.abs(z) / hz, 2);
      net.add(nets.courtNet(hz, top));
      for (const sz of [-1, 1]) { cyl(net, 0.045, 1.08, 'y', 0, 0.54, sz * hz, tGreen, 14); const cap = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), tGreen); cap.position.set(0, 1.085, sz * hz); net.add(cap);
        B(net, 0.07, 0.12, 0.05, 0, 0.82, sz * (hz + 0.06), tGreen, 0.01); const h = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.008, 6, 14), tWhite); h.position.set(0.06, 0.82, sz * (hz + 0.08)); h.rotation.y = Math.PI / 2; net.add(h);
        cyl(net, 0.012, 1.07, 'y', 0, 0.535, sz * 5.029, tWhite, 8); }
      quiet(net); vT.fix.push({ o: net, kind: 'grow', t0: 0.62 }); tennis.net = net; }
    // umpire's chair: tall painted frame, ladder at the back, platform, bucket seat, front panel
    { const ch = new THREE.Group(); ch.position.set(0, 0, 7.4); vT.root.add(ch);
      const f = [[-0.42, -0.42], [0.42, -0.42], [0.42, 0.42], [-0.42, 0.42]];
      T(ch, f.map(([x, z]) => [[x * 1.35, 0, z * 1.35], [x, 1.85, z], 0.03]));
      T(ch, [[[-0.52, 0.7, -0.52], [0.52, 0.7, -0.52]], [[-0.52, 0.7, 0.52], [0.52, 0.7, 0.52]], [[-0.52, 0.7, -0.52], [-0.52, 0.7, 0.52]], [[0.52, 0.7, -0.52], [0.52, 0.7, 0.52]],
        [[-0.48, 1.3, -0.48], [0.48, 1.3, -0.48]], [[-0.48, 1.3, 0.48], [0.48, 1.3, 0.48]]], 0.02);
      for (let y = 0.3; y < 1.8; y += 0.3) T(ch, [[[-0.24, y, 0.5 + (1.8 - y) * 0.12], [0.24, y, 0.5 + (1.8 - y) * 0.12], 0.016]]);
      T(ch, [[[-0.26, 0, 0.72], [-0.26, 1.9, 0.48]], [[0.26, 0, 0.72], [0.26, 1.9, 0.48]]], 0.02);
      B(ch, 1.0, 0.06, 1.0, 0, 1.88, 0, tGreen, 0.02);
      B(ch, 0.56, 0.1, 0.5, 0, 2.18, 0.1, tCloth, 0.04); B(ch, 0.56, 0.62, 0.08, 0, 2.5, 0.36, tCloth, 0.04);
      for (const sx of [-1, 1]) B(ch, 0.06, 0.05, 0.42, sx * 0.3, 2.42, 0.12, tGreen, 0.01);
      T(ch, [[[-0.3, 1.9, 0.1], [-0.3, 2.42, 0.1]], [[0.3, 1.9, 0.1], [0.3, 2.42, 0.1]]], 0.015);
      B(ch, 0.9, 0.5, 0.05, 0, 2.15, -0.5, tGreen, 0.01);                                                   // front panel
      const [pc, pg] = cnv(512, 256); pg.fillStyle = '#0f3a25'; pg.fillRect(0, 0, 512, 256); pg.strokeStyle = 'rgba(240,236,230,0.8)'; pg.lineWidth = 6; pg.strokeRect(12, 12, 488, 232); pg.fillStyle = '#efece7'; pg.font = FONT(800, 64); LS(pg, '6px'); pg.textAlign = 'center'; pg.textBaseline = 'middle'; pg.fillText('MATT KING', 256, 132);
      const pm = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 0.42), new THREE.MeshStandardMaterial({ map: texOf(pc), roughness: 0.6 })); pm.position.set(0, 2.15, -0.53); pm.rotation.y = Math.PI; ch.add(pm);
      B(ch, 0.5, 0.03, 0.34, 0, 2.43, -0.32, tGreen, 0.01); const tab = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.18), new THREE.MeshBasicMaterial({ color: C('#7fa2c8').multiplyScalar(0.8) })); tab.rotation.x = -Math.PI / 2 + 0.5; tab.position.set(0, 2.47, -0.3); ch.add(tab);
      grow(vT, ch, 0.63); tennis.kit.push(ch); }
    // player benches: a high-back chair, a towel table, a racket bag, bottles, and a parasol over it all
    const parasol = (pa, x, z) => { const g = new THREE.Group(); g.position.set(x, 0, z); pa.add(g);
      cyl(g, 0.022, 2.35, 'y', 0, 1.18, 0, tWhite, 10); const base = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.08, 16), tGreen); base.position.y = 0.04; g.add(base);
      const can = new THREE.Mesh(new THREE.ConeGeometry(1.0, 0.34, 8, 1, true), new THREE.MeshStandardMaterial({ color: C('#0e3a22'), roughness: 0.8, side: THREE.DoubleSide, flatShading: true })); can.position.y = 2.42; g.add(can);
      const val = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.1, 8, 1, true), new THREE.MeshStandardMaterial({ color: C('#efece7'), roughness: 0.8, side: THREE.DoubleSide, flatShading: true })); val.position.y = 2.2; g.add(val);
      const rib = []; for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; rib.push([[0, 2.58, 0], [Math.cos(a) * 0.98, 2.26, Math.sin(a) * 0.98], 0.008], [[0, 1.95, 0], [Math.cos(a) * 0.5, 2.38, Math.sin(a) * 0.5], 0.006]); } T(g, rib, 0.008, tWhite);
      const fin = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), tWhite); fin.position.y = 2.62; g.add(fin); return g; };
    const chair = (pa, x, z, ry, hi) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; pa.add(g);
      T(g, [[[-0.22, 0, -0.2], [-0.22, 0.46, -0.2]], [[0.22, 0, -0.2], [0.22, 0.46, -0.2]], [[-0.22, 0, 0.2], [-0.22, hi ? 1.0 : 0.85, 0.24]], [[0.22, 0, 0.2], [0.22, hi ? 1.0 : 0.85, 0.24]]], 0.016);
      B(g, 0.5, 0.06, 0.46, 0, 0.47, 0, tCloth, 0.02); B(g, 0.5, hi ? 0.5 : 0.36, 0.05, 0, hi ? 0.76 : 0.68, 0.23, tCloth, 0.02);
      if (hi) for (const sx of [-1, 1]) B(g, 0.05, 0.04, 0.4, sx * 0.27, 0.66, 0.02, tGreen, 0.01);
      return g; };
    for (const sx of [-1, 1]) {
      const g = new THREE.Group(); g.position.set(sx * 2.5, 0, 7.0); vT.root.add(g);
      chair(g, 0, 0, Math.PI, true);
      B(g, 0.55, 0.5, 0.4, sx * 0.75, 0.25, -0.05, tGreen, 0.03);                                           // towel table
      for (let k = 0; k < 3; k++) B(g, 0.4, 0.05, 0.28, sx * 0.75, 0.53 + k * 0.05, -0.05, towel, 0.02);
      const bag = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.62, 6, 14), sx > 0 ? purple : tGreen); bag.rotation.z = Math.PI / 2; bag.position.set(-sx * 0.6, 0.15, 0.25); bag.scale.set(1, 1, 0.8); g.add(bag);
      T(g, [[[-sx * 0.95, 0.27, 0.25], [-sx * 0.25, 0.27, 0.25], 0.012]], 0.012, tWhite);
      for (let k = 0; k < 3; k++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.24, 10), new THREE.MeshPhysicalMaterial({ color: C(k ? '#cfe2ec' : '#e8e2d2'), roughness: 0.15, transmission: 0, transparent: true, opacity: 0.85 })); b.position.set(sx * 0.75 + (k - 1) * 0.1, 0.12, -0.35); g.add(b); }
      parasol(g, sx * 0.15, 0.35);
      grow(vT, g, 0.64); tennis.kit.push(g);
    }
    // line judges and the ball crew: folding chairs on the baselines and service lines, towel boxes in the corners
    { const lj = new THREE.Group(); vT.root.add(lj);
      [[-13.6, -4.6, -Math.PI / 2], [-13.6, 4.6, -Math.PI / 2], [13.6, -4.6, Math.PI / 2], [13.6, 4.6, Math.PI / 2], [-6.4, -6.6, 0], [6.4, 6.6, Math.PI]].forEach(([x, z, ry]) => chair(lj, x, z, ry, false));
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) { B(lj, 0.5, 0.55, 0.4, sx * 15.6, 0.28, sz * 6.9, tGreen, 0.03); B(lj, 0.42, 0.05, 0.32, sx * 15.6, 0.58, sz * 6.9, towel, 0.02); }
      grow(vT, lj, 0.65); tennis.kit.push(lj); }
    // dark green backdrop walls with the name stitched in white
    const wallTex = (len, h) => { const W = Math.round(len * 48), Hh = Math.round(h * 48), [c, g] = cnv(Math.min(4096, W), Hh); g.fillStyle = '#123522'; g.fillRect(0, 0, c.width, Hh); g.fillStyle = 'rgba(240,238,234,0.85)'; g.font = FONT(800, Hh * 0.3); LS(g, '6px'); g.textBaseline = 'middle'; for (let x = 40; x < c.width; x += 640) g.fillText('MATT KING', x, Hh * 0.5); g.fillStyle = 'rgba(120,70,140,0.85)'; g.fillRect(0, Hh - 6, c.width, 6); return texOf(c); };
    // each wall is long along x with its printed face on +z, turned to face the court
    const wall = (len, h, x, z, ry) => { const m = new THREE.Mesh(new THREE.BoxGeometry(len, h, 0.15), [green, green, green, green, new THREE.MeshStandardMaterial({ map: wallTex(len, h), roughness: 0.8 }), green]); m.position.set(x, h / 2, z); m.rotation.y = ry; vT.root.add(m); grow(vT, m, 0.63); };
    for (const sx of [-1, 1]) wall(18.4, 1.6, sx * 18.25, 0, -sx * Math.PI / 2);
    for (const sz of [-1, 1]) wall(30, 1.0, 0, sz * 9.05, sz > 0 ? Math.PI : 0);
    // traditional scoreboard on the far stand
    const [c, g] = cnv(1024, 380); g.fillStyle = '#0f2c1c'; g.fillRect(0, 0, 1024, 380); g.strokeStyle = 'rgba(240,238,234,0.5)'; g.lineWidth = 4; g.strokeRect(14, 14, 996, 352);
    g.fillStyle = 'rgba(240,238,234,0.75)'; g.font = FONT(800, 30); LS(g, '8px'); g.textBaseline = 'alphabetic'; g.fillText('CENTRE COURT', 50, 76);
    [['NEW FORMATS', '40', RED], ['SAME OLD', '0', CHALK]].forEach(([n, v, col], i) => { const y = 190 + i * 120; g.fillStyle = CHALK; g.font = FONT(800, 78); LS(g, '2px'); g.fillText(n, 50, y); g.fillStyle = col; g.textAlign = 'right'; g.fillText(v, 974, y); g.textAlign = 'left'; });
    const sb = new THREE.Group(); sb.position.set(0, 7.6, -9.2); vT.root.add(sb);
    rbox(sb, 9.6, 3.8, 0.3, 0, 0, -0.1, 'dark', 0.08); const pm = new THREE.Mesh(new THREE.PlaneGeometry(9.2, 3.42), new THREE.MeshBasicMaterial({ map: texOf(c), color: C('#ffffff').multiplyScalar(0.95) })); pm.position.z = 0.07; sb.add(pm);
    quiet(sb); vT.fix.push({ o: sb, kind: 'drop', y0: 7.6, h: 14, t0: 0.6 });
  }

  // ---------- per frame
  const tmp = new THREE.Vector3(), a0 = new THREE.Vector3(), a1 = new THREE.Vector3(), dir = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), sc = new THREE.Vector3(), q = new THREE.Quaternion(), mxm = new THREE.Matrix4();
  function update({ camera, fdX, driveOn, time }) {
    if (bbRoof && vB.root.visible) { tmp.copy(camera.position); vB.root.worldToLocal(tmp); bbRoof.visible = bbRoof.visible && tmp.y < bbRoof.position.y - 2.5; }
    if (skycam && vN.root.visible) {
      const x = driveOn ? fdX - 6 : -19 + Math.sin(time * 0.2) * 6; skycam.position.set(skycam.position.x + (x - skycam.position.x) * 0.06, 21 + Math.sin(time * 0.7) * 0.4, 6);
      masts.forEach(([mx, mz], i) => { a0.set(skycam.position.x, skycam.position.y + 0.3, skycam.position.z); a1.set(mx * 0.97, 46, mz * 0.97); dir.subVectors(a1, a0); q.setFromUnitVectors(up, dir.clone().normalize()); sc.set(1, dir.length(), 1); mxm.compose(a0, q, sc); cables.setMatrixAt(i, mxm); }); cables.instanceMatrix.needsUpdate = true;
      chains.visible = driveOn; if (driveOn) chains.position.x = fdX;
    }
  }
  return { update, tennis };
}
