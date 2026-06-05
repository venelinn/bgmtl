# GDPR Readiness

This document tracks what we have in place and what remains to make the site GDPR-ready. Work through the checklist when prioritising privacy/compliance work.

## Current state

- **Auth cookies** (`idToken`, `accessToken`, `refreshToken`) in `app/api/auth/session/route.ts`: HTTP-only, secure in production, `sameSite: 'lax'`. Treated as strictly necessary for authentication — no consent required for these.
- **Privacy Policy**: Referenced in Contentful (e.g. slug `privacy-policy` under a legal parent). Ensure the page is linked from footer and/or cookie banner.
- **YouTube**: `components/Gallery/GalleryBase.tsx` uses `youtube-nocookie.com` for embeds.
- **No third-party analytics/tracking** in the repo (no gtag, GA, Facebook pixel). If added later, they must be gated by consent.
- **Cognito** uses `localStorage` and `sessionStorage` (`services/auth/cognitoStorage.ts`, `cognitoClient.ts`) for session and “Remember me”. Under GDPR/ePrivacy, non-essential use of cookies/local storage should be disclosed and, where required, gated by consent before first use.

## Checklist (to fix later)

| Area | Action |
|------|--------|
| **Cookies / local storage** | Add a cookie/consent banner; only set non-essential cookies/storage after consent; document usage in Privacy Policy. |
| **Privacy Policy** | Publish under e.g. `/legal/privacy-policy`, list data collected, legal basis, retention, processors (AWS, Contentful), user rights, and contact. |
| **User rights** | Provide a clear contact (e.g. “Privacy” or “Data protection”) and, if applicable, account settings for data/export/delete. |
| **Sign-up** | Require explicit consent to Terms + Privacy Policy (no pre-ticked boxes). |
| **Processors** | Sign DPAs with AWS and Contentful; mention them in the Privacy Policy. |

## Recommendations

1. **Cookie consent banner**
   - Show before (or as soon as possible after) first visit.
   - Explain which cookies/storage are used (auth, session, any future analytics).
   - For non-essential uses, set cookies / use storage only after consent (or after “Accept”).
   - Persist the user’s choice and link to Privacy Policy (and Cookie policy if separate).

2. **Privacy Policy content**
   - What data is collected (e.g. email, name, booking data, IP if logged).
   - Legal basis (contract, consent, legitimate interest).
   - Retention and security.
   - Processors (AWS/Cognito, Contentful) and that DPAs are in place.
   - User rights (access, rectification, erasure, portability, objection, restriction) and how to exercise them (contact / account).

3. **User rights**
   - Backend/process to handle access, erasure, portability requests.
   - Frontend: clear contact or “Privacy” link and, if applicable, account settings for viewing/exporting/deleting data.

4. **Registration**
   - Checkboxes for Terms and Privacy Policy with links; no pre-ticked consent boxes.

5. **Processors**
   - Data processing agreements (DPAs) in place with AWS and Contentful; reference in Privacy Policy.

## Relevant files

- Auth cookies: `app/api/auth/session/route.ts`, `app/api/auth/logout/route.ts`
- Cognito storage: `services/auth/cognitoStorage.ts`, `services/auth/cognitoClient.ts`
- Contentful legal/privacy: content model and slugs (e.g. `legal/privacy-policy`)
- Footer/navigation: wherever legal and privacy links are shown (and future cookie banner)
