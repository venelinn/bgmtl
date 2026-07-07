import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { Heading } from "@/components/Headings";
import { Icon } from "@/components/Icon";
import styles from "./DirectoryCard.module.scss";

/**
 * A category chip. A plain string renders a static pill; an object with `href`
 * renders a clickable link (to the category page). `onClick` lets a client parent
 * intercept the navigation for instant in-page filtering.
 */
export type DirectoryCardTag =
	| string
	| {
			label: string;
			href?: string;
			onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
			/** Marks this tag as the currently active category filter. */
			active?: boolean;
	  };

export type DirectoryCardProps = {
	/** Category chips — plain labels, or `{ label, href, onClick }` for clickable category links. */
	tags?: DirectoryCardTag[];
	title?: React.ReactNode;
	/** Logo image URL, rendered at the top of the card (left-aligned, contained). */
	logo?: string;
	address?: string;
	phone?: string;
	email?: string;
	/** Full URL; rendered as an external link in the footer. */
	website?: string;
	/** Free-text note (e.g. placeholder/sample), rendered in a soft box. */
	note?: React.ReactNode;
};

// Normalize a raw phone string into a `tel:` target (strip spaces, dashes, parens).
const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

// A label-less external display of a URL (drop protocol + trailing slash).
const prettyUrl = (url: string) =>
	url.replace(/^https?:\/\//, "").replace(/\/$/, "");

export const DirectoryCard = ({
	tags,
	title,
	logo,
	address,
	phone,
	email,
	website,
	note,
}: DirectoryCardProps) => {
	return (
		<article className={styles.card}>
			{tags && tags.length > 0 && (
				<div className={styles.card__tags}>
					{tags.map((tag) => {
						const t = typeof tag === "string" ? { label: tag } : tag;
						const className = clsx(
							styles.card__tag,
							t.active && styles["card__tag--active"],
						);
						if (t.href) {
							return (
								<a
									key={t.label}
									href={t.href}
									className={className}
									aria-current={t.active ? "true" : undefined}
									onClick={t.onClick}
								>
									{t.label}
								</a>
							);
						}
						return (
							<span key={t.label} className={className}>
								{t.label}
							</span>
						);
					})}
				</div>
			)}

			{logo && (
				<div className={styles.card__logo}>
					<Image
						src={logo}
						alt={title ? String(title) : "Logo"}
						width={90}
						height={90}
					/>
				</div>
			)}

			{title && (
				<div className={styles.card__header}>
					<Heading as="h3" size="h4" className={styles.card__title}>
						{title}
					</Heading>
				</div>
			)}

			{(address || phone || email) && (
				<ul className={styles.card__details}>
					{address && (
						<li className={styles.card__detail}>
							<Icon
								name="MapPin"
								className={styles.card__detailIcon}
								size={16}
								strokeWidth="1.5"
							/>
							<span>{address}</span>
						</li>
					)}
					{phone && (
						<li className={styles.card__detail}>
							<Icon
								name="Phone"
								className={styles.card__detailIcon}
								size={16}
								strokeWidth="1.5"
							/>
							<Link href={telHref(phone)} className={styles.card__detailLink}>
								{phone}
							</Link>
						</li>
					)}
					{email && (
						<li className={styles.card__detail}>
							<Icon
								name="Mail"
								className={styles.card__detailIcon}
								size={16}
								strokeWidth="1.5"
							/>
							<Link
								href={`mailto:${email}`}
								className={styles.card__detailLink}
							>
								{email}
							</Link>
						</li>
					)}
				</ul>
			)}

			{note && <div className={styles.card__note}>{note}</div>}

			{website && (
				<div className={styles.card__footer}>
					<Link
						href={website}
						target="_blank"
						rel="noopener noreferrer"
						className={styles.card__link}
					>
						<Icon
							name="Globe"
							className={styles.card__linkIcon}
							size={16}
							strokeWidth="1.5"
						/>
						<span>{prettyUrl(website)}</span>
					</Link>
				</div>
			)}
		</article>
	);
};

export default DirectoryCard;
