# toJpeg

Convert an image to JPEG format.

## Signature

```typescript
function toJpeg(input: Buffer, options?: JpegOptions): Promise<Buffer>
function toJpegSync(input: Buffer, options?: JpegOptions): Buffer
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `input` | `Buffer` | Image buffer |
| `options` | `JpegOptions` | JPEG encoding options (optional) |

### JpegOptions

```typescript
interface JpegOptions {
  quality?: number;  // 1-100, default: 80
}
```

## Returns

`Buffer` - JPEG encoded image

## Examples

### Basic Conversion

```typescript
import { toJpeg } from 'imgkit';

const jpeg = await toJpeg(buffer);
await Bun.write('output.jpg', jpeg);
```

### With Quality Setting

```typescript
// High quality
const hq = await toJpeg(buffer, { quality: 95 });

// Medium quality (default)
const mq = await toJpeg(buffer, { quality: 80 });

// Low quality (smaller file)
const lq = await toJpeg(buffer, { quality: 60 });
```

### Sync Version

```typescript
import { toJpegSync } from 'imgkit';

const jpeg = toJpegSync(buffer, { quality: 85 });
```

### From HEIC

```typescript
// Convert iPhone photo to JPEG
const heic = Buffer.from(await Bun.file('IMG_1234.HEIC').arrayBuffer());
const jpeg = await toJpeg(heic, { quality: 90 });
await Bun.write('photo.jpg', jpeg);
```

### From PNG with Transparency

```typescript
// Note: Transparency will be lost (converted to white)
const png = Buffer.from(await Bun.file('logo.png').arrayBuffer());
const jpeg = await toJpeg(png, { quality: 90 });
```

## Quality Guidelines

| Quality | File Size | Use Case |
|---------|-----------|----------|
| 95-100 | Large | Archival, print |
| 85-90 | Medium | Web, high quality |
| 75-80 | Balanced | General web use |
| 60-70 | Small | Thumbnails |
| < 60 | Very small | Maximum compression |

## Performance

JPEG encoding uses TurboJPEG with SIMD acceleration:

- **2-6x faster** than standard libjpeg
- Automatic CPU feature detection (SSE2, AVX2, NEON)

## Notes

- Transparency is not supported (converted to white background)
- Quality 100 is not truly lossless (use PNG for lossless)
- Output is always RGB (not CMYK)
- EXIF data is not preserved

## See Also

- [`toPng()`](/api/to-png) - For lossless conversion
- [`toWebp()`](/api/to-webp) - For smaller file sizes
- [`transform()`](/api/transform) - For resize + convert in one operation
