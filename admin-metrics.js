/* FLWRPWR admin metrics + signup list.
   - NATHAN-ONLY (2026-11-13): only nathanltwong@gmail.com can see the
     signup list or the visit numbers. The other admin emails were removed
     until the site owner approves them.
   - "Export to Excel" downloads ALL signups as .xlsx (SheetJS via CDN,
     CSV fallback if the CDN is unreachable).
   The signup list shows email, name, phone, business, source page, and signup
   time. The section is built in the DOM only for an approved admin whose
   editor is visible. Reads use the admin's own Supabase session (RLS:
   signups readable by Nathan only, visits readable by Nathan only). */
(function () {
  var NATHAN = "nathanltwong@gmail.com";
  var ADMINS = ["nathanltwong@gmail.com"];
  var SB_URL = "https://dqcoincagejyowqxqqnz.supabase.co";
  var SB_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxY29pbmNhZ2VqeW93cXhxcW56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTExMzY4NTQsImV4cCI6MjEwNjcxMjg1NH0.dG7GwddKfuoq08DX_SgtluxWKAU-hyAjMZcAc320ysI";
  var XLSX_CDN = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
  var injected = false;
  var client = null;
  var isNathan = false;
  var allSignups = [];

  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function fmtTime(iso) {
    try {
      return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
    } catch (e) { return iso || ""; }
  }
  function isToday(iso) {
    try {
      var d = new Date(iso), n = new Date();
      return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
    } catch (e) { return false; }
  }

  function getClient() {
    if (client) return client;
    try {
      if (!window.supabase || !window.supabase.createClient) return null;
      client = window.supabase.createClient(SB_URL, SB_ANON);
      return client;
    } catch (e) { return null; }
  }

  function buildSection() {
    var editor = document.getElementById("editorCard");
    if (!editor) return null;
    var sec = document.createElement("div");
    sec.id = "metricsPanel";
    sec.setAttribute("style", "margin-top:26px;border-top:2px solid #D8DECB;padding-top:18px");
    var head = isNathan
      ? '<h2 style="margin:0 0 6px">Site metrics</h2>' +
        '<p class="muted" style="margin:0 0 10px">Only you can see the visit numbers. The signup list below is shared with the other admins.</p>' +
        '<div id="metricsStats" style="display:flex;gap:12px;flex-wrap:wrap;margin:10px 0 16px"></div>' +
        '<div id="metricsVisits"></div>'
      : '<h2 style="margin:0 0 6px">Notify Me signups</h2>' +
        '<p class="muted" style="margin:0 0 10px">Everyone who signed up for launch news. Visit numbers are only visible to Nathan.</p>';
    sec.innerHTML = head +
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin:14px 0 6px">' +
        '<h3 style="margin:0;font-size:1rem;font-weight:900">Signup emails</h3>' +
        '<button class="btn ghost small" type="button" id="metricsExport" style="margin-top:0">Export to Excel</button>' +
      '</div>' +
      '<div id="metricsBody"><p class="muted">Loading…</p></div>' +
      '<button class="btn ghost small" type="button" id="metricsRefresh">Refresh</button>' +
      '<div class="status" id="metricsStatus"></div>';
    var anchor = document.getElementById("approvePanel");
    if (anchor && anchor.parentNode === editor) {
      editor.insertBefore(sec, anchor.nextSibling);
    } else {
      editor.appendChild(sec);
    }
    var refresh = document.getElementById("metricsRefresh");
    if (refresh) refresh.addEventListener("click", loadMetrics);
    var exp = document.getElementById("metricsExport");
    if (exp) exp.addEventListener("click", exportExcel);
    return sec;
  }

  function statHtml(label, value) {
    return '<div style="flex:1;min-width:110px;background:#FDF6EA;border:2px solid #D8DECB;border-radius:14px;padding:12px 14px">' +
      '<div style="font-size:1.6rem;font-weight:900;line-height:1.1">' + esc(value) + '</div>' +
      '<div class="muted" style="font-size:.85rem;font-weight:800">' + esc(label) + '</div></div>';
  }

  function loadXLSX() {
    if (window.XLSX && window.XLSX.utils) return Promise.resolve(true);
    return new Promise(function (resolve) {
      var s = document.createElement("script");
      s.src = XLSX_CDN;
      s.onload = function () { resolve(!!(window.XLSX && window.XLSX.utils)); };
      s.onerror = function () { resolve(false); };
      document.head.appendChild(s);
      setTimeout(function () { resolve(!!(window.XLSX && window.XLSX.utils)); }, 8000);
    });
  }

  function downloadBlob(blob, name) {
    var a = document.createElement("a");
    var url = URL.createObjectURL(blob);
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 1000);
  }

  function csvEscape(v) {
    var s = String(v == null ? "" : v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  async function exportExcel() {
    var btn = document.getElementById("metricsExport");
    var status = document.getElementById("metricsStatus");
    if (btn) { btn.disabled = true; btn.textContent = "Exporting…"; }
    if (status) { status.textContent = "Preparing the export…"; status.className = "status"; }
    var rows = allSignups;
    try {
      var c = getClient();
      if (c) {
        var res = await c.from("flwrpwr_signups").select("email,name,phone,business,source,created_at").order("created_at", { ascending: true }).limit(5000);
        if (!res.error && res.data) rows = res.data;
      }
    } catch (e) {}
    var sheetRows = (rows || []).map(function (s) {
      return { "Email": s.email || "", "Name": s.name || "", "Phone": s.phone || "", "Business": s.business || "", "Signup date/time": fmtTime(s.created_at), "Source page": s.source || "" };
    });
    var done = function (msg, ok) {
      if (btn) { btn.disabled = false; btn.textContent = "Export to Excel"; }
      if (status) { status.textContent = msg; status.className = "status" + (ok ? " ok" : " err"); }
    };
    try {
      var hasXlsx = await loadXLSX();
      if (hasXlsx) {
        var ws = window.XLSX.utils.json_to_sheet(sheetRows);
        var wb = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(wb, ws, "Signups");
        window.XLSX.writeFile(wb, "flwrpwr-signups.xlsx");
        done("Exported " + sheetRows.length + " signup" + (sheetRows.length === 1 ? "" : "s") + " to flwrpwr-signups.xlsx.", true);
        return;
      }
    } catch (e) {}
    var csv = "Email,Name,Phone,Business,Signup date/time,Source page\n" + sheetRows.map(function (r) {
      return csvEscape(r["Email"]) + "," + csvEscape(r["Name"]) + "," + csvEscape(r["Phone"]) + "," + csvEscape(r["Business"]) + "," + csvEscape(r["Signup date/time"]) + "," + csvEscape(r["Source page"]);
    }).join("\n");
    downloadBlob(new Blob([csv], { type: "text/csv" }), "flwrpwr-signups.csv");
    done("Excel library did not load, downloaded a CSV instead (" + sheetRows.length + " signups).", false);
  }

  async function loadMetrics() {
    var c = getClient();
    var status = document.getElementById("metricsStatus");
    var body = document.getElementById("metricsBody");
    var stats = document.getElementById("metricsStats");
    var visitsEl = document.getElementById("metricsVisits");
    if (!c || !status || !body) return;
    status.textContent = "Loading…";
    status.className = "status";
    var sRes;
    try {
      sRes = await c.from("flwrpwr_signups").select("email,name,phone,business,source,created_at").order("created_at", { ascending: false }).limit(500);
    } catch (e) { sRes = { error: e }; }
    var vRes = null;
    if (isNathan) {
      try {
        vRes = await c.from("flwrpwr_visits").select("page,session_type,session_email,visited_at").order("visited_at", { ascending: false }).limit(1000);
      } catch (e) { vRes = { error: e }; }
    }
    var signupFailed = !!(sRes && sRes.error);
    var visitsFailed = isNathan && !!(vRes && vRes.error);
    if (signupFailed || visitsFailed) {
      status.textContent = "Could not load the numbers. Check your connection and refresh.";
      status.className = "status err";
      if (stats) stats.innerHTML = statHtml("Total visits", "—") + statHtml("Visits today", "—") + statHtml("Total signups", "—");
      if (visitsEl) visitsEl.innerHTML = "";
      if (body) body.innerHTML = "<p class=\"muted\">Could not load signups.</p>";
      return;
    }
    var signups = (sRes && sRes.data) || [];
    allSignups = signups.slice();
    var signupRows = signups.length ? signups.slice(0, 100).map(function (s) {
      return "<tr><td>" + esc(s.email) + "</td><td>" + esc(s.name || "—") + "</td><td>" + esc(s.phone || "—") + "</td><td>" + esc(s.business || "—") + "</td><td>" + esc(s.source || "—") + "</td><td>" + esc(fmtTime(s.created_at)) + "</td></tr>";
    }).join("") : "<tr><td colspan=\"6\">No signups yet.</td></tr>";
    var note = signups.length >= 100 ? "<p class=\"muted\">Showing the latest 100 — Export to Excel downloads all of them.</p>" : "";
    body.innerHTML =
      "<div style=\"overflow-x:auto\"><table style=\"width:100%;border-collapse:collapse;font-size:.92rem\"><thead><tr><th style=\"text-align:left;padding:6px 8px;border-bottom:1.5px solid #D8DECB\">Email</th><th style=\"text-align:left;padding:6px 8px;border-bottom:1.5px solid #D8DECB\">Name</th><th style=\"text-align:left;padding:6px 8px;border-bottom:1.5px solid #D8DECB\">Phone</th><th style=\"text-align:left;padding:6px 8px;border-bottom:1.5px solid #D8DECB\">Business</th><th style=\"text-align:left;padding:6px 8px;border-bottom:1.5px solid #D8DECB\">Source</th><th style=\"text-align:left;padding:6px 8px;border-bottom:1.5px solid #D8DECB\">When</th></tr></thead><tbody>" + signupRows + "</tbody></table></div>" + note;
    if (isNathan && vRes) {
      var visits = (vRes && vRes.data) || [];
      var today = 0, byPage = {};
      visits.forEach(function (v) {
        if (isToday(v.visited_at)) today++;
        var p = v.page || "(unknown)";
        byPage[p] = (byPage[p] || 0) + 1;
      });
      var pageRows = Object.keys(byPage).sort(function (a, b) { return byPage[b] - byPage[a]; }).map(function (p) {
        return "<tr><td>" + esc(p) + "</td><td>" + byPage[p] + "</td></tr>";
      }).join("");
      if (stats) stats.innerHTML = statHtml("Total visits", String(visits.length)) + statHtml("Visits today", String(today)) + statHtml("Total signups", String(signups.length));
      if (visitsEl) visitsEl.innerHTML =
        "<h3 style=\"margin:14px 0 6px;font-size:1rem;font-weight:900\">Visits by page</h3>" +
        (pageRows ? "<table style=\"width:100%;border-collapse:collapse;font-size:.92rem\"><thead><tr><th style=\"text-align:left;padding:6px 8px;border-bottom:1.5px solid #D8DECB\">Page</th><th style=\"text-align:left;padding:6px 8px;border-bottom:1.5px solid #D8DECB\">Visits</th></tr></thead><tbody>" + pageRows + "</tbody></table>" : "<p class=\"muted\">No visits logged yet.</p>");
    }
    status.textContent = "Live from Supabase.";
    status.className = "status ok";
  }

  async function maybeInject() {
    if (injected) return;
    var editor = document.getElementById("editorCard");
    if (!editor || editor.classList.contains("hidden")) return;
    var c = getClient();
    if (!c) return;
    var sess = null;
    try { sess = await c.auth.getSession(); } catch (e) { return; }
    var email = sess && sess.data && sess.data.session && sess.data.session.user && sess.data.session.user.email;
    if (!email) return;
    var em = String(email).trim().toLowerCase();
    if (ADMINS.indexOf(em) === -1) return;
    isNathan = (em === NATHAN);
    if (buildSection()) {
      injected = true;
      loadMetrics();
    }
  }

  function init() {
    var c = getClient();
    if (c && c.auth && c.auth.onAuthStateChange) {
      try { c.auth.onAuthStateChange(function () { maybeInject(); }); } catch (e) {}
    }
    maybeInject();
    var tries = 0;
    var iv = setInterval(function () {
      tries++;
      if (injected || tries > 90) { clearInterval(iv); return; }
      maybeInject();
    }, 1000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
