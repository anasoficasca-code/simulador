/* ============ SECTOR INEM KENNEDY · modelo 3D oficial de Bogotá (IDECA / SDP, visor 3D, CityEngine) ============
   ~5.900 construcciones con fachadas fotográficas por lote, convertidas de 'Inem Kennedy.3ws' (tools/inem_3ws.py).
   Se carga después de lo principal (25 MB) para no demorar la apertura. En su caja se quitan las cajas genéricas propias. */
export async function iniciarInem({ THREE, T3, OX, OZ, Y0 = 0.3 }) {
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  const gl = await new GLTFLoader().loadAsync('data3d/inem/inem.glb');
  const g = gl.scene; g.position.set(OX, Y0, OZ); g.name = 'inem-kennedy';
  g.traverse(o => { if (!o.isMesh) return; o.castShadow = false; o.receiveShadow = true; /* rendimiento: ~900 materiales; sin sombra propia y con descarte fuera de cámara */
    const m = o.material; m.side = THREE.DoubleSide; if (m.map) { m.map.anisotropy = 8; m.emissiveMap = m.map; m.emissive = new THREE.Color(1, 1, 1); m.emissiveIntensity = 0.55; m.color.setScalar(0.72); } m.roughness = 1; m.metalness = 0; o.geometry.computeVertexNormals(); m.needsUpdate = true; /* la foto de la fachada ya trae su luz: luz propia alta para que las caras en sombra no queden negras */ });
  T3.scene.add(g); T3.inem = g;
  return g;
}
