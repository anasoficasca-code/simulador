// REN3D · materiales.js
// Materiales del suelo (pasto, piso, vías y aceras) con texturas fotográficas (ver data3d/CREDITOS.txt) y muestreo SIN repetición visible:
// cada baldosa se desplaza al azar y se mezcla con sus vecinas, y se añade una variación de color de gran escala, así el suelo es "infinito"
// y no se ve el mosaico ni al alejar la cámara. El UV de cada malla es en metros del mundo / tamaño de baldosa (mapeo plano, sin estiramientos).
import * as THREE from 'three';

const GLSL = /* glsl */`
vec4 ntHash(vec2 p){ return fract(sin(vec4(1.0 + dot(p, vec2(37.0, 17.0)), 2.0 + dot(p, vec2(11.0, 47.0)), 3.0 + dot(p, vec2(41.0, 29.0)), 4.0 + dot(p, vec2(23.0, 31.0)))) * 103.0); }
vec4 sampleNT(sampler2D s, vec2 uv){
  vec2 iuv = floor(uv), fuv = fract(uv);
  vec2 oa = ntHash(iuv).xy, ob = ntHash(iuv + vec2(1.0, 0.0)).xy, oc = ntHash(iuv + vec2(0.0, 1.0)).xy, od = ntHash(iuv + vec2(1.0, 1.0)).xy;
  vec2 dx = dFdx(uv), dy = dFdy(uv);
  vec2 b = smoothstep(0.25, 0.75, fuv);
  return mix(mix(textureGrad(s, uv + oa, dx, dy), textureGrad(s, uv + ob, dx, dy), b.x), mix(textureGrad(s, uv + oc, dx, dy), textureGrad(s, uv + od, dx, dy), b.x), b.y);
}
float ntNoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  float a = fract(sin(dot(i, vec2(127.1, 311.7))) * 43758.5453), b = fract(sin(dot(i + vec2(1.0, 0.0), vec2(127.1, 311.7))) * 43758.5453);
  float c = fract(sin(dot(i + vec2(0.0, 1.0), vec2(127.1, 311.7))) * 43758.5453), d = fract(sin(dot(i + vec2(1.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y); }
`;

function sinRepeticion(mat, macro, bright, sat) {
  mat.onBeforeCompile = (sh) => {
    sh.fragmentShader = GLSL + sh.fragmentShader
      .replace('#include <map_fragment>', `
        #ifdef USE_MAP
          vec4 sampledDiffuseColor = sampleNT(map, vMapUv);
          float mv = 0.6 * ntNoise(vMapUv * 0.05) + 0.4 * ntNoise(vMapUv * 0.21 + 7.3); // variación de tono de gran escala (evita el patrón)
          sampledDiffuseColor.rgb *= 1.0 + (mv - 0.5) * ${(macro * 2).toFixed(2)};
          float lumT = dot(sampledDiffuseColor.rgb, vec3(0.30, 0.59, 0.11)); // saturación y brillo del material (las fotos base son algo oscuras/marrones)
          sampledDiffuseColor.rgb = mix(vec3(lumT), sampledDiffuseColor.rgb, ${sat.toFixed(2)}) * ${bright.toFixed(2)};
          diffuseColor *= sampledDiffuseColor;
        #endif`)
      .replace('#include <normal_fragment_maps>', THREE.ShaderChunk.normal_fragment_maps.replace(/texture2D\( normalMap, vNormalMapUv \)/g, 'sampleNT( normalMap, vNormalMapUv )'));
  };
  mat.customProgramCacheKey = () => 'ren3d-suelo-' + macro + '-' + bright + '-' + sat;
}

export function crearMaterialesSuelo(renderer) {
  // mientras cargan las fotos se ve un color liso parecido
  const mk = (color, rough, macro, bright, sat) => { const m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0, side: THREE.DoubleSide }); sinRepeticion(m, macro, bright, sat); return m; };
  const M = { piso: mk(0x9a9a96, 0.96, 0.16, 1.9, 0.40), via: mk(0xc9c7c1, 0.93, 0.10, 0.55, 0.35), acera: mk(0xd2d0cb, 0.92, 0.12, 2.0, 0.5), pasto: mk(0x4f6a30, 0.99, 0.2, 1.1, 0.92) };
  M.acera.emissive.set(0x3a3935); // levanta las partes en sombra de aceras y taludes, que si no se ven casi negras
  M.via.emissive.set(0x0c0c0b);
  const tl = new THREE.TextureLoader(), aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const cargar = (url, srgb) => new Promise(res => tl.load(url, t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = aniso; if (srgb) t.colorSpace = THREE.SRGBColorSpace; res(t); }, undefined, () => res(null)));
  M.cargar = async () => {
    const lista = [['piso', 'piso', 0.9], ['via', 'via', 0.8], ['acera', 'acera', 0.9], ['pasto', 'pasto', 0.7]];
    await Promise.all(lista.map(async ([k, f, ns]) => {
      const [c, n] = await Promise.all([cargar(`data3d/textures/${f}_color.jpg`, true), cargar(`data3d/textures/${f}_normal.jpg`, false)]);
      if (c) { M[k].map = c; M[k].color.set(k === 'piso' ? 0xcdd4c0 : 0xffffff); } // el piso lejano lleva un tinte verdoso de tierra para fundirse con la bruma del horizonte
      if (n) { M[k].normalMap = n; M[k].normalScale.set(ns, ns); }
      M[k].needsUpdate = true;
    }));
    M.listo = true;
  };
  return M;
}
