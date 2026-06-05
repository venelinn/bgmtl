import Image from "next/image";

type ContentfulFileDetails = {
	image: {
		width: number;
		height: number;
	};
};

type ContentfulFile = {
	url: string;
	details: ContentfulFileDetails;
};

type ContentfulImageType = {
	title?: string;
	file: ContentfulFile;
};

type ContentfulImageProps = {
	image: ContentfulImageType;
	className?: string;
};

const ContentfulImage = ({ image, className }: ContentfulImageProps) => {
	const imageUrl = image?.file?.url?.startsWith("//")
		? `https:${image.file.url}`
		: image.file.url;

	const width = image?.file?.details?.image?.width || 800;
	const height = image?.file?.details?.image?.height || 600;

	return (
		<Image
			src={imageUrl}
			alt={image?.title || ""}
			width={width}
			height={height}
			className={className}
		/>
	);
};

export default ContentfulImage;
