"use client"

import clsx from "clsx"
import { useTranslations } from "next-intl"
import { Button } from "@/components/Button"
import { Heading } from "@/components/Headings"
import { Icon } from "@/components/Icon"
import Care from "@/components/Icons/Care"
import styles from "./Donate.module.scss" // adjust path if needed

const PAYPAL_DONATE_URL = "https://paypal.me/bgmontreal"

export interface DonateWidgetProps {
	/**
	 * Visual treatment. `"dark"` renders the navy, stacked call-to-action used
	 * on the homepage sidebar; `"light"` (default) keeps the boxed widget used
	 * elsewhere.
	 */
	variant?: "light" | "dark"
}

export const DonateWidget = ({ variant = "light" }: DonateWidgetProps) => {
	const t = useTranslations()

	if (variant === "dark") {
		return (
			<aside
				className={clsx(styles["donate-widget"], styles["donate-widget--dark"])}
			>
				<Heading
					as="h2"
					size="base"
					highlight
					className={styles["donate-widget__title"]}
				>
					{t("Donate.title")}
				</Heading>

				<p className={styles["donate-widget__text"]}>
					{t("Donate.description")}
				</p>

				<Button
					externalHref={PAYPAL_DONATE_URL}
					isExternal
					icon="Coffee"
					label={t("Donate.button")}
					variant="danger"
					className={styles["donate-widget__button"]}
				/>

				<Icon
					name="Heart"
					className={styles["donate-widget__watermark"]}
					aria-hidden="true"
				/>
			</aside>
		)
	}

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
