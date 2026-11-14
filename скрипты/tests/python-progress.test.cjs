const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../python-progress.js'), 'utf8');
const settle = async () => { for (let i = 0; i < 8; i++) await new Promise(setImmediate); };

function harness({ user = 1, remote = [], storage = new Map(), offline = false } = {}) {
  const calls = [], listeners = {}, timers = [];
  const element = () => ({ children: [], attrs: {}, dataset: {}, style: {}, classList: { toggle() {} },
    append(...items) { this.children.push(...items); }, prepend(item) { this.children.unshift(item); },
    replaceChildren(...items) { this.children = items; }, setAttribute(k, v) { this.attrs[k] = v; },
    addEventListener(k, cb) { this[k] = cb; } });
  const editor = element(); editor.value = '';
  const compiler = element();
  const state = { user, remote, offline, writes: 0, conflict: null };
  const context = { console, TextEncoder, URL, AbortSignal, queueMicrotask,
    setTimeout(fn, delay) { timers.push({ fn, delay }); return timers.length; }, clearTimeout() {},
    updateGutter() {}, highlight() {},
    location: { href: 'https://alasster.site/Python/1.html', assign() {} },
    localStorage: { getItem: k => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, v) },
    document: { hidden: false, createElement: element, querySelector: () => compiler,
      getElementById: () => editor, addEventListener: (name, fn) => { listeners[name] = fn; } },
    fetch: async (url, options) => {
      calls.push({ url, options });
      if (state.offline) throw Error('offline');
      let status = 200, payload;
      if (url.endsWith('/api/me')) { status = state.user ? 200 : 401; payload = state.user ? { id: state.user } : {}; }
      else if (options.method === 'PATCH') {
        const body = JSON.parse(options.body);
        if (state.conflict) { status = 409; payload = { current: state.conflict }; }
        else { state.writes++; payload = { user_id: state.user, task: { ...body, version: body.version + 1 } }; }
      } else payload = { user_id: state.user, tasks: state.remote };
      return { ok: status === 200, status, json: async () => payload };
    }
  };
  context.window = { AlassterBackend: { configReady: Promise.resolve('https://cabinet.alasster.site'), ready: Promise.resolve(true) },
    addEventListener: (name, fn) => { listeners[name] = fn; } };
  vm.runInNewContext(source, context, { filename: 'python-progress.js' });
  const api = context.window.PythonProgress;
  api.init(1);
  return { api, calls, state, storage, editor, compiler, listeners, timers };
}

test('restores account code and completion on another device, including empty code', async () => {
  const h = harness({ remote: [{ task_id: 'task-001', code: '', done: 1, version: 2 }] });
  await settle();
  assert.equal(h.api.open('task-001', 'starter'), '');
  assert.equal(h.api.isDone('task-001', 1), true);
  assert.equal(h.state.writes, 0);
});

test('saves individual tasks, avoids unchanged writes, saves done without replacing code', async () => {
  const storage = new Map([['alasster_auth_user', JSON.stringify({ id: 1 })]]);
  const h = harness({ storage }); await settle();
  h.api.open('task-001', 'starter'); h.api.edit('print(1)');
  await h.api.flush(); await h.api.flush();
  assert.equal(h.state.writes, 1);
  h.api.edit('print(1)'); await h.api.flush();
  assert.equal(h.state.writes, 1);
  h.api.setDone('task-002', 2); await h.api.flush();
  const body = JSON.parse(h.calls.filter(c => c.options.method === 'PATCH').at(-1).options.body);
  assert.equal(body.done, true); assert.equal(body.code, undefined);
  h.api.open('task-002', 'other'); h.api.edit('second');
  assert.equal(h.api.open('task-001', 'starter'), 'print(1)');
});

test('conflicts keep local draft and require an explicit choice', async () => {
  const h = harness({ storage: new Map([['alasster_auth_user', '{"id":1}']]) }); await settle();
  h.api.open('task-001', 'starter'); h.api.edit('local');
  h.state.conflict = { task_id: 'task-001', code: 'remote', done: 0, version: 3 };
  await h.api.flush();
  assert.equal(h.api.open('task-001', ''), 'local');
  const controls = h.compiler.children[0].children[1];
  assert.equal(controls.children.length, 2);
  await h.api.flush(); assert.equal(h.state.writes, 0);
  controls.children[1].onclick();
  assert.equal(h.api.open('task-001', ''), 'remote');
});

test('offline drafts survive reload and do not leak to another account', async () => {
  const storage = new Map([['alasster_auth_user', '{"id":1}']]);
  const h = harness({ storage, offline: true }); await settle();
  h.api.open('task-001', 'starter'); h.api.edit('offline code');
  const again = harness({ storage, offline: true }); await settle();
  assert.equal(again.api.open('task-001', ''), 'offline code');
  const other = harness({ storage, user: 2 }); await settle();
  assert.equal(other.api.open('task-001', 'new starter'), 'new starter');
  assert.equal(other.state.writes, 0);
});

test('oversized code stays local and guest progress is never uploaded', async () => {
  const h = harness({ storage: new Map([['alasster_auth_user', '{"id":1}']]) }); await settle();
  h.api.open('task-001', ''); h.api.edit('я'.repeat(20000)); await h.api.flush();
  assert.equal(h.state.writes, 0);
  const guest = harness({ user: null }); await settle();
  guest.api.open('task-001', ''); guest.api.edit('guest code');
  guest.api.setDone('task-001', 1); await guest.api.flush();
  assert.equal(guest.state.writes, 0);
  assert.equal(guest.api.isDone('task-001', 1), true);
});
