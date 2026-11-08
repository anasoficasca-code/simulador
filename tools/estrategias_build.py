"""Estrategias de la propuesta (shapefile de lotes con campo PROPUESTA P1-P5) -> data3d/estrategias.json

Fuente: Propuesta shp/lote.shp (lotes catastrales de Kennedy, WGS84) con PROPUESTA (P1..P5) y descripci.
Cada lote se pasa al marco del modelo (data3d/buildings.json), se simplifica (0,5 m), sin agujeros, y se guarda por estrategia.
Las estrategias se nombran por la descripción que trae el shape para cada propuesta:
  E1 (P1) Huertas en humedal y ronda de río · E2 (P2) Huertas en lotes baldíos · E3 (P3) Huertas en cubiertas de vivienda en altura
  E4 (P4) Distrito biotecnológico · E5 (P5) Huertas en viviendas
Uso: python tools/estrategias_build.py [carpeta del shapefile]   (requiere pyshp y shapely)"""
import json, math, os, sys
import shapefile
from shapely.geometry import Polygon

RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SHP = sys.argv[1] if len(sys.argv) > 1 else r'C:\Users\ACER\Downloads\Propuesta shp\Propuesta shp\lote'
MX = 111320 * math.cos(math.radians(4.63)); MY = 110540.0
def xy(lo, la): return ((lo + 74.17) * MX + 5193.24, (la - 4.63) * MY + 2090.06)  # GEO de index.html

# capas del shapefile (P1 se quitó de la propuesta). Desde el Excel de las 9 estrategias, cada capa pertenece a una estrategia:
# las huertas (lotes baldíos, cubiertas en altura, viviendas) son E8 Red de huertas y el distrito biotecnológico es E4 Orgánicos y hongos
EST = {
    'P2': ('E2', 'Huertas en lotes baldíos', '#a3e635'),
    'P3': ('E3', 'Huertas en cubiertas de vivienda en altura', '#f59e0b'),
    'P4': ('E4', 'Distrito biotecnológico', '#a78bfa'),
    'P5': ('E5', 'Huertas en viviendas', '#f472b6'),
}
A_ESTRATEGIA = {'P2': 'E8', 'P3': 'E8', 'P5': 'E8', 'P4': 'E4'}
r = shapefile.Reader(SHP, encoding='utf-8')
F = [f[0] for f in r.fields[1:]]; iP, iD = F.index('PROPUESTA'), F.index('descripci')
out = {k: {'id': v[0], 'p': k, 'n': v[1], 'c': v[2], 'lotes': [], 'area': 0.0, 'desc': {}} for k, v in EST.items()}
for sr in r.iterShapeRecords():
    p = sr.record[iP]
    if p not in out: continue
    e = out[p]; d = sr.record[iD] or '(sin descripción)'; e['desc'][d] = e['desc'].get(d, 0) + 1
    s = sr.shape; partes = list(s.parts) + [len(s.points)]
    for i in range(len(partes) - 1):
        ll = s.points[partes[i]:partes[i + 1]]
        if len(ll) < 4: continue
        sa = sum(ll[k][0] * ll[k + 1][1] - ll[k + 1][0] * ll[k][1] for k in range(len(ll) - 1))
        if sa > 0: continue  # anillo antihorario = agujero (en el shapefile los exteriores van en sentido horario)
        pg = Polygon([xy(*q) for q in ll]).simplify(0.5, preserve_topology=True)
        if pg.is_empty or pg.area < 4: continue
        e['area'] += pg.area
        c = list(pg.exterior.coords)[:-1]
        e['lotes'].append([v for q in c for v in (round(q[0] * 2), round(q[1] * 2))])  # medio metro, enteros
# altura del edificio que hay sobre cada lote (para pintar la estrategia sobre el techo; 0 = lote sin edificio, a ras del suelo)
from shapely.strtree import STRtree
from shapely.geometry import Point
BLD = json.load(open(os.path.join(RAIZ, 'data3d', 'buildings.json')))
geos, alts = [], []
for b in BLD:
    try:
        g = Polygon(b['pts'])
        if g.is_valid and g.area > 4: geos.append(g); alts.append(b['h'])
    except Exception: pass
arbol = STRtree(geos)
pr = [g.representative_point() for g in geos]
for e in out.values():
    # huertas en cubiertas (E3) y en viviendas (E5): se pinta el TECHO de cada edificio que cae dentro del lote; si no tiene edificios, el lote en el suelo
    e['n0'] = len(e['lotes']); e['lotes0'] = e['lotes']; techo = e['p'] in ('P3', 'P5'); suelo, techos = [], []
    for l in e['lotes']:
        lote = Polygon([(l[k] / 2, l[k + 1] / 2) for k in range(0, len(l), 2)]); hay = False
        if techo and lote.is_valid:
            for j in arbol.query(lote):
                if lote.contains(pr[j]):
                    c = list(geos[j].simplify(0.5).exterior.coords)[:-1]
                    techos.append([v for q in c for v in (round(q[0] * 2), round(q[1] * 2))] + [round(alts[j] * 10)]); hay = True
        if not hay: suelo.append(l)
    e['lotes'], e['techos'] = suelo, techos  # techos: anillo + altura en decímetros al final
# ---- agrupar por estrategia del Excel (nombres en data3d/actores.json) y agregar Corabastos (E3) y humedales (E5) ----
NOM = {e['id']: e['n'] for e in json.load(open(os.path.join(RAIZ, 'data3d', 'actores.json'), encoding='utf-8'))['estrategias']}
COLOR = {'E3': '#fb923c', 'E4': '#a78bfa', 'E5': '#34d399', 'E8': '#84cc16'}
def anillo(P): return [v for q in P for v in (round(q[0] * 2), round(q[1] * 2))]
G = {}
for p, e in out.items():
    if not e['lotes'] and not e['techos']: continue
    k = A_ESTRATEGIA[p]; g = G.setdefault(k, {'id': k, 'n': NOM.get(k, k), 'c': COLOR[k], 'capas': [], 'area': 0, 'n_lotes': 0})
    g['capas'].append({'n': e['n'], 'c': e['c'], 'lotes': e['lotes'], 'techos': e['techos']}); g['area'] += e['area']; g['n_lotes'] += e['n0']
CO = json.load(open(os.path.join(RAIZ, 'data3d', 'corabastos.json')))
G['E3'] = {'id': 'E3', 'n': NOM.get('E3', 'E3'), 'c': COLOR['E3'], 'capas': [{'n': 'Corabastos', 'c': COLOR['E3'], 'lotes': [anillo(CO['poly'])], 'techos': []}], 'area': Polygon(CO['poly']).area, 'n_lotes': 1}
GS = json.load(open(os.path.join(RAIZ, 'data3d', 'giro_sim.json'), encoding='utf-8'))
LAT0, LON0 = 4.640683, -74.149778
hum = [[xy(LON0 + x / MX, LAT0 - y / MY) for x, y in h['poly']] for h in GS['humedales']]
G['E5'] = {'id': 'E5', 'n': NOM.get('E5', 'E5'), 'c': COLOR['E5'], 'capas': [{'n': 'Humedales El Burro, La Vaca y Techo', 'c': COLOR['E5'], 'lotes': [anillo(h) for h in hum], 'techos': []}], 'area': sum(Polygon(h).area for h in hum), 'n_lotes': len(hum)}
# ---- estrategias sin lote propio: puntos reales de OpenStreetMap dentro de Kennedy (tools/cache/kennedy_puntos_osm.json) ----
from shapely.geometry import Point as _P
K = json.load(open(os.path.join(RAIZ, 'data3d', 'kennedy.json'), encoding='utf-8'))
LIM = Polygon([xy(lo, la) for lo, la in K['limite']])
OSMP = json.load(open(os.path.join(RAIZ, 'tools', 'cache', 'kennedy_puntos_osm.json')))
def pts(filtro):
    L = []
    for e in OSMP:
        t = e.get('tags', {}); c = e.get('center') or {'lat': e.get('lat'), 'lon': e.get('lon')}
        if c.get('lat') is None or not filtro(t): continue
        p = xy(c['lon'], c['lat'])
        if LIM.contains(_P(p)): L.append([round(p[0] * 2), round(p[1] * 2)])
    return L
ALIM = {'convenience', 'supermarket', 'greengrocer', 'butcher', 'bakery', 'general', 'deli', 'dairy', 'food', 'farm', 'grocery'}
OFICIO = {'hairdresser', 'beauty', 'tailor', 'clothes', 'hardware', 'shoes', 'copyshop', 'mobile_phone', 'furniture', 'car_repair', 'electronics', 'variety_store', 'laundry', 'dry_cleaning', 'bicycle', 'sewing', 'fabric'}
CUIDADO = {'kindergarten', 'childcare', 'community_centre', 'social_facility', 'library', 'social_centre'}
conj = [[round(sum(l[i] for i in range(0, len(l), 2)) / (len(l) / 2)), round(sum(l[i] for i in range(1, len(l), 2)) / (len(l) / 2))] for l in out['P3']['lotes0']] if 'lotes0' in out['P3'] else []
EXTRA = {
    'E2': [{'n': 'Tiendas de barrio, fruterías, panaderías y carnicerías (OSM)', 'c': '#38bdf8', 'puntos': pts(lambda t: t.get('shop') in ALIM), 'tam': 1}],
    'E6': [{'n': 'Negocios en vivienda: peluquerías, sastrerías, talleres y oficios (OSM)', 'c': '#e879f9', 'puntos': pts(lambda t: t.get('shop') in OFICIO or 'craft' in t), 'tam': 1}],
    'E7': [{'n': 'Plazas de mercado (OSM)', 'c': '#facc15', 'puntos': pts(lambda t: t.get('amenity') == 'marketplace'), 'tam': 2.4},
           {'n': 'Conjuntos en altura (lotes del shapefile)', 'c': '#fde047', 'puntos': conj, 'tam': 0.9}],
    'E9': [{'n': 'Jardines infantiles, salones comunales y centros de cuidado (OSM)', 'c': '#fb7185', 'puntos': pts(lambda t: t.get('amenity') in CUIDADO), 'tam': 1.4}],
}
COLOR.update({'E2': '#38bdf8', 'E6': '#e879f9', 'E7': '#facc15', 'E9': '#fb7185'})
for k, capas in EXTRA.items():
    n = sum(len(c['puntos']) for c in capas)
    G[k] = {'id': k, 'n': NOM.get(k, k), 'c': COLOR[k], 'capas': [{'n': c['n'], 'c': c['c'], 'lotes': [], 'techos': [], 'puntos': c['puntos'], 'tam': c['tam']} for c in capas], 'area': 0, 'n_lotes': n, 'n_puntos': n}
res = []
for k in sorted(G, key=lambda x: int(x[1:])):
    g = G[k]; T = [l for c in g['capas'] for l in c['lotes']] or [t[:-1] for c in g['capas'] for t in c['techos']] or [p for c in g['capas'] for p in c.get('puntos', [])]
    xs = [l[i] for l in T for i in range(0, len(l), 2)]; ys = [l[i] for l in T for i in range(1, len(l), 2)]
    g['centro'] = [round(sum(xs) / len(xs) / 2), round(sum(ys) / len(ys) / 2)]; g['area'] = round(g['area']); res.append(g)
json.dump({'fuente': 'Propuesta shp/lote.shp (PROPUESTA) + Corabastos y humedales; nombres del Excel de las 9 estrategias', 'escala': 0.5, 'nombres': NOM, 'estrategias': res},
          open(os.path.join(RAIZ, 'data3d', 'estrategias.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
for e in res: print(e['id'], e['n'], '·', [c['n'] for c in e['capas']], '·', round(e['area'] / 1e4, 1), 'ha')
print('tamaño', round(os.path.getsize(os.path.join(RAIZ, 'data3d', 'estrategias.json')) / 1e6, 2), 'MB')