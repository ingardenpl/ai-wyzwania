/* Fiszki: odwracanie karty i powtórki w odstępach (pudełka Leitnera). Bez zależności.
   Postęp zapisuje się wyłącznie w localStorage tej przeglądarki; gdy jest niedostępny, fiszki działają bez zapisu. */
(function () {
  "use strict";
  var KEY = "neo-fiszki-v1";
  var INTERVALS = [0, 1, 3, 7, 21]; // dni do następnej powtórki dla pudełka 0..4
  var DAY = 86400000;
  var dataEl = document.getElementById("fc-data");
  if (!dataEl) return;
  var cards = JSON.parse(dataEl.textContent);
  var state = {};
  var memOnly = false;

  function load() {
    try { state = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { state = {}; memOnly = true; }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { memOnly = true; }
  }
  function $(id) { return document.getElementById(id); }
  function isDue(c) { var s = state[c.id]; return !s || s.due <= Date.now(); }

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
  function rebuild() {
    var p = pool(), tryb = selTryb.value;
    if (tryb === "due") queue = p.filter(isDue).sort(function (a, b) { return ((state[a.id] || {}).box || 0) - ((state[b.id] || {}).box || 0); });
    else if (tryb === "shuffle") queue = shuffle(p.slice());
    else queue = p.slice();
    var learned = p.filter(function (c) { return state[c.id] && state[c.id].box >= 3; }).length;
    $("fc-stat").textContent = "W zestawie: " + p.length + " kart · do powtórki teraz: " + p.filter(isDue).length +
      " · opanowane: " + learned + (memOnly ? " · zapis postępów niedostępny w tej przeglądarce" : "");
    next();
  }
  function show() {
    flipped = false;
    $("fc-card").hidden = false; $("fc-done").hidden = true;
    $("fc-tag").textContent = (current.t === "pojęcie" ? "Pojęcie" : "Pytanie") + " · temat " + current.m;
    $("fc-face").innerHTML = current.f;
    $("fc-face").className = "fc-face front";
    $("fc-flip").hidden = false; $("fc-no").hidden = true; $("fc-yes").hidden = true;
  }
  function next() {
    current = queue.shift() || null;
    if (!current) { $("fc-card").hidden = true; $("fc-done").hidden = false; return; }
    show();
  }
  function flip() {
    if (!current) return;
    flipped = !flipped;
    $("fc-face").innerHTML = flipped ? current.b : current.f;
    $("fc-face").className = "fc-face " + (flipped ? "back" : "front");
    $("fc-no").hidden = !flipped; $("fc-yes").hidden = !flipped;
    $("fc-flip").textContent = flipped ? "Odwróć z powrotem" : "Odwróć (spacja)";
  }
  function rate(ok) {
    if (!current || !flipped) return;
    var s = state[current.id] || { box: 0 };
    s.box = ok ? Math.min(s.box + 1, INTERVALS.length - 1) : 0;
    s.due = Date.now() + INTERVALS[s.box] * DAY;
    state[current.id] = s; save();
    if (!ok) queue.push(current); // wraca jeszcze w tej sesji
    var p = pool();
    $("fc-stat").textContent = "W zestawie: " + p.length + " kart · do powtórki teraz: " + p.filter(isDue).length +
      " · opanowane: " + p.filter(function (c) { return state[c.id] && state[c.id].box >= 3; }).length;
    $("fc-flip").textContent = "Odwróć (spacja)";
    next();
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
  var qm = /[?&]temat=(\d\d)/.exec(location.search);
  if (qm && cards.some(function (c) { return c.m === qm[1]; })) selMod.value = qm[1];
  [selMod, selTyp, selTryb].forEach(function (s) { s.addEventListener("change", rebuild); });
  $("fc-flip").addEventListener("click", flip);
  $("fc-face").addEventListener("click", flip);
  $("fc-yes").addEventListener("click", function () { rate(true); });
  $("fc-no").addEventListener("click", function () { rate(false); });
  $("fc-csv").addEventListener("click", exportCsv);
  $("fc-reset").addEventListener("click", function () {
    if (confirm("Wyzerować postępy wszystkich fiszek w tej przeglądarce?")) { state = {}; save(); rebuild(); }
  });
  document.addEventListener("keydown", function (e) {
    if (/^(INPUT|SELECT|TEXTAREA)$/.test((e.target || {}).tagName)) return;
    if (e.key === " " || e.key === "Enter") { if (e.target && e.target.tagName === "BUTTON") return; e.preventDefault(); flip(); }
    else if (e.key === "1") rate(false);
    else if (e.key === "2") rate(true);
  });
  rebuild();
})();
