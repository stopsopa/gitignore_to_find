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
    await diskStructuresCreate(cwd, trimLines(diskStructure));

    // create gitignore file in cwd with content 'test.txt\n# comment\n'
    await fs.writeFile(path.resolve(cwd, ".gitignore"), trimLines(gitignore));

    // list using node.js
    const listTs = await diskStructuresListDir(cwd);
    assert.deepStrictEqual(listTs.sort(), expectedJs.sort());

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

    const findArgs = await gitignoreToFind(gitignore, {
      quoteStars: false,
      quoteWithSpaces: false,
      slashBrackets: false,
    });

    // console.log(JSON.stringify({ findArgs, expectedFindArgs }, null, 2));
    assert.deepStrictEqual(findArgs, expectedFindArgs);

    // list using find
    const result = await cmd("/bin/bash", [findScript, ".", ...findArgs], {
      cwd,
      process,
    });
    // console.log(JSON.stringify({ result }, null, 2));
    assert.deepStrictEqual(result, {
      code: 0,
      stderr: "",
      stdout: expectedFind.sort(),
    });
  } finally {
    await diskStructuresEmptyDir(cwd);
  }
}

function trimLines(str: string) {
  return str
    .split("\n")
    .map((s) => s.trim())
    .join("\n");
}

/**
 *                  /bin/bash ts.sh --test src/gitignore_to_find/gitignoreToFind.test.ts
 * NO_COVERAGE=true /bin/bash ts.sh --test src/gitignore_to_find/gitignoreToFind.test.ts
 */
test("gitignoreToFind", async (t) => {
  await t.test("don't exclude git", async () => {
    await commonLogic({
      testDirectory: "nested_path_with_slash",
      diskStructure: `
    abc.txt
        `,
      gitignore: `
    abc.txt
        `,
      expectedJs: [".gitignore", "abc.txt"],
      expectedGit: [".gitignore"],
      expectedFind: [
        ".git/HEAD",
        ".git/config",
        ".git/description",
        ".git/hooks/applypatch-msg.sample",
        ".git/hooks/commit-msg.sample",
        ".git/hooks/fsmonitor-watchman.sample",
        ".git/hooks/post-update.sample",
        ".git/hooks/pre-applypatch.sample",
        ".git/hooks/pre-commit.sample",
        ".git/hooks/pre-merge-commit.sample",
        ".git/hooks/pre-push.sample",
        ".git/hooks/pre-rebase.sample",
        ".git/hooks/pre-receive.sample",
        ".git/hooks/prepare-commit-msg.sample",
        ".git/hooks/push-to-checkout.sample",
        ".git/hooks/sendemail-validate.sample",
        ".git/hooks/update.sample",
        ".git/info/exclude",
        ".gitignore",
      ],
      expectedFindArgs: [
        "-path",
        "*/abc.txt",
        "-prune",
        "-o",
        "-type",
        "f",
        "-print",
      ],
    });
  });
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
      /.git/
      # comment
        `,
      expectedJs: ["abc/test.txt", "cde/eft/ppp.txt", ".gitignore"],
      expectedGit: ["cde/eft/ppp.txt", ".gitignore"],
      expectedFind: ["cde/eft/ppp.txt", ".gitignore"],
      expectedFindArgs: [
        "-path",
        "*/test.txt",
        "-prune",
        "-o",
        "-path",
        "./.git",
        "-prune",
        "-o",
        "-type",
        "f",
        "-print",
      ],
    });
  });

  await t.test("multiple files by the same name", async () => {
    await commonLogic({
      testDirectory: "multiple_files_by_the_same_name",
      diskStructure: `
        abc.txt
        test.txt
        abc/test.txt
        abc/def/
        abc/ddd.txt
        cde/ddd/test.txt
        cde/eft/ppp.txt
        `,
      gitignore: `
    .git/
    test.txt
    # comment
        `,
      expectedJs: [
        ".gitignore",
        "abc/ddd.txt",
        "abc/test.txt",
        "abc.txt",
        "cde/ddd/test.txt",
        "cde/eft/ppp.txt",
        "test.txt",
      ],
      expectedGit: [".gitignore", "abc.txt", "abc/ddd.txt", "cde/eft/ppp.txt"],
      expectedFind: [".gitignore", "abc.txt", "abc/ddd.txt", "cde/eft/ppp.txt"],
      expectedFindArgs: [
        "-path",
        `*/.git`,
        "-prune",
        "-o",
        "-path",
        `*/test.txt`,
        "-prune",
        "-o",
        "-type",
        "f",
        "-print",
      ],
    });
  });
  await t.test("nested path with slash", async () => {
    await commonLogic({
      testDirectory: "nested_path_with_slash",
      diskStructure: `
      var/abc/ttt/test.txt
      var/abc/zzz/ttt/test.txt
      var/abc/zzz/test.txt
        `,
      gitignore: `
      .git
      ttt/test.txt
        `,
      expectedJs: [
        ".gitignore",
        "var/abc/zzz/test.txt",
        "var/abc/zzz/ttt/test.txt",
        "var/abc/ttt/test.txt",
      ],
      expectedGit: [
        ".gitignore",
        "var/abc/zzz/test.txt",
        "var/abc/zzz/ttt/test.txt",
        "var/abc/ttt/test.txt",
      ],
      expectedFind: [".gitignore", "var/abc/zzz/test.txt"],
      expectedFindArgs: [
        "-path",
        "*/.git",
        "-prune",
        "-o",
        "-path",
        "*/ttt/test.txt",
        "-prune",
        "-o",
        "-type",
        "f",
        "-print",
      ],
    });
  });

  await t.test("nested path with slash", async () => {
    await commonLogic({
      testDirectory: "unignore",
      diskStructure: `
    var/abc/def/ghi/test.txt
    var/abc/def/aaa/zzz/test.txt
    var/abc/def/bbb/zzz/test.txt
        `,
      gitignore: `
    .git
    zzz/*
    !var/abc/def/aaa/zzz/test.txt
        `,
      expectedJs: [
        ".gitignore",
        "var/abc/def/aaa/zzz/test.txt",
        "var/abc/def/bbb/zzz/test.txt",
        "var/abc/def/ghi/test.txt",
      ],
      expectedGit: [
        ".gitignore",
        "var/abc/def/ghi/test.txt",
        "var/abc/def/aaa/zzz/test.txt",
        "var/abc/def/bbb/zzz/test.txt",
      ],
      expectedFind: [
        ".gitignore",
        "var/abc/def/aaa/zzz/test.txt",
        "var/abc/def/ghi/test.txt",
      ],
      expectedFindArgs: [
        "-path",
        "*/.git",
        "-prune",
        "-o",
        "-type",
        "f",
        "(",
        "!",
        "-path",
        "*/zzz/*",
        "-o",
        "-path",
        "*/var/abc/def/aaa/zzz/test.txt",
        ")",
        "-print",
      ],
    });
  });

  await t.test("no overlap", async () => {
    await commonLogic({
      testDirectory: "justunignore",
      diskStructure: `
  var/abc/def/ghi/test.txt
  var/abc/def/aaa/zzz/test.txt
  var/abc/def/bbb/zzz/test.txt
      `,
      gitignore: `
  .git
  *
  !.gitignore
  !var/abc/def/bbb/zzz/test.txt
      `,
      expectedJs: [
        ".gitignore",
        "var/abc/def/aaa/zzz/test.txt",
        "var/abc/def/bbb/zzz/test.txt",
        "var/abc/def/ghi/test.txt",
      ],
      expectedGit: [".gitignore"],
      expectedFind: [".gitignore", "var/abc/def/bbb/zzz/test.txt"],
      expectedFindArgs: [
        "-path",
        "*/.git",
        "-prune",
        "-o",
        "-type",
        "f",
        "(",
        "!",
        "-path",
        "*/*",
        "-o",
        "-path",
        "*/.gitignore",
        "-o",
        "-path",
        "*/var/abc/def/bbb/zzz/test.txt",
        ")",
        "-print",
      ],
    });
  });

  await t.test("no overlap", async () => {
    await commonLogic({
      testDirectory: "some_normal_stuff",
      diskStructure: `
var/alot/file.txt
bin/dont/process/this/file.txt
src/i/want/this.txt
pages/js/index.html
pages/js/index.template.html
pages/js/index.rendered.html
.env
.DS_Store
coverage/index.html
coverage/index.js
coverage/index.css
    `,
      gitignore: `
.git
.env
.DS_Store
bin/
**/*.rendered.html
    `,
      expectedJs: [
        ".DS_Store",
        ".env",
        ".gitignore",
        "bin/dont/process/this/file.txt",
        "coverage/index.css",
        "coverage/index.html",
        "coverage/index.js",
        "pages/js/index.html",
        "pages/js/index.rendered.html",
        "pages/js/index.template.html",
        "src/i/want/this.txt",
        "var/alot/file.txt",
      ],
      expectedGit: [
        ".gitignore",

        "coverage/index.css",
        "coverage/index.html",
        "coverage/index.js",
        "pages/js/index.html",
        "pages/js/index.template.html",
        "src/i/want/this.txt",
        "var/alot/file.txt",
      ],
      expectedFind: [
        ".gitignore",
        "coverage/index.css",
        "coverage/index.html",
        "coverage/index.js",
        "pages/js/index.html",
        "pages/js/index.template.html",
        "src/i/want/this.txt",
        "var/alot/file.txt",
      ],
      expectedFindArgs: [
        "-path",
        "*/.git",
        "-prune",
        "-o",
        "-path",
        "*/.env",
        "-prune",
        "-o",
        "-path",
        "*/.DS_Store",
        "-prune",
        "-o",
        "-path",
        "*/bin",
        "-prune",
        "-o",
        "-path",
        "*/**/*.rendered.html",
        "-prune",
        "-o",
        "-type",
        "f",
        "-print",
      ],
    });
  });
});
