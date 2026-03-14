import { spawn, type SpawnOptionsWithoutStdio } from "node:child_process";

export type Return = {
  stdout: string;
  stderr: string;
  code: number;
};

export default async function cmd(
  mainExec: string,
  args: string[],
  options?: SpawnOptionsWithoutStdio,
): Promise<Return> {
  return new Promise<Return>((resolve) => {
    try {
      const child = spawn(mainExec, args, options);

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      child.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      child.on("error", (err) => {
        resolve({
          stdout,
          stderr: stderr + (stderr ? "\n" : "") + err.message,
          code: child?.exitCode ?? 1, // Fallback to 1 ONLY if no exit code
        });
      });

      child.on("close", (code) => {
        resolve({
          stdout,
          stderr,
          code: code ?? child?.exitCode ?? 0,
        });
      });
    } catch (e: any) {
      resolve({
        stdout: "",
        stderr: String(e),
        code: 1,
      });
    }
  });
}
