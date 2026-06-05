import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import type { Document } from "@contentful/rich-text-types";
import { getRichTextOptions } from "./options";

export { renderEmbeddedEntryBlock } from "./renderers/embeddedEntry";
export { renderEmbeddedAssetBlock } from "./renderers/embeddedAsset";
export { getCloudinaryImageURL } from "./utils";

/** Contentful Rich Text document root */
export function isRichTextDocument(value: unknown): value is Document {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { nodeType?: string }).nodeType === "document" &&
    Array.isArray((value as { content?: unknown }).content)
  );
}

/**
 * Renders Contentful Rich Text content to React components.
 * Supports: headings, links, pages, images, collections (embedded), and hyperlinks.
 */
export function renderRichTextContent(content: unknown) {
  if (!content) {
    return null;
  }

  if (typeof content === "string") {
    const trimmed = content.trim();
    return trimmed ? <p>{trimmed}</p> : null;
  }

  const options = getRichTextOptions();
  return documentToReactComponents(content as Document, options);
}
