/**
 * API module barrel exports
 *
 * Re-exports all API functions from individual modules.
 */

export { metadata, metadataSync } from "./metadata";
export { resize, resizeSync } from "./resize";
export { crop, cropSync } from "./crop";
export { toJpeg, toJpegSync, toPng, toPngSync, toWebp, toWebpSync } from "./encode";
export { transform, transformSync } from "./transform";
export { blurhash, blurhashSync } from "./blurhash";
export {
  thumbhash,
  thumbhashSync,
  thumbhashToRgba,
  thumbhashToRgbaSync,
  thumbhashToDataUrl,
} from "./thumbhash";
export { writeExif, writeExifSync, stripExif, stripExifSync } from "./exif";
export { toTensor, toTensorSync } from "./tensor";
export type { EnhancedTensorResult } from "./tensor";
export {
  imageHash,
  imageHashSync,
  imageHashDistance,
  imageHashDistanceSync,
} from "./image-hash";
export {
  smartCrop,
  smartCropSync,
  smartCropAnalyze,
  smartCropAnalyzeSync,
} from "./smart-crop";
export {
  dominantColors,
  dominantColorsSync,
} from "./dominant-colors";
export {
  thumbnail,
  thumbnailSync,
  thumbnailBuffer,
  thumbnailBufferSync,
} from "./thumbnail";
