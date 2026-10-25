(() => {
  const prefix = '/generator';
  const nativeFetch = window.fetch.bind(window);
  const nativeEventSource = window.EventSource;

  function rewriteUrl(value) {
    const url = new URL(value, window.location.href);
    if (url.origin === window.location.origin && (
      url.pathname === '/api'
      || url.pathname.startsWith('/api/')
      || url.pathname.startsWith('/static/')
    )) {
      url.pathname = `${prefix}${url.pathname}`;
    }
    return url;
  }

  window.fetch = (input, init) => {
    if (input instanceof Request) {
      const originalUrl = new URL(input.url);
      const url = rewriteUrl(input.url);
      return nativeFetch(url.pathname === originalUrl.pathname ? input : new Request(url, input), init);
    }
    const url = rewriteUrl(input);
    return nativeFetch(url.href, init);
  };

  window.EventSource = class extends nativeEventSource {
    constructor(url, options) {
      super(rewriteUrl(url).href, options);
    }
  };

  window.addEventListener('message', (event) => {
    if (event.origin === window.location.origin && event.data?.type === 'cabinet-theme') {
      document.documentElement.dataset.theme = event.data.theme === 'dark' ? 'dark' : 'light';
    }
  });
})();
