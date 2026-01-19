# Transformations

Apply multiple image transformations efficiently in a single operation.

## Using transform()

The `transform()` function applies multiple operations in one call:

```typescript
import { transform } from 'imgkit';

const result = await transform(buffer, {
  resize: { width: 800 },
  rotate: 90,
  grayscale: true,
  output: { format: 'webp', webp: { quality: 80 } }
});
```

## Rotation

Rotate images by 90, 180, or 270 degrees:

```typescript
// Rotate 90° clockwise
const rotated = await transform(buffer, {
  rotate: 90,
  output: { format: 'jpeg' }
});

// Rotate 180°
const flipped = await transform(buffer, {
  rotate: 180,
  output: { format: 'jpeg' }
});

// Rotate 270° (90° counter-clockwise)
const rotated = await transform(buffer, {
  rotate: 270,
  output: { format: 'jpeg' }
});
```

## Flipping

Flip images horizontally or vertically:

```typescript
// Horizontal flip (mirror)
const mirrored = await transform(buffer, {
  flipH: true,
  output: { format: 'jpeg' }
});

// Vertical flip
const flipped = await transform(buffer, {
  flipV: true,
  output: { format: 'jpeg' }
});

// Both (same as 180° rotation)
const both = await transform(buffer, {
  flipH: true,
  flipV: true,
  output: { format: 'jpeg' }
});
```

## Grayscale

Convert to black and white:

```typescript
const bw = await transform(buffer, {
  grayscale: true,
  output: { format: 'jpeg' }
});
```

## Blur

Apply gaussian blur:

```typescript
// Light blur
const light = await transform(buffer, {
  blur: 2,  // 0-100
  output: { format: 'jpeg' }
});

// Heavy blur
const heavy = await transform(buffer, {
  blur: 20,
  output: { format: 'jpeg' }
});
```

| Blur Value | Effect |
|------------|--------|
| 1-5 | Subtle softening |
| 5-15 | Moderate blur |
| 15-30 | Strong blur |
| 30+ | Very heavy blur |

## Sharpen

Enhance image sharpness:

```typescript
// Light sharpening
const sharp = await transform(buffer, {
  sharpen: 10,  // 0-100
  output: { format: 'jpeg' }
});

// Heavy sharpening
const crisp = await transform(buffer, {
  sharpen: 30,
  output: { format: 'jpeg' }
});
```

::: tip
Sharpening is useful after resizing to restore detail.
:::

## Brightness

Adjust image brightness:

```typescript
// Brighten
const brighter = await transform(buffer, {
  brightness: 20,  // -100 to 100
  output: { format: 'jpeg' }
});

// Darken
const darker = await transform(buffer, {
  brightness: -20,
  output: { format: 'jpeg' }
});
```

| Value | Effect |
|-------|--------|
| -100 | Black |
| -50 | Very dark |
| 0 | No change |
| 50 | Very bright |
| 100 | White |

## Contrast

Adjust image contrast:

```typescript
// Increase contrast
const punchy = await transform(buffer, {
  contrast: 20,  // -100 to 100
  output: { format: 'jpeg' }
});

// Decrease contrast (flatter)
const flat = await transform(buffer, {
  contrast: -20,
  output: { format: 'jpeg' }
});
```

## Combining Transformations

Apply multiple transformations in one efficient operation:

```typescript
const result = await transform(buffer, {
  // Resize first
  resize: { width: 800, height: 600, fit: 'cover' },

  // Then rotate
  rotate: 90,

  // Apply effects
  grayscale: true,
  sharpen: 10,
  contrast: 5,

  // Output format
  output: {
    format: 'webp',
    webp: { quality: 85 }
  }
});
```

## Transformation Order

Transformations are applied in this order:

1. **Resize** - Scale the image
2. **Rotate** - Rotate by degrees
3. **Flip** - Horizontal/vertical flip
4. **Grayscale** - Convert to B&W
5. **Blur** - Apply blur
6. **Sharpen** - Enhance edges
7. **Brightness** - Adjust lightness
8. **Contrast** - Adjust contrast
9. **Encode** - Output format

## Complete Example

```typescript
import { transform } from 'imgkit';

// Photo editing pipeline
const edited = await transform(photoBuffer, {
  // Crop to square
  resize: {
    width: 1080,
    height: 1080,
    fit: 'cover'
  },

  // Slight adjustments
  brightness: 5,
  contrast: 10,
  sharpen: 8,

  // Output as optimized WebP
  output: {
    format: 'webp',
    webp: { quality: 90 }
  }
});

await Bun.write('edited.webp', edited);
```

## Sync API

All transformations have synchronous versions:

```typescript
import { transformSync } from 'imgkit';

const result = transformSync(buffer, {
  resize: { width: 400 },
  grayscale: true,
  output: { format: 'jpeg' }
});
```

::: warning
Sync functions block the event loop. Use async versions in servers.
:::
