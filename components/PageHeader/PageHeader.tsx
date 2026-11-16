import Link from "next/link"
import type { ReactNode } from "react"
import { Heading } from "@/components/Headings"
import { Icon } from "@/components/Icon"
import { Section } from "@/components/Section"
import styles from "./PageHeader.module.scss"

export type PageHeaderCrumb = { label: string; href?: string }

export type PageHeaderProps = {
	/** Breadcrumb trail; the last item is the current page (no link). */
	crumbs?: PageHeaderCrumb[]
	/** Small pill above the title. */
	eyebrow?: string
	title: string
	/** Optional trailing part of the title, set in the accent colour (e.g. "с нас"). */
	titleAccent?: string
	intro?: string
	/** Buttons under the intro. */
	actions?: ReactNode
}

/**
 * Light page header on a full-width pale band (used instead of a photo hero):
 * breadcrumb, eyebrow pill, title, intro and actions.
 */
export function PageHeader({ crumbs, eyebrow, title, titleAccent, intro, actions }: PageHeaderProps) {
	return (
		<Section size="full" padding="none" classNames={{ main: styles.band }}>
			<header className={styles.header}>
				{crumbs && crumbs.length > 0 && (
					<nav aria-label="Breadcrumb">
						<ol className={styles.header__crumbs}>
							{crumbs.map((crumb, i) => (
								<li key={crumb.label} aria-current={crumb.href ? undefined : "page"}>
									{crumb.href ? (
										<Link href={crumb.href} className={styles.header__crumb}>
											{i === 0 && <Icon name="House" size={14} strokeWidth="1.8" />}
											{crumb.label}
										</Link>
									) : (
										crumb.label
									)}
								</li>
							))}
						</ol>
					</nav>
				)}
				{eyebrow && <span className={styles.header__pill}>{eyebrow}</span>}
				<Heading as="h1" size="h1" className={styles.header__title}>
					{title}
					{titleAccent && (
						<>
							{" "}
							<em className={styles.header__accent}>{titleAccent}</em>
						</>
					)}
				</Heading>
				{intro && <p className={styles.header__lead}>{intro}</p>}
				{actions && <div className={styles.header__actions}>{actions}</div>}
			</header>
		</Section>
	)
}
