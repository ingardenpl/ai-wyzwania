/* NEO-LUBLIN 2049: wnętrze dzielnicy do zwiedzania (plan: PLAN_DZIELNIC.md, etap 1).
   Dane: <script type="application/json" id="dzielnica-data"> na stronie dzielnicy, budowane przez build.py
   z pliku 01_moduly/NN_temat/dzielnica.json (plan ulic jako siatka znaków, miejsca, znaleziska, drzwi).
   Znaki planu: # zabudowa, B budynek dzielnicy, ~ woda, T drzewo, x ogrodzenie (nie do przejścia);
   . ulica, : plac, , trawa, = tory, _ posadzka (do przejścia); 1–7 miejsca; a–z znaleziska (ukryte);
   inne wielkie litery: drzwi otwierane artefaktem innej dzielnicy.
   Postęp: NeoGra (gra.js), tylko w tej przeglądarce. Gra nie jest częścią oceny. */
(function () {
  "use strict";
  var src = document.getElementById("dzielnica-data"), root = document.getElementById("wn-root");
  if (!src || !root || !window.NeoGra) return;
  var D; try { D = JSON.parse(src.textContent); } catch (e) { return; }
  var G = window.NeoGra, NR = D.nr;
  var BASE = (document.currentScript && document.currentScript.src || "").replace(/wnetrze\.js(\?.*)?$/, "");
  var TS = D.tile || 5, COLS = D.mapa[0].length, ROWS = D.mapa.length, W = COLS * TS, H = ROWS * TS;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var coarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
  var BLOK = "#B~Tx";

  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function link(href, text, blank) { var a = el("a", null, text); a.href = href; if (blank) { a.target = "_blank"; a.rel = "noopener"; } return a; }
  function ch(c, r) { return r < 0 || c < 0 || r >= ROWS || c >= COLS ? "#" : D.mapa[r][c]; }

  // style wspólne z eksploracją i podziemiami
  if (!document.querySelector('link[href$="eksploracja.css"]')) {
    var l = document.createElement("link"); l.rel = "stylesheet"; l.href = BASE + "eksploracja.css"; document.head.appendChild(l);
  }

  // ---------------------------------------------------------------- położenie miejsc, znalezisk i drzwi
  var MIEJSCA = [], ZNAL = [], DRZWI = {};
  var poZnaku = {};
  (D.miejsca || []).forEach(function (m) { poZnaku[m.znak] = m; });
  (D.znaleziska || []).forEach(function (z) { poZnaku[z.znak] = z; });
  for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) {
    var k = D.mapa[r][c], o = poZnaku[k];
    if (/[1-7]/.test(k) && o) { o.x = c * TS + TS / 2; o.y = r * TS + TS / 2; MIEJSCA.push(o); }
    else if (/[a-z]/.test(k) && o) { o.x = c * TS + TS / 2; o.y = r * TS + TS / 2; ZNAL.push(o); }
    else if (/[A-Z]/.test(k) && BLOK.indexOf(k) < 0 && (D.drzwi || {})[k]) { (DRZWI[k] = DRZWI[k] || { def: D.drzwi[k], pola: [] }).pola.push([c, r]); }
  }
  MIEJSCA.sort(function (a, b) { return a.znak < b.znak ? -1 : 1; });
  var CACHE = null;
  function cache() {
    if (!CACHE) {
      var s = G.stan(), dz = {};
      Object.keys(DRZWI).forEach(function (k) { dz[k] = G.podglad() || G.artefakt(DRZWI[k].def.wymaga); });
      CACHE = { stan: s, drzwi: dz, art: G.artefakt(NR) };
    }
    return CACHE;
  }
  document.addEventListener("neo:postep", function () { CACHE = null; });
  function drzwiOtwarte(k) { return !!DRZWI[k] && !!cache().drzwi[k]; }
  function przejscie(c, r) {
    var k = ch(c, r);
    if (BLOK.indexOf(k) >= 0) return false;
    if (/[A-Z]/.test(k)) return drzwiOtwarte(k);
    return true;
  }
  function walk(x, y) { return przejscie(Math.floor(x / TS), Math.floor(y / TS)); }

  function stan() { return cache().stan; }
  function odwiedzone() { return stan().miejsca[NR] || []; }
  function znalezione() { return stan().znaleziska[NR] || []; }

  // ---------------------------------------------------------------- sekcja na stronie (brama do wnętrza)
  function bramka() {
    root.textContent = "";
    var box = el("div", "wn-gate");
    if (!G.otwarta(NR)) {
      var t = G.nastepnyTermin(NR);
      box.appendChild(el("p", null, "Dzielnica " + D.nazwa + " jest jeszcze we mgle. Wnętrze otworzy się w dniu spotkania" + (t ? " (" + t.t + ")" : "") + ". Materiały poniżej są dostępne już teraz."));
      root.appendChild(box); return;
    }
    box.appendChild(el("p", null, D.wstep || ("Wejdź do dzielnicy " + D.nazwa + ": chodź po ulicach, odwiedź siedem miejsc i szukaj ukrytych znalezisk.")));
    var b = el("button", "btn wn-wejdz", "WEJDŹ DO DZIELNICY"); b.type = "button";
    b.addEventListener("click", function () { buduj(true); });
    box.appendChild(b);
    box.appendChild(el("p", "muted wn-war", warunek()));
    root.appendChild(box);
  }
  function warunek() {
    var s = stan(), q = s.quizy[NR] || 0;
    return "Artefakt „" + D.przedmiot + "”: quiz ≥ 60% (teraz " + Math.round(q * 100) + "%), zadanie " + (s.zadania[NR] ? "✓" : "✗") +
      ", miejsca " + odwiedzone().length + "/7 (wymagane " + G.PROG_MIEJSCA + "). Znaleziska " + znalezione().length + "/" + ZNAL.length + " są dodatkiem. Postęp zapisuje się tylko w tej przeglądarce i nie wpływa na ocenę.";
  }

  // ---------------------------------------------------------------- treść miejsc
  function zaliczMiejsce(m) {
    if (odwiedzone().indexOf(m.id) >= 0) return;
    G.zapiszMiejsce(NR, m.id);
  }
  var TYP = { odprawa: "ODPRAWA", czytelnia: "CZYTELNIA", terminal: "TERMINAL ECHO", pracownia: "PRACOWNIA", zadanie: "POKÓJ ZADAŃ", swiadek: "ŚWIADEK", brama: "BRAMA EGZAMINACYJNA" };

  function cialoMiejsca(m, naMapie) {
    var f = el("div", "wn-body");
    f.appendChild(el("p", "sm-k", m.znak + " · " + (TYP[m.typ] || "MIEJSCE") + (odwiedzone().indexOf(m.id) >= 0 ? " · ODWIEDZONE ✓" : "")));
    f.appendChild(el("h3", null, m.nazwa));
    if (m.tekst) m.tekst.split("\n\n").forEach(function (p) { f.appendChild(el("p", null, p)); });
    var auto = true;   // miejsce zaliczane samą wizytą
    if (m.typ === "czytelnia") {
      var ul = el("ul", "wn-lektury");
      (D.lektury || []).forEach(function (x) {
        var li = el("li"); var sp = el("span"); sp.innerHTML = x.html; li.appendChild(sp);
        if (x.link) { li.appendChild(document.createTextNode(" ")); li.appendChild(link(x.link, "[otwórz]", true)); }
        ul.appendChild(li);
      });
      f.appendChild(ul);
      var p = el("p"); p.appendChild(link("#lektury", "Pełna lista lektur tej dzielnicy")); f.appendChild(p);
    } else if (m.typ === "terminal") {
      auto = false; f.appendChild(terminal(m));
    } else if (m.typ === "pracownia") {
      (D.aplikacje || []).forEach(function (a) { var p2 = el("p"); p2.appendChild(link(a.href, "Otwórz: " + a.tytul, true)); f.appendChild(p2); });
      if (!(D.aplikacje || []).length) { var p3 = el("p"); p3.appendChild(link("wiedza.html", "Otwórz Wiedzę tej dzielnicy")); f.appendChild(p3); }
    } else if (m.typ === "zadanie") {
      var lab = el("label", "wn-check"), cb = el("input"); cb.type = "checkbox"; cb.checked = !!stan().zadania[NR];
      cb.addEventListener("change", function () { G.zapiszZadanie(NR, cb.checked); });
      lab.appendChild(cb); lab.appendChild(document.createTextNode(" Wykonałem zadanie (deklaracja; nikt tego nie sprawdza automatycznie)"));
      var p4 = el("p"); p4.appendChild(link("#cwiczenia", m.link_tekst || "Treść zadania: Ćwiczenia i dyskusja")); f.appendChild(p4);
      f.appendChild(lab);
    } else if (m.typ === "swiadek") {
      auto = false; f.appendChild(swiadek(m));
    } else if (m.typ === "brama") {
      var q = stan().quizy[NR];
      f.appendChild(el("p", null, "Quiz dzielnicy: " + (D.quiz_pytan || "kilka") + " pytań zamkniętych. Twój najlepszy wynik: " + (q == null ? "brak" : Math.round(q * 100) + "%") + ". Próg artefaktu: 60%."));
      var p5 = el("p"); p5.appendChild(link("#quiz", "Przejdź do quizu")); f.appendChild(p5);
    }
    if (auto && naMapie) zaliczMiejsce(m);
    return f;
  }

  // Terminal ECHO: pięć fiszek z tej dzielnicy; zaliczony po przejrzeniu wszystkich
  function terminal(m) {
    var w = el("div", "wn-term"), karty = D.fiszki || [], i = 0, widziane = {};
    function rysuj() {
      w.textContent = "";
      if (!karty.length) { w.appendChild(el("p", null, "Brak fiszek dla tej dzielnicy.")); zaliczMiejsce(m); return; }
      var k = karty[i];
      w.appendChild(el("p", "sm-k", "FISZKA " + (i + 1) + "/" + karty.length));
      var fr = el("p", "wn-front"); fr.innerHTML = k.f; w.appendChild(fr);
      var back = el("div", "wn-back"); back.innerHTML = k.b; back.hidden = true; w.appendChild(back);
      var row = el("p", "wn-btns");
      var pok = el("button", "ex-card-x", "Pokaż odpowiedź"); pok.type = "button";
      pok.addEventListener("click", function () { back.hidden = false; widziane[i] = true; pok.disabled = true; if (Object.keys(widziane).length >= karty.length) { zaliczMiejsce(m); kon.hidden = false; } });
      var dal = el("button", "ex-card-x", i + 1 < karty.length ? "Następna →" : "Od początku"); dal.type = "button";
      dal.addEventListener("click", function () { i = (i + 1) % karty.length; rysuj(); });
      row.appendChild(pok); row.appendChild(document.createTextNode(" ")); row.appendChild(dal); w.appendChild(row);
      var kon = el("p", "wn-ok", "Terminal przejrzany ✓"); kon.hidden = Object.keys(widziane).length < karty.length && odwiedzone().indexOf(m.id) < 0; w.appendChild(kon);
      var p = el("p"); p.appendChild(link("../../fiszki.html?temat=" + NR, "Wszystkie fiszki tej dzielnicy")); w.appendChild(p);
    }
    rysuj();
    return w;
  }

  // Świadek: rozmowa krok po kroku; zaliczony po ostatniej kwestii
  function swiadek(m) {
    var w = el("div", "wn-dial"), i = 0, linie = m.rozmowa || [];
    function rysuj() {
      w.textContent = "";
      for (var j = 0; j <= i && j < linie.length; j++) {
        var p = el("p", linie[j].kto === "ty" ? "wn-ty" : "wn-on");
        p.appendChild(el("b", null, (linie[j].kto === "ty" ? "Ty" : m.postac || "Świadek") + ": "));
        p.appendChild(document.createTextNode(linie[j].t)); w.appendChild(p);
      }
      if (i + 1 < linie.length) {
        var b = el("button", "ex-card-x", "Dalej →"); b.type = "button";
        b.addEventListener("click", function () { i++; rysuj(); var bb = w.querySelector("button"); if (bb) bb.focus(); });
        w.appendChild(b);
      } else {
        zaliczMiejsce(m);
        if (m.pytanie) { var q = el("p", "wn-pyt"); q.appendChild(el("b", null, "Pytanie inspektora: ")); q.appendChild(document.createTextNode(m.pytanie)); w.appendChild(q); }
        if (m.zrodlo) { var z = el("p", "sm-legend"); z.appendChild(document.createTextNode("Na podstawie: ")); z.appendChild(link(m.zrodlo.href, m.zrodlo.t, /^https?:/.test(m.zrodlo.href))); w.appendChild(z); }
      }
    }
    rysuj();
    return w;
  }

  function cialoZnaleziska(z) {
    var f = el("div", "wn-body");
    f.appendChild(el("p", "sm-k", "ZNALEZISKO · " + ({ siec: "WIADOMOŚĆ Z SIECI", lublin: "LUBLIN NAPRAWDĘ", kultura: "ŚLAD Z KULTURY", sprawa: "SPRAWA", event: "WYDARZENIE" }[z.kategoria] || "ZNALEZISKO").toUpperCase() + (z.data ? " · " + z.data : "")));
    f.appendChild(el("h3", null, z.tytul));
    f.appendChild(el("p", null, z.tresc));
    if (z.pytanie) { var q = el("p"); q.appendChild(el("b", null, "Pytanie inspektora: ")); q.appendChild(document.createTextNode(z.pytanie)); f.appendChild(q); }
    if (z.zrodlo_url) { var p = el("p", "sm-legend"); p.appendChild(document.createTextNode("Źródło: ")); p.appendChild(link(z.zrodlo_url, z.zrodlo_tytul || z.zrodlo_url, true)); f.appendChild(p); }
    return f;
  }

  // ---------------------------------------------------------------- mapa
  var zbudowane = false, sec, mapBox, cv, cx, panel, hud, lista, fullBtn;
  function buduj(fokus) {
    if (zbudowane) return; zbudowane = true;
    root.textContent = "";
    hud = el("p", "wn-hud"); hud.setAttribute("aria-live", "polite"); root.appendChild(hud);
    var bar = el("div", "wn-bar");
    fullBtn = el("button", "ex-btn wn-full-btn", "PEŁNY EKRAN"); fullBtn.type = "button"; fullBtn.setAttribute("aria-pressed", "false");
    bar.appendChild(fullBtn); root.appendChild(bar);
    mapBox = el("div", "sm-map wn-map"); mapBox.tabIndex = 0;
    mapBox.setAttribute("aria-label", "Mapa dzielnicy " + D.nazwa + ". Strzałki lub WASD: ruch, E lub Enter: zbadaj miejsce. Lista miejsc jest też pod mapą.");
    var scena = el("div", "wn-scena"); mapBox.appendChild(scena);   // płótno i podpisy (pozycje w % płótna)
    cv = el("canvas"); cv.width = W; cv.height = H; cv.setAttribute("aria-hidden", "true"); scena.appendChild(cv);
    var pad = el("div", "ex-pad");
    [["up", "▲", "w górę"], ["left", "◀", "w lewo"], ["down", "▼", "w dół"], ["right", "▶", "w prawo"]].forEach(function (b) { var x = el("button", "ex-pad-" + b[0], b[1]); x.type = "button"; x.dataset.dir = b[0]; x.setAttribute("aria-label", "Idź " + b[2]); pad.appendChild(x); });
    mapBox.appendChild(pad);
    var pr = el("div", "ex-prompt"); pr.hidden = true; var prT = el("span", "ex-prompt-t"); var prB = el("button", "ex-prompt-b", "E"); prB.type = "button";
    pr.appendChild(prB); pr.appendChild(prT); mapBox.appendChild(pr);
    (D.podpisy || []).forEach(function (s) {
      var sp = el("span", "wn-podpis", s[2]); sp.setAttribute("aria-hidden", "true");
      sp.style.left = (s[0] * TS / W * 100) + "%"; sp.style.top = (s[1] * TS / H * 100) + "%"; if (s[3]) sp.style.color = s[3];
      scena.appendChild(sp);
    });
    root.appendChild(mapBox);
    root.appendChild(el("p", "sm-legend", D.legenda || "Plan schematyczny. Strzałki lub WASD albo dotknięcie celu: ruch · E: zbadaj miejsce · świecące znaczniki to miejsca, znaleziska są ukryte."));
    panel = el("div", "sm-station wn-panel"); panel.setAttribute("aria-live", "polite"); panel.hidden = true; root.appendChild(panel);
    lista = el("details", "sm-list"); root.appendChild(lista);
    rysujListe();

    cx = cv.getContext("2d"); cx.imageSmoothingEnabled = false;
    var tlo = rysujTlo();
    var me = { x: (D.start[0] + 0.5) * TS, y: (D.start[1] + 0.5) * TS, step: 0, dir: "down" };
    var keys = {}, target = null, raf = null, blisko = null, ostatni = null;

    function draw(t) {
      cx.drawImage(tlo, 0, 0);
      var fz = (t || 0) / 300;
      // woda: migotanie
      if (!reduce) { cx.fillStyle = "rgba(120,200,255,.18)"; WODA.forEach(function (p, i) { if (Math.sin(fz * 3 + i) > 0.85) cx.fillRect(p[0] * TS + (i % 4), p[1] * TS + (i % 3), 2, 1); }); }
      // budynek dzielnicy: diody szaf serwerowych
      ZAR.forEach(function (p, i) { var on = reduce ? i % 3 === 0 : Math.sin(fz * 4 + i * 1.7) > 0.2; cx.fillStyle = on ? (i % 5 ? D.paleta.neon : "#9cff57") : "rgba(0,0,0,.4)"; cx.fillRect(p[0], p[1], 1, 1); });
      // drzwi
      Object.keys(DRZWI).forEach(function (k) {
        var otw = drzwiOtwarte(k);
        DRZWI[k].pola.forEach(function (p) {
          cx.fillStyle = otw ? "#1d1a24" : "#2a0d14"; cx.fillRect(p[0] * TS, p[1] * TS, TS, TS);
          if (!otw) { cx.fillStyle = "#ff3b5c"; for (var i = 0; i < TS; i += 2) cx.fillRect(p[0] * TS + i, p[1] * TS + (i % 4 ? 1 : 3), 1, 1); }
          else { cx.fillStyle = "rgba(156,255,87,.5)"; cx.fillRect(p[0] * TS + 1, p[1] * TS + TS - 1, TS - 2, 1); }
        });
      });
      // miejsca: pulsujące znaczniki
      var odw = odwiedzone();
      MIEJSCA.forEach(function (m, i) {
        var a = reduce ? 0.5 : 0.35 + Math.sin(fz * 2 + i) * 0.2;
        cx.save(); cx.globalAlpha = a; cx.fillStyle = D.paleta.neon; cx.beginPath(); cx.arc(m.x, m.y, 6, 0, 7); cx.fill(); cx.restore();
        cx.fillStyle = odw.indexOf(m.id) >= 0 ? "#5a6a7a" : "#ffffff"; cx.fillRect(m.x - 1, m.y - 2, 3, 5); cx.fillRect(m.x - 2, m.y - 1, 5, 3);
      });
      // znaleziska: niewidoczne; iskra w pobliżu, przygaszona kropka po znalezieniu
      var zn = znalezione();
      ZNAL.forEach(function (z, i) {
        var d = Math.hypot(z.x - me.x, z.y - me.y);
        if (zn.indexOf(z.id) >= 0) { cx.fillStyle = "rgba(252,238,10,.45)"; cx.fillRect(z.x - 1, z.y - 1, 2, 2); }
        else if (d < 22 && (reduce || Math.sin(fz * 6 + i) > 0)) { cx.fillStyle = "rgba(252,238,10," + (0.9 - d / 26) + ")"; cx.fillRect(z.x, z.y - 2, 1, 5); cx.fillRect(z.x - 2, z.y, 5, 1); }
      });
      // noc: winieta wokół inspektora (łagodniejsza niż w podziemiach)
      var g = cx.createRadialGradient(me.x, me.y - 3, 18, me.x, me.y - 3, 120);
      g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(2,3,8,0.45)");
      cx.fillStyle = g; cx.fillRect(0, 0, W, H);
      MIEJSCA.forEach(function (m) { cx.fillStyle = D.paleta.neon; cx.fillRect(m.x, m.y, 1, 1); });
      // inspektor
      var x = Math.round(me.x), y = Math.round(me.y), leg = (me.step >> 3) % 2;
      cx.fillStyle = "rgba(0,0,0,.5)"; cx.fillRect(x - 2, y + 1, 6, 2);
      cx.fillStyle = "#14161f"; cx.fillRect(x - 3, y - 8, 7, 1); cx.fillRect(x - 2, y - 9, 5, 1);
      cx.fillStyle = "#e0b48a"; cx.fillRect(x - 1, y - 7, 3, 2);
      cx.fillStyle = "#1f8a9a"; cx.fillRect(x - 2, y - 5, 5, 4);
      cx.fillStyle = D.paleta.neon; cx.fillRect(me.dir === "left" ? x - 3 : x + 2, y - 4, 1, 1);
      cx.fillStyle = "#2a2e3a"; cx.fillRect(x - 2 + leg, y - 1, 1, 2); cx.fillRect(x + 1 - leg, y - 1, 1, 2);
    }

    function najblizsze() {
      var best = null, bd = 7;
      MIEJSCA.forEach(function (m) { var d = Math.hypot(m.x - me.x, m.y - me.y); if (d < bd) { bd = d; best = m; } });
      return best;
    }
    function zamykacz() {
      var x = el("button", "ex-card-x wn-zamknij", "Zamknij"); x.type = "button";
      x.addEventListener("click", function () { panel.hidden = true; mapBox.focus({ preventScroll: true }); });
      panel.appendChild(x);
    }
    function pokazMiejsce(m) {
      panel.textContent = ""; panel.className = "sm-station wn-panel";
      panel.appendChild(cialoMiejsca(m, true)); zamykacz(); panel.hidden = false; ostatni = m;
    }
    function pokazZnalezisko(z) {
      panel.textContent = ""; panel.className = "sm-station wn-panel wn-znal";
      panel.appendChild(cialoZnaleziska(z)); zamykacz(); panel.hidden = false; ostatni = z;
    }
    function sprawdzZnaleziska() {
      var zn = znalezione();
      ZNAL.forEach(function (z) {
        if (zn.indexOf(z.id) >= 0 || Math.hypot(z.x - me.x, z.y - me.y) > 5) return;
        G.zapiszZnalezisko(NR, z.id);
        pokazZnalezisko(z);
        if (window.NeoUI) window.NeoUI.banner("ZNALEZISKO " + znalezione().length + "/" + ZNAL.length, z.tytul);
      });
    }
    function drzwiObok() {
      var c0 = Math.floor(me.x / TS), r0 = Math.floor(me.y / TS), hit = null;
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
        var k = ch(c0 + d[0], r0 + d[1]);
        if (DRZWI[k] && !drzwiOtwarte(k)) hit = DRZWI[k].def;
      });
      return hit;
    }
    function aktualizujPrompt() {
      var m = najblizsze(), dz = !m && drzwiObok();
      if (m) { prT.textContent = m.znak + " · " + m.nazwa.toUpperCase(); pr.hidden = false; }
      else if (dz) { prT.textContent = "ZAMKNIĘTE · " + (dz.opis || "potrzebny artefakt").toUpperCase(); pr.hidden = false; }
      else pr.hidden = true;
      if (m !== blisko) { blisko = m; if (m) pokazMiejsce(m); }
    }
    function act() {
      var m = najblizsze();
      if (m) { pokazMiejsce(m); return; }
      var dz = drzwiObok();
      if (dz) {
        var inf = (G.dane().info || {})[dz.wymaga];
        panel.textContent = ""; panel.className = "sm-station wn-panel";
        panel.appendChild(el("p", "sm-k", "ZAMKNIĘTE PRZEJŚCIE"));
        panel.appendChild(el("p", null, (dz.opis || "Przejście jest zamknięte.") + " Otworzy je artefakt " + (inf ? "„" + inf.przedmiot + "” z dzielnicy " + inf.nazwa : "innej dzielnicy") + "."));
        zamykacz(); panel.hidden = false;
      }
    }
    prB.addEventListener("click", act); prT.addEventListener("click", act);

    var DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
    var KEYMAP = { ArrowUp: "up", KeyW: "up", ArrowDown: "down", KeyS: "down", ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right" };
    var MINDT = coarse ? 30 : 16, last = 0;
    function tick(t) {
      raf = null;
      if (t && t - last < MINDT) { raf = requestAnimationFrame(tick); return; }
      last = t || 0;
      var dx = 0, dy = 0;
      Object.keys(keys).forEach(function (k) { if (keys[k]) { dx += DIRS[k][0]; dy += DIRS[k][1]; } });
      if (dx || dy) target = null;
      else if (target) { var tx = target[0] - me.x, ty = target[1] - me.y, d = Math.hypot(tx, ty); if (d < 2) target = null; else { dx = tx / d; dy = ty / d; } }
      var moved = false;
      if (dx || dy) {
        var n = Math.hypot(dx, dy), v = coarse ? 1.8 : 1.1, sx = dx / n * v, sy = dy / n * v;
        if (walk(me.x + sx, me.y + sy) && walk(me.x + sx, me.y) && walk(me.x, me.y + sy)) { me.x += sx; me.y += sy; moved = true; }
        else if (sx && walk(me.x + sx, me.y)) { me.x += sx; moved = true; }
        else if (sy && walk(me.x, me.y + sy)) { me.y += sy; moved = true; }
        else target = null;
        me.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up");
        me.step++;
      }
      if (moved) { aktualizujPrompt(); sprawdzZnaleziska(); }
      draw(t);
      odswiezHud();
      if (moved || target || (!reduce && widoczna)) raf = requestAnimationFrame(tick);
    }
    function kick() { if (!raf) raf = requestAnimationFrame(tick); }
    var widoczna = true;
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { widoczna = es[0].isIntersecting; if (widoczna) kick(); }).observe(mapBox);

    mapBox.addEventListener("keydown", function (e) {
      if (e.target !== mapBox || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.code === "KeyE" || e.key === "Enter" || e.key === " ") { act(); e.preventDefault(); return; }
      if (e.key === "Escape" && pelny) { ustawPelny(false); return; }
      var d = KEYMAP[e.code] || KEYMAP[e.key];
      if (d) { keys[d] = true; e.preventDefault(); kick(); }
    });
    mapBox.addEventListener("keyup", function (e) { var d = KEYMAP[e.code] || KEYMAP[e.key]; if (d) keys[d] = false; });
    mapBox.addEventListener("blur", function () { keys = {}; });
    cv.addEventListener("pointerdown", function (e) { var rr = cv.getBoundingClientRect(); target = [(e.clientX - rr.left) * W / rr.width, (e.clientY - rr.top) * H / rr.height]; mapBox.focus({ preventScroll: true }); kick(); });
    pad.addEventListener("pointerdown", function (e) { var d = e.target.dataset && e.target.dataset.dir; if (d) { keys[d] = true; kick(); e.preventDefault(); } });
    ["pointerup", "pointerleave", "pointercancel"].forEach(function (ev) { pad.addEventListener(ev, function () { keys = {}; }); });
    document.addEventListener("visibilitychange", function () { if (document.hidden) keys = {}; });

    // pełny ekran (klasa CSS; iOS nie pozwala na Fullscreen API dla zwykłych elementów)
    var pelny = false;
    function ustawPelny(v) {
      pelny = v; mapBox.classList.toggle("wn-full", v); document.documentElement.classList.toggle("ex-full-on", v);
      fullBtn.setAttribute("aria-pressed", String(v)); fullBtn.textContent = v ? "ZAMKNIJ PEŁNY EKRAN" : "PEŁNY EKRAN";
      if (v) { mapBox.appendChild(fullBtn); mapBox.appendChild(panel); }
      else { bar.appendChild(fullBtn); lista.parentNode.insertBefore(panel, lista); }
      mapBox.focus({ preventScroll: true }); kick();
    }
    fullBtn.addEventListener("click", function () { ustawPelny(!pelny); });

    document.addEventListener("neo:postep", function () { odswiezListe(); odswiezHud(true); });
    root._wn = { me: me, kick: kick, step: tick, miejsca: MIEJSCA, znal: ZNAL, act: act };   // do testów
    aktualizujPrompt(); draw(0); odswiezHud(true); kick();
    if (fokus) mapBox.focus({ preventScroll: true });
  }

  var hudTxt = "", artefaktByl = null;
  function odswiezHud(wymus) {
    var art = cache().art;
    var t = NR + " · " + D.nazwa.toUpperCase() + " · MIEJSCA " + odwiedzone().length + "/7 · ZNALEZISKA " + znalezione().length + "/" + ZNAL.length + " · ARTEFAKT " + (art ? "✓" : "✗");
    if (t === hudTxt && !wymus) return;
    hudTxt = t; if (hud) hud.textContent = t;
    if (artefaktByl === false && art && window.NeoUI) window.NeoUI.banner("ARTEFAKT ZDOBYTY", D.przedmiot);
    artefaktByl = art;
  }

  // Lista tekstowa (klawiatura, czytnik ekranu): otwarcie miejsca liczy się jak wizyta na mapie.
  var listaSum, listaZn, listaP, listaPola = {};
  function rysujListe() {
    if (!lista) return;
    listaSum = el("summary"); lista.appendChild(listaSum);
    var ol = el("ol");
    MIEJSCA.forEach(function (m) {
      var li = el("li"), d = el("details", "wn-miejsce"), s = el("summary"), body = null;
      d.appendChild(s); li.appendChild(d); ol.appendChild(li); listaPola[m.id] = s;
      d.addEventListener("toggle", function () { if (d.open && !body) { body = cialoMiejsca(m, true); d.appendChild(body); } });
    });
    lista.appendChild(ol);
    listaP = el("p", "sm-legend"); lista.appendChild(listaP);
    listaZn = el("div"); lista.appendChild(listaZn);
    odswiezListe();
  }
  function odswiezListe() {
    if (!listaSum) return;
    var odw = odwiedzone(), zn = znalezione();
    listaSum.textContent = "Miejsca w dzielnicy (tekst) · " + odw.length + "/7";
    MIEJSCA.forEach(function (m) { listaPola[m.id].textContent = m.znak + ". " + m.nazwa + (odw.indexOf(m.id) >= 0 ? " ✓" : ""); });
    listaP.textContent = "Znaleziska: " + zn.length + "/" + ZNAL.length + ". Są ukryte na mapie; znalezione pojawiają się poniżej.";
    ZNAL.forEach(function (z) {
      if (zn.indexOf(z.id) < 0 || listaZn.querySelector('[data-z="' + z.id + '"]')) return;
      var b = cialoZnaleziska(z); b.setAttribute("data-z", z.id); listaZn.appendChild(b);
    });
  }

  // tło rysowane raz: kafle z ziarnem, bloki zabudowy z oknami i neonem, budynek dzielnicy
  var WODA = [], ZAR = [];   // pola wody (migotanie) i diody szaf w budynku dzielnicy
  function rysujTlo() {
    var b = document.createElement("canvas"); b.width = W; b.height = H; var g = b.getContext("2d");
    var seed = 2049 + parseInt(NR, 10) * 97; function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    var P = D.paleta;
    var KOL = { ".": P.ulica || "#15171f", ":": P.plac || "#23262f", ",": P.trawa || "#12261a", "=": P.ulica || "#15171f", "_": P.posadzka || "#1d1a24", "~": P.woda || "#0a1a2a", "T": P.trawa || "#12261a", "x": P.ulica || "#15171f" };
    // podłoże
    for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) {
      var k = ch(c, r), base = KOL[k] || (/[1-7a-z]/.test(k) ? (KOL[sasiad(c, r)] || KOL["."]) : null);
      if (/[A-Z]/.test(k) && BLOK.indexOf(k) < 0) base = KOL["_"];
      if (!base) continue;
      g.fillStyle = base; g.fillRect(c * TS, r * TS, TS, TS);
      for (var n = 0; n < 2; n++) { g.fillStyle = rnd() < 0.5 ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.25)"; g.fillRect(c * TS + Math.floor(rnd() * TS), r * TS + Math.floor(rnd() * TS), 1, 1); }
      if (k === "~") WODA.push([c, r]);
      if (k === "=") { g.fillStyle = "#4a4a52"; g.fillRect(c * TS, r * TS + 1, TS, 1); g.fillRect(c * TS, r * TS + TS - 2, TS, 1); }
      if (k === ":" && (c + r) % 2 === 0) { g.fillStyle = "rgba(255,255,255,.03)"; g.fillRect(c * TS, r * TS, TS, TS); }
      if (k === "T") { g.fillStyle = "#0d3a1e"; g.beginPath(); g.arc(c * TS + TS / 2, r * TS + TS / 2, TS / 2 + 1, 0, 7); g.fill(); g.fillStyle = "#1c5a30"; g.fillRect(c * TS + 1, r * TS + 1, 2, 2); }
      if (k === "x") { g.fillStyle = "#6a6e7a"; for (var i = 0; i < TS; i += 2) g.fillRect(c * TS + i, r * TS + 2, 1, 1); }
      if (k === ".") {   // krawężnik przy zabudowie i przerywana linia na szerokich ulicach
        g.fillStyle = "#2c3140";
        if ("#B".indexOf(ch(c, r - 1)) >= 0) g.fillRect(c * TS, r * TS, TS, 1);
        if ("#B".indexOf(ch(c, r + 1)) >= 0) g.fillRect(c * TS, r * TS + TS - 1, TS, 1);
        if ("#B".indexOf(ch(c - 1, r)) >= 0) g.fillRect(c * TS, r * TS, 1, TS);
        if ("#B".indexOf(ch(c + 1, r)) >= 0) g.fillRect(c * TS + TS - 1, r * TS, 1, TS);
        if (ch(c, r - 1) === "." && ch(c, r + 1) === "." && ch(c, r - 2) !== "." && c % 2 === 0) { g.fillStyle = "rgba(249,240,2,.35)"; g.fillRect(c * TS, r * TS + TS - 1, 3, 1); }
      }
    }
    // bloki zabudowy: składowe spójne, każdy w jednym kolorze z paletą
    var seen = {};
    for (r = 0; r < ROWS; r++) for (c = 0; c < COLS; c++) {
      var kk = ch(c, r);
      if ((kk !== "#" && kk !== "B") || seen[c + "," + r]) continue;
      var stos = [[c, r]], pola = [], minc = c, maxc = c, minr = r, maxr = r;
      seen[c + "," + r] = 1;
      while (stos.length) {
        var p = stos.pop(); pola.push(p);
        minc = Math.min(minc, p[0]); maxc = Math.max(maxc, p[0]); minr = Math.min(minr, p[1]); maxr = Math.max(maxr, p[1]);
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) { var q = [p[0] + d[0], p[1] + d[1]], key = q[0] + "," + q[1]; if (!seen[key] && q[0] >= 0 && q[1] >= 0 && q[0] < COLS && q[1] < ROWS && ch(q[0], q[1]) === kk) { seen[key] = 1; stos.push(q); } });
      }
      var land = kk === "B", kol = land ? (P.budynek_dzielnicy || "#2a3550") : P.dachy[Math.floor(rnd() * P.dachy.length)];
      pola.forEach(function (p) {
        g.fillStyle = "rgba(0,0,0,.45)"; g.fillRect(p[0] * TS + 1, p[1] * TS + 1, TS, TS);
      });
      pola.forEach(function (p) {
        g.fillStyle = kol; g.fillRect(p[0] * TS, p[1] * TS, TS, TS);
        if (ch(p[0], p[1] - 1) !== kk) { g.fillStyle = "rgba(255,255,255,.12)"; g.fillRect(p[0] * TS, p[1] * TS, TS, 1); }
        g.fillStyle = "rgba(0,0,0,.35)";
        if (ch(p[0], p[1] + 1) !== kk) g.fillRect(p[0] * TS, p[1] * TS + TS - 1, TS, 1);
        if (ch(p[0] - 1, p[1]) !== kk) g.fillRect(p[0] * TS, p[1] * TS, 1, TS);
        if (ch(p[0] + 1, p[1]) !== kk) g.fillRect(p[0] * TS + TS - 1, p[1] * TS, 1, TS);
        if (land) {
          if (p[0] % 2 === 0) { g.fillStyle = "rgba(0,0,0,.28)"; g.fillRect(p[0] * TS + 1, p[1] * TS, 3, TS); ZAR.push([p[0] * TS + 2, p[1] * TS + 1 + Math.floor(rnd() * 3)]); }
        } else if (rnd() < 0.08) { g.fillStyle = "rgba(255,255,255,.14)"; g.fillRect(p[0] * TS + 1, p[1] * TS + 1, 2, 2); g.fillStyle = "rgba(0,0,0,.4)"; g.fillRect(p[0] * TS + 2, p[1] * TS + 2, 1, 1); }
        else if (rnd() < 0.16) { g.fillStyle = rnd() < 0.7 ? "#f9e27a" : P.neon; g.globalAlpha = 0.6; g.fillRect(p[0] * TS + 1 + Math.floor(rnd() * 3), p[1] * TS + 1 + Math.floor(rnd() * 3), 1, 1); g.globalAlpha = 1; }
      });
      if (land || (pola.length > 6 && rnd() < 0.45)) {   // neon na krawędzi bloku
        g.fillStyle = P.neon; g.globalAlpha = land ? 0.9 : 0.6;
        if (land) { g.strokeStyle = P.neon; g.lineWidth = 1; g.strokeRect(minc * TS + 0.5, minr * TS + 0.5, (maxc - minc + 1) * TS - 1, (maxr - minr + 1) * TS - 1); }
        else g.fillRect(minc * TS + 1, (maxr + 1) * TS - 1, Math.min(4, maxc - minc + 1) * TS - 2, 1);
        g.globalAlpha = 1;
      }
    }
    return b;
  }
  function sasiad(c, r) {   // podłoże pod znacznikiem: najczęstszy sąsiad do przejścia
    var licz = {}, best = ".", bn = 0;
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) { var k = ch(c + d[0], r + d[1]); if (".:,=_".indexOf(k) >= 0) { licz[k] = (licz[k] || 0) + 1; if (licz[k] > bn) { bn = licz[k]; best = k; } } });
    return best;
  }

  bramka();
  if (location.hash === "#wnetrze" && G.otwarta(NR)) buduj(true);
  document.addEventListener("neo:postep", function () { if (!zbudowane) bramka(); });
})();
