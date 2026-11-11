"""Datos de la presentación «Distrito Bavaria Común» (bavaria.html) -> data3d/bavaria_pres.json

1. Lote, edificios y árboles reales del predio (data3d/bavaria.json, data3d/bavaria_arboles.json).
2. Contexto: huellas con altura de data3d/buildings.json a menos de 1,2 km del predio.
3. SINTAXIS ESPACIAL antes y después (análisis angular de segmentos, método de DepthmapX, reimplementado):
   - red: vías de OpenStreetMap a menos de 2,6 km del predio (peatonal = todas las vías transitables a pie).
   - ANTES: el predio está cerrado, así que las vías internas de la fábrica no cuentan.
   - DESPUÉS: se abren pasajes peatonales que cruzan el predio y lo conectan con los cruces del borde.
   - medidas: NAIN radio n y radio 800 m (integración angular normalizada, Hillier et al. 2012) y NACH radio n
     (elección angular normalizada). Todas las fuentes, sin muestreo. Radio 800 m: segmentos a menos de 800 m de
     recorrido métrico (aproximación: la profundidad angular se toma del grafo completo).
4. Huertas: bancales sobre el suelo libre del predio (sin edificios, sin bosque y sin pasajes) y cubiertas productivas
   en el barrio (techos planos de 150 a 900 m² y menos de 15 m de altura, a menos de 600 m del predio).
Marco: el del modelo (x = este, y = norte, metros; ver xy()). Uso: python tools/bavaria_pres_datos.py"""
import json, math, os, urllib.request, urllib.parse, random
import numpy as np
from scipy.sparse import csr_matrix
from scipy.sparse.csgraph import dijkstra
from shapely.geometry import Polygon, Point, LineString, MultiLineString, box
from shapely.ops import unary_union
from shapely import affinity

RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
D = os.path.join(RAIZ, 'data3d')
MX = 111320 * math.cos(math.radians(4.63)); MY = 110540.0
def xy(lon, lat): return ((lon + 74.17) * MX + 5193.24, (lat - 4.63) * MY + 2090.06)

BV = json.load(open(os.path.join(D, 'bavaria.json'), encoding='utf-8'))
AR = json.load(open(os.path.join(D, 'bavaria_arboles.json'), encoding='utf-8'))['arboles']
LOTE = Polygon(BV['sitio']).buffer(0)
C = LOTE.centroid
print('lote', round(LOTE.area / 1e4, 2), 'ha; centro', round(C.x), round(C.y))

# ---------------- OSM: vías ----------------
os.makedirs(os.path.join(RAIZ, 'tools', 'cache'), exist_ok=True)
CACHE = os.path.join(RAIZ, 'tools', 'cache', 'bavaria_vias_osm.json')
lat0 = (C.y - 2090.06) / MY + 4.63; lon0 = (C.x - 5193.24) / MX - 74.17
USAR_GIRO = not os.path.exists(CACHE) or os.path.getsize(CACHE) < 10000
if USAR_GIRO:
    # sin conexión a Overpass: se usan las vías OSM ya procesadas en data3d/giro_sim.json (marco del giro: x este, y sur,
    # origen 4.640683, -74.149778). Ahí no están los senderos ni las vías de servicio a más de 1,8 km de El Burro.
    GS = json.load(open(os.path.join(D, 'giro_sim.json'), encoding='utf-8'))
    OX = 5193.24 + (74.17 - 74.149778) * MX; OY = 2090.06 + (4.640683 - 4.63) * MY
    OSM = []
    for k, s in enumerate(GS['seg']):
        hw = {5: 'trunk', 4: 'primary', 3: 'secondary', 2: 'tertiary', 1: 'residential', 0: 'footway'}[s['j']]
        OSM.append({'type': 'way', 'id': k, 'nodes': [('g', s['a'])] + [('m', k, i) for i in range(1, len(s['p']) - 1)] + [('g', s['b'])],
                    'tags': {'highway': hw}, 'pts': [(x + OX, OY - y) for x, y in s['p']]})
if False:
    d = 0.026
    q = f'[out:json][timeout:120];way["highway"]({lat0 - d},{lon0 - d},{lat0 + d},{lon0 + d});out geom tags;'
    r = urllib.request.urlopen(urllib.request.Request('https://overpass-api.de/api/interpreter', data=urllib.parse.urlencode({'data': q}).encode(),
                                                      headers={'User-Agent': 'urban-analysis-script'}), timeout=180)
    json.dump(json.load(r), open(CACHE, 'w'))
if not USAR_GIRO: OSM = json.load(open(CACHE))['elements']
NOPEA = {'motorway', 'motorway_link', 'trunk_link', 'construction', 'proposed', 'raceway', 'bus_guideway', 'corridor', 'elevator', 'platform'}
RADIO = 2300
vias = []
for el in OSM:
    t = el.get('tags', {}); hw = t.get('highway')
    if el['type'] != 'way' or not hw or hw in NOPEA or ('geometry' not in el and 'pts' not in el): continue
    if t.get('access') in ('private', 'no') and hw == 'service': continue
    pts = el['pts'] if 'pts' in el else [xy(g['lon'], g['lat']) for g in el['geometry']]
    ls = LineString(pts)
    if ls.distance(C) > RADIO: continue
    vias.append((list(el['nodes']), pts, hw))
uso = {}
for nodos, _, _ in vias:
    for i, nd in enumerate(nodos): uso[nd] = uso.get(nd, 0) + (2 if 0 < i < len(nodos) - 1 else 1)
tramos = []
for nodos, pts, hw in vias:
    ini = 0
    for i in range(1, len(nodos)):
        if i == len(nodos) - 1 or uso[nodos[i]] > 2:
            tp = pts[ini:i + 1]
            L = sum(math.dist(tp[k], tp[k + 1]) for k in range(len(tp) - 1))
            if L > 0.5: tramos.append({'a': nodos[ini], 'b': nodos[i], 'p': tp, 'L': L, 'hw': hw})
            ini = i
# ANTES: el predio está cerrado -> fuera los tramos internos de la fábrica
INTERIOR = LOTE.buffer(-12)
base = [s for s in tramos if not INTERIOR.contains(LineString(s['p']).interpolate(0.5, normalized=True))]
print('tramos', len(tramos), '-> sin internos', len(base))

# ---------------- pasajes peatonales nuevos (DESPUÉS) ----------------
# entradas: cruces existentes a menos de 45 m del borde del lote, repartidos (al menos 140 m entre sí)
borde = LOTE.exterior
cand = {}
for s in base:
    for k, p in (('a', s['p'][0]), ('b', s['p'][-1])):
        d = borde.distance(Point(p))
        if d < 45 and not INTERIOR.contains(Point(p)): cand[s[k]] = (p, d, s['hw'])
pref = {'primary': 0, 'secondary': 0, 'tertiary': 1, 'residential': 2, 'unclassified': 2, 'living_street': 2, 'pedestrian': 1, 'footway': 3, 'service': 4}
orden = sorted(cand.items(), key=lambda kv: (kv[1][1] + 25 * pref.get(kv[1][2], 3)))
entradas = []
for nid, (p, d, hw) in orden:
    if all(math.dist(p, q) > 140 for _, q in entradas): entradas.append((nid, p))
print('entradas', len(entradas))
# trazado: eje mayor del lote (paseo de las huertas) + anillo interior + ramales de cada entrada al punto más cercano del sistema
mrr = LOTE.minimum_rotated_rectangle
cs = list(mrr.exterior.coords)[:4]
lados = [(cs[i], cs[(i + 1) % 4]) for i in range(4)]
largo = max(lados, key=lambda l: math.dist(*l))
ang = math.atan2(largo[1][1] - largo[0][1], largo[1][0] - largo[0][0])
ux, uy = math.cos(ang), math.sin(ang)
eje = LineString([(C.x - ux * 900, C.y - uy * 900), (C.x + ux * 900, C.y + uy * 900)]).intersection(LOTE.buffer(-25))
if eje.geom_type == 'MultiLineString': eje = max(eje.geoms, key=lambda g: g.length)
trans = []  # tres ejes transversales (calles de huertas)
for f in (-0.32, 0.0, 0.32):
    px, py = C.x + ux * f * eje.length, C.y + uy * f * eje.length
    t = LineString([(px + uy * 700, py - ux * 700), (px - uy * 700, py + ux * 700)]).intersection(LOTE.buffer(-25))
    if t.geom_type == 'MultiLineString': t = max(t.geoms, key=lambda g: g.length)
    if not t.is_empty: trans.append(t)
anillo = LOTE.buffer(-70).exterior.simplify(18)
sistema = unary_union([eje, anillo] + trans)
ramales = []
for nid, p in entradas:
    q = sistema.interpolate(sistema.project(Point(p))) if sistema.geom_type == 'LineString' else min(
        (g.interpolate(g.project(Point(p))) for g in sistema.geoms), key=lambda r: r.distance(Point(p)))
    ramales.append(LineString([p, (q.x, q.y)]))
red_nueva = unary_union([sistema] + ramales)  # se nodifica en los cruces
lineas = list(red_nueva.geoms) if red_nueva.geom_type == 'MultiLineString' else [red_nueva]
ent_pts = {(round(p[0], 1), round(p[1], 1)): nid for nid, p in entradas}
def clave(p):
    k = (round(p[0], 1), round(p[1], 1))
    if k in ent_pts: return ent_pts[k]
    for (ex, ey), nid in ent_pts.items():
        if math.dist((ex, ey), p) < 0.6: return nid
    return 'n%.0f_%.0f' % (p[0] * 2, p[1] * 2)
nuevos = []
for g in lineas:
    pts = list(g.coords)
    if g.length < 1: continue
    nuevos.append({'a': clave(pts[0]), 'b': clave(pts[-1]), 'p': pts, 'L': g.length, 'hw': 'pasaje', 'nuevo': 1})
print('pasajes nuevos', len(nuevos), 'longitud', round(sum(s['L'] for s in nuevos)), 'm')

# ---------------- sintaxis espacial ----------------
def rumbo(p, q): return math.atan2(q[1] - p[1], q[0] - p[0])
def analizar(T):
    por_nodo = {}
    for i, s in enumerate(T):
        por_nodo.setdefault(s['a'], []).append((i, 'a')); por_nodo.setdefault(s['b'], []).append((i, 'b'))
    def salida(s, e):
        p = s['p']; return rumbo(p[1], p[0]) if e == 'a' else rumbo(p[-2], p[-1])
    f, c, w, wm = [], [], [], []
    for nd, lst in por_nodo.items():
        for i, ei in lst:
            di = salida(T[i], ei)
            for j, ej in lst:
                if i == j: continue
                dj = salida(T[j], ej) + math.pi
                giro = abs((dj - di + math.pi) % (2 * math.pi) - math.pi)
                f.append(i); c.append(j); w.append(giro / (math.pi / 2) + 1e-4); wm.append((T[i]['L'] + T[j]['L']) / 2)
    N = len(T)
    GA = csr_matrix((w, (f, c)), shape=(N, N)); GM = csr_matrix((wm, (f, c)), shape=(N, N))
    conn = np.array([len(por_nodo[s['a']]) + len(por_nodo[s['b']]) - 2 for s in T])
    TD = np.zeros(N); NC = np.zeros(N); CH = np.zeros(N); TD8 = np.zeros(N); NC8 = np.zeros(N)
    LOT = 120
    for k in range(0, N, LOT):
        F = list(range(k, min(N, k + LOT)))
        DA, PR = dijkstra(GA, directed=True, indices=F, return_predecessors=True)
        DM = dijkstra(GM, directed=True, indices=F, limit=800)
        for r, src in enumerate(F):
            d = DA[r]; ok = np.isfinite(d)
            TD[src] = d[ok].sum(); NC[src] = ok.sum()
            m8 = np.isfinite(DM[r]); TD8[src] = d[m8].sum(); NC8[src] = m8.sum()
            orden = np.argsort(-np.where(ok, d, -1)); delta = np.zeros(N); pr = PR[r]
            for v in orden:
                if not ok[v]: break
                u = pr[v]
                if u >= 0 and u != src: delta[u] += 1 + delta[v]
                elif u == src: pass
            CH += delta
        print('  fuentes', min(N, k + LOT), '/', N)
    nain = NC ** 1.2 / (TD + 2); nain8 = NC8 ** 1.2 / (TD8 + 2)
    nach = np.log(CH / 2 + 1) / np.log(TD + 3)
    return {'nain': nain, 'nain8': nain8, 'nach': nach, 'conn': conn, 'td': TD / np.maximum(NC - 1, 1)}

print('ANTES'); A = analizar(base)
DESP = base + nuevos
print('DESPUÉS'); B = analizar(DESP)

def stats(T, R, sel):
    idx = [i for i, s in enumerate(T) if sel(s)]
    if not idx: return {}
    L = np.array([T[i]['L'] for i in idx])
    def wm(v): return float((v[idx] * L).sum() / L.sum())
    x = np.log(R['conn'][idx] + 1); y = R['nain'][idx]
    inteli = float(np.corrcoef(R['conn'][idx], R['nain'][idx])[0, 1] ** 2)
    sinerg = float(np.corrcoef(R['nain'][idx], R['nain8'][idx])[0, 1] ** 2)
    return {'n': len(idx), 'km': round(float(L.sum()) / 1000, 2), 'nain': round(wm(R['nain']), 3), 'nain8': round(wm(R['nain8']), 3),
            'nach': round(wm(R['nach']), 3), 'prof': round(wm(R['td']), 2), 'inteligibilidad': round(inteli, 3), 'sinergia': round(sinerg, 3)}
cerca = lambda s: LineString(s['p']).distance(LOTE) < 600
resumen = {'antes_600m': stats(base, A, cerca), 'despues_600m': stats(DESP, B, lambda s: cerca(s) or s.get('nuevo')),
           'antes_todo': stats(base, A, lambda s: True), 'despues_todo': stats(DESP, B, lambda s: True)}
print(json.dumps(resumen, indent=1))
# vías del borde: cuánto cambia su elección (las que tocan una entrada)
ent_ids = {nid for nid, _ in entradas}

# exportar segmentos a menos de 1,8 km
def q(v): return round(float(v), 3)
seg = []
for i, s in enumerate(DESP):
    ls = LineString(s['p'])
    if ls.distance(C) > 1800: continue
    pts = [[round(x, 1), round(y, 1)] for x, y in ls.simplify(1.2).coords]
    j = i if i < len(base) else None
    seg.append({'p': pts, 'h': s['hw'], 'n': s.get('nuevo', 0),
                'a': [q(A['nain'][i]), q(A['nain8'][i]), q(A['nach'][i])] if j is not None else None,
                'b': [q(B['nain'][i]), q(B['nain8'][i]), q(B['nach'][i])]})
print('segmentos exportados', len(seg))

# ---------------- contexto ----------------
BU = json.load(open(os.path.join(D, 'buildings.json')))
ctx = []
for b in BU:
    p = b['pts']
    cx = sum(x for x, _ in p) / len(p); cy = sum(y for _, y in p) / len(p)
    if math.hypot(cx - C.x, cy - C.y) > 1250 or LOTE.contains(Point(cx, cy)): continue
    if p[0] == p[-1]: p = p[:-1]
    if len(p) < 3: continue
    ctx.append({'p': [[round(x, 1), round(y, 1)] for x, y in p], 'h': round(b['h'], 1)})
print('contexto', len(ctx))

# ---------------- huertas ----------------
edif = unary_union([Polygon(e['p']).buffer(6) for e in BV['edif']])
bosque = unary_union([Point(a[0], a[1]).buffer(a[3] + 2.5) for a in AR if a[4] == 1])
sueltos = unary_union([Point(a[0], a[1]).buffer(a[3] + 1) for a in AR if a[4] == 0])
pasos = red_nueva.buffer(5)
libre = LOTE.buffer(-8).difference(edif).difference(bosque).difference(sueltos).difference(pasos)
print('suelo libre', round(libre.area / 1e4, 2), 'ha; bosque', round(bosque.intersection(LOTE).area / 1e4, 2), 'ha')
# bancales de 1,2 x 8 m con pasillos de 0,8 m, alineados al eje del lote, en manzanas de 2 x 6 bancales
bancales = []
ex, ey = ux, uy; nx, ny = -uy, ux
xs = [(x - C.x) * ex + (y - C.y) * ey for x, y in LOTE.exterior.coords]
ys = [(x - C.x) * nx + (y - C.y) * ny for x, y in LOTE.exterior.coords]
libre_s = libre.buffer(-0.6)
for u in np.arange(min(xs), max(xs), 2.0):
    for v in np.arange(min(ys), max(ys), 9.0):
        cxx, cyy = C.x + ex * (u + 0.6) + nx * (v + 4), C.y + ey * (u + 0.6) + ny * (v + 4)
        r = affinity.rotate(box(-0.6, -4, 0.6, 4), math.degrees(math.atan2(ny, nx)) - 90, origin=(0, 0))
        r = affinity.translate(r, cxx, cyy)
        if libre_s.contains(r): bancales.append([round(cxx, 1), round(cyy, 1)])
# se deja libre (plazas y pradera) lo que queda a menos de 35 m de los edificios recuperados y del tanque
plaza = unary_union([Polygon(e['p']).buffer(28) for e in BV['edif'] if Polygon(e['p']).area > 2500])
bancales = [b for b in bancales if not plaza.contains(Point(b))]
area_banc = len(bancales) * 1.2 * 8
print('bancales', len(bancales), 'area cultivada', round(area_banc), 'm2')
# cubiertas productivas del barrio
techos = []
for b in ctx:
    pg = Polygon(b['p'])
    if not pg.is_valid: continue
    if 150 <= pg.area <= 900 and 5 <= b['h'] <= 15 and pg.distance(LOTE) < 600 and pg.minimum_rotated_rectangle.area < pg.area * 1.25:
        techos.append(b)
random.seed(7)
techos = [t for t in techos if random.random() < 0.45]
area_techos = sum(Polygon(t['p']).area for t in techos) * 0.6  # 60 % de la cubierta cultivable
print('cubiertas productivas', len(techos), 'area cultivable', round(area_techos), 'm2')

out = {
    'fuente': 'Predio, edificios y árboles: data3d/bavaria*.json (OSM y Esri World Imagery). Contexto: data3d/buildings.json. Vías: OpenStreetMap (© colaboradores, ODbL). Sintaxis: análisis angular de segmentos (método DepthmapX), reimplementado en tools/bavaria_pres_datos.py.',
    'angulo': round(ang, 4), 'centro': [round(C.x, 1), round(C.y, 1)], 'area_ha': round(LOTE.area / 1e4, 2),
    'sitio': BV['sitio'], 'edif': BV['edif'], 'tanques': BV['tanques'],
    'arboles': [[round(a[0], 1), round(a[1], 1), round(a[2], 1), round(a[3], 1), a[4]] for a in AR],
    'contexto': ctx, 'seg': seg, 'entradas': [[round(p[0], 1), round(p[1], 1)] for _, p in entradas],
    'bancales': bancales, 'techos': [t['p'] for t in techos],
    'resumen': resumen, 'pasajes_m': round(sum(s['L'] for s in nuevos)),
    'suelo': {'libre_ha': round(libre.area / 1e4, 2), 'bosque_ha': round(bosque.intersection(LOTE).area / 1e4, 2),
              'edif_m2': round(sum(Polygon(e['p']).area for e in BV['edif'])), 'bancales_m2': round(area_banc), 'techos_m2': round(area_techos),
              'arboles': len(AR), 'arboles_bosque': sum(1 for a in AR if a[4] == 1)},
}
json.dump(out, open(os.path.join(D, 'bavaria_pres.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('ok', round(os.path.getsize(os.path.join(D, 'bavaria_pres.json')) / 1e6, 2), 'MB')
