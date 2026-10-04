// Kick-off loader: dot-matrix world map, seven market zones light, dots fly into MK, doors open.
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease3 = x => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const ease4 = x => (x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2);
const sleep = ms => new Promise(r => setTimeout(r, ms));

function zoneOf(lon, lat) {
  if (lon > -8.5 && lon < 2 && lat > 49.8 && lat < 59.5) return 0; // UK
  if (lon < -52 && lat > 29) return 1; // North America
  if (lon >= -120 && lon < -30 && lat <= 29) return 2; // LATAM
  if (lon > -18 && lon < 63 && lat > 12 && lat < 42 && !(lat > 36 && lon < 26)) return 3; // MENA
  if (lon > 92 && lon < 142 && lat > -11 && (lat < 21 || (lon < 101 && lat < 28))) return 4; // SEA
  if (lat < -10 && lon > 110) return 5; // ANZ
  return 6; // ROW
}

async function landMask() {
  try {
    const [topo, tc] = await Promise.all([
      import('world-atlas/land-110m.json').then(m => m.default),
      import('topojson-client'),
    ]);
    const geo = tc.feature(topo, topo.objects.land);
    const geoms = geo.features ? geo.features.map(f => f.geometry) : [geo.geometry];
    const polys = [];
    geoms.forEach(g => { if (!g) return; if (g.type === 'Polygon') polys.push(g.coordinates); else if (g.type === 'MultiPolygon') polys.push(...g.coordinates); });
    const MW = 1440, MH = 720;
    const c = document.createElement('canvas'); c.width = MW; c.height = MH;
    const m = c.getContext('2d');
    m.fillStyle = '#000';
    for (const poly of polys) {
      m.beginPath();
      for (const ring of poly) {
        let px = null;
        ring.forEach(([lon, lat], i) => {
          const x = (lon + 180) / 360 * MW, y = (90 - lat) / 180 * MH;
          if (i === 0 || (px !== null && Math.abs(x - px) > MW / 2)) m.moveTo(x, y); else m.lineTo(x, y);
          px = x;
        });
        m.closePath();
      }
      m.fill('evenodd');
    }
    return { data: m.getImageData(0, 0, MW, MH).data, MW, MH };
  } catch (e) { console.warn('kickoff: map unavailable', e); return null; }
}

function visitor() {
  let tz = ''; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
  const city = (tz.split('/').pop() || '').replace(/_/g, ' ');
  let z = 6;
  if (/London|Belfast|Jersey|Guernsey|Isle_of_Man/.test(tz)) z = 0;
  else if (/^America\//.test(tz)) z = /(New_York|Chicago|Denver|Los_Angeles|Phoenix|Anchorage|Toronto|Vancouver|Edmonton|Winnipeg|Halifax|Detroit|Indiana|Kentucky|Boise|Regina|St_Johns|Montreal|Juneau|Honolulu)/.test(tz) ? 1 : 2;
  else if (/(Dubai|Riyadh|Qatar|Bahrain|Kuwait|Muscat|Baghdad|Tehran|Amman|Beirut|Damascus|Jerusalem|Cairo|Casablanca|Tunis|Algiers|Tripoli|Istanbul)/.test(tz)) z = 3;
  else if (/(Singapore|Bangkok|Jakarta|Manila|Kuala_Lumpur|Ho_Chi_Minh|Saigon|Phnom_Penh|Yangon|Makassar|Brunei|Vientiane)/.test(tz)) z = 4;
  else if (/^Australia\/|Auckland|Chatham/.test(tz)) z = 5;
  const y = new Date().getFullYear(), std = Math.max(new Date(y, 0, 1).getTimezoneOffset(), new Date(y, 6, 1).getTimezoneOffset());
  const lon = Math.max(-170, Math.min(175, -std / 4)), lat = [52, 40, -15, 26, 5, -30, 48][z];
  return { z, city, lon, lat };
}
export function runKickoff(canvas, o = {}) {
  const V = visitor(); o.onVisitor && o.onVisitor(V);
  const N = o.mode !== 'blueprint';
  const BG = N ? '#0b0a0a' : '#f3f2f2';
  const DIM = N ? [243, 242, 242, 0.16] : [32, 30, 29, 0.22];
  const RED = [236, 48, 19];
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0;
  const size = () => {
    const d = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * d); canvas.height = Math.round(H * d);
    ctx.setTransform(d, 0, 0, d, 0, 0);
  };
  size();
  const T = { clock0: 250, clock1: 3250, zone0: 550, zoneStep: 360, form: 3400, formDur: 950, doors: 4700, doorsDur: 900 };
  let vxy = null, dots = [], parts = [], mid = 0, s = 8, st = 8, t0 = 0, raf = 0, done = false, skipFlag = false, cancelled = false;
  let zoneFired = -1, phase = '', engineReady = !o.waitFor;
  if (o.waitFor) o.waitFor.then(() => { engineReady = true; }, () => { engineReady = true; });

  const build = (async () => {
    await Promise.race([document.fonts.load('800 200px Archivo'), sleep(1500)]).catch(() => {});
    const mask = await Promise.race([landMask(), sleep(4000).then(() => null)]);
    const LAT0 = 80, LAT1 = -56, span = LAT0 - LAT1, aspect = 360 / span;
    const mapW = Math.min(W * 0.94, H * 0.64 * aspect), mapH = mapW / aspect;
    const ox = (W - mapW) / 2, oy = (H - mapH) / 2 - H * 0.03;
    vxy = { x: ox + (V.lon + 180) / 360 * mapW, y: oy + (LAT0 - V.lat) / span * mapH };
    const cols = W < 720 ? 100 : 170; s = mapW / cols;
    const rows = Math.round(mapH / s);
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const lon = -180 + (i + 0.5) / cols * 360, lat = LAT0 - (j + 0.5) / rows * span;
      let land;
      if (mask) {
        const mx = Math.floor((lon + 180) / 360 * mask.MW), my = Math.floor((90 - lat) / 180 * mask.MH);
        land = mask.data[(my * mask.MW + mx) * 4 + 3] > 100;
      } else land = Math.random() < 0.22;
      if (land) dots.push({ x: ox + (i + 0.5) * s, y: oy + (j + 0.5) * s, z: zoneOf(lon, lat), rd: 0 });
    }
    const cent = Array.from({ length: 7 }, () => ({ x: 0, y: 0, n: 0 }));
    dots.forEach(d => { const c = cent[d.z]; c.x += d.x; c.y += d.y; c.n++; });
    cent.forEach(c => { if (c.n) { c.x /= c.n; c.y /= c.n; } });
    dots.forEach(d => { const c = cent[d.z]; d.rd = Math.hypot(d.x - c.x, d.y - c.y) / Math.max(W, 1) * 700; });
    // MK targets
    const fs = Math.min(W * 0.46, H * 0.6);
    const oc = document.createElement('canvas'); oc.width = W; oc.height = H;
    const g = oc.getContext('2d');
    g.font = `800 ${fs}px Archivo, system-ui, sans-serif`; g.textBaseline = 'middle'; g.fillStyle = '#000';
    const wM = g.measureText('M').width, wK = g.measureText('K').width, gap = fs * 0.03;
    const x0 = (W - (wM + gap + wK)) / 2, cy = H * 0.48;
    g.fillText('M', x0, cy); g.fillText('K', x0 + wM + gap, cy);
    mid = x0 + wM + gap / 2;
    st = Math.max(5, s * 0.98);
    const img = g.getImageData(0, 0, W, H).data, targets = [];
    for (let y = st / 2; y < H; y += st) for (let x = st / 2; x < W; x += st) {
      if (img[(Math.floor(y) * W + Math.floor(x)) * 4 + 3] > 128) targets.push({ x, y });
    }
    const sd = dots.slice().sort((a, b) => a.x - b.x || a.y - b.y);
    targets.sort((a, b) => a.x - b.x || a.y - b.y);
    const D = sd.length, TN = targets.length;
    if (D) targets.forEach((t, i) => {
      const d = sd[Math.floor(i * D / TN)]; d.chosen = true;
      const mx = (d.x + t.x) / 2, my = (d.y + t.y) / 2, dx = t.x - d.x, dy = t.y - d.y;
      const k = (Math.random() - 0.5) * 0.6;
      parts.push({ d, tx: t.x, ty: t.y, cx: mx - dy * k, cy: my + dx * k, delay: Math.random() * 260 });
    });
  })();

  build.then(() => {
    if (cancelled) return;
    o.onStart && o.onStart();
    t0 = performance.now();
    raf = requestAnimationFrame(tick);
  });

  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const pad = n => String(n).padStart(2, '0');

  function tick(now) {
    if (done || cancelled) return;
    let t = now - t0;
    if (skipFlag && t < T.doors) { t0 = now - T.doors; t = T.doors; }
    if (t >= T.doors && !engineReady) { t0 = now - T.doors; t = T.doors; }
    // clock
    const k = clamp((t - T.clock0) / (T.clock1 - T.clock0));
    const e = 1 - Math.pow(1 - k, 2.2), secs = Math.floor(5400 * e);
    o.onClock && o.onClock(`${pad(Math.floor(secs / 60))}:${pad(secs % 60)}`, k);
    for (let z = zoneFired + 1; z < 7; z++) {
      if (t >= T.zone0 + z * T.zoneStep) { zoneFired = z; o.onZone && o.onZone(z); } else break;
    }
    const ph = t >= T.doors ? 'doors' : t >= T.form ? 'form' : 'map';
    if (ph !== phase) { phase = ph; o.onPhase && o.onPhase(ph); }

    ctx.clearRect(0, 0, W, H);
    const du = t < T.doors ? 0 : ease4(clamp((t - T.doors) / T.doorsDur));
    const off = du * W * 0.62;
    ctx.fillStyle = BG;
    ctx.fillRect(-off, 0, mid + 1, H);
    ctx.fillRect(mid + off, 0, W - mid + 2, H);
    if (du > 0 && du < 1) {
      ctx.fillStyle = rgba(RED, 1 - du);
      ctx.fillRect(mid - off - 2, 0, 2, H); ctx.fillRect(mid + off, 0, 2, H);
    }
    const ds = s * 0.56;
    if (t < T.form + 400) {
      const fade = 1 - clamp((t - T.form) / 380);
      for (const d of dots) {
        if (t >= T.form && d.chosen) continue;
        const a = clamp((t - d.x / W * 450) / 300) * fade;
        if (a <= 0) continue;
        const lit = clamp((t - (T.zone0 + d.z * T.zoneStep) - d.rd) / 240) * (d.z === 6 ? 0.55 : 1);
        const c = [DIM[0] + (RED[0] - DIM[0]) * lit, DIM[1] + (RED[1] - DIM[1]) * lit, DIM[2] + (RED[2] - DIM[2]) * lit];
        ctx.fillStyle = rgba(c.map(Math.round), a * (DIM[3] + (1 - DIM[3]) * lit));
        ctx.fillRect(d.x - ds / 2, d.y - ds / 2, ds, ds);
      }
    }
    if (vxy && t < T.form + 300) {
      const va = Math.min(1, Math.max(0, (t - (T.zone0 + V.z * T.zoneStep)) / 300)) * (1 - Math.min(1, Math.max(0, (t - T.form) / 300)));
      if (va > 0) { const pr = (t % 1400) / 1400;
        ctx.strokeStyle = rgba(N ? [243, 242, 242] : [32, 30, 29], va * (1 - pr)); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(vxy.x, vxy.y, 6 + pr * 26, 0, 7); ctx.stroke();
        ctx.fillStyle = rgba(N ? [243, 242, 242] : [32, 30, 29], va); ctx.fillRect(vxy.x - 4, vxy.y - 4, 8, 8);
        ctx.font = '800 11px Archivo, system-ui, sans-serif'; try { ctx.letterSpacing = '2px'; } catch (e) {} ctx.textBaseline = 'middle';
        ctx.fillText(('YOU' + (V.city ? ' — ' + V.city : '')).toUpperCase(), vxy.x + 14, vxy.y - 16); }
    }
    if (t >= T.form) {
      ctx.fillStyle = rgba(RED, 1);
      const ps = st * 0.8;
      for (const p of parts) {
        const u = ease3(clamp((t - T.form - p.delay) / T.formDur));
        const iu = 1 - u;
        let x = iu * iu * p.d.x + 2 * iu * u * p.cx + u * u * p.tx;
        const y = iu * iu * p.d.y + 2 * iu * u * p.cy + u * u * p.ty;
        x += p.tx < mid ? -off : off;
        const z = ds + (ps - ds) * u;
        ctx.fillRect(x - z / 2, y - z / 2, z, z);
      }
    }
    if (du >= 1) { done = true; o.onDone && o.onDone(); return; }
    raf = requestAnimationFrame(tick);
  }

  return {
    skip() { skipFlag = true; },
    cancel() { cancelled = true; cancelAnimationFrame(raf); },
  };
}
