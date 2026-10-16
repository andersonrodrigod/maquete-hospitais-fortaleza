// Explicit source-to-CNES mapping: emergency totals never become bed occupancy.
const sources={HGF:{cnes:'2497654',panel:32},HM:{cnes:'2479214',panel:230}};
export function importEmergencies(snapshot){
  if(!Array.isArray(snapshot.emergencias))throw new Error('Coleta sem emergência');
  const result=new Map(),seen=new Set();
  for(const row of snapshot.emergencias){
    const source=sources[row.hospital];
    if(!source||seen.has(row.hospital))throw new Error('Hospital de emergência desconhecido ou duplicado');
    seen.add(row.hospital);
    const panel=snapshot.paineis.find(p=>p.id===source.panel);
    if(!panel?.pagina?.startsWith('https://integrasus.saude.ce.gov.br/#/'))throw new Error('Painel de emergência sem fonte');
    if(typeof row.disponivel!=='boolean')throw new Error('Disponibilidade de emergência inválida');
    const common={available:row.disponivel,panelUrl:panel.pagina};
    if(!row.disponivel){result.set(source.cnes,common);continue;}
    const {pacientes_ate_24h:upTo24h,pacientes_acima_24h:over24h,total_derivado_das_faixas:total}=row;
    if(![upTo24h,over24h,total].every(n=>Number.isSafeInteger(n)&&n>=0)||upTo24h+over24h!==total)
      throw new Error('Contagem de emergência inconsistente');
    if(!row.consultado_em_utc||!Number.isFinite(Date.parse(row.consultado_em_utc))||
      !row.url?.startsWith('https://integrasus.saude.ce.gov.br/api/'))throw new Error('Emergência sem data ou API válida');
    const query=new URL(row.url).searchParams;
    if(query.get('isExtra')!=='false'||['idClinica','idMunicipio','codCid'].some(k=>query.get(k)!==''))
      throw new Error('Filtro de emergência diferente do recorte esperado');
    result.set(source.cnes,{...common,upTo24h,over24h,total,
      over24hPercent:total?over24h/total*100:null,
      consultedAt:row.consultado_em_utc,sourceUrl:row.url});
  }
  if(seen.size!==Object.keys(sources).length)throw new Error('Coleta de emergência incompleta');
  return result;
}
