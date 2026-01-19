//! Image decoding module - optimized for performance
//!
//! Uses turbojpeg (libjpeg-turbo with SIMD) for fastest JPEG decode.
//! Uses mozjpeg for shrink-on-load when downscaling (decode at reduced resolution).
//! Uses libwebp for WebP shrink-on-load (decode directly to target resolution).
//! Uses libheif for HEIC/HEIF decoding (iPhone photos) - optional feature.

mod generic;
mod heic;
mod jpeg;
mod webp;

use image::{DynamicImage, ImageFormat};

use crate::error::ImageError;
use crate::metadata;

pub use generic::decode_with_image_crate_safe;
pub use heic::decode_heic_with_target;
pub use jpeg::{decode_jpeg_fast, decode_jpeg_with_shrink, decode_jpeg_with_shrink_mode};
pub use webp::{decode_webp_fast, decode_webp_with_target};

// Re-export metadata functions for backward compatibility
pub use metadata::{detect_format, get_metadata, is_heic};

/// Decode image from bytes - uses optimized decoders per format
#[inline]
pub fn decode_image(data: &[u8]) -> Result<DynamicImage, ImageError> {
  decode_image_with_target(data, None, None)
}

/// Decode image with optional target dimensions for shrink-on-load optimization
/// This is THE key optimization that makes sharp fast - decode at reduced resolution
#[inline]
pub fn decode_image_with_target(
  data: &[u8],
  target_width: Option<u32>,
  target_height: Option<u32>,
) -> Result<DynamicImage, ImageError> {
  decode_image_with_target_fast(data, target_width, target_height, false)
}

/// Decode image with target dimensions and fast mode option
/// Fast mode uses more aggressive shrink-on-load for maximum speed
#[inline]
pub fn decode_image_with_target_fast(
  data: &[u8],
  target_width: Option<u32>,
  target_height: Option<u32>,
  fast_mode: bool,
) -> Result<DynamicImage, ImageError> {
  // Check for HEIC first - use shrink-on-decode if target provided
  if is_heic(data) {
    return decode_heic_with_target(data, target_width, target_height);
  }

  let format = detect_format(data)?;

  match format {
    ImageFormat::Jpeg => {
      // Use turbojpeg with shrink-on-load when we have target dimensions
      if target_width.is_some() || target_height.is_some() {
        decode_jpeg_with_shrink_mode(data, target_width, target_height, fast_mode)
      } else {
        decode_jpeg_fast(data)
      }
    }
    ImageFormat::WebP => {
      // Use libwebp with shrink-on-load when we have target dimensions
      if target_width.is_some() || target_height.is_some() {
        decode_webp_with_target(data, target_width, target_height)
      } else {
        decode_webp_fast(data)
      }
    }
    _ => decode_with_image_crate_safe(data),
  }
}
