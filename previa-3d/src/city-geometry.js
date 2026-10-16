import {BLOCK} from './city-layout.js';

export function buildCityGeometry(world,detail=true,region=null){
  const streets=[],buildings=[],foliage=[],hospitals=[],parks=[];
  const add=(items,at,size,color,pickId)=>items.push({at,size,color,...(pickId?{pickId}:{})});
  const house=(items,x,z,width,depth,height,color,id,ornaments=true)=>{
    const box=(at,size,c)=>add(items,[x+at[0],at[1],z+at[2]],size,c,id);
    box([0,height/2+.18,0],[width,height,depth],color);
    box([0,.25,0],[width+.35,.3,depth+.35],'#eee4cd');
    box([0,height+.25,0],[width+.3,.18,depth+.3],'#fcf9ed');
    box([0,height+.37,0],[width-.3,.07,depth-.3],'#becbcf');
    if(!ornaments)return;
    box([0,height+.65,-depth*.15],[width*.23,.5,depth*.2],'#e3e9e9');
    box([0,height+.93,-depth*.15],[width*.16,.035,depth*.13],'#7b929e');
    const floors=Math.max(1,Math.floor(height/1.3)),cols=Math.max(2,Math.floor(width/1.4));
    for(let j=0;j<floors;j++)for(let i=0;i<cols;i++){
      const px=(i-(cols-1)/2)*1.3,y=.95+j*1.3;
      for(const s of [-1,1]){
        box([px,y,s*(depth/2+.04)],[.9,.82,.06],'#fff9ed');
        box([px,y,s*(depth/2+.08)],[.69,.64,.04],(i+j)%3?'#4e9dc4':'#7ac4d9');
        box([px,y-.41,s*(depth/2+.13)],[.95,.045,.18],'#eee1c5');
      }
    }
    for(let j=0;j<floors;j++)for(const s of [-1,1]){
      box([s*(width/2+.04),.95+j*1.3,0],[.05,.8,depth*.65],'#f7f3e6');
      box([s*(width/2+.08),.95+j*1.3,0],[.04,.62,depth*.56],'#5aa8cb');
    }
  };
  const tree=(x,z,size=1,pink=false)=>{
    add(buildings,[x,.9*size,z],[.16*size,1.8*size,.16*size],'#916b4a');
    for(let i=0;i<10;i++){
      const a=i*2.39996,r=(i<7?.44:.2)*size;
      add(foliage,[x+Math.cos(a)*r,(1.75+(i%4)*.19)*size,z+Math.sin(a)*r],
        [.4*size,.48*size,.4*size],pink?['#e68db0','#f3a8c4','#f6bdd0'][i%3]:['#62a13c','#8ebc49','#4c8c39','#a0c753'][i%4]);
    }
  };
  const flower=(x,z,length=4)=>{
    add(buildings,[x,.21,z],[length,.25,.75],'#f0dfba');
    add(buildings,[x,.38,z],[length-.15,.1,.6],'#649643');
    for(let i=0;i<Math.ceil(length*2);i++)add(foliage,[x-length/2+.3+i*.48,.62,z+(i%2?-.15:.15)],[.2,.15,.2],['#f38fb5','#f4c956','#bb8bd1'][i%3]);
  };
  const bench=(x,z)=>{
    add(buildings,[x,.65,z],[2.3,.15,.65],'#c49d61');
    add(buildings,[x,.97,z-.32],[2.3,.65,.1],'#c49d61');
    for(const s of [-1,1])add(buildings,[x+s*.8,.35,z],[.08,.6,.7],'#627d7b');
  };
  const roadXs=world.cols.slice(0,-1).map(x=>x+BLOCK/2),roadZs=world.rows.slice(0,-1).map(z=>z+BLOCK/2);
  for(const x of roadXs){
    add(streets,[x,.015,world.center[2]],[5.4,.08,world.depth+BLOCK],'#778592');
    for(const s of [-1,1])add(streets,[x+s*3.45,.08,world.center[2]],[1.5,.19,world.depth+BLOCK],'#eee4cc');
    for(let z=world.minZ-16;z<world.maxZ+20;z+=6)add(streets,[x,.062,z],[.08,.012,2.4],'#ffe3a1');
  }
  for(const z of roadZs){
    add(streets,[world.center[0],.018,z],[world.width+BLOCK,.08,5.4],'#778592');
    for(const s of [-1,1])add(streets,[world.center[0],.08,z+s*3.45],[world.width+BLOCK,.19,1.5],'#eee4cc');
    for(let x=world.minX-16;x<world.maxX+20;x+=6)add(streets,[x,.065,z],[2.4,.012,.08],'#ffe3a1');
  }
  const sites=new Map(world.sites.map(h=>[`${h.x}/${h.z}`,h]));
  for(const x of world.cols)for(const z of world.rows){
    const h=sites.get(`${x}/${z}`),seed=Math.abs(Math.round(x*13+z*7));
    const near=!region||Math.hypot(x-region.x,z-region.z)<region.radius;
    if(h){
      const box=(at,size,color)=>add(hospitals,[x+at[0],at[1],z+at[2]],size,color,h.cnes);
      box([0,.13,0],[33,.25,31],'#d5dcd6');
      box([0,.29,0],[32,.12,30],'#f0e8d7');
      const c=['#f1e3c7','#eee9db','#e6d5b7','#f2d8bc','#e0e8dc'][h.variant];
      if(h.variant===0||h.cnes==='2497654'){
        house(hospitals,x,z-4,22,8,h.height,c,h.cnes,near);
        for(const s of [-1,1])house(hospitals,x+s*10,z+4,6,10,Math.max(3,h.height*.55),'#f7f4e6',h.cnes,near);
      }else if(h.variant===1){
        house(hospitals,x-4,z-1,12,13,h.height+2,c,h.cnes,near);
        house(hospitals,x+8,z+2,10,10,3,'#fcf7e9',h.cnes,near);
      }else if(h.variant===2){
        house(hospitals,x,z-5,25,8,Math.max(3,h.height*.6),c,h.cnes,near);
        house(hospitals,x,z+5,20,6,3,'#f6ead7',h.cnes,near);
        box([0,1.7,0],[5,3,6],'#73b5ca');
      }else if(h.variant===3){
        house(hospitals,x-7,z,9,22,h.height,c,h.cnes,near);
        house(hospitals,x+5,z+6,15,8,Math.max(3,h.height*.7),'#f7e8cf',h.cnes,near);
      }else{
        house(hospitals,x-6,z-2,10,13,h.height,c,h.cnes,near);
        house(hospitals,x+5,z,10,16,Math.max(3,h.height*.75),'#f3e4c7',h.cnes,near);
        house(hospitals,x,z+6,22,6,3,'#f8f6ec',h.cnes,near);
      }
      box([0,1.65,11],[8,.18,3],'#397fe0');
      box([0,.9,10.2],[5,1.5,.08],'#4b9fc4');
      box([0,2.2,9.8],[.3,1.3,.1],'#397fe0');box([0,2.2,9.9],[1.3,.3,.1],'#397fe0');
      box([0,.39,15.7],[6,.08,10],'#f7eacc');
      for(const s of [-1,1]){
        box([s*12,.46,12.5],[4,.35,1.5],'#83ac5e');
        if(near){tree(x+s*14,z-12,1.6);tree(x+s*14,z+12,1.35,s>0);flower(x+s*9,z+14,4);}
        // Clearly illustrative parking bays beside the entrance.
        for(let i=0;i<3;i++)box([s*(6+i*2.6),.4,17],[.08,.025,3],'#fdf8ec');
      }
      for(const sx of [-1,1])for(const dz of [-1,1])for(let i=0;i<5;i++)box([sx*17.2,.18,z===world.minZ?dz*18:dz*18+i*.22],[2.2,.02,.1],'#fff8e7');
    }else if(seed%9===0||(x===-42&&z===42)){
      parks.push({x,z});
      add(buildings,[x,.12,z],[32,.2,32],'#99bc70');
      add(buildings,[x,.25,z],[31,.05,2],'#f0dfb9');
      add(buildings,[x,.25,z],[2,.05,31],'#f0dfb9');
      add(buildings,[x,.38,z],[5,.3,5],'#f8efd9');
      add(buildings,[x,.56,z],[4,.07,4],'#65c9e8');
      if(near)for(const a of [-10,10])for(const b of [-10,10]){tree(x+a,z+b,1.8,a>0);flower(x+a,z+b+3,5);bench(x+a,z+b-3);}
      else for(const s of [-1,1])add(foliage,[x+s*9,2,z-s*9],[1.2,1.7,1.2],'#6aa440');
    }else if(detail){
      add(buildings,[x,.11,z],[33,.15,33],'#e4ddc7');
      for(let i=0;i<4;i++){
        const bx=x+(i%2?8:-8),bz=z+(i<2?-8:8),height=2+(seed+i*17)%8;
        house(buildings,bx,bz,6+(i%2),6,height,['#e6cca2','#f1dfbb','#c6dcd5','#ead7bd'][(seed+i)%4],undefined,near);
      }
      if(near){tree(x-14,z+13,1.5);tree(x+14,z-13,1.45,seed%3===0);flower(x,z+16,7);}
    }
  }
  return {streets,buildings,foliage,hospitals,parks};
}
