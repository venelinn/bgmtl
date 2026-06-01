import type { ImageSource } from "@/types/image";
import { getOptimizedImage } from "@/utils/common";
import { Section, type SectionProps } from "./Section";

// Flexible image input from CMS
type SectionConnectorImage = ImageSource | ImageSource[] | { image?: ImageSource[] } | null | undefined;

type MappedChild = {
  id?: string;
  type?: string;
  [key: string]: unknown;
};

export type SectionConnectorProps = Omit<SectionProps, "image" | "description"> & {
  image?: SectionConnectorImage;
  description?: unknown;
  components?: MappedChild[];
  items?: MappedChild[];
  content?: MappedChild[];
  useWrapper?: boolean;
  heading?: SectionProps["heading"];
  // Optional nested object for Section-specific styling props
  sectionProps?: Partial<SectionProps>;
};

function normalizeImage(input: SectionConnectorImage): SectionProps["image"] {
  if (!input) return undefined;

  let img: ImageSource | undefined;

  if (Array.isArray(input)) {
    img = input[0];
  } else if (typeof input === "object" && "image" in input) {
    const arr = input.image;
    img = Array.isArray(arr) ? arr[0] : undefined;
  } else {
    img = input as ImageSource;
  }

  if (!img) return undefined;
  const { url } = getOptimizedImage(img, 1600, "auto");
  const src = url || ("src" in img ? (img.src as string) : (img.url as string));
  const alt = ("alt" in img ? img.alt : undefined) || "";

  return { src, alt };
}

export const SectionConnector = ({
  image,
  description,
  components,
  items,
  content,
  children,
  heading,
  useWrapper = true,
  sectionProps = {},
  ...rest
}: SectionConnectorProps) => {
  const normalizedImage = normalizeImage(image);

  const childEntries: MappedChild[] =
    (Array.isArray(components) && components) ||
    (Array.isArray(items) && items) ||
    (Array.isArray(content) && content) ||
    [];

  const renderedChildren = childEntries.map((_entry) => null).filter(Boolean);

  const inner = <>{children || renderedChildren}</>;

  if (!useWrapper) return inner;

  return (
    <Section
      {...rest}
      {...sectionProps}
      image={normalizedImage}
      heading={heading}
      // Pass rich text document or plain string; Section renders internally
      description={description as unknown as string}
    >
      {inner}
    </Section>
  );
};
