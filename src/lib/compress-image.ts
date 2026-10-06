/** Resize and re-encode a photo in the browser so uploads stay small (~200–400 KB). */
export async function compressImage(
  file: File,
  maxSide = 1600,
  quality = 0.82,
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose a photo.");
  }
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser can’t process photos.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let dataUrl = canvas.toDataURL("image/jpeg", quality);
  if (dataUrl.length > 1_300_000) {
    dataUrl = canvas.toDataURL("image/jpeg", 0.6);
  }
  return dataUrl;
}
