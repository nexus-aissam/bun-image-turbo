# toPng

Convert an image to PNG format.

## Signature

```typescript
function toPng(input: Buffer, options?: PngOptions): Promise<Buffer>
function toPngSync(input: Buffer, options?: PngOptions): Buffer
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `input` | `Buffer` | Image buffer |
| `options` | `PngOptions` | PNG encoding options (optional) |

### PngOptions

```typescript
interface PngOptions {
  compression?: number;  // 0-9, default: 6
}
```

## Returns

`Buffer` - PNG encoded image

## Examples

### Basic Conversion

```typescript
import { toPng } from 'imgkit';

const png = await toPng(buffer);
await Bun.write('output.png', png);
```

### With Compression Level

```typescript
// Fast compression (larger file)
const fast = await toPng(buffer, { compression: 1 });

// Balanced (default)
const balanced = await toPng(buffer, { compression: 6 });

// Maximum compression (smaller file, slower)
const max = await toPng(buffer, { compression: 9 });
```

### Sync Version

```typescript
import { toPngSync } from 'imgkit';

const png = toPngSync(buffer, { compression: 6 });
```

### Preserve Transparency

```typescript
// PNG preserves alpha channel
const webpWithAlpha = Buffer.from(await Bun.file('logo.webp').arrayBuffer());
const png = await toPng(webpWithAlpha);
// Transparency is preserved
```

### From JPEG

```typescript
const jpeg = Buffer.from(await Bun.file('photo.jpg').arrayBuffer());
const png = await toPng(jpeg);
// Note: No quality loss, but file will be larger
```

## Compression Levels

| Level | Speed | File Size |
|-------|-------|-----------|
| 0 | Fastest | Largest |
| 1-2 | Fast | Large |
| 3-5 | Medium | Medium |
| 6 | Balanced | Balanced (default) |
| 7-8 | Slow | Smaller |
| 9 | Slowest | Smallest |

## When to Use PNG

**Use PNG for:**
- Images with transparency
- Screenshots
- Graphics with text
- Logos and icons
- When lossless quality is required

**Don't use PNG for:**
- Photos (use JPEG or WebP)
- Large images (file sizes can be huge)
- Web delivery (WebP is usually better)

## Notes

- PNG is always lossless
- Supports alpha channel (transparency)
- File sizes can be large for photos
- Compression level affects encoding time, not quality

## See Also

- [`toJpeg()`](/api/to-jpeg) - For photos without transparency
- [`toWebp()`](/api/to-webp) - For smaller files with transparency
- [`transform()`](/api/transform) - For resize + convert in one operation
