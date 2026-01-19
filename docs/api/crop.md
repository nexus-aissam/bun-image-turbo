# crop

Extract a region from an image. Zero-copy operation that's essentially free.

## Function Signature

```typescript
// Async version
function crop(input: Buffer, options: CropOptions): Promise<Buffer>

// Sync version
function cropSync(input: Buffer, options: CropOptions): Buffer
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `input` | `Buffer` | Input image buffer |
| `options` | `CropOptions` | Crop configuration |

## CropOptions

| Option | Type | Description |
|--------|------|-------------|
| `x` | `number?` | X coordinate of crop origin (left edge) |
| `y` | `number?` | Y coordinate of crop origin (top edge) |
| `width` | `number?` | Width of crop region |
| `height` | `number?` | Height of crop region |
| `aspectRatio` | `string?` | Aspect ratio string (e.g., "16:9", "1:1", "4:3") |
| `gravity` | `CropGravity?` | Anchor point for cropping (default: "center") |

## CropGravity

| Value | Description |
|-------|-------------|
| `center` | Center of image (default) |
| `north` | Top center |
| `south` | Bottom center |
| `east` | Right center |
| `west` | Left center |
| `northWest` | Top left corner |
| `northEast` | Top right corner |
| `southWest` | Bottom left corner |
| `southEast` | Bottom right corner |

## Returns

`Promise<Buffer>` (async) or `Buffer` (sync) - Cropped image as PNG.

## Cropping Modes

The crop function supports three distinct modes:

### Mode 1: Explicit Coordinates

Specify exact pixel coordinates and dimensions:

```typescript
import { crop } from 'imgkit';

// Crop a 400x300 region starting at (100, 50)
const cropped = await crop(input, {
  x: 100,
  y: 50,
  width: 400,
  height: 300
});
```

### Mode 2: Aspect Ratio

Crop to a specific aspect ratio, anchored by gravity:

```typescript
// Crop to square (1:1) centered
const square = await crop(input, {
  aspectRatio: "1:1"
});

// Crop to 16:9 from top
const banner = await crop(input, {
  aspectRatio: "16:9",
  gravity: "north"
});

// Crop to 4:3 from bottom-right
const photo = await crop(input, {
  aspectRatio: "4:3",
  gravity: "southEast"
});
```

### Mode 3: Dimensions with Gravity

Specify dimensions and anchor point:

```typescript
// Crop 500x500 from center
const centered = await crop(input, {
  width: 500,
  height: 500,
  gravity: "center"
});

// Crop 200x200 from top-left corner
const topLeft = await crop(input, {
  width: 200,
  height: 200,
  gravity: "northWest"
});
```

## Common Use Cases

### Profile Picture (Square Crop)

```typescript
import { crop, resize, toJpeg } from 'imgkit';

async function createProfilePicture(input: Buffer): Promise<Buffer> {
  // Crop to square from center
  const squared = await crop(input, { aspectRatio: "1:1" });

  // Resize to standard profile size
  const resized = await resize(squared, { width: 256, height: 256 });

  // Convert to JPEG
  return toJpeg(resized, { quality: 85 });
}
```

### Social Media Thumbnails

```typescript
// Instagram (1:1)
const instagram = await crop(input, { aspectRatio: "1:1" });

// Twitter/X Header (3:1)
const twitterHeader = await crop(input, { aspectRatio: "3:1", gravity: "center" });

// YouTube Thumbnail (16:9)
const youtube = await crop(input, { aspectRatio: "16:9" });

// Pinterest (2:3)
const pinterest = await crop(input, { aspectRatio: "2:3" });
```

### Extract Region of Interest

```typescript
// Extract a specific region (e.g., detected face coordinates)
const face = await crop(input, {
  x: faceX,
  y: faceY,
  width: faceWidth,
  height: faceHeight
});
```

### Crop + Resize Pipeline

Use with `transform()` for single-pass processing:

```typescript
import { transform } from 'imgkit';

const result = await transform(input, {
  crop: { aspectRatio: "1:1" },      // Crop first
  resize: { width: 400 },             // Then resize
  output: { format: "webp", webp: { quality: 80 } }
});
```

## Performance

Cropping uses `crop_imm()` internally, which creates a view without copying pixels. This makes cropping **essentially free** - just pointer arithmetic.

| Operation | Time | Memory |
|-----------|------|--------|
| Crop (any size) | ~0ms | Zero additional |
| Crop + Encode PNG | ~5ms | Output buffer only |

::: tip Performance Tip
When using crop with resize, always **crop first**. This reduces the number of pixels that need to be processed by subsequent operations.
:::

## Error Handling

```typescript
try {
  const cropped = await crop(input, {
    x: 1000,
    y: 1000,
    width: 500,
    height: 500
  });
} catch (error) {
  // Possible errors:
  // - "Crop origin (x, y) is outside image bounds (WxH)"
  // - "Crop region has zero width or height"
  // - "Invalid aspect ratio format"
}
```

## See Also

- [resize](/api/resize) - Resize images
- [transform](/api/transform) - Multi-operation pipeline with crop support
- [Types](/api/types) - CropOptions and CropGravity definitions
