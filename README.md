# J. Worden & Sons Asphalt Paving — Standalone Deployment

A standalone Vite + React frontend for J. Worden & Sons Asphalt Paving. No third-party builder platform required — deploys to Netlify, Vercel, or any static host.

## Quick Start

```bash
npm install
npm run dev
```

## Environment Variables

Create `.env.local` (copy from `.env.example`):

```
VITE_API_BASE_URL=https://your-backend.railway.app
VITE_SITE_URL=https://www.jwordenasphaltpaving.com
VITE_CC_PASSWORD=your-command-center-password
```

Leave `VITE_API_BASE_URL` empty to run the frontend alone — public pages work without a backend; admin/dashboard features require the FastAPI backend.

## Deploy to Netlify

1. Connect repo on [app.netlify.com](https://app.netlify.com)
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Node version: `20`

Set environment variables in **Site settings → Environment variables**.

## Deploy to Vercel

```bash
npx vercel --prod
```

Set `VITE_API_BASE_URL`, `VITE_SITE_URL`, etc. in the Vercel dashboard.

## Backend (FastAPI)

The `app/` directory contains the FastAPI backend. Deploy to Railway:

```bash
railway up
```

See `DEPLOYMENT.md` for full backend setup, environment variables, and database migration instructions.

## Build

```bash
npm run build      # Vite production build → dist/
npm run lint       # ESLint
npm run typecheck  # TypeScript check
```
