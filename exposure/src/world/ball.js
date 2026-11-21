// A 3D model in a card: the World Cup match ball. It turns slowly on its own; drag it to spin it. Loaded only when a card
// with a `model` opens, so three.js never slows the world down for anyone who doesn't click.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const cache = new Map();
const load = url => { if (!cache.has(url)) cache.set(url, new GLTFLoader().loadAsync(url)); return cache.get(url); };
export const warmModel = url => load(url).catch(() => {});

export async function mountModel(box, url, reduced) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  box.append(renderer.domElement);
  const scene = new THREE.Scene(), pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const key = new THREE.DirectionalLight(0xfff1dc, 1.6); key.position.set(2, 3, 4); scene.add(key);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 10); camera.position.set(0, 0, 0.9);

  const gltf = await load(url), ball = gltf.scene.clone(true);
  const size = new THREE.Box3().setFromObject(ball).getSize(new THREE.Vector3()).length();
  ball.scale.setScalar(0.5 / size); const spin = new THREE.Group(); spin.add(ball); scene.add(spin);
  spin.rotation.set(0.35, -0.6, 0);

  let alive = true, vx = 0, vy = reduced ? 0 : 0.004, drag = null;
  const fit = () => { const w = box.clientWidth, h = box.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
  const ro = new ResizeObserver(fit); ro.observe(box); fit();
  const el = renderer.domElement;
  el.addEventListener('pointerdown', e => { drag = [e.clientX, e.clientY]; el.setPointerCapture(e.pointerId); vx = vy = 0; box.classList.add('held'); });
  el.addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - drag[0], dy = e.clientY - drag[1]; drag = [e.clientX, e.clientY]; vy = dx * 0.01; vx = dy * 0.01; });
  const up = () => { drag = null; box.classList.remove('held'); }; el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);

  const q = new THREE.Quaternion(), ax = new THREE.Vector3();
  const tick = () => {
    if (!alive) return; requestAnimationFrame(tick);
    q.setFromAxisAngle(ax.set(1, 0, 0), vx); spin.quaternion.premultiply(q); q.setFromAxisAngle(ax.set(0, 1, 0), vy); spin.quaternion.premultiply(q);
    if (!drag) { vx *= 0.95; vy = vy * 0.97 + (reduced ? 0 : 0.004) * 0.03; }
    renderer.render(scene, camera);
  };
  tick(); box.classList.add('ready');
  return () => { alive = false; ro.disconnect(); pmrem.dispose(); scene.environment.dispose(); renderer.dispose(); renderer.forceContextLoss(); el.remove(); };
}
