// REN3D · aves3d.js
// Aves 3D de varias piezas (cuerpo, cuello, cabeza, pico, ojos, patas, alas) con color por vértice y plumaje de cada especie:
// patos (macho y hembra tipo cuaquero), fochas (tinguas), garzas blancas posadas y en vuelo, y patos en vuelo.
// Se reparten por todos los humedales y lagunas de los datos; las que nadan se mueven dentro del agua, las garzas caminan en la orilla
// y las que vuelan dan vueltas sobre el humedal batiendo las alas.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const rnd = (i) => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const lin = (c) => c.map(v => Math.pow(v, 2.2)); // los colores se escriben en sRGB y se pasan a lineal
const mezcla = (a, b, t) => a.map((v, i) => v + (b[i] - v) * Math.max(0, Math.min(1, t)));
const paso = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// elipsoide con color por vértice (col = [r,g,b] o función (ux,uy,uz) del punto sobre la esfera unidad), inclinación (pitch) y alabeo (roll)
function elip(cx, cy, cz, rx, ry, rz, col, o = {}) {
  const g = new THREE.SphereGeometry(1, o.w || 10, o.h || 7); g.deleteAttribute('uv');
  const p = g.attributes.position, c = new Float32Array(p.count * 3), aW = new Float32Array(p.count);
  const cp = Math.cos(o.pitch || 0), sp = Math.sin(o.pitch || 0), cr = Math.cos(o.roll || 0), sr = Math.sin(o.roll || 0);
  for (let i = 0; i < p.count; i++) {
    const ux = p.getX(i), uy = p.getY(i), uz = p.getZ(i), k = lin(typeof col === 'function' ? col(ux, uy, uz) : col);
    c[i * 3] = k[0]; c[i * 3 + 1] = k[1]; c[i * 3 + 2] = k[2];
    let x = ux * rx, y = uy * ry, z = uz * rz;
    const y2 = y * cp - z * sp, z2 = y * sp + z * cp; y = y2; z = z2;
    const x2 = x * cr - y * sr, y3 = x * sr + y * cr; x = x2; y = y3;
    p.setXYZ(i, x + cx, y + cy, z + cz);
  }
  g.computeVertexNormals();
  g.setAttribute('color', new THREE.BufferAttribute(c, 3)); g.setAttribute('aW', new THREE.BufferAttribute(aW, 1));
  return g;
}
const espejo = (g) => { const h = g.clone(); const p = h.attributes.position; for (let i = 0; i < p.count; i++) p.setX(i, -p.getX(i)); const n = h.attributes.normal; for (let i = 0; i < n.count; i++) n.setX(i, -n.getX(i)); return h; };
const unir = (gs) => mergeGeometries(gs.map(g => g.index ? g.toNonIndexed() : g));

// ala plana con 9 estaciones a lo largo de la envergadura (para que se doble al batir); cada estación = borde de ataque + borde de salida
function ala(lado, envergadura, r0, cuerda, colorFn, amp, barrido) {
  const n = 9, P = [], C = [], A = [], N = [], I = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1), x = lado * (r0 + (envergadura - r0) * t), ch = cuerda * (1 - 0.6 * t * t), sw = (barrido || 0.2) * t * t * envergadura;
    let zL = ch * 0.4 - sw, zT = -ch * 0.6 - sw;
    if (t > 0.66) zT += (i % 2 ? 0.07 : -0.02) * cuerda; // puntas de las plumas primarias
    const cL = lin(colorFn(t, 0)), cT = lin(colorFn(t, 1));
    P.push(x, 0, zL, x, 0, zT); C.push(...cL, ...cT); A.push(amp, amp); N.push(0, 1, 0, 0, 1, 0);
    if (i < n - 1) { const a = i * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('aW', new THREE.Float32BufferAttribute(A, 1)); g.setIndex(I);
  return g;
}

const NEGRO = [0.03, 0.03, 0.035], BLANCO = [0.93, 0.93, 0.9];

/* ------------------------------------------------------------------ modelos ------------------------------------------------------------------ */
// pato (cuaquero) nadando: 'macho' cabeza verde irisada, anillo blanco, pecho castaño y cola negra; 'hembra' pardo moteado; 'focha' negra con pico blanco
// 'tingua' = tingua de pico rojo (plumaje azul pizarra, escudo y pico rojos, cola blanca por debajo); 'turrio' = pato turrio (castaño, cabeza negra, pico azul, cola parada)
function modeloNadador(especie) {
  const m = especie === 'macho', ti = especie === 'tingua', u = especie === 'turrio', f = especie === 'focha' || ti;
  const cuerpo = (ux, uy, uz) => {
    if (ti) { let c = mezcla([0.13, 0.15, 0.3], [0.2, 0.27, 0.4], paso(-0.2, 0.9, uy) * 0.6); c = mezcla(c, [0.24, 0.27, 0.15], paso(0.45, 0.95, uy) * 0.6); return mezcla(c, [0.9, 0.9, 0.86], paso(-0.55, -0.85, uz) * paso(0.1, -0.5, uy)); }
    if (u) { const b = 0.5 + 0.5 * Math.sin(ux * 29 + uz * 37 + uy * 19); return mezcla([0.42, 0.15, 0.08], [0.58, 0.26, 0.12], b * 0.5 + paso(-0.5, 0.6, uy) * 0.35); }
    if (f) return mezcla([0.11, 0.12, 0.13], [0.2, 0.21, 0.22], paso(-0.2, 0.9, uy) * 0.4);
    if (!m) { const b = 0.5 + 0.5 * Math.sin(ux * 23 + uz * 31 + uy * 17); return mezcla([0.34, 0.25, 0.16], [0.52, 0.4, 0.27], b * 0.8 + paso(-0.6, 0.1, uy) * 0.2); }
    let c = mezcla([0.62, 0.61, 0.57], [0.4, 0.35, 0.28], paso(0.1, 0.8, uy)); // flancos gris claro, dorso pardo
    c = mezcla(c, [0.78, 0.77, 0.72], paso(-0.1, -0.7, uy) * 0.7);          // vientre
    c = mezcla(c, [0.38, 0.16, 0.11], paso(0.35, 0.8, uz) * paso(-0.5, 0.2, uy)); // pecho castaño
    return mezcla(c, [0.06, 0.06, 0.08], paso(-0.55, -0.9, uz));            // grupa negra
  };
  const cabezaC = ti ? [0.1, 0.12, 0.26] : u ? [0.04, 0.04, 0.05] : f ? [0.07, 0.07, 0.08] : m ? [0.04, 0.29, 0.13] : [0.5, 0.4, 0.3];
  const picoC = ti ? [0.82, 0.1, 0.07] : u ? [0.3, 0.5, 0.78] : f ? [0.93, 0.93, 0.88] : m ? [0.78, 0.72, 0.16] : [0.78, 0.5, 0.16];
  const cuelloC = ti ? [0.1, 0.12, 0.26] : u ? [0.05, 0.05, 0.06] : f ? [0.08, 0.08, 0.09] : m ? [0.04, 0.29, 0.13] : [0.46, 0.36, 0.26];
  const alaC = (ux, uy, uz) => ti ? [0.2, 0.25, 0.2] : u ? [0.36, 0.14, 0.08] : f ? [0.14, 0.15, 0.16] : (m ? mezcla([0.45, 0.4, 0.33], [0.14, 0.26, 0.62], paso(-0.1, -0.7, uz) * paso(0.2, 0.9, Math.abs(ux) + uy * 0.3)) : mezcla([0.38, 0.29, 0.2], [0.14, 0.26, 0.62], paso(-0.2, -0.7, uz) * 0.7));
  const piezas = [
    elip(0, 0.075, 0, 0.125, 0.10, 0.27, cuerpo),
    u ? elip(0, 0.2, -0.3, 0.025, 0.03, 0.12, [0.1, 0.05, 0.04], { pitch: -0.9 }) // cola parada del turrio
      : elip(0, 0.125, -0.29, 0.04, 0.035, 0.09, ti ? [0.9, 0.9, 0.86] : f ? [0.1, 0.1, 0.11] : m ? [0.06, 0.06, 0.08] : [0.3, 0.23, 0.15], { pitch: 0.5 }),
    elip(0, 0.2, f ? 0.2 : 0.205, 0.045, f ? 0.07 : 0.085, 0.05, cuelloC, { pitch: f ? 0.22 : 0.35 }),
    elip(0, f ? 0.28 : 0.30, f ? 0.235 : 0.245, 0.058, 0.058, 0.072, cabezaC),
    elip(0, f ? 0.268 : 0.285, f ? 0.31 : 0.325, f ? 0.026 : 0.03, 0.011, f ? 0.05 : 0.055, picoC, { pitch: 0.12 }),
    elip(0.04, f ? 0.294 : 0.315, f ? 0.25 : 0.26, 0.009, 0.009, 0.009, NEGRO, { w: 6, h: 5 }), elip(-0.04, f ? 0.294 : 0.315, f ? 0.25 : 0.26, 0.009, 0.009, 0.009, NEGRO, { w: 6, h: 5 }),
    elip(0.115, 0.115, -0.03, 0.035, 0.07, 0.2, alaC, { roll: -0.15 }), elip(-0.115, 0.115, -0.03, 0.035, 0.07, 0.2, alaC, { roll: 0.15 })
  ];
  if (m) piezas.push(elip(0, 0.165, 0.18, 0.052, 0.014, 0.052, BLANCO, { pitch: 0.25 })); // anillo blanco del cuello
  if (f) piezas.push(elip(0, 0.315, 0.292, 0.012, 0.026, 0.018, ti ? [0.85, 0.1, 0.07] : [0.95, 0.95, 0.9])); // escudo frontal (rojo en la tingua, blanco en la focha)
  if (u) piezas.push(elip(0.042, 0.292, 0.255, 0.012, 0.03, 0.04, BLANCO), elip(-0.042, 0.292, 0.255, 0.012, 0.03, 0.04, BLANCO)); // mejillas blancas
  return unir(piezas);
}
// garza blanca posada (patas largas, cuello en S, pico amarillo largo)
// ganado = garza del ganado (más pequeña y rechoncha, cabeza, cuello y dorso color crema anaranjado, pico amarillo, patas pardas)
function modeloGarzaPie(ganado) {
  const o = ganado ? [0.3, 0.22, 0.12] : [0.12, 0.11, 0.1], Y = ganado ? [0.95, 0.7, 0.1] : [0.9, 0.74, 0.14], CR = ganado ? [0.88, 0.64, 0.36] : BLANCO;
  const piezas = [
    elip(0, 0.62, 0, 0.065, 0.085, 0.2, BLANCO, { pitch: -0.15 }),
    elip(0, 0.6, -0.24, 0.025, 0.03, 0.08, BLANCO, { pitch: 0.2 }),
    elip(0.03, 0.3, 0.02, 0.009, 0.3, 0.009, o, { w: 6, h: 5 }), elip(-0.03, 0.3, 0.02, 0.009, 0.3, 0.009, o, { w: 6, h: 5 }),
    elip(0.03, 0.01, 0.05, 0.015, 0.006, 0.05, o, { w: 6, h: 5 }), elip(-0.03, 0.01, 0.05, 0.015, 0.006, 0.05, o, { w: 6, h: 5 }),
    elip(0, 0.72, 0.17, 0.03, 0.07, 0.03, BLANCO, { pitch: 0.5 }), elip(0, 0.83, 0.21, 0.026, 0.06, 0.026, ganado ? CR : BLANCO, { pitch: -0.2 }),
    elip(0, 0.95, 0.19, 0.024, 0.07, 0.024, CR, { pitch: 0.3 }), elip(0, 1.05, 0.215, 0.022, 0.045, 0.022, CR, { pitch: 0.9 }),
    elip(0, 1.075, 0.265, 0.022, 0.024, 0.05, CR), elip(0, 1.065, 0.37, 0.011, 0.011, 0.1, Y, { pitch: 0.06 }),
    elip(0.02, 1.085, 0.27, 0.006, 0.006, 0.006, NEGRO, { w: 5, h: 4 }), elip(-0.02, 1.085, 0.27, 0.006, 0.006, 0.006, NEGRO, { w: 5, h: 4 }),
    elip(0.075, 0.63, -0.02, 0.025, 0.07, 0.2, BLANCO), elip(-0.075, 0.63, -0.02, 0.025, 0.07, 0.2, BLANCO)
  ];
  if (ganado) piezas.push(elip(0, 0.7, 0.02, 0.05, 0.05, 0.12, CR, { pitch: -0.1 })); // mancha crema del dorso
  return unir(piezas);
}
// gaviota andina en vuelo: cuerpo blanco, cabeza oscura, alas grises con puntas negras, pico y patas rojos
function modeloGaviotaVuelo() {
  const aC = (t, borde) => t > 0.78 ? [0.05, 0.05, 0.06] : borde === 1 ? mezcla([0.62, 0.65, 0.7], BLANCO, 0.45) : [0.62, 0.65, 0.7];
  return unir([
    elip(0, 0, 0, 0.065, 0.06, 0.2, BLANCO), elip(0, 0.015, 0.22, 0.045, 0.045, 0.055, [0.2, 0.14, 0.12]),
    elip(0, 0.005, 0.285, 0.011, 0.01, 0.045, [0.78, 0.12, 0.1]), elip(0, 0.005, -0.22, 0.05, 0.015, 0.07, BLANCO),
    ala(1, 0.62, 0.05, 0.2, aC, 0.7, 0.14), ala(-1, 0.62, 0.05, 0.2, aC, 0.7, 0.14)
  ]);
}
// pez plateado (para el pico de las garzas y los peces del juego): lomo gris azulado, vientre blanco
function modeloPez() {
  const cu = (ux, uy, uz) => mezcla([0.42, 0.5, 0.56], [0.92, 0.94, 0.93], paso(0.1, -0.6, uy));
  return unir([elip(0, 0, 0, 0.035, 0.05, 0.15, cu, { w: 8, h: 6 }), elip(0, 0, -0.16, 0.006, 0.05, 0.05, [0.5, 0.56, 0.6], { w: 6, h: 4 })]);
}
// garza en vuelo: cuello recogido en S, patas largas hacia atrás, alas anchas
function modeloGarzaVuelo() {
  const o = [0.12, 0.11, 0.1], Y = [0.9, 0.74, 0.14];
  const aC = (t, borde) => mezcla(BLANCO, [0.78, 0.78, 0.76], t * 0.5);
  return unir([
    elip(0, 0, 0, 0.06, 0.07, 0.2, BLANCO), elip(0, 0.03, 0.2, 0.03, 0.045, 0.07, BLANCO, { pitch: 0.9 }), elip(0, 0.045, 0.27, 0.022, 0.022, 0.045, BLANCO),
    elip(0, 0.04, 0.36, 0.01, 0.01, 0.09, Y), elip(0, 0.01, -0.25, 0.04, 0.02, 0.08, BLANCO),
    elip(0.02, -0.01, -0.42, 0.008, 0.008, 0.2, o, { w: 6, h: 5 }), elip(-0.02, -0.01, -0.42, 0.008, 0.008, 0.2, o, { w: 6, h: 5 }),
    ala(1, 0.82, 0.06, 0.36, aC, 0.9, 0.22), ala(-1, 0.82, 0.06, 0.36, aC, 0.9, 0.22)
  ]);
}
// pato en vuelo: cuello estirado, alas con espejo azul
function modeloPatoVuelo() {
  const aC = (t, borde) => borde === 0 ? [0.42, 0.36, 0.28] : mezcla(mezcla([0.36, 0.3, 0.23], [0.14, 0.27, 0.66], paso(0.1, 0.25, t) * paso(0.62, 0.45, t)), BLANCO, paso(0.8, 1, t) * 0.4);
  return unir([
    elip(0, 0, 0, 0.095, 0.085, 0.24, (ux, uy, uz) => mezcla([0.5, 0.45, 0.38], [0.78, 0.77, 0.72], paso(0, -0.8, uy))),
    elip(0, 0.01, 0.26, 0.04, 0.04, 0.12, [0.04, 0.29, 0.13]), elip(0, 0.015, 0.38, 0.05, 0.05, 0.065, [0.04, 0.29, 0.13]),
    elip(0, 0.005, 0.455, 0.027, 0.01, 0.05, [0.78, 0.72, 0.16]), elip(0, 0, -0.27, 0.05, 0.02, 0.08, [0.07, 0.07, 0.09]),
    ala(1, 0.5, 0.07, 0.22, aC, 0.8, 0.2), ala(-1, 0.5, 0.07, 0.22, aC, 0.8, 0.2)
  ]);
}

/* ------------------------------------------------------------------ geometría de los cuerpos de agua ------------------------------------------------------------------ */
const dentro = (x, z, v) => { let ins = false; for (let i = 0, j = v.length - 1; i < v.length; j = i++) { if (((v[i][1] > z) !== (v[j][1] > z)) && (x < (v[j][0] - v[i][0]) * (z - v[i][1]) / (v[j][1] - v[i][1]) + v[i][0])) ins = !ins; } return ins; };
function distBorde(x, z, v) { let m = 1e9; for (let i = 0; i < v.length; i++) { const a = v[i], b = v[(i + 1) % v.length], dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1e-9, t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / l2)); const q = Math.hypot(x - (a[0] + t * dx), z - (a[1] + t * dz)); if (q < m) m = q; } return m; }

export function crearAves(T3, W, lw) {
  const cuerpos = [];
  for (const w of W || []) {
    if (!/humedal|laguna/i.test(w.tipo || '')) continue;
    const pts = w.pts.map(p => lw(p[0], p[1]));
    if (pts.length < 4 || Math.hypot(pts[0][0] - pts[pts.length - 1][0], pts[0][1] - pts[pts.length - 1][1]) > 1.0) continue;
    pts.pop();
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9, a = 0, cx = 0, cz = 0;
    for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); a += p[0] * q[1] - q[0] * p[1]; cx += p[0]; cz += p[1]; }
    const area = Math.abs(a) / 2; if (area < 3000) continue;
    cuerpos.push({ nombre: w.nombre || '', burro: /burro/i.test(w.nombre || ''), pts, area, x0, x1, z0, z1, cx: cx / pts.length, cz: cz / pts.length, y: 0.35 });
  }
  const semilla = { n: 1 };
  const R = () => rnd(semilla.n++);
  const punto = (c, margen, maxMargen) => {
    for (let t = 0; t < 80; t++) {
      const x = c.x0 + R() * (c.x1 - c.x0), z = c.z0 + R() * (c.z1 - c.z0);
      if (!dentro(x, z, c.pts)) continue;
      const d = distBorde(x, z, c.pts); if (d >= margen && d <= (maxMargen || 1e9)) return [x, z];
    }
    return null;
  };
  // sitio de descanso/nido fuera del agua (entre los árboles de la ribera) adonde las garzas se llevan el pez
  const nido = (c) => {
    for (let t = 0; t < 60; t++) {
      const x = c.x0 - 200 + R() * (c.x1 - c.x0 + 400), z = c.z0 - 200 + R() * (c.z1 - c.z0 + 400);
      if (dentro(x, z, c.pts)) continue;
      const d = distBorde(x, z, c.pts); if (d >= 40 && d <= 180) return [x, z];
    }
    return [c.cx + 300, c.cz];
  };

  // aves por tipo: cada una con su malla instanciada
  const TIPOS = [
    { id: 'macho', geo: modeloNadador('macho'), freq: 0, mov: 'nada', esc: 0.95 },
    { id: 'hembra', geo: modeloNadador('hembra'), freq: 0, mov: 'nada', esc: 0.95 },
    { id: 'focha', geo: modeloNadador('focha'), freq: 0, mov: 'nada', esc: 0.85 },
    { id: 'garza', geo: modeloGarzaPie(false), freq: 0, mov: 'camina', esc: 1.0 },
    { id: 'garzaVuelo', geo: modeloGarzaVuelo(), freq: 2.3, mov: 'vuela', esc: 1.15 },
    { id: 'patoVuelo', geo: modeloPatoVuelo(), freq: 7.5, mov: 'vuela', esc: 1.0 },
    { id: 'tingua', geo: modeloNadador('tingua'), freq: 0, mov: 'nada', esc: 0.85 },
    { id: 'turrio', geo: modeloNadador('turrio'), freq: 0, mov: 'nada', esc: 0.85 },
    { id: 'garzaGanado', geo: modeloGarzaPie(true), freq: 0, mov: 'camina', esc: 0.62 },
    { id: 'gaviota', geo: modeloGaviotaVuelo(), freq: 4.2, mov: 'vuela', esc: 1.1 }
  ];
  const T = {}; TIPOS.forEach((t, i) => { T[t.id] = i; });
  const aves = [];
  const agregar = (tipo, c, x, z, extra) => aves.push({ tipo, c, x, z, h: R() * 6.28, th: R() * 6.28, tt: R() * 4, v: 0, pausa: R() * 3, ph: R() * 6.28, esc: TIPOS[tipo].esc * (0.92 + R() * 0.16), dab: 0, sigDab: 8 + R() * 30, k: 0, pez: false, ...extra });
  let totalNad = 0;
  const nadadores = (c, id, n, margen, vmin, vr) => { for (let i = 0; i < n; i++) { const p = punto(c, margen); if (p) { agregar(T[id], c, p[0], p[1], { vel: vmin + R() * vr }); totalNad++; } } };
  const zancudas = (c, id, n, mx) => { for (let i = 0; i < n; i++) { const p = punto(c, 0.8, mx); if (p) agregar(T[id], c, p[0], p[1], { vel: 0.1 + R() * 0.1, sigPesca: 4 + R() * 25, fase: 0, tf: 0 }); } };
  const pescadoras = (c, n, radio) => { for (let i = 0; i < n; i++) agregar(T.garzaVuelo, c, c.cx, c.cz, { vuelo: true, pesca: true, est: 'orbita', t: 2 + R() * 22, ca: R() * 6.28, cr: radio * (0.45 + R() * 0.7), alt: 26 + R() * 30, dir: R() < 0.5 ? 1 : -1, vel: 9 + R() * 3, fr: 2.1 + R() * 0.5, yv: 30, dx: 0, dz: 0, pit: 0, rol: 0 }); };
  cuerpos.forEach((c) => {
    if (c.burro) { // Humedal El Burro: muchísimas más aves, de varias especies que sí viven allí
      nadadores(c, 'macho', 70, 3, 0.3, 0.35);   // pato canadiense / cuaquero (macho)
      nadadores(c, 'hembra', 60, 3, 0.3, 0.35);  // hembras
      nadadores(c, 'turrio', 45, 3, 0.25, 0.3);  // pato turrio
      nadadores(c, 'focha', 36, 2.5, 0.25, 0.3); // focha americana
      nadadores(c, 'tingua', 34, 2, 0.25, 0.3);  // tingua de pico rojo
      zancudas(c, 'garza', 22, 8);               // garza real en las orillas
      zancudas(c, 'garzaGanado', 16, 6);         // garza del ganado
      return;
    }
    const nPatos = Math.max(4, Math.min(70, Math.round(c.area / 1100))), nFocha = Math.max(2, Math.min(14, Math.round(c.area / 5500))), nGarza = Math.max(1, Math.min(8, Math.round(c.area / 9000)));
    for (let i = 0; i < nPatos; i++) { const p = punto(c, 3); if (p) { agregar(i % 3 === 2 ? 1 : 0, c, p[0], p[1], { vel: 0.3 + R() * 0.35 }); totalNad++; } }
    nadadores(c, 'focha', nFocha, 2.5, 0.25, 0.3);
    nadadores(c, 'tingua', Math.max(1, Math.round(c.area / 11000)), 2, 0.25, 0.3);
    zancudas(c, 'garza', nGarza, 7);
  });
  // en vuelo: sobre los humedales más grandes
  const grandes = cuerpos.slice().sort((a, b) => b.area - a.area).slice(0, 7);
  grandes.forEach((c) => {
    const radio = Math.max(60, Math.min(220, Math.sqrt(c.area) * 0.45));
    if (c.burro) {
      pescadoras(c, 16, radio); // garzas que llegan al agua, atrapan un pez y se lo llevan
      for (let f = 0; f < 3; f++) { // tres bandadas de patos
        const ca0 = R() * 6.28, dir = R() < 0.5 ? 1 : -1;
        for (let i = 0; i < 10; i++) agregar(T.patoVuelo, c, c.cx, c.cz, { vuelo: true, ca: ca0 + i * 0.035, cr: radio * (0.7 + 0.15 * f) + (i % 2) * 6, alt: 36 + f * 9 + (i % 3) * 3, dir, vel: 12 + R() * 1.2, fr: 7 + R() * 1.2 });
      }
      for (let i = 0; i < 10; i++) agregar(T.gaviota, c, c.cx, c.cz, { vuelo: true, ca: R() * 6.28, cr: radio * (0.6 + R() * 0.6), alt: 45 + R() * 40, dir: R() < 0.5 ? 1 : -1, vel: 8 + R() * 3, fr: 3.6 + R() * 0.8 });
      return;
    }
    pescadoras(c, 4, radio);
    const ca0 = R() * 6.28, dir = R() < 0.5 ? 1 : -1; // bandada de patos: varios con casi la misma órbita
    for (let i = 0; i < 10; i++) agregar(T.patoVuelo, c, c.cx, c.cz, { vuelo: true, ca: ca0 + i * 0.035, cr: radio * 0.85 + (i % 2) * 6, alt: 40 + (i % 3) * 3, dir, vel: 12 + R() * 1.2, fr: 7 + R() * 1.2 });
  });

  // mallas instanciadas (una por tipo)
  const grp = new THREE.Group();
  const mats = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, metalness: 0, side: THREE.DoubleSide, envMap: T3.env || null, envMapIntensity: 0.35 });
  mats.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = T3.avesU;
    sh.vertexShader = 'attribute float aW;\nattribute float aPh;\nattribute float aFr;\nuniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      if (aW > 0.0) { float ax = abs(position.x), fl = sin(uTime * aFr + aPh); // las alas se doblan más hacia la punta
        transformed.y += fl * aW * (0.5 * ax + 0.5 * ax * ax * 1.4);
        transformed.z -= fl * aW * ax * 0.06;
        transformed.x *= (1.0 - 0.07 * abs(fl)); }`);
  };
  mats.customProgramCacheKey = () => 'aves3d-v1';
  const mallas = TIPOS.map((t, ti) => {
    const lista = aves.filter(b => b.tipo === ti), n = Math.max(1, lista.length);
    const geo = t.geo.clone();
    const ph = new Float32Array(n), fr = new Float32Array(n);
    lista.forEach((b, k) => { b.k = k; ph[k] = b.ph; fr[k] = b.fr || t.freq || 1; });
    geo.setAttribute('aPh', new THREE.InstancedBufferAttribute(ph, 1)); geo.setAttribute('aFr', new THREE.InstancedBufferAttribute(fr, 1));
    const m = new THREE.InstancedMesh(geo, mats, n); m.count = lista.length; m.frustumCulled = false; m.castShadow = false; m.receiveShadow = false;
    m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3);
    const col = new THREE.Color();
    lista.forEach((b, k) => { const v = 0.88 + R() * 0.24; col.setRGB(v, v, v * 0.97); m.setColorAt(k, col); });
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); grp.add(m);
    return m;
  });
  // peces en el pico (garzas pescando): un pez por ave que lo lleve
  const nPeces = aves.filter(b => b.tipo === T.garza || b.tipo === T.garzaGanado || b.pesca).length + 8;
  const geoPez = modeloPez(); geoPez.setAttribute('aPh', new THREE.InstancedBufferAttribute(new Float32Array(nPeces), 1)); geoPez.setAttribute('aFr', new THREE.InstancedBufferAttribute(new Float32Array(nPeces).fill(1), 1));
  const matPez = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.25, metalness: 0.5, envMap: T3.env || null, envMapIntensity: 1.1, emissive: 0x6d7d84, emissiveIntensity: 0.35 });
  matPez.onBeforeCompile = mats.onBeforeCompile;
  const peces = new THREE.InstancedMesh(geoPez, matPez, nPeces); peces.count = 0; peces.frustumCulled = false; peces.instanceMatrix.setUsage(THREE.DynamicDrawUsage); grp.add(peces);
  // ondas en el agua cuando una garza atrapa un pez
  const anillos = [];
  const geoAn = new THREE.RingGeometry(0.55, 0.7, 28); geoAn.rotateX(-Math.PI / 2);
  for (let i = 0; i < 20; i++) { const m = new THREE.Mesh(geoAn, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, fog: true })); m.visible = false; m.renderOrder = 6; m.userData.t = 99; grp.add(m); anillos.push(m); }
  let siguienteAnillo = 0;
  const anillo = (x, z) => { const m = anillos[siguienteAnillo++ % anillos.length]; m.position.set(x, 0.4, z); m.userData.t = 0; m.visible = true; };
  T3.scene.add(grp);

  const d = new THREE.Object3D(); d.rotation.order = 'YXZ';
  const dp = new THREE.Object3D(), loc = new THREE.Matrix4(), mp = new THREE.Matrix4(), pq = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, 0.15)), pe = new THREE.Vector3(1, 1, 1);
  let nPez = 0;
  const ponerPez = (matAve, lx, ly, lz) => { if (nPez >= nPeces) return; loc.compose(new THREE.Vector3(lx, ly, lz), pq, pe); mp.multiplyMatrices(matAve, loc); peces.setMatrixAt(nPez++, mp); };
  const giro = (a, b) => { let x = b - a; while (x > Math.PI) x -= 6.2832; while (x < -Math.PI) x += 6.2832; return x; };
  // vuelo hacia un punto (giro limitado); devuelve la distancia que falta
  const buscar = (b, tx, tz, v, gr, dt) => {
    const dh = giro(b.h, Math.atan2(tx - b.x, tz - b.z));
    b.h += Math.max(-gr * dt, Math.min(gr * dt, dh));
    b.x += Math.sin(b.h) * v * dt; b.z += Math.cos(b.h) * v * dt;
    b.rol = -Math.max(-0.5, Math.min(0.5, dh * 0.7));
    return Math.hypot(tx - b.x, tz - b.z);
  };
  const suave = (b, yT, dt, k) => { b.yv += (yT - b.yv) * Math.min(1, dt * k); };
  // garza pescadora: da vueltas, baja a un punto del agua, atrapa un pez, sube y se lo lleva a su nido entre los árboles; luego vuelve por otro
  const volarPescadora = (b, dt, now) => {
    const c = b.c; b.pit = 0;
    switch (b.est) {
      case 'orbita': {
        b.ca += b.dir * (b.vel / b.cr) * dt;
        const nx = c.cx + Math.cos(b.ca) * b.cr, nz = c.cz + Math.sin(b.ca) * b.cr * 0.6;
        b.h = Math.atan2(-Math.sin(b.ca) * b.dir, Math.cos(b.ca) * 0.6 * b.dir); b.x = nx; b.z = nz; b.rol = -b.dir * 0.3;
        suave(b, b.alt + Math.sin(now * 0.4 + b.ph) * 2.5, dt, 1.5); b.pit = Math.sin(now * (b.fr || 3) + b.ph) * 0.05;
        b.t -= dt; if (b.t <= 0) { const p = punto(c, 8, 90) || [c.cx, c.cz]; b.dx = p[0]; b.dz = p[1]; b.est = 'aprox'; }
        break;
      }
      case 'aprox': {
        const dist = Math.hypot(b.dx - b.x, b.dz - b.z);
        buscar(b, b.dx, b.dz, dist < 35 ? 5.5 : 9.5, 1.1, dt);
        suave(b, dist < 35 ? 1.2 + dist * 0.1 : 5 + dist * 0.12, dt, 1.6); b.pit = 0.12;
        if (dist < 3) { b.est = 'pesca'; b.t = 0; }
        break;
      }
      case 'pesca': {
        b.t += dt; b.x += Math.sin(b.h) * 3.2 * dt; b.z += Math.cos(b.h) * 3.2 * dt; b.rol *= 0.9;
        suave(b, 1.0, dt, 4); b.pit = 0.35;
        if (b.t > 0.6 && !b.pez) { b.pez = true; anillo(b.x + Math.sin(b.h) * 0.5, b.z + Math.cos(b.h) * 0.5); }
        if (b.t > 1.5) { const p = nido(c); b.dx = p[0]; b.dz = p[1]; b.est = 'huida'; }
        break;
      }
      case 'huida': {
        const dist = buscar(b, b.dx, b.dz, 9.5, 1.2, dt);
        suave(b, dist > 20 ? 20 : 12, dt, 0.9);
        if (dist < 8) { // llegó al nido: deja el pez y vuelve por otro
          b.pez = false; b.t = 3 + R() * 10;
          if (R() < 0.4) { b.ca = Math.atan2((b.z - c.cz) / 0.6, b.x - c.cx); b.cr = Math.max(50, Math.min(300, Math.hypot(b.x - c.cx, (b.z - c.cz) / 0.6))); b.est = 'orbita'; }
          else { const p = punto(c, 8, 90) || [c.cx, c.cz]; b.dx = p[0]; b.dz = p[1]; b.est = 'aprox'; }
        }
        break;
      }
    }
  };
  const api = { grp, lista: aves, total: aves.length, nadando: totalNad, cuerpos: cuerpos.length, burro: cuerpos.find(c => c.burro) || null, anillo, punto, dentro, distBorde,
    porTipo: TIPOS.map((t, i) => t.id + ':' + aves.filter(b => b.tipo === i).length).join(' ') };
  api.update = (dt, now) => {
    nPez = 0;
    for (const b of aves) {
      const t = TIPOS[b.tipo];
      let y = b.c.y, pitch = 0, roll = 0;
      if (b.pesca) {
        volarPescadora(b, dt, now); y = b.yv; pitch = b.pit; roll = b.rol;
      } else if (b.vuelo) { // órbita elíptica sobre el humedal, con alabeo hacia el centro
        b.ca += b.dir * (b.vel / b.cr) * dt;
        b.x = b.c.cx + Math.cos(b.ca) * b.cr; b.z = b.c.cz + Math.sin(b.ca) * b.cr * 0.6;
        b.h = Math.atan2(-Math.sin(b.ca) * b.dir, Math.cos(b.ca) * 0.6 * b.dir);
        y = b.alt + Math.sin(now * 0.4 + b.ph) * 2.5; roll = -b.dir * 0.3; pitch = Math.sin(now * (b.fr || 3) + b.ph) * 0.05;
      } else {
        const pescando = b.fase > 0;
        b.pausa -= dt;
        if (b.pausa <= 0 && b.dab <= 0 && !pescando) {
          b.tt -= dt; if (b.tt <= 0) { b.th = b.h + (R() - 0.5) * 1.8; b.tt = 2 + R() * 6; if (R() < (t.mov === 'camina' ? 0.6 : 0.2)) b.pausa = 1.5 + R() * (t.mov === 'camina' ? 9 : 4); }
          b.h += Math.max(-1.6 * dt, Math.min(1.6 * dt, giro(b.h, b.th)));
          const nx = b.x + Math.sin(b.h) * b.vel * dt, nz = b.z + Math.cos(b.h) * b.vel * dt;
          if ((++b.n3 || (b.n3 = 1)) % 3 === 0 || b.fuera) { b.fuera = !dentro(nx, nz, b.c.pts); }
          if (b.fuera) { b.th = b.h + Math.PI * (0.7 + R() * 0.6); b.h += 0.15; b.fuera = false; } else { b.x = nx; b.z = nz; }
        }
        if (t.mov === 'nada') {
          y = b.c.y + 0.012 + Math.sin(now * 1.7 + b.ph) * 0.008; roll = Math.sin(now * 1.3 + b.ph) * 0.03;
          if (b.tipo !== T.focha && b.tipo !== T.tingua) { // los patos meten la cabeza al agua (pico y cola arriba) de vez en cuando
            b.sigDab -= dt; if (b.sigDab <= 0 && b.dab <= 0) { b.dab = 2.2; b.sigDab = 12 + R() * 35; }
            if (b.dab > 0) { b.dab -= dt; pitch = 0.9 * Math.sin(Math.min(1, (2.2 - b.dab) / 0.5) * Math.PI / 2) * Math.min(1, b.dab / 0.5); }
          }
        } else {
          y = b.c.y;
          // garzas de la orilla: se quedan quietas al acecho, dan la estocada y se tragan el pez
          b.sigPesca -= dt;
          if (b.sigPesca <= 0 && !pescando) { b.fase = 1; b.tf = 0; b.sigPesca = 14 + R() * 30; }
          if (pescando) {
            b.tf += dt; const tf = b.tf;
            pitch = tf < 1.0 ? 0.12 * (tf / 1.0) : tf < 1.5 ? 0.12 + 0.75 * Math.sin((tf - 1.0) / 0.5 * Math.PI / 2) : tf < 2.0 ? 0.87 - 0.75 * ((tf - 1.5) / 0.5) : 0.12 * (1 - (tf - 2.0) / 1.0);
            if (tf > 1.35 && !b.pez && tf < 2.0) { b.pez = true; anillo(b.x + Math.sin(b.h) * 0.4, b.z + Math.cos(b.h) * 0.4); }
            if (tf > 3.4) { b.fase = 0; b.pez = false; }
            else if (tf > 3.0) b.pez = false; // se lo traga
          }
        }
      }
      d.position.set(b.x, y, b.z); d.rotation.set(pitch, b.h, roll); d.scale.setScalar(b.esc); d.updateMatrix();
      mallas[b.tipo].setMatrixAt(b.k, d.matrix);
      if (b.pez) { // el pez cuelga del pico
        if (b.vuelo) ponerPez(d.matrix, 0, -0.01, 0.5); else ponerPez(d.matrix, 0, 1.0, 0.47);
      }
    }
    mallas.forEach(m => { m.instanceMatrix.needsUpdate = true; });
    peces.count = nPez; peces.instanceMatrix.needsUpdate = true;
    for (const m of anillos) {
      if (!m.visible) continue;
      const u = m.userData; u.t += dt;
      if (u.t > 1.6) { m.visible = false; continue; }
      const k = u.t / 1.6; m.scale.setScalar(0.6 + k * 5); m.material.opacity = 0.75 * (1 - k) * (1 - k);
    }
  };
  return api;
}
