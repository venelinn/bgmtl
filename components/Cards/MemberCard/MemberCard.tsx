import Image from "next/image";
import { useState } from "react";
import { Heading } from "@/components/Headings";
import { Modal } from "@/components/Modal";
import type { CardImage, CardProps } from "@/types/card";
import { getOptimizedImage } from "@/utils/common";
import { renderRichTextContent } from "@/utils/RichText";
import styles from "./MemberCard.module.scss";

export const MemberCard = ({ id, heading, content, role, image, imageRatio }: CardProps) => {
  // Normalize various possible shapes:
  // - image as array: use first
  // - cloudinaryAsset-like wrapper: { image: [ ... ] }
  // - single image object
  type CloudinaryAssetLike = { image: CardImage[]; title?: string };
  const hasImageArray = (obj: unknown): obj is CloudinaryAssetLike => {
    return !!obj && typeof obj === "object" && "image" in obj && Array.isArray((obj as { image: unknown }).image);
  };

  const wrapper: CloudinaryAssetLike | null = hasImageArray(image) ? image : null;
  const imageObj = Array.isArray(image) ? image[0] : wrapper ? wrapper.image[0] : (image as CardProps["image"] | null);

  const optimized = imageObj ? getOptimizedImage(imageObj, 800, "100") : null;
  const url = optimized?.url ?? imageObj?.src ?? "";
  const widthNumber = optimized?.width ?? imageObj?.width ?? 800;
  const heightNumber = optimized?.height ?? imageObj?.height ?? Math.round(widthNumber * 0.6);

  // Ensure altText is a string
  const headingText = typeof heading?.heading === "string" ? heading.heading : "";
  const altText = imageObj?.alt ?? wrapper?.title ?? headingText ?? "";

  const [modalStates, setModalStates] = useState(false);

  const handleOpenModal = () => {
    setModalStates(true);
  };

  const handleCloseModal = () => {
    setModalStates(false);
  };

  return (
    <>
      <div id={id} className={styles.card}>
        {imageObj && (
          <Image
            src={url}
            alt={heading?.heading || altText}
            width={widthNumber}
            height={heightNumber}
            sizes="(max-width: 48rem) 50vw, 300px"
            data-ratio={imageRatio}
          />
        )}
        <div className={styles.card__content}>
          <Heading as={heading?.as} size={heading?.size} className={styles.card__heading}>
            {heading?.heading}
          </Heading>
          {role && <div className={styles.card__role}>{role}</div>}

          <button type="button" onClick={() => handleOpenModal()} className={styles.card__link}>
            <span className="sr-only">{heading?.heading}</span>
          </button>
        </div>
      </div>
      <Modal isOpen={modalStates} onClose={() => handleCloseModal()}>
        <div className={styles.mleader}>
          <Image src={url} alt={altText} width={widthNumber} height={heightNumber} data-ratio={imageRatio} />
          <div>
            <Heading size="h1" as="div" className={styles.mleader__name}>
              {heading?.heading}
            </Heading>
            {role && (
              <div className="ui-small uppercase">
                <strong>{role}</strong>
              </div>
            )}
            <div className={styles.mleader__text}>{content && renderRichTextContent(content)}</div>
          </div>
        </div>
      </Modal>
    </>
  );
};
