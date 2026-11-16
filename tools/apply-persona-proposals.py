#!/usr/bin/env python3
"""Apply reviewed persona-finding proposals to a checkout of finance-decision-tool.

  apply_persona.py --repo <checkout> --proposals <dir with one <module>.json per content module> (--all | --blocks id,id | --groups g,g) [--dry]

Unit of choice is the block (le:<event>:<step>, pr:<section>, ar:<item>). For each chosen block whose
proposal says changed=true it replaces body, links, claims, plain variant and proposition map; appends the
new audit rows that block cites (temp ids NEW-* become the next free CL ids); adds proposed figures the
block uses. It does not add new blocks (owner_decisions are never applied here).
Afterwards run:  node tools/plain-layer.mjs --stamp && python3 audit/export_claims_json.py && bash tools/verify-v2.sh
"""
import argparse, glob, json, os, re, sys

ap = argparse.ArgumentParser()
ap.add_argument('--repo', required=True); ap.add_argument('--proposals', required=True)
ap.add_argument('--all', action='store_true'); ap.add_argument('--blocks', default=''); ap.add_argument('--groups', default='')
ap.add_argument('--dry', action='store_true')
a = ap.parse_args()
R = a.repo
P4 = os.path.join(R, 'src', 'content', 'phase4')
enc = lambda s: json.dumps(s, ensure_ascii=False)

props = {}
for f in sorted(glob.glob(os.path.join(a.proposals, '*.json'))):
    if os.path.basename(f).startswith('_'): continue
    d = json.load(open(f, encoding='utf-8'))
    if a.groups and d['group'] not in a.groups.split(','): continue
    props[d['group']] = d
want = set(filter(None, a.blocks.split(',')))
chosen = []  # (group, block)
for g, d in props.items():
    for b in d['blocks']:
        if not b.get('changed'): continue
        if a.all or a.groups or b['id'] in want: chosen.append((g, b))
if not chosen: sys.exit('nothing chosen')

# ---- audit rows: allocate CL ids for the temp ids the chosen blocks cite
audit_path = os.path.join(R, 'audit', 'build_audit_xlsx.py')
audit = open(audit_path, encoding='utf-8').read()
next_id = max(int(m) for m in re.findall(r"\('CL(\d+)'", audit)) + 1
idmap, rows = {}, []
for g, b in chosen:
    newc = {c['temp_id']: c for c in props[g].get('new_claims', [])}
    for cid in b['claims']:
        if cid.startswith('CL'): continue
        if cid not in newc: sys.exit(f"{b['id']}: cites {cid}, which has no draft audit row")
        if cid in idmap: continue
        c = newc[cid]; idmap[cid] = f'CL{next_id}'; next_id += 1
        prio = 'SOFT' if c.get('type') == 'CONVENTION' else 'CON'
        note = c.get('note', '').rstrip()
        note += (' ' if note else '') + f"Drafted 2026-11-16 from the persona-pass findings ({', '.join(b.get('findings_addressed', []))}); applied on the owner's go."
        ctype = {'GUIDANCE': 'REGULATORY'}.get(c.get('type', 'STATUTORY'), c.get('type', 'STATUTORY'))  # agency guidance pages sit under REGULATORY in this audit (cf. CL527)
        rows.append((idmap[cid], c['loc'], c['claim'], ctype, prio, c.get('status', 'PASS'), c.get('tier', 'A'), c.get('source', ''), c.get('url', ''), note))

def tuple_src(r):
    return ("    (%r, %r,\n     %r,\n     %r, %r, %r, %r,\n     %r, %r,\n     %r),\n" % r)

# ---- figures
fig_path = os.path.join(R, 'src', 'data', 'figures.json')
figs = json.load(open(fig_path, encoding='utf-8')); added_figs = []
for g, b in chosen:
    used = set(re.findall(r'\{\{fig:([^}]+)\}\}', b['body']))
    for nf in props[g].get('new_figures', []):
        k = nf.get('key')
        if k in used and k not in figs:
            figs[k] = {x: nf[x] for x in ('value', 'display', 'taxYear', 'source', 'verified', 'expires') if x in nf}; added_figs.append(k)
    for k in used:
        if k not in figs: sys.exit(f"{b['id']}: uses unknown figure {k}")

# ---- content
le_path = os.path.join(P4, 'life-events.json'); le = json.load(open(le_path, encoding='utf-8'))
plain_path = os.path.join(P4, 'plain.json'); plain = json.load(open(plain_path, encoding='utf-8'))
texts = {n: open(os.path.join(P4, n), encoding='utf-8').read() for n in ('protection.json', 'annual-review.json')}

def links_src(links, ind):
    if not links: return '[]'
    return '[\n' + ',\n'.join(f'{ind}  {{ "to": {enc(l["to"])}, "label": {enc(l["label"])} }}' for l in links) + f'\n{ind}]'

def patch_text(name, bid, b, claims):
    t = texts[name]
    m = re.search(r'\n    \{\n      "id": ' + re.escape(enc(bid)) + r',\n.*?\n    \}', t, re.S)
    if not m: sys.exit(f'{name}: block {bid} not found')
    obj = m.group(0)
    new = re.sub(r'\n      "body": ".*?(?<!\\)",\n', lambda _: '\n      "body": ' + enc(b['body']) + ',\n', obj, count=1, flags=re.S)
    new = re.sub(r'\n      "links": \[.*?\n      \],\n', lambda _: '\n      "links": ' + links_src(b.get('links', []), '      ') + ',\n', new, count=1, flags=re.S)
    new = re.sub(r'\n      "claims": \[.*?\]\n', lambda _: '\n      "claims": [' + ', '.join(enc(c) for c in claims) + ']\n', new, count=1, flags=re.S)
    json.loads(new.strip().rstrip(','))  # the patched object must still parse
    texts[name] = t.replace(obj, new)

done = []
for g, b in chosen:
    bid = b['id']; claims = [idmap.get(c, c) for c in b['claims']]
    kind, *rest = bid.split(':')
    if kind == 'le':
        ev = next(e for e in le['events'] if e['id'] == rest[0]); st = next(s for s in ev['steps'] if s['id'] == rest[1])
        st['body'] = b['body']; st['links'] = b.get('links', st.get('links', [])); st['claims'] = claims
    elif kind == 'pr': patch_text('protection.json', rest[0], b, claims)
    elif kind == 'ar': patch_text('annual-review.json', rest[0], b, claims)
    plain[bid] = {'hash': plain[bid]['hash'], 'plain': b['plain'], 'props': b['props']}
    done.append(bid)

print(f'blocks: {len(done)}  new audit rows: {len(rows)} ({rows[0][0] if rows else "-"}..{rows[-1][0] if rows else "-"})  new figures: {added_figs}')
if a.dry: sys.exit(0)
open(le_path, 'w', encoding='utf-8').write(json.dumps(le, indent=2, ensure_ascii=False) + '\n')
open(plain_path, 'w', encoding='utf-8').write(json.dumps(plain, indent=1, ensure_ascii=False) + '\n')
for n, t in texts.items():
    json.loads(t); open(os.path.join(P4, n), 'w', encoding='utf-8').write(t)
if added_figs: open(fig_path, 'w', encoding='utf-8').write(json.dumps(figs, indent=2, ensure_ascii=True))
if rows:
    end = audit.index('\n]\n', audit.index('CLAIMS = ['))
    audit = audit[:end] + '\n' + ''.join(tuple_src(r) for r in rows).rstrip('\n') + audit[end:]
    open(audit_path, 'w', encoding='utf-8').write(audit)
print('applied:', ', '.join(done))
print('new audit ids:', ', '.join(f'{k}={v}' for k, v in idmap.items()) or '-')
