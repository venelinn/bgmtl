import type { CloudinaryImage } from "@/types/image";

export const boatImagesMock: CloudinaryImage[] = [
  {
    src: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=500&q=80",
    alt: "Luxury yacht on the water",
    width: 500,
    height: 400,
  },
  {
    src: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=500&q=80",
    alt: "Catamaran sailing",
    width: 500,
    height: 400,
  },
  {
    src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=500&q=80",
    alt: "Motor yacht cruising",
    width: 500,
    height: 400,
  },
  {
    src: "https://images.unsplash.com/photo-1552418235-7d7cad2b8b7e?auto=format&fit=crop&w=500&q=80",
    alt: "Fishing boat",
    width: 500,
    height: 400,
  },
  {
    src: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=500&q=80",
    alt: "Luxury yacht in tropical waters",
    width: 500,
    height: 400,
  },
];

// Single boat image for stories
export const singleBoatImageMock: CloudinaryImage = boatImagesMock[0];

// Multiple boat images for slider stories
export const multipleBoatImagesMock: CloudinaryImage[] = boatImagesMock.slice(0, 4);
