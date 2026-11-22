"""The Matt King edition of the Trionda: the same ball, repainted in the site's walnut, bronze and red, with the host
nations' motifs swapped for patterns of its own and the maker's marks swapped for Matt's."""
import numpy as np
from PIL import Image, ImageFilter, ImageDraw, ImageFont, ImageOps
D = '/tmp/claude-0/-home-user-matching-arena/0690963c-46f8-5bf1-9e3a-2ca16b75acc4/scratchpad/mk/'
src = Image.open(D + 'tex1.png').convert('RGB'); W, H = src.size
a = np.asarray(src).astype(np.float32) / 255
r, g, b = a[..., 0], a[..., 1], a[..., 2]
mx, mn = a.max(-1), a.min(-1); sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0); lum = a @ np.array([.299, .587, .114])
# hue in degrees
d = np.maximum(mx - mn, 1e-6)
hue = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
col = sat > .32
gold = col & (hue > 28) & (hue < 62) & (lum > .35)
red = col & ~gold & ((hue < 28) | (hue > 330))
green = col & ~gold & (hue >= 62) & (hue < 170)
blue = col & ~gold & (hue >= 170) & (hue <= 330)

def mimg(m): return Image.fromarray((m * 255).astype(np.uint8))
def grow(m, px): return np.asarray(mimg(m).filter(ImageFilter.MaxFilter(px * 2 + 1))) > 127
def shrink(m, px): return np.asarray(mimg(m).filter(ImageFilter.MinFilter(px * 2 + 1))) > 127
def blur(x, rad): return np.asarray(Image.fromarray((np.clip(x, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(rad))).astype(np.float32) / 255

# each panel's colour group, filled in: a pixel belongs to whichever group dominates around it
groups = {'red': red, 'green': green, 'blue': blue}
dens = {k: blur(v.astype(np.float32), 18) for k, v in groups.items()}
anycol = shrink(grow(col | gold, 6), 6)            # the panels and ribbons, with their gaps closed
which = np.argmax(np.stack([dens['red'], dens['green'], dens['blue']]), 0)
border = anycol & ~shrink(anycol, 9)
hull = shrink(grow(anycol, 36), 36)                 # panels with the marks inside them filled in                 # the gold edge around each panel
grain = lum - blur(lum, 2)                           # the fine sparkle in the print, without the big motifs

C = {'cream': (239, 230, 214), 'walnut': (32, 20, 12), 'red': (206, 14, 32), 'bronze': (192, 146, 90), 'gold': (214, 170, 108)}
c = lambda k: np.array(C[k], np.float32) / 255
out = a.copy()
# the body: the white goes warm cream, keeping its embossed texture
body = ~anycol & (lum > .55)
out[body] = (c('cream') * (lum[body] / np.median(lum[body]))[:, None]).clip(0, 1)

yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
# the panels' own patterns: tailored pinstripes on walnut, ripples on red ("fans spreading out"), a fine dot grid on bronze
stripes = ((xx + yy) % 34 < 3).astype(np.float32)
cx, cy = W * .5, H * .5
ripple = ((np.hypot(xx - cx, yy - cy) % 46) < 5).astype(np.float32)
dots = (((xx % 26) - 13) ** 2 + ((yy % 26) - 13) ** 2 < 16).astype(np.float32)
fill = anycol & ~border
for gi, (base, pat, ink, amt) in enumerate([('red', ripple, 'walnut', .22), ('walnut', stripes, 'gold', .55), ('bronze', dots, 'walnut', .35)]):
    m = fill & (which == gi)
    tone = c(base)[None, :] * (1 + grain[m][:, None] * 1.1)
    out[m] = (tone * (1 - pat[m][:, None] * amt) + c(ink)[None, :] * pat[m][:, None] * amt).clip(0, 1)
out[border] = (c('gold')[None, :] * (0.85 + lum[border][:, None] * .3)).clip(0, 1)

img = Image.fromarray((out * 255).astype(np.uint8))
draw = ImageDraw.Draw(img)
F = lambda f, s: ImageFont.truetype('/usr/share/fonts/opentype/inter/' + f, s)
MONO = lambda s: ImageFont.truetype('/usr/share/fonts/truetype/jetbrains-mono/' + sorted(__import__('os').listdir('/usr/share/fonts/truetype/jetbrains-mono'))[0], s)

def panel_fill(box, gi):
    """paint over a maker's mark with its panel's own colour and pattern"""
    x0, y0, x1, y1 = box
    m = np.zeros((H, W), bool); m[y0:y1, x0:x1] = True; m &= hull & ~grow(border & ~shrink(hull, 10), 2) & shrink(hull, 9)
    base, pat, ink, amt = [('red', ripple, 'walnut', .22), ('walnut', stripes, 'gold', .55), ('bronze', dots, 'walnut', .35)][gi]
    arr = np.asarray(img).astype(np.float32) / 255
    gr = np.roll(grain, (97, 131), (0, 1))[m][:, None]
    arr[m] = ((c(base)[None, :] * (1 + gr * 1.1)) * (1 - pat[m][:, None] * amt) + c(ink)[None, :] * pat[m][:, None] * amt).clip(0, 1)
    return Image.fromarray((arr * 255).astype(np.uint8))

S = W / 1024   # the boxes below were found on the 1024px preview
bx = lambda x0, y0, x1, y1: tuple(int(v * S) for v in (x0, y0, x1, y1))
marks = {'trionda': (bx(372, 120, 525, 225), 1), 'adidas': (bx(25, 790, 160, 905), 0), 'fifa26': (bx(770, 35, 905, 165), 2)}
for k, (box, gi) in marks.items(): img = panel_fill(box, gi)
# the small tag sat on the white body, not a panel: it goes back to the body's cream
tb = bx(772, 260, 822, 308); arr = np.asarray(img).astype(np.float32) / 255
tm = np.zeros((H, W), bool); tm[tb[1]:tb[3], tb[0]:tb[2]] = True
ring = np.zeros((H, W), bool); ring[tb[1] - 30:tb[3] + 30, tb[0] - 30:tb[2] + 30] = True; ring &= body & ~tm
# copy a clean patch of the body from elsewhere on the ball: same size, all body, closest in colour to the tag's surroundings
plain = body
want = np.median(arr[ring], 0); h, w = tb[3] - tb[1], tb[2] - tb[0]; best = None
for y in range(0, H - h, max(4, h // 6)):
    for x in range(0, W - w, max(4, w // 6)):
        if not plain[y:y + h, x:x + w].all() or (abs(y - tb[1]) < h * 2 and abs(x - tb[0]) < w * 2): continue
        pt = arr[y:y + h, x:x + w].reshape(-1, 3); dcol = np.abs(pt.mean(0) - want).sum() + pt.std(0).sum() * 1.5
        if best is None or dcol < best[0]: best = (dcol, y, x)
_, y, x = best; pt = arr[y:y + h, x:x + w].copy()
# match the patch to what actually surrounds the tag: a thin frame just outside it
fr = np.zeros((H, W), bool); fr[tb[1] - 6:tb[3] + 6, tb[0] - 6:tb[2] + 6] = True; fr[tb[1]:tb[3], tb[0]:tb[2]] = False; fr &= (lum > .6) & (sat < .2)
arr[tb[1]:tb[3], tb[0]:tb[2]] = (pt - pt.reshape(-1, 3).mean(0) + np.median(arr[fr], 0)).clip(0, 1)
img = Image.fromarray((arr * 255).astype(np.uint8))
draw = ImageDraw.Draw(img)
cream, walnut, red = C['cream'], C['walnut'], C['red']

def text(cxy, s, font, fill, angle=0):
    t = Image.new('RGBA', (int(font.size * len(s) * 1.2) + 40, int(font.size * 1.6)), (0, 0, 0, 0))
    ImageDraw.Draw(t).text((20, int(font.size * .1)), s, font=font, fill=fill)
    t = t.crop(t.getbbox()).rotate(angle + 180, expand=True, resample=Image.BICUBIC)
    img.paste(t, (int(cxy[0] - t.width / 2), int(cxy[1] - t.height / 2)), t)

# where the TRIONDA wordmark was (a walnut panel): the name, and the idea underneath
text((462 * S, 164 * S), 'MATT KING', F('InterDisplay-Bold.otf', int(26 * S)), cream, 6)
text((464 * S, 190 * S), "SPORT'S NEXT FANS ALREADY EXIST", MONO(int(6.5 * S)), C['gold'], 6)
# where the three stripes were (a red panel): the M. mark from the site's icon
text((100 * S, 838 * S), 'M.', F('InterDisplay-BoldItalic.otf', int(52 * S)), cream, 18)
# where the tournament emblem was (a bronze panel): N° 17, the number on the booking pass
text((838 * S, 98 * S), 'N°17', F('InterDisplay-Bold.otf', int(40 * S)), walnut, 0)
img.save(D + 'mk-base.png')
mimg(hull).save(D + 'hull.png')
img.resize((1024, 1024)).save(D + 'mk-small.png')
print('ok')
