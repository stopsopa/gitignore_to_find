import { test } from "node:test";
import assert from "node:assert";
import fs from "fs/promises";
import path from "path";
import diskStructuresCreate from "./diskStructuresCreate.ts";
import diskStructuresEmptyDir from "./diskStructuresEmptyDir.ts";
import diskStructuresListDir from "./diskStructuresListDir.ts";
import cmd from "./cmd.ts";

const th = (msg: string) => `diskStructuresCreate.ts error: ${msg}`;

/**
 * /bin/bash ts.sh --test src/gitignore_to_find/gitignoreToFind.test.ts
 */
test("gitignoreToFind", async (t) => {
  const testDir = path.resolve(import.meta.dirname, "../../var/");

  await t.test("basic", async () => {
    const tmp = path.resolve(testDir, "basic");

    try {
      await diskStructuresCreate(
        tmp,
        `
        
abc/test.txt
abc/def/
cde/eft/ppp.txt
`,
      );

      const list = await diskStructuresListDir(tmp);

    //   console.log(JSON.stringify(list, null, 2));

      assert.deepStrictEqual(list, ["abc/test.txt", "cde/eft/ppp.txt"]);

      // assert.strictEqual(stats2.isFile(), true);
    } catch (e) {
      await diskStructuresEmptyDir(tmp, true);

      throw e;
    }
  });
});
