/* ============ ÁRBOLES TIPO GAUSSIAN SPLAT (modo Kennedy) ============
   Cada copa se dibuja como hacen las capturas de Luma / gaussian splatting: cientos de manchas de luz suaves y difusas (gaussianas),
   no hojas modeladas. Copa llena e irregular (varios lóbulos), arriba iluminada por el sol (verde claro, oliva, amarillo),
   abajo y adentro en sombra (verde oscuro azulado), cada árbol con su tono. Tronco como mancha oscura delgada.
   Se arma con las mismas posiciones y alturas de los árboles (real3d.js: T3.trees.pos) y solo cerca de la cámara (se rehace al moverse). */
export function crearArbolesSplat({ THREE, T3, movil = false }) {
  const pos = T3.trees && T3.trees.pos; if (!pos) return null;
  const { X, Z, Hh } = pos, N = X.length;
  const MAXA = movil ? 6000 : 22000, POR = movil ? 70 : 110, R = movil ? 450 : 900;
  const cap = MAXA * POR;
  const P = new Float32Array(cap * 3), C = new Float32Array(cap * 3), S = new Float32Array(cap);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('color', new THREE.BufferAttribute(C, 3)); g.setAttribute('tam', new THREE.BufferAttribute(S, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uEsc: { value: 1 } }]),
    vertexShader: `attribute float tam; varying vec3 vC; uniform float uEsc;
      #include <fog_pars_vertex>
      void main(){ vC = color; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
        gl_PointSize = clamp(tam * uEsc / -mvPosition.z, 1.5, 55.0);
        #include <fog_vertex>
      }`,
    fragmentShader: `varying vec3 vC;
      #include <fog_pars_fragment>
      void main(){ vec2 d = gl_PointCoord - 0.5; float r2 = dot(d, d) * 4.0; if (r2 > 1.0) discard;
        float a = exp(-r2 * 2.6);                       // mancha gaussiana suave
        gl_FragColor = vec4(vC * (0.85 + 0.2 * (1.0 - r2)), a);
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
    vertexColors: true
  });
  const pts = new THREE.Points(g, mat); pts.frustumCulled = false; pts.renderOrder = 3; T3.scene.add(pts);
  const h = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  // paleta de copas (como la captura): verde amarillento, oliva, verde medio, verde oscuro, toques amarillo-otoño
  const LUZ = [[0.085, 0.13, 0.04], [0.07, 0.115, 0.035], [0.1, 0.12, 0.04], [0.06, 0.11, 0.04], [0.11, 0.11, 0.03], [0.05, 0.095, 0.045]]; /* más oscuras */
  const SOM = [[0.009, 0.019, 0.009], [0.013, 0.023, 0.009], [0.007, 0.016, 0.011]];
  let n = 0, ult = { x: 1e9, z: 1e9 };
  function rehacer(cx, cz) {
    const cand = [];
    for (let i = 0; i < N; i++) { const dx = X[i] - cx, dz = Z[i] - cz, d2 = dx * dx + dz * dz; if (d2 < R * R) cand.push([d2, i]); }
    cand.sort((a, b) => a[0] - b[0]);
    n = 0;
    for (let k = 0; k < cand.length && k < MAXA; k++) {
      const i = cand[k][1], H = Math.max(6, Hh[i]) * (h(i * 61) < 0.3 ? 1.55 + h(i * 67) * 0.5 : 1.12), /* 30 % de árboles grandes (eucaliptos, urapanes, pinos): 1,5-2 veces más altos */ Rc = H * (0.32 + h(i * 3) * 0.14), base = H * 0.38, alto = H - base;
      const L = LUZ[Math.floor(h(i * 7) * LUZ.length)], Sm = SOM[Math.floor(h(i * 11) * SOM.length)], tv = 0.85 + h(i * 13) * 0.3;
      // 2-4 lóbulos por copa
      const lob = 2 + Math.floor(h(i * 17) * 3), cen = [];
      for (let l = 0; l < lob; l++) { const a = h(i * 19 + l) * 6.28, r = Rc * 0.35 * h(i * 23 + l); cen.push([Math.cos(a) * r, base + alto * (0.45 + 0.35 * h(i * 29 + l)), Math.sin(a) * r, Rc * (0.6 + 0.4 * h(i * 31 + l))]); }
      const m = (k < 2500 ? POR : k < 9000 ? Math.floor(POR * 0.55) : Math.floor(POR * 0.3)); // menos manchas lejos
      for (let j = 0; j < m; j++) {
        const lo = cen[j % lob], u = h(i * 37 + j * 1.3), v = h(i * 41 + j * 2.1), w = h(i * 43 + j * 0.7);
        const th = u * 6.283, ph = Math.acos(2 * v - 1), rr = lo[3] * Math.cbrt(0.25 + 0.75 * w);
        const x = Math.sin(ph) * Math.cos(th) * rr, y = Math.cos(ph) * rr * 0.75, z = Math.sin(ph) * Math.sin(th) * rr;
        const o = n * 3; P[o] = X[i] + lo[0] + x; P[o + 1] = lo[1] + y; P[o + 2] = Z[i] + lo[2] + z;
        // luz: arriba y hacia el sol más clara; abajo y hacia adentro en sombra
        const arriba = Math.max(0, Math.min(1, (y / (lo[3] * 0.75) + 1) / 2)), fuera = rr / lo[3], k2 = Math.max(0, Math.min(1, 0.15 + 0.7 * arriba * (0.4 + 0.6 * fuera) + 0.15 * (x * 0.6 - z * 0.4) / lo[3]));
        const jit = 0.9 + h(i * 47 + j) * 0.2;
        C[o] = (Sm[0] + (L[0] - Sm[0]) * k2) * tv * jit; C[o + 1] = (Sm[1] + (L[1] - Sm[1]) * k2) * tv * jit; C[o + 2] = (Sm[2] + (L[2] - Sm[2]) * k2) * tv * jit;
        S[n] = (0.9 + h(i * 53 + j) * 1.1) * (H / 10) * 1.9; // tamaño de la mancha en metros (se escala por distancia)
        n++; if (n >= cap) break;
      }
      // tronco: dos manchas oscuras pequeñas
      for (let t = 0; t < 2 && n < cap; t++) { const o = n * 3; P[o] = X[i]; P[o + 1] = base * (0.3 + t * 0.4); P[o + 2] = Z[i]; C[o] = 0.16; C[o + 1] = 0.13; C[o + 2] = 0.1; S[n] = 0.7; n++; }
      if (n >= cap) break;
    }
    g.setDrawRange(0, n);
    for (const a of ['position', 'color', 'tam']) { const at = g.attributes[a]; at.needsUpdate = true; }
  }
  const api = {
    pts, visible: true,
    ver: (on) => { api.visible = on; pts.visible = on; },
    update: (cam) => {
      mat.uniforms.uEsc.value = T3.renderer.domElement.height / (2 * Math.tan(cam.fov * Math.PI / 360));
      const c = T3.orbit ? T3.orbit.target : cam.position;
      if (Math.hypot(c.x - ult.x, c.z - ult.z) > R * 0.18) { ult = { x: c.x, z: c.z }; rehacer(c.x, c.z); }
    }
  };
  return api;
}
