import React,{useLayoutEffect,useRef} from 'react';
import * as THREE from 'three';

// Hundreds of details share a draw call instead of creating a mesh per leaf/window.
export default function Instances({items,round=false,onPick}){
  const mesh=useRef();
  useLayoutEffect(()=>{
    const obj=new THREE.Object3D(),color=new THREE.Color();
    items.forEach((item,i)=>{
      obj.position.set(...item.at);obj.scale.set(...item.size);
      obj.rotation.set(...(item.rotation||[0,0,0]));obj.updateMatrix();
      mesh.current.setMatrixAt(i,obj.matrix);mesh.current.setColorAt(i,color.set(item.color));
    });
    mesh.current.instanceMatrix.needsUpdate=true;
    if(mesh.current.instanceColor)mesh.current.instanceColor.needsUpdate=true;
    mesh.current.computeBoundingSphere();
  },[items]);
  return <instancedMesh ref={mesh} args={[null,null,items.length]} castShadow receiveShadow
    onClick={onPick?e=>{if(e.delta>4||e.instanceId===undefined)return;e.stopPropagation();onPick(items[e.instanceId].pickId??items[e.instanceId].bedId);}:undefined}>
    {round?<sphereGeometry args={[1,10,8]}/>:<boxGeometry/>}
    <meshStandardMaterial roughness={round?.86:.65}/>
  </instancedMesh>;
}
