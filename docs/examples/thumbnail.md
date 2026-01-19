# Thumbnail Examples

Fast thumbnail generation with shrink-on-load optimization.

## Basic Usage

### Simple Thumbnail

```typescript
import { thumbnailBuffer } from 'imgkit';

const buffer = Buffer.from(await Bun.file('photo.jpg').arrayBuffer());

// Generate 200px wide thumbnail
const thumb = await thumbnailBuffer(buffer, { width: 200 });
await Bun.write('thumb.jpg', thumb);
```

### With Metadata

```typescript
import { thumbnail } from 'imgkit';

const buffer = Buffer.from(await Bun.file('photo.jpg').arrayBuffer());

const result = await thumbnail(buffer, {
  width: 200,
  format: 'Jpeg',
  quality: 85,
});

console.log(`Thumbnail: ${result.width}x${result.height}`);
console.log(`Original: ${result.originalWidth}x${result.originalHeight}`);
console.log(`Shrink-on-load: ${result.shrinkOnLoadUsed}`);
console.log(`Format: ${result.format}`);

await Bun.write('thumb.jpg', result.data);
```

---

## Output Formats

### JPEG (smallest, lossy)

```typescript
const jpeg = await thumbnailBuffer(buffer, {
  width: 200,
  format: 'Jpeg',
  quality: 85,
});
```

### WebP (best compression)

```typescript
const webp = await thumbnailBuffer(buffer, {
  width: 200,
  format: 'Webp',
  quality: 80,
});
```

### PNG (lossless)

```typescript
const png = await thumbnailBuffer(buffer, {
  width: 200,
  format: 'Png',
});
```

---

## Fast Mode

Enable `fastMode` for maximum speed (2-4x faster):

```typescript
const thumb = await thumbnailBuffer(buffer, {
  width: 200,
  fastMode: true,
});
```

**Trade-offs:**
- Dimensions may be ~15% off target
- Lower quality (70 vs 80)
- Faster resize algorithm

**Best for:** High-throughput processing, preview images, non-critical thumbnails.

---

## Aspect Ratio

### Maintain Aspect Ratio (default)

```typescript
// Only specify width - height is calculated automatically
const thumb = await thumbnailBuffer(buffer, { width: 200 });
// 4000x3000 → 200x150
```

### Fixed Dimensions

```typescript
// Specify both dimensions
const thumb = await thumbnailBuffer(buffer, {
  width: 200,
  height: 200,
});
// 4000x3000 → 200x200 (may crop or stretch)
```

---

## Multiple Sizes

### Generate Size Variants

```typescript
import { thumbnail } from 'imgkit';

async function generateSizes(buffer: Buffer) {
  const sizes = [
    { name: 'tiny', width: 32 },
    { name: 'small', width: 64 },
    { name: 'medium', width: 128 },
    { name: 'large', width: 256 },
    { name: 'xlarge', width: 512 },
  ];

  const results = await Promise.all(
    sizes.map(async ({ name, width }) => {
      const result = await thumbnail(buffer, {
        width,
        format: 'Webp',
        quality: 85,
      });
      return { name, ...result };
    })
  );

  return results;
}

// Usage
const sizes = await generateSizes(buffer);
for (const { name, data, width, height } of sizes) {
  await Bun.write(`thumb-${name}.webp`, data);
  console.log(`${name}: ${width}x${height}`);
}
```

---

## Batch Processing

### Process Multiple Images

```typescript
import { thumbnailBuffer } from 'imgkit';

async function processBatch(files: string[]) {
  const results = await Promise.all(
    files.map(async (file) => {
      const buffer = Buffer.from(await Bun.file(file).arrayBuffer());
      const thumb = await thumbnailBuffer(buffer, {
        width: 200,
        fastMode: true, // Use fast mode for batch processing
      });
      return { file, thumb };
    })
  );

  return results;
}

// Usage
const files = ['photo1.jpg', 'photo2.jpg', 'photo3.jpg'];
const thumbs = await processBatch(files);

for (const { file, thumb } of thumbs) {
  const name = file.replace(/\.\w+$/, '_thumb.jpg');
  await Bun.write(name, thumb);
}
```

### With Concurrency Control

```typescript
import { thumbnailBuffer } from 'imgkit';

async function processWithLimit(files: string[], concurrency = 10) {
  const results: Buffer[] = [];

  for (let i = 0; i < files.length; i += concurrency) {
    const batch = files.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(async (file) => {
        const buffer = Buffer.from(await Bun.file(file).arrayBuffer());
        return thumbnailBuffer(buffer, { width: 200 });
      })
    );
    results.push(...batchResults);
  }

  return results;
}
```

---

## HTTP Server

### Image Resize Service

```typescript
import { thumbnailBuffer } from 'imgkit';

Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === '/thumbnail') {
      const imageUrl = url.searchParams.get('url');
      const width = parseInt(url.searchParams.get('w') || '200');
      const format = url.searchParams.get('f') || 'webp';
      const fast = url.searchParams.get('fast') === '1';

      if (!imageUrl) {
        return new Response('Missing url parameter', { status: 400 });
      }

      try {
        const response = await fetch(imageUrl);
        const buffer = Buffer.from(await response.arrayBuffer());

        const thumb = await thumbnailBuffer(buffer, {
          width,
          format: format === 'jpeg' ? 'Jpeg' : format === 'png' ? 'Png' : 'Webp',
          fastMode: fast,
          quality: 85,
        });

        const contentType = format === 'jpeg' ? 'image/jpeg'
          : format === 'png' ? 'image/png'
          : 'image/webp';

        return new Response(thumb, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000',
          }
        });
      } catch (error) {
        return new Response('Failed to process image', { status: 500 });
      }
    }

    return new Response('Not Found', { status: 404 });
  }
});

// Usage: http://localhost:3000/thumbnail?url=https://example.com/image.jpg&w=300&f=webp&fast=1
```

---

## Comparison: shrinkOnLoad vs no shrink

### Benchmark Script

```typescript
import { thumbnail } from 'imgkit';

const buffer = Buffer.from(await Bun.file('large-photo.jpg').arrayBuffer());

// With shrink-on-load (default)
console.time('shrinkOnLoad');
for (let i = 0; i < 100; i++) {
  await thumbnail(buffer, { width: 200, shrinkOnLoad: true });
}
console.timeEnd('shrinkOnLoad');

// Without shrink-on-load
console.time('noShrink');
for (let i = 0; i < 100; i++) {
  await thumbnail(buffer, { width: 200, shrinkOnLoad: false });
}
console.timeEnd('noShrink');

// Fast mode
console.time('fastMode');
for (let i = 0; i < 100; i++) {
  await thumbnail(buffer, { width: 200, fastMode: true });
}
console.timeEnd('fastMode');
```

**Typical Results (4000x3000 JPEG → 200px):**
- shrinkOnLoad: ~900ms (100 images)
- noShrink: ~1600ms (100 images)
- fastMode: ~800ms (100 images)

---

## Sync vs Async

### Async (recommended)

```typescript
// Non-blocking, better for servers
const thumb = await thumbnail(buffer, { width: 200 });
```

### Sync

```typescript
import { thumbnailSync } from 'imgkit';

// Blocking, use for scripts or when needed
const result = thumbnailSync(buffer, { width: 200 });
```

---

## Error Handling

```typescript
import { thumbnailBuffer } from 'imgkit';

async function safeThumbnail(buffer: Buffer, width: number) {
  try {
    return await thumbnailBuffer(buffer, { width });
  } catch (error) {
    console.error('Failed to generate thumbnail:', error);
    // Return a placeholder or re-throw
    throw new Error('Invalid image');
  }
}
```

---

## Tips

1. **Use `fastMode` for batch processing** - The quality difference is minimal for thumbnails
2. **Use WebP output** - Best compression, widely supported
3. **Let shrink-on-load work** - Don't disable it unless you have a specific reason
4. **Process concurrently** - Use `Promise.all()` for multiple images
5. **Cache results** - Thumbnails are expensive to generate, cache them
