import test from 'node:test';
import assert from 'node:assert/strict';
import {createPage} from './browser/page.mjs';

// A controllable browser-protocol boundary is needed to exercise stalled page
// creation without deliberately exhausting Chromium or the host's task budget.
function context(newPage) {
  const state = {action:0, navigation:0, closed:false};
  return {state, setDefaultTimeout:value => state.action = value,
    setDefaultNavigationTimeout:value => state.navigation = value,
    close:async () => {state.closed = true;},
    newPage:() => newPage(state)};
}

test('page creation configures deadlines before calling the browser', async () => {
  const page = {}, c = context(state => {
    assert.equal(state.action, 50);
    assert.equal(state.navigation, 50);
    return Promise.resolve(page);
  });
  assert.equal(await createPage(c, 50), page);
  assert.equal(c.state.closed, false);
});

test('stalled page creation closes its context and fails at the deadline', async () => {
  const c = context(() => new Promise(() => {}));
  let timer;
  try {
    const result = await Promise.race([
      createPage(c, 10).then(() => 'unexpected page', error => error.message),
      new Promise(resolve => {timer = setTimeout(() => resolve('unbounded'), 200);}),
    ]);
    assert.equal(result, 'Browser page creation exceeded 10 ms');
    assert.equal(c.state.closed, true);
  } finally {clearTimeout(timer);}
});

test('failed page creation preserves its error and closes the context', async () => {
  const error = new Error('browser disconnected');
  const c = context(async () => {throw error;});
  await assert.rejects(createPage(c, 50), e => e === error);
  assert.equal(c.state.closed, true);
});
