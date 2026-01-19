# toTensor

Convert images to tensor format for machine learning frameworks. **First JavaScript package** to offer native SIMD-accelerated image-to-tensor conversion with built-in normalization presets.

## Why toTensor?

Machine learning models require images in a specific tensor format:
- **Normalized pixel values** (not 0-255, but normalized floats)
- **Specific layout** (CHW for PyTorch, HWC for TensorFlow)
- **Exact dimensions** (224x224, 384x384, etc.)
- **Batch dimension** for inference

Traditional approaches require multiple steps:
```typescript
// Without imgkit (slow, multiple libraries)
const sharp = require('sharp');
const pixels = await sharp(buffer).resize(224, 224).raw().toBuffer();
// Then manually normalize, reshape, convert to Float32...
```

With `imgkit`:
```typescript
// Single call, SIMD-optimized, ready for ML
const tensor = await toTensor(buffer, {
  width: 224, height: 224,
  normalization: 'Imagenet',
  layout: 'Chw'
});
```

## Functions

### toTensor

Asynchronously converts an image to tensor format.

```typescript
function toTensor(
  input: Buffer,
  options?: TensorOptions
): Promise<EnhancedTensorResult>
```

### toTensorSync

Synchronously converts an image to tensor format.

```typescript
function toTensorSync(
  input: Buffer,
  options?: TensorOptions
): EnhancedTensorResult
```

## Options

```typescript
interface TensorOptions {
  /** Output width (required for ML models) */
  width?: number;

  /** Output height (required for ML models) */
  height?: number;

  /** Data type: 'Float32' (default) or 'Uint8' */
  dtype?: 'Float32' | 'Uint8';

  /** Memory layout: 'Chw' (PyTorch) or 'Hwc' (TensorFlow) */
  layout?: 'Chw' | 'Hwc';

  /** Normalization preset or 'None' */
  normalization?: 'Imagenet' | 'Clip' | 'ZeroOne' | 'NegOneOne' | 'None';

  /** Add batch dimension [1, C, H, W] */
  batch?: boolean;
}
```

## Result

```typescript
interface TensorResult {
  /** Raw tensor data as bytes */
  data: Buffer;

  /** Tensor shape, e.g., [3, 224, 224] or [1, 3, 224, 224] */
  shape: number[];

  /** Data type used */
  dtype: 'Float32' | 'Uint8';

  /** Memory layout used */
  layout: 'Chw' | 'Hwc';

  /** Output width */
  width: number;

  /** Output height */
  height: number;

  /** Number of channels (always 3 for RGB) */
  channels: number;
}

interface EnhancedTensorResult extends TensorResult {
  /** Convert to Float32Array (for Float32 dtype) */
  toFloat32Array(): Float32Array;

  /** Convert to Uint8Array (for Uint8 dtype) */
  toUint8Array(): Uint8Array;
}
```

## Normalization Presets

| Preset | Mean (RGB) | Std (RGB) | Use Case |
|--------|------------|-----------|----------|
| `Imagenet` | [0.485, 0.456, 0.406] | [0.229, 0.224, 0.225] | ResNet, VGG, EfficientNet |
| `Clip` | [0.481, 0.458, 0.408] | [0.269, 0.261, 0.276] | CLIP, OpenCLIP models |
| `ZeroOne` | [0, 0, 0] | [1, 1, 1] | Values in [0, 1] |
| `NegOneOne` | [0.5, 0.5, 0.5] | [0.5, 0.5, 0.5] | Values in [-1, 1] |
| `None` | [0, 0, 0] | [255, 255, 255] | Raw normalized [0, 1] |

## Layout Options

### CHW (Channel-First) - PyTorch, ONNX
```
Shape: [3, 224, 224] or [1, 3, 224, 224] with batch
Memory: [R0, R1, ..., G0, G1, ..., B0, B1, ...]
```

### HWC (Channel-Last) - TensorFlow
```
Shape: [224, 224, 3] or [1, 224, 224, 3] with batch
Memory: [R0, G0, B0, R1, G1, B1, ...]
```

## Examples

### PyTorch / ONNX Runtime

```typescript
import { toTensor } from 'imgkit';
import * as ort from 'onnxruntime-node';

const imageBuffer = await Bun.file('image.jpg').arrayBuffer();

// Convert to tensor (PyTorch-compatible)
const tensor = await toTensor(Buffer.from(imageBuffer), {
  width: 224,
  height: 224,
  normalization: 'Imagenet',
  layout: 'Chw',
  batch: true
});

// Use with ONNX Runtime
const float32Data = tensor.toFloat32Array();
const ortTensor = new ort.Tensor('float32', float32Data, tensor.shape);

// Run inference
const session = await ort.InferenceSession.create('model.onnx');
const results = await session.run({ input: ortTensor });
```

### TensorFlow.js

```typescript
import { toTensor } from 'imgkit';
import * as tf from '@tensorflow/tfjs-node';

const tensor = await toTensor(imageBuffer, {
  width: 224,
  height: 224,
  normalization: 'Imagenet',
  layout: 'Hwc',  // TensorFlow uses HWC
  batch: true
});

// Create TensorFlow tensor
const tfTensor = tf.tensor4d(
  tensor.toFloat32Array(),
  tensor.shape as [number, number, number, number]
);

// Run inference
const predictions = model.predict(tfTensor);
```

### CLIP Model Preprocessing

```typescript
import { toTensor } from 'imgkit';

// CLIP models use specific normalization
const tensor = await toTensor(imageBuffer, {
  width: 224,
  height: 224,
  normalization: 'Clip',
  layout: 'Chw',
  batch: true
});

// Shape: [1, 3, 224, 224]
// Ready for CLIP inference
```

### Batch Processing

```typescript
import { toTensorSync } from 'imgkit';

const images = ['img1.jpg', 'img2.jpg', 'img3.jpg'];
const tensors = [];

for (const path of images) {
  const buffer = await Bun.file(path).arrayBuffer();
  const tensor = toTensorSync(Buffer.from(buffer), {
    width: 224,
    height: 224,
    normalization: 'Imagenet',
    layout: 'Chw'
  });
  tensors.push(tensor.toFloat32Array());
}

// Combine into batch tensor
const batchSize = tensors.length;
const batchData = new Float32Array(batchSize * 3 * 224 * 224);
tensors.forEach((t, i) => batchData.set(t, i * t.length));
```

### Raw Uint8 for Custom Processing

```typescript
const tensor = await toTensor(imageBuffer, {
  width: 256,
  height: 256,
  dtype: 'Uint8',
  layout: 'Hwc'
});

// Get raw pixels (0-255)
const pixels = tensor.toUint8Array();
// Shape: [256, 256, 3]
```

## Performance

Benchmarks on Apple M3 Pro (800x600 JPEG input):

| Operation | Time |
|-----------|------|
| 224x224 ImageNet (async) | ~12.6ms |
| 224x224 ImageNet (sync) | ~12.5ms |
| 1920x1080 → 224x224 | ~25.8ms |
| 224x224 Uint8 | ~5.2ms |
| 384x384 ImageNet | ~33.0ms |
| 512x512 ImageNet | ~51.5ms |

### Why So Fast?

1. **Native Rust** - No JavaScript overhead for pixel processing
2. **SIMD Optimization** - Processes 8 pixels in parallel
3. **Rayon Parallelism** - Each color channel processed concurrently
4. **Shrink-on-Load** - Large images downscaled during decode
5. **Zero-Copy** - Minimal memory allocations

## Error Handling

```typescript
try {
  const tensor = await toTensor(buffer, { width: 224, height: 224 });
} catch (error) {
  if (error.message.includes('decode')) {
    console.error('Invalid image format');
  }
}
```

## Type Safety

The TypeScript types ensure correct usage:

```typescript
const tensor = await toTensor(buffer, {
  width: 224,
  height: 224,
  dtype: 'Float32',
  layout: 'Chw'
});

// Type-safe: only available for Float32
const floats = tensor.toFloat32Array(); // OK

// This would error at runtime (wrong dtype)
const tensor2 = await toTensor(buffer, { dtype: 'Uint8' });
tensor2.toFloat32Array(); // Throws error
```
