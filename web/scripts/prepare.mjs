import {verifyPublication} from './publication-integrity.mjs';
import {readFile,mkdir,copyFile,writeFile,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {validateData,COMMIT} from '../src/model.mjs';
import {validateGate} from '../src/presentation.mjs';
import {validateData as validateOxygen,validateGate as oxygenGate,approved} from '../src/oxygen-model.mjs';
import {prepareRespiratory} from './prepare-respiratory.mjs';
const web=resolve(dirname(fileURLToPath(import.meta.url)),'..'),root=resolve(web,'..');
const read=async p=>JSON.parse(await readFile(resolve(root,p),'utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex');
await verifyPublication(p=>readFile(resolve(root,p)));
const manifest=await read('evidence/engine/manifest.json');
if(manifest.resolved_commit!==COMMIT)throw Error('Engine version mismatch');
validateGate(await read('evidence/engine/checks.json'),await read('evidence/engine/review.json'));
validateData(await read('evidence/engine/lesson-data.json'));
const archive='sangeev-estate-ui-2.0.0-alpha.7.tgz';
if(hash(await readFile(resolve(web,'vendor',archive)))!=='d062371402bb538c008888255597349d5cf7425d5bb51e399f7b3cf97b69ef76')throw Error('Estate archive mismatch');
const pkg=JSON.parse(await readFile(resolve(web,'node_modules/@sangeev/estate-ui/package.json'),'utf8'));
if(pkg.version!=='2.0.0-alpha.7')throw Error('Estate version mismatch');
const sources=['evidence/engine/lesson-data.json','evidence/engine/checks.json','evidence/engine/review.json','evidence/engine/annotated-state.md','evidence/engine/warnings-review.md','engine/field-map.json'];
const verified=[];
for(const path of sources){const bytes=await readFile(resolve(root,path));if(hash(bytes)!==manifest.artifacts[path]?.sha256)throw Error('Evidence hash mismatch: '+path);verified.push({source:path,file:path.split('/').at(-1),sha256:hash(bytes),bytes:bytes.length});}
await rm(resolve(web,'public/evidence'),{recursive:true,force:true});
await mkdir(resolve(web,'public/evidence'),{recursive:true});
for(const f of verified)await copyFile(resolve(root,f.source),resolve(web,'public/evidence',f.file));
await mkdir(resolve(web,'public/licenses'),{recursive:true});
const licenses=[];
for(const file of ['OFL-Atkinson-Hyperlegible-Next.txt','OFL-Literata.txt']){const src=resolve(web,'node_modules/@sangeev/estate-ui/LICENSES',file);await copyFile(src,resolve(web,'public/licenses',file));licenses.push({file,sha256:hash(await readFile(src))});}
await writeFile(resolve(web,'public/evidence/build-provenance.json'),JSON.stringify({engineCommit:COMMIT,estateVersion:pkg.version,estateArchive:archive,estateArchiveSHA256:'d062371402bb538c008888255597349d5cf7425d5bb51e399f7b3cf97b69ef76',files:verified,licenses},null,2)+'\n');
console.log('Validated gate, schema, six evidence hashes and estate archive; copied pinned public recording artifacts and font licences.');
const oxygenManifest=await read('evidence/oxygen/manifest.json');
const oxygenHashes={};for(const [key,file] of Object.entries({manifest:'manifest',checks:'checks',lesson:'lesson-data'}))oxygenHashes[key]=hash(await readFile(resolve(root,'evidence/oxygen',file+'.json')));
oxygenGate(await read('evidence/oxygen/checks.json'),await read('evidence/oxygen/review.json'),oxygenHashes);
validateOxygen(await read('evidence/oxygen/lesson-data.json'));
const oxygenFiles=[];
await mkdir(resolve(web,'public/evidence/oxygen'),{recursive:true});
for(const file of ['manifest.json','checks.json','review.json','lesson-data.json','field-map.json','annotated-state.md','warnings-review.md','action-boundary.json']){
 const source='evidence/oxygen/'+file,bytes=await readFile(resolve(root,source));
 if(!['manifest.json','review.json'].includes(file)&&hash(bytes)!==oxygenManifest.artifacts[source]?.sha256)throw Error('Oxygen evidence hash mismatch: '+source);
 await copyFile(resolve(root,source),resolve(web,'public/evidence/oxygen',file));oxygenFiles.push({source,file,sha256:hash(bytes),bytes:bytes.length});
}
await writeFile(resolve(web,'public/evidence/oxygen/build-provenance.json'),JSON.stringify({approved,files:oxygenFiles},null,2)+'\n');
console.log('Oxygen: fixed reviewed gate, schema and eight public recording artifacts verified.');
await prepareRespiratory(root,web);

for(const file of await (await import('node:fs/promises')).readdir(resolve(root,'licenses')))await copyFile(resolve(root,'licenses',file),resolve(web,'public/licenses',file));
await copyFile(resolve(root,'LICENSE'),resolve(web,'public/licenses/Glassbox-LICENSE'));
await copyFile(resolve(root,'THIRD_PARTY_NOTICES.md'),resolve(web,'public/THIRD_PARTY_NOTICES.md'));
