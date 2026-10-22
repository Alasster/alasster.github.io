const form = document.getElementById('register-form');
const alertBox = document.getElementById('error-alert');
const submitButton = document.getElementById('submit-button');

function showError(message) {
  alertBox.textContent = message;
  alertBox.hidden = false;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  alertBox.hidden = true;
  submitButton.disabled = true;
  submitButton.textContent = 'Создаём...';

  try {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: document.getElementById('first-name').value.trim(),
        last_name: document.getElementById('last-name').value.trim(),
        email: document.getElementById('email').value.trim(),
        password: document.getElementById('password').value,
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Не удалось создать аккаунт.');
    window.location.assign('/login?registered=1');
  } catch (error) {
    showError(error.message || 'Сервис временно недоступен.');
    submitButton.disabled = false;
    submitButton.textContent = 'Создать аккаунт';
  }
});
