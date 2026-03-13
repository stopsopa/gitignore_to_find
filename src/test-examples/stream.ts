import * as readline from "node:readline";

/**
 *
 * ls -la | NODE_OPTIONS="" SILENT=true /bin/bash ts.sh src/test-examples/stream.ts
 *
 * This function handles the transformation of each line.
 * You can modify this function to implement any logic you need.
 *
 * @param line - The input line from stdin
 * @returns The transformed line to be sent to stdout
 */
function transformer(line: string): string {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] ${line}`;
}

/**
 * Main function to read from stdin line by line and
 * output the transformed content to stdout.
 */
async function processStream() {
  const rl = readline.createInterface({
    input: process.stdin,
    terminal: false,
  });

  for await (const line of rl) {
    const result = transformer(line);

    // Output the result followed by a newline
    process.stdout.write(result + "\n");
  }
}

// Start the process
try {
  await processStream();
} catch (error) {
  console.error("src/stream.ts error:", error);
  process.exit(1);
}
