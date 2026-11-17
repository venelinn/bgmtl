import type { ReactNode } from "react"
import { Breadcrumbs, type Crumb } from "@/components/Breadcrumbs"
import { Heading } from "@/components/Headings"
import { Section } from "@/components/Section"
import { renderRichTextContent } from "@/utils/RichText"
import styles from "./PageHeader.module.scss"

export type PageHeaderCrumb = Crumb

export type PageHeaderProps = {
	/** Breadcrumb trail; the last item is the current page (no link). */
	crumbs?: PageHeaderCrumb[]
	/** Accessible name of the breadcrumb nav (page language). */
	crumbsLabel?: string
	/** Small pill above the title. */
	eyebrow?: string
	title: string
	/** Optional trailing part of the title, set in the accent colour (e.g. "с нас"). */
	titleAccent?: string
	/** Plain text, or a Contentful rich-text document (CMS pages). */
	intro?: string | object
	/** Buttons under the intro. */
	actions?: ReactNode
}

/**
 * Light page header on a full-width pale band (used instead of a photo hero):
 * breadcrumb, eyebrow pill, title, intro and actions.
 */
export function PageHeader({ crumbs, crumbsLabel, eyebrow, title, titleAccent, intro, actions }: PageHeaderProps) {
	return (
		<Section size="full" padding="none" classNames={{ main: styles.band }}>
			<header className={styles.header}>
				{crumbs && <Breadcrumbs crumbs={crumbs} ariaLabel={crumbsLabel} />}
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
				{typeof intro === "string" ? (
					<p className={styles.header__lead}>{intro}</p>
				) : (
					intro && <div className={styles.header__lead}>{renderRichTextContent(intro)}</div>
				)}
				{actions && <div className={styles.header__actions}>{actions}</div>}
			</header>
		</Section>
	)
}
