# inactu-web

Next.js frontend scaffold for the Inactu control plane.

## Local development

```bash
cd web
npm install
npm run dev
```

Node.js requirement: `>= 18.17.0` (Next.js 14 requirement).

Set the backend API base URL in `.env.local`:

```bash
NEXT_PUBLIC_INACTU_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=replace-with-a-long-random-secret
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/inactu_control
INACTU_API_BASE_URL=http://localhost:8080
INACTU_API_AUTH_SECRET=replace-with-the-same-shared-secret-as-api
```

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

- Import this directory as the Vercel project root: `web`
- Framework preset: Next.js
- Build command: `npm run build`
- Output directory: `.next`
- Environment variables:
  - `NEXT_PUBLIC_INACTU_API_BASE_URL=<your-api-url>`
  - `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX`

### Sync env vars with Vercel CLI

Use the included sync script to upsert variables from an env file:

```bash
cd web
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
