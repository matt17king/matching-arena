// Procedural floodlit stadium — one scene, scrubbed by scroll progress (0..1).
// mode 'night'  : cinematic, bloom, floodlights, LED boards, spotlight walk-out.
// mode 'blueprint': architectural line drawing on the light ground, axonometric camera.
const V = '0.160.0';
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ss = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const R = (p, a, b) => ss((p - a) / (b - a));
const eo = x => 1 - Math.pow(1 - clamp(x), 4);
const RO = (p, a, b) => eo((p - a) / (b - a));
const flick = (p, a, d = 0.012) => { const l = (p - a) / d; if (l <= 0) return 0; if (l >= 1) return 1; const n = Math.abs(Math.sin(l * 37.0) * 43758.5) % 1; return n > 0.45 ? l : 0.12 * l; };

export async function createStadium(canvas, o = {}) {
  const THREE = await import(`https://esm.sh/three@${V}`);
  const N = o.mode !== 'blueprint';
  try { await document.fonts.load('800 80px Archivo'); } catch (e) {}
  const BG = N ? '#0b0a0a' : '#f3f2f2', INK = '#201e1d', RED = '#ec3013';
  const C = h => new THREE.Color(h);
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, N ? 1.6 : 1.75));
  renderer.setClearColor(C(BG), 1);
  const scene = new THREE.Scene();
  const fogDen = N ? 0.0052 : 0;
  if (N) scene.fog = new THREE.FogExp2(C(BG), fogDen);
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 4000);
  const fogU = { uFogDen: { value: fogDen }, uFogCol: { value: C(BG) } };

  // ---------- materials
  const edgeMat = new THREE.LineBasicMaterial({ color: C(INK) });
  const mats = N ? {
    concrete: new THREE.MeshStandardMaterial({ color: C('#3b3735'), roughness: 0.92 }),
    dark: new THREE.MeshStandardMaterial({ color: C('#1d1b1a'), roughness: 0.95 }),
    steel: new THREE.MeshStandardMaterial({ color: C('#4b4847'), roughness: 0.5, metalness: 0.55 }),
    white: new THREE.MeshStandardMaterial({ color: C('#d8d5d3'), roughness: 0.6 }),
  } : (() => {
    const f = (c) => new THREE.MeshBasicMaterial({ color: C(c), polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
    const m = f(BG); return { concrete: m, dark: f('#eae9e9'), steel: m, white: m };
  })();
  const redMat = new THREE.MeshBasicMaterial({ color: N ? C(RED).multiplyScalar(1.25) : C(RED), side: N ? THREE.FrontSide : THREE.DoubleSide });

  const box = (parent, w, h, d, x, y, z, kind = 'concrete', edges = true) => {
    const g = new THREE.BoxGeometry(w, h, d);
    const m = new THREE.Mesh(g, typeof kind === 'string' ? mats[kind] : kind);
    m.position.set(x, y, z); parent.add(m);
    if (!N && edges) m.add(new THREE.LineSegments(new THREE.EdgesGeometry(g, 20), edgeMat));
    return m;
  };

  // ---------- lights (night)
  const sky = new THREE.Mesh(new THREE.SphereGeometry(1500, 24, 12), new THREE.MeshBasicMaterial({ color: C(BG), side: THREE.BackSide, fog: false, depthWrite: false }));
  sky.renderOrder = -10; scene.add(sky);
  const hemi = new THREE.HemisphereLight(0xd6dcff, 0x1a1210, 0.05);
  if (N) scene.add(hemi);

  // ---------- ground + pitch
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1800, 1800), N
    ? new THREE.MeshStandardMaterial({ color: C('#131110'), roughness: 1 })
    : new THREE.ShaderMaterial({
      uniforms: { uBg: { value: C(BG) }, uInk: { value: C(INK) } },
      vertexShader: `varying vec3 vW; void main(){ vec4 w=modelMatrix*vec4(position,1.0); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
      fragmentShader: `uniform vec3 uBg; uniform vec3 uInk; varying vec3 vW;
        float gl(vec2 p,float s,float w){ vec2 g=abs(fract(p/s-0.5)-0.5)*s; vec2 fw=fwidth(p)*w; vec2 l=1.0-smoothstep(vec2(0.0),fw,g); return max(l.x,l.y); }
        void main(){ float mi=gl(vW.xz,5.0,1.0); float ma=gl(vW.xz,25.0,1.4); float r=length(vW.xz); float fade=1.0-smoothstep(140.0,320.0,r);
          vec3 c=mix(uBg,uInk,(mi*0.05+ma*0.11)*fade); gl_FragColor=vec4(c,1.0);
          #include <colorspace_fragment>
        }`,
    }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.03; scene.add(ground);

  const TOW = [[72, -56], [72, 56], [-72, 56], [-72, -56]];
  const disU = { uTh: { value: 9 } };
  const pitchU = {
    uA: { value: N ? C('#4a4745') : C('#eae9e9') }, uB: { value: N ? C('#3a3836') : C(BG) },
    uOn: { value: new THREE.Vector4(0, 0, 0, 0) }, uSpot: { value: 0 }, uAmb: { value: N ? 0.07 : 1 }, uLit: { value: N ? 1 : 0 },
    uBoard: { value: 0 }, uBoardCol: { value: C('#2a2827') }, uRed: { value: C(RED) }, uTh: disU.uTh, ...fogU,
  };
  const pitch = new THREE.Mesh(new THREE.PlaneGeometry(N ? 126 : 105, N ? 88 : 68), new THREE.ShaderMaterial({
    uniforms: pitchU, transparent: true,
    vertexShader: `varying vec3 vW; varying float vD; void main(){ vec4 w=modelMatrix*vec4(position,1.0); vW=w.xyz; vec4 mv=viewMatrix*w; vD=-mv.z; gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `uniform vec3 uA; uniform vec3 uB; uniform vec4 uOn; uniform float uSpot; uniform float uAmb; uniform float uLit; uniform float uBoard; uniform vec3 uBoardCol; uniform vec3 uRed; uniform float uTh; uniform float uFogDen; uniform vec3 uFogCol; varying vec3 vW; varying float vD;
      float pool(vec2 c,float on){ vec2 d=vW.xz-c; return on*0.62*exp(-dot(d,d)/2600.0); }
      void main(){
        float stripe=step(0.5,fract((vW.x+52.5)/17.5));
        vec3 base=mix(uA,uB,stripe);
        vec2 g=abs(fract(vW.xz/5.0-0.5)-0.5)*5.0; vec2 fw=fwidth(vW.xz)*1.2; vec2 gl=1.0-smoothstep(vec2(0.0),fw,g); float grid=max(gl.x,gl.y);
        base=mix(base, uBoardCol+vec3(grid*0.035), uBoard);
        float l=uAmb + pool(vec2(${TOW[0][0] * 0.3},${TOW[0][1] * 0.3}),uOn.x)+pool(vec2(${TOW[1][0] * 0.3},${TOW[1][1] * 0.3}),uOn.y)+pool(vec2(${TOW[2][0] * 0.3},${TOW[2][1] * 0.3}),uOn.z)+pool(vec2(${TOW[3][0] * 0.3},${TOW[3][1] * 0.3}),uOn.w);
        float r=length(vW.xz); l+=uSpot*2.4*(1.0-smoothstep(6.0,10.5,r));
        float edge=1.0-smoothstep(0.0,10.0,max(abs(vW.x)-55.0,abs(vW.z)-37.0));
        vec3 c = uLit>0.5 ? base*l*edge : base;
        float e=max(abs(vW.x)/55.0,abs(vW.z)/37.0);
        float a=1.0-smoothstep(uTh-0.015,uTh,e);
        float band=(1.0-smoothstep(0.0,0.018,abs(e-uTh+0.008)))*step(uTh,1.15);
        c+=uRed*band*1.6; a=max(a,band);
        float f=1.0-exp(-uFogDen*uFogDen*vD*vD); c=mix(c,uFogCol,f);
        gl_FragColor=vec4(c,a);
        #include <colorspace_fragment>
      }`,
  }));
  pitch.rotation.x = -Math.PI / 2; scene.add(pitch);

  // ---------- pitch lines (ribbons that draw themselves)
  const lineU = { uReveal: { value: 0 }, uColor: { value: N ? C(RED).multiplyScalar(1.3) : C(RED) }, uTip: { value: N ? C('#ffffff').multiplyScalar(2.5) : C(INK) }, uAlpha: { value: 1 }, uTh: disU.uTh, ...fogU };
  const lineVS = `attribute float aT; varying float vT; varying float vD; varying vec3 vW; void main(){ vT=aT; vec4 w=modelMatrix*vec4(position,1.0); vW=w.xyz; vec4 mv=viewMatrix*w; vD=-mv.z; gl_Position=projectionMatrix*mv; }`;
  const lineFS = `uniform float uReveal; uniform vec3 uColor; uniform vec3 uTip; uniform float uAlpha; uniform float uTh; uniform float uFogDen; uniform vec3 uFogCol; varying float vT; varying float vD; varying vec3 vW;
    void main(){ if(vT>uReveal) discard; if(max(abs(vW.x)/55.0,abs(vW.z)/37.0)>uTh) discard; float tip=smoothstep(uReveal-0.025,uReveal,vT)*(1.0-step(0.999,uReveal));
      vec3 c=mix(uColor,uTip,tip); float f=1.0-exp(-uFogDen*uFogDen*vD*vD); c=mix(c,uFogCol,f); gl_FragColor=vec4(c,uAlpha);
      #include <colorspace_fragment>
    }`;
  {
    const L = 52.5, Wd = 34, polys = [];
    const arc = (cx, cz, r, a0, a1, n = 48) => { const p = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; p.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]); } return p; };
    polys.push({ pts: [[-L, Wd], [L, Wd], [L, -Wd], [-L, -Wd], [-L, Wd]], t: [0, 0.42] });
    polys.push({ pts: [[0, Wd], [0, -Wd]], t: [0.36, 0.52] });
    polys.push({ pts: arc(0, 0, 9.15, Math.PI / 2, Math.PI * 2.5, 80), t: [0.46, 0.66] });
    polys.push({ pts: arc(0, 0, 0.25, 0, Math.PI * 2, 12), t: [0.64, 0.66] });
    for (const sx of [-1, 1]) {
      polys.push({ pts: [[sx * L, -20.16], [sx * (L - 16.5), -20.16], [sx * (L - 16.5), 20.16], [sx * L, 20.16]], t: [0.56, 0.8] });
      polys.push({ pts: [[sx * L, -9.16], [sx * (L - 5.5), -9.16], [sx * (L - 5.5), 9.16], [sx * L, 9.16]], t: [0.74, 0.88] });
      const a = 0.927;
      polys.push({ pts: sx > 0 ? arc(sx * (L - 11), 0, 9.15, Math.PI - a, Math.PI + a, 30) : arc(sx * (L - 11), 0, 9.15, -a, a, 30), t: [0.8, 0.95] });
      polys.push({ pts: arc(sx * (L - 11), 0, 0.22, 0, Math.PI * 2, 10), t: [0.94, 0.96] });
      for (const sz of [-1, 1]) { const c = Math.atan2(-sz, -sx); polys.push({ pts: arc(sx * L, sz * Wd, 1, c - Math.PI / 4, c + Math.PI / 4, 10), t: [0.95, 1] }); }
    }
    const pos = [], tt = [], idx = []; const w = N ? 0.17 : 0.22; let vi = 0;
    for (const { pts, t } of polys) {
      let tot = 0; const cum = [0];
      for (let i = 1; i < pts.length; i++) { tot += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); cum.push(tot); }
      for (let i = 1; i < pts.length; i++) {
        const [x0, z0] = pts[i - 1], [x1, z1] = pts[i]; const dx = x1 - x0, dz = z1 - z0, l = Math.hypot(dx, dz) || 1;
        const nx = -dz / l * w, nz = dx / l * w; const ex = dx / l * w, ez = dz / l * w;
        const ta = t[0] + (t[1] - t[0]) * cum[i - 1] / tot, tb = t[0] + (t[1] - t[0]) * cum[i] / tot;
        pos.push(x0 - nx - ex, 0.03, z0 - nz - ez, x0 + nx - ex, 0.03, z0 + nz - ez, x1 + nx + ex, 0.03, z1 + nz + ez, x1 - nx + ex, 0.03, z1 - nz + ez);
        tt.push(ta, ta, tb, tb); idx.push(vi, vi + 1, vi + 2, vi, vi + 2, vi + 3); vi += 4;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('aT', new THREE.Float32BufferAttribute(tt, 1));
    g.setIndex(idx);
    const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: lineU, vertexShader: lineVS, fragmentShader: lineFS, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    m.renderOrder = 2; scene.add(m);
  }
  // goals
  const goals = new THREE.Group(); scene.add(goals);
  for (const sx of [-1, 1]) {
    const gx = sx * 52.6, bx = sx * 54.4;
    box(goals, 0.14, 2.44, 0.14, gx, 1.22, -3.66, 'white'); box(goals, 0.14, 2.44, 0.14, gx, 1.22, 3.66, 'white');
    box(goals, 0.14, 0.14, 7.46, gx, 2.44, 0, 'white');
    box(goals, 0.08, 1.4, 0.08, bx, 0.7, -3.66, 'white'); box(goals, 0.08, 1.4, 0.08, bx, 0.7, 3.66, 'white');
    box(goals, 1.9, 0.06, 0.06, (gx + bx) / 2, 1.8, -3.66, 'white'); box(goals, 1.9, 0.06, 0.06, (gx + bx) / 2, 1.8, 3.66, 'white');
  }

  // ---------- stands
  const seatGeo = new THREE.BoxGeometry(0.46, 0.34, 0.42);
  const seatMat = N ? new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 }) : new THREE.MeshBasicMaterial({ color: C('#c9c5c5') });
  const crowdPts = [];
  function stand(len, tier, gap) {
    const g = new THREE.Group(); const seats = []; const rowD = 0.8; let y = 1.4, z = 0.3;
    const G = 2.6, half = len / 2 - G;
    const split = (h, d, yy, zz, kind) => { box(g, half, h, d, -(G + half / 2), yy, zz, kind); box(g, half, h, d, G + half / 2, yy, zz, kind); };
    if (gap) split(1.4, 0.3, 0.7, 0.15); else box(g, len, 1.4, 0.3, 0, 0.7, 0.15);
    const rows = tier * 2;
    for (let i = 0; i < rows; i++) {
      if (i === tier) { box(g, len, 2.6, 0.4, 0, y + 1.3, z + 0.2, 'dark'); y += 2.6; z += 0.4; }
      y += i < tier ? 0.38 : 0.55;
      const zc = z + rowD / 2, gp = gap && y < 5.2;
      if (gp) split(0.5, rowD, y - 0.25, zc); else box(g, len, 0.5, rowD, 0, y - 0.25, zc);
      let k = 0;
      for (let sx = -len / 2 + 0.7; sx < len / 2 - 0.7; sx += 0.56, k++) {
        if (k % 16 === 15) continue; if (gp && Math.abs(sx) < 3) continue;
        seats.push(sx, y + 0.16, zc + 0.05);
      }
      z += rowD;
    }
    const top = y + 1.2;
    if (gap) { split(top, 0.4, top / 2, z + 0.2); box(g, G * 2, top - 3.6, 0.4, 0, 3.6 + (top - 3.6) / 2, z + 0.2); }
    else box(g, len, top, 0.4, 0, top / 2, z + 0.2);
    // end caps (stepped profile)
    const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(0, 1.4); sh.lineTo(z + 0.4, top); sh.lineTo(z + 0.4, 0); sh.lineTo(0, 0);
    const eg = new THREE.ExtrudeGeometry(sh, { depth: 0.4, bevelEnabled: false }); eg.rotateY(-Math.PI / 2);
    for (const ex of [len / 2 + 0.4, -len / 2]) {
      const m = new THREE.Mesh(eg, mats.concrete); m.position.x = ex; g.add(m);
      if (!N) m.add(new THREE.LineSegments(new THREE.EdgesGeometry(eg, 20), edgeMat));
    }
    // columns on the back
    for (let cx = -len / 2 + 6; cx <= len / 2 - 6; cx += 14) box(g, 0.7, top + 0.6, 0.7, cx, (top + 0.6) / 2, z + 0.75, 'steel');
    // seats
    const n = seats.length / 3; const im = new THREE.InstancedMesh(seatGeo, seatMat, n);
    const mx = new THREE.Matrix4(), col = new THREE.Color();
    for (let i = 0; i < n; i++) {
      mx.makeTranslation(seats[i * 3], seats[i * 3 + 1], seats[i * 3 + 2]); im.setMatrixAt(i, mx);
      if (N) { const v = 0.1 + Math.random() * 0.07; col.setRGB(v, v * 0.95, v * 0.93); im.setColorAt(i, col); }
    }
    im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
    g.add(im);
    return { g, seats, top };
  }
  const standDefs = [
    { id: 'S', len: 116, tier: 15, pos: [0, -43], ry: Math.PI },
    { id: 'E', len: 76, tier: 13, pos: [61, 0], ry: Math.PI / 2 },
    { id: 'W', len: 76, tier: 13, pos: [-61, 0], ry: -Math.PI / 2 },
    { id: 'N', len: 116, tier: 15, pos: [0, 43], ry: 0, gap: true },
  ];
  const stands = standDefs.map(d => {
    const s = stand(d.len, d.tier, d.gap); const outer = new THREE.Group();
    outer.position.set(d.pos[0], 0, d.pos[1]); outer.rotation.y = d.ry; outer.add(s.g); scene.add(outer);
    const c = Math.cos(d.ry), sn = Math.sin(d.ry);
    for (let i = 0; i < s.seats.length; i += 3 * 7) {
      const lx = s.seats[i], ly = s.seats[i + 1], lz = s.seats[i + 2];
      crowdPts.push(lx * c + lz * sn + d.pos[0], ly + 0.45, -lx * sn + lz * c + d.pos[1]);
    }
    return outer;
  });

  // ---------- tunnel (under the north stand, z 43 → 96)
  const tunnel = new THREE.Group(); scene.add(tunnel);
  let tunnelMat = mats.concrete;
  if (N) {
    const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
    g.fillStyle = '#7a7470'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 9000; i++) { const v = 90 + Math.random() * 60 | 0; g.fillStyle = `rgba(${v},${v - 4},${v - 8},${Math.random() * 0.35})`; g.fillRect(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 2, 1 + Math.random() * 2); }
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 126, 256, 3);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(10, 1); t.colorSpace = THREE.SRGBColorSpace;
    tunnelMat = new THREE.MeshStandardMaterial({ map: t, color: C('#8a8380'), roughness: 0.85 });
  }
  const TL = 53, TZ = 43 + TL / 2;
  box(tunnel, 0.3, 3.4, TL, -2.25, 1.7, TZ, tunnelMat); box(tunnel, 0.3, 3.4, TL, 2.25, 1.7, TZ, tunnelMat);
  box(tunnel, 4.8, 0.3, TL, 0, 3.55, TZ, mats.dark); box(tunnel, 4.8, 3.4, 0.3, 0, 1.7, 96, tunnelMat);
  box(tunnel, 4.2, 0.04, TL, 0, 0.0, TZ, mats.dark, false);
  for (let z = 46; z < 95; z += 4) { box(tunnel, 0.22, 3.4, 0.4, -2.0, 1.7, z, 'steel'); box(tunnel, 0.22, 3.4, 0.4, 2.0, 1.7, z, 'steel'); }
  box(tunnel, 0.03, 0.05, TL, -1.88, 1.62, TZ, redMat, false); box(tunnel, 0.03, 0.05, TL, 1.88, 1.62, TZ, redMat, false);
  const stripMat = new THREE.MeshBasicMaterial({ color: N ? C('#fff1df').multiplyScalar(2.2) : C(RED) });
  for (let z = 48; z < 95; z += 4) box(tunnel, 1.5, 0.06, 0.28, 0, 3.37, z, stripMat, !N);
  if (N) for (let z = 50; z < 95; z += 10) { const pl = new THREE.PointLight(0xffe9d2, 3.2, 9, 1.2); pl.position.set(0, 2.9, z); tunnel.add(pl); }
  const mouthMat = N ? new THREE.MeshBasicMaterial({ color: C('#fff6ea').multiplyScalar(2.4), transparent: true, opacity: 1, depthWrite: false }) : redMat;
  const mouth = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 3.4), mouthMat); mouth.position.set(0, 1.7, 43.05); scene.add(mouth);

  // ---------- floodlight towers
  const radialTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.18, 'rgba(255,255,255,0.45)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.08)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c);
  })();
  const coneVS = `varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv=uv; vec4 w=modelMatrix*vec4(position,1.0); vN=normalize(mat3(modelMatrix)*normal); vV=normalize(cameraPosition-w.xyz); gl_Position=projectionMatrix*viewMatrix*w; }`;
  const coneFS = `uniform float uOp; uniform vec3 uCol; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
    void main(){ float f=abs(dot(normalize(vN),normalize(vV))); float a=uOp*pow(vUv.y,1.7)*pow(f,2.2); gl_FragColor=vec4(uCol,a);
      #include <colorspace_fragment>
    }`;
  const coneMat = (col) => new THREE.ShaderMaterial({ uniforms: { uOp: { value: 0 }, uCol: { value: C(col) } }, vertexShader: coneVS, fragmentShader: coneFS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  const towers = TOW.map(([tx, tz]) => {
    const g = new THREE.Group(); g.position.set(tx, 0, tz); scene.add(g);
    const H = 50;
    const pg = new THREE.CylinderGeometry(0.55, 1.6, H, 4, 1); const py = new THREE.Mesh(pg, mats.steel); py.position.y = H / 2; py.rotation.y = Math.PI / 4; g.add(py);
    if (!N) py.add(new THREE.LineSegments(new THREE.EdgesGeometry(pg), edgeMat));
    for (let y = 8; y < H; y += 8) box(g, 2.6 - y * 0.03, 0.18, 0.18, 0, y, 0, 'steel');
    const head = new THREE.Group(); head.position.set(0, H + 3.2, 0); g.add(head);
    box(head, 11.2, 6.4, 0.7, 0, 0, 0, 'steel');
    const rowsM = [0, 1, 2].map(() => new THREE.MeshBasicMaterial({ color: N ? C('#151413') : C(BG) }));
    const lg = new THREE.PlaneGeometry(1.7, 1.55);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) {
      const m = new THREE.Mesh(lg, rowsM[r]); m.position.set((c - 2) * 2.1, (r - 1) * 1.95, 0.37); head.add(m);
      if (!N) m.add(new THREE.LineSegments(new THREE.EdgesGeometry(lg), edgeMat));
    }
    g.updateMatrixWorld(true); head.lookAt(0, 0, 0);
    const hw = V3(tx, H + 3.2, tz);
    const aim = V3(tx * 0.22, 0, tz * 0.22);
    let halo = null, cone = null, spot = null, rays = null;
    if (N) {
      halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTex, color: C('#fff3e4'), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 }));
      halo.scale.set(38, 38, 1); halo.position.copy(hw).lerp(V3(0, 0, 0), 0.02); scene.add(halo);
      const dir = hw.clone().sub(aim); const L = dir.length();
      cone = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 30, L, 40, 1, true), coneMat('#fff1e0'));
      cone.position.copy(hw).add(aim).multiplyScalar(0.5); cone.quaternion.setFromUnitVectors(V3(0, 1, 0), dir.normalize()); scene.add(cone);
      spot = new THREE.SpotLight(0xfff1e2, 0, 0, 0.75, 0.65, 0); spot.position.copy(hw); spot.target.position.copy(aim); scene.add(spot, spot.target);
    } else {
      const p = [], t = [];
      for (let i = 0; i < 9; i++) {
        const a = (i / 8 - 0.5) * 1.3, base = Math.atan2(-tz, -tx), r = 40 + (i % 3) * 14;
        p.push(hw.x, hw.y, hw.z, tx + Math.cos(base + a) * r, 0.05, tz + Math.sin(base + a) * r); t.push(0, 1);
      }
      const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); gg.setAttribute('aT', new THREE.Float32BufferAttribute(t, 1));
      const u = { uReveal: { value: 0 }, uColor: { value: C(RED) }, uTip: { value: C(RED) }, uAlpha: { value: 0.75 }, uTh: { value: 9 }, ...fogU };
      rays = new THREE.LineSegments(gg, new THREE.ShaderMaterial({ uniforms: u, vertexShader: lineVS, fragmentShader: lineFS, transparent: true }));
      scene.add(rays);
    }
    return { g, rowsM, halo, cone, spot, rays };
  });

  // ---------- LED boards
  const led = (() => {
    const words = ['MATT KING', 'MARKETER', 'BUILDER', 'FOUNDER', 'STORYTELLER'];
    const ch = 128, font = '800 84px Archivo, system-ui, sans-serif';
    const meas = document.createElement('canvas').getContext('2d'); meas.font = font;
    const sq = 22, padX = 64; const ws = words.map(w => meas.measureText(w).width);
    const cw = Math.ceil(ws.reduce((a, b) => a + b, 0) + words.length * (sq + padX * 2));
    const c = document.createElement('canvas'); c.width = cw; c.height = ch; const g = c.getContext('2d');
    g.fillStyle = N ? '#0b0a0a' : BG; g.fillRect(0, 0, cw, ch);
    g.font = font; g.textBaseline = 'middle'; let x = padX * 0.5;
    words.forEach((w, i) => {
      g.fillStyle = N ? (i === 0 ? '#f3f2f2' : RED) : (i === 0 ? RED : INK);
      g.fillText(w, x, ch / 2 + 5); x += ws[i] + padX;
      g.fillStyle = RED; g.fillRect(x, ch / 2 - sq / 2, sq, sq); x += sq + padX;
    });
    if (N) { g.fillStyle = 'rgba(11,10,10,0.6)'; for (let i = 0; i < cw; i += 4) g.fillRect(i, 0, 1, ch); for (let j = 0; j < ch; j += 4) g.fillRect(0, j, cw, 1); }
    const tex = new THREE.CanvasTexture(c); tex.wrapS = THREE.RepeatWrapping; tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const worldLen = cw / ch * 1.1;
    const boards = [];
    const defs = [[0, 38.6, 108, Math.PI], [0, -38.6, 108, 0], [57.2, 0, 66, -Math.PI / 2], [-57.2, 0, 66, Math.PI / 2]];
    for (const [x, z, len, ry] of defs) {
      const grp = new THREE.Group(); grp.position.set(x, 0, z); grp.rotation.y = ry; scene.add(grp);
      box(grp, len, 1.2, 0.3, 0, 0.7, -0.16, 'dark');
      const t = tex.clone(); t.needsUpdate = true; t.repeat.x = len / worldLen;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(len, 1.1), new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: 0, color: N ? C('#ffffff').multiplyScalar(1.35) : C('#ffffff') }));
      m.position.set(0, 0.7, 0.0); grp.add(m); boards.push(m);
    }
    return boards;
  })();

  // ---------- walk-out spotlight, dust, crowd lights (night)
  let spotCone = null, dust = null, crowd = null, spotDisc = null;
  const ptsVS = `uniform float uTime; uniform float uSize; attribute float aPh; varying float vA; varying float vY;
    void main(){ vec3 p=position;
#ifdef DUST
      p.y=mod(p.y+uTime*0.5,34.0); p.x+=sin(uTime*0.3+aPh*6.0)*0.4;
#endif
      vY=p.y; vec4 mv=modelViewMatrix*vec4(p,1.0); gl_PointSize=uSize*(300.0/-mv.z); gl_Position=projectionMatrix*mv;
      vA=0.5+0.5*sin(uTime*(1.5+aPh*3.0)+aPh*40.0); }`;
  const ptsFS = `uniform float uOp; uniform vec3 uCol; varying float vA; varying float vY;
    void main(){ vec2 d=gl_PointCoord-0.5; float r=length(d); if(r>0.5) discard; float a=uOp*vA*(1.0-r*2.0);

#ifdef DUST
      a*=smoothstep(34.0,8.0,vY);
#endif
      gl_FragColor=vec4(uCol,a);
      #include <colorspace_fragment>
    }`;
  const ptsMat = (col, size, dustDef) => new THREE.ShaderMaterial({ defines: dustDef ? { DUST: 1 } : {}, uniforms: { uTime: { value: 0 }, uSize: { value: size }, uOp: { value: 0 }, uCol: { value: C(col) } }, vertexShader: ptsVS, fragmentShader: ptsFS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  if (N) {
    spotCone = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 9, 70, 48, 1, true), coneMat('#ffffff'));
    spotCone.position.set(0, 35, 0); scene.add(spotCone);
    const dp = [], dph = [];
    for (let i = 0; i < 700; i++) { const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * 7; dp.push(Math.cos(a) * r, Math.random() * 34, Math.sin(a) * r); dph.push(Math.random()); }
    const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.Float32BufferAttribute(dp, 3)); dg.setAttribute('aPh', new THREE.Float32BufferAttribute(dph, 1));
    dust = new THREE.Points(dg, ptsMat('#fff6ec', 0.14, true)); scene.add(dust);
    const cph = crowdPts.map(() => Math.random()).filter((_, i) => i % 3 === 0);
    const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.Float32BufferAttribute(crowdPts, 3)); cg.setAttribute('aPh', new THREE.Float32BufferAttribute(cph, 1));
    crowd = new THREE.Points(cg, ptsMat('#fff1e2', 0.5, false)); scene.add(crowd);
  } else {
    spotDisc = new THREE.Mesh(new THREE.CircleGeometry(9.15, 96), new THREE.MeshBasicMaterial({ color: C(RED), transparent: true, opacity: 0.92, depthWrite: false }));
    spotDisc.rotation.x = -Math.PI / 2; spotDisc.position.y = 0.02; spotDisc.scale.setScalar(0.0001); scene.add(spotDisc);
  }

  // ================= v2 scenes =================
  const K = (q, keys) => { if (q <= keys[0][0]) return keys[0][1]; for (let i = 0; i < keys.length - 1; i++) { const [a, va] = keys[i], [b, vb] = keys[i + 1]; if (q <= b) return va + (vb - va) * ss((q - a) / (b - a)); } return keys[keys.length - 1][1]; };
  const loadImg = src => new Promise(r => { const im = new Image(); im.onload = () => r(im); im.onerror = () => r(null); im.src = src; });
  const logoImgs = {};
  await Promise.all(Object.entries(o.logos || {}).map(async ([k, f]) => { logoImgs[k] = await loadImg('logos/' + f); }));
  const wrapT = (g, text, maxW) => { const words = text.split(' '); const lines = []; let cur = ''; for (const w of words) { const t = cur ? cur + ' ' + w : w; if (g.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; } if (cur) lines.push(cur); return lines; };
  const FONT = (w, s) => `${w} ${s}px Archivo, system-ui, sans-serif`;
  const texOf = c => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); return t; };

  function ribbonMesh(polys, w, y, uniforms) {
    const pos = [], tt = [], idx = []; let vi = 0;
    for (const { pts, t } of polys) {
      let tot = 0; const cum = [0];
      for (let i = 1; i < pts.length; i++) { tot += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); cum.push(tot); }
      for (let i = 1; i < pts.length; i++) {
        const [x0, z0] = pts[i - 1], [x1, z1] = pts[i]; const dx = x1 - x0, dz = z1 - z0, l = Math.hypot(dx, dz) || 1;
        const nx = -dz / l * w, nz = dx / l * w, ex = dx / l * w, ez = dz / l * w;
        const ta = t[0] + (t[1] - t[0]) * cum[i - 1] / tot, tb = t[0] + (t[1] - t[0]) * cum[i] / tot;
        pos.push(x0 - nx - ex, y, z0 - nz - ez, x0 + nx - ex, y, z0 + nz - ez, x1 + nx + ex, y, z1 + nz + ez, x1 - nx + ex, y, z1 - nz + ez);
        tt.push(ta, ta, tb, tb); idx.push(vi, vi + 1, vi + 2, vi, vi + 2, vi + 3); vi += 4;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aT', new THREE.Float32BufferAttribute(tt, 1)); g.setIndex(idx);
    return new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms, vertexShader: lineVS, fragmentShader: lineFS, side: THREE.DoubleSide, transparent: true, depthWrite: false }));
  }

  // big screen above the north stand
  let screenMat = null;
  if (N) {
    const sg = new THREE.Group(); scene.add(sg);
    box(sg, 34.5, 16, 1.0, 0, 29, 72.4, 'steel');
    box(sg, 1.2, 22, 1.2, -11, 11, 72.9, 'steel'); box(sg, 1.2, 22, 1.2, 11, 11, 72.9, 'steel');
    const c = document.createElement('canvas'); c.width = 1024; c.height = 432; const g = c.getContext('2d');
    g.fillStyle = '#0d0c0c'; g.fillRect(0, 0, 1024, 432);
    g.fillStyle = 'rgba(243,242,242,0.07)'; for (let y = 2; y < 432; y += 6) for (let x = 2; x < 1024; x += 6) g.fillRect(x, y, 3, 3);
    screenMat = new THREE.MeshBasicMaterial({ map: texOf(c), color: C('#000000') });
    const sm = new THREE.Mesh(new THREE.PlaneGeometry(32, 13.5), screenMat); sm.position.set(0, 29, 71.85); sm.rotation.y = Math.PI; sg.add(sm);
    box(sg, 32.4, 0.22, 0.2, 0, 22.1, 71.8, redMat, false);
  }

  // centre-spot rights plate
  const RIGHTS = o.rights || [];
  const plateTex = RIGHTS.map((it, i) => {
    const S = 1024, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d'); const cx = S / 2;
    g.fillStyle = 'rgba(14,13,13,0.94)'; g.beginPath(); g.arc(cx, cx, S / 2 - 8, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(243,242,242,0.92)'; g.lineWidth = 12; g.beginPath(); g.arc(cx, cx, S / 2 - 14, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = RED; g.lineWidth = 5; g.beginPath(); g.arc(cx, cx, S / 2 - 44, 0, Math.PI * 2); g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(243,242,242,0.85)';
    g.letterSpacing = '8px'; g.font = FONT(800, 30); g.fillText(`DAZN FOOTBALL RIGHTS — ${String(i + 1).padStart(2, '0')}/${String(RIGHTS.length).padStart(2, '0')}`, cx, 210);
    const img = logoImgs[it.slug];
    if (img) { const sc = Math.min(560 / img.width, 400 / img.height); g.drawImage(img, cx - img.width * sc / 2, cx - img.height * sc / 2 + 10, img.width * sc, img.height * sc); }
    else {
      g.letterSpacing = '-2px'; let fs = 150; g.font = FONT(800, fs); const up = it.name.toUpperCase(); let lines = wrapT(g, up, 700);
      while ((lines.length > 3 || lines.some(l => g.measureText(l).width > 700)) && fs > 60) { fs -= 6; g.font = FONT(800, fs); lines = wrapT(g, up, 700); }
      g.fillStyle = '#f3f2f2'; const lh = fs * 0.92, y0 = cx + 10 - (lines.length - 1) * lh / 2; lines.forEach((l, k) => g.fillText(l, cx, y0 + k * lh));
    }
    g.fillStyle = RED; g.fillRect(cx - 60, 772, 120, 10);
    g.letterSpacing = '6px'; g.fillStyle = 'rgba(243,242,242,0.85)'; g.font = FONT(800, 32); g.fillText((it.sub || '').toUpperCase(), cx, 832);
    return texOf(c);
  });
  let plate = null;
  if (N && RIGHTS.length) {
    const pu = { uA: { value: plateTex[0] }, uB: { value: plateTex[0] }, uMix: { value: 1 }, uOp: { value: 0 }, uRed: { value: C(RED) } };
    plate = new THREE.Mesh(new THREE.CircleGeometry(8.7, 96), new THREE.ShaderMaterial({
      uniforms: pu, transparent: true, depthWrite: false,
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `uniform sampler2D uA; uniform sampler2D uB; uniform float uMix; uniform float uOp; uniform vec3 uRed; varying vec2 vUv;
        void main(){ float r=length(vUv-0.5)*2.0; float m=uMix*1.3; float w=smoothstep(m-0.1,m,r);
          vec4 a=texture2D(uA,vUv); vec4 b=texture2D(uB,vUv); vec4 c=mix(b,a,w);
          float ring=(1.0-smoothstep(0.0,0.025,abs(r-m+0.05)))*step(0.001,uMix)*(1.0-step(0.999,uMix))*step(r,1.0);
          c.rgb=mix(c.rgb,uRed*1.4,ring); c.a=max(c.a,ring);
          gl_FragColor=vec4(c.rgb,c.a*uOp);
          #include <colorspace_fragment>
        }`,
    }));
    plate.rotation.x = -Math.PI / 2; plate.position.y = 0.06; plate.renderOrder = 3; plate.visible = false; scene.add(plate);
  }

  // portfolio tiles
  const tiles = [];
  if (N && (o.tiles || []).length) {
    const cols = [-41.4, -20.7, 0, 20.7, 41.4], rows = [-27.2, -13.6, 0, 13.6, 27.2]; let k = 0;
    const tg = new THREE.PlaneGeometry(19, 12);
    for (const z of rows) for (const x of cols) {
      if (x === 0 && z === 0) continue; const it = o.tiles[k++]; if (!it) continue;
      const c = document.createElement('canvas'); c.width = 760; c.height = 480; const g = c.getContext('2d');
      g.fillStyle = '#141312'; g.fillRect(0, 0, 760, 480); g.strokeStyle = 'rgba(243,242,242,0.22)'; g.lineWidth = 6; g.strokeRect(3, 3, 754, 474);
      g.fillStyle = RED; g.fillRect(36, 41, 18, 18);
      g.letterSpacing = '5px'; g.font = FONT(800, 28); g.textBaseline = 'middle'; g.fillStyle = 'rgba(243,242,242,0.75)'; g.fillText(it.cat.toUpperCase(), 70, 51);
      const img = logoImgs[it.slug];
      if (img) { const sc = Math.min(520 / img.width, 230 / img.height); g.drawImage(img, 380 - img.width * sc / 2, 270 - img.height * sc / 2, img.width * sc, img.height * sc); }
      else {
        g.letterSpacing = '-1px'; let fs = 96; g.font = FONT(800, fs); const up = it.name.toUpperCase(); let lines = wrapT(g, up, 680);
        while ((lines.length > 2 || lines.some(l => g.measureText(l).width > 680)) && fs > 40) { fs -= 4; g.font = FONT(800, fs); lines = wrapT(g, up, 680); }
        g.fillStyle = '#f3f2f2'; g.textBaseline = 'alphabetic'; const lh = fs * 0.9; lines.forEach((l, i) => g.fillText(l, 36, 436 - (lines.length - 1 - i) * lh));
      }
      const grp = new THREE.Group(); grp.position.set(x, 0.2, z); scene.add(grp);
      const m = new THREE.Mesh(tg, new THREE.MeshBasicMaterial({ map: texOf(c) })); m.rotation.x = -Math.PI / 2; grp.add(m);
      grp.visible = false; tiles.push({ grp, d: Math.hypot(x / 1.55, z) / 40 });
    }
  }

  // half-time tactics board: concept -> channels -> markets
  const teleU = { uReveal: { value: 0 }, uColor: { value: C(RED).multiplyScalar(1.35) }, uTip: { value: C('#ffffff').multiplyScalar(2.2) }, uAlpha: { value: 1 }, uTh: { value: 9 }, ...fogU };
  let tele = null; const nodes = []; const nodeMats = [];
  const CH = o.channels || [], MK = o.markets || [];
  if (N && CH.length) {
    const polys = [];
    const bez = (a, b, k, n = 28) => { const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2, dx = b[0] - a[0], dz = b[1] - a[1]; const cx = mx - dz * k, cz = mz + dx * k; const pts = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; pts.push([u * u * a[0] + 2 * u * t * cx + t * t * b[0], u * u * a[1] + 2 * u * t * cz + t * t * b[1]]); } return pts; };
    const chP = CH.map((_, i) => { const a = i / CH.length * Math.PI * 2 + Math.PI / CH.length; return [Math.cos(a) * 25, Math.sin(a) * 15]; });
    const mkP = MK.map((_, j) => { const a = j / MK.length * Math.PI * 2 + 0.25; return { s: [Math.cos(a) * 25, Math.sin(a) * 15], e: [Math.cos(a) * 47, Math.sin(a) * 29.5] }; });
    chP.forEach((pp, i) => polys.push({ pts: bez([0, 0], pp, 0.2), t: [i * 0.025, 0.2 + i * 0.025] }));
    const ring = []; for (let i = 0; i <= 120; i++) { const a = i / 120 * Math.PI * 2; ring.push([Math.cos(a) * 25, Math.sin(a) * 15]); } polys.push({ pts: ring, t: [0.4, 0.58] });
    mkP.forEach((m, j) => polys.push({ pts: bez(m.s, m.e, -0.14), t: [0.58 + j * 0.045, 0.74 + j * 0.035] }));
    tele = ribbonMesh(polys, 0.3, 0.07, teleU); tele.renderOrder = 4; tele.visible = false; scene.add(tele);
    const nm = new THREE.MeshBasicMaterial({ color: C(RED).multiplyScalar(1.3), transparent: true });
    const wm = new THREE.MeshBasicMaterial({ color: C('#f3f2f2'), transparent: true, side: THREE.DoubleSide });
    nodeMats.push(nm, wm);
    const add = (geo, mat, x, z, t) => { const m = new THREE.Mesh(geo, mat); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.09, z); m.scale.setScalar(0.0001); m.renderOrder = 5; scene.add(m); nodes.push({ m, t }); };
    add(new THREE.RingGeometry(2.2, 3.0, 48), wm, 0, 0, 0);
    add(new THREE.CircleGeometry(1.1, 32), nm, 0, 0, 0);
    chP.forEach((pp, i) => add(new THREE.CircleGeometry(1.15, 32), nm, pp[0], pp[1], 0.2 + i * 0.025));
    mkP.forEach((m, j) => add(new THREE.RingGeometry(1.1, 1.65, 40), wm, m.e[0], m.e[1], 0.74 + j * 0.035));
  }

  // team sheet formation
  const players = [];
  if (N && (o.formation || []).length) {
    const pg = new THREE.CylinderGeometry(1.25, 1.25, 0.35, 40), rg = new THREE.RingGeometry(1.6, 1.95, 48);
    const pm = new THREE.MeshBasicMaterial({ color: C(RED).multiplyScalar(1.3) }), wm2 = new THREE.MeshBasicMaterial({ color: C('#f3f2f2'), side: THREE.DoubleSide });
    o.formation.forEach(([x, z]) => {
      const g = new THREE.Group(); g.position.set(x, 0.2, z);
      const a = new THREE.Mesh(pg, pm); a.position.y = 0.18; g.add(a);
      const r = new THREE.Mesh(rg, wm2); r.rotation.x = -Math.PI / 2; r.position.y = 0.05; g.add(r);
      g.scale.setScalar(0.0001); g.visible = false; scene.add(g); players.push(g);
    });
  }

  // ---------- post
  let composer = null, bloom = null;
  if (N) {
    try {
      const b = `https://esm.sh/three@${V}/examples/jsm/postprocessing/`;
      const [{ EffectComposer }, { RenderPass }, { UnrealBloomPass }, { OutputPass }] = await Promise.all(['EffectComposer.js', 'RenderPass.js', 'UnrealBloomPass.js', 'OutputPass.js'].map(f => import(b + f)));
      composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scene, camera));
      bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.5, 0.45, 0.72); composer.addPass(bloom);
      composer.addPass(new OutputPass());
    } catch (e) { console.warn('bloom unavailable', e); composer = null; }
  }

  // ---------- camera shots
  const sph = (az, el, d, t = [0, 0, 0]) => { const a = az * Math.PI / 180, e = el * Math.PI / 180; return [t[0] + d * Math.sin(a) * Math.cos(e), t[1] + d * Math.sin(e), t[2] + d * Math.cos(a) * Math.cos(e)]; };
  const shots = N ? [{ from: 0, keys: [
    { p: 0.00, pos: [0, 1.7, 93], tgt: [0, 1.6, 60], fov: 62 },
    { p: 0.13, pos: [0, 1.7, 70], tgt: [0, 1.6, 30], fov: 60 },
    { p: 0.25, pos: [0, 1.72, 47.5], tgt: [0, 1.6, 10], fov: 58 },
    { p: 0.31, pos: [0, 2.4, 35], tgt: [0, 1.2, 0], fov: 56 },
    { p: 0.40, pos: [-14, 7, 30], tgt: [0, 0, 0], fov: 55 },
    { p: 0.50, pos: [-50, 25, 34], tgt: [0, 8, 0], fov: 54 },
    { p: 0.60, pos: [-76, 34, 6], tgt: [0, 13, 0], fov: 54 },
    { p: 0.72, pos: [-46, 25, -50], tgt: [0, 0, 0], fov: 50 },
    { p: 0.86, pos: [-6, 7, -30], tgt: [0, 2, 0], fov: 48 },
    { p: 1.00, pos: [5, 2.2, -15], tgt: [0, 2.8, 6], fov: 46 },
  ] }] : [
    { from: 0, keys: [
      { p: 0.00, pos: [0, 1.7, 93], tgt: [0, 1.6, 60], fov: 62 },
      { p: 0.10, pos: [0, 1.7, 69], tgt: [0, 1.6, 30], fov: 60 },
      { p: 0.205, pos: [0, 1.72, 45.4], tgt: [0, 1.65, 20], fov: 58 },
    ] },
    { from: 0.30, keys: [
      { p: 0.30, pos: sph(-24, 16, 150), tgt: [0, 0, 0], fov: 34 },
      { p: 0.42, pos: sph(-34, 26, 380), tgt: [0, 0, 0], fov: 22 },
      { p: 0.54, pos: sph(-46, 32, 700), tgt: [0, 0, 0], fov: 15 },
      { p: 0.66, pos: sph(-58, 35.3, 950), tgt: [0, 0, 0], fov: 12 },
      { p: 0.82, pos: sph(-84, 52, 560, [0, 0, -8]), tgt: [0, 0, -8], fov: 10 },
      { p: 1.00, pos: sph(-96, 66, 170, [0, 0, -10]), tgt: [0, 0, -10], fov: 9 },
    ] },
  ];
  const cr = (a, b, c, d, t) => { const t2 = t * t, t3 = t2 * t; return 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3); };
  const crv = (A, B, Cc, D, t) => [0, 1, 2].map(i => cr(A[i], B[i], Cc[i], D[i], t));
  function pose(p) {
    let shot = shots[0]; for (const s of shots) if (p >= s.from) shot = s;
    const k = shot.keys; const last = k[k.length - 1];
    if (p <= k[0].p) return k[0]; if (p >= last.p) return last;
    let i = 0; while (p > k[i + 1].p) i++;
    const u = (p - k[i].p) / (k[i + 1].p - k[i].p);
    const a = k[Math.max(i - 1, 0)], b = k[i], c = k[i + 1], d = k[Math.min(i + 2, k.length - 1)];
    return { pos: crv(a.pos, b.pos, c.pos, d.pos, u), tgt: crv(a.tgt, b.tgt, c.tgt, d.tgt, u), fov: b.fov + (c.fov - b.fov) * ss(u) };
  }

  // ---------- state
  let W = 1, H = 1, target = 0, p = 0, raf = 0, last = performance.now(), time = 0, ledOff = 0;
  const ptr = { x: 0, y: 0, sx: 0, sy: 0 };
  const onMove = e => { ptr.x = e.clientX / W * 2 - 1; ptr.y = e.clientY / H * 2 - 1; };
  window.addEventListener('pointermove', onMove, { passive: true });
  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix();
    if (composer) { composer.setSize(W, H); }
  }
  window.addEventListener('resize', resize); resize();

  const tl = N ? {
    lines: [0.28, 0.46], goals: [0.44, 0.48],
    stands: [[0.32, 0.42], [0.35, 0.45], [0.38, 0.48], [0.41, 0.51]],
    rise: i => [0.40 + i * 0.02, 0.48 + i * 0.02], on: i => 0.52 + i * 0.022,
    dim: [0.64, 0.72], spot: [0.64, 0.70], boards: [0.66, 0.72], crowd: [0.70, 0.82],
  } : {
    lines: [0.38, 0.54], goals: [0.52, 0.56],
    stands: [[0.40, 0.49], [0.43, 0.52], [0.46, 0.55], [0.49, 0.58]],
    rise: i => [0.50 + i * 0.015, 0.57 + i * 0.015], on: i => 0.60 + i * 0.012,
    spot: [0.80, 0.88], boards: [0.70, 0.76],
  };
  const HE = o.heroEnd || 1;
  const LK = [[0.30, 0.38], [0.40, 0.38], [0.43, 0.6], [0.59, 0.6], [0.61, 0.5], [0.70, 0.5], [0.73, 1], [0.80, 1], [0.82, 0.85], [0.93, 0.85]];
  const SPK = [[0.30, 1], [0.40, 1], [0.42, 0]];
  const SCK = [[0.31, 0], [0.345, 1], [0.405, 1], [0.43, 0.25], [0.93, 0.25], [0.95, 0]];
  const RR = o.rightsRange || [0.425, 0.505];
  const LRED = C(RED).multiplyScalar(1.3), LCHALK = C('#d9d6d3');
  const keys2 = [
    { p: 0.30, pos: [5, 2.2, -15], tgt: [0, 2.8, 6], fov: 46 },
    { p: 0.335, pos: [2, 9, 0], tgt: [0, 22, 70], fov: 38 },
    { p: 0.355, pos: [0, 16, 21], tgt: [0, 27.5, 72], fov: 31 },
    { p: 0.40, pos: [0, 16.5, 23], tgt: [0, 27.5, 72], fov: 31 },
    { p: 0.418, pos: [0, 44, 10], tgt: [0, 0, 0.6], fov: 40 },
    { p: 0.43, pos: [0, 30, 0.6], tgt: [0, 0, 0], fov: 40 },
    { p: 0.50, pos: [0, 34, 0.6], tgt: [0, 0, 0], fov: 40 },
    { p: 0.545, pos: [0, 112, 1.5], tgt: [0, 0, 0], fov: 40 },
    { p: 0.585, pos: [0, 112, 1.5], tgt: [0, 0, 0], fov: 40 },
    { p: 0.615, pos: [0, 90, 34], tgt: [0, 0, 3], fov: 40 },
    { p: 0.695, pos: [0, 90, 34], tgt: [0, 0, 3], fov: 40 },
    { p: 0.735, pos: [0, 235, 80], tgt: [0, 0, 2], fov: 44 },
    { p: 0.79, pos: [0, 235, 80], tgt: [0, 0, 2], fov: 44 },
    { p: 0.825, pos: [8, 98, 26], tgt: [8, 0, 2], fov: 40 },
    { p: 0.895, pos: [8, 98, 26], tgt: [8, 0, 2], fov: 40 },
    { p: 0.94, pos: [-62, 34, 42], tgt: [0, 6, 0], fov: 50 },
    { p: 1.00, pos: [-80, 42, 30], tgt: [0, 9, 0], fov: 52 },
  ];
  function pose2(q) {
    const k = keys2; if (q <= k[0].p) return k[0]; const last = k[k.length - 1]; if (q >= last.p) return last;
    let i = 0; while (q > k[i + 1].p) i++;
    const u = ss((q - k[i].p) / (k[i + 1].p - k[i].p)); const L = (a, b) => a.map((v, j) => v + (b[j] - v) * u);
    return { pos: L(k[i].pos, k[i + 1].pos), tgt: L(k[i].tgt, k[i + 1].tgt), fov: k[i].fov + (k[i + 1].fov - k[i].fov) * u };
  }

  const _v = new THREE.Vector3(), _r = new THREE.Vector3(), _u = new THREE.Vector3();
  function update(dt, vel) {
    const h = clamp(p / HE), post = p > HE;
    lineU.uReveal.value = R(h, tl.lines[0], tl.lines[1]) * 1.001;
    const dis = post ? 0.66 * R(p, 0.495, 0.535) * (1 - R(p, 0.585, 0.61)) : 0;
    disU.uTh.value = 1.2 - dis * 1.4;
    const board = post ? R(p, 0.59, 0.61) * (1 - R(p, 0.795, 0.81)) : 0;
    pitchU.uBoard.value = board;
    lineU.uColor.value.copy(LRED).lerp(LCHALK, board);
    goals.scale.y = Math.max(0.0001, RO(h, tl.goals[0], tl.goals[1]) * (1 - R(dis, 0.15, 0.25)));
    stands.forEach((s, i) => { s.position.y = -44 * (1 - RO(h, tl.stands[i][0], tl.stands[i][1])); });
    const dim = post ? K(p, LK) : (N ? 1 - 0.62 * R(h, tl.dim[0], tl.dim[1]) : 1);
    let sum = 0; const onv = [0, 0, 0, 0];
    towers.forEach((t, i) => {
      const [a, b] = tl.rise(i); t.g.position.y = -58 * (1 - RO(h, a, b));
      const s0 = tl.on(i);
      const off = post ? 1 - flick(p, 0.944 + i * 0.011, 0.008) : 1;
      t.rowsM.forEach((m, r) => {
        const v = flick(h, s0 + r * 0.004) * off;
        if (N) m.color.setRGB(0.012 + v * 3.2 * dim, 0.011 + v * 3.0 * dim, 0.01 + v * 2.7 * dim);
        else m.color.copy(C(BG)).lerp(C(RED), v);
      });
      const on = flick(h, s0 + 0.004) * off; onv[i] = on * dim; sum += on * dim;
      if (N) { t.halo.material.opacity = on * 0.9 * dim; t.cone.material.uniforms.uOp.value = on * 0.16 * dim; t.spot.intensity = on * 1.5 * dim; }
      else t.rays.material.uniforms.uReveal.value = R(p, s0 + 0.004, s0 + 0.05) * 1.001;
    });
    pitchU.uOn.value.set(onv[0], onv[1], onv[2], onv[3]);
    const spot = post ? K(p, SPK) : R(h, tl.spot[0], tl.spot[1]);
    const boards = post ? 1 - R(p, 0.935, 0.95) : R(h, tl.boards[0], tl.boards[1]);
    ledOff += dt * (0.03 + vel * 2.6 / Math.max(HE, 0.2));
    led.forEach(m => { m.material.opacity = boards; m.material.map.offset.x = ledOff; });
    if (N) {
      pitchU.uSpot.value = spot; hemi.intensity = 0.05 + 0.22 * sum / 4;
      spotCone.material.uniforms.uOp.value = spot * 0.32;
      dust.material.uniforms.uOp.value = spot * 0.9; dust.material.uniforms.uTime.value = time;
      const cr = post ? 1 - R(p, 0.93, 0.965) : R(h, tl.crowd[0], tl.crowd[1]);
      crowd.material.uniforms.uOp.value = cr * 0.9; crowd.material.uniforms.uTime.value = time;
      const cz = camera.position.z;
      mouth.material.opacity = cz > 43.2 ? clamp((cz - 44) / 22) * 0.95 : 0;
      mouth.visible = cz > 43.2 && !post;
      if (bloom) bloom.strength = 0.4 + 0.25 * (sum / 4) + 0.2 * spot;
      if (screenMat) screenMat.color.setScalar(K(p, SCK) * 1.1);
      if (plate) {
        const op = R(p, 0.41, 0.43) * (1 - R(p, 0.585, 0.6)); const u = plate.material.uniforms;
        u.uOp.value = op; plate.visible = op > 0.001;
        const n = plateTex.length, f = clamp((p - RR[0]) / (RR[1] - RR[0])) * n, idx = Math.min(n - 1, Math.floor(f)), loc = f - idx;
        if (idx === 0) { u.uA.value = plateTex[0]; u.uB.value = plateTex[0]; u.uMix.value = 1; }
        else { u.uA.value = plateTex[idx - 1]; u.uB.value = plateTex[idx]; u.uMix.value = ss(loc / 0.3); }
      }
      tiles.forEach(t => {
        const a = 0.505 + t.d * 0.032; const u = RO(p, a, a + 0.022) * (1 - R(p, 0.582 + t.d * 0.01, 0.596 + t.d * 0.01));
        t.grp.visible = u > 0.001; t.grp.rotation.x = (1 - u) * Math.PI; t.grp.position.y = 0.2 + Math.sin(u * Math.PI) * 5;
      });
      if (tele) {
        const ta = 1 - R(p, 0.70, 0.72); const rv = R(p, 0.612, 0.685);
        teleU.uReveal.value = rv * 1.001; teleU.uAlpha.value = ta; tele.visible = p > 0.6 && ta > 0.001;
        nodeMats.forEach(m => { m.opacity = ta; });
        nodes.forEach(nd => { const s = RO(rv, nd.t, nd.t + 0.06) * (ta > 0.001 ? 1 : 0); nd.m.scale.setScalar(Math.max(0.0001, s)); nd.m.visible = s > 0.001; });
      }
      players.forEach((g, i) => { const s = RO(p, 0.808 + i * 0.0025, 0.82 + i * 0.0025) * (1 - R(p, 0.895, 0.91)); g.scale.setScalar(Math.max(0.0001, s)); g.visible = s > 0.001; });
    } else {
      spotDisc.scale.setScalar(Math.max(0.0001, RO(p, tl.spot[0], tl.spot[1])));
    }
    // camera
    const ps = post ? pose2(p) : pose(h);
    ptr.sx += (ptr.x - ptr.sx) * Math.min(1, dt * 2.5); ptr.sy += (ptr.y - ptr.sy) * Math.min(1, dt * 2.5);
    camera.position.set(ps.pos[0], ps.pos[1], ps.pos[2]);
    _v.set(ps.tgt[0], ps.tgt[1], ps.tgt[2]);
    const dist = camera.position.distanceTo(_v);
    _r.subVectors(_v, camera.position).normalize().cross(_u.set(0, 1, 0)).normalize();
    const k = N ? (!post && h < 0.27 ? 0.25 : 1.4) : dist * 0.035;
    camera.position.addScaledVector(_r, ptr.sx * k); camera.position.y += -ptr.sy * k * 0.5;
    if (!post && h < 0.27) camera.position.y += Math.sin(h * 300) * 0.03 * (N ? 1 : 0.6);
    camera.lookAt(_v);
    const asp = W / H; camera.fov = ps.fov * (asp < 1 ? 1 + (1 - asp) * 0.7 : 1);
    camera.near = dist > 300 ? 20 : dist > 90 ? 2 : 0.1;
    camera.updateProjectionMatrix();
  }

  const proj = new THREE.Vector3();
  function project(x, y, z) { proj.set(x, y, z).project(camera); return { x: (proj.x * 0.5 + 0.5) * W, y: (-proj.y * 0.5 + 0.5) * H, on: proj.z < 1 && proj.z > -1 }; }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now; time += dt;
    const prev = p; p += (target - p) * (1 - Math.exp(-dt * 4.2)); if (Math.abs(target - p) < 1e-5) p = target;
    const vel = (p - prev) / Math.max(dt, 1e-3);
    update(dt, vel);
    if (composer) composer.render(); else renderer.render(scene, camera);
    o.onFrame && o.onFrame({ p, project });
  }
  update(0, 0); raf = requestAnimationFrame(frame);
  window.__mkScene = scene; window.__mkComp = composer; window.__mkR = renderer;

  return {
    setTarget(v) { target = clamp(v); },
    jump(v) { target = p = clamp(v); },
    get progress() { return p; },
    dispose() { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); window.removeEventListener('pointermove', onMove); renderer.dispose(); },
  };
}
