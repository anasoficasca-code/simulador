// REN3D · pajaro.js — JUEGO DE AVES DEL HUMEDAL
// Escoges un ave (garza real, gaviota andina o pato turrio); cada una tiene su propia dinámica de vuelo y su propia misión sobre el Humedal El Burro.
// Funciona de tres maneras: gafas VR (WebXR: Quest, Pico, SteamVR/Windows MR), celular en visor Cardboard (pantalla dividida + giroscopio)
// y pantalla normal (mouse y teclado).
import * as THREE from 'three';
import { StereoEffect } from 'three/addons/effects/StereoEffect.js';

const CSS = `
#pjMenu,#pjListo{position:fixed;inset:0;z-index:80;display:none;font-family:"Segoe UI",system-ui,-apple-system,Roboto,sans-serif;color:#e8f1f8}
#pjMenu{overflow:auto;-webkit-overflow-scrolling:touch;background:radial-gradient(1000px 600px at 80% -10%,rgba(56,189,248,.16),transparent 60%),radial-gradient(800px 500px at 0% 110%,rgba(52,211,153,.12),transparent 60%),rgb(3,8,14)}
#pjMenu .wrap{position:relative;max-width:980px;margin:0 auto;padding:max(22px,env(safe-area-inset-top)) 24px max(24px,env(safe-area-inset-bottom));min-height:100%;display:flex;flex-direction:column;justify-content:center;gap:20px}
#pjMenu header{display:flex;align-items:center;justify-content:space-between}
#pjMenu .marca{font-weight:800;letter-spacing:.42em;font-size:14px;color:#fff}
#pjMenu .x{background:none;border:1px solid rgba(148,163,184,.3);color:#9fb3c8;padding:9px 18px;font-size:11px;letter-spacing:.2em;text-transform:uppercase;border-radius:0;cursor:pointer}
#pjMenu .x:hover{background:rgba(255,255,255,.08);color:#fff}
#pjMenu h1{font-size:clamp(26px,4vw,40px);line-height:1.05;font-weight:800;margin:0;text-transform:uppercase}
#pjMenu h1 span{color:#7dd3fc}
#pjMenu .aves{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
#pjMenu .ave{position:relative;text-align:left;border:none;border-radius:0;padding:0;background:none;color:inherit;font:inherit;cursor:pointer;transition:transform .15s;-webkit-tap-highlight-color:transparent}
#pjMenu .ave .in{display:flex;flex-direction:column;height:100%;overflow:hidden;background:#0a131e;box-shadow:inset 0 0 0 1px rgba(148,163,184,.2);transition:box-shadow .15s}
#pjMenu .ave:hover{transform:translateY(-3px)}
#pjMenu .ave.sel .in{box-shadow:inset 0 0 0 2px var(--c),0 14px 30px -16px var(--c)}
#pjMenu .ave .foto{position:relative;display:block;aspect-ratio:4/3;overflow:hidden;background:#0b1622}
#pjMenu .ave .foto canvas.m3d{position:absolute;inset:0;width:100%;height:100%;z-index:1}
#pjMenu .ave .foto.ok{background:radial-gradient(ellipse at 50% 38%,color-mix(in srgb,var(--c) 26%,#16273a),#08111b 78%)}
#pjMenu .ave .foto.ok img.ph{display:none}
#pjMenu .ave .foto img{display:block;width:100%;height:100%;object-fit:cover;transition:transform .5s,filter .2s;filter:saturate(.92)}
#pjMenu .ave:hover .foto img,#pjMenu .ave.sel .foto img{transform:scale(1.05);filter:none}
#pjMenu .ave .foto::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 60%,#0a131e);pointer-events:none}
#pjMenu .ave .foto::before{content:"";position:absolute;left:0;right:0;top:0;height:3px;background:var(--c);opacity:.35;z-index:1}
#pjMenu .ave.sel .foto::before{opacity:1}
#pjMenu .ave .txt{display:block;padding:4px 16px 16px}
#pjMenu .ave h3{font-size:19px;font-weight:700;letter-spacing:.01em;margin:0}
#pjMenu .ave .rol{display:block;font-size:10.5px;letter-spacing:.24em;text-transform:uppercase;color:var(--c);margin:3px 0 8px;font-style:normal;font-weight:700}
#pjMenu .ave p{font-size:13px;line-height:1.45;color:#b3c2d1;margin:0 0 10px}
#pjMenu .ave .dif{display:flex;align-items:center;gap:8px;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#7b8ea3}
#pjMenu .ave .dif span{display:flex;gap:3px}
#pjMenu .ave .dif i{width:18px;height:5px;background:rgba(148,163,184,.25)}
#pjMenu .ave .dif i.o{background:var(--c)}
#pjMenu .pie{display:flex;flex-wrap:wrap;align-items:center;gap:14px 22px}
#pjMenu .seg{display:flex}
#pjMenu .seg button{border-radius:0;background:rgba(148,163,184,.08);border:1px solid rgba(148,163,184,.25);margin-left:-1px;color:#b7c6d6;padding:13px 20px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;cursor:pointer}
#pjMenu .seg button.on{background:#e8f1f8;color:#07121c;border-color:#e8f1f8}
#pjMenu .esp{display:flex;align-items:center;gap:8px;cursor:pointer;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#93a6ba}
#pjMenu .jugar{margin-left:auto;border:none;border-radius:0;padding:18px 60px;font-size:15px;font-weight:800;letter-spacing:.28em;text-transform:uppercase;color:#04121c;background:linear-gradient(100deg,var(--cs,#7dd3fc),#34d399);clip-path:polygon(14px 0,100% 0,calc(100% - 14px) 100%,0 100%);cursor:pointer;transition:filter .15s,transform .15s;-webkit-tap-highlight-color:transparent}
#pjMenu .jugar:hover{filter:brightness(1.12);transform:translateY(-2px)}
#pjXr{flex-basis:100%;font-size:12px;color:#7dd3fc}
#pjEstado{flex-basis:100%;font-size:12px;color:#fbbf24}
#pjMenu kbd{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);padding:1px 6px;font-size:11px;color:#fff}
@media(max-width:860px){
  #pjMenu .wrap{padding-left:16px;padding-right:16px;gap:14px}
  #pjMenu h1{font-size:24px}
  #pjMenu .aves{grid-template-columns:1fr;gap:10px}
  #pjMenu .ave .in{display:grid;grid-template-columns:112px 1fr;align-items:stretch}
  #pjMenu .ave .foto{aspect-ratio:auto;min-height:104px}
  #pjMenu .ave .foto::after{background:linear-gradient(90deg,transparent 60%,#0a131e)}
  #pjMenu .ave .foto::before{width:3px;height:auto;right:auto;bottom:0}
  #pjMenu .ave .txt{padding:10px 14px 10px 6px;align-self:center}
  #pjMenu .ave h3{font-size:16px}
  #pjMenu .ave .rol{margin:1px 0 4px;font-size:9.5px}
  #pjMenu .ave p{font-size:12px;margin:0 0 5px}
  #pjMenu .ave .dif{grid-column:2}
  #pjMenu .pie{flex-direction:column;align-items:stretch;gap:10px}
  #pjMenu .seg button{flex:1}
  #pjMenu .jugar{margin-left:0;width:100%;padding:17px 20px}
}
@media(max-height:520px) and (min-width:560px){
  #pjMenu .wrap{gap:10px;padding-top:12px;padding-bottom:12px;justify-content:flex-start}
  #pjMenu h1{font-size:20px}
  #pjMenu .aves{grid-template-columns:repeat(3,1fr);gap:8px}
  #pjMenu .ave .in{display:flex}
  #pjMenu .ave .foto{aspect-ratio:auto;height:72px;min-height:0}
  #pjMenu .ave .foto::after{background:linear-gradient(180deg,transparent 60%,#0a131e)}
  #pjMenu .ave .foto::before{width:auto;height:3px;right:0;bottom:auto}
  #pjMenu .ave .txt{padding:2px 10px 10px}
  #pjMenu .ave h3{font-size:14px}
  #pjMenu .ave p{display:none}
  #pjMenu .ave .rol{margin:1px 0 4px}
  #pjMenu .pie{flex-direction:row;align-items:center;gap:10px 14px}
  #pjMenu .seg button{padding:10px 14px;flex:none}
  #pjMenu .jugar{width:auto;margin-left:auto;padding:13px 34px}
}#pjListo{align-items:center;justify-content:center;background:rgba(3,8,14,.86);backdrop-filter:blur(6px)}
#pjListo .card{width:min(520px,92vw);background:linear-gradient(170deg,rgba(18,30,44,.97),rgba(8,15,24,.98));padding:26px 28px;clip-path:polygon(0 0,calc(100% - 22px) 0,100% 22px,100% 100%,22px 100%,0 calc(100% - 22px));box-shadow:inset 0 0 0 1px rgba(125,211,252,.35)}
#pjListo h2{font-size:20px;letter-spacing:.18em;text-transform:uppercase;margin-bottom:8px}
#pjListo p{font-size:13.5px;line-height:1.55;color:#a3b5c7;margin:6px 0}
#pjListo button.go{width:100%;margin-top:16px;border:none;border-radius:0;padding:15px;font-size:14px;font-weight:800;letter-spacing:.26em;text-transform:uppercase;color:#04121c;background:linear-gradient(100deg,#7dd3fc,#34d399)}
#pjEstado:empty,#pjXr:empty{display:none}
#pjHud{position:fixed;top:18px;left:18px;z-index:30;display:none;width:268px;padding:14px 16px 12px;color:#e8f1f8;font:12.5px "Segoe UI",system-ui,sans-serif;pointer-events:none;background:linear-gradient(170deg,rgba(10,20,31,.84),rgba(5,11,18,.88));clip-path:polygon(0 0,calc(100% - 16px) 0,100% 16px,100% 100%,16px 100%,0 calc(100% - 16px));box-shadow:inset 0 0 0 1px rgba(148,163,184,.28)}
#pjHud .cab{display:flex;justify-content:space-between;align-items:baseline;border-bottom:1px solid rgba(148,163,184,.2);padding-bottom:7px;margin-bottom:8px}
#pjHud .ave{font-size:10.5px;letter-spacing:.24em;text-transform:uppercase;color:var(--c,#7dd3fc);font-weight:700}
#pjHud .n{font-size:26px;font-weight:800;letter-spacing:.02em;line-height:1}
#pjHud .n small{font-size:10px;letter-spacing:.2em;color:#7b8ea3;margin-left:4px;font-weight:600}
#pjHud .fila{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:5px 0;font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:#7b8ea3}
#pjHud .fila b{color:#e8f1f8;letter-spacing:.06em;font-size:13px;font-weight:700}
#pjHud .pips{display:flex;gap:4px}
#pjHud .pips i{width:15px;height:8px;background:rgba(148,163,184,.25);transform:skewX(-20deg)}
#pjHud .pips i.o{background:var(--c,#7dd3fc)}
#pjHud .pips.vida i.o{background:#f87171}
#pjHud .barra{display:block;width:118px;height:6px;background:rgba(148,163,184,.22);overflow:hidden}
#pjHud .barra i{display:block;height:100%}
#pjHud .guia{display:flex;align-items:center;gap:8px;margin-top:8px;padding-top:7px;border-top:1px solid rgba(148,163,184,.2);font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:#fde68a}
#pjHud .arrow{display:inline-block;font-size:20px;transition:transform .1s;color:#fde047;line-height:1}
#pjHud .aviso{margin-top:7px;color:#fca5a5;font-weight:700;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase}
#pjSalir{position:fixed;top:18px;right:18px;z-index:31;display:none;border:none;border-radius:0;padding:11px 22px;font-size:11px;letter-spacing:.22em;text-transform:uppercase;background:rgba(8,16,26,.78);color:#dbeafe;box-shadow:inset 0 0 0 1px rgba(148,163,184,.35);clip-path:polygon(10px 0,100% 0,calc(100% - 10px) 100%,0 100%)}
#pjSnd{position:fixed;top:18px;right:150px;z-index:31;display:none;border:none;border-radius:0;padding:11px 18px;font-size:11px;letter-spacing:.2em;text-transform:uppercase;background:rgba(8,16,26,.78);color:#dbeafe;box-shadow:inset 0 0 0 1px rgba(148,163,184,.35);clip-path:polygon(10px 0,100% 0,calc(100% - 10px) 100%,0 100%)}
#pjSnd.mudo{color:#94a3b8;text-decoration:line-through}
body.pj #pjSnd{display:block}
body.pj.pjcb #pjSnd{display:none!important}
#pjSalir:hover{background:rgba(190,60,60,.8);color:#fff}
#pjMsg{position:fixed;left:50%;bottom:15%;transform:translateX(-50%);z-index:31;display:none;max-width:min(680px,90vw);background:rgba(5,11,18,.9);padding:12px 28px;font:700 13.5px "Segoe UI",system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#f8fafc;pointer-events:none;text-align:center;clip-path:polygon(12px 0,100% 0,calc(100% - 12px) 100%,0 100%);box-shadow:inset 0 -2px 0 #fbbf24}
#pjRuido{position:fixed;inset:0;z-index:29;display:none;pointer-events:none;box-shadow:inset 0 0 160px 40px rgba(239,68,68,.55);opacity:0;transition:opacity .15s}
body.pj .hud,body.pj #trafficHud,body.pj #toast{display:none!important}
body.pj #pjRuido{display:block}
body.pj.pjcb #pjRuido,body.pj.pjvr #pjRuido{display:none!important}
body.pj #pjHud.on,body.pj #pjSalir.on{display:block}
#pjMapa{position:fixed;top:68px;right:18px;z-index:30;display:none;width:176px;height:176px;border-radius:50%;pointer-events:none;background:#0b1622;box-shadow:0 0 0 2px rgba(232,241,248,.9),0 0 0 5px rgba(8,16,26,.72),0 10px 24px rgba(0,0,0,.5);opacity:.96}
body.pj #pjMapa.on{display:block}
body.pj.pjcb #pjMapa,body.pj.pjvr #pjMapa{display:none!important}
body.pj.pjcb #pjHud,body.pj.pjcb #pjSalir,body.pj.pjcb #pjMsg{display:none!important}
#pjTouch{position:fixed;inset:0;z-index:28;display:none;pointer-events:none;touch-action:none;user-select:none;-webkit-user-select:none}
body.pjtouch #pjTouch{display:block}
#pjStick{position:absolute;left:max(22px,env(safe-area-inset-left));bottom:max(26px,env(safe-area-inset-bottom));width:150px;height:150px;border-radius:50%;background:radial-gradient(circle,rgba(125,211,252,.10),rgba(125,211,252,.04) 70%);box-shadow:inset 0 0 0 2px rgba(200,225,245,.35);pointer-events:auto;touch-action:none}
#pjKnob{position:absolute;left:50%;top:50%;width:64px;height:64px;margin:-32px 0 0 -32px;border-radius:50%;background:rgba(232,241,248,.55);box-shadow:0 0 0 2px rgba(255,255,255,.7);transition:transform .05s}
#pjBtns{position:absolute;right:max(22px,env(safe-area-inset-right));bottom:max(26px,env(safe-area-inset-bottom));display:grid;grid-template-columns:auto auto;gap:12px;align-items:end;pointer-events:none}
#pjBtns button,#pjBCam{pointer-events:auto;touch-action:none;border:none;border-radius:0;font:700 12px "Segoe UI",system-ui,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#05131d;background:rgba(232,241,248,.82);padding:0 16px;height:58px;min-width:92px;clip-path:polygon(10px 0,100% 0,calc(100% - 10px) 100%,0 100%);-webkit-tap-highlight-color:transparent}
#pjBtns button:active,#pjBtns button.on{background:#7dd3fc}
#pjBAle{grid-column:1/3;height:74px;font-size:14px;background:rgba(125,211,252,.9)!important}
#pjBCam{position:absolute;right:max(22px,env(safe-area-inset-right));bottom:max(26px,env(safe-area-inset-bottom));display:none}
body.pjobs #pjBCam{display:block}body.pjobs #pjStick,body.pjobs #pjBtns{display:none}
#pjGira{position:fixed;left:50%;top:46%;transform:translateX(-50%);z-index:27;display:none;padding:10px 20px;background:rgba(5,11,18,.85);color:#e8f1f8;font:600 12px "Segoe UI",sans-serif;letter-spacing:.14em;text-transform:uppercase;pointer-events:none;text-align:center}
@media(orientation:portrait){body.pjtouch #pjGira{display:block;animation:pjFade 6s forwards}}
@keyframes pjFade{0%,70%{opacity:1}100%{opacity:0}}
@media(max-width:860px),(max-height:520px){
  #pjHud{top:8px;left:8px;width:172px;padding:8px 10px;font-size:11px}
  #pjHud .n{font-size:20px}
  #pjHud .fila{margin:3px 0;font-size:9.5px}
  #pjHud .fila b{font-size:11.5px}
  #pjHud .barra{width:68px}
  #pjHud .guia{font-size:9.5px;margin-top:5px;padding-top:5px}
  #pjMapa{top:52px;right:10px;width:118px;height:118px}
  #pjSalir{top:8px;right:8px;padding:9px 16px}
  #pjSnd{top:8px;right:92px;padding:9px 12px}
  #pjMsg{bottom:36%;font-size:11.5px;padding:8px 16px}
}body.pj #hud-c{display:none!important}
`;

const giro = (a, b) => { let x = b - a; while (x > Math.PI) x -= 2 * Math.PI; while (x < -Math.PI) x += 2 * Math.PI; return x; };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const sinEmoji = (s) => String(s).replace(/[\p{Extended_Pictographic}‍️▶➜✔✖]/gu, '').replace(/\s{2,}/g, ' ').trim();
const DATOS = [
  'Los humedales filtran el agua y guardan agua de lluvia: protegen a los barrios de las inundaciones.',
  'La tingua de pico rojo y el pato turrio viven en los humedales de la sabana de Bogotá.',
  'Las garzas pescan quedándose muy quietas y dando una estocada rápida con el pico.',
  'El pasto y los juncos del borde del agua son el refugio de los polluelos.',
  'Un humedal sano tiene agua limpia, juncos, árboles en la orilla y muchas aves.',
  'El ruido y el humo de los carros asustan a las aves y les dificultan anidar cerca de las avenidas.',
  'Los humedales urbanos son islas de vida: las aves deben cruzar calles peligrosas para llegar a ellos.'
];

// Cada ave está basada en cómo vive de verdad: cambia la velocidad, la energía, el giro, la carga y, sobre todo, la misión
//  - Garza real (Ardea alba): pesca al acecho (quieta o muy despacio, estocada rápida) y anida en colonias, en árboles, en una plataforma de palitos.
//  - Tingua de pico rojo (Gallinula galeata): vuela poco y bajo; nada y trepa por los juncos; hace su nido flotante con tallos y hojas del borde del agua.
//  - Gaviota andina (Chroicocephalus serranus): ágil y social; atrapa insectos al vuelo y en praderas; anida en el suelo, en nidos de pasto cerca del agua.
const AVES_JUEGO = {
  garza: {
    id: 'garza', foto: 'foto_garza.jpg', nombre: 'Garza real', rol: 'Pescadora al acecho', corto: 'Pesca peces al acecho y llévalos a tus polluelos.', color: '#7dd3fc', objetivo: 'pesca', meta: 10, cap: 3, nidoTipo: 'arbol',
    resumen: 'Pesca al acecho: acércate despacio y bajo a los peces que saltan, atrápalos y llévalos a tus polluelos. Tu nido de palitos está en un árbol de la colonia, al otro lado de la avenida.',
    vel: { min: 6, cru: 15, max: 30 }, regen: 9, hundir: 1.0, giro: 1.3, costo: 12, gasto: 0, item: ['pez', 'peces'],
    stats: [['Velocidad', 2], ['Resistencia', 3], ['Agilidad', 1], ['Dificultad', 2]], metaTxt: 'Alimenta a tus polluelos con 10 peces',
    ala: { base: '#f7f6f1', punta: '#2a2e36', espejo: null }, pico: 0xe8b923, escala: 0.62, cuerpo: '#f4f3ee', cabeza: '#f4f3ee',
    svg: '<path class="ala" d="M100 50C72 28 32 26 3 46c34-2 62 8 97 17 35-9 63-19 97-17-29-20-69-18-97 4z"/><ellipse class="cu" cx="100" cy="54" rx="8" ry="17"/><path class="cu" d="M96 40 92 16c-1-5 8-5 8 0l-2 24z"/><path class="pc" d="M92 16l-4-9 8 3z"/>'
  },
  tingua: {
    id: 'tingua', foto: 'foto_tingua.jpg', nombre: 'Tingua de pico rojo', rol: 'Constructora de nido', corto: 'Construye tu nido flotante con tallos de junco.', color: '#fb7185', objetivo: 'juncos', meta: 12, cap: 2, nidoTipo: 'flotante', techo: 14, reposo: 14,
    resumen: 'Casi no vuela: salta entre los juncos y cruza el agua en vuelos cortos y bajos. Junta tallos del borde del agua y construye tu nido flotante. Rozar el agua te deja descansar; subir mucho te agota.',
    vel: { min: 5, cru: 11, max: 20 }, regen: 1, hundir: 1.1, giro: 1.8, costo: 6, gasto: 5, item: ['tallo de junco', 'tallos de junco'],
    stats: [['Velocidad', 1], ['Resistencia', 1], ['Agilidad', 3], ['Dificultad', 3]], metaTxt: 'Construye tu nido con 12 tallos de junco',
    ala: { base: '#3a4350', punta: '#1d222b', espejo: null }, pico: 0xd63a2f, escala: 0.5, cuerpo: '#2b323d', cabeza: '#232a34',
    svg: '<path class="ala" d="M100 52C86 42 64 40 46 48c18 4 36 8 54 14 18-6 36-10 54-14-18-8-40-6-54 4z"/><ellipse class="cu" cx="100" cy="57" rx="11" ry="14"/><circle class="cu" cx="100" cy="40" r="7"/><path d="M103 36l10 3-10 3z" fill="#e0443a"/>'
  },
  gaviota: {
    id: 'gaviota', foto: 'foto_gaviota.jpg', nombre: 'Gaviota andina', rol: 'Cazadora de insectos', corto: 'Caza insectos al vuelo para tus polluelos.', color: '#fbbf24', objetivo: 'insectos', meta: 12, cap: 4, nidoTipo: 'suelo',
    resumen: 'Ágil y rápida: atraviesa los enjambres de insectos en pleno vuelo (si vas lento se escapan) y llévalos a tus polluelos, en un nido de pasto en la orilla. Cada sprint gasta energía.',
    vel: { min: 9, cru: 21, max: 40 }, regen: 7, hundir: 0.8, giro: 1.7, costo: 14, gasto: 6, item: ['bocado de insectos', 'bocados de insectos'],
    stats: [['Velocidad', 3], ['Resistencia', 2], ['Agilidad', 3], ['Dificultad', 2]], metaTxt: 'Alimenta a tus polluelos con 12 bocados de insectos',
    ala: { base: '#cfd4dc', punta: '#15171d', espejo: null }, pico: 0xb3342c, escala: 0.58, cuerpo: '#f1f2f4', cabeza: '#2d2622',
    svg: '<path class="ala" d="M100 52C78 34 50 28 24 38 16 28 7 28 1 35c24 17 60 19 99 28 39-9 75-11 99-28-6-7-15-7-23 3-26-10-54-4-76 14z"/><ellipse class="cu" cx="100" cy="55" rx="9" ry="14"/><circle class="cu" cx="100" cy="38" r="7"/><path d="M105 38l9 3-9 3z" fill="#c23b32"/>'
  }
};
const ESQUEST = /OculusBrowser|Quest|Pico/i.test(navigator.userAgent); // gafas independientes (sin PC)
const MOVIL = !ESQUEST && (/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (matchMedia('(pointer:coarse)').matches && Math.min(screen.width, screen.height) < 900)); // celular o tableta: controles táctiles automáticos
export function crearPajaro(ctx) {
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  const div = (id, html, cls) => { const e = document.createElement('div'); e.id = id; if (cls) e.className = cls; e.innerHTML = html || ''; document.body.appendChild(e); return e; };
  const tarjeta = (a) => `<button class="ave" data-ave="${a.id}" style="--c:${a.color}"><span class="in"><span class="foto"><img class="ph" src="data3d/aves/${a.foto}" alt="${a.nombre}" loading="lazy" decoding="async"><canvas class="m3d" aria-label="Modelo 3D de ${a.nombre}"></canvas></span><span class="txt"><h3>${a.nombre}</h3><em class="rol">${a.rol}</em><p>${a.corto}</p><span class="dif">Dificultad <span>${[1, 2, 3].map(k => `<i class="${k <= a.stats[3][1] ? 'o' : ''}"></i>`).join('')}</span></span></span></span></button>`;
  const menu = div('pjMenu', `<div class="wrap">
    <header><span class="marca">REN3D</span><button class="x" data-m="cerrar">Cerrar</button></header>
    <h1>Elige tu <span>ave</span></h1>
    <div class="aves">${Object.values(AVES_JUEGO).map(tarjeta).join('')}</div>
    <div class="pie">
      <div class="seg" id="pjSegJ"><button data-j="jugar" class="on">Jugar yo</button><button data-j="observar">Ver al ave sola</button></div>
      <label class="esp" id="pjVrL" style="display:none"><input type="checkbox" id="pjVr"> Gafas VR</label>
      <label class="esp" id="pjEspL" style="display:none"><input type="checkbox" id="pjEsp"> Ver en el computador lo que ves en las gafas</label>
      <button class="jugar" data-m="jugar" id="pjJugar">Comenzar</button>
      <div id="pjXr"></div><div id="pjEstado"></div>
    </div>
  </div>`);
  const listo = div('pjListo', `<div class="card"><h2 id="pjListoT">Mundo listo</h2><p id="pjListoP"></p><button class="go" id="pjGo">Empezar</button></div>`);
  const hud = div('pjHud', '');
  const btnSalir = document.createElement('button'); btnSalir.id = 'pjSalir'; btnSalir.textContent = 'Salir'; document.body.appendChild(btnSalir);
  const msgEl = div('pjMsg', '');
  const ruidoEl = div('pjRuido', '');
  const $ = (id) => document.getElementById(id);
  const pjEsp = $('pjEsp'), pjVr = $('pjVr');
  const touch = div('pjTouch', `<div id="pjStick"><div id="pjKnob"></div></div><div id="pjBtns"><button id="pjBFrena">Frenar</button><button id="pjBAcel">Acelerar</button><button id="pjBAle">Aletear</button></div><button id="pjBCam">Cámara</button>`);
  const gira = div('pjGira', 'Gira el celular en horizontal para jugar mejor');
  const tc = { x: 0, y: 0, acel: false, frena: false, id: null }; let tactil = false; // controles táctiles (celular): palanca para dirigir y botones
  {
    const stick = $('pjStick'), knob = $('pjKnob');
    const mover = (e) => { const r = stick.getBoundingClientRect(), R = 52; let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2); const l = Math.hypot(dx, dy); if (l > R) { dx *= R / l; dy *= R / l; } tc.x = dx / R; tc.y = dy / R; knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)'; };
    stick.addEventListener('pointerdown', (e) => { e.preventDefault(); tc.id = e.pointerId; try { stick.setPointerCapture(e.pointerId); } catch (_) { /* ok */ } mover(e); });
    stick.addEventListener('pointermove', (e) => { if (e.pointerId === tc.id) { e.preventDefault(); mover(e); } });
    const soltar = (e) => { if (e.pointerId === tc.id) { tc.id = null; tc.x = 0; tc.y = 0; knob.style.transform = 'translate(0,0)'; } };
    stick.addEventListener('pointerup', soltar); stick.addEventListener('pointercancel', soltar);
    const bt = (id, on, off) => { const b = $(id); b.addEventListener('pointerdown', (e) => { e.preventDefault(); b.classList.add('on'); on(); }); const u = () => { b.classList.remove('on'); if (off) off(); }; b.addEventListener('pointerup', u); b.addEventListener('pointercancel', u); b.addEventListener('pointerleave', u); };
    bt('pjBAcel', () => { tc.acel = true; }, () => { tc.acel = false; }); bt('pjBFrena', () => { tc.frena = true; }, () => { tc.frena = false; }); bt('pjBAle', () => { if (activo) aleteo(); });
    $('pjBCam').addEventListener('pointerdown', (e) => { e.preventDefault(); if (activo && modo === 'observar') { camVista++; ponerCamara(); } });
    pjVr.addEventListener('change', () => { modoSel = pjVr.checked ? 'vr' : 'pantalla'; pintarSel(); infoXr(); });
  }
  // ---- estado ----
  let T3 = null, activo = false, modo = null, loop = null, ultimo = 0;
  let AVE = AVES_JUEGO.garza, modoSel = 'pantalla', modoJ = 'jugar';
  const rig = new THREE.Group(); rig.rotation.order = 'YXZ';
  let yaw = 0, pit = 0, vel = 14, impulso = 0, acelera = false, frena = false;
  const teclas = {};
  const guardado = {};
  let efecto = null, sesionXR = null, wakeLock = null;
  const dir = new THREE.Vector3(), tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
  let calidad = 0, tAcum = 0, nAcum = 0, tPrev = 0;
  let picoM = null, alaI = null, alaD = null, hudPlano = null, hudCv = null, hudTex = null, tHud = 0, tAleteo = 0;
  const sim = { puntos: 0, llevando: 0, entregados: 0, tiempo: 0, mejor: 0, terminado: false, aro: 0, aros: 0, msgHasta: 0, msgTxt: '', vidas: 3, energia: 100, inmune: 0, perdido: false, ex: 0, golpes: 0, restante: 0 };
  let caida = 0, lift = 0, sacudida = 0; // movimiento vertical extra: la turbulencia del tráfico te hunde, aletear te sube
  let peces = [], nido = null, marcas = null, arosPos = [], aroMesh = null;
  let audio = null, vientoG = null, trafG = null, motG = null, tBocina = 3;

  // ---------------------------------------------------------------- menú y arranque
  const estado = (t) => { $('pjEstado').textContent = t || ''; };
  const pintarSel = () => {
    menu.querySelectorAll('.ave').forEach(b => b.classList.toggle('sel', b.getAttribute('data-ave') === AVE.id));
    menu.style.setProperty('--cs', AVE.color);
    menu.querySelectorAll('#pjSeg button').forEach(b => b.classList.toggle('on', b.getAttribute('data-c') === modoSel));
    menu.querySelectorAll('#pjSegJ button').forEach(b => b.classList.toggle('on', b.getAttribute('data-j') === modoJ));
    $('pjVrL').style.display = hayVr && modoJ === 'jugar' ? 'flex' : 'none'; $('pjEspL').style.display = hayVr && modoJ === 'jugar' && pjVr.checked ? 'flex' : 'none'; $('pjJugar').textContent = modoJ === 'observar' ? 'Ver vuelo' : 'Comenzar';
  };
  let hayVr = false; // las gafas sólo se ofrecen si el navegador las reconoce (en el celular se juega con controles táctiles, sin elegir nada)
  async function abrirMenu() {
    menu.style.display = 'block'; estado(''); pjEsp.checked = espejo; pintarSel();
    try { hayVr = !MOVIL && !!navigator.xr && await navigator.xr.isSessionSupported('immersive-vr'); } catch (e) { hayVr = false; }
    pintarSel(); iniciarMenu3D(); await infoXr();
  }
  // aves 3D del menú: un solo renderer dibuja cada modelo (los mismos del humedal, con más resolución) y lo copia al lienzo de su tarjeta; si falla, quedan las fotos
  let m3d = null, m3dCarga = false;
  async function iniciarMenu3D() {
    if (m3dCarga) return; if (m3d) { m3d.arranca(); return; }
    m3dCarga = true;
    try {
      const mod = await import('./aves_menu.js?v=2');
      const rend = new THREE.WebGLRenderer({ alpha: true, antialias: true }); rend.toneMapping = THREE.ACESFilmicToneMapping; rend.toneMappingExposure = 1.05;
      const esc = new THREE.Scene(); esc.add(new THREE.HemisphereLight(0xdfeeff, 0x2a3a2a, 0.55));
      const sol = new THREE.DirectionalLight(0xfff1dc, 2.4); sol.position.set(2.5, 4, 3); esc.add(sol);
      const rim = new THREE.DirectionalLight(0x9bd8ff, 1.6); rim.position.set(-3, 2, -3); esc.add(rim);
      try { const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js'); const pm = new THREE.PMREMGenerator(rend); esc.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; pm.dispose(); } catch (e) { /* sin reflejos de ambiente */ }
      const cam = new THREE.PerspectiveCamera(30, 1, 0.05, 50);
      // material de plumaje: brillo suave tipo plumón (sheen), rugosidad por vértice (pico y ojos brillantes) y un relieve fino alargado en el sentido de las plumas
      const mat = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.78, metalness: 0, sheen: 0.35, sheenRoughness: 0.65, sheenColor: new THREE.Color(0x6f7f90), envMapIntensity: 0.4, side: THREE.DoubleSide });
      mat.onBeforeCompile = (sh) => {
        sh.vertexShader = 'attribute float rug;\nvarying float vRug;\nvarying vec3 vOP;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvRug = rug; vOP = position;');
        sh.fragmentShader = `varying float vRug; varying vec3 vOP;
          float h31(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
          float vn3(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(mix(mix(h31(i), h31(i + vec3(1,0,0)), f.x), mix(h31(i + vec3(0,1,0)), h31(i + vec3(1,1,0)), f.x), f.y), mix(mix(h31(i + vec3(0,0,1)), h31(i + vec3(1,0,1)), f.x), mix(h31(i + vec3(0,1,1)), h31(i + vec3(1,1,1)), f.x), f.y), f.z); }
          float plumH(vec3 p){ return vn3(p * vec3(60.0, 60.0, 15.0)) * 0.65 + vn3(p * vec3(140.0, 140.0, 34.0)) * 0.35; }
        ` + sh.fragmentShader
          .replace('float roughnessFactor = roughness;', 'float roughnessFactor = roughness * vRug;')
          .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
          { float hh = plumH(vOP) * smoothstep(0.35, 0.7, vRug) * 0.55; vec2 dH = vec2(dFdx(hh), dFdy(hh));
            vec3 sX = normalize(dFdx(-vViewPosition)), sY = normalize(dFdy(-vViewPosition)), R1 = cross(sY, normal), R2 = cross(normal, sX); float det = dot(sX, R1);
            normal = normalize(abs(det) * normal - sign(det) * (dH.x * R1 + dH.y * R2)); }`);
      };
      mat.customProgramCacheKey = () => 'aves-menu-v2';
      const items = [];
      menu.querySelectorAll('.ave').forEach((b) => {
        const geo = mod.geometriaAveMenu(b.getAttribute('data-ave')), cv = b.querySelector('canvas.m3d'); if (!geo || !cv) return;
        geo.computeBoundingBox(); const bb = geo.boundingBox, c = bb.getCenter(new THREE.Vector3()), s = bb.getSize(new THREE.Vector3());
        const mesh = new THREE.Mesh(geo, mat); mesh.position.sub(c); const piv = new THREE.Group(); piv.add(mesh); piv.visible = false; esc.add(piv);
        if (b.getAttribute('data-ave') !== 'gaviota') { // las aves de pie llevan sombra de contacto sobre el suelo
          const cv2 = document.createElement('canvas'); cv2.width = cv2.height = 128; const g2 = cv2.getContext('2d'), gr = g2.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, 'rgba(0,0,0,.75)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g2.fillStyle = gr; g2.fillRect(0, 0, 128, 128);
          const som = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv2), transparent: true, depthWrite: false })); som.rotation.x = -Math.PI / 2; som.position.y = bb.min.y - c.y + 0.002; som.scale.setScalar(Math.max(s.x, s.z) * 0.9); piv.add(som);
        }
        items.push({ b, cv, c2: cv.getContext('2d'), piv, alto: s.y / 2, radio: Math.hypot(s.x, s.z) / 2, listo: false, off: items.length * 2.1 });
      });
      let rw = 0, rh = 0, corre = false;
      const dibuja = () => {
        if (menu.style.display !== 'block') { corre = false; return; }
        const t = performance.now() / 1000, dpr = Math.min(devicePixelRatio || 1, 2);
        for (const it of items) {
          const w = it.cv.clientWidth, h = it.cv.clientHeight; if (!w || !h) continue;
          const pw = Math.round(w * dpr), ph = Math.round(h * dpr);
          if (it.cv.width !== pw || it.cv.height !== ph) { it.cv.width = pw; it.cv.height = ph; }
          if (rw !== pw || rh !== ph) { rend.setPixelRatio(1); rend.setSize(pw, ph, false); rw = pw; rh = ph; }
          cam.aspect = w / h; cam.updateProjectionMatrix();
          const vf = cam.fov * Math.PI / 360, hf = Math.atan(Math.tan(vf) * cam.aspect), d = Math.max(it.alto * 1.12 / Math.tan(vf), it.radio * 0.9 / Math.tan(hf)) + it.radio * 0.45;
          cam.position.set(0, d * 0.22, d); cam.lookAt(0, 0, 0);
          for (const o of items) o.piv.visible = o === it;
          it.piv.rotation.y = 0.6 + t * (it.b.classList.contains('sel') ? 0.9 : 0.45) + it.off; it.piv.rotation.x = Math.sin(t * 0.8 + it.off) * 0.04;
          rend.render(esc, cam); it.c2.clearRect(0, 0, pw, ph); it.c2.drawImage(rend.domElement, 0, 0);
          if (!it.listo) { it.listo = true; it.cv.parentNode.classList.add('ok'); }
        }
        requestAnimationFrame(dibuja);
      };
      m3d = { arranca: () => { if (!corre) { corre = true; requestAnimationFrame(dibuja); } } };
      m3d.arranca();
    } catch (e) { console.warn('aves 3D del menú no disponibles, se dejan las fotos', e); }
    m3dCarga = false;
  }
  async function infoXr() {
    const el = $('pjXr'); if (modoSel === 'cardboard') { el.textContent = 'Pon el celular en horizontal dentro del visor; se pedirá permiso de movimiento.'; return; }
    if (modoSel !== 'vr') { el.textContent = ''; return; }
    try {
      if (navigator.xr && await navigator.xr.isSessionSupported('immersive-vr')) el.textContent = 'Tu navegador reconoce gafas VR (WebXR). ' + (ESQUEST ? 'Se cargan los edificios y los carros alrededor del humedal, optimizados para que vaya fluido. Para el máximo detalle conecta las gafas al PC (Quest Link) y abre la página en Chrome o Edge.' : 'Se carga la versión completa, con edificios y tráfico.');
      else el.textContent = navigator.xr ? 'WebXR sin gafas conectadas: conecta las gafas (Quest Link o SteamVR) o abre esta página en el navegador de las gafas.' : 'Este navegador no tiene WebXR: abre la página en el navegador de las gafas o en Chrome o Edge con las gafas conectadas.';
    } catch (e) { /* sin WebXR */ }
  }
  addEventListener('keydown', (e) => { if (menu.style.display !== 'block') return; if (e.key === 'Enter') { e.preventDefault(); $('pjJugar').click(); } else if (e.key === 'Escape') menu.style.display = 'none'; });
  menu.addEventListener('click', (e) => {
    const a = e.target.closest('.ave'); if (a) { AVE = AVES_JUEGO[a.getAttribute('data-ave')] || AVE; pintarSel(); return; }
    const j = e.target.closest('#pjSegJ button'); if (j) { modoJ = j.getAttribute('data-j'); pintarSel(); return; }
    const c = e.target.closest('#pjSeg button'); if (c) { modoSel = c.getAttribute('data-c'); pintarSel(); infoXr(); return; }
    const b = e.target.closest('button[data-m]'); if (!b) return;
    const m = b.getAttribute('data-m');
    if (m === 'cerrar') { menu.style.display = 'none'; return; }
    elegir(modoJ === 'observar' ? 'observar' : modoSel);
  });
  const esperarGesto = (titulo, texto, boton) => new Promise((res) => {
    $('pjListoT').textContent = titulo; $('pjListoP').textContent = texto; $('pjGo').textContent = boton; listo.style.display = 'flex';
    $('pjGo').onclick = () => { listo.style.display = 'none'; res(); };
  });
  async function elegir(m) {
    // celular: versión ligera. Quest sola: versión media (con edificios, sin sombras ni tráfico). Gafas conectadas al PC (Link/SteamVR): versión completa
    const nivel = m === 'cardboard' || MOVIL ? 'ligero' : (m === 'vr' && ESQUEST) ? 'medio' : 'completo';
    let cargo = false;
    if (!ctx.listo() || (nivel === 'medio' && ctx.faltanEdificios && ctx.faltanEdificios())) { // en las Quest se cargan los edificios del entorno del humedal aunque el mundo ya estuviera abierto sin ellos
      cargo = true; estado('Cargando el mundo' + (nivel === 'completo' ? '' : nivel === 'medio' ? ' (versión media para las gafas)' : ' (versión ligera)') + '. Puede tardar un poco...');
      try { await ctx.cargar(nivel); } catch (e) { estado('No se pudo cargar el mundo: ' + (e && e.message || e)); return; }
    }
    if (!ctx.listo()) { estado('El mundo 3D no cargó.'); return; }
    menu.style.display = 'none';
    if (cargo || m === 'vr') {
      const txt = m === 'vr' ? 'Ponte las gafas y pulsa el botón. Si el navegador pide permiso para la realidad virtual, acéptalo.' : m === 'cardboard' ? 'Pulsa el botón, pon el celular en horizontal dentro del visor y acepta el permiso de movimiento.' : 'Pulsa el botón para volar.';
      await esperarGesto('Mundo listo · ' + AVE.nombre, txt, m === 'vr' ? 'Entrar en realidad virtual' : 'Empezar a volar');
    }
    comenzar(m);
  }


  // ---------------------------------------------------------------- objetos del juego
  // ala de garza hecha de plumas: cada pluma tiene forma, raquis y barbas dibujadas (textura), y el ala se dobla en la muñeca al aletear
  function texPluma(tipo) { // tipo: 'base' (cuerpo del ala), 'punta' (primarias oscuras) o 'espejo' (parche de color de los patos)
    const pal = AVE.ala, punta = tipo === 'punta';
    const cv = document.createElement('canvas'); cv.width = 128; cv.height = 32; const g = cv.getContext('2d');
    const hw = (u) => 14.5 * Math.min(1, 0.35 + u * 4) * Math.sqrt(Math.max(0, 1 - Math.pow(u, 3.2)));
    g.beginPath(); g.moveTo(0, 16); for (let i = 0; i <= 40; i++) { const u = i / 40; g.lineTo(u * 127, 16 - hw(u)); } for (let i = 40; i >= 0; i--) { const u = i / 40; g.lineTo(u * 127, 16 + hw(u)); } g.closePath();
    const gr = g.createLinearGradient(0, 0, 128, 0);
    if (tipo === 'espejo') { gr.addColorStop(0, pal.espejo); gr.addColorStop(0.8, pal.espejo); gr.addColorStop(0.92, '#f4f4f0'); gr.addColorStop(1, '#f4f4f0'); }
    else { gr.addColorStop(0, pal.base); gr.addColorStop(punta ? 0.5 : 1, pal.base); if (punta) { gr.addColorStop(0.8, pal.punta); gr.addColorStop(1, pal.punta); } }
    g.fillStyle = gr; g.fill(); g.save(); g.clip();
    g.lineWidth = 0.9; for (let x = 4; x < 124; x += 2.6) { g.strokeStyle = 'rgba(70,70,60,' + (0.1 + 0.08 * ((x * 7) % 3)) + ')'; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(x, 16); g.lineTo(x + 13, 16 + s * 14); g.stroke(); } } // barbas
    g.strokeStyle = punta ? 'rgba(20,22,28,.65)' : 'rgba(150,148,138,.9)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(0, 16); g.lineTo(124, 16); g.stroke(); // raquis
    g.restore();
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
  }
  function geoPluma(L, W) { // lámina fina, en el plano XZ, que sale del origen hacia +X (sin dibujar el borde con una caja)
    const n = 7, P = [], U = [], I = [];
    for (let i = 0; i <= n; i++) { const t = i / n, x = t * L, w = W / 2 * (0.55 + 0.45 * Math.sin(Math.min(1, t * 1.6) * Math.PI / 2)); P.push(x, 0, -w, x, 0, w); U.push(t, 0, t, 1); if (i < n) { const a = i * 2; I.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setIndex(I); g.computeVertexNormals(); return g;
  }
  function crearAlas() {
    const mBlanca = new THREE.MeshLambertMaterial({ map: texPluma('base'), alphaTest: 0.45, side: THREE.DoubleSide, emissive: 0x2a2a28 }), mPunta = new THREE.MeshLambertMaterial({ map: texPluma('punta'), alphaTest: 0.45, side: THREE.DoubleSide, emissive: 0x242426 });
    const mEsp = AVE.ala.espejo ? new THREE.MeshLambertMaterial({ map: texPluma('espejo'), alphaTest: 0.45, side: THREE.DoubleSide, emissive: 0x161c26 }) : mBlanca;
    const mk = (lado) => {
      const piv = new THREE.Group(), esp = new THREE.Group(), muneca = new THREE.Group(); esp.add(muneca); piv.add(esp); if (lado < 0) esp.scale.x = -1;
      const pl = (par, mat, L, W, x, z, ang, y, rz) => { const m = new THREE.Mesh(geoPluma(L, W), mat); m.position.set(x, y || 0, z); m.rotation.y = -ang; if (rz) m.rotation.z = rz; m.frustumCulled = false; par.add(m); return m; };
      const brazo = 0.5, mx = brazo, mz = -0.07; muneca.position.set(mx, 0, mz);
      for (let k = 0; k < 9; k++) pl(esp, k >= 2 && k <= 6 ? mEsp : mBlanca, 0.40 + 0.04 * Math.sin(k / 8 * Math.PI), 0.1, brazo * (0.04 + k / 8 * 0.9), -0.02 + (mz + 0.02) * (k / 8), 1.3 - 0.18 * (k / 8), 0.0, 0.02); // secundarias (en el antebrazo)
      const prim = []; for (let k = 0; k < 10; k++) { const a = 0.02 + k / 9 * 0.95, L = 0.34 + 0.24 * Math.sin((1 - k / 9) * 1.35 + 0.15); prim.push(pl(muneca, mPunta, L, 0.09, 0, 0.0, a, 0.004 * k, 0)); } // primarias en abanico, de punta oscura
      for (let k = 0; k < 7; k++) pl(esp, mBlanca, 0.2 + 0.05 * (k % 2), 0.12, brazo * (0.02 + k / 6 * 0.95), -0.035, 1.25, 0.012, 0.0); // cubiertas (tapan la base de las plumas)
      for (let k = 0; k < 5; k++) pl(muneca, mBlanca, 0.17, 0.11, 0.0 + k * 0.01, -0.01 - k * 0.012, 0.35 + k * 0.2, 0.012, 0.0);
      piv.scale.setScalar(AVE.escala); piv.position.set(lado * 0.26, -0.36, -0.7); piv.userData = { muneca, prim }; return piv;
    };
    fabricaAla = mk; alaI = mk(-1); alaD = mk(1);
    // pico amarillo, largo y fino, que se ve al mirar hacia abajo
    const pico = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.34, 6), new THREE.MeshLambertMaterial({ color: AVE.pico, emissive: 0x2a2208 })); pico.rotation.x = -Math.PI / 2; pico.position.set(0, -0.09, -0.45); pico.frustumCulled = false; picoM = pico;
  }
  function crearHudPlano() {
    hudCv = document.createElement('canvas'); hudCv.width = 640; hudCv.height = 360;
    hudTex = new THREE.CanvasTexture(hudCv); hudTex.colorSpace = THREE.SRGBColorSpace;
    hudPlano = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.405), new THREE.MeshBasicMaterial({ map: hudTex, transparent: true, depthTest: false, depthWrite: false, fog: false, toneMapped: false }));
    hudPlano.position.set(0, -0.6, -1.5); hudPlano.renderOrder = 999; hudPlano.frustumCulled = false;
  }
  const matHaz = (color, op) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
  function crearPez() { // el objeto a recoger depende del ave: pez (garza), tallo de junco (tingua) o enjambre de insectos (gaviota)
    const g = new THREE.Group();
    if (AVE.objetivo === 'juncos') {
      const m = new THREE.MeshLambertMaterial({ color: 0x6f9a3c, emissive: 0x1c2c0c }), m2 = new THREE.MeshLambertMaterial({ color: 0x5a3a22 });
      for (let i = 0; i < 7; i++) { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 2.4 + (i % 3) * 0.4, 5), m); t.rotation.z = Math.PI / 2 + (i - 3) * 0.05; t.rotation.y = (i - 3) * 0.12; t.position.set(0, 0.05 + (i % 2) * 0.05, (i - 3) * 0.1); g.add(t); }
      const e = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.5, 6), m2); e.rotation.z = Math.PI / 2; e.position.set(1.3, 0.12, 0); g.add(e); g.visible = false; return g;
    }
    if (AVE.objetivo === 'insectos') {
      const n = 40, pos = new Float32Array(n * 3), geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0x1b1f26, size: 0.55, sizeAttenuation: true, transparent: true, opacity: 0.95, fog: false })); pts.frustumCulled = false; pts.userData.fase = Array.from({ length: n }, (_, i) => [rnd(i * 3 + 1) * 6.28, rnd(i * 5 + 2) * 6.28, 1.2 + rnd(i * 7 + 3) * 3.2]); pts.visible = false; return pts;
    }
    const mat = new THREE.MeshStandardMaterial({ color: 0xd2dde2, metalness: 0.6, roughness: 0.22, emissive: 0x3c5260, emissiveIntensity: 0.6 });
    const cu = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 9), mat); cu.scale.set(0.45, 0.8, 2.0); g.add(cu);
    const co = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.35, 4), mat); co.rotation.x = -Math.PI / 2; co.rotation.z = Math.PI / 4; co.position.z = -0.55; g.add(co);
    g.visible = false; return g;
  }
  function puntoAgua(burro, margen, maxMargen) { for (let i = 0; i < 40; i++) { const p = ctx.aves().punto(burro, margen, maxMargen); if (p) return p; } return [burro.cx, burro.cz]; }
  function ponerPez(f) {
    const b = ctx.aves().burro, obj = AVE.objetivo;
    f.vivo = true; f.sig = 0.5 + Math.random() * 3; f.salto = -1; f.haz.visible = true; f.y = 0.4;
    if (obj === 'pesca') { const p = puntoAgua(b, 14); f.x = p[0]; f.z = p[1]; f.mesh.visible = false; f.haz.position.set(f.x, 30, f.z); return; }
    if (obj === 'juncos') { const p = puntoAgua(b, 2, 14); f.x = p[0]; f.z = p[1]; f.y = 0.35; f.mesh.rotation.y = Math.random() * 6.28; }
    else { const p = puntoAgua(b, 6); f.x = p[0] + (Math.random() - 0.5) * 120; f.z = p[1] + (Math.random() - 0.5) * 120; f.y = 14 + Math.random() * 30; const a = Math.random() * 6.28; f.vx = Math.cos(a) * 2.2; f.vz = Math.sin(a) * 2.2; } // enjambre a la deriva
    f.mesh.visible = true; f.mesh.position.set(f.x, f.y, f.z); f.haz.position.set(f.x, f.y + 20, f.z);
  }  // ---------------------------------------------------------------- avenida con tráfico (queda entre el humedal y el nido)
  const via = { cadenas: [], coches: [], seg: [], intens: 0.3, hora: 0, d: 999, estado: 0 };
  const lw = (x, z) => ctx.lw(x, z);
  const rnd = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  function cercaDe(pts, x, z) { // punto del borde del polígono más cercano a (x,z): [qx, qz, distancia]
    let m = 1e9, qx = x, qz = z;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], c = pts[(i + 1) % pts.length], dx = c[0] - a[0], dz = c[1] - a[1], l2 = dx * dx + dz * dz || 1e-9, t = clamp(((x - a[0]) * dx + (z - a[1]) * dz) / l2, 0, 1), px = a[0] + t * dx, pz = a[1] + t * dz, q = Math.hypot(x - px, z - pz);
      if (q < m) { m = q; qx = px; qz = pz; }
    }
    return [qx, qz, m];
  }
  function construirAvenida(b) {
    via.cadenas = []; via.coches = []; via.seg = [];
    const N = T3.net; if (!N || !N.edges) return;
    const E = [], mx0 = b.x0 - 260, mx1 = b.x1 + 260, mz0 = b.z0 - 260, mz1 = b.z1 + 260;
    for (const e of N.edges) {
      if (e[0] === 'local' || !e[1] || e[1].length < 2) continue;
      const pts = e[1].map(p => lw(p[0], p[1])); let md = 1e9;
      for (const p of pts) if (p[0] > mx0 && p[0] < mx1 && p[1] > mz0 && p[1] < mz1) md = Math.min(md, cercaDe(b.pts, p[0], p[1])[2]);
      E.push({ cl: e[0], pts, md, usado: false });
    }
    const k = (p) => Math.round(p[0] / 3) + ',' + Math.round(p[1] / 3), ady = new Map();
    E.forEach((e, i) => { for (const f of [0, 1]) { const kk = k(f ? e.pts[e.pts.length - 1] : e.pts[0]); if (!ady.has(kk)) ady.set(kk, []); ady.get(kk).push([i, f]); } });
    const extender = (path, largoMax) => { // sigue la vía por su extremo, eligiendo siempre el tramo más recto, para que la avenida no termine de golpe
      let largo = 0;
      while (largo < largoMax) {
        const h = path[path.length - 1], p0 = path[Math.max(0, path.length - 2)];
        let ux = h[0] - p0[0], uz = h[1] - p0[1]; const ul = Math.hypot(ux, uz) || 1; ux /= ul; uz /= ul;
        let mejor = null, mv = 0.35;
        for (const [i, f] of ady.get(k(h)) || []) {
          const e = E[i]; if (e.usado) continue; const q = f ? e.pts.slice().reverse() : e.pts, vx = q[1][0] - q[0][0], vz = q[1][1] - q[0][1], dot = (vx * ux + vz * uz) / (Math.hypot(vx, vz) || 1);
          if (dot > mv) { mv = dot; mejor = [i, q]; }
        }
        if (!mejor) break;
        E[mejor[0]].usado = true; const q = mejor[1];
        for (let j = 1; j < q.length; j++) { largo += Math.hypot(q[j][0] - q[j - 1][0], q[j][1] - q[j - 1][1]); path.push(q[j]); }
      }
    };
    let semillas = E.filter(e => e.cl === 'major' && e.md < 170).sort((a, c) => a.md - c.md);
    if (!semillas.length) semillas = E.filter(e => e.md < 170).sort((a, c) => a.md - c.md);
    for (const s of semillas) {
      if (s.usado || via.cadenas.length >= 4) continue;
      s.usado = true; const path = s.pts.slice(); extender(path, 450); path.reverse(); extender(path, 450);
      const cum = [0]; for (let i = 1; i < path.length; i++) cum.push(cum[i - 1] + Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]));
      if (cum[cum.length - 1] < 40) continue;
      via.cadenas.push({ pts: path, cum, L: cum[cum.length - 1] });
      for (let i = 0; i < path.length - 1; i++) via.seg.push([path[i][0], path[i][1], path[i + 1][0], path[i + 1][1]]);
    }
    // avenida de dos calzadas: si hay otra cadena paralela muy cerca, cada una es de un solo sentido (se conduce por la derecha); si no, doble sentido
    const medio = (ch) => { let j = 0; while (j < ch.pts.length - 2 && ch.cum[j + 1] < ch.L / 2) j++; const a = ch.pts[j], e = ch.pts[j + 1], l = (ch.cum[j + 1] - ch.cum[j]) || 1; return { x: (a[0] + e[0]) / 2, z: (a[1] + e[1]) / 2, dx: (e[0] - a[0]) / l, dz: (e[1] - a[1]) / l }; };
    via.cadenas.forEach((ch, ci) => {
      const m = medio(ch); let mejor = null, md = 55;
      via.cadenas.forEach((o, oi) => {
        if (oi === ci) return; let dm = 1e9, ox = 0, oz = 0;
        for (let i = 0; i < o.pts.length - 1; i++) { const a = o.pts[i], e = o.pts[i + 1], dx = e[0] - a[0], dz = e[1] - a[1], l2 = dx * dx + dz * dz || 1e-9, t = clamp(((m.x - a[0]) * dx + (m.z - a[1]) * dz) / l2, 0, 1), px = a[0] + t * dx, pz = a[1] + t * dz, q = Math.hypot(m.x - px, m.z - pz); if (q < dm) { dm = q; ox = px; oz = pz; } }
        if (dm < md && dm > 3) { md = dm; mejor = [ox, oz]; }
      });
      if (mejor) ch.unico = ((m.x - mejor[0]) * -m.dz + (m.z - mejor[1]) * m.dx) > 0 ? 1 : -1;
    });
    // carros: muchos más que en la simulación normal; según la hora pico se ven unos u otros (rank = orden en que aparecen)
    const Ltot = via.cadenas.reduce((a, c) => a + c.L, 0), TOT = T3.liviano ? 220 : 320; let id = 0;
    via.cadenas.forEach((ch, ci) => {
      const n = Math.round(TOT * ch.L / (Ltot || 1));
      for (let i = 0; i < n; i++) {
        const dir = ch.unico || (id % 2 ? 1 : -1), lane = ch.unico ? (id % 3) : ((id >> 1) % 2);
        via.coches.push({ id: id++, ch: ci, j: 0, s: rnd(id * 3 + 1) * ch.L, dir, off: ch.unico ? (lane - 1) * 3.0 : dir * (2.0 + lane * 2.8), v0: 9 + lane * 0.8 + rnd(id * 5 + 2) * 3.5, rank: rnd(id * 7 + 4), act: false, x: 0, z: 0, h: 0 });
      }
    });
    via.coches.forEach(c => { posCoche(c); c.act = c.rank < 0.3; });
  }
  function posCoche(c) {
    const ch = via.cadenas[c.ch], pts = ch.pts, cum = ch.cum; let j = c.j;
    while (j > 0 && cum[j] > c.s) j--;
    while (j < pts.length - 2 && cum[j + 1] < c.s) j++;
    c.j = j; const a = pts[j], e = pts[j + 1], l = (cum[j + 1] - cum[j]) || 1, t = clamp((c.s - cum[j]) / l, 0, 1), dx = (e[0] - a[0]) / l, dz = (e[1] - a[1]) / l, off = c.off;
    c.x = a[0] + (e[0] - a[0]) * t - dz * off; c.z = a[1] + (e[1] - a[1]) * t + dx * off; c.h = Math.atan2(dx * c.dir, dz * c.dir);
  }
  function distVia(x, z) { // distancia al eje de la avenida
    let m = 1e9;
    for (const s of via.seg) { const dx = s[2] - s[0], dz = s[3] - s[1], l2 = dx * dx + dz * dz || 1e-9, t = clamp(((x - s[0]) * dx + (z - s[1]) * dz) / l2, 0, 1), q = Math.hypot(x - (s[0] + t * dx), z - (s[1] + t * dz)); if (q < m) m = q; }
    return m;
  }
  function nidoAlOtroLado(b) { // el nido queda pasando la avenida: al lado contrario del humedal
    if (!via.cadenas.length) return null;
    const av = ctx.aves(); let mejor = null, md = 1e12, cx = 0, cz = 0;
    for (let i = 0; i < 200; i++) { const q = puntoAgua(b, 5); cx += q[0] / 200; cz += q[1] / 200; } // centro del agua (donde saltan los peces)
    const cruza = (ax, az, bx, bz) => via.seg.some(s => { // ¿el trayecto A→B atraviesa algún tramo de la avenida?
      const d1x = bx - ax, d1z = bz - az, d2x = s[2] - s[0], d2z = s[3] - s[1], den = d1x * d2z - d1z * d2x; if (Math.abs(den) < 1e-9) return false;
      const t = ((s[0] - ax) * d2z - (s[1] - az) * d2x) / den, u = ((s[0] - ax) * d1z - (s[1] - az) * d1x) / den; return t > 0 && t < 1 && u > 0 && u < 1;
    });
    for (const ch of via.cadenas) for (let s = 0; s < ch.L; s += 10) {
      let j = 0; while (j < ch.pts.length - 2 && ch.cum[j + 1] < s) j++;
      const a = ch.pts[j], e = ch.pts[j + 1], l = (ch.cum[j + 1] - ch.cum[j]) || 1, t = (s - ch.cum[j]) / l, x = a[0] + (e[0] - a[0]) * t, z = a[1] + (e[1] - a[1]) * t, tx = (e[0] - a[0]) / l, tz = (e[1] - a[1]) / l;
      for (const lado of [-1, 1]) {
        const nx = x - tz * lado * 105, nz = z + tx * lado * 105; // 105 m a un lado de la vía, fuera de la turbulencia fuerte
        if (av.dentro(nx, nz, b.pts) || cercaDe(b.pts, nx, nz)[2] < 40 || distVia(nx, nz) < 80) continue;
        if (!cruza(nx, nz, cx, cz)) continue; // el nido tiene que quedar al otro lado de la avenida respecto al agua
        const dc = Math.hypot(nx - cx, nz - cz); if (dc < md) { md = dc; mejor = [nx, nz]; }
      }
    }
    return mejor;
  }
  // intensidad del tráfico (0 calmado … 1 hora pico): sube y baja cada minuto y sube un poco con cada entrega
  function pasoTrafico(dt) {
    via.hora += dt;
    const onda = 0.5 - 0.5 * Math.cos(via.hora / 60 * Math.PI * 2), meta = clamp(0.2 + 0.7 * onda + 0.04 * sim.entregados, 0.2, 1);
    via.intens += (meta - via.intens) * Math.min(1, dt * 0.35);
    const frac = (0.1 + 0.9 * via.intens) * (via.tope || 1), vm = 1 - 0.5 * via.intens, p = rig.position;
    for (const c of via.coches) {
      c.s += c.dir * c.v0 * vm * dt; const L = via.cadenas[c.ch].L; if (c.s > L) c.s -= L; else if (c.s < 0) c.s += L;
      posCoche(c);
      const q = c.rank < frac; if (q !== c.act && (Math.abs(c.x - p.x) + Math.abs(c.z - p.z) > 140 || p.y > 200)) c.act = q; // no aparecen ni desaparecen carros delante de ti
    }
    const est = via.intens > 0.78 ? 2 : via.intens < 0.42 ? 0 : 1;
    if (est !== via.estado) { if (est === 2 && via.estado !== 2) mensaje('🚨 ¡Hora pico! Muchos carros y mucho ruido: cruza volando alto', 3500); if (est === 0 && via.estado === 2) mensaje('🟢 Pasó la hora pico: buen momento para cruzar', 3000); via.estado = est; }
  }
  // fuerza de la turbulencia en un punto: cerca de la avenida, bajo y con mucho tráfico es máxima
  function exposicion(p) {
    via.d = distVia(p.x, p.z);
    return Math.pow(clamp(1 - via.d / 95, 0, 1), 0.8) * Math.pow(clamp(1 - p.y / 75, 0, 1), 0.8) * via.intens;
  }
  function aleteo() { // aletear sube, pero cansa
    if (sim.energia < 12) { if (performance.now() - (sim.avisoE || 0) > 2500) { sim.avisoE = performance.now(); mensaje('Sin energía: planea unos segundos lejos del tráfico', 2000); } lift = Math.min(22, lift + 4); return; }
    sim.energia -= AVE.costo || 12; lift = Math.min(22, lift + 15); impulso += 4; tAleteo = 0.6; sAleteo();
  }
  function chocar(motivo) {
    if (sim.inmune > 0 || sim.perdido) return;
    sim.vidas--; sim.golpes++; const perdidos = sim.llevando; sim.llevando = 0; sim.energia = 100; sim.inmune = 3.5; caida = 0; lift = 0;
    sChoque();
    const b = ctx.aves().burro, p0 = puntoSeguro(b); rig.position.set(p0[0], AVE.techo ? 8 : 38, p0[1]); vel = AVE.vel.cru; impulso = 0;
    if (sim.vidas <= 0) fallar(motivo);
    else mensaje(motivo + (perdidos ? ' Perdiste ' + perdidos + ' ' + (perdidos > 1 ? AVE.item[1] : AVE.item[0]) + '.' : '') + ' Vidas: ' + sim.vidas, 4000);
  }
  function nidoSeguro(b) { // nido de la gaviota: en la orilla del humedal, lejos de la avenida (el riesgo está en ir a buscar la comida)
    const av = ctx.aves(); let mejor = null, md = 1e9;
    for (let i = 0; i < 200; i++) {
      const x = b.x0 - 120 + Math.random() * (b.x1 - b.x0 + 240), z = b.z0 - 120 + Math.random() * (b.z1 - b.z0 + 240);
      if (av.dentro(x, z, b.pts)) continue; const d = cercaDe(b.pts, x, z)[2]; if (d < 25 || d > 90) continue;
      const dv = via.seg.length ? distVia(x, z) : 500; const sc = Math.abs(dv - 320); if (sc < md) { md = sc; mejor = [x, z]; } // a unos 300 m de la avenida: lejos del peligro, pero un viaje razonable
    }
    return mejor;
  }
  function puntoSeguro(b) { // un punto del agua lo más lejos posible de la avenida (para arrancar y reaparecer tranquilo)
    let mejor = puntoAgua(b, 40), md = via.seg.length ? distVia(mejor[0], mejor[1]) : 0;
    for (let i = 0; i < 24 && via.seg.length; i++) { const q = puntoAgua(b, 40), d = distVia(q[0], q[1]); if (d > md) { md = d; mejor = q; } }
    return mejor;
  }
  // ---- nidos reales: palitos entrelazados (no hay torre ni huevos); los polluelos piden comida con el pico abierto
  function palitos(g, n, R, y0, alto, color, grosor) {
    const m = new THREE.MeshLambertMaterial({ color });
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.28, r = R * (0.15 + Math.random() * 0.95), len = R * (0.9 + Math.random() * 1.1);
      const s = new THREE.Mesh(new THREE.CylinderGeometry(grosor * 0.7, grosor, len, 5), m);
      s.position.set(Math.cos(a) * r * 0.8, y0 + Math.random() * alto + (r > R * 0.7 ? alto * 0.6 : 0), Math.sin(a) * r * 0.8);
      s.rotation.set((Math.random() - 0.5) * 0.5, Math.random() * 3.14, Math.PI / 2 + (Math.random() - 0.5) * 0.45); s.frustumCulled = false; g.add(s);
    }
  }
  function polluelo(g, x, y, z, color, pico) {
    const c = new THREE.Group(), m = new THREE.MeshLambertMaterial({ color, emissive: 0x181614 });
    const cu = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), m); cu.scale.set(1, 0.85, 1.25); c.add(cu);
    const cuello = new THREE.Group(); cuello.position.set(0, 0.12, -0.14); c.add(cuello);
    const cab = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), m); cab.position.set(0, 0.16, -0.04); cuello.add(cab);
    const pc = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.2, 5), new THREE.MeshLambertMaterial({ color: pico })); pc.rotation.x = -Math.PI / 2; pc.position.set(0, 0.16, -0.17); cuello.add(pc);
    c.position.set(x, y, z); c.rotation.y = Math.random() * 6.28; g.add(c); return cuello;
  }
  function crearNido(b) {
    const av = ctx.aves(), tipo = AVE.nidoTipo; let pos = null, yN = 0.4;
    if (tipo === 'arbol') pos = nidoAlOtroLado(b);
    else if (tipo === 'flotante') { let md = -1; for (let i = 0; i < 30; i++) { const q = puntoAgua(b, 3, 12), dv = via.seg.length ? distVia(q[0], q[1]) : 400; if (dv > md) { md = dv; pos = q; } } }
    else pos = nidoSeguro(b);
    for (let i = 0; i < 80 && !pos; i++) { // sin avenida en los datos: nido cerca de la orilla
      const x = b.x0 - 150 + Math.random() * (b.x1 - b.x0 + 300), z = b.z0 - 150 + Math.random() * (b.z1 - b.z0 + 300);
      if (av.dentro(x, z, b.pts)) continue; const d = av.distBorde(x, z, b.pts);
      if (d > 30 && d < 90) pos = [x, z];
    }
    pos = pos || [b.cx + (b.x1 - b.x0) / 2 + 60, b.cz];
    const g = new THREE.Group(), chicos = [];
    if (tipo === 'arbol') { // la garza anida en colonias, en las copas: se busca un árbol alto cerca del lugar elegido
      const P = T3.trees && T3.trees.pos; let bi = -1, bd = 1e9;
      if (P) for (let i = 0; i < P.X.length; i++) { const d = Math.hypot(P.X[i] - pos[0], P.Z[i] - pos[1]); if (d < 80 && P.Hh[i] >= 10 && d - P.Hh[i] * 2 < bd) { bd = d - P.Hh[i] * 2; bi = i; } }
      if (bi >= 0) { pos = [P.X[bi], P.Z[bi]]; yN = Math.max(9, P.Hh[bi] * 0.82); }
      else { yN = 12; const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.5, 11, 7), new THREE.MeshLambertMaterial({ color: 0x4a3626 })); tr.position.y = 5.5; g.add(tr); }
      g.position.set(pos[0], yN, pos[1]); palitos(g, 70, 1.0, 0, 0.35, 0x5b4129, 0.045); palitos(g, 26, 1.25, 0.1, 0.2, 0x70503a, 0.05);
      for (let i = 0; i < 2; i++) chicos.push(polluelo(g, (i - 0.5) * 0.5, 0.28, 0.05 * i, 0xf1efe8, 0xd9a82b));
    } else if (tipo === 'flotante') { // la tingua: plataforma de tallos sobre el agua, entre juncos
      yN = 0.45; g.position.set(pos[0], 0, pos[1]); 
      const mv = new THREE.MeshLambertMaterial({ color: 0x6f9a3c, emissive: 0x16240a }); for (let i = 0; i < 22; i++) { const a = i * 0.29 + Math.random() * 0.3, h = 1.6 + Math.random() * 1.2, j = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, h, 5), mv); j.position.set(Math.cos(a) * 1.35, h / 2, Math.sin(a) * 1.35); j.rotation.set((Math.random() - 0.5) * 0.25, 0, (Math.random() - 0.5) * 0.25); g.add(j); }
      const base = new THREE.Group(); base.position.y = 0.3; g.add(base); palitos(base, 26, 0.8, 0, 0.12, 0x7a6a3a, 0.04);
      for (let i = 0; i < 2; i++) chicos.push(polluelo(g, (i - 0.5) * 0.4, 0.45, 0.05 * i, 0x20252c, 0xd63a2f));
      g.userData.base = base;
    } else { // la gaviota: nido de pasto en el suelo, cerca del agua
      yN = 0.4; g.position.set(pos[0], 0, pos[1]); palitos(g, 40, 0.7, 0.05, 0.1, 0xb8a46a, 0.03);
      for (let i = 0; i < 2; i++) chicos.push(polluelo(g, (i - 0.5) * 0.4, 0.3, 0.05 * i, 0xa89a82, 0xc9a24a));
    }
    const haz = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 150, 10, 1, true), matHaz(0xe8f4ff, 0.07)); haz.position.y = 75 - (tipo === 'arbol' ? 0 : 0); g.add(haz); // baliza muy tenue para ubicarlo desde lejos
    T3.scene.add(g); return { g, x: pos[0], y: tipo === 'arbol' ? yN : 1.2, z: pos[1], chicos, tipo };
  }
  function animarNido(dt, d) { // los polluelos piden comida: más cuanto más cerca estés
    if (!nido) return; const t = sim.tiempo, ex = d < 60 ? 1 : 0.3;
    nido.chicos.forEach((c, i) => { c.rotation.x = -0.25 - ex * (0.3 + 0.25 * Math.sin(t * 7 + i * 1.7)); c.position.y = ex * 0.03 * Math.sin(t * 9 + i); });
  }
  function crecerNido(n) { // la tingua va armando su nido: cada tallo entregado agrega palitos
    if (!nido || nido.tipo !== 'flotante') return; const base = nido.g.userData.base; palitos(base, 7 * n, 0.8 + 0.04 * sim.entregados, 0, 0.12 + 0.01 * sim.entregados, 0x7a6a3a, 0.045); base.scale.setScalar(1 + sim.entregados * 0.03);
  }  function crearAros(b) {
    const rx = (b.x1 - b.x0) / 2 + 90, rz = (b.z1 - b.z0) / 2 + 90; arosPos = [];
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; arosPos.push(new THREE.Vector3(b.cx + Math.cos(a) * rx * 0.8, 28 + (i % 3) * 16, b.cz + Math.sin(a) * rz * 0.8)); }
    aroMesh = new THREE.Group();
    aroMesh.add(new THREE.Mesh(new THREE.TorusGeometry(10, 0.9, 10, 40), matHaz(0x5eead4, 0.9)));
    aroMesh.add(new THREE.Mesh(new THREE.TorusGeometry(10, 2.2, 8, 40), matHaz(0x2dd4bf, 0.18)));
    T3.scene.add(aroMesh); colocarAro();
  }
  function colocarAro() {
    const p = arosPos[sim.aro % arosPos.length], q = arosPos[(sim.aro + arosPos.length - 1) % arosPos.length];
    aroMesh.position.copy(p); aroMesh.lookAt(q.x, p.y, q.z); // el aro mira hacia el aro anterior (por donde vienes)
  }
  function preparar() {
    const av = ctx.aves(), b = av && av.burro; if (!b) throw new Error('No hay datos del Humedal El Burro');
    limpiarJuego();
    try { construirAvenida(b); } catch (e) { console.warn('avenida:', e); via.cadenas = []; via.coches = []; via.seg = []; } // primero la avenida: los restos de comida y el nido dependen de ella
    peces = []; for (let i = 0; i < (AVE.objetivo === 'juncos' ? 9 : AVE.objetivo === 'insectos' ? 5 : 7); i++) {
      const mesh = crearPez(), haz = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 60, 8, 1, true), matHaz(AVE.objetivo === 'insectos' ? 0xfbbf24 : AVE.objetivo === 'juncos' ? 0x86efac : 0x7dd3fc, AVE.objetivo === 'pesca' ? 0.3 : 0.2));
      T3.scene.add(mesh, haz); const f = { mesh, haz }; ponerPez(f); peces.push(f);
    }
    T3.extraCars = via.coches.length ? (F) => { for (const c of via.coches) if (c.act) F.add(c.x, c.z, c.h, 5000 + c.id); } : null; // la flota de carros dibuja también los de la avenida
    nido = crearNido(b); crearAros(b);
    Object.assign(sim, { puntos: 0, llevando: 0, entregados: 0, tiempo: 0, terminado: false, aro: 0, aros: 0, vidas: 3, energia: 100, inmune: 2, perdido: false, ex: 0, golpes: 0, restante: 100 });
    via.hora = 0; via.intens = 0.3; via.estado = 0; caida = 0; lift = 0; sacudida = 0;
    try { sim.mejor = Number(localStorage.getItem('ren3d_pajaro_mejor') || 0); } catch (e) { sim.mejor = 0; }
    // arranque: sobre el agua del humedal, mirando al primer pez
    const p0 = puntoSeguro(b), f0 = peces[0];
    rig.position.set(p0[0], AVE.techo ? 8 : 38, p0[1]); yaw = Math.atan2(p0[0] - f0.x, p0[1] - f0.z); pit = -0.12; vel = AVE.vel.cru; impulso = 0; // la cámara mira hacia -Z girada por yaw: así arranca mirando al primer objetivo
    rig.rotation.set(0, 0, 0);
  }
  // la avenida con carros circulando también FUERA de la partida (pantalla de inicio del mundo 3D, sobre todo en gafas independientes, donde no hay simulación de tráfico)
  function mundoVivo() {
    if (activo) return;
    const av = ctx.aves(), b = av && av.burro, T = ctx.T3(); if (!b || !T || !T.net) return;
    T3 = T;
    try { construirAvenida(b); } catch (e) { console.warn('avenida (inicio):', e); via.cadenas = []; via.coches = []; via.seg = []; return; }
    if (!via.coches.length) return;
    for (const c of via.coches) c.act = c.rank < 0.6;
    T.extraCars = (F) => { for (const c of via.coches) if (c.act) F.add(c.x, c.z, c.h, 5000 + c.id); };
    T.mundoTick = (dt) => { for (const c of via.coches) { c.s += c.dir * c.v0 * 0.8 * dt; const L = via.cadenas[c.ch].L; if (c.s > L) c.s -= L; else if (c.s < 0) c.s += L; posCoche(c); } };
  }
  function limpiarJuego() {
    for (const f of peces) { T3.scene.remove(f.mesh, f.haz); }
    peces = [];
    if (T3) { T3.extraCars = null; T3.mundoTick = null; } via.coches = []; via.cadenas = []; via.seg = [];
    if (nido) { T3.scene.remove(nido.g); nido = null; }
    if (aroMesh) { T3.scene.remove(aroMesh); aroMesh = null; }
  }

  // ---------------------------------------------------------------- confort en gafas: entrada con fundido, viñeta suave al girar o con turbulencia, vibración en los controles
  let vinM = null, fadeM = null, tFade = 0, tSnap = 0;
  function crearConfort() {
    const cv = document.createElement('canvas'); cv.width = cv.height = 256; const g = cv.getContext('2d'), gr = g.createRadialGradient(128, 128, 60, 128, 128, 128);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.5, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.96)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    const tex = new THREE.CanvasTexture(cv), mat = (o) => Object.assign({ transparent: true, depthTest: false, depthWrite: false, fog: false, toneMapped: false }, o);
    vinM = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.7), new THREE.MeshBasicMaterial(mat({ map: tex, opacity: 0 }))); vinM.position.set(0, 0, -0.25); vinM.renderOrder = 997; vinM.frustumCulled = false; vinM.visible = false;
    fadeM = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), new THREE.MeshBasicMaterial(mat({ color: 0x000000, opacity: 1 }))); fadeM.position.set(0, 0, -0.3); fadeM.renderOrder = 998; fadeM.frustumCulled = false;
  }
  function confortPaso(dt) {
    if (fadeM && tFade > 0) { tFade -= dt; fadeM.material.opacity = clamp(tFade / 1.3, 0, 1); if (tFade <= 0) fadeM.visible = false; }
    if (vinM) { tSnap = Math.max(0, tSnap - dt); const o = clamp(sim.ex * 0.9 + (tSnap > 0 ? 0.55 : 0) + (sim.inmune > 3 ? 0.35 : 0), 0, 0.8); vinM.material.opacity += (o - vinM.material.opacity) * Math.min(1, dt * 7); vinM.visible = vinM.material.opacity > 0.01; }
  }
  function vibrar(i, ms) { // vibración en los controles de las gafas
    if (modo !== 'vr' || !T3) return;
    try { const s = T3.renderer.xr.getSession && T3.renderer.xr.getSession(); if (!s) return; for (const src of s.inputSources) { const gp = src.gamepad, h = gp && ((gp.hapticActuators && gp.hapticActuators[0]) || gp.vibrationActuator); if (!h) continue; if (h.pulse) h.pulse(i, ms); else if (h.playEffect) h.playEffect('dual-rumble', { duration: ms, strongMagnitude: i, weakMagnitude: i }); } } catch (e) { /* sin vibración */ }
  }
  // ---------------------------------------------------------------- sonido: todo suave y sintetizado (viento, agua, aves lejanas, aleteo, avisos); se puede silenciar
  let bus = null, aguaG = null, bufRuido = null, tAve = 2, sonidoOn = true;
  try { sonidoOn = localStorage.getItem('ren3d_sonido') !== '0'; } catch (e) { /* ok */ }
  let trafP = null, grillosG = null, tRana = 6, tNido = 1, tPos = 0; const VOL = 0.28; // volumen general bajo; en gafas aún más (se oye pegado a los oídos)
  function iniciarAudio() {
    try {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      audio = new AC(); try { if (audio.state === 'suspended') audio.resume(); } catch (e) { /* ok */ } const n = audio.sampleRate * 2; bufRuido = audio.createBuffer(1, n, audio.sampleRate); const d = bufRuido.getChannelData(0);
      let l = 0; for (let i = 0; i < n; i++) { l = l * 0.97 + (Math.random() * 2 - 1) * 0.03; d[i] = l * 6; }
      const comp = audio.createDynamicsCompressor(); comp.threshold.value = -30; comp.ratio.value = 8; bus = audio.createGain(); bus.gain.value = sonidoOn ? VOL * (modo === 'vr' ? 0.85 : 1) : 0; bus.connect(comp); comp.connect(audio.destination);
      // sin viento, agua, grillos ni ruido de tráfico: sólo suena el pajarito (suave) y, cerca de la avenida, la alarma de peligro
    } catch (e) { audio = null; }
  }
  function nota(f0, dur, vol, tipo, retraso, f1, pan) { // tono corto con entrada y salida suaves
    if (!audio || !bus) return;
    try {
      const t = audio.currentTime + (retraso || 0), o = audio.createOscillator(), g = audio.createGain(), fl = audio.createBiquadFilter(); o.type = tipo || 'sine'; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
      fl.type = 'lowpass'; fl.frequency.value = 3600; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + Math.min(0.02, dur * 0.3)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(fl); fl.connect(g); let out = g; if (pan != null && audio.createStereoPanner) { const p = audio.createStereoPanner(); p.pan.value = pan; g.connect(p); out = p; } out.connect(bus); o.start(t); o.stop(t + dur + 0.05);
    } catch (e) { /* sin audio */ }
  }
  function soplo(dur, vol, f0, f1) { // ruido filtrado: aleteo, golpe
    if (!audio || !bus || !bufRuido) return;
    try { const t = audio.currentTime, s = audio.createBufferSource(), fl = audio.createBiquadFilter(), g = audio.createGain(); s.buffer = bufRuido; s.playbackRate.value = 1.4; fl.type = 'bandpass'; fl.Q.value = 0.8; fl.frequency.setValueAtTime(f0, t); fl.frequency.exponentialRampToValueAtTime(f1, t + dur); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + dur * 0.35); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(fl); fl.connect(g); g.connect(bus); s.start(t, Math.random()); s.stop(t + dur + 0.05); } catch (e) { /* sin audio */ }
  }
  const pip = (f0, f1, dur, vol) => nota(f0, dur, Math.min(0.05, (vol || 0.1) * 0.3), 'sine', 0, f1); // los avisos viejos suenan ahora muy suaves
  // todos los sonidos del juego son del pajarito: trinos suaves (cada ave con su voz); los avisos «de juego» son trinos cortos
  const VOZ = { garza: [1900, 2700, 0.16], tingua: [1500, 2300, 0.09], gaviota: [2500, 3300, 0.12] }; // [grave, agudo, duración de cada nota]
  function trino(n, vol, pan, sube) {
    const v = VOZ[AVE.id] || VOZ.garza, base = v[0] + Math.random() * (v[1] - v[0]), d = v[2] * (0.5 + Math.random() * 0.4);
    for (let i = 0; i < n; i++) nota(base + i * 90, d, vol * (0.8 + Math.random() * 0.4), 'sine', i * d * 1.25, base + i * 90 + (sube ? 520 : -420), pan);
  }
  const sAleteo = () => { vibrar(0.12, 40); };
  const sCaptura = () => { vibrar(0.35, 80); trino(2, 0.09, 0, true); };
  const sEntrega = () => { vibrar(0.5, 160); for (let i = 0; i < 5; i++) nota(3000 + Math.random() * 500, 0.06, 0.05, 'sine', i * 0.1, 3800); }; // polluelos felices
  const sAro = () => { vibrar(0.25, 60); };
  const sChoque = () => { vibrar(1, 320); nota(660, 0.18, 0.2, 'sawtooth'); nota(440, 0.3, 0.2, 'sawtooth', 0.14); nota(90, 0.4, 0.16, 'sine'); };
  const sFin = () => { trino(3, 0.09, 0, true); setTimeout(() => trino(3, 0.08, 0, true), 700); };
  function chirp() { trino(2 + Math.floor(Math.random() * 3), 0.07, Math.random() * 1.2 - 0.6, Math.random() < 0.5); } // el pajarito canta de vez en cuando
  // peligro: aviso de dos tonos que se acelera y sube de volumen a medida que te acercas a la avenida (y más aún si vas bajo)
  let tPel = 0, pelAlt = 0;
  function peligro(dt, p) {
    const lvl = via.seg.length ? clamp(1 - via.d / 130, 0, 1) * clamp(1.2 - p.y / 150, 0.35, 1) : 0;
    tPel -= dt; if (lvl <= 0.03 || tPel > 0 || sim.perdido) return;
    tPel = 1.15 - 0.95 * lvl; pelAlt ^= 1;
    nota(pelAlt ? 880 : 622, 0.14 + 0.12 * (1 - lvl), 0.06 + 0.2 * lvl, lvl > 0.6 ? 'sawtooth' : 'triangle');
    if (lvl > 0.5) nota(95, 0.16, 0.14 * lvl, 'sine');
    if (lvl > 0.35) vibrar(0.15 + 0.4 * lvl, 60);
  }
  const ptV = new THREE.Vector3(), upV = new THREE.Vector3(), fwV = new THREE.Vector3();
  function oidos(dt, p) { // el oído sigue a la cabeza (gafas): la calle suena a un lado, los polluelos desde el nido
    const L = audio.listener, m = T3.camera.matrixWorld.elements; ptV.set(m[12], m[13], m[14]); fwV.set(-m[8], -m[9], -m[10]); upV.set(m[4], m[5], m[6]);
    if (L.positionX) { L.positionX.value = ptV.x; L.positionY.value = ptV.y; L.positionZ.value = ptV.z; L.forwardX.value = fwV.x; L.forwardY.value = fwV.y; L.forwardZ.value = fwV.z; L.upX.value = upV.x; L.upY.value = upV.y; L.upZ.value = upV.z; }
    else if (L.setPosition) { L.setPosition(ptV.x, ptV.y, ptV.z); L.setOrientation(fwV.x, fwV.y, fwV.z, upV.x, upV.y, upV.z); }
    tPos -= dt; if (tPos <= 0 && trafP && via.seg.length) { tPos = 0.1; let m2 = 1e9, qx = 0, qz = 0; for (const s of via.seg) { const dx = s[2] - s[0], dz = s[3] - s[1], l2 = dx * dx + dz * dz || 1e-9, t = clamp(((p.x - s[0]) * dx + (p.z - s[1]) * dz) / l2, 0, 1), x = s[0] + t * dx, z = s[1] + t * dz, d = Math.hypot(p.x - x, p.z - z); if (d < m2) { m2 = d; qx = x; qz = z; } } if (trafP.positionX) { trafP.positionX.value = qx; trafP.positionY.value = 1; trafP.positionZ.value = qz; } else trafP.setPosition(qx, 1, qz); }
  }
  function piarNido(dt, p) { // los polluelos piden comida cuando te acercas al nido (suena desde el nido)
    tNido -= dt; if (!nido || tNido > 0) return; const d = Math.hypot(nido.x - p.x, nido.y - p.y, nido.z - p.z); tNido = 1.1 + Math.random() * 1.6; if (d > 55) return;
    const pn = audio.createPanner(); pn.panningModel = 'HRTF'; pn.refDistance = 6; pn.rolloffFactor = 1.2; if (pn.positionX) { pn.positionX.value = nido.x; pn.positionY.value = nido.y; pn.positionZ.value = nido.z; } else pn.setPosition(nido.x, nido.y, nido.z); pn.connect(bus);
    const t = audio.currentTime; for (let i = 0; i < 3; i++) { const o = audio.createOscillator(), g = audio.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(3000 + Math.random() * 500, t + i * 0.1); o.frequency.exponentialRampToValueAtTime(3900, t + i * 0.1 + 0.07); g.gain.setValueAtTime(0.0001, t + i * 0.1); g.gain.linearRampToValueAtTime(0.03, t + i * 0.1 + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.1 + 0.09); o.connect(g); g.connect(pn); o.start(t + i * 0.1); o.stop(t + i * 0.1 + 0.12); }
  }
  function audioPaso(dt, p) {
    if (!audio) return; oidos(dt, p); piarNido(dt, p);
    tAve -= dt; if (tAve <= 0) { tAve = 3 + Math.random() * 6; chirp(); }
    peligro(dt, p);
  }
  const btnSnd = document.createElement('button'); btnSnd.id = 'pjSnd'; document.body.appendChild(btnSnd);
  const pintarSnd = () => { btnSnd.textContent = sonidoOn ? 'Sonido' : 'Silencio'; btnSnd.classList.toggle('mudo', !sonidoOn); };
  btnSnd.onclick = () => { sonidoOn = !sonidoOn; try { localStorage.setItem('ren3d_sonido', sonidoOn ? '1' : '0'); } catch (e) { /* ok */ } if (bus) bus.gain.value = sonidoOn ? VOL : 0; pintarSnd(); try { if (audio && audio.state === 'suspended') audio.resume(); } catch (e) { /* ok */ } }; pintarSnd();
  // ---------------------------------------------------------------- mensajes y HUD
  function mensaje(t, seg) {
    t = sinEmoji(t);
    sim.msgTxt = t; sim.msgHasta = performance.now() + (seg || 3000);
    if (modo !== 'cardboard') { msgEl.textContent = t; msgEl.style.display = 'block'; setTimeout(() => { if (performance.now() >= sim.msgHasta - 50) msgEl.style.display = 'none'; }, (seg || 3000) + 60); }
  }
  const fmt = (s) => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  function objetivo() { // a dónde apuntar la flecha: el nido si vas con la carga completa, si no el objetivo más cercano
    if (nido && sim.llevando >= AVE.cap) return { x: nido.x, y: nido.y, z: nido.z, txt: 'Ve al nido' };
    let best = null, bd = 1e12; const p = rig.position;
    for (const f of peces) { if (!f.vivo) continue; const d = (f.x - p.x) ** 2 + (f.z - p.z) ** 2; if (d < bd) { bd = d; best = f; } }
    if (nido && sim.llevando > 0 && (!best || bd > 90000)) return { x: nido.x, y: nido.y, z: nido.z, txt: 'Ve al nido' };
    if (best) return { x: best.x, y: 1, z: best.z, txt: 'Objetivo cercano' };
    return nido ? { x: nido.x, y: nido.y, z: nido.z, txt: 'Nido' } : null;
  }
  const ETQ = { pesca: 'Peces', juncos: 'Tallos', insectos: 'Bocados' };
  function pintarHud() {
    const o = objetivo(), p = rig.position; let rel = 0, dist = 0;
    camaraDir(dir);
    if (o) { rel = giro(Math.atan2(dir.x, dir.z), Math.atan2(o.x - p.x, o.z - p.z)); dist = Math.hypot(o.x - p.x, o.z - p.z); }
    const en = Math.round(sim.energia), colE = en > 50 ? '#4ade80' : en > 20 ? '#fde047' : '#f87171', tr = Math.round(via.intens * 100), colT = tr > 75 ? '#f87171' : tr > 45 ? '#fb923c' : '#4ade80';
    const aviso = sim.ex > 0.12 ? (sim.energia < 12 ? 'Sin energía: te hundes' : 'Turbulencia del tráfico: sube y aletea') : '';
    const pips = (n, tot, cls) => `<span class="pips ${cls || ''}">${Array.from({ length: tot }, (_, k) => `<i class="${k < n ? 'o' : ''}"></i>`).join('')}</span>`;
    const tiempo = fmt(sim.tiempo);
    if (modo !== 'cardboard' && modo !== 'vr') { // en gafas el marcador va dentro de la escena: no se toca el HTML (ahorra trabajo)
      hud.style.setProperty('--c', AVE.color);
      hud.innerHTML = `<div class="cab"><span class="ave">${AVE.nombre}</span><span class="n">${sim.puntos}<small>PTS</small></span></div>`
        + `<div class="fila">Vidas ${pips(sim.vidas, 3, 'vida')}</div>`
        + `<div class="fila">${ETQ[AVE.objetivo]} <b>${sim.entregados} / ${AVE.meta}</b></div>`
        + (AVE.cap > 1 ? `<div class="fila">Carga ${pips(sim.llevando, AVE.cap)}</div>` : '')
        + `<div class="fila">Energía <span class="barra"><i style="width:${en}%;background:${colE}"></i></span></div>`
        + `<div class="fila">Tráfico <span class="barra"><i style="width:${tr}%;background:${colT}"></i></span></div>`
        + (modo === 'observar' ? `<div class="guia">${bot.estado || 'Buscando objetivo'}</div>` : o ? `<div class="guia"><span class="arrow" style="transform:rotate(${-rel}rad)">&#10148;</span>${o.txt} ${Math.round(dist)} m</div>` : '') + (aviso ? `<div class="aviso">${aviso}</div>` : '');
    }    if ((modo === 'vr' || modo === 'cardboard') && hudCv) {
      const g = hudCv.getContext('2d'), W = hudCv.width, H = hudCv.height;
      g.clearRect(0, 0, W, H); g.fillStyle = 'rgba(6,14,22,.82)'; g.strokeStyle = sim.ex > 0.12 ? 'rgba(248,113,113,.95)' : 'rgba(148,163,184,.55)'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(4, 4); g.lineTo(W - 30, 4); g.lineTo(W - 4, 30); g.lineTo(W - 4, H - 4); g.lineTo(30, H - 4); g.lineTo(4, H - 30); g.closePath(); g.fill(); g.stroke();
      const txt = (s, x, y, f, c) => { g.font = f; g.fillStyle = c; g.fillText(s, x, y); };
      txt(AVE.nombre.toUpperCase(), 28, 40, '700 22px "Segoe UI",system-ui,sans-serif', AVE.color); txt(String(sim.puntos), 28, 96, '800 52px "Segoe UI",system-ui,sans-serif', '#fff'); txt('PTS', 30 + g.measureText(String(sim.puntos)).width + 8, 96, '600 20px "Segoe UI",system-ui,sans-serif', '#7b8ea3');
      for (let k = 0; k < 3; k++) { g.fillStyle = k < sim.vidas ? '#f87171' : 'rgba(148,163,184,.3)'; g.fillRect(W - 150 + k * 40, 60, 30, 14); }
      txt('MANTÉN A/B/X/Y: SALIR', W - 232, 36, '700 17px "Segoe UI",system-ui,sans-serif', '#93a8bd');
      txt(ETQ[AVE.objetivo].toUpperCase() + '  ' + sim.entregados + ' / ' + AVE.meta, 28, 138, '700 28px "Segoe UI",system-ui,sans-serif', '#e8f1f8');
      txt('TIEMPO ' + tiempo + '   ALT ' + Math.round(p.y) + ' m', 28, 174, '600 24px "Segoe UI",system-ui,sans-serif', '#a3b5c7');
      if (AVE.cap > 1) for (let k = 0; k < AVE.cap; k++) { g.fillStyle = k < sim.llevando ? AVE.color : 'rgba(148,163,184,.3)'; g.fillRect(W - 150 + k * 40, 120, 30, 14); }
      const barra = (y, v, c, t) => { txt(t, 28, y + 15, '600 20px "Segoe UI",system-ui,sans-serif', '#7b8ea3'); g.fillStyle = 'rgba(148,163,184,.25)'; g.fillRect(190, y, 230, 14); g.fillStyle = c; g.fillRect(190, y, 230 * clamp(v, 0, 1), 14); };
      barra(190, sim.energia / 100, colE, 'ENERGÍA'); barra(218, via.intens, colT, 'TRÁFICO');
      if (o) { txt(o.txt.toUpperCase() + '  ' + Math.round(dist) + ' m', 28, 268, '700 24px "Segoe UI",system-ui,sans-serif', '#fde68a'); g.save(); g.translate(W - 70, 214); g.rotate(-rel); g.fillStyle = '#fde047'; g.beginPath(); g.moveTo(0, -40); g.lineTo(28, 28); g.lineTo(0, 12); g.lineTo(-28, 28); g.closePath(); g.fill(); g.restore(); }
      if (aviso) txt(aviso.toUpperCase().slice(0, 34), 28, 300, '800 22px "Segoe UI",system-ui,sans-serif', '#fca5a5');
      if (performance.now() < sim.msgHasta) { g.fillStyle = 'rgba(0,0,0,.72)'; g.fillRect(14, 310, W - 28, 40); txt(sim.msgTxt.slice(0, 46), 26, 339, '700 22px "Segoe UI",system-ui,sans-serif', '#fef9c3'); }
      hudTex.needsUpdate = true;
    }
  }
  // ---------------------------------------------------------------- reglas del juego
  function juego(dt) {
    const p = rig.position, av = ctx.aves(), b = av.burro;
    if (!sim.terminado) sim.tiempo += dt;
    // energía: depende del ave (la tingua descansa rozando el agua y no aguanta volar alto; la gaviota gasta al acelerar)
    energiaPaso(dt, p, b, av); audioPaso(dt, p);
    // avenida: tráfico, ruido y choques
    if (via.coches.length) {
      pasoTrafico(dt);
      sim.inmune = Math.max(0, sim.inmune - dt);
      if (sim.inmune <= 0 && !sim.perdido) {
        if (p.y < 12) for (const c of via.coches) if (c.act && Math.abs(c.x - p.x) < 14 && Math.abs(c.z - p.z) < 14) { // muy cerca del tráfico y bajo: te asustas y te pierdes
          const h = Math.hypot(c.x - p.x, c.z - p.z); if (h < 14 && (p.y < 4 ? h < 4.5 : h < 11)) { chocar(p.y < 4 ? '¡Un carro te golpeó!' : 'Te acercaste demasiado al tráfico y te asustaste.'); break; }
        }
        if (p.y < 2.8 && via.d < 14) chocar('Te hundiste hasta la avenida.');
        if (sim.energia <= 0 && sim.ex > 0.25) chocar('El ruido y el humo te agotaron.');
      }
      if (modo !== 'vr') ruidoEl.style.opacity = String(clamp(sim.ex * 1.5 + (sim.inmune > 3 ? 0.5 : 0), 0, 0.9));
    }
    // objetos de la misión: peces que saltan (garza), tallos de junco en el borde del agua (tingua) o enjambres de insectos en el aire (gaviota)
    const obj = AVE.objetivo, nom = AVE.item[0], noms = AVE.item[1], vh = vel;
    for (const f of peces) {
      if (!f.vivo) { f.espera -= dt; if (f.espera <= 0) ponerPez(f); continue; }
      if (obj === 'pesca') {
        f.sig -= dt;
        if (f.salto < 0 && f.sig <= 0) { f.salto = 0; av.anillo(f.x, f.z); }
        if (f.salto >= 0) {
          f.salto += dt / 0.95; const u = f.salto;
          if (u >= 1) { f.salto = -1; f.sig = 2 + Math.random() * 3; f.mesh.visible = false; av.anillo(f.x, f.z); }
          else { f.mesh.visible = true; f.mesh.position.set(f.x, 0.4 + 4.2 * 4 * u * (1 - u), f.z); f.mesh.rotation.x = (u - 0.5) * 2.2; f.mesh.rotation.y = f.x; }
        }
      } else if (obj === 'juncos') { f.mesh.position.y = 0.35 + 0.05 * Math.sin(sim.tiempo * 1.6 + f.x); f.mesh.rotation.z = 0.05 * Math.sin(sim.tiempo * 1.1 + f.z); }
      else { // enjambre: deriva, cambia de rumbo y sus puntos giran
        f.x += f.vx * dt; f.z += f.vz * dt; if (Math.random() < dt * 0.3) { const a = Math.random() * 6.28; f.vx = Math.cos(a) * 2.4; f.vz = Math.sin(a) * 2.4; }
        const cy = f.y + 1.5 * Math.sin(sim.tiempo * 0.8 + f.z * 0.1); f.mesh.position.set(f.x, cy, f.z); f.haz.position.set(f.x, cy + 20, f.z);
        const P = f.mesh.geometry.attributes.position, ph = f.mesh.userData.fase, T = sim.tiempo; for (let k = 0; k < ph.length; k++) { const a = T * ph[k][2] * 0.5 + ph[k][0], r = 1.6 + 1.1 * Math.sin(T * 0.9 + ph[k][1]); P.setXYZ(k, Math.cos(a) * r, Math.sin(T * 1.3 + ph[k][1]) * 1.2, Math.sin(a) * r); } P.needsUpdate = true;
      }
      const dh = Math.hypot(f.x - p.x, f.z - p.z), dy = obj === 'insectos' ? Math.abs(f.mesh.position.y - p.y) : (p.y - (obj === 'juncos' ? 0 : 0));
      const alcance = obj === 'insectos' ? (dh < 7 && dy < 7) : (dh < (obj === 'juncos' ? 6.5 : 7) && p.y < (obj === 'juncos' ? 4.5 : 7.5));
      if (alcance) {
        if (sim.llevando >= AVE.cap) { if (performance.now() - (sim.avisoLleno || 0) > 4000) { sim.avisoLleno = performance.now(); mensaje('Ya vas con la carga completa: ve al nido', 2000); } continue; }
        if (obj === 'pesca' && vh > 17.5 && f.salto >= 0) { if (performance.now() - (sim.avisoVel || 0) > 3500) { sim.avisoVel = performance.now(); mensaje('Muy rápido: las garzas pescan despacio. Frena (S) al acercarte', 2400); } continue; }
        if (obj === 'insectos' && vh < 13) { if (performance.now() - (sim.avisoVel || 0) > 3500) { sim.avisoVel = performance.now(); mensaje('Si vas lento los insectos se escapan: acelera para atravesar el enjambre', 2400); } continue; }
        f.vivo = false; f.espera = obj === 'insectos' ? 2 : 1.5; f.mesh.visible = false; f.haz.visible = false; if (obj !== 'insectos') av.anillo(f.x, f.z);
        sim.llevando++; sim.puntos += 25; sCaptura(); if (obj === 'insectos') sim.energia = Math.max(0, sim.energia - 6);
        mensaje(sim.llevando >= AVE.cap ? 'Carga completa: llévala al nido' : (obj === 'pesca' ? 'Pez atrapado' : obj === 'juncos' ? 'Tallo recogido' : 'Bocado de insectos') + ' (' + sim.llevando + '/' + AVE.cap + ')', 2200);
      }
    }
    // nido
    if (nido) {
      const dn = Math.hypot(nido.x - p.x, nido.y - p.y, nido.z - p.z); animarNido(dt, dn);
      if (dn < 13 && sim.llevando > 0) {
        const n = sim.llevando, pts = (obj === 'insectos' ? 120 : 100) * n; sim.llevando = 0; sim.entregados += n; sim.puntos += pts; sEntrega(); crecerNido(n);
        mensaje((obj === 'juncos' ? 'Agregaste ' + n + ' ' + (n > 1 ? noms : nom) + ' a tu nido' : 'Alimentaste a tus polluelos: ' + n + ' ' + (n > 1 ? noms : nom)) + ' · +' + pts + ' pts', 2800);
        if (sim.entregados % 3 === 0 || sim.entregados < 3) setTimeout(() => mensaje(DATOS[(sim.entregados + 1) % DATOS.length], 5500), 3000);
        if (sim.entregados >= AVE.meta && !sim.terminado) terminar();
      }
    }    // aros
    if (aroMesh) {
      aroMesh.rotation.z += dt * 0.6;
      if (p.distanceTo(aroMesh.position) < 12) { sim.aro++; sim.aros++; sim.puntos += 50; sAro(); mensaje('⭕ Aro +50', 1500); colocarAro(); }
    }
    // vuelo rasante: deja ondas sobre el agua
    if (p.y < 3.2 && b && av.dentro(p.x, p.z, b.pts)) { sim.tOnda = (sim.tOnda || 0) - dt; if (sim.tOnda <= 0) { sim.tOnda = 0.35; av.anillo(p.x, p.z); } }
    // fuera del territorio
    if (b && Math.hypot(p.x - b.cx, p.z - b.cz) > 2600) { rig.position.set(b.cx, 60, b.z0 - 80); mensaje('Regresaste al humedal El Burro', 2500); }
  }
  function nuevaRonda(msg) {
    Object.assign(sim, { puntos: 0, llevando: 0, entregados: 0, tiempo: 0, terminado: false, aros: 0, vidas: 3, energia: 100, perdido: false, inmune: 3, restante: 100 }); via.hora = 0;
    if (msg) mensaje(msg, 3500);
  }
  function fallar(motivo) { // se acabó la partida (sin vidas o sin tiempo): se muestra el resultado y empieza otra
    if (sim.perdido) return; sim.perdido = true; sim.puntos = Math.max(0, sim.puntos - 100);
    mensaje(motivo + ' Fin de la partida: ' + sim.entregados + '/' + AVE.meta + '. Reiniciando...', 6000);
    setTimeout(() => { if (activo) nuevaRonda('Nueva ronda: ' + AVE.metaTxt); }, 6500);
  }
  function energiaPaso(dt, p, b, av) {
    const sobreAgua = b && av.dentro(p.x, p.z, b.pts), descansa = AVE.reposo && p.y < 2.8 && sobreAgua;
    if (sim.ex >= 0.06) sim.energia -= 4 * sim.ex * dt; else sim.energia += (descansa ? AVE.reposo : AVE.reposo ? 0.8 : AVE.regen) * dt;
    if (acelera) sim.energia -= (AVE.gasto || 0) * dt;
    if (AVE.techo && p.y > AVE.techo) { sim.energia -= 9 * dt; if (performance.now() - (sim.avisoTecho || 0) > 4000) { sim.avisoTecho = performance.now(); mensaje('Las tinguas vuelan bajo: no subas tanto', 2200); } }
    sim.energia = clamp(sim.energia, 0, 100);
  }  function terminar() {
    sim.terminado = true; const t = sim.tiempo, bono = Math.max(0, Math.round((240 - t) * 2)); sim.puntos += bono;
    if (sim.puntos > sim.mejor) { sim.mejor = sim.puntos; try { localStorage.setItem('ren3d_pajaro_mejor', String(sim.puntos)); } catch (e) { /* sin almacenamiento */ } }
    mensaje('Misión cumplida: ' + sim.puntos + ' pts en ' + fmt(t) + '. Sigue volando; la ronda se reinicia sola.', 9000);
    sFin();
    setTimeout(() => { if (activo && sim.terminado) nuevaRonda('Nueva ronda: ' + AVE.metaTxt); }, 12000);
  }
  // ---------------------------------------------------------------- modo observar: el ave vuela sola (cámara en tercera persona)
  let avatar = null, fabricaAla = null, camVista = 0;
  const bot = { estado: '', tAle: 0 };
  const VISTAS = [[0, 2.2, 6.4], [0, 1.0, 3.6], [6.0, 1.4, 0.4], [0, 5.0, 10]];
  function ponerCamara() {
    const e = new THREE.Vector3(...VISTAS[camVista % VISTAS.length]), m4 = new THREE.Matrix4().lookAt(e, new THREE.Vector3(0, 0.1, -1.2), new THREE.Vector3(0, 1, 0));
    T3.camera.position.copy(e); T3.camera.quaternion.setFromRotationMatrix(m4);
  }
  function crearAvatar() { // el ave completa, vista desde fuera: cuerpo, cuello, cabeza, pico, patas y alas de plumas
    const g = new THREE.Group(), L = (c) => new THREE.MeshLambertMaterial({ color: c, emissive: 0x161616 });
    const mc = L(AVE.cuerpo), mh = L(AVE.cabeza), mp = new THREE.MeshLambertMaterial({ color: AVE.pico, emissive: 0x201004 }), mpa = L(AVE.id === 'tingua' ? 0xb7c04a : AVE.id === 'gaviota' ? 0xb3342c : 0x2b2b2b);
    const garza = AVE.id === 'garza', tingua = AVE.id === 'tingua';
    const cu = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 10), mc); cu.scale.set(0.8, 0.72, garza ? 2.6 : tingua ? 1.9 : 2.2); g.add(cu);
    const pts = garza ? [[0, 0.04, -0.4], [0, 0.2, -0.56], [0, 0.1, -0.74], [0, 0.2, -0.92]] : [[0, 0.04, -0.3], [0, 0.13, -0.4], [0, 0.14, -0.48]];
    const cuello = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))), 10, garza ? 0.045 : 0.07, 7), mc); g.add(cuello);
    const fin = pts[pts.length - 1], cab = new THREE.Mesh(new THREE.SphereGeometry(garza ? 0.06 : 0.085, 10, 8), mh); cab.position.set(...fin); cab.scale.z = 1.25; g.add(cab);
    const pico = new THREE.Mesh(new THREE.ConeGeometry(garza ? 0.035 : 0.04, garza ? 0.32 : 0.15, 6), mp); pico.rotation.x = -Math.PI / 2; pico.position.set(fin[0], fin[1] - 0.005, fin[2] - (garza ? 0.2 : 0.12)); g.add(pico);
    if (tingua) { const esc = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), L(0xd63a2f)); esc.position.set(fin[0], fin[1] + 0.04, fin[2] - 0.08); esc.scale.set(1, 0.8, 1.3); g.add(esc); }
    const cg = new THREE.BufferGeometry(), cl = garza ? 0.32 : 0.36, cw = garza ? 0.08 : 0.12; cg.setAttribute('position', new THREE.Float32BufferAttribute([-cw * 0.6, 0, cl, cw * 0.6, 0, cl, cw, 0, cl * 0.85, -cw, 0, cl * 0.85, 0, 0, 0.04], 3)); cg.setIndex([4, 3, 0, 4, 0, 1, 4, 1, 2]); cg.computeVertexNormals();
    const cola = new THREE.Mesh(cg, new THREE.MeshLambertMaterial({ color: AVE.id === 'gaviota' ? 0xf1f2f4 : AVE.cuerpo, side: THREE.DoubleSide, emissive: 0x161616 })); cola.position.set(0, 0.0, garza ? 0.5 : 0.42); g.add(cola);    for (const s of [-1, 1]) { // patas: la garza las estira hacia atrás al volar; la tingua las deja colgar con dedos largos; la gaviota las recoge
      const largo = garza ? 0.75 : tingua ? 0.3 : 0.18, pt = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.01, largo, 5), mpa);
      if (garza) { pt.rotation.x = Math.PI / 2; pt.position.set(s * 0.04, -0.03, 0.5 + largo / 2); } else { pt.position.set(s * 0.07, -0.16, 0.18); pt.rotation.x = 0.25; }
      g.add(pt);
    }
    g.userData = { cuello, cab }; g.scale.setScalar(1.45); // un poco más grande de lo real para que se aprecie desde la cámara
    const wI = fabricaAla(-1), wD = fabricaAla(1); for (const [w, s] of [[wI, -1], [wD, 1]]) { w.scale.setScalar(AVE.escala * 1.6); w.position.set(s * 0.12, 0.13, -0.12); g.add(w); }
    alaI = wI; alaD = wD; return g;
  }
  const segCruza = (ax, az, bx, bz) => via.seg.some(s => { // ¿el trayecto A→B atraviesa la avenida?
    const d1x = bx - ax, d1z = bz - az, d2x = s[2] - s[0], d2z = s[3] - s[1], den = d1x * d2z - d1z * d2x; if (Math.abs(den) < 1e-9) return false;
    const t = ((s[0] - ax) * d2z - (s[1] - az) * d2x) / den, u = ((s[0] - ax) * d1z - (s[1] - az) * d1x) / den; return t > 0 && t < 1 && u > 0 && u < 1;
  });
  function cerebro(dt) { // piloto automático: busca el objetivo, esquiva el tráfico cruzando en alto y llega con la altura y la velocidad que pide cada ave
    const p = rig.position; bot.tAle = Math.max(0, bot.tAle - dt);
    const lleno = sim.llevando >= AVE.cap; let cand = null, bd = 1e12;
    for (const f of peces) { if (!f.vivo) continue; const d = (f.x - p.x) ** 2 + (f.z - p.z) ** 2 + (via.seg.length && segCruza(p.x, p.z, f.x, f.z) ? 250000 : 0) + (via.seg.length && distVia(f.x, f.z) < 45 ? 4e6 : 0); if (d < bd) { bd = d; cand = f; } }
    let T = null, tipo = 'item';
    if (nido && (lleno || (sim.llevando > 0 && (!cand || bd > 90000)))) { T = { x: nido.x, y: nido.y, z: nido.z }; tipo = 'nido'; }
    else if (cand) T = { x: cand.x, y: cand.mesh.position.y, z: cand.z };
    else if (nido) { T = { x: nido.x, y: nido.y, z: nido.z }; tipo = 'nido'; }
    if (!T) return;
    const dxz = Math.hypot(T.x - p.x, T.z - p.z), cruce = via.seg.length && segCruza(p.x, p.z, T.x, T.z), id = AVE.id, cerca = dxz < 55;
    let alt = id === 'tingua' ? 7 : 33;
    if (cerca) alt = tipo === 'nido' ? T.y + 3 : id === 'pesca' || id === 'garza' ? 3.2 : id === 'tingua' ? 2.2 : T.y;
    const baja = cerca && !cruce && (!via.seg.length || distVia(T.x, T.z) > 45); // el ave sólo baja a su objetivo si éste no está pegado al tráfico
    if ((cruce || via.d < 110) && !baja) alt = Math.max(alt, id === 'tingua' ? 20 : 85); // sobre la avenida se vuela por encima de la turbulencia
    const cansada = id === 'tingua' && sim.energia < 22 && !cruce; if (cansada) alt = 2.2; // la tingua baja al agua a descansar
    const rate = AVE.giro * 1.25, yd = giro(yaw, Math.atan2(p.x - T.x, p.z - T.z)); yaw += clamp(yd, -rate * dt, rate * dt);
    const pitD = cerca && !cruce ? clamp(Math.atan2(alt - p.y, Math.max(dxz, 9)), -0.6, 0.5) : clamp((alt - p.y) * 0.03, -0.5, 0.4); pit += (pitD - pit) * Math.min(1, dt * 3);
    acelera = !cansada && dxz > 140 && (!AVE.gasto || sim.energia > 40); frena = cerca && AVE.id !== 'gaviota' && vel > AVE.vel.min + 3;
    if (p.y < alt - 4 && (sim.ex > 0.04 || caida < -1) && sim.energia > 20 && bot.tAle <= 0) { aleteo(); bot.tAle = 0.7; }
    bot.estado = cansada ? 'Descansando sobre el agua para recuperar energía' : cruce || via.d < 110 && !cerca ? 'Cruzando la avenida por encima del tráfico' : tipo === 'nido' ? 'Llevando la carga al nido' : AVE.objetivo === 'pesca' ? 'Acechando un pez: baja y frena' : AVE.objetivo === 'juncos' ? 'Buscando tallos de junco en el borde del agua' : 'Persiguiendo un enjambre de insectos';
  }
  // ---------------------------------------------------------------- entradas
  const camaraDir = (v) => { rig.updateMatrixWorld(true); T3.camera.getWorldDirection(v); return v; };
  let ori = null, oriYawBase = null, tieneOri = false;
  const qOri = new THREE.Quaternion(), qA = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)), qB = new THREE.Quaternion(), eu = new THREE.Euler(), zee = new THREE.Vector3(0, 0, 1);
  const onOri = (e) => { if (e.alpha == null) return; ori = e; tieneOri = true; };
  async function pedirOrientacion() {
    try { if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission) { const r = await DeviceOrientationEvent.requestPermission(); if (r !== 'granted') return false; } } catch (e) { return false; }
    window.addEventListener('deviceorientation', onOri, true); return true;
  }
  const onKey = (e) => {
    if (!activo) return; teclas[e.code] = e.type === 'keydown';
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    if (e.type === 'keydown' && e.code === 'Space' && !e.repeat) aleteo();
    if (e.type === 'keydown' && e.code === 'KeyV' && modo === 'observar') { camVista++; ponerCamara(); }
    if (e.type === 'keydown' && e.code === 'Escape' && !document.pointerLockElement) salir();
  };
  const onMouse = (e) => {
    if (!activo || modo === 'vr' || modo === 'observar' || (modo === 'cardboard' && tieneOri)) return;
    if (document.pointerLockElement || e.buttons) { yaw -= e.movementX * 0.0024; pit = clamp(pit - e.movementY * 0.0024, -1.25, 1.25); }
  };
  let tToque = 0;
  const onTouchStart = () => { if (activo && (modo === 'cardboard')) { acelera = true; tToque = performance.now(); } };
  const onTouchEnd = () => { acelera = false; if (activo && modo === 'cardboard' && performance.now() - tToque < 220) aleteo(); }; // toque corto = aletear
  const onClickCanvas = () => { if (activo && modo === 'pantalla' && !MOVIL && !document.pointerLockElement) { try { T3.renderer.domElement.requestPointerLock(); } catch (e) { /* sin bloqueo */ } } };
  let cdGiro = 0, ctrlY = [null, null], cdAleteo = 0, xrAcelera = 0, xrFrena = 0, tSalir = 0;
  function leerXR(dt) {
    const s = T3.renderer.xr.getSession && T3.renderer.xr.getSession(); if (!s) return;
    cdGiro -= dt; cdAleteo -= dt; let ac = xrAcelera > 0, fr = xrFrena > 0, sal = false;
    for (const src of s.inputSources) {
      const gp = src.gamepad; if (!gp) continue;
      const x = gp.axes[2] || 0, y = gp.axes[3] || 0;
      if (Math.abs(x) > 0.7 && cdGiro <= 0) { yaw -= Math.sign(x) * Math.PI / 6; cdGiro = 0.3; tSnap = 0.3; }
      if (y < -0.6) ac = true; if (y > 0.6) fr = true;
      if (gp.buttons[0] && gp.buttons[0].pressed) ac = true;
      if (gp.buttons[1] && gp.buttons[1].pressed) fr = true;
      for (const k of [3, 4, 5]) if (gp.buttons[k] && gp.buttons[k].pressed) sal = true; // joystick (click), A/X o B/Y: cualquiera, mantenido un segundo, sale del juego
    }
    if (sal) { tSalir += dt; if (tSalir > 0.35 && tSalir - dt <= 0.35) mensaje('Sigue pulsando para volver a elegir ave...', 1200); if (tSalir > 0.8) { tSalir = 0; try { if (sesionXR) sesionXR.end(); } catch (e) { /* se sale igual */ } setTimeout(() => { if (activo) salir(); }, 500); return; } } else tSalir = 0;
    // aletear: bajar rápido las manos da impulso
    for (let i = 0; i < 2; i++) {
      const c = T3.renderer.xr.getController(i); if (!c) continue;
      const y = c.position.y; if (ctrlY[i] != null && dt > 0) { const vy = (y - ctrlY[i]) / dt; if (vy < -1.6 && cdAleteo <= 0) { aleteo(); cdAleteo = 0.4; } }
      ctrlY[i] = y;
    }
    acelera = ac; frena = fr;
  }

  // ---------------------------------------------------------------- minimapa en planta
  // Al empezar se toma UNA foto del mundo 3D real visto desde arriba (cámara ortográfica, sin niebla ni objetos del juego). Durante el vuelo sólo se
  // recorta y gira esa foto alrededor del ave (cuesta casi nada) y se dibujan encima el ave, su campo de visión, los objetivos y el nido.
  const mapaCv = document.createElement('canvas'); mapaCv.id = 'pjMapa'; document.body.appendChild(mapaCv);
  let mapa = null, tMapa = 0;
  function capturarMapa() {
    mapa = null; mapaCv.classList.remove('on');
    const av = ctx.aves(), b = av && av.burro; if (!b || !T3) return;
    let x0 = b.x0, x1 = b.x1, z0 = b.z0, z1 = b.z1; if (nido) { x0 = Math.min(x0, nido.x); x1 = Math.max(x1, nido.x); z0 = Math.min(z0, nido.z); z1 = Math.max(z1, nido.z); }
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, span = clamp(Math.max(x1 - x0, z1 - z0) + 700, 1000, 2600), N = MOVIL ? 1024 : 2048;
    const r = T3.renderer, sc = T3.scene, pr = r.getPixelRatio(), sz = r.getSize(new THREE.Vector2()), fog = sc.fog, ocultos = [];
    const ocultar = (o) => { if (o && o.visible) { o.visible = false; ocultos.push(o); } };
    try {
      ocultar(rig); ocultar(av.grp); ocultar(nido && nido.g); ocultar(aroMesh); for (const f of peces) { ocultar(f.mesh); ocultar(f.haz); }
      if (T3.trees) { const u = T3.trees.umbral, m = T3.trees.minMs; T3.trees.umbral = 0; T3.trees.minMs = 0; T3.trees.update({ position: new THREE.Vector3(cx, 200, cz) }); T3.trees.umbral = u; T3.trees.minMs = m; }
      sc.fog = null;
      const cm = new THREE.OrthographicCamera(-span / 2, span / 2, span / 2, -span / 2, 10, 7000); cm.up.set(0, 0, -1); cm.position.set(cx, 3000, cz); cm.lookAt(cx, 0, cz); cm.updateMatrixWorld(true);
      r.setPixelRatio(1); r.setSize(N, N, false); r.setScissorTest(false); r.setViewport(0, 0, N, N);
      r.render(sc, cm);
      const img = document.createElement('canvas'); img.width = img.height = N; img.getContext('2d').drawImage(r.domElement, 0, 0);
      mapa = { img, N, cx, cz, span };
    } catch (e) { console.warn('minimapa:', e); mapa = null; }
    finally { sc.fog = fog; ocultos.forEach(o => { o.visible = true; }); r.setPixelRatio(pr); r.setSize(sz.x, sz.y, false); r.setViewport(0, 0, sz.x, sz.y); }
    if (mapa) mapaCv.classList.add('on');
  }
  function pintarMapa() {
    if (!mapa || !activo || modo === 'vr' || modo === 'cardboard') return;
    const css = mapaCv.clientWidth; if (!css) return;
    const dpr = Math.min(devicePixelRatio || 1, 2), S = Math.round(css * dpr); if (mapaCv.width !== S) { mapaCv.width = S; mapaCv.height = S; }
    const g = mapaCv.getContext('2d'), p = rig.position, VISTA = 420, pxm = mapa.N / mapa.span, k = (S / VISTA) / pxm, M = mapa.N / 2;
    const px = (p.x - mapa.cx) * pxm + M, py = (p.z - mapa.cz) * pxm + M, phi = -Math.PI / 2 - Math.atan2(dir.z, dir.x), cs = Math.cos(phi), sn = Math.sin(phi), R = S / 2;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, S, S); g.save(); g.beginPath(); g.arc(R, R, R, 0, Math.PI * 2); g.clip();
    g.fillStyle = '#0b1622'; g.fillRect(0, 0, S, S);
    g.translate(R, R); g.rotate(phi); g.scale(k, k); g.translate(-px, -py); g.imageSmoothingQuality = 'high'; g.drawImage(mapa.img, 0, 0);
    g.setTransform(1, 0, 0, 1, 0, 0);
    const pos = (x, z) => { // posición en el lienzo; si queda fuera del círculo se pega al borde
      const dx = ((x - p.x) * cs - (z - p.z) * sn) * (S / VISTA), dy = ((x - p.x) * sn + (z - p.z) * cs) * (S / VISTA), d = Math.hypot(dx, dy), lim = R - 8 * dpr;
      return d > lim ? { x: R + dx / d * lim, y: R + dy / d * lim, f: true } : { x: R + dx, y: R + dy, f: false };
    };
    // campo de visión
    g.fillStyle = 'rgba(255,255,255,.16)'; g.beginPath(); g.moveTo(R, R); g.arc(R, R, R * 0.8, -Math.PI / 2 - 0.62, -Math.PI / 2 + 0.62); g.closePath(); g.fill();
    const punto = (q, rad, col, fuera) => { g.beginPath(); g.arc(q.x, q.y, rad * (q.f ? 0.75 : 1), 0, Math.PI * 2); g.fillStyle = col; g.fill(); g.lineWidth = 1.5 * dpr; g.strokeStyle = 'rgba(5,12,20,.85)'; g.stroke(); };
    for (const f of peces) if (f.vivo) punto(pos(f.x, f.z), 3.2 * dpr, AVE.color);
    if (nido) { const q = pos(nido.x, nido.z); g.save(); g.translate(q.x, q.y); g.rotate(Math.PI / 4); const a = 4.6 * dpr * (q.f ? 0.75 : 1); g.fillStyle = '#fbbf24'; g.fillRect(-a, -a, 2 * a, 2 * a); g.lineWidth = 1.5 * dpr; g.strokeStyle = 'rgba(5,12,20,.9)'; g.strokeRect(-a, -a, 2 * a, 2 * a); g.restore(); }
    if (aroMesh) { const q = pos(aroMesh.position.x, aroMesh.position.z); g.beginPath(); g.arc(q.x, q.y, 5 * dpr, 0, Math.PI * 2); g.lineWidth = 2 * dpr; g.strokeStyle = '#5eead4'; g.stroke(); }
    const o = objetivo(); if (o) { const q = pos(o.x, o.z), pu = 1 + 0.25 * Math.sin(performance.now() / 260); g.beginPath(); g.arc(q.x, q.y, 8 * dpr * pu, 0, Math.PI * 2); g.lineWidth = 1.8 * dpr; g.strokeStyle = 'rgba(255,255,255,.9)'; g.stroke(); }
    // ave: triángulo siempre hacia arriba (el mapa gira con ella)
    g.save(); g.translate(R, R); g.beginPath(); g.moveTo(0, -8 * dpr); g.lineTo(6 * dpr, 7 * dpr); g.lineTo(0, 4 * dpr); g.lineTo(-6 * dpr, 7 * dpr); g.closePath(); g.fillStyle = '#ffffff'; g.fill(); g.lineWidth = 1.6 * dpr; g.strokeStyle = AVE.color; g.stroke(); g.restore();
    g.restore();
    g.lineWidth = 2 * dpr; g.strokeStyle = 'rgba(8,16,26,.55)'; g.beginPath(); g.arc(R, R, R - dpr, 0, Math.PI * 2); g.stroke();
    // norte
    const nx = R + sn * (R - 11 * dpr), ny = R - cs * (R - 11 * dpr); g.beginPath(); g.arc(nx, ny, 7.5 * dpr, 0, Math.PI * 2); g.fillStyle = 'rgba(8,16,26,.85)'; g.fill();
    g.fillStyle = '#f8fafc'; g.font = '700 ' + Math.round(9.5 * dpr) + 'px "Segoe UI",system-ui,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('N', nx, ny + dpr * 0.4);
  }

  // gafas / celular: los edificios (en bloques de ~350 m) lejanos al ave se ocultan; a menor calidad, más cerca. Así la ciudad se ve y el vuelo sigue fluido
  let tEdif = 0;
  function ocultarLejanos() {
    const E = T3 && T3.edificios; if (!E || !E.length) return;
    const p = rig.position, lim = (modo === 'vr' || modo === 'cardboard' || MOVIL) ? (calidad >= 3 ? 420 : calidad === 2 ? 650 : calidad === 1 ? 850 : 1100) : 1e9;
    for (const e of E) { const v = Math.hypot(e.cx - p.x, e.cz - p.z) - e.r < lim; if (e.mesh.visible !== v) e.mesh.visible = v; }
  }
  // ---------------------------------------------------------------- bucle
  function bucle() { try { paso(); } catch (e) { if (!bucle.avisado) { bucle.avisado = true; console.warn('modo pájaro:', e); } } }
  function paso(dtFijo) { // dtFijo: sólo para pruebas automáticas (avanza la simulación sin esperar cuadros)
    const now = performance.now() / 1000, dt = dtFijo || clamp(now - (ultimo || now), 0.001, 0.05); ultimo = now;
    const cam = T3.camera;
    sim.ex = via.seg.length ? exposicion(rig.position) : 0; sacudida += dt * 11; if (modo === 'vr' || modo === 'cardboard') confortPaso(dt);
    if ((modo === 'vr' || modo === 'cardboard' || MOVIL) && !dtFijo) { // si las gafas/celular no sostienen ~60 cuadros por segundo, se baja el detalle poco a poco para que se vea fluido
      if (tPrev) { tAcum += now - tPrev; nAcum++; } tPrev = now;
      if (nAcum >= 90) { const ms = tAcum / nAcum * 1000; tAcum = 0; nAcum = 0;
        if (ms > 17.5 && calidad < 3) { calidad++; if (calidad === 1) { T3.sun.castShadow = false; via.tope = 0.8; } else if (calidad === 2) { via.tope = 0.65; if (T3.trees) T3.trees.minMs = 2500; try { if (modo === 'vr') T3.renderer.xr.setFoveation(0.75); } catch (e) { /* ok */ } } else { via.tope = 0.5; try { const A = ctx.aves(); if (A && A.grp) A.grp.visible = false; } catch (e) { /* ok */ } } }
      }
    }
    if (modo === 'vr') { leerXR(dt); rig.rotation.set(0, yaw, 0); }
    else if (modo === 'cardboard' && tieneOri && ori) {
      const a = (ori.alpha || 0) * Math.PI / 180, bt = (ori.beta || 0) * Math.PI / 180, gm = (ori.gamma || 0) * Math.PI / 180, o = ((screen.orientation && screen.orientation.angle) || window.orientation || 0) * Math.PI / 180;
      eu.set(bt, a, -gm, 'YXZ'); qOri.setFromEuler(eu); qOri.multiply(qA); qOri.multiply(qB.setFromAxisAngle(zee, -o));
      if (oriYawBase == null) { eu.setFromQuaternion(qOri, 'YXZ'); oriYawBase = eu.y; }
      cam.quaternion.copy(qOri); rig.rotation.set(0, yaw - oriYawBase, 0);
      acelera = acelera || !!teclas.KeyW;
    } else { // pantalla (o cardboard sin giroscopio: se mira con el mouse)
      if (modo === 'observar') cerebro(dt); else {
      if (teclas.KeyA || teclas.ArrowLeft) yaw += AVE.giro * dt; if (teclas.KeyD || teclas.ArrowRight) yaw -= AVE.giro * dt;
      if (teclas.ArrowUp) pit = clamp(pit + 0.9 * dt, -1.25, 1.25); if (teclas.ArrowDown) pit = clamp(pit - 0.9 * dt, -1.25, 1.25);
      acelera = !!(teclas.KeyW || teclas.ShiftLeft || teclas.ShiftRight) || (modo === 'cardboard' && acelera); frena = !!teclas.KeyS; }
      if (tactil && modo !== 'observar') { yaw -= tc.x * AVE.giro * 1.15 * dt; pit = clamp(pit - tc.y * 0.95 * dt, -1.2, 1.2); if (Math.abs(tc.y) < 0.18) pit += (-0.04 - pit) * Math.min(1, dt * 0.7); acelera = acelera || tc.acel; frena = frena || tc.frena; } // palanca: izquierda/derecha gira, arriba/abajo sube/baja; sin tocarla el ave se nivela
      rig.rotation.set(pit + Math.sin(sacudida * 1.3) * 0.012 * sim.ex, yaw + Math.sin(sacudida * 0.9) * 0.01 * sim.ex, Math.sin(sacudida) * 0.03 * sim.ex); // el aire revuelto sacude la vista
    }
    if (modo === 'observar') dir.set(-Math.sin(yaw) * Math.cos(pit), Math.sin(pit), -Math.cos(yaw) * Math.cos(pit)); else camaraDir(dir);
    // velocidad: planeo suave; la picada acelera, subir frena; aletear da impulsos
    let obj = AVE.vel.cru; if (acelera) obj = AVE.vel.max; if (frena) obj = AVE.vel.min + 1;
    obj *= 1 + clamp(-dir.y * 0.6, -0.35, 0.5); impulso *= Math.exp(-1.6 * dt); obj += impulso;
    obj *= (1 - 0.4 * sim.ex) * (1 - 0.04 * sim.llevando); // con tráfico pesado el aire te frena; los peces pesan
    vel += (obj - vel) * Math.min(1, dt * 1.5); vel = Math.max(AVE.vel.min, vel);
    rig.position.addScaledVector(dir, vel * dt);
    // turbulencia sobre la avenida: te hunde (más con peces y sin energía); aletear (lift) te sube
    const hundir = AVE.hundir * sim.ex * (7 + 1.3 * sim.llevando) * (sim.energia < 5 ? 1.6 : 1) + (sim.energia <= 0 ? 2.5 : 0); // sin energía caes despacio (la tingua aterriza en el agua y descansa)
    caida += (-hundir - caida) * Math.min(1, dt * 2.5); lift *= Math.exp(-1.5 * dt);
    rig.position.y += (caida + lift + (modo === 'vr' || modo === 'cardboard' ? 0 : sim.ex * (Math.sin(sacudida) * 0.9 + Math.sin(sacudida * 2.7) * 0.6))) * dt;
    if (rig.position.y < 1.8) rig.position.y = 1.8; if (rig.position.y > 600) rig.position.y = 600;
    // alas
    tAleteo = Math.max(0, tAleteo - dt);
    const fq = 1.2 + (acelera ? 2.2 : 0) + (impulso > 1 ? 2 : 0) + (tAleteo > 0 ? 2 : 0), amp = (dir.y < -0.35 ? 0.12 : 0.5) * (frena ? 0.4 : 1);
    const ang = 0.18 + Math.sin(now * fq * Math.PI * 2) * amp;
    if (alaI) {
      alaI.rotation.z = -ang; alaD.rotation.z = ang;
      const ph = now * fq * Math.PI * 2, mun = Math.sin(ph - 1.0) * amp * 0.75 - 0.05, abre = 0.14 * (1 - Math.min(1, Math.abs(amp) * 1.3)) + 0.06 * Math.max(0, Math.cos(ph)); // la muñeca va un poco atrasada y las puntas se abren al planear
      for (const a of [alaI, alaD]) { a.userData.muneca.rotation.z = mun; a.userData.prim.forEach((p, k) => { p.rotation.y = -(0.02 + k / 9 * 0.95) - (k - 4.5) * abre * 0.2; }); }
    }
    juego(dt);
    T3.vpos = rig.position;
    ctx.sim(dt, rig.position);
    tHud -= dt; if (tHud <= 0) { tHud = 0.2; pintarHud(); }
    tMapa -= dt; if (tMapa <= 0) { tMapa = 1 / 30; pintarMapa(); }
    tEdif -= dt; if (tEdif <= 0) { tEdif = 0.6; ocultarLejanos(); }
    if (modo === 'cardboard' && efecto) efecto.render(T3.scene, cam); else T3.renderer.render(T3.scene, cam);
    if (modo === 'vr' && espejo) renderEspejo();
  }

  // ---------------------------------------------------------------- espejo: lo que ves en las gafas también se dibuja en la pantalla del computador
  let espejo = false, camEsp = null, nEsp = 0; // en las Quest solas no hay pantalla de PC: se apaga para ganar velocidad
  function renderEspejo() {
    if ((nEsp++ & 1) || !T3) return; // se refresca cada 2 cuadros
    const r = T3.renderer, cam = T3.camera, w = r.domElement.width, h = r.domElement.height;
    try {
      if (!camEsp) camEsp = new THREE.PerspectiveCamera(75, 1, 0.5, 30000);
      cam.matrixWorld.decompose(camEsp.position, camEsp.quaternion, tmp2.set(1, 1, 1));
      camEsp.aspect = w / h; camEsp.updateProjectionMatrix(); camEsp.updateMatrixWorld(true);
      const xrOn = r.xr.enabled; r.xr.enabled = false;
      const rt = r.getRenderTarget(); r.setRenderTarget(null); r.setScissorTest(false); r.setViewport(0, 0, w / r.getPixelRatio(), h / r.getPixelRatio());
      r.render(T3.scene, camEsp);
      r.xr.enabled = xrOn; r.setRenderTarget(rt);
    } catch (e) { espejo = false; console.warn('espejo en pantalla:', e); try { r.xr.enabled = true; } catch (e2) { /* ok */ } }
  }

  // ---------------------------------------------------------------- entrar / salir
  async function comenzar(m) {
    T3 = ctx.T3(); modo = m; espejo = pjEsp.checked;
    const r = T3.renderer, cam = T3.camera;
    Object.assign(guardado, { pos: cam.position.clone(), tgt: T3.orbit.target.clone(), near: cam.near, far: cam.far, sombra: T3.sun.castShadow, pr: r.getPixelRatio(), quat: cam.quaternion.clone() });
    try {
      T3.orbit.enabled = false; cam.near = 0.5; cam.far = m === 'vr' ? 9000 : 30000; cam.updateProjectionMatrix();
      if (T3.fleet && T3.fleet.setNear) T3.fleet.setNear(m === 'vr' && ESQUEST || MOVIL || m === 'cardboard' ? 45 : 130); // gafas: el carro detallado sólo muy cerca (más lejos va el modelo simple)
      if (m === 'cardboard' || MOVIL || (m === 'vr' && ESQUEST)) T3.sun.castShadow = false; // celular y Quest solas: sin sombras para ir fluido (las sombras en baja resolución se veían como cuadros)
      if (m !== 'pantalla' || MOVIL) { if (T3.trees) { T3.trees.umbral = 40; T3.trees.minMs = 800; } if (T3.plants) T3.plants.minMs = 800; } // recorrer todos los árboles cada pocos metros daba tirones
      T3.mundoTick = null; T3.scene.add(rig); rig.add(cam); cam.position.set(0, 0, 0); cam.quaternion.identity();
      camVista = 0;
      crearAlas(); if (!hudPlano) crearHudPlano(); // las alas se rehacen en cada partida: cambian con el ave elegida
      if (m === 'observar') { avatar = crearAvatar(); rig.add(avatar); ponerCamara(); } else { cam.add(alaI, alaD, picoM, hudPlano); hudPlano.visible = m === 'vr' || m === 'cardboard'; if (hudPlano.visible) { if (!vinM) crearConfort(); fadeM.visible = true; fadeM.material.opacity = 1; tFade = 1.3; vinM.visible = false; cam.add(vinM, fadeM); } } // el HUD dentro de la escena es para gafas y Cardboard
      preparar();
      if (m === 'pantalla' || m === 'observar') capturarMapa();
      try { r.compile(T3.scene, cam); } catch (e) { /* ok */ } // se compilan los materiales antes de entrar: evita tirones cuando aparecen carros, nido y polluelos
    } catch (e) { console.warn('pájaro:', e); estado(String(e.message || e)); abortar(); menu.style.display = 'flex'; return; }
    if (m === 'vr') {
      try {
        if (!navigator.xr) throw new Error('Este navegador no tiene WebXR');
        r.xr.setReferenceSpaceType('local'); r.xr.enabled = true;
        try { r.xr.setFramebufferScaleFactor(ESQUEST ? 1.0 : 1.3); } catch (e) { /* ok */ } // más resolución = menos borroso
        sesionXR = await navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor', 'bounded-floor'] });
        await r.xr.setSession(sesionXR); try { r.xr.setFoveation(ESQUEST ? 0.5 : 0); } catch (e) { /* ok */ }
        try { if (sesionXR.supportedFrameRates && sesionXR.supportedFrameRates.includes(ESQUEST ? 72 : 90)) await sesionXR.updateTargetFrameRate(ESQUEST ? 72 : 90); } catch (e) { /* ok */ }
        sesionXR.addEventListener('end', () => { if (activo) salir(); });
        for (let i = 0; i < 2; i++) { // manos: esferas luminosas y gatillo/grip
          const c = r.xr.getController(i); rig.add(c);
          c.add(new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 10), new THREE.MeshBasicMaterial({ color: i ? 0xfde047 : 0x5eead4 })));
          c.addEventListener('selectstart', () => { xrAcelera++; }); c.addEventListener('selectend', () => { xrAcelera = Math.max(0, xrAcelera - 1); });
          c.addEventListener('squeezestart', () => { xrFrena++; }); c.addEventListener('squeezeend', () => { xrFrena = Math.max(0, xrFrena - 1); });
        }
        document.body.classList.add('pjvr'); r.setPixelRatio(1);
      } catch (e) {
        console.warn('WebXR:', e); abortar(); menu.style.display = 'flex'; estado('No se pudo entrar en VR: ' + (e && e.message || e) + '. Revisa que las gafas estén conectadas y que la página esté en https.'); return;
      }
    } else if (m === 'cardboard') {
      r.setPixelRatio(1); efecto = new StereoEffect(r); efecto.setSize(innerWidth, innerHeight); oriYawBase = null;
      try { if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen(); } catch (e) { /* ok */ }
      try { if (screen.orientation && screen.orientation.lock) await screen.orientation.lock('landscape'); } catch (e) { /* ok */ }
      try { if (navigator.wakeLock) wakeLock = await navigator.wakeLock.request('screen'); } catch (e) { /* ok */ }
      const ok = await pedirOrientacion(); if (!ok) ctx.say('Sin giroscopio: mira con el mouse/dedo', 4000);
      cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix();
    }
    tactil = MOVIL && (m === 'pantalla' || m === 'observar'); tc.x = tc.y = 0; tc.acel = tc.frena = false; document.getElementById('pjKnob').style.transform = 'translate(0,0)';
    if (MOVIL) { try { const p = document.documentElement.requestFullscreen && document.documentElement.requestFullscreen(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* ok */ } try { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {}); } catch (e) { /* ok */ } }
    document.body.classList.toggle('pjtouch', tactil); document.body.classList.toggle('pjobs', m === 'observar');
    activo = true; document.body.classList.add('pj');
    document.body.classList.toggle('pjcb', m === 'cardboard'); hud.classList.toggle('on', m !== 'cardboard'); btnSalir.classList.toggle('on', true);
    ultimo = 0; iniciarAudio();
    r.setAnimationLoop(bucle);
    mensaje(AVE.nombre + ': ' + AVE.metaTxt, 4500); setTimeout(() => { if (activo) mensaje(m === 'vr' ? 'Para salir: mantén A, B, X, Y o el joystick (o el botón Meta)' : m === 'observar' ? (tactil ? 'Botón Cámara: cambia la vista' : 'Tecla V: cambia la cámara') : tactil ? 'Palanca: dirigir. Botones: acelerar, frenar y aletear' : 'W acelerar · S frenar · A y D girar · Espacio aletear', 4500); }, 4800);
  }
  function abortar() { activo = false; restaurar(); }
  function restaurar() {
    const r = T3 && T3.renderer; if (!r) return;
    try { r.setAnimationLoop(null); } catch (e) { /* ok */ }
    try { if (sesionXR) { const s = sesionXR; sesionXR = null; s.end().catch(() => {}); } } catch (e) { /* ok */ }
    try { for (let i = 0; i < 2; i++) { const c = r.xr.getController(i); rig.remove(c); } r.xr.enabled = false; } catch (e) { /* ok */ }
    const cam = T3.camera;
    try { cam.remove(alaI, alaD, picoM, hudPlano); if (vinM) cam.remove(vinM, fadeM); if (avatar) { rig.remove(avatar); avatar = null; } rig.remove(cam); T3.scene.remove(rig); } catch (e) { /* ok */ }
    try { if (T3.edificios) for (const e of T3.edificios) e.mesh.visible = true; if (T3.fleet && T3.fleet.setNear) T3.fleet.setNear(130); } catch (e) { /* ok */ }
    limpiarJuego(); T3.vpos = null; mapa = null; mundoVivo(); mapaCv.classList.remove('on');
    cam.position.copy(guardado.pos); cam.quaternion.copy(guardado.quat); cam.near = guardado.near; cam.far = guardado.far; cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix();
    T3.orbit.target.copy(guardado.tgt); T3.orbit.enabled = true; T3.orbit.update();
    T3.sun.castShadow = guardado.sombra; r.setPixelRatio(guardado.pr); r.setSize(innerWidth, innerHeight); r.setScissorTest(false); r.setViewport(0, 0, innerWidth, innerHeight);
    efecto = null; window.removeEventListener('deviceorientation', onOri, true); ori = null; tieneOri = false;
    try { if (document.pointerLockElement) document.exitPointerLock(); } catch (e) { /* ok */ }
    try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) { /* ok */ }
    try { if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); } catch (e) { /* ok */ }
    try { if (wakeLock) { wakeLock.release(); wakeLock = null; } } catch (e) { /* ok */ }
    try { if (audio) { audio.close(); audio = null; vientoG = null; trafG = null; motG = null; bus = null; aguaG = null; } } catch (e) { /* ok */ }
    document.body.classList.remove('pj', 'pjvr', 'pjcb', 'pjtouch', 'pjobs'); tactil = false; hud.classList.remove('on'); btnSalir.classList.remove('on'); msgEl.style.display = 'none';
    xrAcelera = 0; xrFrena = 0; ctrlY = [null, null]; acelera = false; frena = false;
    if (T3.trees) { T3.trees.umbral = 0; T3.trees.minMs = 0; } if (T3.plants) T3.plants.minMs = 0; via.tope = 1; calidad = 0; tAcum = 0; nAcum = 0; tPrev = 0; try { const A = ctx.aves(); if (A && A.grp) A.grp.visible = true; } catch (e) { /* ok */ }
  }
  function salir() { if (!activo) return; activo = false; restaurar(); modo = null; abrirMenu(); } // al salir (botón Salir, Escape, B/Y en gafas o cerrar el VR) vuelve a «Elige tu ave»
  btnSalir.onclick = salir;
  addEventListener('keydown', onKey); addEventListener('keyup', onKey); addEventListener('mousemove', onMouse);
  addEventListener('touchstart', onTouchStart, { passive: true }); addEventListener('touchend', onTouchEnd, { passive: true });
  document.addEventListener('click', (e) => { if (e.target && e.target.tagName === 'CANVAS') onClickCanvas(); });
  addEventListener('resize', () => { if (activo && efecto) { efecto.setSize(innerWidth, innerHeight); T3.camera.aspect = innerWidth / innerHeight; T3.camera.updateProjectionMatrix(); } });
  return { abrirMenu, salir, mundoVivo, get activo() { return activo; }, get modo() { return modo; }, renderEspejo, get debug() { return { sim, via, bot, confort: () => { if (!vinM) crearConfort(); tFade = 1; confortPaso(0.1); return [vinM.visible, fadeM.material.opacity]; }, vibrar, peces, nido, rig, vel, paso, tecla: (c, v) => { teclas[c] = v; }, aleteo, ver: (y, p) => { yaw = y; pit = p; } }; } };
}