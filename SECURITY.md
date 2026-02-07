# SECURITY.md

## Security Policy — inactu-control-web

`inactu-control-web` is the web console for Inactu control-plane APIs.

### Scope

This policy applies to:
- web authentication/session flows
- server-side API bridge routes
- OpenAPI proxy and docs surfaces
- production build/runtime configuration

### Reporting

Report vulnerabilities privately:
- Email: security@opertus.systems
- Include affected route/component, reproduction steps, and impact.

Do not file public issues for unpatched vulnerabilities.

### Supported Versions

Only the latest default branch and most recent release are in active security support.

### Baseline Controls

- short-lived bridge JWTs for API calls
- strict input validation on auth/contact routes
- restricted OpenAPI proxy path allowlist
- baseline security headers in `next.config.mjs`
