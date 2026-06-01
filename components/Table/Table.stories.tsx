import type { Meta, StoryObj } from "@storybook/nextjs";
import type { TableProps } from "./Table";
import { TableView } from "./Table";

const meta: Meta<typeof TableView> = {
  title: "Components/Table",
  component: TableView,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Mock data: text-only table
const mockTextTable: TableProps = {
  headers: ["Feature", "Basic", "Pro", "Enterprise"],
  rows: [
    {
      id: "row-1",
      cells: ["Storage", "10 GB", "100 GB", "Unlimited"],
    },
    {
      id: "row-2",
      cells: ["Users", "1", "5", "Unlimited"],
    },
    {
      id: "row-3",
      cells: ["Support", "Email", "Phone", "Dedicated"],
    },
  ],
};

// Mock data: table with download links (mimics Contentful attachment structure)
const mockDownloadTable: TableProps = {
  headers: ["Отчет", "Свали"],
  rows: [
    {
      id: "row-dl-1",
      link: {
        name: "Свали",
        iconName: "Download",
        attachment: {
          file: {
            url: "//assets.ctfassets.net/example/FIN_ORBF_2018.pdf",
          },
        },
      },
      title: "Statement of Operations 2018",
    },
    {
      id: "row-dl-2",
      link: {
        name: "Свали",
        iconName: "Download",
        attachment: {
          file: {
            url: "//assets.ctfassets.net/example/FIN_ORBF_2019.pdf",
          },
        },
      },
      title: "Statement of Operations 2019",
    },
  ],
};

// Story: Basic text table
export const TextTable: Story = {
  args: {
    ...mockTextTable,
  },
};

// Story: Download table (Contentful attachments)
export const DownloadTable: Story = {
  args: {
    ...mockDownloadTable,
  },
};
