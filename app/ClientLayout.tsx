"use client"; // This is the most important line!

import gsap from "gsap";
import ScrollTrigger from "gsap/dist/ScrollTrigger";
import { usePathname } from "next/navigation"; // <- App Router hook
import { type AbstractIntlMessages, NextIntlClientProvider } from "next-intl";
import { useEffect } from "react";
import useNextCssRemovalPrevention from "@/hooks/useNextCssRemovalPrevention";
import { NavigationContextProvider } from "../context/navigationContext";
import { TransitionContextProvider } from "../context/transitionContext";

// Register GSAP plugin
gsap.registerPlugin(ScrollTrigger);

export function ClientLayout({
  children,
  lang,
  messages,
}: {
  children: React.ReactNode;
  lang: string;
  // Only the active locale's messages — passed from the server layout so the
  // client bundle no longer statically imports BOTH en.json and bg.json.
  messages: AbstractIntlMessages;
}) {
  const pathname = usePathname(); // New App Router hook

  /* Removes focus from next/link element after page change */
  useEffect(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }, [pathname]); // Use pathname, not router

  /* Update HTML lang attribute */
  useEffect(() => {
    if (lang) {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  /* Temporary fix to avoid flash of unstyled content (FOUC) */
  useNextCssRemovalPrevention();

  // All your context providers wrap the children
  return (
    <TransitionContextProvider>
      <NextIntlClientProvider locale={lang} messages={messages} timeZone="America/Toronto">
        <NavigationContextProvider>{children}</NavigationContextProvider>
      </NextIntlClientProvider>
    </TransitionContextProvider>
  );
}
