"""One-off script: rasterize the raw SVG icon exports for the Account /
Profile settings screens (Figma "Account" node 6001:38957 and its
Profile/Security Settings/Change Password/Privacy Policy/Help Center
sub-screens) into PNGs, same approach as scripts/rasterize-icons.py
(expo-image does not render SVG). Run once after extracting SVG assets,
then the .svg sources are discarded.
"""

import os
import resvg_py

DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "images")

# 4x native point size for retina sharpness, matching every other icon
# extraction in this project. All these icons are 24x24pt in Figma except
# `close` (16x16pt, the logout popup's dismiss button).
JOBS = [
    ("account/profile.svg", "account/profile.png", 96, 96),
    ("account/security.svg", "account/security.png", 96, 96),
    ("account/billing.svg", "account/billing.png", 96, 96),
    ("account/help-center.svg", "account/help-center.png", 96, 96),
    ("account/privacy-lock.svg", "account/privacy-lock.png", 96, 96),
    ("account/logout.svg", "account/logout.png", 96, 96),
    ("account/security-key.svg", "account/security-key.png", 96, 96),
    ("account/email-notification.svg", "account/email-notification.png", 96, 96),
    ("account/faceid.svg", "account/faceid.png", 96, 96),
    ("account/account-recovery.svg", "account/account-recovery.png", 96, 96),
    ("account/close.svg", "account/close.png", 64, 64),
    ("account/calendar.svg", "account/calendar.png", 96, 96),
    ("account/chevron-down.svg", "account/chevron-down.png", 96, 96),
]

for svg_rel, png_rel, width, height in JOBS:
    svg_path = os.path.join(DIR, svg_rel)
    png_path = os.path.join(DIR, png_rel)
    data = resvg_py.svg_to_bytes(svg_path=svg_path, width=width, height=height)
    with open(png_path, "wb") as f:
        f.write(bytearray(data))
    os.remove(svg_path)
    print(f"{svg_rel} -> {png_rel} ({width}x{height}, {os.path.getsize(png_path)}B)")
