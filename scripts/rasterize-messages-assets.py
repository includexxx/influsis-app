"""One-off script: rasterize the raw SVG icon exports for the Messages tab
and its chat detail screen (Figma nodes 6279:8097, 6366:6416, 6279:8211),
same approach as scripts/rasterize-search-assets.py (expo-image does not
render SVG).

Two kinds of job here:

1. Plain single-SVG icons (paperclip, send) - rasterized 1:1 at 4x.

2. Composites. Figma exports a deeply nested illustration/icon as one SVG
   per leaf vector, each positioned by a percentage inset on its parent.
   `COMPOSITES` re-assembles those leaves onto a single transparent canvas
   using the exact insets Figma reports, so the app gets one flat PNG
   instead of 14 stacked <Image> layers:

     - messages/no-message.png  - the yellow chat-bubble + red badge glyph
       at the center of the "No Message Found" empty state (Figma node
       6366:6688, a 41x41 frame). Its surrounding circles (gray disc, white
       lens, four decorative dots) are plain Views in
       MessageIllustration.tsx, not part of this raster - same split
       SearchIllustration/rasterize-search-assets.py already uses.
     - messages/happy-emoji.png - the composer's emoji glyph (Figma node
       6279:8261), whose two eyes are separate vectors from the face.

Run once after extracting SVG assets; the .svg sources are then discarded.
"""

import io
import os
import resvg_py
from PIL import Image

DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "images")
SCALE = 4  # 4x for retina sharpness, same as the other rasterize scripts

# (svg, png, native_width, native_height)
JOBS = [
    ("messages/paperclip.svg", "messages/paperclip.png", 22, 22),
    ("messages/send.svg", "messages/send.png", 28, 28),
]

# png -> (canvas_w, canvas_h, [(svg, x, y, w, h), ...]) in native px,
# painted back-to-front.
COMPOSITES = {
    "messages/no-message.png": (
        41,
        41,
        [
            ("messages/src/bubble-back.svg", 0.000, 13.526, 28.905, 27.360),
            ("messages/src/bubble-back-shade.svg", 14.453, 13.526, 14.453, 19.420),
            ("messages/src/bubble-line-2a.svg", 4.481, 24.256, 20.020, 2.404),
            ("messages/src/bubble-line-2b.svg", 14.453, 24.256, 10.048, 2.404),
            ("messages/src/bubble-line-1a.svg", 4.481, 19.450, 16.023, 2.404),
            ("messages/src/bubble-line-1b.svg", 14.453, 19.450, 6.051, 2.404),
            ("messages/src/bubble-front.svg", 19.299, 4.957, 16.837, 24.182),
            ("messages/src/bubble-front-shade.svg", 27.708, 4.957, 8.409, 24.182),
            ("messages/src/bubble-front-line-a.svg", 25.346, 9.766, 3.602, 7.202),
            ("messages/src/bubble-front-line-b.svg", 27.708, 9.766, 1.241, 7.202),
            ("messages/src/badge-tail-a.svg", 26.511, 0.152, 2.404, 3.690),
            ("messages/src/badge-tail-b.svg", 27.708, 0.152, 1.207, 3.690),
            ("messages/src/badge-dot.svg", 17.901, 3.711, 3.313, 3.313),
            ("messages/src/badge-rays.svg", 34.194, 3.723, 6.806, 19.590),
        ],
    ),
    "messages/happy-emoji.png": (
        22,
        22,
        [
            ("messages/src/emoji-face.svg", 0.000, 0.000, 22.000, 22.000),
            ("messages/src/emoji-eye-left.svg", 6.417, 7.333, 3.337, 0.688),
            ("messages/src/emoji-eye-right.svg", 12.247, 7.333, 3.337, 0.688),
        ],
    ),
}


def rasterize(svg_rel, width, height):
    """Rasterize one SVG to a PIL RGBA image at SCALE x the given box."""
    data = resvg_py.svg_to_bytes(
        svg_path=os.path.join(DIR, svg_rel),
        width=max(1, round(width * SCALE)),
        height=max(1, round(height * SCALE)),
    )
    return Image.open(io.BytesIO(bytearray(data))).convert("RGBA")


for svg_rel, png_rel, width, height in JOBS:
    svg_path = os.path.join(DIR, svg_rel)
    png_path = os.path.join(DIR, png_rel)
    data = resvg_py.svg_to_bytes(
        svg_path=svg_path, width=width * SCALE, height=height * SCALE
    )
    with open(png_path, "wb") as f:
        f.write(bytearray(data))
    os.remove(svg_path)
    print(f"{svg_rel} -> {png_rel} ({width * SCALE}x{height * SCALE}, {os.path.getsize(png_path)}B)")

for png_rel, (canvas_w, canvas_h, layers) in COMPOSITES.items():
    canvas = Image.new("RGBA", (canvas_w * SCALE, canvas_h * SCALE), (0, 0, 0, 0))
    for svg_rel, x, y, w, h in layers:
        layer = rasterize(svg_rel, w, h)
        canvas.alpha_composite(layer, (round(x * SCALE), round(y * SCALE)))
    png_path = os.path.join(DIR, png_rel)
    canvas.save(png_path)
    for svg_rel, *_ in layers:
        os.remove(os.path.join(DIR, svg_rel))
    print(
        f"{len(layers)} layers -> {png_rel} "
        f"({canvas_w * SCALE}x{canvas_h * SCALE}, {os.path.getsize(png_path)}B)"
    )

src_dir = os.path.join(DIR, "messages", "src")
if os.path.isdir(src_dir) and not os.listdir(src_dir):
    os.rmdir(src_dir)
