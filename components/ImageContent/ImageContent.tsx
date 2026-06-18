"use client";
import cx from "clsx";
import gsap from "gsap";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { Heading, type HeadingProps } from "@/components/Headings";
import { Section } from "@/components/Section";
import type { CloudinaryImage } from "@/types/image";
import { getOptimizedImage } from "@/utils/common";
import { renderRichTextContent } from "@/utils/RichText";
import styles from "./ImageContent.module.scss";

type RichTextContent = Record<string, unknown> | string;

export type ImageContentProps = {
  id?: string;
  heading: HeadingProps;
  animationID: string;
  image: CloudinaryImage;
  content: RichTextContent;
  fullHeight?: boolean;
  isContentFirst?: boolean;
  variant?: string;
};

export const ImageContent = ({ heading, variant, image, content, fullHeight, isContentFirst }: ImageContentProps) => {
  // image
  const imageAspectRatio = image?.width && image?.height ? image.width / image.height : 1;
  const imageWidth = fullHeight ? 1600 : 800;
  const optimized = getOptimizedImage(image, imageWidth, "100");
  const { src, width, height } = optimized || {
    src: image?.src,
    width: image?.width || imageWidth,
    height: image?.height || imageWidth,
  };

  const containerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (containerRef.current) {
      const elements = Array.from(containerRef.current.querySelectorAll("[data-anim]"));
      gsap.fromTo(
        elements,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.2,
          duration: 0.7,
          delay: 1,
          ease: "power4.out",
        },
      );
    }
  }, []);

  const order = isContentFirst ? "content" : "image";
  return (
    <div
      className={cx(styles.module, fullHeight && styles["module--full-height"])}
      data-order={order}
      data-variant={variant}
      ref={containerRef}
    >
      <div
        className={styles.module__image}
        data-orientation={imageAspectRatio > 1 ? "horizontal" : "vertical"}
        data-anim="cover-image"
      >
        <Image
          src={src}
          alt={image?.alt || ""}
          width={width}
          height={height}
          sizes={fullHeight ? "100vw" : "(max-width: 48rem) 100vw, 50vw"}
        />
      </div>
      <div data-anim="content-image" className={styles.module__content}>
        {heading && (
          <Heading as={heading?.as} size={heading?.size} className={styles.module__heading}>
            {heading?.heading}
          </Heading>
        )}
        {renderRichTextContent(content)}
      </div>
    </div>
  );
};
