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

/* global QUESTIONS, NODES, FIGURES, SECTIONS, PHASES, FLOWCHARTS, TODAY, computePlan, reorderPlan, annotateDeadlines, applyCompletions, diffPlans, sensitivity, runCalculator, CALCULATORS, INPUT_ATTRS */

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
// The app re-renders by wiping #app; to keep keyboard/SR users in place we capture
// the focused control's stable data-fk before the wipe and restore it after (WCAG
// 2.4.3 / 3.2.2). #sr-live (a polite live region OUTSIDE #app, in the page shell)
// announces plan/section changes (WCAG 4.1.3).
function render() {
  const root = $('#app');
  const ae = document.activeElement;
  const fk = ae && ae.getAttribute ? ae.getAttribute('data-fk') : null;
  root.innerHTML = '';
  root.append(masthead());
  if (!state.started) { root.append(welcome()); restoreFocus(root, fk); return; }
  root.append(viewNav());
  const view = state.view || 'plan';
  if (view === 'full-chart') root.append(fullChartView());
  else if (view === 'personal-chart') root.append(personalChartView());
  else if (view !== 'plan' && SECTIONS[view]) root.append(sectionView(view));
  else root.append(el('div', { class: 'layout' }, [diagnostic(), planPanel()]));
  save();
  restoreFocus(root, fk);
}

const VIEWS = [
  { id: 'plan', label: 'Your plan' },
  { id: 'personal-chart', label: 'Your chart' },
  { id: 'full-chart', label: 'Full chart' },
  { id: 'math', label: 'The math' },
  { id: 'spending-essentials', label: 'Spending · essentials' },
  { id: 'spending-lifestyle', label: 'Spending · lifestyle' },
  { id: 'portfolio-bogleheads', label: 'Portfolio · Bogleheads' },
  { id: 'portfolio-theory', label: 'Portfolio · theory' },
  { id: 'zeitgeist-investing', label: 'Zeitgeist · investing' },
  { id: 'zeitgeist-lifestyle', label: 'Zeitgeist · lifestyle' },
  { id: 'advanced-strategies', label: 'Advanced' },
];

// ---- reference sections: render v1's verbatim view HTML, then wire its calculators ----
function sectionView(name) {
  const sec = el('section', { class: 'sectionview', 'aria-label': (VIEWS.find((v) => v.id === name) || {}).label || name });
  sec.innerHTML = SECTIONS[name];
  wireSectionCalcs(sec);
  return sec;
}
// ---- framework chart — port of v1 renderFullChart / renderPersonalChart ----
// `personal` (optional) = { activeKeys:Set, skippedMap:{} } → fade non-plan nodes.
const normTitle = (s) => s.toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();
function flowchartHTML(income, personal) {
  const nodes = FLOWCHARTS[income].nodes;
  const byPhase = {};
  nodes.forEach((n, idx) => { (byPhase[n.phase] = byPhase[n.phase] || []).push({ ...n, idx }); });
  return Object.keys(PHASES).map((pk, pi) => {
    if (!byPhase[pk]) return '';
    const phase = PHASES[pk];
    const phaseNodes = byPhase[pk].map((n) => {
      let cls = '', extra = '';
      if (personal) {
        const isActive = personal.activeKeys.has(`${income}:${n.marker}`);
        if (!isActive) {
          cls = ' skipped';
          const nt = normTitle(n.title);
          const hit = Object.keys(personal.skippedMap).find((t) => { const k = normTitle(t).slice(0, 16); return k && nt.includes(k); });
          const reason = (hit && personal.skippedMap[hit]) ? personal.skippedMap[hit] : 'Not in your prioritized plan based on diagnostic answers.';
          extra = `<div class="node-skip-tag">Skipped</div><div class="node-skip-reason">${reason}</div>`;
        }
      }
      return `
      <div class="node ${phase.tag}${cls}" data-node-idx="${n.idx}">
        <div class="node-head">
          <div class="node-marker">${n.marker}</div>
          <div class="node-body"><div class="node-title">${n.title}</div><div class="node-summary">${n.summary}</div>${extra}</div>
          <div class="node-toggle">+</div>
        </div>
        <div class="node-details"><div class="node-details-inner">${n.details || ''}</div></div>
      </div>`;
    }).join('');
    return `<section class="phase"><div class="phase-header"><span class="phase-number">Phase ${String(pi).padStart(2, '0')}</span><h2 class="phase-title">${phase.name}</h2><span class="phase-rule"></span><span class="phase-color-tag ${phase.color}"></span></div><p class="phase-desc">${phase.desc}</p><div class="nodes">${phaseNodes}</div></section>`;
  }).join('');
}

const legendHTML = () => Object.entries(PHASES).map(([, p], i) => `<div class="legend-item"><span class="legend-dot ${p.color}"></span><span class="legend-label">${String(i).padStart(2, '0')} · ${p.name}</span></div>`).join('');

function personalChartView() {
  const a = state.answers || {};
  const inc = (a.incomeTypes || []).includes('business') ? 'business' : (a.incomeTypes || []).includes('contractor') ? 'contractor' : 'w2';
  const wrap = el('section', { class: 'sectionview fullchart', 'aria-label': 'Personalized chart' });
  if (!core8Done()) {
    wrap.innerHTML = `<div class="plan-header"><div class="eyebrow">Personalized framework</div><h2>Your <em>filtered</em> view of the full chart.</h2><p>Answer the first few diagnostic questions (on “Your plan”), then this shows every framework step — with the ones that don't apply to you faded and labeled.</p></div>`;
    return wrap;
  }
  const plan = computePlan(effectiveAnswers());
  const activeKeys = new Set(plan.actions.map((x) => x.nodeKey));
  const skippedMap = {};
  plan.skipped.forEach((s) => { skippedMap[s.title] = s.reason || ''; });
  const brk = state.fullChartBracket || 'mid';
  const seg = BRACKET_OPTS.map(([v, l]) => `<button type="button" data-bracket="${v}"${v === brk ? ' class="active"' : ''}>${l}</button>`).join('');
  wrap.innerHTML = `
    <div class="plan-header"><div class="eyebrow">Personalized framework</div>
      <h2>Your <em>filtered</em> view of the full chart.</h2>
      <p>Every framework step for ${({ w2: 'W-2', contractor: '1099 / self-employed', business: 'business-owner' }[inc])} income; steps that don't apply to you are faded with a note.</p></div>
    <div class="chart-controls"><div class="segmented" id="bracket-selector" role="group">${seg}</div></div>
    <div class="legend">${legendHTML()}</div>
    <div id="flowchart-personal"></div>`;
  const flow = wrap.querySelector('#flowchart-personal');
  flow.innerHTML = flowchartHTML(inc, { activeKeys, skippedMap });
  const applyBracket = () => flow.querySelectorAll('.bracket-block').forEach((b) => b.classList.toggle('active', b.dataset.bracket === (state.fullChartBracket || 'mid')));
  applyBracket();
  flow.querySelectorAll('.node:not(.skipped)').forEach((node) => node.addEventListener('click', () => node.classList.toggle('open')));
  wrap.querySelectorAll('#bracket-selector button').forEach((b) => b.addEventListener('click', () => {
    state.fullChartBracket = b.dataset.bracket; save();
    wrap.querySelectorAll('#bracket-selector button').forEach((x) => x.classList.toggle('active', x === b));
    applyBracket();
  }));
  return wrap;
}

const INCOME_OPTS = [['w2', 'W-2 employee'], ['contractor', '1099 / self-employed'], ['business', 'Business owner']];
const BRACKET_OPTS = [['low', 'Low · 10–12%'], ['mid', 'Middle · 22–24%'], ['high', 'High · 32%+']];

function fullChartView() {
  const inc = state.fullChartIncome || 'w2';
  const brk = state.fullChartBracket || 'mid';
  const seg = (id, opts, cur, attr) => `<div class="segmented" id="${id}" role="group">${opts.map(([v, l]) => `<button type="button" data-${attr}="${v}"${v === cur ? ' class="active"' : ''}>${l}</button>`).join('')}</div>`;
  const wrap = el('section', { class: 'sectionview fullchart', 'aria-label': 'Full framework chart' });
  wrap.innerHTML = `
    <div class="plan-header"><div class="eyebrow">The complete framework</div>
      <h2>Every decision, every <em>income type</em>.</h2>
      <p>The full reference chart, independent of your diagnostic answers. Browse by income type and tax bracket; click any node to expand it.</p></div>
    <div class="chart-controls">${seg('income-selector', INCOME_OPTS, inc, 'income')}${seg('bracket-selector', BRACKET_OPTS, brk, 'bracket')}</div>
    <div class="legend" id="legend-full"></div>
    <div id="flowchart-full"></div>`;
  wrap.querySelector('#legend-full').innerHTML = Object.entries(PHASES).map(([, p], i) =>
    `<div class="legend-item"><span class="legend-dot ${p.color}"></span><span class="legend-label">${String(i).padStart(2, '0')} · ${p.name}</span></div>`).join('');
  const flow = wrap.querySelector('#flowchart-full');
  const renderChart = () => {
    flow.innerHTML = flowchartHTML(state.fullChartIncome || 'w2');
    applyBracket();
    flow.querySelectorAll('.node').forEach((node) => node.addEventListener('click', () => node.classList.toggle('open')));
  };
  const applyBracket = () => flow.querySelectorAll('.bracket-block').forEach((b) => b.classList.toggle('active', b.dataset.bracket === (state.fullChartBracket || 'mid')));
  const setActive = (sel, match) => wrap.querySelectorAll(sel).forEach((x) => x.classList.toggle('active', match(x)));
  renderChart();
  wrap.querySelectorAll('#income-selector button').forEach((b) => b.addEventListener('click', () => {
    state.fullChartIncome = b.dataset.income; save(); setActive('#income-selector button', (x) => x === b); renderChart();
  }));
  wrap.querySelectorAll('#bracket-selector button').forEach((b) => b.addEventListener('click', () => {
    state.fullChartBracket = b.dataset.bracket; save(); setActive('#bracket-selector button', (x) => x === b); applyBracket();
  }));
  return wrap;
}

function wireSectionCalcs(container) {
  const byResult = {};
  for (const c of CALCULATORS) byResult[c.resultId] = c;
  container.querySelectorAll('[id$="-result"]').forEach((resEl) => {
    const c = byResult[resEl.id];
    if (!c) return; // e.g. hc-result (historical-cycles fan chart, deferred)
    const find = (id) => container.querySelector('[id="' + id + '"]');
    const update = () => {
      const vals = {};
      for (const id of c.inputs) { const e = find(id); if (e) vals[id] = e.value; }
      resEl.innerHTML = runCalculator(c.name, vals).html;
    };
    for (const id of c.inputs) { const e = find(id); if (e) { e.addEventListener('input', update); e.addEventListener('change', update); } }
    update();
  });
}
function viewNav() {
  const cur = state.view || 'plan';
  return el('nav', { class: 'viewnav', 'aria-label': 'Sections' }, VIEWS.map((v) => el('button', {
    class: `viewtab${v.id === cur ? ' active' : ''}`, type: 'button', 'data-fk': `view:${v.id}`,
    'aria-current': v.id === cur ? 'page' : null,
    onclick: () => { if ((state.view || 'plan') !== v.id) { state.view = v.id; announce(`Now viewing: ${v.label}`); render(); } },
  }, v.label)));
}
function restoreFocus(root, fk) {
  if (!fk) return;
  const t = [...root.querySelectorAll('[data-fk]')].find((e) => e.getAttribute('data-fk') === fk);
  if (t) try { t.focus(); } catch { /* noop */ }
}
function announce(msg) {
  const live = document.getElementById('sr-live');
  if (live && live.textContent !== msg) live.textContent = msg;
}

function masthead() {
  return el('header', { class: 'masthead' }, [
    el('div', { class: 'eyebrow' }, 'Personal Finance · 2026 · United States · v2 engine'),
    el('h1', { html: 'An ordered path through <em>your money</em>.' }),
    state.started ? el('button', { class: 'ghost', type: 'button', onclick: reset }, '↻ Start over') : null,
  ]);
}

function welcome() {
  return el('section', { class: 'welcome' }, [
    el('h2', { html: 'What should you do <em>next</em>?' }),
    el('p', {}, 'Answer questions about your situation; get a prioritized plan — sequenced by impact and ease, calibrated to your bracket, employment, and stage of life. A provisional plan appears after the first few answers and sharpens as you go.'),
    el('button', { class: 'btn primary', type: 'button', 'data-fk': 'start', onclick: () => { state.started = true; render(); } }, 'Start the diagnostic'),
    el('p', { class: 'fine' }, `About 30–50 questions depending on your situation. Answers stay in this browser only.`),
  ]);
}

// ---- diagnostic ----
function diagnostic() {
  const secs = activeSections();
  const idx = Math.max(0, Math.min(state.sectionIdx, secs.length - 1));
  const sec = secs[idx];
  const qs = activeQuestions(sec);
  const wrap = el('section', { class: 'diagnostic', 'aria-label': 'Diagnostic questions' });
  wrap.append(el('div', { class: 'diag-head' }, [
    el('span', { class: 'diag-step' }, `Section ${idx + 1} of ${secs.length}`),
    el('h2', { class: 'diag-title' }, sec.section),
  ]));
  const bar = el('div', { class: 'progress', role: 'progressbar', 'aria-valuemin': '1', 'aria-valuemax': String(secs.length), 'aria-valuenow': String(idx + 1), 'aria-valuetext': `Section ${idx + 1} of ${secs.length}` }, el('div', { class: 'progress-fill', 'aria-hidden': 'true' }));
  bar.firstChild.style.width = `${((idx + 1) / secs.length) * 100}%`;
  wrap.append(bar);
  announce(`Section ${idx + 1} of ${secs.length}: ${sec.section}`);

  for (const q of qs) wrap.append(question(q));

  const nav = el('div', { class: 'diag-nav' }, [
    el('button', { class: 'btn', type: 'button', 'data-fk': 'nav:back', onclick: () => { state.sectionIdx = Math.max(0, idx - 1); render(); } }, 'Back'),
    el('button', { class: 'btn primary', type: 'button', 'data-fk': 'nav:next', onclick: () => { state.sectionIdx = Math.min(secs.length - 1, idx + 1); render(); } }, idx === secs.length - 1 ? 'Done' : 'Next'),
  ]);
  wrap.append(nav);
  return wrap;
}

function question(q) {
  const labelId = 'ql-' + q.id;
  const multi = q.type === 'multi';
  const node = el('div', { class: 'question' }, [el('div', { class: 'q-label', id: labelId }, q.label)]);
  if (q.help) node.append(el('div', { class: 'q-help', html: q.help }));
  const grid = el('div', { class: 'options', role: multi ? 'group' : 'radiogroup', 'aria-labelledby': labelId });
  for (const opt of q.options) {
    const selected = multi ? (state.answers[q.id] || []).includes(opt.v) : state.answers[q.id] === opt.v;
    grid.append(el('div', {
      class: `option${multi ? ' multi' : ''}${selected ? ' selected' : ''}`,
      role: multi ? 'checkbox' : 'radio', tabindex: '0', 'aria-checked': selected ? 'true' : 'false',
      'data-fk': `opt:${q.id}:${opt.v}`,
      onclick: () => choose(q, opt.v),
      onkeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(q, opt.v); } },
    }, [el('span', { class: 'dot', 'aria-hidden': 'true' }), el('span', {}, opt.l)]));
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
    el('button', { class: 'tool-btn', type: 'button', html: '<span aria-hidden="true">⧉</span> Copy as Markdown', onclick: () => copyText(planToMarkdown(plan)) }),
    el('button', { class: 'tool-btn', type: 'button', html: '<span aria-hidden="true">🖶</span> Print one-pager', onclick: () => window.print() }),
    dated.length ? el('button', { class: 'tool-btn', type: 'button', html: `<span aria-hidden="true">📅</span> ${dated.length} deadline${dated.length === 1 ? '' : 's'} → calendar`, onclick: () => download('finance-plan-deadlines.ics', planToICS(plan), 'text/calendar') }) : null,
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

function flash(msg) { const n = el('div', { class: 'flash', role: 'status', 'aria-live': 'polite' }, msg); document.body.append(n); setTimeout(() => n.remove(), 1800); }
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
  const wrap = el('aside', { class: 'plan', 'aria-label': 'Your prioritized plan' });
  if (!core8Done()) {
    announce(`${answeredCount()} of ${CORE8.length} essentials answered — provisional plan pending`);
    wrap.append(el('div', { class: 'plan-pending' }, [
      el('h2', {}, 'Your plan'),
      el('p', {}, `Answer the first ${CORE8.length} essentials (income, filing, age, bracket, emergency fund, high-interest debt, health coverage, employer match) and a provisional plan appears here — then sharpens with every further answer.`),
      el('div', { class: 'pending-count' }, `${answeredCount()} answered`),
    ]));
    return wrap;
  }
  const plan = buildPlan();
  announce(`Plan updated: ${plan.actions.length} action${plan.actions.length === 1 ? '' : 's'}, ${plan.actions.filter((a) => a.tier1).length} to start this week.`);
  wrap.append(el('div', { class: 'plan-head' }, [
    el('h2', {}, 'Your prioritized plan'),
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
    // Encode urgency in the text, not color alone (WCAG 1.4.1).
    const word = a.deadline.urgency === 'overdue' ? 'Overdue' : a.deadline.urgency === 'critical' ? 'Due soon' : 'Upcoming';
    const lbl = a.deadline.dueDate ? `⏰ ${word} — due ${a.deadline.dueDate}` : `⏰ ${word} — time-critical`;
    tags.push(el('span', { class: `tag deadline ${a.deadline.urgency}` }, lbl));
  }
  if (a.incomeType) tags.push(el('span', { class: 'tag inc' }, { w2: 'W-2', contractor: '1099/SE', business: 'Business' }[a.incomeType]));
  const done = !!state.completions[a.title];
  const card = el('div', { class: `action${isTier1 ? ' t1' : ''}${done ? ' done' : ''}` }, [
    el('label', { class: 'action-check' }, [
      el('input', { type: 'checkbox', 'aria-label': `Mark done: ${a.title}`, 'data-fk': `done:${a.title}`, checked: done ? 'checked' : null, onchange: () => toggleDone(a.title) }),
      el('span', { class: 'check-box', 'aria-hidden': 'true' }),
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
  const bodyId = id + '-body';
  const isOpen = !!state.open[id];
  const label = (open) => (open ? '− Hide why & reference' : '+ Why this matters & reference');
  const inner = (a.reason ? `<div class="why-reason">${a.reason}</div>` : '')
    + (node && node.detailsHtml ? node.detailsHtml : '');
  const btn = el('button', { class: 'detail-toggle', type: 'button', 'aria-expanded': String(isOpen), 'aria-controls': bodyId, 'data-fk': `det:${a.key}`, onclick: (e) => { state.open[id] = !state.open[id]; const open = state.open[id]; e.currentTarget.nextSibling.style.display = open ? 'block' : 'none'; e.currentTarget.setAttribute('aria-expanded', String(open)); e.currentTarget.textContent = label(open); save(); } }, label(isOpen));
  const body = el('div', { class: 'detail', id: bodyId, html: inner });
  body.style.display = isOpen ? 'block' : 'none';
  return el('div', {}, [btn, body]);
}

function toggleDone(title) {
  if (state.completions[title]) delete state.completions[title];
  else state.completions[title] = 'done';
  render();
}

// ---- sensitivity drivers, each expandable into "what if" scenario previews ----
const questionFor = (id) => { for (const s of QUESTIONS.sections) for (const q of s.questions) if (q.id === id) return q; return null; };
const shortLabel = (l) => (l || '').split(/—|\(/)[0].trim();
const optLabel = (q, v) => { const o = ((q && q.options) || []).find((x) => x.v === v); return o ? o.l : String(v); };
function valueLabel(field, value) {
  const q = questionFor(field);
  if (Array.isArray(value)) return value.length ? value.map((v) => shortLabel(optLabel(q, v))).join(' + ') : 'no earned income';
  return shortLabel(optLabel(q, value));
}
const swingDelta = (s) => `${s.added.length ? `+${s.added.length}` : ''}${s.added.length && s.removed.length ? ' / ' : ''}${s.removed.length ? `−${s.removed.length}` : ''}`;

function scenarioRow(f) {
  const q = questionFor(f.field);
  const swings = f.swings.filter((s) => s.delta > 0).slice(0, 4); // already delta-sorted
  const head = el('summary', { class: 'sens-row' }, [
    el('span', { class: 'sens-field' }, q ? q.label : f.field),
    el('span', { class: 'sens-bar' }, el('span', { class: 'sens-fill', style: `width:${Math.min(100, f.impact * 6)}%` })),
    el('span', { class: 'sens-n' }, `${f.impact}`),
  ]);
  const body = swings.length
    ? swings.map((s) => el('div', { class: 'swing' }, [
      el('div', { class: 'swing-q' }, [el('strong', {}, `If ${valueLabel(f.field, s.to)} instead`), el('span', { class: 'swing-delta' }, swingDelta(s))]),
      ...s.added.map((t) => el('div', { class: 'swing-line add' }, `+ ${t}`)),
      ...s.removed.map((t) => el('div', { class: 'swing-line rm' }, `− ${t}`)),
    ]))
    : [el('div', { class: 'fine' }, 'Changing this answer would not change your action set.')];
  return el('details', { class: 'scenario' }, [head, el('div', { class: 'swings' }, body)]);
}

function sensitivityPanel() {
  let ranked;
  try { ranked = sensitivity(effectiveAnswers()).filter((f) => f.impact > 0).slice(0, 5); } catch { ranked = []; }
  if (!ranked.length) return el('div');
  return el('details', { class: 'sensitivity' }, [
    el('summary', {}, 'What drives your plan — and what if you answered differently?'),
    el('p', { class: 'fine' }, 'These answers change the most actions. Expand one to preview the plan under a different answer — a counterfactual; your real answers don’t change.'),
    ...ranked.map((f) => scenarioRow(f)),
  ]);
}

function reset() {
  if (!confirm('Clear all answers and start over?')) return;
  try { localStorage.removeItem(LS_KEY); } catch { /* noop */ }
  location.reload();
}

render();
