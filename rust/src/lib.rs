//! bun-image-turbo - High-performance image processing for Bun and Node.js
//!
//! Built with Rust for maximum performance.

use napi::bindgen_prelude::*;
use napi_derive::napi;

mod resize;
mod encode;
mod decode;
mod transform;
mod error;

use error::ImageError;

/// Image format enum
#[napi(string_enum)]
pub enum ImageFormat {
  Jpeg,
  Png,
  WebP,
  Gif,
  Bmp,
  Ico,
  Tiff,
  Heic,
  Avif,
}

/// Resize filter/algorithm
#[napi(string_enum)]
pub enum ResizeFilter {
  /// Nearest neighbor - fastest, lowest quality
  Nearest,
  /// Bilinear - fast, good quality
  Bilinear,
  /// Catmull-Rom - balanced speed and quality
  CatmullRom,
  /// Mitchell - good for downscaling
  Mitchell,
  /// Lanczos3 - highest quality, slower
  Lanczos3,
}

/// Image fit mode for resize
#[napi(string_enum)]
pub enum FitMode {
  /// Resize to cover the target dimensions (may crop)
  Cover,
  /// Resize to fit within target dimensions (may have padding)
  Contain,
  /// Resize to exact dimensions (may distort)
  Fill,
  /// Resize only if larger than target
  Inside,
  /// Resize only if smaller than target
  Outside,
}

/// Resize options
#[napi(object)]
#[derive(Clone)]
pub struct ResizeOptions {
  /// Target width (optional if height is provided)
  pub width: Option<u32>,
  /// Target height (optional if width is provided)
  pub height: Option<u32>,
  /// Resize filter/algorithm (default: Lanczos3)
  pub filter: Option<ResizeFilter>,
  /// Fit mode (default: Cover)
  pub fit: Option<FitMode>,
  /// Background color for padding [r, g, b, a] (default: transparent)
  pub background: Option<Vec<u8>>,
}

/// JPEG encode options
#[napi(object)]
#[derive(Clone)]
pub struct JpegOptions {
  /// Quality 1-100 (default: 80)
  pub quality: Option<u8>,
}

/// PNG encode options
#[napi(object)]
#[derive(Clone)]
pub struct PngOptions {
  /// Compression level 0-9 (default: 6)
  pub compression: Option<u8>,
}

/// WebP encode options
#[napi(object)]
#[derive(Clone)]
pub struct WebPOptions {
  /// Quality 1-100 for lossy, ignored for lossless (default: 80)
  pub quality: Option<u8>,
  /// Use lossless compression (default: false)
  pub lossless: Option<bool>,
}

/// Output format options
#[napi(object)]
#[derive(Clone)]
pub struct OutputOptions {
  /// Output format
  pub format: ImageFormat,
  /// JPEG options (if format is JPEG)
  pub jpeg: Option<JpegOptions>,
  /// PNG options (if format is PNG)
  pub png: Option<PngOptions>,
  /// WebP options (if format is WebP)
  pub webp: Option<WebPOptions>,
}

/// Image metadata (similar to sharp's output)
#[napi(object)]
pub struct ImageMetadata {
  /// Image width in pixels
  pub width: u32,
  /// Image height in pixels
  pub height: u32,
  /// Detected format (jpeg, png, webp, gif, bmp, ico, tiff)
  pub format: String,
  /// File size in bytes (if available)
  pub size: Option<u32>,
  /// Color space (srgb, rgb, grayscale)
  pub space: String,
  /// Number of channels (1, 2, 3, or 4)
  pub channels: u8,
  /// Bit depth per sample (uchar = 8-bit)
  pub depth: String,
  /// Whether the image has an alpha channel
  pub has_alpha: bool,
  /// Bits per sample
  pub bits_per_sample: u8,
  /// Whether the image is progressive (JPEG) or interlaced (PNG)
  pub is_progressive: bool,
  /// Whether the image uses palette/indexed colors (PNG/GIF)
  pub is_palette: bool,
  /// Whether the image has an embedded ICC profile
  pub has_profile: bool,
  /// EXIF orientation value (1-8, if present)
  pub orientation: Option<u8>,
  /// Page/frame count for multi-page images (GIF, TIFF)
  pub pages: Option<u32>,
  /// Loop count for animated images
  pub loop_count: Option<u32>,
  /// Delay between frames in ms (for animated images)
  pub delay: Option<Vec<u32>>,
  /// Background color (for GIF)
  pub background: Option<Vec<u8>>,
  /// Compression type used
  pub compression: Option<String>,
  /// Density/DPI info
  pub density: Option<u32>,
}

/// Raw hash result for blurhash
#[napi(object)]
pub struct BlurHashResult {
  /// The blurhash string
  pub hash: String,
  /// Original width
  pub width: u32,
  /// Original height
  pub height: u32,
}

/// Transform options (all-in-one processing)
#[napi(object)]
#[derive(Clone)]
pub struct TransformOptions {
  /// Resize options
  pub resize: Option<ResizeOptions>,
  /// Output options
  pub output: Option<OutputOptions>,
  /// Rotate degrees (90, 180, 270)
  pub rotate: Option<i32>,
  /// Flip horizontally
  pub flip_h: Option<bool>,
  /// Flip vertically
  pub flip_v: Option<bool>,
  /// Grayscale conversion
  pub grayscale: Option<bool>,
  /// Blur radius (0-100) - use integer, will be converted to float internally
  pub blur: Option<u32>,
  /// Sharpen amount (0-100) - use integer, will be converted to float internally
  pub sharpen: Option<u32>,
  /// Brightness adjustment (-100 to 100)
  pub brightness: Option<i32>,
  /// Contrast adjustment (-100 to 100)
  pub contrast: Option<i32>,
}

// ============================================
// SYNC FUNCTIONS
// ============================================

/// Get image metadata synchronously
#[napi]
pub fn metadata_sync(input: Buffer) -> Result<ImageMetadata> {
  decode::get_metadata(&input).map_err(|e| e.into())
}

/// Resize image synchronously - uses scale-on-decode for JPEG optimization
#[napi]
pub fn resize_sync(input: Buffer, options: ResizeOptions) -> Result<Buffer> {
  // Use scale-on-decode for JPEG images - massive speedup for large images
  let img = decode::decode_image_with_target(&input, options.width, options.height)?;
  let resized = resize::resize_image(&img, &options)?;

  // Default to PNG for resize output
  let output = encode::encode_png(&resized, None)?;
  Ok(Buffer::from(output))
}

/// Convert image to JPEG synchronously
#[napi]
pub fn to_jpeg_sync(input: Buffer, options: Option<JpegOptions>) -> Result<Buffer> {
  let img = decode::decode_image(&input)?;
  let output = encode::encode_jpeg(&img, options.as_ref())?;
  Ok(Buffer::from(output))
}

/// Convert image to PNG synchronously
#[napi]
pub fn to_png_sync(input: Buffer, options: Option<PngOptions>) -> Result<Buffer> {
  let img = decode::decode_image(&input)?;
  let output = encode::encode_png(&img, options.as_ref())?;
  Ok(Buffer::from(output))
}

/// Convert image to WebP synchronously
#[napi]
pub fn to_webp_sync(input: Buffer, options: Option<WebPOptions>) -> Result<Buffer> {
  let img = decode::decode_image(&input)?;
  let output = encode::encode_webp(&img, options.as_ref())?;
  Ok(Buffer::from(output))
}

/// Transform image with multiple operations synchronously
#[napi]
pub fn transform_sync(input: Buffer, options: TransformOptions) -> Result<Buffer> {
  transform::transform_image(&input, &options).map_err(|e| e.into())
}

/// Generate blurhash from image synchronously
#[napi]
pub fn blurhash_sync(input: Buffer, components_x: Option<u32>, components_y: Option<u32>) -> Result<BlurHashResult> {
  let img = decode::decode_image(&input)?;
  let cx = components_x.unwrap_or(4) as u32;
  let cy = components_y.unwrap_or(3) as u32;

  let rgba = img.to_rgba8();
  let (w, h) = image::GenericImageView::dimensions(&rgba);

  let hash = blurhash::encode(cx, cy, w, h, rgba.as_raw())
    .map_err(|e| Error::from_reason(format!("Blurhash error: {}", e)))?;

  Ok(BlurHashResult {
    hash,
    width: w,
    height: h,
  })
}

// ============================================
// ASYNC FUNCTIONS
// ============================================

/// Get image metadata asynchronously
#[napi]
pub async fn metadata(input: Buffer) -> Result<ImageMetadata> {
  tokio::task::spawn_blocking(move || {
    decode::get_metadata(&input)
  })
  .await
  .map_err(|e| Error::from_reason(format!("Task error: {}", e)))?
  .map_err(|e| e.into())
}

/// Resize image asynchronously - uses scale-on-decode for JPEG optimization
#[napi]
pub async fn resize(input: Buffer, options: ResizeOptions) -> Result<Buffer> {
  tokio::task::spawn_blocking(move || {
    // Use scale-on-decode for JPEG images - massive speedup for large images
    let img = decode::decode_image_with_target(&input, options.width, options.height)?;
    let resized = resize::resize_image(&img, &options)?;
    let output = encode::encode_png(&resized, None)?;
    Ok::<Buffer, ImageError>(Buffer::from(output))
  })
  .await
  .map_err(|e| Error::from_reason(format!("Task error: {}", e)))?
  .map_err(|e| e.into())
}

/// Convert image to JPEG asynchronously
#[napi]
pub async fn to_jpeg(input: Buffer, options: Option<JpegOptions>) -> Result<Buffer> {
  tokio::task::spawn_blocking(move || {
    let img = decode::decode_image(&input)?;
    let output = encode::encode_jpeg(&img, options.as_ref())?;
    Ok::<Buffer, ImageError>(Buffer::from(output))
  })
  .await
  .map_err(|e| Error::from_reason(format!("Task error: {}", e)))?
  .map_err(|e| e.into())
}

/// Convert image to PNG asynchronously
#[napi]
pub async fn to_png(input: Buffer, options: Option<PngOptions>) -> Result<Buffer> {
  tokio::task::spawn_blocking(move || {
    let img = decode::decode_image(&input)?;
    let output = encode::encode_png(&img, options.as_ref())?;
    Ok::<Buffer, ImageError>(Buffer::from(output))
  })
  .await
  .map_err(|e| Error::from_reason(format!("Task error: {}", e)))?
  .map_err(|e| e.into())
}

/// Convert image to WebP asynchronously
#[napi]
pub async fn to_webp(input: Buffer, options: Option<WebPOptions>) -> Result<Buffer> {
  tokio::task::spawn_blocking(move || {
    let img = decode::decode_image(&input)?;
    let output = encode::encode_webp(&img, options.as_ref())?;
    Ok::<Buffer, ImageError>(Buffer::from(output))
  })
  .await
  .map_err(|e| Error::from_reason(format!("Task error: {}", e)))?
  .map_err(|e| e.into())
}

/// Transform image with multiple operations asynchronously
#[napi]
pub async fn transform(input: Buffer, options: TransformOptions) -> Result<Buffer> {
  tokio::task::spawn_blocking(move || {
    transform::transform_image(&input, &options)
  })
  .await
  .map_err(|e| Error::from_reason(format!("Task error: {}", e)))?
  .map_err(|e| e.into())
}

/// Generate blurhash from image asynchronously
#[napi]
pub async fn blurhash(input: Buffer, components_x: Option<u32>, components_y: Option<u32>) -> Result<BlurHashResult> {
  tokio::task::spawn_blocking(move || {
    let img = decode::decode_image(&input)?;
    let cx = components_x.unwrap_or(4) as u32;
    let cy = components_y.unwrap_or(3) as u32;

    let rgba = img.to_rgba8();
    let (w, h) = image::GenericImageView::dimensions(&rgba);

    let hash = blurhash::encode(cx, cy, w, h, rgba.as_raw())
      .map_err(|e| ImageError::ProcessingError(format!("Blurhash error: {}", e)))?;

    Ok::<BlurHashResult, ImageError>(BlurHashResult {
      hash,
      width: w,
      height: h,
    })
  })
  .await
  .map_err(|e| Error::from_reason(format!("Task error: {}", e)))?
  .map_err(|e| e.into())
}

/// Get library version
#[napi]
pub fn version() -> String {
  env!("CARGO_PKG_VERSION").to_string()
}
