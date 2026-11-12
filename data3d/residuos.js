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
  g.add(await (await import('./red_resaltada.js?v=1')).redResaltada({ THREE, T3, pos: lp, colores: lc, ancho: 2.4 })); /* red resaltada: grosor real, halo y pulsos */
  const n1 = D.p.filter(p => p[2]).length;
  return { grupo: g, total: D.p.length, aprov: n1, noAprov: D.p.length - n1, ver(on) { g.visible = on; } };
}

export function panelResiduos(api, on) {
  let el = document.getElementById('res-panel');
  if (!on) { if (el) el.remove(); return; }
  if (!el) { el = document.createElement('div'); el.id = 'res-panel'; document.body.appendChild(el); }
  el.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:96px;z-index:40;width:min(360px,calc(100vw - 32px));background:rgba(13,15,18,.78);border:1px solid rgba(255,255,255,.075);border-radius:12px;padding:12px 14px;color:#e9ebec;font:12px/1.45 Inter,system-ui,sans-serif;-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px)';
  el.innerHTML = `<div style="font:500 9.5px 'JetBrains Mono',monospace;letter-spacing:.16em;color:#646c71;text-transform:uppercase;margin-bottom:8px">Puntos de recolección de residuos · hoy</div>
    <div style="display:grid;grid-template-columns:auto 1fr auto;gap:6px 10px;align-items:center">
      <i style="width:10px;height:10px;border-radius:50%;background:#7fd1b9"></i><span>Aprovechables · contenedor blanco (1.100 L)</span><b style="font:400 12px 'JetBrains Mono',monospace;color:#f2c995">${api.aprov.toLocaleString('es-CO')}</b>
      <i style="width:10px;height:10px;border-radius:50%;background:#a78bfa"></i><span>No aprovechables · contenedor negro (2.400 L)</span><b style="font:400 12px 'JetBrains Mono',monospace;color:#f2c995">${api.noAprov.toLocaleString('es-CO')}</b>
    </div>
    <div style="margin-top:8px;color:#9aa2a7;font-size:11px">Las líneas unen cada contenedor con el más cercano de su tipo: muestran la red, no la ruta de los camiones.</div>
    <div style="margin-top:6px;color:#646c71;font:400 10px 'JetBrains Mono',monospace">Fuente: UAESP / IDECA · Contenerización, Kennedy</div>`;
}
