import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const css=await readFile(new URL('../src/project.css',import.meta.url),'utf8');
test('presentation entrances are opt-in to motion and finite',()=>{
 assert.match(css,/@media\s*\(prefers-reduced-motion:\s*no-preference\)/);
 assert.match(css,/@keyframes glassbox-enter/);
 assert.match(css,/\.lesson-row:nth-child\(3\)/);
 assert.doesNotMatch(css,/\binfinite\b|scroll-behavior:\s*smooth|animation-timeline/);
});
test('focus and reduced motion bypass decorative entrance motion',()=>{
 assert.match(css,/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
 assert.match(css,/:focus-within/);
 assert.match(css,/animation:\s*none/);
 assert.match(css,/\.action-arrow/);
 assert.doesNotMatch(css,/\.resp-|\.oxygen-|\.trace|\.working-area/);
});
