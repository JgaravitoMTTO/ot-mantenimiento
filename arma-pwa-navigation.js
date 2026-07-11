/* A.R.M.A. PWA - NAVEGACION INTERNA V04.2 PUBLIC EXTERNAL BROWSER */
(function () {
  'use strict';

  const APP_SCOPE_PATH = '/ot-mantenimiento/';
  const RETURN_MAIN_KEY = 'ARMA_PWA_RETURN_MAIN';
  const LAST_INTERNAL_KEY = 'ARMA_PWA_LAST_INTERNAL_URL';

  function isStandalone() {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.startsWith('android-app://')
    );
  }

  function resolveUrl(value) {
    try {
      return new URL(String(value || ''), window.location.href);
    } catch (error) {
      return null;
    }
  }

  function isInternalAppUrl(url) {
    return Boolean(
      url &&
      url.origin === window.location.origin &&
      url.pathname.startsWith(APP_SCOPE_PATH)
    );
  }

  function isMainUrl(url) {
    if (!url) return false;

    return (
      url.pathname === APP_SCOPE_PATH ||
      url.pathname === `${APP_SCOPE_PATH}main.html` ||
      url.pathname.endsWith('/main.html')
    );
  }

  function markInternalNavigation(url) {
    try {
      sessionStorage.setItem(LAST_INTERNAL_KEY, window.location.href);

      if (isMainUrl(url)) {
        sessionStorage.setItem(RETURN_MAIN_KEY, '1');
      }
    } catch (error) {}
  }

  function navigateInternal(value) {
    const url = resolveUrl(value);
    if (!isStandalone() || !isInternalAppUrl(url)) return false;

    markInternalNavigation(url);
    window.location.assign(url.href);
    return true;
  }

  const nativeWindowOpen = window.open.bind(window);

  window.open = function armaPwaWindowOpen(url, target, features) {
    if (url && navigateInternal(url)) {
      return window;
    }

    return nativeWindowOpen(url, target, features);
  };

  document.addEventListener(
    'click',
    function armaPwaInternalClick(event) {
      if (!isStandalone()) return;
      if (event.button !== 0) return;
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;

      const anchor = event.target.closest('a[href]');
      if (!anchor) return;
      if (anchor.classList.contains('arma-locked')) return;
      if (anchor.hasAttribute('download')) return;

      const rawHref = String(anchor.getAttribute('href') || '').trim();

      // CONOCER A.R.M.A.: abre el destino en un contexto nativo nuevo,
      // sin pasarlo por la navegacion interna de la PWA.
      if (anchor.hasAttribute('data-arma-browser')) {
        if (!rawHref) return;

        const browserUrl = resolveUrl(rawHref);
        if (!browserUrl) return;

        event.preventDefault();
        event.stopImmediatePropagation();

        const browserWindow = nativeWindowOpen(
          browserUrl.href,
          '_blank',
          'noopener,noreferrer'
        );

        if (browserWindow) {
          try {
            browserWindow.opener = null;
            browserWindow.focus();
          } catch (error) {}
        }

        return;
      }

      if (
        !rawHref ||
        rawHref.startsWith('#') ||
        rawHref.startsWith('javascript:') ||
        rawHref.startsWith('mailto:') ||
        rawHref.startsWith('tel:')
      ) {
        return;
      }

      const url = resolveUrl(rawHref);
      if (!isInternalAppUrl(url)) return;

      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search &&
        url.hash
      ) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
      markInternalNavigation(url);
      window.location.assign(url.href);
    },
    true
  );

  document.addEventListener(
    'submit',
    function armaPwaInternalForm(event) {
      if (!isStandalone()) return;

      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;

      const url = resolveUrl(form.getAttribute('action') || window.location.href);
      if (!isInternalAppUrl(url)) return;

      markInternalNavigation(url);
      form.removeAttribute('target');
    },
    true
  );

  window.ARMA_PWA_NAV = Object.freeze({
    isStandalone,
    isInternalAppUrl: value => isInternalAppUrl(resolveUrl(value)),
    navigateInternal,
    markInternalNavigation: value => {
      const url = resolveUrl(value);
      if (isInternalAppUrl(url)) markInternalNavigation(url);
    }
  });
})();
