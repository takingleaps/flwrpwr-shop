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
  const state = { type: 'flower', filter: 'all' };
  const grid = $('[data-grid]');

  function render() {
    const list = STRAINS.filter(s => state.filter === 'all' || s.vibe === state.filter);
    const flower = state.type === 'flower';
    grid.innerHTML = list.map((s, i) => {
      const img = flower ? `assets/real-pouch-${s.slug}.webp` : `assets/real-box-${s.slug}.webp`;
      const ready = flower && s.ready;
      const meta = flower ? `4g Smalls · ${label(s.vibe)}` : `Pre-roll pack · ${label(s.vibe)}`;
      return `<article class="card ${s.vibe}${flower ? '' : ' preroll'}" style="--i:${i}" data-tilt>
        <div class="card-img">${ready ? '' : '<span class="card-flag">Coming soon</span>'}<img src="${img}" alt="FLWRPWR ${s.name} ${flower ? '4g pouch' : 'pre-roll box'}" loading="lazy"></div>
        <h4>${s.name}</h4><span class="meta">${meta}</span>
        ${ready
          ? `<button class="btn btn-pink" type="button" data-reserve="${s.name}" data-burst>Reserve</button>`
          : `<a class="btn btn-outline soon" href="#join">Notify me</a>`}
      </article>`;
    }).join('');
    $('[data-shop-title] span').textContent = flower ? 'Premium Flower' : 'Cannabis Pre-rolls';
    $('[data-shop-meta]').textContent = flower ? '4g smalls · 6 flavors · 3 vibes' : 'Premium flower · 6 flavors · launch status to confirm';
    bindTilt($$('[data-tilt]', grid));
  }

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

  $('[data-join]').addEventListener('submit', e => { e.preventDefault(); e.target.hidden = true; $('[data-join-done]').hidden = false; });

  /* ---------- font review picker: Lora / Fraunces / Quicksand / Marcellus (all free Google Fonts, OFL) ---------- */
  const pick = $('[data-font-pick]');
  const applyFont = f => {
    if (!f) { doc.style.removeProperty('--display'); return; }
    const id = 'gf-' + f;
    if (!document.getElementById(id)) {
      const l = document.createElement('link'); l.id = id; l.rel = 'stylesheet';
      l.href = 'https://fonts.googleapis.com/css2?family=' + f + ':wght@400;500;600;700' + (f === 'Marcellus' ? '' : '') + '&display=swap';
      if (f === 'Marcellus') l.href = 'https://fonts.googleapis.com/css2?family=Marcellus&display=swap';
      if (f === 'Fraunces' || f === 'Lora') l.href = 'https://fonts.googleapis.com/css2?family=' + f + ':ital,wght@0,400;0,600;0,700;1,700&display=swap';
      document.head.appendChild(l);
    }
    doc.style.setProperty('--display', `"${f}",Georgia,serif`);
  };
  if (pick) {
    let saved = ''; try { saved = localStorage.getItem('flwr-font') || ''; } catch (e) {}
    pick.value = saved; applyFont(saved);
    pick.addEventListener('change', () => { applyFont(pick.value); try { localStorage.setItem('flwr-font', pick.value); } catch (e) {} });
  }

  /* ---------- light / dark theme ---------- */
  const themeBtn = $('[data-theme-toggle]');
  const syncThemeLabel = () => themeBtn.setAttribute('aria-label', doc.dataset.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  syncThemeLabel();
  themeBtn.addEventListener('click', () => {
    doc.dataset.theme = doc.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('flwr-theme', doc.dataset.theme); } catch (e) {}
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
  const RB_COLORS = ['#ec2f7f', '#f79cc3', '#b99bf0', '#ffd84d', '#ffffff'];
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
  const head = $('[data-head]'), logo = $('[data-hero-logo]');
  const par = $$('[data-parallax]');
  const waves = $$('[data-rainbow] .rb');
  let lastY = scrollY, vel = 0, ticking = false, pending = $$('[data-reveal]');
  function frame() {
    ticking = false;
    const y = scrollY;
    vel = vel * 0.8 + (y - lastY) * 0.2; lastY = y;
    head.classList.toggle('scrolled', y > 8);
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
    const skew = Math.max(-1, Math.min(1, vel / 40));
    waves.forEach((w, i) => { w.style.translate = `0 ${(skew * (i % 3 + 1) * 3).toFixed(1)}px`; });
  }
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
      if (now - lastTrail < 90) return;
      lastTrail = now;
      const p = document.createElement('i');
      p.className = 'burst-petal';
      p.style.cssText = `left:${e.clientX}px;top:${e.clientY}px;background:${COLORS[(now / 90 | 0) % COLORS.length]};--bx:${(Math.random() - .5) * 30}px;--by:${20 + Math.random() * 30}px;--br:${Math.random() * 360}deg;opacity:.8`;
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 950);
    }, { passive: true });
  }
})();
