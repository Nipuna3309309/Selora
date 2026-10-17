import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { powerApps } from '@microsoft/power-apps-vite/plugin'

// Port matches `localAppUrl` in power.config.json; output matches `buildPath`.
export default defineConfig({
  plugins: [react(), powerApps()],
  server: { port: 3000, strictPort: true },
  build: { outDir: 'dist' },
  test: { environment: 'node' },
})
