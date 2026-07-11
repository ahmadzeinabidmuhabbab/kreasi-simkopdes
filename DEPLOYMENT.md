# Deployment

This repository must be deployed as a production Next.js application. Never use
`npm run dev` as a production start command because it enables DevTools and the
Hot Module Replacement WebSocket.

## Vercel

- Import this repository: `ahmadzeinabidmuhabbab/kreasi-simkopdes`.
- Keep **Root Directory** at the repository root (`./`).
- Keep **Framework Preset** as `Next.js`.
- Use `npm ci` for installation and `npm run build` for the build command.
- Do not override the production command with `npm run dev`.
- Add `KREASI_BACKEND_URL` in Production Environment Variables. It must point
  to the publicly reachable FastAPI backend URL and must not use `localhost`.

## Netlify

The committed `netlify.toml` configures the build and publish directory. Import
this repository with the base directory left at the repository root (`./`).
Netlify's current Next.js runtime is detected automatically; do not add the
legacy `@netlify/plugin-nextjs` plugin manually.

Add `KREASI_BACKEND_URL` to Site configuration > Environment variables before
deploying.

## Custom domain

Point `kreasi.zeinabid.site` to exactly one production provider:

- Vercel: add the domain in Project Settings > Domains, then copy the DNS record
  Vercel displays into Cloudflare.
- Netlify: add the domain in Domain management, then copy the DNS record Netlify
  displays into Cloudflare.

When Cloudflare proxying is enabled, SSL/TLS mode should be `Full (strict)`.
Remove any Cloudflare Tunnel or reverse-proxy route that still forwards this
hostname to a local `next dev` server.

## Self-hosted Node.js

If the domain intentionally points to a Node.js server instead of Vercel or
Netlify, deploy with:

```bash
npm ci
npm run build
npm run start
```

The expected production HTML must not contain `next-devtools`,
`browser_dev_hmr-client`, or requests to `/_next/webpack-hmr`.
