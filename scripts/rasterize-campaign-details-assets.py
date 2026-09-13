"""One-off script: rasterize the raw SVG icon exports for the Campaign
Details screen (Figma node 6001:37641) into PNGs, same approach as
scripts/rasterize-business-details-assets.py (expo-image does not render SVG).
Run once after extracting the SVG assets, then the .svg sources are
discarded.
"""

import os
import resvg_py

DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "images")

# 4x native point size for retina sharpness, matching every other icon
# extraction in this project.
JOBS = [
    ("campaign-details/budget.svg", "campaign-details/budget.png", 80, 80),
    ("campaign-details/duration.svg", "campaign-details/duration.png", 80, 80),
    ("campaign-details/followers.svg", "campaign-details/followers.png", 80, 80),
    ("campaign-details/calendar.svg", "campaign-details/calendar.png", 80, 80),
    ("campaign-details/website.svg", "campaign-details/website.png", 96, 96),
]

for svg_rel, png_rel, width, height in JOBS:
    svg_path = os.path.join(DIR, svg_rel)
    png_path = os.path.join(DIR, png_rel)
    data = resvg_py.svg_to_bytes(svg_path=svg_path, width=width, height=height)
    with open(png_path, "wb") as f:
        f.write(bytearray(data))
    os.remove(svg_path)
    print(f"{svg_rel} -> {png_rel} ({width}x{height}, {os.path.getsize(png_path)}B)")
