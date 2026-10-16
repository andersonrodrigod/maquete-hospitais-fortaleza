import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createSceneHospital,bedCounts} from './scene-data.js';
import {createBedLayout} from './bed-layout.js';
import {createBedVisuals} from './bed-visuals.js';
const data=JSON.parse(fs.readFileSync(new URL('./data/hospitals.json',import.meta.url)));

test('all monitored hospitals represent every occupied and free slot exactly, including floor filters',()=>{
  for(const source of data.hospitals.filter(h=>h.monitoring)){
    const hospital=createSceneHospital(source),layout=createBedLayout(hospital);
    assert.equal(layout.beds.length,source.monitoring.total);
    assert.deepEqual(bedCounts(layout.beds),{occupied:source.monitoring.occupied,free:source.monitoring.free,unknown:0});
    const people=createBedVisuals(layout.beds).heads.filter(p=>p.role==='head');
    assert.equal(people.length,source.monitoring.occupied);
    assert.equal(new Set(people.map(p=>p.bedId)).size,source.monitoring.occupied);
    assert.ok(people.every(p=>layout.beds.find(b=>b.id===p.bedId).status==='occupied'));
    for(const type of hospital.types)assert.deepEqual(bedCounts(createBedLayout(hospital,type.id).beds),{occupied:type.occupied,free:type.free,unknown:0});
    const parts=layout.floors.flatMap(f=>createBedLayout(hospital,null,f.id).beds);
    assert.deepEqual(bedCounts(parts),bedCounts(layout.beds));
    assert.equal(new Set(parts.map(b=>b.id)).size,source.monitoring.total);
  }
});
test('100 free beds means exactly 100 empty slots, regardless of inventory count',()=>{
  const original={cnes:'test',total:602,types:[],monitoring:{total:237,occupied:137,free:100,
    clinics:[{clinica:'Exemplo',total:237,quantidadeOcupada:137,quantidadeLivre:100}]}};
  const scene=createSceneHospital(original);
  assert.deepEqual(bedCounts(createBedLayout(scene).beds),{occupied:137,free:100,unknown:0});
  assert.equal(scene.registryTotal,602);
  const beds=createBedLayout(scene).beds,visuals=createBedVisuals(beds);
  assert.equal(visuals.heads.filter(p=>p.role==='head').length,137);
  const people=new Set(visuals.heads.map(p=>p.bedId));
  assert.equal(beds.filter(b=>!people.has(b.id)).length,100);
  for(const bed of beds)assert.equal(people.has(bed.id),bed.status==='occupied');
});
test('CNES and hospitals without monitoring never fabricate occupied or free beds',()=>{
  for(const source of data.hospitals){
    for(const mode of source.monitoring?['cnes']:['cnes','monitoring']){
      const scene=createSceneHospital(source,mode);
      assert.equal(scene.dataMode,'cnes');
      assert.deepEqual(bedCounts(createBedLayout(scene).beds),{occupied:0,free:0,unknown:source.total});
    }
  }
});
test('reject inconsistent counts instead of drawing a false occupancy',()=>{
  const h=data.hospitals.find(h=>h.monitoring);
  const bad=structuredClone(h);bad.monitoring.free++;
  assert.throws(()=>createSceneHospital(bad),/inconsistente/);
  const badClinic=structuredClone(h);badClinic.monitoring.clinics[0].quantidadeOcupada++;
  assert.throws(()=>createSceneHospital(badClinic),/inconsistente/);
});
