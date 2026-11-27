/* flwr-daisy.js — flower cursor for FLWRPWR (clean, self-contained).
   A small pastel daisy follows the mouse 1:1, centered on the pointer,
   like the byyy-cursor on byyystudio.me but flower-themed. It grows and
   turns pink over links and buttons. The native cursor is hidden while
   the daisy is active, exactly like the byyy site.
   NOTE: the site already ships a legacy `.flwr-cursor` element (created by
   the obfuscated site JS, duplicated on some pages and hidden on the
   homepage). This file hides all of those and provides the single working
   daisy under the unique `.flwr-daisy` class, so there is exactly one
   cursor. Disabled on touch devices and when the user prefers reduced
   motion. Never blocks clicks. */
(function () {
  'use strict';
  if (!window.matchMedia('(pointer: fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var css =
    /* Hide every legacy .flwr-cursor element (duplicated / disabled). */
    '.flwr-cursor{display:none!important}' +
    /* Hide the native cursor while the daisy is active (byyy-style). */
    'html.has-flwr-daisy,html.has-flwr-daisy *{cursor:none!important}' +
    '.flwr-daisy{position:fixed;left:0;top:0;z-index:9999;width:26px;height:26px;' +
    'margin:-13px 0 0 -13px;pointer-events:none;opacity:0;transition:opacity .2s ease;' +
    'will-change:transform;filter:drop-shadow(0 2px 4px rgba(176,40,110,.35))}' +
    '.flwr-daisy.is-visible{opacity:1}' +
    '.flwr-daisy svg{display:block;width:26px;height:26px;transition:transform .18s ease}' +
    '.flwr-daisy.is-hover svg{transform:scale(1.45) rotate(18deg)}' +
    '.flwr-daisy.is-hover svg ellipse{fill:#fbd0e3}' +
    '.flwr-daisy.is-hover svg circle{fill:#f9c1da}' +
    '@media (pointer:coarse){.flwr-daisy{display:none}}' +
    '@media (prefers-reduced-motion:reduce){.flwr-daisy{display:none}}';
  var st = document.createElement('style');
  st.id = 'flwr-daisy-css';
  st.textContent = css;
  document.head.appendChild(st);

  var petals = '';
  var angles = [0, 45, 90, 135, 180, 225, 270, 315];
  for (var i = 0; i < angles.length; i++) {
    petals += '<ellipse cx="20" cy="10.5" rx="4.6" ry="8" transform="rotate(' + angles[i] + ' 20 20)"/>';
  }
  var el = document.createElement('div');
  el.className = 'flwr-daisy';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML =
    '<svg viewBox="0 0 40 40" aria-hidden="true">' +
    '<g fill="#fff" stroke="#f2a0c4" stroke-width="1.2">' + petals + '</g>' +
    '<circle cx="20" cy="20" r="5.2" fill="#ffe58a" stroke="#f2a0c4" stroke-width="1.2"/>' +
    '</svg>';
  document.body.appendChild(el);

  /* 1:1 tracking, no smoothing lag: the daisy moves exactly with the
     pointer, like the byyy-cursor. */
  var shown = false;
  document.addEventListener('mousemove', function (e) {
    el.style.transform = 'translate3d(' + e.clientX + 'px,' + e.clientY + 'px,0)';
    if (!shown) {
      shown = true;
      document.documentElement.classList.add('has-flwr-daisy');
      el.classList.add('is-visible');
    }
  }, { passive: true });
  document.addEventListener('mouseleave', function () {
    el.classList.remove('is-visible');
  });
  document.addEventListener('mouseenter', function () {
    if (shown) el.classList.add('is-visible');
  });
  document.addEventListener('mouseover', function (e) {
    var t = e.target && e.target.closest
      ? e.target.closest('a,button,[role="button"],input,select,textarea,label,summary')
      : null;
    el.classList.toggle('is-hover', !!t);
  }, { passive: true });
})();
