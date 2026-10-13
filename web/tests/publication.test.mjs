import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const m=await import('../scripts/publication-integrity.mjs').catch(()=>null);
test('publication integrity verifier exists',()=>assert.ok(m,'missing fixed-identity verifier'));
test('every included recording rejects missing or tampered bytes',{skip:!m},async()=>{
 const root=new URL('../../',import.meta.url),read=p=>readFile(new URL(p,root));
 await m.verifyPublication(read);
 for(const p of Object.keys(m.pins)){
  await assert.rejects(m.verifyPublication(k=>k===p?Promise.reject(Error('missing')):read(k)));
  await assert.rejects(m.verifyPublication(async k=>k===p?Buffer.concat([await read(k),Buffer.from(' ')]):read(k)));
 }
});
