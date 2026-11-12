/* Extrae los indicadores de https://anasoficasca-code.github.io/picos/ a data3d/indicadores/<code>[_2020].json
   Marco de picos: x este, y norte (m) -> mundo del simulador: z=-y; X = x cos r - z sin r + 1692, Z = x sin r + z cos r - 588, r = -28,1° (alineado por los edificios). */
const fs=require('fs');const c=fs.readFileSync(process.argv[2],'utf8');
const D=JSON.parse(c.split('\n').find(x=>x.startsWith('const DATA =')).slice(13).replace(/;\s*$/,''));
const out='C:/Users/ACER/simulador/data3d/indicadores/';const idx=[];
for(const d of D){const f=d.code+(d.year?'_'+d.year:'')+'.json';
 fs.writeFileSync(out+f,JSON.stringify({code:d.code,name:d.name,year:d.year||null,nV:d.nV,nF:d.nF,b:d.b,ramp:d.ramp,pos:d.pos,col:d.col,idx:d.idx}));
 idx.push({code:d.code,name:d.name.replace(/\s*·\s*2020$/,''),year:d.year||null,f,ramp:[d.ramp[0],d.ramp[12],d.ramp[24],d.ramp[36],d.ramp[48]]});}
fs.writeFileSync(out+'index.json',JSON.stringify({fuente:'anasoficasca-code.github.io/picos',ox:1692,oz:-588,rot:-28.1,lista:idx}));
console.log(idx.map(i=>i.f).join(' '));
