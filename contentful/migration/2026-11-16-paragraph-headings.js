/**
 * Allow H2/H3 headings inside Paragraph rich text, so long-form pages (e.g. the
 * privacy policy) can be one paragraph entry with sub-headings instead of many
 * paragraph + heading entries. Other validations are kept as they were.
 *
 * Run with the direct-binary snippet in docs/community-directory.md.
 */
module.exports = (migration) => {
  const paragraph = migration.editContentType("paragraph");

  paragraph.editField("content").validations([
    { enabledMarks: ["bold"], message: "Only bold marks are allowed" },
    {
      enabledNodeTypes: [
        "heading-2",
        "heading-3",
        "unordered-list",
        "blockquote",
        "ordered-list",
        "hyperlink",
        "entry-hyperlink",
        "embedded-entry-block",
        "embedded-entry-inline",
        "asset-hyperlink",
      ],
      message:
        "Only headings (H2, H3), unordered list, quote, ordered list, link to Url, link to entry, block entry, inline entry, and link to asset nodes are allowed",
    },
    { nodes: {} },
  ]);
};
