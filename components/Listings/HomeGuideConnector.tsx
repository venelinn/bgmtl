import { Button } from "@/components/Button"
import {
	CollectionConnector,
	type CollectionConnectorProps,
} from "@/components/Collection/CollectionConnector"
import { Heading } from "@/components/Headings"
import { Icon } from "@/components/Icon"
import { Section } from "@/components/Section"
import { getPageBySlug } from "@/utils/content"
import { getMessages } from "@/utils/getMessages"
import { getContentfulLocale, getLocalePrefix } from "@/utils/localization"
import styles from "./HomeGuide.module.scss"

/** Cards the teaser shows; the rest live on /help. */
const GUIDE_TEASER_COUNT = 3
const GUIDE_SLUG = "help"

type HomeGuideConnectorProps = {
	locale: string
	preview?: boolean
}

type GuideMessages = {
	Guide?: {
		homeEyebrow?: string
		homeTitle?: string
		homeIntro?: string
		viewAll?: string
	}
}

type PageSection = { components?: (CollectionConnectorProps & { type?: string })[] }

/**
 * Homepage help teaser: the first cards of the /help guide
 * collection, so editors pick (and order) them in Contentful there. Renders
 * nothing when the help page or its guide collection is missing.
 */
export async function HomeGuideConnector({
	locale,
	preview = false,
}: HomeGuideConnectorProps) {
	const page = (await getPageBySlug(
		GUIDE_SLUG,
		getContentfulLocale(locale),
		preview,
	).catch(() => null)) as { sections?: PageSection[] } | null

	const collection = page?.sections
		?.flatMap((section) => section.components ?? [])
		.find((c) => c.type === "collection" && c.cardVariant === "guide")
	if (!collection?.cards?.length) return null

	const t = (getMessages(locale) as GuideMessages).Guide ?? {}

	return (
		<Section padding="large">
			<header className={styles.guide__header}>
				<span className={styles.guide__eyebrow}>
					<Icon name="Compass" size={16} strokeWidth="1.8" />
					{t.homeEyebrow}
				</span>
				<Heading as="h2" size="h2" center className={styles.guide__title}>
					{t.homeTitle}
				</Heading>
				<p className={styles.guide__lead}>{t.homeIntro}</p>
			</header>
			<CollectionConnector
				{...collection}
				variant="grid"
				itemsPerRow={3}
				filters={false}
				cards={collection.cards.slice(0, GUIDE_TEASER_COUNT)}
			/>
			<div className={styles.guide__actions}>
				<Button
					href={`${getLocalePrefix(locale)}/${GUIDE_SLUG}`}
					variant="secondary"
					label={t.viewAll}
					iconAfter="ArrowRight"
				/>
			</div>
		</Section>
	)
}
