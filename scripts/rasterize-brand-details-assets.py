"""One-off script: rasterize the raw SVG icon export for the Brand Details
screen (Figma node 6001:37719) into a PNG, same approach as
scripts/rasterize-profile-assets.py (expo-image does not render SVG). Run
once after extracting the SVG asset, then the .svg source is discarded.
"""

import os
import resvg_py

DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "images")

# 4x native point size for retina sharpness, matching every other icon
# extraction in this project.
JOBS = [
    ("brand-details/globe.svg", "brand-details/globe.png", 64, 64),
]

for svg_rel, png_rel, width, height in JOBS:
    svg_path = os.path.join(DIR, svg_rel)
    png_path = os.path.join(DIR, png_rel)
    data = resvg_py.svg_to_bytes(svg_path=svg_path, width=width, height=height)
    with open(png_path, "wb") as f:
        f.write(bytearray(data))
    os.remove(svg_path)
    print(f"{svg_rel} -> {png_rel} ({width}x{height}, {os.path.getsize(png_path)}B)")
