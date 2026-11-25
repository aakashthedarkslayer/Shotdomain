"""Static file server that disables caching, so screenshots never show a stale build.

Usage: python3 -I nocache_server.py <directory> <port>
"""
import functools
import http.server
import sys


class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, *args):
        pass


if __name__ == "__main__":
    directory, port = sys.argv[1], int(sys.argv[2])
    handler = functools.partial(NoCache, directory=directory)
    http.server.ThreadingHTTPServer(("127.0.0.1", port), handler).serve_forever()
