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

// beat: 0 profile · 1 P01 · 2 P02 · 3 P03 · 4 route · 'idle' · 'ft'
export function drawScreen(g, W, H, beat, b, t, d) {
  g.fillStyle = BG; g.fillRect(0, 0, W, H);
  const M = 64;
  // top strip
  g.fillStyle = 'rgba(243,242,242,0.12)'; g.fillRect(M, 70, W - M * 2, 2);
  g.fillStyle = RED; g.fillRect(M, 34, 18, 18);
  txt(g, 'MATT KING', M + 30, 52, { size: 22, ls: '5px' });
  txt(g, typeof beat === 'number' ? `${String(beat + 1).padStart(2, '0')} / 06` : 'LIVE', W - M, 52, { size: 22, ls: '5px', align: 'right', color: 'rgba(243,242,242,0.6)' });
  const k = clamp(b / 0.55);
  if (beat === 0) {
    tag(g, 'PLAYER PROFILE', M, 112, ss(k * 3));
    rise(g, ['MATT KING'], M, 300, 150, 0, k);
    txt(g, 'GLOBAL MARKETING MANAGER, FOOTBALL', M + 4, 360, { size: 30, ls: '3px', a: ss((k - 0.3) * 3) });
    const fields = [['CLUB', 'DAZN'], ['BASE', 'LONDON'], ['REPORTS TO', 'SVP MARKETING']];
    fields.forEach(([a, v], i) => {
      const u = ss((k - 0.45 - i * 0.12) * 4), x = M + 4 + i * 250;
      g.globalAlpha = u; g.fillStyle = 'rgba(243,242,242,0.25)'; g.fillRect(x, 410, 220, 2); g.globalAlpha = 1;
      txt(g, a, x, 446, { size: 18, ls: '4px', color: 'rgba(243,242,242,0.6)', a: u });
      txt(g, v, x, 482, { size: 30, a: u });
    });
    const u = eo((k - 0.15) / 0.6), px = W - M - 330, py = 96, pw = 330, ph = 404;
    g.save(); g.globalAlpha = u; g.beginPath(); g.rect(px, py + ph * (1 - u), pw, ph * u); g.clip();
    if (d.photos && d.photos.portrait) photo(g, d.photos.portrait, px, py, pw, ph); else placeholder(g, px, py, pw, ph, ['PORTRAIT', 'photos/portrait.jpg']);
    g.restore();
    g.save(); g.globalAlpha = u; g.font = F(800, 170); LS(g, '-8px'); g.textAlign = 'right'; g.textBaseline = 'alphabetic'; g.fillStyle = RED; g.fillText('17', px - 14, py + ph); g.restore();
    txt(g, 'SQUAD NO.', px - 18, py + ph - 150, { size: 16, ls: '4px', align: 'right', color: 'rgba(243,242,242,0.6)', a: u });
  } else if (beat >= 1 && beat <= 3) {
    const P = [
      { n: '01', h: ['CONCEPT FIRST,', 'CHANNEL SECOND.'], s: 'One season idea, adapted by every team.' },
      { n: '02', h: ['LOCAL WINS', 'GLOBALLY.'], s: 'The same rights. A different plan for every market.' },
      { n: '03', h: ['PLATFORMS ARE', 'PARTNERS.'], s: 'TikTok, Instagram and Meta as allies, not ad slots.' },
    ][beat - 1];
    const w = tag(g, `PRINCIPLE ${P.n}`, M, 112, ss(k * 3));
    txt(g, 'HOW I WORK', M + w + 18, 132, { size: 20, ls: '5px', base: 'middle', color: 'rgba(243,242,242,0.6)', a: ss(k * 3) });
    rise(g, P.h, M, 268, 92, 92, k);
    txt(g, P.s, M + 2, 440, { w: 600, size: 30, color: 'rgba(243,242,242,0.85)', a: ss((k - 0.4) * 3) });
    const X0 = 760, X1 = W - M;
    if (beat === 1) {
      const ch = d.channels; const y0 = 120, step = (470 - y0) / (ch.length - 1);
      const cu = eo(k * 2.2); g.fillStyle = RED; g.fillRect(X0, 286 - 26 * cu, 52 * cu, 52 * cu);
      ch.forEach((c, i) => {
        const u = eo((k - 0.25 - i * 0.05) / 0.4), y = y0 + i * step;
        g.strokeStyle = `rgba(243,242,242,${0.35 * u})`; g.lineWidth = 2; g.beginPath(); g.moveTo(X0 + 52, 286);
        g.bezierCurveTo(X0 + 140, 286, X0 + 120, y, X0 + 200, y); g.stroke();
        g.fillStyle = `rgba(243,242,242,${u})`; g.fillRect(X0 + 206, y - 10, (X1 - X0 - 380) * u * (0.55 + 0.45 * ((i * 37) % 10) / 10), 20);
        txt(g, c.toUpperCase(), X1, y + 8, { size: 20, ls: '4px', align: 'right', a: u });
      });
    } else if (beat === 2) {
      const mk = d.markets; const cols = 2, cw = (X1 - X0) / cols, chh = 78;
      mk.forEach((m, i) => {
        const u = eo((k - 0.2 - i * 0.07) / 0.35), x = X0 + (i % cols) * cw, y = 120 + Math.floor(i / cols) * (chh + 10);
        g.globalAlpha = u; g.fillStyle = 'rgba(243,242,242,0.08)'; g.fillRect(x, y, cw - 14, chh);
        g.fillStyle = RED; g.fillRect(x + 16, y + 16, 18, 18); g.globalAlpha = 1;
        txt(g, `PLAN ${String(i + 1).padStart(2, '0')}`, x + 46, y + 32, { size: 15, ls: '4px', color: 'rgba(243,242,242,0.6)', a: u });
        txt(g, m.toUpperCase(), x + 16, y + 64, { size: 24, a: u });
      });
    } else {
      ['TIKTOK', 'INSTAGRAM', 'META'].forEach((p, i) => {
        const u = eo((k - 0.2 - i * 0.12) / 0.4), y = 210 + i * 120;
        g.save(); g.beginPath(); g.rect(X0, y - 100, X1 - X0, 120); g.clip();
        txt(g, p, X0 + (1 - u) * -200, y, { size: 96, ls: '-2px', a: u }); g.restore();
        g.globalAlpha = u; g.fillStyle = RED; g.fillRect(X1 - 150, y - 44, 150, 34); g.globalAlpha = 1;
        txt(g, 'PARTNER', X1 - 75, y - 21, { size: 18, ls: '4px', align: 'center', base: 'middle', a: u });
      });
    }
  } else if (beat === 4) {
    tag(g, 'THE WORK', M, 112, ss(k * 3));
    const iw = 600, ih = 380, ix = M, iy = 162, u = eo((k - 0.05) / 0.5);
    g.save(); g.beginPath(); g.rect(ix, iy, iw * u, ih); g.clip();
    if (d.photos && d.photos.work) photo(g, d.photos.work, ix, iy, iw, ih); else placeholder(g, ix, iy, iw, ih, ['CAMPAIGN STILL', 'photos/crewe.jpg']);
    g.restore();
    const X0 = ix + iw + 48;
    txt(g, 'CREWE ALEXANDRA FC · 80 FOUR', X0, 200, { size: 20, ls: '4px', color: 'rgba(243,242,242,0.6)', a: ss((k - 0.2) * 3) });
    rise(g, ['450%+', 'FAN', 'ENGAGEMENT.'], X0, 300, 86, 84, clamp((k - 0.15) / 0.85));
    txt(g, 'Won as a client at 80 Four, then grown together.', X0, 514, { w: 600, size: 22, color: 'rgba(243,242,242,0.85)', a: ss((k - 0.5) * 3) });
  } else if (beat === 5) {
    tag(g, 'THE ROUTE', M, 112, ss(k * 3));
    rise(g, ['FROM GYM KING', 'TO GLOBAL.'], M, 268, 92, 92, k);
    const R = d.route, x0 = M + 10, x1 = W - M - 10, y = 450, lu = eo((k - 0.25) / 0.6);
    g.fillStyle = 'rgba(243,242,242,0.18)'; g.fillRect(x0, y, x1 - x0, 3);
    g.fillStyle = RED; g.fillRect(x0, y, (x1 - x0) * lu, 3);
    R.forEach(([yr, n], i) => {
      const x = x0 + (x1 - x0) * i / (R.length - 1), u = ss((lu - i / (R.length - 1)) * 6 + 1);
      g.globalAlpha = u; g.fillStyle = i === R.length - 1 ? RED : CHALK; g.fillRect(x - 9, y - 8, 18, 18); g.globalAlpha = 1;
      const al = i === 0 ? 'left' : i === R.length - 1 ? 'right' : 'center';
      txt(g, yr, x, y - 26, { size: 18, ls: '3px', align: al, color: 'rgba(243,242,242,0.6)', a: u });
      txt(g, n, x, y + 48, { size: 20, ls: '2px', align: al, a: u });
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
    txt(g, 'FOOTBALL MARKETING AT GLOBAL SCALE', M + 4, 400, { size: 28, ls: '4px', color: 'rgba(243,242,242,0.7)' });
  }
  // broadcast wipes between beats
  if (typeof beat === 'number') {
    const inn = clamp(b / 0.1), out = clamp((b - 0.9) / 0.1);
    if (inn < 1) { g.fillStyle = RED; g.fillRect(W * eo(inn), 0, W, H); }
    if (out > 0) { g.fillStyle = RED; g.fillRect(0, 0, W * eo(out), H); }
  }
  g.drawImage(ledGrid(W, H), 0, 0);
}

// tactics board on the pitch. canvas covers x -55..55, z -36..36
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
  const CH = d.channels, MK = d.markets;
  const cx = -38, chx = -8, dvx = 14, mkx = 33;
  const chz = i => -24.5 + i * 49 / (CH.length - 1), mkz = j => -24 + j * 48 / (MK.length - 1);
  // concept
  const c0 = clamp(r / 0.08);
  dot(cx, 0, 3.4, RED, CHALK, c0);
  lab('ONE SEASON', cx, 6.2, c0, { align: 'center', size: 26 }); lab('CONCEPT', cx, 8.6, c0, { align: 'center', size: 26 });
  CH.forEach((c, i) => {
    const u = clamp((r - 0.08 - i * 0.022) / 0.14);
    curve(cx + 3.4, 0, chx - 1.2, chz(i), u, 'rgba(243,242,242,0.85)', 3, false);
    const v = clamp((u - 0.85) / 0.15); dot(chx, chz(i), 1.15, CHALK, null, v); lab(c.toUpperCase(), chx + 2.2, chz(i), v);
  });
  CH.forEach((c, i) => curve(chx + 1.2, chz(i), dvx - 2.2, 0, clamp((r - 0.4) / 0.12), 'rgba(236,48,19,0.9)', 3, true));
  const dv = clamp((r - 0.5) / 0.05); dot(dvx, 0, 2.2, null, RED, dv); dot(dvx, 0, 0.9, RED, null, dv);
  MK.forEach((m, j) => {
    const u = clamp((r - 0.55 - j * 0.03) / 0.14);
    curve(dvx + 2.2, 0, mkx - 1.4, mkz(j), u, RED, 4, true);
    const v = clamp((u - 0.85) / 0.15); dot(mkx, mkz(j), 1.4, null, RED, v); lab(m.toUpperCase(), mkx + 2.6, mkz(j), v, { size: 26, color: '#ff7a5e' });
  });
  lab('HOW ONE IDEA BECOMES A GLOBAL CAMPAIGN', -52, -31, clamp(r / 0.1), { size: 20, color: 'rgba(243,242,242,0.75)' });
  const cap = clamp((r - 0.85) / 0.15);
  [['THE IDEA', cx], ['8 TEAMS ADAPT IT', chx], ['7 MARKETS LAND IT', mkx]].forEach(([s, x]) => lab(s, x, 31.5, cap, { size: 18, color: 'rgba(243,242,242,0.6)', align: x === cx ? 'center' : 'left' }));
}
