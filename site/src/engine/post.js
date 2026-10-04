// Arena v13 post stack: contact shadows (N8AO), floodlight shafts + anamorphic streaks, bloom,
// lens (tilt-shift + motion blur), then tone map and a broadcast grade with letterbox, vignette and grain.
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import { Pass, FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';
import { N8AOPass } from 'n8ao';

const VS = 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }';
const MAXL = 4;

// Bright-pass at half res → radial shafts toward each floodlight + a horizontal anamorphic streak → added back on top.
class ShaftsPass extends Pass {
  constructor(THREE) {
    super();
    const rt = () => new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
    this.rtBright = rt(); this.rtRays = rt(); this.rtS1 = rt(); this.rtS2 = rt();
    this.lights = Array.from({ length: MAXL }, () => new THREE.Vector3(0, 0, 0)); // x,y = uv, z = strength
    this.mBright = new THREE.ShaderMaterial({ uniforms: { tDiffuse: { value: null }, uTh: { value: 1.6 } }, vertexShader: VS,
      fragmentShader: `uniform sampler2D tDiffuse; uniform float uTh; varying vec2 vUv;
        void main(){ vec3 c=texture2D(tDiffuse,vUv).rgb; float l=dot(c,vec3(0.2126,0.7152,0.0722)); gl_FragColor=vec4(c*smoothstep(uTh,uTh*2.2,l),1.0); }` });
    this.mRays = new THREE.ShaderMaterial({ uniforms: { tB: { value: null }, uL: { value: this.lights }, uAsp: { value: 1 }, uDecay: { value: 0.955 } }, vertexShader: VS,
      fragmentShader: `uniform sampler2D tB; uniform vec3 uL[${MAXL}]; uniform float uAsp; uniform float uDecay; varying vec2 vUv;
        void main(){ vec3 acc=vec3(0.0);
          for(int k=0;k<${MAXL};k++){ vec3 L=uL[k]; if(L.z<=0.001) continue;
            vec2 d=(vUv-L.xy); float dist=length(d*vec2(uAsp,1.0)); vec2 st=d/32.0; vec2 uv=vUv; float w=1.0; vec3 s=vec3(0.0);
            for(int i=0;i<32;i++){ uv-=st; s+=texture2D(tB,uv).rgb*w; w*=uDecay; }
            acc+=s*L.z*(1.0/32.0)*exp(-dist*1.6); }
          gl_FragColor=vec4(acc,1.0); }` });
    this.mStreak = new THREE.ShaderMaterial({ uniforms: { tB: { value: null }, uStep: { value: new THREE.Vector2() } }, vertexShader: VS,
      fragmentShader: `uniform sampler2D tB; uniform vec2 uStep; varying vec2 vUv;
        void main(){ vec3 s=vec3(0.0); float tw=0.0; for(int i=-6;i<=6;i++){ float w=exp(-float(i*i)/18.0); s+=texture2D(tB,vUv+uStep*float(i)).rgb*w; tw+=w; } gl_FragColor=vec4(s/tw,1.0); }` });
    this.mComp = new THREE.ShaderMaterial({ uniforms: { tDiffuse: { value: null }, tRays: { value: null }, tStreak: { value: null }, uRays: { value: 0.6 }, uStreak: { value: 0.5 }, uTint: { value: new THREE.Color('#ffd9c4') } }, vertexShader: VS,
      fragmentShader: `uniform sampler2D tDiffuse; uniform sampler2D tRays; uniform sampler2D tStreak; uniform float uRays; uniform float uStreak; uniform vec3 uTint; varying vec2 vUv;
        void main(){ vec3 c=texture2D(tDiffuse,vUv).rgb; c+=texture2D(tRays,vUv).rgb*uRays*uTint; vec3 s=texture2D(tStreak,vUv).rgb; c+=s*uStreak*mix(vec3(1.0),vec3(1.0,0.55,0.45),0.35);
          gl_FragColor=vec4(c,1.0); }` });
    this.q = new FullScreenQuad(null);
  }
  setSize(w, h) {
    const hw = Math.max(1, Math.round(w / 2)), hh = Math.max(1, Math.round(h / 2));
    this.rtBright.setSize(hw, hh); this.rtRays.setSize(hw, hh);
    const sw = Math.max(1, Math.round(w / 4)), sh = Math.max(1, Math.round(h / 4)); this.rtS1.setSize(sw, sh); this.rtS2.setSize(sw, sh);
    this.mRays.uniforms.uAsp.value = w / Math.max(1, h); this.sw = sw;
  }
  render(renderer, writeBuffer, readBuffer) {
    const q = this.q, run = (m, target) => { q.material = m; renderer.setRenderTarget(target); q.render(renderer); };
    this.mBright.uniforms.tDiffuse.value = readBuffer.texture; run(this.mBright, this.rtBright);
    const anyL = this.lights.some(l => l.z > 0.001);
    if (anyL) { this.mRays.uniforms.tB.value = this.rtBright.texture; run(this.mRays, this.rtRays); }
    else { renderer.setRenderTarget(this.rtRays); renderer.clear(); }
    // three widening horizontal passes: a long, thin broadcast streak
    let src = this.rtBright, a = this.rtS1, b = this.rtS2;
    for (const k of [1, 3, 9]) { this.mStreak.uniforms.tB.value = src.texture; this.mStreak.uniforms.uStep.value.set(k * 1.6 / this.sw, 0); run(this.mStreak, a); src = a; [a, b] = [b, a]; }
    const c = this.mComp.uniforms; c.tDiffuse.value = readBuffer.texture; c.tRays.value = this.rtRays.texture; c.tStreak.value = src.texture;
    run(this.mComp, this.renderToScreen ? null : writeBuffer);
  }
}

export function createPost(THREE, renderer, scene, camera) {
  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 }));
  let ao = null; const base = new RenderPass(scene, camera); base.enabled = false;
  try {
    ao = new N8AOPass(scene, camera, 1, 1);
    Object.assign(ao.configuration, { aoRadius: 3.2, distanceFalloff: 1.4, intensity: 2.6, color: new THREE.Color('#050404'), halfRes: true, depthAwareUpsampling: true, gammaCorrection: false, aoSamples: 16, denoiseSamples: 8, denoiseRadius: 12 });
    composer.addPass(ao); composer.addPass(base);
  } catch (e) { console.warn('AO unavailable', e); ao = null; base.enabled = true; composer.addPass(base); }
  // guards against NaN/inf from HDR emitters before the blur chain
  composer.addPass(new ShaderPass({ uniforms: { tDiffuse: { value: null } }, vertexShader: VS, fragmentShader: 'uniform sampler2D tDiffuse; varying vec2 vUv; void main(){ vec4 c=texture2D(tDiffuse,vUv); if(isnan(c.r)||isnan(c.g)||isnan(c.b)||isinf(c.r)||isinf(c.g)||isinf(c.b)) c=vec4(0.0,0.0,0.0,1.0); gl_FragColor=vec4(clamp(c.rgb,0.0,40.0),1.0); }' }));
  const shafts = new ShaftsPass(THREE); composer.addPass(shafts);
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.5, 0.55, 0.88); composer.addPass(bloom);
  // lens: tilt-shift (depth-free miniature blur away from a focus band) + directional motion blur from camera movement
  const lens = new ShaderPass({ uniforms: { tDiffuse: { value: null }, uTilt: { value: 0 }, uFocus: { value: 0.5 }, uVel: { value: new THREE.Vector2() }, uRes: { value: new THREE.Vector2(1, 1) } }, vertexShader: VS,
    fragmentShader: `uniform sampler2D tDiffuse; uniform float uTilt; uniform float uFocus; uniform vec2 uVel; uniform vec2 uRes; varying vec2 vUv;
      void main(){ vec3 c=texture2D(tDiffuse,vUv).rgb;
        float band=smoothstep(0.08,0.5,abs(vUv.y-uFocus)); float r=uTilt*band*14.0;
        if(r>0.3){ vec3 s=c; float tw=1.0; for(int i=0;i<12;i++){ float a=float(i)*2.39996; float k=sqrt((float(i)+0.5)/12.0); vec2 o=vec2(cos(a),sin(a))*k*r/uRes; s+=texture2D(tDiffuse,vUv+o).rgb; tw+=1.0; } c=s/tw; }
        float vl=length(uVel*uRes);
        if(vl>1.0){ vec3 s=c; float tw=1.0; for(int i=1;i<=10;i++){ float t=float(i)/10.0-0.5; s+=texture2D(tDiffuse,vUv+uVel*t).rgb; tw+=1.0; } c=s/tw; }
        gl_FragColor=vec4(c,1.0); }` });
  composer.addPass(lens);
  composer.addPass(new OutputPass());
  // N8AO renders without hardware MSAA, so edges get SMAA in display space
  const smaa = ao ? new SMAAPass(1, 1) : null; if (smaa) composer.addPass(smaa);
  // broadcast grade, display-referred: split-tone, gentle S-curve, letterbox, vignette, CA, grain
  const grade = new ShaderPass({ uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uBars: { value: 0 }, uAsp: { value: 1 }, uFlash: { value: 0 }, uVig: { value: 0.32 } }, vertexShader: VS,
    fragmentShader: `uniform sampler2D tDiffuse; uniform float uTime; uniform float uBars; uniform float uAsp; uniform float uFlash; uniform float uVig; varying vec2 vUv;
      float h(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
      void main(){ vec2 d=vUv-0.5; float ca=dot(d,d)*0.012;
        vec3 c=vec3(texture2D(tDiffuse,vUv+d*ca).r,texture2D(tDiffuse,vUv).g,texture2D(tDiffuse,vUv-d*ca).b);
        float l=dot(c,vec3(0.2126,0.7152,0.0722));
        c=mix(c, c*vec3(0.92,0.98,1.08), (1.0-smoothstep(0.0,0.35,l))*0.55);   // cool shadows
        c=mix(c, c*vec3(1.06,1.0,0.92), smoothstep(0.45,1.0,l)*0.5);          // warm highlights
        c=mix(c, c*c*(3.0-2.0*c), 0.22);                                        // S-curve
        c=mix(vec3(l), c, 1.06);                                               // a touch more saturation
        float v=smoothstep(0.85,0.2,length(d*vec2(uAsp*0.75,1.0))); c*=mix(1.0,v,uVig);
        c+=uFlash*vec3(1.0,0.95,0.9);
        c+=(h(vUv*vec2(1931.0,1087.0)+fract(uTime*7.0)*91.0)-0.5)*0.028;
        float bh=uBars*0.5*(1.0-uAsp/2.39); if(bh>0.0 && (vUv.y<bh || vUv.y>1.0-bh)) c=vec3(0.043,0.039,0.039);
        gl_FragColor=vec4(c,1.0); }` });
  composer.addPass(grade);

  const api = {
    composer, bloom, ao,
    // EffectComposer forwards pixel-ratio-scaled sizes to every pass (AO, shafts, SMAA)
    setSize(w, h) { composer.setSize(w, h); const pr = renderer.getPixelRatio(); lens.uniforms.uRes.value.set(w * pr, h * pr); grade.uniforms.uAsp.value = w / Math.max(1, h); },
    // lights: [{x,y (uv), s}] — strongest first
    set({ time, bloomK, lights = [], rays = 0.6, streak = 0.5, tilt = 0, focus = 0.5, vel = [0, 0], bars = 0, flash = 0, aoK = 1 }) {
      grade.uniforms.uTime.value = time; grade.uniforms.uBars.value = bars; grade.uniforms.uFlash.value = flash;
      if (bloomK !== undefined) bloom.strength = bloomK;
      shafts.lights.forEach((L, i) => { const s = lights[i]; if (s) L.set(s.x, s.y, s.s); else L.z = 0; });
      shafts.mComp.uniforms.uRays.value = rays; shafts.mComp.uniforms.uStreak.value = streak;
      lens.uniforms.uTilt.value = tilt; lens.uniforms.uFocus.value = focus; lens.uniforms.uVel.value.set(vel[0], vel[1]);
      if (ao) ao.configuration.intensity = 2.6 * aoK;
    },
    // quality ladder for slower GPUs: 1 = no AO, 2 = no shafts/streaks, 3 = lower resolution
    level: 0,
    degrade() {
      const n = ++api.level;
      if (n === 1 && ao) { ao.enabled = false; base.enabled = true; base.needsSwap = false; }
      else if (n === 2) shafts.enabled = false;
      else if (n === 3) { renderer.setPixelRatio(1); api.setSize(innerWidth, innerHeight); }
      return n <= 3;
    },
    render() { composer.render(); },
  };
  return api;
}
