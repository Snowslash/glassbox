import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as m from '../src/pericardial-model.mjs';
const raw=JSON.parse(await readFile(new URL('../../evidence/pericardial/lesson-data.json',import.meta.url)));
const clone=()=>structuredClone(raw);
test('prediction gates progression, displays baseline and hides outcome after rewind',()=>{
 let s=m.initialState();assert.equal(m.showOutcome(s),false);assert.equal(m.transition(s,{type:'next'}).step,0);
 s=m.transition(s,{type:'skip'});assert.equal(s.step,1);
 s=m.transition(s,{type:'seek',index:31500});assert.equal(m.showOutcome(s),true);
 s=m.transition(s,{type:'back'});assert.equal(m.displayIndex(s),0);assert.equal(m.showOutcome(s),false);
});
test('playback, speeds, replay, selection and memory-only reflection transitions',()=>{
 let s=m.transition(m.initialState(),{type:'skip'});
 for(const speed of [1,10,30]){s=m.transition(s,{type:'speed',value:speed});assert.equal(s.speed,speed);}
 s=m.transition(s,{type:'play'});s=m.transition(s,{type:'tick',count:123});assert.equal(s.index,123);
 s=m.transition(s,{type:'pause'});assert.equal(s.playing,false);
 s=m.transition(s,{type:'reflection',value:'private draft'});s=m.transition(s,{type:'branch',value:'control'});
 assert.equal(s.reflection,'private draft');assert.equal(s.branch,'control');
 s=m.transition(s,{type:'replay'});assert.equal(s.index,0);assert.equal(s.playing,false);
});
test('trend geometry is exact original prefix on stable shared axes at interior and rewind',()=>{
 const d=m.validateData(raw);
 for(const b of ['control','effusion'])for(const i of [0,59,12345,31500,50,0]){
 const g=m.geometry(d,b,'cvp',i);const rows=raw.branches[b].trendRows.filter(r=>r[0]<=i);
 assert.equal(g.points.length,rows.length);assert.deepEqual(g.indices,rows.map(r=>r[0]));
 assert.deepEqual(g.points,rows.map(r=>[40+r[1]/630*520,180-r[3]/10*160]));
 }
});
test('completed beats use original rising edges, exclusive end, actual timestamps and sampled maximum',()=>{
 const d=m.validateData(raw);
 for(const b of ['control','effusion']){assert.equal(m.latestCycle(d,b,0),null);
 for(const c of raw.branches[b].completeCycles){
 const before=m.latestCycle(d,b,c.endStep-1);assert.ok(!before||before.endStep<c.endStep);
 const actual=m.latestCycle(d,b,c.endStep);assert.ok(actual,"completed beat must be available at its end boundary");assert.equal(actual.id,c.id);
 const g=m.geometry(d,b,'pv',c.endStep),rows=raw.branches[b].pvRows.slice(c.startIndex,c.endIndex);
 assert.deepEqual(g.indices,rows.map(r=>r[0]));assert.equal(g.points.length,c.endIndex-c.startIndex);
 assert.deepEqual(g.points,rows.map(r=>[40+r[3]/160*520,180-r[2]/40*160]));
 assert.equal(actual.maxVolume_mL,Math.max(...rows.map(r=>r[3])));
 }}
});
test('malformed, nonfinite, column-swapped and future-cycle data fail closed',()=>{
 for(const mutate of [d=>d.schemaVersion=2,d=>d.branches.effusion.pvRows[2][2]=Infinity,d=>d.branches.control.trendRows[1][3]=null,d=>d.branches.control.pvColumns.reverse(),d=>d.branches.control.latestCompleteCycleIds[0]=0,d=>d.branches.control.completeCycles[0].maxVolume_mL++]){const d=clone();mutate(d);assert.throws(()=>m.validateData(d),/integrity/);}
});
test('approval and hash mismatch or failed scientific checks refuse playback',()=>{
 for(const [c,r,h] of [[{status:'FAIL'},{status:'PASS'},{}],[{status:'PASS',testsRun:11,skipped:0,failures:[]},{status:'PASS',parentUIApproved:true},{}]])assert.throws(()=>m.validateGate(c,r,h),/integrity/);
});
test('route snapshot excludes prediction/reflection and preserves displayed row only',()=>{
 const s={...m.initialState(),index:12345,step:3,compare:true,branch:'control',reflection:'secret',prediction:'yes'};
 const href=m.modelHref(s);assert.ok(!href.includes('secret'));assert.ok(!href.includes('yes'));
 const parsed=m.readRoute(href.split('?')[1]);assert.equal(parsed.index,12345);assert.equal(parsed.branch,'control');assert.equal(parsed.compare,true);
 assert.equal(m.readRoute('sample=Infinity&branch=bad').index,0);
 assert.equal(m.readRoute(m.modelHref({...s,step:0}).split('?')[1]).index,0);
});
