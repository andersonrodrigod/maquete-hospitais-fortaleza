import React,{useEffect,useMemo,useRef} from 'react';
import {Canvas,useFrame,useThree} from '@react-three/fiber';
import {OrbitControls} from '@react-three/drei';
import * as THREE from 'three';
import BedMap from './bed-map';
import BuildingMotion from './building-motion';
import {buildingPose,CLOSED_FLOOR_HEIGHT} from './building-animation';
import CityWorld from './city-world';
import {cityCameraOffset} from './city-camera';
function closedCamera(layout,size){
  const height=Math.max(1,...layout.floors.map(f=>f.number))*CLOSED_FLOOR_HEIGHT;
  const target=new THREE.Vector3(0,height/2+20,1);
  return {target,position:target.clone().add(new THREE.Vector3(85,65,100)),zoom:Math.min(size.width/128,Math.max(180,size.height-300)/(85+height*.6))};
}
function openedCamera(layout,size){
  const zoom=Math.min(size.width/Math.max(30,layout.horizontal*1.65),Math.max(180,size.height-360)/layout.overviewHeight);
  const target=new THREE.Vector3(...layout.center),offset=new THREE.Vector3(24,14,32).multiplyScalar(Math.max(1,layout.span/35));
  const screenUp=new THREE.Vector3(0,1,0).addScaledVector(offset,-offset.y/offset.lengthSq()).normalize();
  target.addScaledVector(screenUp,105/zoom);
  return {target,position:target.clone().add(offset),zoom};
}
function CameraControls({command,onReady,inside,onCameraStart,assembly,motion,layout,world,cityDirectory,citySelected}) {
  const controls=useRef(), goal=useRef(null), {camera,size}=useThree();
  const transforming=inside&&(assembly.mode==='opening'||assembly.mode==='closing');
  useEffect(()=>{
    const c=controls.current;if(!c)return;
    if(inside){
      if(transforming){goal.current=null;return;}
      if(command.action==='in'||command.action==='out'){
        goal.current={position:camera.position.clone(),target:c.target.clone(),zoom:THREE.MathUtils.clamp(camera.zoom*(command.action==='in'?1.25:.8),.08,120)};return;
      }
      if(command.action==='rotate'){
        goal.current={position:camera.position.clone().sub(c.target).applyAxisAngle(new THREE.Vector3(0,1,0),Math.PI/4).add(c.target),target:c.target.clone(),zoom:camera.zoom};return;
      }
      if(assembly.mode==='closed'){goal.current=closedCamera(layout,size);return;}
      const p=command.point||[0,.65,0],target=p.length===3?new THREE.Vector3(...p):new THREE.Vector3(p[0],.65,p[1]);
      const span=command.span||44;
      const offset=(command.action==='top'?new THREE.Vector3(.01,45,.01):command.overview?new THREE.Vector3(24,14,32):new THREE.Vector3(18,26,24)).multiplyScalar(Math.max(1,span/35));
      const zoom=command.overview?Math.min(size.width/Math.max(30,command.horizontal*1.65),Math.max(180,size.height-360)/command.overviewHeight):Math.min(size.width/span,size.height/(span*.75));
      const screenUp=new THREE.Vector3(0,1,0).addScaledVector(offset,-offset.y/offset.lengthSq()).normalize();
      target.addScaledVector(screenUp,(command.overview?105:70)/zoom);
      goal.current={target,position:target.clone().add(offset),zoom};
      return;
    }
    const zoom=command.action==='in'?camera.zoom*1.25:command.action==='out'?camera.zoom/1.25:null;
    if(zoom){goal.current={position:camera.position.clone(),target:c.target.clone(),zoom:THREE.MathUtils.clamp(zoom,.12,95)};return;}
    if(command.action==='rotate'){
      const position=camera.position.clone().sub(c.target).applyAxisAngle(new THREE.Vector3(0,1,0),Math.PI/4).add(c.target);
      goal.current={position,target:c.target.clone(),zoom:camera.zoom};return;
    }
    const all=command.action==='all-city',sidebar=cityDirectory&&size.width>650?290:0;
    const card=citySelected&&size.width>650?300:0;
    const target=new THREE.Vector3(...(all?world.center:command.point||[0,3,0]));
    const offset=cityCameraOffset(world);
    const right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),offset).normalize();
    const up=new THREE.Vector3(0,1,0).addScaledVector(offset,-offset.y/offset.lengthSq()).normalize();
    const spanX=all?Math.abs(right.x)*world.width+Math.abs(right.z)*world.depth:command.action==='hospital'?76:128;
    const spanY=all?Math.abs(up.x)*world.width+Math.abs(up.z)*world.depth+18:command.action==='hospital'?65:105;
    const cityZoom=Math.max(.12,Math.min((size.width-sidebar-card-70)/spanX,Math.max(180,size.height-230)/spanY));
    target.addScaledVector(right,(card-sidebar)/(2*cityZoom));target.addScaledVector(up,(citySelected&&size.width<=650?-25:35)/cityZoom);
    goal.current={position:target.clone().add(offset),target,zoom:cityZoom};
  },[command,camera,size.width,size.height,inside,assembly.mode,assembly.serial,transforming,layout,world,cityDirectory,citySelected]);
  useFrame((_,delta)=>{
    if(transforming&&controls.current){
      const closed=closedCamera(layout,size),opened=openedCamera(layout,size);
      const blend=buildingPose(motion.current.progress).cameraBlend;
      camera.position.lerpVectors(closed.position,opened.position,blend);
      controls.current.target.lerpVectors(closed.target,opened.target,blend);
      camera.zoom=THREE.MathUtils.lerp(closed.zoom,opened.zoom,blend);
      camera.updateProjectionMatrix();controls.current.update();return;
    }
    const g=goal.current,c=controls.current;if(!g||!c)return;
    const factor=1-Math.exp(-Math.min(delta,.05)*7);
    camera.position.lerp(g.position,factor);c.target.lerp(g.target,factor);
    camera.zoom=THREE.MathUtils.lerp(camera.zoom,g.zoom,factor);camera.updateProjectionMatrix();c.update();
    if(camera.position.distanceTo(g.position)<.01&&Math.abs(camera.zoom-g.zoom)<.01)goal.current=null;
  });
  useEffect(()=>{onReady();},[onReady]);
  return <OrbitControls ref={controls} makeDefault enabled={!transforming} target={[0,0,2]} onStart={()=>{goal.current=null;onCameraStart?.();}}
    mouseButtons={{LEFT:THREE.MOUSE.PAN,MIDDLE:THREE.MOUSE.DOLLY,RIGHT:THREE.MOUSE.ROTATE}}
    enablePan screenSpacePanning={inside} enableDamping dampingFactor={.08} minZoom={inside?.08:.12} maxZoom={120}
    minPolarAngle={inside?.001:.2} maxPolarAngle={Math.PI/2.15}
    touches={{ONE:THREE.TOUCH.ROTATE,TWO:THREE.TOUCH.DOLLY_PAN}}/>;
}

function CitySun({inside,layout}){
  const light=useRef(),{controls}=useThree(),sunTarget=useMemo(()=>new THREE.Object3D(),[]);
  useFrame(()=>{
    const target=inside?new THREE.Vector3(0,layout.center[1],0):controls?.target||new THREE.Vector3();
    sunTarget.position.copy(target);sunTarget.updateMatrixWorld();
    light.current.position.set(target.x-50,target.y+120,target.z+80);
  });
  return <><primitive object={sunTarget}/><directionalLight ref={light} target={sunTarget} position={[-50,120,80]} intensity={2.1} color="#fff4dc" castShadow shadow-mapSize={[2048,2048]}
    shadow-camera-left={-70} shadow-camera-right={70} shadow-camera-top={70} shadow-camera-bottom={-70}
    shadow-camera-far={400} shadow-bias={-.0004} shadow-normalBias={.03}/></>;
}
export default function City({paused,inside,detail,command,onReady,layout,bedId,onBed,wingId,onWing,onFloor,onCameraStart,assembly,onAssemblyComplete,onAssemblyStage,hospitalName,world,hospitalId,onHospital,cityDirectory,citySelected}) {
  const motion=useRef({progress:1});
  return <Canvas orthographic camera={{position:[27,32,42],zoom:12,near:.1,far:5000}} shadows={THREE.PCFShadowMap} dpr={[1,1.6]}
    onContextMenu={e=>e.preventDefault()}
    gl={{antialias:true,alpha:false,powerPreference:'high-performance'}}
    fallback={<div className="webgl-error">Esta prévia precisa de WebGL. Ative a aceleração gráfica do navegador para explorar a maquete.</div>}>
    <color attach="background" args={['#eaf5ff']}/>
    <BuildingMotion motion={motion} assembly={assembly} inside={inside} paused={paused} onComplete={onAssemblyComplete} onStage={onAssemblyStage}/>
    <ambientLight intensity={.45}/>
    <hemisphereLight args={['#ecf8ff','#b2b9a2',1.05]}/>
    <CitySun inside={inside} layout={layout}/>
    {inside?<BedMap layout={layout} bedId={bedId} onBed={onBed} paused={paused} wingId={wingId} onWing={onWing} onFloor={onFloor} motion={motion} assembly={assembly} hospitalName={hospitalName}/>:<>
      <CityWorld world={world} activeId={hospitalId} onHospital={onHospital} paused={paused} detail={detail}/>
    </>}
    <CameraControls command={command} onReady={onReady} inside={inside} onCameraStart={onCameraStart} assembly={assembly} motion={motion} layout={layout} world={world} cityDirectory={cityDirectory} citySelected={citySelected}/>
  </Canvas>;
}
