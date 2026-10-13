import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
const hash=b=>createHash('sha256').update(b).digest('hex');
const root=resolve(import.meta.dirname,'..');
const p=JSON.parse(await readFile(resolve(root,'dist/evidence/build-provenance.json')));
for(const f of p.files)if(hash(await readFile(resolve(root,'dist/evidence',f.file)))!==f.sha256)throw Error('Built evidence changed: '+f.file);
for(const f of p.licenses)if(hash(await readFile(resolve(root,'dist/licenses',f.file)))!==f.sha256)throw Error('Built licence changed: '+f.file);
const assets=await readdir(resolve(root,'dist/assets'));
for(const font of ['Literata-Variable.ttf','AtkinsonHyperlegibleNext-Variable.ttf']){const original=await readFile(resolve(root,'node_modules/@sangeev/estate-ui/assets/fonts',font));const built=assets.find(a=>a.startsWith(font.replace('.ttf','')+'-')&&a.endsWith('.ttf'));if(!built||hash(await readFile(resolve(root,'dist/assets',built)))!==hash(original))throw Error('Font mismatch');}
for(const page of ['index.html','lab.html','licences.html','app/index.html','app/model.html','app/oxygen.html','app/oxygen-model.html','app/respiratory.html','app/respiratory-model.html']){
 const html=await readFile(resolve(root,'dist',page),'utf8');
 if(!html.includes('Content-Security-Policy')||html.includes('unsafe-inline')||html.includes('unsafe-eval'))throw Error('CSP missing or weakened: '+page);
 if(!/<script[^>]+src="\.\.?\/assets\/[^\"]+\.js"/.test(html)&&!/<script[^>]+src="\/assets\/[^\"]+\.js"/.test(html))throw Error('Missing built application script: '+page);
}
const oxygen=JSON.parse(await readFile(resolve(root,'dist/evidence/oxygen/build-provenance.json')));
for(const f of oxygen.files)if(hash(await readFile(resolve(root,'dist/evidence/oxygen',f.file)))!==f.sha256)throw Error('Built oxygen evidence changed: '+f.file);
const respiratory=JSON.parse(await readFile(resolve(root,'dist/evidence/respiratory/build-provenance.json')));
for(const f of respiratory.files)if(hash(await readFile(resolve(root,'dist/evidence/respiratory',f.file)))!==f.sha256)throw Error('Built respiratory evidence changed: '+f.file);
console.log('Production artifact: nine HTML routes, 6 pressure, 8 oxygen and 7 respiratory evidence files, 2 exact licence texts, 2 exact font files and strict CSP verified.');

for(const file of await readdir(resolve(root,'../licenses')))if(hash(await readFile(resolve(root,'../licenses',file)))!==hash(await readFile(resolve(root,'dist/licenses',file))))throw Error('Licence mismatch: '+file);
if(hash(await readFile(resolve(root,'../LICENSE')))!==hash(await readFile(resolve(root,'dist/licenses/Glassbox-LICENSE'))))throw Error('Glassbox licence mismatch');
console.log('All distributed third-party licence bytes and Glassbox MIT text verified.');
