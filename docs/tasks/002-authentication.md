# 002 — Authentication

- **Status:** done
- **Depends on:** [001]

## Goal

Integrate Better Auth with email/password (credential provider), wired to the Drizzle schema, with sign-up/sign-in pages, session cookie handling, route protection for `/dashboard`, and a `requireUser()` helper for server-side checks.

## Checklist

- [ ] Configure Better Auth server instance + Drizzle adapter; generate its schema additions if any
- [ ] Set `BETTER_AUTH_SECRET` / `BETTER_AUTH_URL` in env validation
- [ ] Build `/sign-in` and `/sign-up` pages with Zod-validated forms and error feedback
- [ ] Add middleware/layout guard: unauthenticated → redirect `/sign-in`
- [ ] Add `requireUser()` util returning session user or throwing/redirecting
- [ ] Sign-out action; generic error messages on bad credentials

## Acceptance Criteria

- [ ] Full loop works: sign up → auto session → dashboard access → sign out → sign in
- [ ] Visiting `/dashboard` while logged out redirects to `/sign-in`
- [ ] Session cookie is HTTP-only, Secure in production, SameSite=Lax

## Notes

Flow reference: `docs/diagrams/auth-flow.puml`.
