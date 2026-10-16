import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {importEmergencies} from './emergency-data.js';

const fixture=()=>({paineis:[{id:32,pagina:'https://integrasus.saude.ce.gov.br/#/hgf'},{id:230,pagina:'https://integrasus.saude.ce.gov.br/#/hm'}],
  emergencias:['HGF','HM'].map(hospital=>({hospital,disponivel:true,pacientes_ate_24h:8,pacientes_acima_24h:2,total_derivado_das_faixas:10,
    consultado_em_utc:'2026-10-15T23:00:00Z',url:'https://integrasus.saude.ce.gov.br/api/example?isExtra=false&idClinica=&idMunicipio=&codCid='}))});
test('emergency maps HGF and Messejana to their CNES, with independently dated counts',()=>{
  const snapshot=fixture();snapshot.emergencias[1].pacientes_ate_24h=3;snapshot.emergencias[1].total_derivado_das_faixas=5;
  const reports=importEmergencies(snapshot);
  assert.equal(reports.get('2497654').total,10);assert.equal(reports.get('2479214').total,5);
  assert.equal(reports.get('2479214').over24hPercent,40);
  assert.equal(reports.get('2497654').consultedAt,'2026-10-15T23:00:00Z');
  assert.equal(reports.get('2561417'),undefined);
});
test('missing emergency differs from measured zero; zero has no percentage',()=>{
  const snapshot=fixture();snapshot.emergencias[0]={hospital:'HGF',disponivel:false};
  Object.assign(snapshot.emergencias[1],{pacientes_ate_24h:0,pacientes_acima_24h:0,total_derivado_das_faixas:0});
  const reports=importEmergencies(snapshot);
  assert.equal(reports.get('2497654').available,false);assert.equal(reports.get('2497654').total,undefined);
  assert.equal(reports.get('2479214').total,0);assert.equal(reports.get('2479214').over24hPercent,null);
});
test('reject invalid sums, duplicate hospitals, missing sources, dates and changed filters',()=>{
  for(const mutate of [s=>s.emergencias[0].total_derivado_das_faixas++,s=>s.emergencias[0].pacientes_acima_24h=-1,
    s=>s.emergencias.push(s.emergencias[0]),s=>s.emergencias.pop(),s=>s.paineis=[],
    s=>s.emergencias[0].consultado_em_utc='invalid',s=>s.emergencias[0].url=s.emergencias[0].url.replace('isExtra=false','isExtra=true')]){
    const snapshot=fixture();mutate(snapshot);assert.throws(()=>importEmergencies(snapshot));
  }
});
test('imported app exposes emergency only for the two confirmed hospitals and preserves separate bed totals',()=>{
  const data=JSON.parse(fs.readFileSync(new URL('./data/hospitals.json',import.meta.url)));
  assert.deepEqual(data.hospitals.filter(h=>h.emergency).map(h=>h.cnes).sort(),['2479214','2497654']);
  for(const h of data.hospitals.filter(h=>h.emergency?.available)){
    assert.equal(h.emergency.upTo24h+h.emergency.over24h,h.emergency.total);
    assert.equal(h.monitoring.total,h.monitoring.occupied+h.monitoring.free);
  }
});
