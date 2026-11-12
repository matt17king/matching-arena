// The virtual world: a penthouse above London, seen from the corner like an architect's model.
// The camera never changes angle; you slide the room under it and move closer. One switch turns the lights
// on and off: on, it is a bright, even interior; off, the room is lit only by the site's own blue and red.
import { root, $, $$, clamp, lerp, outExpo, params, reduced, split, smear, grainURL } from '../kit.js';
import '../styles/world.css';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { buildTextures } from './textures.js';
import { buildApartment } from './apartment.js';

{ const g = grainURL(); $('[data-grain]').style.backgroundImage = g; root.style.setProperty('--grain', g); }
$$('[data-split]').forEach(split);
requestAnimationFrame(() => $$('.wd-gate [data-r]').forEach(el => { el.classList.add('in'); if (el.dataset.r === 'smear') smear(el); }));

const canvas = $('[data-world]'), gate = $('[data-gate]'), enter = $('[data-enter]'), enterLabel = $('[data-enter-label]');
const sw = $('[data-lights]'), swState = $('[data-lights-state]'), dotsEl = $('[data-dots]'), glow = $('[data-glow]');

let renderer = null;
try {
  if (params.has('nogl')) throw new Error('off');
  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
} catch { renderer = null; }

if (!renderer) {
  root.classList.add('wd-nogl'); enter.hidden = true; $('[data-gate-note]').hidden = false;
} else start();

function start() {
  const RAVEN = 0x090303, coarse = matchMedia('(pointer: coarse)').matches;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, coarse ? 1.5 : 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.setClearColor(RAVEN, 1);

  const scene = new THREE.Scene(); scene.background = new THREE.Color(RAVEN); scene.fog = new THREE.Fog(RAVEN, 90, 122);
  const pmrem = new THREE.PMREMGenerator(renderer); scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture; pmrem.dispose();

  const apt = buildApartment(buildTextures(), { shadowSize: coarse ? 2048 : 4096 }); scene.add(apt.world);

  /* ---------- the camera: an isometric view from the corner, fixed. `view` is the point on the floor at the middle of the screen, and how close. */
  const DIR = new THREE.Vector3(1, 1.5, 1).normalize(), DIST = 80, SIN = DIR.y; // a little steeper than true isometric; SIN is the sine of its elevation
  const RIGHT = new THREE.Vector3(1, 0, -1).normalize(), UP = new THREE.Vector3(-1, 0, -1).normalize(); // screen right and screen up, along the floor
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 400);
  const view = { x: apt.focus.x, z: apt.focus.z, zoom: 0.86 }, goal = { ...view, zoom: 0.86 };
  let W = 1, Hh = 1, baseH = 17, light = 0, lightGoal = 0, lightFrom = 0, lightT0 = 0, lightDur = 1, entered = false, dirty = true, running = false;

  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: coarse ? 2 : 4 }));
  composer.addPass(new RenderPass(scene, cam));
  // ambient occlusion: the soft darkening where things meet, which is most of what makes a model like this read as solid
  const ao = new GTAOPass(scene, cam, 4, 4); ao.updateGtaoMaterial({ radius: 0.7, distanceExponent: 1.2, thickness: 1.2, scale: 1.25, samples: coarse ? 8 : 12, screenSpaceRadius: false }); if (!params.has('noao')) composer.addPass(ao);
  const bloom = new UnrealBloomPass(new THREE.Vector2(4, 4), 0.2, 0.7, 0.9); composer.addPass(bloom);
  composer.addPass(new OutputPass());

  function fit() {
    W = innerWidth; Hh = innerHeight; renderer.setSize(W, Hh, false); composer.setSize(W, Hh); composer.setPixelRatio(renderer.getPixelRatio());
    // the whole floor is about 21 m across and 16 m tall on screen. Show all of it where the screen allows;
    // on a tall phone it sits smaller, in the middle, and can be pinched closer.
    const tall = 16.3 * 1.2, wide = (21.3 * 1.08) / (W / Hh); baseH = clamp(wide, tall, tall * 1.95);
    dirty = true; kick();
  }
  function place() {
    const h = baseH / view.zoom, w = h * (W / Hh);
    cam.left = -w / 2; cam.right = w / 2; cam.top = h / 2; cam.bottom = -h / 2; cam.updateProjectionMatrix();
    // the header takes a little off the top, so the room sits a touch below centre
    const tx = view.x + UP.x * h * 0.02 / SIN, tz = view.z + UP.z * h * 0.02 / SIN;
    cam.position.set(tx + DIR.x * DIST, DIR.y * DIST, tz + DIR.z * DIST); cam.lookAt(tx, 0, tz);
  }

  /* ---------- things in the room that open something */
  const dots = apt.items.map(it => {
    const a = document.createElement('a'); a.className = 'wd-dot'; a.href = it.href; a.tabIndex = -1;
    a.innerHTML = `<i aria-hidden="true"></i><span><b>${it.label}</b><em class="mono">${it.note} →</em></span>`; dotsEl.append(a); return { a, at: it.at };
  });
  const v = new THREE.Vector3();
  function placeDots() { for (const d of dots) { v.copy(d.at).project(cam); d.a.style.transform = `translate3d(${((v.x * 0.5 + 0.5) * W).toFixed(1)}px,${((-v.y * 0.5 + 0.5) * Hh).toFixed(1)}px,0)`; } }

  /* ---------- light */
  function applyLight(L) {
    apt.setLight(L);
    scene.environmentIntensity = lerp(0.1, 0.4, L); renderer.toneMappingExposure = lerp(1.1, 0.95, L);
    bloom.strength = lerp(0.55, 0.14, L); bloom.threshold = lerp(0.4, 0.95, L); bloom.radius = lerp(0.85, 0.6, L);
    glow.style.opacity = ((1 - L) * 0.9).toFixed(3);
  }
  function setLights(onNow, instant) {
    lightGoal = onNow ? 1 : 0; lightFrom = light; lightT0 = performance.now(); lightDur = reduced || instant ? 0 : onNow ? 900 : 1300;
    sw.setAttribute('aria-pressed', onNow); swState.textContent = onNow ? 'On' : 'Off'; root.classList.toggle('wd-dark', !onNow); kick();
  }
  sw.addEventListener('click', () => setLights(lightGoal < 0.5));
  addEventListener('keydown', e => { if (entered && (e.key === 'l' || e.key === 'L') && !e.metaKey && !e.ctrlKey && !e.altKey) setLights(lightGoal < 0.5); });

  /* ---------- the loop: only draws while something is changing */
  function kick() { if (!running) { running = true; requestAnimationFrame(tick); } }
  let last = 0;
  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now; let moving = false;
    if (light !== lightGoal) { const t = lightDur ? clamp((now - lightT0) / lightDur) : 1; light = lerp(lightFrom, lightGoal, lightGoal ? outExpo(t) : t * t * (3 - 2 * t)); if (t >= 1) light = lightGoal; applyLight(light); moving = true; dirty = true; }
    const k = reduced ? 1 : 1 - Math.exp(-dt * 9);
    for (const key of ['x', 'z', 'zoom']) { const d = goal[key] - view[key]; if (Math.abs(d) > 0.0004) { view[key] += d * k; moving = true; dirty = true; } else view[key] = goal[key]; }
    if (dirty) { place(); composer.render(); placeDots(); dirty = false; }
    if (moving) requestAnimationFrame(tick); else running = false;
  }

  /* ---------- moving around: drag slides the room, wheel and pinch move closer, toward wherever you point */
  const unit = () => baseH / view.zoom / Hh; // metres per pixel on screen
  const bound = () => { goal.x = clamp(goal.x, apt.bounds.x[0], apt.bounds.x[1]); goal.z = clamp(goal.z, apt.bounds.z[0], apt.bounds.z[1]); };
  function slide(dx, dy) { const u = unit(); goal.x += -RIGHT.x * dx * u + UP.x * dy * u / SIN; goal.z += -RIGHT.z * dx * u + UP.z * dy * u / SIN; bound(); kick(); }
  function zoomAt(f, px, py) {
    const z0 = goal.zoom, z1 = clamp(z0 * f, 0.86, 3.4); if (z1 === z0) return;
    // keep the point under the pointer where it is
    const ox = px - W / 2, oy = py - Hh / 2, u0 = baseH / z0 / Hh, u1 = baseH / z1 / Hh, du = u0 - u1;
    goal.x += RIGHT.x * ox * du - UP.x * oy * du / SIN; goal.z += RIGHT.z * ox * du - UP.z * oy * du / SIN; goal.zoom = z1; bound(); kick();
  }
  const ptr = new Map(); let pinch = 0;
  canvas.addEventListener('pointerdown', e => { if (!entered) return; canvas.setPointerCapture(e.pointerId); ptr.set(e.pointerId, { x: e.clientX, y: e.clientY }); canvas.classList.add('drag'); pinch = 0; });
  canvas.addEventListener('pointermove', e => {
    const p = ptr.get(e.pointerId); if (!p) return; const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
    if (ptr.size === 1) slide(dx, dy);
    else if (ptr.size === 2) { const [a, b] = [...ptr.values()], d = Math.hypot(a.x - b.x, a.y - b.y); if (pinch) zoomAt(d / pinch, (a.x + b.x) / 2, (a.y + b.y) / 2); pinch = d; slide(dx / 2, dy / 2); }
  });
  const lift = e => { ptr.delete(e.pointerId); pinch = 0; if (!ptr.size) canvas.classList.remove('drag'); };
  canvas.addEventListener('pointerup', lift); canvas.addEventListener('pointercancel', lift);
  addEventListener('wheel', e => { if (!entered) return; e.preventDefault(); zoomAt(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0016)), e.clientX, e.clientY); }, { passive: false });
  addEventListener('keydown', e => { if (!entered) return; const s = 60; if (e.key === 'ArrowLeft') slide(s, 0); else if (e.key === 'ArrowRight') slide(-s, 0); else if (e.key === 'ArrowUp') slide(0, s); else if (e.key === 'ArrowDown') slide(0, -s); else if (e.key === '+' || e.key === '=') zoomAt(1.25, W / 2, Hh / 2); else if (e.key === '-') zoomAt(0.8, W / 2, Hh / 2); });

  /* ---------- the way in: the room waits in the dark behind the title; entering switches the lights on */
  function go() {
    if (entered) return; entered = true; root.classList.add('wd-in'); gate.setAttribute('aria-hidden', 'true'); gate.inert = true;
    dots.forEach(d => (d.a.tabIndex = 0)); goal.zoom = 1; setLights(true);
  }
  enter.addEventListener('click', go);

  addEventListener('resize', fit);
  applyLight(0); root.classList.add('wd-dark'); fit();
  // compile and draw once before offering the way in, so the first thing seen is the finished room
  requestAnimationFrame(() => { place(); composer.render(); placeDots(); enter.disabled = false; enterLabel.textContent = 'Enter'; root.classList.add('wd-ready'); if (params.has('in')) { go(); if (params.has('dark')) setLights(false, true); } });
  if (params.has('debug')) window.__wd = { scene, cam, view, goal, apt, setLights, kick, renderer };
}
