/* ============ ACTOR: colectivo «Salvemos el Bosque Bavaria» en Bavaria Común (E1) ============
   Al prender Bavaria Común: el logo del colectivo flota sobre el predio como actor del territorio, y un diagrama de actores
   muestra su papel: del colectivo salen las asambleas y la gobernanza comunitaria del Instituto Biotecnológico de Bavaria Común,
   que forma, investiga y emite bioinsumos hacia la red de huertas, las tiendas de barrio, los humedales y Corabastos. */
export async function crearColectivo({ THREE, T3, lw }) {
  const BV = await (window.cargarJSON || ((u) => fetch(u).then(r => r.json())))('data3d/bavaria.json?v=3');
  let x = 0, z = 0; for (const p of BV.sitio) { const w = lw(p[0], p[1]); x += w[0]; z += w[1]; } x /= BV.sitio.length; z /= BV.sitio.length;
  // logo en el territorio: placa circular siempre de frente, con su poste de luz hasta el suelo
  const tex = new THREE.TextureLoader().load('data3d/logo_bosque_bavaria.png'); tex.colorSpace = THREE.SRGBColorSpace;
  const grupo = new THREE.Group(); grupo.visible = false; T3.scene.add(grupo);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true })); sp.position.set(x, 150, z); sp.scale.set(60, 60, 1); sp.renderOrder = 20; grupo.add(sp);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([x, 2, z, x, 118, z], 3));
  grupo.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0x2fa35a, transparent: true, opacity: 0.8 })));
  // diagrama de actores
  const css = document.createElement('style'); css.textContent = `
#cb-diag{position:fixed;z-index:12;right:14px;top:14px;width:min(430px,calc(100vw - 28px));display:none;padding:16px 16px 12px;border-radius:14px;background:rgba(8,16,12,.9);border:1px solid rgba(47,163,90,.45);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);color:#e6f2ea;font:12px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif}
#cb-diag h3{margin:0 0 2px;font-size:11px;letter-spacing:.32em;text-transform:uppercase;color:#7fd39b;font-weight:700}
#cb-diag h4{margin:0 0 8px;font-size:16px;font-weight:800;color:#fff}
#cb-diag p{margin:8px 0 0;color:#b9cfc0;font-size:11.5px}
#cb-diag svg{display:block;width:100%;height:auto}
#cb-diag .x{position:absolute;right:10px;top:10px;width:26px;height:26px;border-radius:8px;border:1px solid rgba(127,211,155,.35);background:none;color:#b9cfc0;cursor:pointer}
@media(max-width:760px){#cb-diag{top:auto;bottom:10px;left:10px;right:10px;width:auto;max-height:55vh;overflow:auto}}`;
  document.head.appendChild(css);
  const N = [ // [x, y, texto, color] en un lienzo de 400 x 300; el colectivo al centro
    [200, 52, 'Asambleas vecinales', '#7fd39b'], [318, 112, 'Instituto Biotecnológico\nBavaria Común', '#f2c94c'], [345, 205, 'Red de huertas\n(viviendas y cubiertas)', '#5fd38d'],
    [250, 272, 'Tiendas de barrio', '#f2994a'], [120, 270, 'Corabastos\n(menos fletes)', '#eb5757'], [52, 190, 'Humedales\nLa Vaca y El Burro', '#56ccf2'], [70, 85, 'Laboratorios\nagroecológicos', '#bb6bd9']];
  const A = [[0, 1, 'gobernanza'], [6, 1, 'investigación'], [1, 2, 'humus e inoculantes'], [2, 3, 'excedentes'], [3, 4, 'menos dependencia'], [2, 5, 'polinización'], [0, 6, 'formación']];
  const txt = (s, x, y) => s.split('\n').map((l, i, a) => `<text x="${x}" y="${y + (i - (a.length - 1) / 2) * 11}" text-anchor="middle" fill="#e6f2ea" font-size="9.5" font-weight="600">${l}</text>`).join('');
  let svg = '<svg viewBox="0 0 400 300"><defs><marker id="cb-f" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" fill="#7fd39b"/></marker></defs>';
  for (const n of N) svg += `<line x1="200" y1="160" x2="${n[0]}" y2="${n[1]}" stroke="#2fa35a" stroke-width="1.4" stroke-dasharray="3 3" opacity=".75"/>`;
  for (const [a, b, t] of A) { const p = N[a], q = N[b]; svg += `<line x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}" stroke="${q[3]}" stroke-width="1.2" opacity=".85" marker-end="url(#cb-f)"/><text x="${(p[0] + q[0]) / 2}" y="${(p[1] + q[1]) / 2 - 3}" text-anchor="middle" fill="#9fb8a8" font-size="7.5">${t}</text>`; }
  for (const n of N) svg += `<circle cx="${n[0]}" cy="${n[1]}" r="6" fill="${n[3]}" stroke="#08100c" stroke-width="2"/>` + txt(n[2], n[0], n[1] + (n[1] > 160 ? 20 : -16));
  svg += '<circle cx="200" cy="160" r="44" fill="#1c6034" stroke="#7fd39b" stroke-width="2"/><image href="data3d/logo_bosque_bavaria.png" x="158" y="118" width="84" height="84"/></svg>';
  const d = document.createElement('div'); d.id = 'cb-diag';
  d.innerHTML = `<button class="x" aria-label="Cerrar">✕</button><h3>Actor · E1 Bavaria Común</h3><h4>Colectivo Salvemos el Bosque Bavaria</h4>${svg}<p>La comunidad que defiende el bosque no solo busca detener la urbanización: quiere recuperar el control sobre su salud, el aire y un espacio propio para encontrarse. En la propuesta, el colectivo autoorganiza las asambleas y los laboratorios del Instituto Biotecnológico, que emite conocimiento y bioinsumos hacia la red de huertas y reduce la presión sobre Corabastos.</p>`;
  document.body.appendChild(d); d.querySelector('.x').onclick = () => { d.style.display = 'none'; };
  return { ver: (on) => { grupo.visible = on; } // el diagrama ahora es la red de gobernanza de E1 (data3d/red_gobernanza.js) };
}
