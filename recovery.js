/* Inlined by tools/sync_site.py. This must not depend on config.js/script.js:
   address copying, image recovery and the map work if either request fails. */
(() => {
  'use strict';
  const node = document.getElementById('location-data');
  let location;
  try { location = JSON.parse(node.textContent); } catch { return; }
  const copy = document.querySelector('[data-copy-address]');
  const toast = document.getElementById('toast');
  let toastTimer;
  const notify = (text) => {
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 3500);
  };
  const copyText = async (text) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch { /* Use selection when permission is denied. */ }
    const field = document.createElement('textarea');
    field.value = text;
    field.readOnly = true;
    field.className = 'clipboard-helper';
    const previous = document.activeElement;
    (document.querySelector('dialog[open]') || document.body).appendChild(field);
    field.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { /* Report failure. */ }
    field.remove();
    previous?.focus({ preventScroll: true });
    return ok;
  };
  copy?.addEventListener('click', async () => {
    notify(await copyText(location.address.full)
      ? 'Endereço copiado. Vem pra Burdega!'
      : 'Não foi possível copiar. O endereço está logo ao lado.');
  });
})();

(() => {
  'use strict';
  const image = document.querySelector('.burger-art');
  const status = document.querySelector('[data-burger-status]');
  const message = document.querySelector('[data-burger-message]');
  const retry = document.querySelector('[data-retry-burger]');
  if (!image || !status || !message || !retry) return;
  const source = image.getAttribute('src');
  let generation = 0;
  let autoRetries = 0;
  let state = 'loading';
  let noticeTimer, slowTimer, retryTimer;
  const clearTimers = () => {
    clearTimeout(noticeTimer); clearTimeout(slowTimer); clearTimeout(retryTimer);
  };
  const setState = (next, text, offerRetry = false) => {
    state = next;
    image.dataset.mediaState = next;
    image.classList.toggle('media-pending', next !== 'ready');
    status.hidden = next === 'ready';
    message.textContent = text;
    retry.hidden = !offerRetry;
  };
  const pending = () => {
    clearTimers();
    state = 'loading';
    image.dataset.mediaState = state;
    image.classList.add('media-pending');
    status.hidden = true;
    retry.hidden = true;
    noticeTimer = setTimeout(() => setState('loading', 'Carregando imagem…'), 700);
    slowTimer = setTimeout(() => {
      setState('slow', 'A imagem está demorando para carregar.', true);
    }, 12000);
  };
  const attempt = () => {
    generation += 1;
    pending();
    // Cache-bust only explicit retries, never the normal optimized/preloaded URL.
    const url = new URL(source, document.baseURI);
    if (/^https?:$/.test(url.protocol)) url.searchParams.set('retry', `${Date.now()}-${generation}`);
    image.src = url.href;
  };
  const failed = () => {
    if (state === 'error' || state === 'retrying') return;
    clearTimers();
    if (navigator.onLine !== false && autoRetries < 1) {
      autoRetries += 1;
      setState('retrying', 'Tentando carregar a imagem novamente…');
      retryTimer = setTimeout(attempt, 1000);
    } else {
      setState('error', navigator.onLine === false
        ? 'Sem conexão para carregar a imagem.'
        : 'Não foi possível carregar a imagem.', true);
    }
  };
  const loaded = async () => {
    const current = generation;
    if (!image.complete) return;
    if (!image.naturalWidth) { failed(); return; }
    try { if (typeof image.decode === 'function') await image.decode(); }
    catch { if (current === generation) failed(); return; }
    if (current !== generation) return;
    clearTimers();
    const wasFocused = document.activeElement === retry;
    setState('ready', '');
    if (wasFocused && image.tabIndex >= 0) image.focus({ preventScroll: true });
  };
  image.addEventListener('load', loaded);
  image.addEventListener('error', failed);
  retry.addEventListener('click', () => { autoRetries = 0; attempt(); });
  window.addEventListener('online', () => {
    if (state === 'error' || state === 'slow') { autoRetries = 0; attempt(); }
  });
  pending();
  if (image.complete) loaded();
})();

(() => {
  'use strict';
  const frame = document.querySelector('.location-card-frame[data-map-src]');
  const host = document.querySelector('.location-map');
  const status = document.querySelector('[data-map-status]');
  const retry = document.querySelector('[data-retry-map]');
  if (!frame || !host || !status || !retry) return;
  frame.name = 'burdega-map';
  const url = frame.dataset.mapSrc;
  let timer;
  let observer;
  let started = false;
  let near = false;
  const describe = (state, text) => {
    host.dataset.mapState = state;
    host.setAttribute('aria-busy', String(state === 'loading'));
    status.textContent = text;
    status.hidden = !text;
  };
  const load = () => {
    clearTimeout(timer);
    started = true;
    if (navigator.onLine === false) {
      describe('offline', 'Sem conexão. Você pode recarregar o mapa quando voltar.');
      return;
    }
    describe('loading', 'Carregando mapa…');
    // Keep the exact pinned URL unchanged on every retry. Replacing the iframe
    // document reloads it without adding arbitrary Google query parameters.
    frame.loading = 'eager';
    frame.src = url;
    timer = setTimeout(() => {
      describe('slow', 'O mapa está demorando. Recarregue ou abra no Google Maps.');
    }, 12000);
  };
  frame.addEventListener('load', () => {
    if (!started || frame.getAttribute('src') === 'about:blank') return;
    // Ignore the initial about:blank event even if a navigation has just started.
    try { if (frame.contentWindow.location.href === 'about:blank') return; }
    catch { /* Cross-origin Google document: its content is intentionally opaque. */ }
    clearTimeout(timer);
    // A cross-origin iframe load is NOT proof of a valid map or loaded tiles.
    // Browsers also fire load on network error pages. Never report "map verified";
    // always retain the native reload link and external Maps link below the frame.
    describe('settled', '');
  });
  retry.addEventListener('click', (event) => {
    event.preventDefault();
    near = true;
    observer?.disconnect();
    load();
  });
  window.addEventListener('online', () => {
    if (near && ['offline', 'slow'].includes(host.dataset.mapState)) load();
  });
  window.addEventListener('offline', () => {
    if (host.dataset.mapState === 'loading') {
      clearTimeout(timer);
      describe('offline', 'Sem conexão. Você pode recarregar o mapa quando voltar.');
    }
  });
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        near = true;
        observer.disconnect();
        load();
      }
    }, { rootMargin: '150px 0px' });
    observer.observe(frame);
  } else { near = true; load(); }
})();
