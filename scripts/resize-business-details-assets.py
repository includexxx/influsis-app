"""One-off script: downscale + JPEG-compress the raw Figma photo exports for
the Business Details screen (Figma node 6001:37719) in
assets/images/business-details/, same approach as
scripts/resize-profile-assets.py.
"""

import os
from PIL import Image

DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "images", "business-details")

# filename -> max(width, height) cap in px
TARGETS = {
    "banner.png": 900,
    "avatar.png": 300,
}

for fname, cap in TARGETS.items():
    src = os.path.join(DIR, fname)
    im = Image.open(src)
    if im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info):
        im = im.convert("RGBA")
        flattened = Image.new("RGB", im.size, "white")
        flattened.paste(im, mask=im.split()[-1])
        im = flattened
    else:
        im = im.convert("RGB")
    w, h = im.size
    scale = cap / max(w, h)
    if scale < 1:
        im = im.resize((max(1, round(w * scale)), max(1, round(h * scale))), Image.LANCZOS)
    dst = os.path.join(DIR, fname.replace(".png", ".jpg"))
    im.save(dst, "JPEG", quality=85, optimize=True)
    os.remove(src)
    print(f"{fname}: {w}x{h} -> {im.size[0]}x{im.size[1]}, {os.path.getsize(dst)//1024}KB -> {dst}")
