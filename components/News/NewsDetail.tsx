import { BackButton } from "@/components/Button/BackButton";
import { Section } from "@/components/Section";
import type { NewsItem } from "@/types/news";
import { slugify } from "@/utils/common";
import { FormattedDate } from "@/utils/DateFormat";
import { getMessages } from "@/utils/getMessages";
import { renderRichTextContent } from "@/utils/RichText";
import { Hero } from "../Hero";
import styles from "./NewsDetail.module.scss";

const DEFAULT_HERO_FALLBACK =
	"https://res.cloudinary.com/dysoiulfl/image/upload/v1772075435/ChatGPT_Image_Feb_25_2026_10_08_56_PM_ppl4ir.png";

type NewsDetailProps = {
	news: NewsItem;
	locale: string;
	/** Fallback image for hero when news has no cover (from site config fallbackNews). */
	heroFallbackImage?: string;
};

export const NewsDetail = ({
	news,
	locale,
	heroFallbackImage,
}: NewsDetailProps) => {
	const messages = getMessages(locale) as { News?: { backToNews?: string } };
	const heroFallback = heroFallbackImage ?? DEFAULT_HERO_FALLBACK;

	// Must match the name the source news card applies on click (see News.tsx):
	// derived from the Bulgarian heading so the cover morphs into this hero.
	const headingForSlug =
		typeof news.heading === "string"
			? news.heading
			: news.heading &&
					typeof news.heading === "object" &&
					"heading" in news.heading &&
					typeof news.heading.heading === "string"
				? news.heading.heading
				: "";
	const bgHeading =
		(news as { bgHeading?: string }).bgHeading || headingForSlug;
	const heroTransitionName = `news-hero-${slugify(String(bgHeading || "news"))}`;

	return (
		<>
			<Hero
				images={
					news.cover?.length
						? news.cover
						: [{ src: heroFallback, url: heroFallback }]
				}
				size="full"
				viewTransitionName={heroTransitionName}
				imageAlignment="top"
				height={(news.heroHeight as "full" | "half" | "quarter") || "half"}
				heading={
					typeof news.heading === "string"
						? {
								heading: news.heading,
								size: "hero" as const,
								as: "h1" as const,
							}
						: { ...news.heading, size: "hero" as const, as: "h1" as const }
				}
				content={
					<FormattedDate
						dateStr={news.date}
						locale={locale}
						includeYear={true}
						fullFormat={true}
					/>
				}
			/>
			<Section size="small">
				<div className={styles.newsDetail}>
					<BackButton className={styles.backLink}>
						← {messages.News?.backToNews}
					</BackButton>

					{news.content ? (
						<div className={styles.newsContent}>
							{renderRichTextContent(news.content as object)}
						</div>
					) : null}
				</div>
			</Section>
		</>
	);
};
