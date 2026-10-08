import assert from 'node:assert/strict';
import { test } from 'node:test';
test('temporary EPIC-01 merge protection probe', () => assert.fail('intentional failure to verify required checks'));
