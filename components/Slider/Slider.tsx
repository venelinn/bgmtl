"use client";
import { useEffect, useId, useRef, useState } from "react";
import type { Swiper as SwiperType } from "swiper";
import { Keyboard, Mousewheel, Navigation, Pagination, Zoom } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import useReduceMotion from "@/hooks/useReduceMotion";
import type { SliderProps } from "@/types/slider";
import styles from "./Slider.module.scss";

export const Slider = ({ items, variant = "primary", itemsPerRow, instanceId }: SliderProps) => {
  const reduceMotion = useReduceMotion();
  const reactId = useId();
  const uniqueId = instanceId || `slider-${variant}-${reactId}`;
  const [isHovered, setIsHovered] = useState(false);
  const swiperRef = useRef<SwiperType | null>(null);

  const handleSwiperInit = (swiper: SwiperType) => {
    swiperRef.current = swiper;
    swiper.keyboard.disable(); // Start with keyboard disabled
  };

  useEffect(() => {
    if (swiperRef.current) {
      if (isHovered) {
        swiperRef.current.keyboard.enable();
      } else {
        swiperRef.current.keyboard.disable();
      }
    }
  }, [isHovered]);

  const getBreakpoints = (): { [key: number]: { slidesPerView: number } } => {
    switch (itemsPerRow) {
      case 1:
        return {
          480: { slidesPerView: 1 },
        };
      case 2:
        return {
          600: { slidesPerView: 1 },
          900: { slidesPerView: 2.1 },
        };
      case 3:
        return {
          480: { slidesPerView: 2 },
          1024: { slidesPerView: 3.1 },
        };
      case 4:
        return {
          480: { slidesPerView: 2 },
          768: { slidesPerView: 3 },
          1024: { slidesPerView: 4.1 },
        };
      default:
        return {};
    }
  };

  const swiperConfig = {
    modules: [Keyboard, Pagination, Navigation, Zoom, Mousewheel],
    keyboard: {
      enabled: true,
    },
    speed: reduceMotion ? 1 : 400,
    loop: false,
    spaceBetween: 20,
    breakpoints: getBreakpoints(),
  };

  return (
    <div
      className={styles.slider__wrapper}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-slider-instance={uniqueId}
    >
      <Swiper
        {...swiperConfig}
        onInit={handleSwiperInit}
        navigation={{
          prevEl: `.swiper-prev-${uniqueId}`,
          nextEl: `.swiper-next-${uniqueId}`,
        }}
      >
        {items.map((item, index) => (
          <SwiperSlide key={item.id || `slider-item-${index}`}>{item.content}</SwiperSlide>
        ))}
        <div className="swiper-pagination" />
      </Swiper>
      <div className={`swiper-prev swiper-button-prev swiper-prev-${uniqueId}`} />
      <div className={`swiper-next swiper-button-next swiper-next-${uniqueId}`} />
    </div>
  );
};
