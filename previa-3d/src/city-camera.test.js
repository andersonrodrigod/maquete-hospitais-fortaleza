import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {OrthographicCamera,Vector3,Spherical} from 'three';
import {createCityLayout} from './city-layout.js';
import {cityCameraOffset} from './city-camera.js';
const world=createCityLayout(JSON.parse(fs.readFileSync(new URL('./data/hospitals.json',import.meta.url))).hospitals);

test('zooming out and rotating from any city district cannot slice the ground or hospital roofs',()=>{
  const points=[];
  for(const x of [world.minX-21,world.maxX+21])for(const z of [world.minZ-21,world.maxZ+21])points.push(new Vector3(x,-.35,z));
  for(const h of world.sites)points.push(new Vector3(h.x,h.height+4,h.z));
  const camera=new OrthographicCamera(-480,480,390,-390,.1,5000);
  const radius=cityCameraOffset(world).length();
  for(const site of world.sites){
    const target=new Vector3(site.x,3,site.z);
    for(const polar of [.2,Math.PI/3,Math.PI/2.15])for(const azimuth of [0,Math.PI/2,Math.PI,Math.PI*1.5]){
      camera.position.copy(target).add(new Vector3().setFromSpherical(new Spherical(radius,polar,azimuth)));
      camera.lookAt(target);camera.updateMatrixWorld();
      for(const zoom of [.12,1,12,95]){
        camera.zoom=zoom;camera.updateProjectionMatrix();
        for(const p of points){
          const projected=p.clone().project(camera);
          assert.ok(projected.z>=-1&&projected.z<=1,`${site.cnes}: city geometry crossed a depth clipping plane`);
        }
      }
    }
  }
});
