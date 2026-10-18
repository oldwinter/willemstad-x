/**
 * tests/docs-claims.test.mjs — prose may not restate facts a machine computes.
 *
 * Why this exists: `tests/README.md` and `docs/ARCHITECTURE.md` used to copy the
 * theme.css baseline hash and the per-file test counts into prose. Both went stale
 * when the defects were fixed — `docs/ARCHITECTURE.md` ended up claiming a "current
 * SHA-256" that `build.test.mjs` does not pin. A reader who trusts the doc would
 * "fix" the one correct baseline. The rule is therefore *do not copy*, not *copy
 * and proofread*. Single sources:
 *
 *   baseline hash / byte size   ->  tests/build.test.mjs  (THEME_SHA256, THEME_BYTES)
 *   test file and case counts   ->  the directory itself, and `pnpm test`'s output
 *
 * `docs/KNOWN-ISSUES.md` is deliberately not scanned: it is a historical log, so
 * the hashes and counts in it are records of what was true at the time.
 *
 * The rule is also stated for contributors in AGENTS.md ("写文档").
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { ROOT, rel } from './helpers/css.mjs';

/** Prose that people and agents read as fact. */
function proseFiles() {
  const docs = readdirSync(path.join(ROOT, 'docs'))
    .filter((f) => f.endsWith('.md') && f !== 'KNOWN-ISSUES.md')
    .map((f) => `docs/${f}`);
  const skillDocs = readdirSync(path.join(ROOT, '.cursor', 'skills', 'verify-willemstad'), { recursive: true })
    .map((f) => String(f).replace(/\\/g, '/'))
    .filter((f) => f.endsWith('.md'))
    .map((f) => `.cursor/skills/verify-willemstad/${f}`);
  return ['README.md', 'CONTRIBUTING.md', 'AGENTS.md', 'tests/README.md', ...skillDocs, ...docs];
}

const HASH_RE = /\b[0-9a-f]{64}\b/g;
/** "93 tests", "10 个测试文件、93 个用例", "93 通过 / 0 失败". */
const COUNT_WORDS_RE = /\d+\s*(?:个)?\s*(?:用例|测试文件|tests?\b|通过)/g;
/** Counts attached to a file name: `build.test.mjs  (7)` or `| build.test.mjs | 7 |`. */
const COUNT_NEAR_FILE_RE = /\.test\.mjs`?[^\n]{0,32}?(?:\(\d+\)|\|\s*\d+\s*\|)/g;

for (const file of proseFiles()) {
  const text = readFileSync(path.join(ROOT, file), 'utf8');

  test(`${file} does not restate the baseline hash`, () => {
    const found = text.match(HASH_RE) ?? [];
    assert.deepEqual(
      found,
      [],
      `${file} contains a 64-hex digest:\n  ${found.join('\n  ')}\n` +
        'The baseline lives in exactly one place: the THEME_SHA256 / PUBLISH_SHA256 constants in\n' +
        'tests/build.test.mjs. Point at them ("the baseline is pinned in tests/build.test.mjs")\n' +
        'instead of copying the value — a copied hash silently becomes a wrong hash.\n' +
        'docs/KNOWN-ISSUES.md is exempt: it is a historical log.',
    );
  });

  test(`${file} does not restate test counts`, () => {
    const found = [...(text.match(COUNT_WORDS_RE) ?? []), ...(text.match(COUNT_NEAR_FILE_RE) ?? [])];
    assert.deepEqual(
      found,
      [],
      `${file} states a test count:\n  ${found.join('\n  ')}\n` +
        'Counts drift on the next commit that adds a case. The runner prints the real number\n' +
        '(`pnpm test`) and the directory decides the file count; drop the number and point at\n' +
        'the runner or at tests/README.md instead.',
    );
  });
}
