import clsx from "clsx"
import Link from "next/link"
import { Icon } from "@/components/Icon"
import { JsonLd } from "@/components/JsonLd"
import { buildBreadcrumbJsonLd } from "@/utils/structuredData"
import styles from "./Breadcrumbs.module.scss"

export type Crumb = {
	label: string
	/** Locale-prefixed path; omit on the last item (the current page). */
	href?: string
}

type BreadcrumbsProps = {
	crumbs: Crumb[]
	/** Accessible name of the nav, e.g. "Breadcrumb" in the page language. */
	ariaLabel?: string
	className?: string
}

/**
 * Breadcrumb trail (first item gets a home icon, the last is the current page)
 * plus matching BreadcrumbList structured data for search engines.
 */
export function Breadcrumbs({ crumbs, ariaLabel = "Breadcrumb", className }: BreadcrumbsProps) {
	if (crumbs.length < 2) return null

	return (
		<>
			<nav aria-label={ariaLabel} className={clsx(styles.breadcrumbs, className)}>
				<ol className={styles.breadcrumbs__list}>
					{crumbs.map((crumb, i) => (
						<li
							key={`${crumb.label}-${i}`}
							className={styles.breadcrumbs__item}
							aria-current={crumb.href ? undefined : "page"}
						>
							{crumb.href ? (
								<Link href={crumb.href} className={styles.breadcrumbs__link}>
									{i === 0 && <Icon name="House" size={14} strokeWidth="1.8" />}
									{crumb.label}
								</Link>
							) : (
								<span className={styles.breadcrumbs__current}>{crumb.label}</span>
							)}
						</li>
					))}
				</ol>
			</nav>
			<JsonLd data={buildBreadcrumbJsonLd(crumbs)} />
		</>
	)
}
