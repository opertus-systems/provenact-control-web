# TODO

Last updated: 2026-03-16

## Priority

- Triage the remaining open dependency PRs:
  - `#42` `actions/setup-node`
  - `#46` npm dependency group update
- Keep the npm 10 lockfile discipline; regenerate `package-lock.json` with npm 10 semantics before pushing dependency changes.
- Add abuse controls for `/api/contact`; the current auth limiter fix only addressed anonymous-login bucket collapse.
- Watch future `swagger-ui-react` upgrades carefully; the security story is still only at `moderate`, not clean.

## Notes

- The anonymous/global rate-limit bucket bug is fixed.
- The dependency graph was rebuilt to satisfy GitHub's Node 20/npm 10 `npm ci` behavior.
