"""One-off script: rasterize the raw SVG icon exports from Figma into PNGs at
2x/3x display density, since expo-image (this project's Image wrapper) does
not render SVG. Run once after extracting SVG assets, then the .svg sources
can be discarded (kept here for now as a reference/re-render source).
"""

import os
import resvg_py

DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "images")

# (relative svg path, output png path, width px, height px) - dimensions
# preserve each icon's native (non-square) aspect ratio, scaled ~4x the
# on-screen point size (icons render at 16-24pt in the designs) for retina
# sharpness. email-detail.svg (a minor secondary fold-line layer on the email
# glyph) is intentionally dropped - email-outline.svg alone reads clearly as
# an envelope and avoids a fiddly 2-layer composite for one small icon.
JOBS = [
    ("icons/arrow-right.svg", "icons/arrow-right.png", 96, 96),
    ("icons/back-chevron.svg", "icons/back-chevron.png", 96, 96),
    ("icons/hide-eye.svg", "icons/hide-eye.png", 73, 62),
    ("icons/alert-error.svg", "icons/alert-error.png", 64, 64),
    ("icons/facebook.svg", "icons/facebook.png", 78, 96),
    ("icons/google.svg", "icons/google.png", 92, 92),
    ("icons/email-outline.svg", "icons/email-outline.png", 92, 51),
    ("icons/logomark.svg", "icons/logomark.png", 256, 256),
    ("onboarding/ellipse-top.svg", "onboarding/ellipse-top.png", 600, 608),
    ("onboarding/ellipse-bottom.svg", "onboarding/ellipse-bottom.png", 600, 608),
    ("icons/success-check.svg", "icons/success-check.png", 204, 204),
]

for svg_rel, png_rel, width, height in JOBS:
    svg_path = os.path.join(DIR, svg_rel)
    png_path = os.path.join(DIR, png_rel)
    data = resvg_py.svg_to_bytes(svg_path=svg_path, width=width, height=height)
    with open(png_path, "wb") as f:
        f.write(bytearray(data))
    os.remove(svg_path)
    print(f"{svg_rel} -> {png_rel} ({width}x{height}, {os.path.getsize(png_path)}B)")

# email-detail.svg is unused (see note above) - remove the raw source too.
unused = os.path.join(DIR, "icons/email-detail.svg")
if os.path.exists(unused):
    os.remove(unused)
    print("icons/email-detail.svg -> removed (unused)")
