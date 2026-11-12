// Look-dev harness.
//   ?skin=0..4 [&b=skin&t=0..1]      one ball on the floor
//   ?u=3.5 or ?beat=id[&o=0.5]       the world at a director position
// common: &tier=high|mid|low
import * as THREE from 'three';
import { createStudio } from '../src/gl/studio.js';
import { createBall } from '../src/gl/ball.js';
import { createWorld } from '../src/gl/world.js';
import { createDirector } from '../src/gl/director.js';
const q = new URLSearchParams(location.search);
const tier = q.get('tier') || 'high';
const st = createStudio(document.getElementById('gl'), tier);
const ball = createBall();
st.setSize(innerWidth, innerHeight);
let n = 0;
if (q.has('u') || q.has('beat')) {
  const world = createWorld(st, ball, tier), dir = createDirector(st, world, ball);
  const u = q.has('beat') ? dir.index[q.get('beat')] + +(q.get('o') || 0) : +q.get('u');
  const view = { w: innerWidth, h: innerHeight, aspect: innerWidth / innerHeight, px: 0, py: 0 };
  const intro = q.has('intro') ? +q.get('intro') : 1;
  const frame = () => { dir.update(u, n / 60, 1, intro, view); st.render(); n++; if (n === 4) document.title = 'ready'; requestAnimationFrame(frame); };
  frame(); window.__dir = dir; window.__world = world;
} else {
  const a = +(q.get('skin') || 0), b = +(q.get('b') || a), t = +(q.get('t') || 0);
  ball.setForm(a, b, t); const r = ball.radius(a, b, t);
  ball.mesh.position.set(0, r, 0); ball.mesh.rotation.set(+(q.get('rx') || 0.5), +(q.get('ry') || 0.6), +(q.get('rz') || 0.3)); st.scene.add(ball.mesh);
  const cam = (q.get('cam') || `${r * 3.2},${r * 2.1},${r * 7}`).split(',').map(Number), look = (q.get('look') || `0,${r * 0.95},0`).split(',').map(Number);
  st.camera.fov = +(q.get('fov') || 26); st.camera.position.set(...cam); st.camera.lookAt(...look); st.camera.updateProjectionMatrix();
  const fp = new THREE.Vector3(0, r, 0);
  ball.uniforms.uPxRad.value = (r / st.camera.position.distanceTo(fp)) * innerHeight / (2 * Math.tan((st.camera.fov * Math.PI) / 360));
  const frame = () => { st.setShot({ focusPoint: fp, shadowSize: Math.max(0.5, r * 5), focusDist: st.camera.position.distanceTo(fp), aperture: +(q.get('ap') || 0.25), maxBlur: 14, aoRadius: r * 1.6, time: n / 60 }); st.render(); n++; if (n === 6) document.title = 'ready'; requestAnimationFrame(frame); };
  frame();
}
window.__st = st; window.__ball = ball;
