import React, {Component, Suspense, useCallback, useEffect, useMemo, useState} from 'react';
import {createRoot} from 'react-dom/client';
import City from './city';
import data from './data/hospitals.json';
import {createBedLayout} from './bed-layout';
import {createSceneHospital,bedCounts} from './scene-data';
import {createCityLayout} from './city-layout';
import CityDirectory from './city-directory';
import EmergencyPanel from './emergency-panel';
import './style.css';

class SceneBoundary extends Component {
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  render(){return this.state.failed?<div className="webgl-error"><h2>Não foi possível abrir a cena 3D.</h2><p>Confira a aceleração gráfica do navegador e recarregue a página.</p><button onClick={()=>location.reload()}>Tentar novamente</button></div>:this.props.children;}
}
const dateTime=value=>new Date(value).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'});
const competence=`${String(data.competence).slice(4)}/${String(data.competence).slice(0,4)}`;
const world=createCityLayout(data.hospitals);

function App(){
  const [paused,setPaused]=useState(false),[selected,setSelected]=useState(null);
  const [inside,setInside]=useState(false),[detail,setDetail]=useState(true),[ready,setReady]=useState(false);
  const [hospitalId,setHospitalId]=useState('2497654'),[typeId,setTypeId]=useState(null),[bedId,setBedId]=useState(null);
  const [wingId,setWingId]=useState(null),[touring,setTouring]=useState(false);
  const [floorId,setFloorId]=useState(null);
  const [dataMode,setDataMode]=useState('monitoring');
  const [emergencyOpen,setEmergencyOpen]=useState(false);
  const [cityDirectory,setCityDirectory]=useState(()=>window.innerWidth>650);
  const [assembly,setAssembly]=useState({mode:'open',serial:0}),[assemblyStage,setAssemblyStage]=useState(0);
  const transforming=assembly.mode==='opening'||assembly.mode==='closing',interiorOpen=assembly.mode==='open';
  const [directory,setDirectory]=useState(()=>window.innerWidth>650);
  const [command,setCommand]=useState({action:'district',point:[0,3,0],id:0});
  const rawHospital=data.hospitals.find(h=>h.cnes===hospitalId);
  const hospital=useMemo(()=>createSceneHospital(rawHospital,dataMode),[rawHospital,dataMode]);
  const monitored=hospital.dataMode==='monitoring';
  const inventoryLayout=useMemo(()=>createBedLayout(hospital),[hospital]);
  const layout=useMemo(()=>createBedLayout(hospital,typeId,floorId),[hospital,typeId,floorId]);
  const counts=useMemo(()=>bedCounts(layout.beds),[layout]);
  const chosen=layout.beds.find(b=>b.id===bedId);
  const type=hospital.types.find(t=>t.id===typeId);
  const wing=layout.wings.find(w=>w.id===wingId);
  const floor=inventoryLayout.floors.find(f=>f.id===floorId);
  const room=layout.rooms.find(r=>r.id===chosen?.illustrativeRoomId);
  const move=useCallback((action,options={})=>setCommand(c=>({action,...options,id:c.id+1})),[]);
  const onReady=useCallback(()=>setReady(true),[]);
  const assemblyComplete=useCallback(mode=>setAssembly(s=>({...s,mode:s.mode===mode?(mode==='opening'?'open':'closed'):s.mode})),[]);
  const goToHospital=useCallback(id=>{
    const site=world.sites.find(h=>h.cnes===id);if(!site)return;
    setHospitalId(id);setSelected('hospital');setInside(false);setTouring(false);setBedId(null);setAssembly(s=>({...s,mode:'open'}));
    if(window.innerWidth<1100)setCityDirectory(false);
    move('hospital',{point:[site.x,site.height/2,site.z]});
  },[move]);
  const select=useCallback(()=>goToHospital(hospitalId),[goToHospital,hospitalId]);
  const home=()=>{setSelected(null);setInside(false);setBedId(null);setTypeId(null);setFloorId(null);setTouring(false);setAssembly(s=>({...s,mode:'open'}));move('all-city');};
  const viewAll=(h=hospital)=>{setTypeId(null);setFloorId(null);setBedId(null);setWingId(null);setTouring(false);const model=createBedLayout(h);move('inside',{span:model.span,point:model.center,overview:model.floors.length>1,overviewHeight:model.overviewHeight,horizontal:model.horizontal});};
  const focusWing=w=>{if(!w)return;setWingId(w.id);setBedId(null);move('wing',{point:[w.x,w.y+.65,w.z],span:39});};
  const enter=(h=hospital)=>{setInside(true);viewAll(h);setDirectory(false);setPaused(false);setAssemblyStage(0);setAssembly(s=>({mode:'opening',serial:s.serial+1}));};
  const assemble=()=>{viewAll();setDirectory(false);setPaused(false);setAssemblyStage(0);setAssembly(s=>({mode:'closing',serial:s.serial+1}));};
  const skipAssembly=()=>setAssembly(s=>({...s,mode:s.mode==='closing'?'closed':'open'}));
  const changeHospital=id=>{const h=data.hospitals.find(item=>item.cnes===id);setHospitalId(id);enter(createSceneHospital(h,dataMode));};
  const changeDataMode=mode=>{setDataMode(mode);viewAll(createSceneHospital(rawHospital,mode));};
  const chooseType=id=>{setTypeId(id);setFloorId(null);setTouring(false);setBedId(null);focusWing(createBedLayout(hospital,id).wings[0]);if(window.innerWidth<=650)setDirectory(false);};
  const chooseFloor=id=>{setFloorId(id);setTypeId(null);setWingId(null);setBedId(null);setTouring(false);const model=createBedLayout(hospital,null,id);move('inside',{point:model.center,span:model.span});if(window.innerWidth<=650)setDirectory(false);};
  const chooseWing=id=>{setTouring(false);focusWing(layout.wings.find(w=>w.id===id));if(window.innerWidth<=650)setDirectory(false);};
  const chooseRoom=r=>{setTouring(false);setWingId(r.wingId);setBedId(null);if(window.innerWidth<=650)setDirectory(false);move('room',{point:[r.x,r.y+.65,r.z],span:15});};
  const chooseBed=id=>{const bed=layout.beds.find(b=>b.id===id);if(!bed)return;setTouring(false);setWingId(bed.illustrativeWingId);setBedId(id);if(window.innerWidth<=650)setDirectory(false);move('bed',{point:[bed.x,bed.y+.65,bed.z],span:8});};
  const adjacent=offset=>{const i=layout.beds.findIndex(b=>b.id===bedId);chooseBed(layout.beds[(i+offset+layout.beds.length)%layout.beds.length].id);};
  const nextFree=()=>{const free=layout.beds.filter(b=>b.status==='free'),i=free.findIndex(b=>b.id===bedId);if(free.length)chooseBed(free[(i+1)%free.length].id);};
  const nextWing=offset=>{const i=layout.wings.findIndex(w=>w.id===wingId);setTouring(false);focusWing(layout.wings[(Math.max(0,i)+offset+layout.wings.length)%layout.wings.length]);};
  useEffect(()=>{
    if(!inside||!interiorOpen||!touring||paused||!layout.wings.length)return;
    const timer=setInterval(()=>{
      const i=layout.wings.findIndex(w=>w.id===wingId),w=layout.wings[(i+1)%layout.wings.length];
      setWingId(w.id);setBedId(null);move('wing',{point:[w.x,w.y+.65,w.z],span:39});
    },8000);
    return ()=>clearInterval(timer);
  },[inside,interiorOpen,touring,paused,layout,wingId,move]);
  return <main>
    <header className="topbar">
      <a className="brand" href="#" onClick={e=>{e.preventDefault();home();}}><span className="brand-icon">✚</span><span>Fortaleza<span className="brand-light"> em movimento</span><small>SAÚDE · CIDADE · DADOS</small></span></a>
      <div className="header-right"><span className="preview-tag">MAQUETE ILUSTRATIVA</span><span className="preview-text">Prévia 3D</span></div>
    </header>
    <section className={`map ${inside?'interior-map data-map':'city-map'} ${!inside&&cityDirectory?'city-list-open':''} ${inside&&directory&&interiorOpen?'directory-open':''} ${inside&&!interiorOpen?'assembly-view':''} ${inside&&transforming?'is-transforming':''}`} aria-label="Visualização 3D de hospitais e leitos cadastrados">
      <div className="canvas-wrap"><SceneBoundary><Suspense fallback={<div className="loading">Montando a visualização…</div>}><City paused={paused} inside={inside} detail={detail} command={command} onReady={onReady} layout={layout} bedId={bedId} onBed={interiorOpen?chooseBed:()=>{}} wingId={wingId} onWing={interiorOpen?chooseWing:()=>{}} onFloor={chooseFloor} onCameraStart={()=>setTouring(false)} assembly={assembly} onAssemblyComplete={assemblyComplete} onAssemblyStage={setAssemblyStage} hospitalName={hospital.name} world={world} hospitalId={hospitalId} onHospital={goToHospital} cityDirectory={cityDirectory} citySelected={selected!==null}/></Suspense></SceneBoundary></div>
      {!ready&&<div className="loading">Montando a visualização…</div>}
      <div className="map-intro"><div className="eyebrow"><span className={`motion-dot ${paused?'paused':''}`}/>{inside?(monitored?'MAQUETE · OCUPAÇÃO INTEGRASUS':`MAQUETE · CNES ${competence}`):paused?'CENA PAUSADA':`${data.hospitals.length} HOSPITAIS · CIDADE EM MOVIMENTO`}</div><h1>{inside?(assembly.mode==='opening'?'O hospital se abre.':assembly.mode==='closing'?'Remontando o hospital.':interiorOpen?'Entre. Explore cada ala.':'O hospital por inteiro.'):'Uma cidade inteira para explorar.'}</h1><p>{inside?'Arquitetura ilustrativa. Explore os quartos e os dados.':'Arraste o mapa, escolha um prédio e entre no hospital.'}</p></div>
      <div className="top-actions"><button className="soft-button" onClick={()=>setPaused(p=>!p)} aria-pressed={paused}>{paused?'▶ Retomar movimento':'Ⅱ Pausar movimento'}</button></div>
      {!inside&&<><div className="city-toolbar"><button className="soft-button" onClick={()=>setCityDirectory(v=>!v)} aria-expanded={cityDirectory} aria-controls="city-directory">☷ Hospitais · {data.hospitals.length}</button><button className="soft-button" onClick={home}>◎ Ver cidade inteira</button><button className="soft-button" onClick={()=>setEmergencyOpen(true)}>✚ Emergência</button></div>
        {cityDirectory&&<CityDirectory hospitals={data.hospitals} hospitalId={hospitalId} onHospital={goToHospital} onClose={()=>setCityDirectory(false)}/>}
      </>}
      {selected&&!inside&&<aside className="detail-card" aria-live="polite">
        <button className="close" aria-label="Fechar detalhes" onClick={()=>setSelected(null)}>×</button>
        <span className="eyebrow">{rawHospital.location?.neighborhood} · FACHADA ILUSTRATIVA</span>
        <h2>{rawHospital.name}</h2>
        <p className="city-address">{rawHospital.location?.street}, {rawHospital.location?.number}</p>
        {rawHospital.monitoring?<div className="city-card-counts"><b>{rawHospital.monitoring.occupied}<small>ocupados</small></b><b>{rawHospital.monitoring.free}<small>livres na coleta</small></b><span>{rawHospital.monitoring.total} no recorte IntegraSUS<br/>{dateTime(data.monitoringConsultedAt)}</span></div>:<p>{rawHospital.total} registros CNES · ocupação desconhecida.</p>}
        <button className="primary-button" onClick={()=>enter()}>Entrar neste hospital ↗</button>
        <button className="emergency-open" onClick={()=>setEmergencyOpen(true)}>Emergência{rawHospital.emergency?.available?` · ${rawHospital.emergency.total} no recorte`:' · consultar cobertura'} ↗</button>
        <div className="detail-note">Prédio e andares ilustrativos. Pessoas deitadas e camas vazias seguem o recorte publicado, quando disponível. Posições não identificam leitos físicos.</div>
      </aside>}
      {inside&&<>
        <div className="floor-toolbar">
          <button className="soft-button" onClick={select}>↙ Cidade</button>
          <button className="soft-button" onClick={()=>setDirectory(v=>!v)} disabled={!interiorOpen} aria-expanded={directory&&interiorOpen} aria-controls="floor-directory">☷ Hospitais e categorias</button>
          <button className="soft-button" onClick={()=>setEmergencyOpen(true)}>✚ Emergência</button>
          <span className="missing-floors">Planta ilustrativa · {monitored?'recorte IntegraSUS':'cadastro CNES'}</span>
        </div>
        {directory&&interiorOpen&&<aside className="floor-directory data-directory" id="floor-directory">
          <label className="eyebrow" htmlFor="hospital-picker">HOSPITAL · {data.hospitals.length} NO INVENTÁRIO</label>
          <select id="hospital-picker" value={hospitalId} onChange={e=>changeHospital(e.target.value)}>{data.hospitals.map(h=><option key={h.cnes} value={h.cnes}>{h.name}</option>)}</select>
          <div className="source-counts">{monitored?<><strong>{hospital.monitoring.occupied}</strong><span>ocupados → pessoas nos leitos</span><strong>{hospital.monitoring.free}</strong><span>livres → camas vazias</span></>:<><strong>{hospital.ordinary}</strong><span>cadastrados, exceto complementares</span><strong>+ {hospital.complementary}</strong><span>complementares cadastrados</span></>}</div>
          <p>{monitored?`Coleta: ${dateTime(data.monitoringConsultedAt)}`:`CNES ${hospital.cnes} · ${competence}`}</p>
          <button className={`directory-overview ${typeId===null&&floorId===null?'active':''}`} onClick={()=>viewAll()}>◎ Todos os andares · {hospital.total}</button>
          <div className="floor-count-list"><span className="eyebrow">ANDARES ILUSTRATIVOS</span>{inventoryLayout.floors.map(f=><button key={f.id} className={floorId===f.id?'active':''} onClick={()=>chooseFloor(f.id)}>Andar {f.number}<b>{f.count} leitos</b></button>)}<p>{inventoryLayout.floors.map(f=>f.count).join(' + ')} = <b>{hospital.total}</b></p></div>
          <div className="room-list">{hospital.types.map(t=><div className="room-entry" key={t.id}><button className={typeId===t.id?'active':''} onClick={()=>chooseType(t.id)}><span className="room-color" style={{background:t.complementary?'#b1a0cf':'#8ebfd2'}}/><span>{t.label}</span><b>{t.count}</b></button></div>)}</div>
          {layout.wings.length>0&&<div className="wing-directory"><label htmlFor="wing-picker" className="eyebrow">ALAS DA MAQUETE</label><select id="wing-picker" value={wingId||''} onChange={e=>chooseWing(e.target.value)}><option value="" disabled>Escolha uma ala</option>{layout.wings.map(w=><option key={w.id} value={w.id}>{w.label} · Ala {w.number} · {w.count} leitos</option>)}</select>
            {wing&&<div className="room-shortcuts">{layout.rooms.filter(r=>r.wingId===wing.id).map(r=><button key={r.id} onClick={()=>chooseRoom(r)}>{r.label}<b>{r.count} leitos</b></button>)}</div>}
          </div>}
          <p className="directory-note"><b>Andares, alas e quartos são inventados.</b> {monitored?'As pessoas deitadas e camas vazias reproduzem os totais por clínica na coleta. As posições são simbólicas: a API não identifica camas, pacientes ou andares. Equipe andando é decorativa.':'Cada símbolo representa um registro CNES, sem ocupação conhecida. As camas cinza não significam vagas disponíveis.'}</p>
          <details className="source-details"><summary>Fontes e atualização</summary>
            <p>Registros cadastrados em {competence}. Não informa vagas ou ocupação atual. A soma pode incluir sobreposição de habilitações e não comprova camas físicas distintas.</p>
            <p>Coleta CNES: {dateTime(hospital.consultedAt)}.</p>
            <a href={hospital.sourceUrl} target="_blank" rel="noreferrer">API de Dados Abertos · CNES ↗</a>
            <a href={`https://cnes2.datasus.gov.br/Mod_Hospitalar.asp?VCo_Unidade=230440${hospital.cnes}`} target="_blank" rel="noreferrer">Ficha do estabelecimento ↗</a>
            {hospital.monitoring?<><p><b>Outro recorte · IntegraSUS</b></p><p>{hospital.monitoring.total} monitorados: {hospital.monitoring.occupied} ocupados e {hospital.monitoring.free} livres na coleta de {dateTime(data.monitoringConsultedAt)}. Não é o total cadastrado e não foi somado ao CNES.</p><a href={data.monitoringUrl} target="_blank" rel="noreferrer">API IntegraSUS ↗</a></>:<p>Sem dados de ocupação confirmados no recorte IntegraSUS consultado.</p>}
          </details>
        </aside>}
        <div className="source-ribbon"><strong>{hospital.name}</strong><span><b>{interiorOpen?layout.beds.length:hospital.total}</b> {interiorOpen?'leitos 3D nesta vista':'leitos na maquete'} · <b>{hospital.total}</b> {monitored?'no recorte monitorado':'no cadastro'}{interiorOpen&&<> · {floor?`andar ilustrativo ${floor.number}`:type?type.label:'todos os andares'}</>}</span>
          {interiorOpen&&<div className="data-mode"><div className="mode-buttons" role="group" aria-label="Fonte dos leitos"><button className={monitored?'active':''} disabled={!rawHospital.monitoring} onClick={()=>changeDataMode('monitoring')}>Ocupação monitorada{rawHospital.monitoring?` · ${rawHospital.monitoring.total}`:''}</button><button className={!monitored?'active':''} onClick={()=>changeDataMode('cnes')}>Cadastro CNES · {rawHospital.total}</button></div>
            {monitored?<><div className="occupancy-legend"><span className="occupied-count">● {counts.occupied} com pessoas</span><button className="free-count" onClick={nextFree} disabled={!counts.free} title="Aproximar a próxima cama vazia">● {counts.free} vazios ↗</button></div><small>Coleta {dateTime(data.monitoringConsultedAt)} · posições ilustrativas · sem atualização automática</small></>:<small className="unknown-count">● Ocupação desconhecida · camas sem pessoas não significam vagas livres{!rawHospital.monitoring?' · sem recorte monitorado para este hospital':''}</small>}
          </div>}
          {interiorOpen&&<div className="floor-strip"><button className={floorId===null?'active':''} onClick={()=>viewAll()}>Todos · {hospital.total}</button>{inventoryLayout.floors.map(f=><button key={f.id} className={floorId===f.id?'active':''} onClick={()=>chooseFloor(f.id)}>A{f.number} · {f.count}</button>)}</div>}
          {wing&&interiorOpen&&<div className="wing-navigation"><button onClick={()=>nextWing(-1)} aria-label="Ala anterior">←</button><span>Andar {wing.floorNumber} · {wing.label} · Ala {wing.number} · {wing.count} leitos</span><button onClick={()=>nextWing(1)} aria-label="Próxima ala">→</button></div>}
        </div>
        <div className="assembly-controls">
          {transforming?<button onClick={skipAssembly}>Concluir animação →</button>:assembly.mode==='closed'?<button className="assembly-primary" onClick={()=>enter()}>▷ Abrir andares</button>:<><button onClick={()=>enter()}>↻ Repetir abertura</button><button onClick={assemble}>▣ Remontar prédio</button></>}
        </div>
        {type&&!chosen&&<aside className="type-card"><b>{type.label}</b><p>{monitored?`${type.occupied} ocupados · ${type.free} livres`:`${type.count} cadastrados · ${type.sus} SUS`}</p><details><summary>{monitored?'Contagem publicada':'Distribuição por especialidade'}</summary>{type.details.map(d=><p key={d.label}>{d.label}: <b>{d.count}</b></p>)}</details></aside>}
        {chosen&&<aside className="bed-card" aria-live="polite">
          <button className="close" aria-label="Fechar ficha do leito" onClick={()=>setBedId(null)}>×</button>
          <span className="eyebrow">LEITO DA MAQUETE</span>
          <h2>Leito {chosen.sequence}<span> de {chosen.count}</span></h2>
          <p>{chosen.typeLabel}</p>
          <div className={`bed-status status-${chosen.status}`}>{chosen.status==='occupied'?'● Ocupado no total publicado':chosen.status==='free'?'● Livre no total publicado':'● Ocupação desconhecida'}<br/>Andar {wing?.floorNumber} · Ala {wing?.number} · {room?.label}</div>
          <small>{monitored?'Posição e número simbólicos. Esta cama não identifica um leito físico ou uma pessoa real. Contagem da coleta, não uma reserva disponível agora.':'Número interno da maquete. Distribuição inventada; o CNES não informa ocupação.'}</small>
          <div className="bed-pagination"><button onClick={()=>adjacent(-1)}>← Anterior</button><button onClick={()=>adjacent(1)}>Próximo →</button></div>
        </aside>}
      </>}
      <nav className="camera-tools" aria-label="Controles da câmera" inert={transforming&&inside?true:undefined}>
        <button aria-label="Aproximar" title="Aproximar" onClick={()=>move('in')}>+</button>
        <button aria-label="Afastar" title="Afastar" onClick={()=>move('out')}>−</button><span/>
        <button aria-label="Girar câmera" title="Girar câmera" onClick={()=>move('rotate')}>⟳</button>
        <button aria-label="Restaurar vista geral" title="Vista geral" onClick={inside?()=>viewAll():home}>⌂</button>
      </nav>
      {inside?(interiorOpen?<div className="bottom-dock floor-dock"><nav className="locations" aria-label="Explorar interior ilustrativo">
        <button onClick={()=>viewAll()}>◎ <span>Todos os leitos</span></button>
        <button onClick={()=>{const id=floorId||layout.floors[0]?.id;const model=createBedLayout(hospital,null,id);chooseFloor(id);move('top',{span:model.span,point:model.center});}}>▦ <span>Planta do andar</span></button>
        {layout.beds.length>0&&<button onClick={()=>chooseBed(layout.beds.find(b=>b.illustrativeWingId===wingId)?.id||layout.beds[0].id)}>↗ <span>Ver leito</span></button>}
        {layout.wings.length>0&&<button className={touring?'active':''} onClick={()=>{if(!touring){focusWing(wing||layout.wings[0]);if(window.innerWidth<=650)setDirectory(false);}setTouring(t=>!t);}}>▷ <span>{touring?'Parar passeio':'Passear nas alas'}</span></button>}
      </nav></div>:<div className="assembly-status" role="status"><span className="eyebrow">{paused?'ANIMAÇÃO PAUSADA':assembly.mode==='closed'?'PRÉDIO REMONTADO':'TRANSFORMAÇÃO EM MOVIMENTO'}</span><strong>{assembly.mode==='closed'?'Abra os andares para explorar o interior.':assembly.mode==='closing'?['Reunindo os andares','Recompondo a fachada','Fechando o teto'][assemblyStage]:['Hospital inteiro','Abrindo teto e fachada','Separando os andares'][assemblyStage]}</strong>{transforming&&<div className="assembly-steps">{[0,1,2].map(step=><i key={step} className={step<=assemblyStage?'active':''}/>)}</div>}</div>):<div className="bottom-dock"><nav className="locations" aria-label="Explorar locais">
        <button className={command.action==='all-city'?'active':''} onClick={home}>◎ <span>Cidade inteira</span></button>
        <button onClick={()=>setCityDirectory(v=>!v)}>☷ <span>Hospitais</span></button>
        <button onClick={()=>goToHospital('2497654')}>✚ <span>Ir ao HGF</span></button>
        <button onClick={()=>enter()}>▦ <span>Entrar no hospital</span></button>
      </nav><button className="detail-toggle" onClick={()=>setDetail(d=>!d)} aria-pressed={detail} aria-label="Construções do entorno">{detail?'◉':'○'} <span>Construções do entorno</span></button></div>}
      <div className="map-footnote">{inside?(monitored?'Pessoas deitadas = ocupados · camas turquesa vazias = livres · posição ilustrativa · equipe decorativa':'Cadastro CNES · ocupação desconhecida · arquitetura ilustrativa'):'78 hospitais · coordenadas CNES com espaçamento ajustado · ruas e fachadas ilustrativas'}</div>
    </section>
    {emergencyOpen&&<EmergencyPanel hospital={rawHospital} hospitals={data.hospitals} onHospital={goToHospital} onClose={()=>setEmergencyOpen(false)}/>}
    <footer><span><b>Esquerdo</b> arrasta <i>·</i> <b>Direito</b> gira <i>·</i> <b>Scroll</b> aproxima</span><span className="touch-help">Um dedo gira · dois dedos aproximam e arrastam</span><span>{inside?(monitored?'Contagens IntegraSUS · dados da coleta':`Cadastro CNES · ${competence}`):'Fortaleza em cores · maquete 3D'}</span></footer>
  </main>;
}
createRoot(document.getElementById('root')).render(<App/>);
