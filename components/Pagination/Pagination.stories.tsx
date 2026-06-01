import type { Meta, StoryObj } from "@storybook/nextjs";
import { useEffect, useState } from "react";
import { type PaginationProps, Pagination as PaginationWrapper, paginationVariants } from "./Pagination";

const meta = {
  title: "WestJet Vacations Inc/Pagination",
  component: PaginationWrapper,
  tags: ["autodocs"],
  argTypes: {
    handleSlideTo: { action: "page changed" },
    variant: {
      control: "select",
      options: Object.values(paginationVariants),
    },
    theme: {
      control: false,
    },
  },
} satisfies Meta<typeof Pagination>;

export default meta;

type Story = StoryObj<typeof meta>;

const Pagination = ({
  totalItems,
  currentPageIndex,
  variant,
  theme,
  visibleRange = { start: 1, end: 4 },
  pageSize,
}: PaginationProps) => {
  const [currentPage, setCurrentPage] = useState(currentPageIndex);

  useEffect(() => {
    setCurrentPage(currentPageIndex);
  }, [currentPageIndex]);

  return (
    <div>
      <PaginationWrapper
        totalItems={totalItems}
        currentPageIndex={currentPage}
        handleSlideTo={(page) => setCurrentPage(page)}
        variant={variant}
        visibleRange={visibleRange}
        theme={theme}
        pageSize={pageSize}
      />
    </div>
  );
};

export const Default: Story = {
  args: {
    totalItems: 6,
    currentPageIndex: 1,
    handleSlideTo: () => {},
    variant: "default",
    pageSize: 3,
  },
  render: (args) => {
    return (
      <Pagination
        variant={args.variant}
        totalItems={args.totalItems}
        currentPageIndex={args.currentPageIndex}
        handleSlideTo={args.handleSlideTo}
        pageSize={args.pageSize}
        theme="light"
      />
    );
  },
};

export const ExtendedControls: Story = {
  args: {
    totalItems: 6,
    currentPageIndex: 1,
    handleSlideTo: () => {},
    variant: "extended",
    visibleRange: { start: 1, end: 4 },
    pageSize: 2,
  },
  render: (args) => (
    <Pagination
      variant={args.variant}
      totalItems={args.totalItems}
      currentPageIndex={args.currentPageIndex}
      handleSlideTo={args.handleSlideTo}
      visibleRange={args.visibleRange}
      pageSize={args.pageSize}
    />
  ),
};

export const NoControls: Story = {
  args: {
    totalItems: 30,
    currentPageIndex: 1,
    handleSlideTo: () => {},
    variant: paginationVariants.noControls,
    visibleRange: { start: 1, end: 6 },
  },
  render: (args) => (
    <Pagination
      variant={args.variant}
      totalItems={args.totalItems}
      currentPageIndex={args.currentPageIndex}
      handleSlideTo={args.handleSlideTo}
      visibleRange={args.visibleRange}
      pageSize={args.pageSize}
    />
  ),
};
