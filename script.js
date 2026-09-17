/* Enhancement only: primary links remain usable without JavaScript. */
(() => {
  'use strict';
  const config = window.BURDEGA_CONFIG || {};
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const toast = $('#toast');
  let toastTimer;
  const notify = (message) => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 3500);
  };
  // Accept HTTPS links only. Invalid configuration leaves the HTML fallback intact.
  const safeUrl = (value) => {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
    } catch { return null; }
  };
  $$('[data-link]').forEach((link) => {
    const url = safeUrl(config.links?.[link.dataset.link]);
    if (url) link.href = url;
  });
  // Load the public original logo only on a hosted page. The small supporting
  // SVG keeps the local preview independent of any external image service.
  if (config.logo?.loadRemoteWhenHosted && /^https?:$/.test(location.protocol)) {
    const url = safeUrl(config.logo.url);
    const host = $('.brand-mark');
    if (url && host) {
      const original = new Image();
      original.alt = '';
      original.width = 52; original.height = 52;
      original.className = 'logo-original';
      original.referrerPolicy = 'no-referrer';
      original.addEventListener('load', () => host.appendChild(original), { once: true });
      original.addEventListener('error', () => {}, { once: true });
      original.src = url;
    }
  }
  if (config.address?.short) $('[data-address]').textContent = config.address.short;
  $$('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });
  $$('[data-remote-logo]').forEach((img) => {
    const hideBroken = () => { if (!img.naturalWidth) img.hidden = true; };
    if (img.complete) hideBroken();
    else img.addEventListener('error', hideBroken, { once: true });
  });
  const copyText = async (text) => {
    if (!text) return false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch { /* The user may have denied clipboard permission. Try selection. */ }
    const field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0;';
    const parent = $('dialog[open]') || document.body;
    const previous = document.activeElement;
    parent.appendChild(field);
    field.select();
    let copied = false;
    try { copied = document.execCommand('copy'); } catch { copied = false; }
    field.remove();
    if (previous && typeof previous.focus === 'function') previous.focus();
    return copied;
  };
  // Native dialog provides modal focus handling and Escape support.
  const openDialog = (dialog) => {
    if (!dialog) return;
    if (typeof dialog.showModal === 'function') {
      if (!dialog.open) dialog.showModal();
    } else {
      notify('Seu navegador não suporta esta janela. Use os links de cardápio e WhatsApp.');
    }
  };
  $$('dialog').forEach((dialog) => {
    $$('[data-close-dialog]', dialog).forEach((button) => {
      button.addEventListener('click', () => dialog.close());
    });
    // Only dismiss when both ends of the gesture are outside the panel.
    let pointerStartedOutside = false;
    const outside = (event) => {
      const r = dialog.getBoundingClientRect();
      return event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom;
    };
    dialog.addEventListener('pointerdown', (event) => { pointerStartedOutside = outside(event); });
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog && pointerStartedOutside && outside(event)) dialog.close();
      pointerStartedOutside = false;
    });
  });
  const hours = config.openingHours || {};
  if (hours.confirmed === true && Array.isArray(hours.days) && hours.days.length) {
    const host = $('#hours-content');
    host.replaceChildren();
    const list = document.createElement('ul');
    list.className = 'schedule-list';
    hours.days.forEach((entry) => {
      if (!entry || typeof entry.label !== 'string' || typeof entry.hours !== 'string') return;
      const row = document.createElement('li');
      const label = document.createElement('span');
      const time = document.createElement('strong');
      label.textContent = entry.label;
      time.textContent = entry.hours;
      row.append(label, time);
      list.appendChild(row);
    });
    host.appendChild(list);
    const note = document.createElement('p');
    note.className = 'muted';
    note.textContent = 'Feriados e datas especiais podem ter horários diferentes. Confirme com a gente.';
    host.appendChild(note);
  } else if (typeof hours.notice === 'string' && hours.notice) {
    $('#hours-content p').textContent = hours.notice;
  }
  $$('[data-open-hours]').forEach((button) => {
    button.addEventListener('click', () => openDialog($('#hours-dialog')));
  });
  $$('[data-copy-address]').forEach((button) => {
    button.addEventListener('click', async () => {
      const address = config.address?.full || 'Rua Padre José Alves, 105, Centro, Várzea Alegre - CE';
      notify(await copyText(address) ? 'Endereço copiado. Vem pra Burdega!' : 'Não foi possível copiar. O endereço está logo ao lado.');
    });
  });
  // Never share a local filesystem path or a developer localhost address.
  const currentShareUrl = () => {
    const configured = safeUrl(config.share?.publishedUrl);
    if (configured) return configured;
    const localNames = ['localhost', '127.0.0.1', '[::1]'];
    if (location.protocol === 'https:' && !localNames.includes(location.hostname)) {
      const url = new URL(location.href);
      url.search = ''; url.hash = '';
      return url.href;
    }
    return null;
  };
  $$('[data-share]').forEach((button) => {
    button.addEventListener('click', async () => {
      const url = currentShareUrl();
      if (url && typeof navigator.share === 'function') {
        try {
          await navigator.share({ title: config.share?.title || document.title, text: config.share?.text || 'Vem de Burdega! 🍔', url });
          return;
        } catch (error) {
          if (error?.name === 'AbortError') return;
        }
      }
      const field = $('#share-url');
      const copy = $('#copy-link');
      if (!url) {
        $('#share-help').textContent = 'Esta é uma prévia local. Depois de publicar o site em HTTPS, este botão compartilhará o endereço da sua página.';
        field.hidden = true;
        copy.hidden = true;
      } else {
        $('#share-help').textContent = 'Copie o link e mande para quem vai pedir com você.';
        field.hidden = false; copy.hidden = false; field.value = url;
      }
      openDialog($('#share-dialog'));
    });
  });
  $('#copy-link')?.addEventListener('click', async () => {
    const field = $('#share-url');
    if (await copyText(field.value)) {
      $('#share-dialog').close();
      notify('Link copiado. Chama a galera!');
    } else {
      field.focus(); field.select();
      $('#share-help').textContent = 'Seu navegador bloqueou a cópia. O link foi selecionado: copie manualmente.';
    }
  });
  // The compact order bar appears after the illustrated welcome card leaves the screen.
  const primary = $('.poster');
  const dock = $('.mobile-dock');
  if (primary && dock && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      const pastPrimary = entry.boundingClientRect.bottom < 0;
      dock.classList.toggle('is-visible', !entry.isIntersecting && pastPrimary);
      dock.setAttribute('aria-hidden', String(!pastPrimary));
      const link = $('a', dock);
      if (link) link.tabIndex = pastPrimary ? 0 : -1;
    }, { threshold: 0 });
    observer.observe(primary);
  }
})();

/* Continuous scrolling for the existing red ribbon only. */
(() => {
  'use strict';
  const ribbon = document.querySelector('.ticker');
  const original = ribbon?.querySelector('.ticker-content');
  if (!ribbon || !original || ribbon.querySelector('.ticker-track')) return;

  const description = ribbon.getAttribute('aria-label') || original.textContent.trim();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const track = document.createElement('div');
  track.className = 'ticker-track';
  track.style.cssText = 'display:flex;width:max-content;max-width:none;';
  original.style.flex = '0 0 auto';
  original.style.minWidth = '0';
  original.style.justifyContent = 'flex-start';
  ribbon.replaceChild(track, original);
  track.appendChild(original);
  ribbon.tabIndex = 0;
  ribbon.style.outlineOffset = '-5px';

  let animation = null;
  let userPaused = false;
  let hovered = false;
  let inView = true;
  let signature = '';
  let frame = 0;
  const manualMode = () => reducedMotion.matches || typeof track.animate !== 'function';
  const updatePlayback = () => {
    if (animation) {
      if (userPaused || hovered || !inView || document.hidden) animation.pause();
      else animation.play();
    }
    if (!manualMode()) {
      const action = userPaused ? 'Retomar' : 'Pausar';
      ribbon.setAttribute('role', 'button');
      ribbon.setAttribute('aria-label', `${action} rolagem da faixa. ${description}.`);
      ribbon.title = `${action} rolagem: toque ou pressione Enter.`;
    }
  };

  const layout = () => {
    frame = 0;
    const manual = manualMode();
    const gap = parseFloat(getComputedStyle(original).columnGap) || 0;
    // Half a gap at each edge makes the boundary identical to every other gap.
    original.style.paddingInline = `${gap / 2}px`;
    const width = parseFloat(getComputedStyle(original).width);
    const viewport = ribbon.clientWidth;
    if (!Number.isFinite(width) || width <= 0 || viewport <= 0) return;
    const next = `${width}|${viewport}|${gap}|${manual}`;
    if (next === signature) return;
    signature = next;

    const progress = animation?.effect.getComputedTiming().progress || 0;
    animation?.cancel();
    animation = null;
    track.replaceChildren(original);
    ribbon.scrollLeft = 0;
    ribbon.style.overflowX = manual ? 'auto' : 'hidden';
    ribbon.style.scrollbarWidth = 'none';
    ribbon.style.cursor = manual ? 'auto' : 'pointer';
    track.style.willChange = manual ? 'auto' : 'transform';

    if (manual) {
      ribbon.setAttribute('role', 'region');
      ribbon.setAttribute('aria-label', `${description}. Deslize para ver todos os itens.`);
      ribbon.title = 'Deslize para ver todos os itens.';
      return;
    }

    // Enough identical groups for a seamless loop, including very wide screens.
    const copies = Math.ceil(viewport / width) + 1;
    for (let i = 0; i < copies; i += 1) {
      const copy = original.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      copy.setAttribute('inert', '');
      track.appendChild(copy);
    }
    const duration = width / 36 * 1000; // Constant, readable speed: 36 CSS px/s.
    animation = track.animate(
      [{ transform: 'translateX(0)' }, { transform: `translateX(-${width}px)` }],
      { duration, iterations: Infinity, easing: 'linear' }
    );
    animation.currentTime = progress * duration;
    updatePlayback();
  };
  const scheduleLayout = () => {
    if (!frame) frame = requestAnimationFrame(layout);
  };
  const toggle = () => {
    if (manualMode()) return;
    userPaused = !userPaused;
    updatePlayback();
  };
  ribbon.addEventListener('click', toggle);
  ribbon.addEventListener('keydown', (event) => {
    if (!manualMode() && !event.repeat && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      toggle();
    }
  });
  ribbon.addEventListener('pointerenter', (event) => {
    if (event.pointerType === 'mouse') { hovered = true; updatePlayback(); }
  });
  ribbon.addEventListener('pointerleave', () => { hovered = false; updatePlayback(); });
  document.addEventListener('visibilitychange', updatePlayback);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      updatePlayback();
    }).observe(ribbon);
  }
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(scheduleLayout);
    observer.observe(ribbon);
    observer.observe(original);
  } else {
    window.addEventListener('resize', scheduleLayout, { passive: true });
  }
  if (typeof reducedMotion.addEventListener === 'function') {
    reducedMotion.addEventListener('change', scheduleLayout);
  } else {
    reducedMotion.addListener(scheduleLayout);
  }
  document.fonts?.ready.then(scheduleLayout);
  layout();
})();
