(() => {
  'use strict';
  const active = new Set(['queued', 'generating', 'validating', 'saving']);
  const grid = document.getElementById('lesson-catalog-grid');
  if (!grid) return;

  let jobs = {};
  let timer;
  let refreshing = false;
  const starting = new Set();

  function announce(text, isError = false) {
    let status = document.getElementById('ksp-status');
    if (!status) {
      status = document.createElement('p');
      status.id = 'ksp-status';
      status.className = 'panel-message';
      status.setAttribute('role', 'status');
      status.setAttribute('aria-live', 'polite');
      status.style.marginBottom = '14px';
      status.style.padding = '10px 14px';
      status.style.borderRadius = '10px';
      status.style.fontWeight = '500';
      status.style.fontSize = '0.9rem';
      status.style.transition = 'all 0.3s ease';
      grid.before(status);
    }
    status.textContent = text;
    if (isError) {
      status.style.background = 'rgba(239, 68, 68, 0.12)';
      status.style.color = '#dc2626';
      status.style.border = '1px solid rgba(239, 68, 68, 0.3)';
    } else {
      status.style.background = 'rgba(72, 187, 120, 0.12)';
      status.style.color = '#15803d';
      status.style.border = '1px solid rgba(72, 187, 120, 0.3)';
    }
  }

  function paint() {
    grid.querySelectorAll('.lesson-ksp-button').forEach(button => {
      const key = button.dataset.lessonPath;
      if (!key) return;

      const job = jobs[key];
      const busy = starting.has(key) || active.has(job?.status);
      const ready = job?.status === 'ready';

      button.classList.toggle('ksp-busy', busy);
      button.classList.toggle('ksp-ready', ready);
      button.classList.toggle('ksp-error', job?.status === 'error');
      button.disabled = busy;
      button.setAttribute('aria-busy', String(busy));

      const group = button.closest('.lesson-ksp-group');
      const viewButton = group?.querySelector('.lesson-ksp-view-button') ||
                         grid.querySelector(`.lesson-ksp-view-button[data-lesson-path="${CSS.escape(key)}"]`);

      if (busy) {
        button.textContent = job?.message || 'Генерация…';
        button.title = 'Методист Gemini составляет подробный КСП (45 мин, 12pt, без ООП)…';
        if (viewButton) viewButton.hidden = true;
      } else if (ready) {
        button.textContent = 'КСП';
        button.title = 'КСП сохранён! Нажмите, чтобы скачать DOCX файл';
        if (viewButton) {
          viewButton.hidden = false;
          viewButton.title = 'Открыть КСП в Google Документах';
        }
      } else if (job?.status === 'error') {
        button.textContent = 'КСП';
        button.title = job.message || 'Ошибка генерации. Нажмите для повтора.';
        if (viewButton) viewButton.hidden = true;
      } else {
        button.textContent = 'КСП';
        button.title = 'Сгенерировать КСП и сохранить на Google Диск';
        if (viewButton) viewButton.hidden = true;
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
      const previous = jobs;
      jobs = result.lessons || {};

      Object.entries(jobs).forEach(([key, job]) => {
        if (active.has(previous[key]?.status) && !active.has(job.status)) {
          if (job.status === 'ready') {
            announce('✓ КСП успешно создан и автоматически сохранён в Google Диске (папка КСП / 2026–2027). Нажмите кнопку со значком глаза, чтобы открыть в Google Документах, или кнопку КСП для скачивания.');
          } else if (job.status === 'error') {
            announce(job.message || 'Ошибка при составлении КСП', true);
          }
        }
      });
      paint();
    } catch (_) {
      // Background poll failure
    } finally {
      refreshing = false;
      clearTimeout(timer);
      if (Object.values(jobs).some(job => active.has(job?.status)) || starting.size > 0) {
        timer = setTimeout(refresh, document.hidden ? 8000 : 2000);
      }
    }
  }

  grid.addEventListener('click', async event => {
    // 1. Eye Button: Open in Google Docs / Google Drive
    const viewButton = event.target.closest('.lesson-ksp-view-button');
    if (viewButton && grid.contains(viewButton)) {
      event.preventDefault();
      const key = viewButton.dataset.lessonPath;
      const job = jobs[key];
      if (job?.status === 'ready' && job?.url) {
        const isPublicHttps = window.location.protocol === 'https:' && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1');
        const docsViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(window.location.origin + job.url)}`;
        const gDriveFolderUrl = 'https://drive.google.com/drive/folders/1skfm8UZo7rAcWLJFpULLgICGyoJsXsJo';

        if (isPublicHttps) {
          announce('Открываем созданный КСП в Google Документах…');
          window.open(docsViewerUrl, '_blank', 'noopener');
        } else {
          announce('Открываем папку КСП на Google Диске (файл сохранён и синхронизируется автоматически)…');
          window.open(gDriveFolderUrl, '_blank', 'noopener');
        }
      } else {
        announce('КСП для этого урока ещё не создан. Нажмите кнопку «КСП», чтобы сгенерировать.', true);
      }
      return;
    }

    // 2. KSP Button: Generate or Download
    const button = event.target.closest('.lesson-ksp-button');
    if (!button || !grid.contains(button)) return;
    event.preventDefault();

    const key = button.dataset.lessonPath;
    if (!key || starting.has(key) || active.has(jobs[key]?.status)) return;

    if (jobs[key]?.status === 'ready' && jobs[key]?.url) {
      announce('Скачивание файла DOCX. Он также сохранён на вашем Google Диске в папке «КСП / 2026–2027».');
      window.open(jobs[key].url, '_blank', 'noopener');
      return;
    }

    starting.add(key);
    paint();
    announce('Запущен методист Gemini. Генерация идёт в фоне, файл автоматически запишется в Google Диск.');

    try {
      const response = await fetch('/api/ksp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lesson_path: key }),
        signal: AbortSignal.timeout(20000)
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.detail || 'Не удалось запустить генерацию КСП');
      }
      jobs[key] = result;
      announce(result.message || 'Создание КСП в процессе…');
    } catch (error) {
      announce(error.name === 'TimeoutError' ? 'Запрос отправлен, ожидаем результат…' : error.message, true);
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
