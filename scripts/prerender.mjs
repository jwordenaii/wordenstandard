import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import express from 'express'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)
const DIST_DIR   = path.resolve(__dirname, '../dist')
const SITEMAP    = path.resolve(DIST_DIR, 'sitemap.xml')

const CRITICAL_ROUTES = new Set(['/', '/about', '/services', '/contact', '/reviews', '/locations', '/asphalt-paving', '/parking-lots', '/sealcoating', '/hardscapes'])

const SKIP_ROUTES = new Set(['/command-center', '/dashboard', '/leads', '/portal', '/staff', '/voice-calls', '/revenue', '/candidate', '/dns-migration', '/admin'])

const PAGE_TIMEOUT_MS  = 15_000
const CONTENT_SELECTOR = '#root > *'

function getRoutesFromSitemap() {
  if (!fs.existsSync(SITEMAP)) { console.warn('[prerender] No sitemap — prerendering / only'); return ['/'] }
  const xml   = fs.readFileSync(SITEMAP, 'utf-8')
  const urls  = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1])
  const paths = urls.map(u => { try { return new URL(u).pathname } catch { return '/' } })
  return [...new Set(paths)].filter(p => { const base = '/' + p.split('/')[1]; return !SKIP_ROUTES.has(p) && !SKIP_ROUTES.has(base) })
}

function startServer() {
  const app = express()
  app.use(express.static(DIST_DIR))
  app.use((_req, res) => res.sendFile(path.resolve(DIST_DIR, 'index.html')))
  return new Promise(resolve => { const srv = app.listen(0, () => resolve({ port: srv.address().port, close: () => srv.close() })) })
}

async function renderPage(browser, baseUrl, route) {
  const page = await browser.newPage()
  await page.setRequestInterception(true)
  page.on('request', req => {
    const url = req.url()
    if (url.includes('railway.app') || url.includes('/api/') || url.includes('sentry.io') || url.includes('google-analytics') || url.includes('googletagmanager')) { req.abort() } else { req.continue() }
  })
  try {
    await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded', timeout: PAGE_TIMEOUT_MS })
    await page.waitForSelector(CONTENT_SELECTOR, { timeout: PAGE_TIMEOUT_MS })
    await new Promise(r => setTimeout(r, 800))
    const html = await page.content()
    if (html.length < 2000) throw new Error(`Output too small: ${html.length} bytes`)
    return html
  } finally { await page.close() }
}

function savePage(route, html) {
  const routePath = route === '/' ? '/index.html' : `${route}/index.html`
  const outPath   = path.join(DIST_DIR, routePath)
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, html, 'utf-8')
  return outPath
}

async function prerender() {
  if (!fs.existsSync(DIST_DIR)) { console.error('[prerender] dist/ not found. Run npm run build first.'); process.exit(1) }
  const routes  = getRoutesFromSitemap()
  console.log(`[prerender] ${routes.length} routes to prerender`)
  const server  = await startServer()
  const baseUrl = `http://localhost:${server.port}`
  let browser
  try {
    const puppeteer = await import('puppeteer')
    browser = await puppeteer.default.launch({ headless: 'new', args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-gpu','--no-first-run','--no-zygote','--single-process'] })
  } catch (err) { console.warn('[prerender] Chrome not available — skipping:', err?.message); server.close(); return }
  const results = { ok: [], failed: [] }
  for (const route of routes) {
    process.stdout.write(`  → ${route} ... `)
    try {
      const html = await renderPage(browser, baseUrl, route)
      savePage(route, html)
      results.ok.push(route)
      console.log(`✓ (${html.length.toLocaleString()} bytes)`)
    } catch (err) {
      try {
        const html = await renderPage(browser, baseUrl, route)
        savePage(route, html)
        results.ok.push(route)
        console.log(`✓ retry (${html.length.toLocaleString()} bytes)`)
      } catch (retryErr) {
        results.failed.push(route)
        console.log(`✗ FAILED: ${retryErr.message?.slice(0, 80)}`)
      }
    }
  }
  await browser.close()
  server.close()
  console.log(`\n[prerender] ✓ ${results.ok.length} succeeded · ✗ ${results.failed.length} failed`)
  if (results.failed.length) { console.log('Failed:', results.failed.join(', ')) }
  const criticalFailures = results.failed.filter(r => CRITICAL_ROUTES.has(r))
  if (criticalFailures.length > 0) { console.error('[prerender] CRITICAL ROUTES FAILED:', criticalFailures.join(', ')); process.exit(1) }
  console.log('[prerender] Complete.')
}

prerender().catch(err => { console.warn('[prerender] Non-fatal error:', err?.message || err) })
