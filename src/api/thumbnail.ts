/**
 * Fast Thumbnail API
 *
 * Optimized thumbnail generation with shrink-on-load support.
 * Uses decode-time scaling for 4-10x faster processing of large images.
 *
 * @module api/thumbnail
 */

import { native } from "../loader";
import type { ThumbnailOptions, ThumbnailResult } from "../types";

/**
 * Generate a fast thumbnail synchronously
 *
 * Uses shrink-on-load optimization for 4-10x faster processing of large images.
 *
 * Optimizations:
 * - JPEG: Decodes at 1/2, 1/4, or 1/8 scale using libjpeg-turbo SIMD
 * - WebP: Decodes directly at target resolution using libwebp scaling
 * - Multi-step resize for remaining scale reduction
 *
 * @param input - Image buffer (JPEG, PNG, WebP, etc.)
 * @param options - Thumbnail options
 * @returns Thumbnail result with image data and metadata
 *
 * @example
 * ```typescript
 * import { thumbnailSync } from 'imgkit';
 *
 * const result = thumbnailSync(buffer, {
 *   width: 200,
 *   shrinkOnLoad: true, // default: true
 *   format: 'Jpeg',
 *   quality: 85,
 * });
 *
 * console.log(`${result.width}x${result.height} ${result.format}`);
 * console.log(`Shrink-on-load used: ${result.shrinkOnLoadUsed}`);
 * ```
 */
export function thumbnailSync(
  input: Buffer,
  options: ThumbnailOptions
): ThumbnailResult {
  const result = native.thumbnailSync(input, {
    width: options.width,
    height: options.height,
    format: options.format,
    quality: options.quality,
    shrinkOnLoad: options.shrinkOnLoad,
    filter: options.filter,
    fastMode: options.fastMode,
  });
  // Convert data array to Buffer
  return {
    ...result,
    data: Buffer.from(result.data),
  };
}

/**
 * Generate a fast thumbnail asynchronously
 *
 * Uses shrink-on-load optimization for 4-10x faster processing of large images.
 *
 * Optimizations:
 * - JPEG: Decodes at 1/2, 1/4, or 1/8 scale using libjpeg-turbo SIMD
 * - WebP: Decodes directly at target resolution using libwebp scaling
 * - Multi-step resize for remaining scale reduction
 *
 * @param input - Image buffer (JPEG, PNG, WebP, etc.)
 * @param options - Thumbnail options
 * @returns Promise resolving to thumbnail result with image data and metadata
 *
 * @example
 * ```typescript
 * import { thumbnail } from 'imgkit';
 *
 * const result = await thumbnail(buffer, {
 *   width: 200,
 *   shrinkOnLoad: true, // default: true
 *   format: 'Jpeg',
 *   quality: 85,
 * });
 *
 * await Bun.write('thumb.jpg', result.data);
 * ```
 */
export async function thumbnail(
  input: Buffer,
  options: ThumbnailOptions
): Promise<ThumbnailResult> {
  const result = await native.thumbnail(input, {
    width: options.width,
    height: options.height,
    format: options.format,
    quality: options.quality,
    shrinkOnLoad: options.shrinkOnLoad,
    filter: options.filter,
    fastMode: options.fastMode,
  });
  // Convert data array to Buffer
  return {
    ...result,
    data: Buffer.from(result.data),
  };
}

/**
 * Generate a fast thumbnail and return just the buffer synchronously
 *
 * Same optimizations as thumbnailSync() but returns only the image data.
 *
 * @param input - Image buffer
 * @param options - Thumbnail options
 * @returns Image buffer
 *
 * @example
 * ```typescript
 * import { thumbnailBufferSync } from 'imgkit';
 *
 * const thumb = thumbnailBufferSync(buffer, { width: 200 });
 * await Bun.write('thumb.jpg', thumb);
 * ```
 */
export function thumbnailBufferSync(
  input: Buffer,
  options: ThumbnailOptions
): Buffer {
  return native.thumbnailBufferSync(input, {
    width: options.width,
    height: options.height,
    format: options.format,
    quality: options.quality,
    shrinkOnLoad: options.shrinkOnLoad,
    filter: options.filter,
    fastMode: options.fastMode,
  });
}

/**
 * Generate a fast thumbnail and return just the buffer asynchronously
 *
 * Same optimizations as thumbnail() but returns only the image data.
 *
 * @param input - Image buffer
 * @param options - Thumbnail options
 * @returns Promise resolving to image buffer
 *
 * @example
 * ```typescript
 * import { thumbnailBuffer } from 'imgkit';
 *
 * const thumb = await thumbnailBuffer(buffer, { width: 200 });
 * await Bun.write('thumb.jpg', thumb);
 * ```
 */
export async function thumbnailBuffer(
  input: Buffer,
  options: ThumbnailOptions
): Promise<Buffer> {
  return native.thumbnailBuffer(input, {
    width: options.width,
    height: options.height,
    format: options.format,
    quality: options.quality,
    shrinkOnLoad: options.shrinkOnLoad,
    filter: options.filter,
    fastMode: options.fastMode,
  });
}
