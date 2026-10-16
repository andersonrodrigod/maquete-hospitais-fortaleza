// Componentes visuais adaptados de andersonrodrigod/site-demandas (53948d4).
import React, {useMemo, useRef, useEffect} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import Instances from './instances';
const BLUE='#3569e8', WHITE='#f7faff';
function Box({at=[0,0,0],size=[1,1,1],color=WHITE,...props}) {return <mesh position={at} castShadow receiveShadow {...props}><boxGeometry args={size}/><meshStandardMaterial color={color} roughness={.75}/></mesh>}
function Cylinder({at=[0,0,0],args=[.1,.1,1,10],color=WHITE,...props}){return <mesh position={at} castShadow receiveShadow {...props}><cylinderGeometry args={args}/><meshStandardMaterial color={color}/></mesh>}
function Ball({at=[0,0,0],radius=.2,color=WHITE,scale,...props}){return <mesh position={at} scale={scale} castShadow {...props}><sphereGeometry args={[radius,12,8]}/><meshStandardMaterial color={color} roughness={.85}/></mesh>}
function Sign({text,at,size=[3,.5],color='#3569e8',background='#ffffff',rotation=[0,0,0]}){
 const texture=useMemo(()=>{const c=document.createElement('canvas');const x=c.getContext('2d');x.font='600 100px Arial';c.width=Math.max(180,Math.ceil(x.measureText(text).width+80));c.height=160;x.fillStyle=background;x.fillRect(0,0,c.width,c.height);x.fillStyle=color;x.font='600 100px Arial';x.textAlign='center';x.textBaseline='middle';x.fillText(text,c.width/2,84,c.width-40);const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;return texture},[text,color,background]);
 useEffect(()=>()=>texture.dispose(),[texture]);
 return <mesh position={at} rotation={rotation}><planeGeometry args={size}/><meshBasicMaterial map={texture} toneMapped={false}/></mesh>;
}
function Person({position=[0,0,0],color=BLUE,skin='#bd815f',walk=false,stride=false,phase=0,paused=false,rotation=0,headset=false,walkWidth=10.5,walkDepth=7.3}){
 const group=useRef();const left=useRef();const right=useRef();const arm=useRef();const time=useRef(phase);
 useFrame((_,delta)=>{if(!paused)time.current+=Math.min(delta,.05);const t=time.current;if(walk&&group.current){const loop=(t*.045+phase*.13)%1;let x,z,angle;const w=walkWidth,d=walkDepth;if(loop<.25){x=-w/2+loop*4*w;z=d/2;angle=Math.PI/2}else if(loop<.5){x=w/2;z=d/2-(loop-.25)*4*d;angle=Math.PI}else if(loop<.75){x=w/2-(loop-.5)*4*w;z=-d/2;angle=-Math.PI/2}else{x=-w/2;z=-d/2+(loop-.75)*4*d;angle=0}group.current.position.set(x,.18,z);group.current.rotation.y=angle;left.current.rotation.x=Math.sin(t*7)*.42;right.current.rotation.x=-Math.sin(t*7)*.42;arm.current.rotation.x=-Math.sin(t*7)*.3;}else if(stride&&arm.current){left.current.rotation.x=Math.sin(t*7)*.42;right.current.rotation.x=-Math.sin(t*7)*.42;arm.current.rotation.x=-Math.sin(t*7)*.3;}else if(arm.current){arm.current.rotation.x=Math.sin(t*2)*.1;}});
 return <group ref={group} position={position} rotation={[0,rotation,0]} scale={.8}><group ref={left} position={[-.085,.25,0]}><Box at={[0,-.11,0]} size={[.11,.29,.12]} color="#243955"/><Box at={[0,-.25,.025]} size={[.12,.07,.21]} color="#1b2b40"/></group><group ref={right} position={[.085,.25,0]}><Box at={[0,-.11,0]} size={[.11,.29,.12]} color="#243955"/><Box at={[0,-.25,.025]} size={[.12,.07,.21]} color="#1b2b40"/></group><Cylinder at={[0,.42,0]} args={[.145,.12,.32,8]} color={color}/><group ref={arm} position={[-.18,.5,0]}><Box at={[0,-.1,.02]} size={[.09,.27,.1]} color={color}/><Ball at={[0,-.23,.02]} radius={.055} color={skin}/></group><Box at={[.18,.4,.03]} size={[.09,.27,.1]} color={color}/><Ball at={[.18,.26,.03]} radius={.055} color={skin}/><Ball at={[0,.76,0]} radius={.17} color={skin} scale={[.92,1.1,.94]}/><Ball at={[0,.84,-.025]} radius={.166} color="#32303a" scale={[1,.65,1]}/>{headset&&<><mesh position={[0,.79,0]} rotation={[0,0,Math.PI/2]}><torusGeometry args={[.185,.024,6,16,Math.PI]}/><meshStandardMaterial color="#263752"/></mesh><Box at={[.16,.76,.015]} size={[.065,.1,.085]} color="#263752"/></>}</group>;
}
const leafClusters=Array.from({length:22},(_,i)=>{
 const a=i*2.39996,r=i<16?.38:.19;
 return {at:[Math.cos(a)*r,1.38+(i%5)*.115,Math.sin(a)*r],
   size:[.23+(i%3)*.035,.25+(i%4)*.035,.24],color:['#448b39','#6aa934','#8bbd40','#548f30','#a6c94b'][i%5]};
});
function Tree({x,z,size=1}){return <group position={[x,.12,z]} scale={size}>
 <Cylinder at={[0,.7,0]} args={[.065,.12,1.4,8]} color="#866044"/>
 <Cylinder at={[-.14,1.13,0]} args={[.035,.055,.52,7]} rotation={[0,0,-.6]} color="#866044"/>
 <Instances items={leafClusters} round/>
 <Cylinder at={[0,.015,0]} args={[.49,.53,.07,14]} color="#c5bd9e"/>
 </group>}
function Planter({x,z}){return <group><Cylinder at={[x,.27,z]} args={[.23,.18,.4,12]} color="#f2e0bb"/><Cylinder at={[x,.48,z]} args={[.2,.2,.025,12]} color="#75563d"/>{[-1,0,1].map(i=><Ball key={i} at={[x+i*.1,.68+Math.abs(i)*.08,z]} radius={.2} color={i?'#76ab3c':'#468d43'} scale={[.65,1.6,.75]}/>)}</group>}
function Lamp({x,z}){return <group position={[x,.12,z]}><Cylinder at={[0,.85,0]} args={[.027,.043,1.7,8]} color="#43596c"/><Cylinder at={[0,.12,0]} args={[.075,.1,.24,8]} color="#43596c"/><Box at={[.13,1.72,0]} size={[.32,.065,.13]} color="#43596c"/><Box at={[.16,1.68,0]} size={[.22,.028,.12]} color="#ffe5a5"/></group>}
function Bench({x,z,rotate=0}){return <group position={[x,.17,z]} rotation={[0,rotate,0]}>{[-.13,0,.13].map(a=><Box key={a} at={[0,.25,a]} size={[.9,.06,.09]} color="#b99b77"/>)}<Box at={[0,.45,-.18]} size={[.9,.22,.06]} color="#b99b77"/>{[-.32,.32].map(a=><Box key={a} at={[a,.12,0]} size={[.055,.26,.38]} color="#607b78"/>)}</group>}

export {Box, Cylinder, Ball, Sign, Person, Tree, Planter, Lamp, Bench};
