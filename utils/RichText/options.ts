import type { Block, Inline } from "@contentful/rich-text-types";
import { BLOCKS, INLINES } from "@contentful/rich-text-types";
import type { ReactNode } from "react";
import { renderEmbeddedEntryBlock } from "./renderers/embeddedEntry";
import { renderEmbeddedAssetBlock } from "./renderers/embeddedAsset";
import {
  renderInlineEntryLink,
  renderHyperlink,
  renderEntryHyperlink,
  renderAssetHyperlink,
} from "./renderers/inlines";

export function getRichTextOptions() {
  return {
    renderNode: {
      [BLOCKS.EMBEDDED_ENTRY]: (node: Block | Inline) =>
        renderEmbeddedEntryBlock(node as unknown as Parameters<typeof renderEmbeddedEntryBlock>[0]),
      [BLOCKS.EMBEDDED_ASSET]: (node: Block | Inline) =>
        renderEmbeddedAssetBlock(node as unknown as Parameters<typeof renderEmbeddedAssetBlock>[0]),
      [INLINES.EMBEDDED_ENTRY]: (node: Block | Inline, children: ReactNode) =>
        renderInlineEntryLink(node as unknown as Parameters<typeof renderInlineEntryLink>[0], children),
      [INLINES.HYPERLINK]: (node: Block | Inline, children: ReactNode) =>
        renderHyperlink(node as unknown as Parameters<typeof renderHyperlink>[0], children),
      [INLINES.ENTRY_HYPERLINK]: (node: Block | Inline, children: ReactNode) =>
        renderEntryHyperlink(node as unknown as Parameters<typeof renderEntryHyperlink>[0], children),
      [INLINES.ASSET_HYPERLINK]: (node: Block | Inline, children: ReactNode) =>
        renderAssetHyperlink(node as unknown as Parameters<typeof renderAssetHyperlink>[0], children),
    },
  };
}
