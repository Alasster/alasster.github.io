const authCard = document.getElementById('auth-card');
const authViews = [...document.querySelectorAll('[data-auth-view]')];
const promoViews = [...document.querySelectorAll('[data-promo-content]')];
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const loginFields = [
  document.getElementById('login-username'),
  document.getElementById('login-password'),
];
const registerFields = [
  document.getElementById('first-name'),
  document.getElementById('last-name'),
  document.getElementById('register-email'),
  document.getElementById('register-password'),
  document.getElementById('register-password-confirm'),
];

function clearLoginError() {
  loginFields.forEach((field) => field.classList.remove('is-invalid'));
}

function clearRegisterError() {
  registerFields.forEach((field) => field.classList.remove('is-invalid'));
}

function getMode() {
  return window.location.pathname === '/register' ? 'register' : 'login';
}

function setAlert(mode, message, type = 'error') {
  const alertBox = document.querySelector(`[data-auth-alert="${mode}"]`);
  if (!alertBox) return;
  alertBox.className = `alert alert-${type}`;
  alertBox.textContent = message;
  alertBox.hidden = !message;
}

function switchMode(mode, updateUrl = true) {
  const isMobile = window.matchMedia('(max-width: 700px)').matches;
  const panels = [document.querySelector('.auth-promo'), document.querySelector('.auth-form-panel')];
  const previousRects = isMobile ? panels.map((panel) => panel.getBoundingClientRect()) : [];
  authCard.classList.add('is-switching');
  window.setTimeout(() => {
    authViews.forEach((view) => {
      const isActive = view.dataset.authView === mode;
      view.classList.toggle('is-active', isActive);
      view.hidden = !isActive;
    });
    promoViews.forEach((view) => {
      view.hidden = view.dataset.promoContent !== mode;
    });
    authCard.classList.toggle('is-register', mode === 'register');
    if (isMobile) {
      panels.forEach((panel, index) => {
        const nextRect = panel.getBoundingClientRect();
        const offsetX = previousRects[index].left - nextRect.left;
        const offsetY = previousRects[index].top - nextRect.top;
        panel.style.setProperty('transition', 'none', 'important');
        panel.style.setProperty('transform', `translate(${offsetX}px, ${offsetY}px)`, 'important');
      });
      requestAnimationFrame(() => {
        panels.forEach((panel) => {
          panel.style.setProperty('transition', 'transform .68s cubic-bezier(.22, 1, .36, 1)', 'important');
          panel.style.setProperty('transform', 'translate(0, 0)', 'important');
        });
      });
      window.setTimeout(() => {
        panels.forEach((panel) => {
          panel.style.removeProperty('transition');
          panel.style.removeProperty('transform');
        });
        authCard.classList.remove('is-switching');
      }, 700);
    } else {
      authCard.classList.remove('is-switching');
    }
    document.title = mode === 'register' ? 'Регистрация — Личный кабинет' : 'Вход — Личный кабинет';
    if (updateUrl) window.history.pushState({}, '', mode === 'register' ? '/register' : '/login');
    authViews.find((view) => view.dataset.authView === mode)?.querySelector('input')?.focus();
  }, 160);
}

document.querySelectorAll('[data-auth-switch]').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    setAlert('login', '');
    setAlert('register', '');
    switchMode(link.dataset.authSwitch);
  });
});

window.addEventListener('popstate', () => switchMode(getMode(), false));

if (window.location.pathname !== '/login') window.history.replaceState({}, '', '/login' + window.location.search);
switchMode('login', false);
if (new URLSearchParams(window.location.search).get('registered') === '1') {
  setAlert('login', 'Аккаунт создан. Теперь войдите по email и паролю.', 'success');
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const submitButton = document.getElementById('login-submit');
  setAlert('login', '');
  clearLoginError();
  submitButton.disabled = true;
  submitButton.textContent = 'Проверяем...';
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: document.getElementById('login-username').value.trim().toLowerCase(),
        password: document.getElementById('login-password').value,
      }),
      signal: controller.signal,
    });
    window.clearTimeout(timeoutId);
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Не удалось выполнить вход.');
    if (data.user) {
      try {
        localStorage.setItem('alasster_auth_user', JSON.stringify(data.user));
        localStorage.setItem('alasster_logged_in', '1');
      } catch (e) {}
    }
    const returnTo = new URLSearchParams(window.location.search).get('return_to');
    if (returnTo) {
      try {
        const userJson = JSON.stringify(data.user);
        const userB64 = btoa(encodeURIComponent(userJson));
        const sep = returnTo.includes('?') ? '&' : '?';
        window.location.assign(`${returnTo}${sep}alasster_user=${userB64}`);
        return;
      } catch (e) {
        window.location.assign(returnTo);
        return;
      }
    }
    window.location.assign('/');
  } catch (error) {
    window.clearTimeout(timeoutId);
    loginFields.forEach((field) => field.classList.add('is-invalid'));
    const msg = error.name === 'AbortError'
      ? 'Время ожидания ответа сервера истекло. Проверьте запущен ли сервер.'
      : (error.message || 'Не удалось выполнить вход.');
    setAlert('login', msg, 'error');
    submitButton.disabled = false;
    submitButton.textContent = 'Войти в кабинет';
  }
});

loginFields.forEach((field) => field.addEventListener('input', clearLoginError));

registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const submitButton = document.getElementById('register-submit');
  setAlert('register', '');
  clearRegisterError();
  submitButton.disabled = true;
  submitButton.textContent = 'Создаём...';
  try {
    const password = document.getElementById('register-password').value;
    const passwordConfirm = document.getElementById('register-password-confirm').value;
    if (password !== passwordConfirm) throw new Error('Пароли не совпадают.');
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: document.getElementById('first-name').value.trim(),
        last_name: document.getElementById('last-name').value.trim(),
        email: document.getElementById('register-email').value.trim(),
        password,
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Не удалось создать аккаунт.');
    switchMode('login');
    setAlert('login', 'Аккаунт создан. Теперь войдите по email и паролю.', 'success');
  } catch (error) {
    const message = (error.message || '').toLowerCase();
    if (message.includes('имя') || message.includes('фамил')) {
      registerFields.slice(0, 2).forEach((field) => field.classList.add('is-invalid'));
    } else if (message.includes('парол')) {
      registerFields.slice(3).forEach((field) => field.classList.add('is-invalid'));
    } else {
      registerFields[2].classList.add('is-invalid');
    }
    submitButton.disabled = false;
    submitButton.textContent = 'Создать аккаунт';
  }
});

registerFields.forEach((field) => field.addEventListener('input', clearRegisterError));
