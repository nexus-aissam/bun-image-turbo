# Changelog

All notable changes to bun-image-turbo.

## [1.2.0] - 2025-12-12

### Documentation

- **New Architecture Guide** - Deep dive into tech stack, processing pipeline, and key optimizations
- **Fixed resize() documentation** - Clarified that output is always PNG format
- **Fixed transform() documentation** - `output` is optional (defaults to PNG), added GIF/BMP examples
- **Fixed formats guide** - Removed non-existent `toGif()`, use `transform()` instead
- **Enhanced performance guide** - Added technical details about shrink-on-decode, multi-step resize, and adaptive algorithm selection
- **Updated API reference** - Added `version()` function documentation
- **Fixed platform support tables** - All platforms are supported, HEIC only on macOS ARM64
- **Added VitePress documentation site** - Professional docs with GitHub Pages deployment

### Fixed

- ESM module configuration for VitePress 1.6+

---

## [1.2.0] - 2024

### Added

- **HEIC/HEIF Support** - Native support for Apple's modern image format (macOS ARM64)
- **Blurhash Generation** - Create compact image placeholder strings
- **AVIF Support** - Read AVIF images via libheif

### Changed

- Improved metadata extraction performance (950x faster for WebP)
- Better error messages for unsupported formats

### Platform Support

- macOS ARM64 (M1/M2/M3/M4/M5) - Full support including HEIC
- macOS x64 (Intel) - Full support except HEIC
- Linux x64 (glibc) - Full support except HEIC
- Linux x64 (musl/Alpine) - Full support except HEIC
- Linux ARM64 (glibc) - Full support except HEIC
- Windows x64 - Full support except HEIC
- Windows ARM64 - Full support except HEIC

---

## [1.1.0] - 2024

### Added

- `transform()` function for multi-operation pipelines
- Brightness and contrast adjustments
- Blur and sharpen effects
- Sync versions of all functions

### Improved

- Resize quality with lanczos3 filter
- Memory usage optimization
- Better TypeScript types

---

## [1.0.0] - 2024

### Initial Release

- `metadata()` - Fast image metadata extraction
- `resize()` - High-quality image resizing
- `toJpeg()` - JPEG encoding with TurboJPEG
- `toPng()` - PNG encoding
- `toWebp()` - WebP encoding (lossy and lossless)
- Grayscale conversion
- Rotation (90, 180, 270 degrees)
- Horizontal and vertical flip

### Supported Formats

- JPEG (read/write)
- PNG (read/write)
- WebP (read/write)
- GIF (read/write)
- BMP (read/write)
- TIFF (read)
- ICO (read)

---

## Links

- [GitHub Releases](https://github.com/nexus-aissam/bun-image-turbo/releases)
- [npm Package](https://www.npmjs.com/package/bun-image-turbo)
