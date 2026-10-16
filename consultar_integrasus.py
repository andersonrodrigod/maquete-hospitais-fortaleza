"""Obtém indicadores agregados públicos do IntegraSUS para Fortaleza.

Rotas identificadas no código do próprio portal em 15/10/2026. Não é um
contrato de API versionado. Não usa login, tokens ou rotas /protected/.
"""

import argparse
from datetime import datetime, timezone
from pathlib import Path
import sys
from urllib.parse import urlencode

from consultar_saude import consultar, gravar


ORIGIN = "https://integrasus.saude.ce.gov.br"
CATALOGO = ORIGIN + "/api-adm/dashboard-area/"
HOSPITAIS_FORTALEZA = {
    "HELV - Hospital Estadual Leonardo da Vinci": "0086673",
    "HGF - Hospital Geral de Fortaleza": "2497654",
    "HGWA - Hospital Geral Waldemar de Alcântara": "2785900",
    "HM - Hospital de Messejana Dr. Carlos Alberto Studart Gomes": "2479214",
    "HSJ - Hospital São José de Doenças Infecciosas": "2561417",
    "HSM - Hospital de Saúde Mental Professor Frota Pinto": "2480026",
    "HUC - Hospital Universitário do Ceará": "4963938",
}


def obter_lista(url, output):
    response = consultar(url)
    gravar(output, response)
    if not response.get("ok") or not isinstance(response.get("dados"), list):
        raise RuntimeError(f"Fonte não retornou lista JSON válida: {url}; {response.get('erro')}")
    return response


def resumir_leitos(rows):
    """Soma exclusivamente as clínicas retornadas, não a capacidade CNES."""
    hospitals, seen = {}, set()
    for row in rows:
        name = row["unidade"]
        if name not in HOSPITAIS_FORTALEZA:
            continue
        key = (name, row["clinica"])
        if key in seen:
            raise ValueError(f"Clínica duplicada: {key}; não é seguro somar")
        seen.add(key)
        occupied, free, total = (row[k] for k in ("quantidadeOcupada", "quantidadeLivre", "total"))
        if any(type(v) is not int or v < 0 for v in (occupied, free, total)):
            raise ValueError(f"Quantidade de leitos ausente ou inválida: {key}")
        if occupied + free != total:
            raise ValueError(f"Ocupados + livres diverge do total: {key}")
        hospital = hospitals.setdefault(name, {
            "nome": name, "cnes": HOSPITAIS_FORTALEZA[name],
            "clinicas": [], "ocupados_no_recorte": 0,
            "livres_no_recorte": 0, "total_no_recorte": 0,
        })
        hospital["clinicas"].append(row)
        hospital["ocupados_no_recorte"] += occupied
        hospital["livres_no_recorte"] += free
        hospital["total_no_recorte"] += total
    for hospital in hospitals.values():
        total = hospital["total_no_recorte"]
        hospital["taxa_ocupacao_recorte_pct"] = round(hospital["ocupados_no_recorte"] / total * 100, 2) if total else None
    return sorted(hospitals.values(), key=lambda item: item["nome"])


def resumir_emergencia(response, hospital):
    rows = response["dados"]
    if not rows:
        return {"hospital": hospital, "disponivel": False}
    if len(rows) != 1 or rows[0].get("hospital") != hospital:
        raise ValueError("Resposta de emergência fora do hospital ou formato esperado")
    row = rows[0]
    above, below = row.get("qtdmaior24h"), row.get("qtdmenorigual24h")
    if any(type(v) is not int or v < 0 for v in (above, below)):
        raise ValueError("Contadores de emergência ausentes ou inválidos")
    total = above + below
    return {
        "hospital": hospital, "disponivel": True,
        "pacientes_acima_24h": above, "pacientes_ate_24h": below,
        "total_derivado_das_faixas": total,
        "percentual_acima_24h": round(above / total * 100, 2) if total else None,
        "consultado_em_utc": response["consultado_em_utc"],
        "url": response["url"],
        "filtro": "isExtra=false; demais filtros vazios (padrão do painel)",
    }


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--saida", type=Path, help="Pasta de saída; padrão: nova pasta com data/hora UTC")
    args = parser.parse_args()
    now = datetime.now(timezone.utc)
    folder = args.saida or Path("evidencias/integrasus") / now.strftime("%Y%m%dT%H%M%SZ")
    catalog = obter_lista(CATALOGO, folder / "catalogo.json")
    all_panels = [panel for area in catalog["dados"] for panel in area.get("dashboards", [])]
    panels = {p["id"]: p for p in all_panels if p.get("ativo") is True and p.get("privado") is False}
    required_ids = (273, 32, 230, 178)
    if any(key not in panels for key in required_ids):
        raise RuntimeError("Um painel deixou de estar público/ativo no catálogo; revisão necessária")
    metadata = [{
        "id": key, "titulo": panels[key]["titulo"],
        "pagina": ORIGIN + "/#/indicadores/" + panels[key]["rota"],
        "atualizacao_job_informada": (panels[key].get("jobAtualizacao") or {}).get("dataAtualizacao"),
        "metodologia": panels[key].get("descricao"),
    } for key in required_ids]
    beds = obter_lista(ORIGIN + "/api/perspectiva-central-hospitalar/informacoes-hospitalares", folder / "leitos.json")
    emergencies = []
    for hospital, route in (("HGF", "real-time-paciente-tempo-perm-maior-24"), ("HM", "hm-real-time-paciente-tempo-perm-maior-24")):
        params = {"isExtra": "false", "idClinica": "", "idMunicipio": "", "codCid": ""}
        if hospital == "HGF":
            params["hospital"] = "HGF"
        response = obter_lista(ORIGIN + "/api/" + route + "/search/tempo-permanencia?" + urlencode(params), folder / f"emergencia_{hospital.lower()}.json")
        emergencies.append(resumir_emergencia(response, hospital))
    maternity_base = ORIGIN + "/api/acomp-diaria-leitos-obstetricia-neonatal/"
    units = obter_lista(maternity_base + "unidade-filter", folder / "maternidades_unidades.json")
    dates = obter_lista(maternity_base + "data-filter", folder / "maternidades_datas.json")
    report = {
        "coleta_iniciada_em_utc": now.isoformat(),
        "coleta_finalizada_em_utc": datetime.now(timezone.utc).isoformat(),
        "paineis": metadata,
        "leitos_consultados_em_utc": beds["consultado_em_utc"],
        "leitos_url": beds["url"],
        "hospitais_fortaleza": resumir_leitos(beds["dados"]),
        "emergencias": emergencies,
        "maternidades": {
            "rotulos_do_filtro": sorted({r["desc"].strip() for r in units["dados"] if r.get("desc", "").strip() not in ("", "0")}),
            "intervalo_da_base": dates["dados"],
            "observacao": "Presença no filtro não comprova que cada unidade informou dados no último dia. Rotulagens ambíguas não foram unificadas automaticamente.",
        },
        "limitacoes": [
            "Totais de leitos cobrem somente as clínicas retornadas pela fonte, não necessariamente o hospital inteiro.",
            "Horário do job indica atualização do processamento; a API não fornece atualização individual de cada leito.",
            "Leitos livres são o estado informado pela fonte, não garantia de vaga acessível ou decisão de regulação.",
            "Cadência de 15 minutos para emergência é informada na metodologia; esta execução não comprova disponibilidade contínua.",
            "Rotas públicas do portal não têm contrato versionado identificado; mudanças exigem revisão do coletor.",
        ],
    }
    gravar(folder / "resumo.json", report)
    for hospital in report["hospitais_fortaleza"]:
        print(f"{hospital['nome']}: {hospital['ocupados_no_recorte']} ocupados / {hospital['livres_no_recorte']} livres / {hospital['total_no_recorte']} no recorte")
    print(f"Resultado: {folder / 'resumo.json'}")


if __name__ == "__main__":
    main()
