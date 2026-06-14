"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Button } from "@/components/Button";
import { Heading } from "@/components/Headings";
import { useSubscribe } from "@/components/Subscribe/useSubscribe";
import { Section } from "../Section";
import styles from "./Join.module.scss";

const DEFAULT_JOIN_IMAGE =
	"https://res.cloudinary.com/dgly3nv8f/image/upload/v1780489756/join_wuuf2g.png";

export type JoinProps = {
	image?: { src: string; alt?: string };
};

/**
 * Full-width "Join our community" call-to-action. Replaces the sidebar
 * newsletter widget on the homepage — reuses the mailing-list submit logic
 * (useSubscribe) in a larger, image-led layout.
 */
export function Join({ image }: JoinProps) {
	const t = useTranslations("Join");
	const { email, setEmail, status, errorMessage, handleSubmit } =
		useSubscribe();

	const imageSrc = image?.src ?? DEFAULT_JOIN_IMAGE;
	const imageAlt = image?.alt ?? t("imageAlt");

	return (
		<Section
			aria-label={t("title")}
			classNames={{ inner: styles.join }}
			paddingControl="removeTop"
			id="join-our-community"
		>
			<div className={styles.join__content}>
				<span className={styles.join__eyebrow}>{t("eyebrow")}</span>
				<Heading as="h2" size="h2" className={styles.join__title}>
					{t("title")}
				</Heading>
				<p className={styles.join__description}>{t("description")}</p>

				<form className={styles.join__form} onSubmit={handleSubmit}>
					<input
						className={styles.join__input}
						type="email"
						required
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder={t("emailPlaceholder")}
						aria-label={t("emailPlaceholder")}
					/>
					<Button
						type="submit"
						variant="primary"
						disabled={status === "loading"}
						label={status === "loading" ? t("subscribing") : t("button")}
						icon="Send"
						className={styles.join__submit}
					/>
				</form>

				<output className={styles.join__status} aria-live="polite">
					{status === "success" && (
						<span className={styles["join__status--success"]}>
							{t("successMessage")} 🎉
						</span>
					)}
					{status === "error" && (
						<span className={styles["join__status--error"]}>
							{errorMessage}
						</span>
					)}
				</output>
			</div>

			<div className={styles.join__media}>
				<Image
					className={styles.join__image}
					src={imageSrc}
					alt={imageAlt}
					fill
					sizes="(max-width: 48rem) 100vw, 40vw"
				/>
			</div>
		</Section>
	);
}
