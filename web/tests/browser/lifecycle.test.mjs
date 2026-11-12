import test, {before, after, beforeEach, afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {startBrowser, filesUnder, dist, artifacts, lessons, seek, indexOf} from './support.mjs';
import {createPage} from './page.mjs';
import {chartGeometry} from '../../src/presentation.mjs';
import {geometry as oxygenGeometry, linePath} from '../../src/oxygen-model.mjs';
import {validateData as respiratoryData, geometry as respiratoryGeometry, breathRange} from '../../src/respiratory-model.mjs';
import {geometry as pericardialGeometry, latestCycle} from '../../src/pericardial-model.mjs';

let server, context, page, errors, network;
before(async () => {server = await startBrowser();}, {timeout:60000});
after(async () => {await server?.close();});
beforeEach(async () => {
  errors = [];
  network = [];
  context = await server.browser.newContext({viewport:{width:1280,height:900}, reducedMotion:'reduce'});
  page = await createPage(context);
  if (process.env.BROWSER_DIAGNOSTICS) {
    for (const event of ['request', 'requestfinished', 'requestfailed']) page.on(event, request => network.push({event, url:request.url(), time:Date.now(), failure:request.failure()}));
    page.on('framenavigated', frame => network.push({event:'framenavigated', url:frame.url(), time:Date.now()}));
    page.on('load', () => network.push({event:'load', url:page.url(), time:Date.now()}));
  }
  page.on('pageerror', e => errors.push(e.message));
  // No external page/request is required to exercise these local lessons.
  await context.route('**/*', route => new URL(route.request().url()).origin === server.origin ? route.continue() : route.abort());
});
afterEach(async t => {
  if (process.env.BROWSER_DIAGNOSTICS) await writeFile(resolve(artifacts, t.name.replace(/[^a-z0-9]+/gi, '-') + '.json'), JSON.stringify({errors, network}, null, 2));
  await context?.close();
  assert.deepEqual(errors, [], 'uncaught application errors');
});

const payload = async l => JSON.parse(await readFile(resolve(dist, l.data.slice(1)), 'utf8'));
const points = a => a.map(p => p.join(',')).join(' ');

async function checkGeometry(l, index) {
  const d = await payload(l);
  if (l.name === 'pressure') {
    for (const figure of await page.locator('.trace').all()) {
      const field = await figure.getAttribute('data-field');
      const g = chartGeometry(d, field, index, true, false);
      assert.equal(await figure.locator('.bleed-line').getAttribute('points'), g.bleed);
      assert.equal(await figure.locator('.control-line').getAttribute('points'), g.control);
      assert.equal(Number(await figure.locator('.trace-value').getAttribute('data-value')), d.runs.bleed.samples[index][field]);
    }
  } else if (l.name === 'oxygen') {
    const field = await page.locator('#oxygen-trace').inputValue();
    const g = oxygenGeometry(d, field, index);
    assert.equal(await page.locator('.oxygen-line').getAttribute('d'), linePath(g.anaemia, true));
    assert.equal(await page.locator('polyline.oxygen-control-line').getAttribute('points'), points(g.control));
    assert.equal(Number(await page.locator(`[data-field="${field}"] .oxygen-value`).getAttribute('data-value')), d.runs.anaemia.samples[index][field]);
  } else if (l.name === 'respiratory') {
    const decoded = respiratoryData(d);
    for (const chart of await page.locator('[data-chart]').all()) {
      const kind = await chart.getAttribute('data-chart');
      for (const line of await chart.locator('polyline').all()) {
        const branch = await line.getAttribute('data-series');
        assert.equal(await line.getAttribute('points'), points(respiratoryGeometry(decoded, branch, kind, index).points));
      }
    }
    const range = breathRange(decoded, 'highR', index);
    assert.ok((await page.locator('#resp-breath-status').textContent()).includes(range.fragment ? 'Partial breath' : range.complete ? 'Complete breath' : 'Breath in progress'));
  } else {
    for (const chart of await page.locator('[data-chart]').all()) {
      const kind = await chart.getAttribute('data-chart');
      for (const line of await chart.locator('polyline').all()) {
        const branch = await line.getAttribute('data-series');
        const g = pericardialGeometry(d, branch, kind, index);
        assert.equal(await line.getAttribute('points'), points(g.points));
        assert.equal(await line.getAttribute('data-indices'), g.indices.join(','));
        assert.ok(g.indices.every(i => i <= index));
        if (kind === 'pv') assert.ok(latestCycle(d, branch, index).endIndex <= index);
      }
    }
  }
}

for (const l of lessons) {
  test(`${l.name}: built recording playback, original prefixes, rewind and paused history`, {timeout:60000}, async () => {
    await page.goto(server.origin + l.path);
    await page.locator(l.work).waitFor();
    assert.equal(await indexOf(page, l), 0);
    await page.getByRole('button', {name:'Skip prediction', exact:true}).click();
    await page.locator(l.next).click();
    await page.locator(l.next).click();
    assert.equal(await page.locator(l.compare).isChecked(), true);
    for (const sample of [l.sample, l.end, 17, 0]) {
      await seek(page, l, sample);
      await checkGeometry(l, sample);
    }
    // Native keyboard focus and range activation, not a synthetic focus event.
    await page.locator(l.time).focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await indexOf(page, l), 1);
    assert.equal(await page.locator(l.time).evaluate(el => el === document.activeElement), true);
    for (const speed of ['1','10','30']) {
      await seek(page, l, 0);
      await page.locator(l.speed).selectOption(speed);
      await page.locator(l.play).click();
      await page.waitForFunction(({work, attr}) => Number(document.querySelector(work)?.getAttribute(attr)) > 0, {work:l.work, attr:l.index});
      await page.locator(l.play).click();
      const stopped = await indexOf(page, l);
      await page.waitForTimeout(150);
      assert.equal(await indexOf(page, l), stopped, 'pause holds the selected original row');
    }
    await page.locator(l.next).click();
    await page.locator(l.reflection).fill('UNSAVED TEST REFLECTION');
    await seek(page, l, l.sample);
    await page.locator(l.play).click();
    await page.locator(l.model).focus();
    await page.keyboard.press('Enter');
    await page.locator(l.modelBody).waitFor();
    const snapshot = Number(new URL(page.url()).searchParams.get('sample'));
    assert.equal(await page.locator(l.heading).evaluate(el => el === document.activeElement), true);
    assert.ok(!page.url().includes('UNSAVED'));
    await page.locator(l.return).click();
    await page.locator(l.work).waitFor();
    assert.equal(await indexOf(page, l), snapshot);
    assert.equal(await page.locator(l.reflection).inputValue(), 'UNSAVED TEST REFLECTION');
    assert.match(await page.locator(l.progress).textContent(), /5 of 5/);
    assert.equal(await page.locator(l.speed).inputValue(), '30');
    assert.equal(await page.locator(l.compare).isChecked(), true);
    assert.equal(await page.locator(l.play).textContent(), 'Play');
    await page.waitForTimeout(200);
    assert.equal(await indexOf(page, l), snapshot);
    await page.goBack();
    await page.locator(l.modelBody).waitFor();
    await page.goForward();
    await page.locator(l.work).waitFor();
    assert.equal(await indexOf(page, l), snapshot);
    assert.equal(await page.locator(l.play).textContent(), 'Play');
    // A direct clean route + refresh must load a real emitted model page.
    await page.locator(l.model).click();
    const clean = page.url().replace('.html?', '?');
    await page.goto(clean);
    await page.reload();
    await page.locator(l.modelBody).waitFor();
  });

  for (const mode of ['http', 'refusal', 'json']) {
    test(`${l.name}: ${mode} failure refuses results and Retry recovers`, {timeout:30000}, async () => {
      const url = server.origin + l.data;
      await page.route(url, async route => {
        if (mode === 'http') return route.fulfill({status:503, body:'fixture unavailable'});
        const body = mode === 'json' ? '{broken' : l.name === 'pressure' ? '{}' : (await readFile(resolve(dist, l.data.slice(1)), 'utf8')) + ' ';
        return route.fulfill({status:200, contentType:'application/json', body});
      });
      await page.goto(server.origin + l.path);
      const alert = page.getByRole('alert');
      await alert.waitFor();
      assert.equal(await page.locator(l.work).count(), 0);
      assert.match(await alert.textContent(), /No results are shown/);
      if (mode === 'http') assert.ok((await alert.textContent()).includes('Data request failed (503).'));
      if (mode === 'refusal') assert.ok((await alert.textContent()).includes(l.refusal));
      await page.unroute(url);
      await page.getByRole('button', {name:'Retry data', exact:true}).click();
      await page.locator(l.work).waitFor();
      assert.equal(await page.getByRole('alert').count(), 0);
      assert.equal(await indexOf(page, l), 0);
    });
  }

  if (l.name !== 'pressure') test(`${l.name}: cancellation stops remaining bundle requests`, {timeout:30000}, async () => {
    await page.addInitScript(({name}) => {
      const original = window.fetch.bind(window);
      window.bundleRequests = [];
      window.fetch = async (url, options) => {
        if (!String(url).includes('/' + name + '/')) return original(url, options);
        window.bundleRequests.push(String(url));
        const response = await original(url, {...options, signal:undefined});
        if (window.bundleRequests.length === 1) await new Promise(resolve => {window.finishFirst = resolve;});
        return response;
      };
    }, {name:l.name});
    await page.goto(server.origin + '/__fixture/tests/browser/mount.html');
    await page.locator(`[data-mount="${l.name}"]`).click();
    await page.waitForFunction(() => window.finishFirst);
    await page.locator('[data-mount="unmount"]').click();
    await page.evaluate(async () => {
      window.finishFirst();
      await new Promise(resolve => setTimeout(resolve, 0));
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
    assert.equal(await page.evaluate(() => window.bundleRequests.length), 1, 'do not request any subsequent file after abort');
  });

  for (const completion of ['resolve', 'reject']) {
    test(`${l.name}: loading/unmount/switch ignores stale ${completion}`, {timeout:30000}, async () => {
      // Hold only the last real payload. Ignore AbortSignal deliberately to prove
      // stale completion cannot replace the newly mounted lesson or its state.
      await page.addInitScript(({target}) => {
        const fetchOriginal = window.fetch.bind(window);
        window.fetch = async (url, options) => {
          if (new URL(url, location.href).pathname !== target) return fetchOriginal(url, options);
          const response = await fetchOriginal(url, {...options, signal:undefined});
          await new Promise((resolve, reject) => {window.pendingLoad = {signal:options.signal, resolve, reject};});
          return response;
        };
      }, {target:l.data});
      await page.goto(server.origin + '/__fixture/tests/browser/mount.html');
      if (l.name !== 'pressure') await page.locator(`[data-mount="${l.name}"]`).click();
      await page.getByRole('status').waitFor();
      await page.waitForFunction(() => window.pendingLoad);
      assert.equal(await page.locator(l.work).count(), 0);
      await page.locator('[data-mount="unmount"]').click();
      assert.equal(await page.evaluate(() => window.pendingLoad.signal.aborted), true);
      const next = lessons[(lessons.indexOf(l) + 1) % lessons.length];
      await page.locator(`[data-mount="${next.name}"]`).click();
      await page.locator(next.work).waitFor();
      await page.getByRole('button', {name:'Skip prediction', exact:true}).click();
      await seek(page, next, next.sample);
      await page.evaluate(async completion => {
        window.pendingLoad[completion](completion === 'reject' ? new Error('late transport failure') : undefined);
        // Drain the old continuation and a render turn, without guessing a delay.
        await new Promise(resolve => setTimeout(resolve, 0));
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      }, completion);
      assert.equal(await page.locator(l.work).count(), 0);
      assert.equal(await page.getByRole('alert').count(), 0);
      assert.equal(await indexOf(page, next), next.sample);
      assert.equal(await page.locator(next.play).textContent(), 'Play');
    });
  }
}

test('all emitted files are served byte-for-byte and all four chooser routes load', {timeout:30000}, async () => {
  const hash = b => createHash('sha256').update(b).digest('hex');
  const files = await filesUnder(dist);
  assert.ok(files.length > 0);
  for (const file of files) {
    const response = await fetch(server.origin + '/' + file);
    assert.equal(response.status, 200, file);
    assert.equal(hash(Buffer.from(await response.arrayBuffer())), hash(await readFile(resolve(dist, file))), file);
  }
  await page.goto(server.origin + '/');
  await page.getByRole('link', {name:'Open the lab', exact:true}).click();
  for (const l of lessons) {
    const link = page.locator(`a[href="./app/${l.name === 'pressure' ? '' : l.name + '.html'}"]`);
    // Pressure is authored as ./app/; use its observed chooser URL.
    await link.click();
    await page.locator(l.work).waitFor();
    await page.goBack();
  }
});

test('built lessons fit desktop and narrow screens in both themes', {timeout:60000}, async () => {
  for (const width of [1280,390,320]) for (const theme of ['light','dark']) for (const l of lessons) {
    await page.setViewportSize({width, height:900});
    await page.goto(server.origin + l.path);
    await page.locator(l.work).waitFor();
    const toggle = page.getByRole('button', {name:`Switch to ${theme} mode`, exact:true});
    if (await toggle.count()) await toggle.click();
    await page.waitForFunction(theme => document.documentElement.dataset.theme === theme, theme);
    assert.equal(await page.locator('html').evaluate(el => el.classList.contains('dark')), theme === 'dark', 'effective theme class must match the screenshot label');
    assert.equal(await page.locator('html').evaluate(el => getComputedStyle(el).colorScheme), theme);
    assert.equal(await page.getByRole('button', {name:`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`, exact:true}).count(), 1);
    await page.getByRole('button', {name:'Skip prediction', exact:true}).click();
    await seek(page, l, l.sample);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${l.name} ${width} ${theme}`);
    if (width !== 390) await page.screenshot({path:resolve(artifacts, `${l.name}-${width}-${theme}.png`), fullPage:true});
    await page.locator(l.model).click();
    await page.locator(l.modelBody).waitFor();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${l.name} model ${width} ${theme}`);
  }
});
