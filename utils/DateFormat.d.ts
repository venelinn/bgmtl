import type { ReactNode } from "react";

export const FormattedDate: (props: {
  dateStr: string;
  locale: string;
  includeYear?: boolean;
  fullFormat?: boolean | "card" | "long";
}) => ReactNode;

export const FormattedTime: (props: {
  dateStr: string;
  locale: string;
}) => ReactNode;
