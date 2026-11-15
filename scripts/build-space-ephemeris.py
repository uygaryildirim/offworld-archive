#!/usr/bin/env python3
"""Snapshot nearby solar-system vectors from the public JPL Horizons API."""
import concurrent.futures
import datetime as dt
import json
import re
import subprocess
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / "assets" / "space-ephemeris.js"
epoch = dt.datetime.now(dt.timezone.utc).replace(minute=0, second=0, microsecond=0)
time_text = epoch.strftime("%Y-%b-%d %H:%M")
requests = {
    "mars": {"center": "500@499", "objects": {"sun": "10", "mercury": "199", "venus": "299", "earth": "399", "jupiter": "599", "saturn": "699", "uranus": "799", "neptune": "899", "phobos": "401", "deimos": "402"}},
    "moon": {"center": "500@301", "objects": {"sun": "10", "mercury": "199", "venus": "299", "earth": "399", "mars": "499", "jupiter": "599", "saturn": "699", "uranus": "799", "neptune": "899"}},
}

def vector(center, command):
    args = ["curl", "--fail", "--silent", "--show-error", "--location", "--get", "https://ssd.jpl.nasa.gov/api/horizons.api"]
    for key, value in [
        ("format", "json"), ("COMMAND", f"'{command}'"), ("EPHEM_TYPE", "'VECTORS'"),
        ("CENTER", f"'{center}'"), ("TLIST", f"'{time_text}'"), ("OUT_UNITS", "'KM-S'"),
        ("REF_PLANE", "'FRAME'"), ("VEC_TABLE", "'2'"), ("CSV_FORMAT", "'YES'"),
    ]:
        args.extend(["--data-urlencode", f"{key}={value}"])
    last_error = None
    for attempt in range(4):
        try:
            result = subprocess.run(args, check=True, capture_output=True, timeout=60).stdout
            payload = json.loads(result)
            break
        except (subprocess.CalledProcessError, subprocess.TimeoutExpired, json.JSONDecodeError) as error:
            last_error = error
            if attempt == 3:
                detail = getattr(error, "stderr", b"")
                raise RuntimeError(f"Horizons request failed for {command} at {center}: {detail[-500:].decode(errors='replace') if isinstance(detail, bytes) else detail}") from error
            time.sleep(1.5 * (attempt + 1))
    result = payload.get("result", "")
    match = re.search(r"\$\$SOE\s*([\s\S]*?)\$\$EOE", result)
    if not match:
        raise RuntimeError(payload.get("error") or f"No vector returned for {command} / {center}")
    fields = [part.strip() for part in match.group(1).strip().splitlines()[0].split(",")]
    return [float(value) for value in fields[2:8]]

jobs = {}
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
    for world, group in requests.items():
        for name, command in group["objects"].items():
            jobs[(world, name)] = pool.submit(vector, group["center"], command)

data = {"epoch": epoch.isoformat(timespec="minutes"), "source": "NASA/JPL Horizons", "units": "km, km/s", "worlds": {}}
for (world, name), job in jobs.items():
    data["worlds"].setdefault(world, {})[name] = job.result()

TARGET.parent.mkdir(parents=True, exist_ok=True)
TARGET.write_text("window.OA_SPACE_EPHEMERIS=" + json.dumps(data, separators=(",", ":")) + ";\n", encoding="utf-8")
print(f"Wrote JPL vectors for {sum(len(v) for v in data['worlds'].values())} objects at {data['epoch']} to {TARGET.relative_to(ROOT)}")
