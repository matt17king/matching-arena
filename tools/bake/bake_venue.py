# Offline light bake for a venue. Run with Blender's Python module (pip install bpy numpy):
#   python bake_venue.py <export-high.json> [<export-low.json>] --out site/public/bake/football.bin [--preview preview.png] [--samples 256]
# The export comes from the site itself (window.__mkBakeExport('football') in ?debug mode; see tools/bake/README.md).
# It lights the same geometry in Cycles (floodlights, roof lamps, LED boards, lit concourses, a dim sky; bounced light off the pitch and the stands)
# and writes the result per vertex for the structure, per probe for everything instanced, and as a small map for the pitch.
import sys, json, base64, struct, math, argparse
import numpy as np
import bpy
from mathutils import Vector, Matrix

ap = argparse.ArgumentParser(); ap.add_argument('exports', nargs='+'); ap.add_argument('--out', required=True); ap.add_argument('--preview'); ap.add_argument('--samples', type=int, default=256)
ap.add_argument('--edge', type=float, default=2.0); a = ap.parse_args()

def arr(b, dt): return np.frombuffer(base64.b64decode(b), dtype=dt)
def mat4(e): return np.array(e, dtype=np.float64).reshape(4, 4).T          # three.js stores column-major
def xf(M, p): return p @ M[:3, :3].T + M[:3, 3]
def rot(M, n): R = M[:3, :3]; v = n @ np.linalg.inv(R); l = np.linalg.norm(v, axis=1, keepdims=True); return v / np.maximum(l, 1e-9)   # inverse-transpose

exports = [json.load(open(p)) for p in a.exports]
E = exports[0]
RECV = {'concrete', 'concreteL', 'dark', 'steel', 'deck'}
# how finely each material is cut for the bake (metres). The seating concrete is mostly hidden under seats and people, and steel sections are thin, so both stay coarse
EDGE = {'concrete': 9.0, 'concreteL': 3.0, 'dark': 5.0, 'deck': 5.0, 'steel': 1e9}
ALBEDO = {'concrete': (0.2, 0.13, 0.12), 'concreteL': (0.3, 0.28, 0.26), 'dark': (0.05, 0.05, 0.05), 'steel': (0.22, 0.21, 0.2), 'deck': (0.03, 0.03, 0.03), 'pitch': (0.06, 0.13, 0.045), 'ground': (0.03, 0.03, 0.03), 'prop': (0.15, 0.15, 0.15)}
EMIT = {'board': ((1.0, 0.42, 0.32), 0.7), 'warm': ((1.0, 0.9, 0.76), 160.0), 'vom': ((1.0, 0.76, 0.5), 0.7), 'slot': ((1.0, 0.8, 0.55), 1.2), 'redline': ((1.0, 0.16, 0.06), 1.6)}

def tris_of(e):
    M = mat4(e['mw']); pos = arr(e['pos'], np.float32).reshape(-1, 3).astype(np.float64)
    nor = arr(e['nor'], np.float32).reshape(-1, 3).astype(np.float64) if e.get('nor') else None
    idx = arr(e['idx'], np.uint32) if e.get('idx') else np.arange(len(pos), dtype=np.uint32)
    idx = idx[: len(idx) // 3 * 3]; P = xf(M, pos)[idx].reshape(-1, 3, 3)
    if nor is None: n = np.cross(P[:, 1] - P[:, 0], P[:, 2] - P[:, 0]); n /= np.maximum(np.linalg.norm(n, axis=1, keepdims=True), 1e-9); N = np.repeat(n[:, None, :], 3, axis=1)
    else: N = rot(M, nor)[idx].reshape(-1, 3, 3)
    ok = np.linalg.norm(np.cross(P[:, 1] - P[:, 0], P[:, 2] - P[:, 0]), axis=1) > 1e-9
    return P[ok], N[ok], M

def subdivide(P, N, L):
    # bisect the longest edge of every triangle until none is longer than L. Midpoints of a shared edge coincide, so the result stays watertight
    for _ in range(40):
        e = np.stack([np.linalg.norm(P[:, 1] - P[:, 0], axis=1), np.linalg.norm(P[:, 2] - P[:, 1], axis=1), np.linalg.norm(P[:, 0] - P[:, 2], axis=1)], axis=1)
        k = e.argmax(axis=1); m = e.max(axis=1) > L
        if not m.any(): break
        Pk, Nk, kk = P[m], N[m], k[m]; r = np.arange(len(Pk)); i0, i1, i2 = kk, (kk + 1) % 3, (kk + 2) % 3
        A, B, Cc = Pk[r, i0], Pk[r, i1], Pk[r, i2]; nA, nB, nC = Nk[r, i0], Nk[r, i1], Nk[r, i2]
        Mp = (A + B) / 2; nM = nA + nB; nM /= np.maximum(np.linalg.norm(nM, axis=1, keepdims=True), 1e-9)
        P = np.concatenate([P[~m], np.stack([A, Mp, Cc], axis=1), np.stack([Mp, B, Cc], axis=1)]); N = np.concatenate([N[~m], np.stack([nA, nM, nC], axis=1), np.stack([nM, nB, nC], axis=1)])
    return P, N

def weld(P, N):
    flat = np.concatenate([np.round(P.reshape(-1, 3) * 1000), np.round(N.reshape(-1, 3) * 50)], axis=1).astype(np.int64)
    _, first, inv = np.unique(flat, axis=0, return_index=True, return_inverse=True)
    return P.reshape(-1, 3)[first], N.reshape(-1, 3)[first], inv.reshape(-1, 3)

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene; sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = a.samples; sc.cycles.max_bounces = 6; sc.cycles.diffuse_bounces = 4; sc.cycles.sample_clamp_indirect = 4.0; sc.cycles.use_adaptive_sampling = False
world = bpy.data.worlds.new('w'); sc.world = world; world.use_nodes = True; bg = world.node_tree.nodes['Background']; bg.inputs[0].default_value = (0.02, 0.026, 0.045, 1); bg.inputs[1].default_value = 0.6

def diffuse(name, col):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear(); o = nt.nodes.new('ShaderNodeOutputMaterial'); d = nt.nodes.new('ShaderNodeBsdfDiffuse'); d.inputs[0].default_value = (*col, 1); nt.links.new(d.outputs[0], o.inputs[0]); return m
def emission(name, col, s):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear(); o = nt.nodes.new('ShaderNodeOutputMaterial'); d = nt.nodes.new('ShaderNodeEmission'); d.inputs[0].default_value = (*col, 1); d.inputs[1].default_value = s; nt.links.new(d.outputs[0], o.inputs[0]); return m
def veil(name, col, t):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear(); o = nt.nodes.new('ShaderNodeOutputMaterial'); d = nt.nodes.new('ShaderNodeBsdfDiffuse'); d.inputs[0].default_value = (*col, 1)
    tr = nt.nodes.new('ShaderNodeBsdfTransparent'); mx = nt.nodes.new('ShaderNodeMixShader'); mx.inputs[0].default_value = t; nt.links.new(d.outputs[0], mx.inputs[1]); nt.links.new(tr.outputs[0], mx.inputs[2]); nt.links.new(mx.outputs[0], o.inputs[0]); return m

def add_mesh(name, V, F, mats, midx=None, smooth=True):
    me = bpy.data.meshes.new(name); me.from_pydata(V.tolist(), [], F.tolist()); me.update()
    for m in mats: me.materials.append(m)
    if midx is not None: me.polygons.foreach_set('material_index', midx.astype(np.int32))
    me.polygons.foreach_set('use_smooth', np.full(len(me.polygons), smooth)); me.update()
    ob = bpy.data.objects.new(name, me); sc.collection.objects.link(ob); return ob

# ---- receivers: everything that takes a per-vertex bake
recv = []; Vs = []; Fs = []; Mi = []; off = 0; rmats = [diffuse(k, ALBEDO[k]) for k in sorted(RECV)]; rname = sorted(RECV)
for e in E:
    if e['kind'] != 'mesh' or not e.get('key') or e['mat'] not in RECV: continue
    P, N, M = tris_of(e)
    if not len(P): continue
    P, N = subdivide(P, N, EDGE[e['mat']] * a.edge / 2.0); V, Nn, F = weld(P, N)
    recv.append(dict(key=e['key'], M=M, v0=off, nv=len(V), V=V, N=Nn, F=F)); Vs.append(V); Fs.append(F + off); Mi.append(np.full(len(F), rname.index(e['mat']))); off += len(V)
RV = np.concatenate(Vs); RF = np.concatenate(Fs); recv_ob = add_mesh('recv', RV, RF, rmats, np.concatenate(Mi))
print('receivers', len(recv), 'verts', len(RV), 'tris', len(RF), flush=True)
if len(exports) > 1:
    k2 = {e['key'] for e in exports[1] if e.get('key')}; k1 = {r['key'] for r in recv}; print('keys shared with second export:', len(k1 & k2), 'of', len(k1), flush=True)

# ---- everything else that blocks or emits light
groups = {}
for e in E:
    if e['kind'] != 'mesh' or e.get('key'): continue
    mt = e['mat']; cls = 'board' if mt == 'ShaderMaterial' else mt if mt in EMIT else 'roof' if mt == 'roof' else None
    if cls is None:
        if e['transparent'] or mt == 'glass' or mt in ('MeshBasicMaterial',): continue
        cls = 'prop'
    P, N, M = tris_of(e)
    if len(P): groups.setdefault(cls, []).append(P.reshape(-1, 3))
for cls, parts in groups.items():
    V = np.concatenate(parts); F = np.arange(len(V)).reshape(-1, 3)
    m = emission(cls, *EMIT[cls]) if cls in EMIT else veil('roof', (0.4, 0.42, 0.44), 0.45) if cls == 'roof' else diffuse('prop', ALBEDO['prop'])
    add_mesh(cls, V, F, [m], smooth=False); print(cls, len(F), 'tris', flush=True)

# ---- the pitch (baked on a grid) and the ground around it
ext = np.abs(RV[:, [0, 2]]).max(axis=0); SX, SZ, STEP = 124.0, 88.0, 0.5; nx, nz = int(SX / STEP) + 1, int(SZ / STEP) + 1
gx, gz = np.meshgrid(np.linspace(-SX / 2, SX / 2, nx), np.linspace(SZ / 2, -SZ / 2, nz)); PV = np.stack([gx.ravel(), np.zeros(nx * nz), gz.ravel()], axis=1)
ii = np.arange(nx * nz).reshape(nz, nx); q = np.stack([ii[:-1, :-1].ravel(), ii[:-1, 1:].ravel(), ii[1:, 1:].ravel(), ii[1:, :-1].ravel()], axis=1)   # wound to face up
pitch_ob = add_mesh('pitch', PV, q, [diffuse('pitch', ALBEDO['pitch'])])
G = 600.0; add_mesh('ground', np.array([[-G, -0.06, G], [G, -0.06, G], [G, -0.06, -G], [-G, -0.06, -G]]), np.array([[0, 3, 2, 1]]), [diffuse('ground', ALBEDO['ground'])])

# ---- probes: one per 0.8 m cell that holds a seat, a spectator, a step or a strut
CELL = 0.8; cells = {}
for ex in exports:
    for e in ex:
        if e['kind'] != 'inst' or not e.get('bakeInst'): continue
        M = mat4(e['mw']); im = arr(e['im'], np.float32).reshape(-1, 16)[: e['count']]; p = xf(M, im[:, 12:15].astype(np.float64))
        for x, y, z in p: cells.setdefault((round(x / CELL), round(y / CELL), round(z / CELL)), (x, y, z))
PP = np.array(list(cells.values())); up = np.array([0, 1.0, 0]); inw = -PP.copy(); inw[:, 1] = 0; inw /= np.maximum(np.linalg.norm(inw, axis=1, keepdims=True), 1e-6)
pn = up + 0.7 * inw; pn /= np.linalg.norm(pn, axis=1, keepdims=True); t1 = np.cross(pn, up); t1 /= np.maximum(np.linalg.norm(t1, axis=1, keepdims=True), 1e-6); t2 = np.cross(pn, t1)
c0 = PP + np.array([0, 0.55, 0]); s = 0.2; TV = np.stack([c0 + s * t1, c0 - 0.5 * s * t1 + 0.87 * s * t2, c0 - 0.5 * s * t1 - 0.87 * s * t2], axis=1)
flip = np.einsum('ij,ij->i', np.cross(TV[:, 1] - TV[:, 0], TV[:, 2] - TV[:, 0]), pn) < 0; TV[flip] = TV[flip][:, [0, 2, 1]]; TV = TV.reshape(-1, 3)   # every probe faces up and in
probe_ob = add_mesh('probes', TV, np.arange(len(TV)).reshape(-1, 3), [diffuse('probe', (0.2, 0.2, 0.2))], smooth=False)
for at in ('visible_camera', 'visible_diffuse', 'visible_glossy', 'visible_transmission', 'visible_volume_scatter', 'visible_shadow'): setattr(probe_ob, at, False)
print('probes', len(PP), flush=True)

# ---- lights: four corner towers, taken from where the receivers end
def look(ob, src, dst, upv=(0, 1, 0)):
    f = (Vector(dst) - Vector(src)).normalized(); r = f.cross(Vector(upv)).normalized(); u = r.cross(f)
    ob.matrix_world = Matrix(((r.x, u.x, -f.x, src[0]), (r.y, u.y, -f.y, src[1]), (r.z, u.z, -f.z, src[2]), (0, 0, 0, 1)))
for sx in (-1, 1):
    for sz in (-1, 1):
        L = bpy.data.lights.new('tower', 'SPOT'); L.energy = 46000.0 * 1000 / 1000; L.spot_size = math.radians(78); L.spot_blend = 0.6; L.shadow_soft_size = 3.2; L.color = (1.0, 0.95, 0.88)
        ob = bpy.data.objects.new('tower', L); sc.collection.objects.link(ob); look(ob, (sx * 81, 60, sz * 62), (sx * 81 * 0.2, 0, sz * 62 * 0.2))

# ---- preview render, to check the lighting by eye before trusting the bake
if a.preview:
    cam = bpy.data.cameras.new('c'); cam.lens = 22; co = bpy.data.objects.new('c', cam); sc.collection.objects.link(co); look(co, (38, 22, 34), (-20, 6, -30)); sc.camera = co
    sc.render.resolution_x, sc.render.resolution_y = 960, 540; sc.cycles.samples = 48; sc.cycles.use_denoising = True; sc.render.filepath = a.preview; sc.view_settings.view_transform = 'Standard'; sc.view_settings.exposure = 2.2
    try: bpy.ops.render.render(write_still=True)
    except Exception as ex: print('preview failed', ex)
    sc.cycles.samples = a.samples

# ---- bake
def bake(ob):
    me = ob.data; ca = me.color_attributes.new('bake', 'FLOAT_COLOR', 'POINT'); me.color_attributes.active_color = ca; me.color_attributes.render_color_index = me.color_attributes.find('bake')
    for o in sc.objects: o.select_set(False)
    ob.select_set(True); bpy.context.view_layer.objects.active = ob
    bpy.ops.object.bake(type='DIFFUSE', pass_filter={'DIRECT', 'INDIRECT'}, target='VERTEX_COLORS')
    out = np.zeros(len(me.vertices) * 4, dtype=np.float32); me.color_attributes['bake'].data.foreach_get('color', out); return out.reshape(-1, 4)[:, :3].astype(np.float64)
import time
t0 = time.time(); Cp = bake(pitch_ob); print('pitch baked', round(time.time() - t0), 's', flush=True)
t0 = time.time(); Cr = bake(recv_ob); print('receivers baked', round(time.time() - t0), 's', flush=True)
t0 = time.time(); Cq = bake(probe_ob).reshape(-1, 3, 3).mean(axis=1); print('probes baked', round(time.time() - t0), 's', flush=True)

# ---- normalise to the light on the centre circle, pack, write
lum = lambda c: c @ np.array([0.2126, 0.7152, 0.0722])
centre = (np.hypot(PV[:, 0], PV[:, 2]) < 9); E0 = float(lum(Cp[centre]).mean()); print('E0', E0, 'recv mean', float(lum(Cr).mean()) / E0, 'probe mean', float(lum(Cq).mean()) / E0, flush=True)
RANGE = 4.0
def enc(c): v = np.clip(c / E0 / RANGE, 0, 1); b = np.zeros((len(c), 4), dtype=np.uint8); b[:, :3] = np.round(np.sqrt(v) * 255); b[:, 3] = 255; return b
blob = bytearray(); meta = dict(range=RANGE, meshes=[], fallback=float(np.clip(lum(Cq).mean() / E0, 0, RANGE)))
def put(x): o = len(blob); blob.extend(x.tobytes()); blob.extend(b'\0' * ((4 - len(blob) % 4) % 4)); return o
for r in recv:
    Mi_ = np.linalg.inv(r['M']); loc = xf(Mi_, r['V']).astype(np.float32); nl = r['N'] @ r['M'][:3, :3]; nl /= np.maximum(np.linalg.norm(nl, axis=1, keepdims=True), 1e-9)
    n8 = np.zeros((r['nv'], 4), dtype=np.int8); n8[:, :3] = np.round(nl * 127)
    i16 = r['nv'] < 65536
    meta['meshes'].append(dict(key=r['key'], nv=r['nv'], ni=int(r['F'].size), i16=i16, pos=put(loc), nor=put(n8), col=put(enc(Cr[r['v0']: r['v0'] + r['nv']])), idx=put(r['F'].astype(np.uint16 if i16 else np.uint32))))
meta['probes'] = dict(cell=CELL, n=len(PP), pos=put(PP.astype(np.float32)), col=put(enc(Cq)))
img = (Cp / E0).reshape(nz, nx, 3)
k = np.array([1, 2, 1.0]); k /= k.sum()
for ax in (0, 1): img = np.apply_along_axis(lambda m: np.convolve(np.pad(m, 1, mode='edge'), k, mode='valid'), ax, img)
tex = np.zeros((nz, nx, 4), dtype=np.uint8); tex[..., :3] = np.round(np.clip(img / 2.0, 0, 1) * 255); tex[..., 3] = 255
meta['pitch'] = dict(w=nx, h=nz, sx=SX, sz=SZ, off=put(tex))    # row 0 is the +z edge, which is v = 0 once the plane is laid flat
js = json.dumps(meta, separators=(',', ':')).encode(); pad = b' ' * ((4 - len(js) % 4) % 4); js += pad
open(a.out, 'wb').write(struct.pack('<II', 0x454b4142, len(js)) + js + bytes(blob)); print('wrote', a.out, round((12 + len(js) + len(blob)) / 1e6, 2), 'MB', flush=True)
