import React from "react";

declare module "react" {
	interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
		// Add the popover API attributes
		popover?: "" | "manual";
		popovertarget?: string;
		// If you use popovertargetaction, you might add it here too:
		// popovertargetaction?: "hide" | "show" | "toggle";
	}
}
