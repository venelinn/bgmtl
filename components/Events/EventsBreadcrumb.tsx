"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { Icon } from "@/components/Icon"
import styles from "./EventsPageHeader.module.scss"

/** "Начало / Събития" breadcrumb for /events. */
export function EventsBreadcrumb({ localePrefix }: { localePrefix: string }) {
	const t = useTranslations("Events")

	return (
		<nav aria-label="Breadcrumb">
			<ol className={styles.header__crumbs}>
				<li>
					<Link href={localePrefix || "/"} className={styles.header__crumb}>
						<Icon name="House" size={14} strokeWidth="1.8" />
						{t("breadcrumbHome")}
					</Link>
				</li>
				<li aria-current="page">{t("sectionTitle")}</li>
			</ol>
		</nav>
	)
}
