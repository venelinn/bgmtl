"use client";

import { useRouter } from "next/navigation";

type BackButtonProps = {
  className?: string;
  children: React.ReactNode;
};

/**
 * Tiny client island for a "go back" button. Lets otherwise-static detail
 * views (EventDetail, NewsDetail) stay Server Components — only this button
 * ships/hydrates as client JS instead of the whole page tree.
 */
export function BackButton({ className, children }: BackButtonProps) {
  const router = useRouter();
  return (
    <button type="button" className={className} onClick={() => router.back()}>
      {children}
    </button>
  );
}
