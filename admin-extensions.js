/* FLWRPWR Admin extensions — plain, readable.
 *
 * Extends the built-in editor (which covers About / Our story / Mission /
 * Gives Back) with three more panels, all saving to Supabase with the same
 * anon key the built-in editor uses:
 *
 *  1. MORE PAGE TEXT — the 10 remaining data-content keys (hero, shop,
 *     find us, events, join, footer). Paste in your own copy to replace
 *     what's on the site; leave a box empty to keep the site's built-in
 *     words. Saves to flwrpwr_content (key, value). The Instagram feed is
 *     never offered here — it just shows what's already posted.
 *  2. PICTURES — swap a picture by pasting an image link, or upload a file.
 *     Saves to flwrpwr_content as key "img:<key>". File upload needs the
 *     Storage bucket from supabase/flwrpwr_images_storage.sql (run once);
 *     until then, pasted links still work.
 *  3. SECTIONS — move sections up/down to change the page order, or hide
 *     one to take it off the site (reversible — show it again any time).
 *     Reorder only: sections can't be added here. Saves to the NEW table
 *     flwrpwr_sections (key, sort_order, visible); run
 *     supabase/flwrpwr_sections.sql once in Supabase first — the panel
 *     shows that SQL until the table exists.
 *
 * Nothing here touches the login/auth flow or the built-in editor above.
 */
(function () {
  'use strict';

  var SUPABASE_URL = 'https://dqcoincagejyowqxqqnz.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxY29pbmNhZ2VqeW93cXhxcW56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTExMzY4NTQsImV4cCI6MjEwNjcxMjg1NH0.dG7GwddKfuoq08DX_SgtluxWKAU-hyAjMZcAc320ysI';
  var BUCKET = 'flwrpwr-images';

  /* ------------------------------------------------------------------ */
  /* Small REST helpers (same pattern as content.js)                     */
  /* ------------------------------------------------------------------ */

  function headers() {
    return {
      apikey: SUPABASE_ANON_KEY,
      Authorization: 'Bearer ' + SUPABASE_ANON_KEY,
      'Content-Type': 'application/json'
    };
  }

  function getRows(table) {
    return fetch(SUPABASE_URL + '/rest/v1/' + table + '?select=*', { headers: headers() })
      .then(function (res) {
        if (!res.ok) {
          var err = new Error('Supabase read failed: ' + res.status);
          err.status = res.status;
          return res.json().then(function (body) { err.body = body; throw err; }).catch(function () { throw err; });
        }
        return res.json();
      });
  }

  // Upsert an array of row objects on the table's primary key.
  function upsertRows(table, rows) {
    return fetch(SUPABASE_URL + '/rest/v1/' + table + '?on_conflict=key', {
      method: 'POST',
      headers: Object.assign(headers(), { Prefer: 'resolution=merge-duplicates' }),
      body: JSON.stringify(rows)
    }).then(function (res) {
      if (!res.ok) {
        var err = new Error('Supabase save failed: ' + res.status);
        err.status = res.status;
        return res.json().then(function (body) { err.body = body; throw err; }).catch(function () { throw err; });
      }
    });
  }

  function setStatus(el, msg, isError) {
    if (!el) return;
    el.textContent = msg;
    el.style.color = isError ? '#B3261E' : '';
  }

  function isTableMissing(err) {
    return err && (err.status === 404 || (err.body && err.body.code === 'PGRST205'));
  }

  /* ------------------------------------------------------------------ */
  /* 1. More page text — the 10 data-content keys the built-in editor   */
  /*    does not cover.                                                  */
  /* ------------------------------------------------------------------ */

  var TEXT_KEYS = [
    { key: 'hero-sub', label: 'Hero — line under the logo' },
    { key: 'hero-tagline', label: 'Hero — tagline' },
    { key: 'shop-title', label: 'Shop — heading' },
    { key: 'shop-intro', label: 'Shop — intro line' },
    { key: 'findus-copy', label: 'Find us — main copy' },
    { key: 'findus-note', label: 'Find us — note' },
    { key: 'join-title', label: 'Join — heading' },
    { key: 'join-copy', label: 'Join — copy' },
    { key: 'footer-note', label: 'Footer — note' },
    { key: 'events-copy', label: 'Events — copy' }
  ];

  function initPageText() {
    var form = document.getElementById('pageTextForm');
    if (!form) return;
    var status = document.getElementById('pageTextStatus');

    getRows('flwrpwr_content').then(function (rows) {
      var byKey = {};
      rows.forEach(function (r) { if (r && r.key) byKey[r.key] = r.value || ''; });
      form.querySelectorAll('textarea[data-key]').forEach(function (ta) {
        if (byKey[ta.getAttribute('data-key')] !== undefined) ta.value = byKey[ta.getAttribute('data-key')];
      });
      setStatus(status, 'Live copy loaded.');
    }).catch(function (err) {
      setStatus(status, isTableMissing(err)
        ? 'The text table is not set up yet — use the setup box in the editor above first.'
        : 'Could not load the live copy. Check your connection and try again.', true);
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var rows = [];
      form.querySelectorAll('textarea[data-key]').forEach(function (ta) {
        rows.push({ key: ta.getAttribute('data-key'), value: ta.value });
      });
      setStatus(status, 'Saving…');
      upsertRows('flwrpwr_content', rows).then(function () {
        setStatus(status, 'Saved. The live site picks it up on the next visit.');
      }).catch(function (err) {
        setStatus(status, isTableMissing(err)
          ? 'Save failed: the text table does not exist yet. Run the setup SQL in the editor above first.'
          : 'Save failed (' + (err.status || 'network') + '). Nothing was changed — try again.', true);
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* 2. Pictures — paste a link, or upload a file.                      */
  /* ------------------------------------------------------------------ */

  var IMAGE_KEYS = [
    { key: 'logo', label: 'Logo — header, hero, roots + footer', def: 'img/logo-flwrpwr.png' },
    { key: 'hero-daisy', label: 'Daisy field photo (gallery tile)', def: 'img/hero-daisy-field.webp' },
    { key: 'bud-thai-stick', label: 'Thai Stick bud photo', def: 'img/bud-thai-stick.webp' },
    { key: 'bud-northern-lights', label: 'Northern Lights bud photo', def: 'img/bud-northern-lights.webp' },
    { key: 'bud-maui-wowie', label: 'Maui Wowie bud photo', def: 'img/bud-maui-wowie.webp' },
    { key: 'vibe', label: 'Vibe preview — pouch photo', def: 'img/pouch-maui-wowie.png' },
    { key: 'autumn-blaze-logo', label: 'Autumn Blaze event logo', def: 'img/autumn-blaze-logo.webp' }
  ];
  // The Instagram pictures (img/ig-*.jpg) are deliberately NOT listed:
  // the feed just shows what's already posted on Instagram.

  function buildImageRows() {
    var host = document.getElementById('imageRows');
    if (!host) return;
    IMAGE_KEYS.forEach(function (img) {
      var row = document.createElement('div');
      row.className = 'img-row';
      row.setAttribute('data-img-row', img.key);

      var label = document.createElement('label');
      label.textContent = img.label;
      row.appendChild(label);

      var preview = document.createElement('img');
      preview.className = 'img-preview';
      preview.alt = img.label + ' (current)';
      preview.src = img.def;
      row.appendChild(preview);

      var url = document.createElement('input');
      url.type = 'url';
      url.placeholder = 'Paste an image link, e.g. https://…/photo.jpg';
      url.setAttribute('data-img-url', img.key);
      url.addEventListener('input', function () {
        var v = url.value.trim();
        if (v) preview.src = v;
      });
      row.appendChild(url);

      var fileRow = document.createElement('div');
      fileRow.className = 'img-file-row';
      var fileLabel = document.createElement('span');
      fileLabel.className = 'muted';
      fileLabel.textContent = 'Or upload a file: ';
      var file = document.createElement('input');
      file.type = 'file';
      file.accept = 'image/*';
      file.setAttribute('data-img-file', img.key);
      file.addEventListener('change', function () { onFilePicked(img, file, url, preview); });
      fileRow.appendChild(fileLabel);
      fileRow.appendChild(file);
      row.appendChild(fileRow);

      var orig = document.createElement('button');
      orig.type = 'button';
      orig.className = 'btn ghost small';
      orig.textContent = 'Use original picture';
      orig.addEventListener('click', function () {
        url.value = img.def;
        preview.src = img.def;
        setStatus(document.getElementById('imageStatus'), 'Original restored in this box — hit “Save pictures” to publish it.');
      });
      row.appendChild(orig);

      host.appendChild(row);
    });
  }

  function onFilePicked(img, fileInput, urlInput, preview) {
    var file = fileInput.files && fileInput.files[0];
    var status = document.getElementById('imageStatus');
    if (!file) return;
    setStatus(status, 'Uploading ' + file.name + '…');
    var safe = file.name.replace(/[^A-Za-z0-9._-]+/g, '-').slice(0, 80) || 'image';
    var path = 'images/' + img.key + '-' + Date.now() + '-' + safe;
    fetch(SUPABASE_URL + '/storage/v1/object/' + BUCKET + '/' + path, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: 'Bearer ' + SUPABASE_ANON_KEY,
        'Content-Type': file.type || 'application/octet-stream'
      },
      body: file
    }).then(function (res) {
      if (!res.ok) {
        var err = new Error('Upload failed: ' + res.status);
        err.status = res.status;
        throw err;
      }
      var publicUrl = SUPABASE_URL + '/storage/v1/object/public/' + BUCKET + '/' + path;
      urlInput.value = publicUrl;
      preview.src = publicUrl;
      setStatus(status, 'Uploaded. Hit “Save pictures” to publish it on the site.');
    }).catch(function (err) {
      fileInput.value = '';
      setStatus(status, err.status === 404
        ? 'Uploads are not set up yet: the site owner needs to run supabase/flwrpwr_images_storage.sql once in Supabase. Until then, paste an image link instead.'
        : 'Upload failed (' + (err.status || 'network') + '). Try a pasted image link instead.', true);
    });
  }

  function initImages() {
    var form = document.getElementById('imageForm');
    if (!form) return;
    var status = document.getElementById('imageStatus');
    buildImageRows();

    getRows('flwrpwr_content').then(function (rows) {
      rows.forEach(function (r) {
        if (!r || typeof r.key !== 'string' || r.key.indexOf('img:') !== 0) return;
        var key = r.key.slice(4);
        var input = form.querySelector('[data-img-url="' + key + '"]');
        var preview = form.querySelector('[data-img-row="' + key + '"] .img-preview');
        if (input && typeof r.value === 'string' && r.value.trim()) {
          input.value = r.value.trim();
          if (preview) preview.src = r.value.trim();
        }
      });
    }).catch(function () { /* keep the built-in pictures */ });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var rows = [];
      form.querySelectorAll('[data-img-url]').forEach(function (input) {
        var v = input.value.trim();
        if (v) rows.push({ key: 'img:' + input.getAttribute('data-img-url'), value: v });
      });
      if (!rows.length) { setStatus(status, 'Nothing to save — paste a link or upload a file first.'); return; }
      setStatus(status, 'Saving…');
      upsertRows('flwrpwr_content', rows).then(function () {
        setStatus(status, 'Saved. The live site picks it up on the next visit.');
      }).catch(function (err) {
        setStatus(status, isTableMissing(err)
          ? 'Save failed: the text table does not exist yet. Run the setup SQL in the editor above first.'
          : 'Save failed (' + (err.status || 'network') + '). Nothing was changed — try again.', true);
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* 3. Sections — reorder + hide. Reorder only, no adding.            */
  /* ------------------------------------------------------------------ */

  var SECTION_KEYS = [
    { key: 'hero', label: 'Hero' },
    { key: 'vibe', label: 'Vibe picker' },
    { key: 'find-us', label: 'Find us (Weedmaps)' },
    { key: 'shop', label: 'Shop' },
    { key: 'story', label: 'Our story' },
    { key: 'events', label: 'Events' },
    { key: 'join', label: 'Join the club' },
    { key: 'feed', label: 'Instagram feed' },
    { key: 'footer', label: 'Footer' }
  ];

  var SECTIONS_SQL =
    "create table if not exists public.flwrpwr_sections (\n" +
    "  key text primary key,\n" +
    "  sort_order integer not null,\n" +
    "  visible boolean not null default true\n" +
    ");\n\n" +
    "alter table public.flwrpwr_sections enable row level security;\n\n" +
    "drop policy if exists \"Public read sections\" on public.flwrpwr_sections;\n" +
    "create policy \"Public read sections\" on public.flwrpwr_sections\n" +
    "  for select using (true);\n\n" +
    "drop policy if exists \"Admin write sections\" on public.flwrpwr_sections;\n" +
    "create policy \"Admin write sections\" on public.flwrpwr_sections\n" +
    "  for insert with check (true);\n\n" +
    "drop policy if exists \"Admin update sections\" on public.flwrpwr_sections;\n" +
    "create policy \"Admin update sections\" on public.flwrpwr_sections\n" +
    "  for update using (true) with check (true);\n\n" +
    "-- Seed the site's current section order (top to bottom on flwrpwr.co),\n" +
    "-- so creating the table changes nothing until the team reorders in the admin.\n" +
    "insert into public.flwrpwr_sections (key, sort_order, visible) values\n" +
    "  ('hero',     1, true),\n" +
    "  ('vibe',     2, true),\n" +
    "  ('find-us',  3, true),\n" +
    "  ('shop',     4, true),\n" +
    "  ('story',    5, true),\n" +
    "  ('events',   6, true),\n" +
    "  ('join',     7, true),\n" +
    "  ('feed',     8, true),\n" +
    "  ('footer',   9, true)\n" +
    "on conflict (key) do nothing;";

  var sectionState = []; // [{key, label, visible}] in display order

  function renderSections() {
    var list = document.getElementById('sectionsList');
    if (!list) return;
    list.innerHTML = '';
    sectionState.forEach(function (item, i) {
      var row = document.createElement('div');
      row.className = 'sec-row' + (item.visible ? '' : ' sec-hidden');

      var name = document.createElement('span');
      name.className = 'sec-name';
      name.textContent = (i + 1) + '. ' + item.label + (item.visible ? '' : ' (hidden)');
      row.appendChild(name);

      var up = document.createElement('button');
      up.type = 'button';
      up.className = 'btn ghost small';
      up.textContent = '↑';
      up.setAttribute('aria-label', 'Move ' + item.label + ' up');
      up.disabled = i === 0;
      up.addEventListener('click', function () {
        sectionState.splice(i - 1, 0, sectionState.splice(i, 1)[0]);
        renderSections();
      });
      row.appendChild(up);

      var down = document.createElement('button');
      down.type = 'button';
      down.className = 'btn ghost small';
      down.textContent = '↓';
      down.setAttribute('aria-label', 'Move ' + item.label + ' down');
      down.disabled = i === sectionState.length - 1;
      down.addEventListener('click', function () {
        sectionState.splice(i + 1, 0, sectionState.splice(i, 1)[0]);
        renderSections();
      });
      row.appendChild(down);

      var toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'btn ghost small';
      toggle.textContent = item.visible ? 'Hide' : 'Show';
      toggle.setAttribute('aria-label', (item.visible ? 'Hide ' : 'Show ') + item.label + ' on the live site');
      toggle.addEventListener('click', function () {
        item.visible = !item.visible;
        renderSections();
      });
      row.appendChild(toggle);

      list.appendChild(row);
    });
  }

  function initSections() {
    var list = document.getElementById('sectionsList');
    if (!list) return;
    var status = document.getElementById('sectionsStatus');
    var setupBox = document.getElementById('sectionsSetup');
    var setupSql = document.getElementById('sectionsSetupSql');
    var saveBtn = document.getElementById('saveSectionsBtn');
    if (setupSql) setupSql.textContent = SECTIONS_SQL;

    // Default = the site's current top-to-bottom order.
    sectionState = SECTION_KEYS.map(function (s) { return { key: s.key, label: s.label, visible: true }; });
    renderSections();

    getRows('flwrpwr_sections').then(function (rows) {
      if (setupBox) setupBox.classList.add('hidden');
      var byKey = {};
      rows.forEach(function (r) { if (r && r.key) byKey[r.key] = r; });
      var ordered = rows.slice().sort(function (a, b) { return (a.sort_order || 9999) - (b.sort_order || 9999); });
      var seen = {};
      var next = [];
      ordered.forEach(function (r) {
        var def = SECTION_KEYS.find(function (s) { return s.key === r.key; });
        if (!def || seen[r.key]) return;
        seen[r.key] = true;
        next.push({ key: r.key, label: def.label, visible: r.visible !== false });
      });
      SECTION_KEYS.forEach(function (def) {
        if (!seen[def.key]) next.push({ key: def.key, label: def.label, visible: true });
      });
      sectionState = next;
      renderSections();
      setStatus(status, 'Section order loaded.');
    }).catch(function (err) {
      if (isTableMissing(err)) {
        if (setupBox) setupBox.classList.remove('hidden');
        setStatus(status, 'One-time setup needed: run the SQL below in Supabase (SQL Editor), then reload this page. The order shown is the site’s current order.', true);
      } else {
        setStatus(status, 'Could not load the section order. Check your connection and try again.', true);
      }
    });

    if (saveBtn) saveBtn.addEventListener('click', function () {
      var rows = sectionState.map(function (item, i) {
        return { key: item.key, sort_order: i + 1, visible: item.visible };
      });
      setStatus(status, 'Saving…');
      upsertRows('flwrpwr_sections', rows).then(function () {
        setStatus(status, 'Saved. The live site picks it up on the next visit.');
      }).catch(function (err) {
        setStatus(status, isTableMissing(err)
          ? 'Save failed: the sections table does not exist yet. Run the SQL in the setup box above first.'
          : 'Save failed (' + (err.status || 'network') + '). Nothing was changed — try again.', true);
      });
    });
  }

  /* ------------------------------------------------------------------ */

  function init() {
    initPageText();
    initImages();
    initSections();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
