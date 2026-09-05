"""One-off script: rasterize the raw SVG icon export for the Search screen's
"No campaign Found" empty state (Figma node 6123:7563), same approach as
scripts/rasterize-icons.py (expo-image does not render SVG). Run once after
extracting SVG assets, then the .svg source is discarded.

The empty-state illustration's plain circles (background disc, white lens
card, four decorative dots) are reproduced as plain Views with a
backgroundColor/borderRadius in SearchIllustration.tsx instead of raster
assets - only the multi-colored megaphone glyph actually needs an image.
"""

import os
import resvg_py

DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "images")

# Native size 41.7996x38.4594 scaled 4x for retina sharpness.
JOBS = [
    ("search/megaphone.svg", "search/megaphone.png", 167, 154),
]

for svg_rel, png_rel, width, height in JOBS:
    svg_path = os.path.join(DIR, svg_rel)
    png_path = os.path.join(DIR, png_rel)
    data = resvg_py.svg_to_bytes(svg_path=svg_path, width=width, height=height)
    with open(png_path, "wb") as f:
        f.write(bytearray(data))
    os.remove(svg_path)
    print(f"{svg_rel} -> {png_rel} ({width}x{height}, {os.path.getsize(png_path)}B)")
