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

async function commonLogic({
  testDirectory,
  diskStructure,
  gitignore,
  expectedFindArgs,
  expectedJs,
  expectedGit,
  expectedFind,
}: {
  testDirectory: string;
  diskStructure: string;
  gitignore: string;
  expectedFindArgs: string[];
  expectedJs: string[];
  expectedGit: string[];
  expectedFind: string[];
}) {
  const cwd = path.resolve(testDir, testDirectory);

  try {
    // making sure directory doesn't exist on start
    await diskStructuresEmptyDir(cwd, true);

    // create initial layout of files in our directory
    await diskStructuresCreate(cwd, diskStructure);

    // create gitignore file in cwd with content 'test.txt\n# comment\n'
    await fs.writeFile(path.resolve(cwd, ".gitignore"), gitignore);

    // list using node.js
    const listTs = await diskStructuresListDir(cwd);
    assert.deepStrictEqual(listTs, expectedJs.sort());

    // list using git
    const gitStatus = await cmd("/bin/bash", [gitScriptPath], {
      cwd,
      process,
    });
    assert.deepStrictEqual(gitStatus, {
      code: 0,
      stderr: "",
      stdout: expectedGit.sort(),
    });

    const findArgs = await gitignoreToFind(gitignore);

    assert.deepStrictEqual(findArgs, expectedFindArgs);

    // list using find
    const result = await cmd(
      "/bin/bash",
      [findScript, ".", "-type", "f", ...findArgs],
      {
        cwd,
        process,
      },
    );
    assert.deepStrictEqual(result, {
      code: 0,
      stderr: "",
      stdout: expectedFind.sort(),
    });
  } finally {
    await diskStructuresEmptyDir(cwd, true);
  }
}

/**
 *                  /bin/bash ts.sh --test src/gitignore_to_find/gitignoreToFind.test.ts
 * NO_COVERAGE=true /bin/bash ts.sh --test src/gitignore_to_find/gitignoreToFind.test.ts
 */
test("gitignoreToFind", async (t) => {
  await t.test("basic", async () => {
    await commonLogic({
      testDirectory: "basic",
      diskStructure: `
abc/test.txt
abc/def/
cde/eft/ppp.txt
`,
      gitignore: `
test.txt
# comment
`,
      expectedFindArgs: ["-not", "-path", "test.txt"],
      expectedJs: ["abc/test.txt", "cde/eft/ppp.txt", ".gitignore"],
      expectedGit: ["cde/eft/ppp.txt", ".gitignore"],
      expectedFind: ["abc/test.txt", "cde/eft/ppp.txt", ".gitignore"],
    });
  });
});
