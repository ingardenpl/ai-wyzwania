/* NEO-LUBLIN 2049: miasto kursu rysowane programowo w grafice pikselowej (widok z góry).
   Użycie:
     NeoLublin.mount(canvas, { districts: [...], focus: null })     // pełna mapa
     NeoLublin.mount(canvas, { districts: [...], focus: "07" })     // wycinek jednej dzielnicy
   districts: [{ nr: "01", state: "past" | "next" | "future" }, ...]
   Brak zależności. Przy prefers-reduced-motion rysowana jest jedna klatka. */
(function () {
  "use strict";
  // katalog assets (do dołączania eksploracji i świata podziemnego bez zmian w build.py)
  var BASE = (document.currentScript && document.currentScript.src || "").replace(/miasto\.js(\?.*)?$/, "");

  // ------------------------------------------------------------- postęp gracza (tylko ta przeglądarka)
  // dzielnica „zaliczona” = quiz zdany (≥ 60%, zapis w quiz.js) ORAZ termin jej spotkania minął
  function readJSON(k, def) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch (e) { return def; } }
  function cityData() { var el = document.getElementById("city-data"); try { return el ? JSON.parse(el.textContent) : { districts: [] }; } catch (e) { return { districts: [] }; } }
  function podgladProwadzacego() { return /[?&]podglad=prowadzacy(&|$)/.test(location.search) || readJSON("neo-podglad", false) === true; }
  var Postep = {
    past: function () { return cityData().districts.filter(function (d) { return d.state === "past"; }).map(function (d) { return d.nr; }); },
    quizy: function () { return readJSON("neo-zaliczone", []); },
    // zaliczona dzielnica = zdobyty artefakt (gra.js); bez gra.js stara reguła: quiz zdany i termin minął
    zaliczone: function () {
      if (podgladProwadzacego()) return ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"];
      if (window.NeoGra) return window.NeoGra.artefakty();
      var past = Postep.past(); return Postep.quizy().filter(function (n) { return past.indexOf(n) >= 0; });
    },
    eksploracja: function () { return true; },   // chodzenie po mieście od pierwszej wizyty (decyzja prowadzącego, 24.10.2026)
    podglad: podgladProwadzacego
  };
  window.NeoPostep = Postep;

  var T = 6, TW = 80, TH = 45, W = TW * T, H = TH * T;

  // ------------------------------------------------------------- dane miasta
  // Układ przybliża geografię Lublina: Konstantynów na zachodzie, Śródmieście w centrum,
  // Stare Miasto na wschód od niego, Bystrzyca płynie z południa (Wrotków) i skręca na wschód.
  var D = {
    "01": { name: "Konstantynów", zone: [0, 17, 9, 8],   roof: ["#3a4256", "#2f3546", "#454e66"], neon: "#f9f002" },
    "02": { name: "Stare Miasto", zone: [45, 15, 14, 12], roof: ["#6b2e2a", "#7a3b2c", "#5a2a28", "#83452f"], neon: "#ffb347" },
    "03": { name: "Felin",        zone: [61, 33, 14, 10], roof: ["#1d222e", "#232a38", "#191d27"], neon: "#05d9e8" },
    "04": { name: "Tatary",       zone: [61, 15, 17, 12], roof: ["#24493f", "#2c5548", "#1f3d36", "#3a4a3f"], neon: "#9cff57" },
    "05": { name: "Śródmieście",  zone: [30, 17, 12, 8],  roof: ["#3b2752", "#45305e", "#322246"], neon: "#ff2a6d" },
    "06": { name: "Wieniawa",     zone: [13, 15, 14, 11], roof: ["#5e3524", "#6d3d22", "#4f2c22", "#7a4a26"], neon: "#ff4fd8" },
    "07": { name: "Czechów",      zone: [31, 2, 9, 10],   roof: ["#2a3a5c", "#314469", "#24324f"], neon: "#7db7ff" },
    "08": { name: "Sławin",       zone: [1, 1, 9, 12],    roof: ["#5c5546", "#6a6250", "#4e4839"], neon: "#ffd166" },
    "09": { name: "Czuby",        zone: [13, 30, 14, 15], roof: ["#3a3020", "#2a2418", "#463a24"], neon: "#ffb000" },
    "10": { name: "Wrotków",      zone: [30, 30, 13, 15], roof: ["#4b3a2f", "#3f3a36", "#56402e"], neon: "#ff7b29" }
  };
  // dzielnice bez spotkań (tylko podpisy na mapie)
  var FLAVOR = [["Kalinowszczyzna", 68, 5], ["Ponikwoda", 50, 5], ["Węglin", 4, 33], ["Rury", 5, 41],
                ["Dziesiąta", 50, 39], ["Zemborzyce", 36, 44], ["Bronowice", 73, 45], ["Sławinek", 20, 4]];
  var RIVER = [[35.5, 46], [37.5, 40], [40.5, 34.5], [44, 31.3], [50, 30.4], [58, 30], [68, 30.3], [81, 29.8]];
  var KEYS = Object.keys(D);
  // Podziemia Starego Miasta (lokacja ukryta): właz w rogu Rynku, piwnice i tunele pod kamienicami
  var HATCH = { x: 326, y: 137 };
  var CELLARS = [[280, 98, 16, 10], [304, 94, 20, 8], [338, 102, 12, 16], [282, 146, 18, 10], [314, 148, 16, 8], [340, 140, 10, 12]];
  var UNDER_BOX = [276, 92, 78, 68];
  KEYS.forEach(function (k) {
    var z = D[k].zone;
    D[k].cx = (z[0] + z[2] / 2) * T;
    D[k].cy = (z[1] + z[3] / 2) * T;
  });

  // ------------------------------------------------------------- pomocnicze
  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function px(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
  function shade(hex, f) {
    var n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    function m(v) { return Math.max(0, Math.min(255, Math.round(f > 0 ? v + (255 - v) * f : v * (1 + f)))); }
    return "rgb(" + m(r) + "," + m(g) + "," + m(b) + ")";
  }
  function inZone(tx, ty, z) { return tx >= z[0] && tx < z[0] + z[2] && ty >= z[1] && ty < z[1] + z[3]; }
  function zoneOf(tx, ty) { for (var i = 0; i < KEYS.length; i++) if (inZone(tx, ty, D[KEYS[i]].zone)) return KEYS[i]; return null; }
  function nearest(x, y) {
    var best = null, bd = 1e9;
    KEYS.forEach(function (k) { var dx = D[k].cx - x, dy = D[k].cy - y, d = dx * dx + dy * dy; if (d < bd) { bd = d; best = k; } });
    return best;
  }

  // ------------------------------------------------------------- siatka ulic i rzeka
  var ROAD = 1, WATER = 2, LOT = 0;
  var AV_H = [13, 14, 27, 28], AV_V = [10, 11, 28, 29, 43, 44, 59, 60];
  var AV_H1 = [13, 27], AV_V1 = [10, 28, 43, 59], HW = 20; // pierwsze pasy alei, autostrada od zachodu
  var ST_H = [6, 22, 36, 41], ST_V = [5, 19, 36, 51, 67, 73];
  function isHW(x, y) { return (y === HW || y === HW + 1) && x <= 11; }

  // rzeka Bystrzyca: odległość od łamanej i punkt na łamanej (parametr 0..1)
  var RLEN = [], RTOT = 0;
  for (var ri = 1; ri < RIVER.length; ri++) { var l = Math.hypot(RIVER[ri][0] - RIVER[ri - 1][0], RIVER[ri][1] - RIVER[ri - 1][1]); RLEN.push(l); RTOT += l; }
  function riverDist(x, y) {
    var best = 1e9;
    for (var i = 1; i < RIVER.length; i++) {
      var a = RIVER[i - 1], b = RIVER[i], dx = b[0] - a[0], dy = b[1] - a[1];
      var t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy)));
      best = Math.min(best, Math.hypot(x - (a[0] + t * dx), y - (a[1] + t * dy)));
    }
    return best;
  }
  function riverPoint(s) {
    var d = ((s % 1) + 1) % 1 * RTOT;
    for (var i = 0; i < RLEN.length; i++) {
      if (d <= RLEN[i]) { var a = RIVER[i], b = RIVER[i + 1], f = d / RLEN[i]; return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]; }
      d -= RLEN[i];
    }
    return RIVER[RIVER.length - 1];
  }
  var RW = 1.45;

  function buildGrid() {
    var g = [];
    for (var y = 0; y < TH; y++) {
      g[y] = [];
      for (var x = 0; x < TW; x++) {
        var av = AV_H.indexOf(y) >= 0 || AV_V.indexOf(x) >= 0 || isHW(x, y);
        var t = LOT;
        if (av) t = ROAD;
        else if (((ST_H.indexOf(y) >= 0 && x > 11) || ST_V.indexOf(x) >= 0) && !zoneOf(x, y)) t = ROAD;
        if (!av && riverDist(x + 0.5, y + 0.5) < RW) t = WATER; // aleje przechodzą mostami
        g[y][x] = t;
      }
    }
    return g;
  }

  // ------------------------------------------------------------- warstwa statyczna
  function drawStatic(ctx, grid, R, anim) {
    // tło (zaułki)
    px(ctx, 0, 0, W, H, "#090b12");
    for (var i = 0; i < 1400; i++) px(ctx, R() * W, R() * H, 1, 1, R() < 0.5 ? "#0d1019" : "#07080d");

    // ulice
    for (var y = 0; y < TH; y++) for (var x = 0; x < TW; x++) {
      if (grid[y][x] === ROAD) {
        px(ctx, x * T, y * T, T, T, "#1b1f2b");
        if (R() < 0.08) px(ctx, x * T + R() * 5, y * T + R() * 5, 1, 1, "#262b3a");
      }
    }
    // linie środkowe alei
    ctx.globalAlpha = 0.8;
    AV_H1.forEach(function (r) { for (var x2 = 0; x2 < W; x2 += 6) px(ctx, x2, (r + 0.5) * T + 2, 3, 1, "#c9a227"); });
    AV_V1.forEach(function (cl) { for (var y2 = 0; y2 < H; y2 += 6) px(ctx, (cl + 0.5) * T + 2, y2, 1, 3, "#c9a227"); });
    for (var x3 = 0; x3 < 12 * T; x3 += 6) px(ctx, x3, (HW + 0.5) * T + 2, 3, 1, "#c9a227");
    ctx.globalAlpha = 1;
    // przejścia dla pieszych
    AV_V1.forEach(function (vx) {
      AV_H1.forEach(function (hy) {
        for (var k = 0; k < 4; k++) { px(ctx, vx * T - 3, hy * T + 1 + k * 3, 2, 2, "#5a5f70"); px(ctx, (vx + 2) * T + 1, hy * T + 1 + k * 3, 2, 2, "#5a5f70"); }
      });
    });

    // rzeka Bystrzyca i mosty
    for (var y4 = 0; y4 < TH; y4++) for (var x4 = 0; x4 < TW; x4++) {
      if (grid[y4][x4] === WATER) px(ctx, x4 * T, y4 * T, T, T, "#0a1a2e");
      else if (grid[y4][x4] === ROAD && riverDist(x4 + 0.5, y4 + 0.5) < RW) { // most
        px(ctx, x4 * T, y4 * T, T, T, "#262a36");
        if (AV_V.indexOf(x4) >= 0) { px(ctx, AV_V.indexOf(x4) % 2 ? x4 * T + T - 1 : x4 * T, y4 * T, 1, T, "#8a90a0"); }
        else { px(ctx, x4 * T, AV_H.indexOf(y4) % 2 ? y4 * T + T - 1 : y4 * T, T, 1, "#8a90a0"); }
      }
    }
    for (var j = 0; j < 300; j++) {
      var rp = riverPoint(R());
      var ox = (R() - 0.5) * 2, oy = (R() - 0.5) * 2;
      if (riverDist(rp[0] + ox, rp[1] + oy) < RW - 0.3 && grid[Math.floor(rp[1] + oy)] && grid[Math.floor(rp[1] + oy)][Math.floor(rp[0] + ox)] === WATER)
        px(ctx, (rp[0] + ox) * T, (rp[1] + oy) * T, 2, 1, R() < 0.5 ? "#12304d" : "#163a5c");
    }

    // budynki poza strefami charakterystycznymi
    var used = [];
    for (var a = 0; a < TH; a++) { used[a] = []; for (var b = 0; b < TW; b++) used[a][b] = grid[a][b] !== LOT || !!zoneOf(b, a); }
    for (var yy2 = 0; yy2 < TH; yy2++) for (var xx2 = 0; xx2 < TW; xx2++) {
      if (used[yy2][xx2]) continue;
      var bw = 2 + Math.floor(R() * 3), bh = 2 + Math.floor(R() * 3);
      while (bw > 1 || bh > 1) {
        var ok = true;
        for (var q = 0; q < bh && ok; q++) for (var p = 0; p < bw && ok; p++) {
          var X = xx2 + p, Y = yy2 + q;
          if (X >= TW || Y >= TH || used[Y][X]) ok = false;
        }
        if (ok) break;
        if (bw >= bh && bw > 1) bw--; else bh--;
      }
      for (var q2 = 0; q2 < bh; q2++) for (var p2 = 0; p2 < bw; p2++) used[yy2 + q2][xx2 + p2] = true;
      building(ctx, R, xx2 * T + 1, yy2 * T + 1, bw * T - 2, bh * T - 2, D[nearest((xx2 + bw / 2) * T, (yy2 + bh / 2) * T)], anim);
    }

    // latarnie wzdłuż alei
    for (var lx = 5; lx < W; lx += 30) AV_H1.forEach(function (r) { glow(ctx, lx, r * T - 1, "#ffe08a", 0.16, 2); glow(ctx, lx + 15, (r + 2) * T + 1, "#ffe08a", 0.14, 2); });
    for (var ly2 = 5; ly2 < H; ly2 += 30) AV_V1.forEach(function (cl) { glow(ctx, cl * T - 1, ly2, "#ffe08a", 0.16, 2); glow(ctx, (cl + 2) * T + 1, ly2 + 15, "#ffe08a", 0.14, 2); });

    // dzielnice charakterystyczne
    LANDMARKS["01"](ctx, R, anim); LANDMARKS["02"](ctx, R, anim); LANDMARKS["03"](ctx, R, anim);
    LANDMARKS["04"](ctx, R, anim); LANDMARKS["05"](ctx, R, anim); LANDMARKS["06"](ctx, R, anim);
    LANDMARKS["07"](ctx, R, anim); LANDMARKS["08"](ctx, R, anim); LANDMARKS["09"](ctx, R, anim);
    LANDMARKS["10"](ctx, R, anim);
  }

  function glow(ctx, x, y, col, alpha, r) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1; px(ctx, x, y, 1, 1, col); ctx.restore();
  }

  function building(ctx, R, x, y, w, h, d, anim) {
    var base = d.roof[Math.floor(R() * d.roof.length)];
    var tall = R();
    anim.buildings.push([x, y, w, h, tall]);
    var sh = 1 + Math.round(tall * 3);
    px(ctx, x + sh, y + sh, w, h, "rgba(0,0,0,0.55)");
    px(ctx, x, y, w, h, base);
    px(ctx, x, y, w, 1, shade(base, 0.18)); px(ctx, x, y, 1, h, shade(base, 0.12));
    px(ctx, x, y + h - 1, w, 1, shade(base, -0.35)); px(ctx, x + w - 1, y, 1, h, shade(base, -0.3));
    if (w > 6 && h > 6) {
      if (R() < 0.7) px(ctx, x + 2 + R() * (w - 6), y + 2 + R() * (h - 6), 3, 2, "#6c7280");
      if (R() < 0.5) px(ctx, x + 2 + R() * (w - 6), y + 2 + R() * (h - 6), 2, 2, "#8a909c");
      if (R() < 0.35) { for (var s = 0; s < w - 4; s += 2) px(ctx, x + 2 + s, y + h - 3, 1, 1, "#ffd58a"); }
    }
    if (R() < 0.45) { // neonowy pasek
      var c = R() < 0.75 ? d.neon : (R() < 0.5 ? "#ff2a6d" : "#05d9e8");
      var side = Math.floor(R() * 4), sx = x, sy = y, sw = w, shh = 1;
      if (side === 1) { sy = y + h - 1; } else if (side === 2) { sw = 1; shh = h; } else if (side === 3) { sx = x + w - 1; sw = 1; shh = h; }
      ctx.save(); ctx.globalAlpha = 0.25; px(ctx, sx - 1, sy - 1, sw + 2, shh + 2, c); ctx.restore();
      px(ctx, sx, sy, sw, shh, c);
      anim.neons.push([sx, sy, sw, shh, c, base]);
    }
    if (tall > 0.8) anim.beacons.push([x + Math.floor(w / 2), y + Math.floor(h / 2), R() * 60]);
  }

  // ------------------------------------------------------------- charakterystyczne miejsca
  function Z(k) { var z = D[k].zone; return { x: z[0] * T, y: z[1] * T, w: z[2] * T, h: z[3] * T }; }
  var LANDMARKS = {
    "01": function (c, R, A) { // Brama Zachodnia: punkt kontrolny Voight-Kampff
      var z = Z("01");
      px(c, z.x, z.y, z.w, z.h, "#141824");
      for (var i = 0; i < z.w; i += 4) { px(c, z.x + i, z.y + 2, 2, 2, "#2a3042"); px(c, z.x + i, z.y + z.h - 4, 2, 2, "#2a3042"); }
      px(c, z.x, HW * T, z.w, 2 * T, "#1b1f2b");
      for (var x = 0; x < z.w; x += 6) px(c, z.x + x, (HW + 0.5) * T + 2, 3, 1, "#c9a227");
      // budki i szlaban
      px(c, z.x + 28, HW * T - 9, 10, 7, "#3a4256"); px(c, z.x + 28, HW * T - 9, 10, 1, "#f9f002");
      px(c, z.x + 28, (HW + 2) * T + 2, 10, 7, "#3a4256"); px(c, z.x + 28, (HW + 2) * T + 8, 10, 1, "#f9f002");
      for (var s = 0; s < 12; s++) px(c, z.x + 32, HW * T + s, 2, 1, s % 4 < 2 ? "#f9f002" : "#111");
      A.scanner = { x: z.x + 22, y: HW * T, h: 12 };
      // kolejka samochodów
      for (var q = 0; q < 3; q++) car(c, z.x + 4 + q * 7, HW * T + 7, 1, ["#c0c6d4", "#7a2030", "#2c5a8a"][q]);
    },
    "02": function (c, R, A) { // Stare Miasto: Muzeum Automatów
      var z = Z("02");
      px(c, z.x, z.y, z.w, z.h, "#1a1210");
      // mury
      c.strokeStyle = "#5a4a3a"; c.lineWidth = 2; c.strokeRect(z.x + 2, z.y + 2, z.w - 4, z.h - 4);
      // ciasne kamienice
      for (var i = 0; i < 46; i++) {
        var w = 5 + R() * 7, h = 5 + R() * 7, x = z.x + 5 + R() * (z.w - 14), y = z.y + 5 + R() * (z.h - 14);
        var col = D["02"].roof[Math.floor(R() * 4)];
        px(c, x + 1, y + 1, w, h, "rgba(0,0,0,.5)"); px(c, x, y, w, h, col); px(c, x, y, w, 1, shade(col, 0.2));
      }
      // rynek i muzeum
      var mx = z.x + z.w / 2 - 14, my = z.y + z.h / 2 - 10;
      px(c, mx - 6, my - 6, 40, 32, "#3b322b");
      for (var k = 0; k < 60; k++) px(c, mx - 6 + R() * 40, my - 6 + R() * 32, 1, 1, "#4a3f36");
      px(c, mx, my, 28, 20, "#7a5a3a"); px(c, mx, my, 28, 2, "#a07a4a"); px(c, mx + 9, my + 5, 10, 10, "#2a2018");
      gear(c, mx + 14, my + 10, 4, "#ffb347");
      A.gears.push([mx + 14, my + 10]);
      // brama
      px(c, z.x + z.w - 8, z.y + z.h / 2 - 4, 6, 8, "#8a6a4a"); px(c, z.x + z.w - 7, z.y + z.h / 2 - 2, 4, 4, "#1a1210");
    },
    "03": function (c, R, A) { // Rdzeń: centrum danych
      var z = Z("03");
      px(c, z.x + 3, z.y + 3, z.w, z.h, "rgba(0,0,0,.6)");
      px(c, z.x, z.y, z.w, z.h, "#141821"); px(c, z.x, z.y, z.w, 1, "#2a3140");
      for (var r = 0; r < 6; r++) {
        var yy = z.y + 6 + r * 9;
        px(c, z.x + 6, yy, z.w - 36, 5, "#1f2533");
        for (var l = 0; l < (z.w - 40) / 3; l++) A.leds.push([z.x + 8 + l * 3, yy + 2, R()]);
      }
      // wentylatory i chłodnie
      for (var f = 0; f < 3; f++) { var fx = z.x + z.w - 22 + (f % 2) * 10, fy = z.y + 8 + f * 16; ring(c, fx, fy, 5, "#3a4256"); A.fans.push([fx, fy, R() * 6]); }
      for (var t = 0; t < 2; t++) { ring(c, z.x - 2 + t * 16 + 10, z.y + z.h + 6, 6, "#4a5266"); A.steam.push([z.x + 8 + t * 16, z.y + z.h + 6]); }
      ctx_glow(c, z.x, z.y, z.w, z.h, "#05d9e8");
    },
    "04": function (c, R, A) { // Kampus i Fabryka
      var z = Z("04");
      // kampus
      var qx = z.x + 4, qy = z.y + 4, qw = 52, qh = z.h - 8;
      px(c, qx, qy, qw, qh, "#163a24");
      for (var g = 0; g < 160; g++) px(c, qx + R() * qw, qy + R() * qh, 1, 1, R() < 0.5 ? "#1e4a2e" : "#0f2c1a");
      c.strokeStyle = "#8a8070"; c.lineWidth = 1;
      c.beginPath(); c.moveTo(qx, qy); c.lineTo(qx + qw, qy + qh); c.moveTo(qx + qw, qy); c.lineTo(qx, qy + qh); c.stroke();
      [[qx + 4, qy + 4], [qx + qw - 18, qy + 4], [qx + 4, qy + qh - 14], [qx + qw - 18, qy + qh - 14]].forEach(function (b) {
        px(c, b[0] + 1, b[1] + 1, 14, 10, "rgba(0,0,0,.5)"); px(c, b[0], b[1], 14, 10, "#3a4a3f"); px(c, b[0], b[1], 14, 1, "#56705c");
      });
      for (var tr = 0; tr < 14; tr++) { var tx = qx + 8 + R() * (qw - 16), ty = qy + 8 + R() * (qh - 16); px(c, tx, ty, 3, 3, "#2d6a3e"); px(c, tx, ty, 1, 1, "#4a9a5a"); }
      // fabryka z dachem szedowym
      var fx = z.x + 62, fy = z.y + 6, fw = z.w - 66, fh = z.h - 24;
      px(c, fx + 2, fy + 2, fw, fh, "rgba(0,0,0,.55)"); px(c, fx, fy, fw, fh, "#3a3f46");
      for (var s = 0; s < fw; s += 5) { px(c, fx + s, fy, 3, fh, "#4a5059"); px(c, fx + s + 3, fy, 1, fh, "#9cff57"); }
      // taśmociąg
      var cy = fy + fh + 6; px(c, fx - 4, cy, fw + 4, 3, "#22262c"); A.conveyor = { x: fx - 4, y: cy + 1, w: fw + 4 };
      px(c, fx + fw - 8, fy - 6, 5, 6, "#555b66"); A.smoke.push([fx + fw - 6, fy - 6]);
    },
    "05": function (c, R, A) { // Plac Ekranów
      var z = Z("05");
      px(c, z.x, z.y, z.w, z.h, "#1a1726");
      for (var k = 0; k < 140; k++) px(c, z.x + R() * z.w, z.y + R() * z.h, 1, 1, "#241f36");
      for (var i = 0; i < 6; i++) {
        var sx = z.x + 4 + (i % 3) * 22, sy = z.y + 4 + Math.floor(i / 3) * 24;
        px(c, sx + 2, sy + 2, 18, 10, "rgba(0,0,0,.6)"); px(c, sx, sy, 18, 10, "#0b0b12");
        A.screens.push([sx + 1, sy + 1, 16, 8, R()]);
      }
      for (var p = 0; p < 70; p++) A.crowd.push([z.x + 3 + R() * (z.w - 6), z.y + 16 + R() * 6, R() * 6]);
    },
    "06": function (c, R, A) { // Nocny Targ
      var z = Z("06");
      px(c, z.x, z.y, z.w, z.h, "#160f12");
      for (var i = 0; i < 120; i++) {
        var x = z.x + 3 + R() * (z.w - 9), y = z.y + 3 + R() * (z.h - 9), w = 3 + R() * 4, h = 3 + R() * 3;
        var col = ["#7a4a26", "#8a2f4a", "#2f5a7a", "#6d3d22", "#4a6a2a"][Math.floor(R() * 5)];
        px(c, x, y, w, h, col); px(c, x, y, w, 1, shade(col, 0.25));
      }
      for (var u = 0; u < 9; u++) { var ux = z.x + 8 + R() * (z.w - 16), uy = z.y + 8 + R() * (z.h - 16); ring(c, ux, uy, 3, ["#ff4fd8", "#05d9e8", "#f9f002"][u % 3]); }
      for (var l = 0; l < 30; l++) A.lanterns.push([z.x + 4 + R() * (z.w - 8), z.y + 4 + R() * (z.h - 8), R() * 10]);
      // hologram
      A.holo = { x: z.x + z.w / 2, y: z.y + z.h / 2 };
    },
    "07": function (c, R, A) { // Wieża Regulatora
      var z = Z("07"), cx = z.x + z.w / 2, cy = z.y + z.h / 2;
      px(c, z.x, z.y, z.w, z.h, "#10141f");
      px(c, cx - 22, cy - 22 + 4, 44, 44, "rgba(0,0,0,.6)");
      var cols = ["#24324f", "#2a3a5c", "#314469", "#3a5080", "#4a64a0"];
      for (var i = 0; i < 5; i++) { var s = 40 - i * 7; px(c, cx - s / 2, cy - s / 2, s, s, cols[i]); }
      px(c, cx - 4, cy - 4, 8, 8, "#1a2238"); px(c, cx - 2, cy - 3, 1, 6, "#e6eeff"); px(c, cx + 1, cy - 3, 1, 6, "#e6eeff"); px(c, cx - 2, cy, 4, 1, "#e6eeff");
      for (var a = 0; a < 12; a++) A.stars.push([cx + Math.cos(a / 12 * Math.PI * 2) * 17, cy + Math.sin(a / 12 * Math.PI * 2) * 17]);
    },
    "08": function (c, R, A) { // Pałac Sprawiedliwości
      var z = Z("08");
      px(c, z.x, z.y, z.w, z.h, "#16140f");
      var bx = z.x + 4, by = z.y + 6, bw = z.w - 8, bh = z.h - 16;
      px(c, bx + 3, by + 3, bw, bh, "rgba(0,0,0,.6)"); px(c, bx, by, bw, bh, "#6a6250"); px(c, bx, by, bw, 2, "#8a8068");
      px(c, bx + 10, by + 12, bw - 20, bh - 24, "#2a2620"); // dziedziniec
      for (var k = 0; k < bw - 8; k += 4) px(c, bx + 4 + k, by + bh + 2, 2, 2, "#cfc4a0"); // kolumny
      // waga
      var wx = bx + bw / 2, wy = by + bh / 2;
      px(c, wx, wy - 6, 1, 10, "#ffd166"); px(c, wx - 7, wy - 5, 15, 1, "#ffd166");
      px(c, wx - 9, wy - 2, 5, 1, "#ffd166"); px(c, wx + 5, wy - 2, 5, 1, "#ffd166"); px(c, wx - 3, wy + 4, 7, 1, "#ffd166");
      // radiowozy
      car(c, z.x + 8, z.y + z.h - 7, 1, "#d8dde8"); car(c, z.x + 22, z.y + z.h - 7, -1, "#d8dde8");
      A.police.push([z.x + 9, z.y + z.h - 8], [z.x + 23, z.y + z.h - 8]);
    },
    "09": function (c, R, A) { // Piramida Korporacji
      var z = Z("09"), cx = z.x + z.w / 2, cy = z.y + z.h / 2 + 2;
      px(c, z.x, z.y, z.w, z.h, "#0d0b08");
      px(c, cx - 30 + 5, cy - 30 + 5, 60, 60, "rgba(0,0,0,.7)");
      var cols = ["#2a2418", "#3a3020", "#4a3c26", "#5c4a2c", "#705a34", "#8a6e3c", "#a8843e"];
      for (var i = 0; i < 7; i++) {
        var s = 60 - i * 8; px(c, cx - s / 2, cy - s / 2, s, s, cols[i]);
        px(c, cx - s / 2, cy - s / 2, s, 1, shade(cols[i], 0.25)); px(c, cx - s / 2, cy - s / 2, 1, s, shade(cols[i], 0.15));
        for (var w = 0; w < s; w += 3) if (R() < 0.5) px(c, cx - s / 2 + w, cy + s / 2 - 1, 1, 1, "#ffcf6a");
      }
      A.pyramid = { x: cx, y: cy };
    },
    "10": function (c, R, A) { // Doki i Złomowisko nad Bystrzycą (Wrotków)
      var z = Z("10");
      function land(x, y) { return riverDist(x / T, y / T) >= RW; }
      for (var y = z.y; y < z.y + z.h; y += 2) for (var x = z.x; x < z.x + z.w; x += 2) {
        var d = riverDist((x + 1) / T, (y + 1) / T);
        if (d >= RW && d < RW + 0.45) px(c, x, y, 2, 2, "#5a5046");      // nabrzeże
        else if (d >= RW + 0.45) px(c, x, y, 2, 2, R() < 0.06 ? "#211c15" : "#17140f");
      }
      // kontenery na lądzie, z dala od wody
      for (var i = 0; i < 60; i++) {
        var cx = z.x + 3 + R() * (z.w - 14), cy = z.y + 3 + R() * (z.h - 8);
        if (riverDist(cx / T, cy / T) < RW + 1.6 || riverDist((cx + 10) / T, (cy + 4) / T) < RW + 1.6) continue;
        var col = ["#a33a2a", "#2a6a8a", "#c9a227", "#3a7a4a", "#8a8a8a"][Math.floor(R() * 5)];
        px(c, cx + 1, cy + 1, 10, 4, "rgba(0,0,0,.5)"); px(c, cx, cy, 10, 4, col);
        for (var r = 1; r < 10; r += 2) px(c, cx + r, cy, 1, 4, shade(col, -0.25));
      }
      // złomowisko (elektrośmieci) w dolnym lewym rogu
      for (var j = 0; j < 180; j++) {
        var sx = z.x + 2 + R() * 26, sy = z.y + z.h - 26 + R() * 24;
        if (!land(sx, sy)) continue;
        px(c, sx, sy, 1 + R() * 2, 1, ["#5a5a5a", "#7a5a3a", "#3a3a3a", "#8a6a4a", "#2a8a8a"][Math.floor(R() * 5)]);
      }
      // dźwigi przy nabrzeżu
      [0.06, 0.2].forEach(function (s) {
        var p = riverPoint(s), k = [(p[0] - 2.4) * T, p[1] * T];
        px(c, k[0], k[1] - 14, 3, 16, "#ff7b29"); px(c, k[0] - 10, k[1] - 14, 26, 2, "#ff7b29"); A.cranes.push(k);
      });
      // kominy elektrociepłowni
      [[z.x + 4, z.y + 3], [z.x + 12, z.y + 6]].forEach(function (k) { px(c, k[0], k[1], 4, 4, "#4a4a4a"); px(c, k[0], k[1], 4, 1, "#ff3048"); A.smoke.push([k[0] + 2, k[1]]); });
      A.boats.push({ t: 0.1, s: 0.0009 }, { t: 0.55, s: -0.0007 }, { t: 0.85, s: 0.0006 });
    }
  };

  function car(c, x, y, dir, col) {
    px(c, x, y, 4, 2, col);
    if (dir > 0) { px(c, x + 4, y, 1, 1, "#fff6c2"); px(c, x + 4, y + 1, 1, 1, "#fff6c2"); px(c, x - 1, y, 1, 2, "#ff2a3a"); }
    else { px(c, x - 1, y, 1, 1, "#fff6c2"); px(c, x - 1, y + 1, 1, 1, "#fff6c2"); px(c, x + 4, y, 1, 2, "#ff2a3a"); }
  }
  function ring(c, x, y, r, col) { c.strokeStyle = col; c.lineWidth = 1; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.stroke(); }
  function gear(c, x, y, r, col) { ring(c, x, y, r, col); for (var a = 0; a < 8; a++) px(c, x + Math.cos(a * Math.PI / 4) * (r + 1) - 0.5, y + Math.sin(a * Math.PI / 4) * (r + 1) - 0.5, 1, 1, col); }
  function ctx_glow(c, x, y, w, h, col) { c.save(); c.globalAlpha = 0.18; c.strokeStyle = col; c.lineWidth = 2; c.strokeRect(x - 1, y - 1, w + 2, h + 2); c.restore(); }

  // ------------------------------------------------------------- mgła
  function drawFog(ctx, states, R) {
    var img = ctx.getImageData(0, 0, W, H), d = img.data;
    var who = [];
    for (var y = 0; y < H; y += 2) for (var x = 0; x < W; x += 2) {
      var k = nearest(x, y), st = states[k] || "past";
      if (st === "future") {
        for (var dy = 0; dy < 2; dy++) for (var dx = 0; dx < 2; dx++) {
          var i = ((y + dy) * W + (x + dx)) * 4;
          var keep = ((x + y) / 2) % 3 === 0 && R() < 0.35 ? 0.42 : 0.16;
          d[i] = d[i] * keep + 6; d[i + 1] = d[i + 1] * keep + 7; d[i + 2] = d[i + 2] * keep + 14;
        }
      }
    }
    ctx.putImageData(img, 0, 0);
    return who;
  }


  // ------------------------------------------------------------- tryb SIEĆ (cyberprzestrzeń)
  var ORDER = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"];
  function drawNet(ctx, grid, A, states, R) {
    px(ctx, 0, 0, W, H, "#020306");
    for (var x = 0; x < W; x += T) px(ctx, x, 0, 1, H, x % (4 * T) === 0 ? "#0b3036" : "#061a1e");
    for (var y = 0; y < H; y += T) px(ctx, 0, y, W, 1, y % (4 * T) === 0 ? "#0b3036" : "#061a1e");
    // rzeka: martwy kanał, szum telewizora
    for (var ty = 0; ty < TH; ty++) for (var tx = 0; tx < TW; tx++) {
      if (grid[ty][tx] !== WATER) continue;
      px(ctx, tx * T, ty * T, T, T, "#04060b");
      for (var k = 0; k < 5; k++) px(ctx, tx * T + R() * T, ty * T + R() * T, 1, 1, R() < 0.5 ? "#2a3346" : "#5a667e");
    }
    // aleje jako strumienie danych
    ctx.save(); ctx.globalAlpha = 0.75;
    AV_H1.forEach(function (r) { px(ctx, 0, (r + 1) * T - 1, W, 2, "#0a6b76"); });
    AV_V1.forEach(function (cl) { px(ctx, (cl + 1) * T - 1, 0, 2, H, "#0a6b76"); });
    px(ctx, 0, (HW + 1) * T - 1, 12 * T, 2, "#0a6b76");
    ctx.restore();
    // budynki jako wieże z drutu
    A.buildings.forEach(function (b) {
      var x0 = b[0], y0 = b[1], w = b[2], h = b[3], tall = b[4], lift = 1 + Math.round(tall * 4);
      var col = tall > 0.75 ? "#7df9ff" : tall > 0.4 ? "#1aa7b8" : "#0e5a64";
      ctx.save(); ctx.globalAlpha = 0.5 + tall * 0.4; ctx.strokeStyle = col; ctx.lineWidth = 1;
      ctx.strokeRect(x0 + 0.5, y0 + 0.5, w - 1, h - 1);
      ctx.strokeRect(x0 - lift + 0.5, y0 - lift + 0.5, w - 1, h - 1);
      ctx.beginPath();
      [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]].forEach(function (c) {
        ctx.moveTo(x0 + c[0] + 0.5, y0 + c[1] + 0.5); ctx.lineTo(x0 + c[0] - lift + 0.5, y0 + c[1] - lift + 0.5);
      });
      ctx.stroke(); ctx.restore();
    });
    // dzielnice jako konstrukty danych; przyszłe za murem ICE
    KEYS.forEach(function (k) {
      var z = Z(k), st = states[k] || "past", col = st === "future" ? "#ff003c" : D[k].neon;
      ctx.save();
      ctx.globalAlpha = 0.08; ctx.fillStyle = col; ctx.fillRect(z.x, z.y, z.w, z.h);
      ctx.globalAlpha = 0.9; ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.strokeRect(z.x + 0.5, z.y + 0.5, z.w - 1, z.h - 1);
      ctx.globalAlpha = 0.45; ctx.strokeRect(z.x + 4.5, z.y + 4.5, z.w - 9, z.h - 9);
      ctx.globalAlpha = 0.22; ctx.strokeRect(z.x + 8.5, z.y + 8.5, z.w - 17, z.h - 17);
      if (st === "future") {
        ctx.save(); ctx.beginPath(); ctx.rect(z.x, z.y, z.w, z.h); ctx.clip();
        ctx.globalAlpha = 0.28; ctx.beginPath();
        for (var d = -z.h; d < z.w; d += 5) { ctx.moveTo(z.x + d, z.y + z.h); ctx.lineTo(z.x + d + z.h, z.y); }
        ctx.stroke(); ctx.restore();
        ctx.globalAlpha = 0.9; ctx.strokeRect(z.x - 1.5, z.y - 1.5, z.w + 3, z.h + 3);
      }
      ctx.restore();
    });
  }

  // ------------------------------------------------------------- animacja
  function makeAnim() {
    return { buildings: [], neons: [], beacons: [], leds: [], fans: [], steam: [], smoke: [], screens: [], crowd: [], lanterns: [],
             stars: [], police: [], gears: [], cranes: [], boats: [], scanner: null, conveyor: null, holo: null, pyramid: null };
  }

  function lanes() {
    var L = [];
    AV_H1.forEach(function (y) { L.push({ h: true, y: y * T + 2, dir: 1 }); L.push({ h: true, y: y * T + 8, dir: -1 }); });
    AV_V1.forEach(function (x) { L.push({ h: false, x: x * T + 2, dir: 1 }); L.push({ h: false, x: x * T + 8, dir: -1 }); });
    L.push({ h: true, y: HW * T + 8, dir: 1, max: 12 * T });
    return L;
  }

  function podState(pd) {
    pd = pd || {};
    var open = !!pd.jawne || Postep.zaliczone().length >= 10;
    try { if (localStorage.getItem("neo-podziemia") === "1") open = true; } catch (e) {}
    if (open) return "open";
    if (pd.sygnal && new Date() >= new Date(pd.sygnal + "T00:00:00")) return "signal";
    return "hidden";
  }

  // rysowanie podziemi: ULICA (prześwit piwnic i tuneli) oraz SIEĆ (strefa ciszy bez sieci)
  function tunnels(c) {
    CELLARS.forEach(function (r) {
      c.strokeRect(r[0] + 0.5, r[1] + 0.5, r[2], r[3]);
      c.beginPath(); c.moveTo(HATCH.x + 3, HATCH.y + 2);
      c.lineTo(HATCH.x + 3, r[1] + r[3] / 2); c.lineTo(r[0] + r[2] / 2, r[1] + r[3] / 2); c.stroke();
    });
  }
  function drawUnderStreet(c, t, pod) {
    if (pod === "signal") { if (t % 90 < 4) px(c, HATCH.x + 2, HATCH.y + 2, 1, 1, "#ffb347"); return; }
    if (pod !== "open") return;
    c.save(); c.globalAlpha = 0.28 + Math.sin(t / 14) * 0.08; c.strokeStyle = "#ffb347"; c.lineWidth = 1; c.setLineDash([2, 2]);
    tunnels(c); c.restore();
    // właz: schody w dół i ciepłe światło latarni
    px(c, HATCH.x - 1, HATCH.y - 1, 8, 7, "#2a1d10");
    for (var i = 0; i < 4; i++) px(c, HATCH.x, HATCH.y + i, 6 - i, 1, i % 2 ? "#5a3a1a" : "#8a5a2a");
    c.save(); c.globalAlpha = 0.35 + Math.sin(t / 9) * 0.15; px(c, HATCH.x - 3, HATCH.y - 3, 12, 11, "#ffb347"); c.restore();
    px(c, HATCH.x + 5, HATCH.y + 1, 1, 1, (t % 40) < 30 ? "#fff0b0" : "#ffb347");
  }
  function drawUnderNet(c, t, pod, route) {
    if (pod === "hidden") return;
    var b = UNDER_BOX, R = rng(t >> 2);
    c.save();
    c.globalAlpha = pod === "open" ? 0.92 : 0.55 + Math.sin(t / 6) * 0.3;
    px(c, b[0], b[1], b[2], b[3], "#000000");
    for (var k = 0; k < 60; k++) px(c, b[0] + R() * b[2], b[1] + R() * b[3], 1, 1, R() < 0.5 ? "#1a1f2a" : "#3a4256");
    c.restore();
    if (pod === "signal") {
      if (t % 30 < 18) { // migocze znak zapytania z czerwonych pikseli
        var q = [".##.", "#..#", "...#", "..#.", "....", "..#."];
        q.forEach(function (row, y) { for (var x = 0; x < 4; x++) if (row[x] === "#") px(c, HATCH.x - 8 + x * 2, HATCH.y - 30 + y * 2, 2, 2, "#ff003c"); });
      }
      return;
    }
    c.save(); c.strokeStyle = "#ffb347"; c.lineWidth = 1; c.globalAlpha = 0.9; c.setLineDash([3, 2]); c.lineDashOffset = -t / 3;
    c.strokeRect(b[0] + 0.5, b[1] + 0.5, b[2] - 1, b[3] - 1);
    c.setLineDash([]); c.globalAlpha = 0.6; tunnels(c);
    c.restore();
    if (route) { // ostatni odcinek trasy kursu: z Wrotkowa pod Rynek
      c.save(); c.strokeStyle = "#ffb347"; c.globalAlpha = 0.85; c.setLineDash([4, 3]); c.lineDashOffset = -t / 2;
      c.beginPath(); c.moveTo(D["10"].cx, D["10"].cy); c.lineTo(HATCH.x + 3, HATCH.y + 2); c.stroke(); c.restore();
    }
    c.save(); c.globalAlpha = 0.35; px(c, HATCH.x - 1, HATCH.y - 1, 9, 9, "#ffb347"); c.restore();
    px(c, HATCH.x + 2, HATCH.y + 1, 3, 3, "#fff0b0");
  }

  function mount(canvas, opts) {
    opts = opts || {};
    var pod = podState(opts.podziemia);
    var states = {};
    (opts.districts || []).forEach(function (d) { states[d.nr] = d.state; });
    var R = rng(2049);
    var grid = buildGrid();
    var A = makeAnim();
    var base = document.createElement("canvas"); base.width = W; base.height = H;
    var bctx = base.getContext("2d");
    drawStatic(bctx, grid, R, A);
    drawFog(bctx, states, rng(7));

    var buf = document.createElement("canvas"); buf.width = W; buf.height = H;
    var c = buf.getContext("2d");
    var out = canvas.getContext("2d");
    var focus = opts.focus && D[opts.focus] ? D[opts.focus] : (opts.focus === "P" ? { cx: HATCH.x + 3, cy: HATCH.y - 8 } : null);
    var mode = opts.mode === "siec" ? "siec" : "ulica";
    var baseNet = null;
    var radar = !!(opts.radar && focus);
    var view = { x: 0, y: 0, w: W, h: H };
    if (focus && !radar) {
      var vw = 176, vh = 99;
      view = { x: Math.max(0, Math.min(W - vw, focus.cx - vw / 2)), y: Math.max(0, Math.min(H - vh, focus.cy - vh / 2)), w: vw, h: vh };
    }
    if (radar) { canvas.width = 132; canvas.height = 132; } else { canvas.width = view.w; canvas.height = view.h; }
    out.imageSmoothingEnabled = false;

    var cars = [], LN = lanes(), RR = rng(99);
    LN.forEach(function (l) {
      var n = l.max ? 2 : 4;
      for (var i = 0; i < n; i++) cars.push({ l: l, p: RR() * (l.h ? (l.max || W) : H), v: 0.25 + RR() * 0.45,
        col: ["#c0c6d4", "#7a2030", "#2c5a8a", "#d8d8d8", "#c9a227", "#3a3a44", "#8a3ad8"][Math.floor(RR() * 7)] });
    });
    var rain = []; for (var r = 0; r < 170; r++) rain.push([RR() * W, RR() * H, 0.9 + RR() * 0.8]);
    var spinners = [{ x: -10, y: 60, vx: 0.55, vy: 0.08 }, { x: W + 10, y: 200, vx: -0.42, vy: -0.12 }];
    var particles = [];

    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var t = 0, last = 0, running = true;
    // ekrany dotykowe (telefony, tablety): ok. 15 klatek na sekundę zamiast 30, mniej pracy dla baterii
    var MINDT = (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) ? 66 : 33;

    var rafId = 0;
    function plan() { if (!rafId && !reduce) rafId = requestAnimationFrame(function (t) { rafId = 0; frame(t); }); }   // jedna pętla, bez dublowania po powrocie do karty
    function frame(now) {
      if (!running) return;
      plan();
      if (now && now - last < MINDT) return;
      last = now || 0; t++;
      if (mode === "siec") { netFrame(); blit(); return; }
      c.drawImage(base, 0, 0);

      // neony: migotanie
      A.neons.forEach(function (n, i) { if (((t + i * 37) % 211) < 3 && (i % 5 === 0)) px(c, n[0], n[1], n[2], n[3], n[5]); });
      // światła na dachach
      A.beacons.forEach(function (b) { if (((t + b[2]) % 60) < 20) px(c, b[0], b[1], 1, 1, "#ff3048"); });
      // 01 skaner
      if (A.scanner) { var sy = A.scanner.y + (t % 24 < 12 ? t % 12 : 12 - (t % 12)); c.save(); c.globalAlpha = 0.8; px(c, A.scanner.x, sy, 1, 1, "#ff2a3a"); c.globalAlpha = 0.35; px(c, A.scanner.x - 6, sy, 12, 1, "#ff2a3a"); c.restore(); }
      // 02 koło zębate
      A.gears.forEach(function (g) { var a = t / 10; px(c, g[0] + Math.cos(a) * 3, g[1] + Math.sin(a) * 3, 1, 1, "#fff0c0"); });
      // 03 diody, wentylatory, para
      A.leds.forEach(function (l) { var on = ((t * 0.2 + l[2] * 40) % 7) < 4; px(c, l[0], l[1], 1, 1, on ? "#05d9e8" : "#0b4a52"); });
      A.fans.forEach(function (f) { var a = t / 3 + f[2]; px(c, f[0] + Math.cos(a) * 3, f[1] + Math.sin(a) * 3, 1, 1, "#9aa4b8"); px(c, f[0] - Math.cos(a) * 3, f[1] - Math.sin(a) * 3, 1, 1, "#9aa4b8"); });
      // 04 taśmociąg
      if (A.conveyor) for (var k = 0; k < A.conveyor.w; k += 6) px(c, A.conveyor.x + ((k + t) % A.conveyor.w), A.conveyor.y, 2, 1, "#9cff57");
      // 05 ekrany i tłum
      A.screens.forEach(function (s, i) {
        var phase = Math.floor((t / 18 + s[4] * 10)) % 4;
        var cols = [["#ff2a6d", "#3b0a1e"], ["#05d9e8", "#04313a"], ["#f9f002", "#3a3800"], ["#ffffff", "#2a2a3a"]][phase];
        px(c, s[0], s[1], s[2], s[3], cols[1]);
        for (var q = 0; q < 5; q++) px(c, s[0] + 1 + ((q * 3 + t / 4 + i) % (s[2] - 3)), s[1] + 1 + (q % 3) * 2, 2, 1, cols[0]);
      });
      A.crowd.forEach(function (p) { px(c, p[0] + Math.sin(t / 20 + p[2]) * 1.5, p[1] + Math.cos(t / 25 + p[2]), 1, 1, "#c8b8e8"); });
      // 06 lampiony i hologram
      A.lanterns.forEach(function (l) { if (((t + l[2] * 7) % 40) < 34) { c.save(); c.globalAlpha = 0.4; px(c, l[0] - 1, l[1] - 1, 3, 3, "#ff3a3a"); c.restore(); px(c, l[0], l[1], 1, 1, "#ff8a6a"); } });
      if (A.holo) { var hr = 4 + Math.sin(t / 8) * 2; c.save(); c.globalAlpha = 0.5 + Math.sin(t / 5) * 0.2; ring(c, A.holo.x, A.holo.y, hr, "#05d9e8"); ring(c, A.holo.x, A.holo.y, hr + 3, "#ff4fd8"); c.restore(); }
      // 07 gwiazdy
      A.stars.forEach(function (s, i) { if (((t / 4 + i) | 0) % 12 !== 0) px(c, s[0], s[1], 1, 1, "#ffd23a"); });
      // 08 radiowozy
      A.police.forEach(function (p, i) { var on = ((t / 5 | 0) + i) % 2; px(c, p[0], p[1], 1, 1, on ? "#ff2a3a" : "#2a6aff"); px(c, p[0] + 2, p[1], 1, 1, on ? "#2a6aff" : "#ff2a3a"); c.save(); c.globalAlpha = 0.25; px(c, p[0] - 2, p[1] - 2, 7, 5, on ? "#ff2a3a" : "#2a6aff"); c.restore(); });
      // 09 reflektory piramidy
      if (A.pyramid) {
        c.save(); c.globalAlpha = 0.13; c.fillStyle = "#ffe08a";
        for (var b = 0; b < 2; b++) {
          var a0 = t / 70 + b * Math.PI;
          c.beginPath(); c.moveTo(A.pyramid.x, A.pyramid.y);
          c.lineTo(A.pyramid.x + Math.cos(a0 - 0.08) * 160, A.pyramid.y + Math.sin(a0 - 0.08) * 160);
          c.lineTo(A.pyramid.x + Math.cos(a0 + 0.08) * 160, A.pyramid.y + Math.sin(a0 + 0.08) * 160);
          c.closePath(); c.fill();
        }
        c.restore();
        px(c, A.pyramid.x - 1, A.pyramid.y - 1, 2, 2, (t % 30) < 15 ? "#ffffff" : "#ffcf6a");
      }
      // 10 łodzie, dźwigi
      A.boats.forEach(function (bt) {
        bt.t = (bt.t + bt.s + 1) % 1;
        var p = riverPoint(bt.t), q = riverPoint(bt.t + (bt.s > 0 ? 0.01 : -0.01));
        var bx = p[0] * T, by = p[1] * T, dx = q[0] - p[0], dy = q[1] - p[1], n = Math.hypot(dx, dy) || 1;
        px(c, bx - 2, by - 1, 4, 3, "#3a3a44"); px(c, bx + dx / n * 3, by + dy / n * 3, 1, 1, "#fff6c2");
        c.save(); c.globalAlpha = 0.3; px(c, bx - dx / n * 5, by - dy / n * 5, 2, 1, "#9ad0ff"); c.restore();
      });
      A.cranes.forEach(function (k, i) { var x = k[0] - 8 + ((t / 6 + i * 20) % 22); px(c, x, k[1] - 13, 1, 4, "#c0c0c0"); });
      // dym i para
      if (t % 4 === 0) {
        A.smoke.forEach(function (s) { particles.push({ x: s[0], y: s[1], vx: 0.15, vy: -0.25, life: 70, col: "#6a6a72" }); });
        A.steam.forEach(function (s) { particles.push({ x: s[0], y: s[1], vx: 0.1, vy: -0.2, life: 50, col: "#b8c8d8" }); });
      }
      particles = particles.filter(function (p) { return p.life > 0; });
      particles.forEach(function (p) { p.x += p.vx; p.y += p.vy; p.life--; c.save(); c.globalAlpha = p.life / 140; px(c, p.x, p.y, 2, 2, p.col); c.restore(); });

      // samochody
      cars.forEach(function (cr) {
        var l = cr.l, len = l.h ? (l.max || W) : H;
        cr.p = (cr.p + cr.v * l.dir + len) % len;
        if (l.h) {
          var x = cr.p, y = l.y; px(c, x, y, 4, 2, cr.col);
          if (l.dir > 0) { px(c, x + 4, y, 1, 2, "#fff6c2"); c.save(); c.globalAlpha = 0.18; px(c, x + 5, y - 1, 5, 4, "#fff6c2"); c.restore(); px(c, x - 1, y, 1, 2, "#ff2a3a"); }
          else { px(c, x - 1, y, 1, 2, "#fff6c2"); c.save(); c.globalAlpha = 0.18; px(c, x - 6, y - 1, 5, 4, "#fff6c2"); c.restore(); px(c, x + 4, y, 1, 2, "#ff2a3a"); }
        } else {
          var x2 = l.x, y2 = cr.p; px(c, x2, y2, 2, 4, cr.col);
          if (l.dir > 0) { px(c, x2, y2 + 4, 2, 1, "#fff6c2"); c.save(); c.globalAlpha = 0.18; px(c, x2 - 1, y2 + 5, 4, 5, "#fff6c2"); c.restore(); px(c, x2, y2 - 1, 2, 1, "#ff2a3a"); }
          else { px(c, x2, y2 - 1, 2, 1, "#fff6c2"); c.save(); c.globalAlpha = 0.18; px(c, x2 - 1, y2 - 6, 4, 5, "#fff6c2"); c.restore(); px(c, x2, y2 + 4, 2, 1, "#ff2a3a"); }
        }
      });

      // latające pojazdy (spinnery) z cieniem
      spinners.forEach(function (s, i) {
        s.x += s.vx; s.y += s.vy;
        if (s.x > W + 20 || s.x < -20) { s.x = s.vx > 0 ? -15 : W + 15; s.y = 30 + RR() * (H - 60); }
        c.save(); c.globalAlpha = 0.35; px(c, s.x + 8, s.y + 9, 6, 3, "#000"); c.restore();
        px(c, s.x, s.y, 6, 3, "#2a2e3a"); px(c, s.x + 1, s.y, 4, 1, "#5a6070");
        px(c, s.x + (s.vx > 0 ? 6 : -1), s.y + 1, 1, 1, (t + i * 7) % 16 < 8 ? "#05d9e8" : "#ff2a6d");
      });

      drawUnderStreet(c, t, pod);
      if (ctrl && ctrl.onDraw) ctrl.onDraw(c, t, "ulica");
      nextFrameRect();

      // deszcz
      c.save(); c.globalAlpha = 0.32; c.fillStyle = "#9ec8ff";
      rain.forEach(function (d) { d[0] += 0.6 * d[2]; d[1] += 2.6 * d[2]; if (d[1] > H) { d[1] = -4; d[0] = RR() * W; } if (d[0] > W) d[0] = 0; c.fillRect(d[0] | 0, d[1] | 0, 1, 3); });
      c.restore();

      blit();
    }

    function nextFrameRect() {
      Object.keys(states).forEach(function (k) {
        if (states[k] !== "next" || !D[k]) return;
        var z = D[k].zone, pad = 2 + ((t / 6) % 4);
        c.save(); c.globalAlpha = 0.9; c.strokeStyle = "#fcee0a"; c.setLineDash([3, 3]); c.lineDashOffset = -t / 2;
        c.strokeRect(z[0] * T - pad, z[1] * T - pad, z[2] * T + pad * 2, z[3] * T + pad * 2); c.restore();
      });
    }

    function netFrame() {
      if (!baseNet) { baseNet = document.createElement("canvas"); baseNet.width = W; baseNet.height = H; drawNet(baseNet.getContext("2d"), grid, A, states, rng(11)); }
      c.drawImage(baseNet, 0, 0);
      // trasa kursu: świetlna linia przez kolejne dzielnice
      var pts = ORDER.map(function (k) { return [D[k].cx, D[k].cy, states[k] || "past"]; });
      c.save(); c.lineWidth = 1;
      for (var i = 1; i < pts.length; i++) {
        var a = pts[i - 1], b = pts[i];
        if (b[2] === "future") { c.globalAlpha = 0.18; c.strokeStyle = "#ff003c"; c.setLineDash([2, 4]); }
        else if (b[2] === "next") { c.globalAlpha = 0.95; c.strokeStyle = "#fcee0a"; c.setLineDash([4, 3]); c.lineDashOffset = -t / 2; }
        else { c.globalAlpha = 0.75; c.strokeStyle = "#00f0ff"; c.setLineDash([]); }
        c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
      }
      c.restore();
      // impuls biegnący po odwiedzonej części trasy
      var lastIdx = 0; pts.forEach(function (p, i) { if (p[2] !== "future") lastIdx = i; });
      if (lastIdx > 0) {
        var f = (t % 160) / 160 * lastIdx, i0 = Math.floor(f), fr = f - i0, A0 = pts[i0], B0 = pts[Math.min(i0 + 1, lastIdx)];
        var x = A0[0] + (B0[0] - A0[0]) * fr, y = A0[1] + (B0[1] - A0[1]) * fr;
        c.save(); c.globalAlpha = 0.35; px(c, x - 3, y - 3, 7, 7, "#00f0ff"); c.restore(); px(c, x - 1, y - 1, 3, 3, "#ffffff");
      }
      pts.forEach(function (p) { px(c, p[0] - 1, p[1] - 1, 3, 3, p[2] === "future" ? "#5a0016" : "#ffffff"); });
      // pakiety danych w strumieniach
      cars.forEach(function (cr) {
        var l = cr.l, len = l.h ? (l.max || W) : H;
        cr.p = (cr.p + cr.v * 1.6 * l.dir + len) % len;
        var x = l.h ? cr.p : (l.x - 1), y = l.h ? (l.y - 1) : cr.p;
        var col = l.dir > 0 ? "#00f0ff" : "#ff2a6d";
        c.save(); c.globalAlpha = 0.35;
        if (l.h) px(c, x - 6 * l.dir, y, 6, 1, col); else px(c, x, y - 6 * l.dir, 1, 6, col);
        c.restore(); px(c, x, y, 2, 2, col);
      });
      // przemiatanie skanera
      var sx = (t * 2) % (W + 40) - 20;
      c.save(); c.globalAlpha = 0.07; px(c, sx, 0, 3, H, "#7df9ff"); c.restore();
      drawUnderNet(c, t, pod, (states["10"] || "past") === "past");
      if (ctrl && ctrl.onDraw) ctrl.onDraw(c, t, "siec");
      nextFrameRect();
    }

    function blit() {
      if (radar) {
        var S = canvas.width, R0 = 56, cx = focus.cx, cy = focus.cy;
        out.clearRect(0, 0, S, S);
        out.save(); out.beginPath(); out.arc(S / 2, S / 2, S / 2 - 3, 0, Math.PI * 2); out.clip();
        out.fillStyle = "#05060b"; out.fillRect(0, 0, S, S);
        out.drawImage(buf, cx - R0, cy - R0, R0 * 2, R0 * 2, 0, 0, S, S);
        out.restore();
        out.save(); out.strokeStyle = "rgba(255,255,255,0.85)"; out.lineWidth = 3;
        out.beginPath(); out.arc(S / 2, S / 2, S / 2 - 3, 0, Math.PI * 2); out.stroke(); out.restore();
        // strzałka gracza i północ
        out.save(); out.translate(S / 2, S / 2); out.fillStyle = "#fcee0a"; out.strokeStyle = "#000"; out.lineWidth = 1;
        out.beginPath(); out.moveTo(0, -7); out.lineTo(5, 6); out.lineTo(0, 3); out.lineTo(-5, 6); out.closePath(); out.fill(); out.stroke(); out.restore();
        out.save(); out.fillStyle = "#ffffff"; out.strokeStyle = "#000"; out.lineWidth = 3; out.font = "bold 12px 'Chakra Petch', sans-serif";
        out.textAlign = "center"; out.strokeText("N", S / 2, 15); out.fillText("N", S / 2, 15); out.restore();
        return;
      }
      out.clearRect(0, 0, view.w, view.h);
      out.drawImage(buf, view.x, view.y, view.w, view.h, 0, 0, view.w, view.h);
    }
    frame(0);

    // zatrzymanie, gdy karta jest w tle (oszczędność baterii)
    // oraz gdy mapa jest przewinięta poza ekran
    var tabHidden = false, offscreen = false;
    function setRunning() {
      if (tabHidden || offscreen) running = false;
      else if (!running) { running = true; plan(); }
    }
    document.addEventListener("visibilitychange", function () { tabHidden = document.hidden; setRunning(); });
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { offscreen = !es[0].isIntersecting; setRunning(); }).observe(canvas);
    var ctrl = {
      view: view, districts: D, T: T, W: W, H: H,
      setMode: function (m) { mode = m === "siec" ? "siec" : "ulica"; if (reduce) frame(0); },
      setPod: function (p) { pod = p; if (reduce) frame(0); },
      getMode: function () { return mode; },
      // punkty zaczepienia dla eksploracja.js
      grid: grid, tiles: { ROAD: ROAD, WATER: WATER, LOT: LOT }, hatch: HATCH, zoneOf: zoneOf, states: states,
      onDraw: null,
      render: function () { if (reduce) frame(0); },
      reduce: reduce
    };
    canvas._city = ctrl;
    return ctrl;
  }

  // pozycje etykiet w procentach (dla znaczników HTML nad mapą)
  // znacznik nad górną krawędzią dzielnicy, żeby nie zasłaniał charakterystycznego budynku
  function labelPos(nr) {
    var d = D[nr]; if (!d) return null;
    var left = d.cx / W * 100, top = d.zone[1] * T / H * 100;
    return { left: Math.max(9, Math.min(91, left)), top: Math.max(4, Math.min(96, top)) };
  }
  function flavor() {
    return FLAVOR.map(function (f) { return { name: f[0], left: f[1] / TW * 100, top: f[2] / TH * 100 }; })
      .concat([{ name: "Bystrzyca", left: 55 / TW * 100, top: 31.6 / TH * 100, river: true }]);
  }

  // ------------------------------------------------------------- ikony przedmiotów (12×12)
  var ICONS = {
    "01": ["............", "..########..", "..#......#..", "..#.YYYY.#..", "..#......#..", "..#.####.#..", "..#......#..", "..#.##.#.#..", "..#......#..", "..########..", "............", "............"],
    "02": ["............", "...O....O...", "...OOOOOO...", "..OWWOOWWO..", "..OWKOOWKO..", "..OOOYYOOO..", "...OOOOOO...", "...OOOOOO...", "....OOOO....", "....Y..Y....", "............", "............"],
    "03": ["............", "...CCC......", "..C...C.....", "..C...C.....", "...CCC......", "....C.......", "....C.......", "....CCC.....", "....C.......", "....CC......", "............", "............"],
    "04": ["............", ".##########.", ".#WW.......#", ".#WW.YYYY..#", ".#WW.......#", ".#...YYYYY.#", ".#.........#", ".##########.", "............", "............", "............", "............"],
    "05": ["............", "...MMMM.....", "..M....M....", ".M..CC..M...", ".M..CC..M...", "..M....M....", "...MMMM.....", ".......M....", "........M...", ".........M..", "............", "............"],
    "06": ["............", ".CCCCCCCCC..", ".C.......C..", ".C.MM.YY.C..", ".C.......C..", ".CCCCCCCCC..", "...C........", "..C.........", "............", "............", "............", "............"],
    "07": ["............", "....RRRR....", "...R....R...", "..R..YY..R..", "..R.YYYY.R..", "..R..YY..R..", "...R....R...", "....RRRR....", ".....RR.....", "....RRRR....", "............", "............"],
    "08": ["............", ".....Y......", "..YYYYYYYY..", "..Y..Y...Y..", ".YYY.Y..YYY.", "......Y.....", ".....Y......", ".....Y......", "...YYYYY....", "............", "............", "............"],
    "09": ["............", "....CCCC....", "...C....C...", "..C...M..C..", "..C..M...C..", "..C.Y....C..", "...C....C...", "....CCCC....", "............", "............", "............", "............"],
    "10": ["............", "....GG......", "..GGGGGG....", "..G....G....", "..G.YY.G....", "..G.YY.G....", "..G....G....", "..G.YY.G....", "..G....G....", "..GGGGGG....", "............", "............"]
  };
  ICONS.P = ["............", ".....##.....", "....#..#....", "...######...", "...#AAAA#...", "...#ALLA#...", "...#ALLA#...", "...#AAAA#...", "...######...", "....####....", "............", "............"];
  var PAL = { "#": "#c8d0e0", ".": null, A: "#ffb347", L: "#fff0b0", Y: "#f9f002", O: "#b07a3a", W: "#f0f0f0", K: "#111", C: "#05d9e8", M: "#ff2a6d", R: "#ff4f4f", G: "#9cff57" };
  function icon(canvas, nr, on) {
    var g = ICONS[nr]; if (!g) return;
    canvas.width = 12; canvas.height = 12; var c = canvas.getContext("2d");
    for (var y = 0; y < 12; y++) for (var x = 0; x < 12; x++) {
      var col = PAL[g[y][x]]; if (!col) continue;
      c.fillStyle = on ? col : "#4a5068"; c.fillRect(x, y, 1, 1);
    }
  }

  window.NeoLublin = { mount: mount, labelPos: labelPos, icon: icon, flavor: flavor, districts: D };

  // automatyczne podpięcie
  document.addEventListener("DOMContentLoaded", function () {
    var dataEl = document.getElementById("city-data");
    var data = dataEl ? JSON.parse(dataEl.textContent) : { districts: [] };
    document.querySelectorAll("canvas[data-city]").forEach(function (cv) {
      mount(cv, { districts: data.districts, focus: cv.getAttribute("data-focus") || null, podziemia: data.podziemia,
                  mode: cv.getAttribute("data-mode") || "ulica", radar: cv.hasAttribute("data-radar") });
    });
    function podUI() {
      var st = podState(data.podziemia);
      document.querySelectorAll("canvas[data-city]").forEach(function (cv) { if (cv._city) cv._city.setPod(st); });
      document.querySelectorAll(".city-marker[data-pod]").forEach(function (m) {
        m.style.left = (HATCH.x + 3) / W * 100 + "%"; m.style.top = (UNDER_BOX[1] + UNDER_BOX[3] + 9) / H * 100 + "%";
        m.hidden = st === "hidden";
        m.classList.toggle("signal", st === "signal");
        m.querySelector(".n").textContent = st === "open" ? "11" : "??";
        m.querySelector(".label").textContent = st === "open" ? "PODZIEMIA" : "SYGNAŁ";
        m.setAttribute("aria-label", st === "open" ? "11: Podziemia Starego Miasta, Archiwum Trybunału" : "Nieznany sygnał spod Starego Miasta");
      });
      document.querySelectorAll("[data-pod]:not(.city-marker)").forEach(function (el) { el.hidden = st !== "open"; });
    }
    podUI();
    document.addEventListener("neo:podziemia", podUI);
    // zaliczone dzielnice: znacznik ✓ na mapie
    var zal = Postep.zaliczone();
    document.querySelectorAll(".city-marker[data-nr]").forEach(function (m) {
      if (zal.indexOf(m.getAttribute("data-nr")) < 0) return;
      m.classList.add("zal");
      var l = m.querySelector(".label"); if (l && !/✓/.test(l.textContent)) l.textContent += " ✓";
      m.setAttribute("aria-label", (m.getAttribute("aria-label") || "") + " Zaliczona.");
    });
    // eksploracja (mapa główna) i świat podziemny (strona podziemi): osobne pliki, dołączane tutaj
    function load(src, css) {
      if (css) { var l = document.createElement("link"); l.rel = "stylesheet"; l.href = BASE + css; document.head.appendChild(l); }
      var s = document.createElement("script"); s.src = BASE + src; document.body.appendChild(s);
    }
    if (document.getElementById("city-main")) load("eksploracja.js", "eksploracja.css");
    if (document.getElementById("pod-tresc")) load("stare_miasto.js", "eksploracja.css");
    document.querySelectorAll("canvas[data-icon]").forEach(function (cv) { icon(cv, cv.getAttribute("data-icon"), cv.hasAttribute("data-on")); });
    document.querySelectorAll(".city-marker[data-nr]").forEach(function (m) {
      var p = labelPos(m.getAttribute("data-nr")); if (!p) return;
      m.style.left = p.left + "%"; m.style.top = p.top + "%";
    });
    document.querySelectorAll(".city-map").forEach(function (box) {
      flavor().forEach(function (f) {
        var s = document.createElement("span");
        s.className = "city-flavor" + (f.river ? " river" : ""); s.textContent = f.name; s.setAttribute("aria-hidden", "true");
        s.style.left = f.left + "%"; s.style.top = f.top + "%"; box.appendChild(s);
      });
    });
  });
})();
