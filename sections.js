/* FLWRPWR sections + images — plain, non-obfuscated.
 *
 * What it does, on page load:
 *  1. Fetches `flwrpwr_sections` (key, sort_order, visible) and reorders the
 *     [data-section] elements to match, hiding any with visible = false.
 *     Sections missing from the table keep their built-in place, after the
 *     listed ones. If the table does not exist yet, nothing changes.
 *  2. Fetches `flwrpwr_content` rows keyed `img:<key>` and sets the src of
 *     every [data-image="<key>"] element to the stored URL. No row for a
 *     key means the built-in image stays.
 *
 * Same Supabase project + anon key as content.js. Fails silently, like
 * content.js, so the site always renders with its built-in order/images.
 */
(function () {
  var SUPABASE_URL = 'https://dqcoincagejyowqxqqnz.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxY29pbmNhZ2VqeW93cXhxcW56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTExMzY4NTQsImV4cCI6MjEwNjcxMjg1NH0.dG7GwddKfuoq08DX_SgtluxWKAU-hyAjMZcAc320ysI';

  function get(table) {
    return fetch(SUPABASE_URL + '/rest/v1/' + table + '?select=*', {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + SUPABASE_ANON_KEY }
    }).then(function (res) { return res.ok ? res.json() : []; });
  }

  function applySections(rows) {
    if (!rows || !rows.length) return;
    var order = {};
    var visible = {};
    rows.forEach(function (r) {
      if (!r || !r.key) return;
      order[r.key] = typeof r.sort_order === 'number' ? r.sort_order : 9999;
      visible[r.key] = r.visible !== false;
    });

    // Group sections by parent so each group reorders within itself.
    var groups = {};
    var groupList = [];
    Array.prototype.forEach.call(document.querySelectorAll('[data-section]'), function (el, i) {
      var key = el.getAttribute('data-section');
      el.style.display = visible[key] === false ? 'none' : '';
      var parent = el.parentNode;
      if (!parent) return;
      var g = null;
      for (var k = 0; k < groupList.length; k++) {
        if (groupList[k].parent === parent) { g = groupList[k]; break; }
      }
      if (!g) { g = { parent: parent, items: [] }; groupList.push(g); }
      g.items.push({ el: el, key: key, domIndex: i });
    });

    groupList.forEach(function (g) {
      var sorted = g.items.slice().sort(function (a, b) {
        var oa = (a.key in order) ? order[a.key] : 10000 + a.domIndex;
        var ob = (b.key in order) ? order[b.key] : 10000 + b.domIndex;
        return oa - ob || a.domIndex - b.domIndex;
      });
      // Already in the right order? Leave the DOM alone.
      var same = sorted.every(function (item, i) { return item === g.items[i]; });
      if (same) return;
      // Anchor: the node after the last section in this parent. Re-insert
      // the sorted units just before it, so anything else in the parent
      // (and each section's decorative divider, which travels with it)
      // stays where it belongs.
      var last = g.items[g.items.length - 1].el;
      var anchor = last.nextSibling;
      sorted.forEach(function (item) {
        var unit = sectionUnit(item.el);
        unit.forEach(function (node) { g.parent.insertBefore(node, anchor); });
      });
    });
  }

  // A section plus the decorative divider <div><svg>…</svg></div> sitting
  // directly before it, so the divider moves with its section.
  function sectionUnit(el) {
    var prev = el.previousElementSibling;
    if (prev && prev.tagName === 'DIV' && !prev.hasAttribute('data-section') && prev.querySelector('svg')) {
      return [prev, el];
    }
    return [el];
  }

  function applyImages(rows) {
    if (!rows || !rows.length) return;
    rows.forEach(function (r) {
      if (!r || typeof r.key !== 'string' || r.key.indexOf('img:') !== 0) return;
      var value = typeof r.value === 'string' ? r.value.trim() : '';
      if (!value) return;
      var key = r.key.slice(4);
      Array.prototype.forEach.call(
        document.querySelectorAll('[data-image="' + key + '"]'),
        function (el) {
          if (el.tagName === 'IMG') {
            el.src = value;
            if (el.hasAttribute('srcset')) el.removeAttribute('srcset');
          } else {
            el.style.backgroundImage = 'url("' + value.replace(/"/g, '%22') + '")';
          }
        }
      );
    });
  }

  function run() {
    Promise.all([get('flwrpwr_sections'), get('flwrpwr_content')]).then(function (results) {
      applySections(results[0]);
      applyImages(results[1]);
    }).catch(function () { /* keep built-in order + images */ });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
