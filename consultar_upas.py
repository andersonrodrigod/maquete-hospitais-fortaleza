"""Verifica indicadores agregados de síndrome gripal nas UPAs do IntegraSUS.

Somente GET público, sem autenticação. Não consulta filas nem pacientes.
Rotas identificadas no JavaScript público do painel 253 em 15/10/2026.
"""

import argparse
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
import sys
from urllib.parse import urlencode

from consultar_saude import consultar, gravar


BASE = "https://integrasus.saude.ce.gov.br/api/acompanhamento-casos-upas/"
PANEL = "https://integrasus.saude.ce.gov.br/#/indicadores/indicadores-coronavirus/acompanhamento-casos-upas"


def contagem(value):
    if type(value) is not int or value < 0:
        raise ValueError("Quantidade ausente, negativa ou não inteira")
    return value


def resumir_upas(responses, cards, inicio, fim):
    """Filtra séries localmente; as rotas de comparação podem ignorar 'upa'."""
    units = [r["unidade"] for r in responses["filtro-unidade"]]
    if not units or len(units) != len(set(units)):
        raise ValueError("Lista de UPAs vazia ou duplicada")
    updates = {}
    for row in responses["unidade-ultima-atualizacao"]:
        name = row["unidade"]
        if name not in units or name in updates:
            raise ValueError("Atualização de UPA desconhecida ou duplicada")
        date.fromisoformat(row["maxDate"])
        updates[name] = row["maxDate"]
    series = {name: [] for name in units}
    seen = set()
    for row in responses["serie-historica-atendimentos"]:
        name = row["unidade"]
        day = datetime.strptime(row["data"], "%d/%m/%Y").date()
        key = (name, day)
        if name not in units or not inicio <= day <= fim or key in seen:
            raise ValueError("Série diária duplicada ou fora do recorte")
        seen.add(key)
        # mediaMovel supplied by the source mixes comparison units; do not copy it.
        series[name].append({"data": day.isoformat(), "quantidade": contagem(row["quantidade"])})
    by_unit = {name: {} for name in units}
    for row in responses["unidade"]:
        name, kind = row["unidade"], row["tipoAtendimento"]
        if name not in units or kind in by_unit[name]:
            raise ValueError("Indicador de unidade desconhecida ou duplicado")
        by_unit[name][kind] = contagem(row["quantidade"])
    result = []
    if set(cards) != set(units):
        raise ValueError("Consulta individual incompleta")
    for name in units:
        total = contagem(cards[name]["quantidade"])
        daily = sorted(series[name], key=lambda row: row["data"])
        if total != sum(row["quantidade"] for row in daily) or total != by_unit[name].get("Atendimento", 0):
            raise ValueError(f"Totais de atendimento divergentes para {name}")
        result.append({
            "unidade": name, "ultima_data_informada": updates.get(name),
            "atendimentos_no_periodo": total,
            "serie_diaria": daily,
            "transferencias_no_periodo": by_unit[name].get("Transferência"),
            "obitos_no_periodo": by_unit[name].get("Óbito"),
        })
    total = contagem(responses["atendimentos"]["quantidade"])
    if sum(row["atendimentos_no_periodo"] for row in result) != total:
        raise ValueError("Soma das UPAs difere do total do painel")
    risk = responses["classificacao-risco"]
    risk_keys = set()
    for row in risk:
        day = date.fromisoformat(row["data"])
        key = (day, row["classificacaoRisco"])
        if not inicio <= day <= fim or key in risk_keys:
            raise ValueError("Classificação duplicada ou fora do período")
        risk_keys.add(key)
        contagem(row["quantidade"])
    return {"upas": result, "atendimentos_no_periodo": total,
            "registros_classificacao_risco": sum(row["quantidade"] for row in risk),
            "classificacao_risco": risk,
            "classificacao_confere_com_atendimentos": sum(row["quantidade"] for row in risk) == total}


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--inicio", type=date.fromisoformat)
    parser.add_argument("--fim", type=date.fromisoformat)
    parser.add_argument("--saida", type=Path)
    args = parser.parse_args()
    now = datetime.now(timezone.utc)
    folder = args.saida or Path("evidencias/upas") / now.strftime("%Y%m%dT%H%M%SZ")
    evidence = []

    def get(route, params=None, filename=None):
        url = BASE + route + ("?" + urlencode(params) if params else "")
        response = consultar(url)
        gravar(folder / ((filename or route) + ".json"), response)
        evidence.append({k: response.get(k) for k in ("url", "consultado_em_utc", "http_status", "ok")})
        if not response.get("ok"):
            raise RuntimeError(f"Falha em {route}: {response.get('erro')}")
        return response["dados"]

    catalog = consultar("https://integrasus.saude.ce.gov.br/api-adm/dashboard-area/")
    gravar(folder / "catalogo.json", catalog)
    if not catalog.get("ok"):
        raise RuntimeError("Catálogo indisponível")
    panels = [p for area in catalog["dados"] for p in area.get("dashboards", []) if p.get("id") == 253]
    if len(panels) != 1 or panels[0].get("ativo") is not True or panels[0].get("privado") is not False:
        raise RuntimeError("Painel de UPAs não está público/ativo; revisão necessária")
    responses = {route: get(route) for route in ("filtro-data", "filtro-unidade", "unidade-ultima-atualizacao")}
    available = responses["filtro-data"]
    end = args.fim or date.fromisoformat(available["maxDate"])
    start = args.inicio or end - timedelta(days=6)
    if not date.fromisoformat(available["minDate"]) <= start <= end <= date.fromisoformat(available["maxDate"]):
        raise ValueError("Período fora das datas informadas pela fonte")
    params = {"dataInicio": start.isoformat(), "dataFim": end.isoformat(),
              "tipo": "", "upa": "", "cid": "", "classificacaoRisco": ""}
    for route in ("atendimentos", "unidade", "classificacao-risco", "sexo-faixa-etaria"):
        responses[route] = get(route, params)
    # A nonempty UPA enables split-by-unit comparison in the portal. The response
    # still includes other UPAs; summarize only rows belonging to each unit.
    names = [row["unidade"] for row in responses["filtro-unidade"]]
    if not names:
        raise ValueError("Nenhuma UPA retornada")
    responses["serie-historica-atendimentos"] = get("serie-historica-atendimentos", {**params, "upa": names[0]})
    cards = {name: get("atendimentos", {**params, "upa": name}, f"atendimentos-upa-{i}") for i, name in enumerate(names)}
    report = resumir_upas(responses, cards, start, end)
    report.update({
        "concluido": True, "coletado_em_utc": datetime.now(timezone.utc).isoformat(),
        "pagina": PANEL, "inicio": start.isoformat(), "fim": end.isoformat(),
        "escopo": "Atendimentos por síndrome gripal; não é toda a demanda das UPAs nem pessoas aguardando agora.",
        "job_atualizado_em_informado": (panels[0].get("jobAtualizacao") or {}).get("dataAtualizacao"),
        "requisicoes": evidence,
        "limitacoes": [
            "Presença no filtro não é prova de atendimento no dia; última data por unidade é informada separadamente.",
            "O último dia pode estar incompleto. Data de processamento não é atualização individual nem cadência garantida.",
            "A rota de comparação retorna várias UPAs mesmo com filtro; as séries foram separadas localmente por unidade.",
            "Médias móveis da comparação não foram reaproveitadas. Somas e cartões de cada UPA foram conciliados.",
            "Classificação de risco pode divergir da contagem de atendimentos. Não tratamos as duas como o mesmo denominador.",
            "Ausência de linha de transferência/óbito é null, não um zero confirmado.",
            "Não informa ocupação de leitos, fila ao vivo, espera estimada, profissionais em plantão ou pessoas identificadas.",
            "Rotas públicas sem contrato versionado identificado. Nenhuma atualização automática ou mudança no site foi feita.",
        ],
    })
    gravar(folder / "resumo.json", report)
    for row in report["upas"]:
        print(f"{row['unidade']}: {row['atendimentos_no_periodo']} atendimentos; última data {row['ultima_data_informada']}")
    print(f"Total: {report['atendimentos_no_periodo']}; resultado: {folder / 'resumo.json'}")


if __name__ == "__main__":
    main()
