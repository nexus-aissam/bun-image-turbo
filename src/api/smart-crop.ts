/**
 * Smart Crop API for content-aware image cropping
 *
 * Smart crop uses saliency detection, edge detection, and the rule of thirds
 * to automatically find the most interesting region of an image and crop to it.
 *
 * Use cases:
 * - Generating thumbnails that focus on the subject
 * - Social media image cropping (Instagram, YouTube, Twitter)
 * - E-commerce product image cropping
 * - Profile picture generation
 *
 * @example
 * ```typescript
 * import { smartCrop, smartCropAnalyze } from 'bun-image-turbo';
 *
 * // Simple square crop
 * const thumbnail = await smartCrop(buffer, { aspectRatio: '1:1' });
 *
 * // YouTube thumbnail
 * const youtube = await smartCrop(buffer, { aspectRatio: '16:9' });
 *
 * // Analyze without cropping
 * const analysis = await smartCropAnalyze(buffer, { aspectRatio: '1:1' });
 * console.log(`Best crop at: ${analysis.x}, ${analysis.y}`);
 * ```
 */

import type { SmartCropOptions, SmartCropAnalysis } from "../types";
import { native } from "../loader";

/**
 * Smart crop an image using content-aware detection asynchronously
 *
 * @param input - Image buffer (JPEG, PNG, WebP, etc.)
 * @param options - Smart crop options (width, height, or aspectRatio)
 * @returns Promise resolving to cropped image buffer (PNG format)
 *
 * @example
 * ```typescript
 * // Crop to square (Instagram)
 * const square = await smartCrop(buffer, { aspectRatio: '1:1' });
 *
 * // Crop to landscape (YouTube)
 * const landscape = await smartCrop(buffer, { aspectRatio: '16:9' });
 *
 * // Crop to portrait (Stories)
 * const portrait = await smartCrop(buffer, { aspectRatio: '9:16' });
 *
 * // Crop to specific dimensions
 * const custom = await smartCrop(buffer, { width: 400, height: 300 });
 * ```
 */
export async function smartCrop(
  input: Buffer,
  options: SmartCropOptions
): Promise<Buffer> {
  return native.smartCrop(input, {
    width: options.width,
    height: options.height,
    aspectRatio: options.aspectRatio,
    boost: options.boost,
  });
}

/**
 * Smart crop an image using content-aware detection synchronously
 *
 * @param input - Image buffer (JPEG, PNG, WebP, etc.)
 * @param options - Smart crop options (width, height, or aspectRatio)
 * @returns Cropped image buffer (PNG format)
 */
export function smartCropSync(
  input: Buffer,
  options: SmartCropOptions
): Buffer {
  return native.smartCropSync(input, {
    width: options.width,
    height: options.height,
    aspectRatio: options.aspectRatio,
    boost: options.boost,
  });
}

/**
 * Analyze an image and find the best crop region asynchronously
 *
 * Returns crop coordinates without actually cropping the image.
 * Useful when you need to know where the crop will be before applying it,
 * or when you want to use the crop coordinates with a different tool.
 *
 * @param input - Image buffer (JPEG, PNG, WebP, etc.)
 * @param options - Smart crop options (width, height, or aspectRatio)
 * @returns Promise resolving to SmartCropAnalysis with crop coordinates and score
 *
 * @example
 * ```typescript
 * const analysis = await smartCropAnalyze(buffer, { aspectRatio: '1:1' });
 * console.log(`Best crop: x=${analysis.x}, y=${analysis.y}`);
 * console.log(`Size: ${analysis.width}x${analysis.height}`);
 * console.log(`Score: ${analysis.score}`);
 * ```
 */
export async function smartCropAnalyze(
  input: Buffer,
  options: SmartCropOptions
): Promise<SmartCropAnalysis> {
  const result = await native.smartCropAnalyze(input, {
    width: options.width,
    height: options.height,
    aspectRatio: options.aspectRatio,
    boost: options.boost,
  });
  return {
    x: result.x,
    y: result.y,
    width: result.width,
    height: result.height,
    score: result.score,
  };
}

/**
 * Analyze an image and find the best crop region synchronously
 *
 * @param input - Image buffer (JPEG, PNG, WebP, etc.)
 * @param options - Smart crop options (width, height, or aspectRatio)
 * @returns SmartCropAnalysis with crop coordinates and score
 */
export function smartCropAnalyzeSync(
  input: Buffer,
  options: SmartCropOptions
): SmartCropAnalysis {
  const result = native.smartCropAnalyzeSync(input, {
    width: options.width,
    height: options.height,
    aspectRatio: options.aspectRatio,
    boost: options.boost,
  });
  return {
    x: result.x,
    y: result.y,
    width: result.width,
    height: result.height,
    score: result.score,
  };
}
