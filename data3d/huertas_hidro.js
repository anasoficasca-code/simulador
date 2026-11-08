/* ============ E8 · HUERTAS HIDROPÓNICAS EN CUBIERTAS Y BALCONES + RED DE POLINIZADORES (modo Kennedy) ============
   Reemplaza la mancha de color de "Huertas en cubiertas de vivienda en altura" por instalaciones hidropónicas reales:
   - racks NFT en A (tubos de PVC blanco con lechugas, acelgas y albahaca en sus canastillas), torres verticales aeropónicas,
     túneles de policarbonato y el tanque de solución nutritiva de cada terraza
   - jardineras hidropónicas colgadas en los balcones de los edificios de 4 pisos o más
   - polinizadores y aliados de la huerta que llegan a ellas: colibrí chillón (Colibri coruscans), abeja de miel, mariposas
     (Anartia amathea y Ascia monuste) y el copetón (Zonotrichia capensis), que come insectos y semillas de maleza.
     Cada visita une la planta visitada con la anterior: la red de interacciones que conecta los edificios.
   Para que cargue rápido: las instalaciones se calculan una vez y se dibujan solo las cercanas a lo que mira la cámara
   (instancias), los techos lejanos conservan su capa verde. */
export async function iniciarHidroponia({ THREE, T3, techos, movil = false }) {
  const grupo = new THREE.Group(); grupo.name = 'huertas-hidroponicas'; grupo.visible = false; T3.scene.add(grupo);
  const { mergeGeometries } = await import('three/addons/utils/BufferGeometryUtils.js');
  let sem = 7; const rnd = () => ((sem = (sem * 16807) % 2147483647) / 2147483647);
  const ANIS = Math.min(8, T3.renderer.capabilities.getMaxAnisotropy ? T3.renderer.capabilities.getMaxAnisotropy() : 4);
  const lienzo = (w, h, f) => { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = ANIS; return t; };

  // ---------- texturas: hojas de lechuga, acelga y albahaca vistas desde arriba (alfa) ----------
  const texPlantas = lienzo(512, 128, (g, w, h) => { // tira de canastillas con plantas, 4 m de tubo
    g.clearRect(0, 0, w, h);
    const tipos = [['#8fd14f', '#b8e86f'], ['#5fa83a', '#86c84e'], ['#9a3f5c', '#c96a84'], ['#6fb544', '#a3d965']];
    for (let x = 18; x < w; x += 32) {
      const [c1, c2] = tipos[Math.floor(Math.random() * tipos.length)];
      for (let k = 0; k < 11; k++) { const an = k / 11 * 6.28 + Math.random() * 0.5, r = 13 + Math.random() * 9; g.fillStyle = k % 2 ? c1 : c2; g.beginPath(); g.ellipse(x + Math.cos(an) * r * 0.55, h / 2 + Math.sin(an) * r * 0.55, r * 0.7, r * 0.45, an, 0, 7); g.fill(); }
      g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.arc(x - 3, h / 2 - 3, 5, 0, 7); g.fill();
    }
  });
  const texMata = lienzo(128, 128, (g, w, h) => { // mata vista de lado para las torres y jardineras (alfa)
    g.clearRect(0, 0, w, h);
    for (let k = 0; k < 40; k++) { const x = w * (0.15 + 0.7 * Math.random()), y = h * (0.15 + 0.75 * Math.random()), r = 6 + Math.random() * 12; g.fillStyle = ['#5a9a3c', '#77b04a', '#3f7d2c', '#94c560', '#8b3c55'][k % 5]; g.beginPath(); g.ellipse(x, y, r, r * 0.6, Math.random() * 3, 0, 7); g.fill(); }
    for (let k = 0; k < 6; k++) { g.fillStyle = ['#f2d14a', '#e8e8f0', '#d7609b'][k % 3]; g.beginPath(); g.arc(w * (0.2 + 0.6 * Math.random()), h * (0.2 + 0.5 * Math.random()), 3.5, 0, 7); g.fill(); } // flores (albahaca, rúcula, caléndula)
  });
  const matPVC = new THREE.MeshStandardMaterial({ color: 0xf2f2ee, roughness: 0.45, metalness: 0.05 });
  const matMetal = new THREE.MeshStandardMaterial({ color: 0x9aa2a8, roughness: 0.5, metalness: 0.6 });
  const matPlanta = new THREE.MeshStandardMaterial({ map: texPlantas, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.8 });
  const matMata = new THREE.MeshStandardMaterial({ map: texMata, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.8 });
  const matTunel = new THREE.MeshStandardMaterial({ color: 0xeaf4ee, roughness: 0.25, transparent: true, opacity: 0.38, side: THREE.DoubleSide, depthWrite: false });
  const matTanque = new THREE.MeshStandardMaterial({ color: 0x2f6fb0, roughness: 0.5 });
  const matJard = new THREE.MeshStandardMaterial({ color: 0x5b4636, roughness: 0.85 });

  // ---------- geometrías (1 unidad = 1 m) ----------
  const caja = (sx, sy, sz, x, y, z) => new THREE.BoxGeometry(sx, sy, sz).translate(x, y, z);
  const tubo = (L, r, x, y, z) => new THREE.CylinderGeometry(r * 1.4, r * 1.4, L, 8, 1).rotateZ(Math.PI / 2).translate(x, y, z);
  // rack NFT en A: 4 m de largo (x), 3 niveles por lado, tubos de 11 cm
  const nivelesA = [[0.35, 0.55], [0.85, 0.38], [1.35, 0.2]]; // [alto, distancia al eje]
  const gRack = mergeGeometries([
    ...[-1.9, 0, 1.9].flatMap(x => [caja(0.05, 1.6, 0.05, x, 0.8, -0.62).rotateX(0), caja(0.05, 1.6, 0.05, x, 0.8, 0.62)]).map((g, i) => g.rotateX(0)),
    ...nivelesA.flatMap(([y, d]) => [tubo(4, 0.055, 0, y, -d), tubo(4, 0.055, 0, y, d)])
  ]);
  const gRackMetal = mergeGeometries([-1.9, 0, 1.9].map(x => new THREE.BufferGeometry().copy(caja(0.04, 0.04, 1.3, x, 1.5, 0))));
  const gRackPl = mergeGeometries(nivelesA.flatMap(([y, d]) => [-1, 1].map(s => { const g = new THREE.PlaneGeometry(4, 0.62).rotateX(-Math.PI / 2 + s * 0.45); g.translate(0, y + 0.16, s * d); return g; })));
  // torre vertical aeropónica: 1,9 m, con matas en cruz
  const gTorre = mergeGeometries([new THREE.CylinderGeometry(0.11, 0.13, 1.9, 10).translate(0, 0.95, 0), new THREE.CylinderGeometry(0.28, 0.3, 0.32, 12).translate(0, 0.16, 0)]);
  const gTorrePl = mergeGeometries([0, 1, 2].map(k => new THREE.PlaneGeometry(0.62, 1.75).rotateY(k * Math.PI / 3).translate(0, 1.0, 0)));
  // túnel de policarbonato (8 m x 4 m, arco de 2,6 m) y tanque
  const gTunel = new THREE.CylinderGeometry(2.1, 2.1, 8, 16, 1, true, -Math.PI / 2, Math.PI).rotateZ(Math.PI / 2).rotateX(0).scale(1, 1.2, 1);
  const gTunelArcos = mergeGeometries([-4, -2, 0, 2, 4].map(x => new THREE.TorusGeometry(2.1, 0.03, 4, 16, Math.PI).rotateY(Math.PI / 2).scale(1, 1.2, 1).translate(x, 0, 0)));
  const gTanque = new THREE.CylinderGeometry(0.7, 0.7, 1.3, 14).translate(0, 0.65, 0);
  // jardinera de balcón: caja de 1,4 m colgada afuera del antepecho con matas y una franja hidropónica vertical
  const gJard = caja(1.4, 0.4, 0.42, 0, 0.2, 0.25);
  const gJardPl = mergeGeometries([new THREE.PlaneGeometry(1.5, 0.75).translate(0, 0.65, 0.25), new THREE.PlaneGeometry(1.5, 0.75).rotateY(Math.PI / 2.4).translate(0, 0.62, 0.25), new THREE.PlaneGeometry(0.5, 1.4).translate(0.95, 1.1, 0.06)]);

  // ---------- dónde va cada instalación (una vez) ----------
  const enPoli = (W, x, z) => { let c = false; for (let i = 0, j = W.length - 1; i < W.length; j = i++) { const a = W[i], b = W[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
  const distBorde = (W, x, z) => { let m = 1e9; for (let i = 0, j = W.length - 1; i < W.length; j = i++) { const a = W[j], b = W[i], dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / L2)); m = Math.min(m, Math.hypot(x - a[0] - t * dx, z - a[1] - t * dz)); } return m; };
  const INST = { rack: [], torre: [], tunel: [], tanque: [], jard: [] }; // [x, y, z, rotY, celda]
  const FLORES = []; // puntos que visitan los polinizadores: [x, y, z, tipo(0 techo, 1 balcón), techo]
  const CELDA = 150, celdas = new Map(), clave = (x, z) => Math.floor(x / CELDA) + ',' + Math.floor(z / CELDA);
  const meter = (k, x, y, z, r) => { const c = clave(x, z); INST[k].push([x, y, z, r, c]); };
  techos.forEach((t, ti) => {
    const W = t.W, n = W.length; if (n < 3) return;
    let cx = 0, cz = 0, A = 0, Lmax = 0, ang = 0;
    for (let i = 0; i < n; i++) { const p = W[i], q = W[(i + 1) % n]; A += p[0] * q[1] - q[0] * p[1]; cx += p[0]; cz += p[1]; const l = Math.hypot(q[0] - p[0], q[1] - p[1]); if (l > Lmax) { Lmax = l; ang = Math.atan2(q[1] - p[1], q[0] - p[0]); } }
    cx /= n; cz /= n; const area = Math.abs(A) / 2, y = t.h + 0.32; // sobre la capa de la cubierta de E8 (que se pinta 0,3 m sobre el techo)
    if (area < 40) return;
    const ux = Math.cos(ang), uz = Math.sin(ang), vx = -uz, vz = ux, rot = -ang;
    // rejilla de racks a lo largo del eje largo: filas cada 2,6 m, racks de 4 m cada 4,8 m, a más de 1,2 m del antepecho
    let puestos = 0; const max = Math.min(movil ? 10 : 34, Math.floor(area / 22)), tunel = area > 450 && rnd() < 0.45;
    for (let v = -40; v <= 40 && puestos < max; v += 2.6) for (let u = -60; u <= 60 && puestos < max; u += 4.8) {
      const x = cx + u * ux + v * vx, z = cz + u * uz + v * vz;
      if (!enPoli(W, x, z) || distBorde(W, x, z) < (tunel && puestos < 2 ? 2.6 : 2.3)) continue;
      if (tunel && puestos === 0) { meter('tunel', x, y, z, rot); puestos++; continue; }
      if (rnd() < 0.3) { meter('torre', x - ux * 0.8, y, z - uz * 0.8, rot); meter('torre', x + ux * 0.8, y, z + uz * 0.8, rot); FLORES.push([x + ux * 0.8 + vx * 0.45, y + 1.25, z + uz * 0.8 + vz * 0.45, 0, ti, vx, vz]); }
      else { meter('rack', x, y, z, rot); const sd = rnd() < 0.5 ? 1 : -1; FLORES.push([x + ux * (rnd() * 3 - 1.5) + vx * sd * 0.95, y + 1.0, z + uz * (rnd() * 3 - 1.5) + vz * sd * 0.95, 0, ti, vx * sd, vz * sd]); } // frente a las lechugas del nivel medio, por fuera del rack
      puestos++;
    }
    if (puestos) { const x = cx - (ux + vx) * 1.2, z = cz - (uz + vz) * 1.2; if (enPoli(W, x, z)) meter('tanque', x, y, z, 0); }
    // balcones: edificios de 4 pisos o más, en los lados largos, una jardinera cada ~5 m en pisos alternos
    if (t.h >= 11) {
      const ccw = A > 0;
      for (let i = 0; i < n; i++) {
        const p = W[i], q = W[(i + 1) % n], L = Math.hypot(q[0] - p[0], q[1] - p[1]); if (L < 7) continue;
        const dx = (q[0] - p[0]) / L, dz = (q[1] - p[1]) / L, nx = ccw ? dz : -dz, nz = ccw ? -dx : dx; // normal hacia afuera
        const rotB = Math.atan2(nx, nz);
        for (let piso = 1; piso * 3 + 1 < t.h - 2; piso++) for (let s = 2.5; s < L - 2; s += 5) {
          if (rnd() > (movil ? 0.22 : 0.42)) continue;
          const x = p[0] + dx * s + nx * 0.05, z = p[1] + dz * s + nz * 0.05, yy = piso * 3 + 0.95;
          meter('jard', x, yy, z, rotB); if (rnd() < 0.5) FLORES.push([x + nx * 0.75, yy + 0.75, z + nz * 0.75, 1, ti, nx, nz]);
        }
      }
    }
  });
  // índice espacial de flores (para que los polinizadores elijan la siguiente cerca)
  const FC = new Map(); FLORES.forEach((f, i) => { const c = clave(f[0], f[2]); if (!FC.has(c)) FC.set(c, []); FC.get(c).push(i); });

  // ---------- instancias: solo las cercanas a lo que mira la cámara ----------
  const CAP = movil ? { rack: 1400, torre: 900, tunel: 80, tanque: 200, jard: 1800 } : { rack: 9000, torre: 5000, tunel: 400, tanque: 1100, jard: 10000 };
  const capa = (k, partes) => partes.map(([g, m, sombra]) => { const im = new THREE.InstancedMesh(g, m, CAP[k]); im.count = 0; im.castShadow = !!sombra && !movil; im.frustumCulled = false; grupo.add(im); return im; });
  const IM = {
    rack: capa('rack', [[gRack, matPVC, true], [gRackMetal, matMetal], [gRackPl, matPlanta]]),
    torre: capa('torre', [[gTorre, matPVC, true], [gTorrePl, matMata]]),
    tunel: capa('tunel', [[gTunel, matTunel], [gTunelArcos, matMetal]]),
    tanque: capa('tanque', [[gTanque, matTanque, true]]),
    jard: capa('jard', [[gJard, matJard], [gJardPl, matMata]])
  };
  const o3 = new THREE.Object3D(), foco = new THREE.Vector3();
  let ultimo = null;
  function recalcular() {
    const c = T3.orbit ? T3.orbit.target : foco.set(0, 0, 0), R = (movil ? 420 : 750) + Math.min(900, T3.camera.position.distanceTo(c) * 0.5);
    if (ultimo && ultimo.distanceTo(c) < R * 0.12) return; ultimo = (ultimo || new THREE.Vector3()).copy(c);
    const r2 = R * R;
    for (const k of Object.keys(IM)) {
      let n = 0; const lista = INST[k].filter(p => (p[0] - c.x) ** 2 + (p[2] - c.z) ** 2 < r2).sort((a, b) => ((a[0] - c.x) ** 2 + (a[2] - c.z) ** 2) - ((b[0] - c.x) ** 2 + (b[2] - c.z) ** 2));
      for (const p of lista) { if (n >= CAP[k]) break; o3.position.set(p[0], p[1], p[2]); o3.rotation.set(0, p[3], 0); o3.updateMatrix(); for (const im of IM[k]) im.setMatrixAt(n, o3.matrix); n++; }
      for (const im of IM[k]) { im.count = n; im.instanceMatrix.needsUpdate = true; }
    }
    centro.copy(c); radio = Math.min(R, movil ? 260 : 420);
  }
  const centro = new THREE.Vector3(); let radio = 400;

  // ---------- polinizadores y aliados de la huerta ----------
  const ESP = {
    colibri: { n: 'Colibrí chillón', sci: 'Colibri coruscans', c: '#2fae6e', v: 9, cant: movil ? 14 : 36, liba: [1.2, 3.2], salto: 70, rol: 'Poliniza las flores de albahaca, rúcula y caléndula de las huertas; vuelve a las mismas flores cada pocos minutos (rutas de trapline)' },
    abeja: { n: 'Abeja de miel', sci: 'Apis mellifera', c: '#f2c230', v: 4.5, cant: movil ? 40 : 120, liba: [2, 6], salto: 35, rol: 'Poliniza hortalizas y aromáticas; la colmena de barrio las conecta con parques y humedales' },
    mariposa: { n: 'Mariposas', sci: 'Anartia amathea · Ascia monuste', c: '#ff8a3d', v: 2.4, cant: movil ? 16 : 50, liba: [3, 8], salto: 25, rol: 'Visitan flores de la huerta; su presencia indica una huerta sin plaguicidas' },
    abejorro: { n: 'Abejorro', sci: 'Bombus atratus', c: '#3a3a3a', v: 3.6, cant: movil ? 14 : 40, liba: [2, 5], salto: 30, rol: 'Abejorro nativo de la sabana: poliniza tomate, fresa y uchuva por vibración, aun con frío y llovizna' },
    copeton: { n: 'Copetón', sci: 'Zonotrichia capensis', c: '#b48a5a', v: 6, cant: movil ? 6 : 18, liba: [4, 10], salto: 45, rol: 'Come insectos y semillas de maleza entre los racks: control natural de plagas sin dañar la huerta' }
  };
  // modelos (1 unidad = 1 m), hechos de piezas simples pero con su silueta y color reales
  const elip = (rx, ry, rz, x, y, z, col) => { const g = new THREE.SphereGeometry(1, 10, 7).scale(rx, ry, rz).translate(x, y, z); const c = new THREE.Color(col), a = new Float32Array(g.attributes.position.count * 3); for (let i = 0; i < a.length; i += 3) { a[i] = c.r; a[i + 1] = c.g; a[i + 2] = c.b; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g; };
  const cono = (r, L, x, y, z, rz, col) => { const g = new THREE.ConeGeometry(r, L, 6).rotateZ(rz).translate(x, y, z); const c = new THREE.Color(col), a = new Float32Array(g.attributes.position.count * 3); for (let i = 0; i < a.length; i += 3) { a[i] = c.r; a[i + 1] = c.g; a[i + 2] = c.b; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); for (const k of ['uv']) g.deleteAttribute(k); return g; };
  const limpio = (gs) => mergeGeometries(gs.map(g => { if (g.attributes.uv) g.deleteAttribute('uv'); return g.index ? g.toNonIndexed() : g; }));
  const cuerpos = {
    // colibrí: cuerpo verde esmeralda iridiscente, garganta violeta, pico largo y recto, cola ahorquillada oscura (10 cm)
    colibri: limpio([elip(0.035, 0.016, 0.017, 0, 0, 0, '#1f9a5c'), elip(0.016, 0.015, 0.015, 0.038, 0.006, 0, '#178a4f'), elip(0.012, 0.008, 0.012, 0.03, -0.008, 0, '#5a3fb8'), cono(0.003, 0.04, 0.072, 0.006, 0, -Math.PI / 2, '#151515'), cono(0.012, 0.035, -0.05, -0.002, 0, Math.PI / 2, '#1d3a33'), elip(0.004, 0.004, 0.004, 0.047, 0.012, 0.009, '#050505'), elip(0.004, 0.004, 0.004, 0.047, 0.012, -0.009, '#050505')]),
    // abeja: tórax pardo velludo y abdomen con franjas (1,5 cm)
    abeja: limpio([elip(0.004, 0.004, 0.004, 0.004, 0, 0, '#5a4524'), elip(0.0065, 0.0045, 0.0045, -0.005, -0.0005, 0, '#e0a52a'), elip(0.0066, 0.0046, 0.0046, -0.006, -0.0005, 0, '#2a2016').scale(0.45, 1.02, 1.02).translate(-0.003, 0, 0), elip(0.0066, 0.0046, 0.0046, -0.008, -0.0005, 0, '#2a2016').scale(0.3, 1.02, 1.02).translate(-0.006, 0, 0), elip(0.0032, 0.003, 0.003, 0.0095, 0.0005, 0, '#2a2016')]),
    // mariposa: cuerpo delgado oscuro (las alas son aparte)
    mariposa: limpio([elip(0.014, 0.0025, 0.0025, 0, 0, 0, '#2a2520'), elip(0.0035, 0.003, 0.003, 0.016, 0.001, 0, '#2a2520')]),
    // abejorro: negro y velludo con la punta del abdomen amarillenta (2 cm)
    abejorro: limpio([elip(0.006, 0.0055, 0.0055, 0.005, 0, 0, '#1d1b18'), elip(0.009, 0.0068, 0.0068, -0.007, -0.0005, 0, '#24211d'), elip(0.004, 0.0045, 0.0045, -0.015, -0.001, 0, '#d9b43a'), elip(0.0038, 0.0035, 0.0035, 0.012, 0, 0, '#141210')]),
    // copetón: pardo con rayas, cresta gris y collar rufo (15 cm)
    copeton: limpio([elip(0.055, 0.032, 0.03, 0, 0, 0, '#8a6a48'), elip(0.03, 0.025, 0.026, 0.05, 0.022, 0, '#7d7a72'), elip(0.02, 0.018, 0.028, 0.03, 0.002, 0, '#b0643a'), elip(0.03, 0.022, 0.024, 0.005, -0.012, 0, '#ddd6c8'), cono(0.006, 0.016, 0.083, 0.02, 0, -Math.PI / 2, '#3b3631'), cono(0.014, 0.05, -0.075, 0.004, 0, Math.PI / 2 + 0.15, '#5a4636'), cono(0.008, 0.025, 0.045, 0.05, 0, 0.5, '#6f6a62'), elip(0.004, 0.004, 0.004, 0.067, 0.03, 0.013, '#050505'), elip(0.004, 0.004, 0.004, 0.067, 0.03, -0.013, '#050505')])
  };
  // alas: media ala con la raíz en el origen, a lo largo de +z; se baten girando en x
  const texAlaMar = lienzo(128, 128, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = '#e8762c'; g.beginPath(); g.moveTo(0, h * 0.5); g.bezierCurveTo(w * 0.3, -h * 0.05, w, h * 0.05, w * 0.95, h * 0.45); g.bezierCurveTo(w, h * 0.75, w * 0.4, h, 0, h * 0.55); g.fill(); g.strokeStyle = '#2a1a10'; g.lineWidth = 7; g.stroke(); g.fillStyle = '#fff'; for (const [x, y] of [[0.8, 0.3], [0.85, 0.55], [0.7, 0.2]]) { g.beginPath(); g.arc(x * w, y * h, 4, 0, 7); g.fill(); } });
  const texAlaBla = lienzo(128, 128, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = '#f4f2ea'; g.beginPath(); g.moveTo(0, h * 0.5); g.bezierCurveTo(w * 0.3, -h * 0.05, w, h * 0.05, w * 0.95, h * 0.45); g.bezierCurveTo(w, h * 0.75, w * 0.4, h, 0, h * 0.55); g.fill(); g.fillStyle = '#3a3a3a'; g.fillRect(w * 0.75, h * 0.1, w * 0.2, h * 0.12); });
  const ala = (largo, ancho, x) => new THREE.PlaneGeometry(ancho, largo).rotateX(-Math.PI / 2).translate(x, 0, largo / 2);
  const ALAS = {
    colibri: [ala(0.06, 0.022, 0.005), new THREE.MeshBasicMaterial({ color: 0x9fb8b0, transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthWrite: false }), 42],
    abejorro: [ala(0.014, 0.007, 0.004), new THREE.MeshBasicMaterial({ color: 0xc9d2dc, transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false }), 30],
    abeja: [ala(0.011, 0.005, 0.003), new THREE.MeshBasicMaterial({ color: 0xdfe8f2, transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false }), 34],
    mariposa: [ala(0.035, 0.04, 0.002), null, 6],
    copeton: [ala(0.085, 0.045, 0), new THREE.MeshStandardMaterial({ color: 0x6e5238, side: THREE.DoubleSide, roughness: 0.8 }), 14]
  };
  const matAlaMar = [new THREE.MeshStandardMaterial({ map: texAlaMar, alphaTest: 0.3, side: THREE.DoubleSide }), new THREE.MeshStandardMaterial({ map: texAlaBla, alphaTest: 0.3, side: THREE.DoubleSide })];
  const AG = [], MESH = {};
  for (const [k, e] of Object.entries(ESP)) {
    const cuerpo = new THREE.InstancedMesh(cuerpos[k], new THREE.MeshStandardMaterial({ vertexColors: true, roughness: k === 'colibri' ? 0.25 : 0.7, metalness: k === 'colibri' ? 0.45 : 0 }), e.cant);
    const alas = k === 'mariposa' ? matAlaMar.map(m => [0, 1].map(() => new THREE.InstancedMesh(ALAS[k][0], m, e.cant))) : [[0, 1].map(() => new THREE.InstancedMesh(ALAS[k][0], ALAS[k][1], e.cant))];
    for (const m of [cuerpo, ...alas.flat()]) { m.frustumCulled = false; grupo.add(m); }
    MESH[k] = { cuerpo, alas };
    for (let i = 0; i < e.cant; i++) AG.push({ e: k, i, x: 0, y: -999, z: 0, vx: 0, vy: 0, vz: 0, st: 'nuevo', t: rnd() * 3, flor: -1, prev: -1, fase: rnd() * 6, var: k === 'mariposa' ? (rnd() < 0.6 ? 0 : 1) : 0, vis: 0 });
  }
  const florCerca = (x, z, R) => { // flor al azar a menos de R m (o cualquiera del área visible)
    const out = [], c0 = Math.floor(x / CELDA), r0 = Math.floor(z / CELDA), nc = Math.ceil(R / CELDA);
    for (let i = -nc; i <= nc; i++) for (let j = -nc; j <= nc; j++) { const l = FC.get((c0 + i) + ',' + (r0 + j)); if (l) for (const f of l) { const F = FLORES[f]; if ((F[0] - x) ** 2 + (F[2] - z) ** 2 < R * R) out.push(f); } }
    return out.length ? out[Math.floor(rnd() * out.length)] : -1;
  };
  // red de visitas: aristas recientes entre flores consecutivas de un mismo individuo (color de la especie)
  const MAXA = movil ? 160 : 520, red = new Float32Array(MAXA * 6), redC = new Float32Array(MAXA * 6), aristas = [];
  const gRed = new THREE.BufferGeometry(); gRed.setAttribute('position', new THREE.BufferAttribute(red, 3)); gRed.setAttribute('color', new THREE.BufferAttribute(redC, 3));
  const lineasRed = new THREE.LineSegments(gRed, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending }));
  lineasRed.frustumCulled = false; lineasRed.renderOrder = 8; grupo.add(lineasRed);
  const COLE = Object.fromEntries(Object.entries(ESP).map(([k, e]) => [k, new THREE.Color(e.c)]));
  const conteo = { visitas: 0, edificios: new Set(), cruces: 0 };
  function visitar(a, f) {
    if (a.flor >= 0 && f >= 0) {
      const A = FLORES[a.flor], B = FLORES[f];
      aristas.push({ a: [A[0], A[1], A[2]], b: [B[0], B[1], B[2]], c: COLE[a.e], t: 0, cruza: A[4] !== B[4] });
      if (aristas.length > MAXA) aristas.shift();
      conteo.visitas++; if (A[4] !== B[4]) conteo.cruces++; conteo.edificios.add(B[4]);
    }
    a.prev = a.flor; a.flor = f;
  }
  function moverA(a, dt, cam) {
    const e = ESP[a.e];
    if (a.st === 'nuevo') { // aparece en una flor al azar del área visible
      const f = florCerca(centro.x, centro.z, radio); if (f < 0) return;
      const F = FLORES[f]; a.x = F[0] + (rnd() - 0.5) * 20; a.y = F[1] + 6 + rnd() * 10; a.z = F[2] + (rnd() - 0.5) * 20; a.flor = -1; a.dest = f; a.st = 'vuela'; return;
    }
    if (a.st === 'liba') {
      a.t -= dt; const F = FLORES[a.flor]; if (!F) { a.st = 'nuevo'; return; }
      if (F[5] !== undefined) { a.vx = -F[5] * 0.01; a.vz = -F[6] * 0.01; a.vy = 0; } // de frente a la planta
      const r = a.e === 'colibri' ? 0.18 : a.e === 'copeton' ? 0.05 : 0.07; // el colibrí se cierne frente a la flor; abejas y mariposas se posan
      a.x += (F[0] + Math.cos(a.fase) * r - a.x) * Math.min(1, dt * 6); a.y += (F[1] + (a.e === 'copeton' ? -0.2 : 0) + Math.sin(a.fase * 3) * 0.01 - a.y) * Math.min(1, dt * 6); a.z += (F[2] + Math.sin(a.fase) * r - a.z) * Math.min(1, dt * 6);
      if (a.t <= 0) { // siguiente flor: casi siempre cerca (misma huerta o el balcón de al lado); a veces otro edificio
        const lejos = rnd() < 0.22, f = florCerca(a.x, a.z, lejos ? e.salto * 2.5 : e.salto); if (f < 0) { a.st = 'nuevo'; return; }
        a.dest = f; a.st = 'vuela';
      }
      return;
    }
    // vuelo hacia la flor de destino (con arco y, para mariposas, aleteo errático)
    const F = FLORES[a.dest]; if (!F) { a.st = 'nuevo'; return; }
    const dx = F[0] - a.x, dy = F[1] + (a.e === 'colibri' ? 0 : 0.06) - a.y, dz = F[2] - a.z, d = Math.hypot(dx, dy, dz);
    if (d < 0.25) { visitar(a, a.dest); a.st = 'liba'; a.t = e.liba[0] + rnd() * (e.liba[1] - e.liba[0]); return; }
    const sube = Math.min(6, d * 0.15) * Math.min(1, d / 20), v = e.v * (a.e === 'mariposa' ? 0.7 + 0.5 * Math.sin(a.fase * 0.7) : 1);
    let tx = dx / d * v, ty = (dy + sube) / Math.max(1, d) * v, tz = dz / d * v;
    if (a.e === 'mariposa') { tx += Math.sin(a.fase * 1.9) * 0.9; ty += Math.cos(a.fase * 2.3) * 0.8; tz += Math.cos(a.fase * 1.7) * 0.9; }
    if (a.e === 'abeja' || a.e === 'abejorro') { tx += Math.sin(a.fase * 5) * 0.4; tz += Math.cos(a.fase * 4) * 0.4; }
    const k = Math.min(1, dt * (a.e === 'colibri' ? 7 : 3.5));
    a.vx += (tx - a.vx) * k; a.vy += (ty - a.vy) * k; a.vz += (tz - a.vz) * k;
    const paso = Math.min(d, Math.hypot(a.vx, a.vy, a.vz) * dt) / Math.max(1e-6, Math.hypot(a.vx, a.vy, a.vz) * dt);
    a.x += a.vx * dt * paso; a.y += a.vy * dt * paso; a.z += a.vz * dt * paso;
  }
  const q = new THREE.Quaternion(), qa = new THREE.Quaternion(), eu = new THREE.Euler(), pos = new THREE.Vector3(), esc = new THREE.Vector3(), M4 = new THREE.Matrix4(), Mala = new THREE.Matrix4();
  function dibujarA(a, dt, cam) {
    const m = MESH[a.e], e = ESP[a.e];
    a.fase += dt * (a.st === 'liba' ? 1.3 : 1);
    // tamaño real de cerca; de lejos se agrandan para seguir viéndose (como un marcador), sin pasar de 25 veces
    const dist = Math.hypot(a.x - cam.position.x, a.y - cam.position.y, a.z - cam.position.z), base = { colibri: 0.1, abeja: 0.016, abejorro: 0.022, mariposa: 0.07, copeton: 0.16 }[a.e];
    const s = Math.min(25, Math.max(a.e === 'colibri' || a.e === 'copeton' ? 1.4 : 2.2, dist * 0.007 / base)); // de cerca un poco más grandes que en la realidad para poder verlos
    const yaw = Math.atan2(-a.vz, a.vx), cabeceo = a.st === 'liba' ? (a.e === 'colibri' ? 0.35 : 0) : Math.atan2(a.vy, Math.hypot(a.vx, a.vz)) * 0.5;
    eu.set(0, yaw, cabeceo, 'YZX'); q.setFromEuler(eu); pos.set(a.x, a.y, a.z); esc.set(s, s, s); M4.compose(pos, q, esc);
    m.cuerpo.setMatrixAt(a.i, M4);
    // aleteo: colibrí y abeja muy rápido (borroso), mariposa lento y amplio, copetón con pausas
    const posado = a.st === 'liba' && (a.e === 'mariposa' || a.e === 'copeton' || a.e === 'abeja' || a.e === 'abejorro');
    const f = ALAS[a.e][2], amp = posado ? (a.e === 'mariposa' ? 0.5 + 0.4 * Math.sin(a.fase * 2) : 0.05) : a.e === 'mariposa' ? 1.1 : 0.9;
    const angA = posado && a.e === 'mariposa' ? 1.2 + 0.3 * Math.sin(a.fase * 2) : Math.sin(performance.now() / 1000 * f * 6.283 + a.i) * amp;
    m.alas.forEach((par, vi) => par.forEach((im, lado) => {
      const vis = a.e !== 'mariposa' || vi === a.var;
      eu.set((lado ? -1 : 1) * angA, 0, 0); qa.setFromEuler(eu); if (lado) qa.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI));
      Mala.compose(new THREE.Vector3(0, a.e === 'copeton' ? 0.02 : 0.005, 0), qa, new THREE.Vector3(1, 1, vis ? 1 : 0)); im.setMatrixAt(a.i, M4.clone().multiply(Mala));
    }));
  }
  // ficha y contador de la red
  const css = document.createElement('style'); css.textContent = `
#hid-red{position:fixed;z-index:9;left:50%;top:14px;transform:translateX(-50%);display:none;align-items:center;gap:12px;padding:8px 14px;border-radius:12px;background:rgba(8,16,26,.86);border:1px solid rgba(125,211,252,.25);color:#e2f3ff;font:600 11px system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
#hid-red b{color:#7dd3fc;letter-spacing:.12em;text-transform:uppercase;font-size:10px}#hid-red span{display:inline-flex;align-items:center;gap:5px;white-space:nowrap}#hid-red i{width:8px;height:8px;border-radius:50%;display:inline-block}
#hid-red em{font-style:normal;color:#94a3b8;font-weight:500}
@media(max-width:760px){#hid-red{top:auto;bottom:86px;flex-wrap:wrap;justify-content:center;max-width:calc(100vw - 24px);gap:6px 10px;font-size:10px}}`;
  document.head.appendChild(css);
  const panel = document.createElement('div'); panel.id = 'hid-red';
  panel.innerHTML = '<b>Red de polinización · huertas hidropónicas</b>' + Object.entries(ESP).map(([k, e]) => `<span title="${e.sci} · ${e.rol}"><i style="background:${e.c}"></i>${e.n} ${e.cant}</span>`).join('') + '<em id="hid-cnt"></em>';
  document.body.appendChild(panel);
  let tUlt = performance.now(), tRec = 0, tPanel = 0;
  function cuadro() {
    requestAnimationFrame(cuadro);
    if (!grupo.visible) return;
    const ahora = performance.now(), dt = Math.min(0.05, (ahora - tUlt) / 1000); tUlt = ahora;
    if ((tRec -= dt) <= 0) { tRec = 0.6; recalcular(); }
    const cam = T3.camera;
    for (const a of AG) {
      // el que quedó lejos del área visible reaparece cerca
      if (a.st !== 'nuevo' && (a.x - centro.x) ** 2 + (a.z - centro.z) ** 2 > (radio * 1.6) ** 2) a.st = 'nuevo';
      moverA(a, dt, cam); dibujarA(a, dt, cam);
    }
    for (const m of Object.values(MESH)) { m.cuerpo.instanceMatrix.needsUpdate = true; for (const par of m.alas) for (const im of par) im.instanceMatrix.needsUpdate = true; }
    // aristas de la red: se desvanecen en ~40 s; las que cruzan de un edificio a otro, más brillantes
    let n = 0;
    for (const r of aristas) {
      r.t += dt; const k = Math.max(0, 1 - r.t / 40) * (r.cruza ? 1 : 0.55); if (k <= 0) continue;
      red.set([r.a[0], r.a[1], r.a[2], r.b[0], r.b[1], r.b[2]], n * 6); for (let j = 0; j < 2; j++) { redC[n * 6 + j * 3] = r.c.r * k; redC[n * 6 + j * 3 + 1] = r.c.g * k; redC[n * 6 + j * 3 + 2] = r.c.b * k; } n++;
    }
    gRed.setDrawRange(0, n * 2); gRed.attributes.position.needsUpdate = true; gRed.attributes.color.needsUpdate = true;
    if ((tPanel -= dt) <= 0) { tPanel = 0.5; const c = document.getElementById('hid-cnt'); if (c) c.textContent = `${conteo.visitas.toLocaleString('es-CO')} visitas · ${conteo.cruces.toLocaleString('es-CO')} entre edificios · ${conteo.edificios.size} edificios conectados`; }
  }
  requestAnimationFrame(cuadro);
  T3.hidroAgentes = AG; T3.hidroMesh = MESH; // para depurar
  const total = Object.fromEntries(Object.entries(INST).map(([k, v]) => [k, v.length]));
  return {
    grupo, total, flores: FLORES.length,
    ver: (on) => { grupo.visible = on; panel.style.display = on ? 'flex' : 'none'; if (on) { ultimo = null; recalcular(); } }
  };
}
