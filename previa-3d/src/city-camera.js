import {Vector3} from 'three';

export function cityCameraOffset(world){
  // Orthographic zoom controls apparent size. Distance must still keep the
  // complete city in front of the near plane when the user zooms out or rotates.
  const distance=Math.max(160,Math.hypot(world.width,world.depth)*2);
  return new Vector3(27,38,40).normalize().multiplyScalar(distance);
}
