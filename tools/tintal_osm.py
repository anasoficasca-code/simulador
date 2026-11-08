"""Huella real de la Biblioteca Pública El Tintal (Manuel Zapata Olivella) y de su plaza/parque desde OpenStreetMap (ODbL),
en el marco del giro (X este, Y sur, m, desde El Burro). Salida: tools/cache/tintal_osm.json (lo usa data3d/tintal.js vía data3d/tintal.json)."""
import json, math, os, time, urllib.parse, urllib.request
RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
LAT0, LON0 = 4.640683, -74.149778
MX, MY = 111320 * math.cos(math.radians(4.63)), 110540.0
lat, lon, r = 4.643896, -74.153767, 260
q = '[out:json][timeout:60];(way(around:%d,%f,%f)[building];way(around:%d,%f,%f)[leisure];way(around:%d,%f,%f)[highway=pedestrian];way(around:%d,%f,%f)[amenity];relation(around:%d,%f,%f)[leisure];);out geom tags;' % ((r, lat, lon) * 5)
data = None
for url in ('https://overpass-api.de/api/interpreter', 'https://maps.mail.ru/osm/tools/overpass/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'):
    try:
        req = urllib.request.Request(url, data=urllib.parse.urlencode({'data': q}).encode(), headers={'User-Agent': 'REN3D-maqueta/1.0'})
        data = json.load(urllib.request.urlopen(req, timeout=120)); break
    except Exception as e: print(url, e); time.sleep(2)
if data is None: raise SystemExit('sin Overpass')
out = []
for e in data['elements']:
    g = e.get('geometry')
    if not g and e.get('members'):
        g = [p for m in e['members'] if m.get('role') == 'outer' for p in (m.get('geometry') or [])]
    if not g: continue
    out.append({'id': e['id'], 'tipo': e['type'], 'tags': e.get('tags', {}), 'pts': [[round((p['lon'] - LON0) * MX, 2), round(-(p['lat'] - LAT0) * MY, 2)] for p in g]})
os.makedirs(os.path.join(RAIZ, 'tools', 'cache'), exist_ok=True)
json.dump(out, open(os.path.join(RAIZ, 'tools', 'cache', 'tintal_osm.json'), 'w', encoding='utf-8'), ensure_ascii=False)
for o in out:
    t = o['tags']; xs = [p[0] for p in o['pts']]; ys = [p[1] for p in o['pts']]
    print(o['id'], t.get('name', ''), t.get('building', ''), t.get('leisure', ''), t.get('amenity', ''), t.get('highway', ''), len(o['pts']), 'x %.0f..%.0f y %.0f..%.0f' % (min(xs), max(xs), min(ys), max(ys)))
