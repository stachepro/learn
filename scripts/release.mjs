/**
 * npm run release
 *
 * 1. Vite build with base='/learn/' (GITHUB_PAGES=true)
 * 2. Copies dist/index.html → dist/404.html  (SPA client-side routing fix)
 * 3. Pushes dist/ to the gh-pages branch via npx gh-pages
 */

import { execSync } from 'child_process'
import { copyFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

function run(cmd) {
  console.log(`\n→ ${cmd}`)
  execSync(cmd, { stdio: 'inherit', cwd: root, env: { ...process.env, GITHUB_PAGES: 'true' } })
}

console.log('📦 Building for GitHub Pages (base: /learn/)...')
run('tsc -b && vite build')

// SPA routing: GitHub Pages serves 404.html for unknown paths.
// By making it identical to index.html, all routes load the app.
const indexPath = resolve(root, 'dist/index.html')
const notFoundPath = resolve(root, 'dist/404.html')
if (!existsSync(indexPath)) {
  console.error('✗ dist/index.html not found — build may have failed.')
  process.exit(1)
}
copyFileSync(indexPath, notFoundPath)
console.log('✓ Copied index.html → 404.html (SPA routing fix)')

console.log('\n🚀 Deploying to gh-pages branch...')
run('npx gh-pages -d dist --dotfiles')

console.log('\n✅ Done!')
console.log('   → https://stachepro.github.io/learn/')
