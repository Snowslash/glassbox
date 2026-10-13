import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {isModelPath} from '../src/navigation.mjs';
import viteConfig from '../vite.config.mjs';
test('404 emitted favicon and stylesheet stay root-relative without changing app pages',()=>{
 const transform=viteConfig.plugins.find(p=>p.name==='root-relative-error-styles').transformIndexHtml.handler;
 const html='<link rel="icon" href="./favicon.svg"><link rel="stylesheet" href="./assets/404.css">';
 const errorPage=transform(html,{path:'/404.html'});
 assert.match(errorPage,/href="\/favicon.svg"/);
 assert.match(errorPage,/href="\/assets\/404.css"/);
 assert.equal(transform(html,{path:'/app/model.html'}),html);
});
const routes=await import('../src/model-route.mjs').catch(()=>null);
const contract=await import('../scripts/deployment-contract.mjs').catch(()=>null);
const root=new URL('../',import.meta.url);
const read=p=>readFile(new URL(p==='_headers'?'public/_headers':p,root),'utf8');

test('pressure model detection survives the host removing .html',()=>{
 assert.equal(isModelPath('/app/model'),true);
 assert.equal(isModelPath('/app/model.html'),true);
});
test('shared clean model-route detector exists',()=>assert.ok(routes?.isModelRoute));
test('all model routes accept exact clean and original paths',{skip:!routes},()=>{
 for(const stem of ['model','oxygen-model','respiratory-model']){
  for(const prefix of ['/','/app/','/prefix/app/'])for(const suffix of ['','.html'])assert.equal(routes.isModelRoute(prefix+stem+suffix,stem),true);
  for(const path of ['/',`/app/${stem}/`,`/app/${stem}.html/`,`/app/not-${stem}`,`/app/${stem}.json`,`/app/${stem}-extra`,`/app/${stem}.html?sample=20`])assert.equal(routes.isModelRoute(path,stem),false,path);
 }
});
test('all lesson entrypoints use the shared route detector',{skip:!routes},async()=>{
 for(const [file,stem]of [['OxygenApp.jsx','oxygen-model'],['RespiratoryApp.jsx','respiratory-model']]){
  const source=await readFile(new URL('../src/'+file,import.meta.url),'utf8');
  assert.match(source,/import \{isModelRoute\} from '\.\/model-route.mjs'/);
  assert.ok(source.includes(`isModelRoute(location.pathname,'${stem}')`));
 }
});
test('deployment artifact verifier exists',()=>assert.ok(contract?.verifyDeployment));
test('source headers, noindex policy and fallback satisfy deployment contract',{skip:!contract},async()=>{await contract.verifyDeployment(read);});
test('deployment contract rejects missing or weakened security and fallback files',{skip:!contract},async()=>{
 const bad=[['_headers',null],['_headers',s=>s.replace("script-src 'self'","script-src * 'unsafe-inline'")],['_headers',s=>s.replace("frame-ancestors 'none'","frame-ancestors *")],['_headers',s=>s.replace('X-Robots-Tag: noindex, nofollow','X-Robots-Tag: all')],['404.html',null],['404.html',s=>s.replace('href="/"','href="../"')],['404.html',s=>s.replace('</body>','<script src="/extra.js"></script></body>')],['app/oxygen-model.html',s=>s.replace('noindex,nofollow','index,follow')]];
 for(const [path,mutate]of bad)await assert.rejects(contract.verifyDeployment(async p=>{if(p!==path)return read(p);if(!mutate)throw Error('missing '+p);return mutate(await read(p));}),path);
});
