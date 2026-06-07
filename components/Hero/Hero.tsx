"use client";
import clsx from "clsx";
import Image from "next/image";
import { Fragment, useEffect, useState } from "react";
import { type HeroContent, renderHeroBody } from "./heroContent";
import { Section, type SectionProps } from "@/components/Section";
import { ViewTransition } from "@/components/ViewTransition";
import useReduceMotion from "@/hooks/useReduceMotion";
import { getOptimizedImage } from "@/utils/common";
import { Heading, type HeadingProps } from "../Headings";
import styles from "./Hero.module.scss";

export type { HeroContent } from "./heroContent";

export interface HeroProps {
  images?: any[];
  heading?: HeadingProps;
  /** One or more body blocks from Contentful (Rich Text + legacy description). */
  bodies?: HeroContent[];
  /** Single body — used by EventDetail, NewsDetail, etc. */
  content?: HeroContent;
  animationID?: string;
  height?: SectionProps["height"];
  imageAlignment?: "top" | "bottom";
  animateContent?: boolean;
  /** Enable/disable image animations (Ken Burns + crossfade slideshow). Default: true */
  imageAnimate?: boolean;
  size?: SectionProps["size"];
  /** Where the title/content block sits within the hero. Default: "center" */
  titlePosition?: "center" | "bottom-left" | "bottom-center";
  /**
   * view-transition-name for the first hero image. Set this to the same name a
   * source element used (e.g. an event card cover) to morph it into the hero
   * during a cross-page View Transition. Must be unique on the page.
   */
  viewTransitionName?: string;
}

// Crossfade cadence (ms): how long each slide holds before advancing.
const SLIDE_INTERVAL_MS = 8000;

export const Hero = ({
  images,
  heading,
  bodies,
  content,
  animationID = "hero",
  height,
  size = "full",
  imageAlignment,
  animateContent = true,
  imageAnimate = true,
  titlePosition = "center",
  viewTransitionName,
}: HeroProps) => {
  const reduceMotion = useReduceMotion();
  const heroBodies = bodies?.length ? bodies : content != null ? [content] : [];

  // Normalize Contentful / external images
  const heroImages =
    images
      ?.flatMap((item) => {
        if (Array.isArray(item?.image)) return item.image;
        if (item && (item.src || item.url)) return [item];
        return [];
      })
      .filter(Boolean) ?? [];

  // Slideshow + Ken Burns only kick in with more than one image (matches the
  // previous behaviour — a lone image stays static).
  const hasSlideshow = Boolean(imageAnimate && heroImages.length > 1);

  const [active, setActive] = useState(0);

  // Advance the active slide on an interval; CSS handles the actual crossfade
  // (and the looping Ken Burns). Loops forever — paused under reduce-motion.
  useEffect(() => {
    if (!hasSlideshow || reduceMotion) return;
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % heroImages.length);
    }, SLIDE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [hasSlideshow, reduceMotion, heroImages.length]);

  return (
    <Section
      animationID={animationID}
      tone="muted"
      size={size}
      imageAlignment={imageAlignment}
      height={height ? (height as SectionProps["height"]) : undefined}
      data-title-position={titlePosition}
      classNames={{
        main: styles.main,
        inner: styles.inner,
        heading: styles.heading,
      }}
    >
      {/* BACKGROUND IMAGES */}
      {heroImages.length > 0 && (
        <div
          className={clsx(styles.hero__background, hasSlideshow && styles["hero__background--motion"])}
          data-hero-background
        >
          {heroImages.map((img, i) => {
            const optimized = getOptimizedImage(img, 1600, "100");
            const src = optimized?.url || img?.src || img?.url || "";
            const w = optimized?.width || img?.width || 1600;
            const h = optimized?.height || img?.height || 900;

            const isFirst = i === 0;
            const key = img?.id ?? i;
            const imageBlock = (
              <div className={clsx(styles.hero__image, i === active && styles["hero__image--active"])} data-hero>
                <Image
                  src={src}
                  alt={img?.alt ?? ""}
                  width={w}
                  height={h}
                  priority={isFirst}
                  fetchPriority={isFirst ? "high" : undefined}
                />
              </div>
            );

            // Wrap the whole image block (incl. the dark :before overlay) so the
            // morph cross-fades to the final darkened hero instead of popping.
            return isFirst && viewTransitionName ? (
              <ViewTransition key={key} name={viewTransitionName} share="morph" default="none">
                {imageBlock}
              </ViewTransition>
            ) : (
              <Fragment key={key}>{imageBlock}</Fragment>
            );
          })}
        </div>
      )}

      {/* CONTENT */}
      <div className={clsx(styles.hero__content, animateContent && styles["hero__content--animate"])} data-anim="hero-content">
        {heading && (
          <Heading
            as={heading.as}
            size={heading.size}
            center={titlePosition !== "bottom-left"}
            className={styles.hero__title}
          >
            {heading.heading}
          </Heading>
        )}
        {heroBodies.length > 0 ? (
          <div className={styles.hero__body}>
            {heroBodies.map((part, index) => (
              <Fragment key={index}>{renderHeroBody(part)}</Fragment>
            ))}
          </div>
        ) : null}
      </div>
    </Section>
  );
};
