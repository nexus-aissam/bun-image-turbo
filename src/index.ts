/**
 * imgkit - High-performance image processing for Bun and Node.js
 *
 * @module imgkit
 * @author Aissam Irhir <aissamirhir@gmail.com>
 *
 * @example
 * ```typescript
 * import { resize, toWebp, metadata } from 'imgkit';
 *
 * // Read image
 * const input = await Bun.file('input.jpg').arrayBuffer();
 *
 * // Resize image
 * const resized = await resize(Buffer.from(input), { width: 800, height: 600 });
 *
 * // Convert to WebP
 * const webp = await toWebp(Buffer.from(input), { quality: 85 });
 *
 * // Get metadata
 * const info = await metadata(Buffer.from(input));
 * console.log(info.width, info.height, info.format);
 * ```
 */

// Re-export types
export type {
  ImageFormat,
  ResizeFilter,
  FitMode,
  CropGravity,
  CropOptions,
  ResizeOptions,
  JpegOptions,
  PngOptions,
  WebPOptions,
  AvifOptions,
  OutputOptions,
  ImageMetadata,
  BlurHashResult,
  ThumbHashResult,
  ThumbHashDecodeResult,
  TransformOptions,
  ExifOptions,
  TensorDtype,
  TensorLayout,
  TensorNormalization,
  TensorOptions,
  TensorResult,
  HashAlgorithm,
  HashSize,
  ImageHashOptions,
  ImageHashResult,
  AspectRatio,
  SmartCropBoostRegion,
  SmartCropOptions,
  SmartCropAnalysis,
  DominantColor,
  DominantColorsResult,
  ThumbnailFormat,
  ThumbnailOptions,
  ThumbnailResult,
} from "./types";
export type { EnhancedTensorResult } from "./api";

// Re-export API functions
export {
  metadata,
  metadataSync,
  resize,
  resizeSync,
  crop,
  cropSync,
  toJpeg,
  toJpegSync,
  toPng,
  toPngSync,
  toWebp,
  toWebpSync,
  transform,
  transformSync,
  blurhash,
  blurhashSync,
  thumbhash,
  thumbhashSync,
  thumbhashToRgba,
  thumbhashToRgbaSync,
  thumbhashToDataUrl,
  writeExif,
  writeExifSync,
  stripExif,
  stripExifSync,
  toTensor,
  toTensorSync,
  imageHash,
  imageHashSync,
  imageHashDistance,
  imageHashDistanceSync,
  smartCrop,
  smartCropSync,
  smartCropAnalyze,
  smartCropAnalyzeSync,
  dominantColors,
  dominantColorsSync,
  thumbnail,
  thumbnailSync,
  thumbnailBuffer,
  thumbnailBufferSync,
} from "./api";

// Import for version and default export
import { native } from "./loader";

/**
 * Get library version
 */
export function version(): string {
  return native.version();
}

// Import functions for default export
import {
  metadata,
  metadataSync,
  resize,
  resizeSync,
  crop,
  cropSync,
  toJpeg,
  toJpegSync,
  toPng,
  toPngSync,
  toWebp,
  toWebpSync,
  transform,
  transformSync,
  blurhash,
  blurhashSync,
  thumbhash,
  thumbhashSync,
  thumbhashToRgba,
  thumbhashToRgbaSync,
  thumbhashToDataUrl,
  writeExif,
  writeExifSync,
  stripExif,
  stripExifSync,
  toTensor,
  toTensorSync,
  imageHash,
  imageHashSync,
  imageHashDistance,
  imageHashDistanceSync,
  smartCrop,
  smartCropSync,
  smartCropAnalyze,
  smartCropAnalyzeSync,
  dominantColors,
  dominantColorsSync,
  thumbnail,
  thumbnailSync,
  thumbnailBuffer,
  thumbnailBufferSync,
} from "./api";

// Default export for convenience
export default {
  metadata,
  metadataSync,
  resize,
  resizeSync,
  crop,
  cropSync,
  toJpeg,
  toJpegSync,
  toPng,
  toPngSync,
  toWebp,
  toWebpSync,
  transform,
  transformSync,
  blurhash,
  blurhashSync,
  thumbhash,
  thumbhashSync,
  thumbhashToRgba,
  thumbhashToRgbaSync,
  thumbhashToDataUrl,
  writeExif,
  writeExifSync,
  stripExif,
  stripExifSync,
  toTensor,
  toTensorSync,
  imageHash,
  imageHashSync,
  imageHashDistance,
  imageHashDistanceSync,
  smartCrop,
  smartCropSync,
  smartCropAnalyze,
  smartCropAnalyzeSync,
  dominantColors,
  dominantColorsSync,
  thumbnail,
  thumbnailSync,
  thumbnailBuffer,
  thumbnailBufferSync,
  version,
};
