import { defineConfig } from 'vitest/config'
import AlphabeticalSequencer from './tests/integration/sequencer'

export default defineConfig({
  test: {
    include: ['tests/integration/**/*.integration.test.ts'],
    globalSetup: ['./tests/integration/setup.ts'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    fileParallelism: false,
    sequence: {
      concurrent: false,
      sequencer: AlphabeticalSequencer,
    },
    reporters: ['default', 'json'],
    outputFile: { json: 'coverage/integration-results.json' },
  },
})
