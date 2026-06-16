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

/* global QUESTIONS, NODES, TODAY, computePlan, reorderPlan, annotateDeadlines, applyCompletions, diffPlans, sensitivity */

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
      tags.length ? el('div', { class: 'action-tags' }, tags) : null,
      node && node.detailsHtml ? detailToggle(a, node) : null,
    ]),
  ]);
  return card;
}

function detailToggle(a, node) {
  const id = 'd-' + a.key;
  const isOpen = !!state.open[id];
  const btn = el('button', { class: 'detail-toggle', onclick: (e) => { state.open[id] = !state.open[id]; e.target.nextSibling.style.display = state.open[id] ? 'block' : 'none'; e.target.textContent = state.open[id] ? '− Hide reference' : '+ Reference (math, exceptions, bracket guidance)'; save(); } }, isOpen ? '− Hide reference' : '+ Reference (math, exceptions, bracket guidance)');
  const body = el('div', { class: 'detail', html: node.detailsHtml });
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
