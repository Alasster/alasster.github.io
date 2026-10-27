const profileForm = document.getElementById('profile-form');
const profileFirstName = document.getElementById('profile-first-name');
const profileLastName = document.getElementById('profile-last-name');
const profileEmailEdit = document.getElementById('profile-email-edit');
const profilePassword = document.getElementById('profile-password');
const profilePasswordConfirm = document.getElementById('profile-password-confirm');
const profileMessage = document.getElementById('profile-message');
const profileConfirmModal = document.getElementById('profile-confirm-modal');
const profileConfirmCancel = document.getElementById('profile-confirm-cancel');
const profileConfirmSave = document.getElementById('profile-confirm-save');
const unsavedProfileModal = document.getElementById('unsaved-profile-modal');
const unsavedProfileDiscard = document.getElementById('unsaved-profile-discard');
const unsavedProfileCancel = document.getElementById('unsaved-profile-cancel');
const unsavedProfileSave = document.getElementById('unsaved-profile-save');
const logoutButton = document.getElementById('logout-button');
const adminPanel = document.getElementById('admin-panel');
const usersList = document.getElementById('users-list');
const adminMessage = document.getElementById('admin-message');
const adminPasswordModal = document.getElementById('admin-password-modal');
const adminPasswordUser = document.getElementById('admin-password-user');
const adminNewPassword = document.getElementById('admin-new-password');
const adminNewPasswordConfirm = document.getElementById('admin-new-password-confirm');
const adminPasswordCancel = document.getElementById('admin-password-cancel');
const adminPasswordConfirm = document.getElementById('admin-password-confirm');
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
const lessonCatalogStatus = document.getElementById('lesson-catalog-status');
const lessonCatalogGrid = document.getElementById('lesson-catalog-grid');
const lessonCatalogRetry = document.getElementById('lesson-catalog-retry');
const trafficChart = document.getElementById('traffic-chart');
const trafficChartY = document.getElementById('traffic-chart-y');
const trafficChartBars = document.getElementById('traffic-chart-bars');
const trafficChartLabels = document.getElementById('traffic-chart-labels');
const trafficModes = [...document.querySelectorAll('[data-traffic-mode]')];
const sectionCards = document.getElementById('section-cards');
const sectionViews = [...document.querySelectorAll('[data-cabinet-section]')];
const roles = ['user', 'teacher', 'admin', 'superadmin'];
let canManageUsers = false;
let currentDisplayName = 'Рабочая область';
let pendingProfileChanges = null;
let resetPasswordUserId = null;
let profileSnapshot = null;
let profileDirty = false;
let currentSection = 'overview';
let allowHashChange = false;
let pendingNavigation = null;

const sectionHeadings = {
  overview: ['ОБЗОР КАБИНЕТА', 'Рабочая область'],
  profile: ['ПРОФИЛЬ', 'Профиль пользователя'],
  lessons: ['УРОКИ И КЛАССЫ', 'Учебные разделы'],
  tests: ['ТЕСТЫ И ЗАДАНИЯ', 'Генератор СОР и СОЧ'],
  materials: ['МОИ МАТЕРИАЛЫ', 'Личные материалы'],
};

const formatNumber = (value) => new Intl.NumberFormat('ru-RU').format(Number(value) || 0);
let trafficSeries = { daily: [], monthly: [] };
let selectedTrafficMode = 'daily';
let lessonCatalogRequest = null;
let lessonsSummaryText = 'Загрузка списка...';
let lessonVisibility = {};

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
  if (section === 'lessons') loadLessonsCatalog();
  return link;
}

function showCabinetSection(section) {
  const selectedSection = sectionHeadings[section] ? section : 'overview';
  currentSection = selectedSection;
  sectionViews.forEach((view) => {
    const isAdminOnly = view.id === 'admin-panel';
    view.hidden = view.dataset.cabinetSection !== selectedSection || (isAdminOnly && !canManageUsers);
  });
  if (sectionCards) sectionCards.hidden = !sectionViews.some(
    (view) => view.closest('#section-cards') && !view.hidden,
  );
  if (selectedSection === 'tests') {
    window.initTestGenerator?.();
  }
  if (selectedSection === 'materials') {
    window.initMaterialsManager?.();
  }
  const [eyebrow, sectionTitle] = sectionHeadings[selectedSection];
  let title = selectedSection === 'overview' ? currentDisplayName : sectionTitle;
  if (selectedSection === 'lessons') title = lessonsSummaryText;
  const eyebrowNode = document.querySelector('.workspace-header .eyebrow');
  const titleNode = document.querySelector('.workspace-header h1');
  if (eyebrowNode) eyebrowNode.textContent = eyebrow;
  if (titleNode) titleNode.textContent = title;
}

document.querySelectorAll('.sidebar-link').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    requestSectionNavigation(link.getAttribute('href').slice(1));
  });
});

window.addEventListener('hashchange', () => {
  const requestedSection = (window.location.hash || '#overview').slice(1);
  if (!allowHashChange && requestedSection !== currentSection && profileHasUnsavedChanges()) {
    allowHashChange = true;
    window.location.hash = currentSection;
    openUnsavedProfileModal({ type: 'section', section: requestedSection });
    return;
  }
  allowHashChange = false;
  syncSidebarActive();
});
syncSidebarActive();

async function loadCurrentUser() {
  const response = await fetch('/api/me');
  if (response.status === 401) {
    window.location.replace('/login');
    return;
  }
  if (!response.ok) throw new Error('Не удалось загрузить профиль.');
  const user = await response.json();
  currentDisplayName = user.display_name || user.username;
  workspaceRole.textContent = user.role === 'superadmin' ? 'Супер-админ' : user.role;
  profileFirstName.value = user.first_name || '';
  profileLastName.value = user.last_name || '';
  profileEmailEdit.value = user.username || '';
  profileSnapshot = collectProfileChanges();
  profileDirty = false;
  if (user.role === 'superadmin') {
    canManageUsers = true;
    await loadUsers();
  }
  syncSidebarActive();
}

async function loadUsers() {
  const response = await fetch('/api/users');
  if (!response.ok) throw new Error('Не удалось загрузить пользователей.');
  const data = await response.json();
  usersList.replaceChildren();
  if (!data.users.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 4;
    cell.className = 'table-empty';
    cell.textContent = 'Других зарегистрированных пользователей пока нет.';
    row.append(cell);
    usersList.append(row);
    return;
  }
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
    const passwordCell = document.createElement('td');
    const resetButton = document.createElement('button');
    resetButton.className = 'button button-ghost table-action';
    resetButton.type = 'button';
    resetButton.textContent = 'Задать новый';
    resetButton.addEventListener('click', () => openAdminPasswordModal(user));
    passwordCell.append(resetButton);
    row.append(nameCell, emailCell, roleCell, passwordCell);
    usersList.append(row);
  });
}

function showModal(modal) {
  modal.hidden = false;
  modal.style.display = 'grid';
  modal.classList.add('open');
}

function hideModal(modal) {
  modal.hidden = true;
  modal.style.display = 'none';
  modal.classList.remove('open');
}

function collectProfileChanges() {
  const newPassword = profilePassword?.value || '';
  return {
    first_name: profileFirstName?.value.trim() || '',
    last_name: profileLastName?.value.trim() || '',
    email: profileEmailEdit?.value.trim().toLowerCase() || '',
    new_password: newPassword,
    new_password_confirm: newPassword ? (profilePasswordConfirm?.value || '') : '',
  };
}

function profileHasUnsavedChanges() {
  return profileDirty
    && profileSnapshot !== null
    && JSON.stringify(profileSnapshot) !== JSON.stringify(collectProfileChanges());
}

function validateProfileChanges(changes) {
  if (!changes.first_name || !changes.last_name || !changes.email) {
    return 'Заполните имя, фамилию и email.';
  }
  if (changes.new_password !== changes.new_password_confirm) {
    return 'Пароли не совпадают.';
  }
  if (changes.new_password && changes.new_password.length < 8) {
    return 'Новый пароль должен содержать минимум 8 символов.';
  }
  return '';
}

function restoreProfileSnapshot() {
  if (!profileSnapshot) return;
  profileFirstName.value = profileSnapshot.first_name;
  profileLastName.value = profileSnapshot.last_name;
  profileEmailEdit.value = profileSnapshot.email;
  profilePassword.value = '';
  profilePasswordConfirm.value = '';
  profileMessage.textContent = '';
  profileDirty = false;
}

function closeUnsavedProfileModal() {
  hideModal(unsavedProfileModal);
  pendingNavigation = null;
}

function openUnsavedProfileModal(action) {
  pendingNavigation = action;
  showModal(unsavedProfileModal);
  unsavedProfileSave.focus();
}

function continuePendingNavigation() {
  const action = pendingNavigation;
  pendingNavigation = null;
  if (!action) return;
  if (action.type === 'section') {
    allowHashChange = true;
    window.location.hash = action.section;
  } else if (action.type === 'external') {
    window.location.assign(action.href);
  } else if (action.type === 'logout') {
    performLogout();
  }
}

function requestSectionNavigation(section) {
  if (section === currentSection) return;
  if (profileHasUnsavedChanges()) {
    openUnsavedProfileModal({ type: 'section', section });
    return;
  }
  allowHashChange = true;
  window.location.hash = section;
}

unsavedProfileCancel?.addEventListener('click', closeUnsavedProfileModal);
unsavedProfileDiscard?.addEventListener('click', () => {
  const action = pendingNavigation;
  restoreProfileSnapshot();
  closeUnsavedProfileModal();
  pendingNavigation = action;
  continuePendingNavigation();
});
unsavedProfileModal?.addEventListener('click', (event) => {
  if (event.target === unsavedProfileModal) closeUnsavedProfileModal();
});

document.querySelector('.brand')?.addEventListener('click', (event) => {
  if (!profileHasUnsavedChanges()) return;
  event.preventDefault();
  openUnsavedProfileModal({ type: 'external', href: event.currentTarget.href });
});

function closeProfileConfirmModal() {
  hideModal(profileConfirmModal);
  pendingProfileChanges = null;
}

profileForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  profileMessage.textContent = '';
  const changes = collectProfileChanges();
  const validationError = validateProfileChanges(changes);
  if (validationError) {
    profileMessage.textContent = validationError;
    return;
  }
  pendingProfileChanges = changes;
  showModal(profileConfirmModal);
  profileConfirmSave.focus();
});

profileForm?.addEventListener('input', () => {
  profileDirty = true;
});

profileConfirmCancel?.addEventListener('click', closeProfileConfirmModal);
profileConfirmModal?.addEventListener('click', (event) => {
  if (event.target === profileConfirmModal) closeProfileConfirmModal();
});

async function saveProfileChanges(changes) {
  const response = await fetch('/api/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(changes),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.detail || 'Не удалось сохранить профиль.');
  currentDisplayName = result.display_name || result.username;
  workspaceRole.textContent = result.role === 'superadmin' ? 'Супер-админ' : result.role;
  profileFirstName.value = result.first_name || '';
  profileLastName.value = result.last_name || '';
  profileEmailEdit.value = result.username || '';
  profilePassword.value = '';
  profilePasswordConfirm.value = '';
  profileSnapshot = collectProfileChanges();
  profileDirty = false;
  return result;
}

unsavedProfileSave?.addEventListener('click', async () => {
  const changes = collectProfileChanges();
  const validationError = validateProfileChanges(changes);
  if (validationError) {
    profileMessage.textContent = validationError;
    return;
  }
  const action = pendingNavigation;
  unsavedProfileSave.disabled = true;
  try {
    await saveProfileChanges(changes);
    profileMessage.textContent = 'Профиль сохранён в базе.';
    closeUnsavedProfileModal();
    pendingNavigation = action;
    continuePendingNavigation();
  } catch (error) {
    profileMessage.textContent = error.message;
  } finally {
    unsavedProfileSave.disabled = false;
  }
});

profileConfirmSave?.addEventListener('click', async () => {
  if (!pendingProfileChanges) return;
  profileConfirmSave.disabled = true;
  try {
    await saveProfileChanges(pendingProfileChanges);
    profileMessage.textContent = 'Профиль сохранён в базе.';
    closeProfileConfirmModal();
    syncSidebarActive();
  } catch (error) {
    profileMessage.textContent = error.message;
    hideModal(profileConfirmModal);
    pendingProfileChanges = null;
  } finally {
    profileConfirmSave.disabled = false;
  }
});

function closeAdminPasswordModal() {
  hideModal(adminPasswordModal);
  resetPasswordUserId = null;
  adminNewPassword.value = '';
  adminNewPasswordConfirm.value = '';
}

function openAdminPasswordModal(user) {
  resetPasswordUserId = user.id;
  adminPasswordUser.textContent = `${user.display_name || user.username} · ${user.username}`;
  showModal(adminPasswordModal);
  adminNewPassword.focus();
}

adminPasswordCancel?.addEventListener('click', closeAdminPasswordModal);
adminPasswordModal?.addEventListener('click', (event) => {
  if (event.target === adminPasswordModal) closeAdminPasswordModal();
});

adminPasswordConfirm?.addEventListener('click', async () => {
  if (!resetPasswordUserId) return;
  const password = adminNewPassword.value;
  const confirmation = adminNewPasswordConfirm.value;
  if (password.length < 8) {
    adminMessage.textContent = 'Пароль должен содержать минимум 8 символов.';
    return;
  }
  if (password !== confirmation) {
    adminMessage.textContent = 'Пароли не совпадают.';
    return;
  }
  adminPasswordConfirm.disabled = true;
  try {
    const response = await fetch(`/api/users/${resetPasswordUserId}/password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ new_password: password, new_password_confirm: confirmation }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.detail || 'Не удалось изменить пароль.');
    adminMessage.textContent = 'Новый пароль сохранён. Передайте его пользователю.';
    closeAdminPasswordModal();
  } catch (error) {
    adminMessage.textContent = error.message;
  } finally {
    adminPasswordConfirm.disabled = false;
  }
});

async function loadSiteOverview() {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 15_000);
  let response;
  try {
    response = await fetch('/api/site-overview', { signal: controller.signal });
  } finally {
    window.clearTimeout(timeoutId);
  }
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
  summaryStatus.textContent = analyticsAvailable ? 'GA4 подключён' : 'GA4 недоступен';
  renderTrafficChart(selectedTrafficMode);

  if (data.mobile_connect) {
    const lanInput = document.getElementById('mobile-lan-link');
    const internetInput = document.getElementById('mobile-internet-link');
    if (lanInput && data.mobile_connect.lan_url) lanInput.value = data.mobile_connect.lan_url;
    if (internetInput && data.mobile_connect.internet_url) internetInput.value = data.mobile_connect.internet_url;
  }
}

function visibilityKeyForQuarter(grade, quarter) {
  return `__quarter__|${grade}|${quarter}`;
}

function renderLessonsCatalog(classes) {
  lessonCatalogGrid.replaceChildren();
  let totalLessons = 0;
  const syncOpenClassLayout = () => {
    const openCount = lessonCatalogGrid.querySelectorAll('.lesson-class-card[open]').length;
    lessonCatalogGrid.classList.toggle('is-single-open', openCount === 1);
  };
  classes.forEach((item) => {
    totalLessons += item.lessons;
    const card = document.createElement('details');
    card.className = 'lesson-class-card';
    card.open = false;
    card.addEventListener('toggle', syncOpenClassLayout);

    const summary = document.createElement('summary');
    const name = document.createElement('strong');
    const count = document.createElement('span');
    name.textContent = item.name;
    count.className = 'lesson-class-count';
    count.textContent = `${formatNumber(item.lessons)} уроков`;
    summary.append(name, count);
    card.append(summary);

    item.groups.forEach((group) => {
      const groupSection = document.createElement('section');
      groupSection.className = 'lesson-topic-group';
      const heading = document.createElement('h3');
      heading.textContent = group.name;
      const quarterKey = visibilityKeyForQuarter(item.name, group.name);
      const quarterToggle = document.createElement('button');
      quarterToggle.type = 'button';
      quarterToggle.className = 'lesson-visibility-toggle';
      quarterToggle.dataset.visibilityKey = quarterKey;
      quarterToggle.dataset.visibilityKind = 'quarter';
      quarterToggle.textContent = lessonVisibility[quarterKey] === false ? 'Четверть скрыта' : 'Четверть видима';
      quarterToggle.setAttribute('aria-pressed', String(lessonVisibility[quarterKey] !== false));
      heading.append(' ', quarterToggle);
      const links = document.createElement('div');
      links.className = 'lesson-topic-list';
      group.lessons.forEach((lesson) => {
        const row = document.createElement('div');
        row.className = 'lesson-topic-row';
        const lessonToggle = document.createElement('button');
        lessonToggle.type = 'button';
        lessonToggle.className = 'lesson-visibility-toggle lesson-visibility-toggle-lesson';
        lessonToggle.dataset.visibilityKey = lesson.href.replace('https://alasster.site/', '');
        lessonToggle.dataset.visibilityKind = 'lesson';
        lessonToggle.textContent = lessonVisibility[lessonToggle.dataset.visibilityKey] === false ? 'Скрыт' : 'Виден';
        lessonToggle.setAttribute('aria-pressed', String(lessonVisibility[lessonToggle.dataset.visibilityKey] !== false));
        const link = document.createElement('a');
        link.className = 'lesson-topic-link';
        link.href = lesson.href;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        const number = document.createElement('span');
        number.className = 'lesson-topic-number';
        number.textContent = lesson.number == null ? '•' : formatNumber(lesson.number);
        const title = document.createElement('span');
        title.textContent = lesson.title;
        link.append(number, title);
        row.append(link, lessonToggle);
        if (item.name !== 'Python основы') {
          const kspButton = document.createElement('button');
          kspButton.className = 'button button-ghost lesson-ksp-button';
          kspButton.type = 'button';
          kspButton.disabled = true;
          kspButton.textContent = 'КСП';
          kspButton.title = 'Генератор КСП будет добавлен позже';
          kspButton.setAttribute('aria-label', `КСП: ${lesson.title} — скоро`);
          row.append(kspButton);
        }
        links.append(row);
      });
      groupSection.append(heading, links);
      card.append(groupSection);
    });
    lessonCatalogGrid.append(card);
  });
  syncOpenClassLayout();
  lessonsSummaryText = `${formatNumber(classes.length)} классов · ${formatNumber(totalLessons)} уроков`;
  if (lessonCatalogStatus) lessonCatalogStatus.textContent = lessonsSummaryText;
  if (currentSection === 'lessons') {
    const titleNode = document.querySelector('.workspace-header h1');
    if (titleNode) titleNode.textContent = lessonsSummaryText;
  }
  lessonCatalogRetry.hidden = true;
}

async function loadLessonsCatalog() {
  if (lessonCatalogRequest) return lessonCatalogRequest;
  if (lessonCatalogStatus) lessonCatalogStatus.textContent = 'Обновление списка...';
  if (currentSection === 'lessons' && lessonsSummaryText === 'Загрузка списка...') {
    const titleNode = document.querySelector('.workspace-header h1');
    if (titleNode) titleNode.textContent = 'Обновление списка...';
  }
  lessonCatalogRetry.hidden = true;
  lessonCatalogRequest = (async () => {
    try {
      const response = await fetch('/api/lessons-catalog');
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Не удалось загрузить уроки.');
      lessonVisibility = data.visibility || {};
      renderLessonsCatalog(data.classes);
    } catch (error) {
      const msg = error.message || 'Не удалось загрузить уроки.';
      if (lessonCatalogStatus) lessonCatalogStatus.textContent = msg;
      if (currentSection === 'lessons') {
        const titleNode = document.querySelector('.workspace-header h1');
        if (titleNode) titleNode.textContent = msg;
      }
      lessonCatalogRetry.hidden = false;
    } finally {
      lessonCatalogRequest = null;
    }
  })();
  return lessonCatalogRequest;
}

lessonCatalogRetry.addEventListener('click', loadLessonsCatalog);

lessonCatalogGrid?.addEventListener('click', async (event) => {
  const toggle = event.target.closest('.lesson-visibility-toggle');
  if (!toggle) return;
  const key = toggle.dataset.visibilityKey;
  const nextValue = toggle.getAttribute('aria-pressed') !== 'true';
  toggle.disabled = true;
  try {
    const body = toggle.dataset.visibilityKind === 'quarter'
      ? (() => { const [, grade, quarter] = key.split('|'); return { grade, quarter, is_visible: nextValue }; })()
      : { relative_path: key, is_visible: nextValue };
    const response = await fetch('/api/lesson-visibility', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Не удалось сохранить видимость.');
    lessonVisibility[key] = nextValue;
    await loadLessonsCatalog();
  } catch (error) {
    alert(error.message || 'Не удалось сохранить видимость.');
  } finally {
    toggle.disabled = false;
  }
});

function renderTrafficChart(mode) {
  const points = (trafficSeries[mode] || []).slice(-14);
  if (!points.length) {
    trafficChartY.replaceChildren();
    const zeroLabel = document.createElement('span');
    zeroLabel.textContent = '0';
    trafficChartY.append(zeroLabel);
    trafficChartBars.replaceChildren();
    trafficChartLabels.replaceChildren();
    trafficChart.hidden = false;
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
    bar.textContent = formatNumber(point.value);
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

function openLogoutModal() {
  logoutModal.hidden = false;
  logoutModal.style.display = 'grid';
  logoutConfirm.focus();
}

function performLogout() {
  closeLogoutModal();
  logoutButton.disabled = true;
  fetch('/api/logout', { method: 'POST' }).finally(() => {
    window.location.replace('/login');
  });
}

logoutButton.addEventListener('click', () => {
  if (profileHasUnsavedChanges()) {
    openUnsavedProfileModal({ type: 'logout' });
    return;
  }
  openLogoutModal();
});
logoutCancel.addEventListener('click', closeLogoutModal);
logoutModal.addEventListener('click', (event) => {
  if (event.target === logoutModal) closeLogoutModal();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !logoutModal.hidden) closeLogoutModal();
});

logoutConfirm.addEventListener('click', performLogout);

window.addEventListener('beforeunload', (event) => {
  if (!profileHasUnsavedChanges()) return;
  event.preventDefault();
  event.returnValue = '';
});

loadCurrentUser().catch(() => window.location.replace('/login'));
loadSiteOverview().catch((error) => {
  summaryStatus.textContent = 'Нет данных';
  summaryStatus.title = error?.name === 'AbortError' ? 'Сервер аналитики не ответил вовремя.' : 'Не удалось получить данные аналитики.';
});
window.setInterval(() => {
  loadSiteOverview().catch(() => {});
}, 60_000);

if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  let prevReloadToken = null;
  window.setInterval(async () => {
    try {
      const response = await fetch('/static/reload.txt?t=' + Date.now());
      if (response.ok) {
        const token = await response.text();
        if (prevReloadToken && token !== prevReloadToken) window.location.reload();
        prevReloadToken = token;
      }
    } catch (_) {}
  }, 1000);
}
