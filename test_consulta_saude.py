"""Verificações locais de paginação e significado dos dados, sem acesso à rede."""

from datetime import date
import unittest

from inventariar_hospitais import (
    Coletor, competencias_anteriores, extrair_registros,
    normalizar_cnes, resumir_hospital,
)
from consultar_integrasus import resumir_leitos, resumir_emergencia


class ColetorFake(Coletor):
    def __init__(self, records, page_size):
        self.records = records
        self.page_size = page_size
        self.offsets = []

    def get(self, route, params):
        offset = params["offset"]
        self.offsets.append(offset)
        return {"ok": True, "dados": {"items": self.records[offset:offset + self.page_size]}}


class ConsultaTests(unittest.TestCase):
    def test_cnes_preserva_zero_inicial(self):
        self.assertEqual(normalizar_cnes(86673), "0086673")

    def test_competencia_atravessa_ano(self):
        self.assertEqual(competencias_anteriores(date(2026, 2, 1), 4), [202602, 202601, 202512, 202511])

    def test_paginas_curtas_nao_encerram_coleta(self):
        collector = ColetorFake([{"id": n} for n in range(3)], 1)
        rows = collector.paginar("/test", "items", {}, limit=1000)
        self.assertEqual(len(rows), 3)
        self.assertEqual(collector.offsets, [0, 1, 2, 3])

    def test_offset_avanca_numero_de_registros(self):
        collector = ColetorFake([{"id": n} for n in range(5)], 2)
        self.assertEqual(len(collector.paginar("/test", "items", {})), 5)
        self.assertEqual(collector.offsets, [0, 2, 4, 5])

    def test_falha_http_nao_vira_lista_vazia(self):
        with self.assertRaises(RuntimeError):
            extrair_registros({"ok": False, "url": "https://example.org", "erro": "HTTP 500"}, "items")

    def test_resposta_inesperada_falha(self):
        with self.assertRaises(ValueError):
            extrair_registros({"ok": True, "dados": {"erro": "não é lista"}}, "items")

    def test_sem_registro_nao_e_zero(self):
        hospital = {"codigo_cnes": 1, "nome_fantasia": "Hospital de teste", "codigo_tipo_unidade": 5}
        result = resumir_hospital(hospital, [], [], 202607, 202606)
        self.assertIsNone(result["leitos_existentes"])
        self.assertFalse(result["producao_sih_encontrada"])
        self.assertEqual(result["ocupacao_tempo_real"], "não verificada")

    def test_soma_capacidade_por_tipo(self):
        hospital = {"codigo_cnes": 1, "nome_fantasia": "Hospital de teste", "codigo_tipo_unidade": 5}
        result = resumir_hospital(hospital, [{"qt_existente": 10, "qt_sus": 8}, {"qt_existente": 5, "qt_sus": 2}], [], 202607, 202606)
        self.assertEqual(result["leitos_existentes"], 15)
        self.assertEqual(result["leitos_sus"], 10)

    def test_limite_nao_retorna_coleta_parcial_como_completa(self):
        collector = ColetorFake([{"id": n} for n in range(5)], 1)
        with self.assertRaises(RuntimeError):
            collector.paginar("/test", "items", {}, max_pages=2)

    def test_pagina_repetida_interrompe(self):
        collector = ColetorFake([{"id": 1}, {"id": 1}], 1)
        with self.assertRaises(RuntimeError):
            collector.paginar("/test", "items", {})


class IntegraSUSTests(unittest.TestCase):
    def leito(self, **changes):
        return {"unidade": "HGF - Hospital Geral de Fortaleza", "clinica": "UTI de teste", "quantidadeOcupada": 8, "quantidadeLivre": 2, "total": 10, **changes}

    def test_ocupacao_do_recorte(self):
        result = resumir_leitos([self.leito()])[0]
        self.assertEqual(result["taxa_ocupacao_recorte_pct"], 80)
        self.assertEqual(result["cnes"], "2497654")

    def test_nao_inclui_outros_municipios(self):
        self.assertEqual(resumir_leitos([self.leito(unidade="HRC - Hospital Regional Cariri")]), [])

    def test_divergencia_nos_totais_falha(self):
        with self.assertRaises(ValueError):
            resumir_leitos([self.leito(total=15)])

    def test_clinica_duplicada_nao_dobra_total(self):
        with self.assertRaises(ValueError):
            resumir_leitos([self.leito(), self.leito()])

    def test_denominador_zero_nao_vira_percentual(self):
        result = resumir_leitos([self.leito(quantidadeOcupada=0, quantidadeLivre=0, total=0)])[0]
        self.assertIsNone(result["taxa_ocupacao_recorte_pct"])

    def test_emergencia_sem_dado_nao_vira_zero(self):
        self.assertEqual(resumir_emergencia({"dados": []}, "HGF"), {"hospital": "HGF", "disponivel": False})

    def test_emergencia_de_hospital_diferente_falha(self):
        with self.assertRaises(ValueError):
            resumir_emergencia({"dados": [{"hospital": "HM"}]}, "HGF")

    def test_emergencia_deriva_total_das_faixas(self):
        result = resumir_emergencia({"dados": [{"hospital": "HGF", "qtdmaior24h": 2, "qtdmenorigual24h": 8}], "consultado_em_utc": "2026-10-15T21:00:00Z", "url": "https://example.org"}, "HGF")
        self.assertEqual(result["total_derivado_das_faixas"], 10)
        self.assertEqual(result["percentual_acima_24h"], 20)


if __name__ == "__main__":
    unittest.main()
