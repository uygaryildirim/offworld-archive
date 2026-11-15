#!/usr/bin/env python3
"""Create a compact, local visible-star catalogue from HYG v4.1 (J2000)."""
import csv
import io
import json
import math
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = "https://raw.githubusercontent.com/astronexus/HYG-Database/master/hyg/CURRENT/hygdata_v41.csv"
TARGET = ROOT / "assets" / "stars.js"

csv_bytes = subprocess.run(["curl", "--fail", "--silent", "--show-error", "--location", SOURCE], check=True, capture_output=True, timeout=90).stdout
reader = csv.DictReader(io.TextIOWrapper(io.BytesIO(csv_bytes), encoding="utf-8"))
stars = []
for row in reader:
    try:
        ra = float(row["ra"]) * 15.0  # HYG right ascension is in hours.
        dec = float(row["dec"])
        magnitude = float(row["mag"])
        color = float(row.get("ci") or 0.0)
    except (TypeError, ValueError):
        continue
    if not all(map(math.isfinite, (ra, dec, magnitude, color))) or magnitude > 6.0:
        continue
    item = [round(ra % 360, 3), round(dec, 3), round(magnitude, 2), round(color, 2)]
    name = (row.get("proper") or "").strip()
    if name and magnitude <= 2.5:
        item.append(name)
    stars.append(item)

TARGET.parent.mkdir(parents=True, exist_ok=True)
TARGET.write_text("window.OA_STAR_CATALOG=" + json.dumps(stars, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
print(f"Wrote {len(stars)} stars to {TARGET.relative_to(ROOT)}")
