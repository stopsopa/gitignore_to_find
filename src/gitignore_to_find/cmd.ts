import { spawn, type SpawnOptionsWithoutStdio } from "node:child_process";

export type Return<T = string> = {
  stdout: T;
  stderr: string;
  code: number;
};

/**
 * Achievement: Dynamic return type based on input options.
 * Techniques used:
 * 1. Function Overloading: Defining multiple signatures for the same function to 
 *    map specific input shapes (options with or without 'process') to specific 
 *    return types.
 * 2. Generics: Using Return<T> to allow the 'stdout' field to take different types 
 *    depending on the overload matched.
 */

export type Options<T = any> = SpawnOptionsWithoutStdio & {
  process?: (stdout: string) => T;
};

export default async function cmd(
  mainExec: string,
  args: string[],
  options?: SpawnOptionsWithoutStdio,
): Promise<Return<string>>;

export default async function cmd(
  mainExec: string,
  args: string[],
  options: SpawnOptionsWithoutStdio & { process: (stdout: string) => string[] },
): Promise<Return<string[]>>;

export default async function cmd(
  mainExec: string,
  args: string[],
  options?: any,
): Promise<Return<any>> {
  return new Promise<Return<any>>((resolve) => {
    try {
      const child = spawn(mainExec, args, options);

      const { process } = options ?? {};

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
          stdout: process ? process(stdout) : stdout,
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
