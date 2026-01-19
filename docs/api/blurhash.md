# blurhash

Generate a compact blurhash placeholder string from an image.

## Signature

```typescript
function blurhash(
  input: Buffer,
  componentsX?: number,
  componentsY?: number
): Promise<BlurhashResult>

function blurhashSync(
  input: Buffer,
  componentsX?: number,
  componentsY?: number
): BlurhashResult
```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `input` | `Buffer` | - | Image buffer |
| `componentsX` | `number` | `4` | Horizontal components (1-9) |
| `componentsY` | `number` | `3` | Vertical components (1-9) |

## Returns

```typescript
interface BlurhashResult {
  hash: string;    // Blurhash string (e.g., "LEHV6nWB2yk8...")
  width: number;   // Original image width
  height: number;  // Original image height
}
```

## Examples

### Basic Usage

```typescript
import { blurhash } from 'imgkit';

const result = await blurhash(buffer);
console.log(result);
// {
//   hash: "LEHV6nWB2yk8pyo0adR*.7kCMdnj",
//   width: 800,
//   height: 600
// }
```

### Custom Components

```typescript
// More detail (larger hash)
const detailed = await blurhash(buffer, 6, 4);
// hash: "LKO2?U%2Tw=w]~RBVZRi};RPxuwH" (longer)

// Less detail (smaller hash)
const simple = await blurhash(buffer, 2, 2);
// hash: "L6PZfS" (shorter)
```

### Sync Version

```typescript
import { blurhashSync } from 'imgkit';

const result = blurhashSync(buffer, 4, 3);
console.log(result.hash);
```

### With Resized Image

```typescript
// Generate blurhash from thumbnail for speed
import { transform, blurhash } from 'imgkit';

const thumb = await transform(buffer, {
  resize: { width: 100 },
  output: { format: 'jpeg' }
});

const result = await blurhash(thumb, 4, 3);
```

## What is Blurhash?

Blurhash is a compact representation of an image placeholder:

- **Tiny**: ~20-30 characters for a typical hash
- **Decodable**: Can be decoded to a blurred preview image
- **Perfect for**: Progressive image loading, low-bandwidth previews

### Use Cases

1. **Progressive Loading**: Show blur while image loads
2. **Low Bandwidth**: Placeholder over slow connections
3. **Content Preview**: Blur for sensitive/NSFW content
4. **Skeleton Screens**: Colored placeholders in UI

## Component Count

| Components | Hash Length | Detail Level |
|------------|-------------|--------------|
| 2x2 | ~10 chars | Very low |
| 3x3 | ~20 chars | Low |
| 4x3 | ~25 chars | Medium (default) |
| 4x4 | ~30 chars | Good |
| 6x4 | ~40 chars | High |
| 9x9 | ~80 chars | Very high |

Higher components = more detail but longer hash string.

## Decoding Blurhash

Use [blurhash](https://www.npmjs.com/package/blurhash) package to decode:

```typescript
import { decode } from 'blurhash';

// Decode to pixel data
const pixels = decode(hash, 32, 32);  // 32x32 preview

// Use in canvas, React, etc.
```

### React Example

```tsx
import { Blurhash } from 'react-blurhash';

function ImageWithPlaceholder({ hash, src }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      {!loaded && (
        <Blurhash
          hash={hash}
          width={400}
          height={300}
        />
      )}
      <img
        src={src}
        onLoad={() => setLoaded(true)}
        style={{ opacity: loaded ? 1 : 0 }}
      />
    </div>
  );
}
```

## Performance

Blurhash generation time depends on image size:

| Image Size | Time |
|------------|-----:|
| 100x100 | ~2ms |
| 800x600 | ~15ms |
| 1920x1080 | ~40ms |

**Tip**: Generate blurhash from a thumbnail for faster processing:

```typescript
// Fast approach
const thumb = await transform(buffer, {
  resize: { width: 100 },
  output: { format: 'jpeg' }
});
const result = await blurhash(thumb);
```

## Notes

- Components must be between 1 and 9
- Higher components = more detail but longer hash
- Generate from thumbnails for better performance
- imgkit is the only high-performance library with built-in blurhash

## See Also

- [Blurhash Algorithm](https://blurha.sh/)
- [blurhash npm package](https://www.npmjs.com/package/blurhash)
- [react-blurhash](https://www.npmjs.com/package/react-blurhash)
