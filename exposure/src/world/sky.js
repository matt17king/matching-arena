// London, through the windows. The room pictures are daylight renders; this relights them for the real time of day
// and the real weather in London, so the penthouse is light when London is light and it rains when it rains there.
//
// Nothing here is laid over the picture. Each room has a mask (public/rooms/masks, built by tools/masks.py) that says,
// pixel by pixel, what is glass, what makes its own light, and how much daylight reaches each spot. A shader uses it to
// relight the picture itself: the view outside dims to dusk and fills with city lights, the daylight on the floor fades,
// the lamps come up, and rain runs down the glass and bends the view behind it. One WebGL context draws every room;
// each room keeps its last frame on a plain canvas, so rooms can cross-fade without the light jumping.
import { clamp, lerp } from '../kit.js';

const IW = 2000, IH = 1116, LAT = 51.5072, LON = -0.1276;

/* ---------- where the sun is: its height above London's horizon, in degrees, at a given moment */
export function sunHeight(date) {
  const R = Math.PI / 180, d = (date.getTime() - Date.UTC(2000, 0, 1, 12)) / 864e5;
  const g = (357.529 + 0.98560028 * d) * R, L = (280.459 + 0.98564736 * d + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * R, e = (23.439 - 0.00000036 * d) * R;
  const ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)), dec = Math.asin(Math.sin(e) * Math.sin(L));
  const ha = ((18.697374558 + 24.06570982441908 * d) * 15 + LON) * R - ra;
  return Math.asin(Math.sin(LAT * R) * Math.sin(dec) + Math.cos(LAT * R) * Math.cos(dec) * Math.cos(ha)) / R;
}

/* ---------- the look at each height of the sun. Between two rows the values are blended, so the light moves
   continuously through the day. amb: the room's own light. spill: the colour of what comes through the glass, where it
   lands. win: the view outside. glow: the sky's own colour added to that view. lamp: how far the lamps are up.
   night: how far the city's lights are on. */
const LOOK = [
  //  sun   amb                  spill                 win                   glow                 lamp  night
  [12, [1, 1, 1], [1, 1, 1], [1, 1, 1], [0, 0, 0], 0, 0],
  [5, [1, 0.95, 0.86], [1.12, 0.9, 0.68], [1.0, 0.86, 0.68], [0.04, 0.01, 0], 0.12, 0],
  [0.5, [0.86, 0.78, 0.74], [1.0, 0.74, 0.58], [0.82, 0.58, 0.5], [0.07, 0.02, 0.01], 0.5, 0.1],
  [-3, [0.6, 0.58, 0.66], [0.62, 0.66, 0.88], [0.3, 0.34, 0.52], [0.05, 0.03, 0.05], 0.9, 0.5],
  [-7, [0.42, 0.42, 0.52], [0.5, 0.56, 0.82], [0.14, 0.17, 0.3], [0.02, 0.016, 0.03], 1, 0.9],
  [-12, [0.34, 0.34, 0.42], [0.46, 0.52, 0.78], [0.07, 0.08, 0.14], [0.02, 0.014, 0.016], 1, 1],
];
// the rooftop picture was rendered at golden hour, so its untouched state belongs at a low sun, not at noon
const LOOK_OUT = [
  [14, [1, 1, 1], [0.93, 1.0, 1.1], [0.9, 1.0, 1.14], [0, 0.02, 0.06], 0, 0],
  [5, [1, 1, 1], [1, 1, 1], [1, 1, 1], [0, 0, 0], 0.1, 0],
  [0.5, [1, 1, 1], [0.86, 0.73, 0.72], [0.98, 0.74, 0.62], [0.06, 0.01, 0.01], 0.5, 0.15],
  [-3, [1, 1, 1], [0.56, 0.56, 0.74], [0.42, 0.44, 0.64], [0.04, 0.02, 0.06], 0.9, 0.6],
  [-7, [1, 1, 1], [0.4, 0.42, 0.6], [0.17, 0.2, 0.36], [0.01, 0.01, 0.03], 1, 0.9],
  [-12, [1, 1, 1], [0.32, 0.34, 0.5], [0.08, 0.09, 0.16], [0.02, 0.014, 0.016], 1, 1],
];
function look(table, sun) {
  if (sun >= table[0][0]) return table[0]; const last = table[table.length - 1]; if (sun <= last[0]) return last;
  let i = 0; while (table[i + 1][0] > sun) i++;
  const a = table[i], b = table[i + 1], t = (a[0] - sun) / (a[0] - b[0]), mix = k => (Array.isArray(a[k]) ? a[k].map((v, j) => lerp(v, b[k][j], t)) : lerp(a[k], b[k], t));
  return [sun, mix(1), mix(2), mix(3), mix(4), mix(5), mix(6)];
}

/* ---------- the weather. Open-Meteo is free and needs no key; if it cannot be reached the sky is simply clear. */
const WMO = [[0, 'Clear'], [2, 'Partly cloudy'], [3, 'Overcast'], [48, 'Fog'], [57, 'Drizzle'], [67, 'Rain'], [77, 'Snow'], [82, 'Showers'], [86, 'Snow showers'], [99, 'Thunderstorm']];
function readWeather(code, cloud) {
  const label = (WMO.find(([max]) => code <= max) || WMO[0])[1];
  const rain = code >= 95 ? 1 : code >= 80 && code <= 82 ? 0.8 : code >= 61 && code <= 67 ? (code >= 65 ? 1 : code >= 63 ? 0.8 : 0.6) : code >= 51 && code <= 57 ? 0.45 : 0;
  return { label, rain, cloud: clamp(Math.max(cloud / 100, rain ? 0.85 : 0, code === 3 ? 0.9 : 0, code > 40 && code < 50 ? 0.8 : 0)) };
}
export async function londonWeather() {
  try {
    const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=weather_code,cloud_cover`, { cache: 'no-store' });
    const c = (await r.json()).current; return readWeather(c.weather_code, c.cloud_cover);
  } catch { return null; }
}
export const WEATHERS = { clear: readWeather(0, 0), cloudy: readWeather(3, 100), rain: readWeather(63, 100), storm: readWeather(95, 100) };
export const TIMES = { day: 40, golden: 5, sunset: 0.5, dusk: -3.5, night: -18 };

/* ---------- the shader */
const VERT = 'attribute vec2 a; varying vec2 v; void main(){ v = vec2(a.x * .5 + .5, .5 - a.y * .5); gl_Position = vec4(a, 0., 1.); }';
const FRAG = `precision highp float;
varying vec2 v;
uniform sampler2D uImg, uMask;
uniform vec3 uAmb, uSpill, uWin, uGlow;
uniform float uNight, uLamp, uOver, uRain, uTime, uOut;
uniform vec4 uL[6]; uniform vec3 uLC[6];
const vec2 RES = vec2(${IW}., ${IH}.);

float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float lum(vec3 c) { return dot(c, vec3(.299, .587, .114)); }
float noise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + 1.), f.x), f.y); }
float fbm(vec2 p) { float a = .5, s = 0.; for (int i = 0; i < 4; i++) { s += a * noise(p); p *= 2.03; a *= .5; } return s; }

// One bead of water: where it is (c, in pixels) and how big (r). Returns xy: which way it bends the view, z: how much of it is here.
vec3 bead(vec2 px, vec2 c, float r) { vec2 d = (px - c) / r; float l = length(d); return vec3(-d * r * 2.4, smoothstep(1., .72, l)); }

// Rain on the glass. Columns of the pane each carry a drop that hangs, then runs, leaving beads behind it that dry out;
// between them the glass is stippled with small beads that come and go.
vec3 rain(vec2 px, float t, float amount) {
  vec3 acc = vec3(0.);
  for (int k = 0; k < 2; k++) {
    float fk = float(k), cw = 46. + fk * 31., ch = 520. + fk * 170.;
    vec2 g = vec2(px.x / cw + fk * .37, px.y / ch + fk * .21), id = floor(g); float n = h21(id + fk * 17.);
    if (n < amount * .75) {
      float sp = .09 + .1 * h21(id + 3.), ph = fract(t * sp + n * 7.), run = ph * ph * (3. - 2. * ph);   // hangs, runs, slows
      vec2 c = vec2((id.x + .2 + .6 * h21(id + 5.) - fk * .37) * cw, (id.y - fk * .21 + run * 1.15 - .08) * ch);
      c.x += sin(c.y * .05 + n * 20.) * 3.;                                                                 // it wanders a little on the way down
      float r = 5. + 4. * h21(id + 9.);
      vec3 b = bead(px, c, r); acc = mix(acc, b, b.z);
      // the trail: beads left along the path, smaller and drier the further behind
      float back = c.y - px.y;
      if (back > r && back < 240. && abs(px.x - c.x) < 9.) {
        float step_ = 15. + 6. * h21(id + 11.), yi = floor(px.y / step_), dry = 1. - back / 240.;
        vec2 tc = vec2(c.x + (h21(vec2(yi, id.x)) - .5) * 5., (yi + .5) * step_);
        vec3 tb = bead(px, tc, (1.6 + 2.6 * h21(vec2(yi, id.x + 2.))) * (.5 + .5 * dry)); tb.z *= step(.25, dry * h21(vec2(yi + 4., id.x)) + dry * .5);
        acc = mix(acc, tb, tb.z);
      }
    }
  }
  // the stipple
  vec2 sg = px / 13., sid = floor(sg); float sn = h21(sid);
  float live = smoothstep(.55, .9, sin(t * (.12 + .2 * sn) + sn * 40.) * .5 + .5 + amount * .25) * step(sn, .25 + amount * .35);
  vec3 sb = bead(px, (sid + .25 + .5 * vec2(h21(sid + 1.), h21(sid + 2.))) * 13., 1.4 + 2.4 * h21(sid + 3.)); sb.z *= live;
  return mix(sb, acc, step(.001, acc.z));
}

// The city at night: small lit windows where the picture shows a building rather than open sky.
vec3 city(vec2 px, float building) {
  vec3 acc = vec3(0.);
  for (int k = 0; k < 2; k++) {
    float fk = float(k); vec2 g = px / (vec2(6., 8.5) * (1. + fk * 1.1)) + fk * 3.3, id = floor(g); float n = h21(id + fk * 31.);
    vec2 f = fract(g) - .5 - (vec2(h21(id + 13.), h21(id + 21.)) - .5) * .5;
    float on = step(1. - .26 * building, n), dot_ = smoothstep(.38 + .1 * h21(id + 6.), .05, length(f * vec2(1., 1.2)));
    vec3 c = mix(vec3(1., .66, .3), vec3(.7, .84, 1.), step(.88, h21(id + 9.)));
    acc += c * dot_ * on * (.35 + .9 * h21(id + 4.)) * (1. - fk * .45);
  }
  return acc;
}

void main() {
  vec2 px = v * RES; vec3 I = texture2D(uImg, v).rgb, M = texture2D(uMask, v).rgb; float glass = M.r, glow = M.g, spill = M.b;

  /* the room: its own light, plus daylight where daylight reaches, plus the lamps once they are on */
  vec3 day = mix(vec3(1.), vec3(.84, .87, .93), uOver * (1. - uNight));          // cloud takes the warmth and some of the strength out of daylight
  vec3 amb = uAmb * mix(vec3(1.), uSpill * day, spill);
  vec3 lamp = vec3(0.);
  for (int i = 0; i < 6; i++) { vec2 d = (px - uL[i].xy) / max(uL[i].z, 1.); lamp += uLC[i] * uL[i].w * exp(-dot(d, d) * 1.5); }
  vec3 room = I * amb + I * lamp * uLamp + lamp * uLamp * .035;
  room = mix(room, max(room, I * (1. + .1 * uNight)), glow);                       // what glows keeps glowing

  /* outside: the view through the glass (or, on the roof, the sky) */
  vec2 uv = v; vec3 wet = vec3(0.);
  if (uRain > 0. && uOut < .5) { wet = rain(px, uTime, uRain); vec2 to = v + wet.xy * wet.z / RES; if (texture2D(uMask, to).r > .6) uv = to; }
  vec3 V = texture2D(uImg, uv).rgb; float lv = lum(V);
  V = mix(V, vec3(lv) * vec3(.84, .88, .95), uOver * .7 * (1. - uNight * .6));
  if (uOut > .5) V *= 1. + (fbm(v * vec2(3., 6.) + vec2(uTime * .012, 0.)) - .5) * .5 * uOver * (1. - uNight);   // cloud moving across the sky
  // as the light goes, buildings stop being pale shapes in a bright sky and become dark ones against a lit one
  // (indoors the towers are pale against a white sky; on the roof the real skyline is darker than the haze, and sits low)
  float building = uOut > .5 ? smoothstep(.76, .56, lum(I)) * smoothstep(90., 190., px.y) : smoothstep(.97, .83, lum(I));
  float sil = building * clamp((1. - lum(uWin)) * .95, 0., .68);
  vec3 view = (V * uWin + uGlow * lv) * (1. - sil);
  view += city(px, building) * uNight;
  view += vec3(.05, .036, .026) * uLamp * uNight * (1. - uOut);                    // the lit room, faintly, in its own windows
  // a bead of water: a bright fleck where the sky catches it, a dark edge where it meets the glass
  float edge = wet.z * smoothstep(.0, 1., length(wet.xy) / 12.);
  view = view * (1. - .35 * edge) + wet.z * (.05 + .22 * lum(uWin)) * pow(max(0., dot(normalize(vec3(-wet.xy, 6.)), normalize(vec3(-.5, -.7, .5)))), 6.);

  vec3 col = mix(room, view, glass);

  /* on the roof the rain is in the air: fine streaks, and the far city going to mist */
  if (uOut > .5 && uRain > 0.) {
    float s = 0.;
    for (int k = 0; k < 2; k++) {
      float fk = float(k); vec2 q = vec2((px.x + px.y * .06) / (3.2 + fk * 2.), px.y / (110. + fk * 60.) - uTime * (7. - fk * 2.)); vec2 id = floor(q);
      float f = fract(q.y); s += smoothstep(.22, 0., abs(fract(q.x) - .5)) * step(.9 - uRain * .08, h21(id + fk * 7.)) * smoothstep(0., .25, f) * smoothstep(1., .5, f);
    }
    col = mix(col, vec3(lum(col)) * vec3(.9, .94, 1.), uRain * .2) + s * (.05 + .1 * lum(uWin)) * uRain;
  }
  gl_FragColor = vec4(clamp(col, 0., 1.), 1.);
}`;

/* ---------- the renderer: one WebGL context, shared by every room */
export function createSky(coarse) {
  const cv = document.createElement('canvas'); cv.width = coarse ? 1400 : IW; cv.height = Math.round(cv.width * IH / IW);
  const gl = cv.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' }); if (!gl) return null;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  let prog;
  try { prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(prog); if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog)); }
  catch (e) { console.warn('sky: shader', e); return null; }
  gl.useProgram(prog); gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const a = gl.getAttribLocation(prog, 'a'); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
  const U = {}; for (const n of ['uImg', 'uMask', 'uAmb', 'uSpill', 'uWin', 'uGlow', 'uNight', 'uLamp', 'uOver', 'uRain', 'uTime', 'uOut', 'uL', 'uLC']) U[n] = gl.getUniformLocation(prog, n);
  gl.uniform1i(U.uImg, 0); gl.uniform1i(U.uMask, 1); gl.viewport(0, 0, cv.width, cv.height);

  const tex = img => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); return t; };
  const held = new Map(); // room id -> its two textures. Only the last three rooms are kept on the graphics card.
  function textures(id, img, mask) {
    if (held.has(id)) { const h = held.get(id); held.delete(id); held.set(id, h); return h; }
    const h = { img: tex(img), mask: tex(mask) }; held.set(id, h);
    while (held.size > 3) { const [old, o] = held.entries().next().value; gl.deleteTexture(o.img); gl.deleteTexture(o.mask); held.delete(old); }
    return h;
  }

  return {
    width: cv.width, height: cv.height,
    // draw one room, at one moment, onto its own canvas
    draw(room, state, time, target) {
      const cfg = room.sky, L = look(cfg.outdoor ? LOOK_OUT : LOOK, state.sun), h = textures(room.id, room.img, room.maskImg);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, h.img); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, h.mask);
      gl.uniform3fv(U.uAmb, L[1]); gl.uniform3fv(U.uSpill, L[2]); gl.uniform3fv(U.uWin, L[3]); gl.uniform3fv(U.uGlow, L[4]);
      gl.uniform1f(U.uLamp, L[5]); gl.uniform1f(U.uNight, L[6]); gl.uniform1f(U.uOver, state.cloud); gl.uniform1f(U.uRain, state.rain); gl.uniform1f(U.uTime, time); gl.uniform1f(U.uOut, cfg.outdoor ? 1 : 0);
      const pos = new Float32Array(24), col = new Float32Array(18);
      (cfg.lights || []).slice(0, 6).forEach(([x, y, r, s, c], i) => { pos.set([x / 100 * IW, y / 100 * IH, r / 100 * IW, s], i * 4); col.set(c, i * 3); });
      gl.uniform4fv(U.uL, pos); gl.uniform3fv(U.uLC, col);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      target.getContext('2d').drawImage(cv, 0, 0);   // straight after drawing, while the frame is still there
    },
  };
}
