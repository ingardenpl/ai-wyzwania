/* NEO-LUBLIN 2049: tryb eksploracji mapy głównej.
   Inspektor chodzi po ulicach i wnętrzach dzielnic, wchodzi do dzielnic (E), znajduje ukryte
   „wiadomości z sieci” (prawdziwe wydarzenia o AI w Polsce, dane w jajka.js) i schodzi włazem
   do podziemi Starego Miasta, gdy wszystkie dzielnice są zaliczone.
   Odblokowanie: po czterech odbytych spotkaniach (NeoPostep.eksploracja()).
   Postęp i znalezione wiadomości zapisują się tylko w tej przeglądarce (localStorage).
   Dołączany przez miasto.js; nie wymaga zmian w build.py. */
(function () {
  "use strict";
  var cv = document.getElementById("city-main");
  if (!cv) return;
  var box = cv.closest(".city-map");
  var P = window.NeoPostep;
  var BASE = (document.currentScript && document.currentScript.src || "").replace(/eksploracja\.js(\?.*)?$/, "");
  var KEY_JAJKA = "neo-jajka";

  function readJSON(k, def) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch (e) { return def; } }
  function writeJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function cityData() { var e = document.getElementById("city-data"); try { return e ? JSON.parse(e.textContent) : {}; } catch (x) { return {}; } }
  function swiatOtwarty() {
    var pd = cityData().podziemia || {};
    if (pd.jawne || P.zaliczone().length >= 10) return true;
    try { return localStorage.getItem("neo-podziemia") === "1"; } catch (e) { return false; }
  }

  // dane wiadomości (jajka.js) i dopiero potem start
  var s = document.createElement("script");
  s.src = BASE + "jajka.js";
  s.onload = s.onerror = function () { waitCity(init); };
  document.body.appendChild(s);
  function waitCity(cb) { if (cv._city) cb(cv._city); else setTimeout(function () { waitCity(cb); }, 80); }

  function init(city) {
    var T = city.T, W = city.W, H = city.H, grid = city.grid, TL = city.tiles, HATCH = city.hatch, D = city.districts;
    var JAJKA = (window.NEO_JAJKA || []).slice();

    // ---------------------------------------------------------------- przycisk i stany
    var sw = document.querySelector(".mode-switch");
    var btn = el("button", "ex-btn", "EKSPLORUJ");
    btn.type = "button";
    btn.setAttribute("aria-pressed", "false");
    var odbyte = P.past().length, wolno = P.eksploracja();
    if (!wolno) {
      btn.disabled = true;
      btn.textContent = "EKSPLORUJ · " + Math.min(odbyte, 4) + "/4";
      btn.title = "Tryb eksploracji otwiera się po czterech odbytych spotkaniach (" + Math.min(odbyte, 4) + "/4).";
    } else {
      btn.title = "Chodź po mieście: strzałki lub WASD, E wchodzi, Esc kończy. Na telefonie przyciski na mapie albo dotknięcie celu.";
    }
    if (sw) sw.appendChild(btn);
    // pełny ekran w trybie eksploracji (na telefonie mapa ma ok. 340 px szerokości); klasa CSS zamiast Fullscreen API,
    // bo iOS nie pozwala na pełny ekran zwykłych elementów
    var fullBtn = el("button", "ex-btn ex-full-btn", "PEŁNY EKRAN");
    fullBtn.type = "button"; fullBtn.hidden = true; fullBtn.setAttribute("aria-pressed", "false");
    if (sw) sw.appendChild(fullBtn);
    var full = false;
    function setFull(v) {
      full = v; box.classList.toggle("ex-full", v); document.documentElement.classList.toggle("ex-full-on", v);
      fullBtn.setAttribute("aria-pressed", String(v)); fullBtn.textContent = v ? "ZAMKNIJ PEŁNY EKRAN" : "PEŁNY EKRAN";
      if (v) { box.appendChild(fullBtn); } else if (sw) { sw.appendChild(fullBtn); }
      if (on) box.focus({ preventScroll: true });
    }
    fullBtn.addEventListener("click", function () { setFull(!full); });

    var hud = el("div", "ex-hud"); hud.setAttribute("aria-hidden", "true");
    var prompt = el("div", "ex-prompt"); prompt.hidden = true;
    var promptTxt = el("span", "ex-prompt-t"); var promptBtn = el("button", "ex-prompt-b", "E");
    promptBtn.type = "button"; prompt.appendChild(promptBtn); prompt.appendChild(promptTxt);
    var live = el("p", "sr-only"); live.setAttribute("aria-live", "polite");
    var card = el("aside", "ex-card"); card.hidden = true; card.setAttribute("aria-live", "polite");
    var pad = el("div", "ex-pad"); pad.hidden = true; pad.setAttribute("aria-label", "Sterowanie inspektorem");
    [["up", "▲", "Idź w górę"], ["left", "◀", "Idź w lewo"], ["down", "▼", "Idź w dół"], ["right", "▶", "Idź w prawo"]].forEach(function (b) {
      var x = el("button", "ex-pad-" + b[0], b[1]); x.type = "button"; x.setAttribute("aria-label", b[2]); x.dataset.dir = b[0]; pad.appendChild(x);
    });
    box.appendChild(hud); box.appendChild(prompt); box.appendChild(card); box.appendChild(pad); box.appendChild(live);

    // notes: znalezione wiadomości jako zwykła lista pod mapą (bez gry)
    var notes = el("details", "ex-notes");
    var notesSum = el("summary"); notes.appendChild(notesSum);
    var notesList = el("ol"); notes.appendChild(notesList);
    var hudBox = document.querySelector(".hud");
    if (hudBox && hudBox.parentNode) hudBox.parentNode.insertBefore(notes, hudBox.nextSibling);

    // ---------------------------------------------------------------- świat gry
    function walk(x, y) {
      var tx = Math.floor(x / T), ty = Math.floor(y / T);
      if (tx < 0 || ty < 0 || tx >= grid[0].length || ty >= grid.length) return false;
      var t = grid[ty][tx];
      if (t === TL.WATER) return false;
      return t === TL.ROAD || !!city.zoneOf(tx, ty);
    }
    // rozmieszczenie wiadomości: deterministycznie na kafelkach do chodzenia, z odstępami
    (function rozmiesc() {
      var seed = 1578, rnd = function () { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
      var spots = [];
      for (var ty = 0; ty < grid.length; ty++) for (var tx = 0; tx < grid[0].length; tx++) {
        var cx = tx * T + T / 2, cy = ty * T + T / 2;
        if (walk(cx, cy) && Math.hypot(cx - HATCH.x, cy - HATCH.y) > 30 && cx > 30) spots.push([cx, cy]);
      }
      var used = [];
      JAJKA.forEach(function (j) {
        for (var k = 0; k < 400; k++) {
          var sp = spots[Math.floor(rnd() * spots.length)];
          if (used.every(function (u) { return Math.hypot(u[0] - sp[0], u[1] - sp[1]) > 42; })) { j._x = sp[0]; j._y = sp[1]; used.push(sp); break; }
        }
        if (j._x == null) { var sp2 = spots[Math.floor(rnd() * spots.length)]; j._x = sp2[0]; j._y = sp2[1]; }
      });
    })();

    var me = { x: 8, y: 20 * T + 6, dir: "right", step: 0 };
    var keys = {}, target = null, on = false, here = null, openCard = null;
    var found = readJSON(KEY_JAJKA, []);

    function updateNotes() {
      notesSum.textContent = "Wiadomości z sieci: znalezione " + found.length + " z " + JAJKA.length;
      notesList.innerHTML = "";
      JAJKA.filter(function (j) { return found.indexOf(j.id) >= 0; }).forEach(function (j) {
        var li = el("li"); li.appendChild(cardBody(j)); notesList.appendChild(li);
      });
      notes.hidden = !wolno && found.length === 0;
      hud.textContent = "ZALICZONE " + P.zaliczone().length + "/10 · WIADOMOŚCI " + found.length + "/" + JAJKA.length;
    }
    function cardBody(j) {
      var f = document.createDocumentFragment();
      f.appendChild(el("p", "ex-card-k", "WIADOMOŚĆ Z SIECI · " + (j.kategoria || "").toUpperCase() + (j.data ? " · " + j.data : "")));
      f.appendChild(el("h3", "ex-card-h", j.tytul));
      f.appendChild(el("p", null, j.tresc));
      if (j.pytanie) { var q = el("p", "ex-card-q"); q.appendChild(el("b", null, "Pytanie inspektora: ")); q.appendChild(document.createTextNode(j.pytanie)); f.appendChild(q); }
      var src = el("p", "ex-card-s");
      if (j.zrodlo_url) { var a = el("a", null, j.zrodlo_tytul || "Źródło"); a.href = j.zrodlo_url; a.target = "_blank"; a.rel = "noopener"; src.appendChild(document.createTextNode("Źródło: ")); src.appendChild(a); }
      if (j.temat) { var mk = document.querySelector('.city-marker[data-nr="' + j.temat + '"]'); if (mk) { src.appendChild(document.createTextNode(" · Więcej: ")); var a2 = el("a", null, "dzielnica " + j.temat); a2.href = mk.getAttribute("href"); src.appendChild(a2); } }
      f.appendChild(src);
      return f;
    }
    function showCard(j) {
      openCard = j;
      card.innerHTML = "";
      card.appendChild(cardBody(j));
      var c = el("button", "ex-card-x", "Zamknij (Esc)"); c.type = "button";
      c.addEventListener("click", closeCard); card.appendChild(c);
      card.hidden = false;
    }
    function closeCard() { card.hidden = true; openCard = null; if (on) box.focus(); }

    // ---------------------------------------------------------------- miejsce, w którym stoi inspektor
    function where() {
      if (Math.hypot(me.x - (HATCH.x + 3), me.y - (HATCH.y + 2)) < 9) return { typ: "wlaz" };
      var k = city.zoneOf(Math.floor(me.x / T), Math.floor(me.y / T));
      return k ? { typ: "dz", nr: k } : null;
    }
    function same(a, b) { return (!a && !b) || (a && b && a.typ === b.typ && a.nr === b.nr); }
    function updatePrompt() {
      var w = where();
      if (same(w, here)) return;
      here = w;
      if (!w) { prompt.hidden = true; return; }
      var txt;
      if (w.typ === "wlaz") {
        txt = swiatOtwarty() ? "ZEJDŹ DO PODZIEMI STAREGO MIASTA" : "WŁAZ ZAMKNIĘTY · ZALICZONE DZIELNICE " + P.zaliczone().length + "/10";
      } else {
        var st = (city.states || {})[w.nr] || "past";
        var ob = window.NeoGra && window.NeoGra.odblokowany ? window.NeoGra.odblokowany(w.nr) : { ok: st === "past" || P.podglad(), data: st === "past" };
        txt = (ob.ok ? "WEJDŹ: " : ob.data ? "ZAMKNIĘTE: " : "MGŁA: ") + w.nr + " · " + D[w.nr].name.toUpperCase() +
          (ob.ok ? "" : ob.data ? " · NAJPIERW QUIZ DZIELNICY " + ob.poprzedni : " · OTWARCIE W DNIU SPOTKANIA");
      }
      promptTxt.textContent = txt;
      prompt.hidden = false;
      live.textContent = (w.typ === "wlaz" ? "Właz na Rynku. " : "Jesteś w dzielnicy " + D[w.nr].name + ". ") + "Naciśnij E.";
    }
    function act() {
      if (openCard) { closeCard(); return; }
      var w = where();
      if (!w) return;
      if (w.typ === "wlaz") {
        if (swiatOtwarty()) location.href = "podziemia.html";
        else live.textContent = "Właz jest zamknięty. Zalicz wszystkie dzielnice: quiz zdany po terminie spotkania.";
        return;
      }
      var mk = document.querySelector('.city-marker[data-nr="' + w.nr + '"]');
      var stn = (city.states || {})[w.nr] || "past";
      var odb = window.NeoGra && window.NeoGra.odblokowany ? window.NeoGra.odblokowany(w.nr) : null;
      if (odb && !odb.ok && odb.data && odb.poprzedni) {   // dzień wykładu minął, ale poprzednia dzielnica niezaliczona
        live.textContent = "Dzielnica " + D[w.nr].name + " jest zamknięta: najpierw zalicz quiz dzielnicy " + odb.poprzedni + " na co najmniej 60%.";
        promptTxt.textContent = "ZAMKNIĘTE · NAJPIERW QUIZ DZIELNICY " + odb.poprzedni;
        return;
      }
      if ((odb ? !odb.ok : stn !== "past") && !P.podglad()) {   // dzielnica otwiera się w dniu spotkania
        var t = window.NeoGra && window.NeoGra.nastepnyTermin(w.nr);
        live.textContent = "Dzielnica " + D[w.nr].name + " jest jeszcze we mgle. Otworzy się w dniu spotkania" + (t ? ": " + t.t : "") + ". Materiały są już na stronie dzielnicy.";
        promptTxt.textContent = "MGŁA · OTWARCIE " + (t ? t.t.split(" · ")[0] : "W DNIU SPOTKANIA");
        return;
      }
      if (mk) location.href = mk.getAttribute("href") + (window.NeoGra && window.NeoGra.wnetrze(w.nr) ? "#wnetrze" : "");
    }
    promptBtn.addEventListener("click", act);
    promptTxt.addEventListener("click", act);

    // ---------------------------------------------------------------- ruch
    var DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
    var KEYMAP = { ArrowUp: "up", KeyW: "up", ArrowDown: "down", KeyS: "down", ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right" };
    var SPEED = 1.35, raf = null;
    function tryMove(dx, dy) {
      var nx = me.x + dx, ny = me.y + dy;
      if (walk(nx, ny)) { me.x = nx; me.y = ny; return true; }
      if (dx && walk(nx, me.y)) { me.x = nx; return true; }   // ślizg wzdłuż ściany
      if (dy && walk(me.x, ny)) { me.y = ny; return true; }
      return false;
    }
    function tick() {
      raf = null;
      if (!on) return;
      var dx = 0, dy = 0;
      Object.keys(keys).forEach(function (k) { if (keys[k]) { dx += DIRS[k][0]; dy += DIRS[k][1]; } });
      if (dx || dy) target = null;
      else if (target) {
        var tx = target[0] - me.x, ty = target[1] - me.y, d = Math.hypot(tx, ty);
        if (d < 2) target = null; else { dx = tx / d; dy = ty / d; }
      }
      var moving = false;
      if (dx || dy) {
        var n = Math.hypot(dx, dy) || 1;
        moving = tryMove(dx / n * SPEED, dy / n * SPEED);
        if (!moving) target = null;
        me.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up");
        me.step++;
      }
      // wiadomości
      JAJKA.forEach(function (j) {
        if (found.indexOf(j.id) < 0 && Math.hypot(j._x - me.x, j._y - me.y) < 7) {
          found.push(j.id); writeJSON(KEY_JAJKA, found); updateNotes(); showCard(j);
          if (window.NeoUI) window.NeoUI.banner("WIADOMOŚĆ Z SIECI", found.length + " / " + JAJKA.length);
        }
      });
      updatePrompt();
      city.render();
      if (moving || target || Object.keys(keys).some(function (k) { return keys[k]; })) raf = requestAnimationFrame(tick);
    }
    function kick() { if (!raf) raf = requestAnimationFrame(tick); }

    // ---------------------------------------------------------------- rysowanie (wołane przez miasto.js w każdej klatce)
    city.onDraw = function (c, t, mode) {
      if (!on) return;
      // wiadomości: widoczne z bliska jako migoczący piksel danych, znalezione jako przygaszony znak
      JAJKA.forEach(function (j) {
        var d = Math.hypot(j._x - me.x, j._y - me.y), got = found.indexOf(j.id) >= 0;
        if (got) { c.save(); c.globalAlpha = 0.5; c.fillStyle = "#7df9ff"; c.fillRect(j._x - 1, j._y - 1, 2, 2); c.restore(); }
        else if (d < 30 && (t + j._x) % 20 < 12) { c.save(); c.globalAlpha = 0.35; c.fillStyle = "#ff2a6d"; c.fillRect(j._x - 3, j._y - 3, 6, 6); c.restore(); c.fillStyle = "#ffffff"; c.fillRect(j._x - 1, j._y - 1, 2, 2); }
      });
      var x = Math.round(me.x), y = Math.round(me.y);
      if (mode === "siec") { // w cyberprzestrzeni inspektor to sygnał
        c.save(); c.globalAlpha = 0.35; c.fillStyle = "#fcee0a"; c.fillRect(x - 4, y - 4, 9, 9); c.restore();
        c.fillStyle = "#fcee0a"; c.fillRect(x - 1, y - 1, 3, 3); return;
      }
      // światło latarki
      c.save(); c.globalAlpha = 0.16; c.fillStyle = "#fff6c2"; c.beginPath(); c.arc(x, y - 3, 11, 0, Math.PI * 2); c.fill(); c.restore();
      // cień i postać 5×8 px: kapelusz, twarz, prochowiec, nogi
      c.save(); c.globalAlpha = 0.45; c.fillStyle = "#000"; c.fillRect(x - 2, y + 1, 6, 2); c.restore();
      var leg = (me.step >> 3) % 2;
      c.fillStyle = "#14161f"; c.fillRect(x - 3, y - 8, 7, 1); c.fillRect(x - 2, y - 9, 5, 1);   // kapelusz
      c.fillStyle = "#e0b48a"; c.fillRect(x - 1, y - 7, 3, 2);                                    // twarz
      c.fillStyle = "#b8893a"; c.fillRect(x - 2, y - 5, 5, 4);                                    // prochowiec
      c.fillStyle = "#fcee0a"; c.fillRect(me.dir === "left" ? x - 3 : x + 3, y - 4, 1, 1);        // latarka
      c.fillStyle = "#2a2e3a"; c.fillRect(x - 2 + leg, y - 1, 1, 2); c.fillRect(x + 1 - leg, y - 1, 1, 2); // nogi
    };

    // ---------------------------------------------------------------- włącz / wyłącz
    function start() {
      on = true; btn.setAttribute("aria-pressed", "true"); btn.textContent = "KONIEC EKSPLORACJI";
      box.classList.add("exploring"); box.setAttribute("tabindex", "0"); box.focus({ preventScroll: true });
      pad.hidden = false; fullBtn.hidden = false; updateNotes(); here = undefined; updatePrompt(); city.render();
      live.textContent = "Tryb eksploracji. Strzałki lub WASD: ruch, E: wejście, Esc: koniec.";
    }
    function stop() {
      on = false; keys = {}; target = null; btn.setAttribute("aria-pressed", "false"); btn.textContent = "EKSPLORUJ";
      if (full) setFull(false);
      fullBtn.hidden = true;
      box.classList.remove("exploring"); box.removeAttribute("tabindex"); pad.hidden = true; prompt.hidden = true; card.hidden = true; openCard = null;
      city.render();
    }
    btn.addEventListener("click", function () { if (on) stop(); else start(); });

    function typing(e) {
      var a = e.target || document.activeElement;
      return a && (a.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName));
    }
    document.addEventListener("keydown", function (e) {
      if (!on || typing(e) || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "Escape") { if (openCard) closeCard(); else if (full) setFull(false); else stop(); e.preventDefault(); return; }
      // E działa zawsze w trybie eksploracji; Enter i spacja tylko na samej mapie,
      // żeby nie przejmować przycisków, linków i rozwijanych list (dostępność klawiatury)
      if (e.code === "KeyE" || ((e.key === "Enter" || e.key === " ") && e.target === box)) {
        act(); e.preventDefault(); return;
      }
      var d = KEYMAP[e.code] || KEYMAP[e.key];
      if (d) { keys[d] = true; e.preventDefault(); kick(); }
    });
    document.addEventListener("keyup", function (e) { var d = KEYMAP[e.code] || KEYMAP[e.key]; if (d) keys[d] = false; });
    window.addEventListener("blur", function () { keys = {}; });

    // dotyk i mysz: krzyżak oraz „idź tutaj”
    pad.addEventListener("pointerdown", function (e) { var d = e.target.dataset && e.target.dataset.dir; if (d) { keys[d] = true; kick(); e.preventDefault(); } });
    ["pointerup", "pointerleave", "pointercancel"].forEach(function (ev) { pad.addEventListener(ev, function () { keys = {}; }); });
    cv.addEventListener("pointerdown", function (e) {
      if (!on) return;
      var r = cv.getBoundingClientRect();
      target = [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height];
      kick();
    });
    document.addEventListener("visibilitychange", function () { if (document.hidden) keys = {}; });

    updateNotes();
    if (P.podglad()) btn.title += " (podgląd prowadzącego: wszystko odblokowane)";
    city.explorer = { me: me, jajka: JAJKA, found: function () { return found.slice(); }, kick: kick, step: tick, keys: function () { return keys; } }; // do testów
  }
})();
