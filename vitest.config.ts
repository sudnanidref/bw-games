import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environmentMatchGlobs: [
      ['src/App.test.tsx', 'jsdom'],
      ['src/games/collaborative/BlindBuilder.test.tsx', 'jsdom'],
      ['src/games/customer-focus/MatchTheSolution.test.tsx', 'jsdom'],
    ],
  },
})
