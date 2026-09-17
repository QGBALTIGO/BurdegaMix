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
  // The official header logo is local and declared directly in the HTML.
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
