import json, os, struct, gzip, math
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data3d')
OUT = os.path.join(D, 'edif'); os.makedirs(OUT, exist_ok=True)
X0, Y0, Q = -2000.0, -3000.0, 4  # origen y cuantizaciÃ³n (0,25 m): cabe en uint16 hasta 16 km
CELL = 1000

def encode(B):
    buf = bytearray()
    for b in B:
        p = b['pts']
        if len(p) > 1 and p[0] == p[-1]: p = p[:-1]
        if len(p) < 3: continue
        q = [(round((x - X0) * Q), round((y - Y0) * Q)) for x, y in p]
        assert all(0 <= a < 65536 and 0 <= c < 65536 for a, c in q), q[:2]
        h = max(0, min(65535, round(b['h'] * 10)))
        buf += struct.pack('<HHHH', len(q), h, q[0][0], q[0][1])
        for i in range(1, len(q)):  # vÃ©rtices siguientes: diferencia con el anterior (int16)
            dx, dy = q[i][0] - q[i - 1][0], q[i][1] - q[i - 1][1]
            assert -32768 <= dx < 32768 and -32768 <= dy < 32768
            buf += struct.pack('<hh', dx, dy)
    return bytes(b'REB1') + struct.pack('<I', len(buf)) + bytes(buf)

B = json.load(open(os.path.join(D, 'buildings.json')))
cells = {}
for b in B:
    p = b['pts']
    cx = sum(x for x, _ in p) / len(p); cy = sum(y for _, y in p) / len(p)
    cells.setdefault((math.floor(cx / CELL), math.floor(cy / CELL)), []).append(b)
idx = []; raw = 0; gz = 0
for (i, j), L in sorted(cells.items()):
    data = encode(L)
    name = f'c_{i}_{j}.bin'.replace('-', 'm')
    open(os.path.join(OUT, name), 'wb').write(data)
    raw += len(data); gz += len(gzip.compress(data, 9))
    idx.append({'f': name, 'cx': (i + 0.5) * CELL, 'cy': (j + 0.5) * CELL, 'n': len(L)})
H = json.load(open(os.path.join(D, 'buildings_humedal.json')))
hd = encode(H); open(os.path.join(OUT, 'humedal.bin'), 'wb').write(hd)
json.dump({'X0': X0, 'Y0': Y0, 'Q': Q, 'celdas': idx, 'humedal': {'f': 'humedal.bin', 'n': len(H)}}, open(os.path.join(OUT, 'index.json'), 'w'))
print('edificios', len(B), 'celdas', len(idx), 'crudo %.1f MB' % (raw / 1e6), 'gzip %.1f MB' % (gz / 1e6), '| humedal crudo %.2f MB gzip %.2f MB' % (len(hd) / 1e6, len(gzip.compress(hd, 9)) / 1e6))

