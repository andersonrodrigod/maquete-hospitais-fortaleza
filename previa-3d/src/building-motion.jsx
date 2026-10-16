import {useLayoutEffect,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {BUILDING_ANIMATION_SECONDS} from './building-animation';

export default function BuildingMotion({motion,assembly,inside,paused,onComplete,onStage}){
  const elapsed=useRef(0),done=useRef(false),lastStage=useRef(-1);
  useLayoutEffect(()=>{
    elapsed.current=0;done.current=false;lastStage.current=-1;
    motion.current.progress=assembly.mode==='opening'||assembly.mode==='closed'?0:1;
  },[assembly.mode,assembly.serial,motion]);
  useFrame((_,delta)=>{
    const moving=inside&&(assembly.mode==='opening'||assembly.mode==='closing');
    if(!moving||done.current)return;
    if(!paused)elapsed.current+=Math.min(delta,.1);
    const t=Math.min(1,elapsed.current/BUILDING_ANIMATION_SECONDS);
    motion.current.progress=assembly.mode==='opening'?t:1-t;
    const stage=t<.13?0:t<.4?1:2;
    if(stage!==lastStage.current){lastStage.current=stage;onStage(stage);}
    if(t===1){done.current=true;onComplete(assembly.mode);}
  },-2);
  return null;
}
