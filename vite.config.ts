import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GITHUB_PAGES=true → base '/learn/' for gh-pages deployment
  // local dev stays on '/'
  base: process.env.GITHUB_PAGES === 'true' ? '/learn/' : '/',
})
