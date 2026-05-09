import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import express from 'express';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, '../dist');
const SITEMAP_PATH = path.resolve(DIST_DIR, 'sitemap.xml');

// Grab all routes out of the generated sitemap
function getRoutesFromSitemap() {
  if (!fs.existsSync(SITEMAP_PATH)) return ['/'];
  const xml = fs.readFileSync(SITEMAP_PATH, 'utf-8');
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  return urls.map(u => {
    try {
      return new URL(u).pathname;
    } catch {
      return '/';
    }
  });
}

const allRoutes = [...new Set(getRoutesFromSitemap())];
const routes = allRoutes.length > 0 ? allRoutes : ['/'];

async function startServer() {
  const app = express();
  app.use(express.static(DIST_DIR));
  
  // SPA fallback
  app.use((req, res) => {
    res.sendFile(path.resolve(DIST_DIR, 'index.html'));
  });

  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      resolve({
        port: server.address().port,
        close: () => server.close()
      });
    });
  });
}

async function prerender() {
  if (!fs.existsSync(DIST_DIR)) {
    console.error('dist directory not found! Run npm run build first.');
    process.exit(1);
  }

  console.log('Starting static server for prerendering...');
  const server = await startServer();
  const baseUrl = `http://localhost:${server.port}`;

  console.log('Launching puppeteer...');
  let browser;
  try {
    browser = await puppeteer.launch({ headless: 'new' });
  } catch (err) {
    console.warn('[prerender] Skipping prerender — Chrome not available:', err?.message || err);
    server.close();
    return;
  }

  for (const route of routes) {
    const page = await browser.newPage();
    console.log(`Prerendering ${route}...`);
    
    try {
      await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle0' });
      
      const html = await page.content();
      
      // Calculate output path
      const routePath = route === '/' ? '/index.html' : `${route}/index.html`;
      const outPath = path.join(DIST_DIR, routePath);
      
      // Ensure directory exists
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, html);
      console.log(`→ Saved ${outPath}`);
    } catch (e) {
      console.error(`Failed to prerender ${route}:`, e);
    } finally {
      await page.close();
    }
  }

  await browser.close();
  server.close();
  console.log('Prerendering complete!');
}

prerender().catch((err) => {
  console.warn('[prerender] Non-fatal error, continuing build:', err?.message || err);
});