/* ============ TORRES DE LADRILLO CON BALCONES-HUERTA (Kennedy, 4.64416, -74.15350) ============
   Conjunto de torres de 12 pisos como el de la foto de referencia: costados en ladrillo a la vista con ventanas de marco blanco,
   columnas de paneles gris oscuro y, en cada torre, columnas de balcones de losa curva con baranda metálica de barrotes.
   En cada balcón hay una huerta: jardineras a lo largo de la baranda con hortalizas, aromáticas, tomates y flores, una
   jardinera colgada por fuera y una matera grande en la esquina.
   Uso: const T = crearTorres(THREE, T3, { liviano }); T.agregar([{ W: [[x, z], ...], h, y0 }]); T.actualizar(camara) en cada cuadro. */
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export function crearTorres(THREE, T3, opt = {}) {
  const LIV = !!opt.liviano, PISO = 3, PX = 64; // 3 m por piso; 64 px por metro en las texturas
  let sem = 11; const rnd = () => (sem = (sem * 16807) % 2147483647) / 2147483647;
  const lienzo = (w, h, f, alfa) => { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (alfa) { t.wrapS = THREE.RepeatWrapping; } return t; };

  /* ---------- atlas de fachada: 4 variantes x 3 tipos (ladrillo, panel gris, fondo de balcón); cada celda = 3 m x 1 piso ---------- */
  const CW = 3 * PX, CH = PISO * PX;
  const atlas = lienzo(CW * 4, CH * 3, (g) => {
    const ladrillo = (x0, y0) => {
      g.fillStyle = '#7d4430'; g.fillRect(x0, y0, CW, CH); // mortero oscuro
      const hb = 0.075 * PX, lb = 0.24 * PX;
      for (let f = 0, y = y0; y < y0 + CH; f++, y += hb) for (let x = x0 - (f % 2) * lb / 2; x < x0 + CW; x += lb) {
        const r = 146 + rnd() * 34, gg = 80 + rnd() * 22, b = 58 + rnd() * 18; // ladrillo terracota apagado g.fillStyle = `rgb(${r},${gg},${b})`;
        g.fillRect(Math.max(x0, x + 1), y + 1, Math.min(lb - 2, x0 + CW - x - 1), hb - 1.5); }
      g.fillStyle = 'rgba(0,0,0,0.10)'; g.fillRect(x0, y0 + CH - 0.22 * PX, CW, 0.22 * PX); // línea de placa
    };
    const panel = (x0, y0) => { g.fillStyle = '#4a4e54'; g.fillRect(x0, y0, CW, CH);
      for (let k = 0; k < 300; k++) { g.fillStyle = `rgba(${rnd() < 0.5 ? '0,0,0' : '255,255,255'},0.04)`; g.fillRect(x0 + rnd() * CW, y0 + rnd() * CH, 6, 6); }
      g.fillStyle = '#3a3d42'; for (const fx of [0, 1.5, 3]) g.fillRect(x0 + fx * PX - 1, y0, 2, CH); g.fillRect(x0, y0 + CH - 2, CW, 2); g.fillRect(x0, y0 + CH * 0.5, CW, 1.5); };
    // ventana: marco blanco, vidrio con reflejo de cielo, divisiones y cortina según la variante
    const ventana = (x0, y0, x, y, w, h, v) => {
      const X = x0 + x * PX, Y = y0 + CH - (y + h) * PX, W = w * PX, H = h * PX;
      g.fillStyle = '#f1efe9'; g.fillRect(X - 4, Y - 4, W + 8, H + 8);
      const gr = g.createLinearGradient(X, Y, X + W * 0.3, Y + H); gr.addColorStop(0, '#9fb8cc'); gr.addColorStop(0.45, '#2c3b48'); gr.addColorStop(1, '#1a232b'); g.fillStyle = gr; g.fillRect(X, Y, W, H);
      if (v === 0) { g.fillStyle = 'rgba(236,232,222,0.88)'; g.fillRect(X, Y, W * 0.42, H); g.fillRect(X + W * 0.58, Y, W * 0.42, H); } // cortinas blancas
      if (v === 1) { g.fillStyle = 'rgba(205,70,120,0.9)'; g.fillRect(X, Y, W * 0.5, H); g.fillStyle = 'rgba(236,232,222,0.85)'; g.fillRect(X + W * 0.5, Y, W * 0.5, H * 0.9); } // cortina fucsia (como en la foto)
      if (v === 2) { g.fillStyle = 'rgba(220,214,200,0.5)'; g.fillRect(X, Y, W, H * 0.18); }
      g.fillStyle = '#f1efe9'; g.fillRect(X + W / 2 - 2, Y, 4, H); g.fillRect(X, Y + H * 0.28, W, 3); // divisiones
      g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(X - 4, Y + H + 4, W + 8, 5); // alfeizar
    };
    for (let v = 0; v < 4; v++) {
      ladrillo(v * CW, 0); if (v < 3) ventana(v * CW, 0, 0.7, 0.95, 1.6, 1.45, v);
      panel(v * CW, CH); if (v < 3) ventana(v * CW, CH, 0.75, 0.95, 1.5, 1.4, v);
      // fondo de balcón: panel gris con puerta-ventana corrediza de piso a techo
      panel(v * CW, CH * 2); ventana(v * CW, CH * 2, 0.35, 0.05, 2.3, 2.45, v === 3 ? 2 : v);
    }
  });
  // baranda de barrotes (transparente entre barrotes)
  const barrotes = lienzo(64, 128, (g) => { g.clearRect(0, 0, 64, 128); g.fillStyle = '#2a2d31';
    for (let x = 2; x < 64; x += 8) g.fillRect(x, 0, 2.5, 128); g.fillRect(0, 0, 64, 7); g.fillRect(0, 60, 64, 3); g.fillRect(0, 122, 64, 6); }, true);

  const env = T3.env || null;
  const M = {
    fachada: new THREE.MeshStandardMaterial({ map: atlas, roughness: 0.82, envMap: env, envMapIntensity: 0.4, side: THREE.DoubleSide }),
    concreto: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88, side: THREE.DoubleSide }),
    baranda: new THREE.MeshStandardMaterial({ map: barrotes, alphaTest: 0.5, side: THREE.DoubleSide, metalness: 0.6, roughness: 0.45, envMap: env }),
    partes: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 }),
    plantas: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 }),
    // torres hidropónicas: plástico blanco brillante, tanque transparente y lámpara LED
    blanco: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.25, metalness: 0.0, envMap: env, envMapIntensity: 0.8 }),
    tanque: new THREE.MeshPhysicalMaterial({ color: 0xd8e8ee, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.32, envMap: env, envMapIntensity: 1.3, depthWrite: false }),
    led: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff6e6, emissiveIntensity: 2.2, roughness: 0.3 })
  };

  /* ---------- utilidades ---------- */
  const prep = (g, col) => { if (g.index) g = g.toNonIndexed(); if (!g.attributes.normal) g.computeVertexNormals(); const n = g.attributes.position.count;
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
    const c = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const v = col || [1, 1, 1]; c[i * 3] = v[0]; c[i * 3 + 1] = v[1]; c[i * 3 + 2] = v[2]; }
    const o = new THREE.BufferGeometry(); o.setAttribute('position', g.attributes.position); o.setAttribute('normal', g.attributes.normal); o.setAttribute('uv', g.attributes.uv); o.setAttribute('color', new THREE.BufferAttribute(c, 3)); return o; };
  const MATA = (() => { const g = new THREE.IcosahedronGeometry(1, 1); const p = g.attributes.position, nn = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), l = Math.hypot(x, y, z) || 1, k = 0.82 + 0.18 * Math.sin(x * 9.1 + z * 7.3) * Math.cos(y * 5.7); p.setXYZ(i, x * k, y * k, z * k); nn[i * 3] = x / l; nn[i * 3 + 1] = y / l; nn[i * 3 + 2] = z / l; }
    g.setAttribute('normal', new THREE.BufferAttribute(nn, 3)); return g; })();
  /* ---------- CULTIVOS HIDROPÓNICOS REALISTAS: plantas hechas de hojas con textura (nervaduras, borde ondulado), instanciadas ---------- */
  const hojaTex = lienzo(128, 256, (g) => { g.clearRect(0, 0, 128, 256);
    const borde = (t) => 52 * Math.sin(Math.PI * Math.min(1, t * 1.08)) ** 0.75 * (1 + 0.07 * Math.sin(t * 70)); // silueta con borde rizado
    g.beginPath(); g.moveTo(64, 254); for (let k = 0; k <= 60; k++) { const t = k / 60; g.lineTo(64 + borde(t), 254 - t * 250); } for (let k = 60; k >= 0; k--) { const t = k / 60; g.lineTo(64 - borde(t), 254 - t * 250); } g.closePath();
    const gr = g.createLinearGradient(0, 256, 0, 0); gr.addColorStop(0, '#f2f7dc'); gr.addColorStop(0.35, '#d9ecb0'); gr.addColorStop(1, '#b9db86'); g.fillStyle = gr; g.fill();
    g.save(); g.clip(); for (let k = 0; k < 500; k++) { g.fillStyle = `rgba(${rnd() < 0.5 ? '255,255,240' : '60,90,30'},0.07)`; g.beginPath(); g.arc(rnd() * 128, rnd() * 256, 2 + rnd() * 5, 0, 7); g.fill(); } // textura ampollada
    g.strokeStyle = 'rgba(250,252,235,0.9)'; g.lineWidth = 4; g.beginPath(); g.moveTo(64, 256); g.lineTo(64, 20); g.stroke(); // nervio central
    g.lineWidth = 1.6; g.strokeStyle = 'rgba(245,250,225,0.7)'; for (let k = 0; k < 9; k++) { const y = 230 - k * 24; for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(64, y); g.quadraticCurveTo(64 + sd * 25, y - 18, 64 + sd * 46, y - 40); g.stroke(); } }
    g.restore(); });
  const petaloTex = lienzo(64, 64, (g) => { g.clearRect(0, 0, 64, 64); g.beginPath(); g.moveTo(32, 62); g.bezierCurveTo(2, 40, 4, 4, 32, 4); g.bezierCurveTo(60, 4, 62, 40, 32, 62); g.closePath();
    const gr = g.createRadialGradient(32, 62, 2, 32, 30, 34); gr.addColorStop(0, '#ffe08a'); gr.addColorStop(0.35, '#ffffff'); gr.addColorStop(1, '#f4f4f4'); g.fillStyle = gr; g.fill();
    g.strokeStyle = 'rgba(120,40,0,0.35)'; g.lineWidth = 1.2; for (const a of [-0.5, -0.25, 0, 0.25, 0.5]) { g.beginPath(); g.moveTo(32, 60); g.lineTo(32 + a * 50, 30); g.stroke(); } });
  const MH = { hoja: new THREE.MeshStandardMaterial({ map: hojaTex, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.62, envMap: env, envMapIntensity: 0.35 }),
    flor: new THREE.MeshStandardMaterial({ map: petaloTex, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.55 }),
    fresa: new THREE.MeshStandardMaterial({ roughness: 0.35, envMap: env, envMapIntensity: 0.6 }) };
  // roseta de hojas curvas alrededor del eje +Y (largo 1): 5 hojas de afuera abiertas y 3 de adentro paradas
  const roseta = (abiertas, internas, anchoR) => { const P = [], U = [], I = []; let v0 = 0;
    const hoja = (ang, incl, largo, ancho) => { const S = 5;
      for (let k = 0; k <= S; k++) { const t = k / S, a = incl + t * t * 0.55, r = Math.sin(a) * largo * t, y = Math.cos(a) * largo * t, hw = ancho * largo * Math.sin(Math.PI * Math.min(1, t * 1.05 + 0.05)) * 0.5, cup = hw * 0.35;
        const cx = Math.cos(ang), cz = Math.sin(ang), px = -cz, pz = cx;
        for (const sd of [-1, 1]) { P.push(cx * r + px * hw * sd, y + cup, cz * r + pz * hw * sd); U.push(sd < 0 ? 0 : 1, t); } }
      for (let k = 0; k < S; k++) { const b = v0 + k * 2; I.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); } v0 += (S + 1) * 2; };
    for (let k = 0; k < abiertas; k++) hoja(k / abiertas * Math.PI * 2, 0.95 + (k % 2) * 0.2, 1.0, anchoR);
    for (let k = 0; k < internas; k++) hoja((k + 0.5) / internas * Math.PI * 2, 0.35, 0.72, anchoR * 0.9);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setIndex(I); g.computeVertexNormals(); return g; };
  const GEO_LECHUGA = roseta(6, 4, 0.95), GEO_HIERBA = roseta(5, 3, 0.55);
  const GEO_FLOR = (() => { const P = [], U = [], I = []; for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2, cx = Math.cos(a), cz = Math.sin(a), px = -cz, pz = cx, b = P.length / 3;
      for (const [t, sd] of [[0, -1], [0, 1], [1, -1], [1, 1]]) { const r = t * 1.0, w = 0.32 + t * 0.22; P.push(cx * r + px * w * sd * (t ? 1 : 0.25), t * 0.28, cz * r + pz * w * sd * (t ? 1 : 0.25)); U.push(sd < 0 ? 0 : 1, 1 - t); }
      I.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setIndex(I); g.computeVertexNormals(); return g; })();
  const GEO_FRESA = new THREE.ConeGeometry(1, 1.5, 9).rotateX(Math.PI);
  const VERDES = [[0.62, 0.95, 0.46], [0.5, 0.86, 0.36], [0.72, 1.0, 0.55], [0.44, 0.78, 0.32]], MORADA = [0.78, 0.38, 0.45], ALBAHACA = [0.34, 0.66, 0.26];
  const _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3(), _Y = new THREE.Vector3(0, 1, 0), _ax = new THREE.Vector3();
  const instancia = (lista, x, y, z, eje, esc, giro, col) => { _ax.copy(eje).normalize(); _q.setFromUnitVectors(_Y, _ax); _q2.setFromAxisAngle(_Y, giro); _q.multiply(_q2);
    lista.push({ m: new THREE.Matrix4().compose(_p.set(x, y, z), _q.clone(), _s.set(esc, esc, esc).clone()), c: col }); };
  // TORRE HIDROPÓNICA: tanque transparente con agua, tapa y columna blanca con bolsillos en espiral, plantas y lámpara LED
  function torreHidro(B, INS, FL, x, y, z, giro) {
    const BL = [0.95, 0.95, 0.94];
    B.tanque.push(prep(new THREE.BoxGeometry(0.46, 0.38, 0.46).translate(x, y + 0.19, z)));
    B.partes.push(prep(new THREE.BoxGeometry(0.42, 0.24, 0.42).translate(x, y + 0.13, z), [0.08, 0.12, 0.14])); // agua con nutrientes
    B.partes.push(prep(new THREE.CylinderGeometry(0.05, 0.06, 0.16, 10).translate(x + 0.08, y + 0.1, z - 0.06), [0.12, 0.12, 0.13])); // bomba
    B.blanco.push(prep(new THREE.BoxGeometry(0.5, 0.06, 0.5).translate(x, y + 0.41, z), BL)); // tapa
    const H = 1.45, R = 0.085; B.blanco.push(prep(new THREE.CylinderGeometry(R, R * 1.15, H, 16).translate(x, y + 0.44 + H / 2, z), BL)); // columna
    const NIV = 6, POR = 4;
    for (let k = 0; k < NIV; k++) for (let j = 0; j < POR; j++) {
      const a = giro + j / POR * Math.PI * 2 + k * 0.7, yk = y + 0.66 + k * (H - 0.34) / (NIV - 1), dx = Math.cos(a), dz = Math.sin(a);
      const gb = new THREE.CylinderGeometry(0.038, 0.03, 0.1, 10); gb.rotateZ(-0.85); gb.rotateY(-a); gb.translate(x + dx * (R + 0.03), yk, z + dz * (R + 0.03)); B.blanco.push(prep(gb, BL)); // bolsillo
      const ox = x + dx * (R + 0.07), oz = z + dz * (R + 0.07), oy = yk + 0.04, eje = new THREE.Vector3(dx * 0.75, 0.66, dz * 0.75), r = rnd();
      if (r < 0.6) { const roja = rnd() < 0.25, c = roja ? MORADA : VERDES[Math.floor(rnd() * VERDES.length)]; instancia(INS.hoja, ox, oy, oz, eje, 0.1 + rnd() * 0.035, rnd() * 6.3, c); } // lechuga crespa, batavia o morada
      else if (r < 0.76) instancia(INS.hierba, ox, oy, oz, eje.clone().setY(0.95), 0.085 + rnd() * 0.03, rnd() * 6.3, ALBAHACA); // albahaca
      else if (r < 0.9) { // capuchina en flor (naranja, roja o amarilla): la prefieren los colibríes
        instancia(INS.hierba, ox, oy, oz, eje, 0.07, rnd() * 6.3, [0.5, 0.82, 0.38]);
        const cf = [[1.0, 0.45, 0.05], [0.92, 0.12, 0.06], [1.0, 0.78, 0.1]][Math.floor(rnd() * 3)];
        for (let f = 0; f < 3; f++) { const fx = ox + dx * (0.06 + rnd() * 0.04) + (rnd() - 0.5) * 0.08, fy = oy + 0.03 + rnd() * 0.08, fz = oz + dz * (0.06 + rnd() * 0.04) + (rnd() - 0.5) * 0.08;
          instancia(INS.flor, fx, fy, fz, new THREE.Vector3(dx, 0.5, dz), 0.028, rnd() * 6.3, cf); FL.push({ x: fx, y: fy, z: fz, ox: dx, oz: dz, tipo: 'capuchina' }); }
      } else { // fresa: flores blancas (abejas) y frutos rojos colgando
        instancia(INS.hierba, ox, oy, oz, eje, 0.075, rnd() * 6.3, [0.36, 0.62, 0.28]);
        for (let f = 0; f < 2; f++) { const fx = ox + dx * 0.07 + (rnd() - 0.5) * 0.07, fy = oy + 0.04, fz = oz + dz * 0.07 + (rnd() - 0.5) * 0.07; instancia(INS.flor, fx, fy, fz, new THREE.Vector3(dx, 0.7, dz), 0.016, rnd() * 6.3, [1, 1, 0.96]); FL.push({ x: fx, y: fy, z: fz, ox: dx, oz: dz, tipo: 'fresa' }); }
        for (let f = 0; f < 2; f++) instancia(INS.fresa, ox + dx * (0.09 + rnd() * 0.04), oy - 0.06 - rnd() * 0.05, oz + dz * (0.09 + rnd() * 0.04), _Y, 0.014 + rnd() * 0.006, 0, rnd() < 0.7 ? [0.82, 0.06, 0.08] : [0.75, 0.82, 0.5]);
      }
    }
    instancia(INS.hoja, x, y + 0.44 + H + 0.02, z, _Y, 0.12, rnd() * 6.3, VERDES[0]); // corona
    // marco y lámpara LED
    const px = x - Math.cos(giro) * 0.2, pz = z - Math.sin(giro) * 0.2, ytop = y + 0.44 + H + 0.42;
    B.blanco.push(prep(new THREE.BoxGeometry(0.035, ytop - y - 0.44, 0.035).translate(px, (ytop + y + 0.44) / 2, pz), BL));
    const brazo = new THREE.BoxGeometry(0.035, 0.035, 0.24); brazo.lookAt(new THREE.Vector3(x - px, 0, z - pz)); brazo.translate((x + px) / 2, ytop, (z + pz) / 2); B.blanco.push(prep(brazo, BL));
    B.blanco.push(prep(new THREE.CylinderGeometry(0.15, 0.15, 0.05, 20).translate(x, ytop - 0.01, z), BL));
    B.led.push(prep(new THREE.CylinderGeometry(0.12, 0.12, 0.012, 20).translate(x, ytop - 0.04, z)));
  }

  /* ---------- POLINIZADORES: colibríes (Colibri coruscans, el más común en Bogotá) y abejas, que vuelan entre las flores ---------- */
  function crearPolinizadores(FL, centro) {
    if (!FL.length || LIV) return null;
    const G = new THREE.Group(); grupo.add(G);
    const geoCuerpo = (partes) => mergeGeometries(partes.map(([g, c]) => prep(g, c)));
    // colibrí (unos 13 cm): verde esmeralda iridiscente, parche violeta en la mejilla, pico largo negro, cola en abanico
    const VE = [0.06, 0.42, 0.22], VI = [0.32, 0.18, 0.62];
    const cuerpoC = geoCuerpo([
      [new THREE.SphereGeometry(1, 12, 8).scale(0.016, 0.015, 0.038), VE],
      [new THREE.SphereGeometry(0.013, 10, 8).translate(0, 0.008, 0.038), VE],
      [new THREE.SphereGeometry(0.006, 6, 4).translate(0.009, 0.01, 0.042), VI], [new THREE.SphereGeometry(0.006, 6, 4).translate(-0.009, 0.01, 0.042), VI],
      [new THREE.SphereGeometry(0.0022, 5, 4).translate(0.006, 0.013, 0.047), [0.02, 0.02, 0.02]], [new THREE.SphereGeometry(0.0022, 5, 4).translate(-0.006, 0.013, 0.047), [0.02, 0.02, 0.02]],
      [new THREE.CylinderGeometry(0.0006, 0.0018, 0.032, 6).rotateX(Math.PI / 2).translate(0, 0.006, 0.066), [0.03, 0.03, 0.03]], // pico
      [new THREE.ConeGeometry(0.014, 0.04, 6).scale(1, 1, 0.25).rotateX(-Math.PI / 2 - 0.25).translate(0, 0.002, -0.05), [0.08, 0.36, 0.3]], // cola
      [new THREE.SphereGeometry(1, 8, 6).scale(0.011, 0.008, 0.02).translate(0, -0.008, 0.012), [0.12, 0.5, 0.32]]]);
    const ala = (largo, ancho) => { const s = new THREE.Shape(); s.moveTo(0, 0); s.quadraticCurveTo(largo * 0.5, ancho, largo, ancho * 0.25); s.quadraticCurveTo(largo * 0.6, -ancho * 0.2, 0, 0); const g = new THREE.ShapeGeometry(s, 4); g.rotateX(-Math.PI / 2); return g; };
    const geoAlaC = ala(0.055, 0.02), geoAlaA = ala(0.011, 0.006);
    // abeja (unos 1,4 cm): franjas negras y amarillas, alas transparentes
    const cuerpoA = (() => { const o = prep(new THREE.SphereGeometry(1, 12, 8).scale(0.0045, 0.0042, 0.008)), p = o.attributes.position, c = o.attributes.color; // franjas negras y amarillas
      for (let i = 0; i < p.count; i++) { const z = p.getZ(i), f = Math.floor((z + 0.008) / 0.0028); const v = z > 0.005 ? [0.05, 0.04, 0.03] : f % 2 ? [0.85, 0.62, 0.08] : [0.06, 0.05, 0.04]; c.setXYZ(i, v[0], v[1], v[2]); }
      return o; })();
    const matC = new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.55, roughness: 0.3, envMap: env, envMapIntensity: 1.4 });
    const matA = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6 });
    const matAla = new THREE.MeshBasicMaterial({ color: 0x9aa4a8, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false });
    const especies = [
      { n: 24, cuerpo: cuerpoC, mat: matC, ala: geoAlaC, hombro: [0.012, 0.012, 0.012], esc: 1.25, vel: 7, aleteo: 48, gusta: 'capuchina', radio: 30, flota: [1.2, 3.5], lejos: 0.095 },
      { n: 90, cuerpo: cuerpoA, mat: matA, ala: geoAlaA, hombro: [0.003, 0.004, 0.002], esc: 2.0, vel: 2.6, aleteo: 230, gusta: 'fresa', radio: 6, flota: [1.5, 5], lejos: 0.025 } ];
    const E = especies.map(e => { const cu = new THREE.InstancedMesh(e.cuerpo, e.mat, e.n), aI = new THREE.InstancedMesh(e.ala, matAla, e.n), aD = new THREE.InstancedMesh(e.ala, matAla, e.n);
      for (const m of [cu, aI, aD]) { m.frustumCulled = false; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); G.add(m); }
      const A = []; for (let i = 0; i < e.n; i++) { const f = FL[Math.floor(Math.random() * FL.length)]; A.push({ p: new THREE.Vector3(f.x + f.ox * 3, f.y + 1, f.z + f.oz * 3), a: new THREE.Vector3(), c: new THREE.Vector3(), b: new THREE.Vector3(), t: 1, dur: 0, flor: f, hasta: 0, yaw: Math.random() * 6.3, fase: Math.random() * 100 }); }
      return { e, cu, aI, aD, A }; });
    const elegir = (e, desde) => { let mejor = null; for (let k = 0; k < 30; k++) { const f = FL[Math.floor(Math.random() * FL.length)], d = Math.hypot(f.x - desde.x, f.y - desde.y, f.z - desde.z); if (d > 0.15 && d < e.radio && (f.tipo === e.gusta || Math.random() < 0.35)) { mejor = f; break; } if (!mejor && d < e.radio * 2) mejor = f; } return mejor || FL[Math.floor(Math.random() * FL.length)]; };
    const M4 = new THREE.Matrix4(), MA = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S = new THREE.Vector3(), EU = new THREE.Euler(), O = new THREE.Vector3();
    let tPrev = performance.now();
    return { G, centro, E, actualizar(visible) {
      G.visible = visible; const ahora = performance.now(), dt = Math.min(0.05, (ahora - tPrev) / 1000), T = ahora / 1000; tPrev = ahora; if (!visible) return;
      for (const { e, cu, aI, aD, A } of E) {
        for (let i = 0; i < A.length; i++) { const s = A[i];
          const pf = O.set(s.flor.x + s.flor.ox * e.lejos, s.flor.y + 0.005, s.flor.z + s.flor.oz * e.lejos); // punto frente a la flor
          if (s.t < 1) { // vuelo en curva hacia la flor
            s.t = Math.min(1, s.t + dt / s.dur); const t = s.t, u = 1 - t, k = t * t * (3 - 2 * t);
            const nx = u * u * s.a.x + 2 * u * k * s.c.x + k * k * pf.x, ny = u * u * s.a.y + 2 * u * k * s.c.y + k * k * pf.y, nz = u * u * s.a.z + 2 * u * k * s.c.z + k * k * pf.z;
            if (Math.hypot(nx - s.p.x, nz - s.p.z) > 1e-5) s.yaw = Math.atan2(nx - s.p.x, nz - s.p.z);
            s.p.set(nx, ny, nz); if (s.t >= 1) s.hasta = T + e.flota[0] + Math.random() * (e.flota[1] - e.flota[0]);
          } else if (T < s.hasta) { // suspendido frente a la flor, con temblor de vuelo estacionario
            s.p.set(pf.x + Math.sin(T * 7 + s.fase) * 0.006 * e.esc, pf.y + Math.sin(T * 9 + s.fase) * 0.005 * e.esc, pf.z + Math.cos(T * 6 + s.fase) * 0.006 * e.esc);
            s.yaw = Math.atan2(-s.flor.ox, -s.flor.oz); // mirando la flor
          } else { // a la siguiente flor
            const f = elegir(e, s.p); s.a.copy(s.p); s.flor = f; const d = Math.hypot(f.x - s.p.x, f.y - s.p.y, f.z - s.p.z);
            s.c.set((s.p.x + f.x) / 2 + f.ox * Math.min(3, d * 0.3) + (Math.random() - 0.5) * d * 0.2, (s.p.y + f.y) / 2 + d * 0.15, (s.p.z + f.z) / 2 + f.oz * Math.min(3, d * 0.3) + (Math.random() - 0.5) * d * 0.2);
            s.dur = Math.max(0.4, d / e.vel); s.t = 0; }
          EU.set(s.t < 1 ? -0.25 : 0.15, s.yaw, 0); Q.setFromEuler(EU); M4.compose(s.p, Q, S.set(e.esc, e.esc, e.esc)); cu.setMatrixAt(i, M4);
          const flap = Math.sin(T * e.aleteo * 6.283 + s.fase) * 1.1;
          for (const [m, sd] of [[aI, 1], [aD, -1]]) { MA.makeRotationZ(sd * flap); MA.premultiply(new THREE.Matrix4().makeTranslation(sd * e.hombro[0], e.hombro[1], e.hombro[2])); if (sd < 0) MA.multiply(new THREE.Matrix4().makeScale(-1, 1, 1)); m.setMatrixAt(i, M4.clone().multiply(MA)); }
        }
        cu.instanceMatrix.needsUpdate = aI.instanceMatrix.needsUpdate = aD.instanceMatrix.needsUpdate = true;
      }
    } };
  }
  // cuadrilátero vertical de fachada con la celda (col, fila) del atlas
  const quad = (Pa, a, b, y0, y1, col, fila, u0 = 0, u1 = 1) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([a[0], y0, a[1], b[0], y0, b[1], b[0], y1, b[1], a[0], y0, a[1], b[0], y1, b[1], a[0], y1, a[1]], 3));
    const U0 = (col + 0.004 + u0 * 0.992) / 4, U1 = (col + 0.004 + u1 * 0.992) / 4, V0 = 1 - (fila + 1) / 3 + 0.002, V1 = 1 - fila / 3 - 0.002, vv = V0 + (V1 - V0) * Math.min(1, (y1 - y0) / PISO);
    g.setAttribute('uv', new THREE.Float32BufferAttribute([U0, V0, U1, V0, U1, vv, U0, V0, U1, vv, U0, vv], 2)); g.computeVertexNormals(); Pa.push(prep(g)); };

  const grupo = new THREE.Group(); grupo.name = 'torresBalcones'; T3.scene.add(grupo);
  const cercanas = [], CERCA = 360;
  const api = { grupo, torres: 0, balcones: 0 };
  const polinizadores = []; api.polinizadores = polinizadores;
  api.actualizar = (cam) => { for (const c of cercanas) { const v = Math.hypot(c.x - cam.position.x, c.z - cam.position.z, c.y - cam.position.y) < CERCA + 120; if (c.m.visible !== v) c.m.visible = v; }
    for (const P of polinizadores) P.actualizar(Math.hypot(P.centro.x - cam.position.x, P.centro.z - cam.position.z, P.centro.y - cam.position.y) < CERCA + 120); };

  api.agregar = (lista) => {
    const B = { fachada: [], concreto: [], baranda: [], partes: [], blanco: [], tanque: [], led: [] };
    const INS = { hoja: [], hierba: [], flor: [], fresa: [] }, FL = []; let sx = 0, sz = 0, sn = 0;
    for (const T of lista) {
      const W = T.W, n = W.length, y0 = T.y0, h = T.h, pisos = Math.max(1, Math.round((h - y0) / PISO)), hp = (h - y0) / pisos;
      let area = 0; for (let i = 0; i < n; i++) { const a = W[i], b = W[(i + 1) % n]; area += a[0] * b[1] - b[0] * a[1]; }
      const sgn = area > 0 ? 1 : -1; api.torres++;
      sem = 1 + (Math.abs(Math.round(W[0][0] * 31 + W[0][1] * 17)) % 2147483646);
      let Lm = 0, ax = 1, az = 0; for (let i = 0; i < n; i++) { const a = W[i], b = W[(i + 1) % n], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l > Lm) { Lm = l; ax = (b[0] - a[0]) / l; az = (b[1] - a[1]) / l; } }
      const PL = []; // plantas de esta torre (malla propia: solo se dibujan de cerca)
      let cx = 0, cz = 0; W.forEach(p => { cx += p[0]; cz += p[1]; }); cx /= n; cz /= n;
      for (let i = 0; i < n; i++) {
        const a = W[i], b = W[(i + 1) % n], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 0.05) continue;
        const ux = (b[0] - a[0]) / L, uz = (b[1] - a[1]) / L, nx = uz * sgn, nz = -ux * sgn; // normal hacia afuera
        const par = Math.abs(ux * ax + uz * az) > 0.7;
        // tramos del muro: [desde, hasta, fila del atlas, ¿balcón?]
        let tramos;
        if (!par && L >= 6) { const bw = Math.min(5.2, L - 3), m0 = (L - bw) / 2; tramos = [[0, m0, 0, false], [m0, m0 + bw, 2, true], [m0 + bw, L, 0, false]]; } // frente: ladrillo + columna central de balcones
        else if (par && L >= 8) tramos = [[0, L, 0, false]]; // costado de ladrillo
        else if (par && L >= 3.8) tramos = [[0, L, 2, true]]; // retroceso con balcones
        else tramos = [[0, L, 1, false]]; // panel gris
        for (const [t0, t1, fila, balcon] of tramos) {
          const lt = t1 - t0, bays = Math.max(1, Math.round(lt / 3)), bw = lt / bays;
          for (let k = 0; k < bays; k++) {
            const s0 = t0 + k * bw, s1 = s0 + bw, A = [a[0] + ux * s0, a[1] + uz * s0], Bq = [a[0] + ux * s1, a[1] + uz * s1];
            for (let f = 0; f < pisos; f++) {
              const r0 = rnd(), v = bw < 1.8 ? 3 : r0 < 0.5 ? 0 : r0 < 0.58 ? 1 : 2; // tramos angostos: sin ventana; pocas cortinas fucsia, como en la foto
              quad(B.fachada, A, Bq, y0 + f * hp, y0 + (f + 1) * hp, bw < 1.8 && fila !== 2 ? 3 : (fila === 2 ? Math.min(v, 2) : v), fila, Math.max(0, 0.5 - bw / 6), Math.min(1, 0.5 + bw / 6));
            }
          }
          if (!balcon) continue;
          // columna de balcones curvos (del piso 2 al último) con su huerta
          const w = lt - 0.3, mid = (t0 + t1) / 2, ox = a[0] + ux * mid, oz = a[1] + uz * mid, D = 1.15, C = 0.38;
          const P2W = (t, d) => [ox + ux * t + nx * d, oz + uz * t + nz * d]; // (a lo largo, hacia afuera) -> mundo
          const borde = []; const NP = 14; // borde exterior de la losa: lados rectos + frente curvo
          borde.push([-w / 2, 0.02]); for (let k = 0; k <= NP; k++) { const t = -w / 2 + w * k / NP, s = 1 - (2 * t / w) ** 2; borde.push([t, D + C * s]); } borde.push([w / 2, 0.02]);
          for (let f = 1; f < pisos; f++) {
            const yb = y0 + f * hp; api.balcones++;
            // losa curva (con canto)
            const sh = new THREE.Shape(borde.map(([t, d]) => new THREE.Vector2(t, d)));
            const gl = new THREE.ExtrudeGeometry(sh, { depth: 0.18, bevelEnabled: false, curveSegments: 1 }); gl.rotateX(Math.PI / 2); // (t, d) -> (x = t, z = d), espesor hacia abajo
            gl.applyMatrix4(new THREE.Matrix4().set(ux, 0, nx, ox, 0, 1, 0, yb, uz, 0, nz, oz, 0, 0, 0, 1));
            B.concreto.push(prep(gl, [0.42, 0.44, 0.47]));
            // baranda de barrotes por el borde, con pasamanos
            const camino = borde.slice(1, -1), Pb = [], Ub = []; let s = 0;
            const lados = [[[-w / 2, 0.05], camino[0]], ...camino.slice(0, -1).map((p, k) => [p, camino[k + 1]]), [camino[camino.length - 1], [w / 2, 0.05]]];
            for (const [p, q] of lados) { const pw = P2W(p[0], p[1]), qw = P2W(q[0], q[1]), l = Math.hypot(q[0] - p[0], q[1] - p[1]);
              Pb.push(pw[0], yb, pw[1], qw[0], yb, qw[1], qw[0], yb + 1.05, qw[1], pw[0], yb, pw[1], qw[0], yb + 1.05, qw[1], pw[0], yb + 1.05, pw[1]);
              Ub.push(s / 0.5, 0, (s + l) / 0.5, 0, (s + l) / 0.5, 1, s / 0.5, 0, (s + l) / 0.5, 1, s / 0.5, 1); s += l;
              const gp = new THREE.BoxGeometry(0.05, 0.05, l + 0.04); gp.lookAt(new THREE.Vector3(qw[0] - pw[0], 0, qw[1] - pw[1])); gp.translate((pw[0] + qw[0]) / 2, yb + 1.06, (pw[1] + qw[1]) / 2); B.partes.push(prep(gp, [0.14, 0.15, 0.16])); }
            const gb = new THREE.BufferGeometry(); gb.setAttribute('position', new THREE.Float32BufferAttribute(Pb, 3)); gb.setAttribute('uv', new THREE.Float32BufferAttribute(Ub, 2)); gb.computeVertexNormals(); B.baranda.push(prep(gb));
            // CULTIVO HIDROPÓNICO DEL BALCÓN: solo torres hidropónicas (dos; una en los balcones angostos), sobre la losa frente a la puerta-ventana
            const posT = w >= 2.6 ? [-w * 0.22, w * 0.22] : [0];
            for (const t of posT) { const q = P2W(t, 0.85); torreHidro(B, INS, FL, q[0], yb, q[1], Math.atan2(nz, nx)); api.hidro = (api.hidro || 0) + 1; }
          }
        }
      }
      // cubierta y cara interior del antepecho (la huerta de la terraza la pone huertas_techo.js)
      let tri = []; try { tri = THREE.ShapeUtils.triangulateShape(W.map(q => new THREE.Vector2(q[0], q[1])), []); } catch (e) {}
      if (tri.length) { const P = []; for (const t of tri) for (const k of (sgn > 0 ? [t[0], t[2], t[1]] : t)) P.push(W[k][0], h - 0.45, W[k][1]); const gr = new THREE.BufferGeometry(); gr.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); gr.computeVertexNormals(); B.concreto.push(prep(gr, [0.55, 0.55, 0.56])); }
      for (let i = 0; i < n; i++) { const a = W[i], b = W[(i + 1) % n], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 0.05) continue; const ux = (b[0] - a[0]) / L, uz = (b[1] - a[1]) / L, ix = -uz * sgn * 0.2, iz = ux * sgn * 0.2;
        const g = new THREE.BufferGeometry(); const A = [a[0] + ix, a[1] + iz], Bq = [b[0] + ix, b[1] + iz];
        g.setAttribute('position', new THREE.Float32BufferAttribute([A[0], h - 0.45, A[1], A[0], h, A[1], Bq[0], h, Bq[1], A[0], h - 0.45, A[1], Bq[0], h, Bq[1], Bq[0], h - 0.45, Bq[1], A[0], h, A[1], a[0], h, a[1], b[0], h, b[1], A[0], h, A[1], b[0], h, b[1], Bq[0], h, Bq[1]], 3)); g.computeVertexNormals(); B.concreto.push(prep(g, [0.62, 0.62, 0.62])); }
      if (PL.length && !LIV) { const m = new THREE.Mesh(mergeGeometries(PL), M.plantas); m.visible = false; m.receiveShadow = true; grupo.add(m); cercanas.push({ m, x: cx, y: h / 2, z: cz }); }
    }
    for (const [k, L] of Object.entries(B)) { if (!L.length) continue; const m = new THREE.Mesh(mergeGeometries(L), M[k]); m.castShadow = !LIV; m.receiveShadow = !LIV; grupo.add(m); }
    // plantas de las torres hidropónicas (instanciadas): se dibujan con la cámara cerca del conjunto
    for (const T of lista) for (const p of T.W) { sx += p[0]; sz += p[1]; sn++; }
    const centro = new THREE.Vector3(sx / sn, 15, sz / sn);
    if (!LIV) for (const [k, L] of Object.entries(INS)) { if (!L.length) continue;
      const geo = k === 'hoja' ? GEO_LECHUGA : k === 'hierba' ? GEO_HIERBA : k === 'flor' ? GEO_FLOR : GEO_FRESA, mat = k === 'flor' ? MH.flor : k === 'fresa' ? MH.fresa : MH.hoja;
      const m = new THREE.InstancedMesh(geo, mat, L.length), col = new THREE.Color();
      L.forEach((it, i) => { m.setMatrixAt(i, it.m); m.setColorAt(i, col.setRGB(it.c[0], it.c[1], it.c[2], THREE.SRGBColorSpace)); });
      m.instanceMatrix.needsUpdate = true; m.instanceColor.needsUpdate = true; m.frustumCulled = false; m.receiveShadow = true; m.visible = false; grupo.add(m);
      cercanas.push({ m, x: centro.x, y: centro.y, z: centro.z }); }
    api.plantas = Object.values(INS).reduce((a, L) => a + L.length, 0); api.flores = FL.length;
    const POL = crearPolinizadores(FL, centro); if (POL) { polinizadores.push(POL); api.colibries = 24; api.abejas = 90; }
  };
  return api;
}
