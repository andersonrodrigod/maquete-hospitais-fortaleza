import React,{useEffect,useLayoutEffect,useMemo,useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {Html} from '@react-three/drei';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {Box,Sign,Person} from './primitives';
import {buildingPose,localFloorLayout} from './building-animation';
import {FloorEnvelope,HospitalEntrance,HospitalRoof} from './hospital-envelope';
import Instances from './instances';
import {createBedVisuals} from './bed-visuals';

// Shared geometry keeps every bed and room in the scene, including large inventories.
const roundedGeometry=new RoundedBoxGeometry(1,1,1,1,.055);
function Blocks({items,onPick,soft=false}){
  const ref=useRef();
  useLayoutEffect(()=>{
    const obj=new THREE.Object3D(),color=new THREE.Color();
    items.forEach((item,i)=>{
      obj.position.set(...item.at);obj.scale.set(...item.size);obj.updateMatrix();
      ref.current.setMatrixAt(i,obj.matrix);ref.current.setColorAt(i,color.set(item.color));
    });
    ref.current.instanceMatrix.needsUpdate=true;
    if(ref.current.instanceColor)ref.current.instanceColor.needsUpdate=true;
    ref.current.computeBoundingSphere();
  },[items]);
  return <instancedMesh ref={ref} args={[null,null,items.length]} castShadow receiveShadow
    onClick={onPick?e=>{if(e.delta>4||e.instanceId===undefined)return;e.stopPropagation();onPick(items[e.instanceId].bedId);}:undefined}
    onPointerOver={onPick?()=>{document.body.style.cursor='pointer';}:undefined}
    onPointerOut={onPick?()=>{document.body.style.cursor='';}:undefined}>
    {soft?<primitive object={roundedGeometry} attach="geometry" dispose={null}/>:<boxGeometry args={[1,1,1]}/>}<meshStandardMaterial roughness={.72}/>
  </instancedMesh>;
}
function BedShadows({layout}){
  const mesh=useRef();
  const texture=useMemo(()=>{
    const c=document.createElement('canvas');c.width=c.height=64;
    const ctx=c.getContext('2d'),gradient=ctx.createRadialGradient(32,32,4,32,32,32);
    gradient.addColorStop(0,'rgba(39,63,74,0.42)');gradient.addColorStop(.55,'rgba(39,63,74,0.21)');gradient.addColorStop(1,'rgba(39,63,74,0)');
    ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);
  },[]);
  useEffect(()=>()=>texture.dispose(),[texture]);
  useLayoutEffect(()=>{
    const obj=new THREE.Object3D();
    layout.beds.forEach((b,i)=>{
      obj.position.set(b.x+.12,b.y+.245,b.z+.13);obj.rotation.set(-Math.PI/2,0,0);obj.scale.set(2.3,3.2,1);obj.updateMatrix();mesh.current.setMatrixAt(i,obj.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate=true;mesh.current.computeBoundingSphere();
  },[layout,texture]);
  return <instancedMesh ref={mesh} args={[null,null,layout.beds.length]}><planeGeometry/><meshBasicMaterial map={texture} transparent depthWrite={false} toneMapped={false}/></instancedMesh>;
}
function architecture(layout){
  const items=[];
  let levelY=0;
  const box=(at,size,color)=>items.push({at:[at[0],at[1]+levelY,at[2]],size,color});
  for(const w of layout.wings){
    levelY=w.y;
    // Open connecting galleries join the authored wings at their corridor ends.
    if(layout.wings.some(other=>other.y===w.y&&other.z===w.z&&Math.abs(other.x-w.x-38)<.01)){
      box([w.x+19,.07,w.z],[6.4,.25,4.1],'#c8e2d9');
      for(const side of [-1,1])box([w.x+19,.58,w.z+side*2.05],[6.2,.75,.12],'#d7e2eb');
    }
    if(layout.wings.some(other=>other.y===w.y&&other.x===w.x&&Math.abs(other.z-w.z-27)<.01)){
      box([w.x+18,.07,w.z+13.5],[3.2,.25,30],'#c8e2d9');
      box([w.x+16.9,.07,w.z],[2.4,.25,4.1],'#c8e2d9');
      box([w.x+16.9,.07,w.z+27],[2.4,.25,4.1],'#c8e2d9');
    }
    box([w.x,-.15,w.z],[32.5,.45,21.5],'#b6c5c8');
    box([w.x,.09,w.z],[32,.15,21],'#faf5e9');
    box([w.x,.19,w.z],[31.7,.04,4.1],'#c8e2d9');
    for(const side of [-1,1])box([w.x,.22,w.z+side*1.75],[31.5,.025,.09],'#f9faf0');
    // Low walls form a cutaway dollhouse: roofs never hide the beds.
    for(const side of [-1,1]){
      box([w.x,1.18,w.z+side*10.4],[32,2,.2],'#f6f6ee');
      box([w.x,2.21,w.z+side*10.4],[32,.08,.27],'#fffef6');
    }
    for(const side of [-1,1]){
      box([w.x-15.9,1.1,w.z+side*6.2],[.18,1.8,8],'#f4f2e6');
      box([w.x+10.4,1.1,w.z+side*6.2],[.18,1.8,8],'#f4f2e6');
    }
    // Nursing counter, computers, cabinets and waiting area.
    box([w.x+13,.22,w.z-5.8],[4.3,.05,7.6],'#d7eeeb');
    box([w.x+12.6,.75,w.z-3],[3.8,1.05,.65],'#30a5b1');
    box([w.x+12.6,1.3,w.z-3],[4,.1,.85],'#f9fbfd');
    box([w.x+14.2,.75,w.z-4.3],[.6,1.05,2],'#30a5b1');
    for(const dx of [11.6,13.2]){
      box([w.x+dx,1.61,w.z-3.2],[.65,.45,.08],'#284d63');
      box([w.x+dx,1.61,w.z-3.14],[.5,.025,.01],'#62dbbd');
      box([w.x+dx,1.43,w.z-3.17],[.56,.04,.3],'#c6d4df');
    }
    box([w.x+13,1,w.z-9.6],[4,1.7,.6],'#f4ead5');
    for(const dx of [11.6,12.5,13.4,14.3])box([w.x+dx,1.2,w.z-9.26],[.055,.65,.025],'#a7b4b2');
    box([w.x+13,.22,w.z+5.8],[4.3,.05,7.6],'#f4e6cc');
    for(const z of [3.6,5.2,6.8]){
      box([w.x+14,.63,w.z+z],[1.5,.25,.65],'#dfbc86');
      box([w.x+14.65,.95,w.z+z],[.15,.75,.65],'#dfbc86');
      for(const dx of [13.5,14.4])box([w.x+dx,.37,w.z+z],[.08,.4,.55],'#8fa2a6');
    }
    box([w.x+12,.5,w.z+8.7],[.7,.6,.7],'#e6d6c5');
    box([w.x+11.7,.64,w.z+4.8],[.85,.1,1.4],'#f2ddb6');
    box([w.x+11.7,.4,w.z+4.8],[.1,.5,.1],'#8da6a7');
    box([w.x+11.9,.73,w.z+4.8],[.25,.035,.4],'#68aed2');
    // Unused positions become support areas, never extra beds or fake capacity.
    for(let i=Math.ceil(w.count/4);i<8;i++){
      const side=i<4?-1:1,x=w.x-12+(i%4)*6.4,z=w.z+side*6.2;
      box([x,.2,z],[6.15,.04,7.8],'#e7ecdf');
      box([x-3.15,1.05,z],[.16,1.7,8],'#eeeee5');
      for(const dx of [-2,2])box([x+dx,1,z-side*4],[2.25,1.6,.16],'#f5f6ef');
      box([x,.8,z+side*3.3],[4.8,1.15,.65],'#dbc9a5');
      box([x,1.41,z+side*3.3],[4.95,.07,.75],'#fbf6e7');
      for(const dx of [-1.8,-.6,.6,1.8]){
        box([x+dx,1.65,z+side*3.3],[.65,.35,.45],dx<0?'#aed4d5':'#e4c4a2');
        box([x+dx,.83,z+side*2.95],[.04,.5,.02],'#929b95');
      }
      box([x,.87,z-side*.5],[3,.1,1.5],'#f6e6c5');
      for(const dx of [-1,1])box([x+dx,.49,z-side*.5],[.1,.7,.9],'#b4c5c3');
      box([x,1.14,z-side*.5],[.85,.48,.08],'#437488');
      box([x,.55,z+side*.7],[.85,.25,.75],'#63b2b4');
    }
  }
  for(const r of layout.rooms){
    levelY=r.y;
    const color=layout.wings.find(w=>w.id===r.wingId).complementary?'#e8e1f0':'#f3ead7';
    box([r.x,.2,r.z],[6.15,.04,7.8],color);
    box([r.x-3.15,1.05,r.z],[.16,1.7,8],'#eeeee5');
    box([r.x-3.15,1.94,r.z],[.23,.08,8],'#fffdf5');
    // Leave a central door opening facing the corridor.
    for(const dx of [-2,2]){
      box([r.x+dx,1,r.z-r.side*4],[2.25,1.6,.16],'#f5f6ef');
      box([r.x+dx,1.85,r.z-r.side*4],[2.25,.1,.25],'#fffef5');
      box([r.x+dx,.92,r.z-r.side*4.11],[2.15,.055,.055],'#d8b575');
      box([r.x+dx,1.4,r.z-r.side*4.11],[.45,.32,.025],'#63b3c4');
    }
    box([r.x,.23,r.z-r.side*4],[1.65,.03,.55],'#68bdbe');
    // Door slides beside its opening; no geometry blocks the corridor.
    box([r.x+.9,1.03,r.z-r.side*3.92],[.85,1.65,.09],'#56aeb2');
    box([r.x+.9,1.37,r.z-r.side*3.85],[.48,.56,.025],'#c5e9e8');
    box([r.x+1.16,1,r.z-r.side*3.82],[.04,.18,.035],'#e8ce86');
    box([r.x,1.46,r.z+r.side*3.97],[4.7,.85,.03],'#6dbcd6');
    for(const dx of [-2.35,0,2.35])box([r.x+dx,1.46,r.z+r.side*3.93],[.055,.92,.045],'#f6f8ed');
    box([r.x+2.65,.65,r.z-r.side*2.9],[.55,.85,.8],'#bdcfdb');
    box([r.x+2.65,1.1,r.z-r.side*2.9],[.6,.08,.85],'#fff');
  }
  return items;
}
function Walker({wing,phase,paused}){
  const group=useRef(),elapsed=useRef(phase);
  useFrame((_,delta)=>{
    if(!paused)elapsed.current+=Math.min(delta,.05)*.75;
    const t=elapsed.current%48,forward=t<24;
    group.current.position.set(wing.x+(forward?-13+t:35-t),wing.y+.21,wing.z+(phase%2?-.95:.95));
    group.current.rotation.y=forward?Math.PI/2:-Math.PI/2;
  });
  return <group ref={group}><Person paused={paused} stride color={phase%2?'#6cacae':'#f5fafc'}/></group>;
}
function FloorMarker({floor,onFloor}){
  const {gl}=useThree(),portal=useMemo(()=>({current:gl.domElement.parentElement}),[gl]);
  return <Html portal={portal} position={[88,floor.y+2,16]} center zIndexRange={[7,0]}>
    <button className="floor-marker" onClick={()=>onFloor(floor.id)}><span>Andar {floor.number}<small>ILUSTRATIVO</small></span><b>{floor.count}<small>leitos 3D</small></b></button>
  </Html>;
}
function FloorContents({layout,bedId,onBed,paused,wingId,onWing,onFloor,showMarkers}){
  const chosen=layout.beds.find(b=>b.id===bedId);
  const blocks=useMemo(()=>architecture(layout),[layout]);
  const {frames:beds,patients,heads}=useMemo(()=>createBedVisuals(layout.beds),[layout]);
  const plants=useMemo(()=>layout.wings.flatMap(w=>[[12,8.7],[11,-8.3],[-15,0]].flatMap(([x,z])=>[
    {at:[w.x+x,w.y+1.14,w.z+z],size:[.34,.6,.31],color:'#579d40'},
    {at:[w.x+x-.24,w.y+1.02,w.z+z+.12],size:[.23,.41,.24],color:'#8abb45'},
    {at:[w.x+x+.22,w.y+1.22,w.z+z-.1],size:[.23,.45,.22],color:'#6aab3d'},
  ])),[layout]);
  return <group>
    <Blocks items={blocks}/><BedShadows layout={layout}/><Blocks items={beds} onPick={onBed} soft/>
    {patients.length>0&&<Blocks items={patients} soft/>}
    {heads.length>0&&<Instances items={heads} round onPick={onBed}/>}
    <Instances items={plants} round/>
    {layout.wings.map(w=><group key={w.id}>
      {showMarkers&&<group onClick={e=>{if(e.delta>4)return;e.stopPropagation();onWing(w.id);}}>
        <Sign text={`${w.label} · ALA ${w.number} · ${w.count}`} at={[w.x,w.y+.24,w.z+11.3]} size={[27,1.2]} rotation={[-Math.PI/2,0,0]} color={w.complementary?'#8875a3':'#527d9b'}/>
      </group>}
      <Walker wing={w} phase={1} paused={paused}/><Walker wing={w} phase={22} paused={paused}/>
      <group position={[w.x+12.7,w.y+.23,w.z-5.2]}><Person paused={paused} color="#73aeb0" rotation={Math.PI}/></group>
      <group position={[w.x+13.5,w.y+.23,w.z+4.5]}><Person paused={paused} color="#c9a78b" rotation={-Math.PI/2}/></group>
      {w.id===wingId&&<>
        <Sign text="POSTO DE ENFERMAGEM" at={[w.x+13,w.y+.25,w.z-7.6]} size={[4,.45]} rotation={[-Math.PI/2,0,0]}/>
        <Sign text="ESPERA" at={[w.x+12.5,w.y+.25,w.z+6.5]} size={[2.8,.5]} rotation={[-Math.PI/2,0,0]}/>
        {layout.rooms.filter(r=>r.wingId===w.id).map(r=><Sign key={r.id} text={`${r.label} · ${r.count}`} at={[r.x,r.y+.25,r.z-r.side*3.35]} size={[3,.43]} rotation={[-Math.PI/2,0,0]}/>)}
      </>}
    </group>)}
    {layout.floors.map(f=><group key={f.id}>
      <Box at={[0,f.y-.65,0]} size={[78,.55,52]} color="#cad8e5"/>
      {showMarkers&&<Sign text={`ANDAR ILUSTRATIVO ${f.number} · ${f.count} LEITOS`} at={[0,f.y+.3,28]} size={[65,2.5]} rotation={[-Math.PI/2,0,0]} color="#3569e8"/>}
      {showMarkers&&<FloorMarker floor={f} onFloor={onFloor}/>}
    </group>)}
    {chosen&&<>
      <Box at={[chosen.x,chosen.y+.24,chosen.z]} size={[1.9,.04,2.8]} color="#82a9f3"/>
      <Sign text={`LEITO ${chosen.sequence}`} at={[chosen.x,chosen.y+.27,chosen.z+1.4]} size={[1.8,.27]} rotation={[-Math.PI/2,0,0]}/>
    </>}
  </group>;
}

function AnimatedFloor({layout,floor,motion,assembly,...props}){
  const group=useRef();
  const local=useMemo(()=>localFloorLayout(layout,floor),[layout,floor]);
  const count=Math.max(...layout.floors.map(f=>f.number));
  useFrame(()=>{group.current.position.y=buildingPose(motion.current.progress,floor.number-1,count).floorY;});
  return <group ref={group} position={[0,assembly.mode==='open'?floor.y:(floor.number-1)*4.2,0]}>
    <FloorContents {...props} layout={local} showMarkers={assembly.mode==='open'}/>
    <FloorEnvelope motion={motion}/>
  </group>;
}
export default function BedMap({layout,motion,assembly,hospitalName,...props}){
  return <group>
    {layout.floors.map(floor=><AnimatedFloor key={floor.id} {...props} layout={layout} floor={floor} motion={motion} assembly={assembly}/>)}
    {layout.floors.length>0&&<>
      <HospitalRoof motion={motion} floorCount={Math.max(...layout.floors.map(f=>f.number))} name={hospitalName}/>
      <HospitalEntrance motion={motion} name={hospitalName}/>
    </>}
  </group>;
}
