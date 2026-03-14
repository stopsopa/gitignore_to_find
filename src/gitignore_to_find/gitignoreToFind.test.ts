import { test } from "node:test";
import assert from "node:assert";
import fs from "fs/promises";
import path from "path";
import diskStructuresCreate from "./diskStructuresCreate.ts";
import diskStructuresEmptyDir from "./diskStructuresEmptyDir.ts";
import diskStructuresListDir from "./diskStructuresListDir.ts";
import cmd from "./cmd.ts";

const th = (msg: string) => `diskStructuresCreate.ts error: ${msg}`;

const rootDir = path.resolve(import.meta.dirname, "../../");

const testDir = path.resolve(rootDir, "var/");

const scriptPath = path.resolve(import.meta.dirname, "find.sh");

/**
 * /bin/bash ts.sh --test src/gitignore_to_find/gitignoreToFind.test.ts
 */
test("gitignoreToFind", async (t) => {
  await t.test("basic", async () => {
    const cwd = path.resolve(testDir, "basic");

    try {
      await diskStructuresCreate(
        cwd,
        `
abc/test.txt
abc/def/
cde/eft/ppp.txt
`,
      );

      const expected = ["abc/test.txt", "cde/eft/ppp.txt"].sort();

      const listTs = await diskStructuresListDir(cwd);

      assert.deepStrictEqual(listTs, expected);

      const result = await cmd("/bin/bash", [scriptPath, ".", "-type", "f"], {
        cwd,
      });

      //   console.log(JSON.stringify(result, null, 2));

      assert.equal(result.code, 0);

      const stdoutLines = result.stdout.split("\n").filter(Boolean).sort();

      assert.deepStrictEqual(stdoutLines, expected);
    } finally {
      await diskStructuresEmptyDir(cwd, true);
    }
  });
});
