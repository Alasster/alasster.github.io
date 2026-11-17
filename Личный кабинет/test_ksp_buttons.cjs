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
  const grid = { querySelectorAll: () => [button], addEventListener() {}, before() {} };
  let calls = 0;
  const context = {
    window: { currentCabinetUser: { role: 'superadmin' } },
    document: { readyState: 'complete', hidden: false, addEventListener() {},
      getElementById: id => id === 'lesson-catalog-grid' ? grid : null,
      createElement: () => ({setAttribute() {}, classList: {toggle() {}}}) },
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

test('Shift-click forces regeneration and shows the server error instead of success', async () => {
  const classes = new Set();
  const key = '9 класс/1 четверть/7 урок.html';
  const button = { dataset: { lessonPath: key },
    classList: { contains: n => classes.has(n), toggle: (n, v) => v ? classes.add(n) : classes.delete(n) },
    setAttribute() {},
  };
  let clickHandler;
  const notice = { setAttribute() {}, classList: { toggle() {} } };
  const grid = { querySelectorAll: () => [button], contains: b => b === button, before() {},
    addEventListener: (event, handler) => { if (event === 'click') clickHandler = handler; } };
  let state = { status: 'ready', id: 'old-job' };
  let posted;
  const context = {
    window: { currentCabinetUser: { role: 'superadmin' } },
    document: { readyState: 'complete', hidden: false, addEventListener() {},
      getElementById: id => id === 'lesson-catalog-grid' ? grid : null, createElement: () => notice },
    AbortSignal: { timeout: () => undefined },
    setTimeout() {}, clearTimeout() {},
    fetch: async (url, options) => {
      if (options?.method === 'POST') {
        posted = JSON.parse(options.body);
        state = { status: 'error', id: 'new-job', message: 'Chromium не установлен' };
        return { ok: true, json: async () => ({ status: 'queued', id: 'new-job' }) };
      }
      return { ok: true, json: async () => ({ lessons: { [key]: state } }) };
    },
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'static/ksp.js'), 'utf8'), context);
  await context.window.KspButtons.refresh();
  assert.ok(classes.has('ksp-ready'));
  await clickHandler({ target: { closest: () => button }, shiftKey: true, preventDefault() {} });
  await new Promise(setImmediate);
  assert.equal(posted.force, true);
  assert.equal(posted.lesson_path, key);
  assert.ok(classes.has('ksp-error'));
  assert.ok(!classes.has('ksp-ready'));
  assert.ok(notice.textContent.includes('Chromium не установлен'));
  assert.ok(notice.textContent.includes('Старый документ сохранён'));
});
