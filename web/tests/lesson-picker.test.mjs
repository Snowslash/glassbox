import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const web=new URL('../',import.meta.url),text=p=>readFile(new URL(p,web),'utf8');
test('landing opens the lesson chooser without replacing its evidence image',async()=>{
 const source=await text('src/project.js');
 assert.match(source,/actions:\[\{label:'Open the lab',href:'\.\/lab\.html'\}\]/);
 assert.match(source,/pressure-comparison\.png/);
 assert.match(await text('index.html'),/href="\.\/lab\.html">Open the lab/);
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
for(const file of ['App.jsx','OxygenApp.jsx','RespiratoryApp.jsx']){
 test(file+' has one project return above the title, not a bottom lesson directory',async()=>{
  const source=await text('src/'+file);
  assert.equal((source.match(/<ProjectNavigation\s*\/>/g)||[]).length,1);
  assert.ok(source.indexOf('<ProjectNavigation')<source.indexOf('<EstatePageTitle'));
  assert.doesNotMatch(source,/aria-label="Experiments"|>All lessons<|className="(?:oxygen-nav|resp-experiments)"/);
  assert.match(source,/Model details/);assert.match(source,/Return to lesson/);
 });
 test(file+' starts with the question without decorative heading labels',async()=>{
  const source=await text('src/'+file);
  const title=source.indexOf('<EstatePageTitle'),end=source.indexOf('</EstatePageTitle>',title);
  assert.doesNotMatch(source.slice(source.lastIndexOf('<EstateShell',title),title),/className="eyebrow"/);
  assert.doesNotMatch(source.slice(end,source.indexOf('<nav',end)),/<p(?:>|\s)/);
 });
}
test('project return is a native button-styled link to the overview',async()=>{
 const source=await text('src/ProjectNavigation.jsx').catch(()=>'');
 assert.match(source,/<nav[^>]*aria-label="Project"/);
 assert.match(source,/<a[^>]*className="estate-primary-action"[^>]*href="\.\.\/"/);
 assert.equal((source.match(/<a\s/g)||[]).length,1);
 assert.match(source,/Project overview/);assert.doesNotMatch(source,/onClick|role="button"/);
});
