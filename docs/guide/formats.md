# Image Formats

imgkit supports a wide range of image formats for both reading and writing.

## Format Support Matrix

| Format | Read | Write | Notes |
|--------|:----:|:-----:|-------|
| JPEG | ✅ | ✅ | TurboJPEG with SIMD acceleration |
| PNG | ✅ | ✅ | Adaptive compression |
| WebP | ✅ | ✅ | Lossy and lossless modes |
| HEIC/HEIF | ✅ | ❌ | macOS ARM64 only |
| AVIF | ✅ | ❌ | Via libheif |
| GIF | ✅ | ✅ | Animated support |
| BMP | ✅ | ✅ | Windows bitmap |
| TIFF | ✅ | ❌ | Multi-page support |
| ICO | ✅ | ❌ | Multi-size icons |

## JPEG

High-quality lossy compression using TurboJPEG with SIMD acceleration.

```typescript
import { toJpeg } from 'imgkit';

const jpeg = await toJpeg(buffer, {
  quality: 85  // 1-100, default: 80
});
```

### Quality Guidelines

| Quality | Use Case | File Size |
|---------|----------|-----------|
| 95-100 | Archival, print | Large |
| 80-90 | Web, high quality | Medium |
| 60-75 | Thumbnails, previews | Small |
| < 60 | Maximum compression | Very small |

## PNG

Lossless compression with configurable compression level.

```typescript
import { toPng } from 'imgkit';

const png = await toPng(buffer, {
  compression: 6  // 0-9, default: 6
});
```

### Compression Levels

| Level | Speed | File Size |
|-------|-------|-----------|
| 0-2 | Fast | Larger |
| 3-5 | Balanced | Medium |
| 6-9 | Slow | Smallest |

## WebP

Modern format with excellent compression for both lossy and lossless.

```typescript
import { toWebp } from 'imgkit';

// Lossy (default)
const lossy = await toWebp(buffer, {
  quality: 80  // 1-100
});

// Lossless
const lossless = await toWebp(buffer, {
  lossless: true
});
```

### When to Use WebP

- **Lossy**: General web images, photos
- **Lossless**: Graphics, screenshots, images with text

::: tip
WebP typically produces 25-35% smaller files than JPEG at equivalent quality.
:::

## HEIC/HEIF

Apple's modern image format, used by iPhones. Read-only support on macOS ARM64.

```typescript
import { metadata, toJpeg } from 'imgkit';

// Read HEIC metadata
const info = await metadata(heicBuffer);
// { format: 'heic', width: 4032, height: 3024, ... }

// Convert to JPEG
const jpeg = await toJpeg(heicBuffer, { quality: 90 });

// Convert to WebP
const webp = await toWebp(heicBuffer, { quality: 85 });
```

::: warning Platform Limitation
HEIC support requires macOS ARM64 (M1/M2/M3/M4/M5). On other platforms, HEIC files will throw an error.
:::

## AVIF

AV1 Image Format - newer format with excellent compression. Read-only.

```typescript
// Read AVIF files
const info = await metadata(avifBuffer);
// { format: 'avif', ... }

// Convert to other formats
const jpeg = await toJpeg(avifBuffer);
```

## GIF

Supports both static and animated GIFs for reading. GIF output is available through `transform()`.

```typescript
import { metadata, transform } from 'imgkit';

// Read GIF metadata
const info = await metadata(gifBuffer);
// { format: 'gif', pages: 10, delay: [100, 100, ...], ... }

// Convert to GIF (via transform)
const gif = await transform(buffer, {
  output: { format: 'gif' }
});
```

::: info Animated GIFs
When reading animated GIFs, metadata includes frame count (`pages`), loop count, and frame delays.
:::

## Using transform() with Formats

The `transform()` function accepts output format options:

```typescript
import { transform } from 'imgkit';

// JPEG output
const jpeg = await transform(buffer, {
  resize: { width: 800 },
  output: {
    format: 'jpeg',
    jpeg: { quality: 85 }
  }
});

// PNG output
const png = await transform(buffer, {
  resize: { width: 800 },
  output: {
    format: 'png',
    png: { compression: 6 }
  }
});

// WebP output
const webp = await transform(buffer, {
  resize: { width: 800 },
  output: {
    format: 'webp',
    webp: { quality: 80, lossless: false }
  }
});
```

## Format Detection

The `metadata()` function automatically detects image format:

```typescript
const info = await metadata(buffer);

switch (info.format) {
  case 'jpeg':
  case 'png':
  case 'webp':
  case 'gif':
  case 'heic':
  case 'avif':
    // Process based on format
    break;
}
```
