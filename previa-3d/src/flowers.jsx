import React, {useLayoutEffect, useRef} from 'react';
import * as THREE from 'three';
import {Box, Ball, Cylinder} from './primitives';
import Instances from './instances';

export function FlowerBed({x,z,length=3,width=.65,color='#eaa4bf',rotation=0}) {
  const petals=useRef(),stems=useRef();
  const count=Math.max(8,Math.round(length*width*9));
  useLayoutEffect(()=>{
    const obj=new THREE.Object3D();
    for(let i=0;i<count;i++){
      const px=((i*.61803398875)%1-.5)*(length-.18);
      const pz=((i*.41421356237)%1-.5)*(width-.14);
      const h=.28+(i%3)*.07;
      obj.position.set(px,h/2+.15,pz);obj.scale.set(.025,h,.025);obj.updateMatrix();stems.current.setMatrixAt(i,obj.matrix);
      for(let j=0;j<5;j++){
        const a=j*Math.PI*2/5;
        obj.position.set(px+Math.cos(a)*.075,h+.15,pz+Math.sin(a)*.075);
        obj.scale.set(.07,.045,.07);obj.updateMatrix();petals.current.setMatrixAt(i*5+j,obj.matrix);
        petals.current.setColorAt(i*5+j,new THREE.Color(i%4===0?'#ffd45a':color));
      }
    }
    stems.current.instanceMatrix.needsUpdate=true;petals.current.instanceMatrix.needsUpdate=true;
    petals.current.instanceColor.needsUpdate=true;
    stems.current.computeBoundingSphere();petals.current.computeBoundingSphere();
  },[count,length,width,color]);
  return <group position={[x,.08,z]} rotation={[0,rotation,0]}>
    <Box at={[0,.06,0]} size={[length+.12,.16,width+.12]} color="#e9dfd1"/>
    <Box at={[0,.15,0]} size={[length,.035,width]} color="#70a440"/>
    <instancedMesh ref={stems} args={[null,null,count]}><boxGeometry/><meshStandardMaterial color="#3f873e"/></instancedMesh>
    <instancedMesh ref={petals} args={[null,null,count*5]} castShadow><sphereGeometry args={[1,6,4]}/><meshStandardMaterial roughness={.85}/></instancedMesh>
  </group>;
}

export function FlowerTree({x,z,color='#eb83ac',size=1}) {
  const blossoms=Array.from({length:26},(_,i)=>{const a=i*2.39996,r=i<18?.48:.24;return {at:[Math.cos(a)*r,1.42+(i%5)*.15,Math.sin(a)*r],size:[.28,.32,.28],color:i%3?color:'#ffbfd4'};});
  return <group position={[x,.1,z]} scale={size}>
    <Cylinder at={[0,.75,0]} args={[.07,.12,1.5,8]} color="#906046"/>
    <Instances items={blossoms} round/>
  </group>;
}
