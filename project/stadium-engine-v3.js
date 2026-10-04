// Stadium engine v3 — night match, full 90 minutes, scrubbed by scroll progress p (0..1).
import { drawScreen, drawTactics } from './broadcast-gfx.js';
const V = '0.160.0';
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ss = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const R = (p, a, b) => ss((p - a) / (b - a));
const eo = x => 1 - Math.pow(1 - clamp(x), 4);
const RO = (p, a, b) => eo((p - a) / (b - a));
const flick = (p, a, d = 0.012) => { const l = (p - a) / d; if (l <= 0) return 0; if (l >= 1) return 1; const n = Math.abs(Math.sin(l * 37.0) * 43758.5) % 1; return n > 0.45 ? l : 0.12 * l; };
const K = (q, keys) => { if (q <= keys[0][0]) return keys[0][1]; for (let i = 0; i < keys.length - 1; i++) { const [a, va] = keys[i], [b, vb] = keys[i + 1]; if (q <= b) return va + (vb - va) * ss((q - a) / (b - a)); } return keys[keys.length - 1][1]; };

export async function createStadium(canvas, o = {}) {
  const THREE = await import(`https://esm.sh/three@${V}`);
  try { await Promise.all([document.fonts.load('800 80px Archivo'), document.fonts.load('600 40px Archivo')]); } catch (e) {}
  const BG = '#0b0a0a', RED = '#ec3013', CHALK = '#f3f2f2';
  const C = h => new THREE.Color(h);
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const FONT = (w, s) => `${w} ${s}px Archivo, system-ui, sans-serif`;
  const LS = (g, v) => { try { g.letterSpacing = v; } catch (e) {} };
  const HE = o.heroEnd || 0.24;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.setClearColor(C(BG), 1);
  const ANISO = renderer.capabilities.getMaxAnisotropy();
  const scene = new THREE.Scene();
  const fogDen = 0.0048;
  scene.fog = new THREE.FogExp2(C(BG), fogDen);
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 4000);
  const fogU = { uFogDen: { value: fogDen }, uFogCol: { value: C(BG) } };
  const texOf = (c, rep) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = ANISO; if (rep) t.wrapS = THREE.RepeatWrapping; return t; };
  const cnv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
  const loadImg = src => new Promise(r => { const im = new Image(); im.onload = () => r(im); im.onerror = () => r(null); im.src = src; });
  const logoImgs = {};
  await Promise.all(Object.entries(o.logos || {}).map(async ([k, f]) => { logoImgs[k] = await loadImg('logos/' + f); }));
  const wrapT = (g, text, maxW) => { const ws = text.split(' '); const lines = []; let cur = ''; for (const w of ws) { const t = cur ? cur + ' ' + w : w; if (g.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; } if (cur) lines.push(cur); return lines; };
  const fitText = (g, s, maxW, maxLines, fs, min) => { g.font = FONT(800, fs); let L = wrapT(g, s, maxW); while ((L.length > maxLines || L.some(l => g.measureText(l).width > maxW)) && fs > min) { fs -= 4; g.font = FONT(800, fs); L = wrapT(g, s, maxW); } return { L, fs }; };

  // ---------- materials
  const mats = {
    concrete: new THREE.MeshStandardMaterial({ color: C('#3b3735'), roughness: 0.92 }),
    concreteL: new THREE.MeshStandardMaterial({ color: C('#4b4643'), roughness: 0.9 }),
    dark: new THREE.MeshStandardMaterial({ color: C('#1d1b1a'), roughness: 0.95 }),
    steel: new THREE.MeshStandardMaterial({ color: C('#5a5653'), roughness: 0.42, metalness: 0.6 }),
    white: new THREE.MeshStandardMaterial({ color: C('#dedad7'), roughness: 0.55 }),
    glass: new THREE.MeshStandardMaterial({ color: C('#a9b5ba'), roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.16, depthWrite: false }),
  };
  const edgeMat = new THREE.LineBasicMaterial({ color: C(CHALK), transparent: true, opacity: 0.07, depthWrite: false });
  const redMat = new THREE.MeshBasicMaterial({ color: C(RED).multiplyScalar(1.25) });
  const warmMat = new THREE.MeshBasicMaterial({ color: C('#fff1df').multiplyScalar(2.2) });
  const box = (parent, w, h, d, x, y, z, kind = 'concrete', edges = false) => {
    const g = new THREE.BoxGeometry(w, h, d);
    const m = new THREE.Mesh(g, typeof kind === 'string' ? mats[kind] : kind);
    m.position.set(x, y, z); parent.add(m);
    if (edges) m.add(new THREE.LineSegments(new THREE.EdgesGeometry(g, 25), edgeMat));
    return m;
  };
  const strutGeo = new THREE.CylinderGeometry(1, 1, 1, 6, 1); strutGeo.translate(0, 0.5, 0);
  const strutMatrix = (a, b, r) => { const d = b.clone().sub(a), L = d.length(); const q = new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), d.normalize()); return new THREE.Matrix4().compose(a, q, V3(r, L, r)); };
  const struts = (parent, list, mat) => { const im = new THREE.InstancedMesh(strutGeo, mat, list.length); list.forEach(([a, b, r], i) => im.setMatrixAt(i, strutMatrix(a, b, r))); im.instanceMatrix.needsUpdate = true; parent.add(im); return im; };

  // ---------- sky, lights, ground
  const skyU = { uTop: { value: C('#060505') }, uHaze: { value: C('#3a2a22') }, uGlow: { value: 0 } };
  const sky = new THREE.Mesh(new THREE.SphereGeometry(1500, 32, 16), new THREE.ShaderMaterial({
    uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: `varying vec3 vP; void main(){ vP=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 uTop; uniform vec3 uHaze; uniform float uGlow; varying vec3 vP;
      void main(){ float h=clamp(vP.y,0.0,1.0); vec3 c=mix(uHaze*(0.12+0.5*uGlow), uTop, pow(h,0.35)); gl_FragColor=vec4(c,1.0);
        #include <colorspace_fragment>
      }`,
  }));
  sky.renderOrder = -10; scene.add(sky);
  const hemi = new THREE.HemisphereLight(0xd6dcff, 0x1a1210, 0.05); scene.add(hemi);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1800, 1800), new THREE.MeshStandardMaterial({ color: C('#131110'), roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.03; scene.add(ground);

  // ---------- pitch
  const TOW = [[72, -56], [72, 56], [-72, 56], [-72, -56]];
  const disU = { uTh: { value: 9 } };
  const pitchU = {
    uA: { value: C('#4a4745') }, uB: { value: C('#3a3836') }, uOn: { value: new THREE.Vector4() }, uSpot: { value: 0 }, uAmb: { value: 0.07 },
    uBoard: { value: 0 }, uBoardCol: { value: C('#242221') }, uRed: { value: C(RED) }, uTh: disU.uTh, ...fogU,
  };
  const pitch = new THREE.Mesh(new THREE.PlaneGeometry(126, 88), new THREE.ShaderMaterial({
    uniforms: pitchU, transparent: true,
    vertexShader: `varying vec3 vW; varying float vD; void main(){ vec4 w=modelMatrix*vec4(position,1.0); vW=w.xyz; vec4 mv=viewMatrix*w; vD=-mv.z; gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `uniform vec3 uA; uniform vec3 uB; uniform vec4 uOn; uniform float uSpot; uniform float uAmb; uniform float uBoard; uniform vec3 uBoardCol; uniform vec3 uRed; uniform float uTh; uniform float uFogDen; uniform vec3 uFogCol; varying vec3 vW; varying float vD;
      float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),f.x),mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),f.x),f.y); }
      float pool(vec2 c,float on){ vec2 d=vW.xz-c; return on*0.62*exp(-dot(d,d)/2600.0); }
      void main(){
        float stripe=step(0.5,fract((vW.x+52.5)/17.5)); float crs=step(0.5,fract((vW.z+34.0)/13.6));
        vec3 base=mix(uA,uB,stripe)*(0.95+0.05*crs);
        float n=noise(vW.xz*1.8)*0.55+noise(vW.xz*9.0)*0.45; base*=0.9+0.2*n;
        vec2 g=abs(fract(vW.xz/5.0-0.5)-0.5)*5.0; vec2 fw=fwidth(vW.xz)*1.2; vec2 gl=1.0-smoothstep(vec2(0.0),fw,g); float grid=max(gl.x,gl.y);
        base=mix(base,uBoardCol+vec3(grid*0.03),uBoard);
        float l=uAmb+pool(vec2(${TOW[0][0] * 0.3},${TOW[0][1] * 0.3}),uOn.x)+pool(vec2(${TOW[1][0] * 0.3},${TOW[1][1] * 0.3}),uOn.y)+pool(vec2(${TOW[2][0] * 0.3},${TOW[2][1] * 0.3}),uOn.z)+pool(vec2(${TOW[3][0] * 0.3},${TOW[3][1] * 0.3}),uOn.w);
        float r=length(vW.xz); l+=uSpot*2.4*(1.0-smoothstep(6.0,10.5,r));
        float edge=1.0-smoothstep(0.0,10.0,max(abs(vW.x)-55.0,abs(vW.z)-37.0));
        vec3 c=base*l*edge;
        float e=max(abs(vW.x)/55.0,abs(vW.z)/37.0);
        float a=1.0-smoothstep(uTh-0.015,uTh,e);
        float band=(1.0-smoothstep(0.0,0.018,abs(e-uTh+0.008)))*step(uTh,1.15)*step(0.0,uTh);
        c+=uRed*band*1.6; a=max(a,band);
        float f=1.0-exp(-uFogDen*uFogDen*vD*vD); c=mix(c,uFogCol,f);
        gl_FragColor=vec4(c,a);
        #include <colorspace_fragment>
      }`,
  }));
  pitch.rotation.x = -Math.PI / 2; scene.add(pitch);

  // ---------- ribbons (pitch lines draw themselves)
  const LRED = C(RED).multiplyScalar(1.3), LCHALK = C('#6a6764');
  const lineU = { uReveal: { value: 0 }, uColor: { value: LRED.clone() }, uTip: { value: C('#ffffff').multiplyScalar(2.5) }, uAlpha: { value: 1 }, uTh: disU.uTh, ...fogU };
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
    const pos = [], tt = [], idx = []; const w = 0.17; let vi = 0;
    for (const { pts, t } of polys) {
      let tot = 0; const cum = [0];
      for (let i = 1; i < pts.length; i++) { tot += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); cum.push(tot); }
      for (let i = 1; i < pts.length; i++) {
        const [x0, z0] = pts[i - 1], [x1, z1] = pts[i]; const dx = x1 - x0, dz = z1 - z0, l = Math.hypot(dx, dz) || 1;
        const nx = -dz / l * w, nz = dx / l * w, ex = dx / l * w, ez = dz / l * w;
        const ta = t[0] + (t[1] - t[0]) * cum[i - 1] / tot, tb = t[0] + (t[1] - t[0]) * cum[i] / tot;
        pos.push(x0 - nx - ex, 0.03, z0 - nz - ez, x0 + nx - ex, 0.03, z0 + nz - ez, x1 + nx + ex, 0.03, z1 + nz + ez, x1 - nx + ex, 0.03, z1 - nz + ez);
        tt.push(ta, ta, tb, tb); idx.push(vi, vi + 1, vi + 2, vi, vi + 2, vi + 3); vi += 4;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aT', new THREE.Float32BufferAttribute(tt, 1)); g.setIndex(idx);
    const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: lineU, vertexShader: lineVS, fragmentShader: lineFS, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    m.renderOrder = 2; scene.add(m);
  }

  // goals, nets, corner flags
  const goals = new THREE.Group(); scene.add(goals);
  const netMat = new THREE.LineBasicMaterial({ color: C(CHALK), transparent: true, opacity: 0.28 });
  for (const sx of [-1, 1]) {
    const gx = sx * 52.6, bx = sx * 54.6;
    box(goals, 0.14, 2.44, 0.14, gx, 1.22, -3.66, 'white'); box(goals, 0.14, 2.44, 0.14, gx, 1.22, 3.66, 'white');
    box(goals, 0.14, 0.14, 7.46, gx, 2.44, 0, 'white');
    box(goals, 0.06, 1.2, 0.06, bx, 0.6, -3.66, 'white'); box(goals, 0.06, 1.2, 0.06, bx, 0.6, 3.66, 'white');
    const p = [];
    for (let z = -3.66; z <= 3.67; z += 0.6) { p.push(gx, 2.44, z, bx, 1.2, z, bx, 1.2, z, bx, 0, z); }
    for (let k = 0; k <= 8; k++) { const t = k / 8, x = gx + (bx - gx) * t, y = 2.44 - 1.24 * t; p.push(x, y, -3.66, x, y, 3.66); }
    for (let y = 0; y <= 1.2; y += 0.4) p.push(bx, y, -3.66, bx, y, 3.66);
    for (const z of [-3.66, 3.66]) for (let k = 0; k <= 6; k++) { const t = k / 6, x = gx + (bx - gx) * t; p.push(x, 0, z, x, 2.44 - 1.24 * t, z); }
    const ng = new THREE.BufferGeometry(); ng.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); goals.add(new THREE.LineSegments(ng, netMat));
    for (const sz of [-1, 1]) {
      box(goals, 0.05, 1.5, 0.05, sx * 52.5, 0.75, sz * 34, 'white');
      const f = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.36), new THREE.MeshBasicMaterial({ color: C(RED), side: THREE.DoubleSide }));
      f.position.set(sx * 52.5 - sx * 0.25, 1.32, sz * 34); goals.add(f);
    }
  }

  // ---------- LED message system (perimeter boards + stand fascia ribbons)
  const ledTex = {};
  for (const [key, words] of Object.entries(o.messages || { identity: ['MATT KING'] })) {
    const ch = 128, font = FONT(800, 80); const [, mg] = cnv(4, 4); mg.font = font; LS(mg, '2px');
    const sq = 20, padX = 60; const ws = words.map(w => mg.measureText(w).width);
    const cw = Math.min(8192, Math.ceil(ws.reduce((a, b) => a + b, 0) + words.length * (sq + padX * 2)));
    const [c, g] = cnv(cw, ch);
    g.fillStyle = '#0b0a0a'; g.fillRect(0, 0, cw, ch); g.font = font; LS(g, '2px'); g.textBaseline = 'middle'; let x = padX * 0.5;
    words.forEach((w, i) => { g.fillStyle = i % 2 ? RED : CHALK; g.fillText(w, x, ch / 2 + 5); x += ws[i] + padX; g.fillStyle = RED; g.fillRect(x, ch / 2 - sq / 2, sq, sq); x += sq + padX; });
    g.fillStyle = 'rgba(11,10,10,0.6)'; for (let i = 0; i < cw; i += 4) g.fillRect(i, 0, 1, ch); for (let j = 0; j < ch; j += 4) g.fillRect(0, j, cw, 1);
    ledTex[key] = { tex: texOf(c, true), asp: cw / ch };
  }
  const firstKey = Object.keys(ledTex)[0];
  const boardVS = `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`;
  const boardFS = `uniform sampler2D uA; uniform sampler2D uB; uniform float uAspA; uniform float uAspB; uniform float uMix; uniform float uOff; uniform float uLen; uniform float uH; uniform float uBright; uniform float uOp; uniform float uDir; varying vec2 vUv;
    void main(){ float wx=vUv.x*uLen+uOff*uDir;
      vec3 a=texture2D(uA,vec2(wx/(uAspA*uH),vUv.y)).rgb; vec3 b=texture2D(uB,vec2(wx/(uAspB*uH),vUv.y)).rgb;
      float m=step(vUv.x,uMix); vec3 c=mix(a,b,m);
      float fr=(1.0-smoothstep(0.0,0.01,abs(vUv.x-uMix)))*step(0.001,uMix)*(1.0-step(0.999,uMix));
      c=mix(c,vec3(1.0,0.25,0.08)*1.8,fr);
      gl_FragColor=vec4(c*uBright,uOp);
      #include <colorspace_fragment>
    }`;
  const boards = [];
  const makeBoard = (parent, len, h, x, y, z, ry, bright, dir) => {
    const u = { uA: { value: ledTex[firstKey].tex }, uB: { value: ledTex[firstKey].tex }, uAspA: { value: ledTex[firstKey].asp }, uAspB: { value: ledTex[firstKey].asp }, uMix: { value: 1 }, uOff: { value: 0 }, uLen: { value: len }, uH: { value: h }, uBright: { value: bright }, uOp: { value: 0 }, uDir: { value: dir } };
    const m = new THREE.Mesh(new THREE.PlaneGeometry(len, h), new THREE.ShaderMaterial({ uniforms: u, vertexShader: boardVS, fragmentShader: boardFS, transparent: true }));
    m.position.set(x, y, z); m.rotation.y = ry; parent.add(m); boards.push({ m, u, ribbon: dir < 0 }); return m;
  };
  for (const [x, z, len, ry] of [[0, 38.6, 108, Math.PI], [0, -38.6, 108, 0], [57.2, 0, 66, -Math.PI / 2], [-57.2, 0, 66, Math.PI / 2]]) {
    const grp = new THREE.Group(); grp.position.set(x, 0, z); grp.rotation.y = ry; scene.add(grp);
    box(grp, len, 1.2, 0.3, 0, 0.7, -0.16, 'dark');
    makeBoard(grp, len, 1.1, 0, 0.7, 0, 0, 1.35, 1);
  }

  // ---------- stands (with tifo-ready seats)
  const seatGeoBase = new THREE.BoxGeometry(0.46, 0.34, 0.42);
  const tifoU = { uTifo: { value: 0 }, uBeatA: { value: 0 }, uBeatB: { value: 0 }, uFlip: { value: 0 }, uGlow: { value: 0.55 }, uField: { value: C(RED) }, uLetter: { value: C(CHALK) } };
  const seatMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
  seatMat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, tifoU);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aMask; attribute float aW; varying float vMask; varying float vW2;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvMask=aMask; vW2=aW;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      uniform float uTifo; uniform float uBeatA; uniform float uBeatB; uniform float uFlip; uniform float uGlow; uniform vec3 uField; uniform vec3 uLetter; varying float vMask; varying float vW2;
      float bitAt(float m,float b){ return mod(floor(m/pow(2.0,b)+0.001),2.0); }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
      float tOn=smoothstep(vW2-0.06,vW2,uTifo*1.08); float tFl=smoothstep(vW2-0.06,vW2,uFlip*1.08);
      float tL=mix(bitAt(vMask,uBeatA),bitAt(vMask,uBeatB),tFl); vec3 tC=mix(uField,uLetter,tL);
      diffuseColor.rgb=mix(diffuseColor.rgb,tC,tOn);`)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance+=tC*tOn*uGlow;');
  };
  const TIFO = o.tifo || [];
  const crowdPts = [];
  function tifoMasks(Kc, rows) {
    const out = new Float32Array(Kc * rows);
    TIFO.forEach((word, b) => {
      const [c, g] = cnv(Kc, rows); g.fillStyle = '#000'; g.textAlign = 'center'; g.textBaseline = 'middle';
      let fs = Math.floor(rows * 0.82); g.font = FONT(800, fs); LS(g, '1px');
      const w = g.measureText(word).width, sx = Math.min(1, (Kc * 0.9) / w);
      g.setTransform(sx, 0, 0, 1, Kc / 2 * (1 - sx), 0); g.fillText(word, Kc / 2, rows / 2 + 1);
      const d = g.getImageData(0, 0, Kc, rows).data;
      for (let i = 0; i < rows; i++) for (let k = 0; k < Kc; k++) {
        const px = Kc - 1 - k, py = rows - 1 - i;
        if (d[(py * Kc + px) * 4 + 3] > 110) out[i * Kc + k] += Math.pow(2, b);
      }
    });
    return out;
  }
  function stand(len, tier, opt = {}) {
    const g = new THREE.Group(); const seats = []; const rowD = 0.8; let y = 1.4, z = 0.3;
    const G = 2.6, half = len / 2 - G;
    const split = (h, d, yy, zz, kind, e) => { box(g, half, h, d, -(G + half / 2), yy, zz, kind, e); box(g, half, h, d, G + half / 2, yy, zz, kind, e); };
    if (opt.gap) split(1.4, 0.3, 0.7, 0.15, 'concreteL', true); else box(g, len, 1.4, 0.3, 0, 0.7, 0.15, 'concreteL', true);
    const rows = tier * 2; let fascia = null; let Kc = 0;
    for (let i = 0; i < rows; i++) {
      if (i === tier) { box(g, len, 2.6, 0.4, 0, y + 1.3, z + 0.2, 'dark', true); fascia = { y: y + 1.3, z }; y += 2.6; z += 0.4; }
      y += i < tier ? 0.38 : 0.55;
      const zc = z + rowD / 2, gp = opt.gap && y < 5.2;
      if (gp) split(0.5, rowD, y - 0.25, zc, 'concrete', true); else box(g, len, 0.5, rowD, 0, y - 0.25, zc, 'concrete', true);
      let k = 0;
      for (let sx = -len / 2 + 0.7; sx < len / 2 - 0.7; sx += 0.56, k++) {
        if (k % 16 === 15) continue; if (gp && Math.abs(sx) < 3) continue;
        seats.push(sx, y + 0.16, zc + 0.05, k, i);
      }
      Kc = Math.max(Kc, k); z += rowD;
    }
    const top = y + 1.2;
    if (opt.gap) { split(top, 0.4, top / 2, z + 0.2, 'concrete', true); box(g, G * 2, top - 3.6, 0.4, 0, 3.6 + (top - 3.6) / 2, z + 0.2, 'concrete', true); }
    else box(g, len, top, 0.4, 0, top / 2, z + 0.2, 'concrete', true);
    const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(0, 1.4); sh.lineTo(z + 0.4, top); sh.lineTo(z + 0.4, 0); sh.lineTo(0, 0);
    const eg = new THREE.ExtrudeGeometry(sh, { depth: 0.4, bevelEnabled: false }); eg.rotateY(-Math.PI / 2);
    for (const ex of [len / 2 + 0.4, -len / 2]) { const m = new THREE.Mesh(eg, mats.concreteL); m.position.x = ex; g.add(m); m.add(new THREE.LineSegments(new THREE.EdgesGeometry(eg, 20), edgeMat)); }
    for (let cx = -len / 2 + 6; cx <= len / 2 - 6; cx += 14) box(g, 0.7, top + 0.6, 0.7, cx, (top + 0.6) / 2, z + 0.75, 'steel');
    // handrail along the front and the tier break
    box(g, len, 0.06, 0.06, 0, 2.5, 0.2, 'steel');
    if (opt.roof) {
      const rf = -7, rb = z + 1.2, ry = top + 8, depth = rb - rf;
      box(g, len + 2, 0.4, depth, 0, ry, (rf + rb) / 2, 'dark', true);
      box(g, len + 2, 0.9, 0.5, 0, ry - 0.2, rf, 'steel', true);
      const S = [];
      for (let cx = -len / 2 + 6; cx <= len / 2 - 6; cx += 14) {
        S.push([V3(cx, top + 0.6, z + 0.75), V3(cx, ry + 7, z + 0.75), 0.35]);
        S.push([V3(cx, ry + 7, z + 0.75), V3(cx, ry + 0.2, rf + 0.5), 0.12]);
        S.push([V3(cx, ry + 7, z + 0.75), V3(cx, ry + 0.2, (rf + rb) / 2), 0.1]);
      }
      struts(g, S, mats.steel);
      for (let x = -len / 2 + 2; x < len / 2; x += 3.2) box(g, 0.5, 0.12, 0.3, x, ry - 0.7, rf + 0.3, warmMat);
    }
    // seats + tifo attributes
    const n = seats.length / 5; const geo = seatGeoBase.clone(); const im = new THREE.InstancedMesh(geo, seatMat, n);
    const masks = tifoMasks(Kc, rows), aMask = new Float32Array(n), aW = new Float32Array(n);
    const mx = new THREE.Matrix4(), col = new THREE.Color();
    for (let i = 0; i < n; i++) {
      const [sx, sy, sz, k, r] = seats.slice(i * 5, i * 5 + 5);
      mx.makeTranslation(sx, sy, sz); im.setMatrixAt(i, mx);
      const v = 0.1 + Math.random() * 0.07; col.setRGB(v, v * 0.95, v * 0.93); im.setColorAt(i, col);
      aMask[i] = masks[r * Kc + k] || 0; aW[i] = (1 - k / Kc) * 0.85 + (r / rows) * 0.15;
    }
    geo.setAttribute('aMask', new THREE.InstancedBufferAttribute(aMask, 1));
    geo.setAttribute('aW', new THREE.InstancedBufferAttribute(aW, 1));
    im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true;
    g.add(im);
    return { g, seats, top, fascia, len };
  }
  const standDefs = [
    { id: 'S', len: 116, tier: 15, pos: [0, -43], ry: Math.PI, roof: true },
    { id: 'E', len: 76, tier: 13, pos: [61, 0], ry: Math.PI / 2 },
    { id: 'W', len: 76, tier: 13, pos: [-61, 0], ry: -Math.PI / 2 },
    { id: 'N', len: 116, tier: 15, pos: [0, 43], ry: 0, gap: true },
  ];
  const stands = standDefs.map(d => {
    const s = stand(d.len, d.tier, d); const outer = new THREE.Group();
    outer.position.set(d.pos[0], 0, d.pos[1]); outer.rotation.y = d.ry; outer.add(s.g); scene.add(outer);
    if (s.fascia) makeBoard(s.g, d.len - 1, 1.7, 0, s.fascia.y, s.fascia.z - 0.02, Math.PI, 0.95, -1);
    const c = Math.cos(d.ry), sn = Math.sin(d.ry);
    for (let i = 0; i < s.seats.length; i += 5 * 7) {
      const lx = s.seats[i], ly = s.seats[i + 1], lz = s.seats[i + 2];
      crowdPts.push(lx * c + lz * sn + d.pos[0], ly + 0.45, -lx * sn + lz * c + d.pos[1]);
    }
    return outer;
  });

  // ---------- tunnel
  const tunnel = new THREE.Group(); scene.add(tunnel);
  let tunnelMat;
  {
    const [c, g] = cnv(256, 256);
    g.fillStyle = '#7a7470'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 9000; i++) { const v = 90 + Math.random() * 60 | 0; g.fillStyle = `rgba(${v},${v - 4},${v - 8},${Math.random() * 0.35})`; g.fillRect(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 2, 1 + Math.random() * 2); }
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 126, 256, 3);
    const t = texOf(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(10, 1);
    tunnelMat = new THREE.MeshStandardMaterial({ map: t, color: C('#8a8380'), roughness: 0.85 });
  }
  const TL = 53, TZ = 43 + TL / 2;
  box(tunnel, 0.3, 3.4, TL, -2.25, 1.7, TZ, tunnelMat); box(tunnel, 0.3, 3.4, TL, 2.25, 1.7, TZ, tunnelMat);
  box(tunnel, 4.8, 0.3, TL, 0, 3.55, TZ, 'dark'); box(tunnel, 4.8, 3.4, 0.3, 0, 1.7, 96, tunnelMat);
  box(tunnel, 4.2, 0.04, TL, 0, 0.0, TZ, 'dark');
  for (let z = 46; z < 95; z += 4) { box(tunnel, 0.22, 3.4, 0.4, -2.0, 1.7, z, 'steel'); box(tunnel, 0.22, 3.4, 0.4, 2.0, 1.7, z, 'steel'); }
  box(tunnel, 0.03, 0.05, TL, -1.88, 1.62, TZ, redMat); box(tunnel, 0.03, 0.05, TL, 1.88, 1.62, TZ, redMat);
  for (let z = 48; z < 95; z += 4) box(tunnel, 1.5, 0.06, 0.28, 0, 3.37, z, warmMat);
  for (let z = 50; z < 95; z += 10) { const pl = new THREE.PointLight(0xffe9d2, 3.2, 9, 1.2); pl.position.set(0, 2.9, z); tunnel.add(pl); }
  const mouth = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 3.4), new THREE.MeshBasicMaterial({ color: C('#fff6ea').multiplyScalar(2.4), transparent: true, opacity: 1, depthWrite: false }));
  mouth.position.set(0, 1.7, 43.05); scene.add(mouth);

  // ---------- floodlight towers (lattice)
  const radialTex = (() => { const [c, g] = cnv(128, 128); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.18, 'rgba(255,255,255,0.45)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.08)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
  const coneVS = `varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv=uv; vec4 w=modelMatrix*vec4(position,1.0); vN=normalize(mat3(modelMatrix)*normal); vV=normalize(cameraPosition-w.xyz); gl_Position=projectionMatrix*viewMatrix*w; }`;
  const coneFS = `uniform float uOp; uniform vec3 uCol; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
    void main(){ float f=abs(dot(normalize(vN),normalize(vV))); float a=uOp*pow(vUv.y,1.7)*pow(f,2.2); gl_FragColor=vec4(uCol,a);
      #include <colorspace_fragment>
    }`;
  const coneMat = col => new THREE.ShaderMaterial({ uniforms: { uOp: { value: 0 }, uCol: { value: C(col) } }, vertexShader: coneVS, fragmentShader: coneFS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  const towers = TOW.map(([tx, tz]) => {
    const g = new THREE.Group(); g.position.set(tx, 0, tz); scene.add(g);
    const H = 50, segs = 8, b0 = 2.0, b1 = 0.75;
    const corner = (y, c) => { const b = b0 + (b1 - b0) * y / H; return V3([-b, b, b, -b][c], y, [-b, -b, b, b][c]); };
    const S = [];
    for (let s = 0; s < segs; s++) {
      const y0 = s * H / segs, y1 = (s + 1) * H / segs;
      for (let c = 0; c < 4; c++) {
        S.push([corner(y0, c), corner(y1, c), 0.16]);
        const n = (c + 1) % 4; S.push(s % 2 ? [corner(y0, c), corner(y1, n), 0.06] : [corner(y0, n), corner(y1, c), 0.06]);
        S.push([corner(y1, c), corner(y1, n), 0.07]);
      }
    }
    const head = new THREE.Group(); head.position.set(0, H + 3.6, 0); g.add(head);
    for (let c = 0; c < 4; c++) S.push([corner(H, c), V3([-2.5, 2.5, 2.5, -2.5][c], H + 3.6 - 3.8, [-0.4, -0.4, 0.4, 0.4][c]), 0.1]);
    struts(g, S, mats.steel);
    box(head, 13.2, 7.8, 0.6, 0, 0, 0, 'steel', true);
    box(head, 13.2, 0.12, 1.6, 0, -4.2, 0.6, 'steel');
    const rowsM = [0, 1, 2, 3].map(() => new THREE.MeshBasicMaterial({ color: C('#151413') }));
    const lg = new THREE.PlaneGeometry(1.75, 1.5);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) { const m = new THREE.Mesh(lg, rowsM[r]); m.position.set((c - 2.5) * 2.1, (r - 1.5) * 1.8, 0.32); head.add(m); }
    g.updateMatrixWorld(true); head.lookAt(0, 0, 0);
    const hw = V3(tx, H + 3.6, tz), aim = V3(tx * 0.22, 0, tz * 0.22);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTex, color: C('#fff3e4'), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 }));
    halo.scale.set(40, 40, 1); halo.position.copy(hw).lerp(V3(0, 0, 0), 0.02); scene.add(halo);
    const dir = hw.clone().sub(aim); const L = dir.length();
    const cone = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 30, L, 40, 1, true), coneMat('#fff1e0'));
    cone.position.copy(hw).add(aim).multiplyScalar(0.5); cone.quaternion.setFromUnitVectors(V3(0, 1, 0), dir.normalize()); scene.add(cone);
    const spot = new THREE.SpotLight(0xfff1e2, 0, 0, 0.75, 0.65, 0); spot.position.copy(hw); spot.target.position.copy(aim); scene.add(spot, spot.target);
    return { g, rowsM, halo, cone, spot };
  });

  // ---------- big screen (live broadcast canvas)
  const SW = 1280, SH = 540; const [scrC, scrG] = cnv(SW, SH); const scrTex = texOf(scrC);
  const screenMat = new THREE.MeshBasicMaterial({ map: scrTex, color: C('#000000') });
  {
    const sg = new THREE.Group(); scene.add(sg);
    box(sg, 34.5, 16, 1.0, 0, 29, 72.4, 'steel', true);
    box(sg, 1.2, 22, 1.2, -11, 11, 72.9, 'steel'); box(sg, 1.2, 22, 1.2, 11, 11, 72.9, 'steel');
    const sm = new THREE.Mesh(new THREE.PlaneGeometry(32, 13.5), screenMat); sm.position.set(0, 29, 71.85); sm.rotation.y = Math.PI; sg.add(sm);
    box(sg, 32.4, 0.22, 0.2, 0, 22.1, 71.8, redMat);
  }
  const screenLight = new THREE.PointLight(0xffe2d8, 0, 60, 1.4); screenLight.position.set(0, 26, 60); scene.add(screenLight);

  // ---------- centre-spot rights badge
  const RIGHTS = o.rights || [];
  const badgeTex = (it, i, n) => {
    const S = 1024, [c, g] = cnv(S, S), cx = S / 2;
    g.fillStyle = 'rgba(14,13,13,0.95)'; g.beginPath(); g.arc(cx, cx, S / 2 - 8, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(243,242,242,0.92)'; g.lineWidth = 12; g.beginPath(); g.arc(cx, cx, S / 2 - 14, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = RED; g.lineWidth = 5; g.beginPath(); g.arc(cx, cx, S / 2 - 44, 0, Math.PI * 2); g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(243,242,242,0.85)';
    LS(g, '8px'); g.font = FONT(800, 30); g.fillText(it.kicker || `DAZN FOOTBALL RIGHTS — ${String(i + 1).padStart(2, '0')}/${String(n).padStart(2, '0')}`, cx, 210);
    const img = logoImgs[it.slug];
    if (img) { const sc = Math.min(560 / img.width, 400 / img.height); g.drawImage(img, cx - img.width * sc / 2, cx - img.height * sc / 2 + 10, img.width * sc, img.height * sc); }
    else { LS(g, '-2px'); const { L, fs } = fitText(g, it.name.toUpperCase(), 700, 3, 150, 60); g.fillStyle = CHALK; const lh = fs * 0.92, y0 = cx + 10 - (L.length - 1) * lh / 2; L.forEach((l, k) => g.fillText(l, cx, y0 + k * lh)); }
    g.fillStyle = RED; g.fillRect(cx - 60, 772, 120, 10);
    LS(g, '6px'); g.fillStyle = 'rgba(243,242,242,0.85)'; g.font = FONT(800, 32); g.fillText((it.sub || '').toUpperCase(), cx, 832);
    return texOf(c);
  };
  const plateTex = RIGHTS.map((it, i) => badgeTex(it, i, RIGHTS.length));
  const summaryTex = badgeTex({ kicker: 'MATT KING — THE PORTFOLIO', name: 'Rights Clubs Brands Talent', sub: 'Worked with' }, 0, 1);
  let plate = null;
  if (RIGHTS.length) {
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
    plate.rotation.x = -Math.PI / 2; plate.position.y = 0.3; plate.renderOrder = 3; plate.visible = false; scene.add(plate);
  }

  // ---------- portfolio logo wall (8 x 5, centre reserved for the badge)
  const tiles = [];
  {
    const items = [];
    for (const cat of o.tileCats || []) { items.push({ header: true, name: cat.name }); for (const it of cat.items) items.push({ ...it, cat: cat.name }); }
    const cw = 12, chh = 9.6, gp = 1.4, cols = 8, rows = 5; let k = 0;
    const tg = new THREE.PlaneGeometry(cw, chh);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if ((c === 3 || c === 4) && r >= 1 && r <= 3) continue;
      const it = items[k++]; if (!it) continue;
      const x = (c - (cols - 1) / 2) * (cw + gp), z = (r - (rows - 1) / 2) * (chh + gp);
      const [cv, g] = cnv(600, 480);
      if (it.header) {
        g.fillStyle = RED; g.fillRect(0, 0, 600, 480);
        LS(g, '6px'); g.font = FONT(800, 24); g.fillStyle = CHALK; g.textBaseline = 'alphabetic'; g.fillText('PORTFOLIO', 34, 64);
        LS(g, '-1px'); const { L, fs } = fitText(g, it.name.toUpperCase(), 530, 2, 84, 40); g.fillStyle = CHALK; const lh = fs * 0.92; L.forEach((l, i) => g.fillText(l, 34, 440 - (L.length - 1 - i) * lh));
      } else {
        g.fillStyle = '#141312'; g.fillRect(0, 0, 600, 480); g.strokeStyle = 'rgba(243,242,242,0.2)'; g.lineWidth = 4; g.strokeRect(2, 2, 596, 476);
        g.fillStyle = RED; g.fillRect(34, 40, 14, 14);
        LS(g, '5px'); g.font = FONT(800, 22); g.textBaseline = 'middle'; g.fillStyle = 'rgba(243,242,242,0.7)'; g.fillText(it.cat.toUpperCase(), 60, 48);
        const img = logoImgs[it.slug];
        if (img) { const sc = Math.min(400 / img.width, 220 / img.height); g.drawImage(img, 300 - img.width * sc / 2, 250 - img.height * sc / 2, img.width * sc, img.height * sc); }
        else { LS(g, '-1px'); const { L, fs } = fitText(g, it.name.toUpperCase(), 530, 2, 80, 36); g.fillStyle = CHALK; g.textBaseline = 'alphabetic'; const lh = fs * 0.92; L.forEach((l, i) => g.fillText(l, 34, 440 - (L.length - 1 - i) * lh)); }
      }
      const m = new THREE.Mesh(tg, new THREE.MeshBasicMaterial({ map: texOf(cv), transparent: true, opacity: 0, depthWrite: false }));
      m.rotation.x = -Math.PI / 2; m.position.set(x, -0.6, z); m.visible = false; m.renderOrder = 4; scene.add(m);
      tiles.push({ m, d: clamp(Math.hypot(x / 1.3, z) / 52) });
    }
  }

  // ---------- tactics board (canvas on the pitch)
  const TW = 1600, TH = 1047; const [tacC, tacG] = cnv(TW, TH); const tacTex = texOf(tacC);
  const tac = new THREE.Mesh(new THREE.PlaneGeometry(110, 72), new THREE.MeshBasicMaterial({ map: tacTex, transparent: true, depthWrite: false, color: C('#ffffff').multiplyScalar(1.15) }));
  tac.rotation.x = -Math.PI / 2; tac.position.y = 0.12; tac.renderOrder = 5; tac.visible = false; scene.add(tac);
  let tacLast = -1, scrSig = '', scrT = -1;

  // ---------- team sheet discs (numbers in-world)
  const players = [];
  {
    const discTex = (n, inv) => { const [c, g] = cnv(256, 256); g.fillStyle = inv ? CHALK : RED; g.beginPath(); g.arc(128, 128, 124, 0, Math.PI * 2); g.fill(); g.fillStyle = inv ? RED : CHALK; g.font = FONT(800, 120); g.textAlign = 'center'; g.textBaseline = 'middle'; LS(g, '-4px'); g.fillText(String(n), 128, 136); return texOf(c); };
    const cg = new THREE.CircleGeometry(1.9, 48), rg = new THREE.RingGeometry(2.3, 2.6, 48);
    (o.formation || []).forEach(([x, z, n]) => {
      const g = new THREE.Group(); g.position.set(x, 0.25, z);
      const t0 = discTex(n, false), t1 = discTex(n, true);
      const disc = new THREE.Mesh(cg, new THREE.MeshBasicMaterial({ map: t0, transparent: true })); disc.rotation.x = -Math.PI / 2; g.add(disc);
      const ring = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ color: C(CHALK), transparent: true, opacity: 0.8, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; g.add(ring);
      g.scale.setScalar(0.0001); g.visible = false; g.renderOrder = 6; scene.add(g);
      players.push({ g, disc, ring, t0, t1 });
    });
  }
  let highlight = -1;

  // ---------- dugout (the bench)
  const bench = (() => {
    const g = new THREE.Group(); g.position.set(0, 0, -36.4); scene.add(g);
    box(g, 12.4, 0.25, 2.2, 0, 0.125, 0, 'dark', true);
    box(g, 12.4, 2.4, 0.12, 0, 1.2, -1.05, 'dark', true);
    for (const sx of [-1, 1]) box(g, 0.08, 2.4, 2.2, sx * 6.2, 1.2, 0, 'glass', true);
    const roof = box(g, 12.6, 0.06, 2.6, 0, 2.45, 0.15, 'glass', true); roof.rotation.x = 0.12;
    box(g, 12.6, 0.1, 0.1, 0, 2.3, 1.42, 'steel');
    const seats = [];
    (o.bench || []).forEach((it, i, arr) => {
      const x = (i - (arr.length - 1) / 2) * 2.3;
      const m = new THREE.MeshStandardMaterial({ color: C('#2a2827'), roughness: 0.5, emissive: C(RED), emissiveIntensity: 0 });
      box(g, 0.7, 0.14, 0.6, x, 0.62, 0.05, m); const bk = box(g, 0.7, 1.15, 0.14, x, 1.22, -0.3, m); bk.rotation.x = -0.1;
      box(g, 0.08, 0.5, 0.08, x, 0.32, 0.05, 'steel');
      const [c, cg] = cnv(512, 384);
      cg.fillStyle = '#121110'; cg.fillRect(0, 0, 512, 384); cg.fillStyle = RED; cg.fillRect(0, 0, 512, 18);
      LS(cg, '4px'); cg.font = FONT(800, 30); cg.fillStyle = 'rgba(243,242,242,0.7)'; cg.textBaseline = 'alphabetic'; cg.fillText(it.years, 36, 84);
      LS(cg, '-1px'); const { L, fs } = fitText(cg, it.name.toUpperCase(), 440, 3, 84, 40); cg.fillStyle = CHALK; const lh = fs * 0.92; L.forEach((l, k) => cg.fillText(l, 36, 340 - (L.length - 1 - k) * lh));
      const pm = new THREE.MeshBasicMaterial({ map: texOf(c), color: C('#ffffff').multiplyScalar(0.35) });
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.465), pm); pl.position.set(x, 1.4, -0.215); pl.rotation.x = -0.1; g.add(pl);
      seats.push({ m, pm, x });
    });
    const lamp = new THREE.SpotLight(0xffffff, 0, 10, 0.5, 0.6, 1.2); lamp.position.set(0, 4.5, -34.2); lamp.target.position.set(0, 1, -36.6); scene.add(lamp, lamp.target);
    return { g, seats, lamp };
  })();

  // ---------- walk-out spotlight, dust, crowd lights
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
  const ptsMat = (col, size, dust) => new THREE.ShaderMaterial({ defines: dust ? { DUST: 1 } : {}, uniforms: { uTime: { value: 0 }, uSize: { value: size }, uOp: { value: 0 }, uCol: { value: C(col) } }, vertexShader: ptsVS, fragmentShader: ptsFS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const spotCone = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 9, 70, 48, 1, true), coneMat('#ffffff')); spotCone.position.set(0, 35, 0); scene.add(spotCone);
  let dust, crowd;
  {
    const dp = [], dph = [];
    for (let i = 0; i < 700; i++) { const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * 7; dp.push(Math.cos(a) * r, Math.random() * 34, Math.sin(a) * r); dph.push(Math.random()); }
    const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.Float32BufferAttribute(dp, 3)); dg.setAttribute('aPh', new THREE.Float32BufferAttribute(dph, 1));
    dust = new THREE.Points(dg, ptsMat('#fff6ec', 0.14, true)); scene.add(dust);
    const cph = new Float32Array(crowdPts.length / 3).map(() => Math.random());
    const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.Float32BufferAttribute(crowdPts, 3)); cg.setAttribute('aPh', new THREE.BufferAttribute(cph, 1));
    crowd = new THREE.Points(cg, ptsMat('#fff1e2', 0.5, false)); scene.add(crowd);
  }

  // ---------- post
  let composer = null, bloom = null;
  try {
    const b = `https://esm.sh/three@${V}/examples/jsm/postprocessing/`;
    const [{ EffectComposer }, { RenderPass }, { UnrealBloomPass }, { OutputPass }] = await Promise.all(['EffectComposer.js', 'RenderPass.js', 'UnrealBloomPass.js', 'OutputPass.js'].map(f => import(b + f)));
    composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scene, camera));
    bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.5, 0.45, 0.72); composer.addPass(bloom);
    composer.addPass(new OutputPass());
  } catch (e) { console.warn('bloom unavailable', e); composer = null; }

  // ---------- camera: hero (catmull) then match (eased segments)
  const heroKeys = [
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
  ];
  const cr = (a, b, c, d, t) => { const t2 = t * t, t3 = t2 * t; return 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3); };
  const crv = (A, B, Cc, D, t) => [0, 1, 2].map(i => cr(A[i], B[i], Cc[i], D[i], t));
  function poseHero(h) {
    const k = heroKeys; const last = k[k.length - 1]; if (h <= 0) return k[0]; if (h >= 1) return last;
    let i = 0; while (h > k[i + 1].p) i++;
    const u = (h - k[i].p) / (k[i + 1].p - k[i].p);
    const a = k[Math.max(i - 1, 0)], b = k[i], c = k[i + 1], d = k[Math.min(i + 2, k.length - 1)];
    return { pos: crv(a.pos, b.pos, c.pos, d.pos, u), tgt: crv(a.tgt, b.tgt, c.tgt, d.tgt, u), fov: b.fov + (c.fov - b.fov) * ss(u) };
  }
  const matchKeys = o.camera || [];
  function poseMatch(q) {
    const k = matchKeys; if (q <= k[0].p) return k[0]; const last = k[k.length - 1]; if (q >= last.p) return last;
    let i = 0; while (q > k[i + 1].p) i++;
    const u = ss((q - k[i].p) / (k[i + 1].p - k[i].p)); const L = (a, b) => a.map((v, j) => v + (b[j] - v) * u);
    return { pos: L(k[i].pos, k[i + 1].pos), tgt: L(k[i].tgt, k[i + 1].tgt), fov: k[i].fov + (k[i + 1].fov - k[i].fov) * u };
  }

  // ---------- state
  let W = 1, H = 1, target = 0, p = 0, raf = 0, last = performance.now(), time = 0, ledOff = 0;
  let ledCur = firstKey, ledWipeStart = -10;
  const ptr = { x: 0, y: 0, sx: 0, sy: 0 };
  const onMove = e => { ptr.x = e.clientX / W * 2 - 1; ptr.y = e.clientY / H * 2 - 1; };
  window.addEventListener('pointermove', onMove, { passive: true });
  function resize() { W = window.innerWidth; H = window.innerHeight; renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix(); if (composer) composer.setSize(W, H); }
  window.addEventListener('resize', resize); resize();

  const T = o.tl;
  const hero = { lines: [0.28, 0.46], goals: [0.44, 0.48], stands: [[0.32, 0.42], [0.35, 0.45], [0.38, 0.48], [0.41, 0.51]], rise: i => [0.40 + i * 0.02, 0.48 + i * 0.02], on: i => 0.52 + i * 0.022, dim: [0.64, 0.72], spot: [0.64, 0.70], boards: [0.66, 0.72], crowd: [0.70, 0.82] };
  const _v = new THREE.Vector3(), _r = new THREE.Vector3(), _u = new THREE.Vector3();

  function setLed(key) {
    if (!ledTex[key] || key === ledCur) return;
    boards.forEach(b => { b.u.uA.value = ledTex[ledCur].tex; b.u.uAspA.value = ledTex[ledCur].asp; b.u.uB.value = ledTex[key].tex; b.u.uAspB.value = ledTex[key].asp; });
    ledCur = key; ledWipeStart = time;
  }

  function update(dt, vel) {
    const h = clamp(p / HE), post = p > HE;
    // pitch lines, dissolve, board
    lineU.uReveal.value = R(h, hero.lines[0], hero.lines[1]) * 1.001;
    const dis = post ? R(p, T.dissolve[0], T.dissolve[1]) * (1 - R(p, T.reform[0], T.reform[1])) : 0;
    disU.uTh.value = 1.2 - dis * 1.25;
    const board = post ? R(p, T.board[0], T.board[1]) * (1 - R(p, T.board[2], T.board[3])) : 0;
    pitchU.uBoard.value = board;
    lineU.uColor.value.copy(LRED).lerp(LCHALK, board);
    goals.scale.y = Math.max(0.0001, RO(h, hero.goals[0], hero.goals[1]) * (1 - R(dis, 0.1, 0.2)));
    stands.forEach((s, i) => { s.position.y = -44 * (1 - RO(h, hero.stands[i][0], hero.stands[i][1])); });
    // floodlights
    const dim = post ? K(p, T.lights) : 1 - 0.62 * R(h, hero.dim[0], hero.dim[1]);
    let sum = 0; const onv = [0, 0, 0, 0];
    towers.forEach((t, i) => {
      const [a, b] = hero.rise(i); t.g.position.y = -60 * (1 - RO(h, a, b));
      const s0 = hero.on(i), off = post ? 1 - flick(p, T.lightsOff + i * 0.011, 0.008) : 1;
      t.rowsM.forEach((m, r) => { const v = flick(h, s0 + r * 0.003) * off; m.color.setRGB(0.012 + v * 3.2 * dim, 0.011 + v * 3.0 * dim, 0.01 + v * 2.7 * dim); });
      const on = flick(h, s0 + 0.004) * off; onv[i] = on * dim; sum += on * dim;
      t.halo.material.opacity = on * 0.9 * dim; t.cone.material.uniforms.uOp.value = on * 0.16 * dim; t.spot.intensity = on * 1.5 * dim;
    });
    pitchU.uOn.value.set(onv[0], onv[1], onv[2], onv[3]);
    skyU.uGlow.value = sum / 4;
    hemi.intensity = 0.05 + 0.22 * sum / 4;
    // walk-out spot, crowd
    const spot = post ? K(p, T.spot) : R(h, hero.spot[0], hero.spot[1]);
    pitchU.uSpot.value = spot; spotCone.material.uniforms.uOp.value = spot * 0.32;
    dust.material.uniforms.uOp.value = spot * 0.9; dust.material.uniforms.uTime.value = time;
    const crw = post ? K(p, T.crowd) : R(h, hero.crowd[0], hero.crowd[1]);
    crowd.material.uniforms.uOp.value = crw * 0.9; crowd.material.uniforms.uTime.value = time;
    // tunnel glare
    const cz = camera.position.z; mouth.material.opacity = cz > 43.2 ? clamp((cz - 44) / 22) * 0.95 : 0; mouth.visible = cz > 43.2 && !post;
    // LED boards
    let key = firstKey; for (const [q, k] of T.ledPlan) if (p >= q) key = k; setLed(key);
    const bon = post ? K(p, T.boardsOn) : R(h, hero.boards[0], hero.boards[1]);
    ledOff = (ledOff + dt * (1.2 + vel * 90)) % 100000;
    const wm = ss((time - ledWipeStart) / 0.9);
    boards.forEach(b => { b.u.uOp.value = b.ribbon ? bon * 0.95 : bon; b.u.uOff.value = ledOff; b.u.uMix.value = wm; });
    // big screen
    const sb = post ? K(p, T.screen) : 0;
    screenMat.color.setScalar(sb * 1.12); screenLight.intensity = sb * 2.2;
    if (sb > 0.01) {
      let beat = 'idle', bl = 0;
      if (p >= T.ft) beat = 'ft';
      else if (p >= T.beats[0] && p < T.beats[1]) { const f = (p - T.beats[0]) / (T.beats[1] - T.beats[0]) * 5; beat = Math.min(4, Math.floor(f)); bl = f - beat; }
      else if (p < T.beats[0]) { beat = 0; bl = 0.1 + 0.25 * clamp((p - T.beats[0] + 0.012) / 0.012); }
      const sig = `${beat}|${bl.toFixed(3)}`, live = typeof beat === 'number' && sb > 0.6;
      if (sig !== scrSig || time - scrT > (live ? 0.05 : 0.2)) { scrSig = sig; scrT = time; drawScreen(scrG, SW, SH, beat, bl, time, o.screenData || {}); scrTex.needsUpdate = true; }
    }
    // badge
    if (plate) {
      const op = post ? R(p, T.badge[0], T.badge[1]) * (1 - R(p, T.badge[2], T.badge[3])) : 0; const u = plate.material.uniforms;
      u.uOp.value = op; plate.visible = op > 0.001;
      if (op > 0.001) {
        const n = plateTex.length, [r0, r1] = T.rights;
        if (p >= T.summary[0]) { u.uA.value = plateTex[n - 1]; u.uB.value = summaryTex; u.uMix.value = R(p, T.summary[0], T.summary[1]); }
        else { const f = clamp((p - r0) / (r1 - r0)) * n, idx = Math.min(n - 1, Math.floor(f)), loc = f - idx; if (idx === 0) { u.uA.value = plateTex[0]; u.uB.value = plateTex[0]; u.uMix.value = 1; } else { u.uA.value = plateTex[idx - 1]; u.uB.value = plateTex[idx]; u.uMix.value = ss(loc / 0.3); } }
      }
    }
    // logo wall
    tiles.forEach(t => {
      const a = T.wallIn + t.d * 0.016, b = T.wallOut + t.d * 0.008;
      const u = RO(p, a, a + 0.012) * (1 - R(p, b, b + 0.008));
      t.m.visible = u > 0.001; t.m.material.opacity = u; t.m.position.y = -0.6 + 0.85 * u; t.m.scale.setScalar(0.94 + 0.06 * u);
    });
    // tactics
    tac.visible = board > 0.001; tac.material.opacity = board;
    if (tac.visible) { const r = R(p, T.tactics[0], T.tactics[1]); if (Math.abs(r - tacLast) > 0.002 || (r === 1 && tacLast !== 1)) { drawTactics(tacG, TW, TH, r, o.screenData || {}); tacTex.needsUpdate = true; tacLast = r; } }
    // tifo
    const tOn = post ? R(p, T.tifo[0], T.tifo[1]) * (1 - R(p, T.tifo[2], T.tifo[3])) : 0;
    tifoU.uTifo.value = tOn;
    if (tOn > 0) { const nb = Math.max(1, TIFO.length), f = clamp((p - T.tifoBeats[0]) / (T.tifoBeats[1] - T.tifoBeats[0])) * nb, idx = Math.min(nb - 1, Math.floor(f)), loc = f - idx; tifoU.uBeatA.value = idx; tifoU.uBeatB.value = Math.min(nb - 1, idx + 1); tifoU.uFlip.value = idx < nb - 1 ? ss((loc - 0.72) / 0.28) : 0; }
    // team sheet
    players.forEach((pl, i) => {
      const s = RO(p, T.xi[0] + i * 0.002, T.xi[0] + 0.012 + i * 0.002) * (1 - R(p, T.xi[1], T.xi[1] + 0.01));
      const hi = highlight === i; pl.g.visible = s > 0.001; pl.g.scale.setScalar(Math.max(0.0001, s * (hi ? 1.28 : 1)));
      pl.disc.material.map = hi ? pl.t1 : pl.t0; pl.ring.material.opacity = hi ? 1 : 0.55 + 0.25 * Math.sin(time * 2 + i);
    });
    // bench
    const bOn = post ? R(p, T.bench[0], T.bench[0] + 0.01) * (1 - R(p, T.bench[1], T.bench[1] + 0.01)) : 0;
    const nb = bench.seats.length; const bf = clamp((p - T.bench[0] - 0.01) / (T.bench[1] - T.bench[0] - 0.01)) * nb; const bi = Math.min(nb - 1, Math.floor(bf));
    bench.seats.forEach((s, i) => { const a = i === bi ? bOn : 0; s.m.emissiveIntensity = a * 0.55; s.pm.color.setScalar(0.35 + 0.95 * a); });
    if (nb) { const sx = bench.seats[bi].x; bench.lamp.position.x += (sx - bench.lamp.position.x) * Math.min(1, dt * 6); bench.lamp.target.position.x = bench.lamp.position.x; bench.lamp.intensity = bOn * 6; }
    if (bloom) bloom.strength = 0.4 + 0.25 * (sum / 4) + 0.2 * spot;
    // camera
    const ps = post ? poseMatch(p) : poseHero(h);
    ptr.sx += (ptr.x - ptr.sx) * Math.min(1, dt * 2.5); ptr.sy += (ptr.y - ptr.sy) * Math.min(1, dt * 2.5);
    camera.position.set(ps.pos[0], ps.pos[1], ps.pos[2]);
    _v.set(ps.tgt[0], ps.tgt[1], ps.tgt[2]);
    const dist = camera.position.distanceTo(_v);
    _r.subVectors(_v, camera.position).normalize().cross(_u.set(0, 1, 0)).normalize();
    const k = !post && h < 0.27 ? 0.25 : dist > 60 ? 1.6 : 0.7;
    camera.position.addScaledVector(_r, ptr.sx * k); camera.position.y += -ptr.sy * k * 0.5;
    if (!post && h < 0.27) camera.position.y += Math.sin(h * 300) * 0.03;
    camera.lookAt(_v);
    const asp = W / H; camera.fov = ps.fov * (asp < 1 ? 1 + (1 - asp) * 0.7 : 1);
    camera.near = dist > 90 ? 2 : 0.1;
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

  return {
    setTarget(v) { target = clamp(v); },
    jump(v) { target = p = clamp(v); },
    setHighlight(i) { highlight = i; },
    get progress() { return p; },
    dispose() { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); window.removeEventListener('pointermove', onMove); renderer.dispose(); },
  };
}
