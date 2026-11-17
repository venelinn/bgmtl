import { Heading, type HeadingProps } from "@/components/Headings";
import { Icon } from "@/components/Icon";
import { renderRichTextContent } from "@/utils/RichText";
import styles from "./GuideCard.module.scss";

export type GuideCardProps = {
	/** lucide-react icon name, shown in the tinted square. */
	icon?: string;
	/** Topic label above the title (e.g. "Здраве"). */
	eyebrow?: string;
	heading?: HeadingProps;
	/** Plain text or a Contentful rich-text document. */
	content?: unknown;
	/** Official source; opens in a new tab. */
	link?: { url?: string; name?: string };
	/** Category colour, 1–6 (`--category-n`); untinted when unset. */
	tone?: number;
};

// "https://www.quebec.ca/en/…" → "quebec.ca": names the source under the text.
const sourceHost = (url: string) => {
	try {
		return new URL(url).hostname.replace(/^www\./, "");
	} catch {
		return "";
	}
};

/**
 * Newcomer-guide card: icon, topic, title, short explanation and a link to
 * the official page it summarizes.
 */
export const GuideCard = ({ icon, eyebrow, heading, content, link, tone }: GuideCardProps) => {
	const host = link?.url ? sourceHost(link.url) : "";

	return (
		<article className={styles.guide} data-tone={tone || undefined}>
			<div className={styles.guide__body}>
				{icon && (
					<span className={styles.guide__icon} aria-hidden="true">
						<Icon name={icon} size={24} strokeWidth="1.75" />
					</span>
				)}
				{eyebrow && <span className={styles.guide__eyebrow}>{eyebrow}</span>}
				{heading?.heading && (
					<Heading as={heading.as ?? "h3"} size={heading.size ?? "h4"} className={styles.guide__title}>
						{heading.heading}
					</Heading>
				)}
				{content ? (
					<div className={styles.guide__text}>
						{typeof content === "string" ? <p>{content}</p> : renderRichTextContent(content as object)}
					</div>
				) : null}
			</div>

			{link?.url && (
				<div className={styles.guide__footer}>
					{host && <span className={styles.guide__source}>{host}</span>}
					<a href={link.url} target="_blank" rel="noopener noreferrer" className={styles.guide__link}>
						{link.name || host}
						<Icon name="ArrowUpRight" size={16} strokeWidth="1.8" />
					</a>
				</div>
			)}
		</article>
	);
};

export default GuideCard;
