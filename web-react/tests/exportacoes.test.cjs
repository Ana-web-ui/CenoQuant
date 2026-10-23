const test = require('node:test')
const assert = require('node:assert/strict')
const load = require('./helpers/loadTs.cjs')
const { gerarCsvCategorias } = load('src/utils/gerarCsvCategorias.ts')
const { gerarJsonRevisado } = load('src/utils/gerarJsonRevisado.ts')
const { baixarArquivo } = load('src/utils/baixarArquivo.ts')

test('CSV de categorias mantém BOM, CRLF, números e proteção de texto', () => {
  const csv = gerarCsvCategorias([
    { categoria: 'Painéis; "A"\nB', quantidade: 12 },
    { categoria: '=1+1', quantidade: 2 },
  ], 14)
  assert.equal(csv, '\uFEFF"Categoria";"Objetos incluídos"\r\n"Painéis; ""A""\nB";12\r\n"\'=1+1";2\r\n"Total incluído";14')
})

test('JSON revisado preserva metadados, geometria, campos adicionais e excluídos', () => {
  const original = {schema:'ceno-quant/1', project:{name:'Projeto'},lossPercent:10,
    customCategories:['Nova'],warnings:[{object:'A',message:'Rever'}], extra:true,
    pieces:[{id:'a',name:'Objeto',dimensionsM:[1,2,3],surfaces:[{material:'MDF',areaM2:5}],extra:'preservar',code:'antigo',note:'antiga',category:'Antiga',included:true}]}
  const snapshot=JSON.stringify(original)
  const projeto={nome:'Projeto',arquivoOriginal:original,pecas:[{...original.pieces[0],code:'P01',note:'',category:'Nova',included:false}]}
  const texto=gerarJsonRevisado(projeto)
  const esperado={...original,pieces:[{...original.pieces[0],code:'P01',note:'',category:'Nova',included:false}]}
  assert.equal(texto,JSON.stringify(esperado,null,2))
  assert.equal(JSON.stringify(original),snapshot)
  assert.throws(()=>gerarJsonRevisado({...projeto,arquivoOriginal:{}}),/objetos originais/)
})

test('download preserva bytes, nome e tipo e libera URL após o clique', async () => {
  const anterior={document:global.document,window:global.window,create:URL.createObjectURL,revoke:URL.revokeObjectURL}
  const eventos=[];let blob,agendada
  const link={click(){eventos.push('click')},remove(){eventos.push('remove')}}
  try {
    global.document={createElement(tag){assert.equal(tag,'a');return link},body:{appendChild(a){assert.equal(a,link);eventos.push('append')}}}
    global.window={setTimeout(fn,ms){assert.equal(ms,1000);agendada=fn}}
    URL.createObjectURL=(arquivo)=>{blob=arquivo;return 'blob:teste'}
    URL.revokeObjectURL=(url)=>{assert.equal(url,'blob:teste');eventos.push('revoke')}
    for(const [conteudo,nome,tipo] of [
      ['\uFEFF"Categoria";1\r\n','CenoQuant_resumo_categorias.csv','text/csv;charset=utf-8'],
      ['{\n  "nome": "Revisão"\n}','CenoQuant_revisado.json','application/json;charset=utf-8'],
      ['{inválido','CenoQuant_copia_para_recuperacao.txt','text/plain;charset=utf-8'],
    ]) {
      eventos.length=0
      baixarArquivo(conteudo,nome,tipo)
      assert.equal(link.download,nome);assert.equal(link.href,'blob:teste')
      assert.equal(blob.type,tipo)
      assert.deepEqual(Buffer.from(await blob.arrayBuffer()),Buffer.from(conteudo))
      assert.deepEqual(eventos,['append','click','remove'])
      agendada();assert.deepEqual(eventos,['append','click','remove','revoke'])
    }
  } finally {
    if(anterior.document===undefined)delete global.document;else global.document=anterior.document
    if(anterior.window===undefined)delete global.window;else global.window=anterior.window
    URL.createObjectURL=anterior.create;URL.revokeObjectURL=anterior.revoke
  }
})
