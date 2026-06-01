import Link from "next/link"
import type { ReactNode } from "react"
import type { Block, Inline } from "@contentful/rich-text-types"
import { contentfulEntryToLink } from "@/utils/linkHelpers"

type InlineNode = { data: Record<string, unknown> }

function getLinkUrl(fields: Record<string, unknown>): string | undefined {
	let url =
		(fields?.url as string) ||
		(fields?.URL as string) ||
		(
			fields?.attachment as {
				fields?: { url?: string; file?: { url?: string } }
			}
		)?.fields?.url ||
		(fields?.attachment as { fields?: { file?: { url?: string } } })?.fields
			?.file?.url
	if (url?.startsWith("//")) url = `https:${url}`
	return url
}

export function renderInlineEntryLink(node: InlineNode, children: ReactNode) {
	const entry = node.data?.target as {
		sys?: { contentType?: { sys?: { id?: string } } }
		fields?: Record<string, unknown>
	}
	const fields = entry?.fields ?? {}
	const contentType = entry?.sys?.contentType?.sys?.id

	if (contentType === "link") {
		const linkUrl = getLinkUrl(fields)
		if (linkUrl) {
			const hasChildren = Array.isArray(children)
				? children.length > 0
				: !!children
			const linkText = hasChildren
				? children
				: ((fields?.name ?? fields?.title ?? fields?.Name ?? "Link") as string)
			const isExternalLink = linkUrl.startsWith("http")
			const variant = (fields?.variant as string) ?? ""

			return (
				<a
					href={linkUrl}
					data-variant={variant}
					data-text={linkText}
					className={`${isExternalLink ? "external-link" : ""} ${variant === "button" ? "link--button" : "link"}`}
					target={
						(fields?.target ??
							fields?.external ??
							(isExternalLink ? "_blank" : "_self")) as string
					}
					rel={isExternalLink ? "noopener noreferrer" : ""}
				>
					<span className="link__text">{linkText}</span>
				</a>
			)
		}
	}

	if (contentType === "page") {
		const link = contentfulEntryToLink(entry)
		if (link && link.url !== "#") {
			const hasChildren = Array.isArray(children)
				? children.length > 0
				: !!children
			const headingRef = (fields?.pageName ?? fields?.heading) as {
				heading?: string
				fields?: { heading?: string }
			}
			const titleFromHeading =
				headingRef?.heading ?? headingRef?.fields?.heading ?? link.title ?? ""
			const linkText = hasChildren ? children : titleFromHeading
			return (
				<Link href={link.url} className="link link--active">
					<span className="link__text">{linkText}</span>
				</Link>
			)
		}
	}

	return <span>{children}</span>
}

export function renderInlineAssetLink(node: InlineNode, children: ReactNode) {
	const target = node.data?.target as
		| { fields?: { image?: Array<{ url?: string }>; file?: { url?: string } } }
		| undefined
	const asset = target?.fields
	const url = asset?.image?.[0]?.url ?? asset?.file?.url

	return (
		<a
			href={url}
			target="_blank"
			rel="noopener noreferrer"
			className="link link--active"
		>
			<span className="link__text">{children}</span>
		</a>
	)
}

export function renderHyperlink(node: InlineNode, children: ReactNode) {
	const url = node.data?.uri as string
	const isExternalLink = url?.startsWith("http")

	return (
		<a
			href={url}
			className={`link link--active ${isExternalLink ? "external-link" : ""}`}
			target={isExternalLink ? "_blank" : "_self"}
			rel={isExternalLink ? "noopener noreferrer" : ""}
		>
			<span className="link__text">{children}</span>
		</a>
	)
}

export function renderEntryHyperlink(node: InlineNode, children: ReactNode) {
	const entry = node.data?.target as {
		sys?: { contentType?: { sys?: { id?: string } } }
		fields?: Record<string, unknown>
	}
	const fields = entry?.fields ?? {}
	const contentType = entry?.sys?.contentType?.sys?.id

	if (contentType === "link") {
		const linkUrl = getLinkUrl(fields)
		if (linkUrl) {
			const hasChildren = Array.isArray(children)
				? children.length > 0
				: !!children
			const linkText = hasChildren
				? children
				: ((fields?.name ?? fields?.title ?? fields?.Name ?? "Link") as string)
			const isExternalLink = linkUrl.startsWith("http")
			const variant = (fields?.variant as string) ?? ""

			return (
				<a
					href={linkUrl}
					className={`link link--active ${isExternalLink ? "external-link" : ""} ${variant ? `link--${variant}` : ""}`}
					target={
						(fields?.target ??
							fields?.external ??
							(isExternalLink ? "_blank" : "_self")) as string
					}
					rel={isExternalLink ? "noopener noreferrer" : ""}
				>
					<span className="link__text">{linkText}</span>
				</a>
			)
		}
	}

	if (contentType === "page") {
		const link = contentfulEntryToLink(entry)
		if (link && link.url !== "#") {
			const hasChildren = Array.isArray(children)
				? children.length > 0
				: !!children
			const headingRef = (fields?.pageName ?? fields?.heading) as {
				heading?: string
				fields?: { heading?: string }
			}
			const titleFromHeading =
				headingRef?.heading ?? headingRef?.fields?.heading ?? link.title ?? ""
			const linkText = hasChildren ? children : titleFromHeading
			return (
				<Link href={link.url} className="link link--active">
					<span className="link__text">{linkText}</span>
				</Link>
			)
		}
	}

	return (
		<span
			className="entry-link"
			title={(fields?.heading ?? "Link to entry") as string}
		>
			{children}
		</span>
	)
}

export function renderAssetHyperlink(node: InlineNode, children: ReactNode) {
	const target = node.data?.target as
		| { fields?: { image?: Array<{ url?: string }>; file?: { url?: string } } }
		| undefined
	const asset = target?.fields
	const assetUrl = asset?.image?.[0]?.url ?? asset?.file?.url

	return (
		<a
			href={assetUrl}
			target="_blank"
			rel="noopener noreferrer"
			className="link link--active"
			download
		>
			<span className="link__text">{children}</span>
		</a>
	)
}
