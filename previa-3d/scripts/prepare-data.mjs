import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {importEmergencies} from '../src/emergency-data.js';

const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const workspace=path.resolve(project,'..');
const read=async file=>JSON.parse((await fs.readFile(file,'utf8')).replace(/^\uFEFF/,''));
const inventory=await read(path.join(workspace,'evidencias/inventario/hospitais.json'));
if(!inventory.concluido)throw new Error('Inventário CNES incompleto');
const requests=await read(path.join(workspace,'evidencias/inventario/requisicoes.json'));
const registrations=await read(path.join(workspace,'evidencias/inventario/cadastros.json'));
const collectionRoot=path.join(workspace,'evidencias/integrasus');
const candidates=(await fs.readdir(collectionRoot)).filter(n=>/^\d{8}T\d{6}Z$/.test(n)).sort();
// Failed requests can leave dated folders without a completed summary.
const directories=[];
for(const name of candidates){
  try{await fs.access(path.join(collectionRoot,name,'resumo.json'));directories.push(name);}
  catch(error){if(error.code!=='ENOENT')throw error;}
}
const snapshot=process.argv[2]||directories.at(-1);
if(!snapshot||!/^\d{8}T\d{6}Z$/.test(snapshot))throw new Error('Informe uma pasta de coleta válida');
const live=await read(path.join(workspace,'evidencias/integrasus',snapshot,'resumo.json'));
const emergencies=importEmergencies(live);
const integer=value=>Number.isInteger(value)&&value>=0;
const hospitals=inventory.hospitais.map(h=>{
  const groups=new Map(), seen=new Set();
  for(const row of h.leitos_por_tipo){
    const key=`${row.tp_leito}|${row.ds_leito}`;
    if(seen.has(key)||!integer(row.qt_existente)||!integer(row.qt_sus)||row.qt_sus>row.qt_existente||row.nu_comp!==inventory.competencia_leitos||row.co_cnes!==h.cnes)throw new Error(`Registro CNES inconsistente: ${h.cnes} ${key}`);
    seen.add(key);
    if(!groups.has(row.tp_leito))groups.set(row.tp_leito,{id:row.tp_leito,label:row.tp_leito.replace(/^\d+\s*-\s*/,''),count:0,sus:0,complementary:/^3\s*-/.test(row.tp_leito),details:[]});
    const group=groups.get(row.tp_leito);group.count+=row.qt_existente;group.sus+=row.qt_sus;
    group.details.push({label:row.ds_leito,count:row.qt_existente,sus:row.qt_sus});
  }
  const types=[...groups.values()];
  const total=types.reduce((s,t)=>s+t.count,0);
  if(total!==h.leitos_existentes)throw new Error(`Total CNES divergente: ${h.cnes}`);
  const monitoring=live.hospitais_fortaleza.find(item=>item.cnes===h.cnes)||null;
  if(monitoring){
    const rows=monitoring.clinicas;
    if(![monitoring.total_no_recorte,monitoring.ocupados_no_recorte,monitoring.livres_no_recorte].every(integer)||
      monitoring.ocupados_no_recorte+monitoring.livres_no_recorte!==monitoring.total_no_recorte||
      rows.some(r=>![r.total,r.quantidadeOcupada,r.quantidadeLivre].every(integer)||r.quantidadeOcupada+r.quantidadeLivre!==r.total)||
      new Set(rows.map(r=>r.clinica)).size!==rows.length||
      ['total','quantidadeOcupada','quantidadeLivre'].some((key,i)=>rows.reduce((sum,r)=>sum+r[key],0)!==[monitoring.total_no_recorte,monitoring.ocupados_no_recorte,monitoring.livres_no_recorte][i]))
      throw new Error(`Recorte divergente: ${h.cnes}`);
  }
  const evidence=requests.filter(r=>r.ok&&r.url.includes('cnes-leitos?')&&r.url.includes(`co_cnes=${h.cnes}&`)&&r.url.includes(`nu_comp=${inventory.competencia_leitos}&`));
  if(!evidence.length)throw new Error(`Sem evidência CNES: ${h.cnes}`);
  const registration=registrations.find(r=>String(r.codigo_cnes).padStart(7,'0')===h.cnes);
  const latitude=registration?.latitude_estabelecimento_decimo_grau,longitude=registration?.longitude_estabelecimento_decimo_grau;
  const location=Number.isFinite(latitude)&&Number.isFinite(longitude)&&latitude>-4&&latitude<-3&&longitude>-39&&longitude<-38?
    {latitude,longitude,neighborhood:registration.bairro_estabelecimento,
      street:registration.endereco_estabelecimento,number:registration.numero_estabelecimento,
      registryUpdatedAt:registration.data_atualizacao}:null;
  return {cnes:h.cnes,name:h.nome,types,total,
    ordinary:types.filter(t=>!t.complementary).reduce((s,t)=>s+t.count,0),
    complementary:types.filter(t=>t.complementary).reduce((s,t)=>s+t.count,0),
    sourceUrl:evidence[0].url,consultedAt:evidence[0].consultado_em_utc,location,
    monitoring:monitoring?{total:monitoring.total_no_recorte,occupied:monitoring.ocupados_no_recorte,free:monitoring.livres_no_recorte,clinics:monitoring.clinicas}:null,
    emergency:emergencies.get(h.cnes)||null,
  };
});
const result={competence:inventory.competencia_leitos,scope:inventory.escopo,
  monitoringConsultedAt:live.leitos_consultados_em_utc,monitoringUrl:live.leitos_url,
  hospitals};
await fs.mkdir(path.join(project,'src/data'),{recursive:true});
await fs.writeFile(path.join(project,'src/data/hospitals.json'),JSON.stringify(result,null,2)+'\n');
console.log(`${hospitals.length} hospitais importados; CNES ${result.competence}; IntegraSUS ${result.monitoringConsultedAt}`);
