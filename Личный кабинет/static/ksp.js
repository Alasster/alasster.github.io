(() => {
  'use strict';
  const active = new Set(['queued', 'generating', 'validating', 'saving']);
  const grid = document.getElementById('lesson-catalog-grid');
  if (!grid) return;

  // Remove any obsolete status banner if present
  const existingStatus = document.getElementById('ksp-status');
  if (existingStatus) existingStatus.remove();
  const status = document.createElement('p');
  status.id = 'ksp-status';
  status.className = 'ksp-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.hidden = true;
  grid.before(status);

  let jobs = {};
  let timer;
  let refreshing = false;
  let pendingRefresh = false;
  let pendingFresh = false;
  const starting = new Set();
  let watchedKey = '';

  function getUserRole() {
    if (window.currentCabinetUser?.role) return window.currentCabinetUser.role;
    if (window.currentUserRole) return window.currentUserRole;
    try {
      const stored = JSON.parse(localStorage.getItem('alasster_auth_user') || '{}');
      return stored.role;
    } catch (_) {
      return null;
    }
  }

  function paint() {
    if (watchedKey) {
      const job = jobs[watchedKey];
      const busy = starting.has(watchedKey) || active.has(job?.status);
      status.hidden = !busy && !job;
      status.classList.toggle('is-error', job?.status === 'error');
      status.textContent = job?.status === 'error'
        ? 'Не удалось обновить КСП: ' + job.message + ' Старый документ сохранён.'
        : busy ? (job?.message || 'Запускается создание КСП…')
        : job?.status === 'ready' ? 'КСП сохранён в Google Диске.' : '';
    }
    const role = getUserRole();
    const canUseKsp = role === 'superadmin' || role === 'teacher';

    grid.querySelectorAll('.lesson-ksp-button').forEach(button => {
      const key = button.dataset.lessonPath;
      if (!key) return;

      if (canUseKsp) {
        button.hidden = false;
      }

      const isDop = button.classList.contains('lesson-ksp-dop-button') || key.startsWith('доп|');
      const label = button.dataset.kspLabel || (isDop ? 'Доп' : 'КСП');

      const job = jobs[key];
      const busy = starting.has(key) || active.has(job?.status);
      const ready = job?.status === 'ready';
      const isError = job?.status === 'error';

      button.classList.toggle('ksp-busy', busy);
      button.classList.toggle('ksp-ready', ready);
      button.classList.toggle('ksp-error', isError);
      button.disabled = busy;
      button.setAttribute('aria-busy', String(busy));

      // Always keep clean button label ("КСП" or "Доп") without bloating button dimensions
      button.textContent = label;

      if (busy) {
        button.title = job?.message || (isDop ? 'Создание вариативного КСП (10А)…' : 'Создание КСП…');
      } else if (ready) {
        button.title = isDop
          ? 'Открыть вариативный КСП (10А) в Google Документах (Shift + клик для повторного создания)'
          : 'Открыть в Google Документах (Shift + клик для повторного создания)';
      } else if (isError) {
        button.title = (job && job.message) ? job.message : (isDop ? 'Ошибка создания Доп КСП. Нажмите для повтора' : 'Ошибка создания КСП. Нажмите для повтора');
      } else {
        button.title = isDop ? 'Создать вариативный КСП для 10А (вторник)' : 'Создать КСП';
      }
      button.setAttribute('aria-label', button.title);
    });
  }

  async function refresh(forceFresh = false) {
    paint();
    if (refreshing) {
      pendingRefresh = true;
      if (forceFresh) pendingFresh = true;
      return;
    }
    const role = getUserRole();
    if (!role) {
      setTimeout(refresh, 400);
      return;
    }
    if (role !== 'superadmin' && role !== 'teacher') return;

    refreshing = true;
    try {
      const qs = (forceFresh ? 'fresh=1&t=' : 't=') + Date.now();
      const response = await fetch('/api/ksp?' + qs, { cache: 'no-store', signal: AbortSignal.timeout(15000) });
      if (!response.ok) return;
      const result = await response.json();
      jobs = result.lessons || {};
      paint();
    } catch (_) {
      // Polling failure ignored
    } finally {
      refreshing = false;
      clearTimeout(timer);
      if (pendingRefresh) {
        const nextFresh = pendingFresh;
        pendingRefresh = false;
        pendingFresh = false;
        refresh(nextFresh);
        return;
      }
      const busy = Object.values(jobs).some(job => active.has(job?.status)) || starting.size > 0;
      timer = setTimeout(refresh, document.hidden ? 30000 : busy ? 2000 : 15000);
    }
  }

  grid.addEventListener('click', async event => {
    const button = event.target.closest('.lesson-ksp-button');
    if (!button || !grid.contains(button)) return;
    event.preventDefault();

    const key = button.dataset.lessonPath;
    if (!key || starting.has(key) || active.has(jobs[key]?.status)) return;

    const job = jobs[key];
    const isReady = job?.status === 'ready';
    const isShiftClick = Boolean(event.shiftKey);

    // If ready and not forcing re-generation: verify it still exists in Google Drive before opening!
    if (isReady && !isShiftClick) {
      try {
        const checkResp = await fetch('/api/ksp?fresh=1&t=' + Date.now(), { cache: 'no-store', signal: AbortSignal.timeout(12000) });
        if (checkResp.ok) {
          const checkData = await checkResp.json();
          jobs = checkData.lessons || {};
          paint();
        }
      } catch (_) {}

      const freshJob = jobs[key];
      if (freshJob?.status === 'ready') {
        const targetUrl = freshJob.google_docs_url || `/api/ksp/${encodeURIComponent(freshJob.id)}/google-docs`;
        window.open(targetUrl, '_blank', 'noopener');
        return;
      }
      // If file was deleted from Drive, fall through to create it right away!
    }

    // Otherwise: trigger generation (or forced re-generation)
    watchedKey = key;
    starting.add(key);
    paint();

    try {
      const response = await fetch('/api/ksp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lesson_path: key, force: isShiftClick }),
        signal: AbortSignal.timeout(20000)
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.detail || 'Не удалось запустить генерацию КСП');
      }
      jobs[key] = result;
    } catch (err) {
      jobs[key] = { status: 'error', message: String(err && err.message || err) };
    } finally {
      starting.delete(key);
      paint();
      refresh();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refresh(true);
  });

  if (typeof window.addEventListener === 'function') {
    window.addEventListener('focus', () => refresh(true));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(refresh, 200));
  } else {
    setTimeout(refresh, 200);
  }

  window.KspButtons = { refresh, paint };
})();
