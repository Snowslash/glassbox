import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {labels,axes} from '../src/pericardial-model.mjs';
const source=await readFile(new URL('../src/PericardialApp.jsx',import.meta.url),'utf8');
const guided=source.split('function Model(')[0],details=source.split('function Model(')[1];
test('opening prediction concerns external pressure and paired physiological changes',()=>{
 const opening=source.slice(source.indexOf('{predict?<>'),source.indexOf('</fieldset>'));
 for(const wording of ["As pressure around the heart increases, what do you expect to happen to central venous pressure and heart filling?", "Central venous pressure rises, but the heart fills less.", "Central venous pressure rises and the heart fills more."])assert.ok(opening.includes(wording),wording);
 assert.ok(!opening.includes('higher venous pressure means more filling'));
 assert.ok(!opening.includes('Yes, they can coexist'));
});

test('student recording labels and volume axis avoid circuit terminology',()=>{
 assert.deepEqual(labels,{control:'No added fluid',effusion:'Fluid around the heart'});
 assert.equal(axes.pv.xLabel,'Amount in model chamber (mL)');
});
test('guided lesson defines the medical terms and explains difficult filling',()=>{
 assert.match(guided,/sac around the heart \(the pericardium\)/);
 assert.match(guided,/<strong>Venous pressure<\/strong> is the pressure in the large veins returning blood to the heart/);
 assert.match(guided,/<strong>Cardiac output<\/strong> is how much blood the heart pumps each minute/);
 assert.match(guided,/Blood can back up in the veins/);
 assert.match(guided,/transmural pressure/);
});
test('guided captions retain model and timing boundaries without engineering prose',()=>{
 for(const jargon of ['lumped model circuit storage','actual applied support pressure','ground reference','derived arithmetic','Original 0.02 s samples','end excluded','cycle-maximum model storage'])assert.ok(!guided.toLowerCase().includes(jargon.toLowerCase()),jargon);
 assert.match(guided,/most recently completed heartbeat/);
 assert.match(guided,/not the exact volume of a real ventricle/);
 assert.match(guided,/not the full pressure of the surrounding fluid/);
 assert.match(guided,/Averages over the last 30 seconds/);
});
test('model details retain exact field meanings, coupling, cadence and caveats',()=>{
 for(const phrase of ['RightHeart1_V_mL','RightHeart3_P_mmHg','0.4 ×','two-row lag','0.02 s','endStep ≤ cursor','derived arithmetic','Tachycardia','Antidiuresis','24.842417884268798','24.981287129699012'])assert.ok(details.includes(phrase),phrase);
});
