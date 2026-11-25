/* ===== PWA: pasang aplikasi + ikon yang bisa diatur ===== */
(function () {
  "use strict";
  const KEY = "cicaww33_app_icon_v1";
  const $ = (id) => document.getElementById(id);
  const isStandalone = () => matchMedia("(display-mode: standalone)").matches || matchMedia("(display-mode: fullscreen)").matches || navigator.standalone === true;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const secure = window.isSecureContext && /^https?:$/.test(location.protocol);
  const toast = (m, t) => { try { Toast.show(m, t || "info", 3500); } catch (_) {} };
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch (_) { return null; } };
  const save = (o) => { try { localStorage.setItem(KEY, JSON.stringify(o)); return true; } catch (_) { return false; } };

  /* ---------- gambar ikon ---------- */
  let srcImg = null; // HTMLImageElement | null
  function draw(size, opt) {
    const c = document.createElement("canvas"); c.width = c.height = size;
    const g = c.getContext("2d");
    const r = opt.maskable ? 0 : size * 0.22;
    g.fillStyle = opt.bg; g.beginPath();
    if (g.roundRect && r) g.roundRect(0, 0, size, size, r); else g.rect(0, 0, size, size);
    g.fill();
    if (srcImg) {
      const safe = opt.maskable ? 0.8 : 1;
      const box = size * safe * opt.zoom;
      const k = Math.max(box / srcImg.width, box / srcImg.height) * (opt.cover ? 1 : 0) || Math.min(box / srcImg.width, box / srcImg.height);
      const w = srcImg.width * k, h = srcImg.height * k;
      g.save();
      if (!opt.maskable) { g.beginPath(); if (g.roundRect) g.roundRect(0, 0, size, size, r); else g.rect(0, 0, size, size); g.clip(); }
      g.drawImage(srcImg, (size - w) / 2, (size - h) / 2, w, h);
      g.restore();
    }
    return c;
  }
  const state = { bg: "#162033", zoom: 1, data: null };

  function renderPreview() {
    const cv = $("icon-preview"); if (!cv) return;
    const g = cv.getContext("2d"); g.clearRect(0, 0, 128, 128);
    if (srcImg) g.drawImage(draw(128, { bg: state.bg, zoom: state.zoom }), 0, 0);
    else { const d = new Image(); d.onload = () => g.drawImage(d, 0, 0, 128, 128); d.src = "icons/icon-192.png"; }
  }

  function setLink(id, rel, href, extra) {
    let el = $(id);
    if (!el) { el = document.createElement("link"); el.id = id; el.rel = rel; document.head.appendChild(el); }
    el.href = href; if (extra) Object.assign(el, extra);
  }

  function applyCustom() {
    const o = { bg: state.bg, zoom: state.zoom };
    const png = (n, m) => draw(n, { ...o, maskable: !!m }).toDataURL("image/png");
    const i192 = png(192), i512 = png(512), im512 = png(512, true), apple = png(180), fav = png(32);
    setLink("pwa-apple-icon", "apple-touch-icon", apple);
    setLink("pwa-favicon", "icon", fav);
    const abs = new URL("./", location.href).href;
    const manifest = {
      id: "cicaww33-a-story-beneath-the-rain", name: "Cicaww33 — A Story Beneath the Rain", short_name: "Cicaww33",
      lang: "id", start_url: abs, scope: abs, display: "standalone", display_override: ["fullscreen", "standalone"],
      orientation: "any", background_color: state.bg, theme_color: state.bg,
      icons: [
        { src: i192, sizes: "192x192", type: "image/png", purpose: "any" },
        { src: i512, sizes: "512x512", type: "image/png", purpose: "any" },
        { src: im512, sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(manifest)], { type: "application/manifest+json" }));
    setLink("pwa-manifest", "manifest", url);
  }

  function resetDefault() {
    try { localStorage.removeItem(KEY); } catch (_) {}
    srcImg = null; state.bg = "#162033"; state.zoom = 1; state.data = null;
    setLink("pwa-apple-icon", "apple-touch-icon", "icons/apple-touch-icon.png");
    setLink("pwa-favicon", "icon", "icons/favicon-32.png");
    setLink("pwa-manifest", "manifest", "manifest.webmanifest");
    syncUI(); renderPreview();
  }

  function syncUI() { if ($("icon-zoom")) { $("icon-zoom").value = state.zoom; $("icon-bg").value = state.bg; } }

  function persistAndApply() {
    if (!srcImg || !state.data) return;
    save({ data: state.data, bg: state.bg, zoom: state.zoom });
    applyCustom();
  }

  function pickFile(file) {
    if (!file) return;
    const fr = new FileReader();
    fr.onload = () => {
      const im = new Image();
      im.onload = () => {
        const m = 768, k = Math.min(1, m / Math.max(im.width, im.height));
        const c = document.createElement("canvas"); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
        c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
        state.data = c.toDataURL(file.type === "image/png" ? "image/png" : "image/jpeg", 0.9);
        const im2 = new Image(); im2.onload = () => { srcImg = im2; renderPreview(); persistAndApply(); toast("Ikon diperbarui. Pasang ulang aplikasi agar ikon layar utama berubah."); }; im2.src = state.data;
      };
      im.onerror = () => toast("File gambar tidak bisa dibaca.");
      im.src = fr.result;
    };
    fr.readAsDataURL(file);
  }

  /* ---------- install ---------- */
  let deferred = null;
  function refreshButtons() {
    const show = !isStandalone();
    ["btn-install-app", "btn-install-app-2"].forEach((id) => { const b = $(id); if (b) b.classList.toggle("hidden", !show); });
  }
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferred = e; refreshButtons(); });
  window.addEventListener("appinstalled", () => { deferred = null; refreshButtons(); toast("Aplikasi terpasang 🎉", "success"); });

  async function install() {
    if (deferred) {
      deferred.prompt();
      try { await deferred.userChoice; } catch (_) {}
      deferred = null; return;
    }
    let msg;
    if (location.protocol === "file:") msg = "Game sedang dibuka dari file lokal. Agar bisa diinstal, unggah seluruh folder ke hosting HTTPS (Netlify, GitHub Pages, Cloudflare Pages) lalu buka alamat webnya.";
    else if (!secure) msg = "Instalasi butuh koneksi aman (HTTPS). Buka game lewat alamat https://.";
    else if (isIOS) msg = "iPhone/iPad (Safari): ketuk tombol Bagikan (kotak dengan panah ke atas) → gulir → 'Tambah ke Layar Utama' → Tambah.";
    else msg = "Buka menu browser (⋮) lalu pilih 'Instal aplikasi' atau 'Tambahkan ke layar utama'. Jika tidak ada, buka lewat Chrome/Edge/Safari.";
    ConfirmModal.open({ tag: "Pasang Aplikasi", title: "Cara memasang", message: msg, confirmText: "Mengerti", onConfirm() {} });
  }

  /* ---------- service worker ---------- */
  function registerSW() {
    if (!("serviceWorker" in navigator) || !(secure && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1"))) return;
    navigator.serviceWorker.register("sw.js").then((reg) => {
      reg.addEventListener("updatefound", () => {
        const w = reg.installing; if (!w) return;
        w.addEventListener("statechange", () => {
          if (w.state === "installed" && navigator.serviceWorker.controller) toast("Versi baru tersedia — muat ulang untuk memperbarui.", "success");
        });
      });
    }).catch((e) => console.warn("SW gagal:", e));
  }

  function init() {
    const saved = load();
    if (saved && saved.data) {
      state.bg = saved.bg || state.bg; state.zoom = +saved.zoom || 1; state.data = saved.data;
      const im = new Image(); im.onload = () => { srcImg = im; syncUI(); renderPreview(); applyCustom(); }; im.src = saved.data;
    } else { renderPreview(); }
    syncUI(); refreshButtons();
    $("btn-install-app")?.addEventListener("click", install);
    $("btn-install-app-2")?.addEventListener("click", install);
    $("btn-icon-pick")?.addEventListener("click", () => $("icon-file").click());
    $("icon-file")?.addEventListener("change", (e) => { pickFile(e.target.files[0]); e.target.value = ""; });
    $("btn-icon-reset")?.addEventListener("click", () => { resetDefault(); toast("Ikon dikembalikan ke bawaan."); });
    let t;
    const upd = () => { state.zoom = +$("icon-zoom").value; state.bg = $("icon-bg").value; renderPreview(); clearTimeout(t); t = setTimeout(persistAndApply, 250); };
    $("icon-zoom")?.addEventListener("input", upd);
    $("icon-bg")?.addEventListener("input", upd);
    registerSW();
  }
  if (document.readyState === "complete") init(); else window.addEventListener("load", init);
})();
