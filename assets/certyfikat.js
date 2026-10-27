/* NEO-LUBLIN 2049: certyfikat ukończenia kursu online (strona certyfikat.html).
   Warunek: quizy wszystkich dziesięciu dzielnic zaliczone (co najmniej 60%), według wyników zapisanych w tej przeglądarce
   (gra.js, NeoGra). Certyfikat jest rysowany na płótnie (fonty strony, polskie znaki) i zapisywany jako PDF A4 przez
   jsPDF (CDN, wersja przypięta w build.py). Imię i nazwisko nie opuszczają przeglądarki.
   Dokument potwierdza ukończenie kursu online; nie zastępuje zaliczenia przedmiotu w USOS (napis na certyfikacie). */
(function () {
  "use strict";
  var root = document.getElementById("cert-root");
  if (!root || !window.NeoGra) return;
  var G = window.NeoGra, NR = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"];
  var podglad = G.podglad();

  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function czytaj(k) { try { return localStorage.getItem(k) || ""; } catch (e) { return ""; } }
  function pisz(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  function dane() {
    var s = G.stan(), info = (G.dane().info || {});
    var quizy = NR.map(function (n) { return { nr: n, nazwa: (info[n] || {}).nazwa || n, wynik: s.quizy[n] }; });
    var zal = quizy.filter(function (q) { return q.wynik >= G.PROG_QUIZ; }).length;
    var misje = 0; NR.forEach(function (n) { misje += ((s.misje || {})[n] || []).length; });
    var znal = 0; NR.forEach(function (n) { znal += (s.znaleziska[n] || []).length; });
    return { quizy: quizy, zal: zal, artefakty: G.artefakty().length, misje: misje, znaleziska: znal };
  }

  // numer dokumentu: skrót imienia, wyników i daty (do rozpoznania wydruku, nie do weryfikacji)
  function numer(imie, d, data) {
    var t = imie + "|" + data + "|" + d.quizy.map(function (q) { return q.nr + ":" + Math.round((q.wynik || 0) * 100); }).join(",");
    var h = 2166136261 >>> 0;
    for (var i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return "NL-2027-" + ("00000000" + h.toString(36).toUpperCase()).slice(-7);
  }
  function dzisiaj() { var d = G.dzis().split("-"); return d[2] + "." + d[1] + "." + d[0]; }

  // ---------------------------------------------------------------- rysowanie (A4 poziomo, 200 dpi)
  var W = 2339, H = 1654;
  function rysuj(cv, imie, d, wzor) {
    cv.width = W; cv.height = H;
    var g = cv.getContext("2d"), data = dzisiaj(), nr = numer(imie, d, data);
    var CYJAN = "#0097a7", ROZ = "#d6005c", ZLOTO = "#b8a200", TUSZ = "#14161f", SZARY = "#5a5f72";
    g.fillStyle = "#ffffff"; g.fillRect(0, 0, W, H);
    // ramka: podwójna linia z neonowymi narożnikami
    g.strokeStyle = TUSZ; g.lineWidth = 6; g.strokeRect(70, 70, W - 140, H - 140);
    g.strokeStyle = CYJAN; g.lineWidth = 3; g.strokeRect(95, 95, W - 190, H - 190);
    g.fillStyle = ROZ;
    [[70, 70, 1, 1], [W - 70, 70, -1, 1], [70, H - 70, 1, -1], [W - 70, H - 70, -1, -1]].forEach(function (k) {
      g.fillRect(k[0] - (k[2] < 0 ? 140 : 0), k[1] - (k[3] < 0 ? 14 : 0), 140, 14);
      g.fillRect(k[0] - (k[2] < 0 ? 14 : 0), k[1] - (k[3] < 0 ? 140 : 0), 14, 140);
    });
    // pasek miasta u góry (prosta panorama z prostokątów)
    var x = 180, seed = 7; function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    g.fillStyle = "#eef3f7";
    while (x < W - 200) { var bw = Math.min(30 + rnd() * 70, W - 180 - x), bh = 30 + rnd() * 110; g.fillRect(x, 300 - bh, bw, bh); x += bw + 6; }
    g.fillStyle = CYJAN; g.fillRect(180, 300, W - 360, 4);
    g.textBaseline = "alphabetic";
    // nagłówek
    g.fillStyle = TUSZ; g.font = "700 64px 'Chakra Petch', 'IBM Plex Sans', sans-serif"; g.textAlign = "left";
    g.fillText("NEO-LUBLIN", 180, 200); var wN = g.measureText("NEO-LUBLIN ").width;
    g.fillStyle = ROZ; g.fillText("2049", 180 + wN, 200);
    g.fillStyle = SZARY; g.font = "500 30px 'IBM Plex Mono', monospace"; g.textAlign = "right";
    g.fillText("WYDZIAŁ PRAWA I ADMINISTRACJI UMCS", W - 180, 170); g.fillText("SEMESTR ZIMOWY 2026/2027", W - 180, 215);
    // tytuł
    g.textAlign = "center"; g.fillStyle = TUSZ;
    g.font = "700 96px 'Chakra Petch', 'IBM Plex Sans', sans-serif"; g.fillText("CERTYFIKAT UKOŃCZENIA KURSU", W / 2, 455);
    g.fillStyle = CYJAN; g.font = "600 40px 'IBM Plex Mono', monospace"; g.fillText("KURS ONLINE · WYKŁAD MONOGRAFICZNY · 15 GODZIN DYDAKTYCZNYCH", W / 2, 520);
    g.fillStyle = TUSZ; g.font = "italic 400 46px 'IBM Plex Sans', sans-serif";
    g.fillText("„Sztuczna inteligencja. Wyzwania społeczne, kulturowe i prawne”", W / 2, 600);
    // osoba
    g.fillStyle = SZARY; g.font = "400 36px 'IBM Plex Sans', sans-serif"; g.fillText("wystawiony dla", W / 2, 700);
    g.fillStyle = TUSZ; var rozm = 104; g.font = "700 " + rozm + "px 'Chakra Petch', 'IBM Plex Sans', sans-serif";
    while (g.measureText(imie).width > W - 500 && rozm > 50) { rozm -= 4; g.font = "700 " + rozm + "px 'Chakra Petch', 'IBM Plex Sans', sans-serif"; }
    g.fillText(imie, W / 2, 815);
    g.fillStyle = ZLOTO; g.fillRect(W / 2 - 420, 845, 840, 4);
    g.fillStyle = TUSZ; g.font = "400 38px 'IBM Plex Sans', sans-serif";
    g.fillText("za zaliczenie quizów wszystkich dziesięciu dzielnic kursu (próg 60%)", W / 2, 925);
    // dzielnice: dziesięć kafelków z wynikiem
    var kw = 182, kh = 132, odst = 18, x0 = (W - (10 * kw + 9 * odst)) / 2, y0 = 990;
    d.quizy.forEach(function (q, i) {
      var kx = x0 + i * (kw + odst), ok = q.wynik >= G.PROG_QUIZ;
      g.strokeStyle = ok ? CYJAN : "#c9ccd6"; g.lineWidth = 3; g.strokeRect(kx, y0, kw, kh);
      g.fillStyle = ok ? ROZ : SZARY; g.font = "700 34px 'IBM Plex Mono', monospace"; g.fillText(q.nr, kx + kw / 2, y0 + 44);
      g.fillStyle = TUSZ; var f = 26; g.font = "600 " + f + "px 'IBM Plex Sans', sans-serif";
      while (g.measureText(q.nazwa).width > kw - 14 && f > 16) { f -= 2; g.font = "600 " + f + "px 'IBM Plex Sans', sans-serif"; }
      g.fillText(q.nazwa, kx + kw / 2, y0 + 84);
      g.fillStyle = ok ? CYJAN : SZARY; g.font = "500 26px 'IBM Plex Mono', monospace";
      g.fillText(q.wynik == null ? "—" : Math.round(q.wynik * 100) + "%", kx + kw / 2, y0 + 118);
    });
    // dodatkowe osiągnięcia z gry: tylko niezerowe
    var extra = [d.artefakty ? "ARTEFAKTY " + d.artefakty + "/10" : "", d.misje ? "MISJE " + d.misje : "", d.znaleziska ? "ZNALEZISKA " + d.znaleziska : ""].filter(Boolean);
    g.fillStyle = SZARY; g.font = "500 32px 'IBM Plex Mono', monospace";
    if (extra.length) g.fillText(extra.join("  ·  "), W / 2, 1200);
    // stopka: data, numer, prowadzący
    g.textAlign = "left"; g.fillStyle = TUSZ; g.font = "400 32px 'IBM Plex Sans', sans-serif";
    g.fillText("Lublin, " + data, 180, 1335);
    g.fillStyle = SZARY; g.font = "500 28px 'IBM Plex Mono', monospace"; g.fillText("Nr " + nr, 180, 1380);
    g.textAlign = "right"; g.fillStyle = TUSZ; g.font = "600 34px 'IBM Plex Sans', sans-serif";
    g.fillText("dr Karol Kasprowicz", W - 180, 1335);
    g.fillStyle = SZARY; g.font = "400 26px 'IBM Plex Sans', sans-serif";
    g.fillText("prowadzący wykład · Katedra Prawa Informatycznego i Zawodów Prawniczych WPiA UMCS", W - 180, 1378);
    g.textAlign = "center"; g.fillStyle = SZARY; g.font = "400 24px 'IBM Plex Sans', sans-serif";
    g.fillText("Dokument wygenerowany automatycznie na stronie kursu na podstawie wyników zapisanych w przeglądarce uczestnika.", W / 2, 1490);
    g.fillText("Potwierdza ukończenie kursu online; nie zastępuje zaliczenia przedmiotu w systemie USOS.", W / 2, 1525);
    if (wzor) {   // podgląd prowadzącego albo niekompletne wyniki: znak wodny
      g.save(); g.translate(W / 2, H / 2); g.rotate(-0.35); g.fillStyle = "rgba(214,0,92,0.16)";
      g.font = "800 300px 'Chakra Petch', sans-serif"; g.fillText("WZÓR", 0, 100); g.restore();
    }
    return nr;
  }

  // ---------------------------------------------------------------- strona
  var d = dane(), komplet = d.zal === 10;
  root.textContent = "";
  var stan = el("div", "cert-stan card");
  stan.appendChild(el("h2", null, komplet ? "Kurs online ukończony ✓" : "Quizy zaliczone: " + d.zal + " z 10"));
  stan.appendChild(el("p", "muted", komplet
    ? "Wpisz imię i nazwisko i pobierz certyfikat w PDF. Dane nie są nigdzie wysyłane."
    : "Certyfikat odblokuje się po zaliczeniu quizów wszystkich dziesięciu dzielnic (co najmniej 60%). Wyniki są zapisane w tej przeglądarce; z innego urządzenia przeniesiesz je kodem postępu z karty wyników."));
  var ol = el("ol", "cert-lista");
  d.quizy.forEach(function (q) {
    var li = el("li", q.wynik >= G.PROG_QUIZ ? "ok" : "");
    li.textContent = q.nr + " · " + q.nazwa + ": " + (q.wynik == null ? "quiz nierozwiązany" : Math.round(q.wynik * 100) + "%" + (q.wynik >= G.PROG_QUIZ ? " ✓" : " (poniżej 60%)"));
    ol.appendChild(li);
  });
  stan.appendChild(ol);
  root.appendChild(stan);

  var form = el("div", "cert-form");
  var lab = el("label", null, "Imię i nazwisko na certyfikacie"); lab.htmlFor = "cert-imie";
  var inp = el("input"); inp.id = "cert-imie"; inp.type = "text"; inp.maxLength = 60; inp.autocomplete = "name"; inp.value = czytaj("neo-cert-imie");
  var btn = el("button", "btn", "Pobierz certyfikat (PDF)"); btn.type = "button";
  var stat = el("p", "muted"); stat.setAttribute("role", "status");
  var wolno = komplet || podglad;
  if (!wolno) { inp.disabled = true; btn.disabled = true; }
  if (podglad && !komplet) form.appendChild(el("p", "muted", "Podgląd prowadzącego: certyfikat ze znakiem wodnym „WZÓR”."));
  form.appendChild(lab); form.appendChild(inp);
  var row = el("div", "btn-row"); row.appendChild(btn); form.appendChild(row); form.appendChild(stat);
  root.appendChild(form);

  var cv = el("canvas", "cert-podglad"); cv.setAttribute("role", "img"); cv.setAttribute("aria-label", "Podgląd certyfikatu");
  root.appendChild(cv);
  function odswiez() {
    var imie = (inp.value || "").trim().replace(/\s+/g, " ") || "Imię Nazwisko";
    rysuj(cv, imie, d, !komplet);
  }
  var fonty = document.fonts && document.fonts.load ? Promise.all([
    document.fonts.load("700 40px 'Chakra Petch'"), document.fonts.load("400 40px 'IBM Plex Sans'"),
    document.fonts.load("600 40px 'IBM Plex Sans'"), document.fonts.load("italic 400 40px 'IBM Plex Sans'"),
    document.fonts.load("500 40px 'IBM Plex Mono'")]).catch(function () {}) : Promise.resolve();
  fonty.then(odswiez);
  inp.addEventListener("input", function () { pisz("neo-cert-imie", inp.value); odswiez(); });

  btn.addEventListener("click", function () {
    var imie = (inp.value || "").trim().replace(/\s+/g, " ");
    if (!imie) { stat.textContent = "Wpisz imię i nazwisko."; inp.focus(); return; }
    if (!window.jspdf || !window.jspdf.jsPDF) { stat.textContent = "Nie udało się wczytać generatora PDF (potrzebne połączenie z internetem przy pierwszym użyciu)."; return; }
    fonty.then(function () {
      var nr = rysuj(cv, imie, d, !komplet);
      var pdf = new window.jspdf.jsPDF({ orientation: "landscape", unit: "mm", format: "a4", compress: true });
      pdf.setProperties({ title: "Certyfikat ukończenia kursu: " + imie, subject: "Sztuczna inteligencja. Wyzwania społeczne, kulturowe i prawne", author: "NEO-LUBLIN 2049 · WPiA UMCS", creator: "strona kursu" });
      pdf.addImage(cv.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, 297, 210);
      var plik = "certyfikat-" + imie.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + ".pdf";
      pdf.save(plik);
      stat.textContent = "Pobrano: " + plik + " (nr " + nr + ").";
      if (window.NeoUI && komplet) window.NeoUI.banner("CERTYFIKAT", "KURS ONLINE UKOŃCZONY");
    });
  });
})();
