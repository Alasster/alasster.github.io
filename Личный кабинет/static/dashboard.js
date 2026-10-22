const displayName = document.getElementById('display-name');
const profileEmail = document.getElementById('profile-email');
const profileRole = document.getElementById('profile-role');
const logoutButton = document.getElementById('logout-button');
const adminPanel = document.getElementById('admin-panel');
const accessNav = document.getElementById('access-nav');
const usersList = document.getElementById('users-list');
const adminMessage = document.getElementById('admin-message');
const workspaceRole = document.getElementById('workspace-role');
const appShell = document.querySelector('.app-shell');
const sidebar = document.querySelector('.sidebar');
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const themeLabel = document.getElementById('theme-label');
const logoutModal = document.getElementById('logout-modal');
const logoutCancel = document.getElementById('logout-cancel');
const logoutConfirm = document.getElementById('logout-confirm');
const summaryStatus = document.getElementById('site-summary-status');
const summaryLessons = document.getElementById('summary-lessons');
const summaryClasses = document.getElementById('summary-classes');
const summaryUsers = document.getElementById('summary-users');
const summaryVisitors = document.getElementById('summary-visitors');
const summaryClassesList = document.getElementById('summary-classes-list');
const summaryTrafficNote = document.getElementById('summary-traffic-note');
const summaryTrafficList = document.getElementById('summary-traffic-list');
const roles = ['user', 'teacher', 'admin', 'superadmin'];

const formatNumber = (value) => new Intl.NumberFormat('ru-RU').format(Number(value) || 0);

function appendSummaryRow(list, label, value) {
  const row = document.createElement('li');
  const labelNode = document.createElement('span');
  const valueNode = document.createElement('strong');
  labelNode.textContent = label;
  valueNode.textContent = formatNumber(value);
  row.append(labelNode, valueNode);
  list.append(row);
}

function applyTheme(theme) {
  const isDark = theme === 'dark';
  document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
  themeToggle?.setAttribute('aria-pressed', String(isDark));
  if (themeIcon) themeIcon.textContent = isDark ? '☼' : '☾';
  if (themeLabel) themeLabel.textContent = isDark ? 'Светлая тема' : 'Тёмная тема';
}

applyTheme(localStorage.getItem('personal-cabinet-theme') || 'light');
themeToggle?.addEventListener('click', () => {
  const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('personal-cabinet-theme', nextTheme);
  applyTheme(nextTheme);
});

function setSidebarExpanded(expanded) {
  appShell?.classList.toggle('is-sidebar-expanded', expanded);
}

sidebar?.addEventListener('click', (event) => {
  if (!event.target.closest('a, button')) {
    setSidebarExpanded(!appShell.classList.contains('is-sidebar-expanded'));
  }
});
document.addEventListener('click', (event) => {
  if (!sidebar?.contains(event.target)) setSidebarExpanded(false);
});

function syncSidebarActive() {
  const hash = window.location.hash || '#overview';
  const link = document.querySelector(`.sidebar-link[href="${hash}"]`);
  if (!link) return null;
  document.querySelectorAll('.sidebar-link').forEach((item) => item.classList.toggle('active', item === link));
  return link;
}

document.querySelectorAll('.sidebar-link').forEach((link) => {
  link.addEventListener('click', () => {
    document.querySelectorAll('.sidebar-link').forEach((item) => item.classList.remove('active'));
    link.classList.add('active');
  });
});

window.addEventListener('hashchange', syncSidebarActive);
syncSidebarActive();

async function loadCurrentUser() {
  const response = await fetch('/api/me');
  if (response.status === 401) {
    window.location.replace('/login');
    return;
  }
  if (!response.ok) throw new Error('Не удалось загрузить профиль.');
  const user = await response.json();
  displayName.textContent = user.display_name || user.username;
  profileEmail.textContent = user.username;
  profileRole.textContent = user.role === 'superadmin' ? 'Супер-админ' : user.role;
  workspaceRole.textContent = user.role === 'superadmin' ? 'Супер-админ' : user.role;
  if (user.role === 'superadmin') {
    adminPanel.hidden = false;
    accessNav.hidden = false;
    await loadUsers();
  }
}

async function loadUsers() {
  const response = await fetch('/api/users');
  if (!response.ok) throw new Error('Не удалось загрузить пользователей.');
  const data = await response.json();
  usersList.replaceChildren();
  data.users.forEach((user) => {
    const row = document.createElement('tr');
    const nameCell = document.createElement('td');
    nameCell.textContent = user.display_name || user.username;
    const emailCell = document.createElement('td');
    emailCell.textContent = user.username;
    const roleCell = document.createElement('td');
    const select = document.createElement('select');
    select.className = 'role-select';
    select.setAttribute('aria-label', `Роль пользователя ${user.username}`);
    roles.forEach((role) => {
      const option = document.createElement('option');
      option.value = role;
      option.textContent = role;
      option.selected = role === user.role;
      select.append(option);
    });
    select.addEventListener('change', async () => {
      select.disabled = true;
      adminMessage.textContent = '';
      try {
        const update = await fetch(`/api/users/${user.id}/role`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: select.value }),
        });
        const result = await update.json();
        if (!update.ok) throw new Error(result.detail || 'Не удалось изменить роль.');
        adminMessage.textContent = 'Роль обновлена.';
      } catch (error) {
        select.value = user.role;
        adminMessage.textContent = error.message;
      } finally {
        select.disabled = false;
      }
    });
    roleCell.append(select);
    row.append(nameCell, emailCell, roleCell);
    usersList.append(row);
  });
}

async function loadSiteOverview() {
  const response = await fetch('/api/site-overview');
  if (!response.ok) throw new Error('Не удалось загрузить сводку сайта.');
  const data = await response.json();
  summaryLessons.textContent = formatNumber(data.lessons);
  summaryClasses.textContent = formatNumber(data.classes.length);
  summaryUsers.textContent = formatNumber(data.users);
  summaryClassesList.replaceChildren();
  data.classes.forEach((item) => appendSummaryRow(summaryClassesList, item.name, item.lessons));

  const traffic = data.traffic;
  summaryTrafficList.replaceChildren();
  if (traffic.available) {
    summaryVisitors.textContent = formatNumber(traffic.unique_visitors);
    summaryTrafficNote.textContent = 'Данные GitHub за последние 14 дней.';
    traffic.daily.slice(-5).forEach((item) => appendSummaryRow(summaryTrafficList, item.date, item.views));
    summaryStatus.textContent = 'GitHub подключён';
  } else {
    summaryVisitors.textContent = '—';
    summaryTrafficNote.textContent = 'Посещаемость GitHub появится после подключения GITHUB_TOKEN.';
    summaryStatus.textContent = 'Локальные данные';
  }
}

function closeLogoutModal() {
  logoutModal.hidden = true;
  logoutModal.style.display = 'none';
}

closeLogoutModal();
window.addEventListener('pageshow', closeLogoutModal);

logoutButton.addEventListener('click', () => {
  logoutModal.hidden = false;
  logoutModal.style.display = 'grid';
  logoutConfirm.focus();
});
logoutCancel.addEventListener('click', closeLogoutModal);
logoutModal.addEventListener('click', (event) => {
  if (event.target === logoutModal) closeLogoutModal();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !logoutModal.hidden) closeLogoutModal();
});

logoutConfirm.addEventListener('click', async () => {
  closeLogoutModal();
  logoutButton.disabled = true;
  try {
    await fetch('/api/logout', { method: 'POST' });
  } finally {
    window.location.replace('/login');
  }
});

loadCurrentUser().catch(() => window.location.replace('/login'));
loadSiteOverview().catch(() => {
  summaryStatus.textContent = 'Нет данных';
  summaryTrafficNote.textContent = 'Сводка сайта временно недоступна.';
});
