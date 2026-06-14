// Types for the shared CommonJS renderer (newsletter-render.js), so the Next app
// (utils/newsletter.ts) gets proper types instead of inferred `never[]`.

export interface NewsletterItem {
	type: "event" | "news";
	title: string;
	when?: string;
	venue?: string;
	excerpt?: string;
	image?: string;
	url: string;
}

export interface NewsletterSection {
	label: string;
	items: NewsletterItem[];
}

export interface RenderOptions {
	siteName?: string;
	baseUrl?: string;
	intro?: string;
	preheader?: string;
	sections: NewsletterSection[];
	ctaUrl?: string;
	ctaLabel?: string;
}

export function renderNewsletter(opts: RenderOptions): string;
export function formatDateBg(value: string | undefined): string;
export function parseNaive(value: string | undefined): { date: Date; hasTime: boolean } | null;
export function richTextToPlain(doc: unknown): string;
export function truncate(text: string | undefined, max?: number): string;
export function thumbUrl(url: string | undefined, w?: number, h?: number): string;
export function escapeHtml(text: unknown): string;

export const NAVY: string;
export const ACCENT: string;
export const GREEN: string;
export const LOGO_URL: string;
