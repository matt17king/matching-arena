// Real netting for tennis, padel and basketball: an alpha-tested knotted mesh texture on a sagging surface,
// so it reads as cord from up close and as a soft veil from the overhead cameras.
export function netKit({ THREE, cnv }) {
  const tex = (() => {
    const S = 128, [c, g] = cnv(S, S); g.clearRect(0, 0, S, S); g.strokeStyle = '#ffffff'; g.lineWidth = 7; g.lineCap = 'round';
    g.beginPath(); g.moveTo(0, S / 2); g.lineTo(S, S / 2); g.moveTo(S / 2, 0); g.lineTo(S / 2, S); g.stroke();
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(S / 2, S / 2, 7, 0, 7); g.fill();                     // knot
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
  })();
  const diamond = (() => {
    const S = 128, [c, g] = cnv(S, S); g.clearRect(0, 0, S, S); g.strokeStyle = '#ffffff'; g.lineWidth = 8; g.lineCap = 'round';
    g.beginPath(); g.moveTo(0, 0); g.lineTo(S, S); g.moveTo(S, 0); g.lineTo(0, S); g.stroke();
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
  })();
  const mat = (color, map, rx, ry) => { const m = map.clone(); m.needsUpdate = true; m.repeat.set(rx, ry);
    return new THREE.MeshStandardMaterial({ color: new THREE.Color(color), map: m, alphaMap: m, alphaTest: 0.45, transparent: false, side: THREE.DoubleSide, roughness: 0.85 }); };

  // a racket-sport net across z (posts at ±half), top following top(z), mesh cells of `cell` metres
  function courtNet(half, top, { cell = 0.045, color = '#141414', tape = '#f3f2f2', bottom = 0.02 } = {}) {
    const g = new THREE.Group(), N = 48;
    const geo = new THREE.PlaneGeometry(1, 1, N, 1), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const u = p.getX(i) + 0.5, z = -half + u * 2 * half, isTop = p.getY(i) > 0; p.setXYZ(i, 0, isTop ? top(z) - 0.06 : bottom, z); }
    geo.computeVertexNormals(); geo.attributes.uv.needsUpdate = true;
    g.add(new THREE.Mesh(geo, mat(color, tex, 2 * half / cell / 2.2, 1 / cell / 2.2)));
    // white tape over the top: a folded band, both faces
    const tg = new THREE.PlaneGeometry(1, 1, N, 1), tp = tg.attributes.position;
    for (let i = 0; i < tp.count; i++) { const u = tp.getX(i) + 0.5, z = -half + u * 2 * half, isTop = tp.getY(i) > 0; tp.setXYZ(i, 0, top(z) + (isTop ? 0.01 : -0.065), z); }
    tg.computeVertexNormals();
    const tm = new THREE.MeshStandardMaterial({ color: new THREE.Color(tape), roughness: 0.6, side: THREE.DoubleSide });
    for (const dx of [-0.012, 0.012]) { const m = new THREE.Mesh(tg, tm); m.position.x = dx; g.add(m); }
    const cord = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(Array.from({ length: 17 }, (_, k) => { const z = -half + k / 16 * 2 * half; return new THREE.Vector3(0, top(z) + 0.012, z); })), 48, 0.012, 6, false);
    g.add(new THREE.Mesh(cord, tm));
    // centre strap
    const st = new THREE.Mesh(new THREE.BoxGeometry(0.03, top(0) - bottom, 0.05), tm); st.position.set(0, (top(0) + bottom) / 2 - 0.03, 0); g.add(st);
    return g;
  }
  // basketball net: a tapered sleeve hanging from the rim
  function hoopNet(r0, r1, h, color = '#f3f2f2') {
    const geo = new THREE.CylinderGeometry(r0, r1, h, 16, 6, true); geo.translate(0, -h / 2, 0);
    const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i), k = -y / h; p.setX(i, p.getX(i) * (1 - 0.12 * Math.sin(k * Math.PI))); p.setZ(i, p.getZ(i) * (1 - 0.12 * Math.sin(k * Math.PI))); }
    return new THREE.Mesh(geo, mat(color, diamond, 8, 4));
  }
  // chain-link / diamond fence panel material, `cell` metres per diamond
  const fence = (w, h, cell, color = '#3a3a3a') => mat(color, diamond, w / cell, h / cell);
  // netting on any surface: UVs are rewritten in metres so the mesh cells stay a constant size
  const knot = (color = '#f3f2f2') => mat(color, tex, 1, 1);
  const metric = (geo, cell, axes = ['x', 'y']) => { const p = geo.attributes.position, uv = geo.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, p['get' + axes[0].toUpperCase()](i) / cell, p['get' + axes[1].toUpperCase()](i) / cell); uv.needsUpdate = true; return geo; };
  return { courtNet, hoopNet, fence, knot, metric };
}
