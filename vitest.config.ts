import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  root: '.',
  test: {
    environment: 'node',
    include: [
      'tests/**/*.test.ts',
      'tests/**/*.spec.ts',
      'tests/**/*.test.tsx',
      'tests/**/*.spec.tsx',
    ],
    exclude: [
      'node_modules/**',
      'dist/**',
      'tests/playground*',
      'tests/playground/**',
    ],
    setupFiles: ['tests/setup.ts'],
    testTimeout: 10_000,
    env: {
      // Pas de SANGHO_API_KEY ici : tests/integration/*.test.ts détecte son
      // absence et se met en `it.skip` automatiquement (HAS_KEY = false).
      // Pour lancer les tests d'intégration, exporter une VRAIE clé sandbox :
      //   SANGHO_API_KEY=sk_test_xxx pnpm vitest run tests/integration
      // (ou `make test-integration`) — jamais committer cette clé ici.
      SANGHO_ENV: 'sandbox',
      SANGHO_BASE_URL: 'https://api.sangho.ga',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: 'coverage',
      include: ['**/*.ts'],
      exclude: [
        'node_modules/**',
        'dist/**',
        'tests/**',
        '**/*.d.ts',
        '**/index.ts',
        'types/**',
        '*.config.ts',
        'playground*.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
    reporters: process.env.CI ? ['verbose', 'json'] : ['verbose'],
    outputFile: {
      json: 'test-results/results.json',
    },
    globals: true,
    watch: false,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
      '@core': resolve(__dirname, 'core'),
      '@modules': resolve(__dirname, 'modules'),
      '@utils': resolve(__dirname, 'utils'),
      '@tests': resolve(__dirname, 'tests'),
      '@sangho-types': resolve(__dirname, 'types'),
    },
  },
})