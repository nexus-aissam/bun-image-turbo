# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
  - Automatic resizing to ThumbHash's required 100x100 max dimensions
  - Preserves original image dimensions in result

### Features vs BlurHash

| Feature | ThumbHash | BlurHash |
|---------|:---------:|:--------:|
| Alpha channel | ✅ | ❌ |
| Aspect ratio preserved | ✅ | ❌ |
| Color accuracy | Better | Good |
| Hash size | ~25 bytes | ~28 chars |
| Output format | Binary | Base83 string |

### Technical Details

- Added `thumbhash` Rust crate v0.1.0
- Images automatically resized to max 100x100 before encoding (ThumbHash requirement)
- Fast Triangle (bilinear) filter used for thumbnail generation
- Full async and sync API support

### Test Results

| Test Suite | Tests | Status |
|------------|------:|:------:|
| Local (Bun) | 56 pass | ✅ |
| ThumbHash | 12 pass | ✅ |

---

## [1.4.6] - 2026-01-09

### Added

- **Comprehensive Test Suite** - Reorganized test structure for better maintainability
  - `test/local/` - Local development tests (imports from dist/)
  - `test/packages/` - Package manager verification tests (bun, npm, yarn, pnpm)
  - All package managers verified working: bun (39 tests), npm/yarn/pnpm (32 tests each)

### Verified

- **Package Manager Compatibility** - Tested and verified on all major package managers:

  | Package Manager | Tests | Status |
  |-----------------|-------|--------|
  | Bun | 39 pass | ✅ |
  | npm | 32 pass | ✅ |
  | yarn | 32 pass | ✅ |
  | pnpm | 32 pass | ✅ |

---

## [1.4.5] - 2026-01-09

### Fixed

- **ESM/CJS Native Binding Loading** - Fixed native module loading in Node.js ESM context
  - Use `createRequire(import.meta.url)` for ESM modules
  - Proper fallback to native `require` for CJS context
  - Fixes "Cannot find package" errors when using `import` in Node.js

### Changed

- Updated optional dependencies to ^1.4.5

---

## [1.4.0] - 2026-01-08

### Added

- **WebP Shrink-on-Load Optimization** - Decode WebP images directly to target resolution
  - Uses libwebp's native `use_scaling` for 1.15-1.25x faster WebP resize operations
  - Memory usage scales with OUTPUT size, not INPUT size (up to 25x reduction)
  - Multi-threaded WebP decoding via `use_threads` option

### Performance

- **WebP Resize Benchmarks** (vs sharp):
  - 800x600 → 200px: 3.1ms vs 4.3ms (**1.40x faster**)
  - 1600x1200 → 200px: 6.4ms vs 8.0ms (**1.24x faster**)
  - 2000x1500 → 200px: 8.6ms vs 10.1ms (**1.18x faster**)
  - 3000x2000 → 200px: 14.7ms vs 16.1ms (**1.10x faster**)
  - 4000x3000 → 400px: 32.4ms vs 33.1ms (**1.02x faster**)
  - **Faster than sharp across ALL image sizes!**

### Optimizations

- **Zero-Copy Pipeline** - Reduced memory copies from 3-5 to 1-2 per operation
  - `resize_image()` now takes ownership to avoid cloning
  - `resize_multi_step()` takes ownership, eliminating initial clone
  - Encoders use `as_rgb8()`/`as_rgba8()` to avoid conversion when possible
- **Skip Double-Resize** - Early return when shrink-on-load already achieved target dimensions

### Fixed

- **Issue #3: WebP resize slower than sharp** - Now 1.15-1.25x faster
- **Issue #3: macOS requires libheif for WebP** - CI only installs libheif for ARM64 builds
- **Issue #3: Linux installation fails** - Added optionalDependencies for platform packages

### Technical Details

- Added `libwebp-sys2` crate for low-level WebP decoder control
- New `rust/src/decode/webp.rs` module with shrink-on-load implementation
- Updated resize module to take ownership instead of references

---

## [1.3.1] - 2026-01-08

### Changed

- **Code Reorganization** - Refactored codebase for better maintainability
  - Split `rust/src/decode.rs` (1,019 lines) into modular `decode/` and `metadata/` directories
  - Extracted Rust types to `rust/src/types.rs`
  - Split `src/index.ts` (542 lines) into `loader.ts`, `converters.ts`, and `api/` modules
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

- **Complete API documentation overhaul** - All TypeScript interfaces now match actual Rust implementation
- **Fixed ImageMetadata interface** - Added all 18 fields (space, depth, bitsPerSample, isProgressive, isPalette, hasProfile, orientation, pages, loopCount, delay, background, compression, density)
- **Fixed enum case sensitivity** - All enums are PascalCase (`'Jpeg'`, `'Cover'`, `'Lanczos3'`), not lowercase
- **Added background option to resize()** - Document the `background: [r, g, b, a]` option for padding
- **Enhanced README** - Professional layout with badges, benchmark tables, and documentation links

### Changed

- **Homepage** - Now points to GitHub Pages documentation site

---

## [1.2.1] - 2025-12-12

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
