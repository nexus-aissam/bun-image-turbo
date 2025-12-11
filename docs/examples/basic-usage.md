# Basic Usage

This example demonstrates the core functionality of bun-image-turbo.

## Source Code

```typescript
/**
 * Basic Usage Example
 * Demonstrates core functionality of bun-image-turbo
 */

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

async function main() {
  console.log(`bun-image-turbo v${version()}\n`);

  // Download a test image
  console.log('Downloading test image...');
  const response = await fetch('https://picsum.photos/1920/1080');
  const imageBuffer = Buffer.from(await response.arrayBuffer());

  // 1. Get metadata
  console.log('\n=== Metadata ===');
  const info = await metadata(imageBuffer);
  console.log(`Dimensions: ${info.width}x${info.height}`);
  console.log(`Format: ${info.format}`);
  console.log(`Channels: ${info.channels}`);
  console.log(`Has Alpha: ${info.hasAlpha}`);

  // 2. Resize
  console.log('\n=== Resize ===');
  const resized = await resize(imageBuffer, {
    width: 800,
    filter: 'lanczos3'
  });
  const resizedInfo = await metadata(resized);
  console.log(`Resized to: ${resizedInfo.width}x${resizedInfo.height}`);
  // Note: resize() always outputs PNG format
  await Bun.write('output/resized.png', resized);
  console.log('Saved: output/resized.png');

  // 3. Format conversion
  console.log('\n=== Format Conversion ===');

  // To JPEG
  const jpeg = await toJpeg(imageBuffer, { quality: 85 });
  console.log(`JPEG: ${(jpeg.length / 1024).toFixed(1)}KB`);
  await Bun.write('output/converted.jpg', jpeg);

  // To PNG
  const png = await toPng(imageBuffer, { compression: 6 });
  console.log(`PNG: ${(png.length / 1024).toFixed(1)}KB`);
  await Bun.write('output/converted.png', png);

  // To WebP
  const webp = await toWebp(imageBuffer, { quality: 80 });
  console.log(`WebP: ${(webp.length / 1024).toFixed(1)}KB`);
  await Bun.write('output/converted.webp', webp);

  // 4. Transform pipeline
  console.log('\n=== Transform Pipeline ===');
  const transformed = await transform(imageBuffer, {
    resize: { width: 400, height: 300, fit: 'cover' },
    rotate: 90,
    grayscale: true,
    sharpen: 10,
    output: { format: 'webp', webp: { quality: 80 } }
  });
  console.log(`Transformed: ${(transformed.length / 1024).toFixed(1)}KB`);
  await Bun.write('output/transformed.webp', transformed);
  console.log('Saved: output/transformed.webp');

  // 5. Blurhash
  console.log('\n=== Blurhash ===');
  const { hash, width, height } = await blurhash(imageBuffer, 4, 3);
  console.log(`Hash: ${hash}`);
  console.log(`Original size: ${width}x${height}`);

  console.log('\n✅ All examples completed!');
  console.log('Check the output/ folder for results.');
}

// Ensure output directory exists
import { mkdirSync, existsSync } from 'fs';
if (!existsSync('output')) {
  mkdirSync('output');
}

main().catch(console.error);
```

## Running the Example

```bash
cd examples
bun install
bun run basic
```

## Output

```text
bun-image-turbo v1.2.0

Downloading test image...

=== Metadata ===
Dimensions: 1920x1080
Format: jpeg
Channels: 3
Has Alpha: false

=== Resize ===
Resized to: 800x450
Saved: output/resized.png

=== Format Conversion ===
JPEG: 156.2KB
PNG: 2847.3KB
WebP: 98.4KB

=== Transform Pipeline ===
Transformed: 24.1KB
Saved: output/transformed.webp

=== Blurhash ===
Hash: LEHV6nWB2yk8pyo0adR*.7kCMdnj
Original size: 1920x1080

✅ All examples completed!
Check the output/ folder for results.
```

## Key Takeaways

1. **Metadata** is extracted without fully decoding the image
2. **WebP** produces significantly smaller files than JPEG/PNG
3. **transform()** is the most efficient for multiple operations
4. **Blurhash** creates tiny placeholder strings

## Next Steps

- [HEIC Conversion](/examples/heic-conversion) - Convert iPhone photos
- [API Endpoint](/examples/api-endpoint) - HTTP server example
- [Batch Processing](/examples/batch-processing) - Process multiple files
