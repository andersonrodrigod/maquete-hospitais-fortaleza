// Authored architecture: these floors/rooms are illustrative, never physical locations.
export function createBedLayout(hospital,typeId=null,floorId=null){
  const wings=[],rooms=[],beds=[];
  for(const type of hospital.types.filter(t=>t.count>0)){
    for(let first=0;first<type.count;first+=32){
      const number=Math.floor(first/32)+1,id=`${type.id}-wing-${number}`;
      wings.push({id,typeId:type.id,label:type.label,number,count:Math.min(32,type.count-first),
        first,sourceCount:type.count,occupied:type.occupied,complementary:type.complementary,width:32,depth:21});
    }
  }
  wings.forEach((wing,index)=>{
    const level=Math.floor(index/4),slot=index%4;
    wing.illustrativeFloorId=`floor-${level+1}`;
    wing.floorNumber=level+1;
    // The enlarged vertical spacing is an exploded view, not a building measurement.
    wing.y=level*40;
    wing.x=(slot%2-.5)*38;
    wing.z=(Math.floor(slot/2)-.5)*27;
    for(let i=0;i<Math.ceil(wing.count/4);i++){
      const side=i<4?-1:1,column=i%4;
      const room={id:`${wing.id}-room-${i+1}`,wingId:wing.id,typeId:wing.typeId,
        illustrativeFloorId:wing.illustrativeFloorId,number:i+1,
        label:`Quarto ${String(i+1).padStart(2,'0')}`,illustrative:true,
        x:wing.x-12+column*6.4,y:wing.y,z:wing.z+side*6.2,
        width:6.4,depth:8,side,count:Math.min(4,wing.count-i*4)};
      rooms.push(room);
      for(let j=0;j<room.count;j++){
        const sequence=wing.first+i*4+j+1;
        beds.push({id:`${wing.typeId}:${sequence}`,typeId:wing.typeId,typeLabel:wing.label,
          sequence,count:wing.sourceCount,illustrativeRoomId:room.id,illustrativeWingId:wing.id,
          illustrativeFloorId:wing.illustrativeFloorId,
          status:Number.isInteger(wing.occupied)?(sequence<=wing.occupied?'occupied':'free'):'unknown',
          x:room.x+(j%2===0?-1.6:1.6),y:room.y,z:room.z+(Math.floor(j/2)===0?-1.85:1.85)});
      }
    }
  });
  const visibleWings=wings.filter(w=>(typeId===null||w.typeId===typeId)&&(floorId===null||w.illustrativeFloorId===floorId));
  const wingIds=new Set(visibleWings.map(w=>w.id));
  const visibleRooms=rooms.filter(r=>wingIds.has(r.wingId)),visibleBeds=beds.filter(b=>wingIds.has(b.illustrativeWingId));
  const floors=[];
  for(const w of visibleWings){
    let f=floors.find(f=>f.id===w.illustrativeFloorId);
    if(!f){f={id:w.illustrativeFloorId,number:w.floorNumber,y:w.y,count:0,illustrative:true};floors.push(f);}
    f.count+=w.count;
  }
  const minX=Math.min(0,...visibleWings.map(w=>w.x-17)),maxX=Math.max(0,...visibleWings.map(w=>w.x+21));
  const minZ=Math.min(0,...visibleWings.map(w=>w.z-11)),maxZ=Math.max(0,...visibleWings.map(w=>w.z+15));
  const minY=Math.min(...visibleWings.map(w=>w.y)),maxY=Math.max(...visibleWings.map(w=>w.y+3));
  const horizontal=Math.hypot(maxX-minX,maxZ-minZ);
  const height=visibleWings.length?maxY-minY:0;
  return {wings:visibleWings,rooms:visibleRooms,beds:visibleBeds,floors,total:beds.length,
    center:[(minX+maxX)/2,visibleWings.length?(minY+maxY)/2:0,(minZ+maxZ)/2],
    overviewHeight:height*.95+horizontal*.38+20,horizontal,
    span:Math.max(24,horizontal*1.24,(height*.76+horizontal*.7)/.75*1.12)};
}
