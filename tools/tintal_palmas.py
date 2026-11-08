"""Palmas de la plaza de la Biblioteca El Tintal detectadas en la imagen satelital (Esri World Imagery, nivel 19, ~0,3 m/píxel):
copas verde oscuro y redondas sobre el piso claro de la plaza. Agrega 'palmas' (marco del giro) a data3d/tintal.json y guarda
un mosaico de control en tools/cache/tintal_palmas.png."""
import json, math, os, urllib.request
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage
RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
CACHE = os.path.join(RAIZ, 'tools', 'cache', 'esri19'); os.makedirs(CACHE, exist_ok=True)
LAT0, LON0 = 4.640683, -74.149778
MX, MY = 111320 * math.cos(math.radians(4.63)), 110540.0
Z = 19
D = json.load(open(os.path.join(RAIZ, 'data3d', 'tintal.json'), encoding='utf-8'))
cx, cy, a, L, W, lado = D['c'][0], D['c'][1], D['a'], D['L'], D['W'], D['lado']
ux, uy = math.cos(a), math.sin(a); vx, vy = -uy, ux
def ll(X, Y): return LAT0 - Y / MY, LON0 + X / MX
def tile(lat, lon):
    n = 2 ** Z; x = (lon + 180) / 360 * n; y = (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n; return x, y
R = 130
la0, lo0 = ll(cx - R, cy + R); la1, lo1 = ll(cx + R, cy - R)
tx0, ty0 = tile(la1, lo0); tx1, ty1 = tile(la0, lo1)
X0, Y0, X1, Y1 = int(tx0), int(ty0), int(tx1), int(ty1)
mos = Image.new('RGB', ((X1 - X0 + 1) * 256, (Y1 - Y0 + 1) * 256))
for X in range(X0, X1 + 1):
    for Y in range(Y0, Y1 + 1):
        f = os.path.join(CACHE, '%d_%d.jpg' % (X, Y))
        if not os.path.exists(f):
            u = f'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{Z}/{Y}/{X}'
            open(f, 'wb').write(urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'REN3D-maqueta/1.0'}), timeout=30).read())
        mos.paste(Image.open(f).convert('RGB'), ((X - X0) * 256, (Y - Y0) * 256))
A = np.asarray(mos).astype(float) / 255
H, Wp = A.shape[:2]
# giro (X, Y) de cada píxel
def px2g(px, py):
    n = 2 ** Z; tx = X0 + px / 256; ty = Y0 + py / 256
    lon = tx / n * 360 - 180; lat = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * ty / n))))
    return (lon - LON0) * MX, -(lat - LAT0) * MY
def g2px(X, Y):
    lat, lon = ll(X, Y); tx, ty = tile(lat, lon); return (tx - X0) * 256, (ty - Y0) * 256
r, g, b = A[..., 0], A[..., 1], A[..., 2]
lum = 0.3 * r + 0.59 * g + 0.11 * b
oscuro = (g - r > 0.012) & (g - b > 0.03) & (lum < 0.62)   # copa verde (al sol o en sombra), no el piso rosado ni el asfalto gris
oscuro = ndimage.binary_opening(oscuro, iterations=1)
# solo dentro de la plaza: franja del lado de la entrada, fuera del edificio
yy, xx = np.mgrid[0:H, 0:Wp]
gx0, gy0 = px2g(0, 0); gx1, gy1 = px2g(Wp, H)
GX = gx0 + (gx1 - gx0) * xx / Wp; GY = gy0 + (gy1 - gy0) * yy / H
U = (GX - cx) * ux + (GY - cy) * uy; V = (GX - cx) * vx + (GY - cy) * vy
plaza = (np.abs(U) < L / 2 + 30) & (lado * V > W / 2 + 2) & (lado * V < W / 2 + 95)
lab, n = ndimage.label(oscuro & plaza)
m_px = (gx1 - gx0) / Wp  # metros por píxel
palmas = []
for i in range(1, n + 1):
    ys, xs = np.nonzero(lab == i); area = len(xs) * m_px * m_px
    if area < 6 or area > 110: continue
    w, h = (xs.max() - xs.min() + 1) * m_px, (ys.max() - ys.min() + 1) * m_px
    if max(w, h) / max(0.1, min(w, h)) > 2.6: continue
    X, Y = px2g(xs.mean(), ys.mean())
    palmas.append([round(X, 2), round(Y, 2), round(math.sqrt(area / math.pi), 2)])
# copas muy claras al sol que el umbral no separa del piso: marcadas a mano sobre el mismo mosaico (píxeles del recorte 480,220)
MANO = [(200, 283), (222, 307), (243, 300), (268, 328), (240, 345), (331, 440), (354, 470), (315, 125), (386, 145), (440, 343), (475, 360), (230, 478), (198, 180), (250, 160)]
for px, py in MANO: X, Y = px2g(px + 480, py + 220); palmas.append([round(X, 2), round(Y, 2), 2.6])
# fuera: lo que cae del otro lado del borde de la plaza (andén y avenida)
def enVia(X, Y):
    px, py = g2px(X, Y); x, y = px - 480, py - 220
    return (x - 540) * 230 + (y - 370) * 210 > 0
palmas = [p for p in palmas if not enVia(p[0], p[1])]
D['palmas'] = palmas
from shapely.geometry import MultiPoint, Polygon as Pg
zona = Pg([(p[0] - 7437, 3270.96 - p[1]) for p in D['zona_modelo']]).union(MultiPoint([(p[0], p[1]) for p in palmas]).convex_hull.buffer(9)).simplify(1.0)
D['zona_modelo'] = [[round(x + 7437, 2), round(3270.96 - y, 2)] for x, y in zona.exterior.coords]
json.dump(D, open(os.path.join(RAIZ, 'data3d', 'tintal.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
dr = ImageDraw.Draw(mos)
for X, Y, rr in palmas:
    p = g2px(X, Y); s = rr / m_px; dr.ellipse([p[0] - s, p[1] - s, p[0] + s, p[1] + s], outline=(255, 0, 0), width=2)
for i, j in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
    pass
mos.save(os.path.join(RAIZ, 'tools', 'cache', 'tintal_palmas.png'))
print('palmas', len(palmas), 'm/px %.2f' % m_px)
