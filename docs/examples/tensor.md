# Tensor Conversion Examples

Real-world examples of using `toTensor` for machine learning workflows.

## Basic Usage

### Simple Tensor Conversion

```typescript
import { toTensor } from 'imgkit';

const imageBuffer = await Bun.file('photo.jpg').arrayBuffer();

const tensor = await toTensor(Buffer.from(imageBuffer), {
  width: 224,
  height: 224,
  normalization: 'Imagenet',
  layout: 'Chw'
});

console.log('Shape:', tensor.shape);      // [3, 224, 224]
console.log('Dtype:', tensor.dtype);      // Float32
console.log('Size:', tensor.data.length); // 602112 bytes
```

### With Batch Dimension

```typescript
const tensor = await toTensor(buffer, {
  width: 224,
  height: 224,
  batch: true
});

console.log('Shape:', tensor.shape); // [1, 3, 224, 224]
```

## ML Framework Integration

### ONNX Runtime - Image Classification

```typescript
import { toTensor } from 'imgkit';
import * as ort from 'onnxruntime-node';

async function classifyImage(imagePath: string) {
  // Load model
  const session = await ort.InferenceSession.create('resnet50.onnx');

  // Load and convert image
  const buffer = Buffer.from(await Bun.file(imagePath).arrayBuffer());
  const tensor = await toTensor(buffer, {
    width: 224,
    height: 224,
    normalization: 'Imagenet',
    layout: 'Chw',
    batch: true
  });

  // Create ONNX tensor
  const ortTensor = new ort.Tensor(
    'float32',
    tensor.toFloat32Array(),
    tensor.shape
  );

  // Run inference
  const results = await session.run({ input: ortTensor });
  const predictions = results.output.data as Float32Array;

  // Get top prediction
  const maxIndex = predictions.indexOf(Math.max(...predictions));
  return { classIndex: maxIndex, confidence: predictions[maxIndex] };
}

// Usage
const result = await classifyImage('cat.jpg');
console.log('Predicted class:', result.classIndex);
console.log('Confidence:', result.confidence);
```

### TensorFlow.js - Feature Extraction

```typescript
import { toTensor } from 'imgkit';
import * as tf from '@tensorflow/tfjs-node';

async function extractFeatures(imagePath: string) {
  // Load MobileNet model
  const model = await tf.loadLayersModel(
    'https://tfhub.dev/google/tfjs-model/mobilenet_v2/feature_vector/4/default/1',
    { fromTFHub: true }
  );

  // Convert image to tensor (TensorFlow uses HWC layout)
  const buffer = Buffer.from(await Bun.file(imagePath).arrayBuffer());
  const tensor = await toTensor(buffer, {
    width: 224,
    height: 224,
    normalization: 'Imagenet',
    layout: 'Hwc',
    batch: true
  });

  // Create TensorFlow tensor
  const tfTensor = tf.tensor4d(
    tensor.toFloat32Array(),
    tensor.shape as [number, number, number, number]
  );

  // Extract features
  const features = model.predict(tfTensor) as tf.Tensor;
  const featureVector = await features.data();

  // Cleanup
  tfTensor.dispose();
  features.dispose();

  return featureVector;
}

// Usage
const features = await extractFeatures('image.jpg');
console.log('Feature vector length:', features.length);
```

### CLIP - Image Embeddings

```typescript
import { toTensor } from 'imgkit';
import * as ort from 'onnxruntime-node';

async function getImageEmbedding(imagePath: string) {
  // Load CLIP image encoder
  const session = await ort.InferenceSession.create('clip-vit-base.onnx');

  // Convert with CLIP normalization
  const buffer = Buffer.from(await Bun.file(imagePath).arrayBuffer());
  const tensor = await toTensor(buffer, {
    width: 224,
    height: 224,
    normalization: 'Clip',  // CLIP-specific normalization
    layout: 'Chw',
    batch: true
  });

  const ortTensor = new ort.Tensor(
    'float32',
    tensor.toFloat32Array(),
    tensor.shape
  );

  const results = await session.run({ pixel_values: ortTensor });
  return results.image_embeds.data as Float32Array;
}

// Image similarity search
async function findSimilarImages(queryPath: string, imagePaths: string[]) {
  const queryEmbedding = await getImageEmbedding(queryPath);

  const similarities = await Promise.all(
    imagePaths.map(async (path) => {
      const embedding = await getImageEmbedding(path);
      // Cosine similarity
      const dotProduct = queryEmbedding.reduce((sum, a, i) => sum + a * embedding[i], 0);
      const normA = Math.sqrt(queryEmbedding.reduce((sum, a) => sum + a * a, 0));
      const normB = Math.sqrt(embedding.reduce((sum, a) => sum + a * a, 0));
      return { path, similarity: dotProduct / (normA * normB) };
    })
  );

  return similarities.sort((a, b) => b.similarity - a.similarity);
}
```

## Batch Processing

### Process Multiple Images

```typescript
import { toTensorSync } from 'imgkit';
import * as ort from 'onnxruntime-node';

async function batchClassify(imagePaths: string[]) {
  const session = await ort.InferenceSession.create('model.onnx');

  // Convert all images to tensors
  const tensors = await Promise.all(
    imagePaths.map(async (path) => {
      const buffer = Buffer.from(await Bun.file(path).arrayBuffer());
      return toTensorSync(buffer, {
        width: 224,
        height: 224,
        normalization: 'Imagenet',
        layout: 'Chw'
      });
    })
  );

  // Combine into batch
  const batchSize = tensors.length;
  const singleSize = 3 * 224 * 224;
  const batchData = new Float32Array(batchSize * singleSize);

  tensors.forEach((tensor, i) => {
    batchData.set(tensor.toFloat32Array(), i * singleSize);
  });

  // Create batch tensor
  const ortTensor = new ort.Tensor(
    'float32',
    batchData,
    [batchSize, 3, 224, 224]
  );

  // Run batch inference
  const results = await session.run({ input: ortTensor });
  return results;
}

// Usage
const results = await batchClassify(['img1.jpg', 'img2.jpg', 'img3.jpg']);
```

### Streaming Batch Processing

```typescript
import { toTensorSync } from 'imgkit';

async function* processImagesStream(imagePaths: string[], batchSize = 32) {
  for (let i = 0; i < imagePaths.length; i += batchSize) {
    const batch = imagePaths.slice(i, i + batchSize);

    const tensors = await Promise.all(
      batch.map(async (path) => {
        const buffer = Buffer.from(await Bun.file(path).arrayBuffer());
        return toTensorSync(buffer, {
          width: 224,
          height: 224,
          normalization: 'Imagenet',
          layout: 'Chw'
        });
      })
    );

    yield { batch: i / batchSize, tensors };
  }
}

// Usage with async iteration
for await (const { batch, tensors } of processImagesStream(imageList)) {
  console.log(`Processing batch ${batch}: ${tensors.length} images`);
  // Process batch...
}
```

## Real-World Applications

### Image Classification API

```typescript
import { Hono } from 'hono';
import { toTensor } from 'imgkit';
import * as ort from 'onnxruntime-node';

const app = new Hono();
const session = await ort.InferenceSession.create('efficientnet_b0.onnx');
const labels = await Bun.file('imagenet_labels.json').json();

app.post('/api/classify', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return c.json({ error: 'No image provided' }, 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Convert to tensor
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
    const predictions = results.output.data as Float32Array;

    // Get top 5 predictions
    const top5 = Array.from(predictions)
      .map((prob, idx) => ({ label: labels[idx], probability: prob }))
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 5);

    return c.json({
      success: true,
      predictions: top5,
      processingTime: `${tensor.width}x${tensor.height}`
    });

  } catch (error) {
    return c.json({ error: 'Failed to process image' }, 500);
  }
});

export default app;
```

### Object Detection Preprocessing

```typescript
import { toTensor } from 'imgkit';

async function preprocessForYOLO(imagePath: string) {
  const buffer = Buffer.from(await Bun.file(imagePath).arrayBuffer());

  // YOLO typically uses 640x640 with ZeroOne normalization
  const tensor = await toTensor(buffer, {
    width: 640,
    height: 640,
    normalization: 'ZeroOne',  // Values in [0, 1]
    layout: 'Chw',
    batch: true
  });

  return {
    tensor: tensor.toFloat32Array(),
    shape: tensor.shape,  // [1, 3, 640, 640]
    originalSize: { width: tensor.width, height: tensor.height }
  };
}
```

### Face Recognition Pipeline

```typescript
import { toTensor } from 'imgkit';
import * as ort from 'onnxruntime-node';

interface FaceEmbedding {
  embedding: Float32Array;
  processingTime: number;
}

async function getFaceEmbedding(faceBuffer: Buffer): Promise<FaceEmbedding> {
  const start = performance.now();

  // ArcFace uses 112x112 input
  const tensor = await toTensor(faceBuffer, {
    width: 112,
    height: 112,
    normalization: 'NegOneOne',  // [-1, 1] range
    layout: 'Chw',
    batch: true
  });

  // Load face recognition model
  const session = await ort.InferenceSession.create('arcface.onnx');
  const ortTensor = new ort.Tensor('float32', tensor.toFloat32Array(), tensor.shape);

  const results = await session.run({ input: ortTensor });
  const embedding = results.embedding.data as Float32Array;

  return {
    embedding,
    processingTime: performance.now() - start
  };
}

// Compare two faces
function compareFaces(emb1: Float32Array, emb2: Float32Array): number {
  // Cosine similarity
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < emb1.length; i++) {
    dotProduct += emb1[i] * emb2[i];
    norm1 += emb1[i] * emb1[i];
    norm2 += emb2[i] * emb2[i];
  }

  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}
```

## Performance Optimization

### Caching Converted Tensors

```typescript
import { toTensorSync } from 'imgkit';

const tensorCache = new Map<string, Float32Array>();

async function getCachedTensor(imagePath: string): Promise<Float32Array> {
  if (tensorCache.has(imagePath)) {
    return tensorCache.get(imagePath)!;
  }

  const buffer = Buffer.from(await Bun.file(imagePath).arrayBuffer());
  const tensor = toTensorSync(buffer, {
    width: 224,
    height: 224,
    normalization: 'Imagenet',
    layout: 'Chw'
  });

  const floatArray = tensor.toFloat32Array();
  tensorCache.set(imagePath, floatArray);

  return floatArray;
}
```

### Worker Thread Processing

```typescript
// worker.ts
import { toTensorSync } from 'imgkit';
import { parentPort } from 'worker_threads';

parentPort?.on('message', (buffer: Buffer) => {
  const tensor = toTensorSync(buffer, {
    width: 224,
    height: 224,
    normalization: 'Imagenet',
    layout: 'Chw'
  });

  parentPort?.postMessage(tensor.toFloat32Array());
});

// main.ts
import { Worker } from 'worker_threads';

const worker = new Worker('./worker.ts');

function processInWorker(buffer: Buffer): Promise<Float32Array> {
  return new Promise((resolve) => {
    worker.once('message', resolve);
    worker.postMessage(buffer);
  });
}
```

## Error Handling

```typescript
import { toTensor } from 'imgkit';

async function safeToTensor(buffer: Buffer) {
  try {
    const tensor = await toTensor(buffer, {
      width: 224,
      height: 224,
      normalization: 'Imagenet',
      layout: 'Chw'
    });

    // Validate output
    if (tensor.shape[0] !== 3 || tensor.shape[1] !== 224) {
      throw new Error('Unexpected tensor shape');
    }

    return { success: true, tensor };

  } catch (error) {
    console.error('Tensor conversion failed:', error);
    return { success: false, error: error.message };
  }
}
```

## Next Steps

- [API Reference](/api/tensor) - Complete API documentation
- [ML Guide](/guide/tensor) - In-depth ML preprocessing guide
- [Performance](/guide/performance) - Optimization strategies
