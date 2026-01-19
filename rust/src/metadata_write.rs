//! Metadata/EXIF writing support for images
//! Supports writing EXIF data to WebP, JPEG, and PNG formats
//! Uses img-parts crate for chunk manipulation

use crate::error::ImageError;
use img_parts::{jpeg::Jpeg, png::Png, webp::WebP, Bytes, ImageEXIF};

/// EXIF field IDs (TIFF tags)
pub mod exif_tags {
    pub const IMAGE_DESCRIPTION: u16 = 0x010E;
    pub const MAKE: u16 = 0x010F;
    pub const MODEL: u16 = 0x0110;
    pub const ORIENTATION: u16 = 0x0112;
    pub const SOFTWARE: u16 = 0x0131;
    pub const DATE_TIME: u16 = 0x0132;
    pub const ARTIST: u16 = 0x013B;
    pub const COPYRIGHT: u16 = 0x8298;
    pub const EXIF_IFD: u16 = 0x8769;
    pub const DATE_TIME_ORIGINAL: u16 = 0x9003;
    pub const USER_COMMENT: u16 = 0x9286;
}

/// User-provided EXIF fields for writing
#[derive(Debug, Clone, Default)]
pub struct ExifWriteOptions {
    pub image_description: Option<String>,
    pub artist: Option<String>,
    pub copyright: Option<String>,
    pub software: Option<String>,
    pub date_time: Option<String>,
    pub date_time_original: Option<String>,
    pub user_comment: Option<String>,
    pub make: Option<String>,
    pub model: Option<String>,
    pub orientation: Option<u16>,
}

impl ExifWriteOptions {
    pub fn is_empty(&self) -> bool {
        self.image_description.is_none()
            && self.artist.is_none()
            && self.copyright.is_none()
            && self.software.is_none()
            && self.date_time.is_none()
            && self.date_time_original.is_none()
            && self.user_comment.is_none()
            && self.make.is_none()
            && self.model.is_none()
            && self.orientation.is_none()
    }
}

/// Build raw EXIF bytes from ExifWriteOptions
/// Creates a minimal valid EXIF structure with IFD0 entries
pub fn build_exif_bytes(options: &ExifWriteOptions) -> Vec<u8> {
    let mut entries: Vec<(u16, Vec<u8>)> = Vec::new();

    // Add string fields
    if let Some(ref desc) = options.image_description {
        entries.push((exif_tags::IMAGE_DESCRIPTION, string_to_ascii(desc)));
    }
    if let Some(ref artist) = options.artist {
        entries.push((exif_tags::ARTIST, string_to_ascii(artist)));
    }
    if let Some(ref copyright) = options.copyright {
        entries.push((exif_tags::COPYRIGHT, string_to_ascii(copyright)));
    }
    if let Some(ref software) = options.software {
        entries.push((exif_tags::SOFTWARE, string_to_ascii(software)));
    }
    if let Some(ref dt) = options.date_time {
        entries.push((exif_tags::DATE_TIME, string_to_ascii(dt)));
    }
    if let Some(ref make) = options.make {
        entries.push((exif_tags::MAKE, string_to_ascii(make)));
    }
    if let Some(ref model) = options.model {
        entries.push((exif_tags::MODEL, string_to_ascii(model)));
    }

    // Orientation (SHORT type)
    if let Some(orientation) = options.orientation {
        entries.push((exif_tags::ORIENTATION, vec![
            (orientation & 0xFF) as u8,
            ((orientation >> 8) & 0xFF) as u8,
        ]));
    }

    // Build minimal EXIF structure
    build_tiff_exif(&entries, options)
}

/// Convert string to null-terminated ASCII bytes
fn string_to_ascii(s: &str) -> Vec<u8> {
    let mut bytes = s.as_bytes().to_vec();
    bytes.push(0); // Null terminator
    bytes
}

/// Build a minimal TIFF/EXIF structure
fn build_tiff_exif(ifd0_entries: &[(u16, Vec<u8>)], options: &ExifWriteOptions) -> Vec<u8> {
    let mut exif = Vec::new();

    // TIFF header (little-endian)
    exif.extend_from_slice(b"II");           // Little-endian marker
    exif.extend_from_slice(&42u16.to_le_bytes()); // TIFF magic number
    exif.extend_from_slice(&8u32.to_le_bytes());  // Offset to IFD0

    // Check if we need EXIF IFD for UserComment/DateTimeOriginal
    let needs_exif_ifd = options.user_comment.is_some() || options.date_time_original.is_some();

    // Count IFD0 entries (add 1 for EXIF IFD pointer if needed)
    let ifd0_count = ifd0_entries.len() as u16 + if needs_exif_ifd { 1 } else { 0 };

    // IFD0 entry count
    exif.extend_from_slice(&ifd0_count.to_le_bytes());

    // Calculate data offset (after IFD0 entries and next IFD pointer)
    // Each entry is 12 bytes, plus 2 bytes for count, plus 4 bytes for next IFD
    let mut data_offset = 8 + 2 + (ifd0_count as u32 * 12) + 4;

    // Collect data that doesn't fit inline (> 4 bytes)
    let mut extra_data: Vec<u8> = Vec::new();

    // Write IFD0 entries
    for (tag, data) in ifd0_entries {
        let entry = build_ifd_entry(*tag, data, &mut data_offset, &mut extra_data);
        exif.extend_from_slice(&entry);
    }

    // Add EXIF IFD pointer if needed
    let exif_ifd_offset = if needs_exif_ifd {
        let offset = data_offset + extra_data.len() as u32;
        let entry = [
            (exif_tags::EXIF_IFD & 0xFF) as u8,
            ((exif_tags::EXIF_IFD >> 8) & 0xFF) as u8,
            4, 0,  // Type = LONG
            1, 0, 0, 0,  // Count = 1
            (offset & 0xFF) as u8,
            ((offset >> 8) & 0xFF) as u8,
            ((offset >> 16) & 0xFF) as u8,
            ((offset >> 24) & 0xFF) as u8,
        ];
        exif.extend_from_slice(&entry);
        Some(offset)
    } else {
        None
    };

    // Next IFD offset (0 = no more IFDs)
    exif.extend_from_slice(&0u32.to_le_bytes());

    // Append extra data
    exif.extend_from_slice(&extra_data);

    // Write EXIF IFD if needed
    if let Some(_offset) = exif_ifd_offset {
        let mut exif_entries: Vec<(u16, Vec<u8>)> = Vec::new();

        if let Some(ref dt) = options.date_time_original {
            exif_entries.push((exif_tags::DATE_TIME_ORIGINAL, string_to_ascii(dt)));
        }

        if let Some(ref comment) = options.user_comment {
            // UserComment has special encoding: 8 bytes charset + data
            let mut uc_data = vec![0x41, 0x53, 0x43, 0x49, 0x49, 0x00, 0x00, 0x00]; // "ASCII\0\0\0"
            uc_data.extend_from_slice(comment.as_bytes());
            exif_entries.push((exif_tags::USER_COMMENT, uc_data));
        }

        // EXIF IFD entry count
        let exif_ifd_count = exif_entries.len() as u16;
        exif.extend_from_slice(&exif_ifd_count.to_le_bytes());

        // Calculate data offset for EXIF IFD
        let mut exif_data_offset = exif.len() as u32 + (exif_ifd_count as u32 * 12) + 4;
        let mut exif_extra_data: Vec<u8> = Vec::new();

        for (tag, data) in &exif_entries {
            let entry = build_ifd_entry(*tag, data, &mut exif_data_offset, &mut exif_extra_data);
            exif.extend_from_slice(&entry);
        }

        // Next IFD offset (0 = end)
        exif.extend_from_slice(&0u32.to_le_bytes());

        // Append EXIF IFD extra data
        exif.extend_from_slice(&exif_extra_data);
    }

    exif
}

/// Build a single IFD entry (12 bytes)
fn build_ifd_entry(tag: u16, data: &[u8], data_offset: &mut u32, extra_data: &mut Vec<u8>) -> [u8; 12] {
    let mut entry = [0u8; 12];

    // Tag (2 bytes)
    entry[0] = (tag & 0xFF) as u8;
    entry[1] = ((tag >> 8) & 0xFF) as u8;

    // Determine type based on tag
    let (type_id, count) = match tag {
        exif_tags::ORIENTATION => (3u16, 1u32), // SHORT
        exif_tags::USER_COMMENT => (7u16, data.len() as u32), // UNDEFINED
        _ => (2u16, data.len() as u32), // ASCII
    };

    // Type (2 bytes)
    entry[2] = (type_id & 0xFF) as u8;
    entry[3] = ((type_id >> 8) & 0xFF) as u8;

    // Count (4 bytes)
    entry[4] = (count & 0xFF) as u8;
    entry[5] = ((count >> 8) & 0xFF) as u8;
    entry[6] = ((count >> 16) & 0xFF) as u8;
    entry[7] = ((count >> 24) & 0xFF) as u8;

    // Value/Offset (4 bytes)
    let value_size = match type_id {
        3 => 2 * count, // SHORT = 2 bytes each
        _ => count,     // ASCII/UNDEFINED = 1 byte each
    };

    if value_size <= 4 {
        // Value fits inline
        for (i, &byte) in data.iter().take(4).enumerate() {
            entry[8 + i] = byte;
        }
    } else {
        // Store offset to data
        let offset = *data_offset + extra_data.len() as u32;
        entry[8] = (offset & 0xFF) as u8;
        entry[9] = ((offset >> 8) & 0xFF) as u8;
        entry[10] = ((offset >> 16) & 0xFF) as u8;
        entry[11] = ((offset >> 24) & 0xFF) as u8;

        // Append data to extra_data
        extra_data.extend_from_slice(data);

        // Pad to word boundary
        if data.len() % 2 != 0 {
            extra_data.push(0);
        }
    }

    entry
}

/// Write EXIF data to a WebP image
pub fn write_webp_exif(data: &[u8], exif_options: &ExifWriteOptions) -> Result<Vec<u8>, ImageError> {
    if exif_options.is_empty() {
        return Ok(data.to_vec());
    }

    let mut webp = WebP::from_bytes(Bytes::copy_from_slice(data))
        .map_err(|e| ImageError::ProcessingError(format!("Failed to parse WebP: {}", e)))?;

    let exif_bytes = build_exif_bytes(exif_options);
    webp.set_exif(Some(Bytes::from(exif_bytes)));

    Ok(webp.encoder().bytes().to_vec())
}

/// Write EXIF data to a JPEG image
pub fn write_jpeg_exif(data: &[u8], exif_options: &ExifWriteOptions) -> Result<Vec<u8>, ImageError> {
    if exif_options.is_empty() {
        return Ok(data.to_vec());
    }

    let mut jpeg = Jpeg::from_bytes(Bytes::copy_from_slice(data))
        .map_err(|e| ImageError::ProcessingError(format!("Failed to parse JPEG: {}", e)))?;

    let exif_bytes = build_exif_bytes(exif_options);
    jpeg.set_exif(Some(Bytes::from(exif_bytes)));

    Ok(jpeg.encoder().bytes().to_vec())
}

/// Write metadata to a PNG image using tEXt chunks
/// PNG doesn't use EXIF, but we can add tEXt/iTXt chunks for metadata
#[allow(dead_code)]
pub fn write_png_metadata(data: &[u8], exif_options: &ExifWriteOptions) -> Result<Vec<u8>, ImageError> {
    if exif_options.is_empty() {
        return Ok(data.to_vec());
    }

    let png = Png::from_bytes(Bytes::copy_from_slice(data))
        .map_err(|e| ImageError::ProcessingError(format!("Failed to parse PNG: {}", e)))?;

    // PNG uses tEXt chunks, but img-parts doesn't directly support them
    // For now, we'll encode EXIF-like data using XMP or return as-is
    // TODO: Add proper tEXt chunk support

    // For WebP-style EXIF embedding (some viewers support this)
    // Most PNG tools expect tEXt chunks instead

    Ok(png.encoder().bytes().to_vec())
}

/// Strip all EXIF data from a WebP image
pub fn strip_webp_exif(data: &[u8]) -> Result<Vec<u8>, ImageError> {
    let mut webp = WebP::from_bytes(Bytes::copy_from_slice(data))
        .map_err(|e| ImageError::ProcessingError(format!("Failed to parse WebP: {}", e)))?;

    webp.set_exif(None);

    Ok(webp.encoder().bytes().to_vec())
}

/// Strip all EXIF data from a JPEG image
pub fn strip_jpeg_exif(data: &[u8]) -> Result<Vec<u8>, ImageError> {
    let mut jpeg = Jpeg::from_bytes(Bytes::copy_from_slice(data))
        .map_err(|e| ImageError::ProcessingError(format!("Failed to parse JPEG: {}", e)))?;

    jpeg.set_exif(None);

    Ok(jpeg.encoder().bytes().to_vec())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_build_exif_bytes() {
        let options = ExifWriteOptions {
            image_description: Some("Test image".to_string()),
            artist: Some("Test Artist".to_string()),
            software: Some("imgkit".to_string()),
            ..Default::default()
        };

        let exif = build_exif_bytes(&options);

        // Should start with TIFF header "II" (little-endian)
        assert_eq!(&exif[0..2], b"II");
        // Magic number 42
        assert_eq!(exif[2], 42);
        assert_eq!(exif[3], 0);
    }

    #[test]
    fn test_empty_options() {
        let options = ExifWriteOptions::default();
        assert!(options.is_empty());
    }
}
