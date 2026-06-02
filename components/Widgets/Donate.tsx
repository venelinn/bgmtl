"use client"

import { useTranslations } from "next-intl"
import { Button } from "@/components/Button"
import { Heading } from "@/components/Headings"
import Care from "@/components/Icons/Care"
import styles from "./Donate.module.scss" // adjust path if needed

const PAYPAL_DONATE_URL = "https://paypal.me/bgmontreal"

export const DonateWidget = () => {
	const t = useTranslations()

	return (
		<aside className={styles["donate-widget"]}>
			<Heading as="h2" size="base" highlight>
				{t("Donate.title")}
			</Heading>

			<div className={styles["donate-widget__media"]}>
				<span className={styles["donate-widget__icon"]}>
					<Care />
				</span>
				<p className={styles["donate-widget__text"]}>
					{t("Donate.description")}
				</p>
			</div>

			<Button
				externalHref={PAYPAL_DONATE_URL}
				isExternal
				iconAfter="Coffee"
				label={t("Donate.button")}
				variant="primary"
				className={styles["donate-widget__button"]}
			/>

			<small className={styles["donate-widget__trust"]}>
				{t("Donate.trust")}
			</small>
		</aside>
	)
}
