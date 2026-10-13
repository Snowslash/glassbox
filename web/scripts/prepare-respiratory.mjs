import {readFile,mkdir,copyFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {approved,validateData,validateGate} from '../src/respiratory-model.mjs';
export async function prepareRespiratory(root,web){
 const hash=b=>createHash('sha256').update(b).digest('hex'),bundle={},hashes={};
 for(const [key,path]of Object.entries({manifest:'evidence/respiratory/manifest.json',checks:'evidence/respiratory/checks.json',review:'evidence/respiratory/review.json',fieldMap:'evidence/respiratory/field-map.json',playback:'evidence/ui/respiratory/playback.json'})){const bytes=await readFile(resolve(root,path));hashes[key]=hash(bytes);bundle[key]=JSON.parse(bytes);}
 validateGate(bundle.checks,bundle.review,hashes);validateData(bundle.playback);
 const files=[];await mkdir(resolve(web,'public/evidence/respiratory'),{recursive:true});
 for(const file of ['manifest.json','checks.json','review.json','field-map.json','playback.json','annotated-state.md','warnings-review.md']){const source=(file==='playback.json'?'evidence/ui/respiratory/':'evidence/respiratory/')+file,bytes=await readFile(resolve(root,source));if(['annotated-state.md','warnings-review.md'].includes(file)&&hash(bytes)!==bundle.manifest.artifacts[source]?.sha256)throw Error('Respiratory evidence mismatch: '+file);await copyFile(resolve(root,source),resolve(web,'public/evidence/respiratory',file));files.push({source,file,sha256:hash(bytes),bytes:bytes.length});}
 await writeFile(resolve(web,'public/evidence/respiratory/build-provenance.json'),JSON.stringify({approved,files},null,2)+'\n');
 console.log('Respiratory: approved hashes, all 18003 original rows and seven copied artifacts verified.');
}
