// Quiz samosprawdzający. Dane: <script type="application/json" id="quiz-data"> wstawiany przez build.py.
// Pytania jednokrotnego wyboru: natychmiastowa informacja zwrotna i wyjaśnienie.
// Pytania otwarte: pole na notatkę i rozwijane kryteria dobrej odpowiedzi.
(function () {
  // tłumaczenie: window.NEO_I18N ładuje tylko angielska strona (assets/i18n-en.js); bez niego tekst polski
  var T = function (s, a) { var d = window.NEO_I18N, r = (d && d[s]) || s; return a ? r.replace(/\{(\d+)\}/g, function (m, i) { return a[i]; }) : r; };
  function el(tag, attrs, text) {
    var n = document.createElement(tag);
    if (attrs) for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    return n;
  }

  // Wynik quizu zapisuje się w tej przeglądarce (gra.js, NeoGra). Artefakt dzielnicy wymaga ≥ 60%
  // i terminu spotkania, który minął. Nic nie jest wysyłane.
  function zapiszZaliczenie(zdany, wynik) {
    var cv = document.querySelector("canvas[data-focus]");
    var nr = cv && cv.getAttribute("data-focus");
    if (!nr || !/^\d\d$/.test(nr)) return;
    if (window.NeoGra) { window.NeoGra.zapiszQuiz(nr, wynik); return; }
    if (!zdany) return;
    try {
      var lista = JSON.parse(localStorage.getItem("neo-zaliczone") || "[]");
      if (lista.indexOf(nr) < 0) { lista.push(nr); lista.sort(); localStorage.setItem("neo-zaliczone", JSON.stringify(lista)); }
    } catch (e) {}
  }

  document.addEventListener("DOMContentLoaded", function () {
    var dataEl = document.getElementById("quiz-data");
    var host = document.getElementById("quiz-pytania") || document.getElementById("quiz");
    if (!dataEl || !host) return;
    var data;
    try { data = JSON.parse(dataEl.textContent); } catch (e) { return; }
    var qs = (data && data.pytania) || [];
    var closed = qs.filter(function (q) { return q.typ === "jednokrotny"; });
    var answered = 0, correct = 0;

    var score = el("p", { "class": "quiz-score", "aria-live": "polite" });
    var wynik = el("div", { "class": "quiz-wynik", role: "status" });
    // po ostatniej odpowiedzi: zaliczony czy nie, co z pytaniami otwartymi, czy następna dzielnica jest otwarta, co z artefaktem
    function podsumowanie(ok, pct) {
      wynik.textContent = "";
      var G = window.NeoGra, cv = document.querySelector("canvas[data-focus]"), nr = cv && cv.getAttribute("data-focus");
      var otwarte = qs.length - closed.length;
      var p1 = el("p", { "class": ok ? "ok" : "bad" });
      p1.appendChild(el("b", null, ok ? T("Quiz zaliczony ({0}%, próg 60%). ", [pct]) : T("Poniżej progu 60% ({0}%). ", [pct])));
      p1.appendChild(document.createTextNode(ok ? T("Wynik zapisał się w karcie wyników na mapie.") : T("Możesz zacząć od nowa; liczy się najlepszy wynik.")));
      wynik.appendChild(p1);
      if (otwarte) wynik.appendChild(el("p", { "class": "muted" }, (otwarte === 1 ? T("Do wyniku liczy się {0} pytań zamkniętych; {1} pytanie otwarte jest do samooceny według kryteriów.", [closed.length, otwarte]) : T("Do wyniku liczy się {0} pytań zamkniętych; {1} pytania otwarte są do samooceny według kryteriów.", [closed.length, otwarte]))));
      if (!G || !nr) return;
      var info = (G.dane().info || {}), nxt = ("0" + (parseInt(nr, 10) + 1)).slice(-2), p2 = el("p");
      if (ok && info[nxt]) {
        var r = G.odblokowany(nxt);
        if (r.ok) {
          p2.appendChild(document.createTextNode(T("Dzielnica {0} ({1}) jest otwarta: ", [nxt, info[nxt].nazwa])));
          var a = el("a", { href: "../" + info[nxt].slug + "/index.html" }, T("przejdź do niej")); p2.appendChild(a);
        } else if (r.termin && r.termin.t) {
          p2.appendChild(document.createTextNode(T("Dzielnica {0} ({1}) otworzy się {2}.", [nxt, info[nxt].nazwa, r.termin.t.split(" · ")[0]])));
        }
        if (p2.childNodes.length) wynik.appendChild(p2);
      }
      if (ok && G.wnetrze(nr) && !G.artefakt(nr)) {
        var p3 = el("p", { "class": "muted" }, T("Artefakt tej dzielnicy: zostało jeszcze zadanie i {0} z 7 miejsc we wnętrzu dzielnicy (sekcja „Wnętrze dzielnicy” niżej na tej stronie).", [G.PROG_MIEJSCA]));
        wynik.appendChild(p3);
      }
    }
    function updateScore() {
      score.textContent = closed.length
        ? (answered < closed.length ? T("Wynik: {0} / {1} (odpowiedziano na {2})", [correct, closed.length, answered]) : T("Wynik: {0} / {1}", [correct, closed.length]))
        : "";
    }

    qs.forEach(function (q, i) {
      var box = el("div", { "class": "q" });
      if (q.typ === "jednokrotny") {
        var fs = el("fieldset");
        fs.appendChild(el("legend", null, (i + 1) + ". " + q.tresc));
        var name = "q-" + (q.id || i);
        var fb = el("div", { "class": "feedback", "aria-live": "polite" });
        var labels = [];
        q.odpowiedzi.forEach(function (ans, j) {
          var lab = el("label");
          var inp = el("input", { type: "radio", name: name, value: String(j) });
          lab.appendChild(inp);
          lab.appendChild(el("span", null, String.fromCharCode(97 + j) + ") " + ans));
          labels.push(lab);
          inp.addEventListener("change", function () {
            if (box.dataset.done) return;
            box.dataset.done = "1";
            answered++;
            var ok = j === q.poprawna;
            if (ok) correct++;
            labels.forEach(function (l, k) {
              l.querySelector("input").disabled = true;
              if (k === q.poprawna) l.classList.add("correct");
              else if (k === j) l.classList.add("wrong");
            });
            fb.innerHTML = "";
            var b = el("b", { "class": ok ? "ok" : "bad" }, ok ? T("Dobrze. ") : T("Niestety nie. "));
            fb.appendChild(b);
            if (q.wyjasnienie) fb.appendChild(document.createTextNode(q.wyjasnienie));
            updateScore();
            if (answered === closed.length) { zapiszZaliczenie(correct / closed.length >= 0.6, correct / closed.length); podsumowanie(correct / closed.length >= 0.6, Math.round(correct / closed.length * 100)); }
            if (answered === closed.length && window.NeoUI) {
              var ok = correct / closed.length >= 0.6;
              window.NeoUI.banner(ok ? T("ZLECENIE ZALICZONE") : T("ZLECENIE NIEUKOŃCZONE"),
                ok ? T("{0} / {1} · REPUTACJA +{2}", [correct, closed.length, correct * 10]) : T("{0} / {1} · SPRÓBUJ JESZCZE RAZ", [correct, closed.length]));
            }
          });
          fs.appendChild(lab);
        });
        box.appendChild(fs);
        box.appendChild(fb);
      } else {
        box.appendChild(el("p", { "class": "q-text" }, (i + 1) + ". " + q.tresc + (q.punkty ? T(" ({0} pkt)", [q.punkty]) : "")));
        var ta = el("textarea", { rows: "4", "aria-label": T("Twoja odpowiedź (notatka, nie jest nigdzie wysyłana)"),
          placeholder: T("Zanotuj odpowiedź. Tekst zostaje tylko w tej karcie przeglądarki.") });
        ta.style.width = "100%";
        ta.style.font = "inherit";
        ta.style.padding = "8px";
        ta.style.borderRadius = "8px";
        ta.style.border = "1px solid var(--line)";
        ta.style.background = "var(--bg)";
        ta.style.color = "var(--ink)";
        box.appendChild(ta);
        if (q.kryteria && q.kryteria.length) {
          var d = el("details");
          d.appendChild(el("summary", null, T("Co powinna zawierać dobra odpowiedź")));
          var ul = el("ul");
          q.kryteria.forEach(function (k) { ul.appendChild(el("li", null, k)); });
          d.appendChild(ul);
          box.appendChild(d);
        }
      }
      host.appendChild(box);
    });

    if (closed.length) {
      var reset = el("button", { type: "button", "class": "btn ghost" }, T("Zacznij od nowa"));
      reset.addEventListener("click", function () { location.reload(); });
      var row = el("div", { "class": "btn-row" });
      row.appendChild(reset);
      host.appendChild(score);
      host.appendChild(wynik);
      host.appendChild(row);
      updateScore();
    }
  });
})();
