/**
 * Client-side image compression using canvas.
 * Resizes and compresses images over 1MB before upload.
 */

const MAX_DIMENSION = 800; // Max width/height in pixels (logos don't need to be huge)
const TARGET_SIZE = 500 * 1024; // Target: under 500KB after compression
const COMPRESS_THRESHOLD = 1 * 1024 * 1024; // Only compress if over 1MB

export async function compressImage(file: File): Promise<File> {
  // Skip SVGs — they're already lightweight and can't be drawn to canvas
  if (file.type === "image/svg+xml") return file;

  // Skip small files
  if (file.size <= COMPRESS_THRESHOLD) return file;

  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;

  // Calculate new dimensions, maintaining aspect ratio
  let newWidth = width;
  let newHeight = height;

  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
    newWidth = Math.round(width * ratio);
    newHeight = Math.round(height * ratio);
  }

  // Draw to canvas
  const canvas = document.createElement("canvas");
  canvas.width = newWidth;
  canvas.height = newHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, newWidth, newHeight);
  bitmap.close();

  // Try progressively lower quality until under target size
  const outputType = file.type === "image/png" ? "image/png" : "image/webp";
  let quality = 0.85;
  let blob: Blob | null = null;

  while (quality >= 0.3) {
    blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, outputType, quality)
    );

    if (blob && blob.size <= TARGET_SIZE) break;
    quality -= 0.1;
  }

  // If PNG is still too large, convert to WebP
  if (blob && blob.size > TARGET_SIZE && outputType === "image/png") {
    quality = 0.85;
    while (quality >= 0.3) {
      blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/webp", quality)
      );
      if (blob && blob.size <= TARGET_SIZE) break;
      quality -= 0.1;
    }
  }

  if (!blob) return file; // Fallback: return original

  // Build a new File with a matching extension
  const ext = outputType === "image/webp" ? "webp" : file.name.split(".").pop() || "png";
  const name = file.name.replace(/\.[^.]+$/, `.${ext}`);

  return new File([blob], name, { type: blob.type });
}
