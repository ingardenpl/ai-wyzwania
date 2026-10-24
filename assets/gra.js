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
  function q(name) {
    var m = new RegExp("[?&]" + name + "=([^&#]*)").exec(location.search);
    try { return m ? decodeURIComponent(m[1]) : null; } catch (e) { return null; }   // ucięty link (np. „%”) nie wyłącza gry
  }

  // podgląd prowadzącego: ?podglad=prowadzacy włącza go na stałe w tej przeglądarce, ?podglad=wylacz wyłącza
  (function () {
    var v = q("podglad");
    if (v === "prowadzacy") pisz("neo-podglad", true);
    else if (v === "wylacz") { try { localStorage.removeItem("neo-podglad"); } catch (e) {} }
  })();
  function podglad() { return q("podglad") === "prowadzacy" || czytaj("neo-podglad", false) === true; }
  // dzisiejsza data lokalna (RRRR-MM-DD); ?dzien=RRRR-MM-DD symuluje inny dzień (test prowadzącego)
  function dzis() {
    var t = q("dzien");
    if (t && /^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
    var d = new Date();
    return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
  }

  var _dane = null;
  // dane miasta: <script id="city-data"> (mapa, strona dzielnicy) albo assets/kalendarz.js (pozostałe strony, slajdy)
  function dane() {
    if (_dane) return _dane;
    var e = document.getElementById("city-data");
    try { _dane = e ? JSON.parse(e.textContent) : null; } catch (x) { _dane = null; }
    if (_dane) return _dane;
    var zap = { districts: [], info: window.NEO_KALENDARZ || {} };
    if (document.readyState !== "loading") _dane = zap;   // w <head> nie zapamiętujemy: #city-data może być niżej
    return zap;
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
    if (!s || typeof s !== "object" || s.v !== WERSJA) {
      var nowszy = s && typeof s === "object" && s.v > WERSJA;   // zapis z nowszej wersji skryptu: nie nadpisujemy go
      s = { v: WERSJA, quizy: {}, miejsca: {}, zadania: {}, znaleziska: {}, ratusz: {} };
      var stare = czytaj("neo-zaliczone", []);
      (Array.isArray(stare) ? stare : []).forEach(function (n) { if (/^\d\d$/.test(n)) s.quizy[n] = PROG_QUIZ; });
      if (!nowszy) pisz(KLUCZ, s);
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

  // ------------------------------------------------------------------ blokada dzielnic
  // Dzielnica otwiera się w dniu swojego (pierwszego) wykładu i tylko dla osób, które zaliczyły quiz poprzedniej
  // dzielnicy (co najmniej 60%). Pierwsza dzielnica: sama data. Podgląd prowadzącego otwiera wszystko.
  // To warstwa motywacyjna, nie ochrona treści: materiały są w kodzie strony i w repozytorium publikacji.
  function pierwszyTermin(n) { var i = (dane().info || {})[n]; return i && i.sloty && i.sloty.length ? i.sloty[0] : null; }
  function odblokowany(n) {
    var r = { ok: true, data: true, poprzedni: null, termin: pierwszyTermin(n) };
    if (podglad()) return r;
    if (r.termin && r.termin.d && r.termin.d > dzis()) { r.data = false; r.ok = false; }
    var i = NR.indexOf(n);
    if (i > 0 && !(stan().quizy[NR[i - 1]] >= PROG_QUIZ)) { r.poprzedni = NR[i - 1]; r.ok = false; }
    return r;
  }

  // ------------------------------------------------------------------ kod postępu (przenoszenie między urządzeniami)
  // Postęp leży tylko w tej przeglądarce. Kod to zapis w base64url z sumą kontrolną; wklejony na innym urządzeniu
  // łączy się z tamtejszym zapisem (lepszy wynik quizu, suma miejsc i znalezisk). Nic nie jest wysyłane na serwer.
  function b64(s) { return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
  function unb64(s) { s = s.replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "="; return decodeURIComponent(escape(atob(s))); }
  function suma(s) { var h = 5381; for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return ("0000" + h.toString(36)).slice(-4); }
  function kodPostepu() {
    var s = stan(), d = { v: 1, q: {}, m: {}, z: [], n: {}, r: s.ratusz || {} };
    NR.forEach(function (k) {
      if (typeof s.quizy[k] === "number") d.q[k] = Math.round(s.quizy[k] * 100);
      if ((s.miejsca[k] || []).length) d.m[k] = s.miejsca[k];
      if (s.zadania[k]) d.z.push(k);
      if ((s.znaleziska[k] || []).length) d.n[k] = s.znaleziska[k];
    });
    var t = b64(JSON.stringify(d));
    return "NL1-" + t + "-" + suma(t);
  }
  function wczytajKod(kod) {
    var m = /^\s*NL1-([A-Za-z0-9_-]+)-([a-z0-9]{4})\s*$/.exec(kod || "");
    if (!m) return { ok: false, blad: "To nie jest kod postępu (powinien zaczynać się od NL1-)." };
    if (suma(m[1]) !== m[2]) return { ok: false, blad: "Kod jest niekompletny albo przekłamany; skopiuj go jeszcze raz w całości." };
    var d; try { d = JSON.parse(unb64(m[1])); } catch (e) { return { ok: false, blad: "Nie udało się odczytać kodu." }; }
    if (!d || d.v !== 1) return { ok: false, blad: "Kod pochodzi z innej wersji strony." };
    var ile = 0;
    zmien(function (s) {
      NR.forEach(function (k) {
        var q = d.q && d.q[k];
        if (typeof q === "number" && q >= 0 && q <= 100 && !(s.quizy[k] >= q / 100)) { s.quizy[k] = q / 100; ile++; }
        function dolacz(pole, lista) {
          if (!Array.isArray(lista)) return;
          var cel = s[pole][k] = s[pole][k] || [];
          lista.forEach(function (id) { if (typeof id === "string" && id.length < 60 && cel.indexOf(id) < 0) { cel.push(id); ile++; } });
        }
        dolacz("miejsca", d.m && d.m[k]); dolacz("znaleziska", d.n && d.n[k]);
        if (Array.isArray(d.z) && d.z.indexOf(k) >= 0 && !s.zadania[k]) { s.zadania[k] = true; ile++; }
      });
      if (d.r && typeof d.r === "object") Object.keys(d.r).forEach(function (x) { if (!s.ratusz[x]) { s.ratusz[x] = d.r[x]; ile++; } });
    });
    var l = czytaj("neo-zaliczone", []); if (!Array.isArray(l)) l = [];
    NR.forEach(function (k) { if (stan().quizy[k] >= PROG_QUIZ && l.indexOf(k) < 0) l.push(k); });
    l.sort(); pisz("neo-zaliczone", l);
    return { ok: true, ile: ile };
  }
  // link z kodem (index.html#postep=NL1-...): wczytanie i przeładowanie bez kodu w adresie; także gdy link
  // zostanie wklejony w już otwartej karcie (zmienia się tylko fragment, więc strona sama się nie przeładuje)
  function importZLinku() {
    var m = /^#postep=(.+)$/.exec(location.hash || "");
    if (!m) return;
    var w; try { w = wczytajKod(decodeURIComponent(m[1])); } catch (e) { w = { ok: false, blad: "Nie udało się odczytać kodu z linku." }; }
    try { sessionStorage.setItem("neo-postep-import", JSON.stringify(w)); } catch (e) {}
    // kod znika z adresu bez nawigacji (replaceState), dopiero potem przeładowanie: nawigacja do tego samego adresu
    // bez fragmentu potrafi zachować fragment i zapętlić stronę
    if (history.replaceState) history.replaceState(null, "", location.pathname + location.search); else location.hash = "";
    location.reload();
  }
  importZLinku();
  window.addEventListener("hashchange", importZLinku);

  window.NeoGra = {
    dzis: dzis, stany: stany, kodPostepu: kodPostepu, wczytajKod: wczytajKod, nastepnyTermin: nastepnyTermin, podglad: podglad, dane: dane,
    stan: stan, zapiszQuiz: zapiszQuiz, zapiszMiejsce: zapiszMiejsce, zapiszZadanie: zapiszZadanie, zapiszZnalezisko: zapiszZnalezisko,
    artefakt: artefakt, artefakty: artefakty, wnetrze: wnetrze, odblokowany: odblokowany,
    otwarta: function (n) { return odblokowany(n).ok; },
    PROG_QUIZ: PROG_QUIZ, PROG_MIEJSCA: PROG_MIEJSCA
  };

  // ------------------------------------------------------------------ poprawki strony (przed miasto.js)
  function txt(s) { return document.createTextNode(s); }
  function el(tag, cls, t) { var e = document.createElement(tag); if (cls) e.className = cls; if (t != null) e.textContent = t; return e; }

  // strona dzielnicy (index, Wiedza, slajdy, slajdy do czytania): treść ukryta do czasu sprawdzenia blokady
  var NR_STRONY = (/\/moduly\/(\d\d)_[^\/]*\/[^\/]*$/.exec(location.pathname) || [])[1] || null;
  (function () {
    var css = "html.blokada-sprawdz main#tresc,html.blokada-sprawdz .reveal{visibility:hidden}" +
      "html.zablokowane main#tresc>*:not(.blokada){display:none!important}" +
      "html.zablokowane.bez-main body>*:not(.blokada):not(script):not(style){display:none!important}" +
      ".blokada{max-width:44em;margin:40px auto;padding:22px 24px;border:1px solid #ff2a6d;background:#0b0d17;color:#e7e9f2;font:17px/1.55 'IBM Plex Sans','Segoe UI',Arial,sans-serif;box-shadow:0 0 18px rgba(255,42,109,.25)}" +
      ".blokada h1{font-family:'Chakra Petch','Bahnschrift',Arial,sans-serif;font-size:1.6rem;margin:0 0 10px;color:#fff}" +
      ".blokada .k{font-family:'IBM Plex Mono',Consolas,monospace;font-size:.8rem;letter-spacing:.08em;color:#ff2a6d;margin:0 0 8px}" +
      ".blokada a{color:#00f0ff}.blokada li{margin:6px 0}.blokada .m{color:#9095ad;font-size:.9rem}" +
      "html.bez-main .blokada{position:fixed;inset:0;margin:0;max-width:none;overflow:auto;display:flex;flex-direction:column;justify-content:center;padding:24px 8vw;z-index:9999}" +
      ".karta-wynikow table{border-collapse:collapse;width:100%}.karta-wynikow td,.karta-wynikow th{padding:6px 8px;border-bottom:1px solid rgba(5,217,232,.2);text-align:left}" +
      ".karta-wynikow summary{cursor:pointer;min-height:44px;display:flex;align-items:center;font-weight:600}" +
      ".postep-kod{margin-top:12px;border-top:1px solid rgba(5,217,232,.2);padding-top:8px}.postep-kod summary{font-weight:600;cursor:pointer;min-height:44px;display:flex;align-items:center}" +
      ".postep-ta{width:100%;font-family:'IBM Plex Mono',Consolas,monospace;font-size:.8rem;background:#07080f;color:#e7e9f2;border:1px solid rgba(5,217,232,.35);padding:8px;word-break:break-all;resize:vertical}" +
      ".postep-row{align-items:stretch}.postep-in{flex:1 1 200px;min-height:44px;font-family:'IBM Plex Mono',Consolas,monospace;background:#07080f;color:#e7e9f2;border:1px solid rgba(5,217,232,.35);padding:0 10px}" +
      ".postep-kod label{display:block;margin-top:10px;font-weight:600}.postep-ok{color:#3ef0a1}.postep-blad{color:#ff6b88}";
    var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
    if (NR_STRONY && !podglad()) document.documentElement.classList.add("blokada-sprawdz");
  })();

  function zamknijStrone() {
    if (!NR_STRONY) return;
    var html = document.documentElement, r;
    try { r = odblokowany(NR_STRONY); } finally { html.classList.remove("blokada-sprawdz"); }   // po błędzie strona ma być widoczna
    if (r.ok) return;
    var info = dane().info || {}, ja = info[NR_STRONY] || {}, main = document.getElementById("tresc");
    if (!main) html.classList.add("bez-main");
    html.classList.add("zablokowane");
    var b = el("div", "blokada"); b.setAttribute("role", "status");
    b.appendChild(el("p", "k", "DZIELNICA " + NR_STRONY + " · DOSTĘP ZAMKNIĘTY"));
    b.appendChild(el("h1", null, (ja.nazwa || "Dzielnica " + NR_STRONY) + (ja.miejsce ? ": " + ja.miejsce : "")));
    b.appendChild(el("p", null, "Ta część wykładu otwiera się w dniu wykładu, dla osób, które zaliczyły poprzednią dzielnicę."));
    var ul = el("ul");
    if (!r.data && r.termin) ul.appendChild(el("li", null, "Otwarcie: " + r.termin.t + "."));
    if (r.poprzedni) {
      var p = info[r.poprzedni] || {}, li = el("li");
      li.appendChild(txt("Najpierw zalicz quiz dzielnicy " + r.poprzedni + (p.nazwa ? " (" + p.nazwa + ")" : "") + " na co najmniej 60%: "));
      var a = el("a", null, "przejdź do quizu"); a.href = "../" + (p.slug || "") + "/index.html#quiz"; li.appendChild(a);
      ul.appendChild(li);
    }
    b.appendChild(ul);
    b.appendChild(el("p", "m", "Wynik quizu zapisuje się tylko w tej przeglądarce. Na innym urządzeniu wystarczy rozwiązać quiz jeszcze raz."));
    var back = el("p"), m = el("a", null, "← Mapa miasta"); m.href = "../../index.html"; back.appendChild(m); b.appendChild(back);
    if (main) main.insertBefore(b, main.firstChild); else document.body.insertBefore(b, document.body.firstChild);
  }

  // mapa: zamknięte dzielnice na liście i karta wyników quizów (do pokazania prowadzącemu przy ocenie aktywności)
  function listaIKarta() {
    var info = dane().info || {};
    document.querySelectorAll("ol.sessions a.session").forEach(function (a) {
      var n = (a.querySelector(".num") || {}).textContent, ch = a.querySelector(".chips");
      if (!n || !ch || ch.querySelector(".chip.zamk")) return;
      var r = odblokowany(n);
      if (r.ok) return;
      var c = el("span", "chip zamk", "zamknięte");
      c.title = [(!r.data && r.termin) ? "otwarcie " + r.termin.t.split(" · ")[0] : "", r.poprzedni ? "najpierw quiz dzielnicy " + r.poprzedni : ""].filter(Boolean).join("; ");
      ch.insertBefore(c, ch.firstChild);
    });
    var hud = document.querySelector(".hud");
    if (!hud || document.querySelector(".karta-wynikow")) return;
    var s = stan(), d = el("details", "karta-wynikow mission");
    d.appendChild(el("summary", null, "Karta wyników quizów"));
    if (location.hash === "#postepy") { d.open = true; setTimeout(function () { d.scrollIntoView({ block: "start" }); }, 50); }
    var t = el("table"), th = el("tr");
    ["Dzielnica", "Najlepszy wynik", "Status"].forEach(function (x) { th.appendChild(el("th", null, x)); });
    t.appendChild(th);
    var zal = 0;
    NR.forEach(function (n) {
      var q = s.quizy[n], tr = el("tr");
      tr.appendChild(el("td", null, n + " · " + ((info[n] || {}).nazwa || "")));
      tr.appendChild(el("td", null, q == null ? "brak" : Math.round(q * 100) + "%"));
      tr.appendChild(el("td", null, q >= PROG_QUIZ ? "zaliczony" : q == null ? "nie rozwiązany" : "poniżej 60%"));
      if (q >= PROG_QUIZ) zal++;
      t.appendChild(tr);
    });
    d.appendChild(t);
    d.appendChild(el("p", "muted", "Zaliczone quizy: " + zal + " z 10. Stan na " + dzis().split("-").reverse().join(".") + ". Wyniki są zapisane tylko w tej przeglądarce; kartę można pokazać prowadzącemu albo wydrukować (liczy się do aktywności)."));
    var b = el("button", "btn ghost", "Drukuj kartę"); b.type = "button";
    b.addEventListener("click", function () { d.open = true; window.print(); });
    d.appendChild(b);
    d.appendChild(kodPostepuUI());
    hud.parentNode.insertBefore(d, hud.nextSibling);
    var imp = null; try { imp = JSON.parse(sessionStorage.getItem("neo-postep-import") || "null"); sessionStorage.removeItem("neo-postep-import"); } catch (e) {}
    if (imp) { d.open = true; var p = el("p", imp.ok ? "postep-ok" : "postep-blad", imp.ok ? "Postęp z linku wczytany (" + imp.ile + " nowych wpisów)." : imp.blad); p.setAttribute("role", "status"); d.insertBefore(p, d.children[1]); }
  }
  // przenoszenie postępu: pokaż kod lub link, wklej kod z innego urządzenia
  function kodPostepuUI() {
    var box = el("details", "postep-kod");
    box.appendChild(el("summary", null, "Postęp na innym urządzeniu"));
    box.appendChild(el("p", "muted", "Wyniki są zapisane tylko w tej przeglądarce. Żeby mieć je też na telefonie albo innym komputerze, skopiuj stąd kod postępu i wklej go tam w tym samym miejscu (albo otwórz tam link z kodem). Nic nie jest wysyłane na serwer."));
    var row = el("div", "btn-row");
    var pokaz = el("button", "btn ghost", "Pokaż kod postępu"); pokaz.type = "button";
    var wyn = el("div"); wyn.hidden = true;
    var ta = el("textarea"); ta.readOnly = true; ta.rows = 3; ta.setAttribute("aria-label", "Kod postępu"); ta.className = "postep-ta";
    var row2 = el("div", "btn-row");
    var kop = el("button", "btn ghost", "Kopiuj kod"); kop.type = "button";
    var lnk = el("a", "btn ghost", "Link z kodem"); lnk.target = "_blank"; lnk.rel = "noopener";
    var stat = el("p", "muted"); stat.setAttribute("role", "status");
    pokaz.addEventListener("click", function () {
      var k = kodPostepu(); ta.value = k; wyn.hidden = false;
      lnk.href = location.pathname.replace(/[^\/]*$/, "index.html") + "#postep=" + encodeURIComponent(k);
      ta.focus(); ta.select();
    });
    kop.addEventListener("click", function () {
      var k = ta.value; function ok() { stat.textContent = "Skopiowano. Wklej kod na drugim urządzeniu w „Postęp na innym urządzeniu”."; }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(k).then(ok, function () { ta.select(); stat.textContent = "Zaznaczono kod: skopiuj go skrótem Ctrl+C."; });
      else { ta.select(); stat.textContent = "Zaznaczono kod: skopiuj go skrótem Ctrl+C."; }
    });
    row2.appendChild(kop); row2.appendChild(lnk); wyn.appendChild(ta); wyn.appendChild(row2);
    row.appendChild(pokaz); box.appendChild(row); box.appendChild(wyn);
    var lab = el("label", null, "Wklej kod z innego urządzenia"); lab.htmlFor = "postep-wklej";
    var inp = el("input"); inp.id = "postep-wklej"; inp.type = "text"; inp.autocomplete = "off"; inp.spellcheck = false; inp.placeholder = "NL1-…"; inp.className = "postep-in";
    var wcz = el("button", "btn", "Wczytaj"); wcz.type = "button";
    wcz.addEventListener("click", function () {
      var w = wczytajKod(inp.value);
      stat.className = w.ok ? "postep-ok" : "postep-blad";
      stat.textContent = w.ok ? "Wczytano: " + w.ile + " nowych wpisów. Odświeżam kartę…" : w.blad;
      if (w.ok) setTimeout(function () { location.reload(); }, 900);
    });
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); wcz.click(); } });
    var row3 = el("div", "btn-row postep-row"); row3.appendChild(inp); row3.appendChild(wcz);
    box.appendChild(lab); box.appendChild(row3); box.appendChild(stat);
    return box;
  }
  // mapa: jeden następny krok zamiast wyboru spośród wszystkich dzielnic (prawo Hicka)
  function coDalej() {
    var hud = document.querySelector(".hud");
    if (!hud || document.querySelector(".co-dalej")) return;
    var info = dane().info || {}, s = stan(), box = el("div", "co-dalej"), cel = null, opis = "", przycisk = "";
    box.setAttribute("role", "region"); box.setAttribute("aria-label", "Co dalej");
    var otwarta = NR.filter(function (n) { return info[n] && odblokowany(n).ok && !(s.quizy[n] >= PROG_QUIZ); })[0];
    var zamk = NR.filter(function (n) { return info[n] && !odblokowany(n).ok; })[0];
    if (otwarta) {
      var i = info[otwarta];
      cel = "moduly/" + i.slug + "/index.html";
      opis = "Dzielnica " + otwarta + " · " + i.nazwa + (i.miejsce ? ": " + i.miejsce : "") + ". Przeczytaj treść zajęć, przejrzyj slajdy i zalicz quiz (co najmniej 60%).";
      przycisk = "Idź do dzielnicy " + otwarta;
    } else if (zamk) {
      var r = odblokowany(zamk), j = info[zamk];
      cel = "fiszki.html";
      opis = "Quizy wszystkich otwartych dzielnic zaliczone. Dzielnica " + zamk + " (" + j.nazwa + ") otworzy się " +
        (r.termin && r.termin.t ? r.termin.t.split(" · ")[0] : "w dniu wykładu") + ". Do tego czasu możesz powtórzyć materiał w fiszkach.";
      przycisk = "Powtórka w fiszkach";
    } else {
      cel = "zaliczenie.html";
      opis = "Quizy wszystkich dzielnic zaliczone. Zostało zaliczenie przedmiotu: test, projekt albo własna propozycja.";
      przycisk = "Zasady zaliczenia";
    }
    box.appendChild(el("p", "eyebrow", "Co dalej?"));
    box.appendChild(el("p", null, opis));
    var a = el("a", "btn", przycisk); a.href = cel; box.appendChild(a);
    hud.parentNode.insertBefore(box, hud);
  }

  // strona dzielnicy: ścieżka 1-2-3; na telefonie slajdy w wersji do czytania, przy quizie znacznik zaliczenia
  function sciezka() {
    var ol = document.querySelector("ol.sciezka");
    if (!ol) return;
    var tel = ol.querySelector("a[data-tel]");
    if (tel && window.matchMedia("(max-width: 760px)").matches && document.querySelector('a[href="' + tel.getAttribute("data-tel") + '"]')) {
      tel.href = tel.getAttribute("data-tel"); tel.removeAttribute("target");
    }
    var qz = ol.querySelector("a[data-quiz]");
    if (qz && stan().quizy[qz.getAttribute("data-quiz")] >= PROG_QUIZ) {
      qz.parentNode.classList.add("zrobione");
      qz.querySelector("b").textContent = "✓";
      qz.querySelector("small").textContent = "zaliczony (" + Math.round(stan().quizy[qz.getAttribute("data-quiz")] * 100) + "%)";
    }
  }
  document.addEventListener("DOMContentLoaded", function () { zamknijStrone(); listaIKarta(); coDalej(); sciezka(); });
  document.addEventListener("neo:postep", sciezka);

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
      } else if (mis && !nast.length && NR.every(function (n) { return !info[n] || st[n] === "past"; })) {
        mis.textContent = "";
        mis.appendChild(el("p", "eyebrow", "Śledztwo zakończone"));
        mis.appendChild(el("p", null, "Wszystkie dzielnice odwiedzone. Zamknij akta: test, projekt albo własna propozycja."));
        var a2 = el("a", null, "Zasady zaliczenia"); a2.href = "zaliczenie.html"; mis.appendChild(a2);
        var pg2 = document.querySelector(".pager-lcd .scroll");
        if (pg2) {
          var msg2 = "INSPEKTORZE, WSZYSTKIE DZIELNICE ODWIEDZONE. ZAMKNIJ AKTA: TEST, PROJEKT ALBO WŁASNA PROPOZYCJA.";
          pg2.textContent = ""; pg2.appendChild(el("span", "who", "ARCHIWISTKA ›")); pg2.appendChild(txt(" " + msg2));
          pg2.parentNode.setAttribute("aria-label", "Wiadomość od Archiwistki: " + msg2);
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
      if (i) slot.title = i.przedmiot + " (dzielnica " + n + ", " + (ma ? "zdobyty" : st[n] === "past" ? "do zdobycia: quiz ≥ 60%" + (i.wnetrze ? ", zadanie i " + PROG_MIEJSCA + " z 7 miejsc" : "") : "dzielnica otworzy się w dniu spotkania") + ")";
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
        "Warunek: quiz dzielnicy ≥ 60%" + (wnetrze(n) ? ", wykonane zadanie i " + PROG_MIEJSCA + " z 7 miejsc we wnętrzu dzielnicy." : ".");
      if (!w.parentNode) card.lastElementChild.appendChild(w);
    }
  });
})();
