import {mkdir,copyFile,cp} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
await mkdir(path.join(root,'dist'),{recursive:true});
for(const file of ['index.html','styles.css']) await copyFile(path.join(root,file),path.join(root,'dist',file));
await cp(path.join(root,'src'),path.join(root,'dist/src'),{recursive:true});
await cp(path.join(root,'public'),path.join(root,'dist'),{recursive:true});
console.log('Ceno Quant: site estático gerado em dist/');
