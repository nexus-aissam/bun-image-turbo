# bun-image-turbo

High-performance image processing for Bun and Node.js, built with Rust and napi-rs.

[![npm version](https://badge.fury.io/js/bun-image-turbo.svg)](https://www.npmjs.com/package/bun-image-turbo)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **Fast** - Built with Rust for maximum performance
- **Modern Formats** - JPEG, PNG, WebP, GIF, BMP support
- **Resize** - High-quality resizing with multiple algorithms (Lanczos3, Mitchell, etc.)
- **Transform** - Rotate, flip, blur, sharpen, grayscale, brightness, contrast
- **Blurhash** - Generate compact image placeholders
- **Async & Sync** - Both async and sync APIs available
- **TypeScript** - Full TypeScript support with strict types
- **Cross-platform** - macOS, Linux, Windows support

## Benchmarks

Tested on Apple M1 Pro with Bun 1.3.3 (compared to sharp v0.34.5):

### Performance Summary

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    bun-image-turbo vs sharp Performance                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ Metadata Extraction     ████████████████████████████████████  36x faster    │
│ Transform Pipeline      ████████████████████                   3.4x faster  │
│ Concurrent (50 ops)     ██████████████████████████             4.5x faster  │
│ JPEG Encode             ██████████████                         1.9x faster  │
│ Thumbnail Resize        ████████████                           1.9x faster  │
│ Blurhash Generation     ████████████████████ (4,283 ops/sec)   N/A in sharp │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Detailed Benchmarks (ops/sec - higher is better)

| Operation | bun-image-turbo | sharp | Winner |
|-----------|---------------:|------:|:------:|
| **Metadata Extraction** | 350,000 ops/sec | 9,600 ops/sec | **36x faster** |
| **Transform Pipeline** | 454 ops/sec | 134 ops/sec | **3.4x faster** |
| **JPEG Encode** | 553 ops/sec | 287 ops/sec | **1.9x faster** |
| **Thumbnail (200px)** | 386 ops/sec | 201 ops/sec | **1.9x faster** |
| **PNG Encode** | 235 ops/sec | 221 ops/sec | **1.06x faster** |
| **Blurhash** | 4,283 ops/sec | N/A | - |

### Concurrent Operations (High Load)

| Concurrency | bun-image-turbo | sharp | Throughput |
|------------:|----------------:|------:|:----------:|
| 50 parallel | 30ms total | 137ms total | **4.5x faster** |
| **Ops/sec** | **1,653 ops/sec** | 364 ops/sec | - |

### Real-World File Tests

| Operation | bun-image-turbo | sharp | Speedup |
|-----------|---------------:|------:|:-------:|
| 1MB JPEG Metadata | 0.003ms | 0.10ms | **36x faster** |
| 1MB JPEG Transform | 25.3ms | 30.5ms | **1.2x faster** |
| 10MB JPEG Metadata | 0.003ms | 0.10ms | **37x faster** |

### Key Strengths

- **36x faster** metadata extraction (header-only parsing)
- **4.5x faster** under concurrent load (server workloads)
- **3.4x faster** transform pipelines (resize + rotate + grayscale)
- **1.9x faster** JPEG encoding with TurboJPEG (libjpeg-turbo SIMD)
- Built-in **Blurhash** generation (4,283 ops/sec)
- Zero-copy buffer handling with Rust

> Run benchmarks yourself: `bun run bench`

## Installation

```bash
# Using Bun (recommended)
bun add bun-image-turbo

# Using npm
npm install bun-image-turbo

# Using yarn
yarn add bun-image-turbo

# Using pnpm
pnpm add bun-image-turbo
```

## Quick Start

```typescript
import { resize, toWebp, metadata, transform } from 'bun-image-turbo';

// Read image
const input = await Bun.file('input.jpg').arrayBuffer();
const buffer = Buffer.from(input);

// Get metadata
const info = await metadata(buffer);
console.log(`${info.width}x${info.height} ${info.format}`);

// Resize image
const resized = await resize(buffer, { width: 800 });

// Convert to WebP
const webp = await toWebp(buffer, { quality: 85 });

// Apply multiple transformations
const result = await transform(buffer, {
  resize: { width: 400, height: 300 },
  rotate: 90,
  grayscale: true,
  output: { format: 'webp', webp: { quality: 80 } }
});

// Save result
await Bun.write('output.webp', result);
```

## API Reference

### `metadata(input)` / `metadataSync(input)`

Get image metadata.

```typescript
const info = await metadata(imageBuffer);
// { width: 1920, height: 1080, format: 'jpeg', hasAlpha: false, ... }
```

### `resize(input, options)` / `resizeSync(input, options)`

Resize an image.

```typescript
// Resize by width (maintains aspect ratio)
const resized = await resize(imageBuffer, { width: 800 });

// Resize by height
const resized = await resize(imageBuffer, { height: 600 });

// Resize with specific dimensions
const resized = await resize(imageBuffer, {
  width: 800,
  height: 600,
  fit: 'cover',      // 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
  filter: 'lanczos3' // 'nearest' | 'bilinear' | 'catmullRom' | 'mitchell' | 'lanczos3'
});
```

### `toJpeg(input, options?)` / `toJpegSync(input, options?)`

Convert to JPEG.

```typescript
const jpeg = await toJpeg(imageBuffer, { quality: 85 });
```

### `toPng(input, options?)` / `toPngSync(input, options?)`

Convert to PNG.

```typescript
const png = await toPng(imageBuffer, { compression: 6 });
```

### `toWebp(input, options?)` / `toWebpSync(input, options?)`

Convert to WebP.

```typescript
// Lossy WebP
const webp = await toWebp(imageBuffer, { quality: 80 });

// Lossless WebP
const lossless = await toWebp(imageBuffer, { lossless: true });
```

### `transform(input, options)` / `transformSync(input, options)`

Apply multiple transformations in a single operation (most efficient).

```typescript
const result = await transform(imageBuffer, {
  // Resize
  resize: { width: 800, height: 600, fit: 'cover' },

  // Transformations
  rotate: 90,        // 90, 180, or 270 degrees
  flipH: true,       // Flip horizontally
  flipV: false,      // Flip vertically
  grayscale: true,   // Convert to grayscale
  blur: 5,           // Blur radius (0-100)
  sharpen: 10,       // Sharpen amount (0-100)
  brightness: 10,    // Brightness (-100 to 100)
  contrast: 5,       // Contrast (-100 to 100)

  // Output format
  output: {
    format: 'webp',
    webp: { quality: 85 }
  }
});
```

### `blurhash(input, componentsX?, componentsY?)` / `blurhashSync(...)`

Generate a blurhash placeholder string.

```typescript
const { hash, width, height } = await blurhash(imageBuffer, 4, 3);
console.log(hash); // "LEHV6nWB2yk8pyo0adR*.7kCMdnj"
```

### `version()`

Get library version.

```typescript
console.log(version()); // "1.0.0"
```

## Options

### Resize Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `width` | `number` | - | Target width (optional if height provided) |
| `height` | `number` | - | Target height (optional if width provided) |
| `filter` | `string` | `'lanczos3'` | Resize algorithm |
| `fit` | `string` | `'cover'` | How to fit the image |

### Filter Types

- `nearest` - Fastest, lowest quality
- `bilinear` - Fast, good quality
- `catmullRom` - Balanced speed and quality
- `mitchell` - Good for downscaling
- `lanczos3` - Highest quality, slower (default)

### Fit Modes

- `cover` - Resize to cover target dimensions (may crop)
- `contain` - Resize to fit within target (may have padding)
- `fill` - Resize to exact dimensions (may distort)
- `inside` - Resize only if larger than target
- `outside` - Resize only if smaller than target

### JPEG Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `quality` | `number` | `80` | Quality 1-100 |

### PNG Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `compression` | `number` | `6` | Compression level 0-9 |

### WebP Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `quality` | `number` | `80` | Quality 1-100 (lossy) |
| `lossless` | `boolean` | `false` | Use lossless compression |

## Supported Formats

| Format | Read | Write |
|--------|------|-------|
| JPEG | Yes | Yes |
| PNG | Yes | Yes |
| WebP | Yes | Yes |
| GIF | Yes | Yes |
| BMP | Yes | Yes |
| ICO | Yes | No |
| TIFF | Yes | No |

## Supported Platforms

| Platform | Architecture | Support |
|----------|--------------|---------|
| macOS | ARM64 (M1/M2/M3) | Yes |
| macOS | x64 (Intel) | Yes |
| Linux | x64 (glibc) | Yes |
| Linux | x64 (musl/Alpine) | Yes |
| Linux | ARM64 (glibc) | Yes |
| Linux | ARM64 (musl) | Yes |
| Windows | x64 | Yes |

## Development

```bash
# Clone the repository
git clone https://github.com/nexus-aissam/bun-image-turbo.git
cd bun-image-turbo

# Install dependencies
bun install

# Build native module (requires Rust)
bun run build

# Build TypeScript
bun run build:ts

# Run tests
bun test
```

### Requirements

- Bun 1.0+ or Node.js 18+
- Rust 1.70+ (for building from source)

## License

MIT License - see [LICENSE](LICENSE) for details.

## Author

Aissam Irhir ([@nexus-aissam](https://github.com/nexus-aissam))

## Acknowledgments

- [turbojpeg](https://crates.io/crates/turbojpeg) - libjpeg-turbo bindings with SIMD
- [image](https://crates.io/crates/image) - Rust image processing library
- [fast_image_resize](https://crates.io/crates/fast_image_resize) - Fast image resizing
- [webp](https://crates.io/crates/webp) - WebP encoding/decoding
- [blurhash](https://crates.io/crates/blurhash) - Blurhash generation
- [napi-rs](https://napi.rs/) - Rust bindings for Node.js
