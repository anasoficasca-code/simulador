"""Canchas deportivas de toda la localidad de Kennedy (OpenStreetMap, ODbL) para pintarlas reales sobre la foto 3D del modo Kennedy.
Para cada cancha: rectángulo orientado mínimo (centro, largo, ancho, ángulo), deporte y superficie. Si OSM no trae el deporte se
deduce del tamaño (≥ 45 m de largo: fútbol en grama sintética; si no, cancha múltiple de concreto).
Coordenadas del giro: X este, Y sur (m) desde el humedal El Burro (lat 4.640683, lon -74.149778), como data3d/giro_sim.json.
Salida: data3d/canchas.json. Uso: python tools/canchas_kennedy.py"""
import json, math, os, time, urllib.parse, urllib.request
from shapely.geometry import Polygon
RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
LAT0, LON0 = 4.640683, -74.149778
MX, MY = 111320 * math.cos(math.radians(4.63)), 110540.0
AREA = 3600000000 + 4740229  # relación OSM de la localidad de Kennedy
BB = '4.5950,-74.1858,4.6642,-74.1182'  # caja de la localidad (el límite OSM se aplica después)
q = '[out:json][timeout:120];(way[leisure=pitch](%s);way[leisure=track](%s););out geom tags;' % (BB, BB)
LIM = Polygon([((p[0] - LON0) * MX, -(p[1] - LAT0) * MY) for p in json.load(open(os.path.join(RAIZ, 'data3d', 'kennedy.json'), encoding='utf-8'))['limite']])
data = None
for url in ('https://maps.mail.ru/osm/tools/overpass/api/interpreter', 'https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter', 'https://overpass.private.coffee/api/interpreter'):
    try:
        req = urllib.request.Request(url, data=urllib.parse.urlencode({'data': q}).encode(), headers={'User-Agent': 'REN3D-maqueta/1.0', 'Accept': 'application/json'})
        data = json.load(urllib.request.urlopen(req, timeout=180)); break
    except Exception as e:
        print('overpass', url, e); time.sleep(3)
if data is None: raise SystemExit('sin respuesta de Overpass')
def xy(p): return ((p['lon'] - LON0) * MX, -(p['lat'] - LAT0) * MY)
out = []
for e in data['elements']:
    g, t = e.get('geometry'), e.get('tags', {})
    if not g or len(g) < 4: continue
    pg = Polygon([xy(p) for p in g])
    if not pg.is_valid: pg = pg.buffer(0)
    if pg.area < 60 or not LIM.contains(pg.centroid): continue
    r = pg.minimum_rotated_rectangle
    c = list(r.exterior.coords)[:4]
    e1 = (c[1][0] - c[0][0], c[1][1] - c[0][1]); e2 = (c[2][0] - c[1][0], c[2][1] - c[1][1])
    l1, l2 = math.hypot(*e1), math.hypot(*e2)
    if l1 < l2: e1, l1, l2 = e2, l2, l1
    ang = math.atan2(e1[1], e1[0])
    dep = t.get('sport', '').split(';')[0]
    sup = t.get('surface', '')
    tipo = t.get('leisure')
    if tipo == 'track': dep = 'atletismo'
    elif dep in ('soccer', 'football'): dep = 'futbol'
    elif dep == 'basketball': dep = 'baloncesto'
    elif dep in ('volleyball', 'beachvolleyball'): dep = 'voleibol'
    elif dep == 'tennis': dep = 'tenis'
    elif dep in ('multi', ''): dep = 'futbol' if l1 >= 45 else 'multiple'
    else: dep = 'multiple'
    if not sup: sup = 'grama' if dep == 'futbol' and l1 >= 45 else 'concreto'
    elif sup in ('artificial_turf', 'grass'): sup = 'grama'
    else: sup = 'concreto'
    out.append({'c': [round(pg.centroid.x, 2), round(pg.centroid.y, 2)], 'L': round(l1, 1), 'W': round(l2, 1), 'a': round(ang, 4),
                'd': dep, 's': sup, 'n': t.get('name', '')})
json.dump({'fuente': 'OpenStreetMap (ODbL), leisure=pitch y track en la localidad de Kennedy', 'marco': 'X este, Y sur (m) desde El Burro', 'canchas': out},
          open(os.path.join(RAIZ, 'data3d', 'canchas.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
import collections
print(len(out), collections.Counter((o['d'], o['s']) for o in out).most_common())
