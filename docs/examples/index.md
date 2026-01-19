# Examples

Practical examples showing how to use imgkit in real applications.

## Runnable Examples

The repository includes complete, runnable examples in the [`examples/`](https://github.com/nexus-aissam/imgkit/tree/main/examples) folder:

```bash
# Clone and run examples
git clone https://github.com/nexus-aissam/imgkit
cd imgkit/examples

# Install dependencies
bun install

# Run examples
bun run basic    # Basic usage demo
bun run heic     # HEIC conversion
bun run api      # HTTP API server
bun run batch    # Batch processing
```

## Example Files

| File | Description |
|------|-------------|
| [basic-usage.ts](/examples/basic-usage) | Core functionality demo |
| [cropping.ts](/examples/cropping) | Cropping modes and social media presets |
| [heic-conversion.ts](/examples/heic-conversion) | HEIC/HEIF conversion |
| [api-endpoint.ts](/examples/api-endpoint) | HTTP image processing server |
| [batch-processing.ts](/examples/batch-processing) | Parallel batch processing |
| [exif-metadata.ts](/examples/exif-metadata) | EXIF metadata writing for AI images |
| [thumbhash.ts](/examples/thumbhash) | ThumbHash placeholder generation |
| [tensor.ts](/examples/tensor) | ML tensor conversion for PyTorch/TensorFlow |

## Quick Examples

### Get Image Info

```typescript
import { metadata } from 'imgkit';

const buffer = Buffer.from(await Bun.file('photo.jpg').arrayBuffer());
const info = await metadata(buffer);
console.log(`${info.width}x${info.height} ${info.format}`);
```

### Resize Image

```typescript
import { resize } from 'imgkit';

const buffer = Buffer.from(await Bun.file('photo.jpg').arrayBuffer());
const resized = await resize(buffer, { width: 800 });
// Note: resize() outputs PNG format
await Bun.write('resized.png', resized);
```

### Crop Image

```typescript
import { crop } from 'imgkit';

const buffer = Buffer.from(await Bun.file('photo.jpg').arrayBuffer());

// Crop to square (1:1) for profile pictures
const square = await crop(buffer, { aspectRatio: "1:1" });

// Crop to 16:9 for YouTube thumbnails
const widescreen = await crop(buffer, { aspectRatio: "16:9" });

// Crop specific region
const region = await crop(buffer, { x: 100, y: 50, width: 400, height: 300 });
```

### Convert to WebP

```typescript
import { toWebp } from 'imgkit';

const buffer = Buffer.from(await Bun.file('photo.jpg').arrayBuffer());
const webp = await toWebp(buffer, { quality: 80 });
await Bun.write('photo.webp', webp);
```

### Apply Transformations

```typescript
import { transform } from 'imgkit';

const buffer = Buffer.from(await Bun.file('photo.jpg').arrayBuffer());

// Full pipeline: crop → resize → effects → output
const result = await transform(buffer, {
  crop: { aspectRatio: "16:9" },  // Crop first (zero-copy)
  resize: { width: 1280 },
  sharpen: 5,
  output: { format: 'WebP', webp: { quality: 85 } }
});
await Bun.write('output.webp', result);
```

### Generate BlurHash

```typescript
import { blurhash } from 'imgkit';

const buffer = Buffer.from(await Bun.file('photo.jpg').arrayBuffer());
const { hash, width, height } = await blurhash(buffer, 4, 3);
console.log(`Hash: ${hash}`);
console.log(`Original: ${width}x${height}`);
```

### Generate ThumbHash (Recommended)

```typescript
import { thumbhash } from 'imgkit';

const buffer = Buffer.from(await Bun.file('photo.jpg').arrayBuffer());
const { dataUrl, hash, hasAlpha } = await thumbhash(buffer);

// Use directly in HTML - no decoding needed!
const html = `<img src="${dataUrl}" alt="placeholder" />`;

// Or store compact hash (~25 bytes) in database
console.log(`Hash size: ${hash.length} bytes`);
```

### Add EXIF Metadata

```typescript
import { writeExif, toWebp } from 'imgkit';

const buffer = Buffer.from(await Bun.file('ai-generated.png').arrayBuffer());
const webp = await toWebp(buffer, { quality: 90 });

const withExif = await writeExif(webp, {
  imageDescription: 'A beautiful sunset over mountains',
  artist: 'Stable Diffusion XL',
  software: 'ComfyUI',
  userComment: JSON.stringify({
    prompt: 'sunset over mountains, 8k, detailed',
    seed: 12345,
    steps: 30
  })
});
await Bun.write('with-metadata.webp', withExif);
```

### Convert HEIC (macOS ARM64)

```typescript
import { toJpeg } from 'imgkit';

const heic = Buffer.from(await Bun.file('IMG_1234.HEIC').arrayBuffer());
const jpeg = await toJpeg(heic, { quality: 90 });
await Bun.write('photo.jpg', jpeg);
```

### Convert to ML Tensor

```typescript
import { toTensor } from 'imgkit';

const buffer = Buffer.from(await Bun.file('photo.jpg').arrayBuffer());

// PyTorch/ONNX (CHW layout, ImageNet normalization)
const tensor = await toTensor(buffer, {
  width: 224,
  height: 224,
  normalization: 'Imagenet',
  layout: 'Chw',
  batch: true
});

// Shape: [1, 3, 224, 224] - Ready for ML inference!
const float32Data = tensor.toFloat32Array();
```

## Use Cases

- **Web Server**: Process images on-the-fly for user uploads
- **Static Site Generator**: Optimize images during build
- **CLI Tool**: Batch convert/resize images
- **API Service**: Image processing microservice
- **Desktop App**: Process local images with Tauri/Electron
- **Social Media**: Auto-generate images for multiple platforms
- **E-commerce**: Product thumbnails and zoom images
- **AI/ML**: Training data preparation, tensor conversion, model inference

## Next Steps

- [Basic Usage Example](/examples/basic-usage)
- [Cropping Examples](/examples/cropping) - Social media presets, AI training data
- [HEIC Conversion Example](/examples/heic-conversion)
- [EXIF Metadata Example](/examples/exif-metadata)
- [ThumbHash Placeholders](/examples/thumbhash)
- [ML Tensor Conversion](/examples/tensor) - PyTorch, TensorFlow, ONNX
- [API Endpoint Example](/examples/api-endpoint)
- [Batch Processing Example](/examples/batch-processing)
