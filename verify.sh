#!/bin/bash
# verify.sh — fast correctness check for flowchart.html and the audit builder.
#
# Does three things:
#   1. Parse flowchart.html with Python's HTML parser (catches malformed markup).
#   2. Extract inline <script> blocks and run `node --check` on them (catches JS syntax errors).
#   3. Re-run audit/build_audit_xlsx.py (catches Python errors and confirms the xlsx regenerates).
#
# Exit non-zero on the first failure. Run after any substantive edit.

set -e

cd "$(dirname "$0")"

# Use the project venv if it exists (audit builder needs openpyxl);
# otherwise fall back to system python3.
if [ -x ".venv/bin/python3" ]; then
  PY=".venv/bin/python3"
else
  PY="python3"
fi

echo "→ [1/3] HTML parses..."
"$PY" -c "
import html.parser, sys
class P(html.parser.HTMLParser):
    pass
p = P()
with open('flowchart.html') as f:
    p.feed(f.read())
print('  ok')
"

echo "→ [2/3] Inline JS passes node --check..."
"$PY" -c "
import re, sys, tempfile, subprocess
with open('flowchart.html') as f:
    html = f.read()
scripts = re.findall(r'<script[^>]*>(.*?)</script>', html, re.S)
# Drop any script tags that are just src= references (no inline body)
inline = [s for s in scripts if s.strip()]
print(f'  found {len(inline)} inline script block(s)')
combined = '\n;\n'.join(inline)
with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False) as f:
    f.write(combined)
    path = f.name
res = subprocess.run(['node', '--check', path], capture_output=True, text=True)
if res.returncode != 0:
    print('  FAIL:')
    print(res.stderr)
    sys.exit(1)
print('  ok')
"

echo "→ [3/3] Audit builder regenerates xlsx..."
"$PY" audit/build_audit_xlsx.py > /dev/null
echo "  ok"

echo ""
echo "All checks passed."
