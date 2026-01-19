# resize

Resize an image with optional fit mode, filter algorithm, and background color.

## Signature

```typescript
function resize(input: Buffer, options: ResizeOptions): Promise<Buffer>
function resizeSync(input: Buffer, options: ResizeOptions): Buffer
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `input` | `Buffer` | Image buffer |
| `options` | `ResizeOptions` | Resize configuration |

### ResizeOptions

```typescript
interface ResizeOptions {
  /** Target width (optional if height provided) */
  width?: number;

  /** Target height (optional if width provided) */
  height?: number;

  /** How to fit image into dimensions (default: 'Cover') */
  fit?: FitMode;

  /** Resampling algorithm (default: 'Lanczos3') */
  filter?: ResizeFilter;

  /** Background color for padding [r, g, b, a] (default: transparent) */
  background?: number[];
}

/** Resize filter/algorithm */
enum ResizeFilter {
  /** Nearest neighbor - fastest, lowest quality */
  Nearest = 'Nearest',
  /** Bilinear - fast, good quality */
  Bilinear = 'Bilinear',
  /** Catmull-Rom - balanced speed and quality */
  CatmullRom = 'CatmullRom',
  /** Mitchell - good for downscaling */
  Mitchell = 'Mitchell',
  /** Lanczos3 - highest quality, slower */
  Lanczos3 = 'Lanczos3'
}

/** Image fit mode for resize */
enum FitMode {
  /** Resize to cover the target dimensions (may crop) */
  Cover = 'Cover',
  /** Resize to fit within target dimensions (may have padding) */
  Contain = 'Contain',
  /** Resize to exact dimensions (may distort) */
  Fill = 'Fill',
  /** Resize only if larger than target */
  Inside = 'Inside',
  /** Resize only if smaller than target */
  Outside = 'Outside'
}
```

::: warning Case Sensitivity
Filter and fit mode values are **PascalCase** (e.g., `'Lanczos3'`, `'Cover'`), not lowercase.
:::

## Returns

`Buffer` - Resized image as **PNG format**

::: tip Output Format
The `resize()` function always outputs PNG format regardless of input format. This ensures lossless quality preservation during resize operations. If you need a different output format, use `transform()` instead:

```typescript
// Resize and output as JPEG
const result = await transform(buffer, {
  resize: { width: 800 },
  output: { format: 'Jpeg', jpeg: { quality: 85 } }
});
```
:::

## Examples

### Basic Resize

```typescript
import { resize } from 'imgkit';

// Resize by width (maintains aspect ratio)
const resized = await resize(buffer, { width: 800 });

// Resize by height
const resized = await resize(buffer, { height: 600 });

// Resize to specific dimensions
const resized = await resize(buffer, { width: 800, height: 600 });
```

### Fit Modes

```typescript
// Cover: Fill target area, may crop
const cover = await resize(buffer, {
  width: 400,
  height: 400,
  fit: 'Cover'
});

// Contain: Fit within target, no cropping (may have padding)
const contain = await resize(buffer, {
  width: 400,
  height: 400,
  fit: 'Contain'
});

// Fill: Exact dimensions, may distort
const fill = await resize(buffer, {
  width: 400,
  height: 400,
  fit: 'Fill'
});

// Inside: Only shrink if larger
const inside = await resize(buffer, {
  width: 400,
  height: 400,
  fit: 'Inside'
});

// Outside: Only enlarge if smaller
const outside = await resize(buffer, {
  width: 400,
  height: 400,
  fit: 'Outside'
});
```

### Filter Algorithms

```typescript
// Fastest (pixel art, icons)
const nearest = await resize(buffer, {
  width: 400,
  filter: 'Nearest'
});

// Fast with good quality
const bilinear = await resize(buffer, {
  width: 400,
  filter: 'Bilinear'
});

// Balanced
const catmull = await resize(buffer, {
  width: 400,
  filter: 'CatmullRom'
});

// Good for downscaling
const mitchell = await resize(buffer, {
  width: 400,
  filter: 'Mitchell'
});

// Highest quality (default)
const lanczos = await resize(buffer, {
  width: 400,
  filter: 'Lanczos3'
});
```

### Background Color

```typescript
// Use Contain fit with custom background color
const result = await resize(buffer, {
  width: 400,
  height: 400,
  fit: 'Contain',
  background: [255, 255, 255, 255]  // White background [R, G, B, A]
});

// Transparent background (default)
const transparent = await resize(buffer, {
  width: 400,
  height: 400,
  fit: 'Contain',
  background: [0, 0, 0, 0]  // Transparent
});
```

### Sync Version

```typescript
import { resizeSync } from 'imgkit';

const resized = resizeSync(buffer, { width: 400 });
```

### Thumbnail Generation

```typescript
// Square thumbnail with cover crop
const thumb = await resize(buffer, {
  width: 150,
  height: 150,
  fit: 'Cover',
  filter: 'Lanczos3'
});
```

## Fit Mode Reference

| Mode | Behavior | Aspect Ratio | Cropping |
|------|----------|:------------:|:--------:|
| `Cover` | Fill target area | Preserved | Yes |
| `Contain` | Fit within target | Preserved | No |
| `Fill` | Exact dimensions | Distorted | No |
| `Inside` | Shrink if larger | Preserved | No |
| `Outside` | Enlarge if smaller | Preserved | No |

## Filter Reference

| Filter | Quality | Speed | Use Case |
|--------|---------|-------|----------|
| `Nearest` | Low | Fastest | Pixel art |
| `Bilinear` | Good | Fast | Previews |
| `CatmullRom` | Better | Medium | General |
| `Mitchell` | Better | Medium | Downscaling |
| `Lanczos3` | Best | Slower | High quality |

## Defaults

- `fit`: `'Cover'`
- `filter`: `'Lanczos3'`
- `background`: `[0, 0, 0, 0]` (transparent)

## Notes

- At least one of `width` or `height` is required
- When only one dimension is provided, aspect ratio is preserved
- **Output is always PNG format** - use `transform()` for other formats
- Uses **shrink-on-decode** optimization for JPEG/HEIC inputs (decodes at reduced resolution for faster thumbnails)
- Uses **adaptive algorithm selection** when no filter is specified:
  - `>4x downscale`: Box filter (fastest)
  - `2-4x downscale`: Bilinear
  - `1.33-2x downscale`: CatmullRom
  - `<1.33x`: Lanczos3 (best quality)
- Uses **multi-step resize** for large scale reductions (>75% smaller) - progressively halves the image for better performance

## See Also

- [`transform()`](/api/transform) - For resize + other operations + format output
- [`toJpeg()`](/api/to-jpeg) - Convert to JPEG after resize
- [`toWebp()`](/api/to-webp) - Convert to WebP after resize
