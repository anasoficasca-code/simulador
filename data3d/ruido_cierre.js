/* ============ RUIDO DE LOS CARROS + CIERRE DE VÍA (portado del módulo 08 3D de modelamiento2) ============
   RUIDO: mapa en vivo a partir de la posición real de cada vehículo de la simulación SUMO; cada carro aporta una mancha
   de 55 m que se suma con las vecinas (más carros juntos = más ruido). Se recalcula 4 veces por segundo en un lienzo
   de baja resolución (mancha continua), con la escala de color del módulo 08 (amarillo claro -> rojo).
   CIERRE DE VÍA: se escoge una de las vías críticas (mayor tránsito registrado), se quita de la red y, para los
   vehículos que la usaban, se calcula un desvío real por las calles vecinas (Dijkstra sobre net.json).
   Es ilustrativo: se desvían los MISMOS vehículos grabados, no se re-simula SUMO. */

const STOPS = [[0, [255, 247, 179]], [0.2, [255, 224, 76]], [0.4, [255, 179, 77]], [0.6, [245, 124, 0]], [0.8, [230, 74, 25]], [1, [211, 47, 47]]];
const LUT = new Uint8Array(256 * 3);
for (let i = 0; i < 256; i++) {
  const t = i / 255; let k = 0; while (k < STOPS.length - 2 && t > STOPS[k + 1][0]) k++;
  const [ta, a] = STOPS[k], [tb, b] = STOPS[k + 1], f = (t - ta) / (tb - ta || 1);
  for (let c = 0; c < 3; c++) LUT[i * 3 + c] = Math.round(a[c] + (b[c] - a[c]) * f);
}

export const VIAS_CRITICAS = [
  { e: 9847, n: 'Vía crítica 1 (mayor tránsito registrado)' }, { e: 11268, n: 'Vía crítica 2' }, { e: 8260, n: 'Vía crítica 3' },
  { e: 9919, n: 'Vía crítica 4' }, { e: 10240, n: 'Vía crítica 5' }, { e: 9449, n: 'Vía crítica 6' },
];

export function crearRuidoCierre({ THREE, T3, LC }) {
  const lw = (x, y) => [x - LC.x, LC.y - y];
  const N = T3.net;
  // ---------------- RUIDO ----------------
  const [bx0, by0, bx1, by1] = (() => { let a = 1e9, b = 1e9, c = -1e9, d = -1e9; for (const e of N.edges) for (const p of e[1]) { if (p[0] < a) a = p[0]; if (p[1] < b) b = p[1]; if (p[0] > c) c = p[0]; if (p[1] > d) d = p[1]; } return [a, b, c, d]; })();
  const W = 520, H = Math.round(W * (by1 - by0) / (bx1 - bx0)), sx = W / (bx1 - bx0), sy = H / (by1 - by0);
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d', { willReadFrequently: true });
  const RAD = Math.max(2, 55 * sx), sp = document.createElement('canvas'); sp.width = sp.height = Math.ceil(RAD * 2);
  { const s = sp.getContext('2d'), gr = s.createRadialGradient(RAD, RAD, 0, RAD, RAD, RAD); gr.addColorStop(0, 'rgba(255,255,255,0.075)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); s.fillStyle = gr; s.fillRect(0, 0, sp.width, sp.height); }
  const out = document.createElement('canvas'); out.width = W; out.height = H; const go = out.getContext('2d');
  const tex = new THREE.CanvasTexture(out); tex.colorSpace = THREE.SRGBColorSpace; tex.minFilter = THREE.LinearFilter;
  const [wx0, wz0] = lw(bx0, by1), [wx1, wz1] = lw(bx1, by0);
  const plano = new THREE.Mesh(new THREE.PlaneGeometry(wx1 - wx0, wz1 - wz0).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.85, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6, toneMapped: false }));
  plano.position.set((wx0 + wx1) / 2, 1.4, (wz0 + wz1) / 2); plano.renderOrder = 4; plano.visible = false; plano.name = 'ruido-carros'; T3.scene.add(plano);
  let ultimo = 0;
  function pintarRuido() {
    const TR = T3.TRAF; if (!TR || !TR.vis) return;
    const V = TR.vis; g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, W, H); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < V.n; i++) { const X = V.x[i] + LC.x, Y = LC.y - V.z[i]; g.drawImage(sp, (X - bx0) * sx - RAD, H - (Y - by0) * sy - RAD); }
    const img = g.getImageData(0, 0, W, H), d = img.data;
    for (let p = 0; p < d.length; p += 4) { const v = d[p + 3]; /* el lienzo guarda la suma en el alfa (RGB sale siempre blanco) */ if (v < 3) { d[p + 3] = 0; continue; } const t = Math.min(255, Math.pow(v / 160, 0.8) * 255) | 0; d[p] = LUT[t * 3]; d[p + 1] = LUT[t * 3 + 1]; d[p + 2] = LUT[t * 3 + 2]; d[p + 3] = 70 + (t * 0.55 | 0); }
    go.putImageData(img, 0, 0); tex.needsUpdate = true;
  }
  // ---------------- CIERRE DE VÍA ----------------
  let cerrada = null, desvios = new Map(), marca = null;
  const segDist = (px, py, ax, ay, bx, by) => { const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy; let t = L2 ? ((px - ax) * dx + (py - ay) * dy) / L2 : 0; t = Math.max(0, Math.min(1, t)); return Math.hypot(px - ax - t * dx, py - ay - t * dy); };
  function grafo(ie, R) {
    const P = N.edges[ie][1]; let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const [x, y] of P) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    x0 -= R; x1 += R; y0 -= R; y1 += R;
    const nodos = new Map(), ady = new Map(), SN = 22, clave = (x, y) => Math.round(x / SN) + ',' + Math.round(y / SN);
    const nodo = (x, y) => { const k = clave(x, y); if (!nodos.has(k)) nodos.set(k, { x, y }); return k; };
    const arista = (a, b, d) => { if (a === b) return; (ady.get(a) || ady.set(a, []).get(a)).push([b, d]); (ady.get(b) || ady.set(b, []).get(b)).push([a, d]); };
    N.edges.forEach(([, pts], k) => { if (k === ie) return; for (let i = 0; i < pts.length - 1; i++) { const [ax, ay] = pts[i], [bx, by] = pts[i + 1]; if (!((ax >= x0 && ax <= x1 && ay >= y0 && ay <= y1) || (bx >= x0 && bx <= x1 && by >= y0 && by <= y1))) continue; const d = Math.hypot(bx - ax, by - ay); if (d > 0) arista(nodo(ax, ay), nodo(bx, by), d); } });
    return { nodos, ady };
  }
  const cercano = (G, x, y) => { let m = null, dm = 1e18; G.nodos.forEach((p, k) => { if (!G.ady.has(k)) return; const d = (p.x - x) ** 2 + (p.y - y) ** 2; if (d < dm) { dm = d; m = k; } }); return m; };
  function dijkstra(G, s, t) {
    const dist = new Map([[s, 0]]), prev = new Map(), vis = new Set(), H = [[0, s]];
    const push = (it) => { H.push(it); let i = H.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (H[p][0] <= H[i][0]) break; [H[p], H[i]] = [H[i], H[p]]; i = p; } };
    const pop = () => { const top = H[0], last = H.pop(); if (H.length) { H[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < H.length && H[l][0] < H[m][0]) m = l; if (r < H.length && H[r][0] < H[m][0]) m = r; if (m === i) break; [H[m], H[i]] = [H[i], H[m]]; i = m; } } return top; };
    while (H.length) { const [d, u] = pop(); if (vis.has(u)) continue; vis.add(u); if (u === t) break; for (const [v, w] of G.ady.get(u) || []) { const nd = d + w; if (nd < (dist.has(v) ? dist.get(v) : 1e18)) { dist.set(v, nd); prev.set(v, u); push([nd, v]); } } }
    if (!dist.has(t)) return null; const camino = []; for (let u = t; u; u = prev.get(u)) { camino.push(G.nodos.get(u)); if (u === s) break; } return camino.reverse();
  }
  function calcularDesvios(ie) {
    desvios = new Map(); const TR = T3.TRAF; if (!TR) return 0;
    const P = N.edges[ie][1], cerca = new Map();
    for (const st of TR.steps) { if (!st) continue; for (let i = 0; i < st.ids.length; i++) { const x = st.xs[i], y = st.ys[i]; let dm = 1e9; for (let k = 0; k < P.length - 1; k++) { const d = segDist(x, y, P[k][0], P[k][1], P[k + 1][0], P[k + 1][1]); if (d < dm) dm = d; } if (dm < 14) { const id = st.ids[i]; (cerca.get(id) || cerca.set(id, []).get(id)).push([st.t, x, y]); } } }
    const G = grafo(ie, 900); let n = 0;
    for (const [id, L] of cerca) {
      if (n >= 400) break; L.sort((a, b) => a[0] - b[0]); const A = L[0], B = L[L.length - 1];
      const s = cercano(G, A[1], A[2]), t = cercano(G, B[1], B[2]); if (!s || !t || s === t) continue;
      const cam = dijkstra(G, s, t); if (!cam || cam.length < 2) continue;
      const acum = [0]; for (let i = 1; i < cam.length; i++) acum.push(acum[i - 1] + Math.hypot(cam[i].x - cam[i - 1].x, cam[i].y - cam[i - 1].y));
      desvios.set(id, { t0: A[0], t1: Math.max(B[0], A[0] + 1), cam, acum, L: acum[acum.length - 1] }); n++;
    }
    return n;
  }
  /* posición desviada (mundo) de un vehículo en el tiempo t, o null */
  T3.desvio = (id, t) => {
    if (cerrada == null) return null; const D = desvios.get(id); if (!D || t < D.t0 || t > D.t1) return null;
    const objetivo = (t - D.t0) / (D.t1 - D.t0) * D.L; let i = 1; while (i < D.acum.length - 1 && D.acum[i] < objetivo) i++;
    const a = D.cam[i - 1], b = D.cam[i], seg = D.acum[i] - D.acum[i - 1] || 1, f = Math.max(0, Math.min(1, (objetivo - D.acum[i - 1]) / seg));
    const [x, z] = lw(a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f), [x2, z2] = lw(b.x, b.y); return [x, z, x2 - x, z2 - z];
  };
  function marcar(ie) {
    if (marca) { T3.scene.remove(marca); marca.traverse(o => o.geometry && o.geometry.dispose()); marca = null; }
    if (ie == null) return;
    const pts = N.edges[ie][1].map(p => { const [x, z] = lw(p[0], p[1]); return new THREE.Vector3(x, 1.8, z); });
    marca = new THREE.Group(); marca.name = 'via-cerrada';
    const linea = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), Math.max(8, pts.length * 6), 1.6, 6), new THREE.MeshBasicMaterial({ color: 0xe11d48, transparent: true, opacity: 0.85, toneMapped: false }));
    marca.add(linea);
    const matB = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 }), matR = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.5 });
    for (const p of [pts[0], pts[pts.length - 1]]) { const v = new THREE.Group(); v.position.copy(p).setY(0.6); const b1 = new THREE.Mesh(new THREE.BoxGeometry(7, 1.1, 0.35), matR); b1.position.y = 1.2; const b2 = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.35, 0.37), matB); b2.position.y = 1.2; for (const s of [-3, 3]) { const pa = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.6, 0.2), matB); pa.position.set(s, 0.8, 0); v.add(pa); } v.add(b1, b2); const dir = pts[1].clone().sub(pts[0]); v.rotation.y = Math.atan2(dir.x, dir.z); marca.add(v); }
    T3.scene.add(marca);
  }
  async function cerrar(ie, estado) {
    if (ie == null) { cerrada = null; desvios = new Map(); marcar(null); estado('Sin cierre: el tráfico va por su ruta normal.'); return; }
    if (!T3.TRAF) { estado('La simulación de tráfico aún está cargando; intenta en un momento.'); return; }
    estado('Bajando el tráfico grabado y calculando desvíos…'); { const TR = T3.TRAF; if (TR.pedirTrozo) await Promise.all([...Array(Math.ceil(TR.NS / TR.chunk))].map((_, k) => TR.pedirTrozo(k))); } /* el tráfico se baja por partes: el cierre necesita todo */
    await new Promise(r => setTimeout(r, 30));
    const n = calcularDesvios(ie); cerrada = ie; marcar(ie);
    const vc = VIAS_CRITICAS.find(v => v.e === ie);
    estado(`${vc ? vc.n : 'Vía'}: cerrada. ${n} vehículos desviados por calles vecinas.`);
    const p = N.edges[ie][1][Math.floor(N.edges[ie][1].length / 2)], [x, z] = lw(p[0], p[1]);
    if (T3.orbit) { T3.orbit.target.set(x, 0, z); T3.camera.position.set(x + 260, 300, z + 260); T3.orbit.update(); }
  }
  return {
    ruido: { ver: (on) => { plano.visible = on; if (on) pintarRuido(); }, get visible() { return plano.visible; } },
    update() { if (!plano.visible) return; const t = performance.now(); if (t - ultimo > 250) { ultimo = t; pintarRuido(); } },
    cerrar, get cerrada() { return cerrada; },
  };
}

/* paneles (estilo del simulador) */
export function panelRuido(on) {
  let el = document.getElementById('ruido-panel');
  if (!on) { if (el) el.remove(); return; }
  if (!el) { el = document.createElement('div'); el.id = 'ruido-panel'; document.body.appendChild(el); }
  el.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:96px;z-index:40;background:rgba(17,24,33,.94);border:1px solid rgba(148,163,184,.22);border-radius:10px;padding:8px 12px;color:#e5e7eb;font:11px/1.3 Inter,system-ui,sans-serif;width:min(300px,calc(100vw - 32px))';
  el.innerHTML = '<div style="letter-spacing:.14em;font-size:10px;font-weight:700;color:#94a3b8;margin-bottom:5px">RUIDO DE LOS CARROS · EN VIVO</div><div style="height:8px;border-radius:4px;background:linear-gradient(90deg,#fff7b3,#ffe04c,#ffb34d,#f57c00,#e64a19,#d32f2f)"></div><div style="display:flex;justify-content:space-between;margin-top:3px;color:#94a3b8"><span>bajo</span><span>alto</span></div>';
}
export function panelCierre(api, on) {
  let el = document.getElementById('cierre-panel');
  if (!on) { if (el) el.remove(); return; }
  if (!el) { el = document.createElement('div'); el.id = 'cierre-panel'; document.body.appendChild(el); }
  el.style.cssText = 'position:fixed;right:16px;top:84px;z-index:41;width:min(300px,calc(100vw - 32px));background:rgba(17,24,33,.95);border:1px solid rgba(148,163,184,.22);border-radius:12px;padding:12px 14px;color:#e5e7eb;font:12px/1.4 Inter,system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.35)';
  el.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><div style="letter-spacing:.14em;font-size:10px;font-weight:700;color:#94a3b8">CERRAR UNA VÍA</div><button id="ci-x" style="background:none;border:0;color:#94a3b8;font-size:16px;cursor:pointer">×</button></div>
    <select id="ci-sel" style="width:100%;padding:7px 8px;border-radius:7px;background:#0f172a;color:#e5e7eb;border:1px solid rgba(148,163,184,.3);font:inherit"><option value="">— Ninguna (modelo base) —</option>${VIAS_CRITICAS.map(v => `<option value="${v.e}"${api.cerrada === v.e ? ' selected' : ''}>${v.n}</option>`).join('')}</select>
    <button id="ci-btn" style="width:100%;margin-top:8px;padding:8px;border-radius:7px;border:0;background:#e11d48;color:#fff;font-weight:700;cursor:pointer">Aplicar</button>
    <div id="ci-est" style="margin-top:8px;color:#94a3b8;font-size:11px">Escoge una vía crítica: los vehículos que pasaban por ella se desvían por las calles vecinas (ruta más corta).</div>
    <div style="margin-top:6px;color:#64748b;font-size:10px">Modelo ilustrativo: desvía los mismos vehículos grabados (SUMO), no re-simula.</div>`;
  const est = (s) => { el.querySelector('#ci-est').textContent = s; };
  el.querySelector('#ci-btn').onclick = () => { const v = el.querySelector('#ci-sel').value; api.cerrar(v ? +v : null, est); };
  el.querySelector('#ci-x').onclick = () => { const b = document.getElementById('ci-open'); if (b) b.click(); else el.remove(); };
}
