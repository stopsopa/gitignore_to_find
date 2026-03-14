import { test } from "node:test";
import assert from "node:assert";
import path from "node:path";
import cmd from "./cmd.ts";

test("cmd utility", async (t) => {
  await t.test("successfully runs a command and captures stdout", async () => {
    const res = await cmd("echo", ["hello world"]);
    assert.strictEqual(res.code, 0);
    assert.strictEqual(res.stdout.trim(), "hello world");
    assert.strictEqual(res.stderr, "");
  });

  await t.test("handles commands with wrong parameters and captures stderr", async () => {
    // "ls -la" works, but "ls --invalid-flag" will fail
    const res = await cmd("ls", ["--invalid-flag"]);
    assert.notStrictEqual(res.code, 0); // usually exits with 1 (or 2 depending on the OS)
    assert.ok(res.stderr.includes("invalid option") || res.stderr.includes("unrecognized option") || res.stderr.includes("illegal option"), "Should contain an error message about invalid input");
    assert.strictEqual(res.stdout, "");
  });

  await t.test("handles non-existent executables gracefully", async () => {
    const res = await cmd("some-non-existent-binary-123456", []);
    assert.notStrictEqual(res.code, 0);
    assert.ok(res.stderr.includes("ENOENT"), "Should contain ENOENT error from child_process");
  });

  await t.test("executes in the correct cwd", async () => {
    const testDir = path.resolve(import.meta.dirname, "../../");
    
    // Instead of looking at `pwd` which could vary with symlinks, let's just run an `ls package.json` in the root of the project
    const res = await cmd("ls", ["package.json"], { cwd: testDir });
    assert.strictEqual(res.code, 0);
    assert.strictEqual(res.stdout.trim(), "package.json");
  });

  await t.test("handles synchronous throw during spawn", async () => {
    // We can force spawn to throw synchronously by passing invalid invalid arguments, e.g. undefined as mainExec
    const res = await cmd(undefined as any, []);
    assert.notStrictEqual(res.code, 0);
    assert.ok(res.stderr.includes("TypeError") || res.stderr.includes("String") || res.stderr.includes("must be"), "Should contain error from synchronous throw");
  });
});
