import { Button } from "@/components/Button";
import { Heading, type HeadingProps } from "@/components/Headings";
import { Icon } from "@/components/Icon";
import { renderRichTextContent } from "@/utils/RichText";
import styles from "./TierCard.module.scss";

export type TierCardProps = {
	/** lucide-react icon name, shown above the tier name. */
	icon?: string;
	/** Tier name (e.g. "Партньор"). */
	heading?: HeadingProps;
	/** Price with its period, as written in the CMS (e.g. "500 $ / година"). */
	price?: string;
	/** Benefits: a Contentful rich-text list (or plain text). */
	content?: unknown;
	/** Call to action, e.g. the contact form with the partnership topic. */
	link?: { url?: string; name?: string };
	/** Highlighted tier: accent border, badge and a filled button. */
	featured?: boolean;
	/** Badge text on the featured tier (page language). */
	featuredLabel?: string;
};

/**
 * Sponsorship / pricing tier: icon, name, price, benefit list with check
 * marks and a call-to-action button.
 */
export const TierCard = ({ icon, heading, price, content, link, featured = false, featuredLabel }: TierCardProps) => (
	<article className={styles.tier} data-featured={featured || undefined}>
		{featured && featuredLabel && <span className={styles.tier__badge}>{featuredLabel}</span>}
		<div className={styles.tier__head}>
			{icon && (
				<span className={styles.tier__icon} aria-hidden="true">
					<Icon name={icon} size={24} strokeWidth="1.75" />
				</span>
			)}
			{heading?.heading && (
				<Heading as={heading.as ?? "h3"} size={heading.size ?? "h4"} className={styles.tier__name}>
					{heading.heading}
				</Heading>
			)}
			{price && <p className={styles.tier__price}>{price}</p>}
		</div>

		{content ? (
			<div className={styles.tier__benefits}>
				{typeof content === "string" ? <p>{content}</p> : renderRichTextContent(content as object)}
			</div>
		) : null}

		{link?.url && (
			<Button
				href={link.url}
				label={link.name}
				variant={featured ? "danger" : "secondary"}
				iconAfter="ArrowRight"
				className={styles.tier__cta}
			/>
		)}
	</article>
);

export default TierCard;
