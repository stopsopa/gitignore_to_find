import * as readline from "node:readline";
import { pipeline } from "node:stream/promises";
import { setTimeout } from "node:timers/promises";

/**
 * ls -la | NODE_OPTIONS="" SILENT=true /bin/bash ts.sh src/test-examples/stream2.ts
 *
 * This function handles the transformation of each line.
 *
 * @param line - The input line from stdin
 * @returns The transformed line to be sent to stdout
 */
function transformer(line: string): string {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] ${line}\n`;
}

/**
 * An async generator that fits perfectly into the pipeline.
 * It iterates over the lines from the source (readline interface)
 * and yields the transformed content.
 */
async function* transformLines(source: AsyncIterable<string>) {
  for await (const line of source) {
    await setTimeout(100);
    
    yield transformer(line);
  }
}

/**
 * Main function to read from stdin line by line and
 * output the transformed content to stdout using stream pipelines.
 */
async function processStream() {
  const rl = readline.createInterface({
    input: process.stdin,
    terminal: false,
  });

  // pipeline connects the readable (rl),
  // the transformer (generator),
  // and the writable (stdout)
  await pipeline(rl, transformLines, process.stdout);
}

// Start the process
try {
  await processStream();
} catch (error) {
  console.error("src/stream2.ts error:", error);
  process.exit(1);
}
