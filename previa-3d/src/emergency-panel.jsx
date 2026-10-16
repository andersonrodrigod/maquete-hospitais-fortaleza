import React,{useEffect,useRef} from 'react';

const dateTime=value=>new Date(value).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'});
export default function EmergencyPanel({hospital,hospitals,onHospital,onClose}){
  const dialog=useRef(null),report=hospital.emergency;
  useEffect(()=>{const node=dialog.current;node.showModal();return()=>node.close();},[]);
  return <dialog ref={dialog} className="emergency-panel" aria-labelledby="emergency-title" onCancel={onClose} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    <div className="emergency-content">
      <button className="close" onClick={onClose} aria-label="Fechar emergência" autoFocus>×</button>
      <span className="eyebrow">INTEGRASUS · PERMANÊNCIA NA EMERGÊNCIA</span>
      <h2 id="emergency-title">Emergência</h2><h3>{hospital.name}</h3>
      {report?.available?<>
        <p>Pacientes no recorte consultado, separados pelo tempo de permanência.</p>
        <div className="emergency-total"><strong>{report.total}</strong><span>pacientes no recorte</span></div>
        <div className="emergency-metrics"><div><b>{report.upTo24h}</b><span>Até 24 horas</span></div><div><b>{report.over24h}</b><span>Mais de 24 horas</span></div></div>
        {report.total>0?<><div className="emergency-bar" aria-hidden="true"><i style={{width:`${100-report.over24hPercent}%`}}/><i style={{width:`${report.over24hPercent}%`}}/></div><p className="emergency-share">{report.over24hPercent.toLocaleString('pt-BR',{maximumFractionDigits:1})}% permanecem há mais de 24 horas neste recorte.</p></>:<p>Nenhum paciente retornado neste recorte na coleta. Isso não comprova ausência de pacientes em toda a emergência.</p>}
        <div className="info-note"><b>Média de permanência em horas: não disponível.</b><p>A API fornece somente as faixas até 24h e acima de 24h; não é possível calcular a média com essas contagens.</p></div>
        <div className="emergency-date"><b>Coletado em {dateTime(report.consultedAt)} (São Paulo)</b><span>Consulta salva · sem atualização automática no site.</span></div>
        <details className="emergency-method"><summary>Entenda o indicador e a atualização</summary><p>A metodologia do painel informa atualização a cada 15 minutos. Esse intervalo não garante a atualização individual dos registros.</p><p>Consulta com isExtra=false e filtros de clínica, município e CID vazios. A metodologia descreve pacientes alocados em leitos da emergência; o número é apenas o resultado desses filtros.</p><p>Não é tempo de espera para atendimento, nem o total de internados do hospital. Não somamos esses pacientes aos leitos monitorados, pois os recortes podem se sobrepor. Os números não identificam pessoas ou camas da maquete.</p><a href={report.sourceUrl} target="_blank" rel="noreferrer">Resposta da API ↗</a></details>
      </>:<div className="emergency-unavailable"><strong>{report?'Sem dados retornados nesta coleta.':'Sem cobertura de emergência confirmada para este hospital.'}</strong><p>Ausência de informação não significa zero pacientes. Temos consultas confirmadas para HGF e Messejana.</p></div>}
      {report&&<a className="emergency-source" href={report.panelUrl} target="_blank" rel="noreferrer">Abrir painel oficial IntegraSUS ↗</a>}
      <nav className="emergency-shortcuts" aria-label="Hospitais com dados de emergência">{hospitals.filter(h=>h.emergency).map(h=><button key={h.cnes} className={h.cnes===hospital.cnes?'active':''} onClick={()=>onHospital(h.cnes)}>{h.cnes==='2497654'?'HGF':'Messejana'}</button>)}</nav>
    </div>
  </dialog>;
}
