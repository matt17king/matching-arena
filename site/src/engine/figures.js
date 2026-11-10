// People. Smooth, indexed figure meshes built from lofted torsos, tapered limbs and a head with a hairline,
// in three poses (seated, standing, cheering) and two levels of detail. All face -z, feet or seat base at the origin, in metres.
// Vertex colours mark what the instance colour tints: shirt = 1, trousers and shoes darker, hair darker still on the head.
export function buildFigures(THREE) {
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  // a part is { pos: [], nor: [], col: [], idx: [] }; merge() stitches parts into one indexed geometry
  const part = () => ({ pos: [], nor: [], col: [], idx: [] });
  const merge = parts => {
    const pos = [], nor = [], col = [], idx = []; let base = 0;
    parts.forEach(p => { pos.push(...p.pos); nor.push(...p.nor); col.push(...p.col); p.idx.forEach(i => idx.push(i + base)); base += p.pos.length / 3; });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx);
    return g;
  };
  // tapered limb from a to b; caps closed with a centre vertex so nothing reads as a tube
  const limb = (a, b, r0, r1, seg, shade = 1, cap = true) => {
    const p = part(), axis = b.clone().sub(a), len = axis.length(); axis.normalize();
    const ref = Math.abs(axis.y) > 0.9 ? V(1, 0, 0) : V(0, 1, 0), u = new THREE.Vector3().crossVectors(axis, ref).normalize(), w = new THREE.Vector3().crossVectors(axis, u).normalize();
    for (const [c, r] of [[a, r0], [b, r1]]) for (let i = 0; i < seg; i++) { const t = i / seg * Math.PI * 2, n = u.clone().multiplyScalar(Math.cos(t)).add(w.clone().multiplyScalar(Math.sin(t)));
      p.pos.push(c.x + n.x * r, c.y + n.y * r, c.z + n.z * r); const nn = n.clone().add(axis.clone().multiplyScalar((r0 - r1) / Math.max(len, 1e-4))).normalize(); p.nor.push(nn.x, nn.y, nn.z); p.col.push(shade, shade, shade); }
    for (let i = 0; i < seg; i++) { const j = (i + 1) % seg; p.idx.push(i, seg + j, seg + i, i, j, seg + j); }
    if (cap) { const k = p.pos.length / 3; p.pos.push(b.x, b.y, b.z); p.nor.push(axis.x, axis.y, axis.z); p.col.push(shade, shade, shade); for (let i = 0; i < seg; i++) p.idx.push(seg + i, seg + (i + 1) % seg, k); }
    return p;
  };
  // elliptical rings [y, halfWidth, halfDepth, zCentre] lofted into a torso; closed at the top
  const loft = (rings, seg, shade = 1) => {
    const p = part(), n = rings.length;
    rings.forEach(([y, rx, rz, cz], k) => { const dn = rings[Math.max(0, k - 1)], up = rings[Math.min(n - 1, k + 1)], slope = ((dn[1] - up[1]) + (dn[2] - up[2])) / 2 / Math.max(1e-4, up[0] - dn[0]);
      for (let i = 0; i < seg; i++) { const t = i / seg * Math.PI * 2, cx = Math.cos(t), sz = Math.sin(t); p.pos.push(cx * rx, y, cz + sz * rz);
        const nn = V(cx / Math.max(rx, 1e-4), 0, sz / Math.max(rz, 1e-4)).normalize(); nn.y = slope; nn.normalize(); p.nor.push(nn.x, nn.y, nn.z); p.col.push(shade, shade, shade); } });
    for (let k = 0; k < n - 1; k++) for (let i = 0; i < seg; i++) { const j = (i + 1) % seg, a = k * seg + i, b = k * seg + j, c = (k + 1) * seg + i, d = (k + 1) * seg + j; p.idx.push(a, c, d, a, d, b); }
    const top = rings[n - 1], kk = p.pos.length / 3; p.pos.push(0, top[0] + 0.01, top[3]); p.nor.push(0, 1, 0); p.col.push(shade, shade, shade);
    for (let i = 0; i < seg; i++) p.idx.push((n - 1) * seg + i, kk, (n - 1) * seg + (i + 1) % seg);
    return p;
  };
  // head: a slightly long sphere; everything above the brow and round the back is hair (a dark tint of the skin tone)
  const head = (c, r, seg, rings, hair = true) => {
    const p = part();
    for (let k = 0; k <= rings; k++) { const ph = k / rings * Math.PI, y = Math.cos(ph), rr = Math.sin(ph);
      for (let i = 0; i < seg; i++) { const t = i / seg * Math.PI * 2, x = Math.cos(t) * rr, z = Math.sin(t) * rr;
        p.pos.push(c.x + x * r * 0.9, c.y + y * r * 1.12, c.z + z * r); p.nor.push(x, y, z);
        const h = hair && (y > 0.42 || (z > 0.25 && y > -0.35)) ? 0.16 : 1; p.col.push(h, h, h); } }
    for (let k = 0; k < rings; k++) for (let i = 0; i < seg; i++) { const j = (i + 1) % seg, a = k * seg + i, b = k * seg + j, c2 = (k + 1) * seg + i, d = (k + 1) * seg + j; p.idx.push(a, d, c2, a, b, d); }
    return p;
  };
  const TR = 0.26, SH = 0.12;   // trouser and shoe shade against the shirt colour
  const mirror = f => [f(-1), f(1)];

  // ---- seated: on a stadium bucket seat (pan about 0.12 above the tread), hands resting on the thighs
  const seated = hi => {
    const s = hi ? 8 : 5, ls = hi ? 5 : 3;
    const P = [loft(hi ? [[0.14, 0.17, 0.115, 0.06], [0.3, 0.15, 0.1, 0.055], [0.5, 0.185, 0.115, 0.04], [0.64, 0.205, 0.1, 0.035], [0.71, 0.13, 0.075, 0.035], [0.75, 0.055, 0.05, 0.03]]
      : [[0.14, 0.18, 0.12, 0.06], [0.5, 0.2, 0.12, 0.04], [0.66, 0.22, 0.1, 0.035], [0.75, 0.06, 0.05, 0.03]], s)];
    mirror(x => { P.push(limb(V(x * 0.09, 0.2, 0.02), V(x * 0.1, 0.235, -0.36), 0.078, 0.062, ls, TR));                    // thigh
      if (hi) { P.push(limb(V(x * 0.1, 0.24, -0.36), V(x * 0.1, 0.03, -0.4), 0.058, 0.045, 4, TR), limb(V(x * 0.1, 0.03, -0.38), V(x * 0.1, 0.02, -0.5), 0.045, 0.035, 4, SH));   // shin, shoe
        P.push(limb(V(x * 0.215, 0.64, 0.03), V(x * 0.235, 0.42, -0.07), 0.052, 0.045, ls, 1, false), limb(V(x * 0.235, 0.42, -0.07), V(x * 0.14, 0.3, -0.3), 0.044, 0.034, ls)); }
    });   // from the far side of a stadium the arms are lost against the body, so the distant figure goes without
    return merge(P);
  };
  // ---- standing: arms by the sides (stewards, players on a sideline, coaches)
  const standing = (hi, arms = 'down') => {
    const s = hi ? 8 : 6, ls = hi ? 5 : 4;
    const P = [loft([[0.88, 0.165, 0.11, 0], [1.05, 0.15, 0.1, 0], [1.26, 0.185, 0.115, -0.01], [1.42, 0.205, 0.1, -0.01], [1.49, 0.13, 0.075, -0.01], [1.53, 0.055, 0.05, -0.01]], s)];
    mirror(x => { P.push(limb(V(x * 0.09, 0.92, 0), V(x * 0.1, 0.5, -0.01), 0.082, 0.06, ls, TR), limb(V(x * 0.1, 0.5, -0.01), V(x * 0.1, 0.07, 0.01), 0.058, 0.044, ls, TR), limb(V(x * 0.1, 0.04, 0.03), V(x * 0.1, 0.03, -0.14), 0.05, 0.038, 4, SH));
      if (arms === 'up') P.push(limb(V(x * 0.215, 1.42, -0.01), V(x * 0.33, 1.68, -0.05), 0.052, 0.044, ls, 1, false), limb(V(x * 0.33, 1.68, -0.05), V(x * 0.3, 1.98, -0.08), 0.043, 0.034, ls));
      else if (arms === 'cross') P.push(limb(V(x * 0.215, 1.42, -0.01), V(x * 0.25, 1.17, -0.06), 0.052, 0.044, ls, 1, false), limb(V(x * 0.25, 1.17, -0.06), V(-x * 0.06, 1.2, -0.17), 0.043, 0.036, ls));
      else P.push(limb(V(x * 0.215, 1.42, -0.01), V(x * 0.25, 1.16, 0), 0.052, 0.044, ls, 1, false), limb(V(x * 0.25, 1.16, 0), V(x * 0.25, 0.9, -0.04), 0.043, 0.034, ls)); });
    return merge(P);
  };
  const headAt = (y, z, hi, hair = true, r = 0.105) => merge([head(V(0, y, z), r, hi ? 8 : 5, hi ? 6 : 3, hair)]);
  return {
    seated: { hi: seated(true), lo: seated(false) }, seatedHead: { hi: headAt(0.865, 0.025, true), lo: headAt(0.865, 0.025, false) },
    stand: { hi: standing(true), lo: standing(false) }, cheer: { hi: standing(true, 'up'), lo: standing(false, 'up') }, cross: { hi: standing(true, 'cross'), lo: standing(false, 'cross') },
    standHead: { hi: headAt(1.645, -0.01, true), lo: headAt(1.645, -0.01, false) },
    helmet: headAt(1.65, -0.01, true, false, 0.135),
  };
}
