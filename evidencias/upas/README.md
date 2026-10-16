# Verificação de APIs de UPAs — 15/10/2026

## Resultado

Confirmado acesso GET público, HTTP 200, sem login, ao painel **Atendimento por Síndrome Gripal — UPA**, ID 253 do catálogo IntegraSUS. Os dados permitem acrescentar UPAs ao projeto com **indicadores históricos recentes de síndrome gripal**, sem representar fila ou ocupação ao vivo.

Painel oficial: https://integrasus.saude.ce.gov.br/#/indicadores/indicadores-coronavirus/acompanhamento-casos-upas

Coleta reproduzível em `20261016T004841Z/resumo.json`, concluída às 21h48 de 15/10/2026 em São Paulo. Período solicitado: **09/10/2026 a 15/10/2026**, inclusive. O último dia pode estar incompleto.

| UPA retornada | Atendimentos no período | Última data informada pela fonte |
| --- | ---: | --- |
| Autran Nunes | 89 | 15/10/2026 |
| Canindezinho | 80 | 15/10/2026 |
| Conjunto Ceará | 74 | 15/10/2026 |
| José Walter | 59 | 14/10/2026 |
| Messejana | 30 | 15/10/2026 |
| Praia do Futuro | 81 | 15/10/2026 |
| **Total do recorte** | **413** | Datas diferentes por unidade |

Cada contagem foi conciliada com o cartão de atendimento consultado individualmente, o agrupamento por unidade e a soma da série diária correspondente. Esses são eventos de atendimento do recorte, não uma contagem de pessoas únicas nem de pessoas presentes agora.

## Rotas testadas

Base: `https://integrasus.saude.ce.gov.br/api/acompanhamento-casos-upas/`

- `filtro-unidade`: seis unidades; a metodologia menciona nove, mas lista seis. A cobertura utilizada é exclusivamente a resposta verificada, sem inventar unidades ausentes.
- `filtro-data`: mínimo 01/01/2020 e máximo 15/10/2026; o filtro sozinho não prova que todas as unidades informaram naquele dia.
- `unidade-ultima-atualizacao`: data máxima por UPA, sem horário individual ou garantia de cadência.
- `atendimentos`: quantidade e média publicadas; filtro de UPA respeitado nos seis cartões testados.
- `unidade`: atendimentos, transferências e óbitos por unidade. A ausência de uma categoria não foi transformada em zero.
- `serie-historica-atendimentos`: comparação diária. Com `upa` preenchido, retorna linhas de **várias UPAs**; o coletor separa localmente por nome e descarta as médias móveis da comparação, que não foram validadas para cada unidade isolada.
- `classificacao-risco`: registros por data/cor; no período, **422 registros**, enquanto o cartão de atendimentos informa **413**. Esses totais não são tratados como o mesmo denominador. Não foi deduzida a causa da diferença.
- `filtro-classificacao-risco`: sete categorias retornadas, registradas na pesquisa.
- `sexo-faixa-etaria`: perfis agregados. Resposta real salva; ainda sem transformação ou conciliação detalhada no resumo.
- `transferencias`: resposta global de 7 no período, salva na pesquisa; o agrupamento por UPA também devolveu 7 no total.

Parâmetros utilizados: `dataInicio=2026-10-09`, `dataFim=2026-10-15`, `tipo=`, `upa=`, `cid=`, `classificacaoRisco=`; `upa` recebe o nome exato nos cartões individuais e na consulta de comparação. A documentação do painel delimita o contexto de síndrome gripal; filtros vazios não autorizam anunciar cobertura de todos os motivos de atendimento.

As rotas foram identificadas no código JavaScript público do próprio portal. A descoberta está registrada em `pesquisa/portal.html`, `portal-scripts.json`, `portal-main.js`, `indicadores.js`, `coronavirus.txt` e `upas-module.js`. Esses arquivos foram lidos como fonte, sem executar o código baixado. Não foi identificado contrato versionado ou SLA dessas rotas. O horário do job no catálogo é processamento, não prova de fila ao vivo ou de atualização contínua.

## Outras fontes verificadas

### Cadastro e localização — CNES

A rota federal `/cnes/estabelecimentos`, com `codigo_municipio=230440`, `codigo_tipo_unidade=73` e `status=1`, retornou **13 estabelecimentos de pronto atendimento**, incluindo 12 com nomes de UPAs e um pronto atendimento Aldeota. Portanto, 13 não foi anunciado como quantidade de UPAs. Paginação conferida até a página vazia; evidências em `pesquisa/cnes/requisicoes.json` e seleção cadastral em `pesquisa/cnes-pronto-atendimento.json`.

Correspondências nominais para as seis unidades do painel: Praia do Futuro 6985483; Autran Nunes 6999506; Messejana 7006810; Canindezinho 7018800; José Walter 7274440; Conjunto Ceará 7360851. Esse vínculo foi verificado por nome; o IntegraSUS não devolveu esses CNES na resposta do indicador. Coordenadas cadastrais disponíveis, ainda sem conferência geográfica ou da fachada real para inserção no mapa.

### Produção municipal — dados abertos de Fortaleza

A API CKAN respondeu HTTP 200 em:
https://dados.fortaleza.ce.gov.br/api/3/action/package_show?id=indicadores_producao_hospitais_upa

O conjunto lista recursos de Bom Jardim, Cristo Redentor, Edson Queiroz, Itaperi, Jangurussu e Vila Velha. Os recursos encontrados têm referência **2024**; não são monitoramento atual. Há dois recursos com o mesmo nome de Bom Jardim. `datastore_active=false`: a API fornece metadados e links CSV, sem confirmar acesso aos registros via `datastore_search`. Os downloads CSV não foram validados nesta etapa. Resposta salva em `pesquisa/fortaleza-producao.json`.

Conjunto: https://dados.fortaleza.ce.gov.br/dataset/indicadores_producao_hospitais_upa

Documentação: https://dados.fortaleza.ce.gov.br/docs-api

### Acolhimento e consultas atuais — aplicativo da Prefeitura

A Prefeitura informa, em notícia de 24/09/2026, que o aplicativo Saúde na Palma da Mão mostra acolhimento, consultas e médicos em atendimento nas UPAs:
https://www.fortaleza.ce.gov.br/noticias/saude-na-palma-da-mao-confira-os-servicos-disponiveis-no-novo-aplicativo-da-prefeitura-de-fortaleza

Isso confirma a divulgação dessas funcionalidades, **não uma API pública para integração**. O endereço web antigo `https://maissaude.sms.fortaleza.ce.gov.br/`, referenciado em notícia oficial de 2023, não resolveu DNS no ambiente desta pesquisa. Não foi confirmado endpoint público atual para esses contadores. Não foram usados login, tokens, dados de pacientes ou rotas privadas.

### Aplicativo exato indicado pelo usuário — investigação adicional

O aplicativo atual é **Saúde Na Palma Da Mão — APP**, pacote `br.gov.ce.fortaleza.sms.saudenapalmadamao`, distinto do pacote antigo `br.gov.ce.fortaleza.sms.maissaude`. A página oficial do pacote atual foi consultada com HTTP 200; HTML e metadados da requisição estão em `app-espera/play-saude-na-palma.html` e `.json`.

Google Play: https://play.google.com/store/apps/details?id=br.gov.ce.fortaleza.sms.saudenapalmadamao

App Store: https://apps.apple.com/br/app/sa%C3%BAde-na-palma-da-m%C3%A3o-app/id6761785272

A loja oficial informa suporte `android@fastmedic.com.br`, e a App Store atribui copyright à FastMedic. A política vinculada é https://sistema.saudepublica.digital/mobile.documento/politicaprivacidade/saudenapalmadamao/. Esses são vínculos comprovados do aplicativo com o fornecedor; o domínio da política não foi anunciado como endpoint da fila.

O site do próprio fornecedor confirma que seu módulo **Mobilidade para o Cidadão** oferece monitoramento de filas de UPAs e tempo estimado de atendimento: https://www.fastmedic.com.br/mobilidade-para-o-cidadao. Isso confirma a funcionalidade do produto, sem comprovar a rota, fórmula, cobertura ou atualização do contador específico de Fortaleza.

Os portais públicos ligados nas lojas também foram conferidos: `sistema.saudepublica.digital/` devolveu uma página institucional mínima, e `saude.fastmedic.com.br/` devolveu redirecionamento HTML ao site comercial da empresa. O site comercial não forneceu uma versão web do app de Fortaleza ou documentação da consulta de fila. Os HTMLs e metadados estão em `app-espera/`.

**Pendente:** localizar a requisição exata dos indicadores no aplicativo. Não foi obtido APK oficial para inspeção e não havia Android/emulador configurado (`adb`/`emulator` ausentes no PATH). O aplicativo não foi instalado ou executado, nem foram observadas suas chamadas de rede. Uma análise do APK fornecido ou da versão web, se disponibilizada, permitiria procurar a URL e os parâmetros; depois ainda seria necessário testar a consulta e a exigência de autenticação. Não existe, nesta investigação, resposta de fila validada ou integração desses contadores com a maquete.

## Reproduzir

Na raiz do projeto:

```powershell
python consultar_upas.py --inicio 2026-10-09 --fim 2026-10-15
python -m unittest -v test_consulta_saude.py test_consulta_upas.py
```

Sem datas, usa os sete dias terminando na data máxima declarada pela fonte; essa data não é necessariamente hoje. `--saida` permite escolher a pasta. O comando guarda respostas com URL, status HTTP e horário UTC. Erros e inconsistências interrompem a execução antes de gerar resumo concluído; dados de ausência ficam separados de zeros medidos.

**Validação:** 24 testes Python aprovados (18 existentes e 6 novos). A consulta real conciliou as seis UPAs e o total 413. Testes cobrem separação de unidades em respostas de comparação, duplicatas, divergências, datas fora do período, ausência versus zero e distinção entre classificação e atendimentos. Não foram alterados o frontend 3D, o snapshot dos hospitais nem as rotinas de emergência anteriores. Nenhum agendamento, backend contínuo ou publicação remota foi criado.
