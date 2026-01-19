# Resizing

imgkit provides high-quality image resizing with multiple algorithms and fit modes.

## Basic Resizing

```typescript
import { resize } from 'imgkit';

// Resize by width (maintains aspect ratio)
const resized = await resize(buffer, { width: 800 });

// Resize by height
const resized = await resize(buffer, { height: 600 });

// Resize to specific dimensions
const resized = await resize(buffer, { width: 800, height: 600 });
```

## Fit Modes

Control how the image fits into the target dimensions:

### `Cover` (default)

Resize to cover the target area. May crop edges.

```typescript
const result = await resize(buffer, {
  width: 400,
  height: 400,
  fit: 'Cover'  // PascalCase
});
// Result: 400x400, cropped to fill
```

### `Contain`

Resize to fit within target. May have letterboxing.

```typescript
const result = await resize(buffer, {
  width: 400,
  height: 400,
  fit: 'Contain'
});
// Result: Fits within 400x400, aspect ratio preserved
```

### `Fill`

Stretch to exact dimensions. May distort.

```typescript
const result = await resize(buffer, {
  width: 400,
  height: 400,
  fit: 'Fill'
});
// Result: Exactly 400x400, may be stretched
```

### `Inside`

Only resize if image is larger than target.

```typescript
const result = await resize(buffer, {
  width: 400,
  height: 400,
  fit: 'Inside'
});
// Result: Shrinks if larger, unchanged if smaller
```

### `Outside`

Only resize if image is smaller than target.

```typescript
const result = await resize(buffer, {
  width: 400,
  height: 400,
  fit: 'Outside'
});
// Result: Enlarges if smaller, unchanged if larger
```

## Filter Algorithms

Choose the resampling algorithm for quality/speed tradeoff:

```typescript
const result = await resize(buffer, {
  width: 800,
  filter: 'Lanczos3'  // Highest quality (PascalCase)
});
```

### Available Filters

| Filter | Quality | Speed | Best For |
|--------|---------|-------|----------|
| `Nearest` | Low | Fastest | Pixel art, icons |
| `Bilinear` | Good | Fast | Quick previews |
| `CatmullRom` | Better | Medium | General use |
| `Mitchell` | Better | Medium | Downscaling |
| `Lanczos3` | Best | Slower | High quality (default) |

### Filter Examples

```typescript
// Pixel art - preserve sharp edges
const pixelArt = await resize(buffer, {
  width: 256,
  filter: 'Nearest'
});

// Quick thumbnail
const thumb = await resize(buffer, {
  width: 150,
  filter: 'Bilinear'
});

// High-quality resize
const hq = await resize(buffer, {
  width: 1200,
  filter: 'Lanczos3'
});
```

## Resizing with Transform

Use `transform()` for resize + other operations:

```typescript
import { transform } from 'imgkit';

const result = await transform(buffer, {
  resize: {
    width: 800,
    height: 600,
    fit: 'Cover',
    filter: 'Lanczos3'
  },
  output: { format: 'WebP', webp: { quality: 80 } }
});
```

## Thumbnail Generation

Optimized thumbnail creation:

```typescript
// Square thumbnail with cover crop
const thumb = await transform(buffer, {
  resize: {
    width: 150,
    height: 150,
    fit: 'Cover'
  },
  output: { format: 'WebP', webp: { quality: 70 } }
});
```

## Aspect Ratio Preservation

When only width or height is specified, aspect ratio is automatically preserved:

```typescript
// Original: 1920x1080 (16:9)

// Width only
const result = await resize(buffer, { width: 800 });
// Result: 800x450 (16:9 preserved)

// Height only
const result = await resize(buffer, { height: 450 });
// Result: 800x450 (16:9 preserved)
```

## Performance Tips

1. **Use appropriate filter**: `'Lanczos3'` is beautiful but slower. Use `'Bilinear'` for thumbnails.

2. **Resize before other operations**: Resize first to reduce pixels processed.

3. **Use transform() for multiple operations**: Single decode/encode is faster than chaining.

```typescript
// Efficient: Single operation
const result = await transform(buffer, {
  resize: { width: 800 },
  grayscale: true,
  output: { format: 'WebP' }
});

// Less efficient: Multiple operations
const resized = await resize(buffer, { width: 800 });
const gray = await transform(resized, { grayscale: true });
const webp = await toWebp(gray);
```
