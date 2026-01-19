//! Error handling for imgkit

use napi::Error;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ImageError {
  #[error("Failed to decode image: {0}")]
  DecodeError(String),

  #[error("Failed to encode image: {0}")]
  EncodeError(String),

  #[error("Invalid image dimensions: {0}")]
  InvalidDimensions(String),

  #[error("Unsupported format: {0}")]
  UnsupportedFormat(String),

  #[error("Processing error: {0}")]
  ProcessingError(String),

  #[error("IO error: {0}")]
  IoError(#[from] std::io::Error),
}

impl From<image::ImageError> for ImageError {
  fn from(err: image::ImageError) -> Self {
    match err {
      image::ImageError::Decoding(_) => ImageError::DecodeError(err.to_string()),
      image::ImageError::Encoding(_) => ImageError::EncodeError(err.to_string()),
      image::ImageError::Unsupported(_) => ImageError::UnsupportedFormat(err.to_string()),
      image::ImageError::Limits(_) => ImageError::InvalidDimensions(err.to_string()),
      _ => ImageError::ProcessingError(err.to_string()),
    }
  }
}

impl From<ImageError> for Error {
  fn from(err: ImageError) -> Self {
    Error::from_reason(err.to_string())
  }
}
