"""Modelo 3D del sector INEM Kennedy (visor 3D de Bogotá, IDECA/SDP: mapas.bogota.gov.co/3dviewer, escena 'Inem Kennedy.3ws',
CityEngine Web Scene) convertido a GLB para el simulador.
- Capas: construcciones con fachadas fotográficas por lote (Cons, ConsVeci), arbolado (INEMKennedy\\Arbolado) y espacio público (PDom).
- Coordenadas: la escena está en metros (x este, y arriba, z sur); se ajusta lat/lon de cada objeto (locationLatLon vs translation) y se pasa
  al marco del giro (X este, Y sur desde El Burro). Una malla por material (textura) para pocas llamadas de dibujo.
Uso: python tools/inem_3ws.py <inem.3ws>   ->  data3d/inem/inem.glb + data3d/inem/inem.json (extensión y huellas para recortar)"""
import base64, gzip, json, math, os, sys, io, struct
import numpy as np
RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT = os.path.join(RAIZ, 'data3d', 'inem'); os.makedirs(OUT, exist_ok=True)
J = json.loads(gzip.open(sys.argv[1]).read())
LAT0, LON0 = 4.640683, -74.149778
MX, MY = 111320 * math.cos(math.radians(4.63)), 110540.0
CAPAS = ('MapaReferencia\\Cons', 'MapaReferencia\\ConsVeci')  # el arbolado (29 M de vértices) no: se exportan solo sus posiciones
# ajuste lineal escena -> lat/lon con todos los objetos
A, BLA, BLO = [], [], []
for o in J['objects'].values():
    p = o['params']; t = p['translation']; A.append([t[0], t[2], 1]); BLA.append(p['locationLatLon'][0]); BLO.append(p['locationLatLon'][1])
A = np.array(A); cla = np.linalg.lstsq(A, np.array(BLA), rcond=None)[0]; clo = np.linalg.lstsq(A, np.array(BLO), rcond=None)[0]
def a_giro(x, z):  # escena -> (X este, Y sur) del giro
    lat = cla[0] * x + cla[1] * z + cla[2]; lon = clo[0] * x + clo[1] * z + clo[2]
    return (lon - LON0) * MX, -(lat - LAT0) * MY
f32 = lambda s: np.frombuffer(base64.b64decode(s), dtype='<f4')
u32 = lambda s: np.frombuffer(base64.b64decode(s), dtype='<u4')
grupos = {}  # material -> listas
huellas = []; arboles = []
for o in J['objects'].values():
    p = o['params']
    if p['layer'] == 'INEMKennedy\\Arbolado': (x0, y0_, z0), (x1, y1_, z1) = p['extent']; t_ = p['translation']; X, Y = a_giro(t_[0], t_[2]); arboles.append([round(X, 2), round(Y, 2), round(y1_ - y0_, 1)]); continue
    if p['layer'] not in CAPAS: continue
    tx, ty, tz = p['translation']
    for gr in p['geometries']:
        G = J['geometries'][gr['geometry']]['params']; T = np.array(gr['transformation']).reshape(4, 4).T
        va = G['vertexAttr']; pos = f32(va['position']['data']).reshape(-1, 3); uv = f32(va['uv0']['data']).reshape(-1, 2) if 'uv0' in va else None
        pos = (np.c_[pos, np.ones(len(pos))] @ T.T)[:, :3] + [tx, ty, tz]
        for fi, F in enumerate(G['faces']):
            ip = u32(F['indices']['position']); iu = u32(F['indices']['uv0']) if uv is not None and 'uv0' in F['indices'] else None
            mat = gr['materials'][min(fi, len(gr['materials']) - 1)]
            g = grupos.setdefault(mat, {'p': [], 'u': []})
            g['p'].append(pos[ip]); g['u'].append(uv[iu] if iu is not None else np.zeros((len(ip), 2), 'f4'))
    if p['layer'] in ('MapaReferencia\\Cons', 'MapaReferencia\\ConsVeci'):
        (x0, _, z0), (x1, _, z1) = p['extent']; dx, dz = (x1 - x0) / 2, (z1 - z0) / 2; X, Y = a_giro(tx, tz); huellas.append([[X - dx, Y - dz], [X + dx, Y + dz]]) # caja alrededor de la traslación del objeto
# GLB a mano: una primitiva por material, posiciones en el marco del giro (x = X, y = alto, z = Y), sin índices
bin_ = io.BytesIO(); bufViews, accs, meshes, mats, texs, imgs = [], [], [], [], [], []
def add(b, target=None):
    while bin_.tell() % 4: bin_.write(b'\0')
    off = bin_.tell(); bin_.write(b); v = {'buffer': 0, 'byteOffset': off, 'byteLength': len(b)}
    if target: v['target'] = target
    bufViews.append(v); return len(bufViews) - 1
tex_idx = {}
prims = []
for mat, g in grupos.items():
    P = np.concatenate(g['p']).astype('f4'); U = np.concatenate(g['u']).astype('f4')
    X, Y = a_giro(P[:, 0], P[:, 2]); W = np.c_[X, P[:, 1], Y].astype('f4')
    # orden de triángulos: la escena tiene z hacia el sur; el giro también (Y sur), así que se conserva
    bvP = add(W.tobytes(), 34962); accs.append({'bufferView': bvP, 'componentType': 5126, 'count': len(W), 'type': 'VEC3', 'min': W.min(0).tolist(), 'max': W.max(0).tolist()}); aP = len(accs) - 1
    U2 = U.copy(); U2[:, 1] = 1 - U2[:, 1]
    bvU = add(U2.tobytes(), 34962); accs.append({'bufferView': bvU, 'componentType': 5126, 'count': len(U2), 'type': 'VEC2'}); aU = len(accs) - 1
    M = J['materials'].get(mat, {}).get('params', {}); c = M.get('color', [1, 1, 1]); m = {'pbrMetallicRoughness': {'baseColorFactor': [c[0], c[1], c[2], 1], 'metallicFactor': 0, 'roughnessFactor': 0.9}, 'doubleSided': True}
    tk = M.get('map')
    if tk and tk in J['textures']:
        if tk not in tex_idx:
            uri = J['textures'][tk]['params']['uri']; head, data = uri.split(',', 1); mime = head.split(':')[1].split(';')[0]
            bv = add(base64.b64decode(data)); imgs.append({'bufferView': bv, 'mimeType': mime}); texs.append({'source': len(imgs) - 1, 'sampler': 0}); tex_idx[tk] = len(texs) - 1
        m['pbrMetallicRoughness']['baseColorTexture'] = {'index': tex_idx[tk]}; m['pbrMetallicRoughness']['baseColorFactor'] = [1, 1, 1, 1]
        if 'tree' in tk.lower() or 'arbol' in tk.lower() or M.get('opacity', 1) < 1 or mime == 'image/png': m['alphaMode'] = 'MASK'; m['alphaCutoff'] = 0.5
    mats.append(m); prims.append({'attributes': {'POSITION': aP, 'TEXCOORD_0': aU}, 'material': len(mats) - 1})
meshes = [{'primitives': prims}]
gltf = {'asset': {'version': '2.0', 'generator': 'REN3D inem_3ws.py · fuente IDECA/SDP visor 3D Bogotá'}, 'scene': 0, 'scenes': [{'nodes': [0]}], 'nodes': [{'mesh': 0}], 'meshes': meshes,
        'materials': mats, 'textures': texs, 'images': imgs, 'samplers': [{'wrapS': 10497, 'wrapT': 10497, 'minFilter': 9987, 'magFilter': 9729}], 'accessors': accs, 'bufferViews': bufViews, 'buffers': [{'byteLength': 0}]}
while bin_.tell() % 4: bin_.write(b'\0')
B = bin_.getvalue(); gltf['buffers'][0]['byteLength'] = len(B)
js = json.dumps(gltf, separators=(',', ':')).encode()
js += b' ' * ((4 - len(js) % 4) % 4)
with open(os.path.join(OUT, 'inem.glb'), 'wb') as f:
    f.write(struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(B))); f.write(struct.pack('<II', len(js), 0x4E4F534A)); f.write(js); f.write(struct.pack('<II', len(B), 0x004E4942)); f.write(B)
(lat0, lon0), (lat1, lon1) = J['metadata']['extentLatLon']
caja = [((lon0 - LON0) * MX, -(lat0 - LAT0) * MY), ((lon1 - LON0) * MX, -(lat1 - LAT0) * MY)]
json.dump({'fuente': 'IDECA / SDP · visor 3D Bogotá, escena Inem Kennedy (CityEngine 2014)', 'caja_giro': caja, 'huellas_giro': huellas, 'arboles_giro': arboles}, open(os.path.join(OUT, 'inem.json'), 'w'))
print('materiales', len(mats), 'texturas', len(texs), 'GLB %.1f MB' % (os.path.getsize(os.path.join(OUT, 'inem.glb')) / 1e6), 'caja', caja)
