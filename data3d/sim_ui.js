import { seguimiento } from './seguimiento.js?v=2';
/* ============ INTERFAZ DE LAS 12 SIMULACIONES (vista limpia) ============
   Corre el modelo semanal de data3d/simulaciones12.js al mismo paso que la barra de años (RELOJ.sem) y muestra:
   · panel de la derecha (vidrio): variables (sliders) de la simulación, indicadores en vivo con su gráfica, picos en el piso y foco;
   · GAME OVER: la pantalla se pone roja y titila con la regla que se cumplió, y luego sale el informe;
   · informe final (al año 20 o en el game over): veredicto, tabla inicio → final, gráficas, especies que desaparecieron y por qué,
     comparación con «Hoy» (simulación 1, misma semilla) e imprimir/guardar en PDF.
   Todo lo que se muestra sale del modelo (simulaciones.js); aquí no se calcula ningún dato. (ind().sem va de 1 a 520) */
import { crearPanelEvaluacion, CSS_EVALUACION } from './panel_evaluacion.js?v=5';
import { RELOJ } from './reloj.js?v=5';
import { florEco, datoEco, cintaEco, ESTILO_ECO } from './diagramas_eco.js?v=1';

/* SIN_CAPAS: el mapa queda limpio (solo carros y fauna); los datos van en el tablero. La autora: «quítale todas esas capas y redes verdes» */
const SIN_CAPAS = true;
const SEMILLA = 1; let FIN = 780; // 20 años (M.SEMANAS_FIN si el modelo lo trae)
const IND = [ // resultados en vivo: clave en ind(), nombre, formato, mejor si sube (true) o baja (false)
  { k: 'fauna', n: 'Especies de fauna', f: (v, I) => `${v} de ${I.fauna0}`, sube: true },
  { k: 'red', n: 'Interacciones entre especies', f: (v) => fmt(v), sube: true, ayuda: 'relaciones de la red biótica que ocurren en cada lugar' },
  { k: 'poliniz', n: 'Polinizadores', f: (v) => fmt(v), sube: true, ayuda: 'lugares con abejas, colibríes y otros polinizadores' },
  { k: 'huertas', n: 'Huertas activas', f: (v) => fmt(v), sube: true },
  { k: 'pares', n: 'Territorio con fauna', f: (v) => fmt(v), sube: true, ayuda: 'pares especie × lugar ocupados' },
  { k: 'trafico', n: 'Tráfico', f: (v) => (v * 100).toFixed(0) + ' %', sube: false, ayuda: '100 % = hoy' },
  { k: 'ruidoDb', n: 'Ruido promedio', f: (v) => v == null ? '—' : v.toFixed(1) + ' dB', sube: false },
  { k: 'atropellos', n: 'Fauna atropellada', f: (v) => v == null ? '—' : fmt(v), sube: false, ayuda: 'índice por semana' },
  { k: 'comidaMin', n: 'Comida en la zona peor', f: (v) => (v * 100).toFixed(0) + ' %', sube: true, pts: 100 },
  { k: 'basuraT', n: 'Basura generada', f: (v) => fmt(v) + ' t/día', sube: false, ayuda: 'Corabastos, plaza de flores y viviendas alrededor' },
  { k: 'ratas', n: 'Ratas', f: (v, I) => I.ratas0 ? '×' + (v / I.ratas0).toFixed(1) : (+v).toFixed(2), sube: false, ayuda: 'veces las de hoy' },
  { k: 'humedalHa', n: 'Humedales', f: (v) => (+v).toFixed(1) + ' ha', sube: true },
  { k: 'humedalFuncional', n: 'Humedales que funcionan', f: (v) => Math.round(v) + ' %', sube: true, pts: 1, ayuda: 'área sin rellenar × calidad frente a la basura del borde (game over si cae 30 %)' },
  { k: 'congestion', n: 'Congestión', f: (v) => Math.round(v) + ' %', sube: false, ayuda: 'tiempo extra de viaje frente a vía libre' },
  { k: 'sinRecoger', n: 'Basura sin recoger', f: (v) => (v * 100).toFixed(0) + ' %', sube: false, pts: 100, ayuda: 'fracción de la basura que nadie recoge (termina en calles y bordes de humedales)' },
  { k: 'arbolesPerdidos', n: 'Árboles perdidos en parques', f: (v) => (v * 100).toFixed(1) + ' %', sube: false, pts: 100 },
  { k: 'circularIdx', n: 'Economía circular', f: (v) => (v * 100).toFixed(1) + ' %', sube: true, pts: 100, ayuda: 'orgánicos que vuelven como abono a las huertas' },
  { k: 'sueloIdx', n: 'Precio del suelo (cerca del metro y proyectos)', f: (v) => '×' + (+v).toFixed(2), sube: false, ayuda: '1 = hoy; sube con el metro y el plan parcial (especulación)' },
  { k: 'hogaresRiesgo', n: 'Hogares en riesgo de desplazamiento', f: (v) => fmt(v), sube: false },
  { k: 'residuos', n: 'Orgánicos sin compostar', f: (v) => (v * 100).toFixed(0) + ' %', sube: false, ayuda: '% de la capacidad de las composteras de la red', soloSi: (H) => H.some(h => h.residuos > 0.005) }
];
const fmt = (v) => v == null || isNaN(v) ? '—' : Math.round(v).toLocaleString('es-CO');
const derivar = (I) => { if (I.circular) I.circularIdx = I.circular.indice; if (I.especulacion) { I.sueloIdx = I.especulacion.indice; I.hogaresRiesgo = I.especulacion.hogaresRiesgo; } if (I.basura) { I.basuraT = I.basura.total_t_dia; if (I.basura.fraccionSinRecoger != null) I.sinRecoger = I.basura.fraccionSinRecoger; } return I; };

export async function iniciarSimUI({ T3, SIMS_UI }) {
  let M = null; // módulo del modelo
  try { M = await import('./simulaciones12.js?v=29'); if (M.cargarDatos) await M.cargarDatos(); }
  catch (e) { console.warn('simulaciones (modelo):', e); M = null; }
  if (M && M.SEMANAS_FIN) FIN = Math.min(780, M.SEMANAS_FIN); /* el simulador corre 15 años */

  /* ---------- estilos (vidrio, como los paneles del simulador) ---------- */
  const st = document.createElement('style'); st.id = 'simui-css';
  st.textContent = `
  .su-glass { background: linear-gradient(180deg, rgba(40,44,52,.62), rgba(20,22,28,.74)); border: 1px solid rgba(255,255,255,.14); border-radius: 16px;
    backdrop-filter: blur(14px) saturate(1.2); -webkit-backdrop-filter: blur(14px) saturate(1.2); box-shadow: 0 10px 30px rgba(0,0,0,.35); color: #eef1f4; font-family: Geist, system-ui, sans-serif; }
  #su-der { position: fixed; right: 16px; top: 16px; width: 300px; max-height: calc(100vh - 200px); overflow-y: auto; z-index: 39; padding: 12px 14px; display: none; }
  #su-der.on { display: block; }
  #su-der h4 { margin: 10px 0 6px; font: 600 10.5px/1 Geist, system-ui, sans-serif; letter-spacing: .18em; text-transform: uppercase; opacity: .6; }
  #su-der .pre { margin: 0 0 4px; font: 500 12px/1.35 system-ui, sans-serif; opacity: .8; }
  .su-sl { margin: 8px 0 10px; }
  .su-sl label { display: flex; justify-content: space-between; font: 500 12px system-ui, sans-serif; margin-bottom: 4px; }
  .su-sl label b { font-weight: 600; color: #ffcf7a; }
  .su-sl input[type=range] { width: 100%; -webkit-appearance: none; appearance: none; height: 4px; border-radius: 3px; background: linear-gradient(90deg, #ffb347 var(--p,50%), rgba(255,255,255,.18) var(--p,50%)); outline: none; }
  .su-sl input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: #fff; border: 3px solid #ffb347; box-shadow: 0 2px 6px rgba(0,0,0,.4); cursor: pointer; }
  .su-sl input[type=range]::-moz-range-thumb { width: 12px; height: 12px; border-radius: 50%; background: #fff; border: 3px solid #ffb347; cursor: pointer; }
  #su-inds { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
  .su-ind { display: grid; grid-template-columns: 1fr auto; grid-template-areas: 'n n' 'v c' 'x x' 's s'; gap: 2px 6px; align-items: end; padding: 7px 8px 5px; border-radius: 10px; background: rgba(255,255,255,.045); border: 1px solid rgba(255,255,255,.07); border-left: 2px solid transparent; }
  .su-ind.mueve.bien { border-left-color: #8ee6a8; } .su-ind.mueve.mal { border-left-color: #ff8a80; }
  .su-ind i.vs { grid-area: x; font: 500 10.5px system-ui, sans-serif; font-style: normal; opacity: .65; } .su-ind i.vs.bien::before { content: '▲ mejor · '; color: #8ee6a8; } .su-ind i.vs.mal::before { content: '▼ peor · '; color: #ff8a80; }
  .su-ind i.ch { grid-area: c; font: 600 10.5px system-ui, sans-serif; font-style: normal; opacity: .8; white-space: nowrap; } .su-ind i.ch.bien { color: #8ee6a8; opacity: 1; } .su-ind i.ch.mal { color: #ff8a80; opacity: 1; }
  .su-ind span { grid-area: n; font: 500 10.5px/1.25 system-ui, sans-serif; opacity: .75; min-height: 2.5em; }
  .su-ind b { grid-area: v; font: 600 19px/1 'Barlow Condensed', system-ui, sans-serif; letter-spacing: .02em; }
  
  .su-ind svg { grid-area: s; width: 100%; height: 26px; margin-top: 2px; }
  .su-picos { display: grid; gap: 4px; } .su-picos button { position: relative; display: flex; align-items: center; gap: 8px; width: 100%; text-align: left; padding: 6px 8px 6px 15px; border-radius: 8px; border: 1px solid rgba(255,255,255,.09); background: rgba(255,255,255,.04); color: inherit; font: 500 12px system-ui, sans-serif; cursor: pointer; overflow: hidden; }
  .su-picos button.on { background: rgba(255,255,255,.12); border-color: rgba(255,255,255,.55); } .su-picos i { position: absolute; left: 0; top: 0; bottom: 0; width: 6px; } .su-picos b { font: 600 11px 'JetBrains Mono', ui-monospace, monospace; min-width: 30px; }
  .su-que { margin: 9px 0 2px; font: 400 12px/1.4 system-ui, sans-serif; opacity: .9; } .su-que b { font-weight: 600; } .su-que span { opacity: .6; font-size: 11px; }
  #ojo-t { right: auto !important; left: 296px !important; transform: none; top: auto !important; bottom: 92px !important; z-index: 46 !important; } @media (max-width: 760px) { #ojo-t { left: 50% !important; transform: translateX(-50%); } } /* abajo a la izquierda: a la derecha va la leyenda de la maqueta */ /* la tarjeta del Ojo de Dios abajo al centro: arriba a la derecha la tapaba el panel */
  .su-lug { display: flex; flex-wrap: wrap; gap: 5px; } .su-lug button { border: 1px solid rgba(255,255,255,.16); background: rgba(255,255,255,.06); color: inherit; border-radius: 8px; font: 500 11.5px system-ui, sans-serif; padding: 5px 9px; cursor: pointer; } .su-lug button:hover { background: rgba(255,207,122,.18); border-color: rgba(255,207,122,.5); }
  #su-eco .su-eco-i { display: flex; align-items: baseline; gap: 8px; } #su-eco .su-eco-i > b { font: 600 30px 'Barlow Condensed', system-ui, sans-serif; } #su-eco .su-eco-i span { font: 500 11px system-ui, sans-serif; opacity: .8; }
  #su-eco .su-eco-l { font: 500 10.5px system-ui, sans-serif; opacity: .75; margin: 0 0 6px; display: flex; gap: 6px; align-items: center; } #su-eco .su-eco-l i { width: 14px; height: 3px; border-radius: 2px; display: inline-block; } #su-eco .su-eco-l i.pt { background: repeating-linear-gradient(90deg, #dde 0 4px, transparent 4px 7px); }
  .su-abeja { padding: 8px 9px; border-radius: 10px; background: rgba(255,207,122,.07); border: 1px solid rgba(255,207,122,.22); font: 500 11px system-ui, sans-serif; } .su-abeja > b { display: block; margin-bottom: 4px; color: #ffd28a; } .su-abeja div { display: grid; grid-template-columns: 1fr auto; gap: 0 8px; padding: 3px 0; border-top: 1px solid rgba(255,255,255,.06); } .su-abeja div b { font: 600 15px 'Barlow Condensed', system-ui, sans-serif; text-align: right; } .su-abeja small { grid-column: 1 / -1; opacity: .6; } .su-abeja p { margin: 5px 0 0; }
  #su-eco .su-eco-n { font: 400 10px/1.35 system-ui, sans-serif; opacity: .55; margin: 6px 0 0; }
  #su-tab { padding: 10px 12px; border-radius: 14px; background: linear-gradient(180deg, rgba(40,44,52,.8), rgba(20,22,28,.9)); border: 1px solid rgba(255,255,255,.14); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); box-shadow: 0 10px 30px rgba(0,0,0,.35); color: #eef1f4; flex: 1; min-height: 0; overflow-y: auto; } #su-tab:empty { display: none; }
  .su-tt { margin: 0 0 6px; font: 600 10.5px system-ui, sans-serif; letter-spacing: .1em; text-transform: uppercase; color: #ffd28a; }
  /* tablero (tb3): medidor del índice + barras de las dimensiones + tarjetas de indicadores en dos columnas */
  .tb3-hd { display: flex; align-items: center; gap: 10px; margin: 0 0 10px; } .tb3-g { width: 112px; flex: none; overflow: visible; }
  .tb3-k { display: block; font: 600 10px system-ui, sans-serif; letter-spacing: .12em; text-transform: uppercase; opacity: .6; } .tb3-hd strong { display: block; font: 600 22px/1.05 'Barlow Condensed', system-ui, sans-serif; letter-spacing: .02em; margin: 1px 0 2px; }
  .tb3-hd p { margin: 0; font: 400 10.5px/1.35 system-ui, sans-serif; opacity: .7; } .tb3-hd p b { color: #fff; }
  .tb3-st { margin-top: 12px !important; display: flex; align-items: baseline; justify-content: space-between; gap: 6px; } .tb3-st span { font: 500 9.5px system-ui, sans-serif; letter-spacing: 0; text-transform: none; color: #c3cace; opacity: .75; }
  .tb3-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; grid-auto-flow: row dense; } /* dense: la tarjeta ancha no deja huecos */
  .tb3-t { position: relative; padding: 8px 9px 6px; border-radius: 12px; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.08); cursor: pointer; transition: background .2s; min-width: 0; }
  .tb3-t:hover { background: rgba(255,255,255,.1); } .tb3-t.ancho { grid-column: 1 / -1; } .tb3-t::before { content: ''; position: absolute; left: 0; top: 10px; bottom: 10px; width: 2px; border-radius: 0 2px 2px 0; background: rgba(255,255,255,.18); } .tb3-t.bien::before { background: #8ee6a8; } .tb3-t.mal::before { background: #ff8a80; }
  .tb3-h { display: flex; align-items: center; gap: 4px; } .tb3-h span { flex: 1; min-width: 0; font: 500 10.5px system-ui, sans-serif; opacity: .8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .tb3-h .v { flex: none; height: 20px; padding: 0 7px; font-size: 10px !important; border-radius: 6px; border: 1px solid rgba(255,255,255,.16); background: rgba(255,255,255,.06); color: #fff; font: 600 12px/18px system-ui, sans-serif; cursor: pointer; } .tb3-h .v:hover { background: rgba(255,255,255,.18); }
  .tb3-t > b { display: block; font: 600 22px/1.05 'Barlow Condensed', system-ui, sans-serif; margin-top: 2px; } .tb3-t > em { display: block; font: 600 10px system-ui, sans-serif; font-style: normal; opacity: .6; } .tb3-t > em.bien { color: #8ee6a8; opacity: 1; } .tb3-t > em.mal { color: #ff8a80; opacity: 1; }
  .tb3-s { display: block; width: 100%; height: 30px; margin-top: 4px; overflow: visible; } .tb3-t > small { display: block; font: 500 9.5px system-ui, sans-serif; opacity: .55; margin-top: 2px; }
  /* tablero legible (tb2): índice + barras + una fila por indicador, sin cajas dentro de cajas */
  .tb2-hd { display: flex; gap: 10px; align-items: center; margin: 2px 0 8px; } .tb2-n { display: flex; align-items: baseline; flex: none; } .tb2-n b { font: 600 38px/1 'Barlow Condensed', system-ui, sans-serif; } .tb2-n span { font: 500 12px system-ui, sans-serif; opacity: .5; margin-left: 2px; }
  .tb2-hd strong { display: block; font: 600 12px system-ui, sans-serif; } .tb2-hd p { margin: 2px 0 0; font: 400 10.5px/1.35 system-ui, sans-serif; opacity: .65; } .tb2-hd p b { opacity: 1; color: #fff; }
  .tb2-dims { display: grid; gap: 5px; margin-bottom: 4px; } .tb2-d { display: grid; grid-template-columns: 84px 1fr 24px; align-items: center; gap: 8px; font: 500 11px system-ui, sans-serif; }
  .tb2-d span { opacity: .8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } .tb2-d b { font: 600 13px 'Barlow Condensed', system-ui, sans-serif; text-align: right; }
  .tb2-d i { position: relative; height: 6px; border-radius: 3px; background: rgba(226,243,255,.1); } .tb2-d u { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 3px; } .tb2-d s { position: absolute; top: -3px; bottom: -3px; width: 2px; margin-left: -1px; background: #c8d2dc; border-radius: 1px; }
  .tb2-ley { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 6px; margin: 4px 0 2px; font: 500 10px system-ui, sans-serif; opacity: .6; } .tb2-ley i { width: 14px; height: 3px; border-radius: 2px; display: inline-block; } .tb2-ley i.g { background: #c8d2dc; width: 2px; height: 10px; } .tb2-ley2 i.g { width: 14px; height: 2px; }
  .tb2-ley i.p { background: repeating-linear-gradient(90deg, rgba(226,243,255,.7) 0 3px, transparent 3px 6px); height: 2px; }
  .tb2-r { padding: 9px 0 8px; border-top: 1px solid rgba(125,211,252,.14); } .tb2-t { display: flex; align-items: baseline; gap: 8px; } .tb2-t span { flex: 1; font: 600 12px system-ui, sans-serif; }
  .tb2-t b { font: 600 20px/1 'Barlow Condensed', system-ui, sans-serif; color: #fff; } .tb2-t b.bien { color: #8ee6a8; } .tb2-t b.mal { color: #ff8a80; }
  .tb2-c { display: flex; align-items: center; gap: 8px; margin: 3px 0 4px; font: 500 10.5px system-ui, sans-serif; } .tb2-c em { font-style: normal; opacity: .65; } .tb2-c em.bien { color: #8ee6a8; opacity: 1; } .tb2-c em.mal { color: #ff8a80; opacity: 1; } .tb2-c small { opacity: .55; font-size: 10px; }
  .tb2-bt { margin-left: auto; display: flex; gap: 4px; } .tb2-bt button { font: 600 10.5px system-ui, sans-serif; padding: 2px 8px; border-radius: 7px; border: 1px solid rgba(125,211,252,.25); background: rgba(125,211,252,.08); color: #e2f3ff; cursor: pointer; } .tb2-bt button:hover { background: rgba(125,211,252,.18); }
  .tb2-svg { display: block; height: auto; overflow: visible; }
  .tb2-cb { display: flex; height: 5px; border-radius: 3px; overflow: hidden; gap: 1px; margin-top: 6px; } .tb2-cb i { display: block; } .tb2-cl { display: flex; flex-wrap: wrap; gap: 2px 10px; margin-top: 4px; font: 500 10px system-ui, sans-serif; opacity: .75; } .tb2-cl i { display: inline-block; width: 7px; height: 7px; border-radius: 50%; margin-right: 4px; vertical-align: -1px; }
  figure.su-tf { margin: 8px 0 0; padding: 8px 9px 7px; border-radius: 11px; background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.07); } figure.su-tf svg { display: block; width: 100%; height: 64px; margin-top: 4px; }
  .su-th em { font: 600 10.5px system-ui, sans-serif; font-style: normal; padding: 1px 6px; border-radius: 6px; background: rgba(255,255,255,.07); } .su-th em.bien { color: #8ee6a8; } .su-th em.mal { color: #ff8a80; } .su-th b { font-size: 19px !important; }
  .su-ej { display: flex; justify-content: space-between; font: 500 9px system-ui, sans-serif; opacity: .45; margin-top: 1px; } .su-tp { display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-top: 4px; } .su-tp .su-ts b { opacity: 1; color: #fff; }
  .su-tf { padding: 6px 0 7px; border-top: 1px solid rgba(255,255,255,.08); } .su-th { display: flex; align-items: baseline; gap: 6px; } .su-th span { flex: 1; font: 500 11.5px system-ui, sans-serif; color: #e9ecef; }
  .su-th b { font: 600 16px 'Barlow Condensed', system-ui, sans-serif; color: #fff; } .su-th b.bien { color: #8ee6a8; } .su-th b.mal { color: #ff8a80; }
  .su-tg { display: flex; align-items: center; gap: 6px; margin-top: 2px; } .su-tg svg { flex: 1; height: 40px; min-width: 0; background: rgba(255,255,255,.03); border-radius: 6px; }
  .su-tb { display: flex; gap: 4px; } .su-tb button { font: 600 10.5px system-ui, sans-serif; padding: 3px 7px; border-radius: 7px; border: 1px solid rgba(255,255,255,.18); background: rgba(255,255,255,.07); color: #fff; cursor: pointer; } .su-tb button.v { background: rgba(158,203,255,.18); border-color: rgba(158,203,255,.45); }
  .su-ts, .su-tl { display: block; font: 500 10px system-ui, sans-serif; opacity: .6; margin-top: 1px; }
  .su-tc { display: flex; height: 5px; border-radius: 3px; overflow: hidden; margin-top: 4px; gap: 1px; } .su-tc i { display: block; background: #888; } .su-tc i.c-colision { background: #ff6b6b; } .su-tc i.c-atropello { background: #ffb347; } .su-tc i.c-ruido { background: #c58cff; }
  #su-graf { position: fixed; left: 50%; transform: translateX(-50%); bottom: 88px; z-index: 42; display: none; gap: 8px; padding: 8px 10px; border-radius: 14px; background: linear-gradient(180deg, rgba(40,44,52,.72), rgba(20,22,28,.86)); border: 1px solid rgba(255,255,255,.14); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); box-shadow: 0 10px 30px rgba(0,0,0,.35); }
  #su-graf.on { display: flex; } #su-graf figure { margin: 0; width: 220px; } #su-graf figcaption { display: flex; align-items: baseline; gap: 6px; font: 500 10.5px system-ui, sans-serif; color: #e9ecef; margin-bottom: 2px; }
  #su-graf figcaption span { flex: 1; opacity: .8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } #su-graf figcaption b { font: 600 15px 'Barlow Condensed', system-ui, sans-serif; } #su-graf figcaption i { font: 500 11px system-ui, sans-serif; font-style: normal; opacity: .55; }
  #su-graf svg { width: 220px; height: 74px; display: block; overflow: visible; } #su-graf figure { cursor: pointer; padding: 4px 6px; border-radius: 10px; transition: background .2s; position: relative; } #su-graf figure:hover, #su-graf figure.sel { background: rgba(255,255,255,.07); }
  #su-graf .ej { display: flex; justify-content: space-between; font: 500 9px system-ui, sans-serif; opacity: .45; margin-top: 1px; } #su-graf .lim { position: absolute; right: 8px; top: 22px; font: 500 9px system-ui, sans-serif; font-style: normal; color: #ff8a80; opacity: .85; }
  #su-graf u { display: block; text-decoration: none; font: 500 9.5px system-ui, sans-serif; color: #9ecbff; opacity: .75; margin-top: 2px; } #su-graf figure:hover u { opacity: 1; }
  #su-ficha { position: fixed; left: 50%; transform: translateX(-50%); bottom: 236px; z-index: 47; width: min(700px, calc(100vw - 32px)); padding: 12px 14px; border-radius: 14px; background: linear-gradient(180deg, rgba(40,44,52,.88), rgba(18,20,26,.94)); border: 1px solid rgba(255,255,255,.16); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); box-shadow: 0 12px 34px rgba(0,0,0,.4); color: #eef1f4; display: none; font: 400 11.5px/1.45 system-ui, sans-serif; }
  #su-ficha.on { display: block; } #su-ficha h5 { margin: 0 0 8px; font: 600 15px system-ui, sans-serif; display: flex; gap: 10px; align-items: baseline; } #su-ficha h5 small { font: 500 11px system-ui, sans-serif; opacity: .6; }
  #su-ficha .g { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px 14px; } #su-ficha .g div b { display: block; font: 600 9.5px system-ui, sans-serif; letter-spacing: .09em; text-transform: uppercase; color: #9ecbff; margin-bottom: 1px; }
  #su-ficha .bt { display: flex; gap: 8px; margin-top: 10px; } #su-ficha button { font: 600 11px system-ui, sans-serif; padding: 6px 12px; border-radius: 9px; border: 1px solid rgba(255,255,255,.2); background: rgba(255,255,255,.08); color: #fff; cursor: pointer; } #su-ficha button.ver { background: #9ecbff; color: #10141a; border-color: #9ecbff; }
  #su-ficha .sup { margin-top: 8px; font-size: 10.5px; opacity: .6; }
  @media (max-width: 760px) { #su-ficha { bottom: 120px; } #su-ficha .g { grid-template-columns: 1fr; } }
  #su-graf svg { width: 220px; height: 74px; display: block; } @media (max-width: 1100px) { #su-graf { display: none !important; } }
  #su-hist { position: fixed; left: 296px; top: 16px; z-index: 43; width: 330px; max-width: calc(100vw - 640px); padding: 11px 13px 9px; border-radius: 14px; color: #f2f3f5; background: linear-gradient(180deg, rgba(40,44,52,.74), rgba(20,22,28,.86)); border: 1px solid rgba(255,255,255,.14); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); box-shadow: 0 10px 30px rgba(0,0,0,.35); display: none; font: 400 11.5px/1.35 system-ui, sans-serif; }
  #su-hist.on { display: block; } #su-hist h5 { margin: 0 0 2px; font: 600 10.5px system-ui, sans-serif; letter-spacing: .08em; text-transform: uppercase; color: #ffd28a; } #su-hist p { margin: 0 0 7px; opacity: .75; }
  #su-hist .cab, #su-hist li { display: grid; grid-template-columns: 1fr 86px 78px; gap: 6px; align-items: baseline; } #su-hist .cab { font: 600 9.5px system-ui, sans-serif; letter-spacing: .06em; text-transform: uppercase; opacity: .6; padding-bottom: 3px; border-bottom: 1px solid rgba(255,255,255,.1); }
  #su-hist ul { list-style: none; margin: 0; padding: 0; } #su-hist li { padding: 4px 0; border-bottom: 1px solid rgba(255,255,255,.05); } #su-hist li .n { opacity: .85; } #su-hist li b { font: 600 15px 'Barlow Condensed', system-ui, sans-serif; color: #8ee6a8; text-align: right; } #su-hist li i { font: 500 13px 'Barlow Condensed', system-ui, sans-serif; font-style: normal; opacity: .55; text-align: right; }
  @media (max-width: 1100px) { #su-hist { display: none !important; } }
  #su-previa { margin: 4px 0 8px; padding: 7px 9px; border-radius: 8px; background: rgba(255,207,122,.12); border: 1px solid rgba(255,207,122,.3); font: 500 11.5px/1.35 system-ui, sans-serif; color: #ffe3ad; }
  #su-cambio { margin: 7px 0 0; font: 500 11.5px system-ui, sans-serif; opacity: .9; } #su-cambio b { font: 600 14px 'Barlow Condensed', system-ui, sans-serif; } #su-cambio.bien b { color: #8ee6a8; } #su-cambio.mal b { color: #ff8a80; }
  .su-alto { display: flex; align-items: center; gap: 10px; margin-top: 8px; font: 500 11px system-ui, sans-serif; opacity: .85; } .su-alto input { flex: 1; accent-color: #ffcf7a; }
  .su-rampa { height: 8px; border-radius: 3px; margin-top: 8px; } .su-rampa-t { display: flex; justify-content: space-between; font: 500 10px system-ui, sans-serif; opacity: .6; margin-top: 2px; }
  .su-seg { display: flex; gap: 6px; flex-wrap: wrap; } .su-seg button { flex: 1; min-width: 70px; padding: 6px 4px; border-radius: 9px; border: 1px solid rgba(255,255,255,.16); background: rgba(255,255,255,.07); color: inherit; font: 500 12px system-ui, sans-serif; cursor: pointer; }
  .su-seg button.on { background: rgba(255,176,70,.88); color: #1b1206; border-color: transparent; }
  /* GAME OVER */
  #su-go { display: none; } /* la pantalla de game over es ahora el informe a pantalla completa (data3d/informe.js) */
  /* INFORME: <dialog id="su-inf"> modal a pantalla completa; estilos de la pantalla de resultados en informe.js (.i2-dlg / .inf2) */
  #su-inf:not([open]) { display: none; }
  #su-inf { position: fixed; inset: 0; width: 100vw; height: 100dvh; max-width: none; max-height: none; margin: 0; padding: 0; border: 0; background: rgba(6,8,12,.55); color: #eef0ea; }
  #su-inf .caja { width: min(980px, calc(100vw - 24px)); max-height: calc(100dvh - 32px); margin: 16px auto; overflow-y: auto; padding: 22px 26px 26px; }
  :where(#su-inf) header:not(.i2-hero) { display: flex; align-items: flex-start; gap: 12px; }
  :where(#su-inf) header:not(.i2-hero) div { flex: 1; } :where(#su-inf) h2 { margin: 0; font: 600 26px/1.1 'Barlow Condensed', system-ui, sans-serif; letter-spacing: .02em; }
  :where(#su-inf) .sub { margin: 4px 0 0; font: 500 13px system-ui, sans-serif; opacity: .7; }
  :where(#su-inf) .ver { margin: 16px 0; padding: 12px 16px; border-radius: 12px; font: 600 16px/1.4 system-ui, sans-serif; }
  :where(#su-inf) .ver.go { background: rgba(220,40,40,.22); border: 1px solid rgba(255,90,90,.5); } :where(#su-inf) .ver.ok { background: rgba(60,180,110,.18); border: 1px solid rgba(110,220,150,.45); }
  :where(#su-inf) table { width: 100%; border-collapse: collapse; font: 500 13px system-ui, sans-serif; margin: 8px 0 4px; }
  :where(#su-inf) th, :where(#su-inf) td { padding: 7px 8px; border-bottom: 1px solid rgba(255,255,255,.08); text-align: right; } :where(#su-inf) th:first-child, :where(#su-inf) td:first-child { text-align: left; }
  :where(#su-inf) th { font: 600 10.5px/1 Geist, system-ui, sans-serif; letter-spacing: .14em; text-transform: uppercase; opacity: .6; }
  :where(#su-inf) td.bien { color: #8ee6a8; } :where(#su-inf) td.mal { color: #ff8a80; }
  :where(#su-inf) .graf { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 12px; margin: 14px 0; }
  :where(#su-inf) .graf figure { margin: 0; padding: 10px 12px; border-radius: 12px; background: rgba(255,255,255,.05); }
  :where(#su-inf) .graf figcaption { font: 600 11px Geist, system-ui, sans-serif; letter-spacing: .12em; text-transform: uppercase; opacity: .65; margin-bottom: 6px; }
  :where(#su-inf) .graf svg { width: 100%; height: 90px; }
  :where(#su-inf) ul { margin: 6px 0; padding-left: 18px; font: 500 13px/1.5 system-ui, sans-serif; }
  :where(#su-inf) h3 { margin: 18px 0 4px; font: 600 11px Geist, system-ui, sans-serif; letter-spacing: .16em; text-transform: uppercase; opacity: .6; }
  :where(#su-inf) .bot { display: flex; gap: 8px; } :where(#su-inf) .bot button { padding: 8px 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,.18); background: rgba(255,255,255,.08); color: inherit; font: 600 13px system-ui, sans-serif; cursor: pointer; }
  :where(#su-inf) .bot button.pri { background: rgba(255,176,70,.9); color: #1b1206; border-color: transparent; }
  /* los avisos ya no salen como tarjetas arriba al centro: van al feed de eventos (data3d/feed_eventos.js); .su-av queda para otras fichas */
  .su-av { pointer-events: auto; display: flex; gap: 9px; align-items: flex-start; padding: 7px 8px 7px 10px; border-radius: 14px; color: #f2f3f5;
    background: linear-gradient(180deg, rgba(40,44,52,.72), rgba(20,22,28,.84)); border: 1px solid rgba(255,255,255,.14); border-left: 3px solid #ffcf7a;
    backdrop-filter: blur(14px) saturate(1.3); -webkit-backdrop-filter: blur(14px) saturate(1.3); box-shadow: 0 10px 30px rgba(0,0,0,.35);
    opacity: 0; transform: translateY(-8px); transition: opacity .35s, transform .35s; font: 400 11px/1.35 system-ui, sans-serif; }
  .su-av.on { opacity: 1; transform: none; } .su-av.bien { border-left-color: #8ee6a8; } .su-av.mal { border-left-color: #ff8a80; } .su-av.viendo { box-shadow: 0 0 0 1px rgba(255,255,255,.4), 0 10px 30px rgba(0,0,0,.4); }
  .su-av > i { font-style: normal; font-size: 14px; line-height: 1; margin-top: 2px; } .su-av > div:nth-child(2) { flex: 1; min-width: 0; }
  .su-av small { display: block; font: 600 10px system-ui, sans-serif; letter-spacing: .06em; text-transform: uppercase; opacity: .6; }
  .su-av b { display: block; font: 600 12px/1.25 system-ui, sans-serif; margin: 1px 0 2px; } .su-av p { margin: 0; opacity: .8; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; } .su-av.viendo p { -webkit-line-clamp: unset; display: block; } .su-av p.su-av-d { margin-top: 3px; opacity: 1; font-weight: 600; -webkit-line-clamp: 1; }
  .su-av .bt { display: flex; gap: 4px; align-items: center; } .su-av button { border: 1px solid rgba(255,255,255,.2); background: rgba(255,255,255,.08); color: inherit; border-radius: 7px; font: 600 11px system-ui, sans-serif; padding: 3px 8px; cursor: pointer; }
  .su-av button.ver { background: rgba(255,176,70,.92); color: #1b1206; border-color: transparent; } .su-av button.x { padding: 2px 8px; opacity: .7; }
  @media (max-width: 760px) { #su-der { width: calc(100vw - 32px); top: auto; bottom: 86px; max-height: 40vh; } #su-inf .caja { padding: 16px; } }
  @media print { body > *:not(#su-inf) { display: none !important; } #su-inf { position: static; background: none; } #su-inf .caja { max-height: none; color: #111; background: #fff; box-shadow: none; } #su-inf .bot { display: none; } }`;
  st.textContent += ESTILO_ECO + CSS_EVALUACION;
  document.head.appendChild(st);

  /* ---------- elementos ---------- */
  const der = document.createElement('div'); der.id = 'su-der'; der.className = 'su-glass'; document.body.appendChild(der);
  const go = document.createElement('div'); go.id = 'su-go'; go.hidden = true; document.body.appendChild(go); // se conserva por compatibilidad (reiniciarModelo)
  const inf = document.createElement('dialog'); inf.id = 'su-inf'; inf.setAttribute('aria-labelledby', 'i2-titulo'); inf.innerHTML = '<div class="caja"></div>'; document.body.appendChild(inf);
  // Esc: primero salta la animación de entrada; con la animación terminada, cierra
  inf.addEventListener('cancel', (e) => { const r = inf.querySelector('.inf2'); if (r && r.animando && r.animando()) { e.preventDefault(); r.saltar(); return; } e.preventDefault(); cerrarInforme(); });
  inf.addEventListener('close', () => inf.classList.remove('on'));
  // otros módulos escuchan Escape en window y algunos hacen preventDefault (entonces el diálogo no recibe «cancel»): se atiende aquí primero
  inf.addEventListener('keydown', (e) => { if (e.key !== 'Escape') return; e.preventDefault(); e.stopPropagation(); const r = inf.querySelector('.inf2'); if (r && r.animando && r.animando()) r.saltar(); else cerrarInforme(); });

  /* ---------- estado de la corrida ---------- */
  const R = { sim: null, def: null, valores: {}, s: null, hist: [], go: null, fin: false, base: null, picos: null, foco: null, extinciones: [], eventos: [] };
  const defDe = (id) => (M && M.SIMS ? M.SIMS.find(x => x.id === id) : null);
  /* CONTINUAR: al escoger un escenario la simulación NO vuelve al año 1: el modelo de ese escenario se corre por lotes hasta la semana en
     que va la barra (sin avisos de lo ya pasado) y sigue desde ahí */
  let idAlDia = 0;
  function ponerseAlDia(hasta) {
    if (!M || !R.sim || !hasta) return; const id = ++idAlDia, s = M.crear(R.sim, SEMILLA, R.valores), H = []; R.s = null; R.hist = [];
    const lote = () => { if (id !== idAlDia) return; for (let k=0, inicio=performance.now(); k<4 && H.length<hasta && (!k || performance.now()-inicio<5); k++) { M.paso(s); const I = M.ind(s); derivar(I); H.push(I); if(M.gameOver(s))break; }
      if (!M.gameOver(s) && H.length < hasta) return void setTimeout(lote, 0);
      R.s = s; R.hist = H; if(M.gameOver(s)){gameOver(M.gameOver(s));return;} const L = H[H.length - 1]; if (L) { pintarTablero(); pintarIndicadores(true); ponerCapaPar(L); } };
    lote();
  }
  function preparar(id, opc) {
    if (opc && opc.desde > 1) setTimeout(() => ponerseAlDia(opc.desde), 50);
    setTimeout(() => mostrarInd(), 400);
    R.sim = id; R.def = defDe(id); R.valores = {}; (R.def && R.def.sliders || []).forEach(s => { R.valores[s.k] = s.val; });
    reiniciarModelo(); pintarPanel(); der.classList.add('on'); ponerLugares(null);
    setTimeout(apagarSintaxis, 1600); setTimeout(apagarSintaxis, 3200);
    setTimeout(() => { const H = HISTORIA[R.def && R.def.par]; const rb = document.getElementById('rc-btn'); const ruidoOn = false; /* el ruido solo se prende a mano */ /* con propuesta: sin capa de ruido, la historia es la red verde y el reparto */ if (H && rb && rb.classList.contains('on') !== ruidoOn) rb.click(); pintarHistoria(); focoHistoria(5);
      apagarSintaxis();
      // sin propuesta (plan parcial): capa «Flujo de carros» prendida para ver las vías internas de Bavaria y Boyacá congestionadas
      /* sin capa de flujo automática */
      // el indicador del par se prende solo, bajo y transparente para no tapar la vista
      const IND_PAR = { 1: 'CCL', 2: 'PM', 3: 'SE', 4: 'SE', 5: 'CV', 6: 'OC' }, ci = IND_PAR[R.def && R.def.par];
      if (ci && false) { R.ind = ci; /* sin picos: la autora ya no los quiere */ R.alto = 0.09; indApi().then(A => { if (A.estilo) A.estilo({ opacidad: 0.72, base: 4 }); A.altura(R.alto); }); mostrarInd(); pintarPicos(); } }, 900);
    if (R.def && R.def.par === 1) setTimeout(() => { // abastecimiento: tráfico y concentración comercial y logística (CCL) prendidos
      // el tráfico se ve con la capa de RUIDO de carros (no con el flujo de puntos): ruido prendido, flujo apagado
      const fo = document.querySelector('#gs-fc button[data-v=""]'); if (fo && !fo.classList.contains('on')) fo.click();
      /* sin ruido automático */
      }, 700); // la capa de comercio (CCL) se prende a mano en «Indicadores»
    R.base = null; if (M) setTimeout(calcularBase, 300); // la otra mitad del par (sin propuesta), con los mismos valores, para comparar
  }
  function reiniciarModelo() {
    R.hist = []; R.cora0 = null; R.go = null; R.fin = false; R.previa = false; R.extinciones = []; R.eventos = []; if (typeof graf !== 'undefined' && graf) graf.classList.remove('on'); go.classList.remove('on'); cerrarInforme(); if (typeof tab !== 'undefined') tab.innerHTML = ''; if (typeof cerrarFicha === 'function') try { cerrarFicha(); } catch (e) { /* */ } limpiarAvisos(); if (window.KEN_HECHOS) window.KEN_HECHOS.limpiar(); if (window.KEN_VERDE) { window.KEN_VERDE.limpiar(); window.KEN_VERDE.ver(false); } ponerPredio(null); ponerBasura(null); ponerCierre(null); ponerDegrada(null); ponerCaminos(null); ponerCapaPar(null); window.KEN_TRAF_F = 1; if (window.KEN_FOCO) window.KEN_FOCO.off(); // el blanco y negro de un game over no queda puesto en la siguiente
    R.s = M && R.sim ? M.crear(R.sim, SEMILLA, R.valores) : null;
    refrescarPicos(); // año 1: los picos vuelven a como está hoy
  }
  /* mover una variable: el modelo se vuelve a correr con el valor nuevo hasta la semana en que va la barra (por lotes, sin avisos ni
     game over de lo ya pasado) y los picos y resultados cambian ahí mismo. En el año 1 (sin nada corrido) los picos muestran una vista
     previa de cómo quedaría al año 20 con ese valor; al darle play vuelven a seguir la barra. */
  let idRe = 0;
  function recalcularAqui() {
    if (!M || !R.sim) return;
    const id = ++idRe, meta = R.hist.length, previa = meta < 4, hasta = previa ? FIN : meta;
    const s = M.crear(R.sim, SEMILLA, R.valores), H = [];
    pintarPrevia(previa ? 'Calculando la vista previa…' : '');
    const lote = () => { if (id !== idRe) return;
      for (let k=0, inicio=performance.now(); k<4 && H.length<hasta && (!k || performance.now()-inicio<5); k++) { M.paso(s); const I = M.ind(s); derivar(I); H.push(I); if(M.gameOver(s))break; }
      if (!M.gameOver(s) && H.length < hasta) return void setTimeout(lote, 0);
      R.base = null; calcularBase(); // la pareja sin propuesta se vuelve a correr con los mismos valores
      if (previa) { R.previa = true; R.s = M.crear(R.sim, SEMILLA, R.valores); R.hist = []; refrescarPicos(H[H.length - 1]); pintarPrevia(`Vista previa: así quedarían los picos al año ${Math.round(FIN / 52)} con estos valores. Dale play para verlo pasar.`); }
      else { R.s = s; R.hist = H; if(M.gameOver(s)){gameOver(M.gameOver(s));return;} refrescarPicos(); pintarIndicadores(true); pintarPrevia(''); pintarGraficas(); pintarHistoria(); const L = H[H.length - 1]; if (L) { ponerPredio(L.predio); ponerBasura(L); ponerCierre(L.cierre); ponerDegrada(L); ponerCaminos(L); ponerCapaPar(L); } }
    };
    lote();
  }
  function pintarPrevia(txt) { let e = document.getElementById('su-previa'); const box = document.getElementById('su-eco'); if (!box) return;
    if (!e) { e = document.createElement('p'); e.id = 'su-previa'; box.before(e); } e.textContent = txt; e.style.display = txt ? '' : 'none'; }
  /* COMPARACIÓN DEL PAR: cada simulación «con propuesta» (id par) se compara con su pareja «sin propuesta» (id impar), corrida con los
     MISMOS valores de las variables; la «sin propuesta» no tiene contra qué compararse (es el punto de partida). Sin pares en el modelo
     (versión vieja) se compara con la simulación 1. */
  let idBase = 0;
  function parejaSin() { const d = R.def || {}; if (d.par != null) return d.propuesta ? R.sim - 1 : null; return R.sim !== 1 ? 1 : null; }
  function calcularBase() {
    const otra = R.def && R.def.par != null ? (R.def.propuesta ? R.sim - 1 : R.sim + 1) : parejaSin(); R.ecoBase = null; if (!M || otra == null || !M.SIMS.some(s => s.id === otra)) { R.base = null; return; }
    try { const id = ++idBase, d = defDe(otra), v = {}; (d && d.sliders || []).forEach(s => { v[s.k] = R.valores[s.k] != null ? R.valores[s.k] : s.val; }); const s = M.crear(otra, SEMILLA, v); const H = []; R.ecoBase = H;
      const lote = () => { if (id !== idBase) return; try { for (let k = 0, inicio = performance.now(); k < 4 && H.length < FIN && (k === 0 || performance.now() - inicio < 5); k++) { M.paso(s); H.push(derivar(M.ind(s))); if (M.gameOver(s)) { if (R.def && R.def.propuesta) R.base = H; return; } } if (H.length < FIN) setTimeout(lote, 30); else if (R.def && R.def.propuesta) R.base = H; } catch (e) { console.warn('base:', e); } };
      lote(); } // por lotes: 20 años de una vez trabarían la página
    catch (e) { console.warn('base del par:', e); }
  }
  /* avanzar el modelo al paso de la barra de años */
  /* RUIDO QUE SE MUEVE: el mapa de ruido sigue a los carros de la simulación (KEN_TRAF_F: con propuesta baja, sin propuesta sube),
     a la hora del día (picos de la mañana y la tarde) y, en el par 01, suma ruido alrededor de Corabastos cuando se llena. */
  RELOJ.alDibujar(() => {
    if (!R.sim) { T3.ruidoExtraDb = 0; T3.ruidoFoco = null; T3.ruidoFocos = null; T3.ruidoSig = ''; return; }
    const h = ((RELOJ.minutoDia != null ? RELOJ.minutoDia : (RELOJ.t % 86400) / 60) / 60) % 24, pico = (c, w) => Math.exp(-((h - c) * (h - c)) / (2 * w * w));
    const fh = 0.35 + 0.75 * Math.max(pico(7.5, 1.3), pico(18, 1.6)) + 0.25 * pico(13, 2.5);
    const ex = 10 * Math.log10(Math.max(0.2, (window.KEN_TRAF_F || 1) * fh)), L = ultimo(), C = L && L.abasto && L.abasto.cora;
    T3.ruidoExtraDb = Math.round(ex * 2) / 2;
    /* el ruido sigue a la carga: Corabastos suma ruido cuando se llena y BAJA cuando los mercados toman parte de la carga (db negativo);
       cada mercado de barrio activo hace ruido según las t/día que mueve (camiones y carros que ahora van a él y no a Corabastos) */
    const A = L && L.abasto, nc = A && A.nodos ? A.nodos.find(q => q.tipo === 'corabastos') : null;
    if (nc && R.cora0 == null && nc.t_dia > 0) R.cora0 = nc.t_dia;
    const dC = nc && R.cora0 ? 10 * Math.log10(Math.max(0.2, nc.t_dia / R.cora0)) : 0; /* dB por cambio de carga de Corabastos frente al año 1 */
    T3.ruidoFoco = C ? { x: C.x, z: C.z, r: 1300, db: Math.round((dC * 1.6 + 6 * Math.max(0, (C.carga - 0.8) / 0.2)) * 2) / 2 } : null;
    T3.ruidoFocos = A && A.mercados ? A.mercados.filter(m => m.activo && m.t_dia > 0.05).map(m => ({ x: m.x, z: m.z, r: 520, db: Math.round(Math.min(9, 3 * Math.log2(1 + m.t_dia / 2)) * 2) / 2 })) : null;
    T3.ruidoSig = T3.ruidoExtraDb + '|' + (T3.ruidoFoco ? T3.ruidoFoco.db : 0) + '|' + (T3.ruidoFocos ? T3.ruidoFocos.map(f => f.db).join(',') : '');
  });
  RELOJ.alDibujar(() => {
    if (!R.s || R.go || R.fin) return;
    if (R.previa && !RELOJ.pausaSem) { R.previa = false; pintarPrevia(''); } // al darle play la vista previa se va y los picos siguen la barra
    let n = 0; const comienzo = performance.now();
    while (R.s && R.hist.length < Math.max(1, Math.min(FIN, RELOJ.sem)) && n++ < 4 && (n === 1 || performance.now()-comienzo<5)) {
      M.paso(R.s); const I = M.ind(R.s); derivar(I); R.hist.push(I); window.KEN_PREDIO_SIM = I.predio || null; /* carros del plan parcial (data3d/trafico_plan.js) según los vehículos/día del modelo */
      for (const x of I.extinciones || []) { R.extinciones.push(x); avisarExtincion(x); }
      for (const ev of I.eventos || []) avisar(ev);
      vigilar(I);
      if (I.hechos && I.sem % 4 === 0) clavar(I.hechos);
      if (I.atropellos && typeof I.atropellos === 'object' && I.sem % 4 === 0) { if (HEC) HEC.atropellos(I.atropellos, I.sem); else clavar([]); }
      if (I.predio || PRE) ponerPredio(I.predio);
      if (I.basura || BAS) ponerBasura(I);
      if (I.cierre || CIE) ponerCierre(I.cierre);
      if (I.sem % 4 === 0 || R.hist.length === 1) { ponerDegrada(I); ponerCaminos(I); }
      ponerCapaPar(I);
      if (I.sem % 4 === 0 || R.hist.length === 1) ponerLugares(I);
      if (I.sem % 4 === 0 || R.hist.length === 1) { pintarHistoria(); pintarGraficas(); pintarTablero(); ponerVerde(I); }
      // más carros (los mismos de la grabación SUMO) a medida que el modelo sube el tráfico y Corabastos se llena: el flujo se pone rojo
      window.KEN_TRAF_F = Math.max(0.6, 1 + ((I.trafico || 1) - 1) * 2.5 + (I.abasto && I.abasto.cora ? 1.2 * Math.max(0, I.abasto.cora.carga - 0.8) : 0));
      const g = M.gameOver(R.s); if (g && R.def && R.def.par) { gameOver(g); return; } /* la simulación base no se detiene: el game over sale como aviso y sigue corriendo */
      if (I.sem % 13 === 0 || (R.hist.length === 1 && !R.previa)) refrescarPicos(); // cada trimestre: los picos se recalculan con lo que ya pasó // cada medio año: los picos se recalculan con lo que ya pasó
    }
    if (R.hist.length >= FIN && !R.fin) { R.fin = true; if (R.def && R.def.par) { RELOJ.pausarAños(true); abrirInforme(); } else dispatchEvent(new Event('lp-vuelta')); /* simulación base (sin escenario): vuelve a empezar sola */ }
    if (n) pintarIndicadores();
  });
  addEventListener('lp-reinicio', () => { reiniciarModelo(); pintarIndicadores(true); });

  /* ---------- panel de la derecha ---------- */
  function pintarPanel() {
    const d = R.def;
    if (!M) { der.innerHTML = '<h4>Simulación</h4><p class="pre">El modelo de las simulaciones todavía no está disponible.</p>'; return; }
    der.innerHTML = `<h4>${d && d.par != null ? `Par ${String(d.par).padStart(2, '0')} · ${d.propuesta ? 'con propuesta' : 'sin propuesta'}` : d && d.grupo === 'propuesta' ? 'Escenario · con la propuesta' : 'Escenario · Kennedy estado actual'}</h4>${d && d.prueba ? `<p class="pre" style="opacity:.75;margin-bottom:4px">${d.prueba}</p>` : ''}
      ${(d && d.sliders && d.sliders.length) ? '<h4>Variables</h4>' + d.sliders.map(s => `<div class="su-sl"><label>${s.n}<b data-v="${s.k}">${vfmt(s, R.valores[s.k])}</b></label><input type="range" min="${s.min}" max="${s.max}" step="${s.paso}" value="${R.valores[s.k]}" data-k="${s.k}" title="${s.ayuda || ''}"></div>`).join('') : ''}
      <div id="su-inds" hidden></div>
      <h4>Informe</h4><div class="su-seg"><button data-inf>Ver informe ahora</button></div>`;
    der.querySelectorAll('input[type=range]').forEach(inp => {
      const pinta = () => { const s = d.sliders.find(x => x.k === inp.dataset.k); inp.style.setProperty('--p', ((inp.value - s.min) / (s.max - s.min) * 100) + '%'); der.querySelector(`[data-v="${s.k}"]`).textContent = vfmt(s, +inp.value); };
      pinta();
      inp.oninput = pinta;
      inp.onchange = () => { R.valores[inp.dataset.k] = +inp.value; recalcularAqui(); }; // la simulación se recalcula hasta el año en que va (sin volver al año 1) y los picos cambian
    });
    der.querySelectorAll('.su-lug button').forEach(b => b.onclick = () => irLugar(lugares()[+b.dataset.l], b));
    der.querySelectorAll('.su-seg[data-g] button').forEach(b => b.onclick = () => {
      const g = b.parentNode.dataset.g; b.parentNode.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
      if (g === 'picos') { R.picos = b.dataset.v || null; const I = R.hist[R.hist.length - 1]; if (R.picos && I) ponerPicos(I); else if (window.KEN_PICOS_IND) window.KEN_PICOS_IND.ver(false); }
      if (g === 'foco' && window.KEN_FOCO) { if (b.dataset.v === 'ruido') { const rc = document.getElementById('rc-btn'); if (rc && !rc.classList.contains('on')) rc.click(); } if (b.dataset.v) window.KEN_FOCO.on(b.dataset.v); else window.KEN_FOCO.off(); }
    });
    const bi = der.querySelector('[data-inf]'); if (bi) bi.onclick = () => abrirInforme();
    pintarIndicadores(true); pintarPicos();
  }
  const vfmt = (s, v) => (s.unidad === '%' ? Math.round(v * (s.max <= 1 ? 100 : 1)) + ' %' : (Math.round(v * 100) / 100).toLocaleString('es-CO') + (s.unidad ? ' ' + s.unidad : ''));
  /* RESULTADOS EN VIVO: una tarjeta por dato con el valor, cuánto cambió desde el año 1 (flecha y color: verde mejora, rojo empeora) y
     su curva con la línea punteada del año 1. Se compara con el año 1 (semana 52) y no con la semana 0: el modelo tarda ~40 semanas en
     asentarse. Se repinta como mucho 4 veces por segundo. */
  let tPint = 0;
  function pintarIndicadores(forzar) {
    const box = document.getElementById('su-inds'); if (!box) return;
    const ahora = performance.now(); if (!forzar && ahora - tPint < 250) return; tPint = ahora;
    const H = R.hist; if (!H.length) { box.innerHTML = '<p class="pre">Dale play para ver cómo cambian.</p>'; return; }
    const I = H[H.length - 1], iR = H.length > 52 ? 51 : 0, I0 = H[iR];
    box.innerHTML = IND.filter(x => I[x.k] != null && (!x.soloSi || x.soloSi(H))).map(x => {
      const v = I[x.k], v0 = I0[x.k], d = v - v0, rel = Math.abs(v0) > 1e-9 ? d / Math.abs(v0) : (Math.abs(d) > 1e-9 ? 1 : 0);
      const clase = Math.abs(rel) < 0.005 ? '' : ((d > 0) === x.sube ? 'bien' : 'mal');
      const chip = H.length <= 52 ? '<i class="ch">año 1</i>' : `<i class="ch ${clase}">${d > 0 ? '▲' : d < 0 ? '▼' : '='} ${x.pts ? (Math.abs(d * x.pts)).toFixed(1) + ' pts' : (Math.abs(rel * 100) < 10 ? Math.abs(rel * 100).toFixed(1) : Math.round(Math.abs(rel * 100))) + ' %'}</i>`;
      // comparativa: en «con propuesta», la misma cifra de la pareja «sin propuesta» en la misma semana
      const Bk = R.def && R.def.propuesta && R.base ? R.base[Math.min(R.base.length - 1, H.length - 1)] : null, vb = Bk ? Bk[x.k] : null;
      const vs = vb != null && isFinite(vb) ? `<i class="vs ${Math.abs(v - vb) < 1e-9 ? '' : ((v > vb) === x.sube ? 'bien' : 'mal')}">sin propuesta: ${x.f(vb, Bk)}</i>` : '';
      return `<div class="su-ind ${Math.abs(rel) >= 0.05 ? 'mueve ' + clase : ''}" title="${x.ayuda || ''}"><span>${x.n}</span><b>${x.f(v, I)}</b>${chip}${vs}${chispa(H.map(h => h[x.k]), clase, iR)}</div>`;
    }).join('');
  }  const chispa = (vals, clase, iR = 0) => { // curva con área y la línea punteada del año 1
    const v = vals.map(x => (x != null && isFinite(x) ? x : null)); const ok = v.filter(x => x != null); if (ok.length < 2) return '<svg></svg>';
    const mn = Math.min(...ok), mx = Math.max(...ok), r = mx - mn || 1, W = 120, Hh = 26, n = Math.min(v.length, 90), paso = (v.length - 1) / (n - 1);
    const Y = (y) => (Hh - 2 - (y - mn) / r * (Hh - 5)).toFixed(1), xs = (i) => (i / (n - 1) * W).toFixed(1);
    const pts = Array.from({ length: n }, (_, i) => v[Math.round(i * paso)]).map((y, i) => y == null ? null : `${xs(i)},${Y(y)}`).filter(Boolean);
    const col = clase === 'bien' ? '#8ee6a8' : clase === 'mal' ? '#ff8a80' : '#ffcf7a', b = v[iR] != null ? Y(v[iR]) : null;
    return `<svg viewBox="0 0 ${W} ${Hh}" preserveAspectRatio="none"><polygon points="0,${Hh} ${pts.join(' ')} ${W},${Hh}" fill="${col}" fill-opacity=".14"/>${b != null ? `<line x1="0" x2="${W}" y1="${b}" y2="${b}" stroke="rgba(255,255,255,.35)" stroke-dasharray="3 3" vector-effect="non-scaling-stroke"/>` : ''}<polyline points="${pts.join(' ')}" fill="none" stroke="${col}" stroke-width="1.6" vector-effect="non-scaling-stroke"/></svg>`;
  };

  /* ---------- INDICADORES como en la versión anterior: los picos 3D de las láminas (data3d/indicadores.js) ----------
     Soporte ecológico, islas de calor, presión sobre el aire, exposición, comercio y logística, organización, conocimiento…
     Con una simulación de la propuesta (B, C) cada indicador se recalcula donde actúa lo que se va construyendo (huertas, árboles,
     mercados, Corabastos): cada año se vuelve a calcular y los picos se mueven. */
  const QUE_IND = { // qué mide cada lámina y si alto es bueno, en una línea, para leer los picos sin explicación
    SE: ['Dónde la fauna encuentra hábitat: árboles, humedales, huertas.', true], EPO: ['Cuánta gente vive expuesta a tráfico, ruido y carga.', false],
    IC: ['Dónde se acumula calor: asfalto y techos sin sombra.', false], PA: ['Presión sobre el aire por tráfico y falta de árboles.', false],
    OC: ['Juntas, colectivos y organizaciones que cuidan el barrio.', true], CO: ['Colegios, bibliotecas y lugares donde se aprende.', true],
    CCL: ['Dónde se concentra el comercio y la logística (Corabastos).', null], PM: ['Presión de carros y camiones sobre las vías.', false], CV: ['Choque entre vivienda y bodegas o carga.', false] };
  let pInd = null; R.ind = null; /* los picos empiezan apagados: se prenden escogiendo un indicador */ R.alto = 0.2; // picos bajos, pegados al piso y transparentes: se lee la ciudad debajo y dónde está cada cosa
  const indApi = async () => { if (window.KEN_IND) return window.KEN_IND; if (!pInd) pInd = import('./indicadores.js?v=12').then(m => m.crearIndicadores({ THREE: T3.THREE, T3 })); return pInd; };
  async function pintarPicos() {
    const box = document.getElementById('su-picos'); if (!box) return;
    let A; try { A = await indApi(); } catch (e) { box.innerHTML = '<p class="pre">No se pudieron cargar los indicadores.</p>'; return; }
    const grad = (r, d) => `linear-gradient(${d},${r.join(',')})`;
    box.innerHTML = `<div class="su-picos">${A.lista.map(x => `<button data-c="${x.code}" class="${x.code === R.ind ? 'on' : ''}"><i style="background:${grad(x.ramp, 'to top')}"></i><b>${x.code}</b><span>${x.name.replace(/\s*\([A-Z]+\)\s*$/, '')}</span></button>`).join('')}
      <button data-c="" class="${!R.ind ? 'on' : ''}"><i style="background:rgba(255,255,255,.15)"></i><b>—</b><span>Apagar picos</span></button></div>
      ${R.ind ? (() => { const it = A.lista.find(x => x.code === R.ind); const q = QUE_IND[it && it.code] || ['', null]; return it ? `<p class="su-que">${q[0]} <b>${q[1] === true ? 'Más alto = mejor.' : q[1] === false ? 'Más alto = peor.' : 'Lo sano es repartido, sin un solo pico.'}</b><br><span>Los picos cambian año a año con lo que la simulación va construyendo.</span></p><div class="su-rampa" style="background:${grad(it.ramp, '90deg')}"></div><div class="su-rampa-t"><span>bajo</span><span>alto</span></div><p id="su-cambio"></p><label class="su-alto"><span>Altura de los picos</span><input type="range" min="0.01" max="0.3" step="0.005" value="${R.alto}"></label>` : ''; })() : ''}`;
    const ra = box.querySelector('.su-alto input'); if (ra) ra.oninput = () => { R.alto = +ra.value; A.altura(R.alto); }; pintarCambio(A);
    box.querySelectorAll('button[data-c]').forEach(b => b.onclick = () => { R.ind = b.dataset.c || null; mostrarInd(); pintarPicos(); });
  }
  async function mostrarInd() { R.ind = null; if (window.KEN_IND) window.KEN_IND.ver(false); if (window.KEN_PICOS_IND) window.KEN_PICOS_IND.ver(false); return; /* picos quitados */ const A = await indApi(); if (!R.altoIni) { R.altoIni = 1; if (A.estilo) A.estilo({ opacidad: 0.66, base: 4 }); A.altura(R.alto); } A.ver(!!R.ind); await A.mostrar(R.ind || null, false); }
  const prom = (A) => { if (!A || !A.length) return 0; let s = 0, n = 0; for (const v of A) if (isFinite(v)) { s += v; n++; } return n ? s / n : 0; };
  const c01 = (v) => Math.max(0, Math.min(1, v || 0));
  function factoresSim(I) { // cuánto de cada intervención existe en esta semana del modelo (0–1) -> T3.simInd para indicadores.js
    const d = R.def || {}, b = d.base || 'A', id = R.sim, sem = I ? I.sem : 0, I0 = R.hist[0];
    const h = I ? I.huertas : 120, HA = 120;                                                 // ~120 huertas que ya existen hoy en el modelo
    const huerta = id === 12 ? 0 : c01((h - HA) / 1500);                                   // 1500: sim 11 llega a ~0,7 y la red de mercados (sim 3) se llena hacia el año 5
    const techo = id === 12 ? c01((h - HA) / 950) : 0.4 * huerta;                          // sim 12: ~1070 huertas equivalentes en techos al tercer año
    const merc = c01(I && I.zonas ? prom(I.zonas.comercio) / 0.3 : 0);                     // fracción que vende la red local (0,3 = lo máximo de sim 3 y 10)
    const cora = id === 5 ? (sem >= (R.valores.sinCora || 52) ? 1 : 0) : id === 6 ? 0.5 * c01(sem / 156) * (R.valores.desmLib != null ? R.valores.desmLib : 1) : 0.8 * merc;    const bav = b === 'B' ? c01(sem / 104) : b === 'D' ? 0.6 * c01(sem / 260) : 0;
    const verde = b === 'B' || b === 'C' ? c01(sem / 156) : id === 6 ? 0.5 * c01(sem / 156) : 0; // parches nativos que maduran en ~3 años
    // tendencia: presión urbana (sube sola si no se hace nada) y red ecológica recuperada (las intervenciones). Si el modelo las trae
    // (ind().presion / ind().recuperacion) se usan; si no: presión = tráfico sobre hoy + paso del tiempo [SUP], recuperación =
    // interacciones de la red frente al estado actual en la misma semana.
    let pres = I && I.presion != null ? I.presion : c01(0.55 * ((I ? I.trafico : 1) - 1) / 0.3 + 0.45 * sem / FIN);
    const B = R.base && I ? R.base[Math.min(R.base.length - 1, Math.max(0, sem - 1))] : null;
    let rec = I && I.recuperacion != null ? I.recuperacion : (B && B.red && I.red != null && id !== 1 ? c01(I.red / B.red - 1) : 0);
    if (I && I.recuperacion == null) pres = pres * (1 - 0.6 * rec); // lo recuperado amortigua la presión
    return { huerta, techo, merc, cora, bav, verde, pres, rec };
  }
  function refrescarPicos(Iv) { T3.simInd = factoresSim(Iv || R.hist[R.hist.length - 1]); if (!R.ind || !pInd && !window.KEN_IND) return; indApi().then(async A => { if (A.recalcular) await A.recalcular(true); pintarCambio(A); }); }
  function pintarCambio(A) { // cuánto cambió la lámina en promedio frente a como está hoy (sobre todo Kennedy)
    const e = document.getElementById('su-cambio'); if (!e) return; const r = A.resumen && A.resumen(); const q = QUE_IND[R.ind] || ['', null];
    if (!r || Math.abs(r.prom) < 0.3) { e.innerHTML = 'Igual que hoy: dale play para ver cómo cambia.'; e.className = ''; return; }
    const mejor = q[1] == null ? null : (r.prom > 0) === q[1]; e.className = mejor == null ? '' : mejor ? 'bien' : 'mal';
    e.innerHTML = `Promedio sobre Kennedy: <b>${r.prom > 0 ? '▲' : '▼'} ${Math.abs(r.prom).toFixed(Math.abs(r.prom) < 10 ? 1 : 0)} %</b> frente a hoy${mejor == null ? '' : mejor ? ' · mejora' : ' · empeora'}`;
  } // indicadores.js recalcula y anima con lo construido hasta ahora
  /* ---------- picos en el piso (data3d/picos_indicadores.js) ---------- */
  function ponerPicos(I) {
    const P = window.KEN_PICOS_IND; if (!P || !R.picos || !I.zonas || !M.ZONAS_XZ) return;
    if (R.picos === 'soporte' && I.zonas.soporteEco) P.poner('soporte', I.zonas.soporteEco, M.ZONAS_XZ, '#5fd38a', 'Soporte ecológico');
    if (R.picos === 'comercio' && I.zonas.comercio) P.poner('comercio', I.zonas.comercio, M.ZONAS_XZ, '#ffb347', 'Comercio de alimentos');
    P.ver(true);
  }

  /* ---------- especie que desaparece: cámara tipo God's Eye (data3d/ojo_dios.js) ---------- */
  function avisarExtincion(x) { // una especie que desaparece también es un aviso (con «Ver» vuela al lugar)
    avisar({ sem: x.sem, tipo: 'especies', capa: 'especies', signo: -1, prio: true, x: x.x, z: x.z, especies: [x.nombre || x.especie], titulo: `Desapareció ${x.nombre || x.especie}`, texto: `Motivo: ${x.motivo}.`, lugar: x.lugar || x.parche || '' });
  }

  /* ---------- ALERTAS DE LOS INDICADORES: muertes de fauna, mucho ruido y caídas del tablero ----------
     Cada semana del modelo se revisa lo nuevo y, si algo se pone mal, sale una tarjeta con «Ver» (vuela rápido, en God's Eye, al lugar).
     Para no interrumpir todo el tiempo cada tipo de alerta sale como mucho cada ESPERA semanas. Al saltar en la barra (o ponerse al día
     con otro escenario) se toma lo que ya pasó como punto de partida: no salen avisos del pasado. */
  const ESPERA = { muerte: 13, ruido: 26, basura: 26, caida: 26 };
  const RUIDO_ALTO = 65; /* dB en un parche con aves: por encima el bienestar de las aves cae a menos del 25 % (indAvesRuido: 0 % a 70 dB) */
  const CAIDAS = [ // indicador, valor, lugar donde se ve, mejor si sube
    { k: 'abejas', n: 'Abejas (especie clave)', v: I => I.abeja ? I.abeja.parches : null, donde: I => { const L = I.abeja && I.abeja.lugares; return L && L.length ? { x: L[0].x, z: L[0].z, n: L[0].n } : null; } },
    { k: 'corredores', n: 'Continuidad de corredores', v: I => I.verde && I.verde.resumen ? I.verde.resumen.conectividad : null, donde: I => { const C = I.verde && I.verde.conexiones && I.verde.conexiones[0]; return C ? { x: (C.x1 + C.x2) / 2, z: (C.z1 + C.z2) / 2, n: C.via ? 'cruce de la ' + C.via : 'corredor ecológico' } : null; } },
    { k: 'biodiv', n: 'Biodiversidad (Shannon)', v: I => I.biodiversidad ? I.biodiversidad.shannon : null, donde: I => { const L = (I.muertes && I.muertes.lista) || []; const m = L[L.length - 1]; return m ? { x: m.x, z: m.z, n: m.lugar } : null; } },
    { k: 'aves', n: 'Bienestar de las aves', v: I => I.avesRuido ? I.avesRuido.bienestar : null, donde: I => { const P = I.avesRuido && I.avesRuido.porParche && I.avesRuido.porParche.slice().sort((a, b) => b.db - a.db)[0]; return P ? { x: P.x, z: P.z, n: P.n } : null; } }
  ];
  const CAUSA = { colision: 'se estrelló', atropello: 'atropellada', ruido: 'por el ruido', hambre_habitat: 'sin hábitat' };
  function vigilar(I) {
    if (!I || I.sem == null) return;
    let A = R.alertas;
    if (!A || I.sem < A.sem || I.sem - A.sem > 8) { A = R.alertas = { sem: I.sem, ult: {}, ref: {}, paso: {} }; for (const c of CAIDAS) { const v = c.v(I); if (v != null && isFinite(v)) A.ref[c.k] = v; } return; } /* punto de partida */
    const semPrev = A.sem; A.sem = I.sem;
    const libre = (t) => I.sem - (A.ult[t] == null ? -999 : A.ult[t]) >= ESPERA[t], marcar = (t) => { A.ult[t] = I.sem; };
    // 1. muertes de fauna nuevas (la más reciente, con su causa y lugar)
    const L = (I.muertes && I.muertes.lista) || [], nuevas = L.filter(m => m.sem > semPrev && m.sem <= I.sem && m.causa !== 'atropello' /* los atropellos ya llegan como aviso del modelo */ && !MENORES.test(m.nombre || m.especie || ''));
    if (nuevas.length) { A.pend = (A.pend || 0) + nuevas.length; A.ultM = nuevas[nuevas.length - 1]; }
    if (A.pend && libre('muerte') && A.ultM) { const m = A.ultM, n = A.pend; A.pend = 0; marcar('muerte');
      avisar({ sem: I.sem, tipo: 'especies', capa: 'especies', signo: -1, prio: true, x: m.x, z: m.z, especies: [m.nombre || m.especie], titulo: `Murió ${m.nombre || m.especie}${m.causa && CAUSA[m.causa] ? ' · ' + CAUSA[m.causa] : ''}`, texto: (m.detalle ? m.detalle.charAt(0).toUpperCase() + m.detalle.slice(1) + '.' : '') + (n > 1 ? ` ${n - 1} muerte${n > 2 ? 's' : ''} más desde el último aviso.` : ''), lugar: m.lugar || '',
        causaM: m.causa, detalle: m.detalle || '', semM: m.sem /* para la reconstrucción del momento (data3d/momento_muerte.js) */ }); }
    // 2. mucho ruido donde viven aves
    const PR = I.avesRuido && I.avesRuido.porParche; if (PR && PR.length && libre('ruido')) { const P = PR.reduce((a, b) => b.db > a.db ? b : a);
      if (P.db >= RUIDO_ALTO && P.db >= (A.dbAvisado || 0) + 1) { A.dbAvisado = P.db; marcar('ruido');
        avisar({ sem: I.sem, tipo: 'ruido', capa: 'ruido', signo: -1, prio: true, x: P.x, z: P.z, titulo: `Mucho ruido: ${Math.round(P.db)} dB`, texto: `${P.aves} especies de aves viven aquí con más de ${RUIDO_ALTO} dB: no se oyen para cantar, se estresan y se van.`, lugar: P.n || '' }); } }
    // 3. basura acumulada que sigue creciendo
    const BP = I.basura && I.basura.puntos; if (BP && BP.length && libre('basura')) { const P = BP.reduce((a, b) => b.acumulada > a.acumulada ? b : a), sig = Math.floor((P.acumulada - (P.acumulada0 || 0)) / 50); /* cada 50 t más que al empezar */
      if (sig >= 1 && sig > (A.basura || 0)) { A.basura = sig; marcar('basura');
        avisar({ sem: I.sem, tipo: 'residuos', capa: 'basura', signo: -1, prio: true, x: P.x, z: P.z, titulo: `Basura acumulada: ${Math.round(P.acumulada)} t`, texto: 'Sin recoger trae ratas que se comen los nidos y rellena los bordes de los humedales.', lugar: P.nombre || '' }); } }
    // 4. un indicador del tablero cae un 10 %, 20 %, 30 %… frente al punto de partida
    if (libre('caida')) for (const c of CAIDAS) { const v = c.v(I), v0 = A.ref[c.k]; if (v == null || !isFinite(v)) continue; if (v0 == null) { A.ref[c.k] = v; continue; } if (!v0) continue;
      const caida = (v0 - v) / Math.abs(v0), esc = Math.floor(caida * 10); if (esc < 1 || esc <= (A.paso[c.k] || 0)) continue;
      const d = c.donde(I); A.paso[c.k] = esc; marcar('caida');
      avisar({ sem: I.sem, tipo: c.k === 'aves' ? 'ruido' : 'especies', capa: c.k === 'aves' ? 'ruido' : 'especies', signo: -1, prio: true, x: d ? d.x : null, z: d ? d.z : null, titulo: `${c.n}: bajó ${Math.round(caida * 100)} %`, texto: 'Frente a cuando empezó a correr esta simulación. Mira dónde se nota más.', lugar: d && d.n ? d.n : '' });
      break; }
  }

  /* ---------- AVISOS → FEED DE EVENTOS (ind().eventos del modelo + vigilar) ----------
     Cada evento entra como una fila del feed de la derecha (data3d/feed_eventos.js; en el celular, una cinta abajo). «Ver» pausa la barra,
     pone el resto del territorio en blanco y negro con lo que importa en color (KEN_FOCO) y vuela con el Ojo de Dios al lugar; la fila
     queda resaltada con «Seguir». Las MUERTES de animales («Murió…», atropellos) van solas al lugar (como mucho una vez por año simulado y
     si «Ir a cada muerte» está prendido): animal sobre la X, marca en pantalla y zoom con la reconstrucción del momento (momento_muerte.js).
     «Seguir» (en la fila o en el zoom) devuelve la cámara, quita el foco y sigue corriendo si estaba corriendo. */
  let FEED = null;
  import('./feed_eventos.js?v=2').then(m => { FEED = m.crearFeed({ alVer: (ev, f) => verEvento(ev, f), alSeguir: () => seguir() }); }).catch(e => console.warn('feed de eventos:', e));
  const escH = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let viendo = null;
  /* cola: entra una fila nueva cada 2,5 s (reales) como mínimo; si se acumulan más de 4 en espera se descartan (siguen en el informe final,
     «Lo que pasó, año por año»), primero las que no son de especies que se pierden. Una muerte automática espera a que no se esté viendo nada. */
  const cola = []; let tUlt = 0;
  setInterval(() => { if (!cola.length || !FEED) return; const ahora = performance.now(); if (cola[0].auto ? viendo : ahora - tUlt < 2500) return; tUlt = ahora; mostrarAviso(cola.shift()); }, 400);
  let semAuto = -999;
  const autoMuerte = (ev) => ev.x != null && ev.signo < 0 && /muri[oó]|atropell/i.test(ev.titulo || '');
  const esMuerto = (ev) => /muri[oó]|atropell|desapareci|se estrell/i.test(ev.titulo || '');
  const causaDe = (ev) => ev.causaM || (/atropell/i.test(ev.titulo || '') ? 'atropello' : /estrell|choc/i.test(ev.titulo || '') ? 'colision' : /ruido/i.test(ev.titulo || '') ? 'ruido' : /h[aá]bitat/i.test(ev.titulo || '') ? 'hambre_habitat' : 'desaparicion');
  /* HECHOS EN EL TERRITORIO (data3d/hechos.js): con capas, lo que pasa en un lugar concreto queda además clavado en el mapa con su causa */
  let HEC = null, pHec = null;
  const generico = (ev) => { const K = M && M.KEN_XZ; return ev.x == null || (K && Math.abs(ev.x - K[0]) < 2 && Math.abs(ev.z - K[1]) < 2); };
  function clavar(lista) { if (SIN_CAPAS) return;
    const L = (lista || []).filter(ev => ev && !generico(ev)); if (!L.length) return;
    if (!HEC) { if (!pHec) pHec = import('./hechos.js?v=7').then(m => { HEC = m.crearHechos({ T3 }); HEC.alClic(ev => { if (!viendo && FEED) { const f = FEED.agregar(ev); verEvento(ev, f); } }); return HEC; }).catch(e => console.warn('hechos:', e)); pHec.then(h => h && h.poner(L)); return; }
    HEC.poner(L);
  }
  /* menos filas: el mismo título no se repite en medio año simulado; los atropellos (pasan cada semana) entran de a uno y nunca los de
     fauna menor (caracoles, ratas…) */
  const MENORES = /caracol|babosa|rata|rat[oó]n|cucaracha|lombriz|zancudo|mosca|hormiga/i;
  const esAtropello = (ev) => /atropell/i.test(ev.titulo || '');
  const yaAvisado = new Map();
  function avisar(ev) {
    if (!ev || !ev.titulo) return; R.eventos.push(ev);
    const sem = ev.sem || 0, ult = yaAvisado.get(ev.titulo); if (ult != null && sem >= ult && sem - ult < 26) return; /* repetido */
    if (esAtropello(ev)) { if ([ev.titulo, ...(ev.especies || [])].some(s => MENORES.test(s))) return;
      if (cola.some(esAtropello)) return; }
    yaAvisado.set(ev.titulo, sem);
    if (!SIN_CAPAS && !generico(ev)) clavar([ev]);
    /* sin vuelo automático a las muertes (pedido de la autora): la cámara solo va cuando la persona toca «Ver» en el feed */
    cola.push(ev); while (cola.length > 4) { const k = cola.findIndex(e => !e.auto && !e.prio && !(e.tipo === 'especies' && e.signo < 0)); /* las alertas (prio) no se descartan */ cola.splice(k >= 0 ? k : cola.findIndex(e => !e.auto), 1); }
  }
  function mostrarAviso(ev) {
    const f = FEED.agregar(ev);
    if (ev.auto) setTimeout(() => { if (!viendo) verEvento(ev, f); }, 250); // muerte de un animal: se muestra sola
    return f;
  }
  function limpiarAvisos() { if (FEED) FEED.limpiar(); cola.length = 0; if (viendo) seguir(); }
  let corria = false;
  async function verEvento(ev, c) {
    if (viendo) await seguir(true);
    viendo = c; if (FEED) FEED.viendo(c, true);
    corria = !RELOJ.pausaSem; RELOJ.pausarAños(true);
    if (pInd || window.KEN_IND) indApi().then(A => A.ver(false)); // de cerca los picos tapan todo: se esconden mientras se muestra
    const capa = ev.capa || (ev.tipo === 'ruido' ? 'ruido' : ev.tipo === 'trafico' ? 'trafico' : 'especies');
    if (capa === 'ruido') { const rb = document.getElementById('rc-btn'); if (rb && !rb.classList.contains('on')) rb.click(); if (window.KEN_PREDIO && ultimo() && ultimo().predio) window.KEN_PREDIO.ruido(true); }
    if (window.KEN_FOCO) window.KEN_FOCO.on([capa, 'predio', 'cierre', 'basura', 'degradacion', 'caminos', 'abasto', 'residuos', 'biodiversidad', 'suelo', 'gobernanza']); // lo que explica el aviso queda en color
    if (window.KEN_OJO && ev.x != null) {
      const O = window.KEN_OJO, muerto = esMuerto(ev), animal = (ev.especies && ev.especies[0]) || '', ir = ev.auto && O.irAuto ? O.irAuto : O.ir; /* irAuto: sin esperar un clic (data3d/camara_quieta.js) */
      /* vuelo rápido y encuadre desde arriba (God's Eye); el texto ya está en la fila del feed: sin tarjeta aparte */
      const ok = await ir({ x: ev.x, z: ev.z, titulo: ev.titulo, texto: ev.texto, lugar: ev.lugar || '', rapido: true, cenital: true, sinTarjeta: true, x0: muerto /* animal muerto: X en el piso con el animal encima */, animal,
        muerte: muerto ? { causa: causaDe(ev), detalle: ev.detalle || ev.texto || '', nombre: animal, sem: ev.semM != null ? ev.semM : ev.sem } : null, color: ev.signo > 0 ? '#8ee6a8' : '#ff8a80',
        alCerrar: () => { if (viendo === c) seguir(false, true); } }).catch(e => { console.warn('ojo:', e); return false; });
      if (ok === false && viendo === c && ev.auto) seguir(); // no se pudo volar: no se queda en pausa
    }
  }
  async function seguir(sinCorrer, yaCerrado) {
    const c = viendo; viendo = null; if (!c) return;
    focoHistoria(1); if (R.ind) indApi().then(A => A.ver(true));
    if (SIN_CAPAS && window.KEN_FOCO) window.KEN_FOCO.off(); // el territorio vuelve a color
    if (window.KEN_OJO && !yaCerrado) window.KEN_OJO.cerrar();
    if (FEED) FEED.viendo(c, false);
    if (corria && !sinCorrer && !R.go && !R.fin) { const p = document.querySelector('#lp-anos .play'); if (p && RELOJ.pausaSem) p.click(); }
  }

  /* ---------- PREDIO (simulación 4): carros por las vías nuevas y ruido adentro (data3d/predio_trafico.js, si está) ---------- */
  let PRE = null, pPre = null;
  function ponerPredio(P) { if (SIN_CAPAS) P = null;
    if (!P) { if (PRE) { PRE.ver(false); } return; }
    if (!PRE) { if (!pPre) pPre = import('./predio_trafico.js?v=4').then(m => { PRE = m.crearPredio({ T3, RELOJ }); return PRE; }).catch(() => null); pPre.then(x => { if (x && R.sim) ponerPredio(R.hist.length ? R.hist[R.hist.length - 1].predio : null); }); return; }
    PRE.ver(true); PRE.poner({ trafico: P.trafico, trafico0: P.trafico0, ruidoDb: P.ruidoDb, ruidoDb0: P.ruidoDb0, vias: P.vias, sem: R.hist.length, vehiculosDia: P.vehiculosDia });
  }
  /* ---------- BASURA Y RATAS (data3d/basura.js) y CIERRE GRADUAL DE VÍA (data3d/cierre_gradual.js), si están ---------- */
  let BAS = null, pBas = null, CIE = null, pCie = null;
  function ponerBasura(I) { if (SIN_CAPAS) I = null;
    if (!I || !I.basura) { if (BAS) BAS.ver(false); return; }
    if (!BAS) { if (!pBas) pBas = import('./basura.js?v=2').then(m => { BAS = m.crearBasura({ T3, RELOJ }); const L = R.hist[R.hist.length - 1]; if (L && L.basura) ponerBasura(L); }).catch(() => null); return; }
    BAS.ver(true); BAS.poner({ puntos: I.basura.puntos, total_t_dia: I.basura.total_t_dia, acumulada: I.basura.acumulada, ratas: I.ratas, ratas0: I.ratas0 });
  }
  function ponerCierre(C) { if (SIN_CAPAS) C = null;
    if (!C || !(C.fase > 0)) { if (CIE) CIE.quitar(); return; }
    if (!CIE) { if (!pCie) pCie = import('./cierre_gradual.js?v=5').then(m => { CIE = m.crearCierre({ T3, RELOJ }); const L = R.hist[R.hist.length - 1]; if (L && L.cierre) ponerCierre(L.cierre); }).catch(() => null); return; }
    CIE.poner({ via: C.via, fase: C.fase, ruidoExtraDb: C.ruidoExtraDb, traficoDesvio: C.traficoDesvio });
  }

  /* ---------- HUMEDALES QUE SE ENCOGEN Y ÁRBOLES QUE SE PIERDEN (data3d/degradacion.js) y CAMINOS DEL INSTITUTO (data3d/caminos_instituto.js) ---------- */
  let DEG = null, pDeg = null, CAM = null, pCam = null;
  const ultimo = () => R.hist[R.hist.length - 1];
  function ponerDegrada(I) { if (SIN_CAPAS) I = null;
    if (!I || !I.humedales) { if (DEG) DEG.ver(false); return; }
    if (!DEG) { if (!pDeg) pDeg = import('./degradacion.js?v=1').then(m => { DEG = m.crearDegradacion({ T3, RELOJ }); const L = ultimo(); if (L) ponerDegrada(L); }).catch(() => null); return; }
    DEG.ver(true); DEG.poner({ humedales: I.humedales, humedalFuncional: I.humedalFuncional, arbolesPerdidos: Math.floor((I.arbolesPerdidos || 0) / 0.025) * 0.025, // en escalones de 2,5 %: los árboles caen en tandas (cada tanda sube todo el bosque a la tarjeta de video; cada 4 semanas trababa)
      basuraHumedal: ((I.basura && I.basura.puntos) || []).filter(p => p.fuente === 'humedal').map(p => ({ x: p.x, z: p.z, acumulada: p.acumulada })) });
  }
  function ponerCaminos(I) { if (SIN_CAPAS) I = null; // con el instituto (B) o la red (C) o los techos con Bavaria Común (12): se abren en los primeros dos años
    const b = (R.def && R.def.base) || 'A', con = I && (b === 'B' || b === 'C' || R.sim === 12);
    if (!con) { if (CAM) CAM.ver(false); return; }
    if (!CAM) { if (!pCam) pCam = import('./caminos_instituto.js?v=1').then(m => { CAM = m.crearCaminos({ T3, RELOJ }); setTimeout(() => { const g = T3.scene.getObjectByName('caminos'); if (g) g.traverse(o => { if (o.isMesh || o.isPoints || o.isLine) o.renderOrder = 30 + (o.renderOrder || 0); }); }, 1500); /* encima de los picos transparentes */ const L = ultimo(); if (L) ponerCaminos(L); }).catch(() => null); return; }
    CAM.ver(true); CAM.poner({ fase: Math.max(0.05, Math.min(1, (I.sem || 0) / 104)) });
  }

  /* ---------- CAPA PRINCIPAL DE CADA PAR (data3d/capas_pares.js): abasto, residuos, biodiversidad, suelo, gobernanza ---------- */
  let PAR = null, pPar = null;
  const capaPar = () => { const c = R.def && R.def.capa; return c && c !== 'movilidad' ? c : null; };
  /* LUGARES: pines con ícono y nombre de dónde está cada cosa (tiendas, supermercados, plazas, Corabastos; con propuesta los mercados,
     Bavaria Común y las Estaciones Circulares) — data3d/lugares.js */
  let LUG = null, pLug = null;
  /* RED VERDE (data3d/verde_red.js): parches que se liberan, refuerzan o crean, crecen y se conectan, con ind().verde del modelo */
  let VER = null, pVer = null;
  function ponerVerde(I) { if (SIN_CAPAS) I = null;
    if (!I || !I.verde) { if (VER) VER.ver(false); return; }
    if (!VER) { if (!pVer) pVer = import('./verde_red.js?v=3').then(m => { VER = m.crearVerde({ T3 }); const U = ultimo(); if (U) ponerVerde(U); }).catch(e => console.warn('red verde:', e)); return; }
    VER.ver(!!R.sim); VER.poner(I.verde);
  }
  function ponerLugares(I) {
    if (!LUG) { if (!pLug) pLug = import('./lugares.js?v=5').then(m => m.crearLugares({ T3 })).then(L => { LUG = L; const U = ultimo(); if (U) ponerLugares(U); }).catch(e => console.warn('lugares:', e)); return; }
    LUG.ver(false); /* vista limpia: sin pines de tiendas (los mercados se ven como volúmenes en el reparto) */ /* tiendas y mercados solo donde son la historia (abastecimiento, movilidad): en las demás tapaban el territorio */ LUG.poner({ propuesta: !!(R.def && R.def.propuesta), sem: I ? I.sem : 0, estaciones: I ? I.estaciones : null });
  }
  let CONT = null, pCont = null, REP = null, pRep = null;
  function ponerCapaPar(I) { const p01 = !!(I && I.abasto && I.abasto.ab01); if (SIN_CAPAS && !p01) I = null; /* par 01: los medidores de capacidad sí se ven (pedido de la autora, 2026-11-25) */
    const c = I ? capaPar() : null;
    // par 01: medidores de capacidad (data3d/abasto_contenedor.js): Corabastos y, con propuesta, uno por mercado
    /* antes, con propuesta: data3d/reparto.js (volúmenes proporcionales); ahora los mismos medidores muestran el reparto */
    const repartir = false;
    { const og = T3.scene.getObjectByName('corabastos'); if (og) og.visible = !(repartir && REP); }
    if (repartir) { if (PAR) PAR.quitar(); if (CONT) CONT.ver(false); if (!REP) { if (!pRep) pRep = import('./reparto.js?v=2').then(m => { REP = m.crearReparto({ T3 }); const L = ultimo(); if (L) ponerCapaPar(L); }).catch(e => console.warn('reparto:', e)); return; } REP.ver(true); REP.poner(I.abasto); return; }
    if (REP) REP.ver(false);
    if (c === 'abasto') { if (PAR) PAR.quitar(); if (!CONT) { if (!pCont) pCont = import('./abasto_contenedor.js?v=8').then(m => { CONT = m.crearContenedores({ T3 }); const L = ultimo(); if (L) ponerCapaPar(L); }).catch(e => console.warn('contenedores:', e)); return; } CONT.ver(true); CONT.poner(I.abasto); return; }
    if (CONT) CONT.ver(false);
    if (!c) { if (PAR) PAR.quitar(); return; }
    if (!PAR) { if (!pPar) pPar = import('./capas_pares.js?v=1').then(m => { PAR = m.crearCapasPares({ T3, RELOJ }); const L = ultimo(); if (L) ponerCapaPar(L); }).catch(() => null); return; }
    PAR.poner(c, I);
  }

  /* ---------- CLARIDAD: UNA HISTORIA POR PAR ----------
     1) Solo quedan visibles las capas que explican la prueba del par (lo demás se apaga mientras corre esa simulación).
     2) Tarjeta «¿Qué está pasando?»: la cadena causa → efecto con cifras en vivo, y la misma cifra en la otra mitad del par
        (sin propuesta / con propuesta, mismos valores, misma semana) para ver cómo la arquitectura cambia la dinámica. */
  const TODAS = ['abasto_cont', 'abasto', 'residuos', 'biodiversidad', 'suelo', 'gobernanza', 'basura', 'degradacion', 'cierre', 'caminos', 'predio', 'biotica', 'indicadores'];
  const HISTORIA = {
    1: { capas: ['abasto_cont', 'basura', 'degradacion', 'predio', 'caminos'], ruido: true, etq: ['bas'] },
    2: { capas: ['cierre', 'biotica', 'predio', 'caminos'], ruido: true, etq: [] },
    3: { capas: ['residuos', 'basura', 'degradacion', 'predio', 'caminos'], ruido: false, etq: ['bas', 'pares'] },
    4: { capas: ['biodiversidad', 'biotica', 'degradacion', 'predio', 'caminos'], ruido: false, etq: ['pares'] },
    5: { capas: ['suelo', 'predio', 'caminos'], ruido: false, etq: ['pares'] },
    6: { capas: ['gobernanza', 'caminos'], ruido: false, etq: ['pares'] }
  };
  const pct = (a, b) => (b ? (a / b - 1) * 100 : 0), sg = (v, d = 0) => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(d);
  const CADENA = { // pasos de la historia: [texto, valor(I, I1), formato]
    1: [['Demanda de frescos de Kennedy', (I) => I.abasto && I.abasto.ab01 ? fmt(I.abasto.ab01.demK) + ' t/día' : '—'],
        ['Lo que se le pide a Corabastos', (I, I1) => I.abasto && I.abasto.cora ? fmt(I.abasto.cora.pedido_t_dia) + ' t/día (' + sg(pct(I.abasto.cora.pedido_t_dia, I1.abasto && I1.abasto.cora ? I1.abasto.cora.pedido_t_dia : 0)) + ' %)' : '—'],
        ['Corabastos frente a su tope', (I) => I.abasto && I.abasto.cora ? Math.round(I.abasto.cora.carga * 100) + ' %' : '—'],
        ['Mercados y autoconsumo', (I) => I.abasto && I.abasto.ab01 ? fmt(I.abasto.ab01.mercT + I.abasto.ab01.autoT) + ' t/día' : '—'],
        ['Sector peor abastecido', (I) => Math.round((I.comidaMin || 0) * 100) + ' %']],
    2: [['Vía cerrada', (I) => I.cierre && I.cierre.fase ? Math.round(I.cierre.fase * 100) + ' % cerrada' : 'abierta'],
        ['Tráfico en las calles del desvío', (I) => I.cierre && I.cierre.traficoDesvio ? '+' + Math.round((I.cierre.traficoDesvio - 1) * 100) + ' %' : '—'],
        ['Comida en la zona peor servida', (I) => Math.round((I.comidaMin || 0) * 100) + ' %'],
        ['Ruido promedio', (I) => (I.ruidoDb || 0).toFixed(1) + ' dB'],
        ['Interacciones entre especies', (I, I1) => sg(pct(I.red, I1.red)) + ' %']],
    3: [['Orgánicos generados', (I, I1) => sg(pct(I.basuraT, I1.basuraT)) + ' %'],
        ['Tratados en estaciones / relleno', (I) => I.estaciones ? fmt(I.estaciones.reduce((a, e) => a + (e.tratado_t_dia || 0), 0)) + ' t/día' : '—'],
        ['Economía circular', (I) => ((I.circularIdx || 0) * 100).toFixed(1) + ' %'],
        ['Basura sin recoger', (I) => fmt(I.basura ? I.basura.acumulada : 0) + ' t'],
        ['Humedales que funcionan', (I) => Math.round(I.humedalFuncional || 0) + ' %']],
    4: [['Parche perdido', (I) => I.fragmento ? (I.fragmento.nombre || 'parche') + ' · ' + (I.fragmento.haPerdidas || 0).toFixed(1) + ' ha' : '—'],
        ['Corredores y refugios', (I) => (I.corredores ? I.corredores.length : 0) + ' corredores · ' + (I.refugios ? I.refugios.length : 0) + ' refugios'],
        ['Territorio con fauna', (I, I1) => sg(pct(I.pares, I1.pares)) + ' %'],
        ['Especies de fauna', (I) => I.fauna + ' de ' + I.fauna0],
        ['Interacciones entre especies', (I, I1) => sg(pct(I.red, I1.red)) + ' %']],
    5: [['Precio del suelo', (I) => '×' + (I.sueloIdx || 1).toFixed(2)],
        ['Zonas desplazadas / que cambian de uso', (I) => I.suelo && typeof I.suelo === 'object' ? I.suelo.desplazadas + ' / ' + I.suelo.cambian : (I.especulacion ? '' : '—')],
        ['Hogares en riesgo de desplazamiento', (I) => fmt(I.hogaresRiesgo || 0)],
        ['Tráfico', (I) => Math.round((I.trafico || 1) * 100) + ' % de hoy']],
    6: [['Recursos que alcanzan', (I) => I.gobernanza ? Math.round(I.gobernanza.coberturaMedia * 100) + ' % de la necesidad' : '—'],
        ['Equidad entre barrios', (I) => I.gobernanza ? I.gobernanza.equidad.toFixed(2) : '—'],
        ['Decisiones tomadas', (I) => I.gobernanza ? fmt(I.gobernanza.decisiones) : '—'],
        ['Equipamientos habilitados', (I) => I.gobernanza ? fmt(I.gobernanza.equipamientos.length) : '—']]
  };
  const hist = document.createElement('div'); hist.id = 'su-hist'; document.body.appendChild(hist);
  hist.addEventListener('click', (e) => { const tr = e.target.closest('tr, .fila, li'); if (!tr) return; const txt = tr.textContent || ''; const k = Object.keys(FICHA).sort((a, b) => b.length - a.length).find(n => txt.includes(n)); if (k) abrirFicha(k); });
  /* GRÁFICAS EN VIVO (sobre la barra de años): 3 curvas por par, la corrida actual (ámbar) y, en «con propuesta», la pareja «sin
     propuesta» (gris punteada) hasta la misma semana; eje x = los 20 años; valor actual rotulado */
  const SERIES = {
    1: [['Corabastos frente a su tope', I => I.abasto && I.abasto.cora ? I.abasto.cora.carga * 100 : null, '%', 100], ['Humedales que funcionan', I => I.humedalFuncional, '%', 70], ['Interacciones entre especies', I => I.red, '', null]],
    2: [['Comida en la zona peor', I => (I.comidaMin || 0) * 100, '%', 80], ['Tráfico (100 = hoy)', I => (I.trafico || 1) * 100, '', 130], ['Atropellos de fauna (total)', I => I.atropellos && I.atropellos.total, '', null], ['Interacciones entre especies', I => I.red, '', null]],
    3: [['Basura sin recoger (t)', I => I.basura ? I.basura.acumulada : null, '', null], ['Economía circular', I => (I.circularIdx || 0) * 100, '%', null], ['Humedales que funcionan', I => I.humedalFuncional, '%', 70]],
    4: [['Atropellos de fauna (total)', I => I.atropellos && I.atropellos.total, '', null], ['Territorio con fauna', I => I.pares, '', null], ['Interacciones entre especies', I => I.red, '', null], ['Humedales que funcionan', I => I.humedalFuncional, '%', 70]],
    5: [['Hogares en riesgo', I => I.hogaresRiesgo, '', null], ['Precio del suelo (1 = hoy)', I => I.sueloIdx, '', null], ['Tráfico (100 = hoy)', I => (I.trafico || 1) * 100, '', 130]],
    6: [['Equidad entre barrios', I => I.gobernanza ? I.gobernanza.equidad : null, '', null], ['Recursos que alcanzan', I => I.gobernanza ? I.gobernanza.coberturaMedia * 100 : null, '%', null], ['Decisiones tomadas', I => I.gobernanza ? I.gobernanza.decisiones : null, '', null]]
  };
  const graf = document.createElement('div'); graf.id = 'su-graf'; document.body.appendChild(graf);
  /* EVALUACIÓN ECOCÉNTRICA (macromodelo de la tesis): radar de las 5 dimensiones de ind().eco (0–1), esta corrida en color y, en «con
     propuesta», la pareja «sin propuesta» punteada en la misma semana; debajo la tarjeta de la abeja (especie foco, ind().abeja) */
  const DIMS = [['integridad', 'Integridad'], ['biodiversidad', 'Biodiversidad'], ['abioticos', 'Agua y suelo'], ['limites', 'No regresión'], ['gobernanza', 'Gobernanza']];
  function radar(E, Eb, col) {
    const W = 270, H = 200, cx = W / 2, cy = 104, R = 66, ang = (i) => -Math.PI / 2 + i * 2 * Math.PI / DIMS.length, P = (i, v) => [cx + Math.cos(ang(i)) * R * v, cy + Math.sin(ang(i)) * R * v];
    const poli = (e) => DIMS.map(([k], i) => P(i, e && e[k] != null ? Math.max(0, Math.min(1, e[k])) : 0).map(n => n.toFixed(1)).join(',')).join(' ');
    let s = `<svg viewBox="-20 0 ${W + 40} ${H}" width="100%" style="overflow:visible">`;
    for (const r of [0.25, 0.5, 0.75, 1]) s += `<polygon points="${DIMS.map((_, i) => P(i, r).map(n => n.toFixed(1)).join(',')).join(' ')}" fill="none" stroke="rgba(255,255,255,${r === 1 ? 0.25 : 0.1})"/>`;
    DIMS.forEach(([k, n], i) => { const [x, y] = P(i, 1), [lx, ly] = P(i, 1.2); s += `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="rgba(255,255,255,.1)"/><text x="${lx.toFixed(1)}" y="${(ly + 3).toFixed(1)}" fill="#e9ecef" font-size="9.5" font-family="system-ui,sans-serif" text-anchor="${Math.abs(lx - cx) < 8 ? 'middle' : lx > cx ? 'start' : 'end'}">${n}${E && E[k] != null ? ' · ' + Math.round(E[k] * 100) : ''}</text>`; });
    if (Eb) s += `<polygon points="${poli(Eb)}" fill="rgba(200,205,212,.08)" stroke="rgba(220,224,230,.7)" stroke-width="1.4" stroke-dasharray="4 3"/>`;
    s += `<polygon points="${poli(E)}" fill="${col}33" stroke="${col}" stroke-width="2"/>`;
    return s + '</svg>';
  }
  /* Flor: longitud de cada pétalo = dimensión (0–100), con referencia del otro escenario. */
  function pintarEco() {
    const box = document.getElementById('su-eco'), I = ultimo(); if (!box || !I || !I.eco) return;
    const d = R.def || {}, B = d.propuesta && R.base ? R.base[Math.min(R.base.length - 1, R.hist.length - 1)] : null;
    box.innerHTML = florEco(I.eco, B && B.eco);
  }
  function pintarEcoViejo() {
    const box = document.getElementById('su-eco'), I = ultimo(); if (!box || !I || !I.eco) return;
    const d = R.def || {}, B = d.propuesta && R.base ? R.base[Math.min(R.base.length - 1, R.hist.length - 1)] : null, Eb = B && B.eco ? B.eco : null, col = d.propuesta ? '#8ee6a8' : '#ffcf7a';
    const A = I.abeja, Ab = B && B.abeja;
    const VR = I.verde && I.verde.resumen, VB = B && B.verde && B.verde.resumen;
    const redV = VR ? `<div class="su-abeja" style="background:rgba(95,211,138,.07);border-color:rgba(95,211,138,.25);margin-bottom:8px"><b style="color:#8ee6a8">Red verde de Kennedy</b>
      <div><span>Parches conectados entre sí</span><b>${VR.nConectados} de ${VR.nParches}</b><small>${VB ? "sin: " + VB.nConectados + " de " + VB.nParches : ""}</small></div>
      <div><span>Área verde</span><b>${Math.round(VR.haVerde)} ha</b><small>año 1: ${Math.round(VR.haVerde0)} ha${VB ? " · sin: " + Math.round(VB.haVerde) + " ha" : ""}</small></div>
      <div><span>Conectividad</span><b>${Math.round((VR.conectividad || 0) * 100)} %</b><small>${VB ? "sin: " + Math.round((VB.conectividad || 0) * 100) + " %" : ""}</small></div>
      <p style="opacity:.7">En el mapa: manchas verdes = parches (lima nuevos, tierra→verde liberados), franjas = conexiones que se van construyendo, rojo = conexión rota.</p></div>` : "";
    box.innerHTML = `<div class="su-eco-i"><b style="color:${col}">${Math.round((I.eco.indice || 0) * 100)}</b><span>índice ecocéntrico${Eb ? ` · sin propuesta <b>${Math.round((Eb.indice || 0) * 100)}</b>` : ''}</span></div>${radar(I.eco, Eb, col)}
      ${Eb ? '<p class="su-eco-l"><i style="background:' + col + '"></i>con propuesta <i class="pt"></i>sin propuesta (misma semana)</p>' : ''}
      ${false && A ? `<div class="su-abeja"><b>🐝 La abeja (especie clave)</b>
        <div><span>Lugares que ocupa</span><b>${A.parches}</b><small>año 1: ${Math.round(A.parchesRef)}${Ab ? ' · sin: ' + Ab.parches : ''}</small></div>
        <div><span>Flores que poliniza (activas)</span><b>${A.interacciones}</b><small>${Ab ? 'sin: ' + Ab.interacciones : ''}</small></div>
        <div><span>Lugares conectados por corredores</span><b>${Math.round((A.conectados || 0) * 100)} %</b><small>${Ab ? 'sin: ' + Math.round((Ab.conectados || 0) * 100) + ' %' : ''}</small></div>
        <p>Presión principal: <b>${A.presion || 'ninguna'}</b></p></div>` : ''}
`;
  }
  /* FICHA DE CADA INDICADOR: por qué se mide, para qué, cómo se calcula y dónde; «Ver dónde se mide» pone aros azules en los lugares de
     medición y vuela con el Ojo de Dios al principal. pts(I) = [{ x, z, n }] en coordenadas del mundo (salen del mismo ind() del modelo). */
  const MAX = (arr, f) => (arr || []).reduce((m, e) => (m == null || f(e) > f(m) ? e : m), null);
  const pHum = (I) => (I.humedales || []).map(h => ({ x: h.x, z: h.z, n: `${h.nombre} · ${(h.ha || 0).toFixed(1)} de ${(h.ha0 || 0).toFixed(1)} ha · calidad ${Math.round((h.calidad || 0) * 100)} %` })).sort((a, b) => 0);
  const pCora = (I) => I.abasto && I.abasto.cora ? [{ x: I.abasto.cora.x, z: I.abasto.cora.z, n: 'Corabastos (bodegas de la central)' }] : [];
  const pPred = (I) => I.predio ? [{ x: I.predio.x, z: I.predio.z, n: I.predio.nombre + ' · entradas al predio' }] : [];
  const pZonaPeor = (I) => { const Z = M && M.ZONAS_XZ, c = I.zonas && I.zonas.cora; if (!Z || !c) return []; let k = 0; for (let i = 1; i < c.length; i++) if (c[i] > c[k]) k = i; return [{ x: Z[k][0], z: Z[k][1], n: 'Zona de 500 m peor servida (la que más depende de Corabastos)' }]; };
  const pBasu = (I) => (I.basura && I.basura.puntos || []).slice().sort((a, b) => b.acumulada - a.acumulada).slice(0, 6).map(P => ({ x: P.x, z: P.z, n: `${P.nombre || P.fuente} · ${Math.round(P.acumulada)} t acumuladas` }));
  const pEst = (I) => (I.estaciones || []).filter(e => e.x != null).slice(0, 8).map(e => ({ x: e.x, z: e.z, n: `${e.n || e.nombre || 'Estación circular'}${e.tratado_t_dia != null ? ' · ' + e.tratado_t_dia.toFixed(1) + ' t/día' : ''}` }));
  const pSuelo = (I) => (I.especulacion && I.especulacion.zonas || []).slice().sort((a, b) => b.indice - a.indice).slice(0, 5).map(z => ({ x: z.x, z: z.z, n: `Suelo ×${z.indice.toFixed(2)} frente a hoy` }));
  const pGob = (I) => { const G = I.gobernanza; const L = G && (G.sectores || G.equipamientos) || []; return L.filter(e => e && e.x != null).slice(0, 8).map(e => ({ x: e.x, z: e.z, n: e.n || e.nombre || 'Sector' })); };
  const pFauna = (I) => pHum(I).concat(pPred(I).map(p => ({ ...p, n: 'Bosque y patios de Bavaria' })));
  const FICHA = {
    'Corabastos frente a su tope': { por: 'Más del 94 % de lo que se come en Bogotá entra por Corabastos: es un solo punto que, si se llena, deja a Kennedy sin comida.', para: 'Saber en qué año la demanda desborda la central y si la red de mercados de barrio de la propuesta lo evita.', como: 'Toneladas al día que se le piden (población × consumo − lo que producen las huertas y los mercados de la red) ÷ toneladas al día que puede mover. 100 % = tope (supuesto calibrado; el tope no es un dato oficial).', donde: 'En las bodegas de la Central de Abastos (Av. de las Américas con Av. Agoberto Mejía).', pts: pCora },
    'Humedales que funcionan': { por: 'Los humedales El Burro, La Vaca y Techo son el hábitat de aves y anfibios y regulan el agua; la basura del borde los va rellenando.', para: 'Ver si el borde de los humedales se pierde (game over por debajo de 70 %) o se restaura.', como: 'Área que queda × calidad del agua y del borde, frente a hoy (100 % = como están hoy). El área baja con la basura arrojada en el borde; la calidad con la basura acumulada.', donde: 'En los tres humedales de Kennedy (aros azules).', pts: pHum },
    'Interacciones entre especies': { por: 'Desde lo ecocéntrico importa la relación, no solo cuántas especies hay: una abeja sin flores o un ave sin árbol para anidar ya no cumplen su función.', para: 'Medir si la arquitectura (huertas, conexiones, refugios) multiplica las relaciones o si se rompen.', como: 'Número de pares especie–especie activos (poliniza, come, anida, dispersa) que coinciden en el mismo parche esa semana, según la red de interacciones del modelo.', donde: 'En cada parche verde: humedales, parques, el bosque de Bavaria y las huertas.', pts: pFauna },
    'Territorio con fauna': { por: 'Si las especies ocupan menos lugares, la fauna se concentra y queda expuesta a una sola amenaza.', para: 'Ver si las especies ganan o pierden lugares donde vivir.', como: 'Pares especie–parche ocupados (cada especie en cada parche donde está presente), promedio móvil de 13 semanas.', donde: 'En los parches verdes de Kennedy.', pts: pFauna },
    'Comida en la zona peor': { por: 'El promedio esconde a los barrios que se quedan sin comida; la cadena se rompe primero en el lugar más débil.', para: 'Detectar la zona que deja de recibir lo que necesita cuando se cierra una vía o se corta el suministro (límite 80 %).', como: 'Comida que llega ÷ comida que necesita, en cada zona de 500 m; se muestra la zona con el valor más bajo.', donde: 'En la zona de 500 m peor servida (aro azul).', pts: pZonaPeor },
    'Tráfico (100 = hoy)': { por: 'Más carros significa más ruido, más atropellos de fauna y rutas de abastecimiento más lentas.', para: 'Ver si el plan parcial o un cierre de vía congestionan Kennedy (límite 130) y si la propuesta lo baja.', como: 'Vehículos frente a hoy (100 = 2025, congestión TomTom 69,9 %), con el crecimiento de la población, el metro (−% a 800 m del eje) y los viajes nuevos del predio.', donde: 'En todas las calles de Kennedy; más cargado en las entradas del predio de Bavaria y la Av. Boyacá.', pts: pPred },
    'Basura sin recoger (t)': { por: 'La basura acumulada trae ratas, que depredan nidos, y rellena los bordes de los humedales.', para: 'Ver si los orgánicos se tratan cerca (estaciones circulares) o se acumulan.', como: 'Toneladas acumuladas en los puntos de basura: lo que se genera cada día − lo que se recoge (84 %) − lo que se limpia.', donde: 'En los puntos de acumulación: Corabastos, la plaza Las Flores y los bordes de los humedales.', pts: pBasu },
    'Economía circular': { por: 'Si los orgánicos vuelven como abono a las huertas, el ciclo de nutrientes se cierra dentro de Kennedy (ciclos biogeoquímicos).', para: 'Medir cuánto del residuo orgánico deja de ir al relleno Doña Juana.', como: 'Toneladas al día compostadas que vuelven a las huertas ÷ toneladas al día de orgánicos que genera Kennedy.', donde: 'En las Estaciones Circulares de los mercados nodo y en Bavaria Común.', pts: pEst },
    'Hogares en riesgo': { por: 'El metro y el plan parcial suben el suelo; los que pagan arriendo pueden tener que irse.', para: 'Ver si la protección del suelo y la captura de plusvalías de la propuesta frenan el desplazamiento.', como: 'Hogares arrendatarios en zonas donde el suelo sube más de lo que pueden pagar (51 % arrienda en Kennedy).', donde: 'En las zonas junto a las estaciones del metro y al predio de Bavaria donde más sube el suelo.', pts: pSuelo },
    'Precio del suelo (1 = hoy)': { por: 'El alza del suelo es lo que empuja a la gente fuera y cambia el uso de los predios.', para: 'Comparar el alza con y sin protección del suelo.', como: 'Índice de precio frente a hoy, promedio de las zonas junto al metro y al plan parcial (rampa de 2 años después de cada obra).', donde: 'En las zonas de 500 m más cercanas al metro y al predio.', pts: pSuelo },
    'Equidad entre barrios': { por: 'Repartir con datos viejos y desde una oficina central deja barrios sin lo que necesitan.', para: 'Comparar la coordinación central con las asambleas de las Juntas de Acción Comunal.', como: '1 − desigualdad entre lo que recibe cada sector y lo que necesita (1 = todos reciben en proporción a su necesidad).', donde: 'En los ocho sectores de Kennedy (asambleas).', pts: pGob },
    'Recursos que alcanzan': { por: 'Los recursos nunca alcanzan para todo: importa a dónde van.', para: 'Ver cuánta de la necesidad se cubre en promedio.', como: 'Recursos repartidos ÷ necesidad, promedio de los sectores.', donde: 'En los ocho sectores de Kennedy.', pts: pGob },
    'Decisiones tomadas': { por: 'Decidir en asamblea es más lento pero más ajustado al barrio.', para: 'Medir el costo en tiempo de la gobernanza comunitaria.', como: 'Número acumulado de decisiones de reparto tomadas.', donde: 'En las asambleas de los ocho sectores.', pts: pGob }
  };
  FICHA['Atropellos de fauna (total)'] = { por: 'Las avenidas cortan el paso entre humedales y parques: ranas, serpientes, lagartijas, curíes y aves bajas mueren al cruzar.', para: 'Ver dónde la vía corta un corredor de fauna y si los pasos de fauna y las conexiones vegetales de la propuesta lo bajan.', como: 'Cada semana cada parche ocupado manda un animal que se dispersa a otro parche; muere con probabilidad 1 − e^(−c·Q) según los vehículos al día (Q) de las vías principales que cruza (Hels y Buchwald). Con la propuesta −30 % por pasos de fauna [supuesto].', donde: 'En el punto exacto donde la avenida (nombre de OpenStreetMap) corta la línea entre los dos parches: marcas rojas ✕ en el mapa.', pts: (I) => { const L = I.atropellos && I.atropellos.lista || [], c = {}; for (const a of L) { const k = a.via || '?'; (c[k] = c[k] || { n: 0, a }).n++; } return Object.values(c).sort((x, y) => y.n - x.n).slice(0, 5).map(({ n, a }) => ({ x: a.x, z: a.z, n: `${a.via} · ${n} atropellos recientes (último: ${a.nombre}) · ${a.causa || ''}` })); } };
  FICHA['Basura sin recoger'] = FICHA['Basura sin recoger (t)']; FICHA['Comida en la zona peor servida'] = FICHA['Comida en la zona peor']; FICHA['Hogares en riesgo de desplazamiento'] = FICHA['Hogares en riesgo']; FICHA['Precio del suelo'] = FICHA['Precio del suelo (1 = hoy)']; FICHA['Tráfico'] = FICHA['Tráfico (100 = hoy)'];
  const ficha = document.createElement('div'); ficha.id = 'su-ficha'; document.body.appendChild(ficha);
  let gMed = null;
  function medir(P) { // aros azules en los lugares donde se mide
    const THREE = T3.THREE; if (!gMed) { gMed = new THREE.Group(); gMed.name = 'medicion'; T3.scene.add(gMed);
      RELOJ.alDibujar(() => { if (!gMed.children.length) return; const s = 1 + 0.15 * Math.sin(performance.now() / 300); gMed.children.forEach(o => { if (o.userData.aro) o.scale.set(s, 1, s); }); }); }
    while (gMed.children.length) { const o = gMed.children.pop(); o.material.dispose(); }
    const y = (T3.sueloY != null ? T3.sueloY : 0.3) + 2;
    for (const p of P || []) { const a = new THREE.Mesh(new THREE.RingGeometry(40, 50, 56).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x9ecbff, transparent: true, opacity: 0.95, depthTest: false, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
      a.position.set(p.x, y, p.z); a.renderOrder = 45; a.userData.aro = true; gMed.add(a);
      const d = new THREE.Mesh(new THREE.CircleGeometry(40, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x9ecbff, transparent: true, opacity: 0.18, depthTest: false, depthWrite: false, toneMapped: false })); d.position.copy(a.position); d.renderOrder = 44; gMed.add(d); }
  }
  function cerrarFicha() { ficha.classList.remove('on'); medir([]); graf.querySelectorAll('figure.sel').forEach(f => f.classList.remove('sel')); }
  function abrirFicha(nom) {
    const F = FICHA[nom], I = ultimo(); if (!F) return;
    graf.querySelectorAll('figure').forEach(f => f.classList.toggle('sel', f.dataset.f === nom));
    let P = []; try { P = I ? F.pts(I).filter(p => p && isFinite(p.x) && isFinite(p.z)) : []; } catch (e) { P = []; }
    ficha.innerHTML = `<h5>${escH(nom)}<small>${P.length ? P.length + (P.length > 1 ? ' lugares de medición' : ' lugar de medición') : 'toda Kennedy'}</small></h5>
      <div class="g"><div><b>Por qué se mide</b>${F.por}</div><div><b>Para qué</b>${F.para}</div><div><b>Cómo se calcula</b>${F.como}</div><div><b>Dónde se mide</b>${F.donde}${P.length ? '<br><span style="opacity:.75">' + P.slice(0, 3).map(p => '· ' + escH(p.n)).join('<br>') + '</span>' : ''}</div></div>
      <div class="bt">${P.length ? '<button type="button" class="ver">Ver dónde se mide</button>' : ''}<button type="button" class="x">Cerrar</button></div>`;
    ficha.classList.add('on'); medir(P);
    ficha.querySelector('.x').onclick = cerrarFicha;
    const bv = ficha.querySelector('.ver'); if (bv) bv.onclick = async () => { if (!window.KEN_OJO) return; const corriaF = !RELOJ.pausaSem; RELOJ.pausarAños(true); ficha.classList.remove('on'); /* la ficha se esconde para ver el lugar; los aros azules quedan */
      await window.KEN_OJO.ir({ x: P[0].x, z: P[0].z, titulo: 'Aquí se mide: ' + nom, texto: P[0].n + '. ' + F.como, color: '#9ecbff' });
      const bo = document.querySelector('#ojo-t button'); if (bo) bo.addEventListener('click', () => { if (corriaF && !R.go && !R.fin) { const p = document.querySelector('#lp-anos .play'); if (p && RELOJ.pausaSem) p.click(); } }, { once: true }); };
  }
  graf.addEventListener('click', (e) => { const f = e.target.closest('figure[data-f]'); if (!f) return; if (f.classList.contains('sel') && ficha.classList.contains('on')) cerrarFicha(); else abrirFicha(f.dataset.f); });
  /* ---------- TABLERO ECOCÉNTRICO (izquierda, debajo del reloj) ----------
     Una fila por indicador: nombre, valor ahora, curva de los 15 años (esta corrida en color; en «con propuesta» la pareja «sin
     propuesta» punteada), ⓘ = ficha (por qué, para qué, cómo y dónde se mide) y «Ver» = la cámara va al lugar donde se ve. */
  const ultimaMuerte = (I) => { const L = (I.muertes && I.muertes.lista) || (I.atropellos && I.atropellos.lista) || []; return L.length ? L[L.length - 1] : null; };
  const TAB = [
    { k: 'abejas', n: '🐝 Abejas (especie clave)', u: ' lugares', v: I => I.abeja ? I.abeja.parches : null, mejor: 1,
      ver: I => { const L = I.abeja && I.abeja.lugares; if (L && L.length) return { x: L[0].x, z: L[0].z, t: 'Aquí están las abejas', tx: `${I.abeja.parches} lugares ocupados · ${I.abeja.interacciones} flores polinizadas` }; const P = I.verde && I.verde.parches.find(p => p.tipo === 'nuevo'); return P ? { x: P.x, z: P.z, t: 'Huertas donde llegan las abejas', tx: P.n } : null; } },
    { k: 'corredores', n: 'Continuidad de corredores', u: ' %', v: I => I.verde && I.verde.resumen ? I.verde.resumen.conectividad * 100 : null, mejor: 1,
      ver: I => { const C = I.verde && I.verde.conexiones && I.verde.conexiones[0]; return C ? { x: (C.x1 + C.x2) / 2, z: (C.z1 + C.z2) / 2, t: 'Corredor ecológico', tx: `${I.verde.resumen.nConectados} de ${I.verde.resumen.nParches} parches conectados entre sí` } : null; } },
    { k: 'parches', n: 'Parches ecológicos nuevos', u: '', v: I => I.verde && I.verde.resumen ? (I.verde.resumen.nNuevos || 0) + (I.verde.resumen.nLiberados || 0) : null, mejor: 1,
      ver: I => { const P = I.verde && (I.verde.parches.find(p => p.tipo === 'liberado') || I.verde.parches.find(p => p.tipo === 'nuevo')); return P ? { x: P.x, z: P.z, t: P.tipo === 'liberado' ? 'Espacio liberado que se vuelve verde' : 'Parche nuevo', tx: P.n } : null; } },
    { k: 'muertes', n: 'Muertes de fauna', u: '', v: I => I.muertes ? I.muertes.total : I.atropellos && I.atropellos.total, mejor: -1,
      ver: I => { const m = ultimaMuerte(I); return m ? { x: m.x, z: m.z, t: `Murió: ${m.nombre || m.especie}`, tx: m.detalle || m.causa || '', animal: m.nombre || m.especie } : null; } },
    { k: 'ruido', n: 'Bienestar de las aves (ruido)', u: ' %', v: I => I.avesRuido ? I.avesRuido.bienestar * 100 : null, mejor: 1,
      ver: I => { const rc = document.getElementById('rc-btn'); if (rc && !rc.classList.contains('on')) rc.click(); const P = I.avesRuido && I.avesRuido.porParche && I.avesRuido.porParche[0]; return P ? { x: P.x, z: P.z, t: `Aves con ${Math.round(P.db)} dB`, tx: 'Con mucho ruido las aves se alejan y su bienestar baja.' } : null; } },
    { k: 'ciclos', n: 'Ciclos biogeoquímicos', u: ' %', v: I => I.ciclos ? I.ciclos.indice * 100 : (I.eco ? I.eco.abioticos * 100 : null), mejor: 1, ver: null },
    { k: 'residuos', n: 'Residuos sin recoger', u: ' t', v: I => I.basura ? I.basura.acumulada : null, mejor: -1,
      ver: I => { const P = I.basura && I.basura.puntos && I.basura.puntos.slice().sort((a, b) => b.acumulada - a.acumulada)[0]; return P ? { x: P.x, z: P.z, t: 'Aquí se acumula la basura', tx: `${Math.round(P.acumulada)} t` } : null; } },
    { k: 'biodiv', n: 'Biodiversidad (Shannon)', u: '', v: I => I.biodiversidad ? I.biodiversidad.shannon : (I.eco ? I.eco.biodiversidad * 100 : null), mejor: 1, ver: null }
  ];
  Object.assign(FICHA, {
    '🐝 Abejas (especie clave)': { por: 'La abeja es especie clave: poliniza las flores de huertas y parques; si ella está, el ciclo de la flora sigue.', para: 'Ver si la propuesta (huertas, techos, corredores) le da más lugares y cómo se expande.', como: 'Parches donde la abeja está presente esa semana (modelo de ocupación) y flores que poliniza.', donde: 'En las huertas, parques y humedales donde aparece.', pts: I => (I.abeja && I.abeja.lugares || []).slice(0, 8).map(p => ({ x: p.x, z: p.z, n: p.n || 'Abejas' })) },
    'Continuidad de corredores': { por: 'Un parche aislado no sirve: la fauna necesita moverse entre humedales, parques y huertas.', para: 'Medir si la ciudad se reconecta como red ecológica.', como: 'Parches en el grupo conectado más grande (enlaces con supervivencia al cruzar las vías ≥ 0,5) ÷ todos los parches.', donde: 'En las franjas verdes entre parches.', pts: I => (I.verde && I.verde.conexiones || []).slice(0, 6).map(c => ({ x: (c.x1 + c.x2) / 2, z: (c.z1 + c.z2) / 2, n: c.via ? 'cruza ' + c.via : 'corredor' })) },
    'Parches ecológicos nuevos': { por: 'Para que las aves tengan dónde estar hace falta crear y liberar espacio verde.', para: 'Contar cuánto hábitat nuevo genera la propuesta.', como: 'Módulos de huerta que se activan + bodegas de Corabastos liberadas que se vuelven verde (maduran en 3 años).', donde: 'En las manchas verdes lima (nuevos) y tierra→verde (liberados).', pts: I => (I.verde && I.verde.parches || []).filter(p => p.tipo === 'nuevo' || p.tipo === 'liberado').slice(0, 8).map(p => ({ x: p.x, z: p.z, n: p.n })) },
    'Muertes de fauna': { por: 'La mayoría de los animales que mueren en la ciudad se estrellan: contra vidrios y fachadas o contra los carros.', para: 'Ver dónde ocurre y qué la causa, y si la propuesta la reduce.', como: 'Animales que cruzan entre parches; mueren con una probabilidad según las fachadas de vidrio y los vehículos al día que cruzan.', donde: 'En el punto exacto de cada muerte (botón Ver: la más reciente).', pts: I => ((I.muertes && I.muertes.lista) || (I.atropellos && I.atropellos.lista) || []).slice(-6).map(m => ({ x: m.x, z: m.z, n: (m.nombre || '') + ' · ' + (m.detalle || m.causa || '') })) },
    'Bienestar de las aves (ruido)': { por: 'Con mucho ruido las aves no se oyen para cantar, se estresan y se alejan.', para: 'Medir cómo el tráfico afecta el bienestar de las aves.', como: 'Ruido de cada carro sumado en cada parche; bienestar 100 % bajo 50 dB y 0 % a 70 dB.', donde: 'En los parches donde viven las aves (capa de ruido).', pts: I => (I.avesRuido && I.avesRuido.porParche || []).slice(0, 6).map(p => ({ x: p.x, z: p.z, n: Math.round(p.db) + ' dB' })) },
    'Ciclos biogeoquímicos': { por: 'Un territorio vivo mantiene sus ciclos: el carbono que capturan los árboles, los nutrientes que vuelven al suelo y el agua que se infiltra.', para: 'Ver si la propuesta cierra los ciclos dentro de Kennedy.', como: 'Promedio de carbono capturado, nutrientes devueltos con el compost, agua de lluvia infiltrada y suelo vivo, frente al año 1.', donde: 'En las huertas, parques, humedales y Estaciones Circulares.', pts: I => [] },
    'Residuos sin recoger': FICHA['Basura sin recoger (t)'] || FICHA['Basura sin recoger'],
    'Biodiversidad (Shannon)': { por: 'No basta contar especies: importa que estén repartidas y cumplan funciones distintas.', para: 'Medir la diversidad de la fauna de Kennedy.', como: 'Índice de Shannon H\' sobre la ocupación de cada especie (más alto = más especies y más repartidas).', donde: 'En todos los parches de Kennedy.', pts: I => [] }
  });
  const tab = document.createElement('div'); tab.id = 'su-tab';
  const styleSeguimiento=document.createElement('style');
  styleSeguimiento.textContent='#st-panel h3{font:500 18px system-ui;color:#f2f4ec}#st-panel h4{font:600 12px system-ui;color:#d5ff60;margin:16px 0 4px}#st-panel summary{border-bottom:1px solid #ffffff20;padding:8px 0}#st-panel summary b{font:500 10px monospace;color:#dce7bb}#st-panel svg{width:100%;display:block;background:#111a1580;border-radius:9px}#st-panel svg text{fill:#e2e9df;font:8px system-ui}#st-panel p{margin:6px 0}#st-panel button{background:transparent;color:#d4e7a9;border:0;text-decoration:underline;cursor:pointer}#st-panel .st-row{display:grid;grid-template-columns:1fr auto;gap:3px;padding:4px 0}#st-panel meter{grid-column:1/-1;width:100%;height:6px}';
  document.head.append(styleSeguimiento);
  const panelEvaluacion = crearPanelEvaluacion({ T3 });
  /* el tablero estadístico en tiempo real vive en la columna derecha, aside#lp-tablero (panel_datos.js + graficas_vivas.js) */
  import('./panel_indicadores.js?v=3').then(m => m.iniciarPanelIndicadores({ R, getM: () => M, getFIN: () => FIN })).catch(e => console.warn('panel de indicadores:', e)); /* reemplaza a panel_datos.js (tablero viejo por sistemas) */
  /* gráfica de cada indicador (como las de antes): área bajo la curva de esta corrida, la «sin propuesta» punteada, líneas de los años
     5 y 10, punto blanco en el valor de ahora; eje x = los 15 años */
  function chispaT(a, b, col) { const W = 268, H = 64, n = Math.ceil(FIN / 4), all = a.concat(b).filter(v => v != null); if (!all.length) return '';
    let mn = Math.min(...all), mx = Math.max(...all); if (mx - mn < 1e-6) { mx += 1; mn -= 1; } const pad = (mx - mn) * 0.15; mn -= pad; mx += pad;
    const X = i => (i / (n - 1) * W).toFixed(1), Y = v => (H - 3 - (v - mn) / (mx - mn) * (H - 6)).toFixed(1);
    const P = arr => arr.map((v, i) => v == null ? null : X(i) + ',' + Y(v)).filter(Boolean).join(' ');
    const ia = a.length - 1 - [...a].reverse().findIndex(v => v != null), ult = a[ia];
    return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${[5, 10].map(an => `<line x1="${X(an * 52 / 4)}" x2="${X(an * 52 / 4)}" y1="0" y2="${H}" stroke="rgba(255,255,255,.08)"/>`).join('')}<polygon points="0,${H} ${P(a)} ${X(ia)},${H}" fill="${col}" opacity=".16"/>${b.length ? `<polyline points="${P(b)}" fill="none" stroke="rgba(220,224,230,.6)" stroke-width="1.5" stroke-dasharray="4 3" vector-effect="non-scaling-stroke"/>` : ''}<polyline points="${P(a)}" fill="none" stroke="${col}" stroke-width="2.4" vector-effect="non-scaling-stroke"/>${ult != null ? `<circle cx="${X(ia)}" cy="${Y(ult)}" r="3.2" fill="#fff"/>` : ''}</svg>`; }
  function chispaViejo(a, b, col) { const W = 200, H = 40, n = Math.ceil(FIN / 4), all = a.concat(b).filter(v => v != null); if (!all.length) return '';
    let mn = Math.min(...all), mx = Math.max(...all); if (mx - mn < 1e-6) { mx += 1; mn -= 1; }
    const P = arr => arr.map((v, i) => v == null ? null : (i / (n - 1) * W).toFixed(1) + ',' + (H - 2 - (v - mn) / (mx - mn) * (H - 4)).toFixed(1)).filter(Boolean).join(' ');
    return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${b.length ? `<polyline points="${P(b)}" fill="none" stroke="rgba(220,224,230,.55)" stroke-width="1.3" stroke-dasharray="3 2" vector-effect="non-scaling-stroke"/>` : ''}<polyline points="${P(a)}" fill="none" stroke="${col}" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>`; }
  /* INDICADORES legibles: por fila el nombre, el valor de ahora y en palabras si MEJORA o EMPEORA frente al año 1; debajo una curva de los
     15 años sin deformar (la línea punteada es el valor del año 1: arriba o abajo de ella se lee de un vistazo; en «con propuesta» la
     curva gris es «sin propuesta»). Color de la curva: verde mejora, rojo empeora, gris igual. ⓘ = ficha, Ver = la cámara va al lugar. */
  const limpiarNombre = (n) => String(n).replace(/^[^\p{L}\d]+/u, '').replace(/\s*\(.*\)\s*$/, '');
  function curva(a, b, v0, col) {
    const W = 280, H = 44, n = Math.ceil(FIN / 4), vals = a.concat(b, v0 != null ? [v0] : []).filter(v => v != null); if (vals.length < 2) return '';
    let mn = Math.min(...vals), mx = Math.max(...vals); if (mx - mn < 1e-6) { mx += 1; mn -= 1; } const pad = (mx - mn) * 0.18; mn -= pad; mx += pad;
    const X = i => (i / (n - 1) * W).toFixed(1), Y = v => (H - (v - mn) / (mx - mn) * H).toFixed(1);
    const P = arr => arr.map((v, i) => v == null ? null : X(i) + ',' + Y(v)).filter(Boolean).join(' ');
    const ia = a.length - 1 - [...a].reverse().findIndex(v => v != null), ult = a[ia];
    return `<svg class="tb2-svg" viewBox="0 0 ${W} ${H}" width="100%">`
      + (v0 != null ? `<line x1="0" x2="${W}" y1="${Y(v0)}" y2="${Y(v0)}" stroke="rgba(226,243,255,.35)" stroke-dasharray="3 3"/>` : '')
      + (b.length ? `<polyline points="${P(b)}" fill="none" stroke="rgba(200,210,220,.55)" stroke-width="1.4"/>` : '')
      + `<polyline points="${P(a)}" fill="none" stroke="${col}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`
      + (ult != null ? `<circle cx="${X(ia)}" cy="${Y(ult)}" r="3" fill="${col}" stroke="#08101a" stroke-width="1.5"/>` : '') + '</svg>';
  }
  const CORTO = { abejas: 'Abejas', corredores: 'Corredores', parches: 'Parches nuevos', muertes: 'Muertes de fauna', ruido: 'Bienestar de aves', ciclos: 'Ciclos (agua, suelo)', residuos: 'Basura sin recoger', biodiv: 'Biodiversidad' };
  const CAUSA_N = { colision: 'se estrellan', atropello: 'atropellos', ruido: 'ruido', hambre_habitat: 'sin hábitat' }, CAUSA_C = { colision: '#ff9d97', atropello: '#f2c680', ruido: '#d4bcf5', hambre_habitat: '#8ad9e5' };
  function pintarTablero() {
    const I = ultimo();
    if (!I || !R.sim) { tab.innerHTML = ''; panelEvaluacion.clear(); return; }
    if (!tab.isConnected) return; /* #su-tab ya no se muestra (los datos están en #lp-datos): no se gasta en dibujarlo */
    if (!tab.querySelector('#ee-panel')) tab.innerHTML = '<div id="st-panel"></div><details><summary>Detalle de la evaluación ecológica</summary><div id="ee-panel"></div></details>';
    const B = (R.ecoBase || R.base || []).filter(h => h.sem <= I.sem);
    seguimiento(tab.querySelector('#st-panel'),I,R.hist,B,!!R.def?.propuesta,T3);
    panelEvaluacion.render(tab.querySelector('#ee-panel'), I, R.hist, B, !!R.def?.propuesta, R.s);
  }
  function pintarTableroViejo() {
    const I = ultimo(); if (!I || !R.sim) { tab.innerHTML = ''; return; }
    const d = R.def || {}, H = R.hist, B = d.propuesta && R.base ? R.base.slice(0, H.length) : null, col = d.propuesta ? '#8ee6a8' : '#ffcf7a';
    const fv = (v, u) => v == null ? '—' : (Math.abs(v) >= 100 ? Math.round(v).toLocaleString('es-CO') : (Math.round(v * 10) / 10).toLocaleString('es-CO')) + (u || '');
    const filas = TAB.map(T => { let v = null; try { v = T.v(I); } catch (e) { /* */ } if (v == null || !isFinite(v)) return '';
      const a = serie(H, T.v, 4), b = B ? serie(B, T.v, 4) : [], vb = b.filter(x => x != null).pop(), v0 = a.length > 13 ? a[13] : null; /* cambio frente al año 1 (semana 52: el modelo ya se asentó), no frente a la primera semana */
      const dl = v0 != null && v0 !== 0 ? (v - v0) / Math.abs(v0) * 100 : 0, bien = dl * T.mejor > 0.5, mal = dl * T.mejor < -0.5;
      const extra = T.k === 'muertes' && I.muertes && I.muertes.porCausa ? `<div class="su-tc">${Object.entries(I.muertes.porCausa).filter(([, c]) => c > 0).map(([k, c]) => `<i style="flex:${c}" class="c-${k}" title="${k}: ${c}"></i>`).join('')}</div><small class="su-tl">${Object.entries(I.muertes.porCausa).filter(([, c]) => c > 0).map(([k, c]) => `${{ colision: 'se estrellan', atropello: 'atropellos', ruido: 'ruido', hambre_habitat: 'sin hábitat' }[k] || k} ${c}`).join(' · ')}</small>` : '';
      return `<figure class="su-tf" data-k="${T.k}"><div class="su-th"><span>${T.n}</span><b class="${bien ? 'bien' : mal ? 'mal' : ''}">${fv(v, T.u)}</b>${v0 != null && Math.abs(dl) >= 0.5 ? `<em class="${bien ? 'bien' : mal ? 'mal' : ''}">${dl > 0 ? '▲' : '▼'} ${Math.abs(dl) < 10 ? Math.abs(dl).toFixed(1) : Math.round(Math.abs(dl))} %</em>` : ''}</div>
        ${chispaT(a, b, col)}<div class="su-ej"><span>año 1</span><span>5</span><span>10</span><span>15</span></div>
        <div class="su-tp">${B && vb != null ? `<small class="su-ts">sin propuesta: <b>${fv(vb, T.u)}</b></small>` : '<small class="su-ts">desde el año 1</small>'}<div class="su-tb"><button type="button" class="i" title="Por qué, cómo y dónde se mide">ⓘ</button>${T.ver ? '<button type="button" class="v">Ver dónde</button>' : ''}</div></div>${extra}</figure>`; }).join('');
    tab.innerHTML = `<h5 class="su-tt">Modelo ecocéntrico · en vivo</h5><div id="su-eco"></div>${filas}`;
    tab.querySelectorAll('.su-tf').forEach(el => { const T = TAB.find(x => x.k === el.dataset.k);
      el.querySelector('.i').onclick = () => abrirFicha(T.n);
      const bv = el.querySelector('.v'); if (bv) bv.onclick = async () => { const U = ultimo(); const p = U && T.ver(U); if (!p || !window.KEN_OJO) return; const corriaT = !RELOJ.pausaSem; RELOJ.pausarAños(true);
        await window.KEN_OJO.ir({ x: p.x, z: p.z, titulo: p.t, texto: p.tx, color: T.mejor > 0 ? '#8ee6a8' : '#ff8a80', rapido: true, cenital: true, x0: T.k === 'muertes', animal: p.animal }); /* igual que los avisos: rápido, cenital y X en el piso donde murió */
        const bo = document.querySelector('#ojo-t button'); if (bo) bo.addEventListener('click', () => { if (corriaT && !R.go && !R.fin) { const pl = document.querySelector('#lp-anos .play'); if (pl && RELOJ.pausaSem) pl.click(); } }, { once: true }); }; });
    pintarEco();
  }
  function serie(H, f, paso) { const out = []; for (let i = 0; i < H.length; i += paso) { let v = null; try { v = f(H[i]); } catch (e) { /* */ } out.push(v == null || !isFinite(v) ? null : v); } return out; }
  function pintarGraficas() {
    const d = R.def || {}, S = SERIES[d.par], H = R.hist; if (!S || !H.length) { graf.classList.remove('on'); return; }
    const B = d.propuesta && R.base ? R.base.slice(0, H.length) : null, W = 220, Hh = 74, paso = 4, nTot = Math.ceil(FIN / paso);
    graf.innerHTML = S.map(([nom, f, u, lim]) => {
      const a = serie(H, f, paso), bb = B ? serie(B, f, paso) : [], todos = a.concat(bb, lim != null ? [lim] : []).filter(v => v != null);
      if (!todos.length) return '';
      let mn = Math.min(...todos), mx = Math.max(...todos); if (mx - mn < 1e-6) { mx += 1; mn -= 1; } const pad = (mx - mn) * 0.12; mn -= pad; mx += pad;
      const X = i => (i / Math.max(1, nTot - 1) * W).toFixed(1), Y = v => (Hh - 4 - (v - mn) / (mx - mn) * (Hh - 8)).toFixed(1);
      const pts = (arr) => arr.map((v, i) => v == null ? null : X(i) + ',' + Y(v)).filter(Boolean).join(' ');
      const ult = a.filter(v => v != null).pop(), ultB = bb.filter(v => v != null).pop();
      const fmtv = v => v == null ? '—' : (Math.abs(v) >= 100 ? Math.round(v).toLocaleString('es-CO') : (Math.round(v * 10) / 10).toLocaleString('es-CO')) + (u === '%' ? ' %' : '');
      const xs = [5, 10].map(an => `<line x1="${X(an * 52 / paso)}" x2="${X(an * 52 / paso)}" y1="0" y2="${Hh}" stroke="rgba(255,255,255,.07)"/>`).join('');
      const ia = a.length - 1 - [...a].reverse().findIndex(v => v != null), area = a.some(v => v != null) ? `<polygon points="0,${Hh} ${pts(a)} ${X(ia)},${Hh}" fill="${d.propuesta ? "#8ee6a8" : "#ffcf7a"}" opacity=".13"/>` : "";
      return `<figure data-f="${nom}" title="Clic: dónde, cómo y para qué se mide"><figcaption><span>${nom}</span><b>${fmtv(ult)}</b>${B && ultB != null ? `<i>sin: ${fmtv(ultB)}${B.length < H.length ? '*' : ''}</i>` : ''}</figcaption>
        <svg viewBox="0 0 ${W} ${Hh}" preserveAspectRatio="none">${xs}${lim != null ? `<line x1="0" x2="${W}" y1="${Y(lim)}" y2="${Y(lim)}" stroke="#ff8a80" stroke-width="1" stroke-dasharray="2 3" vector-effect="non-scaling-stroke"/>` : ''}
        ${B ? `<polyline points="${pts(bb)}" fill="none" stroke="rgba(220,224,230,.6)" stroke-width="1.6" stroke-dasharray="4 3" vector-effect="non-scaling-stroke"/>` : ''}
        ${area}<polyline points="${pts(a)}" fill="none" stroke="${d.propuesta ? '#8ee6a8' : '#ffcf7a'}" stroke-width="2.4" vector-effect="non-scaling-stroke"/>${ult != null ? `<circle cx="${X(ia)}" cy="${Y(ult)}" r="3" fill="#fff"/>` : ''}</svg>
        <div class="ej"><span>año 1</span><span>5</span><span>10</span><span>15</span></div>${lim != null ? `<em class="lim">--- límite ${fmtv(lim)}</em>` : ''}<u>ⓘ dónde y cómo se mide${B && B.length < H.length ? ` · *sin propuesta: game over año ${Math.floor(B.length / 52) + 1}` : ''}</u></figure>`; }).join('');
    graf.classList.add('on');
  }
  function pintarHistoria() {
    const d = R.def || {}, P = d.par, C = CADENA[P], I = ultimo(); if (!C || !I) { hist.classList.remove('on'); return; }
    const I1 = R.hist[Math.min(R.hist.length - 1, 51)] || I, B = R.base ? R.base[Math.min(R.base.length - 1, R.hist.length - 1)] : null, B1 = R.base ? R.base[51] || R.base[0] : null;
    const otra = d.propuesta ? 'Sin propuesta' : null; // la «sin» no tiene base calculada: se muestra sola
    const filas = C.map(([n, f], k) => { let a = '—', b = ''; try { a = f(I, I1); } catch (e) { /* sin dato */ } if (B && B1) { try { b = f(B, B1); } catch (e) { /* */ } }
      return `<li><span class="n">${k ? '↓ ' : ''}${n}</span><b>${a}</b>${otra && b ? `<i>${b}</i>` : ''}</li>`; }).join('');
    hist.innerHTML = `<h5>¿Qué está pasando? · ${d.parN || ''}</h5><p>${d.prueba || ''}</p>${otra ? '<div class="cab"><span></span><b>Con propuesta</b><i>Sin propuesta</i></div>' : `<div class="cab"><span></span><b>${d.propuesta ? 'Con propuesta' : 'Sin propuesta'}</b></div>`}<ul>${filas}</ul>`;
    hist.classList.add('on');
  }
  function aplicarHistoria() {
    const P = R.def && R.def.par, H = HISTORIA[P]; if (!H) return;
    for (const nm of TODAS) { const g = T3.scene.getObjectByName(nm); if (!g) continue; const si = H.capas.includes(nm) || (nm === 'indicadores' && R.ind); if (!si && g.visible) g.visible = false; }
    for (const e of ['bas', 'pares']) { const el = document.getElementById(e + '-etq'); if (el) el.style.display = H.etq.includes(e) ? '' : 'none'; }
  }
  setInterval(() => { if (R.sim && !viendo) aplicarHistoria(); }, 400);
  /* BLANCO Y NEGRO DE LA HISTORIA: al prender una simulación el territorio se va volviendo blanco y negro de a poco (5 s) y quedan en
     color solo las capas de su historia (y el ruido o las especies si son parte de ella). «Ver» y «Mira en el territorio» lo cambian un
     rato y al cerrar vuelve a este. */
  /* OSCURECER SOLO LA CIUDAD (pedido de la autora): en vez de oscurecer toda la pantalla, se oscurecen de a poco los edificios (la malla
     de Google y los edificios propios); las capas, el ruido, los indicadores y los animales quedan como están. KEN_FOCO se reemplaza por
     este atenuador mientras está la vista limpia, así «Ver», «Mira en el territorio» y el game over también usan esto. */
  let kCiu = 1, metaCiu = 1, durCiu = 5, tCiu = 0, tRec = 0; const matsCiu = new Set();
  function recolectar() { matsCiu.clear(); const add = (o) => o.traverse(x => { const ms = x.material ? (Array.isArray(x.material) ? x.material : [x.material]) : []; for (const m of ms) if (m && m.color) matsCiu.add(m); });
    const tg = T3.tiles && T3.tiles.group; if (tg) add(tg); for (const e of (T3.edificios || [])) if (e && e.mesh) add(e.mesh); }
  function aplicarCiu() { for (const m of matsCiu) { if (!m.userData._c0) m.userData._c0 = m.color.clone(); m.color.copy(m.userData._c0).multiplyScalar(kCiu); } }
  RELOJ.alDibujar(() => { const ahora = performance.now(), dt = tCiu ? Math.min(0.1, (ahora - tCiu) / 1000) : 0; tCiu = ahora;
    if (kCiu === metaCiu && kCiu === 1) return;
    if (ahora - tRec > 600) { tRec = ahora; recolectar(); } // la malla de Google carga teselas nuevas: se recogen cada 0,6 s
    const paso = dt / Math.max(0.2, durCiu) * 0.55; kCiu = kCiu > metaCiu ? Math.max(metaCiu, kCiu - paso) : Math.min(metaCiu, kCiu + paso); aplicarCiu(); });
  const ciudad = (on, dur = 1) => { metaCiu = on ? 0.85 : 1; durCiu = dur; };
  const FOCO_CIU = { on: (c, o) => { ciudad(true, o && o.dur ? o.dur : 1); return Promise.resolve(true); }, off: (o) => ciudad(false, o && o.dur ? o.dur : 1), get activo() { return metaCiu < 1; }, get nivel() { return (1 - kCiu) / 0.55; } };
  setInterval(() => { if (window.KEN_FOCO !== FOCO_CIU) window.KEN_FOCO = FOCO_CIU; }, 500);
  /* la sintaxis espacial (líneas de colores de integración/elección) empieza y se mantiene apagada al escoger una simulación: otros
     módulos la prendían solos al cambiar de escenario; se puede prender a mano en el panel izquierdo */
  function apagarSintaxis() { const b = document.querySelector('#gs-capa button[data-c=""]'); if (b && !b.classList.contains('on')) b.click(); }
  setTimeout(apagarSintaxis, 3000);
  function focoHistoria(dur = 5) { if (SIN_CAPAS) return; const H = HISTORIA[R.def && R.def.par]; if (!H || !window.KEN_FOCO) return;
    window.KEN_FOCO.on([...H.capas, ...(H.ruido ? ['ruido'] : []), ...(H.capas.includes('biotica') ? ['especies'] : []), 'indicadores', ...(R.def && !R.def.propuesta ? ['plan_parcial', 'bavaria'] : ['bavaria', 'bavaria_distrito'])], { dur }); } // sin propuesta: Bavaria y su plan parcial también en color

  /* ---------- MIRA EN EL TERRITORIO: botones que vuelan (Ojo de Dios) a lo que importa en cada simulación y lo dejan en color ---------- */
  const centroDe = (nombre) => { const g = T3.scene.getObjectByName(nombre); if (!g || !g.visible) return null; const b = new T3.THREE.Box3().setFromObject(g); if (b.isEmpty()) return null; const c = b.getCenter(new T3.THREE.Vector3()); return [c.x, c.z]; };
  function lugares() {
    const b = (R.def && R.def.base) || 'A', L = [], I = ultimo() || {};
    { const c = capaPar(); const NOM = { abasto: 'Corabastos y mercados (tope)', residuos: 'Estaciones y residuos', biodiversidad: 'Parche, corredores y refugios', suelo: 'Usos del suelo y presión', gobernanza: 'Barrios, asambleas y recursos' };
      if (c) L.push({ n: NOM[c] || c, donde: c === 'abasto' ? 'abasto_cont' : c, alto: true, capa: c === 'abasto' ? ['abasto_cont', 'especies', 'basura', 'degradacion', 'trafico'] : [c], t: (R.def && R.def.parN) || NOM[c], tx: (R.def && R.def.prueba) || '' }); }
    const [cx, cz] = T3.lw ? T3.lw(6330, 2170) : [989, 992];
    L.push({ n: 'Basura en Corabastos', x: cx, z: cz, capa: ['basura'], t: 'Basura alrededor de Corabastos', tx: I.basura ? `${Math.round(I.basura.total_t_dia)} t/día en Kennedy; ${Math.round((I.sinRecoger || 0) * 100)} % no se recoge.` : '' });
    L.push({ n: 'Humedal El Burro', x: 2095, z: -109, capa: ['degradacion', 'basura', 'especies'], t: 'Humedal El Burro', tx: I.humedalFuncional != null ? `Los humedales funcionan al ${Math.round(I.humedalFuncional)} % de hoy.` : '' });
    { const E = I.metro && I.metro.estaciones && I.metro.estaciones.find(e => /Kennedy/.test(e.n)) || (I.metro && I.metro.estaciones && I.metro.estaciones[0]);
      const q = E ? { x: E.x, z: E.z } : (window.KEN_METRO && window.KEN_METRO.punto ? window.KEN_METRO.punto(window.KEN_METRO.largo * 0.5) : null);
      if (q) L.push({ n: 'Metro Línea 1', x: q.x != null ? q.x : q[0], z: q.z != null ? q.z : q[1], capa: ['metro', 'trafico'], t: 'Metro Línea 1' + (E ? ' · estación ' + E.n : ''), tx: I.metro && I.metro.fase === 'opera' ? `Ya opera: ${Math.round((I.metro.reduccion || 0) * 100)} % menos carros junto al corredor${E && E.peatonesDia ? '; ' + fmt(E.peatonesDia) + ' personas caminan al día hacia la estación' : ''}.` : 'En obra: empieza a operar en el año 3 (2028).' }); }
    if (I.especulacion && I.especulacion.zonas && I.especulacion.zonas.length) { const Z = I.especulacion.zonas.reduce((a, b) => (b.indice > a.indice ? b : a)); L.push({ n: 'Especulación del suelo', x: Z.x, z: Z.z, capa: ['metro'], t: 'Donde más sube el suelo', tx: `El suelo sube ×${Z.indice.toFixed(2)} aquí; ${fmt(I.especulacion.hogaresRiesgo)} hogares en riesgo de desplazamiento en Kennedy.` }); }
    if (I.predio || (R.def && R.def.par != null && !R.def.propuesta)) L.push({ n: 'Plan parcial Bavaria', x: 4058, z: 214, capa: ['predio', 'ruido', 'trafico'], t: 'Plan parcial Bavaria', tx: I.predio ? `${fmt(I.predio.habitantes)} habitantes nuevos; ${fmt(I.predio.vehiculosDia)} vehículos/día; ruido ${(I.predio.ruidoDb - I.predio.ruidoDb0).toFixed(1)} dB más.` : '' });
    if (b === 'B' || b === 'C' || R.sim === 12) L.push({ n: 'Bavaria Común', x: 3950, z: 180, capa: ['caminos', 'especies'], t: 'Bavaria Común · instituto', tx: 'Pasajes nuevos que abren el predio al barrio.' });
    if (R.def && R.def.par === 2) L.push({ n: 'Vía cerrada', donde: 'cierre', capa: ['cierre', 'trafico', 'ruido'], t: 'Cierre de la Av. de las Américas', tx: 'El tráfico se desvía por las calles vecinas (en rojo).' });
    return L;
  }
  async function irLugar(l, boton) {
    if (!l) return; let x = l.x, z = l.z; if (l.donde) { const c = centroDe(l.donde); if (!c) return; [x, z] = c; }
    const corria = !RELOJ.pausaSem; RELOJ.pausarAños(true);
    if (window.KEN_FOCO) window.KEN_FOCO.on(l.capa);
    if (l.capa.includes('ruido')) { const rb = document.getElementById('rc-btn'); if (rb && !rb.classList.contains('on')) rb.click(); }
    if (l.alto) { // capa que cubre todo Kennedy: vista alta de toda el área (no el Ojo de Dios, que se acerca demasiado)
      const g = T3.scene.getObjectByName(l.donde), bx = g ? new T3.THREE.Box3().setFromObject(g) : null, s = bx && !bx.isEmpty() ? bx.getSize(new T3.THREE.Vector3()) : { x: 3000, z: 3000 }, D = Math.min(4200, Math.max(1600, Math.max(s.x, s.z) * 0.95));
      T3.anim = { t: 0, dur: 2.2, p0: T3.camera.position.clone(), c0: T3.orbit.target.clone(), p1: new T3.THREE.Vector3(x + D * 0.12, D * 0.82, z + D * 0.5), c1: new T3.THREE.Vector3(x, 0, z) };
      const c = document.createElement('div'); c.className = 'su-av on'; c.style.cssText = 'position:fixed;left:296px;bottom:92px;z-index:46;max-width:360px'; c.innerHTML = `<div><small>${l.t}</small><b>${l.tx}</b></div><div class="bt"><button type="button">Cerrar</button></div>`;
      document.body.appendChild(c); c.querySelector('button').onclick = () => { c.remove(); focoHistoria(1); if (corria && !R.go && !R.fin) { const p = document.querySelector('#lp-anos .play'); if (p && RELOJ.pausaSem) p.click(); } };
      return;
    }
    if (window.KEN_OJO) { await window.KEN_OJO.ir({ x, z, titulo: l.t, texto: l.tx, color: '#ffcf7a' });
      const bo = document.querySelector('#ojo-t button'); if (bo) bo.addEventListener('click', () => { focoHistoria(1); if (corria && !R.go && !R.fin) { const p = document.querySelector('#lp-anos .play'); if (p && RELOJ.pausaSem) p.click(); } }, { once: true }); }
  }

  /* ---------- GAME OVER ---------- */
  function gameOver(g) {
    R.go = g; RELOJ.pausarAños(true);
    if (window.KEN_FOCO) window.KEN_FOCO.on([g.regla === 'ruido' ? 'ruido' : g.regla === 'trafico' ? 'trafico' : 'especies', 'cierre', 'predio', 'basura', 'degradacion', 'abasto', 'residuos', 'biodiversidad', 'suelo', 'gobernanza']); // la causa queda en color: el cierre, el predio o la basura
    abrirInforme(); // la pantalla de resultados a pantalla completa (tono coral) es la pantalla de game over
  }

  /* ---------- INFORME ---------- */
  /* informe nuevo (data3d/informe.js): veredicto «¿Fue sostenible?», antes → después, estado actual vs esta simulación, gráficas por año,
     red de interacciones en bola y lo que pasó año por año. Si no carga, queda el informe anterior (abrirInformeViejo). */
  async function abrirInforme() {
    const H = R.hist, corrida=R.s; if (!H.length) return;
    try { const { abrirInforme2 } = await import('./informe.js?v=7');
      if(corrida!==R.s || H!==R.hist)return;
      // cadena causa → efecto del par con los valores finales (frente al año 1)
      const I = H[H.length - 1], I1 = H[Math.min(H.length - 1, 51)];
      const cadena = (CADENA[R.def && R.def.par] || []).map(([t, f]) => { let v = '—'; try { v = f(I, I1); } catch (e) { /* dato que falta en esta corrida */ } return { t, v: v == null || v === '' ? '—' : String(v) }; });
      const reiniciar = () => { cerrarInforme(); const b = document.querySelector('#lp-anos .rei'); if (b) b.click(); else { RELOJ.reiniciarModelo(); RELOJ.pausarAños(true); dispatchEvent(new Event('lp-reinicio')); } };
      inf.className = 'i2-dlg ' + (R.go ? 'go' : '');
      const res = abrirInforme2({ cont: inf.querySelector('.caja'), sim: R.sim, def: R.def || {}, hist: H, base: parejaSin() != null ? R.base : null, reglas: (M && M.REGLAS) || [], parametros:{...R.valores}, definiciones:M.SIMS, go: R.go, eventos: R.eventos, extinciones: R.extinciones, ind: IND, semilla: SEMILLA, cadena, onCerrar: cerrarInforme, onReiniciar: reiniciar });
      if (res && res.veredicto === 'Sí') inf.classList.add('ok');
      if (!inf.open) inf.showModal(); inf.classList.add('on'); inf.querySelector('.caja').scrollTop = 0; return;
    } catch (e) { console.warn('informe nuevo:', e); }
    abrirInformeViejo();
  }
  function abrirInformeViejo() {
    const H = R.hist; if (!H.length) return;
    const I0 = H[0], I = H[H.length - 1], d = R.def || {}, nombre = (SIMS_UI.find(s => s.id === R.sim) || {}).n || d.n || '';
    const B = R.base && R.base[Math.min(R.base.length - 1, H.length - 1)];
    const filas = IND.filter(x => I[x.k] != null).map(x => {
      const c = I[x.k] - I0[x.k], cl = Math.abs(c) < 1e-9 ? '' : ((c > 0) === x.sube ? 'bien' : 'mal');
      const cb = B && B[x.k] != null && R.sim !== 1 ? I[x.k] - B[x.k] : null, clb = cb == null || Math.abs(cb) < 1e-9 ? '' : ((cb > 0) === x.sube ? 'bien' : 'mal');
      return `<tr><td>${x.n}</td><td>${x.f(I0[x.k], I0)}</td><td>${x.f(I[x.k], I)}</td><td class="${cl}">${signo(c, x)}</td><td class="${clb}">${cb == null ? '—' : signo(cb, x)}</td></tr>`;
    }).join('');
    const graf = ['fauna', 'red', 'trafico', 'ruidoDb', 'comidaMin', 'poliniz'].filter(k => I[k] != null).map(k => { const x = IND.find(z => z.k === k); return `<figure><figcaption>${x.n}</figcaption>${grafica(H.map(h => h[k]), R.base && R.sim !== 1 ? R.base.slice(0, H.length).map(h => h[k]) : null, x)}</figure>`; }).join('');
    const ext = R.extinciones.length ? `<ul>${R.extinciones.map(x => `<li><b>${x.nombre || x.especie}</b> · año ${(x.sem / 52 + 1).toFixed(1)} · ${x.motivo}${x.parche ? ' · ' + x.parche : ''}</li>`).join('')}</ul>` : '<p class="sub">Ninguna especie desapareció de Kennedy en esta corrida.</p>';
    const fasesN = (a) => a <= 5 ? 'corto plazo' : a <= 10 ? 'mediano plazo' : 'largo plazo';
    const linea = R.eventos.length ? `<ul>${R.eventos.map(e => { const a = Math.floor((e.sem || 0) / 52) + 1; return `<li><b>Año ${a}</b> <span class="sub">(${fasesN(a)})</span> · ${escH(e.titulo)}${e.texto ? ' — ' + escH(e.texto) : ''}</li>`; }).join('')}</ul>` : '<p class="sub">Sin avisos en esta corrida.</p>';
    const reglas = M && M.REGLAS ? `<ul>${M.REGLAS.map(r => `<li><b>${r.n}:</b> ${r.txt}${r.fuente ? ` <span class="sub">(${r.fuente})</span>` : ''}</li>`).join('')}</ul>` : '';
    const ver = R.go ? `<div class="ver go">GAME OVER en el año ${(R.go.sem / 52 + 1).toFixed(1)}: ${R.go.motivo || R.go.regla}.</div>`
      : `<div class="ver ok">Kennedy aguanta los ${Math.round(FIN / 52)} años en esta simulación: no se cumplió ninguna regla de game over.</div>`;
    inf.querySelector('.caja').innerHTML = `<header><div><h2>Simulación ${R.sim} · ${nombre}</h2><p class="sub">${d.pregunta || d.desc || ''} · ${(H.length - 1)} semanas (${((H.length - 1) / 52).toFixed(1)} años) · semilla ${SEMILLA}</p></div>
      <div class="bot"><button data-imp>Imprimir / PDF</button><button class="pri" data-x>Cerrar</button></div></header>${ver}
      <h3>Indicadores · inicio → final${R.sim !== 1 && B ? ' · comparado con el estado actual' : ''}</h3>
      <table><thead><tr><th>Indicador</th><th>Inicio</th><th>Final</th><th>Cambio</th><th>vs. estado actual</th></tr></thead><tbody>${filas}</tbody></table>
      <h3>Cómo cambió${R.sim !== 1 && B ? ' (línea punteada: estado actual)' : ''}</h3><div class="graf">${graf}</div>
      <h3>Lo que pasó, año por año</h3>${linea}
      <h3>Especies que desaparecieron</h3>${ext}
      <h3>Reglas de game over (iguales para las 12)</h3>${reglas}`;
    inf.querySelector('[data-x]').onclick = cerrarInforme; inf.querySelector('[data-imp]').onclick = () => window.print();
    inf.className = ''; if (!inf.open) inf.showModal(); inf.classList.add('on');
  }
  function cerrarInforme() { inf.classList.remove('on'); if (inf.open) inf.close(); }
  const signo = (c, x) => { if (c == null || isNaN(c)) return '—'; const s = c > 0 ? '+' : c < 0 ? '−' : ''; const a = Math.abs(c);
    if (x.k === 'trafico' || x.k === 'comidaMin' || x.k === 'residuos') return s + (a * 100).toFixed(0) + ' pts'; if (x.k === 'ruidoDb') return s + a.toFixed(1) + ' dB'; if (x.k === 'callesRuidosas') return s + a.toFixed(0) + ' pts'; return s + fmt(a); };
  function grafica(v, vb, x) {
    const W = 300, Hh = 90, todos = v.concat(vb || []).filter(z => z != null && isFinite(z)); if (todos.length < 2) return '<svg></svg>';
    const mn = Math.min(...todos), mx = Math.max(...todos), r = mx - mn || 1, n = v.length;
    const linea = (arr) => arr.map((y, i) => y == null ? '' : `${(i / Math.max(1, n - 1) * W).toFixed(1)},${(Hh - 6 - (y - mn) / r * (Hh - 14)).toFixed(1)}`).filter(Boolean).join(' ');
    const años = Math.max(1, Math.round(n / 52)), ejes = Array.from({ length: años + 1 }, (_, k) => `<line x1="${k / años * W}" y1="${Hh - 4}" x2="${k / años * W}" y2="${Hh - 1}" stroke="rgba(255,255,255,.25)"/>`).join('');
    return `<svg viewBox="0 0 ${W} ${Hh}" preserveAspectRatio="none">${ejes}${vb ? `<polyline points="${linea(vb)}" fill="none" stroke="rgba(255,255,255,.45)" stroke-dasharray="4 3" stroke-width="1.4" vector-effect="non-scaling-stroke"/>` : ''}<polyline points="${linea(v)}" fill="none" stroke="#ffcf7a" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>`;
  }

  return { preparar, reiniciarModelo, abrirInforme, avisar, get disponible() { return !!M; } };
}
