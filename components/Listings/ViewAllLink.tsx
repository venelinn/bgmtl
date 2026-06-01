"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/Button";

type ViewAllLinkProps = {
  href: string;
  namespace?: "Events" | "News";
};

export function ViewAllLink({ href, namespace = "Events" }: ViewAllLinkProps) {
  const t = useTranslations(namespace);
  return <Button href={href} variant="primary" label={t("viewAll")} size="sm" iconAfter="ArrowRight" />;
}
