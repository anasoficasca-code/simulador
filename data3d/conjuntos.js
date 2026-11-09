/* ============ CONJUNTOS DE BLOQUES DE CUBIERTA ROJA (Av. Américas, ~4.6330, -74.1389) ============
   Bloques alargados de 3 pisos como en Street View: muros crema con pilastras vino tinto entre cada apartamento, franjas vino tinto
   bajo las ventanas, ventanas con marco blanco y rejas, cubierta de lámina roja a dos aguas con alero, y en la fachada de acceso
   pequeños pórticos con techito rojo a dos aguas; cerramiento de reja negra con seto amarillo verdoso.
   Datos: data3d/conjuntos.json (tools/conjunto_build.py). Marco del modelo: lw(x, y) -> mundo. */
export async function iniciarConjuntos({ THREE, T3, lw, Y0 = 0.3, movil = false }) {
  const D = await (window.cargarJSON || ((u) => fetch(u).then(r => r.json())))('data3d/conjuntos.json?v=3');
  const { mergeGeometries } = await import('three/addons/utils/BufferGeometryUtils.js');
  const grupo = new THREE.Group(); grupo.name = 'conjuntos'; T3.scene.add(grupo);
  const ANIS = Math.min(8, T3.renderer.capabilities.getMaxAnisotropy ? T3.renderer.capabilities.getMaxAnisotropy() : 4);
  const lienzo = (w, h, f) => { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = ANIS; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
  const MOD = 3.6, PISO = 2.75, H = 3 * PISO + 0.5; // módulo de fachada (un apartamento) y pisos
  // textura de un módulo de fachada (3,6 m x 3 pisos): crema, pilastra vino tinto, ventana con marco blanco y franja vino tinto bajo ella
  const fach = lienzo(256, 640, (g, w, h) => {
    const m = w / MOD, y = (yy) => h - yy * (h / H);
    g.fillStyle = '#ece4d2'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(${Math.random() > 0.5 ? '255,255,255' : '90,80,60'},${0.05 * Math.random()})`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    g.fillStyle = '#8e2b2b'; g.fillRect(0, 0, 0.42 * m, h); // pilastra
    g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(0.42 * m, 0, 0.06 * m, h);
    for (let p = 0; p < 3; p++) {
      const b = p * PISO;
      g.fillStyle = '#9a3030'; g.fillRect(0.42 * m, y(b + 1.05), w, (h / H) * 0.6);                     // franja bajo la ventana
      const x0 = 1.1 * m, x1 = 3.2 * m, w0 = y(b + 2.35), w1 = y(b + 1.05);
      g.fillStyle = '#f4f2ec'; g.fillRect(x0 - 5, w0 - 5, x1 - x0 + 10, w1 - w0 + 10);                     // marco
      const gr = g.createLinearGradient(0, w0, 0, w1); gr.addColorStop(0, '#5d6d78'); gr.addColorStop(1, '#2a3238'); g.fillStyle = gr; g.fillRect(x0, w0, x1 - x0, w1 - w0);
      g.fillStyle = 'rgba(240,236,226,.85)'; g.fillRect(x0 + 6, w0 + 6, (x1 - x0) * 0.4, (w1 - w0) * 0.55); // cortina
      g.strokeStyle = '#f4f2ec'; g.lineWidth = 4; g.beginPath(); g.moveTo((x0 + x1) / 2, w0); g.lineTo((x0 + x1) / 2, w1); g.stroke();
      g.strokeStyle = 'rgba(30,30,30,.6)'; g.lineWidth = 2; for (let k = x0 + 10; k < x1; k += 14) { g.beginPath(); g.moveTo(k, w0); g.lineTo(k, w1); g.stroke(); } // reja
    }
    g.fillStyle = '#8e2b2b'; g.fillRect(0, y(H), w, (h / H) * 0.35); // remate bajo el alero
  });
  const testero = lienzo(256, 256, (g, w, h) => { g.fillStyle = '#ece4d2'; g.fillRect(0, 0, w, h); g.fillStyle = '#8e2b2b'; g.fillRect(0, 0, 18, h); g.fillRect(w - 18, 0, 18, h); for (let i = 0; i < 1500; i++) { g.fillStyle = `rgba(90,80,60,${0.05 * Math.random()})`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); } });
  const lamina = lienzo(128, 128, (g, w, h) => { for (let x = 0; x < w; x++) { const v = 0.82 + 0.18 * Math.sin(x / w * Math.PI * 16); g.fillStyle = `rgb(${Math.round(172 * v)},${Math.round(82 * v)},${Math.round(68 * v)})`; g.fillRect(x, 0, 1, h); } for (let i = 0; i < 800; i++) { g.fillStyle = `rgba(40,20,15,${0.08 * Math.random()})`; g.fillRect(Math.random() * w, Math.random() * h, 3, 3); } });
  const matF = new THREE.MeshStandardMaterial({ map: fach, roughness: 0.85 }), matT = new THREE.MeshStandardMaterial({ map: testero, roughness: 0.85 });
  const matL = new THREE.MeshStandardMaterial({ map: lamina, roughness: 0.7, metalness: 0.1, side: THREE.DoubleSide });
  const P = { f: [], t: [], l: [] }, o3 = new THREE.Object3D();
  const quad = (A, a, b, c, d, uv) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c, ...d], 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex([0, 1, 2, 0, 2, 3]); g.computeVertexNormals(); A.push(g); };
  const tri = (A, a, b, c, uv) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c], 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.computeVertexNormals(); A.push(g); };
  const porticos = [];
  for (const r of D.barras) {
    const [cx, cz] = lw(r.c[0], r.c[1]), e = lw(r.c[0] + Math.cos(r.a), r.c[1] + Math.sin(r.a)), ux = e[0] - cx, uz = e[1] - cz, vx = -uz, vz = ux;
    const L2 = r.L / 2, W2 = r.W / 2, pt = (u, v, y) => [cx + u * ux + v * vx, Y0 + y, cz + u * uz + v * vz], nm = r.L / MOD, nw = r.W / 4;
    // fachadas largas (con textura de módulos) y testeros
    quad(P.f, pt(-L2, -W2, 0), pt(L2, -W2, 0), pt(L2, -W2, H), pt(-L2, -W2, H), [0, 0, nm, 0, nm, 1, 0, 1]);
    quad(P.f, pt(L2, W2, 0), pt(-L2, W2, 0), pt(-L2, W2, H), pt(L2, W2, H), [0, 0, nm, 0, nm, 1, 0, 1]);
    quad(P.t, pt(L2, -W2, 0), pt(L2, W2, 0), pt(L2, W2, H), pt(L2, -W2, H), [0, 0, nw, 0, nw, H / 4, 0, H / 4]);
    quad(P.t, pt(-L2, W2, 0), pt(-L2, -W2, 0), pt(-L2, -W2, H), pt(-L2, W2, H), [0, 0, nw, 0, nw, H / 4, 0, H / 4]);
    // cubierta a dos aguas de poca pendiente con alero de 0,6 m; piñones crema
    const hr = r.W * 0.16, o = 0.6, ln = r.L / 2;
    quad(P.l, pt(-L2 - o, -W2 - o, H - 0.15), pt(L2 + o, -W2 - o, H - 0.15), pt(L2 + o, 0, H + hr), pt(-L2 - o, 0, H + hr), [0, 0, ln, 0, ln, 3, 0, 3]);
    quad(P.l, pt(L2 + o, W2 + o, H - 0.15), pt(-L2 - o, W2 + o, H - 0.15), pt(-L2 - o, 0, H + hr), pt(L2 + o, 0, H + hr), [0, 0, ln, 0, ln, 3, 0, 3]);
    for (const s of [-1, 1]) tri(P.t, pt(s * L2, -W2, H), pt(s * L2, W2, H), pt(s * L2, 0, H + hr - 0.1), [0, 0, nw, 0, nw / 2, 0.6]);
    // pórticos de entrada cada dos módulos en una fachada larga (alternando el lado según la barra)
    const lado = (Math.round(r.c[0] + r.c[1]) % 2) ? 1 : -1;
    for (let u = -L2 + MOD; u < L2 - MOD / 2; u += MOD * 2) { const p = pt(u, lado * (W2 + 0.75), 0); porticos.push([p[0], p[2], Math.atan2(-(lado * vz), lado * vx)]); }
  }
  const malla = (L, mat) => { if (!L.length) return; const m = new THREE.Mesh(mergeGeometries(L.map(g => g.index ? g.toNonIndexed() : g)), mat); m.castShadow = m.receiveShadow = !movil; grupo.add(m); };
  malla(P.f, matF); malla(P.t, matT); malla(P.l, matL);
  // pórtico: dos columnas, losa y techito rojo a dos aguas (1,6 m x 1,5 m)
  const gTecho = (() => { const g = new THREE.BufferGeometry(), w = 0.95, d = 0.85, hy = 0.45; g.setAttribute('position', new THREE.Float32BufferAttribute([-w, 0, -d, w, 0, -d, 0, hy, -d, -w, 0, d, 0, hy, d, w, 0, d, -w, 0, -d, 0, hy, -d, 0, hy, d, -w, 0, -d, 0, hy, d, -w, 0, d, w, 0, -d, w, 0, d, 0, hy, d, w, 0, -d, 0, hy, d, 0, hy, -d], 3)); g.computeVertexNormals(); return g; })();
  const gCol = mergeGeometries([new THREE.BoxGeometry(0.16, 2.4, 0.16).translate(-0.8, 1.2, 0.7).toNonIndexed(), new THREE.BoxGeometry(0.16, 2.4, 0.16).translate(0.8, 1.2, 0.7).toNonIndexed()]);
  const mT = new THREE.InstancedMesh(gTecho, new THREE.MeshStandardMaterial({ color: 0xa8382e, roughness: 0.6, side: THREE.DoubleSide }), porticos.length), mC = new THREE.InstancedMesh(gCol, new THREE.MeshStandardMaterial({ color: 0xece4d2, roughness: 0.8 }), porticos.length);
  porticos.forEach(([x, z, rot], i) => { o3.position.set(x, Y0 + 2.4, z); o3.rotation.set(0, rot, 0); o3.updateMatrix(); mT.setMatrixAt(i, o3.matrix); o3.position.y = Y0; o3.updateMatrix(); mC.setMatrixAt(i, o3.matrix); });
  mT.castShadow = mC.castShadow = !movil; grupo.add(mT, mC);
  // cerramiento de cada conjunto (como en Street View): reja negra de barrotes de 1,9 m sobre muro bajo crema y seto amarillo verdoso por fuera
  const lados = [D.barras.filter(r => r.c[0] < 8641), D.barras.filter(r => r.c[0] >= 8641)].filter(l => l.length);
  const casco = (P) => { P = P.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]); const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], hi = []; for (const p of P) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); } for (const p of P.slice().reverse()) { while (hi.length > 1 && cr(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop(); hi.push(p); } return lo.slice(0, -1).concat(hi.slice(0, -1)); };
  const texReja = lienzo(128, 128, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = '#1d1f21'; for (let x = 4; x < w; x += 13) g.fillRect(x, 0, 3, h); g.fillRect(0, 6, w, 5); g.fillRect(0, h - 10, w, 5); });
  const matReja = new THREE.MeshStandardMaterial({ map: texReja, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.5, metalness: 0.4 });
  const matMuro = new THREE.MeshStandardMaterial({ color: 0xe4dccb, roughness: 0.9 }), matSeto = new THREE.MeshStandardMaterial({ color: 0x8aa23c, roughness: 0.95 });
  const R2 = [], M2 = [], S2 = [];
  for (const L of lados) {
    const pts = []; for (const r of L) { const ux = Math.cos(r.a), uy = Math.sin(r.a), vx = -uy, vy = ux; for (const [u, v] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) pts.push([r.c[0] + ux * u * (r.L / 2 + 6) + vx * v * (r.W / 2 + 6), r.c[1] + uy * u * (r.L / 2 + 6) + vy * v * (r.W / 2 + 6)]); }
    const H2 = casco(pts).map(p => lw(p[0], p[1]));
    for (let i = 0; i < H2.length; i++) {
      const a = H2[i], b = H2[(i + 1) % H2.length], len = Math.hypot(b[0] - a[0], b[1] - a[1]), ang = Math.atan2(b[1] - a[1], b[0] - a[0]), mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
      const pr = new THREE.PlaneGeometry(len, 1.9).translate(0, 0.95 + 0.5, 0); const uv = pr.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setX(k, uv.getX(k) * len / 1.6);
      pr.rotateY(-ang).translate(mx, Y0, mz); R2.push(pr);
      M2.push(new THREE.BoxGeometry(len, 0.5, 0.25).translate(0, 0.25, 0).rotateY(-ang).translate(mx, Y0, mz));
      // el seto va del lado de afuera (centroide del conjunto adentro)
      let cx = 0, cz = 0; for (const p of H2) { cx += p[0]; cz += p[1]; } cx /= H2.length; cz /= H2.length; const nx = -(b[1] - a[1]) / len, nz = (b[0] - a[0]) / len, sg = ((mx - cx) * nx + (mz - cz) * nz) > 0 ? 1 : -1;
      S2.push(new THREE.BoxGeometry(len, 1.0, 0.9).translate(0, 0.5, 0).rotateY(-ang).translate(mx + nx * sg * 0.75, Y0, mz + nz * sg * 0.75));
    }
  }
  if (R2.length) { malla(R2, matReja); malla(M2, matMuro); malla(S2, matSeto); }
  T3.conjuntos = grupo;
  return { grupo, barras: D.barras.length };
}
