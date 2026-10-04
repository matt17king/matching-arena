// Venues v10 — each sport is its own world. Built once, shown one at a time behind the broadcast sting.
export function buildVenues(X) {
  const { THREE, C, V3, cnv, texOf, box, rbox, cyl, stand, coneMat, ptsMat, radialTex, FONT, LS, RED, CHALK, ss, R, eo, clamp, flick, LOWQ, fogU, redMat, warmMat } = X;
  const SP = X.sport || {};
  const cr = (a, b, c, d, u) => { const u2 = u * u, u3 = u2 * u; return 0.5 * ((2 * b) + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u2 + (-a + 3 * b - 3 * c + d) * u3); };
  const path = K => t => {
    if (t <= K[0].t) return K[0]; const L = K[K.length - 1]; if (t >= L.t) return L;
    let i = 0; while (t > K[i + 1].t) i++; const u = (t - K[i].t) / (K[i + 1].t - K[i].t);
    const A = K[Math.max(0, i - 1)], B = K[i], Cc = K[i + 1], D = K[Math.min(K.length - 1, i + 2)];
    const f = k => [0, 1, 2].map(j => cr(A[k][j], B[k][j], Cc[k][j], D[k][j], u));
    return { pos: f('pos'), tgt: f('tgt'), fov: B.fov + (Cc.fov - B.fov) * ss(u) };
  };
  const noiseGL = `float h2(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
    float n2(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(h2(i),h2(i+vec2(1.0,0.0)),f.x),mix(h2(i+vec2(0.0,1.0)),h2(i+vec2(1.0,1.0)),f.x),f.y); }`;
  const [pBody, pHead] = (() => { const a = new THREE.BoxGeometry(0.4, 0.56, 0.3); a.translate(0, 0.68, 0.06); const b = new THREE.SphereGeometry(0.12, 8, 6); b.translate(0, 1.1, 0.06); return [a, b]; })();
  const SKIN = ['#c9a58a', '#8a6248', '#e0bfa4', '#5a3d2c', '#b08466'];
  function people(parent, seats, dens, pal, mat, skinMul = 1) {
    const pts = []; for (let i = 0; i < seats.length; i += 5) if (Math.random() < dens) pts.push([seats[i] + (Math.random() - 0.5) * 0.06, seats[i + 1], seats[i + 2]]);
    const bm = new THREE.InstancedMesh(pBody, mat, pts.length), hm = new THREE.InstancedMesh(pHead, mat, pts.length);
    const m4 = new THREE.Matrix4(), col = new THREE.Color();
    pts.forEach(([x, y, z], i) => { m4.makeTranslation(x, y, z); bm.setMatrixAt(i, m4); hm.setMatrixAt(i, m4); bm.setColorAt(i, col.set(pal[(Math.random() * pal.length) | 0])); hm.setColorAt(i, col.set(SKIN[i % SKIN.length]).multiplyScalar(skinMul)); });
    parent.add(bm, hm); return pts;
  }
  function bowl(parent, defs, seatCol, pal, pMat, dens, skinMul) {
    const heads = [];
    defs.forEach(([x, y, z, len, tier, ry]) => {
      const s = stand(len, tier, {}); const og = new THREE.Group(); og.position.set(x, y, z); og.rotation.y = ry; og.add(s.g); parent.add(og);
      const im = s.g.children.find(c => c.isInstancedMesh); if (im) { const col = new THREE.Color(); for (let i = 0; i < im.count; i++) { im.setColorAt(i, col.set(seatCol).multiplyScalar(0.85 + Math.random() * 0.3)); } im.instanceColor.needsUpdate = true; }
      const pts = people(s.g, s.seats, dens, pal, pMat, skinMul);
      const c = Math.cos(ry), sn = Math.sin(ry);
      pts.forEach(([lx, ly, lz]) => heads.push(lx * c + lz * sn + x, ly + 1.12 + y, -lx * sn + lz * c + z));
    });
    return heads;
  }

  // ======================= TENNIS — grass show court, summer evening
  const tennis = (() => {
    const g = new THREE.Group();
    g.add(new THREE.HemisphereLight(0xe4ebef, 0x3c4a30, 1.2));
    const sun = new THREE.DirectionalLight(0xfff0dc, 2.3); sun.position.set(-30, 55, 22); g.add(sun);
    const gU = { uLines: { value: 0 }, ...fogU };
    const grass = new THREE.Mesh(new THREE.PlaneGeometry(37.2, 20.8), new THREE.ShaderMaterial({
      uniforms: gU,
      vertexShader: `varying vec3 vW; varying float vD; void main(){ vec4 w=modelMatrix*vec4(position,1.0); vW=w.xyz; vec4 mv=viewMatrix*w; vD=-mv.z; gl_Position=projectionMatrix*mv; }`,
      fragmentShader: `uniform float uLines; uniform float uFogDen; uniform vec3 uFogCol; varying vec3 vW; varying float vD; ${noiseGL}
        float seg(float d,float hw){ float aa=fwidth(d)*1.2+0.002; return 1.0-smoothstep(hw-aa,hw+aa,d); }
        void main(){
          vec2 p=vW.xz; float ax=abs(p.x), az=abs(p.y);
          float st=step(0.5,fract(p.x/2.0+0.25));
          vec3 g=mix(vec3(0.17,0.31,0.12),vec3(0.13,0.25,0.09),st);
          g*=0.88+0.16*n2(p*2.3)+0.07*(n2(p*vec2(30.0,3.0))-0.5);
          float wear=exp(-pow((ax-12.6)/1.5,2.0))*(1.0-smoothstep(1.5,4.0,az))+0.45*exp(-pow((ax-6.4)/0.8,2.0))*(1.0-smoothstep(0.0,1.2,az));
          g=mix(g,vec3(0.36,0.31,0.2)*(0.8+0.3*n2(p*6.0)),clamp(wear*0.75,0.0,0.85));
          float L=11.885, D=5.485, S=4.115, SV=6.4, ln=0.0;
          ln=max(ln,seg(abs(ax-L),0.05)*step(az,D+0.05));
          ln=max(ln,seg(abs(az-D),0.025)*step(ax,L+0.05));
          ln=max(ln,seg(abs(az-S),0.025)*step(ax,L+0.05));
          ln=max(ln,seg(abs(ax-SV),0.025)*step(az,S+0.025));
          ln=max(ln,seg(az,0.025)*step(ax,SV));
          ln=max(ln,seg(az,0.025)*step(L-0.1,ax)*step(ax,L));
          ln*=1.0-smoothstep(uLines*1.25-0.25,uLines*1.25-0.2,(p.x+13.0)/26.0);
          vec3 c=mix(g,vec3(0.92,0.92,0.9),ln);
          c*=1.12*(1.0-0.3*smoothstep(8.0,10.4,az)-0.25*smoothstep(16.0,18.6,ax));
          float f=1.0-exp(-uFogDen*uFogDen*vD*vD); c=mix(c,uFogCol,f);
          gl_FragColor=vec4(c,1.0);
          #include <colorspace_fragment>
        }`,
    }));
    grass.rotation.x = -Math.PI / 2; g.add(grass);
    const wallM = new THREE.MeshStandardMaterial({ color: C('#16301f'), roughness: 0.85 });
    box(g, 37.6, 2.6, 0.3, 0, 1.3, 10.55, wallM); box(g, 37.6, 2.6, 0.3, 0, 1.3, -10.55, wallM);
    box(g, 0.3, 2.6, 21.4, 18.75, 1.3, 0, wallM); box(g, 0.3, 2.6, 21.4, -18.75, 1.3, 0, wallM);
    box(g, 37.6, 0.06, 0.32, 0, 2.62, 10.55, new THREE.MeshStandardMaterial({ color: C('#d9d6d0'), roughness: 0.6 })); box(g, 37.6, 0.06, 0.32, 0, 2.62, -10.55, new THREE.MeshStandardMaterial({ color: C('#d9d6d0'), roughness: 0.6 }));
    const pMat = new THREE.MeshStandardMaterial({ roughness: 0.85 });
    bowl(g, [[0, 1.2, 10.8, 40, 7, 0], [0, 1.2, -10.8, 40, 7, Math.PI], [19.1, 1.2, 0, 22, 7, Math.PI / 2], [-19.1, 1.2, 0, 22, 7, -Math.PI / 2]],
      '#173a26', ['#ecebe6', '#dedbd3', '#2a3140', '#3b4a5c', '#8e8a84', '#b9b2a6', '#ec3013', '#1d2a22', '#c7c0b0', '#6d5a4a', '#f3f2f2'], pMat, LOWQ ? 0.45 : 0.8, 1);
    // roof ring with the light strip the camera rises into
    const roofM = new THREE.MeshStandardMaterial({ color: C('#2a2726'), roughness: 0.8 });
    box(g, 50, 0.6, 14, 0, 16.4, 17.2, roofM); box(g, 50, 0.6, 14, 0, 16.4, -17.2, roofM);
    box(g, 14, 0.6, 21, 25.4, 16.4, 0, roofM); box(g, 14, 0.6, 21, -25.4, 16.4, 0, roofM);
    const stripM = new THREE.MeshBasicMaterial({ color: C('#fff4e4').multiplyScalar(2.4) });
    box(g, 36, 0.12, 0.3, 0, 16.05, 10.4, stripM); box(g, 36, 0.12, 0.3, 0, 16.05, -10.4, stripM);
    box(g, 0.3, 0.12, 19, 18.6, 16.05, 0, stripM); box(g, 0.3, 0.12, 19, -18.6, 16.05, 0, stripM);
    // net
    { const [c, cg] = cnv(1024, 96); cg.fillStyle = 'rgba(12,11,11,0.5)'; cg.fillRect(0, 0, 1024, 96); cg.strokeStyle = 'rgba(12,11,11,1)'; cg.lineWidth = 3;
      for (let x = 0; x <= 1024; x += 8) { cg.beginPath(); cg.moveTo(x, 0); cg.lineTo(x, 96); cg.stroke(); }
      for (let y = 0; y <= 96; y += 8) { cg.beginPath(); cg.moveTo(0, y); cg.lineTo(1024, y); cg.stroke(); }
      const net = new THREE.Mesh(new THREE.PlaneGeometry(12.8, 0.92), new THREE.MeshBasicMaterial({ map: texOf(c), transparent: true, side: THREE.DoubleSide, depthWrite: false, color: C('#ffffff').multiplyScalar(0.7) }));
      net.rotation.y = Math.PI / 2; net.position.set(0, 0.5, 0); g.add(net);
      const tape = new THREE.MeshStandardMaterial({ color: C('#efede8'), roughness: 0.6 });
      box(g, 0.04, 0.07, 12.8, 0, 0.95, 0, tape); box(g, 0.03, 0.92, 0.05, 0, 0.47, 0, tape);
      const postM = new THREE.MeshStandardMaterial({ color: C('#16301f'), roughness: 0.6 });
      for (const sz of [-1, 1]) cyl(g, 0.05, 1.07, 'y', 0, 0.535, sz * 6.4, postM, 12);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(g, 0.035, 1.95, 'y', sx * 0.32, 0.975, -7.5 + sz * 0.28, postM, 6);
      rbox(g, 0.84, 0.08, 0.72, 0, 1.98, -7.5, postM, 0.03); rbox(g, 0.84, 0.6, 0.06, 0, 2.3, -7.84, postM, 0.03);
      for (const sx of [-1, 1]) rbox(g, 1.6, 0.5, 0.5, sx * 2.2, 0.25, -9.4, postM, 0.05); }
    // in-world scoreboard: the stat, on the board
    const [bC, bG] = cnv(1024, 512); const bT = texOf(bC); let bK = -1;
    const TD = SP.tennis || { title: 'PRESS CONFERENCE VIEWS', rows: [['A. EALA', '676K', 1], ['N. DJOKOVIC', '70K', 0.104]] };
    const drawBoard = k => {
      bG.fillStyle = '#0f2418'; bG.fillRect(0, 0, 1024, 512); bG.strokeStyle = 'rgba(243,242,242,0.85)'; bG.lineWidth = 6; bG.strokeRect(14, 14, 996, 484);
      bG.fillStyle = CHALK; bG.font = FONT(800, 34); LS(bG, '6px'); bG.textBaseline = 'middle'; bG.fillText(TD.title, 54, 72);
      bG.fillStyle = RED; bG.fillRect(54, 104, 916, 6);
      TD.rows.forEach(([n, v, f], i) => {
        const y = 200 + i * 150; bG.fillStyle = CHALK; bG.font = FONT(800, 70); LS(bG, '0px'); bG.fillText(n, 54, y);
        bG.textAlign = 'right'; bG.fillText(v, 970, y); bG.textAlign = 'left';
        bG.fillStyle = 'rgba(243,242,242,0.12)'; bG.fillRect(54, y + 50, 916, 20); bG.fillStyle = i ? CHALK : RED; bG.fillRect(54, y + 50, 916 * f * k, 20);
      });
      bT.needsUpdate = true;
    };
    drawBoard(0);
    box(g, 0.5, 5.2, 10, 19.4, 9.6, 0, wallM);
    const board = new THREE.Mesh(new THREE.PlaneGeometry(9.4, 4.7), new THREE.MeshBasicMaterial({ map: bT, color: C('#ffffff').multiplyScalar(1.05) }));
    board.rotation.y = -Math.PI / 2; board.position.set(19.13, 9.6, 0); g.add(board);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.05, 20, 14), new THREE.MeshStandardMaterial({ color: C('#d4dd48'), roughness: 0.85 })); g.add(ball);
    const BH = V3(-12.4, 3.0, 1.2), BB = V3(5.4, 0.05, -2.4), BE = V3(13.8, 1.7, -4.6);
    const cam = path([
      { t: 0, pos: [-13.05, 3.05, 1.7], tgt: [-12.4, 3.0, 1.2], fov: 30 },
      { t: 0.08, pos: [-15.6, 2.7, 3.2], tgt: [-12, 2.4, 0.8], fov: 34 },
      { t: 0.17, pos: [-18, 5.6, 0.6], tgt: [4, 0.4, 0], fov: 48 },
      { t: 0.3, pos: [-17.6, 6.2, 3.6], tgt: [4, 0.2, -0.5], fov: 46 },
      { t: 0.42, pos: [-7, 2.4, -6.2], tgt: [19, 10.6, 0], fov: 40 },
      { t: 0.56, pos: [-3, 2.6, -5.4], tgt: [19, 10.4, 0], fov: 36 },
      { t: 0.72, pos: [-14, 13.5, 8], tgt: [3, 0, -2], fov: 50 },
      { t: 0.86, pos: [12, 9, -8.5], tgt: [-2, 0.5, 0], fov: 50 },
      { t: 0.94, pos: [2, 9, -2], tgt: [0, 16, 9], fov: 58 },
      { t: 1, pos: [0.4, 14.6, 7.4], tgt: [0, 16.05, 10.4], fov: 72 },
    ]);
    return {
      group: g, cam,
      env: { top: '#6f8799', haze: '#efe8dc', glow: 1.45, fog: '#c3c6c0', fogDen: 0.0035, bloom: 0.1 },
      update(t, dt, time) {
        gU.uLines.value = R(t, 0.12, 0.3);
        const k = R(t, 0.34, 0.5); if (Math.abs(k - bK) > 0.008 || (k === 1 && bK !== 1)) { bK = k; drawBoard(k); }
        ball.visible = t < 0.27;
        if (t < 0.13) ball.position.set(BH.x, BH.y + 0.04 * Math.sin(time * 1.5), BH.z);
        else if (t < 0.2) { const u = (t - 0.13) / 0.07; ball.position.lerpVectors(BH, BB, u); ball.position.y += 0.45 * Math.sin(Math.PI * u); }
        else { const u = (t - 0.2) / 0.07; ball.position.lerpVectors(BB, BE, u); ball.position.y += 1.1 * Math.sin(Math.PI * u); }
        ball.rotation.x += dt * 12;
      },
    };
  })();

  // ======================= FIGHT — black-box arena, one rig, one ring
  const RNDS = SP.rounds || [], RR = SP.roundR || [0.17, 0.85];
  const fight = (() => {
    const g = new THREE.Group();
    const hemi = new THREE.HemisphereLight(0x8890a0, 0x100c0b, 0.05); g.add(hemi);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), new THREE.MeshStandardMaterial({ color: C('#0e0d0d'), roughness: 0.38, metalness: 0.25 }));
    floor.rotation.x = -Math.PI / 2; g.add(floor);
    const PH = 1.1, RS = 3.65, RY = 9.6;
    const [rC, rG] = cnv(1024, 1024); const ringTex = texOf(rC);
    const [jC, jG] = cnv(1024, 576); const jTex = texOf(jC);
    const draw = i => {
      rG.fillStyle = '#c9c4bd'; rG.fillRect(0, 0, 1024, 1024);
      for (let k = 0; k < 2500; k++) { rG.fillStyle = `rgba(${k % 2 ? '60,55,50' : '250,248,244'},${Math.random() * 0.08})`; rG.fillRect(Math.random() * 1024, Math.random() * 1024, 2 + Math.random() * 6, 1 + Math.random() * 2); }
      rG.strokeStyle = '#201e1d'; rG.lineWidth = 6; rG.strokeRect(40, 40, 944, 944);
      rG.strokeStyle = RED; rG.lineWidth = 26; rG.beginPath(); rG.arc(512, 512, 300, 0, 7); rG.stroke();
      rG.textAlign = 'center'; rG.textBaseline = 'middle'; rG.fillStyle = '#201e1d';
      LS(rG, '10px'); rG.font = FONT(800, 40); rG.fillText(i < 0 ? 'MATT KING' : 'ROUND', 512, 345);
      LS(rG, '-12px'); rG.font = FONT(800, 300); rG.fillStyle = RED; rG.fillText(i < 0 ? 'MK' : String(i + 1).padStart(2, '0'), 512, 520);
      const nm = i < 0 ? 'SIX ROUNDS' : ((RNDS[i] || {}).name || '').toUpperCase(); LS(rG, '6px'); rG.fillStyle = '#201e1d'; let fs = 46; rG.font = FONT(800, fs); while (rG.measureText(nm).width > 460 && fs > 24) { fs -= 2; rG.font = FONT(800, fs); } rG.fillText(nm, 512, 700);
      ringTex.needsUpdate = true;
      jG.fillStyle = '#0b0a0a'; jG.fillRect(0, 0, 1024, 576); jG.fillStyle = RED; jG.fillRect(0, 0, 1024, 14);
      jG.textBaseline = 'alphabetic'; jG.textAlign = 'left'; jG.fillStyle = 'rgba(243,242,242,0.7)'; jG.font = FONT(800, 36); LS(jG, '8px'); jG.fillText(i < 0 ? 'MATT KING' : `ROUND ${String(i + 1).padStart(2, '0')} / ${String(RNDS.length).padStart(2, '0')}`, 56, 96);
      jG.fillStyle = CHALK; LS(jG, '-6px'); let f2 = 150; jG.font = FONT(800, f2); while (jG.measureText(nm).width > 910 && f2 > 60) { f2 -= 6; jG.font = FONT(800, f2); } jG.fillText(nm, 52, 330);
      jG.fillStyle = RED; jG.font = FONT(800, 44); LS(jG, '4px'); jG.fillText(i < 0 ? 'CAREER IN SIX ROUNDS' : ((RNDS[i] || {}).years || ''), 56, 470);
      for (let y = 0; y < 576; y += 4) { jG.fillStyle = 'rgba(11,10,10,0.35)'; jG.fillRect(0, y, 1024, 1); }
      jTex.needsUpdate = true;
    };
    let idx = -9; draw(-1); idx = -1;
    const ring = new THREE.Group(); g.add(ring);
    box(ring, 7.9, PH, 7.9, 0, PH / 2, 0, 'dark', true);
    box(ring, 7.96, 0.09, 7.96, 0, PH - 0.14, 0, redMat);
    const top = new THREE.Mesh(new THREE.PlaneGeometry(7.8, 7.8), new THREE.MeshStandardMaterial({ map: ringTex, roughness: 0.95 })); top.rotation.x = -Math.PI / 2; top.position.y = PH + 0.004; ring.add(top);
    const padR = new THREE.MeshStandardMaterial({ color: C(RED), roughness: 0.6 }), padW = new THREE.MeshStandardMaterial({ color: C('#d8d4cf'), roughness: 0.6 });
    const ropeR = new THREE.MeshStandardMaterial({ color: C(RED), roughness: 0.5, emissive: C(RED), emissiveIntensity: 0.15 }), ropeW = new THREE.MeshStandardMaterial({ color: C('#e6e2dd'), roughness: 0.5 });
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sz], i) => { cyl(ring, 0.07, 1.6, 'y', sx * RS, PH + 0.8, sz * RS, 'steel', 10); rbox(ring, 0.24, 1.25, 0.24, sx * (RS - 0.06), PH + 0.82, sz * (RS - 0.06), i % 2 ? padW : padR, 0.05); });
    [0.42, 0.78, 1.14, 1.5].forEach((h, k) => { const m = k % 2 ? ropeW : ropeR; for (const s of [-1, 1]) { cyl(ring, 0.03, RS * 2, 'x', 0, PH + h, s * RS, m, 8); cyl(ring, 0.03, RS * 2, 'z', s * RS, PH + h, 0, m, 8); } });
    for (const [sx, sz, m] of [[-1, -1, padR], [1, 1, padW]]) { rbox(g, 0.5, 0.5, 0.5, sx * 4.5, PH + 0.25 - PH, sz * 4.5, m, 0.05); }
    // ringside press row
    const scrM = new THREE.MeshBasicMaterial({ color: C('#cfd6dc').multiplyScalar(0.55) });
    for (const sz of [-1, 1]) { box(g, 9, 0.75, 0.75, 0, 0.375, sz * 5.6, 'dark'); for (let x = -3.6; x <= 3.6; x += 1.2) { const s = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.28), scrM); s.position.set(x, 0.92, sz * 5.62); s.rotation.y = sz > 0 ? 0 : Math.PI; s.rotation.x = sz > 0 ? -0.25 : 0.25; g.add(s); } }
    // the rig
    for (const s of [-1, 1]) { box(g, 10.6, 0.36, 0.36, 0, RY, s * 5.2, 'steel'); box(g, 0.36, 0.36, 10.6, s * 5.2, RY, 0, 'steel'); for (const s2 of [-1, 1]) cyl(g, 0.012, 30, 'y', s * 5.2, RY + 15, s2 * 5.2, 'steel', 4); }
    const lamps = []; const lensG = new THREE.CircleGeometry(0.2, 20);
    [[0, -5.2], [0, 5.2], [-5.2, 0], [5.2, 0]].forEach(([bx, bz], side) => {
      for (let k = -2; k <= 2; k++) {
        const x = bx === 0 ? k * 1.9 : bx, z = bz === 0 ? k * 1.9 : bz;
        cyl(g, 0.24, 0.48, 'y', x, RY - 0.42, z, 'dark', 14);
        const m = new THREE.MeshBasicMaterial({ color: C('#151413') }); const l = new THREE.Mesh(lensG, m); l.rotation.x = Math.PI / 2; l.position.set(x, RY - 0.67, z); g.add(l);
        lamps.push({ m, at: 0.025 + lamps.length * 0.0035 });
      }
    });
    const key = new THREE.SpotLight(0xfff2e4, 0, 40, 0.62, 0.5, 1); key.position.set(0, RY, 0); key.target.position.set(0, PH, 0); g.add(key, key.target);
    const rim = new THREE.SpotLight(0xffd9c8, 0, 40, 0.5, 0.6, 1); rim.position.set(7, RY, -7); rim.target.position.set(0, PH + 1, 0); g.add(rim, rim.target);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(4.4, 5.8, RY - PH, 40, 1, true), coneMat('#fff1e4')); shaft.position.y = (RY + PH) / 2; g.add(shaft);
    const dp = [], dph = []; for (let i = 0; i < 600; i++) { const a = Math.random() * 6.283, r = Math.sqrt(Math.random()) * 5; dp.push(Math.cos(a) * r, Math.random() * 34, Math.sin(a) * r); dph.push(Math.random()); }
    const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.Float32BufferAttribute(dp, 3)); dg.setAttribute('aPh', new THREE.Float32BufferAttribute(dph, 1));
    const dust = new THREE.Points(dg, ptsMat('#fff6ec', 0.12, true)); g.add(dust);
    // centre-hung screen
    const jg = new THREE.Group(); jg.position.set(0, 15.2, 0); g.add(jg);
    box(jg, 5.4, 3.1, 5.4, 0, 0, 0, 'dark'); box(jg, 5.5, 0.12, 5.5, 0, -1.6, 0, redMat);
    const jm = new THREE.MeshBasicMaterial({ map: jTex, color: C('#ffffff').multiplyScalar(1.1) });
    for (let k = 0; k < 4; k++) { const s = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 2.92), jm); const a = k * Math.PI / 2; s.position.set(Math.sin(a) * 2.72, 0, Math.cos(a) * 2.72); s.rotation.y = a; jg.add(s); }
    for (const s of [-1, 1]) for (const s2 of [-1, 1]) cyl(g, 0.012, 14, 'y', s * 2.4, 23.7, s2 * 2.4, 'steel', 4);
    // the crowd, in the dark
    const pMat = new THREE.MeshStandardMaterial({ roughness: 0.9 });
    const heads = bowl(g, [[0, 0, 11.5, 30, 6, 0], [0, 0, -11.5, 30, 6, Math.PI], [11.5, 0, 0, 22, 6, Math.PI / 2], [-11.5, 0, 0, 22, 6, -Math.PI / 2]],
      '#1a1817', ['#1c1a19', '#262321', '#2f2b29', '#191817', '#3a1a14'], pMat, LOWQ ? 0.5 : 0.85, 0.5);
    const ph = []; for (let i = 0; i < heads.length; i += 3) if (Math.random() < 0.14) ph.push(heads[i], heads[i + 1] + 0.1, heads[i + 2]);
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.Float32BufferAttribute(ph, 3)); pg.setAttribute('aPh', new THREE.Float32BufferAttribute(new Float32Array(ph.length / 3).map(() => Math.random()), 1));
    const phones = new THREE.Points(pg, ptsMat('#fff1e2', 0.32, false)); g.add(phones);
    const entry = path([
      { t: 0, pos: [0.3, 1.6, 0.6], tgt: [0, RY, 0], fov: 74 },
      { t: 0.09, pos: [0.4, 2.3, 3.2], tgt: [0, 6.5, 0], fov: 62 },
      { t: 0.17, pos: [0, 3.2, 12.5], tgt: [0, 1.9, 0], fov: 44 },
    ]);
    const orbit = t => { const u = clamp((t - 0.17) / 0.69); const a = u * 3.2, rad = 12.5 - 3 * Math.sin(u * Math.PI), y = 3.2 + 1.4 * Math.sin(u * Math.PI * 2); return { pos: [Math.sin(a) * rad, y, Math.cos(a) * rad], tgt: [0, 1.9, 0], fov: 44 }; };
    const o1 = orbit(0.86);
    const exit = path([{ t: 0.86, ...o1 }, { t: 0.94, pos: [-0.6, 5.6, -3.8], tgt: [0, RY, -5.2], fov: 56 }, { t: 1, pos: [0, RY - 1.25, -4.7], tgt: [0, RY - 0.67, -5.2], fov: 74 }]);
    return {
      group: g,
      cam: t => t <= 0.17 ? entry(t) : t <= 0.86 ? orbit(t) : exit(t),
      env: { top: '#020202', haze: '#120c0a', glow: 0, fog: '#060505', fogDen: 0.016, bloom: 0.6 },
      update(t, dt, time) {
        let on = 0; lamps.forEach(L => { const v = flick(t, L.at, 0.01); on += v; L.m.color.setRGB(0.03 + v * 3.0, 0.03 + v * 2.85, 0.03 + v * 2.6); });
        on /= lamps.length;
        key.intensity = 30 * on; rim.intensity = 12 * on; shaft.material.uniforms.uOp.value = 0.11 * on;
        dust.material.uniforms.uOp.value = 0.8 * on; dust.material.uniforms.uTime.value = time;
        phones.material.uniforms.uOp.value = 0.9; phones.material.uniforms.uTime.value = time;
        const n = RNDS.length; const i = t < RR[0] ? -1 : Math.min(n - 1, Math.floor((t - RR[0]) / (RR[1] - RR[0]) * n));
        if (i !== idx) { idx = i; draw(i); }
        jg.rotation.y += dt * 0.08;
      },
    };
  })();

  // ======================= GOLF — the 18th green at dusk
  const golf = (() => {
    const g = new THREE.Group();
    g.add(new THREE.HemisphereLight(0x8a9ac0, 0x2a3420, 1.3));
    const sun = new THREE.DirectionalLight(0xffd2ac, 2.9); sun.position.set(260, 120, -60); g.add(sun);
    const H = (x, z) => { const r = Math.hypot(x, z); const b = 2.4 * Math.sin(x * 0.016 + 1.3) * Math.cos(z * 0.013) + 1.3 * Math.sin((x + z) * 0.034) + 0.6 * Math.sin(x * 0.07 - z * 0.05); const f = ss((r - 16) / 34); return 0.4 * (1 - f) + (b + 1.2) * f + Math.max(0, r - 180) * 0.06; };
    const seg = LOWQ ? 130 : 230; const tg = new THREE.PlaneGeometry(900, 900, seg, seg); tg.rotateX(-Math.PI / 2);
    { const a = tg.attributes.position; for (let i = 0; i < a.count; i++) a.setY(i, H(a.getX(i), a.getZ(i))); tg.computeVertexNormals(); }
    const HOLE = V3(6, 0.4, -2), BALL0 = V3(-7, 0.452, 3);
    const tm = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 });
    tm.onBeforeCompile = sh => {
      sh.uniforms.uHole = { value: new THREE.Vector2(HOLE.x, HOLE.z) };
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vGP;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvGP=(modelMatrix*vec4(transformed,1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
        varying vec3 vGP; uniform vec2 uHole; ${noiseGL}
        float dseg(vec2 p,vec2 a,vec2 b){ vec2 pa=p-a, ba=b-a; float h=clamp(dot(pa,ba)/dot(ba,ba),0.0,1.0); return length(pa-ba*h); }`)
        .replace('#include <color_fragment>', `#include <color_fragment>
        vec2 p=vGP.xz; float n1=n2(p*0.9), n3=n2(p*0.05);
        vec3 rough=vec3(0.035,0.065,0.03)*(0.7+0.5*n1+0.3*(n3-0.5));
        float fw=dseg(p,vec2(-170.0,40.0),vec2(-6.0,2.0))-(15.0+5.0*(n2(p*0.03)-0.5));
        float fst=step(0.5,fract(dot(p,vec2(0.97,-0.24))/5.0));
        vec3 fair=vec3(0.095,0.2,0.06)*(0.88+0.15*n1+0.08*fst);
        vec3 c=mix(fair,rough,smoothstep(-0.6,0.6,fw));
        float d=length(p*vec2(0.82,1.0))-(12.5+3.0*(n2(p*0.11)-0.5)*2.0+1.0*n2(p*0.37));
        float gst=step(0.5,fract((p.x*0.8+p.y*0.6)/2.2));
        vec3 green=vec3(0.12,0.27,0.085)*(0.94+0.05*n1+0.08*gst);
        vec3 fringe=vec3(0.08,0.17,0.055)*(0.9+0.2*n1);
        c=mix(c,mix(green,fringe,smoothstep(-0.15,0.15,d)),1.0-smoothstep(1.4,1.8,d));
        float bd=min(length((p-vec2(-4.0,14.5))*vec2(0.55,1.0))-2.6-n2(p*0.6),length((p-vec2(12.0,-11.5))*vec2(1.0,0.6))-2.2-n2(p*0.7));
        c=mix(c,vec3(0.5,0.44,0.33)*(0.9+0.15*n1),1.0-smoothstep(-0.1,0.1,bd));
        float hd=length(p-uHole); c=mix(c,vec3(0.004),1.0-smoothstep(0.075,0.085,hd));
        diffuseColor.rgb=c;`);
    };
    g.add(new THREE.Mesh(tg, tm));
    // treeline silhouettes
    { const cone = new THREE.ConeGeometry(2.4, 8, 7); cone.translate(0, 5.2, 0); const tm2 = new THREE.MeshStandardMaterial({ color: C('#0b130d'), roughness: 1 });
      const n = LOWQ ? 170 : 340, im = new THREE.InstancedMesh(cone, tm2, n); const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(); let k = 0;
      const dsg = (x, z) => { const ax = -170, az = 40, bx = -6, bz = 2, px = x - ax, pz = z - az, vx = bx - ax, vz = bz - az; const h = clamp((px * vx + pz * vz) / (vx * vx + vz * vz)); return Math.hypot(px - vx * h, pz - vz * h); };
      while (k < n) { const a = Math.random() * 6.283, r = 40 + Math.pow(Math.random(), 0.7) * 300, x = Math.cos(a) * r, z = Math.sin(a) * r; if (dsg(x, z) < 30 || (x > 22 && x < 52 && Math.abs(z) < 24)) continue; const s = 0.7 + Math.random() * 1.1; sc.set(s, s * (0.8 + Math.random() * 0.6), s); m4.compose(V3(x, H(x, z) - 0.3, z), q, sc); im.setMatrixAt(k++, m4); }
      g.add(im); }
    // grandstand behind the green
    bowl(g, [[34, H(34, 0) - 0.2, 0, 32, 5, Math.PI / 2]], '#24302a', ['#e6e2da', '#2b3442', '#7a6f62', '#b9b0a2', '#3c4a3e', '#ec3013', '#d9d4ca'], new THREE.MeshStandardMaterial({ roughness: 0.9 }), LOWQ ? 0.4 : 0.75, 0.8);
    // the leaderboard
    const HD = SP.holes || [];
    const [lC, lG] = cnv(1024, 680); const lT = texOf(lC); let lIdx = -9;
    const drawLB = i => {
      lG.fillStyle = '#ece9e4'; lG.fillRect(0, 0, 1024, 680); lG.fillStyle = '#201e1d'; lG.fillRect(0, 0, 1024, 110);
      lG.fillStyle = CHALK; lG.font = FONT(800, 58); LS(lG, '10px'); lG.textBaseline = 'middle'; lG.fillText('LEADERS', 44, 58);
      lG.font = FONT(800, 26); LS(lG, '4px'); lG.textAlign = 'right'; lG.fillText('MATT KING — THE SCORECARD', 980, 60); lG.textAlign = 'left';
      lG.fillStyle = 'rgba(32,30,29,0.55)'; lG.font = FONT(800, 22); LS(lG, '4px'); lG.fillText('HOLE', 44, 146); lG.fillText('RESULT', 170, 146); lG.fillText('WHERE', 520, 146);
      HD.forEach((h, k) => {
        const y = 200 + k * 78; lG.fillStyle = 'rgba(32,30,29,0.14)'; lG.fillRect(30, y + 36, 964, 2);
        if (k === i) { lG.fillStyle = 'rgba(236,48,19,0.12)'; lG.fillRect(30, y - 34, 964, 70); }
        lG.fillStyle = '#201e1d'; lG.font = FONT(800, 40); LS(lG, '0px'); lG.fillText(String(k + 1).padStart(2, '0'), 44, y);
        if (k <= i) { lG.fillStyle = RED; lG.font = FONT(800, 54); LS(lG, '-2px'); lG.fillText(h.v, 170, y + 2); lG.fillStyle = '#201e1d'; lG.font = FONT(800, 28); LS(lG, '3px'); lG.fillText((h.where || '').toUpperCase(), 520, y); }
      });
      lT.needsUpdate = true;
    };
    drawLB(-1); lIdx = -1;
    { const lx = 22, lz = -16, ly = H(lx, lz); const lg = new THREE.Group(); lg.position.set(lx, ly, lz); lg.rotation.y = Math.atan2(-34, 21); g.add(lg);
      const fm = new THREE.MeshStandardMaterial({ color: C('#1c2a22'), roughness: 0.7 });
      rbox(lg, 7.6, 5.0, 0.3, 0, 4.2, -0.18, fm, 0.05); cyl(lg, 0.12, 2.2, 'y', -3, 1.1, -0.2, fm, 8); cyl(lg, 0.12, 2.2, 'y', 3, 1.1, -0.2, fm, 8);
      const b = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 4.78), new THREE.MeshBasicMaterial({ map: lT, color: C('#ffffff').multiplyScalar(0.92) })); b.position.set(0, 4.2, 0); lg.add(b); }
    // pin, flag, ball, the read
    const flagG = new THREE.Group(); flagG.position.copy(HOLE); g.add(flagG);
    cyl(flagG, 0.013, 2.4, 'y', 0, 1.15, 0, 'white', 8);
    const fGeo = new THREE.PlaneGeometry(0.6, 0.38, 12, 1); fGeo.translate(0.3, 0, 0); const fBase = fGeo.attributes.position.array.slice();
    const flag = new THREE.Mesh(fGeo, new THREE.MeshBasicMaterial({ color: C(RED).multiplyScalar(1.1), side: THREE.DoubleSide })); flag.position.y = 2.15; flagG.add(flag);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.052, 24, 16), new THREE.MeshStandardMaterial({ color: C('#f3f2f2'), roughness: 0.35, emissive: C('#8a8784') })); ball.position.copy(BALL0); g.add(ball);
    const hit = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 6), new THREE.MeshBasicMaterial({ visible: false })); ball.add(hit);
    const gring = new THREE.Mesh(new THREE.RingGeometry(0.16, 0.2, 40), new THREE.MeshBasicMaterial({ color: C(RED).multiplyScalar(1.4), transparent: true, opacity: 0, depthWrite: false })); gring.rotation.x = -Math.PI / 2; gring.position.set(BALL0.x, 0.415, BALL0.z); g.add(gring);
    const bez = u => { const mx = (BALL0.x + HOLE.x) / 2, mz = (BALL0.z + HOLE.z) / 2, dx = HOLE.x - BALL0.x, dz = HOLE.z - BALL0.z; const cx = mx + dz * 0.16, cz = mz - dx * 0.16, a = 1 - u; return V3(a * a * BALL0.x + 2 * a * u * cx + u * u * HOLE.x, BALL0.y, a * a * BALL0.z + 2 * a * u * cz + u * u * HOLE.z); };
    const dashes = []; { const N = 22, dm = new THREE.MeshBasicMaterial({ color: C(RED).multiplyScalar(1.3) }), dgeo = new THREE.PlaneGeometry(0.22, 0.05); for (let i = 1; i < N - 1; i++) { const a = bez(i / N), b = bez((i + 0.5) / N); const m = new THREE.Mesh(dgeo, dm); m.rotation.order = 'YXZ'; m.rotation.y = -Math.atan2(b.z - a.z, b.x - a.x); m.rotation.x = -Math.PI / 2; m.position.set((a.x + b.x) / 2, 0.41, (a.z + b.z) / 2); g.add(m); dashes.push({ m, k: i / N }); } }
    const sunS = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTex, color: C('#ffc29a'), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false })); sunS.scale.set(150, 150, 1); sunS.position.set(620, 38, -110); g.add(sunS);
    let state = 'rest', pt = 0;
    const ready = t => state === 'rest' && t > 0.6 && t < 0.86;
    const cam = path([
      { t: 0, pos: [-10.4, 1.3, 4.5], tgt: [620, 38, -110], fov: 34 },
      { t: 0.08, pos: [-10.4, 1.15, 4.5], tgt: [90, 6, -16], fov: 36 },
      { t: 0.17, pos: [-10.2, 1.05, 4.3], tgt: [6, 0.6, -2], fov: 38 },
      { t: 0.3, pos: [-20, 10, 15], tgt: [4, 0.4, -4], fov: 46 },
      { t: 0.44, pos: [3, 2.9, 5], tgt: [22, 4.4, -16], fov: 40 },
      { t: 0.54, pos: [5, 3, 3.6], tgt: [22, 4.3, -16], fov: 36 },
      { t: 0.62, pos: [-11.6, 2.8, 6.8], tgt: [1, 0.2, -1.5], fov: 42 },
      { t: 0.86, pos: [-11.4, 2.7, 6.6], tgt: [1, 0.2, -1.5], fov: 42 },
      { t: 0.94, pos: [3, 1.9, -0.6], tgt: [6, 0.6, -2], fov: 46 },
      { t: 1, pos: [5.97, 1.05, -1.9], tgt: [6, 0.35, -2], fov: 52 },
    ]);
    return {
      group: g, cam, pick: hit, ready,
      ballPos: () => [ball.position.x, ball.position.y + 0.02, ball.position.z],
      putt() { if (state !== 'rest') return; state = 'roll'; pt = 0; X.onKick && X.onKick(); },
      env: { top: '#0b1020', haze: '#d4734c', glow: 1.15, fog: '#6a5a60', fogDen: 0.0034, bloom: 0.35 },
      update(t, dt, time) {
        const fp = fGeo.attributes.position; for (let i = 0; i < fp.count; i++) { const x = fBase[i * 3]; fp.array[i * 3 + 2] = Math.sin(x * 7 - time * 5) * 0.06 * (x / 0.6); } fp.needsUpdate = true;
        const rv = R(t, 0.5, 0.6); dashes.forEach(d => { d.m.visible = d.k < rv && state === 'rest'; });
        const n = HD.length, hi = t < 0.17 ? -1 : Math.min(n - 1, Math.floor((t - 0.17) / (0.55 - 0.17) * n)); const show = t > 0.56 ? n - 1 : hi;
        if (show !== lIdx) { lIdx = show; drawLB(show); }
        if (state === 'roll') { pt += dt; const u = eo(pt / 2.8); ball.position.copy(bez(u)); if (pt >= 2.8) { state = 'in'; pt = 0; ball.position.set(HOLE.x, 0.33, HOLE.z); X.onHoled && X.onHoled(); } }
        else if (state === 'in') { pt += dt; if (pt > 3.2) { state = 'rest'; ball.position.copy(BALL0); } }
        gring.material.opacity = ready(t) ? 0.45 + 0.4 * Math.sin(time * 4) : 0; gring.scale.setScalar(1 + 0.15 * Math.sin(time * 4));
      },
    };
  })();

  return { tennis, fight, golf };
}
