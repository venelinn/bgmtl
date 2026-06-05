"use client"

import { GoogleAnalytics } from "@next/third-parties/google"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import styles from "./CookieConsent.module.scss"

const STORAGE_KEY = "bgmtl-analytics-consent"
const GA_ID = process.env.NEXT_PUBLIC_GA_ID

type Consent = "granted" | "denied"

/**
 * Consent-gated Google Analytics (GA4).
 *
 * No tracking script loads until the visitor explicitly accepts — required for
 * GDPR/PIPEDA. The choice is persisted in localStorage so the banner only shows
 * once. Rendered inside ClientLayout so `useTranslations` (next-intl) works and
 * the copy is localized (bg/en/fr).
 *
 * If `NEXT_PUBLIC_GA_ID` is unset, nothing renders (no analytics → no banner).
 */
export function CookieConsent() {
	const t = useTranslations("CookieConsent")
	const [consent, setConsent] = useState<Consent | null>(null)
	// Start "decided" so the banner is absent during SSR + first client render
	// (avoids hydration mismatch and a flash for already-decided visitors).
	const [decided, setDecided] = useState(true)

	useEffect(() => {
		const stored = localStorage.getItem(STORAGE_KEY)
		if (stored === "granted" || stored === "denied") {
			setConsent(stored)
		} else {
			setDecided(false)
		}
	}, [])

	const choose = (value: Consent) => {
		localStorage.setItem(STORAGE_KEY, value)
		setConsent(value)
		setDecided(true)
	}

	if (!GA_ID) return null

	return (
		<>
			{consent === "granted" ? <GoogleAnalytics gaId={GA_ID} /> : null}
			{!decided ? (
				<div className={styles.banner} role="dialog" aria-live="polite" aria-label={t("title")}>
					<div className={styles.text}>
						<strong className={styles.title}>{t("title")}</strong>
						<p className={styles.message}>{t("message")}</p>
					</div>
					<div className={styles.actions}>
						<button type="button" className={styles.decline} onClick={() => choose("denied")}>
							{t("decline")}
						</button>
						<button type="button" className={styles.accept} onClick={() => choose("granted")}>
							{t("accept")}
						</button>
					</div>
				</div>
			) : null}
		</>
	)
}
