export const SCHEMA='ceno-quant/1';
export const MAX_BYTES=20*1024*1024;
export const fmt=(n,d=2)=>new Intl.NumberFormat('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d}).format(n);
const text=(value,label,fallback='')=>{if(value===undefined)return fallback;if(typeof value!=='string'||value.length>2000)throw new Error(`${label}: texto inválido (até 2.000 caracteres).`);return value.trim();};
const number=(v,label,max=1e12)=>{if(typeof v!=='number'||!Number.isFinite(v)||v<0||v>max)throw new Error(`${label}: número inválido.`);return v;};
export function validatePayload(input){
 if(!input||typeof input!=='object'||input.schema!==SCHEMA)throw new Error('Formato não reconhecido. Use o JSON gerado pelo Ceno Quant Web (schema ceno-quant/1).');
 const p=input.project;if(!p||!['blender','3dsmax'].includes(p.source))throw new Error('O projeto precisa indicar Blender ou 3ds Max.');
 if(!Array.isArray(input.pieces)||input.pieces.length>10000)throw new Error('Lista de peças inválida. O limite é 10.000 objetos por importação.');
 const ids=new Set();let count=0;
 const pieces=input.pieces.map((item,i)=>{
  if(!item||typeof item!=='object')throw new Error(`Peça ${i+1} inválida.`);
  const id=text(item.id,'Identificador');if(!id||ids.has(id))throw new Error('As peças precisam de identificadores únicos.');ids.add(id);
  if(!Array.isArray(item.dimensionsM)||item.dimensionsM.length!==3)throw new Error(`Peça ${i+1}: informe três dimensões em metros.`);
  if(!Array.isArray(item.surfaces)||item.surfaces.length>500)throw new Error(`Peça ${i+1}: lista de superfícies inválida.`);
  count+=item.surfaces.length;if(count>100000)throw new Error('Excesso de registros de material.');
  const surfaces=item.surfaces.map(s=>{if(!s||typeof s!=='object')throw new Error('Superfície inválida.');return {material:text(s.material,'Material','Sem material')||'Sem material',areaM2:number(s.areaM2,'Área')};});
  if(item.included!==undefined&&typeof item.included!=='boolean')throw new Error('O campo included deve ser booleano.');
  return {id,name:text(item.name,'Nome',`Objeto ${i+1}`)||`Objeto ${i+1}`,code:text(item.code,'Código'),category:text(item.category,'Categoria','Sem categoria')||'Sem categoria',dimensionsM:item.dimensionsM.map(v=>number(v,'Dimensão',1e7)),surfaces,note:text(item.note,'Observação'),included:item.included!==false};
 });
 if(input.warnings!==undefined&&(!Array.isArray(input.warnings)||input.warnings.length>20000))throw new Error('Lista de avisos inválida.');
 const warnings=(input.warnings||[]).map(w=>{if(!w||typeof w!=='object')throw new Error('Aviso inválido.');return {object:text(w.object,'Objeto do aviso','Geral'),message:text(w.message,'Aviso')};});
 const extractedAt=text(p.extractedAt,'Data');if(!extractedAt||!Number.isFinite(Date.parse(extractedAt)))throw new Error('Data de extração inválida.');
 return {schema:SCHEMA,project:{name:text(p.name,'Projeto','Projeto importado')||'Projeto importado',source:p.source,application:text(p.application,'Aplicativo'),scene:text(p.scene,'Cena'),extractedAt,scope:text(p.scope,'Escopo')},lossPercent:number(input.lossPercent??0,'Acréscimo',100),pieces,warnings};
}
export const area=p=>p.surfaces.reduce((sum,s)=>sum+s.areaM2,0);
export const included=data=>data.pieces.filter(p=>p.included);
export function totals(data){const list=included(data);return {pieces:list.length,area:list.reduce((s,p)=>s+area(p),0),categories:new Set(list.map(p=>p.category)).size,materials:new Set(list.flatMap(p=>p.surfaces.map(s=>s.material))).size,excluded:data.pieces.length-list.length};}
export function materials(data){const result=new Map();for(const p of included(data))for(const s of p.surfaces){const key=JSON.stringify([p.category,s.material]);if(!result.has(key))result.set(key,{category:p.category,material:s.material,areaM2:0});result.get(key).areaM2+=s.areaM2;}return [...result.values()].sort((a,b)=>a.category.localeCompare(b.category,'pt-BR')||a.material.localeCompare(b.material,'pt-BR'));}
export function groups(data){const result=new Map();for(const p of included(data)){const labels=[...new Set(p.surfaces.map(s=>s.material))].sort();const dims=p.dimensionsM.map(x=>Math.round(x*1e6)/1e6);const key=JSON.stringify([p.category,p.code||p.id,dims,labels]);if(!result.has(key))result.set(key,{category:p.category,code:p.code||p.name,dimensionsM:dims,materials:labels,count:0,areaM2:0});const row=result.get(key);row.count++;row.areaM2+=area(p);}return [...result.values()];}
export function allWarnings(data){return [...data.warnings,...data.pieces.filter(p=>!p.included).map(p=>({object:p.name,message:'Excluído na revisão web.'}))];}
function csvCell(value){let s=String(value??'');if(s.trimStart().match(/^[=+@-]/))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}
const dec=n=>n.toFixed(6).replace('.',',');
export function csv(data,kind){
 let header,rows;const list=included(data);
 if(kind==='pieces'){header=['objeto','codigo','categoria','quantidade','x_m_mundo','y_m_mundo','z_m_mundo','superficie_m2','materiais','observacao'];rows=list.map(p=>[p.name,p.code,p.category,1,...p.dimensionsM.map(dec),dec(area(p)),[...new Set(p.surfaces.map(s=>s.material))].join(' | '),p.note]);}
 else if(kind==='groups'){header=['categoria','codigo_ou_nome','quantidade','x_m_mundo','y_m_mundo','z_m_mundo','superficie_total_m2','materiais'];rows=groups(data).map(g=>[g.category,g.code,g.count,...g.dimensionsM.map(dec),dec(g.areaM2),g.materials.join(' | ')]);}
 else if(kind==='materials'){header=['categoria','material','superficie_m2','acrescimo_percentual','superficie_com_acrescimo_m2','observacao'];rows=materials(data).map(m=>[m.category,m.material,dec(m.areaM2),dec(data.lossPercent),dec(m.areaM2*(1+data.lossPercent/100)),'Soma de faces; revisar antes de comprar. Não é plano de corte.']);}
 else if(kind==='warnings'){header=['objeto','aviso'];rows=allWarnings(data).map(w=>[w.object,w.message]);}
 else throw new Error('Tipo de exportação inválido.');
 const meta=['projeto','aplicativo','extraido_em','escopo'];const values=[data.project.name,data.project.application,data.project.extractedAt,data.project.scope];
 return '\ufeff'+[[...meta,...header],...rows.map(row=>[...values,...row])].map(row=>row.map(csvCell).join(';')).join('\r\n');
}
export function editPieces(data,ids,patch){
 const allowed={};for(const key of ['code','category','note'])if(key in patch)allowed[key]=text(patch[key],key);
 if('included' in patch){if(typeof patch.included!=='boolean')throw new Error('Inclusão inválida.');allowed.included=patch.included;}
 if(allowed.category==='')allowed.category='Sem categoria';
 return {...data,pieces:data.pieces.map(p=>ids.has(p.id)?{...p,...allowed}:p)};
}
