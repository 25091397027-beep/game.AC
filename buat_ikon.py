#!/usr/bin/env python3
"""
Pembuat ikon Cicaww33 (PWA).

Pemakaian:
  python3 buat_ikon.py                      -> ikon bawaan (payung + hujan)
  python3 buat_ikon.py gambarku.png         -> ikon dari gambarmu sendiri
  python3 buat_ikon.py gambarku.png --bg "#162033" --zoom 1.1

Hasil ditulis ke folder ../icons (ganti file lama, lalu upload ulang ke hosting).
Butuh: pip install pillow
"""
import argparse, os, sys
from PIL import Image, ImageDraw, ImageFilter

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "icons")

def hex2rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))

def gradient_bg(size, top="#2d4066", bottom="#111827"):
    t, b = hex2rgb(top), hex2rgb(bottom)
    img = Image.new("RGB", (size, size))
    px = img.load()
    for y in range(size):
        k = y / (size - 1)
        c = tuple(int(t[i] * (1 - k) + b[i] * k) for i in range(3))
        for x in range(size):
            px[x, y] = c
    return img

def draw_default_art(size=2048):
    """Payung biru + hujan + matahari pagi, digambar transparan di kanvas persegi."""
    u = size / 1024.0
    S = lambda v: int(v * u)
    art = Image.new("RGBA", (size, size), (0, 0, 0, 0))

    # cahaya pagi hangat (kanan atas)
    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    g = ImageDraw.Draw(glow)
    for r, a in ((190, 30), (140, 50), (100, 80)):
        g.ellipse([S(790 - r), S(230 - r), S(790 + r), S(230 + r)], fill=(244, 197, 122, a))
    glow = glow.filter(ImageFilter.GaussianBlur(S(14)))
    art = Image.alpha_composite(art, glow)

    d = ImageDraw.Draw(art)
    d.ellipse([S(790 - 62), S(230 - 62), S(790 + 62), S(230 + 62)], fill=(244, 197, 122, 255))

    # payung
    cx, cy, R = 512, 540, 300
    c1, c2 = (155, 188, 224, 255), (125, 163, 209, 255)
    for k in range(6):
        d.pieslice([S(cx - R), S(cy - R), S(cx + R), S(cy + R)], 180 + k * 30, 210 + k * 30, fill=c1 if k % 2 == 0 else c2)
    rr = R / 6
    for j in range(6):
        x = cx - R + (2 * j + 1) * rr
        d.ellipse([S(x - rr), S(cy - rr), S(x + rr), S(cy + rr)], fill=(140, 175, 216, 255))
    # tulang payung (garis halus)
    for k in range(1, 6):
        import math
        ang = math.radians(180 + k * 30)
        d.line([S(cx), S(cy - 4), S(cx + R * 0.97 * math.cos(ang)), S(cy + R * 0.97 * math.sin(ang))], fill=(36, 49, 72, 90), width=S(5))
    d.ellipse([S(cx - 20), S(cy - R - 28), S(cx + 20), S(cy - R + 12)], fill=(244, 197, 122, 255))

    # gagang
    cream = (255, 243, 220, 255)
    yb = cy + 300
    d.rounded_rectangle([S(cx - 12), S(cy), S(cx + 12), S(yb)], radius=S(10), fill=cream)
    d.arc([S(cx - 96), S(yb - 48), S(cx), S(yb + 48)], 0, 180, fill=cream, width=S(24))

    # hujan
    drop = (203, 227, 250, 230)
    for (x, y, l) in [(150, 300, 70), (240, 420, 60), (120, 560, 74), (230, 700, 64), (330, 800, 58),
                      (870, 430, 68), (800, 590, 62), (900, 720, 72), (720, 800, 60), (610, 880, 56), (410, 900, 62)]:
        d.line([S(x), S(y), S(x - l * 0.28), S(y + l)], fill=drop, width=S(15))
        d.ellipse([S(x - 7), S(y - 7), S(x + 7), S(y + 7)], fill=drop)
    return art

def art_from_image(path, zoom=1.0, size=2048):
    im = Image.open(path).convert("RGBA")
    w, h = im.size
    side = min(w, h) / max(zoom, 0.1)
    l, t = (w - side) / 2, (h - side) / 2
    return im.crop((int(l), int(t), int(l + side), int(t + side))).resize((size, size), Image.LANCZOS)

def compose(art, size, bg, scale, rounded, from_photo):
    """scale = bagian kanvas yang dipakai karya (maskable butuh area aman ~0.8)."""
    base = gradient_bg(size, *bg) if isinstance(bg, tuple) and len(bg) == 2 else Image.new("RGB", (size, size), hex2rgb(bg))
    base = base.convert("RGBA")
    if from_photo and scale >= 0.999:
        base = art.resize((size, size), Image.LANCZOS)
    else:
        a = art.resize((max(1, int(size * scale)), max(1, int(size * scale))), Image.LANCZOS)
        off = (size - a.size[0]) // 2
        base.alpha_composite(a, (off, off))
    if rounded:
        mask = Image.new("L", (size * 4, size * 4), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, size * 4 - 1, size * 4 - 1], radius=int(size * 4 * 0.2237), fill=255)
        mask = mask.resize((size, size), Image.LANCZOS)
        base.putalpha(mask)
    return base

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("gambar", nargs="?", help="gambar sumber (png/jpg/webp); kosongkan untuk ikon bawaan")
    ap.add_argument("--bg", default=None, help="warna latar hex, mis. #162033")
    ap.add_argument("--zoom", type=float, default=1.0)
    a = ap.parse_args()

    from_photo = bool(a.gambar)
    art = art_from_image(a.gambar, a.zoom) if from_photo else draw_default_art()
    bg = a.bg if a.bg else (("#2d4066", "#111827") if not from_photo else "#162033")
    if isinstance(bg, tuple):
        pass
    os.makedirs(OUT, exist_ok=True)

    def save(name, size, scale, rounded):
        img = compose(art, size, bg, scale, rounded, from_photo)
        img.save(os.path.join(OUT, name), "PNG", optimize=True)
        print("tulis", name, size)

    full = 1.0 if from_photo else 0.94
    save("icon-512.png", 512, full, True)
    save("icon-192.png", 192, full, True)
    save("icon-maskable-512.png", 512, 0.74 if not from_photo else 0.78, False)
    save("apple-touch-icon.png", 180, full, False)
    save("favicon-32.png", 32, 1.0 if from_photo else 0.98, True)

if __name__ == "__main__":
    main()
