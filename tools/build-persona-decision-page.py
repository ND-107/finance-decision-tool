#!/usr/bin/env python3
"""Build the owner's decision page for the persona-review findings.

  build_decision_page.py <current-blocks dir (in/)> <full dir> <lean dir> <out.html>

Self-contained HTML: per block, the current text, the HIGH-only variant and the full variant, the findings
with their verdicts, the sources read, and a picker that writes the two apply commands.
"""
import difflib, glob, html, json, os, re, sys

IN, FULL, LEAN, OUT = sys.argv[1:5]
E = html.escape
wc = lambda s: len(re.findall(r'\S+', s or ''))
sents = lambda s: [x for x in re.split(r'(?<=[.!?])\s+', (s or '').strip()) if x]

def marked(cur, new):
    """new text with the words that are not in the current text wrapped in <ins>."""
    a, b = sents(cur), sents(new); out = []
    sm = difflib.SequenceMatcher(a=a, b=b, autojunk=False)
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        if op == 'equal': out.extend(E(s) for s in b[j1:j2])
        elif op == 'insert': out.extend(f'<ins>{E(s)}</ins>' for s in b[j1:j2])
        elif op == 'replace':
            wa, wb = ' '.join(a[i1:i2]).split(), ' '.join(b[j1:j2]).split(); buf = []
            for o, x1, x2, y1, y2 in difflib.SequenceMatcher(a=wa, b=wb, autojunk=False).get_opcodes():
                if o == 'equal': buf.append(E(' '.join(wb[y1:y2])))
                elif o in ('insert', 'replace'): buf.append(f"<ins>{E(' '.join(wb[y1:y2]))}</ins>")
            out.append(' '.join(buf))
    return ' '.join(out)

ORDER = ['le-job-loss', 'le-new-baby', 'le-marriage', 'le-divorce', 'le-home-purchase', 'le-relocation', 'le-windfall', 'le-retirement', 'le-death-of-spouse', 'protection', 'annual-review']
NAMES = {'le-job-loss': 'Job loss', 'le-new-baby': 'New baby', 'le-marriage': 'Marriage', 'le-divorce': 'Divorce', 'le-home-purchase': 'Home purchase', 'le-relocation': 'Relocation', 'le-windfall': 'Windfall', 'le-retirement': 'Retirement', 'le-death-of-spouse': 'Death of a spouse', 'protection': 'Protection module', 'annual-review': 'Annual review'}
VERD = {'accept': 'Accepted', 'accept-modified': 'Accepted, reworded', 'already-addressed': 'Already covered', 'reject': 'Rejected', 'owner-decision': 'Your decision'}
tot = {'findings': 0, 'full_blocks': 0, 'lean_blocks': 0, 'cur': 0, 'full': 0, 'lean': 0, 'verd': {}}
sections = []; owner = []; unver = []
for g in ORDER:
    inp = json.load(open(os.path.join(IN, g + '.json'))); full = json.load(open(os.path.join(FULL, g + '.json'))); lean = json.load(open(os.path.join(LEAN, g + '.json')))
    fb = {b['id']: b for b in full['blocks']}; lb = {b['id']: b for b in lean['blocks']}
    leanflag = {f['id']: f.get('lean', 'n/a') for f in lean['findings']}
    ftxt = {f['id']: f for f in inp['findings']}
    newc = {c['temp_id']: c for c in full.get('new_claims', [])}
    cards = []
    for bid, cur in inp['blocks'].items():
        F, L = fb[bid], lb[bid]
        fs = [f for f in full['findings'] if (f.get('addressed_in') or f.get('block')) == bid or f.get('block') == bid]
        w0, wf, wl = wc(cur['body']), wc(F['body']), wc(L['body'])
        tot['cur'] += w0; tot['full'] += wf if F.get('changed') else w0; tot['lean'] += wl if L.get('changed') else w0
        tot['full_blocks'] += bool(F.get('changed')); tot['lean_blocks'] += bool(L.get('changed'))
        if not F.get('changed') and not fs: continue
        rows = ''.join(
            f"<tr><td class=id>{E(f['id'])}</td><td><span class='sev {E(str(f.get('severity', '')).lower())}'>{E(str(f.get('severity', '')))}</span></td>"
            f"<td>{E(VERD.get(f['verdict'], f['verdict']))}{' · in HIGH-only' if leanflag.get(f['id']) == 'included' else ''}</td>"
            f"<td><details><summary>{E((ftxt.get(f['id'], {}).get('head') or '')[:110])}</summary><p class=rv>{E(ftxt.get(f['id'], {}).get('text', ''))}</p><p><b>Verdict reason.</b> {E(f.get('reason', ''))}</p></details></td></tr>" for f in fs)
        srcs = ''.join(f"<li><b>{E(newc[c].get('source', ''))}</b>{' · <a href=' + chr(34) + E(newc[c]['url']) + chr(34) + ' rel=noopener>link</a>' if newc[c].get('url') else ''}<br><span class=cl>{E(newc[c].get('claim', ''))}</span></li>" for c in F.get('claims', []) if c in newc)
        def pane(key, label, B, changed):
            if not changed: return f"<div class=pane data-v={key}><h4>{label} <span class=wc>no change</span></h4><p class=txt>{E(cur['body'])}</p></div>"
            return (f"<div class=pane data-v={key}><h4>{label} <span class=wc>{wc(B['body'])} words ({wc(B['body']) - w0:+d})</span></h4><p class=txt>{marked(cur['body'], B['body'])}</p>"
                    f"<details><summary>Plain-English variant</summary><p class=txt>{marked(cur['plain'], B['plain'])}</p></details></div>")
        pick = ''.join(f"<label><input type=radio name='p:{E(bid)}' value={v} {'checked' if v == 'none' else ''} {'disabled' if (v == 'lean' and not L.get('changed')) or (v == 'full' and not F.get('changed')) else ''}> {t}</label>" for v, t in (('none', 'Leave as is'), ('lean', 'HIGH only'), ('full', 'Everything')))
        cards.append(f"<article class=card id='{E(bid)}'><header><h3>{E(cur.get('title') or bid)}</h3><code>{E(bid)}</code><div class=pick>{pick}</div></header>"
                     f"<div class=panes><div class=pane data-v=cur><h4>Current <span class=wc>{w0} words</span></h4><p class=txt>{E(cur['body'])}</p></div>{pane('lean', 'HIGH only', L, L.get('changed'))}{pane('full', 'Everything', F, F.get('changed'))}</div>"
                     f"<div class=tw><table class=find><thead><tr><th>Finding</th><th>Severity</th><th>Verdict</th><th>What the reviewer said</th></tr></thead><tbody>{rows}</tbody></table></div>"
                     + (f"<details class=src><summary>Sources read for the added sentences ({srcs.count('<li>')})</summary><ul>{srcs}</ul></details>" if srcs else '')
                     + (f"<p class=note>{E(F.get('notes') or '')}</p>" if F.get('notes') else '') + "</article>")
    for f in full['findings']:
        tot['findings'] += 1; tot['verd'][f['verdict']] = tot['verd'].get(f['verdict'], 0) + 1
    for o in full.get('owner_decisions', []):
        dr = o.get('draft') or {}
        owner.append(f"<li><b>{E(NAMES[g])}</b> · {E(', '.join(o.get('findings', [])))}<br>{E(o.get('what', ''))}<br><span class=cl>{E(o.get('why_owner', ''))}</span>" + (f"<details><summary>Draft</summary><pre>{E(json.dumps(dr, indent=1, ensure_ascii=False))}</pre></details>" if dr else '') + "</li>")
    for u in full.get('unverified', []):
        unver.append(f"<li><b>{E(NAMES[g])}</b> · {E(str(u.get('finding', '')))}: {E(u.get('assertion', ''))}<br><span class=cl>{E(u.get('why', ''))}</span></li>")
    sections.append(f"<section id='{g}'><h2>{E(NAMES[g])}</h2>{''.join(cards)}</section>")

v = tot['verd']
CSS = """
:root{--bg:#f7f6f2;--card:#fff;--ink:#1d2327;--mute:#5d666e;--line:#dcd8cf;--ins:#dff3e3;--insb:#2f7d46;--acc:#1f5fa8;--high:#a8321f;--med:#8a6410;--low:#56616b}
@media (prefers-color-scheme:dark){:root{--bg:#15181b;--card:#1e2327;--ink:#e8e6e1;--mute:#a2abb3;--line:#353c43;--ins:#1f3a28;--insb:#7fd09a;--acc:#7fb3ee;--high:#f08c7a;--med:#e0b85c;--low:#aab3bb}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif}
main{max-width:1180px;margin:0 auto;padding:24px 16px 150px;overflow-wrap:anywhere}h1{font-size:28px;margin:0 0 6px}h2{font-size:22px;margin:40px 0 12px;border-bottom:1px solid var(--line);padding-bottom:6px}
.lede{color:var(--mute);max-width:75ch}.stats{display:flex;flex-wrap:wrap;gap:10px;margin:18px 0}.stat{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:10px 14px;min-width:0;flex:1 1 150px}.stat b{display:block;font-size:22px}.stat span{color:var(--mute);font-size:13px}
nav{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0}nav a{color:var(--acc);text-decoration:none;border:1px solid var(--line);border-radius:999px;padding:3px 11px;font-size:14px;background:var(--card)}
.card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:16px;margin:14px 0}.card header{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px 10px;margin-bottom:10px}.card h3{margin:0;font-size:18px}code{color:var(--mute);font-size:12.5px}
.pick{margin-left:auto;display:flex;gap:12px;font-size:14px;flex-wrap:wrap}.pick label{cursor:pointer}
.panes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}@media (max-width:860px){.panes{grid-template-columns:1fr}}
.pane{border:1px solid var(--line);border-radius:8px;padding:10px 12px}.pane h4{margin:0 0 6px;font-size:13px;text-transform:uppercase;letter-spacing:.04em;color:var(--mute)}.wc{float:right;text-transform:none;letter-spacing:0}
.txt{margin:0;font-size:15px}ins{background:var(--ins);text-decoration:none;border-bottom:2px solid var(--insb)}
.tw{overflow-x:auto;margin-top:12px}table.find{width:100%;min-width:560px;border-collapse:collapse;font-size:14px}.find th,.find td{text-align:left;padding:6px 8px;border-top:1px solid var(--line);vertical-align:top}.find th{color:var(--mute);font-weight:600;font-size:12.5px}td.id{white-space:nowrap;font-variant-numeric:tabular-nums}
.sev{font-weight:700;font-size:12px}.sev.high{color:var(--high)}.sev.med{color:var(--med)}.sev.low{color:var(--low)}
details summary{cursor:pointer;color:var(--acc)}.rv{white-space:pre-wrap;color:var(--mute)}.src{margin-top:10px;font-size:14px}.cl{color:var(--mute);font-size:13.5px}.note{color:var(--mute);font-size:13.5px;margin:10px 0 0}
pre{white-space:pre-wrap;font-size:12.5px;background:var(--bg);padding:10px;border-radius:6px;overflow-x:auto}a{color:var(--acc)}
#bar{position:fixed;left:0;right:0;bottom:0;background:var(--card);border-top:1px solid var(--line);padding:10px 16px;font-size:14px}#bar div{max-width:1180px;margin:0 auto}#bar pre{margin:6px 0 0;max-height:110px;overflow:auto;word-break:break-all}
button{font:inherit;border:1px solid var(--line);background:var(--bg);color:var(--ink);border-radius:6px;padding:3px 10px;cursor:pointer}
"""
JS = """
const K='persona-picks-2026-11-16';let P={};try{P=JSON.parse(localStorage.getItem(K)||'{}')}catch(e){}
const radios=[...document.querySelectorAll('.pick input')];
radios.forEach(r=>{const id=r.name.slice(2);if(P[id]===r.value&&!r.disabled)r.checked=true;r.addEventListener('change',()=>{P[id]=r.value;try{localStorage.setItem(K,JSON.stringify(P))}catch(e){};out()})});
function setAll(v){radios.forEach(r=>{if(r.value===v&&!r.disabled){r.checked=true;P[r.name.slice(2)]=v}else if(r.value==='none'&&v!=='none'){const g=radios.filter(x=>x.name===r.name&&x.value===v)[0];if(!g||g.disabled){r.checked=true;P[r.name.slice(2)]='none'}}});try{localStorage.setItem(K,JSON.stringify(P))}catch(e){};out()}
function out(){const pick=v=>radios.filter(r=>r.checked&&r.value===v).map(r=>r.name.slice(2));const L=pick('lean'),F=pick('full');
 let c=[];if(F.length)c.push('python3 tools/apply-persona-proposals.py --repo . --proposals docs/reviews/proposals-2026-11-16/full --blocks '+F.join(','));
 if(L.length)c.push('python3 tools/apply-persona-proposals.py --repo . --proposals docs/reviews/proposals-2026-11-16/lean --blocks '+L.join(','));
 if(c.length)c.push('node tools/plain-layer.mjs --stamp && python3 audit/export_claims_json.py && bash tools/verify-v2.sh');
 document.getElementById('n').textContent=F.length+' blocks at Everything, '+L.length+' at HIGH only';document.getElementById('cmd').textContent=c.join('\\n')||'Nothing picked yet.'}
out();
"""
page = f"""<!doctype html><html lang=en><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><title>Persona findings: your decision</title><style>{CSS}</style></head><body><main>
<h1>Persona-review findings: what to apply</h1>
<p class=lede>Two reviewers left 117 findings on the Phase 4 content on 2026-11-06. Seven were applied that day. On 2026-11-16 every finding was checked at a primary source by one agent and then attacked by a second, independent one. Nothing here is applied to the site. For each block, pick one of three: leave it, apply only what the HIGH findings need, or apply everything that survived checking. Text added to the current wording is highlighted.</p>
<div class=stats>
<div class=stat><b>{tot['findings']}</b><span>findings checked</span></div>
<div class=stat><b>{v.get('accept', 0) + v.get('accept-modified', 0)}</b><span>accepted ({v.get('accept-modified', 0)} reworded)</span></div>
<div class=stat><b>{v.get('already-addressed', 0)}</b><span>already covered</span></div>
<div class=stat><b>{v.get('owner-decision', 0)}</b><span>need a new step: yours to decide</span></div>
<div class=stat><b>{v.get('reject', 0)}</b><span>rejected</span></div>
<div class=stat><b>{tot['lean_blocks']} blocks · {tot['lean'] - tot['cur']:+,} words</b><span>HIGH only ({tot['cur']:,} → {tot['lean']:,})</span></div>
<div class=stat><b>{tot['full_blocks']} blocks · {tot['full'] - tot['cur']:+,} words</b><span>Everything ({tot['cur']:,} → {tot['full']:,})</span></div>
</div>
<nav>{''.join(f"<a href='#{g}'>{E(NAMES[g])}</a>" for g in ORDER)}<a href='#owner'>New steps to decide</a><a href='#unverified'>Left out as unverified</a></nav>
{''.join(sections)}
<section id=owner><h2>New steps and scope changes (not in either variant)</h2><p class=lede>These findings need a new step, a reordering or a title change. Each has a checked draft, but none is applied by the picker.</p><ul>{''.join(owner)}</ul></section>
<section id=unverified><h2>Left out because no primary source could be read</h2><ul>{''.join(unver)}</ul></section>
</main><div id=bar><div><b id=n></b> · <button onclick="setAll('lean')">All HIGH only</button> <button onclick="setAll('full')">All Everything</button> <button onclick="setAll('none')">Clear</button><pre id=cmd></pre></div></div><script>{JS}</script></body></html>"""
open(OUT, 'w', encoding='utf-8').write(page)
print('wrote', OUT, len(page), 'bytes;', tot)
