"""Suelo de la plaza de la Biblioteca El Tintal y círculo de la huerta paramétrica (data3d/tintal.json, data3d/tintal_suelo.jpg).
El suelo es la foto satelital (Esri World Imagery, nivel 19) de la zona: tapa los huecos que deja el recorte de los árboles
'derretidos' de la malla de Google (la base gris de la entrada)."""
import json, math, os, urllib.request
from PIL import Image
from shapely.geometry import Polygon, Point
RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
CACHE = r'C:\Users\ACER\REN3D-realista\tools\cache\esri19'
LAT0, LON0 = 4.640683, -74.149778; MX, MY = 111320 * math.cos(math.radians(4.63)), 110540.0; Z = 19
f = os.path.join(RAIZ, 'data3d', 'tintal.json'); D = json.load(open(f, encoding='utf-8'))
HC, HR = [-577.5, -371.9], 41.7
D['huerta'] = {'c': HC, 'r': HR}
D['palmas'] = [p for p in D['palmas'] if math.hypot(p[0] - HC[0], p[1] - HC[1]) > HR + 6]  # las "palmas" sobre el prado eran falsos positivos
# zona propia (modelo): biblioteca + plaza + círculo de la huerta
zm = Polygon([(p[0] - 7437, 3270.96 - p[1]) for p in D['zona_modelo']]).union(Point(*HC).buffer(HR + 8, 48)).simplify(0.8)
D['zona_modelo'] = [[round(x + 7437, 2), round(3270.96 - y, 2)] for x, y in zm.exterior.coords]
D['zona_giro'] = [[round(x, 2), round(y, 2)] for x, y in zm.exterior.coords]
x0, y0, x1, y1 = zm.bounds; x0 -= 4; y0 -= 4; x1 += 4; y1 += 4
ll = lambda X, Y: (LAT0 - Y / MY, LON0 + X / MX)
tile = lambda lat, lon: ((lon + 180) / 360 * 2 ** Z, (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * 2 ** Z)
tx0, ty0 = tile(*ll(x0, y0)); tx1, ty1 = tile(*ll(x1, y1))
im = Image.new('RGB', ((int(tx1) - int(tx0) + 1) * 256, (int(ty1) - int(ty0) + 1) * 256))
for X in range(int(tx0), int(tx1) + 1):
    for Y in range(int(ty0), int(ty1) + 1):
        fn = os.path.join(CACHE, '%d_%d.jpg' % (X, Y))
        if not os.path.exists(fn): open(fn, 'wb').write(urllib.request.urlopen(urllib.request.Request(f'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{Z}/{Y}/{X}', headers={'User-Agent': 'REN3D-maqueta/1.0'}), timeout=30).read())
        im.paste(Image.open(fn).convert('RGB'), ((X - int(tx0)) * 256, (Y - int(ty0)) * 256))
box = [(tx0 - int(tx0)) * 256, (ty0 - int(ty0)) * 256, (tx1 - int(tx0)) * 256, (ty1 - int(ty0)) * 256]
im = im.crop([round(v) for v in box]).resize((1024, round(1024 * (y1 - y0) / (x1 - x0))), Image.LANCZOS)
im.save(os.path.join(RAIZ, 'data3d', 'tintal_suelo.jpg'), quality=86)
D['suelo'] = [round(x0, 2), round(y0, 2), round(x1, 2), round(y1, 2)]
json.dump(D, open(f, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('palmas', len(D['palmas']), 'suelo', D['suelo'], im.size)
