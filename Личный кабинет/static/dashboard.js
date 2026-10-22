const displayName = document.getElementById('display-name');
const profileEmail = document.getElementById('profile-email');
const profileRole = document.getElementById('profile-role');
const logoutButton = document.getElementById('logout-button');
const adminPanel = document.getElementById('admin-panel');
const accessNav = document.getElementById('access-nav');
const usersList = document.getElementById('users-list');
const adminMessage = document.getElementById('admin-message');
const workspaceRole = document.getElementById('workspace-role');
const sidebar = document.querySelector('.sidebar');
const sidebarIndicator = document.querySelector('.sidebar-liquid-indicator');
const roles = ['user', 'teacher', 'admin', 'superadmin'];
let sidebarIndicatorY = null;
const sidebarOutline = sidebarIndicator?.querySelector('path');
let sidebarLiquidFrame = 0;
let sidebarLiquidWidth = 52;
let sidebarLiquidMotion = null;
let sidebarLiquidState = null;
let sidebarOpeningTimer = 0;
let sidebarOpeningPlayed = false;
const sidebarIndicatorBaseSize = 52;

function playSidebarOpeningAnimation() {
  if (!sidebar || sidebarOpeningPlayed) return;
  sidebarOpeningPlayed = true;
  window.clearTimeout(sidebarOpeningTimer);
  sidebar.classList.remove('is-opening');
  void sidebar.offsetWidth;
  sidebar.classList.add('is-opening');
  sidebarOpeningTimer = window.setTimeout(() => sidebar.classList.remove('is-opening'), 920);
}

sidebar?.addEventListener('pointerenter', playSidebarOpeningAnimation, { passive: true });
sidebar?.addEventListener('focusin', () => {
  if (!sidebar.matches(':hover')) playSidebarOpeningAnimation();
});
function resetSidebarOpeningState() {
  if (!sidebar || sidebar.matches(':hover') || sidebar.matches(':focus-within')) return;
  window.clearTimeout(sidebarOpeningTimer);
  sidebar.classList.remove('is-opening');
  sidebarOpeningPlayed = false;
}
sidebar?.addEventListener('pointerleave', resetSidebarOpeningState);
sidebar?.addEventListener('focusout', resetSidebarOpeningState);

function moveSidebarIndicator(link, animate = true) {
  if (!link || !sidebarOutline) return;
  const y = link.offsetTop + Math.max(0, (link.offsetHeight - sidebarIndicatorBaseSize) / 2);
  if (animate && sidebarIndicatorY === y) return;
  const now = performance.now();
  const current = sidebarLiquidMotion ? CabinetLiquid.sample(sidebarLiquidMotion,now,sidebarLiquidWidth) : sidebarLiquidState;
  if (!animate || sidebarIndicatorY === null) {
    sidebarIndicatorY = y;
    sidebarLiquidMotion = null;
    sidebarLiquidState = CabinetLiquid.resting(y+26,sidebarLiquidWidth);
    sidebarOutline.setAttribute('d',CabinetLiquid.path(sidebarLiquidState));
    return;
  }
  sidebarIndicatorY = y;
  let initial=current;
  // A completed transfer is represented by one source capsule again.
  if(initial.source.r<.03&&initial.head.r>0)initial={source:initial.head,head:{y:initial.head.y,r:0,length:0},neck:0};
  sidebarLiquidMotion = {initial,target:y+26,start:now,duration:620};
  if (!sidebarLiquidFrame) sidebarLiquidFrame = requestAnimationFrame(animateLiquidOutline);
}

function animateLiquidOutline(now) {
  sidebarLiquidFrame = 0;
  if(!sidebarLiquidMotion)return;
  sidebarLiquidState=CabinetLiquid.sample(sidebarLiquidMotion,now,sidebarLiquidWidth);
  sidebarOutline.setAttribute('d',CabinetLiquid.path(sidebarLiquidState));
  if (now < sidebarLiquidMotion.start + sidebarLiquidMotion.duration) {
    sidebarLiquidFrame = requestAnimationFrame(animateLiquidOutline);
  } else sidebarLiquidMotion=null;
}

if (sidebarIndicator) new ResizeObserver(([entry]) => {
  sidebarLiquidWidth = entry.contentRect.width;
  if (sidebarIndicatorY!==null) {
    sidebarLiquidState=sidebarLiquidMotion?CabinetLiquid.sample(sidebarLiquidMotion,performance.now(),sidebarLiquidWidth):CabinetLiquid.resting(sidebarIndicatorY+26,sidebarLiquidWidth);
    sidebarOutline.setAttribute('d',CabinetLiquid.path(sidebarLiquidState));
  }
}).observe(sidebarIndicator);

function syncSidebarActive() {
  const hash = window.location.hash || '#overview';
  const link = document.querySelector(`.sidebar-link[href="${hash}"]`);
  if (!link) return null;
  document.querySelectorAll('.sidebar-link').forEach((item) => item.classList.toggle('active', item === link));
  return link;
}

document.querySelectorAll('.sidebar-link').forEach((link) => {
  link.addEventListener('pointerenter', () => moveSidebarIndicator(link), { passive: true });
  link.addEventListener('focus', () => moveSidebarIndicator(link));
  link.addEventListener('click', () => {
    document.querySelectorAll('.sidebar-link').forEach((item) => item.classList.remove('active'));
    link.classList.add('active');
  });
});
document.querySelector('.sidebar-nav')?.addEventListener('pointerleave', () => moveSidebarIndicator(syncSidebarActive()));

window.addEventListener('hashchange', () => {
  const link = syncSidebarActive();
  if (link) moveSidebarIndicator(link);
});
window.addEventListener('resize', () => moveSidebarIndicator(document.querySelector('.sidebar-link.active'), false));
requestAnimationFrame(() => moveSidebarIndicator(syncSidebarActive(), false));

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

logoutButton.addEventListener('click', async () => {
  logoutButton.disabled = true;
  try {
    await fetch('/api/logout', { method: 'POST' });
  } finally {
    window.location.replace('/login');
  }
});

loadCurrentUser().catch(() => window.location.replace('/login'));
