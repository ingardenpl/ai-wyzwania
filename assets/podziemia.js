/* NEO-LUBLIN 2049: zamek włazu do Podziemi Starego Miasta.
   Do dnia odkrycia treść strony jest zaszyfrowana kodem podawanym na ostatnich zajęciach
   (build.py: SHA-256, klucz z kodu po wielokrotnym haszowaniu, strumień XOR, skrót kontrolny).
   Kod wpisany raz zostaje w przeglądarce, a mapa pokazuje wtedy wejście do podziemi.
   Bez zależności; działa także bez HTTPS (własne SHA-256 zamiast WebCrypto). */
(function () {
  "use strict";

  // ------------------------------------------------------------- SHA-256
  var K = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2]);
  var Wb = new Uint32Array(64);
  function sha256(bytes) {
    var l = bytes.length, n = ((l + 9 + 63) >> 6) << 6, m = new Uint8Array(n);
    m.set(bytes); m[l] = 0x80;
    var bits = l * 8; m[n - 4] = bits >>> 24; m[n - 3] = (bits >>> 16) & 255; m[n - 2] = (bits >>> 8) & 255; m[n - 1] = bits & 255;
    var h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a, h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
    for (var o = 0; o < n; o += 64) {
      for (var i = 0; i < 16; i++) Wb[i] = (m[o + i * 4] << 24) | (m[o + i * 4 + 1] << 16) | (m[o + i * 4 + 2] << 8) | m[o + i * 4 + 3];
      for (i = 16; i < 64; i++) {
        var a = Wb[i - 15], b = Wb[i - 2];
        var s0 = ((a >>> 7) | (a << 25)) ^ ((a >>> 18) | (a << 14)) ^ (a >>> 3);
        var s1 = ((b >>> 17) | (b << 15)) ^ ((b >>> 19) | (b << 13)) ^ (b >>> 10);
        Wb[i] = (Wb[i - 16] + s0 + Wb[i - 7] + s1) | 0;
      }
      var A = h0, B = h1, C = h2, D = h3, E = h4, F = h5, G = h6, H = h7;
      for (i = 0; i < 64; i++) {
        var S1 = ((E >>> 6) | (E << 26)) ^ ((E >>> 11) | (E << 21)) ^ ((E >>> 25) | (E << 7));
        var t1 = (H + S1 + ((E & F) ^ (~E & G)) + K[i] + Wb[i]) | 0;
        var S0 = ((A >>> 2) | (A << 30)) ^ ((A >>> 13) | (A << 19)) ^ ((A >>> 22) | (A << 10));
        var t2 = (S0 + ((A & B) ^ (A & C) ^ (B & C))) | 0;
        H = G; G = F; F = E; E = (D + t1) | 0; D = C; C = B; B = A; A = (t1 + t2) | 0;
      }
      h0 = (h0 + A) | 0; h1 = (h1 + B) | 0; h2 = (h2 + C) | 0; h3 = (h3 + D) | 0;
      h4 = (h4 + E) | 0; h5 = (h5 + F) | 0; h6 = (h6 + G) | 0; h7 = (h7 + H) | 0;
    }
    var out = new Uint8Array(32), hs = [h0, h1, h2, h3, h4, h5, h6, h7];
    for (i = 0; i < 8; i++) { out[i * 4] = hs[i] >>> 24; out[i * 4 + 1] = (hs[i] >>> 16) & 255; out[i * 4 + 2] = (hs[i] >>> 8) & 255; out[i * 4 + 3] = hs[i] & 255; }
    return out;
  }
  function cat(a, b) { var r = new Uint8Array(a.length + b.length); r.set(a); r.set(b, a.length); return r; }
  function hex(b) { var s = ""; for (var i = 0; i < b.length; i++) s += (b[i] < 16 ? "0" : "") + b[i].toString(16); return s; }
  function utf8(s) { return new TextEncoder().encode(s); }
  function b64(s) { var bin = atob(s), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; }

  // ------------------------------------------------------------- klucz i odszyfrowanie (zgodne z build.py)
  function norm(code) {
    return (code || "").toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/Ł/g, "L").replace(/[^A-Z0-9]/g, "");
  }
  function derive(code, salt, iter) {
    var k = sha256(cat(salt, utf8(norm(code))));
    for (var i = 0; i < iter; i++) k = sha256(cat(k, salt));
    return k;
  }
  function decrypt(data, code) {
    var salt = b64(data.salt), k = derive(code, salt, data.iter);
    if (hex(sha256(cat(k, utf8("ok")))).slice(0, 16) !== data.check) return null;
    var ct = b64(data.ct), pt = new Uint8Array(ct.length), ctr = new Uint8Array(4);
    for (var o = 0, blk = 0; o < ct.length; o += 32, blk++) {
      ctr[0] = blk >>> 24; ctr[1] = (blk >>> 16) & 255; ctr[2] = (blk >>> 8) & 255; ctr[3] = blk & 255;
      var ks = sha256(cat(k, ctr));
      for (var j = 0; j < 32 && o + j < ct.length; j++) pt[o + j] = ct[o + j] ^ ks[j];
    }
    return new TextDecoder().decode(pt);
  }

  var KEY_CODE = "neo-podziemia-kod", KEY_OPEN = "neo-podziemia";
  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function load(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

  function open(html, box, lock) {
    box.innerHTML = html;
    box.hidden = false;
    if (lock) lock.hidden = true;
    store(KEY_OPEN, "1");
    document.documentElement.classList.add("pod-open");
    document.dispatchEvent(new Event("neo:podziemia"));
  }

  document.addEventListener("DOMContentLoaded", function () {
    var box = document.getElementById("pod-tresc");
    var lock = document.getElementById("pod-zamek");
    var dataEl = document.getElementById("pod-szyfr");
    if (!box) return;
    if (!dataEl) { store(KEY_OPEN, "1"); document.documentElement.classList.add("pod-open"); return; } // treść już jawna
    var data = JSON.parse(dataEl.textContent);
    var saved = load(KEY_CODE);
    if (saved) {
      var html0 = decrypt(data, saved);
      if (html0) { open(html0, box, lock); return; }
    }
    if (!lock) return;
    lock.hidden = false;
    var form = lock.querySelector("form"), inp = lock.querySelector("input"), msg = lock.querySelector("[data-msg]");
    var tries = 0;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      msg.textContent = "SPRAWDZAM KOD…";
      setTimeout(function () {
        var html = decrypt(data, inp.value);
        if (html) {
          store(KEY_CODE, inp.value);
          msg.textContent = "WŁAZ OTWARTY.";
          if (window.NeoUI) window.NeoUI.banner("STREFA CISZY", "ZDOBYTO: LATARNIA");
          open(html, box, lock);
          var h = box.querySelector("h2"); if (h) { h.setAttribute("tabindex", "-1"); h.focus(); }
        } else {
          tries++;
          msg.textContent = tries < 3 ? "KOD NIEPRAWIDŁOWY. ZAMEK NIE DRGNĄŁ." : "KOD NIEPRAWIDŁOWY. KOD PODAJE ARCHIWISTKA NA OSTATNIM SPOTKANIU.";
          inp.select();
        }
      }, 30);
    });
  });

  window.NeoPodziemia = { sha256: function (s) { return hex(sha256(utf8(s))); }, norm: norm };
})();
