"use client"

import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { CONSENT_EVENT, readConsent } from "@/components/CookieConsent/consent"
import { Button } from "@/components/Button"
import { Icon } from "@/components/Icon"
import styles from "./MapEmbed.module.scss"

type MapEmbedProps = {
	/** Google Maps embed URL. */
	src: string
	title: string
	height?: number
}

/**
 * Consent-gated Google Maps embed: loads straight away for visitors who
 * accepted cookies in the banner (also live, when they accept on this page);
 * everyone else gets a placeholder with a "show map" button. Nothing is
 * requested from Google before one of the two (see the privacy policy).
 */
export function MapEmbed({ src, title, height = 400 }: MapEmbedProps) {
	const t = useTranslations("Events")
	const [loaded, setLoaded] = useState(false)

	useEffect(() => {
		if (readConsent() === "granted") setLoaded(true)
		const onConsent = (e: Event) => {
			if ((e as CustomEvent).detail === "granted") setLoaded(true)
		}
		window.addEventListener(CONSENT_EVENT, onConsent)
		return () => window.removeEventListener(CONSENT_EVENT, onConsent)
	}, [])

	if (loaded) {
		return (
			<iframe
				className={styles.map__frame}
				width="100%"
				height={height}
				loading="lazy"
				allowFullScreen
				src={src}
				title={title}
			/>
		)
	}

	return (
		<div className={styles.map__placeholder}>
			<Icon name="MapPin" size={32} strokeWidth="1.5" className={styles.map__icon} />
			<p className={styles.map__notice}>{t("mapNotice")}</p>
			<Button
				variant="secondary"
				size="sm"
				icon="Map"
				label={t("showMap")}
				onClick={() => setLoaded(true)}
			/>
		</div>
	)
}
