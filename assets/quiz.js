// Quiz samosprawdzający. Dane: <script type="application/json" id="quiz-data"> wstawiany przez build.py.
// Pytania jednokrotnego wyboru: natychmiastowa informacja zwrotna i wyjaśnienie.
// Pytania otwarte: pole na notatkę i rozwijane kryteria dobrej odpowiedzi.
(function () {
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
    var host = document.getElementById("quiz");
    if (!dataEl || !host) return;
    var data;
    try { data = JSON.parse(dataEl.textContent); } catch (e) { return; }
    var qs = (data && data.pytania) || [];
    var closed = qs.filter(function (q) { return q.typ === "jednokrotny"; });
    var answered = 0, correct = 0;

    var score = el("p", { "class": "quiz-score", "aria-live": "polite" });
    function updateScore() {
      score.textContent = closed.length
        ? "Wynik: " + correct + " / " + closed.length + (answered < closed.length ? " (odpowiedziano na " + answered + ")" : "")
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
            var b = el("b", { "class": ok ? "ok" : "bad" }, ok ? "Dobrze. " : "Niestety nie. ");
            fb.appendChild(b);
            if (q.wyjasnienie) fb.appendChild(document.createTextNode(q.wyjasnienie));
            updateScore();
            if (answered === closed.length) zapiszZaliczenie(correct / closed.length >= 0.6, correct / closed.length);
            if (answered === closed.length && window.NeoUI) {
              var ok = correct / closed.length >= 0.6;
              window.NeoUI.banner(ok ? "ZLECENIE ZALICZONE" : "ZLECENIE NIEUKOŃCZONE",
                correct + " / " + closed.length + (ok ? " · REPUTACJA +" + correct * 10 : " · SPRÓBUJ JESZCZE RAZ"));
            }
          });
          fs.appendChild(lab);
        });
        box.appendChild(fs);
        box.appendChild(fb);
      } else {
        box.appendChild(el("p", { "class": "q-text" }, (i + 1) + ". " + q.tresc + (q.punkty ? " (" + q.punkty + " pkt)" : "")));
        var ta = el("textarea", { rows: "4", "aria-label": "Twoja odpowiedź (notatka, nie jest nigdzie wysyłana)",
          placeholder: "Zanotuj odpowiedź. Tekst zostaje tylko w tej karcie przeglądarki." });
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
          d.appendChild(el("summary", null, "Co powinna zawierać dobra odpowiedź"));
          var ul = el("ul");
          q.kryteria.forEach(function (k) { ul.appendChild(el("li", null, k)); });
          d.appendChild(ul);
          box.appendChild(d);
        }
      }
      host.appendChild(box);
    });

    if (closed.length) {
      var reset = el("button", { type: "button", "class": "btn ghost" }, "Zacznij od nowa");
      reset.addEventListener("click", function () { location.reload(); });
      var row = el("div", { "class": "btn-row" });
      row.appendChild(reset);
      host.appendChild(score);
      host.appendChild(row);
      updateScore();
    }
  });
})();
