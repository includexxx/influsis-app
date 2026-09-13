"""One-off script: downscale + JPEG-compress the raw Figma photo exports in
assets/images/home/ so they're reasonably sized for a mobile bundle, same
approach as scripts/resize-onboarding-assets.py.
"""

import os
from PIL import Image

DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "images", "home")

# filename -> max(width, height) cap in px
TARGETS = {
    "hero-campaign.png": 900,
    "hero-business-avatar.png": 200,
    "business-logo-1.png": 200,
    "business-logo-2.png": 200,
    "business-logo-3.png": 200,
    "business-logo-4.png": 200,
    "business-logo-5.png": 200,
    "popular-campaign-1.png": 400,
    "popular-campaign-2.png": 400,
    "popular-campaign-3.png": 400,
    "campaign-list-1.png": 900,
    "campaign-list-2.png": 900,
    "campaign-list-3.png": 900,
    "campaign-list-4.png": 900,
    "gig-1.png": 800,
    "gig-2.png": 800,
    "creator-1.png": 200,
    "creator-2.png": 200,
    "creator-3.png": 200,
    "creator-4.png": 200,
    "creator-5.png": 200,
}

for fname, cap in TARGETS.items():
    src = os.path.join(DIR, fname)
    if not os.path.exists(src):
        print(f"skip (missing): {fname}")
        continue
    im = Image.open(src).convert("RGB")
    w, h = im.size
    scale = cap / max(w, h)
    if scale < 1:
        im = im.resize((max(1, round(w * scale)), max(1, round(h * scale))), Image.LANCZOS)
    dst = os.path.join(DIR, fname.replace(".png", ".jpg"))
    im.save(dst, "JPEG", quality=82, optimize=True)
    os.remove(src)
    print(f"{fname}: {w}x{h} -> {im.size[0]}x{im.size[1]}, {os.path.getsize(dst)//1024}KB -> {dst}")
