#!/usr/bin/env node
// gen-plan-fixtures.mjs — capture the computePlan GOLDEN MASTER from
// main:v1/flowchart.html. Output: tests/fixtures/plan-golden.json — a corpus of
// answer vectors, each with the live engine's behavior fingerprint. This is the
// parity gate (V2_REBUILD_PLAN.md §2.3): the v2 rule engine must reproduce these
// fingerprints exactly. Characterize-before-refactor — capture v1 now, check v2
// against it later.
//
// Corpus = ~15 named, human-meaningful archetypes (the 5 audit personas as
// households + common types) + a large SEEDED-RANDOM sample over the 44 fields
// computePlan reads, so edge interactions the archetypes miss are still covered.
//
// Usage: node tools/gen-plan-fixtures.mjs [--random=N]

import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadPlanEngine } from './lib/load-plan-engine.mjs';
import { planLogic, logicHash, fullHash } from './lib/plan-fingerprint.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(process.argv.slice(2).map((a) => { const m = a.match(/^--([^=]+)=(.*)$/); return m ? [m[1], m[2]] : [a.replace(/^--/, ''), true]; }));
const N_RANDOM = Number(args.random || 3000);

const engine = loadPlanEngine();

// Derive the input-field domains from committed sources (no checked-in derived
// file): FIELDS = the answer fields computePlan reads (parsed from main's
// computePlan body); domains = each field's option values from questions.json.
function inputDomains() {
  let src;
  try { src = execSync('git show main:v1/flowchart.html', { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 }).toString('utf8'); }
  catch { src = readFileSync(join(ROOT, 'flowchart.html'), 'utf8'); }
  const s = src.indexOf('function computePlan() {');
  const e = src.indexOf('return { actions, skipped, tier1 };', s);
  const body = src.slice(s, e);
  const fields = [...new Set([...body.matchAll(/\ba\.([a-zA-Z][a-zA-Z0-9]*)/g)].map((m) => m[1]))].sort();
  const q = JSON.parse(readFileSync(join(ROOT, 'src', 'content', 'questions.json'), 'utf8'));
  const optById = {};
  q.sections.forEach((sec) => sec.questions.forEach((qq) => { optById[qq.id] = qq.options.map((o) => o.v); }));
  const dom = {};
  for (const f of fields) { if (optById[f]) dom[f] = optById[f]; }
  const missing = fields.filter((f) => !optById[f]);
  if (missing.length) throw new Error(`computePlan reads fields not in questions.json: ${missing.join(', ')}`);
  return dom;
}
const domains = inputDomains();
const FIELDS = Object.keys(domains);

// ---- Named archetypes (reviewable; cover the framework's main population) ----
const ARCHETYPES = {
  'persona-taxatty-high-SE-equity': { incomeTypes: ['business'], filingStatus: 'mfj', taxBracket: 'high', ageBracket: '40-49', budgetTracking: 'yes', quarterlyTaxes: 'yes', restrictedStockRecent: 'yes', emergencyFund: '6-12mo', healthInsurance: 'yes', sePlan: 'yes', sePlanMaxed: 'partial', entityStructure: 's-corp', dependents: 'yes', termLifeInPlace: 'yes', ltdInPlace: 'yes', netWorth: '2m+', estateDocs: 'outdated', iraMaxed: 'yes', tradIraBalance: 'no', exitTimeline: '3-10' },
  'persona-cfp-midlife-mfj': { incomeTypes: ['w2'], filingStatus: 'mfj', taxBracket: 'mid', ageBracket: '40-49', budgetTracking: 'yes', emergencyFund: '3-6mo', healthInsurance: 'yes', employerMatch: 'yes', matchCaptured: 'yes', autoEscalation: 'yes-not-enabled', hdhpEligible: 'yes', hsaMaxed: 'partial', iraMaxed: 'partial', k401Maxed: 'no', dependents: 'yes', termLifeInPlace: 'partial', ltdInPlace: 'partial', childrenEducation: 'yes', netWorth: '500k-2m', yearsToRetirement: '20-30' },
  'persona-academic-fire': { incomeTypes: ['w2'], filingStatus: 'single', taxBracket: 'high', ageBracket: '30-39', budgetTracking: 'yes', emergencyFund: '12+mo', healthInsurance: 'yes', employerMatch: 'yes', matchCaptured: 'yes', k401Maxed: 'yes', iraMaxed: 'yes', hdhpEligible: 'yes', hsaMaxed: 'yes', dependents: 'no', netWorth: '500k-2m', yearsToRetirement: '10-20', riskCapacity: 'add-equity', riskCapacityRevealed: 'added-equity' },
  'persona-behavioral-anxious': { incomeTypes: ['w2'], filingStatus: 'single', taxBracket: 'mid', ageBracket: 'under-30', budgetTracking: 'sometimes', emergencyFund: '<1mo', healthInsurance: 'yes', employerMatch: 'yes', matchCaptured: 'no', autoEscalation: 'unsure', highInterestDebt: 'yes', federalStudentLoans: 'yes', pslfEligible: 'no', studentLoanAudited: 'never', currentIDRPlan: 'unsure', dependents: 'no', netWorth: 'negative', riskCapacity: 'move-to-cash', riskCapacityRevealed: 'moved-to-cash' },
  'persona-consumer-advocate-lowbracket': { incomeTypes: ['w2'], filingStatus: 'hoh', taxBracket: 'low', ageBracket: '30-39', budgetTracking: 'no', emergencyFund: '0', healthInsurance: 'no', employerMatch: 'no', highInterestDebt: 'yes', incomeStability: 'variable', federalStudentLoans: 'yes', pslfEligible: 'unsure', studentLoanAudited: 'never', currentIDRPlan: 'save-forbearance', dependents: 'yes', netWorth: 'negative' },
  'fresh-grad-w2': { incomeTypes: ['w2'], filingStatus: 'single', taxBracket: 'low', ageBracket: 'under-30', budgetTracking: 'no', emergencyFund: '0', healthInsurance: 'minimal', employerMatch: 'yes', matchCaptured: 'no', highInterestDebt: 'yes', federalStudentLoans: 'yes', pslfEligible: 'no', studentLoanAudited: 'never', currentIDRPlan: 'standard', dependents: 'no', netWorth: 'under-100k', yearsToRetirement: '30+' },
  'solo-contractor-new': { incomeTypes: ['contractor'], filingStatus: 'single', taxBracket: 'mid', ageBracket: '30-39', budgetTracking: 'yes', quarterlyTaxes: 'no', emergencyFund: '1-3mo', healthInsurance: 'minimal', incomeStability: 'concentrated', sePlan: 'no', businessInsurance: 'no', entityStructure: 'sole-prop', dependents: 'no', netWorth: 'under-100k' },
  'dink-mfj-highearners': { incomeTypes: ['w2'], filingStatus: 'mfj', taxBracket: 'high', ageBracket: '30-39', budgetTracking: 'yes', emergencyFund: '6-12mo', healthInsurance: 'yes', employerMatch: 'yes', matchCaptured: 'yes', k401Maxed: 'yes', iraMaxed: 'yes', tradIraBalance: 'yes', hdhpEligible: 'yes', hsaMaxed: 'yes', dependents: 'no', netWorth: '500k-2m', spousalIncomeSplit: '50-50', yearsToRetirement: '20-30' },
  'near-retiree-rothladder': { incomeTypes: ['w2'], filingStatus: 'mfj', taxBracket: 'high', ageBracket: '60-63', budgetTracking: 'yes', emergencyFund: '12+mo', healthInsurance: 'yes', employerMatch: 'yes', matchCaptured: 'yes', k401Maxed: 'yes', iraMaxed: 'yes', dependents: 'no', netWorth: '2m+', yearsToRetirement: '<5', spousalIncomeSplit: '70-30', rothLadderCandidate: 'yes-window', estateDocs: 'yes' },
  'already-retired': { incomeTypes: ['retired'], filingStatus: 'mfj', taxBracket: 'mid', ageBracket: 'retired', budgetTracking: 'yes', emergencyFund: '12+mo', healthInsurance: 'yes', dependents: 'no', netWorth: '500k-2m', yearsToRetirement: 'already', spousalIncomeSplit: 'sole', rothLadderCandidate: 'yes-no-window', estateDocs: 'yes' },
  'business-owner-exit': { incomeTypes: ['business'], filingStatus: 'mfj', taxBracket: 'high', ageBracket: '50-59', budgetTracking: 'yes', quarterlyTaxes: 'yes', emergencyFund: '6-12mo', healthInsurance: 'yes', sePlan: 'yes', sePlanMaxed: 'yes', businessInsurance: 'yes', entityStructure: 's-corp', exitTimeline: 'within-3', dependents: 'yes', termLifeInPlace: 'yes', ltdInPlace: 'yes', netWorth: '2m+', rentalRealEstate: 'long-term-rentals', parentCare: 'yes-substantial' },
  'str-explorer-w2': { incomeTypes: ['w2'], filingStatus: 'mfj', taxBracket: 'high', ageBracket: '40-49', budgetTracking: 'yes', emergencyFund: '6-12mo', healthInsurance: 'yes', employerMatch: 'yes', matchCaptured: 'yes', dependents: 'yes', termLifeInPlace: 'yes', ltdInPlace: 'yes', netWorth: '500k-2m', rentalRealEstate: 'str-exploring', moderateDebt: 'yes' },
  'multi-income-w2-1099': { incomeTypes: ['w2', 'contractor'], filingStatus: 'mfj', taxBracket: 'high', ageBracket: '40-49', budgetTracking: 'yes', quarterlyTaxes: 'no', emergencyFund: '3-6mo', healthInsurance: 'yes', employerMatch: 'yes', matchCaptured: 'partial', sePlan: 'no', dependents: 'yes', termLifeInPlace: 'partial', ltdInPlace: 'partial', netWorth: '500k-2m' },
  'empty-answers': {},
  'income-only': { incomeTypes: ['w2'], taxBracket: 'mid' },
};

// ---- Seeded PRNG (mulberry32) — reproducible without Math.random ----
function mulberry32(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const rng = mulberry32(0xC0FFEE);
const pick = (arr) => arr[Math.floor(rng() * arr.length)];
function subsetNonEmpty(values) {
  let s = values.filter(() => rng() < 0.5);
  if (s.length === 0) s = [pick(values)];
  return s;
}
function randomAnswers() {
  const a = {};
  for (const f of FIELDS) {
    if (rng() < 0.25) continue; // ~25% of fields unanswered (partial completion)
    if (f === 'incomeTypes') a[f] = subsetNonEmpty(domains[f]);
    else a[f] = pick(domains[f]);
  }
  return a;
}

// ---- Build corpus + capture golden fingerprints ----
// Per fixture we store the compact `logicHash` (the v2 parity key). For the
// named archetypes we ALSO store the full readable `logic` + `fullHash` so the
// expected plans are human-reviewable and v1 drift is detectable. This keeps the
// golden file small (hashes, not full fingerprints, for the 3000 random ones).
const archetypeFixtures = [];
const randomFixtures = [];
const seenTitles = new Set();
function record(name, answers, isArchetype) {
  const plan = engine.computePlan(answers);
  const logic = planLogic(plan);
  logic.actions.forEach((x) => seenTitles.add(x.title));
  logic.skipped.forEach((t) => seenTitles.add(t));
  const entry = { name, answers, logicHash: logicHash(plan) };
  if (isArchetype) { entry.logic = logic; entry.fullHash = fullHash(plan); archetypeFixtures.push(entry); }
  else randomFixtures.push(entry);
}
for (const [name, answers] of Object.entries(ARCHETYPES)) record(name, answers, true);
for (let i = 0; i < N_RANDOM; i++) record(`random-${String(i).padStart(5, '0')}`, randomAnswers(), false);
const fixtures = [...archetypeFixtures, ...randomFixtures];

const meta = {
  generatedFrom: 'main:v1/flowchart.html computePlan()',
  generatedNote: 'GOLDEN MASTER — the v2 rule engine must reproduce every fixture\'s logicHash. Regenerate only when v1 behavior intentionally changes.',
  fields: FIELDS,
  archetypeCount: Object.keys(ARCHETYPES).length,
  randomCount: N_RANDOM,
  distinctTitles: seenTitles.size,
};
mkdirSync(join(ROOT, 'tests', 'fixtures'), { recursive: true });

// Committed: archetypes only — full readable logic, the human-reviewable contract (small).
writeFileSync(
  join(ROOT, 'tests', 'fixtures', 'plan-golden-archetypes.json'),
  JSON.stringify({ ...meta, kind: 'archetypes', fixtures: archetypeFixtures }, null, 2) + '\n'
);
// Git-ignored: full corpus (archetypes hashes + 3000 random) — the exhaustive
// parity gate; deterministic, regenerate on demand.
writeFileSync(
  join(ROOT, 'tests', 'fixtures', 'plan-golden.json'),
  JSON.stringify({ ...meta, kind: 'full', fixtureCount: fixtures.length, fixtures: fixtures.map((f) => ({ name: f.name, answers: f.answers, logicHash: f.logicHash })) }) + '\n'
);
console.log(`golden master: ${fixtures.length} fixtures (${meta.archetypeCount} archetypes + ${N_RANDOM} random)`);
console.log(`distinct action/skip titles exercised: ${seenTitles.size} (vs 63 add + 25 skip branches in computePlan)`);
console.log(`wrote tests/fixtures/plan-golden-archetypes.json (committed) + plan-golden.json (gitignored)`);
