const vendor = process.env.NEXT_PUBLIC_VENDOR || "docharge";

const vendorConfigs = {
  speede: {
    logo: "speede,161,35",
    heroImage: "/vendor/speede/hero-speede.jpg",
    slogan: {
      en: "Powering Your Journey: Reliable EV Charging Solutions",
      fr: "Propulser votre voyage: Solutions de recharge VE fiables",
    },
    brandColors: {
      primary: "#ff5733",
      secondary: "#33ff57",
    },
  },
  docharge: {
    logo: "logo,190,30",
    heroImage: "/images/hero.jpg",
    slogan: {
      en: "Powering Your Journey: Reliable EV Charging Solutions",
      fr: "Propulser votre voyage: Solutions de recharge VE fiables",
    },
    brandColors: {
      primary: "#000000",
      secondary: "#ffffff",
    },
  },
  maintenance: {
    logo: "logo,190,30",
    heroImage: "/images/hero.jpg",
    slogan: {
      en: "Powering Your Journey: Reliable EV Charging Solutions",
      fr: "Propulser votre voyage: Solutions de recharge VE fiables",
    },
    brandColors: {
      primary: "#000000",
      secondary: "#ffffff",
    },
    postLoginRedirect: "/maintenance",
  },
};

// Load the configuration for the current vendor
const config = vendorConfigs[vendor] || vendorConfigs.docharge;

export { vendor };
export default config;
