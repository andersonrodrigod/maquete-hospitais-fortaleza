# Fortaleza em movimento · cidade ampliada e hospitais exploráveis

Protótipo local derivado de `site-demandas`, com bairro florido e interior explorável. O design usa as referências fornecidas: fachadas creme e pêssego, vidro azul, jardins volumosos, flores, camas azuis, portas turquesa, armários, monitores e suportes de soro. Quartos, alas, corredores, postos de enfermagem e espera foram criados para a maquete, com autorização do usuário. **Não reproduzem a planta do HGF ou dos demais hospitais.** Há duas fontes separadas: ocupação monitorada IntegraSUS e registros cadastrados CNES.

## Abrir e compilar

```powershell
cd previa-3d
npm ci
npm run dev
```

Endereço local: http://127.0.0.1:4173/. `npm run build` gera `dist/`; `npm run preview` serve a compilação na mesma porta, após encerrar o servidor de desenvolvimento. `npm test` confere a correspondência entre fonte e geometria.

## Cidade ampliada

O antigo terreno de 60 × 48 unidades foi substituído por uma cidade contínua de **1.050 × 798 unidades virtuais**, aproximadamente **291 vezes a área anterior**. São 520 quadras, com ruas interligadas, prédios, jardins, praças e carros animados. Os 78 hospitais do inventário possuem um complexo clicável, com variação de volumes, altura, fachada e cobertura. A altura e a forma são escolhas gráficas, não medidas ou plantas reais.

As coordenadas, bairros e endereços vêm de `../evidencias/inventario/cadastros.json`, coletado anteriormente do CNES. As coordenadas originais permanecem nos dados. A projeção é ajustada a quadras de 42 unidades e pontos próximos são afastados de forma determinística para os complexos não se sobreporem. **É um mapa esquemático: ruas, distâncias visuais, praças, fachadas e entorno não reproduzem a malha urbana real.** Dados cadastrais podem estar desatualizados; o campo `location.registryUpdatedAt` conserva a data informada pelo cadastro.

Na lista lateral, busque nome, bairro ou CNES, com ou sem acentos, ou filtre os sete hospitais com ocupação monitorada. Clicar no resultado ou no prédio leva a câmera à unidade; `Entrar neste hospital` abre seus próprios andares e dados. Em janelas menores, a lista recolhe após a escolha e pode ser reaberta. `Ver cidade inteira` afasta a câmera para o território completo; `Ir ao HGF` aproxima novamente a região inicial. É possível arrastar, girar e aproximar livremente em toda a cidade.

O arraste externo ocorre no plano horizontal das ruas, preservando a altura da câmera. A distância da câmera ortográfica considera a diagonal de toda a cidade, independentemente do zoom: isso evita que o plano de corte atravesse o terreno e esconda parte da maquete ao arrastar, afastar ou girar. A movimentação vertical no interior dos hospitais é preservada para explorar os andares.

Janelas, vegetação e acessórios distantes são simplificados e aparecem ao aproximar. Todos os hospitais permanecem clicáveis mesmo na visão distante. O interior detalhado só é montado ao entrar no hospital escolhido. Carros, profissionais andando e tráfego são decorativos, sem localização em tempo real.

## O que está disponível

- Cidade com canteiros, árvores floridas, 78 complexos hospitalares e lista de busca. Mouse esquerdo arrasta, direito gira e scroll aproxima. A pausa controla pessoas, veículos e o avanço do passeio automático.
- `Entrar no hospital` abre o interior da unidade selecionada. O seletor interno também permite consultar os 78 estabelecimentos do inventário CNES de hospitais gerais/especializados em Fortaleza. O inventário não inclui todas as UPAs, clínicas e hospitais-dia.
- A opção inicial **Ocupação monitorada** usa os totais por clínica do IntegraSUS: uma pessoa deitada por ocupado e uma cama vazia com identificação turquesa por livre. Na coleta HGF: **308 ocupados + 5 livres = 313 camas 3D**, distribuídas em quatro andares ilustrativos. O botão dos vazios percorre cada cama livre na vista atual. Contagens do painel acompanham o filtro de andar ou clínica.
- A opção **Cadastro CNES** mantém os 602 registros do HGF em seis andares ilustrativos, 22 alas e 152 quartos de até quatro leitos: **128 + 124 + 128 + 106 + 100 + 16 = 602**. São camas cinza, sem pacientes inventados: ocupação desconhecida não significa vaga livre. Hospitais sem cobertura IntegraSUS usam esse modo e informam a ausência de dados.
- Vista explodida com todos os andares; cada laje mostra sua quantidade e um marcador clicável. O seletor permite isolar qualquer andar e ver a quantidade presente nessa vista, separada do total do cadastro. A planta superior abre um andar individual para evitar sobreposição vertical. Filtros de categoria preservam os identificadores e as posições dos leitos.
- Ao entrar, o prédio aparece montado, com fachadas, janelas, entrada e teto. Uma sequência de 7,2 segundos desprende o teto, afasta os quatro painéis de cada pavimento e separa os andares, enquanto a câmera acompanha. `Remontar prédio` executa a trajetória inversa e mantém o edifício fechado na tela; `Abrir andares` abre novamente. `Repetir abertura` reinicia a apresentação. `Concluir animação` salta para o estado final correspondente, e a pausa congela também essa transformação.
- Os mesmos leitos, quartos e personagens são agrupados por pavimento e movidos durante a abertura; não há substituição por uma imagem. A fachada é ilustrativa e usa a mesma linguagem gráfica do restante da maquete. A navegação interna é liberada ao final para não interromper a câmera da apresentação; o botão de voltar ao bairro continua disponível.
- Alas com corredor central, quartos laterais com portas e janelas, postos com computadores, armários, bancadas e espera. Galerias abertas conectam as alas. Paredes baixas e ausência de teto permitem observar os leitos. Áreas sem camas recebem mobiliário de apoio, sem acrescentar leitos fictícios. Geometrias instanciadas compartilham janelas, vegetação, camas e acessórios para reduzir chamadas de desenho.
- Seletor de ala, atalhos para aproximar cada quarto, clique em qualquer leito, anterior/próximo e passeio automático com avanço entre alas a cada oito segundos. Interagir com a câmera encerra o passeio; a pausa o suspende.
- Quartos, numeração e profissionais andando são decorativos. Pessoas deitadas representam somente a **quantidade agregada de ocupados por clínica na coleta**. A API não identifica pacientes, camas, quartos ou andares: a colocação das pessoas é simbólica, não rastreamento individual. Não se atribuem andares reais.
- As fachadas da cidade usam cinco famílias de volumes com variações por estabelecimento. A representação é ilustrativa; escolher uma unidade abre sua contagem própria, sem afirmar fidelidade arquitetônica.

## Fontes e limites

**Capacidade cadastrada:** API de Dados Abertos do Ministério da Saúde, rota `/assistencia-a-saude/cnes-leitos`, competência **202607**. Evidências originais em `../evidencias/inventario/`. Esta é a competência encontrada na coleta, não uma afirmação de disponibilidade atual.

O HGF possui, na coleta usada, **469 leitos excluindo complementares e 133 complementares**. A cena pode exibir os **602 símbolos da soma das categorias**, mantendo os complementares separados e identificados, conforme a distinção do CNES. O total não informa ocupação, vagas acessíveis ou quantidade física por andar. Ficha oficial: https://cnes2.datasus.gov.br/Mod_Hospitalar.asp?VCo_Unidade=2304402497654.

**Ocupação em outro recorte:** IntegraSUS, `api/perspectiva-central-hospitalar/informacoes-hospitalares`. Coleta usada: `../evidencias/integrasus/20261016T003434Z/`, às **21:34 de 15/10/2026, horário de São Paulo**. O HGF tinha **313 leitos no recorte**, com 305 ocupados e 8 livres. Isso não é o total cadastrado do HGF e não foi somado ao CNES. Esse recorte está disponível para sete hospitais do inventário. Nos demais, ausência de cobertura é explícita, sem usar zero como substituto.

## Emergência

O botão **Emergência** está disponível no mapa, na ficha do prédio e na barra do interior. Abre um painel com atalhos para HGF e Messejana, total derivado das duas faixas de permanência, contagens até 24 horas e acima de 24 horas, percentual acima de 24 horas, data da consulta e links para painel oficial e API. Em hospitais sem cobertura, a interface informa ausência de dados, sem inventar zero.

Coleta de **15/10/2026 às 21:34:35 (São Paulo)**: HGF, 20 pacientes no recorte (18 até 24h, 2 acima de 24h); Messejana, 7 (7 até 24h, 0 acima de 24h). Consulta `isExtra=false`, filtros de clínica, município e CID vazios. A metodologia do IntegraSUS informa cadência de 15 minutos; **o site exibe uma consulta salva e não atualiza automaticamente**. O horário é de consulta, não de atualização individual de pacientes.

Esses contadores não são fila ou previsão de espera e não cobrem necessariamente toda a emergência ou todos os internados. Não são somados à ocupação de leitos, nem acrescentam personagens à maquete: pode haver sobreposição dos recortes e a fonte não identifica pessoas ou camas.

Arquivos desta integração: `src/emergency-panel.jsx` apresenta o painel; `src/emergency-data.js` valida e relaciona as fontes ao CNES; `src/emergency-data.test.js` testa mapeamento, somas, ausência versus zero e rejeição de recortes inválidos. `scripts/prepare-data.mjs` incorpora os dados e ignora pastas de tentativas sem resumo concluído, preservando falhas explícitas para resumos inválidos. `src/main.jsx`, `src/city-directory.jsx` e `src/style.css` adicionam acesso e apresentação responsiva; `package.json` inclui os testes; `src/data/hospitals.json` e `dist/` são gerados. O coletor Python existente foi reutilizado sem alteração.

Validação desta integração: **23 testes JavaScript e 18 testes Python aprovados**, além de `npm run prepare-data` e `npm run build`. Navegador: contagens HGF/Messejana, metodologia, hospital sem cobertura, acesso pelo interior, fechamento por Escape e tamanho 390 × 844 sem rolagem horizontal ou erros de console. Capturas em `validacao/emergencia-hgf.png` e `validacao/emergencia-mobile.png`. Não validada atualização automática (não implementada) nem uso em celular físico. Permanece o aviso existente de tamanho do pacote 3D na compilação.

A interface informa fonte, competência e data de coleta. São snapshots incorporados à aplicação; o navegador não consulta automaticamente as APIs. A atualização do processamento da fonte não é necessariamente o horário de atualização de cada hospital.

A pesquisa pública encontrou referências pontuais a andares, mas não um mapa atual completo de leitos por andar/quarto. Após autorizar explicitamente uma distribuição inventada, o usuário recebeu este interior ilustrativo que preserva as contagens do cadastro. Documentação da pesquisa em `../evidencias/arquitetura/`.

O Plano Operativo HGF de 2022 relata sobreposição histórica de habilitações de UTI neonatal. Isso exige conciliação com a instituição para obter camas físicas distintas; não permite deduzir automaticamente uma correção para os registros de 2026. A interface deixa explícita essa limitação. A ocupação IntegraSUS não é extrapolada para os 602 registros CNES; a diferença entre as fontes não vira camas disponíveis.

## Atualizar a importação

Na raiz `portfolio`, execute os coletores Python existentes quando for necessário atualizar as evidências. Para IntegraSUS:

```powershell
python consultar_integrasus.py
```

Depois, nesta pasta:

```powershell
npm run prepare-data
npm test
npm run build
```

`prepare-data` usa o inventário CNES concluído e a pasta de coleta IntegraSUS mais recente. Para selecionar uma coleta: `node scripts/prepare-data.mjs 20261015T231351Z`. O comando valida registros, totais ocupados/livres, somas e duplicatas antes de substituir o JSON. Uma nova competência CNES exige atualizar o inventário com o coletor correspondente; recompilar sozinho não atualiza a fonte.

## Código

- `scripts/prepare-data.mjs`: importa evidências, valida códigos, competências, contagens e duplicatas; incorpora coordenadas, bairro, endereço e data cadastral, sem copiar telefones ou e-mails.
- `src/data/hospitals.json`: snapshot gerado das fontes públicas.
- `src/bed-layout.js`: distribui registros em andares, alas e quartos ilustrativos, preservando cada unidade e os restos de divisões por quatro/trinta e dois. Coordenadas verticais, centro e enquadramento são calculados para o modelo visível.
- `src/scene-data.js`: seleciona o recorte e valida a soma por clínica, sem misturar IntegraSUS com CNES; `scene-data.test.js` confere ocupados, vazios e desconhecidos.
- `src/city-layout.js`: projeção, afastamento entre complexos, limites da cidade e busca por termos normalizados. `src/city-layout.test.js` confere destinos, lotes sem sobreposição, vias conectadas, pesquisa, simplificação e vínculo com os dados de cada unidade.
- `src/city-camera.js`: distância segura da câmera para o território completo; `src/city-camera.test.js` verifica que chão e coberturas dos 78 hospitais ficam dentro dos planos de profundidade, inclusive ao afastar e girar a vista.
- `src/city-geometry.js`: geração instanciada de ruas, complexos hospitalares, entorno e vegetação, com simplificação por distância.
- `src/city-world.jsx`: cidade, destinos clicáveis, rótulos sem sobreposição, tráfego animado e atualização do detalhe conforme a câmera. `src/city-directory.jsx`: busca lateral e filtro de cobertura.
- `src/bed-visuals.js`: única lista usada pelo desenho e pelos testes; cria uma pessoa por ocupado e nenhuma em camas livres ou desconhecidas.
- `src/bed-map.jsx`: camas e mobiliário instanciados, sombras, paredes, galerias, postos, caminhada nos corredores e seleção individual; `instances.jsx` compartilha desenho de vegetação, pessoas e janelas.
- `src/building-animation.js`, `src/building-motion.jsx`: trajetória reversível, etapas, duração, pausa e normalização das coordenadas locais de cada andar.
- `src/hospital-envelope.jsx`: quatro painéis de fachada por pavimento, teto, entrada, janelas e suas animações.
- `src/building-animation.test.js`: posição final dos andares, fechamento das fachadas e preservação de todos os leitos nos grupos animados.
- `src/bed-layout.test.js`: correspondência das contagens para os 78 hospitais, separação dos recortes, associação dos leitos aos quartos, circulação livre e alas sem sobreposição.
- `src/flowers.jsx`: canteiros instanciados e árvores floridas.
- `src/city.jsx`, `src/main.jsx`, `src/style.css`: cena, câmera, navegação, informação de fonte e interface responsiva.
- `src/primitives.jsx`, `src/traffic.jsx`: componentes derivados de [site-demandas, commit 53948d4](https://github.com/andersonrodrigod/site-demandas/tree/53948d483531e9824c097bda73ae3a4ac122a439). O texto das placas foi ajustado para legibilidade. A ambulância não usa marca de operadora privada.

## Verificação e pendências

- `npm test`: 23 testes, incluindo emergência, corte de profundidade ao girar/afastar, os 78 destinos e inventários, busca por bairro/nome/CNES, lotes sem sobreposição e acesso por ruas, simplificação sem remover hospitais, sete recortes monitorados, contagens por andar/clínica, ocupação desconhecida no CNES, rejeição de dados inconsistentes, preservação da animação e o caso de 100 livres resultar em exatamente 100 camas sem pessoas.
- `npm run build`: aprovado; permanece o aviso de tamanho do pacote do motor 3D.
- Correção de arraste: gravação fornecida pelo usuário conferida; arrastes verticais longos nos dois sentidos, afastamento e giro testados no navegador, sem corte reto atravessando a cidade ou erros de console. Registro em `validacao/arraste-sem-corte.png`. O teste de profundidade cobre as posições dos 78 hospitais, três inclinações, quatro orientações e quatro níveis de zoom. Gestos em celular físico não foram testados nesta correção.
- Cidade ampliada: busca sem acentos por São José, busca por CNES 2785900, viagem ao Waldemar de Alcântara e abertura completa dos seus andares (360 monitorados, 321 ocupados e 39 livres); atalho para uma cama vazia; retorno ao mapa; visão de toda a cidade; filtro de sete unidades monitoradas; clique direto na fachada 3D do HGF. Em 390 × 844, busca e entrada no Oswaldo Cruz com 33 registros e ocupação desconhecida. Largura do documento igual à tela e nenhum erro de console. Capturas: `validacao/cidade-expandida-geral.png`, `validacao/cidade-expandida-busca.png` e `validacao/cidade-expandida-mobile.png`.
- Nesta revisão visual: abertura completa, isolamento do segundo andar (74 ocupados + 3 livres = 77), aproximação de cama livre e ocupada, troca para os 602 registros CNES e hospital sem cobertura de ocupação. O atalho percorreu as cinco camas livres do HGF sem repetir antes de completar o ciclo. Em 390px, largura do documento = largura da tela, sem rolagem horizontal e sem erros de console. Isso é emulação de tamanho, não teste em um aparelho real.
- Capturas desta revisão: `validacao/cidade-colorida.png`, `validacao/interior-colorido.png`, `validacao/leito-ocupado-colorido.png` e `validacao/mobile-ocupacao.png`. A aparência é inspirada nas imagens fornecidas; o site continua renderizando geometria 3D interativa.
- Navegador: abertura completa do prédio, pausa durante a transformação, remontagem até o estado fechado, nova abertura, salto da animação, seleção de leito no sexto andar e controles a 390px, sem rolagem horizontal e sem erros de console. Navegação, troca de hospital/categoria e passeio também foram conferidos nas versões anteriores.
- Os arquivos em `dist/` são gerados. Capturas de versões anteriores em `validacao/` são históricas; o interior com andares está em `validacao/andares-ilustrativos-hgf.png`.
- A transformação atual foi gravada a partir da prévia em `validacao/abertura-hospital.gif`; as capturas `hospital-montado.png`, `hospital-abrindo.png` e `hospital-aberto.png` registram as etapas. A gravação é apenas documentação: no site, a transformação acontece na cena Three.js interativa.
- Não verificados: distribuição física por andar, planta interior, correspondência com leitos físicos e desempenho em celulares reais. Nenhum site remoto foi publicado ou modificado.
- As ruas, praças, volumes e distâncias visuais da cidade ampliada são ilustrativos; apenas as referências cadastrais de localização e os dados assistenciais indicados vêm das fontes coletadas. Nenhuma nova coleta de ocupação foi feita nesta ampliação: permanece o snapshot de 15/10/2026 às 20h13.


## Cards de informações do hospital

A cidade inclui 152 veículos decorativos, sendo 19 ambulâncias, com circulação nos dois sentidos e tráfego adicional próximo ao hospital selecionado. Pedestres caminham nas áreas frontais de até 14 hospitais próximos à câmera. O botão de pausa controla esses movimentos. Não representam GPS, equipes ou deslocamentos reais.

O botão “Dados e localização”, na ficha do mapa e na barra do interior, abre cards com ocupação percentual e por clínica, permanência até/acima de 24h quando disponível, endereço e link de mapa pelas coordenadas CNES. A aba Cadastro e fontes apresenta capacidade, registros SUS, competência e links oficiais. O card do interior também exibe o percentual total; a legenda dos leitos mostra o percentual da vista filtrada.

A média de permanência em horas não é calculável pelas duas faixas fornecidas na API consultada e aparece como não disponível. Os indicadores continuam usando o snapshot salvo, sem atualização automática. Ausência de cobertura permanece distinta de zero.
