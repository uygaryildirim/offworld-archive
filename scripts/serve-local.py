#!/usr/bin/env python3
"""Serve the static archive on loopback while refusing hidden project files."""
import argparse
import http.server
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]


class SafeHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        path = unquote(urlsplit(self.path).path)
        if any(part.startswith(".") for part in Path(path).parts):
            self.send_error(404)
            return
        super().do_GET()

    def do_HEAD(self):
        path = unquote(urlsplit(self.path).path)
        if any(part.startswith(".") for part in Path(path).parts):
            self.send_error(404)
            return
        super().do_HEAD()

    def list_directory(self, path):
        self.send_error(403, "Directory listing is disabled")
        return None


parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--port", type=int, default=4173)
args = parser.parse_args()
server = http.server.ThreadingHTTPServer(("127.0.0.1", args.port), SafeHandler)
print(f"Offworld Archive: http://127.0.0.1:{args.port}/ (loopback only)", flush=True)
server.serve_forever()
