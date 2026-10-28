// Wake the backend once per page visit. No periodic keep-alive traffic.
(() => {
  if (window.AlassterBackend) return;
  const scriptUrl = document.currentScript.src;
  const backend = window.AlassterBackend = { url: '', state: 'configuring' };
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
  const publish = state => {
    backend.state = state;
    window.dispatchEvent(new CustomEvent('alasster-backend-state', { detail: { state } }));
  };
  async function configuration(filename) {
    try {
      const response = await fetch(new URL(filename, scriptUrl), {
        cache: 'no-store', signal: AbortSignal.timeout(4000)
      });
      return response.ok ? await response.json() : null;
    } catch (_) { return null; }
  }
  backend.configReady = (async () => {
    if (location.port === '8010' || location.hostname.endsWith('.onrender.com')) {
      backend.url = location.origin;
    } else if (['localhost', '127.0.0.1'].includes(location.hostname)) {
      backend.url = 'http://127.0.0.1:8010';
    } else {
      const fixed = await configuration('backend-config.json');
      const settings = fixed?.url ? fixed : await configuration('cabinet_url.json');
      if (settings?.url) {
        try {
          const url = new URL(settings.url);
          if (url.protocol === 'https:' && !url.username && !url.password) backend.url = url.origin;
        } catch (_) {}
      }
    }
    if (backend.url) window.ALASSTER_CABINET_URL = backend.url;
    return backend.url;
  })();
  backend.ready = (async () => {
    const base = await backend.configReady;
    if (!base) { publish('unconfigured'); return false; }
    publish('waking');
    const deadline = Date.now() + 120000;
    while (Date.now() < deadline) {
      try {
        const response = await fetch(`${base}/health`, {
          credentials: 'omit', cache: 'no-store',
          signal: AbortSignal.timeout(Math.min(15000, Math.max(1, deadline - Date.now())))
        });
        if (response.ok && (await response.json()).ok === true) {
          publish('ready');
          return true;
        }
      } catch (_) {}
      if (Date.now() + 5000 >= deadline) break;
      await pause(5000);
    }
    publish('unavailable');
    return false;
  })();
  const refreshExamLinks = async () => {
    const base = await backend.configReady;
    if (!base) return;
    for (const anchor of document.querySelectorAll('a[href]')) {
      try {
        const oldUrl = new URL(anchor.href, location.href);
        const match = oldUrl.pathname.match(/^\/(?:generator\/)?exam\/([a-zA-Z0-9-]+)\/?$/);
        if (match) anchor.href = `${base}/generator/exam/${match[1]}${oldUrl.search}`;
      } catch (_) {}
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', refreshExamLinks, { once: true });
  else refreshExamLinks();
})();
