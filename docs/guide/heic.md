# HEIC Support

imgkit is the **only** high-performance image library with native HEIC/HEIF support.

## What is HEIC?

HEIC (High Efficiency Image Container) is Apple's modern image format:

- Used by iPhones since iOS 11
- 50% smaller than JPEG at same quality
- Supports HDR, depth maps, and live photos
- File extensions: `.heic`, `.heif`

## Platform Support

HEIC/HEIF decoding is only available on macOS ARM64:

| Platform | Architecture | HEIC Support |
|----------|--------------|:------------:|
| macOS | ARM64 (M1/M2/M3/M4/M5) | ✅ |
| macOS | x64 (Intel) | ❌ |
| Linux | x64 / ARM64 | ❌ |
| Windows | x64 / ARM64 | ❌ |

::: warning macOS ARM64 Only
HEIC support requires macOS with Apple Silicon due to libheif library requirements. All other image formats (JPEG, PNG, WebP, GIF, BMP) are supported on **all platforms**.
:::

## Reading HEIC Files

```typescript
import { metadata } from 'imgkit';

// Read HEIC file
const heic = await Bun.file('IMG_1234.HEIC').arrayBuffer();
const buffer = Buffer.from(heic);

// Get metadata
const info = await metadata(buffer);
console.log(info);
// {
//   width: 4032,
//   height: 3024,
//   format: 'heic',
//   channels: 3,
//   hasAlpha: false
// }
```

## Converting HEIC to Other Formats

### To JPEG

```typescript
import { toJpeg } from 'imgkit';

const jpeg = await toJpeg(heicBuffer, { quality: 90 });
await Bun.write('photo.jpg', jpeg);
```

### To WebP

```typescript
import { toWebp } from 'imgkit';

const webp = await toWebp(heicBuffer, { quality: 85 });
await Bun.write('photo.webp', webp);
```

### To PNG

```typescript
import { toPng } from 'imgkit';

const png = await toPng(heicBuffer);
await Bun.write('photo.png', png);
```

## Resizing HEIC Images

```typescript
import { transform } from 'imgkit';

// Create thumbnail from HEIC
const thumb = await transform(heicBuffer, {
  resize: { width: 200, height: 200, fit: 'cover' },
  output: { format: 'webp', webp: { quality: 70 } }
});
```

## Batch HEIC Conversion

```typescript
import { readdir } from 'fs/promises';
import { join } from 'path';
import { toJpeg } from 'imgkit';

async function convertHeicFolder(inputDir: string, outputDir: string) {
  const files = await readdir(inputDir);
  const heicFiles = files.filter(f =>
    f.toLowerCase().endsWith('.heic') ||
    f.toLowerCase().endsWith('.heif')
  );

  for (const file of heicFiles) {
    const input = await Bun.file(join(inputDir, file)).arrayBuffer();
    const jpeg = await toJpeg(Buffer.from(input), { quality: 90 });

    const outputName = file.replace(/\.heic?$/i, '.jpg');
    await Bun.write(join(outputDir, outputName), jpeg);

    console.log(`Converted: ${file} → ${outputName}`);
  }
}
```

## Performance

HEIC operations are optimized with shrink-on-decode:

| Operation | Time | Notes |
|-----------|-----:|-------|
| Metadata | 0.1ms | Instant extraction |
| Full decode → JPEG | 169ms | Full quality |
| Resize → 800px JPEG | 138ms | Shrink-on-decode |
| Thumbnail → 200px | 137ms | Fast thumbnails |

## Checking HEIC Support

```typescript
import { metadata } from 'imgkit';

async function isHeicSupported(): Promise<boolean> {
  try {
    // Try to decode a minimal HEIC header
    // This will throw if HEIC is not supported
    const testBuffer = Buffer.from([
      0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70,
      0x68, 0x65, 0x69, 0x63
    ]);
    await metadata(testBuffer);
    return true;
  } catch {
    return false;
  }
}

// Check before processing
if (await isHeicSupported()) {
  console.log('HEIC is supported on this platform');
} else {
  console.log('HEIC is NOT supported - use alternative format');
}
```

## Error Handling

```typescript
import { toJpeg } from 'imgkit';

try {
  const jpeg = await toJpeg(heicBuffer, { quality: 90 });
  await Bun.write('output.jpg', jpeg);
} catch (error) {
  if (error.message.includes('HEIC')) {
    console.error('HEIC not supported on this platform');
    // Fallback: Ask user to convert on their device
  } else {
    throw error;
  }
}
```

## AVIF Support

AVIF files are also supported through libheif:

```typescript
const info = await metadata(avifBuffer);
// { format: 'avif', ... }

const jpeg = await toJpeg(avifBuffer, { quality: 90 });
```

## Comparison with Other Libraries

| Library | HEIC Read | HEIC Write | Performance |
|---------|:---------:|:----------:|-------------|
| imgkit | ✅ | ❌ | Fast |
| sharp | ❌ | ❌ | N/A |
| jimp | ❌ | ❌ | N/A |
| imagemagick | ✅ | ✅ | Slow |

imgkit provides the **only** high-performance HEIC support in the Node.js/Bun ecosystem.
