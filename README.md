# Cicaww33 — A Story Beneath the Rain (versi aplikasi / PWA)

## Isi folder
- `index.html` — game (sudah berisi perbaikan suara untuk HP)
- `manifest.webmanifest` — data aplikasi (nama, warna, ikon)
- `sw.js` — service worker (agar bisa offline setelah dibuka sekali)
- `icons/` — ikon aplikasi (192, 512, maskable, apple-touch, favicon)
- `tools/buat_ikon.py` — pembuat ikon dari gambarmu

## Cara agar bisa diinstal siapa saja
Aplikasi hanya bisa diinstal dari alamat **HTTPS** (bukan file yang dibuka langsung).
1. Unggah SELURUH isi folder ini ke hosting gratis: Netlify Drop (drag & drop folder), GitHub Pages, atau Cloudflare Pages.
2. Bagikan alamat webnya.
3. Android/Chrome: tombol **📲 Pasang Aplikasi** muncul di menu utama (atau menu ⋮ → Instal aplikasi).
4. iPhone/iPad (Safari): Bagikan → **Tambah ke Layar Utama**.
Buka pertama kali butuh internet; setelah itu bisa offline.

## Mengganti gambar ikon
- **Di dalam game:** Pengaturan → *Aplikasi & Ikon* → pilih gambar, atur zoom & warna latar. Ikon tab langsung berubah; ikon layar utama berubah setelah aplikasi dihapus lalu dipasang ulang. (Pengaturan ini tersimpan per perangkat.)
- **Untuk semua pemain (permanen):** jalankan `python3 tools/buat_ikon.py gambarmu.png --bg "#162033" --zoom 1.1` (butuh Pillow), atau timpa file di `icons/` dengan PNG ukuran yang sama. Lalu naikkan `VERSION` di `sw.js` (mis. `cicaww33-v2`) sebelum mengunggah ulang.

## Suara di HP
Browser HP memblokir suara sampai layar disentuh. Game kini membuka suara otomatis pada sentuhan pertama, dan menampilkan tombol "Ketuk layar untuk menyalakan suara" bila masih terkunci. Di iPhone, suara tetap terdengar walau tombol silent aktif. Jika ada musik tidak terdengar, cek volume media dan pengaturan Audio di game.
