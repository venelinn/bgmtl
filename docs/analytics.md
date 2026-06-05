# Analytics (GA4) + Cookie Consent

**Created**: 2026-06-05

## Summary

Google Analytics 4, loaded **only after the visitor accepts** a bilingual cookie-consent
banner (GDPR/PIPEDA). No GTM — GA4 directly via `@next/third-parties`.

## Pieces

- **`components/CookieConsent/CookieConsent.tsx`** — `"use client"` component that:
  - Reads/writes the decision in `localStorage` under `bgmtl-analytics-consent`
    (`"granted"` | `"denied"`).
  - Shows the banner only when **no decision** has been made yet.
  - Renders `<GoogleAnalytics gaId={GA_ID} />` (from `@next/third-parties/google`) **only
    when consent === `"granted"`** — strict gating, so the gtag script never loads before
    acceptance.
  - Renders **nothing** if `NEXT_PUBLIC_GA_ID` is unset (no analytics → no banner).
  - Copy comes from the `CookieConsent` namespace via `useTranslations` (next-intl).
- **Mount point**: `app/ClientLayout.tsx`, inside `NextIntlClientProvider` (so translations
  resolve). One instance covers every localized page.
- **i18n**: `CookieConsent` namespace in `messages/{en,bg,fr}.json` (`title`, `message`,
  `accept`, `decline`).
- **Env**: `NEXT_PUBLIC_GA_ID` (e.g. `G-XXXXXXXXXX`) in `.env.example`. Set it in the host
  (Netlify) env. Leave blank in non-prod to keep analytics off.

## Notes / future

- **SSR-safe**: `decided` starts `true`, flipped to `false` in `useEffect` after reading
  storage → the banner is absent during SSR and the first client render (no hydration
  mismatch, no flash for already-decided visitors).
- **No "change my mind" UI yet** — to let users revoke, expose a footer link that clears
  `localStorage[bgmtl-analytics-consent]` and reloads.
- **Route-change pageviews** are handled automatically by `@next/third-parties`'
  `GoogleAnalytics` in the App Router.
- **Alternative not used**: Google Consent Mode v2 (load gtag with `consent: denied` default,
  upgrade on accept). We chose strict no-load-until-accept for simplicity; switch later if
  cookieless modeling is wanted.
- **Staging**: analytics is env-gated, so leaving `NEXT_PUBLIC_GA_ID` blank on
  `develop.bgmtl.com` keeps it off there (consistent with the noindex gate in `utils/seo.ts`).
