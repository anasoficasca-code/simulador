/* ============ ANTIGUA FÁBRICA DE BAVARIA (Av. Boyacá) ============
   Huellas reales de OpenStreetMap (data3d/bavaria.json, de tools/bavaria_build.py) con la forma que tiene hoy:
   - esqueleto: naves de ladrillo en demolición, sin cubierta: pilastras de ladrillo en el borde, retícula interior de
     columnas y vigas de concreto por niveles y restos de placa (se ve el suelo de la foto aérea por dentro)
   - ladrillo: bloques de ladrillo con cubierta plana gris y ventanas por piso
   - oficina: edificio administrativo de varios pisos con franjas de ventanas
   - tanque de agua elevado blanco (fuste y depósito) */
export function construirBavaria({ THREE, T3, lw, D, liviano }) {
  const grupo = new THREE.Group(); grupo.name = 'bavaria';
  const sombras = !liviano;
  let semilla = 1977; const rnd = () => (semilla = (semilla * 16807) % 2147483647) / 2147483647;

  // ---- ladrillo: textura procedimental (hiladas con junta clara y piezas de tono variable) ----
  const cv = document.createElement('canvas'); cv.width = cv.height = 256; const g = cv.getContext('2d');
  g.fillStyle = '#c4b29c'; g.fillRect(0, 0, 256, 256);
  const fil = 16, col = 4; // 16 hiladas y 4 ladrillos por fila en 256 px (≈ 1 m x 1 m)
  for (let r = 0; r < fil; r++) for (let c = -1; c < col + 1; c++) {
    const x = c * 64 + (r % 2 ? 32 : 0), y = r * 16, k = 0.82 + rnd() * 0.3;
    g.fillStyle = `rgb(${Math.round(168 * k)},${Math.round(84 * k)},${Math.round(52 * k)})`; g.fillRect(x + 2, y + 2, 60, 12);
  }
  const texL = new THREE.CanvasTexture(cv); texL.wrapS = texL.wrapT = THREE.RepeatWrapping; texL.colorSpace = THREE.SRGBColorSpace;
  texL.anisotropy = T3.renderer.capabilities.getMaxAnisotropy();
  const matLadrillo = new THREE.MeshStandardMaterial({ map: texL, roughness: 0.92, metalness: 0, side: THREE.DoubleSide });
  const matConcreto = new THREE.MeshStandardMaterial({ color: 0xb3aca2, roughness: 0.95, metalness: 0 }); // concreto envejecido, claro como en el video
  const matCubierta = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0.05, side: THREE.DoubleSide }); // cada cubierta con su color de la foto satelital
  const matPintado = new THREE.MeshStandardMaterial({ color: 0xe6e2d8, roughness: 0.85, metalness: 0, side: THREE.DoubleSide }); // muros pintados de blanco (nave grande y silos)
  const matVidrio = new THREE.MeshStandardMaterial({ color: 0x2a3138, roughness: 0.35, metalness: 0.2, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
  const matBlanco = new THREE.MeshStandardMaterial({ color: 0xe9e7e2, roughness: 0.7, metalness: 0.05 });

  // ---- acumuladores: muros con textura (posición + uv) y ventanas ----
  const ML = { p: [], uv: [], i: [] }, MB = { p: [], uv: [], i: [] }, MV = { p: [], i: [] }, MC = { p: [], i: [], c: [] };
  const quad = (A, q, uvs) => { const b = A.p.length / 3; for (const v of q) A.p.push(...v); if (uvs) A.uv.push(...uvs); A.i.push(b, b + 1, b + 2, b, b + 2, b + 3); };
  const muros = (W, y0, y1, s0 = 0, A = ML) => { // W: anillo en el mundo [[x,z]...]
    let s = s0;
    for (let k = 0; k < W.length; k++) {
      const a = W[k], b = W[(k + 1) % W.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      quad(A, [[a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]], [s, y0, s + L, y0, s + L, y1, s, y1]);
      s += L;
    }
  };
  const cubierta = (W, y, A, col) => {
    let tri = []; try { tri = THREE.ShapeUtils.triangulateShape(W.map(q => new THREE.Vector2(q[0], q[1])), []); } catch (e) {}
    const b = A.p.length / 3; for (const q of W) { A.p.push(q[0], y, q[1]); if (A.c) A.c.push(...(col || [0.54, 0.55, 0.54])); }
    for (const t of tri) A.i.push(b + t[0], b + t[2], b + t[1]);
  };
  const ccw = (W) => { let a = 0; for (let k = 0; k < W.length; k++) { const p = W[k], q = W[(k + 1) % W.length]; a += p[0] * q[1] - q[0] * p[1]; } return a; };
  const ventanas = (W, h, piso, ancho, alto, cinta) => { // en el mundo: normal hacia afuera según el sentido del anillo
    const sg = ccw(W) > 0 ? 1 : -1;
    for (let k = 0; k < W.length; k++) {
      const a = W[k], b = W[(k + 1) % W.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 5) continue;
      const ux = (b[0] - a[0]) / L, uz = (b[1] - a[1]) / L, nx = uz * sg * 0.07, nz = -ux * sg * 0.07;
      for (let y = 2.2; y + alto < h - 0.8; y += piso) {
        if (cinta) { const m = 1.2; quad(MV, [[a[0] + ux * m + nx, y, a[1] + uz * m + nz], [b[0] - ux * m + nx, y, b[1] - uz * m + nz], [b[0] - ux * m + nx, y + alto, b[1] - uz * m + nz], [a[0] + ux * m + nx, y + alto, a[1] + uz * m + nz]]); continue; }
        const n = Math.floor(L / 4.2), paso = L / n;
        for (let j = 0; j < n; j++) {
          if (rnd() < 0.12) continue; // algunas tapiadas
          const c = paso * (j + 0.5), x0 = c - ancho / 2, x1 = c + ancho / 2;
          quad(MV, [[a[0] + ux * x0 + nx, y, a[1] + uz * x0 + nz], [a[0] + ux * x1 + nx, y, a[1] + uz * x1 + nz], [a[0] + ux * x1 + nx, y + alto, a[1] + uz * x1 + nz], [a[0] + ux * x0 + nx, y + alto, a[1] + uz * x0 + nz]]);
        }
      }
    }
  };

  // ---- esqueletos: cajas instanciadas (pilastras de ladrillo, columnas y vigas de concreto, restos de placa) ----
  const cajasL = [], cajasC = []; // [x, y, z, sx, sy, sz, rotY]
  const dentro = (W, x, z) => { let c = false; for (let i = 0, j = W.length - 1; i < W.length; j = i++) { const a = W[i], b = W[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
  const esqueleto = (W, h) => {
    const nivel = h > 12 ? [5.5, 11, h] : [5, h];
    // perímetro: pilastras de ladrillo cada ~6 m, vigas de borde por nivel y un antepecho bajo de ladrillo
    for (let k = 0; k < W.length; k++) {
      const a = W[k], b = W[(k + 1) % W.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 1) continue;
      const ang = Math.atan2(b[1] - a[1], b[0] - a[0]), n = Math.max(1, Math.round(L / 6));
      for (let j = 0; j <= n; j++) {
        const t = j / n, x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t, hh = rnd() < 0.15 ? h * (0.4 + rnd() * 0.4) : h; // algunas ya demolidas a media altura
        cajasL.push([x, hh / 2 - 1, z, 1.3, hh + 2, 1.3, -ang]);
      }
      const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
      cajasL.push([mx, 0.4, mz, L, 2.8, 0.45, -ang]); // antepecho
      for (const y of nivel) if (rnd() > 0.1) cajasC.push([mx, y - 0.4, mz, L, 0.8, 0.5, -ang]);
    }
    // retícula interior sobre el eje largo de la nave
    let L0 = 0, ux = 1, uz = 0;
    for (let k = 0; k < W.length; k++) { const a = W[k], b = W[(k + 1) % W.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l > L0) { L0 = l; ux = (b[0] - a[0]) / l; uz = (b[1] - a[1]) / l; } }
    const vx = -uz, vz = ux, ang = Math.atan2(uz, ux);
    let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
    for (const q of W) { const u = q[0] * ux + q[1] * uz, v = q[0] * vx + q[1] * vz; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
    const P = 9, pt = (u, v) => [u * ux + v * vx, u * uz + v * vz];
    const ok = (u, v) => { const p = pt(u, v); return dentro(W, p[0], p[1]); };
    for (let u = u0 + P; u < u1 - 2; u += P) for (let v = v0 + P; v < v1 - 2; v += P) {
      if (!ok(u, v)) continue;
      const [x, z] = pt(u, v), alto = rnd() < 0.2 ? nivel[0] : h;
      cajasC.push([x, alto / 2, z, 0.75, alto, 0.75, -ang]);
      for (const y of nivel) {
        if (y > alto + 0.1) continue;
        if (ok(u + P, v) && rnd() > 0.12) { const [mx, mz] = pt(u + P / 2, v); cajasC.push([mx, y - 0.35, mz, P, 0.7, 0.45, -ang]); }
        if (ok(u, v + P) && rnd() > 0.12) { const [mx, mz] = pt(u, v + P / 2); cajasC.push([mx, y - 0.35, mz, 0.45, 0.7, P, -ang]); }
        if (y < h - 0.5 && rnd() < 0.22 && ok(u + P, v + P)) { const [mx, mz] = pt(u + P / 2, v + P / 2); cajasC.push([mx, y - 0.05, mz, P, 0.25, P, -ang]); } // restos de placa
      }
    }
  };

  const colTecho = (e) => { if (!e.col) return null; const k = e.col.map(v => v / 255), l = 0.3 * k[0] + 0.59 * k[1] + 0.11 * k[2], s = l < 0.45 ? 1.25 : 1.05; return k.map(v => Math.min(1, Math.pow(v * s, 2.2))); }; // a lineal; las oscuras se levantan un poco
  const silos = (W, h) => { // fila de silos cilíndricos de concreto blanco sobre los lados largos, con la cubierta encima
    let L0 = 0, a0 = W[0], b0 = W[1];
    for (let k = 0; k < W.length; k++) { const a = W[k], b = W[(k + 1) % W.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l > L0) { L0 = l; a0 = a; b0 = b; } }
    const ux = (b0[0] - a0[0]) / L0, uz = (b0[1] - a0[1]) / L0, sg = ccw(W) > 0 ? 1 : -1, nx = uz * sg, nz = -ux * sg, r = 3.1, n = Math.floor(L0 / (2 * r + 0.4));
    for (let j = 0; j < n; j++) { const t = (j + 0.5) * L0 / n; silosC.push([a0[0] + ux * t + nx * r * 0.55, h / 2 - 1, a0[1] + uz * t + nz * r * 0.55, r, h + 2]); }
  };
  const silosC = [];
  for (const e of D.edif) {
    const W = e.p.map(p => lw(p[0], p[1]));
    if (e.s === 'esqueleto') { esqueleto(W, e.h); continue; }
    const tc = colTecho(e), claro = e.col && (0.3 * e.col[0] + 0.59 * e.col[1] + 0.11 * e.col[2]) > 140;
    if (e.s === 'silos') { muros(W, -1, e.h, 0, MB); silos(W, e.h); cubierta(W, e.h, MC, tc); continue; }
    if (e.s === 'blanco') { muros(W, -1, e.h, 0, MB); ventanas(W, e.h, 3.6, 0, 1.8, true); cubierta(W, e.h, MC, tc); continue; } // nave de cuatro pisos con hileras de ventanas
    muros(W, -1, e.h, 0, claro ? MB : ML);
    if (e.s === 'oficina') { ventanas(W, e.h, 3.4, 0, 1.9, true); cubierta(W, e.h, MC, tc); }
    else { ventanas(W, e.h, 4.2, 2.4, 1.7, false); cubierta(W, e.h, MC, tc); }
  }

  const malla = (A, mat, uv) => {
    if (!A.i.length) return;
    const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(A.p, 3));
    if (uv) gg.setAttribute('uv', new THREE.Float32BufferAttribute(A.uv, 2));
    if (A.c && A.c.length) gg.setAttribute('color', new THREE.Float32BufferAttribute(A.c, 3));
    gg.setIndex(A.i); gg.computeVertexNormals();
    const m = new THREE.Mesh(gg, mat); m.castShadow = sombras; m.receiveShadow = sombras; grupo.add(m);
  };
  malla(ML, matLadrillo, true); malla(MB, matPintado, true); malla(MV, matVidrio); malla(MC, matCubierta);
  if (silosC.length) { const im = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1, 1, 20), matPintado, silosC.length), d = new THREE.Object3D(); silosC.forEach((s, k) => { d.position.set(s[0], s[1], s[2]); d.scale.set(s[3], s[4], s[3]); d.updateMatrix(); im.setMatrixAt(k, d.matrix); }); im.castShadow = sombras; im.receiveShadow = sombras; grupo.add(im); }

  const instancias = (L, mat, tinte) => {
    if (!L.length) return;
    const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat, L.length), d = new THREE.Object3D(), c = new THREE.Color();
    L.forEach((b, k) => { d.position.set(b[0], b[1], b[2]); d.rotation.set(0, b[6], 0); d.scale.set(b[3], b[4], b[5]); d.updateMatrix(); im.setMatrixAt(k, d.matrix); if (tinte) im.setColorAt(k, c.setHex(tinte).multiplyScalar(0.85 + rnd() * 0.3)); });
    im.castShadow = sombras; im.receiveShadow = sombras; grupo.add(im);
  };
  instancias(cajasL, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.92 }), 0xa45434); // pilastras de ladrillo
  instancias(cajasC, matConcreto, 0xd8d4cc);

  // ---- torres de agua (las dos del predio): fuste blanco que se abre en curva hacia el depósito, base pintada de verde ----
  const perfil = [];
  for (let k = 0; k <= 24; k++) { const y = k / 24 * 40, t = y / 40, r = 2.3 - 0.7 * Math.sin(Math.PI * Math.min(1, t * 1.25)) * (t < 0.8 ? 1 : 0) + Math.pow(Math.max(0, t - 0.62) / 0.38, 2.2) * 3.6; perfil.push(new THREE.Vector2(Math.max(1.5, r), y)); }
  perfil.push(new THREE.Vector2(5.6, 40.6), new THREE.Vector2(0.01, 41.2));
  const gTorre = new THREE.LatheGeometry(perfil, 32), matVerde = new THREE.MeshStandardMaterial({ color: 0x3f8f4e, roughness: 0.8 });
  for (const t of D.tanques || []) {
    const [x, z] = lw(t[0], t[1]), tg = new THREE.Group(); tg.position.set(x, 0, z);
    const fuste = new THREE.Mesh(gTorre, matBlanco), base = new THREE.Mesh(new THREE.CylinderGeometry(2.36, 2.4, 3.2, 32), matVerde); base.position.y = 1.4;
    for (const m of [fuste, base]) { m.castShadow = sombras; m.receiveShadow = sombras; tg.add(m); }
    grupo.add(tg);
  }
  // ---- huertas del Instituto Bavaria Común: parcelas de cultivo en hileras en los claros del predio (fuera de edificios y del bosque denso) ----
  {
    const W = (D.sitio || []).map(p => lw(p[0], p[1])), EDS = D.edif.map(e => e.p.map(p => lw(p[0], p[1])));
    const dentro = (P, x, z) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
    const cerca = (P, x, z, d) => { for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[j], b = P[i], dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / L2)); if (Math.hypot(x - a[0] - t * dx, z - a[1] - t * dz) < d) return true; } return false; };
    const ARB = (T3.bavArboles || []).map(a => lw(a[0], a[1])), ocupado = (x, z) => ARB.some(q => (q[0] - x) ** 2 + (q[1] - z) ** 2 < 36);
    // textura: hileras de cultivo vistas desde arriba (4 cultivos en franjas) con caminos de tierra
    const cv2 = document.createElement('canvas'); cv2.width = 256; cv2.height = 256; const g2 = cv2.getContext('2d');
    g2.fillStyle = '#6b5440'; g2.fillRect(0, 0, 256, 256);
    const CUL = [['#6fa83f', '#8fc55a'], ['#4e8a35', '#6aa648'], ['#8a3f52', '#5f8a3a'], ['#9cbf55', '#c2d870']];
    for (let r = 0; r < 8; r++) { const y = r * 32 + 6, [c1, c2] = CUL[r % 4]; g2.fillStyle = '#4a3a2c'; g2.fillRect(0, y - 3, 256, 26); for (let x = 6; x < 256; x += 9) { g2.fillStyle = (x / 9 | 0) % 2 ? c1 : c2; g2.beginPath(); g2.ellipse(x, y + 10, 5.5, 7, 0, 0, 7); g2.fill(); } }
    const texH = new THREE.CanvasTexture(cv2); texH.colorSpace = THREE.SRGBColorSpace; texH.anisotropy = 8;
    const matH = new THREE.MeshStandardMaterial({ map: texH, roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
    const matBorde = new THREE.MeshStandardMaterial({ color: 0x8a6a48, roughness: 0.9 });
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const q of W) { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); z0 = Math.min(z0, q[1]); z1 = Math.max(z1, q[1]); }
    const PL = []; // parcelas de 14 x 9 m cada 18 x 13 m
    for (let x = x0 + 10; x < x1 - 10; x += 18) for (let z = z0 + 10; z < z1 - 10; z += 13) {
      if (!dentro(W, x, z) || cerca(W, x, z, 12)) continue;
      if (EDS.some(E => dentro(E, x, z) || cerca(E, x, z, 9))) continue;
      if (ocupado(x, z)) continue;
      PL.push([x, z]);
    }
    if (PL.length) {
      const o3 = new THREE.Object3D(), plano = new THREE.PlaneGeometry(14, 9).rotateX(-Math.PI / 2), caja = new THREE.BoxGeometry(14.4, 0.35, 9.4);
      const mP = new THREE.InstancedMesh(plano, matH, PL.length), mB = new THREE.InstancedMesh(caja, matBorde, PL.length);
      PL.forEach(([x, z], i) => { o3.position.set(x, 0.55, z); o3.rotation.set(0, 0, 0); o3.updateMatrix(); mP.setMatrixAt(i, o3.matrix); o3.position.y = 0.2; o3.updateMatrix(); mB.setMatrixAt(i, o3.matrix); });
      mP.receiveShadow = mB.receiveShadow = true; grupo.add(mB, mP);
    }
    grupo.userData.huertas = PL.length;
  }
  T3.scene.add(grupo);
  // el arbolado del predio (data3d/bavaria_arboles.json) lo dibuja real3d.js con los mismos modelos reales del territorio (ver index.html)
  return grupo;
}
