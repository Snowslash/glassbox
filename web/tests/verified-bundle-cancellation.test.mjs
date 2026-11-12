import test from 'node:test';
import assert from 'node:assert/strict';
import {readVerifiedBundle} from '../src/verified-bundle.mjs';

const deferred = () => Promise.withResolvers();
const files = {first:'/first.json', second:'/second.json'};
const observe = promise => promise.then(value => ({value}), error => ({error}));

test('a pre-aborted read makes no request and keeps the AbortSignal reason', async () => {
  const c = new AbortController(); c.abort(); let calls = 0;
  const result = await observe(readVerifiedBundle({files, validate:v => v}, {signal:c.signal,
    fetch:async () => {calls++; return new Response('{}');},
  }));
  assert.equal(result.error, c.signal.reason);
  assert.equal(calls, 0);
});

for (const boundary of ['fetch', 'body', 'hash', 'validate']) {
  test(`abort during ${boundary} rejects a late success without further work`, {timeout:2000}, async () => {
    const c = new AbortController(), entered = deferred(), release = deferred(), calls = [];
    const hold = async value => {entered.resolve(); await release.promise; return value;};
    const descriptor = {files, verifyHash:() => calls.push('verify'), validate:async values => {
      calls.push('validate'); return boundary === 'validate' ? hold(values) : values;
    }};
    const pending = observe(readVerifiedBundle(descriptor, {signal:c.signal,
      fetch:async url => {
        calls.push(url);
        const response = new Response('{}');
        if (boundary === 'fetch') return hold(response);
        if (boundary === 'body') return {ok:true, arrayBuffer:() => hold(new TextEncoder().encode('{}').buffer)};
        return response;
      },
      hash:async () => {calls.push('hash'); return boundary === 'hash' ? hold('digest') : 'digest';},
    }));
    await entered.promise;
    c.abort();
    const before = [...calls];
    release.resolve();
    const result = await pending;
    assert.equal(result.error?.name, 'AbortError');
    assert.deepEqual(calls, before, 'no next read, hash, verifier or validation after cancellation');
  });
}

test('abort during a failing transport is cancellation, not a stale error', async () => {
  const c = new AbortController(), entered = deferred(), response = deferred();
  const pending = observe(readVerifiedBundle({files, validate:v => v}, {signal:c.signal,
    fetch:() => {entered.resolve(); return response.promise;},
  }));
  await entered.promise;
  c.abort(); response.reject(new Error('late network error'));
  assert.equal((await pending).error, c.signal.reason);
});

test('abort inside a verifier prevents the next read and final validation', async () => {
  const c = new AbortController(), calls = [];
  const result = await observe(readVerifiedBundle({files,
    verifyHash:() => c.abort(), validate:() => calls.push('validate'),
  }, {signal:c.signal, fetch:async url => {calls.push(url); return new Response('{}');}}));
  assert.equal(result.error, c.signal.reason);
  assert.deepEqual(calls, [files.first]);
});

test('a cancelled acquisition cannot replace a later successful independent acquisition', async () => {
  const c = new AbortController(), entered = deferred(), old = deferred();
  const descriptor = {files:{lesson:'/lesson.json'}, validate:v => v.lesson};
  const stale = observe(readVerifiedBundle(descriptor, {signal:c.signal,
    fetch:() => {entered.resolve(); return old.promise;},
  }));
  await entered.promise;
  c.abort();
  const current = await readVerifiedBundle(descriptor, {fetch:async () => new Response('{"attempt":2}')});
  old.resolve(new Response('{"attempt":1}'));
  assert.equal((await stale).error?.name, 'AbortError');
  assert.deepEqual(current, {attempt:2});
});
