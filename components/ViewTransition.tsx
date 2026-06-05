import * as React from "react";
import { VIEW_TRANSITIONS_ENABLED } from "@/utils/common";

/**
 * Typed, runtime-safe wrapper around React's `<ViewTransition>`.
 *
 * React's ViewTransition component ships in the build Next.js uses when
 * `experimental.viewTransition` is enabled (see next.config.js), and route
 * navigations become Transitions that activate it automatically. The stable
 * `@types/react` don't declare it yet, hence the cast. If the runtime build
 * doesn't expose it (flag off / unsupported), we fall back to a passthrough so
 * children still render — just without the animation.
 *
 * Docs: https://nextjs.org/docs/app/guides/view-transitions
 */
export interface ViewTransitionProps {
	/** Shared identity. Same `name` on two pages → the element morphs between them. */
	name?: string;
	/** Animation when the element persists across a transition (matched name). */
	share?: "auto" | "morph" | "none" | Record<string, string>;
	enter?: string | Record<string, string>;
	exit?: string | Record<string, string>;
	update?: string | Record<string, string>;
	/** Behavior during unrelated transitions. "none" keeps it inert unless matched. */
	default?: string;
	children?: React.ReactNode;
}

const RuntimeViewTransition = (
	React as unknown as {
		ViewTransition?: React.ComponentType<ViewTransitionProps>;
	}
).ViewTransition;

const Passthrough = ({ children }: ViewTransitionProps) => <>{children}</>;

// Disabled via NEXT_PUBLIC_VIEW_TRANSITIONS=false → render children as-is, so no
// `view-transition-name`/`share` is ever applied (no morph), independent of
// whether Next's navigation integration happens to be active.
export const ViewTransition: React.ComponentType<ViewTransitionProps> =
	VIEW_TRANSITIONS_ENABLED && RuntimeViewTransition
		? RuntimeViewTransition
		: Passthrough;
