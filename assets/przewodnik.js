/* NEO-LUBLIN 2049: przewodnik dla osób, które wchodzą na stronę pierwszy raz.
   Uruchamia się sam przy pierwszej wizycie na mapie (zapis „neo-przewodnik” w tej przeglądarce); można go
   powtórzyć linkiem „Przewodnik po stronie” w stopce albo adresem index.html#przewodnik.
   Okno dialogowe: fokus zostaje w oknie, Esc zamyka, strzałki przełączają kroki; bez animacji przy
   prefers-reduced-motion. Kroki, których element nie istnieje na stronie (np. pasek wiadomości bez sieci), są pomijane. */
(function () {
  "use strict";
  var KLUCZ = "neo-przewodnik";
  var mapa = document.getElementById("city-main") && document.getElementById("city-main").closest(".city-map");
  var spokojnie = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function widziany() { try { return localStorage.getItem(KLUCZ) === "1"; } catch (e) { return true; } }
  function zapamietaj() { try { localStorage.setItem(KLUCZ, "1"); } catch (e) {} }
  function navLink(href) { return document.querySelector('.topnav a[href$="' + href + '"]'); }

  var KROKI = [
    { t: "Witaj w NEO-LUBLIN 2049",
      p: "To strona wykładu „Sztuczna inteligencja. Wyzwania społeczne, kulturowe i prawne”. Kurs jest miastem: każdy temat to dzielnica Lublina roku 2049. Przewodnik w minutę pokaże najważniejsze miejsca." },
    { el: function () { return mapa; }, t: "Mapa miasta",
      p: "Każdy znacznik to dzielnica, czyli jeden temat. Dzielnica otwiera się w dniu wykładu, jeśli quiz poprzedniej dzielnicy masz zaliczony na co najmniej 60%. Przycisk EKSPLORUJ pozwala chodzić po mieście jak w grze; we wnętrzach dzielnic jeździsz też taksówką. Te same dzielnice są na liście pod mapą." },
    { el: function () { return document.querySelector(".co-dalej"); }, t: "Co dalej?",
      p: "Tu zawsze jest jeden następny krok: dzielnica do przerobienia, powtórka albo zaliczenie. Jeśli nie wiesz, od czego zacząć, kliknij ten przycisk." },
    { el: function () { return document.querySelector(".inventory"); }, t: "Ekwipunek i karta wyników",
      p: "Artefakt dzielnicy dostajesz za quiz na co najmniej 60%, a tam, gdzie jest wnętrze, także za zadanie i 5 z 7 miejsc. Pod spodem jest karta wyników quizów, którą możesz pokazać prowadzącemu lub wydrukować: quizy liczą się do aktywności. Wyniki zapisują się tylko w tej przeglądarce; kodem postępu z karty przeniesiesz je na inne urządzenie." },
    { el: function () { return navLink("nauka.html"); }, t: "Nauka",
      p: "Fiszki, słowniczek, biblioteka, materiały interaktywne i źródła prawa w jednym miejscu. Materiały do konkretnego tematu są na stronie jego dzielnicy." },
    { el: function () { return navLink("zaliczenie.html"); }, t: "Zaliczenie",
      p: "Trzy ścieżki: test, projekt aplikacji dla prawników albo własna propozycja. Wybór zgłaszasz do 6.11.2026." },
    { el: function () { return document.querySelector(".siec-pasek"); }, t: "Wiadomości z sieci",
      p: "Najnowsze artykuły o AI ze świata, odświeżane codziennie. Po zaliczeniu dwóch quizów włącza się też radio miasta." },
    { t: "Gotowe",
      p: "Strona działa też bez internetu i na telefonie (możesz dodać ją do ekranu głównego). Przewodnik uruchomisz ponownie linkiem „Przewodnik po stronie” na dole każdej strony." }
  ];

  var tlo, ramka, okno, kroki, nr, poprzedniFokus;

  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function widoczny(e) { if (!e) return false; var r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; }

  function start() {
    if (okno) return;
    kroki = KROKI.filter(function (k) { return !k.el || widoczny(k.el()); });
    nr = 0;
    poprzedniFokus = document.activeElement;
    tlo = el("div", "przew-tlo"); tlo.setAttribute("aria-hidden", "true");
    ramka = el("div", "przew-ramka"); ramka.setAttribute("aria-hidden", "true");
    okno = el("div", "przew");
    okno.setAttribute("role", "dialog"); okno.setAttribute("aria-modal", "true");
    okno.setAttribute("aria-labelledby", "przew-t"); okno.setAttribute("aria-describedby", "przew-p");
    document.body.appendChild(tlo); document.body.appendChild(ramka); document.body.appendChild(okno);
    document.addEventListener("keydown", klawisz, true);
    window.addEventListener("resize", pozycja);
    window.addEventListener("scroll", pozycja, { passive: true });
    pokaz();
  }

  function koniec() {
    if (!okno) return;
    zapamietaj();
    document.removeEventListener("keydown", klawisz, true);
    window.removeEventListener("resize", pozycja);
    window.removeEventListener("scroll", pozycja);
    [tlo, ramka, okno].forEach(function (x) { if (x && x.parentNode) x.parentNode.removeChild(x); });
    tlo = ramka = okno = null;
    if (location.hash === "#przewodnik" && history.replaceState) history.replaceState(null, "", location.pathname + location.search);
    if (poprzedniFokus && poprzedniFokus.focus) poprzedniFokus.focus();
  }

  function pokaz() {
    var k = kroki[nr], ost = nr === kroki.length - 1;
    okno.textContent = "";
    okno.appendChild(el("p", "krok", "PRZEWODNIK · " + (nr + 1) + " / " + kroki.length));
    var h = el("h2", null, k.t); h.id = "przew-t"; okno.appendChild(h);
    var p = el("p", null, k.p); p.id = "przew-p"; okno.appendChild(p);
    var row = el("div", "btn-row");
    var pomin = el("button", "btn ghost pomin", ost ? "Zamknij" : "Pomiń"); pomin.type = "button"; pomin.addEventListener("click", koniec);
    row.appendChild(pomin);
    if (nr > 0) { var w = el("button", "btn ghost", "Wstecz"); w.type = "button"; w.addEventListener("click", function () { idz(-1); }); row.appendChild(w); }
    var d = el("button", "btn", ost ? "Zaczynam" : nr === 0 ? "Pokaż" : "Dalej"); d.type = "button";
    d.addEventListener("click", function () { if (ost) koniec(); else idz(1); });
    row.appendChild(d);
    okno.appendChild(row);
    var cel = k.el && k.el();
    // element tuż pod górnym paskiem, żeby pod nim zmieściło się okno; przyklejony pasek (komputer) jest zawsze
    // widoczny, na telefonie pasek przewija się ze stroną
    var pasek = document.querySelector(".topbar"), lepki = pasek && getComputedStyle(pasek).position !== "static";
    if (cel && !(lepki && pasek.contains(cel))) {
      var y = cel.getBoundingClientRect().top + window.scrollY - (lepki ? pasek.offsetHeight : 0) - 16;
      window.scrollTo({ top: Math.max(0, y), behavior: spokojnie ? "auto" : "smooth" });
    }
    pozycja();
    d.focus();
  }

  function idz(o) { nr = Math.max(0, Math.min(kroki.length - 1, nr + o)); pokaz(); }

  // ramka wokół wskazanego elementu; okno na dole ekranu, a jeśli element jest w dolnej połowie, to na górze
  function pozycja() {
    if (!okno) return;
    var k = kroki[nr], cel = k.el && k.el();
    if (!cel || !widoczny(cel)) { ramka.style.display = "none"; tlo.classList.remove("z-ramka"); okno.style.top = ""; okno.style.bottom = ""; return; }
    var r = cel.getBoundingClientRect(), m = 6;
    ramka.style.display = "block";
    ramka.style.left = (r.left + window.scrollX - m) + "px"; ramka.style.top = (r.top + window.scrollY - m) + "px";
    ramka.style.width = (r.width + 2 * m) + "px"; ramka.style.height = (r.height + 2 * m) + "px";
    tlo.classList.add("z-ramka");
    // okno tam, gdzie zmieści się bez zasłaniania elementu; jeśli nigdzie, to po stronie z większym miejscem
    var h = okno.offsetHeight + 24, pod = window.innerHeight - r.bottom, nad = r.top;
    var gora = !(pod >= h) && (nad >= h || nad > pod);
    okno.style.top = gora ? "16px" : ""; okno.style.bottom = gora ? "auto" : "";
  }

  function klawisz(e) {
    if (!okno) return;
    if (e.key === "Escape") { e.preventDefault(); koniec(); return; }
    if (e.key === "ArrowRight") { e.preventDefault(); if (nr < kroki.length - 1) idz(1); return; }
    if (e.key === "ArrowLeft") { e.preventDefault(); if (nr > 0) idz(-1); return; }
    if (e.key !== "Tab") return;
    var f = okno.querySelectorAll("button");   // fokus zostaje w oknie
    if (!f.length) return;
    var pierwszy = f[0], ostatni = f[f.length - 1];
    if (!okno.contains(document.activeElement)) { e.preventDefault(); pierwszy.focus(); }
    else if (e.shiftKey && document.activeElement === pierwszy) { e.preventDefault(); ostatni.focus(); }
    else if (!e.shiftKey && document.activeElement === ostatni) { e.preventDefault(); pierwszy.focus(); }
  }

  // link w stopce: na mapie od razu, na innych stronach przejście do index.html#przewodnik
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[data-przewodnik]");
    if (a && mapa) { e.preventDefault(); start(); }
  });
  window.addEventListener("hashchange", function () { if (mapa && location.hash === "#przewodnik") start(); });

  if (!mapa) return;
  // pierwsza wizyta: po chwili, żeby gra.js i ui.js zdążyły dodać panel „Co dalej?” i pasek wiadomości
  window.addEventListener("load", function () {
    if (location.hash === "#przewodnik" || !widziany()) setTimeout(start, spokojnie ? 0 : 400);
  });
})();
