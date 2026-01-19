# toWebp

Convert an image to WebP format.

## Signature

```typescript
function toWebp(input: Buffer, options?: WebpOptions): Promise<Buffer>
function toWebpSync(input: Buffer, options?: WebpOptions): Buffer
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `input` | `Buffer` | Image buffer |
| `options` | `WebpOptions` | WebP encoding options (optional) |

### WebpOptions

```typescript
interface WebpOptions {
  quality?: number;    // 1-100, default: 80 (lossy mode)
  lossless?: boolean;  // Use lossless compression, default: false
}
```

## Returns

`Buffer` - WebP encoded image

## Examples

### Basic Conversion

```typescript
import { toWebp } from 'imgkit';

const webp = await toWebp(buffer);
await Bun.write('output.webp', webp);
```

### Lossy Compression

```typescript
// High quality
const hq = await toWebp(buffer, { quality: 90 });

// Medium quality (default)
const mq = await toWebp(buffer, { quality: 80 });

// Low quality (smaller file)
const lq = await toWebp(buffer, { quality: 60 });
```

### Lossless Compression

```typescript
const lossless = await toWebp(buffer, { lossless: true });
// Note: quality option is ignored in lossless mode
```

### Sync Version

```typescript
import { toWebpSync } from 'imgkit';

const webp = toWebpSync(buffer, { quality: 85 });
```

### From JPEG

```typescript
const jpeg = Buffer.from(await Bun.file('photo.jpg').arrayBuffer());
const webp = await toWebp(jpeg, { quality: 85 });
// Typically 25-35% smaller than equivalent JPEG
```

### From HEIC

```typescript
const heic = Buffer.from(await Bun.file('IMG_1234.HEIC').arrayBuffer());
const webp = await toWebp(heic, { quality: 85 });
```

### With Transparency

```typescript
const pngWithAlpha = Buffer.from(await Bun.file('logo.png').arrayBuffer());
const webp = await toWebp(pngWithAlpha, { quality: 90 });
// Transparency is preserved
```

## Lossy vs Lossless

| Mode | Use Case | File Size |
|------|----------|-----------|
| Lossy | Photos, general images | Smallest |
| Lossless | Screenshots, graphics, text | Larger |

### Lossy Mode

```typescript
// Best for photos
const photo = await toWebp(buffer, {
  quality: 85,
  lossless: false  // default
});
```

### Lossless Mode

```typescript
// Best for screenshots, graphics
const screenshot = await toWebp(buffer, {
  lossless: true
});
```

## Quality Guidelines

| Quality | File Size | Use Case |
|---------|-----------|----------|
| 90-100 | Large | High quality display |
| 80-85 | Medium | General web use |
| 70-75 | Smaller | Good balance |
| 50-65 | Small | Thumbnails |
| < 50 | Very small | Aggressive compression |

## Why WebP?

- **25-35% smaller** than JPEG at equivalent quality
- **Supports transparency** (like PNG)
- **Lossy and lossless** modes
- **Supported by all modern browsers**

## Browser Support

WebP is supported in:
- Chrome 17+
- Firefox 65+
- Safari 14+
- Edge 18+

## Notes

- Supports alpha channel (transparency)
- In lossy mode, quality 100 is still lossy
- Lossless mode ignores quality setting
- Excellent for web delivery

## See Also

- [`toJpeg()`](/api/to-jpeg) - For maximum compatibility
- [`toPng()`](/api/to-png) - For lossless without WebP support
- [`transform()`](/api/transform) - For resize + convert in one operation
