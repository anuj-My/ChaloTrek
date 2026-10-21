// Shrinks a photo in the browser before upload: longest side at most
// `maxSize` px, re-encoded as WebP (JPEG where the browser can't encode WebP).
// A 6 MB phone photo usually ends up around 200–400 KB, which matters for
// trekkers on slow mountain networks.
export async function resizeImage(file: File, maxSize = 1600, quality = 0.82): Promise<Blob> {
  // imageOrientation: "from-image" applies the phone's EXIF rotation.
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const encode = (type: string) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
  // Browsers that can't encode WebP silently return a (large) PNG instead.
  let blob = await encode("image/webp");
  if (blob?.type !== "image/webp") blob = await encode("image/jpeg");
  if (!blob) throw new Error("This browser couldn't process the image");
  return blob;
}
