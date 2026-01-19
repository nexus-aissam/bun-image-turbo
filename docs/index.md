---
layout: home

hero:
  name: imgkit
  text: High-Performance Image Processing
  tagline: Native Rust library for Bun and Node.js. Up to 950x faster than alternatives.
  image:
    src: /logo.svg
    alt: imgkit
  actions:
    - theme: brand
      text: Get Started
      link: /guide/
    - theme: alt
      text: API Reference
      link: /api/
    - theme: alt
      text: GitHub
      link: https://github.com/nexus-aissam/imgkit

features:
  - icon: ⚡
    title: TurboJPEG with SIMD
    details: Uses libjpeg-turbo with SSE2/AVX2/NEON acceleration for 2-6x faster JPEG encoding and decoding than pure Rust implementations.
    link: /guide/performance
    linkText: Learn more
  - icon: 📱
    title: Native HEIC Support
    details: The only high-performance library with native HEIC/HEIF decoding via libheif. Read iPhone photos directly without conversion tools.
    link: /guide/heic
    linkText: Learn more
  - icon: 🔬
    title: Shrink-on-Decode
    details: Decodes JPEG, WebP, and HEIC images at reduced resolution when resizing. Processes fewer pixels for dramatically faster thumbnails.
    link: /guide/performance
    linkText: Learn more
  - icon: 🎯
    title: Adaptive Algorithms
    details: Automatically selects optimal resize filters based on scale factor. Uses Box filter for large downscales, Lanczos3 for quality.
    link: /guide/resizing
    linkText: Learn more
  - icon: 🖼️
    title: Multi-Step Resize
    details: For large scale reductions, uses progressive halving with Box filter before final pass. Matches libvips/sharp performance patterns.
    link: /guide/resizing
    linkText: Learn more
  - icon: ✂️
    title: Zero-Copy Cropping
    details: Ultra-fast image cropping with aspect ratio and gravity support. Crop first, then resize - the pipeline is optimized for maximum performance.
    link: /api/crop
    linkText: Learn more
  - icon: 🔷
    title: Blurhash & ThumbHash
    details: Built-in compact placeholder generation. Create tiny hash strings that decode to blurred preview images for progressive loading.
    link: /api/blurhash
    linkText: Learn more
  - icon: 🧠
    title: ML Tensor Conversion
    details: First JavaScript package with native SIMD-accelerated image-to-tensor conversion. Built-in ImageNet, CLIP normalization for PyTorch, TensorFlow, ONNX.
    link: /api/tensor
    linkText: Learn more
---

<div class="vp-doc" style="padding: 0 24px;">

## Why imgkit?

Built from the ground up for **maximum performance**, imgkit uses native Rust with carefully optimized codepaths for each operation.

### Architecture Highlights

| Component | Technology | Benefit |
|-----------|------------|---------|
| **JPEG Codec** | TurboJPEG (libjpeg-turbo) | SIMD acceleration (SSE2/AVX2/NEON) |
| **Resize Engine** | fast_image_resize + Rayon | Multi-threaded with adaptive algorithms |
| **WebP Codec** | libwebp bindings | Google's optimized encoder/decoder |
| **HEIC Decoder** | libheif-rs | Native Apple format support |
| **Node Bindings** | napi-rs | Zero-copy buffer handling |

### Performance Benchmarks

Tested on Apple M1 Pro with Bun 1.3.3:

| Operation | imgkit | sharp | Speedup |
|-----------|---------------:|------:|:-------:|
| **WebP Metadata** | 0.004ms | 3.4ms | **950x** |
| **JPEG Metadata** | 0.003ms | 0.1ms | **38x** |
| **50 Concurrent Ops** | 62ms | 160ms | **2.6x** |
| **Transform Pipeline** | 12.2ms | 19.1ms | **1.6x** |
| **1MB JPEG → 800px** | 12.6ms | 20.3ms | **1.6x** |
| **Thumbnail (200px)** | 8.8ms | 10.7ms | **1.2x** |

### WebP Resize

| Source Size | Target | imgkit | sharp | Speedup |
|-------------|--------|---------------:|------:|:-------:|
| 800x600 | 200px | **3.1ms** | 4.3ms | **1.40x** |
| 1600x1200 | 200px | **6.4ms** | 8.0ms | **1.24x** |
| 2000x1500 | 200px | **8.6ms** | 10.1ms | **1.18x** |
| 3000x2000 | 200px | **14.7ms** | 16.1ms | **1.10x** |
| 4000x3000 | 400px | **32.4ms** | 33.1ms | **1.02x** |

> Shrink-on-load optimization using libwebp's native scaling - **faster than sharp across ALL sizes!**

### HEIC Support (Exclusive Feature)

imgkit is the **only** high-performance image library with native HEIC support:

| Operation | Time | Notes |
|-----------|-----:|:------|
| **HEIC Metadata** | 0.1ms | Header-only parsing |
| **HEIC → JPEG** | 169ms | Full quality conversion |
| **HEIC → 800px** | 138ms | Shrink-on-decode optimization |
| **HEIC → Thumbnail** | 137ms | Fast 200px generation |

> **Note:** sharp does NOT support HEIC/HEIF files!

## Quick Start

```bash
bun add imgkit
```

```typescript
import { metadata, resize, crop, transform, thumbhash, toTensor } from 'imgkit';

// Read image
const buffer = Buffer.from(await Bun.file('photo.jpg').arrayBuffer());

// Get metadata (header-only, ultra-fast)
const info = await metadata(buffer);
console.log(`${info.width}x${info.height} ${info.format}`);

// Crop to aspect ratio (zero-copy, ultra-fast)
const squared = await crop(buffer, { aspectRatio: "1:1" });

// Resize with shrink-on-decode optimization
const thumbnail = await resize(buffer, { width: 200 });

// Full transform pipeline with crop + resize
const result = await transform(buffer, {
  crop: { aspectRatio: "16:9" },
  resize: { width: 1280 },
  sharpen: 5,
  output: { format: 'WebP', webp: { quality: 85 } }
});

// Generate thumbhash placeholder (better than blurhash)
const { dataUrl } = await thumbhash(buffer);
// Use directly: <img src={dataUrl} />

// ML tensor conversion (first JS package with native SIMD!)
const tensor = await toTensor(buffer, {
  width: 224, height: 224,
  normalization: 'Imagenet',
  layout: 'Chw', batch: true
});
// Shape: [1, 3, 224, 224] - Ready for PyTorch/ONNX!
```

## Supported Formats

| Format | Read | Write | Notes |
|--------|:----:|:-----:|-------|
| JPEG | ✅ | ✅ | TurboJPEG with SIMD |
| PNG | ✅ | ✅ | Adaptive compression |
| WebP | ✅ | ✅ | Lossy & lossless |
| HEIC/HEIF | ✅ | ❌ | macOS ARM64 only |
| AVIF | ✅ | ❌ | Via libheif |
| GIF | ✅ | ✅ | Animated support |
| BMP | ✅ | ✅ | Full support |

## Platform Support

Prebuilt binaries are available for all major platforms:

| Platform | Architecture | Supported | HEIC |
|----------|--------------|:---------:|:----:|
| macOS | ARM64 (M1/M2/M3/M4/M5)  | ✅ | ✅ |
| macOS | x64 (Intel) | ✅ | ❌ |
| Linux | x64 (glibc) | ✅ | ❌ |
| Linux | x64 (musl/Alpine) | ✅ | ❌ |
| Linux | ARM64 (glibc) | ✅ | ❌ |
| Windows | x64 | ✅ | ❌ |
| Windows | ARM64 | ✅ | ❌ |

> **Note:** HEIC/HEIF decoding is only available on macOS ARM64. All other image formats (JPEG, PNG, WebP, GIF, BMP, TIFF) work on all platforms.

## Links

<div style="display: flex; gap: 16px; margin-top: 16px;">
  <a href="https://www.npmjs.com/package/imgkit" target="_blank" style="display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; background: #cb3837; color: white; border-radius: 6px; text-decoration: none; font-weight: 500;">
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M0 0v16h16V0H0zm13 13H8v-2H5v2H3V3h10v10z"/><path d="M5 5h3v6H5V5z"/></svg>
    npm
  </a>
  <a href="https://github.com/nexus-aissam/imgkit" target="_blank" style="display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; background: #24292f; color: white; border-radius: 6px; text-decoration: none; font-weight: 500;">
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
    GitHub
  </a>
</div>

</div>
