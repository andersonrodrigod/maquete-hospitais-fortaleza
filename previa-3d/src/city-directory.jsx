import React,{useMemo,useState} from 'react';
import {searchHospitals} from './city-layout';

export default function CityDirectory({hospitals,hospitalId,onHospital,onClose}){
  const [query,setQuery]=useState(''),[onlyMonitored,setOnlyMonitored]=useState(false);
  const results=useMemo(()=>searchHospitals(hospitals,query,onlyMonitored),[hospitals,query,onlyMonitored]);
  return <aside className="city-directory" id="city-directory" aria-label="Buscar hospital na cidade">
    <div className="city-directory-heading"><div><span className="eyebrow">EXPLORE A CIDADE</span><h2>Encontre um hospital</h2></div><button onClick={onClose} aria-label="Fechar lista de hospitais">×</button></div>
    <label className="city-search"><span>⌕</span><input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Nome, bairro ou CNES" aria-label="Buscar por nome, bairro ou CNES"/></label>
    <div className="city-list-filters" role="group" aria-label="Cobertura dos dados"><button className={!onlyMonitored?'active':''} onClick={()=>setOnlyMonitored(false)}>Todos · {hospitals.length}</button><button className={onlyMonitored?'active':''} onClick={()=>setOnlyMonitored(true)}>Com ocupação · {hospitals.filter(h=>h.monitoring).length}</button></div>
    <p className="city-results" role="status">{results.length} {results.length===1?'hospital encontrado':'hospitais encontrados'} · clique para viajar</p>
    <div className="city-hospital-list">{results.map(h=><button key={h.cnes} className={h.cnes===hospitalId?'active':''} onClick={()=>onHospital(h.cnes)} aria-label={`Localizar ${h.name}`}>
      <span className="hospital-list-symbol">✚</span><span><strong>{h.name}</strong><small>{h.location?.neighborhood||'Bairro não informado'} · CNES {h.cnes}</small>
        {h.monitoring?<em>{h.monitoring.occupied} ocupados · {h.monitoring.free} livres <i>na coleta</i></em>:<em className="no-monitoring">{h.total} registros CNES · ocupação desconhecida</em>}
        {h.emergency&&<small className="emergency-badge">✚ Dados de emergência</small>}
      </span><b>↗</b>
    </button>)}{!results.length&&<div className="city-empty">Nenhum resultado. Experimente outro nome ou bairro.</div>}</div>
    <div className="city-directory-note">Localizações do cadastro CNES, com espaçamento ajustado. Ruas e fachadas ilustrativas. Dados de ocupação são da coleta indicada no interior.</div>
  </aside>;
}
