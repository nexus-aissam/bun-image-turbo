/**
 * bun-image-turbo - High-performance image processing for Bun and Node.js
 *
 * @module bun-image-turbo
 * @author Aissam Irhir <aissamirhir@gmail.com>
 *
 * @example
 * ```typescript
 * import { resize, toWebp, metadata } from 'bun-image-turbo';
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

import type {
  ImageMetadata,
  BlurHashResult,
  ResizeOptions,
  JpegOptions,
  PngOptions,
  WebPOptions,
  AvifOptions,
  TransformOptions,
  NapiResizeOptions,
  NapiTransformOptions,
  NapiOutputOptions,
} from "./types";

import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// Re-export types
export type {
  ImageFormat,
  ResizeFilter,
  FitMode,
  ResizeOptions,
  JpegOptions,
  PngOptions,
  WebPOptions,
  AvifOptions,
  OutputOptions,
  ImageMetadata,
  BlurHashResult,
  TransformOptions,
} from "./types";

// Get current directory for ESM
const getCurrentDir = () => {
  try {
    return dirname(fileURLToPath(import.meta.url));
  } catch {
    return __dirname;
  }
};

// Platform-specific binary loading
function loadNativeBinding() {
  const platform = process.platform;
  const arch = process.arch;

  // Map to napi-rs target names
  let targetName: string;
  switch (platform) {
    case "darwin":
      targetName = arch === "arm64" ? "darwin-arm64" : "darwin-x64";
      break;
    case "linux":
      // Check for musl vs glibc
      const isMusl =
        existsSync("/etc/alpine-release") ||
        process.env.npm_config_libc === "musl";
      if (arch === "arm64") {
        targetName = isMusl ? "linux-arm64-musl" : "linux-arm64-gnu";
      } else {
        targetName = isMusl ? "linux-x64-musl" : "linux-x64-gnu";
      }
      break;
    case "win32":
      targetName = arch === "arm64" ? "win32-arm64-msvc" : "win32-x64-msvc";
      break;
    default:
      throw new Error(`Unsupported platform: ${platform}-${arch}`);
  }

  const currentDir = getCurrentDir();
  const binaryName = `image-turbo.${targetName}.node`;
  const optionalPackageName = `bun-image-turbo-${targetName}`;

  // Try loading from different locations
  const possiblePaths = [
    // Same directory as this file (dist/)
    join(currentDir, binaryName),
    // Parent directory (package root)
    join(currentDir, "..", binaryName),
    // Optional dependency package (installed in node_modules)
    join(currentDir, "..", "..", optionalPackageName, binaryName),
    // CWD (development)
    join(process.cwd(), binaryName),
  ];

  for (const modulePath of possiblePaths) {
    try {
      if (existsSync(modulePath)) {
        return require(modulePath);
      }
    } catch {
      continue;
    }
  }

  // Try requiring the optional package directly (Bun/Node resolution)
  try {
    return require(optionalPackageName);
  } catch {
    // Ignore and fall through to error
  }

  throw new Error(
    `Failed to load native binding for ${platform}-${arch}. ` +
      `Tried: ${possiblePaths.join(", ")}`
  );
}

// Load native bindings
const native = loadNativeBinding();

/**
 * Convert resize filter to napi format
 */
function toNapiFilter(filter?: string): string | undefined {
  if (!filter) return undefined;
  // Convert camelCase to PascalCase for Rust enum
  return filter.charAt(0).toUpperCase() + filter.slice(1);
}

/**
 * Convert fit mode to napi format
 */
function toNapiFit(fit?: string): string | undefined {
  if (!fit) return undefined;
  return fit.charAt(0).toUpperCase() + fit.slice(1);
}

/**
 * Convert resize options to napi format
 */
function toNapiResizeOptions(options: ResizeOptions): NapiResizeOptions {
  return {
    width: options.width,
    height: options.height,
    filter: toNapiFilter(options.filter),
    fit: toNapiFit(options.fit),
    background: options.background,
  };
}

/**
 * Convert format string to Rust enum format
 */
function toNapiFormat(format: string): string {
  const formatMap: Record<string, string> = {
    jpeg: "Jpeg",
    png: "Png",
    webp: "WebP",
    gif: "Gif",
    bmp: "Bmp",
    ico: "Ico",
    tiff: "Tiff",
    heic: "Heic",
    avif: "Avif",
  };
  return formatMap[format.toLowerCase()] || format;
}

/**
 * Convert transform options to napi format
 */
function toNapiTransformOptions(
  options: TransformOptions
): NapiTransformOptions {
  const result: NapiTransformOptions = {};

  if (options.resize) {
    result.resize = toNapiResizeOptions(options.resize);
  }

  if (options.output) {
    result.output = {
      format: toNapiFormat(options.output.format),
      jpeg: options.output.jpeg,
      png: options.output.png,
      webp: options.output.webp,
    };
  }

  result.rotate = options.rotate;
  result.flipH = options.flipH;
  result.flipV = options.flipV;
  result.grayscale = options.grayscale;
  result.blur = options.blur;
  result.sharpen = options.sharpen;
  result.brightness = options.brightness;
  result.contrast = options.contrast;

  return result;
}

// ============================================
// ASYNC FUNCTIONS
// ============================================

/**
 * Get image metadata asynchronously
 *
 * @param input - Image buffer
 * @returns Promise resolving to image metadata
 *
 * @example
 * ```typescript
 * const info = await metadata(imageBuffer);
 * console.log(`${info.width}x${info.height} ${info.format}`);
 * ```
 */
export async function metadata(input: Buffer): Promise<ImageMetadata> {
  return native.metadata(input);
}

/**
 * Resize image asynchronously
 *
 * @param input - Image buffer
 * @param options - Resize options
 * @returns Promise resolving to resized image buffer (PNG)
 *
 * @example
 * ```typescript
 * // Resize to specific dimensions
 * const resized = await resize(imageBuffer, { width: 800, height: 600 });
 *
 * // Resize maintaining aspect ratio
 * const thumb = await resize(imageBuffer, { width: 200 });
 *
 * // High-quality resize
 * const hq = await resize(imageBuffer, {
 *   width: 1920,
 *   filter: 'lanczos3',
 *   fit: 'contain'
 * });
 * ```
 */
export async function resize(
  input: Buffer,
  options: ResizeOptions
): Promise<Buffer> {
  return native.resize(input, toNapiResizeOptions(options));
}

/**
 * Convert image to JPEG asynchronously
 *
 * @param input - Image buffer
 * @param options - JPEG encoding options
 * @returns Promise resolving to JPEG buffer
 *
 * @example
 * ```typescript
 * const jpeg = await toJpeg(imageBuffer, { quality: 85 });
 * ```
 */
export async function toJpeg(
  input: Buffer,
  options?: JpegOptions
): Promise<Buffer> {
  return native.toJpeg(input, options);
}

/**
 * Convert image to PNG asynchronously
 *
 * @param input - Image buffer
 * @param options - PNG encoding options
 * @returns Promise resolving to PNG buffer
 *
 * @example
 * ```typescript
 * const png = await toPng(imageBuffer, { compression: 9 });
 * ```
 */
export async function toPng(
  input: Buffer,
  options?: PngOptions
): Promise<Buffer> {
  return native.toPng(input, options);
}

/**
 * Convert image to WebP asynchronously
 *
 * @param input - Image buffer
 * @param options - WebP encoding options
 * @returns Promise resolving to WebP buffer
 *
 * @example
 * ```typescript
 * // Lossy WebP
 * const webp = await toWebp(imageBuffer, { quality: 80 });
 *
 * // Lossless WebP
 * const lossless = await toWebp(imageBuffer, { lossless: true });
 * ```
 */
export async function toWebp(
  input: Buffer,
  options?: WebPOptions
): Promise<Buffer> {
  return native.toWebp(input, options);
}

/**
 * Transform image with multiple operations asynchronously
 *
 * This is the most efficient way to apply multiple transformations
 * as it processes the image only once.
 *
 * @param input - Image buffer
 * @param options - Transform options
 * @returns Promise resolving to transformed image buffer
 *
 * @example
 * ```typescript
 * const result = await transform(imageBuffer, {
 *   resize: { width: 800, height: 600 },
 *   rotate: 90,
 *   grayscale: true,
 *   output: { format: 'webp', webp: { quality: 85 } }
 * });
 * ```
 */
export async function transform(
  input: Buffer,
  options: TransformOptions
): Promise<Buffer> {
  return native.transform(input, toNapiTransformOptions(options));
}

/**
 * Generate blurhash from image asynchronously
 *
 * Blurhash is a compact representation of a placeholder for an image.
 *
 * @param input - Image buffer
 * @param componentsX - Number of X components (default: 4)
 * @param componentsY - Number of Y components (default: 3)
 * @returns Promise resolving to blurhash result
 *
 * @example
 * ```typescript
 * const { hash, width, height } = await blurhash(imageBuffer);
 * console.log(hash); // "LEHV6nWB2yk8pyo0adR*.7kCMdnj"
 * ```
 */
export async function blurhash(
  input: Buffer,
  componentsX?: number,
  componentsY?: number
): Promise<BlurHashResult> {
  return native.blurhash(input, componentsX, componentsY);
}

// ============================================
// SYNC FUNCTIONS
// ============================================

/**
 * Get image metadata synchronously
 */
export function metadataSync(input: Buffer): ImageMetadata {
  return native.metadataSync(input);
}

/**
 * Resize image synchronously
 */
export function resizeSync(input: Buffer, options: ResizeOptions): Buffer {
  return native.resizeSync(input, toNapiResizeOptions(options));
}

/**
 * Convert image to JPEG synchronously
 */
export function toJpegSync(input: Buffer, options?: JpegOptions): Buffer {
  return native.toJpegSync(input, options);
}

/**
 * Convert image to PNG synchronously
 */
export function toPngSync(input: Buffer, options?: PngOptions): Buffer {
  return native.toPngSync(input, options);
}

/**
 * Convert image to WebP synchronously
 */
export function toWebpSync(input: Buffer, options?: WebPOptions): Buffer {
  return native.toWebpSync(input, options);
}

/**
 * Transform image with multiple operations synchronously
 */
export function transformSync(
  input: Buffer,
  options: TransformOptions
): Buffer {
  return native.transformSync(input, toNapiTransformOptions(options));
}

/**
 * Generate blurhash from image synchronously
 */
export function blurhashSync(
  input: Buffer,
  componentsX?: number,
  componentsY?: number
): BlurHashResult {
  return native.blurhashSync(input, componentsX, componentsY);
}

/**
 * Get library version
 */
export function version(): string {
  return native.version();
}

// Default export for convenience
export default {
  metadata,
  metadataSync,
  resize,
  resizeSync,
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
  version,
};
