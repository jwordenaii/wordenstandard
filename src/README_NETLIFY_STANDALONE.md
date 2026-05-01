# J. Worden & Sons - Standalone Netlify Build Notes

This copy has been patched so the public React/Vite site can build on GitHub + Netlify without using the Base44 Vite plugin.

## Netlify settings

- Build command: `npm run build`
- Publish directory: `dist`
- Node version: `20`
- Repository: https://github.com/jwordenaii/codexbuildfreeofbase44

## What was changed

- `vite.config.js` now uses plain Vite + React instead of the Base44 Vite plugin.
- `netlify.toml` has the React single-page-app fallback: `/* -> /index.html`.
- `tailwind.config.js` was converted to ES module format because `package.json` uses `type: module`.
- `src/lib/AuthContext.jsx` was changed to a standalone public-site auth provider so the homepage does not depend on Base44.
- `src/api/base44Client.js` was changed to a local fallback client so public pages do not crash when Base44 functions/entities are unavailable.

## What still needs a real backend later

These features exist in the code, but need a new backend to be production-real:

- AI photo inspection
- live Google reviews fetch
- quote PDF generation
- proposal PDF generation
- lead email/SMS automation
- admin dashboard auth
- calendar/job sync
- crew metrics and revenue reports
- voice-call/Vapi webhook logic

The static public site can go live first. Reconnect backend features one at a time later.
