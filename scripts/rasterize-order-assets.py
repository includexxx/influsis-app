"""One-off script: rasterize the raw SVG icon exports for the Order screen
(Figma "Order_Campaign", nodes 6212:5540/5843/6024, 6403:5508 and the
6366:6730/6574:6415 empty states) into PNGs, same approach as
scripts/rasterize-icons.py (expo-image does not render SVG). Run once after
extracting SVG assets, then the .svg sources are discarded.

The clock icon (OrderCard's due-date footer) is a single flat glyph, handled
the same way every other icon in this project is. The empty-state's package
glyph (OrderIllustration), unlike every other icon extraction so far, is a
genuinely multi-colored composite - 7 separately-filled Figma vector layers
(back panel, two box faces, lid, two tape-fold marks, a small label) that
can't be flattened to a single-color glyph or reproduced as plain colored
Views the way the illustration's 4 decorative dots are (see
OrderIllustration.tsx) - so this script rasterizes each layer individually
via resvg_py, then alpha-composites them with Pillow at the exact percentage
offsets Figma's own "inset-[...]" layout reports, relative to the 40x40
(scaled 4x to 160x160) "package 1" frame (node 6366:7011).
"""

import os
import resvg_py
from PIL import Image

DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "images")

# (relative svg path, output png path, width px, height px) - 4x native
# point size for retina sharpness, matching every other icon extraction.
ICON_JOBS = [
    ("icons/clock.svg", "icons/clock.png", 80, 80),
]

# Package icon layers: (svg path, x, y, width, height) in a 160x160 canvas
# (40x40 native, scaled 4x) - positions computed from Figma's own
# `inset-[top_right_bottom_left]` percentages on node 6366:7011's children,
# in the same back-to-front stacking order Figma lists them.
CANVAS = 160
PACKAGE_LAYERS = [
    ("order/package-back.svg", 12, 0, 137, 160),
    ("order/package-face-right.svg", 80, 36, 68, 124),
    ("order/package-face-left.svg", 12, 36, 68, 124),
    ("order/package-lid.svg", 36, 12, 84, 57),
    ("order/package-tape1.svg", 90, 119, 22, 18),
    ("order/package-tape2.svg", 90, 136, 14, 14),
    ("order/package-label.svg", 36, 48, 16, 22),
]

for svg_rel, png_rel, width, height in ICON_JOBS:
    svg_path = os.path.join(DIR, svg_rel)
    png_path = os.path.join(DIR, png_rel)
    data = resvg_py.svg_to_bytes(svg_path=svg_path, width=width, height=height)
    with open(png_path, "wb") as f:
        f.write(bytearray(data))
    os.remove(svg_path)
    print(f"{svg_rel} -> {png_rel} ({width}x{height}, {os.path.getsize(png_path)}B)")

canvas = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
for svg_rel, x, y, w, h in PACKAGE_LAYERS:
    svg_path = os.path.join(DIR, svg_rel)
    data = resvg_py.svg_to_bytes(svg_path=svg_path, width=w, height=h)
    layer = Image.open(__import__("io").BytesIO(bytearray(data))).convert("RGBA")
    canvas.alpha_composite(layer, (x, y))
    os.remove(svg_path)

package_png = os.path.join(DIR, "order/package-icon.png")
canvas.save(package_png)
print(f"order/package-*.svg (7 layers) -> order/package-icon.png ({CANVAS}x{CANVAS}, {os.path.getsize(package_png)}B)")
