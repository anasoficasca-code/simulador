"""Plazas de mercado existentes en la zona del modelo, con la huella real de su edificio.
Fuentes: IPES 'Plazas de mercado 2024' (datos abiertos Bogotá, 19 plazas distritales, coordenadas) y plazas de mercado de
OpenStreetMap (capa E7 de data3d/estrategias.json). La huella sale de data3d/buildings.json: los edificios que contienen el
punto de la plaza o son naves grandes (más de 400 m²) a menos de 45 m (las plazas son una nave grande o un conjunto de naves).
Uso: python tools/plazas_build.py <plazas-de-mercado.csv>  ->  data3d/plazas.json"""
import csv, io, json, math, os, sys
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
LAT0, LON0 = 4.640683, -74.149778
MX, MY = 111320 * math.cos(math.radians(4.63)), 110540.0
B = json.load(open(os.path.join(R, 'data3d', 'buildings.json'), encoding='utf-8'))
cent = []
for i, b in enumerate(B):
    p = b['pts'][:-1]; n = len(p)
    if n < 3: cent.append(None); continue
    cent.append((sum(q[0] for q in p) / n, sum(q[1] for q in p) / n))
x0 = min(c[0] for c in cent if c); x1 = max(c[0] for c in cent if c); y0 = min(c[1] for c in cent if c); y1 = max(c[1] for c in cent if c)
def dentro(P, x, y):
    c = False
    for i in range(len(P) - 1):
        a, b = P[i], P[i + 1]
        if (a[1] > y) != (b[1] > y) and x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]: c = not c
    return c
def area(P): return abs(sum(P[i][0] * P[i + 1][1] - P[i + 1][0] * P[i][1] for i in range(len(P) - 1))) / 2
pl = []
raw = open(sys.argv[1], 'rb').read(); t = raw.decode('utf-8-sig', errors='replace')
for r in csv.DictReader(io.StringIO(t), delimiter=';' if t.count(';') > t.count(',') else ','):
    lon = float(r['coord_x'].replace(',', '.')); lat = float(r['coord_y'].replace(',', '.'))
    pl.append({'n': r['Nombre'].strip(), 'f': 'IPES', 'x': (lon - LON0) * MX + 7437, 'y': (lat - LAT0) * MY + 3270.96, 'loc': r.get('Numero de locales', '')})
D = json.load(open(os.path.join(R, 'data3d', 'estrategias.json'), encoding='utf-8'))
e7 = [e for e in D['estrategias'] if e['id'] == 'E7'][0]; cap = [c for c in e7['capas'] if 'Plazas' in c['n']][0]
for q in cap['puntos']:
    x, y = q[0] * D.get('escala', 0.5), q[1] * D.get('escala', 0.5)
    if any(math.hypot(x - p['x'], y - p['y']) < 120 for p in pl): continue  # misma plaza que la del IPES
    pl.append({'n': 'Plaza de mercado (OSM)', 'f': 'OSM', 'x': x, 'y': y, 'loc': ''})
out = []
for p in pl:
    if not (x0 - 50 < p['x'] < x1 + 50 and y0 - 50 < p['y'] < y1 + 50): continue
    H = []
    for i, b in enumerate(B):
        c = cent[i]
        if not c or abs(c[0] - p['x']) > 120 or abs(c[1] - p['y']) > 120: continue
        if dentro(b['pts'], p['x'], p['y']) or (math.hypot(c[0] - p['x'], c[1] - p['y']) < 45 and area(b['pts']) > 400): H.append(i)  # la nave que contiene el punto y naves grandes vecinas
    if not H:  # el edificio más cercano
        bi = min((i for i, c in enumerate(cent) if c), key=lambda i: math.hypot(cent[i][0] - p['x'], cent[i][1] - p['y']))
        if math.hypot(cent[bi][0] - p['x'], cent[bi][1] - p['y']) < 60: H = [bi]
    out.append({'n': p['n'], 'f': p['f'], 'loc': p['loc'], 'p': [round(p['x'], 1), round(p['y'], 1)], 'h': [{'pts': [[round(v[0], 1), round(v[1], 1)] for v in B[i]['pts']], 'h': B[i]['h']} for i in H]})
json.dump({'fuente': 'IPES · Plazas de mercado 2024 (datos abiertos Bogotá) + OpenStreetMap', 'plazas': out}, open(os.path.join(R, 'data3d', 'plazas.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
for o in out: print(o['f'], o['n'], 'edificios', len(o['h']))
