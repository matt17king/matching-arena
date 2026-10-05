// Fight night: the ring, ringside, the ring walk and the press-conference stage. Local metres; the venue root is scaled by RG.
import { RING } from './arena-sports.js';

export function buildRingDetail(X) {
  const { THREE, vRg, box, rbox, cyl, struts, cnv, texOf, FONT, LS, C, V3, RED, CHALK, LOWQ, mats, glowTex, redMat, makeBoard, seatGeoBase } = X;
  const { half: H, ropes: R, walk: [W0, W1, WW], stage: [S0, S1, SZ] } = RING, PH = 1.0;      // PH: platform height
  const quiet = o => { o.traverse(m => { m.userData.noCast = true; }); return o; };
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion();
  const std = (col, r = 0.6, m = 0, extra = {}) => new THREE.MeshStandardMaterial({ color: C(col), roughness: r, metalness: m, ...extra });
  const black = std('#121111', 0.55), satinRed = std('#a3190a', 0.32, 0.1), padRed = std('#b3200e', 0.5), padBlack = std('#161515', 0.5), padWhite = std('#e9e6e2', 0.55);
  const chrome = std('#9a9792', 0.25, 0.85); chrome.userData.env = 1.2;
  const gold = std('#e0b84f', 0.22, 0.85, { emissive: C('#5a420e'), emissiveIntensity: 0.45 }); gold.userData.env = 1.6;
  const glow = col => new THREE.MeshBasicMaterial({ color: C(col).multiplyScalar(1.6) });
  const plane = (parent, w, h, map, x, y, z, ry = 0, basic = false, bright = 1) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), basic ? new THREE.MeshBasicMaterial({ map, color: C('#ffffff').multiplyScalar(bright) }) : new THREE.MeshStandardMaterial({ map, roughness: 0.7 }));
    m.position.set(x, y, z); m.rotation.y = ry; parent.add(m); return m;
  };
  const tex = (w, h, draw) => { const [c, g] = cnv(w, h); draw(g, w, h); const t = texOf(c); t.anisotropy = 8; return t; };
  const text = (g, s, x, y, size, col, w = 800, ls = '0px', align = 'center') => { g.fillStyle = col; g.font = FONT(w, size); LS(g, ls); g.textAlign = align; g.textBaseline = 'middle'; g.fillText(s, x, y); };
  const mkLogo = (g, x, y, r) => { g.fillStyle = RED; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); text(g, 'MK', x, y + r * 0.06, r * 0.95, CHALK, 800, `${-r * 0.06}px`); };

  // ================= the ring =================
  const ring = new THREE.Group(); vRg.root.add(ring);
  // the canvas: off-white inside the ropes, black apron printed with the name, MK in the middle, red and black corners
  const canvasTex = tex(1024, 1024, (g, w) => {
    const k = w / (2 * H), r0 = (H - R) * k;
    g.fillStyle = '#151414'; g.fillRect(0, 0, w, w);
    g.fillStyle = '#d8d3cc'; g.fillRect(r0, r0, w - 2 * r0, w - 2 * r0);
    for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '0,0,0' : '255,255,255'},${Math.random() * 0.05})`; g.fillRect(r0 + Math.random() * (w - 2 * r0), r0 + Math.random() * (w - 2 * r0), 2 + Math.random() * 3, 2); }
    const tri = (cx, cy, sx, sy, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + sx * 1.3 * k, cy); g.lineTo(cx, cy + sy * 1.3 * k); g.fill(); };
    tri(r0, r0, 1, 1, 'rgba(236,48,19,.75)'); tri(w - r0, w - r0, -1, -1, 'rgba(20,19,19,.8)');
    mkLogo(g, w / 2, w / 2, 1.1 * k); g.strokeStyle = CHALK; g.lineWidth = 6; g.beginPath(); g.arc(w / 2, w / 2, 1.1 * k + 10, 0, 7); g.stroke();
    text(g, 'FIGHT NIGHT', w / 2, w / 2 + 1.55 * k, 46, 'rgba(20,19,19,.75)', 800, '10px');
    for (let s = 0; s < 4; s++) { g.save(); g.translate(w / 2, w / 2); g.rotate(s * Math.PI / 2); text(g, 'MATT KING  ·  BYMATTKING.COM', 0, w / 2 - r0 / 2, r0 * 0.42, CHALK, 800, '8px'); g.restore(); }
  });
  rbox(ring, 2 * H, PH - 0.04, 2 * H, 0, (PH - 0.04) / 2, 0, black, 0.04);
  const cv = new THREE.Mesh(new THREE.PlaneGeometry(2 * H, 2 * H), std('#ffffff', 0.92, 0, { map: canvasTex })); cv.rotation.x = -Math.PI / 2; cv.position.y = PH; ring.add(cv);
  // skirt: black, printed, a red LED line under the apron edge
  const skirt = tex(2048, 256, (g, w, h) => { g.fillStyle = '#0f0e0e'; g.fillRect(0, 0, w, h); g.fillStyle = RED; g.fillRect(0, 0, w, 10);
    text(g, 'MATT KING', w * 0.25, h * 0.56, 120, CHALK, 800, '18px'); text(g, 'FIGHT NIGHT', w * 0.75, h * 0.56, 120, RED, 800, '18px'); mkLogo(g, w / 2, h * 0.55, 70); });
  for (let s = 0; s < 4; s++) { const a = s * Math.PI / 2, m = plane(ring, 2 * H - 0.02, PH - 0.14, skirt, Math.sin(a) * (H + 0.005), (PH - 0.14) / 2 + 0.02, Math.cos(a) * (H + 0.005), a, true, 0.85);
    const led = new THREE.Mesh(new THREE.BoxGeometry(2 * H, 0.03, 0.03), redMat); led.position.set(Math.sin(a) * (H + 0.02), PH - 0.06, Math.cos(a) * (H + 0.02)); led.rotation.y = a; ring.add(led); }
  // corner posts with padded turnbuckle covers: red, black and two neutral white
  const P = R + 0.2, pads = [[-1, -1, padRed], [1, -1, padWhite], [1, 1, padBlack], [-1, 1, padWhite]];
  pads.forEach(([sx, sz, pm]) => { cyl(ring, 0.07, 1.75, 'y', sx * P, PH + 0.875, sz * P, chrome, 14);
    const pd = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.32, 4, 1), pm); pd.rotation.y = Math.PI / 4; pd.position.set(sx * (P - 0.05), PH + 1.0, sz * (P - 0.05)); ring.add(pd);
    cyl(ring, 0.09, 0.05, 'y', sx * P, PH + 1.76, sz * P, chrome, 14); });
  // four ropes on each side, each with a little sag; red and white alternating, white spacers tying them together
  const ropeW = std('#eeebe6', 0.45), ropeR = std('#b8200d', 0.42);
  const ropeH = [0.45, 0.8, 1.15, 1.5];
  for (let s = 0; s < 4; s++) {
    const [ax, az] = [[-1, -1], [1, -1], [1, 1], [-1, 1]][s], [bx, bz] = [[1, -1], [1, 1], [-1, 1], [-1, -1]][s];
    ropeH.forEach((rh, k) => { const y = PH + rh, a = V3(ax * (P - 0.1), y, az * (P - 0.1)), b = V3(bx * (P - 0.1), y, bz * (P - 0.1)), m = a.clone().add(b).multiplyScalar(0.5); m.y -= 0.035; m.x *= 0.995; m.z *= 0.995;
      ring.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a, m, b), 32, 0.024, 8, false), k % 2 ? ropeR : ropeW)); });
    for (const f of [-0.33, 0.33]) { const x = (ax + bx) / 2 * (P - 0.1) + (bx - ax) / 2 * f * (P - 0.1), z = (az + bz) / 2 * (P - 0.1) + (bz - az) / 2 * f * (P - 0.1);
      const sp = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.12, 0.05), padWhite); sp.position.set(x, PH + 0.98, z); ring.add(sp); }
  }
  // steps up to the ring on the walk-out side, a stool and bucket in the two fighting corners
  const steps = new THREE.Group(); steps.position.set(-H - 0.55, 0, 0); ring.add(steps);
  for (let k = 0; k < 3; k++) rbox(steps, 0.42, (k + 1) * 0.3, 1.1, 0.27 - k * 0.27 + 0.27, (k + 1) * 0.15, 0, black, 0.03);
  for (const [sx, sz] of [[-1, -1], [1, 1]]) { const st = new THREE.Group(); st.position.set(sx * (R - 0.35), PH, sz * (R - 0.35)); ring.add(st);
    cyl(st, 0.2, 0.04, 'y', 0, 0.55, 0, black, 18); for (let k = 0; k < 3; k++) { const a = k * 2.09; struts(st, [[V3(Math.cos(a) * 0.17, 0, Math.sin(a) * 0.17), V3(Math.cos(a) * 0.12, 0.54, Math.sin(a) * 0.12), 0.015]], chrome); }
    cyl(st, 0.13, 0.26, 'y', sx * 0.28, 0.13, sz * 0.05, sx < 0 ? padRed : padBlack, 16); }
  quiet(ring); vRg.fix.push({ o: ring, kind: 'growY', t0: 0.6 });

  // ================= ringside =================
  const side = new THREE.Group(); vRg.root.add(side);
  const screenM = glow('#9fb6c8'), seatM = std('#1a1918', 0.5), seatR = std('#6e1208', 0.45);
  // press row and judges along the -z side: long table, laptops glowing, seats behind
  for (const sz of [-1, 1]) {
    const z0 = sz * (H + 1.5);
    rbox(side, 9, 0.06, 0.8, 0, 0.76, z0, black, 0.02); box(side, 9, 0.7, 0.04, 0, 0.38, z0 - sz * 0.38, black);
    const n = 12, lap = new THREE.InstancedMesh(new THREE.BoxGeometry(0.34, 0.012, 0.24), mats.dark, n), scr = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.33, 0.21), screenM, n);
    for (let k = 0; k < n; k++) { const x = -4.1 + k * 0.745;
      M4.makeTranslation(x, 0.8, z0 + sz * 0.05); lap.setMatrixAt(k, M4);
      Q.setFromEuler(new THREE.Euler(sz > 0 ? 0.3 : -0.3, sz > 0 ? 0 : Math.PI, 0)); M4.compose(V3(x, 0.9, z0 + sz * 0.18), Q, V3(1, 1, 1)); scr.setMatrixAt(k, M4); }
    side.add(lap, scr);
    // ringside rows: red first row, black behind, facing the ring
    const rows = [[H + 2.5, 0, seatR], [H + 3.2, 0.25, seatM], [H + 3.9, 0.5, seatM]];
    rows.forEach(([d, y, m]) => { const xs = []; for (let x = -6; x <= 6.01; x += 0.62) xs.push(x);
      const im = new THREE.InstancedMesh(seatGeoBase, m, xs.length), rot = new THREE.Matrix4().makeRotationY(sz > 0 ? 0 : Math.PI);
      xs.forEach((x, i) => { M4.makeTranslation(x, y, sz * d).multiply(rot); im.setMatrixAt(i, M4); }); im.instanceMatrix.needsUpdate = true; side.add(im);
      if (y > 0) box(side, 12.6, y, 0.7, 0, y / 2, sz * d, 'dark'); });
  }
  // photographers' riser between the ring and the stage
  { const pr = new THREE.Group(); pr.position.set(H + 2.2, 0, 0); side.add(pr); rbox(pr, 1.2, 0.4, 4.6, 0, 0.2, 0, black, 0.03);
    for (const z of [-1.4, 0, 1.4]) { for (let k = 0; k < 3; k++) { const a = k * 2.09 + 0.5; struts(pr, [[V3(Math.cos(a) * 0.28, 0.4, z + Math.sin(a) * 0.28), V3(0, 1.75, z), 0.012]], mats.dark); }
      rbox(pr, 0.36, 0.22, 0.18, 0, 1.88, z, black, 0.03); cyl(pr, 0.06, 0.24, 'x', -0.27, 1.88, z, black, 14); } }
  quiet(side); vRg.fix.push({ o: side, kind: 'growY', t0: 0.64 });

  // ================= the ring walk =================
  const walk = new THREE.Group(); vRg.root.add(walk);
  // barrier posts and rails both sides, LED edging on the floor, an entrance arch with an LED header at the tunnel
  const posts = []; for (let x = W0 + 1.2; x <= W1 - 0.6; x += 1.5) for (const sz of [-1, 1]) posts.push([x, sz * (WW + 0.35)]);
  struts(walk, posts.map(([x, z]) => [V3(x, 0, z), V3(x, 1.05, z), 0.035]), chrome);
  for (const sz of [-1, 1]) { cyl(walk, 0.03, W1 - W0 - 1.2, 'x', (W0 + W1) / 2 + 0.3, 1.05, sz * (WW + 0.35), chrome, 8);
    const e = new THREE.Mesh(new THREE.BoxGeometry(W1 - W0 - 0.4, 0.025, 0.05), redMat); e.position.set((W0 + W1) / 2, 0.02, sz * (WW + 0.02)); walk.add(e); }
  const arch = new THREE.Group(); arch.position.set(W0 + 0.6, 0, 0); walk.add(arch);
  for (const sz of [-1, 1]) rbox(arch, 0.5, 3.8, 0.5, 0, 1.9, sz * 2.1, black, 0.05);
  rbox(arch, 0.5, 0.9, 4.7, 0, 4.15, 0, black, 0.05);
  makeBoard(vRg, arch, 4.4, 0.7, 0.26, 4.15, 0, Math.PI / 2, 1.0, 1);
  for (const sz of [-1, 1]) { const st = new THREE.Mesh(new THREE.BoxGeometry(0.05, 3.6, 0.05), redMat); st.position.set(0.27, 1.85, sz * 1.84); arch.add(st); }
  // the fighter: hooded satin robe with MK across the back, two cornermen in black behind
  const glove = std('#b3200e', 0.35, 0.05), skin = std('#0c0b0b', 0.8);
  const figure = (robe, gloves = false) => { const f = new THREE.Group();
    // robe: flared hem, waist, broad shoulders, then the hood; sleeves hang at the sides
    const prof = [[0.001, 0.02], [0.36, 0.03], [0.37, 0.12], [0.33, 0.6], [0.29, 0.95], [0.33, 1.25], [0.36, 1.38], [0.3, 1.46], [0.13, 1.52], [0.001, 1.53]].map(([r, y]) => new THREE.Vector2(r, y));
    const body = new THREE.Mesh(new THREE.LatheGeometry(prof, 28), robe); body.scale.set(0.72, 1, 1); f.add(body);
    const trim = new THREE.Mesh(new THREE.TorusGeometry(0.335, 0.03, 8, 28), satinRed); trim.rotation.x = Math.PI / 2; trim.scale.set(0.72, 1, 1); trim.position.y = 0.1; f.add(trim);
    for (const sz of [-1, 1]) { const sl = new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 0.55, 4, 10), robe); sl.position.set(0.04, 1.08, sz * 0.36); sl.rotation.x = sz * 0.12; sl.rotation.z = -0.18; f.add(sl);
      if (gloves) { const gl = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10), glove); gl.scale.set(1.25, 1, 1); gl.position.set(0.12, 0.74, sz * 0.38); f.add(gl); } }
    const hood = new THREE.Mesh(new THREE.SphereGeometry(0.19, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.7), robe); hood.position.set(-0.02, 1.62, 0); hood.scale.set(1.05, 1.2, 1.0); f.add(hood);
    const face = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 10), skin); face.position.set(0.08, 1.6, 0); f.add(face);
    for (const sz of [-1, 1]) { const lg = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.1, 4, 8), std('#0d0c0c', 0.6)); lg.position.set(0.05, 0.08, sz * 0.12); f.add(lg); }
    return f; };
  const satinBlack = std('#151313', 0.26, 0.25); satinBlack.userData.env = 1.2;
  const fighter = figure(satinBlack, true); walk.add(fighter);
  const back = tex(256, 256, g => { g.clearRect(0, 0, 256, 256); text(g, 'MK', 128, 120, 150, CHALK, 800, '-8px'); text(g, 'MATT KING', 128, 208, 34, CHALK, 800, '6px'); });
  { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42), new THREE.MeshStandardMaterial({ map: back, transparent: true, roughness: 0.5 })); m.position.set(-0.235, 1.05, 0); m.rotation.y = -Math.PI / 2; fighter.add(m); }
  const crew = [figure(std('#151414', 0.7)), figure(std('#151414', 0.7))]; crew.forEach(c => { c.scale.setScalar(0.96); walk.add(c); });
  // a follow-spot: a pool of light on the carpet and a soft shaft from above
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.6), new THREE.MeshBasicMaterial({ map: glowTex, color: C('#fff0dc').multiplyScalar(1.3), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  pool.rotation.x = -Math.PI / 2; pool.position.y = 0.03; walk.add(pool);
  const shaftG = new THREE.CylinderGeometry(0.5, 1.5, 9, 24, 1, true); shaftG.translate(0, 4.5, 0);
  const shaftM = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: { uOp: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: 'uniform float uOp; varying vec2 vUv; void main(){ float a=uOp*(0.15+0.85*vUv.y)*0.24; gl_FragColor=vec4(vec3(1.0,0.94,0.86)*a,a); }' });
  const shaft = new THREE.Mesh(shaftG, shaftM); walk.add(shaft);
  // a warm key light that travels with the fighter; it lives on the scene, not the venue, so the light count is constant
  const key = new THREE.PointLight(0xffe6cc, 0, 11 * vRg.s, 1.4); X.scene.add(key);
  // smoke at the tunnel mouth that rolls down the walkway
  const smokeTex = tex(128, 128, (g, w) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,0.55)'); gr.addColorStop(0.6, 'rgba(255,255,255,0.12)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, w); });
  const smoke = []; for (let k = 0; k < (LOWQ ? 10 : 18); k++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, color: C('#c9c3bd'), transparent: true, depthWrite: false, opacity: 0 }));
    s.userData = { x0: W0 + 0.3 + Math.random() * 2.5, z: (Math.random() - 0.5) * 2.2, sp: 0.15 + Math.random() * 0.25, sc: 1.6 + Math.random() * 1.8, ph: Math.random() }; walk.add(s); smoke.push(s); }
  quiet(walk); vRg.fix.push({ o: walk, kind: 'growY', t0: 0.62 });

  // ================= the press-conference stage =================
  const stage = new THREE.Group(); stage.position.set((S0 + S1) / 2, 0, 0); vRg.root.add(stage); const SW = S1 - S0, SH = 0.6;
  rbox(stage, SW, SH, 2 * SZ, 0, SH / 2, 0, black, 0.04);
  { const e = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 2 * SZ), redMat); e.position.set(-SW / 2 - 0.01, SH - 0.04, 0); stage.add(e); }
  // step-and-repeat backdrop: MK marks and the name in a brick grid, a header bar across the top
  const bdW = 2 * SZ - 0.2, bdH = 3.3;
  const backdrop = tex(2048, 1024, (g, w, h) => { g.fillStyle = '#eceae7'; g.fillRect(0, 0, w, h);
    const cw = 292, rh = 170; for (let r = 0; r * rh < h + rh; r++) for (let c = -1; c * cw < w + cw; c++) { const x = c * cw + (r % 2 ? cw / 2 : 0) + cw / 2, y = r * rh + rh / 2;
      if ((r + c) % 2) mkLogo(g, x, y, 40); else text(g, 'MATT KING', x, y, 34, '#141313', 800, '6px'); } });
  plane(stage, bdW, bdH, backdrop, SW / 2 - 0.25, SH + bdH / 2, 0, -Math.PI / 2, false);
  rbox(stage, 0.12, bdH + 0.1, bdW + 0.1, SW / 2 - 0.18, SH + bdH / 2, 0, black, 0.02);
  const header = tex(2048, 192, (g, w, h) => { g.fillStyle = RED; g.fillRect(0, 0, w, h); text(g, 'FIGHT WEEK  —  PRESS CONFERENCE', w / 2, h * 0.54, 92, CHALK, 800, '16px'); });
  plane(stage, bdW, 0.42, header, SW / 2 - 0.3, SH + bdH + 0.26, 0, -Math.PI / 2, true, 1.05);
  // the table: dressed front, name cards, the mic cluster, bottles, and the belt
  const TX = 0.35, TL = 4.6;
  rbox(stage, 0.8, 0.05, TL, TX, SH + 0.76, 0, black, 0.02);
  const front = tex(2048, 320, (g, w, h) => { g.fillStyle = '#0f0e0e'; g.fillRect(0, 0, w, h); g.fillStyle = RED; g.fillRect(0, h - 14, w, 14); mkLogo(g, 190, h / 2, 92);
    text(g, 'MATT KING', 330, h * 0.42, 130, CHALK, 800, '10px', 'left'); text(g, 'SPORT  ·  FASHION  ·  CULTURE', 336, h * 0.74, 46, 'rgba(243,242,242,.7)', 800, '10px', 'left'); });
  plane(stage, TL, 0.72, front, TX - 0.41, SH + 0.38, 0, -Math.PI / 2, true, 0.8);
  const chairM = std('#1d1c1b', 0.5);
  for (const z of [-1.4, 0, 1.4]) { const ch = new THREE.Group(); ch.position.set(TX + 0.75, SH, z); stage.add(ch);
    rbox(ch, 0.55, 0.1, 0.55, 0, 0.5, 0, chairM, 0.04); rbox(ch, 0.1, 0.85, 0.55, 0.24, 0.95, 0, chairM, 0.04); cyl(ch, 0.03, 0.45, 'y', 0, 0.24, 0, chrome, 8); cyl(ch, 0.24, 0.03, 'y', 0, 0.02, 0, chrome, 16); }
  const card = tex(512, 128, (g, w, h) => { g.fillStyle = '#f3f2f2'; g.fillRect(0, 0, w, h); g.fillStyle = RED; g.fillRect(0, h - 12, w, 12); text(g, 'MATT KING', w / 2, h * 0.48, 64, '#121111', 800, '6px'); });
  { const cg = new THREE.Group(); cg.position.set(TX - 0.2, SH + 0.84, 0.1); cg.rotation.y = -Math.PI / 2; stage.add(cg); const m = plane(cg, 0.42, 0.1, card, 0, 0, 0, 0, true, 0.95); m.rotation.x = -0.3; }
  const micCols = [RED, '#f3f2f2', '#121111', RED, '#5a5754', '#f3f2f2', '#121111'];
  micCols.forEach((col, k) => { const a = (k - 3) * 0.16, mg = new THREE.Group(); mg.position.set(TX - 0.1, SH + 0.79, -0.42 + k * 0.14); mg.rotation.z = 0.5 + 0.1 * Math.sin(k * 2.1); mg.rotation.y = a; stage.add(mg);
    cyl(mg, 0.01, 0.42, 'y', 0, 0.21, 0, black, 6); const hd = new THREE.Mesh(new THREE.CapsuleGeometry(0.028, 0.09, 4, 10), std('#2a2827', 0.35, 0.5)); hd.position.y = 0.47; mg.add(hd); const fl = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.085, 0.1), std(col, 0.45)); fl.position.y = 0.36; mg.add(fl); });
  cyl(stage, 0.12, 0.02, 'y', TX - 0.1, SH + 0.79, 0.0, black, 18);
  const bottle = new THREE.MeshStandardMaterial({ color: C('#dfe8ec'), roughness: 0.1, transparent: true, opacity: 0.6 });
  for (const z of [-1.7, -1.2, 1.15, 1.65]) { cyl(stage, 0.035, 0.22, 'y', TX, SH + 0.9, z, bottle, 12); cyl(stage, 0.03, 0.1, 'y', TX + 0.12, SH + 0.84, z + 0.12, bottle, 12); }
  // the belt, laid on the table: strap, a gold centre plate with a red stone
  { const bg = new THREE.Group(); bg.position.set(TX - 0.05, SH + 0.8, -0.95); stage.add(bg);
    rbox(bg, 0.16, 0.03, 0.95, 0, 0, 0, std('#1a1817', 0.4), 0.03);
    const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.03, 32), gold); pl.scale.set(1, 1, 1.25); pl.position.y = 0.025; bg.add(pl);
    for (const z of [-0.28, 0.28]) { const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.028, 24), gold); sp.position.set(0, 0.022, z); bg.add(sp); }
    const gem = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 10), new THREE.MeshStandardMaterial({ color: C(RED), emissive: C(RED), emissiveIntensity: 0.5, roughness: 0.15, metalness: 0.3 })); gem.scale.y = 0.5; gem.position.y = 0.045; bg.add(gem); }
  // press lights on stands either side of the stage
  for (const sz of [-1, 1]) { const lg = new THREE.Group(); lg.position.set(-SW / 2 - 0.9, 0, sz * (SZ + 0.2)); stage.add(lg);
    for (let k = 0; k < 3; k++) { const a = k * 2.09; struts(lg, [[V3(Math.cos(a) * 0.35, 0, Math.sin(a) * 0.35), V3(0, 2.6, 0), 0.015]], mats.dark); }
    const hd = new THREE.Group(); hd.position.y = 2.7; hd.lookAt(V3(SW + 0.5, -0.4, -sz * SZ)); lg.add(hd);
    rbox(hd, 0.5, 0.5, 0.3, 0, 0, 0, black, 0.04); const lens = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42), glow('#fff3e4')); lens.position.z = 0.16; hd.add(lens); }
  quiet(stage); vRg.fix.push({ o: stage, kind: 'growY', t0: 0.6 });

  // ---------- per frame: u = progress through the ring walk (0..1), walkOn while that beat is showing
  const v = new THREE.Vector3();
  function update({ time, u, walkOn, pressOn }) {
    const len = W1 - 1.2 - (W0 + 0.8), x = W0 + 0.8 + len * u, bob = Math.abs(Math.sin(time * 4.2)) * 0.03;
    fighter.position.set(x, bob, 0); fighter.rotation.y = 0;
    crew.forEach((c, k) => c.position.set(x - 1.3 - k * 0.2, Math.abs(Math.sin(time * 4.2 + 1 + k)) * 0.03, (k ? 1 : -1) * 0.45));
    fighter.visible = crew[0].visible = crew[1].visible = walkOn || u > 0.02;
    pool.position.x = x; shaft.position.set(x, 0, 0); const sp = walkOn ? 1 : 0;
    v.set(x + 1.6, 3.2, 1.2); vRg.root.localToWorld(v); key.position.copy(v); key.intensity = walkOn && vRg.root.visible ? 9 : 0;
    // fight week: the same light becomes the press lights, washing the table and backdrop from the front
    if (pressOn && vRg.root.visible) { v.set(S0 - 2.6, 3.4, 0); vRg.root.localToWorld(v); key.position.copy(v); key.intensity = 16; }
    pool.material.opacity = sp; shaftM.uniforms.uOp.value = sp;
    smoke.forEach(s => { const d = s.userData, k = (time * d.sp + d.ph) % 1; s.position.set(d.x0 + k * 5.5, 0.35 + k * 0.5, d.z * (1 + k)); s.scale.setScalar(d.sc * (0.7 + k)); s.material.opacity = (walkOn ? 0.32 : 0.1) * Math.sin(k * Math.PI); });
  }
  return { update, stage, ring, fighter };
}
