"""One-off script: rasterize the raw SVG icon export for the Order Details
screen (Figma node 6040:8515) into a PNG, same approach as
scripts/rasterize-icons.py (expo-image does not render SVG). Run once after
extracting the SVG asset, then the .svg source is discarded.

The screen's other two icons are reused rather than re-extracted: the back
chevron matches ScreenHeader's existing `assets/images/icons/back-chevron.png`,
and the pink "verified" badge next to the business name is pixel-identical to
the existing `assets/images/home/verified-badge.png` (same scalloped-circle
glyph, same #F42E9E fill). Only the "Deliverable" list's outlined
check-in-circle icon has no existing match in this project.
"""

import os
import resvg_py

DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "images")

# Native size 16.667x16.6667 scaled ~4.8x for retina sharpness, matching
# every other icon extraction's ~4x-of-display-size convention (this glyph
# displays at 20x20 in OrderDetails.tsx).
JOBS = [
    ("order-details/check-circle.svg", "order-details/check-circle.png", 80, 80),
]

for svg_rel, png_rel, width, height in JOBS:
    svg_path = os.path.join(DIR, svg_rel)
    png_path = os.path.join(DIR, png_rel)
    data = resvg_py.svg_to_bytes(svg_path=svg_path, width=width, height=height)
    with open(png_path, "wb") as f:
        f.write(bytearray(data))
    os.remove(svg_path)
    print(f"{svg_rel} -> {png_rel} ({width}x{height}, {os.path.getsize(png_path)}B)")
