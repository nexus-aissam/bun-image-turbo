/**
 * Dominant Color Extraction API
 *
 * Extract the most prominent colors from an image using color quantization.
 * Perfect for UI theming, image placeholders, and color palette generation.
 *
 * Use cases:
 * - Auto-theme UI based on image (like Spotify album art)
 * - Generate color placeholder while image loads
 * - Create color palettes from photos
 * - Image categorization by dominant color
 * - Choose contrasting text colors for accessibility
 *
 * @example
 * ```typescript
 * import { dominantColors } from 'imgkit';
 *
 * const result = await dominantColors(buffer);
 * console.log(result.primary.hex); // "#3498DB"
 *
 * // Get specific number of colors
 * const palette = await dominantColors(buffer, 8);
 * palette.colors.forEach(color => console.log(color.hex));
 * ```
 */

import type { DominantColorsResult } from "../types";
import { native } from "../loader";

/**
 * Extract dominant colors from an image asynchronously
 *
 * @param input - Image buffer (JPEG, PNG, WebP, etc.)
 * @param count - Maximum number of colors to extract (default: 5)
 * @returns Promise resolving to DominantColorsResult with colors array and primary color
 *
 * @example
 * ```typescript
 * // Get default 5 dominant colors
 * const result = await dominantColors(buffer);
 * console.log(result.primary); // { r: 52, g: 152, b: 219, hex: "#3498DB" }
 *
 * // Get 8 colors for a richer palette
 * const palette = await dominantColors(buffer, 8);
 *
 * // Use for UI theming
 * document.body.style.backgroundColor = result.primary.hex;
 * ```
 */
export async function dominantColors(
  input: Buffer,
  count?: number
): Promise<DominantColorsResult> {
  const result = await native.dominantColors(input, count);
  return {
    colors: result.colors.map((c: { r: number; g: number; b: number; hex: string }) => ({
      r: c.r,
      g: c.g,
      b: c.b,
      hex: c.hex,
    })),
    primary: {
      r: result.primary.r,
      g: result.primary.g,
      b: result.primary.b,
      hex: result.primary.hex,
    },
  };
}

/**
 * Extract dominant colors from an image synchronously
 *
 * @param input - Image buffer (JPEG, PNG, WebP, etc.)
 * @param count - Maximum number of colors to extract (default: 5)
 * @returns DominantColorsResult with colors array and primary color
 *
 * @example
 * ```typescript
 * const result = dominantColorsSync(buffer);
 * console.log(result.primary.hex); // "#3498DB"
 * ```
 */
export function dominantColorsSync(
  input: Buffer,
  count?: number
): DominantColorsResult {
  const result = native.dominantColorsSync(input, count);
  return {
    colors: result.colors.map((c: { r: number; g: number; b: number; hex: string }) => ({
      r: c.r,
      g: c.g,
      b: c.b,
      hex: c.hex,
    })),
    primary: {
      r: result.primary.r,
      g: result.primary.g,
      b: result.primary.b,
      hex: result.primary.hex,
    },
  };
}
