"""Asambleas existentes: Juntas de Acción Comunal (JAC) de Kennedy con su sede y su asamblea.
Fuente: IDPAC, 'Organizaciones comunales Bogotá D.C.' (datos abiertos Bogotá, organizacioncomunal.geojson, EPSG:4686),
localidad 8. Campos: NOrg (nombre), DSCo (dirección de la sede), HAAf_1 (días y horario de atención/asamblea), FEle (elecciones).
Red: árbol de expansión mínima entre juntas (cada una unida a la más cercana): lectura de vecindad, no una red formal.
Uso: python tools/asambleas_build.py <organizacioncomunal.geojson>  ->  data3d/asambleas.json"""
import json, math, os, sys
import numpy as np
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
LAT0, LON0 = 4.640683, -74.149778
MX, MY = 111320 * math.cos(math.radians(4.63)), 110540.0
F = [f for f in json.load(open(sys.argv[1], encoding='utf-8'))['features'] if str(f['properties'].get('NLoc')) == '8']
P = []
for f in F:
    lon, lat = f['geometry']['coordinates'][:2]; p = f['properties']
    hor = (p.get('HAAf_1') or '').replace('Dias de la semana', 'Días:').replace('Horario', '· Horario:').strip()
    P.append([round((lon - LON0) * MX + 2095.67, 1), round(-(lat - LAT0) * MY - 109.06, 1), (p.get('NOrg') or '').strip().title(), (p.get('DSCo') or '').strip(), hor])
X = np.array([[p[0], p[1]] for p in P]); n = len(X); E = []
dentro = np.zeros(n, bool); dentro[0] = True; dist = np.hypot(*(X - X[0]).T); padre = np.zeros(n, int)
for _ in range(n - 1):
    d = np.where(dentro, np.inf, dist); j = int(np.argmin(d)); dentro[j] = True; E.append([int(padre[j]), j])
    nd = np.hypot(*(X - X[j]).T); m = (nd < dist) & ~dentro; dist[m] = nd[m]; padre[m] = j
json.dump({'fuente': 'IDPAC · Organizaciones comunales Bogotá D.C. (datos abiertos Bogotá), localidad Kennedy', 'p': P, 'e': E}, open(os.path.join(R, 'data3d', 'asambleas.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('juntas', len(P), 'tramos', len(E))
