/* ============ VEHÍCULOS REALISTAS (modo Kennedy) ============
   Carros, taxis, camionetas, furgones, camiones (furgón y de estacas, como los de Corabastos), motos con su conductor y bicis con ciclista.
   Todo instanciado (una llamada de dibujo por material y modelo) con dos niveles de detalle:
   - CERCA: carrocería con bordes redondeados, pintura de carro con barniz (clearcoat) y reflejos del cielo, vidrios polarizados, parales,
     espejos, manijas, llantas de caucho con rin metálico de 5 radios, pasos de rueda, farolas, stops, parrilla y placas amarillas de Colombia.
   - LEJOS: volumen simple con la misma silueta y color.
   Se ponen con poner(a, tipo, x, y, z, rumbo) en cada cuadro y se cierran con fin(cámara). */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const NEGRO = [0.035, 0.035, 0.04], PLAST = [0.07, 0.072, 0.078], CAUCHO = [0.045, 0.045, 0.05], GRIS = [0.32, 0.33, 0.35];
const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

/* ---------- utilidades de geometría ---------- */
function preparar(g, col) {
  if (g.index) g = g.toNonIndexed();
  if (!g.attributes.normal) g.computeVertexNormals();
  const n = g.attributes.position.count;
  if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
  const c = new Float32Array(n * 3), p = g.attributes.position;
  for (let i = 0; i < n; i++) {
    const v = typeof col === 'function' ? col(p.getX(i), p.getY(i), p.getZ(i)) : (col || [1, 1, 1]);
    c[i * 3] = v[0]; c[i * 3 + 1] = v[1]; c[i * 3 + 2] = v[2];
  }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  const o = new THREE.BufferGeometry();
  for (const k of ['position', 'normal', 'uv', 'color']) o.setAttribute(k, g.attributes[k]);
  return o;
}
class Kit {
  constructor() { this.b = {}; }
  add(mat, g, col) { (this.b[mat] = this.b[mat] || []).push(preparar(g, col)); return this; }
  build() { const o = {}; for (const k in this.b) o[k] = mergeGeometries(this.b[k]); return o; }
}
const caja = (w, h, d, x, y, z) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);
// barra entre dos puntos del perfil lateral (u = largo -> z, v = alto -> y) a un lado x
function barra(p0, p1, x, grueso, ancho) {
  const dz = p1[0] - p0[0], dy = p1[1] - p0[1], L = Math.hypot(dz, dy);
  const g = new THREE.BoxGeometry(ancho, grueso, L + grueso * 0.5);
  g.rotateX(Math.atan2(-dy, dz)); g.translate(x, (p0[1] + p1[1]) / 2, (p0[0] + p1[0]) / 2); return g;
}
// perfil lateral (u = largo, frente +u; v = alto) extruido a lo ancho con bordes redondeados; queda con el frente hacia +z
function extruir(pts, ancho, bisel, seg) {
  const sh = new THREE.Shape(); pts.forEach((p, i) => i ? sh.lineTo(p[0], p[1]) : sh.moveTo(p[0], p[1])); sh.closePath();
  const prof = Math.max(0.02, ancho - 2 * bisel);
  const g = new THREE.ExtrudeGeometry(sh, { depth: prof, bevelEnabled: bisel > 0, bevelThickness: bisel, bevelSize: bisel * 0.6, bevelSegments: seg, curveSegments: 1, steps: 1 });
  g.translate(0, 0, -prof / 2); g.rotateY(-Math.PI / 2); return g;
}
// llanta de caucho con hombros redondeados (eje en x)
function llanta(r, ancho, seg = 22) {
  const h = ancho / 2, ri = r * 0.64, b = Math.min(0.05, r * 0.16);
  const P = [[ri, -h], [r - b, -h], [r - b * 0.3, -h + b * 0.3], [r, -h + b], [r, h - b], [r - b * 0.3, h - b * 0.3], [r - b, h], [ri, h]].map(q => new THREE.Vector2(q[0], q[1]));
  const g = new THREE.LatheGeometry(P, seg); g.rotateZ(Math.PI / 2); return g;
}
// rin de 5 radios: disco metálico, huecos oscuros entre radios y copa central (cara hacia +x si lado = 1)
function rin(kit, r, x, y, z, lado, radios = 5) {
  const rr = r * 0.62, cara = x + lado * 0.004;
  kit.add('metal', new THREE.CylinderGeometry(rr, rr, 0.05, 22).rotateZ(Math.PI / 2).translate(x - lado * 0.02, y, z));
  for (let k = 0; k < radios; k++) {
    const a = (k + 0.5) / radios * Math.PI * 2, d = rr * 0.58;
    kit.add('partes', new THREE.CylinderGeometry(rr * 0.24, rr * 0.24, 0.012, 8).rotateZ(Math.PI / 2).translate(cara + lado * 0.004, y + Math.sin(a) * d, z + Math.cos(a) * d), NEGRO);
  }
  kit.add('metal', new THREE.CylinderGeometry(rr * 0.2, rr * 0.22, 0.03, 12).rotateZ(Math.PI / 2).translate(cara + lado * 0.012, y, z));
}
// paso de rueda oscuro (medio disco) sobre la carrocería
const pasoRueda = (r, x, y, z) => new THREE.CylinderGeometry(r, r, 0.03, 18, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).translate(x, y, z);

/* ---------- placa amarilla colombiana (textura) ---------- */
function texturaPlaca() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d');
  g.fillStyle = '#f2c300'; g.fillRect(0, 0, 256, 128);
  g.strokeStyle = '#111'; g.lineWidth = 6; g.strokeRect(5, 5, 246, 118);
  g.fillStyle = '#111'; g.font = 'bold 64px Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('KEN 326', 128, 56);
  g.font = 'bold 20px Arial, sans-serif'; g.fillText('BOGOTÁ D.C.', 128, 106);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
const placa = (w, h, x, y, z, atras) => { const g = new THREE.PlaneGeometry(w, h); if (atras) g.rotateY(Math.PI); g.translate(x, y, z); return g; };

/* ---------- carros ---------- */
// perfiles laterales en metros (u = largo con el frente en +u, v = alto). cab = vidrios (parabrisas, techo y vidrio trasero).
const CARROS = {
  sedan: { w: 1.78, r: 0.31, zD: 1.36, zT: -1.34, b: [[-2.22, 0.30], [2.18, 0.30], [2.25, 0.42], [2.27, 0.58], [2.21, 0.70], [1.98, 0.78], [1.42, 0.86], [0.86, 0.92], [-1.48, 0.96], [-2.04, 0.93], [-2.21, 0.84], [-2.26, 0.62], [-2.25, 0.42]], cab: [[0.95, 0.90], [0.18, 1.39], [-0.86, 1.43], [-1.62, 0.95]], pB: -0.30 },
  hatch: { w: 1.70, r: 0.30, zD: 1.24, zT: -1.18, b: [[-1.90, 0.30], [1.86, 0.30], [1.94, 0.44], [1.95, 0.60], [1.87, 0.72], [1.28, 0.85], [0.62, 0.92], [-1.72, 0.98], [-1.93, 0.90], [-1.98, 0.62], [-1.96, 0.42]], cab: [[0.66, 0.90], [-0.08, 1.44], [-1.58, 1.46], [-1.86, 0.97]], pB: -0.55 },
  suv: { w: 1.86, r: 0.36, zD: 1.40, zT: -1.36, b: [[-2.24, 0.40], [2.22, 0.40], [2.29, 0.55], [2.30, 0.82], [2.18, 0.98], [1.45, 1.08], [0.82, 1.13], [-2.08, 1.17], [-2.26, 1.08], [-2.31, 0.70], [-2.29, 0.50]], cab: [[0.88, 1.11], [0.06, 1.68], [-1.94, 1.71], [-2.18, 1.15]], pB: -0.50, suv: true },
  pickup: { w: 1.86, r: 0.37, zD: 1.62, zT: -1.52, b: [[-2.62, 0.42], [2.58, 0.42], [2.65, 0.58], [2.66, 0.86], [2.52, 1.02], [1.70, 1.10], [-2.60, 1.12], [-2.68, 0.96], [-2.68, 0.55]], cab: [[1.10, 1.08], [0.38, 1.74], [-0.88, 1.76], [-0.98, 1.10]], pB: -0.10, platon: -1.02 },
  van: { w: 1.92, r: 0.34, zD: 1.72, zT: -1.62, b: [[-2.42, 0.36], [2.40, 0.36], [2.47, 0.55], [2.46, 0.90], [2.22, 1.06], [1.70, 1.13], [-2.36, 1.15], [-2.46, 0.92], [-2.47, 0.50]], cab: [[1.82, 1.10], [1.02, 1.98], [-2.30, 2.00], [-2.40, 1.12]], pB: 0.70, van: true }
};
CARROS.taxi = Object.assign({}, CARROS.hatch, { taxi: true });

// recorta los pasos de rueda (arcos) en el borde inferior del perfil: puntos 0 (atrás abajo) y 1 (adelante abajo)
function conPasos(E) {
  const b = E.b, y0 = b[0][1], R = E.r + 0.07, arco = [];
  for (const z of [E.zT, E.zD]) {
    arco.push([z - R, y0]);
    for (let k = 1; k < 12; k++) { const t = Math.PI - k / 12 * Math.PI; arco.push([z + R * Math.cos(t), y0 + R * Math.sin(t) * 0.92]); }
    arco.push([z + R, y0]);
  }
  return [b[0], ...arco, ...b.slice(1)];
}
function geometriaCarro(E) {
  const K = new Kit(), F = new Kit(), w = E.w, bis = 0.07, perfil = conPasos(E);
  // forma de carro real: las esquinas de adelante y atrás se cierran en planta y la cabina se inclina hacia adentro (tumblehome)
  const fz = Math.max(...E.b.map(p => p[0])), rz = Math.min(...E.b.map(p => p[0])), belt = E.cab[0][1], top = Math.max(...E.cab.map(p => p[1])) + 0.03;
  const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const curva = (g) => { const P = g.attributes.position; for (let i = 0; i < P.count; i++) { const y = P.getY(i), z = P.getZ(i);
    const ext = ss(fz - 0.75, fz + 0.08, z) + ss(rz + 0.6, rz - 0.08, z), tb = ss(belt - 0.05, top, y), capo = ss(0.55, belt, y) * ss(fz - 1.2, fz, z);
    P.setX(i, P.getX(i) * (1 - 0.085 * ext) * (1 - 0.13 * tb)); P.setY(i, y - 0.05 * capo * ss(0, 1, Math.abs(P.getX(i)) / (w / 2))); } return g; };
  const front = Math.max(...E.b.map(p => p[0])) + bis * 0.6, rear = Math.min(...E.b.map(p => p[0])) - bis * 0.6;
  const vAt = (u) => { // alto de la carrocería en el largo u (techo del perfil)
    const top = E.b.filter(p => p[1] > 0.5).sort((a, b) => a[0] - b[0]); for (let i = 0; i < top.length - 1; i++) if (u >= top[i][0] && u <= top[i + 1][0]) { const t = (u - top[i][0]) / (top[i + 1][0] - top[i][0]); return top[i][1] + t * (top[i + 1][1] - top[i][1]); } return 0.8; };
  // carrocería: más oscura abajo (polvo y oclusión), aclarando hacia la línea de cintura
  const sombreado = (x, y) => { const t = Math.min(1, Math.max(0, (y - 0.3) / 0.45)); const k = 0.62 + 0.38 * t; return [k, k, k]; };
  K.add('pintura', curva(extruir(perfil, w, bis, 4)), sombreado);
  // vidrios (cabina más angosta que la carrocería: "tumblehome")
  const gw = w - 0.24, c = E.cab;
  K.add('vidrio', curva(extruir(c, gw, 0.05, 3)));
  // techo de lámina, parales A, B y C del color del carro (así se leen las ventanas)
  const techo = [[c[1][0] - 0.04, c[1][1] - 0.04], [c[2][0] + 0.04, c[2][1] - 0.04], [c[2][0] + 0.02, c[2][1] + 0.025], [c[1][0] - 0.02, c[1][1] + 0.025]];
  K.add('pintura', curva(extruir(techo, gw - 0.04, 0.03, 2)));
  for (const s of [-1, 1]) {
    const x = s * (gw / 2 - 0.005);
    K.add('pintura', curva(barra(c[0], c[1], x, 0.07, 0.05)));
    K.add('pintura', curva(barra(c[2], c[3], x, E.van || E.suv ? 0.16 : 0.1, 0.05)));
    const yb = vAt(E.pB); K.add('pintura', curva(barra([E.pB, yb], [E.pB - 0.05, c[1][1] + (c[2][1] - c[1][1]) * 0.5], x, 0.1, 0.05)));
    if (E.van) K.add('pintura', curva(barra([-1.3, vAt(-1.3)], [-1.3, 1.98], x, 0.14, 0.05)));
    // línea de cintura y marco inferior de las ventanas (negro)
    K.add('partes', curva(barra([c[0][0] - 0.05, c[0][1] + 0.02], [c[3][0] + 0.05, c[3][1] + 0.02], s * (gw / 2 + 0.01), 0.035, 0.02)), NEGRO);
    // espejos retrovisores
    K.add('pintura', caja(0.14, 0.12, 0.2, s * (w / 2 + 0.07), c[0][1] + 0.12, c[0][0] - 0.18));
    K.add('partes', caja(0.1, 0.035, 0.04, s * (w / 2 + 0.01), c[0][1] + 0.08, c[0][0] - 0.13), NEGRO);
    // costuras de puertas y manijas
    const xs = s * (w / 2 + 0.002), yTop = vAt(E.pB) - 0.04;
    for (const u of [c[0][0] - 0.05, E.pB, E.van ? -1.3 : (E.pB - (E.pB - c[3][0]) * 0.92)]) K.add('partes', caja(0.006, Math.max(0.2, yTop - 0.38), 0.012, xs, (yTop + 0.38) / 2, u), NEGRO);
    for (const u of [E.pB + 0.18, E.pB - 0.62]) K.add('metal', caja(0.025, 0.035, 0.16, s * (w / 2 + 0.01), yTop - 0.08, u));
    // pasos de rueda, llantas y rines
    for (const z of [E.zD, E.zT]) {
      K.add('partes', pasoRueda(E.r + 0.08, s * (w / 2 - 0.34), E.perfil0 = E.b[0][1], z), NEGRO); // fondo oscuro del paso de rueda
      K.add('partes', llanta(E.r, 0.22).translate(s * (w / 2 - 0.15), E.r, z), CAUCHO);
      rin(K, E.r, s * (w / 2 - 0.045), E.r, z, s);
      F.add('partes', caja(0.22, E.r * 2, E.r * 2, s * (w / 2 - 0.12), E.r, z), CAUCHO);
    }
    // farolas (lente claro con reflector), stops y exploradoras
    K.add('luces', caja(0.42, 0.12, 0.08, s * w * 0.31, vAt(front - 0.25) - 0.1, front - 0.06), [0.92, 0.94, 0.96]);
    K.add('metal', caja(0.14, 0.08, 0.02, s * w * 0.26, vAt(front - 0.25) - 0.1, front - 0.01));
    K.add('luces', caja(0.38, 0.14, 0.08, s * w * 0.33, vAt(rear + 0.25) - 0.12, rear + 0.06), [0.62, 0.03, 0.04]);
    K.add('luces', caja(0.1, 0.14, 0.081, s * w * 0.40, vAt(rear + 0.25) - 0.12, rear + 0.061), [0.95, 0.5, 0.1]);
    K.add('partes', caja(0.16, 0.07, 0.04, s * w * 0.36, 0.42, front - 0.02), NEGRO);
  }
  // parrilla, bómperes y protectores negros, placas
  K.add('partes', caja(w * 0.5, 0.14, 0.04, 0, vAt(front - 0.2) - 0.16, front - 0.02), NEGRO);
  K.add('metal', caja(w * 0.5, 0.012, 0.045, 0, vAt(front - 0.2) - 0.1, front - 0.015));
  K.add('partes', caja(w * 0.62, 0.1, 0.05, 0, 0.36, front - 0.03), PLAST);
  K.add('partes', caja(w * 0.9, 0.1, 0.06, 0, 0.36, rear + 0.03), PLAST);
  K.add('partes', caja(w - 0.7, 0.08, front - rear - 0.5, 0, E.b[0][1] + 0.04, (front + rear) / 2), NEGRO); // bajos
  if (E.suv) for (const s of [-1, 1]) K.add('partes', caja(0.04, 0.12, 2.0, s * (w / 2 + 0.01), 0.46, (E.zD + E.zT) / 2), PLAST);
  K.add('placa', placa(0.34, 0.11, 0, 0.46, front + 0.006));
  K.add('placa', placa(0.34, 0.11, 0, vAt(rear + 0.25) - 0.3, rear - 0.006, true));
  if (E.taxi) { // aviso del techo y franja de cuadros del taxi bogotano
    K.add('luces', caja(0.52, 0.14, 0.2, 0, c[2][1] + 0.1, (c[1][0] + c[2][0]) / 2), [0.96, 0.95, 0.88]);
    for (const s of [-1, 1]) for (let k = 0; k < 14; k++) K.add('partes', caja(0.006, 0.05, 0.12, s * (w / 2 + 0.004), 0.66 + (k % 2) * 0.05, 1.0 - k * 0.14), k % 2 ? [0.9, 0.9, 0.9] : NEGRO);
  }
  if (E.platon) { // volco de la pickup: interior oscuro
    K.add('partes', caja(w - 0.2, 0.05, 1.5, 0, 1.13, E.platon - 0.62), PLAST);
    K.add('partes', caja(w - 0.2, 0.3, 0.05, 0, 0.97, E.platon + 0.12), PLAST);
  }
  // lejos: silueta sin bisel + vidrios + bloques de llantas
  F.add('pintura', curva(extruir(perfil, w, 0, 0)), sombreado);
  F.add('vidrio', curva(extruir(c, gw, 0, 0)));
  return { cerca: K.build(), lejos: F.build(), largo: front - rear };
}

/* ---------- camiones ---------- */
function geometriaCamion(estacas) {
  const K = new Kit(), F = new Kit(), w = 2.36, r = 0.5, zD = 2.75, zT = -2.05, zc0 = 1.85, front = 3.78;
  // cabina avanzada (pintada) y parabrisas
  const cab = [[zc0, 0.95], [front, 0.95], [front + 0.04, 1.4], [front - 0.04, 2.55], [front - 0.3, 2.85], [zc0, 2.88]];
  K.add('pintura', extruir(cab, w, 0.07, 3), (x, y) => { const k = 0.7 + 0.3 * Math.min(1, (y - 0.95) / 0.8); return [k, k, k]; });
  F.add('pintura', extruir(cab, w, 0, 0));
  K.add('vidrio', new THREE.BoxGeometry(w - 0.3, 0.82, 0.06).rotateX(-0.05).translate(0, 2.1, front + 0.1));
  for (const s of [-1, 1]) {
    K.add('vidrio', caja(0.05, 0.7, 0.9, s * (w / 2 + 0.005), 2.1, zc0 + 0.95));
    K.add('partes', caja(0.05, 0.05, 0.55, s * (w / 2 + 0.28), 2.25, front - 0.3), NEGRO); // brazo del espejo
    K.add('partes', caja(0.07, 0.42, 0.2, s * (w / 2 + 0.5), 2.1, front - 0.32), NEGRO);
    K.add('luces', caja(0.36, 0.2, 0.08, s * 0.82, 1.18, front + 0.02), [0.92, 0.94, 0.96]);
    K.add('luces', caja(0.18, 0.28, 0.06, s * 1.0, 1.12, -3.78), [0.62, 0.03, 0.04]);
    // llantas: sencillas adelante, dobles atrás
    for (const [z, dob] of [[zD, false], [zT, true], [zT - 1.25, true]]) {
      for (const k of dob ? [0, 1] : [0]) {
        const x = s * (w / 2 - 0.2 - k * 0.3);
        K.add('partes', llanta(r, 0.28).translate(x, r, z), CAUCHO);
        if (k === 0) rin(K, r, s * (w / 2 - 0.05), r, z, s, 8);
      }
      K.add('partes', pasoRueda(r + 0.08, s * (w / 2 + 0.003), r + 0.05, z), NEGRO);
      F.add('partes', caja(0.3, r * 2, r * 2, s * (w / 2 - 0.2), r, z), CAUCHO);
    }
    K.add('metal', new THREE.CylinderGeometry(0.26, 0.26, 0.9, 14).rotateX(Math.PI / 2).translate(s * (w / 2 - 0.3), 0.75, 0.6)); // tanque
  }
  K.add('partes', caja(w * 0.7, 0.42, 0.05, 0, 1.45, front + 0.03), NEGRO); // parrilla
  K.add('partes', caja(w, 0.24, 0.14, 0, 0.82, front + 0.02), GRIS); // bómper
  K.add('partes', caja(1.0, 0.24, 7.2, 0, 0.82, 0.1), NEGRO); // chasís
  K.add('placa', placa(0.34, 0.11, 0, 0.82, front + 0.1));
  K.add('placa', placa(0.34, 0.11, 0, 0.9, -3.86, true));
  if (!estacas) { // furgón de aluminio con costillas
    const L = 5.4, zc = zc0 - 0.12 - L / 2;
    K.add('partes', caja(w + 0.04, 2.7, L, 0, 2.4, zc), [0.86, 0.87, 0.88]);
    for (let k = 0; k <= 12; k++) for (const s of [-1, 1]) K.add('partes', caja(0.02, 2.66, 0.05, s * (w / 2 + 0.025), 2.4, zc - L / 2 + k * L / 12), [0.7, 0.71, 0.73]);
    K.add('partes', caja(0.02, 2.5, 0.02, 0, 2.4, zc - L / 2 - 0.012), [0.5, 0.5, 0.52]);
    F.add('partes', caja(w + 0.04, 2.7, L, 0, 2.4, zc), [0.86, 0.87, 0.88]);
  } else { // camión de estacas (madera) con bultos, como los de Corabastos
    const L = 5.5, zc = zc0 - 0.1 - L / 2, MAD = [0.42, 0.27, 0.15], MAD2 = [0.33, 0.21, 0.12];
    K.add('partes', caja(w + 0.06, 0.12, L, 0, 1.1, zc), MAD2);
    for (const s of [-1, 1]) {
      for (let k = 0; k < 6; k++) K.add('partes', caja(0.05, 0.12, L, s * (w / 2), 1.32 + k * 0.22, zc), k % 2 ? MAD : MAD2);
      for (let k = 0; k <= 5; k++) K.add('partes', caja(0.09, 1.45, 0.09, s * (w / 2 + 0.02), 1.86, zc - L / 2 + k * L / 5), MAD2);
    }
    for (let k = 0; k < 6; k++) K.add('partes', caja(w, 0.12, 0.05, 0, 1.32 + k * 0.22, zc - L / 2), k % 2 ? MAD : MAD2);
    for (let k = 0; k < 22; k++) { const x = (hash(k) - 0.5) * (w - 0.6), z = zc + (hash(k + 40) - 0.5) * (L - 0.6), h = 0.5 + hash(k + 80) * 0.3; // bultos de costal y canastas
      const cc = k % 3 ? [0.74, 0.66, 0.5] : [0.2, 0.42, 0.24]; K.add('partes', caja(0.55, h, 0.75, x, 1.16 + h / 2 + (k > 11 ? 0.45 : 0), z), cc); }
    F.add('partes', caja(w, 1.5, L, 0, 1.85, zc), MAD);
  }
  return { cerca: K.build(), lejos: F.build(), largo: 7.6 };
}

/* ---------- conductor (moto y bici) ---------- */
// extremidad redondeada entre dos puntos del perfil lateral (u -> z, v -> y) a un lado x
function miembro(p0, p1, x, rad) {
  const dz = p1[0] - p0[0], dy = p1[1] - p0[1], L = Math.max(0.01, Math.hypot(dz, dy) - rad);
  const g = new THREE.CapsuleGeometry(rad, L, 3, 10); g.rotateX(Math.atan2(dz, dy)); g.translate(x, (p0[1] + p1[1]) / 2, (p0[0] + p1[0]) / 2); return g;
}
function conductor(K, y0, zA, chaleco, cicla) {
  const piel = [0.55, 0.38, 0.28], jean = [0.11, 0.15, 0.26], chaq = chaleco ? [0.78, 0.9, 0.1] : [0.07, 0.07, 0.08], zM = zA + (cicla ? 0.55 : 0.6);
  const hombro = [zA + (cicla ? 0.24 : 0.12), y0 + 0.56], cadera = [zA, y0 + 0.08];
  for (const s of [-1, 1]) {
    const rod = [zA + 0.4, y0 - 0.02], pie = [zA + (cicla ? 0.3 : 0.36), y0 - (cicla ? 0.56 : 0.5)];
    K.add('partes', miembro([cadera[0], y0 + 0.02], rod, s * 0.12, 0.085), jean); // muslo
    K.add('partes', miembro(rod, pie, s * 0.13, 0.065), jean); // pierna
    K.add('partes', caja(0.1, 0.09, 0.24, s * 0.13, pie[1] - 0.04, pie[0] + 0.05), NEGRO); // zapato
    const codo = [(hombro[0] + zM) / 2 - 0.02, y0 + 0.36];
    K.add('partes', miembro(hombro, codo, s * 0.21, 0.055), chaq); K.add('partes', miembro(codo, [zM, y0 + 0.24], s * 0.24, 0.048), chaq); // brazo y antebrazo
    K.add('partes', new THREE.SphereGeometry(0.05, 8, 6).translate(s * 0.25, y0 + 0.23, zM + 0.02), NEGRO); // guante
  }
  K.add('partes', miembro(cadera, hombro, 0, 0.16).scale(1.25, 1, 0.78).translate(0, 0, 0), chaq); // torso
  K.add('partes', new THREE.SphereGeometry(0.18, 12, 8).scale(1.1, 0.7, 0.9).translate(0, y0 + 0.08, zA - 0.02), jean); // cadera
  const cab = [hombro[0] + 0.05, y0 + 0.82];
  K.add('partes', new THREE.CylinderGeometry(0.055, 0.065, 0.12, 8).translate(0, hombro[1] + 0.1, hombro[0] + 0.02), piel); // cuello
  K.add('pintura', new THREE.SphereGeometry(0.155, 16, 12).scale(1, 1.02, 1.15).translate(0, cab[1], cab[0])); // casco (del color de la moto o la bici, como suele combinarse)
  K.add('vidrio', new THREE.SphereGeometry(0.157, 14, 6, Math.PI * 0.18, Math.PI * 0.64, Math.PI * 0.36, Math.PI * 0.24).translate(0, cab[1], cab[0])); // visor
}

function geometriaMoto(chaleco) {
  const K = new Kit(), F = new Kit(), r = 0.3, zD = 0.68, zT = -0.66;
  for (const z of [zD, zT]) {
    K.add('partes', llanta(r, 0.11, 18).translate(0, r, z), CAUCHO);
    K.add('metal', new THREE.CylinderGeometry(r * 0.6, r * 0.6, 0.08, 16).rotateZ(Math.PI / 2).translate(0, r, z));
    K.add('metal', new THREE.CylinderGeometry(0.1, 0.1, 0.1, 12).rotateZ(Math.PI / 2).translate(0, r, z));
    F.add('partes', caja(0.12, r * 2, r * 2, 0, r, z), CAUCHO);
  }
  for (const s of [-1, 1]) K.add('metal', barra([zD, r], [zD - 0.22, 0.98], s * 0.08, 0.04, 0.04)); // barras de la suspensión
  K.add('metal', caja(0.62, 0.025, 0.025, 0, 1.06, zD - 0.26)); // manubrio
  K.add('partes', caja(0.3, 0.3, 0.42, 0, 0.5, 0.0), GRIS); // motor
  K.add('metal', barra([-0.05, 0.4], [-0.75, 0.48], 0.14, 0.06, 0.06)); // exosto
  K.add('pintura', barra([0.42, 0.86], [-0.05, 0.84], 0, 0.22, 0.3)); // tanque
  K.add('pintura', barra([-0.05, 0.82], [-0.72, 0.9], 0, 0.12, 0.26)); // colín
  K.add('partes', barra([0.0, 0.92], [-0.6, 0.95], 0, 0.08, 0.28), NEGRO); // sillín
  K.add('pintura', barra([zD - 0.1, 0.62], [zD + 0.12, 0.6], 0, 0.04, 0.16)); // guardabarros
  K.add('luces', caja(0.16, 0.14, 0.08, 0, 0.98, zD - 0.14), [0.92, 0.94, 0.96]);
  K.add('luces', caja(0.12, 0.06, 0.04, 0, 0.88, -0.76), [0.62, 0.03, 0.04]);
  K.add('placa', placa(0.2, 0.13, 0, 0.72, -0.8, true));
  conductor(K, 0.98, -0.25, chaleco, false);
  F.add('pintura', caja(0.3, 0.4, 1.3, 0, 0.75, 0)); F.add('partes', caja(0.4, 0.7, 0.4, 0, 1.35, -0.15), chaleco ? [0.82, 0.92, 0.12] : NEGRO);
  return { cerca: K.build(), lejos: F.build(), largo: 2.0 };
}

function geometriaBici(chaqueta) {
  const K = new Kit(), F = new Kit(), r = 0.34, zD = 0.52, zT = -0.52;
  for (const z of [zD, zT]) {
    K.add('partes', new THREE.TorusGeometry(r, 0.022, 6, 28).rotateY(Math.PI / 2).translate(0, r, z), CAUCHO);
    K.add('metal', new THREE.TorusGeometry(r - 0.03, 0.008, 4, 24).rotateY(Math.PI / 2).translate(0, r, z));
    for (let k = 0; k < 8; k++) K.add('metal', new THREE.BoxGeometry(0.005, 2 * (r - 0.03), 0.005).rotateX(k / 8 * Math.PI).translate(0, r, z)); // radios
    F.add('partes', caja(0.05, r * 2, r * 2, 0, r, z), CAUCHO);
  }
  const P = { pedal: [0, r], sillin: [-0.15, 0.95], manubrio: [0.4, 1.0] };
  K.add('pintura', barra([zT, r], P.pedal, 0, 0.035, 0.035)); K.add('pintura', barra(P.pedal, [-0.12, 0.88], 0, 0.04, 0.04));
  K.add('pintura', barra([-0.12, 0.88], [zT, r], 0, 0.03, 0.03)); K.add('pintura', barra(P.pedal, [0.42, 0.88], 0, 0.045, 0.045));
  K.add('pintura', barra([-0.12, 0.86], [0.42, 0.9], 0, 0.04, 0.04)); K.add('pintura', barra([0.42, 0.95], [zD, r], 0, 0.03, 0.03));
  K.add('partes', caja(0.12, 0.05, 0.25, 0, 0.96, -0.15), NEGRO); K.add('metal', caja(0.5, 0.025, 0.025, 0, 1.02, 0.42));
  conductor(K, 0.98, -0.18, chaqueta, true);
  F.add('partes', caja(0.4, 0.8, 0.4, 0, 1.3, 0), chaqueta ? [0.82, 0.92, 0.12] : [0.15, 0.2, 0.35]); F.add('pintura', caja(0.05, 0.5, 1.0, 0, 0.6, 0));
  return { cerca: K.build(), lejos: F.build(), largo: 1.8 };
}

/* ---------- colores reales (participación aproximada del parque automotor) ---------- */
const PINTURA_CARRO = [0xeeeeec, 0xeeeeec, 0xe9e9e6, 0xb9bcc0, 0xb4b7bb, 0xa7abb0, 0x6d7177, 0x5b5f64, 0x141517, 0x101113, 0x8e1416, 0x1d2f5c, 0xc8b89a, 0x4a1219, 0x1f3a2c, 0x2b4a7a];
const PINTURA_CAMION = [0xf2f2f0, 0xf2f2f0, 0xb3121a, 0x1f4b99, 0x9aa0a6, 0x1d6b3a];
const PINTURA_MOTO = [0x101113, 0x101113, 0xb3121a, 0x1a3f9e, 0xeeeeec, 0x5b5f64, 0xd9d9d9];
const PINTURA_BICI = [0x101113, 0xb3121a, 0x1a3f9e, 0xeeeeec, 0x2e7d32, 0xf57c00];
const TIPOS = {
  carro: { v: [['sedan', 0.30], ['hatch', 0.24], ['suv', 0.20], ['taxi', 0.15], ['pickup', 0.06], ['van', 0.05]], col: PINTURA_CARRO },
  camion: { v: [['furgon', 0.55], ['estacas', 0.45]], col: PINTURA_CAMION },
  moto: { v: [['moto', 0.6], ['motoChaleco', 0.4]], col: PINTURA_MOTO },
  bici: { v: [['bici', 0.7], ['biciChaleco', 0.3]], col: PINTURA_BICI }
};
const SOMBRA = { carro: [2.5, 5.4], camion: [3.2, 8.8], moto: [1.0, 2.4], bici: [0.8, 2.1] };

export function crearVehiculos({ T3, cuantos, movil, maxDist = Infinity }) {
  const env = T3.env || T3.scene.environment || null;
  const fis = !movil;
  const M = {
    pintura: fis ? new THREE.MeshPhysicalMaterial({ vertexColors: true, metalness: 0.45, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.06, envMap: env, envMapIntensity: 1.0 })
      : new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.35, roughness: 0.32, envMap: env, envMapIntensity: 1.0 }),
    vidrio: fis ? new THREE.MeshPhysicalMaterial({ color: 0x1b2229, metalness: 0.0, roughness: 0.03, clearcoat: 1, clearcoatRoughness: 0.02, reflectivity: 0.9, envMap: env, envMapIntensity: 1.6 })
      : new THREE.MeshStandardMaterial({ color: 0x1b2229, metalness: 0.2, roughness: 0.05, envMap: env, envMapIntensity: 1.5 }),
    partes: new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.05, roughness: 0.78, envMap: env, envMapIntensity: 0.5 }),
    metal: new THREE.MeshStandardMaterial({ color: 0xd4d7db, metalness: 1.0, roughness: 0.26, envMap: env, envMapIntensity: 1.1 }),
    luces: new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.2, roughness: 0.08, envMap: env, envMapIntensity: 1.2, emissive: 0x111111 }),
    placa: new THREE.MeshStandardMaterial({ map: texturaPlaca(), roughness: 0.45, metalness: 0.1 })
  };
  const GEO = {
    sedan: () => geometriaCarro(CARROS.sedan), hatch: () => geometriaCarro(CARROS.hatch), suv: () => geometriaCarro(CARROS.suv), taxi: () => geometriaCarro(CARROS.taxi),
    pickup: () => geometriaCarro(CARROS.pickup), van: () => geometriaCarro(CARROS.van), furgon: () => geometriaCamion(false), estacas: () => geometriaCamion(true),
    moto: () => geometriaMoto(false), motoChaleco: () => geometriaMoto(true), bici: () => geometriaBici(false), biciChaleco: () => geometriaBici(true)
  };
  const grupo = new THREE.Group(); grupo.name = 'vehiculos'; T3.scene.add(grupo);
  const V = {}; // variante -> { cerca: [mallas], lejos: [mallas], nc, nl }
  const mk = (geo, mat, cap, sombra, conColor) => {
    const m = new THREE.InstancedMesh(geo, mat, cap); m.count = 0; m.frustumCulled = false; m.castShadow = sombra && !T3.liviano; m.receiveShadow = false;
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    if (conColor) { m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(cap * 3).fill(1), 3); m.instanceColor.setUsage(THREE.DynamicDrawUsage); }
    grupo.add(m); return m;
  };
  for (const [tipo, def] of Object.entries(TIPOS)) {
    const cap = cuantos[tipo] || 0; if (!cap) continue;
    for (const [nombre] of def.v) {
      const g = GEO[nombre]();
      const lado = (G, caps) => Object.entries(G).map(([mat, geo]) => ({ mat, m: mk(geo, M[mat], caps, mat !== 'placa' && mat !== 'luces', mat === 'pintura') }));
      V[nombre] = { cerca: lado(g.cerca, Math.min(cap, movil ? 60 : 260)), lejos: lado(g.lejos, cap), nc: 0, nl: 0, capC: Math.min(cap, movil ? 60 : 260), capL: cap };
    }
  }
  // sombra de contacto difusa bajo cada vehículo: lo asienta sobre el asfalto de la foto
  let total = 0; for (const t in TIPOS) total += cuantos[t] || 0;
  const cv = document.createElement('canvas'); cv.width = 64; cv.height = 128; const gx = cv.getContext('2d');
  const gr = gx.createRadialGradient(32, 32, 2, 32, 32, 31); gr.addColorStop(0, 'rgba(0,0,0,0.85)'); gr.addColorStop(0.55, 'rgba(0,0,0,0.5)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  gx.setTransform(1, 0, 0, 2, 0, 0); gx.fillStyle = gr; gx.fillRect(0, 0, 64, 64);
  const bg = new THREE.PlaneGeometry(1, 1); bg.rotateX(-Math.PI / 2);
  const blob = new THREE.InstancedMesh(bg, new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false, opacity: 0.75, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -20 }), Math.max(1, total));
  blob.count = 0; blob.frustumCulled = false; blob.renderOrder = -3; blob.instanceMatrix.setUsage(THREE.DynamicDrawUsage); grupo.add(blob);

  const d = new THREE.Object3D(), ds = new THREE.Object3D(), col = new THREE.Color(), cam = new THREE.Vector3();
  let nb = 0, CERCA = movil ? 90 : 230;
  const elegir = (a, tipo) => {
    const def = TIPOS[tipo], r = Math.random(); let acc = 0, v = def.v[def.v.length - 1][0];
    for (const [n, p] of def.v) { acc += p; if (r < acc) { v = n; break; } }
    a._vv = v;
    a._vc = v === 'taxi' ? 0xf2b705 : def.col[Math.floor(Math.random() * def.col.length)];
    a._vl = (Math.random() - 0.5) * 0.5; // variación lateral dentro del carril
  };
  const api = {
    grupo,
    // desplazamiento lateral hacia la derecha del sentido de marcha (en Colombia se maneja por la derecha)
    carril(a, tipo) { if (a._vv === undefined) elegir(a, tipo); return (tipo === 'camion' ? 2.0 : tipo === 'carro' ? 1.8 : tipo === 'moto' ? 1.4 : 2.7) + a._vl; },
    inicio() { for (const k in V) { V[k].nc = 0; V[k].nl = 0; } nb = 0; T3.camera.getWorldPosition(cam); },
    poner(a, tipo, x, y, z, rumbo) {
      if (a._vv === undefined) elegir(a, tipo);
      const o = V[a._vv]; if (!o) return;
      d.position.set(x, y, z); d.rotation.set(0, rumbo, 0); d.updateMatrix();
      const dist = Math.hypot(x - cam.x, z - cam.z, y - cam.y), cerca = dist < CERCA && o.nc < o.capC;
      if (dist > maxDist || (!cerca && o.nl >= o.capL) || nb >= blob.instanceMatrix.count) return; // muy lejos o sin cupo: no se dibuja
      const lista = cerca ? o.cerca : o.lejos, i = cerca ? o.nc++ : o.nl++;
      col.setHex(a._vc);
      for (const p of lista) { p.m.setMatrixAt(i, d.matrix); if (p.mat === 'pintura') p.m.setColorAt(i, col); }
      const S = SOMBRA[tipo]; ds.position.set(x, y + 0.03, z); ds.rotation.set(0, rumbo, 0); ds.scale.set(S[0], 1, S[1]); ds.updateMatrix(); blob.setMatrixAt(nb++, ds.matrix);
    },
    fin() {
      for (const k in V) {
        const o = V[k];
        for (const [lista, n] of [[o.cerca, o.nc], [o.lejos, o.nl]]) for (const p of lista) { p.m.count = n; p.m.instanceMatrix.needsUpdate = true; if (p.m.instanceColor) p.m.instanceColor.needsUpdate = true; }
      }
      blob.count = nb; blob.instanceMatrix.needsUpdate = true;
    },
    set visible(v) { grupo.visible = v; },
    setCerca(m) { CERCA = m; }
  };
  return api;
}
