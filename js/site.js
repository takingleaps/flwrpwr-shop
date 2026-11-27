/* FLWRPWR reference build: shop fixture + motion. Vanilla, no dependencies. */
(() => {
  const doc = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- products (status mirrors the current site: 3 reservable, 3 coming soon) ---------- */
  const STRAINS = [
    { name: 'Thai Stick', vibe: 'hybrid', slug: 'thai-stick', ready: true },
    { name: 'Maui Wowie', vibe: 'sativa', slug: 'maui-wowie', ready: true },
    { name: 'Northern Lights', vibe: 'indica', slug: 'northern-lights', ready: true },
    { name: 'Acapulco Gold', vibe: 'hybrid', slug: 'acapulco-gold', ready: false },
    { name: 'Trainwreck', vibe: 'sativa', slug: 'trainwreck', ready: false },
    { name: 'Afghani', vibe: 'indica', slug: 'afghani', ready: false },
  ];
  const label = v => v[0].toUpperCase() + v.slice(1);
  const BUDS = ['thai-stick', 'maui-wowie', 'northern-lights'];
  const state = { type: 'flower', filter: 'all' };
  const grid = $('[data-grid]');

  function render() {
    const list = STRAINS.filter(s => state.filter === 'all' || s.vibe === state.filter);
    const flower = state.type === 'flower';
    grid.innerHTML = list.map((s, i) => {
      const img = flower ? `assets/real-pouch-${s.slug}.webp?v=2` : `assets/real-box-${s.slug}.webp`;
      const pair = flower ? `assets/real-box-${s.slug}.webp` : `assets/real-pouch-${s.slug}.webp?v=2`;
      const ready = flower && s.ready;
      const meta = flower ? `4g Smalls · ${label(s.vibe)}` : `Pre-roll pack · ${label(s.vibe)}`;
      // flower shows the pouch on its own; boxes belong to pre-rolls only
      const combo = flower
        ? `<div class="slide solo"><img class="card-main" src="${img}" alt="FLWRPWR ${s.name} 4g pouch" loading="lazy"></div>`
        : `<div class="slide"><img class="card-pair" src="${pair}" alt="" loading="lazy"><img class="card-main" src="${img}" alt="FLWRPWR ${s.name} pre-roll box" loading="lazy"></div>`;
      const boxPhoto = `<div class="slide"><img class="card-photo" src="assets/photo-box-${s.slug}.webp" alt="FLWRPWR ${s.name} box" loading="lazy"></div>`;
      const bud = BUDS.includes(s.slug) ? `<div class="slide"><img class="card-photo" src="assets/card-bud-${s.slug}.webp" alt="${s.name} flower up close" loading="lazy"></div>` : '';
      const slides = flower ? [combo, bud].filter(Boolean) : [boxPhoto, combo];
      const nav = `<button class="card-arrow prev" type="button" aria-label="Previous photo of ${s.name}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button><button class="card-arrow next" type="button" aria-label="Next photo of ${s.name}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button><span class="card-dots" aria-hidden="true">${slides.map((_, k) => `<i${k ? '' : ' class="on"'}></i>`).join('')}</span>`;
      return `<article class="card ${s.vibe}${flower ? '' : ' preroll'}" style="--i:${i}" data-tilt>
        <div class="card-img has-slides${flower ? '' : ' is-photo'}" data-slides>${ready ? '' : '<span class="card-flag">Coming soon</span>'}${slides.join('')}${nav}</div>
        <h4>${s.name}</h4><span class="meta">${meta}</span>
        ${ready
          ? `<button class="btn btn-pink" type="button" data-reserve="${s.name}" data-burst>Reserve</button>`
          : `<a class="btn btn-outline soon" href="#join">Notify me</a>`}
      </article>`;
    }).join('');
    $('[data-shop-title] span').textContent = flower ? 'Premium Flower' : 'Cannabis Pre-rolls';
    $('[data-shop-meta]').textContent = flower ? '4g smalls · 6 flavors · 3 vibes' : 'Premium flower · 6 flavors · launch status to confirm';
    bindTilt($$('[data-tilt]', grid));
    $$('[data-slides]', grid).forEach(box => show(box, 0));
  }

  /* ---------- card photos: arrows at the edges, tap the photo, or swipe ---------- */
  function show(box, n) {
    const slides = $$('.slide', box), dots = $$('.card-dots i', box);
    const k = (n + slides.length) % slides.length;
    box.dataset.at = k;
    slides.forEach((el, j) => el.classList.toggle('on', j === k));
    dots.forEach((el, j) => el.classList.toggle('on', j === k));
  }
  const step = (box, d) => show(box, +(box.dataset.at || 0) + d);
  let sx = null, sy = null, swiped = false;
  grid.addEventListener('pointerdown', e => { swiped = false; if (e.target.closest('[data-slides]')) { sx = e.clientX; sy = e.clientY; } }, { passive: true });
  grid.addEventListener('pointerup', e => {
    const box = e.target.closest('[data-slides]');
    if (box && sx !== null) {
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { swiped = true; step(box, dx < 0 ? 1 : -1); }
    }
    sx = null;
  }, { passive: true });
  grid.addEventListener('click', e => {
    const box = e.target.closest('[data-slides]'); if (!box) return;
    if (swiped) { swiped = false; return; }
    step(box, e.target.closest('.card-arrow.prev') ? -1 : 1);
  });

  $$('.shop-toggle [data-type]').forEach(b => b.addEventListener('click', () => {
    state.type = b.dataset.type;
    $$('.shop-toggle [data-type]').forEach(x => x.setAttribute('aria-selected', String(x === b)));
    render();
  }));
  function setFilter(f) {
    state.filter = f;
    $$('.chips [data-filter]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.filter === f)));
    render();
  }
  $$('.chips [data-filter]').forEach(b => b.addEventListener('click', () => setFilter(b.dataset.filter)));
  $$('[data-vibe]').forEach(a => a.addEventListener('click', () => setFilter(a.dataset.vibe)));
  $('[data-shop-all]').addEventListener('click', () => { state.type = 'flower'; $$('.shop-toggle [data-type]').forEach(x => x.setAttribute('aria-selected', String(x.dataset.type === 'flower'))); setFilter('all'); });

  /* sample reserve list (preview only) */
  let count = 0;
  const cartBtn = $('[data-cart]'), toast = $('[data-toast]');
  let toastTimer;
  function say(msg) { toast.textContent = msg; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2400); }
  grid.addEventListener('click', e => {
    const b = e.target.closest('[data-reserve]');
    if (!b) return;
    count++;
    $('[data-cart-count]').textContent = count;
    cartBtn.setAttribute('aria-label', `Reserve list, ${count} items`);
    cartBtn.classList.remove('bump'); void cartBtn.offsetWidth; cartBtn.classList.add('bump');
    say(`${b.dataset.reserve} added to your reserve list (preview)`);
  });
  cartBtn.addEventListener('click', () => say(count ? `${count} item${count > 1 ? 's' : ''} on your reserve list (preview)` : 'Your reserve list is empty'));

  /* join form is handled by the live signup.js (Supabase) */

  /* ---------- rotating photos: arrows, tap the photo, swipe, or the dots under it; pauses on hover or off screen ---------- */
  const CHEV = d => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  $$('[data-rotate]').forEach(fig => {
    const imgs = $$('img', fig), dots = $$('.rot-dots button', fig);
    if (imgs.length < 2) return;
    let at = 0, timer = null, seen = false, hover = false;
    const go = n => {
      at = (n + imgs.length) % imgs.length;
      imgs.forEach((im, j) => { im.classList.toggle('on', j === at); if (j === (at + 1) % imgs.length || j === (at - 1 + imgs.length) % imgs.length) im.loading = 'eager'; });
      dots.forEach((d, j) => { d.classList.toggle('on', j === at); d.setAttribute('aria-current', j === at ? 'true' : 'false'); });
    };
    const tick = () => { clearTimeout(timer); if (!reduce && seen && !hover && !document.hidden) timer = setTimeout(() => { go(at + 1); tick(); }, 5000); };
    const step = (n, e) => { if (e) e.stopPropagation(); go(at + n); tick(); };
    const mk = (cls, label, d, n) => {
      const btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'rot-arrow ' + cls; btn.setAttribute('aria-label', label); btn.innerHTML = CHEV(d);
      btn.addEventListener('click', e => step(n, e));
      fig.appendChild(btn);
    };
    mk('prev', 'Previous photo', 'M15 5l-7 7 7 7', -1);
    mk('next', 'Next photo', 'M9 5l7 7-7 7', 1);
    dots.forEach((d, j) => d.addEventListener('click', e => { e.stopPropagation(); go(j); tick(); }));
    fig.addEventListener('click', e => { if (!e.target.closest('button')) step(1); });
    let sx = null, sy0 = 0;
    fig.addEventListener('pointerdown', e => { sx = e.clientX; sy0 = e.clientY; }, { passive: true });
    fig.addEventListener('pointerup', e => {
      if (sx === null) return;
      const dx = e.clientX - sx, dy = e.clientY - sy0; sx = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { fig.dataset.swiped = '1'; step(dx < 0 ? 1 : -1); setTimeout(() => delete fig.dataset.swiped, 50); }
    });
    fig.addEventListener('click', e => { if (fig.dataset.swiped) e.stopImmediatePropagation(); }, true);
    fig.addEventListener('mouseenter', () => { hover = true; tick(); });
    fig.addEventListener('mouseleave', () => { hover = false; tick(); });
    document.addEventListener('visibilitychange', tick);
    new IntersectionObserver(es => es.forEach(e => { seen = e.isIntersecting; tick(); }), { threshold: 0.3 }).observe(fig);
    go(0);
  });

  /* ---------- font tester for the client review: open the site with ?fonts to show it (free Google Fonts, OFL, self-hosted in fonts/test) ---------- */
  (function fontTester() {
    let on = /[?&#]fonts\b/.test(location.search + location.hash);
    try { if (on) sessionStorage.setItem('flwr-fonts-on', '1'); else on = sessionStorage.getItem('flwr-fonts-on') === '1'; } catch (e) {}
    if (!on) return;
    const HEAD = [
      ['', 'Playfair (now)', '"FLWR Playfair",Georgia,serif'],
      ['Fraunces', 'Fraunces', 'ital,wght@0,400;0,600;0,700;1,600'],
      ['Lora', 'Lora', 'ital,wght@0,400;0,600;0,700;1,600'],
      ['DM Serif Display', 'DM Serif Display', 'ital@0;1'],
      ['Cormorant Garamond', 'Cormorant', 'wght@500;600;700'],
      ['Marcellus', 'Marcellus', ''],
      ['Quicksand', 'Quicksand', 'wght@500;600;700'],
      ['Shrikhand', 'Shrikhand', '']
    ];
    const BODY = [
      ['', 'Red Hat (now)', '"FLWR Red Hat",system-ui,sans-serif'],
      ['Nunito', 'Nunito', 'wght@400;600;700;800;900'],
      ['Quicksand', 'Quicksand', 'wght@500;600;700'],
      ['DM Sans', 'DM Sans', 'wght@400;500;700;900'],
      ['Outfit', 'Outfit', 'wght@400;500;700;800'],
      ['Karla', 'Karla', 'wght@400;600;700;800']
    ];
    let loaded = false;
    const load = () => {
      if (loaded) return; loaded = true;
      const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'css/font-tester.css';
      document.head.appendChild(l);
    };
    const stack = (row, serif) => row[0] ? `"${row[0]}",${serif ? 'Georgia,serif' : 'system-ui,sans-serif'}` : row[2];
    const set = (kind, row) => {
      if (row[0]) load();
      if (kind === 'head') { if (row[0]) doc.style.setProperty('--display', stack(row, true)); else doc.style.removeProperty('--display'); }
      else ['--body', '--label'].forEach(v => row[0] ? doc.style.setProperty(v, stack(row, false)) : doc.style.removeProperty(v));
      try { sessionStorage.setItem('flwr-font-' + kind, row[0]); } catch (e) {}
      $$(`.ft-opts[data-kind="${kind}"] button`, box).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.f === row[0])));
    };
    const box = document.createElement('div');
    box.className = 'ft';
    const opts = (kind, rows, serif) => `<div class="ft-opts" data-kind="${kind}">${rows.map(r => `<button type="button" data-f="${r[0]}" style="font-family:${stack(r, serif).replace(/"/g, '\x27')}">${r[1]}</button>`).join('')}</div>`;
    box.innerHTML = `<button class="ft-toggle" type="button" aria-expanded="false"><b>Aa</b> Try fonts</button>
      <div class="ft-panel" hidden><p class="ft-h">Headings</p>${opts('head', HEAD, true)}<p class="ft-h">Body and labels</p>${opts('body', BODY, false)}<button class="ft-reset" type="button">Back to current fonts</button></div>`;
    document.body.appendChild(box);
    const panel = $('.ft-panel', box), tog = $('.ft-toggle', box);
    tog.addEventListener('click', () => {
      const open = panel.hidden; panel.hidden = !open; tog.setAttribute('aria-expanded', String(open));
      if (open) load();
    });
    box.addEventListener('click', e => {
      const b = e.target.closest('.ft-opts button');
      if (b) { const kind = b.parentElement.dataset.kind; set(kind, (kind === 'head' ? HEAD : BODY).find(r => r[0] === b.dataset.f)); }
      if (e.target.closest('.ft-reset')) { set('head', HEAD[0]); set('body', BODY[0]); }
    });
    let h = '', bd = '';
    try { h = sessionStorage.getItem('flwr-font-head') || ''; bd = sessionStorage.getItem('flwr-font-body') || ''; } catch (e) {}
    set('head', HEAD.find(r => r[0] === h) || HEAD[0]);
    set('body', BODY.find(r => r[0] === bd) || BODY[0]);
  })();

  /* ---------- light / dark theme ---------- */
  const themeBtn = $('[data-theme-toggle]');
  const syncThemeLabel = () => themeBtn.setAttribute('aria-label', doc.dataset.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  syncThemeLabel();
  themeBtn.addEventListener('click', () => {
    doc.dataset.theme = doc.dataset.theme === 'dark' ? 'light' : 'dark';
    try { sessionStorage.setItem('flwr-theme', doc.dataset.theme); } catch (e) {}
    syncThemeLabel();
  });

  /* ---------- newspaper editions popup ---------- */
  const eds = $('[data-editions]');
  let edReturn = null;
  const edClose = () => { eds.hidden = true; if (edReturn) edReturn.focus(); };
  $$('[data-editions-open]').forEach(b => b.addEventListener('click', () => { edReturn = b; eds.hidden = false; $('[data-editions-close]').focus(); }));
  $('[data-editions-close]').addEventListener('click', edClose);
  eds.addEventListener('click', e => { if (e.target === eds) edClose(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !eds.hidden) edClose(); });

  /* ---------- drawer ---------- */
  const drawer = $('[data-drawer]'), openBtn = $('[data-menu-open]');
  const close = () => { drawer.hidden = true; openBtn.setAttribute('aria-expanded', 'false'); openBtn.focus(); };
  openBtn.addEventListener('click', () => { drawer.hidden = false; openBtn.setAttribute('aria-expanded', 'true'); $('[data-menu-close]').focus(); });
  $('[data-menu-close]').addEventListener('click', close);
  drawer.addEventListener('click', e => { if (e.target === drawer || e.target.matches('[data-menu-link]')) close(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !drawer.hidden) close(); });

  /* ---------- italic accent word in primary titles ---------- */
  $$('.title, .subtitle span').forEach(el => {
    const node = [...el.childNodes].find(n => n.nodeType === 3 && n.textContent.trim().split(/\s+/).length > 1);
    if (!node) return;
    const words = node.textContent.trim().split(/\s+/), last = words.pop();
    const em = document.createElement('em'); em.textContent = last;
    node.textContent = words.join(' ') + ' ';
    node.after(em);
  });

  /* ---------- curved vibe labels ---------- */
  $$('.vibe-name.arc').forEach(el => {
    const t = el.textContent.trim(), n = t.length, mid = (n - 1) / 2;
    el.setAttribute('aria-label', t);
    el.innerHTML = [...t].map((c, i) => { const k = (i - mid) / mid; return `<span aria-hidden="true" style="--arc:${(k * k * 7).toFixed(1)}px;--rot:${(k * 9).toFixed(1)}deg">${c}</span>`; }).join('');
  });

  /* ---------- best sellers carousel: dots + drag, no arrows ---------- */
  const track = $('[data-carousel]'), dots = $('[data-dots]');
  const cards = $$('.best-card', track);
  dots.innerHTML = cards.map((_, i) => `<button type="button" aria-label="Show best seller ${i + 1}"${i ? '' : ' aria-current="true"'}></button>`).join('');
  const dotBtns = $$('button', dots);
  dotBtns.forEach((d, i) => d.addEventListener('click', () => track.scrollTo({ left: cards[i].offsetLeft - (track.clientWidth - cards[i].offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' })));
  track.addEventListener('scroll', () => {
    const c = track.scrollLeft + track.clientWidth / 2;
    let best = 0, dist = Infinity;
    cards.forEach((card, i) => { const d = Math.abs(card.offsetLeft + card.offsetWidth / 2 - c); if (d < dist) { dist = d; best = i; } });
    dotBtns.forEach((d, i) => d.setAttribute('aria-current', String(i === best)));
  }, { passive: true });
  let drag = null;
  track.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; drag = { x: e.clientX, s: track.scrollLeft }; track.classList.add('dragging'); });
  addEventListener('pointermove', e => { if (drag) track.scrollLeft = drag.s - (e.clientX - drag.x); });
  addEventListener('pointerup', () => { if (drag) { drag = null; track.classList.remove('dragging'); } });
  if (!reduce) {
    let auto = setInterval(() => {
      if (track.scrollWidth <= track.clientWidth + 4 || document.hidden) return;
      const i = dotBtns.findIndex(d => d.getAttribute('aria-current') === 'true');
      track.scrollTo({ left: cards[(i + 1) % cards.length].offsetLeft - (track.clientWidth - cards[0].offsetWidth) / 2, behavior: 'smooth' });
    }, 3800);
    ['pointerdown', 'focusin', 'wheel', 'touchstart'].forEach(ev => track.addEventListener(ev, () => clearInterval(auto), { once: true, passive: true }));
  }

  /* ---------- ticker duplicate for seamless loop ---------- */
  const tick = $('[data-ticker]');
  tick.innerHTML += tick.innerHTML;

  /* ---------- flowers and petals riding on the rainbow dividers (call 23:17) ---------- */
  const RB_COLORS = ['#f4a3c6', '#f9c6dc', '#cdb8f6', '#ffe29a', '#ffffff'];
  $$('[data-rainbow]').forEach((rb, n) => {
    const layer = document.createElement('div');
    layer.className = 'rb-flowers';
    let html = '';
    for (let i = 0; i < 9; i++) {
      const x = (i * 11.5 + (n * 7) % 9 + 2).toFixed(1);
      const y = 10 + ((i * 37 + n * 13) % 60);
      if (i % 3 === 1) {
        html += `<i class="rbp" style="--x:${x}%;--y:${y}%;--s:${12 + (i % 3) * 3}px;--c:${RB_COLORS[(i + n) % 5]};--t:${3 + (i % 4)}s;--d:-${i * .4}s"></i>`;
      } else {
        html += `<span class="rbf" style="--x:${x}%;--y:${y}%;--s:${18 + ((i + n) % 3) * 8}px;--c:${RB_COLORS[(i + n) % 4]};--t:${3.5 + (i % 3)}s;--d:-${i * .5}s;--r:${14 + i * 2}s"><svg><use href="#i-daisy"/></svg></span>`;
      }
    }
    layer.innerHTML = html;
    rb.appendChild(layer);
  });

  render();

  /* ---------- v2: one ribbon at a time. If two dividers end up stacked (section order), keep the first ---------- */
  function dedupeRibbons() {
    let prev = null;
    $$('[data-rainbow]').forEach(rb => {
      rb.classList.toggle('rb-dupe', false);
      const r = rb.getBoundingClientRect();
      if (prev && r.height && Math.abs(r.top - prev.bottom) < 60) rb.classList.toggle('rb-dupe', true);
      else prev = r;
    });
  }
  addEventListener('load', dedupeRibbons);
  setTimeout(dedupeRibbons, 600);

  if (reduce) { $$('[data-reveal]').forEach(el => el.classList.add('in')); return; }

  /* ---------- petals ---------- */
  const COLORS = ['#fde3ee', '#f9b9d6', '#ffffff', '#fff1b8', '#e3d3fd'];
  $$('[data-petals]').forEach(box => {
    const n = +box.dataset.petals;
    for (let i = 0; i < n; i++) {
      const p = document.createElement('i');
      p.className = 'petal';
      p.style.cssText = `--x:${(i / n * 100 + Math.random() * 6).toFixed(1)}%;--s:${(10 + Math.random() * 9).toFixed(0)}px;--t:${(9 + Math.random() * 7).toFixed(1)}s;--d:${(-Math.random() * 14).toFixed(1)}s;--c:${COLORS[i % COLORS.length]}`;
      box.appendChild(p);
    }
  });

  /* ---------- reveal on scroll ---------- */
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
  }), { rootMargin: '0px 0px -8% 0px' });
  $$('[data-reveal]').forEach(el => {
    const sib = [...el.parentElement.children].filter(c => c.hasAttribute('data-reveal'));
    el.style.setProperty('--rd', `${Math.min(sib.indexOf(el), 5) * 0.08}s`);
    io.observe(el);
  });

  /* ---------- scroll: hero parallax, header shadow, wave speed from velocity ---------- */
  const head = $('[data-head]'), logo = $('[data-hero-logo]'), heroEl = $('[data-hero]');
  const par = $$('[data-parallax]');
  const waves = $$('[data-rainbow] .silk-set');
  let lastY = scrollY, vel = 0, ticking = false, pending = $$('[data-reveal]');
  function frame() {
    ticking = false;
    const y = scrollY;
    vel = vel * 0.8 + (y - lastY) * 0.2; lastY = y;
    head.classList.toggle('scrolled', y > 8);
    head.classList.toggle('past-hero', y > (heroEl ? heroEl.offsetHeight - head.offsetHeight - 24 : 8));
    const h = innerHeight;
    if (logo && y < h * 1.2) logo.style.transform = `translateY(${y * 0.28}px) scale(${1 - Math.min(y / h, 1) * 0.12})`;
    par.forEach(el => {
      const r = el.parentElement.getBoundingClientRect();
      if (r.bottom < -100 || r.top > h + 100) return;
      el.style.transform = `translate3d(0,${((r.top + r.height / 2) - h / 2) * -(+el.dataset.parallax)}px,0)`;
    });
    // Anything already scrolled past (fast flicks, anchor jumps) is revealed so nothing stays blank above the fold.
    pending = pending.filter(el => {
      if (el.classList.contains('in')) return false;
      if (el.getBoundingClientRect().top < h * 0.92) { el.classList.add('in'); io.unobserve(el); return false; }
      return true;
    });
  }
  /* ---------- ribbons flow on their own, a gentle drift that picks up speed while you scroll ---------- */
  let drift = 0, lastT = performance.now();
  const live = new Set();
  const rio = new IntersectionObserver(es => es.forEach(en => en.isIntersecting ? live.add(en.target) : live.delete(en.target)), { rootMargin: '200px 0px' });
  waves.forEach(w => rio.observe(w));
  const SILK = [0.42, 0.9, 0.62, 1.25];
  // Each strand is its own layer that only slides (transform), so the browser never repaints the ribbon while it moves.
  const geo = new Map();
  const measure = () => waves.forEach(w => geo.set(w, { cw: w.clientWidth || 1, h: w.clientHeight || 92, dir: w.closest('.flip') ? -1 : 1, layers: [...w.children] }));
  measure(); addEventListener('resize', measure, { passive: true });
  function flow(t) {
    const dt = Math.min(t - lastT, 64) / 1000; lastT = t;
    vel *= 0.94;
    drift += dt * (34 + Math.min(Math.abs(vel), 60) * 5);
    if (live.size) {
      const y = scrollY, sway = 3 + Math.min(Math.abs(vel), 40) * 0.35;
      waves.forEach((w, i) => {
        if (!live.has(w)) return;
        const g = geo.get(w); if (!g) return;
        const { cw, h, dir, layers } = g, u = cw / 1200, sy = y * dir;
        const base = -(drift * dir + i * cw * 0.37), bob = Math.sin(t / 1300 + i * 1.7) * 3;
        layers.forEach((L, k) => {
          const j = ['st3', 'st1', 'st2', 'st4'].indexOf(L.classList[1]);
          const p = sy * SILK[j] + drift * (j - 1.5) * 0.4 + i * 211;
          const x = (((base + p * u) % cw) + cw) % cw;
          const q = Math.sin(t / 1700 + sy / 260 + j * 1.9) * sway * h / 120 + bob;
          L.style.transform = `translate3d(${x.toFixed(1)}px,${q.toFixed(1)}px,0)`;
        });
      });
    }
    requestAnimationFrame(flow);
  }
  requestAnimationFrame(flow);

  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
  frame();

  /* ---------- gentle tilt on cards ---------- */
  function bindTilt(els) {
    if (!fine) return;
    els.forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(800px) rotateX(${(-y * 6).toFixed(2)}deg) rotateY(${(x * 8).toFixed(2)}deg) translateY(-4px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }
  bindTilt($$('[data-tilt]'));

  /* ---------- petal burst on key actions ---------- */
  function burst(x, y) {
    for (let i = 0; i < 12; i++) {
      const p = document.createElement('i');
      p.className = 'burst-petal';
      const a = (i / 12) * Math.PI * 2, d = 40 + Math.random() * 50;
      p.style.cssText = `left:${x}px;top:${y}px;background:${COLORS[i % COLORS.length === 2 ? 1 : i % COLORS.length]};--bx:${Math.cos(a) * d}px;--by:${Math.sin(a) * d + 20}px;--br:${Math.random() * 360}deg`;
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 950);
    }
  }
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-burst]');
    if (t) burst(e.clientX || t.getBoundingClientRect().left + t.offsetWidth / 2, e.clientY || t.getBoundingClientRect().top);
  });

  /* ---------- daisy cursor (mouse/trackpad only; native again on keyboard use and form fields) ---------- */
  if (fine) {
    const cur = $('[data-cursor]');
    let tx = -100, ty = -100, cx = -100, cy = -100, rot = 0;
    addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      doc.classList.add('has-cursor');
      tx = e.clientX; ty = e.clientY;
      cur.classList.toggle('big', !!e.target.closest('a,button,[data-tilt]'));
      const field = e.target.closest('input,textarea,select');
      cur.style.opacity = field ? '0' : '';
    }, { passive: true });
    addEventListener('keydown', e => { if (e.key === 'Tab') doc.classList.remove('has-cursor'); });
    document.addEventListener('mouseleave', () => doc.classList.remove('has-cursor'));
    (function loop() {
      const dx = tx - cx, dy = ty - cy;
      cx += dx * 0.22; cy += dy * 0.22;
      rot += Math.hypot(dx, dy) * 0.6 + 0.4;
      cur.style.transform = `translate3d(${cx}px,${cy}px,0) rotate(${rot % 360}deg)`;
      requestAnimationFrame(loop);
    })();
    let lastTrail = 0;
    addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      const now = performance.now();
      if (now - lastTrail < 140) return;
      lastTrail = now;
      const p = document.createElement('i');
      p.className = 'burst-petal';
      p.style.cssText = `left:${e.clientX}px;top:${e.clientY}px;background:${COLORS[(now / 90 | 0) % COLORS.length]};--bx:${(Math.random() - .5) * 30}px;--by:${20 + Math.random() * 30}px;--br:${Math.random() * 360}deg;opacity:.8`;
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 950);
    }, { passive: true });
  }
})();
