import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const removed='It is not a clinical decision tool, and its value for teaching has not been validated.';
for(const file of ['App.jsx','ModelDetails.jsx']){
 test(`${file} omits the sentence explicitly removed from the interface`,()=>{
  const source=readFileSync(new URL('../src/'+file,import.meta.url),'utf8');
  assert.equal(source.includes(removed),false);
 });
}
