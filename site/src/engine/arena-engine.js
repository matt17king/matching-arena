// Arena engine v12 (photoreal pass) — one night, five venues. The lines redraw themselves from sport to sport, and each stadium rises around them.
import { drawScreen, drawTactics, placeholder, photo } from './broadcast-gfx.js';
import { buildRaceDetail } from './race-detail.js';
import { buildVenueDetail } from './venue-detail.js';
import { netKit } from './nets.js';
import { N, P, ORDER, SPORTS, circuit, strandSet, strandShared, BB, TN, tennis as tennisCourt, padel as padelCourt } from './arena-sports.js';
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ss = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const R = (p, a, b) => ss((p - a) / (b - a));
const eo = x => 1 - Math.pow(1 - clamp(x), 4);
const RO = (p, a, b) => eo((p - a) / (b - a));
const flick = (p, a, d = 0.012) => { const l = (p - a) / d; if (l <= 0) return 0; if (l >= 1) return 1; const n = Math.abs(Math.sin(l * 37.0) * 43758.5) % 1; return n > 0.45 ? l : 0.12 * l; };
const K = (q, keys) => { if (q <= keys[0][0]) return keys[0][1]; for (let i = 0; i < keys.length - 1; i++) { const [a, va] = keys[i], [b, vb] = keys[i + 1]; if (q <= b) return va + (vb - va) * ss((q - a) / (b - a)); } return keys[keys.length - 1][1]; };
const lerp = (a, b, t) => a + (b - a) * t;
const bounce = x => { x = clamp(x); const n1 = 7.5625, d1 = 2.75; if (x < 1 / d1) return n1 * x * x; if (x < 2 / d1) { x -= 1.5 / d1; return n1 * x * x + 0.75; } if (x < 2.5 / d1) { x -= 2.25 / d1; return n1 * x * x + 0.9375; } x -= 2.625 / d1; return n1 * x * x + 0.984375; };
const cr = (a, b, c, d, t) => { const t2 = t * t, t3 = t2 * t; return 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3); };
const crv = (A, B, Cc, D, t) => [0, 1, 2].map(i => cr(A[i], B[i], Cc[i], D[i], t));
const XIDX = { x1: 1, x2: 2, x3: 3, x4: 4 }, VI = { hero: 0, rights: 0, bball: 1, nfl: 2, tennis: 3, race: 4, ft: 4 };
const PREV = { x1: 'rights', x2: 'bball', x3: 'nfl', x4: 'tennis' }, NEXT = { x1: 'bball', x2: 'nfl', x3: 'tennis', x4: 'race' };

export async function createArena(canvas, o = {}) {
  const THREE = await import('three');
  try { await Promise.all([document.fonts.load('800 80px Archivo'), document.fonts.load('600 40px Archivo')]); } catch (e) {}
  const BG = '#0b0a0a', RED = '#ec3013', CHALK = '#f3f2f2';
  const C = h => new THREE.Color(h), V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const FONT = (w, s) => `${w} ${s}px Archivo, system-ui, sans-serif`;
  const LS = (g, v) => { try { g.letterSpacing = v; } catch (e) {} };
  const LOWQ = o.quality === 'low';
  const CH = Object.assign({ RR: [0.08, 0.9], BEATS: [0.06, 0.44], TAC: [0.5, 0.92], DRIVE: [0.03, 0.5], XI: [0.55, 0.96], SURF: [0.03, 0.27], SEXES: [0.27, 0.5], PADEL: [0.5, 0.74], FANS: [0.77, 0.92], LAP: [0.08, 0.62], PIT: [0.66, 0.92] }, o.ch || {});

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(LOWQ ? 1 : Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.setClearColor(C(BG), 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  if (!LOWQ) { renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; }
  const ANISO = renderer.capabilities.getMaxAnisotropy();
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(C(BG), 0.0048);
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 5000);
  const fogU = { uFogDen: { value: 0.0048 }, uFogCol: { value: C(BG) } };
  const texOf = (c, rep) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = ANISO; if (rep) t.wrapS = THREE.RepeatWrapping; return t; };
  const cnv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
  const nets = netKit({ THREE, cnv });
  const loadImg = src => new Promise(r => { const im = new Image(); im.onload = () => r(im); im.onerror = () => r(null); im.src = src; });
  const photos = {};
  await Promise.all(Object.entries(o.photos || {}).map(async ([k, v]) => { if (v && !Array.isArray(v)) photos[k] = await loadImg(v); }));
  const sdata = { ...(o.screenData || {}), photos };
  const phTex = (w, h, lines, img) => { const [c, g] = cnv(w, h); if (img) photo(g, img, 0, 0, w, h, true); else placeholder(g, 0, 0, w, h, lines); return texOf(c); };
  const logoImgs = {};
  await Promise.all(Object.entries(o.logos || {}).map(async ([k, f]) => { logoImgs[k] = await loadImg(import.meta.env.BASE_URL + 'logos/' + f); }));
  sdata.logos = logoImgs;
  // a logo on a white tile, fitted inside the square (logos arrive on white or transparent grounds)
  const logoTile = (g, img, x, y, s) => { g.fillStyle = '#f3f2f2'; g.fillRect(x, y, s, s); if (!img) return; const p = s * 0.12, k = Math.min((s - p * 2) / img.width, (s - p * 2) / img.height); g.drawImage(img, x + (s - img.width * k) / 2, y + (s - img.height * k) / 2, img.width * k, img.height * k); };
  const wrapT = (g, text, maxW) => { const ws = text.split(' '); const lines = []; let cur = ''; for (const w of ws) { const t = cur ? cur + ' ' + w : w; if (g.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; } if (cur) lines.push(cur); return lines; };
  const fitText = (g, s, maxW, maxLines, fs, min) => { g.font = FONT(800, fs); let L = wrapT(g, s, maxW); while ((L.length > maxLines || L.some(l => g.measureText(l).width > maxW)) && fs > min) { fs -= 4; g.font = FONT(800, fs); L = wrapT(g, s, maxW); } return { L, fs }; };

  // ---------- procedural textures
  const tile = (S, base, fn) => { const [c, g] = cnv(S, S); g.fillStyle = base; g.fillRect(0, 0, S, S); fn(g, S); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = ANISO; return t; };
  const wrapDraw = (g, S, x, y, r, draw) => { for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) { const X = x + dx, Y = y + dy; if (X + r < 0 || X - r > S || Y + r < 0 || Y - r > S) continue; draw(X, Y); } };
  const blotch = (g, S, n, r0, r1, rgb, a) => { for (let i = 0; i < n; i++) { const x = Math.random() * S, y = Math.random() * S, r = r0 + Math.random() * (r1 - r0), al = a * Math.random(); wrapDraw(g, S, x, y, r, (X, Y) => { const gr = g.createRadialGradient(X, Y, 0, X, Y, r); gr.addColorStop(0, `rgba(${rgb},${al})`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.fillRect(X - r, Y - r, r * 2, r * 2); }); } };
  const speck = (g, S, n, rgb, a, sz = 1.5) => { for (let i = 0; i < n; i++) { g.fillStyle = `rgba(${rgb},${a * Math.random()})`; g.fillRect(Math.random() * S, Math.random() * S, sz * Math.random() + 0.5, sz * Math.random() + 0.5); } };
  const texConcrete = tile(512, '#b8b3ae', (g, S) => {
    blotch(g, S, 240, 8, 60, '40,36,34', 0.16); blotch(g, S, 120, 6, 30, '235,230,224', 0.12);
    speck(g, S, 9000, '30,28,26', 0.35); speck(g, S, 5000, '240,236,230', 0.25);
    g.fillStyle = 'rgba(30,28,26,0.28)'; for (let y = 0; y < S; y += 128) g.fillRect(0, y, S, 2); for (let x = 0; x < S; x += 256) g.fillRect(x, 0, 2, S);
    g.fillStyle = 'rgba(20,18,16,0.5)'; for (let y = 64; y < S; y += 128) for (let x = 64; x < S; x += 128) { g.beginPath(); g.arc(x, y, 2.2, 0, 7); g.fill(); }
  });
  const texSteel = tile(256, '#a29e9a', (g, S) => {
    for (let i = 0; i < 900; i++) { const x = Math.random() * S; g.fillStyle = `rgba(${Math.random() < 0.5 ? '40,38,36' : '235,232,228'},${0.05 + Math.random() * 0.08})`; g.fillRect(x, 0, 1, S); }
    blotch(g, S, 40, 10, 40, '60,48,40', 0.12); speck(g, S, 1500, '30,28,26', 0.3);
  });
  const texAsphalt = tile(256, '#5a5653', (g, S) => { speck(g, S, 14000, '20,18,17', 0.5, 2); speck(g, S, 6000, '200,196,190', 0.25, 1.5); blotch(g, S, 50, 10, 50, '20,18,16', 0.2); });
  // derivative bump: perturbs the shading normal from a height expression (micro-relief without normal maps)
  const BUMP = (h, k) => `{ vec3 dpx=dFdx(-vViewPosition), dpy=dFdy(-vViewPosition); float bfade=1.0/(1.0+pow(max(length(dpx),length(dpy))*40.0,2.0)); float bh=(${h})*${k}*bfade; float dhx=dFdx(bh), dhy=dFdy(bh);
    vec3 r1=cross(dpy,normal), r2=cross(normal,dpx); float det=dot(dpx,r1); vec3 gr=sign(det)*(dhx*r1+dhy*r2); normal=normalize(abs(det)*normal-gr); }`;
  const triplanar = (mat, tex, scale, ao = 1) => {
    mat.onBeforeCompile = sh => {
      sh.uniforms.tTri = { value: tex }; sh.uniforms.uTriS = { value: scale }; sh.uniforms.uTriAO = { value: ao };
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vTriP; varying vec3 vTriN;')
        .replace('#include <project_vertex>', '#include <project_vertex>\nvec4 triW = modelMatrix * vec4(transformed, 1.0);\n#ifdef USE_INSTANCING\ntriW = modelMatrix * instanceMatrix * vec4(transformed, 1.0);\n#endif\nvTriP = triW.xyz; vTriN = normalize(mat3(modelMatrix) * objectNormal);');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D tTri; uniform float uTriS; uniform float uTriAO; varying vec3 vTriP; varying vec3 vTriN; vec3 triC;')
        .replace('#include <map_fragment>', `#include <map_fragment>
          vec3 bw = pow(abs(normalize(vTriN)), vec3(4.0)); bw /= (bw.x + bw.y + bw.z);
          triC = texture2D(tTri, vTriP.zy * uTriS).rgb * bw.x + texture2D(tTri, vTriP.xz * uTriS).rgb * bw.y + texture2D(tTri, vTriP.xy * uTriS).rgb * bw.z;
          diffuseColor.rgb *= triC * mix(1.0, 0.55 + 0.45 * smoothstep(0.0, 3.5, vTriP.y), uTriAO);`)
        .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = clamp(roughnessFactor * (0.8 + 0.45 * (1.0 - triC.r)), 0.05, 1.0);')
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
          ${BUMP('dot(triC,vec3(0.3333))', '0.7')}`);
    };
    return mat;
  };
  const mats = {
    concrete: triplanar(new THREE.MeshStandardMaterial({ color: C('#625c57'), roughness: 0.9 }), texConcrete, 0.25),
    concreteL: triplanar(new THREE.MeshStandardMaterial({ color: C('#77706b'), roughness: 0.88 }), texConcrete, 0.25),
    dark: triplanar(new THREE.MeshStandardMaterial({ color: C('#33302e'), roughness: 0.9 }), texConcrete, 0.3, 0),
    steel: triplanar(new THREE.MeshStandardMaterial({ color: C('#6a6560'), roughness: 0.38, metalness: 0.65 }), texSteel, 0.5, 0),
    white: new THREE.MeshStandardMaterial({ color: C('#dedad7'), roughness: 0.55 }),
    redS: new THREE.MeshStandardMaterial({ color: C('#a42410'), roughness: 0.6 }),
    glass: new THREE.MeshStandardMaterial({ color: C('#a9b5ba'), roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.22, depthWrite: false }),
    void: new THREE.MeshBasicMaterial({ color: C('#0d0c0b') }),
    roof: new THREE.MeshPhysicalMaterial({ color: C('#9aa1a6'), roughness: 0.35, metalness: 0.1, transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide }),
  };
  const edgeMat = new THREE.LineBasicMaterial({ color: C(CHALK), transparent: true, opacity: 0.02, depthWrite: false });
  const redMat = new THREE.MeshBasicMaterial({ color: C(RED).multiplyScalar(1.25) });
  const warmMat = new THREE.MeshBasicMaterial({ color: C('#fff1df').multiplyScalar(2.2) });
  const box = (parent, w, h, d, x, y, z, kind = 'concrete', edges = false) => {
    const g = new THREE.BoxGeometry(w, h, d); const m = new THREE.Mesh(g, typeof kind === 'string' ? mats[kind] : kind);
    m.position.set(x, y, z); parent.add(m); if (edges) m.add(new THREE.LineSegments(new THREE.EdgesGeometry(g, 25), edgeMat)); return m;
  };
  const rrect = (w, h, r) => { const sh = new THREE.Shape(), x = -w / 2, y = -h / 2; r = Math.min(r, w / 2, h / 2); sh.moveTo(x + r, y); sh.lineTo(x + w - r, y); sh.quadraticCurveTo(x + w, y, x + w, y + r); sh.lineTo(x + w, y + h - r); sh.quadraticCurveTo(x + w, y + h, x + w - r, y + h); sh.lineTo(x + r, y + h); sh.quadraticCurveTo(x, y + h, x, y + h - r); sh.lineTo(x, y + r); sh.quadraticCurveTo(x, y, x + r, y); return sh; };
  const rbox = (parent, w, h, d, x, y, z, kind, r = 0.2, edges = false) => {
    const bv = Math.min(0.06, d * 0.2, r * 0.5);
    const geo = new THREE.ExtrudeGeometry(rrect(w - bv * 2, h - bv * 2, r), { depth: Math.max(0.001, d - bv * 2), bevelEnabled: true, bevelThickness: bv, bevelSize: bv, bevelSegments: 2, curveSegments: 5 });
    geo.translate(0, 0, -(d - bv * 2) / 2);
    const m = new THREE.Mesh(geo, typeof kind === 'string' ? mats[kind] : kind); m.position.set(x, y, z); parent.add(m);
    if (edges) m.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 35), edgeMat)); return m;
  };
  const cyl = (parent, r, len, axis, x, y, z, kind, seg = 12) => { const geo = new THREE.CylinderGeometry(r, r, len, seg, 1); if (axis === 'x') geo.rotateZ(Math.PI / 2); if (axis === 'z') geo.rotateX(Math.PI / 2); const m = new THREE.Mesh(geo, typeof kind === 'string' ? mats[kind] : kind); m.position.set(x, y, z); parent.add(m); return m; };
  const strutGeo = new THREE.CylinderGeometry(1, 1, 1, 8, 1); strutGeo.translate(0, 0.5, 0);
  const strutMatrix = (a, b, r) => { const d = b.clone().sub(a), L = d.length(); const q = new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), d.normalize()); return new THREE.Matrix4().compose(a, q, V3(r, L, r)); };
  const struts = (parent, list, mat) => { const im = new THREE.InstancedMesh(strutGeo, mat, list.length); list.forEach(([a, b, r], i) => im.setMatrixAt(i, strutMatrix(a, b, r))); im.instanceMatrix.needsUpdate = true; parent.add(im); return im; };
  const radialTex = (() => { const [c, g] = cnv(128, 128); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.18, 'rgba(255,255,255,0.45)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.08)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
  const glowTex = (() => { const [c, g] = cnv(128, 128); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.4, 'rgba(255,255,255,0.3)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
  const NOISE = `float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
    float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),f.x),mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),f.x),f.y); }`;

  // ---------- sky, light, ground
  const skyU = { uTop: { value: C('#060505') }, uHaze: { value: C('#3a2a22') }, uGlow: { value: 0 }, uTime: { value: 0 }, uStars: { value: 1 } };
  const sky = new THREE.Mesh(new THREE.SphereGeometry(2400, 32, 16), new THREE.ShaderMaterial({
    uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: `varying vec3 vP; void main(){ vP=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 uTop; uniform vec3 uHaze; uniform float uGlow; uniform float uTime; uniform float uStars; varying vec3 vP;
      float hs(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      float ns(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(hs(i),hs(i+vec2(1.0,0.0)),f.x),mix(hs(i+vec2(0.0,1.0)),hs(i+vec2(1.0,1.0)),f.x),f.y); }
      void main(){ float h=clamp(vP.y,0.0,1.0); vec3 c=mix(uHaze*(0.12+0.5*uGlow), uTop, pow(h,0.35));
        vec2 sp=vec2(atan(vP.z,vP.x)*160.0, asin(clamp(vP.y,-1.0,1.0))*160.0); vec2 cell=floor(sp); float r=hs(cell);
        float star=step(0.985,r)*smoothstep(0.42,0.0,length(fract(sp)-0.5))*(0.55+0.45*sin(uTime*(1.0+r*4.0)+r*60.0));
        c+=vec3(0.85,0.88,1.0)*star*smoothstep(0.06,0.35,h)*uStars*(1.0-0.55*uGlow)*(0.6+1.8*fract(r*97.0));
        vec2 cp=vP.xz/max(vP.y,0.08)*1.4+vec2(uTime*0.012,uTime*0.004); float cl=ns(cp)*0.55+ns(cp*2.1)*0.3+ns(cp*4.3)*0.15;
        float cm=smoothstep(0.48,0.85,cl)*smoothstep(0.02,0.25,h)*(1.0-smoothstep(0.55,0.95,h));
        c=mix(c, uHaze*(0.35+1.4*uGlow)+vec3(0.02), cm*0.55);
        gl_FragColor=vec4(c,1.0);
        #include <colorspace_fragment>
      }`,
  }));
  sky.renderOrder = -10; scene.add(sky);
  const hemi = new THREE.HemisphereLight(0xd6dcff, 0x1a1210, 0.05); scene.add(hemi);
  const moon = new THREE.DirectionalLight(0x9fb2d6, 0.1); moon.position.set(-300, 400, 200); scene.add(moon);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), triplanar(new THREE.MeshStandardMaterial({ color: C('#2b2826'), roughness: 0.95 }), texAsphalt, 0.12, 0));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.4; // well below the playing surfaces so low-precision depth targets never z-fight scene.add(ground);

  // ---------- segments
  const SEGS = o.segs || []; const SEG = {}; SEGS.forEach(s => { SEG[s.id] = s; });
  const segAt = q => { for (const s of SEGS) if (q <= s.b) return s; return SEGS[SEGS.length - 1]; };
  const LT = (id, q) => { const s = SEG[id]; return s ? clamp((q - s.a) / (s.b - s.a)) : 0; };

  // ---------- the playing surface (one plane; every sport's ground, wiped from the centre with a red front)
  const cc = circuit;
  const surfU = { uA: { value: 0 }, uB: { value: 0 }, uMix: { value: 0 }, uLit: { value: 0 }, uAmb: { value: 0.07 }, uRmax: { value: 160 }, uLR: { value: 62 }, uRed: { value: C(RED) }, ...fogU };
  const surfMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, metalness: 0, transparent: true });
  surfMat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, surfU);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vSW;').replace('#include <project_vertex>', '#include <project_vertex>\nvSW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      uniform float uA; uniform float uB; uniform float uMix; uniform float uAmb; uniform float uRmax; uniform vec3 uRed; varying vec3 vSW; float gR; float gBand; float gB;
      ${NOISE}
      float fbm(vec2 p){ return 0.5*noise(p)+0.25*noise(p*2.03)+0.125*noise(p*4.01)+0.0625*noise(p*8.07); }
      float bx(vec2 p, vec2 h){ vec2 d=abs(p)-h; return max(d.x,d.y); }
      vec3 grass(vec2 p, vec3 a, vec3 b, float sw, float ox, vec3 V){
        float st=step(0.5,fract((p.x+ox)/sw))*2.0-1.0; float sh=st*clamp(V.x*2.2+0.25,-1.0,1.0);
        vec3 c=mix(a,b,0.5+0.45*sh);
        float fw=clamp(length(fwidth(p))*1.4,0.0,1.0);
        float n1=fbm(p*1.3), n2=noise(p*vec2(22.0,57.0)), n3=noise(p*0.15), n4=noise(p*9.0);
        c*=0.84+0.22*n1+mix(0.18*(n2-0.5)+0.1*(n4-0.5),0.0,fw)+0.14*(n3-0.5);
        gR=0.93-0.08*n2*(1.0-fw); return c; }
      vec4 fFoot(vec2 p, vec3 V){ vec3 c=grass(p,vec3(0.19,0.27,0.13),vec3(0.14,0.21,0.095),8.75,52.5,V);
        float n1=fbm(p*0.9); float wear=exp(-pow(length(p-vec2(47.5,0.0))/7.0,2.0))+exp(-pow(length(p+vec2(47.5,0.0))/7.0,2.0))+0.6*exp(-pow(length(p)/5.5,2.0));
        c=mix(c,vec3(0.24,0.2,0.13)*(0.8+0.4*noise(p*6.0)),clamp(wear*0.55*(0.35+n1),0.0,0.65));
        return vec4(c,1.0-smoothstep(0.0,10.0,bx(p,vec2(55.0,37.0)))); }
      vec4 fBask(vec2 p, vec3 V){ float rw=floor(p.y/0.72); float off=hash(vec2(rw,3.1))*7.0; float pl=floor((p.x+off)/7.0); float h=hash(vec2(rw,pl));
        vec3 c=mix(vec3(0.38,0.24,0.13),vec3(0.5,0.33,0.19),h);
        float grain=noise(vec2(p.x*0.9+h*40.0,p.y*38.0))*0.6+noise(vec2(p.x*3.5,p.y*90.0))*0.4; c*=0.78+0.32*grain;
        float fy=fract(p.y/0.72), fx=fract((p.x+off)/7.0); c*=0.8+0.2*smoothstep(0.0,0.035,min(fy,1.0-fy)); c*=0.85+0.15*smoothstep(0.0,0.006,min(fx,1.0-fx));
        vec2 a=abs(p); float key=step(a.x,44.8)*step(26.24,a.x)*step(a.y,7.84);
        c=mix(c,vec3(0.3,0.05,0.03)*(0.85+0.3*grain),max(key,1.0-step(5.76,length(p)))*0.85);
        c*=mix(1.0,0.5,step(0.0,bx(p,vec2(44.8,24.0))));
        gR=0.24+0.18*noise(p*0.7)+0.1*(1.0-grain); gB=1.2;
        return vec4(c,1.0-smoothstep(0.0,6.0,bx(p,vec2(54.0,33.0)))); }
      vec4 fNfl(vec2 p, vec3 V){ vec2 a=abs(p); vec3 c=grass(p,vec3(0.15,0.25,0.11),vec3(0.115,0.2,0.085),9.144,45.72,V);
        float ez=step(45.72,a.x)*step(a.x,54.86)*step(a.y,24.38); float hz=step(0.5,fract((p.x+p.y)/3.2));
        c=mix(c,mix(vec3(0.3,0.045,0.025),vec3(0.24,0.035,0.02),hz)*(0.85+0.25*fbm(p*3.0)),ez);
        c*=mix(1.0,0.7,step(0.0,bx(p,vec2(54.86,24.38)))); gR=mix(gR,0.75,0.4);
        return vec4(c,1.0-smoothstep(0.0,6.0,bx(p,vec2(62.0,32.0)))); }
      vec4 fTen(vec2 p, vec3 V){ vec2 a=abs(p); vec3 c=grass(p,vec3(0.22,0.31,0.15),vec3(0.17,0.25,0.115),3.5,0.0,V);
        vec2 q1=vec2((a.x-43.5)/4.5,p.y/9.0), q2=vec2((a.x-22.4)/3.0,p.y/4.0); float wear=exp(-dot(q1,q1))+0.5*exp(-dot(q2,q2));
        c=mix(c,vec3(0.3,0.23,0.15)*(0.75+0.5*noise(p*5.0)),clamp(wear*(0.45+0.6*fbm(p*1.1)),0.0,0.9));
        c*=mix(1.0,0.82,step(0.0,bx(p,vec2(41.6,19.2))));
        return vec4(c,1.0-smoothstep(0.0,6.0,bx(p,vec2(66.0,34.0)))); }
      vec4 fRace(vec2 p, vec3 V){ vec3 c=vec3(0.05,0.07,0.04)*(0.8+0.35*fbm(p*0.6)+0.15*(noise(p*0.05)-0.5)); gR=0.95;
        return vec4(c,1.0-smoothstep(0.0,24.0,bx(p,vec2(${cc.ext[0].toFixed(1)},${cc.ext[1].toFixed(1)})))); }
      vec4 SS(float id, vec2 p, vec3 V){ if(id<0.5) return fFoot(p,V); if(id<1.5) return fBask(p,V); if(id<2.5) return fNfl(p,V); if(id<3.5) return fTen(p,V); return fRace(p,V); }`)
      .replace('#include <map_fragment>', `#include <map_fragment>
        { vec2 p=vSW.xz; vec3 V=normalize(cameraPosition-vSW); float r=length(p*vec2(1.0,1.3)); float Rr=uMix*uRmax; float w=smoothstep(Rr-16.0,Rr,r);
          gR=0.9; gB=9.0; vec4 s; if(uMix<0.001) s=SS(uA,p,V); else if(uMix>0.999) s=SS(uB,p,V); else { vec4 b=SS(uB,p,V); float rb=gR; vec4 a=SS(uA,p,V); s=mix(b,a,w); gR=mix(rb,gR,w); }
          gBand=(1.0-smoothstep(0.0,4.0,abs(r-Rr+2.0)))*step(0.001,uMix)*step(uMix,0.999);
          diffuseColor.rgb=s.rgb; diffuseColor.a=max(s.a,gBand); }`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor=gR;')
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        ${BUMP('dot(diffuseColor.rgb,vec3(0.3333))', 'gB')}`)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance+=uRed*gBand*2.2+diffuseColor.rgb*uAmb;');
  };
  const surf = new THREE.Mesh(new THREE.PlaneGeometry(900, 700), surfMat);
  surf.rotation.x = -Math.PI / 2; surf.renderOrder = 1; surf.receiveShadow = !LOWQ; scene.add(surf);
  // a wall of red light that rides the ground wipe, so each venue change reads as one sweep
  const curtainU = { uOp: { value: 0 }, uTime: { value: 0 }, uCol: { value: C(RED).multiplyScalar(1.6) } };
  const curtainGeo = new THREE.CylinderGeometry(1, 1, 1, 128, 1, true); curtainGeo.translate(0, 0.5, 0);
  const curtain = new THREE.Mesh(curtainGeo, new THREE.ShaderMaterial({ uniforms: curtainU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: `varying vec2 vUv; varying vec3 vW; void main(){ vUv=uv; vec4 w=modelMatrix*vec4(position,1.0); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `uniform float uOp; uniform float uTime; uniform vec3 uCol; varying vec2 vUv; varying vec3 vW;
      void main(){ float y=vUv.y; float a=pow(1.0-y,2.6)*uOp; a*=0.75+0.25*sin(vW.y*3.0-uTime*12.0); a+=uOp*0.9*(1.0-smoothstep(0.0,0.025,y));
        float flick=0.85+0.15*sin(uTime*31.0+vUv.x*80.0); gl_FragColor=vec4(uCol*flick,clamp(a,0.0,1.0));
        #include <colorspace_fragment>
      }` }));
  curtain.visible = false; curtain.renderOrder = 4; curtain.frustumCulled = false; scene.add(curtain);


  // ---------- the lines: N strands that draw themselves, then glide from one sport's markings into the next
  const SD = {}; ORDER.forEach(k => { SD[k] = strandSet(SPORTS[k].strands); }); SD.tennisBOS = strandSet(tennisCourt(0.91)); SD.padel = strandSet(padelCourt());
  const SH = strandShared(), VN = N * (P - 1) * 4;
  const lg = new THREE.BufferGeometry();
  const dyn = k => { const a = new THREE.BufferAttribute(new Float32Array(VN * k), k); a.setUsage(THREE.DynamicDrawUsage); return a; };
  ['position', 'aA', 'aB'].forEach(n => lg.setAttribute(n, dyn(3))); ['aTA', 'aTB', 'aRA', 'aRB'].forEach(n => lg.setAttribute(n, dyn(1)));
  lg.setAttribute('aU', new THREE.BufferAttribute(SH.u, 1)); lg.setAttribute('aS', new THREE.BufferAttribute(SH.s, 1)); lg.setIndex(new THREE.BufferAttribute(SH.idx, 1));
  let pairKey = '';
  const setPair = (a, b) => {
    const k = a + '>' + b; if (k === pairKey) return; pairKey = k; const A = SD[a], B = SD[b], at = lg.attributes;
    at.aA.array.set(A.pos); at.aB.array.set(B.pos); at.position.array.set(B.pos); at.aTA.array.set(A.t); at.aTB.array.set(B.t); at.aRA.array.set(A.red); at.aRB.array.set(B.red);
    ['position', 'aA', 'aB', 'aTA', 'aTB', 'aRA', 'aRB'].forEach(n => { at[n].needsUpdate = true; });
  };
  const LRED = C(RED).multiplyScalar(1.3), LWHITE = C('#f3f2f2').multiplyScalar(0.72);
  const lineU = { uMorph: { value: 0 }, uLift: { value: 0 }, uReveal: { value: 0 }, uColor: { value: LRED.clone() }, uTip: { value: C('#ffffff').multiplyScalar(2.6) }, uRed: { value: LRED.clone() }, ...fogU };
  const lines = new THREE.Mesh(lg, new THREE.ShaderMaterial({
    uniforms: lineU, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    vertexShader: `attribute vec3 aA; attribute vec3 aB; attribute float aTA; attribute float aTB; attribute float aRA; attribute float aRB; attribute float aU; attribute float aS;
      uniform float uMorph; uniform float uLift; varying vec3 vLW; varying float vT; varying float vM; varying float vRed; varying float vD;
      void main(){ float d=aS*0.14+aU*0.36; float m=smoothstep(d,d+0.5,uMorph);
        vec3 p=mix(aA,aB,m); p.y+=sin(m*3.14159)*uLift*(0.55+0.45*aS);
        vM=m; vT=mix(aTA,aTB,step(0.5,m)); vRed=mix(aRA,aRB,m); vLW=p;
        vec4 mv=modelViewMatrix*vec4(p,1.0); vD=-mv.z; gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `uniform float uReveal; uniform vec3 uColor; uniform vec3 uTip; uniform vec3 uRed; uniform float uFogDen; uniform vec3 uFogCol; varying float vT; varying float vM; varying float vRed; varying float vD;
      varying vec3 vLW; ${NOISE}
      void main(){ if(vT>uReveal) discard; float tip=smoothstep(uReveal-0.025,uReveal,vT)*(1.0-step(0.999,uReveal));
        vec3 c=mix(uColor,uRed,vRed)*(0.78+0.27*noise(vLW.xz*6.0)); c=mix(c,uTip,max(tip,sin(vM*3.14159)*0.3));
        float f=1.0-exp(-uFogDen*uFogDen*vD*vD); c=mix(c,uFogCol,f*0.85); gl_FragColor=vec4(c,1.0);
        #include <colorspace_fragment>
      }`,
  }));
  lines.frustumCulled = false; lines.renderOrder = 2; scene.add(lines);
  setPair('football', 'football');

  // ---------- LED message textures + boards
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
      c=mix(c,vec3(1.0,0.25,0.08)*1.8,fr); gl_FragColor=vec4(c*uBright,uOp);
      #include <colorspace_fragment>
    }`;
  const allBoards = [];
  const makeBoard = (Vn, parent, len, h, x, y, z, ry, bright, dir) => {
    const u = { uA: { value: ledTex[firstKey].tex }, uB: { value: ledTex[firstKey].tex }, uAspA: { value: ledTex[firstKey].asp }, uAspB: { value: ledTex[firstKey].asp }, uMix: { value: 1 }, uOff: { value: 0 }, uLen: { value: len }, uH: { value: h }, uBright: { value: bright }, uOp: { value: 0 }, uDir: { value: dir } };
    const m = new THREE.Mesh(new THREE.PlaneGeometry(len, h), new THREE.ShaderMaterial({ uniforms: u, vertexShader: boardVS, fragmentShader: boardFS, transparent: true }));
    m.position.set(x, y, z); m.rotation.y = ry; parent.add(m); const b = { m, u, ribbon: dir < 0 }; Vn.boards.push(b); allBoards.push(b); return m;
  };

  // curved LED strip on any geometry (uv.x in metres when len = 1)
  const makeStrip = (Vn, geo, len, h, bright, dir, parent) => {
    const u = { uA: { value: ledTex[firstKey].tex }, uB: { value: ledTex[firstKey].tex }, uAspA: { value: ledTex[firstKey].asp }, uAspB: { value: ledTex[firstKey].asp }, uMix: { value: 1 }, uOff: { value: 0 }, uLen: { value: len }, uH: { value: h }, uBright: { value: bright }, uOp: { value: 0 }, uDir: { value: dir } };
    const m = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms: u, vertexShader: boardVS, fragmentShader: boardFS, transparent: true, side: THREE.DoubleSide }));
    (parent || Vn.root).add(m); const b = { m, u, ribbon: true }; Vn.boards.push(b); allBoards.push(b); return m;
  };

  // ---------- point sprites (crowd lights, dust)
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
  const coneTime = { value: 0 };
  const coneVS = `varying vec2 vUv; varying vec3 vN; varying vec3 vV; varying vec3 vW; void main(){ vUv=uv; vec4 w=modelMatrix*vec4(position,1.0); vW=w.xyz; vN=normalize(mat3(modelMatrix)*normal); vV=normalize(cameraPosition-w.xyz); gl_Position=projectionMatrix*viewMatrix*w; }`;
  const coneFS = `uniform float uOp; uniform vec3 uCol; uniform float uTime; varying vec2 vUv; varying vec3 vN; varying vec3 vV; varying vec3 vW; ${NOISE}
    void main(){ float f=clamp(abs(dot(normalize(vN),normalize(vV))),0.0001,1.0); float a=uOp*pow(clamp(vUv.y,0.0001,1.0),1.7)*pow(f,2.2); a*=smoothstep(0.0,0.06,vUv.y)*smoothstep(1.0,0.97,vUv.y);
      float hz=noise(vW.xz*0.06+vec2(uTime*0.05,vW.y*0.03-uTime*0.07))*0.6+noise(vW.xy*0.17+vec2(-uTime*0.11,uTime*0.04))*0.4; a*=0.45+1.15*hz;
      gl_FragColor=vec4(uCol,clamp(a,0.0,1.0));
      #include <colorspace_fragment>
    }`;
  const coneMat = col => new THREE.ShaderMaterial({ uniforms: { uOp: { value: 0 }, uCol: { value: C(col) }, uTime: coneTime }, vertexShader: coneVS, fragmentShader: coneFS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });

  // ---------- stands (one profile, many venues)
  const seatShape = new THREE.Shape();
  [[-0.2, 0.03], [-0.17, 0.0], [0.11, 0.0], [0.15, 0.03], [0.2, 0.4], [0.18, 0.44], [0.14, 0.43], [0.1, 0.09], [-0.18, 0.1], [-0.21, 0.07]].forEach(([a, b], i) => i ? seatShape.lineTo(a, b) : seatShape.moveTo(a, b));
  const seatGeoBase = new THREE.ExtrudeGeometry(seatShape, { depth: 0.4, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.015, bevelSegments: 1, curveSegments: 1 });
  seatGeoBase.rotateY(-Math.PI / 2); seatGeoBase.translate(0.2, 0, 0); seatGeoBase.computeVertexNormals();
  const seatMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.42 });
  const SEATC = { grey: [0.1, 0.095, 0.093], red: [0.24, 0.04, 0.028], green: [0.06, 0.09, 0.066] };
  function stand(len, tier, opt = {}) {
    const g = new THREE.Group(); const seats = []; const rowD = 0.8;
    const top = [[0, 0], [0, 1.45], [0.3, 1.45], [0.3, 1.4]]; let y = 1.4, z = 0.3, fascia = null;
    const rows = tier * 2, rowY = [], rowZ = [];
    for (let i = 0; i < rows; i++) {
      if (i === tier) { top.push([z, y + 2.6], [z + 0.4, y + 2.6]); fascia = { y: y + 1.3, z }; y += 2.6; z += 0.4; }
      const yn = y + (i < tier ? 0.38 : 0.55);
      top.push([z, yn - 0.06], [z + 0.06, yn], [z + rowD, yn]);
      rowY.push(yn); rowZ.push(z + rowD / 2); z += rowD; y = yn;
    }
    const zEnd = z, topY = y + 1.2;
    top.push([zEnd, topY], [zEnd + 0.4, topY], [zEnd + 0.4, 0]);
    const extrude = (pts, depth, x0, kind = 'concrete', edges = true) => {
      const sh = new THREE.Shape(); pts.forEach(([a, b], i) => i ? sh.lineTo(a, b) : sh.moveTo(a, b));
      const eg = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false, curveSegments: 1 }); eg.rotateY(-Math.PI / 2); eg.translate(x0, 0, 0);
      const m = new THREE.Mesh(eg, mats[kind]); g.add(m); if (edges) m.add(new THREE.LineSegments(new THREE.EdgesGeometry(eg, 30), edgeMat)); return m;
    };
    const G = 2.6;
    if (opt.gap) {
      extrude(top, len / 2 - G, -G); extrude(top, len / 2 - G, len / 2);
      const yb = 3.7, br = []; let on = false;
      for (let i = 1; i < top.length - 1; i++) { const [a, b] = top[i]; if (!on && b >= yb) { const [pa, pb] = top[i - 1]; br.push([pa + (a - pa) * (yb - pb) / ((b - pb) || 1), yb]); on = true; } if (on) br.push([a, b]); }
      br.push([zEnd + 0.4, yb]); extrude(br, G * 2, G);
    } else extrude(top, len, len / 2);
    const sp = (opt.sp || 0.56) * (LOWQ ? 1.5 : 1);
    const vomX = []; if (tier >= 6 && len > 30) for (let vx = -len / 2 + 9; vx <= len / 2 - 9; vx += 15) if (!(opt.gap && Math.abs(vx) < 5)) vomX.push(vx);
    const v0 = tier - 5, v1 = tier - 2;
    for (let i = 0; i < rows; i++) {
      const gp = opt.gap && rowY[i] < 5.2; let k = 0;
      for (let sx = -len / 2 + 0.7; sx < len / 2 - 0.7; sx += sp, k++) { if (k % 16 === 15) continue; if (gp && Math.abs(sx) < 3) continue; if (i >= v0 && i <= v1 && vomX.some(v => Math.abs(sx - v) < 1.5)) continue; seats.push(sx, rowY[i] + 0.005, rowZ[i] + 0.1, k, i); }
    }
    vomX.forEach(vx => {
      const y0 = rowY[v0] - 0.45, z0 = rowZ[v0] - 0.4, z1 = rowZ[v1] + 0.4, hgt = 2.3;
      box(g, 2.4, hgt, 0.05, vx, y0 + hgt / 2, z0, mats.void);
      for (const sx of [-1.3, 1.3]) box(g, 0.22, hgt + 0.1, z1 - z0, vx + sx, y0 + hgt / 2, (z0 + z1) / 2, 'concreteL');
      box(g, 2.82, 0.3, z1 - z0, vx, y0 + hgt + 0.15, (z0 + z1) / 2, 'concreteL');
      box(g, 2.7, 0.04, 0.04, vx, y0 + hgt + 0.32, z0 - 0.02, redMat);
    });
    const colGeo = new THREE.CylinderGeometry(0.32, 0.4, topY + 0.6, 14);
    for (let cx = -len / 2 + 6; cx <= len / 2 - 6; cx += 14) { const cm = new THREE.Mesh(colGeo, mats.steel); cm.position.set(cx, (topY + 0.6) / 2, zEnd + 0.8); g.add(cm); }
    cyl(g, 0.035, len, 'x', 0, 2.45, 0.18, 'steel', 8);
    if (fascia) cyl(g, 0.035, len, 'x', 0, fascia.y + 1.85, fascia.z + 0.25, 'steel', 8);
    if (opt.roof) {
      const rf = -7, rb = zEnd + 1.2, ry = topY + 8, arcP = [];
      for (let i = 0; i <= 28; i++) { const t = i / 28; arcP.push([rb + (rf - rb) * t, ry + Math.sin(t * Math.PI) * 1.3 + t * 1.4]); }
      const rm = extrude(arcP.concat(arcP.slice().reverse().map(([a, b]) => [a, b - 0.32])), len + 2, (len + 2) / 2, 'roof', false); rm.userData.noCast = true;
      const fy = ry + 1.4; cyl(g, 0.32, len + 2, 'x', 0, fy - 0.15, rf, 'steel', 14);
      const S = [];
      for (let cx = -len / 2 + 6; cx <= len / 2 - 6; cx += 14) {
        S.push([V3(cx, topY + 0.6, zEnd + 0.8), V3(cx, ry + 8, zEnd + 0.8), 0.32]);
        S.push([V3(cx, ry + 8, zEnd + 0.8), V3(cx, fy + 0.1, rf + 0.4), 0.09]);
        S.push([V3(cx, ry + 8, zEnd + 0.8), V3(cx, ry + 1.6, (rf + rb) / 2), 0.07]);
      }
      struts(g, S, mats.steel);
      const lgm = new THREE.CircleGeometry(0.26, 12); lgm.rotateX(Math.PI / 2);
      for (let x = -len / 2 + 2; x < len / 2; x += 3.2) { const lm = new THREE.Mesh(lgm, warmMat); lm.position.set(x, fy - 0.55, rf + 0.35); g.add(lm); }
    }
    const n = seats.length / 5, im = new THREE.InstancedMesh(seatGeoBase, seatMat, n);
    const mx = new THREE.Matrix4(), col = new THREE.Color();
    for (let i = 0; i < n; i++) {
      const j = i * 5; mx.makeTranslation(seats[j], seats[j + 1], seats[j + 2]); im.setMatrixAt(i, mx);
      const pal = opt.col === 'red' ? (seats[j + 4] < tier ? SEATC.red : SEATC.grey) : SEATC[opt.col || 'grey'];
      const v = (Math.floor(seats[j + 3] / 16) % 2 ? 1.18 : 1) * (0.9 + Math.random() * 0.25); col.setRGB(pal[0] * v, pal[1] * v, pal[2] * v); im.setColorAt(i, col);
    }
    im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; g.add(im);
    return { g, seats, fascia, topY };
  }

  // ---------- venues
  const venues = [];
  function venue(id, s) { const root = new THREE.Group(); root.scale.setScalar(s); scene.add(root); const Vn = { id, s, root, stands: [], fix: [], lamps: [], boards: [], cones: [], keys: [], extra: [], crowdPts: [], crowd: null, spotK: 1.5 }; venues.push(Vn); return Vn; }
  const _w = new THREE.Vector3();
  function addStand(Vn, d) {
    const st = stand(d.len, d.tier, d); const outer = new THREE.Group(); outer.position.set(d.pos[0], 0, d.pos[1]); outer.rotation.y = d.ry; outer.add(st.g); Vn.root.add(outer);
    if (st.fascia) makeBoard(Vn, st.g, d.len - 1, 1.7, 0, st.fascia.y, st.fascia.z - 0.02, Math.PI, 0.95, -1);
    Vn.root.updateMatrixWorld(true);
    for (let i = 0; i < st.seats.length; i += 5 * 7) { _w.set(st.seats[i], st.seats[i + 1] + 0.45, st.seats[i + 2]); st.g.localToWorld(_w); Vn.crowdPts.push(_w.x, _w.y, _w.z); }
    Vn.stands.push({ g: outer, h: st.topY + 12 });
    return st;
  }
  const lampDisc = new THREE.CircleGeometry(0.66, 20), hoodG = new THREE.CylinderGeometry(0.78, 0.9, 0.55, 20, 1); hoodG.rotateX(Math.PI / 2);
  function lampHead(parent, cols, rows) {
    const head = new THREE.Group(); parent.add(head);
    rbox(head, cols * 2.1 + 0.6, rows * 1.8 + 0.6, 0.6, 0, 0, 0, 'steel', 0.3, true);
    const rowsM = [];
    for (let r = 0; r < rows; r++) {
      const m = new THREE.MeshBasicMaterial({ color: C('#151413') }); rowsM.push(m);
      for (let c = 0; c < cols; c++) { const px = (c - (cols - 1) / 2) * 2.1, py = (r - (rows - 1) / 2) * 1.8; const hs = new THREE.Mesh(hoodG, mats.steel); hs.position.set(px, py, 0.5); head.add(hs); const d = new THREE.Mesh(lampDisc, m); d.position.set(px, py, 0.79); head.add(d); }
    }
    return { head, rowsM };
  }
  function addLamp(Vn, g, H, head, rowsM, aimW, s0, haloSize, hs = 1) {
    Vn.root.updateMatrixWorld(true); head.lookAt(aimW);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTex, color: C('#fff3e4'), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 }));
    halo.scale.setScalar(haloSize / (Vn.s * hs)); halo.position.set(0, 0, 1.4); head.add(halo);
    const L = { g, y0: g ? g.position.y : 0, H, rowsM, halo, s0, on: 0, hk: 1 }; Vn.lamps.push(L); return L;
  }
  const keyOf = (Vn, head, aim, L) => { Vn.root.updateMatrixWorld(true); Vn.keys.push({ pos: head.getWorldPosition(new THREE.Vector3()), aim, lamp: L }); };
  function tower(Vn, x, z, H, s0) {
    const g = new THREE.Group(); g.position.set(x, 0, z); Vn.root.add(g);
    const segs = 8, b0 = 2.0, b1 = 0.75;
    const corner = (y, c) => { const b = b0 + (b1 - b0) * y / H; return V3([-b, b, b, -b][c], y, [-b, -b, b, b][c]); };
    const S = [];
    for (let s = 0; s < segs; s++) { const y0 = s * H / segs, y1 = (s + 1) * H / segs; for (let c = 0; c < 4; c++) { S.push([corner(y0, c), corner(y1, c), 0.16]); const n = (c + 1) % 4; S.push(s % 2 ? [corner(y0, c), corner(y1, n), 0.06] : [corner(y0, n), corner(y1, c), 0.06]); S.push([corner(y1, c), corner(y1, n), 0.07]); } }
    for (let c = 0; c < 4; c++) S.push([corner(H, c), V3([-2.5, 2.5, 2.5, -2.5][c], H - 0.2, [-0.4, -0.4, 0.4, 0.4][c]), 0.1]);
    struts(g, S, mats.steel);
    const { head, rowsM } = lampHead(g, 6, 4); head.position.set(0, H + 3.6, 0);
    const aim = V3(x * Vn.s * 0.22, 0, z * Vn.s * 0.22);
    const L = addLamp(Vn, g, H + 12, head, rowsM, aim, s0, 40); keyOf(Vn, head, aim, L); return L;
  }
  function mast(Vn, x, z, H, s0, cols, rows, hs, haloSize) {
    const g = new THREE.Group(); g.position.set(x, 0, z); Vn.root.add(g);
    const pm = new THREE.Mesh(new THREE.CylinderGeometry(0.32 * hs, 0.62 * hs, H, 14), mats.steel); pm.position.y = H / 2; g.add(pm);
    box(g, 3.4 * hs, 0.2 * hs, 3.4 * hs, 0, H - 1.4 * hs, 0, 'steel');
    const { head, rowsM } = lampHead(g, cols, rows); head.position.set(0, H + 1.6 * hs, 0); head.scale.setScalar(hs);
    const aim = V3(x * Vn.s * 0.12, 0, z * Vn.s * 0.12);
    const L = addLamp(Vn, g, H + 8, head, rowsM, aim, s0, haloSize, hs); keyOf(Vn, head, aim, L); return L;
  }
  function addCones(Vn, k = 0.16) {
    Vn.keys.forEach(kk => {
      if (!kk.lamp) return; const dir = kk.pos.clone().sub(kk.aim), L = dir.length();
      const cone = new THREE.Mesh(new THREE.CylinderGeometry(L * 0.036, L * 0.32, L, 40, 1, true), coneMat('#fff1e0'));
      cone.position.copy(kk.pos).add(kk.aim).multiplyScalar(0.5); cone.quaternion.setFromUnitVectors(V3(0, 1, 0), dir.normalize()); scene.add(cone);
      Vn.cones.push({ m: cone, lamp: kk.lamp, k });
    });
  }
  function finishVenue(Vn, crowdSize = 0.5) {
    if (Vn.crowdPts.length) {
      const cph = new Float32Array(Vn.crowdPts.length / 3).map(() => Math.random());
      const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.Float32BufferAttribute(Vn.crowdPts, 3)); cg.setAttribute('aPh', new THREE.BufferAttribute(cph, 1));
      Vn.crowd = new THREE.Points(cg, ptsMat('#fff1e2', crowdSize, false)); scene.add(Vn.crowd);
    }
  }

  // ===== 01 FOOTBALL (night stadium, scale 1)
  const vF = venue('football', 1);
  [{ len: 116, tier: 15, pos: [0, -43], ry: Math.PI, roof: true }, { len: 76, tier: 13, pos: [61, 0], ry: Math.PI / 2, roof: true }, { len: 76, tier: 13, pos: [-61, 0], ry: -Math.PI / 2, roof: true }, { len: 116, tier: 15, pos: [0, 43], ry: 0, gap: true, roof: true }].forEach(d => addStand(vF, d));
  {
    // goals, nets and corner flags live in venue-detail.js
    for (const [x, z, len, ry] of [[0, 38.6, 108, Math.PI], [0, -38.6, 108, 0], [57.2, 0, 66, -Math.PI / 2], [-57.2, 0, 66, Math.PI / 2]]) {
      const grp = new THREE.Group(); grp.position.set(x, 0, z); grp.rotation.y = ry; vF.root.add(grp);
      const lean = new THREE.Group(); lean.position.set(0, 0.08, 0); lean.rotation.x = -0.1; grp.add(lean);
      rbox(lean, len, 1.24, 0.32, 0, 0.64, -0.18, 'dark', 0.1, true); makeBoard(vF, lean, len - 0.1, 1.1, 0, 0.64, 0.0, 0, 1.35, 1);
    }
    [[72, -56], [72, 56], [-72, 56], [-72, -56]].forEach(([x, z], i) => tower(vF, x, z, 50, i / 4));
    addCones(vF); finishVenue(vF);
  }

  // ===== 02 BASKETBALL (indoor bowl, real metres x3.2)
  const vB = venue('basketball', BB); let jumbo = null;
  const SW = 1280, SHh = 540; const [scrC, scrG] = cnv(SW, SHh); const scrTex = texOf(scrC);
  const screenMat = new THREE.MeshBasicMaterial({ map: scrTex, color: C('#000000') });
  let scrSig = '', scrT = -1;
  {
    [{ len: 34, tier: 9, pos: [0, -10], ry: Math.PI, sp: 0.7, col: 'red' }, { len: 24, tier: 9, pos: [17.5, 0], ry: Math.PI / 2, sp: 0.7, col: 'red' }, { len: 24, tier: 9, pos: [-17.5, 0], ry: -Math.PI / 2, sp: 0.7, col: 'red' }, { len: 34, tier: 9, pos: [0, 10], ry: 0, sp: 0.7, col: 'red' }].forEach(d => addStand(vB, d));
    // hoops: padded stanchion, curved boom, tempered-glass board with LED edge, orange breakaway rim, hanging net
    { const pad = new THREE.MeshStandardMaterial({ color: C('#151414'), roughness: 0.7 }), padR = new THREE.MeshStandardMaterial({ color: C(RED), roughness: 0.55 });
      const boom = new THREE.MeshStandardMaterial({ color: C('#1c1c1d'), roughness: 0.35, metalness: 0.7 }); boom.userData.env = 0.7;
      const orange = new THREE.MeshStandardMaterial({ color: C('#e0571c'), roughness: 0.35, metalness: 0.55 }); orange.userData.env = 0.8;
      const bGlass = new THREE.MeshPhysicalMaterial({ color: C('#dfeef2'), roughness: 0.03, metalness: 0, transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide }); bGlass.userData.env = 1.4;
      const paint = new THREE.MeshStandardMaterial({ color: C('#f3f2f2'), roughness: 0.5 }), led = new THREE.MeshBasicMaterial({ color: C(RED).multiplyScalar(2.4) });
      for (const sx of [-1, 1]) {
        const h = new THREE.Group(); h.position.set(sx * 14, 0, 0); vB.root.add(h);
        const X0 = x => sx * x;                                                                     // local x measured from the baseline, outward positive
        // base: weighted cabinet wrapped in padding, branded front pad
        rbox(h, 1.7, 0.95, 1.3, X0(2.15), 0.48, 0, pad, 0.12); rbox(h, 0.12, 0.8, 1.2, X0(1.28), 0.5, 0, padR, 0.05);
        const [bc, bg] = cnv(256, 160); bg.fillStyle = RED; bg.fillRect(0, 0, 256, 160); bg.fillStyle = CHALK; bg.font = FONT(800, 92); LS(bg, '-4px'); bg.textAlign = 'center'; bg.textBaseline = 'middle'; bg.fillText('MK', 128, 86);
        const bp = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.62), new THREE.MeshStandardMaterial({ map: texOf(bc), roughness: 0.55 })); bp.position.set(X0(1.215), 0.5, 0); bp.rotation.y = sx > 0 ? -Math.PI / 2 : Math.PI / 2; h.add(bp);
        // boom: rises from the cabinet and arcs out over the baseline to the board
        const path = new THREE.CatmullRomCurve3([V3(X0(2.3), 0.9, 0), V3(X0(2.05), 2.3, 0), V3(X0(1.65), 3.35, 0), V3(X0(0.9), 3.62, 0), V3(X0(-0.95), 3.62, 0)]);
        h.add(new THREE.Mesh(new THREE.TubeGeometry(path, 48, 0.1, 14, false), boom));
        const sleeve = new THREE.CatmullRomCurve3([V3(X0(2.3), 0.9, 0), V3(X0(2.15), 1.9, 0), V3(X0(2.02), 2.5, 0)]);
        h.add(new THREE.Mesh(new THREE.TubeGeometry(sleeve, 16, 0.17, 14, false), pad));
        struts(h, [[V3(X0(1.95), 2.6, 0.18), V3(X0(-0.95), 3.2, 0.36), 0.03], [V3(X0(1.95), 2.6, -0.18), V3(X0(-0.95), 3.2, -0.36), 0.03]], boom);
        // board frame behind the glass
        struts(h, [[V3(X0(-1.0), 2.95, -0.75), V3(X0(-1.0), 3.9, -0.75), 0.03], [V3(X0(-1.0), 2.95, 0.75), V3(X0(-1.0), 3.9, 0.75), 0.03], [V3(X0(-1.0), 3.62, -0.75), V3(X0(-1.0), 3.62, 0.75), 0.035]], boom);
        // tempered glass 1.83 x 1.07, bottom edge at 2.90
        const gx = X0(-1.2), yb = 2.9;
        const gl = new THREE.Mesh(new THREE.BoxGeometry(0.035, 1.07, 1.83), bGlass); gl.position.set(gx, yb + 0.535, 0); h.add(gl);
        const face = gx - sx * 0.02, edge = (w, hh, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.008, hh, w), paint); m.position.set(face, y, z); h.add(m); };
        edge(1.83, 0.05, yb + 1.045, 0); edge(0.05, 1.07, yb + 0.535, 0.89); edge(0.05, 1.07, yb + 0.535, -0.89);                 // border
        edge(0.59, 0.05, yb + 0.15 + 0.45 - 0.025, 0); edge(0.59, 0.05, yb + 0.15 + 0.025, 0); edge(0.05, 0.45, yb + 0.375, 0.27); edge(0.05, 0.45, yb + 0.375, -0.27); // target square
        for (const [w, hh, y, z] of [[1.85, 0.025, yb + 1.075, 0], [0.025, 1.07, yb + 0.535, 0.925], [0.025, 1.07, yb + 0.535, -0.925]]) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.04, hh, w), led); m.position.set(gx, y, z); h.add(m); } // LED edge
        rbox(h, 0.14, 0.09, 1.9, gx, yb - 0.02, 0, pad, 0.04); for (const sz of [-1, 1]) rbox(h, 0.14, 0.4, 0.09, gx, yb + 0.18, sz * 0.93, pad, 0.04); // edge padding
        // rim: 18-inch ring on a flange with spring housing, then the net
        const rx = X0(-1.575), ry = 3.05;
        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.2286, 0.011, 10, 40), orange); rim.rotation.x = Math.PI / 2; rim.position.set(rx, ry, 0); h.add(rim);
        rbox(h, 0.16, 0.05, 0.2, X0(-1.29), ry - 0.01, 0, orange, 0.01); rbox(h, 0.06, 0.16, 0.22, X0(-1.24), ry - 0.06, 0, orange, 0.01);
        for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2, hk = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.03, 0.012), orange); hk.position.set(rx + Math.cos(a) * 0.235, ry - 0.02, Math.sin(a) * 0.235); h.add(hk); }
        const nt = nets.hoopNet(0.228, 0.14, 0.44); nt.position.set(rx, ry - 0.005, 0); h.add(nt);
        h.traverse(m => { if (m.isMesh) m.userData.noCast = m.material === bGlass; });
        vB.fix.push({ o: h, kind: 'grow', t0: 0.62 });
      } }
    // lighting rig, lowered from the rafters
    const rig = new THREE.Group(); rig.position.y = 19; vB.root.add(rig);
    const RX = 15, RZ = 11, S = [];
    const rc = [[-RX, -RZ], [RX, -RZ], [RX, RZ], [-RX, RZ]];
    for (let i = 0; i < 4; i++) { const [ax, az] = rc[i], [bx, bz] = rc[(i + 1) % 4]; S.push([V3(ax, 0, az), V3(bx, 0, bz), 0.12], [V3(ax, -0.9, az), V3(bx, -0.9, bz), 0.1]);
      const n = Math.round(Math.hypot(bx - ax, bz - az) / 2.5); for (let k = 0; k <= n; k++) { const t = k / n, x = ax + (bx - ax) * t, z = az + (bz - az) * t; S.push([V3(x, 0, z), V3(x, -0.9, z), 0.05]); if (k < n) { const x2 = ax + (bx - ax) * (k + 1) / n, z2 = az + (bz - az) * (k + 1) / n; S.push([V3(x, 0, z), V3(x2, -0.9, z2), 0.04]); } } }
    for (const [x, z] of rc) S.push([V3(x, 0, z), V3(x * 1.5, 12, z * 1.5), 0.05]);
    struts(rig, S, mats.steel);
    const heads = []; [...[-12, -6, 0, 6, 12].flatMap(x => [[x, -RZ], [x, RZ]]), [-RX, -5], [-RX, 5], [RX, -5], [RX, 5]].forEach(([x, z], i) => {
      const { head, rowsM } = lampHead(rig, 3, 2); head.position.set(x, -1.6, z); head.scale.setScalar(0.42);
      const aim = V3(x * BB * 0.35, 0, z * BB * 0.25); const L = addLamp(vB, null, 0, head, rowsM, aim, (i % 7) / 7 + (i > 9 ? 0.06 : 0), 26, 0.42); heads.push({ head, aim, L });
    });
    [0, 8, 1, 9].forEach(i => keyOf(vB, heads[i].head, heads[i].aim, heads[i].L));
    vB.fix.push({ o: rig, kind: 'drop', y0: 19, h: 18, t0: 0.5 });
    // centre-hung jumbotron
    const jb = new THREE.Group(); jb.position.y = 13; vB.root.add(jb);
    rbox(jb, 10, 4.5, 10, 0, 0, 0, 'dark', 0.2, true);
    for (let k = 0; k < 4; k++) { const f = new THREE.Mesh(new THREE.PlaneGeometry(9.6, 4.05), screenMat); const a = k * Math.PI / 2; f.position.set(Math.sin(a) * 5.03, 0, Math.cos(a) * 5.03); f.rotation.y = a; jb.add(f); }
    for (const y of [2.35, -2.35]) { box(jb, 10.14, 0.16, 0.14, 0, y, 5.0, redMat); box(jb, 10.14, 0.16, 0.14, 0, y, -5.0, redMat); box(jb, 0.14, 0.16, 10.14, 5.0, y, 0, redMat); box(jb, 0.14, 0.16, 10.14, -5.0, y, 0, redMat); }
    rbox(jb, 7, 1.2, 7, 0, -3.0, 0, 'dark', 0.2, true);
    struts(jb, [[-4.4, -4.4], [4.4, -4.4], [4.4, 4.4], [-4.4, 4.4]].map(([x, z]) => [V3(x, 2.3, z), V3(x * 1.6, 5.2, z * 1.4), 0.04]), mats.steel);
    vB.fix.push({ o: jb, kind: 'drop', y0: 13, h: 16, t0: 0.6 }); jumbo = jb;
    vB.spotK = 1.3; addCones(vB, 0.12); finishVenue(vB, 0.45);
  }

  // ===== 03 NFL (open bowl, real metres)
  const vN = venue('nfl', 1);
  const nflDecal = (() => {
    const [c, g] = cnv(2048, 1024); const X = x => (x + 55) / 110 * 2048, Y = z => (z + 27.5) / 55 * 1024, S = 2048 / 110;
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = FONT(800, 1.9 * S); LS(g, `${0.3 * S}px`);
    for (let k = 10; k <= 90; k += 10) { const yd = k <= 50 ? k : 100 - k, x = (k - 50) * 0.9144, s = String(yd);
      g.fillStyle = 'rgba(243,242,242,0.85)'; g.fillText(s, X(x), Y(13.2));
      g.save(); g.translate(X(x), Y(-13.2)); g.rotate(Math.PI); g.fillText(s, 0, 0); g.restore(); }
    g.fillStyle = 'rgba(236,48,19,0.92)'; g.beginPath(); g.arc(X(0), Y(0), 3.6 * S, 0, 7); g.fill();
    g.fillStyle = CHALK; g.font = FONT(800, 3.4 * S); LS(g, `${-0.2 * S}px`); g.fillText('MK', X(0), Y(0.15));
    LS(g, '0px'); g.font = FONT(800, 2.6 * S);
    for (const sx of [-1, 1]) { g.save(); g.translate(X(sx * 50.3), Y(0)); g.rotate(sx * Math.PI / 2); g.fillStyle = 'rgba(243,242,242,0.55)'; g.fillText('MATT KING', 0, 0); g.restore(); }
    // alpha-tested cutout rather than a blended overlay: the AO pass reads it as part of the turf
    const m = new THREE.Mesh(new THREE.PlaneGeometry(110, 55), new THREE.MeshBasicMaterial({ map: texOf(c), alphaTest: 0.5, polygonOffset: true, polygonOffsetFactor: -2 }));
    m.rotation.x = -Math.PI / 2; m.position.y = 0.025; m.renderOrder = 1; m.visible = false; vN.root.add(m); return m;
  })();
  vN.fix.push({ kind: 'fade', t0: 0.55, dur: 0.15, set: f => { nflDecal.visible = f > 0.5; } });
  {
    [{ len: 128, tier: 16, pos: [0, -31], ry: Math.PI, roof: true, sp: 0.7 }, { len: 62, tier: 11, pos: [62, 0], ry: Math.PI / 2, sp: 0.7 }, { len: 62, tier: 11, pos: [-62, 0], ry: -Math.PI / 2, sp: 0.7 }, { len: 128, tier: 16, pos: [0, 31], ry: 0, roof: true, sp: 0.7 }].forEach(d => addStand(vN, d));
    // gooseneck goalposts live in venue-detail.js
    const pyl = new THREE.Group(); vN.root.add(pyl);
    for (const x of [-54.86, -45.72, 45.72, 54.86]) for (const z of [-24.5, 24.5]) box(pyl, 0.12, 0.46, 0.12, x, 0.23, z, 'redS');
    vN.fix.push({ o: pyl, kind: 'growY', t0: 0.66 });
    [[-80, -54], [80, -54], [80, 54], [-80, 54]].forEach(([x, z], i) => mast(vN, x, z, 44, i / 4, 6, 4, 1, 40));
    addCones(vN); finishVenue(vN);
  }

  // ===== 04 TENNIS (show court, real metres x3.5)
  const vT = venue('tennis', TN);
  {
    [{ len: 32, tier: 8, pos: [0, -9.4], ry: Math.PI, roof: true, sp: 0.62, col: 'green' }, { len: 20, tier: 7, pos: [18.6, 0], ry: Math.PI / 2, sp: 0.62, col: 'green' }, { len: 20, tier: 7, pos: [-18.6, 0], ry: -Math.PI / 2, sp: 0.62, col: 'green' }, { len: 32, tier: 8, pos: [0, 9.4], ry: 0, roof: true, sp: 0.62, col: 'green' }].forEach(d => addStand(vT, d));
    // net, umpire's chair, benches and line-judge chairs are built in venue-detail.js
    [[-21, -13], [21, -13], [21, 13], [-21, 13]].forEach(([x, z], i) => mast(vT, x, z, 15, i / 4, 4, 3, 0.5, 30));
    addCones(vT, 0.14); finishVenue(vT, 0.5);
  }
  const venueX = buildVenueDetail({ THREE, nets, vF, vB, vN, vT, box, rbox, cyl, struts, cnv, texOf, FONT, LS, C, V3, RED, CHALK, LOWQ, mats, glowTex, redMat, makeBoard, seatGeoBase });

  // ===== 05 RACE (night circuit, real metres)
  const vR = venue('race', 1);
  const atf = (s, off = 0) => { const M = cc.M, f = ((s / cc.ds) % M + M) % M, i = Math.floor(f), j = (i + 1) % M, u = f - i; const x = cc.c[i][0] + (cc.c[j][0] - cc.c[i][0]) * u, z = cc.c[i][1] + (cc.c[j][1] - cc.c[i][1]) * u; const nx = cc.nrm[i][0] + (cc.nrm[j][0] - cc.nrm[i][0]) * u, nz = cc.nrm[i][1] + (cc.nrm[j][1] - cc.nrm[i][1]) * u; return [x + nx * cc.sIn * off, z + nz * cc.sIn * off]; };
  const at3 = (s, off, y) => { const [x, z] = atf(s, off); return [x, y, z]; };
  const tanAt = s => cc.tan[cc.idx(s)];
  const orient = (g, s) => { const [tx, tz] = tanAt(s); g.rotation.y = Math.atan2(-tz, tx); };
  const trackU = { uRev: { value: 1 }, uLit: { value: 0 }, uRed: { value: C(RED) }, ...fogU };
  const kerbs = [], signs = [], startM = [], kitLED = []; let raceX = null;
  {
    const tp = [], ta = [], te = [], ti = [];
    for (let i = 0; i <= cc.M; i++) { const k = i % cc.M, [x, z] = cc.c[k], [nx, nz] = cc.nrm[k]; tp.push(x + nx * 7.6, 0.015, z + nz * 7.6, x - nx * 7.6, 0.015, z - nz * 7.6); ta.push(i / cc.M, i / cc.M); te.push(0, 1); if (i < cc.M) { const v = i * 2; ti.push(v, v + 1, v + 2, v + 1, v + 3, v + 2); } }
    const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.Float32BufferAttribute(tp, 3)); tg.setAttribute('aT', new THREE.Float32BufferAttribute(ta, 1)); tg.setAttribute('aE', new THREE.Float32BufferAttribute(te, 1)); tg.setIndex(ti);
    tg.computeVertexNormals();
    const trackMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7, metalness: 0, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
    trackMat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, trackU);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aT; attribute float aE; varying float vT; varying float vE; varying vec3 vTW;').replace('#include <project_vertex>', '#include <project_vertex>\nvT=aT; vE=aE; vTW=(modelMatrix*vec4(transformed,1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
        uniform float uRev; uniform vec3 uRed; varying float vT; varying float vE; varying vec3 vTW; float tR; float tTip; float tBh; ${NOISE}`)
        .replace('#include <map_fragment>', `#include <map_fragment>
          if(vT>uRev) discard;
          { vec2 p=vTW.xz; float fwA=clamp(length(fwidth(p))*6.0,0.0,1.0); float ag=mix(noise(p*14.0)*0.6+noise(p*29.0)*0.4,0.5,fwA); vec3 c=vec3(0.07,0.068,0.066)*(0.93+0.07*ag+0.16*noise(p*0.25)+0.08*noise(p*2.1));
            float e=min(vE,1.0-vE); float rub=exp(-((vE-0.5)/0.16)*((vE-0.5)/0.16))*(0.6+0.4*noise(p*vec2(0.4,2.0)));
            c*=1.0-0.35*rub; c*=0.7+0.3*smoothstep(0.0,0.06,e);
            float pud=smoothstep(0.58,0.7,noise(p*0.045)*0.65+noise(p*0.17)*0.35); c*=1.0-0.12*pud;
            diffuseColor.rgb=c; tR=mix(0.62+0.25*ag-0.2*rub,0.06,pud); tBh=ag*(1.0-pud); tTip=smoothstep(uRev-0.006,uRev,vT)*(1.0-step(0.999,uRev)); }`)
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
          ${BUMP('tBh', '0.25')}`)
        .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor=tR;')
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance+=uRed*1.8*tTip+diffuseColor.rgb*0.04;');
    };
    trackMat.userData.env = 0.55;
    const track = new THREE.Mesh(tg, trackMat); track.receiveShadow = !LOWQ;
    track.renderOrder = 1; vR.root.add(track);

    vR.fix.push({ kind: 'fade', t0: 0.22, dur: 0.36, lin: true, set: f => { trackU.uRev.value = f * 1.001; } });
    // apex kerbs + corner boards — they fall in, one corner after another
    const kGeo = new THREE.BoxGeometry(1.9, 0.18, 1.5), col = new THREE.Color();
    cc.apex.forEach((a, k) => {
      const g = new THREE.Group(); vR.root.add(g);
      const km = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55, emissive: C(RED), emissiveIntensity: 0 });
      const list = []; for (let j = -14; j <= 14; j += 2) list.push((a.i + j + cc.M) % cc.M);
      const im = new THREE.InstancedMesh(kGeo, km, list.length); const mx = new THREE.Matrix4(), q = new THREE.Quaternion();
      list.forEach((ii, n) => { const [x, z] = cc.c[ii], [nx, nz] = cc.nrm[ii], [tx, tz] = cc.tan[ii]; q.setFromAxisAngle(V3(0, 1, 0), Math.atan2(-tz, tx)); mx.compose(V3(x + nx * a.side * 7.25, 0.09, z + nz * a.side * 7.25), q, V3(1, 1, 1)); im.setMatrixAt(n, mx); im.setColorAt(n, n % 2 ? col.set('#dedad7') : col.set('#b3260f')); });
      im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; g.add(im);
      const [ax, az] = cc.c[a.i], [nx, nz] = cc.nrm[a.i], [tx, tz] = cc.tan[a.i];
      const sg = new THREE.Group(); sg.position.set(ax - nx * a.side * 16, 0, az - nz * a.side * 16); sg.rotation.y = Math.atan2(-tx, -tz); g.add(sg);
      const [c, cg] = cnv(1024, 470); cg.fillStyle = '#121110'; cg.fillRect(0, 0, 1024, 470); cg.fillStyle = RED; cg.fillRect(0, 0, 330, 470);
      cg.fillStyle = CHALK; cg.font = FONT(800, 230); LS(cg, '-10px'); cg.textBaseline = 'alphabetic'; cg.fillText(`T${k + 1}`, 30, 300);
      LS(cg, '6px'); cg.font = FONT(800, 30); cg.fillText('MARKET ZONE', 34, 420);
      const mk = ((o.markets || [])[k] || '').toUpperCase(); LS(cg, '-2px'); const ft = fitText(cg, mk, 620, 3, 110, 40); cg.fillStyle = CHALK; const lh = ft.fs * 0.92; ft.L.forEach((l, i) => cg.fillText(l, 370, 420 - (ft.L.length - 1 - i) * lh));
      const sm = new THREE.MeshBasicMaterial({ map: texOf(c), color: C('#ffffff').multiplyScalar(0.5) });
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(10, 4.6), sm); pl.position.y = 4.2; sg.add(pl);
      rbox(sg, 10.4, 5, 0.3, 0, 4.2, -0.2, 'dark', 0.1, true); cyl(sg, 0.12, 2.2, 'y', -3.5, 1.1, -0.2, 'steel'); cyl(sg, 0.12, 2.2, 'y', 3.5, 1.1, -0.2, 'steel');
      vR.fix.push({ o: g, kind: 'drop', y0: 0, h: 34, t0: 0.5 + k * 0.045 });
      kerbs.push({ km, s: a.s }); signs.push(sm);
    });
    // start gantry with five red lights
    const sgp = new THREE.Group(); const [sx0, sz0] = atf(0); sgp.position.set(sx0, 0, sz0); orient(sgp, 0); vR.root.add(sgp);
    for (const z of [-8.8, 8.8]) rbox(sgp, 0.8, 7.6, 0.8, 0, 3.8, z, 'steel', 0.1, true);
    rbox(sgp, 0.9, 1.2, 18.4, 0, 7.6, 0, 'dark', 0.1, true);
    const [ck, ckg] = cnv(1024, 64); for (let i = 0; i < 64; i++) for (let j = 0; j < 4; j++) { ckg.fillStyle = (i + j) % 2 ? '#0b0a0a' : CHALK; ckg.fillRect(i * 16, j * 16, 16, 16); }
    const chq = new THREE.Mesh(new THREE.PlaneGeometry(18.2, 1.0), new THREE.MeshBasicMaterial({ map: texOf(ck), color: C('#ffffff').multiplyScalar(0.7) })); chq.position.set(-0.47, 7.6, 0); chq.rotation.y = -Math.PI / 2; sgp.add(chq);
    rbox(sgp, 0.5, 1.0, 5.4, 0, 6.4, 0, 'dark', 0.08);
    for (let k = 0; k < 5; k++) { const m = new THREE.MeshBasicMaterial({ color: C('#1a0a08') }); const d = new THREE.Mesh(new THREE.CircleGeometry(0.36, 20), m); d.position.set(-0.27, 6.4, (k - 2) * 1.0); d.rotation.y = -Math.PI / 2; sgp.add(d); startM.push(m); }
    vR.fix.push({ o: sgp, kind: 'grow', t0: 0.64 });
    // pit building + pit wall + garages (kit on the back walls)
    const pg = new THREE.Group(); const [px, pz] = atf(20, 30); pg.position.set(px, 0, pz); orient(pg, 20); vR.root.add(pg);
    const fz = -cc.sIn;
    rbox(pg, 140, 9, 12, 0, 4.5, 0, 'concreteL', 0.2, true);
    for (let k = -6; k <= 6; k++) box(pg, 8.8, 5.4, 0.5, k * 10.5, 2.7, fz * 6.0, mats.void);
    box(pg, 142, 0.35, 4, 0, 9.1, fz * 7.6, 'dark'); box(pg, 142, 0.3, 0.12, 0, 8.7, fz * 9.6, redMat);
    box(pg, 150, 1.1, 0.5, 0, 0.55, fz * 19.5, 'concreteL', true); box(pg, 150, 0.1, 0.55, 0, 1.15, fz * 19.5, redMat);
    (o.kit || []).forEach((kt, k) => {
      const [c, g] = cnv(1024, 480); g.fillStyle = '#0b0a0a'; g.fillRect(0, 0, 1024, 480); g.fillStyle = RED; g.fillRect(0, 0, 1024, 14);
      LS(g, '6px'); g.font = FONT(800, 30); g.fillStyle = 'rgba(243,242,242,0.7)'; g.textBaseline = 'alphabetic'; g.fillText(`GARAGE ${String(k + 1).padStart(2, '0')} — ${kt.tag}`, 44, 84);
      LS(g, '-2px'); const ft = fitText(g, kt.title.toUpperCase(), 620, 2, 96, 50); g.fillStyle = CHALK; ft.L.forEach((l, i) => g.fillText(l, 44, 200 + i * ft.fs * 0.95));
      { const cx = 840, cy = 210; g.save(); g.lineWidth = 10; g.strokeStyle = CHALK; g.fillStyle = RED;
        if (/PIT/.test(kt.tag)) [[-62, -62], [62, -62], [-62, 62], [62, 62]].forEach(([dx, dy], q) => { g.beginPath(); g.arc(cx + dx, cy + dy, 48, 0, 7); g.fillStyle = '#1b1a19'; g.fill(); g.strokeStyle = q === 0 ? RED : CHALK; g.stroke(); g.beginPath(); g.arc(cx + dx, cy + dy, 18, 0, 7); g.fillStyle = q === 0 ? RED : 'rgba(243,242,242,0.6)'; g.fill(); });
        else if (/DRIVER/.test(kt.tag)) { g.beginPath(); g.arc(cx, cy, 110, 0, 7); g.stroke(); g.beginPath(); g.moveTo(cx - 110, cy + 6); g.lineTo(cx - 34, cy + 6); g.moveTo(cx + 34, cy + 6); g.lineTo(cx + 110, cy + 6); g.moveTo(cx, cy + 40); g.lineTo(cx, cy + 110); g.stroke(); g.beginPath(); g.arc(cx, cy + 6, 34, 0, 7); g.fill(); g.fillRect(cx - 10, cy - 116, 20, 26); }
        else { g.strokeStyle = 'rgba(243,242,242,0.3)'; g.lineWidth = 3; for (let q = 0; q < 5; q++) { g.beginPath(); g.moveTo(cx - 150, cy - 100 + q * 50); g.lineTo(cx + 150, cy - 100 + q * 50); g.stroke(); }
          const P = [-150, 60, -110, 40, -70, 70, -30, 10, 10, 30, 50, -30, 90, -10, 130, -80, 150, -95]; g.strokeStyle = RED; g.lineWidth = 9; g.lineJoin = 'round'; g.beginPath(); for (let q = 0; q < P.length; q += 2) q ? g.lineTo(cx + P[q], cy + P[q + 1]) : g.moveTo(cx + P[q], cy + P[q + 1]); g.stroke();
          g.beginPath(); g.arc(cx + 150, cy - 95, 14, 0, 7); g.fillStyle = CHALK; g.fill(); }
        g.restore(); }
      LS(g, '3px'); g.font = FONT(800, 28); g.fillStyle = '#ff7a5e'; wrapT(g, kt.tools.toUpperCase(), 930).slice(0, 2).forEach((l, i) => g.fillText(l, 44, 380 + i * 40));
      const m = new THREE.MeshBasicMaterial({ map: texOf(c), color: C('#ffffff').multiplyScalar(0.2) });
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(8.2, 3.85), m); pl.position.set((k - 1) * 21, 2.8, fz * 6.3); pl.rotation.y = fz > 0 ? 0 : Math.PI; pg.add(pl); kitLED.push(m);
    });
    vR.fix.push({ o: pg, kind: 'growY', t0: 0.6 });
    const [ftx, ftz] = cc.nrm[0]; const fwx = ftx * cc.sIn, fwz = ftz * cc.sIn;
    addStand(vR, { len: 170, tier: 11, pos: atf(0, -12.5), ry: Math.atan2(-fwx, -fwz), roof: true, sp: 0.75 });
    for (let s = 110; s < cc.len - 100; s += 30) { const [x, z] = atf(s, -14); const g = new THREE.Group(); g.position.set(x, 0, z); vR.root.add(g);
      const pm = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.24, 15, 10), mats.steel); pm.position.y = 7.5; g.add(pm);
      const { head, rowsM } = lampHead(g, 2, 1); head.position.set(0, 15.4, 0); head.scale.setScalar(0.6); const [ax, az] = atf(s, 2);
      addLamp(vR, g, 22, head, rowsM, V3(ax, 0, az), s / cc.len * 0.9, 7, 0.6); }
    const E = SPORTS.race.ext; [[-0.5, -0.4], [0.5, -0.4], [0.5, 0.4], [-0.5, 0.4]].forEach(([a, b]) => vR.keys.push({ pos: V3(a * E, 150, b * E), aim: V3(a * E * 0.6, 0, b * E * 0.6), lamp: null }));
    raceX = buildRaceDetail({ THREE, vR, cc, atf, mats, box, rbox, cyl, struts, cnv, texOf, FONT, LS, C, V3, RED, CHALK, LOWQ, glowTex, fogU, triplanar, texConcrete, NOISE,
      makeStrip: (geo, len, h, bright, dir, parent) => makeStrip(vR, geo, len, h, bright, dir, parent), addStand, redMat, voidMat: mats.void, warmStrip: warmMat, timeU: coneTime });
    vR.fix.push({ o: raceX.root, kind: 'growY', t0: 0.56 });
    vR.spotK = 1.1; finishVenue(vR, 0.55);
  }

  // ---------- global key spotlights (repositioned onto whichever venue is live)
  const spots = [0, 1, 2, 3].map(() => { const s = new THREE.SpotLight(0xfff1e2, 0, 0, 0.75, 0.65, 0); scene.add(s, s.target); return s; });
  let spotVenue = null;
  const placeSpots = Vn => { if (spotVenue === Vn) return; spotVenue = Vn; spots.forEach((s, i) => { const k = Vn.keys[i]; if (!k) return; s.position.copy(k.pos); s.target.position.copy(k.aim); s.angle = Vn.id === 'race' ? 1.0 : 0.75; }); };

  // ---------- tunnel (football hero only)
  const tunnel = new THREE.Group(); scene.add(tunnel);
  const tunnelMat = triplanar(new THREE.MeshStandardMaterial({ color: C('#9a938d'), roughness: 0.8 }), texConcrete, 0.35, 0);
  const TZ0 = 43, TZ1 = 128, TLen = TZ1 - TZ0, TZc = (TZ0 + TZ1) / 2, TWd = 2.3, THt = 3.6;
  box(tunnel, 0.3, THt, TLen, -TWd - 0.15, THt / 2, TZc, tunnelMat); box(tunnel, 0.3, THt, TLen, TWd + 0.15, THt / 2, TZc, tunnelMat);
  box(tunnel, TWd * 2 + 0.6, 0.3, TLen, 0, THt + 0.15, TZc, 'dark'); box(tunnel, TWd * 2 + 0.6, THt + 0.3, 0.3, 0, THt / 2, TZ1 + 0.4, tunnelMat);
  const floorMat = new THREE.MeshStandardMaterial({ color: C('#161514'), roughness: 0.2, metalness: 0.1 });
  box(tunnel, TWd * 2, 0.04, TLen, 0, 0.0, TZc, floorMat);
  const ribS = new THREE.ExtrudeGeometry(rrect(0.26, THt, 0.06), { depth: 0.34, bevelEnabled: false }); ribS.translate(0, THt / 2, -0.17);
  const ribT = new THREE.ExtrudeGeometry(rrect(TWd * 2, 0.3, 0.06), { depth: 0.34, bevelEnabled: false }); ribT.translate(0, THt - 0.15, -0.17);
  for (let z = TZ0 + 3; z < TZ1; z += 3) { for (const sx of [-1, 1]) { const m = new THREE.Mesh(ribS, mats.steel); m.position.set(sx * (TWd - 0.1), 0, z); tunnel.add(m); } const t = new THREE.Mesh(ribT, mats.steel); t.position.set(0, 0, z); tunnel.add(t); }
  box(tunnel, 0.03, 0.05, TLen, -TWd + 0.03, 1.62, TZc, redMat); box(tunnel, 0.03, 0.05, TLen, TWd - 0.03, 1.62, TZc, redMat);
  const strips = [];
  for (let z = TZ0 + 4.5; z < TZ1; z += 3) {
    const sm = new THREE.MeshBasicMaterial({ color: C('#fff1df').multiplyScalar(2.2) }); box(tunnel, 1.6, 0.06, 0.28, 0, THt - 0.33, z, sm);
    const rm = new THREE.MeshBasicMaterial({ map: glowTex, color: C('#fff1df'), transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false });
    const rf = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 1.5), rm); rf.rotation.x = -Math.PI / 2; rf.position.set(0, 0.03, z); tunnel.add(rf); strips.push({ z, sm, rm });
  }
  const tLights = []; for (let z = TZ0 + 7; z < TZ1; z += 12) { const pl = new THREE.PointLight(0xffe9d2, 3.2, 11, 1.2); pl.position.set(0, THt - 0.7, z); scene.add(pl); tLights.push(pl); }
  const mouth = new THREE.Mesh(new THREE.PlaneGeometry(TWd * 2, THt), new THREE.MeshBasicMaterial({ color: C('#fff6ea').multiplyScalar(2.4), transparent: true, opacity: 1, depthWrite: false }));
  mouth.position.set(0, THt / 2, 43.05); scene.add(mouth);
  const RCOL = C(RED), WCOL = C(CHALK);
  const gates = (o.gates || []).map(gw => {
    const g = new THREE.Group(); g.position.set(0, 0, gw.z); tunnel.add(g);
    const fm = new THREE.MeshBasicMaterial({ color: C('#111111') });
    rbox(g, 0.14, THt - 0.3, 0.14, -TWd + 0.3, (THt - 0.3) / 2, 0, fm, 0.05); rbox(g, 0.14, THt - 0.3, 0.14, TWd - 0.3, (THt - 0.3) / 2, 0, fm, 0.05); rbox(g, TWd * 2 - 0.46, 0.14, 0.14, 0, THt - 0.37, 0, fm, 0.05);
    const [c, cg] = cnv(1024, 512); cg.textAlign = 'center'; cg.textBaseline = 'middle';
    const L = gw.lines; let fs = gw.kind === 'care' ? 150 : 250; LS(cg, '-4px'); cg.font = FONT(800, fs);
    while (L.some(l => cg.measureText(l).width > 960) && fs > 50) { fs -= 8; cg.font = FONT(800, fs); }
    L.forEach((l, i) => { cg.fillStyle = gw.red && i === L.length - 1 ? RED : CHALK; cg.fillText(l, 512, 256 + (i - (L.length - 1) / 2) * fs * 0.98); });
    const wm = new THREE.MeshBasicMaterial({ map: texOf(c), transparent: true, opacity: 0, depthWrite: false, color: C('#ffffff').multiplyScalar(gw.kind === 'care' ? 1.0 : 1.15) });
    const wp = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.1), wm); wp.position.set(0, 1.85, 0); g.add(wp);
    return { ...gw, g, fm, wm, wp, base: gw.kind === 'care' ? WCOL : RCOL };
  });

  // ---------- walk-out spotlight, dust
  const spotCone = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 9, 70, 48, 1, true), coneMat('#ffffff')); spotCone.position.set(0, 35, 0); scene.add(spotCone);
  let dust;
  { const dp = [], dph = []; for (let i = 0; i < 700; i++) { const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * 7; dp.push(Math.cos(a) * r, Math.random() * 34, Math.sin(a) * r); dph.push(Math.random()); }
    const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.Float32BufferAttribute(dp, 3)); dg.setAttribute('aPh', new THREE.Float32BufferAttribute(dph, 1));
    dust = new THREE.Points(dg, ptsMat('#fff6ec', 0.14, true)); scene.add(dust); }

  // ---------- chapter: centre-spot rights badge (football)
  const RIGHTS = o.rights || [];
  const badgeTex = (it, i, n) => {
    const S = 1024, [c, g] = cnv(S, S), cx = S / 2;
    g.fillStyle = 'rgba(14,13,13,0.95)'; g.beginPath(); g.arc(cx, cx, S / 2 - 8, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(243,242,242,0.92)'; g.lineWidth = 12; g.beginPath(); g.arc(cx, cx, S / 2 - 14, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = RED; g.lineWidth = 5; g.beginPath(); g.arc(cx, cx, S / 2 - 44, 0, Math.PI * 2); g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(243,242,242,0.85)';
    LS(g, '8px'); g.font = FONT(800, 30); g.fillText(`DAZN FOOTBALL RIGHTS — ${String(i + 1).padStart(2, '0')}/${String(n).padStart(2, '0')}`, cx, 210);
    const img = logoImgs[it.slug];
    if (img) { g.save(); g.beginPath(); g.arc(cx, cx + 10, 255, 0, 7); g.fillStyle = '#ffffff'; g.fill(); g.clip(); const sc = Math.min(350 / img.width, 350 / img.height); g.drawImage(img, cx - img.width * sc / 2, cx + 10 - img.height * sc / 2, img.width * sc, img.height * sc); g.globalCompositeOperation = 'multiply'; g.fillStyle = '#c4c1be'; g.fillRect(0, 0, S, S); g.restore(); }
    else { LS(g, '-2px'); const { L, fs } = fitText(g, it.name.toUpperCase(), 700, 3, 150, 60); g.fillStyle = CHALK; const lh = fs * 0.92, y0 = cx + 10 - (L.length - 1) * lh / 2; L.forEach((l, k) => g.fillText(l, cx, y0 + k * lh)); }
    g.fillStyle = RED; g.fillRect(cx - 60, 772, 120, 10);
    LS(g, '6px'); g.fillStyle = 'rgba(243,242,242,0.85)'; g.font = FONT(800, 32); g.fillText((it.sub || '').toUpperCase(), cx, 832);
    return texOf(c);
  };
  const plateTex = RIGHTS.map((it, i) => badgeTex(it, i, RIGHTS.length));
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
          c.rgb=mix(c.rgb,uRed*1.4,ring); c.a=max(c.a,ring); gl_FragColor=vec4(c.rgb,c.a*uOp);
          #include <colorspace_fragment>
        }`,
    }));
    plate.rotation.x = -Math.PI / 2; plate.position.y = 0.3; plate.renderOrder = 3; plate.visible = false; scene.add(plate);
  }

  // ---------- chapter: the playbook (basketball floor)
  const TW = 1600, TH = 1047; const [tacC, tacG] = cnv(TW, TH); const tacTex = texOf(tacC);
  const tac = new THREE.Mesh(new THREE.PlaneGeometry(110, 72), new THREE.MeshBasicMaterial({ map: tacTex, transparent: true, depthWrite: false, color: C('#ffffff').multiplyScalar(1.15) }));
  tac.rotation.x = -Math.PI / 2; tac.position.y = 0.12; tac.renderOrder = 5; tac.visible = false; scene.add(tac);
  let tacLast = -1;

  // ---------- chapter: the drive (NFL) — how a fan is made, down by down
  const DX = [-36.58, -27.43, -9.14, 9.14, 22.86, 36.58, 50.29];
  const fdLine = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 48.8), new THREE.MeshBasicMaterial({ color: C(RED).multiplyScalar(1.7), transparent: true, opacity: 0, depthWrite: false }));
  fdLine.rotation.x = -Math.PI / 2; fdLine.position.y = 0.07; fdLine.renderOrder = 4; scene.add(fdLine);
  // plates stay inside the field of play (the end line is at x 54.9) so the last one never sits in the stands
  const drivePlates = (o.drive || []).map((it, i) => {
    const [c, g] = cnv(1024, 576); g.fillStyle = 'rgba(11,10,10,0.9)'; g.fillRect(0, 0, 1024, 576); g.fillStyle = RED; g.fillRect(0, 0, 1024, 16);
    LS(g, '6px'); g.font = FONT(800, 30); g.fillStyle = 'rgba(243,242,242,0.7)'; g.textBaseline = 'alphabetic'; g.fillText(`${it.down} · ${it.years}`, 48, 92);
    LS(g, '-3px'); const ft = fitText(g, it.name.toUpperCase(), 920, 2, 150, 60); g.fillStyle = CHALK; const lh = ft.fs * 0.9; ft.L.forEach((l, k) => g.fillText(l, 48, 300 + (k - (ft.L.length - 1)) * lh + (ft.L.length > 1 ? lh * 0.5 : 0)));
    LS(g, '3px'); g.font = FONT(800, 30); g.fillStyle = '#ff7a5e'; wrapT(g, it.role.toUpperCase(), 920).slice(0, 2).forEach((l, k) => g.fillText(l, 48, 440 + k * 42));
    if (it.logo && logoImgs['career-' + it.logo]) logoTile(g, logoImgs['career-' + it.logo], 1024 - 48 - 150, 44, 150);
    const n = (o.drive || []).length, sw = (928 - (n - 1) * 8) / n;
    for (let k = 0; k < n; k++) { g.fillStyle = k < i ? 'rgba(243,242,242,0.75)' : k === i ? RED : 'rgba(243,242,242,0.16)'; g.fillRect(48 + k * (sw + 8), 516, sw, 12); }
    const grp = new THREE.Group(); grp.position.set(Math.min(DX[i] + 14, 44), 4.6, 9); grp.rotation.y = -Math.PI / 2 - 0.35; grp.visible = false; scene.add(grp);
    const face = new THREE.MeshBasicMaterial({ map: texOf(c), transparent: true, opacity: 0, depthWrite: false });
    const fm = new THREE.Mesh(new THREE.PlaneGeometry(12, 6.75), face); fm.position.z = 0.02; fm.renderOrder = 6; grp.add(fm);
    const shell = new THREE.MeshStandardMaterial({ color: C('#151414'), roughness: 0.5, metalness: 0.4, transparent: true, opacity: 0 });
    const lip = new THREE.MeshBasicMaterial({ color: C(RED).multiplyScalar(1.6), transparent: true, opacity: 0 });
    const bk = new THREE.Mesh(new THREE.BoxGeometry(12.5, 7.25, 0.34), shell); bk.position.z = -0.18; grp.add(bk);
    const tp = new THREE.Mesh(new THREE.BoxGeometry(12.5, 0.16, 0.38), lip); tp.position.set(0, 3.7, -0.16); grp.add(tp);
    for (const lx of [-4.2, 4.2]) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 4.6, 10), shell); leg.position.set(lx, -5.9, -0.2); grp.add(leg); }
    [bk, tp, ...grp.children.slice(3)].forEach(m => { m.userData.noCast = true; });
    return { grp, mats: [face, shell, lip] };
  });
  const pigskin = new THREE.Mesh(new THREE.SphereGeometry(0.15, 20, 12), new THREE.MeshStandardMaterial({ color: C('#5e2618'), roughness: 0.6 })); pigskin.scale.set(1.9, 1, 1); pigskin.position.y = 0.16; scene.add(pigskin);
  box(pigskin, 0.12, 0.02, 0.03, 0, 0.14, 0, 'white');
  // the huddle — talent rules XI in formation
  const players = [];
  {
    const discTex = (n, inv) => { const [c, g] = cnv(256, 256); g.fillStyle = inv ? CHALK : RED; g.beginPath(); g.arc(128, 128, 124, 0, Math.PI * 2); g.fill(); g.fillStyle = inv ? RED : CHALK; g.font = FONT(800, 120); g.textAlign = 'center'; g.textBaseline = 'middle'; LS(g, '-4px'); g.fillText(String(n), 128, 136); return texOf(c); };
    const cgm = new THREE.CircleGeometry(1.9, 48), rg = new THREE.RingGeometry(2.3, 2.6, 48);
    (o.formation || []).forEach(([x, z, n]) => {
      const g = new THREE.Group(); g.position.set(x, 0.25, z); const t0 = discTex(n, false), t1 = discTex(n, true);
      const disc = new THREE.Mesh(cgm, new THREE.MeshBasicMaterial({ map: t0, transparent: true })); disc.rotation.x = -Math.PI / 2; g.add(disc);
      const ring = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ color: C(CHALK), transparent: true, opacity: 0.8, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; g.add(ring);
      g.scale.setScalar(0.0001); g.visible = false; g.renderOrder = 6; scene.add(g); players.push({ g, disc, ring, t0, t1 });
    });
  }
  let highlight = -1;
  // the play: each talent rule draws its player's assignment, like a playbook page. Offence attacks +x.
  const ROLE = {
    LT: [[[0, 0], [2.6, -1.2]], 'T'], LG: [[[0, 0], [2.6, 0]], 'T'], C: [[[0, 0], [2.6, 0]], 'T'], RG: [[[0, 0], [2.6, 0]], 'T'], RT: [[[0, 0], [2.6, 1.2]], 'T'],
    TE: [[[0, 0], [9, 0], [15, -6]], 'A'], QB: [[[0, 0], [-5, 0]], 'A'], FB: [[[0, 0], [10, 2.3], [12.5, 2.3]], 'T'], RB: [[[0, 0], [3, -8], [12, -14], [22, -14]], 'A'],
    WRR: [[[0, 0], [24, 0]], 'A'], WRL: [[[0, 0], [8, 0], [18, 10]], 'A'],
  };
  const PX0 = -40, PZ0 = -30, PW = 56, PH = 60, PS = 20; // board covers x -40..16, z -30..30 at 20 px a metre
  const routes = (o.formation || []).map(([x, z, n, pos, name]) => {
    const [pts, end] = ROLE[pos === 'WR' ? (z > 0 ? 'WRR' : 'WRL') : pos] || [[[0, 0]], 'T'];
    const P = pts.map(([dx, dz]) => [x + dx, z + dz]); let len = 0; for (let i = 1; i < P.length; i++) len += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]);
    return { P, end, len, n, name: name || '', x, z };
  });
  const qbI = (o.formation || []).findIndex(f => f[3] === 'QB'), wrI = (o.formation || []).findIndex(f => f[3] === 'WR' && f[1] > 0);
  const [playC, playG] = cnv(PW * PS, PH * PS), playTex = texOf(playC);
  const play = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), new THREE.MeshBasicMaterial({ map: playTex, transparent: true, depthWrite: false, opacity: 0 }));
  play.rotation.x = -Math.PI / 2; play.position.set(PX0 + PW / 2, 0.09, PZ0 + PH / 2); play.renderOrder = 5; play.visible = false; scene.add(play);
  let playKey = '';
  function drawPlay(step, u, hi) {
    const g = playG, X = x => (x - PX0) * PS, Y = z => (z - PZ0) * PS;
    g.clearRect(0, 0, playC.width, playC.height); g.lineCap = 'round'; g.lineJoin = 'round';
    // line of scrimmage
    g.save(); g.setLineDash([18, 14]); g.strokeStyle = 'rgba(243,242,242,0.35)'; g.lineWidth = 4; g.beginPath(); g.moveTo(X(-9.6), Y(-27)); g.lineTo(X(-9.6), Y(27)); g.stroke(); g.restore();
    const stroke = (r, k, col, w, glow) => {
      if (k <= 0) return; let left = r.len * k; g.save(); g.strokeStyle = col; g.fillStyle = col; g.lineWidth = w; if (glow) { g.shadowColor = 'rgba(236,48,19,0.9)'; g.shadowBlur = 22; }
      g.beginPath(); g.moveTo(X(r.P[0][0]), Y(r.P[0][1])); let ex = r.P[0], dir = [1, 0];
      for (let i = 1; i < r.P.length && left > 0; i++) { const a = r.P[i - 1], b = r.P[i], sl = Math.hypot(b[0] - a[0], b[1] - a[1]), f = Math.min(1, left / sl); dir = [(b[0] - a[0]) / sl, (b[1] - a[1]) / sl]; ex = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]; g.lineTo(X(ex[0]), Y(ex[1])); left -= sl; }
      g.stroke();
      if (k >= 0.999) { const [dx, dz] = dir, nx = -dz, nz = dx; g.beginPath();
        if (r.end === 'T') { g.moveTo(X(ex[0] + nx * 1.3), Y(ex[1] + nz * 1.3)); g.lineTo(X(ex[0] - nx * 1.3), Y(ex[1] - nz * 1.3)); g.stroke(); }
        else { g.moveTo(X(ex[0] + dx * 1.2), Y(ex[1] + dz * 1.2)); g.lineTo(X(ex[0] - dx * 0.6 + nx * 1.0), Y(ex[1] - dz * 0.6 + nz * 1.0)); g.lineTo(X(ex[0] - dx * 0.6 - nx * 1.0), Y(ex[1] - dz * 0.6 - nz * 1.0)); g.closePath(); g.fill(); } }
      g.restore();
    };
    routes.forEach((r, i) => { if (i < step) stroke(r, 1, 'rgba(243,242,242,0.85)', 7, false); });
    // the throw lands once the last rule is called
    if (step >= routes.length - 1 && qbI >= 0 && wrI >= 0) { const a = routes[qbI].P[routes[qbI].P.length - 1], b = routes[wrI].P[routes[wrI].P.length - 1], k = step > routes.length - 1 ? 1 : ss(u / 0.7);
      g.save(); g.setLineDash([22, 16]); g.strokeStyle = RED; g.lineWidth = 6; g.shadowColor = 'rgba(236,48,19,0.8)'; g.shadowBlur = 16; g.beginPath(); const mx = (a[0] + b[0]) / 2 - 6, mz = (a[1] + b[1]) / 2 - 4;
      for (let j = 0; j <= 40 * k; j++) { const q = j / 40, iq = 1 - q, px = iq * iq * a[0] + 2 * iq * q * mx + q * q * b[0], pz = iq * iq * a[1] + 2 * iq * q * mz + q * q * b[1]; j ? g.lineTo(X(px), Y(pz)) : g.moveTo(X(px), Y(pz)); } g.stroke(); g.restore(); }
    if (hi >= 0 && hi !== step && routes[step]) stroke(routes[step], ss(clamp(u / 0.6)), 'rgba(243,242,242,0.85)', 7, false);
    const cur = hi >= 0 ? hi : step; if (cur < 0 || !routes[cur]) return;
    stroke(routes[cur], hi >= 0 && hi !== step ? 1 : ss(clamp(u / 0.6)), RED, 10, true);
    // play call: bottom-left of the board, the one patch of field no route crosses
    const r = routes[cur], bx = X(-39.5), bw = X(-17) - bx, label = r.name.toUpperCase();
    g.font = FONT(800, 40); LS(g, '-1px'); const words = label.split(' '), lines = ['']; words.forEach(w => { const tl = lines[lines.length - 1] ? lines[lines.length - 1] + ' ' + w : w; if (g.measureText(tl).width > bw - 40 && lines[lines.length - 1]) lines.push(w); else lines[lines.length - 1] = tl; });
    const bh = 70 + lines.length * 44, by = Y(24.6) - bh;
    g.fillStyle = 'rgba(11,10,10,0.88)'; g.fillRect(bx, by, bw, bh); g.fillStyle = RED; g.fillRect(bx, by, bw, 6);
    g.textBaseline = 'alphabetic'; g.fillStyle = RED; g.font = FONT(800, 24); LS(g, '5px'); g.fillText(`PLAY CALL ${String(r.n).padStart(2, '0')} / ${String(routes.length).padStart(2, '0')}`, bx + 20, by + 44);
    g.fillStyle = CHALK; g.font = FONT(800, 40); LS(g, '-1px'); lines.forEach((l, k) => g.fillText(l, bx + 20, by + 92 + k * 44));
  }

  // ---------- chapter: the crowd re-forming (tennis)
  let fans = null;
  {
    const src = vT.crowdPts, nSrc = Math.floor(src.length / 3), n = Math.min(LOWQ ? 3000 : 5600, nSrc * 8);
    const [, g] = cnv(512, 220); const ftx = o.fansText || 'NEW'; let ffs = 200; g.fillStyle = '#fff'; g.font = FONT(800, ffs); LS(g, '-6px'); while (g.measureText(ftx).width > 490 && ffs > 80) { ffs -= 8; g.font = FONT(800, ffs); } g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ftx, 256, 118);
    const d = g.getImageData(0, 0, 512, 220).data, cand = []; for (let y = 0; y < 220; y += 2) for (let x = 0; x < 512; x += 2) if (d[(y * 512 + x) * 4 + 3] > 128) cand.push([x, y]);
    if (nSrc && cand.length) {
      const from = new Float32Array(n * 3), to = new Float32Array(n * 3), ph = new Float32Array(n);
      for (let i = 0; i < n; i++) { const si = Math.floor(Math.random() * nSrc); from[i * 3] = src[si * 3]; from[i * 3 + 1] = src[si * 3 + 1]; from[i * 3 + 2] = src[si * 3 + 2]; const t = cand[Math.floor(Math.random() * cand.length)]; to[i * 3] = (t[0] - 256) / 512 * 92; to[i * 3 + 1] = 0.5; to[i * 3 + 2] = (t[1] - 112) / 220 * 39.5; ph[i] = Math.random(); }
      const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.BufferAttribute(from, 3)); fg.setAttribute('aTo', new THREE.BufferAttribute(to, 3)); fg.setAttribute('aPh', new THREE.BufferAttribute(ph, 1));
      fans = new THREE.Points(fg, new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uTime: { value: 0 }, uOp: { value: 0 }, uA: { value: C(RED).multiplyScalar(1.4) }, uB: { value: C(CHALK) } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        vertexShader: `attribute vec3 aTo; attribute float aPh; uniform float uT; uniform float uTime; varying float vA; varying float vPh; varying float vM;
          void main(){ float m=smoothstep(aPh*0.45,aPh*0.45+0.55,uT); vec3 p=mix(position,aTo,m); p.y+=sin(m*3.14159)*(14.0+16.0*aPh);
            vA=0.65+0.35*sin(uTime*3.0+aPh*30.0); vPh=aPh; vM=m; vec4 mv=modelViewMatrix*vec4(p,1.0); gl_PointSize=(1.2+1.5*m)*(300.0/-mv.z); gl_Position=projectionMatrix*mv; }`,
        fragmentShader: `uniform float uOp; uniform vec3 uA; uniform vec3 uB; varying float vA; varying float vPh; varying float vM;
          void main(){ vec2 d=gl_PointCoord-0.5; float r=length(d); if(r>0.5) discard; vec3 c=mix(uA,uB,step(0.8,vPh)); gl_FragColor=vec4(c,uOp*vA*(1.0-r*2.0)*(0.5+0.5*vM));
            #include <colorspace_fragment>
          }` }));
      fans.frustumCulled = false; fans.renderOrder = 7; scene.add(fans);
    }
  }
  // ---------- chapter: exhibitions that changed the court (tennis, overhead)
  // Battle of the Surfaces (2007): half grass, half clay. Battle of the Sexes (2025): one half about 9% smaller.
  const CTL = 11.885 * TN, CTW = 5.485 * TN;
  // red clay, painted for this half court (u: net → stand, v: across): terracotta base, mottling, drag-mat sweeps,
  // a scuffed baseline with slide marks, crushed-brick grain, plus a tiling grain normal map so the lights catch it
  const CW_ = 63.6, CD_ = 63.2, clayRes = LOWQ ? 1024 : 2048;
  const makeClayTex = () => {
    const S = clayRes, [c, g] = cnv(S, S), U = x => x / CW_ * S, V = z => (z + CD_ / 2) / CD_ * S, rnd = (a, b) => a + Math.random() * (b - a);
    g.fillStyle = '#c9683c'; g.fillRect(0, 0, S, S);
    // broad mottling: damp and dry patches
    for (let i = 0; i < 420; i++) { const x = rnd(0, S), y = rnd(0, S), r = rnd(S * 0.03, S * 0.14), dark = Math.random() < 0.5, gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, dark ? 'rgba(150,62,30,0.06)' : 'rgba(222,134,88,0.06)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
    // drag-mat sweeps: long, faint, slightly curved streaks across the court
    g.lineCap = 'round';
    for (let b = 0; b < 26; b++) { const y0 = rnd(-S * 0.1, S * 1.1), bend = rnd(-S * 0.12, S * 0.12), lite = Math.random() < 0.6;
      for (let k = 0; k < 14; k++) { const y = y0 + k * S * 0.0035; g.strokeStyle = lite ? `rgba(226,140,96,${rnd(0.025, 0.06)})` : `rgba(110,40,18,${rnd(0.02, 0.05)})`; g.lineWidth = rnd(1, 3) * S / 2048;
        g.beginPath(); g.moveTo(-10, y); g.quadraticCurveTo(S / 2, y + bend, S + 10, y + bend * 0.3); g.stroke(); } }
    // baseline zone: dusty, lighter, scuffed (baseline at x 41.6, play happens just behind it)
    const bx = U(11.885 * TN);
    for (let i = 0; i < 160; i++) { const x = bx + rnd(-S * 0.02, S * 0.07), y = V(rnd(-14, 14)), r = rnd(S * 0.008, S * 0.03), gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, 'rgba(232,160,116,0.08)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
    // slide marks: players slide along the baseline, so streaks run across the court with a dark leading edge
    for (let i = 0; i < 26; i++) { const x = bx + rnd(-S * 0.01, S * 0.05), y = V(rnd(-13, 13)), len = rnd(S * 0.008, S * 0.022), w = rnd(S * 0.002, S * 0.004), a = rnd(-0.25, 0.25);
      g.save(); g.translate(x, y); g.rotate(Math.PI / 2 + a); g.fillStyle = `rgba(232,160,116,${rnd(0.06, 0.12)})`; g.beginPath(); g.ellipse(0, 0, len, w, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = `rgba(120,44,20,${rnd(0.08, 0.16)})`; g.lineWidth = w * 0.3; g.beginPath(); g.ellipse(0, 0, len, w, 0, Math.PI * 0.9, Math.PI * 2.1); g.stroke(); g.restore(); }
    // footwork scuffs inside the court and around the service line
    for (let i = 0; i < 220; i++) { const x = U(rnd(1, 11.885 * TN + 3)), y = V(rnd(-20, 20)), r = rnd(S * 0.0012, S * 0.0028);
      g.fillStyle = Math.random() < 0.5 ? `rgba(130,48,20,${rnd(0.05, 0.1)})` : `rgba(230,150,104,${rnd(0.05, 0.1)})`; g.beginPath(); g.ellipse(x, y, r * 1.8, r, rnd(0, Math.PI), 0, Math.PI * 2); g.fill(); }
    // crushed-brick grain: per-pixel jitter with the odd light and dark speck
    const id = g.getImageData(0, 0, S, S), d = id.data;
    for (let p = 0; p < d.length; p += 4) { const n = (Math.random() - 0.5) * 16, sp = Math.random(); let m = sp < 0.003 ? 26 : sp > 0.997 ? -24 : 0;
      d[p] = Math.max(0, Math.min(255, d[p] + n + m)); d[p + 1] = Math.max(0, Math.min(255, d[p + 1] + n * 0.75 + m * 0.7)); d[p + 2] = Math.max(0, Math.min(255, d[p + 2] + n * 0.55 + m * 0.5)); }
    g.putImageData(id, 0, 0);
    const t = texOf(c); t.anisotropy = 8; return t; };
  const makeClayNrm = () => { // tiling grain: soft lumps plus fine grit, turned into a normal map
    const S = 512, h = new Float32Array(S * S), [lc, lg] = cnv(64, 64), li = lg.createImageData(64, 64);
    for (let p = 0; p < li.data.length; p += 4) { const v = Math.random() * 255; li.data[p] = li.data[p + 1] = li.data[p + 2] = v; li.data[p + 3] = 255; } lg.putImageData(li, 0, 0);
    const [bc, bg] = cnv(S, S); bg.imageSmoothingEnabled = true; bg.drawImage(lc, 0, 0, S, S); const bd = bg.getImageData(0, 0, S, S).data;
    for (let k = 0; k < S * S; k++) h[k] = bd[k * 4] / 255 * 0.6 + Math.random() * 0.4;
    const [c, g] = cnv(S, S), o = g.createImageData(S, S);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const k = y * S + x, dx = h[y * S + (x + 1) % S] - h[y * S + (x + S - 1) % S], dy = h[((y + 1) % S) * S + x] - h[((y + S - 1) % S) * S + x];
      let nx = -dx * 2.2, ny = -dy * 2.2, nz = 1; const l = Math.hypot(nx, ny, nz); o.data[k * 4] = (nx / l * 0.5 + 0.5) * 255; o.data[k * 4 + 1] = (ny / l * 0.5 + 0.5) * 255; o.data[k * 4 + 2] = (nz / l * 0.5 + 0.5) * 255; o.data[k * 4 + 3] = 255; }
    g.putImageData(o, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(14, 14); t.anisotropy = 8; return t; };
  const clay = new THREE.Mesh(new THREE.PlaneGeometry(CW_, CD_), new THREE.MeshStandardMaterial({ color: C('#c9683c'), normalScale: new THREE.Vector2(0.55, 0.55), roughness: 0.97, metalness: 0,
    emissive: C('#c9683c'), emissiveIntensity: 0.2, transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 }));
  { const build = () => { const m = clay.material, t = makeClayTex(); m.map = t; m.emissiveMap = t; m.normalMap = makeClayNrm(); m.color.set('#ffffff'); m.emissive.set('#ffffff'); m.needsUpdate = true; };
    (window.requestIdleCallback || (f => setTimeout(f, 1)))(() => setTimeout(build, 2500), { timeout: 6000 }); }
  clay.rotation.x = -Math.PI / 2; clay.position.set(CW_ / 2, 0.02, 0); clay.renderOrder = 1; clay.visible = false; clay.userData.noCast = true; scene.add(clay);
  const cut = (() => { const k = 0.91, [c, g] = cnv(512, 512), X = x => (x + CTL) / CTL * 512, Y = z => (z + CTW) / (2 * CTW) * 512;
    g.fillStyle = 'rgba(236,48,19,0.28)'; g.fillRect(0, 0, 512, 512); g.strokeStyle = 'rgba(236,48,19,0.95)'; g.lineWidth = 6; for (let d = -512; d < 1024; d += 28) { g.beginPath(); g.moveTo(d, 0); g.lineTo(d + 512, 512); g.stroke(); }
    g.clearRect(X(-CTL * k), Y(-CTW * k), X(0) - X(-CTL * k), Y(CTW * k) - Y(-CTW * k));
    const m = new THREE.Mesh(new THREE.PlaneGeometry(CTL, CTW * 2), new THREE.MeshBasicMaterial({ map: texOf(c), transparent: true, opacity: 0, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.set(-CTL / 2, 0.05, 0); m.renderOrder = 3; m.visible = false; scene.add(m); return m; })();
  const groundLabel = (top, sub, x, z, red) => { const [c, g] = cnv(1024, 200); g.textBaseline = 'alphabetic'; g.textAlign = 'center';
    g.font = FONT(800, 92); LS(g, '-2px'); g.lineJoin = 'round'; g.lineWidth = 16; g.strokeStyle = 'rgba(11,10,10,0.85)'; g.strokeText(top, 512, 100); g.fillStyle = CHALK; g.fillText(top, 512, 100);
    g.font = FONT(800, 40); LS(g, '8px'); g.lineWidth = 12; g.strokeText(sub, 512, 168); g.fillStyle = red ? '#ff7a5e' : 'rgba(243,242,242,0.85)'; g.fillText(sub, 512, 168);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(30, 5.86), new THREE.MeshBasicMaterial({ map: texOf(c), transparent: true, opacity: 0, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.set(x, 0.08, z); m.renderOrder = 7; m.visible = false; scene.add(m); return m; };
  // ---------- padel: blue turf, glass and mesh cage, posts and clamps, doors at the net, net, floodlights (real metres x TN)
  const PDL = 10 * TN, PDW = 5 * TN, M_ = TN;
  const turf = (() => { const S = LOWQ ? 1024 : 2048, [c, g] = cnv(S, S / 2), U = x => (x / (2 * PDL) + 0.5) * S, V = z => (z / (2 * PDW) + 0.5) * S / 2;
    g.fillStyle = '#2459a0'; g.fillRect(0, 0, S, S / 2);
    // worn, sandier zones: behind each service line and around the net where players stand
    for (const [x0, x1, a] of [[-PDL, -6.95 * TN, 0.12], [6.95 * TN, PDL, 0.12], [-2 * TN, 2 * TN, 0.07]]) for (let i = 0; i < 70; i++) {
      const x = U(x0 + Math.random() * (x1 - x0)), y = V((Math.random() - 0.5) * 2 * PDW * 0.8), r = S * (0.01 + Math.random() * 0.03), gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, `rgba(196,182,150,${a})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
    // fibre grain and sand grains
    const id = g.getImageData(0, 0, S, S / 2), d = id.data;
    for (let k = 0; k < d.length; k += 4) { const px = (k / 4) % S, n = (Math.random() - 0.5) * 30 + Math.sin(px * 0.9) * 4, sand = Math.random() < 0.035 ? 70 + Math.random() * 60 : 0;
      d[k] = Math.min(255, Math.max(0, d[k] + n * 0.6 + sand * 1.0)); d[k + 1] = Math.min(255, Math.max(0, d[k + 1] + n * 0.75 + sand * 0.92)); d[k + 2] = Math.min(255, Math.max(0, d[k + 2] + n + sand * 0.7)); }
    g.putImageData(id, 0, 0);
    const t = texOf(c); t.anisotropy = 8;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(PDL * 2 + 0.5, PDW * 2 + 0.5), new THREE.MeshStandardMaterial({ map: t, roughness: 0.9, emissive: C('#ffffff'), emissiveMap: t, emissiveIntensity: 0.12, transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 }));
    m.rotation.x = -Math.PI / 2; m.position.y = 0.026; m.renderOrder = 1; m.visible = false; m.userData.noCast = true; scene.add(m); return m; })();
  const padelMats = [], padelWalls = new THREE.Group(); padelWalls.visible = false; scene.add(padelWalls);
  {
    const glassM = new THREE.MeshPhysicalMaterial({ color: C('#d8eef0'), roughness: 0.02, metalness: 0, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }); glassM.userData.env = 1.6; padelMats.push([glassM, 0.13]);
    const edgeM = new THREE.MeshStandardMaterial({ color: C('#6fa39a'), roughness: 0.1, transparent: true, opacity: 0 }); padelMats.push([edgeM, 0.55]);
    const steel = new THREE.MeshStandardMaterial({ color: C('#161617'), roughness: 0.45, metalness: 0.65 }); steel.userData.env = 0.6;
    const lampM = new THREE.MeshBasicMaterial({ color: C('#fff6ea').multiplyScalar(3), transparent: true, opacity: 0 }); padelMats.push([lampM, 1]);
    const add = (m) => { m.userData.noCast = true; padelWalls.add(m); return m; };
    const GT = 0.012 * M_ * 2.4;                                                                   // glass thickness, slightly exaggerated so it reads
    // a glass panel lying in the plane of its wall: `along` is x (side walls) or z (back walls)
    const glass = (cx, cz, w, h, alongX) => { const g = new THREE.Mesh(new THREE.BoxGeometry(alongX ? w : GT, h, alongX ? GT : w), glassM); g.position.set(cx, h / 2, cz); add(g);
      for (const [ew, eh, ox, oy] of [[w, 0.05, 0, h / 2 - 0.025], [w, 0.05, 0, -h / 2 + 0.025], [0.05, h, w / 2 - 0.025, 0], [0.05, h, -w / 2 + 0.025, 0]]) {
        const e = new THREE.Mesh(new THREE.BoxGeometry(alongX ? ew : GT * 1.05, eh, alongX ? GT * 1.05 : ew), edgeM); e.position.set(cx + (alongX ? ox : 0), h / 2 + oy, cz + (alongX ? 0 : ox)); add(e); }
      // stainless clamps where the panel meets its posts
      for (const sgn of [-1, 1]) for (const y of [0.25, h - 0.3]) { const c = new THREE.Mesh(new THREE.BoxGeometry(alongX ? 0.28 : 0.22, 0.32, alongX ? 0.22 : 0.28), steel); c.position.set(cx + (alongX ? sgn * (w / 2) : 0), y, cz + (alongX ? 0 : sgn * (w / 2))); add(c); } };
    const mesh = (cx, cz, w, y0, y1, alongX) => { const h = y1 - y0, m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), nets.fence(w, h, 0.055 * M_, '#2a2a2b')); m.position.set(cx, y0 + h / 2, cz); if (!alongX) m.rotation.y = Math.PI / 2; add(m);
      const a = alongX ? [cx - w / 2, cz] : [cx, cz - w / 2], b = alongX ? [cx + w / 2, cz] : [cx, cz + w / 2];
      struts(padelWalls, [[V3(a[0], y1, a[1]), V3(b[0], y1, b[1]), 0.07], [V3(a[0], y0 + 0.05, a[1]), V3(b[0], y0 + 0.05, b[1]), 0.05]], steel); };
    const post = (x, z, h) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.1 * M_, h, 0.1 * M_), steel); m.position.set(x, h / 2, z); add(m);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.12 * M_, 0.06, 0.12 * M_), steel); cap.position.set(x, h + 0.03, z); add(cap); };
    for (const sx of [-1, 1]) {
      // back wall: five 2 m glass panels (3 m), mesh to 4 m
      for (let k = 0; k < 5; k++) { const z = -PDW + (k + 0.5) * 2 * M_; glass(sx * PDL, z, 2 * M_ - 0.25, 3 * M_, false); }
      mesh(sx * PDL, 0, 2 * PDW, 3 * M_, 4 * M_, false);
      for (let k = 0; k <= 5; k++) post(sx * PDL, -PDW + k * 2 * M_, 4 * M_);
      for (const sz of [-1, 1]) {
        // side walls: 2 m of 3 m glass, then 2 m of 2 m glass (the step), mesh above both
        glass(sx * (PDL - 1 * M_), sz * PDW, 2 * M_ - 0.25, 3 * M_, true); mesh(sx * (PDL - 1 * M_), sz * PDW, 2 * M_, 3 * M_, 4 * M_, true);
        glass(sx * (PDL - 3 * M_), sz * PDW, 2 * M_ - 0.25, 2 * M_, true); mesh(sx * (PDL - 3 * M_), sz * PDW, 2 * M_, 2 * M_, 3 * M_, true);
        post(sx * (PDL - 2 * M_), sz * PDW, 4 * M_); post(sx * (PDL - 4 * M_), sz * PDW, 3 * M_);
        // mesh run toward the net, with a door opening either side of it
        mesh(sx * 3.8 * M_, sz * PDW, 4.4 * M_, 0, 3 * M_, true); post(sx * 1.6 * M_, sz * PDW, 3 * M_); post(sx * 0.6 * M_, sz * PDW, 3 * M_);
      }
    }
    for (const sz of [-1, 1]) mesh(0, sz * PDW, 1.2 * M_, 0, 3 * M_, true);
    // floodlights: four masts on the side posts 4 m from the net, LED heads angled at the court
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const x = sx * 4 * M_, z = sz * (PDW + 0.15 * M_);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05 * M_, 0.06 * M_, 6 * M_, 12), steel); pole.position.set(x, 3 * M_, z); add(pole);
      const head = new THREE.Group(); head.position.set(x, 6 * M_, z - sz * 0.25 * M_); head.rotation.x = sz * 0.7; padelWalls.add(head);
      const hb = new THREE.Mesh(new THREE.BoxGeometry(0.7 * M_, 0.1 * M_, 0.4 * M_), steel); hb.userData.noCast = true; head.add(hb);
      const lf = new THREE.Mesh(new THREE.PlaneGeometry(0.62 * M_, 0.32 * M_), lampM); lf.rotation.x = Math.PI / 2; lf.position.y = -0.052 * M_; head.add(lf);
      const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: C('#fff1df'), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); gl.scale.set(6, 6, 1); gl.position.y = -0.3; head.add(gl); padelMats.push([gl.material, 0.55]);
    }
    // padel net: 10 m, 0.88 m in the middle rising to 0.92 m, black posts at the walls
    { const half = 5.0, top = z => 0.88 + 0.04 * Math.pow(Math.abs(z) / half, 2), n = nets.courtNet(half - 0.05, top, { cell: 0.045 }); n.scale.setScalar(M_); padelWalls.add(n);
      for (const sz of [-1, 1]) post(0, sz * (PDW - 0.06 * M_), 0.95 * M_); }
    padelWalls.traverse(m => { m.userData.noCast = true; });
  }
  const surfLab = [groundLabel('FEDERER', 'GRASS', -CTL / 2, -CTW - 9.1), groundLabel('NADAL', 'CLAY', CTL / 2, -CTW - 9.1, true)];
  const sexLab = [groundLabel('SABALENKA', 'SHORTER & NARROWER', -CTL / 2, -CTW - 9.1, true), groundLabel('KYRGIOS', 'FULL-SIZE HALF', CTL / 2, -CTW - 9.1)];

  // ---------- fireworks: GPU shells (full time over the circuit, touchdown, goal)
  const FW_N = 8, FW_P = LOWQ ? 120 : 260;
  const fwU = { uTime: { value: 0 }, uO: { value: Array.from({ length: FW_N }, () => V3(0, -999, 0)) }, uT0: { value: new Array(FW_N).fill(-99) }, uSp: { value: new Array(FW_N).fill(30) }, uRed: { value: C(RED).multiplyScalar(2.6) }, uWhite: { value: C('#fff3e6').multiplyScalar(2.2) } };
  const fireworks = (() => {
    const n = FW_N * FW_P, dir = new Float32Array(n * 3), sh = new Float32Array(n), rnd = new Float32Array(n);
    for (let i = 0; i < n; i++) { const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, r = Math.sqrt(1 - u * u), m = 0.75 + 0.25 * Math.random(); dir[i * 3] = r * Math.cos(a) * m; dir[i * 3 + 1] = u * m; dir[i * 3 + 2] = r * Math.sin(a) * m; sh[i] = Math.floor(i / FW_P); rnd[i] = Math.random(); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(dir, 3)); g.setAttribute('aSh', new THREE.BufferAttribute(sh, 1)); g.setAttribute('aR', new THREE.BufferAttribute(rnd, 1));
    const m = new THREE.Points(g, new THREE.ShaderMaterial({ uniforms: fwU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `uniform float uTime; uniform vec3 uO[${FW_N}]; uniform float uT0[${FW_N}]; uniform float uSp[${FW_N}]; attribute float aSh; attribute float aR; varying float vA; varying float vR;
        void main(){ int k=int(aSh+0.5); float age=uTime-uT0[k]; vR=aR;
          if(age<0.0||age>3.2){ gl_Position=vec4(2.0,2.0,2.0,1.0); gl_PointSize=0.0; vA=0.0; return; }
          float sp=uSp[k]; vec3 p=uO[k]+position*sp*(1.0-exp(-age*2.2))/2.2; p.y-=4.9*age*age*0.55;
          vA=(1.0-smoothstep(1.4,3.1,age+aR*0.6))*(0.6+0.4*step(0.5,fract(uTime*17.0+aR*9.0))*step(1.2,age)+0.4*(1.0-step(1.2,age)));
          vec4 mv=modelViewMatrix*vec4(p,1.0); gl_PointSize=(3.2+3.0*(1.0-smoothstep(0.0,1.5,age)))*(300.0/-mv.z); gl_Position=projectionMatrix*mv; }`,
      fragmentShader: `uniform vec3 uRed; uniform vec3 uWhite; varying float vA; varying float vR;
        void main(){ vec2 d=gl_PointCoord-0.5; float r=length(d); if(r>0.5) discard; vec3 c=mix(uRed,uWhite,step(0.62,vR)); gl_FragColor=vec4(c,vA*(1.0-r*2.0));
          #include <colorspace_fragment>
        }` }));
    m.frustumCulled = false; m.renderOrder = 8; scene.add(m); return m;
  })();
  let fwSlot = 0, fwNext = 0, tdFired = false, goalFired = false;
  const launch = (x, y, z, sp = 30) => { fwSlot = (fwSlot + 1) % FW_N; fwU.uO.value[fwSlot].set(x, y, z); fwU.uT0.value[fwSlot] = time; fwU.uSp.value[fwSlot] = sp; };

  // ---------- football hero: ball, standee, figure
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(-9, -9);
  const look = { yaw: 0, pitch: 0, ty: 0, tp: 0, drag: false, sx: 0, sy: 0, y0: 0, p0: 0, moved: 0, idle: 9 };
  let hoverObj = null, hoverKey = '', pickDirty = false, lastTarget = 0;
  const pickables = [];
  players.forEach((pl, i) => { pl.disc.userData.pick = { type: 'player', id: i }; pickables.push(pl.disc); });
  const ballTex = (() => { const [c, g] = cnv(512, 256); g.fillStyle = '#f3f2f2'; g.fillRect(0, 0, 512, 256); g.fillStyle = '#1a1918';
    for (let i = 0; i < 12; i++) { const x = (i % 6) * 85 + (Math.floor(i / 6) ? 42 : 0), y = Math.floor(i / 6) * 128 + 64; g.beginPath(); for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2 - Math.PI / 2; g.lineTo(x + Math.cos(a) * 26, y + Math.sin(a) * 22); } g.closePath(); g.fill(); }
    return texOf(c); })();
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.14, 32, 20), new THREE.MeshStandardMaterial({ map: ballTex, roughness: 0.45 }));
  ball.position.set(1.2, 0.14, -1.3); scene.add(ball); ball.userData.pick = { type: 'ball' }; pickables.push(ball);
  const bring = new THREE.Mesh(new THREE.RingGeometry(0.24, 0.3, 40), new THREE.MeshBasicMaterial({ color: C(RED).multiplyScalar(1.4), transparent: true, opacity: 0, depthWrite: false }));
  bring.rotation.x = -Math.PI / 2; bring.position.y = 0.05; scene.add(bring);
  const bv = new THREE.Vector3(); let ballState = 'rest', ballT = 0, goalT = -10;
  const standee = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 1.9), new THREE.MeshBasicMaterial({ map: phTex(380, 760, ['FULL-LENGTH', 'CUT-OUT', 'OF YOU', '', 'photos/walkout.png'], photos.walkout), transparent: true, alphaTest: 0.04, side: THREE.DoubleSide }));
  standee.position.set(0, 0.95, 0.3); scene.add(standee);
  const sshadow = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.9), new THREE.MeshBasicMaterial({ map: glowTex, color: C('#000000'), transparent: true, opacity: 0.7, depthWrite: false }));
  sshadow.rotation.x = -Math.PI / 2; sshadow.position.set(0.25, 0.035, 0.45); scene.add(sshadow);
  let figure = null; const figLight = new THREE.SpotLight(0xfff4ea, 0, 30, 0.32, 0.5, 1.0); figLight.position.set(0.6, 14, -2.2); figLight.target.position.set(0, 0.9, 0.3); scene.add(figLight, figLight.target);
  const figFill = new THREE.PointLight(0xffd9cc, 0, 8, 1.5); figFill.position.set(-3.2, 1.6, -2.8); scene.add(figFill);
  const loadFigure = async () => {
    if (!o.model) return;
    try {
      const [{ GLTFLoader }, { MeshoptDecoder }] = await Promise.all([import('three/examples/jsm/loaders/GLTFLoader.js'), import('three/examples/jsm/libs/meshopt_decoder.module.js')]);
      const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(o.model.url);
      const g = gltf.scene; const bb = new THREE.Box3().setFromObject(g), sz = bb.getSize(new THREE.Vector3());
      g.scale.setScalar((o.model.height || 1.85) / sz.y);
      const bb2 = new THREE.Box3().setFromObject(g), c = bb2.getCenter(new THREE.Vector3());
      const wrap = new THREE.Group(); g.position.set(-c.x, -bb2.min.y, -c.z); wrap.add(g);
      wrap.position.set(standee.position.x, 0, standee.position.z); wrap.rotation.y = o.model.rotY ?? Math.atan2(-5.2 - standee.position.x, -4.6 - standee.position.z);
      g.traverse(m => { if (m.isMesh && m.material) { const mm = m.material; mm.envMapIntensity = 0; if (mm.emissiveMap || mm.emissive) mm.emissiveIntensity = 0.12; if ('roughness' in mm) mm.roughness = Math.max(0.55, mm.roughness ?? 0.6); mm.needsUpdate = true; } });
      wrap.visible = false; scene.add(wrap); figure = wrap;
    } catch (e) { console.warn('figure model failed', e); }
  };
  const kick = () => {
    if (ballState !== 'rest') return;
    const tz = (Math.random() - 0.5) * 8.5, T2 = 2.0;
    bv.set((52.5 - ball.position.x) / T2, (1.1 - 0.14 + 4.9 * T2 * T2) / T2, (tz - ball.position.z) / T2);
    ballState = 'fly'; ballT = 0; o.onKick && o.onKick();
  };
  function stepBall(dt, show) {
    if (!show) { ball.visible = false; bring.material.opacity = 0; if (ballState !== 'rest') { ballState = 'rest'; ball.position.set(1.2, 0.14, -1.3); bv.set(0, 0, 0); } return; }
    ball.visible = true;
    if (ballState === 'rest') { bring.material.opacity = 0.45 + 0.4 * Math.sin(time * 4); bring.scale.setScalar(1 + 0.15 * Math.sin(time * 4)); bring.position.set(ball.position.x, 0.05, ball.position.z); return; }
    bring.material.opacity = 0; ballT += dt;
    for (let k = 0, hh = dt / 4; k < 4; k++) {
      bv.y -= 9.8 * hh; ball.position.addScaledVector(bv, hh);
      if (ball.position.y < 0.14) { ball.position.y = 0.14; bv.y = Math.abs(bv.y) * 0.5; bv.x *= 0.82; bv.z *= 0.82; if (bv.y < 0.7) bv.y = 0; }
      const ax = Math.abs(ball.position.x);
      if (ballState === 'fly' && ax > 52.5 && Math.abs(ball.position.z) < 3.66 && ball.position.y < 2.44) { ballState = 'net'; goalT = time; o.onGoal && o.onGoal(); }
      if (ballState === 'net' && ax > 54.3) { ball.position.x = Math.sign(ball.position.x) * 54.3; bv.x *= -0.12; bv.z *= 0.3; bv.y = Math.min(bv.y, 0); }
      if (ax > 56.8) { ball.position.x = Math.sign(ball.position.x) * 56.8; bv.x *= -0.5; }
      if (Math.abs(ball.position.z) > 38.2) { ball.position.z = Math.sign(ball.position.z) * 38.2; bv.z *= -0.5; }
    }
    ball.rotation.z -= bv.x * dt * 4.5; ball.rotation.x += bv.z * dt * 4.5;
    if (ballT > 4.8) { ballState = 'rest'; ball.position.set(1.2, 0.14, -1.3); bv.set(0, 0, 0); }
  }
  let curId = 'hero', curT = 0;
  const pickOn = pk => {
    if (pk.type === 'ball') return ball.visible && ballState === 'rest';
    if (pk.type === 'player') return curId === 'nfl' && curT > CH.XI[0] && curT < CH.XI[1];
    return false;
  };
  const onDown = e => { if (e.button > 0) return; look.drag = true; look.sx = e.clientX; look.sy = e.clientY; look.moved = 0; look.y0 = look.ty; look.p0 = look.tp; };
  const onMove2 = e => {
    ndc.set(e.clientX / W * 2 - 1, -(e.clientY / H) * 2 + 1); pickDirty = true;
    if (look.drag) { const dx = e.clientX - look.sx, dy = e.clientY - look.sy; look.moved = Math.max(look.moved, Math.hypot(dx, dy)); if (look.moved > 6) { look.ty = clamp(look.y0 + dx * 0.0035, -1.1, 1.1); look.tp = clamp(look.p0 + dy * 0.0028, -0.45, 0.45); look.idle = 0; } }
  };
  const onUp = () => { if (look.drag && look.moved <= 6 && hoverObj) { const pk = hoverObj.userData.pick; if (pk.type === 'ball') kick(); o.onPick && o.onPick(pk); } look.drag = false; };
  canvas.addEventListener('pointerdown', onDown); window.addEventListener('pointermove', onMove2, { passive: true }); window.addEventListener('pointerup', onUp);
  canvas.style.touchAction = 'pan-y'; canvas.style.cursor = 'grab';

  // ---------- post (v13 stack: AO, floodlight shafts, streaks, bloom, lens, grade)
  let post = null;
  if (!LOWQ) try { const { createPost } = await import('./post.js'); post = createPost(THREE, renderer, scene, camera); }
  catch (e) { console.warn('post unavailable', e); post = null; }
  // night-stadium reflection environment: dark dome, ring of floodlight panels, warm horizon glow
  try {
    const pm = new THREE.PMREMGenerator(renderer), es = new THREE.Scene();
    es.add(new THREE.Mesh(new THREE.SphereGeometry(60, 32, 16), new THREE.MeshBasicMaterial({ color: C('#070606'), side: THREE.BackSide })));
    const lampM = new THREE.MeshBasicMaterial({ color: C('#fff1e0').multiplyScalar(14), side: THREE.DoubleSide });
    for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 + 0.2, p = new THREE.Mesh(new THREE.PlaneGeometry(9, 4), lampM); p.position.set(Math.cos(a) * 45, 20 + (i % 2) * 6, Math.sin(a) * 45); p.lookAt(0, 0, 0); es.add(p); }
    const glow = new THREE.Mesh(new THREE.CylinderGeometry(50, 50, 8, 48, 1, true), new THREE.MeshBasicMaterial({ color: C('#a0603c').multiplyScalar(0.8), side: THREE.BackSide })); glow.position.y = 3; es.add(glow);
    const fl = new THREE.Mesh(new THREE.CircleGeometry(55, 32), new THREE.MeshBasicMaterial({ color: C('#1d2016') })); fl.rotation.x = -Math.PI / 2; fl.position.y = -6; es.add(fl);
    scene.environment = pm.fromScene(es, 0.03).texture; pm.dispose();
  } catch (e) {}


  // ---------- camera choreography
  const heroKeys = [
    { t: 0.00, pos: [0, 1.7, 126], tgt: [0, 1.65, 90], fov: 64 }, { t: 0.17, pos: [0, 1.7, 82], tgt: [0, 1.65, 40], fov: 62 },
    { t: 0.34, pos: [0, 1.72, 47.5], tgt: [0, 1.6, 10], fov: 58 }, { t: 0.40, pos: [0, 2.4, 35], tgt: [0, 1.2, 0], fov: 56 },
    { t: 0.48, pos: [-14, 7, 30], tgt: [0, 0, 0], fov: 55 }, { t: 0.57, pos: [-50, 25, 34], tgt: [0, 8, 0], fov: 54 },
    { t: 0.65, pos: [-76, 34, 6], tgt: [0, 13, 0], fov: 54 }, { t: 0.76, pos: [-46, 25, -50], tgt: [0, 0, 0], fov: 50 },
    { t: 0.88, pos: [-6, 7, -30], tgt: [0, 2, 0], fov: 48 }, { t: 1.00, pos: [-5.2, 1.55, -4.6], tgt: [5, 1.2, 2.6], fov: 46 },
  ];
  function spline(k, t) {
    if (t <= k[0].t) return k[0]; const last = k[k.length - 1]; if (t >= last.t) return last;
    let i = 0; while (t > k[i + 1].t) i++;
    const u = (t - k[i].t) / (k[i + 1].t - k[i].t), a = k[Math.max(i - 1, 0)], b = k[i], c = k[i + 1], d = k[Math.min(i + 2, k.length - 1)];
    return { pos: crv(a.pos, b.pos, c.pos, d.pos, u), tgt: crv(a.tgt, b.tgt, c.tgt, d.tgt, u), fov: b.fov + (c.fov - b.fov) * ss(u) };
  }
  function lin(k, t) {
    if (t <= k[0].t) return k[0]; const last = k[k.length - 1]; if (t >= last.t) return last;
    let i = 0; while (t > k[i + 1].t) i++;
    const u = ss((t - k[i].t) / (k[i + 1].t - k[i].t)), L = (a, b) => a.map((v, j) => v + (b[j] - v) * u);
    return { pos: L(k[i].pos, k[i + 1].pos), tgt: L(k[i].tgt, k[i + 1].tgt), fov: k[i].fov + (k[i + 1].fov - k[i].fov) * u };
  }
  const CAM = {};
  CAM.hero = t => spline(heroKeys, t);
  const rightsK = [{ ...heroKeys[heroKeys.length - 1], t: 0 }, { t: 0.07, pos: [0, 30, 0.6], tgt: [0, 0, 0], fov: 40 }, { t: 0.94, pos: [0, 33, 0.6], tgt: [0, 0, 0], fov: 40 }, { t: 1, pos: [0, 36, 0.6], tgt: [0, 0, 0], fov: 40 }];
  CAM.rights = t => lin(rightsK, t);
  const bballK = [{ t: 0, pos: [0, 34, 57], tgt: [0, 40, 0], fov: 46 }, { t: CH.BEATS[1], pos: [0, 33, 50], tgt: [0, 40.5, 0], fov: 46 }, { t: CH.TAC[0] + 0.02, pos: [0, 96, 2], tgt: [0, 0, 0], fov: 42 }, { t: 1, pos: [0, 92, 2], tgt: [0, 0, 0], fov: 42 }];
  CAM.bball = t => lin(bballK, t);
  const nflK = [{ t: 0, pos: [DX[0] - 34, 18, 26], tgt: [DX[0] + 8, 0, 0], fov: 50 }];
  { const dw = (CH.DRIVE[1] - CH.DRIVE[0]) / DX.length;
    DX.forEach((x, k) => { const ps = k === DX.length - 1 ? { pos: [x - 22, 8.5, 12], tgt: [x + 2, 2.6, 0], fov: 50 } : { pos: [x - 15, 6.5, 8], tgt: [x + 16, 2, -1], fov: 48 }; nflK.push({ t: CH.DRIVE[0] + k * dw + dw * 0.3, ...ps }, { t: CH.DRIVE[0] + (k + 1) * dw - 0.004, ...ps }); });
  }
  // the huddle: one steady overhead on the whole play. Wide screens keep the right-hand panel clear; tall ones keep the bottom sheet clear.
  const huddlePose = t => { const a = W / H, u = clamp((t - CH.XI[0]) / (CH.XI[1] - CH.XI[0])), h = 84 - 4 * u;
    if (a >= 1.25) { const cx = -11.5 + 0.3 * h * Math.tan(20 * Math.PI / 180) * a; return { pos: [cx, h, 4], tgt: [cx, 0, 1], fov: 40 }; }
    return { pos: [-15, 58 - 3 * u, 12], tgt: [-15, 0, 11], fov: 40 }; };
  const mixPose = (A, B, u) => { const L = (p, q) => p.map((v, j) => v + (q[j] - v) * u); return { pos: L(A.pos, B.pos), tgt: L(A.tgt, B.tgt), fov: A.fov + (B.fov - A.fov) * u }; };
  CAM.nfl = t => { const t0 = CH.XI[0] - 0.045; if (t < t0) return lin(nflK, t); const hp = huddlePose(Math.max(t, CH.XI[0])); return t >= CH.XI[0] ? hp : mixPose(lin(nflK, t0), hp, ss((t - t0) / (CH.XI[0] - t0))); };
  const OVH = { pos: [0, 96, 20], tgt: [0, 0, 0], fov: 44 };
  const tenK = [{ t: 0, pos: [0, 26, 44], tgt: [0, 6, 0], fov: 52 }, { t: CH.SURF[0] + 0.03, ...OVH }, { t: CH.PADEL[0] + 0.02, ...OVH }, { t: CH.PADEL[0] + 0.09, pos: [0, 44, 76], tgt: [0, 0, 6], fov: 46 }, { t: CH.PADEL[1] - 0.03, pos: [16, 42, 72], tgt: [0, 0, 6], fov: 46 }, { t: CH.FANS[0], ...OVH }, { t: 1, pos: [0, 90, 16], tgt: [0, 0, 0], fov: 44 }];
  CAM.tennis = t => lin(tenK, t);
  const rAt3 = (s, y) => { const [x, z] = raceX.racingAt(s); return [x, y, z]; };
  const chase = s => ({ pos: rAt3(s + 4.5, 3.1), tgt: rAt3(s + 30, 0.9), fov: 58 });
  const gridPose = { pos: at3(-68, 0, 6.8), tgt: at3(-4, 0, 0.6), fov: 52 };
  const LAPB = [-24, ...cc.apex.map(a => a.s), cc.len - 4];
  const lapS = t => { const [a, b] = CH.LAP, f = clamp((t - a) / (b - a)) * (LAPB.length - 1), k = Math.min(LAPB.length - 2, Math.floor(f)), u = f - k; return LAPB[k] + (LAPB[k + 1] - LAPB[k]) * ss(clamp(u / 0.8)); };
  const pitPose = k => { const s = 20 + (k - 1) * 21; return { pos: at3(s - 5, 12.5, 3.6), tgt: at3(s + 1, 26, 2.6), fov: 50 }; };
  const pitK = [{ ...chase(cc.len - 4), t: CH.LAP[1] }];
  { const w = (CH.PIT[1] - CH.PIT[0]) / 3; for (let k = 0; k < 3; k++) pitK.push({ t: CH.PIT[0] + k * w + 0.004, ...pitPose(k) }, { t: CH.PIT[0] + (k + 1) * w - 0.004, ...pitPose(k) }); pitK.push({ t: 1, ...pitPose(2) }); }
  CAM.race = t => t <= CH.LAP[0] ? gridPose : t <= CH.LAP[1] ? chase(lapS(t)) : lin(pitK, t);
  const eR = SPORTS.race.ext;
  const ftK = [{ ...pitPose(2), t: 0 }, { t: 0.4, pos: [-eR * 0.3, eR * 1.0, eR * 0.85], tgt: [0, 0, 0], fov: 46 }, { t: 1, pos: [-eR * 0.42, eR * 1.3, eR * 1.05], tgt: [0, 0, 0], fov: 48 }];
  CAM.ft = t => lin(ftK, t);
  Object.keys(XIDX).forEach(x => {
    const k = XIDX[x], eA = SPORTS[ORDER[k - 1]].ext, eB = SPORTS[ORDER[k]].ext;
    const hiA = { pos: [-eA * 0.55, eA * 1.2, eA * 0.95], tgt: [0, 0, 0], fov: 46 }, hiB = { pos: [eB * 0.5, eB * 1.15, eB * 0.92], tgt: [0, 0, 0], fov: 46 };
    let keys = null; CAM[x] = t => { if (!keys) keys = [{ ...CAM[PREV[x]](1), t: 0 }, { ...hiA, t: 0.24 }, { ...hiB, t: 0.78 }, { ...CAM[NEXT[x]](0), t: 1 }]; return spline(keys, t); };
  });

  // ---------- state
  const perf = { ema: 1 / 60, t: 0, last: 0 };
  let W = 1, H = 1, target = 0, p = 0, raf = 0, last = performance.now(), time = 0, ledOff = 0;
  let ledCur = firstKey, ledWipeStart = -10; const camS = { init: false, p: [0, 0, 0], t: [0, 0, 0], f: 50 };
  const ptr = { x: 0, y: 0, sx: 0, sy: 0 };
  const onMove = e => { ptr.x = e.clientX / W * 2 - 1; ptr.y = e.clientY / H * 2 - 1; };
  window.addEventListener('pointermove', onMove, { passive: true });
  function resize() { W = window.innerWidth; H = window.innerHeight; renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix(); if (post) post.setSize(W, H); }
  window.addEventListener('resize', resize); resize();
  const ledP = (o.ledPlan || []).filter(([id]) => SEG[id]).map(([id, t, k]) => [SEG[id].a + t * (SEG[id].b - SEG[id].a), k]).sort((a, b) => a[0] - b[0]);
  const setLed = key => { if (!ledTex[key] || key === ledCur) return; allBoards.forEach(b => { b.u.uA.value = ledTex[ledCur].tex; b.u.uAspA.value = ledTex[ledCur].asp; b.u.uB.value = ledTex[key].tex; b.u.uAspB.value = ledTex[key].asp; }); ledCur = key; ledWipeStart = time; };
  const dimFor = (id, t) => {
    if (id === 'rights') return K(t, [[0, 0.38], [0.07, 0.6]]);
    if (id === 'bball') return K(t, [[0, 0.72], [CH.BEATS[1], 0.72], [CH.TAC[0], 0.5], [0.96, 0.5], [1, 0.85]]);
    if (id === 'nfl') return K(t, [[0, 0.9], [CH.DRIVE[1], 0.9], [CH.XI[0], 0.6], [CH.XI[1], 0.6], [1, 0.9]]);
    if (id === 'tennis') return K(t, [[0, 0.8], [CH.SURF[0] + 0.03, 0.45], [0.95, 0.45], [1, 0.85]]);
    if (id === 'ft') return K(t, [[0, 0.95], [1, 0.7]]);
    return 0.95;
  };
  let ledWipe = 1;
  function driveVenue(Vn, mode, t, dim) {
    const vis = mode !== 'off'; Vn.root.visible = vis; Vn.cones.forEach(c => { c.m.visible = vis; }); if (Vn.crowd) Vn.crowd.visible = vis;
    if (!vis) { Vn.lamps.forEach(L => { L.on = 0; }); return 0; }
    Vn.stands.forEach((st, k) => {
      let f = 1;
      if (mode === 'hero') f = RO(t, 0.41 + k * 0.02, 0.49 + k * 0.02);
      else if (mode === 'out') f = 1 - R(t, 0.05 + k * 0.03, 0.28 + k * 0.03);
      else if (mode === 'in') f = R(t, 0.38 + k * 0.04, 0.66 + k * 0.04);
      st.g.position.y = -st.h * (1 - f); st.g.visible = f > 0.002;
    });
    Vn.fix.forEach(fx => {
      let f = 1;
      if (mode === 'hero') f = RO(t, 0.5, 0.54);
      else if (mode === 'out') f = 1 - R(t, 0.02, 0.14);
      else if (mode === 'in') f = fx.kind === 'drop' ? clamp((t - fx.t0) / 0.13) : fx.lin ? clamp((t - fx.t0) / (fx.dur || 0.1)) : RO(t, fx.t0, fx.t0 + (fx.dur || 0.1));
      const ob = fx.o;
      if (fx.kind === 'drop') { const b = mode === 'in' ? bounce(f) : f; ob.position.y = fx.y0 + fx.h * (1 - b); ob.visible = mode === 'in' ? t > fx.t0 : f > 0.002; }
      else if (fx.kind === 'growY') { ob.scale.y = Math.max(0.0001, f); ob.visible = f > 0.002; }
      else if (fx.kind === 'grow') { ob.scale.setScalar(Math.max(0.0001, f)); ob.visible = f > 0.002; }
      else if (fx.kind === 'fade') fx.set(f);
    });
    let sum = 0;
    Vn.lamps.forEach(L => {
      let rise = 1, a0 = -1, on = 1;
      if (mode === 'hero') { rise = RO(t, 0.48 + L.s0 * 0.06, 0.55 + L.s0 * 0.06); a0 = 0.58 + L.s0 * 0.072; }
      else if (mode === 'out') { on = 1 - flick(t, 0.01 + L.s0 * 0.1, 0.01); rise = 1 - R(t, 0.12 + L.s0 * 0.06, 0.34 + L.s0 * 0.06); }
      else if (mode === 'in') { rise = RO(t, 0.54 + L.s0 * 0.12, 0.66 + L.s0 * 0.12); a0 = 0.72 + L.s0 * 0.16; }
      if (a0 >= 0) on = flick(t, a0 + 0.004);
      if (L.g) L.g.position.y = L.y0 - L.H * (1 - rise);
      L.rowsM.forEach((m, r) => { const v = (a0 >= 0 ? flick(t, a0 + r * 0.003) : on) * dim; m.color.setRGB(0.012 + v * 3.2, 0.011 + v * 3.0, 0.01 + v * 2.7); });
      L.halo.material.opacity = on * 0.9 * dim; L.on = on * dim; sum += L.on;
    });
    Vn.cones.forEach(c => { c.m.material.uniforms.uOp.value = c.lamp.on * c.k; });
    const crw = mode === 'hero' ? R(t, 0.75, 0.85) : mode === 'out' ? 1 - R(t, 0, 0.12) : mode === 'in' ? R(t, 0.86, 1) : 1;
    if (Vn.crowd) { const u = Vn.crowd.material.uniforms; u.uOp.value = crw * 0.45; u.uTime.value = time; }
    const bon = mode === 'hero' ? R(t, 0.72, 0.77) : mode === 'out' ? 1 - R(t, 0, 0.1) : mode === 'in' ? R(t, 0.84, 0.95) : 1;
    Vn.boards.forEach(b => { b.u.uOp.value = b.ribbon ? bon * 0.95 : bon; b.u.uOff.value = ledOff; b.u.uMix.value = ledWipe; });
    return Vn.lamps.length ? sum / Vn.lamps.length : 0;
  }
  const _v = new THREE.Vector3(), _r = new THREE.Vector3(), _u = new THREE.Vector3(), _w2 = new THREE.Vector3(), _c0 = new THREE.Vector3(), _c1 = new THREE.Vector3();
  const _vp = new THREE.Matrix4(), prevVP = new THREE.Matrix4();

  function update(dt, vel) {
    const sg = segAt(p), id = sg.id, t = LT(id, p); curId = id; curT = t;
    const xi = XIDX[id], A = xi ? xi - 1 : VI[id], B = xi ? xi : VI[id], xt = xi ? t : -1, h = id === 'hero' ? t : 1, hero = id === 'hero';
    // venues
    let litA = 0, litB = 0;
    venues.forEach((Vn, i) => {
      let mode = 'off', dim = 0.95, vt = t;
      if (xi) { if (i === A && xt < 0.45) { mode = 'out'; dim = dimFor(PREV[id], 1); } else if (i === B && xt > 0.36) { mode = 'in'; dim = dimFor(NEXT[id], 0); } }
      else if (i === A) { mode = hero ? 'hero' : 'on'; dim = hero ? 1 - 0.62 * R(h, 0.7, 0.76) : dimFor(id, t); }
      const l = driveVenue(Vn, mode, vt, dim);
      if (i === A) litA = l; if (i === B) litB = l;
    });
    const w = xi ? R(xt, 0.2, 0.6) : 0, sa = SPORTS[ORDER[A]], sb = SPORTS[ORDER[B]];
    const lit = xi ? (xt < 0.5 ? litA : litB) : litA;
    surfU.uA.value = A; surfU.uB.value = B; surfU.uMix.value = w; surfU.uRmax.value = Math.max(sa.ext, sb.ext) * 1.7;
    surfU.uLit.value = lit; surfU.uLR.value = lerp(sa.lr, sb.lr, w); surfU.uAmb.value = 0.015 + (xi ? 0.07 * Math.sin(xt * Math.PI) : 0);
    trackU.uLit.value = lit;
    { const on = xi && w > 0.001 && w < 0.999, Rr = w * surfU.uRmax.value; curtain.visible = on;
      if (on) { curtain.scale.set(Rr, 6 + Math.max(sa.ext, sb.ext) * 0.28, Rr / 1.3); curtainU.uOp.value = 0.32 * Math.sin(w * Math.PI); curtainU.uTime.value = time; } }
    const fd = lerp(sa.fog, sb.fog, xi ? R(xt, 0.15, 0.85) : 0); scene.fog.density = fd; fogU.uFogDen.value = fd;
    const mainV = venues[xi && xt > 0.5 ? B : A]; placeSpots(mainV);
    spots.forEach((s, i) => { const k = mainV.keys[i]; s.intensity = k ? (k.lamp ? k.lamp.on : lit) * mainV.spotK : 0; });
    skyU.uGlow.value = lit; skyU.uTime.value = time; skyU.uStars.value = mainV.id === 'basketball' ? 0 : 1; coneTime.value = time; hemi.intensity = 0.05 + 0.22 * lit;
    // lines
    // tennis: the lines glide into the Battle of the Sexes court and back out before the next venue
    // then on into a padel court, which is what the next transition starts from
    const bos = id === 'tennis' ? R(t, CH.SEXES[0] + 0.01, CH.SEXES[0] + 0.08) : 0, pdl = id === 'tennis' ? R(t, CH.PADEL[0], CH.PADEL[0] + 0.07) : 0;
    if (pdl > 0) { setPair('tennisBOS', 'padel'); lineU.uMorph.value = pdl; }
    else if (bos > 0) { setPair('tennis', 'tennisBOS'); lineU.uMorph.value = bos; }
    else { setPair(ORDER[A] === 'tennis' && xi ? 'padel' : ORDER[A], ORDER[B]); lineU.uMorph.value = xi ? clamp((xt - 0.14) / 0.62) : 0; }
    lineU.uLift.value = xi ? 1 + Math.max(sa.ext, sb.ext) * 0.022 : 0;
    lineU.uReveal.value = hero ? R(h, 0.38, 0.52) * 1.001 : 1.001;
    const red = hero ? 1 - R(h, 0.645, 0.7) : xi ? R(xt, 0.1, 0.2) * (1 - R(xt, 0.8, 0.95)) : 0;
    lineU.uColor.value.copy(LWHITE).lerp(LRED, red);
    // tunnel + walk-out (football hero)
    tunnel.visible = hero;
    const cz = camera.position.z;
    mouth.visible = hero && cz > 43.2; mouth.material.opacity = (cz > 43.2 ? clamp((cz - 44) / 22) * 0.95 : 0) * (h < 0.36 && cz > 58 ? 1 - 0.75 * clamp((80 - cz) / 6) : 1);
    const blackT = hero && h < 0.36 ? clamp((80 - cz) / 6) : 0;
    strips.forEach(st => { const off = blackT > 0 && (st.z > 84 || blackT * 1.25 > (84 - st.z) / 40) ? 1 : 0; const v = 1 - off * 0.97; st.sm.color.setRGB(2.2 * v, 2.07 * v, 1.93 * v); st.rm.opacity = 0.32 * v; });
    tLights.forEach(l => { l.intensity = hero && h < 0.42 ? 3.2 * (1 - blackT) : 0; });
    gates.forEach(gt => {
      const dd = cz - gt.z; let op = ss((dd - 0.8) / 3.2) * (1 - ss((dd - 20) / 12)); if (!hero || dd < -0.5) op = 0;
      if (gt.kind === 'care') op *= ss((blackT - 0.4) * 2);
      const near = gt.kind !== 'care' && dd > 0 && dd < 15 && hero;
      if (near) { const f = Math.sin(time * 57 + gt.z) * Math.sin(time * 21 + gt.z * 0.3); op *= f > -0.2 ? 1 : 0.55; gt.wp.position.x = (Math.random() - 0.5) * 0.07 * (1 - dd / 15); } else gt.wp.position.x = 0;
      gt.wm.opacity = op; gt.wp.visible = op > 0.002;
      gt.fm.color.copy(gt.base).multiplyScalar(gt.kind === 'care' ? 0.1 + op * 1.2 : near ? 0.5 + 0.8 * Math.max(0, Math.sin(time * 38 + gt.z)) : 0.06);
    });
    const spot = hero ? R(h, 0.7, 0.75) : id === 'rights' ? 1 - R(t, 0, 0.07) : 0;
    spotCone.visible = spot > 0.001; spotCone.material.uniforms.uOp.value = spot * 0.32;
    dust.visible = spot > 0.001; dust.material.uniforms.uOp.value = spot * 0.9; dust.material.uniforms.uTime.value = time;
    // LED plan
    let key = firstKey; for (const [q, k] of ledP) if (p >= q) key = k; if (time - goalT < 4.5 && ledTex.goal) key = 'goal'; setLed(key);
    ledOff = (ledOff + dt * (1.2 + vel * 90)) % 100000; ledWipe = ss((time - ledWipeStart) / 0.9);
    // rights badge
    if (plate) {
      const op = id === 'rights' ? R(t, 0, 0.06) * (1 - R(t, 0.94, 1)) : 0, u = plate.material.uniforms; u.uOp.value = op; plate.visible = op > 0.001;
      if (op > 0.001) { const n = plateTex.length, [r0, r1] = CH.RR, f = clamp((t - r0) / (r1 - r0)) * n, idx = Math.min(n - 1, Math.floor(f)), loc = f - idx;
        if (idx === 0) { u.uA.value = plateTex[0]; u.uB.value = plateTex[0]; u.uMix.value = 1; } else { u.uA.value = plateTex[idx - 1]; u.uB.value = plateTex[idx]; u.uMix.value = ss(loc / 0.3); } }
    }
    // jumbotron (flies up into the rafters for the overhead playbook)
    if (jumbo && id === 'bball') jumbo.position.y = 13 + 21 * R(t, CH.BEATS[1], CH.TAC[0]);
    if (jumbo && id === 'x2' && xt < 0.45) jumbo.position.y = 34 + 16 * R(xt, 0.02, 0.14);
    const sb2 = id === 'bball' ? K(t, [[0, 0.3], [0.04, 1], [CH.BEATS[1], 1], [CH.TAC[0], 0.35], [1, 0.35]]) : id === 'x1' ? 0.3 * R(xt, 0.8, 0.95) : id === 'x2' ? 0.35 * (1 - R(xt, 0, 0.1)) : 0;
    screenMat.color.setScalar(sb2 * 1.1);
    if (sb2 > 0.01) {
      let beat = 'idle', bl = 0;
      if (id === 'bball' && t >= CH.BEATS[0] && t < CH.BEATS[1]) { const f = (t - CH.BEATS[0]) / (CH.BEATS[1] - CH.BEATS[0]) * 7; beat = Math.min(6, Math.floor(f)); bl = f - beat; }
      else if (id === 'x1' || (id === 'bball' && t < CH.BEATS[0])) { beat = 0; bl = 0.1 + 0.25 * (id === 'bball' ? clamp(t / CH.BEATS[0]) : 0); }
      const sig = `${beat}|${bl.toFixed(3)}`, live = typeof beat === 'number' && sb2 > 0.6;
      if (sig !== scrSig || time - scrT > (live ? 0.05 : 0.25)) { scrSig = sig; scrT = time; drawScreen(scrG, SW, SHh, beat, bl, time, sdata); scrTex.needsUpdate = true; }
    }
    // playbook
    const tb = id === 'bball' ? R(t, CH.TAC[0], CH.TAC[0] + 0.05) * (1 - R(t, 0.96, 1)) : 0;
    tac.visible = !o.flatTactics && tb > 0.001; tac.material.opacity = tb;
    if (tac.visible) { const r = R(t, CH.TAC[0] + 0.04, CH.TAC[1]); if (Math.abs(r - tacLast) > 0.002 || (r === 1 && tacLast !== 1)) { drawTactics(tacG, TW, TH, r, o.screenData || {}); tacTex.needsUpdate = true; tacLast = r; } }
    // the drive
    { const on = id === 'nfl' ? R(t, 0, CH.DRIVE[0]) * (1 - R(t, CH.DRIVE[1], CH.DRIVE[1] + 0.03)) : 0, nS = DX.length;
      const f = clamp((t - CH.DRIVE[0]) / (CH.DRIVE[1] - CH.DRIVE[0])) * nS, k = Math.min(nS - 1, Math.floor(f)), loc = f - k;
      const xp = k ? DX[k - 1] : DX[0] - 12, xl = xp + (DX[k] - xp) * ss(loc / 0.3);
      fdLine.visible = on > 0.001; fdLine.material.opacity = on * 0.95; fdLine.position.x = Math.min(xl, 45.72);
      pigskin.visible = on > 0.001; pigskin.position.x = xl - 1.2; pigskin.position.y = 0.16 + Math.max(0, Math.sin(clamp(loc / 0.3) * Math.PI)) * 6 * (k ? 1 : 0); pigskin.rotation.z = -clamp(loc / 0.3) * Math.PI * 4;
      drivePlates.forEach((pl, i) => { const a = i === k ? on * RO(loc, 0.22, 0.4) * (1 - R(loc, 0.94, 1)) : 0; pl.grp.visible = a > 0.001; pl.mats.forEach(m => { m.opacity = a; }); pl.grp.position.y = 4.6 - (1 - ss(a)) * 7.5; }); }
    { const on = id === 'nfl' ? R(t, CH.XI[0] - 0.01, CH.XI[0] + 0.015) * (1 - R(t, CH.XI[1], CH.XI[1] + 0.02)) : 0; play.visible = on > 0.001; play.material.opacity = on;
      if (play.visible) { const n = routes.length, f = clamp((t - CH.XI[0]) / (CH.XI[1] - CH.XI[0])) * n, step = Math.min(n - 1, Math.floor(f)), u = Math.min(1, f - step), key = `${step}|${Math.round(u * 40)}|${highlight}`;
        if (key !== playKey) { drawPlay(step, u, highlight === step ? -1 : highlight); playTex.needsUpdate = true; playKey = key; } } }
    players.forEach((pl, i) => {
      const s = id === 'nfl' ? RO(t, CH.XI[0] - 0.03 + i * 0.002, CH.XI[0] - 0.015 + i * 0.002) * (1 - R(t, CH.XI[1], CH.XI[1] + 0.02)) : 0;
      const hi = highlight === i; pl.g.visible = s > 0.001; pl.g.scale.setScalar(Math.max(0.0001, s * (hi ? 1.28 : 1)));
      pl.disc.material.map = hi ? pl.t1 : pl.t0; pl.ring.material.opacity = hi ? 1 : 0.55 + 0.25 * Math.sin(time * 2 + i);
    });
    // tennis
    {
      const pv = id === 'tennis' ? R(t, CH.PADEL[0] + 0.03, CH.PADEL[0] + 0.1) : id === 'x4' ? 1 - R(xt, 0.04, 0.28) : 0;
      if (venueX.tennis && pv > 0.35) { venueX.tennis.net.visible = false; venueX.tennis.kit.forEach(k => { k.visible = false; }); }
      turf.visible = pv > 0.001; turf.material.opacity = pv; padelWalls.visible = pv > 0.001; padelWalls.scale.y = Math.max(0.0001, ss(pv)); padelMats.forEach(([m, o]) => { m.opacity = o * pv; });
      const cl = id === 'tennis' ? R(t, CH.SURF[0] + 0.01, CH.SURF[0] + 0.06) * (1 - R(t, CH.SURF[1] - 0.03, CH.SURF[1])) : 0;
      clay.visible = cl > 0.001; clay.material.opacity = cl; surfLab.forEach(m => { m.visible = cl > 0.001; m.material.opacity = R(cl, 0.5, 1); });
      const sx = id === 'tennis' ? R(t, CH.SEXES[0] + 0.06, CH.SEXES[0] + 0.1) * (1 - R(t, CH.SEXES[1] - 0.03, CH.SEXES[1] + 0.01)) : 0;
      cut.visible = sx > 0.001; cut.material.opacity = sx * 0.9; sexLab.forEach(m => { m.visible = sx > 0.001; m.material.opacity = sx; });
      if (fans) { const u = fans.material.uniforms, fo = id === 'tennis' ? R(t, CH.FANS[0] - 0.03, CH.FANS[0]) * (1 - R(t, 0.97, 1)) : 0; fans.visible = fo > 0.001; u.uOp.value = fo; u.uT.value = id === 'tennis' ? R(t, CH.FANS[0], CH.FANS[1]) : 0; u.uTime.value = time; } }
    // race: start lights, apex flashes, garages
    { const rc = id === 'race';
      startM.forEach((m, k) => { const on = rc && t > 0.005 + k * 0.011 && t < 0.066 ? 1 : 0; m.color.copy(on ? C(RED).multiplyScalar(2.4) : C('#1a0a08')); });
      const s = rc && t > CH.LAP[0] && t < CH.LAP[1] ? lapS(t) : -999;
      kerbs.forEach((kb, k) => { const d = Math.abs(s - kb.s), a = rc ? Math.max(0, 1 - d / 40) : 0; kb.km.emissiveIntensity = a * (0.6 + 0.3 * Math.sin(time * 9)); signs[k].color.setScalar(0.5 + a * 0.7); });
      const pf = rc ? clamp((t - CH.PIT[0]) / (CH.PIT[1] - CH.PIT[0])) * 3 : -1, pk = Math.min(2, Math.floor(pf)), pon = rc ? R(t, CH.PIT[0] - 0.02, CH.PIT[0]) : 0;
      kitLED.forEach((m, k) => { m.color.setScalar(0.18 + (k === pk ? pon * 0.5 : 0)); });
      if (raceX && vR.root.visible) raceX.update({ rc, t, LAP: CH.LAP, lapS, time }); }
    venueX.update({ camera, fdX: fdLine.position.x, driveOn: fdLine.visible, time, goalT, ballX: ball.position.x, ballZ: ball.position.z });
    const bloomK = 0.42 + 0.25 * lit + 0.2 * spot + (xi ? 0.08 * Math.sin(xt * Math.PI) : 0);
    // fireworks: full time over the circuit, a salvo for the touchdown and for a goal
    fwU.uTime.value = time;
    if (id === 'ft' && t > 0.2 && time > fwNext) { fwNext = time + 0.25 + Math.random() * 0.4; const e = SPORTS.race.ext; launch((Math.random() - 0.5) * e * 0.9, 45 + Math.random() * 55, (Math.random() - 0.5) * e * 0.6, 60 + Math.random() * 30); }
    if (id === 'nfl') { const nS = DX.length, f = clamp((t - CH.DRIVE[0]) / (CH.DRIVE[1] - CH.DRIVE[0])) * nS; const td = f >= nS - 1 + 0.32 && f < nS; if (td && !tdFired) { tdFired = true; for (let k = 0; k < 4; k++) setTimeout(() => launch(50 + (Math.random() - 0.5) * 8, 26 + Math.random() * 14, (Math.random() - 0.5) * 40, 18 + Math.random() * 8), k * 260); } if (!td && f < nS - 1) tdFired = false; }
    if (time - goalT < 0.05 && !goalFired) { goalFired = true; for (let k = 0; k < 5; k++) setTimeout(() => launch(Math.sign(ball.position.x || 1) * (40 + Math.random() * 20), 40 + Math.random() * 25, (Math.random() - 0.5) * 60, 28), k * 220); } else if (time - goalT > 1) goalFired = false;
    // interaction
    stepBall(dt, (hero && h > 0.74) || (id === 'rights' && t < 0.05));
    { const sv = (hero && h > 0.7) || (id === 'rights' && t < 0.06); standee.visible = sv && !figure; sshadow.visible = sv;
      if (figure) { figure.visible = sv; figLight.intensity = sv ? 14 * spot : 0; figFill.intensity = sv ? 1.2 * spot : 0; }
      if (sv) { standee.rotation.y = Math.atan2(camera.position.x - standee.position.x, camera.position.z - standee.position.z); standee.material.color.setScalar(0.18 + 0.9 * spot); sshadow.material.opacity = 0.7 * spot; } }
    if (pickDirty || hoverObj) {
      pickDirty = false; ray.setFromCamera(ndc, camera);
      const vis = pickables.filter(m => { let q = m; while (q) { if (!q.visible) return false; q = q.parent; } return pickOn(m.userData.pick); });
      const hit = vis.length ? ray.intersectObjects(vis, false)[0] : null; hoverObj = hit ? hit.object : null;
      const pk = hoverObj ? hoverObj.userData.pick : null, hk = pk ? pk.type + (pk.id ?? '') : '';
      if (hk !== hoverKey) { hoverKey = hk; o.onHover && o.onHover(pk); }
      canvas.style.cursor = hoverObj ? 'pointer' : look.drag ? 'grabbing' : 'grab';
    }
    if (Math.abs(target - lastTarget) > 0.0004) { lastTarget = target; if (!look.drag) look.idle = 9; }
    look.idle += dt; if (!look.drag && look.idle > 2.2) { look.ty *= Math.pow(0.12, dt); look.tp *= Math.pow(0.12, dt); }
    look.yaw += (look.ty - look.yaw) * Math.min(1, dt * 7); look.pitch += (look.tp - look.pitch) * Math.min(1, dt * 7);
    // camera
    const ps0 = (o.debug && window.__mkCamOverride && window.__mkCamOverride(id, t)) || (CAM[id] || CAM.hero)(t); // ?debug only: lets review scripts frame a close-up
    if (!camS.init || dt === 0) { camS.p = ps0.pos.slice(); camS.t = ps0.tgt.slice(); camS.f = ps0.fov; camS.init = true; }
    else { const kd = 1 - Math.exp(-dt * 5.5); for (let i = 0; i < 3; i++) { camS.p[i] += (ps0.pos[i] - camS.p[i]) * kd; camS.t[i] += (ps0.tgt[i] - camS.t[i]) * kd; } camS.f += (ps0.fov - camS.f) * kd; }
    const ps = { pos: camS.p, tgt: camS.t, fov: camS.f };
    ptr.sx += (ptr.x - ptr.sx) * Math.min(1, dt * 2.5); ptr.sy += (ptr.y - ptr.sy) * Math.min(1, dt * 2.5);
    camera.position.set(ps.pos[0], ps.pos[1], ps.pos[2]); _v.set(ps.tgt[0], ps.tgt[1], ps.tgt[2]);
    const dist = camera.position.distanceTo(_v);
    _r.subVectors(_v, camera.position).normalize().cross(_u.set(0, 1, 0)).normalize();
    const kk = hero && h < 0.34 ? 0.25 : clamp(dist * 0.02, 0.5, 3);
    camera.position.addScaledVector(_r, ptr.sx * kk); camera.position.y += -ptr.sy * kk * 0.5;
    if (hero && h < 0.34) camera.position.y += Math.sin(h * 300) * 0.03;
    if (Math.abs(look.yaw) + Math.abs(look.pitch) > 0.0005) { const dir = _v.clone().sub(camera.position); dir.applyAxisAngle(_u.set(0, 1, 0), -look.yaw); const rt = dir.clone().cross(_u).normalize(); dir.applyAxisAngle(rt, -look.pitch); _v.copy(camera.position).add(dir); }
    camera.lookAt(_v);
    const asp = W / H; let vf = ps.fov; if (asp < 1.25) { const hf = 2 * Math.atan(Math.tan(vf * Math.PI / 360) * 1.6); vf = Math.min(92, 2 * Math.atan(Math.tan(hf / 2) / asp) * 180 / Math.PI); }
    camera.fov = vf; camera.near = dist > 120 ? 3 : dist > 60 ? 1.2 : 0.35; camera.far = 3200; camera.updateProjectionMatrix();
    if (post) {
      camera.updateMatrixWorld();
      // screen-space motion of the look point since last frame → directional blur
      _vp.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      _c0.copy(_v).applyMatrix4(_vp); _c1.copy(_v).applyMatrix4(prevVP); prevVP.copy(_vp);
      let vx = (_c0.x - _c1.x) * 0.5, vy = (_c0.y - _c1.y) * 0.5; const vl = Math.hypot(vx, vy), vmax = 0.045;
      if (!isFinite(vl) || dt === 0) { vx = vy = 0; } else if (vl > vmax) { vx *= vmax / vl; vy *= vmax / vl; }
      const mb = xi ? 0.5 : hero && h > 0.38 && h < 0.8 ? 0.45 : 0.3;
      // floodlight shafts: brightest on-screen lamps of the live venue
      const L = []; venues[xi && xt > 0.5 ? B : A].lamps.forEach(lp => { if (lp.on < 0.05) return; lp.halo.getWorldPosition(_w2); _c0.copy(_w2).project(camera);
        if (_c0.z > 1 || _c0.z < -1) return; const ex = Math.max(Math.abs(_c0.x), Math.abs(_c0.y)); if (ex > 1.25) return;
        L.push({ x: _c0.x * 0.5 + 0.5, y: _c0.y * 0.5 + 0.5, s: lp.on * (1 - ss((ex - 0.85) / 0.4)) }); });
      L.sort((a, b) => b.s - a.s);
      const tilt = xi ? 0.75 * Math.pow(Math.sin(xt * Math.PI), 1.6) : hero ? 0.75 * R(h, 0.44, 0.52) * (1 - R(h, 0.68, 0.76)) : id === 'ft' ? 0.6 * R(t, 0.25, 0.6) : 0;
      const bars = xi ? 0.65 * R(xt, 0.04, 0.18) * (1 - R(xt, 0.82, 0.96)) : 0;
      const flash = id === 'race' ? 0.3 * Math.max(0, 1 - Math.abs(t - 0.067) / 0.006) : 0;
      post.set({ time, bloomK, lights: L.slice(0, 6), rays: 0.22 + 0.14 * lit, streak: 0.16 + 0.1 * lit, tilt, focus: 0.5, vel: [vx * mb, vy * mb], bars, flash });
    }
  }

  const proj = new THREE.Vector3();
  function project(x, y, z) { proj.set(x, y, z).project(camera); return { x: (proj.x * 0.5 + 0.5) * W, y: (-proj.y * 0.5 + 0.5) * H, on: proj.z < 1 && proj.z > -1 }; }
  let paused = false;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (paused) { last = now; return; }
    const dt = Math.min(0.05, (now - last) / 1000); last = now; time += dt;
    const prev = p; p += (target - p) * (1 - Math.exp(-dt * 4.2)); if (Math.abs(target - p) < 1e-5) p = target;
    update(dt, (p - prev) / Math.max(dt, 1e-3));
    if (post) {
      // frame-time watchdog: step the post stack down if this GPU can't hold ~40fps
      perf.ema += (dt - perf.ema) * 0.05; perf.t += dt;
      if (!o.noDegrade && perf.t > 3 && perf.ema > 1 / 40 && time - perf.last > 2.5 && post.level < 3) { perf.last = time; post.degrade(); }
      post.render();
    } else renderer.render(scene, camera);
    o.onFrame && o.onFrame({ p, project, ball: ball.visible && ballState === 'rest' ? project(ball.position.x, 0.2, ball.position.z) : null });
  }
  if (!LOWQ) {
    [0, 2].forEach(i => { const sp = spots[i]; sp.castShadow = true; sp.shadow.mapSize.set(2048, 2048); sp.shadow.bias = -0.0018; sp.shadow.normalBias = 0.12; sp.shadow.radius = 2.5; sp.shadow.focus = 1.25; sp.shadow.camera.near = 20; sp.shadow.camera.far = 520; });
    venues.forEach(Vn => Vn.root.traverse(m => { if (!m.isMesh || !m.material || !m.material.isMeshStandardMaterial) return; m.castShadow = !(m.isInstancedMesh && m.material === seatMat) && !m.userData.noCast; m.receiveShadow = true; }));
    ground.receiveShadow = true; tunnel.traverse(m => { if (m.isMesh) m.receiveShadow = true; });
  }
  scene.traverse(m => { if (!m.isMesh || !m.material || !m.material.isMeshStandardMaterial) return; const mm = m.material; mm.envMapIntensity = mm.userData.env != null ? mm.userData.env : mm === mats.steel ? 0.6 : mm === mats.glass ? 0.6 : mm === seatMat ? 0.16 : mm === surfMat ? 0.22 : 0.1; });
  try { venues.forEach(Vn => { Vn.root.visible = true; }); [plate, tac, fans, fdLine].forEach(m => { if (m) m.visible = true; }); if (renderer.compileAsync) await renderer.compileAsync(scene, camera); } catch (e) {}
  update(0, 0); raf = requestAnimationFrame(frame);
  setTimeout(loadFigure, 1500);

  return {
    setTarget(v) { target = clamp(v); },
    jump(v) { target = p = clamp(v); camS.init = false; },
    setHighlight(i) { highlight = i; },
    // skip simulation + rendering while the page fully covers the canvas
    setPaused(v) { paused = !!v; },
    degrade() { return post ? post.degrade() : false; },
    get scene() { return scene; },
    get post() { return post; },
    get progress() { return p; },
    dispose() { cancelAnimationFrame(raf); canvas.removeEventListener('pointerdown', onDown); window.removeEventListener('pointermove', onMove2); window.removeEventListener('pointerup', onUp); window.removeEventListener('resize', resize); window.removeEventListener('pointermove', onMove); renderer.dispose(); },
  };
}
