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

/** Crop gravity/anchor point */
export type CropGravity =
  | 'center'    // Center of image (default)
  | 'north'     // Top center
  | 'south'     // Bottom center
  | 'east'      // Right center
  | 'west'      // Left center
  | 'northWest' // Top left corner
  | 'northEast' // Top right corner
  | 'southWest' // Bottom left corner
  | 'southEast'; // Bottom right corner

/** Crop options */
export interface CropOptions {
  /** X coordinate of crop origin (left edge) */
  x?: number;
  /** Y coordinate of crop origin (top edge) */
  y?: number;
  /** Width of crop region */
  width?: number;
  /** Height of crop region */
  height?: number;
  /** Aspect ratio string (e.g., "16:9", "1:1", "4:3") */
  aspectRatio?: string;
  /** Gravity/anchor point for aspect ratio or dimension-based cropping */
  gravity?: CropGravity;
}

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

/** ThumbHash result */
export interface ThumbHashResult {
  /** The thumbhash bytes (typically ~25 bytes) */
  hash: Buffer;
  /** Base64 data URL for inline CSS/HTML usage */
  dataUrl: string;
  /** Original width */
  width: number;
  /** Original height */
  height: number;
  /** Whether image has alpha channel */
  hasAlpha: boolean;
}

/** Decoded thumbhash result (RGBA pixels) */
export interface ThumbHashDecodeResult {
  /** RGBA pixel data */
  rgba: Buffer;
  /** Decoded width */
  width: number;
  /** Decoded height */
  height: number;
}

/** EXIF metadata options for writing */
export interface ExifOptions {
  /** Image description / caption / AI prompt */
  imageDescription?: string;
  /** Artist / creator name */
  artist?: string;
  /** Copyright notice */
  copyright?: string;
  /** Software used to create the image */
  software?: string;
  /** Date/time in EXIF format (YYYY:MM:DD HH:MM:SS) */
  dateTime?: string;
  /** Original date/time in EXIF format */
  dateTimeOriginal?: string;
  /** User comment (can contain JSON or other data) */
  userComment?: string;
  /** Camera/device make */
  make?: string;
  /** Camera/device model */
  model?: string;
  /** Orientation (1-8) */
  orientation?: number;
}

/** Transform options (all-in-one processing) */
export interface TransformOptions {
  /** Crop options (applied before resize) */
  crop?: CropOptions;
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
  /** EXIF metadata to write (for JPEG/WebP output) */
  exif?: ExifOptions;
}

/** Native module options (internal) */
export interface NapiCropOptions {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  aspectRatio?: string;
  gravity?: string;
}

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

export interface NapiExifOptions {
  imageDescription?: string;
  artist?: string;
  copyright?: string;
  software?: string;
  dateTime?: string;
  dateTimeOriginal?: string;
  userComment?: string;
  make?: string;
  model?: string;
  orientation?: number;
}

export interface NapiTransformOptions {
  crop?: NapiCropOptions;
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
  exif?: NapiExifOptions;
}

// ============================================
// TENSOR TYPES
// ============================================

/** Tensor data type */
export type TensorDtype = 'Float32' | 'Uint8';

/** Tensor memory layout */
export type TensorLayout = 'Chw' | 'Hwc';

/** Normalization preset */
export type TensorNormalization =
  | 'Imagenet'   // mean=[0.485,0.456,0.406], std=[0.229,0.224,0.225]
  | 'Clip'       // mean=[0.481,0.458,0.408], std=[0.269,0.261,0.276]
  | 'ZeroOne'    // Scale to [0, 1] range
  | 'NegOneOne'  // Scale to [-1, 1] range
  | 'None';      // No normalization (raw 0-255)

/** Tensor conversion options */
export interface TensorOptions {
  /** Output data type (default: Float32) */
  dtype?: TensorDtype;
  /** Memory layout: 'Chw' for PyTorch/ONNX, 'Hwc' for TensorFlow (default: Chw) */
  layout?: TensorLayout;
  /** Normalization preset (default: None) */
  normalization?: TensorNormalization;
  /** Target width for resize before conversion */
  width?: number;
  /** Target height for resize before conversion */
  height?: number;
  /** Add batch dimension (default: false) */
  batch?: boolean;
}

/** Tensor conversion result */
export interface TensorResult {
  /** Raw tensor data as bytes (use toFloat32Array() or toUint8Array() to convert) */
  data: Buffer;
  /** Shape array (e.g., [3, 224, 224] or [1, 3, 224, 224] with batch) */
  shape: number[];
  /** Data type used */
  dtype: TensorDtype;
  /** Memory layout used */
  layout: TensorLayout;
  /** Image width */
  width: number;
  /** Image height */
  height: number;
  /** Number of channels (always 3 for RGB) */
  channels: number;
}

/** Native tensor options (internal) */
export interface NapiTensorOptions {
  dtype?: string;
  layout?: string;
  normalization?: string;
  width?: number;
  height?: number;
  batch?: boolean;
}

// ============================================
// PERCEPTUAL HASH TYPES
// ============================================

/** Perceptual hash algorithm */
export type HashAlgorithm =
  | 'PHash'     // Perceptual hash using DCT (best for most use cases)
  | 'DHash'     // Difference hash using gradients (fast, good for similar images)
  | 'AHash'     // Average hash (fastest, least robust)
  | 'BlockHash'; // Block hash (good balance of speed and accuracy)

/** Hash size (dimensions of the hash grid) */
export type HashSize =
  | 'Size8'   // 8x8 hash (64 bits) - fastest, good for most cases
  | 'Size16'  // 16x16 hash (256 bits) - more accurate
  | 'Size32'; // 32x32 hash (1024 bits) - highest accuracy

/** Perceptual hash options */
export interface ImageHashOptions {
  /** Hash algorithm (default: PHash) */
  algorithm?: HashAlgorithm;
  /** Hash size (default: Size8) */
  size?: HashSize;
}

/** Perceptual hash result */
export interface ImageHashResult {
  /** The hash as a base64-encoded string */
  hash: string;
  /** Original image width */
  width: number;
  /** Original image height */
  height: number;
  /** Hash size used (8, 16, or 32) */
  hashSize: number;
  /** Algorithm used */
  algorithm: string;
}

// ============================================
// SMART CROP TYPES
// ============================================

/** Common aspect ratios for smart crop */
export type AspectRatio =
  | '1:1'     // Square (Instagram, profile pics)
  | '16:9'   // Landscape (YouTube, Twitter)
  | '9:16'   // Portrait (Stories, TikTok)
  | '4:3'    // Classic photo
  | '3:2'    // DSLR standard
  | '21:9'   // Ultrawide
  | string;  // Custom ratio like "5:4"

/** Boost region for smart crop (prioritize specific areas) */
export interface SmartCropBoostRegion {
  /** X coordinate of the region */
  x: number;
  /** Y coordinate of the region */
  y: number;
  /** Width of the region */
  width: number;
  /** Height of the region */
  height: number;
  /** Weight of the boost (0.0 - 1.0) */
  weight: number;
}

/** Smart crop options */
export interface SmartCropOptions {
  /** Target width */
  width?: number;
  /** Target height */
  height?: number;
  /** Aspect ratio string (e.g., "16:9", "1:1", "4:3") */
  aspectRatio?: AspectRatio;
  /** Boost regions (areas to prioritize) */
  boost?: SmartCropBoostRegion[];
}

/** Smart crop analysis result (crop coordinates without actual cropping) */
export interface SmartCropAnalysis {
  /** X coordinate of the best crop */
  x: number;
  /** Y coordinate of the best crop */
  y: number;
  /** Width of the best crop */
  width: number;
  /** Height of the best crop */
  height: number;
  /** Score of the best crop (higher is better) */
  score: number;
}

// ============================================
// DOMINANT COLOR TYPES
// ============================================

/** A single dominant color */
export interface DominantColor {
  /** Red component (0-255) */
  r: number;
  /** Green component (0-255) */
  g: number;
  /** Blue component (0-255) */
  b: number;
  /** Hex color string (e.g., "#FF5733") */
  hex: string;
}

/** Dominant colors extraction result */
export interface DominantColorsResult {
  /** Array of dominant colors (sorted by prominence) */
  colors: DominantColor[];
  /** The most dominant color (same as colors[0]) */
  primary: DominantColor;
}
