/* Account-scoped drafts. No polling and no write for an unchanged editor. */
(() => {
  const MAX_BYTES = 32768;
  let lesson, owner = 'guest', verified = false, base = '', active = null, authGeneration = 0;
  let tasks = {}, timer, busy = false, connecting = false, lastWrite = 0, status, message, controls, loginButton;
  const bindings = new Map();
  const encoder = new TextEncoder();
  const storageKey = () => `py-progress-v1:${owner}:L${lesson}`;
  const activeKey = () => `py-active-task-v1:${owner}:L${lesson}`;
  const empty = () => ({ code: null, done: false, version: 0, dirty: false });
  const readCache = () => {
    try { return JSON.parse(localStorage.getItem(storageKey()) || '{}'); } catch (_) { return {}; }
  };
  function persist() {
    try { localStorage.setItem(storageKey(), JSON.stringify(tasks)); return true; }
    catch (_) { show('Не удалось сохранить копию в браузере. Не закрывай страницу до синхронизации.'); return false; }
  }
  function show(text) { if (message) message.textContent = text; }
  function task(id) { return tasks[id] || (tasks[id] = empty()); }
  function cachedActive() {
    try {
      const id = localStorage.getItem(activeKey());
      return bindings.has(id) && tasks[id] ? id : null;
    } catch (_) { return null; }
  }
  function paint() {
    if (loginButton) loginButton.style.display = owner === 'guest' ? '' : 'none';
    bindings.forEach(({ li, button, number }, id) => {
      const done = owner === 'guest' ? guestDone(number) : !!task(id).done;
      li.classList.toggle('task-done', done);
      button.textContent = done ? '✓ Выполнено' : '○ Отметить выполненным';
    });
    if (controls) controls.replaceChildren();
    const conflictId = Object.keys(tasks).find(id => tasks[id].conflict);
    if (conflictId) {
      const number = bindings.get(conflictId)?.number;
      show(`Задача ${number || conflictId}: на другом устройстве есть другая версия. Твой черновик сохранён в браузере.`);
      const mine = document.createElement('button');
      mine.type = 'button'; mine.textContent = 'Сохранить мой вариант';
      const cloud = document.createElement('button');
      cloud.type = 'button'; cloud.textContent = 'Загрузить облачный вариант';
      [mine, cloud].forEach(button => button.className = 'task-check-btn');
      mine.onclick = () => {
        const row = task(conflictId);
        row.version = row.conflict.version;
        delete row.conflict; row.dirty = true;
        persist(); paint(); schedule(true);
      };
      cloud.onclick = () => {
        tasks[conflictId] = { ...task(conflictId).conflict, dirty: false };
        persist(); paint(); restoreActive(conflictId);
      };
      controls.append(mine, cloud);
    } else if (owner === 'guest') {
      show('Сохраняется в этом браузере. Войди, чтобы продолжить на другом устройстве.');
    } else if (!verified) {
      show('Подключаем сохранения аккаунта… Локальная копия остаётся в браузере.');
    } else if (Object.values(tasks).some(row => row.dirty)) {
      show('Есть изменения для синхронизации. Локальная копия сохранена.');
    } else {
      show(active ? 'Сохранено в аккаунте' : 'Задания синхронизированы. Выбери «Решать в редакторе».');
    }
  }
  function guestDone(number) {
    try { return JSON.parse(localStorage.getItem(`py_done_L${lesson}`) || '[]').includes(number); }
    catch (_) { return false; }
  }
  function restoreActive(id) {
    if (active !== id || task(id).code === null) return;
    const editor = document.getElementById('codeEditor');
    if (editor) { editor.value = task(id).code; updateGutter(); highlight(); }
  }
  async function request(path, options = {}) {
    return fetch(`${base}${path}`, { credentials: 'include', cache: 'no-store',
      signal: AbortSignal.timeout(15000), ...options });
  }
  async function connect() {
    if (connecting || busy) return;
    connecting = true;
    const generation = authGeneration;
    verified = false;
    try {
      if (!window.AlassterBackend) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = new URL('backend-connection.js', document.currentScript?.src || new URL('/скрипты/python-progress.js', location.href));
          script.onload = resolve; script.onerror = reject; document.head.append(script);
        });
      }
      base = await window.AlassterBackend.configReady;
      if (!base || !(await window.AlassterBackend.ready)) throw Error('offline');
      const response = await request('/api/me');
      if (!response.ok && response.status !== 401) throw Error('offline');
      const user = response.ok ? await response.json() : null;
      if (generation !== authGeneration) return;
      window.PythonProgress.onAccountChange?.(user);
      if (user) {
        try { localStorage.setItem('alasster_auth_user', JSON.stringify(user)); } catch (_) {}
      } else {
        try {
          localStorage.removeItem('alasster_auth_user');
          localStorage.removeItem('alasster_logged_in');
        } catch (_) {}
      }
      const nextOwner = user ? String(user.id) : 'guest';
      if (owner !== nextOwner) {
        persist(); owner = nextOwner; tasks = readCache();
        active = cachedActive();
        // Never leave a different account's draft in the editor.
        const editor = document.getElementById('codeEditor');
        if (editor) {
          editor.value = active ? (task(active).code ?? '') : '';
          updateGutter(); highlight();
        }
      }
      if (user) {
        const result = await request(`/api/python-progress/${lesson}`);
        if (!result.ok) throw Error('offline');
        const payload = await result.json();
        if (generation !== authGeneration) return;
        if (String(payload.user_id) !== owner) throw Error('account changed');
        payload.tasks.forEach(remote => {
          const local = tasks[remote.task_id];
          if (local?.dirty) {
            if (local.version !== remote.version) {
              if (local.code === remote.code && !!local.done === !!remote.done) tasks[remote.task_id] = { ...remote, dirty: false };
              else local.conflict = remote;
            }
          } else tasks[remote.task_id] = { ...remote, dirty: false };
        });
        verified = true; persist();
        if (active) restoreActive(active);
      }
      paint();
      if (verified) schedule();
    } catch (_) {
      paint();
      if (owner !== 'guest') show('Нет связи с аккаунтом. Изменения сохранены в этом браузере.');
    } finally {
      connecting = false;
    }
  }
  function schedule(immediate = false) {
    clearTimeout(timer);
    if (!verified || owner === 'guest') return;
    const delay = immediate ? 0 : Math.max(4000, 15000 - (Date.now() - lastWrite));
    timer = setTimeout(() => flush(), delay);
  }
  async function flush() {
    if (busy || !verified) return;
    const id = Object.keys(tasks).find(id => tasks[id].dirty && !tasks[id].conflict && !tasks[id].tooLarge);
    if (!id) return;
    const row = task(id);
    const snapshot = { user_id: Number(owner), version: row.version, done: !!row.done };
    if (row.code !== null) snapshot.code = row.code;
    const currentOwner = owner;
    busy = true; lastWrite = Date.now();
    let retry = true;
    try {
      const response = await request(`/api/python-progress/${lesson}/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snapshot), keepalive: true
      });
      const payload = await response.json();
      if (owner !== currentOwner) return;
      if (response.status === 401 || response.status === 403) {
        verified = false; retry = false;
        window.PythonProgress.onAccountChange?.(null);
        try {
          localStorage.removeItem('alasster_auth_user');
          localStorage.removeItem('alasster_logged_in');
        } catch (_) {}
        throw Error('account');
      }
      if (response.status === 409 && payload.current) row.conflict = payload.current;
      else {
        if (!response.ok || String(payload.user_id) !== owner) throw Error('save');
        row.version = payload.task.version;
        if ((snapshot.code === undefined || row.code === snapshot.code) && !!row.done === snapshot.done) row.dirty = false;
      }
      persist(); paint();
    } catch (_) {
      show('Не удалось синхронизировать. Локальная копия сохранена; повторим при восстановлении связи.');
      retry = false;
    } finally {
      busy = false;
      if (retry && Object.values(tasks).some(row => row.dirty && !row.conflict && !row.tooLarge)) schedule();
    }
  }
  window.PythonProgress = {
    init(lessonId) {
      lesson = lessonId;
      try {
        const cached = JSON.parse(localStorage.getItem('alasster_auth_user') || 'null');
        if (cached?.id) owner = String(cached.id);
      } catch (_) {}
      tasks = readCache();
      // Wait until compiler widgets exist before showing sync feedback.
      queueMicrotask(() => {
        active = cachedActive();
        if (active) restoreActive(active);
        status = document.createElement('div'); status.className = 'python-progress-status';
        status.style.cssText = 'padding:8px 12px;font-family:inherit;font-size:12px;line-height:1.5;display:flex;gap:8px;flex-wrap:wrap;align-items:center';
        message = document.createElement('span'); message.setAttribute('role', 'status');
        controls = document.createElement('span'); controls.style.cssText = 'display:inline-flex;gap:8px;flex-wrap:wrap';
        status.append(message, controls);
        const reconnect = document.createElement('button');
        reconnect.type = 'button'; reconnect.className = 'task-check-btn';
        reconnect.textContent = 'Синхронизировать'; reconnect.onclick = () => connect();
        const login = document.createElement('a');
        loginButton = login;
        login.className = 'task-check-btn'; login.textContent = 'Войти';
        login.href = '/';
        login.addEventListener('click', async event => {
          event.preventDefault();
          const url = base || await window.AlassterBackend?.configReady;
          if (url) location.assign(`${url}/login?return_to=${encodeURIComponent(location.href)}`);
        });
        status.append(reconnect, login);
        document.querySelector('.compiler-wrap')?.prepend(status);
        paint(); connect();
      });
      window.addEventListener('online', connect);
      window.addEventListener('focus', connect);
      window.addEventListener('storage', event => {
        if (event.key === 'alasster_auth_user' || event.key === 'alasster_logged_in') {
          if (event.newValue === null) window.PythonProgress.onAccountChange?.(null);
          connect();
        }
      });
      window.addEventListener('pageshow', event => { if (event.persisted) connect(); });
      window.addEventListener('pagehide', () => { persist(); flush(); });
      document.addEventListener('visibilitychange', () => { if (document.hidden) { persist(); flush(); } else connect(); });
    },
    bind(id, li, button, number) { bindings.set(id, { li, button, number }); },
    isDone(id, number) { return owner === 'guest' ? guestDone(number) : !!task(id).done; },
    setDone(id, number) {
      const row = task(id);
      row.done = !this.isDone(id, number);
      if (owner === 'guest') {
        let done = [];
        try { done = JSON.parse(localStorage.getItem(`py_done_L${lesson}`) || '[]'); } catch (_) {}
        done = done.filter(n => n !== number); if (row.done) done.push(number);
        try { localStorage.setItem(`py_done_L${lesson}`, JSON.stringify(done)); } catch (_) {}
      } else row.dirty = true;
      persist(); paint(); schedule(true);
    },
    open(id, starter) {
      if (active) { persist(); schedule(true); }
      active = id;
      try { localStorage.setItem(activeKey(), id); } catch (_) {}
      const row = task(id);
      paint();
      // Null means no draft; the empty string is an intentional empty draft.
      return row.code === null ? starter : row.code;
    },
    detach() {
      persist(); schedule(true); active = null;
      try { localStorage.setItem(activeKey(), ''); } catch (_) {}
      paint();
    },
    lessonDraft() {
      try { return localStorage.getItem(`py-editor-v1:${owner}:L${lesson}`) ?? (owner === 'guest' ? localStorage.getItem(`py_code_L${lesson}`) : null); }
      catch (_) { return null; }
    },
    edit(code) {
      try { localStorage.setItem(`py-editor-v1:${owner}:L${lesson}`, code); } catch (_) {}
      if (!active) return;
      const row = task(active);
      if (row.code === code) return;
      row.code = code; row.dirty = owner !== 'guest';
      row.tooLarge = encoder.encode(code).length > MAX_BYTES;
      persist(); paint();
      if (row.tooLarge) show('Код больше 32 КБ: сохранён только в этом браузере.');
      else schedule();
    },
    refreshAccount: connect,
    logout() {
      ++authGeneration;
      verified = false; clearTimeout(timer); persist();
      try {
        localStorage.removeItem('alasster_auth_user');
        localStorage.removeItem('alasster_logged_in');
      } catch (_) {}
      owner = 'guest'; tasks = readCache(); active = null;
      const editor = document.getElementById('codeEditor');
      if (editor) { editor.value = ''; updateGutter(); highlight(); }
      window.PythonProgress.onAccountChange?.(null);
      paint();
      if (base) location.assign(`${base}/logout?return_to=${encodeURIComponent(location.href)}`);
    },
    flush
  };
})();
