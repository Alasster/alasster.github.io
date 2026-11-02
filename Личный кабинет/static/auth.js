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
  if (window.location.pathname === '/register') return 'register';
  if (window.location.pathname === '/reset-password' || window.location.pathname === '/reset') return 'reset';
  return 'login';
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
    document.title = mode === 'register' ? 'Регистрация — Личный кабинет' : (mode === 'reset' ? 'Сброс пароля — Личный кабинет' : 'Вход — Личный кабинет');
    if (updateUrl) window.history.pushState({}, '', mode === 'register' ? '/register' : (mode === 'reset' ? '/reset-password' : '/login'));
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
    const requestedReturn = new URLSearchParams(window.location.search).get('return_to');
    let returnTo = '';
    if (requestedReturn) {
      try {
        const target = new URL(requestedReturn, location.origin);
        const allowed = [
          location.origin,
          'https://alasster.site',
          'https://www.alasster.site',
          'https://alasster.github.io',
          'http://alasster.site',
          'http://www.alasster.site',
          'http://alasster.github.io'
        ];
        const local = ['localhost', '127.0.0.1'].includes(target.hostname);
        if (allowed.includes(target.origin) || local) returnTo = target.href;
      } catch (_) {}
    }
    if (returnTo) {
      try {
        const userJson = JSON.stringify(data.user);
        const userB64 = btoa(encodeURIComponent(userJson));
        const targetUrl = new URL(returnTo, location.origin);
        targetUrl.searchParams.set('alasster_user', userB64);
        window.location.assign(targetUrl.href);
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


// ==========================================================================
// ЛОГИКА СБРОСА ПАРОЛЯ И ВВОДА 4-ЗНАЧНОГО КОДА
// ==========================================================================
const resetRequestForm = document.getElementById('reset-request-form');
const resetConfirmForm = document.getElementById('reset-confirm-form');
const resetEmailInput = document.getElementById('reset-email');
const resetCodeBoxes = [...document.querySelectorAll('#reset-code-boxes .code-box')];
const resetNewPassword = document.getElementById('reset-new-password');
const resetNewPasswordConfirm = document.getElementById('reset-new-password-confirm');
const resetResendBtn = document.getElementById('reset-resend-btn');
const resetTimerSec = document.getElementById('reset-timer-sec');
const resetTimerText = document.getElementById('reset-timer-text');
const resetBackToStep1 = document.getElementById('reset-back-to-step1');

let currentResetEmail = '';
let resetTimerInterval = null;

function startResetTimer(seconds = 60) {
  if (resetTimerInterval) clearInterval(resetTimerInterval);
  let remaining = seconds;
  if (resetTimerText) resetTimerText.style.display = 'inline';
  if (resetResendBtn) resetResendBtn.style.display = 'none';
  if (resetTimerSec) resetTimerSec.textContent = remaining;

  resetTimerInterval = setInterval(() => {
    remaining--;
    if (resetTimerSec) resetTimerSec.textContent = remaining;
    if (remaining <= 0) {
      clearInterval(resetTimerInterval);
      resetTimerInterval = null;
      if (resetTimerText) resetTimerText.style.display = 'none';
      if (resetResendBtn) resetResendBtn.style.display = 'inline-block';
    }
  }, 1000);
}

// 4-ячеечный ввод кода
resetCodeBoxes.forEach((box, index) => {
  box.addEventListener('input', (e) => {
    box.classList.remove('is-invalid');
    const val = e.target.value.replace(/[^0-9]/g, '');
    e.target.value = val ? val.slice(-1) : '';
    if (val && index < resetCodeBoxes.length - 1) {
      resetCodeBoxes[index + 1].focus();
    } else if (val && index === resetCodeBoxes.length - 1) {
      resetNewPassword?.focus();
    }
  });

  box.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && !box.value && index > 0) {
      resetCodeBoxes[index - 1].focus();
    }
  });

  box.addEventListener('paste', (e) => {
    e.preventDefault();
    const pasteData = (e.clipboardData || window.clipboardData).getData('text').replace(/[^0-9]/g, '').slice(0, 4);
    if (!pasteData) return;
    for (let i = 0; i < resetCodeBoxes.length; i++) {
      resetCodeBoxes[i].value = pasteData[i] || '';
      resetCodeBoxes[i].classList.remove('is-invalid');
    }
    if (pasteData.length >= 4) {
      resetNewPassword?.focus();
    } else {
      resetCodeBoxes[pasteData.length]?.focus();
    }
  });
});

// Отправка запроса на получение кода (Шаг 1)
if (resetRequestForm) {
  resetRequestForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = resetEmailInput.value.trim().toLowerCase();
    const submitBtn = document.getElementById('reset-request-submit');
    setAlert('reset', '');
    resetEmailInput.classList.remove('is-invalid');

    if (!email) {
      resetEmailInput.classList.add('is-invalid');
      setAlert('reset', 'Пожалуйста, введите email', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Отправляем код...';

    try {
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Не удалось отправить код');

      currentResetEmail = email;
      const targetEmailEl = document.getElementById('reset-target-email');
      if (targetEmailEl) targetEmailEl.textContent = email;

      resetRequestForm.hidden = true;
      resetConfirmForm.hidden = false;
      resetCodeBoxes.forEach(box => box.value = '');
      setAlert('reset', '4-значный код отправлен на вашу почту!', 'success');
      startResetTimer(60);
      resetCodeBoxes[0]?.focus();
    } catch (err) {
      resetEmailInput.classList.add('is-invalid');
      setAlert('reset', err.message || 'Ошибка отправки кода', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Получить код';
    }
  });
}

// Повторная отправка кода
if (resetResendBtn) {
  resetResendBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    if (!currentResetEmail) return;
    setAlert('reset', '');
    resetResendBtn.style.display = 'none';

    try {
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentResetEmail }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Не удалось отправить код');

      setAlert('reset', 'Новый код отправлен на почту!', 'success');
      startResetTimer(60);
      resetCodeBoxes.forEach(box => {
        box.value = '';
        box.classList.remove('is-invalid');
      });
      resetCodeBoxes[0]?.focus();
    } catch (err) {
      setAlert('reset', err.message || 'Ошибка повторной отправки', 'error');
      resetResendBtn.style.display = 'inline-block';
    }
  });
}

// Изменить email (вернуться на Шаг 1)
if (resetBackToStep1) {
  resetBackToStep1.addEventListener('click', (e) => {
    e.preventDefault();
    setAlert('reset', '');
    resetConfirmForm.hidden = true;
    resetRequestForm.hidden = false;
    resetEmailInput.focus();
  });
}

// Подтверждение кода и смена пароля (Шаг 2)
if (resetConfirmForm) {
  resetConfirmForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = resetCodeBoxes.map(b => b.value.trim()).join('');
    const newPass = resetNewPassword.value;
    const confirmPass = resetNewPasswordConfirm.value;
    const submitBtn = document.getElementById('reset-confirm-submit');
    setAlert('reset', '');
    resetCodeBoxes.forEach(b => b.classList.remove('is-invalid'));
    resetNewPassword.classList.remove('is-invalid');
    resetNewPasswordConfirm.classList.remove('is-invalid');

    if (code.length !== 4) {
      resetCodeBoxes.forEach(b => b.classList.add('is-invalid'));
      setAlert('reset', 'Введите 4-значный код из письма', 'error');
      resetCodeBoxes[0]?.focus();
      return;
    }

    if (newPass.length < 8) {
      resetNewPassword.classList.add('is-invalid');
      setAlert('reset', 'Пароль должен содержать минимум 8 символов', 'error');
      resetNewPassword.focus();
      return;
    }

    if (newPass !== confirmPass) {
      resetNewPasswordConfirm.classList.add('is-invalid');
      setAlert('reset', 'Пароли не совпадают', 'error');
      resetNewPasswordConfirm.focus();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Сохраняем...';

    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentResetEmail,
          code,
          password: newPass,
          password_confirm: confirmPass
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Не удалось изменить пароль');

      // Пароль успешно сменён! Переключаем на экран входа
      resetConfirmForm.hidden = true;
      resetRequestForm.hidden = false;
      switchMode('login');
      setAlert('login', 'Пароль успешно изменён! Войдите с новым паролем.', 'success');
      const loginUser = document.getElementById('login-username');
      if (loginUser) loginUser.value = currentResetEmail;
      document.getElementById('login-password')?.focus();
    } catch (err) {
      if ((err.message || '').toLowerCase().includes('код')) {
        resetCodeBoxes.forEach(b => b.classList.add('is-invalid'));
      }
      setAlert('reset', err.message || 'Ошибка смены пароля', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Сменить пароль и войти';
    }
  });
}
