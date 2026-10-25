/* NEO-LUBLIN 2049: Radio NEO-LUBLIN. Muzyka generowana na żywo w przeglądarce (Web Audio API), bez nagrań
   i bez zewnętrznych usług, więc bez problemów z licencjami i także bez sieci. Trzy stacje: synthwave,
   darksynth i ambient. Odblokowanie: dwa zaliczone quizy (gra.js) albo podgląd prowadzącego.
   Dźwięk startuje wyłącznie po kliknięciu (zasady przeglądarek); stacja i głośność zapamiętane w tej przeglądarce. */
(function () {
  "use strict";
  // tłumaczenie: window.NEO_I18N ładuje tylko angielska strona (assets/i18n-en.js); bez niego tekst polski
  var T = function (s, a) { var d = window.NEO_I18N, r = (d && d[s]) || s; return a ? r.replace(/\{(\d+)\}/g, function (m, i) { return a[i]; }) : r; };
  var PROG = 2;
  var KLUCZ = "neo-radio";
  var STACJE = [
    { id: "bystrzyca", nazwa: "Bystrzyca Nocą FM", opis: "synthwave", bpm: 96, tonika: 57, akordy: [[0, 3, 7], [-4, 0, 3], [3, 7, 10], [-2, 2, 5]], styl: "synth" },
    { id: "rdzen", nazwa: "Rdzeń Danych 112.0", opis: "darksynth", bpm: 112, tonika: 50, akordy: [[0, 3, 7], [-4, 0, 3], [-7, -4, 0], [-5, -1, 2]], styl: "dark" },
    { id: "deszcz", nazwa: "Deszcz nad Rynkiem", opis: "ambient", bpm: 68, tonika: 52, akordy: [[0, 3, 7, 10], [-4, 0, 3, 7], [-7, -4, 0, 3], [-5, -2, 2, 5]], styl: "ambient" }
  ];

  function czytaj() { try { return JSON.parse(localStorage.getItem(KLUCZ) || "{}") || {}; } catch (e) { return {}; } }
  function pisz(o) { try { localStorage.setItem(KLUCZ, JSON.stringify(o)); } catch (e) {} }
  function zaliczone() {
    var G = window.NeoGra;
    if (!G) return 0;
    if (G.podglad()) return 99;
    var q = G.stan().quizy, n = 0;
    Object.keys(q).forEach(function (k) { if (q[k] >= G.PROG_QUIZ) n++; });
    return n;
  }
  function el(tag, cls, t) { var e = document.createElement(tag); if (cls) e.className = cls; if (t != null) e.textContent = t; return e; }

  // ---------------------------------------------------------------- silnik dźwięku
  var ctx = null, master = null, poglos = null, echo = null, gra = false, timer = null, krok = 0, nastepny = 0, stacja = 0, losuj = 1;
  function rnd() { losuj = (losuj * 16807) % 2147483647; return losuj / 2147483647; }
  function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function szum(sek) {
    var b = ctx.createBuffer(1, Math.floor(ctx.sampleRate * sek), ctx.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  var SZUM = null;
  function start() {
    if (ctx) return;
    var AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.5;
    var komp = ctx.createDynamicsCompressor(); komp.threshold.value = -18; komp.ratio.value = 4;
    master.connect(komp); komp.connect(ctx.destination);
    // poglos: odpowiedź impulsowa z zanikającego szumu
    poglos = ctx.createConvolver();
    var ir = ctx.createBuffer(2, ctx.sampleRate * 2.6, ctx.sampleRate);
    for (var c = 0; c < 2; c++) { var d = ir.getChannelData(c); for (var i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2.4); }
    poglos.buffer = ir;
    var pg = ctx.createGain(); pg.gain.value = 0.35; poglos.connect(pg); pg.connect(master);
    // echo dla arpeggio
    echo = ctx.createDelay(1.0); var fb = ctx.createGain(); fb.gain.value = 0.38; var eg = ctx.createGain(); eg.gain.value = 0.3;
    echo.connect(fb); fb.connect(echo); echo.connect(eg); eg.connect(master);
    SZUM = szum(1.5);
  }
  function wyjscie(g, mokro, zEchem) {
    g.connect(master);
    if (mokro) { var w = ctx.createGain(); w.gain.value = mokro; g.connect(w); w.connect(poglos); }
    if (zEchem) g.connect(echo);
  }
  function nuta(t, m, dl, typ, glos, filtr, mokro, zEchem, atak) {
    var o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    o1.type = o2.type = typ; o1.frequency.value = hz(m); o2.frequency.value = hz(m); o2.detune.value = 9;
    f.type = "lowpass"; f.frequency.setValueAtTime(filtr, t); f.Q.value = 3;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(glos, t + (atak || 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dl);
    o1.connect(f); o2.connect(f); f.connect(g); wyjscie(g, mokro, zEchem);
    o1.start(t); o2.start(t); o1.stop(t + dl + 0.05); o2.stop(t + dl + 0.05);
  }
  function stopa(t, glos) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    g.gain.setValueAtTime(glos, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    o.connect(g); wyjscie(g, 0); o.start(t); o.stop(t + 0.4);
  }
  function szumUderzenie(t, dl, glos, typ, freq, mokro) {
    var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = SZUM; f.type = typ; f.frequency.value = freq;
    g.gain.setValueAtTime(glos, t); g.gain.exponentialRampToValueAtTime(0.001, t + dl);
    s.connect(f); f.connect(g); wyjscie(g, mokro); s.start(t, Math.random() * 0.5); s.stop(t + dl + 0.02);
  }

  // jeden krok szesnastkowy; takt = 16 kroków, akord zmienia się co takt
  function zagraj(t) {
    var S = STACJE[stacja], k = krok % 16, takt = Math.floor(krok / 16), ak = S.akordy[takt % S.akordy.length], T = S.tonika;
    var szesn = 60 / S.bpm / 4;
    if (k === 0 && takt % 4 === 0) losuj = 1 + takt;   // ten sam wzór w obrębie frazy
    if (S.styl === "ambient") {
      if (k === 0) ak.forEach(function (i, j) { nuta(t + j * 0.06, T + 12 + i, szesn * 16 * 1.05, "sawtooth", 0.035, 900, 0.9, false, 1.2); });
      if (k === 0) nuta(t, T - 12 + ak[0], szesn * 16, "sine", 0.12, 400, 0.3, false, 0.4);
      if (k % 3 === 0 && rnd() < 0.45) nuta(t, T + 24 + ak[Math.floor(rnd() * ak.length)], 0.9, "triangle", 0.05, 2500, 0.9, true);
      szumUderzenie(t, szesn * 1.1, 0.012, "highpass", 6000, 0.2);   // deszcz
      return;
    }
    var dark = S.styl === "dark";
    // perkusja
    if (dark ? k % 4 === 0 : (k === 0 || k === 8 || (k === 10 && rnd() < 0.3))) stopa(t, 0.9);
    if (k === 4 || k === 12) szumUderzenie(t, 0.22, 0.35, "bandpass", 1800, 0.5);
    if (k % 2 === 0) szumUderzenie(t, 0.05, k % 4 === 2 ? 0.12 : 0.06, "highpass", 8000, 0);
    // bas
    var basNuta = T - 12 + ak[0] + (dark && k % 8 === 6 ? 12 : 0);
    if (dark || k % 2 === 0) nuta(t, basNuta, szesn * (dark ? 0.9 : 1.8), "sawtooth", dark ? 0.16 : 0.13, dark ? 700 : 520, 0);
    // pad na początku taktu
    if (k === 0) ak.forEach(function (i) { nuta(t, T + 12 + i, szesn * 16, "sawtooth", 0.022, dark ? 1200 : 1600, 0.6, false, 0.5); });
    // arpeggio
    var arp = ak.concat(ak.map(function (i) { return i + 12; }));
    var wzor = takt % 2 ? [0, 1, 2, 3, 4, 5, 4, 3] : [0, 2, 1, 3, 2, 4, 3, 5];
    if (!dark || k % 2 === 0) {
      var m = T + 12 + arp[wzor[(k >> (dark ? 1 : 0)) % wzor.length] % arp.length];
      if (rnd() > 0.08) nuta(t, m, szesn * 0.9, dark ? "square" : "sawtooth", dark ? 0.05 : 0.045, dark ? 2200 : 3200, 0.4, true);
    }
  }
  function planuj() {
    var S = STACJE[stacja], szesn = 60 / S.bpm / 4;
    if (nastepny < ctx.currentTime - 0.05) nastepny = ctx.currentTime + 0.05;   // po uśpieniu karty: bez stosu nut z przeszłości
    while (nastepny < ctx.currentTime + 0.12) { zagraj(nastepny); nastepny += szesn; krok++; }
  }
  function wlacz() {
    start();
    if (ctx.state === "suspended") ctx.resume();
    var S = STACJE[stacja];
    echo.delayTime.value = (60 / S.bpm) * 0.75;
    nastepny = ctx.currentTime + 0.05; krok = 0; gra = true;
    if (!timer) timer = setInterval(planuj, 25);
  }
  function wylacz() { gra = false; if (timer) { clearInterval(timer); timer = null; } if (ctx) ctx.suspend(); }

  // ---------------------------------------------------------------- odbiornik
  document.addEventListener("DOMContentLoaded", function () {
    if (!window.AudioContext && !window.webkitAudioContext) return;
    var u = czytaj(); stacja = Math.min(STACJE.length - 1, Math.max(0, u.stacja || 0));
    var box = el("div", "radio"); box.setAttribute("role", "region"); box.setAttribute("aria-label", "Radio NEO-LUBLIN");
    var ikona = el("span", "radio-ik", "📻"); ikona.setAttribute("aria-hidden", "true");
    var nazwa = el("span", "radio-n");
    var play = el("button", "radio-b", "▶"); play.type = "button";
    var dalej = el("button", "radio-b", "⏭"); dalej.type = "button"; dalej.setAttribute("aria-label", T("Następna stacja"));
    var vol = el("input", "radio-v"); vol.type = "range"; vol.min = 0; vol.max = 100; vol.value = u.glosnosc == null ? 50 : u.glosnosc; vol.setAttribute("aria-label", T("Głośność"));
    box.appendChild(ikona); box.appendChild(nazwa); box.appendChild(play); box.appendChild(dalej); box.appendChild(vol);
    document.body.appendChild(box); document.body.classList.add("ma-radio");
    function opis() {
      var n = zaliczone(), S = STACJE[stacja];
      if (n < PROG) {
        box.classList.add("zamk"); play.disabled = dalej.disabled = vol.disabled = true;
        nazwa.textContent = T("RADIO · zalicz {0} quizy ({1}/{0})", [PROG, Math.min(n, PROG)]);
        play.setAttribute("aria-label", T("Radio zablokowane: zalicz {0} quizy dzielnic", [PROG]));
        return;
      }
      box.classList.remove("zamk"); play.disabled = dalej.disabled = vol.disabled = false;
      nazwa.textContent = S.nazwa + " · " + S.opis;
      play.textContent = gra ? "⏸" : "▶";
      play.setAttribute("aria-label", gra ? T("Wyłącz radio") : T("Włącz radio: {0}", [S.nazwa]));
      box.classList.toggle("gra", gra);
    }
    play.addEventListener("click", function () { if (gra) wylacz(); else wlacz(); master.gain.value = vol.value / 100 * 0.8; opis(); });
    dalej.addEventListener("click", function () {
      stacja = (stacja + 1) % STACJE.length; u.stacja = stacja; pisz(u);
      if (gra) { wlacz(); }
      opis();
    });
    vol.addEventListener("input", function () { u.glosnosc = +vol.value; pisz(u); if (master) master.gain.value = vol.value / 100 * 0.8; });
    document.addEventListener("neo:postep", opis);
    opis();
  });
})();
