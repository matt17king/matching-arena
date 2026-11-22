"""Put the repainted design (and flattened bumps where the old marks were) into a copy of the Trionda model."""
import json, struct, io, os
from PIL import Image, ImageDraw
D = os.path.dirname(os.path.abspath(__file__)) + '/'
os.chdir('/home/user/matching-arena/exposure')
d = open('public/models/trionda.glb', 'rb').read(); l = struct.unpack('<I', d[12:16])[0]; j = json.loads(d[20:20 + l]); b0 = 20 + l + 8
views = [d[b0 + bv.get('byteOffset', 0):][:bv['byteLength']] for bv in j['bufferViews']]
def jpg(im, q): o = io.BytesIO(); im.convert('RGB').save(o, 'JPEG', quality=q, optimize=True); return o.getvalue()
views[j['images'][1]['bufferView']] = jpg(Image.open(D + 'mk-base.png'), 88)
n = Image.open(D + 'tex0.png').convert('RGB'); k = n.width / 1024
# flatten the bumps only inside the panels where the old marks were, so no square edge shows
hull = Image.open(D + 'hull.png').resize(n.size); box = Image.new('L', n.size, 0); dr = ImageDraw.Draw(box)
for b in [(372, 120, 525, 225), (25, 790, 160, 905), (770, 35, 905, 165)]: dr.rectangle(tuple(int(v * k) for v in b), fill=255)
from PIL import ImageChops, ImageFilter
m = ImageChops.multiply(box, hull).filter(ImageFilter.GaussianBlur(3))
n = Image.composite(Image.new('RGB', n.size, (128, 128, 255)), n, m)
views[j['images'][0]['bufferView']] = jpg(n, 95)
buf = b''
for v, bv in zip(views, j['bufferViews']):
    while len(buf) % 4: buf += b'\0'
    bv['byteOffset'] = len(buf); bv['byteLength'] = len(v); buf += v
while len(buf) % 4: buf += b'\0'
j['buffers'] = [{'byteLength': len(buf)}]
js = json.dumps(j, separators=(',', ':')).encode()
while len(js) % 4: js += b' '
open('public/models/trionda-mk.glb', 'wb').write(b'glTF' + struct.pack('<II', 2, 28 + len(js) + len(buf)) + struct.pack('<I', len(js)) + b'JSON' + js + struct.pack('<I', len(buf)) + b'BIN\0' + buf)
print('bytes', 28 + len(js) + len(buf))
