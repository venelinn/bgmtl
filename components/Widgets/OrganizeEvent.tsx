"use client"

import { useTranslations } from "next-intl"
import { Button } from "@/components/Button"
import { Heading } from "@/components/Headings"
import { Icon } from "@/components/Icon"
import styles from "./OrganizeEvent.module.scss"

export type OrganizeEventWidgetProps = {
	/** Locale-prefixed contacts page, where event suggestions go. */
	contactsPath: string
}

/** Sidebar call to action on /events: invites organizers to send their event. */
export const OrganizeEventWidget = ({ contactsPath }: OrganizeEventWidgetProps) => {
	const t = useTranslations("Events")

	return (
		<aside className={styles.organize}>
			<span className={styles.organize__eyebrow}>
				<Icon name="Megaphone" size={16} strokeWidth="1.8" />
				{t("organizeEyebrow")}
			</span>
			<Heading as="h3" size="h3" className={styles.organize__title}>
				{t("organizeTitle")}
			</Heading>
			<p className={styles.organize__text}>{t("organizeText")}</p>
			<Button href={contactsPath} variant="danger" icon="Plus" label={t("organizeButton")} />
		</aside>
	)
}
