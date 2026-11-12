"""Asambleas existentes: Juntas de Acción Comunal (JAC) de Kennedy con su sede y su asamblea.
Fuente: IDPAC, 'Organizaciones comunales Bogotá D.C.' (datos abiertos Bogotá, organizacioncomunal.geojson, EPSG:4686),
localidad 8. Campos: NOrg (nombre), DSCo (dirección de la sede), HAAf_1 (días y horario de atención/asamblea), FEle (elecciones).
Red: juntas unidas por compartir una comisión de trabajo (mismo tema), con la más cercana que la tiene.
Uso: python tools/asambleas_build.py <organizacioncomunal.geojson> [dignatarios.csv]  ->  data3d/asambleas.json"""
import json, math, os, sys
import numpy as np
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
LAT0, LON0 = 4.640683, -74.149778
MX, MY = 111320 * math.cos(math.radians(4.63)), 110540.0
# comisiones de trabajo de cada junta (IDPAC, 'Dignatarios activos' jun. 2022): solo el nombre de la comisión, nunca datos personales
COM = {}
if len(sys.argv) > 2:
    import csv, io
    t = open(sys.argv[2], 'rb').read().decode('utf-8-sig', errors='replace')
    for r in csv.DictReader(io.StringIO(t), delimiter=';' if t.count(';') > t.count(',') else ','):
        v = r['Valor'].strip()
        if v.startswith('COMISION'):
            n = v.replace('COMISION', '').replace(' DE ', ' ').strip().capitalize().replace('\ufffd', 'ó')
            L = COM.setdefault(r['Codigo'].strip(), [])
            if n and n not in L: L.append(n)
F = [f for f in json.load(open(sys.argv[1], encoding='utf-8'))['features'] if str(f['properties'].get('NLoc')) == '8']
P = []
for f in F:
    lon, lat = f['geometry']['coordinates'][:2]; p = f['properties']
    hor = (p.get('HAAf_1') or '').replace('Dias de la semana', 'Días:').replace('Horario', '· Horario:').strip()
    P.append([round((lon - LON0) * MX + 2095.67, 1), round(-(lat - LAT0) * MY - 109.06, 1), (p.get('NOrg') or '').strip().title(), (p.get('DSCo') or '').strip(), hor, COM.get(str(int(p.get('COD_JAC') or 0)), [])])
# RED CON SIGNIFICADO: dos juntas se unen si trabajan el MISMO TEMA (tienen la misma comisión de trabajo): cada junta se une con la
# junta más cercana (máx. 2,5 km) que tiene esa comisión. Son las juntas que podrían coordinarse y decidir juntas sobre ese tema.
TEMA = [('Ambiente', ('ambient', 'medio ambiente')), ('Salud', ('salud',)), ('Obras y servicios', ('obra', 'servicios publicos', 'vivienda')), ('Seguridad', ('segur', 'vigilan', 'convivencia')),
        ('Educación y cultura', ('educa', 'cultur')), ('Deporte y recreación', ('deport', 'recrea', 'juventud')), ('Adultos mayores y bienestar', ('mayor', 'bienestar', 'social', 'mujer')), ('Trabajo y empresa', ('trabajo', 'empres', 'econom'))]
def temas(L):
    out = set()
    for x in L:
        xl = x.lower()
        for k, (nom, cl) in enumerate(TEMA):
            if any(w in xl for w in cl): out.add(k)
    return sorted(out)
for p in P: p.append(temas(p[5]))
X = np.array([[p[0], p[1]] for p in P]); E = []; vistos = set()
for k in range(len(TEMA)):
    ix = [i for i, p in enumerate(P) if k in p[6]]
    for i in ix:
        cand = [(float(np.hypot(*(X[j] - X[i]))), j) for j in ix if j != i]
        if not cand: continue
        d, j = min(cand)
        if d > 2500: continue
        key = (min(i, j), max(i, j), k)
        if key in vistos: continue
        vistos.add(key); E.append([i, j, k])
json.dump({'fuente': 'IDPAC · Organizaciones comunales Bogotá D.C. (datos abiertos Bogotá), localidad Kennedy', 'temas': [t[0] for t in TEMA], 'p': P, 'e': E}, open(os.path.join(R, 'data3d', 'asambleas.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('juntas', len(P), 'tramos', len(E))
