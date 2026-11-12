// The director: one list of story beats. Each beat says where the ball is, where the camera stands and what the
// set is doing. The page maps scroll to a position in this list; everything in between is interpolated.
import * as THREE from 'three';
import { RADIUS } from './ball.js';

const lerp = THREE.MathUtils.lerp, clamp = THREE.MathUtils.clamp;
const smooth = t => t * t * (3 - 2 * t);

// cam: p/l are world positions; r/lr are offsets from the ball. side: where the subject sits (-1 left … +1 right).
// s: a mark on the ball's path, optionally [mark, offset].
export const BEATS = [
  { id: 'hero', s: 'start', cam: { p: [0.7, 1.5, 5.0], l: [-2.3, 1.0, 1.1] }, fov: 30, ap: 0.16, side: 0.5, up: -0.2, pu: -0.5, shadow: 7, fog: [30, 70] },
  { id: 'premise', s: ['start', 3.3], cam: { r: [1.7, 0.08, 2.5], lr: [0.3, 0.06, 0] }, fov: 26, ap: 0.42, side: -0.42, up: -0.62, shadow: 4, fog: [30, 70] },
  { id: 'fb-drop', s: ['edge', 1.2], cam: { r: [2.7, 0.55, 3.4], lr: [0.1, -0.1, 0] }, fov: 28, ap: 0.3, side: 0, shadow: 5, fog: [30, 70] },
  { id: 'fb-title', s: ['tunnelIn', -0.9], cam: { r: [-3.9, 0.95, 0.6], l: [13, 1.05, 1.6] }, fov: 34, ap: 0.16, side: 0.5, shadow: 6, fog: [32, 74] },
  { id: 'fb-tunnel', s: ['tunnelOut', -1.2], cam: { r: [-1.7, 0.5, 0.18], l: [20, 0.7, 1.6] }, fov: 40, ap: 0.2, side: 0, shadow: 6, fog: [32, 74] },
  { id: 'fb-fit', s: ['carpetMid', -1.6], cam: { r: [1.2, 1.5, 4.4], lr: [0.5, 0.32, 0] }, fov: 30, ap: 0.3, side: -0.36, shadow: 6, fog: [32, 74] },
  { id: 'fb-photo', s: ['carpetOut', -0.6], cam: { r: [-3.7, 1.75, 3.1], lr: [1.7, 0.35, 0] }, fov: 30, ap: 0.14, side: 0.34, shadow: 7, fog: [32, 74] },
  { id: 'bb-title', s: ['doorBefore', -0.5], cam: { p: [23.4, 1.5, 3.7], l: [28.5, 1.3, 1.5] }, fov: 30, ap: 0.12, side: 0.32, shadow: 7, fog: [34, 78] },
  { id: 'bb-door', s: ['doorAfter', 0.5], cam: { p: [26.3, 0.8, 1.72], l: [32, 1.05, 1.6] }, fov: 34, ap: 0.14, side: 0, shadow: 7, fog: [34, 78] },
  { id: 'bb-play1', s: 'play1', cam: { p: [29.0, 2.5, 9.2], l: [36.3, 1.75, 1.6] }, fov: 30, ap: 0.08, side: 0.36, shadow: 9, fog: [36, 84] },
  { id: 'bb-play2', s: 'play2', cam: { r: [-2.1, 0.75, 3.6], lr: [1.3, 0.75, 0] }, fov: 30, ap: 0.18, side: 0.34, shadow: 8, fog: [36, 84] },
  { id: 'bb-play3', s: 'play3', cam: { r: [-3.3, 1.2, 2.1], l: [37.4, 2.0, 1.6] }, fov: 36, ap: 0.12, side: 0.3, shadow: 8, fog: [36, 84] },
  { id: 'bb-shot', s: ['rim', 0.45], cam: { p: [36.9, 4.0, 4.3], l: [38.5, 3.0, 1.6] }, fov: 30, ap: 0.2, side: 0, shadow: 8, fog: [36, 84] },
  { id: 'bb-brief', s: ['bbExit', -1.6], cam: { p: [35.2, 11.5, 6.4], l: [36.2, 0.5, 1.55] }, fov: 30, ap: 0.04, side: 0.4, shadow: 9, fog: [40, 90], focus: [36, 0.5, 1.6] },
  { id: 'nfl-title', s: ['toField', 1.9], cam: { p: [42.6, 1.7, 10.6], l: [50.8, 1.9, 3.2] }, fov: 32, ap: 0.1, side: 0.46, up: -0.3, shadow: 12, fog: [40, 90] },
  { id: 'nfl-d1', s: 'd1', cam: { r: [0.5, 0.78, 3.0], lr: [0.75, 0.2, 0] }, fov: 30, ap: 0.26, side: -0.36, shadow: 9, fog: [40, 90] },
  { id: 'nfl-d2', s: 'd2', cam: { r: [0.5, 0.78, 3.0], lr: [0.75, 0.2, 0] }, fov: 30, ap: 0.26, side: -0.36, shadow: 9 },
  { id: 'nfl-d3', s: 'd3', cam: { r: [0.5, 0.78, 3.0], lr: [0.75, 0.2, 0] }, fov: 30, ap: 0.26, side: -0.36, shadow: 9 },
  { id: 'nfl-d4', s: 'd4', cam: { r: [0.2, 0.95, 3.3], lr: [0.8, 0.22, 0] }, fov: 30, ap: 0.24, side: -0.36, shadow: 9 },
  { id: 'nfl-d5', s: 'd5', cam: { r: [-0.6, 1.05, 3.6], lr: [1.1, 0.28, 0] }, fov: 30, ap: 0.22, side: -0.36, shadow: 9 },
  { id: 'nfl-d6', s: 'd6', cam: { r: [-1.7, 1.3, 4.0], lr: [1.6, 0.45, 0] }, fov: 30, ap: 0.2, side: -0.36, shadow: 10 },
  { id: 'nfl-d7', s: 'd7', cam: { p: [64.6, 11.5, 18.0], l: [69.2, 1.0, 3.3] }, fov: 34, ap: 0.05, side: -0.4, shadow: 12, tokens: 0, rule: 0 },
  { id: 'nfl-xi', s: 'huddle', cam: { p: [57.0, 19.5, 8.4], l: [57.2, 0.5, 3.75] }, fov: 30, ap: 0.03, side: 0.42, shadow: 10, focus: [57.4, 0.5, 3.2], tokens: 1, rule: 0 },
  { id: 'nfl-xi-end', s: 'kick', cam: { p: [57.5, 19.5, 8.4], l: [57.7, 0.5, 3.75] }, fov: 30, ap: 0.03, side: 0.42, shadow: 10, focus: [57.4, 0.5, 3.2], tokens: 1, rule: 10 },
  { id: 'tn-title', s: ['kick', 2.5], cam: { p: [62.0, 1.3, 8.0], l: [73.0, 5.6, 3.2] }, fov: 36, ap: 0.08, side: 0.56, shadow: 14, fog: [44, 100], tokens: 0, court: 0, walls: 0 },
  { id: 'tn-land', s: ['kickLand', 2.2], cam: { r: [-2.4, 1.0, 3.8], lr: [2.0, 0.4, 0] }, fov: 30, ap: 0.2, side: 0, shadow: 12, fog: [44, 100] },
  { id: 'tn-f1', s: 'f1', cam: { p: [80.5, 15.5, 31.5], l: [94.6, 0.2, 3.6] }, fov: 30, ap: 0.02, side: 0.36, shadow: 24, fog: [60, 130], focus: [94, 0.5, 3.2], court: 0, walls: 0 },
  { id: 'tn-f2', s: 'f2', cam: { p: [109.5, 12.5, 20.5], l: [99.6, 0.4, 3.0] }, fov: 30, ap: 0.02, side: -0.36, shadow: 24, fog: [60, 130], focus: [100, 0.5, 3.2], court: 1, walls: 0 },
  { id: 'tn-f3', s: 'f3', cam: { p: [82.5, 9.5, 24.5], l: [94.6, 1.3, 3.2] }, fov: 30, ap: 0.02, side: 0.36, shadow: 24, fog: [60, 130], focus: [95, 1, 3.2], court: 2, walls: 1 },
  { id: 'ms-title', s: ['grow1', -0.7], cam: { r: [3.1, 0.55, 3.6], lr: [1.0, 0.3, 0] }, fov: 30, ap: 0.24, side: -0.3, shadow: 8, fog: [30, 80], court: 2, walls: 0, lights: 0 },
  { id: 'ms-lights', s: 'lights', cam: { p: [112.6, 1.3, 5.6], l: [121, 3.0, 3.2] }, fov: 40, ap: 0.08, side: 0, shadow: 12, fog: [34, 84], lights: 5 },
  { id: 'ms-markets', s: ['lights', 4.2], cam: { r: [-4.0, 3.5, 6.0], lr: [2.4, 0, -0.3] }, fov: 32, ap: 0.08, side: -0.34, shadow: 12, fog: [34, 84], lights: 6.6 },
  { id: 'ms-photo', s: ['lights', 10.4], cam: { r: [3.2, 1.0, 4.3], lr: [-0.5, 0.3, 0] }, fov: 30, ap: 0.16, side: 0.34, shadow: 12, fog: [34, 84], lights: 6.6 },
  { id: 'ms-ai', s: 'pit', cam: { p: [146.2, 1.35, 7.9], l: [149.9, 0.55, 3.2] }, fov: 30, ap: 0.14, side: -0.34, shadow: 9, fog: [30, 70] },
  { id: 'lineup', s: 'lineup', cam: { p: [169.3, 0.72, 10.6], l: [169.3, 0.34, 3.2] }, fov: 22, ap: 0.1, side: 0, shadow: 7, fog: [22, 50], focus: [169.6, 0.2, 3.2], up: 0.0, pu: 0.02, zp: 2.3 },
];

export function createDirector(studio, world, ball) {
  const { camera } = studio, mk = world.marks;
  // resolve marks and carry set parameters forward so each beat only states what changes
  const carry = { tokens: 0, rule: 0, court: 0, walls: 0, lights: 0 }; let fog = [30, 70];
  const beats = BEATS.map(b => {
    const s = typeof b.s === 'string' ? mk[b.s] : mk[b.s[0]] + b.s[1];
    for (const k in carry) if (b[k] !== undefined) carry[k] = b[k];
    if (b.fog) fog = b.fog;
    return { fov: 30, ap: 0.15, side: 0, shadow: 6, up: 0, ...b, s, fog, params: { ...carry } };
  });
  const index = Object.fromEntries(beats.map((b, i) => [b.id, i]));

  const group = new THREE.Group(); group.add(ball.mesh); studio.scene.add(group);
  const pA = new THREE.Vector3(), pB = new THREE.Vector3(), lA = new THREE.Vector3(), lB = new THREE.Vector3(), pos = new THREE.Vector3(), look = new THREE.Vector3(), tmp = new THREE.Vector3(), foc = new THREE.Vector3();
  const camPos = new THREE.Vector3(), camLook = new THREE.Vector3(); let first = true;
  let tall = false; // on a tall screen the ball itself is the target, so it is never off to one side
  const resolve = (b, bp, p, l) => {
    const c = b.cam;
    if (c.p) p.fromArray(c.p); else p.copy(bp).add(tmp.fromArray(c.r));
    if (c.l) l.fromArray(c.l); else { l.copy(bp).add(tmp.fromArray(c.lr)); if (tall) l.x = bp.x; }
  };
  const params = {}, bgFog = new THREE.Fog(studio.bg.clone(), 30, 70); studio.scene.fog = bgFog;
  const SQ = [0.1, 0.2, 0.05, 0.22, 0];

  return {
    beats, index, snap() { first = true; },
    // u: position in the beat list (2.5 = halfway between beat 2 and 3). intro: 0..1 opening build. dt in seconds.
    update(u, time, dt, intro, view) {
      u = clamp(u, 0, beats.length - 1);
      const i = Math.min(beats.length - 2, Math.floor(u)), A = beats[i], B = beats[i + 1], raw = u - i;
      const f = smooth(clamp((raw - 0.1) / 0.8, 0, 1)); // settle at each end so the reader gets a held frame
      const s = lerp(A.s, B.s, f);
      for (const k in A.params) params[k] = lerp(A.params[k], B.params[k], f);
      params.intro = intro;
      const res = world.update(s, params, time), b = res.ball;
      // ball
      const sk = (SQ[b.form.a] * (1 - b.form.t) + SQ[b.form.b] * b.form.t) * b.squash;
      group.position.set(b.pos.x, b.pos.y - b.r, b.pos.z); group.scale.set(1 + sk * 0.5, 1 - sk, 1 + sk * 0.5);
      ball.mesh.position.set(0, b.r, 0); ball.mesh.quaternion.copy(b.quat);
      ball.setForm(b.form.a, b.form.b, b.form.t);
      const drop = intro < 1 ? Math.max(0, 1 - Math.max(0, (intro - 0.62) / 0.3)) : 0; // the ball falls in at the end of the opening
      group.position.y += drop * drop * 2.4; ball.mesh.visible = intro > 0.6;
      // camera
      tall = view.aspect < 0.85; resolve(A, b.pos, pA, lA); resolve(B, b.pos, pB, lB);
      pos.lerpVectors(pA, pB, f); look.lerpVectors(lA, lB, f);
      const arc = Math.sin(f * Math.PI) * Math.min(1.2, pA.distanceTo(pB) * 0.05); pos.y += arc; // lift a little through long moves
      const portrait = view.aspect < 0.85;
      if (portrait) { tmp.subVectors(pos, look).multiplyScalar(lerp(A.zp ?? 0.55, B.zp ?? 0.55, f) * clamp(1.4 - view.aspect, 0.5, 1)); pos.add(tmp); }
      if (intro < 1) { const e = 1 - smooth(intro); pos.x += e * 2.6; pos.y += e * 2.2; pos.z += e * 5.5; }
      // pointer parallax, a few centimetres
      pos.x += view.px * 0.05 * pos.distanceTo(look) * 0.12; pos.y += -view.py * 0.03 * pos.distanceTo(look) * 0.12;
      if (first) { camPos.copy(pos); camLook.copy(look); first = false; }
      const k = 1 - Math.exp(-dt * 9); camPos.lerp(pos, k); camLook.lerp(look, k);
      camera.position.copy(camPos); camera.lookAt(camLook);
      camera.fov = lerp(A.fov, B.fov, f) * (portrait ? 1.12 : 1);
      const side = portrait ? 0 : lerp(A.side, B.side, f), upv = portrait ? lerp(A.pu ?? 0.3, B.pu ?? 0.3, f) : lerp(A.up, B.up, f);
      camera.setViewOffset(view.w, view.h, -side * view.w * 0.5, upv * view.h * 0.5, view.w, view.h);
      camera.updateProjectionMatrix();
      // lens and light
      const fA = A.focus, fB = B.focus; foc.copy(b.pos);
      if (fA || fB) { pA.copy(fA ? tmp.fromArray(fA) : b.pos); pB.copy(fB ? tmp.fromArray(fB) : b.pos); foc.lerpVectors(pA, pB, f); }
      const dist = tmp.subVectors(foc, camPos).dot(camera.getWorldDirection(pA));
      const shadow = lerp(A.shadow, B.shadow, f) * (portrait ? 1.25 : 1);
      bgFog.near = lerp(A.fog[0], B.fog[0], f) * (portrait ? 1.5 : 1); bgFog.far = lerp(A.fog[1], B.fog[1], f) * (portrait ? 1.5 : 1); bgFog.color.copy(studio.bg);
      studio.setShot({ focusPoint: foc, shadowSize: Math.round(shadow * 2) / 2, focusDist: Math.max(0.2, dist), aperture: lerp(A.ap, B.ap, f), maxBlur: 15, time, flash: res.flash * 0.1, aoRadius: clamp(shadow * 0.07, 0.12, 1.4) });
      ball.uniforms.uPxRad.value = (b.r / Math.max(0.2, camPos.distanceTo(b.pos))) * (view.h * studio.renderer.getPixelRatio()) / (2 * Math.tan((camera.fov * Math.PI) / 360)) * 1.0;
      return { s, ball: b, i, f };
    },
  };
}
export { RADIUS };
