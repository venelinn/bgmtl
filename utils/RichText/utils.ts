/** Preprocess Cloudinary URLs - disable f_auto for SVGs */
export function getCloudinaryImageURL(url: string): string {
  if (url?.includes(".svg")) {
    return url.replace("/f_auto", "");
  }
  return url ?? "";
}
