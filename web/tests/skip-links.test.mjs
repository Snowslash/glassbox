import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const css=await readFile(new URL('../src/project.css',import.meta.url),'utf8');
test('skip shortcuts have offscreen default and immediate focus reveal',()=>{
 assert.match(css,/\.skip-link\{[^}]*position:fixed/);
 assert.match(css,/\.skip-link\{[^}]*translateY\(calc\(-100%/);
 assert.match(css,/\.skip-link:focus\{[^}]*transform:none/);
 assert.match(css,/\.skip-link\{[^}]*transition:none!important/);
 assert.doesNotMatch(css,/\.skip-link[^}]*display:none/);
});
test('every project page has a focusable native skip destination',async()=>{
 for(const name of ['Landing.jsx','Lab.jsx','licences-main.jsx']){
  const source=await readFile(new URL('../src/'+name,import.meta.url),'utf8');
  assert.match(source,/className="skip-link" href="#main-content"/);
  assert.match(source,/id="main-content" tabIndex=\{-1\}/);
 }
});
