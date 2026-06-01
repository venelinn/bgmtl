import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import type { Document } from "@contentful/rich-text-types";
import { getRichTextOptions } from "./options";

export { renderEmbeddedEntryBlock } from "./renderers/embeddedEntry";
export { renderEmbeddedAssetBlock } from "./renderers/embeddedAsset";
export { getCloudinaryImageURL } from "./utils";

/**
 * Renders Contentful Rich Text content to React components.
 * Supports: headings, links, pages, images, collections (embedded), and hyperlinks.
 */
export function renderRichTextContent(content: unknown) {
  if (!content) {
    console.warn("⚠️ RichText: No content provided");
    return null;
  }

  if (typeof content === "string") {
    console.warn("⚠️ RichText: Received string content instead of Document");
    return <p>{content}</p>;
  }

  const options = getRichTextOptions();
  return documentToReactComponents(content as Document, options);
}
