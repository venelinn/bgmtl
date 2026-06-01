import Link from "next/link"
import {
	Heading,
	type HeadingTag,
	type HeadingSizeValue,
} from "@/components/Headings"
import { CollectionConnector } from "@/components/Collection"
import { contentfulEntryToLink } from "@/utils/linkHelpers"
import { contentfulCollectionToConnectorProps } from "./collectionTransformer"

type EmbeddedEntryNode = {
	data: {
		target: {
			sys?: { contentType?: { sys?: { id?: string } } }
			fields?: Record<string, unknown>
		}
	}
}

export function renderEmbeddedEntryBlock(node: EmbeddedEntryNode) {
	const target = node.data?.target
	const fields = target?.fields ?? {}
	const contentType = target?.sys?.contentType?.sys?.id

	// Handle Heading entries
	if (contentType === "heading") {
		const seoHeading = fields?.isHidden
		const rawAs = (fields?.as as string) ?? "h3"
		const rawSize = (fields?.size as string) ?? "h3"
		const as = (rawAs === "h6" ? "h5" : rawAs) as HeadingTag
		const size = (rawSize === "h6" ? "h5" : rawSize) as HeadingSizeValue
		return (
			<Heading
				as={as}
				size={size}
				uppercase={fields?.uppercase as boolean}
				center={fields?.alignment as boolean}
				animationID={fields?.animationID as string}
				isHidden={fields?.isHidden as boolean}
			>
				{seoHeading ? (
					<span className="sr-only">{fields?.heading as string}</span>
				) : (
					(fields?.heading as string)
				)}
			</Heading>
		)
	}

	// Handle Collection entries - render via CollectionConnector
	if (contentType === "collection") {
		const props = contentfulCollectionToConnectorProps(target)
		if (props) return <CollectionConnector {...props} />
	}

	// Handle Link/Button entries with URLs
	let linkUrl =
		(fields?.url as string) ||
		(fields?.URL as string) ||
		(
			fields?.attachment as {
				fields?: { url?: string; file?: { url?: string } }
			}
		)?.fields?.url ||
		(fields?.attachment as { fields?: { file?: { url?: string } } })?.fields
			?.file?.url

	if (linkUrl?.startsWith("//")) linkUrl = `https:${linkUrl}`

	if (contentType === "link" && linkUrl) {
		const linkText = (fields?.name ??
			fields?.title ??
			fields?.Name ??
			"Link") as string
		const isExternalLink = linkUrl.startsWith("http")
		const variant = (fields?.variant as string) ?? ""

		return (
			<a
				href={linkUrl}
				data-variant={variant}
				data-text={linkText}
				className={`${isExternalLink ? "external-link" : ""} ${variant === "button" ? "link--button" : "link"}`}
				target={
					(fields?.external ||
						fields?.target ||
						(isExternalLink ? "_blank" : "_self")) as string
				}
				rel={isExternalLink ? "noopener noreferrer" : ""}
			>
				<span className="link__text">{linkText}</span>
			</a>
		)
	}

	// Handle Page entries - render as internal links
	if (contentType === "page") {
		const link = contentfulEntryToLink(target)
		if (link && link.url !== "#") {
			const headingRef = (fields?.pageName ?? fields?.heading) as {
				heading?: string
				fields?: { heading?: string }
			}
			const title =
				headingRef?.heading ?? headingRef?.fields?.heading ?? link.title ?? ""
			return (
				<Link href={link.url} className="link" data-text={title}>
					<span className="link__text">{title}</span>
				</Link>
			)
		}
	}

	return null
}
