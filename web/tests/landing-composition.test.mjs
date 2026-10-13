import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
test('landing leaves experiment selection to the dedicated chooser',async()=>{
 const landing=await readFile(new URL('../src/Landing.jsx',import.meta.url),'utf8');
 assert.doesNotMatch(landing,/Three experiments|lessons-title|className="project-details"/);
 assert.match(landing,/href="\.\/lab\.html">Open lab/);
 assert.match(landing,/pressure-comparison\.png/);
 assert.match(landing,/About &amp; licences/);
 const chooser=await readFile(new URL('../src/Lab.jsx',import.meta.url),'utf8');
 for(const path of ['./app/','./app/oxygen.html','./app/respiratory.html'])assert.ok(chooser.includes(`href="${path}"`));
});
