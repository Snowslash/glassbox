import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const web=new URL('../',import.meta.url),text=p=>readFile(new URL(p,web),'utf8');
test('landing opens the lesson chooser without replacing its evidence image',async()=>{
 const source=await text('src/Landing.jsx');
 assert.match(source,/id="start-lab"[^>]*href="\.\/lab\.html">Open lab/);
 assert.match(source,/pressure-comparison\.png/);
 assert.match(await text('index.html'),/href="\.\/lab\.html">Open lab/);
});
test('chooser is a real static entrypoint with all three direct lesson links',async()=>{
 const html=await text('lab.html').catch(()=>''),view=await text('src/Lab.jsx').catch(()=>'');
 assert.match(html,/<h1>Choose an experiment<\/h1>/,'Missing chooser entrypoint');
 for(const href of ['./app/','./app/oxygen.html','./app/respiratory.html']){
  assert.ok(html.includes(`href="${href}"`),href+' no-JS link missing');
  assert.ok(view.includes(`href="${href}"`),href+' React link missing');
 }
 assert.match(await text('vite.config.mjs'),/'lab.html'/);
 assert.match(view,/PublicEstateHeader/);assert.doesNotMatch(view,/fetch\(/);
});
test('each lesson retains direct navigation and a route back to all lessons',async()=>{
 for(const file of ['App.jsx','OxygenApp.jsx','RespiratoryApp.jsx']){
  const source=await text('src/'+file);assert.match(source,/href="\.\.\/lab\.html">All lessons<\/a>/);
  assert.match(source,/aria-label="Experiments"/);assert.match(source,/Project overview/);
 }
});
