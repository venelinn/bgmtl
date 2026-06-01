"use client";
import { useEffect, useState } from "react";
import { throttle } from "throttle-debounce";
import tokens from "@/tokens/breakpoint.json";

function useBreakpoints(delayTime = 150) {
  const [breakpoint, setBreakpoint] = useState({
    isXs: false,
    isSm: false,
    isMd: false,
    isLg: false,
    isXl: false,
  });

  const handleDetectBreakpoint = throttle(delayTime, () => {
    if (window) {
      setBreakpoint({
        isXs: window.matchMedia(`(max-width: ${tokens.breakpoint["sm-max"].value})`).matches,
        isSm: window.matchMedia(
          `(min-width: ${tokens.breakpoint.sm.value}) and (max-width: ${tokens.breakpoint["md-max"].value})`,
        ).matches,
        isMd: window.matchMedia(
          `(min-width: ${tokens.breakpoint.md.value}) and (max-width: ${tokens.breakpoint["lg-max"].value})`,
        ).matches,
        isLg: window.matchMedia(
          `(min-width: ${tokens.breakpoint.lg.value}) and (max-width: ${tokens.breakpoint["xl-max"].value})`,
        ).matches,
        isXl: window.matchMedia(`(min-width: ${tokens.breakpoint.xl})`).matches,
      });
    }
  });

  useEffect(() => {
    handleDetectBreakpoint();

    window.addEventListener("resize", handleDetectBreakpoint);

    return () => {
      window.removeEventListener("resize", handleDetectBreakpoint);
    };
  }, [delayTime]);

  return breakpoint;
}

export { useBreakpoints };
