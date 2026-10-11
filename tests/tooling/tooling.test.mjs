import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('package scripts expose the CMS typecheck, test, build, and check commands', () => {
  const packageJson = JSON.parse(fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
  assert.equal(packageJson.scripts.typecheck, 'tsc --noEmit');
  assert.equal(packageJson.scripts.test, 'vitest run');
  assert.equal(packageJson.scripts.build, 'node scripts/build-content.mjs');
  assert.equal(packageJson.scripts.check, 'npm run typecheck && npm test -- --run');
  assert.equal(packageJson.cmsBuildOutput, 'content-runtime.js');
});
