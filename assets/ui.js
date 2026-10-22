/* NEO-LUBLIN 2049: komponenty interfejsu.
   ULICA (GTA III): pager, baner zlecenia.  NEON (Edgerunners): wykresy.  SIEĆ (Neuromancer): terminal ECHO.
   Bez zależności. Przy prefers-reduced-motion animacje są wyłączone, treść pozostaje. */
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SVGNS = "http://www.w3.org/2000/svg";

  function el(tag, attrs, text) {
    var n = document.createElement(tag);
    if (attrs) for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    return n;
  }
  function svg(tag, attrs) {
    var n = document.createElementNS(SVGNS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }

  // ---------------------------------------------------------------- baner zlecenia (GTA III)
  function banner(title, sub) {
    var old = document.querySelector(".mission-banner.live"); if (old) old.remove();
    var b = el("div", { "class": "mission-banner live", role: "status", "aria-live": "polite" });
    b.appendChild(el("div", { "class": "mb-title" }, title));
    if (sub) b.appendChild(el("div", { "class": "mb-sub" }, sub));
    document.body.appendChild(b);
    requestAnimationFrame(function () { b.classList.add("on"); });
    setTimeout(function () { b.classList.remove("on"); setTimeout(function () { b.remove(); }, 600); }, reduce ? 4000 : 3200);
  }

  // ---------------------------------------------------------------- terminal ECHO (Neuromancer)
  function typeTerminal(box) {
    var lines = [].slice.call(box.querySelectorAll("[data-line]"));
    if (reduce || !("IntersectionObserver" in window)) return;
    var texts = lines.map(function (l) { var t = l.textContent; l.textContent = ""; return t; });
    var started = false;
    var io = new IntersectionObserver(function (es) {
      if (started || !es[0].isIntersecting) return; started = true; io.disconnect();
      var li = 0, ci = 0;
      (function step() {
        if (li >= lines.length) { box.classList.add("done"); return; }
        lines[li].textContent = texts[li].slice(0, ++ci);
        if (ci >= texts[li].length) { li++; ci = 0; setTimeout(step, 260); } else setTimeout(step, 14);
      })();
    }, { threshold: 0.4 });
    io.observe(box);
  }

  // ---------------------------------------------------------------- wykresy (NEON / SIEĆ)
  function chart(fig) {
    var d; try { d = JSON.parse(fig.querySelector("script[type='application/json']").textContent); } catch (e) { return; }
    var W = 680, pad = { l: d.type === "hbar" ? 250 : 56, r: 96, t: 14, b: d.type === "hbar" ? 14 : 46 };
    var rowH = 34, H = d.type === "hbar" ? pad.t + pad.b + d.data.length * rowH : 300;
    var s = svg("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": d.title || "" , "class": "neon-chart" });
    var max = d.max || Math.max.apply(null, d.data.map(function (x) { return x.hi || x.v; }));
    var pal = ["var(--gold)", "var(--navy)", "var(--accent)", "var(--phosphor)", "var(--ice)"];
    if (d.type === "hbar") {
      var iw = W - pad.l - pad.r;
      d.data.forEach(function (x, i) {
        var y = pad.t + i * rowH, w = Math.max(2, x.v / max * iw);
        s.appendChild(svg("rect", { x: pad.l, y: y + 6, width: iw, height: rowH - 14, fill: "rgba(255,255,255,0.04)" }));
        var r = svg("rect", { x: pad.l, y: y + 6, width: reduce ? w : 0, height: rowH - 14, fill: x.color || pal[i % pal.length], "class": "bar" });
        s.appendChild(r);
        if (!reduce) setTimeout(function () { r.setAttribute("width", w); }, 60 + i * 90);
        var lab = svg("text", { x: pad.l - 10, y: y + rowH / 2 + 4, "text-anchor": "end", "class": "lab" }); lab.textContent = x.label; s.appendChild(lab);
        var val = svg("text", { x: pad.l + w + 8, y: y + rowH / 2 + 4, "class": "val" }); val.textContent = x.text || String(x.v); s.appendChild(val);
      });
    } else {
      var ih = H - pad.t - pad.b, iw2 = W - pad.l - pad.r, n = d.data.length, bw = iw2 / n * 0.56;
      [0, 0.25, 0.5, 0.75, 1].forEach(function (f) {
        var y = pad.t + ih - f * ih;
        s.appendChild(svg("line", { x1: pad.l, x2: W - pad.r, y1: y, y2: y, "class": "grid" }));
        var tl = svg("text", { x: pad.l - 8, y: y + 4, "text-anchor": "end", "class": "axis" }); tl.textContent = Math.round(max * f); s.appendChild(tl);
      });
      d.data.forEach(function (x, i) {
        var cx = pad.l + (i + 0.5) * iw2 / n, h = x.v / max * ih, y = pad.t + ih - h;
        if (x.lo != null && x.hi != null) {
          var y1 = pad.t + ih - x.hi / max * ih, y2 = pad.t + ih - x.lo / max * ih;
          s.appendChild(svg("rect", { x: cx - bw / 2 - 6, y: y1, width: bw + 12, height: y2 - y1, "class": "range" }));
        }
        var r = svg("rect", { x: cx - bw / 2, y: reduce ? y : pad.t + ih, width: bw, height: reduce ? h : 0, fill: x.color || (x.forecast ? "transparent" : "var(--navy)"),
          stroke: x.forecast ? "var(--gold)" : "none", "stroke-dasharray": x.forecast ? "5 4" : "", "stroke-width": 2, "class": "bar" });
        s.appendChild(r);
        if (!reduce) setTimeout(function () { r.setAttribute("y", y); r.setAttribute("height", h); }, 80 + i * 120);
        var v = svg("text", { x: cx, y: y - 8, "text-anchor": "middle", "class": "val" }); v.textContent = x.text || String(x.v); s.appendChild(v);
        var l = svg("text", { x: cx, y: H - pad.b + 20, "text-anchor": "middle", "class": "lab" }); l.textContent = x.label; s.appendChild(l);
      });
      if (d.unit) { var u = svg("text", { x: pad.l, y: pad.t - 2, "class": "axis" }); u.textContent = d.unit; s.appendChild(u); }
    }
    var ttl = fig.querySelector(".chart-title");
    if (ttl) ttl.insertAdjacentElement("afterend", s); else fig.insertBefore(s, fig.firstChild);
    // tabela dla czytników ekranu
    var tb = el("table", { "class": "sr-only" });
    var tr = el("tr"); tr.appendChild(el("th", null, d.labelHead || "Kategoria")); tr.appendChild(el("th", null, d.valueHead || "Wartość")); tb.appendChild(tr);
    d.data.forEach(function (x) { var r = el("tr"); r.appendChild(el("td", null, x.label)); r.appendChild(el("td", null, x.text || String(x.v))); tb.appendChild(r); });
    fig.appendChild(tb);
  }

  // ---------------------------------------------------------------- przełącznik mapy ULICA / SIEĆ
  function modeSwitch(sw) {
    var target = document.querySelector(sw.getAttribute("data-target"));
    if (!target) return;
    var box = target.closest(".city-map");
    var KEY = "neo-lublin-tryb-mapy";
    function apply(b) {
      var m = b.getAttribute("data-mode");
      if (target._city) target._city.setMode(m);
      if (box) box.classList.toggle("net", m === "siec");
      sw.querySelectorAll("[data-mode]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      return m;
    }
    sw.querySelectorAll("[data-mode]").forEach(function (b) {
      b.addEventListener("click", function () {
        var m = apply(b);
        try { localStorage.setItem(KEY, m); } catch (e) {}
      });
    });
    // zapamiętany wybór; mapa może jeszcze nie istnieć, więc ponawiamy po załadowaniu strony
    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) {}
    var sb = saved && sw.querySelector('[data-mode="' + saved + '"]');
    if (sb) { apply(sb); window.addEventListener("load", function () { apply(sb); }); }
  }

  // ---------------------------------------------------------------- wyszukiwarka listy
  // <input type="search" data-search="[selektor elementów]" data-search-groups="[selektor grup]">
  // <p data-search-count></p>. Wielkość liter i polskie znaki nie mają znaczenia.
  function norm(t) {
    return (t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l");
  }
  function searchBox(inp) {
    var items = Array.prototype.slice.call(document.querySelectorAll(inp.getAttribute("data-search")));
    var groups = inp.getAttribute("data-search-groups") ? Array.prototype.slice.call(document.querySelectorAll(inp.getAttribute("data-search-groups"))) : [];
    var count = document.querySelector("[data-search-count]");
    var texts = items.map(function (el) { return norm(el.textContent); });
    function run() {
      var words = norm(inp.value).split(/\s+/).filter(Boolean), shown = 0;
      items.forEach(function (el, i) {
        var hit = words.every(function (w) { return texts[i].indexOf(w) !== -1; });
        el.classList.toggle("s-miss", !hit);
        if (hit && !el.hidden) shown++;
      });
      groups.forEach(function (g) {
        var any = Array.prototype.some.call(g.querySelectorAll(inp.getAttribute("data-search")), function (el) { return !el.hidden && !el.classList.contains("s-miss"); });
        g.classList.toggle("s-miss", !any);
      });
      if (count) count.textContent = words.length ? "Znaleziono: " + shown : "";
    }
    inp.addEventListener("input", run);
    inp._run = run;
    document.addEventListener("neo:filter", run);
  }

  // ---------------------------------------------------------------- tryb offline (site/sw.js)
  // Strona przy połączeniu zawsze idzie z sieci; z pamięci urządzenia tylko bez sieci. Wtedy pasek mówi,
  // z którego dnia jest zapisana wersja, żeby nikt nie polegał na nieaktualnych terminach.
  var SKRYPT = document.currentScript && document.currentScript.src;
  function offline() {
    var zPamieci = document.documentElement.hasAttribute("data-z-pamieci");
    var stopka = document.querySelector(".site-foot .wrap");
    var m = stopka && /Stan materiałów na ([0-9.]+)/.exec(stopka.textContent);
    var data = m ? m[1] : "";
    var pasek = null;
    function pokaz() {
      var bez = zPamieci || navigator.onLine === false;
      if (!bez) { if (pasek) pasek.remove(); pasek = null; return; }
      if (!pasek) {
        pasek = el("div", { "class": "offline-bar", role: "status" });
        var main = document.getElementById("tresc");
        (main || document.body).insertBefore(pasek, (main || document.body).firstChild);
      }
      pasek.textContent = "";
      var brak = navigator.onLine === false;
      pasek.appendChild(el("b", null, brak ? "Brak połączenia. " : "Sieć nie odpowiada. "));
      pasek.appendChild(document.createTextNode((brak ? "Strony kursu pochodzą teraz z pamięci urządzenia" : "Ta strona pochodzi z pamięci urządzenia") +
        (data ? " (stan materiałów na " + data + ")" : "") + ". Terminy i komunikaty sprawdź po połączeniu z siecią."));
      if (zPamieci && navigator.onLine !== false) {
        var b = el("button", { type: "button", "class": "offline-odswiez" }, "Odśwież");
        b.addEventListener("click", function () { location.reload(); });
        pasek.appendChild(document.createTextNode(" ")); pasek.appendChild(b);
      }
    }
    pokaz();
    window.addEventListener("offline", pokaz);
    window.addEventListener("online", pokaz);

    if (!("serviceWorker" in navigator) || !window.isSecureContext || !SKRYPT) return;
    var baza;
    try { baza = new URL("../", SKRYPT); } catch (x) { return; }
    navigator.serviceWorker.register(new URL("sw.js", baza).href, { scope: baza.href }).catch(function () {});
    if (!stopka) return;
    navigator.serviceWorker.ready.then(function (reg) {
      var sw = reg.active; if (!sw) return;
      var box = el("p", { "class": "offline-foot" });
      var info = el("span"), btn = el("button", { type: "button", "class": "offline-zapisz" });
      box.appendChild(info); box.appendChild(document.createTextNode(" ")); box.appendChild(btn);
      navigator.serviceWorker.addEventListener("message", function (e) {
        var d = e.data || {};
        if (d.typ === "stan") {
          info.textContent = "Tryb offline: strony kursu są zapisane w tym urządzeniu; ilustracje " + d.zapisane + " z " + d.media + ".";
          if (d.zapisane < d.media) {
            btn.hidden = false; btn.disabled = false;
            btn.textContent = "Zapisz cały kurs z ilustracjami (ok. " + Math.max(1, Math.round(d.brak / 1e6)) + " MB)";
          } else btn.hidden = true;
          if (!box.parentNode) stopka.appendChild(box);
        } else if (d.typ === "postep") {
          btn.disabled = true;
          btn.textContent = "Zapisywanie… " + d.gotowe + " z " + d.razem;
          if (d.gotowe === d.razem) sw.postMessage({ typ: "stan" });
        }
      });
      btn.addEventListener("click", function () {
        if (navigator.onLine === false) return;
        btn.disabled = true; btn.textContent = "Zapisywanie…";
        sw.postMessage({ typ: "zapisz-wszystko" });
      });
      sw.postMessage({ typ: "stan" });
    }).catch(function () {});
  }

  // ---------------------------------------------------------------- powiększanie wykresów SVG w konspekcie/Wiedzy
  // Na telefonie wykres 960 px ma napisy ok. 5 px: dotknięcie otwiera go na pełnym ekranie (przybliżanie palcami, obrót).
  function powiekszanie() {
    document.querySelectorAll('.prose figure > img[src$=".svg"]').forEach(function (img) {
      img.classList.add("zoomable"); img.tabIndex = 0; img.setAttribute("role", "button");
      img.setAttribute("aria-description", "Naciśnij Enter, aby powiększyć");
      function otworz() {
        var ov = el("div", { "class": "zoom-ov", role: "dialog", "aria-modal": "true", "aria-label": "Powiększony wykres" });
        var big = el("img"); big.src = img.src; big.alt = img.getAttribute("alt") || "";
        var x = el("button", { "class": "zoom-x", type: "button" }, "Zamknij ✕");
        ov.appendChild(x); ov.appendChild(big); document.body.appendChild(ov);
        document.documentElement.classList.add("zoom-on");
        function zamknij() { ov.remove(); document.documentElement.classList.remove("zoom-on"); document.removeEventListener("keydown", esc); img.focus(); }
        function esc(e) { if (e.key === "Escape") zamknij(); else if (e.key === "Tab") { e.preventDefault(); x.focus(); } }   // fokus zostaje w nakładce
        x.addEventListener("click", zamknij); ov.addEventListener("click", function (e) { if (e.target === ov) zamknij(); });
        document.addEventListener("keydown", esc); x.focus();
      }
      img.addEventListener("click", otworz);
      img.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); otworz(); } });
    });
  }

  // ---------------------------------------------------------------- pasek „SIEĆ · AI na świecie” (mapa miasta)
  // Dane: wiadomosci.json w katalogu głównym strony, odświeżany codziennie przez GitHub Actions (tools/wiadomosci.py).
  // Brak pliku (np. podgląd lokalny) = brak paska. Nagłówki prowadzą do źródeł; kurs ich nie weryfikuje.
  function pasekWiadomosci() {
    var mapa = document.querySelector("section.city .city-map");
    if (!mapa || !window.fetch) return;
    fetch("wiadomosci.json", { cache: "no-cache" }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (!d || !d.wpisy || !d.wpisy.length) return;
      var W = d.wpisy, i = 0, stop = false, timer = null;
      var bar = el("div", { "class": "siec-pasek", role: "region", "aria-label": "Najnowsze wiadomości o AI ze świata" });
      bar.appendChild(el("span", { "class": "sp-lbl" }, "SIEĆ › AI NA ŚWIECIE"));
      var link = el("a", { "class": "sp-t", target: "_blank", rel: "noopener" }), meta = el("span", { "class": "sp-m" });
      var prev = el("button", { type: "button", "class": "sp-b", "aria-label": "Poprzednia wiadomość" }, "◀");
      var pauza = el("button", { type: "button", "class": "sp-b", "aria-label": "Zatrzymaj przewijanie" }, "⏸");
      var next = el("button", { type: "button", "class": "sp-b", "aria-label": "Następna wiadomość" }, "▶");
      var box = el("span", { "class": "sp-txt" }); box.appendChild(link); box.appendChild(meta);
      bar.appendChild(box); bar.appendChild(prev); bar.appendChild(pauza); bar.appendChild(next);
      var lista = el("details", { "class": "sp-lista" });
      lista.appendChild(el("summary", null, "Wszystkie wiadomości (" + W.length + "), stan na " + String(d.aktualizacja || "").slice(0, 10).split("-").reverse().join(".")));
      var ol = el("ol");
      W.forEach(function (w) {
        var li = el("li"), a = el("a", { href: w.u, target: "_blank", rel: "noopener", lang: w.j || "en" }, w.t);
        li.appendChild(a); li.appendChild(el("span", { "class": "sp-m" }, " · " + w.z + " · " + w.d.split("-").reverse().join("."))); ol.appendChild(li);
      });
      lista.appendChild(ol);
      lista.appendChild(el("p", { "class": "muted" }, "Nagłówki z serwisów i instytucji (RSS), wybierane automatycznie raz dziennie. Kurs ich nie weryfikuje: sprawdzaj źródło, zanim je zacytujesz."));
      function pokaz() {
        var w = W[i]; link.textContent = w.t; link.href = w.u; link.setAttribute("lang", w.j || "en");
        meta.textContent = " · " + w.z + " · " + w.d.split("-").reverse().join(".");
      }
      function krok(n) { i = (i + n + W.length) % W.length; pokaz(); }
      function start() { if (!timer && !stop && !reduce) timer = setInterval(function () { krok(1); }, 8000); }
      function wstrzymaj() { if (timer) { clearInterval(timer); timer = null; } }
      prev.addEventListener("click", function () { krok(-1); });
      next.addEventListener("click", function () { krok(1); });
      pauza.addEventListener("click", function () {
        stop = !stop; pauza.textContent = stop ? "▶▶" : "⏸"; pauza.setAttribute("aria-label", stop ? "Wznów przewijanie" : "Zatrzymaj przewijanie");
        if (stop) wstrzymaj(); else start();
      });
      bar.addEventListener("mouseenter", wstrzymaj); bar.addEventListener("mouseleave", start);
      bar.addEventListener("focusin", wstrzymaj); bar.addEventListener("focusout", start);
      pokaz(); start();
      mapa.parentNode.insertBefore(bar, mapa.nextSibling);
      bar.parentNode.insertBefore(lista, bar.nextSibling);
    }).catch(function () {});
  }

  window.NeoUI = { banner: banner };

  document.addEventListener("DOMContentLoaded", function () {
    offline();
    powiekszanie();
    pasekWiadomosci();
    document.querySelectorAll(".terminal").forEach(typeTerminal);
    document.querySelectorAll("figure.chart").forEach(chart);
    document.querySelectorAll(".mode-switch").forEach(modeSwitch);
    document.querySelectorAll("input[data-search]").forEach(searchBox);
    document.querySelectorAll("[data-demo-banner]").forEach(function (b) {
      b.addEventListener("click", function () { banner(b.getAttribute("data-title") || "ZLECENIE ZALICZONE", b.getAttribute("data-sub") || ""); });
    });
  });
})();
