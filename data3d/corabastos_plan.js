/* ============ ESTRATEGIA E3 · CORABASTOS REDUCIDO (plan de transformación de la central) ============
   Al prender E3 se resalta Corabastos; al tocarlo se abre la explicación 3D:
   - dinámica actual y lo que se quiere cambiar, y la dinámica que propicia la estrategia
   - PROGRAMA: qué bodegas se desmontan (las que están a menos de 120 m del humedal La Vaca) y en qué se convierte el resto
   - transporte: camiones grandes con cita a un patio de transferencia interno; salida en vehículos pequeños; residuos a E4
   - agentes humanos (del Excel de E3), interacciones bióticas que llegan al borde restaurado, sostenibilidad y tren vs. vehículos
   Bodegas y su distancia al humedal: data3d/corabastos.json (tools/corabastos_build.py). Todo son hipótesis de diseño. */

const USOS = {
  quitar: { n: 'Bodegas que se desmontan', c: '#ef4444', d: 'Las más cercanas al humedal La Vaca (a menos de 120 m).', din: 'Se desmontan por fases y su suelo pasa a la franja de restauración del borde del humedal; sus comerciantes se reubican en las bodegas que se conservan o en los nodos barriales.' },
  restaura: { n: 'Franja de restauración del humedal La Vaca', c: '#22c55e', d: 'Donde estaban las bodegas desmontadas, hasta el borde del humedal.', din: 'Vegetación nativa, suelo permeable y un borde sin carga ni basura: llegan más aves de humedal, polinizadores y fauna, y el humedal deja de recibir lixiviados y residuos.' },
  patio: { n: 'Patio de transferencia (consolidación)', c: '#38bdf8', d: 'Bodega del borde norte, junto al acceso.', din: 'Los camiones grandes llegan con cita, descargan adentro y no en la vía; la carga se reparte y se consolida en pedidos por barrio para vehículos pequeños.' },
  livianos: { n: 'Estación de vehículos livianos', c: '#0ea5e9', d: 'Bodega vecina al patio.', din: 'Parqueo y carga de vehículos eléctricos pequeños y triciclos de carga que hacen la última milla hacia tiendas barriales y conjuntos.' },
  frio: { n: 'Cuartos fríos y almacenamiento compartido', c: '#a5f3fc', d: 'Las bodegas más grandes del conjunto.', din: 'Almacenamiento refrigerado compartido y con inventario común: se pierde menos alimento y cada comerciante necesita menos espacio propio.' },
  banco: { n: 'Banco de alimentos y recuperación de excedentes', c: '#fbbf24', d: 'Bodega central.', din: 'Recibe lo que no se vende pero sigue siendo apto, lo clasifica y lo lleva a comedores, colegios y cocinas comunitarias.' },
  organicos: { n: 'Centro de aprovechamiento de orgánicos', c: '#a16207', d: 'Las bodegas más lejanas del humedal.', din: 'Separa y trata los residuos orgánicos; el sustrato va a compost y hongos (E4) y ya no se acumula basura que atrae roedores.' },
  mercado: { n: 'Mercado mayorista reducido', c: '#fb923c', d: 'Las demás bodegas que se conservan.', din: 'Menos volumen y con tope: lo que Kennedy no produce sigue llegando aquí, pero parte del abastecimiento pasa por nodos barriales y huertas.' }
};
const AGENTES = [ // del Excel (E3, roles previos)
  { n: 'Comerciantes mayoristas', c: '#fb923c', cant: 20, a: ['mercado', 'frio'] },
  { n: 'Conductores de camión de entrada', c: '#94a3b8', cant: 8, a: ['patio'] },
  { n: 'Operadores de descarga', c: '#e2e8f0', cant: 10, a: ['patio', 'frio'] },
  { n: 'Planificadores de horarios de carga', c: '#38bdf8', cant: 3, a: ['patio'] },
  { n: 'Comerciantes minoristas', c: '#f472b6', cant: 12, a: ['mercado', 'patio'] },
  { n: 'Operadores de vehículos pequeños', c: '#0ea5e9', cant: 8, a: ['livianos', 'patio'] },
  { n: 'Gestores de alimentos recuperados', c: '#fbbf24', cant: 5, a: ['banco', 'mercado'] },
  { n: 'Gestores de residuos', c: '#a3e635', cant: 6, a: ['organicos', 'mercado'] },
  { n: 'Responsables de control de plagas', c: '#c084fc', cant: 3, a: ['organicos', 'restaura'] },
  { n: 'Inspectores de alimentos', c: '#2dd4bf', cant: 3, a: ['frio', 'banco'] }
];
const BIOTICAS = [
  { n: 'Aves de humedal vuelven al borde restaurado', c: '#6B9080', de: 'humedal', a: 'restaura' },
  { n: 'Polinizadores en la vegetación nativa del borde', c: '#A386A9', de: 'restaura', a: 'restaura' },
  { n: 'Residuos orgánicos → hongos y microorganismos (E4)', c: '#E7C878', de: 'mercado', a: 'organicos' },
  { n: 'Roedores: menos comida disponible con el manejo de residuos', c: '#C96349', de: 'organicos', a: 'mercado' },
  { n: 'Rapaces controlan roedores desde el borde', c: '#D1A996', de: 'restaura', a: 'organicos' }
];
const TEXTO = {
  hoy: 'Hoy Corabastos concentra el abastecimiento mayorista de la ciudad en 41 ha pegadas al humedal La Vaca: los camiones grandes entran a toda hora y descargan o esperan en las vías de Kennedy (trancón), se pierden alimentos y los residuos atraen roedores y presionan el humedal; queremos reducir su tamaño y su volumen sin cortar el abastecimiento, devolverle espacio al humedal y sacar la carga pesada de las calles.',
  propone: 'Corabastos reducido propicia una central más pequeña y ordenada: los camiones grandes llegan con cita fuera de horas pico a un patio de transferencia interno, la carga sale en vehículos pequeños hacia tiendas barriales y conjuntos, los excedentes van a un banco de alimentos, los residuos a compost y hongos, y las bodegas junto a La Vaca se desmontan para restaurar su borde.'
};

export async function iniciarPlanCorabastos({ THREE, T3, lw, OX, OZ, Y0 = 2.0 }) {
  const [C, G, A] = await Promise.all(['data3d/corabastos.json?v=3', 'data3d/giro_sim.json', 'data3d/actores.json?v=3'].map(u => (window.cargarJSON || ((u) => fetch(u).then(r => r.json())))(u).catch(() => null)));
  if (!C) return null;
  const ficha = A && A.doc && A.doc.fichas && A.doc.fichas.E3;
  const W = (p) => lw(p[0], p[1]);
  const sitio = C.poly.map(W);
  const dentro = (P, x, z) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) if ((P[i][1] > z) !== (P[j][1] > z) && x < (P[j][0] - P[i][0]) * (z - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0]) c = !c; return c; };
  const centro = (P) => { let x = 0, z = 0; for (const p of P) { x += p[0]; z += p[1]; } return [x / P.length, z / P.length]; };
  const [scx, scz] = centro(sitio);
  const forma = (P, y) => { const s = new THREE.Shape(P.map(p => new THREE.Vector2(p[0], -p[1]))); const g = new THREE.ShapeGeometry(s); g.rotateX(-Math.PI / 2); g.translate(0, y, 0); return g; };
  const borde = (P, y, col, op = 1) => { const a = []; for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; a.push(p[0], y, p[1], q[0], y, q[1]); } const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(a, 3)); return new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: op, depthWrite: false })); };
  // rectángulo de cada nave en el mundo
  const rect = (n, m = 0) => { const [cx, cz] = W(n.c), e = W([n.c[0] + Math.cos(n.a), n.c[1] + Math.sin(n.a)]), ux = e[0] - cx, uz = e[1] - cz, vx = -uz, vz = ux, L2 = n.L / 2 + m, W2 = n.W / 2 + m; return [[-L2, -W2], [L2, -W2], [L2, W2], [-L2, W2]].map(([u, v]) => [cx + u * ux + v * vx, cz + u * uz + v * vz]); };
  const NAV = C.naves.map((n, i) => ({ ...n, i, R: rect(n), cw: W(n.c), h: n.W > 30 ? 10.5 : 8.5 }));

  /* ---------- asignación del programa ---------- */
  const quitadas = NAV.filter(n => n.dh < 120), kept = NAV.filter(n => !(n.dh < 120)), uso = {};
  const libre = () => kept.filter(n => !uso[n.i]);
  const norte = libre().sort((a, b) => b.c[1] - a.c[1]); uso[norte[0].i] = 'patio'; uso[norte[1].i] = 'livianos';
  libre().sort((a, b) => b.dh - a.dh).slice(0, 2).forEach(n => uso[n.i] = 'organicos');
  libre().sort((a, b) => b.L * b.W - a.L * a.W).slice(0, 3).forEach(n => uso[n.i] = 'frio');
  const med = libre().sort((a, b) => a.dh - b.dh); uso[med[Math.floor(med.length / 2)].i] = 'banco';
  libre().forEach(n => uso[n.i] = 'mercado');
  quitadas.forEach(n => uso[n.i] = 'quitar');

  /* ---------- resaltado ---------- */
  const resalte = new THREE.Group(); resalte.visible = false; T3.scene.add(resalte);
  const mRes = new THREE.MeshBasicMaterial({ color: 0xfb923c, transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide });
  resalte.add(new THREE.Mesh(forma(sitio, Y0 + 0.6), mRes)); for (const dy of [0.7, 5, 12]) resalte.add(borde(sitio, Y0 + dy, 0xfdba74, dy > 1 ? 0.45 : 1));

  /* ---------- plan ---------- */
  const plan = new THREE.Group(); plan.visible = false; T3.scene.add(plan);
  const PUNTO = {}; // uso -> { pts: [centros], polys, y }
  for (const n of NAV) {
    const k = uso[n.i], u = USOS[k], col = new THREE.Color(u.c);
    const s = new THREE.Shape(n.R.map(q => new THREE.Vector2(q[0], -q[1]))), g = new THREE.ExtrudeGeometry(s, { depth: n.h + 3, bevelEnabled: false }); g.rotateX(-Math.PI / 2); g.translate(0, Y0 - 1, 0);
    const quitar = k === 'quitar';
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: quitar ? 0.12 : 0.4, depthWrite: false })); m.renderOrder = 6; plan.add(m);
    const ed = new THREE.LineSegments(new THREE.EdgesGeometry(g, 30), new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: quitar ? 1 : 0.9 })); ed.renderOrder = 7; plan.add(ed);
    const p = PUNTO[k] = PUNTO[k] || { pts: [], polys: [], y: Y0 + n.h + 6, ms: [] }; p.pts.push(n.cw); p.polys.push(n.R); p.ms.push(m);
  }
  // franja de restauración: envolvente de las bodegas desmontadas y del borde cercano del humedal La Vaca
  const vaca = (G && G.humedales || []).find(h => /Vaca/.test(h.n));
  const vacaW = vaca ? vaca.poly.map(p => [p[0] + OX, p[1] + OZ]) : [];
  const env = (pts) => { const P = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], hi = []; for (const p of P) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); } for (const p of P.slice().reverse()) { while (hi.length >= 2 && cr(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop(); hi.push(p); } return lo.slice(0, -1).concat(hi.slice(0, -1)); };
  const cq = quitadas.flatMap(n => rect(n, 6)), cqc = centro(cq);
  const cercaVaca = vacaW.filter(p => Math.hypot(p[0] - cqc[0], p[1] - cqc[1]) < 160);
  const franja = env(cq.concat(cercaVaca));
  if (franja.length >= 3) {
    const m = new THREE.Mesh(forma(franja, Y0 + 0.45), new THREE.MeshBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.42, depthWrite: false, side: THREE.DoubleSide })); m.renderOrder = 5; plan.add(m); plan.add(borde(franja, Y0 + 0.5, 0x86efac));
    PUNTO.restaura = { pts: [centro(franja)], polys: [franja], y: Y0 + 8, ms: [m] };
  }
  const humedalC = vacaW.length ? centro(vacaW) : [scx - 200, scz + 200];
  PUNTO.humedal = { pts: [humedalC], polys: [vacaW], y: Y0 + 4, ms: [] };

  /* ---------- transporte ---------- */
  const cercanoBorde = (x, z) => { let best = null, bd = 1e18; for (let i = 0; i < sitio.length; i++) { const a = sitio[i], b = sitio[(i + 1) % sitio.length], dx = b[0] - a[0], dz = b[1] - a[1], l = dx * dx + dz * dz || 1, f = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / l)), px = a[0] + dx * f, pz = a[1] + dz * f, d = (px - x) ** 2 + (pz - z) ** 2; if (d < bd) { bd = d; best = [px, pz]; } } return best; };
  const afuera = (p, d) => { const dx = p[0] - scx, dz = p[1] - scz, l = Math.hypot(dx, dz) || 1; return [p[0] + dx / l * d, p[1] + dz / l * d]; };
  const pPatio = PUNTO.patio.pts[0], pLiv = PUNTO.livianos.pts[0], pOrg = PUNTO.organicos.pts[0], pMer = centro(PUNTO.mercado.pts);
  const acceso = cercanoBorde(...pPatio), salidaE = cercanoBorde(scx + 600, scz - 200), salidaS = cercanoBorde(scx + 300, scz + 500);
  const FLUJOS = [
    { n: 'Entrada: camiones grandes con cita y fuera de horas pico, directo al patio de transferencia (no descargan en la vía)', c: '#94a3b8', ruta: [afuera(acceso, 150), acceso, pPatio], v: 7, tipo: 'camion', cant: 4 },
    { n: 'Salida: vehículos pequeños y triciclos de carga con pedidos por barrio hacia tiendas barriales (E2) y conjuntos (E7)', c: '#0ea5e9', ruta: [pPatio, pLiv, salidaE, afuera(salidaE, 220)], v: 5, tipo: 'liviano', cant: 8 },
    { n: '', c: '#0ea5e9', ruta: [pPatio, pMer, salidaS, afuera(salidaS, 220)], v: 4, tipo: 'liviano', cant: 6 },
    { n: 'Residuos orgánicos: del mercado al centro de aprovechamiento y de ahí a compost y hongos (E4)', c: '#a16207', ruta: [pMer, pOrg, afuera(cercanoBorde(...pOrg), 180)], v: 3, tipo: 'liviano', cant: 3 },
    { n: 'Excedentes aptos: al banco de alimentos y a comedores y colegios', c: '#fbbf24', ruta: [pMer, PUNTO.banco.pts[0], salidaS, afuera(salidaS, 160)], v: 3.5, tipo: 'liviano', cant: 3 }
  ];
  const linea = (P, y, col, op) => { const a = []; for (let i = 0; i < P.length - 1; i++) a.push(P[i][0], y, P[i][1], P[i + 1][0], y, P[i + 1][1]); const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(a, 3)); const l = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: op, depthWrite: false })); l.renderOrder = 8; return l; };
  const largo = (R) => { const c = [0]; for (let i = 1; i < R.length; i++) c.push(c[i - 1] + Math.hypot(R[i][0] - R[i - 1][0], R[i][1] - R[i - 1][1])); return c; };
  const enRuta = (R, Cc, d) => { const T = Cc[Cc.length - 1]; d = ((d % T) + T) % T; let i = 1; while (i < Cc.length - 1 && Cc[i] < d) i++; const f = (d - Cc[i - 1]) / ((Cc[i] - Cc[i - 1]) || 1); return [R[i - 1][0] + (R[i][0] - R[i - 1][0]) * f, R[i - 1][1] + (R[i][1] - R[i - 1][1]) * f, Math.atan2(R[i][0] - R[i - 1][0], R[i][1] - R[i - 1][1])]; };
  const GEOV = { camion: new THREE.BoxGeometry(2.5, 3.2, 9).translate(0, 1.6, 0), liviano: new THREE.BoxGeometry(1.3, 1.6, 2.6).translate(0, 0.8, 0) };
  const MOV = [];
  for (const f of FLUJOS) { f.C = largo(f.ruta); plan.add(linea(f.ruta, Y0 + 1, f.c, 0.95)); const im = new THREE.InstancedMesh(GEOV[f.tipo], new THREE.MeshBasicMaterial({ color: f.c }), f.cant); im.frustumCulled = false; plan.add(im); MOV.push({ f, im, d: Array.from({ length: f.cant }, (_, i) => i / f.cant * f.C[f.C.length - 1]) }); }

  /* ---------- agentes humanos ---------- */
  const puntoEn = (P) => { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const p of P) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); } for (let k = 0; k < 40; k++) { const x = x0 + Math.random() * (x1 - x0), z = z0 + Math.random() * (z1 - z0); if (dentro(P, x, z)) return [x, z]; } return centro(P); };
  const destino = (k) => { const s = PUNTO[k]; if (!s || !s.polys.length) return [scx, scz]; return puntoEn(s.polys[Math.floor(Math.random() * s.polys.length)]); };
  const HUM = [], figura = new THREE.CapsuleGeometry(0.34, 1.15, 3, 8).translate(0, 0.92, 0);
  for (const t of AGENTES) { const im = new THREE.InstancedMesh(figura, new THREE.MeshLambertMaterial({ color: t.c, emissive: new THREE.Color(t.c).multiplyScalar(0.45) }), t.cant); im.frustumCulled = false; plan.add(im); const L = []; for (let i = 0; i < t.cant; i++) { const p = destino(t.a[i % t.a.length]); L.push({ x: p[0], z: p[1], obj: destino(t.a[Math.floor(Math.random() * t.a.length)]), pausa: Math.random() * 8 }); } HUM.push({ t, im, L }); }

  /* ---------- interacciones bióticas ---------- */
  const ARCOS = [];
  const arco = (a, b, col, alto) => { const N = 28, P = []; for (let i = 0; i <= N; i++) { const u = i / N; P.push(new THREE.Vector3(a[0] + (b[0] - a[0]) * u, Y0 + 6 + Math.sin(Math.PI * u) * alto, a[1] + (b[1] - a[1]) * u)); } const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(P), new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.9, depthWrite: false })); l.renderOrder = 9; plan.add(l); return P; };
  for (const b of BIOTICAS) { const col = new THREE.Color(b.c); for (let i = 0; i < 3; i++) { const a = destino(b.de === 'humedal' ? 'humedal' : b.de), c = destino(b.a); ARCOS.push({ P: arco(a, c, col, 30 + Math.random() * 30), col }); } }
  const NPU = 60, pp = new Float32Array(NPU * 3), pc = new Float32Array(NPU * 3), pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3)); pg.setAttribute('color', new THREE.BufferAttribute(pc, 3));
  const pulsos = new THREE.Points(pg, new THREE.PointsMaterial({ size: 5, sizeAttenuation: false, vertexColors: true, depthWrite: false })); pulsos.frustumCulled = false; plan.add(pulsos);

  /* ---------- etiquetas y panel ---------- */
  const css = document.createElement('style'); css.textContent = `
.cp-et{position:fixed;z-index:9;transform:translate(-50%,-100%);display:flex;align-items:center;gap:6px;padding:4px 9px 4px 4px;border-radius:999px;background:rgba(8,16,26,.88);border:1.5px solid var(--c);color:#e2f3ff;font:600 11px system-ui,-apple-system,"Segoe UI",sans-serif;white-space:nowrap;cursor:pointer}
.cp-et b{display:grid;place-items:center;width:18px;height:18px;border-radius:50%;background:var(--c);color:#04121c;font-size:10px}.cp-et.sel{box-shadow:0 0 0 3px rgba(125,211,252,.45)}
#cp-res{position:fixed;z-index:9;transform:translate(-50%,-100%);padding:6px 12px;border-radius:12px;background:rgba(8,16,26,.9);border:1.5px solid #fb923c;color:#e2f3ff;font:700 12px system-ui,sans-serif;cursor:pointer;white-space:nowrap}
#cp-res small{display:block;font-weight:500;color:#fdba74;font-size:10.5px}
#cp-pan{position:fixed;z-index:20;right:14px;top:14px;bottom:14px;width:min(410px,calc(100vw - 28px));overflow:auto;scrollbar-width:thin;padding:14px 15px;border-radius:16px;background:rgba(8,16,26,.94);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);border:1px solid rgba(253,186,116,.3);color:#e2f3ff;font:12px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif;display:none}
#cp-pan.on{display:block}
#cp-pan .cab{display:flex;align-items:flex-start;gap:10px}#cp-pan .cab span{display:grid;place-items:center;flex:none;width:34px;height:34px;border-radius:9px;background:#fb923c;color:#04121c;font:800 13px system-ui}
#cp-pan h4{margin:0;font-size:16px}#cp-pan .cab em{display:block;font-style:normal;color:#94a3b8;font-size:11px}
#cp-pan .x{margin-left:auto;width:30px;height:30px;border:none;border-radius:8px;background:rgba(255,255,255,.07);color:#cbd5e1;font:700 16px system-ui;cursor:pointer}
#cp-pan .fr{margin:10px 0 0;padding:9px 10px;border-radius:10px;font-size:12px}#cp-pan .fr b{display:block;font-size:9.5px;letter-spacing:.16em;margin-bottom:3px}
#cp-pan .hoy{background:rgba(248,113,113,.1);border:1px solid rgba(248,113,113,.3)}#cp-pan .hoy b{color:#fca5a5}
#cp-pan .pro{background:rgba(52,211,153,.1);border:1px solid rgba(52,211,153,.3)}#cp-pan .pro b{color:#6ee7b7}
#cp-pan .tabs{display:flex;flex-wrap:wrap;gap:4px;margin:12px 0 8px}
#cp-pan .tabs button{height:28px;padding:0 10px;border:none;border-radius:8px;background:rgba(255,255,255,.06);color:#cbd5e1;font:700 10px system-ui,sans-serif;letter-spacing:.05em;cursor:pointer}#cp-pan .tabs button.on{background:#fdba74;color:#04121c}
#cp-pan .it{display:flex;gap:9px;padding:7px 4px;border-bottom:1px solid rgba(255,255,255,.06);cursor:pointer;border-radius:8px}#cp-pan .it:hover,#cp-pan .it.sel{background:rgba(253,186,116,.08)}
#cp-pan .it i{flex:none;width:12px;height:12px;border-radius:3px;margin-top:3px}#cp-pan .it b{font-weight:650}#cp-pan .it small{display:block;color:#94a3b8;font-size:10.5px}#cp-pan .it p{margin:3px 0 0;font-size:11.5px;color:#cbd5e1}
#cp-pan h5{margin:12px 0 4px;font-size:9.5px;letter-spacing:.16em;color:#94a3b8}#cp-pan ul{margin:4px 0;padding-left:16px}#cp-pan li{margin:3px 0;font-size:11.5px;color:#cbd5e1}
#cp-pan .rec{margin:8px 0;padding:9px 10px;border-radius:10px;background:rgba(56,189,248,.08);border:1px solid rgba(56,189,248,.3)}#cp-pan .rec b{color:#7dd3fc}
#cp-pan table{width:100%;border-collapse:collapse;font-size:11px}#cp-pan td,#cp-pan th{padding:5px 4px;border-bottom:1px solid rgba(255,255,255,.07);text-align:left;vertical-align:top}#cp-pan th{color:#94a3b8}
#cp-pan .nota{margin-top:10px;font-size:10px;color:#64748b}
@media(max-width:760px){#cp-pan{top:auto;height:56vh;right:8px;left:8px;width:auto;bottom:calc(max(10px,env(safe-area-inset-bottom)) + 4px)}.cp-et{font-size:10px}}`;
  document.head.appendChild(css);
  const ORDEN = ['quitar', 'restaura', 'patio', 'livianos', 'frio', 'banco', 'organicos', 'mercado'].filter(k => PUNTO[k]);
  const ETQ = ORDEN.map((k, i) => { const d = document.createElement('div'); d.className = 'cp-et'; d.style.setProperty('--c', USOS[k].c); d.innerHTML = `<b>${i + 1}</b>${USOS[k].n}${PUNTO[k].pts.length > 1 ? ` · ${PUNTO[k].pts.length}` : ''}`; d.style.display = 'none'; d.onclick = () => enfocar(k); document.body.appendChild(d); return { d, k }; });
  const res = document.createElement('div'); res.id = 'cp-res'; res.innerHTML = 'E3 · Corabastos reducido<small>Toca para ver cómo se transforma la central</small>'; res.style.display = 'none'; res.onclick = () => abrir(); document.body.appendChild(res);
  const pan = document.createElement('div'); pan.id = 'cp-pan'; document.body.appendChild(pan);
  const it = (c, t, s, p, data) => `<div class="it" ${data || ''}><i style="background:${c}"></i><div><b>${t}</b>${s ? `<small>${s}</small>` : ''}${p ? `<p>${p}</p>` : ''}</div></div>`;
  const TABS = {
    programa: () => ORDEN.map((k, i) => it(USOS[k].c, `${i + 1}. ${USOS[k].n}${PUNTO[k].pts.length > 1 ? ' (' + PUNTO[k].pts.length + ' bodegas)' : ''}`, USOS[k].d, USOS[k].din, `data-k="${k}"`)).join('')
      + `<h5>CÓMO MEJORA EL ALMACENAMIENTO</h5><ul><li>Cuartos fríos compartidos con inventario común: menos pérdida y menos espacio propio por comerciante.</li><li>Lo que no se vende pero sirve va al banco de alimentos antes de volverse residuo.</li><li>Cada bodega que se conserva tiene muelle interno: la mercancía no espera en la calle.</li></ul>`,
    transporte: () => FLUJOS.filter(f => f.n).map(f => it(f.c, f.n, '')).join('')
      + `<h5>¿TREN O VEHÍCULOS PEQUEÑOS?</h5>
      <table><tr><th></th><th>Tren de carga</th><th>Vehículos pequeños + patio interno</th></tr>
      <tr><td>Espacio</td><td>Necesita un corredor férreo propio y terminales; las vías de Kennedy no tienen espacio para uno nuevo.</td><td>Usa las vías que ya existen; el cambio está en descargar adentro y repartir en vehículos más chicos.</td></tr>
      <tr><td>Para qué sirve</td><td>Mover grandes volúmenes en distancias largas (región → ciudad).</td><td>La última milla: de la central a tiendas, conjuntos, comedores y colegios.</td></tr>
      <tr><td>Tiempo y costo</td><td>Muy alto y de largo plazo.</td><td>Bajo y por fases; se puede probar en un piloto.</td></tr>
      <tr><td>Efecto en el trancón</td><td>No quita los camiones del barrio si la distribución sigue igual.</td><td>Quita la descarga en vía y los camiones grandes dentro de los barrios.</td></tr></table>
      <div class="rec"><b>Recomendación (hipótesis):</b> no un tren dentro de Kennedy. Primero el patio de transferencia con agenda de citas y ventanas horarias para los camiones grandes, y la distribución en vehículos pequeños eléctricos y triciclos de carga con pedidos consolidados por barrio. El tren solo tendría sentido para el tramo región → ciudad y por un corredor férreo existente; habría que verificar qué tan lejos queda el corredor férreo del occidente (el del Regiotram).</div>
      <ul><li>A medir en el simulador: camiones grandes por día, tiempo que la carga pasa en la vía, % del volumen que sigue pasando por Corabastos y viajes de vehículos pequeños por barrio.</li></ul>`,
    actores: () => `<h5>AGENTES HUMANOS · figuras de color en la central (roles del Excel de E3)</h5>` + AGENTES.map(a => it(a.c, a.n, 'Va a: ' + a.a.map(k => USOS[k].n.toLowerCase()).join(', '))).join('')
      + (ficha ? `<h5>ACTORES Y NO HUMANOS A DISTINGUIR (documento maestro)</h5><ul><li>${ficha.distinguir}</li></ul>` : ''),
    especies: () => `<h5>INTERACCIONES BIÓTICAS QUE LLEGAN · arcos animados</h5>` + BIOTICAS.map(b => it(b.c, b.n, '')).join('')
      + `<h5>ESPECIES</h5><ul><li>En la central hoy: ratas, torcazas, copetones, chamones y mirlas (también se ven en la capa de relaciones bióticas).</li><li>Con el borde restaurado deberían llegar más aves de humedal (garzas, tinguas, monjitas), polinizadores y rapaces que controlan roedores.</li></ul>`,
    sostener: () => `<h5>CÓMO SE SOSTIENE</h5><ul><li>Tope de volumen y cupos: la central no vuelve a crecer; si hace falta capacidad se abre otro nodo, no se amplía Corabastos.</li><li>Cuotas por espacio en cuartos fríos y en el patio, que financian su mantenimiento.</li><li>Los residuos se vuelven ingreso: sustrato para compost y hongos (E4).</li><li>Acuerdos con comedores, colegios y bancos de alimentos para los excedentes.</li><li>Monitoreo de roedores, de la calidad del agua del humedal y de los camiones por día.</li></ul>
      <h5>RIESGOS</h5><ul><li>${ficha ? ficha.riesgo : 'Reducir flujos exige verificar destinos alternativos y continuidad alimentaria.'}</li><li>Desplazamiento de comerciantes de las bodegas desmontadas: reubicación previa y por fases.</li><li>Que el volumen solo se mueva a otra parte de la ciudad sin bajar los camiones.</li></ul>
      ${ficha ? `<h5>DOCUMENTO MAESTRO</h5><ul><li><b>Mecanismo:</b> ${ficha.mecanismo}</li><li><b>Condiciones que deben comprobarse:</b> ${ficha.condiciones}</li></ul>` : ''}`
  };
  let tab = 'programa', sel = null;
  function pintarPanel() {
    pan.innerHTML = `<div class="cab"><span>E3</span><div><h4>Corabastos reducido</h4><em>Transformación de la central de abastos · ${quitadas.length} de ${NAV.length} medias bodegas se desmontan junto al humedal La Vaca</em></div><button class="x" aria-label="Cerrar">×</button></div>
      <div class="fr hoy"><b>DINÁMICA ACTUAL Y LO QUE QUEREMOS CAMBIAR</b>${TEXTO.hoy}</div>
      <div class="fr pro"><b>DINÁMICA QUE PROPICIA LA ESTRATEGIA</b>${TEXTO.propone}</div>
      <div class="tabs">${[['programa', 'PROGRAMA Y BODEGAS'], ['transporte', 'TRANSPORTE Y TRANCÓN'], ['actores', 'ACTORES'], ['especies', 'ESPECIES'], ['sostener', 'SOSTENIBILIDAD Y RIESGOS']].map(([k, n]) => `<button data-t="${k}" class="${k === tab ? 'on' : ''}">${n}</button>`).join('')}</div>
      <div>${TABS[tab]()}</div><div class="nota">Todo son hipótesis de diseño, no resultados. Las bodegas a desmontar son las que quedan a menos de 120 m del humedal La Vaca.</div>`;
    pan.querySelector('.x').onclick = cerrar;
    pan.querySelectorAll('.tabs button').forEach(b => b.onclick = () => { tab = b.dataset.t; pintarPanel(); });
    pan.querySelectorAll('.it[data-k]').forEach(d => { d.onclick = () => enfocar(d.dataset.k); if (d.dataset.k === sel) d.classList.add('sel'); });
  }
  const corab = () => T3.scene.getObjectByName('corabastos');
  const volar = (cx, cz, dist, alto) => { const t = new THREE.Vector3(cx, Y0, cz), p1 = new THREE.Vector3(cx - dist * 0.55, alto, cz + dist); if (innerWidth > 760) { const dir = t.clone().sub(p1).setY(0).normalize(), der = new THREE.Vector3(-dir.z, 0, dir.x), k = Math.hypot(dist, alto) * 0.24; t.addScaledVector(der, k); p1.addScaledVector(der, k); } else { t.z += dist * 0.25; p1.z += dist * 0.25; } T3.anim = { t: 0, dur: 1.6, p0: T3.camera.position.clone(), p1, c0: T3.orbit.target.clone(), c1: t }; };
  function abrir() { plan.visible = true; res.style.display = 'none'; const c = corab(); if (c && c.userData.quitadas) c.userData.quitadas.visible = false; ['bp-pan', 'ar-pan'].forEach(id => { const e = document.getElementById(id); if (e) e.classList.remove('on'); }); pintarPanel(); pan.classList.add('on'); volar(scx, scz, 560, 470); }
  function cerrar() { plan.visible = false; pan.classList.remove('on'); sel = null; ETQ.forEach(e => e.d.style.display = 'none'); const c = corab(); if (c && c.userData.quitadas) c.userData.quitadas.visible = true; }
  function enfocar(k) { sel = k; tab = 'programa'; if (!plan.visible) abrir(); pintarPanel(); const s = PUNTO[k]; if (s) { const c = centro(s.pts); volar(c[0], c[1], s.pts.length > 3 ? 320 : 200, s.pts.length > 3 ? 240 : 150); } }
  const cvs = T3.renderer.domElement; let pd = null; const ray = new THREE.Raycaster(), v2 = new THREE.Vector2(), plano = new THREE.Plane(new THREE.Vector3(0, 1, 0), -Y0), hit = new THREE.Vector3();
  cvs.addEventListener('pointerdown', e => { pd = [e.clientX, e.clientY]; });
  cvs.addEventListener('pointerup', e => { if (!pd || Math.hypot(e.clientX - pd[0], e.clientY - pd[1]) > 6 || !resalte.visible || plan.visible) return; const r = cvs.getBoundingClientRect(); v2.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(v2, T3.camera); if (ray.ray.intersectPlane(plano, hit) && dentro(sitio, hit.x, hit.z)) abrir(); });

  /* ---------- bucle ---------- */
  const m4 = new THREE.Object3D(), v = new THREE.Vector3(); let ult = performance.now();
  const bucle = () => {
    const ahora = performance.now(), dt = Math.min(0.1, (ahora - ult) / 1000); ult = ahora;
    if (resalte.visible) mRes.opacity = 0.14 + 0.1 * Math.sin(ahora / 400);
    const cam = T3.camera, W_ = innerWidth, H_ = innerHeight;
    const poner = (el, x, y, z) => { v.set(x, y, z).project(cam); const fuera = v.z > 1 || Math.abs(v.x) > 1.05 || Math.abs(v.y) > 1.05; el.style.display = fuera ? 'none' : 'flex'; if (!fuera) { el.style.left = ((v.x + 1) / 2 * W_).toFixed(1) + 'px'; el.style.top = ((1 - v.y) / 2 * H_).toFixed(1) + 'px'; } };
    if (resalte.visible && !plan.visible) poner(res, scx, Y0 + 60, scz); else res.style.display = 'none';
    if (plan.visible) {
      for (const e of ETQ) { const s = PUNTO[e.k], c = centro(s.pts); poner(e.d, c[0], s.y + 8, c[1]); e.d.classList.toggle('sel', sel === e.k); }
      for (const k of ORDEN) for (const m of PUNTO[k].ms) m.material.opacity = sel && sel !== k ? 0.1 : (k === 'quitar' ? 0.12 : 0.4);
      for (const M of MOV) { const f = M.f; for (let i = 0; i < M.d.length; i++) { M.d[i] += f.v * dt * 6; const [x, z, a] = enRuta(f.ruta, f.C, M.d[i]); m4.position.set(x, Y0, z); m4.rotation.set(0, a, 0); m4.scale.setScalar(1.4); m4.updateMatrix(); M.im.setMatrixAt(i, m4.matrix); } M.im.instanceMatrix.needsUpdate = true; }
      for (const h of HUM) { h.L.forEach((a, i) => { if (a.pausa > 0) a.pausa -= dt; else { const dx = a.obj[0] - a.x, dz = a.obj[1] - a.z, d = Math.hypot(dx, dz); if (d < 1) { a.pausa = 3 + Math.random() * 10; a.obj = destino(h.t.a[Math.floor(Math.random() * h.t.a.length)]); } else { const s = Math.min(d, 1.4 * dt * 6); a.x += dx / d * s; a.z += dz / d * s; a.r = Math.atan2(dx, dz); } } m4.position.set(a.x, Y0, a.z); m4.rotation.set(0, a.r || 0, 0); m4.scale.setScalar(2.2); m4.updateMatrix(); h.im.setMatrixAt(i, m4.matrix); }); h.im.instanceMatrix.needsUpdate = true; }
      let n = 0; for (const A2 of ARCOS) for (let j = 0; j < 2 && n < NPU; j++) { const u = ((ahora / 1000) * 0.18 + j * 0.5 + n * 0.071) % 1, P = A2.P[Math.floor(u * (A2.P.length - 1))]; pp[n * 3] = P.x; pp[n * 3 + 1] = P.y; pp[n * 3 + 2] = P.z; pc[n * 3] = A2.col.r; pc[n * 3 + 1] = A2.col.g; pc[n * 3 + 2] = A2.col.b; n++; }
      pg.setDrawRange(0, n); pg.attributes.position.needsUpdate = true; pg.attributes.color.needsUpdate = true;
    }
    requestAnimationFrame(bucle);
  };
  requestAnimationFrame(bucle);
  return { ver: (on) => { resalte.visible = on; if (!on) cerrar(); }, abrir };
}
