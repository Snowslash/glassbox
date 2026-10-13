import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=async name=>JSON.parse(await readFile(new URL('../../evidence/oxygen/'+name,import.meta.url)));
const data=await read('lesson-data.json'),checks=await read('checks.json'),review=await read('review.json');
let m;try{m=await import('../src/oxygen-model.mjs');}catch{}
test('oxygen model exists',()=>assert.ok(m,'second lesson model is missing'));
const run=(name,fn)=>test(name,{skip:!m},fn);
run('original source schema and all original rows accepted',()=>assert.equal(m.validateData(data),data));
run('malformed schema, timings, mappings and quantities fail closed',()=>{
 for(const change of [d=>d.gateStatus='FAIL',d=>d.experimentId='other',d=>d.fieldMap[0].timeSemantics='',d=>d.runs.anaemia.samples.pop(),d=>d.runs.control.samples[3].time_s=4,d=>d.runs.anaemia.samples[4].SaO2_fraction=98,d=>d.runs.anaemia.samples[4].Hb_g_dL=NaN,d=>d.action.time_s=0,d=>d.runs.anaemia.samples[60].Hb_g_dL*=.7]){const d=structuredClone(data);change(d);assert.throws(()=>m.validateData(d));}
});
run('field mapping units must retain the native dimensional contract',()=>{for(const field of ['Hb_g_dL','SaO2_fraction','CO_L_min','CaO2_mL_dL','DO2_mL_min','arterialContent_mL_mL']){const d=structuredClone(data);d.fieldMap.find(m=>m.field===field).unit='wrong unit';assert.throws(()=>m.validateData(d),field);}});
run('every field rejects absent and nonfinite or mistyped source values on both runs',()=>{for(const run of ['control','anaemia'])for(const field of Object.keys(data.runs[run].samples[90]))for(const value of [undefined,null,NaN,Infinity,'123']){if(field==='activeEvents'&&typeof value==='string')continue;const d=structuredClone(data);d.runs[run].samples[90][field]=value;assert.throws(()=>m.validateData(d),run+field);}});
run('native unit conversions and algebra reject factors of ten and 100',()=>{
 for(const field of ['CaO2_mL_dL','arterialContent_mL_mL','DO2_mL_min','CO_L_min','Hb_g_dL','aortaHbO2_mmol_L'])for(const factor of [.01,.1,10,100]){const d=structuredClone(data);d.runs.anaemia.samples[200][field]*=factor;assert.throws(()=>m.validateData(d),field);}
});
run('gate requires all contracted checks and fixed recording hash bindings',()=>{
 const h={manifest:review.verifiedManifestSHA256,checks:review.verifiedChecksSHA256,lesson:review.verifiedLessonSHA256};assert.equal(m.validateGate(checks,review,h),true);
 for(const c of [{gateStatus:'PASS'},{...checks,freshRepeat:{status:'FAIL'}},{...checks,sourceRowSelection:{status:'PASS'}}])assert.throws(()=>m.validateGate(c,review,h));
 assert.throws(()=>m.validateGate(checks,{...review,status:'PENDING'},h));assert.throws(()=>m.validateGate(checks,review,{...h,lesson:'bad'}));
});
run('prediction gates advance and never exposes future or comparison',()=>{let s=m.initialState();assert.equal(m.transition(s,{type:'next'},data),s);s={...s,index:360,compare:true};assert.equal(m.selectFrame(data,s).index,0);assert.equal(m.selectFrame(data,s).control,null);s=m.transition(s,{type:'prediction',value:'near'},data);assert.equal(m.transition(s,{type:'next'},data).step,1);});
run('skip, end, replay, tick, seek and visibility pause preserve honest frames',()=>{let s=m.transition(m.initialState(),{type:'skip'},data);s=m.transition(s,{type:'end'},data);assert.equal(s.index,360);s=m.transition(s,{type:'play'},data);assert.equal(s.index,0);assert.equal(s.playing,true);s=m.transition(s,{type:'tick'},data);assert.equal(s.index,1);s=m.transition(s,{type:'pause'},data);assert.equal(s.playing,false);s=m.transition({...s,playing:true,index:359},{type:'tick'},data);assert.equal(s.playing,false);s=m.transition(s,{type:'seek',index:60},data);assert.equal(m.selectFrame(data,s).anaemia,data.runs.anaemia.samples[60]);});
run('comparison is same original index and retained but hidden before Compare',()=>{const s={...m.initialState(),step:3,index:61,compare:true};assert.equal(m.selectFrame(data,s).control,data.runs.control.samples[61]);assert.equal(m.selectFrame(data,{...s,step:2}).control,null);});
run('all trace geometries keep fixed axes and original prefixes including step boundary',()=>{for(const field of m.fields){const full=m.geometry(data,field,360);for(const i of [0,60,61,180,360]){const g=m.geometry(data,field,i);assert.deepEqual(g.domain,full.domain);assert.equal(g.anaemia.length,i+1);assert.equal(g.control.length,i+1);assert.deepEqual(g.anaemia,full.anaemia.slice(0,i+1));}}});
run('content figure uses native content, output and correct litre conversion',()=>{const row=data.runs.anaemia.samples[360],f=m.figure(row);assert.equal(f.content,row.CaO2_mL_dL);assert.equal(f.flow,row.CO_L_min);assert.equal(f.delivery,row.DO2_mL_min);assert.ok(Math.abs(f.content*f.flow*10-f.delivery)<1e-8);assert.equal(m.display(row.SaO2_fraction,'SaO2_fraction'),(row.SaO2_fraction*100).toFixed(2));});
run('step action is drawn with a gap rather than a made-up slope',()=>{assert.equal(typeof m.linePath,'function');const g=m.geometry(data,'Hb_g_dL',61);assert.equal((m.linePath(g.anaemia,true).match(/M/g)||[]).length,2);assert.equal((m.linePath(g.control,false).match(/M/g)||[]).length,1);});
run('static technical routes validate query and never carry reflection',()=>{const s={...m.initialState(),step:4,index:180,compare:true,explanation:'secret',trace:'DO2_mL_min'};const href=m.modelHref(m.selectFrame(data,s),s);assert.doesNotMatch(href,/secret|explanation/);assert.equal(m.readRoute(href.split('?')[1]).index,180);for(const query of ['sample=-1','sample=361','sample=1.2','sample=NaN','sample=01','sample=999999999999999999'])assert.equal(m.readRoute(query).index,0);assert.equal(m.readRoute('compare=yes&trace=bad').compare,false);assert.equal(m.readRoute('trace=bad').trace,m.fields[0]);});
