import fs from "node:fs";

import gitignoreToFind from "./gitignoreToFind.ts";

const th = (msg: string) => new Error(`cli.find.ts error: ${msg}`);

const help = `
Usage:
  GITIGNORE_TO_FIND_OPTS="key=val,key2=val2" node cli.find.js <path-to-ignore-file>

Description:
  This tool reads a .gitignore-like file and generates arguments for the 'find' command.

Options (via GITIGNORE_TO_FIND_OPTS env var):
  quoteWithSpaces (qws) : Quote arguments containing spaces (default: true)
  quoteStars      (qs)  : Quote arguments containing '*' (default: true)
  slashBrackets   (sb)  : Prefix '(' and ')' with backslash '\' (default: true)
  debug           (dbg) : Enable debug logging (default: false)

Examples:
  # Use defaults
  NODE_OPTIONS="" node cli.find.js .myignore

  # Disable bracket escaping and enable debug
  GITIGNORE_TO_FIND_OPTS="sb=0,dbg=1" NODE_OPTIONS="" node cli.find.js .myignore

  # Using full names
  GITIGNORE_TO_FIND_OPTS="slashBrackets=0,debug=1" NODE_OPTIONS="" node cli.find.js .myignore

Note:
  Values can be: true, false, 1, 0, on, off.
  Short keys (aliases) are supported: qws, qs, sb, dbg.
`;

const arg = process.argv[2];

if (!arg || arg === "--help" || arg === "-h") {
  process.stdout.write(help + "\n");
  process.exit(arg ? 0 : 1);
}

const filePath = arg;

const options: any = {
  quoteWithSpaces: true,
  quoteStars: true,
  slashBrackets: true,
  debug: false,
};

const aliases: Record<string, string> = {
  qws: "quoteWithSpaces",
  qs: "quoteStars",
  sb: "slashBrackets",
  dbg: "debug",
};

const envOpts = process.env.GITIGNORE_TO_FIND_OPTS || "";

if (envOpts) {
  envOpts.split(",").forEach((pair) => {
    const [keyRaw, valRaw] = pair.split("=");
    const key = keyRaw.trim().toLowerCase();
    const targetKey =
      Object.keys(options).find((k) => k.toLowerCase() === key) || aliases[key];
    if (targetKey) {
      if (valRaw === undefined) {
        options[targetKey] = true;
      } else {
        const v = valRaw.trim().toLowerCase();
        options[targetKey] = v === "true" || v === "1" || v === "on";
      }
    }
  });
}

try {
  if (!fs.existsSync(filePath)) {
    throw th(`File not found: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, "utf-8");

  const result = await gitignoreToFind(content, options);

  process.stdout.write(result.join(" "));
} catch (err: any) {
  throw th(err?.message || String(err));
}
