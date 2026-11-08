/* ============ ESTRATEGIAS DE LA PROPUESTA (modo Kennedy) ============
   Nombres y numeración del Excel de las 9 estrategias; ubicaciones de data3d/estrategias.json (tools/estrategias_build.py):
   E3 Corabastos reducido (Corabastos) · E4 Orgánicos y hongos (distrito biotecnológico) · E5 Corredor biótico (humedales)
   E8 Red distribuida de producción alimentaria (huertas en lotes baldíos, en cubiertas de vivienda en altura y en viviendas, del shapefile de lotes).
   E1 Bavaria Común la dibuja data3d/bavaria_plan.js. E2, E6, E7 y E9 no tienen una ubicación única: desde la leyenda se abre su
   red de actores. Las capas sobre techos (cubiertas, viviendas) se pintan a la altura de cada edificio; las demás a ras del suelo. */
export async function iniciarEstrategias({ THREE, T3, lw, Y0 = 2.0, dentro = null, movil = false }) {
  const D = await (window.cargarJSON || ((u) => fetch(u).then(r => r.json())))('data3d/estrategias.json?v=5');
  const esc = D.escala || 0.5, grupo = new THREE.Group(); grupo.name = 'estrategias'; T3.scene.add(grupo);
  const CAPA = {};
  const W2 = (flat) => { const n = flat.length / 2, W = []; for (let k = 0; k < n; k++) W.push(lw(flat[k * 2] * esc, flat[k * 2 + 1] * esc)); return W; };
  // la geometría de cada estrategia (miles de techos triangulados) se arma SOLO la primera vez que se prende: la carga inicial no la paga
  const armar = (e, gr) => {
    for (const c of e.capas) {
      const P = [], I = [], L = []; let vc = 0;
      const hidro = /cubiertas/i.test(c.n); // E8 en cubiertas: de lejos, surcos verdes; de cerca, las instalaciones hidropónicas (data3d/huertas_hidro.js)
      const anillo = (flat, y) => {
        const W = W2(flat), n = W.length;
        let tri = []; try { tri = THREE.ShapeUtils.triangulateShape(W.map(q => new THREE.Vector2(q[0], q[1])), []); } catch (er) { return; }
        const b = vc; for (const q of W) { P.push(q[0], y, q[1]); vc++; } for (const t of tri) I.push(b + t[0], b + t[1], b + t[2]);
        for (let k = 0; k < n; k++) { const a = W[k], d = W[(k + 1) % n]; L.push(a[0], y + 0.05, a[1], d[0], y + 0.05, d[1]); }
      };
      if ((c.puntos || []).length) { // estrategias de puntos (tiendas, negocios, plazas, centros de cuidado): poste con esfera de su color
        const col = new THREE.Color(c.c), tam = c.tam || 1, poste = new THREE.CylinderGeometry(0.35 * tam, 0.35 * tam, 12 * tam, 6).translate(0, 6 * tam, 0), cabeza = new THREE.SphereGeometry(2.4 * tam, 12, 8).translate(0, 12 * tam + 1.6 * tam, 0), o3 = new THREE.Object3D();
        const mP = new THREE.InstancedMesh(poste, new THREE.MeshBasicMaterial({ color: col.clone().multiplyScalar(0.7) }), c.puntos.length), mC = new THREE.InstancedMesh(cabeza, new THREE.MeshLambertMaterial({ color: col, emissive: col.clone().multiplyScalar(0.55) }), c.puntos.length);
        c.puntos.forEach((q, i) => { const w = lw(q[0] * esc, q[1] * esc); o3.position.set(w[0], Y0, w[1]); o3.updateMatrix(); mP.setMatrixAt(i, o3.matrix); mC.setMatrixAt(i, o3.matrix); });
        mP.frustumCulled = mC.frustumCulled = false; gr.add(mP, mC);
      }
      for (const l of c.lotes) anillo(l, Y0 + 0.35);                                   // a ras del suelo
      for (const t of c.techos || []) anillo(t.slice(0, -1), t[t.length - 1] / 10 + 0.3); // sobre el techo de cada edificio del lote
      const col = new THREE.Color(c.c), techo = (c.techos || []).length > 0;
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I);
      if (hidro) { const U = []; for (let k = 0; k < P.length; k += 3) U.push(P[k] / 3, P[k + 2] / 3); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.computeVertexNormals(); }
      const relleno = new THREE.Mesh(g, hidro ? new THREE.MeshLambertMaterial({ map: surcos(), side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -8 })
        : new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: techo ? 0.55 : 0.4, side: THREE.DoubleSide, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -8 }));
      relleno.renderOrder = 4; relleno.frustumCulled = false;
      const gl = new THREE.BufferGeometry(); gl.setAttribute('position', new THREE.Float32BufferAttribute(L, 3));
      const borde = new THREE.LineSegments(gl, new THREE.LineBasicMaterial({ color: col.clone().multiplyScalar(techo ? 0.75 : 1), transparent: true, opacity: 0.95, depthWrite: false }));
      borde.renderOrder = 5; borde.frustumCulled = false; gr.add(relleno, borde);
    }
  };
  // surcos de cultivo (vistos desde arriba) para las cubiertas con huerta: verde de hortaliza con la línea clara de los tubos
  let texSurcos = null;
  function surcos() {
    if (texSurcos) return texSurcos;
    const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d');
    g.fillStyle = '#c4c0b6'; g.fillRect(0, 0, 64, 64); // losa de concreto clara (de cerca se ven encima los racks hidropónicos)
    for (let i = 0; i < 300; i++) { g.fillStyle = 'rgba(0,0,0,' + (0.05 * Math.random()) + ')'; g.fillRect(Math.random() * 64, Math.random() * 64, 2, 2); }
    for (let y = 4; y < 64; y += 16) { g.fillStyle = 'rgba(96,150,64,.22)'; g.fillRect(4, y, 56, 6); for (let x = 6; x < 58; x += 4) { g.fillStyle = ['rgba(130,185,80,.35)', 'rgba(90,140,55,.35)', 'rgba(140,70,90,.25)'][(x + y) % 3]; g.beginPath(); g.arc(x, y + 3, 1.8, 0, 7); g.fill(); } }
    texSurcos = new THREE.CanvasTexture(cv); texSurcos.wrapS = texSurcos.wrapT = THREE.RepeatWrapping; texSurcos.colorSpace = THREE.SRGBColorSpace; return texSurcos;
  }
  let HIDRO = null, HIDRO_P = null; // huertas hidropónicas de E8 (se arman la primera vez que se prende E8)
  const hidroponia = (on) => {
    if (T3.huertas && T3.huertas.grupo) T3.huertas.grupo.visible = !on; // con E8 prendida, las terrazas de camas de tierra (huertas_techo.js) se vuelven hidropónicas
    if (HIDRO) { HIDRO.ver(on); return; } if (!on) return;
    if (!HIDRO_P) HIDRO_P = import('./huertas_hidro.js?v=2').then(m => { const e = D.estrategias.find(x => x.id === 'E8'), c = e && e.capas.find(x => /cubiertas/i.test(x.n)); if (!c) return null;
      const techos = (c.techos || []).map(t => ({ W: W2(t.slice(0, -1)), h: t[t.length - 1] / 10 })).filter(t => !dentro || dentro(t.W[0][0], t.W[0][1]));
      return m.iniciarHidroponia({ THREE, T3, techos, movil }); }).then(h => { HIDRO = h; if (h) h.ver(true); return h; }).catch(er => console.warn('huertas hidropónicas:', er));
  };
  for (const e of D.estrategias) {
    const gr = new THREE.Group(); gr.visible = false; grupo.add(gr); // al iniciar, todas apagadas
    CAPA[e.id] = { gr, e, lista: false };
  }

  // etiquetas en los sitios grandes y pocos (Corabastos, distrito, humedales, lotes baldíos); las huertas en techos van en la leyenda
  const css = document.createElement('style'); css.textContent = `
.es-et{position:fixed;z-index:8;transform:translate(-50%,-100%);pointer-events:none;padding:4px 9px;border-radius:9px;background:rgba(8,16,26,.86);border:1.5px solid var(--c);color:#e2f3ff;font:700 11px system-ui,-apple-system,"Segoe UI",sans-serif;white-space:nowrap}
.es-et b{color:var(--c);margin-right:5px}.es-et small{display:block;font-weight:500;color:#94a3b8;font-size:10px}.es-et::after{content:'';position:absolute;left:50%;top:100%;width:1.5px;height:12px;background:var(--c)}
@media(max-width:760px){.es-et{font-size:10px;padding:3px 7px}}`;
  document.head.appendChild(css);
  const ET = [];
  for (const e of D.estrategias) for (const c of e.capas) {
    if ((c.techos || []).length || c.lotes.length > 30) continue;
    const vistos = [];
    for (const l of c.lotes) {
      const n = l.length / 2; let x = 0, y = 0, a = 0;
      for (let k = 0; k < n; k++) { const p = [l[k * 2] * esc, l[k * 2 + 1] * esc], q = [l[((k + 1) % n) * 2] * esc, l[((k + 1) % n) * 2 + 1] * esc]; a += p[0] * q[1] - q[0] * p[1]; x += p[0]; y += p[1]; }
      if (Math.abs(a) / 2 < 3000) continue; x /= n; y /= n;
      if (vistos.some(v => Math.hypot(v[0] - x, v[1] - y) < 700)) continue; vistos.push([x, y]);
      const d = document.createElement('div'); d.className = 'es-et'; d.style.setProperty('--c', c.c); d.innerHTML = `<b>${e.id}</b>${e.n}${c.n !== e.n ? `<small>${c.n}</small>` : ''}`; document.body.appendChild(d);
      const w = lw(x, y); ET.push({ d, id: e.id, p: new THREE.Vector3(w[0], Y0 + 14, w[1]) });
    }
  }
  const v = new THREE.Vector3();
  const bucle = () => {
    const cam = T3.camera, W = innerWidth, H = innerHeight;
    for (const t of ET) {
      if (!CAPA[t.id].gr.visible) { t.d.style.display = 'none'; continue; }
      v.copy(t.p).project(cam); const fuera = v.z > 1 || v.x < -1.1 || v.x > 1.1 || v.y < -1.1 || v.y > 1.1;
      t.d.style.display = fuera ? 'none' : 'block'; if (!fuera) { t.d.style.left = ((v.x + 1) / 2 * W).toFixed(1) + 'px'; t.d.style.top = ((1 - v.y) / 2 * H).toFixed(1) + 'px'; }
    }
    requestAnimationFrame(bucle);
  };
  requestAnimationFrame(bucle);
  /* ---------- conexiones entre estrategias (documento maestro, sección 8) ----------
     Arcos entre los lugares de dos estrategias relacionadas; se ven cuando las dos están prendidas. Pulsos de origen a destino
     (en las dos direcciones si la relación es ↔) y una etiqueta con el mecanismo que se investigará. */
  const PREN = {};
  const [AC, BVd] = await Promise.all(['data3d/actores.json?v=3', 'data3d/bavaria.json?v=2'].map(u => (window.cargarJSON || ((x) => fetch(x).then(r => r.json())))(u).catch(() => null)));
  const cruces = (AC && AC.doc && AC.doc.cruces) || [];
  const cent = (W) => { let x = 0, z = 0; for (const q of W) { x += q[0]; z += q[1]; } return [x / W.length, z / W.length]; };
  const REP = {}; // puntos representativos de cada estrategia (en el mundo)
  for (const e of D.estrategias) {
    const L = [];
    for (const c of e.capas) {
      for (const l of c.lotes) L.push(cent(W2(l)));
      const T = c.techos || []; for (let i = 0; i < T.length; i += Math.max(1, Math.floor(T.length / 60))) L.push(cent(W2(T[i].slice(0, -1))));
      for (const q of c.puntos || []) L.push(lw(q[0] * esc, q[1] * esc));
    }
    REP[e.id] = L;
  }
  if (BVd && BVd.sitio) REP.E1 = [cent(BVd.sitio.map(p => lw(p[0], p[1])))];
  const lado = (s) => [...s.matchAll(/E(\d)(?:\s*[–-]\s*E(\d))?/g)].flatMap(m => m[2] ? Array.from({ length: +m[2] - +m[1] + 1 }, (_, k) => 'E' + (+m[1] + k)) : ['E' + m[1]]);
  let sem = 11; const rnd = () => ((sem = (sem * 16807) % 2147483647) / 2147483647);
  const COLE = { E1: '#ef4444', ...Object.fromEntries(D.estrategias.map(e => [e.id, e.c])) };
  const PARES = [];
  for (const c of cruces) {
    let primera = true; // una sola etiqueta por conexión del documento (E9 ↔ E1–E8 son siete pares)
    const bi = c.par.includes('↔'), [si, sd] = c.par.split(/→|↔/), O = lado(si || ''), Dd = lado(sd || '');
    for (const o of O) for (const d of Dd) {
      if (o === d || !REP[o] || !REP[d] || !REP[o].length || !REP[d].length) continue;
      const [A, B, inv] = REP[o].length >= REP[d].length ? [REP[o], REP[d], false] : [REP[d], REP[o], true];
      const n = Math.min(12, A.length), muestra = []; for (let i = 0; i < n; i++) muestra.push(A[Math.floor(rnd() * A.length)]);
      const arcos = muestra.map(a => { let b = B[0], bd = 1e18; for (const q of B) { const dd = (q[0] - a[0]) ** 2 + (q[1] - a[1]) ** 2; if (dd < bd) { bd = dd; b = q; } } return inv ? [b, a] : [a, b]; }); // [origen, destino]
      const gr = new THREE.Group(); gr.visible = false; grupo.add(gr);
      const col = new THREE.Color(COLE[o] || '#e2e8f0'), col2 = new THREE.Color(COLE[d] || '#e2e8f0'), SEG = 24, pos = [], cols = [], curvas = [];
      for (const [a, b] of arcos) {
        const dist = Math.hypot(b[0] - a[0], b[1] - a[1]), h = Math.max(30, Math.min(260, dist * 0.22)), P = [];
        for (let s = 0; s <= SEG; s++) { const u = s / SEG; P.push(new THREE.Vector3(a[0] + (b[0] - a[0]) * u, Y0 + 14 + Math.sin(Math.PI * u) * h, a[1] + (b[1] - a[1]) * u)); }
        for (let s = 0; s < SEG; s++) { pos.push(P[s].x, P[s].y, P[s].z, P[s + 1].x, P[s + 1].y, P[s + 1].z); const c1 = col.clone().lerp(col2, s / SEG), c2 = col.clone().lerp(col2, (s + 1) / SEG); cols.push(c1.r, c1.g, c1.b, c2.r, c2.g, c2.b); }
        curvas.push(P);
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
      const l = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false })); l.renderOrder = 9; l.frustumCulled = false; gr.add(l);
      const pp = new Float32Array(curvas.length * 2 * 3), pc = new Float32Array(curvas.length * 2 * 3), pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3)); pg.setAttribute('color', new THREE.BufferAttribute(pc, 3));
      const pulsos = new THREE.Points(pg, new THREE.PointsMaterial({ size: 4, sizeAttenuation: false, vertexColors: true, depthWrite: false })); pulsos.frustumCulled = false; gr.add(pulsos);
      const top = curvas[0][Math.floor(SEG / 2)], et = primera ? document.createElement('div') : null; primera = false;
      if (et) { et.className = 'es-et'; et.style.setProperty('--c', COLE[o] || '#e2e8f0');
      et.innerHTML = `<b>${c.par}</b>${c.mecanismo.length > 46 ? c.mecanismo.slice(0, 44) + '…' : c.mecanismo}`; et.title = c.mecanismo + ' · No puede suponerse: ' + c.no_suponer; et.style.display = 'none'; et.style.whiteSpace = 'normal'; et.style.maxWidth = '210px'; et.style.fontSize = '10px'; et.style.fontWeight = '600'; document.body.appendChild(et); }
      PARES.push({ o, d, bi, gr, curvas, pp, pc, pg, col, col2, et, top });
    }
  }
  const conexiones = () => { for (const p of PARES) { const v2 = !!(PREN[p.o] && PREN[p.d]); p.gr.visible = v2; if (!v2 && p.et) p.et.style.display = 'none'; } };
  const vc = new THREE.Vector3();
  const bucleC = () => {
    const t = performance.now() / 1000;
    for (const p of PARES) {
      if (!p.gr.visible) continue;
      p.curvas.forEach((P, i) => { for (let j = 0; j < 2; j++) { let u = (t * 0.22 + i * 0.173 + j * 0.5) % 1; if (p.bi && j === 1) u = 1 - u; const k = Math.min(P.length - 1, Math.floor(u * (P.length - 1))), q = P[k], o = (i * 2 + j) * 3, c = p.col.clone().lerp(p.col2, u); p.pp[o] = q.x; p.pp[o + 1] = q.y; p.pp[o + 2] = q.z; p.pc[o] = c.r; p.pc[o + 1] = c.g; p.pc[o + 2] = c.b; } });
      p.pg.attributes.position.needsUpdate = true; p.pg.attributes.color.needsUpdate = true;
      if (!p.et) continue;
      vc.copy(p.top).project(T3.camera); const fuera = vc.z > 1 || Math.abs(vc.x) > 1.05 || Math.abs(vc.y) > 1.05; p.et.style.display = fuera ? 'none' : 'block'; if (!fuera) { p.et.style.left = ((vc.x + 1) / 2 * innerWidth).toFixed(1) + 'px'; p.et.style.top = ((1 - vc.y) / 2 * innerHeight).toFixed(1) + 'px'; }
    }
    requestAnimationFrame(bucleC);
  };
  requestAnimationFrame(bucleC);
  // las 9 estrategias del Excel, con o sin ubicación en el mapa
  const NOM = D.nombres || {}, COL = { E2: '#38bdf8', E6: '#e879f9', E7: '#facc15', E9: '#fb7185' };
  const lista = Object.keys(NOM).filter(k => k !== 'E1').sort((a, b) => +a.slice(1) - +b.slice(1)).map(k => {
    const e = D.estrategias.find(x => x.id === k);
    return e ? { id: k, n: e.n, c: e.c, det: e.capas.map(c => c.n).join(' · ') + (e.n_puntos ? ` · ${e.n_puntos.toLocaleString('es-CO')} puntos` : ` · ${(e.area / 1e4).toLocaleString('es-CO', { maximumFractionDigits: 1 })} ha`) }
      : { id: k, n: NOM[k], c: COL[k] || '#94a3b8', sinLugar: true, det: 'Sin una ubicación única en el mapa · toca para ver su red de actores' };
  });
  return {
    lista,
    ver: (id, on) => { PREN[id] = on; conexiones(); const k = CAPA[id]; if (!k) return; if (on && !k.lista) { armar(k.e, k.gr); k.lista = true; } k.gr.visible = on; },
    marcar: (id, on) => { PREN[id] = on; conexiones(); }, // E1 y E3 tienen su propio plan: solo cuentan para las conexiones
    // sitios de huerta en el suelo (lotes baldíos) para las colmenas y lombrices de la red biótica
    hidroponia: () => hidroponia(true), // huertas hidropónicas en techos y balcones con sus polinizadores: siempre a la vista
    sitios: () => { const e = D.estrategias.find(x => x.id === 'E8'); const c = e && e.capas.find(x => /baldío/i.test(x.n)); return c ? c.lotes.map(l => ({ id: 'E8', n: 'Huerta en lote baldío', poly: W2(l) })) : []; }
  };
}
