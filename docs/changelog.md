# Changelog

All notable changes to bun-image-turbo.

## [1.7.9] - 2026-01-15

### Changed

- **Upgraded to napi-rs v3** - Major upgrade to the latest napi-rs framework
  - `napi` upgraded from v2 to v3.8.2
  - `napi-derive` upgraded from v2 to v3.5.1
  - `@napi-rs/cli` upgraded from v2.18.4 to v3.5.1
  - Enables future streaming features (ReadableStream, AsyncGenerator)
  - Better async/await patterns with improved lifetime management

### Fixed

- Added explicit `#[derive(Clone)]` to all string enums for napi-rs v3 compatibility
- Removed deprecated `napi.name` field from package.json

### Test Results

- **87 tests pass** - All existing functionality verified with napi-rs v3

---

## [1.7.1] - 2026-01-13

### Added

- **ML Tensor Conversion** - First JavaScript package with native SIMD-accelerated image-to-tensor conversion
  - `toTensor()` / `toTensorSync()` - Convert images to tensor format for ML frameworks
  - **Built-in normalization presets:**
    - `Imagenet` - ResNet, VGG, EfficientNet (mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    - `Clip` - CLIP, OpenCLIP, BLIP models (mean=[0.481, 0.458, 0.408], std=[0.269, 0.261, 0.276])
    - `ZeroOne` - Values in [0, 1] range
    - `NegOneOne` - Values in [-1, 1] range
  - **Layout support:**
    - `Chw` - Channel-first for PyTorch, ONNX Runtime
    - `Hwc` - Channel-last for TensorFlow.js
  - **Data types:** `Float32` (default) and `Uint8`
  - **Optional batch dimension** for inference-ready tensors
  - Helper methods: `toFloat32Array()`, `toUint8Array()`

### Performance

Benchmarks on Apple M3 Pro (800x600 JPEG input):

| Operation | Time | Throughput |
|-----------|------|------------|
| 224x224 ImageNet | 12.5ms | 80 img/s |
| 224x224 Uint8 | 5.2ms | 192 img/s |
| 384x384 ImageNet | 33.0ms | 30 img/s |
| 1920x1080 → 224x224 | 25.8ms | 39 img/s |

**10-16x faster than JavaScript-based alternatives!**

### Why This Matters

- **No manual normalization** - Built-in presets for popular models
- **SIMD optimization** - Native Rust with parallel channel processing via Rayon
- **Shrink-on-load** - Large images downscaled during decode
- **Zero-copy** - Minimal memory allocations
- **Type-safe** - Full TypeScript support with proper types

### Test Results

- **87 tests pass** (10 new toTensor tests)
- All normalization presets verified
- Both layouts (CHW/HWC) and dtypes (Float32/Uint8) tested

---

## [1.6.0] - 2026-01-13

### Added

- **Cropping API** - Zero-copy image cropping with multiple modes
  - `crop()` / `cropSync()` - Extract regions from images
  - **Three cropping modes:**
    - Explicit coordinates: `{ x: 100, y: 50, width: 400, height: 300 }`
    - Aspect ratio: `{ aspectRatio: "16:9" }` or `{ aspectRatio: "1:1" }`
    - Dimensions with gravity: `{ width: 500, height: 500, gravity: "Center" }`
  - **9 gravity options:** Center, North, South, East, West, NorthWest, NorthEast, SouthWest, SouthEast
  - Crop support in `transform()` pipeline - crop is applied first for maximum performance

### Performance

- **Zero-copy cropping** using `crop_imm()` - essentially free operation (just pointer arithmetic)
- **Optimized transform pipeline** - crop → resize order reduces pixels for subsequent operations
- **Improved brightness adjustment** - replaced manual loop with optimized `brighten()` builtin (5x faster)
- **ThumbHash shrink-on-load** - decode at 100x100 max before hash generation

### Code Quality

- Added `#[inline(always)]` to hot encode functions
- Cleaner transform pipeline with crop-first architecture

### Test Results

- **64 tests pass** (8 new crop tests, 2 new transform+crop tests)
- All async and sync functions verified

---

## [1.5.0] - 2026-01-10

### Added

- **ThumbHash Support** - Generate smoother, more visually pleasing image placeholders
  - `thumbhash()` / `thumbhashSync()` - Generate ThumbHash from any image
  - `thumbhashToRgba()` / `thumbhashToRgbaSync()` - Decode ThumbHash to RGBA pixels
  - `thumbhashToDataUrl()` - Convert ThumbHash to data URL for inline use
  - Returns ready-to-use `dataUrl` for immediate display in HTML/CSS

### ThumbHash vs BlurHash

| Feature | ThumbHash | BlurHash |
|---------|-----------|----------|
| Alpha channel | ✅ Yes | ❌ No |
| Aspect ratio preserved | ✅ Yes | ❌ No |
| Color accuracy | Better | Good |
| Hash size | ~25 bytes | ~28 chars |

### Test Results

- **56 tests pass** (including 12 new ThumbHash tests)
- All async and sync functions verified

---

## [1.4.6] - 2026-01-09

### Added

- **Comprehensive Test Suite** - Reorganized test structure
  - `test/local/` - Local development tests
  - `test/packages/` - Package manager verification (bun, npm, yarn, pnpm)

### Verified

- **All Package Managers Working**:
  - Bun: 39 tests pass ✅
  - npm: 32 tests pass ✅
  - yarn: 32 tests pass ✅
  - pnpm: 32 tests pass ✅

---

## [1.4.5] - 2026-01-09

### Fixed

- **ESM/CJS Native Binding Loading** - Fixed native module loading in Node.js ESM context
  - Use `createRequire(import.meta.url)` for ESM modules
  - Proper fallback to native `require` for CJS context
  - Fixes "Cannot find package" errors when using `import` in Node.js

---

## [1.4.0] - 2026-01-08

### Added

- **WebP Shrink-on-Load Optimization** - Decode WebP images directly to target resolution
  - Uses libwebp's native `use_scaling` for 1.15-1.25x faster WebP resize operations
  - Memory usage scales with OUTPUT size, not INPUT size (up to 25x reduction)

### Performance

- **WebP Resize** now **1.15-1.25x faster** than sharp on average
- Zero-copy pipeline reduces memory copies from 3-5 to 1-2 per operation

### Fixed

- Issue #3: WebP resize slower than sharp - Now faster!
- Issue #3: macOS requires libheif for WebP - CI only installs libheif for ARM64
- Issue #3: Linux installation fails - Added optionalDependencies

---

## [1.3.1] - 2026-01-08

### Changed

- **Code Reorganization** - Refactored codebase for better maintainability
  - Split `rust/src/decode.rs` into modular `decode/` and `metadata/` directories
  - Extracted Rust types to `rust/src/types.rs`
  - Split `src/index.ts` into `loader.ts`, `converters.ts`, and `api/` modules
  - No API changes - all functionality preserved
- Removed unused code and fixed Rust compiler warnings

---

## [1.3.0] - 2026-01-07

### Added

- **EXIF Metadata Writing** - Write EXIF metadata to JPEG and WebP images
  - `writeExif()` / `writeExifSync()` - Add EXIF metadata to images
  - `stripExif()` / `stripExifSync()` - Remove all EXIF metadata from images
  - Perfect for AI-generated image attribution and metadata embedding
  - Supports: ImageDescription, Artist, Copyright, Software, DateTime, UserComment, Make, Model, Orientation
  - Use `transform()` with `exif` option to add metadata during processing

### Technical Details

- Added `img-parts` crate for EXIF chunk manipulation
- EXIF data built using proper TIFF/IFD0 structure
- UserComment field supports JSON storage for AI generation parameters
- Full async and sync API support

---

## [1.2.2] - 2025-12-12

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
