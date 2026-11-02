#!/usr/bin/env python3
"""Export the audit CLAIMS database to src/data/claims.json for the v2 sources toggle.

The audit (build_audit_xlsx.py) stays the source of truth. This script derives, for
every claim, the set of content ANCHORS its free-text `location` field names, so the
v2 UI can show "sources for this section / node" when the reader turns sources on.

Anchor grammar (what the UI resolves):
  node:<income>:<marker>     e.g. node:w2:8.1           (framework-chart node)
  sec:<view>:<n>             e.g. sec:math:5            (n = the section's printed number)
  p4:<module>:<id>           e.g. p4:life-events:job-loss (Phase 4 content)
Claims whose location names no resolvable anchor (Plan view, Diagnostic, Welcome...)
are exported with anchors=[] — they stay in the audit, the toggle simply has no
inline home for them (counted in the summary line).

Usage:  python3 audit/export_claims_json.py          # write
        python3 audit/export_claims_json.py --check  # exit 1 if claims.json is stale
"""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, "src", "data", "claims.json")

def load_claims():
    src = open(os.path.join(HERE, "build_audit_xlsx.py"), encoding="utf-8").read()
    s = src.index("CLAIMS = [")
    e = src.index("\nwb = Workbook()")
    ns = {}
    exec(src[s:e], ns)
    return ns["CLAIMS"]

NODE_RE = re.compile(r"\b(W2|Contractor|Business):(\d+\.\d+)")
SEC_PREFIXES = [  # (regex for the prefix, view id)
    (r"Math", "math"),
    (r"Spend:Ess", "spending-essentials"),
    (r"Spend:Life", "spending-lifestyle"),
    (r"Port:BH|Bog", "portfolio-bogleheads"),
    (r"Port:Th|Portfolio:Theory", "portfolio-theory"),
    (r"Zeit:Inv", "zeitgeist-investing"),
    (r"Zeit:Life", "zeitgeist-lifestyle"),
    (r"AdvStrat|Advanced strategies", "advanced-strategies"),
]
P4_RE = re.compile(r"\bP4:(life-events|protection|annual-review)(?::([a-z0-9-]+))?")

def expand_nums(spec):
    """'1, 3, 5' / '1-6' / '7-§8' / '5' -> [ints]"""
    out = []
    for part in re.split(r"[,\s]+", spec.replace("§", "")):
        if not part:
            continue
        m = re.fullmatch(r"(\d+)-(\d+)", part)
        if m:
            out += list(range(int(m.group(1)), int(m.group(2)) + 1))
        elif part.isdigit():
            out.append(int(part))
    return out

def anchors_for(loc):
    a = []
    for inc, mk in NODE_RE.findall(loc):
        a.append(f"node:{ {'W2':'w2','Contractor':'contractor','Business':'business'}[inc] }:{mk}")
    for pre, view in SEC_PREFIXES:
        # prefix followed by ':' or ' §' then a number list (stop at '(' ';' or a letter word)
        for m in re.finditer(rf"(?:{pre})\s*(?::|§)\s*((?:§?\d+(?:-§?\d+)?(?:,\s*(?=\d))?)+)", loc):
            for n in expand_nums(m.group(1)):
                a.append(f"sec:{view}:{n}")
    for mod, ident in P4_RE.findall(loc):
        a.append(f"p4:{mod}:{ident}" if ident else f"p4:{mod}")
    seen, uniq = set(), []
    for x in a:
        if x not in seen:
            seen.add(x); uniq.append(x)
    return uniq

def build():
    rows = []
    for c in load_claims():
        cid, loc, claim, ctype, pos, status, tier, source, url, notes = c
        rows.append({"id": cid, "loc": loc, "claim": claim, "type": ctype, "status": status,
                     "tier": tier, "source": source, "url": url, "anchors": anchors_for(loc)})
    return rows

def main():
    rows = build()
    text = json.dumps(rows, ensure_ascii=False, indent=1) + "\n"
    anchored = sum(1 for r in rows if r["anchors"])
    if "--check" in sys.argv:
        cur = open(OUT, encoding="utf-8").read() if os.path.exists(OUT) else ""
        if cur != text:
            print("claims.json is stale — run: python3 audit/export_claims_json.py", file=sys.stderr)
            sys.exit(1)
        print(f"claims.json in sync ({len(rows)} claims, {anchored} anchored)")
        return
    open(OUT, "w", encoding="utf-8").write(text)
    print(f"wrote {OUT}: {len(rows)} claims, {anchored} anchored to content, {len(rows)-anchored} unanchored (Plan/Diagnostic/Welcome)")

if __name__ == "__main__":
    main()
