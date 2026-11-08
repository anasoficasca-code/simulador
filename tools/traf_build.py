import json, os, struct
import numpy as np
SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data3d', 'kennedy_vehiculos.json')
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data3d', 'traf')
os.makedirs(OUT, exist_ok=True)
raw = json.load(open(SRC))
SCALE, CH = 5, 100
idmap = {}
steps = []
for t, vs in raw:
    a = np.array([[idmap.setdefault(v[0], len(idmap)), round(v[1] * SCALE), round(v[2] * SCALE)] for v in vs], dtype=np.int64).reshape(-1, 3)
    steps.append((t, a[np.argsort(a[:, 0])]))
n = (len(steps) + CH - 1) // CH
total = 0
for k in range(n):
    sub = steps[k * CH:(k + 1) * CH]
    buf = bytearray(b'RTF1') + struct.pack('<Hf', len(sub), sub[0][0])
    prev = {}  # cada trozo empieza con posiciones absolutas (se puede leer solo)
    for t, s in sub:
        ids = s[:, 0]
        px = np.array([prev.get(int(i), (0, 0))[0] for i in ids], dtype=np.int64)
        py = np.array([prev.get(int(i), (0, 0))[1] for i in ids], dtype=np.int64)
        dx = s[:, 1] - px; dy = s[:, 2] - py
        assert np.abs(dx).max(initial=0) < 65536 and np.abs(dy).max(initial=0) < 65536
        did = np.diff(np.concatenate([[0], ids]))
        buf += struct.pack('<H', len(ids))
        buf += did.astype('<u2').tobytes()
        buf += (dx & 0xFFFF).astype('<u2').tobytes()  # int16 en complemento a dos (los absolutos caben en uint16)
        buf += (dy & 0xFFFF).astype('<u2').tobytes()
        prev = {int(i): (int(x), int(y)) for i, x, y in s}
    open(os.path.join(OUT, f'c{k:02d}.bin'), 'wb').write(buf)
    total += len(buf)
maxi = max(len(s) for _, s in steps)
json.dump({'dur': steps[-1][0], 'chunk': CH, 'n': n, 'NS': len(steps), 'NV': len(idmap), 'maxi': maxi, 'scale': SCALE}, open(os.path.join(OUT, 'index.json'), 'w'))
print('trozos', n, 'crudo %.1f MB' % (total / 1e6), 'NV', len(idmap), 'maxi', maxi)

