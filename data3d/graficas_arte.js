/* ============ GRÁFICAS ARTE (tablero de indicadores e informe final) ============
   Formas «de infografía» que siguen midiendo valores reales: tiempo radial de 15 años, anillos radiales, burbujas empacadas, diagrama de arcos,
   matriz de puntos, medidor de dB, media dona, tanques, sankey en espejo, histograma radial, dona con retícula y pictogramas.
   Cada gráfica se crea UNA vez y luego solo cambia atributos (d, r, cx, transform…) o se rehace cuando cambia su clave de datos
   (nunca por cuadro). Las transiciones son CSS (.ar-an) y se apagan con prefers-reduced-motion.
   PALETA (colores URBIA + morados de la portada), validada con dataviz/scripts/validate_palette.js, modo oscuro:
   · con propuesta #7d6bff (violeta, continua/rellena) · sin propuesta #f2694a (coral, punteada/hueca): PASA sobre #1e2422 y #14161b
     (CVD ΔE 28,1 · normal 32,4 · contraste ≥ 3:1)
   · categórica #7d6bff #c08f1c #22a89d #f2694a (en ese orden fijo): PASA (peor par adyacente CVD 12,6 · normal 19,2)
   · secuencial morada #4c46cf #5b4bff #7d6bff #a99cff #d4ceff: PASA (monótona, un tono, extremo 2,32:1)
   · referencias (siempre rotuladas, línea fina punteada): límite #ffd27a · crítico #ff4f7b · neutro #8c929c */
import { esc, num, nodo, marcas, fmtEje } from './graficas_vivas.js?v=2';

export const ARTE = {
  con: '#7d6bff', sin: '#f2694a', lim: '#ffd27a', crit: '#ff4f7b', neutro: '#8c929c',
  cat: ['#7d6bff', '#c08f1c', '#22a89d', '#f2694a'],
  pur: ['#4c46cf', '#5b4bff', '#7d6bff', '#a99cff', '#d4ceff'],
  indigo: '#304ffe', lima: '#d5ff3f', teal: '#4fd1c5', oro: '#ffd27a', durazno: '#ffb199', coral: '#ff7a59', ink: '#f4f3ef'
};
let UID = 0;
const TAU = Math.PI * 2, f1 = (x) => (+x).toFixed(1);
export const quieto = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
export const fija = (e, at) => { for (const k in at) { const v = String(at[k]); if (e.getAttribute(k) !== v) e.setAttribute(k, v); } };
export const P = (cx, cy, r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
export function arco(cx, cy, r, a0, a1) {
  if (a1 - a0 >= TAU - 1e-6) a1 = a0 + TAU - 1e-3; if (a1 - a0 < 1e-4) a1 = a0 + 1e-4;
  const [x0, y0] = P(cx, cy, r, a0), [x1, y1] = P(cx, cy, r, a1);
  return `M${f1(x0)} ${f1(y0)}A${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${f1(x1)} ${f1(y1)}`;
}
export function sector(cx, cy, r0, r1, a0, a1) {
  const [a, b] = P(cx, cy, r1, a0), [c, d] = P(cx, cy, r1, a1), [e, f] = P(cx, cy, r0, a1), [g, h] = P(cx, cy, r0, a0), L = a1 - a0 > Math.PI ? 1 : 0;
  return `M${f1(a)} ${f1(b)}A${f1(r1)} ${f1(r1)} 0 ${L} 1 ${f1(c)} ${f1(d)}L${f1(e)} ${f1(f)}A${f1(r0)} ${f1(r0)} 0 ${L} 0 ${f1(g)} ${f1(h)}Z`;
}
/* número que «cuenta» hasta el valor nuevo (solo el texto; nada si se pide reducir movimiento) */
export function contar(el, v, fmt) {
  const prev = el._v; el._v = v; cancelAnimationFrame(el._raf);
  if (v == null || !isFinite(v)) { el.textContent = '—'; return; }
  if (prev == null || !isFinite(prev) || quieto() || document.hidden || Math.abs(prev - v) < 1e-9) { el.textContent = fmt(v); return; }
  const t0 = performance.now(), dur = 260;
  const paso = (t) => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(prev + (v - prev) * e); if (k < 1) el._raf = requestAnimationFrame(paso); };
  el._raf = requestAnimationFrame(paso);
}

/* ---------- pictogramas (siluetas de 16 px, relleno = color actual) ---------- */
export const PICTO = {
  abeja: '<ellipse cx="9.4" cy="10.2" rx="4.8" ry="3.4"/><circle cx="4.1" cy="9.6" r="2"/><ellipse cx="8" cy="5.4" rx="2.4" ry="2.9" transform="rotate(-25 8 5.4)" opacity=".55"/><ellipse cx="11.2" cy="5.6" rx="2.1" ry="2.6" transform="rotate(20 11.2 5.6)" opacity=".55"/><path d="M8.2 7.2v6M10.6 7.1v6.1" stroke="var(--tb-sur,#1e2422)" stroke-width="1.1"/><path d="M14 10.2l1.7.5-1.7.6z"/>',
  colibri: '<path d="M.6 6.9l5.6.5-.1.8z"/><path d="M6 7.2c.6-1.6 2.3-2.4 3.9-1.8 1.9.7 2.7 2.7 2.1 4.6l3.4 4.6-4.8-3c-1.4.9-3.3.8-4.3-.6z"/><path d="M8.8 6.4C9.2 3.3 11.2 1.3 14.6.8c-.9 2.7-2.6 4.7-4.6 6.3z" opacity=".6"/>',
  tingua: '<path d="M4.2 9.6c0-2.6 2.5-3.8 5.2-3.4 2.8.4 4.8 1.9 5.2 3.9-1.8 1.6-4.2 2.2-7 2-2-.2-3.4-1-3.4-2.5z"/><path d="M13.5 8.1l2.2-1.7-.7 2.8z"/><path d="M3.3 9.2l1-3.4 2 .4-.6 3.4z"/><circle cx="4.6" cy="5.1" r="1.9"/><path d="M3 4.6L.8 5.6l2.3.6z"/><path d="M7.8 11.8l-.7 3.6M10.4 11.8l.8 3.6" stroke="currentColor" stroke-width="1" fill="none"/>',
  persona: '<circle cx="5" cy="3" r="2.2"/><path d="M1.2 14.6c0-5 1.5-8.2 3.8-8.2s3.8 3.2 3.8 8.2z"/>'
};
export const picto = (k, c, t = 16) => `<svg viewBox="0 0 16 16" width="${t}" height="${t}" aria-hidden="true" fill="${c}" style="color:${c}">${PICTO[k]}</svg>`;
/* claves de leyenda: continua / punteada / punto lleno / punto hueco / barra */
export const llave = (tipo, c) => tipo === 'txt' ? '' : tipo === 'pun' ? `<svg width="18" height="6" aria-hidden="true"><line x1="0" x2="18" y1="3" y2="3" stroke="${c}" stroke-width="2" stroke-dasharray="4 3"/></svg>`
  : tipo === 'pto' ? `<svg width="9" height="9" aria-hidden="true"><circle cx="4.5" cy="4.5" r="4" fill="${c}"/></svg>`
  : tipo === 'hue' ? `<svg width="9" height="9" aria-hidden="true"><circle cx="4.5" cy="4.5" r="3.4" fill="none" stroke="${c}" stroke-width="1.5"/></svg>`
  : tipo === 'bar' ? `<svg width="10" height="8" aria-hidden="true"><rect y="1" width="10" height="6" rx="2" fill="${c}"/></svg>`
  : `<svg width="18" height="6" aria-hidden="true"><line x1="0" x2="18" y1="3" y2="3" stroke="${c}" stroke-width="2.4" stroke-linecap="round"/></svg>`;
export const leyenda = (items) => `<div class="ar-ley">${items.map(([t, c, n]) => `<span>${llave(t, c)}${n}</span>`).join('')}</div>`;

/* =========================================================================================================
   1 · TIEMPO RADIAL: los 15 años como un reloj (330°, empieza arriba); radio = valor. Con = área con degradado + línea; sin = punteada.
   ========================================================================================================= */
export class TiempoRadial {
  constructor(host, op) {
    this.op = op; this.D = null; this.i = -1;
    const s = this.svg = nodo('svg', { class: 'tb-svg ar-rad', role: 'img', tabindex: 0 }, host), id = 'arR' + (++UID);
    const df = nodo('defs', {}, s), rg = nodo('radialGradient', { id, gradientUnits: 'userSpaceOnUse' }, df); this.rg = rg;
    this.st = [nodo('stop', { offset: '0', 'stop-opacity': 0 }, rg), nodo('stop', { offset: '1', 'stop-opacity': 0.6 }, rg)];
    this.gG = nodo('g', { 'pointer-events': 'none' }, s); this.pA = nodo('path', { fill: `url(#${id})` }, s);
    this.pS = nodo('path', { fill: 'none', stroke: ARTE.sin, 'stroke-width': 1.6, 'stroke-dasharray': '4 3', 'stroke-linejoin': 'round' }, s);
    this.pC = nodo('path', { fill: 'none', stroke: ARTE.con, 'stroke-width': 2, 'stroke-linejoin': 'round' }, s);
    this.hl = nodo('line', { stroke: 'rgba(244,243,239,.5)', 'stroke-width': 1, visibility: 'hidden' }, s);
    this.hA = nodo('circle', { r: 3.6, fill: ARTE.con, stroke: 'var(--tb-sur)', 'stroke-width': 1.5, visibility: 'hidden' }, s);
    this.hB = nodo('circle', { r: 3.4, fill: 'var(--tb-sur)', stroke: ARTE.sin, 'stroke-width': 1.6, visibility: 'hidden' }, s);
    this.cF = nodo('circle', { r: 4.6, stroke: 'var(--tb-sur)', 'stroke-width': 2, class: 'ar-an' }, s);
    this.t1 = nodo('text', { class: 'ar-c1', 'text-anchor': 'middle' }, s); this.t2 = nodo('text', { class: 'ar-c2', 'text-anchor': 'middle' }, s);
    this.kG = '';
    s.addEventListener('pointermove', (e) => this.mover(e)); s.addEventListener('pointerleave', () => this.quitar());
    s.addEventListener('focus', () => { if (this.D) this.cruz(this.D.xs.length - 1); }); s.addEventListener('blur', () => this.quitar());
    s.addEventListener('keydown', (e) => { if (!this.D) return; const k = { ArrowLeft: -1, ArrowRight: 1, Home: -1e5, End: 1e5 }[e.key]; if (!k) return; e.preventDefault(); this.cruz(Math.max(0, Math.min(this.D.xs.length - 1, (this.i < 0 ? this.D.xs.length - 1 : this.i) + k))); });
  }
  /* D: {W, FIN, xs, con[], sin[], run:'con'|'sin', sem} */
  update(D) {
    this.D = D; const { W, FIN, xs, con, sin } = D, op = this.op, vals = con.concat(sin).filter((v) => v != null);
    if (!vals.length) { this.svg.style.display = 'none'; return; } this.svg.style.display = '';
    const S = Math.min(W, op.max || 300), H = S, cx = W / 2, cy = S / 2, R = S / 2 - 20, r0 = R * 0.34, m = marcas(Math.min(...vals), Math.max(...vals), 3);
    const A = (w) => -Math.PI / 2 + 0.09 + (w - 1) / Math.max(1, FIN - 1) * (TAU - 0.36), RV = (v) => r0 + (v - m.a) / (m.b - m.a || 1) * (R - r0);
    Object.assign(this, { A, RV, cx, cy, R, r0, W, H });
    fija(this.svg, { width: W, height: H, viewBox: `0 0 ${W} ${H}` }); fija(this.rg, { cx, cy, r: R, fx: cx, fy: cy });
    const colR = D.run === 'con' ? ARTE.con : ARTE.sin; this.st.forEach((s, k) => fija(s, { 'stop-color': colR, offset: k ? 1 : (r0 / R).toFixed(2) }));
    const kG = m.t.join(',') + '|' + W + '|' + FIN;
    if (kG !== this.kG) { this.kG = kG; let g = '';
      for (const t of m.t) { const r = RV(t); g += `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(r)}" fill="none" stroke="rgba(255,255,255,${t === m.t[0] ? '.16' : '.07'})"${t === m.t[0] ? '' : ' stroke-dasharray="1 3"'}/><text class="ar-tk" x="${f1(cx - 5)}" y="${f1(cy - r + 3)}" text-anchor="end">${esc(fmtEje(t, m.paso))}</text>`; }
      for (let a = 1; a <= 15; a++) { const w = (a - 1) * 52 + 1, an = A(w), [x0, y0] = P(cx, cy, r0, an), [x1, y1] = P(cx, cy, R + 3, an), [lx, ly] = P(cx, cy, R + 12, A(w + 26));
        g += `<line x1="${f1(x0)}" y1="${f1(y0)}" x2="${f1(x1)}" y2="${f1(y1)}" stroke="rgba(255,255,255,.06)"/>`;
        if (a === 1 || a % 5 === 0 || W >= 340) g += `<text class="ar-tk${a === 1 || a === 15 ? ' b' : ''}" x="${f1(lx)}" y="${f1(ly + 3)}" text-anchor="middle">${a === 1 ? 'año 1' : a}</text>`; }
      this.gG.innerHTML = g; }
    const pts = (ser) => { let d = '', on = false; for (let i = 0; i < xs.length; i++) { const v = ser[i]; if (v == null) { on = false; continue; } const [x, y] = P(cx, cy, RV(v), A(xs[i])); d += (on ? 'L' : 'M') + f1(x) + ' ' + f1(y); on = true; } return d; };
    fija(this.pC, { d: pts(con) }); fija(this.pS, { d: pts(sin) });
    const run = D.run === 'con' ? con : sin; let k0 = run.findIndex((v) => v != null), k1 = run.length - 1; while (k1 >= 0 && run[k1] == null) k1--;
    if (k0 >= 0 && k1 > k0) { let d = ''; for (let i = k0; i <= k1; i++) if (run[i] != null) { const [x, y] = P(cx, cy, RV(run[i]), A(xs[i])); d += (d ? 'L' : 'M') + f1(x) + ' ' + f1(y); }
      for (let i = k1; i >= k0; i -= Math.max(1, Math.floor((k1 - k0) / 60))) { const [x, y] = P(cx, cy, r0, A(xs[i])); d += 'L' + f1(x) + ' ' + f1(y); } const [x, y] = P(cx, cy, r0, A(xs[k0])); d += 'L' + f1(x) + ' ' + f1(y) + 'Z'; fija(this.pA, { d }); }
    else fija(this.pA, { d: '' });
    if (k1 >= 0) { const [x, y] = P(cx, cy, RV(run[k1]), A(xs[k1])); fija(this.cF, { cx: f1(x), cy: f1(y), fill: colR, visibility: 'visible' }); } else fija(this.cF, { visibility: 'hidden' });
    const sem = xs[k1] || 1; this.t1.textContent = 'año ' + Math.min(15, Math.floor((sem - 1) / 52) + 1); fija(this.t1, { x: f1(cx), y: f1(cy + 2) });
    this.t2.textContent = 'de 15'; fija(this.t2, { x: f1(cx), y: f1(cy + 15) });
    this.svg.setAttribute('aria-label', `${op.n}: ${num(run[k1], op.d || 0)} en la semana ${sem}. Reloj de 15 años: el radio es el valor. Flechas para recorrer.`);
    if (this.i >= 0 && this.svg.matches(':hover,:focus')) this.cruz(Math.min(this.i, xs.length - 1));
  }
  mover(e) { if (!this.D) return; const r = this.svg.getBoundingClientRect(), sx = this.W / r.width, x = (e.clientX - r.left) * sx - this.cx, y = (e.clientY - r.top) * sx - this.cy;
    if (Math.hypot(x, y) < this.r0 * 0.6) { this.quitar(); return; }
    let a = Math.atan2(y, x) + Math.PI / 2 - 0.09; if (a < 0) a += TAU; const w = 1 + a / (TAU - 0.36) * (this.D.FIN - 1);
    let best = 0, bd = Infinity; this.D.xs.forEach((s, i) => { const d = Math.abs(s - w); if (d < bd) { bd = d; best = i; } }); if (bd > 40) { this.quitar(); return; } this.cruz(best, e.clientX, e.clientY); }
  cruz(i, px, py) {
    const D = this.D; if (!D || i < 0) return; this.i = i; const s = D.xs[i], an = this.A(s), [x0, y0] = P(this.cx, this.cy, this.r0, an), [x1, y1] = P(this.cx, this.cy, this.R + 2, an), op = this.op;
    fija(this.hl, { x1: f1(x0), y1: f1(y0), x2: f1(x1), y2: f1(y1), visibility: 'visible' });
    for (const [e, v] of [[this.hA, D.con[i]], [this.hB, D.sin[i]]]) { if (v == null) fija(e, { visibility: 'hidden' }); else { const [x, y] = P(this.cx, this.cy, this.RV(v), an); fija(e, { cx: f1(x), cy: f1(y), visibility: 'visible' }); } }
    const f = op.fmt || ((v) => (v == null ? '—' : num(v, op.d || 0) + (op.u ? ' ' + op.u : ''))), r = this.svg.getBoundingClientRect();
    (op.tip || tipA)(`<div class="t">${esc(op.n)} · año ${Math.min(15, Math.floor((s - 1) / 52) + 1)} · semana ${s}</div><div class="r">${llave('lin', ARTE.con)}<b>${esc(f(D.con[i]))}</b><span>con propuesta</span></div>${D.sin.some((v) => v != null) ? `<div class="r">${llave('pun', ARTE.sin)}<b>${esc(f(D.sin[i]))}</b><span>sin propuesta</span></div>` : ''}`,
      px != null ? px : r.left + x1 / (this.W / r.width), py != null ? py : r.top + y1 / (this.W / r.width));
  }
  quitar() { this.i = -1; for (const e of [this.hl, this.hA, this.hB]) fija(e, { visibility: 'hidden' }); (this.op.tip || tipA)(null); }
}
/* tooltip compartido: lo provee quien monta las gráficas (panel o informe) */
let TIPF = null; export const ponerTip = (f) => { TIPF = f; };
function tipA(html, x, y) { if (TIPF) TIPF(html, x, y); }

/* =========================================================================================================
   2 · ANILLOS RADIALES (barras radiales concéntricas de 270°, escala 0–max, marca de referencia)
   ========================================================================================================= */
export class Anillos {
  constructor(host, op) { // op: {items:[{n, c, ico}], max, ref, refTxt, u}
    this.op = op; const s = this.svg = nodo('svg', { class: 'tb-svg ar-ani', role: 'img', 'aria-label': op.aria || '' }, host);
    this.gT = nodo('g', { 'pointer-events': 'none' }, s); this.its = op.items.map((it) => { const g = nodo('g', {}, s);
      return { it, g, bar: nodo('path', { fill: 'none', stroke: it.c, 'stroke-width': 11, 'stroke-linecap': 'round', class: 'ar-an' }, g),
        mo: nodo('circle', { r: 3.6, fill: 'var(--tb-sur)', stroke: ARTE.sin, 'stroke-width': 1.7, class: 'ar-an' }, g), hit: nodo('path', { fill: 'none', stroke: 'transparent', 'stroke-width': 16 }, g) }; });
    this.gL = nodo('g', {}, s); this.W = 0;
  }
  update(W, vals) { // vals: [{v, vo, tt, txt}]
    const op = this.op, n = this.its.length, sw = 11, gap = 6, S = Math.min(Math.max(170, W * 0.62), 230), cx = W - S / 2 - 4, cy = S / 2 + 2, R = S / 2 - 18;
    const a0 = -Math.PI / 2, A = (v) => a0 + 1.5 * Math.PI * Math.max(0, Math.min(1, (v || 0) / op.max));
    if (W !== this.W) { this.W = W; fija(this.svg, { width: W, height: S + 4, viewBox: `0 0 ${W} ${S + 4}` }); let t = '';
      this.its.forEach((o, k) => { const r = R - k * (sw + gap); t += `<path d="${arco(cx, cy, r, a0, a0 + 1.5 * Math.PI)}" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="${sw}" stroke-linecap="round"/>`; });
      for (const v of [0, op.max / 3, op.max * 2 / 3, op.max]) { const [x, y] = P(cx, cy, R + 12, A(v)); t += `<text class="ar-tk" x="${f1(x)}" y="${f1(y + 3)}" text-anchor="middle">${num(v)}${v === op.max ? (op.u || '') : ''}</text>`; }
      if (op.ref != null) { const ar = A(op.ref), [x0, y0] = P(cx, cy, R - (n - 1) * (sw + gap) - 9, ar), [x1, y1] = P(cx, cy, R + 7, ar); t += `<line x1="${f1(x0)}" y1="${f1(y0)}" x2="${f1(x1)}" y2="${f1(y1)}" stroke="${ARTE.ink}" stroke-width="1.4" stroke-dasharray="2 2"/>`; }
      this.gT.innerHTML = t; this.geo = { cx, cy, R, A, sw, gap }; }
    const { R: RR } = this.geo; let lab = '';
    this.its.forEach((o, k) => { const r = RR - k * (sw + gap), d = vals[k] || {};
      fija(o.bar, { d: d.v == null ? '' : arco(cx, cy, r, a0, Math.max(a0 + 0.02, A(d.v))) }); fija(o.hit, { d: arco(cx, cy, r, a0, a0 + 1.5 * Math.PI), 'data-tt': d.tt || '' });
      if (d.vo != null) { const [x, y] = P(cx, cy, r, A(d.vo)); fija(o.mo, { cx: f1(x), cy: f1(y), stroke: d.colO || ARTE.sin, visibility: 'visible' }); } else fija(o.mo, { visibility: 'hidden' });
      const yy = cy - r; lab += `<g data-tt="${esc(d.tt || '')}"><rect x="0" y="${f1(yy - 9)}" width="${f1(cx - 4)}" height="18" fill="transparent"/><g transform="translate(0 ${f1(yy - 10)}) scale(1.25)" style="color:${o.it.c}" fill="${o.it.c}">${PICTO[o.it.ico] || ''}</g><text class="ar-ln" x="23" y="${f1(yy + 3.5)}">${esc(o.it.n)}</text>`
        + `<line x1="${f1(23 + o.it.n.length * 5.7 + 6)}" x2="${f1(cx - 48)}" y1="${f1(yy)}" y2="${f1(yy)}" stroke="rgba(255,255,255,.14)" stroke-dasharray="1 3"/><text class="ar-tv" x="${f1(cx - 12)}" y="${f1(yy + 3.5)}" text-anchor="end">${esc(d.txt || '—')}</text></g>`; });
    if (this.gL._h !== lab) { this.gL._h = lab; this.gL.innerHTML = lab; }
  }
}

/* =========================================================================================================
   3 · BURBUJAS EMPACADAS (área ∝ valor); posiciones estables por id, transiciones de r/cx/cy
   ========================================================================================================= */
function empacar(rs) {
  const P2 = []; const ok = (x, y, r) => { for (const q of P2) if (Math.hypot(q.x - x, q.y - y) < q.r + r + 0.6) return false; return true; };
  for (let i = 0; i < rs.length; i++) { const r = rs[i]; if (!i) { P2.push({ x: 0, y: 0, r }); continue; }
    let best = null, bd = Infinity;
    for (const q of P2) for (let k = 0; k < 28; k++) { const a = k / 28 * TAU + i * 0.37, d = q.r + r + 0.8, x = q.x + d * Math.cos(a), y = q.y + d * Math.sin(a), dd = x * x * 0.3 + y * y;
      if (dd < bd && ok(x, y, r)) { bd = dd; best = { x, y, r }; } }
    P2.push(best || { x: 0, y: 0, r }); }
  return P2;
}
export class Burbujas {
  constructor(host, op) { this.op = op; this.svg = nodo('svg', { class: 'tb-svg ar-bur', role: 'img', 'aria-label': op.aria || '' }, host); this.g = nodo('g', {}, this.svg); this.gR = nodo('g', {}, this.svg); this.nod = new Map(); this.k = ''; }
  /* items: [{id, v, c, tt}] (v en la unidad del área); ref: {v, txt} círculo de referencia */
  update(W, items, ref) {
    const H = this.op.alto || 170, it = items.filter((x) => x.v > 0).sort((a, b) => b.v - a.v);
    const k = it.map((x) => x.id + ':' + Math.round(Math.sqrt(x.v) * 20)).join('|') + '|' + W; if (k === this.k) return; this.k = k;
    fija(this.svg, { width: W, height: H, viewBox: `0 0 ${W} ${H}` });
    const rs = it.map((x) => Math.sqrt(x.v)), L = empacar(rs);
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity; for (const q of L) { x0 = Math.min(x0, q.x - q.r); x1 = Math.max(x1, q.x + q.r); y0 = Math.min(y0, q.y - q.r); y1 = Math.max(y1, q.y + q.r); }
    const sc = Math.min((W - 8) / (x1 - x0 || 1), (H - 26) / (y1 - y0 || 1)), ox = (W - (x1 - x0) * sc) / 2 - x0 * sc, oy = 4 + (H - 26 - (y1 - y0) * sc) / 2 - y0 * sc, vivos = new Set();
    it.forEach((x, i) => { const q = L[i]; vivos.add(x.id); let c = this.nod.get(x.id); if (!c) { c = nodo('circle', { class: 'ar-an', cx: f1(ox + q.x * sc), cy: f1(oy + q.y * sc), r: 0 }, this.g); this.nod.set(x.id, c); }
      fija(c, { cx: f1(ox + q.x * sc), cy: f1(oy + q.y * sc), r: f1(Math.max(0.8, q.r * sc - 0.6)), fill: x.c, 'fill-opacity': x.op || 0.82, stroke: x.c, 'stroke-opacity': 0.9, 'stroke-width': 0.8, 'data-tt': x.tt || '' }); });
    for (const [id, c] of this.nod) if (!vivos.has(id)) { c.remove(); this.nod.delete(id); }
    if (ref) { const r = Math.sqrt(ref.v) * sc; this.gR.innerHTML = `<circle cx="${f1(W - 6 - r)}" cy="${f1(H - 4 - r)}" r="${f1(Math.max(1, r))}" fill="none" stroke="${ARTE.ink}" stroke-opacity=".7" stroke-dasharray="2 2"/><text class="ar-tk" x="${f1(W - 12 - 2 * r)}" y="${f1(H - 4 - r + 3)}" text-anchor="end">${esc(ref.txt)}</text>`; }
  }
}

/* =========================================================================================================
   4 · DIAGRAMA DE ARCOS (parches de oeste a este; arriba conexiones que funcionan, abajo las rotas por las vías)
   ========================================================================================================= */
export function arcosRed(parches, conexiones, W, op = {}) {
  const H = op.alto || 150, y0 = Math.round(H * 0.6), pad = 10, xs = parches.map((p) => p.x), xa = Math.min(...xs), xb = Math.max(...xs), X = (x) => pad + (x - xa) / (xb - xa || 1) * (W - 2 * pad);
  let up = '', weak = '', down = '';
  for (const L of conexiones) { const a = X(L.x1), b = X(L.x2), l = Math.min(a, b), r = Math.max(a, b), rx = Math.max(1, (r - l) / 2);
    const hu = Math.min(y0 - 16, 6 + rx * 3.2), hd = Math.min(H - y0 - 16, 5 + rx * 2.2), m = (l + r) / 2;
    if (L.tipo === 'roto') down += `M${f1(l)} ${y0 + 2}Q${f1(m)} ${f1(y0 + 2 + hd * 2)} ${f1(r)} ${y0 + 2}`;
    else if (L.f >= 0.5) up += `M${f1(l)} ${y0 - 2}Q${f1(m)} ${f1(y0 - 2 - hu * 2)} ${f1(r)} ${y0 - 2}`;
    else weak += `M${f1(l)} ${y0 - 2}Q${f1(m)} ${f1(y0 - 2 - hu * 2)} ${f1(r)} ${y0 - 2}`; }
  const col = (t) => t === 'nuevo' ? ARTE.cat[0] : t === 'liberado' ? ARTE.cat[1] : t === 'reforzado' ? ARTE.pur[4] : ARTE.cat[2];
  let s = `<svg class="tb-svg ar-arc" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(op.aria || '')}">`;
  s += `<path d="${weak}" fill="none" stroke="rgba(244,243,239,.28)" stroke-width=".8" stroke-dasharray="2 2"/><path d="${up}" fill="none" stroke="${ARTE.con}" stroke-opacity=".7" stroke-width="1.1"/><path d="${down}" fill="none" stroke="${ARTE.crit}" stroke-opacity=".75" stroke-width="1" stroke-dasharray="3 2"/>`;
  s += `<line x1="${pad - 4}" x2="${W - pad + 4}" y1="${y0}" y2="${y0}" stroke="rgba(255,255,255,.18)"/>`;
  for (const p of parches.slice().sort((a, b) => b.r - a.r)) s += `<circle cx="${f1(X(p.x))}" cy="${y0}" r="${f1(Math.max(1.6, Math.min(9, Math.sqrt(p.r) * 0.55)))}" fill="${col(p.tipo)}" fill-opacity=".85" stroke="var(--tb-sur)" stroke-width="1" data-tt="${esc(`${p.n}|${p.tipo}|${num(Math.PI * p.r * p.r / 1e4, 1)} ha · calidad ${num(p.calidad * 100)} %`)}"/>`;
  s += `<text class="ar-tk" x="${pad}" y="${H - 2}">oeste</text><text class="ar-tk" x="${W - pad}" y="${H - 2}" text-anchor="end">este</text><text class="ar-tk" x="${W / 2}" y="10" text-anchor="middle">conexiones que funcionan</text><text class="ar-tk" x="${W / 2}" y="${H - 2}" text-anchor="middle">rotas por las vías</text>`;
  return s + '</svg>';
}

/* =========================================================================================================
   5 · MATRIZ DE PUNTOS por año (cada punto = N unidades; con lleno, sin hueco)
   ========================================================================================================= */
const BONITO = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000, 10000];
export function matrizPuntos(años, W, op = {}) { // años: [[con, sin] | null] × 15
  const alto = op.alto || 132, pl = 6, pb = 16, slot = (W - pl * 2) / 15, r = Math.max(1.6, Math.min(3.3, slot / 5.4)), dy = 2 * r + 1.6, filas = Math.floor((alto - pb - 4) / dy);
  const mx = Math.max(1, ...años.flatMap((a) => (a ? a : [0])));
  const N = BONITO.find((b) => Math.ceil(mx / b) <= filas) || BONITO[BONITO.length - 1];
  let s = `<svg class="tb-svg ar-mat" width="${W}" height="${alto}" viewBox="0 0 ${W} ${alto}" role="img" aria-label="${esc(op.aria || '')}">`;
  años.forEach((a, y) => { const xs = pl + y * slot, cxA = xs + slot / 2 - r - 0.9, cxB = xs + slot / 2 + r + 0.9;
    s += `<text class="ar-tk${y === op.actual ? ' b' : ''}" x="${f1(xs + slot / 2)}" y="${alto - 3}" text-anchor="middle">${y === 0 || (y + 1) % 5 === 0 || W >= 360 ? y + 1 : '·'}</text>`; if (!a) return;
    s += `<g data-tt="${esc(op.tt ? op.tt(y, a) : '')}"><rect x="${f1(xs)}" y="0" width="${f1(slot)}" height="${alto - pb}" fill="transparent"/>`;
    for (const [k, cxx] of [[0, cxA], [1, cxB]]) { const n = Math.round((a[k] || 0) / N);
      for (let j = 0; j < n && j < filas + 2; j++) { const cy = alto - pb - 2 - r - j * dy;
        s += k === 0 ? `<circle cx="${f1(cxx)}" cy="${f1(cy)}" r="${f1(r)}" fill="${ARTE.con}"${y === op.actual ? ' fill-opacity=".65"' : ''}/>` : `<circle cx="${f1(cxx)}" cy="${f1(cy)}" r="${f1(r - 0.6)}" fill="none" stroke="${ARTE.sin}" stroke-width="1.2"/>`; } }
    s += '</g>'; });
  return { svg: s + '</svg>', N };
}

/* =========================================================================================================
   6 · MEDIDOR de 240° con bandas (p. ej. dB(A)); aguja = esta corrida, triángulo hueco = la otra
   ========================================================================================================= */
export class Medidor {
  constructor(host, op) { // op: {min, max, bandas:[[a,b,color,nombre]], ticks:[], u}
    this.op = op; const s = this.svg = nodo('svg', { class: 'tb-svg ar-med', role: 'img', 'aria-label': op.aria || '' }, host);
    this.g0 = nodo('g', {}, s); this.ag = nodo('g', { class: 'ar-rot' }, s); this.agL = nodo('path', {}, this.ag);
    this.mo = nodo('g', { class: 'ar-rot' }, s); this.moP = nodo('path', { fill: 'var(--tb-sur)', stroke: ARTE.sin, 'stroke-width': 1.6, 'stroke-linejoin': 'round' }, this.mo);
    this.hub = nodo('circle', { r: 5, fill: ARTE.ink }, s); this.tv = nodo('text', { class: 'ar-c2', 'text-anchor': 'middle' }, s); this.W = 0;
  }
  update(W, v, vo, colO) {
    const op = this.op, S = 150, cx = 75, cy = 76, R = 60, a0 = Math.PI * 5 / 6, sweep = Math.PI * 4 / 3, A = (x) => a0 + sweep * Math.max(0, Math.min(1, (x - op.min) / (op.max - op.min)));
    if (W !== this.W) { this.W = W; fija(this.svg, { width: W, height: S - 14, viewBox: `0 0 ${W} ${S - 14}` }); let t = '';
      for (const [a, b, c] of op.bandas) t += `<path d="${sector(cx, cy, R - 11, R, A(a) + 0.012, A(b) - 0.012)}" fill="${c}"/>`;
      for (let x = op.min; x <= op.max; x += 5) { const [x0, y0] = P(cx, cy, R + 3, A(x)), [x1, y1] = P(cx, cy, R + (op.ticks.includes(x) ? 8 : 6), A(x)); t += `<line x1="${f1(x0)}" y1="${f1(y0)}" x2="${f1(x1)}" y2="${f1(y1)}" stroke="rgba(244,243,239,${op.ticks.includes(x) ? '.6' : '.25'})"/>`; }
      for (const x of op.ticks) { const [x0, y0] = P(cx, cy, R + 16, A(x)); t += `<text class="ar-tk" x="${f1(x0)}" y="${f1(y0 + 3)}" text-anchor="middle">${x}</text>`; }
      const lx = 160; if (W >= 280) op.bandas.forEach(([a, b, c, n], i) => { t += `<g transform="translate(${lx} ${22 + i * 24})"><rect width="12" height="12" rx="3" fill="${c}"/><text class="ar-ln" x="18" y="6">${esc(n)}</text><text class="ar-tk" x="18" y="17">${a}–${b} ${esc(op.u || '')}</text></g>`; });
      this.g0.innerHTML = t; this.agL.setAttribute('d', `M${cx - 2.4} ${cy}L${cx} ${cy - R + 13}L${cx + 2.4} ${cy}Z`); this.moP.setAttribute('d', `M${cx - 5} ${cy - R - 13}L${cx + 5} ${cy - R - 13}L${cx} ${cy - R - 3}Z`);
      for (const g of [this.ag, this.mo]) g.style.transformOrigin = `${cx}px ${cy}px`; fija(this.hub, { cx, cy }); fija(this.tv, { x: cx, y: cy + 24 }); }
    const deg = (x) => (A(x) + Math.PI / 2) * 180 / Math.PI;
    this.agL.setAttribute('fill', ARTE.ink); this.moP.setAttribute('stroke', colO || ARTE.sin); this.ag.style.visibility = v == null ? 'hidden' : 'visible'; if (v != null) this.ag.style.transform = `rotate(${deg(v).toFixed(1)}deg)`;
    this.mo.style.visibility = vo == null ? 'hidden' : 'visible'; if (vo != null) this.mo.style.transform = `rotate(${deg(vo).toFixed(1)}deg)`;
    const b = op.bandas.find(([a, bb]) => v != null && v >= a && v < bb) || op.bandas[op.bandas.length - 1]; this.tv.textContent = v == null ? '' : b[3];
  }
}

/* =========================================================================================================
   7 · MEDIA DONA (0–100 %) con anillo exterior fino para la otra corrida
   ========================================================================================================= */
export class MediaDona {
  constructor(host, op) { this.op = op; const s = this.svg = nodo('svg', { class: 'tb-svg ar-semi', role: 'img', 'aria-label': op.aria || '' }, host);
    this.g0 = nodo('g', {}, s); this.a = nodo('path', { fill: 'none', 'stroke-width': 15, 'stroke-linecap': 'butt', class: 'ar-an' }, s); this.b = nodo('path', { fill: 'none', stroke: ARTE.sin, 'stroke-width': 2, 'stroke-dasharray': '3 2.5', class: 'ar-an' }, s); this.W = 0; }
  update(cx, cy, R, v, vo, col) { // v, vo en 0–100
    const A = (x) => Math.PI + Math.PI * Math.max(0, Math.min(1, x / 100));
    if (this.W !== cx + '|' + R) { this.W = cx + '|' + R; this.g0.innerHTML = `<path d="${arco(cx, cy, R, Math.PI, TAU)}" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="15"/>`
      + [0, 50, 100].map((x) => { const [x0, y0] = P(cx, cy, x === 50 ? R + 21 : R, A(x)); return `<text class="ar-tk" x="${f1(x0)}" y="${f1(x === 50 ? y0 + 3 : y0 + 12)}" text-anchor="middle">${x}${x === 100 ? ' %' : ''}</text>`; }).join('')
      + (() => { const [x0, y0] = P(cx, cy, R - 9, A(50)), [x1, y1] = P(cx, cy, R + 9, A(50)); return `<line x1="${f1(x0)}" y1="${f1(y0)}" x2="${f1(x1)}" y2="${f1(y1)}" stroke="rgba(244,243,239,.35)"/>`; })(); }
    fija(this.a, { d: v == null ? '' : arco(cx, cy, R, Math.PI, Math.max(Math.PI + 0.02, A(v))), stroke: col || ARTE.con });
    fija(this.b, { d: vo == null ? '' : arco(cx, cy, R + 11, Math.PI, Math.max(Math.PI + 0.02, A(vo))), stroke: this.colO || ARTE.sin });
  }
}

/* =========================================================================================================
   8 · TANQUES con líquido (nivel hasta 120 %); nodos por id, el nivel se mueve con transform
   ========================================================================================================= */
export class Tanques {
  constructor(host) { this.svg = nodo('svg', { class: 'tb-svg ar-tan', role: 'img', 'aria-label': 'Llenado de cada Estación Circular' }, host); this.k = ''; this.T = []; }
  update(W, filas) { // filas: [{id, n, v (%), tt}]
    const n = filas.length, Hh = 78, top = 14, gw = Math.max(10, Math.min(34, (W - 34) / n - 5)), sp = gw + 5, x0 = 30 + Math.max(0, (W - 34 - n * sp) / 2), H = top + Hh + 16;
    const k = filas.map((f) => f.id).join('|') + W;
    if (k !== this.k) { this.k = k; this.svg.innerHTML = ''; fija(this.svg, { width: W, height: H, viewBox: `0 0 ${W} ${H}` });
      const y100 = top + Hh - Hh / 1.2; const g0 = nodo('g', { 'pointer-events': 'none' }, this.svg);
      g0.innerHTML = `<line x1="24" x2="${W - 2}" y1="${f1(y100)}" y2="${f1(y100)}" stroke="${ARTE.lim}" stroke-dasharray="3 2" stroke-opacity=".8"/><text class="ar-tk" x="22" y="${f1(y100 + 3)}" text-anchor="end">100%</text><text class="ar-tk" x="22" y="${top + Hh}" text-anchor="end">0</text>`;
      this.T = filas.map((f, i) => { const x = x0 + i * sp, id = 'arT' + (++UID), g = nodo('g', { 'data-tt': f.tt }, this.svg);
        const cp = nodo('clipPath', { id }, g); nodo('rect', { x, y: top, width: gw, height: Hh, rx: Math.min(7, gw / 2) }, cp);
        nodo('rect', { x, y: top, width: gw, height: Hh, rx: Math.min(7, gw / 2), fill: 'rgba(255,255,255,.035)', stroke: 'rgba(255,255,255,.16)' }, g);
        const lg = nodo('g', { 'clip-path': `url(#${id})` }, g), liq = nodo('path', { class: 'ar-liq', d: `M${x - gw} 0q${gw / 4} -3.2 ${gw / 2} 0t${gw / 2} 0t${gw / 2} 0t${gw / 2} 0V${Hh + 8}H${x - gw}Z` }, lg);
        const tx = nodo('text', { class: 'ar-tv', x: x + gw / 2, 'text-anchor': 'middle' }, g); return { g, liq, tx, x, gw }; }); }
    filas.forEach((f, i) => { const T = this.T[i]; if (!T) return; const lv = Math.min(1.2, Math.max(0, f.v / 100)) / 1.2, y = top + Hh - lv * Hh, col = f.v >= 100 ? ARTE.crit : f.v >= 85 ? ARTE.lim : ARTE.con;
      T.liq.style.transform = `translateY(${y.toFixed(1)}px)`; T.liq.setAttribute('fill', col); T.g.setAttribute('data-tt', f.tt);
      if (n <= 9) { T.tx.textContent = num(f.v) + '%'; fija(T.tx, { y: f1(Math.max(10, y - 4)) }); } else T.tx.textContent = ''; });
  }
}

/* =========================================================================================================
   9 · SANKEY EN ESPEJO: con propuesta → destinos ← sin propuesta (anchos ∝ kg en UNA escala)
   ========================================================================================================= */
export function sankeyEspejo(con, sin, destinos, W, op = {}) { // con/sin: {G, seg:[v por destino]} | null; destinos: [{n, c}]
  const H = op.alto || 150, nw = 8, pad = 14, gap = 26, cxm = W / 2 - nw / 2, tot = Math.max(con ? con.G : 0, sin ? sin.G : 0) || 1, sc = (H - 2 * pad - gap * (destinos.length - 1)) / (tot * 2 || 1);
  let s = `<svg class="tb-svg ar-san" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(op.aria || '')}">`;
  const tam = destinos.map((_, i) => Math.max(1.5, ((con ? con.seg[i] : 0) + (sin ? sin.seg[i] : 0)) * sc));
  let y = pad + (H - 2 * pad - tam.reduce((a, b) => a + b, 0) - gap * (destinos.length - 1)) / 2; const pos = tam.map((h) => { const p = { y, h, inA: y, inB: y }; y += h + gap; return p; });
  const lado = (D, izq) => { if (!D || !(D.G > 0)) return ''; const hS = D.G * sc, xS = izq ? pad : W - pad - nw; let ys = (H - hS) / 2, o = '';
    o += `<rect x="${xS}" y="${f1(ys)}" width="${nw}" height="${f1(hS)}" rx="2" fill="${izq ? ARTE.con : 'none'}" ${izq ? '' : `stroke="${ARTE.sin}" stroke-width="1.4" stroke-dasharray="3 2"`}/>`;
    o += `<text class="ar-ln" x="${izq ? xS : xS + nw}" y="${f1(ys - 5)}" text-anchor="${izq ? 'start' : 'end'}">${izq ? 'Con' : 'Sin'} · ${esc(num(D.G * 1000))} kg/día</text>`;
    D.seg.forEach((v, i) => { if (!(v > 0)) return; const h = v * sc, Pd = pos[i], yd = izq ? Pd.inA : Pd.inA, x0 = izq ? xS + nw : cxm + nw, x1 = izq ? cxm : xS, ya = izq ? ys : yd, yb = izq ? yd : ys, xm = (x0 + x1) / 2;
      const dd = `M${f1(x0)} ${f1(ya)}C${f1(xm)} ${f1(ya)} ${f1(xm)} ${f1(yb)} ${f1(x1)} ${f1(yb)}V${f1(yb + h)}C${f1(xm)} ${f1(yb + h)} ${f1(xm)} ${f1(ya + h)} ${f1(x0)} ${f1(ya + h)}Z`;
      o += `<path d="${dd}" fill="${destinos[i].c}" fill-opacity="${izq ? 0.42 : 0.16}"${izq ? '' : ` stroke="${destinos[i].c}" stroke-opacity=".7" stroke-width=".8" stroke-dasharray="3 2"`} data-tt="${esc(`${destinos[i].n}|${num(v * 1000)} kg/día · ${num(v / D.G * 100, 1)} % de lo generado|${izq ? 'Con' : 'Sin'} propuesta`)}"/>`;
      ys += h; Pd.inA += h; });
    return o; };
  s += lado(con, true) + lado(sin, false);
  destinos.forEach((d, i) => { const Pd = pos[i]; s += `<rect x="${f1(cxm)}" y="${f1(Pd.y)}" width="${nw}" height="${f1(Pd.h)}" rx="2" fill="${d.c}"/>`;
    const pc = (D) => (D && D.G ? num(D.seg[i] / D.G * 100) + '%' : '—');
    const ym = Math.max(Pd.y + Pd.h / 2 + 3.5, Pd.y + 10);
    s += `<text class="ar-tv ar-halo" x="${f1(cxm - 5)}" y="${f1(ym)}" text-anchor="end">${pc(con)}</text><text class="ar-tv ar-halo" x="${f1(cxm + nw + 5)}" y="${f1(ym)}">${pc(sin)}</text><text class="ar-tk b ar-halo" x="${f1(cxm + nw / 2)}" y="${f1(Pd.y - 3)}" text-anchor="middle">${esc(d.n)}</text>`; });
  return s + '</svg>';
}

/* =========================================================================================================
   10 · HISTOGRAMA RADIAL de sectores: anillo exterior = esta corrida (hacia afuera), interior = la otra (hacia adentro), ordenados
   ========================================================================================================= */
export class RadialSectores {
  constructor(host, op) { this.op = op; const s = this.svg = nodo('svg', { class: 'tb-svg ar-rsec', role: 'img', 'aria-label': op.aria || '' }, host); this.g0 = nodo('g', { 'pointer-events': 'none' }, s); this.gA = nodo('g', {}, s); this.gB = nodo('g', {}, s); this.g1 = nodo('g', { 'pointer-events': 'none' }, s); this.k = ''; this.A = []; this.B = []; }
  update(W, A, B, labA, labB) { // A, B: [{n, v}] (v en %), ya ordenados
    const S = Math.min(W, 290), cx = W / 2, cy = S / 2, R = S / 2 - 6, r0 = R * 0.6, rI = R * 0.2, lo = this.op.lo || 60, hi = 100;
    const fr = (v) => Math.max(0.02, Math.min(1, (v - lo) / (hi - lo)));
    const kG = W + '|' + A.length + '|' + B.length;
    if (kG !== this.k) { this.k = kG; fija(this.svg, { width: W, height: S, viewBox: `0 0 ${W} ${S}` });
      const r80o = r0 + 2 + fr(80) * (R - r0 - 2), r80i = r0 - 4 - fr(80) * (r0 - 4 - rI);
      this.g0.innerHTML = `<circle cx="${cx}" cy="${cy}" r="${f1(R)}" fill="none" stroke="rgba(255,255,255,.06)"/><circle cx="${cx}" cy="${cy}" r="${f1(r0 + 1)}" fill="none" stroke="rgba(255,255,255,.14)"/><circle cx="${cx}" cy="${cy}" r="${f1(rI)}" fill="none" stroke="rgba(255,255,255,.06)"/>`;
      this.g1.innerHTML = `<circle cx="${cx}" cy="${cy}" r="${f1(r80o)}" fill="none" stroke="${ARTE.lim}" stroke-width="1" stroke-dasharray="2 3" opacity=".85"/>${B.length ? `<circle cx="${cx}" cy="${cy}" r="${f1(r80i)}" fill="none" stroke="${ARTE.lim}" stroke-width="1" stroke-dasharray="2 3" opacity=".6"/>` : ''}<text class="ar-tk b ar-halo" x="${cx + 3}" y="${f1(cy - r80o - 3)}">80 %</text><text class="ar-c1" x="${cx}" y="${f1(cy - 2)}" text-anchor="middle">${Math.max(A.length, B.length)}</text><text class="ar-c2" x="${cx}" y="${f1(cy + 11)}" text-anchor="middle">sectores</text>`;
      const mk = (g, n) => { g.innerHTML = ''; const out = []; for (let i = 0; i < n; i++) out.push(nodo('path', {}, g)); return out; };
      this.A = mk(this.gA, A.length); this.B = mk(this.gB, B.length); }
    const dibuja = (L, nodos, afuera, lab) => { const n = L.length, da = TAU / Math.max(1, n);
      L.forEach((q, i) => { const a = -Math.PI / 2 + i * da, e = nodos[i], f = fr(q.v), crit = q.v < 80;
        const d = afuera ? sector(cx, cy, r0 + 2, r0 + 2 + f * (R - r0 - 2), a + da * 0.12, a + da * 0.88) : sector(cx, cy, r0 - 4 - f * (r0 - 4 - rI), r0 - 4, a + da * 0.12, a + da * 0.88);
        const c = crit ? ARTE.crit : afuera ? ARTE.pur[Math.min(4, Math.floor(f * 4.999))] : ARTE.neutro;
        fija(e, { d, fill: c, 'fill-opacity': afuera ? 1 : 0.7, 'data-tt': `${q.n}|${num(q.v, 1)} % de su demanda|${lab}${crit ? ' · bajo 80 %' : ''}` }); }); };
    dibuja(A, this.A, true, labA); dibuja(B, this.B, false, labB);
  }
}

/* =========================================================================================================
   11 · DONA + RETÍCULA 10 × 10 (fracción pictórica: cada celda = 1 % de la demanda)
   ========================================================================================================= */
export function retícula(v, vo, x0, y0, c = 8.6) {
  const n = Math.round(Math.max(0, Math.min(100, v || 0))), no = vo == null ? null : Math.round(Math.max(0, Math.min(100, vo))); let s = '';
  for (let i = 0; i < 100; i++) { const col = i % 10, fil = 9 - Math.floor(i / 10), x = x0 + col * c, y = y0 + fil * c;
    s += i < n ? `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(c - 1.6)}" height="${f1(c - 1.6)}" rx="1.6" fill="${ARTE.con}"/>` : `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(c - 1.6)}" height="${f1(c - 1.6)}" rx="1.6" fill="rgba(255,255,255,.07)"/>`;
    if (no != null && i === no - 1) s += `<rect x="${f1(x - 1)}" y="${f1(y - 1)}" width="${f1(c + 0.4)}" height="${f1(c + 0.4)}" rx="2.2" fill="none" stroke="${ARTE.sin}" stroke-width="1.4"/>`; }
  return s;
}

/* =========================================================================================================
   12 · FILA DE PERSONAS (fracción pictórica de 10): relleno ∝ %, marca de la otra corrida debajo
   ========================================================================================================= */
export function personas(pct, pctO, W, alto = 34) {
  const n = 10, w = Math.min(22, (W - 10) / n), id = 'arP' + (++UID), ancho = n * w, x0 = (W - ancho) / 2, fx = x0 + ancho * Math.max(0, Math.min(100, pct || 0)) / 100;
  let figs = ''; for (let i = 0; i < n; i++) figs += `<g transform="translate(${f1(x0 + i * w + (w - 12) / 2)} 2) scale(1.2 1.55)">${PICTO.persona}</g>`;
  let s = `<svg class="tb-svg ar-per" width="${W}" height="${alto}" viewBox="0 0 ${W} ${alto}" role="img" aria-label="${num(pct)} de cada 100 personas"><defs><clipPath id="${id}"><rect x="0" y="0" width="${f1(fx)}" height="${alto}"/></clipPath></defs>`;
  s += `<g fill="rgba(255,255,255,.12)">${figs}</g><g fill="${ARTE.con}" clip-path="url(#${id})">${figs}</g>`;
  if (pctO != null) { const xo = x0 + ancho * Math.max(0, Math.min(100, pctO)) / 100; s += `<path d="M${f1(xo)} ${alto - 7}l4 6h-8z" fill="none" stroke="${ARTE.sin}" stroke-width="1.4" stroke-linejoin="round"/>`; }
  return s + '</svg>';
}
