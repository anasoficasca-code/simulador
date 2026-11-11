/* ============ INTERFAZ SOBRIA · orden de los paneles ============
   - Derecha: un solo panel con pestañas (Actores · Red biótica · Polinización) en vez de tres cajas sueltas.
   - Izquierda: las capas se agrupan bajo un título "Capas" y se ven como interruptores (estilos en ui_sobrio.css).
   - Marca más discreta. En celular no se toca (cada panel conserva su botón). */
export function iniciarUI() {
  const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = 'data3d/ui_sobrio.css?v=2'; document.head.appendChild(css);
  if (!document.querySelector('link[href*="family=Inter"]')) { const f = document.createElement('link'); f.rel = 'stylesheet'; f.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap'; document.head.appendChild(f); }
  const movil = () => innerWidth <= 760;
  const PEST = [['gs-der', 'Actores'], ['bt-pan', 'Red biótica'], ['hid-red', 'Polinización']];
  let dock = null, act = 'gs-der', elegido = false;
  const armarDock = () => {
    if (movil()) return;
    if (!dock) {
      dock = document.createElement('div'); dock.id = 'dock';
      dock.innerHTML = '<div class="dk-tabs"></div><div class="dk-body"></div>';
      document.body.appendChild(dock);
      dock.querySelector('.dk-tabs').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; if (b.classList.contains('dk-min')) { dock.classList.toggle('min'); b.textContent = dock.classList.contains('min') ? '+' : '–'; return; } act = b.dataset.k; elegido = true; dock.classList.remove('min'); pintar(); });
    }
    const cuerpo = dock.querySelector('.dk-body');
    for (const [id] of PEST) { const el = document.getElementById(id); if (el && el.parentElement !== cuerpo) cuerpo.appendChild(el); }
    pintar();
  };
  const pintar = () => {
    if (!dock) return; const hay = PEST.filter(([id]) => document.getElementById(id));
    if ((!elegido || !hay.find(([id]) => id === act)) && hay.length) act = hay[0][0]; /* abre en Actores apenas exista */
    dock.querySelector('.dk-tabs').innerHTML = hay.map(([id, n]) => `<button data-k="${id}" class="${id === act ? 'on' : ''}">${n}</button>`).join('') + `<button class="dk-min" title="Minimizar">${dock.classList.contains('min') ? '+' : '–'}</button>`;
    for (const [id] of PEST) { const el = document.getElementById(id); if (el) el.classList.toggle('dk-oculto', id !== act); }
  };
  // capas del panel izquierdo: título y orden
  const ordenarCapas = () => {
    const izq = document.getElementById('gs-izq'); if (!izq) return;
    const ids = ['fb-btn', 'ar-btn', 'us-btn', 'rc-btn', 'ci-open', 'vi-btn', 'fr-btn'], bs = ids.map(i => document.getElementById(i)).filter(b => b && izq.contains(b));
    if (!bs.length) return;
    let h = izq.querySelector('.ui-capas-h'); if (!h) { h = document.createElement('div'); h.className = 'ui-capas-h'; h.textContent = 'Capas'; }
    const primero = bs[0]; primero.parentElement.insertBefore(h, primero);
    let ref = h; for (const b of bs) { ref.insertAdjacentElement('afterend', b); ref = b; }
    const vi = document.getElementById('vi-btn'); if (vi) { vi.style.background = ''; vi.textContent = vi.textContent.replace('✦', '').trim(); }
    const fr = document.getElementById('fr-btn'); if (fr) fr.textContent = 'Foto real 3D (Google)';
    const fb = document.getElementById('fb-btn'); if (fb && /foto base/i.test(fb.textContent)) fb.textContent = 'Foto aérea del suelo';
  };
  const marca = () => { const m = document.getElementById('cvMarca'); if (!m || m.dataset.ui) return; const b = m.querySelector('b'), s = m.querySelector('small'); if (b) b.textContent = 'Kennedy · Bogotá'; if (s) s.textContent = 'FEDERACIÓN POLICÉNTRICA'; m.dataset.ui = 1; };
  let n = 0; const t = setInterval(() => { armarDock(); ordenarCapas(); marca(); if (++n > 90) clearInterval(t); }, 1000);
  addEventListener('resize', () => { if (!movil()) armarDock(); });
}
