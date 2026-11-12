// The hero object. One mesh, five lives: football, basketball, American football, tennis ball, racing tyre.
// The silhouette is a lathe profile that morphs; the skin is drawn in the shader and wipes from one sport to the next.
import * as THREE from 'three';

export const SKIN = { football: 0, basketball: 1, gridiron: 2, tennis: 3, tyre: 4 };
export const RADIUS = [0.11, 0.12, 0.085, 0.0335, 0.36]; // rolling radius of each form, metres
const NU = 220, NV = 288;

// ---- profiles: (radius, axial) from pole to pole, resampled evenly along their length
function resample(pts, n) {
  const L = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = L[L.length - 1], out = [];
  let j = 0;
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * total;
    while (j < L.length - 2 && L[j + 1] < t) j++;
    const k = (t - L[j]) / Math.max(1e-9, L[j + 1] - L[j]);
    out.push([pts[j][0] + (pts[j + 1][0] - pts[j][0]) * k, pts[j][1] + (pts[j + 1][1] - pts[j][1]) * k]);
  }
  out[0][0] = 0; out[n][0] = 0;
  return out;
}
function chaikin(pts, rounds) {
  for (let r = 0; r < rounds; r++) {
    const o = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      o.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
    }
    o.push(pts[pts.length - 1]); pts = o;
  }
  return pts;
}
const sphere = R => { const p = []; for (let i = 0; i <= 400; i++) { const a = (i / 400) * Math.PI; p.push([R * Math.sin(a), R * Math.cos(a)]); } return p; };
function lemon(L, Rm) { // an arc of a circle spun round its chord: the American football
  const rho = (Rm * Rm + (L / 2) * (L / 2)) / (2 * Rm), p = [];
  for (let i = 0; i <= 400; i++) { const y = L / 2 - (i / 400) * L; p.push([Math.max(0, Math.sqrt(rho * rho - y * y) - (rho - Rm)), y]); }
  return p;
}
function wheel() { // slick tyre on a covered rim, cross-section from one hub nut to the other
  const half = [[0, 0.108], [0.03, 0.108], [0.038, 0.104], [0.04, 0.09], [0.046, 0.086], [0.12, 0.094], [0.212, 0.112], [0.222, 0.118], [0.23, 0.134], [0.238, 0.136], [0.244, 0.13], [0.252, 0.138],
    [0.275, 0.158], [0.305, 0.166], [0.333, 0.158], [0.35, 0.136], [0.358, 0.1], [0.36, 0.05], [0.36, 0]];
  const full = half.concat(half.slice(0, -1).reverse().map(([r, y]) => [r, -y]));
  return chaikin(full, 3);
}
const PROFILES = [sphere(RADIUS[0]), sphere(RADIUS[1]), lemon(0.28, RADIUS[2]), sphere(RADIUS[3]), wheel()].map(p => resample(p, NU));

function buildGeometry() {
  const g = new THREE.BufferGeometry();
  const count = (NU + 1) * (NV + 1);
  const pos = new Float32Array(count * 3), uv = new Float32Array(count * 2);
  const P = PROFILES.map(() => new Float32Array(count * 4));
  const nrm = PROFILES.map(p => p.map((_, i) => {
    const a = p[Math.max(0, i - 1)], b = p[Math.min(NU, i + 1)];
    let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
    if (i === 0) { nx = 0; ny = 1; } if (i === NU) { nx = 0; ny = -1; }
    return [nx, ny];
  }));
  let k = 0;
  for (let i = 0; i <= NU; i++) for (let j = 0; j <= NV; j++, k++) {
    uv[k * 2] = i / NU; uv[k * 2 + 1] = j / NV;
    const ph = (j / NV) * Math.PI * 2, r = PROFILES[0][i][0];
    pos[k * 3] = r * Math.cos(ph); pos[k * 3 + 1] = PROFILES[0][i][1]; pos[k * 3 + 2] = r * Math.sin(ph);
    PROFILES.forEach((p, s) => { P[s][k * 4] = p[i][0]; P[s][k * 4 + 1] = p[i][1]; P[s][k * 4 + 2] = nrm[s][i][0]; P[s][k * 4 + 3] = nrm[s][i][1]; });
  }
  const idx = new Uint32Array(NU * NV * 6); let t = 0;
  for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) {
    const a = i * (NV + 1) + j, b = a + NV + 1;
    idx[t++] = a; idx[t++] = a + 1; idx[t++] = b; idx[t++] = b; idx[t++] = a + 1; idx[t++] = b + 1;
  }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  P.forEach((a, s) => g.setAttribute('aP' + s, new THREE.BufferAttribute(a, 4)));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 0.5);
  return g;
}

// 12 pentagon and 20 hexagon directions of a football
function footballFaces() {
  const t = (1 + Math.sqrt(5)) / 2, v = [];
  [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].forEach(a => v.push(new THREE.Vector3(...a).normalize()));
  const f = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]]
    .map(([a, b, c]) => new THREE.Vector3().add(v[a]).add(v[b]).add(v[c]).normalize());
  return v.concat(f);
}

// sidewall print for the tyre: a strip that wraps once round the wheel
function tyreStrip() {
  const c = document.createElement('canvas'); c.width = 2048; c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = '#000'; x.fillRect(0, 0, c.width, c.height);
  x.textBaseline = 'middle'; x.textAlign = 'center';
  for (let i = 0; i < 4; i++) {
    const cx = (i + 0.5) * c.width / 4;
    x.fillStyle = '#fff'; x.font = '700 62px "Instrument Sans Variable", Arial, sans-serif';
    x.fillText(i % 2 ? 'MK · 17' : 'OFF THE PITCH', cx, 66);
  }
  x.fillStyle = '#fff';
  for (let i = 0; i < 4; i++) x.fillRect((i * c.width) / 4 - 6, 40, 12, 48);
  const tex = new THREE.CanvasTexture(c); tex.wrapS = THREE.RepeatWrapping; tex.anisotropy = 8; tex.colorSpace = THREE.NoColorSpace;
  return tex;
}

const VERT_PARS = /* glsl */`
attribute vec4 aP0; attribute vec4 aP1; attribute vec4 aP2; attribute vec4 aP3; attribute vec4 aP4;
uniform float uW[5];
varying vec3 vDir; varying vec2 vBuv; varying vec2 vProf;
vec4 bProf(){ return aP0*uW[0]+aP1*uW[1]+aP2*uW[2]+aP3*uW[3]+aP4*uW[4]; }
`;
const VERT_NORMAL = /* glsl */`
vec4 bP = bProf(); float bPhi = uv.y * 6.28318530718; vec2 bN = normalize( bP.zw + vec2( 1e-6, 0.0 ) );
vec3 objectNormal = vec3( bN.x * cos( bPhi ), bN.y, bN.x * sin( bPhi ) );
`;
const VERT_BEGIN = /* glsl */`
vec3 transformed = vec3( bP.x * cos( bPhi ), bP.y, bP.x * sin( bPhi ) );
float bTh = uv.x * 3.14159265359;
vDir = vec3( sin( bTh ) * cos( bPhi ), cos( bTh ), sin( bTh ) * sin( bPhi ) ); vBuv = uv; vProf = bP.xy;
`;

const FRAG_PARS = /* glsl */`
uniform vec3 uFace[32]; uniform int uSkinA; uniform int uSkinB; uniform float uWipe; uniform sampler2D uTyre; uniform float uDetail; uniform float uPxRad;
varying vec3 vDir; varying vec2 vBuv; varying vec2 vProf;
struct Skin { vec3 col; float rough; float metal; float h; float cc; float ccr; float sheen; };
float h31(vec3 p){ p=fract(p*0.1031); p+=dot(p,p.yzx+33.33); return fract((p.x+p.y)*p.z); }
vec3 h33(vec3 p){ p=fract(p*vec3(0.1031,0.1030,0.0973)); p+=dot(p,p.yxz+33.33); return fract((p.xxy+p.yxx)*p.zyx); }
float vnoise(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(h31(i),h31(i+vec3(1,0,0)),f.x),mix(h31(i+vec3(0,1,0)),h31(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(h31(i+vec3(0,0,1)),h31(i+vec3(1,0,1)),f.x),mix(h31(i+vec3(0,1,1)),h31(i+vec3(1,1,1)),f.x),f.y),f.z); }
float fbm(vec3 p){ float a=0.5,s=0.0; for(int i=0;i<4;i++){ s+=a*vnoise(p); p=p*2.03+7.1; a*=0.5; } return s; }
// leather grain: rounded pebbles from the nearest of eight jittered points
float pebble(vec3 p){ vec3 b=floor(p-0.5); float d=1.0;
  for(int i=0;i<8;i++){ vec3 o=vec3(float(i&1),float((i>>1)&1),float((i>>2)&1)); vec3 q=b+o+0.5+(h33(b+o)-0.5)*0.72-p; d=min(d,dot(q,q)); }
  return 1.0-smoothstep(0.0,0.32,d); }
float fadeFor(float freq){ return clamp(uPxRad/freq*0.9-0.35,0.0,1.0)*uDetail; }

Skin skFootball(vec3 d){ Skin s;
  float a=-1.0,b=-1.0; int ia=0;
  for(int i=0;i<32;i++){ float v=dot(d,uFace[i])*(i<12?1.2259:1.2583); if(v>a){ b=a; a=v; ia=i; } else if(v>b){ b=v; } }
  float e=a-b; float seam=1.0-smoothstep(0.0,0.02,e); float puff=smoothstep(0.0,0.085,e);
  float lod=fadeFor(420.0); float m=(vnoise(d*420.0)*0.6+vnoise(d*190.0)*0.4)*lod;
  vec3 base=ia<12?(ia==0?vec3(0.72,0.02,0.035):vec3(0.022,0.022,0.026)):vec3(0.82,0.815,0.8);
  s.col=base*mix(1.0,0.42,seam)*(0.97+0.06*m);
  s.h=puff*0.0026-seam*0.0009+m*0.00007;
  s.rough=mix(ia<12?0.3:0.36,0.62,seam)+0.05*m; s.metal=0.0; s.cc=0.55*(1.0-seam); s.ccr=0.16; s.sheen=0.0; return s; }

Skin skBasketball(vec3 d){ Skin s;
  float c1=abs(d.y), c2=abs(d.x);
  float th=acos(clamp(abs(d.x),0.0,1.0)); float c2p=(d.z*d.z-d.y*d.y)/max(1e-4,d.z*d.z+d.y*d.y);
  float c3=abs(th-(0.97+0.21*c2p));
  float c=min(c1,min(c2,c3)); float ch=1.0-smoothstep(0.013,0.023,c); float lip=smoothstep(0.023,0.055,c);
  float lod=fadeFor(96.0); float pb=mix(0.55,pebble(d*96.0),lod);
  vec3 base=vec3(0.5,0.098,0.014)*(0.9+0.2*fbm(d*5.0));
  s.col=mix(base*(0.8+0.26*pb),vec3(0.012,0.011,0.011),ch);
  s.h=-ch*0.0018+(1.0-ch)*pb*0.00055*lod+lip*0.0004;
  s.rough=mix(0.6-0.18*pb,0.5,ch); s.metal=0.0; s.cc=0.0; s.ccr=0.3; s.sheen=0.12*(1.0-ch); return s; }

Skin skGridiron(vec3 d, vec2 prof, float v){ Skin s;
  float phi=v*6.28318530718; float sd=abs(sin(2.0*phi))*0.5*prof.x;
  float seam=1.0-smoothstep(0.0009,0.0026,sd);
  float arc=sin(phi)*prof.x; float front=step(0.0,cos(phi)); float a=prof.y;
  float along=1.0-smoothstep(0.054,0.056,abs(a));
  float mainL=front*(1.0-smoothstep(0.0026,0.0038,abs(arc)))*along;
  float kk=abs(fract((a+0.056)/0.014)-0.5)*0.014;
  float crossL=front*(1.0-smoothstep(0.002,0.003,kk))*(1.0-smoothstep(0.0115,0.013,abs(arc)))*along;
  float lace=max(mainL,crossL);
  float stripe=smoothstep(0.094,0.0955,abs(a))*(1.0-smoothstep(0.108,0.1095,abs(a)));
  float lod=fadeFor(120.0); float pb=mix(0.55,pebble(d*vec3(105.0,150.0,105.0)),lod);
  vec3 hide=vec3(0.19,0.052,0.02)*(0.82+0.36*fbm(d*6.0));
  vec3 base=mix(hide*(0.7+0.4*pb),vec3(0.8,0.79,0.76)*(0.9+0.1*pb),stripe);
  s.col=mix(base*mix(1.0,0.5,seam),vec3(0.83,0.82,0.79),lace);
  s.h=(1.0-lace)*pb*0.00042*lod+lace*0.0021-seam*0.0007;
  s.rough=mix(0.56-0.12*pb,0.72,lace); s.metal=0.0; s.cc=0.0; s.ccr=0.3; s.sheen=0.1; return s; }

Skin skTennis(vec3 d){ Skin s;
  float f=d.x*d.x-d.y*d.y+0.4*d.z; vec3 g=vec3(2.0*d.x,-2.0*d.y,0.4); g-=d*dot(g,d);
  float dist=abs(f)/max(length(g),1e-3); float seam=1.0-smoothstep(0.045,0.07,dist);
  float lod=fadeFor(360.0); float fine=vnoise(d*vec3(360.0,300.0,410.0))*lod+0.5*(1.0-lod);
  float fib=fine*0.4+vnoise(d*150.0)*0.35+vnoise(d*62.0)*0.25;
  vec3 felt=vec3(0.60,0.76,0.035)*(0.74+0.5*fib);
  s.col=mix(felt,vec3(0.86,0.87,0.82)*(0.9+0.1*fib),seam);
  s.h=(1.0-seam)*(fib*0.0007+0.0005)-seam*0.0003;
  s.rough=1.0; s.metal=0.0; s.cc=0.0; s.ccr=0.4; s.sheen=1.0-seam*0.6; return s; }

Skin skTyre(vec3 d, vec2 prof, vec2 buv){ Skin s; float r=prof.x; float ay=abs(prof.y);
  float rubber=smoothstep(0.243,0.25,r); float nut=1.0-smoothstep(0.041,0.044,r); float lipM=smoothstep(0.214,0.22,r)*(1.0-rubber);
  // sidewall print: text ring and the red compound band
  float sw=smoothstep(0.258,0.262,r)*(1.0-smoothstep(0.302,0.306,r))*step(0.1,ay);
  float tv=(r-0.26)/0.044; float txt=sw*smoothstep(0.35,0.6,texture2D(uTyre,vec2(buv.y*(prof.y>0.0?1.0:-1.0),tv)).r);
  float band=smoothstep(0.312,0.3135,r)*(1.0-smoothstep(0.3245,0.326,r))*step(0.1,ay);
  float tread=smoothstep(0.338,0.356,r);
  float streak=vnoise(vec3(prof.y*90.0,buv.y*14.0,3.0))*0.5+vnoise(vec3(prof.y*340.0,buv.y*40.0,9.0))*0.5;
  vec3 rub=vec3(0.011,0.011,0.012)*(0.8+0.5*streak*tread);
  rub=mix(rub,vec3(0.78,0.78,0.76),txt*0.92); rub=mix(rub,vec3(0.72,0.03,0.04),band);
  // wheel cover: dark anodised metal, lathe-turned
  float turn=vnoise(vec3(r*900.0,1.0,2.0))*0.5+vnoise(vec3(r*2600.0,5.0,2.0))*0.5;
  vec3 metalC=mix(vec3(0.085,0.088,0.095),vec3(0.24,0.245,0.25),lipM); metalC=mix(metalC,vec3(0.7,0.03,0.04),nut);
  s.col=mix(metalC,rub,rubber);
  s.metal=1.0-rubber; s.rough=mix(mix(0.3+0.12*turn,0.22,max(lipM,nut)),mix(0.62,0.48-0.08*streak,tread),rubber);
  s.h=rubber*(txt*0.0006+band*0.0002)+(1.0-rubber)*turn*0.00003; s.cc=0.0; s.ccr=0.3; s.sheen=0.0; return s; }

Skin skinOf(int id, vec3 d, vec2 prof, vec2 buv){
  if(id==0) return skFootball(d); if(id==1) return skBasketball(d); if(id==2) return skGridiron(d,prof,buv.y); if(id==3) return skTennis(d); return skTyre(d,prof,buv); }
vec3 bumpNormal(vec3 p, vec3 n, float h){
  vec3 sx=dFdx(p), sy=dFdy(p); vec3 r1=cross(sy,n), r2=cross(n,sx); float det=dot(sx,r1);
  vec2 dh=vec2(dFdx(h),dFdy(h)); vec3 g=sign(det)*(dh.x*r1+dh.y*r2); return normalize(abs(det)*n-g); }
`;

export function createBall() {
  const geometry = buildGeometry();
  const uniforms = {
    uW: { value: [1, 0, 0, 0, 0] }, uFace: { value: footballFaces() }, uSkinA: { value: 0 }, uSkinB: { value: 0 }, uWipe: { value: 0 },
    uTyre: { value: tyreStrip() }, uDetail: { value: 1 }, uPxRad: { value: 300 },
  };
  const material = new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.5, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.2, sheen: 1, sheenRoughness: 0.55, sheenColor: new THREE.Color('#ffffff') });
  material.shadowSide = THREE.FrontSide; // a ball resting on a floor loses its contact shadow to bias if back faces are used
  const vertexPatch = sh => {
    Object.assign(sh.uniforms, uniforms);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + VERT_PARS)
      .replace('#include <beginnormal_vertex>', VERT_NORMAL).replace('#include <begin_vertex>', VERT_BEGIN);
  };
  material.onBeforeCompile = sh => {
    vertexPatch(sh);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + FRAG_PARS)
      .replace('#include <map_fragment>', /* glsl */`
        vec3 bd=normalize(vDir);
        Skin SK=skinOf(uSkinA,bd,vProf,vBuv);
        float bEdge=0.0;
        if(uWipe>0.0005){ Skin SB=skinOf(uSkinB,bd,vProf,vBuv);
          float wn=vnoise(bd*9.0)*0.1; float wm=smoothstep(-0.05,0.05,uWipe*1.3-0.15-(vBuv.x+wn));
          bEdge=smoothstep(0.0,0.5,wm)*smoothstep(1.0,0.5,wm);
          SK.col=mix(SK.col,SB.col,wm); SK.rough=mix(SK.rough,SB.rough,wm); SK.metal=mix(SK.metal,SB.metal,wm); SK.h=mix(SK.h,SB.h,wm);
          SK.cc=mix(SK.cc,SB.cc,wm); SK.ccr=mix(SK.ccr,SB.ccr,wm); SK.sheen=mix(SK.sheen,SB.sheen,wm); }
        SK.col=mix(SK.col,vec3(0.95,0.94,0.9),bEdge*0.85); SK.h+=bEdge*0.0012;
        diffuseColor.rgb=SK.col;`)
      .replace('#include <roughnessmap_fragment>', 'float roughnessFactor = clamp( SK.rough, 0.04, 1.0 );')
      .replace('#include <metalnessmap_fragment>', 'float metalnessFactor = SK.metal;')
      .replace('#include <normal_fragment_maps>', 'normal = bumpNormal( - vViewPosition, normal, SK.h * smoothstep( 0.02, 0.3, abs( dot( normalize( vViewPosition ), normal ) ) ) );')
      .replace('#include <clearcoat_normal_fragment_maps>', '#ifdef USE_CLEARCOAT\n clearcoatNormal = normalize( mix( nonPerturbedNormal, normal, 0.6 ) );\n#endif')
      .replace('#include <lights_physical_fragment>', /* glsl */`#include <lights_physical_fragment>
        material.clearcoat = SK.cc; material.clearcoatRoughness = clamp( SK.ccr, 0.045, 1.0 );
        material.sheenColor = mix( vec3( 1.0 ), SK.col * 1.6 + 0.2, 0.75 ) * SK.sheen; material.sheenRoughness = 0.5;`);
  };
  material.customProgramCacheKey = () => 'mk-ball-1';
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true; mesh.receiveShadow = false; mesh.frustumCulled = false;
  const depthMat = new THREE.MeshDepthMaterial();
  depthMat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, uniforms);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + VERT_PARS)
      .replace('#include <begin_vertex>', VERT_NORMAL.replace('vec3 objectNormal', 'vec3 bObjN') + VERT_BEGIN);
  };
  depthMat.customProgramCacheKey = () => 'mk-ball-depth-1';
  mesh.customDepthMaterial = depthMat;

  const w = uniforms.uW.value;
  return {
    mesh, uniforms, material,
    // a: skin now, b: skin it is turning into, t: 0..1 through the change
    setForm(a, b, t) {
      const e = t * t * (3 - 2 * t);
      for (let i = 0; i < 5; i++) w[i] = 0;
      w[a] += 1 - e; w[b] += e;
      uniforms.uSkinA.value = a; uniforms.uSkinB.value = b; uniforms.uWipe.value = a === b ? 0 : t;
    },
    radius(a, b, t) { const e = t * t * (3 - 2 * t); return RADIUS[a] * (1 - e) + RADIUS[b] * e; },
    clone() {
      // an independent copy with its own form (used for the line-up)
      const u = { ...uniforms, uW: { value: [1, 0, 0, 0, 0] }, uSkinA: { value: 0 }, uSkinB: { value: 0 }, uWipe: { value: 0 } };
      const m = material.clone(); const srcCompile = material.onBeforeCompile;
      m.onBeforeCompile = sh => { srcCompile(sh); Object.assign(sh.uniforms, u); }; m.shadowSide = THREE.FrontSide;
      m.customProgramCacheKey = () => 'mk-ball-1';
      const me = new THREE.Mesh(geometry, m); me.castShadow = true; me.frustumCulled = false;
      const dm = new THREE.MeshDepthMaterial();
      dm.onBeforeCompile = sh => { depthMat.onBeforeCompile(sh); Object.assign(sh.uniforms, u); };
      dm.customProgramCacheKey = () => 'mk-ball-depth-1';
      me.customDepthMaterial = dm;
      return { mesh: me, set(s) { for (let i = 0; i < 5; i++) u.uW.value[i] = i === s ? 1 : 0; u.uSkinA.value = s; u.uSkinB.value = s; } };
    },
  };
}
