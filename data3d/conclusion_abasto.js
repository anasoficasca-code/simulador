/* ============ CONCLUSIÓN GENERAL DEL PAR 01 · ABASTECIMIENTO (informe.js) ============
   conclusionAbasto({ H, B, go, def, parametros, completo }) → { estado, big, eye, frase, veredicto, html, pintar(root) }
   Todo sale de la corrida (I.abasto.ab01 de data3d/simulaciones12.js, una semana por elemento de H; B = la otra mitad del par).
   VEREDICTO (reglas fijas, las mismas para cualquier valor de las variables):
     · GAME OVER: se cumplió una regla de game over 4 semanas seguidas (para el abasto: una zona bajo 80 % de su demanda).
     · SOSTENIBLE: sin game over, ningún sector bajó de 87 % (zona «cerca» del límite, CERCA.abasto) y lo que se le pide a Corabastos
       nunca pasó su tope.
     · PLAUSIBLE CON CONDICIONES: el resto (sin game over, pero Corabastos pasó su tope alguna semana o algún sector se acercó al límite).
   PLANTILLA FIJA de las dos tarjetas: (1) qué se cambió, (2) oferta frente a demanda, (3) si Corabastos y los mercados aguantaron,
   (4) cuándo y dónde falló o por qué aguantó, (5) conclusión y una recomendación: la palanca que más mueve el resultado en la semana
   crítica, calculada con las mismas ecuaciones del modelo (AB01) moviendo cada palanca un cuarto de su rango. */
const nf = (v, d = 0) => (v == null || !isFinite(v) ? '—' : (+v).toLocaleString('es-CO', { minimumFractionDigits: d, maximumFractionDigits: d }));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const añoDe = (sem) => Math.min(15, Math.floor((Math.max(1, sem) - 1) / 52) + 1);
const MES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const T_DIA = 6460, MERC_T = 17;
const FUENTE = { demanda: '0,65 kg/hab/día, DANE-SIPSA 2025 (derivado)', volumen: '6.460 t/día, DANE-SIPSA 2025', coraTope: 'ocupación 90 %, SDDE-FAO 2018 (inferencia)', autoconsumo: 'supuesto, sin dato para Kennedy', pobCrece: 'DANE 2017–2022', mercados: '≈200 t/día, Contraloría 2025 (derivado)' };
/* palancas de política (las variables de estrés —demanda y crecimiento— no son palancas) */
const PAL = [
  { k: 'autoconsumo', n: 'Autoconsumo', paso: 7.5, max: 30, u: ' %' },
  { k: 'mercados', n: 'Mercados', paso: 5, max: 20, u: '' },
  { k: 'coraTope', n: 'Tope de Corabastos', paso: 5, max: 25, u: ' %' },
  { k: 'volumen', n: 'Volumen que recibe Corabastos', paso: 15, max: 120, u: ' %' }];

/* mismas ecuaciones de ab01Paso (simulaciones12.js) en una semana, con las palancas cambiadas: cobertura de Kennedy y carga de Corabastos */
function evaluar(U, x) {
  const demK = U.demK * x.dem / U.dem, auto = x.auto, autoT = auto * demK;
  const porM = U.nAct > 0 ? U.mercT / U.nAct : MERC_T * 0.7, escala = U.demK * (1 - U.auto) > 0 ? demK * (1 - auto) / (U.demK * (1 - U.auto)) : 1;
  const mercT = Math.min(x.nM * MERC_T, Math.max(0, U.mercT * escala + (x.nM - U.nAct) * Math.min(MERC_T, porM * escala)), demK * (1 - auto));
  const RK = Math.max(0, demK - autoT - mercT), L = U.resto + RK, S = U.S * x.vol / U.vol, tope = T_DIA * (1 + x.topeF), lleg = Math.min(L, S, tope), f = L > 0 ? lleg / L : 1;
  return { cob: demK > 0 ? (autoT + mercT + f * RK) / demK : 1, carga: L / tope };
}
export function conclusionAbasto({ H, B = null, go = null, def = {}, parametros = {}, completo = true }) {
  const X = (h) => h && h.abasto && h.abasto.ab01; const W = H.filter(X); if (!W.length) return null;
  const L = W[W.length - 1], UL = X(L), prop = !!def.propuesta, sl = def.sliders || [];
  // --- estadísticas de la corrida ---
  let sCor = 0, sMer = 0, sAut = 0, sDem = 0, maxC = 0, wMaxC = null, sobre = 0, corto = 0, minCob = 9, wMinCob = null, usoS = 0, usoN = 0, usoMax = 0, llenos = 0, minSec = 999, wMinSec = null, secMin = '';
  const peor = new Map();
  W.forEach((h, i) => { const U = X(h); sCor += U.coraK; sMer += U.mercT; sAut += U.autoT; sDem += U.demK;
    if (U.carga > maxC) { maxC = U.carga; wMaxC = h; } if (U.carga > 1) sobre++; if (U.S < U.L * 0.995 && U.S <= U.tope) corto++; // la región manda al menos 0,5 % menos de lo pedido
    if (U.cobK < minCob) { minCob = U.cobK; wMinCob = h; }
    if (U.mercCap > 0) { const u = U.mercT / U.mercCap; usoS += u; usoN++; if (u > usoMax) usoMax = u; if (u > 0.995) llenos++; }
    const cm = (h.comidaMin != null ? h.comidaMin : 1) * 100; if (cm < minSec) { minSec = cm; wMinSec = h; }
    if (i % 2 === 0 || i === W.length - 1) for (const s of (h.evaluacion && h.evaluacion.territorio && h.evaluacion.territorio.sectores) || []) { const p = peor.get(s.n); if (!p || s.valor < p.v) peor.set(s.n, { v: s.valor, sem: h.sem }); } });
  if (wMinSec) { const ss = (wMinSec.evaluacion && wMinSec.evaluacion.territorio && wMinSec.evaluacion.territorio.sectores) || []; const s = ss.reduce((a, b) => (b.valor < a.valor ? b : a), ss[0] || { n: '' }); secMin = s.n; }
  const peores = [...peor.entries()].sort((a, b) => a[1].v - b[1].v).slice(0, 3).map(([n, p]) => ({ n, ...p }));
  const usoM = usoN ? usoS / usoN : 0, a1 = W.slice(0, Math.min(52, W.length)), aN = W.slice(-Math.min(52, W.length));
  const prom = (A, k) => A.reduce((a, h) => a + X(h)[k], 0) / A.length, dem1 = prom(a1, 'demK'), demN = prom(aN, 'demK');
  const estado = go ? 'go' : minSec >= 87 && sobre === 0 ? 'sostenible' : 'plausible';
  // --- semana crítica y sensibilidad ---
  const crit = go ? (W.find(h => h.sem === go.sem) || L) : minSec < 87 ? wMinSec : wMaxC || L, UC = X(crit);
  const base = { dem: UC.dem, vol: UC.vol, topeF: UC.topeF, auto: UC.auto, nM: prop ? UC.nM : 0 }, r0 = evaluar(UC, base);
  const problema = go || minSec < 87 ? 'cob' : sobre > 0 ? 'tope' : 'margen';
  const sens = PAL.map(P => { const x = { ...base }; let de, a;
    if (P.k === 'autoconsumo') { de = base.auto * 100; a = Math.min(P.max, de + P.paso); x.auto = a / 100; }
    else if (P.k === 'mercados') { de = base.nM; a = Math.min(P.max, de + P.paso); x.nM = a; }
    else if (P.k === 'coraTope') { de = base.topeF * 100; a = Math.min(P.max, de + P.paso); x.topeF = a / 100; }
    else { de = base.vol * 100; a = Math.min(P.max, de + P.paso); x.vol = a / 100; }
    const r = evaluar(UC, x), dCob = (r.cob - r0.cob) * 100, dCar = (r.carga - r0.carga) * 100;
    return { ...P, de, a, dCob, dCar, score: problema === 'cob' ? dCob + 0.05 * -dCar : -dCar + 0.05 * dCob, agotada: a <= de + 1e-9 }; });
  const mejor = sens.filter(s => !s.agotada).sort((a, b) => b.score - a.score)[0] || null;
  // --- textos (plantilla fija) ---
  const cambios = sl.filter(s => parametros[s.k] != null && Math.abs(+parametros[s.k] - s.val) > 1e-9).map(s => `${s.n} ${nf(parametros[s.k], s.paso < 1 ? 1 : 0)} ${s.unidad} (por defecto ${nf(s.val, s.paso < 1 ? 1 : 0)}: ${FUENTE[s.k] || 'ver fuentes'})`);
  const t1 = cambios.length ? `Se cambió: ${cambios.join('; ')}. Lo demás quedó en los valores con fuente.` : `Se usaron los valores por defecto, todos con fuente: demanda 0,65 kg/hab/día y 6.460 t/día en Corabastos (DANE-SIPSA 2025), tope +11 % (inferencia SDDE-FAO 2018), crecimiento 0,5 %/año (DANE)${prop ? ', 12 mercados de 17 t/día (Contraloría 2025)' : ''} y autoconsumo 0 % (supuesto).`;
  const pc = (v) => nf(v / sDem * 100, 1);
  const t2 = `La demanda de frescos de Kennedy pasó de ${nf(dem1)} t/día en el año 1 a ${nf(demN)} t/día en el año ${añoDe(L.sem)}. En toda la corrida la cubrieron Corabastos ${pc(sCor)} %, los mercados ${pc(sMer)} % y el autoconsumo ${pc(sAut)} %; Kennedy recibió en su peor semana ${nf(minCob * 100, 1)} % de lo que necesitaba (año ${añoDe(wMinCob.sem)}).`;
  const mC = X(wMaxC), mesC = MES[mC.mes];
  const t3 = `Corabastos llegó a ${nf(maxC * 100)} % de su tope (${nf(mC.L)} de ${nf(mC.tope)} t/día, ${mesC} del año ${añoDe(wMaxC.sem)}) y ${sobre ? `le pidieron más que su tope ${nf(sobre)} semanas` : 'nunca le pidieron más que su tope'}${corto ? `; en ${nf(corto)} semanas la región mandó menos de lo pedido` : ''}. ${prop ? (usoN ? `Los mercados usaron en promedio ${nf(usoM * 100)} % de su capacidad (máximo ${nf(usoMax * 100)} %${llenos ? `, ${nf(llenos)} semanas todos llenos` : ', nunca todos llenos'}).` : 'No hubo mercados abiertos.') : 'Sin propuesta no hay mercados que repartan la carga.'}`;
  let t4;
  if (go) { const U = X(crit) || UC, causa = U.S < U.L - 1e-6 && U.S <= U.tope ? `la región mandó ${nf(U.S)} t/día y se pedían ${nf(U.L)}: faltó volumen` : U.L > U.tope ? `se pedían ${nf(U.L)} t/día y el tope es ${nf(U.tope)}: Corabastos no puede recibir más` : 'el faltante se concentró en las zonas lejos de Corabastos';
    t4 = `Falló en el año ${añoDe(go.sem)} (semana ${nf(go.sem)}): ${esc(go.lugar || 'un sector')} recibió ${nf(go.valor, 1)} % de su demanda cuatro semanas seguidas. Causa: ${causa}.`; }
  else t4 = `No falló${completo ? ' en los 15 años' : ' hasta ahora'}: el sector peor servido fue ${esc(secMin)} con ${nf(minSec, 1)} % (año ${añoDe(wMinSec.sem)}). ${sobre === 0 && minSec >= 87 ? 'Aguantó porque lo pedido a Corabastos quedó bajo su tope' + (prop && sMer > 0 ? ' y los mercados tomaron parte de la carga' : '') + '.' : sobre > 0 ? 'Aguantó porque el exceso sobre el tope fue corto y se repartió entre todos los compradores de la ciudad, pero no hay margen.' : 'Aguantó, aunque algún sector se acercó al límite de 80 %.'}`;
  const accion = (s) => s.k === 'autoconsumo' ? `subir el autoconsumo (huertas y producción propia) de ${nf(s.de)} % a ${nf(s.a)} %`
    : s.k === 'mercados' ? (prop ? `abrir más mercados de 17 t/día: de ${nf(s.de)} a ${nf(s.a)}` : `pasar a la red de la propuesta con ${nf(s.a)} mercados de 17 t/día`)
    : s.k === 'coraTope' ? `ampliar la capacidad de Corabastos o abrir una central satélite (recomendación de SDDE-FAO 2018): tope de +${nf(s.de)} % a +${nf(s.a)} %`
    : `asegurar más oferta de la región (acuerdos con productores y circuitos cortos): volumen de ${nf(s.de)} % a ${nf(s.a)} %`;
  const efecto = (s) => `${s.dCob >= 0 ? '+' : '−'}${nf(Math.abs(s.dCob), 1)} pts de cobertura y ${s.dCar <= 0 ? '−' : '+'}${nf(Math.abs(s.dCar), 1)} pts de carga de Corabastos`;
  const VERD = { go: 'Game over', sostenible: 'Sostenible', plausible: 'Plausible con condiciones' };
  const t5 = `${VERD[estado]}${completo || go ? '' : ' (hasta ahora)'}. ${mejor && (Math.abs(mejor.dCob) > 0.05 || Math.abs(mejor.dCar) > 0.05) ? `Recomendación: ${accion(mejor)}. En la semana crítica (año ${añoDe(crit.sem)}) es la palanca que más mueve el resultado: ${efecto(mejor)}.` : 'Recomendación: mantener estas condiciones; ninguna palanca cambia el resultado en la semana crítica.'}`;
  // --- tarjetas ---
  const pasos = (arr) => `<ol class="c01-ol">${arr.map(([k, t]) => `<li><b>${k}</b><span>${t}</span></li>`).join('')}</ol>`;
  const tabla = `<table class="c01-sens"><thead><tr><th>Palanca · un cuarto de su rango</th><th>Cobertura</th><th>Carga</th></tr></thead><tbody>${sens.map(s => `<tr class="${mejor && s.k === mejor.k ? 'mx' : ''}"><td>${esc(s.n)} ${s.agotada ? '(al máximo)' : `${nf(s.de, s.k === 'autoconsumo' ? 1 : 0)} → ${nf(s.a, s.k === 'autoconsumo' ? 1 : 0)}${s.u}`}</td><td>${s.dCob >= 0 ? '+' : '−'}${nf(Math.abs(s.dCob), 1)} pts</td><td>${s.dCar <= 0 ? '−' : '+'}${nf(Math.abs(s.dCar), 1)} pts</td></tr>`).join('')}</tbody></table>`;
  const html = `<section class="c01" data-a style="--d:1300" aria-labelledby="c01-t"><div class="c01-h"><span class="i2-lab">Conclusión general</span><h3 id="c01-t" class="c01-v ${estado}">${VERD[estado]}${completo || go ? '' : ' · hasta el año ' + añoDe(L.sem)}</h3></div>
    <div class="c01-g">
      <article class="c01-c i2-panel"><h4>¿Alcanza la comida?</h4><p class="c01-s">Comida fresca que recibe Kennedy (t/día): Corabastos, mercados y autoconsumo frente a la demanda y la línea de 80 %.</p><div class="c01-fig" data-c01="1"></div>
        ${pasos([['1 · Qué se cambió', esc(t1)], ['2 · Oferta y demanda', esc(t2)]])}</article>
      <article class="c01-c i2-panel"><h4>¿Aguanta el sistema?</h4><p class="c01-s">Lo que se le pide a Corabastos frente a su tope y el uso de los mercados (%), con los sectores peor servidos.</p><div class="c01-fig" data-c01="2"></div>
        ${pasos([['3 · Corabastos y mercados', esc(t3)], ['4 · Cuándo y dónde', esc(t4)], ['5 · Conclusión', esc(t5)]])}${tabla}</article>
    </div></section>`;
  // --- diagramas (se dibujan al ancho real) ---
  const muestra = []; for (let i = 0; i < W.length; i += 4) muestra.push(W[i]); if (muestra[muestra.length - 1] !== L) muestra.push(L);
  const BB = B && B.length ? B.filter(X) : null, muestraB = BB ? (() => { const r = []; for (let i = 0; i < BB.length && BB[i].sem <= L.sem; i += 4) r.push(BB[i]); return r; })() : null; // la otra mitad solo hasta la semana de esta corrida
  const FIN = Math.max(52, Math.ceil(L.sem / 52) * 52), nA = FIN / 52; // eje: los años corridos (un game over temprano no queda aplastado)
  const ejeX = (x, w, h) => { let s = ""; if (nA === 1) { for (const k of [1, 13, 26, 39, 52]) s += `<text x="${x(k).toFixed(1)}" y="${h - 6}" text-anchor="middle">sem ${k}</text>`; return s; } for (let a = 1; a <= nA; a += (w < 420 || nA > 10 ? 2 : 1)) s += `<text x="${x((a - 1) * 52 + 1).toFixed(1)}" y="${h - 6}" text-anchor="middle">${a}</text>`; return s; };
  function fig1(w) {
    const h = 200, pl = 42, pr = 10, pt = 10, pb = 22, iw = w - pl - pr, ih = h - pt - pb, mx = Math.max(...muestra.map(q => Math.max(X(q).demK, X(q).coraK + X(q).mercT + X(q).autoT))) * 1.08;
    const x = (s) => pl + (s - 1) / (FIN - 1) * iw, y = (v) => pt + ih - v / mx * ih;
    const capa = (f0, f1) => { const a = muestra.map(q => `${x(q.sem).toFixed(1)},${y(f1(X(q))).toFixed(1)}`), b = muestra.slice().reverse().map(q => `${x(q.sem).toFixed(1)},${y(f0(X(q))).toFixed(1)}`); return a.concat(b).join(' '); };
    const lin = (f) => muestra.map((q, i) => `${i ? 'L' : 'M'}${x(q.sem).toFixed(1)} ${y(f(X(q))).toFixed(1)}`).join('');
    let s = `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="Oferta frente a demanda de Kennedy en 15 años">`;
    const pasoY = mx > 600 ? 200 : 100; for (let v = 0; v <= mx; v += pasoY) s += `<line x1="${pl}" x2="${w - pr}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}" stroke="var(--grid)"/><text x="${pl - 6}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end">${nf(v)}</text>`;
    s += ejeX(x, w, h);
    s += `<defs><linearGradient id="c01-g1" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#7d6bff" stop-opacity=".75"/><stop offset="1" stop-color="#304ffe" stop-opacity=".3"/></linearGradient></defs>`;
    s += `<polygon points="${capa(() => 0, U => U.coraK)}" fill="url(#c01-g1)"/><polygon points="${capa(U => U.coraK, U => U.coraK + U.mercT)}" fill="#c08f1c" fill-opacity=".8"/><polygon points="${capa(U => U.coraK + U.mercT, U => U.coraK + U.mercT + U.autoT)}" fill="#22a89d" fill-opacity=".85"/>`;
    s += `<path d="${lin(U => U.demK)}" fill="none" stroke="var(--ink)" stroke-width="1.8"/><path d="${lin(U => 0.8 * U.demK)}" fill="none" stroke="var(--s-lim)" stroke-width="1.5" stroke-dasharray="5 4"/>`;
    if (go) s += `<line x1="${x(go.sem).toFixed(1)}" x2="${x(go.sem).toFixed(1)}" y1="${pt}" y2="${pt + ih}" stroke="var(--s-crit)" stroke-dasharray="2 3"/><text x="${(x(go.sem) + (x(go.sem) < pl + 90 ? 4 : -4)).toFixed(1)}" y="${pt + 10}" text-anchor="${x(go.sem) < pl + 90 ? 'start' : 'end'}" fill="var(--mal)">game over</text>`;
    const tot = sCor + sMer + sAut || 1, seg = [[sCor, '#7d6bff', 'Corabastos'], [sMer, '#c08f1c', 'Mercados'], [sAut, '#22a89d', 'Autoconsumo']];
    let a0 = -Math.PI / 2, dona = '<svg viewBox="0 0 96 96" width="96" height="96" role="img" aria-label="Quién cubrió la demanda en toda la corrida">';
    const Pp = (r, a) => `${(48 + r * Math.cos(a)).toFixed(2)} ${(48 + r * Math.sin(a)).toFixed(2)}`;
    for (const [v, c, n] of seg) { if (!(v > 0)) continue; const a1 = a0 + v / tot * Math.PI * 2 - (v >= tot ? 1e-3 : 0), L = a1 - a0 > Math.PI ? 1 : 0; dona += `<path d="M${Pp(44, a0)}A44 44 0 ${L} 1 ${Pp(44, a1)}L${Pp(29, a1)}A29 29 0 ${L} 0 ${Pp(29, a0)}Z" fill="${c}" stroke="var(--bg)" stroke-width="1.5"><title>${n}: ${nf(v / tot * 100, 1)} %</title></path>`; a0 = a1; }
    dona += `<text x="48" y="47" text-anchor="middle" class="c01-dn">${nf(sCor / tot * 100)}%</text><text x="48" y="59" text-anchor="middle" class="c01-dl">Corabastos</text></svg>`;
    const parte = `<div class="c01-part">${dona}<ul>${seg.map(([v, c, n]) => `<li><i style="background:${c}"></i>${n}<b>${nf(v / tot * 100, 1)} %</b></li>`).join('')}</ul></div>`;
    return s + '</svg>' + parte + `<div class="c01-ley"><span><i style="background:#7d6bff"></i>Corabastos</span><span><i style="background:#c08f1c"></i>Mercados</span><span><i style="background:#22a89d"></i>Autoconsumo</span><span><i class="l"></i>Demanda</span><span><i class="l r"></i>80 % de la demanda</span></div>`;
  }
  function fig2(w) {
    const h = 200, pl = 42, pr = 10, pt = 10, pb = 22, iw = w - pl - pr, ih = h - pt - pb;
    const vals = muestra.map(q => X(q).carga * 100).concat(muestraB ? muestraB.map(q => X(q).carga * 100) : []), mn = Math.max(0, Math.floor(Math.min(60, ...vals, ...(usoN ? muestra.map(q => X(q).mercCap ? X(q).mercT / X(q).mercCap * 100 : 100) : [])) / 10) * 10), mx = Math.max(110, Math.ceil(Math.max(...vals) / 10) * 10 + 5);
    const x = (s) => pl + (s - 1) / (FIN - 1) * iw, y = (v) => pt + ih - (v - mn) / (mx - mn) * ih;
    const lin = (A, f) => A.filter(q => f(X(q)) != null).map((q, i) => `${i ? 'L' : 'M'}${x(q.sem).toFixed(1)} ${y(f(X(q))).toFixed(1)}`).join('');
    let s = `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="Carga de Corabastos frente a su tope y uso de los mercados">`;
    for (let v = mn; v <= mx; v += 20) s += `<line x1="${pl}" x2="${w - pr}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}" stroke="var(--grid)"/><text x="${pl - 6}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end">${v} %</text>`;
    s += ejeX(x, w, h);
    s += `<rect x="${pl}" y="${pt}" width="${iw}" height="${Math.max(0, y(100) - pt).toFixed(1)}" fill="var(--s-lim)" fill-opacity=".08"/><line x1="${pl}" x2="${w - pr}" y1="${y(100).toFixed(1)}" y2="${y(100).toFixed(1)}" stroke="var(--s-lim)" stroke-width="1.5" stroke-dasharray="5 4"/><text x="${w - pr}" y="${(y(100) - 4).toFixed(1)}" text-anchor="end" fill="var(--mal)">tope</text>`;
    if (muestraB) s += `<path d="${lin(muestraB, U => U.carga * 100)}" fill="none" stroke="${prop ? '#f2694a' : '#7d6bff'}" stroke-width="1.5" stroke-dasharray="4 3"/>`;
    s += `<path d="${lin(muestra, U => U.carga * 100)}" fill="none" stroke="${prop ? '#7d6bff' : '#f2694a'}" stroke-width="2"/>`;
    if (usoN) s += `<path d="${lin(muestra, U => (U.mercCap ? U.mercT / U.mercCap * 100 : null))}" fill="none" stroke="#c08f1c" stroke-width="1.6"/>`;
    s += '</svg>';
    const barras = peores.map(p => `<div class="c01-b"><span>${esc(p.n)}</span><i><b style="width:${Math.max(2, Math.min(100, p.v)).toFixed(1)}%;background:${p.v < 80 ? 'var(--s-crit)' : p.v < 87 ? 'var(--amb)' : 'var(--s-con)'}"></b><em style="left:80%"></em></i><span>${nf(p.v, 1)} % · año ${añoDe(p.sem)}</span></div>`).join('');
    return s + `<div class="c01-ley"><span><i class="l" style="border-color:${prop ? '#7d6bff' : '#f2694a'}"></i>Corabastos (${prop ? 'con' : 'sin'} propuesta)</span>${muestraB ? `<span><i class="l d" style="border-color:${prop ? '#f2694a' : '#7d6bff'}"></i>${prop ? 'Sin' : 'Con'} propuesta</span>` : ''}${usoN ? '<span><i class="l" style="border-color:#c08f1c"></i>Uso de los mercados</span>' : ''}<span><i class="l r"></i>Tope</span></div><div class="c01-bs"><small>Sectores peor servidos (mínimo de la corrida; raya = 80 %)</small>${barras}</div>`;
  }
  function pintar(root) { if (!document.getElementById('c01-css')) { const st = document.createElement('style'); st.id = 'c01-css'; st.textContent = CSS; document.head.appendChild(st); }
    root.querySelectorAll('[data-c01]').forEach(el => { const w = Math.max(260, Math.floor(el.clientWidth || 320)); el.innerHTML = el.dataset.c01 === '1' ? fig1(w) : fig2(w); }); }
  const frase = estado === 'go' ? null : estado === 'sostenible' ? `Sin game over${completo ? ' en los 15 años' : ''}: ningún sector bajó de 87 % y lo pedido a Corabastos nunca pasó su tope (máximo ${nf(maxC * 100)} %).`
    : `Sin game over${completo ? ' en los 15 años' : ''}, con condiciones: ${sobre ? `a Corabastos le pidieron más que su tope ${nf(sobre)} semanas (máximo ${nf(maxC * 100)} %)` : 'Corabastos no pasó su tope'}${minSec < 87 ? ` y el sector peor servido bajó a ${nf(minSec, 1)} %` : ''}.`;
  return { estado, big: VERD[estado] === 'Plausible con condiciones' ? 'Plausible' : VERD[estado], eye: estado === 'go' ? 'Resultado · condición crítica sostenida' : `¿Fue sostenible? · ${VERD[estado]}`, frase, veredicto: estado === 'sostenible' ? 'Sí' : estado === 'go' ? 'No' : 'En parte', html, pintar, textos: [t1, t2, t3, t4, t5], sens, mejor };
}
const CSS = `
.inf2 .c01 { margin-top: 18px; grid-column: 1 / -1; min-width: 0; }
.inf2 .c01-h { display: flex; align-items: baseline; gap: 14px; flex-wrap: wrap; margin-bottom: 10px; }
.inf2 .c01-v { margin: 0; font: 300 clamp(26px, 3vw, 40px)/1 var(--num); letter-spacing: .04em; text-transform: uppercase; }
.inf2 .c01-v.go { color: #ff7a59; } .inf2 .c01-v.sostenible { color: #d5ff3f; } .inf2 .c01-v.plausible { color: #ffd27a; }
.inf2 .c01-part { display: flex; align-items: center; gap: 16px; margin: 10px 0 2px; padding: 10px 12px; border-radius: 14px; background: rgba(125,107,255,.07); border: 1px solid rgba(169,156,255,.14); }
.inf2 .c01-part svg { flex: none; }
.inf2 .c01-part ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; font-size: 12.5px; color: var(--ink2); flex: 1; min-width: 0; }
.inf2 .c01-part li { display: grid; grid-template-columns: 10px 1fr auto; gap: 8px; align-items: center; }
.inf2 .c01-part li i { width: 10px; height: 10px; border-radius: 50%; } .inf2 .c01-part li b { font: 300 20px/1 var(--num); color: var(--ink); }
.inf2 .c01-fig text.c01-dn { font: 200 22px var(--num); fill: var(--ink); } .inf2 .c01-fig text.c01-dl { font: 600 6.6px Geist, Inter, sans-serif; letter-spacing: .04em; text-transform: uppercase; fill: var(--mut); }
.inf2 .c01-g { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
@media (max-width: 900px) { .inf2 .c01-g { grid-template-columns: 1fr; } }
.inf2 .c01-c { padding: 16px 18px 14px; border-radius: 18px; min-width: 0; border-top: 2px solid rgba(125,107,255,.55); }
.inf2 .c01-c h4 { margin: 0; font: 300 26px/1.1 var(--num); letter-spacing: .06em; text-transform: uppercase; color: var(--ink); }
.inf2 .c01-s { font-size: 12.5px; color: var(--mut); margin: 4px 0 10px; }
.inf2 .c01-fig svg { display: block; max-width: 100%; height: auto; overflow: visible; }
.inf2 .c01-fig text { font: 11px Geist, Inter, system-ui, sans-serif; fill: var(--mut); font-variant-numeric: tabular-nums; }
.inf2 .c01-ley { display: flex; flex-wrap: wrap; gap: 4px 14px; font-size: 11.5px; color: var(--ink2); margin: 6px 0 4px; }
.inf2 .c01-ley span { display: inline-flex; align-items: center; gap: 6px; }
.inf2 .c01-ley i { width: 12px; height: 8px; border-radius: 2px; display: inline-block; }
.inf2 .c01-ley i.l { width: 16px; height: 0; border-top: 2px solid var(--ink); border-radius: 0; }
.inf2 .c01-ley i.l.r { border-top: 2px dashed var(--s-lim); } .inf2 .c01-ley i.l.d { border-top-style: dashed; }
.inf2 .c01-ol { list-style: none; margin: 12px 0 0; padding: 0; display: grid; gap: 9px; }
.inf2 .c01-ol li { display: grid; gap: 2px; padding-top: 9px; border-top: 1px solid var(--line2); }
.inf2 .c01-ol b { font: 600 11px/1.2 Geist, Inter, system-ui, sans-serif; letter-spacing: .12em; text-transform: uppercase; color: var(--tone); }
.inf2 .c01-ol span { font-size: 13.5px; line-height: 1.5; color: var(--ink2); }
.inf2 .c01-bs { display: grid; gap: 5px; margin-top: 8px; }
.inf2 .c01-bs small { font-size: 11px; color: var(--mut); }
.inf2 .c01-b { display: grid; grid-template-columns: minmax(80px, 1fr) minmax(90px, 2fr) auto; gap: 8px; align-items: center; font-size: 12px; color: var(--ink2); }
.inf2 .c01-b i { position: relative; height: 8px; border-radius: 4px; background: var(--track); }
.inf2 .c01-b i b { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 4px; }
.inf2 .c01-b i em { position: absolute; top: -3px; bottom: -3px; width: 2px; background: var(--s-lim); }
.inf2 .c01-b span:last-child { font-variant-numeric: tabular-nums; white-space: nowrap; }
.inf2 .c01-sens { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; font-variant-numeric: tabular-nums; }
.inf2 .c01-sens th { text-align: right; font-weight: 500; color: var(--mut); padding: 4px 6px; border-bottom: 1px solid var(--line); }
.inf2 .c01-sens th:first-child, .inf2 .c01-sens td:first-child { text-align: left; }
.inf2 .c01-sens td { text-align: right; padding: 5px 6px; border-bottom: 1px solid var(--line2); color: var(--ink2); }
.inf2 .c01-sens tr.mx td { color: var(--ink); background: var(--tone-bg); font-weight: 600; }
@media (max-width: 480px) { .inf2 .c01-c { padding: 14px 12px; } .inf2 .c01-ol span { font-size: 13px; } }
`;
