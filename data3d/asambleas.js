/* ============ ASAMBLEAS EXISTENTES · Juntas de Acción Comunal de Kennedy (IDPAC) ============
   185 juntas con su sede (dirección) y su horario de atención/asamblea. Cada una: punto dorado visible de lejos y, de cerca,
   un marcador en la sede; la red une cada junta con la más cercana (lectura de vecindad). Pasar el cursor muestra nombre,
   dirección y horario. Empieza apagada: interruptor "Asambleas (JAC)". */
export const TEMAS_COL = ['#7ddc8a', '#ff6b8b', '#f4a259', '#5aa9ff', '#c792ea', '#f6d55c', '#4fd1c5', '#e0e0e0'];
export async function crearAsambleas({ THREE, T3 }) {
  const D = await (await fetch('data3d/asambleas.json?v=3')).json();
  const g = new THREE.Group(); g.name = 'asambleas'; g.visible = false; T3.scene.add(g);
  const Y = (x, z) => { const a = T3.alzaVia ? T3.alzaVia(x, z) : 0; return (T3.viaY != null ? T3.viaY : 0.62) + (isFinite(a) ? a : 0); };
  const COL = new THREE.Color('#e9c46a');
  // PIN en la sede de cada junta: gota dorada con el símbolo de asamblea (tres personas), tamaño fijo en pantalla
  const cvp = document.createElement('canvas'); cvp.width = 128; cvp.height = 160; const q = cvp.getContext('2d');
  q.fillStyle = '#e9c46a'; q.strokeStyle = '#1b1407'; q.lineWidth = 6; q.beginPath(); q.arc(64, 58, 50, Math.PI * 0.82, Math.PI * 2.18); q.lineTo(64, 152); q.closePath(); q.fill(); q.stroke();
  q.fillStyle = '#1b1407'; for (const [x, s] of [[44, 0.8], [84, 0.8], [64, 1]]) { q.beginPath(); q.arc(x, 44 + (1 - s) * 10, 9 * s, 0, 7); q.fill(); q.beginPath(); q.ellipse(x, 74 + (1 - s) * 8, 15 * s, 12 * s, 0, Math.PI, 0); q.fill(); }
  const tp = new THREE.CanvasTexture(cvp); tp.colorSpace = THREE.SRGBColorSpace;
  const mp = new THREE.SpriteMaterial({ map: tp, depthTest: false, depthWrite: false, sizeAttenuation: false, toneMapped: false });
  const pos = new Float32Array(D.p.length * 3);
  D.p.forEach((p, i) => { const y = Y(p[0], p[1]); pos.set([p[0], y + 2, p[1]], i * 3); const s = new THREE.Sprite(mp); s.center.set(0.5, 0); s.scale.set(0.022, 0.0275, 1); s.position.set(p[0], y + 2, p[1]); s.renderOrder = 9; g.add(s); });
  /* red con significado: juntas unidas por trabajar el mismo tema (comisión de trabajo), color por tema */
  const TC = TEMAS_COL.map(h => new THREE.Color(h)), lp = new Float32Array(D.e.length * 6), lcol = new Float32Array(D.e.length * 6);
  D.e.forEach(([a, b, t], k) => { const A = D.p[a], B = D.p[b], cc = TC[t]; lp.set([A[0], Y(A[0], A[1]) + 3, A[1], B[0], Y(B[0], B[1]) + 3, B[1]], k * 6); lcol.set([cc.r, cc.g, cc.b, cc.r, cc.g, cc.b], k * 6); });
  const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(lp, 3));
  g.add(await (await import('./red_resaltada.js?v=2')).redResaltada({ THREE, T3, pos: lp, colores: lcol, ancho: 2.4, arco: 0.22 })); /* red resaltada: grosor real, halo y pulsos */
  // ficha al pasar el cursor
  const tip = document.createElement('div'); tip.style.cssText = 'position:fixed;z-index:45;display:none;pointer-events:none;max-width:260px;background:rgba(13,15,18,.9);border:1px solid rgba(233,196,106,.4);border-radius:8px;padding:8px 10px;color:#e9ebec;font:12px/1.4 Inter,system-ui,sans-serif'; document.body.appendChild(tip);
  const v = new THREE.Vector3(), cv = T3.renderer.domElement;
  const mover = (ev) => { if (!g.visible) { tip.style.display = 'none'; return; } const r = cv.getBoundingClientRect(); let b = -1, bd = 14;
    D.p.forEach((p, i) => { v.set(p[0], pos[i * 3 + 1], p[1]).project(T3.camera); if (v.z > 1) return; const x = (v.x + 1) / 2 * r.width + r.left, y = (1 - v.y) / 2 * r.height + r.top, d = Math.hypot(x - ev.clientX, y - ev.clientY); if (d < bd) { bd = d; b = i; } });
    if (b < 0) { tip.style.display = 'none'; return; } const p = D.p[b];
    tip.innerHTML = `<b style="color:#f2d58f">JAC ${p[2]}</b><br><span style="color:#9aa2a7">${p[3]}</span>${p[4] ? `<br><span style="color:#9aa2a7">${p[4]}</span>` : ''}<br><span style="color:#cfd4d7">Asamblea de afiliados · junta directiva · conciliación · delegados a Asojuntas</span>${p[5] && p[5].length ? `<br><span style="color:#f2d58f">Comisiones:</span> ${p[5].join(', ')}` : ''}`; tip.style.display = 'block'; tip.style.left = (ev.clientX + 14) + 'px'; tip.style.top = (ev.clientY + 10) + 'px'; };
  cv.addEventListener('pointermove', mover);
  const cuenta = D.temas.map((_, k) => D.p.filter(p => p[6] && p[6].includes(k)).length);
  return { grupo: g, total: D.p.length, temas: D.temas, cuenta, ver(on) { g.visible = on; if (!on) tip.style.display = 'none'; } };
}

export function panelAsambleas(api, on) {
  let el = document.getElementById('asam-panel');
  if (!on) { if (el) el.remove(); return; }
  if (!el) { el = document.createElement('div'); el.id = 'asam-panel'; document.body.appendChild(el); }
  el.style.cssText = 'position:fixed;left:' + (innerWidth > 760 ? 290 : 8) + 'px;bottom:96px;z-index:40;width:min(250px,calc(100vw - 32px));max-height:46vh;overflow:auto;scrollbar-width:none;background:rgba(13,15,18,.8);border:1px solid rgba(255,255,255,.075);border-radius:10px;padding:9px 11px;color:#e9ebec;font:10.5px/1.35 Inter,system-ui,sans-serif;-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px)';
  el.innerHTML = `<div style="font:500 9.5px 'JetBrains Mono',monospace;letter-spacing:.16em;color:#646c71;text-transform:uppercase;margin-bottom:8px">Asambleas existentes · Juntas de Acción Comunal</div>
    <div style="display:grid;grid-template-columns:22px 1fr;gap:6px 10px;align-items:start">
      <svg viewBox="0 0 128 160" width="18" height="22"><path d="M64 152 L24 92 A50 50 0 1 1 104 92 Z" fill="#e9c46a" stroke="#1b1407" stroke-width="6"/><circle cx="64" cy="48" r="10" fill="#1b1407"/><circle cx="44" cy="52" r="7" fill="#1b1407"/><circle cx="84" cy="52" r="7" fill="#1b1407"/></svg>
      <div><b style="font-weight:500">Pin · Junta de Acción Comunal (${api.total})</b><div style="color:#9aa2a7;font-size:10px">Asamblea barrial existente: los vecinos deciden sobre el barrio. En su sede.</div></div>
      <svg viewBox="0 0 22 12" width="22" height="12"><path d="M1 11 Q11 -5 21 11" fill="none" stroke="#cfd4d7" stroke-width="2"/></svg>
      <div><b style="font-weight:500">Arco · trabajan el mismo tema</b><div style="color:#9aa2a7;font-size:10px">Juntas con la misma comisión de trabajo. Color = tema:</div></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr;gap:2px;margin-top:6px;font-size:10px">${api.temas.map((t, k) => `<div style="display:flex;align-items:center;gap:6px"><i style="width:14px;height:3px;border-radius:2px;background:${TEMAS_COL[k]};flex:none"></i><span style="flex:1">${t}</span><span style="color:#9aa2a7">${api.cuenta[k]}</span></div>`).join('')}</div>
    
    <div style="margin-top:6px;color:#646c71;font:400 10px 'JetBrains Mono',monospace">Fuente: IDPAC · Organizaciones comunales (2021) y Dignatarios activos (2022)</div>`;
}
