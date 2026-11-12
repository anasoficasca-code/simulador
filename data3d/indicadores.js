/* ============ INDICADORES EN 3D (los picos de https://anasoficasca-code.github.io/picos/) ============
   Cada indicador es una superficie de picos sobre Kennedy: más alto y más intenso = valor más alto (0 a 1), con la rampa de color
   de las láminas. Datos: data3d/indicadores/*.json (tools/indicadores_extraer.js). Marco de picos (x este, y norte, m) ->
   mundo del simulador: giro de -28,1° y desplazamiento (1692, -588), alineado con 409 de 446 edificios altos. Botón "Indicadores": empieza apagado. */
export async function crearIndicadores({ THREE, T3 }) {
  const I = await (await fetch('data3d/indicadores/index.json?v=2')).json();
  const g = new THREE.Group(); g.name = 'indicadores'; g.visible = false; T3.scene.add(g);
  const dec = (b) => { const s = atob(b), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; };
  const mallas = new Map(); let alto = 0.3, sel = null, anio = false;
  async function malla(f) {
    if (mallas.has(f)) return mallas.get(f);
    const d = await (await fetch('data3d/indicadores/' + f + '?v=1')).json();
    const q = new Uint16Array(dec(d.pos).buffer), n = d.nV, [x0, x1, y0, y1, zlo, zhi] = d.b, zs = zhi - zlo;
    const pos = new Float32Array(n * 3), z = new Float32Array(n);
    const ra = (I.rot || 0) * Math.PI / 180, cs = Math.cos(ra), sn = Math.sin(ra); /* la lámina está girada respecto al norte */
    for (let k = 0; k < n; k++) { const x = x0 + q[k * 3] / 65535 * (x1 - x0), zz = -(y0 + q[k * 3 + 1] / 65535 * (y1 - y0)); pos[k * 3] = x * cs - zz * sn + I.ox; pos[k * 3 + 2] = x * sn + zz * cs + I.oz; z[k] = q[k * 3 + 2] / 65535 * zs; }
    const cu = dec(d.col), qi = new Uint16Array(dec(d.idx).buffer), idx = new Uint32Array(d.nF * 6);
    for (let f2 = 0; f2 < d.nF; f2++) { const a = qi[f2 * 4], b = qi[f2 * 4 + 1], c = qi[f2 * 4 + 2], e = qi[f2 * 4 + 3]; idx.set([a, c, b, a, e, c], f2 * 6); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setIndex(new THREE.BufferAttribute(idx, 1));
    const col = new Float32Array(n * 3); for (let k = 0; k < n * 3; k++) col[k] = Math.pow(cu[k] / 255, 2.2); /* rampa de las láminas (sRGB -> lineal) */
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide, transparent: true, opacity: 0.9, emissive: 0xffffff, emissiveIntensity: 0, toneMapped: false }));
    /* sombreado suave: color propio + algo de luz del sol para leer el relieve */
    m.material.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <opaque_fragment>', 'outgoingLight = mix(diffuseColor.rgb, outgoingLight, 0.45);\n#include <opaque_fragment>'); };
    m.frustumCulled = false; m.renderOrder = 3; m.userData = { z, d };
    const M = { mesh: m, d, z }; mallas.set(f, M); return M;
  }
  function elevar(M) {
    const p = M.mesh.geometry.attributes.position.array, z = M.z, base = (T3.viaY != null ? T3.viaY : 0.6) + 2;
    for (let k = 0; k < z.length; k++) p[k * 3 + 1] = base + z[k] * alto;
    M.mesh.geometry.attributes.position.needsUpdate = true; M.mesh.geometry.computeVertexNormals(); M.mesh.geometry.computeBoundingSphere();
  }
  const api = {
    lista: I.lista.filter(x => !x.year), tiene2020: (code) => I.lista.some(x => x.code === code && x.year),
    get sel() { return sel; }, get anio() { return anio; }, get alto() { return alto; },
    async mostrar(code, en2020) {
      sel = code; anio = !!en2020 && api.tiene2020(code);
      for (const M of mallas.values()) M.mesh.visible = false;
      if (!code) return null;
      const it = I.lista.find(x => x.code === code && (anio ? x.year : !x.year)); const M = await malla(it.f);
      if (sel !== code) return null; /* se eligió otro mientras cargaba */
      if (!M.mesh.parent) g.add(M.mesh); elevar(M); M.mesh.visible = true; return it;
    },
    altura(v) { alto = v; for (const M of mallas.values()) if (M.mesh.visible) elevar(M); },
    ver(on) { g.visible = on; }
  };
  return api;
}

export function panelIndicadores(api, on) {
  let el = document.getElementById('ind-panel');
  if (!on) { if (el) el.remove(); return; }
  if (!el) { el = document.createElement('div'); el.id = 'ind-panel'; document.body.appendChild(el); }
  el.style.cssText = 'position:fixed;left:' + (innerWidth > 760 ? 290 : 8) + 'px;bottom:96px;z-index:41;width:min(262px,calc(100vw - 32px));max-height:calc(100vh - 200px);overflow:auto;background:rgba(13,15,18,.86);border:1px solid rgba(255,255,255,.075);border-radius:10px;padding:9px 11px;color:#e9ebec;font:10.5px/1.35 Inter,system-ui,sans-serif;-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px)';
  const grad = (r) => 'linear-gradient(to top,' + r.join(',') + ')', gradH = (r) => 'linear-gradient(90deg,' + r.join(',') + ')';
  const pintar = () => {
    const it = api.lista.find(x => x.code === api.sel), t2 = api.sel && api.tiene2020(api.sel);
    el.innerHTML = `<div style="font:500 9px 'JetBrains Mono',monospace;letter-spacing:.14em;color:#646c71;text-transform:uppercase;margin-bottom:7px">Indicadores</div>
      <div style="display:grid;gap:4px">${api.lista.map(x => `<button data-c="${x.code}" style="position:relative;display:flex;align-items:center;gap:7px;width:100%;text-align:left;padding:6px 8px 6px 14px;background:${x.code === api.sel ? 'rgba(255,255,255,.1)' : 'rgba(255,255,255,.03)'};border:1px solid ${x.code === api.sel ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.08)'};border-radius:7px;color:#e9ebec;font:inherit;cursor:pointer;overflow:hidden"><i style="position:absolute;left:0;top:0;bottom:0;width:6px;background:${grad(x.ramp)}"></i><b style="font:500 10px 'JetBrains Mono',monospace;min-width:30px;color:#fff">${x.code}</b><span>${x.name.replace(/\s*\([A-Z]+\)\s*$/, '')}</span></button>`).join('')}</div>
      ${it ? `<div style="margin-top:8px">${t2 ? `<div style="display:flex;border:1px solid rgba(255,255,255,.12);border-radius:7px;overflow:hidden;margin-bottom:7px">${['Actual', 'Antes 2020'].map((t, k) => `<button data-a="${k}" style="flex:1;padding:5px;border:0;font:inherit;cursor:pointer;background:${(k === 1) === api.anio ? '#e9ebec' : 'transparent'};color:${(k === 1) === api.anio ? '#0d0f12' : '#c9cdd0'}">${t}</button>`).join('')}</div>` : ''}
        <div style="height:8px;border-radius:2px;background:${gradH(it.ramp)}"></div>
        <div style="display:flex;justify-content:space-between;color:#9aa2a7;font:400 9.5px 'JetBrains Mono',monospace;margin-top:2px"><span>0 · bajo</span><span>0,5</span><span>1 · alto</span></div>
        <label style="display:flex;justify-content:space-between;color:#9aa2a7;margin-top:7px">Altura de los picos <span id="ind-av">${api.alto.toFixed(2)}×</span></label>
        <input id="ind-alt" type="range" min="0.05" max="1" step="0.05" value="${api.alto}" style="width:100%"></div>` : '<div style="margin-top:7px;color:#9aa2a7;font-size:10px">Elige un indicador: se levanta como picos sobre Kennedy (más alto = valor más alto).</div>'}
      <div style="margin-top:6px;color:#646c71;font:400 9px 'JetBrains Mono',monospace">Fuente: Indicadores en 3D · láminas del grupo</div>`;
    el.querySelectorAll('button[data-c]').forEach(b => b.onclick = async () => { const c = b.dataset.c === api.sel ? null : b.dataset.c; const p = api.mostrar(c, false); pintar(); await p; });
    el.querySelectorAll('button[data-a]').forEach(b => b.onclick = async () => { const p = api.mostrar(api.sel, b.dataset.a === '1'); pintar(); await p; });
    const r = el.querySelector('#ind-alt'); if (r) r.oninput = () => { api.altura(+r.value); el.querySelector('#ind-av').textContent = (+r.value).toFixed(2) + '×'; };
  };
  pintar();
}
