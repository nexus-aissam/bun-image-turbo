# EXIF Metadata

Write and strip EXIF metadata from JPEG and WebP images.

::: tip Perfect for AI-Generated Images
The EXIF functions are ideal for embedding metadata in AI-generated images, including prompts, model information, and generation parameters.
:::

## writeExif()

Write EXIF metadata to a JPEG or WebP image.

### Signature

```typescript
function writeExif(input: Buffer, options: ExifOptions): Promise<Buffer>
function writeExifSync(input: Buffer, options: ExifOptions): Buffer
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `input` | `Buffer` | Input image buffer (JPEG or WebP) |
| `options` | `ExifOptions` | EXIF metadata to write |

### ExifOptions

```typescript
interface ExifOptions {
  /** Image description / caption / AI prompt */
  imageDescription?: string;
  /** Artist / creator name */
  artist?: string;
  /** Copyright notice */
  copyright?: string;
  /** Software used to create the image */
  software?: string;
  /** Date/time in EXIF format (YYYY:MM:DD HH:MM:SS) */
  dateTime?: string;
  /** Original date/time in EXIF format */
  dateTimeOriginal?: string;
  /** User comment (can contain JSON or other data) */
  userComment?: string;
  /** Camera/device make */
  make?: string;
  /** Camera/device model */
  model?: string;
  /** Orientation (1-8) */
  orientation?: number;
}
```

### Returns

Returns a `Buffer` containing the image with embedded EXIF metadata.

### Example: Basic Usage

```typescript
import { writeExif, toJpeg } from 'imgkit';

const imageBuffer = Buffer.from(await Bun.file('photo.jpg').arrayBuffer());

const withExif = await writeExif(imageBuffer, {
  imageDescription: 'Beautiful sunset over the ocean',
  artist: 'John Doe',
  copyright: 'Copyright 2026 John Doe',
  software: 'imgkit v1.4.6'
});

await Bun.write('photo-with-exif.jpg', withExif);
```

### Example: AI-Generated Image Metadata

```typescript
import { writeExif, toWebp } from 'imgkit';

// Convert to WebP first
const webpBuffer = await toWebp(imageBuffer, { quality: 90 });

// Add AI generation metadata
const withMetadata = await writeExif(webpBuffer, {
  imageDescription: 'A majestic mountain landscape at golden hour',
  artist: 'Stable Diffusion XL',
  software: 'ComfyUI',
  userComment: JSON.stringify({
    prompt: 'A majestic mountain landscape at golden hour, 8k, detailed',
    negative_prompt: 'blurry, dark, low quality',
    model: 'stable-diffusion-xl-base-1.0',
    sampler: 'DPM++ 2M Karras',
    steps: 30,
    cfg_scale: 7.5,
    seed: 123456789
  })
});

await Bun.write('ai-generated.webp', withMetadata);
```

### Example: Sync Version

```typescript
import { writeExifSync } from 'imgkit';

const withExif = writeExifSync(imageBuffer, {
  imageDescription: 'Product photo',
  copyright: 'Company Inc.'
});
```

---

## stripExif()

Remove all EXIF metadata from a JPEG or WebP image.

### Signature

```typescript
function stripExif(input: Buffer): Promise<Buffer>
function stripExifSync(input: Buffer): Buffer
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `input` | `Buffer` | Input image buffer (JPEG or WebP) |

### Returns

Returns a `Buffer` containing the image without EXIF metadata.

### Example: Strip EXIF for Privacy

```typescript
import { stripExif } from 'imgkit';

// Remove location and camera data before sharing
const imageBuffer = Buffer.from(await Bun.file('photo.jpg').arrayBuffer());
const stripped = await stripExif(imageBuffer);

await Bun.write('photo-clean.jpg', stripped);
```

### Example: Sync Version

```typescript
import { stripExifSync } from 'imgkit';

const stripped = stripExifSync(imageBuffer);
```

---

## Using EXIF with transform()

You can also add EXIF metadata during image transformation:

```typescript
import { transform } from 'imgkit';

const result = await transform(imageBuffer, {
  resize: { width: 1920, height: 1080 },
  output: { format: 'Jpeg', jpeg: { quality: 90 } },
  exif: {
    imageDescription: 'Resized hero image',
    software: 'My Image Pipeline',
    copyright: 'Copyright 2026'
  }
});
```

---

## Supported Formats

| Format | writeExif | stripExif |
|--------|-----------|-----------|
| JPEG | Yes | Yes |
| WebP | Yes | Yes |
| PNG | No | No |
| GIF | No | No |

::: warning PNG Not Supported
PNG uses tEXt chunks instead of EXIF. Use JPEG or WebP for EXIF metadata.
:::

---

## EXIF Field Mapping

| ExifOptions Field | EXIF Tag | Tag ID |
|-------------------|----------|--------|
| `imageDescription` | ImageDescription | 0x010E |
| `artist` | Artist | 0x013B |
| `copyright` | Copyright | 0x8298 |
| `software` | Software | 0x0131 |
| `dateTime` | DateTime | 0x0132 |
| `dateTimeOriginal` | DateTimeOriginal | 0x9003 |
| `userComment` | UserComment | 0x9286 |
| `make` | Make | 0x010F |
| `model` | Model | 0x0110 |
| `orientation` | Orientation | 0x0112 |

---

## Use Cases

### 1. AI Image Generation Platforms

```typescript
// Store generation parameters for reproducibility
const withParams = await writeExif(generatedImage, {
  imageDescription: prompt,
  software: 'MyAI Platform v2.0',
  userComment: JSON.stringify({
    model: 'sdxl-turbo',
    seed: seed,
    steps: steps,
    guidance: guidance
  })
});
```

### 2. Photography Workflow

```typescript
// Add photographer attribution
const credited = await writeExif(photo, {
  artist: 'Jane Smith',
  copyright: 'Copyright 2026 Jane Smith. All rights reserved.',
  software: 'Lightroom Export'
});
```

### 3. Privacy Protection

```typescript
// Strip metadata before sharing online
const safeToShare = await stripExif(userUpload);
```

### 4. Batch Processing

```typescript
import { writeExif } from 'imgkit';

const files = ['img1.jpg', 'img2.jpg', 'img3.jpg'];

const results = await Promise.all(
  files.map(async (file) => {
    const buffer = Buffer.from(await Bun.file(file).arrayBuffer());
    return writeExif(buffer, {
      copyright: 'Copyright 2026 My Company',
      software: 'Batch Processor v1.0'
    });
  })
);
```
