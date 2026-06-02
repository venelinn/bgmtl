"use client";
import gsap from "gsap";
import Image from "next/image";
import { Fragment, useEffect, useRef } from "react";
import { Section, type SectionProps } from "@/components/Section";
import { ViewTransition } from "@/components/ViewTransition";
import useReduceMotion from "@/hooks/useReduceMotion";
import { getOptimizedImage } from "@/utils/common";
import { Heading, type HeadingProps } from "../Headings";
import styles from "./Hero.module.scss";

export interface HeroProps {
  images?: any[];
  heading?: HeadingProps;
  description?: React.ReactNode;
  animationID?: string;
  height?: SectionProps["height"];
  imageAlignment?: "top" | "bottom";
  animateContent?: boolean;
  /** Enable/disable image animations (Ken Burns / slide). Default: true */
  imageAnimate?: boolean;
  size?: SectionProps["size"];
  /** Where the title/description block sits within the hero. Default: "center" */
  titlePosition?: "center" | "bottom-left" | "bottom-center";
  /**
   * view-transition-name for the first hero image. Set this to the same name a
   * source element used (e.g. an event card cover) to morph it into the hero
   * during a cross-page View Transition. Must be unique on the page.
   */
  viewTransitionName?: string;
}

export const Hero = ({
  images,
  heading,
  description,
  animationID = "hero",
  height,
  size = "full",
  imageAlignment,
  animateContent = false,
  imageAnimate = true,
  titlePosition = "center",
  viewTransitionName,
}: HeroProps) => {
  const reduceMotion = useReduceMotion();
  const heroRef = useRef<HTMLDivElement>(null);

  // Normalize Contentful / external images
  const heroImages =
    images
      ?.flatMap((item) => {
        if (Array.isArray(item?.image)) return item.image;
        if (item && (item.src || item.url)) return [item];
        return [];
      })
      .filter(Boolean) ?? [];

  // Derived key for hook deps: true when image animations are enabled and there are multiple images
  const imageAnimationKey = Boolean(imageAnimate && heroImages.length > 1);

  useEffect(() => {
    if (reduceMotion || !heroRef.current) return;

    const ctx = gsap.context(() => {
      const imgs = gsap.utils.toArray<HTMLElement>("[data-hero]");
      const enableImageAnimation = Boolean(imageAnimationKey && imgs.length > 1);
      const background = heroRef.current?.querySelector("[data-hero-background]");
      const title = heroRef.current?.querySelector<HTMLElement>("[data-hero-title]");
      const desc = heroRef.current?.querySelector<HTMLElement>("[data-hero-desc]");

      const duration = 1;
      const timeout = 8;
      let current = 0;

      // ===== BACKGROUND KEN BURNS =====
      if (background && enableImageAnimation) {
        const bgTl = gsap.timeline({ repeat: -1 });
        bgTl
          .set(background, { transformOrigin: "right center" })
          .to(background, { scale: 1.25, duration: 15, ease: "none" })
          .to(background, { x: "25%", duration: 15, ease: "none" })
          .set(background, { x: "0%", transformOrigin: "left center" })
          .to(background, { scale: 1, duration: 15, ease: "none" });

        bgTl.timeScale(0.3); // slow motion
      }

      // ===== INITIAL STATES =====
      if (enableImageAnimation) {
        gsap.set(imgs, { autoAlpha: 0, scale: 1.1 });
        if (imgs[0]) {
          gsap.set(imgs[0], { autoAlpha: 0, scale: 1.2 }); // initial image entrance
        }
      } else {
        // No image animation: ensure first image is visible and others hidden
        gsap.set(imgs, { autoAlpha: 0, scale: 1 });
        if (imgs[0]) gsap.set(imgs[0], { autoAlpha: 1, scale: 1 });
      }

      if (title) {
        gsap.set(title, {
          autoAlpha: animateContent ? 0 : 1,
          scale: animateContent ? 1.15 : 1,
          filter: animateContent ? "blur(12px)" : "blur(0px)",
        });
      }
      if (desc) {
        gsap.set(desc, {
          autoAlpha: animateContent ? 0 : 1,
          y: animateContent ? 20 : 0,
          filter: animateContent ? "blur(8px)" : "blur(0px)",
        });
      }
      // ===== ANIMATE CONTENT IN =====
      const animateContentIn = () => {
        const tl = gsap.timeline();

        if (animateContent && title) {
          tl.to(title, {
            autoAlpha: 1,
            scale: 1,
            filter: "blur(0px)",
            duration: 2,
            ease: "power3.out",
          });
        }
        if (animateContent && desc) {
          tl.to(
            desc,
            {
              autoAlpha: 1,
              y: 0,
              filter: "blur(0px)",
              duration: 1.5,
              ease: "power3.out",
            },
            animateContent && title ? "-=1" : 0,
          );
        }

        return tl;
      };

      // ===== FIRST IMAGE ANIMATION =====
      if (enableImageAnimation) {
        const initialTl = gsap.timeline();
        initialTl.to(imgs[0], {
          autoAlpha: 1,
          scale: 1,
          duration: 2.5,
          ease: "power3.out",
        });
        initialTl.add(animateContentIn(), "-=0.5"); // content animates slightly after image starts
      } else {
        // Only animate content when images are static
        animateContentIn();
      }

      // ===== SLIDE ROTATION =====
      // ===== SLIDE ROTATION =====
      if (enableImageAnimation) {
        const goTo = (index: number) => {
          if (index === current) return;

          gsap
            .timeline()
            .to(imgs[current], { autoAlpha: 0, duration, ease: "none" })
            .to(imgs[index], { autoAlpha: 1, duration, ease: "none" }, 0);

          current = index;
          gsap.delayedCall(timeout, () => goTo(index + 1 > imgs.length - 1 ? 0 : index + 1));
        };

        gsap.delayedCall(timeout, () => goTo(1));
      }
    }, heroRef);

    return () => ctx.revert();
  }, [imageAnimationKey, reduceMotion, animateContent]);

  return (
    <Section
      animationID={animationID}
      theme="dark"
      size={size}
      imageAlignment={imageAlignment}
      height={height ? (height as SectionProps["height"]) : undefined}
      ref={heroRef}
      data-title-position={titlePosition}
      classNames={{
        main: styles.main,
        inner: styles.inner,
        heading: styles.heading,
      }}
    >
      {/* BACKGROUND IMAGES */}
      {heroImages.length > 0 && (
        <div className={styles.hero__background} data-hero-background>
          {heroImages.map((img, i) => {
            const optimized = getOptimizedImage(img, 1600, "100");
            const src = optimized?.url || img?.src || img?.url || "";
            const w = optimized?.width || img?.width || 1600;
            const h = optimized?.height || img?.height || 900;

            const isFirst = i === 0;
            const key = img?.id ?? i;
            const imageBlock = (
              <div className={styles.hero__image} data-hero>
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
              <ViewTransition
                key={key}
                name={viewTransitionName}
                share="morph"
                default="none"
              >
                {imageBlock}
              </ViewTransition>
            ) : (
              <Fragment key={key}>{imageBlock}</Fragment>
            );
          })}
        </div>
      )}

      {/* CONTENT */}
      <div className={styles.hero__content} data-anim="hero-content">
        {heading && (
          <Heading
            as={heading.as}
            size={heading.size}
            center={titlePosition !== "bottom-left"}
            className={styles.hero__title}
            data-hero-title
          >
            {heading.heading}
          </Heading>
        )}
        {description && <p data-hero-desc>{description}</p>}
      </div>
    </Section>
  );
};
