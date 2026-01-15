# ML Tensor Conversion

bun-image-turbo v1.7.9 introduces `toTensor` - the **first JavaScript package** to offer native SIMD-accelerated image-to-tensor conversion with built-in normalization presets.

## What is a Tensor?

In machine learning, a **tensor** is a multi-dimensional array that holds image data in a format models can process:

```
Image (JPEG/PNG)    →    Tensor (Float32Array)
[compressed bytes]       [normalized pixel values]

Shape: 800x600 RGB  →    Shape: [1, 3, 224, 224]
                         (batch, channels, height, width)
```

## Why Native Tensor Conversion?

### The Problem

Traditional ML preprocessing in JavaScript is slow and complex:

```typescript
// Traditional approach - SLOW
import sharp from 'sharp';

// Step 1: Resize
const pixels = await sharp(buffer)
  .resize(224, 224, { fit: 'fill' })
  .raw()
  .toBuffer();

// Step 2: Manual normalization
const mean = [0.485, 0.456, 0.406];
const std = [0.229, 0.224, 0.225];
const float32 = new Float32Array(3 * 224 * 224);

for (let i = 0; i < 224 * 224; i++) {
  float32[i] = (pixels[i * 3] / 255 - mean[0]) / std[0];     // R
  float32[i + 224*224] = (pixels[i * 3 + 1] / 255 - mean[1]) / std[1]; // G
  float32[i + 2*224*224] = (pixels[i * 3 + 2] / 255 - mean[2]) / std[2]; // B
}

// Step 3: Create tensor for ML framework
const tensor = new ort.Tensor('float32', float32, [1, 3, 224, 224]);
```

**Problems:**

- Multiple function calls
- Manual pixel manipulation in JavaScript (slow)
- Easy to make mistakes with normalization
- No SIMD optimization
- Memory inefficient

### The Solution

```typescript
// bun-image-turbo - FAST & SIMPLE
import { toTensor } from 'bun-image-turbo';

const tensor = await toTensor(buffer, {
  width: 224,
  height: 224,
  normalization: 'Imagenet',
  layout: 'Chw',
  batch: true
});

const ortTensor = new ort.Tensor('float32', tensor.toFloat32Array(), tensor.shape);
```

**Benefits:**

- Single function call
- Native Rust SIMD processing
- Built-in normalization presets
- 10-50x faster than JavaScript
- Type-safe API

## Supported ML Frameworks

### PyTorch / ONNX Runtime

PyTorch uses **CHW (Channel-First)** layout:

```typescript
import { toTensor } from 'bun-image-turbo';
import * as ort from 'onnxruntime-node';

const tensor = await toTensor(imageBuffer, {
  width: 224,
  height: 224,
  normalization: 'Imagenet',
  layout: 'Chw',
  batch: true
});

// Shape: [1, 3, 224, 224]
const ortTensor = new ort.Tensor('float32', tensor.toFloat32Array(), tensor.shape);
```

### TensorFlow.js

TensorFlow uses **HWC (Channel-Last)** layout:

```typescript
import { toTensor } from 'bun-image-turbo';
import * as tf from '@tensorflow/tfjs-node';

const tensor = await toTensor(imageBuffer, {
  width: 224,
  height: 224,
  normalization: 'Imagenet',
  layout: 'Hwc',
  batch: true
});

// Shape: [1, 224, 224, 3]
const tfTensor = tf.tensor4d(tensor.toFloat32Array(), tensor.shape);
```

### Transformers.js

Works great with Hugging Face's transformers.js:

```typescript
import { toTensor } from 'bun-image-turbo';
import { pipeline } from '@xenova/transformers';

const tensor = await toTensor(imageBuffer, {
  width: 224,
  height: 224,
  normalization: 'Imagenet',
  layout: 'Chw',
  batch: true
});

// Use with image classification
const classifier = await pipeline('image-classification');
```

## Normalization Presets

Different ML models require different normalization:

### ImageNet (Most Common)

Used by ResNet, VGG, EfficientNet, MobileNet:

```typescript
const tensor = await toTensor(buffer, {
  normalization: 'Imagenet'  // mean=[0.485,0.456,0.406], std=[0.229,0.224,0.225]
});
```

### CLIP

Used by OpenAI CLIP, OpenCLIP, BLIP:

```typescript
const tensor = await toTensor(buffer, {
  normalization: 'Clip'  // mean=[0.481,0.458,0.408], std=[0.269,0.261,0.276]
});
```

### Zero-to-One

Simple normalization to [0, 1] range:

```typescript
const tensor = await toTensor(buffer, {
  normalization: 'ZeroOne'  // output in [0, 1]
});
```

### Negative-One-to-One

For models expecting [-1, 1] range:

```typescript
const tensor = await toTensor(buffer, {
  normalization: 'NegOneOne'  // output in [-1, 1]
});
```

## Common Model Configurations

### ResNet / EfficientNet (ImageNet)

```typescript
const tensor = await toTensor(buffer, {
  width: 224,
  height: 224,
  normalization: 'Imagenet',
  layout: 'Chw',
  batch: true
});
```

### Vision Transformer (ViT)

```typescript
const tensor = await toTensor(buffer, {
  width: 384,
  height: 384,
  normalization: 'Imagenet',
  layout: 'Chw',
  batch: true
});
```

### CLIP / BLIP

```typescript
const tensor = await toTensor(buffer, {
  width: 224,
  height: 224,
  normalization: 'Clip',
  layout: 'Chw',
  batch: true
});
```

### YOLO Object Detection

```typescript
const tensor = await toTensor(buffer, {
  width: 640,
  height: 640,
  normalization: 'ZeroOne',
  layout: 'Chw',
  batch: true
});
```

## Performance Tips

### 1. Use Sync for Batch Processing

When processing many images, `toTensorSync` avoids async overhead:

```typescript
const tensors = images.map(img =>
  toTensorSync(img, { width: 224, height: 224 })
);
```

### 2. Use Uint8 When Possible

If your model accepts uint8 input, skip float conversion:

```typescript
const tensor = await toTensor(buffer, {
  dtype: 'Uint8',  // 3x faster than Float32
  width: 224,
  height: 224
});
```

### 3. Pre-resize Large Images

For very large images, resize first to reduce decode time:

```typescript
import { resize, toTensor } from 'bun-image-turbo';

// First resize to reasonable size
const smaller = await resize(hugeImage, { width: 1024 });

// Then convert to tensor
const tensor = await toTensor(smaller, {
  width: 224,
  height: 224,
  normalization: 'Imagenet'
});
```

## Benchmark Results

Tested on Apple M3 Pro with 800x600 JPEG input:

| Operation | Time | Throughput |
|-----------|------|------------|
| 224x224 ImageNet | 12.5ms | 80 img/s |
| 224x224 Uint8 | 5.2ms | 192 img/s |
| 384x384 ImageNet | 33.0ms | 30 img/s |
| 512x512 ImageNet | 51.5ms | 19 img/s |
| 1920x1080 → 224x224 | 25.8ms | 39 img/s |

### Comparison with JavaScript

| Method | 224x224 ImageNet |
|--------|------------------|
| bun-image-turbo | **12.5ms** |
| sharp + manual JS | ~150ms |
| tfjs preprocessing | ~200ms |

**10-16x faster than alternatives!**

## Real-World Example: Image Classification API

```typescript
import { Hono } from 'hono';
import { toTensor } from 'bun-image-turbo';
import * as ort from 'onnxruntime-node';

const app = new Hono();
const session = await ort.InferenceSession.create('efficientnet.onnx');

app.post('/classify', async (c) => {
  const formData = await c.req.formData();
  const file = formData.get('image') as File;
  const buffer = Buffer.from(await file.arrayBuffer());

  // Convert to tensor (single call!)
  const tensor = await toTensor(buffer, {
    width: 224,
    height: 224,
    normalization: 'Imagenet',
    layout: 'Chw',
    batch: true
  });

  // Run inference
  const ortTensor = new ort.Tensor('float32', tensor.toFloat32Array(), tensor.shape);
  const results = await session.run({ input: ortTensor });

  return c.json({ predictions: results.output.data });
});

export default app;
```

## Next Steps

- [API Reference](/api/tensor) - Full API documentation
- [Examples](/examples/tensor) - More code examples
- [Performance Guide](/guide/performance) - Optimization tips
