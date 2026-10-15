import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {project} from '../src/project.js';
const read = name => readFileSync(new URL('../'+name, import.meta.url), 'utf8');
test('initial HTML retains the project facts and real chooser without JavaScript', () => {
 const html = read('index.html');
 for (const text of [project.description, ...project.beforeYouUse, project.limits]) assert.ok(html.includes(text), text);
 for (const href of [project.actions[0].href, project.sourceHref, `https://sangeev.me/#${project.key}`]) assert.ok(html.includes(`href="${href}"`), href);
 assert.equal((html.match(/<h1\b/g) || []).length, 1);
 assert.doesNotMatch(html, /<script[^>]+src="https?:/);
});
test('held screenshot uses a fresh opening identity and exact cancellable figure animation', () => {
 const source = read('src/ProjectPage.tsx');
 for (const contract of ['setHeld({ index })', 'event.target === figure', 'event.animationName === name', '!event.pseudoElement', 'window.clearTimeout(timer)', 'node.removeEventListener("animationend", onEnd)', 'if (dialog.current?.open) return;']) assert.ok(source.includes(contract), contract);
});
