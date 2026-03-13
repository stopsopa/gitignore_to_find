import { test } from "node:test";
import assert from "node:assert/strict";

/**
 * /bin/bash ts.sh --test src/test-examples/test.test.ts
 */

test("strictEqual", () => {
  const arr = [1, 2];

  assert.strictEqual(arr, arr); // ✅ passes

  //   assert.equal(1, "1"); // ✅ passes
  /**
         // test at src/test.test.ts:5:1
        // ✖ strictEqual (1.212458ms)
        // AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
        // 1 !== '1'
        // when: import assert from 'node:assert/strict';
   */

  // assert.strictEqual([1, 2], [1, 2]); // ❌ fails
});
test("deepStrictEqual", () => {
  const arr = [1, 2];

  assert.deepStrictEqual(arr, arr); // ✅ passes

  assert.deepStrictEqual([1, 2], [1, 2]); // ✅ passes
});
