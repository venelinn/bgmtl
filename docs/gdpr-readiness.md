# Privacy & Consent Readiness

**Updated**: 2026-11-16 (rewritten — the previous version described another project:
Cognito/AWS/bookings, none of which exist here).

Applicable law: Québec Law 25 and PIPEDA (Canada); GDPR only for EU visitors.

## In place

| Area | Where |
|---|---|
| **Privacy policy** | Contentful page `/privacy` (BG/EN/FR), one Paragraph with H2 sections. Linked from the footer bottom row and the cookie banner. Contact: bulgariancommunity@yahoo.ca (role only — see open items). |
| **Consent banner** | `components/CookieConsent` — nothing non-essential loads before "Приемам". Choice in `localStorage` (`bgmtl-analytics-consent`). See `docs/analytics.md`. |
| **Google Analytics** | Loaded only after consent. |
| **Google Maps (event pages)** | `components/Events/MapEmbed.tsx` — after consent, or a click on "Покажи картата". |
| **Own cookies** | None. Browser storage only: consent choice, theme (`bgmtl-theme`), intro-animation flag (sessionStorage). |
| **Contact form** | `/contacts` — Netlify Forms; required consent checkbox linking to `/privacy`. Fields must match `public/__forms.html`. |
| **Newsletter** | Brevo (`/api/subscribe`); every email has an unsubscribe link. |
| **Processors named in the policy** | Netlify, Brevo, Google, Contentful, Cloudinary; PayPal for donations (off-site). |

## Open items

- **Name the person in charge** of personal information (Law 25 expects a named person) — add to the policy in Contentful.
- **Policy wording on maps**: say maps load "after you accept cookies in the banner, or click Покажи картата" (currently "only when you click"). Update in BG/EN/FR after the consent-gated map is deployed.
- **"Change my mind" link**: no UI to revoke consent yet (clearing site data works) — add a footer link that clears the key and reloads.
- **Legal review** of the policy text if certainty is needed.
- If any new third-party embed/script is added: gate it on `readConsent()` / `CONSENT_EVENT` and list it in the policy.
