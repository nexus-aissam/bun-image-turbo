# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2025-12-11

### Added

- **HEIC/HEIF Support** - Native support for reading HEIC and HEIF image files
  - Decode iPhone photos and other HEIC/HEIF images
  - Convert HEIC to JPEG, PNG, or WebP
  - Full metadata extraction for HEIC files
  - Support for HEIC images with alpha channel
  - **Shrink-on-decode optimization** for faster resize operations

- **AVIF Support** - Read AVIF images via libheif
  - AVIF format detection and decoding
  - Metadata extraction for AVIF files

### Performance

- **HEIC → JPEG**: 169ms for 12MP iPhone photo
- **HEIC → 800px JPEG**: 138ms (25% faster with shrink-on-decode)
- **HEIC → 200px thumbnail**: 137ms
- **HEIC Metadata**: 0.1ms (instant)

### Technical Details

- Added `libheif-rs` v2.5 dependency (uses system libheif)
- Optimized pixel extraction with fast-path for contiguous memory
- HEIC shrink-on-decode via libheif's native scale() function
- HEIC detection via ftyp box examination (supports heic, heix, hevc, hevx, mif1, msf1, avif brands)
- Memory protection for large HEIC images (100 megapixel limit)
- RGB and RGBA output support based on source alpha channel

## [1.0.5] - 2025-12-10

### Fixed

- Add optional dependency package resolution for native bindings

## [1.0.4] - 2025-12-09

### Changed

- Bump version to 1.0.4

## [1.0.3] - 2025-12-08

### Added

- Examples folder with demos
- Sync Cargo.toml version

### Changed

- Documentation improvements with badges

## [1.0.0] - 2025-12-01

### Added

- Initial release
- High-performance image processing with Rust and napi-rs
- JPEG encoding/decoding with TurboJPEG (libjpeg-turbo SIMD)
- PNG encoding/decoding with adaptive compression
- WebP encoding/decoding (lossy and lossless)
- GIF, BMP, ICO, TIFF read support
- Image resizing with multiple algorithms (Nearest, Bilinear, CatmullRom, Mitchell, Lanczos3)
- Transform pipeline (resize, rotate, flip, grayscale, blur, sharpen, brightness, contrast)
- Blurhash generation
- Both async and sync APIs
- Full TypeScript support
- Cross-platform support (macOS, Linux, Windows)
