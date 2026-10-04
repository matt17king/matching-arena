// Canvas graphics for the in-world big screen and the half-time tactics board.
const RED = '#ec3013', CHALK = '#f3f2f2', BG = '#0c0b0b';
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ss = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const eo = x => 1 - Math.pow(1 - clamp(x), 3);
const F = (w, s) => `${w} ${s}px Archivo, system-ui, sans-serif`;
const LS = (g, v) => { try { g.letterSpacing = v; } catch (e) {} };

function txt(g, s, x, y, { w = 800, size = 40, color = CHALK, ls = '0px', align = 'left', base = 'alphabetic', a = 1 } = {}) {
  g.globalAlpha = a; g.font = F(w, size); g.fillStyle = color; LS(g, ls); g.textAlign = align; g.textBaseline = base; g.fillText(s, x, y); g.globalAlpha = 1;
}
function tag(g, s, x, y, a = 1) {
  g.globalAlpha = a; g.font = F(800, 22); LS(g, '5px'); const w = g.measureText(s).width;
  g.fillStyle = RED; g.fillRect(x, y, w + 28, 38); g.fillStyle = CHALK; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillText(s, x + 14, y + 20); g.globalAlpha = 1;
  return w + 28;
}
// reveal a headline line by line with a mask rise
function rise(g, lines, x, y, size, lh, k, color = CHALK) {
  lines.forEach((l, i) => {
    const u = eo((k - i * 0.12) / 0.5); if (u <= 0) return;
    g.save(); g.beginPath(); g.rect(x - 10, y + i * lh - size * 0.92, 1400, size * 1.08); g.clip();
    txt(g, l, x, y + i * lh + (1 - u) * size * 1.1, { size, color, ls: '-2px' }); g.restore();
  });
}

export function placeholder(g, x, y, w, h, lines) {
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
  g.fillStyle = '#1b1a19'; g.fillRect(x, y, w, h);
  g.strokeStyle = 'rgba(243,242,242,0.07)'; g.lineWidth = 2; for (let k = -h; k < w; k += 16) { g.beginPath(); g.moveTo(x + k, y + h); g.lineTo(x + k + h, y); g.stroke(); }
  g.strokeStyle = 'rgba(243,242,242,0.3)'; g.lineWidth = 2; g.strokeRect(x + 1, y + 1, w - 2, h - 2);
  g.fillStyle = 'rgba(243,242,242,0.75)'; g.textAlign = 'center'; g.textBaseline = 'middle'; LS(g, '1px');
  const fs = Math.max(12, Math.min(22, w / 16)); g.font = `500 ${fs}px ui-monospace, Menlo, Consolas, monospace`;
  lines.forEach((l, i) => g.fillText(l, x + w / 2, y + h / 2 + (i - (lines.length - 1) / 2) * fs * 1.5));
  g.restore();
}
export function photo(g, img, x, y, w, h, grade = true) {
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
  const s = Math.max(w / img.width, h / img.height), iw = img.width * s, ih = img.height * s;
  if (grade) g.filter = 'grayscale(1) contrast(1.12)';
  g.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih); g.restore();
}
let grid = null;
function ledGrid(W, H) {
  if (grid && grid.width === W) return grid;
  grid = document.createElement('canvas'); grid.width = W; grid.height = H; const g = grid.getContext('2d');
  g.fillStyle = 'rgba(0,0,0,0.42)'; for (let x = 0; x < W; x += 4) g.fillRect(x, 0, 1, H); for (let y = 0; y < H; y += 4) g.fillRect(0, y, W, 1);
  return grid;
}

// beat: 0 profile · 1–3 culture plays · 4 Crewe · 5 roster · 6 route · 'idle' · 'ft'
export function drawScreen(g, W, H, beat, b, t, d) {
  g.fillStyle = BG; g.fillRect(0, 0, W, H);
  const M = 64;
  // top strip
  g.fillStyle = 'rgba(243,242,242,0.12)'; g.fillRect(M, 70, W - M * 2, 2);
  g.fillStyle = RED; g.fillRect(M, 34, 18, 18);
  txt(g, 'MATT KING', M + 30, 52, { size: 22, ls: '5px' });
  txt(g, typeof beat === 'number' ? `${String(beat + 1).padStart(2, '0')} / 07` : 'LIVE', W - M, 52, { size: 22, ls: '5px', align: 'right', color: 'rgba(243,242,242,0.6)' });
  const k = clamp(b / 0.55);
  if (beat === 0) {
    tag(g, 'PLAYER PROFILE', M, 112, ss(k * 3));
    rise(g, ['MATT KING'], M, 300, 128, 0, k);
    txt(g, 'SPORT · FASHION · CULTURE', M + 4, 360, { size: 30, ls: '3px', a: ss((k - 0.3) * 3) });
    const fields = [['DAY JOB', 'DAZN'], ['ROLE', 'GLOBAL MKTG'], ['LANE', 'OFF THE PITCH']];
    fields.forEach(([a, v], i) => {
      const u = ss((k - 0.45 - i * 0.12) * 4), x = M + 4 + i * 250;
      g.globalAlpha = u; g.fillStyle = 'rgba(243,242,242,0.25)'; g.fillRect(x, 410, 220, 2); g.globalAlpha = 1;
      txt(g, a, x, 446, { size: 18, ls: '4px', color: 'rgba(243,242,242,0.6)', a: u });
      txt(g, v, x, 482, { size: 30, a: u });
    });
    const u = eo((k - 0.15) / 0.6), px = W - M - 330, py = 96, pw = 330, ph = 404;
    g.save(); g.globalAlpha = u; g.beginPath(); g.rect(px, py + ph * (1 - u), pw, ph * u); g.clip();
    if (d.photos && d.photos.portrait) photo(g, d.photos.portrait, px, py, pw, ph);
    else {
      g.fillStyle = '#161414'; g.fillRect(px, py, pw, ph); g.fillStyle = RED; g.fillRect(px, py, pw, 10);
      let ms = 230; g.font = F(800, ms); LS(g, '-12px'); while (g.measureText('MK').width > pw - 50 && ms > 120) { ms -= 10; g.font = F(800, ms); }
      g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillStyle = 'rgba(243,242,242,0.92)'; g.fillText('MK', px + pw / 2, py + 290);
      txt(g, 'NO. 17', px + pw - 30, py + 52, { size: 22, ls: '4px', align: 'right', color: RED });
      g.fillStyle = 'rgba(243,242,242,0.18)'; g.fillRect(px + 30, py + 330, pw - 60, 2);
      txt(g, '50–100 PEOPLE', px + 30, py + 368, { size: 20, ls: '4px' }); txt(g, '8 TEAMS · 7 MARKETS', px + 30, py + 392, { size: 16, ls: '4px', color: 'rgba(243,242,242,0.6)' });
    }
    g.restore();
    if (d.photos && d.photos.portrait) { g.save(); g.globalAlpha = u; g.fillStyle = RED; g.fillRect(px, py + ph - 44, 104, 44); g.restore(); txt(g, 'NO. 17', px + 14, py + ph - 14, { size: 20, ls: '4px', a: u }); }
  } else if (beat >= 1 && beat <= 3) {
    // culture plays: the thesis on the left, the crossover it came from on the right
    const P = [
      { n: '01', h: ['CULTURE IS', 'THE SIDE DOOR.'], s: 'Reach people through what they already love.', rows: [['TAYLOR SWIFT', 'MUSIC'], ['KANSAS CITY CHIEFS', 'NFL']], x: 'NEW EYES ON THE NFL' },
      { n: '02', h: ['THE IT BOY', 'WEARS THE DROP.'], s: 'Athletes are culture figures. Treat them that way.', rows: [['ALCARAZ', 'TENNIS'], ['TRAVIS SCOTT', 'MUSIC'], ['NIKE', 'SNEAKERS']], x: 'TENNIS IN SNEAKER CULTURE' },
      { n: '03', h: ['MUSIC IS', 'THE KICK-OFF.'], s: 'The halftime show is part of the product.', rows: [['BAD BUNNY', 'MUSIC'], ['ADIDAS', 'FASHION'], ['SUPER BOWL', 'NFL']], x: 'ONE ARTIST, THREE WORLDS' },
    ][beat - 1];
    const w = tag(g, `PLAY ${P.n}`, M, 112, ss(k * 3));
    txt(g, 'HOW I THINK', M + w + 18, 132, { size: 20, ls: '5px', base: 'middle', color: 'rgba(243,242,242,0.6)', a: ss(k * 3) });
    let hs = 88; g.font = F(800, hs); LS(g, '-2px'); while (P.h.some(l => g.measureText(l).width > 640) && hs > 50) { hs -= 4; g.font = F(800, hs); }
    rise(g, P.h, M, 268, hs, hs, k);
    txt(g, P.s, M + 2, 440, { w: 600, size: 28, color: 'rgba(243,242,242,0.85)', a: ss((k - 0.4) * 3) });
    const X0 = 760, X1 = W - M, n = P.rows.length, top = 150, step = n === 2 ? 150 : 108;
    P.rows.forEach(([name, kind], i) => {
      const u = eo((k - 0.2 - i * 0.12) / 0.4), y = top + i * step;
      let fs = 70; g.font = F(800, fs); LS(g, '-2px'); while (g.measureText(name).width > X1 - X0 - 10 && fs > 30) { fs -= 2; g.font = F(800, fs); }
      g.save(); g.beginPath(); g.rect(X0, y - 4, X1 - X0, fs + 12); g.clip();
      txt(g, name, X0 + (1 - u) * -200, y + fs * 0.86, { size: fs, ls: '-2px', a: u }); g.restore();
      txt(g, kind, X0, y - 12, { size: 16, ls: '4px', color: i ? 'rgba(243,242,242,0.6)' : '#ff7a5e', a: u });
      if (i < n - 1) txt(g, '×', X1, y + step - 22, { size: 34, align: 'right', color: RED, a: eo((k - 0.3 - i * 0.12) / 0.4) });
    });
    const xu = ss((k - 0.55) * 3); g.globalAlpha = xu; g.fillStyle = RED; g.fillRect(X0, 470, X1 - X0, 40); g.globalAlpha = 1;
    txt(g, P.x, X0 + 14, 491, { size: 18, ls: '4px', base: 'middle', a: xu });
  } else if (beat === 4) {
    tag(g, 'THE PROOF', M, 112, ss(k * 3));
    const iw = 600, ih = 380, ix = M, iy = 162, u = eo((k - 0.05) / 0.5);
    g.save(); g.beginPath(); g.rect(ix, iy, iw * u, ih); g.clip();
    if (d.photos && d.photos.work) photo(g, d.photos.work, ix, iy, iw, ih);
    else {
      g.fillStyle = '#161414'; g.fillRect(ix, iy, iw, ih);
      txt(g, 'FAN ENGAGEMENT · INDEXED', ix + 28, iy + 44, { size: 16, ls: '4px', color: 'rgba(243,242,242,0.6)' });
      const base = iy + ih - 56, top = iy + 80, bw = 170, gu = eo((k - 0.2) / 0.6);
      [[100, 'BEFORE', 'rgba(243,242,242,0.35)'], [550, 'WITH 80 FOUR', RED]].forEach(([v, lab, col], i) => {
        const x = ix + 70 + i * 270, hgt = (base - top) * (v / 550) * (i ? gu : Math.min(1, gu * 4));
        g.fillStyle = col; g.fillRect(x, base - hgt, bw, hgt);
        txt(g, String(Math.round(v * (i ? gu : 1))), x, base - hgt - 14, { size: 34 });
        txt(g, lab, x, base + 34, { size: 16, ls: '4px', color: 'rgba(243,242,242,0.7)' });
      });
      g.fillStyle = 'rgba(243,242,242,0.25)'; g.fillRect(ix + 40, base, iw - 80, 2);
    }
    g.restore();
    const X0 = ix + iw + 48;
    txt(g, 'CREWE ALEXANDRA FC · 80 FOUR', X0, 200, { size: 20, ls: '4px', color: 'rgba(243,242,242,0.6)', a: ss((k - 0.2) * 3) });
    rise(g, ['450%+', 'FAN', 'ENGAGEMENT.'], X0, 300, 86, 84, clamp((k - 0.15) / 0.85));
    txt(g, 'Won as a client at 80 Four, then grown together.', X0, 514, { w: 600, size: 22, color: 'rgba(243,242,242,0.85)', a: ss((k - 0.5) * 3) });
  } else if (beat === 5) {
    const tw = tag(g, 'THE ROSTER', M, 112, ss(k * 3));
    txt(g, "TALENT I'VE WORKED WITH", M + tw + 18, 132, { size: 20, ls: '5px', base: 'middle', color: 'rgba(243,242,242,0.6)', a: ss(k * 3) });
    const T = d.talent || [], cols = 3, cw = (W - M * 2) / cols, rh = 118;
    T.slice(0, 9).forEach(([n, w], i) => {
      const u = eo((k - 0.1 - i * 0.06) / 0.35), x = M + (i % cols) * cw, y = 190 + Math.floor(i / cols) * rh;
      g.globalAlpha = u; g.fillStyle = 'rgba(243,242,242,0.18)'; g.fillRect(x, y, cw - 28, 2); g.fillStyle = RED; g.fillRect(x, y, 40 * u, 2); g.globalAlpha = 1;
      let fs = 44; g.font = F(800, fs); LS(g, '-1px'); while (g.measureText(n.toUpperCase()).width > cw - 40 && fs > 24) { fs -= 2; g.font = F(800, fs); }
      g.save(); g.beginPath(); g.rect(x, y + 6, cw - 28, 70); g.clip(); txt(g, n.toUpperCase(), x, y + 58 + (1 - u) * 60, { size: fs, ls: '-1px' }); g.restore();
      txt(g, w.toUpperCase(), x, y + 92, { size: 16, ls: '4px', color: 'rgba(243,242,242,0.55)', a: u });
    });
  } else if (beat === 6) {
    tag(g, 'THE ROUTE', M, 112, ss(k * 3));
    rise(g, ['FROM GYM KING', 'TO GLOBAL.'], M, 236, 78, 78, k);
    const R = d.route, x0 = M + 10, x1 = W - M - 10, y = 450, lu = eo((k - 0.25) / 0.6);
    g.fillStyle = 'rgba(243,242,242,0.18)'; g.fillRect(x0, y, x1 - x0, 3);
    g.fillStyle = RED; g.fillRect(x0, y, (x1 - x0) * lu, 3);
    R.forEach(([yr, n], i) => {
      const x = x0 + (x1 - x0) * i / (R.length - 1), u = ss((lu - i / (R.length - 1)) * 6 + 1);
      g.globalAlpha = u; g.fillStyle = i === R.length - 1 ? RED : CHALK; g.fillRect(x - 9, y - 8, 18, 18); g.globalAlpha = 1;
      const al = i === 0 ? 'left' : i === R.length - 1 ? 'right' : 'center';
      txt(g, yr, x, y - 26, { size: 18, ls: '3px', align: al, color: 'rgba(243,242,242,0.6)', a: u });
      txt(g, n, x, y + 48, { size: 16, ls: '2px', align: al, a: u });
      const lg = d.logos && R[i][2] && d.logos['career-' + R[i][2]];
      if (lg) { const s = 52, lx = al === 'left' ? x - 9 : al === 'right' ? x + 9 - s : x - s / 2; g.globalAlpha = u; g.fillStyle = '#f3f2f2'; g.fillRect(lx, y - 100, s, s); const k = Math.min((s - 10) / lg.width, (s - 10) / lg.height); g.drawImage(lg, lx + (s - lg.width * k) / 2, y - 100 + (s - lg.height * k) / 2, lg.width * k, lg.height * k); g.globalAlpha = 1; }
    });
  } else if (beat === 'ft') {
    tag(g, 'FULL TIME', M, 112);
    txt(g, '90:00', M, 330, { size: 190, ls: '-6px' });
    txt(g, "LET'S TALK", W - M, 330, { size: 64, align: 'right', color: RED });
    txt(g, 'MATT17KING@GMAIL.COM', W - M, 384, { size: 26, ls: '3px', align: 'right', color: 'rgba(243,242,242,0.8)' });
  } else {
    const pulse = 0.6 + 0.4 * Math.sin(t * 2.2);
    g.fillStyle = RED; g.globalAlpha = pulse; g.fillRect(M, 140, 18, 18); g.globalAlpha = 1;
    txt(g, 'MATT KING', M, 330, { size: 170, ls: '-4px' });
    txt(g, 'SPORT · FASHION · CULTURE', M + 4, 400, { size: 28, ls: '4px', color: 'rgba(243,242,242,0.7)' });
  }
  // broadcast wipes between beats
  if (typeof beat === 'number') {
    const inn = clamp(b / 0.1), out = clamp((b - 0.9) / 0.1);
    if (inn < 1) { g.fillStyle = RED; g.fillRect(W * eo(inn), 0, W, H); }
    if (out > 0) { g.fillStyle = RED; g.fillRect(0, 0, W * eo(out), H); }
  }
  g.drawImage(ledGrid(W, H), 0, 0);
}

// tactics board on the court: how a brief gets built. canvas covers x -55..55, z -36..36
export function drawTactics(g, W, H, r, d) {
  g.clearRect(0, 0, W, H);
  if (r <= 0) return;
  const X = x => (x + 55) / 110 * W, Y = z => (z + 36) / 72 * H, S = W / 110;
  const curve = (x0, z0, x1, z1, u, col, lw, glow) => {
    if (u <= 0) return; const ax = X(x0), ay = Y(z0), bx = X(x1), by = Y(z1), dx = (bx - ax) * 0.55;
    g.save(); g.lineCap = 'round';
    const path = () => { g.beginPath(); const n = 40; for (let i = 0; i <= n * u; i++) {
      const t = i / n, it = 1 - t;
      const x = it * it * it * ax + 3 * it * it * t * (ax + dx) + 3 * it * t * t * (bx - dx) + t * t * t * bx;
      const y = it * it * it * ay + 3 * it * it * t * ay + 3 * it * t * t * by + t * t * t * by;
      i ? g.lineTo(x, y) : g.moveTo(x, y);
    } };
    if (glow) { path(); g.strokeStyle = 'rgba(236,48,19,0.18)'; g.lineWidth = lw * 4; g.stroke(); }
    path(); g.strokeStyle = col; g.lineWidth = lw; g.stroke(); g.restore();
  };
  const dot = (x, z, rad, fill, stroke, u) => { if (u <= 0) return; g.save(); g.beginPath(); g.arc(X(x), Y(z), rad * S * eo(u), 0, Math.PI * 2); if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = 4; g.stroke(); } g.restore(); };
  const lab = (s, x, z, u, o = {}) => { if (u <= 0) return; txt(g, s, X(x), Y(z), { size: 24, ls: '4px', base: 'middle', a: ss(u * 2), ...o }); };
  const PA = d.passions || [], OUT = d.outputs || [];
  // who we want: the fans we have, and the ones we don't
  const wx = -44, px = -14, hx = 12, ox = 31, wz = [-9, 9];
  const pz = i => -24.5 + i * 49 / Math.max(1, PA.length - 1), oz = j => -24 + j * 48 / Math.max(1, OUT.length - 1);
  const c0 = clamp(r / 0.08);
  dot(wx, wz[0], 2.2, null, CHALK, c0); dot(wx, wz[1], 3.0, RED, CHALK, c0);
  lab('FANS WE HAVE', wx, wz[0] + 4.6, c0, { align: 'center', size: 20, color: 'rgba(243,242,242,0.7)' });
  lab('FANS WE DON\'T', wx, wz[1] + 5.4, c0, { align: 'center', size: 24 });
  // what they already love
  PA.forEach((c, i) => {
    const u = clamp((r - 0.08 - i * 0.022) / 0.14);
    curve(wx + 3, wz[1], px - 1.2, pz(i), u, 'rgba(243,242,242,0.85)', 3, false);
    if (i % 3 === 0) curve(wx + 2.2, wz[0], px - 1.2, pz(i), u, 'rgba(243,242,242,0.3)', 2, false);
    const v = clamp((u - 0.85) / 0.15); dot(px, pz(i), 1.15, CHALK, null, v); lab(c.toUpperCase(), px + 2.2, pz(i), v);
  });
  // what we have: the sport, its athletes and its stories
  PA.forEach((c, i) => curve(px + 1.2, pz(i), hx - 2.2, 0, clamp((r - 0.4) / 0.12), 'rgba(236,48,19,0.9)', 3, true));
  const dv = clamp((r - 0.5) / 0.05); dot(hx, 0, 2.2, null, RED, dv); dot(hx, 0, 0.9, RED, null, dv);
  lab('WHAT WE HAVE', hx, -10.5, dv, { align: 'center', size: 20 });
  lab('SPORT · ATHLETES · STORIES', hx, 10.5, dv, { align: 'center', size: 16, color: 'rgba(243,242,242,0.6)' });
  // what it becomes
  OUT.forEach((m, j) => {
    const u = clamp((r - 0.55 - j * 0.03) / 0.14);
    curve(hx + 2.2, 0, ox - 1.4, oz(j), u, RED, 4, true);
    const v = clamp((u - 0.85) / 0.15); dot(ox, oz(j), 1.4, null, RED, v); lab(m.toUpperCase(), ox + 2.6, oz(j), v, { size: 24, color: '#ff7a5e' });
  });
  lab('HOW I BUILD A BRIEF — START WITH WHAT THEY ALREADY LOVE', -52, -31, clamp(r / 0.1), { size: 20, color: 'rgba(243,242,242,0.75)' });
  const cap = clamp((r - 0.85) / 0.15);
  [['1 WHO WE WANT', wx, 'center'], ['2 WHAT THEY LOVE', px, 'left'], ['3 WHAT WE HAVE', hx, 'center'], ['4 WHAT IT BECOMES', ox, 'left']].forEach(([s, x, al]) => lab(s, x, 31.5, cap, { size: 18, color: 'rgba(243,242,242,0.6)', align: al }));
}
