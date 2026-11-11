"""Usos del suelo por edificio para el simulador.
Fuente: shapefile Usos_kennedy (50.878 lotes reales), unido por centroide en el repo modelamiento2
(assets/kennedy_buildings_uso.json: una etiqueta por edificio, en el mismo orden que data3d/buildings.json).
Salida: data3d/usos_edif.json = { codigo: [i, j, i, j, ...] } con celdas de 2 m del centroide del edificio
(solo la celda propia; el simulador mira las 8 vecinas si no la encuentra, por el redondeo de 0,25 m de los binarios).
Regla del módulo 08: torre de 15 m o más sin uso asignado -> Residencial.
Uso: python tools/usos_build.py <kennedy_buildings_uso.json>"""
import json, os, sys, math
RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
COD = {'Residencial': 1, 'Comercio': 2, 'Dotacional': 3, 'Industrial': 4, 'Recreacional': 5, 'Parqueadero': 6, 'Otros': 7}
B = json.load(open(os.path.join(RAIZ, 'data3d', 'buildings.json'), encoding='utf-8'))
U = json.load(open(sys.argv[1], encoding='utf-8'))
assert len(B) == len(U), (len(B), len(U))
prim, pos = {}, []
for b, u in zip(B, U):
    if not u and b['h'] >= 15: u = 'Residencial'
    c = COD.get(u or '', 0)
    if not c: continue
    p = b['pts'][:-1]; n = len(p)
    if n < 3: continue
    cx = sum(q[0] for q in p) / n; cy = sum(q[1] for q in p) / n
    k = (math.floor(cx / 2), math.floor(cy / 2)); prim[k] = c; pos.append((k, c))
todo = prim  # solo la celda propia: el simulador busca en las 8 vecinas si no la encuentra
out = {}
for (i, j), c in todo.items(): out.setdefault(str(c), []).extend([i, j])
json.dump(out, open(os.path.join(RAIZ, 'data3d', 'usos_edif.json'), 'w'), separators=(',', ':'))
print('edificios con uso', len(pos), 'celdas', len(todo), '%.2f MB' % (os.path.getsize(os.path.join(RAIZ, 'data3d', 'usos_edif.json')) / 1e6))
