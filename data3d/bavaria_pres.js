/* ============ Presentación «Distrito Bavaria Común» (bavaria.html) ============
   Escena 3D en axonometría (cámara ortográfica) que cambia con el relato, más láminas de diagramas en SVG.
   Datos: data3d/bavaria_pres.json (tools/bavaria_pres_datos.py). Cifras externas: ver la lista FUENTES al final. */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const MOVIL = matchMedia('(max-width:760px)').matches;
const QUIETO = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s) => document.querySelector(s);
const fmt = (n, d = 0) => Number(n).toLocaleString('es-CO', { minimumFractionDigits: d, maximumFractionDigits: d });

const D = await fetch('data3d/bavaria_pres.json?v=1').then(r => r.json());
const [CX, CY] = D.centro;
const W = (x, y) => [x - CX, -(y - CY)]; // modelo (x este, y norte) -> three (X, Z)

/* ---------------- cifras del proyecto (todas derivadas de los datos o de supuestos declarados) ---------------- */
const poligonoArea = (p) => { let a = 0; for (let i = 0; i < p.length; i++) { const [x1, y1] = p[i], [x2, y2] = p[(i + 1) % p.length]; a += x1 * y2 - x2 * y1; } return Math.abs(a) / 2; };
const perim = (p) => { let l = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; l += Math.hypot(b[0] - a[0], b[1] - a[1]); } return l; };
// programa: índice del edificio en bavaria.json -> uso propuesto
const PROG = {
  0: { n: 'Invernadero norte', c: '#8fc46a', inv: true },
  2: { n: 'Invernadero central y vivero de nativas', c: '#8fc46a', inv: true },
  3: { n: 'Mercado de proximidad', c: '#e3a64a' },
  4: { n: 'Casa de la federación: asambleas y talleres', c: '#e0664f' },
  5: { n: 'Laboratorio biotecnológico y semillas', c: '#a98bd6' },
  6: { n: 'Silos: banco de semillas y mirador de aves', c: '#5fb3d9' },
  7: { n: 'Cocina y comedor comunitario', c: '#e58aa8' },
  8: { n: 'Cuidados: niñez y personas mayores', c: '#f0c6d6' },
  9: { n: 'Energía: biodigestor y paneles', c: '#e8d26a' },
  11: { n: 'Cooperativa de trabajo', c: '#d98f5a' },
  23: { n: 'Laboratorio de hongos', c: '#d9c7ef' },
  19: { n: 'Taller de bicicargas', c: '#7fb0c9' },
};
const invArea = Object.entries(PROG).filter(([, v]) => v.inv).reduce((s, [i]) => s + poligonoArea(D.edif[i].p), 0);
const S = D.suelo;
const C = {
  inv_m2: Math.round(invArea * 0.6 / 100) * 100,           // 60 % de la planta cultivable bajo cubierta [propuesta]
  rend: { banc: 5, inv: 10, techo: 4 },                      // kg/m²/año [est.]: 3-8 a cielo abierto; bajo cubierta más
  pob: 40320, hogares: Math.round(40320 / 2.9),              // UPZ 113 Bavaria (SDS 2021); 2,9 personas por hogar
  porcion: 0.2 * 365,                                        // 200 g/día de hortalizas por persona
  kgHab: 0.8, organico: 0.51, separa: 0.6, cora: 5, rendCompost: 0.4,
};
C.prod_banc = S.bancales_m2 * C.rend.banc / 1000; C.prod_inv = C.inv_m2 * C.rend.inv / 1000; C.prod_techo = S.techos_m2 * C.rend.techo / 1000;
C.prod = C.prod_banc + C.prod_inv + C.prod_techo;
C.personas = C.prod * 1000 / C.porcion;
C.area_cult = S.bancales_m2 + C.inv_m2 + S.techos_m2;
C.res = C.pob * C.kgHab / 1000; C.org = C.res * C.organico; C.sep = C.org * C.separa; C.comp_in = C.sep + C.cora; C.comp_out = C.comp_in * C.rendCompost;
C.nucleos = Math.round(C.area_cult / 1000);
const V = {
  area_ha: fmt(D.area_ha, 1), edif_n: fmt(D.edif.length), edif_m2: fmt(S.edif_m2), arboles: fmt(S.arboles), arboles_bosque: fmt(S.arboles_bosque),
  perimetro: fmt(perim(D.sitio) / 1000, 1), pasajes_km: fmt(D.pasajes_m / 1000, 1), entradas: fmt(D.entradas.length), bancales: fmt(D.bancales.length),
  bancales_m2: fmt(S.bancales_m2), libre_ha: fmt(S.libre_ha, 1), inv_m2: fmt(C.inv_m2), techos_m2: fmt(S.techos_m2), techos_n: fmt(D.techos.length),
};

/* ---------------- sintaxis: estadísticas locales ---------------- */
const SEG = D.seg;
const distLote = (() => { // distancia de un punto al borde del lote (0 si está adentro)
  const P = D.sitio;
  const dentro = (x, y) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
  return (x, y) => { if (dentro(x, y)) return 0; let m = 1e9; for (let i = 0; i < P.length; i++) { const [ax, ay] = P[i], [bx, by] = P[(i + 1) % P.length]; const dx = bx - ax, dy = by - ay; const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1))); m = Math.min(m, Math.hypot(ax + t * dx - x, ay + t * dy - y)); } return m; };
})();
for (const s of SEG) { let l = 0; for (let i = 1; i < s.p.length; i++) l += Math.hypot(s.p[i][0] - s.p[i - 1][0], s.p[i][1] - s.p[i - 1][1]); s.L = l; const m = s.p[Math.floor(s.p.length / 2)]; s.d = distLote(m[0], m[1]); }
const ordenA = [0, 1, 2].map(k => SEG.filter(s => s.a).map(s => s.a[k]).sort((a, b) => a - b));
const pct = (v, k) => { const A = ordenA[k]; let lo = 0, hi = A.length; while (lo < hi) { const m = (lo + hi) >> 1; if (A[m] <= v) lo = m + 1; else hi = m; } return lo / A.length; };
const med = (a) => { const b = [...a].sort((x, y) => x - y); return b[Math.floor(b.length / 2)]; };
const nuevos = SEG.filter(s => s.n);
const SX = {
  nuevoNain: Math.round(100 * pct(med(nuevos.map(s => s.b[0])), 0)), nuevoNain8: Math.round(100 * pct(med(nuevos.map(s => s.b[1])), 1)),
  nuevoNach: Math.round(100 * pct(med(nuevos.map(s => s.b[2])), 2)), nuevoNachMax: Math.round(100 * pct(Math.max(...nuevos.map(s => s.b[2])), 2)),
};
const cambio = (R, k) => { const sel = SEG.filter(s => s.a && s.d < R); const w = sel.reduce((t, s) => t + s.L, 0); const a = sel.reduce((t, s) => t + s.a[k] * s.L, 0) / w, b = sel.reduce((t, s) => t + s.b[k] * s.L, 0) / w; return { a, b, p: 100 * (b - a) / a, n: sel.length }; };
SX.c300 = [0, 1, 2].map(k => cambio(300, k));
const deltas = SEG.filter(s => s.a).map(s => Math.abs((s.b[1] - s.a[1]) / s.a[1]));
SX.dmax = [...deltas].sort((a, b) => a - b)[Math.floor(deltas.length * 0.99)] || 0.01;
// dónde sube más: distancia media al lote del 5 % de tramos que más suben
{ const top = SEG.filter(s => s.a).map(s => ({ s, d: (s.b[1] - s.a[1]) / s.a[1] })).sort((a, b) => b.d - a.d).slice(0, Math.round(SEG.length * 0.02));
  SX.bajan = 100 * SEG.filter(s => s.a && s.b[1] < s.a[1] * 0.995).length / SEG.length; SX.suben = 100 * SEG.filter(s => s.a && s.b[1] > s.a[1] * 1.005).length / SEG.length;
  SX.topDist = med(top.map(t => t.s.d)); SX.topMax = 100 * top[0].d; }
V.sx_nuevo = SX.nuevoNain; V.sx_nuevo8 = SX.nuevoNain8; V.sx_nach = SX.nuevoNach; V.sx_nachmax = SX.nuevoNachMax;
V.sx_c300 = fmt(SX.c300[0].p, 1); V.sx_c300_8 = fmt(SX.c300[1].p, 1); V.sx_top = fmt(SX.topDist); V.sx_topmax = fmt(SX.topMax, 1); V.sx_suben = fmt(SX.suben, 0); V.sx_bajan = fmt(SX.bajan, 0);
document.querySelectorAll('[data-v]').forEach(e => { const v = V[e.dataset.v]; if (v !== undefined) e.textContent = v; });

/* =============================== ESCENA 3D =============================== */
const host = $('#lienzo');
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, MOVIL ? 1.5 : 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
host.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color('#0b1015');
// cámara de lente larga (casi axonométrica) para que la malla fotorrealista de Google cargue su detalle
const FOV = 20;
const cam = new THREE.PerspectiveCamera(FOV, innerWidth / innerHeight, 10, 60000);
scene.fog = new THREE.Fog('#0b1015', 20000, 40000);
scene.add(new THREE.HemisphereLight(0xdfe9f2, 0x1a1f24, 1.1));
const sol = new THREE.DirectionalLight(0xfff1dc, 2.1); sol.position.set(-600, 900, 400); scene.add(sol);
const sol2 = new THREE.DirectionalLight(0x9fb7d0, 0.6); sol2.position.set(700, 500, -300); scene.add(sol2);

/* ---------------- malla fotorrealista de Google (la misma del simulador) ---------------- */
// Google Photorealistic 3D Tiles: la fábrica, el bosque y los barrios tal como están, con su foto. Encima va solo lo de la propuesta.
const GKEY = 'AIzaSyCF2MXjc0DYRFrHk7j_BCyxVpWOdYqDIC4'; // la misma llave del simulador (index.html)
const MXg = 111320 * Math.cos(4.63 * Math.PI / 180), MYg = 110540;
const aLL = (x, y) => [-74.17 + (x - 5193.24) / MXg, 4.63 + (y - 2090.06) / MYg]; // modelo -> [lng, lat]
const G = { tiles: null, dy: 0, M: null, luz: 1, luzObj: 1, mats: new Set(), ok: null, calib: 0, t: 0, atrib: 0 };
const SIN_G = new URLSearchParams(location.search).get('google') === '0';
const REAL = () => !SIN_G && G.ok !== false; // con la malla: la foto es el mundo y lo propio va encima
const gradoU = { uSat: { value: 1.18 }, uCon: { value: 0.92 }, uBri: { value: 1.18 } };
async function crearGoogle() {
  const [TR, PL] = await Promise.all([import('3d-tiles-renderer'), import('3d-tiles-renderer/plugins')]);
  const { DRACOLoader } = await import('three/addons/loaders/DRACOLoader.js');
  const draco = new DRACOLoader().setDecoderPath('https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/gltf/');
  const tiles = new TR.TilesRenderer();
  tiles.registerPlugin(new PL.GoogleCloudAuthPlugin({ apiToken: GKEY, autoRefreshToken: true }));
  tiles.registerPlugin(new PL.GLTFExtensionsPlugin({ dracoLoader: draco }));
  tiles.setCamera(cam); tiles.setResolutionFromRenderer(cam, renderer);
  tiles.errorTarget = 40; G.meta = MOVIL ? 14 : 5;
  const q = aLL(CX, CY), D2R = Math.PI / 180, frame = new THREE.Matrix4();
  TR.WGS84_ELLIPSOID.getEastNorthUpFrame(q[1] * D2R, q[0] * D2R, frame);
  frame.multiply(new THREE.Matrix4().makeTranslation(0, 0, 2564)); // altura elipsoidal del suelo de Kennedy (medida en el simulador); luego se calibra
  G.M = new THREE.Matrix4().makeRotationX(-Math.PI / 2).multiply(frame.invert());
  tiles.group.matrixAutoUpdate = false; aplicarG(tiles);
  tiles.addEventListener('load-model', ({ scene: s }) => s.traverse(c => {
    const m = c.isMesh && c.material; if (!m || !m.map) return;
    m.map.anisotropy = renderer.capabilities.getMaxAnisotropy();
    if (!m.isMeshBasicMaterial) { m.emissiveMap = m.map; m.emissive.setScalar(G.luz); m.color.setScalar(0); m.roughness = 1; m.metalness = 0; }
    else m.color.setScalar(G.luz);
    m.toneMapped = false;
    m.onBeforeCompile = (sh) => { // gradación tipo maqueta: menos bruma, más saturación (como el simulador)
      Object.assign(sh.uniforms, gradoU);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uSat, uCon, uBri;')
        .replace('#include <opaque_fragment>', `{ vec3 c = max(outgoingLight - vec3(0.030, 0.036, 0.048), 0.0) / 0.96; float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
          c = max(mix(vec3(l), c, uSat), 0.0); c += vec3(0.026, 0.032, 0.046) * (1.0 - smoothstep(0.0, 0.16, l)); outgoingLight = pow(c / 0.18, vec3(uCon)) * 0.18 * uBri; }
          #include <opaque_fragment>`);
    };
    m.customProgramCacheKey = () => 'gradoBavaria'; m.needsUpdate = true;
    G.mats.add(m); c.renderOrder = -10;
  }));
  tiles.addEventListener('dispose-model', ({ scene: s }) => s.traverse(c => { if (c.isMesh) G.mats.delete(c.material); }));
  tiles.addEventListener('load-error', (e) => console.warn('tesela', e && e.error && e.error.message, e && e.url));
  scene.add(tiles.group); G.tiles = tiles; G.ok = true;
}
const aplicarG = (tl = G.tiles) => { tl.group.matrix.makeTranslation(0, G.dy, 0).multiply(G.M); tl.group.matrixWorldNeedsUpdate = true; tl.group.updateMatrixWorld(true); };
// el suelo de la foto se pone en y = 0 midiendo la malla sobre las puertas del predio (cruces de calle): percentil bajo para no medir techos ni copas
function calibrarG() {
  const st = G.tiles.stats; if (st.downloading + st.parsing > 4 || G.tiles.errorTarget > 12) return false;
  const rc = new THREE.Raycaster(), ab = new THREE.Vector3(0, -1, 0), hits = [];
  for (const [x, y] of D.entradas) for (const d of [[0, 0], [12, 0], [-12, 0], [0, 12], [0, -12]]) { const [X, Z] = W(x + d[0], y + d[1]); rc.set(new THREE.Vector3(X, 400, Z), ab); const h = rc.intersectObject(G.tiles.group, true)[0]; if (h && Math.abs(h.point.y) < 60) hits.push(h.point.y); }
  if (hits.length < 12) return false;
  hits.sort((a, b) => a - b); G.dy -= hits[Math.floor(hits.length * 0.25)]; aplicarG(); return true;
}
function actualizarG(dt) {
  const tl = G.tiles; if (!tl) return;
  try {
    tl.setResolutionFromRenderer(cam, renderer); cam.updateMatrixWorld(); tl.update();
    const st = tl.stats; if (tl.errorTarget > G.meta && st.downloading === 0 && st.parsing === 0 && st.visible > 3) tl.errorTarget = Math.max(G.meta, Math.round(tl.errorTarget * 0.62));
    G.t += dt; if (G.calib < 2 && G.t > [3, 12][G.calib]) { if (calibrarG()) G.calib++; else G.t = 0; }
    if (Math.abs(G.luz - G.luzObj) > 0.005) { G.luz += (G.luzObj - G.luz) * Math.min(1, dt * 4); for (const m of G.mats) { if (m.isMeshBasicMaterial) m.color.setScalar(G.luz); else m.emissive.setScalar(G.luz); } }
    if ((G.atrib -= dt) <= 0) { G.atrib = 2; if (location.search.includes('debug')) console.log('malla', JSON.stringify(tl.stats), tl.errorTarget, G.dy.toFixed(1), G.mats.size); const t = tl.getAttributions().filter(a => a.type === 'string').map(a => a.value).join(' · '); const el = document.getElementById('atrib'); if (el) el.textContent = /^google/i.test(t) ? t : 'Google' + (t ? ' · ' + t : ''); }
  } catch (err) { if (!G.fallo) { G.fallo = true; console.warn('malla', err); } }
}
if (!SIN_G) crearGoogle().catch(err => { console.warn('sin malla de Google', err); G.ok = false; setEscena(escena); });

const raiz = new THREE.Group(); scene.add(raiz);
const capas = {}; // grupos que se separan en la axonometría explotada
for (const k of ['suelo', 'red', 'edif', 'bosque', 'flujos']) { capas[k] = new THREE.Group(); capas[k].userData.y = 0; raiz.add(capas[k]); }
const ctxG = new THREE.Group(); raiz.add(ctxG);

// suelo general y lote
const piso = new THREE.Mesh(new THREE.PlaneGeometry(60000, 60000), new THREE.MeshBasicMaterial({ color: '#0e141a' }));
piso.rotation.x = -Math.PI / 2; piso.position.y = -0.3; scene.add(piso);
const forma = (pts) => { const s = new THREE.Shape(); pts.forEach(([x, y], i) => { const X = x - CX, Y = y - CY; i ? s.lineTo(X, Y) : s.moveTo(X, Y); }); return s; };
const loteMat = new THREE.MeshLambertMaterial({ color: '#1d2a22', transparent: true });
const lote = new THREE.Mesh(new THREE.ShapeGeometry(forma(D.sitio)), loteMat); lote.rotation.x = -Math.PI / 2; lote.position.y = 0.05; capas.suelo.add(lote);
// borde del lote (línea) y muro
const bordePts = D.sitio.concat([D.sitio[0]]).map(([x, y]) => { const [X, Z] = W(x, y); return new THREE.Vector3(X, 0.4, Z); });
const bordeMat = new THREE.LineBasicMaterial({ color: '#e3a64a', transparent: true, depthTest: false });
const borde = new THREE.Line(new THREE.BufferGeometry().setFromPoints(bordePts), bordeMat); capas.suelo.add(borde);
const muroGeo = (() => { const g = []; for (let i = 0; i < D.sitio.length; i++) { const a = D.sitio[i], b = D.sitio[(i + 1) % D.sitio.length]; const [ax, az] = W(...a), [bx, bz] = W(...b); const L = Math.hypot(bx - ax, bz - az); if (L < 0.5) continue; const m = new THREE.BoxGeometry(L, 3.2, 0.5); m.rotateY(-Math.atan2(bz - az, bx - ax)); m.translate((ax + bx) / 2, 1.6, (az + bz) / 2); g.push(m); } return mergeGeometries(g); })();
const muroMat = new THREE.MeshLambertMaterial({ color: '#8c7d6c', transparent: true });
const muro = new THREE.Mesh(muroGeo, muroMat); capas.edif.add(muro);

// contexto: huellas extruidas fusionadas, con color por vértice (gris o por sector)
const ENT = D.entradas.map(([x, y]) => [x, y]);
const angC = (x, y) => Math.atan2(y - CY, x - CX);
// sectores: las puertas se agrupan de a dos por ángulo alrededor del predio
const entOrden = ENT.map((p, i) => ({ i, a: angC(...p) })).sort((a, b) => a.a - b.a);
const NSECT = 8; const sectorDeEnt = new Array(ENT.length);
entOrden.forEach((e, k) => { sectorDeEnt[e.i] = Math.floor(k * NSECT / ENT.length); });
const sectAng = Array.from({ length: NSECT }, (_, s) => { const es = entOrden.filter((e, k) => Math.floor(k * NSECT / ENT.length) === s); const x = es.reduce((t, e) => t + Math.cos(e.a), 0), y = es.reduce((t, e) => t + Math.sin(e.a), 0); return Math.atan2(y, x); });
const sectorDe = (x, y) => { const a = angC(x, y); let b = 0, m = 9; sectAng.forEach((s, k) => { const d = Math.abs(Math.atan2(Math.sin(a - s), Math.cos(a - s))); if (d < m) { m = d; b = k; } }); return b; };
const COL_SECT = ['#e3a64a', '#8fc46a', '#5fb3d9', '#e0664f', '#a98bd6', '#e58aa8', '#d9c06a', '#6fc7b4'];
const altCtx = new Map();
const ctxGeo = (() => {
  const gs = []; const gris = new THREE.Color('#5a6670');
  for (const b of D.contexto) {
    const g = new THREE.ExtrudeGeometry(forma(b.p), { depth: Math.max(3, b.h), bevelEnabled: false }); g.rotateX(-Math.PI / 2);
    const n = g.attributes.position.count; const col = new Float32Array(n * 3); const sc = new Float32Array(n * 3);
    const cx = b.p.reduce((t, p) => t + p[0], 0) / b.p.length, cy = b.p.reduce((t, p) => t + p[1], 0) / b.p.length;
    const sc0 = new THREE.Color(COL_SECT[sectorDe(cx, cy)]).lerp(new THREE.Color('#0b1015'), Math.min(0.75, Math.max(0, (Math.hypot(cx - CX, cy - CY) - 500) / 1100)));
    for (let i = 0; i < n; i++) { col.set([gris.r, gris.g, gris.b], i * 3); sc.set([sc0.r, sc0.g, sc0.b], i * 3); }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('csect', new THREE.BufferAttribute(sc, 3)); g.deleteAttribute('uv');
    gs.push(g); altCtx.set(b.p[0][0] + ',' + b.p[0][1], Math.max(3, b.h));
  }
  return mergeGeometries(gs);
})();
const colGris = ctxGeo.attributes.color.array.slice();
const ctxMat = new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true });
const ctxMesh = new THREE.Mesh(ctxGeo, ctxMat); ctxG.add(ctxMesh);
let modoCtx = 'gris';
const pintarCtx = (m) => { if (m === modoCtx) return; modoCtx = m; ctxGeo.attributes.color.array.set(m === 'sector' ? ctxGeo.attributes.csect.array : colGris); ctxGeo.attributes.color.needsUpdate = true; };

// edificios del predio: masas (hoy) y retícula de los esqueletos
const HOY = { esqueleto: '#9b9387', ladrillo: '#8a5a44', blanco: '#b9b3a7', oficina: '#7b8287', silos: '#a3a8ab' };
const edifMeshes = [];
const reticula = new THREE.Group(); capas.edif.add(reticula);
const cubiertas = new THREE.Group(); capas.edif.add(cubiertas);
const dentroPol = (P, x, y) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
D.edif.forEach((e, i) => {
  const pr = PROG[i];
  if (e.s === 'esqueleto') { // columnas y vigas cada 8 m, alineadas al lado más largo
    let best = 0, ang = 0; for (let k = 0; k < e.p.length; k++) { const a = e.p[k], b = e.p[(k + 1) % e.p.length]; const L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L > best) { best = L; ang = Math.atan2(b[1] - a[1], b[0] - a[0]); } }
    const ux = Math.cos(ang), uy = Math.sin(ang); const cx = e.p.reduce((t, p) => t + p[0], 0) / e.p.length, cy = e.p.reduce((t, p) => t + p[1], 0) / e.p.length;
    const cols = []; const vigas = [];
    for (let u = -260; u <= 260; u += 8) for (let v = -260; v <= 260; v += 8) {
      const x = cx + ux * u - uy * v, y = cy + uy * u + ux * v; if (!dentroPol(e.p, x, y)) continue; cols.push([x, y]);
      const x2 = cx + ux * (u + 8) - uy * v, y2 = cy + uy * (u + 8) + ux * v; if (dentroPol(e.p, x2, y2)) vigas.push([x, y, x2, y2]);
    }
    const gc = new THREE.BoxGeometry(0.6, e.h, 0.6); gc.translate(0, e.h / 2, 0);
    const mc = new THREE.InstancedMesh(gc, new THREE.MeshLambertMaterial({ color: '#a59d90', transparent: true }), cols.length);
    const M = new THREE.Matrix4(); cols.forEach(([x, y], k) => { const [X, Z] = W(x, y); M.makeTranslation(X, 0, Z); mc.setMatrixAt(k, M); }); reticula.add(mc);
    const gv = new THREE.BoxGeometry(8, 0.7, 0.45); const mv = new THREE.InstancedMesh(gv, mc.material, vigas.length);
    vigas.forEach(([x, y, x2, y2], k) => { const [X, Z] = W((x + x2) / 2, (y + y2) / 2); M.makeRotationY(-ang); M.setPosition(X, e.h - 0.35, Z); mv.setMatrixAt(k, M); }); reticula.add(mv);
    if (pr && pr.inv) { // cubierta liviana de invernadero
      const g = new THREE.ShapeGeometry(forma(e.p)); const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color: '#d8efe9', transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false }));
      m.rotation.x = -Math.PI / 2; m.position.y = e.h + 0.4; m.userData.base = 0.28; cubiertas.add(m);
      e.ang = ang; e.cx = cx; e.cy = cy;
    }
    e.cols = cols;
    // las naves de esqueleto sin programa de invernadero llevan también una masa liviana (para color de programa)
    if (!(pr && pr.inv)) { const g = new THREE.ExtrudeGeometry(forma(e.p), { depth: e.h * 0.25, bevelEnabled: false }); g.rotateX(-Math.PI / 2); const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color: HOY.esqueleto, transparent: true })); m.userData = { i, hoy: HOY.esqueleto, prog: pr ? pr.c : '#5a6168' }; capas.edif.add(m); edifMeshes.push(m); }
    return;
  }
  const g = new THREE.ExtrudeGeometry(forma(e.p), { depth: e.h + 1.5, bevelEnabled: false }); g.rotateX(-Math.PI / 2); // 1,5 m más: cubre la versión de la foto
  const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color: HOY[e.s] || '#8a5a44', transparent: true }));
  m.userData = { i, hoy: HOY[e.s] || '#8a5a44', prog: pr ? pr.c : '#6b7076' };
  const ed = new THREE.LineSegments(new THREE.EdgesGeometry(g, 30), new THREE.LineBasicMaterial({ color: '#0b1015', transparent: true, opacity: 0.55 })); m.add(ed);
  capas.edif.add(m); edifMeshes.push(m);
});
// tanques elevados
for (const t of D.tanques) { const [X, Z] = W(...t); const g = new THREE.Group(); const c = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 8, 20), new THREE.MeshLambertMaterial({ color: '#d4d6d5', transparent: true })); c.position.y = 30; g.add(c); for (let k = 0; k < 4; k++) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.6, 26, 0.6), c.material); p.position.set(Math.cos(k * Math.PI / 2 + 0.78) * 4, 13, Math.sin(k * Math.PI / 2 + 0.78) * 4); g.add(p); } g.position.set(X, 0, Z); capas.edif.add(g); }

// bancales (suelo libre) y camas dentro de los invernaderos
const angL = D.angulo; const nx = -Math.sin(angL), ny = Math.cos(angL);
const rotBancal = Math.atan2(nx, -ny);
const CULT = ['#7fb85a', '#9ccc65', '#5f9a48', '#b5c95a', '#6fae6b', '#c4a35a', '#8c6bb0', '#d27a5a'];
const bancalGeo = new THREE.BoxGeometry(1.2, 0.5, 8); bancalGeo.translate(0, 1.2, 0); // levantado: el suelo de la foto tiene escombro y relieve
const camas = D.bancales.slice();
const camasInv = [];
D.edif.forEach((e, i) => { if (!(PROG[i] && PROG[i].inv)) return; const ux = Math.cos(e.ang), uy = Math.sin(e.ang); for (let u = -260; u <= 260; u += 2) for (let v = -260; v <= 260; v += 9.5) { const x = e.cx + ux * u - uy * v, y = e.cy + uy * u + ux * v; const ok = [[-0.6, -4], [0.6, -4], [-0.6, 4], [0.6, 4]].every(([a, b]) => dentroPol(e.p, x + ux * a - uy * b, y + uy * a + ux * b)); if (ok && (Math.round(u / 2) % 6 !== 0)) camasInv.push([x, y, e.ang]); } });
const bancales = new THREE.InstancedMesh(bancalGeo, new THREE.MeshLambertMaterial({ color: '#ffffff', transparent: true }), camas.length + camasInv.length);
{ const M = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(1, 1, 1), c = new THREE.Color();
  camas.forEach(([x, y], k) => { const [X, Z] = W(x, y); q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotBancal); M.compose(new THREE.Vector3(X, 0, Z), q, s); bancales.setMatrixAt(k, M); const f = Math.floor(((x - CX) * Math.cos(angL) + (y - CY) * Math.sin(angL)) / 14); bancales.setColorAt(k, c.set(CULT[((f % 8) + 8) % 8])); });
  camasInv.forEach(([x, y, a], k) => { const [X, Z] = W(x, y); q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(-Math.sin(a), -Math.cos(a))); M.compose(new THREE.Vector3(X, 0, Z), q, s); bancales.setMatrixAt(camas.length + k, M); bancales.setColorAt(camas.length + k, c.set(k % 5 ? '#c86a4a' : '#8fc46a')); });
}
capas.suelo.add(bancales);
// zonas: compostaje (antiguo parqueadero) y patio de carga
const rectZ = (x0, y0, x1, y1, col, y = 0.2) => { const m = new THREE.Mesh(new THREE.ShapeGeometry(forma([[x0, y0], [x1, y0], [x1, y1], [x0, y1]])), new THREE.MeshLambertMaterial({ color: col, transparent: true })); m.rotation.x = -Math.PI / 2; m.position.y = y + 1.2; m.renderOrder = 2; return m; };
const COMPOST = [9485, 3005, 9555, 3060];
const compost = new THREE.Group(); compost.add(rectZ(...COMPOST, '#6b4f33'));
{ const g = new THREE.CylinderGeometry(1.4, 2.2, 1.6, 6); g.rotateZ(Math.PI / 2); g.scale(1, 1, 1); for (let r = 0; r < 6; r++) { const m = new THREE.Mesh(new THREE.BoxGeometry(60, 1.6, 2.6), new THREE.MeshLambertMaterial({ color: '#8a6440', transparent: true })); const [X, Z] = W(9520, 3011 + r * 8.5); m.position.set(X, 1, Z); compost.add(m); } }
capas.suelo.add(compost);
const patio = rectZ(9115, 3127.5, 9185, 3172.5, '#3a4a58'); capas.suelo.add(patio);
const ZC = W((COMPOST[0] + COMPOST[2]) / 2, (COMPOST[1] + COMPOST[3]) / 2);

// huertas en cubiertas del barrio
const techosGeo = mergeGeometries(D.techos.map(p => { const g = new THREE.ShapeGeometry(forma(p)); g.rotateX(-Math.PI / 2); g.translate(0, (altCtx.get(p[0][0] + ',' + p[0][1]) || 6) + 0.35, 0); g.deleteAttribute('uv'); return g; }));
const techosMat = new THREE.MeshLambertMaterial({ color: '#8fc46a', transparent: true, opacity: 0 });
const techos = new THREE.Mesh(techosGeo, techosMat); ctxG.add(techos);

// red: sintaxis (tramos existentes) y pasajes nuevos, con líneas de grosor real
const lineMats = [];
const mkLineas = (segs, ancho, y) => {
  const pos = [], idx = [];
  segs.forEach((s, k) => { for (let i = 1; i < s.p.length; i++) { const [ax, az] = W(...s.p[i - 1]), [bx, bz] = W(...s.p[i]); pos.push(ax, y, az, bx, y, bz); idx.push(k); } });
  const g = new LineSegmentsGeometry(); g.setPositions(pos);
  const mat = new LineMaterial({ linewidth: ancho, vertexColors: true, transparent: true, worldUnits: false, depthTest: false }); mat.resolution.set(innerWidth, innerHeight); lineMats.push(mat);
  const l = new LineSegments2(g, mat); l.renderOrder = 6; l.userData = { idx, segs, n: idx.length }; return l;
};
const existentes = SEG.filter(s => s.a);
const red = mkLineas(existentes, MOVIL ? 1.8 : 2.4, 0.9); capas.red.add(red);
const pasajes = mkLineas(nuevos, MOVIL ? 2.6 : 3.4, 1.2); capas.red.add(pasajes);
const RAMPA = ['#2a3fb8', '#2c8fd6', '#38c0b0', '#7fd15a', '#f0d540', '#f08a2e', '#d8262c'];
const rampa = (t) => { t = Math.max(0, Math.min(1, t)) * (RAMPA.length - 1); const i = Math.min(RAMPA.length - 2, Math.floor(t)); return new THREE.Color(RAMPA[i]).lerp(new THREE.Color(RAMPA[i + 1]), t - i); };
const colorear = (l, f) => { const { idx, segs } = l.userData; const c = new Float32Array(idx.length * 6); idx.forEach((k, j) => { const col = f(segs[k]); c.set([col.r, col.g, col.b, col.r, col.g, col.b], j * 6); }); l.geometry.setColors(c); };
let modoRed = null;
const pintarRed = (m) => {
  if (m === modoRed) return; modoRed = m;
  const gris = new THREE.Color('#56636e');
  if (m === 'gris') colorear(red, () => gris);
  else if (m === 'd') { const base = new THREE.Color('#2e3842'); colorear(red, s => { const d = (s.b[1] - s.a[1]) / s.a[1]; if (Math.abs(d) < 0.002) return base; return d > 0 ? new THREE.Color('#6a5228').lerp(new THREE.Color('#ffb340'), Math.min(1, d / SX.dmax)) : new THREE.Color('#2b4a66').lerp(new THREE.Color('#5fb3d9'), Math.min(1, -d / SX.dmax)); }); }
  else { const k = +m[1], de = m[0]; colorear(red, s => rampa(pct(s[de][k], k))); }
  if (m && m[0] === 'b') { const k = +m[1]; colorear(pasajes, s => rampa(pct(s.b[k], k))); } else colorear(pasajes, () => new THREE.Color('#f2efe6'));
};
pintarRed('gris');

// árboles reales (posición y altura de cada copa detectada) con el modelo escaneado island_tree_01 (Poly Haven, CC0)
const arboles = new THREE.Group(); capas.bosque.add(arboles);
const arbMats = [];
(async () => {
  if (new URLSearchParams(location.search).get('arb') === '0') return;
  try {
    const gl = new GLTFLoader(); gl.setMeshoptDecoder(MeshoptDecoder);
    const partes = await Promise.all((MOVIL ? ['island_tree_01_L1_hojas'] : ['island_tree_01_L1_madera', 'island_tree_01_L1_hojas']).map(n => gl.loadAsync(`data3d/models/${n}.glb`)));
    let alto = 0, radio = 0; const geos = [];
    partes.forEach(gf => { gf.scene.updateMatrixWorld(true); gf.scene.traverse(o => { if (o.isMesh) { const g = o.geometry.clone().applyMatrix4(o.matrixWorld); g.computeBoundingBox(); alto = Math.max(alto, g.boundingBox.max.y); radio = Math.max(radio, (g.boundingBox.max.x - g.boundingBox.min.x) / 2, (g.boundingBox.max.z - g.boundingBox.min.z) / 2); geos.push([g, o.material]); } }); });
    const M = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3();
    for (const [g, mat0] of geos) {
      const mat = mat0.clone(); mat.transparent = true; if (mat.map) mat.alphaTest = 0.4; arbMats.push(mat);
      const im = new THREE.InstancedMesh(g, mat, D.arboles.length);
      D.arboles.forEach(([x, y, h, r, densa], k) => { const [X, Z] = W(x, y); const e = h / alto; p.set(X, 0, Z); q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), (k * 2.399) % 6.283); const hr = r / radio; s.set(hr, e, hr); M.compose(p, q, s); im.setMatrixAt(k, M); });
      arboles.add(im);
    }
  } catch (err) { console.warn('árboles', err); }
})();

// flujos: residuos hacia el compostaje, cosecha hacia el mercado y del mercado a las puertas, y Corabastos
const centroEdif = (i) => { const p = D.edif[i].p; return W(p.reduce((t, q) => t + q[0], 0) / p.length, p.reduce((t, q) => t + q[1], 0) / p.length); };
const ZM = centroEdif(3); const ZI = centroEdif(2), ZI2 = centroEdif(0);
const rutas = [];
ENT.forEach(([x, y]) => { const [X, Z] = W(x, y); rutas.push({ a: [X, Z], b: ZC, c: '#b98a57' }); rutas.push({ a: ZM, b: [X, Z], c: '#e3a64a' }); });
rutas.push({ a: ZI, b: ZM, c: '#8fc46a' }, { a: ZI2, b: ZM, c: '#8fc46a' }, { a: ZC, b: ZI, c: '#6b4f33' }, { a: ZC, b: ZI2, c: '#6b4f33' });
const CORA = W(6310, 2150); // Corabastos (centro de corabastos.json)
const corDir = new THREE.Vector2(CORA[0], CORA[1]).normalize().multiplyScalar(1050);
rutas.push({ a: [corDir.x, corDir.y], b: ZC, c: '#b98a57', cora: true });
const NP = MOVIL ? 4 : 6;
const flujoGeo = new THREE.BufferGeometry(); const fpos = new Float32Array(rutas.length * NP * 3), fcol = new Float32Array(rutas.length * NP * 3);
rutas.forEach((r, i) => { const c = new THREE.Color(r.c); for (let k = 0; k < NP; k++) fcol.set([c.r, c.g, c.b], (i * NP + k) * 3); });
flujoGeo.setAttribute('position', new THREE.BufferAttribute(fpos, 3)); flujoGeo.setAttribute('color', new THREE.BufferAttribute(fcol, 3));
const flujoMat = new THREE.PointsMaterial({ size: MOVIL ? 3.5 : 4.5, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0, depthTest: false });
const flujos = new THREE.Points(flujoGeo, flujoMat); flujos.renderOrder = 10; capas.flujos.add(flujos);
const guiaFlujos = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(rutas.flatMap(r => [new THREE.Vector3(r.a[0], 4, r.a[1]), new THREE.Vector3(r.b[0], 4, r.b[1])])), new THREE.LineBasicMaterial({ color: '#e3a64a', transparent: true, opacity: 0 }));
capas.flujos.add(guiaFlujos);

// corredor ecológico: arcos hacia los humedales de Techo y El Burro
const geoLL = (lat, lng) => W((lng + 74.17) * 111320 * Math.cos(4.63 * Math.PI / 180) + 5193.24, (lat - 4.63) * 110540 + 2090.06);
const HUM = [{ n: 'Humedal de Techo', p: geoLL(4.645179, -74.141652) }, { n: 'Humedal El Burro', p: geoLL(4.641417, -74.149576) }, { n: 'Humedal La Vaca', p: geoLL(4.628701, -74.161978) }, { n: 'Corabastos', p: CORA, cora: true }];
const corredor = new THREE.Group(); scene.add(corredor);
fetch('data3d/corabastos.json').then(r => r.json()).then(cb => { const m = new THREE.Mesh(new THREE.ShapeGeometry(forma(cb.poly)), new THREE.MeshBasicMaterial({ color: '#e0664f', transparent: true, opacity: 0 })); m.rotation.x = -Math.PI / 2; m.position.y = 0.5; corrMats.push(m.material); corredor.add(m); }).catch(() => {});
const corrMats = [];
HUM.forEach(h => { const a = new THREE.Vector3(0, 10, 0), b = new THREE.Vector3(h.p[0], 10, h.p[1]); const m = a.clone().lerp(b, 0.5); m.y = a.distanceTo(b) * 0.22; const cur = new THREE.QuadraticBezierCurve3(a, m, b); const mat = new THREE.MeshBasicMaterial({ color: h.cora ? '#e0664f' : '#5fb3d9', transparent: true, opacity: 0 }); corrMats.push(mat); corredor.add(new THREE.Mesh(new THREE.TubeGeometry(cur, 60, MOVIL ? 6 : 4, 6), mat)); const d = new THREE.Mesh(new THREE.CylinderGeometry(70, 70, 2, 40), mat); d.position.set(b.x, 1, b.z); corredor.add(d); h.v = b; });

// guías de la axonometría explotada (verticales en las esquinas del rectángulo del lote)
const esquinas = (() => { const c = Math.cos(angL), s = Math.sin(angL); let mnu = 1e9, mxu = -1e9, mnv = 1e9, mxv = -1e9; D.sitio.forEach(([x, y]) => { const u = (x - CX) * c + (y - CY) * s, v = -(x - CX) * s + (y - CY) * c; mnu = Math.min(mnu, u); mxu = Math.max(mxu, u); mnv = Math.min(mnv, v); mxv = Math.max(mxv, v); }); return [[mnu, mnv], [mxu, mnv], [mxu, mxv], [mnu, mxv]].map(([u, v]) => W(CX + u * c - v * s, CY + u * s + v * c)); })();
const OFF = !SIN_G ? { suelo: 130, red: 260, edif: 390, bosque: 0, flujos: 540 } : { suelo: 0, red: 260, edif: 520, bosque: 800, flujos: 1060 }; // con la malla: la base es el territorio real (suelo y bosque de la foto)
const guiasMat = new THREE.LineDashedMaterial({ color: '#8b9aa7', dashSize: 6, gapSize: 5, transparent: true, opacity: 0 });
const guias = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(esquinas.flatMap(([X, Z]) => [new THREE.Vector3(X, 0, Z), new THREE.Vector3(X, OFF.flujos, Z)])), guiasMat); guias.computeLineDistances(); raiz.add(guias);

/* ---------------- etiquetas HTML proyectadas ---------------- */
const etq = [];
const capaEt = $('#etiquetas');
const addEt = (html, pos, grupos, cls = '', capa = null) => { const d = document.createElement('div'); d.className = 'et ' + cls; d.innerHTML = html; d.style.opacity = 0; capaEt.appendChild(d); etq.push({ d, pos: new THREE.Vector3(...pos), grupos: new Set(grupos), capa }); };
Object.entries(PROG).forEach(([i, p]) => { const [X, Z] = centroEdif(+i); if (MOVIL && ![2, 3, 4, 5, 7, 23].includes(+i)) return; addEt(`<i style="background:${p.c}"></i>${p.n}`, [X, D.edif[i].h + 6, Z], ['prog', 'plan'], '', 'edif'); });
addEt('<i style="background:#6b4f33"></i>Compostaje', [ZC[0], 6, ZC[1]], ['prog', 'flujos', 'suelo'], '', 'suelo');
{ const p = W(9150, 3150); addEt('<i style="background:#3a4a58"></i>Patio de carga', [p[0], 4, p[1]], ['prog'], '', 'suelo'); }
(!SIN_G ? ['Territorio real y bosque (malla de Google)', 'Suelo productivo', 'Pasajes', 'Edificios recuperados', 'Flujos'] : ['Suelo productivo', 'Pasajes', 'Edificios recuperados', 'Bosque', 'Flujos']).forEach((n, k) => { const key = (!SIN_G ? ['bosque', 'suelo', 'red', 'edif', 'flujos'] : ['suelo', 'red', 'edif', 'bosque', 'flujos'])[k]; addEt(`${String(k + 1).padStart(2, '0')} · ${n}`, [0, 0, 0], ['capas'], 'capa', key); });
HUM.forEach(h => addEt(h.n + (h.cora ? '' : ''), [h.v.x, 30, h.v.z], ['corredor', 'kennedy']));
addEt('Predio Bavaria', [0, 40, 0], ['kennedy', 'corredor']);
ENT.forEach(([x, y], k) => { if (k % 2 && MOVIL) return; const [X, Z] = W(x, y); addEt(`P${k + 1}`, [X, 8, Z], ['puertas']); });
sectAng.forEach((a, k) => addEt(`<i style="background:${COL_SECT[k]}"></i>Sector ${k + 1}`, [Math.cos(a) * 820, 30, -Math.sin(a) * 820], ['sectores']));
addEt('Av. Boyacá', (() => { const p = W(8840, 2700); return [p[0] - 40, 10, p[1]]; })(), ['sx']);

/* ---------------- escenas ---------------- */
// cam: s = tamaño visible (m), az = rumbo de la cámara (grados), el = elevación, t = objetivo [X, Z]
const E = {
  portada: { cam: { s: 2300, az: -38, el: 34 }, ctx: 1, edif: 'hoy', muro: 1, arb: 1, giro: 1, red: 0 },
  kennedy: { cam: { s: 5200, az: -30, el: 48, t: [-900, 150] }, ctx: 1, edif: 'hoy', muro: 1, arb: 1, borde: 1, corr: 1, et: 'kennedy', ley: 'kennedy' },
  predio: { cam: { s: 1350, az: -32, el: 36 }, ctx: 1, edif: 'hoy', muro: 1, arb: 1, borde: 1, ley: 'hoy' },
  bosque: { cam: { s: 1150, az: 18, el: 38 }, ctx: 0.6, edif: 'ghost', muro: 1, arb: 1, ley: 'bosque' },
  cerrado: { cam: { s: 1500, az: -60, el: 30 }, ctx: 1, edif: 'hoy', muro: 1, arb: 1, borde: 1, ley: 'cerrado' },
  sx_base: { cam: { s: 3300, az: -18, el: 58 }, ctx: 0.25, edif: 'ghost', muro: 1, red: 'gris', borde: 1, ley: 'sxgris' },
  sx_nain: { cam: { s: 3300, az: -18, el: 58 }, ctx: 0.18, edif: 'ghost', muro: 1, red: 'a0', borde: 1, ley: 'nain', et: 'sx' },
  sx_r800: { cam: { s: 3300, az: -18, el: 58 }, ctx: 0.18, edif: 'ghost', muro: 1, red: 'a1', borde: 1, ley: 'nain8', et: 'sx' },
  sx_nach: { cam: { s: 3300, az: -18, el: 58 }, ctx: 0.18, edif: 'ghost', muro: 1, red: 'a2', borde: 1, ley: 'nach', et: 'sx' },
  sx_desp: { cam: { s: 1700, az: -24, el: 52 }, ctx: 0.25, edif: 'ghost', red: 'gris', pas: 1, borde: 1, ley: 'pasajes', et: 'puertas' },
  sx_desp_nain: { cam: { s: 3300, az: -18, el: 58 }, ctx: 0.18, edif: 'ghost', red: 'b0', pas: 1, borde: 1, ley: 'nain' },
  sx_desp_nach: { cam: { s: 3300, az: -18, el: 58 }, ctx: 0.18, edif: 'ghost', red: 'b2', pas: 1, borde: 1, ley: 'nach' },
  sx_delta: { cam: { s: 2600, az: -18, el: 58 }, ctx: 0.18, edif: 'ghost', red: 'd', pas: 1, borde: 1, ley: 'delta' },
  capas: { luz: 0.5, cam: { s: !SIN_G ? 1350 : 2300, az: -40, el: 30, y: !SIN_G ? 280 : 540 }, ctx: 0, edif: 'prog', arb: 1, pas: 1, banc: 1, inv: 1, expl: 1, flu: 1, et: 'capas', ley: 'capas' },
  capa_suelo: { cam: { s: 1250, az: -40, el: 40 }, ctx: 0.35, edif: 'ghost', arb: 'g', pas: 1, banc: 1, inv: 1, et: 'suelo', ley: 'suelo' },
  capa_inv: { cam: { s: 620, az: -70, el: 34, t: 'inv' }, ctx: 0.35, edif: 'prog', arb: 1, pas: 1, banc: 1, inv: 1, ley: 'inv' },
  capa_techos: { cam: { s: 2300, az: -35, el: 42 }, ctx: 1, edif: 'prog', arb: 1, pas: 1, banc: 1, inv: 1, techos: 1, ley: 'techos' },
  capa_prog: { cam: { s: 1150, az: -32, el: 38 }, ctx: 0.35, edif: 'prog', arb: 'g', pas: 1, banc: 1, inv: 1, et: 'prog', ley: 'prog' },
  capa_bosque: { cam: { s: 1200, az: 25, el: 36 }, ctx: 0.35, edif: 'ghost', arb: 1, pas: 1, banc: 'g', inv: 1, ley: 'bosque' },
  capa_flujos: { cam: { s: 1500, az: -32, el: 46 }, ctx: 0.35, edif: 'prog', arb: 'g', pas: 1, banc: 1, inv: 1, flu: 1, et: 'flujos', ley: 'flujos' },
  plan: { cam: { s: 1700, az: -38, el: 34 }, ctx: 1, edif: 'prog', arb: 1, pas: 1, banc: 1, inv: 1, techos: 1, flu: 1, giro: 1, et: 'plan', ley: 'prog' },
  sectores: { cam: { s: 3000, az: -20, el: 55 }, ctx: 'sector', edif: 'prog', arb: 1, pas: 1, banc: 1, inv: 1, et: 'sectores', ley: 'sectores' },
  corredor: { cam: { s: 5200, az: -30, el: 48, t: [-900, 150] }, ctx: 0.6, edif: 'prog', arb: 1, pas: 1, banc: 1, inv: 1, corr: 1, et: 'corredor', ley: 'corredor' },
  final: { cam: { s: 1900, az: -38, el: 32 }, ctx: 1, edif: 'prog', arb: 1, pas: 1, banc: 1, inv: 1, techos: 1, giro: 1, ley: 'prog' },
};
const invT = (() => { const a = centroEdif(2), b = centroEdif(0); return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; })();

/* ---------------- leyendas ---------------- */
const rampaCSS = `linear-gradient(90deg,${RAMPA.join(',')})`;
const LEY = {
  kennedy: '<div class="t">Kennedy</div><div class="f"><i style="background:#e3a64a"></i>Predio de la antigua fábrica</div><div class="f"><i style="background:#5fb3d9"></i>Humedales cercanos</div><div class="f"><i style="background:#e0664f"></i>Corabastos</div>',
  hoy: '<div class="t">El predio hoy</div><div class="f"><i style="background:#e3a64a"></i>Límite del predio</div><div class="f">Malla fotorrealista de Google: naves, silos, bosque y muro tal como están</div>',
  bosque: `<div class="t">Arbolado</div><div class="f"><i style="background:#4f7a46"></i>${V.arboles} copas detectadas (Esri, z19)</div><div class="f"><i style="background:#2f5a2a"></i>${fmt(S.bosque_ha, 1)} ha de bosque denso</div>`,
  cerrado: '<div class="t">Acceso</div><div class="f"><i style="background:#8c7d6c"></i>Muro: el predio no se puede cruzar</div>',
  sxgris: '<div class="t">Red analizada</div><div class="f"><i style="background:#56636e"></i>Vías OSM a 2,3 km del predio</div>',
  nain: `<div class="t">Integración angular (NAIN)</div><div class="rampa" style="background:${rampaCSS}"></div><div class="ext"><span>segregado</span><span>integrado</span></div>`,
  nain8: `<div class="t">Integración R800 (NAIN)</div><div class="rampa" style="background:${rampaCSS}"></div><div class="ext"><span>segregado</span><span>integrado</span></div>`,
  nach: `<div class="t">Elección angular (NACH)</div><div class="rampa" style="background:${rampaCSS}"></div><div class="ext"><span>poco paso</span><span>mucho paso</span></div>`,
  delta: `<div class="t">Cambio de integración R800</div><div class="rampa" style="background:linear-gradient(90deg,#5fb3d9,#2b4a66,#2e3842,#6a5228,#ffb340)"></div><div class="ext"><span>−${fmt(SX.dmax * 100, 1)} %</span><span>sin cambio</span><span>+${fmt(SX.dmax * 100, 1)} %</span></div>`,
  pasajes: `<div class="t">Pasajes nuevos</div><div class="f"><i style="background:#f2efe6"></i>${V.pasajes_km} km peatonales y en bici</div><div class="f"><i style="background:#e3a64a"></i>${V.entradas} puertas en cruces existentes</div>`,
  capas: !SIN_G ? '<div class="t">Axonometría explotada</div><div class="f">01 territorio real · 02 suelo productivo · 03 pasajes · 04 edificios · 05 flujos</div>' : '<div class="t">Axonometría explotada</div><div class="f">01 suelo · 02 pasajes · 03 edificios · 04 bosque · 05 flujos</div>',
  suelo: `<div class="t">Suelo productivo</div><div class="f"><i style="background:#8fc46a"></i>${V.bancales} bancales de 1,2 × 8 m</div><div class="f"><i style="background:#6b4f33"></i>Compostaje (antiguo parqueadero)</div><div class="f"><i style="background:#3a4a58"></i>Patio de carga</div>`,
  inv: '<div class="t">Invernaderos</div><div class="f"><i style="background:#d8efe9"></i>Cubierta liviana sobre la retícula</div><div class="f"><i style="background:#c86a4a"></i>Camas de tomate y pimentón</div><div class="f"><i style="background:#8fc46a"></i>Vivero de nativas</div>',
  techos: `<div class="t">Red de huertas</div><div class="f"><i style="background:#8fc46a"></i>${V.techos_n} cubiertas productivas</div><div class="f"><i style="background:#7fb85a"></i>Bancales del predio</div>`,
  prog: '<div class="t">Programa</div>' + [...new Map(Object.values(PROG).map(p => [p.n, p.c]))].map(([n, c]) => `<div class="f"><i style="background:${c}"></i>${n}</div>`).join(''),
  flujos: '<div class="t">Flujos</div><div class="f"><i style="background:#b98a57"></i>Residuos orgánicos al compostaje</div><div class="f"><i style="background:#8fc46a"></i>Cosecha al mercado</div><div class="f"><i style="background:#e3a64a"></i>Del mercado a las puertas</div>',
  sectores: '<div class="t">Federación</div>' + COL_SECT.map((c, k) => `<div class="f"><i style="background:${c}"></i>Sector ${k + 1} · puertas ${ENT.map((_, i) => i).filter(i => sectorDeEnt[i] === k).map(i => 'P' + (i + 1)).join(', ')}</div>`).join(''),
  corredor: '<div class="t">Conexiones</div><div class="f"><i style="background:#5fb3d9"></i>Corredor hacia los humedales</div><div class="f"><i style="background:#e0664f"></i>Corabastos (residuos y trabajo)</div>',
};
if (MOVIL) for (const k of ['prog', 'sectores']) LEY[k] = LEY[k].replace(/<div class="f">.*$/s, '<div class="f">Ver etiquetas en el modelo</div>');

/* ---------------- estado animado ---------------- */
const est = { ctx: 1, edif: 1, prog: 0, muro: 1, arb: 1, red: 0, pas: 0, banc: 0, inv: 0, techos: 0, flu: 0, expl: 0, corr: 0, borde: 0 };
const obj = { ...est };
let escena = 'portada', camObj = null, giroAz = 0;
const camAct = { s: 2300, az: -38, el: 34, x: 0, z: 0, y: 0 };
const setEscena = (k) => {
  const e = E[k]; if (!e) return; escena = k;
  obj.ctx = typeof e.ctx === 'number' ? e.ctx : 1; pintarCtx(e.ctx === 'sector' ? 'sector' : 'gris');
  obj.edif = e.edif === 'ghost' ? 0.25 : 1; obj.prog = e.edif === 'prog' ? 1 : 0; obj.muro = e.muro ? 1 : 0;
  obj.arb = e.arb === 1 ? 1 : e.arb === 'g' ? 0.3 : 0; obj.red = e.red ? 1 : 0; obj.pas = e.pas ? 1 : 0;
  obj.banc = e.banc === 1 ? 1 : e.banc === 'g' ? 0.35 : 0; obj.inv = e.inv ? 1 : 0; obj.techos = e.techos ? 1 : 0; obj.flu = e.flu ? 1 : 0; obj.expl = e.expl ? 1 : 0; obj.corr = e.corr ? 1 : 0; obj.borde = e.borde ? 1 : 0;
  if (REAL()) { // la foto ya muestra la fábrica, el bosque, el muro y los barrios: de lo propio queda solo lo nuevo
    obj.ctx = e.ctx === 'sector' ? 0.6 : 0; obj.edif = e.edif === 'prog' ? 1 : 0; obj.prog = 1; obj.muro = 0; obj.arb = 0; // los árboles son los de la foto
    G.luzObj = e.luz ?? (e.red ? 0.38 : e.ctx === 'sector' ? 0.75 : 1);
  }
  if (e.red) pintarRed(e.red); else pintarRed(e.pas ? 'gris' : modoRed);
  const t = e.cam.t === 'inv' ? invT : (e.cam.t || [0, 0]);
  camObj = { s: e.cam.s * (MOVIL ? 1.15 : 1), az: e.cam.az, el: e.cam.el, x: t[0], z: t[1], y: e.cam.y || 0 };
  giroAz = 0;
  $('#leyenda').innerHTML = LEY[e.ley] || '';
};
const lerp = (a, b, f) => a + (b - a) * f;

/* ---------------- cámara ---------------- */
const controles = new OrbitControls(cam, renderer.domElement); controles.enabled = false; controles.enableDamping = true; controles.zoomToCursor = true;
let explorar = false, giro = !QUIETO;
const distCam = (s) => { const asp = innerWidth / innerHeight; const vh = asp >= 1 ? s : s / asp; return vh / 2 / Math.tan(FOV / 2 * Math.PI / 180); };
const ajustarCam = () => {
  const w = innerWidth, h = innerHeight;
  // dónde cae el objetivo en pantalla: a la derecha en escritorio (hay texto a la izquierda), arriba en celular
  const fx = explorar ? 0.5 : MOVIL ? 0.5 : (w > 1000 ? 0.62 : 0.55), fy = explorar ? 0.5 : MOVIL ? 0.36 : 0.5;
  cam.aspect = w / h; cam.setViewOffset(w, h, w / 2 - fx * w, h / 2 - fy * h, w, h);
  const R = cam.position.distanceTo(controles.target); cam.near = Math.max(5, R * 0.08); cam.far = R * 4 + 4000; cam.updateProjectionMatrix();
};
const ponerCam = () => {
  const az = (camAct.az + giroAz) * Math.PI / 180, el = camAct.el * Math.PI / 180, R = distCam(camAct.s);
  const t = new THREE.Vector3(camAct.x, camAct.y, camAct.z);
  cam.position.set(t.x + R * Math.cos(el) * Math.sin(az), t.y + R * Math.sin(el), t.z + R * Math.cos(el) * Math.cos(az)); cam.lookAt(t); controles.target.copy(t);
  ajustarCam();
};
addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); lineMats.forEach(m => m.resolution.set(innerWidth, innerHeight)); if (!explorar) ajustarCam(); });

$('#b-giro').setAttribute('aria-pressed', String(giro));
$('#b-giro').onclick = (ev) => { giro = !giro; ev.currentTarget.setAttribute('aria-pressed', String(giro)); };
$('#b-explorar').onclick = (ev) => {
  explorar = !explorar; ev.currentTarget.setAttribute('aria-pressed', String(explorar)); document.body.classList.toggle('explorar', explorar);
  controles.enabled = explorar; ev.currentTarget.textContent = explorar ? 'Volver al relato' : 'Explorar el 3D';
};

/* ---------------- bucle ---------------- */
const reloj = new THREE.Clock(); const tmp = new THREE.Vector3();
const opac = (mat, v) => { mat.opacity = v; mat.visible = v > 0.01; mat.depthWrite = v > 0.95; };
function cuadro() {
  const dt = Math.min(0.05, reloj.getDelta()), t = reloj.elapsedTime; const f = 1 - Math.pow(0.0025, dt);
  for (const k in est) est[k] = lerp(est[k], obj[k], f);
  if (!explorar && camObj) { for (const k of ['s', 'el', 'x', 'z', 'y']) camAct[k] = lerp(camAct[k], camObj[k], f); let d = camObj.az - camAct.az; camAct.az += d * f; if (giro && E[escena].giro) giroAz += dt * 2.2; else giroAz = lerp(giroAz, 0, f); ponerCam(); }
  if (explorar) controles.update();
  // opacidades
  opac(ctxMat, est.ctx * 0.95); ctxG.visible = est.ctx > 0.01 || est.techos > 0.01;
  opac(techosMat, est.techos);
  edifMeshes.forEach(m => { m.material.color.set(m.userData.hoy).lerp(new THREE.Color(m.userData.prog), est.prog); opac(m.material, est.edif); });
  reticula.children.forEach(m => opac(m.material, REAL() ? est.inv * est.edif : est.edif));
  if (REAL()) { opac(loteMat, 0); lote.visible = false; piso.position.y = -120; } else { lote.visible = true; piso.position.y = -0.3; }
  actualizarG(dt); if (explorar) ajustarCam();
  cubiertas.children.forEach(m => { m.material.opacity = m.userData.base * est.inv; m.visible = est.inv > 0.02; });
  opac(muroMat, est.muro * est.edif);
  arbMats.forEach(m => opac(m, est.arb)); arboles.visible = est.arb > 0.02;
  red.material.opacity = est.red; red.visible = est.red > 0.02; pasajes.material.opacity = est.pas; pasajes.visible = est.pas > 0.02;
  opac(bancales.material, est.banc); compost.children.forEach(m => opac(m.material, est.banc)); opac(patio.material, est.banc);
  bordeMat.opacity = 0.35 + 0.65 * est.borde * (0.6 + 0.4 * Math.sin(t * 2.5));
  loteMat.color.set('#1d2a22').lerp(new THREE.Color('#22301f'), est.banc);
  if (REAL()) { techosMat.depthTest = false; techos.renderOrder = 3; bancales.material.depthTest = false; bancales.renderOrder = 2; compost.children.forEach(m => { m.material.depthTest = false; m.renderOrder = 2; }); patio.material.depthTest = false; }
  flujoMat.opacity = est.flu; guiaFlujos.material.opacity = est.flu * 0.18;
  if (est.flu > 0.02) { rutas.forEach((r, i) => { for (let k = 0; k < NP; k++) { const u = ((t * (r.cora ? 0.05 : 0.11) + k / NP + i * 0.37) % 1); fpos.set([lerp(r.a[0], r.b[0], u), 5 + Math.sin(u * Math.PI) * 18, lerp(r.a[1], r.b[1], u)], (i * NP + k) * 3); } }); flujoGeo.attributes.position.needsUpdate = true; }
  corrMats.forEach(m => { m.opacity = est.corr * 0.75; m.visible = est.corr > 0.02; });
  guiasMat.opacity = est.expl * 0.5; guias.visible = est.expl > 0.02;
  for (const k in capas) capas[k].position.y = OFF[k] * est.expl;
  // etiquetas
  const w = innerWidth, h = innerHeight; const grupo = E[escena].et; const vis = [];
  for (const e of etq) {
    const on = !explorar && grupo && e.grupos.has(grupo);
    if (!on) { if (e.d.style.opacity !== '0') e.d.style.opacity = 0; continue; }
    tmp.copy(e.pos); if (e.capa) tmp.y += capas[e.capa].position.y + (e.d.classList.contains('capa') ? 0 : 0);
    tmp.project(cam); let x = (tmp.x + 1) / 2 * w; const y = (1 - tmp.y) / 2 * h;
    if (e.d.classList.contains('capa')) x += MOVIL ? 90 : 230; e.sx = x; e.sy = y; e.vis = x > 0 && x < w && y > 0 && y < h; vis.push(e);
  }
  vis.sort((a, b) => a.sy - b.sy); const puestos = [];
  for (const e of vis) { const ww = e.d.offsetWidth || 120; let y = e.sy; for (const p of puestos) if (Math.abs(p.x - e.sx) < (p.w + ww) / 2 + 4 && Math.abs(p.y - y) < 21) y = p.y + 21; puestos.push({ x: e.sx, y, w: ww }); e.d.style.left = e.sx + 'px'; e.d.style.top = y + 'px'; e.d.style.opacity = e.vis ? 1 : 0; }
  if (!window.__sin3d) renderer.render(scene, cam);
  requestAnimationFrame(cuadro);
}
const solo = new URLSearchParams(location.search).get('solo');
if (solo) { document.querySelectorAll('.cap').forEach(e => { e.style.display = 'none'; }); if (solo !== 'laminas') document.querySelectorAll('.lamina').forEach(e => { if (!solo.split(',').includes(e.id)) e.style.display = 'none'; }); host.remove(); $('#hud').style.display = 'none'; $('#carga').style.display = 'none'; window.__sin3d = true; }
const forzada = new URLSearchParams(location.search).get('escena'); // ?escena=clave: vista fija para capturas
setEscena(forzada && E[forzada] ? forzada : 'portada'); Object.assign(camAct, camObj); for (const k in est) est[k] = obj[k]; ponerCam();
if (forzada) { document.querySelector('main').style.display = 'none'; window.__fija = true; }
requestAnimationFrame(cuadro);

// relato: el paso más cercano al centro de la pantalla manda
const pasos = [...document.querySelectorAll('[data-escena]')];
const io = new IntersectionObserver((ents) => { for (const en of ents) if (en.isIntersecting) setEscena(en.target.dataset.escena); }, { rootMargin: '-45% 0px -45% 0px' });
pasos.forEach(p => io.observe(p));
if (forzada) $('#carga').remove(); else setTimeout(() => $('#carga').classList.add('fuera'), 300);

/* =============================== LÁMINAS (SVG) =============================== */
const NS = 'http://www.w3.org/2000/svg';
const sv = (tag, at = {}, hijos = []) => { const e = document.createElementNS(NS, tag); for (const k in at) e.setAttribute(k, at[k]); (Array.isArray(hijos) ? hijos : [hijos]).forEach(h => h != null && e.append(h)); return e; };
const txt = (x, y, s, at = {}) => sv('text', { x, y, fill: '#c9d3da', 'font-size': 12, 'font-family': 'Space Grotesk, sans-serif', ...at }, s);
const mono = (x, y, s, at = {}) => txt(x, y, s, { 'font-family': 'JetBrains Mono, monospace', 'font-size': 10.5, fill: '#8b9aa7', ...at });
const lienzo = (id, w, h) => { const s = sv('svg', { viewBox: `0 0 ${w} ${h}`, role: 'img' }); const c = $(id); c.append(s); if (w >= 900) { s.classList.add('ancho'); c.classList.add('desliza'); } return s; };
const datos = (id, L) => { $(id).innerHTML = L.map(([b, l, f, m]) => `<div class="dato"><b>${b}</b><div class="l">${l}${m ? ` <span class="sup${m === 'propuesta' ? ' p' : ''}">${m}</span>` : ''}</div><div class="f">${f}</div></div>`).join(''); };
const wrap = (s, n) => { const w = s.split(' '); const L = []; let c = ''; for (const p of w) { if ((c + ' ' + p).trim().length > n) { L.push(c.trim()); c = p; } else c += ' ' + p; } if (c.trim()) L.push(c.trim()); return L; };
const multi = (x, y, s, n, at = {}, lh = 14) => { const g = sv('g'); wrap(s, n).forEach((l, i) => g.append(txt(x, y + i * lh, l, at))); return g; };

// ---- Lámina 1: Kennedy
datos('#kennedy-datos', [
  ['1.037.929', 'habitantes en Kennedy (2024), el 12,9 % de Bogotá', 'ASIS Kennedy 2024 · proyección DANE-CNPV 2018'],
  ['26.933', 'habitantes por km², en 38,6 km²', 'ASIS Kennedy 2024'],
  ['40.320', 'personas en la UPZ 113 Bavaria, en 2,8 km²', 'SDS · ACCVSyE Kennedy 2021'],
  ['6,6 m²', 'de espacio público verde por habitante (puesto 14 de 20)', 'SDS · ACCVSyE Kennedy 2021'],
  ['0,14', 'árboles por habitante: 141.421 árboles, el 38 % de lo que sugiere la OMS', 'ASIS Kennedy 2024 · cálculo propio'],
  ['31,6 %', 'de los hogares se considera pobre', 'Encuesta Multipropósito 2021'],
  ['2,9', 'personas por hogar; 362.387 hogares', 'SDS · ACCVSyE Kennedy 2021'],
  ['203', 'juntas de acción comunal activas', 'IDPAC, infografía Kennedy 2023'],
]);
{ const s = lienzo('#g-epv', 520, 230); const L = [['UPZ Corabastos', 2.78], ['UPZ Kennedy Central', 3.08], ['UPZ Carvajal', 3.44], ['Kennedy (localidad)', 6.6]]; const X0 = 170, esc = 330 / 16;
  L.forEach(([n, v], i) => { const y = 20 + i * 44; s.append(txt(0, y + 16, n), sv('rect', { x: X0, y, width: v * esc, height: 22, fill: i === 3 ? '#e3a64a' : '#5a6670', rx: 2 }), mono(X0 + v * esc + 8, y + 15, fmt(v, 2) + ' m²', { fill: '#e6ecf0' })); });
  const xm = X0 + 15 * esc; s.append(sv('line', { x1: xm, x2: xm, y1: 8, y2: 196, stroke: '#8fc46a', 'stroke-dasharray': '4 4' }), mono(xm - 4, 214, 'meta EPE 15 m²', { 'text-anchor': 'end', fill: '#8fc46a' })); }
{ const s = lienzo('#g-estrato', 520, 150); const L = [['1', 1.6, '#3a4550'], ['2', 53.9, '#e3a64a'], ['3', 42.1, '#b98a57'], ['4', 2.4, '#5a6670']]; let x = 0; const W0 = 520;
  L.forEach(([n, v, c]) => { const w = v / 100 * W0; s.append(sv('rect', { x, y: 30, width: w - 1, height: 46, fill: c })); if (v > 10) s.append(txt(x + 8, 58, `Estrato ${n}`, { fill: '#111', 'font-weight': 600 }), mono(x + 8, 96, fmt(v, 1) + ' %', { fill: '#e6ecf0', 'font-size': 13 })); x += w; });
  s.append(mono(0, 130, 'Estratos 1 y 4: 1,6 % y 2,4 %. El 96 % vive en estratos 2 y 3.')); }

// ---- Lámina 2: línea de tiempo del colectivo
{ const ev = [
    ['2010', 'Cierra la fábrica; la producción se traslada a Tocancipá.'],
    ['2017', 'Decreto 364: plan parcial con unas 12.300 viviendas. Empiezan las talas y las marchas «¡Bosque sí, cemento no!». Vecinos de Bavaria, Aloha, Marsella y San José de Bavaria presentan una acción popular.'],
    ['2019', 'Un juez administrativo suspende la tala. El colectivo vecinal propone sembrar 50.000 árboles nativos y crear una reserva forestal.'],
    ['2020', 'El Colectivo Salvemos el Bosque Bavaria radica la propuesta de un campus de la Universidad Distrital. Marcha y bloqueo de la Av. Boyacá (5 de octubre).'],
    ['2021', 'El inventario oficial sube de 9.737 árboles (2018) a 22.870.'],
    ['2023', 'Decreto 448: el bosque se reconoce como bosque urbano, se conservan más de 14.000 árboles y entran 21 propuestas ciudadanas. Intropica publica 80 especies de aves en el bosque y el humedal Madre de Agua.'],
    ['2026', 'Distrito Bavaria Común: el colectivo como semilla de una federación de asambleas.'],
  ];
  const ancho = MOVIL ? 360 : 1100; const s = lienzo('#g-linea', ancho, MOVIL ? ev.length * 92 + 20 : 300);
  if (!MOVIL) { const x0 = 40, x1 = ancho - 40; s.append(sv('line', { x1: x0, x2: x1, y1: 60, y2: 60, stroke: '#3a4550', 'stroke-width': 2 }));
    ev.forEach(([a, d], i) => { const x = x0 + i * (x1 - x0) / (ev.length - 1); const ult = i === ev.length - 1; s.append(sv('circle', { cx: x, cy: 60, r: ult ? 8 : 6, fill: ult ? '#8fc46a' : '#e3a64a' }), txt(x, 40, a, { 'text-anchor': 'middle', 'font-size': 18, 'font-weight': 600, fill: '#e6ecf0' }), multi(Math.max(0, Math.min(ancho - 150, x - 72)), 92, d, 26, { 'font-size': 11.5 }, 15)); }); }
  else { s.append(sv('line', { x1: 20, x2: 20, y1: 10, y2: ev.length * 92, stroke: '#3a4550', 'stroke-width': 2 }));
    ev.forEach(([a, d], i) => { const y = 20 + i * 92; s.append(sv('circle', { cx: 20, cy: y, r: 6, fill: i === ev.length - 1 ? '#8fc46a' : '#e3a64a' }), txt(38, y + 5, a, { 'font-size': 16, 'font-weight': 600, fill: '#e6ecf0' }), multi(38, y + 24, d, 46, { 'font-size': 11.5 }, 14)); }); } }

// ---- Lámina 3: sintaxis
{ const R = D.resumen; const s = lienzo('#g-sx', 520, 270);
  const M = [['nain', 'Integración NAIN Rn'], ['nain8', 'Integración NAIN R800'], ['nach', 'Elección NACH Rn'], ['prof', 'Profundidad media (giros)'], ['sinergia', 'Sinergia (r² Rn-R800)']];
  M.forEach(([k, n], i) => { const y = 14 + i * 50; const a = R.antes_600m[k], b = R.despues_600m[k]; const mx = Math.max(a, b) * 1.15; const esc = 250 / mx;
    s.append(txt(0, y + 12, n, { 'font-size': 12 }), sv('rect', { x: 190, y, width: a * esc, height: 13, fill: '#5a6670' }), sv('rect', { x: 190, y: y + 16, width: b * esc, height: 13, fill: '#e3a64a' }), mono(196 + a * esc, y + 11, fmt(a, 3)), mono(196 + b * esc, y + 27, fmt(b, 3) + `  (${b >= a ? '+' : ''}${fmt(100 * (b - a) / a, 1)} %)`, { fill: '#e6ecf0' })); });
  s.append(sv('rect', { x: 190, y: 258, width: 10, height: 10, fill: '#5a6670' }), mono(206, 267, 'antes'), sv('rect', { x: 260, y: 258, width: 10, height: 10, fill: '#e3a64a' }), mono(276, 267, 'después'));
  const l = lienzo('#g-sx-lee', 520, 270);
  [['Integración', 'Qué tan pocos giros separan un tramo de todos los demás. Alta: lugares centrales, a mano.'], ['Elección', 'Por cuántos recorridos más directos pasa un tramo. Alta: calles de paso.'], ['Radio n / 800 m', 'Toda la red o solo lo que se alcanza en unos diez minutos a pie.'], ['Lectura', `Los pasajes nuevos quedan por encima del ${SX.nuevoNain} % de las calles en integración y en el percentil ${SX.nuevoNach} en elección: el interior entra a la red como lugar central, no como vía de paso.`]].forEach(([a, b], i) => { l.append(txt(0, 18 + i * 64, a, { 'font-weight': 600, fill: '#e3a64a' }), multi(0, 38 + i * 64, b, 70, { 'font-size': 12 }, 15)); });
  $('#sx-metodo').textContent = `Método: análisis angular de segmentos (como DepthmapX) reimplementado en tools/bavaria_pres_datos.py, con todas las fuentes y sin muestreo, sobre ${fmt(R.antes_todo.n)} tramos (${fmt(R.antes_todo.km, 0)} km) antes y ${fmt(R.despues_todo.n)} después. Antes, las vías internas de la fábrica no cuentan porque el predio está cerrado. El radio 800 m es aproximado: incluye los tramos a menos de 800 m de recorrido y toma la profundidad angular del grafo completo. Con toda la red, la integración media cambia ${fmt(100 * (R.despues_todo.nain - R.antes_todo.nain) / R.antes_todo.nain, 1)} %: el efecto es local.`;
  $('#sx-cifras1').innerHTML = `<div><b>${SX.nuevoNain} %</b><span>de las calles queda por debajo de la mediana de los pasajes (NAIN Rn)</span></div><div><b>${SX.c300[0].p >= 0 ? '+' : ''}${fmt(SX.c300[0].p, 1)} %</b><span>integración media de las calles a 300 m del predio</span></div>`;
  $('#sx-cifras2').innerHTML = `<div><b>P${SX.nuevoNach}</b><span>percentil de elección de la mediana de los pasajes</span></div><div><b>P${SX.nuevoNachMax}</b><span>percentil del pasaje con más paso</span></div>`;
}

// ---- Lámina 4: dieta y cultivos
datos('#dieta-datos', [
  ['45,2 kg', 'de arroz por persona al año: la base del plato', 'Fedearroz 2024 (La República)'],
  ['13,9 %', 'de los hogares de Bogotá con inseguridad alimentaria moderada o grave', 'DANE, FIES 2024'],
  ['33 %', 'de los hogares de Bogotá solo asegura una o dos comidas al día', 'Veeduría Distrital 2024, encuesta a 4.148 hogares'],
  ['8 de 10', 'niños comen fruta entera solo una vez al día', 'ENSIN 2015 (ICBF)'],
  ['13.000', 'huertas urbanas activas en Bogotá en 2025', 'Jardín Botánico de Bogotá'],
]);
const CULTIVOS = [
  ['Acelga', 'hoja', '50 (cortes continuos)', 6, 'bancal · techo', 'Hierro y folatos; cocina diaria (sopas, tortas)', '#7fb85a', [[0, 12, 'c']]],
  ['Lechuga', 'hoja', '60', 5, 'bancal · techo', 'Verdura fresca de bajo costo', '#9ccc65', [[0, 12, 'c']]],
  ['Cilantro y cebolla larga', 'condimento', '30-40 / 90-120', 4, 'bancal · techo', 'Presentes en casi todas las preparaciones; se compran a diario', '#5f9a48', [[0, 12, 'c']]],
  ['Tomate y pimentón', 'fruto', '90-120', 12, 'invernadero', 'Base de guisos y hogao; mayor rendimiento bajo cubierta', '#c86a4a', [[1, 4, 's'], [4, 8, 'c'], [7, 10, 's'], [10, 12, 'c']]],
  ['Zanahoria y remolacha', 'raíz', '70-100', 5, 'bancal', 'Vitamina A; caldos y ensaladas', '#d27a5a', [[2, 4, 's'], [4, 6, 'c'], [8, 10, 's'], [10, 12, 'c']]],
  ['Arveja y haba', 'leguminosa', '90-150', 2, 'bancal', 'Proteína vegetal; fija nitrógeno en el suelo', '#b5c95a', [[2, 3, 's'], [6, 8, 'c'], [8, 9, 's'], [0, 2, 'c']]],
  ['Papa criolla', 'tubérculo', '120', 3, 'bancal profundo', 'Parte de la base de la dieta; variedad andina de ciclo corto', '#c4a35a', [[2, 3, 's'], [6, 7, 'c'], [8, 9, 's'], [0, 1, 'c']]],
  ['Cubio, ibia y ruba', 'tubérculo andino', '180-240', 2, 'bancal', 'Recupera cultivos tradicionales de la Sabana', '#a07a4a', [[2, 3, 's'], [9, 11, 'c']]],
  ['Aromáticas y caléndula', 'medicinal', 'perenne', 2, 'bordes de bancal', 'Infusiones; atraen polinizadores y alejan plagas', '#8c6bb0', [[0, 12, 'c']]],
  ['Fresa y uchuva', 'fruta', 'perenne', 3, 'techo · bancal', 'Fruta fresca para niñas y niños', '#e58aa8', [[0, 12, 'c']]],
  ['Orellanas', 'hongo', '30-45', 25, 'laboratorio de hongos', 'Proteína a partir de residuos orgánicos (sustrato)', '#d9c7ef', [[0, 12, 'c']]],
];
$('#t-cultivos').innerHTML = '<thead><tr><th>Cultivo</th><th>Tipo</th><th>Ciclo (días)</th><th>kg/m²/año</th><th>Dónde</th><th>Por qué</th></tr></thead><tbody>' + CULTIVOS.map(c => `<tr><td><span style="display:inline-block;width:9px;height:9px;border-radius:2px;background:${c[6]};margin-right:8px"></span>${c[0]}</td><td>${c[1]}</td><td class="n">${c[2]}</td><td class="n">${c[3]} <span class="sup">est.</span></td><td>${c[4]}</td><td>${c[5]}</td></tr>`).join('') + '</tbody>';
{ const s = lienzo('#g-calendario', 900, CULTIVOS.length * 26 + 50); const x0 = 190, mw = (900 - x0) / 12; const MES = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
  [[2, 5], [8, 11]].forEach(([a, b]) => s.append(sv('rect', { x: x0 + a * mw, y: 0, width: (b - a) * mw, height: CULTIVOS.length * 26 + 22, fill: '#5fb3d9', opacity: 0.08 })));
  MES.forEach((m, i) => s.append(mono(x0 + i * mw + mw / 2, 14, m, { 'text-anchor': 'middle' })));
  CULTIVOS.forEach((c, i) => { const y = 24 + i * 26; s.append(txt(0, y + 13, c[0], { 'font-size': 12 })); c[7].forEach(([a, b, t]) => s.append(sv('rect', { x: x0 + a * mw + 1, y: y + 2, width: (b - a) * mw - 2, height: 14, rx: 2, fill: c[6], opacity: t === 's' ? 0.35 : 0.9 }))); });
  const yl = CULTIVOS.length * 26 + 40; s.append(sv('rect', { x: x0, y: yl - 9, width: 14, height: 10, fill: '#8fc46a', opacity: 0.35 }), mono(x0 + 20, yl, 'siembra'), sv('rect', { x: x0 + 90, y: yl - 9, width: 14, height: 10, fill: '#8fc46a' }), mono(x0 + 110, yl, 'cosecha'), sv('rect', { x: x0 + 180, y: yl - 9, width: 14, height: 10, fill: '#5fb3d9', opacity: 0.3 }), mono(x0 + 200, yl, 'lluvias')); }

// ---- Lámina 5: producción
datos('#prod-datos', [
  [fmt(C.area_cult), 'm² cultivados entre bancales, invernaderos y techos', 'Cálculo con la geometría del plan', 'propuesta'],
  [fmt(C.prod) + ' t', 'de hortalizas y frutos al año', `Rendimientos: ${C.rend.banc} kg/m² en bancal, ${C.rend.inv} bajo cubierta, ${C.rend.techo} en techo`, 'est.'],
  [fmt(C.personas), 'personas cubiertas con 200 g de hortalizas al día', `${fmt(100 * C.personas / C.pob, 0)} % de la UPZ Bavaria`, 'est.'],
  [fmt(C.nucleos), 'núcleos de huerta de unos 1.000 m²', 'Uno por cada 1.000 m² cultivados', 'propuesta'],
]);
{ const s = lienzo('#g-prod', 900, 200); const L = [['Bancales del predio', S.bancales_m2, C.prod_banc, '#7fb85a'], ['Invernaderos en las naves', C.inv_m2, C.prod_inv, '#c86a4a'], ['Cubiertas del barrio', S.techos_m2, C.prod_techo, '#9ccc65']]; const esc = 560 / Math.max(...L.map(l => l[2]));
  L.forEach(([n, a, p, c], i) => { const y = 14 + i * 58; s.append(txt(0, y + 16, n, { 'font-weight': 600 }), mono(0, y + 34, fmt(a) + ' m²'), sv('rect', { x: 230, y, width: p * esc, height: 30, fill: c, rx: 2 }), mono(238 + p * esc, y + 20, fmt(p) + ' t/año', { fill: '#e6ecf0', 'font-size': 12 })); });
  $('#prod-cap').textContent = `Producción = área × rendimiento. Un rendimiento de 3 a 8 kg/m²/año a cielo abierto es una estimación; FAO reporta hasta 10-20 kg/m²/año en microhuertos intensivos. La cobertura se calcula con 73 kg de hortalizas por persona al año (200 g/día).`; }

// ---- Lámina 6: residuos
datos('#res-datos', [
  [fmt(C.res, 1) + ' t', 'de residuos al día en la UPZ Bavaria', '40.320 personas × 0,8 kg/día (UAESP)'],
  [fmt(C.org, 1) + ' t', 'son orgánicos (51 %)', 'UAESP 2018'],
  [fmt(C.comp_in, 1) + ' t', 'al día llegan al compostaje, con 5 t de Corabastos', `${fmt(C.comp_in * 365)} t al año`, 'propuesta'],
  [fmt(C.comp_out, 1) + ' t', 'de compost al día', `${fmt(C.comp_out * 365)} t/año; las huertas usan ${fmt(C.area_cult * 5 / 1000)} t (5 kg/m²)`, 'est.'],
]);
{ const s = lienzo('#g-sankey', 1000, 440); const k = 300 / C.res; // altura por tonelada
  const nodos = { gen: [20, 30, C.res, 'Residuos de los hogares', '#8b9aa7'], org: [300, 30, C.org, 'Orgánico', '#b98a57'], resto: [300, 30 + C.org * k + 30, C.res - C.org, 'No orgánico', '#5a6670'],
    sep: [560, 30, C.sep, 'Separado en la fuente', '#b98a57'], noSep: [560, 30 + C.sep * k + 26, C.org - C.sep, 'Mezclado', '#6b5a4a'], cora: [560, 30 + C.org * k + 60 - 10, C.cora, 'Corabastos', '#e0664f'],
    comp: [800, 30, C.comp_in, 'Compostaje del distrito', '#8fc46a'], dj: [800, 30 + C.comp_in * k + 40, C.org - C.sep + (C.res - C.org) * 0.7, 'Relleno Doña Juana', '#3a4550'], rec: [800, 30 + C.comp_in * k + 40 + (C.org - C.sep + (C.res - C.org) * 0.7) * k + 20, (C.res - C.org) * 0.3, 'Reciclaje (recicladores de oficio)', '#5fb3d9'] };
  const off = {}; for (const n in nodos) off[n] = [0, 0];
  const flujo = (a, b, v, c) => { const A = nodos[a], B = nodos[b]; const y0 = A[1] + off[a][1] * k, y1 = B[1] + off[b][0] * k; off[a][1] += v; off[b][0] += v; const h = v * k, x0 = A[0] + 14, x1 = B[0], xm = (x0 + x1) / 2; s.append(sv('path', { d: `M${x0},${y0}C${xm},${y0} ${xm},${y1} ${x1},${y1}L${x1},${y1 + h}C${xm},${y1 + h} ${xm},${y0 + h} ${x0},${y0 + h}Z`, fill: c, opacity: 0.35 })); };
  flujo('gen', 'org', C.org, '#b98a57'); flujo('gen', 'resto', C.res - C.org, '#5a6670'); flujo('org', 'sep', C.sep, '#b98a57'); flujo('org', 'noSep', C.org - C.sep, '#6b5a4a');
  flujo('sep', 'comp', C.sep, '#8fc46a'); flujo('cora', 'comp', C.cora, '#e0664f'); flujo('noSep', 'dj', C.org - C.sep, '#6b5a4a'); flujo('resto', 'dj', (C.res - C.org) * 0.7, '#5a6670'); flujo('resto', 'rec', (C.res - C.org) * 0.3, '#5fb3d9');
  for (const n in nodos) { const [x, y, v, l, c] = nodos[n]; s.append(sv('rect', { x, y, width: 14, height: Math.max(2, v * k), fill: c })); const tx = x === 800 ? x + 22 : x + 22; s.append(txt(tx, y + 12, l, { 'font-size': 12, 'font-weight': 600, fill: '#e6ecf0' }), mono(tx, y + 27, fmt(v, 1) + ' t/día')); }
  s.append(mono(20, 432, 'El reparto del no orgánico (30 % reciclable) es un supuesto.', { 'font-size': 10 })); }
{ const s = lienzo('#g-ruta', 1000, 170); const P = [['Hogares', `${fmt(C.hogares)} hogares separan en un balde`], ['Punto verde', `${fmt(Math.round(C.hogares / 150))} puntos, uno por cada 150 hogares`], ['Bicicarga', `${fmt(Math.ceil(C.sep * 1000 / 150))} viajes al día de 150 kg por los pasajes`], ['Patio de compostaje', 'Pilas con volteo, 8 a 10 semanas, en el antiguo parqueadero'], ['Huertas y bosque', 'Compost a bancales, techos, vivero y restauración']];
  P.forEach(([a, b], i) => { const x = i * 200; s.append(sv('rect', { x: x + 4, y: 20, width: 176, height: 120, rx: 8, fill: '#111820', stroke: '#2a3540' }), mono(x + 18, 44, String(i + 1).padStart(2, '0'), { fill: '#e3a64a' }), txt(x + 18, 66, a, { 'font-weight': 600, fill: '#e6ecf0', 'font-size': 14 }), multi(x + 18, 88, b, 24, { 'font-size': 11.5 }, 14)); if (i < P.length - 1) s.append(sv('path', { d: `M${x + 182},80l14,0m-5,-5l5,5l-5,5`, stroke: '#e3a64a', fill: 'none', 'stroke-width': 1.5 })); });
  if (MOVIL) s.setAttribute('viewBox', '0 0 1000 170'); }

// ---- Lámina 7: Corabastos y trabajo
datos('#cora-datos', [
  ['42 ha', 'y más de 5.000 locales; en operación desde 1974', 'Alcaldía de Bogotá 2024'],
  ['1,98 Mt', 'de alimentos en 2025, unas 5.400 t al día', 'La República 2026 · cálculo propio'],
  ['20-25 mil', 'empleos directos; 260.000 con los indirectos', 'La República; Alcaldía 2024'],
  ['80.000', 'visitantes al día; hasta 200.000 martes y sábados', 'Prensa'],
  ['~100 t', 'de residuos al día, 65 % orgánicos', 'Context Ganadero 2016; SDA'],
]);
const TRAB = [ // área del distrito, puestos, cálculo
  ['Huertas (bancales y techos)', Math.round((S.bancales_m2 + S.techos_m2) / 1000), '1 persona por 1.000 m²'],
  ['Invernaderos y vivero', Math.round(C.inv_m2 / 700), '1 persona por 700 m² bajo cubierta'],
  ['Recolección y compostaje', Math.round(Math.ceil(C.sep * 1000 / 150) / 3) + 20, '1 bicicarga por cada 3 viajes diarios + 20 en el patio'],
  ['Mercado de proximidad', Math.round(poligonoArea(D.edif[3].p) / 60 * 1.5), '1 puesto por 60 m² con circulación, 1,5 personas por puesto'],
  ['Cocina comunitaria', 30, 'Comedor de 600 raciones al día'],
  ['Laboratorio de hongos', 15, ''],
  ['Reparto en bicicarga a tiendas', 25, ''],
  ['Cuidados', 25, 'Niñez y personas mayores'],
  ['Bosque, especies y monitoreo', 15, ''],
  ['Formación, energía y mantenimiento', 25, ''],
];
const totalTrab = TRAB.reduce((t, r) => t + r[1], 0);
$('#t-trabajo').innerHTML = '<thead><tr><th>Área</th><th>Puestos</th><th>Cómo se calcula</th></tr></thead><tbody>' + TRAB.map(r => `<tr><td>${r[0]}</td><td class="n">${fmt(r[1])}</td><td class="mu">${r[2] || 'Dimensionado de la propuesta'}</td></tr>`).join('') + `<tr><td><b>Total</b></td><td class="n"><b>${fmt(totalTrab)}</b></td><td class="mu">Puestos de trabajo <span class="sup p">propuesta</span></td></tr></tbody>`;
{ const s = lienzo('#g-trabajo', 1000, 420); const OR = [['Coteros y bodegueros', '#8b9aa7'], ['Vendedores y comerciantes', '#e3a64a'], ['Recicladores de oficio', '#5fb3d9'], ['Cocineras y ventas de comida', '#e58aa8'], ['Jóvenes y mujeres sin empleo formal', '#a98bd6']];
  const DE = [['Huertas e invernaderos', TRAB[0][1] + TRAB[1][1]], ['Recolección y compostaje', TRAB[2][1]], ['Mercado y reparto', TRAB[3][1] + TRAB[6][1]], ['Cocina y hongos', TRAB[4][1] + TRAB[5][1]], ['Cuidados, bosque y formación', TRAB[7][1] + TRAB[8][1] + TRAB[9][1]]];
  const FL = [[0, 0, 0.5], [0, 1, 0.5], [0, 2, 0.6], [1, 2, 0.4], [2, 1, 1], [3, 3, 1], [4, 0, 0.5], [4, 4, 1]]; // [origen, destino, fracción del destino]
  const k = 300 / totalTrab; const yO = [], yD = []; let y = 30; const tO = OR.map((_, i) => FL.filter(f => f[0] === i).reduce((t, f) => t + DE[f[1]][1] * (f[2] === 1 ? 1 : f[2] * (f[1] === 0 ? 1 : 1)), 0));
  // normalizar las fracciones por destino
  const sumDest = DE.map((_, j) => FL.filter(f => f[1] === j).reduce((t, f) => t + f[2], 0));
  const val = FL.map(f => DE[f[1]][1] * f[2] / sumDest[f[1]]);
  const vO = OR.map((_, i) => FL.reduce((t, f, q) => t + (f[0] === i ? val[q] : 0), 0));
  OR.forEach((_, i) => { yO[i] = y; y += vO[i] * k + 16; }); y = 30; DE.forEach((d, j) => { yD[j] = y; y += d[1] * k + 16; });
  const oO = OR.map(() => 0), oD = DE.map(() => 0);
  FL.forEach((f, q) => { const h = val[q] * k; const y0 = yO[f[0]] + oO[f[0]], y1 = yD[f[1]] + oD[f[1]]; oO[f[0]] += h; oD[f[1]] += h; const x0 = 300, x1 = 640; s.append(sv('path', { d: `M${x0},${y0}C470,${y0} 470,${y1} ${x1},${y1}L${x1},${y1 + h}C470,${y1 + h} 470,${y0 + h} ${x0},${y0 + h}Z`, fill: OR[f[0]][1], opacity: 0.32 })); });
  OR.forEach(([n, c], i) => s.append(sv('rect', { x: 288, y: yO[i], width: 12, height: vO[i] * k, fill: c }), txt(278, yO[i] + vO[i] * k / 2 + 4, n, { 'text-anchor': 'end', 'font-size': 12 })));
  DE.forEach(([n, v], j) => s.append(sv('rect', { x: 640, y: yD[j], width: 12, height: v * k, fill: '#8fc46a' }), txt(662, yD[j] + v * k / 2, n, { 'font-size': 12, 'font-weight': 600, fill: '#e6ecf0' }), mono(662, yD[j] + v * k / 2 + 15, fmt(v) + ' puestos')));
  s.append(mono(300, 18, 'OFICIO ACTUAL (CORABASTOS Y BARRIO)'), mono(640, 18, 'TRABAJO EN EL DISTRITO')); }

// ---- Lámina 8: federación
const adultos = Math.round(C.pob * 0.78); const porSector = Math.round(C.pob / NSECT); const asist = Math.round(adultos * 0.05 / NSECT);
const CONSEJO = [['Sectores (dupla paritaria por sector)', NSECT * 2, '#e3a64a'], ['Comisiones temáticas', 6, '#8fc46a'], ['Colectivo Salvemos el Bosque Bavaria', 1, '#4f8a3c'], ['Cooperativa de trabajo', 1, '#d98f5a'], ['Juventudes', 1, '#a98bd6']];
const nCons = CONSEJO.reduce((t, c) => t + c[1], 0);
datos('#fed-datos', [
  [fmt(C.pob), 'personas en el territorio de la federación (UPZ 113 Bavaria)', 'SDS 2021'],
  [String(NSECT), `asambleas de sector, de unas ${fmt(porSector)} personas cada una`, 'Una por cada dos puertas del predio', 'propuesta'],
  [`${fmt(asist)}`, 'personas esperadas por asamblea de sector al mes (5 % de las personas adultas)', 'Quórum de 60 personas', 'propuesta'],
  [fmt(C.nucleos), 'núcleos de huerta de 15 a 25 personas', `${fmt(C.nucleos * 20)} personas activas en las huertas`, 'propuesta'],
  [String(nCons), 'vocerías en el consejo federal; todas rotan cada seis meses', `${fmt(nCons * 10)} personas habrán llevado la voz en cinco años`, 'propuesta'],
]);
{ const ancho = 1000, s = lienzo('#g-federacion', ancho, 560);
  // asamblea general (envolvente)
  s.append(sv('rect', { x: 10, y: 10, width: ancho - 20, height: 540, rx: 16, fill: 'none', stroke: '#3a4550', 'stroke-dasharray': '5 5' }), mono(28, 34, 'ASAMBLEA GENERAL · ABIERTA A TODAS LAS PERSONAS · 2 AL AÑO', { fill: '#8b9aa7' }));
  // consejo federal: anillo de asientos
  const cx = 500, cy = 140, R = 70; let k = 0;
  s.append(sv('circle', { cx, cy, r: R + 22, fill: '#111820', stroke: '#2a3540' }), txt(cx, cy - 4, 'Consejo', { 'text-anchor': 'middle', 'font-weight': 600, fill: '#e6ecf0', 'font-size': 15 }), txt(cx, cy + 14, 'federal', { 'text-anchor': 'middle', 'font-weight': 600, fill: '#e6ecf0', 'font-size': 15 }), mono(cx, cy + 32, `${nCons} vocerías · mensual`, { 'text-anchor': 'middle' }));
  CONSEJO.forEach(([n, m, c]) => { for (let i = 0; i < m; i++) { const a = -Math.PI / 2 + (k++ / nCons) * Math.PI * 2; s.append(sv('circle', { cx: cx + Math.cos(a) * (R + 8), cy: cy + Math.sin(a) * (R + 8), r: 6.5, fill: c, stroke: '#0b1015', 'stroke-width': 1.5 })); } });
  CONSEJO.forEach(([n, m, c], i) => s.append(sv('circle', { cx: 700, cy: 70 + i * 22, r: 6, fill: c }), txt(714, 74 + i * 22, `${n} · ${m}`, { 'font-size': 12 })));
  // comisiones
  const COM = ['Huertas y semillas', 'Residuos y compost', 'Mercado y cocina', 'Bosque y especies', 'Cuidados', 'Trabajo y finanzas'];
  COM.forEach((n, i) => { const x = 40, y = 70 + i * 30; s.append(sv('rect', { x, y, width: 190, height: 22, rx: 11, fill: '#18241a', stroke: '#4f8a3c' }), txt(x + 12, y + 15, n, { 'font-size': 11.5 })); s.append(sv('path', { d: `M232,${y + 11}C330,${y + 11} 360,${cy} ${cx - R - 26},${cy}`, stroke: '#4f8a3c', fill: 'none', opacity: 0.5 })); });
  mono && s.append(mono(40, 60, 'COMISIONES ABIERTAS · MENSUAL', { fill: '#8fc46a' }));
  // asambleas de sector
  const ys = 330; for (let i = 0; i < NSECT; i++) { const x = 70 + i * (760 / (NSECT - 1)); s.append(sv('path', { d: `M${x},${ys - 26}C${x},${ys - 90} ${cx},${cy + 140} ${cx},${cy + R + 24}`, stroke: COL_SECT[i], fill: 'none', 'stroke-width': 1.6, opacity: 0.6 }), sv('circle', { cx: x, cy: ys, r: 26, fill: '#111820', stroke: COL_SECT[i], 'stroke-width': 2 }), txt(x, ys + 5, 'S' + (i + 1), { 'text-anchor': 'middle', 'font-weight': 600, fill: '#e6ecf0', 'font-size': 14 }));
    const nn = Math.round(C.nucleos / NSECT); for (let j = 0; j < nn; j++) { const a = Math.PI * (0.15 + 0.7 * j / Math.max(1, nn - 1)); s.append(sv('circle', { cx: x + Math.cos(a) * 56 * (j % 2 ? 0.75 : 1), cy: ys + 38 + Math.sin(a) * 52 * (j % 2 ? 0.75 : 1), r: 3.5, fill: COL_SECT[i], opacity: 0.85 })); } }
  s.append(mono(70, ys - 50, `ASAMBLEAS DE SECTOR · ${NSECT} · MENSUAL`, { fill: '#e3a64a' }), mono(70, 486, `NÚCLEOS DE HUERTA · ${C.nucleos} · MENSUAL · COORDINACIÓN ROTATIVA CADA 3 MESES`, { fill: '#8fc46a' }));
  s.append(sv('path', { d: 'M965,470L965,190m-6,8l6,-8l6,8', stroke: '#e3a64a', fill: 'none', 'stroke-width': 1.5 }), mono(958, 300, 'mandato', { 'text-anchor': 'end', fill: '#e3a64a' }), sv('path', { d: 'M935,190L935,470m-6,-8l6,8l6,-8', stroke: '#8b9aa7', fill: 'none', 'stroke-width': 1.5 }), mono(928, 400, 'rinde cuentas', { 'text-anchor': 'end' }));
  s.append(mono(28, 530, 'Quien lleva la vocería no decide sola ni solo: lleva el mandato de su asamblea, vuelve a rendir cuentas y puede ser revocada.', { 'font-size': 11 })); }
$('#t-reuniones').innerHTML = '<thead><tr><th>Instancia</th><th>Cuántas</th><th>Frecuencia</th><th>Al año</th></tr></thead><tbody>' + [
  ['Núcleos de huerta', C.nucleos, 'mensual', C.nucleos * 12], ['Asambleas de sector', NSECT, 'mensual', NSECT * 12], ['Comisiones', 6, 'mensual', 72], ['Consejo federal', 1, 'mensual', 12], ['Asamblea general', 1, 'semestral', 2],
].map(r => `<tr><td>${r[0]}</td><td class="n">${fmt(r[1])}</td><td>${r[2]}</td><td class="n">${fmt(r[3])}</td></tr>`).join('') + `<tr><td><b>Total</b></td><td></td><td></td><td class="n"><b>${fmt(C.nucleos * 12 + NSECT * 12 + 72 + 14)}</b></td></tr></tbody>`;
{ const s = lienzo('#g-rotacion', 520, 260); const sem = 10, cw = 520 / sem;
  for (let i = 0; i < sem; i++) { for (let j = 0; j < nCons; j++) s.append(sv('rect', { x: i * cw + 6, y: 20 + j * 6.4, width: cw - 12, height: 5, fill: COL_SECT[i % COL_SECT.length], opacity: 0.85 })); s.append(mono(i * cw + cw / 2, 14, `S${i + 1}`, { 'text-anchor': 'middle' })); }
  const yb = 20 + nCons * 6.4 + 22; s.append(mono(0, yb, `Semestres 1 a 10 · ${nCons} vocerías por semestre · ${fmt(nCons * sem)} personas en total`, { fill: '#e6ecf0' })); }

// ---- Lámina 9: especies
const TIPO = { dep: ['Depredación', '#C96349'], herb: ['Herbivoría y semillas', '#84A48B'], disp: ['Dispersión de semillas', '#E69888'], mut: ['Mutualismo', '#E7C878'], nido: ['Nidificación y refugio', '#F79E70'], pol: ['Visita floral y polinización', '#A386A9'], dosel: ['Anidamiento de dosel', '#D1A996'], bio: ['Descomposición', '#6B9080'] };
const ELEM = ['Bosque conservado', 'Bancales y techos', 'Aromáticas y flores', 'Vivero de nativas', 'Compostaje', 'Pasajes arbolados', 'Humedales conectados'];
const ESP = [['Mirla', 'Turdus fuscater'], ['Copetón', 'Zonotrichia capensis'], ['Torcaza', 'Zenaida auriculata'], ['Colibrí chillón', 'Colibri coruscans'], ['Jilguero', 'Spinus psaltria'], ['Sirirí', 'Tyrannus melancholicus'], ['Picaflores', 'Diglossa spp.'], ['Reinita cerúlea (VU)', 'Setophaga cerulea'], ['Avetorito bogotano (CR)', 'Ixobrychus exilis bogotensis'], ['Búho', 'Asio clamator'], ['Gavilán bailarín', 'Elanus leucurus'], ['Tingua azul', 'Porphyrio martinicus'], ['Monjita', 'Chrysomus icterocephalus'], ['Abejas', 'Apis mellifera y nativas'], ['Lombriz roja', 'Eisenia fetida'], ['Orellana', 'Pleurotus ostreatus']];
const ENL = [[0, 0, 'nido'], [0, 2, 'nido'], [0, 5, 'dosel'], [0, 7, 'dosel'], [0, 9, 'nido'], [1, 1, 'herb'], [1, 2, 'herb'], [1, 4, 'herb'], [1, 0, 'dep'], [1, 10, 'dep'], [1, 13, 'pol'], [2, 3, 'pol'], [2, 6, 'pol'], [2, 13, 'pol'], [3, 3, 'mut'], [3, 6, 'pol'], [3, 7, 'dosel'], [4, 14, 'mut'], [4, 15, 'bio'], [4, 0, 'dep'], [5, 1, 'disp'], [5, 4, 'disp'], [5, 5, 'disp'], [6, 8, 'nido'], [6, 11, 'nido'], [6, 12, 'nido'], [6, 10, 'dep']];
{ const s = lienzo('#g-especies', 1000, 560); const yE = (i) => 40 + i * (480 / (ELEM.length - 1)), yS = (j) => 24 + j * (510 / (ESP.length - 1));
  ENL.forEach(([i, j, t]) => s.append(sv('path', { d: `M250,${yE(i)}C470,${yE(i)} 530,${yS(j)} 700,${yS(j)}`, stroke: TIPO[t][1], 'stroke-width': 2, fill: 'none', opacity: 0.8 })));
  ELEM.forEach((n, i) => s.append(sv('rect', { x: 20, y: yE(i) - 14, width: 230, height: 28, rx: 14, fill: '#18241a', stroke: '#4f8a3c' }), txt(36, yE(i) + 4, n, { 'font-weight': 600, fill: '#e6ecf0', 'font-size': 12.5 })));
  ESP.forEach(([n, c], j) => s.append(sv('circle', { cx: 706, cy: yS(j), r: 5, fill: '#e6ecf0' }), txt(720, yS(j) + 4, n, { 'font-size': 12, fill: '#e6ecf0' }), mono(905, yS(j) + 4, c, { 'font-size': 9 })));
  const lg = $('#g-especies').parentElement.querySelector('figcaption'); lg.innerHTML += '<br>' + Object.values(TIPO).map(([n, c]) => `<span class="chip" style="border-color:${c};color:${c}">${n}</span>`).join(''); }
datos('#esp-datos', [
  ['80', 'especies de aves en el bosque y el humedal Madre de Agua, un tercio de la avifauna de la Sabana', 'Torres-Ariza y Gil-T, Intropica 2023'],
  ['33', 'especies migratorias; 4 amenazadas, entre ellas la reinita cerúlea (VU) y el avetorito bogotano (CR)', 'Intropica 2023'],
  [fmt(S.bosque_ha, 1) + ' ha', 'de bosque denso que la propuesta no ocupa', 'Copas detectadas en Esri World Imagery'],
  ['11,7 ha', 'del humedal de Techo, a 0,8 km; El Burro a 1,3 km', 'Alcaldía de Bogotá 2026'],
]);

// ---- fuentes
const FUENTES = [
  ['ASIS Kennedy 2024, Subred Sur Occidente / SDS', 'https://saludata.saludcapital.gov.co/osb/wp-content/uploads/2026/01/8.-ASIS_Kennedy_2024.pdf'],
  ['ACCVSyE Kennedy 2021, SDS', 'https://saludata.saludcapital.gov.co/osb/wp-content/uploads/2026/01/ACCVSYE_KENNEDY.pdf'],
  ['Decreto 364 de 2017 (plan parcial Bavaria Fábrica)', 'https://www.habitatbogota.gov.co/sites/default/files/marco-legal/Decreto364de2017.pdf'],
  ['Alcaldía de Bogotá, modificación del plan parcial (Decreto 448 de 2023)', 'https://bogota.gov.co/mi-ciudad/habitat/con-modificacion-de-plan-p-bavaria-bogota-tendra-bosque-toda-la-vida'],
  ['El Espectador, plan parcial y movilizaciones (2019-2022)', 'https://www.elespectador.com/bogota/plan-parcial-bavaria-ejemplo-de-concertacion-para-proyectos-urbanisticos/'],
  ['El Espectador, marcha del 5 de octubre de 2020', 'https://www.elespectador.com/bogota/ambientalistas-marchan-en-defensa-de-los-arboles-y-humedales-en-el-suroccidente-de-bogota-article/'],
  ['El Tiempo, la fábrica de Bavaria (2023)', 'https://www.eltiempo.com/bogota/fabrica-de-bavaria-en-bogota-asi-se-ven-las-ruinas-y-esto-pasara-con-el-predio-790658'],
  ['Las2orillas, «Bosque sí, cemento no» (2018)', 'https://www.las2orillas.co/bosque-si-cemento-no/'],
  ['Torres-Ariza y Gil-T, Aves en Madre de Agua, Intropica 18(2), 2023', 'https://dialnet.unirioja.es/descarga/articulo/9297483.pdf'],
  ['Corabastos: Alcaldía de Bogotá 2024', 'https://bogota.gov.co/en/node/227158'],
  ['Corabastos: La República 2026 (toneladas 2025)', 'https://www.larepublica.co/economia/quien-es-quien-entre-las-centrales-de-abasto-que-mas-mueven-toneladas-de-alimentos-4514194'],
  ['Residuos: El Espectador con datos UAESP (2026)', 'https://www.elespectador.com/bogota/generacion-de-basura-en-bogota-crecio-55-entre-2024-y-2026-segun-reporte-de-la-uaesp/'],
  ['Fracción orgánica: Boletín PIGA 39, SDA (UAESP 2018)', 'https://gysae.ambientebogota.gov.co/documents/10184/818975/Boleti%C2%B4n+PIGA+39.pdf/ce96dcb7-2d25-4711-a50a-61de92c412cd'],
  ['Inseguridad alimentaria: El Tiempo con datos DANE (2025)', 'https://www.eltiempo.com/bogota/segun-el-dane-la-capital-logro-reducir-de-forma-significativa-la-inseguridad-alimentaria-moderada-y-grave-en-2024-3456602'],
  ['Veeduría Distrital, encuesta de percepción (Infobae 2024)', 'https://www.infobae.com/colombia/2024/09/12/hambre-oculta-en-bogota-5-de-cada-10-hogares-han-tenido-que-reducir-la-cantidad-de-alimentos-por-los-precios/'],
  ['Jardín Botánico: huertas urbanas (2025)', 'https://bogota.gov.co/mi-ciudad/ambiente/se-graduan-las-primeras-huerteras-y-huerteros-urbanos-de-bogota'],
  ['Jardín Botánico: qué sembrar en Bogotá', 'https://bogota.gov.co/mi-ciudad/ambiente/que-plantas-se-pueden-sembrar-en-una-huerta-casera-en-bogota'],
  ['FAO, microhuertos (rendimientos)', 'https://fao.org/fileadmin/templates/agphome/documents/microgardens/manuals/Concept_Note_Integrated_Microgardens.pdf'],
  ['Arroz: La República con datos de Fedearroz', 'https://www.larepublica.co/especiales/retos-detras-de-la-industria-del-arroz/colombianos-consumen-en-promedio-45-2-kilos-del-cereal-4310593'],
  ['IDPAC, infografía de participación Kennedy (2023)', 'https://www.participacionbogota.gov.co/sites/idpac/files/2023-12/infografia_digital_kennedy.pdf'],
  ['Humedal de Techo, restauración (Alcaldía 2026)', 'https://bogota.gov.co/mi-ciudad/ambiente/bogota-avanza-en-proceso-de-restauracion-ecologica-humedal-de-techo'],
  ['Hillier, Yang y Turner (2012), Normalising least angle choice in Depthmap, JOSS 3(2)', 'https://joss.bartlett.ucl.ac.uk/'],
  ['OpenStreetMap (© colaboradores, ODbL) y Esri World Imagery', 'https://www.openstreetmap.org/copyright'],
];
$('#fuentes').innerHTML = FUENTES.map(([n, u]) => `<li>${n} · <a href="${u}" target="_blank" rel="noopener">${u.replace(/^https?:\/\//, '').slice(0, 70)}${u.length > 78 ? '…' : ''}</a></li>`).join('');
