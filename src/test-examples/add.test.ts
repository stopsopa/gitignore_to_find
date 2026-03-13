import { test } from "node:test";
import assert from "node:assert";
import { sum } from "./add.js";

/**
 * /bin/bash ts.sh --test src/test-examples/add.test.ts
 */
test("sum function", () => {
  assert.strictEqual(sum(1, 2), 3);
});
