const test=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs')
const ts=require('typescript')
const runtime=require('react/jsx-runtime')
function montar(valor,multilinha=false) {
  let estado=valor
  const chamadas=[]
  const exports={}
  const js=ts.transpileModule(fs.readFileSync('src/components/CampoTextoPeca.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText
  new Function('require','exports',js)(nome=>nome==='react'?{useState:()=>[estado,v=>estado=v]}:runtime,exports)
  const render=()=>exports.default({valor,rotulo:'Campo do objeto',multilinha,aoConfirmar:v=>chamadas.push(['confirmar',v]),aoFinalizar:()=>chamadas.push(['finalizar'])})
  return {render,chamadas}
}
test('digitar código sob filtro não confirma valor parcial; sair aplica texto completo',()=>{
  const app=montar('')
  for(const valor of ['A','AB','ABC'])app.render().props.onChange({target:{value:valor}})
  assert.deepEqual(app.chamadas,[])
  assert.equal(app.render().props.value,'ABC')
  app.render().props.onBlur()
  assert.deepEqual(app.chamadas,[['confirmar','ABC'],['finalizar']])
})
test('observação preserva quebras e confirma limpeza explícita ao sair',()=>{
  const app=montar('Original',true)
  assert.equal(app.render().type,'textarea')
  app.render().props.onChange({target:{value:'Nota; "área"\nOutra linha'}})
  app.render().props.onBlur()
  assert.equal(app.chamadas[0][1],'Nota; "área"\nOutra linha')
  const limpar=montar('Original',true)
  limpar.render().props.onChange({target:{value:''}})
  limpar.render().props.onBlur()
  assert.deepEqual(limpar.chamadas,[['confirmar',''],['finalizar']])
})
test('sair de campo sem mudança não cria uma alteração para desfazer',()=>{
  const app=montar('P01')
  app.render().props.onBlur()
  assert.deepEqual(app.chamadas,[['finalizar']])
})
