import Image from "next/image";
import { getCloudinaryImageURL } from "../utils";

export function renderEmbeddedAssetBlock(node: { data: { target: { fields: Record<string, unknown> } } }) {
  const asset = node.data.target.fields as {
    image?: Array<{ url: string; width: number; height: number }>;
    alt?: string;
  };

  if (!asset?.image?.[0]) return null;

  return (
    <Image
      src={getCloudinaryImageURL(asset.image[0].url)}
      alt={(asset.alt as string) ?? ""}
      width={asset.image[0].width}
      height={asset.image[0].height}
    />
  );
}
