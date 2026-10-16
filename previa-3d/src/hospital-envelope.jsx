import React,{useLayoutEffect,useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {Sign} from './primitives';
import {buildingPose,CLOSED_FLOOR_HEIGHT} from './building-animation';

function EnvelopeBlocks({items,motion,roof=false}){
  const ref=useRef();
  useLayoutEffect(()=>{
    const obj=new THREE.Object3D(),color=new THREE.Color();
    items.forEach((item,i)=>{
      obj.position.set(...item.at);obj.scale.set(...item.size);obj.updateMatrix();
      ref.current.setMatrixAt(i,obj.matrix);ref.current.setColorAt(i,color.set(item.color));
    });
    ref.current.instanceMatrix.needsUpdate=true;ref.current.instanceColor.needsUpdate=true;
    ref.current.computeBoundingSphere();
  },[items]);
  useFrame(()=>{
    const pose=buildingPose(motion.current.progress),opacity=roof?pose.roofOpacity:pose.panelOpacity;
    ref.current.material.opacity=opacity;ref.current.material.depthWrite=opacity>.98;
  });
  return <instancedMesh ref={ref} args={[null,null,items.length]} receiveShadow>
    <boxGeometry args={[1,1,1]}/><meshStandardMaterial transparent roughness={.78}/>
  </instancedMesh>;
}
function FacadePanel({side,motion}){
  const group=useRef(),width=side<2?78:52;
  const items=useMemo(()=>{
    const pieces=[{at:[0,0,0],size:[width,3.7,.4],color:'#f4e5c7'},
      {at:[0,-1.65,.24],size:[width,.22,.1],color:'#4096b3'},
      {at:[0,1.7,.23],size:[width,.15,.13],color:'#fff9e9'}];
    const columns=Math.floor(width/5.5);
    for(let i=0;i<columns;i++){
      const x=(i-(columns-1)/2)*5.5;
      pieces.push({at:[x,.1,.25],size:[4.35,1.85,.1],color:'#fbf7eb'});
      pieces.push({at:[x,.1,.32],size:[4.1,1.6,.1],color:'#479ec8'});
      pieces.push({at:[x,.1,.4],size:[.12,1.6,.06],color:'#f7faff'});
      pieces.push({at:[x,-.65,.33],size:[4.4,.12,.08],color:'#fff'});
    }
    return pieces;
  },[width]);
  useFrame(()=>{
    const pose=buildingPose(motion.current.progress),g=group.current;
    const positions=[[0,1.7,26.3+pose.panelSlide],[0,1.7,-26.3-pose.panelSlide],[-39.3-pose.panelSlide,1.7,0],[39.3+pose.panelSlide,1.7,0]];
    g.position.set(...positions[side]);g.rotation.set(pose.panelTilt,[0,Math.PI,-Math.PI/2,Math.PI/2][side],0);
    g.visible=pose.panelOpacity>.002;
  });
  return <group ref={group}><EnvelopeBlocks items={items} motion={motion}/></group>;
}
export function FloorEnvelope({motion}){
  return <group>{[0,1,2,3].map(side=><FacadePanel key={side} side={side} motion={motion}/>)}</group>;
}
export function HospitalRoof({motion,floorCount,name}){
  const group=useRef();
  const items=useMemo(()=>[
    {at:[0,0,0],size:[79,.6,53],color:'#d5d5c8'},
    {at:[0,.4,0],size:[76,.2,50],color:'#c3cfd2'},
    ...[-26,26].map(z=>({at:[0,.55,z],size:[79,.85,.5],color:'#f7faff'})),
    ...[-39,39].map(x=>({at:[x,.55,0],size:[.5,.85,52],color:'#f7faff'})),
    ...[-18,0,18].map(x=>({at:[x,1.1,-7],size:[8,1.8,4.5],color:'#b5c5d5'})),
    ...[-28,-18,-8].flatMap(x=>[
      {at:[x,.75,12],size:[8,.2,10],color:'#2b79a8'},
      ...[-3,0,3].map(z=>({at:[x,.87,12+z],size:[7.8,.04,.06],color:'#a4d5e7'})),
    ]),
    {at:[0,1.8,12],size:[52,2.3,.4],color:'#f7faff'},
  ],[]);
  useFrame(()=>{
    const pose=buildingPose(motion.current.progress),g=group.current;
    g.position.set(0,floorCount*CLOSED_FLOOR_HEIGHT+pose.roofLift,-pose.roofLift*.25);
    g.rotation.z=-pose.roofLift*.002;g.visible=pose.roofOpacity>.002;
  });
  return <group ref={group}>
    <EnvelopeBlocks items={items} motion={motion} roof/>
    <Sign text={name} at={[0,1.8,12.25]} size={[49,1.4]}/>
  </group>;
}
export function HospitalEntrance({motion,name}){
  const group=useRef();
  const items=useMemo(()=>[
    {at:[0,-1.1,1],size:[84,.5,61],color:'#b9ccdc'},
    {at:[0,-.8,2],size:[82,.15,60],color:'#efe3ca'},
    {at:[0,1.6,27],size:[14,3,.2],color:'#4fa8c9'},
    {at:[0,3.4,29.2],size:[20,.3,6],color:'#3569e8'},
    ...[-8,8].map(x=>({at:[x,1.4,31],size:[.3,3.4,.3],color:'#bfcede'})),
    {at:[0,.2,31],size:[18,.2,3],color:'#d4e0ea'},
    ...[-1,1].map(side=>({at:[side*29,-.5,29],size:[14,.4,2],color:'#c6dfd0'})),
    {at:[0,4.8,26.7],size:[62,2.2,.2],color:'#f7faff'},
  ],[]);
  useFrame(()=>{
    const pose=buildingPose(motion.current.progress);
    group.current.position.z=pose.panelSlide*.5;group.current.visible=pose.panelOpacity>.002;
  });
  return <group ref={group}>
    <EnvelopeBlocks items={items} motion={motion}/>
    <Sign text={name} at={[0,4.8,26.85]} size={[59,1.3]}/>
  </group>;
}
