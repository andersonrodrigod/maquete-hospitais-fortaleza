// Schematic city anchored to the collected CNES coordinates. Roads/buildings are authored.
export const BLOCK=42;
const SCALE=6000,ORIGIN={latitude:-3.7396458312179717,longitude:-38.476717472076416};
export const normalizeSearch=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function searchHospitals(hospitals,query='',onlyMonitored=false){
  const terms=normalizeSearch(query).trim().split(/\s+/).filter(Boolean);
  return hospitals.filter(h=>(!onlyMonitored||h.monitoring)&&terms.every(term=>normalizeSearch(`${h.name} ${h.cnes} ${h.location?.neighborhood||''}`).includes(term)));
}
export function createCityLayout(hospitals){
  const used=new Set(),sites=[];
  // CNES is a stable tie breaker so importing a different array order does not move buildings.
  const ordered=[...hospitals].sort((a,b)=>(a.cnes==='2497654'?-1:b.cnes==='2497654'?1:a.cnes.localeCompare(b.cnes)));
  for(const h of ordered){
    const valid=Number.isFinite(h.location?.latitude)&&Number.isFinite(h.location?.longitude);
    const sourceX=valid?(h.location.longitude-ORIGIN.longitude)*SCALE*Math.cos(ORIGIN.latitude*Math.PI/180):0;
    const sourceZ=valid?-(h.location.latitude-ORIGIN.latitude)*SCALE:0;
    const col=Math.round(sourceX/BLOCK),row=Math.round(sourceZ/BLOCK);
    let found;
    for(let r=0;!found;r++){
      const candidates=[];
      for(let dx=-r;dx<=r;dx++)for(let dz=-r;dz<=r;dz++){
        if(Math.max(Math.abs(dx),Math.abs(dz))!==r)continue;
        const x=(col+dx)*BLOCK||0,z=(row+dz)*BLOCK||0;
        if(!used.has(`${x}/${z}`))candidates.push({x,z,distance:Math.hypot(x-sourceX,z-sourceZ)});
      }
      candidates.sort((a,b)=>a.distance-b.distance||a.x-b.x||a.z-b.z);found=candidates[0];
    }
    used.add(`${found.x}/${found.z}`);
    const seed=Number(h.cnes),height=3+Math.min(10,Math.ceil(h.total/85)),variant=seed%5;
    sites.push({...h,x:found.x,z:found.z,sourceX,sourceZ,
      adjusted:!valid||found.distance>1,coordinateKnown:valid,variant,height,
      shortName:h.cnes==='2497654'?'HGF':h.name.replace(/^HOSPITAL /,'').replace(/HOSPITAL /g,'').slice(0,33)});
  }
  const minX=Math.min(...sites.map(h=>h.x))-BLOCK,maxX=Math.max(...sites.map(h=>h.x))+BLOCK;
  const minZ=Math.min(...sites.map(h=>h.z))-BLOCK,maxZ=Math.max(...sites.map(h=>h.z))+BLOCK;
  return {sites,minX,maxX,minZ,maxZ,width:maxX-minX,depth:maxZ-minZ,center:[(minX+maxX)/2,0,(minZ+maxZ)/2],
    cols:Array.from({length:Math.round((maxX-minX)/BLOCK)+1},(_,i)=>minX+i*BLOCK),
    rows:Array.from({length:Math.round((maxZ-minZ)/BLOCK)+1},(_,i)=>minZ+i*BLOCK)};
}
