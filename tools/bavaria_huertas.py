"""Ajuste rápido sobre los resultados de tools/bavaria_pres_datos.py (sin recalcular la sintaxis):
1. Sintaxis: los tramos que no alcanza ninguna fuente (componentes aisladas de la red) quedan sin valor (null) y el
   resumen se recalcula solo con los tramos conectados: promedios ponderados por longitud, profundidad media
   (TD/(N-1), despejada de NAIN = N^1,2/(TD+2)) y sinergia (r² entre NAIN Rn y NAIN R800).
2. Huertas: manzanas ordenadas de 30 x 26 m sobre la retícula de las naves. Los árboles sueltos se conservan dentro de la
   manzana (huerta agroforestal): el bancal que toca un árbol se omite, pero la retícula no se mueve.
Uso: python tools/bavaria_huertas.py"""
import json, math, os
import numpy as np
from shapely.geometry import Polygon, Point, LineString, box
from shapely.ops import unary_union

RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'); D = os.path.join(RAIZ, 'data3d')
P = json.load(open(os.path.join(D, 'bavaria_pres.json'), encoding='utf-8'))
SX = json.load(open(os.path.join(D, 'bavaria_sx.json'), encoding='utf-8'))
LOTE = Polygon(P['sitio']).buffer(0); C = LOTE.centroid
LIM = Polygon(SX['limite']).buffer(0)

# ---- 1. sintaxis
seg = SX['seg']; NA = sum(1 for s in seg if s['a']); NB = len(seg)
for s in seg:
    s['L'] = LineString(s['p']).length if len(s['p']) > 1 else 0
    for k in ('a', 'b'):
        if s[k] and s[k][0] > 50: s[k] = None  # no alcanzado: NAIN = N^1,2 / 2
def stats(sel, k, N):
    T = [s for s in seg if s[k] and sel(s)]
    L = np.array([s['L'] for s in T]); v = np.array([s[k] for s in T])
    wm = lambda j: float((v[:, j] * L).sum() / L.sum())
    prof = (N ** 1.2 / v[:, 0] - 2) / (N - 1)
    return {'n': len(T), 'km': round(float(L.sum()) / 1000, 2), 'nain': round(wm(0), 3), 'nain8': round(wm(1), 3), 'nach': round(wm(2), 3),
            'prof': round(float((prof * L).sum() / L.sum()), 2), 'sinergia': round(float(np.corrcoef(v[:, 0], v[:, 1])[0, 1] ** 2), 3)}
cerca = lambda s: s['n'] or LineString(s['p']).distance(LOTE) < 600
enK = lambda s: s['n'] or s['k']
P['resumen'] = {'antes_600m': stats(cerca, 'a', NA), 'despues_600m': stats(cerca, 'b', NB), 'antes_todo': stats(enK, 'a', NA), 'despues_todo': stats(enK, 'b', NB)}
print(json.dumps(P['resumen'], indent=1))
for s in seg: s.pop('L', None)
json.dump(SX, open(os.path.join(D, 'bavaria_sx.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))

# ---- 2. huertas
AR = P['arboles']; BV = P['edif']
EDIF = unary_union([Polygon(e['p']).buffer(0) for e in BV])
TANQ = unary_union([Point(t).buffer(9) for t in P['tanques']])
BOSQUE = unary_union([Point(a[0], a[1]).buffer(a[3] + 2.5) for a in AR if a[4] == 1])
sueltos = [(a[0], a[1], a[3]) for a in AR if a[4] == 0]
RED = unary_union([LineString(s['p']) for s in seg if s['n']])
plaza = unary_union([Polygon(e['p']).buffer(22) for e in BV if Polygon(e['p']).area > 2500])
ZONAS = unary_union([box(9485, 3005, 9555, 3060).buffer(6), box(9115, 3127.5, 9185, 3172.5).buffer(6)])
VETO = unary_union([EDIF.buffer(10), TANQ, RED.buffer(4.5), plaza, ZONAS])
DENTRO = LOTE.buffer(-10)
ang = P['angulo']; ux, uy = math.cos(ang), math.sin(ang); nx, ny = -uy, ux
BU, BVv, PU, PV = 30.0, 26.0, 34.0, 30.0
us = [(x - C.x) * ux + (y - C.y) * uy for x, y in LOTE.exterior.coords]
vs = [(x - C.x) * nx + (y - C.y) * ny for x, y in LOTE.exterior.coords]
def rect(u0, v0, du, dv):
    return Polygon([(C.x + ux * (u0 + a) + nx * (v0 + b), C.y + uy * (u0 + a) + ny * (v0 + b)) for a, b in ((-du, -dv), (du, -dv), (du, dv), (-du, dv))])
mejor = None
for ou in np.arange(0, PU, 4):
    for ov in np.arange(0, PV, 5):
        bl = []
        for u in np.arange(min(us) + ou, max(us), PU):
            for v in np.arange(min(vs) + ov, max(vs), PV):
                r = rect(u, v, BU / 2, BVv / 2)
                if DENTRO.contains(r) and not r.intersects(VETO) and r.intersection(BOSQUE).area < 0.12 * r.area: bl.append((u, v))
        if mejor is None or len(bl) > len(mejor): mejor = bl
bloques, bancales = [], []
for bi, (u, v) in enumerate(mejor):
    bloques.append([[round(x, 1), round(y, 1)] for x, y in list(rect(u, v, BU / 2 + 1, BVv / 2 + 1).exterior.coords)[:4]])
    for j in range(14):
        du = -14 + 0.6 + j * 2.0
        for dv in (-6.5, 6.5):
            x = C.x + ux * (u + du) + nx * (v + dv); y = C.y + uy * (u + du) + ny * (v + dv)
            if any(math.hypot(x - tx, y - ty) < tr * 0.5 + 0.6 for tx, ty, tr in sueltos if abs(x - tx) < 12 and abs(y - ty) < 12): continue
            if BOSQUE.contains(Point(x, y)): continue
            bancales.append([round(x, 1), round(y, 1), (bi * 3 + j // 5) % 8])
P['bloques'] = bloques; P['bancales'] = bancales
P['suelo']['bancales_m2'] = round(len(bancales) * 12)
print('manzanas', len(bloques), 'bancales', len(bancales), 'm2', len(bancales) * 12)
json.dump(P, open(os.path.join(D, 'bavaria_pres.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
