"""One-off script: rasterize the raw SVG icon exports for the Notifications
screen (Figma node 6346:5575) into PNGs, same approach as
scripts/rasterize-icons.py (expo-image does not render SVG). Run once after
extracting SVG assets, then the .svg sources are discarded.
"""

import os
import resvg_py

DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "images")

# 24pt icons scaled 4x for retina sharpness, matching icons/back-chevron.png.
JOBS = [
    ("notifications/money-tick.svg", "notifications/money-tick.png", 96, 96),
    ("notifications/wallet.svg", "notifications/wallet.png", 96, 96),
]

for svg_rel, png_rel, width, height in JOBS:
    svg_path = os.path.join(DIR, svg_rel)
    png_path = os.path.join(DIR, png_rel)
    data = resvg_py.svg_to_bytes(svg_path=svg_path, width=width, height=height)
    with open(png_path, "wb") as f:
        f.write(bytearray(data))
    os.remove(svg_path)
    print(f"{svg_rel} -> {png_rel} ({width}x{height}, {os.path.getsize(png_path)}B)")
