/* ============ CANCHAS REALES DE KENNEDY (modo Kennedy) ============
   582 canchas de OpenStreetMap (data3d/canchas.json, de tools/canchas_kennedy.py) pintadas sobre la foto 3D como son:
   - fútbol en grama sintética: franjas de corte claras y oscuras, líneas reglamentarias, arcos de 7,3 m (o de microfútbol si es pequeña)
   - microfútbol / múltiples en concreto o asfalto: placa pintada (azul, verde o terracota) con líneas de fútbol sala y de baloncesto
   - baloncesto: placa con su tablero, aros y llave; voleibol y tenis con su malla; pista atlética con carriles
   - malla eslabonada alrededor de las placas de barrio (las de concreto), como en los parques de Kennedy
   Todo en pocas mallas (una por tipo de superficie + instancias para arcos, tableros y mallas): carga rápida.
   Marco: X este, Y sur desde El Burro -> mundo x = X + OX, z = Y + OZ. */
export async function iniciarCanchas({ THREE, T3, OX, OZ, Y0 = 2.0, movil = false }) {
  const D = await (window.cargarJSON || ((u) => fetch(u).then(r => r.json())))('data3d/canchas.json?v=1');
  const grupo = new THREE.Group(); grupo.name = 'canchas'; T3.scene.add(grupo);
  const ANIS = Math.min(8, T3.renderer.capabilities.getMaxAnisotropy ? T3.renderer.capabilities.getMaxAnisotropy() : 4);

  // ---------- texturas de superficie dibujadas una vez (lienzo 2D) ----------
  const grano = (g, w, h, a, n = 9000) => { for (let i = 0; i < n; i++) { const v = Math.random(); g.fillStyle = `rgba(${v > 0.5 ? '255,255,255' : '0,0,0'},${a * Math.random()})`; g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2); } };
  function lienzo(w, h, f) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); f(g, w, h); g.globalCompositeOperation = 'saturation'; g.fillStyle = 'rgba(128,128,128,.35)'; g.fillRect(0, 0, w, h); g.globalCompositeOperation = 'source-over'; /* colores de cancha gastada al sol, no fosforescentes */ const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = ANIS; return t; }
  const linea = (g, w) => { g.strokeStyle = 'rgba(236,236,228,.7)'; g.lineWidth = w; g.lineCap = 'butt'; };
  // fútbol 11 sobre grama sintética (proporción 105 x 68)
  function futbol(g, W, H, sintetica) {
    const franjas = 12;
    for (let i = 0; i < franjas; i++) { g.fillStyle = sintetica ? (i % 2 ? '#56704a' : '#5d7850') : (i % 2 ? '#5d8a3e' : '#6a9746'); /* grama sintética real: verde algo apagado, no de juguete */ g.fillRect(i * W / franjas, 0, W / franjas + 1, H); }
    grano(g, W, H, 0.06, 14000);
    const m = W * 0.035, x0 = m, y0 = m, x1 = W - m, y1 = H - m, fw = x1 - x0, fh = y1 - y0, u = fw / 105;
    linea(g, Math.max(1.2, u * 0.12));
    g.strokeRect(x0, y0, fw, fh);
    g.beginPath(); g.moveTo(W / 2, y0); g.lineTo(W / 2, y1); g.stroke();
    g.beginPath(); g.arc(W / 2, H / 2, 9.15 * u, 0, Math.PI * 2); g.stroke();
    for (const s of [0, 1]) {
      const xa = s ? x1 : x0, d = s ? -1 : 1;
      g.strokeRect(Math.min(xa, xa + d * 16.5 * u), H / 2 - 20.16 * u, 16.5 * u, 40.32 * u);
      g.strokeRect(Math.min(xa, xa + d * 5.5 * u), H / 2 - 9.16 * u, 5.5 * u, 18.32 * u);
      g.beginPath(); g.arc(xa + d * 11 * u, H / 2, 9.15 * u, s ? Math.PI - 0.93 : -0.93, s ? Math.PI + 0.93 : 0.93); g.stroke();
      g.fillStyle = 'rgba(250,250,245,.95)'; g.beginPath(); g.arc(xa + d * 11 * u, H / 2, 0.25 * u * 2, 0, 7); g.fill();
    }
    g.beginPath(); g.arc(W / 2, H / 2, u * 0.4, 0, 7); g.fill();
  }
  // placa de concreto o asfalto pintada (proporción 28 x 15): fútbol sala + baloncesto (múltiple) o solo baloncesto
  function placa(g, W, H, { fondo, borde, lineas, futsal, basket, voley }) {
    g.fillStyle = borde; g.fillRect(0, 0, W, H); grano(g, W, H, 0.09);
    const m = W * 0.06, x0 = m, y0 = m * 1.1, fw = W - 2 * m, fh = H - 2.2 * m, u = fw / 28;
    g.fillStyle = fondo; g.fillRect(x0, y0, fw, fh); grano(g, W, H, 0.05, 5000);
    // desgaste: manchas más claras en el centro y en las áreas (donde más se juega)
    const gr = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, fw * 0.55); gr.addColorStop(0, 'rgba(255,255,255,.10)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(x0, y0, fw, fh);
    g.strokeStyle = lineas; g.lineWidth = Math.max(1.2, u * 0.08);
    g.strokeRect(x0, y0, fw, fh);
    g.beginPath(); g.moveTo(W / 2, y0); g.lineTo(W / 2, y0 + fh); g.stroke();
    g.beginPath(); g.arc(W / 2, H / 2, 1.8 * u, 0, Math.PI * 2); g.stroke();
    if (futsal) { g.strokeStyle = 'rgba(236,236,228,.7)'; for (const s of [0, 1]) { const xa = s ? x0 + fw : x0, d = s ? -1 : 1; g.beginPath(); g.arc(xa, H / 2 - 1.58 * u, 6 * u, s ? Math.PI : -Math.PI / 2, s ? Math.PI * 1.5 : 0); g.stroke(); g.beginPath(); g.moveTo(xa + d * 6 * u, H / 2 - 1.58 * u); g.lineTo(xa + d * 6 * u, H / 2 + 1.58 * u); g.stroke(); g.beginPath(); g.arc(xa, H / 2 + 1.58 * u, 6 * u, s ? Math.PI / 2 : 0, s ? Math.PI : Math.PI / 2); g.stroke(); } }
    if (basket) { g.strokeStyle = basket; for (const s of [0, 1]) { const xa = s ? x0 + fw : x0, d = s ? -1 : 1; g.fillStyle = 'rgba(150,90,70,.3)'; g.fillRect(Math.min(xa, xa + d * 5.8 * u), H / 2 - 2.45 * u, 5.8 * u, 4.9 * u); g.strokeRect(Math.min(xa, xa + d * 5.8 * u), H / 2 - 2.45 * u, 5.8 * u, 4.9 * u); g.beginPath(); g.arc(xa + d * 5.8 * u, H / 2, 1.8 * u, 0, 7); g.stroke(); g.beginPath(); g.arc(xa + d * 1.575 * u, H / 2, 6.75 * u, s ? Math.PI / 2 : -Math.PI / 2, s ? Math.PI * 1.5 : Math.PI / 2); g.stroke(); } }
    if (voley) { g.strokeStyle = 'rgba(236,236,228,.7)'; g.beginPath(); g.moveTo(W / 2 - 3 * u, y0); g.lineTo(W / 2 - 3 * u, y0 + fh); g.moveTo(W / 2 + 3 * u, y0); g.lineTo(W / 2 + 3 * u, y0 + fh); g.stroke(); }
  }
  function tenis(g, W, H) {
    g.fillStyle = '#5a6e5c'; g.fillRect(0, 0, W, H); grano(g, W, H, 0.05);
    const m = W * 0.12, x0 = m, y0 = H * 0.16, fw = W - 2 * m, fh = H - 0.32 * H, u = fw / 23.77;
    g.fillStyle = '#5a6b7a'; g.fillRect(x0, y0, fw, fh);
    linea(g, Math.max(1.2, u * 0.08)); g.strokeRect(x0, y0, fw, fh);
    const s = fh * (8.23 / 10.97), ys = H / 2 - s / 2; g.beginPath(); g.moveTo(x0, ys); g.lineTo(x0 + fw, ys); g.moveTo(x0, ys + s); g.lineTo(x0 + fw, ys + s);
    g.moveTo(W / 2 - 6.4 * u, ys); g.lineTo(W / 2 - 6.4 * u, ys + s); g.moveTo(W / 2 + 6.4 * u, ys); g.lineTo(W / 2 + 6.4 * u, ys + s); g.moveTo(W / 2 - 6.4 * u, H / 2); g.lineTo(W / 2 + 6.4 * u, H / 2); g.stroke();
  }
  function pista(g, W, H) {
    g.fillStyle = '#946253'; g.fillRect(0, 0, W, H); grano(g, W, H, 0.08);
    const r = H * 0.5, carr = 6, lw = r * 0.09;
    g.strokeStyle = 'rgba(236,232,226,.6)'; g.lineWidth = 1.2;
    for (let k = 0; k <= carr; k++) { const rr = r - k * lw; g.beginPath(); g.moveTo(r, H / 2 - rr); g.lineTo(W - r, H / 2 - rr); g.arc(W - r, H / 2, rr, -Math.PI / 2, Math.PI / 2); g.lineTo(r, H / 2 + rr); g.arc(r, H / 2, rr, Math.PI / 2, Math.PI * 1.5); g.stroke(); }
    const ri = r - carr * lw; g.fillStyle = '#5d7850'; g.beginPath(); g.moveTo(r, H / 2 - ri); g.lineTo(W - r, H / 2 - ri); g.arc(W - r, H / 2, ri, -Math.PI / 2, Math.PI / 2); g.lineTo(r, H / 2 + ri); g.arc(r, H / 2, ri, Math.PI / 2, Math.PI * 1.5); g.fill(); grano(g, W, H, 0.03, 3000);
  }
  const TX = {
    futbolG: () => lienzo(1024, 664, (g, w, h) => futbol(g, w, h, true)),
    futbolC: () => lienzo(768, 420, (g, w, h) => placa(g, w, h, { fondo: '#5c6a76', borde: '#8c8a84', lineas: 'rgba(236,236,228,.7)', futsal: true })),
    multiple: () => lienzo(768, 420, (g, w, h) => placa(g, w, h, { fondo: '#566d78', borde: '#93918b', lineas: 'rgba(236,236,228,.7)', futsal: true, basket: 'rgba(214,190,120,.65)' })),
    multipleV: () => lienzo(768, 420, (g, w, h) => placa(g, w, h, { fondo: '#5b6e5c', borde: '#93918b', lineas: 'rgba(236,236,228,.7)', futsal: true, basket: 'rgba(214,190,120,.65)' })),
    baloncesto: () => lienzo(768, 420, (g, w, h) => placa(g, w, h, { fondo: '#8f6a58', borde: '#9a958c', lineas: 'rgba(236,236,228,.7)', basket: 'rgba(236,236,228,.7)' })),
    voleibol: () => lienzo(768, 420, (g, w, h) => placa(g, w, h, { fondo: '#977459', borde: '#9a958c', lineas: 'rgba(236,236,228,.7)', voley: true })),
    tenis: () => lienzo(768, 420, tenis),
    pista: () => lienzo(1024, 512, pista)
  };
  const tipoDe = (c) => c.d === 'atletismo' ? 'pista' : c.d === 'tenis' ? 'tenis' : c.d === 'voleibol' ? 'voleibol' : c.d === 'baloncesto' ? 'baloncesto'
    : c.d === 'futbol' ? (c.s === 'grama' ? 'futbolG' : 'futbolC') : (hash(c.c[0] * 7 + c.c[1]) < 0.5 ? 'multiple' : 'multipleV');
  function hash(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }

  // ---------- superficies: un rectángulo por cancha, agrupados por textura ----------
  const porTipo = {};
  for (const c of D.canchas) { (porTipo[tipoDe(c)] = porTipo[tipoDe(c)] || []).push(c); }
  const marco = (c) => { const ux = Math.cos(c.a), uz = Math.sin(c.a), vx = -uz, vz = ux, cx = c.c[0] + OX, cz = c.c[1] + OZ; return { pt: (u, v) => [cx + u * ux + v * vx, cz + u * uz + v * vz], ux, uz, vx, vz, cx, cz }; };
  for (const [t, lista] of Object.entries(porTipo)) {
    const P = [], U = [], I = [];
    for (const c of lista) {
      const { pt } = marco(c), L2 = c.L / 2, W2 = c.W / 2, s = P.length / 3, y = Y0 + 0.12;
      for (const [u, v, a, b] of [[-L2, -W2, 0, 0], [L2, -W2, 1, 0], [L2, W2, 1, 1], [-L2, W2, 0, 1]]) { const p = pt(u, v); P.push(p[0], y, p[1]); U.push(a, b); }
      I.push(s, s + 2, s + 1, s, s + 3, s + 2);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setIndex(I); g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: TX[t](), roughness: t === 'futbolG' ? 0.92 : 0.85, metalness: 0, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }));
    m.receiveShadow = !movil; m.renderOrder = 2; m.name = 'canchas-' + t; grupo.add(m);
  }

  // ---------- elementos 3D: arcos, tableros con aro, mallas de voleibol/tenis, cerramiento eslabonado ----------
  const blanco = new THREE.MeshStandardMaterial({ color: 0xf4f4f0, roughness: 0.5, metalness: 0.3 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x6f757b, roughness: 0.55, metalness: 0.6 });
  const tub = (x0, y0, z0, x1, y1, z1, r) => { // tubo de a a b
    const a = new THREE.Vector3(x0, y0, z0), d = new THREE.Vector3(x1 - x0, y1 - y0, z1 - z0), L = d.length(), g = new THREE.CylinderGeometry(r, r, L, 6);
    g.translate(0, L / 2, 0); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize())); g.translate(a.x, a.y, a.z); return g; };
  const { mergeGeometries } = await import('three/addons/utils/BufferGeometryUtils.js');
  // arco (eje x = ancho de la portería, z = fondo), en el origen del poste izquierdo
  const arco = (w, h, d) => mergeGeometries([tub(-w / 2, 0, 0, -w / 2, h, 0, 0.06), tub(w / 2, 0, 0, w / 2, h, 0, 0.06), tub(-w / 2, h, 0, w / 2, h, 0, 0.06), tub(-w / 2, h, 0, -w / 2, 0, d, 0.035), tub(w / 2, h, 0, w / 2, 0, d, 0.035), tub(-w / 2, 0, d, w / 2, 0, d, 0.035)]);
  const gArco = arco(7.32, 2.44, 2.0), gArcoS = arco(3, 2, 1.2);
  const red = (w, h, d) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-w / 2, h, 0, w / 2, h, 0, w / 2, 0, d, -w / 2, 0, d, -w / 2, 0, 0, -w / 2, h, 0, -w / 2, 0, d, w / 2, 0, 0, w / 2, h, 0, w / 2, 0, d], 3)); g.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 7, 9, 8]); g.computeVertexNormals(); return g; };
  const texRed = lienzo(64, 64, (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = 'rgba(245,245,240,.85)'; g.lineWidth = 2; for (let i = 0; i <= w; i += 8) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.moveTo(0, i); g.lineTo(w, i); g.stroke(); } });
  texRed.wrapS = texRed.wrapT = THREE.RepeatWrapping; texRed.repeat.set(6, 3);
  const matRed = new THREE.MeshStandardMaterial({ map: texRed, transparent: true, alphaTest: 0.2, side: THREE.DoubleSide, depthWrite: false, roughness: 0.9 });
  // tablero con aro: poste, brazo, tablero blanco con recuadro y aro naranja
  const tablero = mergeGeometries([tub(0, 0, -1.2, 0, 3.2, -1.2, 0.08), tub(0, 3.2, -1.2, 0, 3.2, -0.05, 0.06), new THREE.BoxGeometry(1.8, 1.05, 0.05).translate(0, 3.35, 0)]);
  const aro = new THREE.TorusGeometry(0.23, 0.02, 4, 12).rotateX(Math.PI / 2).translate(0, 3.05, 0.38);
  const matTab = new THREE.MeshStandardMaterial({ color: 0xeeeeea, roughness: 0.6 }), matAro = new THREE.MeshStandardMaterial({ color: 0xe0612a, roughness: 0.5 });
  const XF = { arco: [], arcoS: [], tab: [], red: [], redV: [], valla: [] };
  const o3 = new THREE.Object3D();
  const poner = (lista, x, z, rotY, sx = 1, sy = 1, sz = 1) => { o3.position.set(x, Y0 + 0.12, z); o3.rotation.set(0, rotY, 0); o3.scale.set(sx, sy, sz); o3.updateMatrix(); lista.push(o3.matrix.clone()); };
  for (const c of D.canchas) {
    const t = tipoDe(c), { pt } = marco(c), L2 = c.L / 2, W2 = c.W / 2;
    const rot = -c.a; // rotación alrededor de y que lleva x local al eje largo de la cancha
    if (t === 'futbolG' || t === 'futbolC' || t === 'multiple' || t === 'multipleV') {
      const grande = t === 'futbolG' && c.L > 60, m = grande ? c.L * 0.035 : c.L * 0.06;
      for (const s of [-1, 1]) { const p = pt(s * (L2 - m), 0); poner(grande ? XF.arco : XF.arcoS, p[0], p[1], rot + (s > 0 ? Math.PI / 2 : -Math.PI / 2)); } // el fondo del arco (z local) hacia afuera
    }
    if (t === 'baloncesto' || t === 'multiple' || t === 'multipleV') for (const s of [-1, 1]) { const p = pt(s * (L2 - c.L * 0.06 - 1.2), 0); poner(XF.tab, p[0], p[1], rot + (s > 0 ? -Math.PI / 2 : Math.PI / 2)); }
    if (t === 'voleibol' || t === 'tenis') { const p = pt(0, 0); poner(XF.redV, p[0], p[1], rot + Math.PI / 2, c.W * 0.85, t === 'tenis' ? 0.4 : 1, 1); }
    // cerramiento de malla eslabonada en las placas de barrio (no en las de grama grandes ni en la pista)
    if (t !== 'futbolG' && t !== 'pista' && c.L < 60) {
      for (const [u0, v0, u1, v1] of [[-L2, -W2, L2, -W2], [L2, -W2, L2, W2], [L2, W2, -L2, W2], [-L2, W2, -L2, -W2]]) {
        const a = pt(u0, v0), b = pt(u1, v1), len = Math.hypot(b[0] - a[0], b[1] - a[1]);
        o3.position.set((a[0] + b[0]) / 2, Y0 + 0.12, (a[1] + b[1]) / 2); o3.rotation.set(0, -Math.atan2(b[1] - a[1], b[0] - a[0]), 0); o3.scale.set(len, 1, 1); o3.updateMatrix(); XF.valla.push(o3.matrix.clone());
      }
    }
  }
  const inst = (geo, mat, lista, sombra = true) => { if (!lista.length) return; const m = new THREE.InstancedMesh(geo, mat, lista.length); lista.forEach((M, i) => m.setMatrixAt(i, M)); m.castShadow = sombra && !movil; m.frustumCulled = false; grupo.add(m); return m; };
  inst(gArco, blanco, XF.arco); inst(gArcoS, blanco, XF.arcoS); inst(red(7.32, 2.44, 2.0), matRed, XF.arco, false); inst(red(3, 2, 1.2), matRed, XF.arcoS, false);
  inst(tablero, matTab, XF.tab); inst(aro, matAro, XF.tab, false);
  // malla de voleibol / tenis: plano de 1 m de ancho escalado al ancho de la cancha
  const gRedV = new THREE.PlaneGeometry(1, 1).translate(0, 1.95, 0); inst(gRedV, matRed, XF.redV, false);
  // valla eslabonada: plano de 1 m x 4 m (escalado en x al largo del lado) con postes cada 3 m pintados en la textura
  const texValla = lienzo(128, 128, (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = 'rgba(205,210,212,.55)'; g.lineWidth = 1.2; for (let i = -h; i < w + h; i += 9) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + h, h); g.moveTo(i + h, 0); g.lineTo(i, h); g.stroke(); } g.fillStyle = 'rgba(120,126,130,.95)'; g.fillRect(0, 0, 5, h); g.fillRect(0, 0, w, 4); });
  texValla.wrapS = THREE.RepeatWrapping;
  const gValla = new THREE.PlaneGeometry(1, 4).translate(0, 2, 0);
  const matValla = new THREE.MeshStandardMaterial({ map: texValla, transparent: true, alphaTest: 0.08, side: THREE.DoubleSide, depthWrite: false, roughness: 0.8, metalness: 0.4 });
  matValla.onBeforeCompile = (sh) => { // la textura se repite cada 3 m a lo largo del lado (la escala de la instancia es el largo)
    sh.vertexShader = sh.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\n#if defined(USE_MAP) && defined(USE_INSTANCING)\nvMapUv.x *= length(instanceMatrix[0].xyz) / 3.0;\n#endif');
  };
  inst(gValla, matValla, XF.valla, false);
  T3.canchas = grupo;
  return { grupo, n: D.canchas.length, ver: (on) => { grupo.visible = on; } };
}
