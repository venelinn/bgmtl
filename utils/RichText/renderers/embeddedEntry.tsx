import Link from "next/link"
import {
	Heading,
	type HeadingTag,
	type HeadingSizeValue,
} from "@/components/Headings"
import { CollectionConnector } from "@/components/Collection"
import { ContentfulLink } from "@/components/ContentfulLink"
import { contentfulEntryToLink, getLinkFieldsUrl } from "@/utils/linkHelpers"
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

	if (contentType === "link") {
		const linkUrl = getLinkFieldsUrl(fields)
		if (linkUrl) {
			const linkText = (fields?.name ??
				fields?.title ??
				fields?.Name ??
				"Link") as string
			return (
				<ContentfulLink
					href={linkUrl}
					fields={fields}
					label={linkText}
					isExternal={linkUrl.startsWith("http")}
				/>
			)
		}
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
