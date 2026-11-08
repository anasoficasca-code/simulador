/* ============ REDES DE ACTORES: botón de la página y capa en el territorio ============
   - "Redes de actores ↗": abre actores.html (red completa, con el estilo de la red de especies) en otra pestaña.
   - "Actores en el territorio": capa que se prende y apaga como las relaciones bióticas. Cada estrategia pone sus 100 nodos
     sobre su lugar (E1 Bavaria, E3 Corabastos, E4 distrito biotecnológico, E5 humedales, E8 huertas; E2, E6 y E9 sobre lotes de
     vivienda y E7 sobre conjuntos en altura, cada una en un sector de Kennedy). Esferas con el color de su clase, más grandes cuanto
     más conexiones tienen; arcos con el color de la etiqueta de la relación y pulsos de quien actúa a quien recibe.
   Los roles y vínculos son hipótesis (Excel de las 9 estrategias). */
const CLASE = { 'Rol previo': '#f59e0b', 'Rol humano propuesto': '#60a5fa', 'Organismo': '#34d399', 'Entorno': '#94a3b8', 'Recurso': '#22d3ee', 'Infraestructura': '#c084fc' };
const TAGC = { INF: '#7dd3fc', CONS: '#a78bfa', AUT: '#f472b6', CTRL: '#fbbf24', RET: '#34d399', DEP: '#fb923c', BIO: '#86efac', AMB: '#cbd5e1', MAT: '#22d3ee' };
const ALTO = { 'Rol previo': 46, 'Rol humano propuesto': 34, 'Organismo': 20, 'Entorno': 24, 'Recurso': 22, 'Infraestructura': 22 };

export async function iniciarActores({ THREE, T3, lw, OX = 0, OZ = 0, Y0 = 2.0 } = {}) {
  let e = 'E1';
  const abrir = (id) => { if (id) e = id; window.open('actores.html?e=' + encodeURIComponent(e), 'red-actores'); };
  const css = document.createElement('style'); css.textContent = `#ar-btn,#at-btn{width:100%;margin-top:6px;height:30px;border:none;border-radius:8px;background:rgba(255,255,255,.06);color:#cbd5e1;font:700 10px system-ui,sans-serif;letter-spacing:.06em;cursor:pointer}#ar-btn:hover,#at-btn:hover{background:rgba(125,211,252,.18);color:#e0f2fe}#at-btn.on{background:#7dd3fc;color:#04121c}
.at-et{position:fixed;z-index:8;transform:translate(-50%,-100%);pointer-events:none;padding:3px 8px;border-radius:8px;background:rgba(8,16,26,.86);border:1.5px solid var(--c);color:#e2f3ff;font:700 10.5px system-ui,sans-serif;white-space:nowrap}
#at-tip{position:fixed;z-index:12;pointer-events:none;display:none;max-width:260px;padding:6px 9px;border-radius:9px;background:rgba(4,10,18,.94);border:1px solid rgba(125,211,252,.3);color:#e2f3ff;font:11px system-ui,sans-serif}#at-tip small{display:block;color:#94a3b8}`;
  document.head.appendChild(css);
  let capa = null, on = false;
  const poner = () => {
    const izq = document.getElementById('gs-izq'), ag = document.getElementById('gs-ag');
    if (!izq || document.getElementById('ar-btn')) return;
    const b = document.createElement('button'); b.id = 'ar-btn'; b.textContent = 'Redes de actores ↗'; b.title = 'Abre la red de actores de las 9 estrategias en otra pestaña'; b.onclick = () => abrir();
    const t = document.createElement('button'); t.id = 'at-btn'; t.textContent = 'Actores en el territorio'; t.title = 'Prende o apaga los actores de las 9 estrategias sobre sus lugares'; t.onclick = () => alternarCapa(!on);
    (ag ? ag.parentElement : izq).insertAdjacentElement('afterend', b); b.insertAdjacentElement('afterend', t);
  };
  poner(); setTimeout(poner, 1500);
  async function alternarCapa(v) {
    on = v; const t = document.getElementById('at-btn'); if (t) t.classList.toggle('on', on);
    if (on && !capa && THREE && T3) capa = await construir();
    if (capa) { capa.grupo.visible = on; capa.ET.forEach(x => x.d.style.display = on ? '' : 'none'); if (!on) capa.tip.style.display = 'none'; }
  }

  /* ---------- la capa en el territorio ---------- */
  async function construir() {
    const [A, ES, BV] = await Promise.all(['data3d/actores.json?v=3', 'data3d/estrategias.json?v=5', 'data3d/bavaria.json?v=2'].map(u => (window.cargarJSON || ((u) => fetch(u).then(r => r.json())))(u).catch(() => null)));
    if (!A || !ES) return null;
    const esc = ES.escala || 0.5, ring = (flat) => { const W = []; const n = (flat.length - (flat.length % 2)) / 2; for (let k = 0; k < n; k++) W.push(lw(flat[k * 2] * esc, flat[k * 2 + 1] * esc)); return W; };
    const centro = (P) => { let x = 0, z = 0; for (const p of P) { x += p[0]; z += p[1]; } return [x / P.length, z / P.length]; };
    const dentro = (P, x, z) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) if ((P[i][1] > z) !== (P[j][1] > z) && x < (P[j][0] - P[i][0]) * (z - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0]) c = !c; return c; };
    let sem = 7; const rnd = () => ((sem = (sem * 16807) % 2147483647) / 2147483647);
    const puntoEn = (P) => { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const p of P) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); } for (let k = 0; k < 60; k++) { const x = x0 + rnd() * (x1 - x0), z = z0 + rnd() * (z1 - z0); if (dentro(P, x, z)) return [x, z]; } return centro(P); };
    const capaDe = (id, re) => { const s = ES.estrategias.find(x => x.id === id); const c = s && s.capas.find(c => re.test(c.n)); return c ? c.lotes.map(ring).concat((c.techos || []).map(t => ring(t.slice(0, -1)))) : []; };
    const todaE = (id) => { const s = ES.estrategias.find(x => x.id === id); return s ? s.capas.flatMap(c => c.lotes.map(ring)) : []; };
    const sector = (polys, cx, cz, r) => { const L = polys.filter(P => { const c = centro(P); return Math.hypot(c[0] - cx, c[1] - cz) < r; }); return L.length ? L : polys.slice(0, 200); };
    const viv = capaDe('E8', /viviendas$/i), alt = capaDe('E8', /altura/i), huertas = capaDe('E8', /./);
    const LUG = {
      E1: BV ? [BV.sitio.map(p => lw(p[0], p[1]))] : [], E3: todaE('E3'), E4: todaE('E4'), E5: todaE('E5'),
      E8: sector(huertas, OX + 300, OZ + 200, 650), E2: sector(viv, OX - 700, OZ + 700, 450), E6: sector(viv, OX + 900, OZ + 650, 450),
      E7: sector(alt, OX - 400, OZ - 750, 600), E9: sector(viv, OX + 800, OZ - 650, 450)
    };
    const COLE = { E1: '#ef4444', E2: '#38bdf8', E3: '#fb923c', E4: '#a78bfa', E5: '#34d399', E6: '#e879f9', E7: '#facc15', E8: '#84cc16', E9: '#fb7185' };
    const grupo = new THREE.Group(); grupo.name = 'actores-territorio'; T3.scene.add(grupo);
    const NOD = [], REL = [], ET = [], porId = new Map();
    for (const E of A.estrategias) {
      const P = LUG[E.id]; if (!P || !P.length) continue;
      const grado = {}; for (const r of E.rel) { grado[r.o] = (grado[r.o] || 0) + 1; grado[r.d] = (grado[r.d] || 0) + 1; }
      const max = Math.max(1, ...Object.values(grado)), cs = centro(P.map(centro));
      E.nodos.forEach((n, i) => {
        const pol = P[Math.floor(rnd() * P.length)], q = pol.length > 12 || P.length < 6 ? puntoEn(pol) : centro(pol), g = grado[n.id] || 0;
        const humano = n.cl === 'Rol previo' || n.cl === 'Rol humano propuesto';
        // los humanos caminan por el lugar de su estrategia (como los animales de la red biótica); el entorno y los organismos quedan fijos
        const o = { ...n, E: E.id, g, x: q[0], z: q[1], y: humano ? Y0 : Y0 + (ALTO[n.cl] || 24) + rnd() * 8, r: humano ? 2.2 + 3.2 * Math.sqrt(g / max) : 1.6 + 7 * Math.sqrt(g / max), humano, P, obj: null, pausa: rnd() * 6, v: 1.1 + rnd() * 0.6, rot: rnd() * 6.28 };
        NOD.push(o); porId.set(E.id + '|' + n.id, o);
      });
      for (const r of E.rel) { const a = porId.get(E.id + '|' + r.o), b = porId.get(E.id + '|' + r.d); if (a && b) REL.push({ a, b, tag: r.tag, rel: r.rel }); }
      const d = document.createElement('div'); d.className = 'at-et'; d.style.setProperty('--c', COLE[E.id]); d.textContent = E.id + ' · ' + E.n; d.style.display = 'none'; document.body.appendChild(d);
      ET.push({ d, p: new THREE.Vector3(cs[0], Y0 + 80, cs[1]) });
    }
    // nodos: esferas fijas (entorno, organismos, recursos) y figuras que caminan (humanos), una malla por clase
    const esfera = new THREE.SphereGeometry(1, 12, 8), figura = new THREE.CapsuleGeometry(0.3, 1.1, 3, 8).translate(0, 0.85, 0), o3 = new THREE.Object3D(), MALLAS = [];
    for (const [cl, col] of Object.entries(CLASE)) {
      const L = NOD.filter(n => n.cl === cl); if (!L.length) continue;
      const c = new THREE.Color(col), hum = L[0].humano, m = new THREE.InstancedMesh(hum ? figura : esfera, new THREE.MeshLambertMaterial({ color: c, emissive: c.clone().multiplyScalar(0.5) }), L.length);
      L.forEach((n, i) => { o3.position.set(n.x, n.y, n.z); o3.rotation.set(0, n.rot, 0); o3.scale.setScalar(n.r); o3.updateMatrix(); m.setMatrixAt(i, o3.matrix); }); m.frustumCulled = false; if (hum) m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); grupo.add(m);
      MALLAS.push({ m, L, hum });
    }
    // relaciones: arcos con el color de la etiqueta; se recalculan en cada cuadro porque los humanos se mueven
    const SEG = 10, pos = new Float32Array(REL.length * SEG * 6), colA = new Float32Array(REL.length * SEG * 6);
    const ancla = (n) => n.humano ? n.y + n.r * 2.1 : n.y;
    const arcos = () => REL.forEach((r, k) => { const d = Math.hypot(r.b.x - r.a.x, r.b.z - r.a.z), h = r.h = Math.min(60, 4 + d * 0.25), ya = ancla(r.a), yb = ancla(r.b);
      for (let s = 0; s < SEG; s++) { const u0 = s / SEG, u1 = (s + 1) / SEG, o = (k * SEG + s) * 6; pos[o] = r.a.x + (r.b.x - r.a.x) * u0; pos[o + 1] = ya + (yb - ya) * u0 + Math.sin(Math.PI * u0) * h; pos[o + 2] = r.a.z + (r.b.z - r.a.z) * u0; pos[o + 3] = r.a.x + (r.b.x - r.a.x) * u1; pos[o + 4] = ya + (yb - ya) * u1 + Math.sin(Math.PI * u1) * h; pos[o + 5] = r.a.z + (r.b.z - r.a.z) * u1; } });
    REL.forEach((r, k) => { const c = new THREE.Color(TAGC[r.tag] || '#e2e8f0'); for (let s = 0; s < SEG; s++) colA.set([c.r, c.g, c.b, c.r, c.g, c.b], (k * SEG + s) * 6); });
    arcos();
    const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage)); lg.setAttribute('color', new THREE.BufferAttribute(colA, 3));
    const lineas = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.6, depthWrite: false })); lineas.frustumCulled = false; lineas.renderOrder = 8; grupo.add(lineas);
    const pp = new Float32Array(REL.length * 3), pcol = new Float32Array(REL.length * 3), pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3)); pg.setAttribute('color', new THREE.BufferAttribute(pcol, 3));
    REL.forEach((r, k) => { const c = new THREE.Color(TAGC[r.tag] || '#e2e8f0'); pcol.set([c.r, c.g, c.b], k * 3); });
    const pulsos = new THREE.Points(pg, new THREE.PointsMaterial({ size: 3, sizeAttenuation: false, vertexColors: true, depthWrite: false })); pulsos.frustumCulled = false; grupo.add(pulsos);
    // caminar: de un punto a otro dentro de los lugares de su estrategia, con pausas (como los animales)
    const mover = (n, dt) => {
      if (n.pausa > 0) { n.pausa -= dt; return; }
      if (!n.obj) { const pol = n.P[Math.floor(Math.random() * n.P.length)]; n.obj = pol.length > 12 || n.P.length < 6 ? puntoEn(pol) : centro(pol); if (Math.hypot(n.obj[0] - n.x, n.obj[1] - n.z) > 260) n.obj = [n.x + (Math.random() - 0.5) * 80, n.z + (Math.random() - 0.5) * 80]; }
      const dx = n.obj[0] - n.x, dz = n.obj[1] - n.z, d = Math.hypot(dx, dz);
      if (d < 1) { n.obj = null; n.pausa = 2 + Math.random() * 10; return; }
      const s = Math.min(d, n.v * dt * 8); n.x += dx / d * s; n.z += dz / d * s; n.rot = Math.atan2(dx, dz);
    };    // nodo bajo el puntero
    const tip = document.createElement('div'); tip.id = 'at-tip'; document.body.appendChild(tip);
    const cvs = T3.renderer.domElement, v = new THREE.Vector3();
    const cercano = (ev) => { const rc = cvs.getBoundingClientRect(); let best = null, bd = 12; for (const n of NOD) { v.set(n.x, n.humano ? n.y + n.r : n.y, n.z).project(T3.camera); if (v.z > 1) continue; const x = (v.x + 1) / 2 * rc.width + rc.left, y = (1 - v.y) / 2 * rc.height + rc.top, d = Math.hypot(x - ev.clientX, y - ev.clientY); if (d < bd) { bd = d; best = n; } } return best; };
    cvs.addEventListener('pointermove', (ev) => { if (!on) return; const n = cercano(ev); if (!n) { tip.style.display = 'none'; return; } tip.style.display = 'block'; tip.style.left = (ev.clientX + 14) + 'px'; tip.style.top = (ev.clientY + 12) + 'px'; tip.innerHTML = `<b>${n.n}</b><small>${n.E} · ${n.cl} · ${n.proc}</small><small>${n.g} relaciones · doble clic: ver su red</small>`; });
    cvs.addEventListener('dblclick', (ev) => { if (!on) return; const n = cercano(ev); if (n) abrir(n.E); });
    let ult = performance.now();
    const bucle = () => {
      const ahora = performance.now(), dt = Math.min(0.1, (ahora - ult) / 1000); ult = ahora;
      if (on) {
        const t = ahora / 1000;
        for (const M of MALLAS) if (M.hum) { M.L.forEach((n, i) => { mover(n, dt); o3.position.set(n.x, n.y, n.z); o3.rotation.set(0, n.rot, 0); o3.scale.setScalar(n.r); o3.updateMatrix(); M.m.setMatrixAt(i, o3.matrix); }); M.m.instanceMatrix.needsUpdate = true; }
        arcos(); lg.attributes.position.needsUpdate = true;
        REL.forEach((r, k) => { const u = (t * 0.3 + k * 0.137) % 1, ya = ancla(r.a), yb = ancla(r.b); pp[k * 3] = r.a.x + (r.b.x - r.a.x) * u; pp[k * 3 + 1] = ya + (yb - ya) * u + Math.sin(Math.PI * u) * r.h; pp[k * 3 + 2] = r.a.z + (r.b.z - r.a.z) * u; });
        pg.attributes.position.needsUpdate = true;
        for (const x of ET) { v.copy(x.p).project(T3.camera); const fuera = v.z > 1 || Math.abs(v.x) > 1.05 || Math.abs(v.y) > 1.05; x.d.style.display = fuera ? 'none' : 'block'; if (!fuera) { x.d.style.left = ((v.x + 1) / 2 * innerWidth) + 'px'; x.d.style.top = ((1 - v.y) / 2 * innerHeight) + 'px'; } }
      }
      requestAnimationFrame(bucle);
    };
    requestAnimationFrame(bucle);
    return { grupo, ET, tip };
  }
  // misma interfaz que antes: la leyenda de estrategias llama ver(id) y alternar(true)
  return { ver: (id) => { e = id; }, alternar: (v) => { if (v) abrir(); }, abrir, capa: alternarCapa };
}
