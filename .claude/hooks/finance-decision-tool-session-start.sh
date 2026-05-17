#!/bin/bash
# finance-decision-tool SessionStart hook.
# Fires when Claude Code opens at ~/code/finance-decision-tool/.
#
# Output: JSON with `additionalContext` (warm-up for Claude) and
# `systemMessage` (one-line user-visible confirmation).

set -e

cd "$(dirname "$0")/../.." 2>/dev/null

content=$(
  echo "=== finance-decision-tool session start ==="
  echo ""
  echo "--- recent CHANGELOG ---"
  tail -n 40 CHANGELOG.md 2>/dev/null
  echo ""
  echo "--- git ---"
  git log --oneline -5 2>/dev/null
  echo ""
  git status -s 2>/dev/null
  echo ""
  echo "--- audit status ---"
  python3 -c "
import re, ast
with open('audit/build_audit_xlsx.py') as f:
    src = f.read()
m = re.search(r'^CLAIMS\s*=\s*\[', src, re.M)
if m:
    start = m.end() - 1
    depth = 0
    for i, ch in enumerate(src[start:], start):
        if ch == '[': depth += 1
        elif ch == ']':
            depth -= 1
            if depth == 0:
                end = i + 1
                break
    rows = ast.literal_eval(src[start:end])
    from collections import Counter
    c = Counter(r[5] for r in rows)
    print(f'  total claims: {len(rows)}')
    for k in ('PASS','CORRECTED','PARTIAL','FAIL','DEFERRED-P2.5'):
        if k in c:
            print(f'    {k}: {c[k]}')
    deferred = [r for r in rows if r[5].startswith('DEFERRED')]
    if deferred:
        print(f'  open deferred items:')
        for r in deferred:
            print(f'    {r[0]} ({r[1]}): {r[2][:70]}')
" 2>/dev/null
  echo ""
  echo "Last session:"
  last_session=$(ls -t obsidian-sync/sessions/*.md 2>/dev/null | head -1)
  if [ -n "$last_session" ]; then
    date=$(grep "^date:" "$last_session" | head -1 | awk '{print $2}')
    title=$(grep "^title:" "$last_session" | head -1 | sed 's/^title: *//; s/^"//; s/"$//')
    status=$(grep "^status:" "$last_session" | head -1 | awk '{print $2}')
    next=$(grep "^next-step:" "$last_session" | head -1 | sed 's/^next-step: *//; s/^"//; s/"$//')
    echo "  $date  $title  ($status)"
    [ -n "$next" ] && echo "  Next: $next"
  else
    echo "  (no sessions yet — first /save will create one)"
  fi
  echo ""
  echo "Tip: docs/HANDOFF.md = full orientation. CLAUDE.md = rules. ./verify.sh = parse + JS check + audit regen."
)

branch=$(git branch --show-current 2>/dev/null || echo "?")
last_commit=$(git log --oneline -1 2>/dev/null | awk '{print $1}' || echo "?")
session_count=$(ls obsidian-sync/sessions/*.md 2>/dev/null | wc -l | tr -d ' ')
summary="finance-decision-tool hook fired — branch ${branch}, last commit ${last_commit}, ${session_count} session note(s)"

CONTENT="$content" SUMMARY="$summary" python3 -c '
import json, os
print(json.dumps({
    "hookSpecificOutput": {
        "hookEventName": "SessionStart",
        "additionalContext": os.environ["CONTENT"]
    },
    "systemMessage": os.environ["SUMMARY"]
}))
'
exit 0
