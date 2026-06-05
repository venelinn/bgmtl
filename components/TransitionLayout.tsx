import gsap from "gsap";
import ScrollTrigger from "gsap/dist/ScrollTrigger";
import { useRouter } from "next/router";
import type React from "react";
import { useEffect, useState } from "react";
import useTransitionContext from "../context/transitionContext";
import useIsomorphicLayoutEffect from "../hooks/useIsomorphicLayoutEffect";

const ScrollTriggerAny: any = ScrollTrigger;

type CurrentPage = {
  route: string;
  children?: React.ReactNode;
};

export default function TransitionLayout({ children }: { children?: React.ReactNode }) {
  useEffect(() => {
    // prevents flashing
    gsap.to("body", {
      duration: 1,
      css: { visibility: "visible" },
    });
  }, []);

  const router = useRouter();
  const [currentPage, setCurrentPage] = useState<CurrentPage>({
    route: router.asPath,
    children,
  });
  // transition context provides a timeline and a reset function
  const { timeline, resetTimeline } = useTransitionContext() as {
    timeline: any;
    resetTimeline: () => void;
  };

  useIsomorphicLayoutEffect(() => {
    if (currentPage.route !== router.asPath) {
      if (timeline?.duration?.() === 0) {
        /* There are no outro animations, so immediately transition */
        setCurrentPage({
          route: router.asPath,
          children,
        });
        // refresh ScrollTrigger
        ScrollTriggerAny?.refresh?.(true);
        return;
      }

      timeline.play().then(() => {
        /* outro complete so reset to an empty paused timeline */
        resetTimeline();
        setCurrentPage({
          route: router.asPath,
          children,
        });
        ScrollTriggerAny?.refresh?.(true);
      });
    } else {
      ScrollTriggerAny?.refresh?.(true);
    }
  }, [router.asPath]);

  return <div className="u-overflow--hidden">{currentPage.children}</div>;
}
