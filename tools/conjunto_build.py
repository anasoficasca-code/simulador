"""Conjuntos de vivienda en bloques alargados de 3 pisos con cubierta roja (Av. Américas, ~4.6330, -74.1389), como en Street View:
fachada crema con pilastras y franjas vino tinto, cubierta de teja/lámina roja a dos aguas, pórticos de entrada con techito rojo.
Une las huellas de buildings.json de cada barra y saca su rectángulo (centro, largo, ancho, ángulo) en coordenadas del modelo.
Salida: data3d/conjuntos.json (lo usan data3d/conjuntos.js, index.html para quitar las cajas genéricas y tools/mascara_build.py)."""
import json, math, os
from shapely.geometry import Polygon, box
from shapely.ops import unary_union
RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
MX = 111320 * math.cos(math.radians(4.63)); MY = 110540.0; Z = 19
lat0, lon0 = 4.63302409720484, -74.13892939526721
tile = lambda lat, lon: ((lon + 180) / 360 * 2 ** Z, (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * 2 ** Z)
tx, ty = tile(lat0, lon0); X0, Y0 = int(tx) - 2, int(ty) - 2
def pix2model(px, py):
    n = 2 ** Z; lon = (X0 + px / 256) / n * 360 - 180; lat = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * (Y0 + py / 256) / n))))
    return 5193.24 + (lon + 74.17) * MX, 2090.06 + (lat - 4.63) * MY
# área de los dos conjuntos en la imagen satelital (píxeles del mosaico de 1280 px)
zona = Polygon([pix2model(*p) for p in [(180, 250), (1000, 250), (1000, 860), (180, 860)]])
B = json.load(open(os.path.join(RAIZ, 'data3d', 'buildings.json')))
H = [Polygon(b['pts']).buffer(0) for b in B if len(b['pts']) > 3 and b['h'] >= 3 and zona.contains(Polygon(b['pts']).centroid)]
U = unary_union([h.buffer(1.2) for h in H])
barras = []
for g in (U.geoms if hasattr(U, 'geoms') else [U]):
    r = g.minimum_rotated_rectangle; c = list(r.exterior.coords)
    e1 = (c[1][0] - c[0][0], c[1][1] - c[0][1]); e2 = (c[2][0] - c[1][0], c[2][1] - c[1][1])
    if math.hypot(*e1) < math.hypot(*e2): e1, e2 = e2, e1
    L, W = math.hypot(*e1) - 2.4, math.hypot(*e2) - 2.4
    if L < 35 or W < 7 or W > 13.5: continue
    barras.append({'c': [round(r.centroid.x, 2), round(r.centroid.y, 2)], 'L': round(L, 1), 'W': round(W, 1), 'a': round(math.atan2(e1[1], e1[0]), 4)})
excl = unary_union([h for h in H]).buffer(2)
json.dump({'fuente': 'buildings.json + imagen Esri; estilo de Street View (Av. Américas)', 'barras': barras, 'zona': [[round(x, 2), round(y, 2)] for x, y in zona.exterior.coords]},
          open(os.path.join(RAIZ, 'data3d', 'conjuntos.json'), 'w', encoding='utf-8'), separators=(',', ':'))
print(len(H), 'huellas ->', len(barras), 'barras', [(b['L'], b['W']) for b in barras])

