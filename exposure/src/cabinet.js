// The trophy cabinet on the home page: as you scroll through it, one trophy turns in the middle of the screen, and
// halfway through it hands over to the next. The words and the list are plain HTML in index.html; this only adds the
// 3D. three.js and the models load when the section comes near, so nobody who doesn't scroll this far pays for them.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const outBack = t => { const c = 1.4; return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2; };
const ease = t => 1 - (1 - t) ** 3;

export async function mountCabinet(sec, box, urls, reduced, onPick) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.1;
  box.append(renderer.domElement);
  const scene = new THREE.Scene(), pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture; scene.environmentIntensity = 0.8;
  const key = new THREE.SpotLight(0xffe2bd, 16, 4, 0.55, 0.6, 1.2); key.position.set(-0.8, 1.5, 1.1); scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0xbcd4ff, 1.8); rim.position.set(1.2, 0.6, -1.4); scene.add(rim);
  const camera = new THREE.PerspectiveCamera(28, 1, 0.01, 10); camera.position.set(0, 0.01, 1.05);

  // each trophy stands 0.42 tall on the same spot, keeping its own metal finish
  const loader = new GLTFLoader(), aniso = renderer.capabilities.getMaxAnisotropy();
  const trophies = await Promise.all(urls.map(async url => {
    const model = (await loader.loadAsync(url)).scene;
    model.traverse(o => { if (!o.isMesh) return; const m = o.material; m.side = THREE.DoubleSide; m.envMapIntensity = 1.35; [m.map, m.normalMap, m.roughnessMap].forEach(t => t && (t.anisotropy = aniso)); });
    const b = new THREE.Box3().setFromObject(model), mid = b.getCenter(new THREE.Vector3()), k = 0.42 / b.getSize(new THREE.Vector3()).y;
    model.scale.setScalar(k); model.position.copy(mid).multiplyScalar(-k);
    const g = new THREE.Group(); g.add(model); g.visible = false; scene.add(g); return g;
  }));

  let alive = true, cur = -1, swapAt = 0, prev = -1;
  const fit = () => { const w = box.clientWidth, h = box.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
  const ro = new ResizeObserver(fit); ro.observe(box); fit();
  // how far through the section the reader is, 0 at the top of it, 1 at the bottom
  const progress = () => { const r = sec.getBoundingClientRect(), len = r.height - innerHeight; return len > 0 ? Math.min(1, Math.max(0, -r.top / len)) : 0; };

  const tick = now => {
    if (!alive) return; requestAnimationFrame(tick);
    const r = sec.getBoundingClientRect(); if (r.bottom < -50 || r.top > innerHeight + 50) return;   // off screen: rest
    const p = progress(), pick = Math.min(trophies.length - 1, Math.floor(p * trophies.length));
    if (pick !== cur) { prev = cur; cur = pick; swapAt = now; onPick(cur); }
    const t = reduced ? 1 : Math.min(1, (now - swapAt) / 700);
    trophies.forEach((g, i) => {
      const leaving = i === prev && t < 1, on = i === cur;
      g.visible = on || leaving; if (!g.visible) return;
      const s = on ? 0.6 + 0.4 * outBack(t) : 1 - ease(t);
      g.scale.setScalar(Math.max(0.001, s)); g.position.y = on ? (1 - Math.min(1, t * 1.2)) * -0.06 : -ease(t) * 0.05;
      // the scroll turns it: about one and a half turns across the section, plus a slow drift so it never sits dead still
      g.rotation.y = p * Math.PI * 3 * trophies.length / 2 + (reduced ? 0 : now / 9000) - 0.6;
    });
    renderer.render(scene, camera);
  };
  requestAnimationFrame(tick); box.classList.add('ready');
  return () => { alive = false; ro.disconnect(); pmrem.dispose(); renderer.dispose(); };
}
