"""Consultas de leitura às fontes públicas de saúde, com evidência em JSON.

Usa apenas a biblioteca padrão do Python 3.10+. Nenhuma credencial necessária.
"""

import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import sys
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import Request, urlopen


BASE = "https://apidadosabertos.saude.gov.br"


def consultar(url, timeout=30):
    """Registra horário de coleta separado das datas presentes na fonte."""
    if urlsplit(url).scheme != "https":
        raise ValueError("Use uma fonte HTTPS; a validação TLS permanece habilitada.")
    result = {"url": url, "consultado_em_utc": datetime.now(timezone.utc).isoformat()}
    request = Request(url, headers={"Accept": "application/json", "User-Agent": "PortfolioSaude/0.1 (public data research)"})
    try:
        with urlopen(request, timeout=timeout) as response:
            result["http_status"] = response.status
            result["content_type"] = response.headers.get("Content-Type", "")
            raw = response.read().decode("utf-8-sig")
        try:
            result["dados"] = json.loads(raw)
            result["ok"] = True
        except json.JSONDecodeError:
            result.update(ok=False, erro="Resposta não é JSON", texto=raw[:2000])
    except HTTPError as exc:
        result.update(ok=False, http_status=exc.code, erro=str(exc), texto=exc.read().decode("utf-8", errors="replace")[:1000])
    except (URLError, TimeoutError, OSError) as exc:
        result.update(ok=False, http_status=None, erro=str(exc))
    return result


def gravar(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding="utf-8")


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", required=True, help="URL pública completa; somente GET")
    parser.add_argument("--saida", required=True, type=Path, help="Arquivo JSON de evidência")
    args = parser.parse_args()
    result = consultar(args.url)
    gravar(args.saida, result)
    summary = {key: value for key, value in result.items() if key not in {"dados", "texto"}}
    data = result.get("dados")
    if isinstance(data, dict):
        summary["listas"] = {key: {"quantidade": len(value)} for key, value in data.items() if isinstance(value, list)}
    elif isinstance(data, list):
        summary["quantidade"] = len(data)
    summary["arquivo"] = str(args.saida)
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0 if result["ok"] else 1


if __name__ == "__main__":
    sys.exit(main())
