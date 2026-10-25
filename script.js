/* =========================================================
   Eric Jay Gonzales — Portfolio (vanilla JS, no dependencies)
   1. Theme  2. Loading screen  3. Sidebar  4. Page routing
   ========================================================= */
(() => {
  'use strict';

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  const root = document.documentElement;
  const body = document.body;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

  const store = {
    get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch (e) {} }
  };

  /* ---------- Footer / loader year ---------- */
  $$('.js-year').forEach((el) => { el.textContent = new Date().getFullYear(); });

  /* ---------- 1. Theme ---------- */
  const themeBtn = $('#themeBtn');
  const themeLabel = $('#themeLabel');

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    themeBtn.setAttribute('aria-pressed', String(theme === 'dark'));
    themeLabel.textContent = theme === 'dark' ? 'Dark mode' : 'Light mode';
  }

  applyTheme(root.getAttribute('data-theme') || 'light');

  themeBtn.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    store.set('theme', next);
  });

  // Follow the device theme until the visitor picks one manually
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!store.get('theme')) applyTheme(e.matches ? 'dark' : 'light');
  });

  /* ---------- 3. Sidebar (collapse on desktop, drawer on phones) ---------- */
  const app = $('#app');
  const main = $('#main');
  const topbar = $('#topbar');
  const sidebar = $('#sidebar');
  const collapseBtn = $('#collapseBtn');
  const menuBtn = $('#menuBtn');
  const closeBtn = $('#closeBtn');
  const scrim = $('#scrim');
  const phone = matchMedia('(max-width: 767.98px)');

  function setCollapsed(collapsed, persist = true) {
    root.classList.toggle('is-collapsed', collapsed);
    collapseBtn.setAttribute('aria-expanded', String(!collapsed));
    collapseBtn.setAttribute('aria-label', collapsed ? 'Expand sidebar' : 'Collapse sidebar');
    if (persist) store.set('sidebar', collapsed ? 'collapsed' : 'expanded');
  }

  // Saved choice wins; otherwise start as a slim rail on tablets
  const savedSidebar = store.get('sidebar');
  setCollapsed(savedSidebar ? savedSidebar === 'collapsed' : window.innerWidth < 1024, false);

  collapseBtn.addEventListener('click', () => setCollapsed(!root.classList.contains('is-collapsed')));

  let lastFocus = null;

  function openMenu() {
    lastFocus = document.activeElement;
    body.classList.add('is-menu-open');
    menuBtn.setAttribute('aria-expanded', 'true');
    main.inert = true;
    topbar.inert = true;
    closeBtn.focus();
  }

  function closeMenu(restoreFocus = true) {
    if (!body.classList.contains('is-menu-open')) return;
    body.classList.remove('is-menu-open');
    menuBtn.setAttribute('aria-expanded', 'false');
    main.inert = false;
    topbar.inert = false;
    if (restoreFocus && lastFocus) lastFocus.focus();
  }

  menuBtn.addEventListener('click', openMenu);
  closeBtn.addEventListener('click', () => closeMenu());
  scrim.addEventListener('click', () => closeMenu());
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
  phone.addEventListener('change', (e) => { if (!e.matches) closeMenu(false); });
  $$('.nav__link, .brand', sidebar).forEach((a) => a.addEventListener('click', () => closeMenu(false)));

  /* ---------- 4. Page routing (hash based, back button works) ---------- */
  const pages = ['about', 'projects', 'stack', 'contact'];
  const titles = { about: 'About me', projects: 'Projects', stack: 'Stack', contact: 'Contact' };
  const navLinks = $$('.nav__link');

  function showPage(page, focusHeading = true) {
    if (!pages.includes(page)) page = 'about';

    pages.forEach((p) => { $('#page-' + p).hidden = p !== page; });
    navLinks.forEach((a) => {
      if (a.dataset.page === page) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });

    document.title = titles[page] + ' — Eric Jay Gonzales';
    window.scrollTo(0, 0);
    if (focusHeading) $('#page-' + page + ' h1').focus({ preventScroll: true });
  }

  const currentPage = () => location.hash.replace('#', '') || 'about';

  window.addEventListener('hashchange', () => { showPage(currentPage()); closeMenu(false); });
  showPage(currentPage(), false);

  /* ---------- 2. Loading screen ---------- */
  const loader = $('#loader');
  const countEl = $('#count');
  const enterBtn = $('#enterBtn');
  const statusEl = $('#loaderStatus');

  function finishLoader() {
    loader.hidden = true;
    body.classList.remove('is-loading');
    app.inert = false;
    const heading = $('#page-' + currentPage() + ' h1');
    if (heading) heading.focus({ preventScroll: true });
  }

  // Deep links (e.g. /#projects) skip the intro
  if (location.hash && pages.includes(currentPage())) {
    app.inert = false;
    loader.hidden = true;
    body.classList.remove('is-loading');
  } else {
    app.inert = true;

    const duration = reduceMotion.matches ? 600 : 2600;
    const startTime = performance.now();
    const ease = (t) => (t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

    const tick = (now) => {
      const t = Math.min((now - startTime) / duration, 1);
      const pct = Math.round(ease(t) * 100);
      countEl.textContent = pct;
      loader.style.setProperty('--p', pct / 100);
      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        statusEl.textContent = 'Ready';
        enterBtn.disabled = false;
        enterBtn.focus({ preventScroll: true });
      }
    };
    requestAnimationFrame(tick);

    enterBtn.addEventListener('click', () => {
      enterBtn.disabled = true;
      body.classList.remove('is-loading');
      app.inert = false;
      loader.classList.add('is-leaving');
      // animationend normally fires; the timeout is a safety net
      const done = () => { clearTimeout(fallback); if (!loader.hidden) finishLoader(); };
      const fallback = setTimeout(done, 2200);
      loader.addEventListener('animationend', done, { once: true });
    });
  }
})();