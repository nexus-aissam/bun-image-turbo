# thumbhash

Generate compact image placeholders using ThumbHash algorithm.

ThumbHash produces smoother, more visually pleasing placeholders compared to BlurHash, with support for alpha channel and aspect ratio preservation.

## Usage

```typescript
import { thumbhash, thumbhashSync, thumbhashToRgba, thumbhashToDataUrl } from 'imgkit';

const buffer = Buffer.from(await Bun.file('photo.jpg').arrayBuffer());

// Generate ThumbHash (async)
const result = await thumbhash(buffer);
console.log(result.dataUrl);    // Ready-to-use data URL
console.log(result.hash);       // Raw hash bytes (~25 bytes)
console.log(result.width);      // Original image width
console.log(result.height);     // Original image height
console.log(result.hasAlpha);   // Whether image has transparency

// Generate ThumbHash (sync)
const resultSync = thumbhashSync(buffer);
```

## Functions

### thumbhash(input)

Generate ThumbHash from an image asynchronously.

```typescript
async function thumbhash(input: Buffer): Promise<ThumbHashResult>
```

**Parameters:**
- `input` - Image buffer (JPEG, PNG, WebP, etc.)

**Returns:** `Promise<ThumbHashResult>`

### thumbhashSync(input)

Generate ThumbHash from an image synchronously.

```typescript
function thumbhashSync(input: Buffer): ThumbHashResult
```

### thumbhashToRgba(hash)

Decode a ThumbHash back to RGBA pixels.

```typescript
async function thumbhashToRgba(hash: Buffer): Promise<ThumbHashDecodeResult>
```

**Parameters:**
- `hash` - ThumbHash bytes

**Returns:** `Promise<ThumbHashDecodeResult>`

### thumbhashToRgbaSync(hash)

Decode a ThumbHash back to RGBA pixels synchronously.

```typescript
function thumbhashToRgbaSync(hash: Buffer): ThumbHashDecodeResult
```

### thumbhashToDataUrl(hash)

Convert a stored ThumbHash to a data URL.

```typescript
function thumbhashToDataUrl(hash: Buffer): string
```

**Parameters:**
- `hash` - ThumbHash bytes

**Returns:** Base64 PNG data URL string

## Types

### ThumbHashResult

```typescript
interface ThumbHashResult {
  /** Raw ThumbHash bytes (~25 bytes) */
  hash: Buffer;
  /** Ready-to-use base64 PNG data URL */
  dataUrl: string;
  /** Original image width */
  width: number;
  /** Original image height */
  height: number;
  /** Whether image has alpha channel */
  hasAlpha: boolean;
}
```

### ThumbHashDecodeResult

```typescript
interface ThumbHashDecodeResult {
  /** RGBA pixel data */
  rgba: Buffer;
  /** Decoded placeholder width */
  width: number;
  /** Decoded placeholder height */
  height: number;
}
```

## Examples

### Basic Placeholder Generation

```typescript
import { thumbhash } from 'imgkit';

const buffer = Buffer.from(await Bun.file('photo.jpg').arrayBuffer());
const { dataUrl } = await thumbhash(buffer);

// Use directly in HTML/CSS
const html = `<img src="${dataUrl}" />`;
```

### Store and Restore Hash

```typescript
import { thumbhash, thumbhashToDataUrl } from 'imgkit';

// Generate and store
const { hash } = await thumbhash(buffer);
await db.save({ id: 1, thumbhash: hash });

// Later: restore and display
const record = await db.get(1);
const dataUrl = thumbhashToDataUrl(record.thumbhash);
```

### Progressive Image Loading

```typescript
import { thumbhash } from 'imgkit';

// On upload: generate placeholder
const { hash, dataUrl } = await thumbhash(uploadedImage);

// Store hash with image metadata
await saveImage({
  url: 'https://cdn.example.com/image.jpg',
  thumbhash: hash,
  placeholder: dataUrl
});

// On frontend: show placeholder while loading
function ImageWithPlaceholder({ src, placeholder }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <img
        src={placeholder}
        style={{ opacity: loaded ? 0 : 1 }}
      />
      <img
        src={src}
        onLoad={() => setLoaded(true)}
        style={{ opacity: loaded ? 1 : 0 }}
      />
    </div>
  );
}
```

### Get RGBA Pixels

```typescript
import { thumbhash, thumbhashToRgba } from 'imgkit';

const { hash } = await thumbhash(buffer);
const { rgba, width, height } = await thumbhashToRgba(hash);

// rgba is a Buffer of width * height * 4 bytes
console.log(`Placeholder size: ${width}x${height}`);
console.log(`Pixel data length: ${rgba.length}`);
```

## ThumbHash vs BlurHash

| Feature | ThumbHash | BlurHash |
|---------|:---------:|:--------:|
| Alpha channel | ✅ | ❌ |
| Aspect ratio preserved | ✅ | ❌ |
| Color accuracy | Better | Good |
| Hash size | ~25 bytes | ~28 chars |
| Output format | Binary | Base83 string |
| Gradient smoothness | Smoother | Good |

## Technical Details

- Images are automatically resized to max 100x100 before encoding (ThumbHash requirement)
- Original dimensions are preserved in the result
- Uses DCT (Discrete Cosine Transform) for compression
- Hash includes luminance, chrominance, and optional alpha data
- Data URL is a PNG image encoded as base64
