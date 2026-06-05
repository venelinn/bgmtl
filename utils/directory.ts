// Flattens a Contentful rich-text document to plain text for the directory
// search haystack. Walks into lists so list-items don't get concatenated into
// one run-on string (cards store contact info as bulleted lists + mailto links).

const TEXT_BLOCKS = new Set([
  "paragraph",
  "heading-1",
  "heading-2",
  "heading-3",
  "heading-4",
  "heading-5",
  "heading-6",
]);

function nodeText(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const n = node as { nodeType?: string; value?: string; content?: unknown[] };
  if (n.nodeType === "text" && typeof n.value === "string") return n.value;
  if (Array.isArray(n.content)) return n.content.map(nodeText).join("");
  return "";
}

/** One trimmed line per block-level node (paragraph/heading/list-item body). */
export function richTextToLines(doc: unknown): string[] {
  const lines: string[] = [];
  const walk = (node: unknown) => {
    if (!node || typeof node !== "object") return;
    const n = node as { nodeType?: string; content?: unknown[] };
    if (n.nodeType && TEXT_BLOCKS.has(n.nodeType)) {
      for (const raw of nodeText(n).split(/\r?\n/)) {
        const line = raw.trim();
        if (line) lines.push(line);
      }
      return; // text captured; don't descend further
    }
    if (Array.isArray(n.content)) for (const child of n.content) walk(child);
  };
  walk(doc);
  return lines;
}

/** Plain-text join of a rich-text document — used to build the search haystack. */
export function richTextToPlain(doc: unknown): string {
  return richTextToLines(doc).join(" ");
}
