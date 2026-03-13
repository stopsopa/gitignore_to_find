import { test } from "node:test";
import path from "node:path";
import assert from "node:assert";
import diskStructuresCreate from "./diskStructuresCreate.ts";
import diskStructuresEmptyDir from "./diskStructuresEmptyDir.ts";

const rootDir = path.resolve(import.meta.dirname, "../../");

const varDir = path.resolve(rootDir, "var");

/**
 * /bin/bash ts.sh --test src/gitignore_to_find/diskStructures.test.ts
 */
test("create and remove", async () => {
  await diskStructuresCreate(
    varDir,
    `
directory/test/file.txt
directory/test/file2.txt
directory/test2/file3.txt
directory/test2/file4.txt
`,
  );

  var k = true;
  await diskStructuresEmptyDir(varDir);

  assert.strictEqual(k, true);
//   assert.strictEqual(sum(1, 2), 3);
});
