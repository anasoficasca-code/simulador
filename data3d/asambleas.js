/* ============ ASAMBLEAS EXISTENTES · Juntas de Acción Comunal de Kennedy (IDPAC) ============
   185 juntas con su sede (dirección) y su horario de atención/asamblea. Cada una: punto dorado visible de lejos y, de cerca,
   un marcador en la sede; la red une cada junta con la más cercana (lectura de vecindad). Pasar el cursor muestra nombre,
   dirección y horario. Empieza apagada: interruptor "Asambleas (JAC)". */
export async function crearAsambleas({ THREE, T3 }) {
  const D = await (await fetch('data3d/asambleas.json?v=1')).json();
  const g = new THREE.Group(); g.name = 'asambleas'; g.visible = false; T3.scene.add(g);
  const Y = (x, z) => { const a = T3.alzaVia ? T3.alzaVia(x, z) : 0; return (T3.viaY != null ? T3.viaY : 0.62) + (isFinite(a) ? a : 0); };
  const COL = new THREE.Color('#e9c46a');
  // marcador en la sede: poste y disco
  const geo = new THREE.CylinderGeometry(2.2, 2.2, 0.5, 18).translate(0, 9, 0), poste = new THREE.CylinderGeometry(0.18, 0.18, 9, 6).translate(0, 4.5, 0);
  const mat = new THREE.MeshStandardMaterial({ color: COL, emissive: COL, emissiveIntensity: 0.5, roughness: 0.5 }), matP = new THREE.MeshStandardMaterial({ color: 0x2b2f33 });
  const disco = new THREE.InstancedMesh(geo, mat, D.p.length), postes = new THREE.InstancedMesh(poste, matP, D.p.length), o = new THREE.Object3D();
  D.p.forEach((p, i) => { o.position.set(p[0], Y(p[0], p[1]), p[1]); o.updateMatrix(); disco.setMatrixAt(i, o.matrix); postes.setMatrixAt(i, o.matrix); });
  g.add(disco, postes);
  // punto visible de lejos
  const pos = new Float32Array(D.p.length * 3); D.p.forEach((p, i) => pos.set([p[0], Y(p[0], p[1]) + 12, p[1]], i * 3));
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pm = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, depthTest: false, toneMapped: false, uniforms: { c: { value: COL } },
    vertexShader: 'void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = clamp(7200.0 / -mv.z, 11.0, 28.0); }',
    fragmentShader: 'uniform vec3 c; void main(){ vec2 d = gl_PointCoord - 0.5; float r = length(d); if (r > 0.5) discard; float a = smoothstep(0.5, 0.38, r); float borde = smoothstep(0.28, 0.36, r) * (1.0 - smoothstep(0.42, 0.5, r)); gl_FragColor = vec4(mix(c, vec3(0.08), borde * 0.7), a); }' });
  const pts = new THREE.Points(pg, pm); pts.renderOrder = 6; pts.frustumCulled = false; g.add(pts);
  // red de vecindad
  const lp = new Float32Array(D.e.length * 6); D.e.forEach(([a, b], k) => { const A = D.p[a], B = D.p[b]; lp.set([A[0], Y(A[0], A[1]) + 12, A[1], B[0], Y(B[0], B[1]) + 12, B[1]], k * 6); });
  const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(lp, 3));
  g.add(await (await import('./red_resaltada.js?v=1')).redResaltada({ THREE, T3, pos: lp, color: COL, ancho: 3 })); /* red resaltada: grosor real, halo y pulsos */
  // ficha al pasar el cursor
  const tip = document.createElement('div'); tip.style.cssText = 'position:fixed;z-index:45;display:none;pointer-events:none;max-width:260px;background:rgba(13,15,18,.9);border:1px solid rgba(233,196,106,.4);border-radius:8px;padding:8px 10px;color:#e9ebec;font:12px/1.4 Inter,system-ui,sans-serif'; document.body.appendChild(tip);
  const v = new THREE.Vector3(), cv = T3.renderer.domElement;
  const mover = (ev) => { if (!g.visible) { tip.style.display = 'none'; return; } const r = cv.getBoundingClientRect(); let b = -1, bd = 14;
    D.p.forEach((p, i) => { v.set(p[0], pos[i * 3 + 1], p[1]).project(T3.camera); if (v.z > 1) return; const x = (v.x + 1) / 2 * r.width + r.left, y = (1 - v.y) / 2 * r.height + r.top, d = Math.hypot(x - ev.clientX, y - ev.clientY); if (d < bd) { bd = d; b = i; } });
    if (b < 0) { tip.style.display = 'none'; return; } const p = D.p[b];
    tip.innerHTML = `<b style="color:#f2d58f">JAC ${p[2]}</b><br><span style="color:#9aa2a7">${p[3]}</span>${p[4] ? `<br><span style="color:#9aa2a7">${p[4]}</span>` : ''}`; tip.style.display = 'block'; tip.style.left = (ev.clientX + 14) + 'px'; tip.style.top = (ev.clientY + 10) + 'px'; };
  cv.addEventListener('pointermove', mover);
  return { grupo: g, total: D.p.length, ver(on) { g.visible = on; if (!on) tip.style.display = 'none'; } };
}

export function panelAsambleas(api, on) {
  let el = document.getElementById('asam-panel');
  if (!on) { if (el) el.remove(); return; }
  if (!el) { el = document.createElement('div'); el.id = 'asam-panel'; document.body.appendChild(el); }
  el.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:96px;z-index:40;width:min(380px,calc(100vw - 32px));background:rgba(13,15,18,.78);border:1px solid rgba(255,255,255,.075);border-radius:12px;padding:12px 14px;color:#e9ebec;font:12px/1.45 Inter,system-ui,sans-serif;-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px)';
  el.innerHTML = `<div style="font:500 9.5px 'JetBrains Mono',monospace;letter-spacing:.16em;color:#646c71;text-transform:uppercase;margin-bottom:8px">Asambleas existentes · Juntas de Acción Comunal</div>
    <div style="display:flex;align-items:center;gap:10px"><i style="width:10px;height:10px;border-radius:50%;background:#e9c46a;flex:none"></i><span style="flex:1">Juntas de Acción Comunal en Kennedy (sede)</span><b style="font:400 12px 'JetBrains Mono',monospace;color:#f2c995">${api.total}</b></div>
    <div style="margin-top:8px;color:#9aa2a7;font-size:11px">Cada junta realiza su asamblea de afiliados. Pasa el cursor por un punto para ver nombre, dirección y horario. Las líneas unen cada junta con la más cercana: muestran la vecindad, no una red formal.</div>
    <div style="margin-top:6px;color:#646c71;font:400 10px 'JetBrains Mono',monospace">Fuente: IDPAC · Organizaciones comunales Bogotá D.C.</div>`;
}
