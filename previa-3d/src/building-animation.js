export const BUILDING_ANIMATION_SECONDS=7.2;
export const CLOSED_FLOOR_HEIGHT=4.2;
export const OPEN_FLOOR_HEIGHT=40;
const clamp=value=>Math.max(0,Math.min(1,value));
export const smooth=value=>{const t=clamp(value);return t*t*(3-2*t);};

// One reversible timeline drives the envelope, roof, floors and camera.
export function buildingPose(progress,floorIndex=0,floorCount=1){
  const p=clamp(progress),delay=floorCount>1?floorIndex/(floorCount-1)*.07:0;
  const spread=smooth((p-.28-delay)/(.68-delay));
  return {
    floorY:floorIndex*(CLOSED_FLOOR_HEIGHT+(OPEN_FLOOR_HEIGHT-CLOSED_FLOOR_HEIGHT)*spread),
    panelSlide:12*smooth((p-.08)/.28),
    panelTilt:.26*smooth((p-.08)/.28),
    panelOpacity:1-smooth((p-.25)/.25),
    roofLift:22*smooth((p-.04)/.28),
    roofOpacity:1-smooth((p-.27)/.2),
    cameraBlend:smooth((p-.12)/.86),
  };
}

export function localFloorLayout(layout,floor){
  const wings=layout.wings.filter(w=>w.illustrativeFloorId===floor.id).map(w=>({...w,y:0}));
  const rooms=layout.rooms.filter(r=>r.illustrativeFloorId===floor.id).map(r=>({...r,y:0}));
  const beds=layout.beds.filter(b=>b.illustrativeFloorId===floor.id).map(b=>({...b,y:0}));
  return {wings,rooms,beds,floors:[{...floor,y:0}]};
}
