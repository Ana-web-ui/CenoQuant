CENO QUANT WEB 0.2.0 — CÓDIGO-FONTE

Aplicação estática, em português, para revisar quantitativos de cenografia.
Sem dependências de runtime, banco de dados, login, serviços de IA ou upload.
HTML/CSS/JavaScript com módulos ES; Node.js 20+ para servir, testar e empacotar.

EXECUTAR

  npm run build
  npm run dev

Abra http://127.0.0.1:4173. Não abra index.html por file://: os módulos e o JSON
de exemplo precisam ser servidos por HTTP. O comando dev serve o conteúdo dist/.
Depois de editar o código, rode npm run build e recarregue o navegador.

TESTAR

  npm test
  python scripts/check-native.py

O teste web roda no mesmo processo (sem subprocessos). O teste Python verifica
sintaxe dos add-ons, delimitadores do MAXScript e contrato JSON do exportador
Blender sem abrir os programas. Não confirma execução nativa.

PUBLICAR NA VERCEL

Crie um repositório com este código, importe na Vercel e use Framework: Other.
Build Command: npm run build. Output Directory: dist.
vercel.json já declara os dois campos. Não há variáveis de ambiente necessárias.
O diretório .openai contém apenas identidade de publicação no Sites; a Vercel
não depende dele. Nenhuma credencial de publicação acompanha este código.

ESTRUTURA

index.html             Entrada da aplicação
styles.css             Interface responsiva, sem bibliotecas ou fontes remotas
src/app.js             Interface, importação, edição, seleção e downloads
src/domain.js          Validação JSON, agrupamento, áreas e CSV
public/downloads/      Add-on Blender, MAXScript, guia e exemplo
native-source/         Código-fonte dos extratores 0.2.0 Web
scripts/               Build, servidor local e verificação nativa estática
tests/                 Testes automatizados do domínio e contrato JSON
vercel.json            Configuração de publicação na Vercel

FUNCIONALIDADES

- Importar JSON validado ceno-quant/1, por seletor ou arrastar/soltar.
- Limites de 20 MB, 10.000 objetos e 100.000 registros de superfície.
- Revisar categoria, código, observação e inclusão individual ou em lote.
- Busca, filtro por categoria, paginação, resumo agrupado e materiais.
- Medidas físicas extraídas não são editáveis na web.
- Acréscimo percentual opcional nas áreas de materiais.
- Exportar quatro CSVs e JSON revisado, preservando exclusões/reclassificações.
- localStorage por navegador/dispositivo, com aviso de falha de salvamento.
- Projeto sintético de exemplo identificado como demonstrativo.

VALIDAÇÃO REALIZADA

- 19 testes Node de validação, totais, agrupamento, edição, exportação e contrato JSON.
- Revisão de código e teste estático dos extratores JSON.
- Navegador local: exemplo, busca, edição, exclusão, persistência após reload,
  importação por seletor e download de CSV; layout móvel e desktop inspecionados.
- Blender 5.2.2 / Max 2027 + Corona não estão instalados neste ambiente. Rodar
  extratores e validar o JSON de uma cena real continua pendente de piloto.

ARMAZENAMENTO E ESCOPO

Nenhum JSON importado é enviado a servidor. O navegador guarda uma revisão
por vez. Importação de outro arquivo substitui o projeto aberto, após confirmação
quando se trata de dados importados. Baixe o JSON revisado como cópia de segurança.
Não há sincronização de usuários, histórico ou comparação automática de versões.

Cada objeto geométrico é 1 unidade/conjunto. Área é soma de faces, incluindo verso
e espessuras, não um quantitativo de compra. Dimensões são o envelope nos eixos
do mundo. Proxies, geradores e geometria exclusiva de render podem ficar fora.
Veja public/downloads/LEIA-ME.txt antes de iniciar o piloto.
