> [!IMPORTANT]
> **Package Renamed:** `bun-image-turbo` is now `imgkit`
> ```bash
> npm uninstall bun-image-turbo && npm install imgkit
> ```
> The API is 100% compatible - just update your imports.

<div align="center">

# imgkit

**High-performance image processing for Bun and Node.js**

*Built with Rust and napi-rs for maximum speed*

[![npm version](https://img.shields.io/npm/v/imgkit?style=flat-square&color=f97316)](https://www.npmjs.com/package/imgkit)
[![downloads](https://img.shields.io/npm/dm/imgkit?style=flat-square&color=10b981)](https://www.npmjs.com/package/imgkit)
[![CI](https://img.shields.io/github/actions/workflow/status/nexus-aissam/imgkit/ci.yml?style=flat-square&label=CI)](https://github.com/nexus-aissam/imgkit/actions)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)

<br />

[Documentation](https://nexus-aissam.github.io/imgkit/) · [API Reference](https://nexus-aissam.github.io/imgkit/api/) · [Examples](https://nexus-aissam.github.io/imgkit/examples/) · [Changelog](https://nexus-aissam.github.io/imgkit/changelog)

</div>

<br />

## Highlights

<table>
<tr>
<td width="50%">

### Performance

- **950x faster** metadata extraction
- **1.9x faster** thumbnail generation
- **2.6x faster** concurrent operations
- **SIMD-accelerated** JPEG codec
- **Zero-copy** cropping & buffer handling

</td>
<td width="50%">

### Features

- **Fast Thumbnails** (shrink-on-load)
- **Native HEIC/HEIF** support
- **Smart Crop** (content-aware)
- **Dominant Colors** (UI theming)
- **ThumbHash & BlurHash** placeholders
- **Perceptual Hashing** (pHash/dHash)
- **ML Tensor Conversion** (SIMD-accelerated)
- **EXIF metadata** read/write

</td>
</tr>
</table>

<br />

## Installation

```bash
# Bun (recommended)
bun add imgkit

# npm / yarn / pnpm
npm install imgkit
```

<details>
<summary><strong>Verified Package Managers</strong></summary>

| Package Manager | Status | Tests |
|-----------------|:------:|------:|
| Bun | ✅ | 87 pass |
| npm | ✅ | 40 pass |
| yarn | ✅ | 40 pass |
| pnpm | ✅ | 40 pass |

</details>

<br />

## Quick Start

```typescript
import {
  metadata,
  resize,
  crop,
  smartCrop,
  dominantColors,
  transform,
  toWebp,
  thumbhash,
  toTensor,
  imageHash,
  imageHashDistance
} from 'imgkit';

// Load image
const buffer = Buffer.from(await Bun.file('photo.jpg').arrayBuffer());

// Get metadata (ultra-fast, header-only parsing)
const info = await metadata(buffer);
console.log(`${info.width}x${info.height} ${info.format}`);

// Crop to aspect ratio (zero-copy, ultra-fast)
const squared = await crop(buffer, { aspectRatio: "1:1" });

// Smart crop - finds the most interesting region automatically
const smartThumb = await smartCrop(buffer, { aspectRatio: "1:1" });
// Perfect for social media thumbnails!

// Extract dominant colors for UI theming (like Spotify)
const colors = await dominantColors(buffer);
console.log(colors.primary.hex); // "#3498DB"
// Perfect for auto-theming UI based on images!

// Resize with shrink-on-decode optimization
const resized = await resize(buffer, { width: 200 });

// Full pipeline: crop → resize → output
const youtube = await transform(buffer, {
  crop: { aspectRatio: "16:9" },
  resize: { width: 1280 },
  sharpen: 5,
  output: { format: 'WebP', webp: { quality: 85 } }
});

// Generate ThumbHash placeholder (better than BlurHash)
const { dataUrl } = await thumbhash(buffer);
// Use directly: <img src={dataUrl} />

// ML Tensor conversion (first JS package with native SIMD!)
const tensor = await toTensor(buffer, {
  width: 224, height: 224,
  normalization: 'Imagenet',
  layout: 'Chw', batch: true
});
// Shape: [1, 3, 224, 224] - Ready for PyTorch/ONNX!

// Perceptual hashing for duplicate detection
const hash1 = await imageHash(buffer, { algorithm: 'PHash' });
const hash2 = await imageHash(otherBuffer, { algorithm: 'PHash' });
const distance = await imageHashDistance(hash1.hash, hash2.hash);
// distance < 5 = very similar images!
```

<br />

## API Reference

<table>
<thead>
<tr>
<th>Function</th>
<th>Description</th>
<th align="center">Async</th>
<th align="center">Sync</th>
</tr>
</thead>
<tbody>
<tr><td><code>metadata()</code></td><td>Get image dimensions, format, color info</td><td align="center">✅</td><td align="center">✅</td></tr>
<tr><td><code>resize()</code></td><td>Resize image with multiple algorithms</td><td align="center">✅</td><td align="center">✅</td></tr>
<tr><td><code>crop()</code></td><td>Crop image region (zero-copy, ultra-fast)</td><td align="center">✅</td><td align="center">✅</td></tr>
<tr><td><code>smartCrop()</code></td><td>Content-aware crop (saliency detection)</td><td align="center">✅</td><td align="center">✅</td></tr>
<tr><td><code>dominantColors()</code></td><td>Extract dominant colors for UI theming</td><td align="center">✅</td><td align="center">✅</td></tr>
<tr><td><code>thumbnail()</code></td><td>Fast thumbnail with shrink-on-load</td><td align="center">✅</td><td align="center">✅</td></tr>
<tr><td><code>transform()</code></td><td>Multi-operation pipeline with crop support</td><td align="center">✅</td><td align="center">✅</td></tr>
<tr><td><code>toJpeg()</code></td><td>Convert to JPEG</td><td align="center">✅</td><td align="center">✅</td></tr>
<tr><td><code>toPng()</code></td><td>Convert to PNG</td><td align="center">✅</td><td align="center">✅</td></tr>
<tr><td><code>toWebp()</code></td><td>Convert to WebP</td><td align="center">✅</td><td align="center">✅</td></tr>
<tr><td><code>blurhash()</code></td><td>Generate BlurHash placeholder</td><td align="center">✅</td><td align="center">✅</td></tr>
<tr><td><code>thumbhash()</code></td><td>Generate ThumbHash placeholder</td><td align="center">✅</td><td align="center">✅</td></tr>
<tr><td><code>toTensor()</code></td><td>Convert to ML tensor (SIMD-accelerated)</td><td align="center">✅</td><td align="center">✅</td></tr>
<tr><td><code>imageHash()</code></td><td>Generate perceptual hash for similarity</td><td align="center">✅</td><td align="center">✅</td></tr>
<tr><td><code>imageHashDistance()</code></td><td>Compare perceptual hashes</td><td align="center">✅</td><td align="center">✅</td></tr>
<tr><td><code>writeExif()</code></td><td>Write EXIF metadata</td><td align="center">✅</td><td align="center">✅</td></tr>
<tr><td><code>stripExif()</code></td><td>Remove EXIF metadata</td><td align="center">✅</td><td align="center">✅</td></tr>
</tbody>
</table>

> **Note:** All functions have sync variants: `metadataSync()`, `resizeSync()`, etc.

<br />

## Image Placeholders

<table>
<tr>
<th width="50%">ThumbHash <sup>NEW</sup></th>
<th width="50%">BlurHash</th>
</tr>
<tr>
<td>

```typescript
const { dataUrl, hash } = await thumbhash(buffer);

// Ready-to-use data URL
element.style.backgroundImage = `url(${dataUrl})`;

// Or store the compact hash (~25 bytes)
await db.save({ thumbhash: hash });
```

</td>
<td>

```typescript
const { hash } = await blurhash(buffer, 4, 3);

// Returns base83 string
console.log(hash);
// "LEHV6nWB2yk8pyo0adR*.7kCMdnj"
```

</td>
</tr>
<tr>
<td>

**Advantages:**

- Alpha channel support
- Aspect ratio preserved
- Better color accuracy
- Smoother gradients

</td>
<td>

**Advantages:**

- Widely supported
- Compact string format
- Good for simple images

</td>
</tr>
</table>

<br />

## Supported Formats

<table>
<thead>
<tr>
<th>Format</th>
<th align="center">Read</th>
<th align="center">Write</th>
<th>Notes</th>
</tr>
</thead>
<tbody>
<tr><td><strong>JPEG</strong></td><td align="center">✅</td><td align="center">✅</td><td>TurboJPEG with SIMD acceleration</td></tr>
<tr><td><strong>PNG</strong></td><td align="center">✅</td><td align="center">✅</td><td>Adaptive compression</td></tr>
<tr><td><strong>WebP</strong></td><td align="center">✅</td><td align="center">✅</td><td>Lossy & lossless modes</td></tr>
<tr><td><strong>HEIC/HEIF</strong></td><td align="center">✅</td><td align="center">—</td><td>macOS ARM64 only</td></tr>
<tr><td><strong>AVIF</strong></td><td align="center">✅</td><td align="center">—</td><td>Via libheif</td></tr>
<tr><td><strong>GIF</strong></td><td align="center">✅</td><td align="center">✅</td><td>Full support</td></tr>
<tr><td><strong>BMP</strong></td><td align="center">✅</td><td align="center">✅</td><td>Full support</td></tr>
<tr><td><strong>TIFF</strong></td><td align="center">✅</td><td align="center">—</td><td>Read-only</td></tr>
</tbody>
</table>

<br />

## Platform Support

<table>
<thead>
<tr>
<th>Platform</th>
<th>Architecture</th>
<th align="center">Status</th>
<th align="center">HEIC</th>
</tr>
</thead>
<tbody>
<tr><td>macOS</td><td>ARM64 (Apple Silicon)</td><td align="center">✅</td><td align="center">✅</td></tr>
<tr><td>macOS</td><td>x64 (Intel)</td><td align="center">✅</td><td align="center">—</td></tr>
<tr><td>Linux</td><td>x64 (glibc)</td><td align="center">✅</td><td align="center">—</td></tr>
<tr><td>Linux</td><td>x64 (musl/Alpine)</td><td align="center">✅</td><td align="center">—</td></tr>
<tr><td>Linux</td><td>ARM64</td><td align="center">✅</td><td align="center">—</td></tr>
<tr><td>Windows</td><td>x64</td><td align="center">✅</td><td align="center">—</td></tr>
<tr><td>Windows</td><td>ARM64</td><td align="center">✅</td><td align="center">—</td></tr>
</tbody>
</table>

<br />

## Performance Benchmarks

<details open>
<summary><strong>Metadata Extraction</strong></summary>

| Format | imgkit | sharp | Speedup |
|--------|----------------:|------:|:-------:|
| WebP | 0.004ms | 3.4ms | **950x** |
| JPEG | 0.003ms | 0.1ms | **38x** |
| PNG | 0.002ms | 0.08ms | **40x** |

</details>

<details>
<summary><strong>Image Processing</strong></summary>

| Operation | imgkit | sharp | Speedup |
|-----------|----------------:|------:|:-------:|
| 50 Concurrent Ops | 62ms | 160ms | **2.6x** |
| Transform Pipeline | 12.2ms | 19.1ms | **1.6x** |
| 1MB JPEG → 800px | 12.6ms | 20.3ms | **1.6x** |

</details>

<details>
<summary><strong>WebP Resize</strong></summary>

| Source → Target | imgkit | sharp | Speedup |
|-----------------|----------------:|------:|:-------:|
| 800x600 → 200px | 3.1ms | 4.3ms | **1.40x** |
| 1600x1200 → 200px | 6.4ms | 8.0ms | **1.24x** |
| 4000x3000 → 400px | 32.4ms | 33.1ms | **1.02x** |

</details>

<details>
<summary><strong>Thumbnail Generation (Shrink-on-Load)</strong></summary>

| Source → Target | imgkit | sharp | Speedup |
|-----------------|----------------:|------:|:-------:|
| 2205x1240 → 200px | 9.1ms | 10.9ms | **1.2x** |
| 11384x4221 → 200px | 100ms | 119ms | **1.2x** |

**Concurrent (100 images, 2205x1240 JPEG):**

| Method | Total | Per Image | vs Sharp |
|--------|-------|-----------|:--------:|
| thumbnail | 167ms | 1.7ms | **1.8x** |
| fastMode | 157ms | 1.6ms | **1.9x** |
| sharp | 295ms | 2.9ms | baseline |

</details>

<br />

## Examples

<details>
<summary><strong>Basic Usage</strong></summary>

```typescript
import { metadata, resize, toWebp } from 'imgkit';

const input = Buffer.from(await Bun.file('input.jpg').arrayBuffer());

// Get image info
const info = await metadata(input);
console.log(info); // { width: 1920, height: 1080, format: 'jpeg', ... }

// Create thumbnail
const thumb = await resize(input, { width: 200, height: 200, fit: 'Cover' });

// Convert to WebP
const webp = await toWebp(input, { quality: 85 });
await Bun.write('output.webp', webp);
```

</details>

<details>
<summary><strong>HEIC Conversion (macOS ARM64)</strong></summary>

```typescript
import { metadata, transform } from 'imgkit';

const heic = Buffer.from(await Bun.file('IMG_1234.HEIC').arrayBuffer());

// Check format
const info = await metadata(heic);
console.log(info.format); // 'heic'

// Convert to JPEG
const jpeg = await transform(heic, {
  output: { format: 'Jpeg', jpeg: { quality: 90 } }
});
```

</details>

<details>
<summary><strong>EXIF Metadata for AI Images</strong></summary>

```typescript
import { writeExif, toWebp } from 'imgkit';

const webp = await toWebp(aiGeneratedImage, { quality: 90 });

const withMetadata = await writeExif(webp, {
  imageDescription: 'A sunset over mountains',
  artist: 'Stable Diffusion XL',
  software: 'ComfyUI v1.0',
  copyright: '© 2024 Your Name',
  userComment: JSON.stringify({
    prompt: 'sunset over mountains, golden hour, 8k',
    seed: 12345,
    steps: 30
  })
});
```

</details>

<details>
<summary><strong>ML Tensor Conversion</strong></summary>

```typescript
import { toTensor } from 'imgkit';

const buffer = Buffer.from(await Bun.file('photo.jpg').arrayBuffer());

// PyTorch/ONNX (CHW layout, ImageNet normalization)
const tensor = await toTensor(buffer, {
  width: 224,
  height: 224,
  normalization: 'Imagenet',  // ResNet, VGG, EfficientNet
  layout: 'Chw',              // Channel-first for PyTorch
  batch: true                 // Add batch dimension
});

// Shape: [1, 3, 224, 224] - Ready for inference!
const float32Data = tensor.toFloat32Array();

// TensorFlow.js (HWC layout)
const tfTensor = await toTensor(buffer, {
  width: 224, height: 224,
  normalization: 'ZeroOne',
  layout: 'Hwc'
});
```

**Built-in normalizations:** `Imagenet`, `Clip`, `ZeroOne`, `NegOneOne`

</details>

<details>
<summary><strong>Perceptual Hashing (Duplicate Detection)</strong></summary>

```typescript
import { imageHash, imageHashDistance } from 'imgkit';

// Generate perceptual hash
const hash1 = await imageHash(image1Buffer, { algorithm: 'PHash' });
const hash2 = await imageHash(image2Buffer, { algorithm: 'PHash' });

// Compare similarity (0 = identical, lower = more similar)
const distance = await imageHashDistance(hash1.hash, hash2.hash);

if (distance < 5) {
  console.log('Images are very similar (likely duplicates)');
} else if (distance < 10) {
  console.log('Images are somewhat similar');
} else {
  console.log('Images are different');
}

// Available algorithms:
// - PHash: DCT-based, most robust (recommended)
// - DHash: Gradient-based, fast
// - AHash: Average-based, fastest
// - BlockHash: Block-based, balanced
```

**Use cases:** Duplicate detection, content moderation, reverse image search, near-match finding.

</details>

<details>
<summary><strong>Fast Thumbnails (Shrink-on-Load)</strong></summary>

```typescript
import { thumbnail, thumbnailBuffer } from 'imgkit';

const buffer = Buffer.from(await Bun.file('photo.jpg').arrayBuffer());

// Generate thumbnail with metadata
const result = await thumbnail(buffer, {
  width: 200,
  format: 'Webp',
  quality: 85,
});
console.log(`${result.width}x${result.height}`);
console.log(`Shrink-on-load: ${result.shrinkOnLoadUsed}`);

// Simple buffer-only API
const thumb = await thumbnailBuffer(buffer, { width: 200 });

// Fast mode for maximum speed (2x faster)
const fast = await thumbnailBuffer(buffer, {
  width: 200,
  fastMode: true,
});
```

**Use cases:** Image galleries, preview generation, CDN thumbnails, batch processing.

</details>

<details>
<summary><strong>Smart Crop (Content-Aware)</strong></summary>

```typescript
import { smartCrop, smartCropAnalyze } from 'imgkit';

const buffer = Buffer.from(await Bun.file('photo.jpg').arrayBuffer());

// Smart crop to square (Instagram)
const square = await smartCrop(buffer, { aspectRatio: '1:1' });

// Smart crop to landscape (YouTube)
const youtube = await smartCrop(buffer, { aspectRatio: '16:9' });

// Smart crop to portrait (Stories/TikTok)
const portrait = await smartCrop(buffer, { aspectRatio: '9:16' });

// Analyze without cropping (get coordinates)
const analysis = await smartCropAnalyze(buffer, { aspectRatio: '1:1' });
console.log(`Best crop at: ${analysis.x}, ${analysis.y}`);
console.log(`Size: ${analysis.width}x${analysis.height}`);
console.log(`Score: ${analysis.score}`);
```

**Use cases:** Social media thumbnails, profile pictures, e-commerce products, automatic galleries.

</details>

<details>
<summary><strong>HTTP Image Server</strong></summary>

```typescript
import { resize, toWebp } from 'imgkit';

Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === '/resize') {
      const imageUrl = url.searchParams.get('url');
      const width = parseInt(url.searchParams.get('w') || '400');

      const response = await fetch(imageUrl!);
      const buffer = Buffer.from(await response.arrayBuffer());

      const resized = await resize(buffer, { width });
      const webp = await toWebp(resized, { quality: 85 });

      return new Response(webp, {
        headers: { 'Content-Type': 'image/webp' }
      });
    }

    return new Response('Not Found', { status: 404 });
  }
});
```

</details>

<br />

## Technology Stack

| Component | Technology | Benefit |
|-----------|------------|---------|
| JPEG Codec | TurboJPEG | SIMD acceleration (SSE2/AVX2/NEON) |
| Resize Engine | fast_image_resize | Multi-threaded with Rayon |
| WebP Codec | libwebp | Google's optimized encoder |
| HEIC Decoder | libheif-rs | Native Apple format support |
| Placeholders | thumbhash + blurhash | Compact image previews |
| Tensor Conversion | Native Rust + Rayon | SIMD-accelerated ML preprocessing |
| Perceptual Hash | image_hasher | Duplicate detection & similarity |
| Node Bindings | napi-rs | Zero-copy buffer handling |

<br />

## Development

```bash
# Clone repository
git clone https://github.com/nexus-aissam/imgkit.git
cd imgkit

# Install dependencies
bun install

# Build native module (requires Rust 1.70+)
bun run build

# Build TypeScript
bun run build:ts

# Run tests
bun run test              # Local tests
bun run test:packages     # Package manager tests
bun run test:all          # All tests
```

<br />

## License

[MIT](LICENSE) © [Aissam Irhir](https://github.com/nexus-aissam)

<br />

<div align="center">

**[Documentation](https://nexus-aissam.github.io/imgkit/)** · **[npm](https://www.npmjs.com/package/imgkit)** · **[GitHub](https://github.com/nexus-aissam/imgkit)** · **[Issues](https://github.com/nexus-aissam/imgkit/issues)**

</div>
