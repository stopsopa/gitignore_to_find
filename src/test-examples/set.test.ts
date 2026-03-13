import { test } from "node:test";
import assert from "node:assert/strict";
import { TagManager } from "./set.js";

/**
 * /bin/bash ts.sh --test src/test-examples/set.test.ts
 */
test("TagManager (Set usage)", () => {
  const manager = new TagManager();

  // Test addTag (should handle duplicates and normalization)
  manager.addTag("TypeScript");
  manager.addTag("typescript "); // Normalized to 'typescript'
  manager.addTag("JAVASCRIPT");

  assert.strictEqual(manager.count, 2);
  assert.strictEqual(manager.hasTag("typescript"), true);
  assert.strictEqual(manager.hasTag("TYPESCRIPT"), true);
  assert.strictEqual(manager.hasTag("javascript"), true);

  // Test getTags
  assert.deepStrictEqual(manager.getTags().sort(), [
    "javascript",
    "typescript",
  ]);

  // Test getIntersection
  const common = manager.getIntersection([
    "typescript",
    "python",
    "javascript",
  ]);
  assert.deepStrictEqual(common.sort(), ["javascript", "typescript"]);

  // Test removeTag
  const removed = manager.removeTag("typescript");
  assert.strictEqual(removed, true);
  assert.strictEqual(manager.count, 1);
  assert.strictEqual(manager.hasTag("typescript"), false);

  // Test clear
  manager.clear();
  assert.strictEqual(manager.count, 0);
});
