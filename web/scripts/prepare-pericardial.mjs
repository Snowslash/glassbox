import {readFile,mkdir,copyFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {validateData,validateGate,approved} from '../src/pericardial-model.mjs';
export async function preparePericardial(root,web){
 const hashes={},bundles={},files=[];const hash=b=>createHash('sha256').update(b).digest('hex');
 for(const [key,file]of Object.entries({lesson:'lesson-data.json',checks:'checks.json',approval:'approval.json'})){const source='evidence/pericardial/'+file,bytes=await readFile(resolve(root,source));hashes[key]=hash(bytes);bundles[key]=JSON.parse(bytes);files.push({source,file,sha256:hashes[key],bytes:bytes.length});}
 validateGate(bundles.checks,bundles.approval,hashes);validateData(bundles.lesson);
 const target=resolve(web,'public/evidence/pericardial');await mkdir(target,{recursive:true});for(const f of files)await copyFile(resolve(root,f.source),resolve(target,f.file));
 await writeFile(resolve(target,'build-provenance.json'),JSON.stringify({approved,files},null,2)+'\n');
 console.log('Pericardial: approved payload and scientific gate, all original selected rows, complete beats and cursor maps verified.');
}
