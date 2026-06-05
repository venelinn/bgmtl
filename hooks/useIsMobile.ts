// hooks/useIsMobile.ts
import { useEffect, useState } from "react";
import { BreakpointSm } from "@/styles/variables";

const useIsMobile = (breakpoint: number = BreakpointSm): boolean => {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < breakpoint);
    const handleResize = () => requestAnimationFrame(update);

    if (typeof window !== 'undefined') {
      update(); // Initial check
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, [breakpoint]);

  return isMobile;
};

export default useIsMobile;
