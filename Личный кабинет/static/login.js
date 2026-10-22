const form = document.getElementById('login-form');
const alertBox = document.getElementById('error-alert');
const submitButton = document.getElementById('submit-button');

if (new URLSearchParams(window.location.search).get('registered') === '1') {
  alertBox.className = 'alert alert-success';
  alertBox.textContent = 'Аккаунт создан. Теперь войдите по email и паролю.';
  alertBox.hidden = false;
}

function showError(message) {
  alertBox.className = 'alert alert-error';
  alertBox.textContent = message;
  alertBox.hidden = false;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  alertBox.hidden = true;
  submitButton.disabled = true;
  submitButton.textContent = 'Проверяем...';

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: document.getElementById('username').value.trim().toLowerCase(),
        password: document.getElementById('password').value,
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Не удалось выполнить вход.');
    window.location.assign('/');
  } catch (error) {
    showError(error.message || 'Сервис временно недоступен.');
    submitButton.disabled = false;
    submitButton.textContent = 'Войти в кабинет';
  }
});
