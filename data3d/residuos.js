/* ============ PUNTOS ACTUALES DE RECOLECCIÓN DE RESIDUOS (Kennedy) ============
   1.380 contenedores reales de la UAESP (capa 'Contenerización', localidad Kennedy): blancos = aprovechables (1.100 L),
   negros = no aprovechables (2.400 L). Cada uno se dibuja como contenedor en la calle y con un punto que se ve de lejos;
   la red une cada contenedor con el más cercano de su tipo (árbol mínimo): lectura de la red, no la ruta de los camiones.
   Empieza apagada: se prende con el interruptor "Puntos de residuos". */
export async function crearResiduos({ THREE, T3 }) {
  const D = await (await fetch('data3d/residuos.json?v=1')).json();
  const g = new THREE.Group(); g.name = 'residuos'; g.visible = false; T3.scene.add(g);
  const Y = (x, z) => { const a = T3.alzaVia ? T3.alzaVia(x, z) : 0; return (T3.viaY != null ? T3.viaY : 0.62) + (isFinite(a) ? a : 0); };
  const COL = [new THREE.Color('#a78bfa'), new THREE.Color('#7fd1b9')]; // no aprovechable (violeta: se distingue del dorado de las asambleas) · aprovechable (verde agua)
  // contenedores en la calle
  const geo = new THREE.BoxGeometry(1.25, 1.3, 1.1); geo.translate(0, 0.65, 0);
  const cont = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ roughness: 0.6, metalness: 0.1 }), D.p.length);
  const o = new THREE.Object3D(), cN = new THREE.Color('#2b2f33'), cB = new THREE.Color('#e9ece8');
  D.p.forEach((p, i) => { o.position.set(p[0], Y(p[0], p[1]), p[1]); o.rotation.y = (i * 2.399) % 6.283; o.scale.setScalar(p[3] > 2000 ? 1.25 : 1); o.updateMatrix(); cont.setMatrixAt(i, o.matrix); cont.setColorAt(i, p[2] ? cB : cN); });
  cont.castShadow = true; g.add(cont);
  // punto visible de lejos (tamaño en pantalla)
  const pos = new Float32Array(D.p.length * 3), col = new Float32Array(D.p.length * 3);
  D.p.forEach((p, i) => { pos.set([p[0], Y(p[0], p[1]) + 4, p[1]], i * 3); const c = COL[p[2]]; col.set([c.r, c.g, c.b], i * 3); });
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); pg.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const pm = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, depthTest: false, vertexColors: true, toneMapped: false, /* capa de análisis: siempre visible encima */
    vertexShader: 'varying vec3 vC; void main(){ vC = color; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = clamp(6400.0 / -mv.z, 9.0, 24.0); }',
    fragmentShader: 'varying vec3 vC; void main(){ vec2 d = gl_PointCoord - 0.5; float r = length(d); if (r > 0.5) discard; float a = smoothstep(0.5, 0.36, r); float borde = smoothstep(0.3, 0.38, r) * (1.0 - smoothstep(0.42, 0.5, r)); gl_FragColor = vec4(mix(vC, vec3(0.05), borde * 0.6), a); }' });
  const pts = new THREE.Points(pg, pm); pts.renderOrder = 6; pts.frustumCulled = false; g.add(pts);
  // red
  const lp = new Float32Array(D.e.length * 6), lc = new Float32Array(D.e.length * 6);
  D.e.forEach(([a, b], k) => { const A = D.p[a], B = D.p[b], c = COL[A[2]]; lp.set([A[0], Y(A[0], A[1]) + 4, A[1], B[0], Y(B[0], B[1]) + 4, B[1]], k * 6); lc.set([c.r, c.g, c.b, c.r, c.g, c.b], k * 6); });
  const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(lp, 3)); lg.setAttribute('color', new THREE.BufferAttribute(lc, 3));
  /* ARCOS = A DÓNDE VA LA BASURA (dato real): todo lo no aprovechable de Bogotá va al Relleno Sanitario Doña Juana (Usme).
     Cada contenedor negro tiene su arco hacia allá; los blancos (reciclable) van a recicladores y bodegas (ECA) sin capa pública: solo punto. */
  const LAT0 = 4.640683, LON0 = -74.149778, MX = 111320 * Math.cos(4.63 * Math.PI / 180), MY = 110540;
  const DJ = [(-74.1352 - LON0) * MX + 2095.67, -(4.5126 - LAT0) * MY - 109.06]; /* Relleno Doña Juana */
  /* un arco por sector de 600 m (agrupa los contenedores negros del sector): se lee el flujo sin tapar la ciudad */
  const S = new Map(); for (const p of D.p) { if (p[2]) continue; const k = Math.floor(p[0] / 600) + ',' + Math.floor(p[1] / 600); const s = S.get(k) || { x: 0, z: 0, n: 0 }; s.x += p[0]; s.z += p[1]; s.n++; S.set(k, s); }
  const sec = [...S.values()], ap = new Float32Array(sec.length * 6), ac = new Float32Array(sec.length * 6), cv = COL[0];
  sec.forEach((s, k) => { const x = s.x / s.n, z = s.z / s.n; ap.set([x, Y(x, z) + 4, z, DJ[0], 2, DJ[1]], k * 6); ac.set([cv.r, cv.g, cv.b, cv.r, cv.g, cv.b], k * 6); });
  g.add(await (await import('./red_resaltada.js?v=2')).redResaltada({ THREE, T3, pos: ap, colores: ac, ancho: 1.6, arco: 0.05 }));
  const n1 = D.p.filter(p => p[2]).length;
  return { grupo: g, total: D.p.length, aprov: n1, noAprov: D.p.length - n1, ver(on) { g.visible = on; } };
}

export function panelResiduos(api, on) {
  let el = document.getElementById('res-panel');
  if (!on) { if (el) el.remove(); return; }
  if (!el) { el = document.createElement('div'); el.id = 'res-panel'; document.body.appendChild(el); }
  el.style.cssText = 'position:fixed;left:' + (innerWidth > 760 ? 290 : 8) + 'px;bottom:96px;z-index:40;width:min(250px,calc(100vw - 32px));background:rgba(13,15,18,.8);border:1px solid rgba(255,255,255,.075);border-radius:10px;padding:9px 11px;color:#e9ebec;font:10.5px/1.35 Inter,system-ui,sans-serif;-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px)';
  el.innerHTML = `<div style="font:500 9.5px 'JetBrains Mono',monospace;letter-spacing:.16em;color:#646c71;text-transform:uppercase;margin-bottom:8px">Puntos de recolección de basura · hoy</div>
    <div style="display:grid;grid-template-columns:auto 1fr auto;gap:6px 10px;align-items:center">
      <i style="width:10px;height:10px;border-radius:50%;background:#7fd1b9"></i><span>Reciclable · contenedor blanco</span><b style="font:400 10.5px 'JetBrains Mono',monospace;color:#f2c995">${api.aprov.toLocaleString('es-CO')}</b>
      <i style="width:10px;height:10px;border-radius:50%;background:#a78bfa"></i><span>Basura · contenedor negro</span><b style="font:400 10.5px 'JetBrains Mono',monospace;color:#f2c995">${api.noAprov.toLocaleString('es-CO')}</b>
    </div>
    <div style="margin-top:8px;color:#9aa2a7;font-size:10px">Contenedores de la calle donde los vecinos dejan la basura y el camión de aseo la recoge. <b style="color:#c4b5fd;font-weight:500">Arcos violeta:</b> la basura no aprovechable va al Relleno Sanitario Doña Juana (Usme, al sur). Lo reciclable va a recicladores y bodegas de reciclaje (sin capa pública).</div>
    <div style="margin-top:6px;color:#646c71;font:400 10px 'JetBrains Mono',monospace">Fuente: UAESP / IDECA · Contenerización, Kennedy</div>`;
}
