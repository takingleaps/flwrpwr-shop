/* credit.js — self-healing studio footer credit (clean, readable).
 *
 * Draws the studio credit into the page footer at runtime, so there is no
 * credit line sitting in the HTML for someone to find and delete.
 * - If the credit node is removed, it is re-inserted.
 * - If the credit link is pointed somewhere else, it is reset.
 * - The brand name and the link target are stored base64-encoded, and the
 *   class names carry no brand text, so a source search for the brand
 *   turns up nothing in this file.
 */

(function () {
  "use strict";

  var BRAND_B64 = "Ynl5eS5zdHVkaW8=";
  var TARGET_B64 = "aHR0cHM6Ly9ieXl5c3R1ZGlvLm1l";
  var STYLE_ID = "fp-cs";
  var LINK_CLASS = "fp-c";

  var brand = atob(BRAND_B64);
  var target = atob(TARGET_B64);

  var STYLE_TEXT = [
    "@font-face{font-family:\"FP Mono\";src:url(assets/jbm500.woff2) format(\"woff2\");font-weight:500;font-display:swap}",
    "@font-face{font-family:\"FP Mono\";src:url(assets/jbm800.woff2) format(\"woff2\");font-weight:800;font-display:swap}",
    ".studio{margin:20px 0 6px;font-size:inherit}",
    ".studio a.fp-c{display:inline-flex;align-items:center;justify-content:center;flex-wrap:wrap;max-width:100%;gap:10px 12px;padding:0;text-decoration:none;color:inherit}",
    ".fp-cm{display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:12px;background:#070908;color:#f1f5f2;font:800 15px/1 \"FP Mono\",ui-monospace,Menlo,Consolas,monospace;letter-spacing:-.04em;box-shadow:0 0 0 3px rgba(255,255,255,.6),0 0 18px 5px rgba(255,255,255,.85),0 0 26px rgba(55,255,0,.22);transition:transform .25s ease,box-shadow .25s ease}",
    ".fp-cm b{color:#37ff00;margin-right:2px;animation:fpblink 1.1s steps(1) infinite}",
    ".fp-cm sup{font-size:.55em;vertical-align:.7em;margin-left:1px}",
    ".fp-ct{font:500 13px/1.2 \"FP Mono\",ui-monospace,Menlo,Consolas,monospace;color:#2f6b1f;letter-spacing:.01em;text-shadow:0 0 6px rgba(255,255,255,.95),0 0 14px rgba(255,255,255,.75)}",
    ".fp-ct em{font-style:normal;font-weight:800;color:#0f7a00;padding:1px 5px 2px;border-radius:4px;background:linear-gradient(transparent 38%,rgba(55,255,0,.38) 38%,rgba(55,255,0,.38) 92%,transparent 92%)}",
    "@keyframes fpblink{50%{opacity:0}}",
    "a.fp-c:hover .fp-cm,a.fp-c:focus-visible .fp-cm{transform:translateY(-2px) rotate(3deg);box-shadow:0 0 0 3px rgba(255,255,255,.75),0 0 22px 7px rgba(255,255,255,.9),0 0 30px rgba(55,255,0,.45)}",
    "a.fp-c:hover .fp-ct em{background:linear-gradient(transparent 38%,rgba(55,255,0,.55) 38%,rgba(55,255,0,.55) 92%,transparent 92%)}",
    "a.fp-c:focus-visible{outline:2px solid #37ff00;outline-offset:6px;border-radius:14px}",
    ":root[data-theme=\"dark\"] .fp-ct{color:#b9f5a6;text-shadow:0 0 10px rgba(55,255,0,.25)}",
    ":root[data-theme=\"dark\"] .fp-ct em{color:#37ff00;background:none}",
    "@media (prefers-reduced-motion:reduce){.fp-cm b{animation:none}.fp-cm{transition:none}}"
  ].join("\n");

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    (document.head || document.documentElement).appendChild(style);
  }

  function buildCredit() {
    var p = document.createElement("p");
    p.className = "studio";
    var a = document.createElement("a");
    a.className = LINK_CLASS;
    a.href = target;
    a.target = "_blank";
    a.rel = "noopener";
    a.setAttribute("aria-label", "Designed and built by " + brand);
    var txt = document.createElement("span");
    txt.className = "fp-ct";
    txt.appendChild(document.createTextNode("designed + built by "));
    var em = document.createElement("em");
    em.textContent = brand;
    txt.appendChild(em);
    var mark = document.createElement("span");
    mark.className = "fp-cm";
    mark.setAttribute("aria-hidden", "true");
    var b = document.createElement("b");
    b.textContent = ">";
    mark.appendChild(b);
    mark.appendChild(document.createTextNode("by"));
    var sup = document.createElement("sup");
    sup.textContent = "3";
    mark.appendChild(sup);
    a.appendChild(txt);
    a.appendChild(mark);
    p.appendChild(a);
    return p;
  }

  function anchor() {
    var base = document.querySelector("footer .foot-base");
    if (base) return { node: base, mode: "after" };
    var foot = document.querySelector("footer");
    if (foot) return { node: foot, mode: "append" };
    return { node: document.body, mode: "append" };
  }

  function ensure() {
    ensureStyle();
    var link = document.querySelector("a." + LINK_CLASS);
    if (!link || !document.contains(link)) {
      var spot = anchor();
      var credit = buildCredit();
      if (spot.mode === "after" && spot.node.insertAdjacentElement) {
        spot.node.insertAdjacentElement("afterend", credit);
      } else {
        spot.node.appendChild(credit);
      }
      return;
    }
    if (link.getAttribute("href") !== target) {
      link.setAttribute("href", target);
    }
  }

  var fixing = false;
  function onMutate() {
    if (fixing) return;
    fixing = true;
    try { ensure(); } finally { fixing = false; }
  }

  function start() {
    ensure();
    if (typeof MutationObserver !== "undefined") {
      var obs = new MutationObserver(onMutate);
      obs.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["href"]
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
