const noCoverage = process.env.NO_COVERAGE === 'true';

const config = {
  $schema: "https://nodejs.org/dist/v24.13.0/docs/node-config-schema.json",
  nodeOptions: {
    warnings: false,
  },
  testRunner: {
    "experimental-test-coverage": !noCoverage,
    "test-concurrency": 10,
    "test-coverage-lines": 80,
    "test-coverage-include": ["src/**"],
  },
};

process.stdout.write(JSON.stringify(config, null, 2));
