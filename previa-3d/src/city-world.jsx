import React,{useMemo,useRef,useState} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {Html} from '@react-three/drei';
import * as THREE from 'three';
import Instances from './instances';
import {Box,Sign,Person} from './primitives';
import {BLOCK} from './city-layout';
import {buildCityGeometry} from './city-geometry';

function HospitalLabels({world,activeId,onHospital}){
  const {gl,camera,size,controls}=useThree(),portal=useMemo(()=>({current:gl.domElement.parentElement}),[gl]);
  const [ids,setIds]=useState([activeId]),last=useRef(''),elapsed=useRef(0);
  useFrame((_,delta)=>{
    elapsed.current+=delta;if(elapsed.current<.35)return;elapsed.current=0;
    const target=controls?.target||new THREE.Vector3();
    const sorted=[...world.sites].sort((a,b)=>(a.cnes===activeId?-1:b.cnes===activeId?1:Math.hypot(a.x-target.x,a.z-target.z)-Math.hypot(b.x-target.x,b.z-target.z)));
    const placed=[],visible=[];
    for(const h of sorted){
      const p=new THREE.Vector3(h.x,h.height+3,h.z).project(camera),x=(p.x+1)*size.width/2,y=(1-p.y)*size.height/2;
      if(x<50||x>size.width-40||y<155||y>size.height-90)continue;
      if(placed.some(o=>Math.abs(x-o.x)<150&&Math.abs(y-o.y)<56))continue;
      placed.push({x,y});visible.push(h.cnes);if(visible.length>=9)break;
    }
    const key=visible.join(',');if(key!==last.current){last.current=key;setIds(visible);}
  });
  return ids.map(id=>{
    const h=world.sites.find(h=>h.cnes===id);if(!h)return null;
    return <Html key={id} portal={portal} position={[h.x,h.height+3,h.z]} center zIndexRange={[6,0]}>
      <button className={`map-label city-hospital-label ${id===activeId?'selected':''}`} onClick={()=>onHospital(id)} aria-label={`Ir para ${h.name}`}>
        <span className="label-dot" style={{background:h.monitoring?'#397fe0':'#669b90'}}/><span><small>{h.location?.neighborhood||'HOSPITAL'}</small><strong>{h.shortName}</strong></span><span>↗</span>
      </button>
    </Html>;
  });
}
function CityCars({world,paused,activeSite}){
  const mesh=useRef(),clock=useRef(0);
  const routes=useMemo(()=>[...Array.from({length:132},(_,i)=>({horizontal:i%2===0,
    lane:i%2===0?world.rows[Math.floor(i/2)%(world.rows.length-1)]+BLOCK/2:world.cols[Math.floor(i/2)%(world.cols.length-1)]+BLOCK/2,
    ambulance:i%9===0,direction:i%4<2?1:-1,
    phase:(i*.61803398875)%1,speed:2.4+(i%4)*.5,color:['#438bdc','#e5b74c','#e07c76','#f4f5ec','#579f95'][i%5]})),...Array.from({length:20},(_,i)=>({horizontal:i%2===0,lane:(i%2===0?activeSite.z:activeSite.x)+(i%4<2?-BLOCK/2:BLOCK/2),phase:(i*.61803398875)%1,speed:2.8+(i%3)*.4,direction:i%3===0?-1:1,ambulance:i%5===0,color:['#438bdc','#e5b74c','#e07c76','#f4f5ec','#579f95'][i%5],local:true}))],[world,activeSite.x,activeSite.z]);
  const parts=[{at:[0,.5,0],size:[1.25,.5,2.6]},{at:[0,.91,-.1],size:[1.05,.5,1.25]},
    {at:[0,.96,.55],size:[.9,.3,.04],color:'#5486a2'},
    {at:[-.3,1.55,-.1],size:[.25,.14,.3],color:'#ef4c59',emergency:true},
    {at:[.3,1.55,-.1],size:[.25,.14,.3],color:'#468fff',emergency:true},
    {at:[.64,1,-.3],size:[.04,.48,.14],color:'#d84c59',emergency:true},
    {at:[.64,1,-.3],size:[.04,.14,.48],color:'#d84c59',emergency:true},
    ...[-.65,.65].flatMap(x=>[-.8,.8].map(z=>({at:[x,.28,z],size:[.18,.4,.4],color:'#3d5262'})))];
  useFrame((_,delta)=>{
    if(!paused)clock.current+=Math.min(delta,.1);
    const obj=new THREE.Object3D(),color=new THREE.Color();
    routes.forEach((r,i)=>{
      const length=r.local?BLOCK*3:r.horizontal?world.width:world.depth;
      const originX=r.local?activeSite.x-BLOCK*1.5:world.minX,originZ=r.local?activeSite.z-BLOCK*1.5:world.minZ;
      const t=((r.phase*length+clock.current*r.speed*r.direction)%length+length)%length;
      const x=r.horizontal?originX+t:r.lane+.9*r.direction,z=r.horizontal?r.lane-.9*r.direction:originZ+t;
      parts.forEach((p,j)=>{
        const angle=(r.horizontal?Math.PI/2:0)+(r.direction<0?Math.PI:0);
        obj.position.set(x+p.at[0]*Math.cos(angle)+p.at[2]*Math.sin(angle),r.ambulance&&j===1?1.02:p.at[1],z-p.at[0]*Math.sin(angle)+p.at[2]*Math.cos(angle));
        obj.scale.set(...(p.emergency&&!r.ambulance?[0,0,0]:r.ambulance&&j===1?[1.18,1.05,1.9]:p.size));obj.rotation.set(0,angle,0);obj.updateMatrix();
        const index=i*parts.length+j;mesh.current.setMatrixAt(index,obj.matrix);mesh.current.setColorAt(index,color.set(p.color||(r.ambulance?'#f8fafc':r.color)));
      });
    });
    mesh.current.instanceMatrix.needsUpdate=true;if(mesh.current.instanceColor)mesh.current.instanceColor.needsUpdate=true;
    mesh.current.computeBoundingSphere();
  });
  return <instancedMesh ref={mesh} args={[null,null,routes.length*parts.length]} castShadow><boxGeometry/><meshStandardMaterial roughness={.55}/></instancedMesh>;
}
export default function CityWorld({world,activeId,onHospital,detail,paused}){
  const {controls,camera,size}=useThree();
  const [region,setRegion]=useState({x:0,z:0,radius:168}),last=useRef(''),elapsed=useRef(0);
  useFrame((_,delta)=>{
    elapsed.current+=delta;if(elapsed.current<.6)return;elapsed.current=0;
    const target=controls?.target||new THREE.Vector3(),grid=BLOCK*2;
    const next={x:Math.round(target.x/grid)*grid,z:Math.round(target.z/grid)*grid,
      radius:camera.zoom<1.4?0:Math.ceil(Math.min(294,Math.max(126,Math.hypot(size.width,size.height)/(2*camera.zoom)*1.25))/BLOCK)*BLOCK};
    const key=`${next.x}/${next.z}/${next.radius}`;if(key!==last.current){last.current=key;setRegion(next);}
  });
  const geometry=useMemo(()=>buildCityGeometry(world,detail,region),[world,detail,region]);
  const h=world.sites.find(h=>h.cnes===activeId)||world.sites[0];
  const pedestrianSites=useMemo(()=>world.sites.filter(site=>site.cnes===activeId||Math.hypot(site.x-region.x,site.z-region.z)<Math.min(region.radius,126)).sort((a,b)=>Math.hypot(a.x-region.x,a.z-region.z)-Math.hypot(b.x-region.x,b.z-region.z)).slice(0,14),[world,region,activeId]);
  return <group>
    <Box at={[world.center[0],-.2,world.center[2]]} size={[world.width+BLOCK,.3,world.depth+BLOCK]} color="#bad09b"/>
    <Instances items={geometry.streets}/><Instances items={geometry.buildings}/><Instances items={geometry.foliage} round/>
    <group onPointerOver={()=>{document.body.style.cursor='pointer';}} onPointerOut={()=>{document.body.style.cursor='';}}>
      <Instances items={geometry.hospitals} onPick={onHospital}/>
    </group>
    <Box at={[h.x,.37,h.z]} size={[34,.1,32]} color="#89b8e9"/>
    <Sign text={h.shortName} at={[h.x,Math.max(3,h.height*.6),h.z+10]} size={[12,1]} color="#2369b2"/>
    {pedestrianSites.map(site=><group key={site.cnes} position={[site.x,0,site.z+16.5]}>{Array.from({length:5},(_,i)=><group key={i} position={[(i%2)*.5,0,(i%3)*.5]}><Person walk walkDepth={2.4} paused={paused} phase={i*4+Number(site.cnes)%13} color={['#3a9fba','#d7a45c','#bc779b','#e8eef6','#659d75'][i]}/></group>)}</group>)}
    <HospitalLabels world={world} activeId={activeId} onHospital={onHospital}/>
    <CityCars world={world} paused={paused} activeSite={h}/>
  </group>;
}
