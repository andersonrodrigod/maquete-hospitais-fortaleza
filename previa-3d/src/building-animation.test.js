import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildingPose,localFloorLayout,CLOSED_FLOOR_HEIGHT} from './building-animation.js';
import {createBedLayout} from './bed-layout.js';
const data=JSON.parse(fs.readFileSync(new URL('./data/hospitals.json',import.meta.url),'utf8'));

test('the assembled envelope closes and the exploded endpoint matches every floor',()=>{
  for(const h of data.hospitals){
    const layout=createBedLayout(h);
    layout.floors.forEach((f,index)=>{
      const closed=buildingPose(0,index,layout.floors.length),open=buildingPose(1,index,layout.floors.length);
      assert.equal(closed.floorY,index*CLOSED_FLOOR_HEIGHT);
      assert.equal(closed.panelOpacity,1);assert.equal(closed.roofOpacity,1);
      assert.equal(open.floorY,f.y);assert.equal(open.panelOpacity,0);assert.equal(open.roofOpacity,0);
      assert.ok(CLOSED_FLOOR_HEIGHT>2.2,'closed floors leave space above the cutaway walls');
    });
  }
});

test('opening is continuous and monotone, and reversing the same timeline restores each pose',()=>{
  let previousY=0,previousOpacity=1;
  for(let step=0;step<=100;step++){
    const p=step/100,pose=buildingPose(p,5,6);
    assert.ok(pose.floorY>=previousY);assert.ok(pose.panelOpacity<=previousOpacity);
    assert.ok(Number.isFinite(pose.floorY)&&pose.panelOpacity>=0&&pose.panelOpacity<=1);
    previousY=pose.floorY;previousOpacity=pose.panelOpacity;
  }
  assert.deepEqual(buildingPose(-1,2,6),buildingPose(0,2,6));
  assert.deepEqual(buildingPose(2,2,6),buildingPose(1,2,6));
});

test('splitting render groups preserves every bed and its world position at the open endpoint',()=>{
  for(const h of data.hospitals){
    const layout=createBedLayout(h),ids=[];
    for(const f of layout.floors){
      const local=localFloorLayout(layout,f);
      assert.equal(local.beds.length,f.count);
      for(const bed of local.beds){
        const original=layout.beds.find(b=>b.id===bed.id);
        assert.equal(bed.x,original.x);assert.equal(bed.z,original.z);
        assert.equal(bed.y+f.y,original.y);ids.push(bed.id);
      }
    }
    assert.equal(ids.length,h.total);assert.equal(new Set(ids).size,h.total);
  }
});
