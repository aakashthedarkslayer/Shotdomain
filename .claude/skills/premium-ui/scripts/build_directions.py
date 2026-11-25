"""Assemble shell.html + dir-*.html fragments into one page.
Usage: python3 build.py OUT.html [--local] [--only a]   (missing fragments are skipped)
Fragment format: one file per direction, dir-a.html .. dir-d.html, containing
<style>, <section id="dir-x" class="direction">…</section>, and <script>…</script>.
Scripts are moved below the shared SAMPLE_NOTES script; everything else goes in <main>."""
import re, sys, pathlib
here = pathlib.Path(__file__).parent
shell = (here / "shell.html").read_text()
markup, scripts = [], []
only = sys.argv[sys.argv.index("--only")+1] if "--only" in sys.argv else "abcd"  # e.g. --only a
for k in only:
    f = here / f"dir-{k}.html"
    if not f.exists():
        continue
    src = f.read_text()
    scripts += re.findall(r"<script\b[^>]*>.*?</script>", src, flags=re.S)
    markup.append(re.sub(r"<script\b[^>]*>.*?</script>", "", src, flags=re.S))
out = shell.replace("<!--DIRECTIONS-->", "\n".join(markup)).replace("<!--SCRIPTS-->", "\n".join(scripts))
if "--local" in sys.argv:  # standalone file for headless-Chrome checks (the Artifact host adds this skeleton itself)
    out = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>[hidden]{display:none!important}body{margin:0}</style></head><body>' + out + "</body></html>"
pathlib.Path(sys.argv[1]).write_text(out)
print(f"wrote {sys.argv[1]} ({len(out)//1024} KB)")
