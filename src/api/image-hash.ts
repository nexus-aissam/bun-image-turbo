/**
 * Perceptual hashing API for image similarity detection
 *
 * Perceptual hashes (pHash, dHash, aHash) generate fingerprints that allow
 * comparing images for similarity. Unlike cryptographic hashes, similar images
 * produce similar hashes.
 *
 * Use cases:
 * - Duplicate image detection
 * - Content moderation (finding near-duplicates)
 * - Reverse image search
 * - Copyright infringement detection
 *
 * @example
 * ```typescript
 * import { imageHash, imageHashDistance } from 'imgkit';
 *
 * // Generate hashes
 * const hash1 = await imageHash(image1Buffer, { algorithm: 'PHash' });
 * const hash2 = await imageHash(image2Buffer, { algorithm: 'PHash' });
 *
 * // Compare similarity (0 = identical, higher = more different)
 * const distance = imageHashDistance(hash1.hash, hash2.hash);
 *
 * if (distance < 5) {
 *   console.log('Images are very similar!');
 * }
 * ```
 */

import type { ImageHashOptions, ImageHashResult } from "../types";
import { native } from "../loader";

/**
 * Generate a perceptual hash from an image asynchronously
 *
 * @param input - Image buffer (JPEG, PNG, WebP, etc.)
 * @param options - Hash options (algorithm, size)
 * @returns Promise resolving to ImageHashResult with hash string
 *
 * @example
 * ```typescript
 * // Default: PHash with 8x8 size
 * const result = await imageHash(buffer);
 * console.log(result.hash); // Base64-encoded hash
 *
 * // Custom algorithm and size
 * const result2 = await imageHash(buffer, {
 *   algorithm: 'DHash',
 *   size: 'Size16'
 * });
 * ```
 */
export async function imageHash(
  input: Buffer,
  options?: ImageHashOptions
): Promise<ImageHashResult> {
  const result = await native.imageHash(input, options?.algorithm, options?.size);
  return {
    hash: result.hash,
    width: result.width,
    height: result.height,
    hashSize: result.hashSize,
    algorithm: result.algorithm,
  };
}

/**
 * Generate a perceptual hash from an image synchronously
 *
 * @param input - Image buffer (JPEG, PNG, WebP, etc.)
 * @param options - Hash options (algorithm, size)
 * @returns ImageHashResult with hash string
 */
export function imageHashSync(
  input: Buffer,
  options?: ImageHashOptions
): ImageHashResult {
  const result = native.imageHashSync(input, options?.algorithm, options?.size);
  return {
    hash: result.hash,
    width: result.width,
    height: result.height,
    hashSize: result.hashSize,
    algorithm: result.algorithm,
  };
}

/**
 * Calculate the hamming distance between two perceptual hashes asynchronously
 *
 * The distance represents how different the images are:
 * - 0: Identical images
 * - 1-5: Very similar (likely same image with minor edits)
 * - 6-10: Similar (possible match)
 * - >10: Different images
 *
 * @param hash1 - First hash (base64 string from imageHash)
 * @param hash2 - Second hash (base64 string from imageHash)
 * @returns Promise resolving to hamming distance
 *
 * @example
 * ```typescript
 * const hash1 = await imageHash(image1);
 * const hash2 = await imageHash(image2);
 *
 * const distance = await imageHashDistance(hash1.hash, hash2.hash);
 * console.log(`Distance: ${distance}`);
 * ```
 */
export async function imageHashDistance(
  hash1: string,
  hash2: string
): Promise<number> {
  return native.imageHashDistance(hash1, hash2);
}

/**
 * Calculate the hamming distance between two perceptual hashes synchronously
 *
 * @param hash1 - First hash (base64 string from imageHash)
 * @param hash2 - Second hash (base64 string from imageHash)
 * @returns Hamming distance (0 = identical)
 */
export function imageHashDistanceSync(hash1: string, hash2: string): number {
  return native.imageHashDistanceSync(hash1, hash2);
}
