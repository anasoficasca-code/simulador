"""Agua comunitaria en Kennedy: lo existente y la propuesta.
EXISTENTE: no hay acueductos comunitarios en Kennedy (capas oficiales 'Prestadores privados de acueducto' e 'Infraestructura de
acueductos comunitarios': todos en Usme, Ciudad Bolívar, Sumapaz y bordes). Lo que sí hay es gestión comunitaria del agua en las
huertas de la Ruta Agroecológica de Kennedy (Jardín Botánico de Bogotá, 2022). La Huerta Comunitaria Monterrey recoge agua lluvia
(El Espectador, 'Huerta Comunitaria de Monterrey: un espacio que reverdece Kennedy'). Direcciones del directorio de la ruta,
geocodificadas a la placa (ArcGIS World Geocoder).
PROPUESTA: cisternas de agua lluvia en las cubiertas de los conjuntos en altura (capa E7) a menos de 1,6 km de cada huerta; el
excedente va a la huerta comunitaria más cercana. Lo administran las juntas de acción comunal.
Uso: python tools/agua_build.py  ->  data3d/agua.json"""
import json, math, os
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
LAT0, LON0 = 4.640683, -74.149778
MX, MY = 111320 * math.cos(math.radians(4.63)), 110540.0
w = lambda lat, lon: [round((lon - LON0) * MX + 2095.67, 1), round(-(lat - LAT0) * MY - 109.06, 1)]
H = [  # nombre, dirección, lat, lon, agua documentada
    ('Huerta Comunitaria Monterrey', 'Calle 8 Bis B # 81-20', 4.643226, -74.147562, 'Recoge agua lluvia (documentado)'),
    ('Huerta Marsella', 'Carrera 69 # 8-28', 4.632976, -74.127021, ''),
    ('Huerta Comunitaria Carvajal Osorio', 'Carrera 68I # 37D Sur-38', 4.607857, -74.137039, ''),
    ('La Huerta del Alebrije · Biblioteca El Tintal', 'Av. Ciudad de Cali # 6C-09', 4.643123, -74.153743, ''),
    ('Huerta Granja Mundo Natural · Mundo Aventura', 'Carrera 71D # 1-14 Sur', 4.622908, -74.136798, ''),
]
huertas = [{'n': n, 'dir': d, 'p': w(la, lo), 'agua': a} for n, d, la, lo, a in H]
D = json.load(open(os.path.join(R, 'data3d', 'estrategias.json'), encoding='utf-8')); esc = D.get('escala', 0.5)
e7 = [e for e in D['estrategias'] if e['id'] == 'E7'][0]; conj = [c for c in e7['capas'] if 'Conjuntos' in c['n']][0]['puntos']
LC = (5341.33, 3161.9)
cist = []
for q in conj:
    x, z = q[0] * esc - LC[0], LC[1] - q[1] * esc  # marco del modelo -> mundo del simulador
    d, k = min((math.hypot(x - h['p'][0], z - h['p'][1]), k) for k, h in enumerate(huertas))
    if d < 1600: cist.append([x, z, k])
# un punto de cisterna por manzana de conjuntos (sector de 300 m): cuántos conjuntos recogen agua ahí
S = {}
for x, z, k in cist:
    s = S.setdefault((math.floor(x / 300), math.floor(z / 300), k), [0, 0, 0]); s[0] += x; s[1] += z; s[2] += 1
cist = [[round(s[0] / s[2], 1), round(s[1] / s[2], 1), k, s[2]] for (_, _, k), s in S.items()]
json.dump({'fuente': 'Ruta Agroecológica Kennedy (Jardín Botánico de Bogotá, 2022) · El Espectador · capas de acueductos comunitarios (datos abiertos Bogotá)', 'huertas': huertas, 'cisternas': cist}, open(os.path.join(R, 'data3d', 'agua.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('huertas', len(huertas), 'sectores con cisternas', len(cist), 'conjuntos', sum(c[3] for c in cist), [sum(1 for c in cist if c[2] == k) for k in range(len(huertas))])
