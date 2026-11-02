// phase4.mjs — Phase 4 + Phase 5-leftover UI: life-events view, protection module,
// annual review checklist, plain-English toggles, the sources toggle, and deep links.
// Bundled by tools/build-v2.mjs AHEAD of app.mjs; everything here is only called at
// runtime from app.mjs's render(), so it may use app.mjs's `state`, `el`, `save`,
// `announce`, `copyText`, `download`, `fmtDate`, `stripHtml`, `figuresSummary`.
//
// Content globals (inlined by the build, {{fig}}/{{verify}} tokens already resolved):
//   LIFE_EVENTS, PROTECTION, ANNUAL_REVIEW, PLAIN (block id → plain HTML), CLAIMS.

/* global LIFE_EVENTS, PROTECTION, ANNUAL_REVIEW, PLAIN, CLAIMS, SECTIONS, FLOWCHARTS, TODAY, state, el, save, render, announce, copyText, download, fmtDate, stripHtml, figuresSummary, VIEWS */

const P4_NOT_ADVICE = 'Educational only — not financial, tax, insurance or legal advice. Verify anything that matters against the named primary source, and use a licensed professional for binding decisions.';
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// ============================ deep links ============================
// Route grammar (location.hash without '#'):
//   <view>                          any nav view (plan, math, life-events, …)
//   <section-view>/<n>              nth numbered section of a reference view (#math/5)
//   full-chart/<income>/<marker>    one framework-chart node, opened (#full-chart/w2/2.1)
//   life-events/<event>             one playbook (#life-events/job-loss)
//   protection/<section>            one protection section (#protection/umbrella)
//   annual-review                   the checklist
const hrefFor = (to) => `#${to}`;
function parseRoute(hash) {
  const raw = decodeURIComponent((hash || '').replace(/^#\/?/, ''));
  if (!raw) return null;
  const parts = raw.split('/');
  const view = parts[0];
  if (!VIEWS.some((v) => v.id === view)) return null;
  return { view, sub: parts.slice(1) };
}
// Apply a route to state (no render). Returns true if it named a known view.
function applyRoute(route) {
  if (!route) return false;
  state.started = true;
  state.view = route.view;
  state.reviewing = false;
  state.pendingFocus = null;
  if (route.view === 'full-chart' && route.sub.length === 2 && FLOWCHARTS[route.sub[0]]) {
    state.fullChartIncome = route.sub[0];
    state.pendingFocus = { kind: 'node', id: `nd-${route.sub[0]}-${route.sub[1]}` };
  } else if (route.view === 'life-events' && route.sub[0]) {
    if (LIFE_EVENTS.events.some((e) => e.id === route.sub[0])) state.lifeEvent = route.sub[0];
    state.pendingFocus = { kind: 'anchor', id: `le-${route.sub[0]}` };
  } else if (route.view === 'protection' && route.sub[0]) {
    state.pendingFocus = { kind: 'anchor', id: `pr-${route.sub[0]}` };
  } else if (SECTIONS[route.view] && route.sub[0]) {
    state.pendingFocus = { kind: 'anchor', id: `${route.view}-${route.sub[0]}` };
  }
  return true;
}
// After render: scroll to + focus the routed target (heading gets tabindex=-1).
function focusPending(root) {
  const pf = state.pendingFocus;
  if (!pf) return;
  state.pendingFocus = null;
  const t = root.querySelector(`#${CSS.escape(pf.id)}`);
  if (!t) return;
  if (pf.kind === 'node') {
    const node = t.closest('.node');
    const head = node && node.querySelector('.node-head[role="button"]');
    if (node && !node.classList.contains('open')) { node.classList.add('open'); if (head) head.setAttribute('aria-expanded', 'true'); }
    const target = head || node;
    if (target) { target.scrollIntoView({ block: 'start' }); try { target.focus({ preventScroll: true }); } catch { /* noop */ } }
    return;
  }
  const h = t.querySelector('h2, h3, h4') || t;
  if (!h.hasAttribute('tabindex')) h.setAttribute('tabindex', '-1');
  t.scrollIntoView({ block: 'start' });
  try { h.focus({ preventScroll: true }); } catch { /* noop */ }
}
// Navigate: update the URL (shareable) and render.
function go(to) {
  const route = parseRoute('#' + to);
  if (!route) return;
  if (location.hash !== '#' + to) history.pushState(null, '', '#' + to);
  applyRoute(route);
  const label = (VIEWS.find((v) => v.id === route.view) || {}).label || route.view;
  announce(`Now viewing: ${label}`);
  render();
}
function deepLink(l) {
  return el('a', { class: 'deeplink', href: hrefFor(l.to), onclick: (e) => { e.preventDefault(); go(l.to); } }, l.label);
}
function permalink(to, label) {
  return el('a', { class: 'permalink', href: hrefFor(to), 'aria-label': `Link to ${label}`, title: 'Link to this section (copy the address)', onclick: (e) => { e.preventDefault(); go(to); copyText(location.href); } }, '#');
}

// Reference views: give each numbered .math-section a stable id + permalink, and turn
// prose cross-references ("see Math §6") into real links where the target exists.
const XREF_VIEW = { 'Math': 'math', 'Spend:Ess': 'spending-essentials', 'Spend:Life': 'spending-lifestyle', 'Port:BH': 'portfolio-bogleheads', 'Port:Th': 'portfolio-theory', 'Zeit:Inv': 'zeitgeist-investing', 'Zeit:Life': 'zeitgeist-lifestyle', 'AdvStrat': 'advanced-strategies' };
const XREF_RE = /\b(Math|Spend:Ess|Spend:Life|Port:BH|Port:Th|Zeit:Inv|Zeit:Life|AdvStrat) §(\d+)/g;
function sectionNumbers(view) {
  const set = new Set();
  for (const m of (SECTIONS[view] || '').matchAll(/math-section-number">\s*(\d+)\s*</g)) set.add(m[1]);
  return set;
}
function linkifyXrefs(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const hits = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) if (XREF_RE.test(n.nodeValue) && !n.parentElement.closest('a, button, input, select, textarea')) hits.push(n);
  for (const n of hits) {
    const frag = document.createDocumentFragment();
    let last = 0;
    const s = n.nodeValue;
    XREF_RE.lastIndex = 0;
    for (const m of s.matchAll(XREF_RE)) {
      const view = XREF_VIEW[m[1]];
      if (!sectionNumbers(view).has(m[2])) continue;
      frag.append(s.slice(last, m.index));
      frag.append(deepLink({ to: `${view}/${m[2]}`, label: m[0] }));
      last = m.index + m[0].length;
    }
    if (last === 0) continue;
    frag.append(s.slice(last));
    n.replaceWith(frag);
  }
  XREF_RE.lastIndex = 0;
}
function decorateSectionView(root, view) {
  root.querySelectorAll('.math-section').forEach((sec) => {
    const num = sec.querySelector('.math-section-number');
    const h = sec.querySelector('.math-section-header h3');
    if (!num || !h) return;
    const n = num.textContent.trim();
    sec.id = `${view}-${n}`;
    h.after(permalink(`${view}/${n}`, stripHtml(h.innerHTML)));
    if (state.showSources) {
      const box = sourcesBox(claimsFor(`sec:${view}:${n}`), `section ${n}`);
      if (box) sec.append(box);
    }
  });
  linkifyXrefs(root);
}
// Chart nodes: permalink inside each opened detail + node-level sources.
function decorateChartNodes(root, income) {
  root.querySelectorAll('.node').forEach((node) => {
    const det = node.querySelector('.node-details-inner');
    const marker = (node.querySelector('.node-marker') || {}).textContent;
    if (!det || !marker) return;
    const track = node.closest('[data-track]');
    const key = (track && track.dataset.track) || income;
    det.prepend(el('div', { class: 'node-permalink' }, [permalink(`full-chart/${key}/${marker}`, `framework step ${marker}`), el('span', { class: 'fine' }, ` Link to step ${marker}`)]));
    if (state.showSources) { const box = sourcesBox(claimsFor(`node:${key}:${marker}`), `step ${marker}`); if (box) det.append(box); }
  });
  linkifyXrefs(root);
}

// ============================ sources toggle ============================
const TIER_LABEL = { A: 'Tier A · statute/code', B: 'Tier B · consensus', C: 'Tier C · empirical/contested', D: 'Tier D · heuristic/convention' };
let CLAIM_INDEX = null;
function claimIndex() {
  if (CLAIM_INDEX) return CLAIM_INDEX;
  CLAIM_INDEX = { byId: {}, byAnchor: {} };
  for (const c of CLAIMS) {
    CLAIM_INDEX.byId[c.id] = c;
    for (const a of c.anchors) (CLAIM_INDEX.byAnchor[a] = CLAIM_INDEX.byAnchor[a] || []).push(c);
  }
  return CLAIM_INDEX;
}
const claimsFor = (anchor) => claimIndex().byAnchor[anchor] || [];
const claimsById = (ids) => ids.map((id) => claimIndex().byId[id]).filter(Boolean);
function sourcesBox(list, what) {
  if (!list || !list.length) return null;
  return el('details', { class: 'sources-box' }, [
    el('summary', {}, `Sources for this ${what} (${list.length} audited claim${list.length === 1 ? '' : 's'})`),
    el('ul', { class: 'sources-list' }, list.map((c) => el('li', { class: `src-row status-${c.status.toLowerCase()}` }, [
      el('span', { class: 'src-id' }, c.id),
      el('span', { class: 'src-meta' }, `${TIER_LABEL[c.tier] || 'Tier ' + c.tier} · ${c.status}`),
      el('div', { class: 'src-claim' }, c.claim),
      el('div', { class: 'src-cite' }, c.url ? [el('a', { href: c.url, target: '_blank', rel: 'noopener noreferrer' }, c.source)] : c.source),
    ]))),
  ]);
}
function sourcesToggle() {
  const on = !!state.showSources;
  return el('button', { class: `tool-btn sources-toggle${on ? ' on' : ''}`, type: 'button', 'aria-pressed': String(on), 'data-fk': 'sources-toggle',
    title: 'Show the audited claims, their credibility tier and citation under each section',
    onclick: () => { state.showSources = !state.showSources; announce(state.showSources ? 'Sources shown' : 'Sources hidden'); render(); } },
  on ? 'Hide sources' : 'Show sources');
}

// ============================ plain-English toggle ============================
// Per-container: each prose block with a generated plain variant gets a toggle.
function proseBlock(id, html, cls = 'p4-body') {
  const plain = PLAIN[id];
  const isPlain = !!(plain && (state.plain || {})[id]);
  const body = el('div', { class: `${cls}${isPlain ? ' is-plain' : ''}`, id: `body-${id.replace(/:/g, '-')}`, html: isPlain ? plain : html });
  if (!plain) return body;
  const btn = el('button', { class: 'plain-toggle', type: 'button', 'aria-pressed': String(isPlain), 'aria-controls': body.id, 'data-fk': `plain:${id}`,
    onclick: () => { state.plain = state.plain || {}; state.plain[id] = !state.plain[id]; save(); render(); } },
  isPlain ? 'Original wording' : 'Plain English');
  return el('div', { class: 'prose-wrap' }, [btn, body]);
}
function plainAllToggle(ids) {
  const all = ids.length && ids.every((id) => (state.plain || {})[id]);
  return el('button', { class: 'tool-btn', type: 'button', 'aria-pressed': String(!!all), 'data-fk': 'plain:all',
    onclick: () => { state.plain = state.plain || {}; for (const id of ids) state.plain[id] = !all; save(); render(); } },
  all ? 'All original wording' : 'All in plain English');
}
const PLAIN_NOTE = 'Plain-English versions are rewrites of the original text, checked proposition-by-proposition against it (every number kept verbatim). If the two ever seem to differ, the original wording governs.';

function citeLine(ids) {
  if (!ids || !ids.length) return null;
  if (!state.showSources) return el('div', { class: 'cite-line fine' }, `Audit: ${ids.join(', ')}`);
  return sourcesBox(claimsById(ids), 'step');
}
function linksRow(links) {
  if (!links || !links.length) return null;
  return el('div', { class: 'p4-links' }, [el('span', { class: 'fine' }, 'Go deeper: '), ...links.flatMap((l, i) => (i ? [' · ', deepLink(l)] : [deepLink(l)]))]);
}
function viewHeader(eyebrow, title, intro, extra = []) {
  return el('div', { class: 'p4-header' }, [
    el('div', { class: 'eyebrow' }, eyebrow),
    el('h2', { html: title }),
    el('p', {}, intro),
    el('div', { class: 'p4-tools' }, [sourcesToggle(), ...extra]),
  ]);
}

// ============================ 4a — life events ============================
function lifeEventsView() {
  const ev = LIFE_EVENTS.events.find((e) => e.id === state.lifeEvent) || null;
  const wrap = el('section', { class: 'p4view', 'aria-label': 'Life events' });
  const ids = ev ? ev.steps.map((s) => `le:${ev.id}:${s.id}`) : [];
  wrap.append(viewHeader('When something happens', 'Life events — the <em>ordered</em> checklist', LIFE_EVENTS.intro,
    ev ? [plainAllToggle(ids),
      el('button', { class: 'tool-btn', type: 'button', onclick: () => copyText(lifeEventToMarkdown(ev)) }, 'Copy as Markdown'),
      el('button', { class: 'tool-btn', type: 'button', onclick: () => window.print() }, 'Print')] : []));
  const picker = el('div', { class: 'event-picker', role: 'group', 'aria-label': 'Choose a life event' }, LIFE_EVENTS.events.map((e) => el('a', {
    class: `event-chip${ev && ev.id === e.id ? ' active' : ''}`, href: hrefFor(`life-events/${e.id}`), 'aria-current': ev && ev.id === e.id ? 'true' : null,
    'data-fk': `le-pick:${e.id}`, onclick: (x) => { x.preventDefault(); go(`life-events/${e.id}`); },
  }, e.title)));
  wrap.append(picker);
  if (!ev) {
    wrap.append(el('p', { class: 'fine' }, 'Pick an event above to see its checklist. Each step links into the framework where the topic is covered in depth.'));
    return wrap;
  }
  const done = (state.leDone || {})[ev.id] || {};
  const sec = el('section', { class: 'event', id: `le-${ev.id}`, 'aria-labelledby': `le-h-${ev.id}` }, [
    el('h3', { id: `le-h-${ev.id}` }, ev.title),
    el('p', { class: 'event-summary' }, ev.summary),
    el('p', { class: 'fine plain-note' }, PLAIN_NOTE),
  ]);
  const ol = el('ol', { class: 'steps' });
  ev.steps.forEach((s) => {
    const bid = `le:${ev.id}:${s.id}`;
    const isDone = !!done[s.id];
    ol.append(el('li', { class: `step${isDone ? ' done' : ''}`, id: `le-${ev.id}-${s.id}` }, [
      el('div', { class: 'step-head' }, [
        el('label', { class: 'action-check' }, [
          el('input', { type: 'checkbox', 'aria-label': `Mark done: ${s.title}`, 'data-fk': `le-done:${bid}`, checked: isDone ? 'checked' : null,
            onchange: () => { state.leDone = state.leDone || {}; const m = (state.leDone[ev.id] = state.leDone[ev.id] || {}); if (m[s.id]) delete m[s.id]; else m[s.id] = TODAY; render(); } }),
          el('span', { class: 'check-box', 'aria-hidden': 'true' }),
        ]),
        el('div', {}, [el('span', { class: 'step-when' }, s.when), el('h4', { class: 'step-title' }, s.title)]),
      ]),
      proseBlock(bid, s.body),
      linksRow(s.links),
      citeLine(s.claims),
    ]));
  });
  sec.append(ol);
  sec.append(el('p', { class: 'model-limits' }, `What this checklist does not do: it is ordered by typical urgency, not by your situation — the diagnostic plan is the personalized view. State rules vary, and statutory windows are quoted with their source; any figure marked [VERIFY] has not yet been checked into the verified figures layer. ${P4_NOT_ADVICE}`));
  wrap.append(sec);
  return wrap;
}
function lifeEventToMarkdown(ev) {
  const s = figuresSummary();
  const done = (state.leDone || {})[ev.id] || {};
  const L = [`# Life event checklist: ${ev.title}`, '', `_Personal Finance Decision Tool · TY${s.taxYear} figures, verified ${fmtDate(s.verified)} · not financial or tax advice._`, '', ev.summary, ''];
  ev.steps.forEach((st, i) => {
    const bid = `le:${ev.id}:${st.id}`;
    const body = (state.plain || {})[bid] && PLAIN[bid] ? PLAIN[bid] : st.body;
    L.push(`${i + 1}. [${done[st.id] ? 'x' : ' '}] **${st.title}** _(${st.when})_`);
    L.push(`   ${stripHtml(body)}`);
  });
  L.push('', `Link: ${location.href.split('#')[0]}#life-events/${ev.id}`);
  return L.join('\n');
}

// ============================ 4b — protection ============================
// Emergency-fund sizing heuristic (the tool's own, transparent): start at 3 months
// (the low end of the 3–6 convention) and add months for the risk factors the
// framework's node 5.1 names; capped at 12. See the model-limits note.
const EF_FACTORS = [
  { id: 'earners', label: 'Who earns the household income?', opts: [['dual', 'Two or more stable earners', 0], ['single', 'One earner', 1]] },
  { id: 'variability', label: 'How variable is that income?', opts: [['stable', 'Steady salary', 0], ['some', 'Some variable pay (bonus, commission)', 1], ['high', 'Self-employed / gig / seasonal', 2]] },
  { id: 'dependents', label: 'Anyone depending on you financially?', opts: [['no', 'No', 0], ['yes', 'Yes', 1]] },
  { id: 'rehire', label: 'If you lost your job, how fast could you find similar work?', opts: [['fast', 'Within ~3 months', 0], ['slow', 'Probably longer', 1]] },
];
function efMonths(f) {
  let m = 3;
  for (const fac of EF_FACTORS) { const o = fac.opts.find((x) => x[0] === f[fac.id]); m += o ? o[2] : 0; }
  return Math.min(12, m);
}
function efCalculator() {
  state.ef = state.ef || { expenses: 4000, earners: 'dual', variability: 'stable', dependents: 'no', rehire: 'fast' };
  const f = state.ef;
  const out = el('div', { class: 'calc-out', role: 'status', 'aria-live': 'polite', id: 'efund-result' });
  const paint = () => {
    const months = efMonths(f);
    const exp = Math.max(0, Number(f.expenses) || 0);
    out.innerHTML = `<span class="calc-result-headline">$${Math.round(exp * months).toLocaleString('en-US')}</span><span class="calc-result-detail">${months} months × $${exp.toLocaleString('en-US')}/month of essential expenses. Starter fund first: $1,000 or one month ($${exp.toLocaleString('en-US')}), whichever is larger.</span>`;
  };
  const rows = [el('div', { class: 'calc-row' }, [
    el('label', { for: 'efund-expenses' }, 'Essential monthly expenses ($)'),
    el('input', { id: 'efund-expenses', type: 'number', min: '0', step: '100', inputmode: 'numeric', value: String(f.expenses), 'data-fk': 'ef-expenses', oninput: (e) => { f.expenses = e.target.value; save(); paint(); } }),
  ])];
  for (const fac of EF_FACTORS) {
    const sel = el('select', { id: `efund-${fac.id}`, 'data-fk': `ef-${fac.id}`, onchange: (e) => { f[fac.id] = e.target.value; save(); paint(); } },
      fac.opts.map(([v, l]) => el('option', { value: v, selected: f[fac.id] === v ? 'selected' : null }, l)));
    rows.push(el('div', { class: 'calc-row' }, [el('label', { for: `efund-${fac.id}` }, fac.label), sel]));
  }
  paint();
  return el('div', { class: 'calc p4-calc' }, [
    el('h4', {}, 'Emergency-fund sizing'),
    el('p', { class: 'calc-intro' }, 'Starts at 3 months (the low end of the convention) and adds a month for each risk factor below; capped at 12.'),
    el('div', { class: 'calc-inputs' }, rows),
    out,
    el('p', { class: 'model-limits' }, 'What this model does not capture: the month weights are this tool\'s transparent heuristic, not an empirical model; it ignores other liquid resources (a partner\'s savings, unused credit, severance), insurance deductibles you would have to fund, and how quickly expenses could be cut. Treat the output as a starting range to adjust, not a precise target.'),
  ]);
}
function protectionView() {
  const wrap = el('section', { class: 'p4view', 'aria-label': 'Protection' });
  const ids = PROTECTION.sections.map((s) => `pr:${s.id}`);
  wrap.append(viewHeader('Protection & security', 'Protection — <em>right-sizing</em>, not minimizing', PROTECTION.intro, [plainAllToggle(ids)]));
  wrap.append(el('p', { class: 'fine plain-note' }, PLAIN_NOTE));
  const toc = el('nav', { class: 'p4-toc', 'aria-label': 'Protection sections' }, PROTECTION.sections.map((s) => deepLink({ to: `protection/${s.id}`, label: s.title })));
  wrap.append(toc);
  let group = null;
  for (const s of PROTECTION.sections) {
    if (s.group !== group) { group = s.group; wrap.append(el('h3', { class: 'p4-group' }, group)); }
    const bid = `pr:${s.id}`;
    wrap.append(el('section', { class: 'p4-card', id: `pr-${s.id}`, 'aria-labelledby': `pr-h-${s.id}` }, [
      el('div', { class: 'p4-card-head' }, [el('h4', { id: `pr-h-${s.id}` }, s.title), permalink(`protection/${s.id}`, s.title)]),
      el('p', { class: 'rule' }, [el('strong', {}, 'Rule of thumb: '), s.rule]),
      proseBlock(bid, s.body),
      s.calculator ? efCalculator() : null,
      linksRow(s.links),
      citeLine(s.claims),
    ]));
  }
  wrap.append(el('p', { class: 'model-limits' }, `What this module does not do: it does not quote premiums, compare carriers, or judge a specific policy's terms. Rules of thumb are conventions (audit Tier B–D) and are shown with their tier so you can weigh them. ${P4_NOT_ADVICE}`));
  return wrap;
}

// ============================ 4c — annual review ============================
function reviewYear() { return state.reviewYear || Number(TODAY.slice(0, 4)); }
function reviewState(y) { state.review = state.review || {}; return (state.review[y] = state.review[y] || { started: TODAY, done: {} }); }
function annualReviewView() {
  const y = reviewYear();
  const rs = reviewState(y);
  const ids = ANNUAL_REVIEW.items.map((i) => `ar:${i.id}`);
  const doneN = ANNUAL_REVIEW.items.filter((i) => rs.done[i.id]).length;
  const wrap = el('section', { class: 'p4view', 'aria-label': 'Annual review checklist' });
  const ySel = el('select', { id: 'ar-year', 'data-fk': 'ar-year', onchange: (e) => { state.reviewYear = Number(e.target.value); save(); render(); } },
    [y - 1, y, y + 1].filter((v, i, a) => a.indexOf(v) === i).map((v) => el('option', { value: String(v), selected: v === y ? 'selected' : null }, String(v))));
  wrap.append(viewHeader('Once a year', 'Annual review — the <em>maintenance</em> loop', ANNUAL_REVIEW.intro, [
    plainAllToggle(ids),
    el('button', { class: 'tool-btn', type: 'button', html: '<span aria-hidden="true">⧉</span> Copy as Markdown', onclick: () => copyText(annualReviewToMarkdown(y)) }),
    el('button', { class: 'tool-btn', type: 'button', html: '<span aria-hidden="true">🖶</span> Print', onclick: () => window.print() }),
    el('button', { class: 'tool-btn', type: 'button', html: '<span aria-hidden="true">📅</span> Calendar (.ics)', onclick: () => download(`annual-review-${y}.ics`, annualReviewToICS(y), 'text/calendar') }),
  ]));
  wrap.append(el('div', { class: 'ar-bar' }, [
    el('label', { for: 'ar-year' }, 'Review year '), ySel,
    el('span', { class: 'fine' }, ` · started ${fmtDate(rs.started)} · ${doneN} of ${ANNUAL_REVIEW.items.length} done`),
  ]));
  wrap.append(el('p', { class: 'fine plain-note' }, PLAIN_NOTE));
  if (y !== Number(TODAY.slice(0, 4))) wrap.append(el('p', { class: 'callout-warn' }, `Figures shown are the TY${figuresSummary().taxYear} values from the verified figures layer — for ${y}, re-check each limit against its source.`));
  const list = el('ol', { class: 'steps review-list' });
  for (const it of [...ANNUAL_REVIEW.items].sort((a, b) => a.month - b.month)) {
    const bid = `ar:${it.id}`;
    const when = rs.done[it.id];
    list.append(el('li', { class: `step${when ? ' done' : ''}`, id: `ar-${it.id}` }, [
      el('div', { class: 'step-head' }, [
        el('label', { class: 'action-check' }, [
          el('input', { type: 'checkbox', 'aria-label': `Mark done: ${it.title}`, 'data-fk': `ar-done:${it.id}`, checked: when ? 'checked' : null,
            onchange: () => { if (rs.done[it.id]) delete rs.done[it.id]; else rs.done[it.id] = TODAY; render(); } }),
          el('span', { class: 'check-box', 'aria-hidden': 'true' }),
        ]),
        el('div', {}, [
          el('span', { class: 'step-when' }, `${MONTH_NAMES[it.month - 1]} ${y}${when ? ` · done ${fmtDate(when)}` : ''}`),
          el('h3', { class: 'step-title' }, it.title),
        ]),
      ]),
      proseBlock(bid, it.body),
      linksRow(it.links),
      citeLine(it.claims),
    ]));
  }
  wrap.append(list);
  wrap.append(el('p', { class: 'model-limits' }, `What this checklist does not do: suggested months are conventions (open enrollment dates vary by employer; tax-filing timing varies), and it does not file, transfer or change anything for you. ${P4_NOT_ADVICE}`));
  return wrap;
}
function annualReviewToMarkdown(y) {
  const s = figuresSummary();
  const rs = reviewState(y);
  const L = [`# Annual financial review — ${y}`, '', `_Personal Finance Decision Tool · TY${s.taxYear} figures, verified ${fmtDate(s.verified)} · started ${rs.started} · not financial or tax advice._`, ''];
  for (const it of [...ANNUAL_REVIEW.items].sort((a, b) => a.month - b.month)) {
    const bid = `ar:${it.id}`;
    const body = (state.plain || {})[bid] && PLAIN[bid] ? PLAIN[bid] : it.body;
    const d = rs.done[it.id];
    L.push(`- [${d ? 'x' : ' '}] **${it.title}** — ${MONTH_NAMES[it.month - 1]} ${y}${d ? ` (done ${d})` : ''}`);
    L.push(`  ${stripHtml(body)}`);
  }
  L.push('', `Link: ${location.href.split('#')[0]}#annual-review`);
  return L.join('\n');
}
function annualReviewToICS(y) {
  const stamp = TODAY.replace(/-/g, '') + 'T000000Z';
  const esc = (t) => stripHtml(t).replace(/[\\,;]/g, (m) => '\\' + m);
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//finance-decision-tool//v2 annual review//EN', 'CALSCALE:GREGORIAN'];
  for (const it of ANNUAL_REVIEW.items) {
    const mm = String(it.month).padStart(2, '0');
    lines.push('BEGIN:VEVENT', `UID:annual-${y}-${it.id}@finance-decision-tool`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${y}${mm}01`, `SUMMARY:${esc('Annual review: ' + it.title)}`, `DESCRIPTION:${esc(it.body).slice(0, 600)}`, 'END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.map((l) => (l.length <= 75 ? l : [l.slice(0, 75), ...(l.slice(75).match(/.{1,74}/g) || []).map((x) => ' ' + x)].join('\r\n'))).join('\r\n');
}
