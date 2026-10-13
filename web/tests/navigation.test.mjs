import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {initialState,selectFrame} from '../src/model.mjs';
const data=JSON.parse(readFileSync(new URL('../../evidence/engine/lesson-data.json',import.meta.url)));
async function navigation(){
 assert.ok(existsSync(new URL('../src/navigation.mjs',import.meta.url)),'Separate model-page navigation is missing');
 return import('../src/navigation.mjs');
}
test('model page URL carries the displayed original frame, not hidden prediction progress',async()=>{
 const {modelHref,readModelState}=await navigation();
 const state={...initialState(),step:0,index:550,compare:true,selection:'path',trace:'MAP_mmHg'};
 const href=modelHref(selectFrame(data,state),state);
 assert.ok(href.startsWith('./model.html?'));
 const restored=readModelState(new URL(href,'http://example.test/').search,data);
 assert.equal(restored.index,0);assert.equal(restored.compare,false);
 assert.equal(restored.selection,'path');assert.equal(restored.trace,'MAP_mmHg');
});
test('model snapshot retains matching sample, comparison and permitted selection',async()=>{
 const {modelHref,readModelState}=await navigation();
 const state={...initialState(),step:3,index:275,compare:true,selection:'LeftHeart',trace:'strokeVolume_mL',playing:true,explanation:'not in the URL'};
 const href=modelHref(selectFrame(data,state),state);
 const restored=readModelState(new URL(href,'http://example.test/').search,data);
 assert.equal(restored.index,275);assert.equal(restored.compare,true);
 assert.equal(restored.selection,'LeftHeart');assert.equal(restored.trace,'strokeVolume_mL');
 assert.equal(restored.step,3);assert.equal(restored.playing,false);
 assert.equal(restored.explanation,'');assert.ok(!href.includes('explanation'));
});
test('invalid direct model queries select a safe original baseline without coercing malformed tokens',async()=>{
 const {readModelState}=await navigation();
 for(const sample of ['-1','1.2','551','Infinity','NaN','275junk','1e2','01','']){
  const s=readModelState('?sample='+sample+'&compare=true&selection=unknown&trace=missing',data);
  assert.equal(s.index,0,sample);assert.equal(s.compare,false);
  assert.equal(s.selection,'Aorta');assert.equal(s.trace,'bloodVolume_mL');
 }
 for(const index of [0,1,275,550])assert.equal(readModelState('?sample='+index,data).index,index);
});
test('model page detection is explicit and lesson hashes are not routes',async()=>{
 const {isModelPath}=await navigation();
 assert.equal(isModelPath('/model.html'),true);assert.equal(isModelPath('/prefix/model.html'),true);
 for(const p of ['/','/index.html','/other-model.html','/model.html/'])assert.equal(isModelPath(p),false);
});
test('both static HTML entrypoints retain strict CSP and shared app entry',()=>{
 for(const file of ['index.html','model.html']){
  const path=new URL('../app/'+file,import.meta.url);assert.ok(existsSync(path),'Missing '+file);
  const html=readFileSync(path,'utf8');assert.match(html,/Content-Security-Policy/);assert.match(html,/src="\.\.\/src\/main.jsx"/);
  assert.doesNotMatch(html,/unsafe-inline|unsafe-eval|https:\/\/.*<script/);
 }
});
