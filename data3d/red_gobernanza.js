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
#rg-pop .inc{margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,.08);display:flex;flex-wrap:wrap;gap:4px 10px;font-size:10.5px;color:#ffc1d3}#rg-pop .inc b{width:100%;color:#ff8fb1;letter-spacing:.14em;text-transform:uppercase;font-size:9.5px}
@media(max-width:820px){#rg-pop{left:10px;right:10px;width:auto;top:auto;bottom:10px;max-height:62vh}}`;
  document.head.appendChild(s);
}
// RED POLICÉNTRICA (no jerárquica): cinco células barriales, cada una con su asamblea que DECIDE sobre su barrio; las asambleas se
// coordinan entre sí en anillo por delegados rotativos (nadie está arriba). Los nodos de CONOCIMIENTO están en el medio pero no deciden:
// su poder es enseñar a los líderes de cada célula, que lo llevan par a par a sus vecinos. Los articuladores convocan y conectan.
export function verRed(id, on) {
  const D = R[id]; if (!D) return;
  if (!pop) { css(); pop = document.createElement('div'); pop.id = 'rg-pop'; document.body.appendChild(pop); }
  if (!on) { if (pop.dataset.id === id) { pop.style.display = 'none'; cancelAnimationFrame(anim); } return; }
  pop.dataset.id = id; pop.style.display = 'block'; cancelAnimationFrame(anim);
  const de = (k) => D.n.filter(n => n[2] === k), DEC = de('decide')[0], ART = de('articula'), SAB = de('saber'), APL = de('aplica'), INC = de('incentivo');
  const W = 560, H = 470, C = [W / 2, 230], NC = 5, RC = 172, nodos = [], aristas = [], ns = 'http://www.w3.org/2000/svg';
  const nodo = (o) => { nodos.push(o); return o; };
  const arista = (a, b, t, fase) => aristas.push({ a, b, t, fase });
  // células barriales
  const asam = [];
  for (let i = 0; i < NC; i++) {
    const an = -Math.PI / 2 + i * 2 * Math.PI / NC, cx = C[0] + Math.cos(an) * RC, cy = C[1] + Math.sin(an) * RC * 0.86;
    const a = nodo({ x: cx, y: cy, r: 13, col: '#ffd166', lab: i === 0 ? DEC[1] : 'Asamblea · barrio ' + (i + 1), det: DEC[4], fase: 0, n: DEC, k: 'decide' }); asam.push(a);
    // miembros de la célula: los que aplican (en abanico hacia afuera)
    APL.forEach((m, j) => { const da = (j - (APL.length - 1) / 2) * 0.42, d = 58, mx = cx + Math.cos(an + da) * d, my = cy + Math.sin(an + da) * d * 0.86;
      const q = nodo({ x: mx, y: my, r: 5 + m[3] * 1.5, col: '#56ccf2', lab: '', det: m[4], fase: 2, n: m, k: 'aplica' }); arista(a, q, 'decision', 2); });
  }
  // anillo de asambleas (coordinación horizontal) + cuerdas entre células no vecinas
  for (let i = 0; i < NC; i++) { arista(asam[i], asam[(i + 1) % NC], 'coord', 1); if (i < 2) arista(asam[i], asam[i + 2], 'coord', 1); }
  // articuladores: entre asambleas (convocan y conectan)
  ART.forEach((m, j) => { const i = (j * 2 + 1) % NC, a = asam[i], b = asam[(i + 1) % NC], x = (a.x + b.x) / 2 * 0.82 + C[0] * 0.18, y = (a.y + b.y) / 2 * 0.82 + C[1] * 0.18;
    const q = nodo({ x, y, r: 10, col: '#7fd39b', lab: m[1], det: m[4], fase: 1, n: m, k: 'articula', logo: m[0] === 'colec' }); arista(q, a, 'conv', 1); arista(q, b, 'conv', 1); });
  // conocimiento: en el centro, con halo grande (poder de saber) pero sin flechas de decisión; enseña a los líderes de TODAS las células
  SAB.forEach((m, j) => { const an = j / SAB.length * Math.PI * 2 - Math.PI / 2, d = SAB.length > 1 ? 56 : 0;
    const q = nodo({ x: C[0] + Math.cos(an) * d, y: C[1] + Math.sin(an) * d * 0.86, r: 8 + m[3] * 3, col: '#b18cff', lab: m[1], det: m[4] + ' · No decide: comparte conocimiento', fase: 3, n: m, k: 'saber', halo: true });
    nodos.filter(o => o.k === 'aplica' && o.n === APL[0]).forEach(l => arista(q, l, 'saber', 3)); });
  // retorno de saber de las células al centro (lo aprendido en las huertas vuelve al laboratorio)
  if (SAB.length) asam.forEach(a => arista(a, nodos.find(o => o.k === 'saber'), 'retro', 3));
  const T = { decision: ['#ffd166', 'decide sobre su barrio'], coord: ['#ffe9a8', 'coordinación entre asambleas (delegados rotativos)'], conv: ['#7fd39b', 'convoca y conecta'], saber: ['#b18cff', 'conocimiento (enseña, no decide)'], retro: ['#8fd3ff', 'aprendizajes que regresan'] };
  let svg = `<svg viewBox="0 0 ${W} ${H}"><defs><filter id="rg-gl"><feGaussianBlur stdDeviation="5"/></filter></defs>`;
  aristas.forEach((e, k) => { const [c] = T[e.t], mx = (e.a.x + e.b.x) / 2 + (e.t === 'coord' ? (C[0] - (e.a.x + e.b.x) / 2) * -0.12 : 0), my = (e.a.y + e.b.y) / 2 + (e.t === 'coord' ? (C[1] - (e.a.y + e.b.y) / 2) * -0.12 : 0);
    svg += `<path class="rg-e" data-f="${e.fase}" d="M${e.a.x.toFixed(1)} ${e.a.y.toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${e.b.x.toFixed(1)} ${e.b.y.toFixed(1)}" fill="none" stroke="${c}" stroke-width="${e.t === 'coord' ? 2 : e.t === 'saber' ? 1.3 : 1}" stroke-opacity="${e.t === 'retro' ? 0.35 : 0.7}" ${e.t === 'retro' ? 'stroke-dasharray="3 4"' : 'stroke-dasharray="900" stroke-dashoffset="900"'}/>`; });
  nodos.forEach((o, i) => { const L = o.lab ? o.lab.match(/.{1,22}(\s|$)/g).slice(0, 2) : [];
    svg += `<g class="rg-n" data-f="${o.fase}" data-i="${i}" opacity="0" style="cursor:pointer">${o.halo ? `<circle cx="${o.x}" cy="${o.y}" r="${o.r * 2.4}" fill="${o.col}" opacity=".22" filter="url(#rg-gl)"/>` : ''}<circle cx="${o.x}" cy="${o.y}" r="${o.r}" fill="#0b0d18" stroke="${o.col}" stroke-width="${o.k === 'decide' ? 2.5 : 1.6}"/>${o.logo ? `<image href="data3d/logo_bosque_bavaria.png" x="${o.x - o.r}" y="${o.y - o.r}" width="${o.r * 2}" height="${o.r * 2}"/>` : ''}${L.map((l, j) => `<text x="${o.x}" y="${o.y + o.r + 10 + j * 9.5}" text-anchor="middle" fill="#e8e9f5" font-size="8.3" font-weight="600">${l.trim()}</text>`).join('')}</g>`; });
  svg += `<g id="rg-pul"></g></svg>`;
  pop.innerHTML = `<button class="x" aria-label="Cerrar">✕</button><h3>Red de gobernanza policéntrica · ${id}</h3><h4>${D.t}</h4>
<p class="s"><b style="color:#ffd166">¿Quién decide?</b> Cada barrio en su asamblea, con voz y voto en igualdad. Las asambleas se coordinan entre sí por delegados rotativos: no hay un centro que mande. <b style="color:#b18cff">¿Quién tiene el poder del conocimiento?</b> ${SAB.map(s => s[1]).join(', ')}: no deciden; enseñan a los líderes de cada barrio, que lo aplican y lo enseñan en sus casas.</p>${svg}
<div class="det"><b style="color:#56ccf2">En cada barrio aplican:</b> ${APL.map(a => a[1]).join(' · ')}. Toca un nodo para ver su papel.</div>
<div class="ley">${Object.values(T).map(([c, n]) => `<span><i style="background:${c}"></i>${n}</span>`).join('')}</div>
${INC.length ? `<div class="inc"><b>Incentivos para participar</b>${INC.map(i => `<span>${i[1]}${i[4] ? ' · ' + i[4] : ''}</span>`).join('')}</div>` : ''}`;
  pop.querySelector('.x').onclick = () => { pop.style.display = 'none'; cancelAnimationFrame(anim); };
  pop.querySelectorAll('.rg-n').forEach(g => g.onclick = () => { const o = nodos[+g.dataset.i]; pop.querySelector('.det').innerHTML = `<b>${o.lab || o.n[1]}</b> · ${{ decide: 'Decide', articula: 'Articula', saber: 'Conocimiento', aplica: 'Aplica' }[o.k]}${o.det ? ' — ' + o.det : ''}`; });
  const t0 = performance.now(), PASO = 700, pul = pop.querySelector('#rg-pul'), rutas = [...pop.querySelectorAll('.rg-e')];
  const puntos = rutas.filter(r => r.getAttribute('stroke') !== '#8fd3ff').map((r, k) => { const c = document.createElementNS(ns, 'circle'); c.setAttribute('r', '2.2'); c.setAttribute('fill', r.getAttribute('stroke')); c.setAttribute('opacity', '0'); pul.appendChild(c); return { r, c, L: r.getTotalLength(), f: k * 0.173 % 1 }; });
  const paso = (t) => {
    const e = (t - t0) / PASO;
    pop.querySelectorAll('.rg-n').forEach(g => g.setAttribute('opacity', Math.max(0, Math.min(1, e - +g.dataset.f)).toFixed(2)));
    rutas.forEach(r => { if (r.getAttribute('stroke-dasharray') === '3 4') { r.style.opacity = Math.max(0, Math.min(1, e - 4)); return; } r.setAttribute('stroke-dashoffset', (900 * (1 - Math.max(0, Math.min(1, e - +r.dataset.f - 0.3)))).toFixed(0)); });
    if (e > 4.5) for (const p of puntos) { p.f = (p.f + 0.005) % 1; const q = p.r.getPointAtLength(p.f * p.L); p.c.setAttribute('cx', q.x); p.c.setAttribute('cy', q.y); p.c.setAttribute('opacity', '1'); }
    anim = requestAnimationFrame(paso);
  };
  anim = requestAnimationFrame(paso);
}
