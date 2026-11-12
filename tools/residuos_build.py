"""Puntos actuales de recolección de residuos en Kennedy (contenedores) y su red.
Fuente: UAESP / IDECA, servicio ArcGIS 'aseobogota', capa 8 'Contenerización' (localidad 8, Kennedy):
https://serviciosgis.catastrobogota.gov.co/arcgis/rest/services/serviciospublicos/aseobogota/MapServer/8
Red: árbol de expansión mínima por tipo (cada contenedor unido a la red por el tramo más corto), como lectura de la
red de recolección; no es la ruta real de los camiones.
Uso: python tools/residuos_build.py <contenedores_kennedy.geojson>  ->  data3d/residuos.json"""
import json, math, os, sys
import numpy as np
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
LAT0, LON0 = 4.640683, -74.149778
MX, MY = 111320 * math.cos(math.radians(4.63)), 110540.0
OX, OZ = 2095.67, -109.06            # marco del giro -> mundo del simulador
G = json.load(open(sys.argv[1], encoding='utf-8'))
P = []
for f in G['features']:
    lon, lat = f['geometry']['coordinates'][:2]; pr = f['properties']
    P.append([round((lon - LON0) * MX + OX, 1), round(-(lat - LAT0) * MY + OZ, 1), 1 if pr.get('APROVECHAB') == 'S' else 0, pr.get('CAPACIDAD') or 0, pr.get('DIRECCION') or ''])
def mst(ix):
    X = np.array([[P[i][0], P[i][1]] for i in ix]); n = len(X); E = []
    if n < 2: return E
    dentro = np.zeros(n, bool); dentro[0] = True; dist = np.hypot(*(X - X[0]).T); padre = np.zeros(n, int)
    for _ in range(n - 1):
        d = np.where(dentro, np.inf, dist); j = int(np.argmin(d)); dentro[j] = True; E.append([ix[padre[j]], ix[j]])
        nd = np.hypot(*(X - X[j]).T); m = (nd < dist) & ~dentro; dist[m] = nd[m]; padre[m] = j
    return E
E = mst([i for i, p in enumerate(P) if p[2] == 1]) + mst([i for i, p in enumerate(P) if p[2] == 0])
json.dump({'fuente': 'UAESP / IDECA · capa Contenerización (localidad Kennedy)', 'p': P, 'e': E}, open(os.path.join(R, 'data3d', 'residuos.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('puntos', len(P), 'tramos', len(E), 'aprovechables', sum(p[2] for p in P))
