"""Valida hospitais, leitos cadastrados e amostras SIH em um município.

Não consulta pacientes. SIH é produção aprovada; CNES não é ocupação ao vivo.
"""

import argparse
import csv
from datetime import date
import json
from pathlib import Path
import sys
import time
from urllib.parse import urlencode

from consultar_saude import BASE, consultar, gravar


def extrair_registros(response, key):
    if not response.get("ok"):
        raise RuntimeError(f"Falha em {response['url']}: {response.get('erro')}")
    data = response.get("dados", {})
    if not isinstance(data, dict) or not isinstance(data.get(key), list):
        raise ValueError(f"Formato inesperado: esperada lista {key}")
    return data[key]


def competencias_anteriores(reference, count):
    total = reference.year * 12 + reference.month - 1
    return [(total - n) // 12 * 100 + (total - n) % 12 + 1 for n in range(count)]


class Coletor:
    def __init__(self, folder, delay=0.12, retomar=False):
        self.folder = Path(folder)
        self.delay = delay
        self.evidencias = []
        self.cache = {}
        previous = self.folder / "requisicoes.json"
        if retomar and previous.exists():
            self.evidencias = json.loads(previous.read_text(encoding="utf-8"))
            self.cache = {r["url"]: r for r in self.evidencias if r.get("ok")}

    def get(self, route, params):
        url = BASE + route + "?" + urlencode(params)
        if url in self.cache:
            return self.cache[url]
        for attempt in range(3):
            result = consultar(url)
            # Uma falha HTTP não é interpretada como ausência de registros.
            self.evidencias.append(result)
            gravar(self.folder / "requisicoes.json", self.evidencias)
            time.sleep(self.delay)
            if result.get("ok") or result.get("http_status") not in (None, 429, 500, 502, 503, 504):
                break
            if attempt < 2:
                time.sleep(2 ** attempt)
        return result

    def paginar(self, route, key, params, limit=20, max_pages=2000):
        rows, offset, fingerprints = [], 0, set()
        for _ in range(max_pages):
            result = self.get(route, {**params, "limit": limit, "offset": offset})
            batch = extrair_registros(result, key)
            if not batch:
                return rows
            fingerprint = json.dumps(batch, sort_keys=True)
            if fingerprint in fingerprints:
                raise RuntimeError("Paginação repetiu uma página; coleta interrompida")
            fingerprints.add(fingerprint)
            rows.extend(batch)
            # Observado: offset é índice de registro, apesar da documentação
            # dizer página. Algumas rotas devolvem apenas 1 item, ignorando limit.
            offset += len(batch)
        raise RuntimeError("Limite de páginas atingido; resultados não são completos")

    def mais_recente(self, route, key, municipio, reference, months):
        for month in competencias_anteriores(reference, months):
            result = self.get(route, {"co_ibge": municipio, "nu_comp": month, "limit": 2, "offset": 0})
            if extrair_registros(result, key):
                return month
        return None


def normalizar_cnes(value):
    return str(value).zfill(7)


def resumir_hospital(hospital, leitos, sih, competencia_leitos, competencia_sih):
    return {
        "cnes": normalizar_cnes(hospital["codigo_cnes"]),
        "nome": hospital["nome_fantasia"],
        "tipo_unidade": hospital["codigo_tipo_unidade"],
        "bairro": hospital.get("bairro_estabelecimento"),
        "latitude": hospital.get("latitude_estabelecimento_decimo_grau"),
        "longitude": hospital.get("longitude_estabelecimento_decimo_grau"),
        "cadastro_atualizado_em": hospital.get("data_atualizacao"),
        "centro_cirurgico_cadastrado": hospital.get("estabelecimento_possui_centro_cirurgico"),
        "centro_obstetrico_cadastrado": hospital.get("estabelecimento_possui_centro_obstetrico"),
        "centro_neonatal_cadastrado": hospital.get("estabelecimento_possui_centro_neonatal"),
        "competencia_leitos_consultada": competencia_leitos,
        "registros_leitos": len(leitos),
        "leitos_existentes": sum(r["qt_existente"] for r in leitos) if leitos else None,
        "leitos_sus": sum(r["qt_sus"] for r in leitos) if leitos else None,
        "leitos_por_tipo": leitos,
        "competencia_sih_consultada": competencia_sih,
        "producao_sih_encontrada": bool(sih),
        "amostra_sih": sih[:1],
        "ocupacao_tempo_real": "não verificada",
    }


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--municipio", default=230440, type=int)
    parser.add_argument("--referencia", type=date.fromisoformat, default=date.today())
    parser.add_argument("--meses-busca", default=12, type=int)
    parser.add_argument("--saida", default=Path("evidencias/inventario"), type=Path)
    parser.add_argument("--retomar", action="store_true", help="Reutiliza respostas válidas salvas; use somente para retomar a mesma coleta")
    args = parser.parse_args()
    collector = Coletor(args.saida, retomar=args.retomar)
    hospitais = {}
    for tipo in (5, 7):
        records = collector.paginar("/cnes/estabelecimentos", "estabelecimentos", {
            "codigo_municipio": args.municipio, "codigo_tipo_unidade": tipo, "status": 1,
        })
        for row in records:
            if row["codigo_municipio"] != args.municipio or row["codigo_tipo_unidade"] != tipo:
                raise ValueError("API retornou hospital fora dos filtros solicitados")
            hospitais[normalizar_cnes(row["codigo_cnes"])] = row
    print(f"Hospitais gerais/especializados no filtro ativo: {len(hospitais)}", flush=True)
    gravar(args.saida / "cadastros.json", list(hospitais.values()))

    bed_route = "/assistencia-a-saude/cnes-leitos"
    sih_route = "/assistencia-a-saude/sih-procedimentos-hospitalares"
    bed_month = collector.mais_recente(bed_route, "cnes_leitos", args.municipio, args.referencia, args.meses_busca)
    sih_month = collector.mais_recente(sih_route, "sih_procedimentos_hospitalares", args.municipio, args.referencia, args.meses_busca)
    if bed_month is None or sih_month is None:
        raise RuntimeError("Não localizada competência no intervalo de busca; consultar evidências")
    print(f"Competências mais recentes encontradas: leitos={bed_month}, SIH={sih_month}", flush=True)

    summary = []
    for cnes, hospital in sorted(hospitais.items()):
        leitos = collector.paginar(bed_route, "cnes_leitos", {
            "co_ibge": args.municipio, "co_cnes": cnes, "nu_comp": bed_month,
        }, limit=1000, max_pages=200)
        sih = extrair_registros(collector.get(sih_route, {
            "co_ibge": args.municipio, "co_cnes": cnes, "nu_comp": sih_month, "limit": 2, "offset": 0,
        }), "sih_procedimentos_hospitalares")
        for row in leitos + sih:
            expected_month = bed_month if "qt_existente" in row else sih_month
            if normalizar_cnes(row["co_cnes"]) != cnes or row["co_ibge"] != args.municipio or row["nu_comp"] != expected_month:
                raise ValueError("API ignorou os filtros de hospital, município ou competência")
        record = resumir_hospital(hospital, leitos, sih, bed_month, sih_month)
        summary.append(record)
        gravar(args.saida / "hospitais_parcial.json", summary)
        print(f"{cnes} | {hospital['nome_fantasia']} | leitos={record['leitos_existentes']} | SIH={bool(sih)}", flush=True)

    report = {
        "municipio": args.municipio,
        "referencia_busca": args.referencia.isoformat(),
        "escopo": "Hospitais gerais (05) e especializados (07), consultados com status=1 no CNES. Não inclui todas as clínicas, UPAs e hospitais-dia.",
        "concluido": True,
        "competencia_leitos": bed_month,
        "competencia_sih": sih_month,
        "quantidade_hospitais": len(summary),
        "hospitais_com_leitos": sum(r["registros_leitos"] > 0 for r in summary),
        "hospitais_com_producao_sih": sum(r["producao_sih_encontrada"] for r in summary),
        "limitacoes": [
            "Leitos são capacidade cadastrada, não vagas nem ocupação atual.",
            "SIH foi amostrado por hospital para confirmar acesso; não são totais de procedimentos ou pacientes.",
            "Ausência de registro na competência consultada não significa ausência de serviço.",
            "Data de coleta, data de atualização cadastral e competência de produção são distintas.",
            "Situação cadastral atual e competências históricas podem divergir.",
        ],
        "hospitais": summary,
    }
    gravar(args.saida / "hospitais.json", report)
    fields = [key for key in summary[0] if key not in {"leitos_por_tipo", "amostra_sih"}] if summary else []
    with (args.saida / "hospitais.csv").open("w", newline="", encoding="utf-8-sig") as file:
        writer = csv.DictWriter(file, fieldnames=fields, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(summary)
    print(json.dumps({key: value for key, value in report.items() if key != "hospitais"}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
