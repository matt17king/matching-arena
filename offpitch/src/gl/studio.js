// The studio: renderer, softbox lighting, a seamless floor that only shows shadows, and the lens.
// Everything is lit like a product shoot: one key light, three softboxes in the reflections, no visible room.
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import { N8AOPass } from 'n8ao';

const VS = 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }';

// Softboxes and a graded dome, baked once into the reflection map.
function buildEnvironment(renderer) {
  const s = new THREE.Scene();
  const dome = new THREE.Mesh(new THREE.SphereGeometry(30, 48, 24), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    vertexShader: 'varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `varying vec3 vP; void main(){ float y=normalize(vP).y;
      vec3 top=vec3(0.86,0.87,0.88), mid=vec3(0.62,0.62,0.61), bot=vec3(0.42,0.41,0.40);
      vec3 c=mix(mid,top,smoothstep(0.0,0.9,y)); c=mix(c,bot,smoothstep(0.0,-0.7,y)); gl_FragColor=vec4(c,1.0); }`,
  }));
  s.add(dome);
  const box = (w, h, pos, look, k, tint = [1, 1, 1]) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(tint[0] * k, tint[1] * k, tint[2] * k), side: THREE.DoubleSide }));
    m.position.set(...pos); m.lookAt(...look); s.add(m); return m;
  };
  box(11, 11, [0, 12, 1], [0, 0, 0], 5.2);                         // overhead bank
  box(7, 10, [-13, 6, 5], [0, 1, 0], 8.5, [1, 0.985, 0.96]);       // key, camera left
  box(2.2, 12, [12, 5, -7], [0, 1, 0], 9.5, [0.96, 0.98, 1]);      // rim strip, back right
  box(16, 6, [0, 3, 16], [0, 1, 0], 1.3);                          // soft front fill
  box(5, 5, [9, 1.5, 8], [0, 1, 0], 1.6, [1, 0.97, 0.93]);         // low kicker
  const pm = new THREE.PMREMGenerator(renderer);
  const tex = pm.fromScene(s, 0.012).texture;
  pm.dispose(); s.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
  return tex;
}

export function createStudio(canvas, tier) {
  const Q = { high: { dpr: 2, shadow: 4096, ao: true, dof: 28, half: false, aoS: 16 }, mid: { dpr: 1.5, shadow: 2048, ao: true, dof: 16, half: false, aoS: 8 }, low: { dpr: 1.25, shadow: 1024, ao: false, dof: 0, half: true } }[tier];
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', alpha: false, stencil: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, Q.dpr));
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = true;

  const scene = new THREE.Scene();
  const bg = new THREE.Color('#ece8df');
  scene.background = bg;
  scene.environment = buildEnvironment(renderer);
  scene.environmentIntensity = 0.7;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 400);

  // Key light. Its shadow box follows whatever the shot is about.
  const key = new THREE.DirectionalLight('#fff6ea', 2.9);
  key.castShadow = true;
  key.shadow.mapSize.set(Q.shadow, Q.shadow);
  key.shadow.bias = -0.0002; key.shadow.normalBias = 0.002; key.shadow.radius = 5;
  scene.add(key, key.target);
  const keyDir = new THREE.Vector3(-0.52, 1, 0.42).normalize();
  const bounce = new THREE.HemisphereLight('#ffffff', bg.clone(), 0.35);
  scene.add(bounce);

  // Seamless floor: the page colour everywhere, darkened only where a shadow falls.
  const floorMat = new THREE.ShadowMaterial({ color: new THREE.Color('#3a352c'), opacity: 0.34 });
  floorMat.transparent = false;
  floorMat.uniforms = THREE.UniformsUtils.merge([THREE.ShaderLib.shadow.uniforms, { uBg: { value: bg } }]);
  floorMat.onBeforeCompile = sh => {
    sh.uniforms.uBg = { value: bg };
    sh.fragmentShader = sh.fragmentShader.replace('uniform float opacity;', 'uniform float opacity; uniform vec3 uBg;')
      .replace('gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );', 'gl_FragColor = vec4( mix( uBg, color, opacity * ( 1.0 - getShadowMask() ) ), 1.0 );');
  };
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(1200, 1200), floorMat);
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; floor.renderOrder = -1;
  scene.add(floor);

  // ---- lens
  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: Q.ao ? 0 : 4 }));
  let ao = null;
  if (Q.ao) {
    try {
      ao = new N8AOPass(scene, camera, 1, 1);
      ao.autoDetectTransparency = false;
      Object.assign(ao.configuration, { aoRadius: 0.3, distanceFalloff: 0.6, intensity: 2.6, color: new THREE.Color('#1c1812'), halfRes: false, depthAwareUpsampling: true, gammaCorrection: false, aoSamples: Q.aoS, denoiseSamples: 8, denoiseRadius: 10, transparencyAware: false });
      composer.addPass(ao);
    } catch (e) { console.warn('AO unavailable', e); ao = null; }
  }
  if (!ao) composer.addPass(new RenderPass(scene, camera));

  // Depth of field: gather blur weighted by each sample's own circle of confusion.
  let dof = null;
  if (ao && Q.dof) {
    dof = new ShaderPass({
      uniforms: { tDiffuse: { value: null }, tDepth: { value: null }, uRes: { value: new THREE.Vector2(1, 1) }, uNear: { value: 0.05 }, uFar: { value: 400 }, uFocus: { value: 5 }, uAperture: { value: 0.5 }, uMax: { value: 18 } },
      vertexShader: VS,
      fragmentShader: `
        #define TAPS ${Q.dof}
        uniform sampler2D tDiffuse; uniform sampler2D tDepth; uniform vec2 uRes; uniform float uNear; uniform float uFar; uniform float uFocus; uniform float uAperture; uniform float uMax; varying vec2 vUv;
        float viewZ(vec2 uv){ float d=texture2D(tDepth,uv).x; float z=d*2.0-1.0; return 2.0*uNear*uFar/(uFar+uNear-z*(uFar-uNear)); }
        float coc(float z){ return clamp(uAperture*abs(1.0-uFocus/z)*3.0,0.0,1.0)*uMax; }
        void main(){
          vec3 c0=texture2D(tDiffuse,vUv).rgb; float z0=viewZ(vUv); float r0=coc(z0);
          if(uAperture<0.001){ gl_FragColor=vec4(c0,1.0); return; }
          vec3 acc=c0; float tw=1.0; float n=fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(0.06711056,0.00583715))))*6.2831853;
          for(int i=0;i<TAPS;i++){
            float fi=float(i)+0.5; float k=sqrt(fi/float(TAPS)); float a=fi*2.39996323+n;
            float r=k*uMax; vec2 uv=vUv+vec2(cos(a),sin(a))*r/uRes;
            float zs=viewZ(uv); float rs=coc(zs);
            float reach=zs>z0?min(rs,r0):rs;                 // background can't bleed over a sharp foreground
            float w=smoothstep(r-1.2,r+1.2,reach);
            acc+=texture2D(tDiffuse,uv).rgb*w; tw+=w; }
          gl_FragColor=vec4(acc/tw,1.0); }`,
    });
    dof.uniforms.tDepth.value = ao.beautyRenderTarget.depthTexture;
    composer.addPass(dof);
  }

  // Tone map (Khronos PBR Neutral, so product colours stay true on a pale set), then a light print grade.
  const grade = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uAsp: { value: 1 }, uVig: { value: 0.22 }, uExposure: { value: 1 }, uFlash: { value: 0 }, uFade: { value: 0 }, uFadeCol: { value: new THREE.Color('#ece8df') } },
    vertexShader: VS,
    fragmentShader: `uniform sampler2D tDiffuse; uniform float uTime; uniform float uAsp; uniform float uVig; uniform float uExposure; uniform float uFlash; uniform float uFade; uniform vec3 uFadeCol; varying vec2 vUv;
      vec3 neutral(vec3 color){ const float startCompression=0.8-0.04; const float desaturation=0.15;
        float x=min(color.r,min(color.g,color.b)); float offset=x<0.08?x-6.25*x*x:0.04; color-=offset;
        float peak=max(color.r,max(color.g,color.b)); if(peak<startCompression) return color;
        float d=1.0-startCompression; float newPeak=1.0-d*d/(peak+d-startCompression); color*=newPeak/peak;
        float g=1.0-1.0/(desaturation*(peak-newPeak)+1.0); return mix(color,vec3(newPeak),g); }
      vec3 toSRGB(vec3 c){ return mix(c*12.92, 1.055*pow(max(c,vec3(0.0)),vec3(1.0/2.4))-0.055, step(0.0031308,c)); }
      float h(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
      void main(){ vec3 c=texture2D(tDiffuse,vUv).rgb*uExposure; c+=uFlash;
        c=neutral(max(c,vec3(0.0))); c=toSRGB(c);
        vec2 d=vUv-0.5; float v=smoothstep(1.05,0.25,length(d*vec2(min(uAsp,1.9)*0.82,1.0))); c*=mix(1.0,mix(0.86,1.0,v),uVig*4.0);
        c=mix(c,toSRGB(uFadeCol),uFade);
        c+=(h(gl_FragCoord.xy+fract(uTime)*91.7)-0.5)*0.016;
        gl_FragColor=vec4(c,1.0); }`,
  });
  composer.addPass(grade);
  const smaa = ao ? new SMAAPass(1, 1) : null;
  if (smaa) composer.addPass(smaa);

  const tmpC = new THREE.Color();
  const api = {
    THREE, renderer, scene, camera, key, keyDir, floor, composer, ao, tier, Q,
    setSize(w, h) {
      renderer.setSize(w, h, false); composer.setSize(w, h);
      const pr = renderer.getPixelRatio();
      if (dof) dof.uniforms.uRes.value.set(w * pr, h * pr);
      grade.uniforms.uAsp.value = w / Math.max(1, h);
      camera.aspect = w / Math.max(1, h); camera.updateProjectionMatrix();
    },
    // colour of the set; shadows take a darker version of the same hue
    setBg(color) {
      bg.copy(color); bounce.groundColor.copy(color);
      tmpC.copy(color); const hsl = {}; tmpC.getHSL(hsl); tmpC.setHSL(hsl.h, Math.min(1, hsl.s * 1.25 + 0.04), hsl.l * 0.2);
      floorMat.color.copy(tmpC); if (ao) ao.configuration.color.copy(tmpC);
    },
    bg,
    // shot: where the key light's shadow box sits and how big it is; lens focus and aperture
    setShot({ focusPoint, shadowSize = 4, focusDist, aperture = 0.3, maxBlur = 16, exposure = 1, vignette = 0.22, flash = 0, time = 0, fade = 0, aoRadius = 0.3 }) {
      key.target.position.copy(focusPoint);
      key.position.copy(focusPoint).addScaledVector(keyDir, 40);
      const c = key.shadow.camera; const s = shadowSize;
      if (c.right !== s) { c.left = -s; c.right = s; c.top = s; c.bottom = -s; c.near = 5; c.far = 90; c.updateProjectionMatrix(); }
      key.shadow.radius = THREE.MathUtils.clamp(14 / s, 1.5, 7); key.shadow.normalBias = s * 0.0012; key.shadow.bias = -0.00004 * s;
      if (dof) { dof.uniforms.uFocus.value = focusDist; dof.uniforms.uAperture.value = aperture; dof.uniforms.uMax.value = maxBlur * renderer.getPixelRatio(); dof.uniforms.uNear.value = camera.near; dof.uniforms.uFar.value = camera.far; }
      if (ao) ao.configuration.aoRadius = aoRadius;
      const g = grade.uniforms; g.uExposure.value = exposure; g.uVig.value = vignette; g.uFlash.value = flash; g.uTime.value = time; g.uFade.value = fade; g.uFadeCol.value.copy(bg);
    },
    degrade() {
      // step down for slow GPUs: drop the lens blur, then AO resolution, then pixel ratio
      api.level = (api.level || 0) + 1;
      if (api.level === 1 && dof) { dof.enabled = false; return true; }
      if (api.level === 2) { renderer.setPixelRatio(Math.min(renderer.getPixelRatio(), 1)); api.setSize(canvas.clientWidth, canvas.clientHeight); return true; }
      if (api.level === 3 && ao) { ao.configuration.aoSamples = 6; ao.configuration.denoiseSamples = 4; return true; }
      return false;
    },
    render() { composer.render(); },
  };
  return api;
}
