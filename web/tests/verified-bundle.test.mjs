import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readVerifiedBundle} from '../src/verified-bundle.mjs';

const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const files = {approval:'../evidence/approval.json', lesson:'../evidence/lesson.json'};

test('reads ordered original bytes with injected fetch/hash and returns only validated output', async () => {
  const controller = new AbortController(), requests = [], hashed = [], verified = [];
  const texts = ['{"accepted":true}', '{"unit":"mL O₂/dL", "value":14.440000000000001}\n'];
  const result = await readVerifiedBundle({files,
    verifyHash: (key, hash) => verified.push([key, hash]),
    validate: (values, hashes) => ({values, hashes, validated:true}),
  }, {
    signal:controller.signal,
    fetch:async (url, options) => {requests.push({url, options}); return new Response(texts[requests.length - 1]);},
    hash:async bytes => {hashed.push(Buffer.from(bytes).toString()); return digest(bytes);},
  });
  assert.deepEqual(result, {values:{approval:JSON.parse(texts[0]), lesson:JSON.parse(texts[1])},
    hashes:{approval:digest(texts[0]), lesson:digest(texts[1])}, validated:true});
  assert.deepEqual(requests, Object.values(files).map(url => ({url, options:{signal:controller.signal, cache:'no-cache'}})));
  assert.deepEqual(hashed, texts);
  assert.deepEqual(verified, Object.keys(files).map((key, i) => [key, digest(texts[i])]));
});

test('schema-only acquisition can omit hashing without manufacturing a digest', async () => {
  const result = await readVerifiedBundle({files:{lesson:files.lesson}, validate:(values, hashes) => ({...values, hashes})},
    {fetch:async () => new Response('{"value":2}')});
  assert.deepEqual(result, {lesson:{value:2}, hashes:{}});
});

test('HTTP failure retains the refusal text and does not read another file', async () => {
  const requested = [];
  await assert.rejects(readVerifiedBundle({files, validate:values => values}, {fetch:async url => {
    requested.push(url); return new Response('unavailable', {status:503});
  }}), {message:'Data request failed (503).'});
  assert.deepEqual(requested, [files.approval]);
});

test('transport failure propagates without a substituted result', async () => {
  const error = new TypeError('offline');
  await assert.rejects(readVerifiedBundle({files, validate:v => v}, {fetch:async () => {throw error;}}), e => e === error);
});

test('body read failure propagates without validation', async () => {
  const error = new Error('body lost'); let validated = false;
  await assert.rejects(readVerifiedBundle({files, validate:() => {validated = true;}}, {
    fetch:async () => ({ok:true, arrayBuffer:async () => {throw error;}}),
  }), e => e === error);
  assert.equal(validated, false);
});

test('invalid JSON is refused rather than replaced with empty values', async () => {
  await assert.rejects(readVerifiedBundle({files, validate:v => v}, {fetch:async () => new Response('{broken')}), SyntaxError);
});

test('per-file refusal precedes JSON parsing and any subsequent request', async () => {
  let calls = 0, validated = false;
  await assert.rejects(readVerifiedBundle({files,
    verifyHash:() => {throw new Error('experiment-specific refusal');},
    validate:() => {validated = true;},
  }, {fetch:async () => {calls++; return new Response('{broken');}, hash:digest}), {message:'experiment-specific refusal'});
  assert.equal(calls, 1);
  assert.equal(validated, false);
});

test('final scientific validation failure never returns a partially read bundle', async () => {
  await assert.rejects(readVerifiedBundle({files, validate:() => {throw new Error('scientific refusal');}},
    {fetch:async () => new Response('{}'), hash:digest}), {message:'scientific refusal'});
});
