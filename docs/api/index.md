# API Reference

Complete API documentation for bun-image-turbo.

## Functions Overview

| Function | Description |
|----------|-------------|
| [`metadata()`](/api/metadata) | Get image metadata (header-only, ultra-fast) |
| [`resize()`](/api/resize) | Resize image (outputs PNG) |
| [`toJpeg()`](/api/to-jpeg) | Convert to JPEG (TurboJPEG with SIMD) |
| [`toPng()`](/api/to-png) | Convert to PNG |
| [`toWebp()`](/api/to-webp) | Convert to WebP (lossy or lossless) |
| [`transform()`](/api/transform) | Apply multiple transformations in one pass |
| [`blurhash()`](/api/blurhash) | Generate blurhash placeholder string |
| `version()` | Get library version |

## Async vs Sync

All functions have sync variants:

| Async | Sync |
|-------|------|
| `metadata()` | `metadataSync()` |
| `resize()` | `resizeSync()` |
| `toJpeg()` | `toJpegSync()` |
| `toPng()` | `toPngSync()` |
| `toWebp()` | `toWebpSync()` |
| `transform()` | `transformSync()` |
| `blurhash()` | `blurhashSync()` |

## Quick Examples

```typescript
import {
  metadata,
  resize,
  toJpeg,
  toPng,
  toWebp,
  transform,
  blurhash,
  version
} from 'bun-image-turbo';

// Check version
console.log(version()); // "1.2.2"

// Get metadata (returns many fields - see metadata docs)
const info = await metadata(buffer);
// { width, height, format, space, channels, depth, hasAlpha, bitsPerSample, ... }

// Resize (outputs PNG)
const resized = await resize(buffer, { width: 800 });

// Convert formats
const jpeg = await toJpeg(buffer, { quality: 85 });
const png = await toPng(buffer, { compression: 6 });
const webp = await toWebp(buffer, { quality: 80 });

// Transform with multiple operations
// Note: enum values are PascalCase ('WebP', 'Cover', 'Lanczos3')
const result = await transform(buffer, {
  resize: { width: 800, fit: 'Cover' },
  rotate: 90,
  grayscale: true,
  output: { format: 'WebP', webp: { quality: 85 } }
});

// Generate blurhash
const { hash } = await blurhash(buffer, 4, 3);
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
