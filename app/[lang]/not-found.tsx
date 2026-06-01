"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/Button";
import { Heading } from "@/components/Headings";
import { Section } from "@/components/Section";
import styles from "./not-found.module.scss";

export default function NotFound() {
  const t = useTranslations("NotFound");

  return (
    <Section
      classNames={{ main: styles.main, inner: styles.inner }}
      size="full"
    >
      <div className={styles.notFound}>
        <p className={styles.notFound__code}>404</p>
        <Heading as="h1" size="h2">
          {t("title")}
        </Heading>
        <p className={styles.notFound__description}>
          {t("description")}
        </p>
        <Button
          href="/"
          variant="primary"
          label={t("goHome")}
          iconAfter="ArrowRight"
        />
      </div>
    </Section>
  );
}
