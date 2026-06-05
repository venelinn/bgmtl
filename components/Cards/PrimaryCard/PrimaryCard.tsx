import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/Button";
import { Heading, type HeadingProps } from "@/components/Headings";
import { Slider } from "@/components/Slider/Slider";
import type { CloudinaryImage } from "@/types/image";
import { getOptimizedImage } from "@/utils/common";
import { renderRichTextContent } from "@/utils/RichText";
import styles from "./PrimaryCard.module.scss";

export const PrimaryCardVariants = {
  default: "default",
  evenSplit: "evenSplit",
  logoOffset: "logoOffset",
} as const;

// Still the same basic building block for a detail item
export type PrimaryDetailItem = {
  icon?: string;
  label: string;
};

// The new, more descriptive structure
export type PrimaryDetailsProps = {
  primary?: PrimaryDetailItem[]; // The main detail for the card face
  more: string[]; // The complete list for the modal
};

type PrimaryCardLink = {
  url?: string;
  name?: string;
  target?: string;
};

export type PrimaryCardProps = {
  id?: string;
  variant?: keyof typeof PrimaryCardVariants;
  image?: CloudinaryImage[];
  heading?: HeadingProps;
  link?: PrimaryCardLink;
  content?: React.ReactNode;
  contentLimit?: boolean;
  className?: string;
};

export const PrimaryCard = ({
  id,
  image,
  heading,
  link,
  content,
  className,
  contentLimit,
  variant,
}: PrimaryCardProps) => {
  const hasMultipleImages = image && image.length > 1;

  return (
    <div className={clsx(styles.primary, className, variant && styles[variant])} data-primary-id={id}>
      {image && image.length > 0 && (
        <div className={styles.primaryImage}>
          {hasMultipleImages ? (
            <Slider
              variant="primary"
              itemsPerRow={1}
              instanceId={id || `primary-card-${Math.random().toString(36).substr(2, 9)}`}
              items={image.map((img, idx) => {
                const optimized = getOptimizedImage(img, 500, "100");
                return {
                  id: `${id}-img-${idx}`,
                  content: (
                    <Image
                      src={optimized?.src ?? ""}
                      alt={img?.alt ?? ""}
                      width={optimized?.width ?? 500}
                      height={optimized?.height ?? 400}
                    />
                  ),
                };
              })}
            />
          ) : (
            <Image
              src={getOptimizedImage(image[0], 500, "100")?.src ?? ""}
              alt={image[0]?.alt ?? ""}
              width={getOptimizedImage(image[0], 500, "100")?.width ?? 500}
              height={getOptimizedImage(image[0], 500, "100")?.height ?? 400}
              priority={true}
            />
          )}
        </div>
      )}

      <div className={styles.primaryBody}>
        <div className={styles.primaryHeader}>
          {heading && (
            <Heading size="h3" as={heading.as} highlight className={styles.primaryHeading}>
              {heading?.heading}
            </Heading>
          )}
        </div>
        {!!content && (
          <div className={clsx(styles.primaryContent, contentLimit && styles.contentLimit)}>
            {typeof content === "string" ? content : renderRichTextContent(content as object)}
          </div>
        )}
        {!!link && link.url && (
          <div className={styles.primaryFooter}>
            <Button
              className={styles.cardLink}
              href={link.url}
              variant="primary"
              outlined
              size="sm"
              iconAfter="arrow-right"
              label={link.name || "View details"}
            />
          </div>
        )}
      </div>
    </div>
  );
};
