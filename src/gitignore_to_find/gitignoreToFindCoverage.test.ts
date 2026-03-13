import { test } from "node:test";
import assert from "node:assert";
import gitignoreToFind from "./gitignoreToFind.ts";

test("gitignoreToFind - Coverage Improvement", async (t) => {
  await t.test("debug logging", async () => {
    // Capture console.log output
    const originalLog = console.log;
    let logged = false;
    console.log = () => {
      logged = true;
    };

    try {
      await gitignoreToFind("node_modules/", { debug: true });
      assert.strictEqual(logged, true, "Should have logged when debug is true");
    } finally {
      console.log = originalLog;
    }
  });

  await t.test("quoteWithSpaces: true (default)", async () => {
    const args = await gitignoreToFind("path with space/", { quoteWithSpaces: true, quoteStars: false });
    // path with space/ becomes */path with space
    assert.ok(args.includes('"*/path with space"'), "Should quote arguments containing spaces");
  });

  await t.test("quoteWithSpaces: false", async () => {
    const args = await gitignoreToFind("path with space/", { quoteWithSpaces: false, quoteStars: false });
    assert.ok(args.includes("*/path with space"), "Should not quote arguments containing spaces when disabled");
    assert.ok(!args.includes('"*/path with space"'));
  });

  await t.test("quoteStars: true (default)", async () => {
    const args = await gitignoreToFind("*.log", { quoteStars: true, quoteWithSpaces: false });
    // *.log becomes */*.log
    assert.ok(args.includes('"*/*.log"'), "Should quote arguments containing stars");
  });

  await t.test("quoteStars: false", async () => {
    const args = await gitignoreToFind("*.log", { quoteStars: false, quoteWithSpaces: false });
    assert.ok(args.includes("*/*.log"), "Should not quote arguments containing stars when disabled");
    assert.ok(!args.includes('"*/*.log"'));
  });

  await t.test("slashBrackets: true (default)", async () => {
    const args = await gitignoreToFind("node_modules/\n!node_modules/foo.txt", {
      slashBrackets: true
    });
    // This will trigger brackets like ( ! -path */node_modules -o -path */node_modules/foo.txt )
    // Actually, I need to check how brackets are generated in gitignoreToFind.ts
    // Ifbrackets.length > 0, it adds "(" and ")"
    // And if slashBrackets is true, it replaces "(" with "\(" and ")" with "\)"

    const result = await gitignoreToFind("node_modules/\n!node_modules/foo.txt", { slashBrackets: true });
    assert.ok(result.includes("\\("), "Should slash-escape opening brackets");
    assert.ok(result.includes("\\)"), "Should slash-escape closing brackets");
  });

  await t.test("slashBrackets: false", async () => {
    const result = await gitignoreToFind("node_modules/\n!node_modules/foo.txt", { slashBrackets: false });
    assert.ok(result.includes("("), "Should not escape opening brackets when disabled");
    assert.ok(result.includes(")"), "Should not escape closing brackets when disabled");
    assert.ok(!result.includes("\\("));
    assert.ok(!result.includes("\\)"));
  });

  await t.test("quoteStars should not double quote if already quoted", async () => {
     // This test targets this line: if (arg.startsWith('"') && arg.endsWith('"')) { return arg; }
     // This happens if quoteWithSpaces already quoted it.
     const args = await gitignoreToFind("*.log with spaces", { quoteWithSpaces: true, quoteStars: true });
     // "*/"/*.log with spaces" should NOT happen. It should be "*/"*.log with spaces"
     // wait, let's see logic:
     // quoteWithSpaces runs first.
     // It quotes if includes space.
     // Then quoteStars runs.
     // If it starts/ends with ", it returns arg.
     assert.ok(args.includes('"*/*.log with spaces"'));
  });
});
