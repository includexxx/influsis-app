"""One-off script: rasterize the raw SVG icon exports for the Top
Influencers screen (Figma node 6028:7456) into PNGs, same approach as
scripts/rasterize-icons.py (expo-image does not render SVG). Run once after
extracting SVG assets, then the .svg sources are discarded.
"""

import os
import resvg_py

DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "images")

# 4x native point size for retina sharpness, matching every other icon
# extraction in this project.
JOBS = [
    ("influencers/verified-check.svg", "influencers/verified-check.png", 50, 48),
    ("influencers/star.svg", "influencers/star.png", 64, 64),
    ("influencers/location-pin.svg", "influencers/location-pin.png", 80, 80),
]

for svg_rel, png_rel, width, height in JOBS:
    svg_path = os.path.join(DIR, svg_rel)
    png_path = os.path.join(DIR, png_rel)
    data = resvg_py.svg_to_bytes(svg_path=svg_path, width=width, height=height)
    with open(png_path, "wb") as f:
        f.write(bytearray(data))
    os.remove(svg_path)
    print(f"{svg_rel} -> {png_rel} ({width}x{height}, {os.path.getsize(png_path)}B)")
