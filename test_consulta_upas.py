"""Testes do significado e da separação dos agregados de UPAs, sem rede."""
from copy import deepcopy
from datetime import date
import unittest

from consultar_upas import contagem, resumir_upas


class UpasTests(unittest.TestCase):
    def setUp(self):
        self.day = date(2026, 10, 14)
        self.responses = {
            "filtro-unidade": [{"unidade": "UPA A"}, {"unidade": "UPA B"}],
            "unidade-ultima-atualizacao": [{"unidade": "UPA A", "maxDate": "2026-10-14"}],
            "serie-historica-atendimentos": [
                {"unidade": "UPA A", "data": "14/10/2026", "quantidade": 2, "mediaMovel": 999},
                {"unidade": "UPA B", "data": "14/10/2026", "quantidade": 3, "mediaMovel": 999},
            ],
            "unidade": [{"unidade": "UPA A", "tipoAtendimento": "Atendimento", "quantidade": 2},
                        {"unidade": "UPA B", "tipoAtendimento": "Atendimento", "quantidade": 3},
                        {"unidade": "UPA A", "tipoAtendimento": "Transferência", "quantidade": 1}],
            "atendimentos": {"quantidade": 5},
            "classificacao-risco": [{"data": "2026-10-14", "classificacaoRisco": "VERDE", "quantidade": 6}],
        }
        self.cards = {"UPA A": {"quantidade": 2}, "UPA B": {"quantidade": 3}}

    def summarize(self):
        return resumir_upas(self.responses, self.cards, self.day, self.day)

    def test_separa_comparacao_sem_duplicar_outros_locais(self):
        report = self.summarize()
        self.assertEqual([u["atendimentos_no_periodo"] for u in report["upas"]], [2, 3])
        self.assertEqual(report["upas"][0]["serie_diaria"], [{"data": "2026-10-14", "quantidade": 2}])
        self.assertNotIn("mediaMovel", report["upas"][0]["serie_diaria"][0])

    def test_classificacao_diferente_nao_vira_percentual_de_atendimentos(self):
        report = self.summarize()
        self.assertEqual(report["registros_classificacao_risco"], 6)
        self.assertEqual(report["atendimentos_no_periodo"], 5)
        self.assertFalse(report["classificacao_confere_com_atendimentos"])

    def test_ausencias_nao_viram_zero(self):
        unit = self.summarize()["upas"][1]
        self.assertIsNone(unit["transferencias_no_periodo"])
        self.assertIsNone(unit["obitos_no_periodo"])
        self.assertIsNone(unit["ultima_data_informada"])

    def test_zero_confirmado_preservado(self):
        self.cards["UPA B"]["quantidade"] = 0
        self.responses["atendimentos"]["quantidade"] = 2
        self.responses["serie-historica-atendimentos"][1]["quantidade"] = 0
        self.responses["unidade"][1]["quantidade"] = 0
        self.assertEqual(self.summarize()["upas"][1]["atendimentos_no_periodo"], 0)

    def test_rejeita_contagens_invalidas(self):
        for value in [None, True, -1, 1.5, "3"]:
            with self.subTest(value=value), self.assertRaises(ValueError):
                contagem(value)

    def test_rejeita_soma_incorreta_duplicatas_e_datas_fora(self):
        original = deepcopy(self.responses)
        for mutate in [lambda r: r["serie-historica-atendimentos"].append(r["serie-historica-atendimentos"][0]),
                       lambda r: r["atendimentos"].update(quantidade=9),
                       lambda r: r["serie-historica-atendimentos"][0].update(data="15/10/2026"),
                       lambda r: r["unidade"].append(r["unidade"][0]),
                       lambda r: r["filtro-unidade"].append(r["filtro-unidade"][0]),
                       lambda r: r["unidade-ultima-atualizacao"].append(r["unidade-ultima-atualizacao"][0])]:
            self.responses = deepcopy(original)
            mutate(self.responses)
            with self.assertRaises(ValueError):
                self.summarize()


if __name__ == "__main__":
    unittest.main()
