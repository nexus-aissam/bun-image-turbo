# Smart Crop

Content-aware image cropping that automatically finds the most interesting region.

## Overview

Smart crop uses saliency detection, edge detection, and the rule of thirds to identify the best crop region for any aspect ratio. No manual coordinates needed.

## Functions

### smartCrop

Crop an image to the best region for the given aspect ratio.

```typescript
function smartCrop(input: Buffer, options: SmartCropOptions): Promise<Buffer>
function smartCropSync(input: Buffer, options: SmartCropOptions): Buffer
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `input` | `Buffer` | Image buffer (JPEG, PNG, WebP, etc.) |
| `options` | `SmartCropOptions` | Crop options |

#### Returns

`Buffer` - Cropped image in PNG format

#### Example

```typescript
import { smartCrop } from 'bun-image-turbo';

const buffer = Buffer.from(await Bun.file('photo.jpg').arrayBuffer());

// Square crop for Instagram
const square = await smartCrop(buffer, { aspectRatio: '1:1' });

// YouTube thumbnail
const youtube = await smartCrop(buffer, { aspectRatio: '16:9' });

// Portrait for Stories
const portrait = await smartCrop(buffer, { aspectRatio: '9:16' });
```

---

### smartCropAnalyze

Get the optimal crop coordinates without actually cropping.

```typescript
function smartCropAnalyze(input: Buffer, options: SmartCropOptions): Promise<SmartCropAnalysis>
function smartCropAnalyzeSync(input: Buffer, options: SmartCropOptions): SmartCropAnalysis
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `input` | `Buffer` | Image buffer |
| `options` | `SmartCropOptions` | Crop options |

#### Returns

`SmartCropAnalysis` object:

| Property | Type | Description |
|----------|------|-------------|
| `x` | `number` | X coordinate of the crop |
| `y` | `number` | Y coordinate of the crop |
| `width` | `number` | Width of the crop |
| `height` | `number` | Height of the crop |
| `score` | `number` | Quality score (higher is better) |

#### Example

```typescript
import { smartCropAnalyze, crop } from 'bun-image-turbo';

const buffer = Buffer.from(await Bun.file('photo.jpg').arrayBuffer());

// Analyze the best crop
const analysis = await smartCropAnalyze(buffer, { aspectRatio: '1:1' });
console.log(`Best crop: x=${analysis.x}, y=${analysis.y}`);
console.log(`Size: ${analysis.width}x${analysis.height}`);
console.log(`Score: ${analysis.score}`);

// Apply the crop yourself if needed
const cropped = await crop(buffer, {
  x: analysis.x,
  y: analysis.y,
  width: analysis.width,
  height: analysis.height
});
```

---

## Types

### SmartCropOptions

```typescript
interface SmartCropOptions {
  width?: number;           // Target width
  height?: number;          // Target height
  aspectRatio?: AspectRatio; // Aspect ratio string
  boost?: SmartCropBoostRegion[]; // Areas to prioritize
}
```

### AspectRatio

Common aspect ratios:

| Ratio | Use Case |
|-------|----------|
| `1:1` | Square (Instagram, profile pics) |
| `16:9` | Landscape (YouTube, Twitter) |
| `9:16` | Portrait (Stories, TikTok) |
| `4:3` | Classic photo |
| `3:2` | DSLR standard |
| `21:9` | Ultrawide |

You can also use any custom ratio like `"5:4"` or `"2:1"`.

### SmartCropBoostRegion

```typescript
interface SmartCropBoostRegion {
  x: number;      // X coordinate
  y: number;      // Y coordinate
  width: number;  // Region width
  height: number; // Region height
  weight: number; // Priority (0.0 - 1.0)
}
```

---

## Algorithm

Smart crop evaluates potential crop regions using:

1. **Saliency Detection** - Finds visually interesting areas (high contrast, saturated colors, skin tones)
2. **Edge Detection** - Preserves areas with important details
3. **Rule of Thirds** - Prefers compositions with subjects at intersection points

The algorithm scores each potential crop and returns the highest-scoring region.

---

## Performance

| Image Size | Time |
|------------|------|
| 640x480 | ~15-20ms |
| 1920x1080 | ~40-60ms |
| 4000x3000 | ~100-150ms |

---

## Use Cases

### Social Media Thumbnails

```typescript
async function generateThumbnails(buffer: Buffer) {
  return {
    instagram: await smartCrop(buffer, { aspectRatio: '1:1' }),
    youtube: await smartCrop(buffer, { aspectRatio: '16:9' }),
    twitter: await smartCrop(buffer, { aspectRatio: '16:9' }),
    tiktok: await smartCrop(buffer, { aspectRatio: '9:16' }),
  };
}
```

### Profile Picture Generator

```typescript
async function generateProfilePic(upload: Buffer) {
  const cropped = await smartCrop(upload, { aspectRatio: '1:1' });
  // Resize to standard sizes
  const sizes = await Promise.all([
    resize(cropped, { width: 32, height: 32 }),   // Tiny
    resize(cropped, { width: 64, height: 64 }),   // Small
    resize(cropped, { width: 128, height: 128 }), // Medium
    resize(cropped, { width: 256, height: 256 }), // Large
  ]);
  return sizes;
}
```

### E-commerce Product Images

```typescript
async function generateProductImages(product: Buffer) {
  return {
    thumbnail: await smartCrop(product, { aspectRatio: '1:1' }),
    card: await smartCrop(product, { aspectRatio: '4:3' }),
    hero: await smartCrop(product, { aspectRatio: '21:9' }),
  };
}
```
