# provenact-control-web

Standalone Next.js web console for the Provenact control plane API.

## Local development

```bash
npm install
npm run dev
```

Node.js requirement: `>= 20.9.0`.

Set the backend API base URL in `.env.local`:

```bash
NEXT_PUBLIC_PROVENACT_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=replace-with-a-long-random-secret
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/provenact_control
PROVENACT_API_BASE_URL=http://localhost:8080
PROVENACT_ALLOW_PRIVATE_HTTP=false
PROVENACT_API_AUTH_SECRET=replace-with-at-least-32-random-bytes-shared-with-api
TRUST_PROXY_HEADERS=false
TRUST_PROXY_HOPS=1
```

Use `PROVENACT_API_BASE_URL` (server-side) for authenticated API bridge calls.
`NEXT_PUBLIC_PROVENACT_API_BASE_URL` is only for client-facing display and docs UI.
Set `PROVENACT_ALLOW_PRIVATE_HTTP=true` only for trusted private-network hosts
(for example, `http://provenact-control:8080` in docker-compose).
Set `TRUST_PROXY_HEADERS=true` only when the app is behind trusted reverse proxies.
`TRUST_PROXY_HOPS` defaults to `1` and controls which `x-forwarded-for` hop is used.

## Auth scaffold

- NextAuth credentials flow is configured at `app/api/auth/[...nextauth]/route.ts`.
- Signup endpoint is `POST /api/auth/register`.
- Signup writes to `users` and creates a matching `owners` record (`kind='user'`).
- Server-side package proxy routes mint short-lived bridge JWTs for Rust API auth:
  - `GET/POST /api/packages`
  - `GET/POST /api/packages/[package]/versions`
  - `POST /api/packages/[package]/versions/[version]/deprecate`
- Protected app routes:
  - `/app`
  - `/app/packages`
  - `/app/contexts`

## Deploy on Vercel

- Import this repository as the Vercel project.
- Framework preset: Next.js
- Build command: `npm run build`
- Output directory: `.next`
- Environment variables:
  - `NEXT_PUBLIC_PROVENACT_API_BASE_URL=<your-api-url>`
  - `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX`

### Sync env vars with Vercel CLI

Use the included sync script to upsert variables from an env file:

```bash
vercel link
npm run vercel:env:sync:prod
```

Preview environment:

```bash
npm run vercel:env:sync:preview
```

Optional auth/scope:

```bash
VERCEL_TOKEN=your_token VERCEL_SCOPE=your_team npm run vercel:env:sync:prod
```

The Rust control-plane API should run separately (for example on Fly.io, Render, Railway, or ECS), and the Next.js app calls it.

## Security defaults

- Web-to-API bridge tokens are short-lived (`5m`) and include `jti`.
- OpenAPI proxy route is allowlisted to verification endpoints only.
- Signup endpoint applies deterministic attempt throttling keyed by trusted IP and/or normalized email.
- Security headers are set in `proxy.ts` via request middleware (including CSP baseline).
- Security reporting/process is documented in `SECURITY.md`.

## OpenAPI mirror source pin

- `public/openapi.yaml` mirrors
  `opertus-systems/provenact-control@d5120e0df67a8fc20e2e71ed9661f6b389e5cbe0`.
- Source pin and checksum are recorded in `sync-manifest.json`.
