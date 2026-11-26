/* ============ GRÁFICAS VIVAS (primitivas SVG del tablero de datos, panel_datos.js) ============
   Cada gráfica se crea UNA vez y luego solo se le cambian atributos (d de los caminos, posiciones, rellenos): nada de rehacer innerHTML
   en cada semana. Sin librerías. Paleta validada con dataviz/validate_palette.js sobre la superficie de vidrio oscuro #1e2422 (modo oscuro):
   · con propuesta #338ced (continua) / sin propuesta #e76624 (punteada): PASA (CVD ΔE 27,5; normal 33,3; contraste ≥ 3:1)
   · causas de muerte #00a888 #d28e05 #9887ef #e24d8b y fuentes de abasto #00a888 #d28e05 #9887ef: PASA (peor par adyacente CVD 11,1; normal 20,1)
   · rampa secuencial azul #1757ac → #cce3fd (mapa de calor, ordinal): PASA (monótona, un solo tono, extremo claro 2,25:1 sobre la superficie)
   · estados (reservados, siempre con ícono + texto): sano #0aac23, en riesgo #fbb315, crítico #dc3c3d */

/* 2026-11-25: paleta URBIA + morados de la portada (graficas_arte.js, validada con el mismo validador sobre #1e2422 y #14161b):
   con propuesta #7d6bff (continua) / sin propuesta #f2694a (punteada): PASA · límite #ffd27a (rotulado, punteado) · categórica #7d6bff #c08f1c #22a89d #f2694a: PASA
   · rampa morada #4c46cf → #d4ceff: PASA (monótona, un tono). Las cifras del comentario de arriba son de la paleta anterior (azul/naranja). */
export const COL = { con: '#7d6bff', sin: '#f2694a', lim: '#ffd27a' };
export const CAT = ['#7d6bff', '#c08f1c', '#22a89d', '#f2694a'];
export const SEQ = ['#4c46cf', '#5b4bff', '#7d6bff', '#a99cff', '#d4ceff'];
export const ESTADO = { sano: { n: 'Sano', c: '#0aac23' }, riesgo: { n: 'En riesgo', c: '#fbb315' }, critico: { n: 'Crítico', c: '#dc3c3d' } };
const ICONO = { sano: '<circle cx="5" cy="5" r="4"/>', riesgo: '<path d="M5 .8 9.4 9H.6z"/>', critico: '<path d="M5 .4 9.6 5 5 9.6.4 5z"/>' };
export const icono = (k, t = 10) => `<svg class="tb-ico" viewBox="0 0 10 10" width="${t}" height="${t}" aria-hidden="true" fill="${ESTADO[k].c}">${ICONO[k]}</svg>`;

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const fin = (v) => (v != null && isFinite(v) ? +v : null);
export const num = (v, d = 0) => (v == null || !isFinite(v) ? '—' : (+v).toLocaleString('es-CO', { minimumFractionDigits: d, maximumFractionDigits: d }));
export const año = (sem) => Math.min(15, Math.floor((sem - 1) / 52) + 1);
const NS = 'http://www.w3.org/2000/svg';
export function nodo(tag, at, padre) { const e = document.createElementNS(NS, tag); for (const k in at) e.setAttribute(k, at[k]); if (padre) padre.appendChild(e); return e; }
const fija = (e, at) => { for (const k in at) { const v = String(at[k]); if (e.getAttribute(k) !== v) e.setAttribute(k, v); } };

/* clave de serie (leyenda y tooltip): línea continua, punteada, barra o raya */
export const clave = (c, tipo) => tipo === 'barra' ? `<svg width="10" height="8" aria-hidden="true"><rect y="1" width="10" height="6" rx="1.5" fill="${c}"/></svg>`
  : tipo === 'tick' ? `<svg width="6" height="10" aria-hidden="true"><rect x="2" width="2" height="10" fill="${c}"/></svg>`
  : tipo === 'hueca' ? `<svg width="10" height="8" aria-hidden="true"><rect x=".5" y="1.5" width="9" height="5" rx="1.5" fill="${c}" fill-opacity=".35" stroke="${c}" stroke-dasharray="2 1.5"/></svg>`
  : `<svg width="16" height="6" aria-hidden="true"><line x1="0" x2="16" y1="3" y2="3" stroke="${c}" stroke-width="2"${tipo === 'pun' ? ' stroke-dasharray="4 3"' : ''}/></svg>`;

/* marcas «limpias» del eje Y */
export function marcas(mn, mx, n = 3) {
  if (!(mx > mn)) { const d = Math.abs(mn) * 0.1 || 1; mn -= d; mx += d; }
  const p0 = (mx - mn) / (n - 1), p = Math.pow(10, Math.floor(Math.log10(p0))), m = p0 / p, paso = (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p;
  const a = Math.floor(mn / paso + 1e-9) * paso, b = Math.ceil(mx / paso - 1e-9) * paso, t = [];
  for (let v = a; v <= b + paso * 1e-6; v += paso) t.push(+v.toFixed(10));
  return { t, a, b, paso };
}
export const fmtEje = (v, paso) => Math.abs(v) >= 10000 ? num(v / 1000, Math.abs(v) >= 100000 ? 0 : 1) + ' K' : num(v, paso < 0.1 ? 2 : paso < 1 ? 1 : 0);
const camino = (xs, ys, X, Y) => { let d = '', on = false; for (let i = 0; i < xs.length; i++) { const v = ys[i]; if (v == null) { on = false; continue; } d += (on ? 'L' : 'M') + X(xs[i]).toFixed(1) + ' ' + Y(v).toFixed(1); on = true; } return d; };
/* barras con extremo de dato redondeado (4 px) y base cuadrada */
export const barraH = (x, y, w, h) => { if (w <= 0.5) return ''; const r = Math.min(4, w, h / 2); return `M${x} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x}Z`; };
export const barraV = (x, y, w, h, r = 4) => { if (h <= 0.5) return ''; r = Math.min(r, w / 2, h); return `M${x} ${y + h}V${y + r}Q${x} ${y} ${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h}Z`; };

/* ---------- tooltip único (posición fija) ---------- */
let TIP = null;
export function tip() {
  if (TIP) return TIP;
  const e = document.createElement('div'); e.id = 'tb-tip'; e.setAttribute('role', 'status'); document.body.appendChild(e);
  TIP = {
    mostrar(html, x, y) {
      e.innerHTML = html; e.style.display = 'block';
      const w = e.offsetWidth, h = e.offsetHeight, vw = innerWidth, vh = innerHeight;
      let l = x + 14, t = y - h - 10; if (l + w > vw - 8) l = x - w - 14; if (l < 8) l = 8; if (t < 8) t = y + 16; if (t + h > vh - 8) t = vh - h - 8;
      e.style.left = l + 'px'; e.style.top = t + 'px';
    },
    ocultar() { e.style.display = 'none'; }
  };
  return TIP;
}
export const filaTip = (k, v, n) => `<div class="r">${k}<b>${v}</b><span>${esc(n)}</span></div>`;

/* ---------- eje X de 15 años (compartido) ---------- */
function ejeAños(g, X, y0, alto, W, FIN) {
  let s = ''; const todos = W >= 300;
  for (let a = 1; a <= Math.round(FIN / 52); a++) {
    const x = X((a - 1) * 52 + 1).toFixed(1), lab = todos ? true : a === 1 || a % 2 === 1;
    s += `<line x1="${x}" x2="${x}" y1="${y0}" y2="${y0 + 3}" stroke="var(--tb-axis)"/>`;
    if (lab) s += `<text x="${x}" y="${alto - 2}" text-anchor="${a === 1 ? 'start' : 'middle'}">${a}</text>`;
  }
  g.innerHTML = s;
}

/* =========================================================================================================
   LÍNEA DE 15 AÑOS: con propuesta (continua) y sin propuesta (punteada), límite con su etiqueta, zona «cerca» y zona superada,
   lavado del área de esta corrida, punto de «ahora», cruz que sigue al puntero o a las flechas.
   ========================================================================================================= */
export class Linea {
  constructor(host, op) {
    this.op = op; this.alto = op.alto || 92; this.D = null; this.i = -1;
    const s = this.svg = nodo('svg', { class: 'tb-svg tb-lin', height: this.alto, tabindex: 0, role: 'img' }, host);
    const gid = 'tbG' + (++Linea.n), df = nodo('defs', {}, s), lg = nodo('linearGradient', { id: gid, x1: 0, x2: 0, y1: 0, y2: 1 }, df);
    this.stops = [nodo('stop', { offset: 0, 'stop-opacity': 0.42 }, lg), nodo('stop', { offset: 1, 'stop-opacity': 0 }, lg)];
    this.gBan = nodo('g', {}, s); this.gY = nodo('g', { class: 'tb-ejey' }, s); this.gX = nodo('g', { class: 'tb-ejex' }, s);
    this.pArea = nodo('path', { fill: `url(#${gid})` }, s);
    this.lLim = nodo('line', { stroke: COL.lim, 'stroke-width': 1.5, 'stroke-dasharray': '4 3', visibility: 'hidden' }, s);
    this.tLim = nodo('text', { class: 'tb-tn', 'text-anchor': 'end', visibility: 'hidden' }, s);
    this.pSin = nodo('path', { fill: 'none', stroke: COL.sin, 'stroke-width': 2, 'stroke-dasharray': '5 3', 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, s);
    this.pCon = nodo('path', { fill: 'none', stroke: COL.con, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, s);
    this.cFin = nodo('circle', { class: 'tb-fin', r: 4, stroke: 'var(--tb-sur)', 'stroke-width': 2, visibility: 'hidden' }, s);
    this.xL = nodo('line', { stroke: 'var(--ui-tx2,#c9cfc4)', 'stroke-width': 1, visibility: 'hidden' }, s);
    this.xA = nodo('circle', { r: 3.5, fill: COL.con, stroke: 'var(--tb-sur)', 'stroke-width': 2, visibility: 'hidden' }, s);
    this.xB = nodo('circle', { r: 3.5, fill: COL.sin, stroke: 'var(--tb-sur)', 'stroke-width': 2, visibility: 'hidden' }, s);
    this.hit = nodo('rect', { fill: 'transparent', y: 0, height: this.alto }, s);
    this.claveY = ''; this.claveX = '';
    s.addEventListener('pointermove', (e) => { if (!this.D) return; const r = s.getBoundingClientRect(); this.cruz(this.cercano(e.clientX - r.left), e.clientX, e.clientY); });
    s.addEventListener('pointerleave', () => this.quitar());
    s.addEventListener('focus', () => { if (this.D) this.cruz(this.D.xs.length - 1); });
    s.addEventListener('blur', () => this.quitar());
    s.addEventListener('keydown', (e) => { if (!this.D) return; const k = { ArrowLeft: -1, ArrowRight: 1, PageDown: -26, PageUp: 26, Home: -1e5, End: 1e5 }[e.key];
      if (!k) { if (e.key === 'Escape') this.quitar(); return; } e.preventDefault(); this.cruz(Math.max(0, Math.min(this.D.xs.length - 1, (this.i < 0 ? this.D.xs.length - 1 : this.i) + k))); });
  }
  /* D: {W, FIN, xs (semanas), con[], sin[], run: 'con'|'sin', lim, cerca, abajo, limTxt} */
  update(D) {
    this.D = D; const { W, FIN, xs, con, sin } = D, op = this.op, alto = this.alto;
    const vals = con.concat(sin).filter((v) => v != null);
    if (!vals.length) { this.svg.style.display = 'none'; return; } this.svg.style.display = '';
    let mn = Math.min(...vals), mx = Math.max(...vals);
    for (const v of [D.lim, D.cerca]) if (v != null) { mn = Math.min(mn, v); mx = Math.max(mx, v); }
    if (op.cero) mn = Math.min(0, mn);
    const m = marcas(mn, mx, op.ticks || 3), pl = op.pl || 34, pr = 6, pt = 8, pb = 15, iw = W - pl - pr, ih = alto - pt - pb;
    const X = (s) => pl + (s - 1) / Math.max(1, FIN - 1) * iw, Y = (v) => pt + ih - (v - m.a) / (m.b - m.a || 1) * ih;
    Object.assign(this, { X, Y, pl, iw });
    fija(this.svg, { width: W, viewBox: `0 0 ${W} ${alto}` });
    const kY = m.t.join(',') + '|' + W;
    if (kY !== this.claveY) { this.claveY = kY; let s = '';
      for (const t of m.t) { const y = Y(t).toFixed(1); s += `<line x1="${pl}" x2="${W - pr}" y1="${y}" y2="${y}" stroke="var(--tb-grid)"/><text x="${pl - 4}" y="${(+y + 3).toFixed(1)}" text-anchor="end">${fmtEje(t, m.paso)}</text>`; }
      s += `<line x1="${pl}" x2="${W - pr}" y1="${pt + ih}" y2="${pt + ih}" stroke="var(--tb-axis)"/>`; this.gY.innerHTML = s; }
    const kX = W + '|' + FIN; if (kX !== this.claveX) { this.claveX = kX; ejeAños(this.gX, X, pt + ih, alto, W, FIN); }
    // zonas: «cerca» (aviso) y superada (crítico)
    let ban = '';
    if (D.lim != null) {
      const yl = Y(D.lim), top = pt, bot = pt + ih;
      if (D.abajo) { ban += `<rect x="${pl}" y="${yl.toFixed(1)}" width="${iw}" height="${Math.max(0, bot - yl).toFixed(1)}" fill="${COL.lim}" fill-opacity=".07"/>`;
        if (D.cerca != null) { const yc = Y(D.cerca); ban += `<rect x="${pl}" y="${yc.toFixed(1)}" width="${iw}" height="${Math.max(0, yl - yc).toFixed(1)}" fill="#fbb315" fill-opacity=".08"/>`; } }
      else { ban += `<rect x="${pl}" y="${top}" width="${iw}" height="${Math.max(0, yl - top).toFixed(1)}" fill="${COL.lim}" fill-opacity=".07"/>`;
        if (D.cerca != null) { const yc = Y(D.cerca); ban += `<rect x="${pl}" y="${yl.toFixed(1)}" width="${iw}" height="${Math.max(0, yc - yl).toFixed(1)}" fill="#fbb315" fill-opacity=".08"/>`; } }
      const y = Y(D.lim).toFixed(1); fija(this.lLim, { x1: pl, x2: W - pr, y1: y, y2: y, visibility: 'visible' });
      fija(this.tLim, { x: W - pr, y: (+y - 3 < pt + 8 ? +y + 10 : +y - 3).toFixed(1), visibility: 'visible' }); const tx = D.limTxt || `límite ${num(D.lim, op.d || 0)}`; if (this.tLim.textContent !== tx) this.tLim.textContent = tx;
    } else { fija(this.lLim, { visibility: 'hidden' }); fija(this.tLim, { visibility: 'hidden' }); }
    if (this.gBan.innerHTML !== ban) this.gBan.innerHTML = ban;
    const run = D.run === 'con' ? con : sin, colRun = D.run === 'con' ? COL.con : COL.sin;
    let k0 = run.findIndex((v) => v != null), k1 = run.length - 1; while (k1 >= 0 && run[k1] == null) k1--;
    if (k0 >= 0 && k1 > k0) { let d = `M${X(xs[k0]).toFixed(1)} ${pt + ih}`; for (let i = k0; i <= k1; i++) if (run[i] != null) d += `L${X(xs[i]).toFixed(1)} ${Y(run[i]).toFixed(1)}`; d += `L${X(xs[k1]).toFixed(1)} ${pt + ih}Z`; fija(this.pArea, { d }); for (const st of this.stops) fija(st, { 'stop-color': colRun }); }
    else fija(this.pArea, { d: '' });
    fija(this.pSin, { d: camino(xs, sin, X, Y) }); fija(this.pCon, { d: camino(xs, con, X, Y) });
    if (k1 >= 0) fija(this.cFin, { cx: X(xs[k1]).toFixed(1), cy: Y(run[k1]).toFixed(1), fill: colRun, visibility: 'visible' }); else fija(this.cFin, { visibility: 'hidden' });
    fija(this.hit, { x: pl, width: iw });
    const ult = run[k1]; this.svg.setAttribute('aria-label', `${op.n}: ${num(ult, op.d || 0)} ${op.u || ''} en la semana ${xs[k1] || ''}. Flechas para recorrer las semanas.`);
    if (this.i >= 0 && this.svg.matches(':hover,:focus')) this.cruz(Math.min(this.i, xs.length - 1));
  }
  cercano(px) { const D = this.D; if (!D || !D.xs.length) return -1; let lo = 0, hi = D.xs.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (this.X(D.xs[m]) < px) lo = m; else hi = m; }
    return Math.abs(this.X(D.xs[lo]) - px) <= Math.abs(this.X(D.xs[hi]) - px) ? lo : hi; }
  cruz(i, cx, cy) {
    const D = this.D; if (!D || i < 0) return; this.i = i; const s = D.xs[i], x = this.X(s).toFixed(1), op = this.op, d = op.d || 0, u = op.u ? ' ' + op.u : '';
    fija(this.xL, { x1: x, x2: x, y1: 8, y2: this.alto - 15, visibility: 'visible' });
    for (const [e, v] of [[this.xA, D.con[i]], [this.xB, D.sin[i]]]) { if (v == null) fija(e, { visibility: 'hidden' }); else fija(e, { cx: x, cy: this.Y(v).toFixed(1), visibility: 'visible' }); }
    const f = (v) => (v == null ? '—' : num(v, d) + u), r = this.svg.getBoundingClientRect();
    tip().mostrar(`<div class="t">${esc(op.n)} · semana ${s} · año ${año(s)}</div>` + filaTip(clave(COL.con), f(D.con[i]), 'con propuesta') + filaTip(clave(COL.sin, 'pun'), f(D.sin[i]), 'sin propuesta')
      + (D.lim != null ? filaTip(clave(COL.lim, 'pun'), f(D.lim), 'límite') : ''), cx != null ? cx : r.left + +x, cy != null ? cy : r.top + 12);
  }
  quitar() { this.i = -1; for (const e of [this.xL, this.xA, this.xB]) fija(e, { visibility: 'hidden' }); tip().ocultar(); }
}
Linea.n = 0;

/* =========================================================================================================
   ÁREA APILADA de 15 años (una corrida): capas con 10 % de lavado + borde de 2 px, línea de referencia (p. ej. la demanda).
   ========================================================================================================= */
export class Apilada {
  constructor(host, op) {
    this.op = op; this.alto = op.alto || 110; this.D = null; this.i = -1;
    const s = this.svg = nodo('svg', { class: 'tb-svg', height: this.alto, tabindex: 0, role: 'img', 'aria-label': op.n }, host);
    this.gY = nodo('g', { class: 'tb-ejey' }, s); this.gX = nodo('g', { class: 'tb-ejex' }, s);
    this.capas = op.series.map((se) => ({ a: nodo('path', { fill: se.c, 'fill-opacity': '.14' }, s), l: nodo('path', { fill: 'none', stroke: se.c, 'stroke-width': 2, 'stroke-linejoin': 'round' }, s) }));
    this.ref = nodo('path', { fill: 'none', stroke: 'var(--ui-tx,#f1f3ee)', 'stroke-width': 1.5, 'stroke-dasharray': '2 2' }, s);
    this.xL = nodo('line', { stroke: 'var(--ui-tx2,#c9cfc4)', 'stroke-width': 1, visibility: 'hidden' }, s);
    this.hit = nodo('rect', { fill: 'transparent', y: 0, height: this.alto }, s); this.claveY = ''; this.claveX = '';
    s.addEventListener('pointermove', (e) => { if (!this.D) return; const r = s.getBoundingClientRect(); this.cruz(Linea.prototype.cercano.call(this, e.clientX - r.left), e.clientX, e.clientY); });
    s.addEventListener('pointerleave', () => this.quitar()); s.addEventListener('blur', () => this.quitar());
    s.addEventListener('focus', () => { if (this.D) this.cruz(this.D.xs.length - 1); });
    s.addEventListener('keydown', (e) => { if (!this.D) return; const k = { ArrowLeft: -1, ArrowRight: 1, Home: -1e5, End: 1e5 }[e.key]; if (!k) return; e.preventDefault(); this.cruz(Math.max(0, Math.min(this.D.xs.length - 1, (this.i < 0 ? this.D.xs.length - 1 : this.i) + k))); });
  }
  /* D: {W, FIN, xs, ys: [serie][i], ref: [] } */
  update(D) {
    this.D = D; const { W, FIN, xs, ys } = D, alto = this.alto, op = this.op, n = xs.length;
    const tot = xs.map((_, i) => ys.reduce((a, s) => a + (s[i] || 0), 0)), mx = Math.max(1e-6, ...tot, ...(D.ref || []).filter((v) => v != null));
    const m = marcas(0, mx, 3), pl = op.pl || 34, pr = 6, pt = 8, pb = 15, iw = W - pl - pr, ih = alto - pt - pb;
    const X = (s) => pl + (s - 1) / Math.max(1, FIN - 1) * iw, Y = (v) => pt + ih - v / (m.b || 1) * ih; Object.assign(this, { X, Y });
    fija(this.svg, { width: W, viewBox: `0 0 ${W} ${alto}` });
    const kY = m.t.join(',') + '|' + W; if (kY !== this.claveY) { this.claveY = kY; let s = ''; for (const t of m.t) { const y = Y(t).toFixed(1); s += `<line x1="${pl}" x2="${W - pr}" y1="${y}" y2="${y}" stroke="${t === 0 ? 'var(--tb-axis)' : 'var(--tb-grid)'}"/><text x="${pl - 4}" y="${(+y + 3).toFixed(1)}" text-anchor="end">${fmtEje(t, m.paso)}</text>`; } this.gY.innerHTML = s; }
    const kX = W + '|' + FIN; if (kX !== this.claveX) { this.claveX = kX; ejeAños(this.gX, X, pt + ih, alto, W, FIN); }
    const base = new Array(n).fill(0);
    ys.forEach((s, k) => { let top = '', bot = ''; for (let i = 0; i < n; i++) { const y0 = base[i], y1 = y0 + (s[i] || 0); top += (i ? 'L' : 'M') + X(xs[i]).toFixed(1) + ' ' + Y(y1).toFixed(1); bot = 'L' + X(xs[i]).toFixed(1) + ' ' + Y(y0).toFixed(1) + bot; base[i] = y1; }
      fija(this.capas[k].a, { d: n > 1 ? top + bot + 'Z' : '' }); fija(this.capas[k].l, { d: n > 1 ? top : '' }); });
    fija(this.ref, { d: D.ref ? camino(xs, D.ref, X, Y) : '' }); fija(this.hit, { x: pl, width: iw });
  }
  cruz(i, cx, cy) {
    const D = this.D; if (!D || i < 0) return; this.i = i; const s = D.xs[i], x = this.X(s).toFixed(1), op = this.op, r = this.svg.getBoundingClientRect();
    fija(this.xL, { x1: x, x2: x, y1: 8, y2: this.alto - 15, visibility: 'visible' });
    tip().mostrar(`<div class="t">${esc(op.n)} · semana ${s} · año ${año(s)}</div>` + op.series.map((se, k) => filaTip(clave(se.c, 'barra'), num(D.ys[k][i], op.d ?? 1) + ' ' + (op.u || ''), se.n)).reverse().join('')
      + (D.ref ? filaTip(clave('var(--ui-tx,#f1f3ee)', 'pun'), num(D.ref[i], op.d ?? 1) + ' ' + (op.u || ''), op.refN || 'referencia') : ''), cx != null ? cx : r.left + +x, cy != null ? cy : r.top + 12);
  }
  quitar() { this.i = -1; fija(this.xL, { visibility: 'hidden' }); tip().ocultar(); }
}

/* ---------- chispa (sparkline) reutilizable ---------- */
export class Chispa {
  constructor(host, w = 64, h = 18) { this.w = w; this.h = h; this.svg = nodo('svg', { class: 'tb-chispa', width: w, height: h, viewBox: `0 0 ${w} ${h}`, 'aria-hidden': 'true' }, host);
    this.p = nodo('path', { fill: 'none', 'stroke-width': 1.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, this.svg); this.c = nodo('circle', { r: 2.2 }, this.svg); }
  update(vals, col, FIN, xs) {
    const v = vals.filter((x) => x != null); if (v.length < 2) { fija(this.p, { d: '' }); fija(this.c, { r: 0 }); return; }
    const mn = Math.min(...v), mx = Math.max(...v), w = this.w, h = this.h, X = (s) => 1 + (s - 1) / Math.max(1, FIN - 1) * (w - 4), Y = (x) => h - 2 - (x - mn) / (mx - mn || 1) * (h - 4);
    fija(this.p, { d: camino(xs, vals, X, Y), stroke: col }); let k = vals.length - 1; while (k > 0 && vals[k] == null) k--;
    fija(this.c, { cx: X(xs[k]).toFixed(1), cy: Y(vals[k]).toFixed(1), r: 2.2, fill: col });
  }
}

/* ---------- mapa de calor (filas × 15 años), celdas reutilizadas ---------- */
export class MapaCalor {
  constructor(host, op) { this.op = op; this.svg = nodo('svg', { class: 'tb-svg tb-mapa', role: 'img', 'aria-label': op.n }, host); this.filas = []; this.W = 0; this.n = -1; }
  /* D: {W, nombres[], celdas[fila][año] = {v, max, tt} | null, actual: índice del año en curso, valores[] (columna derecha)} */
  update(D) {
    const { W, nombres, celdas } = D, op = this.op, Lw = Math.min(118, Math.floor(W * 0.32)), Vw = 26, x0 = Lw + 6, cw = (W - x0 - Vw) / 15, ch = op.ch || 11, gap = 2, top = 14, H = top + nombres.length * ch + 4;
    if (W !== this.W || nombres.length !== this.n) {
      this.W = W; this.n = nombres.length; this.svg.innerHTML = ''; fija(this.svg, { width: W, height: H, viewBox: `0 0 ${W} ${H}` });
      for (let a = 0; a < 15; a++) nodo('text', { x: (x0 + a * cw + cw / 2).toFixed(1), y: 9, 'text-anchor': 'middle' }, this.svg).textContent = String(a + 1);
      this.marco = nodo('rect', { y: top - 2, height: nombres.length * ch + 2, width: cw, fill: 'none', stroke: 'var(--ui-tx,#f1f3ee)', 'stroke-width': 1, rx: 2, visibility: 'hidden' }, this.svg);
      this.filas = nombres.map((n, r) => {
        const y = top + r * ch, g = nodo('g', {}, this.svg);
        const t = nodo('text', { class: 'tb-tn', x: Lw, y: y + ch / 2 + 3, 'text-anchor': 'end' }, g); t.textContent = n.length > 22 ? n.slice(0, 21) + '…' : n;
        const rs = []; for (let a = 0; a < 15; a++) { const c = nodo('rect', { x: (x0 + a * cw + gap / 2).toFixed(1), y: y + 1, width: (cw - gap).toFixed(1), height: ch - gap, rx: 1.5, fill: 'transparent' }, g); rs.push(c); }
        const v = nodo('text', { class: 'tb-tv', x: W - 2, y: y + ch / 2 + 3, 'text-anchor': 'end' }, g); return { rs, v };
      });
    }
    celdas.forEach((fila, r) => { const F = this.filas[r]; if (!F) return;
      fila.forEach((c, a) => { const e = F.rs[a]; if (!c) { fija(e, { fill: 'transparent', stroke: 'var(--tb-grid)', 'stroke-width': 1 }); e.removeAttribute('data-tt'); return; }
        const fr = c.max > 0 ? c.v / c.max : 0, col = c.v <= 0 ? 'rgba(255,255,255,.05)' : SEQ[Math.min(SEQ.length - 1, Math.floor(fr * SEQ.length - 1e-9))];
        fija(e, { fill: col, stroke: c.v <= 0 ? 'var(--tb-grid)' : 'none', 'stroke-width': c.v <= 0 ? 1 : 0, 'data-tt': c.tt }); });
      const tv = D.valores[r]; if (F.v.textContent !== tv) F.v.textContent = tv; });
    if (D.actual != null && D.actual >= 0) fija(this.marco, { x: (x0 + D.actual * cw).toFixed(1), visibility: 'visible' });
  }
}

/* ---------- barras horizontales (se rehacen solo si cambian los datos) ---------- */
export function barrasH(filas, W, op = {}) {
  if (!filas.length) return '';
  const h = op.alto || 15, Lw = Math.min(op.lw || 124, Math.floor(W * 0.4)), x0 = Lw + 6, x1 = W - (op.vw || 40), bw = x1 - x0;
  const max = op.max || Math.max(1e-9, ...filas.flatMap((f) => [f.v, f.ref, f.cmp, f.max]).filter((v) => v != null && isFinite(v)));
  const X = (v) => x0 + Math.max(0, Math.min(1, v / max)) * bw, H = filas.length * h + (op.lim != null ? 12 : 4);
  let s = `<svg class="tb-svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(op.aria || '')}">`;
  s += `<line x1="${x0}" x2="${x0}" y1="0" y2="${filas.length * h}" stroke="var(--tb-axis)"/>`;
  filas.forEach((f, i) => {
    const y = i * h, by = y + (h - 8) / 2, nom = f.n.length > 26 ? f.n.slice(0, 25) + '…' : f.n;
    s += `<g data-tt="${esc(f.tt || f.n)}"><rect x="0" y="${y}" width="${W}" height="${h}" fill="transparent"/><text class="tb-tn" x="${Lw}" y="${y + h / 2 + 3}" text-anchor="end">${esc(nom)}</text>`;
    if (f.max != null) s += `<rect x="${x0}" y="${by}" width="${(X(f.max) - x0).toFixed(1)}" height="8" fill="rgba(255,255,255,.07)"/>`;
    s += `<path class="tb-m" d="${barraH(x0, by, X(f.v || 0) - x0, 8)}" fill="${f.col || op.col || COL.con}"/>`;
    if (f.ref != null) s += `<rect x="${(X(f.ref) - 1).toFixed(1)}" y="${by - 2}" width="2" height="12" fill="var(--ui-tx,#f1f3ee)"/>`;
    if (f.cmp != null) s += `<circle cx="${X(f.cmp).toFixed(1)}" cy="${by + 4}" r="3" fill="${op.colCmp || COL.sin}" stroke="var(--tb-sur)" stroke-width="1.5"/>`;
    s += `<text class="tb-tv" x="${x1 + 5}" y="${y + h / 2 + 3}">${esc(f.txt != null ? f.txt : num(f.v))}</text></g>`;
  });
  if (op.lim != null) { const x = X(op.lim).toFixed(1); s += `<line x1="${x}" x2="${x}" y1="0" y2="${filas.length * h}" stroke="${COL.lim}" stroke-dasharray="3 3"/><text class="tb-tn" x="${x}" y="${H - 1}" text-anchor="middle">límite ${num(op.lim)}${op.limU || ''}</text>`; }
  return s + '</svg>';
}

/* ---------- columnas por año (15): grupos de segmentos apilados, 2 px de separación ---------- */
export function columnasAño(años, series, W, op = {}) {
  const alto = op.alto || 100, pl = 34, pr = 4, pt = 6, pb = 15, iw = W - pl - pr, ih = alto - pt - pb, slot = iw / 15;
  const maxS = Math.max(1, ...años.flatMap((r) => (r ? r.map((x) => x.reduce((p, q) => p + q, 0)) : [0])));
  const m = marcas(0, maxS, 3), Y = (v) => pt + ih - v / (m.b || 1) * ih;
  let s = `<svg class="tb-svg" width="${W}" height="${alto}" viewBox="0 0 ${W} ${alto}" role="img" aria-label="${esc(op.aria || '')}">`;
  for (const t of m.t) s += `<line x1="${pl}" x2="${W - pr}" y1="${Y(t).toFixed(1)}" y2="${Y(t).toFixed(1)}" stroke="${t === 0 ? 'var(--tb-axis)' : 'var(--tb-grid)'}"/><text x="${pl - 4}" y="${(Y(t) + 3).toFixed(1)}" text-anchor="end">${fmtEje(t, m.paso)}</text>`;
  años.forEach((r, y) => {
    const xs = pl + y * slot; s += `<text x="${(xs + slot / 2).toFixed(1)}" y="${alto - 2}" text-anchor="middle">${y + 1}</text>`; if (!r) return;
    const nG = r.length, gw = Math.min(14, (slot - 4 - (nG - 1) * 2) / nG);
    s += `<g data-tt="${esc(op.tt(y, r))}"><rect x="${xs.toFixed(1)}" y="0" width="${slot.toFixed(1)}" height="${alto}" fill="transparent"/>`;
    r.forEach((seg, gi) => {
      const x = xs + (slot - (nG * gw + (nG - 1) * 2)) / 2 + gi * (gw + 2); let base = 0; const vis = seg.map((v, k) => [v, k]).filter(([v]) => v > 0);
      vis.forEach(([v, k], j) => { const yTop = Y(base + v), yBot = Y(base), a2 = Math.max(0, yBot - yTop - (j > 0 ? 2 : 0)), st = series[gi][k];
        const d = j === vis.length - 1 ? barraV(x, yTop, gw, a2, 3) : `M${x} ${yTop}h${gw}v${a2}h${-gw}Z`;
        if (d) s += `<path class="tb-m" d="${d}" fill="${st.c}"${st.op ? ` fill-opacity="${st.op}" stroke="${st.c}" stroke-width="1" stroke-dasharray="3 2"` : ''}/>`; base += v; });
    });
    s += '</g>';
  });
  return s + '</svg>';
}

/* ---------- flujo (sankey de dos niveles) ---------- */
/* columnas: [[{id, n, v}]], enlaces: [{de, a, v, c}] — anchos ∝ t/día en UNA escala; nodos como barras de 8 px */
export function sankey(cols, enlaces, W, op = {}) {
  const alto = op.alto || 150, padY = 6, nw = 8, gapN = op.gapN || 10, lw = op.lw || 0, rw = op.rw || 0;
  const iw = W - lw - rw - nw, cx = cols.map((_, k) => lw + (cols.length > 1 ? k * iw / (cols.length - 1) : 0));
  const tot = Math.max(...cols.map((c) => c.reduce((a, n) => a + Math.max(0, n.v), 0)));
  const esc1 = (alto - 2 * padY - gapN * (Math.max(...cols.map((c) => c.length)) - 1)) / Math.max(1e-9, tot), minH = 1.5, pos = {};
  cols.forEach((c, k) => { const usado = c.reduce((a, n) => a + Math.max(minH, n.v * esc1), 0) + gapN * (c.length - 1); let y = padY + (alto - 2 * padY - usado) / 2;
    c.forEach((n) => { const h = Math.max(minH, n.v * esc1); pos[n.id] = { x: cx[k], y, h, salida: y, entrada: y, n, k }; y += h + gapN; }); });
  let s = `<svg class="tb-svg" width="${W}" height="${alto}" viewBox="0 0 ${W} ${alto}" role="img" aria-label="${esc(op.aria || '')}">`;
  for (const e of enlaces) { const A = pos[e.de], B = pos[e.a]; if (!A || !B || !(e.v > 0)) continue; const h = Math.max(minH, e.v * esc1);
    const y0 = A.salida + h / 2, y1 = B.entrada + h / 2, x0 = A.x + nw, x1 = B.x, xm = (x0 + x1) / 2; A.salida += h; B.entrada += h;
    s += `<g data-tt="${esc(e.tt || '')}"><path class="tb-m" d="M${x0.toFixed(1)} ${y0.toFixed(1)}C${xm.toFixed(1)} ${y0.toFixed(1)} ${xm.toFixed(1)} ${y1.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}" fill="none" stroke="${e.c}" stroke-opacity=".38" stroke-width="${h.toFixed(2)}"/>`
      + `<path d="M${x0.toFixed(1)} ${y0.toFixed(1)}C${xm.toFixed(1)} ${y0.toFixed(1)} ${xm.toFixed(1)} ${y1.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}" fill="none" stroke="transparent" stroke-width="${Math.max(12, h).toFixed(1)}"/></g>`; }
  for (const id in pos) { const P = pos[id], n = P.n, izq = P.k === 0 && lw > 0, ty = P.y + P.h / 2, tx = izq ? P.x - 5 : P.x + nw + 5, an = izq ? 'end' : 'start';
    s += `<g data-tt="${esc(n.tt || n.n)}"><rect x="${P.x}" y="${P.y.toFixed(1)}" width="${nw}" height="${P.h.toFixed(1)}" rx="2" fill="${n.c || 'var(--ui-tx2,#c9cfc4)'}"/>`
      + `<text class="tb-tn" x="${tx}" y="${(ty - 1).toFixed(1)}" text-anchor="${an}">${esc(n.n)}</text>`
      + `<text class="tb-tv" x="${tx}" y="${(ty + 9).toFixed(1)}" text-anchor="${an}">${esc(n.txt != null ? n.txt : num(n.v, 1))}</text></g>`; }
  return s + '</svg>';
}
