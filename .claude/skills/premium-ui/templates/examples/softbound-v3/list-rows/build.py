"""Inline index.html's local <script src="src/..."> into one self-contained page.
Usage: python3 build.py OUT.html [--local]
  default : Artifact form (no doctype/head; the Artifact host adds them)
  --local : a standalone file that opens directly in a browser"""
import re, sys, pathlib
here = pathlib.Path(__file__).parent
html = (here / "index.html").read_text()

def inline(m):
    src = m.group(1)
    if src.startswith(("http:", "https:")):
        return m.group(0)
    return "<script>\n" + (here / src).read_text() + "\n</script>"

out = re.sub(r'<script\s+src="([^"]+)"\s*>\s*</script>', inline, html)
assert not re.search(r'<script\s+src="(?!https?:)', out), "a local script was not inlined"
if "--local" not in sys.argv:  # strip the skeleton the Artifact host will add
    out = re.sub(r"(?is)^\s*<!doctype[^>]*>", "", out)
    out = re.sub(r"(?is)</?(html|body)[^>]*>", "", out)
    out = re.sub(r"(?is)<head>(.*?)</head>", r"\1", out)
    out = re.sub(r'(?i)<meta\s+(charset|name="viewport")[^>]*>', "", out)
pathlib.Path(sys.argv[1]).write_text(out)
print(f"wrote {sys.argv[1]} ({len(out)//1024} KB)")
