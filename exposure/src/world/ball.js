// A 3D model on show: the World Cup match ball. When its card opens, the room dims and the ball rises into the space
// beside the card under a warm spotlight, turns slowly and floats over its own soft shadow. Drag to spin it; scroll or
// pinch to look closer. Loaded only when a card with a `model` opens, so three.js never slows the world down otherwise.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const cache = new Map();
const load = url => { if (!cache.has(url)) cache.set(url, new GLTFLoader().loadAsync(url)); return cache.get(url); };
export const warmModel = url => load(url).catch(() => {});

// a soft round shadow, drawn once
function shadowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(0,0,0,.7)'); r.addColorStop(.45, 'rgba(0,0,0,.32)'); r.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = r; g.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const outBack = t => { const c = 1.4; return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2; };

export async function mountModel(box, url, reduced) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.08;
  box.append(renderer.domElement);
  const scene = new THREE.Scene(), pmrem = new THREE.PMREMGenerator(renderer), env = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
  scene.environment = env; scene.environmentIntensity = 0.75;
  const key = new THREE.SpotLight(0xffe2bd, 14, 4, 0.5, 0.6, 1.2); key.position.set(-0.7, 1.4, 1.1); scene.add(key, key.target);   // warm, from above
  const rim = new THREE.DirectionalLight(0xbcd4ff, 1.6); rim.position.set(1.2, 0.6, -1.4); scene.add(rim);                           // cool edge from behind
  const fill = new THREE.DirectionalLight(0xffffff, 0.35); fill.position.set(1, -0.3, 1); scene.add(fill);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 10), Z = 1.05; camera.position.set(0, 0.02, Z);

  const gltf = await load(url), model = gltf.scene.clone(true), aniso = renderer.capabilities.getMaxAnisotropy();
  // a match ball has a glossy coat over its print: the same maps, with a clear coat on top
  model.traverse(o => {
    if (!o.isMesh) return; const m = o.material;
    [m.map, m.normalMap, m.roughnessMap].forEach(t => t && (t.anisotropy = aniso));
    o.material = new THREE.MeshPhysicalMaterial({ map: m.map, normalMap: m.normalMap, normalScale: new THREE.Vector2(1.15, 1.15), roughnessMap: m.roughnessMap, metalnessMap: m.metalnessMap,
      roughness: 1, metalness: m.metalness ?? 0, clearcoat: 0.65, clearcoatRoughness: 0.2 });
  });
  const box3 = new THREE.Box3().setFromObject(model), mid = box3.getCenter(new THREE.Vector3()), k = 0.3 / box3.getSize(new THREE.Vector3()).x;
  model.scale.setScalar(k); model.position.copy(mid).multiplyScalar(-k);
  const spin = new THREE.Group(), lift = new THREE.Group(); spin.add(model); lift.add(spin); scene.add(lift);
  spin.rotation.set(0.25, -0.9, 0.12);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42), new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -0.2; scene.add(shadow);

  let alive = true, vx = 0, vy = reduced ? 0 : 0.22, z = Z, zTo = Z;
  const idle = reduced ? 0 : 0.0035, born = performance.now(), el = renderer.domElement;
  const fit = () => { const w = box.clientWidth, h = box.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w / h < 0.8 ? 36 : 30; camera.updateProjectionMatrix(); };
  const ro = new ResizeObserver(fit); ro.observe(box); fit();

  // drag to spin, scroll or pinch to look closer
  const pts = new Map(); let pinch = 0;
  el.addEventListener('pointerdown', e => { pts.set(e.pointerId, [e.clientX, e.clientY]); el.setPointerCapture(e.pointerId); vx = vy = 0; box.classList.add('held'); if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = Math.hypot(a[0] - b[0], a[1] - b[1]); } });
  el.addEventListener('pointermove', e => {
    const was = pts.get(e.pointerId); if (!was) return; pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 2) { const [a, b] = [...pts.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (d) zTo = THREE.MathUtils.clamp(zTo * pinch / d, 0.6, 1.4); pinch = d; return; }
    vy = (e.clientX - was[0]) * 0.008; vx = (e.clientY - was[1]) * 0.008;
  });
  const up = e => { pts.delete(e.pointerId); if (!pts.size) box.classList.remove('held'); };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  el.addEventListener('wheel', e => { e.preventDefault(); zTo = THREE.MathUtils.clamp(zTo * Math.exp(e.deltaY * 0.0012), 0.6, 1.4); }, { passive: false });

  const q = new THREE.Quaternion(), X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0);
  const tick = now => {
    if (!alive) return; requestAnimationFrame(tick);
    const t = Math.max(0, now - born) / 1000, intro = reduced ? 1 : Math.min(1, t / 1.1), s = reduced ? 1 : outBack(intro);
    lift.scale.setScalar(0.55 + 0.45 * s); lift.position.y = (1 - s) * -0.12 + (reduced ? 0 : Math.sin(t * 1.3) * 0.008);
    shadow.scale.setScalar(0.85 - lift.position.y * 2.2); shadow.material.opacity = Math.min(1, intro * 1.4) * (0.9 + lift.position.y * 4);
    q.setFromAxisAngle(X, vx); spin.quaternion.premultiply(q); q.setFromAxisAngle(Y, vy); spin.quaternion.premultiply(q);
    if (!pts.size) { vx *= 0.94; vy = vy * 0.965 + idle * 0.035; }
    z += (zTo - z) * 0.12; camera.position.z = z; camera.lookAt(0, -0.01, 0);
    renderer.render(scene, camera);
  };
  requestAnimationFrame(tick); box.classList.add('ready');
  return () => { alive = false; ro.disconnect(); env.dispose(); pmrem.dispose(); shadow.material.map.dispose(); renderer.dispose(); renderer.forceContextLoss(); el.remove(); box.classList.remove('ready', 'held'); };
}
