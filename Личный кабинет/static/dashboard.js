const profileForm = document.getElementById('profile-form');

const profileFirstName = document.getElementById('profile-first-name');

const profileLastName = document.getElementById('profile-last-name');

const profileEmailEdit = document.getElementById('profile-email-edit');

const profilePassword = document.getElementById('profile-password');

const profilePasswordConfirm = document.getElementById('profile-password-confirm');

const profileClassNumber = document.getElementById('profile-class-number');

const profileClassLetter = document.getElementById('profile-class-letter');

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

const ROLE_SECTIONS = {
  superadmin: ['overview', 'profile', 'lessons', 'tests', 'materials'],
  teacher: ['profile', 'tests'],
  user: ['profile']
};

function getDefaultSectionForRole(role) {
  if (role === 'superadmin') return 'overview';
  if (role === 'teacher') return 'tests';
  return 'profile';
}

function applyUserRole(userRole) {
  window.currentUserRole = userRole;
  document.body.dataset.userRole = userRole;
  document.documentElement.dataset.userRole = userRole;
  const allowed = ROLE_SECTIONS[userRole] || ['profile'];
  document.querySelectorAll('.sidebar-link').forEach((link) => {
    const sec = (link.getAttribute('href') || '').replace('#', '');
    if (allowed.includes(sec)) {
      link.hidden = false;
      link.style.display = '';
    } else {
      link.hidden = true;
      link.style.display = 'none';
    }
  });
}

// Synchronously apply initial role from body attribute or localStorage before first render
const initialRole = document.body.dataset.userRole || (() => {
  try {
    return JSON.parse(localStorage.getItem('alasster_auth_user') || '{}').role;
  } catch (_) { return 'user'; }
})() || 'user';
applyUserRole(initialRole);

function syncSidebarActive() {
  const role = window.currentUserRole || document.body.dataset.userRole || 'user';
  const defaultSec = getDefaultSectionForRole(role);
  const allowed = ROLE_SECTIONS[role] || [defaultSec];
  const requestedSection = (window.location.hash || '').slice(1);
  const section = (requestedSection && allowed.includes(requestedSection)) ? requestedSection : defaultSec;
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

  window.currentCabinetUser = user;

  try {

    localStorage.setItem('alasster_auth_user', JSON.stringify(user));

    localStorage.setItem('alasster_logged_in', '1');

  } catch (_) {}

  const userRole = user.role || 'user';

  window.currentUserRole = userRole;

  currentDisplayName = user.display_name || user.username;

  // Re-apply role filter once verified with server
  applyUserRole(userRole);

  if (userRole === 'superadmin') {

    workspaceRole.textContent = 'Супер-админ';

    workspaceRole.style.display = '';

    canManageUsers = true;

    await loadUsers();

    loadSiteOverview().catch(() => {});

  } else if (userRole === 'teacher') {

    workspaceRole.textContent = 'Учитель';

    workspaceRole.style.display = '';

    canManageUsers = false;

  } else {

    // Student: profile only, hide role tag, hide admin panel

    workspaceRole.textContent = 'Ученик';

    workspaceRole.style.display = 'none';

    canManageUsers = false;

  }

  profileFirstName.value = user.first_name || '';

  profileLastName.value = user.last_name || '';

  profileEmailEdit.value = user.username || '';

  const profileClassRow = document.getElementById('profile-class-select-row');
  const profileEmailWrap = document.getElementById('profile-email-wrap');

  if (profileClassRow) {
    const isStudent = (userRole === 'user');
    profileClassRow.style.display = isStudent ? '' : 'none';
    if (profileEmailWrap) {
      profileEmailWrap.style.gridColumn = isStudent ? 'auto' : '1 / -1';
    }
  }

  if (userRole === 'user' && user.class_name) {

    const parts = user.class_name.split(' ');

    if (profileClassNumber) profileClassNumber.value = parts[0] || '';

    if (profileClassLetter) profileClassLetter.value = parts[1] || '';

  } else {

    if (profileClassNumber) profileClassNumber.value = '';

    if (profileClassLetter) profileClassLetter.value = '';

  }

  profileSnapshot = collectProfileChanges();

  profileDirty = false;

  const allowed = ROLE_SECTIONS[userRole] || [getDefaultSectionForRole(userRole)];

  const currentHash = (window.location.hash || '').replace('#', '');

  if (!allowed.includes(currentHash)) {

    window.location.hash = '#' + allowed[0];

  }

  syncSidebarActive();

}

const usersSearchInput = document.getElementById('users-search-input');

const usersClassFilter = document.getElementById('users-class-filter');

const usersResetFilters = document.getElementById('users-reset-filters');

const usersCountBadge = document.getElementById('users-count-badge');

const adminEditNameModal = document.getElementById('admin-edit-name-modal');

const adminEditNameUser = document.getElementById('admin-edit-name-user');

const adminEditFirstname = document.getElementById('admin-edit-firstname');

const adminEditLastname = document.getElementById('admin-edit-lastname');

const adminEditDisplayname = document.getElementById('admin-edit-displayname');

const adminEditMessage = document.getElementById('admin-edit-message');

const adminEditCancel = document.getElementById('admin-edit-cancel');

const adminEditConfirm = document.getElementById('admin-edit-confirm');

const adminDeleteUserModal = document.getElementById('admin-delete-user-modal');

const adminDeleteDesc = document.getElementById('admin-delete-desc');

const adminDeleteCancel = document.getElementById('admin-delete-cancel');

const adminDeleteConfirm = document.getElementById('admin-delete-confirm');

let allUsersData = [];

let usersSortCol = 'name';

let usersSortAsc = true;

let editingUserId = null;

let deletingUserId = null;

const roleLabels = {

  user: 'Ученик',

  teacher: 'Учитель',

  admin: 'Администратор',

  superadmin: 'Супер-админ'

};

function applyUsersFilterAndSort() {

  const searchTerm = (usersSearchInput?.value || '').trim().toLowerCase();

  const classFilter = (usersClassFilter?.value || '').trim().toLowerCase();

  let filtered = allUsersData.filter((u) => {

    if (classFilter) {

      const uClass = (u.class_name || '').trim().toLowerCase();

      if (classFilter === '__none__' && uClass) return false;

      if (classFilter !== '__none__' && uClass !== classFilter) return false;

    }

    if (searchTerm) {

      const match = (u.display_name || '').toLowerCase().includes(searchTerm)

        || (u.first_name || '').toLowerCase().includes(searchTerm)

        || (u.last_name || '').toLowerCase().includes(searchTerm)

        || (u.username || '').toLowerCase().includes(searchTerm)

        || (u.class_name || '').toLowerCase().includes(searchTerm);

      if (!match) return false;

    }

    return true;

  });

  filtered.sort((a, b) => {

    let valA = '';

    let valB = '';

    if (usersSortCol === 'name') {

      valA = a.display_name || a.username || '';

      valB = b.display_name || b.username || '';

    } else if (usersSortCol === 'class') {

      valA = a.class_name || '';

      valB = b.class_name || '';

    } else if (usersSortCol === 'email') {

      valA = a.username || '';

      valB = b.username || '';

    } else if (usersSortCol === 'role') {

      valA = a.role || '';

      valB = b.role || '';

    }

    const cmp = valA.localeCompare(valB, 'ru', { numeric: true });

    return usersSortAsc ? cmp : -cmp;

  });

  if (usersCountBadge) {

    usersCountBadge.textContent = `Показано: ${filtered.length} из ${allUsersData.length}`;

  }

  renderUsersRows(filtered);

}

function updateClassFilterOptions() {

  if (!usersClassFilter) return;

  const currentVal = usersClassFilter.value;

  const classesSet = new Set();

  allUsersData.forEach((u) => {

    if (u.class_name && u.class_name.trim()) classesSet.add(u.class_name.trim());

  });

  const sortedClasses = Array.from(classesSet).sort((a, b) => a.localeCompare(b, 'ru', { numeric: true }));

  usersClassFilter.replaceChildren();

  const allOpt = document.createElement('option');

  allOpt.value = '';

  allOpt.textContent = 'Все классы';

  usersClassFilter.append(allOpt);

  sortedClasses.forEach((cls) => {

    const opt = document.createElement('option');

    opt.value = cls.toLowerCase();

    opt.textContent = cls;

    if (opt.value === currentVal) opt.selected = true;

    usersClassFilter.append(opt);

  });

  const noneOpt = document.createElement('option');

  noneOpt.value = '__none__';

  noneOpt.textContent = 'Без класса';

  if (currentVal === '__none__') noneOpt.selected = true;

  usersClassFilter.append(noneOpt);

}

function renderUsersRows(users) {

  usersList.replaceChildren();

  if (!users.length) {

    const row = document.createElement('tr');

    const cell = document.createElement('td');

    cell.colSpan = 5;

    cell.className = 'table-empty';

    cell.textContent = allUsersData.length ? 'Ни один пользователь не соответствует фильтрам.' : 'Других зарегистрированных пользователей пока нет.';

    row.append(cell);

    usersList.append(row);

    return;

  }

  users.forEach((user) => {

    const row = document.createElement('tr');

    // 1. User Name

    const nameCell = document.createElement('td');

    const nameWrap = document.createElement('div');

    nameWrap.className = 'user-name-cell';

    const avatar = document.createElement('span');

    avatar.style.cssText = 'color: var(--primary); font-size: 0.85rem;';

    avatar.innerHTML = '<i class="fa-solid fa-user"></i>';

    const nameText = document.createElement('span');

    nameText.textContent = user.display_name || user.username;

    nameWrap.append(avatar, nameText);

    nameCell.append(nameWrap);

    // 2. Class input: ONLY for student (role === 'user')

    const classCell = document.createElement('td');

    if (user.role === 'user') {

      const classInput = document.createElement('input');

      classInput.type = 'text';

      classInput.className = 'class-input';

      classInput.value = user.class_name || '';

      classInput.placeholder = 'Класс...';

      classInput.title = 'Введите класс (например: 10 А) и нажмите Enter или кликните в сторону';

      let lastVal = user.class_name || '';

      const saveClass = async () => {

        const newVal = classInput.value.trim();

        if (newVal === lastVal) return;

        try {

          const resp = await fetch(`/api/users/${user.id}/class`, {

            method: 'PATCH',

            headers: { 'Content-Type': 'application/json' },

            body: JSON.stringify({ class_name: newVal }),

          });

          if (!resp.ok) throw new Error('Ошибка обновления');

          lastVal = newVal;

          user.class_name = newVal;

          classInput.classList.add('is-saved');

          setTimeout(() => classInput.classList.remove('is-saved'), 1500);

          updateClassFilterOptions();

        } catch (err) {

          classInput.value = lastVal;

          if (adminMessage) adminMessage.textContent = 'Не удалось обновить класс.';

        }

      };

      classInput.addEventListener('blur', saveClass);

      classInput.addEventListener('keydown', (e) => {

        if (e.key === 'Enter') {

          classInput.blur();

        }

      });

      classCell.append(classInput);

    } else {

      const dash = document.createElement('span');

      dash.style.cssText = 'color: var(--text-muted); opacity: 0.5; display: block; text-align: center; font-size: 1.1rem;';

      dash.textContent = '—';

      classCell.append(dash);

    }

    // 3. Email Cell

    const emailCell = document.createElement('td');

    emailCell.textContent = user.username;

    emailCell.style.color = 'var(--muted)';

    // 4. Role Cell (Custom Neumorphic Dropdown)

    const roleCell = document.createElement('td');

    const roleWrap = document.createElement('div');

    roleWrap.className = 'neu-dropdown-container';

    const trigger = document.createElement('button');

    trigger.type = 'button';

    trigger.className = 'neu-dropdown-trigger';

    trigger.setAttribute('aria-label', `Роль пользователя ${user.username}`);

    trigger.innerHTML = `<span class="neu-dropdown-label">${roleLabels[user.role] || user.role}</span><svg class="neu-dropdown-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`;

    const menu = document.createElement('div');

    menu.className = 'neu-dropdown-menu';

    roles.forEach((r) => {

      const item = document.createElement('button');

      item.type = 'button';

      item.className = `neu-dropdown-item ${r === user.role ? 'is-selected' : ''}`;

      item.innerHTML = `<span>${roleLabels[r] || r}</span>${r === user.role ? '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' : ''}`;

      item.addEventListener('click', async (e) => {

        e.stopPropagation();

        menu.classList.remove('is-open');

        trigger.classList.remove('is-open');

        if (r === user.role) return;

        trigger.disabled = true;

        if (adminMessage) adminMessage.textContent = '';

        try {

          const update = await fetch(`/api/users/${user.id}/role`, {

            method: 'PATCH',

            headers: { 'Content-Type': 'application/json' },

            body: JSON.stringify({ role: r }),

          });

          const result = await update.json();

          if (!update.ok) throw new Error(result.detail || 'Не удалось изменить роль.');

          user.role = r;

          trigger.querySelector('.neu-dropdown-label').textContent = roleLabels[r] || r;

          menu.querySelectorAll('.neu-dropdown-item').forEach((btn, idx) => {

            const isSel = roles[idx] === r;

            btn.classList.toggle('is-selected', isSel);

            btn.innerHTML = `<span>${roleLabels[roles[idx]] || roles[idx]}</span>${isSel ? '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' : ''}`;

          });

          if (adminMessage) adminMessage.textContent = 'Роль обновлена.';

        } catch (error) {

          if (adminMessage) adminMessage.textContent = error.message;

        } finally {

          trigger.disabled = false;

        }

      });

      menu.append(item);

    });

    trigger.addEventListener('click', (e) => {

      e.stopPropagation();

      const willOpen = !menu.classList.contains('is-open');

      document.querySelectorAll('.neu-dropdown-menu.is-open').forEach((m) => {

        m.classList.remove('is-open');

        m.previousElementSibling?.classList.remove('is-open');

      });

      if (willOpen) {

        menu.classList.add('is-open');

        trigger.classList.add('is-open');

      }

    });

    roleWrap.append(trigger, menu);

    roleCell.append(roleWrap);

    // 5. Actions Cell (Password, Edit Name, Delete) with explicit SVGs and dimensions

    const actionsCell = document.createElement('td');

    const actionsWrap = document.createElement('div');

    actionsWrap.className = 'table-actions-cell';

    // Password reset button

    const passBtn = document.createElement('button');

    passBtn.className = 'button button-ghost table-action table-action-pass';

    passBtn.type = 'button';

    passBtn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="m21 2-2 2m-6 6 6-6m-6 6a5.5 5.5 0 1 0-7.78 7.78 5.5 5.5 0 0 0 7.78-7.78ZM8.5 12a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"/></svg> <span>Пароль</span>';

    passBtn.title = 'Задать новый пароль';

    passBtn.addEventListener('click', () => openAdminPasswordModal(user));

    // Edit Name button

    const editBtn = document.createElement('button');

    editBtn.className = 'button button-ghost table-action table-action-icon-btn';

    editBtn.type = 'button';

    editBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>';

    editBtn.title = 'Редактировать имя пользователя';

    editBtn.addEventListener('click', () => openAdminEditNameModal(user));

    // Delete user button

    const delBtn = document.createElement('button');

    delBtn.className = 'button button-ghost table-action table-action-icon-btn table-action-danger';

    delBtn.type = 'button';

    delBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>';

    delBtn.title = 'Удалить пользователя';

    delBtn.addEventListener('click', () => openAdminDeleteUserModal(user));

    actionsWrap.append(passBtn, editBtn, delBtn);

    actionsCell.append(actionsWrap);

    row.append(nameCell, classCell, emailCell, roleCell, actionsCell);

    usersList.append(row);

  });

}

function openAdminEditNameModal(user) {

  editingUserId = user.id;

  const modal = document.getElementById('admin-edit-name-modal');

  const userLabel = document.getElementById('admin-edit-name-user');

  const firstInput = document.getElementById('admin-edit-firstname');

  const lastInput = document.getElementById('admin-edit-lastname');

  const displayInput = document.getElementById('admin-edit-displayname');

  const classNumInput = document.getElementById('admin-edit-class-number');

  const classLetInput = document.getElementById('admin-edit-class-letter');

  const msgEl = document.getElementById('admin-edit-message');

  if (userLabel) userLabel.textContent = `${user.display_name || user.username} (${user.username})`;

  if (firstInput) firstInput.value = user.first_name || '';

  if (lastInput) lastInput.value = user.last_name || '';

  if (displayInput) displayInput.value = user.display_name || '';

  if (msgEl) msgEl.textContent = '';

  const editClassRow = document.getElementById('admin-edit-class-row');

  if (editClassRow) {

    editClassRow.style.display = (user.role === 'user') ? 'block' : 'none';

  }

  const parts = (user.class_name || '').split(' ');

  if (classNumInput) classNumInput.value = parts[0] || '';

  if (classLetInput) classLetInput.value = parts[1] || '';

  showModal(modal);

  displayInput?.focus();

}

function closeAdminEditNameModal() {

  const modal = document.getElementById('admin-edit-name-modal');

  hideModal(modal);

  editingUserId = null;

}

document.getElementById('admin-edit-cancel')?.addEventListener('click', closeAdminEditNameModal);

document.getElementById('admin-edit-confirm')?.addEventListener('click', async () => {

  if (!editingUserId) return;

  const confirmBtn = document.getElementById('admin-edit-confirm');

  const firstInput = document.getElementById('admin-edit-firstname');

  const lastInput = document.getElementById('admin-edit-lastname');

  const displayInput = document.getElementById('admin-edit-displayname');

  const classNumInput = document.getElementById('admin-edit-class-number');

  const classLetInput = document.getElementById('admin-edit-class-letter');

  const msgEl = document.getElementById('admin-edit-message');

  const first = (firstInput?.value || '').trim();

  const last = (lastInput?.value || '').trim();

  let display = (displayInput?.value || '').trim();

  if (!display && (first || last)) display = `${first} ${last}`.trim();

  if (!display) {

    if (msgEl) msgEl.textContent = 'Введите имя или ФИО.';

    return;

  }

  const num = (classNumInput?.value || '').trim();

  const let_val = (classLetInput?.value || '').trim();

  const newClass = num && let_val ? `${num} ${let_val}` : (num || let_val || '');

  if (confirmBtn) confirmBtn.disabled = true;

  try {

    const resp = await fetch(`/api/users/${editingUserId}/name`, {

      method: 'PATCH',

      headers: { 'Content-Type': 'application/json' },

      body: JSON.stringify({ first_name: first, last_name: last, display_name: display, class_name: newClass }),

    });

    const res = await resp.json();

    if (!resp.ok) throw new Error(res.detail || 'Не удалось обновить пользователя.');

    const u = allUsersData.find((x) => x.id === editingUserId);

    if (u) {

      u.first_name = first;

      u.last_name = last;

      u.display_name = display;

      u.class_name = newClass;

    }

    closeAdminEditNameModal();

    updateClassFilterOptions();

    applyUsersFilterAndSort();

    if (adminMessage) adminMessage.textContent = 'Данные пользователя обновлены.';

  } catch (e) {

    if (msgEl) msgEl.textContent = e.message;

  } finally {

    if (confirmBtn) confirmBtn.disabled = false;

  }

});

function openAdminDeleteUserModal(user) {

  deletingUserId = user.id;

  const modal = document.getElementById('admin-delete-user-modal');

  const descEl = document.getElementById('admin-delete-desc');

  if (descEl) {

    descEl.textContent = `Вы действительно хотите удалить пользователя ${user.display_name || user.username} (${user.username})? Все результаты и сессии будут удалены.`;

  }

  showModal(modal);

}

function closeAdminDeleteUserModal() {

  const modal = document.getElementById('admin-delete-user-modal');

  hideModal(modal);

  deletingUserId = null;

}

document.getElementById('admin-delete-cancel')?.addEventListener('click', closeAdminDeleteUserModal);

document.getElementById('admin-delete-confirm')?.addEventListener('click', async () => {

  if (!deletingUserId) return;

  const confirmBtn = document.getElementById('admin-delete-confirm');

  if (confirmBtn) confirmBtn.disabled = true;

  try {

    const resp = await fetch(`/api/users/${deletingUserId}`, { method: 'DELETE' });

    const res = await resp.json();

    if (!resp.ok) throw new Error(res.detail || 'Не удалось удалить пользователя.');

    allUsersData = allUsersData.filter((u) => u.id !== deletingUserId);

    closeAdminDeleteUserModal();

    updateClassFilterOptions();

    applyUsersFilterAndSort();

    if (adminMessage) adminMessage.textContent = 'Пользователь успешно удален.';

  } catch (e) {

    if (adminMessage) adminMessage.textContent = e.message;

    closeAdminDeleteUserModal();

  } finally {

    if (confirmBtn) confirmBtn.disabled = false;

  }

});

// Setup sortable headers

document.querySelectorAll('.sortable-th').forEach((th) => {

  th.addEventListener('click', () => {

    const col = th.dataset.sort;

    if (usersSortCol === col) {

      usersSortAsc = !usersSortAsc;

    } else {

      usersSortCol = col;

      usersSortAsc = true;

    }

    document.querySelectorAll('.sortable-th').forEach((t) => {

      t.classList.toggle('is-active', t === th);

      const icon = t.querySelector('.sort-icon');

      if (icon) {

        if (t === th) {

          icon.textContent = usersSortAsc ? '▲' : '▼';

        } else {

          icon.textContent = '↕';

        }

      }

    });

    applyUsersFilterAndSort();

  });

});

usersSearchInput?.addEventListener('input', applyUsersFilterAndSort);

usersClassFilter?.addEventListener('change', applyUsersFilterAndSort);

usersResetFilters?.addEventListener('click', () => {

  if (usersSearchInput) usersSearchInput.value = '';

  if (usersClassFilter) usersClassFilter.value = '';

  usersSortCol = 'name';

  usersSortAsc = true;

  document.querySelectorAll('.sortable-th').forEach((t) => {

    t.classList.toggle('is-active', t.dataset.sort === 'name');

    const icon = t.querySelector('.sort-icon');

    if (icon) icon.textContent = t.dataset.sort === 'name' ? '▲' : '↕';

  });

  applyUsersFilterAndSort();

});

async function loadUsers() {

  if (!canManageUsers) return;

  adminMessage.textContent = '';

  try {

    const response = await fetch('/api/users');

    if (!response.ok) throw new Error('Не удалось загрузить пользователей.');

    const data = await response.json();

    allUsersData = data.users || [];

    updateClassFilterOptions();

    applyUsersFilterAndSort();

  } catch (error) {

    adminMessage.textContent = error.message;

  }

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

  let className = '';

  if (window.currentUserRole === 'user') {

    const num = (profileClassNumber?.value || '').trim();

    const lettr = (profileClassLetter?.value || '').trim();

    if (num && lettr) {

      className = `${num} ${lettr}`;

    } else if (num) {

      className = num;

    }

  }

  return {

    first_name: profileFirstName?.value.trim() || '',

    last_name: profileLastName?.value.trim() || '',

    email: profileEmailEdit?.value.trim().toLowerCase() || '',

    class_name: className,

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

  const openCardNames = new Set(
    Array.from(lessonCatalogGrid.querySelectorAll('.lesson-class-card[open] summary strong')).map(s => s.textContent)
  );

  lessonCatalogGrid.replaceChildren();

  let totalLessons = 0;

  const syncOpenClassLayout = () => {

    const cards = Array.from(lessonCatalogGrid.querySelectorAll('.lesson-class-card'));

    const openCards = cards.filter((c) => c.open);

    lessonCatalogGrid.classList.toggle('is-single-open', openCards.length === 1);

    cards.forEach((card) => {

      card.style.order = card.open ? '1' : '2';

    });

  };

  const classList = Array.isArray(classes) ? classes : [];

  classList.forEach((item) => {

    const groups = item.groups || item.quarters || [];

    let countLessons = typeof item.lessons === 'number' ? item.lessons : 0;

    if (!countLessons) {

      groups.forEach((g) => { countLessons += (g.lessons || []).length; });

    }

    totalLessons += countLessons;

    const card = document.createElement('details');

    card.className = 'lesson-class-card';

    card.open = openCardNames.has(item.name);

    card.addEventListener('toggle', syncOpenClassLayout);

    const summary = document.createElement('summary');

    const name = document.createElement('strong');

    const count = document.createElement('span');

    name.textContent = item.name;

    count.className = 'lesson-class-count';

    count.textContent = `${formatNumber(countLessons)} уроков`;

    summary.append(name, count);

    card.append(summary);

    groups.forEach((group) => {

      const groupSection = document.createElement('section');

      groupSection.className = 'lesson-topic-group';

      const heading = document.createElement('h3');

      heading.textContent = group.name;

      const quarterKey = visibilityKeyForQuarter(item.name, group.name);
      const isQuarterVisible = lessonVisibility[quarterKey] !== false;

      const quarterToggleWrap = document.createElement('div');
      quarterToggleWrap.className = 'quarter-toggle-wrap';

      const quarterLabel = document.createElement('span');
      quarterLabel.className = 'quarter-toggle-label';
      quarterLabel.textContent = isQuarterVisible ? 'Четверть видима' : 'Четверть скрыта';

      const quarterToggle = document.createElement('button');
      quarterToggle.type = 'button';
      quarterToggle.className = 'neu-switch lesson-visibility-toggle';
      quarterToggle.dataset.visibilityKey = quarterKey;
      quarterToggle.dataset.visibilityKind = 'quarter';
      quarterToggle.setAttribute('role', 'switch');
      quarterToggle.setAttribute('aria-pressed', String(isQuarterVisible));
      quarterToggle.title = isQuarterVisible ? 'Четверть видима' : 'Четверть скрыта';

      const quarterThumb = document.createElement('span');
      quarterThumb.className = 'neu-switch-thumb';
      quarterToggle.appendChild(quarterThumb);

      quarterToggleWrap.append(quarterLabel, quarterToggle);
      heading.append(' ', quarterToggleWrap);

      if (!isQuarterVisible) {
        groupSection.classList.add('is-quarter-hidden');
      }

      const links = document.createElement('div');

      links.className = 'lesson-topic-list';

      group.lessons.forEach((lesson) => {

        const row = document.createElement('div');

        row.className = 'lesson-topic-row';

        const lessonKey = lesson.href.replace('https://alasster.site/', '');
        const isLessonVisible = lessonVisibility[lessonKey] !== false;

        const lessonToggle = document.createElement('button');
        lessonToggle.type = 'button';
        lessonToggle.className = 'neu-switch lesson-visibility-toggle lesson-visibility-toggle-lesson';
        lessonToggle.dataset.visibilityKey = lessonKey;
        lessonToggle.dataset.visibilityKind = 'lesson';
        lessonToggle.setAttribute('role', 'switch');
        lessonToggle.setAttribute('aria-pressed', String(isLessonVisible));
        lessonToggle.title = isLessonVisible ? 'Урок виден' : 'Урок скрыт';

        const lessonThumb = document.createElement('span');
        lessonThumb.className = 'neu-switch-thumb';
        lessonToggle.appendChild(lessonThumb);

        if (!isLessonVisible) {
          row.classList.add('is-lesson-hidden');
        }

        const link = document.createElement('a');

        link.className = 'lesson-topic-link';

        let lessonHref = lesson.href;

        if (window.currentCabinetUser) {

          try {

            const userPayload = btoa(encodeURIComponent(JSON.stringify(window.currentCabinetUser)));

            const targetUrl = new URL(lesson.href);

            targetUrl.searchParams.set('alasster_user', userPayload);

            lessonHref = targetUrl.href;

          } catch (_) {}

        }

        link.href = lessonHref;

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

          kspButton.dataset.lessonPath = lesson.file_path || decodeURIComponent(lessonKey);

          kspButton.textContent = 'КСП';

          kspButton.title = 'Создать КСП по этому уроку';

          kspButton.setAttribute('aria-label', `КСП: ${lesson.title}`);
          if (window.currentCabinetUser?.role !== 'superadmin' && window.currentCabinetUser?.role !== 'teacher') {
            kspButton.hidden = true;
          }

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

  window.KspButtons?.refresh();

}

let cachedLessonCatalogClasses = null;

async function loadLessonsCatalog() {

  if (cachedLessonCatalogClasses) {

    renderLessonsCatalog(cachedLessonCatalogClasses);

  }

  if (lessonCatalogRequest) return lessonCatalogRequest;

  if (!cachedLessonCatalogClasses && lessonCatalogStatus) lessonCatalogStatus.textContent = 'Обновление списка...';

  if (!cachedLessonCatalogClasses && currentSection === 'lessons' && lessonsSummaryText === 'Загрузка списка...') {

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

      cachedLessonCatalogClasses = data.classes;

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

  const kind = toggle.dataset.visibilityKind;

  // 1. Update UI immediately in-place (no lag, no reload, no collapse!)
  toggle.setAttribute('aria-pressed', String(nextValue));
  lessonVisibility[key] = nextValue;

  if (kind === 'quarter') {
    const groupSection = toggle.closest('.lesson-topic-group');
    if (groupSection) {
      groupSection.classList.toggle('is-quarter-hidden', !nextValue);
      const label = groupSection.querySelector('.quarter-toggle-label');
      if (label) label.textContent = nextValue ? 'Четверть видима' : 'Четверть скрыта';
    }
    toggle.title = nextValue ? 'Четверть видима' : 'Четверть скрыта';
  } else {
    const row = toggle.closest('.lesson-topic-row');
    if (row) {
      row.classList.toggle('is-lesson-hidden', !nextValue);
    }
    toggle.title = nextValue ? 'Урок виден' : 'Урок скрыт';
  }

  // 2. Send PATCH to server in background
  toggle.disabled = true;

  try {

    const body = kind === 'quarter'

      ? (() => { const [, grade, quarter] = key.split('|'); return { grade, quarter, is_visible: nextValue }; })()

      : { relative_path: key, is_visible: nextValue };

    const response = await fetch('/api/lesson-visibility', {

      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)

    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.detail || 'Не удалось сохранить видимость.');

  } catch (error) {

    // Revert UI on error
    toggle.setAttribute('aria-pressed', String(!nextValue));
    lessonVisibility[key] = !nextValue;
    if (kind === 'quarter') {
      const groupSection = toggle.closest('.lesson-topic-group');
      if (groupSection) {
        groupSection.classList.toggle('is-quarter-hidden', nextValue);
        const label = groupSection.querySelector('.quarter-toggle-label');
        if (label) label.textContent = !nextValue ? 'Четверть видима' : 'Четверть скрыта';
      }
    } else {
      const row = toggle.closest('.lesson-topic-row');
      if (row) row.classList.toggle('is-lesson-hidden', nextValue);
    }

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

loadCurrentUser().catch((err) => console.error('Failed to load user:', err));

if (window.currentUserRole === 'superadmin') {

  loadSiteOverview().catch((error) => {

    summaryStatus.textContent = 'Нет данных';

    summaryStatus.title = error?.name === 'AbortError' ? 'Сервер аналитики не ответил вовремя.' : 'Не удалось получить данные аналитики.';

  });

}

window.setInterval(() => {

  if (window.currentUserRole === 'superadmin') {

    loadSiteOverview().catch(() => {});

  }

}, 60_000);

document.addEventListener('click', () => {

  document.querySelectorAll('.neu-dropdown-menu.is-open').forEach((m) => {

    m.classList.remove('is-open');

    m.previousElementSibling?.classList.remove('is-open');

  });

});

