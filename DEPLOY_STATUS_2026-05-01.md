# Deploy Status - 2026-05-01

## Repository state confirmed

- Branch: main
- Local and remote HEAD match: b0302c5
- Latest pushed work includes:
  - AI landing page expansion (6 total landing slugs)
  - Ads mapping enrichment (ad group + keyword cluster)
  - Backlink asset blocks for new landing pages
  - Sitemap updates for new landing URLs

## Production checks confirmed

- Production domain https://www.jwordenasphaltpaving.com/ returns HTTP 200.
- New landing routes currently render in-app 404:
  - /lp/richmond-parking-lot-repair
  - /lp/henrico-parking-lot-resurfacing
  - /lp/chester-industrial-asphalt-paving
  - /lp/fairfax-hoa-street-repair
  - /lp/norfolk-warehouse-parking-lot-repair
  - /lp/fredericksburg-church-parking-lot-paving
- Live sitemap is still serving older URL set and does not include the new /lp pages.
- Live robots.txt appears older than repo copy and is missing newer internal-route blocks such as /command-center.

## Meaning

Repository is correct and synced, but the production site is serving an older deploy artifact or is connected to a different Netlify publish context.

## Required fix path

1. In Netlify, open the site that owns www.jwordenasphaltpaving.com.
2. Confirm linked repo is jwordenaii/codexbuildfreeofbase44.
3. Confirm publish branch is main.
4. Confirm published commit equals b0302c5.
5. Run Clear cache and deploy site.
6. Re-test key URLs and crawl files:
   - /lp/richmond-parking-lot-repair
   - /lp/henrico-parking-lot-resurfacing
   - /lp/fairfax-hoa-street-repair
   - /sitemap.xml
   - /robots.txt

## Validation checklist

- [ ] Home loads 200 and references a fresh index asset hash.
- [ ] All six /lp routes render landing content (not in-app 404).
- [ ] sitemap.xml contains all expected public landing URLs.
- [ ] robots.txt includes internal-route disallow policy from repo.
