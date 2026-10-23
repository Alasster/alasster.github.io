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
const summaryOnlineUsers = document.getElementById('summary-online-users');
const summaryClassesList = document.getElementById('summary-classes-list');
const trafficChart = document.getElementById('traffic-chart');
const trafficChartY = document.getElementById('traffic-chart-y');
const trafficChartBars = document.getElementById('traffic-chart-bars');
const trafficChartLabels = document.getElementById('traffic-chart-labels');
const trafficModes = [...document.querySelectorAll('[data-traffic-mode]')];
const sectionCards = document.getElementById('section-cards');
const sectionViews = [...document.querySelectorAll('[data-cabinet-section]')];
const roles = ['user', 'teacher', 'admin', 'superadmin'];

const sectionHeadings = {
  overview: ['ОБЗОР КАБИНЕТА', 'Рабочая область'],
  profile: ['ПРОФИЛЬ', 'Профиль пользователя'],
  lessons: ['УРОКИ И КЛАССЫ', 'Учебные разделы'],
  tests: ['ТЕСТЫ И ЗАДАНИЯ', 'Задания и проверки'],
  materials: ['МОИ МАТЕРИАЛЫ', 'Личные материалы'],
  settings: ['НАСТРОЙКИ ПРОФИЛЯ', 'Настройки доступа'],
  'admin-panel': ['УПРАВЛЕНИЕ ДОСТУПОМ', 'Пользователи и роли'],
};

const formatNumber = (value) => new Intl.NumberFormat('ru-RU').format(Number(value) || 0);
let trafficSeries = { daily: [], monthly: [] };
let selectedTrafficMode = 'daily';

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
  const requestedSection = (window.location.hash || '#overview').slice(1);
  const requestedLink = document.querySelector(`.sidebar-link[href="#${requestedSection}"]`);
  const section = requestedLink && !requestedLink.hidden ? requestedSection : 'overview';
  const link = document.querySelector(`.sidebar-link[href="#${section}"]`);
  document.querySelectorAll('.sidebar-link').forEach((item) => item.classList.toggle('active', item === link));
  showCabinetSection(section);
  return link;
}

function showCabinetSection(section) {
  const selectedSection = sectionHeadings[section] ? section : 'overview';
  sectionViews.forEach((view) => {
    view.hidden = view.dataset.cabinetSection !== selectedSection;
  });
  if (sectionCards) sectionCards.hidden = !sectionViews.some(
    (view) => view.closest('#section-cards') && !view.hidden,
  );
  const [eyebrow, title] = sectionHeadings[selectedSection];
  const eyebrowNode = document.querySelector('.workspace-header .eyebrow');
  const titleNode = document.querySelector('.workspace-header h1');
  if (eyebrowNode) eyebrowNode.textContent = eyebrow;
  if (titleNode) titleNode.textContent = title;
}

document.querySelectorAll('.sidebar-link').forEach((link) => {
  link.addEventListener('click', () => {
    document.querySelectorAll('.sidebar-link').forEach((item) => item.classList.remove('active'));
    link.classList.add('active');
    showCabinetSection(link.getAttribute('href').slice(1));
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
    syncSidebarActive();
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
  summaryUsers.textContent = formatNumber(data.cabinet_online_users);
  summaryOnlineUsers.textContent = data.online_users == null ? '—' : formatNumber(data.online_users);
  summaryClassesList.replaceChildren();
  data.classes.forEach((item) => appendSummaryRow(summaryClassesList, item.name, item.lessons));

  trafficSeries = data.traffic || { daily: [], monthly: [] };
  const analyticsAvailable = Boolean(data.analytics_available);
  trafficModes.forEach((button) => { button.disabled = !analyticsAvailable; });
  summaryStatus.textContent = analyticsAvailable ? 'GA4 подключён' : 'Ожидание GA4';
  renderTrafficChart(selectedTrafficMode);
}

function renderTrafficChart(mode) {
  const points = (trafficSeries[mode] || []).slice(-14);
  if (!points.length) {
    trafficChart.hidden = true;
    return;
  }

  const values = points.map((point) => Number(point.value) || 0);
  const maxValue = Math.max(...values, 1);
  trafficChartY.replaceChildren();
  [maxValue, Math.round(maxValue * 2 / 3), Math.round(maxValue / 3), 0].forEach((value) => {
    const label = document.createElement('span');
    label.textContent = formatNumber(value);
    trafficChartY.append(label);
  });
  trafficChartBars.replaceChildren();
  trafficChartLabels.replaceChildren();
  points.forEach((point, index) => {
    const slot = document.createElement('div');
    slot.className = 'traffic-bar-slot';
    const bar = document.createElement('div');
    bar.className = 'traffic-bar';
    bar.style.height = `${Math.max((values[index] / maxValue) * 100, 2)}%`;
    bar.title = `${point.label}: ${formatNumber(point.value)}`;
    bar.setAttribute('aria-label', bar.title);
    slot.append(bar);
    trafficChartBars.append(slot);

    const label = document.createElement('span');
    label.className = 'traffic-chart-label';
    label.textContent = mode === 'daily' ? point.label.slice(5) : point.label;
    label.title = point.label;
    trafficChartLabels.append(label);
  });
  trafficChart.hidden = false;
}

trafficModes.forEach((button) => {
  button.addEventListener('click', () => {
    selectedTrafficMode = button.dataset.trafficMode;
    trafficModes.forEach((item) => {
      const active = item === button;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    renderTrafficChart(selectedTrafficMode);
  });
});

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
});
window.setInterval(() => {
  loadSiteOverview().catch(() => {});
}, 60_000);
