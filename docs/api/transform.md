# transform

Apply multiple image transformations in a single operation. This is the most efficient way to combine resize, rotate, flip, filters, and format conversion.

## Signature

```typescript
function transform(input: Buffer, options: TransformOptions): Promise<Buffer>
function transformSync(input: Buffer, options: TransformOptions): Buffer
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `input` | `Buffer` | Image buffer |
| `options` | `TransformOptions` | Transform configuration |

### TransformOptions

```typescript
interface TransformOptions {
  /** Crop configuration (applied first) */
  crop?: CropOptions;

  /** Resize configuration */
  resize?: ResizeOptions;

  /** Output format and options (default: PNG) */
  output?: OutputOptions;

  /** Rotate degrees (90, 180, or 270) */
  rotate?: number;

  /** Flip horizontally */
  flipH?: boolean;

  /** Flip vertically */
  flipV?: boolean;

  /** Convert to grayscale */
  grayscale?: boolean;

  /** Blur radius (0-100) */
  blur?: number;

  /** Sharpen amount (0-100) */
  sharpen?: number;

  /** Brightness adjustment (-100 to 100) */
  brightness?: number;

  /** Contrast adjustment (-100 to 100) */
  contrast?: number;
}
```

### CropOptions

```typescript
interface CropOptions {
  /** X coordinate of crop origin */
  x?: number;

  /** Y coordinate of crop origin */
  y?: number;

  /** Width of crop region */
  width?: number;

  /** Height of crop region */
  height?: number;

  /** Aspect ratio (e.g., "16:9", "1:1") */
  aspectRatio?: string;

  /** Anchor point for cropping */
  gravity?: CropGravity;
}

enum CropGravity {
  Center = 'Center',
  North = 'North',
  South = 'South',
  East = 'East',
  West = 'West',
  NorthWest = 'NorthWest',
  NorthEast = 'NorthEast',
  SouthWest = 'SouthWest',
  SouthEast = 'SouthEast'
}
```

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
  Nearest = 'Nearest',
  Bilinear = 'Bilinear',
  CatmullRom = 'CatmullRom',
  Mitchell = 'Mitchell',
  Lanczos3 = 'Lanczos3'
}

/** Image fit mode */
enum FitMode {
  Cover = 'Cover',
  Contain = 'Contain',
  Fill = 'Fill',
  Inside = 'Inside',
  Outside = 'Outside'
}
```

### OutputOptions

```typescript
interface OutputOptions {
  /** Output format */
  format: ImageFormat;

  /** JPEG options (if format is Jpeg) */
  jpeg?: { quality?: number };  // 1-100, default: 80

  /** PNG options (if format is Png) */
  png?: { compression?: number };  // 0-9, default: 6

  /** WebP options (if format is WebP) */
  webp?: { quality?: number; lossless?: boolean };  // quality: 1-100, default: 80
}

/** Image format enum */
enum ImageFormat {
  Jpeg = 'Jpeg',
  Png = 'Png',
  WebP = 'WebP',
  Gif = 'Gif',
  Bmp = 'Bmp'
}
```

::: warning Case Sensitivity
All enum values are **PascalCase**:
- Formats: `'Jpeg'`, `'Png'`, `'WebP'`, `'Gif'`, `'Bmp'`
- Fit modes: `'Cover'`, `'Contain'`, `'Fill'`, `'Inside'`, `'Outside'`
- Filters: `'Nearest'`, `'Bilinear'`, `'CatmullRom'`, `'Mitchell'`, `'Lanczos3'`
:::

## Returns

`Buffer` - Transformed image in the specified format (default: PNG)

## Examples

### Basic Transform

```typescript
import { transform } from 'imgkit';

const result = await transform(buffer, {
  resize: { width: 800 },
  output: { format: 'WebP', webp: { quality: 85 } }
});
```

### Resize and Convert

```typescript
const result = await transform(buffer, {
  resize: {
    width: 800,
    height: 600,
    fit: 'Cover'
  },
  output: {
    format: 'Jpeg',
    jpeg: { quality: 85 }
  }
});
```

### Full Pipeline

```typescript
const result = await transform(buffer, {
  // Resize to 800x600 with cover fit
  resize: {
    width: 800,
    height: 600,
    fit: 'Cover',
    filter: 'Lanczos3'
  },

  // Rotate 90 degrees clockwise
  rotate: 90,

  // Flip
  flipH: true,
  flipV: false,

  // Color adjustments
  grayscale: true,
  brightness: 10,
  contrast: 5,

  // Effects
  blur: 2,
  sharpen: 10,

  // Output as WebP
  output: {
    format: 'WebP',
    webp: { quality: 85 }
  }
});

await Bun.write('output.webp', result);
```

### Rotation

```typescript
// Rotate 90 degrees clockwise
const rotated90 = await transform(buffer, {
  rotate: 90,
  output: { format: 'Jpeg' }
});

// Rotate 180 degrees
const rotated180 = await transform(buffer, {
  rotate: 180,
  output: { format: 'Jpeg' }
});

// Rotate 270 degrees (90 counter-clockwise)
const rotated270 = await transform(buffer, {
  rotate: 270,
  output: { format: 'Jpeg' }
});
```

### Flipping

```typescript
// Horizontal mirror
const mirrored = await transform(buffer, {
  flipH: true,
  output: { format: 'Jpeg' }
});

// Vertical flip
const flipped = await transform(buffer, {
  flipV: true,
  output: { format: 'Jpeg' }
});

// Both
const both = await transform(buffer, {
  flipH: true,
  flipV: true,
  output: { format: 'Png' }
});
```

### Grayscale

```typescript
const bw = await transform(buffer, {
  grayscale: true,
  output: { format: 'Jpeg', jpeg: { quality: 85 } }
});
```

### Blur

```typescript
const blurred = await transform(buffer, {
  blur: 10,  // 0-100
  output: { format: 'Jpeg' }
});
```

### Sharpen

```typescript
const sharpened = await transform(buffer, {
  sharpen: 15,  // 0-100
  output: { format: 'Jpeg', jpeg: { quality: 95 } }
});
```

### Brightness and Contrast

```typescript
// Brighten
const brighter = await transform(buffer, {
  brightness: 20,  // -100 to 100
  output: { format: 'Jpeg' }
});

// Darken
const darker = await transform(buffer, {
  brightness: -20,
  output: { format: 'Jpeg' }
});

// Increase contrast
const highContrast = await transform(buffer, {
  contrast: 30,  // -100 to 100
  output: { format: 'Jpeg' }
});

// Combined
const adjusted = await transform(buffer, {
  brightness: 10,
  contrast: 15,
  output: { format: 'Jpeg', jpeg: { quality: 90 } }
});
```

### Thumbnail Generation

```typescript
const thumb = await transform(buffer, {
  resize: {
    width: 150,
    height: 150,
    fit: 'Cover'
  },
  sharpen: 5,  // Slight sharpen after resize
  output: {
    format: 'WebP',
    webp: { quality: 70 }
  }
});
```

### Output Formats

```typescript
// JPEG output
const jpeg = await transform(buffer, {
  resize: { width: 800 },
  output: { format: 'Jpeg', jpeg: { quality: 85 } }
});

// PNG output
const png = await transform(buffer, {
  resize: { width: 800 },
  output: { format: 'Png', png: { compression: 6 } }
});

// WebP lossy output
const webpLossy = await transform(buffer, {
  resize: { width: 800 },
  output: { format: 'WebP', webp: { quality: 80 } }
});

// WebP lossless output
const webpLossless = await transform(buffer, {
  resize: { width: 800 },
  output: { format: 'WebP', webp: { lossless: true } }
});

// GIF output
const gif = await transform(buffer, {
  resize: { width: 400 },
  output: { format: 'Gif' }
});

// BMP output
const bmp = await transform(buffer, {
  resize: { width: 400 },
  output: { format: 'Bmp' }
});
```

### Default Output (PNG)

```typescript
// If output is not specified, defaults to PNG
const png = await transform(buffer, {
  resize: { width: 800 },
  grayscale: true
});
// Result is PNG format
```

### Sync Version

```typescript
import { transformSync } from 'imgkit';

const result = transformSync(buffer, {
  resize: { width: 400 },
  output: { format: 'WebP', webp: { quality: 80 } }
});
```

### HEIC Conversion (macOS ARM64)

```typescript
// Convert HEIC to JPEG
const heicBuffer = Buffer.from(await Bun.file('photo.HEIC').arrayBuffer());
const jpeg = await transform(heicBuffer, {
  output: { format: 'Jpeg', jpeg: { quality: 90 } }
});

// Convert HEIC to WebP with resize
const webp = await transform(heicBuffer, {
  resize: { width: 1200 },
  output: { format: 'WebP', webp: { quality: 85 } }
});
```

### Crop + Resize Pipeline

The most powerful use case - crop to aspect ratio, then resize:

```typescript
// Square profile picture
const profile = await transform(buffer, {
  crop: { aspectRatio: "1:1" },
  resize: { width: 256 },
  output: { format: 'Jpeg', jpeg: { quality: 85 } }
});

// YouTube thumbnail
const thumbnail = await transform(buffer, {
  crop: { aspectRatio: "16:9", gravity: 'Center' },
  resize: { width: 1280 },
  sharpen: 5,
  output: { format: 'WebP', webp: { quality: 80 } }
});

// Instagram story
const story = await transform(buffer, {
  crop: { aspectRatio: "9:16", gravity: 'Center' },
  resize: { width: 1080 },
  output: { format: 'Jpeg', jpeg: { quality: 90 } }
});
```

### Crop with Coordinates

```typescript
// Extract specific region
const cropped = await transform(buffer, {
  crop: { x: 100, y: 50, width: 400, height: 300 },
  output: { format: 'Png' }
});

// Crop from corner and resize
const cornerCrop = await transform(buffer, {
  crop: { width: 500, height: 500, gravity: 'NorthWest' },
  resize: { width: 200 },
  output: { format: 'WebP' }
});
```

## Transformation Order

Operations are applied in this order:

1. **Crop** - Extract region (zero-copy, applied first)
2. **Resize** - Scale the image
3. **Rotate** - Rotate by 90/180/270 degrees
4. **Flip** - Horizontal and/or vertical flip
5. **Grayscale** - Convert to grayscale
6. **Blur** - Apply Gaussian blur
7. **Sharpen** - Apply unsharp mask
8. **Brightness** - Adjust brightness
9. **Contrast** - Adjust contrast
10. **Encode** - Output to specified format

::: tip Crop First for Performance
Cropping is applied first because it reduces the number of pixels for all subsequent operations. This makes the entire pipeline faster.
:::

## Option Ranges

| Option | Range | Default | Notes |
|--------|-------|---------|-------|
| `rotate` | 90, 180, 270 | - | Clockwise rotation |
| `blur` | 0-100 | - | Higher = more blur |
| `sharpen` | 0-100 | - | Higher = sharper |
| `brightness` | -100 to 100 | 0 | Negative = darker |
| `contrast` | -100 to 100 | 0 | Negative = less contrast |

## Performance Tips

1. **Use transform() for multiple operations** - Single decode/encode is faster than chaining functions
2. **Resize first** - Reduces pixels for subsequent operations
3. **Choose appropriate filter** - `'Bilinear'` is fast, `'Lanczos3'` is high quality

## Notes

- `output` is optional - defaults to PNG if not specified
- JPEG encoding uses TurboJPEG with SIMD acceleration
- Grayscale + JPEG = smaller file sizes
- Sharpen is applied using unsharp mask algorithm

## See Also

- [`crop()`](/api/crop) - Standalone crop function
- [`resize()`](/api/resize) - Simple resize (PNG output only)
- [`toJpeg()`](/api/to-jpeg) - Convert to JPEG
- [`toWebp()`](/api/to-webp) - Convert to WebP
- [`blurhash()`](/api/blurhash) - Generate placeholder hash
