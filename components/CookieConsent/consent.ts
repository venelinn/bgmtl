/** localStorage key holding the visitor's cookie decision. */
export const CONSENT_STORAGE_KEY = "bgmtl-analytics-consent";

/** Window event fired when the visitor accepts or declines in the banner. */
export const CONSENT_EVENT = "bgmtl:consent";

export type Consent = "granted" | "denied";

/** The stored decision, or null when there is none (or storage is blocked). */
export function readConsent(): Consent | null {
	try {
		const value = localStorage.getItem(CONSENT_STORAGE_KEY);
		return value === "granted" || value === "denied" ? value : null;
	} catch {
		return null;
	}
}
