//! Image decoding functions - optimized for performance
//! Uses turbojpeg (libjpeg-turbo with SIMD) for fastest JPEG decode
//! Uses mozjpeg for shrink-on-load when downscaling (decode at reduced resolution)
//! Uses libheif for HEIC/HEIF decoding (iPhone photos) - optional feature

use image::{DynamicImage, ImageFormat, ImageReader, RgbImage, RgbaImage};
use std::io::Cursor;

use crate::error::ImageError;
use crate::ImageMetadata;

/// Maximum pixel count before we require memory protection (100 megapixels)
const MAX_PIXELS_DEFAULT: u64 = 100_000_000;

/// Check if data is HEIC/HEIF format by examining ftyp box
#[inline]
pub fn is_heic(data: &[u8]) -> bool {
  if data.len() < 12 {
    return false;
  }
  // HEIC/HEIF files start with ftyp box
  // Format: [4 bytes size][4 bytes "ftyp"][4 bytes brand]
  // Common brands: heic, heix, hevc, hevx, mif1, msf1
  if &data[4..8] == b"ftyp" {
    let brand = &data[8..12];
    return brand == b"heic"
      || brand == b"heix"
      || brand == b"hevc"
      || brand == b"hevx"
      || brand == b"mif1"
      || brand == b"msf1"
      || brand == b"avif"; // AVIF is also supported by libheif
  }
  false
}

/// Check if HEIC support is available at runtime
#[inline]
pub fn heic_supported() -> bool {
  cfg!(feature = "heic")
}

/// Detect image format from bytes (fast - only reads magic bytes)
#[inline]
pub fn detect_format(data: &[u8]) -> Result<ImageFormat, ImageError> {
  // Check for HEIC first (not detected by image crate)
  if is_heic(data) {
    // Return a placeholder - we'll handle HEIC specially
    return Ok(ImageFormat::Avif); // Use Avif as marker for HEIC (both are similar)
  }

  image::guess_format(data)
    .map_err(|e| ImageError::DecodeError(format!("Cannot detect format: {}", e)))
}


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
  // Check for HEIC first - use shrink-on-decode if target provided
  #[cfg(feature = "heic")]
  if is_heic(data) {
    return decode_heic_with_target(data, target_width, target_height);
  }

  #[cfg(not(feature = "heic"))]
  if is_heic(data) {
    return Err(ImageError::UnsupportedFormat(
      "HEIC/HEIF support not available. Install with 'heic' feature enabled.".to_string()
    ));
  }

  let format = detect_format(data)?;

  match format {
    ImageFormat::Jpeg => {
      // Use mozjpeg with shrink-on-load when we have target dimensions
      if target_width.is_some() || target_height.is_some() {
        decode_jpeg_with_shrink(data, target_width, target_height)
      } else {
        decode_jpeg_fast(data)
      }
    }
    _ => decode_with_image_crate_safe(data),
  }
}

/// JPEG shrink-on-load using turbojpeg (libjpeg-turbo with SIMD)
/// This decodes JPEG at reduced resolution - THE key optimization
/// Much faster than mozjpeg because turbojpeg uses SIMD (SSE2/AVX2/NEON)
/// Scale factors: 1/8, 1/4, 3/8, 1/2, 5/8, 3/4, 7/8, 1/1
fn decode_jpeg_with_shrink(
  data: &[u8],
  target_width: Option<u32>,
  target_height: Option<u32>,
) -> Result<DynamicImage, ImageError> {
  // First, get original dimensions using fast header parsing
  let (src_width, src_height) = get_jpeg_dimensions_fast(data)?;

  // Calculate optimal shrink factor (like sharp does)
  let (scale_num, scale_denom) = calculate_jpeg_scale_factor(
    src_width, src_height,
    target_width, target_height,
  );

  // Use turbojpeg with SIMD-accelerated shrink-on-load
  let mut decompressor = turbojpeg::Decompressor::new()
    .map_err(|e| ImageError::DecodeError(format!("TurboJPEG init failed: {:?}", e)))?;

  // Set scaling factor
  let scaling = turbojpeg::ScalingFactor::new(scale_num as usize, scale_denom as usize);
  decompressor.set_scaling_factor(scaling)
    .map_err(|e| ImageError::DecodeError(format!("TurboJPEG scale failed: {:?}", e)))?;

  // Read header to get scaled dimensions
  let header = decompressor.read_header(data)
    .map_err(|e| ImageError::DecodeError(format!("TurboJPEG header failed: {:?}", e)))?;

  let scaled_width = scaling.scale(header.width);
  let scaled_height = scaling.scale(header.height);

  // Allocate output buffer for scaled image
  let pitch = scaled_width * 3; // RGB = 3 bytes per pixel
  let mut pixels = vec![0u8; pitch * scaled_height];

  // Create output image structure
  let output = turbojpeg::Image {
    pixels: pixels.as_mut_slice(),
    width: scaled_width,
    pitch,
    height: scaled_height,
    format: turbojpeg::PixelFormat::RGB,
  };

  // Decompress at scaled resolution
  decompressor.decompress(data, output)
    .map_err(|e| ImageError::DecodeError(format!("TurboJPEG decompress failed: {:?}", e)))?;

  let img = RgbImage::from_raw(scaled_width as u32, scaled_height as u32, pixels)
    .ok_or_else(|| ImageError::DecodeError("Failed to create image from decoded data".to_string()))?;

  Ok(DynamicImage::ImageRgb8(img))
}

/// Calculate optimal JPEG scale factor for shrink-on-load
/// Returns (numerator, denominator) for turbojpeg ScalingFactor
/// Uses same logic as sharp/libvips for optimal quality
fn calculate_jpeg_scale_factor(
  src_width: u32,
  src_height: u32,
  target_width: Option<u32>,
  target_height: Option<u32>,
) -> (i32, i32) {
  // Calculate target dimensions
  let (tw, th) = match (target_width, target_height) {
    (Some(w), Some(h)) => (w, h),
    (Some(w), None) => {
      let ratio = w as f64 / src_width as f64;
      (w, (src_height as f64 * ratio) as u32)
    }
    (None, Some(h)) => {
      let ratio = h as f64 / src_height as f64;
      ((src_width as f64 * ratio) as u32, h)
    }
    (None, None) => return (1, 1), // No target = full resolution
  };

  // Calculate shrink ratio (how much smaller is target vs source)
  let hshrink = src_width as f64 / tw as f64;
  let vshrink = src_height as f64 / th as f64;
  let shrink = hshrink.min(vshrink); // Use minimum to ensure we have enough pixels

  // Sharp uses fastShrinkOnLoad with aggressive shrinking
  // We use a factor of 1.0 for speed, accepting minor quality tradeoff
  // This matches sharp's behavior with fastShrinkOnLoad: true (default)
  //
  // Scale factors available: 1/8, 1/4, 3/8, 1/2, 5/8, 3/4, 7/8, 1/1
  // We pick the smallest that gives us enough pixels for final resize

  if shrink >= 8.0 {
    (1, 8)  // 1/8 = 12.5% - for massive downscales
  } else if shrink >= 4.0 {
    (1, 4)  // 1/4 = 25% - for large downscales
  } else if shrink >= 2.0 {
    (1, 2)  // 1/2 = 50% - for medium downscales
  } else {
    (1, 1)  // 1/1 = 100% - full resolution
  }
}

/// Fast JPEG dimension extraction from header
fn get_jpeg_dimensions_fast(data: &[u8]) -> Result<(u32, u32), ImageError> {
  let mut pos = 2; // Skip SOI
  let limit = data.len().min(65536);

  while pos + 4 < limit {
    if data[pos] != 0xFF {
      pos += 1;
      continue;
    }

    let marker = data[pos + 1];
    if marker == 0xFF {
      pos += 1;
      continue;
    }

    // Markers without length
    if marker == 0x00 || marker == 0x01 || (0xD0..=0xD9).contains(&marker) {
      pos += 2;
      continue;
    }

    let length = u16::from_be_bytes([data[pos + 2], data[pos + 3]]) as usize;

    // SOF0 (baseline) or SOF2 (progressive) contain dimensions
    if marker == 0xC0 || marker == 0xC2 {
      if pos + 9 < data.len() {
        let height = u16::from_be_bytes([data[pos + 5], data[pos + 6]]) as u32;
        let width = u16::from_be_bytes([data[pos + 7], data[pos + 8]]) as u32;
        return Ok((width, height));
      }
    }

    pos += 2 + length;
  }

  Err(ImageError::DecodeError("Could not find JPEG dimensions".to_string()))
}

/// Fast JPEG decoding using turbojpeg (libjpeg-turbo with SIMD)
/// 2-6x faster than pure Rust decoders thanks to SSE2/AVX2/NEON
#[inline]
fn decode_jpeg_fast(data: &[u8]) -> Result<DynamicImage, ImageError> {
  // Use turbojpeg for maximum decode speed
  let image: turbojpeg::Image<Vec<u8>> = turbojpeg::decompress(data, turbojpeg::PixelFormat::RGB)
    .map_err(|e| ImageError::DecodeError(format!("TurboJPEG decode failed: {:?}", e)))?;

  let width = image.width as u32;
  let height = image.height as u32;

  let img = RgbImage::from_raw(width, height, image.pixels)
    .ok_or_else(|| ImageError::DecodeError("Failed to create image from decoded data".to_string()))?;

  Ok(DynamicImage::ImageRgb8(img))
}

/// Decode HEIC/HEIF with optional target dimensions for shrink-on-decode optimization
/// When target dimensions are provided, the image is scaled during decode for better performance
#[cfg(feature = "heic")]
#[inline]
pub fn decode_heic_with_target(
  data: &[u8],
  target_width: Option<u32>,
  target_height: Option<u32>,
) -> Result<DynamicImage, ImageError> {
  use libheif_rs::{HeifContext, LibHeif, RgbChroma, ColorSpace};

  // Create libheif instance
  let lib_heif = LibHeif::new();

  // Create context from memory
  let ctx = HeifContext::read_from_bytes(data)
    .map_err(|e| ImageError::DecodeError(format!("HEIC context error: {}", e)))?;

  // Get primary image handle
  let handle = ctx.primary_image_handle()
    .map_err(|e| ImageError::DecodeError(format!("HEIC handle error: {}", e)))?;

  let src_width = handle.width();
  let src_height = handle.height();

  // Check image size limit
  let pixel_count = src_width as u64 * src_height as u64;
  if pixel_count > MAX_PIXELS_DEFAULT {
    return Err(ImageError::DecodeError(format!(
      "HEIC image too large: {}x{} ({} megapixels) exceeds limit of {} megapixels",
      src_width, src_height, pixel_count / 1_000_000, MAX_PIXELS_DEFAULT / 1_000_000
    )));
  }

  // Check if image has alpha channel
  let has_alpha = handle.has_alpha_channel();

  // Decode to RGB or RGBA
  let decoded = if has_alpha {
    lib_heif.decode(&handle, ColorSpace::Rgb(RgbChroma::Rgba), None)
      .map_err(|e| ImageError::DecodeError(format!("HEIC decode error: {}", e)))?
  } else {
    lib_heif.decode(&handle, ColorSpace::Rgb(RgbChroma::Rgb), None)
      .map_err(|e| ImageError::DecodeError(format!("HEIC decode error: {}", e)))?
  };

  // Apply shrink-on-decode if target dimensions are significantly smaller
  let image = if let (Some(tw), Some(th)) = (target_width, target_height) {
    // Only scale if target is at least 2x smaller in both dimensions
    if tw < src_width / 2 && th < src_height / 2 {
      decoded.scale(tw, th, None)
        .map_err(|e| ImageError::DecodeError(format!("HEIC scale error: {}", e)))?
    } else {
      decoded
    }
  } else if let Some(tw) = target_width {
    if tw < src_width / 2 {
      let th = (src_height as f64 * tw as f64 / src_width as f64) as u32;
      decoded.scale(tw, th, None)
        .map_err(|e| ImageError::DecodeError(format!("HEIC scale error: {}", e)))?
    } else {
      decoded
    }
  } else if let Some(th) = target_height {
    if th < src_height / 2 {
      let tw = (src_width as f64 * th as f64 / src_height as f64) as u32;
      decoded.scale(tw, th, None)
        .map_err(|e| ImageError::DecodeError(format!("HEIC scale error: {}", e)))?
    } else {
      decoded
    }
  } else {
    decoded
  };

  // Get final dimensions after potential scaling
  let width = image.width();
  let height = image.height();

  // Get interleaved RGB(A) data
  let planes = image.planes();
  let interleaved = planes.interleaved
    .ok_or_else(|| ImageError::DecodeError("HEIC: No interleaved data".to_string()))?;

  let stride = interleaved.stride;
  let pixel_data = interleaved.data;
  let bytes_per_pixel = if has_alpha { 4 } else { 3 };
  let row_bytes = width as usize * bytes_per_pixel;

  // Optimized pixel extraction - use memcpy when stride matches row width
  if stride == row_bytes {
    // Fast path: contiguous memory, direct copy
    let total_bytes = (width * height) as usize * bytes_per_pixel;
    let pixels = pixel_data[..total_bytes].to_vec();

    if has_alpha {
      let img = RgbaImage::from_raw(width, height, pixels)
        .ok_or_else(|| ImageError::DecodeError("Failed to create RGBA image from HEIC".to_string()))?;
      Ok(DynamicImage::ImageRgba8(img))
    } else {
      let img = RgbImage::from_raw(width, height, pixels)
        .ok_or_else(|| ImageError::DecodeError("Failed to create RGB image from HEIC".to_string()))?;
      Ok(DynamicImage::ImageRgb8(img))
    }
  } else {
    // Slow path: stride doesn't match, need row-by-row copy
    let mut pixels = Vec::with_capacity((width * height) as usize * bytes_per_pixel);

    for y in 0..height as usize {
      let row_start = y * stride;
      let row_end = row_start + row_bytes;
      pixels.extend_from_slice(&pixel_data[row_start..row_end]);
    }

    if has_alpha {
      let img = RgbaImage::from_raw(width, height, pixels)
        .ok_or_else(|| ImageError::DecodeError("Failed to create RGBA image from HEIC".to_string()))?;
      Ok(DynamicImage::ImageRgba8(img))
    } else {
      let img = RgbImage::from_raw(width, height, pixels)
        .ok_or_else(|| ImageError::DecodeError("Failed to create RGB image from HEIC".to_string()))?;
      Ok(DynamicImage::ImageRgb8(img))
    }
  }
}

/// Fallback decoder using image crate for non-JPEG formats
/// Includes memory protection for huge images
#[inline]
fn decode_with_image_crate_safe(data: &[u8]) -> Result<DynamicImage, ImageError> {
  let cursor = Cursor::new(data);
  let reader = ImageReader::new(cursor)
    .with_guessed_format()
    .map_err(|e| ImageError::DecodeError(e.to_string()))?;

  // Check dimensions before decoding to prevent memory exhaustion
  let (width, height) = reader.into_dimensions()
    .map_err(|e| ImageError::DecodeError(e.to_string()))?;

  let pixel_count = width as u64 * height as u64;
  if pixel_count > MAX_PIXELS_DEFAULT {
    return Err(ImageError::DecodeError(format!(
      "Image too large: {}x{} ({} megapixels) exceeds limit of {} megapixels",
      width, height, pixel_count / 1_000_000, MAX_PIXELS_DEFAULT / 1_000_000
    )));
  }

  // Re-read and decode (into_dimensions consumes the reader)
  let cursor = Cursor::new(data);
  let reader = ImageReader::new(cursor)
    .with_guessed_format()
    .map_err(|e| ImageError::DecodeError(e.to_string()))?;

  reader.decode()
    .map_err(|e| ImageError::DecodeError(e.to_string()))
}

/// Get image metadata WITHOUT fully decoding (reads headers only)
/// Optimized for speed - only parses necessary header bytes
pub fn get_metadata(data: &[u8]) -> Result<ImageMetadata, ImageError> {
  let size = data.len() as u32;

  // Check for HEIC first
  #[cfg(feature = "heic")]
  if is_heic(data) {
    return get_heic_metadata(data, size);
  }

  #[cfg(not(feature = "heic"))]
  if is_heic(data) {
    return Err(ImageError::UnsupportedFormat(
      "HEIC/HEIF support not available. Install with 'heic' feature enabled.".to_string()
    ));
  }

  let format = detect_format(data)?;

  // For JPEG, use fast header-only parsing
  if matches!(format, ImageFormat::Jpeg) {
    return get_jpeg_metadata_fast(data, size);
  }

  // For other formats, use image crate's header reading
  let cursor = Cursor::new(data);
  let reader = ImageReader::new(cursor)
    .with_guessed_format()
    .map_err(|e| ImageError::DecodeError(e.to_string()))?;

  let (width, height) = reader.into_dimensions()
    .map_err(|e| ImageError::DecodeError(e.to_string()))?;

  let metadata = match format {
    ImageFormat::Png => parse_png_metadata(data, width, height, size),
    ImageFormat::WebP => parse_webp_metadata(data, width, height, size),
    ImageFormat::Gif => parse_gif_metadata(data, width, height, size),
    ImageFormat::Bmp => parse_bmp_metadata(data, width, height, size),
    ImageFormat::Tiff => parse_tiff_metadata(data, width, height, size),
    ImageFormat::Ico => parse_ico_metadata(data, width, height, size),
    _ => create_default_metadata("unknown", width, height, size, false, 8, 3),
  };

  Ok(metadata)
}

/// Get HEIC/HEIF metadata using libheif (fast - header only)
#[cfg(feature = "heic")]
fn get_heic_metadata(data: &[u8], size: u32) -> Result<ImageMetadata, ImageError> {
  use libheif_rs::HeifContext;

  let ctx = HeifContext::read_from_bytes(data)
    .map_err(|e| ImageError::DecodeError(format!("HEIC context error: {}", e)))?;

  let handle = ctx.primary_image_handle()
    .map_err(|e| ImageError::DecodeError(format!("HEIC handle error: {}", e)))?;

  let width = handle.width();
  let height = handle.height();
  let has_alpha = handle.has_alpha_channel();
  let bit_depth = handle.luma_bits_per_pixel();

  // Determine format string (heic or avif)
  let format_str = if data.len() >= 12 && &data[8..12] == b"avif" {
    "avif"
  } else {
    "heic"
  };

  let channels = if has_alpha { 4 } else { 3 };

  Ok(ImageMetadata {
    width,
    height,
    format: format_str.to_string(),
    size: Some(size),
    space: "srgb".to_string(),
    channels,
    depth: if bit_depth > 8 { "ushort".to_string() } else { "uchar".to_string() },
    has_alpha,
    bits_per_sample: bit_depth,
    is_progressive: false,
    is_palette: false,
    has_profile: handle.color_profile_raw().is_some(),
    orientation: None, // HEIC handles orientation internally
    pages: None,
    loop_count: None,
    delay: None,
    background: None,
    compression: Some("hevc".to_string()),
    density: None,
  })
}

/// Fast JPEG metadata extraction - only reads first few KB of headers
/// Much faster than image crate for large files
fn get_jpeg_metadata_fast(data: &[u8], size: u32) -> Result<ImageMetadata, ImageError> {
  let mut width: u32 = 0;
  let mut height: u32 = 0;
  let mut channels: u8 = 3;
  let mut is_progressive = false;
  let mut has_profile = false;
  let mut orientation: Option<u8> = None;
  let mut density: Option<u32> = None;

  // Parse JPEG markers - only scan first 64KB for headers (enough for any reasonable image)
  let scan_limit = data.len().min(65536);
  let mut pos = 2; // Skip SOI marker

  while pos + 4 < scan_limit {
    if data[pos] != 0xFF {
      pos += 1;
      continue;
    }

    let marker = data[pos + 1];

    // Skip padding bytes
    if marker == 0xFF {
      pos += 1;
      continue;
    }

    // Markers without length
    if marker == 0x00 || marker == 0x01 || (0xD0..=0xD9).contains(&marker) {
      pos += 2;
      continue;
    }

    // Get marker length
    if pos + 4 > scan_limit {
      break;
    }
    let length = u16::from_be_bytes([data[pos + 2], data[pos + 3]]) as usize;

    match marker {
      // SOF0 - Baseline DCT (most common)
      0xC0 => {
        if pos + 9 < data.len() {
          height = u16::from_be_bytes([data[pos + 5], data[pos + 6]]) as u32;
          width = u16::from_be_bytes([data[pos + 7], data[pos + 8]]) as u32;
          channels = data[pos + 9];
        }
      }
      // SOF2 - Progressive DCT
      0xC2 => {
        is_progressive = true;
        if pos + 9 < data.len() {
          height = u16::from_be_bytes([data[pos + 5], data[pos + 6]]) as u32;
          width = u16::from_be_bytes([data[pos + 7], data[pos + 8]]) as u32;
          channels = data[pos + 9];
        }
      }
      // APP0 - JFIF (density info)
      0xE0 => {
        if length > 12 && pos + 14 < data.len() {
          if &data[pos + 4..pos + 9] == b"JFIF\0" {
            let unit = data[pos + 11];
            let x_density = u16::from_be_bytes([data[pos + 12], data[pos + 13]]);
            density = Some(match unit {
              1 => x_density as u32,           // DPI
              2 => (x_density as f64 * 2.54) as u32, // dots per cm
              _ => x_density as u32,
            });
          }
        }
      }
      // APP1 - EXIF
      0xE1 => {
        if length > 8 && pos + 10 < data.len() {
          if &data[pos + 4..pos + 8] == b"Exif" {
            orientation = parse_exif_orientation(&data[pos + 10..data.len().min(pos + length + 2)]);
          }
        }
      }
      // APP2 - ICC Profile
      0xE2 => {
        if length > 14 && pos + 16 < data.len() {
          if &data[pos + 4..pos + 16] == b"ICC_PROFILE\0" {
            has_profile = true;
          }
        }
      }
      // SOS - Start of scan (we have all headers now)
      0xDA => break,
      _ => {}
    }

    pos += 2 + length;
  }

  // If we didn't find dimensions, something's wrong
  if width == 0 || height == 0 {
    return Err(ImageError::DecodeError("Invalid JPEG: no dimensions found".to_string()));
  }

  let space = if channels == 1 { "grayscale" } else { "srgb" };

  Ok(ImageMetadata {
    width,
    height,
    format: "jpeg".to_string(),
    size: Some(size),
    space: space.to_string(),
    channels,
    depth: "uchar".to_string(),
    has_alpha: false,
    bits_per_sample: 8,
    is_progressive,
    is_palette: false,
    has_profile,
    orientation,
    pages: None,
    loop_count: None,
    delay: None,
    background: None,
    compression: Some(if is_progressive { "progressive" } else { "baseline" }.to_string()),
    density,
  })
}

/// Parse PNG header for detailed metadata
fn parse_png_metadata(data: &[u8], width: u32, height: u32, size: u32) -> ImageMetadata {
  if data.len() < 29 {
    return create_default_metadata("png", width, height, size, false, 8, 3);
  }

  // Check PNG signature
  if &data[0..8] != b"\x89PNG\r\n\x1a\n" {
    return create_default_metadata("png", width, height, size, false, 8, 3);
  }

  // IHDR should be first chunk
  if &data[12..16] != b"IHDR" {
    return create_default_metadata("png", width, height, size, false, 8, 3);
  }

  let bit_depth = data[24];
  let color_type = data[25];
  let interlace = data[28];

  let (has_alpha, channels, space, is_palette) = match color_type {
    0 => (false, 1, "grayscale", false),
    2 => (false, 3, "srgb", false),
    3 => (false, 1, "srgb", true),
    4 => (true, 2, "grayscale", false),
    6 => (true, 4, "srgb", false),
    _ => (false, 3, "srgb", false),
  };

  let has_profile = find_png_chunk(data, b"iCCP").is_some();
  let density = find_png_chunk(data, b"pHYs").and_then(|offset| {
    if data.len() > offset + 12 {
      let ppu_x = u32::from_be_bytes([data[offset], data[offset+1], data[offset+2], data[offset+3]]);
      let unit = data[offset + 8];
      if unit == 1 {
        Some((ppu_x as f64 / 39.3701) as u32)
      } else {
        None
      }
    } else {
      None
    }
  });

  let depth_str = match bit_depth {
    1 | 2 | 4 | 8 => "uchar",
    16 => "ushort",
    _ => "uchar",
  };

  ImageMetadata {
    width,
    height,
    format: "png".to_string(),
    size: Some(size),
    space: space.to_string(),
    channels,
    depth: depth_str.to_string(),
    has_alpha,
    bits_per_sample: bit_depth,
    is_progressive: interlace == 1,
    is_palette,
    has_profile,
    orientation: None,
    pages: None,
    loop_count: None,
    delay: None,
    background: None,
    compression: Some("deflate".to_string()),
    density,
  }
}

/// Parse WebP header for detailed metadata
fn parse_webp_metadata(data: &[u8], width: u32, height: u32, size: u32) -> ImageMetadata {
  let mut has_alpha = false;
  let mut is_animated = false;
  let mut loop_count: Option<u32> = None;
  let mut has_profile = false;

  if data.len() > 20 {
    let chunk = &data[12..16];

    if chunk == b"VP8L" {
      if data.len() > 24 {
        let signature = data[21];
        has_alpha = (signature & 0x10) != 0;
      }
    } else if chunk == b"VP8X" {
      if data.len() > 24 {
        let flags = data[20];
        has_alpha = (flags & 0x10) != 0;
        is_animated = (flags & 0x02) != 0;
        has_profile = (flags & 0x20) != 0;
      }
      if is_animated {
        if let Some(offset) = find_webp_chunk(data, b"ANIM") {
          if data.len() > offset + 6 {
            loop_count = Some(u16::from_le_bytes([data[offset + 4], data[offset + 5]]) as u32);
          }
        }
      }
    }
  }

  let channels = if has_alpha { 4 } else { 3 };

  ImageMetadata {
    width,
    height,
    format: "webp".to_string(),
    size: Some(size),
    space: "srgb".to_string(),
    channels,
    depth: "uchar".to_string(),
    has_alpha,
    bits_per_sample: 8,
    is_progressive: false,
    is_palette: false,
    has_profile,
    orientation: None,
    pages: if is_animated { Some(1) } else { None },
    loop_count,
    delay: None,
    background: None,
    compression: Some("webp".to_string()),
    density: None,
  }
}

/// Parse GIF header for detailed metadata
fn parse_gif_metadata(data: &[u8], width: u32, height: u32, size: u32) -> ImageMetadata {
  let mut background: Option<Vec<u8>> = None;
  let mut pages: u32 = 0;
  let loop_count: Option<u32> = None;
  let mut delays: Vec<u32> = Vec::new();

  if data.len() > 13 {
    let flags = data[10];
    let has_gct = (flags & 0x80) != 0;
    let bg_index = data[11] as usize;

    if has_gct {
      let gct_start = 13;
      if data.len() > gct_start + bg_index * 3 + 2 {
        let bg_offset = gct_start + bg_index * 3;
        background = Some(vec![data[bg_offset], data[bg_offset + 1], data[bg_offset + 2]]);
      }
    }
  }

  // Simplified frame counting - just count image descriptors
  let mut pos = 13;
  if data.len() > 13 {
    let flags = data[10];
    if (flags & 0x80) != 0 {
      pos += 3 * (1 << ((flags & 0x07) + 1));
    }
  }

  // Only scan first 64KB for frame info
  let scan_limit = data.len().min(65536);
  while pos < scan_limit {
    match data.get(pos) {
      Some(0x2C) => {
        pages += 1;
        pos += 10;
      }
      Some(0x21) => {
        if let Some(&ext_type) = data.get(pos + 1) {
          if ext_type == 0xF9 && pos + 5 < data.len() {
            let delay = u16::from_le_bytes([data[pos + 4], data[pos + 5]]) as u32 * 10;
            delays.push(delay);
          }
        }
        pos += 2;
        while pos < data.len() && data[pos] != 0 {
          pos += data[pos] as usize + 1;
        }
        pos += 1;
      }
      Some(0x3B) => break,
      _ => pos += 1,
    }
  }

  ImageMetadata {
    width,
    height,
    format: "gif".to_string(),
    size: Some(size),
    space: "srgb".to_string(),
    channels: 4,
    depth: "uchar".to_string(),
    has_alpha: true,
    bits_per_sample: 8,
    is_progressive: false,
    is_palette: true,
    has_profile: false,
    orientation: None,
    pages: Some(pages.max(1)),
    loop_count,
    delay: if delays.is_empty() { None } else { Some(delays) },
    background,
    compression: Some("lzw".to_string()),
    density: None,
  }
}

/// Parse BMP header
fn parse_bmp_metadata(data: &[u8], width: u32, height: u32, size: u32) -> ImageMetadata {
  let mut bit_depth: u8 = 24;
  let mut has_alpha = false;
  let mut compression = "none";

  if data.len() > 28 {
    bit_depth = u16::from_le_bytes([data[28], data[29]]) as u8;
    has_alpha = bit_depth == 32;

    if data.len() > 34 {
      let comp = u32::from_le_bytes([data[30], data[31], data[32], data[33]]);
      compression = match comp {
        0 => "none",
        1 => "rle8",
        2 => "rle4",
        3 => "bitfields",
        _ => "unknown",
      };
    }
  }

  let channels = if has_alpha { 4 } else { 3 };

  ImageMetadata {
    width,
    height,
    format: "bmp".to_string(),
    size: Some(size),
    space: "srgb".to_string(),
    channels,
    depth: "uchar".to_string(),
    has_alpha,
    bits_per_sample: bit_depth.min(8),
    is_progressive: false,
    is_palette: bit_depth <= 8,
    has_profile: false,
    orientation: None,
    pages: None,
    loop_count: None,
    delay: None,
    background: None,
    compression: Some(compression.to_string()),
    density: None,
  }
}

fn parse_tiff_metadata(_data: &[u8], width: u32, height: u32, size: u32) -> ImageMetadata {
  create_default_metadata("tiff", width, height, size, false, 8, 3)
}

fn parse_ico_metadata(data: &[u8], width: u32, height: u32, size: u32) -> ImageMetadata {
  let pages = if data.len() > 5 {
    Some(u16::from_le_bytes([data[4], data[5]]) as u32)
  } else {
    None
  };

  ImageMetadata {
    width,
    height,
    format: "ico".to_string(),
    size: Some(size),
    space: "srgb".to_string(),
    channels: 4,
    depth: "uchar".to_string(),
    has_alpha: true,
    bits_per_sample: 8,
    is_progressive: false,
    is_palette: false,
    has_profile: false,
    orientation: None,
    pages,
    loop_count: None,
    delay: None,
    background: None,
    compression: None,
    density: None,
  }
}

fn create_default_metadata(format: &str, width: u32, height: u32, size: u32, has_alpha: bool, bit_depth: u8, channels: u8) -> ImageMetadata {
  ImageMetadata {
    width,
    height,
    format: format.to_string(),
    size: Some(size),
    space: if channels == 1 { "grayscale".to_string() } else { "srgb".to_string() },
    channels,
    depth: if bit_depth <= 8 { "uchar".to_string() } else { "ushort".to_string() },
    has_alpha,
    bits_per_sample: bit_depth,
    is_progressive: false,
    is_palette: false,
    has_profile: false,
    orientation: None,
    pages: None,
    loop_count: None,
    delay: None,
    background: None,
    compression: None,
    density: None,
  }
}

fn find_png_chunk(data: &[u8], chunk_type: &[u8; 4]) -> Option<usize> {
  let mut pos = 8;
  while pos + 12 <= data.len() {
    let length = u32::from_be_bytes([data[pos], data[pos+1], data[pos+2], data[pos+3]]) as usize;
    if &data[pos + 4..pos + 8] == chunk_type {
      return Some(pos + 8);
    }
    pos += 12 + length;
  }
  None
}

fn find_webp_chunk(data: &[u8], chunk_type: &[u8; 4]) -> Option<usize> {
  let mut pos = 12;
  while pos + 8 <= data.len() {
    if &data[pos..pos + 4] == chunk_type {
      return Some(pos + 8);
    }
    let length = u32::from_le_bytes([data[pos + 4], data[pos + 5], data[pos + 6], data[pos + 7]]) as usize;
    pos += 8 + length + (length & 1);
  }
  None
}

fn parse_exif_orientation(data: &[u8]) -> Option<u8> {
  if data.len() < 8 {
    return None;
  }

  let big_endian = &data[0..2] == b"MM";

  let read_u16 = |offset: usize| -> Option<u16> {
    if offset + 2 > data.len() {
      return None;
    }
    Some(if big_endian {
      u16::from_be_bytes([data[offset], data[offset + 1]])
    } else {
      u16::from_le_bytes([data[offset], data[offset + 1]])
    })
  };

  let ifd_offset = if big_endian {
    u32::from_be_bytes([data[4], data[5], data[6], data[7]]) as usize
  } else {
    u32::from_le_bytes([data[4], data[5], data[6], data[7]]) as usize
  };

  if ifd_offset >= data.len() {
    return None;
  }

  let num_entries = read_u16(ifd_offset)?;

  for i in 0..num_entries.min(20) { // Limit to prevent DoS
    let entry_offset = ifd_offset + 2 + (i as usize * 12);
    if entry_offset + 12 > data.len() {
      break;
    }

    let tag = read_u16(entry_offset)?;
    if tag == 0x0112 {
      return Some(read_u16(entry_offset + 8)? as u8);
    }
  }

  None
}
