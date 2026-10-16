import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createCityLayout,searchHospitals,BLOCK} from './city-layout.js';
import {buildCityGeometry} from './city-geometry.js';
import {createSceneHospital,bedCounts} from './scene-data.js';
import {createBedLayout} from './bed-layout.js';
const {hospitals}=JSON.parse(fs.readFileSync(new URL('./data/hospitals.json',import.meta.url)));

test('all 78 hospitals occupy distinct lots, preserve source coordinates and work regardless of input order',()=>{
  const city=createCityLayout(hospitals),reversed=createCityLayout([...hospitals].reverse());
  assert.equal(city.sites.length,78);assert.equal(new Set(city.sites.map(h=>h.cnes)).size,78);
  assert.equal(new Set(city.sites.map(h=>`${h.x}/${h.z}`)).size,78);
  assert.ok(city.width*city.depth>60*48*100,'city is substantially larger than the former single block');
  for(const h of city.sites){
    assert.ok(h.coordinateKnown);assert.equal(h.location,hospitals.find(x=>x.cnes===h.cnes).location);
    const other=reversed.sites.find(x=>x.cnes===h.cnes);assert.deepEqual([h.x,h.z],[other.x,other.z]);
    assert.ok(city.cols.includes(h.x)&&city.rows.includes(h.z));
    assert.ok(h.x>city.minX&&h.x<city.maxX&&h.z>city.minZ&&h.z<city.maxZ);
  }
  assert.deepEqual([city.sites.find(h=>h.cnes==='2497654').x,city.sites.find(h=>h.cnes==='2497654').z],[0,0]);
});
test('one clickable building complex per hospital and a continuous road on every lot boundary',()=>{
  const city=createCityLayout(hospitals),geometry=buildCityGeometry(city);
  const clickable=new Set(geometry.hospitals.map(p=>p.pickId));
  assert.deepEqual([...clickable].sort(),hospitals.map(h=>h.cnes).sort());
  for(const h of city.sites){
    const parts=geometry.hospitals.filter(p=>p.pickId===h.cnes);
    assert.ok(parts.length>20);
    assert.ok(parts.every(p=>Math.abs(p.at[0]-h.x)+p.size[0]/2<BLOCK/2&&Math.abs(p.at[2]-h.z)+p.size[2]/2<BLOCK/2));
    assert.ok(geometry.streets.some(p=>p.at[0]===h.x+BLOCK/2&&p.size[2]>=city.depth));
    assert.ok(geometry.streets.some(p=>p.at[2]===h.z+BLOCK/2&&p.size[0]>=city.width));
  }
});
test('search finds names without accents, neighborhoods, CNES codes, and only actual monitoring coverage',()=>{
  assert.ok(searchHospitals(hospitals,'sao jose').some(h=>h.cnes==='2561417'));
  assert.equal(searchHospitals(hospitals,'2497654')[0].name,'HGF HOSPITAL GERAL DE FORTALEZA');
  assert.ok(searchHospitals(hospitals,'papicu').every(h=>h.location.neighborhood==='PAPICU'));
  assert.equal(searchHospitals(hospitals,'',true).length,7);
  assert.equal(searchHospitals(hospitals,'does-not-exist').length,0);
});
test('each map destination opens its own complete inventory and exact known occupancy',()=>{
  for(const site of createCityLayout(hospitals).sites){
    const source=hospitals.find(h=>h.cnes===site.cnes),scene=createSceneHospital(site);
    assert.equal(createBedLayout(createSceneHospital(site,'cnes')).beds.length,source.total);
    assert.deepEqual(bedCounts(createBedLayout(scene).beds),source.monitoring?
      {occupied:source.monitoring.occupied,free:source.monitoring.free,unknown:0}:
      {occupied:0,free:0,unknown:source.total});
  }
});
test('zoom simplification retains every hospital as a clickable destination',()=>{
  const city=createCityLayout(hospitals),full=buildCityGeometry(city),far=buildCityGeometry(city,true,{x:0,z:0,radius:0});
  assert.deepEqual([...new Set(far.hospitals.map(p=>p.pickId))].sort(),hospitals.map(h=>h.cnes).sort());
  assert.ok(far.hospitals.length<full.hospitals.length/3);
  assert.ok(far.buildings.length<full.buildings.length/3);
});
