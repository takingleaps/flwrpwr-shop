/* FLWRPWR gallery arrows: scroll a product row by one card, loop at the end.
   Wired to every .gal-wrap on the page (product grid on shop + home, best
   sellers on home). Arrows hide themselves when the row is not scrollable
   (e.g. best sellers on desktop, where the grid shows everything). Photos
   keep their own links; the arrows are an extra way to browse. */
(function () {
  function visibleCards(gal) {
    var out = [];
    var cards = gal.querySelectorAll(".card");
    for (var i = 0; i < cards.length; i++) {
      if (cards[i].offsetParent !== null) out.push(cards[i]);
    }
    return out;
  }
  function stepFor(gal) {
    var cards = visibleCards(gal);
    if (!cards.length) return gal.clientWidth;
    var gap = 24;
    try {
      var cs = getComputedStyle(gal);
      var g = parseFloat(cs.columnGap || cs.gap || "24");
      if (!isNaN(g)) gap = g;
    } catch (e) {}
    return cards[0].getBoundingClientRect().width + gap;
  }
  function lastSnap(gal) {
    /* Last reachable snap point: scroll-snap can park the row well short of
       scrollWidth-clientWidth (the last card start is the last snap point),
       so "at the end" means "at the last card start", not "at max". */
    var max = gal.scrollWidth - gal.clientWidth;
    var best = 0;
    var cards = visibleCards(gal);
    var base = 0;
    try { base = gal.offsetLeft || 0; } catch (e) {}
    for (var i = 0; i < cards.length; i++) {
      var s = (cards[i].offsetLeft || 0) - base;
      if (s <= max + 4 && s > best) best = s;
    }
    return best;
  }
  function go(gal, dir) {
    /* Wrap jumps are instant (behavior:"auto"): a smooth wrap fights
       scroll-snap and can land on the wrong snap point. */
    if (dir > 0 && gal.scrollLeft >= lastSnap(gal) - 4) {
      gal.scrollTo({ left: 0, behavior: "auto" });
      return;
    }
    if (dir < 0 && gal.scrollLeft <= 4) {
      gal.scrollTo({ left: lastSnap(gal), behavior: "auto" });
      return;
    }
    gal.scrollBy({ left: dir * stepFor(gal), behavior: "smooth" });
  }
  function update(wrap) {
    var gal = wrap.querySelector(".grid");
    if (!gal) return;
    var scrollable = gal.scrollWidth > gal.clientWidth + 4;
    var btns = wrap.querySelectorAll(".gal-arrow");
    for (var i = 0; i < btns.length; i++) btns[i].hidden = !scrollable;
  }
  function init() {
    var wraps = document.querySelectorAll(".gal-wrap");
    for (var w = 0; w < wraps.length; w++) {
      (function (wrap) {
        var gal = wrap.querySelector(".grid");
        if (!gal) return;
        var prev = wrap.querySelector(".gal-prev");
        var next = wrap.querySelector(".gal-next");
        if (prev) prev.addEventListener("click", function () { go(gal, -1); });
        if (next) next.addEventListener("click", function () { go(gal, 1); });
        var refresh = function () { update(wrap); };
        gal.addEventListener("scroll", refresh, { passive: true });
        window.addEventListener("resize", refresh);
        if ("MutationObserver" in window) {
          var mo = new MutationObserver(refresh);
          mo.observe(gal, { childList: true, attributes: true, subtree: true });
        }
        setTimeout(refresh, 300);
        setTimeout(refresh, 1500);
        refresh();
      })(wraps[w]);
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
