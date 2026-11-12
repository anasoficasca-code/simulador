"""Datos de la presentación «Distrito Bavaria Común» (bavaria.html) -> data3d/bavaria_pres.json

1. Lote, edificios y árboles reales del predio (data3d/bavaria.json, data3d/bavaria_arboles.json).
2. Contexto: huellas con altura de data3d/buildings.json a menos de 1,2 km del predio.
3. SINTAXIS ESPACIAL antes y después (análisis angular de segmentos, método de DepthmapX, reimplementado):
   - red: vías de OpenStreetMap a menos de 2,6 km del predio (peatonal = todas las vías transitables a pie).
   - ANTES: el predio está cerrado, así que las vías internas de la fábrica no cuentan.
   - DESPUÉS: se abren pasajes peatonales que cruzan el predio y lo conectan con los cruces del borde.
   - medidas: NAIN radio n y radio 800 m (integración angular normalizada, Hillier et al. 2012) y NACH radio n
     (elección angular normalizada). Red de TODA Kennedy (+500 m). Radio n con 1.500 fuentes muestreadas (las mismas antes y después); radio 800 m con todas las fuentes: segmentos a menos de 800 m de
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

# ---------------- OSM: vías de TODA Kennedy (+500 m) ----------------
# fuente: tools/cache/kennedy_osm.json (la misma descarga de OpenStreetMap de tools/kennedy_osm.py)
CACHE_K = os.path.join(RAIZ, 'tools', 'cache', 'kennedy_osm.json')
OSM = json.load(open(CACHE_K, encoding='utf-8'))['elements']
KJ = json.load(open(os.path.join(D, 'kennedy.json'), encoding='utf-8'))
LIM = Polygon([xy(*p) for p in KJ['limite']]).buffer(0)
ZONA = LIM.buffer(500)
print('Kennedy', round(LIM.area / 1e6, 1), 'km2')
NOPEA = {'motorway', 'motorway_link', 'trunk_link', 'construction', 'proposed', 'raceway', 'bus_guideway', 'corridor', 'elevator', 'platform'}
vias = []
for el in OSM:
    t = el.get('tags', {}); hw = t.get('highway')
    if el['type'] != 'way' or not hw or hw in NOPEA or 'geometry' not in el: continue
    if t.get('access') in ('private', 'no') and hw == 'service': continue
    pts = [xy(g['lon'], g['lat']) for g in el['geometry']]
    ls = LineString(pts)
    if not ZONA.intersects(ls): continue
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
# trazado: los pasajes buscan el camino de menor costo sobre una grilla de 3 m. Los edificios (con 7 m de aire) no se pueden
# cruzar, el bosque denso cuesta 5 veces más (solo se atraviesa si no hay otra salida) y el suelo libre 1. Todas las puertas
# se unen con la plaza central por el árbol de caminos más cortos, así los pasajes se juntan en corredores comunes
# y aprovechan los patios y vías internas abiertas de la fábrica, sin pasar por encima de las naves.
from scipy.sparse import coo_matrix
EDIF_POL = unary_union([Polygon(e['p']).buffer(0) for e in BV['edif']])
TANQ = unary_union([Point(t).buffer(9) for t in BV['tanques']])
BOSQUE_POL = unary_union([Point(a[0], a[1]).buffer(a[3] + 2.5) for a in AR if a[4] == 1])
OBST = unary_union([EDIF_POL.buffer(7), TANQ])
# eje de las naves: orientación de la nave central (la retícula de la fábrica ordena los pasajes y las huertas)
nave = max(BV['edif'], key=lambda e: Polygon(e['p']).area)['p']
lado = max(((nave[i], nave[(i + 1) % len(nave)]) for i in range(len(nave))), key=lambda l: math.dist(*l))
ang = math.atan2(lado[1][1] - lado[0][1], lado[1][0] - lado[0][0])
ux, uy = math.cos(ang), math.sin(ang)
RES = 3.0
minx, miny, maxx, maxy = LOTE.buffer(60).bounds
NX, NY = int((maxx - minx) / RES) + 1, int((maxy - miny) / RES) + 1
from shapely import contains_xy
gx, gy = np.meshgrid(minx + np.arange(NX) * RES, miny + np.arange(NY) * RES)
fx, fy = gx.ravel(), gy.ravel()
costo = np.full(fx.size, np.inf)
dentro_l = contains_xy(LOTE.buffer(2), fx, fy); cerca_l = contains_xy(LOTE.buffer(55), fx, fy)
costo[cerca_l] = 6.0                 # franja exterior (solo para llegar desde la puerta)
costo[dentro_l] = 1.0
costo[dentro_l & contains_xy(BOSQUE_POL, fx, fy)] = 5.0
costo[contains_xy(OBST, fx, fy)] = np.inf
ok = np.isfinite(costo)
idx = np.arange(fx.size).reshape(NY, NX)
filas, cols, pesos = [], [], []
for dy, dx in ((0, 1), (1, 0), (1, 1), (1, -1)):
    a = idx[max(0, -dy):NY - max(0, dy), max(0, -dx):NX - max(0, dx)] if dx >= 0 else idx[0:NY - dy, 1:NX]
    b = idx[max(0, dy):NY, max(0, dx):NX] if dx >= 0 else idx[dy:NY, 0:NX - 1]
    a, b = a.ravel(), b.ravel(); m = ok[a] & ok[b]
    w = (costo[a[m]] + costo[b[m]]) / 2 * RES * (math.sqrt(2) if dx and dy else 1)
    filas += [a[m], b[m]]; cols += [b[m], a[m]]; pesos += [w, w]
GR = coo_matrix((np.concatenate(pesos), (np.concatenate(filas), np.concatenate(cols))), shape=(fx.size, fx.size)).tocsr()
def celda(p):
    i = int(round((p[1] - miny) / RES)); j = int(round((p[0] - minx) / RES))
    best, bd = None, 1e9
    for di in range(-6, 7):
        for dj in range(-6, 7):
            ii, jj = i + di, j + dj
            if 0 <= ii < NY and 0 <= jj < NX and ok[idx[ii, jj]]:
                d = math.hypot(di, dj)
                if d < bd: bd, best = d, idx[ii, jj]
    return best
# plaza central: el punto libre más cercano al centro del conjunto de naves
cen = EDIF_POL.centroid
libre_c = [k for k in np.where(ok & dentro_l & ~contains_xy(BOSQUE_POL, fx, fy))[0]]
hub = min(libre_c, key=lambda k: (fx[k] - cen.x) ** 2 + (fy[k] - cen.y) ** 2)
from scipy.sparse.csgraph import dijkstra as _dij
dist, pred = _dij(GR, directed=False, indices=hub, return_predecessors=True)
caminos = []
for nid, p in entradas:
    c = celda(p)
    if c is None or not np.isfinite(dist[c]): print('  puerta sin camino', p); continue
    ruta = [c]
    while ruta[-1] != hub and pred[ruta[-1]] >= 0: ruta.append(pred[ruta[-1]])
    pts = [(p[0], p[1])] + [(fx[k], fy[k]) for k in ruta]
    caminos.append(LineString(pts))
from shapely.ops import linemerge
red0 = linemerge(unary_union(caminos))
def suavizar(g):
    for tol in (5, 3, 1.5, 0.6):
        s = g.simplify(tol)
        if not s.intersects(EDIF_POL.buffer(3)): return s
    return g
red_nueva = unary_union([suavizar(g) for g in (red0.geoms if red0.geom_type == 'MultiLineString' else [red0])])
lineas = list(red_nueva.geoms) if red_nueva.geom_type == 'MultiLineString' else [red_nueva]
print('pasajes que tocan edificios:', sum(1 for g in lineas if g.intersects(EDIF_POL)))
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
def analizar(T, fuentes):
    """Rn (integración y elección) con fuentes muestreadas, como el modelo de Kennedy del simulador; R800 con todas las fuentes."""
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
    TDs = np.zeros(N); CNT = np.zeros(N); CH = np.zeros(N)
    for k in range(0, len(fuentes), 40):
        F = fuentes[k:k + 40]
        DA, PR = dijkstra(GA, directed=True, indices=F, return_predecessors=True)
        for r, src in enumerate(F):
            d = DA[r]; ok = np.isfinite(d); TDs[ok] += d[ok]; CNT[ok] += 1
            orden = np.argsort(-np.where(ok, d, -1)); delta = np.zeros(N); pr = PR[r]
            for v in orden:
                if not ok[v]: break
                u = pr[v]
                if u >= 0 and u != src: delta[u] += 1 + delta[v]
            CH += delta
        print('  Rn fuentes', min(len(fuentes), k + 40), '/', len(fuentes))
    NC = N; TD = TDs / np.maximum(CNT, 1) * (N - 1)
    nain = NC ** 1.2 / (TD + 2)
    nach = np.log(CH * N / len(fuentes) / 2 + 1) / np.log(TD + 3)
    TD8 = np.zeros(N); NC8 = np.zeros(N)
    for k in range(0, N, 250):
        F = list(range(k, min(N, k + 250)))
        DM = dijkstra(GM, directed=True, indices=F, limit=800); D8 = dijkstra(GA, directed=True, indices=F, limit=12)
        m = np.isfinite(DM) & np.isfinite(D8)
        TD8[k:k + len(F)] = np.where(m, D8, 0).sum(1); NC8[k:k + len(F)] = m.sum(1)
        if k % 5000 == 0: print('  R800', k, '/', N)
    nain8 = NC8 ** 1.2 / (TD8 + 2)
    return {'nain': nain, 'nain8': nain8, 'nach': nach, 'conn': conn, 'td': TD / max(N - 1, 1)}

random.seed(20261112)
en_k = [i for i, s in enumerate(base) if LIM.buffer(80).intersects(LineString(s['p']))]
FUENTES = sorted(random.sample(en_k, min(1500, len(en_k))))
print('tramos', len(base), 'en Kennedy', len(en_k), 'fuentes', len(FUENTES))
print('ANTES'); A = analizar(base, FUENTES)
DESP = base + nuevos
print('DESPUÉS'); B = analizar(DESP, FUENTES)

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
EN_K = set(en_k)
enK = lambda s: s.get('nuevo') or LIM.intersects(LineString(s['p']))
resumen = {'antes_600m': stats(base, A, cerca), 'despues_600m': stats(DESP, B, lambda s: cerca(s) or s.get('nuevo')),
           'antes_todo': stats(base, A, enK), 'despues_todo': stats(DESP, B, enK)}
print(json.dumps(resumen, indent=1))
# vías del borde: cuánto cambia su elección (las que tocan una entrada)
ent_ids = {nid for nid, _ in entradas}

# exportar TODA la red de Kennedy (+500 m) a un archivo aparte: data3d/bavaria_sx.json
def q(v): return round(float(v), 3)
seg = []
for i, s in enumerate(DESP):
    ls = LineString(s['p'])
    pts = [[round(x), round(y)] for x, y in ls.simplify(2.0).coords]
    j = i if i < len(base) else None
    seg.append({'p': pts, 'n': s.get('nuevo', 0), 'k': 1 if (j is None or i in EN_K) else 0,
                'a': [q(A['nain'][i]), q(A['nain8'][i]), q(A['nach'][i])] if j is not None else None,
                'b': [q(B['nain'][i]), q(B['nain8'][i]), q(B['nach'][i])]})
json.dump({'fuente': 'OpenStreetMap (© colaboradores, ODbL), tools/cache/kennedy_osm.json; análisis angular de segmentos (método DepthmapX) reimplementado en tools/bavaria_pres_datos.py',
           'seg': seg, 'limite': [[round(x), round(y)] for x, y in LIM.exterior.simplify(5).coords]},
          open(os.path.join(D, 'bavaria_sx.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('segmentos exportados', len(seg), round(os.path.getsize(os.path.join(D, 'bavaria_sx.json')) / 1e6, 2), 'MB')
seg = []

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
# manzanas de huerta ordenadas sobre la retícula de las naves: bloques de 30 x 26 m separados por calles de 4 m, cada uno con
# 2 filas de 14 bancales de 1,2 x 10 m (pasillos de 0,8 m y uno central de 3 m). Solo se pone un bloque donde cabe completo:
# fuera de edificios (10 m de aire), pasajes, plazas, compostaje, patio de carga y bosque denso (menos del 8 % del bloque).
edif = EDIF_POL.buffer(6); bosque = BOSQUE_POL
sueltos = [(a[0], a[1], a[3]) for a in AR if a[4] == 0]
plaza = unary_union([Polygon(e['p']).buffer(22) for e in BV['edif'] if Polygon(e['p']).area > 2500])
ZONAS_FIJAS = unary_union([box(9485, 3005, 9555, 3060).buffer(6), box(9115, 3127.5, 9185, 3172.5).buffer(6)])
VETO = unary_union([EDIF_POL.buffer(10), TANQ, red_nueva.buffer(4.5), plaza, ZONAS_FIJAS])
DENTRO = LOTE.buffer(-10)
libre = LOTE.buffer(-8).difference(edif).difference(bosque).difference(red_nueva.buffer(5))
print('suelo libre', round(libre.area / 1e4, 2), 'ha; bosque', round(bosque.intersection(LOTE).area / 1e4, 2), 'ha')
BU, BV_, PU, PV = 30.0, 26.0, 34.0, 30.0
nx, ny = -uy, ux
us = [(x - C.x) * ux + (y - C.y) * uy for x, y in LOTE.exterior.coords]
vs = [(x - C.x) * nx + (y - C.y) * ny for x, y in LOTE.exterior.coords]
def rect(u0, v0, du, dv):
    return Polygon([(C.x + ux * (u0 + a) + nx * (v0 + b), C.y + uy * (u0 + a) + ny * (v0 + b)) for a, b in ((-du, -dv), (du, -dv), (du, dv), (-du, dv))])
mejor = None
for ou in np.arange(0, PU, 8):
    for ov in np.arange(0, PV, 6):
        bl = []
        for u in np.arange(min(us) + ou, max(us), PU):
            for v in np.arange(min(vs) + ov, max(vs), PV):
                r = rect(u, v, BU / 2, BV_ / 2)
                if DENTRO.contains(r) and not r.intersects(VETO) and r.intersection(bosque).area < 0.08 * r.area and sum(1 for tx, ty, tr in sueltos if r.contains(Point(tx, ty))) <= 2: bl.append((u, v))
        if mejor is None or len(bl) > len(mejor): mejor = bl
bloques, bancales = [], []
for bi, (u, v) in enumerate(mejor):
    bloques.append([[round(x, 1), round(y, 1)] for x, y in list(rect(u, v, BU / 2 + 1, BV_ / 2 + 1).exterior.coords)[:4]])
    for j in range(14):
        du = -14 + 0.6 + j * 2.0
        for dv in (-6.5, 6.5):
            x = C.x + ux * (u + du) + nx * (v + dv); y = C.y + uy * (u + du) + ny * (v + dv)
            if any(math.hypot(x - tx, y - ty) < tr * 0.6 + 0.8 for tx, ty, tr in sueltos if abs(x - tx) < 12 and abs(y - ty) < 12): continue
            bancales.append([round(x, 1), round(y, 1), (bi * 3 + j // 6) % 8])
print('manzanas de huerta', len(bloques))
area_banc = len(bancales) * 1.2 * 10
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
    'bancales': bancales, 'bloques': bloques, 'techos': [t['p'] for t in techos],
    'resumen': resumen, 'pasajes_m': round(sum(s['L'] for s in nuevos)),
    'suelo': {'libre_ha': round(libre.area / 1e4, 2), 'bosque_ha': round(bosque.intersection(LOTE).area / 1e4, 2),
              'edif_m2': round(sum(Polygon(e['p']).area for e in BV['edif'])), 'bancales_m2': round(area_banc), 'techos_m2': round(area_techos),
              'arboles': len(AR), 'arboles_bosque': sum(1 for a in AR if a[4] == 1)},
}
json.dump(out, open(os.path.join(D, 'bavaria_pres.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('ok', round(os.path.getsize(os.path.join(D, 'bavaria_pres.json')) / 1e6, 2), 'MB')
