/**
 * ALASSTER.SITE — Auth Bridge & Neumorphic Auth Button
 * Links index.html and all lesson pages to Личный кабинет authentication
 */

(function() {
  const PUBLIC_BACKEND_FALLBACK = 'https://alasster-cabinet.onrender.com';

  try {
    fetch('/скрипты/backend-config.json')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d && d.url) window.ALASSTER_CABINET_URL = d.url; })
      .catch(() => {});
  } catch (e) {}

  function getCabinetBaseUrl() {
    if (window.AlassterBackend?.url) return window.AlassterBackend.url;
    // If running on port 8010, same origin
    if (window.location.port === '8010') return '';
    // If local development, points to the cabinet port 8010
    if (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') {
      return 'http://127.0.0.1:8010';
    }
    // If running on HTTPS public domain (e.g. alasster.site)
    if (window.location.protocol === 'https:') {
      // If user provided a custom tunnel endpoint, use it, else cloud tunnel
      return window.ALASSTER_CABINET_URL || PUBLIC_BACKEND_FALLBACK;
    }
    return 'http://127.0.0.1:8010';
  }

  function getStoredUser() {
    try {
      const raw = localStorage.getItem('alasster_auth_user');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function setStoredUser(user) {
    try {
      if (user) {
        localStorage.setItem('alasster_auth_user', JSON.stringify(user));
        localStorage.setItem('alasster_logged_in', '1');
      } else {
        localStorage.removeItem('alasster_auth_user');
        localStorage.removeItem('alasster_logged_in');
      }
    } catch (e) {}
  }

  // Parse returning user from redirect query parameter
  function checkUrlUserPayload() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('alasster_user')) {
        const b64 = urlParams.get('alasster_user');
        let user = null;
        try {
          user = JSON.parse(decodeURIComponent(atob(b64)));
        } catch (e1) {
          try {
            user = JSON.parse(atob(b64.replace(/-/g, '+').replace(/_/g, '/')));
          } catch (e2) {}
        }
        if (user && (user.username || user.display_name)) {
          setStoredUser(user);
        }
        urlParams.delete('alasster_user');
        const cleanSearch = urlParams.toString();
        const cleanUrl = window.location.pathname + (cleanSearch ? '?' + cleanSearch : '') + window.location.hash;
        window.history.replaceState({}, '', cleanUrl);
      }
    } catch (e) {}
  }

  async function checkServerSession() {
    if (window.AlassterBackend && !(await window.AlassterBackend.ready)) return getStoredUser();
    const base = getCabinetBaseUrl();
    // On a separate Render domain, authentication happens on its own page.
    // The cached name here is display-only; all permissions stay server-side.
    if (location.protocol === 'https:' && new URL(base || location.origin, location.href).origin !== location.origin) return getStoredUser();
    if (window.location.protocol === 'https:' && base.startsWith('http://')) {
      return getStoredUser();
    }
    try {
      const res = await fetch(`${base}/api/me`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        const user = await res.json();
        setStoredUser(user);
        return user;
      } else if (res.status === 401) {
        setStoredUser(null);
        return null;
      }
    } catch (e) {
      // Offline / server not reachable: rely on localStorage
    }
    return getStoredUser();
  }

  async function performLogout() {
    const base = getCabinetBaseUrl();
    if (location.protocol === 'https:' && new URL(base || location.origin, location.href).origin !== location.origin) {
      setStoredUser(null);
      renderAuthButton(null);
      location.assign(`${base}/logout?return_to=${encodeURIComponent(location.href)}`);
      return;
    }
    if (!base.startsWith('http://') || window.location.protocol !== 'https:') {
      try {
        await fetch(`${base}/api/logout`, {
          method: 'POST',
          credentials: 'include'
        });
      } catch (e) {}
    }
    setStoredUser(null);
    renderAuthButton(null);
  }

  function renderAuthButton(user) {
    const container = document.getElementById('auth-nav-container');
    if (!container) return;

    const base = getCabinetBaseUrl();
    const currentUrl = window.location.href;
    // Always pass force=1 so clicking login opens auth.html cleanly
    const loginUrl = `${base}/login?force=1&return_to=${encodeURIComponent(currentUrl)}`;
    const cabinetUrl = `${base}/`;
    const generatorUrl = `${base}/generator/teacher`;

    if (user) {
      let displayName = user.display_name;
      if (!displayName && (user.first_name || user.last_name)) {
        displayName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
      }
      if (!displayName) displayName = user.username || 'Пользователь';

      let roleLabel = 'УЧЕНИК';
      if (user.role === 'superadmin') {
        roleLabel = 'СУПЕР-АДМИН';
      } else if (user.role === 'admin') {
        roleLabel = 'АДМИНИСТРАТОР';
      } else if (user.role === 'teacher') {
        roleLabel = 'УЧИТЕЛЬ';
      } else if (user.role === 'user') {
        roleLabel = 'УЧЕНИК';
      }

      const initials = getUserInitials(user, displayName);

      container.innerHTML = `
        <div class="neu-auth-wrapper">
          <button type="button" class="neu-auth-btn is-logged" id="neu-auth-trigger" aria-haspopup="true" aria-expanded="false" aria-label="Профиль: ${escapeHtml(displayName)}" title="Профиль: ${escapeHtml(displayName)}">
            <span class="neu-auth-avatar neu-auth-initials" aria-hidden="true">${escapeHtml(initials)}</span>
          </button>
          <div class="neu-auth-dropdown" id="neu-auth-dropdown">
            <div class="neu-auth-dropdown-header">
              <div class="neu-auth-dropdown-name">${escapeHtml(displayName)}</div>
              <div class="neu-auth-dropdown-role">${roleLabel}</div>
            </div>
            <a href="${cabinetUrl}" class="neu-auth-dropdown-item">
              <i class="fa-solid fa-user"></i>
              <span>Личный кабинет</span>
            </a>
            <div class="neu-auth-dropdown-divider"></div>
            <button type="button" class="neu-auth-dropdown-item neu-auth-logout-btn" id="neu-logout-btn">
              <i class="fa-solid fa-arrow-right-from-bracket"></i>
              <span>Выйти из аккаунта</span>
            </button>
          </div>
        </div>
      `;

      const trigger = document.getElementById('neu-auth-trigger');
      const dropdown = document.getElementById('neu-auth-dropdown');
      const logoutBtn = document.getElementById('neu-logout-btn');

      if (trigger && dropdown) {
        trigger.addEventListener('click', (e) => {
          e.stopPropagation();
          const isOpen = dropdown.classList.contains('is-open');
          dropdown.classList.toggle('is-open', !isOpen);
          trigger.setAttribute('aria-expanded', String(!isOpen));
        });
      }

      if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
          e.preventDefault();
          logoutBtn.disabled = true;
          logoutBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i><span>Выход...</span>';
          await performLogout();
        });
      }
    } else {
      container.innerHTML = `
        <div class="neu-auth-wrapper">
          <a href="${loginUrl}" class="neu-auth-btn" id="neu-auth-trigger" aria-label="Войти в личный кабинет" title="Войти в личный кабинет">
            <span class="neu-auth-avatar neu-auth-login-mark" aria-hidden="true"><i class="fa-solid fa-user"></i></span>
          </a>
        </div>
      `;
    }
  }

  function getUserInitials(user, name) {
    if (user && user.first_name && user.last_name) {
      const f = String(user.first_name).trim();
      const l = String(user.last_name).trim();
      if (f && l) return (f[0] + l[0]).toUpperCase();
    }
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
    if (parts.length === 1 && parts[0].length >= 2) return parts[0].slice(0, 2).toUpperCase();
    if (parts.length === 1 && parts[0].length === 1) return parts[0].toUpperCase();
    return '??';
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Close dropdown on outside click or Escape
  document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('neu-auth-dropdown');
    const trigger = document.getElementById('neu-auth-trigger');
    if (dropdown && dropdown.classList.contains('is-open')) {
      if (!dropdown.contains(e.target) && !trigger?.contains(e.target)) {
        dropdown.classList.remove('is-open');
        trigger?.setAttribute('aria-expanded', 'false');
      }
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const dropdown = document.getElementById('neu-auth-dropdown');
      const trigger = document.getElementById('neu-auth-trigger');
      if (dropdown && dropdown.classList.contains('is-open')) {
        dropdown.classList.remove('is-open');
        trigger?.setAttribute('aria-expanded', 'false');
        trigger?.focus();
      }
    }
  });

  function ensureAuthContainer() {
    let authContainer = document.getElementById('auth-nav-container');
    const navbar = document.querySelector('.navbar');
    const container = navbar?.closest('.container');
    if (!container || !navbar) return;

    container.classList.add('nav-header-bar');

    if (!authContainer) {
      authContainer = document.createElement('div');
      authContainer.id = 'auth-nav-container';
      authContainer.className = 'nav-auth-external';
      navbar.after(authContainer);
    } else if (navbar.contains(authContainer)) {
      authContainer.className = 'nav-auth-external';
      navbar.after(authContainer);
    }
  }

  // Initialize
  async function initAuthWidget() {
    if (window.AlassterBackend) await window.AlassterBackend.configReady;
    ensureAuthContainer();
    checkUrlUserPayload();
    // Render immediate optimistic state from localStorage
    const localUser = getStoredUser();
    renderAuthButton(localUser);

    // Validate with server session asynchronously
    const serverUser = await checkServerSession();
    if (JSON.stringify(serverUser) !== JSON.stringify(localUser)) {
      renderAuthButton(serverUser);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuthWidget);
  } else {
    initAuthWidget();
  }

  window.AlassterAuth = {
    render: renderAuthButton,
    logout: performLogout,
    getUser: getStoredUser
  };
})();
