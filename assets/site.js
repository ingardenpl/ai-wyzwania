// Przełącznik motywu (jasny / ciemny). Wybór zapamiętywany lokalnie, jeśli przeglądarka na to pozwala.
(function () {
  // tłumaczenie: window.NEO_I18N ładuje tylko angielska strona (assets/i18n-en.js); bez niego tekst polski
  var T = function (s, a) { var d = window.NEO_I18N, r = (d && d[s]) || s; return a ? r.replace(/\{(\d+)\}/g, function (m, i) { return a[i]; }) : r; };
  var root = document.documentElement;
  var KEY = "ai-wyzwania-theme";
  try {
    var saved = localStorage.getItem(KEY);
    if (saved === "light" || saved === "dark") root.setAttribute("data-theme", saved);
  } catch (e) {}

  function current() {
    var t = root.getAttribute("data-theme");
    if (t) return t;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  function label(btn) {
    var dark = current() === "dark";
    btn.textContent = dark ? "☀" : "☾";
    btn.setAttribute("aria-label", dark ? T("Włącz jasny motyw") : T("Włącz ciemny motyw"));
    btn.title = btn.getAttribute("aria-label");
  }
  document.addEventListener("DOMContentLoaded", function () {
    var btn = document.querySelector(".theme-toggle");
    if (!btn) return;
    label(btn);
    btn.addEventListener("click", function () {
      var next = current() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem(KEY, next); } catch (e) {}
      label(btn);
    });
  });
})();
