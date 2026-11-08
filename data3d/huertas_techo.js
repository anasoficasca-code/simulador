/* ============ HUERTAS EN TERRAZAS (modo Kennedy) ============
   En los edificios de más de 5 pisos la cubierta plana se vuelve huerta productiva, como las azoteas cultivadas de referencia
   (DakAkker, Rotterdam): piso de grava transitable, camas de cultivo elevadas en hileras con distintos cultivos (lechuga, repollo,
   plántulas, tomate con flor, aromáticas y tierra recién arada), jardineras con setos en todo el borde y, en las terrazas grandes,
   invernadero de vidrio, tanque de agua lluvia y composteras.
   Todo se arma por lotes en pocas mallas (una por material). Uso: const H = crearHuertasTecho(THREE, T3, { liviano });
   H.agregar([{ W: [[x, z], ...], y: alturaDeLaCubierta }, ...]). */
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export function crearHuertasTecho(THREE, T3, opt = {}) {
  const LIV = !!opt.liviano;
  /* ---------- texturas ---------- */
  const lienzo = (w, h, f) => { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
  let sem = 7; const rnd = () => (sem = (sem * 16807) % 2147483647) / 2147483647;
  // atlas de cultivos 3 x 2 (cada celda = la cara de arriba de una cama de cultivo)
  const CELDA = 256;
  const atlas = lienzo(CELDA * 3, CELDA * 2, (g) => {
    const tierra = (x0, y0, osc) => { g.fillStyle = osc ? '#3b2a1d' : '#4a3424'; g.fillRect(x0, y0, CELDA, CELDA);
      for (let k = 0; k < 900; k++) { g.fillStyle = `rgba(${rnd() < 0.5 ? '25,16,10' : '110,84,60'},${0.15 + rnd() * 0.25})`; g.fillRect(x0 + rnd() * CELDA, y0 + rnd() * CELDA, 2 + rnd() * 3, 2 + rnd() * 3); } };
    const mata = (x, y, r, h, s, l) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `hsl(${h},${s}%,${l + 14}%)`); gr.addColorStop(0.7, `hsl(${h},${s}%,${l}%)`); gr.addColorStop(1, `hsla(${h},${s}%,${l - 8}%,0)`); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); };
    const hileras = (x0, y0, filas, cada, r, h, s, l, jit) => { for (let f = 0; f < filas; f++) for (let x = cada / 2; x < CELDA; x += cada) mata(x0 + x + (rnd() - 0.5) * jit, y0 + (f + 0.5) * CELDA / filas + (rnd() - 0.5) * jit, r * (0.8 + rnd() * 0.4), h + (rnd() - 0.5) * 10, s, l + (rnd() - 0.5) * 8); };
    // 0 lechuga (verde claro, hileras apretadas)
    tierra(0, 0); hileras(0, 0, 3, 34, 19, 95, 55, 42, 4);
    // 1 repollo / col (verde azulado, matas grandes)
    tierra(CELDA, 0); hileras(CELDA, 0, 2, 52, 30, 150, 22, 46, 5);
    // 2 plántulas sobre tierra oscura
    tierra(CELDA * 2, 0, true); hileras(CELDA * 2, 0, 4, 18, 5, 100, 60, 45, 3);
    // 3 tomate y flores (follaje enredado con frutos rojos y flores amarillas)
    tierra(0, CELDA); for (let k = 0; k < 260; k++) mata(rnd() * CELDA, CELDA + rnd() * CELDA, 8 + rnd() * 12, 105 + rnd() * 20, 45, 30 + rnd() * 12);
    for (let k = 0; k < 60; k++) { g.fillStyle = rnd() < 0.65 ? '#c8261d' : '#f2c62e'; g.beginPath(); g.arc(rnd() * CELDA, CELDA + rnd() * CELDA, 3 + rnd() * 3, 0, 7); g.fill(); }
    // 4 aromáticas (textura fina gris verdosa en franjas)
    tierra(CELDA, CELDA); for (let k = 0; k < 1400; k++) { const y = Math.floor(rnd() * 5); g.fillStyle = `hsl(${85 + y * 14},${25 + y * 6}%,${36 + rnd() * 18}%)`; g.fillRect(CELDA + rnd() * CELDA, CELDA + y * CELDA / 5 + 6 + rnd() * (CELDA / 5 - 12), 2, 4 + rnd() * 5); }
    // 5 tierra recién arada con surcos
    tierra(CELDA * 2, CELDA); for (let f = 0; f < 7; f++) { g.fillStyle = 'rgba(20,12,7,0.45)'; g.fillRect(CELDA * 2, CELDA + f * CELDA / 7 + 14, CELDA, 6); }
  });
  // grava y losetas de la terraza
  // piso de la huerta: tierra y mantillo oscuro con algo de gravilla y brotes (como la azotea de la foto de referencia)
  const grava = lienzo(256, 256, (g) => { g.fillStyle = '#4d4034'; g.fillRect(0, 0, 256, 256);
    for (let k = 0; k < 4200; k++) { const r = rnd(); g.fillStyle = r < 0.5 ? `rgba(30,22,15,${0.3 + rnd() * 0.3})` : r < 0.85 ? `rgba(${110 + rnd() * 40},${96 + rnd() * 30},${80 + rnd() * 20},0.5)` : `hsla(${85 + rnd() * 30},40%,${25 + rnd() * 15}%,0.7)`; g.fillRect(rnd() * 256, rnd() * 256, 2 + rnd() * 3, 2 + rnd() * 3); } });
  grava.wrapS = grava.wrapT = THREE.RepeatWrapping;
  // follaje de los setos
  const hoja = lienzo(256, 256, (g) => { g.fillStyle = '#2f4a22'; g.fillRect(0, 0, 256, 256);
    for (let k = 0; k < 2200; k++) { g.fillStyle = `hsl(${85 + rnd() * 35},${35 + rnd() * 25}%,${18 + rnd() * 26}%)`; g.beginPath(); g.ellipse(rnd() * 256, rnd() * 256, 3 + rnd() * 4, 2 + rnd() * 3, rnd() * 3, 0, 7); g.fill(); } });
  hoja.wrapS = hoja.wrapT = THREE.RepeatWrapping;

  const env = T3.env || null;
  const M = {
    piso: new THREE.MeshStandardMaterial({ map: grava, roughness: 0.95, side: THREE.DoubleSide }),
    cultivo: new THREE.MeshStandardMaterial({ map: atlas, roughness: 0.92 }),
    seto: new THREE.MeshStandardMaterial({ map: hoja, vertexColors: true, roughness: 0.9 }),
    partes: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82 }),
    plantas: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 }),
    vidrio: new THREE.MeshPhysicalMaterial({ color: 0xdfeee8, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.32, envMap: env, envMapIntensity: 1.2, depthWrite: false, side: THREE.DoubleSide })
  };
  for (const m of Object.values(M)) { m.polygonOffset = true; m.polygonOffsetFactor = -1; m.polygonOffsetUnits = -2; }

  /* ---------- utilidades ---------- */
  const preparar = (g, col) => {
    if (g.index) g = g.toNonIndexed();
    if (!g.attributes.normal) g.computeVertexNormals();
    const n = g.attributes.position.count;
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
    const c = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const v = typeof col === 'function' ? col(i) : (col || [1, 1, 1]); c[i * 3] = v[0]; c[i * 3 + 1] = v[1]; c[i * 3 + 2] = v[2]; }
    const o = new THREE.BufferGeometry(); o.setAttribute('position', g.attributes.position); o.setAttribute('normal', g.attributes.normal); o.setAttribute('uv', g.attributes.uv); o.setAttribute('color', new THREE.BufferAttribute(c, 3)); return o;
  };
  // caja orientada: centro (x, y, z), medidas (largo a lo largo de (ux, uz), alto, ancho)
  const cajaO = (x, y, z, L, H, A, ux, uz) => new THREE.BoxGeometry(L, H, A).rotateY(-Math.atan2(uz, ux)).translate(x, y, z);
  const dentro = (W, x, z) => { let c = false; for (let i = 0, j = W.length - 1; i < W.length; j = i++) { const a = W[i], b = W[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
  const distBorde = (W, x, z) => { let m = 1e9; for (let i = 0; i < W.length; i++) { const a = W[i], b = W[(i + 1) % W.length], dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1e-9; const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / l2)); m = Math.min(m, Math.hypot(x - a[0] - t * dx, z - a[1] - t * dz)); } return m; };
  const VERDES = [[0.16, 0.3, 0.09], [0.22, 0.36, 0.11], [0.12, 0.25, 0.08], [0.27, 0.4, 0.14]];
  const PLANTA = { 0: [[0.3, 0.52, 0.16], 0.24, 0.5], 1: [[0.28, 0.42, 0.33], 0.3, 0.55], 3: [[0.17, 0.33, 0.1], 0.32, 1.5], 4: [[0.3, 0.4, 0.26], 0.2, 0.7] }; // color, radio, alto relativo

  // mata redondeada con normales suaves (la normal sale del centro: se ve como follaje, no como gema)
  const MATA = (() => { const g = new THREE.IcosahedronGeometry(1, 1).toNonIndexed(); const p = g.attributes.position, nn = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), l = Math.hypot(x, y, z) || 1, k = 0.82 + 0.18 * Math.sin(x * 9.1 + z * 7.3) * Math.cos(y * 5.7); p.setXYZ(i, x * k, y * k, z * k); nn[i * 3] = x / l; nn[i * 3 + 1] = y / l; nn[i * 3 + 2] = z / l; }
    g.setAttribute('normal', new THREE.BufferAttribute(nn, 3)); return g; })();
  const mata = (r, h) => MATA.clone().scale(r, h, r);
  const grupo = new THREE.Group(); grupo.name = 'huertasTecho'; T3.scene.add(grupo);
  const CERCA = 280, cercanas = []; // plantas 3D: una malla por terraza, solo se dibujan las de las terrazas cercanas
  const api = { grupo, n: 0, camas: 0 };
  api.actualizar = (cam) => { for (const c of cercanas) { const v = Math.hypot(c.x - cam.position.x, c.z - cam.position.z, c.y - cam.position.y) < CERCA; if (c.m.visible !== v) c.m.visible = v; } };

  api.agregar = (lista) => {
    const B = { piso: [], cultivo: [], seto: [], partes: [], plantas: [], vidrio: [] };
    const add = (mat, g, col) => B[mat].push(preparar(g, col));
    let cx0 = 0, cz0 = 0, cy0 = 0;
    const cerrarPlantas = () => { const m = new THREE.Mesh(mergeGeometries(B.plantas), M.plantas); m.castShadow = false; m.receiveShadow = !LIV; m.visible = false; grupo.add(m); cercanas.push({ m, x: cx0, y: cy0, z: cz0 }); B.plantas = []; };
    for (const R of lista) {
      const W = R.W, y = R.y, n = W.length; if (n < 3) continue;
      if (B.plantas.length) cerrarPlantas();
      let area = 0; for (let i = 0; i < n; i++) { const a = W[i], b = W[(i + 1) % n]; area += a[0] * b[1] - b[0] * a[1]; }
      const sgn = area > 0 ? 1 : -1; area = Math.abs(area) / 2; if (area < 60) continue;
      api.n++; cx0 = W.reduce((s, q) => s + q[0], 0) / n; cz0 = W.reduce((s, q) => s + q[1], 0) / n; cy0 = y;
      const semilla = Math.abs(Math.round(W[0][0] * 13 + W[0][1] * 7)); sem = 1 + (semilla % 2147483646);
      // piso de grava (triangulado por el contorno real)
      let tri = []; try { tri = THREE.ShapeUtils.triangulateShape(W.map(q => new THREE.Vector2(q[0], q[1])), []); } catch (e) {}
      if (tri.length) { const P = [], U = []; for (const t of tri) for (const k of t) { P.push(W[k][0], y + 0.04, W[k][1]); U.push(W[k][0] / 3, W[k][1] / 3); }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
        const N = new Float32Array(P.length); for (let i = 1; i < N.length; i += 3) N[i] = 1; g.setAttribute('normal', new THREE.BufferAttribute(N, 3));
        if (sgn > 0) { const p = g.attributes.position.array; for (let i = 0; i < p.length; i += 9) for (let q = 0; q < 3; q++) { const t0 = p[i + 3 + q]; p[i + 3 + q] = p[i + 6 + q]; p[i + 6 + q] = t0; } }
        add('piso', g); }
      // jardineras con setos a lo largo de todo el borde (por dentro del antepecho)
      for (let i = 0; i < n; i++) {
        const a = W[i], b = W[(i + 1) % n], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 2.4) continue;
        const ux = (b[0] - a[0]) / L, uz = (b[1] - a[1]) / L, nx = -uz * sgn, nz = ux * sgn, off = 0.75; // normal hacia adentro
        const tramos = Math.max(1, Math.round((L - 1.6) / 2.2)), lt = (L - 1.6) / tramos;
        for (let k = 0; k < tramos; k++) {
          const t = 0.8 + (k + 0.5) * lt, x = a[0] + ux * t + nx * off, z = a[1] + uz * t + nz * off;
          if (!dentro(W, x, z)) continue;
          add('partes', cajaO(x, y + 0.3, z, lt + 0.02, 0.6, 0.85, ux, uz), [0.62, 0.6, 0.56]); // jardinera de concreto
          const hs = 0.35 + rnd() * 0.45, v = VERDES[Math.floor(rnd() * VERDES.length)], k2 = 3 + rnd() * 2;
          const gs = cajaO(x, y + 0.6 + hs / 2, z, lt - 0.1, hs, 0.72, ux, uz);
          const uv = gs.attributes.uv; for (let q = 0; q < uv.count; q++) uv.setXY(q, uv.getX(q) * lt / 2, uv.getY(q) * hs * 1.5); // follaje sin estirar
          add('seto', gs, [v[0] * k2, v[1] * k2, v[2] * k2]);
        }
      }
      // marco local: eje largo = el muro más largo
      let Lm = 0, ux = 1, uz = 0;
      for (let i = 0; i < n; i++) { const a = W[i], b = W[(i + 1) % n], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l > Lm) { Lm = l; ux = (b[0] - a[0]) / l; uz = (b[1] - a[1]) / l; } }
      const vx = -uz, vz = ux;
      let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
      for (const p of W) { const u = p[0] * ux + p[1] * uz, v = p[0] * vx + p[1] * vz; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
      const aMundo = (u, v) => [u * ux + v * vx, u * uz + v * vz];
      const cabe = (uc, vc, lu, lv, margen) => { for (const [du, dv] of [[0, 0], [-1, -1], [1, -1], [1, 1], [-1, 1], [0, -1], [0, 1], [-1, 0], [1, 0]]) { const p = aMundo(uc + du * lu / 2, vc + dv * lv / 2); if (!dentro(W, p[0], p[1]) || distBorde(W, p[0], p[1]) < margen) return false; } return true; };
      const ocupado = [];
      // invernadero en las terrazas grandes (> 450 m²): vidrio con estructura blanca y techo a dos aguas
      if (area > 450) {
        const GL = 7, GA = 4.5, GH = 2.4;
        busca: for (let uc = u0 + 2 + GL / 2; uc < u1 - GL / 2; uc += 1.5) for (let vc = v0 + 2 + GA / 2; vc < v1 - GA / 2; vc += 1.5) {
          if (!cabe(uc, vc, GL, GA, 1.9)) continue;
          const [cx, cz] = aMundo(uc, vc), BL = [0.93, 0.94, 0.93];
          add('vidrio', cajaO(cx, y + GH / 2 + 0.05, cz, GL, GH, GA, ux, uz));
          const techo = new THREE.BufferGeometry(); // dos faldones de vidrio
          const c4 = [[-GL / 2, -GA / 2], [GL / 2, -GA / 2], [GL / 2, GA / 2], [-GL / 2, GA / 2]].map(([a, b]) => aMundo(uc + a, vc + b));
          const r0 = aMundo(uc - GL / 2, vc), r1 = aMundo(uc + GL / 2, vc), yt = y + GH + 0.05, yr = yt + 1.1;
          techo.setAttribute('position', new THREE.Float32BufferAttribute([c4[0][0], yt, c4[0][1], c4[1][0], yt, c4[1][1], r1[0], yr, r1[1], c4[0][0], yt, c4[0][1], r1[0], yr, r1[1], r0[0], yr, r0[1],
            c4[3][0], yt, c4[3][1], r0[0], yr, r0[1], r1[0], yr, r1[1], c4[3][0], yt, c4[3][1], r1[0], yr, r1[1], c4[2][0], yt, c4[2][1]], 3)); techo.computeVertexNormals();
          add('vidrio', techo);
          // estructura: parales cada 1,2 m, soleras, cumbrera
          for (let s = -GL / 2; s <= GL / 2 + 0.01; s += GL / 6) for (const sv of [-1, 1]) { const p = aMundo(uc + s, vc + sv * GA / 2); add('partes', new THREE.BoxGeometry(0.06, GH, 0.06).translate(p[0], y + GH / 2 + 0.05, p[1]), BL); }
          for (const sv of [-1, 1]) { const p = aMundo(uc, vc + sv * GA / 2); add('partes', cajaO(p[0], yt, p[1], GL, 0.07, 0.07, ux, uz), BL); }
          const pr = aMundo(uc, vc); add('partes', cajaO(pr[0], yr, pr[1], GL, 0.08, 0.08, ux, uz), BL);
          // mesas con plántulas adentro
          for (const sv of [-1, 1]) { const p = aMundo(uc, vc + sv * 1.2); add('partes', cajaO(p[0], y + 0.85, p[1], GL - 1, 0.06, 1.0, ux, uz), [0.5, 0.36, 0.22]); const pc = cajaO(p[0], y + 0.9, p[1], GL - 1.1, 0.04, 0.9, ux, uz); add('plantas', pc, [0.26, 0.48, 0.14]); }
          ocupado.push([uc, vc, GL + 2.4, GA + 2.4]);
          // tanque de agua lluvia y composteras al lado
          const tq = aMundo(uc + GL / 2 + 1.0, vc - GA / 2 + 0.6); add('partes', new THREE.CylinderGeometry(0.6, 0.6, 1.4, 16).translate(tq[0], y + 0.75, tq[1]), [0.2, 0.32, 0.5]);
          for (let k = 0; k < 3; k++) { const cp = aMundo(uc + GL / 2 + 0.9, vc + 0.4 + k * 1.05); add('partes', cajaO(cp[0], y + 0.45, cp[1], 0.95, 0.9, 0.95, ux, uz), [0.45, 0.31, 0.19]); add('partes', cajaO(cp[0], y + 0.88, cp[1], 0.85, 0.04, 0.85, ux, uz), [0.25, 0.18, 0.12]); }
          break busca;
        }
      }
      // camas de cultivo elevadas en hileras: 4 m x 1,3 m, caminos de 0,8 m
      const CL = area > 900 ? 5.5 : 4, CA = 1.8, PU = 0.7, PV = 0.6, HB = 0.38;
      for (let uc = u0 + 1.7 + CL / 2; uc <= u1 - 1.7 - CL / 2 + 0.01; uc += CL + PU) {
        for (let vc = v0 + 1.7 + CA / 2; vc <= v1 - 1.7 - CA / 2 + 0.01; vc += CA + PV) {
          if (ocupado.some(o => Math.abs(uc - o[0]) < (CL + o[2]) / 2 && Math.abs(vc - o[1]) < (CA + o[3]) / 2)) continue;
          if (!cabe(uc, vc, CL, CA, 1.65) || rnd() < 0.07) continue; // algunos claros para sentarse y trabajar
          const [cx, cz] = aMundo(uc, vc), mad = 0.27 + rnd() * 0.08;
          add('partes', cajaO(cx, y + HB / 2 + 0.04, cz, CL, HB, CA, ux, uz), [mad * 1.25, mad * 0.86, mad * 0.55]); // cajón de madera
          const tipo = Math.floor(rnd() * 6), cxA = tipo % 3, cyA = Math.floor(tipo / 3);
          const top = new THREE.PlaneGeometry(CL - 0.12, CA - 0.12).rotateX(-Math.PI / 2);
          const uv = top.attributes.uv; for (let q = 0; q < uv.count; q++) uv.setXY(q, (cxA + 0.02 + uv.getX(q) * 0.96) / 3, (1 - cyA) * 0.5 + (0.02 + uv.getY(q) * 0.96) * 0.5); // celda del atlas (fila 0 = mitad de arriba)
          top.rotateY(-Math.atan2(uz, ux)).translate(cx, y + HB + 0.05, cz);
          add('cultivo', top); api.camas++;
          // volumen de las plantas (matas en hileras) en lechuga, repollo, tomate y aromáticas
          const P = PLANTA[tipo]; if (!P || LIV) continue;
          const filas = tipo === 1 ? 2 : 3, cada = P[1] * 2.6;
          for (let f = 0; f < filas; f++) for (let s = -CL / 2 + cada / 2 + 0.1; s < CL / 2 - 0.1; s += cada) {
            const p = aMundo(uc + s + (rnd() - 0.5) * 0.08, vc + (f - (filas - 1) / 2) * (CA - 0.3) / filas + (rnd() - 0.5) * 0.06), r = P[1] * (0.8 + rnd() * 0.4), hh = r * P[2];
            const k = 0.85 + rnd() * 0.3, c = P[0];
            const g = mata(r, hh).translate(p[0], y + HB + 0.05 + hh * 0.7, p[1]);
            add('plantas', g, [c[0] * k, c[1] * k, c[2] * k]);
            if (tipo === 3 && rnd() < 0.5) add('plantas', new THREE.IcosahedronGeometry(0.06, 0).translate(p[0] + (rnd() - 0.5) * r, y + HB + 0.05 + hh * (0.6 + rnd() * 0.6), p[1] + (rnd() - 0.5) * r), [0.75, 0.08, 0.05]); // tomates
          }
        }
      }
    }
    if (B.plantas.length) cerrarPlantas();
    for (const [mat, L] of Object.entries(B)) {
      if (!L.length) continue;
      const m = new THREE.Mesh(mergeGeometries(L), M[mat]);
      m.castShadow = !LIV && mat !== 'piso' && mat !== 'vidrio' && mat !== 'cultivo'; m.receiveShadow = !LIV && mat !== 'vidrio';
      if (mat === 'vidrio') m.renderOrder = 2;
      grupo.add(m);
    }
    T3.counts.huertasTecho = api.n;
  };
  return api;
}
