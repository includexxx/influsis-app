"""One-off script: rasterize the raw SVG exports for the Balance screen
(Figma node 6402:5295) into PNGs, same approach as scripts/rasterize-icons.py
(expo-image does not render SVG). Run once after extracting the SVG assets,
then the .svg sources are discarded.

Each target is ~4x its on-screen display size, matching every other icon
extraction's retina convention in this project. The sparkline is the
exception - it is wide artwork rather than a glyph, rasterized at 3x its
366x75 frame.

The back chevron is not extracted here: ScreenHeader's existing
assets/images/icons/back-chevron.png already matches.
"""

import os
import resvg_py

DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "images", "withdraw")

# (filename stem, output width, output height)
JOBS = [
    ("arrow-up", 56, 56),  # 14x14 in the balance card's "3.2%" pill
    ("arrow-right-circle", 96, 96),  # 24x24 balance card trailing arrow
    ("balance-chart", 1098, 225),  # 366x75 sparkline behind the balance
    ("method-mobile-banking", 120, 120),  # 30x30 payment-row leading icons
    ("method-bank-transfer", 120, 120),
    ("method-card", 120, 120),
    ("method-recent-transaction", 120, 120),
    ("chevron-right", 96, 96),  # 24x24 payment-row trailing chevron
]

for stem, width, height in JOBS:
    svg_path = os.path.join(DIR, f"{stem}.svg")
    png_path = os.path.join(DIR, f"{stem}.png")
    data = resvg_py.svg_to_bytes(svg_path=svg_path, width=width, height=height)
    with open(png_path, "wb") as f:
        f.write(bytearray(data))
    os.remove(svg_path)
    print(f"{stem}.svg -> {stem}.png ({width}x{height}, {os.path.getsize(png_path)}B)")
