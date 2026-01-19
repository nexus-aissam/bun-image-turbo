# Quick Start

Learn the basics of imgkit in 5 minutes.

## Basic Usage

```typescript
import { metadata, resize, toWebp, transform } from 'imgkit';

// Read an image file
const input = await Bun.file('photo.jpg').arrayBuffer();
const buffer = Buffer.from(input);
```

## Get Image Metadata

Extract image information without decoding the full image:

```typescript
const info = await metadata(buffer);

console.log(info);
// {
//   width: 1920,
//   height: 1080,
//   format: 'jpeg',
//   channels: 3,
//   hasAlpha: false
// }
```

## Resize Images

Resize with automatic aspect ratio preservation:

```typescript
// Resize by width (height calculated automatically)
const resized = await resize(buffer, { width: 800 });

// Resize by height
const resized = await resize(buffer, { height: 600 });

// Resize to exact dimensions
const resized = await resize(buffer, {
  width: 800,
  height: 600,
  fit: 'Cover'  // crop to fill (PascalCase)
});
```

## Convert Formats

Convert between image formats:

```typescript
import { toJpeg, toPng, toWebp } from 'imgkit';

// Convert to JPEG
const jpeg = await toJpeg(buffer, { quality: 85 });

// Convert to PNG
const png = await toPng(buffer, { compression: 6 });

// Convert to WebP (smaller file size)
const webp = await toWebp(buffer, { quality: 80 });

// Lossless WebP
const lossless = await toWebp(buffer, { lossless: true });
```

## Apply Transformations

Use `transform()` for multiple operations in one call:

```typescript
const result = await transform(buffer, {
  // Resize (enum values are PascalCase)
  resize: { width: 800, height: 600, fit: 'Cover' },

  // Rotate (90, 180, or 270)
  rotate: 90,

  // Flip
  flipH: true,  // horizontal
  flipV: false, // vertical

  // Adjustments
  grayscale: true,
  brightness: 10,   // -100 to 100
  contrast: 5,      // -100 to 100
  blur: 2,          // 0 to 100
  sharpen: 10,      // 0 to 100

  // Output format (PascalCase: 'Jpeg', 'Png', 'WebP', 'Gif', 'Bmp')
  output: {
    format: 'WebP',
    webp: { quality: 80 }
  }
});

await Bun.write('output.webp', result);
```

## Generate Placeholders

Create compact image placeholders for progressive loading:

### BlurHash

```typescript
import { blurhash } from 'imgkit';

const { hash, width, height } = await blurhash(buffer, 4, 3);
console.log(hash); // "LEHV6nWB2yk8pyo0adR*.7kCMdnj"
```

### ThumbHash (Recommended)

ThumbHash produces better quality placeholders with alpha channel support:

```typescript
import { thumbhash } from 'imgkit';

const { dataUrl, hash, width, height, hasAlpha } = await thumbhash(buffer);

// Use directly in HTML/CSS
const html = `<img src="${dataUrl}" alt="placeholder" />`;

// Or store the compact hash (~25 bytes) in your database
await db.save({ id: 1, thumbhash: hash });
```

::: tip Why ThumbHash?

- **Alpha channel support** - Works with transparent PNGs
- **Aspect ratio preserved** - No stretching
- **Better color accuracy** - Smoother gradients
- **Ready-to-use dataUrl** - No decoding needed on frontend

:::

## HEIC Conversion (macOS ARM64)

Convert iPhone photos:

```typescript
import { toJpeg, metadata } from 'imgkit';

// Read HEIC file
const heic = await Bun.file('IMG_1234.HEIC').arrayBuffer();
const buffer = Buffer.from(heic);

// Get metadata
const info = await metadata(buffer);
console.log(info.format); // 'heic'

// Convert to JPEG
const jpeg = await toJpeg(buffer, { quality: 90 });
await Bun.write('photo.jpg', jpeg);
```

## Sync API

All functions have synchronous versions:

```typescript
import {
  metadataSync,
  resizeSync,
  toJpegSync,
  transformSync
} from 'imgkit';

// Synchronous operations (blocks event loop)
const info = metadataSync(buffer);
const resized = resizeSync(buffer, { width: 400 });
const jpeg = toJpegSync(buffer, { quality: 80 });
```

::: warning
Sync functions block the event loop. Use async versions for better performance in servers.
:::

## Next Steps

- [Image Formats](/guide/formats) - Supported formats and options
- [Resizing](/guide/resizing) - Advanced resize options
- [Transformations](/guide/transformations) - All transformation options
- [API Reference](/api/) - Complete API documentation
