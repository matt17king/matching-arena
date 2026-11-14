# Builds the light masks for the virtual world's rooms: one small PNG per room, three masks packed into its channels.
#   red   = glass: where the outside is seen (the window panes; on the rooftop, the sky)
#   green = things that make their own light (the fire, LED strips, lit cabinets): they stay bright at night
#   blue  = how much daylight a spot gets: strongest by the windows, fading into the room
# Each window is a generous outline; inside it, only pixels that actually look like glass (bright, not warm) are kept,
# so frames, cushions and anything standing in front of the window are left out.
# Run from exposure/:  python3 tools/masks.py [debug-dir]
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

W, H = 2000, 1116
ROOMS = {
    'living': dict(polys=[[(0, 0), (82, 0), (82, 664), (0, 706)], [(314, 0), (512, 0), (512, 404), (314, 524)], [(544, 0), (742, 0), (742, 266), (544, 384)]]),
    'office': dict(polys=[[(0, 0), (52, 0), (52, 760), (0, 760)], [(306, 0), (500, 0), (500, 524), (306, 648)], [(526, 0), (706, 0), (706, 378), (526, 496)]]),
    'gym': dict(polys=[[(1316, 0), (1536, 0), (1536, 548), (1316, 414)], [(1560, 0), (1790, 0), (1790, 694), (1560, 556)]],
                cut=[[(1768, 488), (1800, 488), (1800, 536), (1768, 536)], [(1754, 540), (1800, 540), (1800, 626), (1754, 626)]]),
    'wardrobe': dict(polys=[[(1606, 0), (1724, 0), (1724, 480), (1606, 480)]]),
    'rooftop': dict(sky=True),
    'garage': dict(polys=[]),
}


def poly_mask(polys):
    m = Image.new('L', (W, H), 0)
    d = ImageDraw.Draw(m)
    for p in polys:
        d.polygon(p, fill=255)
    return np.asarray(m) > 0


def morph(a, size, fn):
    return np.asarray(Image.fromarray((a * 255).astype('uint8')).filter(fn(size))) > 127


def build(room, cfg, debug=None):
    im = Image.open(f'public/rooms/{room}.webp').convert('RGB')
    a = np.asarray(im).astype('float32')
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    lum = 0.299 * r + 0.587 * g + 0.114 * b

    if cfg.get('sky'):
        # outdoors: the sky is the bright haze at the top, fading out toward the skyline
        yy = np.linspace(0, H - 1, H)[:, None]
        fall = np.clip((430 - yy) / 230, 0, 1)
        glass = np.clip((lum - 150) / 60, 0, 1) * fall
        glass = np.asarray(Image.fromarray((glass * 255).astype('uint8')).filter(ImageFilter.GaussianBlur(5))).astype('float32') / 255
    else:
        inside = poly_mask(cfg['polys']) if cfg['polys'] else np.zeros((H, W), bool)
        if cfg.get('cut'):
            inside &= ~poly_mask(cfg['cut'])
        looks = (lum > cfg.get('lum', 150)) & (b >= r - 8)
        m = inside & looks
        m = morph(m, 13, ImageFilter.MaxFilter); m = morph(m, 13, ImageFilter.MinFilter)   # close: fill the darker bits of towers
        m = morph(m, 5, ImageFilter.MinFilter); m = morph(m, 5, ImageFilter.MaxFilter)   # open: drop stray specks and thin lines
        m &= inside
        glass = np.asarray(Image.fromarray((m * 255).astype('uint8')).filter(ImageFilter.GaussianBlur(1.3))).astype('float32') / 255

    # things that glow: bright and clearly warm. Never inside the glass.
    glow = ((lum > 196) & (r - b > 78)).astype('float32')
    glow = np.asarray(Image.fromarray((glow * 255).astype('uint8')).filter(ImageFilter.GaussianBlur(3))).astype('float32') / 255
    glow = np.clip(glow * 1.5, 0, 1) * (1 - glass)

    # daylight reach: the glass, spread a long way into the room
    hard = (glass > 0.5).astype('float32')
    spill = np.asarray(Image.fromarray((hard * 255).astype('uint8')).filter(ImageFilter.GaussianBlur(150))).astype('float32') / 255
    spill = np.clip(spill * 2.6, 0, 1)
    if cfg.get('sky'):
        spill[:] = 1.0  # outdoors, everything is under the sky

    out = np.stack([glass, glow, spill], -1)
    Image.fromarray((np.clip(out, 0, 1) * 255).astype('uint8')).resize((1000, 558), Image.LANCZOS).save(f'public/rooms/masks/{room}.png', optimize=True)
    if debug:
        tint = a.copy()
        tint[..., 0] = np.clip(tint[..., 0] * (1 - glass * 0.75) + 255 * glass * 0.75, 0, 255)
        tint[..., 1] = np.clip(tint[..., 1] * (1 - glass * 0.75), 0, 255)
        tint[..., 1] = np.clip(tint[..., 1] * (1 - glow) + 255 * glow, 0, 255)
        tint[..., 2] = np.clip(tint[..., 2] * (1 - glass * 0.75), 0, 255)
        Image.fromarray(tint.astype('uint8')).save(f'{debug}/mask-{room}.jpg', quality=85)
        Image.fromarray((spill * 255).astype('uint8')).resize((500, 279)).save(f'{debug}/spill-{room}.jpg', quality=80)
    return glass.mean()


if __name__ == '__main__':
    import os
    os.makedirs('public/rooms/masks', exist_ok=True)
    dbg = sys.argv[1] if len(sys.argv) > 1 else None
    for room, cfg in ROOMS.items():
        print(room, 'glass %.3f' % build(room, cfg, dbg))
