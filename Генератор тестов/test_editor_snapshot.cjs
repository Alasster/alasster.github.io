// Run against the local server: node test_editor_snapshot.cjs
// Creates its own work and removes it in finally; never edits existing works.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const base = 'http://127.0.0.1:8000';
async function api(url, method = 'GET', body, headers = {}) {
  const res = await fetch(base + url, {method, headers: {'Content-Type': 'application/json', ...headers}, body: body === undefined ? undefined : JSON.stringify(body)});
  assert.equal(res.ok, true, `${method} ${url}: ${await res.clone().text()}`);
  return res.json();
}
(async () => {
  const login = await api('/api/teacher/login', 'POST', {username: process.env.TEST_TEACHER || 'teacher', password: process.env.TEST_PASSWORD || 'bagalau2026'});
  const headers = {Authorization: `Bearer ${login.token}`};
  const unique = `Regression ${Date.now()}`;
  const created = await api('/api/tests', 'POST', {title: unique, subject: 'Test', grade_level: '9', class_letters: ['А']}, headers);
  try {
    const initial = {question_text: 'Добавьте вопрос', question_type: 'single_choice', options: ['Ответ 1', 'Ответ 2', 'Ответ 3'], answer_key: 'Ответ 1', variant: '1', max_score: 1};
    for (const variant of ['1', 'all', '2']) await api(`/api/tests/${created.id}/tasks`, 'POST', {...initial, variant}, headers);
    const work = await api(`/api/tests/${created.id}`, 'GET', undefined, headers);
    const elements = new Proxy({}, {get: (obj, key) => obj[key] ||= {value: '', checked: false, style: {}, classList: {add() {}, remove() {}}}});
    const alerts = [];
    let launchId;
    let failSave = false;
    let launches = 0;
    const ctx = vm.createContext({console, document: {addEventListener() {}, getElementById: id => elements[id]}, alert: message => alerts.push(message), fetch: (url, opts = {}) => {
      if (failSave && url.startsWith('/api/tasks/')) return Promise.resolve({ok: false});
      if (url === '/api/launches' && opts.method === 'POST') launches++;
      return fetch(base + url, {...opts, headers: {...opts.headers, ...headers}});
    }});
    vm.runInContext(fs.readFileSync(path.join(__dirname, 'static/js/teacher.js'), 'utf8'), ctx);
    ctx.work = work;
    ctx.captureLaunch = id => {launchId = id;};
    vm.runInContext('activeTest = work; activeTask = work.tasks[0]; renderEditorTasksNav = () => {}; renderTaskEditorForm = () => {}; openLiveMonitoring = captureLaunch;', ctx);
    for (const [i, task] of work.tasks.entries()) {
      task.question_text = `${unique}: question ${i}`;
      task.options = [`${unique}: correct ${i}`, `${unique}: wrong ${i}`, `${unique}: other ${i}`];
      task.answer_key = task.options[0];
    }
    // Saving general settings must also persist edited task content/options.
    await vm.runInContext('saveTestGeneralSettings()', ctx);
    const saved = await api(`/api/tests/${created.id}`, 'GET', undefined, headers);
    assert.equal(saved.tasks[0].question_text, work.tasks[0].question_text);
    assert.deepEqual(saved.tasks[0].options, work.tasks[0].options);
    // Switching to an empty variant must save the active question first.
    work.tasks[0].question_text += ' edited';
    await vm.runInContext('switchEditorVariant("empty")', ctx);
    assert.equal((await api(`/api/tests/${created.id}`, 'GET', undefined, headers)).tasks[0].question_text, work.tasks[0].question_text);
    for (const shuffle of [false, true]) {
      await api(`/api/tests/${created.id}`, 'PUT', {...work, shuffle_options: shuffle}, headers);
      elements['launch-target-test-id'].value = created.id;
      elements['launch-title-input'].value = unique;
      elements['launch-classes-input'].value = '9 А';
      // Include edits made after the launch modal was opened, with no active task.
      work.tasks[0].options[1] += ' latest';
      await vm.runInContext('handleCreateLaunch({preventDefault() {}})', ctx);
      assert.ok(launchId);
      const snapshot = await api(`/api/launches/${launchId}`, 'GET', undefined, headers);
      assert.deepEqual(snapshot.tasks[0].options, work.tasks[0].options);
      assert.equal(snapshot.tasks[0].question_text, work.tasks[0].question_text);
      await api(`/api/launches/${launchId}/status`, 'PUT', {status: 'active'}, headers);
      for (const variant of ['1', '2']) {
        const join = await api(`/api/student/join/${launchId}`, 'POST', {student_name: `${unique} ${variant}`, student_class: '9 А', variant});
        const studentHeaders = {'X-Attempt-Token': join.attempt_token};
        await api('/api/student/start', 'POST', {}, studentHeaders);
        const attempt = await api('/api/student/attempt', 'GET', undefined, studentHeaders);
        const expected = work.tasks.filter(t => t.variant === variant || t.variant === 'all');
        assert.deepEqual(attempt.tasks.map(t => t.id), expected.map(t => t.id));
        for (const [i, task] of attempt.tasks.entries()) {
          assert.equal(task.question_text, expected[i].question_text);
          assert.deepEqual([...task.options].sort(), [...expected[i].options].sort());
          if (!shuffle) assert.deepEqual(task.options, expected[i].options);
          assert.equal('answer_key' in task, false);
          await api('/api/student/save', 'POST', {task_id: task.id, answer: expected[i].answer_key, version: 1}, studentHeaders);
        }
        const submitted = await api('/api/student/submit', 'POST', {}, studentHeaders);
        assert.equal(submitted.total_score, expected.length);
      }
    }
    const before = launches;
    failSave = true;
    await vm.runInContext('handleCreateLaunch({preventDefault() {}})', ctx);
    assert.equal(launches, before, 'Failed saves must block snapshot creation');
    assert.ok(alerts.some(message => message.includes('Не удалось сохранить')));
    vm.runInContext('activeTask = {question_type: "multi_choice", options: ["old"], answer_key: ["old"]}; updateChoiceOptionText(0, "new");', ctx);
    assert.equal(vm.runInContext('activeTask.answer_key[0]', ctx), 'new');
    console.log('PASS: editor save -> snapshot -> StudentTaskView; both variants, question order, shuffle off/on, grading, save failure, renamed multi-choice key.');
  } finally {
    await api(`/api/tests/${created.id}?permanent=true`, 'DELETE', undefined, headers);
  }
})().catch(err => {console.error(err); process.exitCode = 1;});
