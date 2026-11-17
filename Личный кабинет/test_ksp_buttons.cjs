const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('KSP polling recovers after timeout, paints ready, and keeps checking Drive', async () => {
  const timers = [];
  const classes = new Set();
  const key = '10 ОГН/2 четверть/2 урок.html';
  const button = {
    dataset: { lessonPath: key }, hidden: true,
    classList: {
      contains: name => classes.has(name),
      toggle: (name, value) => value ? classes.add(name) : classes.delete(name),
    },
    setAttribute() {},
  };
  const grid = { querySelectorAll: () => [button], addEventListener() {} };
  let calls = 0;
  const context = {
    window: { currentCabinetUser: { role: 'superadmin' } },
    document: { readyState: 'complete', hidden: false, addEventListener() {},
      getElementById: id => id === 'lesson-catalog-grid' ? grid : null },
    AbortSignal: { timeout: () => undefined },
    setTimeout: (callback, delay) => { timers.push({ callback, delay }); return timers.length; },
    clearTimeout() {},
    fetch: async () => {
      if (++calls === 1) throw new Error('Simulated timeout');
      return { ok: true, json: async () => ({ lessons: { [key]: { status: 'ready' } } }) };
    },
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'static/ksp.js'), 'utf8'), context);
  await timers.shift().callback();
  assert.equal(timers[0].delay, 15000);
  await timers.shift().callback();
  assert.ok(classes.has('ksp-ready'));
  assert.equal(button.hidden, false);
  assert.equal(button.disabled, false);
  assert.equal(timers[0].delay, 15000);
  assert.equal(calls, 2);
});
