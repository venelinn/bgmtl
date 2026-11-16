"use client";

import { GoogleAnalytics } from "@next/third-parties/google";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { getLocalePrefix } from "@/utils/localization";
import { CONSENT_EVENT, CONSENT_STORAGE_KEY, type Consent, readConsent } from "./consent";
import styles from "./CookieConsent.module.scss";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

/**
 * Consent-gated Google Analytics (GA4) and embedded Google Maps (MapEmbed
 * listens for CONSENT_EVENT).
 *
 * No tracking script loads until the visitor explicitly accepts — required for
 * GDPR/PIPEDA. The choice is persisted in localStorage so the banner only shows
 * once. Rendered inside ClientLayout so `useTranslations` (next-intl) works and
 * the copy is localized (bg/en/fr).
 *
 * If `NEXT_PUBLIC_GA_ID` is unset, nothing renders (no analytics → no banner).
 */
export function CookieConsent() {
	const t = useTranslations("CookieConsent");
	const locale = useLocale();
	const [consent, setConsent] = useState<Consent | null>(null);
	// Start "decided" so the banner is absent during SSR + first client render
	// (avoids hydration mismatch and a flash for already-decided visitors).
	const [decided, setDecided] = useState(true);

	useEffect(() => {
		const stored = readConsent();
		if (stored) {
			setConsent(stored);
		} else {
			setDecided(false);
		}
	}, []);

	const choose = (value: Consent) => {
		localStorage.setItem(CONSENT_STORAGE_KEY, value);
		window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
		setConsent(value);
		setDecided(true);
	};

	if (!GA_ID) return null;

	return (
		<>
			{consent === "granted" ? <GoogleAnalytics gaId={GA_ID} /> : null}
			{!decided ? (
				<div
					className={styles.banner}
					role="dialog"
					aria-live="polite"
					aria-label={t("title")}
				>
					<div className={styles.text}>
						<strong className={styles.title}>{t("title")}</strong>
						<p className={styles.message}>
							{t("message")}{" "}
							<Link href={`${getLocalePrefix(locale)}/privacy`} className="link">
								<span className="link__text">{t("learnMore")}</span>
							</Link>
						</p>
					</div>
					<div className={styles.actions}>
						<Button
							label={t("decline")}
							variant="secondary"
							outlined
							size="sm"
							onClick={() => choose("denied")}
						/>
						<Button
							label={t("accept")}
							variant="secondary"
							size="sm"
							onClick={() => choose("granted")}
						/>
					</div>
				</div>
			) : null}
		</>
	);
}
