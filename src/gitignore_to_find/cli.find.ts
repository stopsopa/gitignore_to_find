import fs from "node:fs";

import gitignoreToFind from "./gitignoreToFind.ts";

const th = (msg: string) => new Error(`cli.find.ts error: ${msg}`);

const filePath = process.argv[2];

if (!filePath) {
  process.stdout.write(`Usage: cli.find.ts <path-to-ignore-file>\n`);
  process.exit(1);
}

try {
  if (!fs.existsSync(filePath)) {
    throw th(`File not found: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, "utf-8");

  const result = await gitignoreToFind(content);

  process.stdout.write(result.join(" "));
} catch (err: any) {
  throw th(err?.message || String(err));
}
