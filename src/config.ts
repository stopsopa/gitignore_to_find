/**
 * Validate and export environment variables
 */

function validateEnv() {
  const { PORT, HOST } = process.env;

  if (!PORT) {
    throw new Error("config.ts error: Environment variable PORT is missing");
  }

  if (!/^\d+$/.test(PORT)) {
    throw new Error(
      `config.ts error: Environment variable PORT must be a number, but got "${PORT}"`,
    );
  }

  if (!HOST) {
    throw new Error("config.ts error: Environment variable HOST is missing");
  }

  return {
    PORT: parseInt(PORT, 10),
    HOST,
  };
}

export const config = validateEnv();
