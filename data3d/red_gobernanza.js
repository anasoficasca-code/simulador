/* ============ REDES DE GOBERNANZA POR ESTRATEGIA (modo Kennedy) ============
   Al prender una estrategia se abre a un lado una red que se va armando por niveles:
   DECIDE (asambleas: órgano soberano) → ARTICULA (colectivos, juntas) → SABER (quien tiene el conocimiento: más poder = nodo más grande)
   → APLICA (hogares, cubiertas, tiendas) → INCENTIVOS (lo que recibe quien participa) → TERRITORIO (efecto de retorno).
   Las flechas llevan pulsos según el tipo de flujo: decisión, conocimiento, bioinsumos, alimento, incentivo, retorno.
   Gobernanza policéntrica y descentralizada (bottom-up), según el documento de la propuesta. Roles y vínculos: hipótesis de diseño. */
const NIV = [
  { k: 'decide', n: 'Deciden', c: '#ffd166' }, { k: 'articula', n: 'Articulan', c: '#7fd39b' }, { k: 'saber', n: 'Conocimiento · poder', c: '#b18cff' },
  { k: 'aplica', n: 'Aplican', c: '#56ccf2' }, { k: 'incentivo', n: 'Incentivos', c: '#ff8fb1' }, { k: 'efecto', n: 'Territorio', c: '#9ad1a8' }
];
const FLUJO = { decision: ['#ffd166', 'decisión'], saber: ['#b18cff', 'conocimiento'], insumo: ['#7fd39b', 'bioinsumos'], alimento: ['#f2994a', 'alimento'], incentivo: ['#ff8fb1', 'incentivo'], retorno: ['#9ad1a8', 'retorno'], residuo: ['#c9a27a', 'residuos'] };
// [id, nombre, nivel, poder 1-3, detalle]
const R = {
  E1: { t: 'Bavaria Común · Instituto Biotecnológico', s: 'Hub de conocimiento e innovación agroecológica: emite saberes y bioinsumos, no acopia alimentos.',
    n: [['asam', 'Asambleas Comunitarias Territoriales', 'decide', 3, 'Órgano soberano: voz y voto en igualdad; deciden prioridades con el diagnóstico de la comunidad (0,1 árboles por persona, aire contaminado)'],
      ['colec', 'Colectivo Salvemos el Bosque Bavaria', 'articula', 2, 'Articulador político y pedagógico: convoca asambleas y custodia la memoria de lucha por las 48,76 ha del bosque. No es dueño del espacio'],
      ['jac', 'Juntas de vecinos', 'articula', 2, 'Llevan las decisiones de la asamblea a cada barrio'],
      ['inst', 'Instituto Biotecnológico Bavaria Común', 'saber', 3, 'Escuela agroecológica comunitaria: laboratorios de inoculación de hongos y celdas de compostaje acelerado'],
      ['tec', 'Equipo técnico y facilitadores', 'saber', 3, 'Especialistas y académicos: soporte técnico inicial en bioprocesos'],
      ['prom', 'Cuidadores y promotores ambientales', 'saber', 2, 'Miembros de los colectivos que coordinan laboratorios y talleres'],
      ['lid', 'Líderes y delegados de barrio', 'aplica', 2, 'Formación de formadores: aprenden en el Instituto y enseñan en sus cuadras'],
      ['hog', 'Familias en viviendas', 'aplica', 1, 'Huertas hidropónicas y modulares en fachadas y patios'],
      ['conj', 'Conjuntos residenciales', 'aplica', 1, 'Huertas colectivas en cubiertas y azoteas'],
      ['tien', 'Tenderos de barrio', 'aplica', 1, 'Reciben excedentes en muebles de acopio y conservación'],
      ['i1', 'Humus e inoculantes gratis', 'incentivo', 1, 'Para las huertas que mantienen su producción activa'],
      ['i2', 'Roles: Cultivador → Bio-agricultor → Gestor de Red', 'incentivo', 1, 'Más estatus = más vocería en las asambleas'],
      ['i3', 'Créditos en la tienda', 'incentivo', 1, 'Los excedentes se cambian por productos de primera necesidad'],
      ['bos', '48,76 ha de bosque preservadas', 'efecto', 1, 'Pulmón ambiental de Kennedy'],
      ['cor', 'Menos presión sobre Corabastos', 'efecto', 1, 'Menos camiones, fletes y basura']],
    e: [['asam', 'inst', 'decision'], ['colec', 'asam', 'decision'], ['jac', 'asam', 'decision'], ['colec', 'inst', 'residuo'], ['tec', 'prom', 'saber'], ['inst', 'lid', 'saber'], ['prom', 'lid', 'saber'], ['lid', 'hog', 'saber'], ['lid', 'conj', 'saber'],
      ['inst', 'i1', 'insumo'], ['i1', 'hog', 'insumo'], ['i1', 'conj', 'insumo'], ['hog', 'tien', 'alimento'], ['conj', 'tien', 'alimento'], ['tien', 'i3', 'incentivo'], ['i3', 'hog', 'incentivo'], ['i2', 'asam', 'incentivo'], ['lid', 'i2', 'incentivo'],
      ['tien', 'cor', 'retorno'], ['inst', 'bos', 'retorno'], ['hog', 'inst', 'residuo']] },
  E2: { t: 'Tiendas Barriales', s: 'La tienda de esquina como nodo de acopio e intercambio micro-local.',
    n: [['asam', 'Asamblea de barrio', 'decide', 3, 'Acuerda precios justos y qué tiendas se vinculan'], ['ten', 'Red de tenderos', 'articula', 2, 'Coordinan el acopio entre tiendas cercanas'], ['inst', 'Instituto Bavaria Común', 'saber', 3, 'Enseña conservación, inocuidad y registro de excedentes'],
      ['tien', 'Tiendas de esquina', 'aplica', 2, 'Muebles de acopio y conservación'], ['hog', 'Huertas de las casas y cubiertas', 'aplica', 1, 'Entregan excedentes a 1–3 cuadras'], ['vec', 'Vecinos compradores', 'aplica', 1, 'Compran fresco sin ir a Corabastos'],
      ['i1', 'Créditos por excedentes', 'incentivo', 1, 'Cambio por productos de primera necesidad'], ['i2', 'Muebles de conservación', 'incentivo', 1, 'Dotación para las tiendas vinculadas'], ['e1', 'Menos fletes y congestión', 'efecto', 1, 'El alimento circula a escala de cuadra']],
    e: [['asam', 'ten', 'decision'], ['ten', 'tien', 'decision'], ['inst', 'tien', 'saber'], ['hog', 'tien', 'alimento'], ['tien', 'vec', 'alimento'], ['tien', 'i1', 'incentivo'], ['i1', 'hog', 'incentivo'], ['i2', 'tien', 'incentivo'], ['tien', 'e1', 'retorno']] },
  E3: { t: 'Corabastos reducido', s: 'La central se reduce y libera su borde con el humedal La Vaca.',
    n: [['asam', 'Asambleas y mesa con comerciantes', 'decide', 3, 'Concertan el desmonte de bodegas junto al humedal'], ['jac', 'Juntas de vecinos del borde', 'articula', 2, 'Vigilan el cumplimiento del plan'],
      ['tec', 'Equipo técnico de transformación', 'saber', 3, 'Diseño de la franja de restauración y patios de transferencia'], ['com', 'Comerciantes mayoristas', 'aplica', 2, 'Reorganizan la operación en menos bodegas'],
      ['ban', 'Banco de alimentos', 'aplica', 1, 'Recupera excedentes y pérdidas'], ['org', 'Orgánicos a compostaje', 'aplica', 1, 'Los residuos van al Instituto Bavaria Común'],
      ['i1', 'Ventanilla para productores pequeños', 'incentivo', 1, 'Acceso directo sin intermediarios'], ['e1', 'Borde de humedal restaurado', 'efecto', 1, 'Franja verde junto a La Vaca'], ['e2', 'Menos camiones pesados', 'efecto', 1, 'Tren y vehículos pequeños']],
    e: [['asam', 'tec', 'decision'], ['jac', 'asam', 'decision'], ['tec', 'com', 'saber'], ['com', 'ban', 'alimento'], ['com', 'org', 'residuo'], ['i1', 'com', 'incentivo'], ['tec', 'e1', 'retorno'], ['com', 'e2', 'retorno']] },
  E4: { t: 'Orgánicos y hongos', s: 'Los residuos leñosos y orgánicos se vuelven humus y biofertilizantes.',
    n: [['asam', 'Asamblea territorial', 'decide', 3, 'Define rutas de recolección y puntos de compostaje'], ['rec', 'Recicladores y gestores de residuos', 'articula', 2, 'Separan y transportan los orgánicos'],
      ['lab', 'Laboratorio de hongos (Bavaria Común)', 'saber', 3, 'Inoculación de hongos que degradan madera y aceleran el compostaje'], ['bio', 'Técnicos en bioprocesos', 'saber', 2, 'Control de calidad del humus'],
      ['hog', 'Hogares que separan', 'aplica', 1, 'Entregan residuos de cocina y poda'], ['hue', 'Huertas barriales', 'aplica', 1, 'Usan el humus y los inoculantes'],
      ['i1', 'Bioinsumos gratis', 'incentivo', 1, 'A cambio de residuos separados'], ['e1', 'Menos basura a relleno', 'efecto', 1, 'Residuos que vuelven al suelo']],
    e: [['asam', 'rec', 'decision'], ['hog', 'rec', 'residuo'], ['rec', 'lab', 'residuo'], ['bio', 'lab', 'saber'], ['lab', 'hue', 'insumo'], ['lab', 'i1', 'insumo'], ['i1', 'hog', 'incentivo'], ['lab', 'e1', 'retorno']] },
  E5: { t: 'Corredor biótico', s: 'Conectividad ecosistémica entre los humedales La Vaca, El Burro y Techo.',
    n: [['asam', 'Asambleas y mesas de humedal', 'decide', 3, 'Priorizan siembras y control de bordes'], ['col', 'Colectivos ambientales', 'articula', 2, 'Seguimiento y cuidado del humedal'],
      ['eco', 'Ecólogos y biólogos', 'saber', 3, 'Matriz vegetal nativa; mitigar el parasitismo del Chamón sobre el Cucarachero'], ['vig', 'Vigías del humedal', 'aplica', 1, 'Monitoreo de aves y especies'],
      ['hab', 'Habitantes del borde', 'aplica', 1, 'Siembra nativa en jardines y antejardines'], ['i1', 'Reconocimiento como guardianes', 'incentivo', 1, 'Rol visible en la red'],
      ['e1', 'Corredor de fauna conectado', 'efecto', 1, 'Menos trampas ecológicas urbanas'], ['e2', 'Polinizadores para las huertas', 'efecto', 1, 'Abejas, colibríes y mariposas']],
    e: [['asam', 'col', 'decision'], ['eco', 'col', 'saber'], ['col', 'vig', 'saber'], ['eco', 'hab', 'saber'], ['vig', 'asam', 'retorno'], ['i1', 'vig', 'incentivo'], ['hab', 'e1', 'retorno'], ['e1', 'e2', 'retorno']] },
  E6: { t: 'Vivienda y actividad', s: 'Negocios y oficios en la vivienda: producción y servicios en cada cuadra.',
    n: [['asam', 'Asamblea de barrio', 'decide', 3, 'Acuerda usos mixtos en la cuadra'], ['jac', 'Junta de vecinos', 'articula', 2, 'Directorio de oficios'], ['sab', 'Saberes de oficio (vecinos)', 'saber', 2, 'Talleres entre pares'],
      ['inst', 'Instituto Bavaria Común', 'saber', 3, 'Cultivo hidropónico en fachadas y patios'], ['neg', 'Negocios en vivienda', 'aplica', 1, 'Peluquerías, talleres, cocinas'], ['hog', 'Familias productoras', 'aplica', 1, 'Huertas en fachadas y patios'],
      ['i1', 'Clientes del barrio', 'incentivo', 1, 'Ingreso sin desplazarse'], ['e1', 'Menos viajes largos', 'efecto', 1, 'Economía de proximidad']],
    e: [['asam', 'jac', 'decision'], ['jac', 'neg', 'decision'], ['sab', 'neg', 'saber'], ['inst', 'hog', 'saber'], ['hog', 'neg', 'alimento'], ['i1', 'neg', 'incentivo'], ['neg', 'e1', 'retorno']] },
  E7: { t: 'Plazas y conjuntos', s: 'Plazas de mercado y conjuntos en altura como nodos colectivos.',
    n: [['asam', 'Asamblea de copropietarios', 'decide', 3, 'Aprueba la huerta en la cubierta'], ['adm', 'Administración y comités', 'articula', 2, 'Turnos de cuidado y riego'], ['inst', 'Instituto Bavaria Común', 'saber', 3, 'Diseño y mantenimiento hidropónico'],
      ['res', 'Residentes', 'aplica', 1, 'Cultivan en azoteas y balcones'], ['plz', 'Plazas de mercado', 'aplica', 2, 'Venden lo que sobra'], ['i1', 'Cosecha compartida', 'incentivo', 1, 'Alimento para cada apartamento'],
      ['e1', 'Cubiertas productivas', 'efecto', 1, 'Menos calor y más biodiversidad']],
    e: [['asam', 'adm', 'decision'], ['inst', 'adm', 'saber'], ['adm', 'res', 'saber'], ['res', 'plz', 'alimento'], ['i1', 'res', 'incentivo'], ['res', 'e1', 'retorno']] },
  E8: { t: 'Red distribuida de producción alimentaria', s: 'Huertas en lotes baldíos, cubiertas y viviendas conectadas entre sí.',
    n: [['asam', 'Asambleas Comunitarias Territoriales', 'decide', 3, 'Asignan lotes y priorizan barrios'], ['col', 'Colectivos y juntas', 'articula', 2, 'Coordinan la red de huertas'],
      ['inst', 'Instituto Bavaria Común', 'saber', 3, 'Forma formadores y emite bioinsumos'], ['lid', 'Líderes de barrio formados', 'saber', 2, 'Enseñan par a par en sus cuadras'],
      ['lot', 'Huertas en lotes baldíos', 'aplica', 1, 'Producción comunitaria'], ['cub', 'Huertas en cubiertas', 'aplica', 1, 'Hidroponía en conjuntos'], ['viv', 'Huertas en viviendas', 'aplica', 1, 'Fachadas y patios'], ['tien', 'Tiendas de barrio', 'aplica', 1, 'Reciben excedentes'],
      ['i1', 'Bioinsumos gratis', 'incentivo', 1, ''], ['i2', 'Roles y vocería', 'incentivo', 1, 'Cultivador → Bio-agricultor → Gestor de Red'], ['i3', 'Ahorro en el mercado', 'incentivo', 1, 'Alimento limpio y créditos'],
      ['e1', 'Autonomía alimentaria', 'efecto', 1, 'Menos dependencia de Corabastos']],
    e: [['asam', 'col', 'decision'], ['col', 'lot', 'decision'], ['inst', 'lid', 'saber'], ['lid', 'lot', 'saber'], ['lid', 'cub', 'saber'], ['lid', 'viv', 'saber'], ['inst', 'i1', 'insumo'], ['i1', 'cub', 'insumo'], ['i1', 'viv', 'insumo'],
      ['lot', 'tien', 'alimento'], ['cub', 'tien', 'alimento'], ['viv', 'tien', 'alimento'], ['tien', 'i3', 'incentivo'], ['lid', 'i2', 'incentivo'], ['i2', 'asam', 'incentivo'], ['tien', 'e1', 'retorno']] },
  E9: { t: 'Manzanas del Cuidado', s: 'Jardines, salones comunales y centros de cuidado como nodos de la red.',
    n: [['asam', 'Asamblea de manzana', 'decide', 3, 'Organiza horarios y espacios de cuidado'], ['mad', 'Madres comunitarias', 'articula', 2, 'Sostienen el cuidado cotidiano'], ['inst', 'Instituto Bavaria Común', 'saber', 3, 'Nutrición y huertas pedagógicas'],
      ['jar', 'Jardines infantiles', 'aplica', 1, 'Huerta escolar'], ['sal', 'Salones comunales', 'aplica', 1, 'Cocina y degustación barrial'], ['i1', 'Tiempo liberado para las cuidadoras', 'incentivo', 1, 'Redes de apoyo'],
      ['i2', 'Alimento para niños y mayores', 'incentivo', 1, ''], ['e1', 'Tejido social', 'efecto', 1, 'Comunidad que se cuida']],
    e: [['asam', 'mad', 'decision'], ['inst', 'mad', 'saber'], ['mad', 'jar', 'saber'], ['jar', 'sal', 'alimento'], ['i1', 'mad', 'incentivo'], ['sal', 'i2', 'alimento'], ['sal', 'e1', 'retorno']] }
};
let pop = null, anim = 0;
function css() {
  const s = document.createElement('style'); s.textContent = `
#rg-pop{position:fixed;z-index:13;left:290px;top:14px;width:min(560px,calc(100vw - 310px));max-height:calc(100vh - 28px);overflow:auto;padding:16px 16px 12px;border-radius:14px;background:rgba(8,10,20,.93);border:1px solid rgba(177,140,255,.3);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);color:#e8e9f5;font:12px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.5)}
#rg-pop h3{margin:0;font-size:10px;letter-spacing:.34em;text-transform:uppercase;color:#b18cff}#rg-pop h4{margin:3px 0 2px;font-size:17px;color:#fff}#rg-pop .s{color:#a9adc8;font-size:11.5px;margin:0 0 6px}
#rg-pop svg{display:block;width:100%;height:auto}#rg-pop .x{position:absolute;right:10px;top:10px;width:26px;height:26px;border-radius:8px;border:1px solid rgba(177,140,255,.35);background:none;color:#c9cbe6;cursor:pointer}
#rg-pop .ley{display:flex;flex-wrap:wrap;gap:4px 12px;font-size:10.5px;color:#b8bbd6;margin-top:6px}#rg-pop .ley i{display:inline-block;width:14px;height:2px;margin-right:5px;vertical-align:middle}
#rg-pop .det{min-height:34px;margin-top:6px;padding:7px 9px;border-radius:8px;background:rgba(255,255,255,.04);color:#cfd2ea;font-size:11.5px}
#rg-pop .det b{color:#fff}
@media(max-width:820px){#rg-pop{left:10px;right:10px;width:auto;top:auto;bottom:10px;max-height:62vh}}`;
  document.head.appendChild(s);
}
export function verRed(id, on) {
  const D = R[id]; if (!D) return;
  if (!pop) { css(); pop = document.createElement('div'); pop.id = 'rg-pop'; document.body.appendChild(pop); }
  if (!on) { if (pop.dataset.id === id) { pop.style.display = 'none'; cancelAnimationFrame(anim); } return; }
  pop.dataset.id = id; pop.style.display = 'block'; cancelAnimationFrame(anim);
  // disposición: una fila por nivel (de arriba a abajo), nodos repartidos en la fila
  const W = 560, filas = NIV.map(v => D.n.filter(n => n[2] === v.k)).filter(f => f.length), FH = 92, H = filas.length * FH + 20, P = {};
  filas.forEach((f, r) => f.forEach((n, i) => { P[n[0]] = { x: (i + 1) * W / (f.length + 1), y: 34 + r * FH, n, r, rad: 7 + n[3] * 5, col: NIV.find(v => v.k === n[2]).c }; }));
  const corta = (s, m = 22) => { const w = s.split(' '), L = []; let l = ''; for (const x of w) { if ((l + ' ' + x).trim().length > m) { L.push(l); l = x; } else l = (l + ' ' + x).trim(); } L.push(l); return L.slice(0, 3); };
  let svg = `<svg viewBox="0 0 ${W} ${H}"><defs>${Object.entries(FLUJO).map(([k, [c]]) => `<marker id="rg-${k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" fill="${c}"/></marker>`).join('')}<filter id="rg-gl"><feGaussianBlur stdDeviation="3"/></filter></defs>`;
  filas.forEach((f, r) => { const v = NIV.find(x => x.k === f[0][2]); svg += `<text x="6" y="${34 + r * FH - 22}" fill="${v.c}" font-size="8.5" letter-spacing="2" font-weight="700" class="rg-f" data-r="${r}" opacity="0">${v.n.toUpperCase()}</text><line x1="6" y1="${34 + r * FH + 40}" x2="${W - 6}" y2="${34 + r * FH + 40}" stroke="#ffffff" stroke-opacity=".05"/>`; });
  D.e.forEach(([a, b, t], k) => { const p = P[a], q = P[b]; if (!p || !q) return; const [c] = FLUJO[t], mx = (p.x + q.x) / 2 + (p.r === q.r ? 0 : (q.x - p.x) * 0.12), my = (p.y + q.y) / 2 - (p.r === q.r ? 26 : 0);
    const dx = q.x - mx, dy = q.y - my, L = Math.hypot(dx, dy) || 1, ex = q.x - dx / L * (q.rad + 3), ey = q.y - dy / L * (q.rad + 3);
    svg += `<path id="rg-e${k}" class="rg-e" data-r="${Math.max(p.r, q.r)}" d="M${p.x} ${p.y} Q${mx} ${my} ${ex} ${ey}" fill="none" stroke="${c}" stroke-width="1.4" stroke-opacity=".75" marker-end="url(#rg-${t})" stroke-dasharray="600" stroke-dashoffset="600"/>`; });
  for (const p of Object.values(P)) { const L = corta(p.n[1]); svg += `<g class="rg-n" data-r="${p.r}" data-id="${p.n[0]}" opacity="0" style="cursor:pointer"><circle cx="${p.x}" cy="${p.y}" r="${p.rad + 6}" fill="${p.col}" opacity=".18" filter="url(#rg-gl)"/><circle cx="${p.x}" cy="${p.y}" r="${p.rad}" fill="#0b0d18" stroke="${p.col}" stroke-width="${p.n[3] + 0.5}"/>${p.n[0] === 'colec' ? `<image href="data3d/logo_bosque_bavaria.png" x="${p.x - p.rad}" y="${p.y - p.rad}" width="${p.rad * 2}" height="${p.rad * 2}"/>` : ''}${L.map((l, i) => `<text x="${p.x}" y="${p.y + p.rad + 11 + i * 10}" text-anchor="middle" fill="#e8e9f5" font-size="8.6" font-weight="600">${l}</text>`).join('')}</g>`; }
  svg += `<g id="rg-pul"></g></svg>`;
  pop.innerHTML = `<button class="x" aria-label="Cerrar">✕</button><h3>Red de gobernanza · ${id}</h3><h4>${D.t}</h4><p class="s">${D.s} El tamaño del nodo es su poder, que aquí es conocimiento: lo tiene quien enseña para que otros lo apliquen en sus casas.</p>${svg}
<div class="det">Toca un nodo para ver su papel.</div><div class="ley">${Object.values(FLUJO).map(([c, n]) => `<span><i style="background:${c}"></i>${n}</span>`).join('')}</div>`;
  pop.querySelector('.x').onclick = () => { pop.style.display = 'none'; cancelAnimationFrame(anim); };
  pop.querySelectorAll('.rg-n').forEach(g => g.onclick = () => { const n = D.n.find(x => x[0] === g.dataset.id); pop.querySelector('.det').innerHTML = `<b>${n[1]}</b> · ${NIV.find(v => v.k === n[2]).n}${n[4] ? ' — ' + n[4] : ''}`; });
  // se arma por niveles: aparecen los nodos de cada fila, luego se dibujan sus flechas; después quedan pulsos recorriéndolas
  const t0 = performance.now(), PASO = 650, ns = 'http://www.w3.org/2000/svg', pul = pop.querySelector('#rg-pul'), rutas = [...pop.querySelectorAll('.rg-e')];
  const puntos = rutas.map((r, k) => { const c = document.createElementNS(ns, 'circle'); c.setAttribute('r', '2.6'); c.setAttribute('fill', r.getAttribute('stroke')); c.setAttribute('opacity', '0'); pul.appendChild(c); return { r, c, L: r.getTotalLength(), f: k * 0.137 % 1 }; });
  const paso = (t) => {
    const e = (t - t0) / PASO;
    pop.querySelectorAll('.rg-n,.rg-f').forEach(g => { const k = Math.max(0, Math.min(1, e - +g.dataset.r)); g.setAttribute('opacity', k.toFixed(2)); });
    rutas.forEach(r => { const k = Math.max(0, Math.min(1, e - +r.dataset.r - 0.4)); r.setAttribute('stroke-dashoffset', (600 * (1 - k)).toFixed(0)); });
    if (e > filas.length + 0.6) for (const p of puntos) { p.f = (p.f + 0.006) % 1; const q = p.r.getPointAtLength(p.f * p.L); p.c.setAttribute('cx', q.x); p.c.setAttribute('cy', q.y); p.c.setAttribute('opacity', '1'); }
    anim = requestAnimationFrame(paso);
  };
  anim = requestAnimationFrame(paso);
}
