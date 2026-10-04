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

  // ---------- shared builders
  // sweep a 2D profile [(a, y)] along local x from x0 to x1; a maps to z. Returns a grid geometry (nu along x, profile along v)
  const sweep = (pts, x0, x1, nu = 2) => {
    const nv = pts.length, pos = [], idx = [];
    for (let i = 0; i <= nu; i++) for (let j = 0; j < nv; j++) pos.push(x0 + (x1 - x0) * i / nu, pts[j][1], pts[j][0]);
    for (let i = 0; i < nu; i++) for (let j = 0; j < nv - 1; j++) { const a = i * nv + j, b = a + nv; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
  };
  const tube = (parent, pts, r, mat, seg = 32, rs = 8) => { const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), seg, r, rs, false), mat); parent.add(m); return m; };
  const bandTex = (cols, n, w = 32, h = 256) => { const [c, g] = cnv(w, h); for (let k = 0; k < n; k++) { g.fillStyle = cols[k % cols.length]; g.fillRect(0, k * h / n, w, h / n + 1); } return texOf(c); };
  // cloth that waves: keeps its rest positions and pushes them along z each frame
  const cloths = [], M4 = new THREE.Matrix4();
  const cloth = (parent, w, h, mat, amp = 0.06, freq = 5, nx = 10, ny = 4) => {
    const geo = new THREE.PlaneGeometry(w, h, nx, ny); geo.translate(w / 2, -h / 2, 0);
    const m = new THREE.Mesh(geo, mat); parent.add(m); cloths.push({ m, base: geo.attributes.position.array.slice(), w, amp, freq, ph: Math.random() * 6 }); return m;
  };
  const paint = new THREE.MeshStandardMaterial({ color: C('#f4f3f1'), roughness: 0.3, metalness: 0.1 }); paint.userData.env = 0.6;
  const blackAl = new THREE.MeshStandardMaterial({ color: C('#121212'), roughness: 0.35, metalness: 0.6 }); blackAl.userData.env = 0.6;
  const flagRed = new THREE.MeshStandardMaterial({ color: C(RED), roughness: 0.75, side: THREE.DoubleSide, emissive: C(RED), emissiveIntensity: 0.12 });
  const chalkLine = new THREE.MeshBasicMaterial({ color: C(CHALK).multiplyScalar(0.85), polygonOffset: true, polygonOffsetFactor: -2 });
  const person = (() => {   // a simple low-poly figure: legs, torso with a vest, arms, head
    const skin = new THREE.MeshStandardMaterial({ color: C('#8a6a55'), roughness: 0.7 }), trousers = new THREE.MeshStandardMaterial({ color: C('#1a1918'), roughness: 0.8 });
    const legG = new THREE.CapsuleGeometry(0.075, 0.72, 4, 8), torsoG = new THREE.CapsuleGeometry(0.17, 0.42, 4, 10), armG = new THREE.CapsuleGeometry(0.05, 0.5, 4, 6), headG = new THREE.SphereGeometry(0.11, 14, 10);
    return (vest) => { const p = new THREE.Group();
      for (const s of [-1, 1]) { const l = new THREE.Mesh(legG, trousers); l.position.set(0, 0.45, s * 0.1); p.add(l); }
      const t = new THREE.Mesh(torsoG, vest); t.position.y = 1.18; t.scale.set(0.75, 1, 1); p.add(t);
      const arms = []; for (const s of [-1, 1]) { const a = new THREE.Group(); a.position.set(0, 1.42, s * 0.22); const m = new THREE.Mesh(armG, vest); m.position.y = -0.3; a.add(m); p.add(a); arms.push(a); }
      const hd = new THREE.Mesh(headG, skin); hd.position.y = 1.72; p.add(hd); p.userData.arms = arms; return p; };
  })();

  // ================= FOOTBALL =================
  const goalNets = [];
  {
    // goals: elliptical white posts, box nets on stanchions that sag between the frame and ripple when the ball goes in
    const netM = nets.knot('#efeeea'), CELL = 0.12, HW = 3.72, POST = 0.06;
    const prof = new THREE.CatmullRomCurve3([V3(POST, 2.5, 0), V3(0.75, 2.47, 0), V3(1.3, 2.36, 0), V3(1.66, 2.06, 0), V3(1.88, 1.4, 0), V3(1.98, 0.62, 0), V3(2.0, 0.03, 0)], false, 'centripetal');
    const L = prof.getLength(), NU = 44, NV = 34;
    const postG = new THREE.CylinderGeometry(POST, POST, 2.56, 18); postG.scale(1, 1, 1.0); postG.translate(0, 1.28, 0);
    const barG = new THREE.CylinderGeometry(POST, POST, 2 * HW + 2 * POST, 18); barG.rotateX(Math.PI / 2);
    for (const sx of [-1, 1]) {
      const outer = new THREE.Group(); outer.position.set(sx * 52.5, 0, 0); vF.root.add(outer);
      const g = new THREE.Group(); g.scale.x = sx; outer.add(g);
      for (const sz of [-1, 1]) { const m = new THREE.Mesh(postG, paint); m.position.set(POST, 0, sz * HW); g.add(m); }
      const bar = new THREE.Mesh(barG, paint); bar.position.set(POST, 2.5, 0); g.add(bar);
      for (const sz of [-1, 1]) { const j = new THREE.Mesh(new THREE.SphereGeometry(POST, 14, 10), paint); j.position.set(POST, 2.5, sz * HW); g.add(j); }
      // the net surface: roof and back in one sheet, metric UVs so the mesh stays 12 cm everywhere
      const pos = new Float32Array((NU + 1) * (NV + 1) * 3), uv = new Float32Array((NU + 1) * (NV + 1) * 2), base = [], wt = [];
      for (let j = 0; j <= NV; j++) { const s = j / NV, pt = prof.getPointAt(s);
        for (let i = 0; i <= NU; i++) { const u = i / NU, z = -HW + 2 * HW * u, f = Math.pow(Math.sin(Math.PI * u), 0.7) * Math.sin(Math.PI * s), k = (j * (NU + 1) + i);
          const x = pt.x + 0.07 * f, y = pt.y - 0.13 * f * (pt.y > 1.2 ? 1 : 0.4);
          pos.set([x, y, z], k * 3); uv.set([z / CELL, s * L / CELL], k * 2); base.push(x, y, z); wt.push(f); } }
      const idx = []; for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const a = j * (NU + 1) + i, b = a + NU + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
      const ng = new THREE.BufferGeometry(); ng.setAttribute('position', new THREE.BufferAttribute(pos, 3)); ng.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); ng.setIndex(idx); ng.computeVertexNormals();
      const net = new THREE.Mesh(ng, netM); g.add(net);
      goalNets.push({ sx, geo: ng, base: Float32Array.from(base), wt, dirty: false });
      // side panels, cut to the same profile
      const sh = new THREE.Shape(); sh.moveTo(POST, 0); for (let k = 0; k <= 40; k++) { const p = prof.getPointAt(k / 40); sh.lineTo(p.x, p.y); } sh.lineTo(POST, 0);
      for (const sz of [-1, 1]) { const sg = nets.metric(new THREE.ShapeGeometry(sh, 40), CELL, ['x', 'y']); const m = new THREE.Mesh(sg, netM); m.position.z = sz * HW; g.add(m); }
      // stanchion frame: tubes along the profile, ground bars, net hooks along the crossbar
      for (const sz of [-1, 1]) { const pts = prof.getSpacedPoints(24).map(p => V3(p.x, p.y, sz * HW)); tube(g, pts, 0.022, paint, 48, 8); }
      cyl(g, 0.025, 2 * HW, 'z', 2.0, 0.025, 0, paint, 10);
      for (const sz of [-1, 1]) cyl(g, 0.022, 2.0 - POST, 'x', (2.0 + POST) / 2, 0.022, sz * HW, paint, 10);
      const hk = new THREE.InstancedMesh(new THREE.TorusGeometry(0.035, 0.008, 6, 10), paint, 25), mx = new THREE.Matrix4();
      for (let k = 0; k < 25; k++) { mx.makeRotationY(Math.PI / 2).setPosition(POST + 0.05, 2.5, -HW + 2 * HW * k / 24); hk.setMatrixAt(k, mx); } g.add(hk);
      quiet(outer); outer.traverse(m => { if (m.isMesh && m.material === netM) m.castShadow = false; });
      vF.fix.push({ o: outer, kind: 'growY', t0: 0.62 });
    }
    // corner flags: spring base, red and white banded pole, a red flag in the wind
    const poleTex = bandTex([RED, '#f3f2f2'], 8); poleTex.wrapS = poleTex.wrapT = THREE.RepeatWrapping;
    const poleM = new THREE.MeshStandardMaterial({ map: poleTex, roughness: 0.45 });
    for (const x of [-52.5, 52.5]) for (const z of [-34, 34]) {
      const g = new THREE.Group(); g.position.set(x, 0, z); vF.root.add(g);
      cyl(g, 0.04, 0.1, 'y', 0, 0.05, 0, blackAl, 12); cyl(g, 0.026, 0.12, 'y', 0, 0.16, 0, 'steel', 10);
      cyl(g, 0.018, 1.5, 'y', 0, 0.75 + 0.2, 0, poleM, 10); const cap = new THREE.Mesh(new THREE.SphereGeometry(0.024, 10, 8), paint); cap.position.y = 1.7; g.add(cap);
      const fw = new THREE.Group(); fw.position.set(0, 1.68, 0); fw.rotation.y = 0.6; g.add(fw); cloth(fw, 0.46, 0.36, flagRed, 0.05, 6);
      grow(vF, g, 0.64);
    }
    // dugouts on the halfway line: curved perspex shell on black ribs, padded seats on two tiers, kit around them
    const nameTex = side => { const [nc, ngx] = cnv(1024, 128); ngx.fillStyle = '#121111'; ngx.fillRect(0, 0, 1024, 128); ngx.fillStyle = RED; ngx.fillRect(0, 116, 1024, 12); ngx.fillStyle = CHALK; ngx.font = FONT(800, 72); LS(ngx, '14px'); ngx.textAlign = 'center'; ngx.textBaseline = 'middle'; ngx.fillText(side, 512, 60); return texOf(nc); };
    const canopy = [[1.8, 2.58], [1.1, 2.66], [0.2, 2.5], [-0.55, 2.16], [-0.98, 1.74]];
    const canopyC = new THREE.CatmullRomCurve3(canopy.map(([z, y]) => V3(0, y, z))), canopyPts = canopyC.getSpacedPoints(20).map(p => [p.z, p.y]);
    const bottleM = new THREE.MeshStandardMaterial({ color: C('#d9e2e6'), roughness: 0.15, transparent: true, opacity: 0.7 }), crateM = new THREE.MeshStandardMaterial({ color: C('#1d1c1b'), roughness: 0.6 });
    for (const [x, side] of [[-9, 'HOME'], [9, 'AWAY']]) {
      const g = new THREE.Group(); g.position.set(x, 0, -36.0); g.rotation.y = Math.PI; vF.root.add(g);
      const DL = 8.6;
      rbox(g, DL + 0.4, 0.22, 2.9, 0, 0.11, 0.35, 'concreteL', 0.05);
      rbox(g, DL, 2.4, 0.14, 0, 1.4, 1.74, 'dark', 0.04);
      const np = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 0.8), new THREE.MeshBasicMaterial({ map: nameTex(side + '  ·  MATT KING'), color: C('#ffffff').multiplyScalar(0.9) })); np.position.set(0, 2.05, 1.66); np.rotation.y = Math.PI; g.add(np);
      box(g, DL - 0.2, 0.32, 0.9, 0, 0.38, 1.0, 'concreteL');
      seatRow(g, -3.6, 3.6, 0.6, 0.15, 0.22, 1, seatRed); seatRow(g, -3.6, 3.6, 0.6, 1.0, 0.54, 1, seatRed);
      const shell = new THREE.Mesh(sweep(canopyPts, -DL / 2, DL / 2, 8), glass); g.add(shell);
      for (const sx of [-1, 1]) {
        const s = new THREE.Shape(); s.moveTo(1.8, 0.22); canopyPts.forEach(([z, y]) => s.lineTo(z, y)); s.lineTo(-0.5, 0.22); s.lineTo(1.8, 0.22);
        const fg = new THREE.ShapeGeometry(s, 20); fg.rotateY(-Math.PI / 2); const fin = new THREE.Mesh(fg, glass); fin.position.x = sx * DL / 2; g.add(fin);
      }
      for (let k = 0; k <= 6; k++) { const xx = -DL / 2 + DL * k / 6; tube(g, canopyPts.map(([z, y]) => V3(xx, y + 0.02, z)), 0.03, blackAl, 24, 6); }
      cyl(g, 0.035, DL, 'x', 0, canopyPts[canopyPts.length - 1][1], canopyPts[canopyPts.length - 1][0], blackAl, 8);
      for (const sx of [-1, 1]) cyl(g, 0.035, 1.55, 'y', sx * DL / 2, 0.22 + 0.78, -0.95, blackAl, 8);
      // drinks crate and a ball bag at the open end
      const cr = new THREE.Group(); cr.position.set(DL / 2 + 0.7, 0, -0.4); g.add(cr);
      rbox(cr, 0.6, 0.3, 0.42, 0, 0.15, 0, crateM, 0.03);
      const bm = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.035, 0.035, 0.24, 10), bottleM, 12); for (let k = 0; k < 12; k++) { M4.makeTranslation(-0.21 + (k % 4) * 0.14, 0.42, -0.12 + Math.floor(k / 4) * 0.12); bm.setMatrixAt(k, M4); } cr.add(bm);
      const bb = new THREE.InstancedMesh(new THREE.SphereGeometry(0.11, 14, 10), paint, 5); [[0, 0.11, 0], [0.2, 0.11, 0.05], [0.1, 0.11, 0.2], [0.1, 0.3, 0.08], [-0.08, 0.11, 0.2]].forEach(([a, b, c], k) => { M4.makeTranslation(a, b, c); bb.setMatrixAt(k, M4); }); bb.position.set(-0.1, 0, 0.75); cr.add(bb);
      grow(vF, g, 0.63);
      // the technical area painted on the grass in front
      const ta = new THREE.Group(); ta.position.set(x, 0.02, -36.0); ta.rotation.y = Math.PI; vF.root.add(ta);
      const ln = (w, d, lx, lz) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), chalkLine); m.rotation.x = -Math.PI / 2; m.position.set(lx, 0, lz); ta.add(m); };
      for (let k = 0; k < 11; k++) ln(0.5, 0.06, -5.25 + k * 1.05, -1.6);
      for (const sx of [-1, 1]) for (let k = 0; k < 2; k++) ln(0.06, 0.4, sx * 5.5, -1.4 + k * 0.6);
      grow(vF, ta, 0.66);
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
    // gooseneck goalposts: padded base behind the end line, the neck curving forward to a 5.64 m crossbar at 3.05 m, uprights to 12.2 m, wind ribbons on top
    const yellow = new THREE.MeshStandardMaterial({ color: C('#f1c21b'), roughness: 0.32, metalness: 0.25 }); yellow.userData.env = 0.7;
    const padTex = (() => { const [c, g] = cnv(512, 256); g.fillStyle = '#7d1a0c'; g.fillRect(0, 0, 512, 256); g.fillStyle = RED; g.fillRect(0, 0, 512, 22); g.fillRect(0, 234, 512, 22);
      g.fillStyle = CHALK; g.font = FONT(800, 120); LS(g, '-6px'); g.textAlign = 'center'; g.textBaseline = 'middle'; for (const x of [128, 384]) g.fillText('MK', x, 134); const t = texOf(c); t.wrapS = THREE.RepeatWrapping; return t; })();
    const padM = new THREE.MeshStandardMaterial({ map: padTex, roughness: 0.62 });
    const ribbonM = new THREE.MeshStandardMaterial({ color: C('#ff5a1f'), roughness: 0.7, side: THREE.DoubleSide, emissive: C('#ff5a1f'), emissiveIntensity: 0.25 });
    for (const sx of [-1, 1]) {
      const outer = new THREE.Group(); outer.position.set(sx * 54.86, 0, 0); vN.root.add(outer);
      const g = new THREE.Group(); g.scale.x = sx; outer.add(g);
      const BX = 1.83, CY = 3.05, HW = 2.82;
      tube(g, [V3(BX, 0, 0), V3(BX, 1.6, 0), V3(BX, 2.45, 0), V3(BX - 0.18, 2.88, 0), V3(BX - 0.62, 3.05, 0), V3(0.6, CY, 0), V3(0, CY, 0)], 0.11, yellow, 64, 16);
      rbox(g, 0.7, 0.06, 0.7, BX, 0.03, 0, blackAl, 0.02);
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 2.1, 28, 1), padM); pad.position.set(BX, 1.08, 0); g.add(pad);
      for (const y of [0.03, 2.13]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.345, 0.345, 0.05, 28), new THREE.MeshStandardMaterial({ color: C('#1a1918'), roughness: 0.6 })); r.position.set(BX, y, 0); g.add(r); }
      const cb = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 2 * HW, 18), yellow); cb.rotation.x = Math.PI / 2; cb.position.y = CY; g.add(cb);
      const sl = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.13, 0.3, 18), yellow); sl.rotation.z = Math.PI / 2; sl.position.set(0.12, CY, 0); g.add(sl);
      for (const sz of [-1, 1]) {
        const up = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.075, 9.15, 16), yellow); up.position.set(0, CY + 4.575, sz * HW); g.add(up);
        const el = new THREE.Mesh(new THREE.SphereGeometry(0.085, 16, 10), yellow); el.position.set(0, CY, sz * HW); g.add(el);
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 14), yellow); cap.position.set(0, CY + 9.17, sz * HW); g.add(cap);
        const rb = new THREE.Group(); rb.position.set(0, CY + 9.12, sz * HW); rb.rotation.z = -Math.PI / 2; outer.add(rb); rb.position.x *= 1;
        cloth(rb, 1.07, 0.1, ribbonM, 0.08, 4, 12, 1);
      }
      quiet(outer); vN.fix.push({ o: outer, kind: 'grow', t0: 0.62 });
    }
    // sideline team areas: two-tier benches with padded seats, helmets lined up, Gatorade-style coolers on a table, heaters with glowing grilles, a kicking net
    const padSeat = new THREE.MeshStandardMaterial({ color: C('#1b1a19'), roughness: 0.55 });
    const shellG = new THREE.SphereGeometry(0.15, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.6); shellG.scale(1.15, 1, 0.95);
    const maskG = new THREE.TorusGeometry(0.165, 0.011, 6, 18, Math.PI); maskG.rotateX(-Math.PI / 2);
    const shellM = new THREE.MeshStandardMaterial({ color: C('#a01d0c'), roughness: 0.18, metalness: 0.35 }); shellM.userData.env = 1.0;
    const grill = new THREE.MeshBasicMaterial({ color: C('#ff6a2a').multiplyScalar(1.6) });
    const knet = nets.knot('#dddad4');
    for (const sz of [-1, 1]) {
      const g = new THREE.Group(); g.position.set(0, 0, sz * 27.4); vN.root.add(g);
      for (const r of [0, 1]) { const y = 0.46 + r * 0.3, z = r * sz * 0.9;
        rbox(g, 28, 0.1, 0.45, 0, y, z, padSeat, 0.04); rbox(g, 28, 0.06, 0.08, 0, y - 0.08, z + sz * 0.2, blackAl, 0.02);
        for (let x = -13; x <= 13; x += 2.6) box(g, 0.06, y, 0.06, x, y / 2, z, 'steel'); }
      // helmets on the front bench, facemasks toward the field
      const n = 18, hs = new THREE.InstancedMesh(shellG, shellM, n), hm = new THREE.InstancedMesh(maskG, paint, n), hm2 = new THREE.InstancedMesh(maskG, paint, n), rot = new THREE.Matrix4().makeRotationY(sz > 0 ? 0 : Math.PI);
      for (let k = 0; k < n; k++) { const x = -12.4 + k * 1.46 + (k % 3) * 0.12; M4.makeTranslation(x, 0.57, 0).multiply(rot); hs.setMatrixAt(k, M4); M4.makeTranslation(x, 0.55, 0).multiply(rot); hm.setMatrixAt(k, M4); M4.makeTranslation(x, 0.6, 0).multiply(rot); hm2.setMatrixAt(k, M4); }
      g.add(hs, hm, hm2);
      for (const x of [-16, 16]) {
        rbox(g, 1.6, 0.05, 0.7, x, 0.82, 0, blackAl, 0.02); for (const dx of [-0.7, 0.7]) box(g, 0.04, 0.8, 0.6, x + dx, 0.4, 0, 'steel');
        for (const dx of [-0.38, 0.38]) { cyl(g, 0.24, 0.6, 'y', x + dx, 1.15, 0, shellM, 24); cyl(g, 0.25, 0.07, 'y', x + dx, 1.48, 0, paint, 24); cyl(g, 0.03, 0.08, 'x', x + dx, 0.95, -sz * 0.25, paint, 8); }
        cyl(g, 0.045, 0.32, 'y', x, 1.0, 0.18, paint, 10);                                   // cup stack
        // heater: steel cabinet, hood, glowing grille facing the bench
        const hx = x + Math.sign(x) * 1.8; rbox(g, 0.9, 1.5, 0.6, hx, 0.75, sz * 1.3, 'steel', 0.06); rbox(g, 1.0, 0.12, 0.7, hx, 1.56, sz * 1.3, blackAl, 0.04);
        const gr = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.9), grill); gr.position.set(hx, 0.9, sz * 1.3 - sz * 0.305); gr.rotation.y = sz > 0 ? Math.PI : 0; g.add(gr);
        for (let k = 0; k < 6; k++) box(g, 0.68, 0.018, 0.02, hx, 0.5 + k * 0.16, sz * 1.3 - sz * 0.315, blackAl);
      }
      // kicking net at the end of the bench
      const kn = new THREE.Group(); kn.position.set(-19.5, 0, 0.6 * sz); kn.rotation.y = Math.PI / 2; g.add(kn);
      for (const dx of [-1.2, 1.2]) cyl(kn, 0.03, 2.6, 'y', dx, 1.3, 0, 'steel', 8); cyl(kn, 0.03, 2.4, 'x', 0, 2.6, 0, 'steel', 8); for (const dx of [-1.2, 1.2]) cyl(kn, 0.025, 1.2, 'z', dx, 0.02, -0.6, 'steel', 8);
      const kg = nets.metric(new THREE.PlaneGeometry(2.4, 2.58, 8, 8), 0.1, ['x', 'y']); { const p = kg.attributes.position; for (let i = 0; i < p.count; i++) { const u = (p.getX(i) + 1.2) / 2.4, v = (p.getY(i) + 1.29) / 2.58; p.setZ(i, -0.25 * Math.sin(Math.PI * u) * Math.sin(Math.PI * v)); } kg.computeVertexNormals(); }
      const km = new THREE.Mesh(kg, knet); km.position.y = 1.3; kn.add(km);
      grow(vN, g, 0.64);
    }
    // the chain crew: two rods joined by ten yards of chain, the down box, three crew in red vests
    chains = new THREE.Group(); vN.root.add(chains);
    const vest = new THREE.MeshStandardMaterial({ color: C(RED), roughness: 0.7, emissive: C(RED), emissiveIntensity: 0.1 });
    const flap = new THREE.MeshStandardMaterial({ color: C('#ff5a1f'), roughness: 0.6, emissive: C('#ff5a1f'), emissiveIntensity: 0.3 });
    const rod = (x, top) => { const p = new THREE.Group(); p.position.x = x; chains.add(p); cyl(p, 0.03, 2.45, 'y', 0, 1.225, 0, blackAl, 10); top(p);
      const man = person(vest); man.position.set(0.05, 0, 0.4); man.rotation.y = Math.PI / 2; for (const a of man.userData.arms) a.rotation.z = 0.75; p.add(man); return p; };
    rod(0, p => { const f = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.42, 4, 1), flap); f.rotation.y = Math.PI / 4; f.position.y = 2.6; p.add(f); });
    rod(-9.14, p => { const f = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.42, 4, 1), flap); f.rotation.y = Math.PI / 4; f.position.y = 2.6; p.add(f); });
    const downTex = (() => { const [c, g] = cnv(256, 256); g.fillStyle = '#121111'; g.fillRect(0, 0, 256, 256); g.strokeStyle = '#ff5a1f'; g.lineWidth = 14; g.strokeRect(7, 7, 242, 242); g.fillStyle = CHALK; g.font = FONT(800, 190); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('2', 128, 140); return texOf(c); })();
    rod(-9.14 * 0.62, p => { rbox(p, 0.48, 0.5, 0.12, 0, 2.7, 0, blackAl, 0.03); for (const s of [-1, 1]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42), new THREE.MeshBasicMaterial({ map: downTex, color: C('#ffffff').multiplyScalar(1.3) })); m.position.set(0, 2.7, s * 0.065); m.rotation.y = s > 0 ? 0 : Math.PI; p.add(m); } });
    { const N = 150, link = new THREE.InstancedMesh(new THREE.TorusGeometry(0.03, 0.008, 4, 8), mats.steel, N);
      for (let k = 0; k < N; k++) { const t = k / (N - 1), x = -9.14 * t, z = 0.25 * Math.sin(Math.PI * t) + 0.04 * Math.sin(t * 40);
        M4.makeRotationX(k % 2 ? Math.PI / 2 : 0).premultiply(new THREE.Matrix4().makeRotationY(0)).setPosition(x, 0.02 + (k % 2 ? 0.005 : 0.02), z); link.setMatrixAt(k, M4); } chains.add(link); }
    chains.position.z = 26.0; chains.visible = false; quiet(chains);
    // Skycam: carbon body slung from four cables, arms out to the cable fittings, a stabilised gimbal underneath that tracks the play
    const pod = new THREE.Group(); vN.root.add(pod);
    rbox(pod, 0.8, 0.34, 0.8, 0, 0.2, 0, blackAl, 0.1);
    const brand = (() => { const [c, g] = cnv(256, 64); g.fillStyle = '#111'; g.fillRect(0, 0, 256, 64); g.fillStyle = CHALK; g.font = FONT(800, 40); LS(g, '6px'); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('MK CAM', 128, 34); g.fillStyle = RED; g.fillRect(0, 58, 256, 6); return texOf(c); })();
    for (let k = 0; k < 4; k++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.16), new THREE.MeshBasicMaterial({ map: brand })); const a = k * Math.PI / 2; m.position.set(Math.sin(a) * 0.405, 0.2, Math.cos(a) * 0.405); m.rotation.y = a; pod.add(m); }
    for (const [ax, az] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { tube(pod, [V3(ax * 0.3, 0.3, az * 0.3), V3(ax * 0.48, 0.42, az * 0.48), V3(ax * 0.56, 0.5, az * 0.56)], 0.03, blackAl, 8, 6); const ft = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), mats.steel); ft.position.set(ax * 0.56, 0.5, az * 0.56); pod.add(ft); }
    const yaw = new THREE.Group(); yaw.position.y = 0.02; pod.add(yaw);
    cyl(yaw, 0.05, 0.12, 'y', 0, -0.06, 0, blackAl, 12);
    const yr = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.025, 8, 32), blackAl); yr.rotation.x = Math.PI / 2; yr.position.y = -0.14; yaw.add(yr);
    for (const s of [-1, 1]) rbox(yaw, 0.05, 0.36, 0.06, 0, -0.3, s * 0.3, blackAl, 0.02);
    const pitch = new THREE.Group(); pitch.position.y = -0.42; yaw.add(pitch);
    cyl(pitch, 0.03, 0.62, 'z', 0, 0, 0, mats.steel, 10);
    rbox(pitch, 0.34, 0.26, 0.4, -0.04, 0, 0, blackAl, 0.05);
    cyl(pitch, 0.1, 0.36, 'x', 0.3, 0, 0, blackAl, 20); cyl(pitch, 0.115, 0.06, 'x', 0.47, 0, 0, blackAl, 20);
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.095, 24), new THREE.MeshStandardMaterial({ color: C('#0e1a26'), roughness: 0.02, metalness: 0.9 })); lens.material.userData.env = 2; lens.position.x = 0.505; lens.rotation.y = Math.PI / 2; pitch.add(lens);
    const tally = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), new THREE.MeshBasicMaterial({ color: C(RED).multiplyScalar(3) })); tally.position.set(0.0, 0.16, 0); pitch.add(tally);
    pod.userData.yaw = yaw; pod.userData.pitch = pitch;
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
  const look = new THREE.Vector3();
  function update({ camera, fdX, driveOn, time, goalT = -10, ballX = 0, ballZ = 0 }) {
    // cloth: flags and ribbons ripple in a light wind
    for (const c of cloths) { if (!c.m.parent || !c.m.parent.visible) continue; const p = c.m.geometry.attributes.position, b = c.base;
      for (let i = 0; i < p.count; i++) { const x = b[i * 3], k = x / c.w; p.array[i * 3 + 2] = b[i * 3 + 2] + c.amp * k * Math.sin(time * c.freq - x * 9 + c.ph) + c.amp * 0.3 * k * Math.sin(time * c.freq * 1.7 + b[i * 3 + 1] * 7); }
      p.needsUpdate = true; }
    // goal nets bulge where the ball went in, then settle
    if (vF.root.visible) for (const n of goalNets) {
      const dt = time - goalT, live = dt >= 0 && dt < 2.4 && Math.sign(ballX) === n.sx, p = n.geo.attributes.position, b = n.base;
      if (!live && !n.dirty) continue;
      const e = live ? Math.sin(Math.min(dt * 5, Math.PI / 2)) * Math.exp(-dt * 1.6) * (1 + 0.25 * Math.sin(dt * 14)) : 0;
      for (let i = 0; i < p.count; i++) { const z = b[i * 3 + 2], y = b[i * 3 + 1], w = Math.exp(-((z - ballZ) ** 2) / 2.2) * Math.exp(-((y - 0.9) ** 2) / 1.4) * n.wt[i] * 2.2;
        p.array[i * 3] = b[i * 3] + 0.55 * e * w; }
      p.needsUpdate = true; n.geo.computeVertexNormals(); n.dirty = live; }
    if (bbRoof && vB.root.visible) { tmp.copy(camera.position); vB.root.worldToLocal(tmp); bbRoof.visible = bbRoof.visible && tmp.y < bbRoof.position.y - 2.5; }
    if (skycam && vN.root.visible) {
      const x = driveOn ? fdX - 6 : -19 + Math.sin(time * 0.2) * 6; skycam.position.set(skycam.position.x + (x - skycam.position.x) * 0.06, 21 + Math.sin(time * 0.7) * 0.4, 6);
      masts.forEach(([mx, mz], i) => { a0.set(skycam.position.x + Math.sign(mx) * 0.56, skycam.position.y + 0.5, skycam.position.z + Math.sign(mz) * 0.56); a1.set(mx * 0.97, 46, mz * 0.97); dir.subVectors(a1, a0); q.setFromUnitVectors(up, dir.clone().normalize()); sc.set(1, dir.length(), 1); mxm.compose(a0, q, sc); cables.setMatrixAt(i, mxm); }); cables.instanceMatrix.needsUpdate = true;
      look.set(driveOn ? fdX - 4 : 0, 0, 0).sub(skycam.position); const yw = skycam.userData.yaw, pt = skycam.userData.pitch;
      yw.rotation.y += (Math.atan2(-look.z, look.x) - yw.rotation.y) * 0.08; pt.rotation.z += (-Math.atan2(-look.y, Math.hypot(look.x, look.z)) - pt.rotation.z) * 0.08;
      chains.visible = driveOn; if (driveOn) chains.position.x = fdX;
    }
  }
  return { update, tennis };
}
