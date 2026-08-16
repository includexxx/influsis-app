"""One-off script: rasterize the raw SVG icon exports for the Order Deliver
screen (Figma "Order Deliver", nodes 6040:8590 / 6574:6219 / 6040:8664 - the
3rd being the in-place "Order Details" tab) into PNGs, same approach as
scripts/rasterize-icons.py (expo-image does not render SVG). Run once after
extracting the SVG assets, then the .svg sources are discarded.

The screen's other icons are reused rather than re-extracted: the back
chevron and "Order details" header match every other `(details)` screen's
`ScreenHeader`, and the delivery-success state's green checkmark badge
reuses the existing `assets/images/icons/success-check.png` (Figma exports
the identical `vuesax/bold/tick-square` glyph SuccessSheet already uses).

`tracker-check.svg` is just the white tick glyph (no circle) - StepTracker
composites it onto a plain pink `View` circle in code rather than a
pre-flattened asset, the same "colored View + icon" approach SuccessSheet's
own badge uses. `tracker-incomplete.svg` is the opposite: Figma exports it
as one already-flattened black-circle-plus-white-dot asset, used as-is.
"""

import os
import resvg_py

DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "images")

# 4x native point size for retina sharpness, matching every other icon
# extraction in this project. The two timeline icons and the two tracker
# step icons render at 24-26px on screen; the clip glyph at 16x16 (inside a
# 20x20 tap target).
JOBS = [
    ("order-details/activity-place-order.svg", "order-details/activity-place-order.png", 104, 104),
    ("order-details/activity-order-started.svg", "order-details/activity-order-started.png", 104, 104),
    ("order-details/clip.svg", "order-details/clip.png", 64, 64),
    ("order-details/tracker-check.svg", "order-details/tracker-check.png", 96, 96),
    ("order-details/tracker-incomplete.svg", "order-details/tracker-incomplete.png", 96, 96),
]

for svg_rel, png_rel, width, height in JOBS:
    svg_path = os.path.join(DIR, svg_rel)
    png_path = os.path.join(DIR, png_rel)
    data = resvg_py.svg_to_bytes(svg_path=svg_path, width=width, height=height)
    with open(png_path, "wb") as f:
        f.write(bytearray(data))
    os.remove(svg_path)
    print(f"{svg_rel} -> {png_rel} ({width}x{height}, {os.path.getsize(png_path)}B)")
