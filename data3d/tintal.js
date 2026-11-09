/* ============ BIBLIOTECA PÚBLICA EL TINTAL MANUEL ZAPATA OLIVELLA Y SU PLAZA (modo Kennedy) ============
   Modelo propio sobre la huella real de OpenStreetMap (data3d/tintal.json, de tools/tintal_build.py y tools/tintal_palmas.py):
   - la antigua planta de basuras: volumen blanco de dos niveles (114,5 m), fachada de paneles con pilastras y ojos de buey
     (ventanas redondas) en el primer piso, ventanales de vidrio
   - en la cubierta, dos grupos de lucernarios en diente de sierra de policarbonato traslúcido (los "cobertizos" blancos de la foto)
     y la cubierta circular gris del centro
   - el cilindro de la entrada y la terraza-rampa elevada que baja a la plaza, con sus tragaluces
   - la plaza de palmas (Phoenix canariensis): cada palma donde está en la imagen satelital
   La foto de Google se recorta en esta zona (tools/mascara_build.py) para que su versión "derretida" no tape el modelo.
   Marco: u a lo largo del edificio, v perpendicular (la plaza hacia v negativo); mundo x = X + OX, z = Y + OZ. */
export async function iniciarTintal({ THREE, T3, OX, OZ, Y0 = 0, movil = false }) {
  const D = await (window.cargarJSON || ((u) => fetch(u).then(r => r.json())))('data3d/tintal.json?v=2');
  const { mergeGeometries } = await import('three/addons/utils/BufferGeometryUtils.js');
  const grupo = new THREE.Group(); grupo.name = 'biblioteca-tintal'; T3.scene.add(grupo);
  const a = D.a, ca = Math.cos(a), sa = Math.sin(a), L = D.L, W = D.W, s = D.lado; // s = -1: la plaza hacia v negativo
  // marco local -> mundo: (u, y, v) -> (x, y, z)
  const M = new THREE.Matrix4().set(ca, 0, -sa, D.c[0] + OX, 0, 1, 0, Y0, sa, 0, ca, D.c[1] + OZ, 0, 0, 0, 1);
  const ANIS = Math.min(8, T3.renderer.capabilities.getMaxAnisotropy ? T3.renderer.capabilities.getMaxAnisotropy() : 4);
  const lienzo = (w, h, f, rep) => { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = ANIS; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; } return t; };

  // ---------- volúmenes (en el marco local, luego se pasan al mundo) ----------
  // cuerpo: 30 m de ancho del lado de atrás (v positivo); el cilindro de la entrada sobresale hacia la plaza
  const v0 = -s * (W / 2) + s * 9, v1 = -s * (W / 2); // borde de la fachada de la plaza y de atrás
  const vMin = Math.min(v0, v1), vMax = Math.max(v0, v1), H = 11.5, H1 = 5.2;
  // centro del cilindro: puntos de la huella que sobresalen hacia la plaza
  const sal = D.huella_local.filter(p => s * p[1] > W / 2 - 9.5);
  const uc = sal.length ? sal.reduce((t, p) => t + p[0], 0) / sal.length : 0, vf = s < 0 ? vMin : vMax; // fachada de la plaza
  // caja con UV en metros (para las texturas de fachada que se repiten)
  const caja = (u0, u1, y0, y1, w0, w1, uvEsc = 1) => {
    const g = new THREE.BoxGeometry(u1 - u0, y1 - y0, w1 - w0); g.translate((u0 + u1) / 2, (y0 + y1) / 2, (w0 + w1) / 2);
    const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) { const nx = Math.abs(n.getX(i)), ny = Math.abs(n.getY(i)); uv.setXY(i, (ny > 0.5 ? p.getX(i) : nx > 0.5 ? p.getZ(i) : p.getX(i)) / uvEsc, (ny > 0.5 ? p.getZ(i) : p.getY(i)) / uvEsc); }
    return g;
  };
  // fachada: paneles blancos con juntas, pilastras cada 6 m, ojos de buey de 2,6 m en el primer piso y franja de vidrio arriba
  const texFach = lienzo(512, 512, (g, w, h) => { // 12 m x 12 m
    const m = w / 12, y = (yy) => h - yy * m;
    g.fillStyle = '#e9e7e1'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 4000; i++) { g.fillStyle = `rgba(${Math.random() > 0.5 ? '255,255,255' : '90,90,90'},${0.04 * Math.random()})`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    g.strokeStyle = 'rgba(150,150,145,.55)'; g.lineWidth = 1.5; for (let k = 0; k <= 12; k += 1.5) { g.beginPath(); g.moveTo(0, y(k)); g.lineTo(w, y(k)); g.stroke(); }
    for (let k = 0; k <= 12; k += 3) { g.beginPath(); g.moveTo(k * m, 0); g.lineTo(k * m, h); g.stroke(); }
    g.fillStyle = '#f4f3ef'; g.fillRect(0, 0, 0.7 * m, h); g.fillRect(6 * m, 0, 0.7 * m, h); // pilastras
    g.fillStyle = 'rgba(0,0,0,.10)'; g.fillRect(0.7 * m, 0, 0.12 * m, h); g.fillRect(6.7 * m, 0, 0.12 * m, h);
    for (const cx of [3.3, 9.3]) { g.fillStyle = '#d8d6d0'; g.beginPath(); g.arc(cx * m, y(2.4), 1.55 * m, 0, 7); g.fill(); const gr = g.createRadialGradient(cx * m - 0.4 * m, y(2.7), 0.2 * m, cx * m, y(2.4), 1.3 * m); gr.addColorStop(0, '#6f8fa6'); gr.addColorStop(1, '#22323f'); g.fillStyle = gr; g.beginPath(); g.arc(cx * m, y(2.4), 1.3 * m, 0, 7); g.fill(); g.strokeStyle = '#c9c7c0'; g.lineWidth = 0.12 * m; g.beginPath(); g.moveTo(cx * m - 1.3 * m, y(2.4)); g.lineTo(cx * m + 1.3 * m, y(2.4)); g.stroke(); }
    const gv = g.createLinearGradient(0, y(9.2), 0, y(7.6)); gv.addColorStop(0, '#8aa7ba'); gv.addColorStop(1, '#2b3c49'); g.fillStyle = gv; g.fillRect(0.82 * m, y(9.2), 5.18 * m, 1.6 * m); g.fillRect(6.82 * m, y(9.2), 5.18 * m, 1.6 * m);
    g.strokeStyle = '#d6d4ce'; g.lineWidth = 0.1 * m; for (let k = 0.82; k < 12; k += 1.3) { g.beginPath(); g.moveTo(k * m, y(9.2)); g.lineTo(k * m, y(7.6)); g.stroke(); }
  }, true);
  const matFach = new THREE.MeshStandardMaterial({ map: texFach, roughness: 0.82, metalness: 0.02 });
  matFach.map.repeat.set(1 / 12, 1 / 12);
  const matBlanco = new THREE.MeshStandardMaterial({ color: 0xeceae4, roughness: 0.85, side: THREE.DoubleSide });
  const matCubierta = new THREE.MeshStandardMaterial({ color: 0xc9c8c3, roughness: 0.92 });
  const matGris = new THREE.MeshStandardMaterial({ color: 0x8c8f92, roughness: 0.6, metalness: 0.35 });
  const matVidrio = new THREE.MeshStandardMaterial({ color: 0x3d5566, roughness: 0.12, metalness: 0.6, envMapIntensity: 1.2 });
  const matTerraza = new THREE.MeshStandardMaterial({ color: 0xbc8f73, roughness: 0.9, side: THREE.DoubleSide });
  // lucernarios de policarbonato: verde menta muy claro, traslúcido, con la perfilería marcada
  const texPoli = lienzo(256, 256, (g, w, h) => { g.fillStyle = '#e6efe9'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(140,160,150,.6)'; g.lineWidth = 3; for (let k = 0; k <= w; k += w / 6) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k, h); g.stroke(); } g.lineWidth = 5; g.beginPath(); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke(); }, true);
  const matPoli = new THREE.MeshStandardMaterial({ map: texPoli, roughness: 0.35, metalness: 0.05, emissive: 0xdfeee6, emissiveIntensity: 0.18, side: THREE.DoubleSide });
  const piezas = { fach: [], blanco: [], cubierta: [], gris: [], vidrio: [], terraza: [], poli: [] };
  // cuerpo principal (muros con la textura de fachada, en metros)
  piezas.fach.push(caja(-L / 2, L / 2, -1, H, vMin, vMax));
  piezas.cubierta.push(new THREE.PlaneGeometry(L - 1.2, vMax - vMin - 1.2).rotateX(-Math.PI / 2).translate(0, H + 0.02, (vMin + vMax) / 2));
  // antepecho perimetral
  for (const [u0, u1, w0, w1] of [[-L / 2, L / 2, vMin, vMin + 0.5], [-L / 2, L / 2, vMax - 0.5, vMax], [-L / 2, -L / 2 + 0.5, vMin, vMax], [L / 2 - 0.5, L / 2, vMin, vMax]]) piezas.blanco.push(caja(u0, u1, H, H + 1.1, w0, w1));
  // lucernarios en diente de sierra: dos grupos (5 y 4), la cara alta mira a la plaza
  const ancho = (vMax - vMin) * 0.78, vmid = (vMin + vMax) / 2;
  const diente = (u, lu) => {
    const hi = 6.2, lo = 0.8, vA = vmid - ancho / 2, vB = vmid + ancho / 2, va = s < 0 ? vA : vB, vb = s < 0 ? vB : vA; // va: lado de la plaza (cara alta)
    const sh = new THREE.Shape([new THREE.Vector2(va, H), new THREE.Vector2(va, H + hi), new THREE.Vector2(va + (vb - va) * 0.18, H + hi + 0.4), new THREE.Vector2(vb, H + lo), new THREE.Vector2(vb, H)]);
    const g = new THREE.ExtrudeGeometry(sh, { depth: lu, bevelEnabled: false }); // perfil en (v, y), extruido en z -> se gira para que z sea u
    g.applyMatrix4(new THREE.Matrix4().set(0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1)); // (v, y, z) -> (z=u, y, x=v): intercambia x y z
    g.translate(u - lu / 2, 0, 0);
    const p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + p.getZ(i)) / 4, p.getY(i) / 4);
    return g;
  };
  for (const [c0, n] of [[-L * 0.27, 5], [L * 0.29, 4]]) for (let k = 0; k < n; k++) piezas.poli.push(diente(c0 + (k - (n - 1) / 2) * 9.2, 7.4));
  // cubierta circular gris del centro (sobre el hall) y franja de vidrio
  piezas.gris.push(new THREE.CylinderGeometry(7.2, 7.6, 1.6, 32).translate(uc, H + 0.8, vmid + s * 3));
  piezas.vidrio.push(new THREE.CylinderGeometry(7.25, 7.25, 0.7, 32, 1, true).translate(uc, H + 1.15, vmid + s * 3));
  // cilindro de la entrada (hacia la plaza) con franja de vidrio y remate gris
  const rc = 8.2, cz = vf + s * (rc - 7.5);
  piezas.blanco.push(new THREE.CylinderGeometry(rc, rc, H + 1.5, 40).translate(uc, (H + 1.5) / 2 - 1, cz));
  piezas.vidrio.push(new THREE.CylinderGeometry(rc + 0.06, rc + 0.06, 2.4, 40, 1, true).translate(uc, 3.4, cz));
  piezas.gris.push(new THREE.CylinderGeometry(rc - 0.4, rc - 0.4, 0.4, 40).translate(uc, H + 0.7, cz));
  // ventanales del primer piso hacia la plaza (vidrio con montantes)
  for (const du of [-L * 0.36, -L * 0.18, L * 0.18, L * 0.36]) piezas.vidrio.push(caja(du - 4, du + 4, 0.2, H1 - 0.6, vf + s * 0.06, vf + s * 0.12));
  // terraza-rampa elevada hacia la plaza: plataforma a 4,5 m que baja a nivel de la plaza en su extremo, con antepechos y tragaluces
  const tu0 = uc + rc * 0.2, tu1 = tu0 + 19, tl = 54, hT = 4.5;
  const tv = (d) => vf + s * d; // d: distancia desde la fachada hacia la plaza
  const losa = (d0, d1, y0, y1) => { const g = new THREE.BufferGeometry(); const P = [tu0, y0, tv(d0), tu1, y0, tv(d0), tu1, y1, tv(d1), tu0, y1, tv(d1)]; g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(s < 0 ? [0, 1, 2, 0, 2, 3] : [0, 2, 1, 0, 3, 2]); g.computeVertexNormals(); return g; };
  piezas.terraza.push(losa(0, tl * 0.62, hT, hT), losa(tl * 0.62, tl, hT, 0.15)); // plataforma y rampa
  for (const uu of [tu0, tu1]) { // muros laterales de la terraza (bajo la losa) y antepechos
    const g = new THREE.BufferGeometry(); const P = [uu, -1, tv(0), uu, hT + 1.05, tv(0), uu, hT + 1.05, tv(tl * 0.62), uu, 1.05, tv(tl), uu, -1, tv(tl)];
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex([0, 1, 2, 0, 2, 4, 2, 3, 4]); g.computeVertexNormals(); piezas.blanco.push(g);
  }
  for (const d of [9, 20, 31]) piezas.blanco.push(caja(tu0 + 6.5, tu1 - 6.5, hT, hT + 1.4, tv(d) - 2.2, tv(d) + 2.2)); // tragaluces de la terraza (cajas blancas con vidrio)
  for (const d of [9, 20, 31]) piezas.vidrio.push(caja(tu0 + 6.8, tu1 - 6.8, hT + 1.4, hT + 1.45, tv(d) - 1.9, tv(d) + 1.9));
  // a cada pieza: del marco local al mundo, y una malla por material
  const MAT = { fach: matFach, blanco: matBlanco, cubierta: matCubierta, gris: matGris, vidrio: matVidrio, terraza: matTerraza, poli: matPoli };
  for (const [k, lista] of Object.entries(piezas)) {
    if (!lista.length) continue;
    const gs = lista.map(g => { const h = g.index ? g.toNonIndexed() : g; for (const n of Object.keys(h.attributes)) if (!['position', 'normal', 'uv'].includes(n)) h.deleteAttribute(n); if (!h.attributes.uv) h.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(h.attributes.position.count * 2), 2)); if (!h.attributes.normal) h.computeVertexNormals(); return h; });
    const g = mergeGeometries(gs); g.applyMatrix4(M);
    const m = new THREE.Mesh(g, MAT[k]); m.castShadow = !movil; m.receiveShadow = !movil; m.name = 'tintal-' + k; grupo.add(m);
  }

  // ---------- palmas de la plaza (Phoenix canariensis, palma de Canarias) ----------
  // tronco grueso con las cicatrices de las hojas en rombo, "piña" de bases foliares bajo la corona, y corona densa de ~44 hojas
  // pinnadas largas: folíolos finos y rígidos, hoja doblada en V a lo largo del raquis, las de arriba erguidas, las de abajo colgando
  // y algunas secas (pajizas) en el anillo inferior, como en la plaza de la biblioteca. Tres variantes de corona.
  const texHoja = lienzo(256, 1024, (g, w, h) => { // hoja vista de frente: raquis amarillento y folíolos finos hacia la punta (alfa)
    g.clearRect(0, 0, w, h);
    for (let y = 30; y < h - 6; y += 3.2) {
      const t = y / h, lf = (w / 2 - 6) * Math.pow(Math.sin(Math.PI * Math.min(1, 0.08 + t * 1.02)), 0.7) * (1 - 0.45 * t);
      for (const sd of [-1, 1]) {
        const v = Math.random(), r = 74 + 26 * v + 18 * t, gg = 104 + 30 * v + 10 * t, b = 52 + 14 * v;
        const grd = g.createLinearGradient(w / 2, y, w / 2 + sd * lf, y + 22 + 10 * t); grd.addColorStop(0, `rgb(${r - 18},${gg - 16},${b - 10})`); grd.addColorStop(1, `rgb(${r + 22},${gg + 20},${b + 8})`);
        g.strokeStyle = grd; g.lineWidth = 1.6 + 0.8 * (1 - t); g.beginPath(); g.moveTo(w / 2 + sd * 2, y); g.quadraticCurveTo(w / 2 + sd * lf * 0.55, y + 6, w / 2 + sd * lf, y + 22 + 10 * t); g.stroke();
      }
    }
    for (let y = 0; y < 30; y += 6) for (const sd of [-1, 1]) { g.strokeStyle = 'rgba(150,140,90,.9)'; g.lineWidth = 2; g.beginPath(); g.moveTo(w / 2, y); g.lineTo(w / 2 + sd * 10, y + 12); g.stroke(); } // espinas de la base
    const rq = g.createLinearGradient(0, 0, 0, h); rq.addColorStop(0, '#c9b46a'); rq.addColorStop(1, '#8e9a52');
    g.strokeStyle = rq; g.lineWidth = 6; g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h - 4); g.stroke();
  });
  const texSeca = lienzo(128, 512, (g, w, h) => { g.clearRect(0, 0, w, h); for (let y = 14; y < h - 4; y += 3.5) { const t = y / h, lf = (w / 2 - 4) * Math.sin(Math.PI * Math.min(1, 0.08 + t)) * (1 - 0.5 * t); for (const sd of [-1, 1]) { const v = Math.random(); g.strokeStyle = `rgb(${150 + 40 * v},${126 + 30 * v},${78 + 20 * v})`; g.lineWidth = 1.4; g.beginPath(); g.moveTo(w / 2, y); g.lineTo(w / 2 + sd * lf, y + 14); g.stroke(); } } g.strokeStyle = '#a08c5c'; g.lineWidth = 4; g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.stroke(); });
  const texTronco = lienzo(128, 512, (g, w, h) => { // cicatrices en rombo de las bases foliares
    g.fillStyle = '#6f5f4c'; g.fillRect(0, 0, w, h);
    const cw = w / 6, ch = 22;
    for (let fy = -1; fy < h / ch + 1; fy++) for (let fx = -1; fx < 7; fx++) {
      const cx = fx * cw + (fy % 2 ? cw / 2 : 0), cy = fy * ch, v = Math.random();
      g.fillStyle = `rgb(${120 + 30 * v},${104 + 26 * v},${84 + 20 * v})`; g.beginPath(); g.moveTo(cx, cy - ch * 0.48); g.lineTo(cx + cw * 0.46, cy); g.lineTo(cx, cy + ch * 0.48); g.lineTo(cx - cw * 0.46, cy); g.closePath(); g.fill();
      g.fillStyle = 'rgba(40,30,22,.5)'; g.fillRect(cx - cw * 0.3, cy + ch * 0.12, cw * 0.6, 2.5);
    }
  }, true);
  // hoja: cinta doblada en V (dos medias hojas a ±32° del plano), arqueada con su peso; 14 tramos
  const hoja = (P, U, I, az, el, Lh, ancho, caida, u0) => {
    const dx = Math.cos(az), dz = Math.sin(az), px = -dz, pz = dx, V = 0.32, N = 14, base = P.length / 3;
    for (let j = 0; j <= N; j++) {
      const t = j / N, d = Lh * t, y = Math.sin(el) * d - caida * d * d / Lh, r = Math.cos(el) * d, wv = ancho * Math.pow(Math.sin(Math.PI * Math.min(1, 0.06 + t)), 0.7) * (1 - 0.4 * t);
      for (const sd of [-1, 0, 1]) { const ww = sd * wv / 2; P.push(dx * r + px * ww * Math.cos(V), y + Math.abs(sd) * wv / 2 * Math.sin(V), dz * r + pz * ww * Math.cos(V)); U.push(u0 + (sd + 1) / 2 * 0.5, t); }
      if (j) { const b = base + (j - 1) * 3; I.push(b, b + 3, b + 1, b + 1, b + 3, b + 4, b + 1, b + 4, b + 2, b + 2, b + 4, b + 5); }
    }
  };
  const corona = (sem) => {
    let s = sem; const rn = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const P = [], U = [], I = [], Ps = [], Us = [], Is = [];
    for (let k = 0; k < 44; k++) {
      const az = k * 2.39996 + rn() * 0.2, piso = k / 44; // las primeras arriba (erguidas), las últimas abajo (colgando)
      const el = 1.15 - piso * 1.75 + (rn() - 0.5) * 0.18, Lh = 4.2 + rn() * 1.1 - piso * 0.4, caida = 0.35 + piso * 0.6;
      if (piso > 0.86 && rn() < 0.55) hoja(Ps, Us, Is, az, el - 0.3, Lh * 0.9, 0.8, caida + 0.25, 0); // seca, del anillo inferior
      else hoja(P, U, I, az, el, Lh, 1.0, caida, 0);
    }
    const mk = (P, U, I) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U.map((v, i) => i % 2 ? v : v * 2), 2)); g.setIndex(I); g.computeVertexNormals(); return g; };
    return [mk(P, U, I), mk(Ps, Us, Is)];
  };
  const CORONAS = [corona(11), corona(29), corona(53)];
  const tronco = new THREE.CylinderGeometry(0.6, 0.72, 1, 16, 4, true);
  { const p = tronco.attributes.position, uv = tronco.attributes.uv; for (let i = 0; i < p.count; i++) { const y = p.getY(i) + 0.5, k = 1 + 0.08 * Math.sin(y * 9) ; p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); p.setY(i, y); uv.setY(i, uv.getY(i) * 4); } tronco.computeVertexNormals(); }
  const pina = new THREE.SphereGeometry(1, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.62).scale(0.95, 0.9, 0.95); // bases foliares bajo la corona
  const matHoja = new THREE.MeshStandardMaterial({ map: texHoja, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.62, emissive: 0xffffff, emissiveMap: texHoja, emissiveIntensity: 0.22 });
  const matSeca = new THREE.MeshStandardMaterial({ map: texSeca, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.9, emissive: 0xffffff, emissiveMap: texSeca, emissiveIntensity: 0.15 });
  const matTronco = new THREE.MeshStandardMaterial({ map: texTronco, roughness: 0.95 });
  const matPina = new THREE.MeshStandardMaterial({ map: texTronco, roughness: 0.95, color: 0x9a8a6a });
  const palmas = D.palmas || [], nP = palmas.length;
  const mT = new THREE.InstancedMesh(tronco, matTronco, nP), mP = new THREE.InstancedMesh(pina, matPina, nP), o3 = new THREE.Object3D(), col = new THREE.Color();
  const mC = CORONAS.map(([v, s]) => [new THREE.InstancedMesh(v, matHoja, nP), new THREE.InstancedMesh(s, matSeca, nP)]), nC = [0, 0, 0];
  palmas.forEach(([X, Y, r], i) => {
    const h = Math.max(3.2, Math.min(7.5, 2 + r * 1.2)), esc = Math.max(0.9, Math.min(1.4, r / 2.5)), giro = (X * 13.1 + Y * 7.7) % 6.28, vk = Math.abs(Math.floor(X * 3 + Y * 7)) % 3;
    o3.position.set(X + OX, Y0, Y + OZ); o3.rotation.set(0, giro, 0); o3.scale.set(esc, h, esc); o3.updateMatrix(); mT.setMatrixAt(i, o3.matrix);
    o3.position.y = Y0 + h - 0.15; o3.scale.set(esc * 0.85, esc * 0.85, esc * 0.85); o3.updateMatrix(); mP.setMatrixAt(i, o3.matrix);
    o3.position.y = Y0 + h + 0.35; o3.scale.set(esc, esc, esc); o3.updateMatrix();
    const k = nC[vk]++, tv = 0.88 + ((X * 7.3 + Y) % 1 + 1) % 1 * 0.24; col.setRGB(tv, tv * (0.97 + 0.06 * (i % 3) / 2), tv * 0.95);
    mC[vk].forEach(m => { m.setMatrixAt(k, o3.matrix); m.setColorAt(k, col); });
  });
  mC.forEach((par, vk) => par.forEach(m => { m.count = nC[vk]; }));
  for (const m of [mT, mP, ...mC.flat()]) { m.castShadow = !movil; m.receiveShadow = !movil; m.frustumCulled = false; grupo.add(m); }
  let semH = 31; const rnd = () => ((semH = (semH * 16807) % 2147483647) / 2147483647);
  // ---------- suelo de la plaza: foto satelital de la zona (tapa la base gris que dejaba el recorte de los árboles de Google) ----------
  if (D.suelo && D.zona_giro) {
    const [sx0, sy0, sx1, sy1] = D.suelo, sh = new THREE.Shape(D.zona_giro.map(p => new THREE.Vector2(p[0], p[1])));
    const g = new THREE.ShapeGeometry(sh, 4), p = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) { const X = p.getX(i), Y = p.getY(i); uv.setXY(i, (X - sx0) / (sx1 - sx0), 1 - (Y - sy0) / (sy1 - sy0)); p.setXYZ(i, X + OX, Y0 + 0.12, Y + OZ); }
    g.computeVertexNormals(); if (g.attributes.normal.getY(0) < 0) g.index.array.reverse();
    const tex = new THREE.TextureLoader().load('data3d/tintal_suelo.jpg'); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = ANIS;
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 }));
    m.receiveShadow = !movil; m.renderOrder = 1; m.name = 'tintal-suelo'; grupo.add(m);
  }

  // ---------- HUERTA PARAMÉTRICA del prado circular: espiral de bancales que atrae polinizadores, aves e insectos ----------
  // 11 bancales curvos en espiral de Fermat que crecen y se levantan hacia el centro (ancho y alto variables), cubiertos de
  // hortalizas y flores melíferas; en el centro un pabellón de retícula de madera (gridshell) sobre un espejo de agua;
  // hoteles de insectos y bebederos de aves en el borde, y caminos de gravilla entre los brazos.
  if (D.huerta) {
    const HC = [D.huerta.c[0] + OX, D.huerta.c[1] + OZ], R = D.huerta.r - 2, BR = 11;
    const PAL = ['#8d5bc4', '#b07ad9', '#f2c230', '#f08a24', '#e34b5a', '#f4f1e6', '#d95fa8', '#5aa83c', '#7fbf4a', '#3f7d2c'].map(h => new THREE.Color(h));
    const madera = new THREE.Color('#8a6a48'), tierra = new THREE.Color('#5a4030');
    const P = [], N = [], Cc = [], I = []; let vc = 0;
    const v = (x, y, z, c) => { P.push(x, y, z); Cc.push(c.r, c.g, c.b); return vc++; };
    const brazos = [];
    for (let b = 0; b < BR; b++) {
      const a0 = b / BR * Math.PI * 2, pts = [];
      for (let k = 0; k <= 40; k++) { const t = k / 40, r = 7.5 + t * (R - 9), th = a0 + t * 2.1; pts.push({ x: HC[0] + Math.cos(th) * r, z: HC[1] + Math.sin(th) * r, w: 1.1 + 1.6 * Math.sin(Math.PI * Math.pow(t, 0.8)), h: 0.35 + 0.75 * (1 - t) * Math.sin(Math.PI * Math.min(1, t * 1.8 + 0.1)), t }); }
      brazos.push(pts);
      // bancal: cinta con lados de madera y tapa de tierra
      for (let k = 0; k < pts.length - 1; k++) {
        const A = pts[k], B = pts[k + 1], dx = B.x - A.x, dz = B.z - A.z, L = Math.hypot(dx, dz) || 1, nx = -dz / L, nz = dx / L;
        const q = (p, s, y) => [p.x + nx * s * p.w / 2, y, p.z + nz * s * p.w / 2];
        for (const s of [-1, 1]) { const a = q(A, s, Y0), b2 = q(B, s, Y0), c2 = q(B, s, Y0 + B.h), d = q(A, s, Y0 + A.h); const i0 = v(...a, madera), i1 = v(...b2, madera), i2 = v(...c2, madera), i3 = v(...d, madera); I.push(...(s > 0 ? [i0, i2, i1, i0, i3, i2] : [i0, i1, i2, i0, i2, i3])); }
        const t0 = v(...q(A, -1, Y0 + A.h), tierra), t1 = v(...q(A, 1, Y0 + A.h), tierra), t2 = v(...q(B, 1, Y0 + B.h), tierra), t3 = v(...q(B, -1, Y0 + B.h), tierra); I.push(t0, t2, t1, t0, t3, t2);
      }
    }
    const gB = new THREE.BufferGeometry(); gB.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); gB.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3)); gB.setIndex(I); gB.computeVertexNormals();
    const bancales = new THREE.Mesh(gB, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 })); bancales.castShadow = bancales.receiveShadow = !movil; grupo.add(bancales);
    // plantas: matas instanciadas sobre cada bancal (hortalizas verdes y flores melíferas en franjas de color que cambian por brazo)
    const mata = new THREE.IcosahedronGeometry(0.42, 1), flor = new THREE.ConeGeometry(0.11, 0.7, 6).translate(0, 0.35, 0);
    const mat = new THREE.MeshStandardMaterial({ roughness: 0.8 }), XM = [], XF = [], CM = [], CF = [], o3 = new THREE.Object3D();
    brazos.forEach((pts, b) => {
      for (let k = 1; k < pts.length - 1; k++) { const p = pts[k], n = Math.max(1, Math.round(p.w / 0.55));
        for (let j = 0; j < n; j++) {
          const s = (j + 0.5) / n - 0.5, A = pts[k - 1], dx = p.x - A.x, dz = p.z - A.z, L = Math.hypot(dx, dz) || 1, x = p.x - dz / L * s * p.w * 0.9, z = p.z + dx / L * s * p.w * 0.9;
          const zona = (b + Math.floor(p.t * 4)) % 5, florido = zona === 0 || zona === 2 || ((k + j) % 4 === 0);
          o3.position.set(x + (rnd() - 0.5) * 0.2, Y0 + p.h, z + (rnd() - 0.5) * 0.2); o3.rotation.set(0, rnd() * 6, 0); const e = 0.7 + rnd() * 0.6; o3.scale.set(e, e * (0.6 + rnd() * 0.5), e); o3.updateMatrix(); XM.push(o3.matrix.clone()); CM.push(PAL[7 + Math.floor(rnd() * 3)]);
          if (florido) { o3.position.y += 0.25; o3.scale.setScalar(0.8 + rnd() * 0.7); o3.updateMatrix(); XF.push(o3.matrix.clone()); CF.push(PAL[(b * 2 + Math.floor(p.t * 3)) % 7]); }
        }
      }
    });
    const inst = (g, L, C) => { const m = new THREE.InstancedMesh(g, mat, L.length); L.forEach((M, i) => { m.setMatrixAt(i, M); m.setColorAt(i, C[i]); }); m.castShadow = !movil; m.frustumCulled = false; grupo.add(m); };
    inst(mata, XM, CM); inst(flor, XF, CF);
    // espejo de agua central y pabellón gridshell de madera (retícula torcida en dos direcciones)
    const agua = new THREE.Mesh(new THREE.CircleGeometry(4.6, 40).rotateX(-Math.PI / 2).translate(HC[0], Y0 + 0.18, HC[1]), new THREE.MeshStandardMaterial({ color: 0x3f7f95, roughness: 0.08, metalness: 0.3 })); grupo.add(agua);
    const RC = 6.6, HD = 5.2, NU = 18, NV = 7, nodo = (i, j, tw) => { const u = i / NU * Math.PI * 2 + tw * j / NV * 0.9, f = j / NV, r = RC * Math.sin(Math.PI / 2 * (1 - f)) + 0.4; return new THREE.Vector3(HC[0] + Math.cos(u) * r, Y0 + HD * Math.sin(Math.PI / 2 * f) * (1 + 0.12 * Math.sin(u * 3)), HC[1] + Math.sin(u) * r); };
    const varas = []; for (const tw of [1, -1]) for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) varas.push([nodo(i, j, tw), nodo(i, j + 1, tw)]);
    for (let j = 1; j < NV; j += 2) for (let i = 0; i < NU; i++) varas.push([nodo(i, j, 1), nodo(i + 1, j, 1)]);
    const cil = new THREE.CylinderGeometry(0.07, 0.07, 1, 6).translate(0, 0.5, 0), mV = new THREE.InstancedMesh(cil, new THREE.MeshStandardMaterial({ color: 0xa47b52, roughness: 0.7 }), varas.length), up = new THREE.Vector3(0, 1, 0);
    varas.forEach(([a, b], k) => { const d = b.clone().sub(a), L = d.length(); o3.position.copy(a); o3.quaternion.setFromUnitVectors(up, d.normalize()); o3.scale.set(1, L, 1); o3.updateMatrix(); mV.setMatrixAt(k, o3.matrix); });
    mV.castShadow = !movil; grupo.add(mV);
    // hoteles de insectos y bebederos de aves en el borde
    const hotel = new THREE.BoxGeometry(1.2, 1.6, 0.5).translate(0, 1.3, 0), poste = new THREE.CylinderGeometry(0.08, 0.08, 1, 6).translate(0, 0.5, 0), beb = new THREE.CylinderGeometry(0.55, 0.15, 1.1, 14).translate(0, 0.55, 0);
    const mH = new THREE.InstancedMesh(hotel, new THREE.MeshStandardMaterial({ color: 0x9b7550, roughness: 0.9 }), 8), mP2 = new THREE.InstancedMesh(poste, new THREE.MeshStandardMaterial({ color: 0x5a4636 }), 8), mB = new THREE.InstancedMesh(beb, new THREE.MeshStandardMaterial({ color: 0xcfc8bb, roughness: 0.8 }), 6);
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2 + 0.2; o3.position.set(HC[0] + Math.cos(a) * (R + 1), Y0, HC[1] + Math.sin(a) * (R + 1)); o3.rotation.set(0, -a + Math.PI / 2, 0); o3.scale.set(1, 1, 1); o3.updateMatrix(); mH.setMatrixAt(k, o3.matrix); mP2.setMatrixAt(k, o3.matrix); }
    for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2 + 0.7; o3.position.set(HC[0] + Math.cos(a) * (R - 3), Y0, HC[1] + Math.sin(a) * (R - 3)); o3.rotation.set(0, 0, 0); o3.updateMatrix(); mB.setMatrixAt(k, o3.matrix); }
    for (const m of [mH, mP2, mB]) { m.castShadow = !movil; grupo.add(m); }
    // fauna que atrae: mariposas, abejas y colibríes que van de flor en flor
    const flores = XF.map(M => new THREE.Vector3().setFromMatrixPosition(M));
    const ESPF = [{ c: 0xf08a24, n: movil ? 14 : 36, v: 1.8, s: 0.09, ala: true }, { c: 0xf4f1e6, n: movil ? 8 : 20, v: 1.6, s: 0.08, ala: true }, { c: 0xe0a52a, n: movil ? 25 : 70, v: 3.2, s: 0.025 }, { c: 0x1f9a5c, n: movil ? 4 : 10, v: 7, s: 0.07 }];
    const fauna = [];
    for (const e of ESPF) {
      const g = e.ala ? new THREE.PlaneGeometry(e.s * 2, e.s).rotateX(-Math.PI / 2) : new THREE.SphereGeometry(e.s, 6, 4).scale(1.6, 1, 1);
      const m = new THREE.InstancedMesh(g, new THREE.MeshStandardMaterial({ color: e.c, side: THREE.DoubleSide, roughness: 0.6 }), e.n); m.frustumCulled = false; grupo.add(m);
      const ag = []; for (let i = 0; i < e.n; i++) { const f = flores[Math.floor(rnd() * flores.length)]; ag.push({ p: f.clone().add(new THREE.Vector3(0, 1, 0)), d: f.clone(), t: rnd() * 3, ph: rnd() * 6 }); }
      fauna.push({ e, m, ag });
    }
    let tu = performance.now();
    const vuela = () => {
      requestAnimationFrame(vuela); const ahora = performance.now(), dt = Math.min(0.05, (ahora - tu) / 1000); tu = ahora;
      if (T3.camera.position.distanceTo(new THREE.Vector3(HC[0], 0, HC[1])) > 600) return; // solo cerca de la huerta
      for (const { e, m, ag } of fauna) ag.forEach((a, i) => {
        const dir = a.d.clone().sub(a.p), L = dir.length();
        if (L < 0.15) { if ((a.t -= dt) <= 0) { a.d = flores[Math.floor(rnd() * flores.length)].clone().add(new THREE.Vector3(0, 0.35, 0)); a.t = 1 + rnd() * 4; } }
        else a.p.addScaledVector(dir.normalize(), Math.min(L, e.v * dt)).add(new THREE.Vector3(Math.sin(ahora / 200 + a.ph) * 0.02, Math.sin(ahora / 150 + a.ph) * 0.02, 0));
        o3.position.copy(a.p); o3.rotation.set(e.ala ? Math.sin(ahora / 60 + a.ph) * 0.9 : 0, Math.atan2(-dir.z, dir.x), 0); const s = Math.max(1, T3.camera.position.distanceTo(a.p) * 0.012 / e.s); o3.scale.setScalar(Math.min(s, 6)); o3.updateMatrix(); m.setMatrixAt(i, o3.matrix);
      });
      for (const f of fauna) f.m.instanceMatrix.needsUpdate = true;
    };
    requestAnimationFrame(vuela);
  }
  T3.tintal = grupo;
  return { grupo, palmas: nP };
}
