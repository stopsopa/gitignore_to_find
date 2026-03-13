import { test } from "node:test";
import assert from "node:assert/strict";
import { UserRegistry } from "./map.js";

/**
 * /bin/bash ts.sh --test src/test-examples/map.test.ts
 */
test("UserRegistry (Map usage)", () => {
  const registry = new UserRegistry();

  // Test addUser and getUser
  registry.addUser(1, "Alice");
  registry.addUser(2, "Bob");
  assert.strictEqual(registry.getUser(1), "Alice");
  assert.strictEqual(registry.getUser(2), "Bob");

  // Test totalUsers (size)
  assert.strictEqual(registry.totalUsers, 2);

  // Test hasUser
  assert.strictEqual(registry.hasUser(1), true);
  assert.strictEqual(registry.hasUser(3), false);

  // Test getAllUserNames and getAllUserIds
  assert.deepStrictEqual(registry.getAllUserNames(), ["Alice", "Bob"]);
  assert.deepStrictEqual(registry.getAllUserIds(), [1, 2]);

  // Test removeUser
  const removed = registry.removeUser(1);
  assert.strictEqual(removed, true);
  assert.strictEqual(registry.hasUser(1), false);
  assert.strictEqual(registry.totalUsers, 1);

  // Test clearRegistry
  registry.clearRegistry();
  assert.strictEqual(registry.totalUsers, 0);
});
