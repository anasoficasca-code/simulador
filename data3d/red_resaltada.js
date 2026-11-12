/* Red resaltada (residuos, asambleas): líneas con grosor real en pantalla + halo ancho y suave + pulsos que recorren
   los tramos, siempre encima del modelo para que se lean de lejos. pos: Float32Array de segmentos (x,y,z, x,y,z ...). */
export async function redResaltada({ THREE, T3, pos, colores, color, ancho = 2.6 }) {
  const [{ LineSegments2 }, { LineSegmentsGeometry }, { LineMaterial }] = await Promise.all([import('three/addons/lines/LineSegments2.js'), import('three/addons/lines/LineSegmentsGeometry.js'), import('three/addons/lines/LineMaterial.js')]);
  const g = new THREE.Group(), res = new THREE.Vector2(); T3.renderer.getSize(res);
  const capa = (w, op) => { const geo = new LineSegmentsGeometry(); geo.setPositions(pos); if (colores) geo.setColors(colores);
    const m = new LineMaterial({ color: colores ? 0xffffff : color, vertexColors: !!colores, linewidth: w, transparent: true, opacity: op, depthWrite: false, depthTest: false, toneMapped: false, worldUnits: false });
    m.resolution.copy(res); const l = new LineSegments2(geo, m); l.renderOrder = 7; l.frustumCulled = false; g.add(l); return m; };
  const mats = [capa(ancho * 4, 0.16), capa(ancho, 0.95)]; /* halo + línea */
  // pulsos: un punto luminoso viaja por cada tramo
  const n = pos.length / 6, pp = new Float32Array(n * 3), pc = new Float32Array(n * 3), base = new THREE.Color(color || 0xffffff);
  for (let k = 0; k < n; k++) { const c = colores ? [colores[k * 6], colores[k * 6 + 1], colores[k * 6 + 2]] : [base.r, base.g, base.b]; pc.set(c, k * 3); }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3)); pg.setAttribute('color', new THREE.BufferAttribute(pc, 3));
  const pm = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, depthTest: false, vertexColors: true, toneMapped: false, blending: THREE.AdditiveBlending,
    vertexShader: 'varying vec3 vC; void main(){ vC = color; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = clamp(3600.0 / -mv.z, 4.0, 12.0); }',
    fragmentShader: 'varying vec3 vC; void main(){ float r = length(gl_PointCoord - 0.5); if (r > 0.5) discard; gl_FragColor = vec4(mix(vec3(1.0), vC, 0.4), smoothstep(0.5, 0.1, r)); }' });
  const pulsos = new THREE.Points(pg, pm); pulsos.renderOrder = 8; pulsos.frustumCulled = false; g.add(pulsos);
  const fase = new Float32Array(n).map((_, k) => (k * 0.618) % 1);
  let raf = 0; const anim = () => { raf = requestAnimationFrame(anim); if (!g.visible || !g.parent || !g.parent.visible) return;
    T3.renderer.getSize(res); mats.forEach(m => m.resolution.copy(res));
    const t = performance.now() / 1000;
    for (let k = 0; k < n; k++) { const u = (t * 0.35 + fase[k]) % 1, o = k * 6; pp[k * 3] = pos[o] + (pos[o + 3] - pos[o]) * u; pp[k * 3 + 1] = pos[o + 1] + (pos[o + 4] - pos[o + 1]) * u; pp[k * 3 + 2] = pos[o + 2] + (pos[o + 5] - pos[o + 2]) * u; }
    pg.attributes.position.needsUpdate = true; };
  anim();
  return g;
}
