import type { Document } from "@contentful/rich-text-types";
import { isValidElement, type ReactNode } from "react";
import { richTextToPlain } from "@/utils/directory";
import { isRichTextDocument, renderRichTextContent } from "@/utils/RichText";

export type HeroContent = Document | Record<string, unknown> | string | ReactNode;

function isLocaleFieldMap(obj: Record<string, unknown>): boolean {
  const keys = Object.keys(obj);
  if (keys.length === 0) return false;
  return keys.every((k) => /^[a-z]{2}(-[A-Z]{2})?$/i.test(k));
}

/** Unwrap `{ "bg-BG": value }` shapes when locale flattening did not run. */
export function unwrapLocaleField(value: unknown, locale?: string): unknown {
  if (value == null || typeof value !== "object" || Array.isArray(value)) return value;
  if ("sys" in value && (value as { sys?: unknown }).sys) return value;
  if (isRichTextDocument(value)) return value;

  const record = value as Record<string, unknown>;
  if (!isLocaleFieldMap(record)) return value;

  if (locale) {
    const withRegion = locale.includes("-") ? locale : undefined;
    for (const key of [withRegion, locale, "bg-BG", "en-CA", "en-US"].filter(Boolean) as string[]) {
      if (key in record && record[key] !== undefined) return record[key];
    }
  }
  return Object.values(record)[0];
}

/** True when the document has copy, embedded entries (buttons/links), or assets — not just empty nodes. */
export function richTextIsRenderable(doc: unknown): doc is Document {
  if (!isRichTextDocument(doc)) return false;
  if (richTextToPlain(doc).trim().length > 0) return true;

  const walk = (nodes: unknown[]): boolean => {
    for (const node of nodes) {
      if (!node || typeof node !== "object") continue;
      const n = node as { nodeType?: string; content?: unknown[] };
      if (n.nodeType?.includes("embedded-entry") || n.nodeType === "embedded-asset-block") {
        return true;
      }
      if (Array.isArray(n.content) && walk(n.content)) return true;
    }
    return false;
  };

  return walk(doc.content ?? []);
}

/**
 * Hero body from Contentful. Uses Rich Text `content` when present; legacy Text
 * `description` only when `content` is missing or empty (unpublished / old entries).
 */
export function resolveHeroBodies(
  props: Record<string, unknown>,
  locale?: string,
): HeroContent[] {
  // Section entries use `content` for child components — not hero copy
  const rawContent = Array.isArray(props.content) ? undefined : props.content;
  const content = unwrapLocaleField(rawContent, locale);
  const description = unwrapLocaleField(props.description, locale);

  if (richTextIsRenderable(content)) {
    return [content as Document];
  }

  if (typeof content === "string" && content.trim()) {
    return [content];
  }

  if (typeof description === "string" && description.trim()) {
    return [description];
  }

  if (richTextIsRenderable(description)) {
    return [description as Document];
  }

  return [];
}

/** @deprecated Use resolveHeroBodies — kept for single-body callers */
export function resolveHeroContent(
  props: Record<string, unknown>,
  locale?: string,
): HeroContent | undefined {
  return resolveHeroBodies(props, locale)[0];
}

export function renderHeroBody(content: HeroContent): ReactNode {
  if (isValidElement(content)) return content;
  if (typeof content === "string") {
    const trimmed = content.trim();
    return trimmed ? <p>{trimmed}</p> : null;
  }
  return renderRichTextContent(content);
}
