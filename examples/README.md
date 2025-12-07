# bun-image-turbo Examples

This folder contains example scripts demonstrating how to use `bun-image-turbo`.

## Running Examples

All examples can be run with Bun:

```bash
# From the project root
bun examples/basic-usage.ts
bun examples/transform-pipeline.ts
bun examples/blurhash-demo.ts
bun examples/server-example.ts
```

## Examples Overview

### 1. Basic Usage (`basic-usage.ts`)

Demonstrates fundamental operations:

- Metadata extraction (sync & async)
- Format conversion (JPEG, PNG, WebP)
- Basic resize operations

```bash
bun examples/basic-usage.ts
```

### 2. Transform Pipeline (`transform-pipeline.ts`)

Shows how to chain multiple transformations in a single call:

- Resize + format conversion
- Grayscale + sharpen
- Blur + brightness + contrast
- Different fit modes (cover, contain, fill)

```bash
bun examples/transform-pipeline.ts
```

### 3. Blurhash Demo (`blurhash-demo.ts`)

Demonstrates blurhash placeholder generation:

- Basic blurhash generation
- Different component sizes
- Performance benchmarking
- Usage in HTML/CSS

```bash
bun examples/blurhash-demo.ts
```

### 4. Server Example (`server-example.ts`)

A complete HTTP server for image processing:

- `/health` - Health check
- `/metadata` - Extract image metadata
- `/resize` - Resize images
- `/webp` - Convert to WebP
- `/transform` - Full transformation pipeline
- `/blurhash` - Generate blurhash placeholders

```bash
bun examples/server-example.ts

# Then test with:
curl http://localhost:3000/health
curl -X POST http://localhost:3000/metadata --data-binary @image.jpg
curl -X POST "http://localhost:3000/resize?width=200" --data-binary @image.jpg -o resized.jpg
curl -X POST "http://localhost:3000/webp?quality=80" --data-binary @image.jpg -o output.webp
```

## With Node.js

These examples are written for Bun but can be adapted for Node.js:

```typescript
// Replace Bun file reading:
// const file = Bun.file('image.jpg');
// const buffer = Buffer.from(await file.arrayBuffer());

// With Node.js:
import { readFile } from 'fs/promises';
const buffer = await readFile('image.jpg');
```

## Performance Tips

1. **Use transforms for multiple operations** - Combining resize, rotate, and format conversion in a single `transform()` call is faster than separate operations.

2. **Resize before blurhash** - Blurhash works best on small images (32x32). Resize first for better performance.

3. **Use sync APIs for simple operations** - `metadataSync()` is very fast and doesn't need async overhead.

4. **Batch concurrent operations** - `bun-image-turbo` handles concurrent operations 4.5x faster than Sharp.

```typescript
// Process many images concurrently
const results = await Promise.all(
  images.map(img => resize(img, { width: 200 }))
);
```
