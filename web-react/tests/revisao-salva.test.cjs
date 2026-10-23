const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const ts = require('typescript')
const load = require('./helpers/loadTs.cjs')
const { lerRevisao, salvarRevisao, CHAVE_REVISAO } = load('src/utils/revisaoSalva.ts')
const { validarProjeto } = load('src/utils/validarProjeto.ts')
const projeto = validarProjeto({schema:'ceno-quant/1', project:{name:'Teste',source:'blender',extractedAt:'2026-10-23T12:00:00Z'},pieces:[]})
function storage(texto = null) {
  return { texto, gravacoes:0, getItem(){return this.texto}, setItem(k,v){assert.equal(k,CHAVE_REVISAO);this.gravacoes++;this.texto=v} }
}

test('recupera revisão válida sem gravar e distingue ausência de conteúdo inválido', () => {
  const banco = storage(JSON.stringify(projeto))
  assert.deepEqual(lerRevisao(()=>banco).projeto,projeto)
  assert.equal(banco.gravacoes,0)
  assert.equal(lerRevisao(()=>storage()).problema,'')
  for (const texto of ['', '{quebrado', '{}', 'null']) {
    const resultado = lerRevisao(()=>storage(texto))
    assert.equal(resultado.problema,'invalida')
    assert.equal(resultado.texto,texto)
    assert.equal(resultado.projeto,null)
  }
})
test('acesso bloqueado é informado sem fingir que não há revisão',()=>{
  assert.equal(lerRevisao(()=>{throw Error('SecurityError')}).problema,'acesso')
})
test('falha de gravação preserva cópia e retorna erro',()=>{
  const banco=storage('anterior');banco.setItem=()=>{throw Error('QuotaExceededError')}
  assert.equal(salvarRevisao(()=>banco,'anterior',projeto).status,'erro')
  assert.equal(banco.texto,'anterior')
})
test('conflito ou remoção externa não permite sobrescrever',()=>{
  for(const atual of ['outra revisão',null]) {
    const banco=storage(atual)
    assert.equal(salvarRevisao(()=>banco,'anterior',projeto).status,'conflito')
    assert.equal(banco.gravacoes,0)
    assert.equal(banco.texto,atual)
  }
})
test('salva e evita gravação redundante da mesma revisão',()=>{
  const banco=storage()
  const r=salvarRevisao(()=>banco,null,projeto)
  assert.equal(r.status,'salvo')
  assert.equal(salvarRevisao(()=>banco,r.texto,projeto).status,'salvo')
  assert.equal(banco.gravacoes,1)
})

// Executa o hook real com estados persistentes e efeitos controlados.
function montar(banco,confirmar=()=>true) {
  const estados=[],refs=[],deps=[];let si=0,ri=0,ei=0,efeitos=[]
  const listeners={}
  global.window={localStorage:banco,confirm:confirmar,addEventListener:(k,f)=>listeners[k]=f,removeEventListener:()=>{}}
  const react={
    useState(init){const i=si++;if(!(i in estados))estados[i]=typeof init==='function'?init():init;return [estados[i],v=>estados[i]=typeof v==='function'?v(estados[i]):v]},
    useRef(init){const i=ri++;return refs[i]??(refs[i]={current:init})},
    useEffect(fn,d){const i=ei++;if(!deps[i]||d.some((x,j)=>x!==deps[i][j]))efeitos.push(fn);deps[i]=d},
  }
  const exports={}
  const js=ts.transpileModule(fs.readFileSync('src/hooks/useRevisaoSalva.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText
  new Function('require','exports',js)(name=>name==='react'?react:load('src/utils/'+name.split('/').pop()+'.ts'),exports)
  function render(){si=ri=ei=0;efeitos=[];const hook=exports.useRevisaoSalva();efeitos.forEach(f=>f());return hook}
  return {render,listeners}
}
test('cópia inválida bloqueia salvamento; cancelar preserva; confirmação libera importação',()=>{
  let confirmar=false
  const banco=storage('{invalido')
  const app=montar(banco,()=>confirmar)
  let hook=app.render()
  assert.equal(hook.problema,'invalida')
  assert.equal(hook.autorizarImportacao(),false)
  assert.equal(banco.texto,'{invalido')
  confirmar=true
  assert.equal(hook.autorizarImportacao(),true)
  hook.setProjeto(projeto)
  hook=app.render();hook=app.render()
  assert.equal(hook.status,'salvo')
  assert.equal(hook.problema,'')
  assert.deepEqual(JSON.parse(banco.texto),projeto)
})
test('mudança externa durante importação bloqueia antes de substituir',()=>{
  const banco=storage(JSON.stringify(projeto));const app=montar(banco)
  const hook=app.render();banco.texto='outra revisão'
  assert.equal(hook.autorizarImportacao(),false)
  assert.equal(app.render().problema,'conflito')
  assert.equal(banco.texto,'outra revisão')
})
test('evento de outra aba pausa salvamento mantendo projeto local exportável',()=>{
  const banco=storage(JSON.stringify(projeto));const app=montar(banco)
  let hook=app.render();banco.texto='externo'
  app.listeners.storage({key:CHAVE_REVISAO,storageArea:banco})
  hook.setProjeto({...projeto,nome:'Trabalho local'})
  hook=app.render();hook=app.render()
  assert.equal(hook.status,'bloqueado')
  assert.equal(hook.projeto.nome,'Trabalho local')
  assert.equal(banco.texto,'externo')
})
test('sem acesso ao armazenamento permite sessão em memória sem anunciar salvamento',()=>{
  const banco={getItem(){throw Error('bloqueado')},setItem(){throw Error('não deve gravar')}}
  const app=montar(banco);let hook=app.render()
  assert.equal(hook.autorizarImportacao(),true)
  hook.setProjeto(projeto);hook=app.render();hook=app.render()
  assert.equal(hook.projeto.nome,'Teste')
  assert.equal(hook.status,'bloqueado')
  assert.equal(hook.problema,'acesso')
})
