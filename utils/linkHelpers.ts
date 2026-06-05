/**
 * Link transformation utilities for Contentful data.
 *
 * Converts Contentful menu items (link, page) to a normalized link shape
 * that can be used across navigation, footer, accordions, etc.
 *
 * Supports bilingual URLs via locale prefixing.
 *
 * Link entry appearance (Contentful):
 * - `type` (mapped to `linkPresentation`): "link" | "button" — text vs button UI
 * - `variant`: Button variant when presentation is "button"
 */

import { BUTTON_VARIANTS, type ButtonVariant } from "@/components/Button";
import type { FormElementSize } from "@/types/forms";
import { normalizeSlug } from "./common";
import { localization } from "./localization";

export const LINK_PRESENTATIONS = ["link", "button"] as const;
export type LinkPresentation = (typeof LINK_PRESENTATIONS)[number];

const BUTTON_SIZES = ["sm", "md"] as const;

export function isLinkButtonVariant(value: string | undefined): value is ButtonVariant {
  return Boolean(value && (BUTTON_VARIANTS as readonly string[]).includes(value));
}

function isButtonSize(value: string | undefined): value is FormElementSize {
  return Boolean(value && (BUTTON_SIZES as readonly string[]).includes(value));
}

/**
 * Resolves presentation + button variant + size from Contentful link fields.
 *
 * Presentation is "button" when `type`/`linkPresentation` says so, or when
 * `variant` is a real button style (e.g. "primary", "secondary") rather than the
 * legacy "link"/"button" sentinel. Supports legacy `variant: "link" | "button"`
 * from before `type` was introduced.
 */
export function parseLinkAppearance(fields: Record<string, unknown>): {
  presentation: LinkPresentation;
  buttonVariant: ButtonVariant;
  buttonSize: FormElementSize;
} {
  const rawType = fields.type as string | undefined;
  const rawPresentation = fields.linkPresentation as string | undefined;
  const rawVariant = fields.variant as string | undefined;
  const rawSize = fields.size as string | undefined;

  let presentation: LinkPresentation = "link";

  if (rawType === "link" || rawType === "button") {
    presentation = rawType;
  } else if (rawPresentation === "link" || rawPresentation === "button") {
    presentation = rawPresentation;
  } else if (rawVariant === "link") {
    presentation = "link";
  } else if (rawVariant === "button" || isLinkButtonVariant(rawVariant)) {
    // A concrete button variant (primary, secondary, …) implies a button.
    presentation = "button";
  }

  const buttonVariant =
    presentation === "button" && isLinkButtonVariant(rawVariant) && rawVariant !== "link"
      ? rawVariant
      : presentation === "button" && isLinkButtonVariant(rawType)
        ? rawType
        : "primary";

  const buttonSize: FormElementSize = isButtonSize(rawSize) ? rawSize : "md";

  return { presentation, buttonVariant, buttonSize };
}

export type LinkItem = {
  id: string;
  url: string;
  title: string;
  /** Alias for title - used by Accordion and other components */
  name?: string;
  target?: string;
  icon: string | null;
  highlight?: boolean;
  presentation?: LinkPresentation;
  buttonVariant?: ButtonVariant;
  buttonSize?: FormElementSize;
};

/** URL from a raw Contentful link entry `fields` object (rich text, embeds). */
export function getLinkFieldsUrl(fields: Record<string, unknown>): string | undefined {
  let url =
    (fields.url as string) ||
    (fields.URL as string) ||
    (
      fields.attachment as {
        fields?: { url?: string; file?: { url?: string } };
      }
    )?.fields?.url ||
    (fields.attachment as { fields?: { file?: { url?: string } } })?.fields?.file?.url;
  if (url?.startsWith("//")) url = `https:${url}`;
  return url;
}

/**
 * Infers a Lucide icon name from a social media URL.
 * Used when Contentful link has no iconName set.
 */
export function inferIconFromUrl(url: string): string | null {
  if (!url || typeof url !== "string") return null;
  const lower = url.toLowerCase();
  if (lower.includes("facebook.com")) return "Facebook";
  if (lower.includes("instagram.com")) return "Instagram";
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) return "Youtube";
  if (lower.includes("linkedin.com")) return "Linkedin";
  if (lower.includes("twitter.com") || lower.includes("x.com")) return "Twitter";
  if (lower.includes("tiktok.com")) return "TikTok";
  if (lower.includes("pinterest.com")) return "Pinterest";
  return null;
}

/** Normalize Contentful highlight field (supports "highlightInMenu", "highlight" or "highlights", and localized objects) */
function normalizeHighlight(item: Record<string, unknown>): boolean {
  const h = item?.highlightInMenu ?? item?.highlight ?? item?.highlights;
  if (h === true) return true;
  if (typeof h === "object" && h !== null) return Object.values(h).some(Boolean);
  return false;
}

/**
 * Builds internal page URLs by combining parent and slug fields with locale prefixing.
 * Only adds locale prefix for non-default locales (e.g., /en/ for English, but not /bg/ for Bulgarian).
 *
 * @param parent - Parent slug (e.g., "about-us")
 * @param slug - Child slug (e.g., "mission")
 * @param locale - Current locale (e.g., "bg", "en")
 * @returns Normalized URL path (e.g., "/about-us/mission" or "/en/about-us/mission")
 */
export function buildPageUrl(parent?: string, slug?: string, locale?: string): string {
  const localePrefix = locale && locale !== localization.defaultLocale ? locale : undefined;

  if (!parent && !slug && !localePrefix) {
    return "#";
  }

  const parts = [localePrefix, parent, slug]
    .filter(Boolean)
    .map((part) => String(part).replace(/^\/+|\/+$/g, ""))
    .filter(Boolean);

  if (!parts.length) {
    return "#";
  }

  return normalizeSlug(parts.join("/"));
}

/**
 * Converts a Contentful menu item to a normalized link object.
 * Handles two types: "link" (external URLs) and "page" (internal pages with slug)
 *
 * @param item - Contentful menu item (link or page entry)
 * @param locale - Current locale for URL building
 * @returns Link object or null if item type not supported
 */
export function contentfulItemToLink(
  item: Record<string, unknown> | null | undefined,
  locale?: string,
): LinkItem | null {
  if (!item || typeof item !== "object") return null;

  const type = item.type as string | undefined;

  if (type === "link") {
    const title = (item.name as string) ?? "";
    const url = (item.url as string) ?? "#";
    const iconName = (item.iconName as string) || inferIconFromUrl(url) || null;
    const { presentation, buttonVariant, buttonSize } = parseLinkAppearance(item);
    return {
      id: item.id as string,
      url,
      title,
      name: title,
      target: item.target as string | undefined,
      icon: iconName,
      highlight: normalizeHighlight(item),
      presentation,
      buttonVariant,
      buttonSize,
    };
  }

  if (type === "page") {
    const pageTitle =
      (item.pageName as { heading?: string })?.heading ?? (item.title as string) ?? (item.name as string) ?? "";
    const url = buildPageUrl(item.parent as string | undefined, item.slug as string | undefined, locale);
    return {
      id: item.id as string,
      url,
      title: pageTitle,
      name: pageTitle,
      target: item.target as string | undefined,
      icon: (item.iconName as string) || null,
      highlight: normalizeHighlight(item),
    };
  }

  return null;
}

/**
 * Converts a Contentful entry (from RichText embedded entry) to a link object.
 * Handles "link" and "page" content types. Use when the entry has sys/fields structure
 * (e.g. from node.data.target in rich text renderers).
 *
 * @param entry - Contentful entry with sys and fields
 * @param locale - Optional app locale (en, fr, es). Falls back to entry.sys.locale (e.g. en-CA -> en)
 */
export function contentfulEntryToLink(
  entry:
    | {
        sys?: { contentType?: { sys?: { id?: string } }; id?: string; locale?: string };
        fields?: Record<string, unknown>;
      }
    | null
    | undefined,
  locale?: string,
): LinkItem | null {
  if (!entry?.fields) return null;

  const contentType = entry.sys?.contentType?.sys?.id;
  const fields = entry.fields;

  // Normalize locale: "en-CA" -> "en"
  const appLocale = locale ?? (entry.sys?.locale?.split("-")[0] as string | undefined);

  if (contentType === "link") {
    const linkUrl = getLinkFieldsUrl(fields) ?? "#";
    const title = (fields.name as string) ?? (fields.title as string) ?? "Link";
    const isExternal = linkUrl.startsWith("http");
    const target = (fields.target as string) ?? (fields.external ? "_blank" : isExternal ? "_blank" : "_self");
    const { presentation, buttonVariant, buttonSize } = parseLinkAppearance(fields);
    return {
      id: (entry.sys?.id as string) ?? "",
      url: linkUrl,
      title,
      name: title,
      target: target || undefined,
      icon: null,
      highlight: false,
      presentation,
      buttonVariant,
      buttonSize,
    };
  }

  if (contentType === "page") {
    const slug = fields.slug as string | undefined;
    const parent = fields.parent as string | undefined;
    const url = buildPageUrl(parent, slug, appLocale);
    // Get title from Heading reference (pageName) - supports heading.heading or pageName.heading
    const headingRef = (fields.pageName ?? fields.heading) as
      | { heading?: string; fields?: { heading?: string } }
      | undefined;
    const pageTitle =
      headingRef?.heading ?? headingRef?.fields?.heading ?? (fields.title as string) ?? (fields.name as string) ?? "";
    return {
      id: (entry.sys?.id as string) ?? "",
      url,
      title: pageTitle,
      name: pageTitle,
      target: fields.target as string | undefined,
      icon: null,
      highlight: false,
    };
  }

  return null;
}
