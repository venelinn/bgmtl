"use client"

import { useTranslations } from "next-intl"
import { useState } from "react"
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
 * Click-to-load Google Maps embed. Nothing is requested from Google until the
 * visitor asks for the map, so the event page loads no third-party map scripts
 * or cookies by default (see the privacy policy).
 */
export function MapEmbed({ src, title, height = 400 }: MapEmbedProps) {
	const t = useTranslations("Events")
	const [loaded, setLoaded] = useState(false)

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
