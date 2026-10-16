# maquete-hospitais-fortaleza

**Fortaleza em movimento:** cidade 3D interativa com 78 hospitais, interiores
ilustrativos exploráveis e dados públicos de saúde. Desenvolvido em React,
Three.js e Python, a partir do projeto
[site-demandas](https://github.com/andersonrodrigod/site-demandas).

## Executar a maquete

Requisitos: Node.js compatível com Vite 8 (22.12+ ou 24+) e npm. Para os
coletores e testes de dados, Python 3.10+ sem dependências externas.

```powershell
git clone https://github.com/andersonrodrigod/maquete-hospitais-fortaleza.git
cd maquete-hospitais-fortaleza/previa-3d
npm ci
npm run dev
```

Abra http://127.0.0.1:4173/. `npm test` executa os testes do frontend;
`npm run build` gera a versão estática em `previa-3d/dist/`.
As instruções de navegação, fontes e importação estão em
[previa-3d/README.md](previa-3d/README.md).

O site inclui a ocupação coletada para sete hospitais e a permanência na
emergência do HGF e do Messejana. A pesquisa de UPAs está em
[evidencias/upas/README.md](evidencias/upas/README.md); ainda não foi integrada
à maquete. A aplicação usa consultas salvas em JSON, sem atualização automática.
Arquitetura, ruas, andares e posições dos leitos são ilustrativos. Os recortes
CNES e IntegraSUS permanecem separados; a ausência de dados não vira zero.

O repositório contém código, testes, respostas públicas necessárias à
reprodução e capturas de validação. Dependências, compilações, ferramentas locais,
cópias de terceiros em HTML/JavaScript/PDF e quadros extraídos do vídeo de
diagnóstico ficam ignorados. O envio ao GitHub não configura a hospedagem
no GitHub Pages.

## Pesquisa de APIs de saúde — Fortaleza

Pesquisa executável em Python, validada em 15/10/2026. Usa somente a biblioteca
padrão (Python 3.10+). Não requer chave, login ou dependências externas.

Os scripts e a maquete foram criados localmente. As seções abaixo preservam os
resultados históricos da pesquisa, com o horário de cada coleta identificado.

## Resultado principal

**É viável consultar indicadores públicos recentes do IntegraSUS via Python.**
Não são APIs próprias de cada hospital: o IntegraSUS concentra os indicadores.

O endpoint público `perspectiva-central-hospitalar/informacoes-hospitalares`
retornou 80 registros de clínicas, distribuídos por 11 unidades no Ceará.
Sete dessas unidades ficam em Fortaleza. Os vínculos CNES abaixo foram conferidos
no inventário do município 230440:

| Hospital | CNES | Indicador confirmado |
|---|---|---|
| Hospital Geral de Fortaleza — HGF | 2497654 | Ocupados/livres por clínica + permanência na emergência |
| Hospital de Messejana — HM | 2479214 | Ocupados/livres por clínica + permanência na emergência |
| Hospital Geral Waldemar de Alcântara — HGWA | 2785900 | Ocupados/livres por clínica |
| Hospital Estadual Leonardo da Vinci — HELV | 0086673 | Ocupados/livres por clínica |
| Hospital São José de Doenças Infecciosas — HSJ | 2561417 | Ocupados/livres por clínica |
| Hospital de Saúde Mental Professor Frota Pinto — HSM | 2480026 | Ocupados/livres por clínica |
| Hospital Universitário do Ceará — HUC | 4963938 | Ocupados/livres por clínica |

O inventário federal foi concluído: 78 cadastros no recorte, todos com registros
de leitos em julho/2026; 40 com produção SIH encontrada na competência junho/2026.
Essas foram as competências mais recentes encontradas nas rotas consultadas,
pesquisando de outubro/2026 para trás. Não se confundem com o painel recente estadual.

### Fotografia confirmada às 18h53 de 15/10/2026 (Fortaleza)

| Hospital | Ocupados no recorte | Livres no recorte | Clínicas retornadas |
|---|---:|---:|---:|
| HGF | 306 | 7 | 14 |
| Messejana | 86 | 1 | 7 |
| Waldemar de Alcântara | 321 | 39 | 10 |
| Leonardo da Vinci | 146 | 5 | 3 |
| São José | 90 | 16 | 4 |
| Saúde Mental Professor Frota Pinto | 165 | 3 | 3 |
| Universitário do Ceará | 84 | 6 | 3 |

Evidência: `evidencias/integrasus/20261015T215341Z/resumo.json` e `leitos.json`.
No indicador de emergência, a mesma coleta retornou HGF: 2 acima de 24h e 17 até
24h; HM: 0 acima de 24h e 7 até 24h. São os contadores no filtro padrão do painel,
não novas admissões nem a soma de todos os pacientes internados no hospital.

### Frequência e significado

- **Emergência HGF/HM:** a metodologia atual informa atualização a cada 15 minutos.
  Foram obtidos contadores de pacientes com permanência até 24 horas e acima de 24 horas.
  Não são tempo de espera para triagem nem contagem de novas internações.
- **Leitos rede SESA:** o código público atual do painel consulta a fonte a cada
  5 minutos. O catálogo indicou processamento às 18:43:34 e depois às 18:53:31
  de 15/10/2026, horário de Fortaleza. Não há timestamp individual por hospital
  ou leito na resposta; isso não garante que cada unidade atualize a cada 5 minutos.
- **Recorte:** os totais são a soma das clínicas retornadas, e não necessariamente
  a capacidade de todo o hospital. Por exemplo, HGF retornou 313 leitos nesse
  recorte, enquanto o CNES de julho/2026 registra 602. São medidas e datas diferentes.
- **Maternidades:** filtros e datas acessíveis, com intervalo até 15/10/2026.
  Metodologia informa atualização horária do painel e alimentação manhã/noite.
  Não foi feita validação dos contadores atuais de cada maternidade. O filtro
  contém rótulos vazios/ambíguos; presença no filtro não prova cobertura atual.
- **Ambulâncias:** não foi confirmada API pública de GPS ou deslocamento.

O horário do job é do processamento da fonte; o horário de coleta é do script.
Ocupação é uma fotografia do estado informado. Campo "livre" não garante vaga
acessível ao público nem substitui a regulação.

## Executar

No PowerShell, nesta pasta:

```powershell
python consultar_integrasus.py
```

Cria uma nova pasta `evidencias/integrasus/AAAAMMDDTHHMMSSZ/` por execução, com
respostas brutas e `resumo.json`, preparado para uma futura interface. O resumo
seleciona os sete hospitais de Fortaleza e deriva a taxa de ocupação apenas do
recorte recebido. Falha explicitamente em duplicidade de clínica, valores
inválidos ou inconsistência entre ocupados, livres e total. Consulta apenas
painéis marcados como públicos e ativos no catálogo.

Para conferir o inventário federal de hospitais, capacidade e presença de produção SIH:

```powershell
python inventariar_hospitais.py --referencia 2026-10-15
```

O script busca a competência mais recente com dados, retrocedendo até 12 meses.
Município, referência, janela de busca e pasta de saída são configuráveis. O filtro
inclui hospitais gerais (05) e especializados (07), com `status=1`; não é uma
lista de todos os equipamentos assistenciais. CNES é normalizado para sete dígitos.

Produz `evidencias/inventario/hospitais.json`, `hospitais.csv`, `cadastros.json`,
`hospitais_parcial.json` e `requisicoes.json`. O arquivo parcial não confirma
conclusão da coleta. O JSON final traz `concluido=true` e a competência consultada.
SIH é uma **amostra por hospital para confirmar presença**, não um total de
pacientes, internações ou procedimentos. Ausência na competência é `false` para
"registro encontrado" e `null` para capacidade desconhecida, nunca um zero inventado.

A API federal por vezes devolve somente um registro, mesmo solicitando 1000.
O script avança pelo número recebido até uma página vazia; não interrompe por
página curta. Na prática, `offset` é índice de registro, apesar de a documentação
descrevê-lo como página. As respostas por hospital são verificadas contra os
filtros solicitados. Desconexões/429/5xx têm até três tentativas.

Se uma coleta for interrompida, retome **a mesma coleta**, preservando os filtros:

```powershell
python inventariar_hospitais.py --referencia 2026-10-15 --retomar
```

`--retomar` reutiliza respostas válidas e seus horários originais. Não o use para
obter uma nova fotografia atualizada. Para nova coleta federal, use outra pasta
com `--saida evidencias/inventario_novo` e omita `--retomar`. Assim, um JSON final
de uma execução antiga não é confundido com uma coleta nova interrompida.

Para testar uma rota individual:

```powershell
python consultar_saude.py --url 'https://integrasus.saude.ce.gov.br/api/perspectiva-central-hospitalar/informacoes-hospitalares' --saida evidencias/consulta_individual.json
```

O cliente salva status HTTP, URL, horário UTC, resposta e erros. Usa GET e validação
TLS padrão. Não há login nem consulta a prontuários. O tráfego feito nesta pesquisa
foi somente leitura de dados públicos agregados/cadastrais.

## Indicadores recomendados para o primeiro painel 3D

1. Ocupados, livres e taxa de ocupação **por clínica** dos sete hospitais.
2. Permanência acima de 24 horas nas emergências HGF/HM, com o filtro explícito.
3. Data da fonte e horário da coleta visíveis; dado indisponível separado de zero.
4. Evolução da ocupação a partir de fotografias que passarmos a guardar. O coletor
   atual cria fotografias locais quando executado; não foi agendada nenhuma rotina.

Pode-se executar Python periodicamente, guardar as fotografias e publicar um JSON
para o site 3D consumir. Não se deve consultar a fonte a cada quadro de animação ou
por visitante. Antes de uma publicação contínua, observar estabilidade, alterações
de esquema e cadência efetiva. Não foi identificado contrato versionado ou SLA dessas
rotas do IntegraSUS; foram descobertas no JavaScript público que alimenta os painéis.

## Fontes verificadas

Pesquisa de UPAs: [relatório e evidências](evidencias/upas/README.md). O novo
`consultar_upas.py` consulta indicadores públicos de síndrome gripal para seis
UPAs de Fortaleza, com datas por unidade e contagens conciliadas por cartão,
agrupamento e série diária. Isso não informa fila ou ocupação ao vivo. Consulte
o relatório para cobertura, limitações e distinção em relação ao aplicativo da
Prefeitura. Os dados ainda não foram incorporados à maquete.

- [Catálogo público IntegraSUS](https://integrasus.saude.ce.gov.br/api-adm/dashboard-area/)
- [Leitos rede SESA](https://integrasus.saude.ce.gov.br/#/indicadores/indicadores-regulacao/perspectiva-central-hospitalar)
- [Emergência HGF](https://integrasus.saude.ce.gov.br/#/indicadores/indicadores-hospitalares/pacientes-em-atendimento-emergencia-hgf)
- [Emergência HM](https://integrasus.saude.ce.gov.br/#/indicadores/indicadores-hospitalares/pacientes-em-atendimento-emergencia-hm)
- [Obstetrícia/neonatal](https://integrasus.saude.ce.gov.br/#/indicadores/indicadores-regulacao/acomp-diario-leitos-obstetricia-neonatal)
- [Documentação API federal](https://apidadosabertos.saude.gov.br/static/swagger.json)

A rota federal antiga `assistencia-a-saude/hospitais-e-leitos?uf=CE` retornou HTTP
500. As rotas `cnes/estabelecimentos`, `assistencia-a-saude/cnes-leitos` e
`assistencia-a-saude/sih-procedimentos-hospitalares` retornaram HTTP 200 com dados.
O endereço antigo da área 11 do IntegraSUS devolveu corpo vazio; o catálogo atual
permitiu localizar as páginas e APIs corretas.

## Validação

```powershell
python -m unittest -v test_consulta_saude.py
python -m unittest -v test_consulta_upas.py
```

18 testes locais passaram. Testa paginação curta, offset, ausência de registros, falhas HTTP, CNES, competência,
duplicidade de clínica, consistência dos totais e interpretação dos contadores de
emergência. As consultas reais ficam registradas em `evidencias/`. Não foi testada
disponibilidade contínua nem integração com o frontend 3D nesta etapa.

Mais 6 testes do coletor de UPAs passaram, totalizando 24 na execução conjunta.
Os detalhes dessa consulta estão em `evidencias/upas/README.md`.
