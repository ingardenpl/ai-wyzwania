/* NEO-LUBLIN 2049: wnętrze dzielnicy do zwiedzania (plan: PLAN_DZIELNIC.md, etap 1).
   Dane: <script type="application/json" id="dzielnica-data"> na stronie dzielnicy, budowane przez build.py
   z pliku 01_moduly/NN_temat/dzielnica.json (plan ulic jako siatka znaków, miejsca, znaleziska, drzwi).
   Znaki planu: # zabudowa, B budynek dzielnicy, ~ woda, T drzewo, x ogrodzenie (nie do przejścia);
   . ulica, : plac, , trawa, = tory, _ posadzka (do przejścia); 1–7 miejsca; a–z znaleziska (ukryte);
   inne wielkie litery: drzwi otwierane artefaktem innej dzielnicy. Pole „pojazdy”: taksówki i skutery do jazdy.
   Widok z góry jak w GTA II: kamera za graczem, płynny ruch, pojazdy, przechodnie, minimapa (sekcja „mapa”).
   Pole „misje”: zlecenia z etapami (rozmowa, pytanie, dojście lub dojazd, zbieranie, jazda za taksówką); dodatek jak znaleziska.
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
  var MISJE = D.misje || [];
  function misjeWykonane() { return (stan().misje || {})[NR] || []; }

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
      if (!(D.aplikacje || []).length) { var p3 = el("p"); p3.appendChild(link("wiedza.html", "Otwórz treść zajęć tej dzielnicy")); f.appendChild(p3); }
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
      pok.addEventListener("click", function () { back.hidden = false; widziane[i] = true; pok.disabled = true; dal.focus(); if (Object.keys(widziane).length >= karty.length) { zaliczMiejsce(m); kon.hidden = false; } });
      var dal = el("button", "ex-card-x", i + 1 < karty.length ? "Następna →" : "Od początku"); dal.type = "button";
      dal.addEventListener("click", function () { i = (i + 1) % karty.length; rysuj(); var b = w.querySelector("button:not([disabled])"); if (b) b.focus(); });
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

  // ---------------------------------------------------------------- mapa: widok z góry jak w GTA II
  // Kamera jedzie za graczem, plan jest większy niż ekran. Płynny ruch pieszo (Shift: bieg), pojazdy z pliku
  // dzielnicy (E: wsiądź / wysiądź; strzałki: gaz, hamulec, skręt), przechodnie, minimapa i strzałka do
  // najbliższego nieodwiedzonego miejsca. Telefon: pływający joystick (przeciągnij palcem po mapie),
  // krótkie dotknięcie = idź tutaj. Bez przemocy: pojazd zatrzymuje się przed przechodniem.
  var POJ = {
    taksowka: { dl: 2, sz: 1.2, vmax: 2.6, przysp: 0.06, skret: 0.055, jezdne: ".:=", nazwa: "TAKSÓWKA" },
    skuter: { dl: 1.3, sz: 0.6, vmax: 1.9, przysp: 0.08, skret: 0.075, jezdne: ".:=,_", nazwa: "SKUTER" }
  };
  var SK = TS / 5;   // prędkości w px planu na klatkę (60 kl./s) dla kafla 5 px
  function grunt(c, r) { var k = ch(c, r); return /[1-7a-z]/.test(k) && BLOK.indexOf(k) < 0 ? sasiad(c, r) : k; }
  function jezdne(typ, x, y) {
    var c = Math.floor(x / TS), r = Math.floor(y / TS), k = grunt(c, r);
    if (/[A-Z]/.test(k) && BLOK.indexOf(k) < 0) return typ === "skuter" && drzwiOtwarte(k);
    return POJ[typ].jezdne.indexOf(k) >= 0;
  }
  function pojazdWolny(p, x, y, a) {   // przód, tył i narożniki przodu na polach, po których ten pojazd jeździ
    var t = POJ[p.typ], dl = t.dl * TS / 2, sz = t.sz * TS / 2, ca = Math.cos(a), sa = Math.sin(a);
    return [[dl, 0], [-dl, 0], [dl * 0.8, sz], [dl * 0.8, -sz], [-dl * 0.8, sz], [-dl * 0.8, -sz]].every(function (o) {
      return jezdne(p.typ, x + o[0] * ca - o[1] * sa, y + o[0] * sa + o[1] * ca);
    });
  }
  function katRoznica(a, b) { var d = (a - b) % (2 * Math.PI); if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; return d; }

  var zbudowane = false, mapBox, cv, cx, panel, hud, lista, fullBtn, wysiadzBtn, mini, mcx, joyEl, PODPISY = [];
  function buduj(fokus) {
    if (zbudowane) return; zbudowane = true;
    root.textContent = "";
    hud = el("p", "wn-hud"); hud.setAttribute("aria-live", "polite"); root.appendChild(hud);
    var bar = el("div", "wn-bar");
    wysiadzBtn = el("button", "ex-btn wn-wysiadz", "WYSIĄDŹ"); wysiadzBtn.type = "button"; wysiadzBtn.hidden = true;
    fullBtn = el("button", "ex-btn wn-full-btn", "PEŁNY EKRAN"); fullBtn.type = "button"; fullBtn.setAttribute("aria-pressed", "false");
    bar.appendChild(wysiadzBtn); bar.appendChild(fullBtn); root.appendChild(bar);
    mapBox = el("div", "sm-map wn-map"); mapBox.tabIndex = 0; mapBox.setAttribute("role", "application");
    mapBox.setAttribute("aria-label", "Mapa dzielnicy " + D.nazwa + ". Strzałki lub WASD: ruch, Shift: bieg, E lub Enter: zbadaj miejsce, wsiądź lub wysiądź z pojazdu. Lista miejsc jest też pod mapą.");
    var scena = el("div", "wn-scena"); mapBox.appendChild(scena);
    cv = el("canvas"); cv.setAttribute("aria-hidden", "true"); scena.appendChild(cv);
    mini = el("canvas", "wn-mini"); mini.width = COLS; mini.height = ROWS; mini.setAttribute("aria-hidden", "true"); mapBox.appendChild(mini);
    joyEl = el("div", "wn-joy"); joyEl.appendChild(el("span")); joyEl.hidden = true; joyEl.setAttribute("aria-hidden", "true"); mapBox.appendChild(joyEl);
    var pr = el("div", "ex-prompt"); pr.hidden = true; var prT = el("span", "ex-prompt-t"); var prB = el("button", "ex-prompt-b", "E"); prB.type = "button";
    pr.appendChild(prB); pr.appendChild(prT); mapBox.appendChild(pr);
    (D.podpisy || []).forEach(function (s) {
      var sp = el("span", "wn-podpis", s[2]); sp.setAttribute("aria-hidden", "true"); if (s[3]) sp.style.color = s[3];
      scena.appendChild(sp); PODPISY.push({ el: sp, x: s[0] * TS, y: s[1] * TS });
    });
    root.appendChild(mapBox);
    root.appendChild(el("p", "sm-legend", D.legenda || "Widok z góry. Strzałki lub WASD: ruch (Shift: bieg) · E: zbadaj miejsce, wsiądź do pojazdu lub z niego wysiądź · w pojeździe strzałki to gaz, hamulec i skręt · na telefonie przeciągnij palcem po mapie (joystick), krótkie dotknięcie: idź tutaj. Strzałka na krawędzi ekranu wskazuje najbliższe nieodwiedzone miejsce; znaleziska są ukryte."));
    panel = el("div", "sm-station wn-panel"); panel.setAttribute("aria-live", "polite"); panel.hidden = true; root.appendChild(panel);
    lista = el("details", "sm-list"); root.appendChild(lista);
    rysujListe();

    cx = cv.getContext("2d"); mcx = mini.getContext("2d");
    var tlo = rysujTlo();
    mcx.imageSmoothingEnabled = true; mcx.drawImage(tlo, 0, 0, W, H, 0, 0, COLS, ROWS);
    var miniTlo = mcx.getImageData(0, 0, COLS, ROWS);

    var me = { x: (D.start[0] + 0.5) * TS, y: (D.start[1] + 0.5) * TS, a: 0, vx: 0, vy: 0, step: 0, w: null };
    var KOLORY = ["#f9d71c", "#ff2a6d", "#05d9e8", "#9cff57", "#ffb347"];
    var pojazdy = (D.pojazdy || []).map(function (v, i) {
      return { typ: v.typ, x: (v.x + 0.5) * TS, y: (v.y + 0.5) * TS, a: v.kat * Math.PI / 180, v: 0, kol: v.typ === "taksowka" ? "#f9d71c" : KOLORY[(i + 1) % KOLORY.length] };
    });
    // przechodnie: losowe pola chodnika, placu, trawy i posadzki (ziarno stałe dla dzielnicy)
    var seed = 77 + parseInt(NR, 10) * 131; function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    var ludzie = [], ile = Math.min(14, Math.floor(COLS * ROWS / 400));
    for (var proba = 0; ludzie.length < ile && proba < 4000; proba++) {
      var c0 = Math.floor(rnd() * COLS), r0 = Math.floor(rnd() * ROWS);
      if (".:,_".indexOf(ch(c0, r0)) >= 0) ludzie.push({ x: (c0 + 0.5) * TS, y: (r0 + 0.5) * TS, a: Math.floor(rnd() * 4) * Math.PI / 2, t: 30 + rnd() * 200, kol: KOLORY[Math.floor(rnd() * KOLORY.length)], v: 0.3 + rnd() * 0.2 });
    }

    var keys = {};
    function puscKlawisze() { Object.keys(keys).forEach(function (k) { delete keys[k]; }); }
    var target = null, joy = null, raf = null, blisko = null, ostatni = null, last = 0, kadr = 0;
    var VW = 200, VH = 112, camX = 0, camY = 0, camOk = false;

    function rozmiar() {
      var szer = pelny ? window.innerWidth : (mapBox.clientWidth || 600);
      var skala = szer > 1200 ? 5 : szer > 600 ? 4 : 3.2;
      VW = Math.min(W, Math.round(szer / skala));
      var asp = pelny ? window.innerHeight / window.innerWidth : (szer < 600 ? 1.1 : 9 / 16);
      VH = Math.min(H, Math.round(VW * asp));
      cv.width = VW; cv.height = VH; cx.imageSmoothingEnabled = false;
      camOk = false; kick();
    }
    function kamera(f) {
      var w = me.w, przod = w ? 14 * w.v / POJ[w.typ].vmax : 0;
      var tx = me.x + (w ? Math.cos(w.a) * przod : 0) - VW / 2, ty = me.y + (w ? Math.sin(w.a) * przod : 0) - VH / 2;
      tx = W <= VW ? (W - VW) / 2 : Math.max(0, Math.min(W - VW, tx));
      ty = H <= VH ? (H - VH) / 2 : Math.max(0, Math.min(H - VH, ty));
      if (!camOk || reduce) { camX = tx; camY = ty; camOk = true; }
      else { var k = Math.min(1, 0.14 * f); camX += (tx - camX) * k; camY += (ty - camY) * k; }
    }

    // ---- rysowanie
    function rysujPojazd(p, fz) {
      var t = POJ[p.typ], dl = t.dl * TS, sz = t.sz * TS;
      cx.save(); cx.translate(p.x, p.y); cx.rotate(p.a);
      if (p === me.w && !reduce) {   // reflektory
        var g = cx.createLinearGradient(dl / 2, 0, dl / 2 + 26, 0); g.addColorStop(0, "rgba(255,244,190,.35)"); g.addColorStop(1, "rgba(255,244,190,0)");
        cx.fillStyle = g; cx.beginPath(); cx.moveTo(dl / 2, -sz / 3); cx.lineTo(dl / 2 + 26, -sz * 1.6); cx.lineTo(dl / 2 + 26, sz * 1.6); cx.lineTo(dl / 2, sz / 3); cx.fill();
      }
      cx.fillStyle = "rgba(0,0,0,.45)"; cx.fillRect(-dl / 2 + 1, -sz / 2 + 1, dl, sz);
      if (p.typ === "taksowka") {
        cx.fillStyle = p.kol; cx.fillRect(-dl / 2, -sz / 2, dl, sz);
        cx.fillStyle = "#1b1d27"; cx.fillRect(-dl * 0.18, -sz / 2 + 1, dl * 0.42, sz - 2);           // dach
        cx.fillStyle = "#7fd8ff"; cx.fillRect(dl * 0.24, -sz / 2 + 1, 1, sz - 2);                     // szyba
        cx.fillStyle = (fz * 2 | 0) % 2 || reduce ? D.paleta.neon : "#ffffff"; cx.fillRect(-1, -1, 2, 2);   // lampka AI
        cx.fillStyle = "#fff6c0"; cx.fillRect(dl / 2 - 1, -sz / 2, 1, 1); cx.fillRect(dl / 2 - 1, sz / 2 - 1, 1, 1);
        cx.fillStyle = "#ff3b5c"; cx.fillRect(-dl / 2, -sz / 2, 1, 1); cx.fillRect(-dl / 2, sz / 2 - 1, 1, 1);
      } else {
        cx.fillStyle = "#2a2e3a"; cx.fillRect(-dl / 2, -sz / 2, dl, sz);
        cx.fillStyle = p.kol; cx.fillRect(-dl / 2 + 1, -sz / 2, dl - 2, sz);
        cx.fillStyle = "#fff6c0"; cx.fillRect(dl / 2 - 1, -0.5, 1, 1);
      }
      cx.restore();
    }
    function rysujCzlowieka(x, y, a, kol, krok, inspektor) {
      cx.save(); cx.translate(x, y); cx.rotate(a);
      var n = (krok >> 3) % 2 ? 1 : -1;
      cx.fillStyle = "rgba(0,0,0,.45)"; cx.beginPath(); cx.ellipse(0.8, 0.8, 2.6, 2, 0, 0, 7); cx.fill();
      cx.fillStyle = "#2a2e3a"; cx.fillRect(n, -2, 2, 1.2); cx.fillRect(-n, 0.8, 2, 1.2);   // nogi
      cx.fillStyle = kol; cx.fillRect(-1.5, -2.5, 3, 5);                                     // płaszcz
      if (inspektor) { cx.fillStyle = D.paleta.neon; cx.fillRect(1.5, -0.5, 1, 1); }
      cx.fillStyle = inspektor ? "#14161f" : "#3a2c22"; cx.beginPath(); cx.arc(0, 0, 1.6, 0, 7); cx.fill();   // głowa
      cx.restore();
    }
    function draw(t) {
      var fz = (t || 0) / 300, ox = Math.round(camX), oy = Math.round(camY);
      cx.setTransform(1, 0, 0, 1, 0, 0); cx.fillStyle = "#020306"; cx.fillRect(0, 0, VW, VH);
      cx.setTransform(1, 0, 0, 1, -ox, -oy);
      cx.drawImage(tlo, 0, 0);
      if (!reduce) { cx.fillStyle = "rgba(120,200,255,.18)"; WODA.forEach(function (p, i) { if (Math.sin(fz * 3 + i) > 0.85) cx.fillRect(p[0] * TS + (i % 4), p[1] * TS + (i % 3), 2, 1); }); }
      ZAR.forEach(function (p, i) { var on = reduce ? i % 3 === 0 : Math.sin(fz * 4 + i * 1.7) > 0.2; cx.fillStyle = on ? (i % 5 ? D.paleta.neon : "#9cff57") : "rgba(0,0,0,.4)"; cx.fillRect(p[0], p[1], 1, 1); });
      Object.keys(DRZWI).forEach(function (k) {
        var otw = drzwiOtwarte(k);
        DRZWI[k].pola.forEach(function (p) {
          cx.fillStyle = otw ? "#1d1a24" : "#2a0d14"; cx.fillRect(p[0] * TS, p[1] * TS, TS, TS);
          if (!otw) { cx.fillStyle = "#ff3b5c"; for (var i = 0; i < TS; i += 2) cx.fillRect(p[0] * TS + i, p[1] * TS + (i % 4 ? 1 : 3), 1, 1); }
          else { cx.fillStyle = "rgba(156,255,87,.5)"; cx.fillRect(p[0] * TS + 1, p[1] * TS + TS - 1, TS - 2, 1); }
        });
      });
      var odw = odwiedzone();
      MIEJSCA.forEach(function (m, i) {
        var a = reduce ? 0.5 : 0.35 + Math.sin(fz * 2 + i) * 0.2;
        cx.save(); cx.globalAlpha = a; cx.fillStyle = D.paleta.neon; cx.beginPath(); cx.arc(m.x, m.y, 6, 0, 7); cx.fill(); cx.restore();
        cx.fillStyle = odw.indexOf(m.id) >= 0 ? "#5a6a7a" : "#ffffff"; cx.fillRect(m.x - 1, m.y - 2, 3, 5); cx.fillRect(m.x - 2, m.y - 1, 5, 3);
      });
      var zn = znalezione();
      ZNAL.forEach(function (z, i) {
        var d = Math.hypot(z.x - me.x, z.y - me.y);
        if (zn.indexOf(z.id) >= 0) { cx.fillStyle = "rgba(252,238,10,.45)"; cx.fillRect(z.x - 1, z.y - 1, 2, 2); }
        else if (d < 22 && (reduce || Math.sin(fz * 6 + i) > 0)) { cx.fillStyle = "rgba(252,238,10," + (0.9 - d / 26) + ")"; cx.fillRect(z.x, z.y - 2, 1, 5); cx.fillRect(z.x - 2, z.y, 5, 1); }
      });
      ludzie.forEach(function (l) { rysujCzlowieka(l.x, l.y, l.a, l.kol, l.krok || 0, false); if (l.uwaga > 0) { cx.fillStyle = "#f9f002"; cx.fillRect(l.x, l.y - 6, 1, 3); cx.fillRect(l.x, l.y - 2, 1, 1); } });
      pojazdy.forEach(function (p) { rysujPojazd(p, fz); });
      rysujMisje(fz);
      if (!me.w) rysujCzlowieka(me.x, me.y, me.a, "#1f8a9a", me.step, true);
      var g = cx.createRadialGradient(me.x, me.y, 22, me.x, me.y, Math.max(VW, VH) * 0.75);
      g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(2,3,8,0.5)");
      cx.fillStyle = g; cx.fillRect(ox, oy, VW, VH);
      MIEJSCA.forEach(function (m) { cx.fillStyle = D.paleta.neon; cx.fillRect(m.x, m.y, 1, 1); });
      cx.setTransform(1, 0, 0, 1, 0, 0);
      strzalka(fz);
      podpisy(ox, oy);
      if (kadr++ % 4 === 0) minimapa(fz);
    }
    // strzałka na krawędzi ekranu do najbliższego nieodwiedzonego miejsca (gdy jest poza kadrem)
    function strzalka(fz) {
      var odw = odwiedzone(), cel = misjaCel(), bd = 1e9;
      if (!cel) MIEJSCA.forEach(function (m) { if (odw.indexOf(m.id) >= 0) return; var d = Math.hypot(m.x - me.x, m.y - me.y); if (d < bd) { bd = d; cel = m; } });
      if (!cel) return;
      var sx = cel.x - camX, sy = cel.y - camY;
      if (sx > 4 && sy > 4 && sx < VW - 4 && sy < VH - 4) return;
      var px = me.x - camX, py = me.y - camY, a = Math.atan2(sy - py, sx - px), m = 7;
      var kx = Math.cos(a), ky = Math.sin(a), s = Math.min(Math.abs((kx > 0 ? VW - m - px : px - m) / (kx || 1e-6)), Math.abs((ky > 0 ? VH - m - py : py - m) / (ky || 1e-6)));
      cx.save(); cx.translate(px + kx * s, py + ky * s); cx.rotate(a);
      cx.globalAlpha = reduce ? 1 : 0.7 + Math.sin(fz * 4) * 0.3;
      cx.fillStyle = "#000"; cx.beginPath(); cx.moveTo(5, 0); cx.lineTo(-4, -4); cx.lineTo(-2, 0); cx.lineTo(-4, 4); cx.closePath(); cx.fill();
      cx.fillStyle = D.paleta.neon; cx.beginPath(); cx.moveTo(4, 0); cx.lineTo(-3, -3); cx.lineTo(-1.5, 0); cx.lineTo(-3, 3); cx.closePath(); cx.fill();
      cx.restore();
    }
    function podpisy(ox, oy) {
      PODPISY.forEach(function (p) {
        var x = (p.x - ox) / VW * 100, y = (p.y - oy) / VH * 100, wid = x > -30 && x < 100 && y > -5 && y < 100;
        p.el.hidden = !wid; if (wid) { p.el.style.left = x + "%"; p.el.style.top = y + "%"; }
      });
    }
    function minimapa(fz) {
      mcx.putImageData(miniTlo, 0, 0);
      var odw = odwiedzone();
      MIEJSCA.forEach(function (m) { mcx.fillStyle = odw.indexOf(m.id) >= 0 ? "#5a6a7a" : D.paleta.neon; mcx.fillRect(Math.floor(m.x / TS) - 1, Math.floor(m.y / TS) - 1, 3, 3); });
      pojazdy.forEach(function (p) { mcx.fillStyle = p.kol; mcx.fillRect(Math.floor(p.x / TS), Math.floor(p.y / TS), 2, 2); });
      var zr = misjeWykonane();
      MIS.forEach(function (q) { mcx.fillStyle = zr.indexOf(q.def.id) >= 0 ? "#7a7f90" : "#fcee0a"; mcx.fillRect(Math.floor(q.x / TS) - 1, Math.floor(q.y / TS) - 1, 3, 3); });
      var mc = misjaCel(); if (mc && (reduce || (fz * 4 | 0) % 2)) { mcx.fillStyle = "#fcee0a"; mcx.fillRect(Math.floor(mc.x / TS) - 2, Math.floor(mc.y / TS) - 2, 5, 5); }
      mcx.strokeStyle = "rgba(255,255,255,.5)"; mcx.lineWidth = 1; mcx.strokeRect(Math.round(camX / TS) + 0.5, Math.round(camY / TS) + 0.5, Math.round(VW / TS) - 1, Math.round(VH / TS) - 1);
      if (reduce || (fz * 3 | 0) % 2) { mcx.fillStyle = "#ffffff"; mcx.fillRect(Math.floor(me.x / TS) - 1, Math.floor(me.y / TS) - 1, 3, 3); }
    }

    // ---- miejsca, znaleziska, drzwi, pojazdy w pobliżu
    function najblizsze() {
      var best = null, bd = me.w ? 9 : 7;
      MIEJSCA.forEach(function (m) { var d = Math.hypot(m.x - me.x, m.y - me.y); if (d < bd) { bd = d; best = m; } });
      return best;
    }
    function pojazdObok() {
      var best = null, bd = 10;
      pojazdy.forEach(function (p) { var d = Math.hypot(p.x - me.x, p.y - me.y); if (d < bd) { bd = d; best = p; } });
      return best;
    }
    function zamykacz() {
      var x = el("button", "ex-card-x wn-zamknij", "Zamknij"); x.type = "button";
      x.addEventListener("click", function () { panel.hidden = true; panelMisji = false; mapBox.focus({ preventScroll: true }); });
      panel.appendChild(x);
    }
    function pokazMiejsce(m) {
      panelMisji = false; panel.textContent = ""; panel.className = "sm-station wn-panel";
      panel.appendChild(cialoMiejsca(m, true)); zamykacz(); panel.hidden = false; ostatni = m;
    }
    function pokazZnalezisko(z) {
      panelMisji = false; panel.textContent = ""; panel.className = "sm-station wn-panel wn-znal";
      panel.appendChild(cialoZnaleziska(z)); zamykacz(); panel.hidden = false; ostatni = z;
    }
    function sprawdzZnaleziska() {
      var zn = znalezione();
      ZNAL.forEach(function (z) {
        if (zn.indexOf(z.id) >= 0 || Math.hypot(z.x - me.x, z.y - me.y) > (me.w ? 7 : 5)) return;
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
      var m = najblizsze(), q = !m && !me.w && zleceniodawcaObok(), p = !m && !q && !me.w && pojazdObok(), dz = !m && !q && !p && !me.w && drzwiObok();
      if (m) { prT.textContent = m.znak + " · " + m.nazwa.toUpperCase(); pr.hidden = false; }
      else if (q) { prT.textContent = "! ZLECENIE · " + q.def.tytul.toUpperCase(); pr.hidden = false; }
      else if (me.w) { prT.textContent = "WYSIĄDŹ · " + POJ[me.w.typ].nazwa; pr.hidden = Math.abs(me.w.v) > 0.4; }
      else if (p) { prT.textContent = "WSIĄDŹ · " + POJ[p.typ].nazwa; pr.hidden = false; }
      else if (dz) { prT.textContent = "ZAMKNIĘTE · " + (dz.opis || "potrzebny artefakt").toUpperCase(); pr.hidden = false; }
      else pr.hidden = true;
      // miejsce otwiera się samo pieszo albo po zatrzymaniu pojazdu, nie w pełnym pędzie
      if (m !== blisko && !panelMisji && (!me.w || Math.abs(me.w.v) < 0.6)) { blisko = m; if (m) pokazMiejsce(m); }
    }
    function wsiadz(p) {
      me.w = p; me.vx = me.vy = 0; target = null; wysiadzBtn.hidden = false; wPojezdzie = POJ[p.typ].nazwa;
      odswiezHud(true); aktualizujPrompt(); kick();
    }
    function wysiadz() {
      var p = me.w; if (!p) return;
      var t = POJ[p.typ], ca = Math.cos(p.a), sa = Math.sin(p.a), boki = t.sz * TS / 2 + 3, przod = t.dl * TS / 2 + 3;
      var opcje = [[0, boki], [0, -boki], [przod, 0], [-przod, 0], [0, boki + TS], [0, -boki - TS], [przod + TS, 0], [-przod - TS, 0]];
      for (var i = 0; i < opcje.length; i++) {
        var x = p.x + opcje[i][0] * ca - opcje[i][1] * sa, y = p.y + opcje[i][0] * sa + opcje[i][1] * ca;
        if (walk(x, y)) { me.x = x; me.y = y; p.v = 0; me.w = null; wysiadzBtn.hidden = true; wPojezdzie = ""; odswiezHud(true); aktualizujPrompt(); sprawdzZnaleziska(); kick(); return; }
      }
      prT.textContent = "BRAK MIEJSCA DO WYSIADANIA · PODJEDŹ DALEJ"; pr.hidden = false;
    }
    function act() {
      if (misjaAct()) return;
      var m = najblizsze();
      if (m) { pokazMiejsce(m); return; }
      if (me.w) { wysiadz(); return; }
      var p = pojazdObok();
      if (p) { wsiadz(p); return; }
      var dz = drzwiObok();
      if (dz) {
        var inf = (G.dane().info || {})[dz.wymaga];
        panel.textContent = ""; panel.className = "sm-station wn-panel";
        panel.appendChild(el("p", "sm-k", "ZAMKNIĘTE PRZEJŚCIE"));
        panel.appendChild(el("p", null, (dz.opis || "Przejście jest zamknięte.") + " Otworzy je artefakt " + (inf ? "„" + inf.przedmiot + "” z dzielnicy " + inf.nazwa : "innej dzielnicy") + "."));
        zamykacz(); panel.hidden = false;
      }
    }
    // ---- misje (jak w GTA II): zleceniodawca z „!”, kolejne etapy: rozmowa, pytanie, dojście lub dojazd (czasem na czas),
    // zbieranie dowodów, jazda za taksówką. Dodatek jak znaleziska: nie wpływa na artefakt ani na podziemia.
    var MIS = MISJE.map(function (m) { return { def: m, x: (m.start[0] + 0.5) * TS, y: (m.start[1] + 0.5) * TS }; });
    var akt = null, panelMisji = false, misKadr = 0;
    var bezLimitu = (function () { try { return localStorage.getItem("neo-bez-limitu") === "1"; } catch (e) { return false; } })();
    var misBox = el("div", "wn-misja"); misBox.hidden = true; mapBox.appendChild(misBox);
    var misLive = el("p", "sr-only"); misLive.setAttribute("aria-live", "polite"); mapBox.appendChild(misLive);
    function pkt(t) { return { x: (t[0] + 0.5) * TS, y: (t[1] + 0.5) * TS }; }
    function krok() { return akt && akt.q.def.kroki[akt.k]; }
    function zleceniodawcaObok() {
      var best = null, bd = 9;
      MIS.forEach(function (q) { var d = Math.hypot(q.x - me.x, q.y - me.y); if (d < bd) { bd = d; best = q; } });
      return best;
    }
    function opisKroku(k) {
      if (k.opis) return k.opis;
      return { rozmowa: "Porozmawiaj: " + (k.postac || "świadek"), pytanie: "Odpowiedz na pytanie", idz: "Dotrzyj do celu",
               zbierz: "Zbierz dowody", sledz: "Jedź za taksówką" }[k.typ] || "";
    }
    function czasTxt(s) { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ":" + ("0" + s % 60).slice(-2); }
    function pokazPasek() {
      if (!akt) { misBox.hidden = true; return; }
      var k = krok(), n = akt.q.def.kroki.length, t = "MISJA · " + akt.q.def.tytul.toUpperCase() + " · ETAP " + (akt.k + 1) + "/" + n + ": " + opisKroku(k);
      if (k.typ === "zbierz") t += " (" + Object.keys(akt.zebrane).length + "/" + k.punkty.length + ")";
      if (k.limit && !bezLimitu) t += " · " + czasTxt(akt.czas) + (reduce ? " (orientacyjnie)" : "");
      if (k.typ === "sledz" && akt.daleko > 0) t += " · TRACISZ TROP " + czasTxt(8 - akt.daleko);
      misBox.textContent = t; misBox.hidden = false;
    }
    function ogloszenie(t) { misLive.textContent = t; }
    function zamknijPanelMisji() {
      var x = el("button", "ex-card-x wn-zamknij", "Zamknij"); x.type = "button";
      x.addEventListener("click", function () { panel.hidden = true; panelMisji = false; mapBox.focus({ preventScroll: true }); kick(); });
      panel.appendChild(x);
    }
    function panelStart(klasa) { panel.textContent = ""; panel.className = "sm-station wn-panel wn-mis " + (klasa || ""); panelMisji = true; panel.hidden = false; }
    function pokazZlecenie(q) {
      var m = q.def, zrobione = misjeWykonane().indexOf(m.id) >= 0;
      panelStart();
      panel.appendChild(el("p", "sm-k", "ZLECENIE · " + (m.zleceniodawca || "ARCHIWISTKA").toUpperCase() + (zrobione ? " · WYKONANE ✓" : "")));
      panel.appendChild(el("h3", null, m.tytul));
      if (m.opis) m.opis.split("\n\n").forEach(function (p) { panel.appendChild(el("p", null, p)); });
      var ol = el("ol", "wn-kroki"); m.kroki.forEach(function (k) { ol.appendChild(el("li", null, opisKroku(k) + (k.limit ? " (limit czasu)" : "") + (k.pojazd ? " (pojazdem)" : ""))); });
      panel.appendChild(ol);
      if (akt && akt.q === q) {
        panel.appendChild(el("p", "muted", "Ta misja trwa: etap " + (akt.k + 1) + " z " + m.kroki.length + "."));
        var prz = el("button", "ex-card-x", "Przerwij misję"); prz.type = "button";
        prz.addEventListener("click", function () { akt = null; pokazPasek(); panel.hidden = true; panelMisji = false; ogloszenie("Misja przerwana."); mapBox.focus({ preventScroll: true }); });
        panel.appendChild(prz); zamknijPanelMisji(); return;
      }
      if (m.kroki.some(function (k) { return k.limit; })) {
        var lab = el("label", "wn-check"), cb = el("input"); cb.type = "checkbox"; cb.checked = bezLimitu;
        cb.addEventListener("change", function () { bezLimitu = cb.checked; try { localStorage.setItem("neo-bez-limitu", bezLimitu ? "1" : "0"); } catch (e) {} });
        lab.appendChild(cb); lab.appendChild(document.createTextNode(" Bez limitu czasu (dla wszystkich misji)")); panel.appendChild(lab);
      }
      var row = el("p", "wn-btns");
      if (akt) row.appendChild(el("span", "muted", "Trwa inna misja: „" + akt.q.def.tytul + "”. Przyjęcie tej przerwie tamtą. "));
      var b = el("button", "btn", zrobione ? "Zagraj jeszcze raz" : "Przyjmij zlecenie"); b.type = "button";
      b.addEventListener("click", function () { akt = { q: q, k: 0 }; ogloszenie("Misja przyjęta: " + m.tytul + "."); startKroku(); });
      row.appendChild(b); panel.appendChild(row); zamknijPanelMisji();
      b.focus();
    }
    function startKroku() {
      var k = krok();
      if (!k) { koniec(); return; }
      akt.czas = k.limit || 0; akt.zebrane = {}; akt.otwarty = false; akt.daleko = 0; akt.ostrzez = false;
      if (k.typ === "sledz") { var s0 = pkt(k.trasa[0]); akt.lider = { typ: "taksowka", x: s0.x, y: s0.y, i: 1, a: 0, v: 0, kol: "#ff2a6d" }; }
      ogloszenie("Etap " + (akt.k + 1) + ": " + opisKroku(k));
      if ((k.typ === "rozmowa" || k.typ === "pytanie") && !k.cel) otworzKrok();
      else { panel.hidden = true; panel.textContent = ""; panelMisji = false; mapBox.focus({ preventScroll: true }); }
      pokazPasek(); kick();
    }
    function nastepny() { akt.k++; startKroku(); }
    function porazka(powod) {
      var q = akt.q, kk = akt.k;
      if (window.NeoUI) window.NeoUI.banner("MISJA NIEUDANA", powod.toUpperCase());
      panelStart("wn-porazka");
      panel.appendChild(el("p", "sm-k", "MISJA NIEUDANA"));
      panel.appendChild(el("h3", null, q.def.tytul));
      panel.appendChild(el("p", null, powod + " Etap możesz powtórzyć od razu."));
      var b = el("button", "btn", "Powtórz etap"); b.type = "button";
      b.addEventListener("click", function () { akt = { q: q, k: kk }; startKroku(); });
      panel.appendChild(b); zamknijPanelMisji(); b.focus();
      akt = { q: q, k: kk, wstrzymana: true }; pokazPasek(); ogloszenie("Misja nieudana: " + powod);
    }
    function koniec() {
      var m = akt.q.def; akt = null; pokazPasek();
      G.zapiszMisje(NR, m.id);
      if (window.NeoUI) window.NeoUI.banner("MISJA WYKONANA", m.tytul.toUpperCase());
      panelStart("wn-sukces");
      panel.appendChild(el("p", "sm-k", "MISJA WYKONANA ✓ · " + misjeWykonane().length + "/" + MISJE.length));
      panel.appendChild(el("h3", null, m.tytul));
      if (m.nagroda) panel.appendChild(el("p", null, m.nagroda));
      if (m.zrodlo) { var z = el("p", "sm-legend"); z.appendChild(document.createTextNode("Na podstawie: ")); z.appendChild(link(m.zrodlo.href, m.zrodlo.t, /^https?:/.test(m.zrodlo.href))); panel.appendChild(z); }
      zamknijPanelMisji(); ogloszenie("Misja wykonana: " + m.tytul + ".");
      var bz = panel.querySelector("button"); if (bz) bz.focus();
    }
    // etap rozmowy albo pytania w panelu (na mapie i w liście tekstowej to ten sam przebieg)
    function cialoKroku(k, gotowe) {
      var w = el("div", "wn-dial");
      if (k.typ === "rozmowa") {
        var i = 0, linie = k.kwestie || [];
        var rysuj = function () {
          w.textContent = "";
          for (var j = 0; j <= i && j < linie.length; j++) {
            var p = el("p", linie[j].kto === "ty" ? "wn-ty" : "wn-on");
            p.appendChild(el("b", null, (linie[j].kto === "ty" ? "Ty" : k.postac || "Świadek") + ": "));
            p.appendChild(document.createTextNode(linie[j].t)); w.appendChild(p);
          }
          var b = el("button", "ex-card-x", i + 1 < linie.length ? "Dalej →" : "Zakończ rozmowę"); b.type = "button";
          b.addEventListener("click", function () { if (i + 1 < linie.length) { i++; rysuj(); var bb = w.querySelector("button"); if (bb) bb.focus(); } else gotowe(); });
          w.appendChild(b);
        };
        rysuj();
      } else if (k.typ === "pytanie") {
        var fs = el("fieldset", "wn-pytanie"); fs.appendChild(el("legend", null, k.tresc));
        var fb = el("p"); fb.setAttribute("role", "status");
        var nazwa = "mis-" + Math.random().toString(36).slice(2);
        k.odpowiedzi.forEach(function (o, j) {
          var lab = el("label", "wn-odp"), r = el("input"); r.type = "radio"; r.name = nazwa;
          r.addEventListener("change", function () {
            if (fs.dataset.ok) return;
            if (j === k.poprawna) {
              fs.dataset.ok = "1"; fb.className = "wn-ok"; fb.textContent = "Dobrze. " + (k.wyjasnienie || "");
              var d = el("button", "ex-card-x", "Dalej →"); d.type = "button"; d.addEventListener("click", gotowe); w.appendChild(d); d.focus();
            } else { fb.className = "wn-zle"; fb.textContent = "To nie ta odpowiedź. Spróbuj jeszcze raz (podpowiedź jest w treści zajęć tej dzielnicy)."; }
          });
          lab.appendChild(r); lab.appendChild(document.createTextNode(" " + o)); fs.appendChild(lab);
        });
        w.appendChild(fs); w.appendChild(fb);
      }
      return w;
    }
    function otworzKrok() {
      var k = krok(); akt.otwarty = true;
      panelStart();
      panel.appendChild(el("p", "sm-k", "MISJA · " + akt.q.def.tytul.toUpperCase() + " · ETAP " + (akt.k + 1) + "/" + akt.q.def.kroki.length));
      if (k.opis) panel.appendChild(el("p", "muted", k.opis));
      var idx = akt.k, q0 = akt.q;   // przycisk działa tylko dla swojego etapu (podwójne kliknięcie nie przeskakuje etapów)
      panel.appendChild(cialoKroku(k, function () { if (akt && akt.q === q0 && akt.k === idx && !akt.wstrzymana) nastepny(); }));
      zamknijPanelMisji();
      var b = panel.querySelector("button, input"); if (b) b.focus();
    }
    function misjaAct() {
      if (akt && !akt.wstrzymana) {
        var k = krok();
        if ((k.typ === "rozmowa" || k.typ === "pytanie") && (!k.cel || Math.hypot(pkt(k.cel).x - me.x, pkt(k.cel).y - me.y) < 9)) { otworzKrok(); return true; }
      }
      var q = zleceniodawcaObok();
      if (q && !me.w) { pokazZlecenie(q); return true; }
      return false;
    }
    function misjaCel() {
      if (!akt || akt.wstrzymana) return null;
      var k = krok();
      if (k.typ === "zbierz") {
        var best = null, bd = 1e9;
        k.punkty.forEach(function (t, i) { if (akt.zebrane[i]) return; var p = pkt(t), d = Math.hypot(p.x - me.x, p.y - me.y); if (d < bd) { bd = d; best = p; } });
        return best;
      }
      if (k.typ === "sledz") return akt.lider;
      return k.cel ? pkt(k.cel) : null;
    }
    function misjaTick(f) {
      if (!akt || akt.wstrzymana) return;
      var k = krok(), wstrzym = !panel.hidden;
      if (k.limit && !bezLimitu && !reduce && !wstrzym) { akt.czas -= f / 60; if (akt.czas <= 0) { porazka("Skończył się czas."); return; } }
      if (k.typ === "idz") {
        var c = pkt(k.cel);
        if (Math.hypot(c.x - me.x, c.y - me.y) < 7) {
          if (k.pojazd && !me.w) { if (!akt.ostrzez) { akt.ostrzez = true; ogloszenie("Ten etap trzeba przejechać pojazdem."); prT.textContent = "TEN ETAP: POJAZDEM"; pr.hidden = false; } }
          else { nastepny(); return; }
        }
      } else if ((k.typ === "rozmowa" || k.typ === "pytanie") && k.cel && !akt.otwarty) {
        var c2 = pkt(k.cel);
        if (Math.hypot(c2.x - me.x, c2.y - me.y) < 7 && (!me.w || Math.abs(me.w.v) < 0.6)) { otworzKrok(); return; }
      } else if (k.typ === "zbierz") {
        k.punkty.forEach(function (t, i) {
          if (akt.zebrane[i]) return;
          var p = pkt(t);
          if (Math.hypot(p.x - me.x, p.y - me.y) < (me.w ? 7 : 5)) { akt.zebrane[i] = true; ogloszenie((k.przedmiot || "Dowód") + ": " + Object.keys(akt.zebrane).length + " z " + k.punkty.length + "."); }
        });
        if (Object.keys(akt.zebrane).length >= k.punkty.length) { nastepny(); return; }
      } else if (k.typ === "sledz") {
        var L = akt.lider, d = Math.hypot(L.x - me.x, L.y - me.y), czeka = wstrzym || (k.pojazd && !me.w);
        if (!czeka && d < 80) {
          var w = pkt(k.trasa[L.i]), dx = w.x - L.x, dy = w.y - L.y, dd = Math.hypot(dx, dy), v = (me.w ? 1.5 : 0.7) * SK * f;   // pieszo taksówka zwalnia, żeby dało się za nią nadążyć
          if (dd <= v) { L.x = w.x; L.y = w.y; L.i++; if (L.i >= k.trasa.length) { nastepny(); return; } }
          else { L.x += dx / dd * v; L.y += dy / dd * v; L.a = Math.atan2(dy, dx); }
          akt.daleko = 0;
        } else if (!czeka) {
          akt.daleko += f / 60;
          if (akt.daleko > 8 && !reduce) { porazka("Zgubiłeś trop: taksówka odjechała za daleko."); return; }
        }
      }
      if (misKadr++ % 10 === 0) pokazPasek();
    }
    function rysujMisje(fz) {
      var zrobione = misjeWykonane();
      MIS.forEach(function (q, i) {
        var done = zrobione.indexOf(q.def.id) >= 0, aktywna = akt && akt.q === q;
        var a = reduce ? 0.6 : 0.45 + Math.sin(fz * 3 + i) * 0.25, k = done && !aktywna ? "#7a7f90" : "#fcee0a";
        cx.save(); cx.globalAlpha = done ? 0.5 : a; cx.fillStyle = k;
        cx.beginPath(); cx.moveTo(q.x, q.y - 6); cx.lineTo(q.x + 5, q.y); cx.lineTo(q.x, q.y + 6); cx.lineTo(q.x - 5, q.y); cx.closePath(); cx.fill(); cx.restore();
        cx.fillStyle = "#07080f"; cx.fillRect(q.x - 0.5, q.y - 3, 1.5, 3.5); cx.fillRect(q.x - 0.5, q.y + 1.5, 1.5, 1.5);
      });
      if (!akt || akt.wstrzymana) return;
      var k = krok(), pulse = reduce ? 0.8 : 0.55 + Math.sin(fz * 5) * 0.35;
      function ring(p) { cx.save(); cx.globalAlpha = pulse; cx.strokeStyle = "#fcee0a"; cx.lineWidth = 1.2; cx.beginPath(); cx.arc(p.x, p.y, 6, 0, 7); cx.stroke(); cx.restore(); }
      if (k.typ === "zbierz") k.punkty.forEach(function (t, i) { if (akt.zebrane[i]) return; var p = pkt(t); cx.fillStyle = "#fcee0a"; cx.fillRect(p.x - 2, p.y - 2, 4, 3); cx.fillStyle = "#07080f"; cx.fillRect(p.x - 1, p.y - 1, 2, 1); ring(p); });
      else if (k.typ === "sledz") { rysujPojazd(akt.lider, fz); ring(akt.lider); }
      else if (k.cel) ring(pkt(k.cel));
    }
    prB.addEventListener("click", act); prT.addEventListener("click", act);
    wysiadzBtn.addEventListener("click", function () { wysiadz(); mapBox.focus({ preventScroll: true }); });

    // ---- ruch
    var DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
    var KEYMAP = { ArrowUp: "up", KeyW: "up", ArrowDown: "down", KeyS: "down", ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right" };
    function wejscie() {   // wektor sterowania [dx, dy, siła] z klawiszy, joysticka albo celu dotknięcia
      var dx = 0, dy = 0;
      Object.keys(DIRS).forEach(function (k) { if (keys[k]) { dx += DIRS[k][0]; dy += DIRS[k][1]; } });
      if (dx || dy) { target = null; var n = Math.hypot(dx, dy); return [dx / n, dy / n, 1, true]; }
      if (joy && (joy.x || joy.y)) { target = null; var m = Math.min(1, Math.hypot(joy.x, joy.y)); return m < 0.15 ? null : [joy.x / Math.hypot(joy.x, joy.y), joy.y / Math.hypot(joy.x, joy.y), m, false]; }
      if (target) {
        var tx = target[0] - me.x, ty = target[1] - me.y, d = Math.hypot(tx, ty);
        if (d < (me.w ? 6 : 2)) { target = null; return null; }
        return [tx / d, ty / d, me.w ? Math.min(1, d / 30) : 1, false];
      }
      return null;
    }
    function pieszo(f) {
      var w = wejscie(), v = (keys.run ? 1.5 : 1) * 0.95 * SK, cel = w ? [w[0] * v * w[2], w[1] * v * w[2]] : [0, 0];
      var k = Math.min(1, 0.3 * f);
      me.vx += (cel[0] - me.vx) * k; me.vy += (cel[1] - me.vy) * k;
      if (Math.abs(me.vx) < 0.01 && Math.abs(me.vy) < 0.01) { me.vx = me.vy = 0; return false; }
      var sx = me.vx * f, sy = me.vy * f, ruch = false;
      if (walk(me.x + sx, me.y)) { me.x += sx; ruch = true; } else { me.vx = 0; }
      if (walk(me.x, me.y + sy)) { me.y += sy; ruch = true; } else { me.vy = 0; }
      if (!ruch && target) target = null;
      if (w) me.a += katRoznica(Math.atan2(w[1], w[0]), me.a) * Math.min(1, 0.35 * f);
      me.step += f;
      return ruch;
    }
    function jazda(f) {
      var p = me.w, t = POJ[p.typ], gaz = 0, skret = 0, w = null;
      if (keys.up || keys.down || keys.left || keys.right) {   // jak w GTA II: góra gaz, dół hamulec i wsteczny, boki skręt
        target = null; gaz = (keys.up ? 1 : 0) - (keys.down ? 1 : 0); skret = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
      } else if ((w = wejscie())) {   // joystick lub cel: jedź w tę stronę
        var roz = katRoznica(Math.atan2(w[1], w[0]), p.a);
        skret = Math.max(-1, Math.min(1, roz * 2.5)); gaz = Math.abs(roz) < 2.3 ? w[2] : -0.5;
      }
      var vmax = t.vmax * SK * (keys.run ? 1.15 : 1);
      if (gaz) p.v += gaz * t.przysp * SK * f; else p.v *= Math.pow(0.95, f);
      if (gaz < 0 && p.v > 0) p.v *= Math.pow(0.9, f);   // hamowanie
      p.v = Math.max(-vmax * 0.4, Math.min(vmax, p.v));
      if (Math.abs(p.v) < 0.02 && !gaz) p.v = 0;
      var a0 = p.a;
      p.a += skret * t.skret * f * Math.max(-1, Math.min(1, p.v / (0.8 * SK)));
      if (!p.v) { if (!pojazdWolny(p, p.x, p.y, p.a)) p.a = a0; return false; }
      var nx = p.x + Math.cos(p.a) * p.v * f, ny = p.y + Math.sin(p.a) * p.v * f;
      // przechodzień przed maską: pojazd staje, przechodzień odskakuje
      var przod = t.dl * TS / 2 + 2, fx = nx + Math.cos(p.a) * przod * Math.sign(p.v), fy = ny + Math.sin(p.a) * przod * Math.sign(p.v);
      for (var i = 0; i < ludzie.length; i++) if (Math.hypot(ludzie[i].x - fx, ludzie[i].y - fy) < 4) {
        var l = ludzie[i], bx = l.x + Math.cos(p.a + Math.PI / 2) * TS, by = l.y + Math.sin(p.a + Math.PI / 2) * TS;
        if (!walk(bx, by)) { bx = l.x - Math.cos(p.a + Math.PI / 2) * TS; by = l.y - Math.sin(p.a + Math.PI / 2) * TS; }
        if (walk(bx, by)) { l.x = bx; l.y = by; }   // odsunięcie na bok także w trybie ograniczonego ruchu (tam przechodnie stoją)
        p.v = 0; l.uwaga = 40; l.a = p.a + Math.PI / 2; return false;
      }
      if (pojazdWolny(p, nx, ny, p.a)) { p.x = nx; p.y = ny; me.x = nx; me.y = ny; return true; }
      p.a = a0;   // ruch odrzucony: cofamy też obrót, żeby narożniki nie utknęły w zabudowie
      p.v = -p.v * 0.25;   // odbicie od krawężnika lub ściany
      return false;
    }
    function przechodnie(f) {
      ludzie.forEach(function (l) {
        if (l.uwaga > 0) l.uwaga -= f;
        l.t -= f;
        var v = (l.uwaga > 0 ? 2.2 : 1) * l.v * SK * 0.6, nx = l.x + Math.cos(l.a) * v * f, ny = l.y + Math.sin(l.a) * v * f;
        var k = ch(Math.floor(nx / TS), Math.floor(ny / TS));
        if (l.t <= 0 || ".:,_".indexOf(k) < 0) { l.a = Math.floor(rnd() * 4) * Math.PI / 2 + (rnd() - 0.5) * 0.6; l.t = 40 + rnd() * 220; return; }
        l.x = nx; l.y = ny; l.krok = (l.krok || 0) + f;
      });
    }
    function tick(t) {
      raf = null;
      var f = last ? Math.min(3, ((t || 0) - last) / 16.67) : 1; last = t || 0;
      if (f <= 0) f = 1;
      var ruch = me.w ? jazda(f) : pieszo(f);
      if (!reduce) przechodnie(f);
      if (ruch) { aktualizujPrompt(); sprawdzZnaleziska(); }
      else if (me.w && Math.abs(me.w.v) < 0.6) aktualizujPrompt();
      misjaTick(f);
      kamera(f);
      draw(t);
      odswiezHud();
      if (widoczna && (!reduce || ruch || target || (me.w && me.w.v) || (akt && krok() && krok().typ === "sledz"))) raf = requestAnimationFrame(tick);
      else last = 0;
    }
    function kick() { if (!raf) raf = requestAnimationFrame(tick); }
    var widoczna = true;
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { widoczna = es[0].isIntersecting; if (widoczna) kick(); }).observe(mapBox);

    mapBox.addEventListener("keydown", function (e) {
      if (e.target !== mapBox || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.code === "KeyE" || e.key === "Enter" || e.key === " ") { act(); e.preventDefault(); return; }
      if (e.key === "Escape" && pelny) { ustawPelny(false); return; }
      if (e.key === "Shift") { keys.run = true; return; }
      var d = KEYMAP[e.code] || KEYMAP[e.key];
      if (d) { keys[d] = true; e.preventDefault(); kick(); }
    });
    mapBox.addEventListener("keyup", function (e) { if (e.key === "Shift") keys.run = false; var d = KEYMAP[e.code] || KEYMAP[e.key]; if (d) keys[d] = false; });
    mapBox.addEventListener("blur", function () { puscKlawisze(); });
    function naPlan(e) { var rr = cv.getBoundingClientRect(); return [camX + (e.clientX - rr.left) * VW / rr.width, camY + (e.clientY - rr.top) * VH / rr.height]; }
    // mysz: kliknięcie = idź (jedź) tutaj; dotyk: przeciąganie = joystick, krótkie dotknięcie = idź tutaj
    cv.addEventListener("pointerdown", function (e) {
      mapBox.focus({ preventScroll: true });
      if (e.pointerType === "mouse") { target = naPlan(e); kick(); return; }
      var rb = mapBox.getBoundingClientRect();
      joy = { id: e.pointerId, sx: e.clientX, sy: e.clientY, x: 0, y: 0, t0: Date.now(), cel: naPlan(e) };
      joyEl.style.left = (e.clientX - rb.left) + "px"; joyEl.style.top = (e.clientY - rb.top) + "px"; joyEl.hidden = false;
      joyEl.firstChild.style.transform = "translate(-50%, -50%)";
      try { cv.setPointerCapture(e.pointerId); } catch (x) {}
      e.preventDefault(); kick();
    });
    cv.addEventListener("pointermove", function (e) {
      if (!joy || e.pointerId !== joy.id) return;
      var R = 36, dx = e.clientX - joy.sx, dy = e.clientY - joy.sy, d = Math.hypot(dx, dy), k = d > R ? R / d : 1;
      joy.x = dx * k / R; joy.y = dy * k / R;
      joyEl.firstChild.style.transform = "translate(calc(-50% + " + dx * k + "px), calc(-50% + " + dy * k + "px))";
      kick();
    });
    function joyKoniec(e) {
      if (!joy || e.pointerId !== joy.id) return;
      if (Date.now() - joy.t0 < 250 && Math.hypot(joy.x, joy.y) < 0.3) target = joy.cel;
      joy = null; joyEl.hidden = true; kick();
    }
    ["pointerup", "pointercancel"].forEach(function (ev) { cv.addEventListener(ev, joyKoniec); });
    document.addEventListener("visibilitychange", function () { if (document.hidden) { puscKlawisze(); joy = null; joyEl.hidden = true; } });

    // pełny ekran (klasa CSS; iOS nie pozwala na Fullscreen API dla zwykłych elementów); kadr dopasowany do ekranu
    var pelny = false;
    function ustawPelny(v) {
      pelny = v; mapBox.classList.toggle("wn-full", v); document.documentElement.classList.toggle("ex-full-on", v);
      // reszta strony nieaktywna w pełnym ekranie: fokus klawiatury zostaje na mapie i jej przyciskach
      var e2 = mapBox;
      while (e2 && e2.parentNode && e2 !== document.body) {
        [].forEach.call(e2.parentNode.children, function (sib) { if (sib !== e2 && sib.tagName !== "SCRIPT" && sib.tagName !== "STYLE") { if (v) sib.setAttribute("inert", ""); else sib.removeAttribute("inert"); } });
        e2 = e2.parentNode;
      }
      fullBtn.setAttribute("aria-pressed", String(v)); fullBtn.textContent = v ? "ZAMKNIJ PEŁNY EKRAN" : "PEŁNY EKRAN";
      if (v) { mapBox.appendChild(wysiadzBtn); mapBox.appendChild(fullBtn); mapBox.appendChild(panel); }
      else { bar.appendChild(wysiadzBtn); bar.appendChild(fullBtn); lista.parentNode.insertBefore(panel, lista); }
      rozmiar();
      mapBox.focus({ preventScroll: true });
    }
    fullBtn.addEventListener("click", function () { ustawPelny(!pelny); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && pelny && e.target !== mapBox && !document.querySelector(".przew")) ustawPelny(false); });
    var tRoz = null;
    window.addEventListener("resize", function () { clearTimeout(tRoz); tRoz = setTimeout(rozmiar, 120); });

    document.addEventListener("neo:postep", function () { odswiezListe(); odswiezHud(true); });
    root._wn = { me: me, kick: kick, step: tick, miejsca: MIEJSCA, znal: ZNAL, act: act, pojazdy: pojazdy, ludzie: ludzie, keys: keys,
                 kadr: function () { return { camX: camX, camY: camY, VW: VW, VH: VH }; }, pelny: ustawPelny, misja: function () { return akt; } };   // do testów
    rozmiar(); aktualizujPrompt(); sprawdzZnaleziska(); odswiezHud(true);
    if (coarse && fokus) ustawPelny(true);   // telefon: od razu pełny ekran
    else if (fokus) mapBox.focus({ preventScroll: true });
    kick();
  }

  var hudTxt = "", artefaktByl = null, wPojezdzie = "";
  function odswiezHud(wymus) {
    var art = cache().art;
    var t = NR + " · " + D.nazwa.toUpperCase() + " · MIEJSCA " + odwiedzone().length + "/7 · ZNALEZISKA " + znalezione().length + "/" + ZNAL.length + " · ARTEFAKT " + (art ? "✓" : "✗") + (MISJE.length ? " · MISJE " + misjeWykonane().length + "/" + MISJE.length : "") + (wPojezdzie ? " · " + wPojezdzie : "");
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
    if (MISJE.length) lista.appendChild(misjeTekst());
    odswiezListe();
  }
  // misje w wersji tekstowej (bez mapy): rozmowy i pytania wykonuje się tutaj; etapy ruchu są opisane
  function misjeTekst() {
    var box = el("div", "wn-misje-tekst");
    misjeH4 = el("h4", null, "Misje (tekst) · " + misjeWykonane().length + "/" + MISJE.length); box.appendChild(misjeH4);
    MISJE.forEach(function (m) {
      var d = el("details", "wn-miejsce"), s = el("summary", null, m.tytul + (misjeWykonane().indexOf(m.id) >= 0 ? " ✓" : "")), body = null;
      d.appendChild(s);
      d.addEventListener("toggle", function () {
        if (!d.open || body) return;
        body = el("div", "wn-body");
        if (m.opis) body.appendChild(el("p", null, m.opis));
        var ile = 0, pyt = m.kroki.filter(function (k) { return k.typ === "pytanie"; }).length, stat = el("p", "wn-ok");
        m.kroki.forEach(function (k, i) {
          body.appendChild(el("p", "sm-k", "ETAP " + (i + 1)));
          if (k.typ === "rozmowa" || k.typ === "pytanie") {
            body.appendChild(cialoKrokuTekst(k, function () {
              if (k.typ === "pytanie") ile++;
              if (ile >= pyt) { G.zapiszMisje(NR, m.id); s.textContent = m.tytul + " ✓"; stat.textContent = "Misja zaliczona w wersji tekstowej ✓"; }
            }));
          } else body.appendChild(el("p", "muted", (k.opis || "Etap na mapie") + " (etap na mapie dzielnicy)"));
        });
        body.appendChild(stat);
        d.appendChild(body);
      });
      box.appendChild(d);
    });
    return box;
  }
  // ta sama rozmowa i pytanie co na mapie, bez przełączania etapów
  function cialoKrokuTekst(k, gotowe) {
    var w = el("div", "wn-dial");
    if (k.typ === "rozmowa") {
      (k.kwestie || []).forEach(function (l) {
        var p = el("p", l.kto === "ty" ? "wn-ty" : "wn-on");
        p.appendChild(el("b", null, (l.kto === "ty" ? "Ty" : k.postac || "Świadek") + ": ")); p.appendChild(document.createTextNode(l.t)); w.appendChild(p);
      });
      return w;
    }
    var fs = el("fieldset", "wn-pytanie"); fs.appendChild(el("legend", null, k.tresc));
    var fb = el("p"); fb.setAttribute("role", "status"); var nazwa = "mist-" + Math.random().toString(36).slice(2);
    k.odpowiedzi.forEach(function (o, j) {
      var lab = el("label", "wn-odp"), r = el("input"); r.type = "radio"; r.name = nazwa;
      r.addEventListener("change", function () {
        if (fs.dataset.ok) return;
        if (j === k.poprawna) { fs.dataset.ok = "1"; fb.className = "wn-ok"; fb.textContent = "Dobrze. " + (k.wyjasnienie || ""); gotowe(); }
        else { fb.className = "wn-zle"; fb.textContent = "To nie ta odpowiedź. Spróbuj jeszcze raz."; }
      });
      lab.appendChild(r); lab.appendChild(document.createTextNode(" " + o)); fs.appendChild(lab);
    });
    w.appendChild(fs); w.appendChild(fb);
    return w;
  }
  var misjeH4 = null;
  function odswiezListe() {
    if (misjeH4) misjeH4.textContent = "Misje (tekst) · " + misjeWykonane().length + "/" + MISJE.length;
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
