// Modern F1 car, built from lofted cross-sections and real wing sections. +x is forward, y up, z across.
// Returns { g, wheels: [{ pivot, spin, r, front }], rl } — the same shape race-detail drives.
export function f1CarFactory(X) {
  const { THREE, C, V3, RED, CHALK, FONT, LS, cnv, texOf, struts, LOWQ, glowTex } = X;

  // ---------- geometry helpers
  // loft: superellipse sections (x, y, z centre, half-width w, half-height h, exponent e, flat = how much the bottom is cut flat)
  // densified with Catmull-Rom so the surface flows. v runs bottom (0) → +z side (.25) → top (.5) → -z side (.75).
  function loft(st, n = LOWQ ? 20 : 30, sub = LOWQ ? 3 : 6) {
    const keys = ['x', 'y', 'z', 'w', 'h', 'e', 'flat'], S = [];
    const at = (i) => st[Math.max(0, Math.min(st.length - 1, i))];
    for (let i = 0; i < st.length - 1; i++) for (let k = 0; k < sub; k++) {
      const u = k / sub, o = {};
      keys.forEach(key => { const p0 = at(i - 1)[key] ?? 0, p1 = at(i)[key] ?? 0, p2 = at(i + 1)[key] ?? 0, p3 = at(i + 2)[key] ?? 0;
        o[key] = 0.5 * (2 * p1 + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u * u * u); });
      S.push(o);
    }
    S.push({ flat: 0, z: 0, ...st[st.length - 1] });
    const x0 = S[S.length - 1].x, x1 = S[0].x, pos = [], uv = [], idx = [];
    S.forEach(s => {
      const e = s.e || 2.6;
      for (let k = 0; k <= n; k++) {
        const a = k / n * Math.PI * 2, c = -Math.cos(a), sn = Math.sin(a);
        let y = Math.sign(c) * Math.pow(Math.abs(c), 2 / e) * s.h; const z = Math.sign(sn) * Math.pow(Math.abs(sn), 2 / e) * s.w;
        if (s.flat && y < -s.h * (1 - s.flat)) y = -s.h * (1 - s.flat);
        pos.push(s.x, s.y + y, (s.z || 0) + z); uv.push((s.x - x0) / (x1 - x0), k / n);
      }
    });
    const R = n + 1;
    for (let i = 0; i < S.length - 1; i++) for (let k = 0; k < n; k++) { const a = i * R + k, b = a + R; idx.push(a, a + 1, b, a + 1, b + 1, b); } // outward-facing
    // end caps
    [0, S.length - 1].forEach((i, end) => { const s = S[i], ci = pos.length / 3; pos.push(s.x, s.y, s.z || 0); uv.push(end ? 0 : 1, 0.5);
      for (let k = 0; k < n; k++) end ? idx.push(ci, i * R + k, i * R + k + 1) : idx.push(ci, i * R + k + 1, i * R + k); });
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
  }
  // a cambered wing section of chord c, extruded across the span (z), pitched by aoa (radians, nose down positive)
  function wing(c, t, camber, span, aoa) {
    const sh = new THREE.Shape(), N = 14, top = [], bot = [];
    for (let i = 0; i <= N; i++) { const xc = (1 - Math.cos(i / N * Math.PI)) / 2, yt = 5 * t * (0.2969 * Math.sqrt(xc) - 0.126 * xc - 0.3516 * xc * xc + 0.2843 * xc ** 3 - 0.1036 * xc ** 4), yc = -camber * 4 * xc * (1 - xc); // inverted: downforce
      top.push([-xc * c, (yc + yt) * c]); bot.push([-xc * c, (yc - yt) * c]); }
    top.forEach(([x, y], i) => i ? sh.lineTo(x, y) : sh.moveTo(x, y)); bot.reverse().forEach(([x, y]) => sh.lineTo(x, y));
    const g = new THREE.ExtrudeGeometry(sh, { depth: span, bevelEnabled: false, curveSegments: 2 }); g.translate(0, 0, -span / 2); g.rotateZ(-aoa); return g; // trailing edge up
  }
  const plate = (pts, thick) => { const sh = new THREE.Shape(); pts.forEach(([x, y], i) => i ? sh.lineTo(x, y) : sh.moveTo(x, y)); const g = new THREE.ExtrudeGeometry(sh, { depth: thick, bevelEnabled: true, bevelThickness: thick * 0.3, bevelSize: thick * 0.3, bevelSegments: 1 }); g.translate(0, 0, -thick / 2); return g; };
  const mesh = (geo, mat, parent, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); parent.add(m); return m; };

  // ---------- shared materials
  const carbonTex = (() => { const S = 128, [c, g] = cnv(S, S); for (let y = 0; y < S; y += 4) for (let x = 0; x < S; x += 4) { const tw = ((x >> 2) + (y >> 2)) % 4 < 2; g.fillStyle = tw ? '#232325' : '#0f0f10'; g.fillRect(x, y, 4, 4); g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(x, y, tw ? 4 : 1, tw ? 1 : 4); }
    const t = texOf(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(10, 10); return t; })();
  const carbon = new THREE.MeshPhysicalMaterial({ color: C('#ffffff'), map: carbonTex, roughness: 0.32, metalness: 0.25, clearcoat: 0.8, clearcoatRoughness: 0.12 }); carbon.userData.env = 0.7;
  const satin = new THREE.MeshStandardMaterial({ color: C('#141415'), roughness: 0.55, metalness: 0.3 }); satin.userData.env = 0.4;
  const voidM = new THREE.MeshBasicMaterial({ color: C('#050505') });
  const rubber = new THREE.MeshStandardMaterial({ color: C('#1a1919'), roughness: 0.88, metalness: 0 });
  const rimM = new THREE.MeshStandardMaterial({ color: C('#232324'), roughness: 0.22, metalness: 0.9 }); rimM.userData.env = 1;
  const visor = new THREE.MeshPhysicalMaterial({ color: C('#0a0a0c'), roughness: 0.05, metalness: 0.6, clearcoat: 1 }); visor.userData.env = 1.2;
  const sideTex = (col) => { const S = 512, [c, g] = cnv(S, S); g.clearRect(0, 0, S, S); const m = S / 2;
    g.strokeStyle = col; g.lineWidth = 12; g.beginPath(); g.arc(m, m, m * 0.86, 0, 7); g.stroke();
    g.fillStyle = 'rgba(240,238,234,0.92)'; g.font = FONT(800, 30); LS(g, '8px'); g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const r of [0, Math.PI]) { g.save(); g.translate(m, m); g.rotate(r); g.fillText('MK17', 0, -m * 0.72); g.restore(); }
    g.fillStyle = col; for (const r of [Math.PI / 2, -Math.PI / 2]) { g.save(); g.translate(m, m); g.rotate(r); g.fillRect(-24, -m * 0.76, 48, 10); g.restore(); }
    return texOf(c); };
  const tyreBand = { red: sideTex(RED), white: sideTex('#e8e5e1') };
  // wheel cover: smoked disc with radial spokes showing through
  const coverTex = (() => { const S = 256, [c, g] = cnv(S, S), m = S / 2; g.fillStyle = '#18181a'; g.beginPath(); g.arc(m, m, m, 0, 7); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.08)'; g.lineWidth = 10; for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; g.beginPath(); g.moveTo(m + Math.cos(a) * 30, m + Math.sin(a) * 30); g.lineTo(m + Math.cos(a) * 118, m + Math.sin(a) * 118); g.stroke(); }
    g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 4; g.beginPath(); g.arc(m, m, 122, 0, 7); g.stroke(); return texOf(c); })();
  const coverM = new THREE.MeshStandardMaterial({ map: coverTex, roughness: 0.35, metalness: 0.6 });

  // shared geometry: the same shapes for every car
  const GEO = (() => {
    const body = loft([
      { x: 3.22, y: 0.2, w: 0.07, h: 0.04, e: 2.2 }, { x: 2.85, y: 0.27, w: 0.12, h: 0.07, e: 2.4 }, { x: 2.15, y: 0.35, w: 0.19, h: 0.12, e: 2.6 },
      { x: 1.55, y: 0.41, w: 0.25, h: 0.165, e: 2.8, flat: 0.2 }, { x: 1.05, y: 0.45, w: 0.29, h: 0.2, e: 3, flat: 0.3 }, { x: 0.45, y: 0.45, w: 0.32, h: 0.21, e: 3.2, flat: 0.35 },
      { x: -0.05, y: 0.5, w: 0.33, h: 0.27, e: 3, flat: 0.35 }, { x: -0.65, y: 0.49, w: 0.28, h: 0.26, e: 2.8, flat: 0.3 }, { x: -1.25, y: 0.44, w: 0.18, h: 0.2, e: 2.6, flat: 0.2 },
      { x: -1.85, y: 0.4, w: 0.11, h: 0.13, e: 2.4 }, { x: -2.2, y: 0.38, w: 0.07, h: 0.08, e: 2.2 },
    ]);
    // sidepods: high, narrow inlet, deep undercut, then a coke-bottle taper into the floor
    const pod = loft([
      { x: 0.92, y: 0.4, z: 0.6, w: 0.15, h: 0.15, e: 3.2 }, { x: 0.82, y: 0.41, z: 0.6, w: 0.22, h: 0.19, e: 3.4, flat: 0.25 }, { x: 0.45, y: 0.4, z: 0.6, w: 0.24, h: 0.2, e: 3.2, flat: 0.45 },
      { x: -0.15, y: 0.36, z: 0.55, w: 0.22, h: 0.18, e: 3, flat: 0.5 }, { x: -0.75, y: 0.28, z: 0.46, w: 0.17, h: 0.13, e: 2.8, flat: 0.4 }, { x: -1.3, y: 0.2, z: 0.36, w: 0.1, h: 0.08, e: 2.5 },
      { x: -1.65, y: 0.15, z: 0.3, w: 0.04, h: 0.04, e: 2.2 },
    ]);
    const airbox = loft([{ x: 0.16, y: 0.9, w: 0.1, h: 0.11, e: 2.4 }, { x: -0.05, y: 0.9, w: 0.13, h: 0.13, e: 2.6 }, { x: -0.45, y: 0.84, w: 0.1, h: 0.1, e: 2.6 }, { x: -1.0, y: 0.74, w: 0.04, h: 0.05, e: 2.2 }]);
    const gearbox = loft([{ x: -1.9, y: 0.32, w: 0.12, h: 0.1, e: 3 }, { x: -2.2, y: 0.3, w: 0.1, h: 0.08, e: 3 }, { x: -2.45, y: 0.3, w: 0.06, h: 0.05, e: 2.6 }]);
    const helmet = new THREE.SphereGeometry(0.145, LOWQ ? 16 : 28, LOWQ ? 12 : 20); helmet.scale(1.12, 1, 1);
    // floor in plan view, with the edge flare ahead of the sidepods and the cut-out in front of the rear tyres
    const fl = new THREE.Shape(); [[1.35, 0.3], [1.0, 0.62], [0.75, 0.8], [-1.1, 0.8], [-1.35, 0.7], [-1.95, 0.62], [-2.05, 0.5], [-2.05, -0.5], [-1.95, -0.62], [-1.35, -0.7], [-1.1, -0.8], [0.75, -0.8], [1.0, -0.62], [1.35, -0.3]]
      .forEach(([x, z], i) => i ? fl.lineTo(x, z) : fl.moveTo(x, z));
    const floor = new THREE.ExtrudeGeometry(fl, { depth: 0.035, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.012, bevelSegments: 1 }); floor.rotateX(Math.PI / 2);
    const fin = plate([[-0.2, 0.0], [-1.85, 0.0], [-1.85, 0.17], [-1.3, 0.12], [-0.6, 0.06]], 0.016);
    const fwEnd = plate([[0.2, 0], [-0.4, 0], [-0.42, 0.14], [-0.3, 0.28], [-0.05, 0.32], [0.1, 0.2], [0.2, 0.07]], 0.014);
    const rwEnd = plate([[0.14, 0.06], [-0.4, 0.08], [-0.44, 0.58], [-0.3, 0.63], [0.04, 0.6], [0.14, 0.44]], 0.014);
    // tyre: lathe with rounded shoulders and a little sidewall bulge
    const tyre = (r, w) => { const ri = r * 0.72, P = [[ri, -w / 2], [r - 0.07, -w / 2 - 0.004], [r - 0.025, -w / 2 + 0.02], [r - 0.003, -w / 2 + 0.07], [r, 0], [r - 0.003, w / 2 - 0.07], [r - 0.025, w / 2 - 0.02], [r - 0.07, w / 2 + 0.004], [ri, w / 2]];
      const g = new THREE.LatheGeometry(P.map(([a, b]) => new THREE.Vector2(a, b)), LOWQ ? 28 : 48); g.rotateX(Math.PI / 2); return g; };
    return { body, pod, airbox, gearbox, helmet, floor, fin, fwEnd, rwEnd, tyreF: tyre(0.355, 0.36), tyreR: tyre(0.37, 0.42),
      fw: [wing(0.3, 0.09, 0.05, 1.9, 0.04), wing(0.2, 0.08, 0.08, 0.7, 0.32), wing(0.16, 0.08, 0.1, 0.68, 0.55)],
      rwMain: wing(0.36, 0.1, 0.08, 1.0, 0.18), rwFlap: wing(0.24, 0.08, 0.1, 1.0, 0.6), beam: wing(0.16, 0.1, 0.06, 0.8, 0.2),
      halo: (() => { const p = new THREE.CatmullRomCurve3([V3(0.22, 0.72, -0.31), V3(0.45, 0.88, -0.29), V3(0.75, 0.94, -0.17), V3(0.9, 0.95, 0), V3(0.75, 0.94, 0.17), V3(0.45, 0.88, 0.29), V3(0.22, 0.72, 0.31)]);
        return new THREE.TubeGeometry(p, LOWQ ? 24 : 48, 0.032, 10, false); })(),
      haloPylon: new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V3(0.9, 0.95, 0), V3(1.05, 0.8, 0), V3(1.12, 0.64, 0)]), 12, 0.03, 8, false),
    };
  })();

  // livery painted onto the body loft: u = tail → nose, v = around (bottom, +z side, top, -z side)
  function livery(paint, accent, num, name) {
    const W = 1024, H = 512, [c, g] = cnv(W, H); g.fillStyle = paint; g.fillRect(0, 0, W, H);
    const V = v => (1 - v) * H, U = u => u * W;
    // modern cars run bare or dark lower bodywork: the bottom of the tub and nose sides
    g.fillStyle = '#121213'; g.fillRect(0, V(0.17), W, V(0) - V(0.17)); g.fillRect(0, V(1), W, V(0.83) - V(1));
    // side swoosh: thin at the nose, wide over the cockpit, sweeping down to the tail
    for (const sv of [0.25, 0.75]) { const d = sv < 0.5 ? 1 : -1; g.fillStyle = accent; g.beginPath();
      g.moveTo(U(0.98), V(sv + d * 0.01)); g.bezierCurveTo(U(0.75), V(sv + d * 0.02), U(0.55), V(sv + d * 0.09), U(0.42), V(sv + d * 0.1));
      g.lineTo(U(0.05), V(sv - d * 0.02)); g.lineTo(U(0.05), V(sv - d * 0.06)); g.bezierCurveTo(U(0.4), V(sv + d * 0.02), U(0.7), V(sv - d * 0.02), U(0.98), V(sv - d * 0.012)); g.closePath(); g.fill();
      g.fillStyle = RED === accent ? CHALK : RED; g.fillRect(U(0.08), V(sv - d * 0.065) - 2, U(0.32), 4); }
    // top: a fine centre stripe and the race number on the nose
    g.fillStyle = accent; g.fillRect(U(0.32), V(0.5) - 3, U(0.62), 6);
    g.save(); g.translate(U(0.86), V(0.5)); g.rotate(Math.PI / 2); g.fillStyle = accent; g.font = FONT(800, 96); LS(g, '-4px'); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(num, 0, 0); g.restore();
    // engine cover sides: number and name, readable from either side
    for (const sv of [0.25, 0.75]) { g.save(); g.translate(U(0.3), V(sv)); if (sv > 0.5) g.rotate(Math.PI); g.fillStyle = accent; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = FONT(800, 84); LS(g, '-3px'); g.fillText(num, -70, 0); g.font = FONT(800, 22); LS(g, '5px'); g.fillText(name, 80, -12); g.fillRect(20, 6, 120, 4); g.restore(); }
    const t = texOf(c); t.anisotropy = 8; return t;
  }

  function podLivery(paint, accent, num, mirror) {
    const W = 1024, H = 512, [c, g] = cnv(W, H), V = v => (1 - v) * H, U = u => u * W; g.fillStyle = paint; g.fillRect(0, 0, W, H);
    if (mirror) { g.translate(W, 0); g.scale(-1, 1); }
    g.fillStyle = '#121213'; g.fillRect(0, V(0.2), W, V(0) - V(0.2)); g.fillRect(0, V(1), W, V(0.85) - V(1));
    g.fillStyle = accent; g.beginPath(); g.moveTo(U(1), V(0.3)); g.bezierCurveTo(U(0.7), V(0.33), U(0.4), V(0.24), U(0.0), V(0.2)); g.lineTo(U(0), V(0.17)); g.bezierCurveTo(U(0.4), V(0.2), U(0.7), V(0.27), U(1), V(0.25)); g.closePath(); g.fill();
    g.fillStyle = accent === '#121213' ? CHALK : accent; g.fillRect(U(0.05), V(0.505) - 3, U(0.9), 6);
    g.save(); g.translate(U(0.62), V(0.28)); g.fillStyle = paint === '#e4e1dd' || paint === '#3b3f45' ? '#0d0c0c' : CHALK; g.font = FONT(800, 104); LS(g, '-4px'); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(num, 0, 0);
    g.font = FONT(800, 18); LS(g, '6px'); g.fillText('MATT KING', 0, 66); g.restore();
    const t = texOf(c); t.anisotropy = 8; return t;
  }

  return function makeCar(paintCol, accentCol, num, name, band) {
    const g = new THREE.Group(), dark = accentCol === '#0d0c0c' ? '#0d0c0c' : accentCol;
    const paint = new THREE.MeshPhysicalMaterial({ map: livery(paintCol, dark, num, name), roughness: 0.22, metalness: 0.25, clearcoat: 1, clearcoatRoughness: 0.04 }); paint.userData.env = 1;
    const plain = new THREE.MeshPhysicalMaterial({ color: C(paintCol), roughness: 0.22, metalness: 0.25, clearcoat: 1, clearcoatRoughness: 0.04 }); plain.userData.env = 1;
    const accent = new THREE.MeshPhysicalMaterial({ color: C(accentCol), roughness: 0.28, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.08 }); accent.userData.env = 0.8;

    mesh(GEO.body, paint, g);
    const podM = [1, -1].map(z => { const m = new THREE.MeshPhysicalMaterial({ map: podLivery(paintCol, dark === '#0d0c0c' ? '#121213' : dark, num, z < 0), roughness: 0.22, metalness: 0.25, clearcoat: 1, clearcoatRoughness: 0.04 }); m.userData.env = 1; return m; });
    for (const z of [-1, 1]) { const p = mesh(GEO.pod, podM[z > 0 ? 0 : 1], g); p.scale.z = z; p.userData.pod = true;
      const inlet = mesh(new THREE.CircleGeometry(1, 20), voidM, g, 0.925, 0.41, z * 0.6); inlet.scale.set(0.13, 0.14, 1); inlet.rotation.y = Math.PI / 2;
      // mirror on a carbon stalk
      struts(g, [[V3(0.9, 0.55, z * 0.36), V3(0.96, 0.75, z * 0.5), 0.012]], carbon);
      const mh = mesh(new THREE.BoxGeometry(0.06, 0.07, 0.15), plain, g, 0.97, 0.77, z * 0.52); mh.rotation.y = z * 0.15;
    }
    mesh(GEO.floor, carbon, g, 0, 0.1, 0);
    mesh(new THREE.BoxGeometry(2.6, 0.02, 0.22), satin, g, -0.3, 0.055, 0);                              // plank
    for (const z of [-1, 1]) for (let k = 0; k < 4; k++) { const f = mesh(new THREE.BoxGeometry(0.42, 0.1, 0.012), carbon, g, 0.55 - k * 0.05, 0.11, z * (0.68 - k * 0.05)); f.rotation.y = z * 0.18; } // floor fences
    // diffuser: ramp and strakes under the gearbox
    const dif = mesh(new THREE.BoxGeometry(0.62, 0.02, 1.0), carbon, g, -2.05, 0.16, 0); dif.rotation.z = 0.32;
    for (const z of [-0.36, -0.12, 0.12, 0.36]) { const s = mesh(new THREE.BoxGeometry(0.6, 0.18, 0.012), carbon, g, -2.05, 0.15, z); s.rotation.z = 0.32; }
    mesh(GEO.gearbox, carbon, g);
    // engine cover: airbox with its intake, roll hoop, fin, T-cam
    mesh(GEO.airbox, plain, g); const ai = mesh(new THREE.CircleGeometry(1, 18), voidM, g, 0.165, 0.9, 0); ai.scale.set(0.075, 0.085, 1); ai.rotation.y = Math.PI / 2;
    mesh(GEO.fin, plain, g, 0, 0.82, 0);
    mesh(new THREE.BoxGeometry(0.12, 0.05, 0.07), accent, g, 0.0, 1.04, 0);
    // cockpit: opening, headrest, driver
    const ck = mesh(new THREE.CylinderGeometry(1, 1, 0.02, 24), voidM, g, 0.66, 0.655, 0); ck.scale.set(0.34, 1, 0.19);
    mesh(new THREE.BoxGeometry(0.22, 0.08, 0.42), satin, g, 0.36, 0.68, 0);
    const helM = new THREE.MeshPhysicalMaterial({ color: C('#efece8'), roughness: 0.25, clearcoat: 1 }); const hel = mesh(GEO.helmet, helM, g, 0.52, 0.76, 0); mesh(new THREE.TorusGeometry(0.146, 0.012, 6, 28), plain, g, 0.52, 0.79, 0).rotation.x = Math.PI / 2;
    const vz = mesh(new THREE.SphereGeometry(0.147, 20, 10, -0.9, 1.8, 1.0, 0.55), visor, g, 0.52, 0.76, 0); vz.scale.set(1.12, 1, 1); vz.rotation.y = Math.PI / 2;
    // halo and its centre pylon
    mesh(GEO.halo, carbon, g); mesh(GEO.haloPylon, carbon, g);
    // front wing: three elements, endplates, pylons to the nose
    const fwm = [carbon, plain, plain];
    [[3.38, 0.1, 0], [3.16, 0.17, 1], [3.02, 0.25, 2]].forEach(([x, y, i]) => { if (i === 0) mesh(GEO.fw[0], carbon, g, x, y, 0); else for (const z of [-1, 1]) mesh(GEO.fw[i], fwm[i], g, x, y, z * 0.6); });
    for (const z of [-1, 1]) { mesh(GEO.fwEnd, carbon, g, 3.35, 0.06, z * 0.96); mesh(new THREE.BoxGeometry(0.5, 0.025, 0.03), plain, g, 3.12, 0.39, z * 0.96); }
    struts(g, [[V3(2.95, 0.27, 0.06), V3(3.1, 0.12, 0.1), 0.014], [V3(2.95, 0.27, -0.06), V3(3.1, 0.12, -0.1), 0.014]], carbon);
    // rear wing: main plane, DRS flap, endplates, beam wing, swan-neck mount, rain light
    mesh(GEO.rwMain, carbon, g, -2.3, 0.86, 0); mesh(GEO.rwFlap, plain, g, -2.5, 0.98, 0);
    for (const z of [-1, 1]) { mesh(GEO.rwEnd, carbon, g, -2.18, 0.44, z * 0.5); mesh(new THREE.BoxGeometry(0.4, 0.03, 0.03), plain, g, -2.31, 1.065, z * 0.5); }
    mesh(GEO.beam, carbon, g, -2.3, 0.44, 0);
    struts(g, [[V3(-2.4, 0.84, 0.05), V3(-2.2, 0.36, 0.05), 0.018], [V3(-2.4, 0.84, -0.05), V3(-2.2, 0.36, -0.05), 0.018]], carbon);
    const ex = new THREE.CylinderGeometry(0.045, 0.05, 0.16, 14); ex.rotateZ(Math.PI / 2); mesh(ex, satin, g, -2.4, 0.5, 0);
    const rl = new THREE.MeshBasicMaterial({ color: C(RED).multiplyScalar(2.2) }); mesh(new THREE.BoxGeometry(0.03, 0.06, 0.16), rl, g, -2.56, 0.3, 0);

    // wheels: shaped tyre, coloured compound band, smoked wheel cover; suspension, brake ducts
    const wheels = [];
    [[1.85, 0.82, 0.355, 0.36, true], [1.85, -0.82, 0.355, 0.36, true], [-1.6, 0.8, 0.37, 0.42, false], [-1.6, -0.8, 0.37, 0.42, false]].forEach(([x, z, r, w, front]) => {
      const sz = Math.sign(z), pivot = new THREE.Group(); pivot.position.set(x, r, z); g.add(pivot); const spin = new THREE.Group(); pivot.add(spin);
      spin.add(new THREE.Mesh(front ? GEO.tyreF : GEO.tyreR, rubber));
      const rimG = new THREE.CylinderGeometry(r * 0.71, r * 0.71, w * 0.92, 32, 1, true); rimG.rotateX(Math.PI / 2); spin.add(new THREE.Mesh(rimG, rimM));
      for (const s of [-1, 1]) { const b = new THREE.Mesh(new THREE.RingGeometry(r * 0.72, r - 0.02, 48), new THREE.MeshStandardMaterial({ map: band, transparent: true, roughness: 0.7, depthWrite: false })); b.position.z = s * (w / 2 + 0.006); b.rotation.y = s > 0 ? 0 : Math.PI; spin.add(b);
        const cv = new THREE.Mesh(new THREE.CircleGeometry(r * 0.705, 32), coverM); cv.position.z = s * (w / 2 - 0.01); cv.rotation.y = s > 0 ? 0 : Math.PI; spin.add(cv); }
      const nut = new THREE.CylinderGeometry(0.045, 0.045, w + 0.03, 10); nut.rotateX(Math.PI / 2); spin.add(new THREE.Mesh(nut, X.redMat));
      // brake duct inboard of the wheel
      const bd = mesh(new THREE.BoxGeometry(0.34, 0.26, 0.1), carbon, g, x, r, z - sz * (w / 2 + 0.07)); bd.rotation.x = 0;
      // wishbones, push rod, track rod / driveshaft
      const ib = sz * (front ? 0.24 : 0.2), ob = z - sz * (w / 2 + 0.1);
      const L = [[V3(x + 0.28, 0.5, ib), V3(x, r + 0.13, ob), 0.017], [V3(x - 0.28, 0.5, ib), V3(x, r + 0.13, ob), 0.017],
        [V3(x + 0.32, 0.27, ib), V3(x, r - 0.14, ob), 0.017], [V3(x - 0.32, 0.27, ib), V3(x, r - 0.14, ob), 0.017],
        [V3(x - (front ? 0.25 : -0.25), 0.62, ib * 0.9), V3(x, r - 0.1, ob), 0.014]];
      L.push(front ? [V3(x + 0.12, 0.33, ib), V3(x + 0.12, r - 0.02, ob), 0.012] : [V3(x, r - 0.02, ib), V3(x, r - 0.02, ob), 0.03]);
      struts(g, L, carbon);
      wheels.push({ pivot, spin, r, front });
    });
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 2.6), new THREE.MeshBasicMaterial({ map: glowTex, color: C('#000000'), transparent: true, opacity: 0.8, depthWrite: false })); shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.03; g.add(shadow);
    g.traverse(m => { if (m.isMesh && m !== shadow) { m.castShadow = !LOWQ; m.receiveShadow = !LOWQ; } });
    return { g, wheels, rl };
  };
}
