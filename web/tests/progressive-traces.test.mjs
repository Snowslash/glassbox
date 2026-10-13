import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chartGeometry} from '../src/presentation.mjs';
import {initialState,selectFrame,transition} from '../src/model.mjs';
const data=JSON.parse(readFileSync(new URL('../../evidence/engine/lesson-data.json',import.meta.url)));
const last=data.runs.bleed.samples.length-1;

test('every timer position draws only the original sample prefix for both branches',()=>{
 for(const field of data.defaultTraces) {
  const full=chartGeometry(data,field,last,true);
  for(let index=0;index<=last;index++) {
   const g=chartGeometry(data,field,index,true);
   for(const branch of ['bleed','control']) {
    const points=g[branch].split(' ');
    assert.equal(points.length,index+1);
    assert.deepEqual(points,full[branch].split(' ').slice(0,index+1));
    const [x,y]=points.at(-1).split(',').map(Number);
    assert.ok(Math.abs(x-g.cursor)<=0.0051);
    assert.ok(Math.abs(y-(branch==='bleed'?g.pointY:g.controlPointY))<=0.0051);
   }
  }
 }
});

test('axes stay fixed during playback, backwards seeking and comparison toggles',()=>{
 for(const field of data.defaultTraces) {
  const full=chartGeometry(data,field,last,true);
  for(const index of [0,1,275,last,10,0]) for(const compare of [false,true]) {
   const g=chartGeometry(data,field,index,compare);
   assert.equal(g.min,full.min);assert.equal(g.max,full.max);
   assert.equal(g.cursor,50+index/last*520);
   if(!compare) assert.equal(g.control,'');
  }
 }
});

test('replay and return to prediction reveal only the selected frame, not prior progress',()=>{
 let state=transition(initialState(),{type:'skip'},data);
 state=transition(state,{type:'end'},data);
 state=transition(state,{type:'play'},data);
 assert.equal(state.index,0);
 let frame=selectFrame(data,state);
 assert.equal(chartGeometry(data,'MAP_mmHg',frame.index,false).bleed.split(' ').length,1);
 state=transition(state,{type:'end'},data);
 state=transition(state,{type:'back'},data);
 frame=selectFrame(data,state);
 const g=chartGeometry(data,'MAP_mmHg',frame.index,true,true);
 assert.equal(g.bleed.split(' ').length,1);assert.equal(g.control,'');
 assert.equal(g.cursor,50);
});
