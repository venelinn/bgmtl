import { Hero, type HeroProps } from "./Hero";
import { resolveHeroBodies } from "./heroContent";

type HeroConnectorProps = HeroProps & {
  media?: HeroProps["images"];
  /** @deprecated Use `content` (Rich Text). Kept until all entries are republished. */
  description?: HeroProps["content"];
  locale?: string;
};

export const HeroConnector = (props: HeroConnectorProps) => {
  const { description: _legacy, locale, ...rest } = props;
  const bodies = resolveHeroBodies(props as Record<string, unknown>, locale);

  return (
    <Hero
      images={rest.media ?? rest.images}
      animationID={rest.animationID}
      heading={rest.heading}
      bodies={bodies}
      height={rest.height}
      size={rest.size}
      imageAlignment={rest.imageAlignment}
      animateContent={rest.animateContent}
      imageAnimate={rest.imageAnimate}
      titlePosition={rest.titlePosition}
      viewTransitionName={rest.viewTransitionName}
    />
  );
};
