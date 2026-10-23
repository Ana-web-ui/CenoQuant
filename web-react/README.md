# CenoQuant — aplicação React

Aplicação em português para revisar levantamentos preliminares de cenografia extraídos do Blender ou do 3ds Max. O fluxo principal é **importar JSON → revisar objetos → exportar a revisão**.

Esta pasta contém a interface React com TypeScript e Vite. Os extratores Python/MAXScript e o protótipo web original são projetos separados; os comandos deste README se aplicam à pasta `web-react`.

## Executar localmente

Use Node.js e npm. O ambiente utilizado na verificação do projeto foi Node.js **24.22.1**. As dependências e suas versões estão em `package.json` e `package-lock.json`.

Abra um terminal na pasta `web-react` e instale as dependências do lockfile:

```powershell
npm ci
```

Para desenvolver com atualização automática da interface:

```powershell
npm run dev
```

Abra o endereço `Local` informado pelo terminal. Para encerrar o servidor, use `Ctrl+C`.

Para conferir a versão compilada:

```powershell
npm run build
npm run preview
```

O preview serve o conteúdo de `dist`. Depois de alterar o código, execute novamente `npm run build` e atualize a página do preview. Não edite `dist` diretamente. O preview é uma ferramenta de conferência local, não uma configuração de publicação em produção.

| Comando | Finalidade |
| --- | --- |
| `npm ci` | Instalar as dependências conforme o lockfile |
| `npm run dev` | Iniciar o servidor de desenvolvimento |
| `npm test` | Executar os testes automatizados em `tests/*.test.cjs` |
| `npm run build` | Verificar TypeScript e gerar a aplicação em `dist` |
| `npm run preview` | Servir localmente o último build |
| `npm run lint` | Analisar o código com Oxlint |

As portas podem variar. `localhost` e `127.0.0.1`, assim como portas diferentes, têm armazenamentos separados: a revisão salva no desenvolvimento pode não aparecer no preview. Use o JSON revisado para transferir a revisão entre endereços.

## Uso da interface

1. Importe um arquivo `.json` pelo seletor ou por arrastar e soltar.
2. Revise a tabela: inclusão, categoria, código e observação. Use a busca, a categoria e a paginação para localizar objetos; consulte medidas e materiais em **Ver detalhes**.
3. Use **Exportar revisão** para baixar o JSON revisado, o CSV de objetos incluídos ou imprimir o relatório/salvar PDF pelo navegador.

**Mais filtros e ordenação** reúne os filtros por material, inclusão e conferência, além das opções de ordenação. O título indica quando alguma dessas opções está ativa.

**Opções avançadas** reúne:

- Edição do nome do projeto e desfazer a última alteração.
- Seleção e edição em lote, incluindo resultados de outras páginas, e CSV da seleção.
- Resumos por categoria, por material e por código.
- Agrupamento de materiais por categoria e acréscimo opcional de área.
- Comparação com o JSON importado e exportação das diferenças.
- Avisos da extração, com busca, paginação e CSV.
- Criação/renomeação de categorias e painel de conferência.

Fechar as opções avançadas apenas recolhe a área. Não desfaz alterações nem desativa cálculos ou filtros.

## Estrutura do código

```text
web-react/
├── src/
│   ├── main.tsx                 # Entrada da aplicação
│   ├── App.tsx                  # Estado da revisão, ações e conexão dos componentes
│   ├── App.css                  # Layout, componentes e impressão
│   ├── index.css                # Estilos globais
│   ├── components/              # Interface
│   ├── hooks/
│   │   └── useRevisaoSalva.ts   # Recuperação, salvamento e proteção entre abas
│   ├── types/
│   │   └── cenoquant.ts         # Projeto, Peca, Superficie e Aviso
│   ├── utils/                   # Validação, cálculos, filtros e exportações
│   └── assets/                  # Recursos estáticos
├── tests/
│   ├── helpers/loadTs.cjs      # Carregamento de TS/TSX para os testes Node
│   └── *.test.cjs              # Casos de teste
├── package.json
├── package-lock.json
├── vite.config.ts
├── tsconfig*.json
└── dist/                       # Resultado gerado pelo build
```

### Componentes principais

| Arquivo em `src/components` | Responsabilidade |
| --- | --- |
| `AreaImportacao.tsx` | Seletor de arquivo e arrastar/soltar |
| `TabelaPecas.tsx`, `FiltrosPecas.tsx`, `Paginacao.tsx` | Lista, filtros e navegação |
| `DetalhesPeca.tsx` | Janela de detalhes do objeto |
| `OpcoesAvancadas.tsx` | Organização da área avançada e conexão de seus componentes |
| `EdicaoLote.tsx` | Controles de seleção e edição em lote |
| `ResumoCategorias.tsx`, `ResumoMateriais.tsx`, `ResumoGrupos.tsx` | Apresentação dos resumos |
| `EditarNomeProjeto.tsx`, `RenomearCategoria.tsx` | Formulários de renomeação |
| `AlteracoesRevisao.tsx`, `PainelAvisos.tsx`, `ConferenciaRevisao.tsx` | Comparação, avisos e indicadores |
| `ProtecaoRevisao.tsx` | Avisos de recuperação e conflitos de salvamento |
| `RelatorioImpressao.tsx` | Relatório separado para impressão |

Os estados e as ações de revisão permanecem no `App.tsx`, com a persistência delegada a `useRevisaoSalva`. `EdicaoLote` e `OpcoesAvancadas` recebem dados e callbacks; não mantêm uma segunda cópia do projeto.

### Utilitários principais

- `validarProjeto.ts`, `validarPeca.tsx` e `validarAvisos.ts`: validação de importação e recuperação. Apesar da extensão `.tsx`, `validarPeca` contém lógica de validação.
- `revisaoSalva.ts`: leitura da revisão e conferência da cópia conhecida antes de gravar.
- `calcularResumoCategorias.ts`, `calcularResumoMateriais.ts`, `calcularSuperficieIncluida.ts` e `calcularGrupos.ts`: cálculos dos quantitativos.
- `filtrarPecas.ts`, `filtrarAvisos.ts`, `listarMateriais.ts` e `ordenarPecas.ts`: consulta e ordenação.
- `editarPecasEmLote.ts`, `renomearProjeto.ts`, `renomearCategoria.ts` e `categoriasPersonalizadas.ts`: alterações da revisão.
- `compararRevisao.ts`, `conferirPecas.ts` e `acrescimoMaterial.ts`: comparação, indicadores e percentual.
- `gerarCsv*.ts` e `gerarJsonRevisado.ts`: geração do conteúdo exportado.
- `baixarArquivo.ts`: criação do arquivo para download e liberação da URL temporária, compartilhada pelas exportações e pela cópia de recuperação.

## Formato de entrada e limites

O formato é `schema: "ceno-quant/1"`. A versão do schema é independente da versão do aplicativo.

O JSON contém `project` (metadados), `pieces` (objetos) e, opcionalmente, `warnings`, `lossPercent` e `customCategories`. O projeto exige nome não vazio, origem `blender` ou `3dsmax` e data de extração válida em `extractedAt`.

Cada objeto tem `id` único, `name`, três dimensões em `dimensionsM` e uma lista `surfaces` com `material` e `areaM2`. Os campos `code`, `note`, `category` e `included` são opcionais na entrada; ausência de inclusão equivale a incluído. Categoria vazia recebe `Sem categoria`.

| Limite | Valor |
| --- | --- |
| Tamanho do arquivo | 20 × 1024 × 1024 bytes (apresentado como 20 MB na interface) |
| Objetos | 10.000 |
| Superfícies por objeto | 500 |
| Superfícies no projeto | 100.000 registros |
| Avisos | 20.000 |
| Categorias personalizadas | 100 entradas |
| Campos de texto validados | Até 2.000 caracteres |
| Dimensões | Números finitos entre 0 e 10.000.000 m |
| Área por registro | Número finito entre 0 e 1.000.000.000.000 m² |
| Acréscimo opcional | De 0% a 100% |

Esses limites validam a estrutura dos dados; não comprovam a escala física, a qualidade da geometria ou a abrangência correta da cena. Arquivos inválidos são rejeitados antes de substituir o projeto atual.

## Salvamento e recuperação

A aplicação processa o JSON no navegador, sem envio dos dados do projeto a um backend. Mantém **uma revisão por origem e perfil do navegador**, na chave `cenoquant-revisao-v1` do `localStorage`.

- A revisão válida é recuperada ao reabrir o mesmo endereço.
- Importar outro projeto exige confirmação quando há uma revisão aberta ou uma cópia inválida detectada.
- Se a cópia salva for inválida, o salvamento fica pausado. **Baixar cópia para recuperação** guarda o conteúdo original em `.txt` para análise; não corrige o conteúdo nem produz um JSON pronto para importar.
- Se o armazenamento estiver inacessível, é possível trabalhar em memória e baixar o JSON revisado. Se uma gravação falhar, a interface informa que as alterações precisam ser exportadas.
- Uma alteração ou remoção detectada em outra aba pausa o salvamento e a importação nesta aba. Baixe seu JSON revisado antes de atualizar a página para abrir a cópia salva.

A proteção entre abas detecta diferenças e eventos de armazenamento; não é um mecanismo de colaboração ou bloqueio transacional. Prefira revisar em uma única aba.

O armazenamento pode ser limitado, bloqueado ou apagado pelo navegador. Aceitar um arquivo dentro do limite de importação não garante espaço suficiente para salvá-lo. **O JSON revisado baixado é a cópia portátil para continuar o trabalho.**

## Regras de cálculo e exportação

- Os totais e resumos usam os objetos incluídos do projeto inteiro, independentemente dos filtros da tabela.
- Selecionar não altera a inclusão. Mudar filtros, ordenação ou página limpa a seleção.
- O resumo por código considera categoria, código, dimensões arredondadas a seis casas e conjunto de nomes de materiais. Objetos sem código ficam separados. Observações não definem grupos.
- O resumo de materiais pode ser geral ou separado por categoria. O CSV de materiais e o relatório seguem a opção escolhida.
- O percentual de acréscimo multiplica a área; não modifica a geometria nem a quantidade de objetos.
- Os CSVs usam UTF-8 com BOM, ponto e vírgula e quebras CRLF. Os campos textuais recebem escape e proteção contra interpretação como fórmula. Áreas e dimensões exportadas usam vírgula decimal.
- O CSV principal exporta incluídos. O CSV da seleção inclui todos os selecionados, inclusive excluídos e objetos de outras páginas, com indicação de inclusão.
- O JSON revisado preserva objetos excluídos, geometria e campos adicionais do arquivo original, incorporando os campos revisados.
- O CSV de avisos inclui todos os avisos, independentemente da busca/página do painel.
- O PDF é obtido pela impressão do navegador. O relatório apresenta os resumos e a quantidade de avisos, não a tabela completa de objetos ou o conteúdo completo dos avisos.

## Limitações e pontos conhecidos

### Significado do levantamento

Cada objeto conta como uma unidade ou conjunto do modelo. Objetos unidos, arrays, instâncias e recursos de plugins dependem de como foram extraídos. A contagem não é automaticamente uma quantidade de peças de fabricação.

As dimensões são envelopes nos eixos do mundo: a rotação pode alterar X, Y e Z. As superfícies somam faces modeladas, incluindo frente, verso, laterais e interiores, sem descontar automaticamente contatos ou sobreposições. Não equivalem diretamente à área de piso, corte ou compra.

O projeto não calcula orçamento, dimensionamento estrutural, plano de corte ou lista definitiva de materiais. Categorias, materiais e escopo exigem revisão humana.

### Revisão no navegador

- Não há login, biblioteca de projetos, servidor de dados ou sincronização entre computadores.
- Desfazer mantém apenas a última alteração da sessão; o estado para desfazer é perdido ao atualizar ou importar. Não há refazer ou histórico completo.
- A comparação registra diferenças de categoria, inclusão, código e observação em relação ao último JSON importado. Não compara geometria, nome do projeto, percentual ou lista de categorias. Reimportar um JSON revisado estabelece nova referência.
- Avisos são os da extração original; editar a revisão não os recalcula. Os indicadores de conferência não certificam que o levantamento esteja pronto para produção.
- A edição de código/observação atualiza os dados a cada tecla. Um filtro dependente desse texto pode retirar a linha da lista durante a digitação, como no filtro de objetos sem código.
- O filtro de material distingue nomes exatos, mas o resumo remove espaços nas extremidades e usa `Sem material` para nomes vazios. Nomes diferentes podem ser reunidos no resumo, inclusive um nome literal `Sem material` com registros vazios. Essa consistência ainda precisa ser revisada.
- O projeto completo é serializado para salvamento após mudanças. O desempenho com arquivos próximos dos limites ainda precisa de avaliação específica.

### Integração com aplicativos 3D

O JSON é um retrato da extração. Alterações na aplicação web não atualizam automaticamente a cena do Blender/3ds Max; mudanças na geometria exigem nova extração. A aplicação não importa diretamente `.blend` ou `.max`.

A documentação de passagem registra extração real de um stand com 2.766 objetos no Blender. Ainda não há confirmação, naquele histórico, do teste interativo da correção Blender 0.2.1 na cena real nem da execução nativa no 3ds Max com Corona. Os testes desta pasta não validam esses extratores ou plugins.

## Verificação e manutenção

Após alterações de código, execute:

```powershell
npm test
npm run build
npm run lint
```

Na última verificação de código, anterior a esta atualização de documentação, **71 testes e o build passaram**. O lint apresentou dois avisos: a expressão de proteção de CSV em `gerarCsvPecas.ts` e a atualização de estado no efeito de persistência em `useRevisaoSalva.ts`. Esses resultados são um registro, não uma garantia para alterações futuras.

Os testes cobrem regras de validação, revisão, filtros, cálculos selecionados, exportação, persistência e renderização de componentes. Não constituem uma suíte completa de interação no navegador.

Para conferir o fluxo real, importe um JSON conhecido, altere um objeto, verifique os totais, atualize a página e confira a recuperação. Depois exporte o JSON revisado e um CSV, confira os valores e reimporte o JSON. Baixe a revisão atual antes de testes que a substituam. Quando a mudança envolver impressão, confira também a prévia do relatório.

A organização atual separa apresentação, persistência e utilitários. Ao continuar a manutenção, preserve as regras de quantitativo e mantenha o README alinhado às mudanças efetivamente implementadas.
