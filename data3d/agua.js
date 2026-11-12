/* ============ AGUA COMUNITARIA · existente y propuesta (data3d/agua.json, tools/agua_build.py) ============
   EXISTENTE (pin verde con gota): las 5 huertas comunitarias de la Ruta Agroecológica de Kennedy (Jardín Botánico), donde la
   comunidad gestiona el agua de riego; Monterrey recoge agua lluvia. En Kennedy no hay acueductos comunitarios.
   PROPUESTA (punto azul + arco azul): cisternas de agua lluvia en las cubiertas de los conjuntos en altura; el excedente va por el
   arco a la huerta comunitaria más cercana. Empieza apagada: interruptor "Agua comunitaria". */
export async function crearAgua({ THREE, T3 }) {
  const D = await (await fetch('data3d/agua.json?v=1')).json();
  const g = new THREE.Group(); g.name = 'agua-comunitaria'; g.visible = false; T3.scene.add(g);
  const Y = (x, z) => { const a = T3.alzaVia ? T3.alzaVia(x, z) : 0; return (T3.viaY != null ? T3.viaY : 0.62) + (isFinite(a) ? a : 0); };
  // pin de huerta existente: gota verde con hoja
  const cv = document.createElement('canvas'); cv.width = 128; cv.height = 160; const q = cv.getContext('2d');
  q.fillStyle = '#5fd38d'; q.strokeStyle = '#08200f'; q.lineWidth = 6; q.beginPath(); q.arc(64, 58, 50, Math.PI * 0.82, Math.PI * 2.18); q.lineTo(64, 152); q.closePath(); q.fill(); q.stroke();
  q.fillStyle = '#0b3a5c'; q.beginPath(); q.moveTo(64, 24); q.bezierCurveTo(84, 50, 90, 62, 90, 72); q.arc(64, 72, 26, 0, Math.PI); q.bezierCurveTo(38, 62, 44, 50, 64, 24); q.fill();
  const mp = new THREE.SpriteMaterial({ map: Object.assign(new THREE.CanvasTexture(cv), { colorSpace: THREE.SRGBColorSpace }), depthTest: false, depthWrite: false, sizeAttenuation: false, toneMapped: false });
  for (const h of D.huertas) { const [x, z] = h.p, s = new THREE.Sprite(mp); s.center.set(0.5, 0); s.scale.set(0.03, 0.0375, 1); s.position.set(x, Y(x, z) + 2, z); s.renderOrder = 9; g.add(s); }
  // cisternas propuestas: punto azul (tamaño según cuántos conjuntos agrupa)
  const AZ = new THREE.Color('#4cc3ff'), n = D.cisternas.length, pos = new Float32Array(n * 3), tam = new Float32Array(n);
  D.cisternas.forEach((c, i) => { pos.set([c[0], Y(c[0], c[1]) + 30, c[1]], i * 3); tam[i] = Math.min(2.2, 1 + c[3] / 12); });
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); pg.setAttribute('tam', new THREE.BufferAttribute(tam, 1));
  const pm = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, depthTest: false, toneMapped: false, uniforms: { c: { value: AZ } },
    vertexShader: 'attribute float tam; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = clamp(5200.0 / -mv.z, 8.0, 20.0) * tam; }',
    fragmentShader: 'uniform vec3 c; void main(){ float r = length(gl_PointCoord - 0.5); if (r > 0.5) discard; float anillo = smoothstep(0.5, 0.42, r) * smoothstep(0.26, 0.34, r); float centro = smoothstep(0.24, 0.16, r); gl_FragColor = vec4(c, max(anillo, centro * 0.9)); }' });
  const pts = new THREE.Points(pg, pm); pts.renderOrder = 8; pts.frustumCulled = false; g.add(pts);
  // arcos: agua lluvia que va de la cisterna a la huerta comunitaria
  const ap = new Float32Array(n * 6); D.cisternas.forEach((c, i) => { const h = D.huertas[c[2]].p; ap.set([c[0], Y(c[0], c[1]) + 30, c[1], h[0], Y(h[0], h[1]) + 3, h[1]], i * 6); });
  g.add(await (await import('./red_resaltada.js?v=2')).redResaltada({ THREE, T3, pos: ap, color: AZ, ancho: 2, arco: 0.18 }));
  // ficha al pasar el cursor por una huerta
  const tip = document.createElement('div'); tip.style.cssText = 'position:fixed;z-index:45;display:none;pointer-events:none;max-width:240px;background:rgba(13,15,18,.9);border:1px solid rgba(95,211,141,.45);border-radius:8px;padding:7px 9px;color:#e9ebec;font:11px/1.4 Inter,system-ui,sans-serif'; document.body.appendChild(tip);
  const v = new THREE.Vector3(), el = T3.renderer.domElement;
  el.addEventListener('pointermove', (ev) => { if (!g.visible) { tip.style.display = 'none'; return; } const r = el.getBoundingClientRect(); let b = -1, bd = 22;
    D.huertas.forEach((h, i) => { v.set(h.p[0], Y(h.p[0], h.p[1]) + 20, h.p[1]).project(T3.camera); if (v.z > 1) return; const d = Math.hypot((v.x + 1) / 2 * r.width + r.left - ev.clientX, (1 - v.y) / 2 * r.height + r.top - ev.clientY); if (d < bd) { bd = d; b = i; } });
    if (b < 0) { tip.style.display = 'none'; return; } const h = D.huertas[b], nc = D.cisternas.filter(c => c[2] === b).reduce((a, c) => a + c[3], 0);
    tip.innerHTML = `<b style="color:#8fe3ae">${h.n}</b><br><span style="color:#9aa2a7">${h.dir} · existente</span>${h.agua ? `<br><span style="color:#4cc3ff">${h.agua}</span>` : ''}${nc ? `<br><span style="color:#9aa2a7">Propuesta: le llegaría agua lluvia de ${nc} conjuntos</span>` : ''}`;
    tip.style.display = 'block'; tip.style.left = (ev.clientX + 14) + 'px'; tip.style.top = (ev.clientY + 10) + 'px'; });
  return { grupo: g, huertas: D.huertas.length, conjuntos: D.cisternas.reduce((a, c) => a + c[3], 0), ver(on) { g.visible = on; if (!on) tip.style.display = 'none'; } };
}

export function panelAgua(api, on) {
  let el = document.getElementById('agua-panel');
  if (!on) { if (el) el.remove(); return; }
  if (!el) { el = document.createElement('div'); el.id = 'agua-panel'; document.body.appendChild(el); }
  el.style.cssText = 'position:fixed;left:' + (innerWidth > 760 ? 290 : 8) + 'px;bottom:96px;z-index:40;width:min(250px,calc(100vw - 32px));background:rgba(13,15,18,.8);border:1px solid rgba(255,255,255,.075);border-radius:10px;padding:9px 11px;color:#e9ebec;font:10.5px/1.35 Inter,system-ui,sans-serif;-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px)';
  el.innerHTML = `<div style="font:500 9px 'JetBrains Mono',monospace;letter-spacing:.14em;color:#646c71;text-transform:uppercase;margin-bottom:7px">Agua comunitaria</div>
    <div style="display:grid;grid-template-columns:18px 1fr;gap:6px 8px;align-items:start">
      <svg viewBox="0 0 128 160" width="16" height="20"><path d="M64 152 L24 92 A50 50 0 1 1 104 92 Z" fill="#5fd38d" stroke="#08200f" stroke-width="6"/><path d="M64 26 C84 50 90 62 90 72 A26 26 0 0 1 38 72 C38 62 44 50 64 26 Z" fill="#0b3a5c"/></svg>
      <div><b style="font-weight:500">Existente · huerta comunitaria (${api.huertas})</b><div style="color:#9aa2a7;font-size:10px">La comunidad gestiona el agua de riego. Monterrey recoge agua lluvia. En Kennedy no hay acueductos comunitarios.</div></div>
      <svg viewBox="0 0 22 22" width="16" height="16"><circle cx="11" cy="11" r="8" fill="none" stroke="#4cc3ff" stroke-width="3"/><circle cx="11" cy="11" r="3" fill="#4cc3ff"/></svg>
      <div><b style="font-weight:500;color:#9fdcff">Propuesta · cisterna de agua lluvia</b><div style="color:#9aa2a7;font-size:10px">En la cubierta de los conjuntos (${api.conjuntos}). El arco azul lleva el excedente a la huerta más cercana; la administran las juntas.</div></div>
    </div>
    <div style="margin-top:6px;color:#646c71;font:400 9px 'JetBrains Mono',monospace">Fuente: Ruta Agroecológica Kennedy (JBB 2022) · datos abiertos Bogotá</div>`;
}
