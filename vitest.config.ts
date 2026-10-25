import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

// Run the frontend test suite from the repository root as well as from frontend/.
// vitest resolves `root` before applying `include` globs, so pointing it at the
// frontend directory makes the same `include` paths work from either cwd.
const frontendRoot = fileURLToPath(new URL('./frontend', import.meta.url))

export default defineConfig({
  root: frontendRoot,
  plugins: [react()],
  resolve: {
    alias: {
      '@': frontendRoot,
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    // Only the two vitest suites are run by `npx vitest run`.
    // parseProductMessage.test.ts is a standalone Node script (console.log + process.exit),
    // not a vitest suite, so it is excluded to avoid a "No test suite found" failure.
    include: [
      'src/zip-ui/__tests__/chatbot.test.ts',
      'src/zip-ui/__tests__/dateBoundary.test.ts',
    ],
  },
})