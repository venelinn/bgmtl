import type { Meta, StoryObj } from "@storybook/nextjs";
import { DirectoryCard } from "./DirectoryCard";

/** Minimal Contentful rich-text doc (a bulleted list, like the real card data). */
const richList = (lines: string[]) => ({
  nodeType: "document",
  data: {},
  content: [
    {
      nodeType: "unordered-list",
      data: {},
      content: lines.map((value) => ({
        nodeType: "list-item",
        data: {},
        content: [{ nodeType: "paragraph", data: {}, content: [{ nodeType: "text", value, marks: [], data: {} }] }],
      })),
    },
  ],
});

const meta: Meta<typeof DirectoryCard> = {
  title: "Components/Directory/DirectoryCard",
  component: DirectoryCard,
  args: {
    tag: "Cultural Centres",
    title: "Zornica Cultural Centre",
    content: richList(["7448 Kingsley Suite 501, CSL Montreal, QC H4W 1P2", "514-369-0589", "info@zornica.com"]),
    link: { url: "https://www.zornica.com", name: "www.zornica.com", target: "_blank" },
  },
};

export default meta;
type Story = StoryObj<typeof DirectoryCard>;

export const Default: Story = {};

export const NoteOnly: Story = {
  args: {
    tag: "Associations",
    title: "Association des Bulgares du Québec",
    content: undefined,
    note: "Sample placeholder entry — replace with real Contentful data.",
    link: undefined,
  },
};
