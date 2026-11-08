"""Redes de actores de las 9 estrategias -> data3d/actores.json

Fuente: Kennedy_9_Estrategias_Cada_Pestana_Actores_y_Relaciones.xlsx (hojas INICIO, NODOS TOTALES, CONEXIONES TOTALES y
TAGS Y CRITERIOS). Por estrategia: 100 nodos (roles previos, roles propuestos por proceso, organismos, entorno, recursos e
infraestructura) y 112 relaciones etiquetadas (INF, AUT, CTRL, RET, DEP, CONS, BIO, MAT, AMB).
Los roles y vínculos propuestos son hipótesis: no equivalen a personas identificadas ni a relaciones comprobadas.
Uso: python tools/actores_build.py [ruta del .xlsx]   (requiere openpyxl)"""
import json, os, sys
import openpyxl

RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
XLSX = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.expanduser('~'), 'Downloads', 'Kennedy_9_Estrategias_Cada_Pestana_Actores_y_Relaciones.xlsx')
wb = openpyxl.load_workbook(XLSX, data_only=True)
s = lambda v: '' if v is None else str(v).strip()

nombres = {}
for r in wb['INICIO'].iter_rows(values_only=True):
    if r[0] and s(r[0]).startswith('E') and s(r[0])[1:].isdigit(): nombres[s(r[0])] = s(r[1])
avisos = [s(r[0]) for r in wb['INICIO'].iter_rows(min_row=2, max_row=4, values_only=True) if r[0]]
tags = {s(r[0]): {'n': s(r[1]), 'cuando': s(r[2])} for r in wb['TAGS Y CRITERIOS'].iter_rows(min_row=2, values_only=True) if r[0]}

E = {k: {'id': k, 'n': v, 'nodos': [], 'rel': []} for k, v in nombres.items()}
for r in wb['NODOS TOTALES'].iter_rows(min_row=2, values_only=True):
    if not r[0] or s(r[0]) not in E: continue
    E[s(r[0])]['nodos'].append({'id': s(r[1]), 'n': s(r[2]), 'cl': s(r[3]), 'proc': s(r[4]), 'fn': s(r[5]), 'est': s(r[6]), 'orig': s(r[7])})
for r in wb['CONEXIONES TOTALES'].iter_rows(min_row=2, values_only=True):
    if not r[0] or s(r[0]) not in E: continue
    E[s(r[0])]['rel'].append({'id': s(r[1]), 'o': s(r[2]), 'd': s(r[4]), 'tag': s(r[6]), 'rel': s(r[7]), 'act': s(r[8]), 'falla': s(r[9]), 'ev': s(r[10]), 'est': s(r[11])})
# ---- Documento maestro (Kennedy_Documento_Maestro_Redes_y_ABM.docx): ficha por estrategia, conexiones entre estrategias y reglas de lectura ----
import re, html, zipfile, glob
DOCX = next(iter(sorted(glob.glob(os.path.join(os.path.expanduser('~'), 'Downloads', 'Kennedy_Documento_Maestro_Redes_y_ABM*.docx')))), None)
doc = {}
if DOCX:
    x = zipfile.ZipFile(DOCX).read('word/document.xml').decode('utf8')
    P = []
    for p in re.findall(r'<w:p[ >].*?</w:p>', x, flags=re.S):
        sty = re.search(r'<w:pStyle w:val="([^"]+)"', p); t = html.unescape(''.join(re.findall(r'<w:t[^>]*>(.*?)</w:t>', p, flags=re.S))).strip()
        if t: P.append((sty.group(1) if sty else '', t))
    def tras(i, clave):
        for j in range(i, min(i + 40, len(P))):
            if P[j][1] == clave: return P[j + 1][1]
        return ''
    fichas = {}
    for i, (s, t) in enumerate(P):
        m = re.match(r'7\.\d+\s+(E\d)\s*\|\s*(.+)', t)
        if s.startswith('Heading1') and m:
            fichas[m.group(1)] = {'mecanismo': tras(i, 'Mecanismo'), 'condiciones': tras(i, 'Condiciones que deben comprobarse'), 'distinguir': tras(i, 'Actores y no humanos a distinguir'), 'riesgo': tras(i, 'Riesgo de suposición')}
    def seccion(titulo):
        i = next((k for k, (s, t) in enumerate(P) if s.startswith('Heading1') and t.startswith(titulo)), None)
        if i is None: return []
        L = []
        for s, t in P[i + 1:]:
            if s.startswith('Heading1'): break
            L.append(t)
        return L
    s8 = seccion('8.'); cruces = []
    if 'Qué no puede suponerse' in s8:
        k = s8.index('Qué no puede suponerse') + 1
        while k + 2 < len(s8) + 1 and k + 2 <= len(s8) - 0:
            if k + 2 >= len(s8) + 1: break
            cruces.append({'par': s8[k], 'mecanismo': s8[k + 1], 'no_suponer': s8[k + 2]}); k += 3
    s4 = seccion('4.'); tags_doc = []
    if 'Condición mínima' in s4:
        k = s4.index('Condición mínima') + 1
        while k + 2 < len(s4) + 1 and k + 2 <= len(s4) - 0:
            tags_doc.append({'tag': s4[k], 'n': s4[k + 1], 'min': s4[k + 2]}); k += 3
    doc = {'fuente': os.path.basename(DOCX), 'fichas': fichas, 'cruces': cruces, 'que_es': seccion('1.'), 'leer_relacion': s4[:1], 'tags_recomendados': tags_doc, 'regla': seccion('5.'), 'leer_nodo': seccion('3.')}
    print('documento maestro:', len(fichas), 'fichas ·', len(cruces), 'conexiones entre estrategias ·', len(tags_doc), 'tags recomendados')
out = {'fuente': os.path.basename(XLSX), 'avisos': avisos, 'tags': tags, 'doc': doc, 'estrategias': [E[k] for k in sorted(E, key=lambda x: int(x[1:]))]}
json.dump(out, open(os.path.join(RAIZ, 'data3d', 'actores.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
for e in out['estrategias']: print(e['id'], e['n'], len(e['nodos']), 'nodos', len(e['rel']), 'relaciones')
print('tamaño', round(os.path.getsize(os.path.join(RAIZ, 'data3d', 'actores.json')) / 1e3), 'KB')
