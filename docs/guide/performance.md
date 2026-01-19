# Performance

imgkit is built for maximum performance. Here's how to get the best results.

## Benchmarks

Tested on Apple M1 Pro with Bun 1.3.3:

| Operation | imgkit | sharp | Speedup |
|-----------|---------------:|------:|:-------:|
| WebP Metadata | 0.004ms | 3.4ms | **950x** |
| JPEG Metadata | 0.003ms | 0.1ms | **38x** |
| 50 Concurrent Ops | 62ms | 160ms | **2.6x** |
| Transform Pipeline | 12.2ms | 19.1ms | **1.6x** |
| 1MB JPEG → 800px | 12.6ms | 20.3ms | **1.6x** |
| Thumbnail (200px) | 8.8ms | 10.7ms | **1.2x** |

### WebP Resize (NEW in v1.4.0)

| Source Size | Target | imgkit | sharp | Speedup |
|-------------|--------|---------------:|------:|:-------:|
| 800x600 | 200px | **3.1ms** | 4.3ms | **1.40x** |
| 1600x1200 | 200px | **6.4ms** | 8.0ms | **1.24x** |
| 2000x1500 | 200px | **8.6ms** | 10.1ms | **1.18x** |
| 3000x2000 | 200px | **14.7ms** | 16.1ms | **1.10x** |
| 4000x3000 | 400px | **32.4ms** | 33.1ms | **1.02x** |

> WebP shrink-on-load optimization using libwebp's native scaling - faster than sharp across ALL sizes!

## Why So Fast?

### Rust Core

The image processing core is written in Rust:

- Zero-copy buffer handling
- Memory safety without garbage collection
- SIMD optimizations where available

### TurboJPEG

JPEG operations use libjpeg-turbo with SIMD:

- 2-6x faster than standard libjpeg
- Automatic CPU feature detection (SSE2, AVX2, NEON)

### Header-Only Metadata

Metadata extraction reads only file headers:

```typescript
// This is FAST - doesn't decode the image
const info = await metadata(largeImageBuffer);
// 0.003ms for 10MB JPEG
```

### Shrink-on-Decode

JPEG, WebP, and HEIC use shrink-on-decode optimization - decoding directly at reduced resolution:

```typescript
// Decodes directly at target size
const thumb = await transform(largeBuffer, {
  resize: { width: 200 }
});
// Faster than decode → resize
```

**How it works:**
- For JPEG: Uses TurboJPEG scaling factors (1/8, 1/4, 1/2, 1/1) to decode at reduced resolution
- For WebP: Uses libwebp's native `use_scaling` to decode directly at target resolution (NEW in v1.4.0)
- For HEIC: Uses libheif's built-in scaling during decode
- Matches and exceeds sharp's `fastShrinkOnLoad` behavior

| Original | Target | Scale Factor | Pixels Processed |
|----------|--------|:------------:|:----------------:|
| 4000px | 200px | 1/8 | 500px then resize |
| 4000px | 800px | 1/4 | 1000px then resize |
| 4000px | 1600px | 1/2 | 2000px then resize |

### Multi-Step Resize

For large scale reductions (>75% smaller), uses progressive halving:

```
4000px → 2000px → 1000px → 500px → 200px (target)
```

- Each step uses Box filter (ideal for downscaling)
- Final step uses Bilinear for smooth result
- Much faster than single-step Lanczos3 for extreme downscales

### Adaptive Algorithm Selection

When no filter is specified, automatically selects optimal algorithm:

| Scale Factor | Algorithm | Reason |
|:------------:|-----------|--------|
| >4x downscale | Box | Fastest, good averaging |
| 2-4x downscale | Bilinear | Fast, acceptable quality |
| 1.33-2x downscale | CatmullRom | Balanced |
| <1.33x | Lanczos3 | Best quality |

## Performance Tips

### 1. Use Async API

Async operations don't block the event loop:

```typescript
// Good: Non-blocking
const result = await transform(buffer, options);

// Avoid in servers: Blocks event loop
const result = transformSync(buffer, options);
```

### 2. Batch Operations with transform()

Single `transform()` call is faster than multiple operations:

```typescript
// Fast: Single operation
const result = await transform(buffer, {
  resize: { width: 800 },
  grayscale: true,
  sharpen: 10,
  output: { format: 'webp' }
});

// Slow: Multiple operations
const resized = await resize(buffer, { width: 800 });
const gray = await transform(resized, { grayscale: true });
const sharp = await transform(gray, { sharpen: 10 });
const webp = await toWebp(sharp);
```

### 3. Choose Appropriate Filter

Filter choice affects speed:

```typescript
// Fastest (lower quality)
await resize(buffer, { width: 400, filter: 'nearest' });

// Fast (good quality)
await resize(buffer, { width: 400, filter: 'bilinear' });

// Slower (best quality)
await resize(buffer, { width: 400, filter: 'lanczos3' });
```

### 4. Resize First

Resize before applying effects:

```typescript
// Fast: Process fewer pixels
const result = await transform(buffer, {
  resize: { width: 800 },  // Resize first
  blur: 5,                 // Then blur smaller image
  output: { format: 'webp' }
});
```

### 5. Use WebP Output

WebP encoding is highly optimized:

```typescript
// WebP is smaller and often faster to encode
await transform(buffer, {
  resize: { width: 800 },
  output: { format: 'webp', webp: { quality: 80 } }
});
```

### 6. Process Concurrently

Take advantage of async for parallel processing:

```typescript
const files = ['a.jpg', 'b.jpg', 'c.jpg'];

// Process all concurrently
const results = await Promise.all(
  files.map(async (file) => {
    const buffer = Buffer.from(await Bun.file(file).arrayBuffer());
    return transform(buffer, {
      resize: { width: 800 },
      output: { format: 'webp' }
    });
  })
);
```

## Memory Usage

### Buffer Handling

imgkit uses zero-copy where possible:

```typescript
// Input buffer is not copied
const result = await transform(buffer, options);
// Result is a new buffer
```

### Large Images

For very large images, process in chunks or limit concurrency:

```typescript
import pLimit from 'p-limit';

const limit = pLimit(4);  // Max 4 concurrent

const results = await Promise.all(
  files.map(file =>
    limit(async () => {
      const buffer = Buffer.from(await Bun.file(file).arrayBuffer());
      return transform(buffer, options);
    })
  )
);
```

## Profiling

### Measure Operations

```typescript
const start = performance.now();
const result = await transform(buffer, options);
const duration = performance.now() - start;
console.log(`Transform took ${duration.toFixed(2)}ms`);
```

### Run Benchmarks

```bash
# Clone the repo and run benchmarks
git clone https://github.com/nexus-aissam/imgkit
cd imgkit
bun run benchmarks/final_comparison.ts
```

## Server Deployment

### Recommended Settings

```typescript
import { transform } from 'imgkit';

// Use async API
// Limit concurrent operations
// Set reasonable timeouts

const MAX_CONCURRENT = 10;
let activeOps = 0;

async function processImage(buffer: Buffer) {
  if (activeOps >= MAX_CONCURRENT) {
    throw new Error('Too many concurrent operations');
  }

  activeOps++;
  try {
    return await transform(buffer, {
      resize: { width: 1200 },
      output: { format: 'webp', webp: { quality: 80 } }
    });
  } finally {
    activeOps--;
  }
}
```

### Docker Considerations

The prebuilt binaries work in most Docker images:

```dockerfile
FROM oven/bun:1

WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install

COPY . .
CMD ["bun", "run", "start"]
```
