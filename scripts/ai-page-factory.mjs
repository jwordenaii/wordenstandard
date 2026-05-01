import { promises as fs } from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const BLUEPRINT_DIR = path.join(ROOT, 'ai-page-blueprints')
const PAGE_DIR = path.join(ROOT, 'src', 'pages', 'ai')
const REGISTRY_FILE = path.join(ROOT, 'src', 'generated', 'aiPageRegistry.jsx')
const SITEMAP_FILE = path.join(ROOT, 'public', 'sitemap.xml')

const DOMAIN = 'https://www.jwordenasphaltpaving.com'
const BLOCK_START = '  <!-- AI_PAGE_FACTORY:START -->'
const BLOCK_END = '  <!-- AI_PAGE_FACTORY:END -->'

function slugToPascal(slug) {
  return slug
    .split('/')
    .filter(Boolean)
    .join('-')
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

function normalizePath(slug) {
  if (!slug) return ''
  const trimmed = String(slug).trim().replace(/^\/+/, '').replace(/\/+$/, '')
  return `/${trimmed}`
}

function assertBlueprint(blueprint, fileName) {
  const required = ['slug', 'title', 'description']
  for (const key of required) {
    if (!blueprint[key] || typeof blueprint[key] !== 'string') {
      throw new Error(`${fileName}: missing required string field '${key}'`)
    }
  }
  if (blueprint.sections && !Array.isArray(blueprint.sections)) {
    throw new Error(`${fileName}: 'sections' must be an array when provided`)
  }
}

function assertPremiumQuality(blueprint, fileName) {
  if ((blueprint.public === true) && (!blueprint.sections || blueprint.sections.length < 3)) {
    throw new Error(`${fileName}: public pages require at least 3 sections for depth and authority`)
  }

  const description = String(blueprint.description || '').trim()
  if (description.length < 80 || description.length > 180) {
    throw new Error(`${fileName}: description should be 80-180 characters for SEO quality`)
  }

  const blockedPublicTerms = ['command center', 'admin', 'internal only', 'confidential']
  const bodyText = `${blueprint.title || ''} ${blueprint.description || ''} ${blueprint.intro || ''}`.toLowerCase()

  if (blueprint.public === true && blockedPublicTerms.some((term) => bodyText.includes(term))) {
    throw new Error(`${fileName}: public page contains internal-only language`)
  }

  const hasThinSection = (blueprint.sections || []).some((section) => String(section?.body || '').trim().length < 80)
  if (blueprint.public === true && hasThinSection) {
    throw new Error(`${fileName}: each public section body should be at least 80 characters`)
  }
}

function escapeSingleQuotes(text) {
  return String(text).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

function pageComponentSource(page) {
  const sections = (page.sections || []).map((section) => ({
    heading: escapeSingleQuotes(section.heading || ''),
    body: escapeSingleQuotes(section.body || ''),
  }))

  const title = escapeSingleQuotes(page.title)
  const description = escapeSingleQuotes(page.description)
  const h1 = escapeSingleQuotes(page.h1 || page.title)
  const intro = escapeSingleQuotes(page.intro || page.description)
  const canonicalPath = page.path
  const ctaText = escapeSingleQuotes(page.ctaText || 'Request a Consultation')
  const ctaHref = escapeSingleQuotes(page.ctaHref || '/#quote')

  return `import React from 'react'
import { Link } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import SEO from '@/components/SEO'

const PAGE_SECTIONS = ${JSON.stringify(sections, null, 2)}

export default function ${page.componentName}() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: '${title}',
    description: '${description}',
    url: '${DOMAIN}${canonicalPath}',
  }

  return (
    <div className="min-h-screen bg-background font-body">
      <SEO
        title={'${title}'}
        description={'${description}'}
        canonicalPath={'${canonicalPath}'}
        jsonLd={jsonLd}
      />
      <Navbar />

      <section className="relative border-b border-border pt-32 pb-16 md:pb-20 overflow-hidden">
        <div className="absolute -top-16 right-0 w-72 h-72 rounded-full bg-primary/12 blur-3xl pointer-events-none" />
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <p className="font-display text-primary text-xs tracking-[0.3em] uppercase mb-4">AI Page Factory</p>
          <h1 className="font-display font-black text-foreground text-4xl md:text-6xl uppercase tracking-tight leading-[0.95]">
            ${h1}
          </h1>
          <p className="text-muted-foreground text-base md:text-lg mt-6 max-w-3xl leading-relaxed">
            ${intro}
          </p>
          <div className="mt-8">
            <Link
              to={'${ctaHref}'}
              className="premium-cta inline-flex items-center gap-2 px-6 py-4 font-display font-bold text-sm tracking-[0.14em] uppercase text-primary-foreground"
            >
              ${ctaText}
            </Link>
          </div>
        </div>
      </section>

      <section className="py-14 md:py-18">
        <div className="max-w-5xl mx-auto px-6 lg:px-8 space-y-6">
          {PAGE_SECTIONS.map((section) => (
            <article key={section.heading} className="border border-border bg-card p-6 md:p-8">
              <h2 className="font-display font-black text-foreground text-2xl md:text-3xl uppercase tracking-tight">
                {section.heading}
              </h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed mt-4">
                {section.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  )
}
`
}

function registrySource(pages) {
  const imports = pages
    .map((page) => `const ${page.componentName} = lazy(() => import('@/pages/ai/${page.componentName}'))`)
    .join('\n')

  const publicPages = pages
    .filter((page) => page.public)
    .map((page) => `  { path: '${page.path}', Component: ${page.componentName} },`)
    .join('\n')

  const internalPages = pages
    .filter((page) => !page.public)
    .map((page) => `  { path: '${page.path}', Component: ${page.componentName} },`)
    .join('\n')

  return `import { lazy } from 'react'

// Auto-generated by scripts/ai-page-factory.mjs
// Do not edit manually.

${imports || '// No generated pages yet.'}

export const publicAIPages = [
${publicPages}
]

export const internalAIPages = [
${internalPages}
]
`
}

function sitemapEntries(pages) {
  const now = new Date().toISOString().slice(0, 10)
  return pages
    .filter((page) => page.public && page.includeInSitemap)
    .map(
      (page) => `  <url>\n    <loc>${DOMAIN}${page.path}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>${page.changefreq}</changefreq>\n    <priority>${page.priority}</priority>\n  </url>`
    )
    .join('\n')
}

async function updateSitemap(pages) {
  const raw = await fs.readFile(SITEMAP_FILE, 'utf8')
  const block = [BLOCK_START, sitemapEntries(pages), BLOCK_END].filter(Boolean).join('\n')

  const hasMarkers = raw.includes(BLOCK_START) && raw.includes(BLOCK_END)
  let updated

  if (hasMarkers) {
    updated = raw.replace(new RegExp(`${BLOCK_START}[\\s\\S]*?${BLOCK_END}`), block)
  } else {
    updated = raw.replace('</urlset>', `${block}\n\n</urlset>`)
  }

  await fs.writeFile(SITEMAP_FILE, updated, 'utf8')
}

async function ensureDirs() {
  await fs.mkdir(BLUEPRINT_DIR, { recursive: true })
  await fs.mkdir(PAGE_DIR, { recursive: true })
  await fs.mkdir(path.dirname(REGISTRY_FILE), { recursive: true })
}

async function loadBlueprints() {
  const entries = await fs.readdir(BLUEPRINT_DIR, { withFileTypes: true })
  const files = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.json'))

  const pages = []

  for (const file of files) {
    const filePath = path.join(BLUEPRINT_DIR, file.name)
    const raw = await fs.readFile(filePath, 'utf8')
    const blueprint = JSON.parse(raw)

    if (blueprint.enabled === false) continue

    assertBlueprint(blueprint, file.name)
    assertPremiumQuality(blueprint, file.name)

    const pagePath = normalizePath(blueprint.slug)
    const componentName = `${slugToPascal(pagePath)}AIPage`

    pages.push({
      ...blueprint,
      path: pagePath,
      componentName,
      public: blueprint.public === true,
      includeInSitemap: blueprint.includeInSitemap !== false,
      changefreq: blueprint.changefreq || 'monthly',
      priority: blueprint.priority || '0.6',
    })
  }

  const seen = new Set()
  for (const page of pages) {
    if (seen.has(page.path)) {
      throw new Error(`Duplicate generated page path: ${page.path}`)
    }
    seen.add(page.path)
  }

  return pages
}

async function writePages(pages) {
  for (const page of pages) {
    const filePath = path.join(PAGE_DIR, `${page.componentName}.jsx`)
    await fs.writeFile(filePath, pageComponentSource(page), 'utf8')
  }
}

async function run() {
  await ensureDirs()
  const pages = await loadBlueprints()
  await writePages(pages)
  await fs.writeFile(REGISTRY_FILE, registrySource(pages), 'utf8')
  await updateSitemap(pages)

  console.log(`AI Page Factory complete: generated ${pages.length} page(s).`)
}

run().catch((error) => {
  console.error('AI Page Factory failed:', error)
  process.exitCode = 1
})
