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
  const D = await (window.cargarJSON || ((u) => fetch(u).then(r => r.json())))('data3d/tintal.json?v=1');
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

  // ---------- palmas de la plaza (Phoenix canariensis): tronco grueso anillado y corona de hojas pinnadas arqueadas ----------
  const texHoja = lienzo(128, 512, (g, w, h) => { // hoja pinnada: raquis central y folíolos a los dos lados (alfa)
    g.clearRect(0, 0, w, h);
    for (let y = 8; y < h; y += 5) { const t = y / h, lf = (w / 2 - 4) * Math.sin(Math.PI * Math.min(1, t * 1.15)) * (1 - 0.35 * t); for (const sd of [-1, 1]) { g.strokeStyle = `rgba(${60 + 30 * Math.random()},${92 + 30 * Math.random()},${38 + 15 * Math.random()},1)`; g.lineWidth = 2.2; g.beginPath(); g.moveTo(w / 2, y); g.lineTo(w / 2 + sd * lf, y + 9 + 6 * t); g.stroke(); } }
    g.strokeStyle = '#8a8a4e'; g.lineWidth = 4; g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.stroke();
  });
  const texTronco = lienzo(64, 256, (g, w, h) => { g.fillStyle = '#7a6a55'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 9) { g.fillStyle = 'rgba(40,30,22,.55)'; g.fillRect(0, y, w, 3); g.fillStyle = 'rgba(170,150,120,.35)'; for (let x = 0; x < w; x += 8) g.fillRect(x + (y % 18 ? 4 : 0), y + 3, 5, 5); } }, true);
  // una corona: 26 hojas en espiral, cada una una cinta curvada de 8 tramos (4,2 m), arqueada hacia abajo
  const corona = (() => {
    const P = [], U = [], I = [];
    for (let k = 0; k < 26; k++) {
      const az = k * 2.39996, el = 0.55 - (k % 3) * 0.32 - (k > 18 ? 0.35 : 0), Lh = 3.6 + (k % 4) * 0.25, base = P.length / 3, ancho = 0.75;
      const dx = Math.cos(az), dz = Math.sin(az), px = -dz, pz = dx;
      for (let j = 0; j <= 8; j++) {
        const t = j / 8, d = Lh * t, y = Math.sin(el) * d - 0.55 * d * d / Lh, r = Math.cos(el) * d, wv = ancho * (0.35 + 0.65 * Math.sin(Math.PI * Math.min(1, t * 1.1)));
        for (const sd of [-1, 1]) { P.push(dx * r + px * sd * wv / 2, y + Math.abs(sd) * 0.05 * t, dz * r + pz * sd * wv / 2); U.push(sd < 0 ? 0 : 1, t); }
        if (j) { const b = base + (j - 1) * 2; I.push(b, b + 2, b + 1, b + 1, b + 2, b + 3); }
      }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setIndex(I); g.computeVertexNormals(); return g;
  })();
  const tronco = new THREE.CylinderGeometry(0.52, 0.66, 1, 12, 1, true).translate(0, 0.5, 0);
  { const uv = tronco.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i) * 3); }
  const matHoja = new THREE.MeshStandardMaterial({ map: texHoja, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.75 });
  const matTronco = new THREE.MeshStandardMaterial({ map: texTronco, roughness: 0.95 });
  const palmas = D.palmas || [], nP = palmas.length;
  const mT = new THREE.InstancedMesh(tronco, matTronco, nP), mC = new THREE.InstancedMesh(corona, matHoja, nP), o3 = new THREE.Object3D();
  palmas.forEach(([X, Y, r], i) => {
    const h = Math.max(3, Math.min(6.5, 1.6 + r * 1.1)), esc = Math.max(0.85, Math.min(1.45, r / 2.4)), giro = (X * 13.1 + Y * 7.7) % 6.28;
    o3.position.set(X + OX, Y0, Y + OZ); o3.rotation.set(0, giro, 0); o3.scale.set(1, h, 1); o3.updateMatrix(); mT.setMatrixAt(i, o3.matrix);
    o3.position.y = Y0 + h - 0.2; o3.scale.set(esc, esc, esc); o3.updateMatrix(); mC.setMatrixAt(i, o3.matrix);
  });
  mT.castShadow = mC.castShadow = !movil; mT.frustumCulled = mC.frustumCulled = false; grupo.add(mT, mC);
  T3.tintal = grupo;
  return { grupo, palmas: nP };
}
