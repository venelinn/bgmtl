import clsx from "clsx";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button, type ButtonVariant } from "@/components/Button";
import type { FormElementSize } from "@/types/forms";
import {
  type LinkPresentation,
  parseLinkAppearance,
} from "@/utils/linkHelpers";

export type ContentfulLinkProps = {
  href: string;
  /** Plain-text label when children are not provided */
  label?: string;
  children?: ReactNode;
  fields?: Record<string, unknown>;
  presentation?: LinkPresentation;
  buttonVariant?: ButtonVariant;
  buttonSize?: FormElementSize;
  target?: string;
  className?: string;
  isExternal?: boolean;
};

function resolveTarget(
  href: string,
  target: string | undefined,
  fields: Record<string, unknown> | undefined,
  isExternal: boolean,
): string | undefined {
  const resolved =
    target ??
    (fields?.target as string) ??
    (fields?.external ? "_blank" : isExternal ? "_blank" : "_self");
  return resolved || undefined;
}

export function ContentfulLink({
  href,
  label,
  children,
  fields,
  presentation: presentationProp,
  buttonVariant: buttonVariantProp,
  buttonSize: buttonSizeProp,
  target,
  className,
  isExternal: isExternalProp,
}: ContentfulLinkProps) {
  const isExternal = isExternalProp ?? href.startsWith("http");
  const resolvedTarget = resolveTarget(href, target, fields, isExternal);
  const { presentation, buttonVariant, buttonSize } = fields
    ? parseLinkAppearance(fields)
    : {
        presentation: presentationProp ?? "link",
        buttonVariant: buttonVariantProp ?? "primary",
        buttonSize: buttonSizeProp ?? "md",
      };

  const content = children ?? label ?? "";

  if (presentation === "button") {
    const textLabel = typeof content === "string" ? content : label;
    return (
      <Button
        className={className}
        variant={buttonVariant}
        size={buttonSize}
        label={textLabel}
        href={!isExternal ? href : undefined}
        isExternal={isExternal}
        externalHref={isExternal ? href : undefined}
      />
    );
  }

  const linkClass = clsx("link", "link--active", isExternal && "external-link", className);

  if (isExternal) {
    return (
      <a
        href={href}
        className={linkClass}
        target={resolvedTarget}
        rel={resolvedTarget === "_blank" ? "noopener noreferrer" : undefined}
      >
        <span className="link__text">{content}</span>
      </a>
    );
  }

  return (
    <Link href={href} className={linkClass} target={resolvedTarget}>
      <span className="link__text">{content}</span>
    </Link>
  );
}
