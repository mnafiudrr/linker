# 013 — Landing Page with 3D Linked-Dots Visual

- **Status:** done
- **Depends on:** [010, 011]
- **GitHub issue:** #4

## Goal

`/` becomes a landing page: animated linked-dots particle network with depth/parallax (canvas, zero deps), tagline, Sign in / Sign up CTAs. Logged-in users redirect to `/dashboard`.

## Checklist

- [x] Canvas particle network: floating dots + connecting lines + mouse parallax depth
- [x] Respects theme colors and `prefers-reduced-motion`
- [x] Hero copy + CTA buttons; ThemeToggle in header
- [x] Redirect authenticated users to `/dashboard`
- [x] lint / typecheck / tests clean, live smoke check

## Acceptance Criteria

- [x] Landing renders animated dots; CTAs navigate to /sign-in, /sign-up
- [x] Authenticated visit redirects to /dashboard

## Notes

Canvas sized via devicePixelRatio; animation paused when tab hidden.
