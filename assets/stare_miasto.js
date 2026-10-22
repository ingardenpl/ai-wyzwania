/* NEO-LUBLIN 2049: świat podziemny. Pod neonowym miastem przetrwało historyczne Stare Miasto Lublina.
   Plan jest schematyczny, nie w skali. Inspektor chodzi z latarnią po ulicach i placach,
   odwiedza stacje (fakty o miejscu + pytanie z kursu), a w Trybunale czeka Archiwum (kod z zajęć).
   Wejście: wszystkie dzielnice zaliczone (quiz po terminie spotkania), kod z ostatniego spotkania
   albo strona przebudowana od 22.01.2027. Postęp zapisuje się tylko w tej przeglądarce.
   Dołączany przez miasto.js na stronie podziemia.html. */
(function () {
  "use strict";
  var tresc = document.getElementById("pod-tresc");
  if (!tresc) return;
  var P = window.NeoPostep;
  var W = 320, H = 180;

  // ---------------------------------------------------------------- stacje (fakty sprawdzone w źródłach, patrz zrodlo)
  // Sprawdzone 20.10.2026. Niepewne szczegóły (dokładne daty Wieży Trynitarskiej, rok końca rozbiórki
  // fary, obecne miejsce stołu z Czarcią Łapą) celowo pominięto.
  var STACJE = [
    { id: "trybunal", x: 161, y: 100, archiwum: true, temat: "08", nazwa: "Trybunał Koronny: wejście do Archiwum",
      fakt: "Trybunał Koronny ustanowiono w 1578 r. jako najwyższy sąd dla szlachty Korony; król Stefan Batory zrzekł się wtedy roli najwyższego sędziego na rzecz sądu wybieranego przez szlachtę. Lublin był siedzibą Trybunału dla Małopolski, a sesje odbywały się w dawnym ratuszu na Rynku. Pod nim zaczyna się Lubelska Trasa Podziemna.",
      pytanie: "Trybunał był ostatnią instancją. Czy system AI wspierający sędziego może kiedykolwiek pełnić taką rolę?",
      zrodlo_tytul: "Wikipedia: Trybunał Koronny", zrodlo_url: "https://pl.wikipedia.org/wiki/Trybuna%C5%82_Koronny" },
    { id: "czarcia-lapa", x: 182, y: 90, temat: "08", nazwa: "Czarcia Łapa",
      fakt: "Według legendy wdowa skrzywdzona wyrokiem przekupionych sędziów zawołała, że sprawiedliwiej osądziłyby ją diabły. O północy diabły zasiadły w Trybunale i wydały wyrok na jej korzyść, a jeden z nich wypalił w stole ślad łapy. Stół z odciskiem przetrwał i pokazuje się go zwiedzającym w Lublinie.",
      pytanie: "Wdowa wolała sąd diabłów od przekupnych ludzi. Czy wolelibyśmy algorytm od omylnego sędziego? Co mówią o tym art. 22 RODO i AI Act (wymiar sprawiedliwości jako obszar wysokiego ryzyka)?",
      zrodlo_tytul: "RMF24: Lublin, legendy miasta", zrodlo_url: "https://www.rmf24.pl/fakty/news-lublin-w-twoim-miescie-w-rmf-fm-i-tvp-info,nId,1850210" },
    { id: "brama-krakowska", x: 66, y: 91, temat: "01", nazwa: "Brama Krakowska",
      fakt: "Brama powstała w XIV w., za Kazimierza Wielkiego, jako część murów obronnych i główne wejście do miasta od strony traktu na Kraków. Odbudowywano ją po pożarach w XVI w., a w XVIII w. zyskała barokowy hełm. Dziś mieści Muzeum Historii Miasta Lublina.",
      pytanie: "Brama decydowała, kto wchodzi do miasta. Jaką „bramą” dla AI Act jest definicja systemu AI z art. 3 pkt 1?",
      zrodlo_tytul: "Wikipedia: Brama Krakowska w Lublinie", zrodlo_url: "https://pl.wikipedia.org/wiki/Brama_Krakowska_w_Lublinie" },
    { id: "brama-grodzka", x: 228, y: 55, pamiec: true, nazwa: "Brama Grodzka",
      fakt: "Brama Grodzka, zwana też Bramą Żydowską, prowadziła z chrześcijańskiej części miasta do dzielnicy żydowskiej u stóp zamku. Dzielnica istniała od końca XIV w. i została zniszczona w czasie okupacji niemieckiej. Dziś w bramie działa Ośrodek „Brama Grodzka – Teatr NN”, który przywraca pamięć o polsko-żydowskim Lublinie.",
      zrodlo_tytul: "Wikipedia: Brama Grodzka w Lublinie", zrodlo_url: "https://pl.wikipedia.org/wiki/Brama_Grodzka_w_Lublinie" },
    { id: "plac-po-farze", x: 162, y: 46, temat: "08", nazwa: "Plac po Farze",
      fakt: "Stał tu kościół farny św. Michała Archanioła, rozbierany od 1846 r. Tradycja łączy jego fundację z Leszkiem Czarnym i snem o św. Michale przed bitwą z Jaćwingami; historycy uznają tę opowieść za niepewną. Fundamenty odsłonięto i wyeksponowano, więc widać ślad budowli, której już nie ma.",
      pytanie: "Kościół zniknął, a fundamenty zostały. Czy dane usunięte z bazy znikają z modelu, który się na nich uczył? Pomyśl o prawie do usunięcia danych (art. 17 RODO).",
      zrodlo_tytul: "Wikipedia: Kościół farny św. Michała Archanioła w Lublinie", zrodlo_url: "https://pl.wikipedia.org/wiki/Ko%C5%9Bci%C3%B3%C5%82_farny_%C5%9Bw._Micha%C5%82a_Archanio%C5%82a_w_Lublinie" },
    { id: "wieza-trynitarska", x: 100, y: 135, temat: "09", nazwa: "Wieża Trynitarska",
      fakt: "Wieża była najpierw furtą kolegium jezuickiego, później dzwonnicą, a w XIX w. zyskała neogotycką nadbudowę. Dziś mieści Muzeum Archidiecezjalne, a z jej tarasu widać panoramę całego Lublina.",
      pytanie: "Z wieży widać daleko, ale nie wszystko. Które prognozy z dzielnicy Czuby (przyszłość AI) uważasz za najbardziej wiarygodne i dlaczego?",
      zrodlo_tytul: "Wikipedia: Wieża Trynitarska w Lublinie", zrodlo_url: "https://pl.wikipedia.org/wiki/Wie%C5%BCa_Trynitarska_w_Lublinie" },
    { id: "zamek", x: 276, y: 52, temat: "07", nazwa: "Zamek Lubelski: Kaplica Trójcy Świętej i Unia lubelska",
      fakt: "Freski w zamkowej Kaplicy Trójcy Świętej ukończono w 1418 r. z fundacji Władysława Jagiełły: to malowidła w stylu rusko-bizantyjskim w gotyckim wnętrzu. 1 lipca 1569 r. na sejmie w Lublinie zaprzysiężono Unię lubelską, z której powstała Rzeczpospolita Obojga Narodów. Dziś w zamku działa muzeum.",
      pytanie: "Unia połączyła dwa państwa jednym aktem. AI Act łączy 27 państw jednym rozporządzeniem: co to daje, a czego nie załatwia?",
      zrodlo_tytul: "Wikipedia: Chapel of the Holy Trinity, Lublin Castle", zrodlo_url: "https://en.wikipedia.org/wiki/Chapel_of_the_Holy_Trinity,_Lublin_Castle" },
    { id: "trasa-podziemna", x: 136, y: 76, temat: "08", nazwa: "Lubelska Trasa Podziemna",
      fakt: "Trasę udostępniono w 2006 r. Ma około 300 metrów i biegnie 9–12 metrów pod Rynkiem i sąsiednimi ulicami. Powstała z połączenia kilkunastu dawnych piwnic kupieckich; wejście jest w gmachu Trybunału na Rynku.",
      pytanie: "Trasa powstała z połączenia osobnych piwnic. Jak łączenie rozproszonych zbiorów danych zmienia ryzyko dla prywatności?",
      zrodlo_tytul: "Wikipedia: Lubelska Trasa Podziemna", zrodlo_url: "https://pl.wikipedia.org/wiki/Lubelska_Trasa_Podziemna" }
  ];

  // ---------------------------------------------------------------- plan (prostokąty do chodzenia i zabudowa)
  var STREETS = [
    [0, 87, 70, 8],      // Krakowskie Przedmieście (wyjście na zachód)
    [70, 87, 62, 8],     // Bramowa
    [128, 68, 64, 46],   // Rynek
    [186, 56, 10, 16], [192, 52, 34, 9],   // Grodzka
    [226, 50, 26, 8],    // za Bramą Grodzką: plac i grobla
    [252, 30, 50, 44],   // dziedziniec zamkowy
    [148, 34, 30, 34],   // Plac po Farze i przejście
    [100, 112, 34, 8], [92, 118, 36, 34],  // ku katedrze, plac katedralny
    [190, 104, 30, 8]    // Złota
  ];
  var BUILD = [ // [x, y, w, h, kolor] kamienice i budynki (tylko dekoracja)
    [72, 76, 56, 10, "#5a3a2a"], [72, 96, 26, 14, "#6a4030"], [100, 96, 26, 14, "#5a2e26"],
    [128, 56, 18, 11, "#6a4632"], [196, 64, 26, 30, "#5a3a2a"], [128, 115, 30, 18, "#6a4030"], [160, 115, 30, 16, "#5a2e26"],
    [192, 74, 30, 28, "#6a4632"], [222, 106, 24, 22, "#5a3a2a"], [180, 28, 40, 22, "#5a2e26"], [110, 40, 36, 30, "#6a4030"]
  ];
  function walk(x, y) {
    if (x < 1 || y < 1 || x > W - 2 || y > H - 2) return false;
    return STREETS.some(function (r) { return x >= r[0] && x <= r[0] + r[2] && y >= r[1] && y <= r[1] + r[3]; });
  }

  function readJSON(k, def) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch (e) { return def; } }
  function writeJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function cityData() { var e = document.getElementById("city-data"); try { return e ? JSON.parse(e.textContent) : {}; } catch (x) { return {}; } }
  function otwarty() {
    var pd = cityData().podziemia || {};
    if (pd.jawne || P.zaliczone().length >= 10) return true;
    try { return localStorage.getItem("neo-podziemia") === "1"; } catch (e) { return false; }
  }

  // ---------------------------------------------------------------- sekcja na stronie
  var sec = el("section", "sm-world"); sec.id = "swiat";
  var anchor = document.getElementById("pod-zamek") || tresc;
  anchor.parentNode.insertBefore(sec, anchor);

  function gate() {
    sec.innerHTML = "";
    var g = el("div", "sm-gate");
    var n = P.zaliczone().length;
    g.appendChild(el("p", null, "Schody kończą się kratą. Świat pod Rynkiem otwiera się, gdy zaliczysz wszystkie dziesięć dzielnic: zdany quiz w dzielnicy po terminie jej spotkania. Zaliczone: " + n + "/10."));
    g.appendChild(el("p", null, "Na ostatnim spotkaniu (22.01.2027) Archiwistka poda kod dostępu: otwiera i kratę, i Archiwum Trybunału. Postęp zapisuje się tylko w tej przeglądarce."));
    sec.appendChild(g);
  }

  var built = false;
  function build() {
    if (built) return; built = true;
    sec.innerHTML = "";
    sec.appendChild(el("h2", null, "Stare Miasto pod ziemią"));
    sec.appendChild(el("p", null, "Pod neonami Neo-Lublina przetrwało historyczne Stare Miasto. Chodź z latarnią po ulicach i placach, odwiedzaj stacje, a na końcu wejdź do Archiwum w Trybunale."));
    var map = el("div", "sm-map"); map.tabIndex = 0;
    map.setAttribute("aria-label", "Mapa podziemi Starego Miasta. Strzałki lub WASD: ruch, E: odczytaj stację. Lista stacji jest też pod mapą.");
    var cv = el("canvas"); cv.width = W; cv.height = H; cv.setAttribute("aria-hidden", "true");
    map.appendChild(cv);
    var pad = el("div", "ex-pad");
    [["up", "▲"], ["left", "◀"], ["down", "▼"], ["right", "▶"]].forEach(function (b) { var x = el("button", "ex-pad-" + b[0], b[1]); x.type = "button"; x.dataset.dir = b[0]; x.setAttribute("aria-label", "Idź: " + b[0]); pad.appendChild(x); });
    map.appendChild(pad);
    sec.appendChild(map);
    sec.appendChild(el("p", "sm-legend", "Plan schematyczny, nie w skali. Strzałki lub WASD albo dotknięcie celu: ruch · E: odczytaj stację. Kliknij mapę, żeby sterować klawiaturą."));
    var panel = el("div", "sm-station"); panel.setAttribute("aria-live", "polite"); panel.hidden = true; sec.appendChild(panel);
    var list = el("details", "sm-list"); list.appendChild(el("summary", null, "Wszystkie stacje (tekst)")); var ol = el("ol"); list.appendChild(ol); sec.appendChild(list);
    STACJE.forEach(function (s) { var li = el("li"); li.appendChild(stationBody(s)); ol.appendChild(li); });

    var c = cv.getContext("2d"); c.imageSmoothingEnabled = false;
    var me = { x: 174, y: 108, step: 0, dir: "down" };
    var keys = {}, target = null, raf = null, near = null;
    var visited = readJSON("neo-stacje", []);
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // tło: bruk, kamienice, zabytki
    var base = document.createElement("canvas"); base.width = W; base.height = H; var b = base.getContext("2d");
    b.fillStyle = "#0d0a08"; b.fillRect(0, 0, W, H);
    var seed = 1317; function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    STREETS.forEach(function (r) { b.fillStyle = "#2b2622"; b.fillRect(r[0], r[1], r[2], r[3]); for (var k = 0; k < r[2] * r[3] / 6; k++) { b.fillStyle = rnd() < 0.5 ? "#3a332c" : "#231f1b"; b.fillRect(r[0] + rnd() * r[2], r[1] + rnd() * r[3], 1, 1); } });
    BUILD.forEach(function (r) { b.fillStyle = "rgba(0,0,0,.5)"; b.fillRect(r[0] + 2, r[1] + 2, r[2], r[3]); b.fillStyle = r[4]; b.fillRect(r[0], r[1], r[2], r[3]); b.fillStyle = "rgba(255,220,180,.12)"; b.fillRect(r[0], r[1], r[2], 1); });
    // Trybunał (dawny ratusz) na środku Rynku
    b.fillStyle = "#8a7a62"; b.fillRect(150, 80, 22, 18); b.fillStyle = "#a8967a"; b.fillRect(150, 80, 22, 2); b.fillStyle = "#5a4a3a"; b.fillRect(158, 74, 6, 8); b.fillStyle = "#2a2018"; b.fillRect(159, 92, 4, 6);
    // Brama Krakowska i Brama Grodzka
    [[62, 80, 10, 22], [222, 44, 8, 22]].forEach(function (g) { b.fillStyle = "#7a5a3a"; b.fillRect(g[0], g[1], g[2], g[3]); b.fillStyle = "#3a2a1a"; b.fillRect(g[0] + 2, g[1] + g[3] / 2 - 3, g[2] - 4, 6); b.fillStyle = "#c08a4a"; b.fillRect(g[0], g[1], g[2], 1); });
    // Zamek z kaplicą
    b.strokeStyle = "#8a8070"; b.lineWidth = 2; b.strokeRect(253, 31, 48, 42); b.fillStyle = "#6a6458"; b.fillRect(285, 26, 12, 12); b.fillStyle = "#c8c0b0"; b.fillRect(262, 36, 12, 9); b.fillStyle = "#e0d8c8"; b.fillRect(266, 33, 3, 3);
    // Plac po Farze: zarys fundamentów
    b.strokeStyle = "#5a5248"; b.lineWidth = 1; b.setLineDash([2, 2]); b.strokeRect(152.5, 38.5, 20, 14); b.setLineDash([]);
    // Katedra i Wieża Trynitarska
    b.fillStyle = "#7a7064"; b.fillRect(104, 124, 22, 16); b.fillStyle = "#9a9080"; b.fillRect(104, 124, 22, 2); b.fillStyle = "#6a6058"; b.fillRect(94, 122, 8, 12); b.fillStyle = "#b8b0a0"; b.fillRect(96, 119, 4, 4);
    // tunele Trasy Podziemnej pod Rynkiem
    b.strokeStyle = "rgba(255,179,71,.25)"; b.setLineDash([2, 3]); b.beginPath(); b.moveTo(134, 74); b.lineTo(186, 74); b.lineTo(186, 108); b.lineTo(134, 108); b.closePath(); b.stroke(); b.setLineDash([]);

    function draw(t) {
      c.drawImage(base, 0, 0);
      // stacje: lampki
      STACJE.forEach(function (s) {
        var v = visited.indexOf(s.id) >= 0;
        c.save(); c.globalAlpha = 0.25 + (reduce ? 0 : Math.sin((t || 0) / 15 + s.x) * 0.1); c.fillStyle = s.pamiec ? "#c8d0e0" : "#ffb347"; c.beginPath(); c.arc(s.x, s.y, 6, 0, 7); c.fill(); c.restore();
        c.fillStyle = s.pamiec ? "#e7e9f2" : (v ? "#8a6a3a" : "#fff0b0"); c.fillRect(s.x - 1, s.y - 1, 3, 3);
      });
      // ciemność z kręgiem światła latarni
      var dark = c.createRadialGradient(me.x, me.y - 3, 10, me.x, me.y - 3, 70);
      dark.addColorStop(0, "rgba(0,0,0,0)"); dark.addColorStop(1, "rgba(0,0,0,0.88)");
      c.fillStyle = dark; c.fillRect(0, 0, W, H);
      // lampki stacji świecą przez ciemność
      STACJE.forEach(function (s) { c.fillStyle = s.pamiec ? "#e7e9f2" : "#ffb347"; c.fillRect(s.x, s.y, 1, 1); });
      // inspektor z latarnią
      var x = Math.round(me.x), y = Math.round(me.y), leg = (me.step >> 3) % 2;
      c.fillStyle = "rgba(0,0,0,.5)"; c.fillRect(x - 2, y + 1, 6, 2);
      c.fillStyle = "#14161f"; c.fillRect(x - 3, y - 8, 7, 1); c.fillRect(x - 2, y - 9, 5, 1);
      c.fillStyle = "#e0b48a"; c.fillRect(x - 1, y - 7, 3, 2);
      c.fillStyle = "#b8893a"; c.fillRect(x - 2, y - 5, 5, 4);
      c.fillStyle = "#fff0b0"; c.fillRect(me.dir === "left" ? x - 4 : x + 3, y - 5, 2, 2);
      c.fillStyle = "#2a2e3a"; c.fillRect(x - 2 + leg, y - 1, 1, 2); c.fillRect(x + 1 - leg, y - 1, 1, 2);
    }

    function stationBody(s) {
      var f = document.createDocumentFragment();
      f.appendChild(el("p", "sm-k", s.pamiec ? "MIEJSCE PAMIĘCI" : "STACJA · " + (s.temat ? "DZIELNICA " + s.temat : "")));
      f.appendChild(el("h3", null, s.nazwa));
      f.appendChild(el("p", null, s.fakt));
      if (s.pytanie) { var q = el("p"); q.appendChild(el("b", null, "Pytanie inspektora: ")); q.appendChild(document.createTextNode(s.pytanie)); f.appendChild(q); }
      if (s.zrodlo_url) { var p = el("p", "sm-legend"); p.appendChild(document.createTextNode("Źródło: ")); var a = el("a", null, s.zrodlo_tytul || s.zrodlo_url); a.href = s.zrodlo_url; a.target = "_blank"; a.rel = "noopener"; p.appendChild(a); f.appendChild(p); }
      if (s.archiwum) { var go = el("p"); var a2 = el("a", null, "Zejdź do Archiwum Trybunału →"); a2.href = "#" + (document.getElementById("pod-zamek") && !document.getElementById("pod-zamek").hidden ? "pod-zamek" : "pod-tresc"); go.appendChild(a2); f.appendChild(go); }
      return f;
    }
    function nearest() {
      var best = null, bd = 9;
      STACJE.forEach(function (s) { var d = Math.hypot(s.x - me.x, s.y - me.y); if (d < bd) { bd = d; best = s; } });
      return best;
    }
    function show(s) {
      panel.innerHTML = ""; panel.className = "sm-station" + (s.pamiec ? " pamiec" : "");
      panel.appendChild(stationBody(s)); panel.hidden = false;
      if (!s.pamiec && visited.indexOf(s.id) < 0) { visited.push(s.id); writeJSON("neo-stacje", visited); }
    }
    function act() { var s = nearest(); if (s) show(s); }

    var DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
    var KEYMAP = { ArrowUp: "up", KeyW: "up", ArrowDown: "down", KeyS: "down", ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right" };
    function tick(t) {
      raf = null;
      var dx = 0, dy = 0;
      Object.keys(keys).forEach(function (k) { if (keys[k]) { dx += DIRS[k][0]; dy += DIRS[k][1]; } });
      if (dx || dy) target = null;
      else if (target) { var tx = target[0] - me.x, ty = target[1] - me.y, d = Math.hypot(tx, ty); if (d < 2) target = null; else { dx = tx / d; dy = ty / d; } }
      var moved = false;
      if (dx || dy) {
        var n = Math.hypot(dx, dy), sx = dx / n * 1.1, sy = dy / n * 1.1;
        if (walk(me.x + sx, me.y + sy)) { me.x += sx; me.y += sy; moved = true; }
        else if (sx && walk(me.x + sx, me.y)) { me.x += sx; moved = true; }
        else if (sy && walk(me.x, me.y + sy)) { me.y += sy; moved = true; }
        else target = null;
        me.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up");
        me.step++;
      }
      var s = nearest();
      if (s !== near) { near = s; if (s) show(s); }
      draw(t);
      if (moved || target || !reduce) raf = requestAnimationFrame(tick);
    }
    function kick() { if (!raf) raf = requestAnimationFrame(tick); }

    map.addEventListener("keydown", function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.code === "KeyE" || e.key === "Enter") { act(); e.preventDefault(); return; }
      var d = KEYMAP[e.code] || KEYMAP[e.key];
      if (d) { keys[d] = true; e.preventDefault(); kick(); }
    });
    map.addEventListener("keyup", function (e) { var d = KEYMAP[e.code] || KEYMAP[e.key]; if (d) keys[d] = false; });
    map.addEventListener("blur", function () { keys = {}; });
    cv.addEventListener("pointerdown", function (e) { var r = cv.getBoundingClientRect(); target = [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height]; map.focus({ preventScroll: true }); kick(); });
    pad.addEventListener("pointerdown", function (e) { var d = e.target.dataset && e.target.dataset.dir; if (d) { keys[d] = true; kick(); e.preventDefault(); } });
    ["pointerup", "pointerleave", "pointercancel"].forEach(function (ev) { pad.addEventListener(ev, function () { keys = {}; }); });
    document.addEventListener("visibilitychange", function () { if (document.hidden) keys = {}; });
    sec._sm = { me: me, kick: kick, step: tick, stacje: STACJE, keys: function () { return keys; } }; // do testów
    draw(0); kick();
  }

  function render() { if (otwarty()) build(); else gate(); }
  render();
  document.addEventListener("neo:podziemia", render);
})();
