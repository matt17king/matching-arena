// The hero: one photoreal ball on a seamless studio floor. Drag it to spin it; change sport and the ball,
// the studio colour and the headline change together.
import * as THREE from 'three';
import { createStudio } from './gl/studio.js';
import { createBall } from './gl/ball.js';

const LIFT = [0.11, 0.12, 0.145, 0.0335, 0.36]; // how high each form's centre sits so it can turn freely on the floor

export function createHero({ canvas, section, tier, ideas, reduced, onReady }) {
  const studio = createStudio(canvas, tier), ball = createBall();
  const { scene, camera, renderer } = studio;
  const group = new THREE.Group(); group.add(ball.mesh); scene.add(group);

  let from = 0, to = 0, t = 1;                 // skin now, skin next, progress of the change
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.5, 0.7, 0.2)), dq = new THREE.Quaternion();
  const vel = new THREE.Vector2(0.25, 0), axisY = new THREE.Vector3(0, 1, 0), axisX = new THREE.Vector3(1, 0, 0), tmp = new THREE.Vector3();
  const bgNow = new THREE.Color(ideas[0].bg), bgTo = new THREE.Color(ideas[0].bg), focus = new THREE.Vector3();
  let w = 1, h = 1, visible = true, dragging = false, px = 0, py = 0, last = performance.now(), slow = 0, frames = 0, checks = 0;

  function size() {
    w = section.clientWidth; h = section.clientHeight;
    const cap = Math.sqrt({ high: 3.2e6, mid: 2.2e6, low: 1.4e6 }[tier] / (w * h));
    renderer.setPixelRatio(Math.max(0.75, Math.min(devicePixelRatio || 1, studio.Q.dpr, cap)));
    studio.setSize(w, h);
  }
  size(); addEventListener('resize', size);
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(section);

  // drag to spin, with a little weight
  canvas.addEventListener('pointerdown', e => { dragging = true; px = e.clientX; py = e.clientY; canvas.setPointerCapture(e.pointerId); section.classList.add('grab'); });
  canvas.addEventListener('pointermove', e => { if (!dragging) return; vel.set((e.clientX - px) * 0.012, (e.clientY - py) * 0.012); px = e.clientX; py = e.clientY; });
  const up = () => { dragging = false; section.classList.remove('grab'); };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!visible || document.hidden) return;
    if (t < 1) t = Math.min(1, t + dt / (reduced ? 0.01 : 1.15));
    const e = t * t * (3 - 2 * t), r = LIFT[from] * (1 - e) + LIFT[to] * e;
    ball.setForm(from, to, t >= 1 ? 0 : t); if (t >= 1 && from !== to) { from = to; ball.setForm(to, to, 0); }
    // spin: drag sets it, friction slows it, and it never quite stops
    dq.setFromAxisAngle(axisY, vel.x); q.premultiply(dq); dq.setFromAxisAngle(axisX, vel.y); q.premultiply(dq);
    if (!dragging) { vel.x += (0.004 - vel.x) * (1 - Math.exp(-dt * 1.6)); vel.y *= Math.exp(-dt * 2.2); } else vel.multiplyScalar(0.6);
    const hop = t < 1 ? Math.sin(Math.PI * t) : 0;
    if (t < 1) { dq.setFromAxisAngle(axisY, dt * 9 * Math.sin(Math.PI * t)); q.premultiply(dq); }
    ball.mesh.quaternion.copy(q);
    const sq = t < 1 ? Math.max(0, Math.sin(Math.PI * t * 2 - 4.6)) * 0.08 : 0;
    group.position.set(0, hop * r * 1.5, 0); group.scale.set(1 + sq * 0.5, 1 - sq, 1 + sq * 0.5); ball.mesh.position.set(0, r, 0);
    // camera keeps the object the same size on screen whatever it has become
    const tall = w / h < 0.85;
    camera.fov = tall ? 30 : 24; camera.position.set(r * 2.2, r * 2.0, r * (tall ? 10.5 : 8.6)); camera.lookAt(tmp.set(0, r * 0.95, 0));
    camera.setViewOffset(w, h, tall ? 0 : -w * 0.27, tall ? -h * 0.02 : h * 0.04, w, h); camera.updateProjectionMatrix();
    bgNow.lerp(bgTo, 1 - Math.exp(-dt * 4)); studio.setBg(bgNow);
    focus.set(0, r, 0);
    const dist = camera.position.distanceTo(focus);
    studio.setShot({ focusPoint: focus, shadowSize: Math.max(0.4, r * 6), focusDist: dist, aperture: 0.16, maxBlur: 14, aoRadius: r * 1.6, time: now / 1000, vignette: 0.16 });
    ball.uniforms.uPxRad.value = (r / dist) * (h * renderer.getPixelRatio()) / (2 * Math.tan((camera.fov * Math.PI) / 360));
    studio.render();
    if (checks < 3) { frames++; if (dt > 0.034) slow++; if (frames >= 50) { if (slow > 28) { if (studio.degrade()) size(); else checks = 3; } checks++; frames = 0; slow = 0; } }
  }
  studio.setBg(bgNow); requestAnimationFrame(frame); requestAnimationFrame(() => onReady && onReady());

  return {
    set(i) { const idea = ideas[i]; if (t < 1) { from = to; } to = idea.skin; t = from === to ? 1 : 0; bgTo.set(idea.bg); },
    flick() { vel.x = 0.3; },
  };
}
