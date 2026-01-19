# HEIC Conversion

Convert iPhone photos (HEIC/HEIF) to standard formats.

::: warning Platform Requirement
HEIC support is only available on **macOS ARM64** (M1/M2/M3/M4/M5 Macs).
:::

## Source Code

```typescript
/**
 * HEIC Conversion Example
 * Convert iPhone photos to JPEG, PNG, or WebP
 *
 * Requirements:
 * - macOS ARM64 (M1/M2/M3/M4/M5) 
 * - HEIC file (e.g., from iPhone)
 */

import {
  metadata,
  toJpeg,
  toPng,
  toWebp,
  transform,
  blurhash
} from 'imgkit';
import { existsSync, mkdirSync } from 'fs';

async function main() {
  // Check for HEIC file
  const heicPath = process.argv[2] || 'image.heic';

  if (!existsSync(heicPath)) {
    console.log('Usage: bun run heic <path-to-heic-file>');
    console.log('');
    console.log('Example:');
    console.log('  bun run heic ~/Pictures/IMG_1234.HEIC');
    return;
  }

  console.log(`Processing: ${heicPath}\n`);

  // Read HEIC file
  const heicBuffer = Buffer.from(await Bun.file(heicPath).arrayBuffer());

  // Get metadata
  console.log('=== HEIC Metadata ===');
  try {
    const info = await metadata(heicBuffer);
    console.log(`Dimensions: ${info.width}x${info.height}`);
    console.log(`Format: ${info.format}`);
    console.log(`Channels: ${info.channels}`);
    console.log(`File size: ${(heicBuffer.length / 1024 / 1024).toFixed(2)}MB`);
  } catch (error) {
    console.error('HEIC not supported on this platform');
    console.error('HEIC requires macOS ARM64 (M1/M2/M3/M4/M5)');
    return;
  }

  // Ensure output directory
  if (!existsSync('output')) {
    mkdirSync('output');
  }

  // Convert to JPEG
  console.log('\n=== Converting to JPEG ===');
  const startJpeg = performance.now();
  const jpeg = await toJpeg(heicBuffer, { quality: 90 });
  const jpegTime = performance.now() - startJpeg;
  await Bun.write('output/converted.jpg', jpeg);
  console.log(`Time: ${jpegTime.toFixed(0)}ms`);
  console.log(`Size: ${(jpeg.length / 1024).toFixed(1)}KB`);
  console.log('Saved: output/converted.jpg');

  // Convert to PNG
  console.log('\n=== Converting to PNG ===');
  const startPng = performance.now();
  const png = await toPng(heicBuffer);
  const pngTime = performance.now() - startPng;
  await Bun.write('output/converted.png', png);
  console.log(`Time: ${pngTime.toFixed(0)}ms`);
  console.log(`Size: ${(png.length / 1024).toFixed(1)}KB`);
  console.log('Saved: output/converted.png');

  // Convert to WebP
  console.log('\n=== Converting to WebP ===');
  const startWebp = performance.now();
  const webp = await toWebp(heicBuffer, { quality: 85 });
  const webpTime = performance.now() - startWebp;
  await Bun.write('output/converted.webp', webp);
  console.log(`Time: ${webpTime.toFixed(0)}ms`);
  console.log(`Size: ${(webp.length / 1024).toFixed(1)}KB`);
  console.log('Saved: output/converted.webp');

  // Create thumbnail
  console.log('\n=== Creating Thumbnail ===');
  const startThumb = performance.now();
  const thumb = await transform(heicBuffer, {
    resize: { width: 200, height: 200, fit: 'cover' },
    output: { format: 'webp', webp: { quality: 70 } }
  });
  const thumbTime = performance.now() - startThumb;
  await Bun.write('output/thumbnail.webp', thumb);
  console.log(`Time: ${thumbTime.toFixed(0)}ms`);
  console.log(`Size: ${(thumb.length / 1024).toFixed(1)}KB`);
  console.log('Saved: output/thumbnail.webp');

  // Generate blurhash
  console.log('\n=== Generating Blurhash ===');
  const startHash = performance.now();
  const { hash } = await blurhash(heicBuffer, 4, 3);
  const hashTime = performance.now() - startHash;
  console.log(`Time: ${hashTime.toFixed(0)}ms`);
  console.log(`Hash: ${hash}`);

  // Summary
  console.log('\n=== Summary ===');
  console.log(`HEIC → JPEG: ${jpegTime.toFixed(0)}ms`);
  console.log(`HEIC → PNG: ${pngTime.toFixed(0)}ms`);
  console.log(`HEIC → WebP: ${webpTime.toFixed(0)}ms`);
  console.log(`HEIC → Thumbnail: ${thumbTime.toFixed(0)}ms`);
  console.log(`Blurhash: ${hashTime.toFixed(0)}ms`);

  console.log('\n✅ HEIC conversion completed!');
  console.log('Check the output/ folder for results.');
}

main().catch(console.error);
```

## Running the Example

```bash
cd examples
bun install

# With your own HEIC file
bun run heic ~/Pictures/IMG_1234.HEIC

# Or use the included test file
bun run heic image.heic
```

## Output

```text
Processing: image.heic

=== HEIC Metadata ===
Dimensions: 4032x3024
Format: heic
Channels: 3
File size: 2.45MB

=== Converting to JPEG ===
Time: 169ms
Size: 1847.2KB
Saved: output/converted.jpg

=== Converting to PNG ===
Time: 892ms
Size: 15234.1KB
Saved: output/converted.png

=== Converting to WebP ===
Time: 798ms
Size: 1234.5KB
Saved: output/converted.webp

=== Creating Thumbnail ===
Time: 137ms
Size: 8.2KB
Saved: output/thumbnail.webp

=== Generating Blurhash ===
Time: 301ms
Hash: LEHV6nWB2yk8pyo0adR*.7kCMdnj

=== Summary ===
HEIC → JPEG: 169ms
HEIC → PNG: 892ms
HEIC → WebP: 798ms
HEIC → Thumbnail: 137ms
Blurhash: 301ms

✅ HEIC conversion completed!
Check the output/ folder for results.
```

## Batch HEIC Conversion

Convert all HEIC files in a folder:

```typescript
import { readdir } from 'fs/promises';
import { join } from 'path';
import { toJpeg } from 'imgkit';

async function convertFolder(inputDir: string, outputDir: string) {
  const files = await readdir(inputDir);
  const heicFiles = files.filter(f =>
    f.toLowerCase().endsWith('.heic') ||
    f.toLowerCase().endsWith('.heif')
  );

  console.log(`Found ${heicFiles.length} HEIC files`);

  for (const file of heicFiles) {
    const input = await Bun.file(join(inputDir, file)).arrayBuffer();
    const jpeg = await toJpeg(Buffer.from(input), { quality: 90 });

    const outputName = file.replace(/\.heic?$/i, '.jpg');
    await Bun.write(join(outputDir, outputName), jpeg);

    console.log(`✓ ${file} → ${outputName}`);
  }
}

await convertFolder('./heic-photos', './converted');
```

## Why Convert HEIC?

- **Compatibility**: Not all apps/platforms support HEIC
- **Web use**: Browsers don't display HEIC directly
- **Sharing**: JPEG/WebP are universally supported
- **Archival**: Standard formats for long-term storage

## Performance Notes

| Operation | Time | Notes |
|-----------|-----:|-------|
| Metadata | 0.1ms | Header-only parsing |
| HEIC → JPEG | ~170ms | Optimized decoding |
| HEIC → WebP | ~800ms | Re-encoding overhead |
| Thumbnail | ~140ms | Shrink-on-decode |

## Next Steps

- [API Endpoint](/examples/api-endpoint) - HTTP server for conversion
- [Batch Processing](/examples/batch-processing) - Process many files
