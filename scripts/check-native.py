"""Static native checks + host-independent Blender JSON contract fixture."""
import ast
import importlib.util
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
for source in (ROOT/'native-source').rglob('*.py'):
    ast.parse(source.read_text(encoding='utf-8'),filename=str(source))

for source in (ROOT/'native-source').rglob('*.ms'):
    text=source.read_text(encoding='utf-8-sig')
    stack=[];i=0
    while i<len(text):
        if text.startswith('--',i):
            end=text.find('\n',i);i=len(text) if end<0 else end+1;continue
        if text.startswith('/*',i):
            end=text.find('*/',i+2);assert end>=0; i=end+2;continue
        ch=text[i]
        if ch=='"':
            i+=1
            while i<len(text) and text[i]!='"':i+=2 if text[i]=='\\' else 1
            assert i<len(text),(source,'unclosed string')
        elif ch in '([':stack.append(ch)
        elif ch in ')]':assert stack and stack.pop()=={')':'(',']':'['}[ch],(source,i)
        i+=1
    assert not stack,(source,'unclosed delimiters')

spec=importlib.util.spec_from_file_location('cq_contract',ROOT/'native-source'/'blender'/'ceno_quant'/'core.py')
module=importlib.util.module_from_spec(spec);sys.modules[spec.name]=module;spec.loader.exec_module(module)
report=module.Takeoff('Blender fixture','C:/fake/project.blend / Cena teste','Selecionados',10)
report.timestamp='2026-10-20T10:00:00-03:00'
report.pieces.append(module.Piece('Painel "A"','001','Painéis',(3,.1,2),{'MDF branco':7,'Lona':6},'Acentos; "aspas"\nnova linha'))
report.warnings.append(('Geral','Não é plano de corte.'))
payload=module.json_payload(report)
serialized=json.dumps(payload,ensure_ascii=False,allow_nan=False)
decoded=json.loads(serialized)
assert decoded['schema']=='ceno-quant/1'
assert decoded['pieces'][0]['code']=='001'
assert sum(s['areaM2'] for s in decoded['pieces'][0]['surfaces'])==13
assert decoded['pieces'][0]['note']==report.pieces[0].note
fixture=ROOT/'tests'/'blender-contract.json'
fixture.write_text(serialized,encoding='utf-8')
print('Python syntax OK; MAXScript lexical balance OK (not runtime validation).')
print('Blender JSON contract fixture generated and roundtripped OK.')
