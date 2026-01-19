# API Reference

Complete API documentation for imgkit.

## Functions Overview

| Function | Description |
|----------|-------------|
| [`metadata()`](/api/metadata) | Get image metadata (header-only, ultra-fast) |
| [`resize()`](/api/resize) | Resize image (outputs PNG) |
| [`crop()`](/api/crop) | Crop image region (zero-copy, ultra-fast) |
| [`toJpeg()`](/api/to-jpeg) | Convert to JPEG (TurboJPEG with SIMD) |
| [`toPng()`](/api/to-png) | Convert to PNG |
| [`toWebp()`](/api/to-webp) | Convert to WebP (lossy or lossless) |
| [`transform()`](/api/transform) | Apply multiple transformations in one pass |
| [`blurhash()`](/api/blurhash) | Generate BlurHash placeholder string |
| [`thumbhash()`](/api/thumbhash) | Generate ThumbHash placeholder (better quality) |
| [`toTensor()`](/api/tensor) | Convert image to ML tensor (SIMD-accelerated) |
| [`imageHash()`](/api/image-hash) | Generate perceptual hash for similarity detection |
| [`imageHashDistance()`](/api/image-hash#imagehash-distance) | Calculate hamming distance between hashes |
| [`writeExif()`](/api/exif) | Write EXIF metadata to JPEG/WebP |
| [`stripExif()`](/api/exif#stripexif) | Remove EXIF metadata from images |
| `version()` | Get library version |

## Async vs Sync

All functions have sync variants:

| Async | Sync |
|-------|------|
| `metadata()` | `metadataSync()` |
| `resize()` | `resizeSync()` |
| `crop()` | `cropSync()` |
| `toJpeg()` | `toJpegSync()` |
| `toPng()` | `toPngSync()` |
| `toWebp()` | `toWebpSync()` |
| `transform()` | `transformSync()` |
| `blurhash()` | `blurhashSync()` |
| `thumbhash()` | `thumbhashSync()` |
| `toTensor()` | `toTensorSync()` |
| `imageHash()` | `imageHashSync()` |
| `imageHashDistance()` | `imageHashDistanceSync()` |
| `writeExif()` | `writeExifSync()` |
| `stripExif()` | `stripExifSync()` |

## Quick Examples

```typescript
import {
  metadata,
  resize,
  crop,
  toJpeg,
  toPng,
  toWebp,
  transform,
  blurhash,
  thumbhash,
  toTensor,
  imageHash,
  imageHashDistance,
  version
} from 'imgkit';

// Check version
console.log(version()); // "1.8.0"

// Get metadata (returns many fields - see metadata docs)
const info = await metadata(buffer);
// { width, height, format, space, channels, depth, hasAlpha, bitsPerSample, ... }

// Resize (outputs PNG)
const resized = await resize(buffer, { width: 800 });

// Crop (multiple modes)
const squared = await crop(buffer, { aspectRatio: "1:1" });
const region = await crop(buffer, { x: 100, y: 50, width: 400, height: 300 });

// Convert formats
const jpeg = await toJpeg(buffer, { quality: 85 });
const png = await toPng(buffer, { compression: 6 });
const webp = await toWebp(buffer, { quality: 80 });

// Transform with crop + resize pipeline
const result = await transform(buffer, {
  crop: { aspectRatio: "16:9" },
  resize: { width: 1280 },
  sharpen: 5,
  output: { format: 'WebP', webp: { quality: 85 } }
});

// Generate blurhash
const { hash } = await blurhash(buffer, 4, 3);

// Generate thumbhash (better quality, alpha support)
const { dataUrl } = await thumbhash(buffer);
// Use directly: <img src={dataUrl} />

// Convert to ML tensor (first JS package with native SIMD!)
const tensor = await toTensor(buffer, {
  width: 224, height: 224,
  normalization: 'Imagenet',
  layout: 'Chw', batch: true
});
// Shape: [1, 3, 224, 224] - Ready for PyTorch/ONNX!

// Perceptual hash for similarity detection (first JS package!)
const hash1 = await imageHash(image1, { algorithm: 'PHash' });
const hash2 = await imageHash(image2, { algorithm: 'PHash' });
const distance = await imageHashDistance(hash1.hash, hash2.hash);
// distance < 5 = very similar, < 10 = similar, > 10 = different
```

::: warning Case Sensitivity
All enum values are **PascalCase**:

- Formats: `'Jpeg'`, `'Png'`, `'WebP'`, `'Gif'`, `'Bmp'`
- Fit modes: `'Cover'`, `'Contain'`, `'Fill'`, `'Inside'`, `'Outside'`
- Filters: `'Nearest'`, `'Bilinear'`, `'CatmullRom'`, `'Mitchell'`, `'Lanczos3'`
:::

## Input Types

All functions accept `Buffer` as input:

```typescript
// From file (Bun)
const buffer = Buffer.from(await Bun.file('image.jpg').arrayBuffer());

// From file (Node.js)
import { readFileSync } from 'fs';
const buffer = readFileSync('image.jpg');

// From fetch
const response = await fetch('https://example.com/image.jpg');
const buffer = Buffer.from(await response.arrayBuffer());

// From base64
const buffer = Buffer.from(base64String, 'base64');
```

## Output Types

All processing functions return `Buffer`:

```typescript
const result: Buffer = await transform(buffer, options);

// Write to file (Bun)
await Bun.write('output.webp', result);

// Write to file (Node.js)
import { writeFileSync } from 'fs';
writeFileSync('output.webp', result);

// To base64
const base64 = result.toString('base64');

// HTTP response
return new Response(result, {
  headers: { 'Content-Type': 'image/webp' }
});
```

## Error Handling

All functions throw on invalid input:

```typescript
try {
  const result = await transform(buffer, options);
} catch (error) {
  console.error('Processing failed:', error.message);
}
```

See [Error Handling](/guide/error-handling) for details.
