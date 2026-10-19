import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {preparePericardial} from '../scripts/prepare-pericardial.mjs';
import {validateGate,approved} from '../src/pericardial-model.mjs';
const root=resolve(import.meta.dirname,'../..'),hash=b=>createHash('sha256').update(b).digest('hex');
const names={lesson:'lesson-data.json',checks:'checks.json',approval:'approval.json'};
const buffers={},values={};for(const [k,f]of Object.entries(names)){buffers[k]=await readFile(resolve(root,'evidence/pericardial',f));values[k]=JSON.parse(buffers[k]);}
test('approved public scientific bytes bind original payload, checks and approval',()=>{for(const k of Object.keys(names))assert.equal(hash(buffers[k]),approved[k]);assert.equal(buffers.lesson.length,7782514);assert.equal(validateGate(values.checks,values.approval,approved),true);});
test('every independent gate condition and each hash fails closed',()=>{
 for(const mutate of [x=>x.checks.status='FAIL',x=>x.checks.testsRun=10,x=>x.checks.skipped=1,x=>x.checks.failures=['failed'],x=>x.approval.parentUIApproved=false,x=>x.approval.status='FAIL',x=>x.approval.payloadBytes=1,x=>x.approval.payloadSHA256='bad']){const x=structuredClone(values);mutate(x);assert.throws(()=>validateGate(x.checks,x.approval,approved),/integrity/);}
 for(const key of Object.keys(approved))assert.throws(()=>validateGate(values.checks,values.approval,{...approved,[key]:'bad'}),/integrity/);
});
test('real preparation refuses changed bytes and absent files; writes exact approved subset',async()=>{
 const temp=await mkdtemp(resolve(root,'web/.pericardial-test-'));
 try{await mkdir(resolve(temp,'evidence/pericardial'),{recursive:true});for(const [k,f]of Object.entries(names))await writeFile(resolve(temp,'evidence/pericardial',f),buffers[k]);
 await preparePericardial(temp,resolve(temp,'web'));
 for(const [k,f]of Object.entries(names))assert.deepEqual(await readFile(resolve(temp,'web/public/evidence/pericardial',f)),buffers[k]);
 for(const [k,f]of Object.entries(names)){await writeFile(resolve(temp,'evidence/pericardial',f),Buffer.concat([buffers[k],Buffer.from(' ')]));await assert.rejects(preparePericardial(temp,resolve(temp,'web')),/integrity/);await writeFile(resolve(temp,'evidence/pericardial',f),buffers[k]);}
 await rm(resolve(temp,'evidence/pericardial/checks.json'));await assert.rejects(preparePericardial(temp,resolve(temp,'web')),/ENOENT/);
 }finally{await rm(temp,{recursive:true,force:true});}
});
