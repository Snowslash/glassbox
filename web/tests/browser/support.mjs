import {createServer} from 'node:http';
import {readFile, mkdir, readdir} from 'node:fs/promises';
import {resolve, extname, sep} from 'node:path';

import {chromium} from 'playwright';

export const web = resolve(import.meta.dirname, '../..');
export const dist = resolve(web, 'dist');
export const artifacts = resolve(process.env.BROWSER_ARTIFACT_DIR || resolve(web, 'test-results/browser'));
const fixture = resolve(web, '.runtime/lifecycle-fixture');
const types = {'.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.ttf':'font/ttf'};

// Static emitted bytes only: no dev transform, SPA fallback, remote service or host instrumentation.
export async function startBrowser() {
  await readFile(resolve(dist, 'app/index.html')); // Missing build is an error, never a skipped suite.
  await mkdir(artifacts, {recursive:true});
  await readFile(resolve(fixture, 'tests/browser/mount.html')); // Built by test:browser before this process starts.
  const server = createServer(async (req, res) => {
    try {
      const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      const isFixture = path.startsWith('/__fixture/');
      const root = isFixture ? fixture : dist;
      const relative = isFixture ? path.slice('/__fixture/'.length) : path.slice(1);
      let file = resolve(root, relative.endsWith('/') || !relative ? relative + 'index.html' : relative);
      if (!file.startsWith(root + sep)) { res.writeHead(403).end(); return; }
      // Prefer exact emitted files (including extensionless _headers).
      // Only missing clean routes fall back to their real emitted HTML.
      let bytes;
      try { bytes = await readFile(file); }
      catch (error) {
        if (error.code !== 'ENOENT' || extname(file)) throw error;
        file += '.html';
        bytes = await readFile(file);
      }
      res.writeHead(200, {'Content-Type':types[extname(file)] || 'application/octet-stream', 'Cache-Control':'no-store'}).end(bytes);
    } catch {
      res.writeHead(404, {'Content-Type':'text/html'}).end(await readFile(resolve(dist, '404.html')));
    }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await chromium.launch({headless:true, args:['--renderer-process-limit=1', '--disable-gpu']});
  } catch (error) {
    await new Promise(resolve => server.close(resolve));
    throw error;
  }
  return {browser, origin, close:async () => {await browser.close(); await new Promise(resolve => server.close(resolve));}};
}

export async function filesUnder(root, prefix='') {
  const entries = await readdir(resolve(root, prefix), {withFileTypes:true});
  const lists = await Promise.all(entries.map(e => e.isDirectory() ? filesUnder(root, prefix + e.name + '/') : [prefix + e.name]));
  return lists.flat();
}

export const lessons = [
  {name:'pressure', path:'/app/', work:'.working-area[data-index]', index:'data-index', time:'#time', play:'#play', next:'#next', back:'#back', speed:'select[aria-label="Playback speed"]', model:'#model-details-link', return:'#return-to-lesson', progress:'.lesson-progress', reflection:'#explanation', compare:'#compare', modelBody:'.model-page', heading:'#page-heading', end:550, sample:123, data:'/evidence/lesson-data.json', refusal:'Recorded data failed its integrity contract. No substitute values are shown.'},
  {name:'oxygen', path:'/app/oxygen.html', work:'section[data-oxygen-index]', index:'data-oxygen-index', time:'#oxygen-time', play:'#oxygen-play', next:'#oxygen-next', back:'#oxygen-back', speed:'#oxygen-speed', model:'#oxygen-model-link', return:'#oxygen-return', progress:'.oxygen-progress', reflection:'#oxygen-reflection', compare:'#oxygen-compare', modelBody:'#oxygen-model', heading:'h1', end:360, sample:123, data:'/evidence/oxygen/lesson-data.json', refusal:'Oxygen recording failed its integrity contract. No substitute values are shown.'},
  {name:'respiratory', path:'/app/respiratory.html', work:'.resp-work', index:'data-respiratory-index', time:'#resp-time', play:'#resp-play', next:'#resp-next', back:'#resp-back', speed:'#resp-speed', model:'#resp-model-link', return:'#resp-return', progress:'.resp-progress', reflection:'#resp-reflection', compare:'#resp-compare', modelBody:'#resp-model', heading:'h1', end:6000, sample:1777, data:'/evidence/respiratory/playback.json', refusal:'The recording or its approval has changed. Integrity check stopped playback.'},
  {name:'pericardial', path:'/app/pericardial.html', work:'#peri-work', index:'data-index', time:'#peri-time', play:'#peri-play', next:'#peri-next', back:'#peri-back', speed:'#peri-speed', model:'#peri-model-link', return:'#peri-return', progress:'.peri-progress', reflection:'#peri-reflection', compare:'#peri-compare', modelBody:'#peri-model', heading:'h1', end:31500, sample:15555, data:'/evidence/pericardial/lesson-data.json', refusal:'Recording integrity mismatch. Playback stopped.'},
];

export async function seek(page, lesson, index) {
  await page.locator(lesson.time).fill(String(index));
  await page.waitForFunction(({work, attr, index}) => Number(document.querySelector(work)?.getAttribute(attr)) === index, {work:lesson.work, attr:lesson.index, index});
}
export async function indexOf(page, lesson) {return Number(await page.locator(lesson.work).getAttribute(lesson.index));}
