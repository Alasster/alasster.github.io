if (!window.__alassterAnalyticsLoaded) {
  window.__alassterAnalyticsLoaded = true;

  const gtagScript = document.createElement('script');
  gtagScript.async = true;
  gtagScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-6TE8X9CWLL';
  document.head.appendChild(gtagScript);

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }

  gtag('js', new Date());
  gtag('config', 'G-6TE8X9CWLL');
}
