import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    // Test environment (happy-dom is faster and more compatible than jsdom)
    environment: 'happy-dom',

    // Pool configuration to avoid ES module issues
    pool: 'threads',

    // Setup files
    setupFiles: ['./vitest.setup.ts'],

    // Global test utilities
    globals: true,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],

      // 85% coverage thresholds
      thresholds: {
        lines: 85,
        branches: 85,
        functions: 85,
        statements: 85,
      },

      // Include source files
      include: ['src/**/*.{ts,tsx}'],

      // Exclude from coverage
      exclude: [
        'node_modules/',
        'src/**/*.d.ts',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/main.tsx',
        'src/vite-env.d.ts',
        // Exclude sample/mock data
        'src/**/mockData.ts',
        'src/**/sampleData.ts',
        'src/**/mock*.ts',
        'src/**/sample*.ts',
        // Exclude type definitions
        'src/**/types/*.ts',
        'src/**/*.types.ts',
      ],
    },

    // Test file patterns
    include: ['src/**/*.{test,spec}.{ts,tsx}'],

    // Exclude patterns
    exclude: [
      'node_modules',
      'dist',
      '.idea',
      '.git',
      '.cache',
    ],

    // Test timeout
    testTimeout: 10000,

    // Hook timeout
    hookTimeout: 10000,

    // Retry failed tests
    retry: 0,

    // Reporter configuration
    reporters: ['default', 'html'],

    // Output configuration
    outputFile: {
      html: './coverage/index.html',
    },
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
