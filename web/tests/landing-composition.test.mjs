import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
test('landing leaves experiment selection to the dedicated chooser',async()=>{
 const landing=await readFile(new URL('../src/Landing.jsx',import.meta.url),'utf8');
 const project=await readFile(new URL('../src/project.js',import.meta.url),'utf8');
 const page=await readFile(new URL('../src/ProjectPage.tsx',import.meta.url),'utf8');
 assert.match(landing,/<ProjectPage project=\{project\}\/>/);
 assert.doesNotMatch(landing+project,/Three experiments|lessons-title|className="project-details"/);
 assert.match(project,/label:'Open the lab',href:'\.\/lab\.html'/);
 assert.match(project,/pressure-comparison\.png/);
 assert.match(project,/licencesHref:'\.\/licences\.html'/);
 assert.match(page,/>About &amp; licences</);
 const chooser=await readFile(new URL('../src/Lab.jsx',import.meta.url),'utf8');
 for(const path of ['./app/','./app/oxygen.html','./app/respiratory.html'])assert.ok(chooser.includes(`href="${path}"`));
});
