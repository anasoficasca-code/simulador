// REN3D · aves_menu.js — modelos 3D detallados de las aves para el menú «Elige tu ave».
// Cuerpos, cuellos y patas son tubos suaves (sección elíptica que cambia de radio a lo largo de una curva); las alas se arman con plumas
// individuales superpuestas (primarias, secundarias, cubiertas); todo con color por vértice y un atributo «rug» (rugosidad: pico y ojos brillantes).
// Eje +z = hacia adelante, +y = arriba, metros.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const lin = (c) => c.map(v => Math.pow(v, 2.2)); // los colores se escriben en sRGB
const mix = (a, b, t) => { t = Math.max(0, Math.min(1, t)); return a.map((v, i) => v + (b[i] - v) * t); };
const ss = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const EJE_X = new THREE.Vector3(1, 0, 0);
const hash = (x, y, z) => { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); };
// escamado suave del plumaje: filas de plumas (cada ~2,5 cm) algo más claras al centro y oscuras en el borde
const escamas = (x, y, z, amp) => { const f = z * 40 + Math.floor(x * 38) * 0.5 + y * 6, v = Math.sin((f - Math.floor(f)) * Math.PI); return 1 - amp * (1 - v) * (1 - v) + (hash(Math.floor(x * 90), Math.floor(y * 90), Math.floor(z * 90)) - 0.5) * amp * 0.5; };
const tinte = (c, k) => c.map(v => Math.max(0, Math.min(1, v * k)));

function cerrar(pos, idx, colorFn, tParam, rug) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  const n = g.attributes.normal, c = new Float32Array(pos.length), rg = new Float32Array(pos.length / 3).fill(rug);
  for (let i = 0; i < pos.length / 3; i++) { const k = lin(colorFn(tParam[i], n.getX(i), n.getY(i), n.getZ(i), pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2])); c[i * 3] = k[0]; c[i * 3 + 1] = k[1]; c[i * 3 + 2] = k[2]; }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3)); g.setAttribute('rug', new THREE.BufferAttribute(rg, 1));
  return g;
}

// tubo liso por los puntos [x,y,z,rx,ry] (rx = semiancho lateral, ry = semialto); radio 0 en un extremo lo cierra en punta
function tubo(pts, colorFn, o = {}) {
  const nS = o.seg || 100, nR = o.rad || 20, rug = o.rug == null ? 1 : o.rug;
  const cur = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], p[1], p[2])), false, 'centripetal');
  const rcur = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[3], p[4], 0)), false, 'centripetal');
  const pos = [], tp = [], idx = [];
  for (let i = 0; i <= nS; i++) {
    const t = i / nS, P = cur.getPoint(t), T = cur.getTangent(t), R = rcur.getPoint(t);
    const side = EJE_X.clone().addScaledVector(T, -EJE_X.dot(T)).normalize(), up = new THREE.Vector3().crossVectors(T, side).normalize();
    const rx = Math.max(0, R.x), ry = Math.max(0, R.y);
    for (let j = 0; j < nR; j++) { const a = j / nR * Math.PI * 2, ca = Math.cos(a) * rx, sa = Math.sin(a) * ry; pos.push(P.x + side.x * ca + up.x * sa, P.y + side.y * ca + up.y * sa, P.z + side.z * ca + up.z * sa); tp.push(t); }
  }
  for (let i = 0; i < nS; i++) for (let j = 0; j < nR; j++) { const a = i * nR + j, b = i * nR + (j + 1) % nR, c = (i + 1) * nR + j, d = (i + 1) * nR + (j + 1) % nR; idx.push(a, c, b, b, c, d); }
  let g = cerrar(pos, idx, colorFn, tp, rug);
  // normales hacia afuera: se comprueba en un vértice del medio
  const m = Math.floor(nS / 2) * nR, P = cur.getPoint(0.5), nx = g.attributes.normal;
  if ((g.attributes.position.getX(m) - P.x) * nx.getX(m) + (g.attributes.position.getY(m) - P.y) * nx.getY(m) + (g.attributes.position.getZ(m) - P.z) * nx.getZ(m) < 0) {
    const ix = g.index.array; for (let i = 0; i < ix.length; i += 3) { const t = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = t; }
    g = cerrar(pos, Array.from(ix), colorFn, tp, rug);
  }
  return g;
}
// superficie paramétrica (cola, brazo del ala): fn(u,v) -> [x,y,z]; colorFn(u,v)
function superficie(nu, nv, fn, colorFn, rug = 1) {
  const pos = [], tp = [], idx = [], uv = [];
  for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) { const u = i / nu, v = j / nv; pos.push(...fn(u, v)); uv.push([u, v]); tp.push(i * (nv + 1) + j); }
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { const a = i * (nv + 1) + j, b = a + 1, c = a + nv + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  return cerrar(pos, idx, (k) => colorFn(uv[k][0], uv[k][1]), tp, rug);
}
// pluma individual: lámina con raquis (más clara y más gruesa), vexilo asimétrico, punta redondeada y curvatura.
// o = origen, d = dirección a lo largo de la pluma, L = largo, W = ancho, col(t, v) = color (t: base→punta, v: 0 borde de ataque … 1 borde de salida)
function pluma(o, d, L, W, col, op = {}) {
  const D = new THREE.Vector3(...d).normalize(), side = new THREE.Vector3().crossVectors(D, new THREE.Vector3(0, 1, 0));
  if (side.lengthSq() < 1e-6) side.set(1, 0, 0); side.normalize(); const nrm = new THREE.Vector3().crossVectors(side, D).normalize();
  const sg = op.lado || 1, curv = op.curv || 0, eje = 0.3;
  return superficie(12, 6, (t, v) => {
    const s = v < eje ? -(eje - v) / eje * 0.6 : (v - eje) / (1 - eje); // el vexilo de ataque es más estrecho que el de salida
    const ancho = W / 2 * (t < 0.1 ? 0.45 + 5.5 * t : 1) * Math.sqrt(Math.max(0, 1 - Math.pow(t, 3.2)));
    const lat = s * ancho * sg, copa = 0.0025 * (1 - Math.abs(s * 2 - 0.5) * 0.4);
    return [o[0] + D.x * t * L + side.x * lat + nrm.x * (curv * t * t * L + copa), o[1] + D.y * t * L + side.y * lat + nrm.y * (curv * t * t * L + copa), o[2] + D.z * t * L + side.z * lat + nrm.z * (curv * t * t * L + copa)];
  }, (t, v) => { const c = col(t, v), raq = 1 - ss(0.0, 0.05, Math.abs(v - eje)); return mix(tinte(c, 0.93 + 0.1 * hash(Math.round(t * 20), Math.round(v * 12), L * 100)), mix(c, [1, 1, 1], 0.35), raq * 0.5); }, 0.9);
}
// esfera/elipsoide pequeño (ojos, escudo, mejillas); rug bajo = brillante
function esf(cx, cy, cz, rx, ry, rz, col, rug = 1) {
  const g = new THREE.SphereGeometry(1, 20, 14); g.deleteAttribute('uv'); const p = g.attributes.position, c = new Float32Array(p.count * 3), k = lin(col), rg = new Float32Array(p.count).fill(rug);
  for (let i = 0; i < p.count; i++) { p.setXYZ(i, p.getX(i) * rx + cx, p.getY(i) * ry + cy, p.getZ(i) * rz + cz); c[i * 3] = k[0]; c[i * 3 + 1] = k[1]; c[i * 3 + 2] = k[2]; }
  g.computeVertexNormals(); g.setAttribute('color', new THREE.BufferAttribute(c, 3)); g.setAttribute('rug', new THREE.BufferAttribute(rg, 1));
  return g;
}
const unir = (gs) => mergeGeometries(gs.map(g => { const h = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(h.attributes)) if (!['position', 'normal', 'color', 'rug'].includes(k)) h.deleteAttribute(k); return h; }));
const plano = (c) => () => c;
const NEGRO = [0.04, 0.04, 0.045], BLANCO = [0.94, 0.94, 0.92];
const ojo = (s, x, y, z, r, iris) => [esf(s * x, y, z, r, r, r, iris, 0.2), esf(s * (x + r * 0.55), y, z + r * 0.05, r * 0.55, r * 0.55, r * 0.55, [0.01, 0.01, 0.012], 0.12)];

/* ----------------------------------------------------------------- garza real (Ardea alba), de pie ----------------------------------------------------------------- */
function garza() {
  const plumaje = (t, nx, ny, x, y, z) => tinte(mix(mix(BLANCO, [0.76, 0.8, 0.85], ss(0.15, -0.9, ny) * 0.55), [1, 1, 1], ss(0.4, 1, ny) * 0.4), escamas(x, y, z, 0.05) );
  const cuerpo = tubo([
    [0, 0.585, -0.42, 0, 0], [0, 0.6, -0.32, 0.03, 0.026], [0, 0.63, -0.17, 0.068, 0.07], [0, 0.65, -0.02, 0.088, 0.098], [0, 0.68, 0.11, 0.078, 0.092], [0, 0.745, 0.19, 0.042, 0.055],
    [0, 0.84, 0.19, 0.028, 0.03], [0, 0.95, 0.145, 0.022, 0.024], [0, 1.04, 0.15, 0.021, 0.022], [0, 1.1, 0.2, 0.023, 0.024], [0, 1.125, 0.265, 0.03, 0.03], [0, 1.125, 0.32, 0.024, 0.022], [0, 1.118, 0.345, 0.008, 0.01]
  ], (t, nx, ny, nz, x, y, z) => t > 0.93 ? [0.92, 0.78, 0.15] : (t > 0.86 && z > 0.29 ? mix(plumaje(t, nx, ny, x, y, z), [0.93, 0.8, 0.18], 0.7) : plumaje(t, nx, ny, x, y, z)), { seg: 260, rad: 36 });
  const pico = tubo([[0, 1.118, 0.34, 0.013, 0.017], [0, 1.113, 0.4, 0.0105, 0.0135], [0, 1.103, 0.5, 0.0035, 0.004], [0, 1.1, 0.515, 0, 0]], (t) => mix([0.95, 0.76, 0.1], [0.78, 0.5, 0.06], ss(0.5, 1, t) * 0.7), { seg: 30, rad: 16, rug: 0.45 });
  const piezas = [cuerpo, pico];
  for (const s of [1, -1]) {
    piezas.push(...ojo(s, 0.027, 1.13, 0.292, 0.0085, [0.95, 0.85, 0.2]));
    // ala plegada: base (cubiertas) y plumas largas que se cruzan sobre la cola
    piezas.push(tubo([[s * 0.083, 0.725, 0.13, 0.004, 0.04], [s * 0.091, 0.685, -0.02, 0.012, 0.078], [s * 0.08, 0.63, -0.22, 0.009, 0.055], [s * 0.05, 0.585, -0.42, 0.003, 0.012], [s * 0.035, 0.575, -0.47, 0, 0]], (t, nx, ny, x, y, z) => tinte(mix(BLANCO, [0.74, 0.78, 0.84], ss(0.5, 0.95, t) * 0.4), escamas(x, y, z, 0.05)), { seg: 70, rad: 18 }));
    for (let k = 0; k < 11; k++) { const u = k / 10; piezas.push(pluma([s * (0.084 - 0.004 * u), 0.7 - 0.09 * u, 0.1 - 0.3 * u], [-s * (0.03 + 0.05 * u), -0.06 - 0.03 * u, -1], 0.34 - 0.11 * u, 0.034, (t) => mix(BLANCO, [0.78, 0.81, 0.86], t * 0.55), { lado: s, curv: -0.12 })); }
    // patas: tibia con piel amarillenta arriba, tarso negro, dedos largos
    piezas.push(tubo([[s * 0.048, 0.66, 0.0, 0.02, 0.02], [s * 0.05, 0.52, -0.012, 0.0125, 0.0125], [s * 0.05, 0.36, -0.04, 0.0085, 0.0085], [s * 0.05, 0.19, -0.015, 0.0072, 0.0072], [s * 0.05, 0.02, 0.018, 0.0082, 0.0082]], (t) => mix([0.9, 0.9, 0.86], [0.07, 0.07, 0.06], ss(0.2, 0.42, t)), { seg: 90, rad: 14, rug: 0.6 }));
    for (const d of [-0.03, 0, 0.03]) piezas.push(tubo([[s * 0.05, 0.018, 0.018, 0.0075, 0.0075], [s * (0.05 + d * 0.7), 0.009, 0.1, 0.005, 0.005], [s * (0.05 + d * 1.4), 0.005, 0.16, 0.0035, 0.0035]], plano([0.06, 0.06, 0.055]), { seg: 20, rad: 10, rug: 0.6 }));
    piezas.push(tubo([[s * 0.05, 0.018, 0.018, 0.0075, 0.0075], [s * 0.05, 0.008, -0.03, 0.005, 0.005], [s * 0.05, 0.005, -0.06, 0.0035, 0.0035]], plano([0.06, 0.06, 0.055]), { seg: 12, rad: 10, rug: 0.6 }));
  }
  // plumas nupciales (aigrettes) que caen sobre la cola
  for (const x of [-0.035, -0.018, 0, 0.018, 0.035]) piezas.push(tubo([[x, 0.725, 0.0, 0.002, 0.012], [x * 1.4, 0.75, -0.14, 0.002, 0.014], [x * 2, 0.7, -0.3, 0.0015, 0.008], [x * 2.6, 0.62, -0.42, 0, 0]], (t) => mix([0.97, 0.97, 0.95], [0.86, 0.88, 0.9], t * 0.6), { seg: 40, rad: 8 }));
  return unir(piezas);
}

/* ----------------------------------------------------------------- tingua de pico rojo (Gallinula galeata) ----------------------------------------------------------------- */
function tingua() {
  const PIZARRA = [0.1, 0.13, 0.21], NEGRUZCO = [0.045, 0.055, 0.09], OLIVA = [0.25, 0.22, 0.1];
  const cuerpo = tubo([
    [0, 0.215, -0.185, 0, 0], [0, 0.2, -0.14, 0.026, 0.02], [0, 0.17, -0.07, 0.066, 0.057], [0, 0.162, 0.02, 0.083, 0.072], [0, 0.18, 0.09, 0.068, 0.07], [0, 0.225, 0.122, 0.036, 0.046],
    [0, 0.27, 0.132, 0.026, 0.03], [0, 0.305, 0.14, 0.025, 0.027], [0, 0.327, 0.163, 0.029, 0.029], [0, 0.329, 0.19, 0.03, 0.028], [0, 0.325, 0.213, 0.017, 0.016]
  ], (t, nx, ny, nz, x, y, z) => tinte(t > 0.55 ? mix(NEGRUZCO, PIZARRA, 0.2) : mix(mix(PIZARRA, [0.2, 0.26, 0.38], ss(-0.2, 0.9, ny) * 0.55), OLIVA, ss(0.55, 1, ny) * ss(0.55, 0.1, t) * 0.8), escamas(x, y, z, 0.1)), { seg: 200, rad: 32 });
  const pico = tubo([[0, 0.326, 0.205, 0.0135, 0.0125], [0, 0.322, 0.235, 0.0105, 0.0095], [0, 0.317, 0.262, 0.0035, 0.0035], [0, 0.316, 0.268, 0, 0]], (t) => t > 0.7 ? [0.96, 0.86, 0.2] : [0.86, 0.09, 0.06], { seg: 24, rad: 16, rug: 0.4 });
  const piezas = [cuerpo, pico, esf(0, 0.345, 0.2, 0.0145, 0.02, 0.0175, [0.86, 0.08, 0.06], 0.35),
    tubo([[0, 0.176, -0.095, 0.02, 0.012], [0, 0.19, -0.15, 0.017, 0.012], [0, 0.208, -0.19, 0.004, 0.004], [0, 0.212, -0.195, 0, 0]], plano([0.93, 0.93, 0.9]), { seg: 24, rad: 12 })];
  for (const s of [1, -1]) {
    piezas.push(...ojo(s, 0.028, 0.333, 0.194, 0.0065, [0.55, 0.12, 0.08]));
    piezas.push(tubo([[s * 0.074, 0.2, 0.075, 0.008, 0.035], [s * 0.083, 0.178, -0.02, 0.014, 0.05], [s * 0.062, 0.168, -0.13, 0.007, 0.024], [s * 0.025, 0.188, -0.185, 0, 0]], (t, nx, ny, x, y, z) => tinte(mix(OLIVA, [0.14, 0.14, 0.12], ss(0.3, 1, t) * 0.7 + ss(-0.1, -0.8, ny) * 0.3), escamas(x, y, z, 0.12)), { seg: 60, rad: 16 }));
    for (let k = 0; k < 6; k++) piezas.push(pluma([s * (0.078 - 0.003 * k), 0.185 - 0.004 * k, 0.0 - 0.025 * k], [-s * 0.05, -0.04, -1], 0.17 - 0.012 * k, 0.026, (t) => mix([0.2, 0.19, 0.12], [0.09, 0.1, 0.12], t), { lado: s, curv: -0.1 }));
    piezas.push(tubo([[s * 0.087, 0.157, 0.05, 0.004, 0.005], [s * 0.09, 0.153, -0.04, 0.005, 0.006], [s * 0.075, 0.152, -0.12, 0.002, 0.003]], plano([0.95, 0.95, 0.92]), { seg: 24, rad: 8 })); // franja blanca del flanco
    piezas.push(tubo([[s * 0.046, 0.15, 0.01, 0.016, 0.016], [s * 0.05, 0.1, 0.0, 0.0095, 0.0095], [s * 0.05, 0.045, -0.012, 0.0062, 0.0062], [s * 0.05, 0.011, 0.015, 0.0068, 0.0068]], (t) => t < 0.28 ? mix(NEGRUZCO, [0.9, 0.35, 0.1], ss(0.05, 0.15, t)) : mix([0.88, 0.45, 0.1], [0.68, 0.76, 0.22], ss(0.28, 0.45, t)), { seg: 44, rad: 14, rug: 0.6 }));
    for (const d of [-0.026, 0, 0.026]) piezas.push(tubo([[s * 0.05, 0.012, 0.015, 0.0065, 0.0065], [s * (0.05 + d * 0.8), 0.007, 0.065, 0.0042, 0.0042], [s * (0.05 + d * 1.5), 0.0045, 0.105, 0.003, 0.003]], plano([0.66, 0.74, 0.2]), { seg: 16, rad: 10, rug: 0.6 }));
    piezas.push(tubo([[s * 0.05, 0.012, 0.015, 0.0065, 0.0065], [s * 0.05, 0.007, -0.01, 0.004, 0.004], [s * 0.05, 0.0045, -0.04, 0.003, 0.003]], plano([0.66, 0.74, 0.2]), { seg: 10, rad: 10, rug: 0.6 }));
  }
  return unir(piezas);
}

/* ----------------------------------------------------------------- gaviota andina (Chroicocephalus serranus), en vuelo planeado ----------------------------------------------------------------- */
function gaviota() {
  const GRIS = [0.7, 0.73, 0.78], ENCAPUCHADO = [0.17, 0.11, 0.09], ROJO = [0.8, 0.12, 0.1];
  const cuerpo = tubo([
    [0, 0.0, -0.2, 0, 0], [0, 0.0, -0.16, 0.022, 0.02], [0, 0.0, -0.07, 0.05, 0.052], [0, 0.005, 0.05, 0.058, 0.06], [0, 0.012, 0.15, 0.045, 0.048], [0, 0.02, 0.2, 0.032, 0.034],
    [0, 0.026, 0.235, 0.034, 0.034], [0, 0.026, 0.268, 0.034, 0.033], [0, 0.02, 0.295, 0.016, 0.016], [0, 0.018, 0.305, 0.004, 0.004]
  ], (t, nx, ny, nz, x, y, z) => tinte(mix(mix(BLANCO, [0.86, 0.88, 0.9], ss(0.1, -0.9, ny) * 0.5), ENCAPUCHADO, ss(0.225, 0.245, z)), escamas(x, y, z, 0.05)), { seg: 220, rad: 32 });
  const pico = tubo([[0, 0.02, 0.292, 0.0085, 0.0095], [0, 0.017, 0.318, 0.0065, 0.0075], [0, 0.0105, 0.346, 0.0028, 0.0028], [0, 0.009, 0.353, 0, 0]], plano(ROJO), { seg: 24, rad: 14, rug: 0.4 });
  const piezas = [cuerpo, pico];
  // cola: abanico de rectrices blancas
  for (let k = 0; k < 11; k++) { const a = (k - 5) / 5; piezas.push(pluma([a * 0.012, 0.0, -0.15], [a * 0.28, -0.02, -1], 0.17 - 0.012 * Math.abs(a) * 4, 0.036, (t) => mix(BLANCO, [0.86, 0.88, 0.9], t * 0.4), { lado: a >= 0 ? 1 : -1, curv: 0.02 })); }
  const wx = (u) => 0.045 + 0.223 * u, wy = (u) => 0.15 * u * (2 - u), zle = (u) => 0.055 - 0.03 * u, chord = (u) => 0.185 - 0.03 * u; // brazo del ala (u: 0 hombro … 1 muñeca)
  for (const s of [1, -1]) {
    piezas.push(...ojo(s, 0.0305, 0.034, 0.268, 0.0075, [0.96, 0.96, 0.95]));
    // brazo: superficie con las cubiertas; el borde de ataque lleva un tubo (hueso y músculo)
    piezas.push(superficie(24, 10, (u, v) => [s * wx(u), wy(u) + 0.012 * Math.sin(Math.PI * v) * (1 - 0.6 * u) - 0.012 * v * v, zle(u) - v * 0.6 * chord(u)], (u, v) => tinte(mix([0.76, 0.79, 0.83], GRIS, ss(0, 0.9, v) * 0.7), 0.97 + 0.06 * hash(Math.round(u * 24), Math.round(v * 10), 3)), 0.9));
    piezas.push(tubo([[s * 0.045, 0.0, 0.05, 0.013, 0.017], [s * 0.15, 0.07, 0.045, 0.011, 0.014], [s * 0.268, 0.148, 0.028, 0.012, 0.014], [s * 0.4, 0.1, 0.0, 0.006, 0.008], [s * 0.5, 0.03, -0.09, 0.0025, 0.003], [s * 0.53, 0.0, -0.13, 0, 0]], (t) => mix([0.9, 0.9, 0.9], GRIS, t * 0.8), { seg: 60, rad: 14, rug: 0.9 }));
    // secundarias a lo largo del borde de salida del brazo
    for (let j = 0; j < 12; j++) { const u = (j + 0.5) / 12; piezas.push(pluma([s * wx(u), wy(u) - 0.004 - 0.0008 * j, zle(u) - 0.56 * chord(u)], [s * (0.06 + 0.16 * u), -0.05, -1], 0.115 - 0.01 * u, 0.034, (t) => mix([0.66, 0.69, 0.74], [0.95, 0.95, 0.95], ss(0.7, 1, t)), { lado: s, curv: -0.14 })); }
    // cubiertas primarias (grises) sobre la base de las primarias
    for (let k = 0; k < 7; k++) { const th = 0.12 + 0.12 * k; piezas.push(pluma([s * 0.272, 0.152 - 0.0015 * k, -0.005 - 0.012 * k], [s * Math.cos(th), -0.2, -Math.sin(th)], 0.12 - 0.006 * k, 0.04, (t) => mix([0.72, 0.75, 0.8], [0.62, 0.65, 0.7], t), { lado: s, curv: -0.05 })); }
    // primarias: 9 plumas en abanico, negras (las dos externas con espejo blanco), la mano del ala
    const L = [0.34, 0.345, 0.33, 0.31, 0.285, 0.26, 0.23, 0.2, 0.17];
    for (let k = 0; k < 9; k++) { const th = 0.1 + 0.9 * (k / 8) * (k / 8) + 0.11 * k / 8; piezas.push(pluma([s * 0.27, 0.148 + 0.0012 * k, -0.01 - 0.01 * k], [s * Math.cos(th), -0.17 - 0.03 * k / 8, -Math.sin(th)], L[k], 0.042, (t) => k <= 2 ? mix(mix([0.06, 0.06, 0.07], [0.96, 0.96, 0.96], ss(0.48, 0.58, t) * ss(0.78, 0.68, t) * (k === 0 ? 0.6 : 0.9)), [0.05, 0.05, 0.06], ss(0.8, 0.9, t) * 0.6) : mix([0.3, 0.31, 0.34], [0.05, 0.05, 0.06], ss(0.15, 0.6, t)), { lado: s, curv: -0.16 - 0.04 * (k === 0) }));
    }
  }
  // patas rojas recogidas bajo la cola
  for (const s of [1, -1]) piezas.push(tubo([[s * 0.02, -0.03, -0.1, 0.006, 0.006], [s * 0.022, -0.045, -0.16, 0.005, 0.005], [s * 0.024, -0.05, -0.2, 0.003, 0.003]], plano(ROJO), { seg: 24, rad: 10, rug: 0.5 }), esf(s * 0.024, -0.05, -0.21, 0.008, 0.003, 0.014, ROJO, 0.5));
  return unir(piezas);
}

export function geometriaAveMenu(id) { return id === 'garza' ? garza() : id === 'tingua' ? tingua() : id === 'gaviota' ? gaviota() : null; }
