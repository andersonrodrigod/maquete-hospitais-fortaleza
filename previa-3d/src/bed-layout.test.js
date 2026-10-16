import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createBedLayout} from './bed-layout.js';
const data=JSON.parse(fs.readFileSync(new URL('./data/hospitals.json',import.meta.url),'utf8'));

test('every hospital renders exactly its source count, with no duplicate symbols',()=>{
  for(const hospital of data.hospitals){
    const model=createBedLayout(hospital);
    assert.equal(model.beds.length,hospital.total,hospital.name);
    assert.equal(new Set(model.beds.map(b=>b.id)).size,hospital.total);
    assert.equal(hospital.ordinary+hospital.complementary,hospital.total);
    for(const type of hospital.types){
      assert.equal(model.beds.filter(b=>b.typeId===type.id).length,type.count);
      assert.equal(type.details.reduce((sum,d)=>sum+d.count,0),type.count);
      assert.equal(createBedLayout(hospital,type.id).beds.length,type.count);
    }
  }
});

test('HGF keeps CNES complementary beds and the IntegraSUS subset distinct',()=>{
  const h=data.hospitals.find(h=>h.cnes==='2497654');
  assert.equal(data.competence,202607);
  assert.equal(h.ordinary,469);assert.equal(h.complementary,133);
  assert.equal(createBedLayout(h).beds.length,602);
  assert.equal(h.monitoring.total,313);
  assert.equal(h.monitoring.occupied+h.monitoring.free,h.monitoring.total);
});

test('no layout claims a physical floor, room, bed identifier, patient or individual occupancy',()=>{
  for(const h of data.hospitals){
    for(const bed of createBedLayout(h).beds){
      for(const key of ['floor','room','patient','occupied','physicalBedId'])assert.equal(bed[key],undefined);
      assert.ok(Number.isFinite(bed.x)&&Number.isFinite(bed.y)&&Number.isFinite(bed.z));
    }
  }
});

test('every bed belongs to a furnished room and keeps the central corridor clear',()=>{
  assert.equal(createBedLayout({types:[]}).beds.length,0);
  for(const h of data.hospitals){
    const model=createBedLayout(h);
    for(const b of model.beds){
      const r=model.rooms.find(r=>r.id===b.illustrativeRoomId);
      const w=model.wings.find(w=>w.id===b.illustrativeWingId);
      assert.ok(r&&w);
      assert.equal(r.illustrative,true);
      assert.ok(Math.abs(b.x-r.x)+.6<r.width/2);
      assert.ok(Math.abs(b.z-r.z)+1.13<r.depth/2);
      assert.ok(Math.abs(b.z-w.z)-1.13>2.1,'bed cannot obstruct corridor');
    }
    for(const room of model.rooms)assert.equal(model.beds.filter(b=>b.illustrativeRoomId===room.id).length,room.count);
    for(const wing of model.wings)assert.equal(model.beds.filter(b=>b.illustrativeWingId===wing.id).length,wing.count);
  }
});

test('partial last rooms preserve remainders and wing bounds never overlap',()=>{
  for(const count of [1,3,4,5,31,32,33,65]){
    const model=createBedLayout({types:[{id:'demo',label:'Demo',count,complementary:false}]});
    assert.equal(model.beds.length,count);
    assert.equal(model.rooms.length,Math.ceil(count/4));
    assert.equal(model.wings.length,Math.ceil(count/32));
    assert.ok(model.rooms.every(r=>r.count<=4&&r.count>0));
    model.wings.forEach((a,i)=>model.wings.slice(i+1).forEach(b=>assert.ok(Math.abs(a.x-b.x)>=32||Math.abs(a.z-b.z)>=21)));
  }
});

test('all illustrated floors sum exactly to the source and contain their own beds',()=>{
  for(const hospital of data.hospitals){
    const model=createBedLayout(hospital);
    assert.equal(model.floors.reduce((sum,f)=>sum+f.count,0),hospital.total);
    const collected=[];
    for(const floor of model.floors){
      assert.equal(floor.illustrative,true);
      const section=createBedLayout(hospital,null,floor.id);
      assert.equal(section.beds.length,floor.count);
      assert.ok(section.beds.every(b=>b.y===floor.y));
      collected.push(...section.beds.map(b=>b.id));
    }
    assert.equal(new Set(collected).size,hospital.total);
    assert.equal(new Set(model.beds.map(b=>`${b.x}/${b.y}/${b.z}`)).size,hospital.total);
  }
  const hgf=createBedLayout(data.hospitals.find(h=>h.cnes==='2497654'));
  assert.deepEqual(hgf.floors.map(f=>f.count),[128,124,128,106,100,16]);
});
