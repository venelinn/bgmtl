import clsx from "clsx";
import type { SectionProps } from "@/components/Section";
import type { SliderConnectorProps } from "@/types/slider";
import { Slider } from ".";
import styles from "./Slider.module.scss";

// Helper function to compute section props for slider
export const getSliderSectionProps = (props: SliderConnectorProps): Partial<SectionProps> => {
  const { isOffset, variant = "primary" } = props;

  return {
    "data-js": "section-slider",
    "data-slider": variant,
    classNames: {
      inner: clsx(styles.inner, { [styles.inner__offset]: isOffset }),
      heading: styles.inner__heading,
      description: styles.inner__description,
    },
  };
};

export const SliderConnector = (props: SliderConnectorProps) => {
  const { items = [], ...rest } = props;

  if (!items.length) return null;

  return <Slider items={items} {...rest} />;
};
