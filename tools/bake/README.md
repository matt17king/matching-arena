# Baked lighting

A venue can ship a light bake: bounced floodlight, soft shadowing and colour spill calculated offline in Blender (Cycles)
from the site's own geometry, then applied in the browser. The site still builds every model in code; the bake only adds light.

What a bake holds (`site/public/bake/<venue>.bin`):

- **Structure**: the venue's concrete, steel and roof decks, subdivided, with light stored per vertex.
- **Probes**: one light value per 0.8 m cell that holds a seat, a spectator, a step or a strut. Everything instanced reads its nearest probe.
- **Pitch map**: how the light falls across the playing surface, laid over the turf.

If the file is missing the venue falls back to live lighting. `?debug&nobake` forces that for comparison.

## Re-baking (needed whenever the venue's geometry changes)

```sh
# 1. export the geometry from a running build (both quality levels, so phone seat layouts get probes too)
cd site && npm run build && npx vite preview --port 4173 &
node bakeexport.mjs football-high.json football high     # Playwright: calls window.__mkBakeExport('football')
node bakeexport.mjs football-low.json  football low

# 2. bake (pip install bpy numpy; about 15 minutes on 4 cores at 128 samples)
python tools/bake/bake_venue.py football-high.json football-low.json --out site/public/bake/football.bin --preview preview.png
```

Meshes are matched between export and bake by material, position and vertex count, so a stale bake simply stops applying to
whatever moved. The lights in the bake (tower positions, strengths, emitter colours) are set at the top of `bake_venue.py`.
