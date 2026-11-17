import type { Metadata } from "next"
import { draftMode } from "next/headers"
import { notFound } from "next/navigation"
import { EventsCalendarConnector } from "@/components/Calendar"
import { GridCollection } from "@/components/Collection"
import { Join } from "@/components/Join"
import { buildMetadata } from "@/components/MetaData"
import { News } from "@/components/News"
import { PageHeader } from "@/components/PageHeader"
import { Section } from "@/components/Section"
import { Sidebar } from "@/components/Sidebar"
import { DonateWidget } from "@/components/Widgets"
import type { NewsItem } from "@/types/news"
import {
	getAllNews,
	getFallbackImageUrl,
	getPageBySlug,
	getSiteConfig,
} from "@/utils/content"
import { getMessages } from "@/utils/getMessages"
import {
	getContentfulLocale,
	getLocalePrefix,
	localization,
} from "@/utils/localization"

// No numeric `revalidate`: Contentful data is cached indefinitely under the
// "contentful" tag (utils/contentful-cache.ts) and busted on publish via the
// webhook. A numeric revalidate here would re-enable traffic-driven polling.

type Params = Promise<{ lang: string }>

type NewsMessages = {
	News?: { sectionTitle?: string; pageIntro?: string; empty?: string }
	Breadcrumbs?: { home?: string; ariaLabel?: string }
}

export async function generateMetadata(props: {
	params: Params
}): Promise<Metadata> {
	const { lang } = await props.params
	const { isEnabled } = await draftMode()
	const messages = getMessages(lang) as NewsMessages

	// Built in code like /events; the Contentful `news` page entry still
	// carries the SEO texts (metaData).
	const page = await getPageBySlug(
		"news",
		getContentfulLocale(lang),
		isEnabled,
	).catch(() => null)
	const meta = (page as { metaData?: Record<string, string> } | null)?.metaData

	return buildMetadata({
		pageTitle: meta?.pageTitle || messages.News?.sectionTitle || "News",
		pageDescription: meta?.pageDescription ?? null,
		keywords: meta?.keywords ?? null,
		path: "news",
		locale: lang,
	})
}

/**
 * Every published news item, newest first. Listed automatically, so a new
 * entry shows up without wiring it into a page collection.
 */
export default async function NewsPage(props: { params: Params }) {
	const { lang } = await props.params
	const { isEnabled } = await draftMode()

	if (!localization.locales.includes(lang)) return notFound()

	const [news, siteConfig] = await Promise.all([
		getAllNews(lang, isEnabled),
		getSiteConfig(lang, isEnabled),
	])

	const messages = getMessages(lang) as NewsMessages
	const t = messages.News ?? {}
	const crumbs = messages.Breadcrumbs ?? {}
	const localePrefix = getLocalePrefix(lang)
	const fallbackImage =
		getFallbackImageUrl(siteConfig?.fallbackNews) ?? undefined

	const sorted = (news as NewsItem[])
		.filter(Boolean)
		.sort(
			(a, b) =>
				new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime(),
		)
	const items = sorted.map((item) => ({
		id: item.id,
		content: (
			<News news={item} locale={lang} fallbackImage={fallbackImage} />
		),
	}))

	return (
		<>
			<PageHeader
				crumbs={[
					{ label: crumbs.home ?? "Home", href: localePrefix || "/" },
					{ label: t.sectionTitle ?? "News" },
				]}
				crumbsLabel={crumbs.ariaLabel}
				title={t.sectionTitle ?? "News"}
				intro={t.pageIntro}
			/>
			<Section padding="small">
				<div className="page__with-sidebar" data-has-sidebar>
					<div className="page__main">
						{items.length > 0 ? (
							<GridCollection items={items} itemsPerRow={1} />
						) : (
							<p>{t.empty}</p>
						)}
					</div>
					<Sidebar>
						<EventsCalendarConnector locale={lang} />
						<DonateWidget />
					</Sidebar>
				</div>
			</Section>
			<Join />
		</>
	)
}
