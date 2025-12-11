/**
 * bun-image-turbo Types
 */

/** Supported image formats */
export type ImageFormat = 'jpeg' | 'png' | 'webp' | 'gif' | 'bmp' | 'ico' | 'tiff' | 'heic' | 'avif';

/** Resize filter/algorithm */
export type ResizeFilter =
  | 'nearest'   // Fastest, lowest quality
  | 'bilinear'  // Fast, good quality
  | 'catmullRom' // Balanced speed and quality
  | 'mitchell'  // Good for downscaling
  | 'lanczos3'; // Highest quality, slower

/** Image fit mode for resize */
export type FitMode =
  | 'cover'   // Resize to cover target dimensions (may crop)
  | 'contain' // Resize to fit within target (may have padding)
  | 'fill'    // Resize to exact dimensions (may distort)
  | 'inside'  // Resize only if larger than target
  | 'outside'; // Resize only if smaller than target

/** Resize options */
export interface ResizeOptions {
  /** Target width (optional if height is provided) */
  width?: number;
  /** Target height (optional if width is provided) */
  height?: number;
  /** Resize filter/algorithm (default: lanczos3) */
  filter?: ResizeFilter;
  /** Fit mode (default: cover) */
  fit?: FitMode;
  /** Background color for padding [r, g, b, a] (default: transparent) */
  background?: number[];
}

/** JPEG encode options */
export interface JpegOptions {
  /** Quality 1-100 (default: 80) */
  quality?: number;
}

/** PNG encode options */
export interface PngOptions {
  /** Compression level 0-9 (default: 6) */
  compression?: number;
}

/** WebP encode options */
export interface WebPOptions {
  /** Quality 1-100 for lossy, ignored for lossless (default: 80) */
  quality?: number;
  /** Use lossless compression (default: false) */
  lossless?: boolean;
}

/** AVIF encode options */
export interface AvifOptions {
  /** Quality 1-100 (default: 80) */
  quality?: number;
  /** Speed 1-10, higher is faster but lower quality (default: 6) */
  speed?: number;
}

/** Output format options */
export interface OutputOptions {
  /** Output format */
  format: ImageFormat;
  /** JPEG options (if format is jpeg) */
  jpeg?: JpegOptions;
  /** PNG options (if format is png) */
  png?: PngOptions;
  /** WebP options (if format is webp) */
  webp?: WebPOptions;
  /** AVIF options (if format is avif) */
  avif?: AvifOptions;
}

/** Image metadata (sharp-compatible) */
export interface ImageMetadata {
  /** Image width in pixels */
  width: number;
  /** Image height in pixels */
  height: number;
  /** Detected format (jpeg, png, webp, gif, bmp, ico, tiff) */
  format: string;
  /** File size in bytes */
  size?: number;
  /** Color space (srgb, rgb, grayscale) */
  space: string;
  /** Number of channels (1, 2, 3, or 4) */
  channels: number;
  /** Bit depth per sample (uchar = 8-bit, ushort = 16-bit) */
  depth: string;
  /** Whether the image has an alpha channel */
  hasAlpha: boolean;
  /** Bits per sample */
  bitsPerSample: number;
  /** Whether the image is progressive (JPEG) or interlaced (PNG) */
  isProgressive: boolean;
  /** Whether the image uses palette/indexed colors (PNG/GIF) */
  isPalette: boolean;
  /** Whether the image has an embedded ICC profile */
  hasProfile: boolean;
  /** EXIF orientation value (1-8, if present) */
  orientation?: number;
  /** Page/frame count for multi-page images (GIF, TIFF) */
  pages?: number;
  /** Loop count for animated images */
  loopCount?: number;
  /** Delay between frames in ms (for animated images) */
  delay?: number[];
  /** Background color (for GIF) */
  background?: number[];
  /** Compression type used */
  compression?: string;
  /** Density/DPI info */
  density?: number;
}

/** Blurhash result */
export interface BlurHashResult {
  /** The blurhash string */
  hash: string;
  /** Original width */
  width: number;
  /** Original height */
  height: number;
}

/** Transform options (all-in-one processing) */
export interface TransformOptions {
  /** Resize options */
  resize?: ResizeOptions;
  /** Output options */
  output?: OutputOptions;
  /** Rotate degrees (90, 180, 270) */
  rotate?: number;
  /** Flip horizontally */
  flipH?: boolean;
  /** Flip vertically */
  flipV?: boolean;
  /** Grayscale conversion */
  grayscale?: boolean;
  /** Blur radius (0-100) */
  blur?: number;
  /** Sharpen amount (0-100) */
  sharpen?: number;
  /** Brightness adjustment (-100 to 100) */
  brightness?: number;
  /** Contrast adjustment (-100 to 100) */
  contrast?: number;
}

/** Native module options (internal) */
export interface NapiResizeOptions {
  width?: number;
  height?: number;
  filter?: string;
  fit?: string;
  background?: number[];
}

export interface NapiOutputOptions {
  format: string;
  jpeg?: JpegOptions;
  png?: PngOptions;
  webp?: WebPOptions;
  avif?: AvifOptions;
}

export interface NapiTransformOptions {
  resize?: NapiResizeOptions;
  output?: NapiOutputOptions;
  rotate?: number;
  flipH?: boolean;
  flipV?: boolean;
  grayscale?: boolean;
  blur?: number;
  sharpen?: number;
  brightness?: number;
  contrast?: number;
}
