"use client";

import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { NewsProps } from "@/types/news";
import { getNewsPermalink } from "@/utils/common";
import { FormattedDate } from "@/utils/DateFormat";
import { renderRichTextContent } from "@/utils/RichText";
import { Heading } from "../Headings";
import styles from "./News.module.scss";

const DEFAULT_FALLBACK_IMAGE =
  "https://res.cloudinary.com/dysoiulfl/image/upload/v1770477066/ORBF_logo_small_dnaxwz.jpg";

export const News = ({ news, locale, fallbackImage }: NewsProps) => {
  const t = useTranslations("News");
  const [imageError, setImageError] = useState(false);
  const effectiveFallback = fallbackImage ?? DEFAULT_FALLBACK_IMAGE;

  const hasCover = !!news.cover?.[0];
  const cover = news.cover?.[0] ?? {
    src: effectiveFallback,
    alt: "News cover",
    width: 507,
    height: 86,
  };
  const isFallback = !hasCover || imageError;

  const headingText =
    typeof news.heading === "string"
      ? news.heading
      : news.heading && typeof news.heading === "object" && "heading" in news.heading
        ? news.heading.heading
        : "";

  const bulgarianHeading = (news as { bgHeading?: string }).bgHeading || headingText;
  const newsDetailHref = getNewsPermalink({
    locale,
    title: bulgarianHeading ? String(bulgarianHeading) : "news",
  });

  return (
    <div className={styles.news}>
      <div className={styles.news__date}>
        <FormattedDate dateStr={news.date} locale={locale} includeYear={true} />
      </div>

      <figure className={styles.news__image}>
        <Link
          href={newsDetailHref}
          title={String(headingText) ?? "News cover"}
          className={styles.news__imageLink}
        >
          <Image
            src={cover.src}
            alt={String(headingText) ?? "News cover"}
            width={cover.width}
            height={cover.height}
            className={clsx(isFallback && styles.news__imageFallback)}
            onError={() => setImageError(true)}
          />
        </Link>
      </figure>
      <div className={styles.news__content}>
        <Heading as="h3" size="h3" className={styles.news__title}>
          <Link href={newsDetailHref} className={styles.news__titleLink}>
            {String(headingText || "News")}
          </Link>
        </Heading>
        {news.excerpt ? (
          <div className={styles.news__excerpt}>
            {renderRichTextContent(news.excerpt as object)}
            <Link href={newsDetailHref} className={styles.readMoreLink}>
              {t("readMore")}
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
};
