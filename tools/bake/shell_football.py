# The football ground's shell: a continuous ring roof (standing-seam metal over the back of the stands, translucent sheeting out to a front ring girder),
# cantilever trusses, ring purlins, roof-edge floodlights, an outer façade with a lit concourse band and vertical fins, and the rear wall above the top tier
# with hospitality boxes on the two long sides. Built on the same footprint as the code-built stands, so seats, crowd and LED boards stay where they are.
# Returns a list of surfaces: dict(mat, seg, V, N, UV, F). seg is the stand the piece rises with (0 north, 1 east, 2 west, 3 south, 4-7 corners).
import math
import numpy as np

LONG = dict(D=24.7, top=19.15); END = dict(D=21.5, top=17.29)
YB, YF, OVER, BACK = 27.0, 31.0, 6.5, 3.0          # roof height at the back and the front edge, overhang past the front row, façade set-back behind the last row
TILE = dict(clad=(3.0, 3.0), roofm=(4.0, 4.0), conc=(4.8, 2.4), win=(12.0, 1.0), steel=(1, 1), glass=(1, 1), lamp=(1, 1))
sm = lambda x: (lambda t: t * t * (3 - 2 * t))(min(1.0, max(0.0, x)))

def segments():
    S = []
    def straight(seg, a, b, n, kind, steps):
        out = []
        for i in range(steps + 1):
            u = i / steps; p = a + (b - a) * u
            out.append(dict(p=p, n=np.array(n, float), D=kind['D'], top=kind['top'], s=np.linalg.norm(b - a) * u, i=i, long=kind is LONG, truss=i % 2 == 1, fin=i < steps, gap=seg == 3 and abs(p[0]) < 6.5))
        S.append((seg, out))
    straight(0, np.array([-58., -43.]), np.array([58., -43.]), (0, -1), LONG, 32)
    straight(1, np.array([61., -38.]), np.array([61., 38.]), (1, 0), END, 20)
    straight(2, np.array([-61., -38.]), np.array([-61., 38.]), (-1, 0), END, 20)
    straight(3, np.array([-58., 43.]), np.array([58., 43.]), (0, 1), LONG, 32)
    k = 4
    for sx in (-1, 1):
        for sz in (-1, 1):
            out = []; steps = 12; s = 0.0; prev = None
            for i in range(steps + 1):
                u = i / steps; th = u * math.pi / 2; d = np.array([sx * math.sin(th), sz * math.cos(th)]); r0 = 5 + (3 - 5) * u; p = np.array([sx * 58., sz * 38.]) + d * r0
                if prev is not None: s += np.linalg.norm(p - prev) * 2.2      # the arc is far longer at roof level than at the front row; stretch u so textures don't smear
                prev = p; b = sm(u / 0.4)
                out.append(dict(p=p, n=d, D=LONG['D'] + (END['D'] - LONG['D']) * b, top=LONG['top'] + (END['top'] - LONG['top']) * b, s=s, i=i, long=False, truss=i in (2, 6, 10), fin=i % 2 == 0 and i < steps, gap=False))
            S.append((k, out)); k += 1
    return S

def roof_pt(sa, t):
    db, df = sa['D'] + BACK, -OVER
    return db + (df - db) * t, YB + (YF - YB) * t + 1.2 * math.sin(math.pi * t)
def at(sa, d, y): return np.array([sa['p'][0] + sa['n'][0] * d, y, sa['p'][1] + sa['n'][1] * d])

def grid(samples, prof, mat, seg, want, skip=None, vfit=False):
    """Sweep a profile [(d, y)] along the samples. want: 'up' | 'down' | 'out' | 'in' | (d, y) centre fn for closed sections."""
    rows = [prof(sa) for sa in samples]; nj = len(rows[0]); P = np.array([[at(sa, d, y) for (d, y) in r] for sa, r in zip(samples, rows)])
    ni = len(samples); tu, tv = TILE[mat]
    vlen = np.zeros((ni, nj)); vlen[:, 1:] = np.cumsum(np.linalg.norm(np.diff(P, axis=1), axis=2), axis=1)
    UV = np.zeros((ni, nj, 2)); UV[:, :, 0] = np.array([sa['s'] for sa in samples])[:, None] / tu; UV[:, :, 1] = (vlen / np.maximum(vlen[:, -1:], 1e-6)) if vfit else vlen / tv
    di = np.gradient(P, axis=0); dj = np.gradient(P, axis=1); N = np.cross(dj, di); N /= np.maximum(np.linalg.norm(N, axis=2, keepdims=True), 1e-9)
    if want in ('up', 'down'): ref = np.tile(np.array([0, 1.0 if want == 'up' else -1.0, 0]), (ni, nj, 1))
    elif want in ('out', 'in'): ref = np.array([[[sa['n'][0], 0, sa['n'][1]]] * nj for sa in samples]) * (1 if want == 'out' else -1)
    else: ref = P - np.array([[at(sa, *want(sa))] * nj for sa in samples])
    flip = (N * ref).sum() < 0
    if flip: N = -N
    idx = np.arange(ni * nj).reshape(ni, nj); F = []
    for i in range(ni - 1):
        if skip and skip(samples[i]) and skip(samples[i + 1]): continue
        for j in range(nj - 1):
            a, b, c, d = idx[i, j], idx[i + 1, j], idx[i + 1, j + 1], idx[i, j + 1]; F += [[a, b, c], [a, c, d]]
    F = np.array(F, dtype=np.int64).reshape(-1, 3); V = P.reshape(-1, 3); Nn = N.reshape(-1, 3)
    if len(F):   # wind every triangle to agree with its normals
        fn = np.cross(V[F[:, 1]] - V[F[:, 0]], V[F[:, 2]] - V[F[:, 0]]); bad = (fn * Nn[F[:, 0]]).sum(axis=1) < 0; F[bad] = F[bad][:, [0, 2, 1]]
    return dict(mat=mat, seg=seg, V=V, N=Nn, UV=UV.reshape(-1, 2), F=F)

def beams(members, mat, seg):
    """members: [(a, b, w, h, side)] box sections with flat faces; side is the horizontal direction the section's width runs along."""
    V, N, F = [], [], []
    for a, b, w, h, side in members:
        ax = b - a; L = np.linalg.norm(ax)
        if L < 1e-6: continue
        ax /= L; lat = side - ax * np.dot(side, ax); ln = np.linalg.norm(lat)
        lat = lat / ln if ln > 1e-6 else np.cross(ax, [0, 1.0, 0]); oth = np.cross(ax, lat)
        c = [(+1, +1), (-1, +1), (-1, -1), (+1, -1)]
        for q in range(4):
            (s0, t0), (s1, t1) = c[q], c[(q + 1) % 4]; o0 = lat * s0 * w / 2 + oth * t0 * h / 2; o1 = lat * s1 * w / 2 + oth * t1 * h / 2
            n = (o0 + o1); n /= np.linalg.norm(n); k = len(V); V += [a + o0, a + o1, b + o1, b + o0]; N += [n] * 4
            f = [[k, k + 1, k + 2], [k, k + 2, k + 3]]
            if np.dot(np.cross(V[k + 1] - V[k], V[k + 2] - V[k]), n) < 0: f = [[k, k + 2, k + 1], [k, k + 3, k + 2]]
            F += f
    if not V: return None
    return dict(mat=mat, seg=seg, V=np.array(V), N=np.array(N), UV=np.zeros((len(V), 2)), F=np.array(F, dtype=np.int64))

def build():
    out = []
    for seg, sam in segments():
        tan = lambda sa: np.array([-sa['n'][1], 0, sa['n'][0]])
        T_SOLID = 0.55
        solid = lambda dy: (lambda sa: [(*roof_pt(sa, t)[:1], roof_pt(sa, t)[1] + dy) for t in np.linspace(0, T_SOLID, 9)])
        out.append(grid(sam, solid(0.0), 'roofm', seg, 'up'))
        out.append(grid(sam, solid(-0.45), 'clad', seg, 'down'))
        out.append(grid(sam, lambda sa: [(sa['D'] + BACK, YB - 0.45), (sa['D'] + BACK, YB + 0.05)], 'steel', seg, 'out'))
        out.append(grid(sam, lambda sa: [roof_pt(sa, t) for t in np.linspace(T_SOLID, 1.0, 7)], 'glass', seg, 'up'))
        def box(cd, cy, w, h):   # closed box section swept along the stand; cd, cy are functions of the sample
            return lambda sa: [(cd(sa) + a * w / 2, cy(sa) + b * h / 2) for a, b in ((1, 1), (-1, 1), (-1, -1), (1, -1), (1, 1))]
        gd = lambda sa: -OVER + 0.1; gy = lambda sa: roof_pt(sa, 1.0)[1] - 0.55
        out.append(grid(sam, box(gd, gy, 0.7, 0.9), 'steel', seg, lambda sa: (gd(sa), gy(sa))))
        for t in (0.3, 0.55, 0.78):
            pd = (lambda t: lambda sa: roof_pt(sa, t)[0])(t); py = (lambda t: lambda sa: roof_pt(sa, t)[1] - (0.72 if t <= T_SOLID else 0.2))(t)
            out.append(grid(sam, box(pd, py, 0.26, 0.26), 'steel', seg, (lambda pd, py: lambda sa: (pd(sa), py(sa)))(pd, py)))
        # façade: plinth, the lit concourse band, cladding to the eaves. The players' tunnel runs out through the south side, so that stretch stays open low down
        fd = lambda sa: sa['D'] + BACK; gap = lambda sa: sa['gap']
        out.append(grid(sam, lambda sa: [(fd(sa), 0.0), (fd(sa), 3.2)], 'conc', seg, 'out', skip=gap))
        out.append(grid(sam, lambda sa: [(fd(sa), 3.2), (fd(sa), 7.2)], 'win', seg, 'out', skip=gap, vfit=True))
        out.append(grid(sam, lambda sa: [(fd(sa), y) for y in np.linspace(7.2, YB - 0.45, 7)], 'clad', seg, 'out'))
        # rear wall above the top tier
        wd = lambda sa: sa['D'] + 0.45
        def wall_top(sa): t = (sa['D'] + BACK - wd(sa)) / (sa['D'] + BACK + OVER); return roof_pt(sa, t)[1] - 0.45
        if sam[0]['long']:
            out.append(grid(sam, lambda sa: [(wd(sa), sa['top']), (wd(sa), sa['top'] + 0.6)], 'clad', seg, 'in'))
            out.append(grid(sam, lambda sa: [(wd(sa), sa['top'] + 0.6), (wd(sa), sa['top'] + 3.4)], 'win', seg, 'in', vfit=True))
            out.append(grid(sam, lambda sa: [(wd(sa), y) for y in np.linspace(sa['top'] + 3.4, wall_top(sa), 4)], 'clad', seg, 'in'))
        else: out.append(grid(sam, lambda sa: [(wd(sa), y) for y in np.linspace(sa['top'], wall_top(sa), 5)], 'clad', seg, 'in'))
        # steelwork: a cantilever truss on every bay, fins up the façade
        M = []; lamps = []
        for sa in sam:
            side = tan(sa)
            if sa['truss']:
                ts = np.linspace(0.03, 0.97, 9); top = [at(sa, roof_pt(sa, t)[0], roof_pt(sa, t)[1] - (0.62 if t <= T_SOLID else 0.3)) for t in ts]
                bot = [tp - np.array([0, 4.2 * (1 - t) ** 1.25 + 0.4, 0]) for tp, t in zip(top, ts)]
                for k in range(len(ts) - 1):
                    M += [(top[k], top[k + 1], 0.3, 0.34, side), (bot[k], bot[k + 1], 0.3, 0.3, side), (top[k], bot[k], 0.18, 0.18, side), (bot[k], top[k + 1], 0.16, 0.16, side) if k % 2 == 0 else (top[k], bot[k + 1], 0.16, 0.16, side)]
                M.append((top[-1], bot[-1], 0.18, 0.18, side))
                M.append((at(sa, sa['D'] + 1.7, sa['top'] + 0.1), bot[0], 0.5, 0.5, side))          # the mast the truss springs from, standing on the back of the tier
            if sa['fin'] and not sa['gap']: M.append((at(sa, fd(sa) + 0.75, 2.4), at(sa, fd(sa) + 0.75, YB + 0.9), 0.14, 1.5, side))
        b = beams(M, 'steel', seg)
        if b: out.append(b)
        # roof-edge floodlights: one bar under the ring girder on every bay, angled down at the pitch
        L = []
        for a, b2 in zip(sam[:-1], sam[1:]):
            c = (at(a, -OVER + 0.35, roof_pt(a, 1)[1] - 1.12) + at(b2, -OVER + 0.35, roof_pt(b2, 1)[1] - 1.12)) / 2; tg = at(b2, 0, 0) - at(a, 0, 0); tg /= np.linalg.norm(tg)
            L.append((c - tg * 1.1, c + tg * 1.1, 0.42, 0.12, np.array([a['n'][0], 0.5, a['n'][1]])))
        lb = beams(L, 'lamp', seg)
        if lb: out.append(lb)
    return [s for s in out if s is not None and len(s['F'])]

def textures(outdir):
    from PIL import Image, ImageFilter
    rng = np.random.default_rng(7)
    def save(a, name): Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).save(f'{outdir}/{name}', quality=86)
    S = 512; n = lambda s=S: np.array(Image.fromarray((rng.random((s // 8, s // 8)) * 255).astype(np.uint8)).resize((s, s), Image.BICUBIC).filter(ImageFilter.GaussianBlur(2)), float) / 255
    # dark metal cladding: vertical seams every 0.5 m, a panel break every 3 m, a little waviness between panels
    a = np.full((S, S), 44.0) + (n() - 0.5) * 10; x = np.arange(S)
    for k in range(6): c = int(k * S / 6); a[:, c:c + 2] -= 18; a[:, (c + 3) % S:(c + 5) % S] += 9; a[:, c:c + int(S / 6)] += rng.uniform(-4, 4)
    a[0:3, :] -= 20; a[3:5, :] += 6
    save(np.stack([a * 1.0, a * 0.98, a * 0.97], axis=2), 'tex_clad.jpg')
    # standing-seam roof: pale metal, seams every 0.5 m running up the slope
    a = np.full((S, S), 150.0) + (n() - 0.5) * 16
    for k in range(8): c = int(k * S / 8); a[c:c + 2, :] += 28; a[(c + 2) % S:(c + 5) % S, :] -= 16
    save(np.stack([a * 0.98, a, a * 1.02], axis=2), 'tex_roof.jpg')
    # precast concrete panels 2.4 m by 1.2 m with tie holes and weathering
    a = np.full((S, S), 120.0) + (n() - 0.5) * 34 + (rng.random((S, S)) - 0.5) * 10
    for r in range(2):
        y = int(r * S / 2); a[y:y + 3, :] -= 46
        for cc in range(2): xx = int(cc * S / 2 + (S / 4 if r else 0)) % S; a[y:y + S // 2, xx:xx + 3] -= 46
    yy, xx = np.mgrid[0:S, 0:S]
    for cy in range(4):
        for cx in range(8): a[((yy - (cy + 0.5) * S / 4) ** 2 + (xx - (cx + 0.5) * S / 8) ** 2) < 9] -= 30
    a -= (np.linspace(0, 1, S)[:, None] ** 3) * 14
    save(np.stack([a, a * 0.97, a * 0.93], axis=2), 'tex_conc.jpg')
    # a run of lit glazing: warm interior, mullions, a transom, people as silhouettes
    W, H = 1024, 128; im = np.zeros((H, W, 3)); gy = np.linspace(1, 0.55, H)[:, None]
    im[:] = np.array([238, 190, 132])[None, None, :] * gy[:, :, None] * (0.85 + 0.3 * np.array(Image.fromarray((rng.random((4, 32)) * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC), float)[:, :, None] / 255)
    for k in range(rng.integers(26, 34)):
        px = int(rng.uniform(10, W - 10)); ph = int(rng.uniform(40, 74)); im[H - ph:H, px - 7:px + 7] *= 0.16; yy, xx = np.mgrid[0:H, 0:W]; im[((yy - (H - ph - 5)) ** 2 + (xx - px) ** 2) < 49] *= 0.16
    for k in range(16): c = int(k * W / 16); im[:, c:c + 4] = 14
    im[0:6] = 14; im[H - 8:H] = 14; im[int(H * 0.3):int(H * 0.3) + 2] *= 0.4
    save(im, 'tex_win.jpg')
