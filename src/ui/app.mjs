// app.mjs — v2 UI shell. Drives the diagnostic → plan flow entirely off the pure
// core (computePlan / reorderPlan / annotateDeadlines / applyCompletions /
// sensitivity) + content (questions / nodes). The bundler (tools/build-v2.mjs)
// concatenates the core modules ahead of this file and inlines the content as
// the globals QUESTIONS, NODES, and TODAY, so the symbols below are in scope.
//
// This is the first artifact that renders the v2 engine — the "make it
// clickable" milestone. Progressive: a provisional plan appears after the
// core-8 answers and sharpens as more are answered. Completion loop: marking an
// action done recomputes the plan and migrates it to the skip ledger.

/* global QUESTIONS, NODES, FIGURES, TODAY, computePlan, reorderPlan, annotateDeadlines, applyCompletions, diffPlans, sensitivity */

const LS_KEY = 'fdt2:state';
const CORE8 = ['incomeTypes', 'filingStatus', 'ageBracket', 'taxBracket', 'emergencyFund', 'highInterestDebt', 'healthInsurance', 'employerMatch'];

const state = load() || { answers: {}, sectionIdx: 0, started: false, completions: {}, open: {} };

function load() { try { return JSON.parse(localStorage.getItem(LS_KEY)); } catch { return null; } }
function save() { try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch { /* private mode */ } }
const $ = (sel, root = document) => root.querySelector(sel);
const el = (tag, attrs = {}, kids = []) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') n.className = v;
    else if (k === 'html') n.innerHTML = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else if (v != null) n.setAttribute(k, v);
  }
  for (const kid of [].concat(kids)) if (kid != null) n.append(kid);
  return n;
};

// ---- predicate eval (showIf) is shared with the engine via evalPredicate ----
const activeSections = () => QUESTIONS.sections.filter((s) => !s.showIf || evalPredicate(s.showIf, state.answers));
const activeQuestions = (sec) => sec.questions.filter((q) => !q.showIf || evalPredicate(q.showIf, state.answers));
const answeredCount = () => activeSections().reduce((n, s) => n + activeQuestions(s).filter((q) => state.answers[q.id] != null).length, 0);
const core8Done = () => CORE8.every((f) => state.answers[f] != null && (f !== 'incomeTypes' || state.answers[f].length));

// =================== render ===================
function render() {
  const root = $('#app');
  root.innerHTML = '';
  root.append(masthead());
  if (!state.started) { root.append(welcome()); return; }
  root.append(el('div', { class: 'layout' }, [diagnostic(), planPanel()]));
  save();
}

function masthead() {
  return el('header', { class: 'masthead' }, [
    el('div', { class: 'eyebrow' }, 'Personal Finance · 2026 · United States · v2 engine'),
    el('h1', { html: 'An ordered path through <em>your money</em>.' }),
    state.started ? el('button', { class: 'ghost', onclick: reset }, '↻ Start over') : null,
  ]);
}

function welcome() {
  return el('section', { class: 'welcome' }, [
    el('h2', { html: 'What should you do <em>next</em>?' }),
    el('p', {}, 'Answer questions about your situation; get a prioritized plan — sequenced by impact and ease, calibrated to your bracket, employment, and stage of life. A provisional plan appears after the first few answers and sharpens as you go.'),
    el('button', { class: 'btn primary', onclick: () => { state.started = true; render(); } }, 'Start the diagnostic'),
    el('p', { class: 'fine' }, `About 30–50 questions depending on your situation. Answers stay in this browser only.`),
  ]);
}

// ---- diagnostic ----
function diagnostic() {
  const secs = activeSections();
  const idx = Math.max(0, Math.min(state.sectionIdx, secs.length - 1));
  const sec = secs[idx];
  const qs = activeQuestions(sec);
  const wrap = el('section', { class: 'diagnostic' });
  wrap.append(el('div', { class: 'diag-head' }, [
    el('span', { class: 'diag-step' }, `Section ${idx + 1} of ${secs.length}`),
    el('span', { class: 'diag-title' }, sec.section),
  ]));
  const bar = el('div', { class: 'progress' }, el('div', { class: 'progress-fill' }));
  bar.firstChild.style.width = `${((idx + 1) / secs.length) * 100}%`;
  wrap.append(bar);

  for (const q of qs) wrap.append(question(q));

  const nav = el('div', { class: 'diag-nav' }, [
    el('button', { class: 'btn', onclick: () => { state.sectionIdx = Math.max(0, idx - 1); render(); } }, 'Back'),
    el('button', { class: 'btn primary', onclick: () => { state.sectionIdx = Math.min(secs.length - 1, idx + 1); render(); } }, idx === secs.length - 1 ? 'Done' : 'Next'),
  ]);
  wrap.append(nav);
  return wrap;
}

function question(q) {
  const node = el('div', { class: 'question' }, [el('div', { class: 'q-label' }, q.label)]);
  if (q.help) node.append(el('div', { class: 'q-help', html: q.help }));
  const grid = el('div', { class: 'options' });
  for (const opt of q.options) {
    const multi = q.type === 'multi';
    const selected = multi ? (state.answers[q.id] || []).includes(opt.v) : state.answers[q.id] === opt.v;
    grid.append(el('div', {
      class: `option${multi ? ' multi' : ''}${selected ? ' selected' : ''}`,
      role: multi ? 'checkbox' : 'radio', tabindex: '0', 'aria-checked': selected ? 'true' : 'false',
      onclick: () => choose(q, opt.v),
      onkeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(q, opt.v); } },
    }, [el('span', { class: 'dot' }), el('span', {}, opt.l)]));
  }
  node.append(grid);
  return node;
}

function choose(q, v) {
  if (q.type === 'multi') {
    const cur = state.answers[q.id] || [];
    state.answers[q.id] = cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v];
  } else {
    state.answers[q.id] = v;
  }
  state.completions = {}; // answers changed — clear completion overlay to avoid stale state
  render();
}

// ---- plan ----
function effectiveAnswers() { return applyCompletions(state.answers, state.completions); }

function buildPlan() {
  const base = computePlan(effectiveAnswers());
  const reordered = reorderPlan(base, { today: TODAY });
  return annotateDeadlines(reordered, TODAY);
}

const STAGE_LABEL = { now: 'Do now', 'next-quarter': 'Next quarter', 'this-year': 'This year', eventually: 'Eventually' };
const STAGE_SUB = { now: 'This week or month', 'next-quarter': 'Within 3 months', 'this-year': 'Within 12 months', eventually: 'Plan for, optimize over time' };
const STAGE_ORDER = ['now', 'next-quarter', 'this-year', 'eventually'];

// =================== Phase 5: trust + utility surfaces ===================
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtDate = (iso) => { const [y, m, d] = (iso || '').split('-'); return m ? `${MONTHS[+m - 1]} ${+d}, ${y}` : iso; };
const stripHtml = (s) => (s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

function figuresSummary() {
  const ids = Object.keys(FIGURES);
  let verified = '', expired = 0, taxYear = null;
  for (const k of ids) {
    const f = FIGURES[k];
    if (f.verified > verified) verified = f.verified;
    if (f.expires && f.expires < TODAY) expired++;
    if (taxYear == null) taxYear = f.taxYear;
  }
  return { count: ids.length, verified, expired, taxYear };
}

// "TY2026 figures · verified Jun 15, 2026 · 46 values, none expired" + expandable source list.
function figuresBanner() {
  const s = figuresSummary();
  const fresh = s.expired === 0;
  const summary = el('summary', { class: 'fig-summary' }, [
    el('span', { class: `fig-dot ${fresh ? 'ok' : 'stale'}`, 'aria-hidden': 'true' }),
    el('span', {}, `TY${s.taxYear} figures · verified ${fmtDate(s.verified)} · ${s.count} values${fresh ? ', none expired' : `, ${s.expired} expired`}`),
  ]);
  const rows = Object.keys(FIGURES).sort().map((k) => el('div', { class: 'fig-row' }, [
    el('span', { class: 'fig-val' }, FIGURES[k].display),
    el('span', { class: 'fig-src' }, `${FIGURES[k].source} · verified ${fmtDate(FIGURES[k].verified)} · expires ${fmtDate(FIGURES[k].expires)}`),
  ]));
  return el('details', { class: 'figures' }, [
    summary,
    el('p', { class: 'fig-note' }, 'Every indexed dollar figure this tool relies on, each live-verified against its primary source on the date shown — never carried over from memory. Not financial or tax advice.'),
    ...rows,
  ]);
}

// Export row: copy-as-markdown, print one-pager, .ics for any dated deadlines.
function planTools(plan) {
  const dated = plan.actions.filter((a) => a.deadline && a.deadline.dueDate);
  return el('div', { class: 'plan-tools' }, [
    el('button', { class: 'tool-btn', type: 'button', onclick: () => copyText(planToMarkdown(plan)) }, '⧉ Copy as Markdown'),
    el('button', { class: 'tool-btn', type: 'button', onclick: () => window.print() }, '🖶 Print one-pager'),
    dated.length ? el('button', { class: 'tool-btn', type: 'button', onclick: () => download('finance-plan-deadlines.ics', planToICS(plan), 'text/calendar') }, `📅 ${dated.length} deadline${dated.length === 1 ? '' : 's'} → calendar`) : null,
  ]);
}

function mdItem(a) {
  let s = `- [ ] **${a.title}**`;
  if (a.because) s += ` — ${stripHtml(a.because)}`;
  if (a.deadline && a.deadline.dueDate) s += `  ⏰ due ${a.deadline.dueDate}`;
  else if ((a.tags || []).includes('critical')) s += '  ⚑ critical';
  return s;
}
function planToMarkdown(plan) {
  const s = figuresSummary();
  const L = ['# Your prioritized personal-finance plan', '',
    `_Personal Finance Decision Tool · TY${s.taxYear} figures, verified ${fmtDate(s.verified)} · not financial or tax advice._`, ''];
  const t1 = plan.actions.filter((a) => a.tier1);
  if (t1.length) { L.push('## Start here — this week'); t1.forEach((a) => L.push(mdItem(a))); L.push(''); }
  for (const st of STAGE_ORDER) {
    const acts = plan.actions.filter((a) => a.stage === st);
    if (!acts.length) continue;
    L.push(`## ${STAGE_LABEL[st]} — ${STAGE_SUB[st]}`);
    acts.forEach((a) => L.push(mdItem(a)));
    L.push('');
  }
  if (plan.skipped.length) { L.push("## Doesn't apply to you"); plan.skipped.forEach((x) => L.push(`- ${x.title}`)); L.push(''); }
  return L.join('\n');
}

const icsEscape = (s) => stripHtml(s).replace(/[\\,;]/g, (m) => '\\' + m).replace(/\n/g, '\\n');
// RFC 5545 §3.1 content-line folding: split >75 chars, continuation lines start
// with a space. Char-based (never splits a codepoint) — within tolerance for all
// real calendar clients.
function icsFold(line) {
  if (line.length <= 75) return line;
  const out = [line.slice(0, 75)];
  for (let i = 75; i < line.length; i += 74) out.push(' ' + line.slice(i, i + 74));
  return out.join('\r\n');
}
function planToICS(plan) {
  const stamp = TODAY.replace(/-/g, '') + 'T000000Z';
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//finance-decision-tool//v2//EN', 'CALSCALE:GREGORIAN'];
  for (const a of plan.actions.filter((x) => x.deadline && x.deadline.dueDate)) {
    lines.push('BEGIN:VEVENT', `UID:${a.key}@finance-decision-tool`, `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${a.deadline.dueDate.replace(/-/g, '')}`,
      `SUMMARY:${icsEscape(a.title)}`, `DESCRIPTION:${icsEscape(a.because || '')}`, 'END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.map(icsFold).join('\r\n');
}

function flash(msg) { const n = el('div', { class: 'flash' }, msg); document.body.append(n); setTimeout(() => n.remove(), 1800); }
function fallbackCopy(text, cb) { const ta = el('textarea', { class: 'sr-only' }, text); document.body.append(ta); ta.select(); try { document.execCommand('copy'); cb(); } catch { /* noop */ } ta.remove(); }
function copyText(text) {
  const ok = () => flash('Copied to clipboard');
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok, () => fallbackCopy(text, ok));
  else fallbackCopy(text, ok);
}
function download(name, text, mime) {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = el('a', { href: url, download: name }); document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  flash('Downloaded ' + name);
}

function planPanel() {
  const wrap = el('aside', { class: 'plan' });
  if (!core8Done()) {
    wrap.append(el('div', { class: 'plan-pending' }, [
      el('h3', {}, 'Your plan'),
      el('p', {}, `Answer the first ${CORE8.length} essentials (income, filing, age, bracket, emergency fund, high-interest debt, health coverage, employer match) and a provisional plan appears here — then sharpens with every further answer.`),
      el('div', { class: 'pending-count' }, `${answeredCount()} answered`),
    ]));
    return wrap;
  }
  const plan = buildPlan();
  wrap.append(el('div', { class: 'plan-head' }, [
    el('h3', {}, 'Your prioritized plan'),
    el('p', {}, `${plan.actions.length} action${plan.actions.length === 1 ? '' : 's'} · ${answeredCount()} answers · sequenced by impact × ease, with deadlines & safety pinned.`),
  ]));
  wrap.append(planTools(plan));
  wrap.append(figuresBanner());

  // Tier-1 "Start here"
  const t1 = plan.actions.filter((a) => a.tier1);
  if (t1.length) {
    wrap.append(el('div', { class: 'tier1' }, [
      el('div', { class: 'tier1-eyebrow' }, 'Start here · this week'),
      ...t1.map((a) => actionCard(a, true)),
    ]));
  }
  // Stages
  for (const st of ['now', 'next-quarter', 'this-year', 'eventually']) {
    const acts = plan.actions.filter((a) => a.stage === st);
    if (!acts.length) continue;
    wrap.append(el('div', { class: `stage stage-${st}` }, [
      el('div', { class: 'stage-head' }, [el('span', { class: 'stage-label' }, STAGE_LABEL[st]), el('span', { class: 'stage-sub' }, STAGE_SUB[st]), el('span', { class: 'stage-count' }, String(acts.length))]),
      ...acts.map((a) => actionCard(a, false)),
    ]));
  }
  // Skip ledger
  if (plan.skipped.length) {
    const det = el('details', { class: 'skipped' }, [
      el('summary', {}, `Doesn't apply to you (${plan.skipped.length})`),
      ...plan.skipped.map((s) => el('div', { class: 'skip-item' }, [el('div', { class: 'skip-title' }, s.title), s.reason ? el('div', { class: 'skip-reason' }, s.reason) : null])),
    ]);
    wrap.append(det);
  }
  // Sensitivity
  wrap.append(sensitivityPanel());
  return wrap;
}

function actionCard(a, isTier1) {
  const node = NODES[a.nodeKey];
  const tags = [];
  if (a.tags.includes('critical')) tags.push(el('span', { class: 'tag crit' }, 'Critical'));
  if (a.deadline && ['overdue', 'critical', 'soon'].includes(a.deadline.urgency)) {
    const lbl = a.deadline.dueDate ? `⏰ due ${a.deadline.dueDate}` : '⏰ time-critical';
    tags.push(el('span', { class: `tag deadline ${a.deadline.urgency}` }, lbl));
  }
  if (a.incomeType) tags.push(el('span', { class: 'tag inc' }, { w2: 'W-2', contractor: '1099/SE', business: 'Business' }[a.incomeType]));
  const done = !!state.completions[a.title];
  const card = el('div', { class: `action${isTier1 ? ' t1' : ''}${done ? ' done' : ''}` }, [
    el('label', { class: 'action-check' }, [
      el('input', { type: 'checkbox', checked: done ? 'checked' : null, onchange: () => toggleDone(a.title) }),
      el('span', { class: 'check-box' }),
    ]),
    el('div', { class: 'action-body' }, [
      el('div', { class: 'action-title' }, a.title),
      a.because ? el('div', { class: 'action-because', html: a.because }) : null,
      tags.length ? el('div', { class: 'action-tags' }, tags) : null,
      (a.reason || (node && node.detailsHtml)) ? detailToggle(a, node) : null,
    ]),
  ]);
  return card;
}

function detailToggle(a, node) {
  const id = 'd-' + a.key;
  const isOpen = !!state.open[id];
  const label = (open) => (open ? '− Hide why & reference' : '+ Why this matters & reference');
  const inner = (a.reason ? `<div class="why-reason">${a.reason}</div>` : '')
    + (node && node.detailsHtml ? node.detailsHtml : '');
  const btn = el('button', { class: 'detail-toggle', onclick: (e) => { state.open[id] = !state.open[id]; e.target.nextSibling.style.display = state.open[id] ? 'block' : 'none'; e.target.textContent = label(state.open[id]); save(); } }, label(isOpen));
  const body = el('div', { class: 'detail', html: inner });
  body.style.display = isOpen ? 'block' : 'none';
  return el('div', {}, [btn, body]);
}

function toggleDone(title) {
  if (state.completions[title]) delete state.completions[title];
  else state.completions[title] = 'done';
  render();
}

function sensitivityPanel() {
  let ranked;
  try { ranked = sensitivity(effectiveAnswers()).filter((f) => f.impact > 0).slice(0, 5); } catch { ranked = []; }
  if (!ranked.length) return el('div');
  const labelFor = (id) => { for (const s of QUESTIONS.sections) for (const q of s.questions) if (q.id === id) return q.label; return id; };
  return el('details', { class: 'sensitivity' }, [
    el('summary', {}, 'Which of your answers drive this plan?'),
    el('p', { class: 'fine' }, 'Changing these would change the most actions — the load-bearing inputs to revisit if any are uncertain.'),
    ...ranked.map((f) => el('div', { class: 'sens-row' }, [el('span', { class: 'sens-field' }, labelFor(f.field)), el('span', { class: 'sens-bar' }, el('span', { class: 'sens-fill', style: `width:${Math.min(100, f.impact * 6)}%` })), el('span', { class: 'sens-n' }, `${f.impact}`)])),
  ]);
}

function reset() {
  if (!confirm('Clear all answers and start over?')) return;
  try { localStorage.removeItem(LS_KEY); } catch { /* noop */ }
  location.reload();
}

render();
