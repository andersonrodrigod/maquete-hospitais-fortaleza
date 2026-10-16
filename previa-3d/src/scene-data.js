// Aggregate counts become anonymous visual slots, never identified physical beds.
export function createSceneHospital(hospital, requestedMode='monitoring') {
  const source=hospital.monitoring;
  if(requestedMode!=='monitoring'||!source)return {...hospital,dataMode:'cnes',registryTotal:hospital.total};
  const valid=n=>Number.isInteger(n)&&n>=0;
  if(![source.total,source.occupied,source.free].every(valid)||source.occupied+source.free!==source.total)
    throw new Error(`Ocupação inconsistente: ${hospital.cnes}`);
  const types=source.clinics.map(row=>{
    if(![row.total,row.quantidadeOcupada,row.quantidadeLivre].every(valid)||row.quantidadeOcupada+row.quantidadeLivre!==row.total)
      throw new Error(`Clínica inconsistente: ${hospital.cnes} ${row.clinica}`);
    return {id:`monitoring-${encodeURIComponent(row.clinica)}`,label:row.clinica,count:row.total,
      occupied:row.quantidadeOcupada,free:row.quantidadeLivre,complementary:false,
      details:[{label:'Ocupados',count:row.quantidadeOcupada},{label:'Livres',count:row.quantidadeLivre}]};
  });
  if(new Set(types.map(t=>t.id)).size!==types.length||
    ['count','occupied','free'].some((key,i)=>types.reduce((sum,t)=>sum+t[key],0)!==[source.total,source.occupied,source.free][i]))
    throw new Error(`Soma das clínicas divergente: ${hospital.cnes}`);
  return {...hospital,dataMode:'monitoring',registryTotal:hospital.total,total:source.total,types};
}

export function bedCounts(beds) {
  return beds.reduce((counts,bed)=>{counts[bed.status||'unknown']++;return counts;},
    {occupied:0,free:0,unknown:0});
}
