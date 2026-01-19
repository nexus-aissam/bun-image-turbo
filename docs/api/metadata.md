# metadata

Get image metadata without fully decoding the image. Ultra-fast header-only parsing.

## Signature

```typescript
function metadata(input: Buffer): Promise<ImageMetadata>
function metadataSync(input: Buffer): ImageMetadata
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `input` | `Buffer` | Image buffer |

## Returns

```typescript
interface ImageMetadata {
  /** Image width in pixels */
  width: number;

  /** Image height in pixels */
  height: number;

  /** Detected format (jpeg, png, webp, gif, bmp, ico, tiff, heic, avif) */
  format: string;

  /** File size in bytes (if available) */
  size?: number;

  /** Color space (srgb, rgb, grayscale) */
  space: string;

  /** Number of channels (1, 2, 3, or 4) */
  channels: number;

  /** Bit depth per sample (uchar = 8-bit) */
  depth: string;

  /** Whether the image has an alpha channel */
  hasAlpha: boolean;

  /** Bits per sample (typically 8) */
  bitsPerSample: number;

  /** Whether the image is progressive (JPEG) or interlaced (PNG) */
  isProgressive: boolean;

  /** Whether the image uses palette/indexed colors (PNG/GIF) */
  isPalette: boolean;

  /** Whether the image has an embedded ICC profile */
  hasProfile: boolean;

  /** EXIF orientation value (1-8, if present) */
  orientation?: number;

  /** Page/frame count for multi-page images (GIF, TIFF) */
  pages?: number;

  /** Loop count for animated images */
  loopCount?: number;

  /** Delay between frames in ms (for animated images) */
  delay?: number[];

  /** Background color [r, g, b, a] (for GIF) */
  background?: number[];

  /** Compression type used */
  compression?: string;

  /** Density/DPI info */
  density?: number;
}
```

## Examples

### Basic Usage

```typescript
import { metadata } from 'imgkit';

const buffer = Buffer.from(await Bun.file('photo.jpg').arrayBuffer());
const info = await metadata(buffer);

console.log(info);
// {
//   width: 1920,
//   height: 1080,
//   format: 'jpeg',
//   space: 'srgb',
//   channels: 3,
//   depth: 'uchar',
//   hasAlpha: false,
//   bitsPerSample: 8,
//   isProgressive: false,
//   isPalette: false,
//   hasProfile: false
// }
```

### Sync Version

```typescript
import { metadataSync } from 'imgkit';

const info = metadataSync(buffer);
console.log(`${info.width}x${info.height} ${info.format}`);
```

### Format Detection

```typescript
const info = await metadata(buffer);

switch (info.format) {
  case 'jpeg':
    console.log('JPEG image');
    break;
  case 'png':
    console.log('PNG image');
    break;
  case 'webp':
    console.log('WebP image');
    break;
  case 'heic':
    console.log('HEIC image (iPhone)');
    break;
  case 'avif':
    console.log('AVIF image');
    break;
  case 'gif':
    console.log('GIF image');
    break;
  case 'bmp':
    console.log('BMP image');
    break;
  case 'tiff':
    console.log('TIFF image');
    break;
  case 'ico':
    console.log('ICO image');
    break;
}
```

### Alpha Channel Detection

```typescript
const info = await metadata(buffer);

if (info.hasAlpha) {
  // Use PNG or WebP to preserve transparency
  const output = await toPng(buffer);
} else {
  // JPEG is fine for non-transparent images
  const output = await toJpeg(buffer);
}
```

### Animated GIF Detection

```typescript
const info = await metadata(gifBuffer);

if (info.pages && info.pages > 1) {
  console.log(`Animated GIF with ${info.pages} frames`);
  console.log(`Loop count: ${info.loopCount}`);
  console.log(`Frame delays: ${info.delay?.join(', ')}ms`);
}
```

### Image Validation

```typescript
async function validateImage(buffer: Buffer) {
  const info = await metadata(buffer);

  // Check dimensions
  if (info.width > 10000 || info.height > 10000) {
    throw new Error('Image too large');
  }

  // Check format
  const supportedFormats = ['jpeg', 'png', 'webp', 'gif', 'heic'];
  if (!supportedFormats.includes(info.format)) {
    throw new Error(`Unsupported format: ${info.format}`);
  }

  // Check for progressive JPEG
  if (info.format === 'jpeg' && info.isProgressive) {
    console.log('Progressive JPEG detected');
  }

  return info;
}
```

### Color Space Detection

```typescript
const info = await metadata(buffer);

console.log(`Color space: ${info.space}`);
console.log(`Channels: ${info.channels}`);
console.log(`Bit depth: ${info.depth} (${info.bitsPerSample} bits)`);

// Typical values:
// - RGB: space='srgb', channels=3
// - RGBA: space='srgb', channels=4, hasAlpha=true
// - Grayscale: space='grayscale', channels=1
// - Grayscale with alpha: space='grayscale', channels=2, hasAlpha=true
```

## Performance

Metadata extraction is extremely fast because it only reads headers:

| Format | Time | Notes |
|--------|-----:|-------|
| JPEG (10MB) | **0.003ms** | Parse markers to SOF0/SOF2 |
| WebP (10MB) | **0.004ms** | Read VP8/VP8L/VP8X chunks |
| PNG (10MB) | **0.002ms** | Read IHDR chunk |
| HEIC | **0.1ms** | Read ftyp + primary image handle |
| GIF | **0.002ms** | Read header + frame count |

This is **950x faster** than sharp for WebP and **38x faster** for JPEG.

## Supported Formats

| Format | Supported | Notes |
|--------|:---------:|-------|
| JPEG | ✅ | Including progressive |
| PNG | ✅ | Including interlaced |
| WebP | ✅ | Lossy and lossless |
| HEIC/HEIF | ✅ | macOS ARM64 only |
| AVIF | ✅ | Via libheif |
| GIF | ✅ | Including animated |
| BMP | ✅ | All variants |
| TIFF | ✅ | Multi-page support |
| ICO | ✅ | Multi-size icons |

## Errors

```typescript
try {
  const info = await metadata(invalidBuffer);
} catch (error) {
  // Possible errors:
  // - "Failed to detect image format"
  // - "Invalid image data"
  // - "Empty buffer"
  // - "HEIC not supported on this platform"
  console.error(error.message);
}
```

## See Also

- [`transform()`](/api/transform) - Process images
- [`resize()`](/api/resize) - Resize images
