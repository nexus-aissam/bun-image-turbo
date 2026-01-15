//! bun-image-turbo - High-performance image processing for Bun and Node.js
//!
//! Built with Rust for maximum performance.

use napi::bindgen_prelude::*;
use napi_derive::napi;

// Internal modules
mod crop;
mod decode;
mod encode;
mod error;
mod metadata;
mod metadata_write;
mod resize;
mod tensor;
mod transform;

// Public types module
pub mod types;
pub use types::*;

use error::ImageError;

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
  let resized = resize::resize_image(img, &options)?;

  // Default to PNG for resize output
  let output = encode::encode_png(&resized, None)?;
  Ok(Buffer::from(output))
}

/// Crop image synchronously - zero-copy operation
#[napi]
pub fn crop_sync(input: Buffer, options: CropOptions) -> Result<Buffer> {
  let img = decode::decode_image(&input)?;
  let cropped = crop::crop_image(img, &options)?;
  let output = encode::encode_png(&cropped, None)?;
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

/// Generate thumbhash from image synchronously
/// ThumbHash produces smoother placeholders with alpha support and aspect ratio preservation
/// Note: Images are automatically resized to max 100x100 as required by ThumbHash algorithm
/// OPTIMIZED: Uses shrink-on-load to decode directly at reduced resolution (3x faster)
#[napi]
pub fn thumbhash_sync(input: Buffer) -> Result<ThumbHashResult> {
  // First get original dimensions from metadata (fast header-only read)
  let meta = decode::get_metadata(&input)?;
  let orig_w = meta.width;
  let orig_h = meta.height;
  let has_alpha = meta.has_alpha;

  // Calculate target size for ThumbHash (max 100x100, preserve aspect ratio)
  let (thumb_w, thumb_h) = if orig_w > 100 || orig_h > 100 {
    let scale = 100.0 / (orig_w.max(orig_h) as f32);
    (
      ((orig_w as f32 * scale).round() as u32).max(1),
      ((orig_h as f32 * scale).round() as u32).max(1),
    )
  } else {
    (orig_w, orig_h)
  };

  // OPTIMIZATION: Use shrink-on-load to decode at target size
  // This is 3x faster than decode-then-resize for large images
  let img = decode::decode_image_with_target(&input, Some(thumb_w), Some(thumb_h))?;
  let (actual_w, actual_h) = image::GenericImageView::dimensions(&img);

  let rgba = img.to_rgba8();
  let hash = thumbhash::rgba_to_thumb_hash(actual_w as usize, actual_h as usize, rgba.as_raw());

  Ok(ThumbHashResult {
    hash,
    width: orig_w,
    height: orig_h,
    has_alpha,
  })
}

// ============================================
// PERCEPTUAL HASH SYNC FUNCTIONS
// ============================================

/// Generate perceptual hash from image synchronously
/// Use for duplicate detection, content moderation, reverse image search
#[napi]
pub fn image_hash_sync(
  input: Buffer,
  algorithm: Option<HashAlgorithm>,
  size: Option<HashSize>,
) -> Result<ImageHashResult> {
  use image_hasher::{HasherConfig, HashAlg};

  let img = decode::decode_image(&input)?;
  let (w, h) = image::GenericImageView::dimensions(&img);

  let hash_size = match size.unwrap_or(HashSize::Size8) {
    HashSize::Size8 => 8,
    HashSize::Size16 => 16,
    HashSize::Size32 => 32,
  };

  let alg_enum = algorithm.clone().unwrap_or(HashAlgorithm::PHash);
  let alg = match &alg_enum {
    HashAlgorithm::PHash => HashAlg::Gradient,
    HashAlgorithm::DHash => HashAlg::DoubleGradient,
    HashAlgorithm::AHash => HashAlg::Mean,
    HashAlgorithm::BlockHash => HashAlg::Blockhash,
  };

  let hasher = HasherConfig::new()
    .hash_size(hash_size, hash_size)
    .hash_alg(alg)
    .to_hasher();

  let hash = hasher.hash_image(&img);

  let alg_name = match alg_enum {
    HashAlgorithm::PHash => "PHash",
    HashAlgorithm::DHash => "DHash",
    HashAlgorithm::AHash => "AHash",
    HashAlgorithm::BlockHash => "BlockHash",
  };

  Ok(ImageHashResult {
    hash: hash.to_base64(),
    width: w,
    height: h,
    hash_size,
    algorithm: alg_name.to_string(),
  })
}

/// Calculate hamming distance between two perceptual hashes synchronously
/// Returns 0 for identical images, higher values for more different images
/// Typical thresholds: <5 = very similar, <10 = similar, >10 = different
#[napi]
pub fn image_hash_distance_sync(hash1: String, hash2: String) -> Result<u32> {
  use image_hasher::ImageHash;

  let h1: ImageHash<Vec<u8>> = ImageHash::from_base64(&hash1)
    .map_err(|e| Error::from_reason(format!("Invalid hash1: {:?}", e)))?;
  let h2: ImageHash<Vec<u8>> = ImageHash::from_base64(&hash2)
    .map_err(|e| Error::from_reason(format!("Invalid hash2: {:?}", e)))?;

  Ok(h1.dist(&h2))
}

/// Decode thumbhash back to RGBA pixels synchronously
#[napi]
pub fn thumbhash_to_rgba_sync(hash: Buffer) -> Result<ThumbHashDecodeResult> {
  let (w, h, rgba) = thumbhash::thumb_hash_to_rgba(&hash)
    .map_err(|_| Error::from_reason("Invalid thumbhash data"))?;

  Ok(ThumbHashDecodeResult {
    rgba,
    width: w as u32,
    height: h as u32,
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
    let resized = resize::resize_image(img, &options)?;
    let output = encode::encode_png(&resized, None)?;
    Ok::<Buffer, ImageError>(Buffer::from(output))
  })
  .await
  .map_err(|e| Error::from_reason(format!("Task error: {}", e)))?
  .map_err(|e| e.into())
}

/// Crop image asynchronously - zero-copy operation
#[napi]
pub async fn crop(input: Buffer, options: CropOptions) -> Result<Buffer> {
  tokio::task::spawn_blocking(move || {
    let img = decode::decode_image(&input)?;
    let cropped = crop::crop_image(img, &options)?;
    let output = encode::encode_png(&cropped, None)?;
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

/// Generate thumbhash from image asynchronously
/// ThumbHash produces smoother placeholders with alpha support and aspect ratio preservation
/// Note: Images are automatically resized to max 100x100 as required by ThumbHash algorithm
/// OPTIMIZED: Uses shrink-on-load to decode directly at reduced resolution (3x faster)
#[napi]
pub async fn thumbhash(input: Buffer) -> Result<ThumbHashResult> {
  tokio::task::spawn_blocking(move || {
    // First get original dimensions from metadata (fast header-only read)
    let meta = decode::get_metadata(&input)?;
    let orig_w = meta.width;
    let orig_h = meta.height;
    let has_alpha = meta.has_alpha;

    // Calculate target size for ThumbHash (max 100x100, preserve aspect ratio)
    let (thumb_w, thumb_h) = if orig_w > 100 || orig_h > 100 {
      let scale = 100.0 / (orig_w.max(orig_h) as f32);
      (
        ((orig_w as f32 * scale).round() as u32).max(1),
        ((orig_h as f32 * scale).round() as u32).max(1),
      )
    } else {
      (orig_w, orig_h)
    };

    // OPTIMIZATION: Use shrink-on-load to decode at target size
    // This is 3x faster than decode-then-resize for large images
    let img = decode::decode_image_with_target(&input, Some(thumb_w), Some(thumb_h))?;
    let (actual_w, actual_h) = image::GenericImageView::dimensions(&img);

    let rgba = img.to_rgba8();
    let hash = thumbhash::rgba_to_thumb_hash(actual_w as usize, actual_h as usize, rgba.as_raw());

    Ok::<ThumbHashResult, ImageError>(ThumbHashResult {
      hash,
      width: orig_w,
      height: orig_h,
      has_alpha,
    })
  })
  .await
  .map_err(|e| Error::from_reason(format!("Task error: {}", e)))?
  .map_err(|e| e.into())
}

/// Decode thumbhash back to RGBA pixels asynchronously
#[napi]
pub async fn thumbhash_to_rgba(hash: Buffer) -> Result<ThumbHashDecodeResult> {
  tokio::task::spawn_blocking(move || {
    let (w, h, rgba) = thumbhash::thumb_hash_to_rgba(&hash)
      .map_err(|_| ImageError::ProcessingError("Invalid thumbhash data".to_string()))?;

    Ok::<ThumbHashDecodeResult, ImageError>(ThumbHashDecodeResult {
      rgba,
      width: w as u32,
      height: h as u32,
    })
  })
  .await
  .map_err(|e| Error::from_reason(format!("Task error: {}", e)))?
  .map_err(|e| e.into())
}

// ============================================
// PERCEPTUAL HASH ASYNC FUNCTIONS
// ============================================

/// Generate perceptual hash from image asynchronously
/// Use for duplicate detection, content moderation, reverse image search
#[napi]
pub async fn image_hash(
  input: Buffer,
  algorithm: Option<HashAlgorithm>,
  size: Option<HashSize>,
) -> Result<ImageHashResult> {
  tokio::task::spawn_blocking(move || {
    use image_hasher::{HasherConfig, HashAlg};

    let img = decode::decode_image(&input)?;
    let (w, h) = image::GenericImageView::dimensions(&img);

    let hash_size = match size.unwrap_or(HashSize::Size8) {
      HashSize::Size8 => 8,
      HashSize::Size16 => 16,
      HashSize::Size32 => 32,
    };

    let alg_enum = algorithm.clone().unwrap_or(HashAlgorithm::PHash);
    let alg = match &alg_enum {
      HashAlgorithm::PHash => HashAlg::Gradient,
      HashAlgorithm::DHash => HashAlg::DoubleGradient,
      HashAlgorithm::AHash => HashAlg::Mean,
      HashAlgorithm::BlockHash => HashAlg::Blockhash,
    };

    let hasher = HasherConfig::new()
      .hash_size(hash_size, hash_size)
      .hash_alg(alg)
      .to_hasher();

    let hash = hasher.hash_image(&img);

    let alg_name = match alg_enum {
      HashAlgorithm::PHash => "PHash",
      HashAlgorithm::DHash => "DHash",
      HashAlgorithm::AHash => "AHash",
      HashAlgorithm::BlockHash => "BlockHash",
    };

    Ok::<ImageHashResult, ImageError>(ImageHashResult {
      hash: hash.to_base64(),
      width: w,
      height: h,
      hash_size,
      algorithm: alg_name.to_string(),
    })
  })
  .await
  .map_err(|e| Error::from_reason(format!("Task error: {}", e)))?
  .map_err(|e| e.into())
}

/// Calculate hamming distance between two perceptual hashes asynchronously
/// Returns 0 for identical images, higher values for more different images
/// Typical thresholds: <5 = very similar, <10 = similar, >10 = different
#[napi]
pub async fn image_hash_distance(hash1: String, hash2: String) -> Result<u32> {
  tokio::task::spawn_blocking(move || {
    use image_hasher::ImageHash;

    let h1: ImageHash<Vec<u8>> = ImageHash::from_base64(&hash1)
      .map_err(|e| ImageError::ProcessingError(format!("Invalid hash1: {:?}", e)))?;
    let h2: ImageHash<Vec<u8>> = ImageHash::from_base64(&hash2)
      .map_err(|e| ImageError::ProcessingError(format!("Invalid hash2: {:?}", e)))?;

    Ok::<u32, ImageError>(h1.dist(&h2))
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

// ============================================
// SMART CROP FUNCTIONS
// ============================================

/// Helper function to parse aspect ratio string (e.g., "16:9") to (width, height)
fn parse_aspect_ratio(ratio: &str) -> std::result::Result<(u32, u32), String> {
  let parts: Vec<&str> = ratio.split(':').collect();
  if parts.len() != 2 {
    return Err(format!("Invalid aspect ratio format: {}. Use format like '16:9'", ratio));
  }
  let w = parts[0].trim().parse::<u32>()
    .map_err(|_| format!("Invalid width in aspect ratio: {}", parts[0]))?;
  let h = parts[1].trim().parse::<u32>()
    .map_err(|_| format!("Invalid height in aspect ratio: {}", parts[1]))?;
  if w == 0 || h == 0 {
    return Err("Aspect ratio values must be greater than 0".to_string());
  }
  Ok((w, h))
}

/// Analyze image and find the best crop region using content-aware detection
/// Returns crop coordinates without actually cropping the image
#[napi]
pub fn smart_crop_analyze_sync(
  input: Buffer,
  options: SmartCropOptions,
) -> Result<SmartCropAnalysis> {
  let img = decode::decode_image(&input)?;
  let (img_w, img_h) = image::GenericImageView::dimensions(&img);

  // Determine target dimensions
  let (target_w, target_h) = if let Some(ref ratio) = options.aspect_ratio {
    // Calculate dimensions from aspect ratio
    let (ratio_w, ratio_h) = parse_aspect_ratio(ratio)
      .map_err(|e| Error::from_reason(e))?;

    // Calculate the largest crop that fits the aspect ratio
    let scale_w = img_w as f64 / ratio_w as f64;
    let scale_h = img_h as f64 / ratio_h as f64;
    let scale = scale_w.min(scale_h);

    ((ratio_w as f64 * scale) as u32, (ratio_h as f64 * scale) as u32)
  } else {
    // Use explicit width/height
    let w = options.width.unwrap_or(img_w);
    let h = options.height.unwrap_or(img_h);
    (w.min(img_w), h.min(img_h))
  };

  // Convert to RGB for smartcrop analysis
  let rgb_img = img.to_rgb8();

  // Find best crop using smartcrop2
  let result = smartcrop::find_best_crop(
    &rgb_img,
    std::num::NonZeroU32::new(target_w).ok_or_else(|| Error::from_reason("Target width must be > 0"))?,
    std::num::NonZeroU32::new(target_h).ok_or_else(|| Error::from_reason("Target height must be > 0"))?,
  ).map_err(|e| Error::from_reason(format!("Smart crop analysis failed: {:?}", e)))?;

  Ok(SmartCropAnalysis {
    x: result.crop.x,
    y: result.crop.y,
    width: result.crop.width,
    height: result.crop.height,
    score: result.score.total,
  })
}

/// Analyze image and find the best crop region asynchronously
#[napi]
pub async fn smart_crop_analyze(
  input: Buffer,
  options: SmartCropOptions,
) -> Result<SmartCropAnalysis> {
  tokio::task::spawn_blocking(move || {
    let img = decode::decode_image(&input)?;
    let (img_w, img_h) = image::GenericImageView::dimensions(&img);

    // Determine target dimensions
    let (target_w, target_h) = if let Some(ref ratio) = options.aspect_ratio {
      let (ratio_w, ratio_h) = parse_aspect_ratio(ratio)
        .map_err(|e| ImageError::ProcessingError(e))?;

      let scale_w = img_w as f64 / ratio_w as f64;
      let scale_h = img_h as f64 / ratio_h as f64;
      let scale = scale_w.min(scale_h);

      ((ratio_w as f64 * scale) as u32, (ratio_h as f64 * scale) as u32)
    } else {
      let w = options.width.unwrap_or(img_w);
      let h = options.height.unwrap_or(img_h);
      (w.min(img_w), h.min(img_h))
    };

    let rgb_img = img.to_rgb8();

    let result = smartcrop::find_best_crop(
      &rgb_img,
      std::num::NonZeroU32::new(target_w).ok_or_else(|| ImageError::ProcessingError("Target width must be > 0".to_string()))?,
      std::num::NonZeroU32::new(target_h).ok_or_else(|| ImageError::ProcessingError("Target height must be > 0".to_string()))?,
    ).map_err(|e| ImageError::ProcessingError(format!("Smart crop analysis failed: {:?}", e)))?;

    Ok::<SmartCropAnalysis, ImageError>(SmartCropAnalysis {
      x: result.crop.x,
      y: result.crop.y,
      width: result.crop.width,
      height: result.crop.height,
      score: result.score.total,
    })
  })
  .await
  .map_err(|e| Error::from_reason(format!("Task error: {}", e)))?
  .map_err(|e| e.into())
}

/// Smart crop an image using content-aware detection synchronously
/// Automatically finds the most interesting region and crops to it
#[napi]
pub fn smart_crop_sync(
  input: Buffer,
  options: SmartCropOptions,
) -> Result<Buffer> {
  let img = decode::decode_image(&input)?;
  let (img_w, img_h) = image::GenericImageView::dimensions(&img);

  // Determine target dimensions
  let (target_w, target_h) = if let Some(ref ratio) = options.aspect_ratio {
    let (ratio_w, ratio_h) = parse_aspect_ratio(ratio)
      .map_err(|e| Error::from_reason(e))?;

    let scale_w = img_w as f64 / ratio_w as f64;
    let scale_h = img_h as f64 / ratio_h as f64;
    let scale = scale_w.min(scale_h);

    ((ratio_w as f64 * scale) as u32, (ratio_h as f64 * scale) as u32)
  } else {
    let w = options.width.unwrap_or(img_w);
    let h = options.height.unwrap_or(img_h);
    (w.min(img_w), h.min(img_h))
  };

  let rgb_img = img.to_rgb8();

  let result = smartcrop::find_best_crop(
    &rgb_img,
    std::num::NonZeroU32::new(target_w).ok_or_else(|| Error::from_reason("Target width must be > 0"))?,
    std::num::NonZeroU32::new(target_h).ok_or_else(|| Error::from_reason("Target height must be > 0"))?,
  ).map_err(|e| Error::from_reason(format!("Smart crop analysis failed: {:?}", e)))?;

  // Apply the crop
  let cropped = img.crop_imm(
    result.crop.x,
    result.crop.y,
    result.crop.width,
    result.crop.height,
  );

  // Encode to PNG
  let output = encode::encode_png(&cropped, None)?;
  Ok(Buffer::from(output))
}

/// Smart crop an image using content-aware detection asynchronously
/// Automatically finds the most interesting region and crops to it
#[napi]
pub async fn smart_crop(
  input: Buffer,
  options: SmartCropOptions,
) -> Result<Buffer> {
  tokio::task::spawn_blocking(move || {
    let img = decode::decode_image(&input)?;
    let (img_w, img_h) = image::GenericImageView::dimensions(&img);

    // Determine target dimensions
    let (target_w, target_h) = if let Some(ref ratio) = options.aspect_ratio {
      let (ratio_w, ratio_h) = parse_aspect_ratio(ratio)
        .map_err(|e| ImageError::ProcessingError(e))?;

      let scale_w = img_w as f64 / ratio_w as f64;
      let scale_h = img_h as f64 / ratio_h as f64;
      let scale = scale_w.min(scale_h);

      ((ratio_w as f64 * scale) as u32, (ratio_h as f64 * scale) as u32)
    } else {
      let w = options.width.unwrap_or(img_w);
      let h = options.height.unwrap_or(img_h);
      (w.min(img_w), h.min(img_h))
    };

    let rgb_img = img.to_rgb8();

    let result = smartcrop::find_best_crop(
      &rgb_img,
      std::num::NonZeroU32::new(target_w).ok_or_else(|| ImageError::ProcessingError("Target width must be > 0".to_string()))?,
      std::num::NonZeroU32::new(target_h).ok_or_else(|| ImageError::ProcessingError("Target height must be > 0".to_string()))?,
    ).map_err(|e| ImageError::ProcessingError(format!("Smart crop analysis failed: {:?}", e)))?;

    // Apply the crop
    let cropped = img.crop_imm(
      result.crop.x,
      result.crop.y,
      result.crop.width,
      result.crop.height,
    );

    // Encode to PNG
    let output = encode::encode_png(&cropped, None)?;
    Ok::<Buffer, ImageError>(Buffer::from(output))
  })
  .await
  .map_err(|e| Error::from_reason(format!("Task error: {}", e)))?
  .map_err(|e| e.into())
}

// ============================================
// DOMINANT COLOR FUNCTIONS
// ============================================

/// Helper function to convert RGB bytes to hex string
fn rgb_to_hex(r: u8, g: u8, b: u8) -> String {
  format!("#{:02X}{:02X}{:02X}", r, g, b)
}

/// Extract dominant colors from an image synchronously
/// Returns the most prominent colors sorted by frequency
#[napi]
pub fn dominant_colors_sync(
  input: Buffer,
  count: Option<u32>,
) -> Result<DominantColorsResult> {
  let img = decode::decode_image(&input)?;
  let rgb_img = img.to_rgb8();

  // Get raw RGB bytes
  let pixels = rgb_img.as_raw();

  // Extract colors using dominant_color crate
  let color_bytes = dominant_color::get_colors(pixels, false);

  // Convert to DominantColor structs (3 bytes per color: R, G, B)
  let max_colors = count.unwrap_or(5) as usize;
  let mut colors: Vec<DominantColor> = Vec::new();

  for i in (0..color_bytes.len()).step_by(3) {
    if colors.len() >= max_colors {
      break;
    }
    if i + 2 < color_bytes.len() {
      let r = color_bytes[i];
      let g = color_bytes[i + 1];
      let b = color_bytes[i + 2];
      colors.push(DominantColor {
        r,
        g,
        b,
        hex: rgb_to_hex(r, g, b),
      });
    }
  }

  // If no colors found, return black as fallback
  if colors.is_empty() {
    colors.push(DominantColor {
      r: 0,
      g: 0,
      b: 0,
      hex: "#000000".to_string(),
    });
  }

  let primary = colors[0].clone();

  Ok(DominantColorsResult { colors, primary })
}

/// Extract dominant colors from an image asynchronously
/// Returns the most prominent colors sorted by frequency
#[napi]
pub async fn dominant_colors(
  input: Buffer,
  count: Option<u32>,
) -> Result<DominantColorsResult> {
  tokio::task::spawn_blocking(move || {
    let img = decode::decode_image(&input)?;
    let rgb_img = img.to_rgb8();

    // Get raw RGB bytes
    let pixels = rgb_img.as_raw();

    // Extract colors using dominant_color crate
    let color_bytes = dominant_color::get_colors(pixels, false);

    // Convert to DominantColor structs (3 bytes per color: R, G, B)
    let max_colors = count.unwrap_or(5) as usize;
    let mut colors: Vec<DominantColor> = Vec::new();

    for i in (0..color_bytes.len()).step_by(3) {
      if colors.len() >= max_colors {
        break;
      }
      if i + 2 < color_bytes.len() {
        let r = color_bytes[i];
        let g = color_bytes[i + 1];
        let b = color_bytes[i + 2];
        colors.push(DominantColor {
          r,
          g,
          b,
          hex: rgb_to_hex(r, g, b),
        });
      }
    }

    // If no colors found, return black as fallback
    if colors.is_empty() {
      colors.push(DominantColor {
        r: 0,
        g: 0,
        b: 0,
        hex: "#000000".to_string(),
      });
    }

    let primary = colors[0].clone();

    Ok::<DominantColorsResult, ImageError>(DominantColorsResult { colors, primary })
  })
  .await
  .map_err(|e| Error::from_reason(format!("Task error: {}", e)))?
  .map_err(|e| e.into())
}

// ============================================
// TENSOR FUNCTIONS
// ============================================

/// Convert image to tensor format synchronously
/// Optimized for ML preprocessing with SIMD and parallel processing
#[napi]
pub fn to_tensor_sync(input: Buffer, options: Option<TensorOptions>) -> Result<TensorResult> {
  let opts = options.unwrap_or(TensorOptions {
    dtype: None,
    layout: None,
    normalization: None,
    width: None,
    height: None,
    batch: None,
  });
  tensor::image_to_tensor(&input, &opts).map_err(|e| e.into())
}

/// Convert image to tensor format asynchronously
/// Optimized for ML preprocessing with SIMD and parallel processing
#[napi]
pub async fn to_tensor(input: Buffer, options: Option<TensorOptions>) -> Result<TensorResult> {
  tokio::task::spawn_blocking(move || {
    let opts = options.unwrap_or(TensorOptions {
      dtype: None,
      layout: None,
      normalization: None,
      width: None,
      height: None,
      batch: None,
    });
    tensor::image_to_tensor(&input, &opts)
  })
  .await
  .map_err(|e| Error::from_reason(format!("Task error: {}", e)))?
  .map_err(|e| e.into())
}

// ============================================
// EXIF/METADATA WRITE FUNCTIONS
// ============================================

/// Convert ExifOptions to internal ExifWriteOptions
fn exif_options_to_internal(options: &ExifOptions) -> metadata_write::ExifWriteOptions {
  metadata_write::ExifWriteOptions {
    image_description: options.image_description.clone(),
    artist: options.artist.clone(),
    copyright: options.copyright.clone(),
    software: options.software.clone(),
    date_time: options.date_time.clone(),
    date_time_original: options.date_time_original.clone(),
    user_comment: options.user_comment.clone(),
    make: options.make.clone(),
    model: options.model.clone(),
    orientation: options.orientation,
  }
}

/// Write EXIF metadata to a WebP image synchronously
#[napi]
pub fn write_exif_sync(input: Buffer, options: ExifOptions) -> Result<Buffer> {
  let format = decode::detect_format(&input)?;
  let internal_opts = exif_options_to_internal(&options);

  let output = match format {
    image::ImageFormat::Jpeg => metadata_write::write_jpeg_exif(&input, &internal_opts)?,
    image::ImageFormat::WebP => metadata_write::write_webp_exif(&input, &internal_opts)?,
    _ => return Err(Error::from_reason("EXIF writing only supported for JPEG and WebP formats")),
  };

  Ok(Buffer::from(output))
}

/// Write EXIF metadata to a WebP image asynchronously
#[napi]
pub async fn write_exif(input: Buffer, options: ExifOptions) -> Result<Buffer> {
  tokio::task::spawn_blocking(move || {
    let format = decode::detect_format(&input)?;
    let internal_opts = exif_options_to_internal(&options);

    let output = match format {
      image::ImageFormat::Jpeg => metadata_write::write_jpeg_exif(&input, &internal_opts)?,
      image::ImageFormat::WebP => metadata_write::write_webp_exif(&input, &internal_opts)?,
      _ => return Err(ImageError::UnsupportedFormat("EXIF writing only supported for JPEG and WebP formats".to_string())),
    };

    Ok::<Buffer, ImageError>(Buffer::from(output))
  })
  .await
  .map_err(|e| Error::from_reason(format!("Task error: {}", e)))?
  .map_err(|e| e.into())
}

/// Strip EXIF metadata from an image synchronously
#[napi]
pub fn strip_exif_sync(input: Buffer) -> Result<Buffer> {
  let format = decode::detect_format(&input)?;

  let output = match format {
    image::ImageFormat::Jpeg => metadata_write::strip_jpeg_exif(&input)?,
    image::ImageFormat::WebP => metadata_write::strip_webp_exif(&input)?,
    _ => return Err(Error::from_reason("EXIF stripping only supported for JPEG and WebP formats")),
  };

  Ok(Buffer::from(output))
}

/// Strip EXIF metadata from an image asynchronously
#[napi]
pub async fn strip_exif(input: Buffer) -> Result<Buffer> {
  tokio::task::spawn_blocking(move || {
    let format = decode::detect_format(&input)?;

    let output = match format {
      image::ImageFormat::Jpeg => metadata_write::strip_jpeg_exif(&input)?,
      image::ImageFormat::WebP => metadata_write::strip_webp_exif(&input)?,
      _ => return Err(ImageError::UnsupportedFormat("EXIF stripping only supported for JPEG and WebP formats".to_string())),
    };

    Ok::<Buffer, ImageError>(Buffer::from(output))
  })
  .await
  .map_err(|e| Error::from_reason(format!("Task error: {}", e)))?
  .map_err(|e| e.into())
}
