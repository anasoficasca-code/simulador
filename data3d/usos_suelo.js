/* ============ USOS DEL SUELO · edificios pintados por su uso real ============
   Fuente: shapefile Usos_kennedy (50.878 lotes), unido a cada edificio por centroide (repo modelamiento2, módulo 08 3D;
   tools/usos_build.py). Colores: las mismas convenciones del módulo 08. El color lo pone el shader de edificios
   (atributo 'bid' = código de uso + tono propio); aquí: el botón, el panel con el anillo de usos y el histograma de alturas. */
export const USOS = [
  { n: 'Sin uso asignado', c: '#9ea1a6' },
  { n: 'Residencial', c: '#f4d35e' },
  { n: 'Comercio y servicios', c: '#e63946' },
  { n: 'Dotacional', c: '#457b9d' },
  { n: 'Industrial', c: '#7b2d8e' },
  { n: 'Recreacional', c: '#8ac926' },
  { n: 'Parqueadero', c: '#495057' },
  { n: 'Otros', c: '#adb5bd' },
];

export function panelUsos({ T3 }) {
  const st = T3.usosStats || { n: [0, 0, 0, 0, 0, 0, 0, 0], alturas: [] };
  let el = document.getElementById('usos-panel');
  if (!el) {
    el = document.createElement('div'); el.id = 'usos-panel';
    el.style.cssText = 'position:fixed;right:16px;top:84px;width:min(340px,calc(100vw - 32px));max-height:calc(100vh - 200px);overflow:auto;z-index:40;background:rgba(17,24,33,.94);border:1px solid rgba(148,163,184,.22);border-radius:12px;padding:14px 16px;color:#e5e7eb;font:12px/1.4 Inter,system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.35);backdrop-filter:blur(6px)';
    document.body.appendChild(el);
  }
  const tot = st.n.reduce((a, b) => a + b, 0) || 1;
  // anillo
  let a0 = -Math.PI / 2, arcos = '';
  const R = 52, r = 36, cx = 64, cy = 64;
  for (let k = 0; k < USOS.length; k++) {
    const f = st.n[k] / tot; if (f <= 0) continue;
    const a1 = a0 + f * Math.PI * 2 - 0.0001, big = a1 - a0 > Math.PI ? 1 : 0;
    const p = (a, rr) => `${(cx + rr * Math.cos(a)).toFixed(2)} ${(cy + rr * Math.sin(a)).toFixed(2)}`;
    arcos += `<path d="M${p(a0, R)} A${R} ${R} 0 ${big} 1 ${p(a1, R)} L${p(a1, r)} A${r} ${r} 0 ${big} 0 ${p(a0, r)}Z" fill="${USOS[k].c}"/>`;
    a0 = a1;
  }
  const filas = USOS.map((u, k) => u && st.n[k] ? `<div style="display:flex;align-items:center;gap:8px;margin:3px 0"><span style="width:10px;height:10px;border-radius:2px;background:${u.c};flex:none"></span><span style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${u.n}</span><span style="opacity:.75">${st.n[k].toLocaleString('es-CO')}</span><span style="width:42px;text-align:right;color:#7dd3fc">${(100 * st.n[k] / tot).toFixed(1)}%</span></div>` : '').join('');
  // histograma de alturas (m)
  const H = st.alturas, B = 24, maxH = 45, cnt = new Array(B).fill(0);
  for (const h of H) cnt[Math.min(B - 1, Math.floor(h / maxH * B))]++;
  const mx = Math.max(1, ...cnt), W = 288, HH = 90;
  const barras = cnt.map((v, i) => { const bh = v / mx * (HH - 14); return `<rect x="${(i * W / B + 1).toFixed(1)}" y="${(HH - 12 - bh).toFixed(1)}" width="${(W / B - 2).toFixed(1)}" height="${bh.toFixed(1)}" fill="hsl(${330 - i * 4},70%,${55 + i * 0.6}%)" rx="1"/>`; }).join('');
  const ejes = [0, 15, 30, 45].map(v => `<text x="${(v / maxH * W).toFixed(0)}" y="${HH}" fill="#94a3b8" font-size="9" text-anchor="${v ? (v === 45 ? 'end' : 'middle') : 'start'}">${v} m</text>`).join('');
  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <div style="letter-spacing:.14em;font-size:10px;font-weight:700;color:#94a3b8">USOS DEL SUELO · KENNEDY</div>
      <button id="usos-cerrar" style="background:none;border:0;color:#94a3b8;font-size:16px;cursor:pointer;padding:0 2px">×</button>
    </div>
    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
      <svg viewBox="0 0 128 128" width="112" height="112" style="flex:none">${arcos}
        <text x="64" y="60" text-anchor="middle" fill="#94a3b8" font-size="9">edificios</text>
        <text x="64" y="76" text-anchor="middle" fill="#f8fafc" font-size="16" font-weight="700">${(tot / 1000).toFixed(1)}k</text></svg>
      <div style="flex:1;min-width:170px;font-size:11.5px">${filas || '<span style="opacity:.7">Cargando edificios…</span>'}</div>
    </div>
    <div style="letter-spacing:.14em;font-size:10px;font-weight:700;color:#94a3b8;margin:12px 0 4px">ALTURA DE LOS EDIFICIOS</div>
    <svg viewBox="0 0 ${W} ${HH}" width="100%" style="display:block">${barras}${ejes}</svg>
    <div style="display:flex;align-items:center;gap:8px;margin-top:10px;padding-top:8px;border-top:1px solid rgba(255,255,255,.08)"><span style="width:10px;height:10px;border-radius:2px;background:#ff2e93;flex:none"></span><span style="flex:1">Plazas de mercado existentes</span><span style="opacity:.75">IPES · OSM</span></div>
    <div style="margin-top:8px;font-size:10.5px;color:#94a3b8">Fuente: shapefile Usos_kennedy (50.878 lotes reales), unión espacial por centroide. Gris: lote sin uso asignado.</div>`;
  el.querySelector('#usos-cerrar').onclick = () => { const b = document.getElementById('us-btn'); if (b) b.click(); else el.remove(); };
  return el;
}

/* Modelos hechos aparte (no salen del archivo de edificios): se tiñen con el color de su uso, suave, solo las piezas altas (edificio), no pisos, huertas ni árboles */
const MODELOS = [['tintal', 3], ['conjuntos', 1], ['torres', 1], ['bavaria', 4], ['corabastos', 2]];
export function pintarModelos({ THREE, T3, on }) {
  const caja = new THREE.Box3(), vistos = new Set();
  for (const [k, uso] of MODELOS) {
    const g = T3[k]; const obj = g && (g.isObject3D ? g : g.grupo); if (!obj || !obj.traverse) continue;
    const tinte = new THREE.Color(USOS[uso].c);
    obj.traverse(o => {
      if (!o.isMesh || o.isInstancedMesh || o.isPoints || /suelo|arbol|palma|planta|huert/i.test(o.name)) return;
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      caja.copy(o.geometry.boundingBox); if (caja.max.y - caja.min.y < 4 && !/^tintal-/.test(o.name)) return;
      for (const m of [].concat(o.material)) {
        if (!m || !m.color || vistos.has(m)) continue; vistos.add(m);
        if (!m.userData.colOrig) { m.userData.colOrig = m.color.clone(); m.userData.emiOrig = m.emissive ? m.emissive.clone() : null; }
        if (on) { m.color.copy(m.userData.colOrig).lerp(tinte, 0.7); if (m.emissive) m.emissive.copy(tinte).multiplyScalar(m.map || m.vertexColors ? 0.28 : 0.12); }
        else { m.color.copy(m.userData.colOrig); if (m.emissive && m.userData.emiOrig) m.emissive.copy(m.userData.emiOrig); }
      }
    });
  }
}

/* PLAZAS DE MERCADO EXISTENTES (IPES 2024 + OpenStreetMap; tools/plazas_build.py): su edificio en color fuerte encima del modelo
   y una columna de luz con anillo en el suelo, para ubicarlas de lejos. Se ven con "Usos del suelo". */
let PLZ = null;
export async function verPlazas({ THREE, T3, on }) {
  if (!PLZ) {
    const D = await (await fetch('data3d/plazas.json?v=1')).json(), LC = { x: 5341.33, y: 3161.9 }, lw = (x, y) => [x - LC.x, LC.y - y];
    const g = new THREE.Group(); g.name = 'plazas-mercado'; T3.scene.add(g);
    const COL = new THREE.Color('#ff2e93'), mat = new THREE.MeshStandardMaterial({ color: COL, emissive: COL, emissiveIntensity: 0.45, roughness: 0.6 });
    const halo = new THREE.MeshBasicMaterial({ color: COL, transparent: true, opacity: 0.35, depthWrite: false, toneMapped: false, side: THREE.DoubleSide });
    for (const p of D.plazas) {
      for (const h of p.h) {
        const W = h.pts.slice(0, -1).map(q => lw(q[0], q[1]));
        const sh = new THREE.Shape(W.map(q => new THREE.Vector2(q[0], -q[1])));
        const geo = new THREE.ExtrudeGeometry(sh, { depth: Math.max(4, h.h) + 0.4, bevelEnabled: false }).rotateX(-Math.PI / 2);
        const m = new THREE.Mesh(geo, mat); m.scale.set(1.004, 1, 1.004); m.position.y = 0.2; m.castShadow = true; g.add(m);
      }
      const [x, z] = lw(p.p[0], p.p[1]);
      const col = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 70, 12, 1, true).translate(0, 35, 0), halo); col.position.set(x, 0, z); g.add(col);
      const ani = new THREE.Mesh(new THREE.RingGeometry(26, 30, 48).rotateX(-Math.PI / 2), halo); ani.position.set(x, 1.2, z); g.add(ani);
    }
    PLZ = { g, n: D.plazas.length, nIPES: D.plazas.filter(p => p.f === 'IPES').length };
  }
  PLZ.g.visible = on; return PLZ;
}
