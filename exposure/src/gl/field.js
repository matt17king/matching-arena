// The field: one WebGL canvas behind the whole page.
//  1. trail sim   — a feedback buffer. The cursor (or a tap) leaves light that decays: a long exposure. Nothing moves on its own.
//  2. composite   — the base colour, two soft fields of light with panned streaks and contour lines, the trails, and film grain.
//  3. photo pass  — the "in the stands" strip, drawn with a real directional blur tied to how fast it is moving.
// Plain WebGL1, no libraries. If the context can't be created the page still works on its CSS background.

const VERT = `attribute vec2 aPos; varying vec2 vUv; void main(){ vUv = aPos*0.5+0.5; gl_Position = vec4(aPos,0.,1.); }`;

const NOISE = `
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;} vec2 mod289(vec2 x){return x-floor(x*(1./289.))*289.;}
vec3 permute(vec3 x){return mod289(((x*34.)+1.)*x);}
float snoise(vec2 v){
  const vec4 C=vec4(.211324865405187,.366025403784439,-.577350269189626,.024390243902439);
  vec2 i=floor(v+dot(v,C.yy)); vec2 x0=v-i+dot(i,C.xx);
  vec2 i1=(x0.x>x0.y)?vec2(1.,0.):vec2(0.,1.); vec4 x12=x0.xyxy+C.xxzz; x12.xy-=i1;
  i=mod289(i); vec3 p=permute(permute(i.y+vec3(0.,i1.y,1.))+i.x+vec3(0.,i1.x,1.));
  vec3 m=max(.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.); m=m*m; m=m*m;
  vec3 x=2.*fract(p*C.www)-1.; vec3 h=abs(x)-.5; vec3 ox=floor(x+.5); vec3 a0=x-ox;
  m*=1.79284291400159-.85373472095314*(a0*a0+h*h);
  vec3 g; g.x=a0.x*x0.x+h.x*x0.y; g.yz=a0.yz*x12.xz+h.yz*x12.yw; return 130.*dot(m,g);
}
float hash(vec2 p){ vec3 p3=fract(vec3(p.xyx)*.1031); p3+=dot(p3,p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
`;

const SIM = `precision highp float;
varying vec2 vUv; uniform sampler2D uPrev; uniform vec2 uRes; uniform float uAspect, uTime, uFlow;
uniform vec4 uSeg[6]; uniform vec3 uSegP[6];
float seg(vec2 p, vec2 a, vec2 b){ vec2 pa=p-a, ba=b-a; float h=clamp(dot(pa,ba)/max(dot(ba,ba),1e-6),0.,1.); return length(pa-ba*h); }
void main(){
  vec2 px=1./uRes;
  // the buffer rides with the page, plus a slow sideways drift so light smears like a panned shot
  vec2 drift=vec2(.0009+.0006*sin(vUv.y*5.+uTime*.21), .0003*sin(vUv.x*4.-uTime*.17));
  vec2 uv=vUv-vec2(0.,uFlow)-drift;
  vec2 c=texture2D(uPrev,uv).rg*.36;
  c+=texture2D(uPrev,uv+vec2(px.x*2.2,0.)).rg*.2; c+=texture2D(uPrev,uv-vec2(px.x*2.2,0.)).rg*.2;
  c+=texture2D(uPrev,uv+vec2(0.,px.y*1.2)).rg*.12; c+=texture2D(uPrev,uv-vec2(0.,px.y*1.2)).rg*.12;
  c=max(c*vec2(.972,.988)-vec2(.0028,.0016),0.);
  vec2 p=vec2(vUv.x*uAspect,vUv.y);
  for(int i=0;i<6;i++){
    vec3 sp=uSegP[i]; if(sp.z<=0.) continue;
    float d=seg(p,uSeg[i].xy,uSeg[i].zw);
    float core=exp(-d*d/(sp.x*sp.x)), halo=exp(-d*d/(sp.y*sp.y));
    c.r+=core*sp.z*(1.-c.r); c.g+=halo*sp.z*.55*(1.-c.g);
  }
  gl_FragColor=vec4(c,0.,1.);
}`;

const COMP = `precision highp float;
varying vec2 vUv; uniform sampler2D uTrail; uniform vec2 uRes; uniform float uTime, uScroll, uVel, uGrain, uSeed, uEnergy, uTight, uLines;
uniform vec3 uBg, uA, uB, uHalo, uCore; uniform vec4 uMix, uBlob;
${NOISE}
void main(){
  vec2 asp=vec2(uRes.x/uRes.y,1.); vec2 p=vUv*asp;
  float t=uTime*.035;
  vec2 q=p+vec2(0.,uScroll*.16);
  vec2 w=vec2(snoise(q*.5+vec2(t,3.1)),snoise(q*.5+vec2(7.7,-t)));
  // panned streaks: noise stretched hard along x, stronger the faster the page is moving
  float st=snoise(vec2(q.x*.3+t*3.,q.y*8.));
  float st2=snoise(vec2(q.x*.9-t*5.,q.y*34.));
  float pan=.07+.22*uVel;
  vec2 qa=q+w*.3+vec2(st*pan+st2*pan*.35,0.);
  vec2 ca=uBlob.xy*asp+vec2(0.,uScroll*.16), cb=uBlob.zw*asp+vec2(0.,uScroll*.16);
  float da=length((qa-ca)*vec2(.5,1.05))*uTight, db=length((qa-cb)*vec2(.42,1.2))*uTight;
  float a=1.-smoothstep(0.,.66,da);
  float b=1.-smoothstep(0.,.72,db);
  a*=.72+.28*snoise(qa*1.3+11.); b*=.7+.3*snoise(qa*1.1-5.);
  // fine contour lines through the light, the rings a moving lamp leaves on a long exposure
  float ring=smoothstep(.3,.7,.5+.5*sin(da*uRes.y*uLines+w.x*5.));
  float ring2=smoothstep(.3,.7,.5+.5*sin(db*uRes.y*uLines*.8-w.y*5.));
  a*=.87+.13*ring; b*=.9+.1*ring2;
  a=a*a*(3.-2.*a)*uEnergy; b=b*b*(3.-2.*b)*uEnergy;

  vec3 tr=texture2D(uTrail,vUv).rgb*.5+texture2D(uTrail,vUv+vec2(.006,0.)).rgb*.25+texture2D(uTrail,vUv-vec2(.006,0.)).rgb*.25;
  float halo=smoothstep(.02,.55,tr.g), core=smoothstep(.04,.6,tr.r);

  // grain: fine + slightly coarser, and it also breaks up every blend edge (the airbrushed, gritty falloff)
  vec2 fc=gl_FragCoord.xy; float g=hash(fc+uSeed)-.5, g2=hash(floor(fc*.5)+uSeed*1.7)-.5; float gr=g*.68+g2*.32;
  float ea=a*(1.-a)*4., eb=b*(1.-b)*4., eh=halo*(1.-halo)*4., ec=core*(1.-core)*4.;
  a=clamp(a+gr*.36*ea,0.,1.); b=clamp(b+gr*.36*eb,0.,1.); halo=clamp(halo+gr*.4*eh,0.,1.); core=clamp(core+gr*.36*ec,0.,1.);

  vec3 col=uBg;
  col=mix(col,uB,b*uMix.y);
  col=mix(col,uA,a*uMix.x);
  col=mix(col,uHalo,halo*uMix.z);
  col=mix(col,uCore,core*uMix.w);
  col+=gr*uGrain*(.75+1.3*max(max(ea,eb),max(eh,ec)));
  gl_FragColor=vec4(col,1.);
}`;

const PVERT = `attribute vec2 aPos; varying vec2 vUv; uniform vec4 uRect; void main(){ vUv=aPos*0.5+0.5; vec2 c=uRect.xy+vUv*uRect.zw; gl_Position=vec4(c*2.-1.,0.,1.); }`;
const PFRAG = `precision highp float;
varying vec2 vUv; uniform sampler2D uTex; uniform vec2 uCover, uPx; uniform float uBlur, uPad, uDuo, uAlpha, uSeed, uGrain, uRad; uniform vec3 uLo, uHi;
float hash(vec2 p){ vec3 p3=fract(vec3(p.xyx)*.1031); p3+=dot(p3,p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
void main(){
  // the quad is wider than the photo by uPad on each side so the blur can spill past the frame, as it does on film
  float x=(vUv.x*(1.+2.*uPad))-uPad;
  vec3 acc=vec3(0.); float cov=0.;
  float jit=hash(gl_FragCoord.xy+uSeed)-.5;
  for(int i=0;i<13;i++){
    float o=((float(i)+jit)/12.-.5)*uBlur; float sx=x+o;
    float inside=step(0.,sx)*step(sx,1.);
    vec2 uv=(vec2(sx,vUv.y)-.5)*uCover+.5;
    acc+=texture2D(uTex,uv).rgb*inside; cov+=inside;
  }
  float al=cov/13.; vec3 c=acc/max(cov,1.);
  float l=dot(c,vec3(.2126,.7152,.0722));
  vec3 duo=mix(uLo,uHi,smoothstep(.02,.92,l));
  c=mix(c,duo,uDuo);
  c+=(hash(gl_FragCoord.xy*1.3+uSeed*2.)-.5)*uGrain;
  // hairline feather top and bottom
  float f=smoothstep(0.,uPx.y*1.5,vUv.y)*smoothstep(0.,uPx.y*1.5,1.-vUv.y);
  // rounded corners while it is still; they smear away as soon as it moves
  vec2 hp=vec2(1./uPx.x/(1.+2.*uPad),1./uPx.y)*.5; vec2 dd=abs((vec2(x,vUv.y)-.5)*hp*2.)-hp+uRad;
  float rr=clamp(.5-(length(max(dd,0.))+min(max(dd.x,dd.y),0.)-uRad),0.,1.);
  al=min(al,max(rr,clamp(uBlur*10.,0.,1.)));
  gl_FragColor=vec4(c,al*uAlpha*f);
}`;

function compile(gl, type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader'); return s; }
function program(gl, vs, fs) {
  const p = gl.createProgram(); gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs)); gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
  gl.bindAttribLocation(p, 0, 'aPos'); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || 'link');
  const u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) { const name = gl.getActiveUniform(p, i).name.replace(/\[0\]$/, ''); u[name] = gl.getUniformLocation(p, name); }
  return { p, u };
}

export function createField(canvas, { reduced = false } = {}) {
  let gl;
  try { gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'high-performance', preserveDrawingBuffer: false }); } catch { gl = null; }
  if (!gl) return null;
  let sim, comp, photo;
  try { sim = program(gl, VERT, SIM); comp = program(gl, VERT, COMP); photo = program(gl, PVERT, PFRAG); } catch (e) { console.warn('[field]', e.message); return null; }

  const quad = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, quad); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.disable(gl.DEPTH_TEST);

  let W = 1, H = 1, SW = 1, SH = 1, dprCap = 1.75, fbos = [], cur = 0;
  const mkTarget = (w, h) => {
    const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
    return { tex, fb };
  };
  function resize() {
    // cap the pixel count as well as the ratio, so a 4K window does not ask for four times the work
    const dpr = Math.min(window.devicePixelRatio || 1, dprCap, Math.max(1, Math.sqrt(2.6e6 / Math.max(1, canvas.clientWidth * canvas.clientHeight))));
    const w = Math.max(2, Math.round(canvas.clientWidth * dpr)), h = Math.max(2, Math.round(canvas.clientHeight * dpr));
    if (w === W && h === H) return;
    W = w; H = h; canvas.width = W; canvas.height = H;
    const sw = Math.min(480, Math.round(canvas.clientWidth / 2.5)) | 0, sh = Math.max(2, Math.round(sw * H / W));
    if (sw !== SW || sh !== SH) { fbos.forEach(f => { gl.deleteTexture(f.tex); gl.deleteFramebuffer(f.fb); }); SW = Math.max(2, sw); SH = sh; fbos = [mkTarget(SW, SH), mkTarget(SW, SH)]; cur = 0; }
  }
  resize();

  // light sources: the pointer's last move and any tap. Each is stamped as the whole segment it travelled.
  const segs = new Float32Array(24), segP = new Float32Array(18);
  const pointer = { x: 0.5, y: 0.5, px: 0.5, py: 0.5, moved: false, burst: 0 };

  // photo strip
  const photos = []; // { tex, aspect, ready }
  function loadPhoto(i, url) {
    if (photos[i]) return; const ph = photos[i] = { tex: null, aspect: 0.7, ready: false };
    const img = new Image(); img.decoding = 'async';
    img.onload = () => {
      const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      // keep textures modest: these are shown at a few hundred px wide
      const max = 1024, k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      let src = img; if (k < 1) { const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); src = c; }
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, src);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      ph.tex = tex; ph.aspect = img.naturalWidth / img.naturalHeight; ph.ready = true;
    };
    img.src = url;
  }

  let seedT = 0, seed = 0, slow = 0, frames = 0;
  function frame(s) {
    // s: { time, dt, scroll (in viewport heights), flow (page movement this frame in viewport heights), vel 0..1, theme {bg,a,b,halo,core,mix}, blob [ax,ay,bx,by], energy, strip:[{i,x,y,w,h,blur,duo,alpha}] }
    resize();
    const aspect = W / H, t = s.time;
    if (!reduced) { seedT += s.dt; if (seedT > 1 / 14) { seedT = 0; seed = Math.random() * 97; } }

    // ---- sources
    let n = 0;
    const rs = Math.min(1, aspect * 1.2); // on a narrow screen the same light would be a blob, so scale it with the width
    const push = (ax, ay, bx, by, rc, rh, str) => { if (n >= 6) return; segs.set([ax * aspect, ay, bx * aspect, by], n * 4); segP.set([rc * rs, rh * rs, str], n * 3); n++; };
    if (pointer.moved) {
      const sp = Math.hypot(pointer.x - pointer.px, pointer.y - pointer.py);
      if (sp > 0.0005 && sp < 0.5) push(pointer.px, pointer.py + s.flow, pointer.x, pointer.y, 0.007 + Math.min(sp, 0.08) * 0.12, 0.05 + Math.min(sp, 0.08) * 0.5, Math.min(0.95, 0.3 + sp * 14));
      pointer.px = pointer.x; pointer.py = pointer.y; pointer.moved = false;
    }
    if (pointer.burst > 0) { push(pointer.x, pointer.y, pointer.x, pointer.y, 0.035, 0.11, 0.9 * pointer.burst); pointer.burst = 0; }
    for (let i = n; i < 6; i++) segP[i * 3 + 2] = 0;

    // ---- sim
    const src = fbos[cur], dst = fbos[1 - cur];
    gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fb); gl.viewport(0, 0, SW, SH); gl.disable(gl.BLEND);
    gl.useProgram(sim.p); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, src.tex);
    gl.uniform1i(sim.u.uPrev, 0); gl.uniform2f(sim.u.uRes, SW, SH); gl.uniform1f(sim.u.uAspect, aspect); gl.uniform1f(sim.u.uTime, t);
    gl.uniform1f(sim.u.uFlow, Math.max(-0.35, Math.min(0.35, s.flow)));
    gl.uniform4fv(sim.u.uSeg, segs); gl.uniform3fv(sim.u.uSegP, segP);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); cur = 1 - cur;

    // ---- composite
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H);
    gl.useProgram(comp.p); gl.bindTexture(gl.TEXTURE_2D, dst.tex);
    const th = s.theme, u = comp.u;
    gl.uniform1i(u.uTrail, 0); gl.uniform2f(u.uRes, W, H); gl.uniform1f(u.uTime, reduced ? 12 : t); gl.uniform1f(u.uScroll, s.scroll); gl.uniform1f(u.uVel, s.vel);
    gl.uniform1f(u.uGrain, s.grain); gl.uniform1f(u.uSeed, seed); gl.uniform1f(u.uEnergy, s.energy); gl.uniform1f(u.uLines, 0.62 / Math.max(1, W / Math.max(1, canvas.clientWidth)));
    // on a tall, narrow screen the same field would flood the page, so pull it in
    gl.uniform1f(u.uTight, aspect < 1 ? 1 + Math.min(1, (1 - aspect) / 0.5) * 0.95 : 1);
    gl.uniform3fv(u.uBg, th.bg); gl.uniform3fv(u.uA, th.a); gl.uniform3fv(u.uB, th.b); gl.uniform3fv(u.uHalo, th.halo); gl.uniform3fv(u.uCore, th.core);
    gl.uniform4fv(u.uMix, th.mix); gl.uniform4fv(u.uBlob, s.blob);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // ---- photo strip
    if (s.strip && s.strip.length) {
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(photo.p); const pu = photo.u; gl.uniform1i(pu.uTex, 0); gl.uniform1f(pu.uSeed, seed); gl.uniform1f(pu.uGrain, s.grain * 0.45);
      gl.uniform3fv(pu.uLo, s.duoLo); gl.uniform3fv(pu.uHi, s.duoHi);
      for (const q of s.strip) {
        const ph = photos[q.i]; if (!ph || !ph.ready || q.alpha <= 0.003) continue;
        const pad = Math.min(0.9, q.blur * 0.5 + 0.002), wq = q.w * (1 + 2 * pad);
        if (q.x + q.w / 2 + q.w * pad < 0 || q.x - q.w / 2 - q.w * pad > 1) continue;
        gl.bindTexture(gl.TEXTURE_2D, ph.tex);
        gl.uniform4f(pu.uRect, q.x - wq / 2, q.y - q.h / 2, wq, q.h);
        // cover fit
        const qa = (q.w * W) / (q.h * H), ia = ph.aspect; const cx = qa > ia ? 1 : qa / ia, cy = qa > ia ? ia / qa : 1;
        gl.uniform2f(pu.uCover, cx, cy); gl.uniform2f(pu.uPx, 1 / (wq * W), 1 / (q.h * H));
        gl.uniform1f(pu.uBlur, q.blur); gl.uniform1f(pu.uRad, 14 * (W / Math.max(1, canvas.clientWidth))); gl.uniform1f(pu.uPad, pad); gl.uniform1f(pu.uDuo, q.duo); gl.uniform1f(pu.uAlpha, q.alpha);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
      gl.disable(gl.BLEND);
    }

    // ---- step the resolution down once if this GPU is struggling
    if (frames < 140) { frames++; if (frames > 20 && s.dt > 0.03) slow++; if (frames === 140 && slow > 55 && dprCap > 1) { dprCap = 1; W = 0; resize(); } }
  }

  return {
    frame, resize, loadPhoto,
    photoReady: i => !!(photos[i] && photos[i].ready),
    photoAspect: i => (photos[i] && photos[i].aspect) || 0.7,
    point(x, y) { if (!pointer.started) { pointer.px = x; pointer.py = y; pointer.started = true; } pointer.x = x; pointer.y = y; pointer.moved = true; },
    burst(x, y, k = 1) { pointer.x = pointer.px = x; pointer.y = pointer.py = y; pointer.burst = k; },
    lost(cb) { canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); cb(); }); },
  };
}
