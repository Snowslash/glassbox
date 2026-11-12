import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {readVerifiedBundle} from '../src/verified-bundle.mjs';
import {pressureBundle} from '../src/pressure-bundle.mjs';
import {oxygenBundle} from '../src/oxygen-bundle.mjs';
import {respiratoryBundle} from '../src/respiratory-bundle.mjs';
import {pericardialBundle} from '../src/pericardial-bundle.mjs';

const hash = b => createHash('sha256').update(b).digest('hex');
const cases = [
  {name:'pressure', descriptor:pressureBundle, files:{lesson:'lesson-data'}, pins:[], refusal:'Recorded data failed its integrity contract. No substitute values are shown.'},
  {name:'oxygen', descriptor:oxygenBundle, files:{manifest:'manifest', checks:'checks', review:'review', lesson:'lesson-data'}, pins:['manifest','checks','lesson'], refusal:'Oxygen recording failed its integrity contract. No substitute values are shown.'},
  {name:'respiratory', descriptor:respiratoryBundle, files:{manifest:'manifest', checks:'checks', review:'review', fieldMap:'field-map', playback:'playback'}, pins:['manifest','checks','review','fieldMap','playback'], refusal:'The recording or its approval has changed. Integrity check stopped playback.'},
  {name:'pericardial', descriptor:pericardialBundle, files:{approval:'approval', checks:'checks', lesson:'lesson-data'}, pins:['approval','checks','lesson'], refusal:'Recording integrity mismatch. Playback stopped.'},
];

for (const c of cases) {
  c.bytes = {}; c.urls = {};
  for (const [key, file] of Object.entries(c.files)) {
    const source = c.name === 'pressure' ? 'engine/' + file : key === 'playback' ? 'ui/respiratory/playback' : c.name + '/' + file;
    c.bytes[key] = await readFile(new URL('../../evidence/' + source + '.json', import.meta.url));
    c.urls[key] = '../evidence/' + (c.name === 'pressure' ? '' : c.name + '/') + file + '.json';
  }
  const load = async ({change = (key, bytes) => bytes, digest = hash, requests = []} = {}) => readVerifiedBundle(c.descriptor, {
    hash:c.name === 'pressure' ? undefined : digest,
    fetch:async url => {
      requests.push(url);
      const key = Object.keys(c.urls).find(key => c.urls[key] === url);
      assert.ok(key, 'unexpected descriptor URL: ' + url);
      return new Response(change(key, c.bytes[key]));
    },
  });

  test(`${c.name} descriptor preserves ordered acquisition and every original payload value`, async () => {
    const requests = [], result = await load({requests});
    // Assert output presence before inspecting fields: a missing implementation
    // must fail this behaviour, not throw a setup/property-access error.
    assert.ok(result, 'validated lesson output');
    assert.deepEqual(requests, Object.values(c.urls));
    const raw = Object.fromEntries(Object.entries(c.bytes).map(([k, b]) => [k, JSON.parse(b)]));
    if (c.name === 'respiratory') {
      assert.deepEqual(result.mapping, raw.fieldMap);
      for (const branch of ['control','highR','lowC']) {
        assert.deepEqual(result.data.runs[branch], raw.playback.runs[branch].map(row => Object.fromEntries(raw.playback.columns.map((field, i) => [field, row[i]]))));
      }
      assert.deepEqual(result.data.breaths, raw.playback.breaths);
    } else if (c.name === 'pericardial') assert.deepEqual(result, raw);
    else assert.deepEqual(result, raw.lesson);
  });

  for (const key of c.pins) test(`${c.name} refuses changed ${key} bytes with its original message`, async () => {
    await assert.rejects(load({change:(k, bytes) => k === key ? Buffer.concat([bytes, Buffer.from(' ')]) : bytes}), {message:c.refusal});
  });

  test(`${c.name} invokes its schema validator even with accepted digests`, async () => {
    // Hash injection isolates the schema callback; not a claim of accepted real
    // tampered evidence. Actual hashing/refusal is exercised separately above.
    const key = c.name === 'respiratory' ? 'playback' : 'lesson';
    const digests = Object.values(c.bytes).map(hash); let i = 0;
    await assert.rejects(load({change:(k, b) => k === key ? '{}' : b, digest:() => digests[i++]}),
      c.name === 'pressure' ? {message:c.refusal} : /integrity contract/);
  });

  if (c.name !== 'pressure') for (const key of ['checks', c.name === 'pericardial' ? 'approval' : 'review']) {
    test(`${c.name} retains scientific ${key} checks independently of byte hashing`, async () => {
      const digests = Object.values(c.bytes).map(hash); let i = 0;
      await assert.rejects(load({change:(k, b) => k === key ? '{}' : b, digest:() => digests[i++]}), /integrity contract/);
    });
  }

  if (c.name === 'pressure' || c.name === 'oxygen') test(`${c.name} retains its intentionally unpinned browser bytes`, async () => {
    const key = c.name === 'pressure' ? 'lesson' : 'review';
    assert.ok(await load({change:(k, b) => k === key ? Buffer.concat([b, Buffer.from(' ')]) : b}));
  });
}
