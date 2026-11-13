/* FLWRPWR visit tracker — CLEAN, plain code. Do NOT obfuscate this file, and do
   NOT obfuscate the Supabase URL, anon key, or table name below: BLA mangled
   the anon key inside gate.js (iat 1791136850 instead of 1791136854), so every
   visit POST failed with "Invalid API key" and the visit count stayed at 0.
   This file is the ONLY visit recorder now. It loads BEFORE gate.js on every
   shop page and:
   (1) neutralises the broken tracker inside gate.js by swallowing its POST to
       flwrpwr_visits (so it cannot 401 or double-record — it still does its
       localStorage save, which is harmless; that key is write-only, nothing
       reads it);
   (2) records the visit itself: localStorage (flwrpwr_visits_v1) + POST
       {page, session_type, session_email, visited_at} to Supabase with the
       correct anon key. No Prefer header (anon cannot SELECT, so
       return=representation would fail the insert). Any POST failure is logged
       to console, never swallowed. */
(function () {
  var SB_URL = "https://dqcoincagejyowqxqqnz.supabase.co";
  var SB_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxY29pbmNhZ2VqeW93cXhxcW56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTExMzY4NTQsImV4cCI6MjEwNjcxMjg1NH0.dG7GwddKfuoq08DX_SgtluxWKAU-hyAjMZcAc320ysI";
  var VISITS_URL = SB_URL + "/rest/v1/flwrpwr_visits";
  var LS_KEY = "flwrpwr_visits_v1";

  var origFetch = window.fetch ? window.fetch.bind(window) : null;

  // (1) Swallow the broken gate.js tracker's POST. It fires after this script
  // (gate.js loads later) with a corrupted key. Give it a fake ok response so
  // it marks itself done and never reaches Supabase.
  if (origFetch) {
    window.fetch = function (url, opts) {
      var u = String(url || "");
      if (u.indexOf(VISITS_URL) === 0) {
        return Promise.resolve(new Response(null, { status: 200 }));
      }
      return origFetch(url, opts);
    };
  }

  function sessionEmail() {
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (!/^sb-.*-auth-token$/.test(k)) continue;
        var s = JSON.parse(localStorage.getItem(k) || "null");
        if (s && s.user && s.user.email && s.access_token) return s.user.email;
      }
    } catch (e) {}
    return null;
  }

  function recordVisit() {
    var email = sessionEmail();
    var row = {
      page: (location.pathname || "/").split("/").pop() || "index.html",
      session_type: email ? "admin" : "visitor",
      session_email: email,
      visited_at: new Date().toISOString()
    };
    // (2a) Local log, same key and shape as before.
    try {
      var log = JSON.parse(localStorage.getItem(LS_KEY) || "[]") || [];
      if (!Array.isArray(log)) log = [];
      log.push(row);
      if (log.length > 500) log = log.slice(-500);
      localStorage.setItem(LS_KEY, JSON.stringify(log));
    } catch (e) {}
    // (2b) Supabase insert with the correct key. No Prefer header.
    if (!origFetch) {
      try { console.error("[flwrpwr tracker] no fetch, visit not posted", row); } catch (e) {}
      return;
    }
    origFetch(VISITS_URL, {
      method: "POST",
      headers: {
        apikey: SB_ANON,
        Authorization: "Bearer " + SB_ANON,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(row)
    }).then(function (r) {
      if (!r.ok) {
        try { console.error("[flwrpwr tracker] visit POST failed", r.status, row); } catch (e) {}
      }
    }).catch(function (err) {
      try { console.error("[flwrpwr tracker] visit POST failed", err, row); } catch (e) {}
    });
  }

  recordVisit();
})();
