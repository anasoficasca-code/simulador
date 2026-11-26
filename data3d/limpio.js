/* ============ VISTA LIMPIA (por defecto) ============
   Al entrar solo se ve el territorio, el panel de la izquierda (reloj, SIMULACIONES 1–12, sintaxis espacial con su barra de
   colores, flujo de carros con su barra, capas: ruido, foto, etc.) y abajo la barra de años con play.
   Se esconden: paneles de escenarios A·B·C, agentes, red biótica (panel), barra de render/noche/…, años/día y los textos largos.
   ?modo=completo vuelve a la interfaz de antes.

   SIMULACIONES: al escoger una se prepara el territorio (proyecto dibujado, cámara) y se queda en el año 1 esperando PLAY.
   La 7 es el Metro Línea 1: en obra desde ya (data3d/metro_l1.js) y opera desde marzo de 2028 = semana 114 del modelo (año 3;
   Empresa Metro de Bogotá). Desde que opera bajan los carros que se dibujan durante un año hasta METRO_MENOS_CARROS.
   [SUP] METRO_MENOS_CARROS = 0,10: no hay cifra oficial de cuánto tráfico quita la Línea 1. */
import { RELOJ } from './reloj.js?v=5';
import { crearSlides } from './slides_sim.js?v=4';
import { iniciarSimUI } from './sim_ui.js?v=114';

export const METRO_SEM_OP = 114;
export const SEMANAS_FIN = 780; /* 15 años */
/* dos escenarios: Kennedy como está (sin la propuesta de la tesis) y Kennedy con la propuesta */
/* SEIS PARES: cada par pone a prueba lo mismo, con las mismas variables; uno corre Kennedy sin la propuesta y el otro con la
   infraestructura propuesta (id impar = sin, id par = con). */
const PARES = [
  { par: 1, n: 'Abastecimiento', prueba: 'La demanda de comida crece y Corabastos tiene un tope' },
  { par: 2, n: 'Movilidad', prueba: 'Se cierra temporalmente una vía estratégica' },
  { par: 3, n: 'Residuos', prueba: 'Aumentan los residuos orgánicos' },
  { par: 4, n: 'Biodiversidad', prueba: 'Se fragmenta o se pierde un parche ecológico' },
  { par: 5, n: 'Población y especulación', prueba: 'Sube la presión inmobiliaria' },
  { par: 6, n: 'Gobernanza', prueba: 'No alcanzan los recursos para todos los barrios' }
];
export const METRO_MENOS_CARROS = 0.10;   // [SUP] ver arriba
/* UN SOLO TIEMPO. La barra corre 20 años (1040 semanas) en tres plazos. 1× = un año en 12 s reales (20 años ≈ 4 min); 2× y 4× lo
   comprimen. El día (carros, fauna, cielo, reloj de la izquierda) corre con la MISMA velocidad: al subir la velocidad de los años suben
   también los carros (VEL_DIA = segundos simulados del día por segundo real). Un año real a 1× no es viable en una presentación. */
const FIN_SEM = 780, AÑOS = 15;
const VELS = [52 / 12, 52 / 6, 52 / 3];   // semanas del modelo por segundo real: 1× = 1 año / 12 s, 2× = 6 s, 4× = 3 s
const VEL_DIA = [40, 80, 160];            // el día corre al mismo ritmo relativo (en pausa vuelve a tiempo real: 1×). Tope real: cada segundo
                                          // simulado del día cuesta ~4 ms (boids 2, carros 1, agentes 0,7, aves 0,4): con 10 ms por cuadro a 60 fps
                                          // caben ~150 s simulados por segundo; más que eso el reloj recorta (no hay pasos más grandes).
const VEL_TXT = ['1 año = 12 s', '1 año = 6 s', '1 año = 3 s']; // la simulación no va en tiempo real: el botón dice cuánto dura un año
const AÑO0 = 2026, MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const FASES = [{ n: 'Corto plazo', a0: 1, a1: 5 }, { n: 'Mediano plazo', a0: 6, a1: 10 }, { n: 'Largo plazo', a0: 11, a1: 15 }];

// las 12 simulaciones (nombre corto; base = escenario del modelo semanal que se prende en el mapa)
export const SIMS = [
  { id: 1, par: 1, n: 'Abastecimiento · sin propuesta', base: 'D', cam: 'general' },
  { id: 2, par: 1, n: 'Abastecimiento · con propuesta', base: 'C', cam: 'general' },
  { id: 3, par: 2, n: 'Movilidad · sin propuesta', base: 'D', cam: 'general' },
  { id: 4, par: 2, n: 'Movilidad · con propuesta', base: 'C', cam: 'general' },
  { id: 5, par: 3, n: 'Residuos · sin propuesta', base: 'D', cam: 'general' },
  { id: 6, par: 3, n: 'Residuos · con propuesta', base: 'C', cam: 'general' },
  { id: 7, par: 4, n: 'Biodiversidad · sin propuesta', base: 'D', cam: 'general' },
  { id: 8, par: 4, n: 'Biodiversidad · con propuesta', base: 'C', cam: 'general' },
  { id: 9, par: 5, n: 'Población y especulación · sin propuesta', base: 'D', cam: 'general' },
  { id: 10, par: 5, n: 'Población y especulación · con propuesta', base: 'C', cam: 'general' },
  { id: 11, par: 6, n: 'Gobernanza · sin propuesta', base: 'D', cam: 'general' },
  { id: 12, par: 6, n: 'Gobernanza · con propuesta', base: 'C', cam: 'general' },
  { id: 13, par: 0, n: 'Kennedy sin propuesta', base: 'D', cam: 'general' }, /* simulación BASE (sin escenario): siempre corriendo */
  { id: 14, par: 0, n: 'Kennedy con propuesta', base: 'C', cam: 'general' }
];

const OCULTAR = ['#guia', '#guia-velo', '#su-hist', '#su-graf', '#ci-toast', '#in-btn', '#ind-panel', '#esc', '#dock', '#esim', '#trafficHud', '#hud-c', '#c50-pill', '#ms-volver', '#ms', '#ms-intro', '#ms-cmp', '#cvMarca', '#pz-panel', '#cvAyuda', '#cvMini', '#c50-nuevo', '#c50-pan', '#c50-cmp', '#toast', '.es-et', '.esc-pt', '#vm-panel', '.vaca-et', '#mercred-ley', '.mr-et', '.merc-et'];

export function iniciarLimpio({ T3 }) {
  const html = document.documentElement;
  html.classList.add('limpio');
  const css = document.createElement('style'); css.id = 'limpio-css';
  css.textContent = `html.limpio ${OCULTAR.join(', html.limpio ')} { display: none !important; }
    html.limpio .lp-off, html.limpio #gs-izq .lp-off, html.limpio #gs-izq button.lp-off, html.limpio #gs-izq > .lp-off { display: none !important; }
    html.limpio #gs-izq { max-height: calc(100vh - 118px); overflow-y: auto; }
    #lp-sims { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 6px; }
    #lp-sims button { padding: 7px 4px; font-size: 12.5px; letter-spacing: .01em; }
    #lp-sims button.on { box-shadow: inset 0 0 0 1px rgba(255,190,90,.9); }
#lp-sims .lp-gr { grid-column: 1 / -1; display: flex; align-items: baseline; justify-content: space-between; gap: 8px; margin: 8px 0 1px; padding-top: 7px; border-top: 1px solid rgba(255,255,255,.1); }
#lp-sims .lp-gr:first-child { margin-top: 0; padding-top: 0; border-top: 0; }
#lp-sims .lp-gr b { font: 600 11px system-ui, sans-serif; letter-spacing: .06em; text-transform: uppercase; color: #ffd28a; }
#lp-sims .lp-gr { display: block !important; } #lp-sims .lp-gr span { display: block; font: 400 10.5px/1.3 system-ui, sans-serif; opacity: .6; margin-top: 2px; text-align: left; }
#lp-sims button.con { border-color: rgba(142,230,168,.35); } #lp-sims button.con.on { box-shadow: inset 0 0 0 1px rgba(142,230,168,.95); }
    #lp-simn { margin: 6px 2px 2px; font: 500 12px/1.3 system-ui, sans-serif; opacity: .75; min-height: 16px; }
    /* barra de años (abajo, mismo vidrio de los paneles) */
    #lp-anos { position: fixed; left: 50%; bottom: 16px; transform: translateX(-50%); z-index: 40; display: flex; align-items: center; gap: 12px;
      padding: 10px 14px; width: min(760px, calc(100vw - 32px)); box-sizing: border-box; border-radius: 16px;
      color: #eef1f4; } /* el vidrio lo pone data3d/urbia.css (--ui-glass) */
    #lp-anos button { flex: none; height: 34px; min-width: 34px; border-radius: 10px; border: 1px solid rgba(255,255,255,.18); background: rgba(255,255,255,.08); color: inherit; font: 600 13px system-ui, sans-serif; cursor: pointer; }
    #lp-anos button:hover { background: rgba(255,255,255,.16); }
    #lp-anos button.play { min-width: 44px; background: var(--ui-acc); color: var(--ui-acc-ink); border-color: transparent; }
    #lp-anos button svg { width: 14px; height: 14px; display: block; margin: auto; }
    #lp-anos .tit { flex: none; max-width: 230px; font: 600 13px/1.2 system-ui, sans-serif; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    #lp-anos .vel { min-width: 92px !important; font-size: 11.5px !important; }
#lp-anos .ano { flex: none; font: 600 20px/1 'Barlow Condensed', system-ui, sans-serif; letter-spacing: .03em; min-width: 62px; text-align: right; }
    #lp-anos .pista { position: relative; flex: 1; height: 26px; }
    #lp-anos .pista i { position: absolute; left: 0; right: 0; top: 11px; height: 4px; border-radius: 3px; background: rgba(255,255,255,.16); }
    #lp-anos .pista b { position: absolute; left: 0; top: 11px; height: 4px; border-radius: 3px; background: var(--ui-acc); width: 0; }
    #lp-anos .pista u { position: absolute; top: -3px; height: 12px; border-left: 1px solid rgba(255,255,255,.28); padding-left: 5px; box-sizing: border-box; font: 600 9px/12px system-ui, sans-serif; letter-spacing: .06em; text-transform: uppercase; text-decoration: none; opacity: .6; white-space: nowrap; overflow: hidden; }
#lp-anos .ano small { display: block; font: 600 9px/1.2 system-ui, sans-serif; letter-spacing: .08em; text-transform: uppercase; opacity: .6; text-align: right; }
#lp-anos .pista s { position: absolute; top: 18px; transform: translateX(-50%); font: 500 10px system-ui, sans-serif; opacity: .55; text-decoration: none; }
    #lp-anos.vacia .play, #lp-anos.vacia .vel, #lp-anos.vacia .rei { opacity: .45; pointer-events: none; }
    /* posición de la barra: data3d/urbia.css (a la derecha del panel izquierdo, que va de arriba abajo) */
@media (max-width: 640px) { #lp-anos .tit { display: none; } #lp-anos { gap: 8px; padding: 8px 10px; } }`;
  document.head.appendChild(css);
  import('./camara_quieta.js?v=1').then(m => m.iniciarCamaraQuieta({ T3 })).catch(e => console.warn('cámara quieta:', e)); /* la cámara nunca se mueve sola */
  /* OPACIDAD DE LA FOTO DE FONDO (malla de Google, T3.tiles): fija al 80 % (pedido de la autora). La foto se dibuja primero (renderOrder −10)
     y luego se borra la profundidad para que el modelo propio quede encima; por eso NO se marca transparent (la mandaría al final): se
     mezcla con CustomBlending dentro de la pasada opaca, conservando su turno. */
  let opFoto = 0.8;
  const opMat = (m) => { if (!m || m.userData._opF === opFoto || (opFoto === 1 && m.blending !== THREE_CUSTOM)) return; /* al 100 % no se toca nada */ if (m.blending !== THREE_CUSTOM) { m.blending = THREE_CUSTOM; m.blendSrc = 204; /* SrcAlphaFactor */ m.blendDst = 205; /* OneMinusSrcAlphaFactor */ m.needsUpdate = true; } m.opacity = opFoto; m.userData._opF = opFoto; };
  const THREE_CUSTOM = 5; /* THREE.CustomBlending */
  const aplicarOpFoto = () => { const g = T3.tiles && T3.tiles.group; if (g) g.traverse(o => { if (o.isMesh && o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(opMat); }); };
  setInterval(aplicarOpFoto, 700); /* teselas nuevas que va cargando la malla */

  /* ---------- panel de la izquierda: se quita poco (ángulo, textos largos, flujo de agentes, ¿de dónde vienen?, agentes) ---------- */
  const limpiarPanel = () => {
    const g = document.getElementById('gs-izq'); if (!g) return false;
    const off = (el) => el && el.classList.add('lp-off');
    for (const s of g.querySelectorAll('.gs-sub')) {
      const t = (s.textContent || '').trim().toUpperCase();
      if (t.startsWith('ÁNGULO') || t.startsWith('FLUJO DE AGENTES')) off(s);
      if (t.startsWith('CORABASTOS')) { off(s); if (s.parentElement !== g && s.parentElement.children.length < 8) off(s.parentElement); for (let k = s.nextElementSibling; k && !k.classList.contains('gs-sub') && !k.classList.contains('ui-capas-h'); k = k.nextElementSibling) off(k); } // «Estado actual / Con la propuesta»: lo deciden las simulaciones
    }
    const ang = document.getElementById('gs-ang'); off(ang); if (ang && ang.nextElementSibling && /⟲|＋/.test(ang.nextElementSibling.textContent)) off(ang.nextElementSibling);
    g.querySelectorAll(':scope > h3, :scope > p').forEach(off); off(document.getElementById('gs-dia')); off(document.getElementById('gs-jor'));
    g.querySelectorAll('.gs-reloj em, .gs-reloj small').forEach(off);
    g.querySelectorAll('.ci-sx').forEach(off);                         // el párrafo largo de la sintaxis (la barra de colores se queda)
    off(document.getElementById('gs-flujo')); off(document.getElementById('gs-og'));
    const ag = document.getElementById('gs-ag'); if (ag) off(ag.closest('.gs-fila'));
    g.querySelectorAll(':scope > div:not([id]):not([class])').forEach(d => { if (!d.querySelector('button') && (d.textContent || '').trim().length > 60) off(d); });
    /* INTUITIVO: a la izquierda solo el reloj, el diagrama de quién interactúa con quién y el tablero ecocéntrico; capas: ruido y
       «solo relaciones bióticas». Las simulaciones van a la derecha (6 por escenario). */
    for (const s of g.querySelectorAll('.gs-sub')) { const tx = (s.textContent || '').trim().toUpperCase(); if (/^(SINTAXIS|FLUJO DE CARROS|SIMULACIONES)/.test(tx)) { off(s); for (let k = s.nextElementSibling; k && !k.classList.contains('gs-sub') && !k.classList.contains('ui-capas-h'); k = k.nextElementSibling) off(k); } }
    g.querySelectorAll(':scope > button').forEach(b => { if (b.id !== 'rc-btn' && b.id !== 'lp-bio') off(b); });
    if (!document.getElementById('lp-bio')) { const rc = document.getElementById('rc-btn'); if (rc) { const bb = document.createElement('button'); bb.id = 'lp-bio'; bb.type = 'button'; bb.textContent = 'Solo relaciones bióticas'; bb.className = rc.className.replace(/\bon\b/, '');
      bb.onclick = () => { const B = window.KEN_BIOTICA_SOLO; if (!B) return; if (B.activo) { B.off(); bb.classList.remove('on'); } else { B.on(); bb.classList.add('on'); } }; rc.after(bb); } }
    { const lb = document.getElementById('lp-bio'); if (lb) lb.classList.remove('lp-off'); }
    if (false && !document.getElementById('lp-sims')) {
      const h = document.createElement('div'); h.className = 'gs-sub'; h.textContent = 'SIMULACIONES';
      const f = document.createElement('div'); f.id = 'lp-sims';
      f.innerHTML = PARES.map(P => `<div class="lp-gr"><b>${String(P.par).padStart(2, '0')} · ${P.n}</b><span>${P.prueba}</span></div><button type="button" data-s="${2 * P.par - 1}" title="${P.n} sin propuesta">Sin propuesta</button><button type="button" data-s="${2 * P.par}" class="con" title="${P.n} con propuesta">Con propuesta</button>`).join('');
      const nm = document.createElement('div'); nm.id = 'lp-simn';
      const ancla = g.querySelector('.gs-reloj'); (ancla ? ancla.parentNode : g).insertBefore(h, ancla ? ancla.nextSibling : g.firstChild); h.after(f); f.after(nm);
      f.querySelectorAll('button').forEach(b => { b.onclick = () => escoger(+b.dataset.s); });
    }
    return true;
  };
  const intentar = () => { if (!limpiarPanel()) setTimeout(intentar, 300); };
  intentar();
  // el tablero de interacciones (su panel está escondido en esta vista) no necesita correr: libera ~0,2 ms por segundo simulado
  /* RED DE INTERACCIONES («la bolita» del tablero): el diagrama de cuerdas de quién interactúa con quién, en vivo, en una tarjeta flotante
     a la izquierda (el canvas #tb-cuerda del tablero se mueve aquí; tablero.js lo dibuja aunque el tablero esté cerrado). El tablero
     sigue contando encuentros (su paso del reloj queda prendido). */
  { const sb = document.createElement('style'); sb.textContent = '.lug-et,.hc-et,#bas-etq,.be,#cont-et,#mercred-aviso,#pares-etq{display:none!important}'; document.head.appendChild(sb); } /* sin burbujas de información sobre el mapa */
  /* el diagrama de cuerdas (#tb-cuerda de tablero.js) lo monta ahora el tablero de indicadores (panel_indicadores.js, tarjeta «Interacciones bióticas»),
     que también decide window.KEN_CUERDA_VIVA: solo se dibuja cuando esa tarjeta está a la vista. */
  let nRep = 0; const rep = setInterval(() => { limpiarPanel(); if (++nRep > 30) clearInterval(rep); }, 1000);

  /* sin la franja verde de la orilla del humedal ni los rellenos planos verdes de zonas (se veían raros sobre la foto) */
  const esVerdePlano = (o) => { if (!o.isMesh || !o.material || o.material.type !== 'MeshBasicMaterial' || !o.material.color) return false; const c = o.material.color;
    if (!(c.g > 0.5 && c.g > c.r * 1.25 && c.g > c.b * 1.6)) return false; if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); const b = o.geometry.boundingBox; return b && (b.max.y - b.min.y) < 0.5; };
  // sin los anillos naranjas de entrada ni los halos de camiones (data3d/origenes.js): la autora no los quiere (solo los carros)
  setInterval(() => { { const og = T3.scene.getObjectByName('origenes'); if (og) og.visible = false; const gi = T3.scene.getObjectByName('indicadores'); if (gi) gi.visible = false; const vm = T3.scene.getObjectByName('vm_marcas'); if (vm) vm.visible = false; for (const o of T3.scene.children) { if (o.name || !o.isMesh || !o.material || o.material.type !== 'MeshBasicMaterial' || !o.material.vertexColors || o.renderOrder < 2 || o.renderOrder > 4) continue; const pa = o.geometry && o.geometry.attributes.position; if (pa && pa.count > 20000 && o.material.visible) o.material.visible = false; } /* sin las cintas de colores en las calles (flujo de carros y sintaxis espacial): se volvían a prender solas */ for (const nm of ['escenarios_sim', 'estrategias', 'red-mercados', 'picos_zonas', 'picos_zonas_base', 'medicion', 'huertas-hidroponicas', 'mercados-barrio'])  { const g = T3.scene.getObjectByName(nm); if (g && g.visible) g.visible = false; } /* sin capas de escenario (columnas, rutas, líneas de colores): mapa limpio */ if (ESC.activo) for (const nm of ['escenarios_sim', 'parches_arboles']) { const g = T3.scene.getObjectByName(nm); if (g) g.traverse(o => { if (o.isPoints) o.visible = false; }); } /* con una simulación: sin íconos redondos de huertas y parches (la red verde ya los muestra) */ const ib = document.getElementById('in-btn'); if (ib) ib.style.display = 'none'; } /* sin picos de indicadores */ for (const nm of ['picos_zonas', 'picos_zonas_base', 'picos_ind']) T3.scene.traverse(o => { if (o.name === nm && o.material) o.material.visible = false; }); /* sin anillos naranjas ni agujas azules */ document.querySelectorAll('.og-et').forEach(e => { e.style.display = 'none'; }); }, 500);
  setInterval(() => { T3.scene.traverse(o => {
    if (o.name && /^orilla_/.test(o.name)) o.traverse(x => { if (x.material) (Array.isArray(x.material) ? x.material : [x.material]).forEach(m => { m.visible = false; }); });
    else if (o.userData.lpVerde !== false && esVerdePlano(o)) { o.material.visible = false; o.userData.lpVerde = true; } }); }, 1500);

  /* ---------- ESCENARIOS (arriba) y SIMULACIONES (panel izquierdo, cada una abre sus diapositivas: data3d/slides_sim.js) ----------
     Panel izquierdo (#gs-izq), de arriba abajo: reloj → «Simulaciones» (#lp-seis) → Par/Variables/Informe (#su-der, de sim_ui.js) →
     #lp-datos (contenedor vacío que llena el panel de datos; siempre es el ÚLTIMO hijo). La columna derecha #lp-der ya no se muestra.
     Vidrio, colores y posiciones: data3d/urbia.css (variables --ui-glass*, --ui-acc*). */
  { const se = document.createElement('style'); se.textContent = `#lp-esc{position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:46;display:flex;gap:4px;padding:4px}
    #lp-esc button{padding:8px 16px;border-radius:10px;border:0;background:none;color:inherit;font:500 12.5px var(--ui-sans,system-ui),sans-serif;cursor:pointer;opacity:.75}
    html.limpio #lp-der{display:none!important} html.limpio #su-inds{display:none!important} #su-avisos{top:74px!important}`; document.head.appendChild(se); }
  const escB = document.createElement('div'); escB.id = 'lp-esc'; escB.setAttribute('role', 'group'); escB.setAttribute('aria-label', 'Escenario de Kennedy');
  escB.innerHTML = '<button type="button" data-e="hoy" class="on" aria-pressed="true">Kennedy sin propuesta</button><button type="button" data-e="con" class="con" aria-pressed="false">Kennedy con propuesta</button>'; document.body.appendChild(escB);
  const der = document.createElement('div'); der.id = 'lp-der'; der.hidden = true; document.body.appendChild(der); /* se conserva vacío (otros módulos lo buscan), escondido */
  /* TABLERO EN TIEMPO REAL (columna derecha, alto completo): aquí solo la caja exterior; el panel de datos (data3d/panel_datos.js) se monta adentro.
     En tableta y celular se abre con el botón «Tablero» (#lp-tab-tog). */
  const tablero = document.getElementById('lp-tablero') || document.createElement('aside');
  if (!tablero.isConnected) { tablero.id = 'lp-tablero'; tablero.setAttribute('aria-label', 'Tablero en tiempo real'); document.body.appendChild(tablero); }
  const seis = document.createElement('section'); seis.id = 'lp-seis'; seis.setAttribute('aria-labelledby', 'lp-seis-t');
  /* capas del mapa que quedan (ruido de carros, solo relaciones bióticas): plegadas en una línea */
  const capas = document.createElement('details'); capas.id = 'lp-capas'; capas.className = 'lp-det';
  capas.innerHTML = '<summary><span class="lp-dt">Capas del mapa</span><span class="lp-ds"></span></summary><div class="lp-db"></div>';
  const resumenCapas = () => { const on = [['rc-btn', 'Ruido'], ['lp-bio', 'Solo bióticas']].filter(([id]) => { const b = document.getElementById(id); return b && b.classList.contains('on'); }).map(x => x[1]);
    capas.querySelector('.lp-ds').textContent = on.length ? on.join(' · ') : 'ninguna'; };
  capas.querySelector('.lp-db').addEventListener('click', () => setTimeout(resumenCapas, 60));
  /* CONVENCIONES: qué es cada cosa que se ve en el mapa (colores y formas reales de cada módulo; plegadas al final del panel izquierdo) */
  const sw = { pil: (c) => `<svg viewBox="0 0 18 10" aria-hidden="true"><rect x="2" y="2.5" width="14" height="5" rx="2.5" fill="${c}"/></svg>`,
    lin: (c, d) => `<svg viewBox="0 0 18 10" aria-hidden="true"><path d="M1 5h16" stroke="${c}" stroke-width="3" stroke-linecap="round"${d ? ' stroke-dasharray="3 3"' : ''}/></svg>`,
    pto: (c) => `<svg viewBox="0 0 18 10" aria-hidden="true"><circle cx="9" cy="5" r="3.6" fill="${c}"/></svg>`,
    halo: (c) => `<svg viewBox="0 0 18 10" aria-hidden="true"><defs><radialGradient id="lpcvh"><stop offset="0" stop-color="${c}" stop-opacity=".9"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient></defs><circle cx="9" cy="5" r="5" fill="url(#lpcvh)"/></svg>`,
    cil: () => `<svg viewBox="0 0 18 12" aria-hidden="true"><rect x="5" y="1" width="8" height="10" rx="2" fill="none" stroke="rgba(255,255,255,.5)"/><rect x="6" y="6" width="6" height="4.4" rx="1" fill="#4ade80"/><path d="M4 2.5h10" stroke="#ff4d4d" stroke-width="1.4"/></svg>`,
    cruz: () => `<svg viewBox="0 0 18 12" aria-hidden="true"><path d="M5 2l8 8M13 2l-8 8" stroke="#0b0d10" stroke-width="3" stroke-linecap="round"/><path d="M5 2l8 8M13 2l-8 8" stroke="rgba(255,255,255,.55)" stroke-width="1" stroke-linecap="round"/></svg>`,
    agua: () => `<svg viewBox="0 0 18 10" aria-hidden="true"><path d="M1 3c3-2 5 2 8 0s5 2 8 0v6H1z" fill="#24323a" stroke="#4d6a74" stroke-width=".8"/></svg>`,
    arbol: () => `<svg viewBox="0 0 18 12" aria-hidden="true"><circle cx="6" cy="6" r="3.6" fill="#3f5f34"/><circle cx="11.5" cy="5" r="4" fill="#4c7340"/></svg>`,
    huerta: () => `<svg viewBox="0 0 18 10" aria-hidden="true"><rect x="1" y="1" width="16" height="8" rx="1.5" fill="#5f7d33"/><path d="M1 3.6h16M1 6.4h16" stroke="#cfe3a5" stroke-width=".8"/></svg>` };
  const CONV = [
    ['Tráfico (de lejos cada vehículo es una píldora)', [[sw.pil('#fff0d2'), 'Carro'], [sw.pil('#ffae1f'), 'Moto'], [sw.pil('#ff3d6e'), 'Camión de carga'], [sw.pil('#7fe3ff'), 'Bicicleta'], [sw.pil('#8b5cf6'), 'Carros nuevos del plan parcial Bavaria (sin propuesta)']]],
    ['Infraestructura', [[sw.lin('#ff8a1e'), 'Metro Línea 1 en obra (titila)'], [sw.lin('#fff04a'), 'Metro Línea 1 operando (desde 2028)'], [sw.cil(), 'Medidor de capacidad de Corabastos y de cada mercado (par 01): se llena verde, ámbar desde 90 %, rojo sobre el tope; anillo rojo = tope']]],
    ['Naturaleza', [[sw.agua(), 'Humedales El Burro, La Vaca y Techo'], [sw.arbol(), 'Árboles (inventario de arbolado)'], [sw.huerta(), 'Huertas en cubiertas (solo con propuesta)'], ['<svg viewBox="0 0 18 10" aria-hidden="true"><path d="M2 6c2-3 4-3 7 0 3-3 5-3 7 0" fill="none" stroke="#d9dccf" stroke-width="1.5" stroke-linecap="round"/></svg>', 'Fauna en 3D (aves, abejas, anfibios): se mueve según el modelo biótico']]],
    ['Eventos', [[sw.cruz(), 'Muerte de un animal: cruz con el animal encima (botón «Ver» de un aviso)'], [sw.pto('#ff5a4f'), 'Hecho que empeora (en pausa)'], [sw.pto('#5fe08f'), 'Hecho que mejora (en pausa)']]],
    ['Capas que se prenden a mano', [[sw.halo('#f22914'), 'Ruido de carros: halo rojo alrededor de cada vehículo'], [sw.lin('#e0b23a'), 'Solo relaciones bióticas: líneas con los colores de cada tipo de interacción (los mismos del diagrama de cuerdas del tablero)']]]];
  const conv = document.createElement('details'); conv.id = 'lp-conv'; conv.className = 'lp-det';
  conv.innerHTML = '<summary><span class="lp-dt">Convenciones</span><span class="lp-ds">qué es cada cosa</span></summary><div class="lp-db">'
    + CONV.map(([g, L]) => `<p class="lp-cg">${g}</p><ul class="lp-cv">${L.map(([s, n]) => `<li>${s}<span>${n}</span></li>`).join('')}</ul>`).join('') + '</div>';
  { const cs = document.createElement('style'); cs.textContent = `html.limpio body #gs-izq .lp-lista li .lp-acc{grid-column:1/-1;padding:0 10px 8px 12px;min-width:0}
    html.limpio body #gs-izq .lp-lista li:not(.on) .lp-acc,html.limpio body #gs-izq .lp-lista li .lp-acc:empty{display:none}
    html.limpio body #gs-izq .lp-acc #su-der{margin:2px 0 0!important}
    html.limpio body #gs-izq .lp-acc #lp-vars > summary{display:none}
    html.limpio body #gs-izq #lp-conv .lp-cg{margin:8px 0 4px;font:400 9.5px/1.2 var(--ui-mono);letter-spacing:.1em;text-transform:uppercase;color:var(--ui-tx3)}
    html.limpio body #gs-izq #lp-conv .lp-cv{list-style:none;margin:0;padding:0;display:grid;gap:4px}
    html.limpio body #gs-izq #lp-conv .lp-cv li{display:grid;grid-template-columns:22px minmax(0,1fr);gap:8px;align-items:center;font:400 11px/1.35 var(--ui-sans);color:var(--ui-tx2)}
    html.limpio body #gs-izq #lp-conv .lp-cv svg{width:22px;height:13px;display:block}`; document.head.appendChild(cs); }
  const SL = crearSlides({ alCorrer: () => { if (RELOJ.pausaSem) alternar(); } });
  const ICO_SL = '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="3" width="12" height="8.5" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M6 14h4M8 11.5V14" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>';
  let escE = 'hoy';
  const idDe = (par) => escE === 'con' ? 2 * par : 2 * par - 1;
  function refrescarSeis() { const base = escE === 'con' ? 14 : 13; seis.classList.toggle('con', escE === 'con');
    const h = seis.querySelector('.lp-sec'); if (h) h.title = ESC.activo === base ? `Corre Kennedy ${escE === 'con' ? 'con' : 'sin'} propuesta, sin prueba de estrés. Toca una simulación para aplicarla desde ahora y ver sus diapositivas.` : 'Toca otra vez la simulación activa para quitarla.';
    const l = seis.querySelector('.lp-modo'); if (l) l.textContent = escE === 'con' ? 'Con propuesta' : 'Sin propuesta';
    seis.querySelectorAll('li').forEach(li => { const b = li.querySelector('.lp-sim'), on = ESC.activo === +b.dataset.s; li.classList.toggle('on', on); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); b.setAttribute('aria-expanded', on); });
    if (typeof ordenar === 'function') ordenar(); }
  function pintarSeis() {
    /* filas de una línea: número + nombre; la prueba de estrés va en el title (y en la descripción accesible) */
    { const sd0 = document.getElementById('su-der'); if (sd0 && seis.contains(sd0)) seis.after(sd0); } /* las variables salen del acordeón antes de rehacer la lista */
    seis.innerHTML = `<header class="lp-sec"><h5 id="lp-seis-t">Simulaciones</h5><span class="lp-modo"></span></header><ul class="lp-lista">` + PARES.map(P => `<li title="${P.prueba}">
      <button type="button" class="lp-sim" data-s="${idDe(P.par)}" data-p="${P.par}" aria-describedby="lp-pr-${P.par}"><i>${String(P.par).padStart(2, '0')}</i><b>${P.n}</b><small id="lp-pr-${P.par}" class="lp-sr">${P.prueba}</small></button>
      <button type="button" class="lp-ver" data-p="${P.par}" aria-label="Ver diapositivas de ${P.n}" title="Diapositivas">${ICO_SL}</button><div class="lp-acc" id="lp-acc-${P.par}" role="region" aria-label="Variables de ${P.n}"></div></li>`).join('') + '</ul>';
    seis.querySelectorAll('.lp-sim').forEach(b => b.onclick = () => { const id = +b.dataset.s, base = escE === 'con' ? 14 : 13;
      /* ACORDEÓN: la simulación se aplica y sus variables se abren justo debajo de la fila; las diapositivas solo con su botón */
      if (ESC.activo === id) { escoger(base, true); SL.cerrar(); } else escoger(id, true);
      refrescarSeis(); setTimeout(refrescarSeis, 150); });
    seis.querySelectorAll('.lp-ver').forEach(b => b.onclick = () => SL.abrir(+b.dataset.p, escE === 'con', b));
    refrescarSeis(); }
  escB.querySelectorAll('button').forEach(b => b.onclick = () => { escE = b.dataset.e; escB.querySelectorAll('button').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); });
    const par = ESC.activo && ESC.activo <= 12 ? Math.ceil(ESC.activo / 2) : null; escoger(par ? idDe(par) : (escE === 'con' ? 14 : 13), true); /* mismo escenario en el otro Kennedy (mismas variables, otro resultado), sin volver al año 1 */
    pintarSeis(); if (par && SL.abierto) SL.abrir(par, escE === 'con'); });
  /* orden del panel izquierdo: un observador (no un intervalo que pelea) pone cada bloque en su sitio cuando giro_sim.js o sim_ui.js agregan nodos */
  /* Panel izquierdo angosto, de arriba abajo: «Simulaciones» (#lp-seis) → Variables (plegable) + «Ver informe» (#su-der) → «Capas del mapa»
     (plegable). El reloj grande se esconde (la hora va en la barra de años). Los datos van al tablero de la derecha (#lp-tablero). */
  const ordenar = () => { const gz = document.getElementById('gs-izq'); if (!gz) return false;
    const rl = gz.querySelector('.gs-reloj'), sd = document.getElementById('su-der');
    if (rl && rl.nextElementSibling !== seis) rl.after(seis); else if (!rl && seis.parentNode !== gz) gz.prepend(seis);
    /* Variables + informe: dentro del acordeón de la simulación activa (debajo de su fila); con la simulación base, plegadas después de la lista */
    const acc = seis.querySelector('li.on .lp-acc');
    if (sd && acc) { if (sd.parentNode !== acc) acc.appendChild(sd); const dt = sd.querySelector('#lp-vars'); if (dt && !dt.open) dt.open = true; } else if (sd && seis.nextElementSibling !== sd) seis.after(sd);
    const ref = sd && sd.parentNode === gz ? sd : seis; if (ref.nextElementSibling !== capas) ref.after(capas); if (capas.nextElementSibling !== conv) capas.after(conv);
    const db = capas.querySelector('.lp-db');
    for (const id of ['rc-btn', 'lp-bio']) { const b = document.getElementById(id); if (b && gz.contains(b) && b.parentNode !== db) db.appendChild(b); }
    resumenCapas();
    /* el contenedor viejo de datos ya no va en el panel izquierdo: si aparece aquí, se pasa al tablero */
    const vd = document.getElementById('lp-datos'); if (vd && gz.contains(vd)) tablero.appendChild(vd);
    return !!sd; };
  /* Variables de #su-der (sim_ui.js las repinta con innerHTML): se envuelven en un <details> cerrado con un resumen de una línea */
  let varsAbiertas = false;
  const resumenVars = (dt) => { const v = [...dt.querySelectorAll('.su-sl label b')].map(b => b.textContent.trim()); dt.querySelector('.lp-ds').textContent = v.length ? `${v.length} · ${v.join(' · ')}` : ''; };
  const envolverVars = () => { const sd = document.getElementById('su-der'); if (!sd || sd.querySelector('#lp-vars')) return;
    const hs = [...sd.querySelectorAll(':scope > h4')]; if (hs[0] && !/variables|informe/i.test(hs[0].textContent)) hs[0].classList.add('lp-par');
    for (const h of hs) if (/^\s*informe/i.test(h.textContent)) h.classList.add('lp-inf-h');
    const hv = hs.find(h => /^\s*variables/i.test(h.textContent)); if (!hv) return;
    const dt = document.createElement('details'); dt.id = 'lp-vars'; dt.className = 'lp-det'; dt.open = varsAbiertas || !!sd.closest('.lp-acc'); /* en el acordeón de la simulación, abiertas */
    dt.innerHTML = '<summary><span class="lp-dt">Variables</span><span class="lp-ds"></span></summary><div class="lp-db"></div>';
    const cuerpo = dt.querySelector('.lp-db'); let k = hv.nextElementSibling; while (k && k.classList.contains('su-sl')) { const n = k.nextElementSibling; cuerpo.appendChild(k); k = n; }
    hv.replaceWith(dt); resumenVars(dt);
    dt.addEventListener('toggle', () => { varsAbiertas = dt.open; });
    dt.addEventListener('input', () => resumenVars(dt)); };
  { let obs = null, obsD = null; const espera = setInterval(() => { const gz = document.getElementById('gs-izq'); if (!gz) return;
      if (!obs) { obs = new MutationObserver(ordenar); obs.observe(gz, { childList: true }); }
      const sd = document.getElementById('su-der'); if (sd && !obsD) { obsD = new MutationObserver(envolverVars); obsD.observe(sd, { childList: true }); envolverVars(); }
      if (ordenar() && obsD) clearInterval(espera); }, 300);
  }
  /* tableta y celular: el panel izquierdo y el tablero son cajones que se abren con estos botones (uno a la vez) */
  { const ICO_MEN = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 4h11M2.5 8h11M2.5 12h11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
    const ICO_TAB = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 13.5h11M4.5 11V7.5M8 11V3.5M11.5 11V6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
    const tg = document.createElement('button'); tg.id = 'lp-izq-tog'; tg.type = 'button'; tg.setAttribute('aria-controls', 'gs-izq'); tg.setAttribute('aria-expanded', 'false');
    tg.innerHTML = ICO_MEN + '<span>Simulaciones</span>';
    const tt = document.createElement('button'); tt.id = 'lp-tab-tog'; tt.type = 'button'; tt.setAttribute('aria-controls', 'lp-tablero'); tt.setAttribute('aria-expanded', 'false');
    tt.innerHTML = ICO_TAB + '<span>Tablero</span>';
    const poner = (cual, on) => { html.classList.toggle('lp-izq-abierto', cual === 'izq' && on); html.classList.toggle('lp-tab-abierto', cual === 'tab' && on);
      tg.setAttribute('aria-expanded', html.classList.contains('lp-izq-abierto')); tt.setAttribute('aria-expanded', html.classList.contains('lp-tab-abierto'));
      tg.querySelector('span').textContent = html.classList.contains('lp-izq-abierto') ? 'Cerrar' : 'Simulaciones'; tt.querySelector('span').textContent = html.classList.contains('lp-tab-abierto') ? 'Cerrar' : 'Tablero'; };
    tg.onclick = () => poner('izq', !html.classList.contains('lp-izq-abierto'));
    tt.onclick = () => poner('tab', !html.classList.contains('lp-tab-abierto'));
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && (html.classList.contains('lp-izq-abierto') || html.classList.contains('lp-tab-abierto'))) poner('', false); });
    document.body.append(tg, tt); }
  setTimeout(pintarSeis, 0);
  /* SIEMPRE CORRIENDO: al abrir arranca la simulación base (Kennedy hoy) y la barra de años corre sola; al llegar al año 15 vuelve a empezar */
  setTimeout(function arrancar() { const L = document.getElementById('loader'); if ((L && !L.classList.contains('hidden')) || !UI) return void setTimeout(arrancar, 400);
    if (!ESC.activo) { escoger(13); setTimeout(() => { if (RELOJ.pausaSem) alternar(); pintarSeis(); }, 900); } }, 0);
  /* sin la capa de flujo de carros (las líneas de colores en las calles): los carros ya se ven */
  let nFc = 0; const fcOff = setInterval(() => { const fo = document.querySelector('#gs-fc button[data-v=""]'); if (fo && !fo.classList.contains('on')) fo.click(); if (++nFc > 40) clearInterval(fcOff); }, 500);
  /* VÍAS MÁS OSCURAS: calzada de asfalto oscuro y andenes un poco más oscuros (las rayas blancas quedan); el color multiplica la textura */
  let nVia = 0; const vOsc = setInterval(() => { const V = T3.viasMallas; if (V && V[2]) { V[2].material.color.multiplyScalar(0.7); /* un poco más oscura (antes 0,78), no negra; andenes como estaban */ clearInterval(vOsc); } else if (++nVia > 60) clearInterval(vOsc); }, 500);
  addEventListener('lp-vuelta', () => { reiniciar(); setTimeout(() => { if (RELOJ.pausaSem) alternar(); }, 300); });
  /* ---------- barra de años ---------- */
  const ICO_PLAY = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.5v9l7-4.5z" fill="currentColor"/></svg>', ICO_PAUSA = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.5h2v9H5zM9 3.5h2v9H9z" fill="currentColor"/></svg>',
    ICO_REI = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8a4.5 4.5 0 1 0 1.4-3.3M3.5 2.5v2.6h2.6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const bar = document.createElement('div'); bar.id = 'lp-anos'; bar.className = 'vacia';
  bar.innerHTML = `<button type="button" class="play" title="Correr la simulación (barra espaciadora)" aria-label="Correr">${ICO_PLAY}</button>
    <button type="button" class="rei" title="Volver al año 1" aria-label="Volver al año 1">${ICO_REI}</button>
    <span class="tit">Escoge una simulación</span>
    <div class="pista"><i></i><b></b>${FASES.map(f => `<u title="${f.n} · años ${f.a0}–${f.a1}" style="left:${(f.a0 - 1) / AÑOS * 100}%;width:${(f.a1 - f.a0 + 1) / AÑOS * 100}%">${f.n.replace(' plazo', '')}</u>`).join('')}${[1, 5, 10, 15].map(a => `<s style="left:${(a - 0.5) / AÑOS * 100}%">${a}</s>`).join('')}</div>
    <span class="ano">Año 1<small>Corto plazo</small></span>
    <span class="hora" title="Hora del día en la simulación (carros, fauna y cielo)"><b>--:--</b><small>hora</small></span>
    <button type="button" class="vel" title="Velocidad: cuánto dura un año de la simulación (no es tiempo real)">${VEL_TXT[0]}</button>`;
  document.body.appendChild(bar);
  const $b = (s) => bar.querySelector(s);
  let vel = 0;
  $b('.play').onclick = () => alternar();
  $b('.rei').onclick = () => { if (!ESC.activo) return; reiniciar(); };
  $b('.vel').onclick = () => { vel = (vel + 1) % VELS.length; $b('.vel').textContent = VEL_TXT[vel]; if (!RELOJ.pausaSem) { RELOJ.ponerVelAños(VELS[vel]); RELOJ.ponerVel(VEL_DIA[vel]); } };
  addEventListener('keydown', (e) => { if (e.code === 'Space' && !/INPUT|TEXTAREA|SELECT|BUTTON/.test(document.activeElement && document.activeElement.tagName)) { e.preventDefault(); alternar(); } });
  /* MODO PRESENTACIÓN (como la referencia: ciudad real en vista oblicua hacia el horizonte, masas de color y solo la línea de tiempo):
     al darle play la cámara baja suave a una vista oblicua y los paneles laterales se desvanecen; en pausa vuelven. */
  { const sp = document.createElement('style'); sp.textContent = `#gs-izq,#su-der,#su-hist,#lp-red{transition:opacity .6s ease,transform .6s ease}
    body.lp-corre #su-hist,body.lp-corre #lp-red{opacity:0!important;pointer-events:none!important}
    #lp-ojo{position:fixed;right:16px;top:16px;z-index:45;padding:7px 12px;border-radius:10px;background:rgba(20,22,28,.78);border:1px solid rgba(255,255,255,.16);backdrop-filter:blur(10px);color:#eef1f4;font:600 11.5px system-ui,sans-serif;cursor:pointer;display:none} body.lp-corre #lp-ojo{display:block}`; document.head.appendChild(sp);
    const ob = document.createElement('button'); ob.id = 'lp-ojo'; ob.type = 'button'; ob.textContent = 'Pausar y ver los datos'; ob.onclick = () => alternar(); document.body.appendChild(ob); }
  const VOBL = { c: [2300, 0, 300], d: [340, 470, 1850] }; let camT = null;
  function irOblicua() { if (!T3.camera || !T3.orbit) return; T3.anim = null; camT = { t0: performance.now(), dur: 2600, p0: T3.camera.position.clone(), c0: T3.orbit.target.clone() }; }
  RELOJ.alDibujar(() => { if (!camT) return; const k = Math.min(1, (performance.now() - camT.t0) / camT.dur), e = k * k * (3 - 2 * k);
    T3.orbit.target.set(camT.c0.x + (VOBL.c[0] - camT.c0.x) * e, camT.c0.y + (VOBL.c[1] - camT.c0.y) * e, camT.c0.z + (VOBL.c[2] - camT.c0.z) * e);
    T3.camera.position.set(camT.p0.x + (VOBL.c[0] + VOBL.d[0] - camT.p0.x) * e, camT.p0.y + (VOBL.d[1] - camT.p0.y) * e, camT.p0.z + (VOBL.c[2] + VOBL.d[2] - camT.p0.z) * e); T3.orbit.update(); if (k >= 1) camT = null; });
  let yaOblicua = false;
  function alternar() {
    if (!ESC.activo) return;
    /* la cámara no se mueve sola: la vista oblicua ya está puesta desde el inicio (VISTA) */
    if (RELOJ.pausaSem) { if (RELOJ.sem >= FIN_SEM) reiniciar(); RELOJ.detenerSemEn = FIN_SEM; RELOJ.ponerVelAños(VELS[vel]); RELOJ.pausarAños(false); RELOJ.presupuestoMs = 10; RELOJ.ponerVel(VEL_DIA[vel]); }
    else { RELOJ.pausarAños(true); RELOJ.presupuestoMs = 6; RELOJ.ponerVel(1); }
  }
  function reiniciar() { if (RELOJ.saltando) return; RELOJ.reiniciarModelo(); RELOJ.pausarAños(true); RELOJ.ponerVel(1); dispatchEvent(new Event('lp-reinicio')); }
  RELOJ.alDibujar(() => {
    const s = Math.min(FIN_SEM, RELOJ.semanas || RELOJ.sem), corre = !RELOJ.pausaSem;
    if (RELOJ.pausaSem && RELOJ.vel > 1 && !RELOJ.saltando) { RELOJ.ponerVel(1); RELOJ.presupuestoMs = 6; } // la pausa al llegar al final (o por un aviso) también vuelve el día a tiempo real
    $b('.pista b').style.width = (s / FIN_SEM * 100).toFixed(2) + '%';
    const a = Math.min(AÑOS, Math.floor(s / 52) + 1), fa = FASES.find(f => a >= f.a0 && a <= f.a1) || FASES[0], txa = `Año ${a}<small>${MESES[Math.min(11, Math.floor((s % 52) / 52 * 12))]} ${AÑO0 + Math.floor(s / 52)} · ${fa.n.replace(' plazo', '')} plazo</small>`;
    if ($b('.ano').innerHTML !== txa) $b('.ano').innerHTML = txa;
    { const md = RELOJ.minutoDia, hh = String(Math.floor(md / 60) % 24).padStart(2, '0') + ':' + String(Math.floor(md % 60)).padStart(2, '0'); const hb = $b('.hora b'); if (hb.textContent !== hh) hb.textContent = hh; }
    /* simulador: el tablero y las simulaciones quedan visibles mientras corre (sin desvanecer paneles) */ T3.horaLuz = 10.5; /* siempre luz de media mañana (el reloj y los carros siguen su hora) */ { const hg = T3.scene.getObjectByName('hechos'); if (hg) for (const o of hg.children) if (o.isPoints) o.visible = !corre; } /* corriendo: sin las cruces de atropellos */ /* con una simulación: luz de media mañana, cielo despejado y poca neblina (como la referencia) */ if (window.KEN_FOCO && ESC.activo && corre && window.KEN_FOCO.activo) window.KEN_FOCO.off({ dur: 1.5 }); /* corriendo: la ciudad con su luz real, sin oscurecer */
    const p = $b('.play'); if (p.dataset.corre !== String(corre)) { p.dataset.corre = corre; p.innerHTML = corre ? ICO_PAUSA : ICO_PLAY; p.setAttribute('aria-label', corre ? 'Pausar' : 'Correr'); }
  });

  /* ---------- escoger simulación: prepara el territorio y espera PLAY ---------- */
  const ESC = window.KEN_LIMPIO = { activo: 0, sim: null, factorCarros: () => factorCarros(), SIMS };
  let UI = null; iniciarSimUI({ T3, SIMS_UI: SIMS }).then(u => { UI = window.KEN_SIMUI = u; if (ESC.activo) u.preparar(ESC.activo); }).catch(e => console.warn('interfaz de simulaciones:', e));
  function factorCarros() { // multiplica la demanda de tráfico que se dibuja (index.html, updateTraffic)
    if (window.KEN_TRAF_F) return window.KEN_TRAF_F; // más carros (los mismos de la simulación SUMO) cuando el modelo dice que hay más tráfico
    return 1; // el metro está en todas las simulaciones: su efecto lo lleva el modelo semanal
    if (ESC.activo !== 7) return 1;
    const d = RELOJ.sem - METRO_SEM_OP; if (d < 0) return 1;
    return 1 - METRO_MENOS_CARROS * Math.min(1, d / 52);
  }
  function escoger(id, continuar) {
    const S = SIMS.find(s => s.id === id); if (!S) return; const seguir = continuar && RELOJ.sem > 1 && ESC.activo;
    ESC.activo = id; ESC.sim = S; bar.classList.remove('vacia'); yaOblicua = false;
    document.querySelectorAll('#lp-sims button, #lp-seis button').forEach(b => b.classList.toggle('on', +b.dataset.s === id));
    const nm = document.getElementById('lp-simn'); if (nm) nm.textContent = S.n;
    $b('.tit').textContent = `Simulación ${id} · ${S.n}`;
    // escenario del modelo en el mapa (los botones del panel A·B·C·D, escondido)
    const btn = document.querySelector(`#esim .seg button[data-e="${S.base}"]`); if (btn) btn.click();
    if (window.KEN_PLANBAV) window.KEN_PLANBAV.ver(S.base === 'D');
    // queda en el año 1, en pausa: corre al darle play
    setTimeout(() => { if (seguir) { if (UI) UI.preparar(id, { desde: Math.min(FIN_SEM, RELOJ.sem) }); } else { reiniciar(); if (UI) UI.preparar(id); } }, 60);
    // rutas y vehículos de reparto de «Viajes de abastecimiento» (panel escondido): apagados, tiñen el mapa de naranja y pesan
    for (const ms of [400, 1500, 3500]) setTimeout(() => { const vm = document.getElementById('vm-panel'); if (vm) vm.querySelectorAll('button').forEach(b => { if (/^Apagar$/.test(b.textContent.trim()) && !b.classList.contains('on')) b.click(); }); }, ms);
    // la cámara NO se mueve al escoger una simulación: el panel escondido A·B·C·D pide su «vista general» 250 ms después del clic; se cancela
    setTimeout(() => { if (T3.anim) T3.anim = null; }, 300); setTimeout(() => { if (T3.anim) T3.anim = null; }, 600);
  }
  /* VISTA INICIAL FIJA: la cámara aparece ya en la vista de pájaro final (la misma de la «vista general»: Bavaria, El Burro, la Av. Ciudad de
     Cali y Corabastos en un cuadro), sin el vuelo de llegada de index.html (T3.llegada) ni zoom. */
  const MOVIL = matchMedia('(max-width: 760px)').matches || /Mobi|Android/i.test(navigator.userAgent);
  const VISTA = { c: [2350, 0, 380], d: [300, 1450, 1650] }; /* desde más arriba (no tan bajo), con algo de horizonte */ /* vista oblicua fija desde el inicio (la misma del modo presentación), sin vuelos */
  function ponerVista() { if (!T3.camera || !T3.orbit) return; T3.anim = null; T3.llegada = null; T3.orbit.target.set(VISTA.c[0], VISTA.c[1], VISTA.c[2]); T3.camera.position.set(VISTA.c[0] + VISTA.d[0], VISTA.d[1], VISTA.c[2] + VISTA.d[2]); T3.orbit.update(); }
  ponerVista();
  { let k = 0; const fija = setInterval(() => { const L = document.getElementById('loader'); if (L && !L.classList.contains('hidden')) { ponerVista(); return; } if (++k < 12) ponerVista(); else clearInterval(fija); }, 250); } // mientras carga y el primer segundo y medio después de abrir
  /* PRECOMPILAR lo que aparece más tarde (estaciones, catenaria y letreros del metro, que se prenden al abrir en la semana 114): si se
     compilan sus sombreadores en ese momento la imagen se congela ~0,5 s; se hace una vez al cargar, con esos grupos visibles un instante */
  setTimeout(function precompilar() {
    const L = document.getElementById('loader'); if (L && !L.classList.contains('hidden')) return void setTimeout(precompilar, 800);
    try { const g = ['metro_l1_estaciones', 'metro_l1_catenaria', 'metro_l1_letreros', 'metro_l1_obra'].map(n => T3.scene.getObjectByName(n)).filter(Boolean);
      const antes = g.map(o => o.visible); g.forEach(o => { o.visible = true; }); if (T3.renderer.compile) T3.renderer.compile(T3.scene, T3.camera); g.forEach((o, i) => { o.visible = antes[i]; }); } catch (e) { /* sin precompilar */ }
  }, 2500);  /* RUIDO QUE SALE DE CADA CARRO: con el mapa de ruido prendido, cada carro de la simulación de tráfico lleva un halo naranja-rojo suave
     (aditivo, ~22 m) que se mueve con él: se ve que el ruido lo producen los carros y que se concentra donde hay más. Una InstancedMesh;
     cada cuadro copia las posiciones de las mallas de carros (grupo 'vehiculos' visible). */
  { const N = 4000, g = new T3.THREE.CircleGeometry(1, 20).rotateX(-Math.PI / 2);
    const m = new T3.THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: T3.THREE.AdditiveBlending, toneMapped: false,
      vertexShader: 'varying vec2 vU; void main(){ vU = position.xz; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); }',
      fragmentShader: 'varying vec2 vU; void main(){ float d = length(vU); float a = (1.0 - smoothstep(0.0, 1.0, d)); gl_FragColor = vec4(vec3(0.95, 0.16, 0.08) * a * a * 0.16, 1.0); }' });
    const halo = new T3.THREE.InstancedMesh(g, m, N); halo.count = 0; halo.frustumCulled = false; halo.renderOrder = 6; halo.name = 'ruido-halos'; T3.scene.add(halo);
    const A = halo.instanceMatrix.array, R = 13, Y = (T3.viaY != null ? T3.viaY : 0.6) + 1.6;
    RELOJ.alDibujar(() => { const plano = T3.scene.getObjectByName('ruido-carros'); if (!plano || !plano.visible || !ESC.activo) { halo.visible = false; return; } halo.visible = true;
      let k = 0; for (const grp of T3.scene.children) { if (grp.name !== 'vehiculos' || !grp.visible) continue;
        grp.traverse(o => { if (!o.isInstancedMesh || !o.visible) return; const B = o.instanceMatrix.array; for (let i = 0; i < o.count && k < N; i++) { const s = i * 16; if (B[s] === 0 && B[s + 5] === 0 && B[s + 10] === 0) continue; const d = k * 16;
          A[d] = R; A[d + 1] = 0; A[d + 2] = 0; A[d + 3] = 0; A[d + 4] = 0; A[d + 5] = 1; A[d + 6] = 0; A[d + 7] = 0; A[d + 8] = 0; A[d + 9] = 0; A[d + 10] = R; A[d + 11] = 0; A[d + 12] = B[s + 12]; A[d + 13] = Y; A[d + 14] = B[s + 14]; A[d + 15] = 1; k++; } }); }
      halo.count = k; halo.instanceMatrix.needsUpdate = true; }); }
  /* PRECARGA: los módulos de las simulaciones se bajan mientras está la portada, para que nada cargue (ni trabe) al darle play */
  for (const m of ['./basura.js?v=2', './cierre_gradual.js?v=5', './predio_trafico.js?v=4', './caminos_instituto.js?v=1', './degradacion.js?v=1', './indicadores.js?v=12', './informe.js?v=7', './capas_pares.js?v=1', './lugares.js?v=4', './abasto_contenedor.js?v=8']) import(m).catch(() => {});

  /* al entrar queda escogida la simulación 1 (estado actual), en el año 1 y en pausa: la misma vista y el mismo panel que al darle «Simulación 1» */
  const autoUno = () => { if (ESC.activo) return; const L = document.getElementById('loader');
    if ((L && !L.classList.contains('hidden')) || !document.querySelector('#esim .seg button[data-e="A"]') || !document.getElementById('lp-sims')) return void setTimeout(autoUno, 400);
    setTimeout(() => { if (!ESC.activo) escoger(1); }, 900); };
  /* al entrar NO queda escogida ninguna simulación: solo la vista normal (pedido de la autora); se escoge con los botones */
  function volar(cual) {
    if (!T3.camera || !T3.orbit) return; const V = T3.THREE.Vector3; let c, d;
    if (cual === 'metro') {
      const M = window.KEN_METRO; let cx, cz;
      if (M && M.punto) { let sx = 0, sz = 0, n = 0; for (let f = 0.2; f <= 0.8; f += 0.1) { const q = M.punto(f * M.largo); sx += q.x != null ? q.x : q[0]; sz += q.z != null ? q.z : q[1]; n++; } cx = sx / n; cz = sz / n; }
      else [cx, cz] = T3.lw(6325, 560);
      c = new V(cx, 0, cz); d = new V(-700, 1500, 1500);
    } else if (cual === 'bavaria') { c = new V(3950, 0, 180); d = new V(-620, 620, 760); }
    else if (cual === 'corabastos') { const [x, z] = T3.lw(5900, 2850); c = new V(x, 0, z); d = new V(-500, 640, 820); }
    else if (cual === 'general') { c = new V(2600, 0, 300); d = new V(-1300, 1700, 2000); }
    else { c = new V(2320, 25, -100); d = new V(-580, 305, 800); }
    T3.anim = { t: 0, dur: 3.0, p0: T3.camera.position.clone(), c0: T3.orbit.target.clone(), p1: c.clone().add(d), c1: c };
  }

  /* trazo de la Línea 1 (simulación 7): naranja tenue mientras está en obra, amarillo encendido desde que opera */
  let trazo = null;
  const armarTrazo = () => {
    const M = window.KEN_METRO; if (trazo || !M || !M.punto) return;
    const THREE = T3.THREE, pts = [], G = (T3.sueloY != null ? T3.sueloY : 0.3) + 13;
    for (let s = 0; s <= M.largo; s += 25) { const q = M.punto(s); pts.push(new THREE.Vector3(q.x != null ? q.x : q[0], G, q.z != null ? q.z : q[1])); }
    if (pts.length < 2) return;
    const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), pts.length * 2, 7, 6, false);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffb02e, transparent: true, opacity: 0.5, depthWrite: false, toneMapped: false });
    trazo = new THREE.Mesh(geo, mat); trazo.renderOrder = 9; trazo.frustumCulled = false; trazo.visible = false; T3.scene.add(trazo);
  };
  RELOJ.alDibujar(() => {
    if (!trazo) { armarTrazo(); if (!trazo) return; }
    trazo.visible = !!ESC.activo; if (!trazo.visible) return; // el metro está en todas
    const m = trazo.material;
    if (RELOJ.sem >= METRO_SEM_OP) { m.color.setHex(0xfff04a); m.opacity = 0.95; }
    else { m.color.setHex(0xff8a1e); m.opacity = 0.35 + 0.25 * (0.5 + 0.5 * Math.sin(RELOJ.tAnim * 3)); }
  });
  return ESC;
}
