import { test } from "node:test";
import assert from "node:assert";
import fs from "fs/promises";
import path from "path";
import diskStructuresCreate from "./diskStructuresCreate.ts";
import diskStructuresEmptyDir from "./diskStructuresEmptyDir.ts";
import diskStructuresListDir from "./diskStructuresListDir.ts";
import gitignoreToFind from "./gitignoreToFind.ts";
import cmd from "./cmd.ts";

const th = (msg: string) => `diskStructuresCreate.ts error: ${msg}`;

const rootDir = path.resolve(import.meta.dirname, "../../");

const testDir = path.resolve(rootDir, "var/");

const findScript = path.resolve(import.meta.dirname, "find.sh");

const gitScriptPath = path.resolve(import.meta.dirname, "gitStatus.sh");

function process(stdout: string) {
  return stdout
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .sort();
}

/**
 *                  /bin/bash ts.sh --test src/gitignore_to_find/gitignoreToFind.test.ts
 * NO_COVERAGE=true /bin/bash ts.sh --test src/gitignore_to_find/gitignoreToFind.test.ts
 */
test("gitignoreToFind", async (t) => {
  await t.test("basic", async () => {
    const cwd = path.resolve(testDir, "basic");

    try {
      // making sure directory doesn't exist on start
      await diskStructuresEmptyDir(cwd, true);

      // create initial layout of files in our directory
      await diskStructuresCreate(
        cwd,
        `
abc/test.txt
abc/def/
cde/eft/ppp.txt
`,
      );

      // what we normally should get
      const expected = ["abc/test.txt", "cde/eft/ppp.txt"].sort();

      // list using node.js
      const listTs = await diskStructuresListDir(cwd);

      // check if we get what we expect
      assert.deepStrictEqual(listTs, expected);

      // let's use find wrapper
      const result = await cmd("/bin/bash", [findScript, ".", "-type", "f"], {
        cwd,
        process,
      });

      assert.deepStrictEqual(result, {
        code: 0,
        stderr: "",
        stdout: expected,
      });

      // now let's see what git will show ready for staging
      const gitStatus = await cmd("/bin/bash", [gitScriptPath], {
        cwd,
        process,
      });

      assert.deepStrictEqual(gitStatus, {
        code: 0,
        stderr: "",
        stdout: expected,
      });
    } finally {
      await diskStructuresEmptyDir(cwd, true);
    }
  });
});
