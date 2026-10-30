(() => {
  'use strict';
  const active = new Set(['queued', 'generating', 'validating', 'saving']);
  const grid = document.getElementById('lesson-catalog-grid');
  if (!grid) return;

  // Remove any obsolete status banner if present
  const existingStatus = document.getElementById('ksp-status');
  if (existingStatus) existingStatus.remove();

  let jobs = {};
  let timer;
  let refreshing = false;
  const starting = new Set();

  function paint() {
    grid.querySelectorAll('.lesson-ksp-button').forEach(button => {
      const key = button.dataset.lessonPath;
      if (!key) return;

      const job = jobs[key];
      const busy = starting.has(key) || active.has(job?.status);
      const ready = job?.status === 'ready';
      const isError = job?.status === 'error';

      button.classList.toggle('ksp-busy', busy);
      button.classList.toggle('ksp-ready', ready);
      button.classList.toggle('ksp-error', isError);
      button.disabled = busy;
      button.setAttribute('aria-busy', String(busy));

      // Always keep clean button label "КСП" without bloating button dimensions
      button.textContent = 'КСП';

      if (busy) {
        button.title = 'Создание КСП…';
      } else if (ready) {
        button.title = 'Открыть в Google Документах (Shift + клик для повторного создания)';
      } else if (isError) {
        button.title = 'Ошибка создания КСП. Нажмите для повтора';
      } else {
        button.title = 'Создать КСП';
      }
      button.setAttribute('aria-label', button.title);
    });
  }

  async function refresh() {
    if (refreshing) return;
    const role = window.currentCabinetUser?.role;
    if (role !== 'superadmin' && role !== 'teacher') return;

    refreshing = true;
    try {
      const response = await fetch('/api/ksp', { cache: 'no-store', signal: AbortSignal.timeout(10000) });
      if (!response.ok) return;
      const result = await response.json();
      jobs = result.lessons || {};
      paint();
    } catch (_) {
      // Polling failure ignored
    } finally {
      refreshing = false;
      clearTimeout(timer);
      if (Object.values(jobs).some(job => active.has(job?.status)) || starting.size > 0) {
        timer = setTimeout(refresh, document.hidden ? 8000 : 2000);
      }
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

    // If ready and not forcing re-generation: Open directly in Google Docs!
    if (isReady && !isShiftClick) {
      const targetUrl = job.google_docs_url || `/api/ksp/${encodeURIComponent(job.id)}/google-docs`;
      window.open(targetUrl, '_blank', 'noopener');
      return;
    }

    // Otherwise: trigger generation (or forced re-generation)
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
    } catch (_) {
      // Button state handles error visualization
    } finally {
      starting.delete(key);
      paint();
      refresh();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refresh();
  });

  window.KspButtons = { refresh };
})();
