// rank-options.test.mjs — contract test for the /brain priority bridge shim.
// Run: `node --test bin/rank-options.test.mjs`
//
// NOT skip-gated (the Python side's bridge test is @skipif-Node): this locks the
// load-bearing coupling — the settlement OPTION_ANCHORS titles must prefix-match
// impact.json so impactBand returns the right band — on the JS side, where CI runs it.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const SHIM = join(dirname(fileURLToPath(import.meta.url)), 'rank-options.mjs');

function runShim(inputObjOrString) {
  return new Promise((resolve) => {
    const p = spawn('node', [SHIM]);
    let out = '', err = '';
    p.stdout.on('data', (d) => (out += d));
    p.stderr.on('data', (d) => (err += d));
    p.on('close', (code) => resolve({ code, out, err }));
    if (inputObjOrString !== undefined) {
      p.stdin.write(typeof inputObjOrString === 'string' ? inputObjOrString : JSON.stringify(inputObjOrString));
    }
    p.stdin.end();
  });
}

// The exact anchors settlement.py sends (OPTION_ANCHORS).
const ANCHORS = {
  'pay-debt': 'Eliminate high-interest debt (above ~7% after tax)',
  'cash-buffer': 'Build your full emergency fund',
  'brokerage': 'Open a taxable brokerage with asset-location-optimized holdings',
};

test('resolves each settlement anchor title to its expected impact band', async () => {
  const options = Object.entries(ANCHORS).map(([name, title]) => ({ name, title }));
  const { code, out } = await runShim({ today: '2026-07-02', options });
  assert.equal(code, 0);
  const byName = Object.fromEntries(JSON.parse(out).options.map((o) => [o.name, o]));
  assert.equal(byName['pay-debt'].band, 'high');
  assert.equal(byName['cash-buffer'].band, 'med');
  assert.equal(byName['brokerage'].band, 'low');
  for (const o of Object.values(byName)) {
    assert.equal(typeof o.priorityScore, 'number');
    assert.ok([0, 1, 2].includes(o.overrideTier));
  }
});

test('an unbanded title degrades to med (matches impactBand default)', async () => {
  const { code, out } = await runShim({ options: [{ name: 'x', title: 'some title with no impact.json entry' }] });
  assert.equal(code, 0);
  assert.equal(JSON.parse(out).options[0].band, 'med');
});

test('empty stdin exits 2', async () => {
  const { code } = await runShim('');
  assert.equal(code, 2);
});

test('empty options array exits 2', async () => {
  const { code } = await runShim({ options: [] });
  assert.equal(code, 2);
});

test('invalid JSON exits 2', async () => {
  const { code } = await runShim('{not json');
  assert.equal(code, 2);
});
