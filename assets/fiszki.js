/* Fiszki: odwracanie karty, powtórki w stylu Anki i krzywa zapominania obok karty. Bez zależności.
   Każda karta ma własną stabilność S (po ilu dniach przewidywana pamięć spada do 90%): R(t) = 0,9^(t/S).
   Karta wraca, gdy R spada do około 90%; ocena zmienia S i łatwość karty e (jak w algorytmie SM-2 z Anki).
   Postęp zapisuje się wyłącznie w localStorage tej przeglądarki; gdy jest niedostępny, fiszki działają bez zapisu. */
(function () {
  "use strict";
  var KEY = "neo-fiszki-v1";
  var MIN = 60000, DAY = 86400000;
  var PROG = 0.9;          // przewidywana pamięć w chwili planowanej powtórki
  var MAX_S = 180;         // najdłuższy odstęp między powtórkami (dni)
  var OPANOWANA_S = 7;     // karta „opanowana”, gdy wytrzymuje co najmniej tydzień
  var OD = -14, DO = 30;   // zakres wykresu w dniach względem dziś
  var dataEl = document.getElementById("fc-data");
  if (!dataEl) return;
  var cards = JSON.parse(dataEl.textContent);
  // fiszki tylko z otwartych dzielnic (blokada w gra.js: dzień wykładu i zaliczony quiz poprzedniej dzielnicy)
  if (window.NeoGra && window.NeoGra.odblokowany) cards = cards.filter(function (c) { return window.NeoGra.odblokowany(c.m).ok; });
  var state = {};
  var memOnly = false;

  // starszy zapis (pudełka Leitnera: box, due) zamieniamy na stabilność, żeby nikt nie stracił postępów
  function migruj() {
    var ODSTEPY = [0, 1, 3, 7, 21];
    Object.keys(state).forEach(function (id) {
      var st = state[id];
      if (!st || st.s !== undefined || st.box === undefined) return;
      var due = typeof st.due === "number" ? st.due : Date.now();
      var last = due - (ODSTEPY[st.box] || 0) * DAY;
      state[id] = { s: Math.max(1, ODSTEPY[st.box] || 1), e: 2.5, n: st.box, l: 0, last: last, due: due, h: [[last, Math.max(1, ODSTEPY[st.box] || 1)]] };
    });
  }
  function load() {
    try { state = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { state = {}; memOnly = true; }
    migruj();
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { memOnly = true; }
  }
  function $(id) { return document.getElementById(id); }
  function isDue(c) { var s = state[c.id]; return !!s && s.due <= Date.now(); }
  function isNew(c) { return !state[c.id]; }
  function pamiec(st, ms) { return Math.pow(PROG, Math.max(0, ms) / DAY / st.s); }

  // nowy stan karty po ocenie: q = 0 „Nie pamiętam”, 1 „Trudne”, 2 „Pamiętam”
  function plan(st, q, now) {
    var s, e, n = st ? st.n + 1 : 1, l = st ? st.l : 0;
    if (!st) {
      e = q === 2 ? 2.5 : 2.35;
      s = q === 2 ? 3 : 1;
    } else {
      var t = Math.max(0, (now - st.last) / DAY);
      var pelnia = Math.min(1, t / st.s);           // powtórka przed terminem wzmacnia kartę tylko częściowo
      var baza = t > st.s ? st.s + (t - st.s) / 2 : st.s;  // pamiętana po terminie jest mocniejsza, niż zakładaliśmy
      e = st.e;
      if (q === 0) { e = Math.max(1.3, e - 0.2); s = Math.max(1, st.s * 0.25); l += 1; }
      else if (q === 1) { e = Math.max(1.3, e - 0.15); s = Math.max(1, baza * (1 + 0.2 * pelnia)); }
      else { e = Math.min(2.5, e + 0.05); s = Math.max(1, baza * (1 + (e - 1) * pelnia)); }   // karta raz trudna nie zostaje trudna na zawsze
    }
    s = Math.min(MAX_S, Math.round(s * 100) / 100);
    var due = now + 10 * MIN;
    if (q !== 0) {   // termin przypada na początek dnia (4:00), jak w Anki: karta jest gotowa rano, a nie o godzinie ostatniej oceny
      var d = new Date(now + Math.round(s) * DAY);
      d.setHours(4, 0, 0, 0);
      due = d.getTime();
    }
    return { s: s, e: Math.round(e * 100) / 100, n: n, l: l, last: now, due: due, h: ((st && st.h) || []).concat([[now, s]]).slice(-12) };
  }
  function odstep(st, now) {
    var ms = st.due - now;
    if (ms < 60 * MIN) return "za " + Math.max(1, Math.round(ms / MIN)) + " min";
    var d = Math.round(st.s);
    if (d <= 1) return "za 1 dzień";
    if (d < 21) return "za " + d + " dni";
    if (d < 60) return "za " + Math.round(d / 7) + " tyg.";
    return "za " + Math.round(d / 30) + " mies.";
  }

  var selMod = $("fc-mod"), selTyp = $("fc-typ"), selTryb = $("fc-tryb");
  var queue = [], current = null, flipped = false;

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function pool() {
    return cards.filter(function (c) {
      return (selMod.value === "*" || c.m === selMod.value) && (selTyp.value === "*" || c.t === selTyp.value);
    });
  }
  function statystyka() {
    var p = pool();
    $("fc-stat").textContent = "W zestawie: " + p.length + " kart · do powtórki: " + p.filter(isDue).length +
      " · nowe: " + p.filter(isNew).length +
      " · opanowane: " + p.filter(function (c) { return state[c.id] && state[c.id].s >= OPANOWANA_S; }).length +
      (memOnly ? " · zapis postępów niedostępny w tej przeglądarce" : "");
  }
  function rebuild() {
    var p = pool(), tryb = selTryb.value, now = Date.now();
    if (tryb === "due") {   // najpierw karty najbardziej zapomniane, potem nowe
      var powt = p.filter(isDue).sort(function (a, b) {
        return pamiec(state[a.id], now - state[a.id].last) - pamiec(state[b.id], now - state[b.id].last);
      });
      queue = powt.concat(p.filter(isNew));
    } else if (tryb === "shuffle") queue = shuffle(p.slice());
    else queue = p.slice();
    statystyka();
    next();
  }
  function show() {
    flipped = false;
    $("fc-card").hidden = false; $("fc-done").hidden = true;
    $("fc-tag").textContent = (current.t === "pojęcie" ? "Pojęcie" : "Pytanie") + " · temat " + current.m;
    $("fc-face").innerHTML = current.f;
    $("fc-face").className = "fc-face front";
    $("fc-flip").hidden = false;
    $("fc-flip").textContent = "Odwróć (spacja)";
    ["fc-no", "fc-hard", "fc-yes"].forEach(function (id) { $(id).hidden = true; });
    rysuj();
  }
  function next() {
    current = queue.shift() || null;
    if (!current) { $("fc-card").hidden = true; $("fc-done").hidden = false; rysuj(); return; }
    show();
  }
  function flip() {
    if (!current) return;
    flipped = !flipped;
    $("fc-face").innerHTML = flipped ? current.b : current.f;
    $("fc-face").className = "fc-face " + (flipped ? "back" : "front");
    $("fc-flip").hidden = flipped;   // po odwróceniu widać tylko oceny, jak w Anki; do pytania wraca kliknięcie w kartę
    var now = Date.now(), st = state[current.id];
    [["fc-no", 0], ["fc-hard", 1], ["fc-yes", 2]].forEach(function (b) {
      var btn = $(b[0]);
      btn.hidden = !flipped;
      btn.querySelector("small").textContent = odstep(plan(st, b[1], now), now);
    });
  }
  function rate(q) {
    if (!current || !flipped) return;
    state[current.id] = plan(state[current.id], q, Date.now());
    save();
    if (q === 0) queue.push(current); // wraca jeszcze w tej sesji
    statystyka();
    next();
  }

  // ---------------------------------------------------------------- krzywa zapominania
  var W = 320, H = 200, X0 = 36, X1 = 312, Y0 = 12, Y1 = 170;
  function x(d) { return X0 + (d - OD) / (DO - OD) * (X1 - X0); }
  function y(r) { return Y1 - r * (Y1 - Y0); }
  function sciezka(pk) { return pk.map(function (p, i) { return (i ? "L" : "M") + x(p[0]).toFixed(1) + " " + y(p[1]).toFixed(1); }).join(""); }

  function rKarty(st, now, d) {   // przewidywana pamięć karty d dni od dziś; null przed pierwszą oceną
    var t = now + d * DAY, seg = null;
    (st.h || []).forEach(function (h) { if (h[0] <= t) seg = h; });
    return seg ? Math.pow(PROG, (t - seg[0]) / DAY / seg[1]) : null;
  }
  function historia(st, now) {   // „piła”: pamięć opada, każda powtórka podnosi ją do 100%
    var pk = [], h = st.h || [];
    h.forEach(function (seg, i) {
      var od = (seg[0] - now) / DAY, kon = i + 1 < h.length ? (h[i + 1][0] - now) / DAY : 0;
      if (kon < OD) return;
      var start = Math.max(od, OD);
      for (var d = start; d < kon; d += 0.5) pk.push([d, Math.pow(PROG, (d - od) / seg[1])]);
      pk.push([kon, Math.pow(PROG, (kon - od) / seg[1])]);
    });
    return pk;
  }
  function prognoza(st, now) {
    var pk = [], od = (st.last - now) / DAY;
    for (var d = 0; d <= DO; d += 0.5) pk.push([d, Math.pow(PROG, (d - Math.min(0, od)) / st.s)]);
    return pk;
  }
  function zestawW(oc, now, d) {
    if (!oc.length) return null;
    return oc.reduce(function (a, st) { return a + pamiec(st, now + d * DAY - st.last); }, 0) / oc.length;
  }
  function proc(r) { return Math.round(r * 100) + "%"; }

  function rysuj() {
    var now = Date.now();
    var st = current ? state[current.id] : null;
    var przyklad = current && !st ? plan(null, 2, now) : null;   // nowa karta: jak opadnie pamięć po ocenie „Pamiętam”
    var oc = pool().map(function (c) { return state[c.id]; }).filter(Boolean);
    var s = "";
    [[1, "100%"], [PROG, "90%"], [0.5, "50%"], [0, "0%"]].forEach(function (t) {
      s += '<line class="fc-siatka' + (t[0] === PROG ? " prog" : "") + '" x1="' + X0 + '" x2="' + X1 + '" y1="' + y(t[0]) + '" y2="' + y(t[0]) + '"/>' +
           '<text x="' + (X0 - 5) + '" y="' + (y(t[0]) + 3) + '" text-anchor="end">' + t[1] + "</text>";
    });
    s += '<line class="fc-dzis" x1="' + x(0) + '" x2="' + x(0) + '" y1="' + Y0 + '" y2="' + Y1 + '"/>';
    [[OD, "2 tyg. temu", "start"], [0, "dziś", "middle"], [DO, "za 30 dni", "end"]].forEach(function (t) {
      s += '<text x="' + x(t[0]) + '" y="' + (Y1 + 16) + '" text-anchor="' + t[2] + '">' + t[1] + "</text>";
    });
    if (oc.length) {
      var zest = [];
      for (var d = 0; d <= DO; d++) zest.push([d, zestawW(oc, now, d)]);
      s += '<path class="fc-linia zestaw" d="' + sciezka(zest) + '"/>';
    }
    var plot = st || przyklad;
    if (plot) {
      if (st) {
        var hist = historia(st, now);
        if (hist.length) s += '<path class="fc-linia karta" d="' + sciezka(hist) + '"/>';
      }
      s += '<path class="fc-linia karta prognoza" d="' + sciezka(prognoza(plot, now)) + '"/>';
      if (st) {
        (st.h || []).forEach(function (h) {
          var d = (h[0] - now) / DAY;
          if (d >= OD) s += '<circle class="fc-kropka" r="4" cx="' + x(Math.min(d, 0)) + '" cy="' + y(1) + '"/>';
        });
        var dd = (st.due - now) / DAY;
        if (dd > 0 && dd <= DO) s += '<circle class="fc-kropka termin" r="4" cx="' + x(dd) + '" cy="' + y(pamiec(st, st.due - st.last)) + '"/>';
      }
    }
    s += '<line id="fc-celownik" class="fc-celownik" y1="' + Y0 + '" y2="' + Y1 + '" x1="0" x2="0" visibility="hidden"/>';
    var opis = [];
    if (st) {
      var teraz = pamiec(st, now - st.last);
      opis.push("Ta karta: pamięć dziś około " + proc(teraz) + (st.due > now ? ", następna powtórka " + odstep(st, now) + "." : ", czas na powtórkę."));
    } else if (przyklad) {
      opis.push("Nowa karta. Linia pokazuje, jak opadałaby pamięć po ocenie „Pamiętam”, gdyby karta nie wróciła do powtórki.");
    }
    if (oc.length) opis.push("Zestaw (" + oc.length + " ocenionych kart): dziś około " + proc(zestawW(oc, now, 0)) + ", za 7 dni bez powtórek około " + proc(zestawW(oc, now, 7)) + ".");
    else if (!current) opis.push("Oceń pierwszą kartę, a pojawi się tu krzywa zapominania.");
    var svg = $("fc-svg");
    svg.innerHTML = s;
    svg.setAttribute("aria-label", "Krzywa zapominania. " + opis.join(" "));
    $("fc-opis").textContent = opis.join(" ");
    $("fc-leg-karta").hidden = !plot;
    $("fc-leg-zestaw").hidden = !oc.length;
    odczyt.st = st; odczyt.przyklad = przyklad; odczyt.oc = oc; odczyt.now = now;
  }

  // celownik i dymek z odczytem wartości
  var odczyt = {};
  function etykietaDnia(d) {
    if (d === 0) return "dziś";
    if (d === 1) return "jutro";
    if (d === -1) return "wczoraj";
    return d > 0 ? "za " + d + " dni" : -d + " dni temu";
  }
  function wskaz(e) {
    var svg = $("fc-svg"), r = svg.getBoundingClientRect(), tip = $("fc-tip"), cel = $("fc-celownik");
    var px = (e.clientX - r.left) / r.width * W;
    if (px < X0 || px > X1) { schowaj(); return; }
    var d = Math.round(OD + (px - X0) / (X1 - X0) * (DO - OD));
    var linie = [etykietaDnia(d)];
    var karta = odczyt.st ? rKarty(odczyt.st, odczyt.now, d) : (odczyt.przyklad && d >= 0 ? pamiec(odczyt.przyklad, d * DAY) : null);
    if (karta !== null) linie.push("ta karta: " + proc(karta));
    if (d >= 0 && odczyt.oc.length) linie.push("zestaw: " + proc(zestawW(odczyt.oc, odczyt.now, d)));
    cel.setAttribute("x1", x(d)); cel.setAttribute("x2", x(d)); cel.setAttribute("visibility", "visible");
    tip.textContent = linie.join(" · ");
    tip.hidden = false;
    var lewo = x(d) / W * r.width, pol = tip.offsetWidth / 2;
    tip.style.left = Math.min(Math.max(lewo, pol), r.width - pol) + "px";
  }
  function schowaj() {
    $("fc-tip").hidden = true;
    var cel = $("fc-celownik");
    if (cel) cel.setAttribute("visibility", "hidden");
  }

  function csvCell(t) {
    var v = String(t).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (/^[=+\-@]/.test(v)) v = "'" + v; // ochrona przed formułami w arkuszu
    return '"' + v.replace(/"/g, '""') + '"';
  }
  function exportCsv() {
    var tmp = document.createElement("textarea");
    function plain(h) { tmp.innerHTML = h; return tmp.value; }
    var rows = ["przód;tył;temat;rodzaj"].concat(pool().map(function (c) {
      return [csvCell(plain(c.f)), csvCell(plain(c.b)), c.m, c.t].join(";");
    }));
    var blob = new Blob(["﻿" + rows.join("\r\n")], { type: "text/csv;charset=utf-8" });
    $("fc-csv").href = URL.createObjectURL(blob);
  }

  load();
  save();
  var qm = /[?&]temat=(\d\d)/.exec(location.search);
  if (qm && cards.some(function (c) { return c.m === qm[1]; })) selMod.value = qm[1];
  [selMod, selTyp, selTryb].forEach(function (s) { s.addEventListener("change", rebuild); });
  $("fc-flip").addEventListener("click", flip);
  $("fc-face").addEventListener("click", flip);
  $("fc-no").addEventListener("click", function () { rate(0); });
  $("fc-hard").addEventListener("click", function () { rate(1); });
  $("fc-yes").addEventListener("click", function () { rate(2); });
  $("fc-svg").addEventListener("pointermove", wskaz);
  $("fc-svg").addEventListener("pointerleave", schowaj);
  $("fc-csv").addEventListener("click", exportCsv);
  $("fc-reset").addEventListener("click", function () {
    if (confirm("Wyzerować postępy wszystkich fiszek w tej przeglądarce?")) { state = {}; save(); rebuild(); }
  });
  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;   // Ctrl+1, Ctrl+2 to karty przeglądarki, nie ocena fiszki
    if (/^(INPUT|SELECT|TEXTAREA|BUTTON|A|SUMMARY)$/.test((e.target || {}).tagName)) return;   // Enter na linku otwiera link
    if (e.key === " " || e.key === "Enter") { e.preventDefault(); flip(); }
    else if (e.key === "1") rate(0);
    else if (e.key === "2") rate(1);
    else if (e.key === "3") rate(2);
  });
  rebuild();
})();
