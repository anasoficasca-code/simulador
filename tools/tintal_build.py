"""Datos de la Biblioteca El Tintal y su plaza para data3d/tintal.js (de tools/cache/tintal_osm.json, OpenStreetMap ODbL).
Marco local de la biblioteca: u a lo largo del edificio (114,5 m), v perpendicular; el cilindro de la entrada y la plaza de palmas
quedan hacia v negativo (lado de la Av. Ciudad de Cali). Guarda también la huella en coordenadas del modelo (x = X + 7437,
y = 3270.96 - Y) para recortar la malla de Google y quitar la caja genérica (tools/mascara_build.py e index.html).
Salida: data3d/tintal.json"""
import json, math, os
from shapely.geometry import Polygon
RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
O = json.load(open(os.path.join(RAIZ, 'tools', 'cache', 'tintal_osm.json'), encoding='utf-8'))
bib = [o for o in O if o['id'] == 252078999][0]
pg = Polygon(bib['pts'])
r = list(pg.minimum_rotated_rectangle.exterior.coords)
e1 = (r[1][0] - r[0][0], r[1][1] - r[0][1]); e2 = (r[2][0] - r[1][0], r[2][1] - r[1][1])
if math.hypot(*e1) < math.hypot(*e2): e1, e2 = e2, e1
L, W = math.hypot(*e1), math.hypot(*e2)
a = math.atan2(e1[1], e1[0])
cx, cy = pg.minimum_rotated_rectangle.centroid.coords[0]
ux, uy = math.cos(a), math.sin(a); vx, vy = -uy, ux
loc = lambda p: ((p[0] - cx) * ux + (p[1] - cy) * uy, (p[0] - cx) * vx + (p[1] - cy) * vy)
# lado de la entrada: el lado donde la huella sobresale con la curva del cilindro (más puntos en el borde)
vs = [loc(p)[1] for p in bib['pts']]
lado = -1 if sum(1 for v in vs if v < 0) >= sum(1 for v in vs if v > 0) else 1
modelo = lambda p: [round(p[0] + 7437, 2), round(3270.96 - p[1], 2)]
# zona propia (recorte de Google): edificio + plaza de palmas + prado circular hacia el lado de la entrada
plaza = [(-L / 2 - 6, lado * (W / 2 - 2)), (L / 2 + 6, lado * (W / 2 - 2)), (L / 2 + 6, lado * (W / 2 + 62)), (-L / 2 - 6, lado * (W / 2 + 62))]
glob = lambda q: (cx + q[0] * ux + q[1] * vx, cy + q[0] * uy + q[1] * vy)
zona = Polygon(bib['pts']).buffer(3).union(Polygon([glob(q) for q in plaza]))
D = {'fuente': 'OpenStreetMap (ODbL) way 252078999 · Biblioteca El Tintal Manuel Zapata Olivella', 'c': [round(cx, 2), round(cy, 2)], 'a': round(a, 5), 'L': round(L, 1), 'W': round(W, 1), 'lado': lado,
     'huella_local': [[round(q, 2) for q in loc(p)] for p in bib['pts']], 'zona_modelo': [modelo(p) for p in zona.exterior.coords], 'huella_modelo': [modelo(p) for p in bib['pts']]}
json.dump(D, open(os.path.join(RAIZ, 'data3d', 'tintal.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('L %.1f W %.1f ang %.1f lado %d centro %.1f %.1f' % (L, W, math.degrees(a), lado, cx, cy))
