"""Plano en planta para la portada del simulador (figura-fondo, estilo plano de arquitectura).
Dibuja con los datos del modelo: edificios (buildings.json), vías por jerarquía (net.json), humedales y canales
(water_bodies.json) y parques (parques.json), centrado en los humedales El Burro y La Vaca.
Uso: python tools/portada_planta.py  ->  presentacion/img/planta.jpg"""
import json, os
from PIL import Image, ImageDraw
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
D = os.path.join(R, 'data3d')
CX, CY, ANCHO = 7150.0, 3300.0, 3400.0          # centro (m, marco del modelo) y ancho visible
W, H, SS = 1920, 1080, 2                          # salida y supermuestreo (bordes suaves)
ALTO = ANCHO * H / W
x0, y1 = CX - ANCHO / 2, CY + ALTO / 2
esc = W * SS / ANCHO
P = lambda p: ((p[0] - x0) * esc, (y1 - p[1]) * esc)   # y del modelo crece al norte: arriba en la imagen
dentro = lambda pts: any(x0 - 200 < p[0] < x0 + ANCHO + 200 and y1 - ALTO - 200 < p[1] < y1 + 200 for p in pts[:: max(1, len(pts) // 6)])

FONDO, PARQUE, AGUA, AGUA_B, VIA = (14, 17, 21), (30, 44, 34), (24, 52, 74), (60, 104, 138), (52, 58, 64)
im = Image.new('RGB', (W * SS, H * SS), FONDO); d = ImageDraw.Draw(im)
for p in json.load(open(os.path.join(D, 'parques.json'), encoding='utf-8')):
    if len(p['pts']) > 2 and dentro(p['pts']): d.polygon([P(q) for q in p['pts']], fill=PARQUE)
for w in json.load(open(os.path.join(D, 'water_bodies.json'), encoding='utf-8')):
    pts = w['pts']
    if len(pts) < 2 or not dentro(pts): continue
    cerrado = len(pts) > 3 and abs(pts[0][0] - pts[-1][0]) + abs(pts[0][1] - pts[-1][1]) < 1.5
    if cerrado: d.polygon([P(q) for q in pts], fill=AGUA, outline=AGUA_B)
    else: d.line([P(q) for q in pts], fill=AGUA_B, width=int(6 * esc))
ANCHOS = {'major': 16, 'mid': 9, 'local': 5}
N = json.load(open(os.path.join(D, 'net.json'), encoding='utf-8'))
for tipo in ('local', 'mid', 'major'):
    for e in N['edges']:
        if e[0] != tipo or not dentro(e[1]): continue
        d.line([P(q) for q in e[1]], fill=VIA if tipo == 'local' else (74, 80, 86) if tipo == 'mid' else (96, 92, 84), width=max(1, int(ANCHOS[tipo] * esc)), joint='curve')
for b in json.load(open(os.path.join(D, 'buildings.json'), encoding='utf-8')):
    pts = b['pts']
    if len(pts) < 4 or not dentro(pts): continue
    h = b.get('h', 6); t = min(1.0, (h - 3) / 40)                      # más alto = más claro
    c = tuple(int(v) for v in (118 + 70 * t, 120 + 66 * t, 120 + 58 * t))
    d.polygon([P(q) for q in pts], fill=c)
im = im.resize((W, H), Image.LANCZOS)
im.save(os.path.join(R, 'presentacion', 'img', 'planta.jpg'), quality=76, optimize=True, progressive=True)
print('ok', os.path.getsize(os.path.join(R, 'presentacion', 'img', 'planta.jpg')) // 1024, 'KB')
