// The rendering and tests use the same list: one head/person per occupied slot.
export function createBedVisuals(beds){
  const frames=[],patients=[],heads=[];
  for(const b of beds){
    const status=b.status==='free'?'#18ac91':b.status==='occupied'?'#397fe8':'#9baebe';
    const linen=b.status==='unknown'?'#b4c6d5':'#4c9eeb';
    const box=(offset,size,color)=>frames.push({bedId:b.id,at:[b.x+offset[0],b.y+offset[1],b.z+offset[2]],size,color});
    box([0,.55,0],[1.18,.16,2.12],'#92a6b4');
    box([0,.76,0],[1.1,.23,2.05],'#fffdf4');
    box([0,.91,.38],[1.06,.07,1.18],linen);
    box([0,.96,.86],[1.04,.035,.12],b.status==='unknown'?'#dce6ec':'#b1ddfb');
    box([0,.94,-.7],[.84,.13,.38],'#fffef9');
    for(const z of [-1.1,1.1]){
      box([0,.72,z],[1.24,.66,.09],'#f4f6ee');
      box([0,.83,z+(z>0?.055:-.055)],[.81,.27,.035],z>0?status:'#68b1be');
    }
    for(const x of [-.62,.62]){
      box([x,1.04,.2],[.05,.055,1.1],'#e9f0f1');
      for(const z of [-.32,.7])box([x,.89,z],[.045,.3,.045],'#d3dde0');
      for(const z of [-.78,.78])box([x*.8,.24,z],[.18,.25,.18],'#526575');
    }
    // Individual bedside cabinet, monitor and drip stand.
    box([.99,.66,-.73],[.5,.89,.59],'#e3c79b');
    box([.99,1.13,-.73],[.55,.06,.64],'#fff8e8');
    for(const y of [.53,.87])box([.99,y,-.42],[.2,.035,.03],'#9a987f');
    box([.99,1.37,-.81],[.04,.45,.04],'#839eaa');
    box([.99,1.61,-.81],[.47,.36,.09],'#ecf3ed');
    box([.99,1.61,-.75],[.38,.26,.025],'#284d63');
    box([.99,1.62,-.731],[.27,.018,.008],b.status==='occupied'?'#59e4af':'#90b8c1');
    box([-.84,1.08,-.8],[.033,1.7,.033],'#8ca7af');
    box([-.84,1.91,-.8],[.38,.035,.035],'#8ca7af');
    box([-.98,1.71,-.8],[.16,.28,.08],'#d3f1ef');
    box([-.84,.25,-.8],[.5,.04,.06],'#8ca7af');
    if(b.status!=='occupied')continue;
    const skin=['#d8a57d','#b97a57','#edc19b','#8e5d45'][b.sequence%4];
    heads.push({bedId:b.id,role:'head',at:[b.x,b.y+1.12,b.z-.65],size:[.15,.135,.18],color:skin},
      {bedId:b.id,role:'hair',at:[b.x,b.y+1.12,b.z-.78],size:[.153,.13,.095],color:'#574336'});
    patients.push({bedId:b.id,at:[b.x,b.y+1.04,b.z-.17],size:[.47,.19,.58],color:'#e9f4f8'},
      {bedId:b.id,at:[b.x,b.y+1.02,b.z+.44],size:[.62,.16,.8],color:linen});
    for(const x of [-.3,.3])patients.push({bedId:b.id,at:[b.x+x,b.y+1.03,b.z-.1],size:[.1,.1,.48],color:skin});
  }
  return {frames,patients,heads};
}
