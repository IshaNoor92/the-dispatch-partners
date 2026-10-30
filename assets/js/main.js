/* The Dispatch Partners — site scripts */
(function () {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const gbp = (n) => '£' + n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Footer year ---------- */
  $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  /* ---------- Dark / light theme ---------- */
  // The <head> applies a saved "light" choice before first paint; this keeps the switch and the browser chrome in step.
  const root = document.documentElement;
  const themeToggle = $('#themeToggle');
  const themeMeta = $('meta[name="theme-color"]');
  const applyTheme = (theme) => {
    root.setAttribute('data-theme', theme);
    if (themeMeta) themeMeta.setAttribute('content', theme === 'light' ? '#f6f4ef' : '#07080c');
    if (themeToggle) themeToggle.setAttribute('aria-label', theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
  };
  applyTheme(root.getAttribute('data-theme') === 'light' ? 'light' : 'dark');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      applyTheme(next);
      try { localStorage.setItem('tdp-theme', next); } catch (e) { /* storage blocked: the choice lasts for this page only */ }
    });
  }

  /* ---------- Sticky header + back to top ---------- */
  const header = $('#header');
  const backTop = $('#backTop');
  const onScroll = () => {
    const y = window.scrollY;
    if (header) header.classList.toggle('is-scrolled', y > 8);
    if (backTop) backTop.classList.toggle('is-visible', y > 600);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if (backTop) backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' }));

  /* ---------- Mobile nav ---------- */
  const nav = $('#nav');
  const toggle = $('#navToggle');
  if (nav && toggle) {
    const backdrop = document.createElement('div');
    backdrop.className = 'nav-backdrop';
    document.body.appendChild(backdrop);
    const setOpen = (open) => {
      nav.classList.toggle('is-open', open);
      backdrop.classList.toggle('is-visible', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.style.overflow = open ? 'hidden' : '';
    };
    toggle.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
    backdrop.addEventListener('click', () => setOpen(false));
    $$('a', nav).forEach((a) => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
    window.addEventListener('resize', () => { if (window.innerWidth > 1000) setOpen(false); });
  }

  /* ---------- Reveal on scroll, counters, bars ---------- */
  const animateCount = (el) => {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    if (reducedMotion || !target) return;
    const start = performance.now();
    const dur = 1200;
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * eased).toFixed(decimals);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const revealEls = $$('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add('is-visible');
        $$('[data-count]', el).forEach(animateCount);
        $$('.bar__fill', el).forEach((b) => { b.style.width = b.dataset.width + '%'; });
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
    $$('.bar__fill').forEach((b) => { b.style.width = b.dataset.width + '%'; });
  }

  /* ---------- Pricing calculator ---------- */
  const calc = $('#calcForm');
  if (calc) {
    const RATES = {
      small: 1.5,        // Letter, Large Letter, Small Parcel
      medium: 2.0,
      storageCuft: 0.3,
      storageUnitMin: 0.05,
      returnSmall: 1.5,
      returnMedium: 2.0,
      label: 0.1,
      hour: 18.0,
      vat: 0.2,
    };
    const num = (id) => {
      const v = parseFloat($('#' + id).value);
      return Number.isFinite(v) && v > 0 ? v : 0;
    };
    const update = () => {
      const fulfil = (num('c-letter') + num('c-large') + num('c-small')) * RATES.small + num('c-medium') * RATES.medium;
      // Storage: pay whichever is higher — volume charge or the per-unit floor, never both
      const storage = Math.max(num('c-cuft') * RATES.storageCuft, num('c-units') * RATES.storageUnitMin);
      const returns = num('c-returns-sm') * RATES.returnSmall + num('c-returns-md') * RATES.returnMedium;
      const extra = num('c-labels') * RATES.label + num('c-hours') * RATES.hour;
      const net = fulfil + storage + returns + extra;
      const vat = net * RATES.vat;
      $('#r-fulfil').textContent = gbp(fulfil);
      $('#r-storage').textContent = gbp(storage);
      $('#r-returns').textContent = gbp(returns);
      $('#r-extra').textContent = gbp(extra);
      $('#r-vat').textContent = gbp(vat);
      $('#r-total').textContent = gbp(net + vat);
      $('#r-note').textContent = gbp(net) + ' ex VAT · excluding postage';
      const cta = $('#calcCta');
      if (cta) cta.href = 'contact.html?estimate=' + encodeURIComponent(gbp(net));
    };
    calc.addEventListener('input', update);
    calc.addEventListener('submit', (e) => e.preventDefault());
    update();

    const helper = $('#cuftHelper');
    $('#cuftHelp').addEventListener('click', () => {
      helper.hidden = !helper.hidden;
      if (!helper.hidden) $('#u-l').focus();
    });
    $('#cuftApply').addEventListener('click', () => {
      const l = num('u-l'), w = num('u-w'), h = num('u-h');
      if (!l || !w || !h) { $('#u-l').focus(); return; }
      const CM3_PER_CUFT = 28316.8466;
      const units = num('c-units') || 1;
      $('#c-cuft').value = ((l * w * h * units) / CM3_PER_CUFT).toFixed(1);
      helper.hidden = true;
      update();
    });
  }

  /* ---------- Quote form ---------- */
  const form = $('#quoteForm');
  if (!form) return;

  const steps = $$('.form-step', form);
  const progress = $$('[data-progress]');
  const prevBtn = $('#prevBtn');
  const nextBtn = $('#nextBtn');
  const submitBtn = $('#submitBtn');
  const errorBox = $('#formError');
  let current = 0;

  // Prefill from the pricing calculator
  const estimate = new URLSearchParams(location.search).get('estimate');
  if (estimate && /^£[\d,.]+$/.test(estimate)) {
    const msg = $('#message');
    msg.value = `My calculator estimate was ${estimate}/month ex VAT (excluding postage).`;
  }

  const patterns = {
    email: /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i,
    url: /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/\S*)?$/i,
  };
  const validPhone = (v) => {
    const d = v.replace(/[\s\-().]/g, '');
    return /^(?:\+44|0044|0)\d{9,10}$/.test(d) || /^\+\d{8,15}$/.test(d);
  };

  const fieldOf = (el) => el.closest('.field');

  const validateField = (el) => {
    const field = fieldOf(el);
    if (!field) return true;
    const v = el.value.trim();
    let ok = true;

    if (el.type === 'radio') {
      ok = !el.required || !!form.querySelector(`input[name="${el.name}"]:checked`);
    } else if (el.type === 'checkbox') {
      ok = !el.required || el.checked;
    } else if (el.required && !v) {
      ok = false;
    } else if (v) {
      if (el.minLength > 0 && v.length < el.minLength) ok = false;
      if (el.type === 'email' && !patterns.email.test(v)) ok = false;
      if (el.dataset.validate === 'phone' && !validPhone(v)) ok = false;
      if (el.dataset.validate === 'url' && !patterns.url.test(v)) ok = false;
      if (el.type === 'number') {
        const n = parseFloat(v);
        if (!Number.isFinite(n) || (el.min !== '' && n < +el.min) || (el.max !== '' && n > +el.max)) ok = false;
      }
    }

    // A field may hold several inputs (dimensions, radios); it is valid only if all are
    const siblings = $$('input, select, textarea', field).filter((s) => s !== el && s.type !== 'radio' && s.type !== 'checkbox');
    const othersOk = siblings.every((s) => !s.dataset.invalid);
    el.dataset.invalid = ok ? '' : '1';
    const fieldOk = ok && othersOk;

    field.classList.toggle('has-error', !fieldOk);
    field.classList.toggle('is-valid', fieldOk && !!v && el.type !== 'radio' && el.type !== 'checkbox');
    el.setAttribute('aria-invalid', String(!ok));
    return ok;
  };

  const validateStep = (i) => {
    const inputs = $$('input, select, textarea', steps[i]).filter((el) => el.type !== 'hidden');
    const seenRadio = new Set();
    let firstBad = null;
    inputs.forEach((el) => {
      if (el.type === 'radio') {
        if (seenRadio.has(el.name)) return;
        seenRadio.add(el.name);
      }
      if (!validateField(el) && !firstBad) firstBad = el;
    });
    if (firstBad) firstBad.focus({ preventScroll: false });
    return !firstBad;
  };

  // Live validation once the user has touched a field
  form.addEventListener('blur', (e) => {
    const el = e.target;
    if (el.matches('input:not([type=radio]):not([type=checkbox]), select, textarea') && el.value.trim()) validateField(el);
  }, true);
  form.addEventListener('input', (e) => {
    const el = e.target;
    if (fieldOf(el) && fieldOf(el).classList.contains('has-error')) validateField(el);
  });
  form.addEventListener('change', (e) => {
    const el = e.target;
    if (el.type === 'radio' || el.type === 'checkbox' || el.tagName === 'SELECT') {
      if (fieldOf(el) && fieldOf(el).classList.contains('has-error')) validateField(el);
    }
  });

  const msg = $('#message');
  const msgCount = $('#msgCount');
  const updateCount = () => { msgCount.textContent = msg.value.length; };
  msg.addEventListener('input', updateCount);
  updateCount();

  const LABELS = {
    name: 'Name', company: 'Business', email: 'Email', phone: 'Phone', website: 'Website',
    'channels[]': 'Sells on', products: 'Products', orders_per_day: 'Orders / day', skus: 'SKUs',
    parcel_format: 'Parcel format', unit_dims: 'Unit size', unit_weight_kg: 'Unit weight',
    start_date: 'Start', 'services[]': 'Services', current_fulfilment: 'Currently', message: 'Notes',
  };

  const buildSummary = () => {
    const data = new FormData(form);
    const rows = [];
    const add = (key, value) => { if (value) rows.push([LABELS[key], value]); };
    Object.keys(LABELS).forEach((key) => {
      if (key === 'unit_dims') {
        const dims = ['unit_length_cm', 'unit_width_cm', 'unit_height_cm'].map((k) => data.get(k)).filter(Boolean);
        if (dims.length === 3) add(key, dims.join(' × ') + ' cm');
        return;
      }
      if (key.endsWith('[]')) { add(key, data.getAll(key).join(', ')); return; }
      let v = (data.get(key) || '').toString().trim();
      if (key === 'unit_weight_kg' && v) v += ' kg';
      if (key === 'message' && v.length > 140) v = v.slice(0, 140) + '…';
      add(key, v);
    });
    const dl = $('#formSummary dl');
    dl.innerHTML = '';
    rows.forEach(([k, v]) => {
      const dt = document.createElement('dt'); dt.textContent = k;
      const dd = document.createElement('dd'); dd.textContent = v;
      dl.append(dt, dd);
    });
  };

  const showStep = (i) => {
    steps.forEach((s, idx) => s.classList.toggle('is-active', idx === i));
    progress.forEach((p, idx) => {
      p.classList.toggle('is-active', idx === i);
      p.classList.toggle('is-done', idx < i);
    });
    prevBtn.hidden = i === 0;
    nextBtn.hidden = i === steps.length - 1;
    submitBtn.hidden = i !== steps.length - 1;
    if (i === steps.length - 1) buildSummary();
    errorBox.classList.remove('is-visible');
    current = i;
    const card = form.closest('.form-card');
    if (card.getBoundingClientRect().top < 0) card.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    const firstInput = $('input:not([type=hidden]), select, textarea', steps[i]);
    if (firstInput && i > 0) setTimeout(() => firstInput.focus({ preventScroll: true }), 50);
  };

  nextBtn.addEventListener('click', () => { if (validateStep(current)) showStep(current + 1); });
  prevBtn.addEventListener('click', () => showStep(current - 1));

  // Enter on a text input moves to the next step instead of submitting early
  form.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT' && current < steps.length - 1) {
      e.preventDefault();
      nextBtn.click();
    }
  });

  const showError = (text) => {
    errorBox.innerHTML = '';
    errorBox.append(text + ' ');
    const a = document.createElement('a');
    a.href = 'mailto:contact@thedispatchpartners.com';
    a.textContent = 'contact@thedispatchpartners.com';
    errorBox.append('You can also email us at ', a, '.');
    errorBox.classList.add('is-visible');
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    for (let i = 0; i < steps.length; i++) {
      if (!validateStep(i)) { showStep(i); validateStep(i); return; }
    }
    if (form.querySelector('[name="bot-field"]').value) return;

    submitBtn.disabled = true;
    submitBtn.classList.add('is-loading');
    $('.btn-label', submitBtn).textContent = 'Sending…';

    const body = new URLSearchParams(new FormData(form)).toString();
    const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.protocol === 'file:';

    try {
      if (isLocal) {
        // Netlify Forms only exists once deployed; simulate success locally
        console.info('[quote form] local preview — submission not sent:', Object.fromEntries(new URLSearchParams(body)));
        await new Promise((r) => setTimeout(r, 700));
      } else {
        const res = await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body,
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
      }
      $('#successEmail').textContent = $('#email').value.trim();
      form.hidden = true;
      $('.progress').hidden = true;
      $('.form-card__head').hidden = true;
      const success = $('#formSuccess');
      success.classList.add('is-visible');
      success.focus();
    } catch (err) {
      console.error(err);
      showError("Sorry, your enquiry didn't send. Please try again in a moment.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.classList.remove('is-loading');
      $('.btn-label', submitBtn).textContent = 'Send enquiry';
    }
  });
})();
