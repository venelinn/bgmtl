import { Hero } from "./Hero";

export const HeroConnector = (props) => {
  return (
    <Hero
      images={props?.media}
      animationID={props?.animationID}
      heading={props?.heading}
      description={props?.description}
      height={props?.height}
      size={props?.size}
      imageAlignment={props?.imageAlignment}
    />
  );
};
