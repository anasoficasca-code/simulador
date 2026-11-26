import {adjuntarBalance} from './balance_final.js?v=2';
import { conclusionAbasto } from './conclusion_abasto.js?v=2';
import { TiempoRadial } from './graficas_arte.js?v=1'; // 2026-11-26: relojes de 15 años, línea de tiempo de burbujas y dona del veredicto (paleta URBIA + morados de la portada) // par 01: veredicto y «Conclusión general» con dos tarjetas (2026-11-25)
/* ============ INFORME FINAL DE UNA SIMULACIÓN (versión 3: una sola historia) ============
   export function abrirInforme2({ cont, sim, def, hist, base, reglas, go, eventos, extinciones, ind, semilla, onCerrar })
   Pinta en `cont` (la caja de vidrio #su-inf .caja) un informe para no expertos (y para proyectar ante un jurado):
     1 · HÉROE: par, pregunta, veredicto grande «¿Fue sostenible?» Sí / No / En parte con una frase, y las 3–4 cifras que más importan
         (con propuesta: lado a lado con su pareja sin propuesta, misma semana y mismos valores; sin propuesta: año 1 → final);
     2 · «Cómo cambió en 15 años»: hasta 4 curvas grandes (2 × 2), primero la métrica clave del par; con = línea ámbar, sin = gris punteada,
         límite de game over en rojo suave y etiquetas al final de cada línea;
     3 · la red de interacciones en una sola «bola» (perdidas en rojo, nuevas en verde) y lo que pasó por plazo (corto / mediano / largo);
     4 · tabla compacta con todos los indicadores y «Notas y fuentes» (reglas, fuentes, supuestos y cómo se decide el veredicto), plegadas.
   Criterios del veredicto (sin cambios desde la versión 2):
     No = se cumplió una regla de game over · Sí = sin game over, ningún indicador de las reglas a 2/3 o más del camino a su límite y mejoran más
     indicadores clave de los que empeoran · En parte = el resto. Con pareja se compara en la misma semana; sin pareja, año 1 → final.
   Nada se inventa aquí: todo sale de `hist` (ind() de cada semana), `base`, `go`, `eventos`, `reglas` y de data3d/simulaciones_datos.json (red biótica).
   Solo SVG en línea, sin librerías. Las curvas se promedian cada 4 semanas. Estilos con prefijo i2- dentro de .inf2. */

const FIN = 780, AÑO = 52, CADA = 4;
const FASES = [{ n: 'Corto plazo', a0: 1, a1: 5 }, { n: 'Mediano plazo', a0: 6, a1: 10 }, { n: 'Largo plazo', a0: 11, a1: 15 }];

/* ---------- utilidades ---------- */
const NFC = [];
const nf = (v, d = 0) => v == null || !isFinite(v) ? '—' : (NFC[d] || (NFC[d] = new Intl.NumberFormat('es-CO', { minimumFractionDigits: d, maximumFractionDigits: d }))).format(+v);
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const get = (h, k) => { if (!h) return null; let o = h; for (const p of k.split('.')) { if (o == null) return null; o = o[p]; } return typeof o === 'number' && isFinite(o) ? o : null; };
const añoDe = (w) => Math.max(1, Math.ceil(w / AÑO));
const min1 = (s) => s ? s.charAt(0).toLowerCase() + s.slice(1) : s;
const may1 = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
const lista = (a) => a.length <= 1 ? (a[0] || '') : a.slice(0, -1).join(', ') + ' y ' + a[a.length - 1];
const SG = (d) => d > 0 ? '+' : d < 0 ? '−' : '';
const num = (v) => typeof v === 'number' && isFinite(v) ? v : null;

/* ---------- indicadores por tema (veredicto y tabla completa; se muestra un indicador solo si existe) ----------
   dif: rel = % relativo · pts = puntos (valor × esc) · db = decibeles · abs = diferencia absoluta (u = unidad) · clave: cuenta para el veredicto. */
const TEMAS = [
  { k: 'eco', n: 'Ecología', items: [
    { k: 'fauna', n: 'Especies de fauna', f: (v, h) => `${nf(v)} de ${nf(h.fauna0)}`, sube: true, dif: 'abs', u: ['especie', 'especies'], clave: true, m: 'fauna' },
    { k: 'red', n: 'Interacciones entre especies', f: (v) => nf(v), sube: true, dif: 'rel', clave: true, m: 'red' },
    { k: 'poliniz', n: 'Polinizadores', f: (v) => nf(v), sube: true, dif: 'rel', clave: true },
    { k: 'pares', n: 'Territorio con fauna', f: (v) => nf(v), sube: true, dif: 'rel', m: 'territorio' },
    { k: 'humedalFuncional', n: 'Humedales que funcionan', f: (v) => nf(v) + ' %', sube: true, dif: 'pts', esc: 1, clave: true, m: 'humedal' },
    { k: 'humedalHa', n: 'Área de humedales', f: (v) => nf(v, 1) + ' ha', sube: true, dif: 'rel' },
    { k: 'arbolesPerdidos', n: 'Árboles perdidos en parques', f: (v) => nf(v * 100, 1) + ' %', sube: false, dif: 'pts', esc: 100, clave: true }] },
  { k: 'urb', n: 'Ambiente urbano', items: [
    { k: 'ruidoDb', n: 'Ruido promedio de las calles', f: (v) => nf(v, 1) + ' dB', sube: false, dif: 'db', clave: true, m: 'ruido' },
    { k: 'trafico', n: 'Tráfico', f: (v) => nf(v * 100) + ' % de hoy', sube: false, dif: 'rel', clave: true, m: 'trafico' },
    { k: 'congestion', n: 'Congestión', f: (v) => nf(v) + ' %', sube: false, dif: 'pts', esc: 1 },
    { k: 'basuraT', n: 'Basura generada', f: (v) => nf(v) + ' t/día', sube: false, dif: 'rel' },
    { k: 'sinRecoger', n: 'Basura sin recoger', f: (v) => nf(v * 100) + ' %', sube: false, dif: 'pts', esc: 100, clave: true, m: 'basura' },
    { k: 'ratas', n: 'Ratas', f: (v, h) => '×' + nf(v / (h.ratas0 || 1), 1), sube: false, dif: 'rel', clave: true },
    { k: 'atropellos', n: 'Fauna atropellada', f: (v) => nf(v, v < 10 ? 1 : 0), sube: false, dif: 'rel' }] },
  { k: 'com', n: 'Comida y economía circular', items: [
    { k: 'comidaMin', n: 'Comida en la zona peor servida', f: (v) => nf(v * 100) + ' %', sube: true, dif: 'pts', esc: 100, clave: true, m: 'comida' },
    { k: 'huertas', n: 'Huertas activas', f: (v) => nf(v), sube: true, dif: 'rel', clave: true },
    { k: 'comidaLocal', n: 'Gente que comería de las huertas', f: (v) => nf(v, v < 10 ? 1 : 0) + ' %', sube: true, dif: 'pts', esc: 1 },
    { k: 'residuos', n: 'Orgánicos sin tratar', f: (v) => nf(v * 100) + ' %', sube: false, dif: 'pts', esc: 100, soloSi: (H) => H.some(h => h.residuos > 0.005), m: 'residuos' },
    { k: 'circular.indice', n: 'Índice de circularidad', f: (v) => v <= 1 ? nf(v * 100, 1) + ' %' : nf(v, 2), sube: true, dif: 'pts', esc: 100, clave: true, m: 'circular' },
    { k: 'circular.compostado_t_dia', n: 'Orgánicos compostados', f: (v) => nf(v, v < 10 ? 1 : 0) + ' t/día', sube: true, dif: 'rel' }] },
  { k: 'suelo', n: 'Suelo y sociedad', items: [
    { k: 'especulacion.indice', n: 'Especulación con el suelo', f: (v) => v <= 1 ? nf(v * 100) + ' %' : '×' + nf(v, 2), sube: false, dif: 'rel', clave: true, m: 'suelo' },
    { k: 'especulacion.hogaresRiesgo', n: 'Hogares en riesgo de desplazamiento', f: (v) => nf(v), sube: false, dif: 'rel', clave: true, m: 'hogares' }] }
];

/* ---------- reglas de game over: valor y «hoy» (los mismos VALOR de simulaciones12.js) ---------- */
const VAL = { fauna: (h) => h.fauna / Math.max(1, h.fauna0) * 100, habitat: (h) => h.pares / Math.max(1, h.pares0) * 100, abasto: (h) => h.evaluacion?.territorio?.cobertura,
  residuos: (h) => h.residuos * 100, ruido: (h) => h.ruidoDb - h.ruidoDb0, trafico: (h) => h.trafico, humedal: (h) => h.humedalFuncional };
const HOY = { fauna: 100, habitat: 100, abasto: 100, residuos: 0, ruido: 0, trafico: 1, humedal: 100 };
const UMB = { fauna: 90, habitat: 70, abasto: 80, residuos: 100, ruido: 3, trafico: 1.3, humedal: 70 };
const FMT_R = { ruido: (v) => SG(v) + nf(Math.abs(v), 1) + ' dB', trafico: (v) => nf(v, 2) };
const fmtR = (k, v) => (FMT_R[k] || ((x) => nf(x) + ' %'))(v);
const ART = { fauna: 'la fauna', habitat: 'el territorio con fauna', humedal: 'el área funcional de los humedales', abasto: 'la cobertura distrital', residuos: 'el almacenamiento de orgánicos', ruido: 'el ruido', trafico: 'el tráfico' };
const CORTO_R = { fauna: 'pérdida de especies', habitat: 'pérdida de territorio con fauna', humedal: 'humedales degradados', abasto: 'déficit distrital', residuos: 'orgánicos sin tratar', ruido: 'ruido', trafico: 'tráfico' };
const prox = (k, v, umbral) => { const h = HOY[k], u = umbral != null ? umbral : UMB[k]; if (v == null || u === h) return 0; return Math.max(0, Math.min(1.2, (v - h) / (u - h))); };
const cruzó = (k, v, umbral) => { const u = umbral != null ? umbral : UMB[k]; return v != null && (HOY[k] < u ? v >= u : v <= u); };

/* ---------- métricas para el héroe y las curvas (v devuelve el valor ya en la unidad que se muestra) ---------- */
const pct = (x) => x == null ? null : x * 100;
const MET = {
  cora: { n: 'Corabastos', u: 'de su tope', t: 'Corabastos: carga frente a su tope', v: (h) => h.abasto && h.abasto.cora ? pct(num(h.abasto.cora.carga)) : null, f: (v) => nf(v) + ' %', sube: false, dif: 'pts', lim: 100, limTxt: 'tope',
    ay: 'Lo que recibe y despacha Corabastos frente a lo máximo que puede mover.' },
  comida: { n: 'Comida en la zona peor servida', u: 'de lo que necesita', t: 'Comida en la zona peor servida', v: (h) => pct(num(h.comidaMin)), f: (v) => nf(v) + ' %', sube: true, dif: 'pts', lim: 80, limTxt: 'game over < 80 %',
    ay: 'Alimentos que llegan al barrio peor servido frente a lo que necesita.' },
  trafico: { n: 'Tráfico', u: 'del de hoy', t: 'Tráfico (100 % = hoy)', v: (h) => pct(num(h.trafico)), f: (v) => nf(v) + ' %', sube: false, dif: 'pts', lim: 130, limTxt: 'game over 130 %',
    ay: 'Vehículos que circulan frente a los de hoy.' },
  basura: { n: 'Basura sin recoger', u: 'de la basura', t: 'Basura sin recoger', v: (h) => pct(num(h.sinRecoger != null ? h.sinRecoger : h.basura && h.basura.fraccionSinRecoger)), f: (v) => nf(v) + ' %', sube: false, dif: 'pts',
    ay: 'Parte de la basura que termina en calles y bordes de humedales.' },
  circular: { n: 'Economía circular', u: 'de los orgánicos vuelve como abono', t: 'Economía circular', v: (h) => pct(num(h.circular && h.circular.indice)), f: (v) => nf(v, 1) + ' %', sube: true, dif: 'pts',
    ay: 'Orgánicos que vuelven como compost a las huertas.' },
  territorio: { n: 'Territorio con fauna', u: 'lugares ocupados por especies', t: 'Territorio con fauna', v: (h) => num(h.pares), f: (v) => nf(v), sube: true, dif: 'rel',
    ay: 'Pares especie × lugar ocupados en toda Kennedy.' },
  red: { n: 'Interacciones entre especies', u: 'relaciones activas', t: 'Interacciones entre especies', v: (h) => num(h.red), f: (v) => nf(v), sube: true, dif: 'rel',
    ay: 'Quién come, poliniza o anida en quién, contado en cada lugar.' },
  hogares: { n: 'Hogares en riesgo', u: 'de desplazamiento', t: 'Hogares en riesgo de desplazamiento', v: (h) => num(h.especulacion && h.especulacion.hogaresRiesgo), f: (v) => nf(v), sube: false, dif: 'rel',
    ay: 'Hogares que podrían tener que irse por el alza del suelo.' },
  suelo: { n: 'Precio del suelo', u: '1 = hoy', t: 'Precio del suelo (1 = hoy)', v: (h) => num(h.especulacion && h.especulacion.indice), f: (v) => '×' + nf(v, 2), sube: false, dif: 'rel',
    ay: 'Presión de precios junto al metro y a los proyectos.' },
  equidad: { n: 'Equidad del reparto', u: 'entre barrios', t: 'Equidad del reparto de recursos', v: (h) => pct(num(h.gobernanza && h.gobernanza.equidad)), f: (v) => nf(v) + ' %', sube: true, dif: 'pts',
    ay: '100 % = cada barrio recibe según lo que necesita.' },
  cobertura: { n: 'Necesidades cubiertas', u: 'en promedio por barrio', t: 'Necesidades cubiertas por barrio', v: (h) => pct(num(h.gobernanza && h.gobernanza.coberturaMedia)), f: (v) => nf(v) + ' %', sube: true, dif: 'pts',
    ay: 'Parte de lo que pide cada barrio que se alcanza a atender.' },
  humedal: { n: 'Humedales que funcionan', u: 'de hoy', t: 'Humedales que funcionan (% de hoy)', v: (h) => num(h.humedalFuncional), f: (v) => nf(v) + ' %', sube: true, dif: 'pts', lim: 70, limTxt: 'game over 70 %',
    ay: 'Área sin rellenar × calidad frente a la basura del borde.' },
  ruido: { n: 'Ruido de las calles', u: 'sobre el de hoy', t: 'Ruido de las calles (dB sobre hoy)', v: (h) => h.ruidoDb != null ? h.ruidoDb - h.ruidoDb0 : null, f: (v) => SG(Math.round(v * 10) / 10) + nf(Math.abs(v), 1) + ' dB', sube: false, dif: 'db', lim: 3, limTxt: 'game over +3 dB',
    ay: '+3 dB es el doble de energía sonora.' },
  fauna: { n: 'Especies de fauna', u: 'de las del inicio', t: 'Especies de fauna (% del inicio)', v: (h) => h.fauna != null ? VAL.fauna(h) : null, f: (v) => nf(v) + ' %', sube: true, dif: 'pts', lim: 90, limTxt: 'game over < 90 %',
    ay: 'Especies de la red biótica que siguen en Kennedy.' },
  habitat: { n: 'Territorio con fauna', u: 'del año 1', t: 'Territorio con fauna (% del año 1)', v: (h) => h.pares != null ? VAL.habitat(h) : null, f: (v) => nf(v) + ' %', sube: true, dif: 'pts', lim: 70, limTxt: 'game over 70 %',
    ay: 'Lugares ocupados por fauna frente al año 1.' },
  residuos: { n: 'Orgánicos sin tratar', u: 'del almacenamiento', t: 'Orgánicos sin tratar (% del almacenamiento)', v: (h) => pct(num(h.residuos)), f: (v) => nf(v) + ' %', sube: false, dif: 'pts', lim: 100, limTxt: 'game over 100 %',
    ay: 'Orgánicos que esperan tratamiento frente a la capacidad.' }
};
const REGLA_MET = { fauna: 'fauna', habitat: 'habitat', humedal: 'humedal', abasto: 'comida', residuos: 'residuos', ruido: 'ruido', trafico: 'trafico' };
const PAR_MET = { 1: ['cora', 'comida'], 2: ['comida', 'trafico'], 3: ['basura', 'circular'], 4: ['territorio', 'red'], 5: ['hogares', 'suelo'], 6: ['equidad', 'cobertura'] };
const RELLENO = ['red', 'humedal', 'trafico', 'comida', 'basura'];

/* ---------- red biótica (para la «bola») ---------- */
const FAUNA = [['tingua', 'Tingua moteada', 'Tingua'], ['pato', 'Pato andino', 'Pato'], ['focha', 'Focha común', 'Focha'], ['garza', 'Garza blanca', 'Garza'], ['garzaNoc', 'Garza nocturna', 'Garza noct.'],
  ['monjita', 'Monjita bogotana', 'Monjita'], ['rana', 'Rana sabanera', 'Rana'], ['culebra', 'Serpiente sabanera', 'Serpiente'], ['curi', 'Curí', 'Curí'], ['copeton', 'Copetón', 'Copetón'],
  ['mirla', 'Mirla patiamarilla', 'Mirla'], ['colibri', 'Colibrí chillón', 'Colibrí'], ['torcaza', 'Torcaza', 'Torcaza'], ['cucarachero', 'Cucarachero', 'Cucarachero'], ['chamon', 'Chamón', 'Chamón'],
  ['cernicalo', 'Cernícalo', 'Cernícalo'], ['buho', 'Búho sabanero', 'Búho'], ['lagartija', 'Lagartija bogotana', 'Lagartija'], ['comadreja', 'Comadreja', 'Comadreja'],
  ['rata', 'Rata parda', 'Rata'], ['caracol', 'Caracol de jardín', 'Caracol'], ['abeja', 'Abeja de miel', 'Abeja'], ['lombriz', 'Lombriz roja', 'Lombriz']]; // = ESPECIES de sim_vida.js + las 4 de red_trofica.js (mismo orden)
const GRUPOS = [{ k: 'ave', n: 'Aves' }, { k: 'poli', n: 'Polinizadores' }, { k: 'mam', n: 'Mamíferos' }, { k: 'herp', n: 'Anfibios y reptiles' }, { k: 'inv', n: 'Otros invertebrados' }, { k: 'pla', n: 'Plantas' }];
let RED_P = null;
function cargarRed() {
  if (RED_P) return RED_P;
  RED_P = fetch(new URL('./simulaciones_datos.json', import.meta.url)).then(r => { if (!r.ok) throw new Error('simulaciones_datos.json ' + r.status); return r.json(); }).then(J => {
    const R = J.red, NP = R.np, NFL = R.flora.length, fl = new Map(R.flora.map((f, i) => [f.id, i]));
    const cat = (id) => R.cat[id] != null ? R.cat[id] : (R.nuevas[id] ? R.nuevas[id].cat : null);
    // enlaces: los de biotica.json + los que agrega red_trofica.js (abeja visita las flores del colibrí; 4 pares)
    const ENL = R.enlaces.map(e => e.slice(0, 3)); for (const [a, b, t] of R.enlaces) if (a === 'colibri' && b[0] === 'f' && t === 5) ENL.push(['abeja', b, 5]);
    ENL.push(['abeja', 'colibri', 8], ['mirla', 'lombriz', 0], ['cucarachero', 'abeja', 0], ['tingua', 'lombriz', 0]);
    const FI = new Map(FAUNA.map((f, i) => [f[0], i]));
    const poli = new Set(ENL.filter(([a, b, t]) => t === 5 && FI.has(a) && fl.has(b)).map(e => e[0]));
    const grupo = (id) => { if (poli.has(id)) return 'poli'; const c = cat(id); return c === 1 ? 'ave' : c === 2 ? 'mam' : (c === 4 || c === 5) ? 'herp' : 'inv'; };
    // plantas presentes hoy: censo SIGAU (FLC0 ≥ 0,5 en algún parche) o bosque de Bavaria (BOSQ) · NATIVA = nativas de los módulos de huertas
    const bos = new Set(R.BOSQ.map(b => b[0])), hoy = new Uint8Array(NFL);
    for (let f = 0; f < NFL; f++) { let a = bos.has(f); for (let p = 0; p < NP && !a; p++) if (R.FLC0[f * NP + p] >= 0.5) a = true; hoy[f] = a ? 1 : 0; }
    const nuevas = R.NATIVA.map(id => fl.get(id)).filter(i => i != null && !hoy[i]);
    const soloBosque = [...bos].filter(f => { for (let p = 0; p < NP; p++) if (R.FLC0[f * NP + p] >= 0.5) return false; return true; });
    const nodos = FAUNA.map(([id, n, c]) => ({ id, n, c, g: grupo(id), fa: true }));
    R.flora.forEach((f, i) => { if (hoy[i] || nuevas.includes(i)) nodos.push({ id: f.id, n: f.n.split(',')[0], c: '', g: 'pla', fa: false, fi: i }); });
    const NI = new Map(nodos.map((x, i) => [x.id, i]));
    const enl = []; const visto = new Set();
    for (const [a, b, t] of ENL) { if (!NI.has(a) || !NI.has(b) || a === b) continue; const key = a < b ? a + '|' + b : b + '|' + a; if (visto.has(key)) continue; visto.add(key); enl.push([NI.get(a), NI.get(b), t]); }
    return { nodos, enl, floraHoy: nodos.filter(x => !x.fa && hoy[x.fi]).map(x => x.id), floraNuevas: nuevas.map(i => R.flora[i].id), soloBosque: soloBosque.map(i => R.flora[i].id), tipos: R.tipos };
  });
  RED_P.catch(() => { RED_P = null; });
  return RED_P;
}

/* ---------- iconos (trazos de 16 px) ---------- */
const IC = {
  especies: 'M3 13c0-6 4-10 10-10 0 6-4 10-10 10zM3 13l6-6', polinizadores: 'M6 8a2 2 0 1 0 4 0a2 2 0 1 0-4 0M8 1.5v3M8 11.5v3M1.5 8h3M11.5 8h3',
  huertas: 'M8 14V7M8 9C5 9 3 7 3 4c3 0 5 2 5 5zM8 7c0-3 2-5 5-5 0 3-2 5-5 5z', residuos: 'M2.5 4h11M6 4V2h4v2M4 4l1 10h6l1-10',
  corabastos: 'M2 14V6l6-4 6 4v8M5 14V9h6v5', ruido: 'M2 6h3l4-3v10l-4-3H2zM11 5.5c1.3 1.4 1.3 3.6 0 5M13 3.5c2.6 2.6 2.6 6.4 0 9',
  obra: 'M3 14V3h9M3 6l9-3M10 3v5M1.5 14h6', trafico: 'M2 11V8l2-4h8l2 4v3zM4.5 13v-2M11.5 13v-2M2 8h12', metro: 'M4 2h8v9H4zM4 7h8M5.5 14l1-3M10.5 14l-1-3',
  comida: 'M2 6h12l-2 8H4zM5 6l3-4 3 4', gameover: 'M8 1.5a6.5 6.5 0 1 0 0 13a6.5 6.5 0 1 0 0-13M5.5 5.5l5 5M10.5 5.5l-5 5', otro: 'M8 5v4M8 11v.5M8 1.5a6.5 6.5 0 1 0 0 13a6.5 6.5 0 1 0 0-13',
  si: 'M3.5 8.5l3 3 6-7', no: 'M4.5 4.5l7 7M11.5 4.5l-7 7', parte: 'M3.5 8h9', sube: 'M8 13V3M4 7l4-4 4 4', baja: 'M8 3v10M4 9l4 4 4-4', igual: 'M3.5 6h9M3.5 10h9'
};
const icono = (t, cls = '') => `<svg class="i2-ic ${cls}" viewBox="0 0 16 16" aria-hidden="true"><path d="${IC[t] || IC.otro}"/></svg>`;

/* ---------- estilos ----------
   Pantalla completa sobre la escena 3D oscurecida y desenfocada (::backdrop del <dialog id="su-inf">).
   Tono por resultado: .go = coral sobrio · .ok = verde pálido (var(--ui-acc)) · .parte = arena · .curso = neutro.
   Colores de las gráficas validados con el validador de dataviz sobre la superficie #14161b: serie «con» #4aab90, límite #e0665a
   (CVD 7,8 → con codificación secundaria: «sin» punteada y gris, límite rotulado); impresión #1a8a6a / #d0473a sobre blanco. */
const CSS = `
#su-inf.i2-dlg { position: fixed; inset: 0; width: 100vw; height: 100dvh; max-width: none; max-height: none; margin: 0; padding: 0; border: 0; background: transparent; color: #eef0ea; overflow: hidden; }
#su-inf.i2-dlg:modal { overscroll-behavior: contain; }
#su-inf.i2-dlg::backdrop { overflow: hidden; overscroll-behavior: contain; background: radial-gradient(70% 60% at 85% 0%, rgba(48,79,254,.32), transparent 70%), radial-gradient(120% 90% at 50% 0%, rgba(14,14,26,.5), rgba(5,5,10,.84)); backdrop-filter: blur(12px) saturate(.7) brightness(.82); -webkit-backdrop-filter: blur(12px) saturate(.7) brightness(.82); }
#su-inf.i2-dlg.go::backdrop { background: radial-gradient(60% 55% at 85% 0%, rgba(255,79,123,.22), transparent 70%), radial-gradient(110% 80% at 50% 10%, rgba(70,22,48,.42), rgba(10,5,10,.86)); }
#su-inf.i2-dlg.ok::backdrop { background: radial-gradient(60% 55% at 85% 0%, rgba(48,79,254,.34), transparent 70%), radial-gradient(110% 80% at 50% 10%, rgba(40,36,92,.36), rgba(5,5,12,.84)); }
@media (prefers-reduced-motion: no-preference) { #su-inf.i2-dlg[open]::backdrop { animation: i2fondo .7s ease-out both; } }
@keyframes i2fondo { from { opacity: 0; } }
#su-inf.i2-dlg > .caja { width: 100%; height: 100%; max-height: none; overflow-y: auto; overflow-x: hidden; padding: 0; background: none; border: 0; border-radius: 0; box-shadow: none; scrollbar-color: rgba(255,255,255,.25) transparent; }
.inf2 { --ink: var(--ui-tx, #eef0ea); --ink2: rgba(238,240,234,.76); --mut: rgba(238,240,234,.54); --line: rgba(255,255,255,.13); --line2: rgba(255,255,255,.07);
  --glass: var(--ui-glass, rgba(32,36,35,.8)); --glass-bd: var(--ui-glass-bd, rgba(226,236,211,.2)); --card: rgba(13,15,17,.46); --bg: #14161b;
  --bien: #4fd1c5; --mal: #ff8a6b; --amb: #ffd27a; --gris: #8c929c; --grid: rgba(255,255,255,.065); --s-con: #7d6bff; --s-sin: #f2694a; --s-lim: #ffd27a; --s-crit: #ff4f7b;
  --v1: #304ffe; --v2: #5b4bff; --v3: #a99cff; --v4: #d4ceff; --lima: #d5ff3f;
  --bienbg: rgba(79,209,197,.12); --malbg: rgba(242,105,74,.14); --ambbg: rgba(255,210,122,.12); --track: rgba(255,255,255,.08);
  --g-ave: #7d6bff; --g-poli: #c08f1c; --g-mam: #22a89d; --g-herp: #f2694a; --g-inv: #d4ceff; --g-pla: #6f9e5a;
  --tone: #d4ceff; --tone-bg: rgba(169,156,255,.12); --tone2: #7d6bff;
  --num: 'Barlow Condensed', 'Arial Narrow', system-ui, sans-serif;
  color: var(--ink); font: 400 15px/1.5 Geist, Inter, system-ui, -apple-system, 'Segoe UI', sans-serif; -webkit-font-smoothing: antialiased; min-height: 100%; }
.inf2.go { --tone: #ff7a59; --tone-bg: rgba(255,122,89,.14); --tone2: #ff4f7b; }
.inf2.ok { --tone: #d5ff3f; --tone-bg: rgba(213,255,63,.1); --tone2: #4fd1c5; }
.inf2.parte { --tone: #ffd27a; --tone-bg: rgba(255,210,122,.12); --tone2: #ff7a59; }
.inf2 *, .inf2 *::before, .inf2 *::after { box-sizing: border-box; }
.inf2 p { margin: 0; }
.inf2 .i2-in { width: min(1280px, 100%); margin: 0 auto; padding: 0 clamp(16px, 3vw, 40px); }
/* barra superior */
.inf2 .i2-top { position: sticky; top: 0; z-index: 6; background: linear-gradient(rgba(10,12,14,.72), rgba(10,12,14,.5)); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border-bottom: 1px solid var(--line2); }
.inf2 .i2-top .i2-in { display: flex; align-items: center; gap: 8px; min-height: 56px; }
.inf2 .i2-k { flex: 1; min-width: 0; font: 600 11px/1.2 Geist, Inter, system-ui, sans-serif; letter-spacing: .16em; text-transform: uppercase; color: var(--mut); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.inf2 .i2-k b { color: var(--tone); font-weight: 600; }
.inf2 .i2-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 40px; padding: 8px 14px; border-radius: 10px; border: 1px solid var(--line); background: rgba(255,255,255,.06); color: inherit; font: 600 13px Geist, Inter, system-ui, sans-serif; cursor: pointer; white-space: nowrap; transition: background-color .15s, border-color .15s; }
.inf2 .i2-btn:hover { background: rgba(255,255,255,.13); }
.inf2 .i2-btn.pri { background: var(--tone); color: #121512; border-color: transparent; }
.inf2 .i2-btn.pri:hover { filter: brightness(1.08); }
.inf2 .i2-btn .i2-ic { width: 15px; height: 15px; }
.inf2 .i2-btn:focus-visible, .inf2 summary:focus-visible, .inf2 select:focus-visible, .inf2 input:focus-visible { outline: 2px solid var(--tone); outline-offset: 2px; }
.inf2 .i2-acc { display: flex; flex-wrap: wrap; gap: 8px; }
.inf2 .i2-acc.m { display: none; }
/* escenario de resultados */
.inf2 .i2-stage { padding-top: clamp(16px, 2.6vh, 32px); padding-bottom: 24px; display: grid; grid-template-columns: minmax(0, 1.02fr) minmax(0, 1fr); grid-template-areas: "kick kick" "tit tit" "ver graf" "kpis graf" "cad cad" "tl tl"; gap: 16px 24px; align-items: start; }
.inf2 .i2-kick { grid-area: kick; display: flex; flex-wrap: wrap; align-items: center; gap: 6px 12px; font: 600 12px/1.2 Geist, Inter, system-ui, sans-serif; letter-spacing: .16em; text-transform: uppercase; color: var(--mut); }
.inf2 .i2-pill { padding: 4px 10px; border-radius: 999px; border: 1px solid var(--line); letter-spacing: .08em; color: var(--ink2); }
.inf2 .i2-pill.t { border-color: color-mix(in srgb, var(--tone) 50%, transparent); color: var(--tone); }
.inf2 .i2-tit { grid-area: tit; margin: 0; }
.inf2 .i2-eye { display: block; font: 500 clamp(13px, 1.3vw, 16px)/1.2 Geist, Inter, system-ui, sans-serif; letter-spacing: .3em; text-transform: uppercase; color: var(--mut); margin-bottom: 4px; }
.inf2 .i2-big { display: block; font: 200 clamp(56px, calc(140vw / var(--len, 9)), 176px)/.84 var(--num); letter-spacing: .03em; text-transform: uppercase; color: var(--tone); overflow: clip; padding-bottom: .04em; text-wrap: balance; }
.inf2 .i2-big .l { background: linear-gradient(175deg, var(--tone) 30%, color-mix(in srgb, var(--tone2) 80%, var(--tone))); -webkit-background-clip: text; background-clip: text; color: transparent; }
.inf2 .i2-big .w { display: inline-block; white-space: nowrap; }
.inf2 .i2-big .l { display: inline-block; }
.inf2 .i2-sub { margin-top: 10px; display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 14px; }
.inf2 .i2-sub b { font: 400 clamp(22px, 2.4vw, 32px)/1.1 var(--num); letter-spacing: .02em; color: var(--ink); }
.inf2 .i2-sub span { font-size: 14.5px; color: var(--ink2); max-width: 70ch; text-wrap: pretty; }
.inf2 .i2-panel { position: relative; padding: 20px 22px; border-radius: 18px; border: 1px solid rgba(169,156,255,.16); background: radial-gradient(120% 70% at 100% 0%, rgba(125,107,255,.09), transparent 60%), linear-gradient(var(--card), var(--card)), var(--glass); box-shadow: var(--ui-glass-sh, 0 14px 38px rgba(0,0,0,.24)); min-width: 0; break-inside: avoid; }
.inf2 .i2-ver { grid-area: ver; border-left: 3px solid var(--tone); }
.inf2 .i2-vlab { font: 600 11px/1.2 Geist, Inter, system-ui, sans-serif; letter-spacing: .16em; text-transform: uppercase; color: var(--mut); }
.inf2 .i2-vf { margin-top: 8px; font: 500 clamp(16px, 1.5vw, 19px)/1.45 Geist, Inter, system-ui, sans-serif; text-wrap: pretty; }
.inf2 .i2-vs { margin-top: 12px; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.inf2 .i2-cnt { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 8px; background: rgba(255,255,255,.05); font: 500 13px/1.3 Geist, Inter, system-ui, sans-serif; color: var(--ink2); }
.inf2 .i2-cnt b { font-weight: 600; color: var(--ink); }
.inf2 .i2-cntt { font-size: 13px; color: var(--mut); }
.inf2 .i2-cnt.bien .i2-ic { color: var(--bien); } .inf2 .i2-cnt.mal .i2-ic { color: var(--mal); }
.inf2 .i2-alerta { margin-top: 12px; padding: 10px 14px; border-radius: 10px; background: var(--ambbg); border: 1px solid rgba(230,210,158,.28); font-size: 14px; line-height: 1.45; display: flex; gap: 10px; align-items: flex-start; }
.inf2 .i2-alerta .i2-ic { flex: none; width: 18px; height: 18px; margin-top: 2px; color: var(--amb); }
.inf2 .i2-alerta b { font-weight: 600; }
/* tarjeta de la regla (game over) */
.inf2 .i2-rg { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px 16px; margin-top: 12px; }
.inf2 .i2-rg > div { min-width: 0; }
.inf2 .i2-rg small { display: block; font: 600 10.5px/1.2 Geist, Inter, system-ui, sans-serif; letter-spacing: .14em; text-transform: uppercase; color: var(--mut); }
.inf2 .i2-rg b { display: block; margin-top: 4px; font: 500 clamp(26px, 2.6vw, 36px)/1 var(--num); letter-spacing: .01em; }
.inf2 .i2-rg b.t { color: var(--tone); }
.inf2 .i2-rg span { display: block; margin-top: 2px; font-size: 12.5px; color: var(--mut); }
.inf2 .i2-rgt { margin-top: 6px; font: 500 clamp(17px, 1.6vw, 20px)/1.35 Geist, Inter, system-ui, sans-serif; }
.inf2 .i2-rgt em { font-style: normal; color: var(--tone); }
.inf2 .i2-met { margin-top: 18px; }
.inf2 .i2-metr { position: relative; height: 10px; border-radius: 5px; background: var(--track); }
.inf2 .i2-metz { position: absolute; top: 0; bottom: 0; border-radius: 5px; background: repeating-linear-gradient(135deg, rgba(255,79,123,.36) 0 4px, rgba(255,79,123,.14) 4px 8px); }
.inf2 .i2-metu { position: absolute; top: -6px; bottom: -6px; width: 2px; margin-left: -1px; background: var(--s-crit); }
.inf2 .i2-meth { position: absolute; top: -3px; bottom: -3px; width: 1px; background: rgba(255,255,255,.45); }
.inf2 .i2-metv { position: absolute; top: 50%; width: 16px; height: 16px; margin: -8px 0 0 -8px; border-radius: 50%; background: var(--tone); box-shadow: 0 0 0 3px var(--bg); }
.inf2 .i2-metl { position: relative; height: 44px; font-size: 12px; color: var(--mut); }
.inf2 .i2-metl span { position: absolute; top: 8px; transform: translateX(-50%); white-space: nowrap; }
.inf2 .i2-metl span.u { color: var(--mal); }
.inf2 .i2-metl span.v { top: 22px; color: var(--ink); font-weight: 600; }
.inf2 .i2-seq { margin-top: 2px; display: flex; flex-wrap: wrap; align-items: center; gap: 6px; font-size: 13px; color: var(--ink2); }
.inf2 .i2-seq i { font-style: normal; padding: 2px 8px; border-radius: 6px; background: var(--malbg); color: var(--mal); font-weight: 600; }
/* cifras clave */
.inf2 .i2-cmp { grid-area: kpis; }
.inf2 .i2-cmph { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: baseline; gap: 4px 16px; margin-bottom: 10px; }
.inf2 .i2-lab { font: 600 11px/1.2 Geist, Inter, system-ui, sans-serif; letter-spacing: .16em; text-transform: uppercase; color: var(--mut); }
.inf2 .i2-cmph span:last-child { font-size: 12.5px; color: var(--mut); }
.inf2 .i2-kpis { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.inf2 .i2-kpi { padding: 14px 16px 16px; display: flex; flex-direction: column; }
.inf2 .i2-kn { font: 600 13.5px/1.3 Geist, Inter, system-ui, sans-serif; }
.inf2 .i2-ku { font-size: 12px; color: var(--mut); margin-top: 1px; }
.inf2 .i2-kv { display: flex; align-items: baseline; flex-wrap: wrap; gap: 4px 10px; margin-top: 10px; }
.inf2 .i2-kv b { font: 200 clamp(44px, 4.2vw, 64px)/.86 var(--num); letter-spacing: .005em; white-space: nowrap; }
.inf2 .i2-tag { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px 3px 6px; border-radius: 6px; font: 600 12px/1.2 Geist, Inter, system-ui, sans-serif; white-space: nowrap; background: rgba(255,255,255,.06); color: var(--ink2); }
.inf2 .i2-tag .i2-ic { width: 13px; height: 13px; stroke-width: 2; }
.inf2 .i2-tag.bien { background: var(--bienbg); color: var(--bien); } .inf2 .i2-tag.mal { background: var(--malbg); color: var(--mal); }
.inf2 .i2-bars { margin-top: auto; padding-top: 12px; display: grid; gap: 6px; }
.inf2 .i2-bar { display: grid; grid-template-columns: 1fr auto; gap: 3px 10px; align-items: center; font-size: 12px; color: var(--ink2); }
.inf2 .i2-bar span:nth-child(2) { font-weight: 600; color: var(--ink); font-variant-numeric: tabular-nums; }
.inf2 .i2-bar.ref span:nth-child(2) { color: var(--ink2); font-weight: 500; }
.inf2 .i2-tr { grid-column: 1 / -1; height: 6px; border-radius: 3px; background: var(--track); overflow: hidden; }
.inf2 .i2-tr i { display: block; height: 100%; border-radius: 3px; background: linear-gradient(90deg, var(--v2), var(--s-con) 60%, var(--v3)); transform-origin: left; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.inf2 .i2-tr i.ref { background: repeating-linear-gradient(90deg, var(--s-sin) 0 5px, transparent 5px 8px); }
/* gráficas */
.inf2 .i2-main { grid-area: graf; }
.inf2 .i2-sec { margin-top: 56px; }
.inf2 .i2-sh { margin-bottom: 16px; display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 8px 24px; }
.inf2 .i2-st { margin: 4px 0 0; font: 200 clamp(34px, 3.8vw, 54px)/1 var(--num); letter-spacing: .01em; }
.inf2 .i2-sd { font-size: 14px; color: var(--ink2); max-width: 70ch; }
.inf2 .i2-leg { display: flex; flex-wrap: wrap; gap: 6px 18px; font-size: 13px; color: var(--ink2); }
.inf2 .i2-leg span { display: inline-flex; align-items: center; gap: 8px; }
.inf2 .i2-leg i { display: inline-block; width: 24px; height: 0; border-top: 2px solid var(--s-con); }
.inf2 .i2-leg i.ref { border-top: 2px dashed var(--s-sin); } .inf2 .i2-leg i.lim { border-top: 1px solid var(--s-lim); }
.inf2 .i2-charts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.inf2 .i2-ch { margin: 0; }
.inf2 .i2-cht { font: 600 15.5px/1.25 Geist, Inter, system-ui, sans-serif; } .inf2 .i2-chs { font-size: 12.5px; color: var(--mut); margin-top: 2px; }
.inf2 .i2-ch .i2-leg { margin-top: 8px; font-size: 12px; }
.inf2 .i2-ch svg { display: block; width: 100%; height: auto; margin-top: 8px; touch-action: pan-y; overflow: visible; }
.inf2 .i2-tip { position: absolute; pointer-events: none; z-index: 3; padding: 8px 10px; border-radius: 8px; background: rgba(10,12,14,.96); border: 1px solid var(--line); font-size: 12.5px; line-height: 1.45; white-space: nowrap; display: none; }
.inf2 .i2-tip b { font-weight: 600; } .inf2 .i2-tip i { display: inline-block; width: 14px; height: 0; border-top: 2px solid var(--s-con); vertical-align: middle; margin-right: 6px; } .inf2 .i2-tip i.ref { border-top: 2px dashed var(--s-sin); }
.inf2 svg .ax { font: 500 11.5px Geist, Inter, system-ui, sans-serif; fill: var(--mut); font-variant-numeric: tabular-nums; }
.inf2 svg .gr { stroke: var(--grid); stroke-width: 1; } .inf2 svg .bl { stroke: rgba(255,255,255,.22); stroke-width: 1; }
.inf2 svg .ln { fill: none; stroke: var(--s-con); stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }
.inf2 svg .ar { fill: url(#i2-grad); opacity: 1; stroke: none; }
.inf2 svg .lr { fill: none; stroke: var(--s-sin); stroke-width: 2; stroke-dasharray: 5 5; stroke-linecap: round; }
.inf2 svg .lim { stroke: var(--s-lim); stroke-width: 1; stroke-dasharray: 4 3; }
.inf2 svg .limt { font: 600 11px Geist, Inter, system-ui, sans-serif; fill: var(--s-lim); }
.inf2 svg .halo { paint-order: stroke; stroke: var(--bg); stroke-width: 4px; stroke-linejoin: round; }
.inf2 svg .dot { fill: var(--s-con); stroke: var(--bg); stroke-width: 2; } .inf2 svg .dotr { fill: var(--bg); stroke: var(--s-sin); stroke-width: 2; }
.inf2 svg .gox { stroke: var(--s-crit); stroke-width: 2; stroke-linecap: round; }
.inf2 svg .gol { stroke: var(--s-crit); stroke-width: 1.5; stroke-dasharray: 2 3; }
.inf2 svg .val { font: 600 13.5px Geist, Inter, system-ui, sans-serif; fill: var(--ink); font-variant-numeric: tabular-nums; }
.inf2 svg .valr { font: 500 12px Geist, Inter, system-ui, sans-serif; fill: var(--ink2); font-variant-numeric: tabular-nums; }
.inf2 svg .sn { font: 500 11px Geist, Inter, system-ui, sans-serif; fill: var(--mut); }
.inf2 svg .got { font: 600 11px Geist, Inter, system-ui, sans-serif; fill: var(--s-crit); }
.inf2 svg .cr { stroke: rgba(255,255,255,.4); stroke-width: 1; }
/* relojes de 15 años (graficas_arte.js) y dona del veredicto */
.inf2 { --tb-sur: #14161b; }
.inf2 svg.ar-rad { display: block; margin: 8px auto 0; max-width: 100%; height: auto; overflow: visible; touch-action: pan-y; }
.inf2 svg.ar-rad:focus-visible { outline: 2px solid var(--v3); outline-offset: 2px; border-radius: 6px; }
.inf2 svg .ar-tk { font: 500 10px Geist, Inter, system-ui, sans-serif; fill: var(--mut); font-variant-numeric: tabular-nums; }
.inf2 svg .ar-tk.b { fill: var(--ink2); }
.inf2 svg .ar-c1 { font: 200 30px var(--num); fill: var(--ink); letter-spacing: .02em; }
.inf2 svg .ar-c2 { font: 600 9.5px Geist, Inter, system-ui, sans-serif; letter-spacing: .14em; text-transform: uppercase; fill: var(--mut); }
.inf2 .i2-tip .t { color: var(--v4); font-size: 11.5px; margin-bottom: 3px; } .inf2 .i2-tip .r { display: flex; align-items: center; gap: 6px; } .inf2 .i2-tip .r span { color: var(--mut); }
.inf2 .i2-dona { flex: none; display: block; }
.inf2 .i2-dona .dn, .inf2 svg .bn { font: 300 22px var(--num); fill: var(--ink); }
.inf2 svg .bn { font-size: 15px; font-weight: 400; fill: var(--ink); }
.inf2 .i2-cad .i2-paso b, .inf2 .i2-rs b { font-weight: 200; }
/* causa → efecto */
.inf2 .i2-cad { grid-area: cad; }
.inf2 .i2-cadl { display: flex; align-items: stretch; gap: 0; margin-top: 10px; overflow-x: auto; scrollbar-width: thin; }
.inf2 .i2-paso { flex: 1 1 0; min-width: 150px; padding: 10px 14px; border-radius: 12px; background: rgba(255,255,255,.045); border: 1px solid var(--line2); }
.inf2 .i2-paso small { display: block; font-size: 12px; line-height: 1.3; color: var(--ink2); }
.inf2 .i2-paso b { display: block; margin-top: 4px; font: 400 26px/1 var(--num); letter-spacing: .01em; }
.inf2 .i2-paso.fin { background: var(--tone-bg); border-color: color-mix(in srgb, var(--tone) 40%, transparent); }
.inf2 .i2-paso.fin b { color: var(--tone); }
.inf2 .i2-fl { flex: none; width: 28px; display: grid; place-items: center; color: var(--mut); }
.inf2 .i2-fl .i2-ic { width: 16px; height: 16px; }
/* línea de tiempo */
.inf2 .i2-tl { grid-area: tl; }
.inf2 .i2-tlw { position: relative; margin-top: 6px; }
.inf2 .i2-tlw svg { display: block; width: 100%; height: auto; overflow: visible; touch-action: pan-y; }
.inf2 svg .fb { fill: rgba(255,255,255,.035); } .inf2 svg .fb.b { fill: rgba(255,255,255,.015); }
.inf2 svg .fl { font: 600 10px Geist, Inter, system-ui, sans-serif; letter-spacing: .14em; text-transform: uppercase; fill: var(--mut); }
.inf2 svg .mk.bien { fill: var(--bien); } .inf2 svg .mk.mal { fill: var(--s-sin); } .inf2 svg .mk.neu { fill: var(--gris); }
.inf2 svg .mk { stroke: var(--bg); stroke-width: 1.5; }
.inf2 svg .mas { font: 600 10px Geist, Inter, system-ui, sans-serif; fill: var(--mut); }
.inf2 .i2-tll { display: flex; flex-wrap: wrap; gap: 4px 16px; font-size: 12px; color: var(--ink2); margin-top: 6px; }
.inf2 .i2-tll span { display: inline-flex; align-items: center; gap: 6px; }
.inf2 .i2-tll svg { width: 10px; height: 10px; }
/* informe completo */
.inf2 .i2-completo { padding-top: 8px; padding-bottom: 48px; }
.inf2 .i2-div { display: flex; align-items: center; gap: 16px; margin-top: 24px; font: 600 11px/1.2 Geist, Inter, system-ui, sans-serif; letter-spacing: .2em; text-transform: uppercase; color: var(--mut); scroll-margin-top: 64px; }
.inf2 .i2-div::before, .inf2 .i2-div::after { content: ''; flex: 1; height: 1px; background: var(--line); }
.inf2 .i2-duo { display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 6fr); gap: 16px; align-items: start; }
.inf2 .i2-box { padding: 20px; }
.inf2 .i2-bh { font: 600 15.5px/1.25 Geist, Inter, system-ui, sans-serif; } .inf2 .i2-bs { font-size: 13px; color: var(--mut); margin-top: 2px; }
.inf2 .i2-ball svg { display: block; width: 100%; max-width: 440px; height: auto; margin: 8px auto 0; overflow: visible; }
.inf2 svg .nl { font: 500 11px Geist, Inter, system-ui, sans-serif; fill: var(--ink2); } .inf2 svg .nl.fuera { fill: var(--mal); text-decoration: line-through; } .inf2 svg .nl.vuelve { fill: var(--bien); }
.inf2 svg .gl { font: 600 10px Geist, Inter, system-ui, sans-serif; letter-spacing: .14em; text-transform: uppercase; fill: var(--mut); }
.inf2 svg .ch0 { fill: none; stroke: rgba(238,240,234,.13); stroke-width: .7; } .inf2 svg .chp { fill: none; stroke: var(--mal); stroke-width: 1.6; } .inf2 svg .chn { fill: none; stroke: var(--bien); stroke-width: 1.6; }
.inf2 svg .nd { stroke: var(--bg); stroke-width: 1.2; } .inf2 svg .nd.fuera { fill: none !important; stroke: var(--mal); stroke-width: 1.8; } .inf2 svg .nd.aun { fill: none !important; stroke: var(--mut); stroke-width: 1; }
.inf2 svg .ga { fill: none; stroke-width: 3; stroke-linecap: round; }
.inf2 .i2-gleg { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px 14px; margin-top: 12px; font-size: 12px; color: var(--ink2); }
.inf2 .i2-gleg span { display: inline-flex; align-items: center; gap: 6px; } .inf2 .i2-gleg i { width: 9px; height: 9px; border-radius: 50%; display: inline-block; }
.inf2 .i2-gleg i.l { width: 20px; height: 0; border-radius: 0; border-top: 2px solid; }
.inf2 .i2-rs { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-top: 16px; }
.inf2 .i2-rs > div { padding: 10px 12px; border-radius: 10px; background: rgba(255,255,255,.04); font-size: 12.5px; line-height: 1.35; color: var(--ink2); }
.inf2 .i2-rs b { display: block; font: 400 32px/1 var(--num); color: var(--ink); margin-bottom: 4px; }
.inf2 .i2-rs b.bien { color: var(--bien); } .inf2 .i2-rs b.mal { color: var(--mal); }
.inf2 .i2-nota { margin-top: 12px; font-size: 12.5px; color: var(--mut); line-height: 1.5; }
.inf2 .i2-nota b { color: var(--ink2); font-weight: 600; }
.inf2 .i2-redg { display: grid; grid-template-columns: minmax(0, 440px) minmax(0, 1fr); gap: 16px 40px; align-items: center; }
.inf2 .i2-redg .i2-gleg { justify-content: flex-start; }
.inf2 .i2-fases { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; align-items: start; }
.inf2 .i2-fases .i2-box { padding: 16px 18px 8px; }
.inf2 .i2-leg .i2-eb { width: 18px; height: 18px; border-radius: 5px; display: inline-grid; place-items: center; }
.inf2 .i2-leg .i2-eb.bien { background: var(--bienbg); color: var(--bien); } .inf2 .i2-leg .i2-eb.mal { background: var(--malbg); color: var(--mal); }
.inf2 .i2-fh { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; padding-bottom: 6px; border-bottom: 1px solid var(--line); }
.inf2 .i2-fh b { font: 600 11px/1.2 Geist, Inter, system-ui, sans-serif; letter-spacing: .16em; text-transform: uppercase; color: var(--ink2); } .inf2 .i2-fh span { font-size: 12px; color: var(--mut); }
.inf2 .i2-ev { display: grid; grid-template-columns: 52px 22px 1fr; gap: 10px; align-items: start; padding: 8px 0; border-bottom: 1px solid var(--line2); break-inside: avoid; }
.inf2 .i2-ev:last-child { border-bottom: 0; }
.inf2 .i2-ea { font: 500 15px/1.25 var(--num); letter-spacing: .02em; color: var(--ink2); white-space: nowrap; }
.inf2 .i2-eb { width: 22px; height: 22px; border-radius: 6px; display: grid; place-items: center; background: rgba(255,255,255,.06); color: var(--ink2); }
.inf2 .i2-ev.bien .i2-eb { background: var(--bienbg); color: var(--bien); } .inf2 .i2-ev.mal .i2-eb { background: var(--malbg); color: var(--mal); }
.inf2 .i2-ic { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; flex: none; }
.inf2 .i2-et { font: 500 13.5px/1.35 Geist, Inter, system-ui, sans-serif; } .inf2 .i2-ex { margin-top: 2px; font-size: 12.5px; line-height: 1.4; color: var(--mut); }
.inf2 details.i2-mas > summary { cursor: pointer; padding: 10px 0 8px; font: 500 13px Geist, Inter, system-ui, sans-serif; color: var(--tone); }
.inf2 .i2-vacio { font-size: 13px; color: var(--mut); padding: 8px 0; }
/* plegables y tabla */
.inf2 details.i2-fold { margin-top: 16px; padding: 0; }
.inf2 details.i2-fold > summary { list-style: none; cursor: pointer; padding: 16px 20px; display: flex; align-items: center; gap: 12px; font: 600 15px/1.3 Geist, Inter, system-ui, sans-serif; }
.inf2 details.i2-fold > summary::-webkit-details-marker { display: none; }
.inf2 details.i2-fold > summary span { font: 400 13px Geist, Inter, system-ui, sans-serif; color: var(--mut); margin-left: auto; text-align: right; }
.inf2 details.i2-fold > summary::before { content: ''; width: 8px; height: 8px; border-right: 2px solid var(--mut); border-bottom: 2px solid var(--mut); transform: rotate(-45deg); transition: transform .15s; flex: none; }
.inf2 details.i2-fold[open] > summary::before { transform: rotate(45deg); }
.inf2 .i2-fb { padding: 0 20px 20px; overflow-x: auto; }
.inf2 table.i2-tab { width: 100%; border-collapse: collapse; font-size: 13.5px; font-variant-numeric: tabular-nums; }
.inf2 .i2-tab th { font: 600 10.5px/1.2 Geist, Inter, system-ui, sans-serif; letter-spacing: .12em; text-transform: uppercase; color: var(--mut); text-align: right; padding: 8px 10px; border-bottom: 1px solid var(--line); }
.inf2 .i2-tab td { padding: 8px 10px; border-bottom: 1px solid var(--line2); text-align: right; white-space: nowrap; }
.inf2 .i2-tab th:first-child, .inf2 .i2-tab td:first-child { text-align: left; white-space: normal; padding-left: 0; }
.inf2 .i2-tab tr.tema td { padding-top: 16px; font: 600 11px/1.2 Geist, Inter, system-ui, sans-serif; letter-spacing: .14em; text-transform: uppercase; color: var(--ink2); border-bottom: 1px solid var(--line); }
.inf2 .i2-tab td.bien { color: var(--bien); } .inf2 .i2-tab td.mal { color: var(--mal); } .inf2 .i2-tab td.igual { color: var(--mut); }
.inf2 .i2-tab .k { display: inline-block; margin-left: 6px; font-size: 10px; letter-spacing: .08em; color: var(--tone); text-transform: uppercase; }
.inf2 .i2-notas h4 { margin: 20px 0 8px; font: 600 11px/1.2 Geist, Inter, system-ui, sans-serif; letter-spacing: .16em; text-transform: uppercase; color: var(--mut); }
.inf2 .i2-notas h4:first-child { margin-top: 0; }
.inf2 .i2-reg { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.inf2 .i2-reg > div { padding: 10px 12px; border-radius: 10px; background: rgba(255,255,255,.035); font-size: 13px; line-height: 1.45; break-inside: avoid; }
.inf2 .i2-reg > div.go { box-shadow: inset 3px 0 0 var(--s-crit); }
.inf2 .i2-reg b { font-weight: 600; } .inf2 .i2-reg p { margin-top: 4px; font-size: 11.5px; color: var(--mut); overflow-wrap: anywhere; } .inf2 .i2-reg a { color: var(--ink2); }
.inf2 .i2-reg .fin { color: var(--ink2); } .inf2 .i2-reg .fin.mal { color: var(--mal); }
.inf2 .i2-notas ul { margin: 0; padding-left: 18px; font-size: 13px; line-height: 1.5; color: var(--ink2); } .inf2 .i2-notas li { margin: 4px 0; }
.inf2 .i2-pie { margin-top: 24px; font-size: 11.5px; color: var(--mut); }
/* balance de sostenibilidad (balance_final.js) */
.inf2 .i2-bal p { margin-top: 8px; font-size: 13.5px; line-height: 1.5; color: var(--ink2); }
.inf2 .i2-bal p:first-child { margin-top: 0; }
.inf2 .i2-bal .i2-bgo { margin-top: 12px; padding: 12px 14px; border-radius: 10px; background: var(--malbg); border: 1px solid rgba(224,102,90,.3); color: var(--ink); }
.inf2 .i2-bgr { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-top: 16px; }
.inf2 .i2-bgr > div { padding: 14px 16px; border-radius: 12px; background: rgba(255,255,255,.04); border: 1px solid var(--line2); min-width: 0; }
.inf2 .i2-bgr h4 { margin: 0; font: 600 15px/1.3 Geist, Inter, system-ui, sans-serif; }
.inf2 .i2-est { display: inline-block; margin-top: 8px; padding: 3px 8px; border-radius: 6px; font: 600 12px/1.3 Geist, Inter, system-ui, sans-serif; background: rgba(255,255,255,.06); color: var(--ink2); }
.inf2 .i2-est.mal { background: var(--malbg); color: var(--mal); } .inf2 .i2-est.bien { background: var(--bienbg); color: var(--bien); } .inf2 .i2-est.parte { background: var(--ambbg); color: var(--amb); }
.inf2 .i2-bgr p { font-size: 12.5px; }
.inf2 .i2-tray { margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--line2); }
.inf2 .i2-trc { display: flex; flex-wrap: wrap; gap: 10px 20px; align-items: center; font-size: 13px; color: var(--ink2); }
.inf2 .i2-trc label { display: inline-flex; align-items: center; gap: 8px; flex-wrap: wrap; min-width: 0; }
.inf2 .i2-trc select { max-width: 100%; min-height: 36px; padding: 6px 10px; border-radius: 8px; border: 1px solid var(--line); background: rgba(10,12,14,.8); color: var(--ink); font: 500 13px Geist, Inter, system-ui, sans-serif; }
.inf2 .i2-trc input[type=range] { width: min(320px, 60vw); accent-color: var(--s-con); }
.inf2 .i2-trc output { font-weight: 600; color: var(--ink); font-variant-numeric: tabular-nums; }
.inf2 [data-curva] svg { display: block; width: 100%; max-width: 760px; height: auto; margin-top: 10px; overflow: visible; }
.inf2 .i2-bal details { margin-top: 10px; border-top: 1px solid var(--line2); }
.inf2 .i2-bal details > summary { cursor: pointer; padding: 12px 0 4px; font: 600 14px Geist, Inter, system-ui, sans-serif; }
.inf2 .i2-bal details p { font-size: 12.5px; margin-top: 4px; }
.inf2 .i2-bal h4.par { margin: 20px 0 6px; font: 600 11px/1.2 Geist, Inter, system-ui, sans-serif; letter-spacing: .16em; text-transform: uppercase; color: var(--mut); }
.inf2 .i2-bal .i2-acc { margin-top: 16px; }
.inf2 .i2-fin { margin-top: 40px; display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
/* animación de entrada (solo si el sistema no pide reducir movimiento; .i2-ya = saltada o terminada) */
.inf2 .i2-salta { position: fixed; left: 50%; bottom: 18px; translate: -50% 0; z-index: 7; padding: 6px 12px; border-radius: 999px; background: rgba(10,12,14,.7); border: 1px solid var(--line); font-size: 12px; color: var(--ink2); pointer-events: none; display: none; }
.inf2.i2-anim:not(.i2-ya) .i2-salta { display: block; animation: i2in .4s .6s both; }
@media (prefers-reduced-motion: no-preference) {
  .inf2.i2-anim:not(.i2-ya) [data-a] { animation: i2sube .7s cubic-bezier(.2,.7,.2,1) calc(var(--d, 0) * 1ms) both; }
  .inf2.i2-anim:not(.i2-ya) .i2-big { animation: i2esp 1.5s cubic-bezier(.16,.8,.2,1) .25s both; }
  .inf2.i2-anim:not(.i2-ya) .i2-big .l { animation: i2letra .8s cubic-bezier(.2,.8,.2,1) calc(250ms + var(--i) * 55ms) both; }
  .inf2.i2-anim:not(.i2-ya) .i2-tr i { animation: i2barra 1.1s cubic-bezier(.2,.7,.2,1) calc(var(--d, 0) * 1ms) both; }
  .inf2.i2-anim:not(.i2-ya) .i2-metv { animation: i2marca 1.4s cubic-bezier(.3,.7,.2,1) 1.4s both; }
  .inf2.i2-anim:not(.i2-ya) .i2-metz, .inf2.i2-anim:not(.i2-ya) .i2-metu { animation: i2in .6s 1.3s both; }
  .inf2.i2-anim:not(.i2-ya) .i2-stage svg .ln, .inf2.i2-anim .i2-ch.rvc.vis svg .ln { stroke-dasharray: 1; animation: i2traza 1.6s cubic-bezier(.4,.1,.2,1) calc(var(--dd, 0) * 1ms) both; }
  .inf2.i2-anim:not(.i2-ya) .i2-stage svg .lr, .inf2.i2-anim .i2-ch.rvc.vis svg .lr { animation: i2corte 1.6s cubic-bezier(.4,.1,.2,1) calc(var(--dd, 0) * 1ms) both; }
  .inf2.i2-anim:not(.i2-ya) .i2-stage svg :is(.ar, .dot, .dotr, .val, .valr, .sn, .lim, .limt, .gol, .got, .gox), .inf2.i2-anim .i2-ch.rvc.vis svg :is(.ar, .dot, .dotr, .val, .valr, .sn, .lim, .limt, .gol, .got, .gox) { animation: i2in .5s calc((var(--dd, 0) + 1300) * 1ms) both; }
  .inf2.i2-anim .i2-ch.rvc:not(.vis) svg :is(.ln, .lr, .ar, .dot, .dotr, .val, .valr, .sn, .gol, .got, .gox) { opacity: 0; }
  .inf2.i2-anim:not(.i2-ya) .i2-tl svg .mk { transform-box: fill-box; transform-origin: center; animation: i2pop .45s cubic-bezier(.3,1.5,.5,1) calc(var(--d, 0) * 1ms) both; }
  .inf2.i2-anim .i2-sec.rv:not(.vis) { opacity: 0; translate: 0 24px; }
  .inf2.i2-anim .i2-sec.rv { transition: opacity .7s ease-out, translate .7s cubic-bezier(.2,.7,.2,1); }
}
@keyframes i2in { from { opacity: 0; } }
@keyframes i2sube { from { opacity: 0; translate: 0 22px; } }
@keyframes i2esp { from { letter-spacing: .4em; opacity: .2; } }
@keyframes i2letra { from { translate: 0 105%; opacity: 0; } }
@keyframes i2barra { from { transform: scaleX(0); } }
@keyframes i2marca { from { left: var(--x0); } }
@keyframes i2traza { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
@keyframes i2corte { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0 0 0 0); } }
@keyframes i2pop { from { opacity: 0; scale: 0; } }
@media (max-width: 1080px) {
  .inf2 .i2-stage { grid-template-columns: minmax(0, 1fr); grid-template-areas: "kick" "tit" "ver" "acc" "kpis" "graf" "cad" "tl"; }
  .inf2 .i2-acc.m { display: flex; grid-area: acc; }
  .inf2 .i2-top .hm { display: none; }
  .inf2 .i2-kpis { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .inf2 .i2-redg, .inf2 .i2-fases { grid-template-columns: minmax(0, 1fr); }
  .inf2 .i2-redg .i2-gleg { justify-content: center; }
}
@media (max-width: 760px) {
  .inf2 { font-size: 14px; }
  .inf2 .i2-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
  .inf2 .i2-kpi { padding: 12px 12px 14px; }
  .inf2 .i2-kv b { font-size: 34px; }
  .inf2 .i2-rg { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .inf2 .i2-panel { padding: 16px 14px; border-radius: 14px; }
  .inf2 .i2-charts, .inf2 .i2-bgr, .inf2 .i2-reg, .inf2 .i2-rs { grid-template-columns: minmax(0, 1fr); gap: 12px; }
  .inf2 .i2-cadl { flex-direction: column; overflow: visible; }
  .inf2 .i2-paso { min-width: 0; display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
  .inf2 .i2-paso b { margin-top: 0; font-size: 22px; white-space: nowrap; }
  .inf2 .i2-fl { width: auto; height: 22px; } .inf2 .i2-fl .i2-ic { rotate: 90deg; }
  .inf2 .i2-sec { margin-top: 40px; }
  .inf2 .i2-tab { font-size: 12.5px; } .inf2 .i2-tab th, .inf2 .i2-tab td { padding: 7px 6px; }
  .inf2 details.i2-fold > summary { padding: 14px; flex-wrap: wrap; } .inf2 details.i2-fold > summary span { margin-left: 20px; text-align: left; width: 100%; }
  .inf2 .i2-fb { padding: 0 14px 14px; }
  .inf2 .i2-top .i2-in { min-height: 52px; }
  .inf2 .i2-acc .i2-btn { flex: 1 1 auto; }
}
@media print {
  #su-inf.i2-dlg { position: static !important; width: auto; height: auto; overflow: visible; background: #fff; color: #111; }
  #su-inf.i2-dlg::backdrop { display: none; }
  #su-inf.i2-dlg > .caja { height: auto; overflow: visible; }
  .inf2 { --ink: #111; --ink2: #333; --mut: #6b6b6b; --line: #d4d4d4; --line2: #e8e8e8; --card: #fff; --glass: #fff; --glass-bd: #d4d4d4; --bg: #fff; --bien: #12813a; --mal: #c0392b; --amb: #8a6200; --gris: #8a8a8a; --grid: #ececec;
    --s-con: #1a8a6a; --s-lim: #d0473a; --tone: #333; --tone-bg: #f3f3f3; --bienbg: #e6f4ea; --malbg: #fbe9e7; --ambbg: #fff4e0; --track: #eee; color: #111; }
  .inf2.go { --tone: #c0392b; } .inf2.ok { --tone: #1a6f3c; }
  .inf2 .i2-top, .inf2 .i2-acc, .inf2 .i2-fin, .inf2 .i2-salta, .inf2 .i2-bal button { display: none !important; }
  .inf2 .i2-panel { box-shadow: none; background: #fff; }
  .inf2 .i2-stage { display: block; } .inf2 .i2-stage > * { margin-bottom: 14px; }
  .inf2 .i2-tr i.ref { background: #bdbdbd; } .inf2 svg .ch0 { stroke: rgba(0,0,0,.14); } .inf2 svg .bl { stroke: #bbb; } .inf2 svg .cr, .inf2 .i2-tip { display: none !important; }
  .inf2 .i2-sec.rv { opacity: 1 !important; translate: none !important; }
  .inf2 .i2-ch svg * { opacity: 1 !important; }
  .inf2 details.i2-fold > summary::before { display: none; }
}`;

function ponerCss() {
  if (document.getElementById('inf2-css')) return;
  if (!document.querySelector('link[data-inf2-fuentes]')) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.dataset.inf2Fuentes = '1';
    l.href = 'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@300;400;500;600&family=Geist:wght@400;500;600&display=swap'; document.head.appendChild(l); }
  const s = document.createElement('style'); s.id = 'inf2-css'; s.textContent = CSS; document.head.appendChild(s);
  // al imprimir se abren los plegables (tabla y notas) para que salgan en el PDF
  window.addEventListener('beforeprint', () => document.querySelectorAll('.inf2 details').forEach(d => { if (!d.open) { d.open = true; d.dataset.i2Cerrar = '1'; } }));
  window.addEventListener('afterprint', () => document.querySelectorAll('.inf2 details[data-i2-cerrar]').forEach(d => { d.open = false; delete d.dataset.i2Cerrar; }));
}

/* ---------- cambio entre dos valores ---------- */
function cambio(it, a, b) {
  if (a == null || b == null) return null;
  let d, txt, igual, dd;
  if (it.dif === 'pts') { d = (b - a) * (it.esc || 1); dd = Math.abs(d); igual = dd < 0.5; txt = `${SG(d)}${nf(dd, dd < 10 ? 1 : 0)} pts`; }
  else if (it.dif === 'db') { d = b - a; dd = Math.abs(d); igual = dd < 0.2; txt = `${SG(d)}${nf(dd, 1)} dB`; }
  else if (it.dif === 'abs') { d = Math.round(b - a); dd = Math.abs(d); igual = d === 0; txt = `${SG(d)}${nf(dd)} ${dd === 1 ? it.u[0] : it.u[1]}`; }
  else { if (Math.abs(a) < 1e-9) { d = b - a; dd = Math.abs(d); igual = dd < 1e-6; txt = `${SG(d)}${nf(dd)}`; } else { d = (b - a) / Math.abs(a); dd = Math.abs(d) * 100; igual = dd < 2; txt = `${SG(d)}${nf(dd, dd < 10 ? 1 : 0)} %`; } }
  const cls = igual ? 'igual' : ((d > 0) === it.sube ? 'bien' : 'mal');
  return { d, dd, txt, cls, igual };
}
const PALABRA = { bien: 'mejor', mal: 'peor', igual: 'casi igual' };
const tag = (c) => c ? `<span class="i2-tag ${c.cls}">${icono(c.igual ? 'igual' : c.d > 0 ? 'sube' : 'baja')}${esc(c.igual ? 'casi igual' : c.txt + ' · ' + PALABRA[c.cls])}</span>` : '';

/* ---------- series: promedio cada CADA semanas ---------- */
function serie(H, fn, n = H.length) {
  const out = []; n = Math.min(n, H.length);
  for (let i = 0; i < n; i += CADA) { let s = 0, k = 0; const j1 = Math.min(n, i + CADA); for (let j = i; j < j1; j++) { const v = fn(H[j]); if (v != null && isFinite(v)) { s += v; k++; } } if (k) out.push([H[j1 - 1].sem || j1, s / k]); }
  if (n && out.length && out[out.length - 1][0] !== (H[n - 1].sem || n)) { const v = fn(H[n - 1]); if (v != null && isFinite(v)) out.push([H[n - 1].sem || n, v]); }
  return out;
}
function paso(lo, hi, n) { const r = (hi - lo) / n || 1, p = Math.pow(10, Math.floor(Math.log10(r))), f = r / p; return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * p; }

/* ---------- gráfica en años: con (ámbar) y sin (gris punteada) en la misma escala ---------- */
function grafica(G, W) {
  const H = W < 480 ? 200 : 236, L = 46, R = W < 480 ? 66 : 78, T = 14, B = 28, pw = W - L - R, ph = H - T - B;
  const x = (w) => L + Math.max(0, Math.min(FIN, w)) / FIN * pw;
  const vs = G.s.map(p => p[1]).concat(G.r ? G.r.map(p => p[1]) : []); if (G.lim != null) vs.push(G.lim);
  let lo = Math.min(...vs), hi = Math.max(...vs); const pos = lo >= 0; if (hi - lo < 1e-9) { lo -= Math.abs(lo) * 0.1 || 1; hi += Math.abs(hi) * 0.1 || 1; }
  const pad = (hi - lo) * 0.12; lo -= pad; hi += pad; if (pos && lo < 0) lo = 0;
  const st = paso(lo, hi, 3); lo = Math.floor(lo / st) * st; if (pos && lo < 0) lo = 0; hi = Math.ceil(hi / st) * st;
  const y = (v) => T + (1 - (v - lo) / (hi - lo)) * ph, dec = st < 0.1 ? 2 : st < 1 ? 1 : 0;
  let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(G.t)}: años 1 a 15"><defs><linearGradient id="i2-grad" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#7d6bff" stop-opacity=".45"/><stop offset="1" stop-color="#304ffe" stop-opacity="0"/></linearGradient></defs>`;
  for (let v = lo; v <= hi + st * 1e-6; v += st) s += `<line class="gr" x1="${L}" x2="${L + pw}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}"/><text class="ax" x="${L - 8}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end">${esc(G.fa ? G.fa(v) : nf(v, dec))}</text>`;
  s += `<line class="bl" x1="${L}" x2="${L + pw}" y1="${T + ph}" y2="${T + ph}"/>`;
  for (const a of (W < 480 ? [1, 5, 10, 15] : [1, 3, 5, 7, 9, 11, 13, 15])) { const xa = x((a - 0.5) * AÑO); s += `<text class="ax" x="${xa.toFixed(1)}" y="${T + ph + 18}" text-anchor="middle">${a === 1 ? 'año 1' : a}</text>`; }
  let yl = null, limArriba = true;
  if (G.lim != null) { yl = y(G.lim); limArriba = yl > T + 16; s += `<line class="lim" x1="${L}" x2="${L + pw}" y1="${yl.toFixed(1)}" y2="${yl.toFixed(1)}"/><text class="limt halo" x="${L + 6}" y="${(limArriba ? yl - 6 : yl + 14).toFixed(1)}">${esc(G.limTxt || 'límite')}</text>`; }
  const path = (P) => P.map((p, i) => (i ? 'L' : 'M') + x(p[0]).toFixed(1) + ',' + y(p[1]).toFixed(1)).join('');
  const labs = []; // etiquetas finales: [y deseada, html]
  if (G.r && G.r.length) { s += `<path class="lr" d="${path(G.r)}"/>`; const e = G.r[G.r.length - 1], xe = x(e[0]), ye = y(e[1]);
    if (G.goB) { s += `<path class="gox" d="M${xe - 5},${ye - 5}L${xe + 5},${ye + 5}M${xe + 5},${ye - 5}L${xe - 5},${ye + 5}"/>`;
      // la etiqueta va donde menos choca: con la línea «con», su etiqueta final, la del límite y la del game over propio
      const txt = `${W < 480 || G.go ? 'sin: ' : 'sin propuesta: '}game over año ${añoDe(G.goB)}`, tw = txt.length * 6.3;
      const eC = G.s[G.s.length - 1], xC = x(eC[0]), yC = Math.max(T + 6, Math.min(T + ph - 4, y(eC[1])));
      const obs = [{ x0: xC - 6, x1: xC + 92, y0: yC - 14, y1: yC + 17 }];
      if (yl != null) { const b = limArriba ? yl - 6 : yl + 14; obs.push({ x0: L + 4, x1: L + 8 + (G.limTxt || 'límite').length * 6, y0: b - 11, y1: b + 3 }); }
      if (G.go) { const xg = x(G.go); obs.push({ x0: xg - 6 - 120, x1: xg, y0: T, y1: T + 16 }, { x0: xg - 2, x1: xg + 2, y0: T, y1: T + ph }); }
      const solapa = (a, b) => Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)) * Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));
      let mejor = null;
      for (const [izq, dy] of [[false, -12], [false, 20], [true, -12], [true, 20]]) {
        const yy = ye + dy, r = { x0: izq ? xe - 9 - tw : xe + 9, x1: izq ? xe - 9 : xe + 9 + tw, y0: yy - 11, y1: yy + 3 };
        let c = obs.reduce((t, o) => t + solapa(r, o), 0); if (r.x0 < L - 30 || r.x1 > W - 2 || r.y0 < 0 || r.y1 > T + ph) c += 5000;
        for (const p of G.s) { const px = x(p[0]), py = y(p[1]); if (px >= r.x0 && px <= r.x1 && py >= r.y0 - 2 && py <= r.y1 + 2) c += 60; }
        if (!mejor || c < mejor.c) mejor = { c, izq, yy, xx: izq ? xe - 9 : xe + 9 }; }
      s += `<text class="got halo" x="${mejor.xx.toFixed(1)}" y="${mejor.yy.toFixed(1)}" text-anchor="${mejor.izq ? 'end' : 'start'}">${esc(txt)}</text>`; }
    else { s += `<circle class="dotr" cx="${xe.toFixed(1)}" cy="${ye.toFixed(1)}" r="4"/>`; labs.push({ y: ye, x: xe, cls: 'valr', t: G.fy(e[1]), sn: 'sin' }); } }
  s += `<path class="ar" d="${path(G.s)}L${x(G.s[G.s.length - 1][0]).toFixed(1)},${T + ph}L${x(G.s[0][0]).toFixed(1)},${T + ph}Z"/><path class="ln" pathLength="1" d="${path(G.s)}"/>`;
  const e = G.s[G.s.length - 1], xe = x(e[0]), ye = y(e[1]);
  if (G.go) { const xg = x(G.go); s += `<line class="gol" x1="${xg.toFixed(1)}" x2="${xg.toFixed(1)}" y1="${T}" y2="${T + ph}"/>`;
    const der = xg < L + pw * 0.5; s += `<text class="got halo" x="${(der ? xg + 6 : xg - 6).toFixed(1)}" y="${T + 12}" text-anchor="${der ? 'start' : 'end'}">game over · año ${añoDe(G.go)}</text>`; }
  s += `<circle class="dot" cx="${xe.toFixed(1)}" cy="${ye.toFixed(1)}" r="5"/>`;
  labs.push({ y: ye, x: xe, cls: 'val', t: G.fy(e[1]), sn: G.r ? 'con' : '' });
  // separa las etiquetas que se montan (mínimo 30 px: valor + nombre debajo)
  labs.sort((a, b) => a.y - b.y); for (let i = 1; i < labs.length; i++) if (labs[i].y - labs[i - 1].y < 30) { const m = (labs[i].y + labs[i - 1].y) / 2; labs[i - 1].y = m - 15; labs[i].y = m + 15; }
  for (const l of labs) { const yy = Math.max(T + 6, Math.min(T + ph - 4, l.y)), xx = Math.min(W - R + 10, l.x + 10);
    s += `<text class="${l.cls} halo" x="${xx.toFixed(1)}" y="${(yy + (l.sn ? 0 : 5)).toFixed(1)}">${esc(l.t)}</text>`;
    if (l.sn) s += `<text class="sn halo" x="${xx.toFixed(1)}" y="${(yy + 13).toFixed(1)}">${W < 480 ? l.sn : l.sn === 'con' ? 'con propuesta' : 'sin propuesta'}</text>`; }
  s += `<g class="i2-x" style="display:none"><line class="cr" y1="${T}" y2="${T + ph}"/><circle class="dot" r="4.5"/></g>`;
  return { svg: s + '</svg>', x, y, L, pw, T, ph, H };
}

/* ---------- la «bola» de interacciones (estado final; perdidas en rojo, nuevas en verde) ---------- */
function bola(RD, W, presF, presFl, cambiosF) {
  const N = RD.nodos.length, full = W >= 420, lab = full ? 96 : 66, Rr = Math.max(64, (W - 2 * lab) / 2 - 4), cx = W / 2, cy = Rr + lab + 2, H = Math.round(cy + Rr + 34); // abajo solo hay plantas (sin nombres): menos margen
  // orden: por grupo; las plantas, según el ángulo medio de la fauna con la que se relacionan (menos cruces)
  const ord = []; for (const G of GRUPOS) if (G.k !== 'pla') RD.nodos.forEach((n, i) => { if (n.g === G.k) ord.push(i); });
  const posF = new Map(ord.map((i, k) => [i, k])); const pla = RD.nodos.map((n, i) => i).filter(i => RD.nodos[i].g === 'pla');
  const m = new Map(pla.map(i => [i, []])); for (const [a, b] of RD.enl) { if (m.has(a) && posF.has(b)) m.get(a).push(posF.get(b)); if (m.has(b) && posF.has(a)) m.get(b).push(posF.get(a)); }
  pla.sort((a, b) => { const ma = m.get(a), mb = m.get(b); const va = ma.length ? ma.reduce((s, v) => s + v, 0) / ma.length : 99, vb = mb.length ? mb.reduce((s, v) => s + v, 0) / mb.length : 99; return vb - va; });
  ord.push(...pla);
  const WF = 2.6, gap = 2.6, ngr = GRUPOS.filter(G => ord.some(i => RD.nodos[i].g === G.k)).length, nFa = ord.length - pla.length, paso1 = 2 * Math.PI / (nFa * WF + pla.length + ngr * gap);
  const ang = new Float64Array(N); let a = -Math.PI / 2 - paso1 * nFa * WF * 0.5, prev = null; const arcos = [];
  for (const i of ord) { const n = RD.nodos[i], g = n.g, w = n.fa ? WF : 1; if (prev !== null && g !== prev) a += paso1 * gap; a += paso1 * w / 2; if (g !== prev) arcos.push({ g, a0: a }); ang[i] = a; arcos[arcos.length - 1].a1 = a; a += paso1 * w / 2; prev = g; }
  const P = (i, r = Rr) => [cx + r * Math.cos(ang[i]), cy + r * Math.sin(ang[i])];
  const vivo = (i) => RD.nodos[i].fa ? presF.has(RD.nodos[i].id) : presFl.has(RD.nodos[i].id);
  let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Red de interacciones al final">`;
  for (const A of arcos) { const r = Rr + 8, p0 = [cx + r * Math.cos(A.a0 - paso1 * .4), cy + r * Math.sin(A.a0 - paso1 * .4)], p1 = [cx + r * Math.cos(A.a1 + paso1 * .4), cy + r * Math.sin(A.a1 + paso1 * .4)], big = A.a1 - A.a0 > Math.PI ? 1 : 0;
    s += `<path class="ga" style="stroke:var(--g-${A.g})" d="M${p0[0].toFixed(1)},${p0[1].toFixed(1)}A${r},${r} 0 ${big} 1 ${p1[0].toFixed(1)},${p1[1].toFixed(1)}"/>`;
    if (A.g === 'pla') { const am = (A.a0 + A.a1) / 2, rr = Rr + 20; s += `<text class="gl" x="${(cx + rr * Math.cos(am)).toFixed(1)}" y="${(cy + rr * Math.sin(am) + 4).toFixed(1)}" text-anchor="${Math.cos(am) < -0.2 ? 'end' : Math.cos(am) > 0.2 ? 'start' : 'middle'}">Plantas (${pla.length})</text>`; } }
  const cuerda = (i, j) => { const [x1, y1] = P(i, Rr - 5), [x2, y2] = P(j, Rr - 5), mx = (x1 + x2) / 2, my = (y1 + y2) / 2, qx = cx + (mx - cx) * 0.18, qy = cy + (my - cy) * 0.18; return `M${x1.toFixed(1)},${y1.toFixed(1)}Q${qx.toFixed(1)},${qy.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`; };
  let c0 = '', cp = '', cn = '';
  for (const [i, j] of RD.enl) { const st = cambiosF.get(i + '|' + j); if (st === 'perdida') cp += cuerda(i, j); else if (st === 'nueva') cn += cuerda(i, j); else if (vivo(i) && vivo(j)) c0 += cuerda(i, j); }
  s += `<path class="ch0" d="${c0}"/>` + (cp ? `<path class="chp" d="${cp}"/>` : '') + (cn ? `<path class="chn" d="${cn}"/>` : '');
  for (const i of ord) { const n = RD.nodos[i], [x, y] = P(i), fuera = !vivo(i), cl = fuera ? ((n.fa || !RD.floraNuevas.includes(n.id)) ? ' fuera' : ' aun') : '';
    const r = n.fa ? 4.4 : 2.6; s += `<circle class="nd${cl}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" style="fill:var(--g-${n.g})"><title>${esc(n.n)} · ${GRUPOS.find(G => G.k === n.g).n}${fuera ? ' · ya no está en Kennedy' : ''}</title></circle>`;
    if (n.fa) { const c = Math.cos(ang[i]), izq = c < 0, [lx, ly] = P(i, Rr + 15), rot = ang[i] * 180 / Math.PI + (izq ? 180 : 0);
      const cls = !vivo(i) ? ' fuera' : (cambiosF.get('v:' + n.id) ? ' vuelve' : '');
      s += `<text class="nl${cls}" x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" dy="3.5" text-anchor="${izq ? 'end' : 'start'}" transform="rotate(${rot.toFixed(1)} ${lx.toFixed(1)} ${ly.toFixed(1)})">${esc(full ? n.n : n.c)}</text>`; } }
  return s + '</svg>';
}

/* presencia de la fauna en el tiempo: si ind() trae `presentes` (ids) se usa; si no, se reconstruye con las extinciones semanales
   (todas presentes al inicio cuando fauna0 = 23; una extinción la quita; si el conteo `fauna` del modelo sube, vuelve la última que desapareció) */
function presenciaFauna(H, ext) {
  const ids = FAUNA.map(f => f[0]), L = H[H.length - 1];
  if (Array.isArray(H[0].presentes) && Array.isArray(L.presentes)) return { ini: new Set(H[0].presentes), fin: new Set(L.presentes), volvieron: [], fuera: [], exacto: true };
  const set = new Set(ids), pila = [], volvieron = [], porSem = new Map();
  const E = []; for (const h of H) if (h.extinciones && h.extinciones.length) E.push(...h.extinciones); const XS = E.length ? E : (ext || []);
  for (const x of XS) { if (!porSem.has(x.sem)) porSem.set(x.sem, []); porSem.get(x.sem).push(x); }
  const fuera = [];
  for (const h of H) { for (const x of porSem.get(h.sem) || []) { if (set.delete(x.especie)) { pila.push(x); fuera.push(x); } }
    while (h.fauna != null && h.fauna > set.size && pila.length) { const x = pila.pop(); set.add(x.especie); volvieron.push({ ...x, semVuelve: h.sem }); } }
  return { ini: new Set(ids), fin: set, volvieron, fuera, exacto: H[0].fauna0 === ids.length };
}

const REDU = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
/* ---------- línea de tiempo de avisos (años 1–15, por plazo) ---------- */
function lineaTiempo(EV, W, go) {
  /* burbujas por año: área ∝ número de avisos; cada burbuja es una dona de buenos (turquesa), malos (coral) y neutros (gris) */
  const H = W < 520 ? 150 : 176, L = 10, R = 10, T = 22, y0 = H - 22, pw = W - L - R, x = (a) => L + (a - 0.5) / 15 * pw;
  const por = []; for (let a = 1; a <= 15; a++) por.push({ a, b: 0, m: 0, n: 0, ev: [] });
  for (const e of EV) { const a = añoDe(e.sem), q = por[Math.min(14, a - 1)], g = /^game over/i.test(e.titulo); q.ev.push(e); if (g || e.signo < 0) q.m++; else if (e.signo > 0) q.b++; else q.n++; }
  const mx = Math.max(1, ...por.map((q) => q.ev.length)), rMax = Math.max(8, Math.min(pw / 15 / 2 - 1.5, (y0 - T - 8) / 2)), cy = T + 4 + (y0 - T - 8) / 2;
  let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Avisos del modelo por año: burbujas de 15 años">`;
  FASES.forEach((F, i) => { const a = L + (F.a0 - 1) / 15 * pw, b = L + Math.min(15, F.a1) / 15 * pw;
    s += `<rect class="fb${i % 2 ? ' b' : ''}" x="${a.toFixed(1)}" y="${T - 14}" width="${(b - a).toFixed(1)}" height="${y0 - T + 14}" rx="10"/><text class="fl" x="${(a + 8).toFixed(1)}" y="${T - 2}">${W < 520 ? F.n.split(' ')[0] : F.n + ' · años ' + F.a0 + '–' + Math.min(15, F.a1)}</text>`; });
  s += `<line class="gr" x1="${L}" x2="${L + pw}" y1="${cy.toFixed(1)}" y2="${cy.toFixed(1)}"/>`;
  for (let a = 1; a <= 15; a++) { if (W < 520 && a !== 1 && a % 5) continue; s += `<text class="ax" x="${x(a).toFixed(1)}" y="${y0 + 16}" text-anchor="middle">${a === 1 ? 'año 1' : a}</text>`; }
  if (go) { const xg = L + Math.max(0, Math.min(FIN, go.sem)) / FIN * pw; s += `<line class="gol" x1="${xg.toFixed(1)}" x2="${xg.toFixed(1)}" y1="${T - 14}" y2="${y0}"/><text class="got halo" x="${(xg + 4).toFixed(1)}" y="${y0 - 4}">game over</text>`; }
  const pts = []; let k = 0;
  for (const q of por) { if (!q.ev.length) { s += `<circle cx="${x(q.a).toFixed(1)}" cy="${cy.toFixed(1)}" r="1.6" fill="rgba(255,255,255,.25)"/>`; continue; }
    const r = Math.max(5, rMax * Math.sqrt(q.ev.length / mx)), cx = x(q.a), d = 2600 + Math.min(1400, k++ * 70), segs = [[q.b, 'var(--bien)'], [q.m, 'var(--s-sin)'], [q.n, 'var(--gris)']].filter((z) => z[0] > 0);
    let a0 = -Math.PI / 2, g = '';
    for (const [n, c] of segs) { const a1 = a0 + n / q.ev.length * Math.PI * 2, ri = r * 0.55;
      if (segs.length === 1) g += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${((r + ri) / 2).toFixed(1)}" fill="none" stroke="${c}" stroke-width="${(r - ri).toFixed(1)}"/>`;
      else { const P = (rr, aa) => `${(cx + rr * Math.cos(aa)).toFixed(1)} ${(cy + rr * Math.sin(aa)).toFixed(1)}`, L2 = a1 - a0 > Math.PI ? 1 : 0;
        g += `<path d="M${P(r, a0)}A${r.toFixed(1)} ${r.toFixed(1)} 0 ${L2} 1 ${P(r, a1)}L${P(ri, a1)}A${ri.toFixed(1)} ${ri.toFixed(1)} 0 ${L2} 0 ${P(ri, a0)}Z" fill="${c}" stroke="var(--bg)" stroke-width="1.2"/>`; }
      a0 = a1; }
    s += `<g class="mk" style="--d:${d}">${g}${r >= 11 ? `<text class="bn" x="${cx.toFixed(1)}" y="${(cy + 4).toFixed(1)}" text-anchor="middle">${q.ev.length}</text>` : ''}</g>`;
    pts.push({ x: cx, y: cy, r, e: { sem: (q.a - 1) * AÑO + 1, titulo: `${q.ev.length} avisos · ${q.b} buenos · ${q.m} malos`, lista: q.ev.slice(0, 5).map((e) => e.titulo).concat(q.ev.length > 5 ? [`y ${q.ev.length - 5} más`] : []) } }); }
  return { svg: s + '</svg>', pts };
}
/* dona del veredicto: indicadores clave que mejoran / empeoran / casi iguales (segmentos rotulados en la leyenda de al lado) */
function donaVer(b, m, i) {
  const n = b + m + i, R = 34, r = 22, c = 42; if (!n) return '';
  let a0 = -Math.PI / 2, s = `<svg class="i2-dona" viewBox="0 0 84 84" width="84" height="84" role="img" aria-label="${b} mejoran, ${m} empeoran y ${i} casi iguales de ${n} indicadores clave">`;
  const P = (rr, aa) => `${(c + rr * Math.cos(aa)).toFixed(2)} ${(c + rr * Math.sin(aa)).toFixed(2)}`;
  for (const [v, col] of [[b, 'var(--bien)'], [m, 'var(--s-sin)'], [i, 'var(--gris)']]) { if (!v) continue; const a1 = a0 + v / n * Math.PI * 2 - (v === n ? 1e-3 : 0), L = a1 - a0 > Math.PI ? 1 : 0;
    s += `<path d="M${P(R, a0 + 0.02)}A${R} ${R} 0 ${L} 1 ${P(R, a1 - 0.02)}L${P(r, a1 - 0.02)}A${r} ${r} 0 ${L} 0 ${P(r, a0 + 0.02)}Z" fill="${col}"/>`; a0 = a1 + (v === n ? 1e-3 : 0); }
  return s + `<text x="42" y="46" text-anchor="middle" class="dn">${n}</text></svg>`;
}
const FLECHA = '<svg class="i2-ic" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 8h11M9 4l4 4-4 4"/></svg>';

/* ======================================================================= */
let OBS = null, IOB = null;
export function abrirInforme2({ parametros={}, definiciones=[], cont, sim, def = {}, hist, base = null, reglas = [], go = null, eventos = [], extinciones = [], ind = [], semilla = 1, cadena = null, onCerrar = null, onReiniciar = null, animar = true }) {
  const t0 = performance.now();
  if (!cont || !hist || !hist.length) return null;
  ponerCss();
  const H = hist, nH = H.length, L = H[nH - 1], wFin = L.sem || nH;
  const i1 = Math.min(nH - 1, AÑO - 1), A1 = H[i1];
  const B = base && base.length && sim !== 1 ? base : null;
  const nC = B ? Math.min(nH, B.length) : 0, HC = B ? H[nC - 1] : null, BC = B ? B[nC - 1] : null, wC = HC ? (HC.sem || nC) : 0;
  const baseCorta = B && B.length < nH, añoC = añoDe(wC);
  const indMap = new Map((ind || []).map(x => [x.k, x]));
  const IT = (it) => { const o = indMap.get(it.k); return o ? { ...it, n: o.n || it.n, sube: o.sube != null ? o.sube : it.sube, f: it.f } : it; };
  const conProp = def.propuesta != null ? !!def.propuesta : (def.grupo === 'propuesta');
  const RG = (reglas && reglas.length ? reglas : Object.keys(VAL).map(k => ({ k, n: k, umbral: UMB[k] }))).filter(r => ['abasto','habitat','residuos'].includes(r.k));
  const umb = (k) => { const r = RG.find(x => x.k === k); return r && r.umbral != null ? r.umbral : UMB[k]; };
  const goB = B?.at(-1)?.evaluacion?.territorio?.gameOver;
  const temas = TEMAS.map(T => ({ ...T, items: T.items.map(IT).filter(it => get(L, it.k) != null && (!it.soloSi || it.soloSi(H)) && !(H.every(h => !get(h, it.k)) && (!B || B.every(h => !get(h, it.k))))) })).filter(T => T.items.length);
  const comps = [], filas = [];
  for (const T of temas) { filas.push(`<tr class="tema"><td colspan="4">${esc(T.n)}</td></tr>`);
    for (const it of T.items) {
      const ha = B ? BC : A1, hb = B ? HC : L, a = get(ha, it.k), b = get(hb, it.k), c = cambio(it, a, b);
      if (it.clave && c) comps.push({ it, c });
      filas.push(`<tr><td>${esc(it.n)}${it.clave ? '<span class="k">clave</span>' : ''}</td><td>${a == null ? '—' : esc(it.f(a, ha))}</td><td>${b == null ? '—' : esc(it.f(b, hb))}</td><td class="${c ? c.cls : ''}">${c ? (c.igual ? 'casi igual' : esc(c.txt) + ' · ' + PALABRA[c.cls]) : '—'}</td></tr>`); } }
  const estR = RG.map(r => { let mx = 0, wmx = 0; for (let i = 0; i < nH; i += 2) { const p = prox(r.k, VAL[r.k](H[i]), r.umbral); if (p > mx) { mx = p; wmx = H[i].sem; } }
    const vF = VAL[r.k](L); return { r, vF, pF: prox(r.k, vF, r.umbral), mx, wmx }; });
  const cerca = estR.filter(e => !go && e.pF >= 2 / 3).sort((a, b) => b.pF - a.pF);

  /* --- veredicto (criterios del encabezado: No = game over · Sí = sin game over, ninguna regla a 2/3 o más de su límite y mejoran más de los que empeoran · En parte = el resto) --- */
  const frente = B ? 'frente a la misma prueba sin propuesta' : 'frente al año 1';
  const mejor = comps.filter(x => x.c.cls === 'bien').sort((a, b) => b.c.dd - a.c.dd), peor = comps.filter(x => x.c.cls === 'mal').sort((a, b) => b.c.dd - a.c.dd), igual = comps.filter(x => x.c.cls === 'igual');
  const completo = nH >= FIN;
  let V, razon, frase, RGo = null;
  if (go) { RGo = (reglas || []).find(r => r.k === go.regla) || RG.find(r => r.k === go.regla) || { k: go.regla, n: go.regla, umbral: UMB[go.regla] };
    V = { t: 'No', cls: 'go', big: 'Game over', eye: 'Resultado · condición crítica sostenida' };
    razon = `Kennedy llegó a game over en el año ${añoDe(go.sem)} (semana ${nf(go.sem)}): ${go.motivo || RGo.n}.`; frase = razon; }
  else { const si = !cerca.length && mejor.length > peor.length;
    V = si ? { t: 'Sí', cls: 'ok', big: 'Sostenible', eye: '¿Fue sostenible? · Sí' } : { t: 'En parte', cls: 'parte', big: 'En parte', eye: '¿Fue sostenible?' };
    const c0 = cerca[0];
    frase = si ? `Sin game over ${completo ? 'en los 15 años' : 'hasta el año ' + añoDe(wFin)}: ${mejor.length} de ${comps.length} indicadores clave mejoran y ${peor.length} empeoran ${frente}.`
      : c0 ? `Sin game over, pero ${ART[c0.r.k] || min1(c0.r.n)} quedó a ${nf(Math.min(1, c0.pF) * 100)} % del camino a su límite (${fmtR(c0.r.k, c0.vF)}).`
      : `Sin game over, pero mejoran ${mejor.length} y empeoran ${peor.length} indicadores clave ${frente}.`;
    if (!completo) { V.eye = `Informe parcial · año ${añoDe(wFin)} de 15 · hasta ahora: ${V.t}`; V.big = 'En curso'; V.cls = 'curso'; frase = 'Hasta ahora: ' + min1(frase); }
    razon = frase; }
  /* par 01: el veredicto sale de data3d/conclusion_abasto.js (Sostenible / Plausible con condiciones / Game over, reglas fijas) */
  let C01 = null;
  if (def.par === 1) { try { C01 = conclusionAbasto({ H, B: base && base.length ? base : null, go, def, parametros, completo }); } catch (e) { console.warn('conclusión del par 01:', e); } }
  if (C01 && !go) { V = { t: C01.veredicto, cls: C01.estado === 'sostenible' ? 'ok' : 'parte', big: C01.big, eye: completo ? C01.eye : `Informe parcial · año ${añoDe(wFin)} de 15 · hasta ahora: ${C01.big}` };
    frase = completo ? C01.frase : 'Hasta ahora: ' + min1(C01.frase); razon = frase; }

  let alerta = '';
  if (goB && conProp) { const qué = goB.regla ? ` por ${CORTO_R[goB.regla] || min1(goB.n || goB.regla)}` : '';
    alerta = `<div class="i2-alerta">${icono('gameover')}<p><b>Sin propuesta, Kennedy llega a game over en el año ${añoDe(goB.sem)}</b>${esc(qué)}. ${go ? `Con propuesta llega en el año ${añoDe(go.sem)}.` : completo ? 'Con propuesta llega a los 15 años sin game over.' : ''} Las cifras se comparan en el año ${añoC}, la última semana que tienen las dos.</p></div>`; }

  /* --- métricas --- */
  const tiene = (k) => MET[k] && H.some(h => MET[k].v(h) != null);
  const reglaFoco = go ? go.regla : goB && goB.regla ? goB.regla : (estR.slice().sort((a, b) => b.mx - a.mx)[0] || {}).r ? estR.slice().sort((a, b) => b.mx - a.mx)[0].r.k : null;
  const llaves = []; const pon = (k) => { if (k && !llaves.includes(k) && tiene(k)) llaves.push(k); };
  (PAR_MET[def.par] || []).forEach(pon); pon(REGLA_MET[reglaFoco]);
  const limDe = (k) => { const rk = Object.keys(REGLA_MET).find(r => REGLA_MET[r] === k); if (rk) { const u = umb(rk); return rk === 'trafico' ? u * 100 : u; } return MET[k].lim; };

  /* --- cifras clave (cuentan hacia arriba desde la referencia) --- */
  const extra = [...mejor, ...peor].sort((a, b) => b.c.dd - a.c.dd);
  const kpis = llaves.map(k => ({ k, M: MET[k] }));
  for (const x of extra) { if (kpis.length >= 4) break; const mk = x.it.m; if (mk && kpis.some(q => q.k === mk)) continue; if (mk && tiene(mk)) { kpis.push({ k: mk, M: MET[mk] }); continue; }
    kpis.push({ k: x.it.k, M: { n: x.it.n, u: '', v: (h) => get(h, x.it.k), f: (v) => x.it.f(v, L), fh: x.it.f, sube: x.it.sube, dif: x.it.dif, esc: x.it.esc, u2: x.it.u } }); }
  for (const k of RELLENO) { if (kpis.length >= 4) break; if (!kpis.some(q => q.k === k) && tiene(k)) kpis.push({ k, M: MET[k] }); }
  const CNT = [];
  const kpi = ({ M }, i) => {
    const ha = B ? BC : A1, hb = B ? HC : L, a = M.v(ha), b = M.v(hb), it = { ...M, u: M.u2 || ['', ''] }, c = cambio(it, a, b);
    const fa = (v, h) => v == null ? '—' : (M.fh ? M.fh(v, h) : M.f(v)), lim = M.lim != null && M.dif === 'pts' ? limDe(Object.keys(MET).find(k => MET[k] === M)) : null;
    const mx = Math.max(Math.abs(a || 0), Math.abs(b || 0), lim || 0, M.dif === 'pts' && Math.max(a || 0, b || 0) <= 100 && Math.max(a || 0, b || 0) > 40 ? 100 : 0) || 1;
    const w = (v) => (Math.abs(v || 0) / mx * 100).toFixed(1), d = 1500 + i * 140;
    if (a != null && b != null) CNT.push({ i, a, b, f: (v) => fa(v, hb), d });
    return `<div class="i2-kpi i2-panel" data-a style="--d:${d}"><div class="i2-kn">${esc(M.n)}</div>${M.u ? `<div class="i2-ku">${esc(M.u)}</div>` : ''}
      <div class="i2-kv"><b data-i2-n="${i}">${esc(fa(b, hb))}</b>${tag(c)}</div>
      <div class="i2-bars"><div class="i2-bar"><span>${B ? 'Con propuesta' : `Año ${añoDe(wFin)}`}</span><span>${esc(fa(b, hb))}</span><div class="i2-tr"><i style="width:${w(b)}%;--d:${d + 200}"></i></div></div>
        <div class="i2-bar ref"><span>${B ? 'Sin propuesta' : 'Año 1'}</span><span>${esc(fa(a, ha))}</span><div class="i2-tr"><i class="ref" style="width:${w(a)}%;--d:${d + 200}"></i></div></div></div></div>`; };
  const htmlKpis = kpis.length ? `<div class="i2-cmp"><div class="i2-cmph" data-a style="--d:1400"><span class="i2-lab">${B ? 'Con propuesta frente a sin propuesta' : 'Del año 1 al final'}</span><span>${B ? `Misma prueba, mismos valores · año ${añoC}` : `Año 1 → año ${añoDe(wFin)}`}</span></div>
    <div class="i2-kpis">${kpis.map(kpi).join('')}</div></div>` : '';

  /* --- tarjeta del game over: regla, cuándo, umbral frente al valor --- */
  let htmlRegla = '';
  if (go && RGo) { const k = go.regla, u = RGo.umbral != null ? RGo.umbral : UMB[k], hoy = HOY[k], max = hoy < u, v = num(go.valor);
    const fr = (x) => x == null ? '—' : fmtR(k, x), nS = RGo.semanas || 4;
    const valSem = (h) => k === 'abasto' ? (h.evaluacion?.territorio?.sectores || []).find(s => s.n === go.lugar)?.valor ?? null : VAL[k](h);
    const sec = H.filter(h => h.sem > go.sem - nS && h.sem <= go.sem).map(valSem).filter(x => x != null && isFinite(x));
    const top = Math.max(hoy, u, v || 0) * 1.18 || 1, p = (x) => Math.max(0, Math.min(100, x / top * 100));
    htmlRegla = `<div class="i2-vlab">Regla incumplida · ${esc(RGo.n)}</div><p class="i2-rgt">${esc(may1((go.motivo || RGo.txt || '').replace(/\bsector (sector)\b/i, '$1')))}${go.lugar && go.lugar !== 'Kennedy' && !(go.motivo || '').includes(go.lugar) ? ` <em>· ${esc(go.lugar)}</em>` : ''}.</p>
      <div class="i2-rg"><div><small>Semana</small><b>${nf(go.sem)}</b><span>de ${nf(FIN)}</span></div><div><small>Año</small><b>${añoDe(go.sem)}</b><span>de 15</span></div>
        <div><small>Umbral · ${max ? 'máximo' : 'mínimo'}</small><b>${esc(fr(u))}</b><span>${esc(RGo.unidad || '')}</span></div><div><small>Valor alcanzado</small><b class="t">${esc(fr(v))}</b><span>${nS} semanas seguidas</span></div></div>
      <div class="i2-met" aria-hidden="true"><div class="i2-metr"><div class="i2-metz" style="left:${max ? p(u) : 0}%;right:${max ? 0 : 100 - p(u)}%"></div><div class="i2-meth" style="left:${p(hoy)}%"></div><div class="i2-metu" style="left:${p(u)}%"></div><div class="i2-metv" style="left:${p(v || 0)}%;--x0:${p(hoy)}%"></div></div>
        <div class="i2-metl"><span style="left:${p(hoy)}%">hoy ${esc(fr(hoy))}</span><span class="u" style="left:${p(u)}%">umbral</span><span class="v" style="left:${p(v || 0)}%">${esc(fr(v))}</span></div></div>
      ${sec.length > 1 ? `<div class="i2-seq">Últimas ${sec.length} semanas${k === 'abasto' ? ' en ' + esc(go.lugar) : ''}: ${sec.map(x => `<i>${esc(fr(x))}</i>`).join(FLECHA)}</div>` : ''}`; }

  const años = wFin / AÑO, parN = def.parN || '', escenario = def.par != null ? (conProp ? 'Con propuesta' : 'Sin propuesta') : '';
  const titulo = def.parN ? def.parN.replace(/^\d+\s*/, '') : (def.n || `Simulación ${sim}`);
  const numPar = def.parN ? (def.parN.match(/^\d+/) || [''])[0] : '';
  let li = 0; const letras = V.big.toUpperCase().split(' ').map(w => `<span class="w">${[...w].map(ch => `<span class="l" style="--i:${li++}">${esc(ch)}</span>`).join('')}</span>`).join(' ');
  const IR = { ver: 'M2 8s2.5-4.5 6-4.5S14 8 14 8s-2.5 4.5-6 4.5S2 8 2 8zM8 6.2a1.8 1.8 0 1 0 0 3.6a1.8 1.8 0 1 0 0-3.6', pdf: 'M8 2v8M4.5 6.5L8 10l3.5-3.5M2.5 13.5h11', rei: 'M3 8a5 5 0 1 0 1.5-3.6M3 2.5v2.5h2.5', x: 'M4 4l8 8M12 4l-8 8' };
  const ic = (k) => `<svg class="i2-ic" viewBox="0 0 16 16" aria-hidden="true"><path d="${IR[k]}"/></svg>`;
  const acciones = (cls) => `<div class="i2-acc ${cls}"><button type="button" class="i2-btn pri" data-i2-ver>${ic('ver')}Ver informe completo</button><button type="button" class="i2-btn" data-i2-pdf>${ic('pdf')}Descargar PDF</button>${onReiniciar ? `<button type="button" class="i2-btn" data-i2-rei>${ic('rei')}Reiniciar simulación</button>` : ''}</div>`;
  const htmlTop = `<div class="i2-top"><div class="i2-in"><span class="i2-k">Informe final · <b>${esc(V.big)}</b> · ${esc(parN || 'simulación ' + sim)}</span>
    <button type="button" class="i2-btn hm" data-i2-ver>${ic('ver')}Ver informe completo</button><button type="button" class="i2-btn hm" data-i2-pdf>${ic('pdf')}Descargar PDF</button>${onReiniciar ? `<button type="button" class="i2-btn hm" data-i2-rei>${ic('rei')}Reiniciar simulación</button>` : ''}<button type="button" class="i2-btn" data-i2-x aria-label="Cerrar informe">${ic('x')}Cerrar</button></div></div>`;

  /* --- curvas: la principal (escenario) y hasta 4 en el informe --- */
  const grK = llaves.slice(); for (const k of RELLENO) { if (grK.length >= 4) break; if (!grK.includes(k) && tiene(k)) grK.push(k); }
  const mkG = (k, M) => { const lim = M.lim0 !== undefined ? M.lim0 : limDe(k);
    const g = { k, t: M.t, sub: M.ay, fn: M.v, fy: M.f, fa: k === 'suelo' ? (v) => '×' + nf(v, 2) : null, lim: lim != null ? lim : null, limTxt: M.limTxt ? (k === 'cora' ? 'tope de Corabastos' : M.limTxt) : null };
    g.s = serie(H, g.fn); g.r = B ? serie(B, g.fn) : null; if (g.r && !g.r.length) g.r = null; g.go = go ? go.sem : null; g.goB = goB && g.r ? goB.sem : null; return g; };
  const GRv = grK.slice(0, 4).map(k => mkG(k, MET[k])).filter(g => g.s.length > 1);
  let G0 = null;
  if (go && go.regla === 'abasto' && go.lugar && go.lugar !== 'Kennedy') G0 = mkG('sector', { t: `Cobertura de alimentos · ${go.lugar}`, ay: 'Alimentos que recibe el sector frente a su demanda (%). El game over se mide por sector.', v: (h) => num((h.evaluacion?.territorio?.sectores || []).find(s => s.n === go.lugar)?.valor), f: (v) => nf(v) + ' %', lim0: umb('abasto'), limTxt: 'game over < 80 %' });
  else if (go && REGLA_MET[go.regla] && tiene(REGLA_MET[go.regla])) G0 = mkG(REGLA_MET[go.regla], MET[REGLA_MET[go.regla]]);
  if (G0 && G0.s.length < 2) G0 = null;
  if (!G0) G0 = GRv[0] || null;
  const CH = [G0, ...GRv];
  const leyenda = (g) => `<div class="i2-leg"><span><i></i>${B ? 'Con propuesta' : 'Esta simulación'}</span>${g && g.r ? '<span><i class="ref"></i>Sin propuesta</span>' : ''}${g && g.lim != null ? '<span><i class="lim"></i>Límite</span>' : ''}</div>`;
  const fig = (g, i, cls, d) => `<figure class="i2-ch i2-panel ${cls}" data-i2-g="${i}" style="--dd:${d}"><div class="i2-cht">${esc(g.t)}</div><div class="i2-chs">${esc(g.sub || '')} ${i > 0 ? 'Una vuelta = los 15 años, desde arriba en el sentido del reloj; el radio es el valor (anillos = escala).' : `Años 1 a 15, promedio cada ${CADA} semanas.`}</div>${cls.includes('i2-main') ? leyenda(g) : ''}<div data-i2-svg></div><div class="i2-tip"></div></figure>`;
  const htmlMain = G0 ? fig(G0, 0, 'i2-main', 2300).replace('<figure ', '<figure data-a style="--d:2100" ').replace(' style="--dd:2300"', '').replace('data-i2-g="0"', 'data-i2-g="0" data-dd="2300"') : '';
  const htmlGr = GRv.length ? `<section class="i2-sec rv"><div class="i2-sh"><div><span class="i2-lab">Cómo cambió en 15 años</span><h3 class="i2-st">${esc(may1(lista(GRv.slice(0, 2).map((g, i) => i ? min1(MET[g.k].n) : MET[g.k].n))))}</h3></div>${leyenda(GRv.find(g => g.r) || GRv[0])}</div>
    <div class="i2-charts">${GRv.map((g, i) => fig(g, i + 1, 'rvc', 0)).join('')}</div></section>` : '';

  /* --- causa → efecto (cadena del par con los valores finales) --- */
  const pasos = (cadena || []).filter(p => p && p.t);
  const fin = go ? { t: 'Game over · ' + (RGo?.n || go.regla), v: `año ${añoDe(go.sem)}` } : { t: '¿Fue sostenible?', v: V.t };
  const htmlCad = pasos.length ? `<div class="i2-cad i2-panel" data-a style="--d:3300"><div class="i2-vlab">Causa → efecto · valores al final</div><div class="i2-cadl">${[...pasos, { ...fin, fin: true }].map((p, i) => `${i ? `<div class="i2-fl" data-a style="--d:${3400 + i * 160}">${FLECHA}</div>` : ''}<div class="i2-paso${p.fin ? ' fin' : ''}" data-a style="--d:${3400 + i * 160}"><small>${esc(p.t)}</small><b>${esc(p.v)}</b></div>`).join('')}</div></div>` : '';

  /* --- avisos y línea de tiempo --- */
  const PF = presenciaFauna(H, extinciones);
  const EV = []; for (const e of (eventos || []).filter(e => e && e.titulo).slice().sort((a, b) => a.sem - b.sem)) {
    const m = /^Desapareci[oó] (.+)$/.exec(e.titulo); if (m && EV.some(o => o.sem === e.sem && o.titulo.includes(m[1]))) continue;
    const dup = EV.findIndex(o => o.sem === e.sem && /^Desapareci[oó] /.test(o.titulo) && e.titulo.includes(o.titulo.replace(/^Desapareci[oó] /, ''))); if (dup >= 0) { EV[dup] = e; continue; }
    if (EV.some(o => o.sem === e.sem && o.titulo === e.titulo)) continue; EV.push(e); }
  const evRow = (e) => { const g = /^game over/i.test(e.titulo), cls = g || e.signo < 0 ? 'mal' : e.signo > 0 ? 'bien' : '';
    return `<div class="i2-ev ${cls}"${e.texto ? ` title="${esc(e.texto)}"` : ''}><div class="i2-ea">Año ${añoDe(e.sem)}</div><div class="i2-eb" aria-label="${e.signo > 0 ? 'bueno' : e.signo < 0 ? 'malo' : 'neutro'}">${icono(g ? 'gameover' : e.tipo)}</div><div class="i2-et">${esc(e.titulo)}</div></div>`; };
  const nBue = EV.filter(e => e.signo > 0).length, nMal = EV.filter(e => e.signo < 0 || /^game over/i.test(e.titulo)).length;
  const mkS = { bien: '<svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="4.2" fill="#4fd1c5"/></svg>', mal: '<svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="4.2" fill="#f2694a"/></svg>', neu: '<svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="4.2" fill="#8c929c"/></svg>' };
  const htmlTl = `<div class="i2-tl i2-panel" data-a style="--d:2500"><div class="i2-cmph" style="margin:0"><span class="i2-lab">Línea de tiempo · avisos del modelo por año</span><span>${EV.length} avisos · ${nBue} buenos · ${nMal} malos · área de la burbuja ∝ avisos</span></div>
    <div class="i2-tlw" data-i2-tl><div class="i2-tip"></div></div><div class="i2-tll"><span>${mkS.bien}Bueno</span><span>${mkS.mal}Malo</span><span>${mkS.neu}Neutro</span>${go ? '<span><svg viewBox="0 0 10 10"><path d="M5 0v10" stroke="#ff4f7b" stroke-dasharray="2 2"/></svg>Game over</span>' : ''}</div></div>`;
  const htmlEv = `<section class="i2-sec rv"><div class="i2-sh"><div><span class="i2-lab">Por plazo</span><h3 class="i2-st">Lo que pasó</h3></div>
      <div class="i2-leg"><span><span class="i2-eb bien">${icono('sube')}</span>${nBue} buenos</span><span><span class="i2-eb mal">${icono('baja')}</span>${nMal} malos</span><span>${EV.length} avisos del modelo</span></div></div>
    <div class="i2-fases">${FASES.map(F => { const es = EV.filter(e => { const a = añoDe(e.sem); return a >= F.a0 && a <= F.a1; });
      return `<div class="i2-box i2-panel"><div class="i2-fh"><b>${F.n}</b><span>años ${F.a0}–${Math.min(15, F.a1)}</span></div>${es.length ? es.slice(0, 8).map(evRow).join('') + (es.length > 8 ? `<details class="i2-mas"><summary>Ver ${es.length - 8} avisos más</summary>${es.slice(8).map(evRow).join('')}</details>` : '') : `<p class="i2-vacio">${añoDe(wFin) < F.a0 ? 'La corrida terminó antes de este plazo.' : 'Sin avisos en estos años.'}</p>`}</div>`; }).join('')}</div></section>`;
  const htmlRed = `<section class="i2-sec rv"><div class="i2-sh"><div><span class="i2-lab">Red de la vida</span><h3 class="i2-st">Relaciones entre especies al final</h3></div>
      <p class="i2-sd">Cada punto es una especie y cada curva una relación: comer, polinizar, dispersar semillas o anidar.</p></div>
    <div class="i2-box i2-panel" data-i2-red><p class="i2-nota">Cargando la red…</p></div></section>`;

  /* --- tabla + notas --- */
  const htmlTab = `<details class="i2-fold i2-panel"><summary>Todos los indicadores<span>${B ? `Sin propuesta frente a con propuesta · año ${añoC}` : `Año 1 frente al año ${añoDe(wFin)}`}</span></summary><div class="i2-fb">
    <table class="i2-tab"><thead><tr><th>Indicador</th><th>${B ? 'Sin propuesta' : 'Año 1'}</th><th>${B ? 'Con propuesta' : 'Final'}</th><th>Diferencia</th></tr></thead><tbody>${filas.join('')}</tbody></table></div></details>`;
  const link = (t) => esc(t).replace(/https?:\/\/[^\s)<]+/g, (u) => { const m = u.match(/[.,;]+$/), uu = m ? u.slice(0, -m[0].length) : u; return `<a href="${uu}" target="_blank" rel="noopener">${uu}</a>${m ? m[0] : ''}`; });
  const htmlNotas = `<details class="i2-fold i2-panel"><summary>Notas y fuentes<span>Reglas de game over, cómo se decide el veredicto y supuestos</span></summary><div class="i2-fb i2-notas">
    <h4>Evaluación</h4><p>Umbrales experimentales de Bavaria Común. Cuatro semanas consecutivas en un sector, estación o parche confirman un colapso local. La ejecución completa termina cuando el indicador agregado de Kennedy incumple durante cuatro semanas.</p>
    <h4>Cómo se decide el veredicto</h4><ul><li><b>Game over (No)</b>: se cumplió una regla de game over durante 4 semanas seguidas.</li><li><b>Sostenible (Sí)</b>: sin game over, ningún indicador de las reglas a 2/3 o más del camino a su límite, y mejoran más indicadores clave de los que empeoran.</li><li><b>En parte</b>: el resto. Con pareja se compara en la misma semana; sin pareja, año 1 → final.</li>${def.par === 1 ? '<li><b>Par 01 · Abastecimiento</b>: <b>Sostenible</b> si no hay game over, ningún sector baja de 87 % de su demanda y lo que se le pide a Corabastos nunca pasa su tope; <b>Plausible con condiciones</b> si no hay game over pero falla alguna de las otras dos; <b>Game over</b> si un sector recibe menos de 80 % cuatro semanas seguidas. La recomendación es la palanca (autoconsumo, mercados, tope o volumen) que más mueve la cobertura o la carga en la semana crítica al moverla un cuarto de su rango, con las mismas ecuaciones del modelo. Fuentes en docs/fuentes_abastecimiento.md.</li>' : ''}</ul>
    <h4>Reglas de game over · iguales para las 12 simulaciones</h4>
    <div class="i2-reg">${RG.map(r => { const e = estR.find(x => x.r.k === r.k), es = go && go.regla === r.k; return `<div class="${es ? 'go' : ''}"><b>${esc(r.n)}</b>: game over si ${esc(r.txt || '')}.${e ? ` <span class="fin ${es || e.pF >= 2 / 3 ? 'mal' : ''}">Al final: ${esc(fmtR(r.k, e.vF))}${es ? ' · se cumplió' : ''}.</span>` : ''}${r.fuente ? `<p>Fuente: ${link(r.fuente)}</p>` : ''}</div>`; }).join('')}</div>
    <h4>Supuestos de este informe</h4><ul>
      <li>Todo sale del modelo semanal (data3d/simulaciones12.js) con la semilla ${esc(semilla)}: la misma semilla da siempre el mismo resultado.</li>
      <li>«Año 1» es la semana 52: el modelo arranca por debajo de su equilibrio (la ocupación de la fauna se duplica en las primeras ~40 semanas), así que la semana 1 exageraría los cambios.</li>
      ${B ? `<li>La comparación es con la misma prueba sin propuesta, con los mismos valores de las variables y la misma semilla, en la misma semana (año ${añoC})${baseCorta ? ', porque la versión sin propuesta se detuvo por game over' : ''}.</li>` : ''}
      <li>Las curvas promedian cada ${CADA} semanas; el punto final es el último valor.</li>
      <li>Red: ${PF.exacto ? '' : 'el modelo no informa qué especies faltaban al inicio; '}la presencia de la fauna se ${PF.volvieron.length || !Array.isArray(L.presentes) ? 'reconstruye con las extinciones de cada semana (si una especie vuelve, se toma la última que desapareció)' : 'toma del modelo'}. Plantas: censo de árboles SIGAU y bosque de Bavaria; las nativas de los módulos de huertas se suman cuando sube el conteo de flora del modelo. Una relación está activa si sus dos especies viven en Kennedy.</li>
    </ul><p class="i2-pie">Informe generado en el navegador a partir de ${nf(nH)} semanas simuladas${B ? ` y ${nf(B.length)} de la pareja sin propuesta` : ''}.</p></div></details>`;

  const htmlStage = `<section class="i2-stage i2-in">
    <div class="i2-kick" data-a style="--d:100">${numPar ? `<span>Par ${esc(numPar)} de 06</span>` : `<span>Simulación ${esc(sim)}</span>`}${escenario ? `<span class="i2-pill ${conProp ? 't' : ''}">${esc(escenario)}</span>` : ''}<span>${nf(años, años % 1 ? 1 : 0)} de 15 años${go ? ' · se detuvo por game over' : ''}</span></div>
    <h1 class="i2-tit" id="i2-titulo" aria-label="${esc(V.big)}: ${esc(titulo)}"><span class="i2-eye" data-a style="--d:200">${esc(V.eye)}</span><span class="i2-big" style="--len:${Math.max(7, V.big.length)}" aria-hidden="true">${letras}</span>
      <span class="i2-sub" data-a style="--d:1000"><b>${esc(titulo)}</b>${def.pregunta ? `<span>${esc(def.pregunta)}</span>` : ''}</span></h1>
    <div class="i2-ver i2-panel" data-a style="--d:1200">${go ? htmlRegla : `<div class="i2-vlab">Veredicto · ${esc(V.t)}</div><p class="i2-vf">${esc(frase)}</p>`}
      <div class="i2-vs">${donaVer(mejor.length, peor.length, igual.length)}<span class="i2-cnt bien">${icono('sube')}<b>${mejor.length}</b> mejoran</span><span class="i2-cnt mal">${icono('baja')}<b>${peor.length}</b> empeoran</span><span class="i2-cnt">${icono('igual')}<b>${igual.length}</b> casi iguales</span><span class="i2-cntt">de ${comps.length} indicadores clave, ${esc(frente)}</span></div>${alerta}</div>
    ${C01 ? C01.html : ''}${acciones('m')}${htmlKpis}${htmlMain}${htmlCad}${htmlTl}</section>`;

  cont.scrollTop = 0;
  cont.innerHTML = `<div class="inf2 ${V.cls}">${htmlTop}${htmlStage}<div class="i2-completo i2-in"><div class="i2-div" id="i2-completo">Informe completo</div>${htmlGr}<div data-i2-bal></div>${htmlRed}${htmlEv}<section class="i2-sec rv" style="margin-top:40px">${htmlTab}${htmlNotas}</section>
    <div class="i2-fin"><button type="button" class="i2-btn" data-i2-imp>Imprimir</button><button type="button" class="i2-btn" data-i2-pdf>${ic('pdf')}Descargar PDF</button>${onReiniciar ? `<button type="button" class="i2-btn" data-i2-rei>${ic('rei')}Reiniciar simulación</button>` : ''}<button type="button" class="i2-btn pri" data-i2-x>Cerrar</button></div></div>
    <div class="i2-salta" aria-hidden="true">Clic o Esc para saltar la animación</div></div>`;
  const root = cont.firstElementChild;
  adjuntarBalance(root, { sim, def, H, go, semilla, parametros, definiciones });
  const cerrar = () => { if (onCerrar) onCerrar(); else { const s = cont.closest('#su-inf'); if (s) { s.classList.remove('on'); if (s.close) s.close(); } } };
  root.querySelectorAll('[data-i2-x]').forEach(b => b.onclick = cerrar);
  root.querySelectorAll('[data-i2-imp]').forEach(b => b.onclick = () => window.print());
  root.querySelectorAll('[data-i2-pdf]').forEach(b => b.onclick = () => { const p = root.querySelector('.i2-bal [data-pdf]'); if (p) p.click(); else window.print(); });
  root.querySelectorAll('[data-i2-rei]').forEach(b => b.onclick = () => onReiniciar && onReiniciar());
  root.querySelectorAll('[data-i2-ver]').forEach(b => b.onclick = () => { saltar(); root.querySelector('#i2-completo').scrollIntoView({ behavior: REDU() ? 'auto' : 'smooth', block: 'start' }); });

  /* --- animación de entrada: ~4,5 s; clic o Esc la salta; nada si el sistema pide reducir movimiento --- */
  const anima = animar && !REDU();
  let rafs = [], tms = [];
  const ponerFinal = () => CNT.forEach(c => { const el = root.querySelector(`[data-i2-n="${c.i}"]`); if (el) el.textContent = c.f(c.b); });
  function saltar() { if (!root.classList.contains('i2-anim') || root.classList.contains('i2-ya')) return; root.classList.add('i2-ya'); rafs.forEach(cancelAnimationFrame); tms.forEach(clearTimeout); ponerFinal(); }
  root.saltar = saltar; root.animando = () => anima && !root.classList.contains('i2-ya');
  if (anima) { root.classList.add('i2-anim');
    for (const c of CNT) { const el = root.querySelector(`[data-i2-n="${c.i}"]`); if (!el) continue; el.textContent = c.f(c.a);
      tms.push(setTimeout(() => { const t1 = performance.now(), dur = 1100; const paso = (t) => { const k = Math.min(1, (t - t1) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = c.f(c.a + (c.b - c.a) * e); if (k < 1) rafs.push(requestAnimationFrame(paso)); };
        rafs.push(requestAnimationFrame(paso)); }, c.d + 150)); }
    tms.push(setTimeout(() => root.classList.add('i2-ya'), 5200));
    root.addEventListener('pointerdown', (e) => { if (!e.target.closest('button, a, summary, select, input')) saltar(); }, { capture: true });
    if (window.IntersectionObserver) { if (IOB) IOB.disconnect(); IOB = new IntersectionObserver((es) => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('vis'); IOB.unobserve(en.target); } }), { root: cont, threshold: 0.18 });
      root.querySelectorAll('.i2-sec.rv, .i2-ch.rvc').forEach(el => IOB.observe(el)); }
    else root.querySelectorAll('.i2-sec.rv, .i2-ch.rvc').forEach(el => el.classList.add('vis')); }

  /* --- partes que dependen del ancho --- */
  function pintarGraficas() {
    const figs = [...root.querySelectorAll('[data-i2-g]')], anchos = figs.map(f => f.querySelector('[data-i2-svg]').clientWidth);
    figs.forEach((fig, k) => { const g = CH[+fig.dataset.i2G]; if (!g) return; const box = fig.querySelector('[data-i2-svg]'), W = Math.max(260, Math.floor(anchos[k] || 320));
      if (+fig.dataset.i2G > 0) { reloj(fig, box, g, W); return; }
      const R = grafica(g, W); box.innerHTML = R.svg; if (fig.dataset.dd) box.firstElementChild.style.setProperty('--dd', fig.dataset.dd);
      const svg = box.firstElementChild, cr = svg.querySelector('.i2-x'), ln = cr.firstElementChild, dt = cr.lastElementChild, tip = fig.querySelector('.i2-tip');
      const mover = (ev) => { const bb = svg.getBoundingClientRect(), px = (ev.clientX - bb.left) * (W / bb.width); const w = (px - R.L) / R.pw * FIN; if (w < 0 || w > FIN) { salir(); return; }
        let best = g.s[0]; for (const p of g.s) if (Math.abs(p[0] - w) < Math.abs(best[0] - w)) best = p;
        let rb = null; if (g.r) for (const p of g.r) if (!rb || Math.abs(p[0] - best[0]) < Math.abs(rb[0] - best[0])) rb = p; if (rb && Math.abs(rb[0] - best[0]) > 8) rb = null;
        const xx = R.x(best[0]); ln.setAttribute('x1', xx); ln.setAttribute('x2', xx); dt.setAttribute('cx', xx); dt.setAttribute('cy', R.y(best[1])); cr.style.display = '';
        tip.innerHTML = `<b>Año ${añoDe(best[0])}</b> · semana ${nf(best[0])}<br><i></i>${g.r ? 'Con propuesta' : 'Valor'}: <b>${esc(g.fy(best[1]))}</b>${rb ? `<br><i class="ref"></i>Sin propuesta: <b>${esc(g.fy(rb[1]))}</b>` : ''}${g.lim != null ? `<br>Límite: <b>${esc(g.fy(g.lim))}</b>` : ''}`;
        tip.style.display = 'block'; const fx = svg.offsetLeft + xx * (bb.width / W), tw = tip.offsetWidth; tip.style.left = Math.max(4, Math.min(fig.clientWidth - tw - 4, fx + 14 > fig.clientWidth - tw ? fx - tw - 14 : fx + 14)) + 'px'; tip.style.top = (svg.offsetTop + 6) + 'px'; };
      const salir = () => { cr.style.display = 'none'; tip.style.display = 'none'; };
      svg.addEventListener('pointermove', mover); svg.addEventListener('pointerdown', mover); svg.addEventListener('pointerleave', salir); });
    const tb = root.querySelector('[data-i2-tl]');
    if (tb) { const W = Math.max(280, Math.floor(tb.clientWidth || 600)), T = lineaTiempo(EV, W, go), tip = tb.querySelector('.i2-tip');
      tb.querySelectorAll('svg').forEach(s => s.remove()); tb.insertAdjacentHTML('afterbegin', T.svg); const svg = tb.querySelector('svg');
      svg.addEventListener('pointermove', (ev) => { const bb = svg.getBoundingClientRect(), px = (ev.clientX - bb.left) * (W / bb.width), py = (ev.clientY - bb.top) * (W / bb.width);
        let best = null, bd = Infinity; for (const p of T.pts) { const d = Math.hypot(p.x - px, p.y - py) - (p.r || 0); if (d < Math.min(bd, 10)) { bd = d; best = p; } }
        if (!best) { tip.style.display = 'none'; return; }
        tip.innerHTML = best.e.lista ? `<b>Año ${añoDe(best.e.sem)}</b> · ${esc(best.e.titulo)}<br>${best.e.lista.map(esc).join('<br>')}` : `<b>Año ${añoDe(best.e.sem)}</b> · semana ${nf(best.e.sem)}<br>${esc(best.e.titulo)}`; tip.style.display = 'block';
        const tw = tip.offsetWidth, fx = best.x * (bb.width / W); tip.style.left = Math.max(0, Math.min(tb.clientWidth - tw, fx - tw / 2)) + 'px'; tip.style.top = Math.max(-40, (best.y - (best.r || 0)) * (bb.width / W) - tip.offsetHeight - 6) + 'px'; });
      svg.addEventListener('pointerleave', () => { tip.style.display = 'none'; }); }
    if (C01) try { C01.pintar(root); } catch (e) { console.warn('conclusión del par 01:', e); }
  }
  /* reloj de 15 años (graficas_arte.js): una vuelta = 15 años, radio = valor; esta corrida con área y línea, la pareja punteada */
  function reloj(fig, box, g, W) {
    box.innerHTML = ''; const tipEl = fig.querySelector('.i2-tip');
    const tipF = (html, cx, cy) => { if (html == null) { tipEl.style.display = 'none'; return; } tipEl.innerHTML = html; tipEl.style.display = 'block'; const fb = fig.getBoundingClientRect(), tw = tipEl.offsetWidth;
      tipEl.style.left = Math.max(4, Math.min(fig.clientWidth - tw - 4, cx - fb.left + 14)) + 'px'; tipEl.style.top = Math.max(4, cy - fb.top - tipEl.offsetHeight - 10) + 'px'; };
    const TR = new TiempoRadial(box, { n: g.t, max: 340, fmt: (v) => (v == null ? '—' : g.fy(v)), tip: tipF });
    const xs = g.s.map((p) => p[0]), a = g.s.map((p) => p[1]), rm = new Map((g.r || []).map((p) => [p[0], p[1]])), b = xs.map((w) => (rm.has(w) ? rm.get(w) : null));
    TR.update({ W, FIN, xs, con: conProp ? a : b, sin: conProp ? b : a, run: conProp ? 'con' : 'sin' }); }
  let RD = null;
  function pintarRed() {
    const box = root.querySelector('[data-i2-red]'); if (!box || !RD) return;
    const fl0 = new Set(RD.floraHoy), dF = (L.flora != null && H[0].flora != null) ? L.flora - H[0].flora : 0, flF = new Set(fl0);
    if (dF > 0) RD.floraNuevas.slice(0, dF).forEach(id => flF.add(id));
    if (dF < 0) RD.soloBosque.slice(0, -dF).forEach(id => flF.delete(id));
    const vivo0 = (n) => n.fa ? PF.ini.has(n.id) : fl0.has(n.id), vivoF = (n) => n.fa ? PF.fin.has(n.id) : flF.has(n.id);
    const camb = new Map(); let nP = 0, nN = 0;
    for (const [i, j] of RD.enl) { const A = RD.nodos[i], Bn = RD.nodos[j], e0 = vivo0(A) && vivo0(Bn), eF = vivoF(A) && vivoF(Bn);
      if (e0 && !eF) { camb.set(i + '|' + j, 'perdida'); nP++; } else if (!e0 && eF) { camb.set(i + '|' + j, 'nueva'); nN++; } }
    for (const v of PF.volvieron) if (PF.fin.has(v.especie)) camb.set('v:' + v.especie, true);
    const bw = box.clientWidth || 400, W = Math.min(440, Math.max(270, Math.floor(bw >= 760 ? 440 : bw - 32)));
    const fuera = FAUNA.filter(f => !PF.fin.has(f[0])), ultimaExt = (id) => PF.fuera.filter(e => e.especie === id).pop();
    const volv = [...new Map(PF.volvieron.filter(v => PF.fin.has(v.especie)).map(v => [v.especie, v])).values()];
    const nueF = RD.floraNuevas.filter(id => flF.has(id) && !fl0.has(id)).map(id => RD.nodos.find(n => n.id === id).n);
    const r1 = get(A1, 'red'), rF = get(L, 'red');
    box.innerHTML = `<div class="i2-redg"><div class="i2-ball">${bola(RD, W, PF.fin, flF, camb)}</div><div>
      <div class="i2-gleg">${GRUPOS.map(G => `<span><i style="background:var(--g-${G.k})"></i>${G.n}</span>`).join('')}</div>
      <div class="i2-gleg"><span><i class="l" style="border-color:var(--mal)"></i>Relación perdida</span><span><i class="l" style="border-color:var(--bien)"></i>Relación nueva</span><span><i class="l" style="border-color:rgba(238,240,234,.35)"></i>Sigue igual</span></div>
      <div class="i2-rs"><div><b class="${nP ? 'mal' : ''}">${nf(nP)}</b>relaciones perdidas${fuera.length ? ' (se fue ' + esc(lista(fuera.map(f => f[1]))) + ')' : ''}</div>
        <div><b class="${nN ? 'bien' : ''}">${nf(nN)}</b>relaciones nuevas${nueF.length ? ' con plantas nativas de las huertas' : ''}</div>
        <div><b>${r1 != null && rF != null && r1 ? SG(rF - r1) + nf(Math.abs(rF - r1) / r1 * 100) + ' %' : '—'}</b>interacciones en todos los lugares, año 1 → final</div></div>
      ${fuera.length || volv.length ? `<p class="i2-nota">${fuera.map(f => { const x = ultimaExt(f[0]); return `<b>${esc(f[1])}</b> desapareció${x ? ` en el año ${añoDe(x.sem)}${x.motivo ? ': ' + esc(min1(x.motivo)) : ''}` : ''}.`; }).join(' ')} ${volv.map(v => `<b>${esc(v.nombre || v.especie)}</b> desapareció en el año ${añoDe(v.sem)} y volvió en el año ${añoDe(v.semVuelve)}.`).join(' ')}</p>` : '<p class="i2-nota">Ninguna especie desapareció de Kennedy en esta corrida.</p>'}
      <p class="i2-nota">El diagrama marca las relaciones que se pierden o aparecen cuando una especie sale o entra a Kennedy; el indicador de interacciones cuenta además cada relación en cada lugar donde ocurre.</p></div></div>`;
  }
  pintarGraficas();
  cargarRed().then(R => { RD = R; if (root.isConnected) pintarRed(); }).catch(e => { const b = root.querySelector('[data-i2-red]'); if (b) b.innerHTML = `<p class="i2-nota">No se pudo cargar la red biótica (${esc(e.message)}).</p>`; });

  if (OBS) OBS.disconnect();
  if (window.ResizeObserver) { let w0 = cont.clientWidth, tm = 0;
    OBS = new ResizeObserver(() => { const w = cont.clientWidth; if (!root.isConnected) { OBS.disconnect(); return; } if (Math.abs(w - w0) < 24 || !w) return; w0 = w; clearTimeout(tm); tm = setTimeout(() => { pintarGraficas(); pintarRed(); }, 120); });
    OBS.observe(cont); }
  const ms = performance.now() - t0;
  return { ms, veredicto: V.t, razon, mejoran: mejor.length, empeoran: peor.length, root };
}
