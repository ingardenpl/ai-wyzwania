/* NEO-LUBLIN 2049: stan gry liczony w przeglądarce (plan: PLAN_DZIELNIC.md, etap 0).
   1. Stan dzielnic (past / next / future) wynika z dat spotkań i dzisiejszej daty, więc dzielnica otwiera się
      sama w dniu spotkania, bez przebudowy strony. Daty przychodzą z build.py w <script id="city-data">.
      Ten skrypt ładuje się w <head>, a jego obsługa DOMContentLoaded działa przed miasto.js: poprawia stany
      w #city-data, znaczniki, listę dzielnic, misję i ekwipunek tylko wtedy, gdy różnią się od zbudowanych.
   2. Postęp gracza: jeden zapis „neo-gra” z numerem wersji. Przy pierwszym odczycie przejmuje stare
      zaliczenia quizów („neo-zaliczone”), które zostają też uzupełniane dla zgodności.
   3. Artefakt dzielnicy: termin spotkania minął ORAZ quiz ≥ 60%; w dzielnicy z wnętrzem do zwiedzania
      dodatkowo zadanie i co najmniej 5 z 7 miejsc.
   Gra nie jest częścią oceny: wszystko zostaje w tej przeglądarce i nic nie jest wysyłane. */
(function () {
  "use strict";
  var KLUCZ = "neo-gra", WERSJA = 1, PROG_QUIZ = 0.6, PROG_MIEJSCA = 5;
  var NR = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"];

  function czytaj(k, def) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch (e) { return def; } }
  function pisz(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function q(name) { var m = new RegExp("[?&]" + name + "=([^&#]*)").exec(location.search); return m ? decodeURIComponent(m[1]) : null; }

  function podglad() { return q("podglad") === "prowadzacy" || czytaj("neo-podglad", false) === true; }
  // dzisiejsza data lokalna (RRRR-MM-DD); ?dzien=RRRR-MM-DD symuluje inny dzień (test prowadzącego)
  function dzis() {
    var t = q("dzien");
    if (t && /^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
    var d = new Date();
    return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
  }

  var _dane = null;
  function dane() {
    if (_dane) return _dane;
    var e = document.getElementById("city-data");
    try { _dane = e ? JSON.parse(e.textContent) : null; } catch (x) { _dane = null; }
    return _dane || { districts: [] };
  }

  // stany jak w build.py (city_states): past = wszystkie terminy ≤ dziś; next = najbliższy termin; reszta future
  function stany() {
    var d = dane(), dz = dzis(), out = {}, info = d.info || {}, soonest = null;
    NR.forEach(function (n) {
      var t = (info[n] && info[n].sloty) || [];
      if (!t.length) return;
      var past = t.every(function (s) { return s.d && s.d <= dz; });
      if (!past) {
        var nast = t.filter(function (s) { return !s.d || s.d > dz; })[0];
        if (nast && nast.d && (!soonest || nast.d < soonest)) soonest = nast.d;
      }
      out[n] = past ? "past" : null;
    });
    var pierwsza = true;   // jak w build.py: bez żadnej daty „next” dostaje pierwsza nieodbyta dzielnica
    NR.forEach(function (n) {
      if (out[n] !== null) return;
      var nast = info[n].sloty.filter(function (s) { return !s.d || s.d > dz; })[0];
      if ((soonest && nast && nast.d === soonest) || (!soonest && pierwsza)) { out[n] = "next"; pierwsza = false; }
      else out[n] = "future";
    });
    (d.districts || []).forEach(function (x) { if (!out[x.nr]) out[x.nr] = x.state; });   // brak dat: stan z budowy
    return out;
  }
  function nastepnyTermin(n) {
    var info = (dane().info || {})[n], dz = dzis();
    if (!info) return null;
    return info.sloty.filter(function (s) { return !s.d || s.d > dz; })[0] || null;
  }

  // ------------------------------------------------------------------ zapis postępu
  function stan() {
    var s = czytaj(KLUCZ, null);
    if (!s || s.v !== WERSJA) {
      s = { v: WERSJA, quizy: {}, miejsca: {}, zadania: {}, znaleziska: {}, ratusz: {} };
      czytaj("neo-zaliczone", []).forEach(function (n) { if (/^\d\d$/.test(n)) s.quizy[n] = PROG_QUIZ; });
      pisz(KLUCZ, s);
    }
    ["quizy", "miejsca", "zadania", "znaleziska", "ratusz"].forEach(function (k) { if (!s[k] || typeof s[k] !== "object") s[k] = {}; });
    return s;
  }
  function zmien(fn) { var s = stan(); fn(s); pisz(KLUCZ, s); document.dispatchEvent(new CustomEvent("neo:postep")); return s; }

  function zapiszQuiz(n, wynik) {
    if (!/^\d\d$/.test(n) || typeof wynik !== "number") return;
    zmien(function (s) { if (!(s.quizy[n] >= wynik)) s.quizy[n] = wynik; });
    if (wynik >= PROG_QUIZ) {   // zgodność ze starszym zapisem
      var l = czytaj("neo-zaliczone", []);
      if (l.indexOf(n) < 0) { l.push(n); l.sort(); pisz("neo-zaliczone", l); }
    }
  }
  function zapiszMiejsce(n, id) { zmien(function (s) { var l = s.miejsca[n] = s.miejsca[n] || []; if (l.indexOf(id) < 0) l.push(id); }); }
  function zapiszZadanie(n, v) { zmien(function (s) { if (v === false) delete s.zadania[n]; else s.zadania[n] = true; }); }
  function zapiszZnalezisko(n, id) { zmien(function (s) { var l = s.znaleziska[n] = s.znaleziska[n] || []; if (l.indexOf(id) < 0) l.push(id); }); }

  // ------------------------------------------------------------------ artefakty
  function wnetrze(n) { var i = (dane().info || {})[n]; return !!(i && i.wnetrze); }
  function artefakt(n) {
    if (podglad()) return true;
    if (stany()[n] !== "past") return false;
    var s = stan();
    if (!(s.quizy[n] >= PROG_QUIZ)) return false;
    if (!wnetrze(n)) return true;
    return !!s.zadania[n] && (s.miejsca[n] || []).length >= PROG_MIEJSCA;
  }
  function artefakty() { return NR.filter(artefakt); }

  window.NeoGra = {
    dzis: dzis, stany: stany, nastepnyTermin: nastepnyTermin, podglad: podglad, dane: dane,
    stan: stan, zapiszQuiz: zapiszQuiz, zapiszMiejsce: zapiszMiejsce, zapiszZadanie: zapiszZadanie, zapiszZnalezisko: zapiszZnalezisko,
    artefakt: artefakt, artefakty: artefakty, wnetrze: wnetrze,
    otwarta: function (n) { return podglad() || stany()[n] === "past"; },
    PROG_QUIZ: PROG_QUIZ, PROG_MIEJSCA: PROG_MIEJSCA
  };

  // ------------------------------------------------------------------ poprawki strony (przed miasto.js)
  function txt(s) { return document.createTextNode(s); }
  function el(tag, cls, t) { var e = document.createElement(tag); if (cls) e.className = cls; if (t != null) e.textContent = t; return e; }

  document.addEventListener("DOMContentLoaded", function () {
    var src = document.getElementById("city-data");
    if (!src) return;
    var d = dane(), st = stany(), info = d.info || {};
    var zmiana = (d.districts || []).some(function (x) { return st[x.nr] && st[x.nr] !== x.state; });
    if (zmiana) {
      d.districts = (d.districts || []).map(function (x) { return { nr: x.nr, state: st[x.nr] || x.state }; });
      src.textContent = JSON.stringify(d);
      // znaczniki na mapie i lista dzielnic
      document.querySelectorAll(".city-marker[data-nr]").forEach(function (m) {
        var n = m.getAttribute("data-nr");
        m.classList.remove("past", "next", "future"); m.classList.add(st[n]);
      });
      document.querySelectorAll("ol.sessions a.session").forEach(function (a) {
        var n = (a.querySelector(".num") || {}).textContent;
        if (!st[n]) return;
        a.classList.remove("past", "next", "future"); a.classList.add(st[n]);
        var ch = a.querySelector(".chips");
        if (!ch) return;
        var nx = ch.querySelector(".nextc");
        if (st[n] === "next" && !nx) ch.insertBefore(el("span", "chip nextc", "następne zlecenie"), ch.firstChild);
        if (st[n] !== "next" && nx) nx.remove();
        var dn = ch.querySelector(".chip.done");
        if (st[n] === "past" && !dn) ch.insertBefore(el("span", "chip done", "odbyło się"), ch.querySelector(".chip.on") || null);
        if (st[n] !== "past" && dn) dn.remove();
      });
      // misja i pager na mapie głównej
      var nast = NR.filter(function (n) { return st[n] === "next"; });
      var mis = document.querySelector(".hud .mission");
      if (mis && nast.length && info[nast[0]]) {
        var t = nastepnyTermin(nast[0]);
        mis.textContent = "";
        mis.appendChild(el("p", "eyebrow", "Następne zlecenie · " + (t ? t.t : "termin do ustalenia")));
        nast.forEach(function (n, i) {
          if (i) mis.appendChild(txt(" + "));
          var a = el("a", null, info[n].nazwa + ": " + info[n].miejsce); a.href = "moduly/" + info[n].slug + "/index.html"; mis.appendChild(a);
        });
        var p = el("p", "muted", info[nast[0]].zlecenie); p.style.margin = ".3em 0 0"; mis.appendChild(p);
        var pg = document.querySelector(".pager-lcd .scroll");
        if (pg) {
          var msg = "INSPEKTORZE, NASTĘPNE ZLECENIE: " + nast.map(function (n) { return info[n].nazwa + " · " + info[n].miejsce; }).join(" + ") +
            " · " + (t ? t.t : "") + ". DO ZDOBYCIA: " + nast.map(function (n) { return info[n].przedmiot; }).join(" + ") + ". NIE UFAJ ECHO BEZ SPRAWDZENIA ŹRÓDŁA.";
          pg.textContent = ""; pg.appendChild(el("span", "who", "ARCHIWISTKA ›")); pg.appendChild(txt(" " + msg.toUpperCase()));
          pg.parentNode.setAttribute("aria-label", "Wiadomość od Archiwistki: " + msg);
        }
      }
    }
    // ekwipunek: artefakt zamiast samej daty (zawsze, bo zależy od postępu gracza)
    var art = artefakty();
    document.querySelectorAll(".inventory canvas[data-icon]").forEach(function (cv) {
      var n = cv.getAttribute("data-icon");
      if (!/^\d\d$/.test(n)) return;
      var ma = art.indexOf(n) >= 0, slot = cv.parentNode;
      if (ma) cv.setAttribute("data-on", ""); else cv.removeAttribute("data-on");
      slot.classList.toggle("on", ma);
      var i = info[n];
      if (i) slot.title = i.przedmiot + " (dzielnica " + n + ", " + (ma ? "zdobyty" : st[n] === "past" ? "do zdobycia: quiz ≥ 60%" + (i.wnetrze ? ", zadanie i 5 z 7 miejsc" : "") : "dzielnica otworzy się w dniu spotkania") + ")";
    });
    var inv = document.querySelector(".inventory .lbl");
    if (inv) { inv.textContent = "EKWIPUNEK " + art.length + "/10"; inv.parentNode.setAttribute("aria-label", "Ekwipunek: zdobyte artefakty " + art.length + " z 10"); }
    // karta przedmiotu na stronie dzielnicy
    var foc = document.querySelector("canvas[data-focus]"), card = document.querySelector(".item-card");
    if (foc && card) {
      var n = foc.getAttribute("data-focus"), ma2 = artefakt(n), cv2 = card.querySelector("canvas[data-icon]"), b = card.querySelector("b");
      if (cv2) { if (ma2) cv2.setAttribute("data-on", ""); else cv2.removeAttribute("data-on"); }
      if (b) b.textContent = ma2 ? "Artefakt zdobyty" : "Artefakt do zdobycia";
      var w = card.querySelector(".item-war") || el("small", "item-war");
      w.textContent = ma2 ? "" : st[n] !== "past" ? "Dzielnica otworzy się w dniu spotkania." :
        "Warunek: quiz dzielnicy ≥ 60%" + (wnetrze(n) ? ", wykonane zadanie i 5 z 7 miejsc we wnętrzu dzielnicy." : ".");
      if (!w.parentNode) card.lastElementChild.appendChild(w);
    }
  });
})();
