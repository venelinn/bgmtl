"use client";

import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
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
	/** Logo image URL, shown in the square at the top right (initial letter when absent). */
	logo?: string;
	address?: string;
	phone?: string;
	email?: string;
	/** Full URL; listed with the contacts and used for the footer call to action. */
	website?: string;
	/** Short descriptor or contact person (e.g. "dr. Angel Gabev"), shown under the title. */
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
	const t = useTranslations("Directory");
	const initial = typeof title === "string" ? title.trim().charAt(0) : "";

	// One footer action, best channel first: website → phone → email.
	const cta = website
		? { href: website, label: t("ctaWebsite"), external: true }
		: phone
			? { href: telHref(phone), label: t("ctaCall"), external: false }
			: email
				? { href: `mailto:${email}`, label: t("ctaEmail"), external: false }
				: null;

	return (
		<article className={styles.card}>
			<div className={styles.card__top}>
				{tags && tags.length > 0 && (
					<div className={styles.card__tags}>
						{tags.map((tag) => {
							const tg = typeof tag === "string" ? { label: tag } : tag;
							const className = clsx(
								styles.card__tag,
								tg.active && styles["card__tag--active"],
							);
							if (tg.href) {
								return (
									<a
										key={tg.label}
										href={tg.href}
										className={className}
										aria-current={tg.active ? "true" : undefined}
										onClick={tg.onClick}
									>
										{tg.label}
									</a>
								);
							}
							return (
								<span key={tg.label} className={className}>
									{tg.label}
								</span>
							);
						})}
					</div>
				)}

				<div className={styles.card__logo} aria-hidden={!logo}>
					{logo ? (
						<Image
							src={logo}
							alt={title ? String(title) : "Logo"}
							width={64}
							height={64}
						/>
					) : (
						<span className={styles.card__initial}>{initial}</span>
					)}
				</div>
			</div>

			{title && (
				<Heading as="h3" size="h4" className={styles.card__title}>
					{title}
				</Heading>
			)}

			{note && <p className={styles.card__note}>{note}</p>}

			{(address || phone || email || website) && (
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
					{website && (
						<li className={styles.card__detail}>
							<Icon
								name="Globe"
								className={styles.card__detailIcon}
								size={16}
								strokeWidth="1.5"
							/>
							<Link
								href={website}
								target="_blank"
								rel="noopener noreferrer"
								className={styles.card__detailLink}
							>
								{prettyUrl(website)}
							</Link>
						</li>
					)}
				</ul>
			)}

			{cta && (
				<div className={styles.card__footer}>
					<Link
						href={cta.href}
						target={cta.external ? "_blank" : undefined}
						rel={cta.external ? "noopener noreferrer" : undefined}
						className={styles.card__cta}
					>
						{cta.label}
						<Icon name="ArrowRight" size={16} strokeWidth="1.8" />
					</Link>
				</div>
			)}
		</article>
	);
};

export default DirectoryCard;
