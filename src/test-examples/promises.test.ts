import { test } from "node:test";
import assert, { AssertionError } from "node:assert/strict";

/**
 * /bin/bash ts.sh --test src/test-examples/promises.test.ts
 *
 * A function that mimics an asynchronous operation.
 * It succeeds if the input is valid, and fails otherwise.
 */
async function processData(
  input: string | null,
  delay: number = 100,
): Promise<string> {
  // Simulate an async delay
  await new Promise((resolve) => setTimeout(resolve, delay));

  if (!input) {
    throw new Error("Input is required");
  }

  if (input === "trigger-error") {
    throw new Error("Generic processing error");
  }

  return `Processed: ${input}`;
}

test("processData - success case", { timeout: 50 }, async () => {
  // This test will fail automatically if it takes longer than 50ms
  const result = await processData("hello world", 20);

  // Verify the success result
  assert.strictEqual(result, "Processed: hello world");
});

test("processData - manual timeout with Promise.race", async () => {
  // If you need to CATCH a timeout in your logic, use Promise.race
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Manual timeout")), 50),
  );

  await assert.rejects(
    Promise.race([processData("too slow", 100), timeoutPromise]),
    {
      message: "Manual timeout",
    },
  );
});

test("processData - failure case (missing input)", async () => {
  // Use assert.rejects to test for Promise rejections
  await assert.rejects(processData(null), {
    name: "Error",
    message: "Input is required",
  });
});

test("processData - failure case (specific trigger)", async () => {
  await assert.rejects(processData("trigger-error"), (err: Error) => {
    assert.strictEqual(err.message, "Generic processing error");
    return true; // Return true to indicate the error was handled as expected
  });
});
