import React,{useEffect,useRef,useState} from 'react';

const dateTime=value=>new Date(value).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'});
export const occupancyPercent=(occupied,total)=>total>0?(occupied/total*100).toLocaleString('pt-BR',{maximumFractionDigits:1})+'%':'Não disponível';

export default function HospitalInfo({hospital,consultedAt,competence,onClose,onEmergency}){
  const dialog=useRef(null),[tab,setTab]=useState('indicators');
  const monitoring=hospital.monitoring,location=hospital.location,emergency=hospital.emergency;
  useEffect(()=>{const node=dialog.current;node.showModal();return()=>node.close();},[]);
  return <dialog ref={dialog} className="emergency-panel hospital-info" aria-labelledby="hospital-info-title" onCancel={onClose} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    <div className="emergency-content">
      <button className="close" onClick={onClose} aria-label="Fechar informações" autoFocus>×</button>
      <span className="eyebrow">DADOS DO HOSPITAL · CNES {hospital.cnes}</span>
      <h2 id="hospital-info-title">Conheça o hospital</h2><h3>{hospital.name}</h3>
      <div className="info-tabs" role="group" aria-label="Informações do hospital">
        <button aria-pressed={tab==='indicators'} onClick={()=>setTab('indicators')}>Indicadores</button>
        <button aria-pressed={tab==='location'} onClick={()=>setTab('location')}>Localização</button>
        <button aria-pressed={tab==='registry'} onClick={()=>setTab('registry')}>Cadastro e fontes</button>
      </div>
      {tab==='indicators'&&<>
        {monitoring?<><div className="emergency-total"><strong>{occupancyPercent(monitoring.occupied,monitoring.total)}</strong><span>ocupação no recorte monitorado</span></div><p>{monitoring.occupied} ocupados e {monitoring.free} livres de {monitoring.total} leitos. Livres informados não garantem vaga acessível.</p><div className="clinic-indicators">{monitoring.clinics.map(c=><div key={c.clinica}><div><b>{c.clinica}</b><span>{occupancyPercent(c.quantidadeOcupada,c.total)}</span></div><progress value={c.quantidadeOcupada} max={c.total||1} aria-label={`Ocupação ${c.clinica}`}/><small>{c.quantidadeOcupada} ocupados · {c.quantidadeLivre} livres · {c.total} no recorte</small></div>)}</div><p>Coleta: {dateTime(consultedAt)} · IntegraSUS.</p></>:<p className="emergency-unavailable">Ocupação não disponível para este hospital na coleta.</p>}
        <h3 className="info-section-title">Permanência na emergência</h3>
        {emergency?.available?<><div className="emergency-metrics"><div><b>{emergency.upTo24h}</b><span>Pacientes até 24 horas</span></div><div><b>{emergency.over24h}</b><span>Pacientes acima de 24 horas</span></div></div><p>{emergency.total} pacientes no recorte · {emergency.over24hPercent.toLocaleString('pt-BR',{maximumFractionDigits:1})}% acima de 24h.<br/>Coleta: {dateTime(emergency.consultedAt)}.</p><button className="emergency-open" onClick={onEmergency}>Ver detalhes da emergência ↗</button></>:<p>Sem cobertura de emergência confirmada nesta coleta. Ausência de dados não significa zero pacientes.</p>}
        <div className="info-note"><b>Média de permanência em horas: não disponível.</b><p>A fonte consultada fornece apenas as faixas até 24h e acima de 24h. Elas não permitem calcular a média. Os contadores não representam fila ou tempo de espera e não são somados à ocupação.</p></div>
        <p className="info-snapshot">Consulta salva · sem atualização automática.</p>
      </>}
      {tab==='location'&&(location?<><span className="location-neighborhood">{location.neighborhood}</span><h3 className="info-section-title">{location.street}, {location.number}</h3><p>Fortaleza · Ceará</p><div className="info-note"><b>Coordenadas do cadastro CNES</b><p>Latitude: {location.latitude}<br/>Longitude: {location.longitude}<br/>Atualização cadastral: {location.registryUpdatedAt}</p></div><a className="location-link" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${location.latitude},${location.longitude}`)}`} target="_blank" rel="noreferrer">Abrir localização no mapa ↗</a><p>Referência cadastral. A posição dos prédios e as ruas na maquete têm espaçamento ilustrativo.</p></>:<p>Localização cadastral indisponível.</p>)}
      {tab==='registry'&&<><h3 className="info-section-title">Capacidade cadastrada · {competence}</h3><div className="emergency-metrics"><div><b>{hospital.total}</b><span>Registros de leitos</span></div><div><b>{hospital.types.reduce((sum,t)=>sum+t.sus,0)}</b><span>Registros SUS</span></div></div><p>{hospital.ordinary} exceto complementares + {hospital.complementary} complementares. A soma de registros não comprova camas físicas distintas.</p><p>CNES é capacidade cadastrada, com competência diferente do recorte de ocupação IntegraSUS. Os totais permanecem separados.</p><p>Coleta CNES: {dateTime(hospital.consultedAt)}.</p><a className="location-link" href={hospital.sourceUrl} target="_blank" rel="noreferrer">Consultar fonte CNES ↗</a><a className="location-link" href={`https://cnes2.datasus.gov.br/Mod_Hospitalar.asp?VCo_Unidade=230440${hospital.cnes}`} target="_blank" rel="noreferrer">Ficha do estabelecimento ↗</a><div className="info-note">Andares, quartos, posições dos leitos e profissionais da maquete são ilustrativos. Não identificam pacientes ou camas reais.</div></>}
    </div>
  </dialog>;
}
