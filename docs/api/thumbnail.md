# Thumbnail

Fast thumbnail generation with shrink-on-load optimization for maximum performance.

## Overview

The thumbnail API is optimized for generating small images from large sources. Unlike standard `resize()`, it uses **shrink-on-load** to decode images at reduced resolution, providing **4-10x faster** processing for large images.

## Functions

### thumbnail

Generate a thumbnail with full metadata about the operation.

```typescript
function thumbnail(input: Buffer, options: ThumbnailOptions): Promise<ThumbnailResult>
function thumbnailSync(input: Buffer, options: ThumbnailOptions): ThumbnailResult
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `input` | `Buffer` | Image buffer (JPEG, PNG, WebP, etc.) |
| `options` | `ThumbnailOptions` | Thumbnail options |

#### Returns

`ThumbnailResult` object:

| Property | Type | Description |
|----------|------|-------------|
| `data` | `Buffer` | Thumbnail image data |
| `width` | `number` | Output width |
| `height` | `number` | Output height |
| `format` | `string` | Output format (jpeg, png, webp) |
| `shrinkOnLoadUsed` | `boolean` | Whether shrink-on-load was used |
| `originalWidth` | `number` | Original image width |
| `originalHeight` | `number` | Original image height |

#### Example

```typescript
import { thumbnail } from 'imgkit';

const buffer = Buffer.from(await Bun.file('photo.jpg').arrayBuffer());

const result = await thumbnail(buffer, {
  width: 200,
  format: 'Jpeg',
  quality: 85,
});

console.log(`${result.width}x${result.height} ${result.format}`);
console.log(`Shrink-on-load used: ${result.shrinkOnLoadUsed}`);
console.log(`Original: ${result.originalWidth}x${result.originalHeight}`);

await Bun.write('thumb.jpg', result.data);
```

---

### thumbnailBuffer

Generate a thumbnail and return just the buffer (simpler API).

```typescript
function thumbnailBuffer(input: Buffer, options: ThumbnailOptions): Promise<Buffer>
function thumbnailBufferSync(input: Buffer, options: ThumbnailOptions): Buffer
```

#### Parameters

Same as `thumbnail()`.

#### Returns

`Buffer` - Thumbnail image data only.

#### Example

```typescript
import { thumbnailBuffer } from 'imgkit';

const buffer = Buffer.from(await Bun.file('photo.jpg').arrayBuffer());

const thumb = await thumbnailBuffer(buffer, { width: 200 });
await Bun.write('thumb.jpg', thumb);
```

---

## Types

### ThumbnailOptions

```typescript
interface ThumbnailOptions {
  width: number;              // Target width (required)
  height?: number;            // Target height (optional, maintains aspect ratio)
  format?: ThumbnailFormat;   // Output format (Jpeg, Png, Webp)
  quality?: number;           // Quality 1-100 (default: 80, or 70 in fast mode)
  shrinkOnLoad?: boolean;     // Enable shrink-on-load (default: true)
  filter?: ResizeFilter;      // Resize filter (auto-selected based on scale)
  fastMode?: boolean;         // Enable fast mode (default: false)
}
```

### ThumbnailFormat

```typescript
type ThumbnailFormat = 'Jpeg' | 'Png' | 'Webp';
```

### ThumbnailResult

```typescript
interface ThumbnailResult {
  data: Buffer;              // Thumbnail image data
  width: number;             // Output width
  height: number;            // Output height
  format: string;            // Output format
  shrinkOnLoadUsed: boolean; // Whether shrink-on-load was used
  originalWidth: number;     // Original image width
  originalHeight: number;    // Original image height
}
```

---

## Shrink-on-Load Optimization

### How It Works

Standard image resize:
```
File → Full Decode (4000x3000) → Resize (200px) → Encode
       ↑ SLOW - 12MP pixels ↑
```

Shrink-on-load resize:
```
File → Partial Decode (500x375) → Resize (200px) → Encode
       ↑ FAST - 0.2MP pixels ↑
```

### Format Support

| Format | Shrink Factors | Speedup |
|--------|----------------|---------|
| JPEG | 1/2, 1/4, 1/8 | **4-8x** |
| WebP | Any scale | **2-4x** |
| PNG | N/A (lossless) | 1x |

### When It's Used

Shrink-on-load is automatically used when:
- `shrinkOnLoad: true` (default)
- Target dimensions are significantly smaller than source
- Format supports shrink-on-load (JPEG, WebP)

---

## Fast Mode

Enable `fastMode: true` for maximum speed with slight quality tradeoff:

| Setting | Normal Mode | Fast Mode |
|---------|-------------|-----------|
| Shrink factor | Conservative | Aggressive (1/8) |
| Final resize | Exact dimensions | Skip if within 15% |
| Resize filter | Lanczos3 | Nearest neighbor |
| Default quality | 80 | 70 |

### Example

```typescript
// Maximum speed
const thumb = await thumbnail(buffer, {
  width: 200,
  fastMode: true,
});

// May return 210x118 instead of 200x112 (within 15% tolerance)
```

---

## Performance

### Single Image Benchmarks

**2205x1240 JPEG → 200px thumbnail:**

| Method | Time | vs Sharp |
|--------|------|----------|
| thumbnail (shrinkOnLoad) | 9.1ms | **1.2x faster** |
| thumbnail (fastMode) | 9.1ms | **1.2x faster** |
| thumbnail (no shrink) | 16.4ms | 1.5x slower |
| resize (standard) | 12.4ms | 1.1x slower |
| sharp | 10.9ms | baseline |

**11384x4221 JPEG (10MB) → 200px thumbnail:**

| Method | Time | vs Sharp |
|--------|------|----------|
| thumbnail (shrinkOnLoad) | 100ms | **1.2x faster** |
| thumbnail (fastMode) | 107ms | **1.1x faster** |
| thumbnail (no shrink) | 241ms | 2.0x slower |
| sharp | 119ms | baseline |

### Concurrent Processing

**100 images (2205x1240 JPEG):**

| Method | Total | Per Image | vs Sharp |
|--------|-------|-----------|----------|
| thumbnail (async) | 167ms | 1.7ms | **1.8x faster** |
| fastMode (async) | 157ms | 1.6ms | **1.9x faster** |
| sharp (async) | 295ms | 2.9ms | baseline |

---

## Use Cases

### Web Thumbnails

```typescript
import { thumbnailBuffer } from 'imgkit';

async function generateThumbnail(upload: Buffer) {
  return thumbnailBuffer(upload, {
    width: 300,
    format: 'Webp',
    quality: 80,
  });
}
```

### Multiple Sizes

```typescript
import { thumbnail } from 'imgkit';

async function generateSizes(buffer: Buffer) {
  const sizes = [64, 128, 256, 512];

  return Promise.all(
    sizes.map(width =>
      thumbnail(buffer, { width, format: 'Jpeg', quality: 85 })
    )
  );
}
```

### High-Throughput Processing

```typescript
import { thumbnailBuffer } from 'imgkit';

async function processBatch(images: Buffer[]) {
  // Process all images concurrently with fast mode
  return Promise.all(
    images.map(img =>
      thumbnailBuffer(img, { width: 200, fastMode: true })
    )
  );
}
```

### API Endpoint

```typescript
import { thumbnailBuffer } from 'imgkit';

Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    const width = parseInt(url.searchParams.get('w') || '200');
    const fast = url.searchParams.get('fast') === '1';

    const imageUrl = url.searchParams.get('url');
    const response = await fetch(imageUrl!);
    const buffer = Buffer.from(await response.arrayBuffer());

    const thumb = await thumbnailBuffer(buffer, {
      width,
      fastMode: fast,
      format: 'Webp',
      quality: 80,
    });

    return new Response(thumb, {
      headers: { 'Content-Type': 'image/webp' }
    });
  }
});
```

---

## Comparison: thumbnail vs resize

| Feature | `thumbnail()` | `resize()` |
|---------|---------------|------------|
| Shrink-on-load | ✅ Yes | ❌ No |
| Fast mode | ✅ Yes | ❌ No |
| Output format | JPEG/PNG/WebP | PNG only |
| Quality control | ✅ Yes | ❌ No |
| Metadata | ✅ Full result | ❌ Buffer only |
| Best for | Thumbnails, previews | Precise resizing |

**Recommendation:** Use `thumbnail()` for generating small images from large sources. Use `resize()` when you need precise control or are doing small scale changes.
