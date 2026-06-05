"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/Button";
import { Heading } from "@/components/Headings";
import { Icon } from "@/components/Icon";
import styles from "./HomeEventsHeader.module.scss";

type HomeEventsHeaderProps = {
	href: string;
	showViewAll?: boolean;
};

/**
 * Homepage "Events" header: title on the left, "View all events" link on the
 * same line to the right.
 */
export function HomeEventsHeader({
	href,
	showViewAll = false,
}: HomeEventsHeaderProps) {
	const t = useTranslations("Events");

	return (
		<div className={styles.header}>
			<Heading as="h2" size="h3" className={styles.header__title}>
				<Icon name="PartyPopper" />
				{t("sectionTitle")}
			</Heading>
			{showViewAll && (
				<Button
					href={href}
					variant="link"
					label={t("viewAll")}
					size="sm"
					iconAfter="ArrowRight"
				/>
			)}
		</div>
	);
}
