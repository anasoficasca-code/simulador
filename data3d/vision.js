/* ============ VISIÓN (modo Kennedy) ============
   Vista nocturna de la propuesta, al estilo de los renders conceptuales: el territorio oscuro (foto y edificios apagados, con un
   contorno blanco tenue) y encendido solo lo que se propone:
   01 Bavaria Común · Instituto Biotecnológico: hub de conocimiento, educación e innovación agroecológica y de producción de alimentos
      (edificios encendidos, líneas de luz en el suelo, pabellones efímeros y red entre sus edificios)
   02 Corabastos · transformación morfológica y de dinámicas de borde
   03 Red de huertas: cubiertas y balcones de vivienda en altura (luces de colores) y parques con estructuras efímeras de cultivo
   04 Bordes de humedal La Vaca y El Burro: matriz vegetal nativa
   Todo unido en una red densa: Bavaria ↔ Corabastos, Bavaria → parques → huertas → tiendas de barrio → Corabastos, humedales ↔ parques.
   Se arma la primera vez que se prende (no pesa en la carga inicial) y al apagarlo todo vuelve como estaba. */
export async function crearVision({ THREE, T3, lw, OX, OZ, movil = false }) {
  const J = (u) => (window.cargarJSON || ((x) => fetch(x).then(r => r.json())))(u);
  const [BV, CO, ES, PQ, GS] = await Promise.all(['data3d/bavaria.json?v=3', 'data3d/corabastos.json?v=3', 'data3d/estrategias.json?v=5', 'data3d/parques.json', 'data3d/giro_sim.json'].map(u => J(u).catch(() => null)));
  const grupo = new THREE.Group(); grupo.name = 'vision'; grupo.visible = false; T3.scene.add(grupo);
  let sem = 2040; const rnd = () => ((sem = (sem * 16807) % 2147483647) / 2147483647);
  const C = (h) => new THREE.Color(h);
  const COL = { bav: C('#ffd36b'), bav2: C('#fff1d6'), cora: C('#ff7a3d'), huerta: C('#ff6fae'), parque: C('#f7b6d2'), tienda: C('#ff9f5a'), humedal: C('#c9a7ff'), roof: C('#2ee59d') };
  const cent = (W) => { let x = 0, z = 0; for (const q of W) { x += q[0]; z += q[1]; } return [x / W.length, z / W.length]; };
  const area = (W) => { let a = 0; for (let i = 0; i < W.length; i++) { const p = W[i], q = W[(i + 1) % W.length]; a += p[0] * q[1] - q[0] * p[1]; } return Math.abs(a) / 2; };
  const dentro = (W, x, z) => { let c = false; for (let i = 0, j = W.length - 1; i < W.length; j = i++) { const a = W[i], b = W[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
  const aditivo = (o = {}) => ({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, ...o });

  /* ---------- lugares ---------- */
  const bavSitio = BV ? BV.sitio.map(p => lw(p[0], p[1])) : [];
  const bavEdif = BV ? BV.edif.map(e => { const W = e.p.map(p => lw(p[0], p[1])); return { W, c: cent(W), h: e.h, a: area(W) }; }) : [];
  const hub = bavEdif.length ? bavEdif.reduce((a, b) => (b.a > a.a ? b : a)).c : [3900, 150];
  const coraC = CO ? cent(CO.naves.map(n => lw(n.c[0], n.c[1]))) : [860, 810];
  const coraPoly = CO && CO.poly ? CO.poly.map(p => lw(p[0], p[1])) : null;
  const esc = (ES && ES.escala) || 0.5, W2 = (flat) => { const n = flat.length / 2, W = []; for (let k = 0; k < n; k++) W.push(lw(flat[k * 2] * esc, flat[k * 2 + 1] * esc)); return W; };
  const E8 = ES && ES.estrategias.find(e => e.id === 'E8'), E2 = ES && ES.estrategias.find(e => e.id === 'E2');
  const techos = [];
  if (E8) for (const c of E8.capas) for (const t of (c.techos || [])) techos.push({ W: W2(t.slice(0, -1)), h: t[t.length - 1] / 10, alta: /cubiertas/i.test(c.n) });
  const tiendas = []; if (E2) for (const c of E2.capas) for (const q of (c.puntos || [])) tiendas.push(lw(q[0] * esc, q[1] * esc));
  const humedales = GS ? GS.humedales.map(h => ({ n: h.n, W: h.poly.map(p => [p[0] + OX, p[1] + OZ]) })) : [];
  const parques = (PQ || []).map(p => { const W = p.pts.map(q => lw(q[0], q[1])); return { n: p.nombre, W, a: area(W), c: cent(W) }; })
    .filter(p => p.a > 9000 && dentro(p.W, p.c[0], p.c[1])).sort((a, b) => b.a - a.a).slice(0, movil ? 14 : 30);

  /* ---------- 01 Bavaria Común: piso de luz, pabellones efímeros ---------- */
  if (bavSitio.length) {
    // relleno violeta tenue del predio y líneas de luz onduladas en el suelo (como los renders de referencia)
    const sh = new THREE.Shape(bavSitio.map(q => new THREE.Vector2(q[0], -q[1])));
    const piso = new THREE.Mesh(new THREE.ShapeGeometry(sh).rotateX(-Math.PI / 2).translate(0, 0.5, 0), new THREE.MeshBasicMaterial(aditivo({ color: 0x5a2fb8, opacity: 0.22, side: THREE.DoubleSide })));
    grupo.add(piso);
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const q of bavSitio) { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); z0 = Math.min(z0, q[1]); z1 = Math.max(z1, q[1]); }
    const L = [];
    for (let k = 0; k < 46; k++) {
      const base = z0 + (k + 0.5) * (z1 - z0) / 46, amp = 6 + rnd() * 14, f = 0.006 + rnd() * 0.01, ph = rnd() * 6;
      let prev = null;
      for (let x = x0; x <= x1; x += 4) {
        const z = base + Math.sin(x * f + ph) * amp + Math.sin(x * f * 2.7 + ph * 2) * amp * 0.35, ok = dentro(bavSitio, x, z) && !bavEdif.some(e => dentro(e.W, x, z));
        if (ok && prev) L.push(prev[0], 0.7, prev[1], x, 0.7, z);
        prev = ok ? [x, z] : null;
      }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(L, 3));
    grupo.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial(aditivo({ color: 0xe9e4ff, opacity: 0.32 }))));
  }
  // pabellón efímero: cubierta ondulada de retícula de luz sobre columnas delgadas, con camas de cultivo encendidas debajo
  const pabellon = (cx, cz, ancho, largo, rot, alto, colA, conCamas) => {
    const pg = new THREE.PlaneGeometry(ancho, largo, 18, 12).rotateX(-Math.PI / 2), p = pg.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setY(i, alto + Math.sin(x / ancho * 5 + rot) * 1.6 + Math.cos(z / largo * 4) * 1.2 - (Math.abs(x) / ancho + Math.abs(z) / largo) * 1.5); }
    pg.rotateY(rot).translate(cx, 0, cz);
    const gr = new THREE.Group();
    gr.add(new THREE.Mesh(pg, new THREE.MeshBasicMaterial(aditivo({ color: colA, opacity: 0.12, side: THREE.DoubleSide }))));
    gr.add(new THREE.LineSegments(new THREE.WireframeGeometry(pg), new THREE.LineBasicMaterial(aditivo({ color: 0xf2eeff, opacity: 0.3 }))));
    const L = [], cs = Math.cos(rot), sn = Math.sin(rot), loc = (u, v) => [cx + u * cs + v * sn, cz - u * sn + v * cs];
    for (const [u, v] of [[-0.4, -0.4], [0.4, -0.4], [-0.4, 0.4], [0.4, 0.4], [0, 0]]) { const q = loc(u * ancho, v * largo); L.push(q[0], 0, q[1], q[0], alto - 1, q[1]); }
    if (conCamas) for (let k = -3; k <= 3; k++) { const a = loc(-ancho * 0.38, k * largo / 8), b = loc(ancho * 0.38, k * largo / 8); L.push(a[0], 0.9, a[1], b[0], 0.9, b[1]); }
    const gl = new THREE.BufferGeometry(); gl.setAttribute('position', new THREE.Float32BufferAttribute(L, 3));
    gr.add(new THREE.LineSegments(gl, new THREE.LineBasicMaterial(aditivo({ color: conCamas ? 0x3dffb0 : 0xffffff, opacity: 0.85 }))));
    grupo.add(gr);
  };
  if (BV && BV.zonas) for (const z of Object.values(BV.zonas)) { const W = z.map(p => lw(p[0], p[1])), c = cent(W), s = Math.sqrt(area(W)); pabellon(c[0], c[1], Math.min(60, s * 0.9), Math.min(45, s * 0.7), rnd() * 3, 9, 0x9b7bff, true); }
  // 03 parques grandes: estructuras efímeras de cultivo
  for (const p of parques) { const s = Math.max(18, Math.min(48, Math.sqrt(p.a) * 0.32)); pabellon(p.c[0], p.c[1], s, s * 0.7, rnd() * 3, 7, 0x22d3a6, true); }

  /* ---------- 03 cubiertas con huerta (verde encendido) y balcones con luces de colores ---------- */
  {
    const P = [], I = [], L = [], B = [], BC = []; let vc = 0;
    const NEON = ['#ff4fd8', '#3dffb0', '#ffd166', '#6ee7ff', '#b18cff', '#7cff6b'].map(C);
    const lista = techos.filter(t => t.alta || t.h >= 7), paso = Math.max(1, Math.ceil(lista.length / (movil ? 5000 : 16000)));
    for (let i = 0; i < lista.length; i += paso) {
      const t = lista[i], W = t.W, y = t.h + 0.6; if (W.length < 3) continue;
      let tri = []; try { tri = THREE.ShapeUtils.triangulateShape(W.map(q => new THREE.Vector2(q[0], q[1])), []); } catch (e) { continue; }
      const b = vc; for (const q of W) { P.push(q[0], y, q[1]); vc++; } for (const tt of tri) I.push(b + tt[0], b + tt[1], b + tt[2]);
      for (let k = 0; k < W.length; k++) { const a = W[k], d = W[(k + 1) % W.length]; L.push(a[0], y + 0.1, a[1], d[0], y + 0.1, d[1]); }
      if (t.h >= 11 && B.length < (movil ? 60000 : 240000)) { // balcones: luces por piso a lo largo de las fachadas
        for (let k = 0; k < W.length; k++) {
          const a = W[k], d = W[(k + 1) % W.length], len = Math.hypot(d[0] - a[0], d[1] - a[1]); if (len < 6) continue;
          for (let s = 2; s < len - 1; s += 3.2) for (let yy = 4; yy < t.h - 1; yy += 2.9) {
            if (rnd() > 0.38) continue;
            const f = s / len; B.push(a[0] + (d[0] - a[0]) * f, yy, a[1] + (d[1] - a[1]) * f); const c = NEON[Math.floor(rnd() * NEON.length)]; BC.push(c.r, c.g, c.b);
          }
        }
      }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I);
    grupo.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial(aditivo({ color: 0x1fcf86, opacity: 0.32, side: THREE.DoubleSide }))));
    const gl = new THREE.BufferGeometry(); gl.setAttribute('position', new THREE.Float32BufferAttribute(L, 3));
    grupo.add(new THREE.LineSegments(gl, new THREE.LineBasicMaterial(aditivo({ color: 0x9dffd8, opacity: 0.4 }))));
    const gb = new THREE.BufferGeometry(); gb.setAttribute('position', new THREE.Float32BufferAttribute(B, 3)); gb.setAttribute('color', new THREE.Float32BufferAttribute(BC, 3));
    grupo.add(new THREE.Points(gb, new THREE.PointsMaterial(aditivo({ size: 1.2, vertexColors: true, opacity: 0.85 }))));
  }

  /* ---------- 02 Corabastos y 04 humedales: bordes de luz ---------- */
  const borde = (W, col, y, anchos) => { const L = []; for (const o of anchos) { const c = cent(W); for (let k = 0; k < W.length; k++) { const a = W[k], d = W[(k + 1) % W.length], s = (p) => [c[0] + (p[0] - c[0]) * o, c[1] + (p[1] - c[1]) * o]; const A = s(a), D = s(d); L.push(A[0], y, A[1], D[0], y, D[1]); } } const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(L, 3)); grupo.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial(aditivo({ color: col, opacity: 0.55 })))); };
  if (coraPoly) borde(coraPoly, 0xff6fae, 1.2, [1, 0.985, 0.97, 1.02]);
  for (const h of humedales) borde(h.W, 0x38bdf8, 1.0, [1, 1.03, 1.06, 1.1]);

  /* ---------- red densa: arcos con pulsos de luz ---------- */
  const arcos = []; // [a, b, color, intensidad]
  const cerca = (p, L, k) => L.map(q => [q, (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2]).sort((a, b) => a[1] - b[1]).slice(0, k).map(x => x[0]);
  const nodosT = []; { const lista = techos.filter(t => t.alta), paso = Math.max(1, Math.floor(lista.length / (movil ? 220 : 520))); for (let i = 0; i < lista.length; i += paso) nodosT.push([...cent(lista[i].W), lista[i].h]); }
  const nodosP = parques.map(p => [p.c[0], p.c[1], 8]);
  const nodosB = bavEdif.map(e => [e.c[0], e.c[1], e.h]);
  const nodosW = humedales.map(h => [...cent(h.W), 2]);
  const nodoC = [coraC[0], coraC[1], 12], nodoH = [hub[0], hub[1], 20];
  for (const b of nodosB) { for (const q of cerca(b, nodosB, 4).slice(1)) arcos.push([b, q, COL.bav2, 0.8]); arcos.push([b, nodoH, COL.bav, 0.9]); } // dentro de Bavaria Común
  for (let k = 0; k < 7; k++) arcos.push([[hub[0] + (rnd() - 0.5) * 120, hub[1] + (rnd() - 0.5) * 120, 20], [coraC[0] + (rnd() - 0.5) * 160, coraC[1] + (rnd() - 0.5) * 120, 12], COL.cora, 1]); // Bavaria ↔ Corabastos
  for (const p of nodosP) { arcos.push([nodoH, p, COL.bav, 0.75]); for (const t of cerca(p, nodosT, 6)) arcos.push([p, t, COL.huerta, 0.55]); } // bioinsumos y conocimiento: hub → parques → huertas
  for (const t of nodosT) { for (const q of cerca(t, nodosT, 2).slice(1)) arcos.push([t, q, COL.roof, 0.3]); const s = cerca(t, tiendas.map(q => [q[0], q[1], 3]), 1)[0]; if (s) arcos.push([t, s, COL.tienda, 0.4]); }
  for (let i = 0; i < nodosT.length; i += 14) arcos.push([nodoH, nodosT[i], COL.bav, 0.4]);
  for (let i = 0; i < tiendas.length; i += 10) arcos.push([[tiendas[i][0], tiendas[i][1], 3], nodoC, COL.tienda, 0.3]); // comercio barrial ↔ Corabastos (menos fletes)
  for (const w of nodosW) { for (const p of cerca(w, nodosP, 4)) arcos.push([w, p, COL.humedal, 0.7]); arcos.push([w, nodoH, COL.humedal, 0.7]); arcos.push([w, nodoC, COL.humedal, 0.6]); }
  const SEG = 14, pos = [], col = [], curvas = [];
  for (const [a, b, c, k] of arcos) {
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]); if (d < 2) continue;
    const h = Math.min(170, 6 + d * 0.11), P = [];
    for (let s = 0; s <= SEG; s++) { const u = s / SEG; P.push([a[0] + (b[0] - a[0]) * u, a[2] + (b[2] - a[2]) * u + Math.sin(Math.PI * u) * h, a[1] + (b[1] - a[1]) * u]); }
    for (let s = 0; s < SEG; s++) { pos.push(...P[s], ...P[s + 1]); for (let j = 0; j < 2; j++) { const f = k * (0.12 + 0.88 * Math.pow(Math.sin(Math.PI * (s + j) / SEG), 1.6)); col.push(c.r * f, c.g * f, c.b * f); } } // hilo fino: se desvanece en las puntas
    curvas.push({ P, c, k });
  }
  const gR = new THREE.BufferGeometry(); gR.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); gR.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  const web = (() => { // cada nodo con sus 5 vecinos más cercanos, arcos casi rasantes, hilo muy tenue
    const N = [...nodosT, ...nodosP, ...nodosB, ...nodosW, ...tiendas.filter((_, i) => i % 3 === 0).map(q => [q[0], q[1], 3])], L = [], C2 = [];
    const cw = [C('#f7c6d9'), C('#ffb38a'), C('#ffe2a8')];
    for (let i = 0; i < N.length; i++) for (const q of cerca(N[i], N, 6).slice(1)) { const a = N[i], d = Math.hypot(q[0] - a[0], q[1] - a[1]), hh = 3 + d * 0.05, c = cw[i % 3]; let p0 = [a[0], a[2], a[1]];
      for (let s = 1; s <= 6; s++) { const u = s / 6, p1 = [a[0] + (q[0] - a[0]) * u, a[2] + (q[2] - a[2]) * u + Math.sin(Math.PI * u) * hh, a[1] + (q[1] - a[1]) * u]; L.push(...p0, ...p1); C2.push(c.r * 0.18, c.g * 0.18, c.b * 0.18, c.r * 0.18, c.g * 0.18, c.b * 0.18); p0 = p1; } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(L, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C2, 3));
    const m = new THREE.LineSegments(g, new THREE.LineBasicMaterial(aditivo({ vertexColors: true, opacity: 1 }))); m.frustumCulled = false; grupo.add(m);
    const gn = new THREE.BufferGeometry(); gn.setAttribute('position', new THREE.Float32BufferAttribute(N.flatMap(q => [q[0], q[2] + 0.5, q[1]]), 3));
    const pn = new THREE.Points(gn, new THREE.PointsMaterial(aditivo({ color: 0xfff2e8, size: 2.2, sizeAttenuation: false, opacity: 0.9 }))); pn.frustumCulled = false; grupo.add(pn);
    return [m, pn];
  })();
  const polvo = (() => { // luciérnagas amarillas sobre todo el territorio (más densas en parques, huertas y Bavaria)
    const P = [], semP = [...nodosT, ...nodosP, ...nodosB]; for (let i = 0; i < (movil ? 6000 : 22000); i++) { const b = semP[Math.floor(rnd() * semP.length)], r = 20 + rnd() * 140, a = rnd() * 6.28; P.push(b[0] + Math.cos(a) * r, 2 + rnd() * rnd() * 70, b[1] + Math.sin(a) * r); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    const m = new THREE.Points(g, new THREE.PointsMaterial(aditivo({ color: 0xe8ff6a, size: 1.6, sizeAttenuation: false, opacity: 0.85 }))); m.frustumCulled = false; grupo.add(m); return m;
  })();
  const red = new THREE.LineSegments(gR, new THREE.LineBasicMaterial(aditivo({ vertexColors: true, opacity: 0.42 }))); red.frustumCulled = false; grupo.add(red);
  const NP = Math.min(curvas.length, movil ? 700 : 1800), pp = new Float32Array(NP * 3), pc = new Float32Array(NP * 3), gP = new THREE.BufferGeometry();
  gP.setAttribute('position', new THREE.BufferAttribute(pp, 3)); gP.setAttribute('color', new THREE.BufferAttribute(pc, 3));
  const pulsos = new THREE.Points(gP, new THREE.PointsMaterial(aditivo({ size: 2.4, vertexColors: true, opacity: 0.95 }))); pulsos.frustumCulled = false; grupo.add(pulsos);
  const elegidas = []; for (let i = 0; i < NP; i++) { const cv = curvas[Math.floor(i * curvas.length / NP)]; elegidas.push({ cv, f: rnd(), v: 0.12 + rnd() * 0.15 }); pc.set([cv.c.r, cv.c.g, cv.c.b], i * 3); }
  // luciérnagas: brillos verdes y lilas sobre Bavaria Común y los parques
  { const F = [], FC = [], zonas = [bavSitio, ...parques.map(p => p.W)].filter(W => W.length);
    for (const W of zonas) { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const q of W) { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); z0 = Math.min(z0, q[1]); z1 = Math.max(z1, q[1]); }
      const n = W === bavSitio ? (movil ? 1500 : 5000) : 160; for (let k = 0, t = 0; k < n && t < n * 4; t++) { const x = x0 + rnd() * (x1 - x0), z = z0 + rnd() * (z1 - z0); if (!dentro(W, x, z)) continue; F.push(x, 1 + rnd() * 22, z); const c = rnd() < 0.6 ? COL.huerta : COL.bav; FC.push(c.r, c.g, c.b); k++; } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(F, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(FC, 3));
    var brillos = new THREE.Points(g, new THREE.PointsMaterial(aditivo({ size: 1.3, vertexColors: true, opacity: 0.8 }))); grupo.add(brillos); }

  /* ---------- etiquetas numeradas y panel de objetivos ---------- */
  const css = document.createElement('style'); css.textContent = `
.vi-et{position:fixed;z-index:9;transform:translate(-50%,-100%);display:none;pointer-events:none;font:600 11px system-ui,-apple-system,"Segoe UI",sans-serif;color:#eef2ff;text-align:center;max-width:230px}
.vi-et .n{display:inline-grid;place-items:center;width:24px;height:24px;border-radius:50%;border:1px solid var(--c);background:rgba(6,6,20,.7);color:#fff;font:600 10px/1 system-ui;letter-spacing:.05em;box-shadow:0 0 10px color-mix(in srgb,var(--c) 60%,transparent)}
.vi-et b{display:block;margin-top:6px;font-size:10px;font-weight:600;letter-spacing:.32em;text-transform:uppercase;color:#fff;text-shadow:0 0 8px var(--c)}
.vi-et small{display:block;margin-top:3px;font-weight:400;font-size:10px;color:#aeb3d6;line-height:1.35}
.vi-et::after{content:'';display:block;width:1px;height:60px;margin:6px auto 0;background:linear-gradient(var(--c),transparent);opacity:.7}
#vi-panel{position:fixed;z-index:12;right:14px;top:14px;width:min(360px,calc(100vw - 28px));max-height:calc(100vh - 28px);overflow:auto;display:none;padding:18px 18px 14px;border-radius:14px;background:rgba(9,8,28,.82);border:1px solid rgba(185,167,255,.28);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);color:#e8e9ff;font:13px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}
#vi-panel h2{margin:0;font-size:12px;letter-spacing:.42em;text-transform:uppercase;color:#b9a7ff;font-weight:600}
#vi-panel h3{margin:4px 0 10px;font-size:22px;letter-spacing:.3em;text-transform:uppercase;font-weight:800;color:#fff}
#vi-panel p{margin:0 0 12px;color:#c4c6e6;font-size:12.5px}
#vi-panel ol{list-style:none;margin:0;padding:0;display:grid;gap:10px}
#vi-panel li{display:grid;grid-template-columns:30px 1fr;gap:10px;align-items:start}
#vi-panel li i{display:grid;place-items:center;width:26px;height:26px;border-radius:50%;border:1.5px solid var(--c);font:800 12px system-ui;font-style:normal;box-shadow:0 0 12px var(--c)}
#vi-panel li b{display:block;color:#fff;font-size:12.5px}#vi-panel li span{color:#b8bbdc;font-size:12px}
#vi-panel .ley{display:flex;flex-wrap:wrap;gap:6px 12px;margin-top:12px;padding-top:10px;border-top:1px solid rgba(185,167,255,.2);font-size:11px;color:#c4c6e6}
#vi-panel .ley span{display:inline-flex;align-items:center;gap:6px}#vi-panel .ley em{width:14px;height:3px;border-radius:2px;background:var(--c);box-shadow:0 0 6px var(--c)}
#vi-panel .x{position:absolute;right:10px;top:10px;width:28px;height:28px;border-radius:8px;border:1px solid rgba(185,167,255,.3);background:none;color:#c4c6e6;cursor:pointer}
body.vision #gs-der,body.vision #hid-red,body.vision .es-et,body.vision #bt-pan,body.vision #bt-ficha,body.vision #bt-tog,body.vision #bt-red{display:none!important}
@media(max-width:760px){#vi-panel{top:auto;bottom:10px;right:10px;left:10px;width:auto;max-height:42vh}.vi-et small{display:none}}`;
  document.head.appendChild(css);
  const ETQ = [
    { n: '01', c: '#b9a7ff', t: 'Bavaria Común', s: 'Hub de conocimiento, educación e innovación agroecológica y de producción de alimentos', p: [hub[0], 60, hub[1]] },
    { n: '02', c: '#ff6fae', t: 'Corabastos', s: 'Transformación morfológica y de dinámicas de borde', p: [coraC[0], 40, coraC[1]] },
    { n: '03', c: '#3dffb0', t: 'Red de huertas', s: 'Cubiertas, balcones y parques productivos conectados con las tiendas de barrio', p: nodosT.length ? [nodosT[Math.floor(nodosT.length / 2)][0], 70, nodosT[Math.floor(nodosT.length / 2)][1]] : [2000, 70, 0] },
    ...humedales.filter(h => /Burro|Vaca/.test(h.n)).map(h => ({ n: '04', c: '#38bdf8', t: h.n.replace('Humedal ', 'Humedal '), s: 'Borde restaurado con matriz vegetal nativa', p: [cent(h.W)[0], 30, cent(h.W)[1]] }))
  ].map(e => { const d = document.createElement('div'); d.className = 'vi-et'; d.style.setProperty('--c', e.c); d.innerHTML = `<span class="n">${e.n}</span><b>${e.t}</b><small>${e.s}</small>`; document.body.appendChild(d); return { ...e, d, v: new THREE.Vector3(...e.p) }; });
  const panel = document.createElement('div'); panel.id = 'vi-panel';
  panel.innerHTML = `<button class="x" aria-label="Ocultar">✕</button><h2>Visión</h2><h3>Bavaria Común</h3>
<p>El Bosque Bavaria no como parque estático ni centro de acopio, sino como el <b>Instituto Biotecnológico de Bavaria Común</b>: nodo de gobernanza comunitaria que emite conocimiento y bioinsumos (humus e inoculantes fúngicos) hacia una red descentralizada de huertas en viviendas, cubiertas y comercios, que reduce la presión logística sobre Corabastos y transforma el metabolismo de Kennedy.</p>
<ol>
<li style="--c:#b9a7ff"><i>01</i><div><b>Instituto Biotecnológico como hub de conocimiento</b><span>Formación e investigación en compostaje acelerado e inoculación de hongos, sin centralizar el acopio de alimentos.</span></div></li>
<li style="--c:#3dffb0"><i>02</i><div><b>Producción descentralizada y comercio barrial</b><span>Cultivo en viviendas y cubiertas; excedentes hacia las tiendas de barrio para depender menos de Corabastos y de los fletes.</span></div></li>
<li style="--c:#38bdf8"><i>03</i><div><b>Conectividad ecosistémica en los bordes de humedal</b><span>Matriz vegetal nativa en La Vaca y El Burro para mitigar el parasitismo del Chamón sobre el Cucarachero y eliminar trampas ecológicas.</span></div></li>
<li style="--c:#ffd166"><i>04</i><div><b>Incentivos sociales y gamificación</b><span>Incentivos no monetarios para la participación ciudadana y la adopción de las acciones de mayor impacto.</span></div></li>
</ol>
<button id="vi-redes" class="on" style="margin:12px 0 0;width:100%;height:34px;border-radius:9px;border:1px solid rgba(255,180,140,.45);background:rgba(255,140,90,.14);color:#ffe2cc;font:600 11px system-ui;letter-spacing:.2em;text-transform:uppercase;cursor:pointer">Redes · encendidas</button>
<div class="ley"><span style="--c:#ffd36b"><em></em>Bavaria Común</span><span style="--c:#ff7a3d"><em></em>Corabastos</span><span style="--c:#ff6fae"><em></em>Huertas</span><span style="--c:#f7b6d2"><em></em>Parques</span><span style="--c:#ff9f5a"><em></em>Tiendas</span><span style="--c:#c9a7ff"><em></em>Humedales</span></div>`;
  document.body.appendChild(panel); panel.querySelector('.x').onclick = () => { panel.style.display = 'none'; };
  let redesOn = true; panel.querySelector('#vi-redes').onclick = (e) => { redesOn = !redesOn; for (const m of [red, pulsos, ...web]) m.visible = redesOn; e.target.textContent = redesOn ? 'Redes · encendidas' : 'Redes · apagadas'; e.target.style.opacity = redesOn ? 1 : 0.55; };

  /* ---------- encender / apagar ---------- */
  const guardado = new Map(); let antes = null, edges = null, prog = 0;
  const matOscuro = new THREE.MeshLambertMaterial({ color: 0x1a2240, emissive: 0x0b1028 });
  const matBav = new THREE.MeshStandardMaterial({ color: 0xd8d2ff, emissive: 0x6a55e8, emissiveIntensity: 0.65, roughness: 0.6, side: THREE.DoubleSide });
  const matCora = new THREE.MeshStandardMaterial({ color: 0xffc2dc, emissive: 0xd9467f, emissiveIntensity: 0.55, roughness: 0.7, side: THREE.DoubleSide });
  const matBorde = new THREE.LineBasicMaterial({ color: 0x8f9cd6, transparent: true, opacity: 0.075, depthWrite: false });
  function contornos() { // contorno blanco tenue de todos los edificios (se arma por partes para no congelar la página)
    if (edges) { edges.visible = true; return; }
    edges = new THREE.Group(); edges.name = 'vision-contornos'; grupo.add(edges);
    const lista = (T3.edificios || []).map(e => e.mesh); let i = 0;
    const paso = () => { const t0 = performance.now(); while (i < lista.length && performance.now() - t0 < 12) { const m = lista[i++]; try { const l = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, 35), matBorde); l.matrixAutoUpdate = false; l.matrix.copy(m.matrixWorld); edges.add(l); } catch (e) {} } if (i < lista.length) setTimeout(paso, 0); };
    paso();
  }
  const cambiar = (obj, mat) => obj && obj.traverse(o => { if (o.isMesh) { if (!guardado.has(o)) guardado.set(o, o.material); o.material = mat; } });
  let on = false, visReal = false;
  function ver(v) {
    if (v) { visReal = !!T3.fotoReal; if (window.fotoReal) window.fotoReal(false); } // la visión se dibuja sobre el modelo de volúmenes
    on = v; grupo.visible = v; T3.vision = v; document.body.classList.toggle('vision', v); panel.style.display = v ? 'block' : 'none';
    const sc = T3.scene, U = T3.cielo && T3.cielo.U;
    if (v) {
      antes = { bg: sc.background && sc.background.clone(), fog: sc.fog && sc.fog.color.clone(), dens: sc.fog && sc.fog.density, sun: T3.sun.intensity, hemi: T3.hemi.intensity, hc: T3.hemi.color.clone(), hg: T3.hemi.groundColor.clone(), exp: T3.renderer.toneMappingExposure,
        tint: T3.maskU && T3.maskU.uTint.value.clone(), zona: T3.maskU && T3.maskU.uZona.value.z, monte: T3.maskU && T3.maskU.uMonte && T3.maskU.uMonte.value, noche: T3.roofU && T3.roofU.uNoche && T3.roofU.uNoche.value };
      if (sc.background) sc.background.set(0x07082a); if (sc.fog) { sc.fog.color.set(0x0d0c3a); sc.fog.density = (antes.dens || 0.00004) * 1.6; }
      T3.sun.intensity = 0.12; T3.hemi.intensity = 0.55; T3.hemi.color.set(0x5566aa); T3.hemi.groundColor.set(0x080a14); T3.renderer.toneMappingExposure = 1.0;
      if (U) { U.top.value.set(0x010208); U.mid.value.set(0x060a22); U.bot.value.set(0x141a46); U.uStars.value = 1; U.uCloud.value = 0.04; U.uGlow.value = 0; U.uMoon.value = 0; U.uHorA.value = 0.5; U.uHor.value.set(0x3b2a7a); }
      if (T3.maskU) { T3.maskU.uTint.value.set(0.16, 0.2, 0.42); T3.maskU.uZona.value.z = 1e9; if (T3.maskU.uVis) T3.maskU.uVis.value = 1; if (T3.maskU.uMonte) T3.maskU.uMonte.value = 0; }
      if (T3.cielo && T3.cielo.luzMalla) T3.cielo.luzMalla(T3, 0.32);
      if (T3.roofU && T3.roofU.uNoche) T3.roofU.uNoche.value = 0; // ventanas apagadas: el resto del territorio queda en penumbra
      // capas de análisis (sintaxis espacial, flujos): se apagan para que solo brille la propuesta
      for (const b of document.querySelectorAll('#gs-izq button')) if (/^Apagar$/.test(b.textContent.trim()) && !b.classList.contains('on')) b.click();
      for (const e of T3.edificios || []) cambiar(e.mesh, matOscuro);
      cambiar(T3.bavaria, matBav); cambiar(T3.corabastos, matCora);
      if (T3.trees && T3.trees.tinte) T3.trees.tinte(0x1d4a52, 0.12);
      contornos();
      // vista general: Bavaria Común, Corabastos y la red de huertas
      const c = T3.orbit; if (c) { const mx = (hub[0] + coraC[0]) / 2, mz = (hub[1] + coraC[1]) / 2; c.target.set(mx, 0, mz); T3.camera.position.set(mx + 900, 2100, mz + 2600); c.update(); }
    } else if (antes) {
      if (sc.background && antes.bg) sc.background.copy(antes.bg); if (sc.fog && antes.fog) { sc.fog.color.copy(antes.fog); sc.fog.density = antes.dens; }
      T3.sun.intensity = antes.sun; T3.hemi.intensity = antes.hemi; T3.hemi.color.copy(antes.hc); T3.hemi.groundColor.copy(antes.hg); T3.renderer.toneMappingExposure = antes.exp;
      if (T3.maskU) { if (T3.maskU.uVis) T3.maskU.uVis.value = 0; if (antes.tint) T3.maskU.uTint.value.copy(antes.tint); T3.maskU.uZona.value.z = antes.zona; if (T3.maskU.uMonte) T3.maskU.uMonte.value = antes.monte; }
      if (T3.roofU && T3.roofU.uNoche) T3.roofU.uNoche.value = antes.noche;
      for (const [o, m] of guardado) o.material = m; guardado.clear();
      if (T3.trees && T3.trees.tinte) T3.trees.tinte(null);
      if (edges) edges.visible = false;
      if (T3.cielo && T3.cielo.refrescar) T3.cielo.refrescar();
      if (visReal && window.fotoReal) window.fotoReal(true);
    }
    for (const e of ETQ) e.d.style.display = 'none';
  }
  const v = new THREE.Vector3();
  const bucle = (t) => {
    requestAnimationFrame(bucle); if (!on) return;
    for (let i = 0; i < elegidas.length; i++) { const e = elegidas[i]; e.f = (e.f + e.v * 0.016) % 1; const P = e.cv.P, k = Math.min(P.length - 1, Math.floor(e.f * (P.length - 1))); pp[i * 3] = P[k][0]; pp[i * 3 + 1] = P[k][1]; pp[i * 3 + 2] = P[k][2]; }
    gP.attributes.position.needsUpdate = true;
    if (brillos) brillos.material.opacity = 0.55 + 0.35 * Math.sin(t / 380);
    for (const e of ETQ) { v.copy(e.v).project(T3.camera); const fuera = v.z > 1 || Math.abs(v.x) > 1.05 || Math.abs(v.y) > 1.05; e.d.style.display = fuera ? 'none' : 'block'; if (!fuera) { e.d.style.left = ((v.x + 1) / 2 * innerWidth).toFixed(1) + 'px'; e.d.style.top = ((1 - v.y) / 2 * innerHeight).toFixed(1) + 'px'; } }
  };
  requestAnimationFrame(bucle);
  return { ver, get on() { return on; }, arcos: curvas.length };
}
